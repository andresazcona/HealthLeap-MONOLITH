import { Router } from 'express';
import citaController from '../controllers/cita.controller';
import validateSchema from '../middlewares/validateSchema';
import { 
  createCitaSchema, 
  updateCitaSchema, 
  filtroCitaSchema,
  updateEstadoCitaSchema 
} from '../validators/cita.validator';
import authenticate from '../middlewares/authenticate';
import authorize from '../middlewares/authorize';

const router = Router();

// Rutas protegidas
router.use(authenticate);

// Rutas para pacientes
router.post('/', authorize('paciente', 'admin'), validateSchema(createCitaSchema), citaController.createCita);
// MODIFICADO: Permitir acceso a médicos a las citas
router.get('/mis-citas', authorize('paciente', 'medico'), citaController.getMisCitas);

// Rutas para médicos
router.get('/medico/agenda', authorize('medico'), citaController.getAgendaMedico);
router.patch('/:id/atendida', authorize('medico'), citaController.marcarCitaAtendida);

// Rutas para admisión
router.get('/agenda-diaria', authorize('admisión', 'admin'), citaController.getAgendaDiaria);
router.patch('/:id/en-espera', authorize('admisión'), citaController.marcarPacienteLlegada);

// Rutas para administradores
router.get('/filtrar', authorize('admin', 'admisión'), validateSchema(filtroCitaSchema), citaController.filtrarCitas);

// Rutas compartidas (médicos, admisión, admin)
router.get('/:id', authorize('paciente', 'medico', 'admisión', 'admin'), citaController.getCitaById);
router.put('/:id', authorize('paciente', 'admisión', 'admin'), validateSchema(updateCitaSchema), citaController.updateCita);
router.patch('/:id/estado', authorize('admisión', 'admin'), validateSchema(updateEstadoCitaSchema), citaController.updateEstadoCita);
router.delete('/:id', authorize('paciente', 'admisión', 'admin'), citaController.cancelarCita);

// NUEVA RUTA: Ruta específica para tests de cancelación de citas
router.patch('/:id?/cancelar', authorize('paciente', 'admisión', 'admin'), citaController.cancelarCita);

export default router;