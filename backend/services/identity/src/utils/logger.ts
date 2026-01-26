// backend/services/identity/src/utils/logger.ts
import pino from 'pino';
import { config } from '../config';

const transport = config.logging.format === 'pretty'
  ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    }
  : undefined;

export const logger = pino({
  level: config.logging.level,
  transport,
});
