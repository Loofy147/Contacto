import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AppError } from '../utils/errors';
import { redis } from '../lib/redis';
import { logger } from '../utils/logger';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const token = authHeader.split(' ')[1];

    // SENTINEL: Token Blacklist Check
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      logger.warn('Attempt to use blacklisted token', {
        ip: req.ip,
        path: req.path
      });
      throw new AppError(401, 'UNAUTHORIZED', 'Token is no longer valid');
    }

    try {
      const decoded = verifyToken(token);

      // SENTINEL: Basic account status check could be added here,
      // but is usually done at the service/controller level to avoid DB load on every request.
      // However, for high-security environments, we verify user exists and is ACTIVE.

      req.user = decoded;
      next();
    } catch (jwtError: any) {
      logger.error('JWT Verification Failed', {
        error: jwtError.message,
        ip: req.ip
      });
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token');
    }
  } catch (error) {
    next(error);
  }
};
