import { Router } from 'express';
import { SalesController } from '../controllers/sales.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();
const controller = new SalesController();

router.post('/', authenticate, controller.createSale);
router.get('/:id', authenticate, controller.getSale);
router.get('/', authenticate, controller.getSales);
router.post('/:id/refund', authenticate, controller.processRefund);
router.get('/report/daily', authenticate, controller.getDailyReport);
router.post('/reconciliation', authenticate, controller.endOfDay);

export { router as salesRoutes };
