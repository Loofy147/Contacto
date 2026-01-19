import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();
const controller = new PaymentController();

router.post('/', authenticate, controller.createPayment);
router.get('/:id', authenticate, controller.getPayment);
router.post('/webhook', controller.handleWebhook);
router.post('/:id/refund', authenticate, controller.processRefund);
router.get('/methods', authenticate, controller.getPaymentMethods);
router.get('/history', authenticate, controller.getPaymentHistory);

export { router as paymentRoutes };
