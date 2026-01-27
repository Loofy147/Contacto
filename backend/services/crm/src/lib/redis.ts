import { createClient } from 'redis';
import { config } from '../config';

const redisClient = createClient({
  url: config.redis.url,
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

// Auto-connect if not in test environment
if (config.nodeEnv !== 'test') {
  redisClient.connect().catch(console.error);
}

export const redis = redisClient;
