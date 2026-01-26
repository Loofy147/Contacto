"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
// backend/services/identity/src/lib/redis.ts
const redis_1 = require("redis");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
exports.redis = (0, redis_1.createClient)({
    url: config_1.config.redis.url,
});
exports.redis.on('error', (err) => logger_1.logger.error('Redis Client Error', err));
exports.redis.connect();
