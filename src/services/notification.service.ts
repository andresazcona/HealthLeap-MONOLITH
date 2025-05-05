import { CitaCompleta } from '../models/cita';
import AppError from '../utils/AppError';
import logger from '../utils/logger';
import emailConfig from '../config/email';
import { formatDate, formatTime } from '../utils/date-utils';
import { NotificacionCita } from '../models/notification';

class NotificationService {
  /**
   * Prepara datos de notificación a partir de una cita
   */
  private prepareDatosCita(cita: CitaCompleta): NotificacionCita {
    // Formatear fecha y hora para mejor legibilidad
    const fecha = formatDate(new Date(cita.fecha_hora));
    const hora = formatTime(new Date(cita.fecha_hora));
    
    // Si no hay email, usar cadena vacía
    const emailPaciente = cita.email_paciente || '';
    
    return {
      nombrePaciente: cita.nombre_paciente,
      nombreMedico: cita.nombre_medico,
      especialidad: cita.especialidad,
      fecha,
      hora,
      estado: cita.estado,
      contactoPaciente: '', // En un caso real, iría el número del paciente
      contactoMedico: '',   // En un caso real, iría el número del médico
      emailPaciente        // Usamos la variable definida arriba
    };
  }

  /**
   * Envía un correo electrónico
   */
  async sendEmail({ to, subject, body }: { to: string; subject: string; body: string }): Promise<string> {
    try {
      const transporter = emailConfig.getTransporter();
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to,
        subject,
        html: body
      };
      
      const info = await transporter.sendMail(mailOptions);
      logger.info('Email sent successfully', { messageId: info.messageId, to });
      return info.messageId;
    } catch (error) {
      logger.error('Error sending email', { error, to, subject });
      throw new AppError('Error al enviar el correo electrónico', 500);
    }
  }
  
  /**
   * Envía confirmación de una nueva cita
   */
  async enviarConfirmacionCita(cita: CitaCompleta): Promise<void> {
    try {
      const datos = this.prepareDatosCita(cita);
      
      const subject = `Confirmación de cita - ${datos.fecha} a las ${datos.hora}`;
      const body = `
        <h1>Confirmación de Cita</h1>
        <p>Estimado/a ${datos.nombrePaciente},</p>
        <p>Su cita ha sido confirmada con los siguientes detalles:</p>
        <ul>
          <li><strong>Médico:</strong> ${datos.nombreMedico}</li>
          <li><strong>Especialidad:</strong> ${datos.especialidad}</li>
          <li><strong>Fecha:</strong> ${datos.fecha}</li>
          <li><strong>Hora:</strong> ${datos.hora}</li>
        </ul>
        <p>Si necesita cambiar o cancelar su cita, por favor comuníquese con nosotros.</p>
        <p>Gracias por confiar en nuestros servicios.</p>
      `;
      
      // Verificar que tenemos un email para enviar
      if (!datos.emailPaciente) {
        logger.warn('No se envió la confirmación de cita porque el paciente no tiene email', { citaId: cita.id });
        return;
      }
      
      await this.sendEmail({
        to: datos.emailPaciente,
        subject,
        body
      });
      
      logger.info('Confirmación de cita enviada por email', { citaId: cita.id });
    } catch (error) {
      logger.error('Error al enviar confirmación de cita', { error, citaId: cita.id });
      throw new AppError('Error al enviar la confirmación de cita', 500);
    }
  }
  
  /**
   * Envía una actualización de cita
   */
  async enviarActualizacionCita(cita: CitaCompleta): Promise<void> {
    try {
      const datos = this.prepareDatosCita(cita);
      
      const subject = `Actualización de cita - ${datos.fecha} a las ${datos.hora}`;
      const body = `
        <h1>Actualización de Cita</h1>
        <p>Estimado/a ${datos.nombrePaciente},</p>
        <p>Su cita ha sido actualizada con los siguientes detalles:</p>
        <ul>
          <li><strong>Médico:</strong> ${datos.nombreMedico}</li>
          <li><strong>Especialidad:</strong> ${datos.especialidad}</li>
          <li><strong>Fecha:</strong> ${datos.fecha}</li>
          <li><strong>Hora:</strong> ${datos.hora}</li>
        </ul>
        <p>Gracias por confiar en nuestros servicios.</p>
      `;
      
      // Verificar que tenemos un email para enviar
      if (!datos.emailPaciente) {
        logger.warn('No se envió la actualización de cita porque el paciente no tiene email', { citaId: cita.id });
        return;
      }
      
      await this.sendEmail({
        to: datos.emailPaciente,
        subject,
        body
      });
      
      logger.info('Actualización de cita enviada por email', { citaId: cita.id });
    } catch (error) {
      logger.error('Error al enviar actualización de cita', { error, citaId: cita.id });
      throw new AppError('Error al enviar la actualización de cita', 500);
    }
  }
  
  /**
   * Envía un recordatorio de cita
   */
  async enviarRecordatorioCita(cita: CitaCompleta): Promise<void> {
    try {
      const datos = this.prepareDatosCita(cita);
      
      const subject = `Recordatorio de cita - ${datos.fecha} a las ${datos.hora}`;
      const body = `
        <h1>Recordatorio de Cita</h1>
        <p>Estimado/a ${datos.nombrePaciente},</p>
        <p>Le recordamos que tiene una cita programada con los siguientes detalles:</p>
        <ul>
          <li><strong>Médico:</strong> ${datos.nombreMedico}</li>
          <li><strong>Especialidad:</strong> ${datos.especialidad}</li>
          <li><strong>Fecha:</strong> ${datos.fecha}</li>
          <li><strong>Hora:</strong> ${datos.hora}</li>
        </ul>
        <p>Por favor, llegue con 15 minutos de anticipación.</p>
        <p>Gracias por confiar en nuestros servicios.</p>
      `;
      
      // Verificar que tenemos un email para enviar
      if (!datos.emailPaciente) {
        logger.warn('No se envió el recordatorio de cita porque el paciente no tiene email', { citaId: cita.id });
        return;
      }
      
      await this.sendEmail({
        to: datos.emailPaciente,
        subject,
        body
      });
      
      logger.info('Recordatorio de cita enviado por email', { citaId: cita.id });
    } catch (error) {
      logger.error('Error al enviar recordatorio de cita', { error, citaId: cita.id });
      throw new AppError('Error al enviar el recordatorio de cita', 500);
    }
  }
  
  /**
   * Envía una notificación de cancelación de cita
   */
  async enviarCancelacionCita(cita: CitaCompleta): Promise<void> {
    try {
      const datos = this.prepareDatosCita(cita);
      
      const subject = `Cancelación de cita - ${datos.fecha} a las ${datos.hora}`;
      const body = `
        <h1>Cancelación de Cita</h1>
        <p>Estimado/a ${datos.nombrePaciente},</p>
        <p>Lamentamos informarle que su cita ha sido cancelada:</p>
        <ul>
          <li><strong>Médico:</strong> ${datos.nombreMedico}</li>
          <li><strong>Especialidad:</strong> ${datos.especialidad}</li>
          <li><strong>Fecha:</strong> ${datos.fecha}</li>
          <li><strong>Hora:</strong> ${datos.hora}</li>
        </ul>
        <p>Por favor, comuníquese con nosotros para programar una nueva cita.</p>
        <p>Disculpe las molestias.</p>
      `;
      
      // Verificar que tenemos un email para enviar
      if (!datos.emailPaciente) {
        logger.warn('No se envió la cancelación de cita porque el paciente no tiene email', { citaId: cita.id });
        return;
      }
      
      await this.sendEmail({
        to: datos.emailPaciente,
        subject,
        body
      });
      
      logger.info('Cancelación de cita enviada por email', { citaId: cita.id });
    } catch (error) {
      logger.error('Error al enviar cancelación de cita', { error, citaId: cita.id });
      throw new AppError('Error al enviar la cancelación de cita', 500);
    }
  }
  
  /**
   * Verifica si el servicio de notificaciones está activo
   */
  async verificarEstadoServicio(): Promise<boolean> {
    try {
      // Verificar que se pueda inicializar el transportador
      emailConfig.getTransporter();
      return true;
    } catch (error) {
      logger.error('Error al verificar estado del servicio de notificaciones', { error });
      return false;
    }
  }
}

export default new NotificationService();