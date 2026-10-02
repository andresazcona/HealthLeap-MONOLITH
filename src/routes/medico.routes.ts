import { Router } from 'express';
import medicoController from '../controllers/medico.controller';
import validateSchema from '../middlewares/validateSchema';
import { updateMedicoSchema, filtroMedicoSchema, createMedicoCompletoSchema } from '../validators/medico.validator';
import authenticate from '../middlewares/authenticate';
import authorize from '../middlewares/authorize';

const router = Router();

// Rutas públicas
router.get('/especialidades', medicoController.getAllEspecialidades);
router.get('/buscar', validateSchema(filtroMedicoSchema, 'query'), medicoController.getByFilters);

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