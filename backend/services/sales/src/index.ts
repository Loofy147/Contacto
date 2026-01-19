import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { createServer } from 'http';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { salesRoutes } from './routes/sales.routes';
import { prisma } from './lib/prisma';
import { kafka } from './lib/kafka';

class SalesService {
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
      res.json({ status: 'UP', service: 'sales-service' });
    });
    this.app.use('/api/v1/sales', salesRoutes);
  }

  private configureErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      await prisma.$connect();
      await kafka.connect();
      logger.info('✅ Dependencies connected');

      this.server = createServer(this.app);
      const port = config.port || 3007;
      this.server.listen(port, () => {
        logger.info(`🚀 Sales Service started on port ${port}`);
      });
    } catch (error) {
      logger.error('❌ Failed to start Sales Service:', error);
      process.exit(1);
    }
  }
}

const service = new SalesService();
service.start();
