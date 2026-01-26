// backend/services/identity/src/lib/redis.ts
import { createClient } from 'redis';
import { config } from '../config';
import { logger } from '../utils/logger';

export const redis = createClient({
  url: config.redis.url,
});

redis.on('error', (err) => logger.error('Redis Client Error', err));

redis.connect();
