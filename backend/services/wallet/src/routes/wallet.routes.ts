import { Router } from 'express';
import { WalletController } from '../controllers/wallet.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { walletSchemas } from '../schemas/wallet.schemas';

const router = Router();
const controller = new WalletController();

router.get('/balance', authenticate, controller.getBalance);
router.post('/top-up', authenticate, validate(walletSchemas.topUp), controller.topUp);
router.post('/withdraw', authenticate, validate(walletSchemas.withdraw), controller.withdraw);
router.post('/transfer', authenticate, validate(walletSchemas.transfer), controller.transfer);
router.get('/transactions', authenticate, controller.getTransactions);
router.post('/webhook', controller.confirmPayment);

export { router as walletRoutes };
