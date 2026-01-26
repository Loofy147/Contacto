// backend/services/identity/src/routes/health.routes.ts
import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ status: 'UP' });
});

export { router as healthRoutes };
