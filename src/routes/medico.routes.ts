import { Router } from 'express';
import medicoController from '../controllers/medico.controller';
import validateSchema from '../middlewares/validateSchema';
import { updateMedicoSchema, filtroMedicoSchema, createMedicoCompletoSchema } from '../validators/medico.validator';
import authenticate from '../middlewares/authenticate';
import authorize from '../middlewares/authorize';

const router = Router();

// Rutas públicas
router.get('/especialidades', medicoController.getAllEspecialidades);
router.get('/buscar', validateSchema(filtroMedicoSchema), medicoController.getByFilters);

// NUEVA RUTA - Crear médico en formato plano para pruebas
router.post('/', authenticate, authorize('admin'), (req, res, next) => {
  // Convertir estructura plana a estructura esperada
  const medicoData = {
    usuario: {
      nombre: req.body.nombre,
      email: req.body.email,
      password: req.body.password
    },
    especialidad: req.body.especialidad,
    centro_id: req.body.centro_id,
    duracion_cita: req.body.duracion_cita || 30
  };
  
  // Reemplazar el body original
  req.body = medicoData;
  
  // Continuar al controlador original
  validateSchema(createMedicoCompletoSchema)(req, res, () => {
    medicoController.create(req, res, next);
  });
});

// Rutas protegidas
router.use(authenticate);

// Rutas para médicos
router.get('/perfil', authorize('medico'), medicoController.getProfile);
router.patch('/perfil', authorize('medico'), validateSchema(updateMedicoSchema), medicoController.update);

// Rutas para administradores
router.post('/completo', authorize('admin'), validateSchema(createMedicoCompletoSchema), medicoController.create);
router.get('/', authorize('admin'), medicoController.getAll);
router.get('/:id', authorize('admin'), medicoController.getById);
router.patch('/:id', authorize('admin'), validateSchema(updateMedicoSchema), medicoController.update);
router.delete('/:id', authorize('admin'), medicoController.delete);

export default router;