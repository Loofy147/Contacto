// backend/services/identity/src/middleware/metrics.ts
import { Request, Response, NextFunction } from 'express';

// Placeholder for metrics middleware
export const metrics = (_req: Request, _res: Response, next: NextFunction) => {
  // In a real application, you would use a library like prom-client
  // to collect and expose metrics for Prometheus.
  next();
};
