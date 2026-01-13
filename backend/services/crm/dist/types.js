"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DuplicateError = exports.ValidationError = exports.NotFoundError = exports.CRMError = void 0;
// ============================================
// ERROR TYPES
// ============================================
class CRMError extends Error {
    code;
    statusCode;
    constructor(message, code, statusCode = 500) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.name = 'CRMError';
    }
}
exports.CRMError = CRMError;
class NotFoundError extends CRMError {
    constructor(resource, id) {
        super(`${resource} with id ${id} not found`, 'NOT_FOUND', 404);
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
class ValidationError extends CRMError {
    errors;
    constructor(message, errors) {
        super(message, 'VALIDATION_ERROR', 400);
        this.errors = errors;
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class DuplicateError extends CRMError {
    constructor(resource, field) {
        super(`${resource} with this ${field} already exists`, 'DUPLICATE', 409);
        this.name = 'DuplicateError';
    }
}
exports.DuplicateError = DuplicateError;
//# sourceMappingURL=types.js.map