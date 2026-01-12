// backend/services/payment/src/controllers/payment.controller.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { kafka } from '../lib/kafka';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { ChargilyService } from '../services/chargily.service';
import crypto from 'crypto';

export class PaymentController {
  private chargilyService: ChargilyService;

  constructor() {
    this.chargilyService = new ChargilyService();
  }

  /**
   * Create payment intent
   */
  createPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const {
        amount,
        currency = 'DZD',
        description,
        metadata,
        returnUrl,
        cancelUrl,
      } = req.body;

      // Validate amount
      if (amount <= 0) {
        throw new AppError(400, 'INVALID_AMOUNT', 'Amount must be greater than 0');
      }

      // Create payment record
      const payment = await prisma.$transaction(async (tx) => {
        // Generate unique payment ID
        const paymentId = `pay_${crypto.randomBytes(16).toString('hex')}`;

        // Create payment intent
        const chargilyPayment = await this.chargilyService.createCheckout({
          amount,
          currency,
          success_url: returnUrl,
          failure_url: cancelUrl,
          metadata: {
            ...metadata,
            paymentId,
            userId,
          },
        });

        // Store payment in database (Event Sourcing)
        const newPayment = await tx.payment.create({
          data: {
            id: paymentId,
            userId,
            amount,
            currency,
            status: 'PENDING',
            provider: 'CHARGILY',
            providerPaymentId: chargilyPayment.id,
            description,
            metadata,
          },
        });

        // Create payment event
        await tx.paymentEvent.create({
          data: {
            paymentId: newPayment.id,
            eventType: 'PAYMENT_INITIATED',
            status: 'PENDING',
            amount,
            metadata: {
              checkoutUrl: chargilyPayment.checkout_url,
            },
          },
        });

        return {
          payment: newPayment,
          checkoutUrl: chargilyPayment.checkout_url,
        };
      });

      // Publish event
      await kafka.send({
        topic: 'payment.events',
        messages: [{
          key: payment.payment.id,
          value: JSON.stringify({
            eventType: 'PAYMENT_INITIATED',
            eventId: crypto.randomUUID(),
            timestamp: new Date(),
            data: {
              paymentId: payment.payment.id,
              userId,
              amount,
              currency,
            },
          }),
        }],
      });

      logger.info('Payment created', {
        paymentId: payment.payment.id,
        userId,
        amount,
      });

      res.status(201).json({
        success: true,
        message: 'Payment created successfully',
        data: {
          paymentId: payment.payment.id,
          checkoutUrl: payment.checkoutUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get payment by ID
   */
  getPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const payment = await prisma.payment.findFirst({
        where: {
          id,
          userId,
        },
        include: {
          events: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!payment) {
        throw new AppError(404, 'PAYMENT_NOT_FOUND', 'Payment not found');
      }

      res.json({
        success: true,
        data: { payment },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handle webhook from Chargily
   */
  handleWebhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const signature = req.headers['x-chargily-signature'] as string;
      const payload = req.body;

      // Verify webhook signature
      if (!this.chargilyService.verifyWebhookSignature(payload, signature)) {
        throw new AppError(401, 'INVALID_SIGNATURE', 'Invalid webhook signature');
      }

      const { event, data } = payload;

      // Handle different event types
      switch (event) {
        case 'checkout.paid':
          await this.handlePaymentSuccess(data);
          break;

        case 'checkout.failed':
          await this.handlePaymentFailed(data);
          break;

        case 'checkout.expired':
          await this.handlePaymentExpired(data);
          break;

        default:
          logger.warn('Unknown webhook event', { event });
      }

      res.json({ received: true });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Process refund
   */
  processRefund = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const { amount, reason } = req.body;

      const refund = await prisma.$transaction(async (tx) => {
        // Get original payment
        const payment = await tx.payment.findFirst({
          where: {
            id,
            userId,
          },
        });

        if (!payment) {
          throw new AppError(404, 'PAYMENT_NOT_FOUND', 'Payment not found');
        }

        if (payment.status !== 'COMPLETED') {
          throw new AppError(400, 'PAYMENT_NOT_COMPLETED', 'Payment not completed');
        }

        // Validate refund amount
        const refundAmount = amount || payment.amount;
        if (refundAmount > payment.amount) {
          throw new AppError(400, 'INVALID_AMOUNT', 'Refund amount exceeds payment amount');
        }

        // Process refund with Chargily
        let providerRefund;
        try {
          providerRefund = await this.chargilyService.createRefund({
            payment_id: payment.providerPaymentId,
            amount: refundAmount,
            reason,
          });
        } catch (error: any) {
          throw new AppError(500, 'REFUND_FAILED', error.message);
        }

        // Create refund record
        const newRefund = await tx.refund.create({
          data: {
            paymentId: payment.id,
            amount: refundAmount,
            status: 'PENDING',
            provider: 'CHARGILY',
            providerRefundId: providerRefund.id,
            reason,
          },
        });

        // Create payment event
        await tx.paymentEvent.create({
          data: {
            paymentId: payment.id,
            eventType: 'REFUND_INITIATED',
            status: 'PENDING',
            amount: refundAmount,
            metadata: { refundId: newRefund.id },
          },
        });

        // Update payment status
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: 'REFUNDED' },
        });

        return newRefund;
      });

      // Publish event
      await kafka.send({
        topic: 'payment.events',
        messages: [{
          key: id,
          value: JSON.stringify({
            eventType: 'REFUND_INITIATED',
            eventId: crypto.randomUUID(),
            timestamp: new Date(),
            data: {
              paymentId: id,
              refundId: refund.id,
              amount: refund.amount,
            },
          }),
        }],
      });

      logger.info('Refund initiated', {
        paymentId: id,
        refundId: refund.id,
        amount: refund.amount,
      });

      res.json({
        success: true,
        message: 'Refund initiated successfully',
        data: { refund },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get payment methods
   */
  getPaymentMethods = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;

      const methods = await prisma.paymentMethod.findMany({
        where: {
          userId,
          isActive: true,
        },
        select: {
          id: true,
          type: true,
          provider: true,
          last4: true,
          expiryMonth: true,
          expiryYear: true,
          isDefault: true,
          createdAt: true,
        },
      });

      res.json({
        success: true,
        data: { methods },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get payment history
   */
  getPaymentHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const {
        status,
        startDate,
        endDate,
        page = 1,
        limit = 50,
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const where: any = { userId };

      if (status) where.status = status;

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate as string);
        if (endDate) where.createdAt.lte = new Date(endDate as string);
      }

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.payment.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          payments,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async handlePaymentSuccess(data: any): Promise<void> {
    const { id: providerPaymentId, metadata } = data;
    const { paymentId, userId } = metadata;

    try {
      await prisma.$transaction(async (tx) => {
        // Update payment status
        await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });

        // Create success event
        await tx.paymentEvent.create({
          data: {
            paymentId,
            eventType: 'PAYMENT_COMPLETED',
            status: 'COMPLETED',
            amount: data.amount,
            metadata: data,
          },
        });
      });

      // Publish event
      await kafka.send({
        topic: 'payment.events',
        messages: [{
          key: paymentId,
          value: JSON.stringify({
            eventType: 'PAYMENT_COMPLETED',
            eventId: crypto.randomUUID(),
            timestamp: new Date(),
            data: {
              paymentId,
              userId,
              amount: data.amount,
            },
          }),
        }],
      });

      logger.info('Payment completed', { paymentId, userId });
    } catch (error) {
      logger.error('Failed to handle payment success', { error, paymentId });
    }
  }

  private async handlePaymentFailed(data: any): Promise<void> {
    const { metadata } = data;
    const { paymentId } = metadata;

    try {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: paymentId },
          data: { status: 'FAILED' },
        });

        await tx.paymentEvent.create({
          data: {
            paymentId,
            eventType: 'PAYMENT_FAILED',
            status: 'FAILED',
            amount: data.amount,
            metadata: data,
          },
        });
      });

      // Publish event
      await kafka.send({
        topic: 'payment.events',
        messages: [{
          key: paymentId,
          value: JSON.stringify({
            eventType: 'PAYMENT_FAILED',
            eventId: crypto.randomUUID(),
            timestamp: new Date(),
            data: { paymentId },
          }),
        }],
      });

      logger.warn('Payment failed', { paymentId });
    } catch (error) {
      logger.error('Failed to handle payment failure', { error, paymentId });
    }
  }

  private async handlePaymentExpired(data: any): Promise<void> {
    const { metadata } = data;
    const { paymentId } = metadata;

    try {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: paymentId },
          data: { status: 'EXPIRED' },
        });

        await tx.paymentEvent.create({
          data: {
            paymentId,
            eventType: 'PAYMENT_EXPIRED',
            status: 'EXPIRED',
            amount: data.amount,
            metadata: data,
          },
        });
      });

      logger.warn('Payment expired', { paymentId });
    } catch (error) {
      logger.error('Failed to handle payment expiration', { error, paymentId });
    }
  }
}

// ============================================================================
// CHARGILY SERVICE
// ============================================================================
// backend/services/payment/src/services/chargily.service.ts

import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import { config } from '../config';

export class ChargilyService {
  private client: AxiosInstance;
  private apiKey: string;
  private secretKey: string;

  constructor() {
    this.apiKey = config.chargily.apiKey;
    this.secretKey = config.chargily.secretKey;

    this.client = axios.create({
      baseURL: config.chargily.mode === 'test'
        ? 'https://pay.chargily.net/test/api/v2'
        : 'https://pay.chargily.net/api/v2',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Create checkout session
   */
  async createCheckout(data: {
    amount: number;
    currency: string;
    success_url: string;
    failure_url: string;
    metadata?: any;
  }) {
    try {
      const response = await this.client.post('/checkouts', {
        amount: data.amount * 100, // Convert to cents
        currency: data.currency,
        success_url: data.success_url,
        failure_url: data.failure_url,
        webhook_url: `${config.apiUrl}/webhooks/chargily`,
        metadata: data.metadata,
      });

      return response.data;
    } catch (error: any) {
      logger.error('Chargily checkout creation failed', {
        error: error.response?.data || error.message,
      });
      throw new Error('Failed to create checkout session');
    }
  }

  /**
   * Create refund
   */
  async createRefund(data: {
    payment_id: string;
    amount: number;
    reason?: string;
  }) {
    try {
      const response = await this.client.post('/refunds', {
        payment_id: data.payment_id,
        amount: data.amount * 100, // Convert to cents
        reason: data.reason,
      });

      return response.data;
    } catch (error: any) {
      logger.error('Chargily refund creation failed', {
        error: error.response?.data || error.message,
      });
      throw new Error('Failed to create refund');
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: any, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', this.secretKey)
      .update(JSON.stringify(payload))
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Get payment details
   */
  async getPayment(paymentId: string) {
    try {
      const response = await this.client.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error: any) {
      logger.error('Failed to get payment details', {
        error: error.response?.data || error.message,
        paymentId,
      });
      throw new Error('Failed to get payment details');
    }
  }
}