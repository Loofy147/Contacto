// backend/services/identity/src/routes/user.routes.ts
import { Router } from 'express';

const router = Router();

// Placeholder for user routes
router.get('/', (_req, res) => {
  res.json({ message: 'User service' });
});

export { router as userRoutes };
