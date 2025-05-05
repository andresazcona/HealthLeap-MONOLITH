import Joi from 'joi';

export const createUsuarioSchema = Joi.object({
  nombre: Joi.string().required().min(3).max(100).messages({
    'string.empty': 'El nombre es obligatorio',
    'string.min': 'El nombre debe tener al menos 3 caracteres',
    'string.max': 'El nombre no debe exceder los 100 caracteres',
    'any.required': 'El nombre es obligatorio'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Correo electrónico inválido',
    'string.empty': 'El correo electrónico es obligatorio',
    'any.required': 'El correo electrónico es obligatorio'
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'La contraseña debe tener al menos 8 caracteres',
    'string.empty': 'La contraseña es obligatoria',
    'any.required': 'La contraseña es obligatoria'
  }),
  rol: Joi.string().valid('paciente', 'medico', 'admisión', 'admin').required().messages({
    'any.only': 'Rol no válido',
    'any.required': 'El rol es obligatorio'
  })
});

export const updateUsuarioSchema = Joi.object({
  nombre: Joi.string().min(3).max(100).messages({
    'string.min': 'El nombre debe tener al menos 3 caracteres',
    'string.max': 'El nombre no debe exceder los 100 caracteres'
  }),
  email: Joi.string().email().messages({
    'string.email': 'Correo electrónico inválido'
  }),
  password: Joi.string().min(8).messages({
    'string.min': 'La contraseña debe tener al menos 8 caracteres'
  }),
  rol: Joi.string().valid('paciente', 'medico', 'admisión', 'admin').messages({
    'any.only': 'Rol no válido'
  })
});

export const paginacionSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.base': 'La página debe ser un número',
    'number.integer': 'La página debe ser un número entero',
    'number.min': 'La página debe ser mayor o igual a 1'
  }),
  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    'number.base': 'El límite debe ser un número',
    'number.integer': 'El límite debe ser un número entero',
    'number.min': 'El límite debe ser mayor o igual a 1',
    'number.max': 'El límite no debe exceder 100'
  }),
  rol: Joi.string().valid('paciente', 'medico', 'admisión', 'admin').messages({
    'any.only': 'Rol no válido'
  })
});