import { z } from 'zod';

export const inventorySchemas = {
  createProduct: z.object({
    body: z.object({
      name: z.string().min(1),
      sku: z.string().optional(),
      barcode: z.string().optional(),
      category: z.string().optional(),
      sellingPrice: z.number().positive(),
      initialStock: z.number().int().nonnegative().optional(),
      reorderPoint: z.number().int().nonnegative().optional(),
    }),
  }),
  adjustStock: z.object({
    body: z.object({
      quantity: z.number().int().positive(),
      type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
      reason: z.string().optional(),
      notes: z.string().optional(),
    }),
  }),
};
