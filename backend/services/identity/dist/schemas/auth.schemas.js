"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authSchemas = void 0;
// backend/services/identity/src/schemas/auth.schemas.ts
const zod_1 = require("zod");
exports.authSchemas = {
    register: zod_1.z.object({
        body: zod_1.z.object({
            email: zod_1.z.string().email(),
            password: zod_1.z.string().min(8),
            firstName: zod_1.z.string().optional(),
            lastName: zod_1.z.string().optional(),
            phone: zod_1.z.string().optional(),
        }),
    }),
    login: zod_1.z.object({
        body: zod_1.z.object({
            email: zod_1.z.string().email(),
            password: zod_1.z.string(),
        }),
    }),
    refresh: zod_1.z.object({
        body: zod_1.z.object({
            refreshToken: zod_1.z.string(),
        }),
    }),
    forgotPassword: zod_1.z.object({
        body: zod_1.z.object({
            email: zod_1.z.string().email(),
        }),
    }),
    resetPassword: zod_1.z.object({
        body: zod_1.z.object({
            token: zod_1.z.string(),
            newPassword: zod_1.z.string().min(8),
        }),
    }),
    verifyEmail: zod_1.z.object({
        body: zod_1.z.object({
            token: zod_1.z.string(),
        }),
    }),
    resendVerification: zod_1.z.object({
        body: zod_1.z.object({
            email: zod_1.z.string().email(),
        }),
    }),
    verify2FA: zod_1.z.object({
        body: zod_1.z.object({
            token: zod_1.z.string(),
        }),
    }),
    disable2FA: zod_1.z.object({
        body: zod_1.z.object({
            password: zod_1.z.string(),
        }),
    }),
};
