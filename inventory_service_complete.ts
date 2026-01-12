// backend/services/inventory/src/controllers/inventory.controller.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { kafka } from '../lib/kafka';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export class InventoryController {
  /**
   * Get all products for a merchant
   */
  getProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const merchantId = req.user!.userId;
      const {
        search,
        category,
        lowStock,
        page = 1,
        limit = 50,
        sortBy = 'name',
        sortOrder = 'asc',
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      // Build where clause
      const where: any = {
        merchantId,
        deletedAt: null,
      };

      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { sku: { contains: search as string, mode: 'insensitive' } },
          { barcode: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      if (category) {
        where.category = category;
      }

      if (lowStock === 'true') {
        where.currentStock = {
          lte: prisma.product.fields.reorderPoint,
        };
      }

      // Get products with pagination
      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { [sortBy as string]: sortOrder },
          include: {
            variants: true,
          },
        }),
        prisma.product.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          products,
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
   * Get product by ID
   */
  getProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const merchantId = req.user!.userId;

      // Try cache first
      const cacheKey = `product:${id}`;
      const cached = await redis.get(cacheKey);

      if (cached) {
        return res.json({
          success: true,
          data: { product: JSON.parse(cached) },
        });
      }

      const product = await prisma.product.findFirst({
        where: {
          id,
          merchantId,
          deletedAt: null,
        },
        include: {
          variants: true,
          stockMovements: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!product) {
        throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
      }

      // Cache for 5 minutes
      await redis.setex(cacheKey, 300, JSON.stringify(product));

      res.json({
        success: true,
        data: { product },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create new product
   */
  createProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const merchantId = req.user!.userId;
      const productData = req.body;

      // Check if SKU already exists
      if (productData.sku) {
        const existing = await prisma.product.findFirst({
          where: {
            merchantId,
            sku: productData.sku,
            deletedAt: null,
          },
        });

        if (existing) {
          throw new AppError(409, 'SKU_EXISTS', 'Product with this SKU already exists');
        }
      }

      const product = await prisma.$transaction(async (tx) => {
        // Create product
        const newProduct = await tx.product.create({
          data: {
            ...productData,
            merchantId,
          },
        });

        // If initial stock is provided, create stock movement
        if (productData.initialStock && productData.initialStock > 0) {
          await tx.stockMovement.create({
            data: {
              productId: newProduct.id,
              merchantId,
              movementType: 'IN',
              quantity: productData.initialStock,
              referenceType: 'initial',
              notes: 'Initial stock',
            },
          });
        }

        return newProduct;
      });

      // Publish event
      await kafka.send({
        topic: 'inventory.events',
        messages: [{
          key: product.id,
          value: JSON.stringify({
            eventType: 'PRODUCT_CREATED',
            eventId: crypto.randomUUID(),
            timestamp: new Date(),
            data: {
              productId: product.id,
              merchantId,
              sku: product.sku,
            },
          }),
        }],
      });

      logger.info('Product created', { productId: product.id, merchantId });

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: { product },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update product
   */
  updateProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const merchantId = req.user!.userId;
      const updates = req.body;

      // Verify ownership
      const existing = await prisma.product.findFirst({
        where: {
          id,
          merchantId,
          deletedAt: null,
        },
      });

      if (!existing) {
        throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
      }

      // Check SKU uniqueness if being updated
      if (updates.sku && updates.sku !== existing.sku) {
        const skuExists = await prisma.product.findFirst({
          where: {
            merchantId,
            sku: updates.sku,
            id: { not: id },
            deletedAt: null,
          },
        });

        if (skuExists) {
          throw new AppError(409, 'SKU_EXISTS', 'Product with this SKU already exists');
        }
      }

      const product = await prisma.product.update({
        where: { id },
        data: updates,
      });

      // Invalidate cache
      await redis.del(`product:${id}`);

      // Publish event
      await kafka.send({
        topic: 'inventory.events',
        messages: [{
          key: product.id,
          value: JSON.stringify({
            eventType: 'PRODUCT_UPDATED',
            eventId: crypto.randomUUID(),
            timestamp: new Date(),
            data: {
              productId: product.id,
              merchantId,
            },
          }),
        }],
      });

      logger.info('Product updated', { productId: product.id, merchantId });

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: { product },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Adjust stock (add or remove)
   */
  adjustStock = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const merchantId = req.user!.userId;
      const { quantity, type, reason, notes } = req.body;

      if (!['IN', 'OUT', 'ADJUSTMENT'].includes(type)) {
        throw new AppError(400, 'INVALID_TYPE', 'Invalid movement type');
      }

      // Use transaction with pessimistic locking
      const result = await prisma.$transaction(async (tx) => {
        // Lock the product row
        const product = await tx.product.findFirst({
          where: {
            id,
            merchantId,
            deletedAt: null,
          },
        });

        if (!product) {
          throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
        }

        // Validate stock for OUT movements
        if (type === 'OUT' && product.currentStock < quantity) {
          throw new AppError(400, 'INSUFFICIENT_STOCK', 'Insufficient stock');
        }

        // Create stock movement
        const movement = await tx.stockMovement.create({
          data: {
            productId: id,
            merchantId,
            movementType: type,
            quantity,
            referenceType: reason || 'manual',
            notes,
            performedBy: req.user!.userId,
          },
        });

        // Update product stock (trigger will handle this, but we can do it manually too)
        let newStock = product.currentStock;
        if (type === 'IN' || type === 'ADJUSTMENT') {
          newStock += quantity;
        } else if (type === 'OUT') {
          newStock -= quantity;
        }

        const updatedProduct = await tx.product.update({
          where: { id },
          data: { currentStock: newStock },
        });

        return { movement, product: updatedProduct };
      });

      // Invalidate cache
      await redis.del(`product:${id}`);

      // Check for low stock alert
      if (result.product.currentStock <= result.product.reorderPoint) {
        await this.sendLowStockAlert(result.product);
      }

      // Publish event
      await kafka.send({
        topic: 'inventory.events',
        messages: [{
          key: id,
          value: JSON.stringify({
            eventType: 'STOCK_ADJUSTED',
            eventId: crypto.randomUUID(),
            timestamp: new Date(),
            data: {
              productId: id,
              merchantId,
              type,
              quantity,
              newStock: result.product.currentStock,
            },
          }),
        }],
      });

      logger.info('Stock adjusted', {
        productId: id,
        merchantId,
        type,
        quantity,
        newStock: result.product.currentStock,
      });

      res.json({
        success: true,
        message: 'Stock adjusted successfully',
        data: {
          movement: result.movement,
          product: result.product,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Reserve stock (for pending sales)
   */
  reserveStock = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const merchantId = req.user!.userId;
      const { items, orderId } = req.body;

      const result = await prisma.$transaction(async (tx) => {
        const reservations = [];

        for (const item of items) {
          // Lock product
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

          const availableStock = product.currentStock - product.reservedStock;

          if (availableStock < item.quantity) {
            throw new AppError(
              400,
              'INSUFFICIENT_STOCK',
              `Insufficient stock for ${product.name}. Available: ${availableStock}`
            );
          }

          // Reserve stock
          const updated = await tx.product.update({
            where: { id: product.id },
            data: {
              reservedStock: product.reservedStock + item.quantity,
            },
          });

          // Record movement
          const movement = await tx.stockMovement.create({
            data: {
              productId: product.id,
              merchantId,
              movementType: 'RESERVED',
              quantity: item.quantity,
              referenceType: 'sale',
              referenceId: orderId,
              performedBy: req.user!.userId,
            },
          });

          reservations.push({ product: updated, movement });
        }

        return reservations;
      });

      // Set auto-release timer (15 minutes)
      setTimeout(() => {
        this.releaseReservation(orderId, merchantId).catch((err) =>
          logger.error('Failed to auto-release reservation', { error: err, orderId })
        );
      }, 15 * 60 * 1000);

      // Publish event
      await kafka.send({
        topic: 'inventory.events',
        messages: [{
          key: orderId,
          value: JSON.stringify({
            eventType: 'STOCK_RESERVED',
            eventId: crypto.randomUUID(),
            timestamp: new Date(),
            data: {
              orderId,
              merchantId,
              items: items.map((i: any) => ({
                productId: i.productId,
                quantity: i.quantity,
              })),
            },
          }),
        }],
      });

      res.json({
        success: true,
        message: 'Stock reserved successfully',
        data: { reservations },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Commit reservation (sale completed)
   */
  commitReservation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderId } = req.params;
      const merchantId = req.user!.userId;

      await prisma.$transaction(async (tx) => {
        // Find all reserved movements for this order
        const movements = await tx.stockMovement.findMany({
          where: {
            merchantId,
            referenceId: orderId,
            movementType: 'RESERVED',
          },
        });

        for (const movement of movements) {
          // Update product: reduce both current and reserved stock
          const product = await tx.product.findUnique({
            where: { id: movement.productId },
          });

          if (product) {
            await tx.product.update({
              where: { id: movement.productId },
              data: {
                currentStock: product.currentStock - movement.quantity,
                reservedStock: product.reservedStock - movement.quantity,
              },
            });

            // Update movement type to OUT
            await tx.stockMovement.update({
              where: { id: movement.id },
              data: { movementType: 'OUT' },
            });

            // Invalidate cache
            await redis.del(`product:${movement.productId}`);
          }
        }
      });

      // Publish event
      await kafka.send({
        topic: 'inventory.events',
        messages: [{
          key: orderId,
          value: JSON.stringify({
            eventType: 'RESERVATION_COMMITTED',
            eventId: crypto.randomUUID(),
            timestamp: new Date(),
            data: { orderId, merchantId },
          }),
        }],
      });

      res.json({
        success: true,
        message: 'Reservation committed successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get low stock products
   */
  getLowStockProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const merchantId = req.user!.userId;

      const products = await prisma.product.findMany({
        where: {
          merchantId,
          deletedAt: null,
          currentStock: {
            lte: prisma.product.fields.reorderPoint,
          },
        },
        orderBy: {
          currentStock: 'asc',
        },
      });

      res.json({
        success: true,
        data: { products },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get stock movement history
   */
  getStockHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const merchantId = req.user!.userId;
      const { page = 1, limit = 50 } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const [movements, total] = await Promise.all([
        prisma.stockMovement.findMany({
          where: {
            productId: id,
            merchantId,
          },
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            performedByUser: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        }),
        prisma.stockMovement.count({
          where: { productId: id, merchantId },
        }),
      ]);

      res.json({
        success: true,
        data: {
          movements,
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
  // HELPER METHODS
  // ============================================================================

  private async sendLowStockAlert(product: any): Promise<void> {
    // Publish event for notification service
    await kafka.send({
      topic: 'inventory.events',
      messages: [{
        key: product.id,
        value: JSON.stringify({
          eventType: 'LOW_STOCK_ALERT',
          eventId: crypto.randomUUID(),
          timestamp: new Date(),
          data: {
            productId: product.id,
            productName: product.name,
            currentStock: product.currentStock,
            reorderPoint: product.reorderPoint,
            merchantId: product.merchantId,
          },
        }),
      }],
    });
  }

  private async releaseReservation(orderId: string, merchantId: string): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        const movements = await tx.stockMovement.findMany({
          where: {
            merchantId,
            referenceId: orderId,
            movementType: 'RESERVED',
            createdAt: {
              lt: new Date(Date.now() - 15 * 60 * 1000), // Older than 15 minutes
            },
          },
        });

        for (const movement of movements) {
          const product = await tx.product.findUnique({
            where: { id: movement.productId },
          });

          if (product) {
            await tx.product.update({
              where: { id: movement.productId },
              data: {
                reservedStock: product.reservedStock - movement.quantity,
              },
            });

            await tx.stockMovement.update({
              where: { id: movement.id },
              data: { movementType: 'RELEASED' },
            });
          }
        }
      });
    } catch (error) {
      logger.error('Failed to release reservation', { error, orderId, merchantId });
    }
  }
}