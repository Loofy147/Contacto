import { Router } from 'express';
import { AppointmentController } from '../controllers/appointment.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();
const controller = new AppointmentController();

router.post('/', authenticate, controller.create);
router.get('/user', authenticate, controller.getUserAppointments);
router.get('/professional', authenticate, controller.getProfessionalAppointments);
router.get('/availability/:professionalId', controller.getAvailability);
router.patch('/:id/confirm', authenticate, controller.confirm);
router.patch('/:id/cancel', authenticate, controller.cancel);
router.patch('/:id/complete', authenticate, controller.complete);

export { router as appointmentRoutes };
