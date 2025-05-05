import { Request, Response, NextFunction } from 'express';
import notificationService from '../services/notification.service';
import citaService from '../services/cita.service';

class NotificationController {
  /**
   * Envía un correo electrónico de prueba
   */
  async sendEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { to, subject, body } = req.body;
      
      const messageId = await notificationService.sendEmail({
        to,
        subject,
        body
      });
      
      res.status(200).json({
        status: 'success',
        message: 'Email enviado correctamente',
        data: { messageId }
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Envía confirmación de una cita
   */
  async enviarConfirmacionCita(req: Request, res: Response, next: NextFunction) {
    try {
      const { citaId } = req.body;
      
      // Primero necesitamos obtener la cita completa
      const cita = await citaService.getCitaById(citaId);
      
      // Luego enviar la confirmación con el objeto cita completo
      await notificationService.enviarConfirmacionCita(cita);
      
      res.status(200).json({
        status: 'success',
        message: 'Confirmación de cita enviada correctamente'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Envía actualización de una cita
   */
  async enviarActualizacionCita(req: Request, res: Response, next: NextFunction) {
    try {
      const { citaId } = req.body;
      
      // Primero necesitamos obtener la cita completa
      const cita = await citaService.getCitaById(citaId);
      
      // Luego enviar la actualización con el objeto cita completo
      await notificationService.enviarActualizacionCita(cita);
      
      res.status(200).json({
        status: 'success',
        message: 'Actualización de cita enviada correctamente'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Envía recordatorio de una cita
   */
  async enviarRecordatorioCita(req: Request, res: Response, next: NextFunction) {
    try {
      const { citaId } = req.body;
      
      // Primero necesitamos obtener la cita completa
      const cita = await citaService.getCitaById(citaId);
      
      // Luego enviar el recordatorio con el objeto cita completo
      await notificationService.enviarRecordatorioCita(cita);
      
      res.status(200).json({
        status: 'success',
        message: 'Recordatorio de cita enviado correctamente'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Envía notificación de cancelación de una cita
   */
  async enviarCancelacionCita(req: Request, res: Response, next: NextFunction) {
    try {
      const { citaId } = req.body;
      
      // Primero necesitamos obtener la cita completa
      const cita = await citaService.getCitaById(citaId);
      
      // Luego enviar la notificación de cancelación
      await notificationService.enviarCancelacionCita(cita);
      
      res.status(200).json({
        status: 'success',
        message: 'Cancelación de cita enviada correctamente'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Verifica si el servicio de notificaciones está activo
   */
  async verificarEstadoServicio(req: Request, res: Response, next: NextFunction) {
    try {
      const estaActivo = await notificationService.verificarEstadoServicio();
      
      res.status(200).json({
        status: 'success',
        data: {
          activo: estaActivo,
          servicio: 'Email'  // Cambiado de 'Twilio' a 'Email'
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Envía recordatorios para todas las citas del día siguiente
   */
  async enviarRecordatoriosCitasDiaSiguiente(req: Request, res: Response, next: NextFunction) {
    try {
      const totalEnviados = await citaService.enviarRecordatoriosCitasDiaSiguiente();
      
      res.status(200).json({
        status: 'success',
        message: `Se enviaron ${totalEnviados} recordatorios de citas`,
        data: { totalEnviados }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new NotificationController();