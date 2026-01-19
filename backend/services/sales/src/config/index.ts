// backend/services/identity/src/config/index.ts
import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment variable schema
const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform(Number).default('3007'),
  API_URL: z.string().url().default('http://localhost:3000'),

  // Database
  DATABASE_URL: z.string().min(1),
  DATABASE_POOL_URL: z.string().optional(),
  DB_POOL_MIN: z.string().transform(Number).default('5'),
  DB_POOL_MAX: z.string().transform(Number).default('25'),

  // Redis
  REDIS_URL: z.string().min(1),
  REDIS_TTL: z.string().transform(Number).default('3600'),

  // Kafka
  KAFKA_BROKERS: z.string().min(1),
  KAFKA_CLIENT_ID: z.string().default('contacto_sales'),
  KAFKA_GROUP_ID: z.string().default('identity_consumer_group'),
  KAFKA_TOPIC_USER_EVENTS: z.string().default('user.events'),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // Session
  SESSION_SECRET: z.string().min(32),
  SESSION_MAX_AGE: z.string().transform(Number).default('86400000'),

  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM_EMAIL: z.string().email().default('noreply@contacto.dz'),
  SMTP_FROM_NAME: z.string().default('Contacto'),
  SENDGRID_API_KEY: z.string().optional(),

  // SMS
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('60000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),

  // Security
  ENCRYPTION_KEY: z.string().min(32),
  ENCRYPTION_ALGORITHM: z.string().default('aes-256-gcm'),

  // 2FA
  TOTP_ISSUER: z.string().default('Contacto'),
  TOTP_WINDOW: z.string().transform(Number).default('1'),

  // Monitoring
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().default('development'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['json', 'pretty']).default('json'),
});

// Validate environment variables
const env = envSchema.parse(process.env);

// Export configuration
export const config = {
  // Application
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  apiUrl: env.API_URL,

  // Database
  database: {
    url: env.DATABASE_URL,
    poolUrl: env.DATABASE_POOL_URL || env.DATABASE_URL,
    pool: {
      min: env.DB_POOL_MIN,
      max: env.DB_POOL_MAX,
    },
  },

  // Redis
  redis: {
    url: env.REDIS_URL,
    ttl: env.REDIS_TTL,
  },

  // Kafka
  kafka: {
    brokers: env.KAFKA_BROKERS.split(','),
    clientId: env.KAFKA_CLIENT_ID,
    groupId: env.KAFKA_GROUP_ID,
    topics: {
      userEvents: env.KAFKA_TOPIC_USER_EVENTS,
    },
  },

  // JWT
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshSecret: env.JWT_REFRESH_SECRET,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },

  // Session
  session: {
    secret: env.SESSION_SECRET,
    maxAge: env.SESSION_MAX_AGE,
  },

  // Email
  email: {
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
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

  // SMS
  sms: {
    twilio: {
      accountSid: env.TWILIO_ACCOUNT_SID,
      authToken: env.TWILIO_AUTH_TOKEN,
      phoneNumber: env.TWILIO_PHONE_NUMBER,
    },
  },

  // CORS
  cors: {
    origin: env.CORS_ORIGIN.split(','),
  },

  // Rate Limiting
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },

  // Security
  security: {
    encryptionKey: env.ENCRYPTION_KEY,
    encryptionAlgorithm: env.ENCRYPTION_ALGORITHM,
  },

  // 2FA
  totp: {
    issuer: env.TOTP_ISSUER,
    window: env.TOTP_WINDOW,
  },

  // Monitoring
  sentry: {
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT,
  },

  // Logging
  logging: {
    level: env.LOG_LEVEL,
    format: env.LOG_FORMAT,
  },
} as const;

// Type export for TypeScript
export type Config = typeof config;