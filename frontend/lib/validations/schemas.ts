// frontend/lib/validations/schemas.ts
import { z } from 'zod';

export const authSchemas = {
  login: z.object({
    email: z.string().email(),
    password: z.string(),
  }),
  register: z.object({
    fullName: z.string(),
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }),
};
