import { Router } from 'express';
import usuarioController from '../controllers/usuario.controller';
import validateSchema from '../middlewares/validateSchema';
import { createUsuarioSchema, updateUsuarioSchema } from '../validators/usuario.validator';
import authenticate from '../middlewares/authenticate';
import authorize from '../middlewares/authorize';

const router = Router();

// Rutas protegidas
router.use(authenticate);

// Rutas para todos los usuarios
router.get('/me', usuarioController.getProfile);
router.patch('/me', validateSchema(updateUsuarioSchema), usuarioController.updateProfile);

// Rutas solo para administradores
router.get('/', authorize('admin'), usuarioController.getAllUsuarios);
router.get('/:id', authorize('admin'), usuarioController.getUsuarioById);
router.post('/', authorize('admin'), validateSchema(createUsuarioSchema), usuarioController.createUsuario);
router.put('/:id', authorize('admin'), validateSchema(updateUsuarioSchema), usuarioController.updateUsuario);
router.delete('/:id', authorize('admin'), usuarioController.deleteUsuario);

export default router;