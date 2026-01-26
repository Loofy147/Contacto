import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment variable schema
const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  API_URL: z.string().url().default('http://localhost:3001'),

  // Database
  DATABASE_URL: z.string().min(1),

  // Redis
  REDIS_URL: z.string().min(1),

  // Kafka
  KAFKA_BROKERS: z.string().min(1),
  KAFKA_CLIENT_ID: z.string().default('contacto_professionals'),
  KAFKA_GROUP_ID: z.string().default('professionals_consumer_group'),

  // Meilisearch
  MEILI_HOST: z.string().default('http://localhost:7700'),
  MEILI_MASTER_KEY: z.string().default('contacto_search_master_key'),

  // JWT
  JWT_SECRET: z.string().min(32),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

// Validate environment variables
const env = envSchema.parse(process.env);

// Export configuration
export const config = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  apiUrl: env.API_URL,

  database: {
    url: env.DATABASE_URL,
  },

  redis: {
    url: env.REDIS_URL,
  },

  kafka: {
    brokers: env.KAFKA_BROKERS.split(','),
    clientId: env.KAFKA_CLIENT_ID,
    groupId: env.KAFKA_GROUP_ID,
  },

  meilisearch: {
    host: env.MEILI_HOST,
    apiKey: env.MEILI_MASTER_KEY,
  },

  jwt: {
    secret: env.JWT_SECRET,
  },

  logging: {
    level: env.LOG_LEVEL,
    format: 'json',
  },
} as const;

export type Config = typeof config;
