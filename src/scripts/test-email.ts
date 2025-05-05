import dotenv from 'dotenv';
dotenv.config();

import notificationService from '../services/notification.service';
import logger from '../utils/logger';

async function testEmail() {
  try {
    const result = await notificationService.sendEmail({
      to: process.env.EMAIL_USER || '',
      subject: 'Prueba de Email HealthLeap',
      body: '<h1>Prueba de Email</h1><p>Este es un email de prueba desde HealthLeap.</p>'
    });
    
    logger.info('Email de prueba enviado correctamente', { messageId: result });
    console.log('Email enviado correctamente!');
    process.exit(0);
  } catch (error) {
    logger.error('Error al enviar email de prueba', { error });
    console.error('Error al enviar email de prueba:', error);
    process.exit(1);
  }
}

testEmail();