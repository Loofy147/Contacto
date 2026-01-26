import { z } from 'zod';

export const paymentSchemas = {
  createPayment: z.object({
    body: z.object({
      amount: z.number().positive(),
      currency: z.string().length(3).optional(),
      description: z.string().optional(),
      metadata: z.record(z.any()).optional(),
      returnUrl: z.string().url(),
      cancelUrl: z.string().url(),
    }),
  }),
  refund: z.object({
    body: z.object({
      amount: z.number().positive().optional(),
      reason: z.string().optional(),
    }),
  }),
};
