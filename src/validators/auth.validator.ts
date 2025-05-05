import Joi from 'joi';

export const registerSchema = Joi.object({
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
  rol: Joi.string().valid('paciente', 'medico', 'admisión', 'admin').default('paciente').messages({
    'any.only': 'Rol no válido'
  })
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Correo electrónico inválido',
    'string.empty': 'El correo electrónico es obligatorio',
    'any.required': 'El correo electrónico es obligatorio'
  }),
  password: Joi.string().required().messages({
    'string.empty': 'La contraseña es obligatoria',
    'any.required': 'La contraseña es obligatoria'
  })
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'string.empty': 'El token de actualización es obligatorio',
    'any.required': 'El token de actualización es obligatorio'
  })
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'string.empty': 'El token es obligatorio',
    'any.required': 'El token es obligatorio'
  }),
  newPassword: Joi.string().min(8).required().messages({
    'string.min': 'La nueva contraseña debe tener al menos 8 caracteres',
    'string.empty': 'La nueva contraseña es obligatoria',
    'any.required': 'La nueva contraseña es obligatoria'
  })
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Correo electrónico inválido',
    'string.empty': 'El correo electrónico es obligatorio',
    'any.required': 'El correo electrónico es obligatorio'
  })
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'string.empty': 'La contraseña actual es obligatoria',
    'any.required': 'La contraseña actual es obligatoria'
  }),
  newPassword: Joi.string().min(8).required().messages({
    'string.min': 'La nueva contraseña debe tener al menos 8 caracteres',
    'string.empty': 'La nueva contraseña es obligatoria',
    'any.required': 'La nueva contraseña es obligatoria'
  })
});