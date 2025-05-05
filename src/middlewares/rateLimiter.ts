import rateLimit from 'express-rate-limit';
import config from '../config/enviroment';

// Rate limiter para endpoints sensibles
export const sensitiveRateLimit = rateLimit({
  windowMs: config.rateLimit.windowMs, // 15 minutos por defecto
  max: config.rateLimit.max, // 100 solicitudes por defecto
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Demasiadas solicitudes, por favor intente más tarde.',
  },
});

// Rate limiter para endpoints generales (más permisivo)
export const generalRateLimit = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max * 3, // Más permisivo que el sensible
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Demasiadas solicitudes, por favor intente más tarde.',
  },
});