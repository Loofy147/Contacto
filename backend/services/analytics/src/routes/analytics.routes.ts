import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();
const controller = new AnalyticsController();

router.get('/dashboard', authenticate, controller.getDashboardOverview);
router.get('/sales', authenticate, controller.getSalesAnalytics);
router.get('/customers', authenticate, controller.getCustomerAnalytics);
router.get('/reviews', authenticate, controller.getReviewAnalytics);
router.get('/export', authenticate, controller.exportReport);

export { router as analyticsRoutes };
