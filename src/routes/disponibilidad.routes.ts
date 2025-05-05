import { Router } from 'express';
import disponibilidadController from '../controllers/disponibilidad.controller';
import validateSchema from '../middlewares/validateSchema';
import { disponibilidadQuerySchema, configuracionAgendaSchema } from '../validators/disponibilidad.validator';
import authenticate from '../middlewares/authenticate';
import authorize from '../middlewares/authorize';

const router = Router();

// Rutas públicas para verificar disponibilidad
router.get('/medico/:medicoId/fecha/:fecha', validateSchema(disponibilidadQuerySchema), disponibilidadController.getDisponibilidadMedico);

// Rutas protegidas
router.use(authenticate);

// Rutas para administradores y médicos
router.post('/bloquear', 
  authorize('admin', 'medico'), 
  validateSchema(configuracionAgendaSchema), 
  disponibilidadController.bloquearHorarios
);

// Rutas para administradores
router.delete('/medico/:medicoId/fecha/:fecha', 
  authorize('admin'), 
  disponibilidadController.cerrarAgenda
);

router.get('/agenda-completa/:fecha',
  authorize('admin', 'admisión'),
  disponibilidadController.getAgendaGlobal
);

export default router;