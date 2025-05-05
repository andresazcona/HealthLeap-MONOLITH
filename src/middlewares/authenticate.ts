import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/enviroment';
import AppError from '../utils/AppError';

interface JwtPayload {
  id: string;
  rol: string;
}

// Extender interface de Request para incluir usuario
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        rol: string;
      };
    }
  }
}

const authenticate = (req: Request, res: Response, next: NextFunction) => {
  // Obtener token del header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('No token provided', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verificar token
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    
    // Añadir información del usuario al request
    req.user = {
      id: decoded.id,
      rol: decoded.rol
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError('Token expirado', 401));
    }
    return next(new AppError('Token no válido', 401));
  }
};

export default authenticate;