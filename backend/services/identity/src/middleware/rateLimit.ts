// backend/services/identity/src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

export const rateLimitStrict = (minutes: number, max: number) =>
  rateLimit({
    windowMs: minutes * 60 * 1000,
    max,
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
