// backend/services/identity/src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { kafka } from '../lib/kafka';
import { config } from '../config';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { EmailService } from '../services/email.service';
import { generateToken, generateRefreshToken, verifyToken } from '../utils/jwt';
import { hashPassword, comparePassword } from '../utils/password';

export class AuthController {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Register a new user
   */
  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, firstName, lastName, phone } = req.body;

      // Check if user exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            ...(phone ? [{ phone }] : []),
          ],
        },
      });

      if (existingUser) {
        throw new AppError(409, 'USER_EXISTS', 'User already exists with this email or phone');
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const user = await prisma.user.create({
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
      const verificationToken = generateToken({ userId: user.id, type: 'email_verification' }, '24h');
      
      await prisma.verificationToken.create({
        data: {
          userId: user.id,
          token: verificationToken,
          type: 'EMAIL',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      // Send verification email
      await this.emailService.sendVerificationEmail(user.email, verificationToken);

      // Generate JWT tokens
      const accessToken = generateToken({ userId: user.id, email: user.email, role: user.role });
      const refreshToken = await generateRefreshToken(user.id);

      // Publish user registered event
      await kafka.send({
        topic: config.kafka.topics.userEvents,
        messages: [{
          key: user.id,
          value: JSON.stringify({
            eventType: 'USER_REGISTERED',
            eventId: crypto.randomUUID(),
            timestamp: new Date(),
            data: {
              userId: user.id,
              email: user.email,
              role: user.role,
            },
          }),
        }],
      });

      logger.info('User registered successfully', { userId: user.id, email: user.email });

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
    } catch (error) {
      next(error);
    }
  };

  /**
   * Login user
   */
  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
      }

      // Check if user is active
      if (user.status !== 'ACTIVE') {
        throw new AppError(403, 'ACCOUNT_SUSPENDED', 'Your account has been suspended');
      }

      // Verify password
      const isPasswordValid = await comparePassword(password, user.password);
      
      if (!isPasswordValid) {
        throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
      }

      // Check if 2FA is enabled
      if (user.twoFactorEnabled) {
        // Generate temporary token for 2FA verification
        const tempToken = generateToken({ userId: user.id, requires2FA: true }, '5m');
        
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
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          lastLoginIp: req.ip,
          loginCount: { increment: 1 },
        },
      });

      // Generate tokens
      const accessToken = generateToken({ userId: user.id, email: user.email, role: user.role });
      const refreshToken = await generateRefreshToken(user.id);

      // Create session
      await prisma.session.create({
        data: {
          userId: user.id,
          token: accessToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      // Publish login event
      await kafka.send({
        topic: config.kafka.topics.userEvents,
        messages: [{
          key: user.id,
          value: JSON.stringify({
            eventType: 'USER_LOGGED_IN',
            eventId: crypto.randomUUID(),
            timestamp: new Date(),
            data: {
              userId: user.id,
              ip: req.ip,
            },
          }),
        }],
      });

      logger.info('User logged in successfully', { userId: user.id, email: user.email });

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
    } catch (error) {
      next(error);
    }
  };

  /**
   * Logout user
   */
  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const token = req.headers.authorization?.split(' ')[1];

      if (token) {
        // Delete session
        await prisma.session.deleteMany({
          where: {
            userId,
            token,
          },
        });

        // Blacklist token in Redis
        const decoded = jwt.decode(token) as any;
        const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
        
        if (expiresIn > 0) {
          await redis.setEx(`blacklist:${token}`, expiresIn, '1');
        }
      }

      logger.info('User logged out', { userId });

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Refresh access token
   */
  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new AppError(400, 'MISSING_REFRESH_TOKEN', 'Refresh token is required');
      }

      // Verify refresh token
      const decoded = verifyToken(refreshToken, config.jwt.refreshSecret);

      // Check if refresh token exists in database
      const tokenRecord = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
        throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token');
      }

      // Generate new tokens
      const newAccessToken = generateToken({
        userId: tokenRecord.user.id,
        email: tokenRecord.user.email,
        role: tokenRecord.user.role,
      });

      const newRefreshToken = await generateRefreshToken(tokenRecord.user.id);

      // Delete old refresh token
      await prisma.refreshToken.delete({
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
    } catch (error) {
      next(error);
    }
  };

  /**
   * Send password reset email
   */
  forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;

      const user = await prisma.user.findUnique({
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
      const resetToken = generateToken({ userId: user.id, type: 'password_reset' }, '1h');

      await prisma.passwordReset.create({
        data: {
          userId: user.id,
          token: resetToken,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      // Send reset email
      await this.emailService.sendPasswordResetEmail(user.email, resetToken);

      logger.info('Password reset email sent', { userId: user.id });

      res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Reset password with token
   */
  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, newPassword } = req.body;

      const resetRecord = await prisma.passwordReset.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!resetRecord || resetRecord.expiresAt < new Date() || resetRecord.usedAt) {
        throw new AppError(400, 'INVALID_RESET_TOKEN', 'Invalid or expired reset token');
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password
      await prisma.user.update({
        where: { id: resetRecord.userId },
        data: { password: hashedPassword },
      });

      // Mark reset token as used
      await prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      });

      // Invalidate all sessions
      await prisma.session.deleteMany({
        where: { userId: resetRecord.userId },
      });

      await prisma.refreshToken.deleteMany({
        where: { userId: resetRecord.userId },
      });

      logger.info('Password reset successful', { userId: resetRecord.userId });

      res.json({
        success: true,
        message: 'Password reset successful. Please login with your new password.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Verify email address
   */
  verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.body;

      const verificationRecord = await prisma.verificationToken.findUnique({
        where: { token },
      });

      if (!verificationRecord || verificationRecord.expiresAt < new Date()) {
        throw new AppError(400, 'INVALID_VERIFICATION_TOKEN', 'Invalid or expired verification token');
      }

      // Update user
      await prisma.user.update({
        where: { id: verificationRecord.userId },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
      });

      // Delete verification token
      await prisma.verificationToken.delete({
        where: { id: verificationRecord.id },
      });

      // Publish event
      await kafka.send({
        topic: config.kafka.topics.userEvents,
        messages: [{
          key: verificationRecord.userId,
          value: JSON.stringify({
            eventType: 'EMAIL_VERIFIED',
            eventId: crypto.randomUUID(),
            timestamp: new Date(),
            data: { userId: verificationRecord.userId },
          }),
        }],
      });

      logger.info('Email verified', { userId: verificationRecord.userId });

      res.json({
        success: true,
        message: 'Email verified successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Resend verification email
   */
  resendVerification = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
      }

      if (user.emailVerified) {
        throw new AppError(400, 'ALREADY_VERIFIED', 'Email is already verified');
      }

      // Delete old verification tokens
      await prisma.verificationToken.deleteMany({
        where: {
          userId: user.id,
          type: 'EMAIL',
        },
      });

      // Generate new token
      const verificationToken = generateToken({ userId: user.id, type: 'email_verification' }, '24h');
      
      await prisma.verificationToken.create({
        data: {
          userId: user.id,
          token: verificationToken,
          type: 'EMAIL',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      // Send email
      await this.emailService.sendVerificationEmail(user.email, verificationToken);

      res.json({
        success: true,
        message: 'Verification email sent',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Setup 2FA
   */
  setup2FA = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
      }

      if (user.twoFactorEnabled) {
        throw new AppError(400, '2FA_ALREADY_ENABLED', '2FA is already enabled');
      }

      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `${config.totp.issuer} (${user.email})`,
        issuer: config.totp.issuer,
      });

      // Generate QR code
      const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

      // Store secret temporarily in Redis (not yet enabled)
      await redis.setEx(`2fa:setup:${userId}`, 600, secret.base32); // 10 minutes

      res.json({
        success: true,
        message: '2FA setup initiated',
        data: {
          secret: secret.base32,
          qrCode,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Verify 2FA and enable
   */
  verify2FA = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { token } = req.body;

      // Get temporary secret from Redis
      const secret = await redis.get(`2fa:setup:${userId}`);

      if (!secret) {
        throw new AppError(400, '2FA_SETUP_EXPIRED', '2FA setup has expired. Please start again.');
      }

      // Verify token
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: config.totp.window,
      });

      if (!verified) {
        throw new AppError(400, 'INVALID_2FA_TOKEN', 'Invalid 2FA token');
      }

      // Enable 2FA
      await prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: true,
          twoFactorSecret: secret,
        },
      });

      // Delete temporary secret
      await redis.del(`2fa:setup:${userId}`);

      logger.info('2FA enabled', { userId });

      res.json({
        success: true,
        message: '2FA enabled successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Disable 2FA
   */
  disable2FA = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { password } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
      }

      // Verify password
      const isPasswordValid = await comparePassword(password, user.password);
      
      if (!isPasswordValid) {
        throw new AppError(401, 'INVALID_PASSWORD', 'Invalid password');
      }

      // Disable 2FA
      await prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
        },
      });

      logger.info('2FA disabled', { userId });

      res.json({
        success: true,
        message: '2FA disabled successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get current user
   */
  getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const cacheKey = `user:profile:${userId}`;

      // BOLT: Try cache first
      const cachedUser = await redis.get(cacheKey);
      if (cachedUser) {
        logger.debug('User profile cache hit', { userId });
        return res.json({
          success: true,
          data: { user: JSON.parse(cachedUser) },
        });
      }

      logger.debug('User profile cache miss', { userId });
      const user = await prisma.user.findUnique({
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
        throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
      }

      // BOLT: Cache for 5 minutes
      await redis.setEx(cacheKey, 300, JSON.stringify(user));

      res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  };
}