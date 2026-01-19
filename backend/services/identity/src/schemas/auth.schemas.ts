import { z } from 'zod';

export const authSchemas = {
  register: z.object({
    body: z.object({
      email: z.string().email(),
      password: z.string().min(8),
      firstName: z.string().min(2),
      lastName: z.string().min(2),
      phone: z.string().optional(),
    }),
  }),
  login: z.object({
    body: z.object({
      email: z.string().email(),
      password: z.string(),
    }),
  }),
  refresh: z.object({
    body: z.object({
      refreshToken: z.string(),
    }),
  }),
  forgotPassword: z.object({
    body: z.object({
      email: z.string().email(),
    }),
  }),
  resetPassword: z.object({
    body: z.object({
      token: z.string(),
      newPassword: z.string().min(8),
    }),
  }),
  verifyEmail: z.object({
    body: z.object({
      token: z.string(),
    }),
  }),
  resendVerification: z.object({
    body: z.object({
      email: z.string().email(),
    }),
  }),
  verify2FA: z.object({
    body: z.object({
      token: z.string().length(6),
    }),
  }),
  disable2FA: z.object({
    body: z.object({
      password: z.string(),
    }),
  }),
};
