import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { createServer } from 'http';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { walletRoutes } from './routes/wallet.routes';
import { prisma } from './lib/prisma';
import { redis } from './lib/redis';
import { kafka } from './lib/kafka';

class WalletService {
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
    this.app.set('trust proxy', 1);
  }

  private configureRoutes(): void {
    this.app.get('/health', (req, res) => {
      res.json({ status: 'UP', service: 'wallet-service' });
    });
    this.app.use('/api/v1/wallet', walletRoutes);
  }

  private configureErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      await prisma.$connect();
      logger.info('✅ Database connected');

      if (!redis.isOpen) {
        await redis.connect();
        logger.info('✅ Redis connected');
      }

      await kafka.connect();
      logger.info('✅ Kafka connected');

      this.server = createServer(this.app);
      const port = config.port;

      this.server.listen(port, () => {
        logger.info(`🚀 Wallet Service started on port ${port}`);
      });
    } catch (error) {
      logger.error(`❌ Failed to start Wallet Service:`, error);
      process.exit(1);
    }
  }
}

const service = new WalletService();
service.start();
