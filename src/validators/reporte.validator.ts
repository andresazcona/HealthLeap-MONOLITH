import Joi from 'joi';

export const filtroReporteSchema = Joi.object({
  desde: Joi.date().iso().messages({
    'date.base': 'Fecha desde inválida',
    'date.format': 'Formato de fecha desde inválido (use ISO 8601)'
  }),
  hasta: Joi.date().iso().min(Joi.ref('desde')).messages({
    'date.base': 'Fecha hasta inválida',
    'date.format': 'Formato de fecha hasta inválido (use ISO 8601)',
    'date.min': 'La fecha hasta debe ser posterior a la fecha desde'
  }),
  estado: Joi.string().valid('agendada', 'en espera', 'atendida', 'cancelada').messages({
    'any.only': 'Estado no válido'
  }),
  medico_id: Joi.string().uuid().messages({
    'string.guid': 'ID de médico inválido'
  })
}).options({ allowUnknown: true });

// Corregido: Simplemente duplicamos las definiciones en lugar de usar extract()
export const reporteCSVSchema = Joi.object({
  formato: Joi.string().valid('csv', 'json').default('csv').messages({
    'any.only': 'Formato no válido (use csv o json)'
  }),
  desde: Joi.date().iso().messages({
    'date.base': 'Fecha desde inválida',
    'date.format': 'Formato de fecha desde inválido (use ISO 8601)'
  }),
  hasta: Joi.date().iso().min(Joi.ref('desde')).messages({
    'date.base': 'Fecha hasta inválida',
    'date.format': 'Formato de fecha hasta inválido (use ISO 8601)',
    'date.min': 'La fecha hasta debe ser posterior a la fecha desde'
  }),
  estado: Joi.string().valid('agendada', 'en espera', 'atendida', 'cancelada').messages({
    'any.only': 'Estado no válido'
  }),
  medico_id: Joi.string().uuid().messages({
    'string.guid': 'ID de médico inválido'
  })
}).options({ allowUnknown: true });

export const reporteMisCitasSchema = Joi.object({
  desde: Joi.date().iso().messages({
    'date.base': 'Fecha desde inválida',
    'date.format': 'Formato de fecha desde inválido (use ISO 8601)'
  }),
  hasta: Joi.date().iso().min(Joi.ref('desde')).messages({
    'date.base': 'Fecha hasta inválida',
    'date.format': 'Formato de fecha hasta inválido (use ISO 8601)',
    'date.min': 'La fecha hasta debe ser posterior a la fecha desde'
  }),
  estado: Joi.string().valid('agendada', 'en espera', 'atendida', 'cancelada').messages({
    'any.only': 'Estado no válido'
  })
});