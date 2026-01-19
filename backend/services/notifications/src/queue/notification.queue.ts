import { logger } from '../utils/logger';
export class NotificationQueue {
  async addToDeadLetterQueue(options: any): Promise<void> {
    logger.error('Added to DLQ', options);
  }
}
