import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { createServer } from 'http';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { professionalRoutes } from './routes/professional.routes';
import { prisma } from './lib/prisma';
import { redis } from './lib/redis';
import { kafka } from './lib/kafka';

class ProfessionalsService {
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
      res.json({ status: 'UP', service: 'professionals-service' });
    });

    this.app.use('/api/v1/professionals', professionalRoutes);
  }

  private configureErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      await prisma.$connect();
      logger.info('✅ Database connected');

      // Start HTTP server
      this.server = createServer(this.app);
      const port = config.port || 3001;

      this.server.listen(port, () => {
        logger.info(`🚀 Professionals Service started on port ${port}`);
      });
    } catch (error) {
      logger.error('❌ Failed to start Professionals Service:', error);
      process.exit(1);
    }
  }
}

const service = new ProfessionalsService();
service.start();
