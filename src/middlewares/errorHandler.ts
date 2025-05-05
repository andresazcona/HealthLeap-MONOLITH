import { Request, Response, NextFunction } from 'express';
import AppError from '../utils/AppError';
import logger from '../utils/logger';

const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log del error
  logger.error(`${err.name}: ${err.message}`, { 
    path: req.path,
    method: req.method,
    stack: err.stack,
    ip: req.ip,
    details: err instanceof AppError ? err.details : undefined
  });

  // Errores operacionales - esperados
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      ...(err.details ? { details: err.details } : {})
    });
  }

  // Errores de PostgreSQL
  if (err.name === 'QueryFailedError' || 
      err.name === 'EntityNotFoundError' || 
      err.message.includes('syntax error')) {
    return res.status(400).json({
      status: 'error',
      message: 'Error en la base de datos',
    });
  }

  // Errores de validación de JWT
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      message: 'Token no válido o expirado',
    });
  }

  // Errores no controlados
  return res.status(500).json({
    status: 'error',
    message: 'Error interno del servidor',
  });
};

export default errorHandler;