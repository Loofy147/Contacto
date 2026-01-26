import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { paymentSchemas } from '../schemas/payment.schemas';

const router = Router();
const controller = new PaymentController();

router.post('/', authenticate, validate(paymentSchemas.createPayment), controller.createPayment);
router.get('/:id', authenticate, controller.getPayment);
router.post('/webhook', controller.handleWebhook);
router.post('/:id/refund', authenticate, validate(paymentSchemas.refund), controller.processRefund);
router.get('/methods', authenticate, controller.getPaymentMethods);
router.get('/history', authenticate, controller.getPaymentHistory);

export { router as paymentRoutes };
