import { Router } from 'express';
import disponibilidadController from '../controllers/disponibilidad.controller';
import validateSchema from '../middlewares/validateSchema';
import { disponibilidadQuerySchema, configuracionAgendaSchema } from '../validators/disponibilidad.validator';
import authenticate from '../middlewares/authenticate';
import authorize from '../middlewares/authorize';

const router = Router();

// Pública: horarios libres de un médico en una fecha
router.get('/medico/:medicoId/fecha/:fecha', validateSchema(disponibilidadQuerySchema, 'params'), disponibilidadController.getDisponibilidadMedico);

// Rutas protegidas
router.use(authenticate);

router.post('/bloquear',
  authorize('admin', 'medico'),
  validateSchema(configuracionAgendaSchema),
  disponibilidadController.bloquearHorarios
);

router.delete('/medico/:medicoId/fecha/:fecha', 
  authorize('admin'), 
  disponibilidadController.cerrarAgenda
);

router.get('/agenda-completa/:fecha',
  authorize('admin', 'admisión'),
  disponibilidadController.getAgendaGlobal
);

export default router;
