import disponibilidadRepository from '../repositories/disponibilidad.repo';
import medicoRepository from '../repositories/medico.repo';
import citaRepository from '../repositories/cita.repo';
import { DisponibilidadDiaria, BloqueDisponible, ConfiguracionAgenda } from '../models/disponibilidad';
import AppError from '../utils/AppError';
import logger from '../utils/logger';

class DisponibilidadService {
  /**
   * Obtiene la disponibilidad de un médico para una fecha específica
   */
  async getDisponibilidadMedico(medicoId: string, fecha: string): Promise<DisponibilidadDiaria> {
    try {
      // Verificar que el médico existe
      const medico = await medicoRepository.findById(medicoId);
      if (!medico) {
        throw new AppError('Médico no encontrado', 404);
      }

      // Obtener bloques disponibles
      const bloquesDisponibles = await disponibilidadRepository.getDisponibilidad(medicoId, fecha);
      
      // Obtener bloques bloqueados
      const bloquesBloqueados = await disponibilidadRepository.getBloquesBloqueados(medicoId, fecha);
      
      // Obtener citas ya agendadas para ese día
      const fechaObj = new Date(fecha);
      const { citas } = await citaRepository.findByMedicoId(medicoId, fechaObj, 1, 100);
      
      // Mapear citas a formato simplificado para la UI
      const citasAgendadas = citas
        .filter(cita => cita.estado !== 'cancelada')
        .map(cita => {
          const inicio = new Date(cita.fecha_hora);
          const fin = new Date(inicio.getTime() + medico.duracion_cita * 60000);
          
          return {
            id: cita.id,
            inicio,
            fin,
            paciente: cita.nombre_paciente
          };
        });
      
      return {
        fecha,
        medico_id: medicoId,
        bloquesDisponibles,
        bloquesBloqueados,
        citasAgendadas
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error al obtener disponibilidad', { error, medicoId, fecha });
      throw new AppError('Error al obtener disponibilidad', 500);
    }
  }

  /**
   * Obtiene la agenda global de todos los médicos para una fecha
   */
  async getAgendaGlobal(fecha: string): Promise<Record<string, DisponibilidadDiaria>> {
    try {
      // Obtener todos los médicos
      const { medicos } = await medicoRepository.findByFilters({}, 1, 100);
      
      // Para cada médico, obtener su disponibilidad
      const agenda: Record<string, DisponibilidadDiaria> = {};
      
      for (const medico of medicos) {
        const disponibilidad = await this.getDisponibilidadMedico(medico.id, fecha);
        agenda[medico.id] = disponibilidad;
      }
      
      return agenda;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error al obtener agenda global', { error, fecha });
      throw new AppError('Error al obtener agenda global', 500);
    }
  }

  /**
   * Bloquea horarios en la agenda de un médico
   */
  async bloquearHorarios(config: ConfiguracionAgenda): Promise<ConfiguracionAgenda> {
    try {
      // Verificar que el médico existe
      const medico = await medicoRepository.findById(config.medico_id);
      if (!medico) {
        throw new AppError('Médico no encontrado', 404);
      }
      
      // Verificar que los bloques son válidos (inicio < fin)
      for (const bloque of config.bloques_bloqueados) {
        if (bloque.inicio >= bloque.fin) {
          throw new AppError('Los bloques deben tener una hora de inicio anterior a la hora de fin', 400);
        }
      }
      
      // Verificar que no hay citas ya agendadas en esos horarios
      const fechaObj = new Date(config.fecha);
      const { citas } = await citaRepository.findByMedicoId(config.medico_id, fechaObj, 1, 100);
      
      for (const bloque of config.bloques_bloqueados) {
        for (const cita of citas) {
          if (cita.estado === 'cancelada') continue;
          
          const citaInicio = new Date(cita.fecha_hora);
          const citaFin = new Date(citaInicio.getTime() + medico.duracion_cita * 60000);
          
          // Verificar si hay solapamiento
          if (bloque.inicio < citaFin && citaInicio < bloque.fin) {
            throw new AppError(`No se puede bloquear el horario porque ya hay una cita agendada con ${cita.nombre_paciente} a las ${citaInicio.toLocaleTimeString()}`, 400);
          }
        }
      }
      
      // Guardar los bloques bloqueados
      await disponibilidadRepository.bloquearHorarios(config);
      
      return config;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error al bloquear horarios', { error, config });
      throw new AppError('Error al bloquear horarios', 500);
    }
  }

  /**
   * Cierra la agenda de un médico para un día completo
   */
  async cerrarAgenda(medicoId: string, fecha: string): Promise<boolean> {
    try {
      return await disponibilidadRepository.cerrarAgenda(medicoId, fecha);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error al cerrar agenda', { error, medicoId, fecha });
      throw new AppError('Error al cerrar agenda', 500);
    }
  }
}

export default new DisponibilidadService();