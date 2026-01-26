"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
// backend/services/identity/src/config/index.ts
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
// Load environment variables
dotenv_1.default.config();
// Environment variable schema
const envSchema = zod_1.z.object({
    // Application
    NODE_ENV: zod_1.z.enum(['development', 'test', 'production']).default('development'),
    PORT: zod_1.z.string().transform(Number).default('3002'),
    API_URL: zod_1.z.string().url().default('http://localhost:3002'),
    // Database
    DATABASE_URL: zod_1.z.string().min(1),
    // Redis
    REDIS_URL: zod_1.z.string().min(1),
    // Kafka
    KAFKA_BROKERS: zod_1.z.string().min(1),
    KAFKA_CLIENT_ID: zod_1.z.string().default('contacto_identity'),
    KAFKA_GROUP_ID: zod_1.z.string().default('identity_consumer_group'),
    KAFKA_TOPIC_USER_EVENTS: zod_1.z.string().default('user.events'),
    // JWT
    JWT_SECRET: zod_1.z.string().min(32),
    JWT_EXPIRES_IN: zod_1.z.string().default('15m'),
    JWT_REFRESH_SECRET: zod_1.z.string().min(32),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default('7d'),
    // CORS
    CORS_ORIGIN: zod_1.z.string().default('http://localhost:3000'),
    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: zod_1.z.string().transform(Number).default('60000'),
    RATE_LIMIT_MAX_REQUESTS: zod_1.z.string().transform(Number).default('100'),
    // 2FA
    TOTP_ISSUER: zod_1.z.string().default('Contacto'),
    TOTP_WINDOW: zod_1.z.string().transform(Number).default('1'),
    // Logging
    LOG_LEVEL: zod_1.z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    LOG_FORMAT: zod_1.z.enum(['json', 'pretty']).default('pretty'),
});
// Validate environment variables
const env = envSchema.parse(process.env);
// Export configuration
exports.config = {
    // Application
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    apiUrl: env.API_URL,
    // Database
    database: {
        url: env.DATABASE_URL,
    },
    // Redis
    redis: {
        url: env.REDIS_URL,
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
    // CORS
    cors: {
        origin: env.CORS_ORIGIN.split(','),
    },
    // Rate Limiting
    rateLimit: {
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    },
    // 2FA
    totp: {
        issuer: env.TOTP_ISSUER,
        window: env.TOTP_WINDOW,
    },
    // Logging
    logging: {
        level: env.LOG_LEVEL,
        format: env.LOG_FORMAT,
    },
};
