import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { sendError } from '../utils/response';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return sendError(res, err.code, err.message, err.statusCode);
  }

  logger.error('Unhandled Error:', err);

  return sendError(res, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred', 500);
};
