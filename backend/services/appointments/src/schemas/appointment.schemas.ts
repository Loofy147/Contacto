import { z } from 'zod';

export const appointmentSchemas = {
  create: z.object({
    body: z.object({
      professionalId: z.string().uuid(),
      scheduledAt: z.string().datetime(),
      duration: z.number().int().positive(),
      serviceName: z.string().optional(),
      notes: z.string().optional(),
    }),
  }),
  cancel: z.object({
    body: z.object({
      reason: z.string().optional(),
    }),
  }),
};
