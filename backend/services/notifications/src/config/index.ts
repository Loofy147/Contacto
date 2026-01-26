import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment variable schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform(Number).default('3002'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  SUPPORT_EMAIL: z.string().email().default('support@contacto.dz'),

  // Kafka
  KAFKA_BROKERS: z.string().min(1),
  KAFKA_CLIENT_ID: z.string().default('contacto_notifications'),
  KAFKA_GROUP_ID: z.string().default('notifications_consumer_group'),

  // Redis
  REDIS_URL: z.string().min(1),

  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM_EMAIL: z.string().email().default('noreply@contacto.dz'),
  SMTP_FROM_NAME: z.string().default('Contacto'),
  SENDGRID_API_KEY: z.string().optional(),
});

const env = envSchema.parse(process.env);

export const config = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  appUrl: env.APP_URL,
  supportEmail: env.SUPPORT_EMAIL,

  kafka: {
    brokers: env.KAFKA_BROKERS.split(','),
    clientId: env.KAFKA_CLIENT_ID,
    groupId: env.KAFKA_GROUP_ID,
  },

  redis: {
    url: env.REDIS_URL,
  },

  email: {
    smtp: {
      host: env.SMTP_HOST || 'localhost',
      port: env.SMTP_PORT || 587,
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    sendgrid: {
      apiKey: env.SENDGRID_API_KEY,
    },
    from: {
      email: env.SMTP_FROM_EMAIL,
      name: env.SMTP_FROM_NAME,
    },
  },

  logging: {
    level: 'info',
    format: 'json',
  },
} as const;

export type Config = typeof config;
