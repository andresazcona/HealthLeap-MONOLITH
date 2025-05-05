import { Router } from 'express';
import medicoController from '../controllers/medico.controller';
import validateSchema from '../middlewares/validateSchema';
import { createMedicoSchema, updateMedicoSchema, filtroMedicoSchema } from '../validators/medico.validator';
import authenticate from '../middlewares/authenticate';
import authorize from '../middlewares/authorize';

const router = Router();

// Rutas públicas
router.get('/especialidades', medicoController.getAllEspecialidades);
router.get('/buscar', validateSchema(filtroMedicoSchema), medicoController.getByFilters); // Cambio de buscarMedicos a getByFilters

// Rutas protegidas
router.use(authenticate);

// Rutas para administradores
router.post('/', authorize('admin'), validateSchema(createMedicoSchema), medicoController.create); // Cambio de createMedico a create
router.put('/:id', authorize('admin'), validateSchema(updateMedicoSchema), medicoController.update); // Cambio de updateMedico a update
router.delete('/:id', authorize('admin'), medicoController.delete); // Cambio de deleteMedico a delete
router.get('/', authorize('admin'), medicoController.getAll); // Cambio de getAllMedicos a getAll

// Rutas para médicos
router.get('/perfil', authorize('medico'), medicoController.getProfile); // Cambio de getMedicoPerfil a getProfile

// Rutas para todos los roles autenticados
router.get('/:id', medicoController.getById); // Cambio de getMedicoById a getById

export default router;