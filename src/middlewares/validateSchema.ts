import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import AppError from '../utils/AppError';

const validateSchema = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        path: detail.path.join('.'),
        message: detail.message
      }));
      
      return next(new AppError('Error de validación', 400, true, errorDetails));
    }

    // Reemplazar el body con los datos validados
    req.body = value;
    next();
  };
};

export default validateSchema;