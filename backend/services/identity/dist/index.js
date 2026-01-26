"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.service = void 0;
// backend/services/identity/src/index.ts
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_1 = require("http");
const config_1 = require("./config");
const logger_1 = require("./utils/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const requestLogger_1 = require("./middleware/requestLogger");
const metrics_1 = require("./middleware/metrics");
const auth_routes_1 = require("./routes/auth.routes");
const user_routes_1 = require("./routes/user.routes");
const health_routes_1 = require("./routes/health.routes");
const prisma_1 = require("./lib/prisma");
const redis_1 = require("./lib/redis");
// import { kafka } from './lib/kafka';
class IdentityService {
    constructor() {
        this.app = (0, express_1.default)();
        this.configureMiddleware();
        this.configureRoutes();
        this.configureErrorHandling();
    }
    configureMiddleware() {
        // Security
        this.app.use((0, helmet_1.default)({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true,
            },
        }));
        // CORS
        this.app.use((0, cors_1.default)({
            origin: config_1.config.cors.origin,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
            allowedHeaders: ['Content-Type', 'Authorization'],
        }));
        // Rate Limiting
        const limiter = (0, express_rate_limit_1.default)({
            windowMs: config_1.config.rateLimit.windowMs,
            max: config_1.config.rateLimit.maxRequests,
            message: 'Too many requests from this IP, please try again later',
            standardHeaders: true,
            legacyHeaders: false,
        });
        this.app.use('/api/', limiter);
        // Body parsing
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        // Logging & Metrics
        this.app.use(requestLogger_1.requestLogger);
        this.app.use(metrics_1.metrics);
        // Trust proxy (for correct IP detection behind reverse proxy)
        this.app.set('trust proxy', 1);
    }
    configureRoutes() {
        // Health check (before authentication)
        this.app.use('/health', health_routes_1.healthRoutes);
        // API Routes
        this.app.use('/api/v1/auth', auth_routes_1.authRoutes);
        this.app.use('/api/v1/users', user_routes_1.userRoutes);
        // Metrics endpoint for Prometheus
        this.app.get('/metrics', (_req, res) => __awaiter(this, void 0, void 0, function* () {
            res.set('Content-Type', 'text/plain');
            // Implement Prometheus metrics here
            res.send('# Metrics endpoint');
        }));
        // 404 Handler
        this.app.use((req, res) => {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'The requested resource was not found',
                    path: req.path,
                },
            });
        });
    }
    configureErrorHandling() {
        this.app.use(errorHandler_1.errorHandler);
    }
    initializeDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield prisma_1.prisma.$connect();
                logger_1.logger.info('✅ Database connected');
                // Run migrations in production
                if (config_1.config.nodeEnv === 'production') {
                    // Migrations should be run separately in production
                    logger_1.logger.info('✅ Database migrations should be run via CI/CD');
                }
            }
            catch (error) {
                logger_1.logger.error('❌ Database connection failed:', error);
                throw error;
            }
        });
    }
    initializeRedis() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield redis_1.redis.ping();
                logger_1.logger.info('✅ Redis connected');
            }
            catch (error) {
                logger_1.logger.error('❌ Redis connection failed:', error);
                throw error;
            }
        });
    }
    // private async initializeKafka(): Promise<void> {
    //   const consumer = kafka.consumer({ groupId: config.kafka.groupId });
    //   try {
    //     await consumer.connect();
    //     logger.info('✅ Kafka connected');
    //     // Subscribe to relevant topics
    //     await consumer.subscribe({
    //       topics: [
    //         config.kafka.topics.userEvents,
    //       ],
    //       fromBeginning: false,
    //     });
    //     // Start consuming messages
    //     await consumer.run({
    //       eachMessage: async ({ topic, partition, message }) => {
    //         logger.info('Received message:', {
    //           topic,
    //           partition,
    //           value: message.value?.toString(),
    //         });
    //         // Process events based on topic
    //         // Event handlers will be implemented in separate modules
    //       },
    //     });
    //     logger.info('✅ Kafka consumer started');
    //   } catch (error) {
    //     logger.error('❌ Kafka connection failed:', error);
    //     throw error;
    //   }
    // }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Initialize dependencies
                yield this.initializeDatabase();
                yield this.initializeRedis();
                // await this.initializeKafka();
                // Start HTTP server
                this.server = (0, http_1.createServer)(this.app);
                this.server.listen(config_1.config.port, () => {
                    logger_1.logger.info(`
🚀 Identity Service started successfully!

Environment: ${config_1.config.nodeEnv}
Port: ${config_1.config.port}
API URL: ${config_1.config.apiUrl}

Health Check: ${config_1.config.apiUrl}/health
API Docs: ${config_1.config.apiUrl}/api/docs
Metrics: ${config_1.config.apiUrl}/metrics
        `);
                });
                // Graceful shutdown
                this.setupGracefulShutdown();
            }
            catch (error) {
                logger_1.logger.error('❌ Failed to start Identity Service:', error);
                process.exit(1);
            }
        });
    }
    setupGracefulShutdown() {
        const shutdown = (signal) => __awaiter(this, void 0, void 0, function* () {
            logger_1.logger.info(`\n${signal} received. Starting graceful shutdown...`);
            // Stop accepting new connections
            this.server.close(() => __awaiter(this, void 0, void 0, function* () {
                logger_1.logger.info('HTTP server closed');
                try {
                    // Close database connections
                    yield prisma_1.prisma.$disconnect();
                    logger_1.logger.info('Database disconnected');
                    // Close Redis connection
                    yield redis_1.redis.quit();
                    logger_1.logger.info('Redis disconnected');
                    // Disconnect Kafka
                    // const consumer = kafka.consumer({ groupId: config.kafka.groupId });
                    // await consumer.disconnect();
                    // logger.info('Kafka disconnected');
                    logger_1.logger.info('✅ Graceful shutdown completed');
                    process.exit(0);
                }
                catch (error) {
                    logger_1.logger.error('Error during graceful shutdown:', error);
                    process.exit(1);
                }
            }));
            // Force shutdown after 10 seconds
            setTimeout(() => {
                logger_1.logger.error('Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        });
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
        // Handle uncaught errors
        process.on('uncaughtException', (error) => {
            logger_1.logger.error('Uncaught Exception:', error);
            shutdown('UNCAUGHT_EXCEPTION');
        });
        process.on('unhandledRejection', (reason, promise) => {
            logger_1.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
            shutdown('UNHANDLED_REJECTION');
        });
    }
}
// Start the service
const service = new IdentityService();
exports.service = service;
service.start();
