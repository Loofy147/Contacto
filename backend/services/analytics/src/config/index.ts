import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform(Number).default('3003'),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  KAFKA_BROKERS: z.string().min(1),
  JWT_SECRET: z.string().min(32),
});

const env = envSchema.parse(process.env);

export const config = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  database: { url: env.DATABASE_URL },
  redis: { url: env.REDIS_URL },
  kafka: {
    brokers: env.KAFKA_BROKERS.split(','),
    clientId: 'contacto_analytics',
    groupId: 'analytics_consumer_group',
  },
  jwt: { secret: env.JWT_SECRET },
  logging: { level: 'info', format: 'json' },
} as const;

export type Config = typeof config;
