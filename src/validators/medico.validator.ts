import Joi from 'joi';

export const createMedicoSchema = Joi.object({
  usuario_id: Joi.string().uuid().required().messages({
    'string.guid': 'ID de usuario inválido',
    'any.required': 'El ID de usuario es obligatorio'
  }),
  especialidad: Joi.string().required().messages({
    'string.empty': 'La especialidad es obligatoria',
    'any.required': 'La especialidad es obligatoria'
  }),
  centro_id: Joi.string().uuid().required().messages({
    'string.guid': 'ID de centro inválido',
    'any.required': 'El ID de centro es obligatorio'
  }),
  duracion_cita: Joi.number().integer().min(10).max(120).default(30).messages({
    'number.base': 'La duración de la cita debe ser un número',
    'number.integer': 'La duración de la cita debe ser un número entero',
    'number.min': 'La duración de la cita debe ser al menos 10 minutos',
    'number.max': 'La duración de la cita no debe exceder 120 minutos'
  })
});

export const createMedicoCompletoSchema = Joi.object({
  usuario: Joi.object({
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
    })
  }).required(),
  especialidad: Joi.string().required().messages({
    'string.empty': 'La especialidad es obligatoria',
    'any.required': 'La especialidad es obligatoria'
  }),
  centro_id: Joi.string().uuid().required().messages({
    'string.guid': 'ID de centro inválido',
    'any.required': 'El ID de centro es obligatorio'
  }),
  duracion_cita: Joi.number().integer().min(10).max(120).default(30).messages({
    'number.base': 'La duración de la cita debe ser un número',
    'number.integer': 'La duración de la cita debe ser un número entero',
    'number.min': 'La duración de la cita debe ser al menos 10 minutos',
    'number.max': 'La duración de la cita no debe exceder 120 minutos'
  })
});

export const updateMedicoSchema = Joi.object({
  especialidad: Joi.string().messages({
    'string.empty': 'La especialidad no puede estar vacía'
  }),
  centro_id: Joi.string().uuid().messages({
    'string.guid': 'ID de centro inválido'
  }),
  duracion_cita: Joi.number().integer().min(10).max(120).messages({
    'number.base': 'La duración de la cita debe ser un número',
    'number.integer': 'La duración de la cita debe ser un número entero',
    'number.min': 'La duración de la cita debe ser al menos 10 minutos',
    'number.max': 'La duración de la cita no debe exceder 120 minutos'
  })
});

export const filtroMedicoSchema = Joi.object({
  especialidad: Joi.string(),
  centro_id: Joi.string().uuid().messages({
    'string.guid': 'ID de centro inválido'
  }),
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
  })
});