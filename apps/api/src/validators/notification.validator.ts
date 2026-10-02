import Joi from 'joi';

export const emailNotificationSchema = Joi.object({
  to: Joi.string().email().required().messages({
    'string.email': 'Correo electrónico inválido',
    'string.empty': 'El correo electrónico es obligatorio',
    'any.required': 'El correo electrónico es obligatorio'
  }),
  subject: Joi.string().required().max(100).messages({
    'string.empty': 'El asunto es obligatorio',
    'string.max': 'El asunto no debe exceder los 100 caracteres',
    'any.required': 'El asunto es obligatorio'
  }),
  body: Joi.string().required().max(2000).messages({
    'string.empty': 'El cuerpo del mensaje es obligatorio',
    'string.max': 'El cuerpo del mensaje no debe exceder los 2000 caracteres',
    'any.required': 'El cuerpo del mensaje es obligatorio'
  })
});

// Se eliminó el esquema whatsappNotificationSchema ya que migramos a email

export const citaRecordatorioSchema = Joi.object({
  citaId: Joi.string().uuid().required().messages({
    'string.guid': 'ID de cita inválido',
    'any.required': 'El ID de la cita es obligatorio'
  })
});