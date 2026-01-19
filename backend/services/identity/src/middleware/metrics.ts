import { Request, Response, NextFunction } from 'express';

export const metrics = (req: Request, res: Response, next: NextFunction) => {
  // Placeholder for Prometheus metrics
  next();
};
