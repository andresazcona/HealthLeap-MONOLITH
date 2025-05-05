import { Router } from 'express';
import notificationController from '../controllers/notification.controller';
import validateSchema from '../middlewares/validateSchema';
import { emailNotificationSchema } from '../validators/notification.validator';
import authenticate from '../middlewares/authenticate';
import authorize from '../middlewares/authorize';

const router = Router();

// Rutas protegidas
router.use(authenticate);

// Ruta para enviar email de prueba (solo admins y admisión)
router.post('/email', 
  authorize('admin', 'admisión'), 
  validateSchema(emailNotificationSchema), 
  notificationController.sendEmail
);

// Rutas para notificaciones de citas
router.post('/cita-confirmacion/:citaId',
  authorize('admin', 'admisión'),
  notificationController.enviarConfirmacionCita
);

router.post('/cita-actualizacion/:citaId',
  authorize('admin', 'admisión'),
  notificationController.enviarActualizacionCita
);

router.post('/cita-recordatorio/:citaId',
  authorize('admin', 'admisión'),
  notificationController.enviarRecordatorioCita
);

router.post('/cita-cancelacion/:citaId',
  authorize('admin', 'admisión'),
  notificationController.enviarCancelacionCita
);

// Ruta para enviar recordatorios masivos (solo admin)
router.post('/recordatorios-masivos',
  authorize('admin'),
  notificationController.enviarRecordatoriosCitasDiaSiguiente
);

// Ruta para probar estado del servicio de email (admin)
router.get('/status',
  authorize('admin'),
  notificationController.verificarEstadoServicio
);

export default router;