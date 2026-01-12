// backend/services/sales/src/controllers/sales.controller.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { kafka } from '../lib/kafka';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { generateReceiptNumber } from '../utils/receipt';
import { calculateTax, calculateDiscount } from '../utils/calculations';

export class SalesController {
  /**
   * Create new sale/transaction
   */
  createSale = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const merchantId = req.user!.userId;
      const {
        customerId,
        items,
        discounts,
        paymentMethod,
        notes,
        deviceId,
        location,
      } = req.body;

      // Validate items
      if (!items || items.length === 0) {
        throw new AppError(400, 'INVALID_ITEMS', 'At least one item is required');
      }

      const sale = await prisma.$transaction(async (tx) => {
        // 1. Calculate totals
        let subtotal = 0;
        const processedItems = [];

        for (const item of items) {
          const product = await tx.product.findFirst({
            where: {
              id: item.productId,
              merchantId,
              deletedAt: null,
            },
          });

          if (!product) {
            throw new AppError(404, 'PRODUCT_NOT_FOUND', `Product ${item.productId} not found`);
          }

          // Check stock availability
          const availableStock = product.currentStock - product.reservedStock;
          if (availableStock < item.quantity) {
            throw new AppError(
              400,
              'INSUFFICIENT_STOCK',
              `Insufficient stock for ${product.name}`
            );
          }

          const itemPrice = item.price || product.sellingPrice;
          const itemSubtotal = Number(itemPrice) * item.quantity;
          const itemDiscount = item.discount || 0;
          const itemTotal = itemSubtotal - itemDiscount;

          subtotal += itemTotal;

          processedItems.push({
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            quantity: item.quantity,
            unitPrice: itemPrice,
            discount: itemDiscount,
            subtotal: itemTotal,
            taxRate: product.taxRate,
          });
        }

        // 2. Apply discounts
        const totalDiscount = discounts?.reduce((sum: number, d: any) => {
          if (d.type === 'percentage') {
            return sum + (subtotal * d.value / 100);
          }
          return sum + d.value;
        }, 0) || 0;

        const afterDiscount = subtotal - totalDiscount;

        // 3. Calculate tax (TVA 19%)
        const taxAmount = calculateTax(afterDiscount, 19);
        const totalAmount = afterDiscount + taxAmount;

        // 4. Generate receipt number
        const receiptNumber = await generateReceiptNumber(merchantId, tx);

        // 5. Create sale record
        const newSale = await tx.sale.create({
          data: {
            merchantId,
            customerId,
            receiptNumber,
            subtotal,
            discountAmount: totalDiscount,
            taxAmount,
            totalAmount,
            paymentMethod,
            paymentStatus: 'COMPLETED',
            items: processedItems,
            notes,
            deviceId,
            location: location ? { lat: location.lat, lng: location.lng } : null,
            completedAt: new Date(),
          },
        });

        // 6. Update inventory (commit stock)
        for (const item of processedItems) {
          // Reduce stock
          await tx.product.update({
            where: { id: item.productId },
            data: {
              currentStock: {
                decrement: item.quantity,
              },
            },
          });

          // Record stock movement
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              merchantId,
              movementType: 'OUT',
              quantity: item.quantity,
              referenceType: 'sale',
              referenceId: newSale.id,
              performedBy: req.user!.userId,
            },
          });
        }

        // 7. Update customer stats (if customer exists)
        if (customerId) {
          await tx.customer.update({
            where: { id: customerId },
            data: {
              totalPurchases: { increment: totalAmount },
              totalTransactions: { increment: 1 },
              lastPurchaseAt: new Date(),
            },
          });
        }

        return newSale;
      });

      // Publish event
      await kafka.send({
        topic: 'sales.events',
        messages: [{
          key: sale.id,
          value: JSON.stringify({
            eventType: 'SALE_COMPLETED',
            eventId: crypto.randomUUID(),
            timestamp: new Date(),
            data: {
              saleId: sale.id,
              merchantId,
              totalAmount: sale.totalAmount,
              paymentMethod: sale.paymentMethod,
              itemCount: items.length,
            },
          }),
        }],
      });

      logger.info('Sale created', {
        saleId: sale.id,
        merchantId,
        totalAmount: sale.totalAmount,
      });

      res.status(201).json({
        success: true,
        message: 'Sale completed successfully',
        data: { sale },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get sale by ID
   */
  getSale = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const merchantId = req.user!.userId;

      const sale = await prisma.sale.findFirst({
        where: {
          id,
          merchantId,
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      if (!sale) {
        throw new AppError(404, 'SALE_NOT_FOUND', 'Sale not found');
      }

      res.json({
        success: true,
        data: { sale },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get sales history
   */
  getSales = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const merchantId = req.user!.userId;
      const {
        startDate,
        endDate,
        paymentMethod,
        paymentStatus,
        customerId,
        page = 1,
        limit = 50,
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      // Build where clause
      const where: any = { merchantId };

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate as string);
        if (endDate) where.createdAt.lte = new Date(endDate as string);
      }

      if (paymentMethod) where.paymentMethod = paymentMethod;
      if (paymentStatus) where.paymentStatus = paymentStatus;
      if (customerId) where.customerId = customerId;

      const [sales, total, stats] = await Promise.all([
        prisma.sale.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            customer: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        }),
        prisma.sale.count({ where }),
        prisma.sale.aggregate({
          where,
          _sum: {
            totalAmount: true,
            taxAmount: true,
            discountAmount: true,
          },
          _count: true,
        }),
      ]);

      res.json({
        success: true,
        data: {
          sales,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
          },
          stats: {
            totalRevenue: stats._sum.totalAmount || 0,
            totalTax: stats._sum.taxAmount || 0,
            totalDiscount: stats._sum.discountAmount || 0,
            transactionCount: stats._count,
          },
        },
      });
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
      const merchantId = req.user!.userId;
      const { items, reason, notes } = req.body;

      const refund = await prisma.$transaction(async (tx) => {
        // Get original sale
        const sale = await tx.sale.findFirst({
          where: {
            id,
            merchantId,
          },
        });

        if (!sale) {
          throw new AppError(404, 'SALE_NOT_FOUND', 'Sale not found');
        }

        if (sale.paymentStatus === 'REFUNDED') {
          throw new AppError(400, 'ALREADY_REFUNDED', 'Sale already refunded');
        }

        // Calculate refund amount
        let refundAmount = 0;
        const refundItems = [];

        for (const refundItem of items) {
          const originalItem = (sale.items as any[]).find(
            (i: any) => i.productId === refundItem.productId
          );

          if (!originalItem) {
            throw new AppError(400, 'ITEM_NOT_FOUND', 'Item not found in original sale');
          }

          if (refundItem.quantity > originalItem.quantity) {
            throw new AppError(400, 'INVALID_QUANTITY', 'Refund quantity exceeds original');
          }

          const itemRefundAmount = (originalItem.subtotal / originalItem.quantity) * refundItem.quantity;
          refundAmount += itemRefundAmount;

          refundItems.push({
            productId: refundItem.productId,
            quantity: refundItem.quantity,
            refundAmount: itemRefundAmount,
          });

          // Return stock
          await tx.product.update({
            where: { id: refundItem.productId },
            data: {
              currentStock: { increment: refundItem.quantity },
            },
          });

          // Record stock movement
          await tx.stockMovement.create({
            data: {
              productId: refundItem.productId,
              merchantId,
              movementType: 'IN',
              quantity: refundItem.quantity,
              referenceType: 'refund',
              referenceId: id,
              notes: `Refund for sale ${sale.receiptNumber}`,
              performedBy: req.user!.userId,
            },
          });
        }

        // Create refund record
        const newRefund = await tx.refund.create({
          data: {
            saleId: id,
            merchantId,
            amount: refundAmount,
            items: refundItems,
            reason,
            notes,
            processedBy: req.user!.userId,
          },
        });

        // Update sale status
        await tx.sale.update({
          where: { id },
          data: {
            paymentStatus: 'REFUNDED',
            refundedAt: new Date(),
          },
        });

        return newRefund;
      });

      // Publish event
      await kafka.send({
        topic: 'sales.events',
        messages: [{
          key: id,
          value: JSON.stringify({
            eventType: 'SALE_REFUNDED',
            eventId: crypto.randomUUID(),
            timestamp: new Date(),
            data: {
              saleId: id,
              refundId: refund.id,
              merchantId,
              refundAmount: refund.amount,
            },
          }),
        }],
      });

      logger.info('Refund processed', {
        saleId: id,
        refundId: refund.id,
        merchantId,
      });

      res.json({
        success: true,
        message: 'Refund processed successfully',
        data: { refund },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get daily sales report
   */
  getDailyReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const merchantId = req.user!.userId;
      const { date } = req.query;

      const targetDate = date ? new Date(date as string) : new Date();
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      const [sales, summary] = await Promise.all([
        prisma.sale.findMany({
          where: {
            merchantId,
            createdAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
          orderBy: { createdAt: 'asc' },
        }),
        prisma.sale.groupBy({
          by: ['paymentMethod'],
          where: {
            merchantId,
            createdAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
            paymentStatus: 'COMPLETED',
          },
          _sum: {
            totalAmount: true,
            taxAmount: true,
          },
          _count: true,
        }),
      ]);

      // Calculate hourly breakdown
      const hourlyBreakdown = new Array(24).fill(0).map(() => ({
        revenue: 0,
        transactions: 0,
      }));

      sales.forEach((sale) => {
        const hour = new Date(sale.createdAt).getHours();
        hourlyBreakdown[hour].revenue += Number(sale.totalAmount);
        hourlyBreakdown[hour].transactions += 1;
      });

      // Top products
      const productSales = new Map();
      sales.forEach((sale) => {
        (sale.items as any[]).forEach((item: any) => {
          const existing = productSales.get(item.productId) || {
            productId: item.productId,
            productName: item.productName,
            quantity: 0,
            revenue: 0,
          };
          existing.quantity += item.quantity;
          existing.revenue += item.subtotal;
          productSales.set(item.productId, existing);
        });
      });

      const topProducts = Array.from(productSales.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      res.json({
        success: true,
        data: {
          date: startOfDay,
          summary: {
            totalRevenue: summary.reduce((sum, s) => sum + Number(s._sum.totalAmount || 0), 0),
            totalTax: summary.reduce((sum, s) => sum + Number(s._sum.taxAmount || 0), 0),
            totalTransactions: summary.reduce((sum, s) => sum + s._count, 0),
            byPaymentMethod: summary.map((s) => ({
              method: s.paymentMethod,
              revenue: s._sum.totalAmount,
              count: s._count,
            })),
          },
          hourlyBreakdown,
          topProducts,
          sales,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * End of day reconciliation
   */
  endOfDay = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const merchantId = req.user!.userId;
      const { date, cashCount, notes } = req.body;

      const targetDate = date ? new Date(date) : new Date();
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      // Get day's sales
      const daySales = await prisma.sale.aggregate({
        where: {
          merchantId,
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
          paymentMethod: 'CASH',
          paymentStatus: 'COMPLETED',
        },
        _sum: { totalAmount: true },
        _count: true,
      });

      const expectedCash = Number(daySales._sum.totalAmount || 0);
      const actualCash = Number(cashCount);
      const variance = actualCash - expectedCash;

      // Create reconciliation record
      const reconciliation = await prisma.dayEndReconciliation.create({
        data: {
          merchantId,
          date: startOfDay,
          expectedCash,
          actualCash,
          variance,
          notes,
          performedBy: req.user!.userId,
        },
      });

      // Publish event
      await kafka.send({
        topic: 'sales.events',
        messages: [{
          key: reconciliation.id,
          value: JSON.stringify({
            eventType: 'DAY_END_COMPLETED',
            eventId: crypto.randomUUID(),
            timestamp: new Date(),
            data: {
              merchantId,
              date: startOfDay,
              expectedCash,
              actualCash,
              variance,
            },
          }),
        }],
      });

      res.json({
        success: true,
        message: 'Day end reconciliation completed',
        data: { reconciliation },
      });
    } catch (error) {
      next(error);
    }
  };
}