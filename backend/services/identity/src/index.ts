// backend/services/identity/src/index.ts
import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { metrics } from './middleware/metrics';
import { authRoutes } from './routes/auth.routes';
import { userRoutes } from './routes/user.routes';
import { healthRoutes } from './routes/health.routes';
import { prisma } from './lib/prisma';
import { redis } from './lib/redis';
// import { kafka } from './lib/kafka';

class IdentityService {
  private app: Application;
  private server: any;

  constructor() {
    this.app = express();
    this.configureMiddleware();
    this.configureRoutes();
    this.configureErrorHandling();
  }

  private configureMiddleware(): void {
    // Security
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }));

    // CORS
    this.app.use(cors({
      origin: config.cors.origin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    // Rate Limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.maxRequests,
      message: 'Too many requests from this IP, please try again later',
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging & Metrics
    this.app.use(requestLogger);
    this.app.use(metrics);

    // Trust proxy (for correct IP detection behind reverse proxy)
    this.app.set('trust proxy', 1);
  }

  private configureRoutes(): void {
    // Health check (before authentication)
    this.app.use('/health', healthRoutes);

    // API Routes
    this.app.use('/api/v1/auth', authRoutes);
    this.app.use('/api/v1/users', userRoutes);

    // Metrics endpoint for Prometheus
    this.app.get('/metrics', async (_req, res) => {
      res.set('Content-Type', 'text/plain');
      // Implement Prometheus metrics here
      res.send('# Metrics endpoint');
    });

    // 404 Handler
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'The requested resource was not found',
          path: req.path,
        },
      });
    });
  }

  private configureErrorHandling(): void {
    this.app.use(errorHandler);
  }

  private async initializeDatabase(): Promise<void> {
    try {
      await prisma.$connect();
      logger.info('✅ Database connected');

      // Run migrations in production
      if (config.nodeEnv === 'production') {
        // Migrations should be run separately in production
        logger.info('✅ Database migrations should be run via CI/CD');
      }
    } catch (error) {
      logger.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  private async initializeRedis(): Promise<void> {
    try {
      await redis.ping();
      logger.info('✅ Redis connected');
    } catch (error) {
      logger.error('❌ Redis connection failed:', error);
      throw error;
    }
  }

  // private async initializeKafka(): Promise<void> {
  //   const consumer = kafka.consumer({ groupId: config.kafka.groupId });
  //   try {
  //     await consumer.connect();
  //     logger.info('✅ Kafka connected');

  //     // Subscribe to relevant topics
  //     await consumer.subscribe({
  //       topics: [
  //         config.kafka.topics.userEvents,
  //       ],
  //       fromBeginning: false,
  //     });

  //     // Start consuming messages
  //     await consumer.run({
  //       eachMessage: async ({ topic, partition, message }) => {
  //         logger.info('Received message:', {
  //           topic,
  //           partition,
  //           value: message.value?.toString(),
  //         });

  //         // Process events based on topic
  //         // Event handlers will be implemented in separate modules
  //       },
  //     });

  //     logger.info('✅ Kafka consumer started');
  //   } catch (error) {
  //     logger.error('❌ Kafka connection failed:', error);
  //     throw error;
  //   }
  // }

  public async start(): Promise<void> {
    try {
      // Initialize dependencies
      await this.initializeDatabase();
      await this.initializeRedis();
      // await this.initializeKafka();

      // Start HTTP server
      this.server = createServer(this.app);

      this.server.listen(config.port, () => {
        logger.info(`
🚀 Identity Service started successfully!

Environment: ${config.nodeEnv}
Port: ${config.port}
API URL: ${config.apiUrl}

Health Check: ${config.apiUrl}/health
API Docs: ${config.apiUrl}/api/docs
Metrics: ${config.apiUrl}/metrics
        `);
      });

      // Graceful shutdown
      this.setupGracefulShutdown();
    } catch (error) {
      logger.error('❌ Failed to start Identity Service:', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);

      // Stop accepting new connections
      this.server.close(async () => {
        logger.info('HTTP server closed');

        try {
          // Close database connections
          await prisma.$disconnect();
          logger.info('Database disconnected');

          // Close Redis connection
          await redis.quit();
          logger.info('Redis disconnected');

          // Disconnect Kafka
          // const consumer = kafka.consumer({ groupId: config.kafka.groupId });
          // await consumer.disconnect();
          // logger.info('Kafka disconnected');

          logger.info('✅ Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during graceful shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      shutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      shutdown('UNHANDLED_REJECTION');
    });
  }
}

// Start the service
const service = new IdentityService();
service.start();

export { service };