import { Router } from 'express';
import authController from '../controllers/auth.controller';
import validateSchema from '../middlewares/validateSchema';
import { registerSchema, loginSchema, refreshTokenSchema } from '../validators/auth.validator';
import { sensitiveRateLimit } from '../middlewares/rateLimiter';

const router = Router();

// Aplicar rate limit a rutas sensibles
router.post('/login', sensitiveRateLimit, validateSchema(loginSchema), authController.login);
router.post('/register', validateSchema(registerSchema), authController.register);
router.post('/refresh-token', validateSchema(refreshTokenSchema), authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/forgot-password', sensitiveRateLimit, authController.forgotPassword);
router.post('/reset-password', sensitiveRateLimit, validateSchema(refreshTokenSchema), authController.resetPassword);

export default router;