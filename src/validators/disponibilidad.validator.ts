import Joi from 'joi';

export const disponibilidadQuerySchema = Joi.object({
  medicoId: Joi.string().uuid().required().messages({
    'string.guid': 'ID de médico inválido',
    'any.required': 'El ID del médico es obligatorio'
  }),
  fecha: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
    'string.pattern.base': 'Formato de fecha inválido (use YYYY-MM-DD)',
    'string.empty': 'La fecha es obligatoria',
    'any.required': 'La fecha es obligatoria'
  })
}).options({ allowUnknown: true });

export const bloqueDisponibleSchema = Joi.object({
  inicio: Joi.date().iso().required().messages({
    'date.base': 'Hora de inicio inválida',
    'date.format': 'Formato de hora de inicio inválido (use ISO 8601)',
    'any.required': 'La hora de inicio es obligatoria'
  }),
  fin: Joi.date().iso().min(Joi.ref('inicio')).required().messages({
    'date.base': 'Hora de fin inválida',
    'date.format': 'Formato de hora de fin inválido (use ISO 8601)',
    'date.min': 'La hora de fin debe ser posterior a la hora de inicio',
    'any.required': 'La hora de fin es obligatoria'
  })
});

export const configuracionAgendaSchema = Joi.object({
  medico_id: Joi.string().uuid().required().messages({
    'string.guid': 'ID de médico inválido',
    'any.required': 'El ID del médico es obligatorio'
  }),
  fecha: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
    'string.pattern.base': 'Formato de fecha inválido (use YYYY-MM-DD)',
    'string.empty': 'La fecha es obligatoria',
    'any.required': 'La fecha es obligatoria'
  }),
  bloques_bloqueados: Joi.array().items(bloqueDisponibleSchema).min(1).required().messages({
    'array.min': 'Debe especificar al menos un bloque bloqueado',
    'any.required': 'Los bloques bloqueados son obligatorios'
  })
});

export const cerrarAgendaSchema = Joi.object({
  medicoId: Joi.string().uuid().required().messages({
    'string.guid': 'ID de médico inválido',
    'any.required': 'El ID del médico es obligatorio'
  }),
  fecha: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
    'string.pattern.base': 'Formato de fecha inválido (use YYYY-MM-DD)',
    'string.empty': 'La fecha es obligatoria',
    'any.required': 'La fecha es obligatoria'
  })
}).options({ allowUnknown: true });

export const agendaGlobalSchema = Joi.object({
  fecha: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
    'string.pattern.base': 'Formato de fecha inválido (use YYYY-MM-DD)',
    'string.empty': 'La fecha es obligatoria',
    'any.required': 'La fecha es obligatoria'
  })
});