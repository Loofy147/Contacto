// backend/services/notifications/src/index.ts
import { createServer } from 'http';
import express from 'express';
import { kafka } from './lib/kafka';
import { config } from './config';
import { logger } from './utils/logger';
import { EmailProvider } from './providers/email.provider';
// @ts-ignore
import { SMSProvider } from './providers/sms.provider';
import { PushProvider } from './providers/push.provider';
import { NotificationQueue } from './queue/notification.queue';

class NotificationsService {
  private app: express.Application;
  private emailProvider: EmailProvider;
  private smsProvider: SMSProvider;
  private pushProvider: PushProvider;
  private queue: NotificationQueue;

  constructor() {
    this.app = express();
    this.emailProvider = new EmailProvider();
    this.smsProvider = new SMSProvider();
    this.pushProvider = new PushProvider();
    this.queue = new NotificationQueue();

    this.setupHealthCheck();
  }

  private setupHealthCheck(): void {
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'notifications-service',
        timestamp: new Date().toISOString(),
      });
    });
  }

  async start(): Promise<void> {
    try {
      // Connect to Kafka
      await kafka.connect();
      logger.info('✅ Kafka connected');

      // Subscribe to events
      await kafka.subscribe({
        topics: [
          'user.events',
          'professional.events',
          'appointment.events',
          'payment.events',
          'review.events',
        ],
        fromBeginning: false,
      });

      // Start consuming messages
      await kafka.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const event = JSON.parse(message.value?.toString() || '{}');
            await this.handleEvent(topic, event);
          } catch (error) {
            logger.error('Error processing message:', { error, topic, partition });
          }
        },
      });

      // Start HTTP server for health checks
      const server = createServer(this.app);
      server.listen(config.port, () => {
        logger.info(`
🚀 Notifications Service started successfully!

Environment: ${config.nodeEnv}
Port: ${config.port}
Health Check: http://localhost:${config.port}/health
        `);
      });

      // Graceful shutdown
      this.setupGracefulShutdown(server);
    } catch (error) {
      logger.error('❌ Failed to start Notifications Service:', error);
      process.exit(1);
    }
  }

  private async handleEvent(topic: string, event: any): Promise<void> {
    const { eventType, data } = event;

    logger.info('Processing event:', { topic, eventType });

    try {
      switch (eventType) {
        // User Events
        case 'USER_REGISTERED':
          await this.sendWelcomeEmail(data);
          break;

        case 'EMAIL_VERIFIED':
          await this.sendEmailVerifiedNotification(data);
          break;

        case 'PASSWORD_RESET_REQUESTED':
          await this.sendPasswordResetEmail(data);
          break;

        // Professional Events
        case 'PROFESSIONAL_CREATED':
          await this.sendProfessionalWelcomeEmail(data);
          break;

        case 'PROFESSIONAL_VERIFIED':
          await this.sendVerificationApprovedEmail(data);
          break;

        case 'NEW_REVIEW_RECEIVED':
          await this.sendNewReviewNotification(data);
          break;

        // Appointment Events
        case 'APPOINTMENT_CREATED':
          await this.sendAppointmentConfirmation(data);
          break;

        case 'APPOINTMENT_REMINDER':
          await this.sendAppointmentReminder(data);
          break;

        case 'APPOINTMENT_CANCELLED':
          await this.sendAppointmentCancellation(data);
          break;

        // Payment Events
        case 'PAYMENT_SUCCESS':
          await this.sendPaymentReceipt(data);
          break;

        case 'PAYMENT_FAILED':
          await this.sendPaymentFailureNotification(data);
          break;

        default:
          logger.warn('Unhandled event type:', eventType);
      }
    } catch (error) {
      logger.error('Error handling event:', { error, eventType });
      // Add to dead letter queue for retry
      await this.queue.addToDeadLetterQueue({ topic, event, error });
    }
  }

  // ============================================================================
  // EMAIL NOTIFICATIONS
  // ============================================================================

  private async sendWelcomeEmail(data: any): Promise<void> {
    const { userId, email, firstName } = data;

    await this.emailProvider.send({
      to: email,
      template: 'welcome',
      data: {
        firstName: firstName || 'صديقنا العزيز',
        loginUrl: `${config.appUrl}/login`,
        supportEmail: config.supportEmail,
      },
      metadata: { userId, eventType: 'USER_REGISTERED' },
    });

    logger.info('Welcome email sent:', { userId, email });
  }

  private async sendEmailVerifiedNotification(data: any): Promise<void> {
    const { userId, email } = data;

    await this.emailProvider.send({
      to: email,
      template: 'email-verified',
      data: {
        dashboardUrl: `${config.appUrl}/dashboard`,
      },
      metadata: { userId, eventType: 'EMAIL_VERIFIED' },
    });
  }

  private async sendPasswordResetEmail(data: any): Promise<void> {
    const { email, token, firstName } = data;

    await this.emailProvider.send({
      to: email,
      template: 'password-reset',
      data: {
        firstName,
        resetUrl: `${config.appUrl}/reset-password?token=${token}`,
        expiresIn: '1 hour',
      },
      metadata: { eventType: 'PASSWORD_RESET_REQUESTED' },
    });
  }

  private async sendProfessionalWelcomeEmail(data: any): Promise<void> {
    const { professionalId, email, businessName } = data;

    await this.emailProvider.send({
      to: email,
      template: 'professional-welcome',
      data: {
        businessName,
        dashboardUrl: `${config.appUrl}/dashboard`,
        verificationGuideUrl: `${config.appUrl}/verification-guide`,
      },
      metadata: { professionalId, eventType: 'PROFESSIONAL_CREATED' },
    });
  }

  private async sendVerificationApprovedEmail(data: any): Promise<void> {
    const { professionalId, email, businessName } = data;

    await this.emailProvider.send({
      to: email,
      template: 'verification-approved',
      data: {
        businessName,
        profileUrl: `${config.appUrl}/professionals/${professionalId}`,
      },
      metadata: { professionalId, eventType: 'PROFESSIONAL_VERIFIED' },
    });
  }

  private async sendNewReviewNotification(data: any): Promise<void> {
    const { professionalId, email, businessName, rating, reviewText } = data;

    // Send email
    await this.emailProvider.send({
      to: email,
      template: 'new-review',
      data: {
        businessName,
        rating,
        reviewText: reviewText?.substring(0, 200),
        reviewUrl: `${config.appUrl}/dashboard/reviews`,
      },
      metadata: { professionalId, eventType: 'NEW_REVIEW_RECEIVED' },
    });

    // Send push notification
    await this.pushProvider.send({
      userId: professionalId,
      title: 'تقييم جديد! ⭐',
      body: `حصلت على تقييم ${rating} نجوم`,
      data: {
        type: 'new_review',
        url: '/dashboard/reviews',
      },
    });
  }

  // ============================================================================
  // APPOINTMENT NOTIFICATIONS
  // ============================================================================

  private async sendAppointmentConfirmation(data: any): Promise<void> {
    const {
      appointmentId,
      customerEmail,
      customerPhone,
      professionalEmail,
      businessName,
      scheduledAt,
      serviceName,
    } = data;

    // Email to customer
    await this.emailProvider.send({
      to: customerEmail,
      template: 'appointment-confirmation-customer',
      data: {
        businessName,
        serviceName,
        scheduledAt: new Date(scheduledAt).toLocaleString('ar-DZ'),
        appointmentUrl: `${config.appUrl}/appointments/${appointmentId}`,
      },
      metadata: { appointmentId, eventType: 'APPOINTMENT_CREATED' },
    });

    // SMS to customer
    if (customerPhone) {
      await this.smsProvider.send({
        to: customerPhone,
        message: `تم تأكيد موعدك مع ${businessName} في ${new Date(scheduledAt).toLocaleString('ar-DZ')}`,
        metadata: { appointmentId },
      });
    }

    // Email to professional
    await this.emailProvider.send({
      to: professionalEmail,
      template: 'appointment-confirmation-professional',
      data: {
        serviceName,
        scheduledAt: new Date(scheduledAt).toLocaleString('ar-DZ'),
        appointmentUrl: `${config.appUrl}/dashboard/appointments/${appointmentId}`,
      },
      metadata: { appointmentId, eventType: 'APPOINTMENT_CREATED' },
    });
  }

  private async sendAppointmentReminder(data: any): Promise<void> {
    const { appointmentId, customerEmail, customerPhone, businessName, scheduledAt } = data;

    // Email reminder
    await this.emailProvider.send({
      to: customerEmail,
      template: 'appointment-reminder',
      data: {
        businessName,
        scheduledAt: new Date(scheduledAt).toLocaleString('ar-DZ'),
        appointmentUrl: `${config.appUrl}/appointments/${appointmentId}`,
      },
      metadata: { appointmentId, eventType: 'APPOINTMENT_REMINDER' },
    });

    // SMS reminder
    if (customerPhone) {
      await this.smsProvider.send({
        to: customerPhone,
        message: `تذكير: لديك موعد مع ${businessName} غداً في ${new Date(scheduledAt).toLocaleString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}`,
        metadata: { appointmentId },
      });
    }

    // Push notification
    await this.pushProvider.send({
      userId: data.customerId,
      title: 'تذكير بالموعد 📅',
      body: `موعدك مع ${businessName} غداً`,
      data: {
        type: 'appointment_reminder',
        appointmentId,
      },
    });
  }

  private async sendAppointmentCancellation(data: any): Promise<void> {
    const { appointmentId, customerEmail, professionalEmail, businessName, cancelReason } = data;

    // Email to customer
    await this.emailProvider.send({
      to: customerEmail,
      template: 'appointment-cancelled-customer',
      data: {
        businessName,
        cancelReason,
        searchUrl: `${config.appUrl}/professionals`,
      },
      metadata: { appointmentId, eventType: 'APPOINTMENT_CANCELLED' },
    });

    // Email to professional
    await this.emailProvider.send({
      to: professionalEmail,
      template: 'appointment-cancelled-professional',
      data: {
        cancelReason,
        dashboardUrl: `${config.appUrl}/dashboard/appointments`,
      },
      metadata: { appointmentId, eventType: 'APPOINTMENT_CANCELLED' },
    });
  }

  // ============================================================================
  // PAYMENT NOTIFICATIONS
  // ============================================================================

  private async sendPaymentReceipt(data: any): Promise<void> {
    const { transactionId, email, amount, description } = data;

    await this.emailProvider.send({
      to: email,
      template: 'payment-receipt',
      data: {
        transactionId,
        amount: `${amount.toLocaleString()} DZD`,
        description,
        date: new Date().toLocaleString('ar-DZ'),
        receiptUrl: `${config.appUrl}/receipts/${transactionId}`,
      },
      metadata: { transactionId, eventType: 'PAYMENT_SUCCESS' },
    });
  }

  private async sendPaymentFailureNotification(data: any): Promise<void> {
    const { email, amount, reason } = data;

    await this.emailProvider.send({
      to: email,
      template: 'payment-failed',
      data: {
        amount: `${amount.toLocaleString()} DZD`,
        reason,
        supportEmail: config.supportEmail,
        retryUrl: `${config.appUrl}/retry-payment`,
      },
      metadata: { eventType: 'PAYMENT_FAILED' },
    });
  }

  private setupGracefulShutdown(server: any): void {
    const shutdown = async (signal: string) => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await kafka.disconnect();
          logger.info('Kafka disconnected');

          logger.info('✅ Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }
}

// Start the service
const service = new NotificationsService();
service.start();

// ============================================================================
