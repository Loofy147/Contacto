import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { inventorySchemas } from '../schemas/inventory.schemas';

const router = Router();
const controller = new InventoryController();

router.get('/products', authenticate, controller.getProducts);
router.get('/products/:id', authenticate, controller.getProduct);
router.post('/products', authenticate, validate(inventorySchemas.createProduct), controller.createProduct);
router.put('/products/:id', authenticate, controller.updateProduct);
router.post('/products/:id/adjust', authenticate, validate(inventorySchemas.adjustStock), controller.adjustStock);
router.post('/reserve', authenticate, controller.reserveStock);
router.post('/commit/:orderId', authenticate, controller.commitReservation);
router.get('/low-stock', authenticate, controller.getLowStockProducts);
router.get('/products/:id/history', authenticate, controller.getStockHistory);

export { router as inventoryRoutes };
