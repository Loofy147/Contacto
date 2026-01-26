"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
// backend/services/identity/src/utils/errors.ts
class AppError extends Error {
    constructor(statusCode, code, message) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.message = message;
    }
}
exports.AppError = AppError;
