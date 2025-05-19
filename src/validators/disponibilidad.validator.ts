import Joi from 'joi';

export const disponibilidadQuerySchema = Joi.object({
  medicoId: Joi.string().uuid().required().messages({
    'string.guid': 'ID de médico inválido',
    'any.required': 'El ID del médico es obligatorio'
  }),
  fecha: Joi.string().required().messages({
    'string.empty': 'La fecha es obligatoria',
    'any.required': 'La fecha es obligatoria'
  })
}).options({ allowUnknown: true });

export const bloqueDisponibleSchema = Joi.object({
  inicio: Joi.alternatives().try(
    Joi.date().iso(),
    Joi.string()
  ).required().messages({
    'any.required': 'La hora de inicio es obligatoria'
  }),
  fin: Joi.alternatives().try(
    Joi.date().iso(),
    Joi.string()
  ).required().messages({
    'any.required': 'La hora de fin es obligatoria'
  })
});

// MODIFICADA: aceptar tanto bloques como bloques_bloqueados
export const configuracionAgendaSchema = Joi.object({
  medico_id: Joi.string().uuid().required().messages({
    'string.guid': 'ID de médico inválido',
    'any.required': 'El ID del médico es obligatorio'
  }),
  fecha: Joi.string().required().messages({
    'string.empty': 'La fecha es obligatoria',
    'any.required': 'La fecha es obligatoria'
  }),
  // Permitir tanto bloques como bloques_bloqueados
  bloques: Joi.array().items(Joi.string()).optional(),
  bloques_bloqueados: Joi.array().items(bloqueDisponibleSchema).optional()
}).or('bloques', 'bloques_bloqueados'); // Requiere al menos uno de estos campos

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