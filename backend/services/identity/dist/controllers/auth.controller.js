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
exports.AuthController = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const speakeasy_1 = __importDefault(require("speakeasy"));
const qrcode_1 = __importDefault(require("qrcode"));
const prisma_1 = require("../lib/prisma");
const redis_1 = require("../lib/redis");
// import { kafka } from '../lib/kafka';
const config_1 = require("../config");
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const email_service_1 = require("../services/email.service");
const jwt_1 = require("../utils/jwt");
const password_1 = require("../utils/password");
class AuthController {
    constructor() {
        /**
         * Register a new user
         */
        this.register = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, password, firstName, lastName, phone } = req.body;
                // Check if user exists
                const existingUser = yield prisma_1.prisma.user.findFirst({
                    where: {
                        OR: [
                            { email },
                            ...(phone ? [{ phone }] : []),
                        ],
                    },
                });
                if (existingUser) {
                    throw new errors_1.AppError(409, 'USER_EXISTS', 'User already exists with this email or phone');
                }
                // Hash password
                const hashedPassword = yield (0, password_1.hashPassword)(password);
                // Create user
                const user = yield prisma_1.prisma.user.create({
                    data: {
                        email,
                        phone,
                        password: hashedPassword,
                        firstName,
                        lastName,
                    },
                    select: {
                        id: true,
                        email: true,
                        phone: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                        emailVerified: true,
                        createdAt: true,
                    },
                });
                // Generate verification token
                const verificationToken = (0, jwt_1.generateToken)({ userId: user.id, type: 'email_verification' }, '24h');
                yield prisma_1.prisma.verificationToken.create({
                    data: {
                        userId: user.id,
                        token: verificationToken,
                        type: 'EMAIL',
                        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    },
                });
                // Send verification email
                yield this.emailService.sendVerificationEmail(user.email, verificationToken);
                // Generate JWT tokens
                const accessToken = (0, jwt_1.generateToken)({ userId: user.id, email: user.email, role: user.role });
                const refreshToken = yield (0, jwt_1.generateRefreshToken)(user.id);
                // Publish user registered event
                // const producer = kafka.producer();
                // await producer.connect();
                // await producer.send({
                //   topic: config.kafka.topics.userEvents,
                //   messages: [{
                //     key: user.id,
                //     value: JSON.stringify({
                //       eventType: 'USER_REGISTERED',
                //       eventId: crypto.randomUUID(),
                //       timestamp: new Date(),
                //       data: {
                //         userId: user.id,
                //         email: user.email,
                //         role: user.role,
                //       },
                //     }),
                //   }],
                // });
                // await producer.disconnect();
                logger_1.logger.info('User registered successfully', { userId: user.id, email: user.email });
                res.status(201).json({
                    success: true,
                    message: 'User registered successfully. Please verify your email.',
                    data: {
                        user,
                        tokens: {
                            accessToken,
                            refreshToken,
                        },
                    },
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Login user
         */
        this.login = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, password } = req.body;
                // Find user
                const user = yield prisma_1.prisma.user.findUnique({
                    where: { email },
                });
                if (!user) {
                    throw new errors_1.AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
                }
                // Check if user is active
                if (user.status !== 'ACTIVE') {
                    throw new errors_1.AppError(403, 'ACCOUNT_SUSPENDED', 'Your account has been suspended');
                }
                // Verify password
                const isPasswordValid = yield (0, password_1.comparePassword)(password, user.password);
                if (!isPasswordValid) {
                    throw new errors_1.AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
                }
                // Check if 2FA is enabled
                if (user.twoFactorEnabled) {
                    // Generate temporary token for 2FA verification
                    const tempToken = (0, jwt_1.generateToken)({ userId: user.id, requires2FA: true }, '5m');
                    return res.json({
                        success: true,
                        message: '2FA verification required',
                        data: {
                            requires2FA: true,
                            tempToken,
                        },
                    });
                }
                // Update login info
                yield prisma_1.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        lastLoginAt: new Date(),
                        lastLoginIp: req.ip,
                        loginCount: { increment: 1 },
                    },
                });
                // Generate tokens
                const accessToken = (0, jwt_1.generateToken)({ userId: user.id, email: user.email, role: user.role });
                const refreshToken = yield (0, jwt_1.generateRefreshToken)(user.id);
                // Create session
                yield prisma_1.prisma.session.create({
                    data: {
                        userId: user.id,
                        token: accessToken,
                        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    },
                });
                // Publish login event
                // const producer = kafka.producer();
                // await producer.connect();
                // await producer.send({
                //   topic: config.kafka.topics.userEvents,
                //   messages: [{
                //     key: user.id,
                //     value: JSON.stringify({
                //       eventType: 'USER_LOGGED_IN',
                //       eventId: crypto.randomUUID(),
                //       timestamp: new Date(),
                //       data: {
                //         userId: user.id,
                //         ip: req.ip,
                //       },
                //     }),
                //   }],
                // });
                // await producer.disconnect();
                logger_1.logger.info('User logged in successfully', { userId: user.id, email: user.email });
                res.json({
                    success: true,
                    message: 'Login successful',
                    data: {
                        user: {
                            id: user.id,
                            email: user.email,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            role: user.role,
                            emailVerified: user.emailVerified,
                        },
                        tokens: {
                            accessToken,
                            refreshToken,
                        },
                    },
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Logout user
         */
        this.logout = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = req.user.userId;
                const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
                if (token) {
                    // Delete session
                    yield prisma_1.prisma.session.deleteMany({
                        where: {
                            userId,
                            token,
                        },
                    });
                    // Blacklist token in Redis
                    const decoded = jsonwebtoken_1.default.decode(token);
                    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
                    if (expiresIn > 0) {
                        yield redis_1.redis.setEx(`blacklist:${token}`, expiresIn, '1');
                    }
                }
                logger_1.logger.info('User logged out', { userId });
                res.json({
                    success: true,
                    message: 'Logged out successfully',
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Refresh access token
         */
        this.refresh = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { refreshToken } = req.body;
                if (!refreshToken) {
                    throw new errors_1.AppError(400, 'MISSING_REFRESH_TOKEN', 'Refresh token is required');
                }
                // Verify refresh token
                (0, jwt_1.verifyToken)(refreshToken, config_1.config.jwt.refreshSecret);
                // Check if refresh token exists in database
                const tokenRecord = yield prisma_1.prisma.refreshToken.findUnique({
                    where: { token: refreshToken },
                    include: { user: true },
                });
                if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
                    throw new errors_1.AppError(401, 'INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token');
                }
                // Generate new tokens
                const newAccessToken = (0, jwt_1.generateToken)({
                    userId: tokenRecord.user.id,
                    email: tokenRecord.user.email,
                    role: tokenRecord.user.role,
                });
                const newRefreshToken = yield (0, jwt_1.generateRefreshToken)(tokenRecord.user.id);
                // Delete old refresh token
                yield prisma_1.prisma.refreshToken.delete({
                    where: { id: tokenRecord.id },
                });
                res.json({
                    success: true,
                    message: 'Token refreshed successfully',
                    data: {
                        accessToken: newAccessToken,
                        refreshToken: newRefreshToken,
                    },
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Send password reset email
         */
        this.forgotPassword = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { email } = req.body;
                const user = yield prisma_1.prisma.user.findUnique({
                    where: { email },
                });
                // Don't reveal if user exists
                if (!user) {
                    return res.json({
                        success: true,
                        message: 'If an account exists with this email, a password reset link has been sent.',
                    });
                }
                // Generate reset token
                const resetToken = (0, jwt_1.generateToken)({ userId: user.id, type: 'password_reset' }, '1h');
                yield prisma_1.prisma.passwordReset.create({
                    data: {
                        userId: user.id,
                        token: resetToken,
                        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
                    },
                });
                // Send reset email
                yield this.emailService.sendPasswordResetEmail(user.email, resetToken);
                logger_1.logger.info('Password reset email sent', { userId: user.id });
                res.json({
                    success: true,
                    message: 'If an account exists with this email, a password reset link has been sent.',
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Reset password with token
         */
        this.resetPassword = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { token, newPassword } = req.body;
                const resetRecord = yield prisma_1.prisma.passwordReset.findUnique({
                    where: { token },
                    include: { user: true },
                });
                if (!resetRecord || resetRecord.expiresAt < new Date() || resetRecord.usedAt) {
                    throw new errors_1.AppError(400, 'INVALID_RESET_TOKEN', 'Invalid or expired reset token');
                }
                // Hash new password
                const hashedPassword = yield (0, password_1.hashPassword)(newPassword);
                // Update password
                yield prisma_1.prisma.user.update({
                    where: { id: resetRecord.userId },
                    data: { password: hashedPassword },
                });
                // Mark reset token as used
                yield prisma_1.prisma.passwordReset.update({
                    where: { id: resetRecord.id },
                    data: { usedAt: new Date() },
                });
                // Invalidate all sessions
                yield prisma_1.prisma.session.deleteMany({
                    where: { userId: resetRecord.userId },
                });
                yield prisma_1.prisma.refreshToken.deleteMany({
                    where: { userId: resetRecord.userId },
                });
                logger_1.logger.info('Password reset successful', { userId: resetRecord.userId });
                res.json({
                    success: true,
                    message: 'Password reset successful. Please login with your new password.',
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Verify email address
         */
        this.verifyEmail = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { token } = req.body;
                const verificationRecord = yield prisma_1.prisma.verificationToken.findUnique({
                    where: { token },
                });
                if (!verificationRecord || verificationRecord.expiresAt < new Date()) {
                    throw new errors_1.AppError(400, 'INVALID_VERIFICATION_TOKEN', 'Invalid or expired verification token');
                }
                // Update user
                yield prisma_1.prisma.user.update({
                    where: { id: verificationRecord.userId },
                    data: {
                        emailVerified: true,
                        emailVerifiedAt: new Date(),
                    },
                });
                // Delete verification token
                yield prisma_1.prisma.verificationToken.delete({
                    where: { id: verificationRecord.id },
                });
                // Publish event
                // const producer = kafka.producer();
                // await producer.connect();
                // await producer.send({
                //   topic: config.kafka.topics.userEvents,
                //   messages: [{
                //     key: verificationRecord.userId,
                //     value: JSON.stringify({
                //       eventType: 'EMAIL_VERIFIED',
                //       eventId: crypto.randomUUID(),
                //       timestamp: new Date(),
                //       data: { userId: verificationRecord.userId },
                //     }),
                //   }],
                // });
                // await producer.disconnect();
                logger_1.logger.info('Email verified', { userId: verificationRecord.userId });
                res.json({
                    success: true,
                    message: 'Email verified successfully',
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Resend verification email
         */
        this.resendVerification = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { email } = req.body;
                const user = yield prisma_1.prisma.user.findUnique({
                    where: { email },
                });
                if (!user) {
                    throw new errors_1.AppError(404, 'USER_NOT_FOUND', 'User not found');
                }
                if (user.emailVerified) {
                    throw new errors_1.AppError(400, 'ALREADY_VERIFIED', 'Email is already verified');
                }
                // Delete old verification tokens
                yield prisma_1.prisma.verificationToken.deleteMany({
                    where: {
                        userId: user.id,
                        type: 'EMAIL',
                    },
                });
                // Generate new token
                const verificationToken = (0, jwt_1.generateToken)({ userId: user.id, type: 'email_verification' }, '24h');
                yield prisma_1.prisma.verificationToken.create({
                    data: {
                        userId: user.id,
                        token: verificationToken,
                        type: 'EMAIL',
                        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    },
                });
                // Send email
                yield this.emailService.sendVerificationEmail(user.email, verificationToken);
                res.json({
                    success: true,
                    message: 'Verification email sent',
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Setup 2FA
         */
        this.setup2FA = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.userId;
                const user = yield prisma_1.prisma.user.findUnique({
                    where: { id: userId },
                });
                if (!user) {
                    throw new errors_1.AppError(404, 'USER_NOT_FOUND', 'User not found');
                }
                if (user.twoFactorEnabled) {
                    throw new errors_1.AppError(400, '2FA_ALREADY_ENABLED', '2FA is already enabled');
                }
                // Generate secret
                const secret = speakeasy_1.default.generateSecret({
                    name: `${config_1.config.totp.issuer} (${user.email})`,
                    issuer: config_1.config.totp.issuer,
                });
                // Generate QR code
                const qrCode = yield qrcode_1.default.toDataURL(secret.otpauth_url);
                // Store secret temporarily in Redis (not yet enabled)
                yield redis_1.redis.setEx(`2fa:setup:${userId}`, 600, secret.base32); // 10 minutes
                res.json({
                    success: true,
                    message: '2FA setup initiated',
                    data: {
                        secret: secret.base32,
                        qrCode,
                    },
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Verify 2FA and enable
         */
        this.verify2FA = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.userId;
                const { token } = req.body;
                // Get temporary secret from Redis
                const secret = yield redis_1.redis.get(`2fa:setup:${userId}`);
                if (!secret) {
                    throw new errors_1.AppError(400, '2FA_SETUP_EXPIRED', '2FA setup has expired. Please start again.');
                }
                // Verify token
                const verified = speakeasy_1.default.totp.verify({
                    secret,
                    encoding: 'base32',
                    token,
                    window: config_1.config.totp.window,
                });
                if (!verified) {
                    throw new errors_1.AppError(400, 'INVALID_2FA_TOKEN', 'Invalid 2FA token');
                }
                // Enable 2FA
                yield prisma_1.prisma.user.update({
                    where: { id: userId },
                    data: {
                        twoFactorEnabled: true,
                        twoFactorSecret: secret,
                    },
                });
                // Delete temporary secret
                yield redis_1.redis.del(`2fa:setup:${userId}`);
                logger_1.logger.info('2FA enabled', { userId });
                res.json({
                    success: true,
                    message: '2FA enabled successfully',
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Disable 2FA
         */
        this.disable2FA = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.userId;
                const { password } = req.body;
                const user = yield prisma_1.prisma.user.findUnique({
                    where: { id: userId },
                });
                if (!user) {
                    throw new errors_1.AppError(404, 'USER_NOT_FOUND', 'User not found');
                }
                // Verify password
                const isPasswordValid = yield (0, password_1.comparePassword)(password, user.password);
                if (!isPasswordValid) {
                    throw new errors_1.AppError(401, 'INVALID_PASSWORD', 'Invalid password');
                }
                // Disable 2FA
                yield prisma_1.prisma.user.update({
                    where: { id: userId },
                    data: {
                        twoFactorEnabled: false,
                        twoFactorSecret: null,
                    },
                });
                logger_1.logger.info('2FA disabled', { userId });
                res.json({
                    success: true,
                    message: '2FA disabled successfully',
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Get current user
         */
        this.getCurrentUser = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.userId;
                const user = yield prisma_1.prisma.user.findUnique({
                    where: { id: userId },
                    select: {
                        id: true,
                        email: true,
                        phone: true,
                        firstName: true,
                        lastName: true,
                        avatarUrl: true,
                        role: true,
                        emailVerified: true,
                        phoneVerified: true,
                        twoFactorEnabled: true,
                        lastLoginAt: true,
                        createdAt: true,
                    },
                });
                if (!user) {
                    throw new errors_1.AppError(404, 'USER_NOT_FOUND', 'User not found');
                }
                res.json({
                    success: true,
                    data: { user },
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.emailService = new email_service_1.EmailService();
    }
}
exports.AuthController = AuthController;
