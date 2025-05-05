import { Router } from 'express';
import admisionController from '../controllers/admision.controller';
import validateSchema from '../middlewares/validateSchema';
import { createAdmisionSchema, updateAdmisionSchema } from '../validators/admision.validator';
import authenticate from '../middlewares/authenticate';
import authorize from '../middlewares/authorize';

const router = Router();

// Rutas protegidas
router.use(authenticate);

// Rutas para administradores
router.post('/', authorize('admin'), validateSchema(createAdmisionSchema), admisionController.createAdmision);
router.put('/:id', authorize('admin'), validateSchema(updateAdmisionSchema), admisionController.updateAdmision);
router.delete('/:id', authorize('admin'), admisionController.deleteAdmision);
router.get('/', authorize('admin'), admisionController.getAllAdmisiones);

// Rutas para personal de admisión
router.get('/perfil', authorize('admisión'), admisionController.getAdmisionPerfil);
router.get('/areas', authorize('admin', 'admisión'), admisionController.getAllAreas);

// Rutas para todos los roles autenticados
router.get('/:id', admisionController.getAdmisionById);

export default router;