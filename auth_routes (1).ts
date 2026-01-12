// backend/services/identity/src/routes/auth.routes.ts
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { authSchemas } from '../schemas/auth.schemas';
import { authenticate } from '../middleware/authenticate';
import { rateLimitStrict } from '../middleware/rateLimit';

const router = Router();
const authController = new AuthController();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  rateLimitStrict(5, 15 * 60 * 1000), // 5 attempts per 15 minutes
  validate(authSchemas.register),
  authController.register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user and return JWT
 * @access  Public
 */
router.post(
  '/login',
  rateLimitStrict(10, 15 * 60 * 1000), // 10 attempts per 15 minutes
  validate(authSchemas.login),
  authController.login
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (blacklist token)
 * @access  Private
 */
router.post(
  '/logout',
  authenticate,
  authController.logout
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post(
  '/refresh',
  validate(authSchemas.refresh),
  authController.refresh
);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post(
  '/forgot-password',
  rateLimitStrict(3, 60 * 60 * 1000), // 3 attempts per hour
  validate(authSchemas.forgotPassword),
  authController.forgotPassword
);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post(
  '/reset-password',
  validate(authSchemas.resetPassword),
  authController.resetPassword
);

/**
 * @route   POST /api/v1/auth/verify-email
 * @desc    Verify email address
 * @access  Public
 */
router.post(
  '/verify-email',
  validate(authSchemas.verifyEmail),
  authController.verifyEmail
);

/**
 * @route   POST /api/v1/auth/resend-verification
 * @desc    Resend email verification
 * @access  Public
 */
router.post(
  '/resend-verification',
  rateLimitStrict(3, 60 * 60 * 1000), // 3 attempts per hour
  validate(authSchemas.resendVerification),
  authController.resendVerification
);

/**
 * @route   POST /api/v1/auth/2fa/setup
 * @desc    Setup two-factor authentication
 * @access  Private
 */
router.post(
  '/2fa/setup',
  authenticate,
  authController.setup2FA
);

/**
 * @route   POST /api/v1/auth/2fa/verify
 * @desc    Verify 2FA token
 * @access  Private
 */
router.post(
  '/2fa/verify',
  authenticate,
  validate(authSchemas.verify2FA),
  authController.verify2FA
);

/**
 * @route   POST /api/v1/auth/2fa/disable
 * @desc    Disable two-factor authentication
 * @access  Private
 */
router.post(
  '/2fa/disable',
  authenticate,
  validate(authSchemas.disable2FA),
  authController.disable2FA
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current authenticated user
 * @access  Private
 */
router.get(
  '/me',
  authenticate,
  authController.getCurrentUser
);

export { router as authRoutes };