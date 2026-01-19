import { logger } from '../utils/logger';
export class PushProvider {
  async send(options: any): Promise<void> {
    logger.info('Sending Push Notification', options);
  }
}
