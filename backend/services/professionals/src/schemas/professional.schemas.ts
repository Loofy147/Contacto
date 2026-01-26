import { z } from 'zod';

export const professionalSchemas = {
  create: z.object({
    body: z.object({
      categoryId: z.string().uuid(),
      businessName: z.string().min(2),
      bio: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      wilaya: z.string(),
      commune: z.string().optional(),
      address: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    }),
  }),
  update: z.object({
    body: z.object({
      businessName: z.string().min(2).optional(),
      bio: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      wilaya: z.string().optional(),
      commune: z.string().optional(),
      address: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    }),
  }),
};
