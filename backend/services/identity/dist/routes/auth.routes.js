"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
// backend/services/identity/src/routes/auth.routes.ts
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const validate_1 = require("../middleware/validate");
const auth_schemas_1 = require("../schemas/auth.schemas");
const authenticate_1 = require("../middleware/authenticate");
const rateLimit_1 = require("../middleware/rateLimit");
const router = (0, express_1.Router)();
exports.authRoutes = router;
const authController = new auth_controller_1.AuthController();
/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', (0, rateLimit_1.rateLimitStrict)(5, 15 * 60 * 1000), // 5 attempts per 15 minutes
(0, validate_1.validate)(auth_schemas_1.authSchemas.register), authController.register);
/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user and return JWT
 * @access  Public
 */
router.post('/login', (0, rateLimit_1.rateLimitStrict)(10, 15 * 60 * 1000), // 10 attempts per 15 minutes
(0, validate_1.validate)(auth_schemas_1.authSchemas.login), authController.login);
/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (blacklist token)
 * @access  Private
 */
router.post('/logout', authenticate_1.authenticate, authController.logout);
/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh', (0, validate_1.validate)(auth_schemas_1.authSchemas.refresh), authController.refresh);
/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password', (0, rateLimit_1.rateLimitStrict)(3, 60 * 60 * 1000), // 3 attempts per hour
(0, validate_1.validate)(auth_schemas_1.authSchemas.forgotPassword), authController.forgotPassword);
/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', (0, validate_1.validate)(auth_schemas_1.authSchemas.resetPassword), authController.resetPassword);
/**
 * @route   POST /api/v1/auth/verify-email
 * @desc    Verify email address
 * @access  Public
 */
router.post('/verify-email', (0, validate_1.validate)(auth_schemas_1.authSchemas.verifyEmail), authController.verifyEmail);
/**
 * @route   POST /api/v1/auth/resend-verification
 * @desc    Resend email verification
 * @access  Public
 */
router.post('/resend-verification', (0, rateLimit_1.rateLimitStrict)(3, 60 * 60 * 1000), // 3 attempts per hour
(0, validate_1.validate)(auth_schemas_1.authSchemas.resendVerification), authController.resendVerification);
/**
 * @route   POST /api/v1/auth/2fa/setup
 * @desc    Setup two-factor authentication
 * @access  Private
 */
router.post('/2fa/setup', authenticate_1.authenticate, authController.setup2FA);
/**
 * @route   POST /api/v1/auth/2fa/verify
 * @desc    Verify 2FA token
 * @access  Private
 */
router.post('/2fa/verify', authenticate_1.authenticate, (0, validate_1.validate)(auth_schemas_1.authSchemas.verify2FA), authController.verify2FA);
/**
 * @route   POST /api/v1/auth/2fa/disable
 * @desc    Disable two-factor authentication
 * @access  Private
 */
router.post('/2fa/disable', authenticate_1.authenticate, (0, validate_1.validate)(auth_schemas_1.authSchemas.disable2FA), authController.disable2FA);
/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current authenticated user
 * @access  Private
 */
router.get('/me', authenticate_1.authenticate, authController.getCurrentUser);
