import { createClient } from 'redis';
import { config } from '../config';
import { logger } from '../utils/logger';

export const redis = createClient({
  url: config.redis.url
});

redis.on('error', (err) => logger.error('Redis Client Error', err));
redis.on('connect', () => logger.info('Redis Client Connected'));

// Auto-connect (v4 requires this)
// Note: In some environments you might want to call .connect() elsewhere
// but for simplicity we'll do it here or handle it in the main start()
