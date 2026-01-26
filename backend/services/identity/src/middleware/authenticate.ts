// backend/services/identity/src/middleware/authenticate.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AppError } from '../utils/errors';

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError(401, 'UNAUTHORIZED', 'No token provided'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    if (typeof decoded === 'object' && decoded !== null) {
      req.user = decoded as { userId: string; email: string; role: string; };
    }
    next();
  } catch (error) {
    next(new AppError(401, 'UNAUTHORIZED', 'Invalid token'));
  }
};
