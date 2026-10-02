import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import AppError from '../utils/AppError';

type Source = 'body' | 'query' | 'params';

const validateSchema = (schema: Joi.ObjectSchema, source: Source = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req[source], {
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

    // Reemplazar con los datos validados (aplica defaults como page/limit)
    req[source] = value;
    next();
  };
};

export default validateSchema;
