import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'appointments-service' });
});

app.use(errorHandler);

const port = config.port || 3000;
app.listen(port, () => {
  logger.info(`$SVC service started on port ${port}`);
});
