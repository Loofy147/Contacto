
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