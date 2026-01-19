import { Router } from 'express';
import { WalletController } from '../controllers/wallet.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();
const controller = new WalletController();

router.get('/balance', authenticate, controller.getBalance);
router.post('/top-up', authenticate, controller.topUp);
router.post('/withdraw', authenticate, controller.withdraw);
router.post('/transfer', authenticate, controller.transfer);
router.get('/transactions', authenticate, controller.getTransactions);
router.post('/webhook', controller.confirmPayment);

export { router as walletRoutes };
