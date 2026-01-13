"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
require("express-async-errors");
const dotenv_1 = require("dotenv");
const pino_1 = __importDefault(require("pino"));
const zod_1 = require("zod");
const routes_1 = __importDefault(require("./routes"));
const types_1 = require("./types");
// Load environment variables
(0, dotenv_1.config)();
// Logger
const logger = (0, pino_1.default)({
    level: process.env.LOG_LEVEL || 'info',
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
        },
    },
});
// Create Express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// ============================================
// MIDDLEWARE
// ============================================
// Security headers
app.use((0, helmet_1.default)());
// CORS
app.use((0, cors_1.default)({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
}));
// Body parsing
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);
// Request logging
app.use((req, _res, next) => {
    logger.info({
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('user-agent'),
    });
    next();
});
// ============================================
// ROUTES
// ============================================
// API routes
app.use('/api/v1/crm', routes_1.default);
// Root endpoint
app.get('/', (_req, res) => {
    res.json({
        service: 'Contacto CRM Service',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            contacts: '/api/v1/crm/contacts',
            deals: '/api/v1/crm/deals',
            activities: '/api/v1/crm/activities',
            tasks: '/api/v1/crm/tasks',
            health: '/api/v1/crm/health',
        },
    });
});
// ============================================
// ERROR HANDLING
// ============================================
/**
 * Zod validation error handler
 */
function handleZodError(error) {
    return {
        message: 'Validation failed',
        errors: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
        })),
    };
}
/**
 * Global error handler
 */
app.use((err, req, res, _next) => {
    logger.error({
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });
    // Zod validation errors
    if (err instanceof zod_1.ZodError) {
        const { message, errors } = handleZodError(err);
        return res.status(400).json({
            error: 'ValidationError',
            message,
            errors,
        });
    }
    // Custom CRM errors
    if (err instanceof types_1.CRMError) {
        return res.status(err.statusCode).json({
            error: err.code,
            message: err.message,
            ...(err instanceof Error && 'errors' in err && { errors: err.errors }),
        });
    }
    // Prisma errors
    if (err.constructor.name.includes('Prisma')) {
        return res.status(400).json({
            error: 'DatabaseError',
            message: 'Database operation failed',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined,
        });
    }
    // Default error response
    return res.status(500).json({
        error: 'InternalServerError',
        message: 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'NotFound',
        message: `Route ${req.method} ${req.path} not found`,
    });
});
// ============================================
// SERVER START
// ============================================
const server = app.listen(PORT, () => {
    logger.info(`🚀 CRM Service running on port ${PORT}`);
    logger.info(`📚 API documentation: http://localhost:${PORT}/`);
    logger.info(`🏥 Health check: http://localhost:${PORT}/api/v1/crm/health`);
});
// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server');
    server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });
});
exports.default = app;
//# sourceMappingURL=index.js.map