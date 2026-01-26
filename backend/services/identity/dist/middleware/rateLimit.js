"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitStrict = void 0;
// backend/services/identity/src/middleware/rateLimit.ts
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const rateLimitStrict = (minutes, max) => (0, express_rate_limit_1.default)({
    windowMs: minutes * 60 * 1000,
    max,
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
exports.rateLimitStrict = rateLimitStrict;
