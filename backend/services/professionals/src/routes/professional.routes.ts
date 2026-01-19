import { Router } from 'express';
import { ProfessionalController } from '../controllers/professional.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { professionalSchemas } from '../schemas/professional.schemas';

const router = Router();
const controller = new ProfessionalController();

router.post('/', authenticate, validate(professionalSchemas.create), controller.create);
router.get('/search', controller.search);
router.get('/nearby', controller.getNearby);
router.get('/:id', controller.get);
router.put('/me', authenticate, validate(professionalSchemas.update), controller.update);
router.post('/me/services', authenticate, controller.addService);
router.post('/me/portfolio', authenticate, controller.addPortfolioItem);

export { router as professionalRoutes };
