import { z } from 'zod';

export const salesSchemas = {
  createSale: z.object({
    body: z.object({
      customerId: z.string().uuid().optional(),
      items: z.array(z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
        price: z.number().positive().optional(),
        discount: z.number().nonnegative().optional(),
      })).min(1),
      discounts: z.array(z.object({
        type: z.enum(['percentage', 'fixed']),
        value: z.number().positive(),
      })).optional(),
      paymentMethod: z.string(),
      notes: z.string().optional(),
      deviceId: z.string().optional(),
      location: z.object({
        lat: z.number(),
        lng: z.number(),
      }).optional(),
    }),
  }),
  refund: z.object({
    body: z.object({
      items: z.array(z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
      })),
      reason: z.string().optional(),
      notes: z.string().optional(),
    }),
  }),
};
