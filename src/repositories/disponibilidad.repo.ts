import { BloqueDisponible, BloqueBloqueado, ConfiguracionAgenda } from '../models/disponibilidad';
import { query } from '../config/database';
import citaRepo from './cita.repo';
import medicoRepo from './medico.repo';
import AppError from '../utils/AppError';
import logger from '../utils/logger';
import { startOfDay, endOfDay, formatDate } from '../utils/date-utils';

// Tabla para almacenar bloques bloqueados (no disponibles)
// Nota: Esta tabla no existe en el esquema original, tendría que crearse
const BLOQUES_BLOQUEADOS_TABLE = `
  CREATE TABLE IF NOT EXISTS bloques_bloqueados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medico_id UUID NOT NULL REFERENCES medicos(id),
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    created_at TIMESTAMP DEFAULT now()
  )
`;

class DisponibilidadRepository {
  constructor() {
    this.inicializarTabla();
  }

  /**
   * Inicializa la tabla de bloques bloqueados si no existe
   */
  async inicializarTabla() {
    try {
      await query(BLOQUES_BLOQUEADOS_TABLE);
      logger.info('Tabla de bloques bloqueados inicializada');
    } catch (error: any) {
      logger.error('Error al inicializar tabla de bloques bloqueados', { error: error.message });
    }
  }

  /**
   * Obtiene bloques disponibles para un médico en una fecha
   */
  async getDisponibilidad(medicoId: string, fecha: string): Promise<BloqueDisponible[]> {
    try {
      // Verificar si el médico existe
      const medico = await medicoRepo.findById(medicoId);
      if (!medico) {
        throw new AppError('Médico no encontrado', 404);
      }
      
      const fechaObj = new Date(fecha);
      const inicioDelDia = startOfDay(fechaObj);
      
      // 1. Obtener todas las citas para ese día
      const { citas } = await citaRepo.findByMedicoId(medicoId, fechaObj, 1, 100); // Asumimos max 100 citas por día
      
      // 2. Obtener los bloques bloqueados
      const bloquesBloqueados = await this.getBloquesBloqueados(medicoId, fecha);
      
      // 3. Generar bloques disponibles (de 8:00 a 17:00 con duración según el médico)
      const duracionCita = medico.duracion_cita;
      const bloques: BloqueDisponible[] = [];
      
      // Horario de atención: 8am a 5pm (ajustable)
      const horaInicio = new Date(inicioDelDia);
      horaInicio.setHours(8, 0, 0, 0);
      
      const horaFin = new Date(inicioDelDia);
      horaFin.setHours(17, 0, 0, 0);
      
      // Generar todos los bloques posibles
      for (let tiempo = horaInicio; tiempo < horaFin; tiempo = new Date(tiempo.getTime() + duracionCita * 60000)) {
        const finBloque = new Date(tiempo.getTime() + duracionCita * 60000);
        
        // Verificar si este bloque está disponible
        const estaDisponible = this.verificarDisponibilidad(
          tiempo,
          finBloque,
          citas,
          bloquesBloqueados,
          duracionCita
        );
        
        if (estaDisponible) {
          bloques.push({
            inicio: new Date(tiempo),
            fin: new Date(finBloque)
          });
        }
      }
      
      return bloques;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Error al obtener disponibilidad', { error: error.message });
      throw new AppError('Error al obtener disponibilidad', 500);
    }
  }

  /**
   * Obtiene los bloques bloqueados de un médico para una fecha
   */
  async getBloquesBloqueados(medicoId: string, fecha: string): Promise<BloqueDisponible[]> {
    try {
      const result = await query(
        `SELECT hora_inicio, hora_fin FROM bloques_bloqueados
         WHERE medico_id = $1 AND fecha = $2`,
        [medicoId, fecha]
      );
      
      if (!result) {
        return [];
      }
      
      return result.rows.map((bloque: any) => ({
        inicio: this.combinarFechaHora(fecha, bloque.hora_inicio),
        fin: this.combinarFechaHora(fecha, bloque.hora_fin)
      }));
    } catch (error: any) {
      logger.error('Error al obtener bloques bloqueados', { error: error.message });
      throw new AppError('Error al obtener bloques bloqueados', 500);
    }
  }

  /**
   * Bloquea horarios para un médico en una fecha
   */
  async bloquearHorarios(config: ConfiguracionAgenda): Promise<BloqueBloqueado> {
    try {
      // Verificar si el médico existe
      const medico = await medicoRepo.findById(config.medico_id);
      if (!medico) {
        throw new AppError('Médico no encontrado', 404);
      }
      
      const fechaFormateada = formatDate(new Date(config.fecha));
      
      // Eliminar bloques bloqueados existentes para este médico y fecha
      await query(
        `DELETE FROM bloques_bloqueados
         WHERE medico_id = $1 AND fecha = $2`,
        [config.medico_id, fechaFormateada]
      );
      
      // Insertar nuevos bloques bloqueados
      for (const bloque of config.bloques_bloqueados) {
        const horaInicio = bloque.inicio.toTimeString().substring(0, 8);
        const horaFin = bloque.fin.toTimeString().substring(0, 8);
        
        await query(
          `INSERT INTO bloques_bloqueados (medico_id, fecha, hora_inicio, hora_fin)
           VALUES ($1, $2, $3, $4)`,
          [config.medico_id, fechaFormateada, horaInicio, horaFin]
        );
      }
      
      return {
        fecha: fechaFormateada,
        bloques: config.bloques_bloqueados,
        medico_id: config.medico_id
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Error al bloquear horarios', { error: error.message });
      throw new AppError('Error al configurar agenda', 500);
    }
  }

  /**
   * Cierra la agenda completa para un médico en una fecha
   */
  async cerrarAgenda(medicoId: string, fecha: string): Promise<boolean> {
    try {
      // Verificar si el médico existe
      const medico = await medicoRepo.findById(medicoId);
      if (!medico) {
        throw new AppError('Médico no encontrado', 404);
      }
      
      const fechaFormateada = formatDate(new Date(fecha));
      
      // Verificar si hay citas para ese día
      const fechaObj = new Date(fecha);
      const { citas } = await citaRepo.findByMedicoId(medicoId, fechaObj, 1, 1);
      
      if (citas.length > 0) {
        throw new AppError('No se puede cerrar la agenda porque hay citas programadas', 400);
      }
      
      // Eliminar bloques bloqueados existentes
      await query(
        `DELETE FROM bloques_bloqueados
         WHERE medico_id = $1 AND fecha = $2`,
        [medicoId, fechaFormateada]
      );
      
      // Crear un solo bloque que cubre todo el día
      const horaInicio = '08:00:00'; // Inicio de jornada
      const horaFin = '17:00:00';    // Fin de jornada
      
      await query(
        `INSERT INTO bloques_bloqueados (medico_id, fecha, hora_inicio, hora_fin)
         VALUES ($1, $2, $3, $4)`,
        [medicoId, fechaFormateada, horaInicio, horaFin]
      );
      
      return true;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Error al cerrar agenda', { error: error.message });
      throw new AppError('Error al cerrar agenda', 500);
    }
  }

  // Métodos auxiliares
  private verificarDisponibilidad(
    inicio: Date,
    fin: Date,
    citas: any[],
    bloquesBloqueados: BloqueDisponible[],
    duracionCita: number
  ): boolean {
    // Verificar si hay citas que se solapan con este horario
    const citaSolapada = citas.some(cita => {
      if (cita.estado === 'cancelada') return false;
      
      const citaInicio = new Date(cita.fecha_hora);
      const citaFin = new Date(citaInicio.getTime() + duracionCita * 60000);
      
      return this.seSolapan(inicio, fin, citaInicio, citaFin);
    });
    
    if (citaSolapada) return false;
    
    // Verificar si hay bloques bloqueados que se solapan
    const bloqueSolapado = bloquesBloqueados.some(bloque => 
      this.seSolapan(inicio, fin, bloque.inicio, bloque.fin)
    );
    
    return !bloqueSolapado;
  }
  
  private seSolapan(inicio1: Date, fin1: Date, inicio2: Date, fin2: Date): boolean {
    return inicio1 < fin2 && inicio2 < fin1;
  }
  
  private combinarFechaHora(fecha: string, hora: string): Date {
    const resultado = new Date(`${fecha}T${hora}`);
    return resultado;
  }
}

export default new DisponibilidadRepository();