import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'UP', service: 'identity-service', database: 'CONNECTED' });
  } catch (error) {
    res.status(503).json({ status: 'DOWN', service: 'identity-service', database: 'DISCONNECTED' });
  }
});

export { router as healthRoutes };
