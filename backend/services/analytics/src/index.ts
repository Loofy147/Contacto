import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { createServer } from 'http';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { analyticsRoutes } from './routes/analytics.routes';
import { prisma } from './lib/prisma';
import { kafka } from './lib/kafka';

class AnalyticsService {
  private app: Application;
  private server: any;

  constructor() {
    this.app = express();
    this.configureMiddleware();
    this.configureRoutes();
    this.configureErrorHandling();
  }

  private configureMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json());
  }

  private configureRoutes(): void {
    this.app.get('/health', (req, res) => {
      res.json({ status: 'UP', service: 'analytics-service' });
    });

    this.app.use('/api/v1/analytics', analyticsRoutes);
  }

  private configureErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      await prisma.$connect();
      logger.info('✅ Database connected');

      // Connect Kafka for ingestion
      await kafka.connect();
      logger.info('✅ Kafka connected');

      await kafka.subscribe({
        topics: ['professional.events', 'user.events'],
        fromBeginning: false
      });

      await kafka.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const event = JSON.parse(message.value?.toString() || '{}');
            if (event.eventType === 'PROFESSIONAL_VIEWED') {
              logger.info('Analytics: Professional viewed', event.data);
            } else if (event.eventType === 'USER_REGISTERED') {
              logger.info('Analytics: User registered', event.data);
            }
          } catch (error) {
            logger.error('Analytics: Error processing message', error);
          }
        }
      });

      // Start HTTP server
      this.server = createServer(this.app);
      const port = config.port || 3003;

      this.server.listen(port, () => {
        logger.info(`🚀 Analytics Service started on port ${port}`);
      });
    } catch (error) {
      logger.error('❌ Failed to start Analytics Service:', error);
      process.exit(1);
    }
  }
}

const service = new AnalyticsService();
service.start();
