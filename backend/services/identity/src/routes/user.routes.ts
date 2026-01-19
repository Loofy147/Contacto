import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.get('/profile', authenticate, (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

export { router as userRoutes };
