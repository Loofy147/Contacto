import rateLimit from 'express-rate-limit';
import { config } from '../config';

export const rateLimitStrict = (max: number, windowMs: number) => rateLimit({
  windowMs,
  max,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many attempts, please try again later',
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const metrics = (req: any, res: any, next: any) => {
  // Placeholder for metrics collection
  next();
};
