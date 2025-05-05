import nodemailer from 'nodemailer';
import logger from '../utils/logger';

// Crear transportador de email una sola vez
let transporter: nodemailer.Transporter;

/**
 * Inicializa y devuelve el transportador de email
 */
export const getEmailTransporter = (): nodemailer.Transporter => {
  if (transporter) {
    return transporter;
  }

  try {
    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
      }
    });

    logger.info('Email transporter initialized successfully');
    return transporter;
  } catch (error) {
    logger.error('Failed to initialize email transporter', { error });
    throw error;
  }
};

export default {
  getTransporter: getEmailTransporter
};