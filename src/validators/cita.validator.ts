import Joi from 'joi';

export const createCitaSchema = Joi.object({
  paciente_id: Joi.string().uuid().required().messages({
    'string.guid': 'ID de paciente inválido',
    'any.required': 'El ID de paciente es obligatorio'
  }),
  medico_id: Joi.string().uuid().required().messages({
    'string.guid': 'ID de médico inválido',
    'any.required': 'El ID de médico es obligatorio'
  }),
  fecha_hora: Joi.date().iso().min('now').required().messages({
    'date.base': 'Fecha y hora inválidas',
    'date.format': 'Formato de fecha y hora inválido (use ISO 8601)',
    'date.min': 'La fecha y hora deben ser futuras',
    'any.required': 'La fecha y hora son obligatorias'
  })
});

export const updateCitaSchema = Joi.object({
  fecha_hora: Joi.date().iso().min('now').messages({
    'date.base': 'Fecha y hora inválidas',
    'date.format': 'Formato de fecha y hora inválido (use ISO 8601)',
    'date.min': 'La fecha y hora deben ser futuras'
  }),
  estado: Joi.string().valid('agendada', 'en espera', 'atendida', 'cancelada').messages({
    'any.only': 'Estado no válido'
  })
});

export const updateEstadoCitaSchema = Joi.object({
  estado: Joi.string().valid('agendada', 'en espera', 'atendida', 'cancelada').required().messages({
    'any.only': 'Estado no válido',
    'any.required': 'El estado es obligatorio'
  })
});

export const filtroCitaSchema = Joi.object({
  fecha_inicio: Joi.date().iso().messages({
    'date.base': 'Fecha de inicio inválida',
    'date.format': 'Formato de fecha de inicio inválido (use ISO 8601)'
  }),
  fecha_fin: Joi.date().iso().min(Joi.ref('fecha_inicio')).messages({
    'date.base': 'Fecha de fin inválida',
    'date.format': 'Formato de fecha de fin inválido (use ISO 8601)',
    'date.min': 'La fecha de fin debe ser posterior a la fecha de inicio'
  }),
  paciente_id: Joi.string().uuid().messages({
    'string.guid': 'ID de paciente inválido'
  }),
  medico_id: Joi.string().uuid().messages({
    'string.guid': 'ID de médico inválido'
  }),
  estado: Joi.string().valid('agendada', 'en espera', 'atendida', 'cancelada').messages({
    'any.only': 'Estado no válido'
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

export const agendaDiariaSchema = Joi.object({
  fecha: Joi.date().iso().required().messages({
    'date.base': 'Fecha inválida',
    'date.format': 'Formato de fecha inválido (use ISO 8601)',
    'any.required': 'La fecha es obligatoria'
  })
});