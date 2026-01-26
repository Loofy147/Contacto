import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

export const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'stdout',
      level: 'error',
    },
    {
      emit: 'stdout',
      level: 'info',
    },
    {
      emit: 'stdout',
      level: 'warn',
    },
  ],
});

// TUBER: Query Performance Monitoring
(prisma as any).$on('query', (e: any) => {
  if (e.duration >= 100) {
    logger.warn('🐌 Slow Query Detected', {
      query: e.query,
      params: e.params,
      duration: `${e.duration}ms`,
    });
  } else {
    logger.debug('Prisma Query', {
      query: e.query,
      duration: `${e.duration}ms`,
    });
  }
});
