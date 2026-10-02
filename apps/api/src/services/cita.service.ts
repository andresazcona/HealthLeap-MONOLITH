import citaRepository from '../repositories/cita.repo';
import medicoRepository from '../repositories/medico.repo';
import { Cita, CitaInput, CitaUpdateInput, CitaCompleta, CitaFiltro, EstadoCita } from '../models/cita';
import AppError from '../utils/AppError';
import notificationService from './notification.service';
import { startOfDay, endOfDay, formatDate } from '../utils/date-utils';
import disponibilidadRepository from '../repositories/disponibilidad.repo';
import { Server } from 'socket.io';

class CitaService {
  private io: Server | null = null;

  /**
   * Configura el servidor de WebSockets
   */
  setSocketIO(io: Server) {
    this.io = io;
  }

  /**
   * No se puede agendar sobre un horario que el médico bloqueó
   */
  private async verificarBloqueos(medicoId: string, duracion: number, fechaHora: Date): Promise<void> {
    const inicio = new Date(fechaHora);
    const fin = new Date(inicio.getTime() + duracion * 60000);
    const bloqueos = await disponibilidadRepository.getBloquesBloqueados(medicoId, formatDate(inicio));
    if (bloqueos.some(b => inicio < b.fin && b.inicio < fin)) {
      throw new AppError('El médico bloqueó ese horario', 400);
    }
  }

  /**
   * Crea una nueva cita
   */
  async createCita(citaData: CitaInput): Promise<CitaCompleta> {
    // Verificar que el médico existe
    const medico = await medicoRepository.findById(citaData.medico_id);
    if (!medico) {
      throw new AppError('Médico no encontrado', 404);
    }
    
    await this.verificarBloqueos(medico.id, medico.duracion_cita, citaData.fecha_hora);

    // El choque con otras citas se verifica en el repositorio
    const newCita = await citaRepository.create(citaData);
    
    // Buscar la cita completa
    const citaCompleta = await citaRepository.findCompletaById(newCita.id);
    if (!citaCompleta) {
      throw new AppError('Error al obtener detalles de la cita creada', 500);
    }
    
    // Enviar notificación de confirmación
    try {
      await notificationService.enviarConfirmacionCita(citaCompleta);
    } catch (error) {
      // No interrumpir el flujo si falla la notificación
      console.error('Error al enviar notificación de cita:', error);
    }
    
    return citaCompleta;
  }
  
  /**
   * Obtiene una cita por ID
   */
  async getCitaById(id: string): Promise<CitaCompleta> {
    const cita = await citaRepository.findCompletaById(id);
    if (!cita) {
      throw new AppError('Cita no encontrada', 404);
    }
    return cita;
  }
  
  /**
   * Actualiza una cita
   */
  async updateCita(id: string, data: CitaUpdateInput): Promise<CitaCompleta> {
    if (data.fecha_hora) {
      const actual = await citaRepository.findCompletaById(id);
      if (!actual) {
        throw new AppError('Cita no encontrada', 404);
      }
      await this.verificarBloqueos(actual.medico_id, actual.duracion_cita, data.fecha_hora);
    }

    // Actualizar la cita
    await citaRepository.update(id, data);
    
    // Obtener la cita completa actualizada
    const citaActualizada = await citaRepository.findCompletaById(id);
    if (!citaActualizada) {
      throw new AppError('Cita no encontrada después de actualizar', 404);
    }
    
    // Si se cambió la fecha, enviar notificación
    if (data.fecha_hora) {
      try {
        await notificationService.enviarActualizacionCita(citaActualizada);
      } catch (error) {
        // No interrumpir el flujo si falla la notificación
        console.error('Error al enviar notificación de actualización:', error);
      }
    }
    
    return citaActualizada;
  }
  
  /**
   * Actualiza el estado de una cita
   */
  async updateEstadoCita(id: string, estado: EstadoCita): Promise<CitaCompleta> {
    // Actualizar estado
    await citaRepository.updateEstado(id, estado);
    
    // Obtener la cita actualizada
    const cita = await citaRepository.findCompletaById(id);
    if (!cita) {
      throw new AppError('Cita no encontrada después de actualizar', 404);
    }
    
    // Si el estado es "en espera", notificar al médico en tiempo real
    if (estado === 'en espera' && this.io) {
      // El médico está en la sala medico-<id del médico> (ver socket-handler)
      this.io.to(`medico-${cita.medico_id}`).emit('paciente-en-espera', {
        citaId: cita.id,
        nombrePaciente: cita.nombre_paciente,
        horaLlegada: new Date().toISOString()
      });
    }
    
    // Si el estado es "cancelada", enviar notificación
    if (estado === 'cancelada') {
      try {
        await notificationService.enviarCancelacionCita(cita);
      } catch (error) {
        console.error('Error al enviar notificación de cancelación:', error);
      }
    }
    
    return cita;
  }
  
  /**
   * Cancela (elimina) una cita
   */
  async cancelarCita(id: string): Promise<boolean> {
    // Primero obtenemos la cita para poder enviar notificación después
    const cita = await citaRepository.findCompletaById(id);
    if (!cita) {
      throw new AppError('Cita no encontrada', 404);
    }
    
    // Actualizar estado a cancelada en lugar de eliminar
    await citaRepository.updateEstado(id, 'cancelada');
    
    // Enviar notificación
    try {
      await notificationService.enviarCancelacionCita(cita);
    } catch (error) {
      console.error('Error al enviar notificación de cancelación:', error);
    }
    
    return true;
  }
  
  /**
   * Marca una cita como "atendida"
   */
  async marcarCitaAtendida(id: string, medicoId: string): Promise<CitaCompleta> {
    // Verificar que la cita existe y pertenece al médico
    const cita = await citaRepository.findCompletaById(id);
    if (!cita) {
      throw new AppError('Cita no encontrada', 404);
    }
    
    if (cita.medico_id !== medicoId) {
      throw new AppError('No tiene permiso para modificar esta cita', 403);
    }
    
    // Verificar que la cita está en estado "en espera"
    if (cita.estado !== 'en espera') {
      throw new AppError('Solo se pueden marcar como atendidas citas en estado "en espera"', 400);
    }
    
    return this.updateEstadoCita(id, 'atendida');
  }
  
  /**
   * Marca que un paciente ha llegado
   */
  async marcarPacienteLlegada(id: string): Promise<CitaCompleta> {
    // Verificar que la cita existe
    const cita = await citaRepository.findCompletaById(id);
    if (!cita) {
      throw new AppError('Cita no encontrada', 404);
    }
    
    // Verificar que la cita está en estado "agendada"
    if (cita.estado !== 'agendada') {
      throw new AppError('Solo se pueden marcar llegadas para citas en estado "agendada"', 400);
    }
    
    // Actualizar estado a "en espera"
    return this.updateEstadoCita(id, 'en espera');
  }
  
  /**
   * Obtiene citas de un paciente
   */
  async getCitasByPacienteId(pacienteId: string, page = 1, limit = 10): Promise<{ citas: CitaCompleta[], total: number }> {
    return citaRepository.findByPacienteId(pacienteId, page, limit);
  }
  
  /**
   * Obtiene la agenda de un médico
   */
  async getAgendaMedico(medicoId: string, fecha?: Date, page = 1, limit = 10): Promise<{ citas: CitaCompleta[], total: number }> {
    return citaRepository.findByMedicoId(medicoId, fecha, page, limit);
  }
  
  /**
   * Obtiene todas las citas de un día
   */
  async getAgendaDiaria(fecha: Date): Promise<CitaCompleta[]> {
    return citaRepository.findByFecha(fecha);
  }
  
  /**
   * Filtra citas por diferentes criterios
   */
  async filtrarCitas(filtros: CitaFiltro, page = 1, limit = 10): Promise<{ citas: CitaCompleta[], total: number }> {
    return citaRepository.findByFilters(filtros, page, limit);
  }
  
  /**
   * Envía recordatorios para citas del día siguiente
   */
  async enviarRecordatoriosCitasDiaSiguiente(): Promise<number> {
    // Calcular el rango de fechas para el día siguiente
    const manana = new Date();
    manana.setUTCDate(manana.getUTCDate() + 1);
    
    const inicio = startOfDay(manana);
    const fin = endOfDay(manana);
    
    // Buscar citas para mañana
    const { citas } = await citaRepository.findByFilters({
      fecha_inicio: inicio,
      fecha_fin: fin,
      estado: 'agendada'
    }, 1, 1000); // Asumimos máximo 1000 citas por día
    
    // Enviar recordatorios
    let enviados = 0;
    
    for (const cita of citas) {
      try {
        await notificationService.enviarRecordatorioCita(cita);
        enviados++;
      } catch (error) {
        console.error(`Error al enviar recordatorio para cita ${cita.id}:`, error);
      }
    }
    
    return enviados;
  }
}

export default new CitaService();