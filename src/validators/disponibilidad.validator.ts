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
  inicio: Joi.date().iso().required().messages({
    'any.required': 'La hora de inicio es obligatoria'
  }),
  fin: Joi.date().iso().greater(Joi.ref('inicio')).required().messages({
    'date.greater': 'La hora de fin debe ser posterior a la de inicio',
    'any.required': 'La hora de fin es obligatoria'
  })
});

// medico_id es obligatorio para admin; un médico bloquea su propia agenda
export const configuracionAgendaSchema = Joi.object({
  medico_id: Joi.string().uuid().optional().messages({
    'string.guid': 'ID de médico inválido'
  }),
  fecha: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
    'string.pattern.base': 'Formato de fecha inválido (use YYYY-MM-DD)',
    'any.required': 'La fecha es obligatoria'
  }),
  bloques_bloqueados: Joi.array().items(bloqueDisponibleSchema).min(1).required()
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