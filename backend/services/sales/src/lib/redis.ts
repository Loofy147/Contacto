import { createClient } from 'redis';
import { config } from '../config';
import { logger } from '../utils/logger';

export const redis = createClient({
  url: config.redis.url
});

redis.on('error', (err) => logger.error('Redis Client Error', err));
redis.on('connect', () => logger.info('Redis Client Connected'));

export const connectRedis = async () => {
  if (!redis.isOpen) {
    await redis.connect();
  }
};

export const disconnectRedis = async () => {
  if (redis.isOpen) {
    await redis.quit();
  }
};
