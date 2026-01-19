import { z } from 'zod';

export const walletSchemas = {
  topUp: z.object({
    body: z.object({
      amount: z.number().positive(),
      paymentMethodId: z.string(),
    }),
  }),
  withdraw: z.object({
    body: z.object({
      amount: z.number().positive(),
      bankAccountId: z.string(),
    }),
  }),
  transfer: z.object({
    body: z.object({
      toUserId: z.string().uuid(),
      amount: z.number().positive(),
      description: z.string().optional(),
    }),
  }),
};
