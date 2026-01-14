import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';
import { config } from 'dotenv';
import pino from 'pino';
import { ZodError } from 'zod';
import routes from './routes';
import { CRMError } from './types';

// Load environment variables
config();

// Logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    },
  },
});

// Create Express app
const app: Express = express();
const PORT = process.env.PORT || 3001;

// ============================================
// MIDDLEWARE
// ============================================

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info({
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// ============================================
// ROUTES
// ============================================

// API routes
app.use('/api/v1/crm', routes);

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'Contacto CRM Service',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      contacts: '/api/v1/crm/contacts',
      deals: '/api/v1/crm/deals',
      activities: '/api/v1/crm/activities',
      tasks: '/api/v1/crm/tasks',
      health: '/api/v1/crm/health',
    },
  });
});

// ============================================
// ERROR HANDLING
// ============================================

/**
 * Zod validation error handler
 */
function handleZodError(error: ZodError): { message: string; errors: any[] } {
  return {
    message: 'Validation failed',
    errors: error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    })),
  };
}

/**
 * Global error handler
 */
app.use(
  (err: Error, req: Request, res: Response, _next: NextFunction): Response => {
    logger.error({
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });

    // Zod validation errors
    if (err instanceof ZodError) {
      const { message, errors } = handleZodError(err);
      return res.status(400).json({
        error: 'ValidationError',
        message,
        errors,
      });
    }

    // Custom CRM errors
    if (err instanceof CRMError) {
      return res.status(err.statusCode).json({
        error: err.code,
        message: err.message,
        ...(err instanceof Error && 'errors' in err && { errors: (err as any).errors }),
      });
    }

    // Prisma errors
    if (err.constructor.name.includes('Prisma')) {
      return res.status(400).json({
        error: 'DatabaseError',
        message: 'Database operation failed',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    }

    // Default error response
    return res.status(500).json({
      error: 'InternalServerError',
      message: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'NotFound',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// ============================================
// SERVER START
// ============================================

const server = app.listen(PORT, () => {
  logger.info(`🚀 CRM Service running on port ${PORT}`);
  logger.info(`📚 API documentation: http://localhost:${PORT}/`);
  logger.info(`🏥 Health check: http://localhost:${PORT}/api/v1/crm/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;
