import { logger } from '../utils/logger';

export class EmailService {
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    logger.info(`Sending verification email to ${email} with token ${token}`);
    // Mock implementation
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    logger.info(`Sending password reset email to ${email} with token ${token}`);
    // Mock implementation
  }
}
