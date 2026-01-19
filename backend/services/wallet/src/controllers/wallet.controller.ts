// backend/services/wallet/src/controllers/wallet.controller.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { kafka } from '../lib/kafka';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import crypto from 'crypto';

export class WalletController {
  /**
   * Get wallet balance
   */
  getBalance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;

      // Try cache first
      const cacheKey = `wallet:${userId}`;
      const cached = await redis.get(cacheKey);

      if (cached) {
        return res.json({
          success: true,
          data: { wallet: JSON.parse(cached) },
        });
      }

      let wallet = await prisma.wallet.findUnique({
        where: { userId },
      });

      // Create wallet if doesn't exist
      if (!wallet) {
        wallet = await prisma.wallet.create({
          data: {
            userId,
            balance: 0,
            currency: 'DZD',
          },
        });
      }

      // Cache for 5 minutes
      await redis.setex(cacheKey, 300, JSON.stringify(wallet));

      res.json({
        success: true,
        data: { wallet },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Top up wallet
   */
  topUp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { amount, paymentMethodId } = req.body;

      if (amount <= 0) {
        throw new AppError(400, 'INVALID_AMOUNT', 'Amount must be greater than 0');
      }

      // Create transaction in double-entry ledger
      const transaction = await prisma.$transaction(async (tx) => {
        // Get or create wallet
        let wallet = await tx.wallet.findUnique({
          where: { userId },
        });

        if (!wallet) {
          wallet = await tx.wallet.create({
            data: {
              userId,
              balance: 0,
              currency: 'DZD',
            },
          });
        }

        // Generate transaction ID
        const transactionId = `txn_${crypto.randomBytes(16).toString('hex')}`;

        // Credit wallet (DR: Wallet, CR: Payment Gateway)
        const newTransaction = await tx.walletTransaction.create({
          data: {
            id: transactionId,
            walletId: wallet.id,
            type: 'DEPOSIT',
            amount,
            balanceBefore: wallet.balance,
            balanceAfter: wallet.balance + amount,
            status: 'PENDING',
            description: 'Wallet top-up',
            metadata: { paymentMethodId },
          },
        });

        // Update wallet balance (will be confirmed after payment)
        // For now, keep pending
        
        return newTransaction;
      });

      // Initiate payment
      // This would integrate with Payment Service
      await kafka.send({
        topic: 'payment.events',
        messages: [{
          key: transaction.id,
          value: JSON.stringify({
            eventType: 'TOPUP_INITIATED',
            eventId: crypto.randomUUID(),
            timestamp: new Date(),
            data: {
              transactionId: transaction.id,
              userId,
              amount,
            },
          }),
        }],
      });

      logger.info('Wallet top-up initiated', {
        transactionId: transaction.id,
        userId,
        amount,
      });

      res.status(201).json({
        success: true,
        message: 'Top-up initiated',
        data: { transaction },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Withdraw from wallet
   */
  withdraw = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { amount, bankAccountId } = req.body;

      if (amount <= 0) {
        throw new AppError(400, 'INVALID_AMOUNT', 'Amount must be greater than 0');
      }

      const transaction = await prisma.$transaction(async (tx) => {
        // Get wallet
        const wallet = await tx.wallet.findUnique({
          where: { userId },
        });

        if (!wallet) {
          throw new AppError(404, 'WALLET_NOT_FOUND', 'Wallet not found');
        }

        // Check sufficient balance
        if (wallet.balance < amount) {
          throw new AppError(400, 'INSUFFICIENT_BALANCE', 'Insufficient wallet balance');
        }

        // Generate transaction ID
        const transactionId = `txn_${crypto.randomBytes(16).toString('hex')}`;

        // Debit wallet
        const newTransaction = await tx.walletTransaction.create({
          data: {
            id: transactionId,
            walletId: wallet.id,
            type: 'WITHDRAWAL',
            amount: -amount,
            balanceBefore: wallet.balance,
            balanceAfter: wallet.balance - amount,
            status: 'PENDING',
            description: 'Wallet withdrawal',
            metadata: { bankAccountId },
          },
        });

        // Update wallet balance
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: wallet.balance - amount,
          },
        });

        // Invalidate cache
        await redis.del(`wallet:${userId}`);

        return newTransaction;
      });

      // Publish event
      await kafka.send({
        topic: 'wallet.events',
        messages: [{
          key: transaction.id,
          value: JSON.stringify({
            eventType: 'WITHDRAWAL_INITIATED',
            eventId: crypto.randomUUID(),
            timestamp: new Date(),
            data: {
              transactionId: transaction.id,
              userId,
              amount,
            },
          }),
        }],
      });

      logger.info('Withdrawal initiated', {
        transactionId: transaction.id,
        userId,
        amount,
      });

      res.json({
        success: true,
        message: 'Withdrawal initiated',
        data: { transaction },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Transfer to another user (P2P)
   */
  transfer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fromUserId = req.user!.userId;
      const { toUserId, amount, description } = req.body;

      if (amount <= 0) {
        throw new AppError(400, 'INVALID_AMOUNT', 'Amount must be greater than 0');
      }

      if (fromUserId === toUserId) {
        throw new AppError(400, 'INVALID_TRANSFER', 'Cannot transfer to yourself');
      }

      const result = await prisma.$transaction(async (tx) => {
        // Get sender wallet
        const fromWallet = await tx.wallet.findUnique({
          where: { userId: fromUserId },
        });

        if (!fromWallet) {
          throw new AppError(404, 'WALLET_NOT_FOUND', 'Your wallet not found');
        }

        if (fromWallet.balance < amount) {
          throw new AppError(400, 'INSUFFICIENT_BALANCE', 'Insufficient balance');
        }

        // Get or create recipient wallet
        let toWallet = await tx.wallet.findUnique({
          where: { userId: toUserId },
        });

        if (!toWallet) {
          toWallet = await tx.wallet.create({
            data: {
              userId: toUserId,
              balance: 0,
              currency: 'DZD',
            },
          });
        }

        const transferId = `txn_${crypto.randomBytes(16).toString('hex')}`;

        // Debit sender
        const debitTxn = await tx.walletTransaction.create({
          data: {
            id: `${transferId}_debit`,
            walletId: fromWallet.id,
            type: 'TRANSFER_OUT',
            amount: -amount,
            balanceBefore: fromWallet.balance,
            balanceAfter: fromWallet.balance - amount,
            status: 'COMPLETED',
            description: description || 'P2P Transfer',
            metadata: {
              transferId,
              recipientUserId: toUserId,
            },
          },
        });

        // Credit recipient
        const creditTxn = await tx.walletTransaction.create({
          data: {
            id: `${transferId}_credit`,
            walletId: toWallet.id,
            type: 'TRANSFER_IN',
            amount,
            balanceBefore: toWallet.balance,
            balanceAfter: toWallet.balance + amount,
            status: 'COMPLETED',
            description: description || 'P2P Transfer',
            metadata: {
              transferId,
              senderUserId: fromUserId,
            },
          },
        });

        // Update balances
        await tx.wallet.update({
          where: { id: fromWallet.id },
          data: { balance: fromWallet.balance - amount },
        });

        await tx.wallet.update({
          where: { id: toWallet.id },
          data: { balance: toWallet.balance + amount },
        });

        // Invalidate caches
        await redis.del(`wallet:${fromUserId}`);
        await redis.del(`wallet:${toUserId}`);

        return { transferId, debitTxn, creditTxn };
      });

      // Publish event
      await kafka.send({
        topic: 'wallet.events',
        messages: [{
          key: result.transferId,
          value: JSON.stringify({
            eventType: 'TRANSFER_COMPLETED',
            eventId: crypto.randomUUID(),
            timestamp: new Date(),
            data: {
              transferId: result.transferId,
              fromUserId,
              toUserId,
              amount,
            },
          }),
        }],
      });

      logger.info('Transfer completed', {
        transferId: result.transferId,
        fromUserId,
        toUserId,
        amount,
      });

      res.json({
        success: true,
        message: 'Transfer completed successfully',
        data: {
          transferId: result.transferId,
          amount,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get transaction history
   */
  getTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const {
        type,
        status,
        startDate,
        endDate,
        page = 1,
        limit = 50,
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      // Get wallet
      const wallet = await prisma.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        return res.json({
          success: true,
          data: {
            transactions: [],
            pagination: {
              page: Number(page),
              limit: Number(limit),
              total: 0,
              totalPages: 0,
            },
          },
        });
      }

      const where: any = { walletId: wallet.id };

      if (type) where.type = type;
      if (status) where.status = status;

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate as string);
        if (endDate) where.createdAt.lte = new Date(endDate as string);
      }

      const [transactions, total] = await Promise.all([
        prisma.walletTransaction.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.walletTransaction.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          transactions,
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

  /**
   * Confirm payment (webhook handler)
   */
  confirmPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { transactionId, status, paymentId } = req.body;

      await prisma.$transaction(async (tx) => {
        const transaction = await tx.walletTransaction.findUnique({
          where: { id: transactionId },
          include: { wallet: true },
        });

        if (!transaction) {
          throw new AppError(404, 'TRANSACTION_NOT_FOUND', 'Transaction not found');
        }

        if (status === 'COMPLETED') {
          // Update transaction status
          await tx.walletTransaction.update({
            where: { id: transactionId },
            data: {
              status: 'COMPLETED',
              metadata: {
                ...transaction.metadata,
                paymentId,
              },
            },
          });

          // Update wallet balance
          await tx.wallet.update({
            where: { id: transaction.walletId },
            data: {
              balance: transaction.balanceAfter,
            },
          });

          // Invalidate cache
          await redis.del(`wallet:${transaction.wallet.userId}`);
        } else {
          // Payment failed
          await tx.walletTransaction.update({
            where: { id: transactionId },
            data: { status: 'FAILED' },
          });
        }
      });

      // Publish event
      await kafka.send({
        topic: 'wallet.events',
        messages: [{
          key: transactionId,
          value: JSON.stringify({
            eventType: status === 'COMPLETED' ? 'TOPUP_COMPLETED' : 'TOPUP_FAILED',
            eventId: crypto.randomUUID(),
            timestamp: new Date(),
            data: { transactionId, status },
          }),
        }],
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  };
}