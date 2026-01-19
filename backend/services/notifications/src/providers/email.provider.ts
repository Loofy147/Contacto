// ============================================================================

import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from '../config';
import { logger } from '../utils/logger';
import { redis } from '../lib/redis';

interface EmailOptions {
  to: string | string[];
  template: string;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

export class EmailProvider {
  private transporter: nodemailer.Transporter;
  private templates: Map<string, HandlebarsTemplateDelegate>;

  constructor() {
    this.templates = new Map();
    this.initializeTransporter();
    this.loadTemplates();
  }

  private initializeTransporter(): void {
    // Use SendGrid if available, otherwise SMTP
    if (config.email.sendgrid.apiKey) {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        auth: {
          user: 'apikey',
          pass: config.email.sendgrid.apiKey,
        },
      });
    } else {
      this.transporter = nodemailer.createTransport({
        host: config.email.smtp.host,
        port: config.email.smtp.port,
        auth: {
          user: config.email.smtp.user,
          pass: config.email.smtp.pass,
        },
      });
    }
  }

  private loadTemplates(): void {
    const templateDir = join(__dirname, '../templates/email');
    const templates = [
      'welcome',
      'email-verified',
      'password-reset',
      'professional-welcome',
      'verification-approved',
      'new-review',
      'appointment-confirmation-customer',
      'appointment-confirmation-professional',
      'appointment-reminder',
      'appointment-cancelled-customer',
      'appointment-cancelled-professional',
      'payment-receipt',
      'payment-failed',
    ];

    templates.forEach((templateName) => {
      try {
        const templatePath = join(templateDir, `${templateName}.hbs`);
        const templateContent = readFileSync(templatePath, 'utf-8');
        this.templates.set(templateName, handlebars.compile(templateContent));
      } catch (error) {
        logger.warn(`Template not found: ${templateName}`);
      }
    });
  }

  async send(options: EmailOptions): Promise<void> {
    const { to, template, data, metadata } = options;

    try {
      // Check rate limiting (prevent spam)
      const emailArray = Array.isArray(to) ? to : [to];
      for (const email of emailArray) {
        const rateLimitKey = `email:ratelimit:${email}`;
        const count = await redis.incr(rateLimitKey);

        if (count === 1) {
          await redis.expire(rateLimitKey, 3600); // 1 hour
        }

        if (count > 10) {
          logger.warn('Email rate limit exceeded:', { email });
          throw new Error('Email rate limit exceeded');
        }
      }

      // Get template
      const templateFn = this.templates.get(template);
      if (!templateFn) {
        throw new Error(`Template not found: ${template}`);
      }

      // Render template
      const html = templateFn({
        ...data,
        year: new Date().getFullYear(),
        appUrl: config.appUrl,
        supportEmail: config.supportEmail,
      });

      // Send email
      const info = await this.transporter.sendMail({
        from: `${config.email.from.name} <${config.email.from.email}>`,
        to,
        subject: this.getSubject(template, data),
        html,
      });

      // Log success
      logger.info('Email sent successfully:', {
        messageId: info.messageId,
        to,
        template,
        metadata,
      });

      // Track in analytics
      await this.trackEmailSent(template, emailArray.length);
    } catch (error) {
      logger.error('Failed to send email:', { error, to, template });
      throw error;
    }
  }

  private getSubject(template: string, data: Record<string, any>): string {
    const subjects: Record<string, string> = {
      'welcome': 'مرحباً بك في كونتاكتو! 🎉',
      'email-verified': 'تم تأكيد بريدك الإلكتروني ✓',
      'password-reset': 'إعادة تعيين كلمة المرور',
      'professional-welcome': `مرحباً بك في كونتاكتو، ${data.businessName}!`,
      'verification-approved': 'تم التحقق من حسابك! ✓',
      'new-review': `تقييم جديد لـ ${data.businessName}`,
      'appointment-confirmation-customer': 'تأكيد الموعد',
      'appointment-confirmation-professional': 'موعد جديد',
      'appointment-reminder': 'تذكير بالموعد غداً',
      'appointment-cancelled-customer': 'تم إلغاء الموعد',
      'appointment-cancelled-professional': 'تم إلغاء الموعد',
      'payment-receipt': 'إيصال الدفع',
      'payment-failed': 'فشل الدفع',
    };

    return subjects[template] || 'إشعار من كونتاكتو';
  }

  private async trackEmailSent(template: string, count: number): Promise<void> {
    const key = `analytics:emails:${template}:${new Date().toISOString().split('T')[0]}`;
    await redis.incrby(key, count);
    await redis.expire(key, 86400 * 30); // 30 days
  }
}