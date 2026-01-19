import { logger } from '../utils/logger';
export class SMSProvider {
  async send(options: any): Promise<void> {
    logger.info('Sending SMS', options);
  }
}
