import { Server } from 'socket.io';
import { isMedicoOnline, enviarNotificacion } from '../realtime/socket-handler';
import logger from '../utils/logger';
import AppError from '../utils/AppError';

let io: Server;

class RealtimeService {
  /**
   * Inicializa el servicio con una instancia de Socket.IO
   */
  initialize(socketServer: Server) {
    io = socketServer;
    logger.info('Servicio Realtime inicializado');
    return this;
  }
  
  /**
   * Notifica a un médico que un paciente ha llegado
   */
  async notificarPacienteLlegada(medicoId: string, citaId: string, nombrePaciente: string) {
    try {
      if (!io) {
        throw new AppError('El servicio de tiempo real no ha sido inicializado', 500);
      }
      
      logger.info('Enviando notificación de llegada de paciente', {
        medicoId,
        citaId,
        nombrePaciente
      });
      
      // Verificar si el médico está conectado
      const online = isMedicoOnline(medicoId);
      
      if (online) {
        // Enviar notificación en tiempo real
        io.to(`medico-${medicoId}`).emit('paciente-en-espera', {
          citaId,
          nombrePaciente,
          horaLlegada: new Date().toISOString()
        });
        
        logger.info('Notificación enviada en tiempo real', { medicoId, citaId });
        return true;
      } else {
        // El médico no está online, se podría enviar una notificación alternativa
        logger.info('El médico no está conectado, no se envió notificación en tiempo real', { medicoId });
        return false;
      }
    } catch (error) {
      logger.error('Error al enviar notificación en tiempo real', { error, medicoId, citaId });
      return false;
    }
  }
  
  /**
   * Envía una notificación a un usuario específico
   */
  async enviarNotificacion(userId: string, tipo: string, datos: any): Promise<boolean> {
    try {
      if (!io) {
        throw new AppError('El servicio de tiempo real no ha sido inicializado', 500);
      }
      
      return enviarNotificacion(io, userId, tipo, datos);
    } catch (error) {
      logger.error('Error al enviar notificación personalizada', { error, userId, tipo });
      return false;
    }
  }
  
  /**
   * Envía una actualización de estado de cita a todos los interesados
   */
  async actualizarEstadoCita(citaId: string, pacienteId: string, medicoId: string, estado: string) {
    try {
      if (!io) {
        throw new AppError('El servicio de tiempo real no ha sido inicializado', 500);
      }
      
      // Notificar al paciente
      enviarNotificacion(io, pacienteId, 'cita-actualizada', {
        citaId,
        estado,
        timestamp: new Date().toISOString()
      });
      
      // Notificar al médico
      enviarNotificacion(io, medicoId, 'cita-actualizada', {
        citaId,
        estado,
        timestamp: new Date().toISOString()
      });
      
      // Notificar a sala de admisión (todos los usuarios de admisión)
      io.to('admision-sala').emit('cita-actualizada', {
        citaId,
        estado,
        timestamp: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      logger.error('Error al actualizar estado de cita en tiempo real', { error, citaId, estado });
      return false;
    }
  }
}

export default new RealtimeService();