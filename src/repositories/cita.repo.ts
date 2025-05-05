import { Cita, CitaInput, CitaUpdateInput, CitaCompleta, CitaFiltro, EstadoCita } from '../models/cita';
import { query } from '../config/database';
import AppError from '../utils/AppError';
import logger from '../utils/logger';
import { startOfDay, endOfDay } from '../utils/date-utils';

class CitaRepository {
  /**
   * Crea una nueva cita en la base de datos
   */
  async create(cita: CitaInput): Promise<Cita> {
    const { paciente_id, medico_id, fecha_hora } = cita;
    
    try {
      // Verificar disponibilidad del médico en ese horario
      const disponible = await this.verificarDisponibilidad(medico_id, fecha_hora);
      if (!disponible) {
        throw new AppError('El médico no está disponible en ese horario', 400);
      }
      
      const result = await query(
        `INSERT INTO citas (paciente_id, medico_id, fecha_hora, estado) 
         VALUES ($1, $2, $3, 'agendada') 
         RETURNING *`,
        [paciente_id, medico_id, fecha_hora]
      );
      
      return result.rows[0];
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Error al crear cita', { error: error.message });
      throw new AppError('Error al crear la cita', 500);
    }
  }

  /**
   * Busca una cita por ID
   */
  async findById(id: string): Promise<Cita | null> {
    try {
      const result = await query('SELECT * FROM citas WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error: any) {
      logger.error('Error al buscar cita por ID', { error: error.message });
      throw new AppError('Error al buscar la cita', 500);
    }
  }

  /**
   * Obtiene información completa de una cita incluyendo datos de paciente y médico
   */
  async findCompletaById(id: string): Promise<CitaCompleta | null> {
    try {
      const result = await query(
        `SELECT c.*, 
                up.nombre as nombre_paciente,
                up.email as email_paciente,
                um.nombre as nombre_medico,
                m.especialidad,
                m.duracion_cita
         FROM citas c
         JOIN usuarios up ON c.paciente_id = up.id
         JOIN medicos m ON c.medico_id = m.id
         JOIN usuarios um ON m.usuario_id = um.id
         WHERE c.id = $1`,
        [id]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error: any) {
      logger.error('Error al buscar cita completa por ID', { error: error.message });
      throw new AppError('Error al buscar la cita', 500);
    }
  }

  /**
   * Actualiza una cita existente
   */
  async update(id: string, data: CitaUpdateInput): Promise<Cita> {
    const fields: string[] = [];
    const values: any[] = [];
    let count = 1;
    
    // Si hay cambio de fecha, verificar disponibilidad
    if (data.fecha_hora) {
      const cita = await this.findById(id);
      if (!cita) {
        throw new AppError('Cita no encontrada', 404);
      }
      
      const disponible = await this.verificarDisponibilidad(cita.medico_id, data.fecha_hora, id);
      if (!disponible) {
        throw new AppError('El médico no está disponible en ese horario', 400);
      }
    }
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${count}`);
        values.push(value);
        count++;
      }
    });
    
    if (fields.length === 0) {
      throw new AppError('No hay datos para actualizar', 400);
    }
    
    values.push(id);
    
    try {
      const result = await query(
        `UPDATE citas 
         SET ${fields.join(', ')} 
         WHERE id = $${count} 
         RETURNING *`,
        values
      );
      
      if (result.rows.length === 0) {
        throw new AppError('Cita no encontrada', 404);
      }
      
      return result.rows[0];
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Error al actualizar cita', { error: error.message });
      throw new AppError('Error al actualizar la cita', 500);
    }
  }

  /**
   * Actualiza el estado de una cita
   */
  async updateEstado(id: string, estado: EstadoCita): Promise<Cita> {
    try {
      const result = await query(
        `UPDATE citas SET estado = $1 WHERE id = $2 RETURNING *`,
        [estado, id]
      );
      
      if (result.rows.length === 0) {
        throw new AppError('Cita no encontrada', 404);
      }
      
      return result.rows[0];
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Error al actualizar estado de cita', { error: error.message });
      throw new AppError('Error al actualizar el estado de la cita', 500);
    }
  }

  /**
   * Elimina una cita de la base de datos
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await query('DELETE FROM citas WHERE id = $1 RETURNING id', [id]);
      
      if (result.rows.length === 0) {
        throw new AppError('Cita no encontrada', 404);
      }
      
      return true;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Error al eliminar cita', { error: error.message });
      throw new AppError('Error al eliminar la cita', 500);
    }
  }

  /**
   * Busca citas por ID de paciente
   */
  async findByPacienteId(pacienteId: string, page = 1, limit = 10): Promise<{ citas: CitaCompleta[], total: number }> {
    const offset = (page - 1) * limit;
    
    try {
      const result = await query(
        `SELECT c.*, 
                up.nombre as nombre_paciente,
                up.email as email_paciente,
                um.nombre as nombre_medico,
                m.especialidad,
                m.duracion_cita
         FROM citas c
         JOIN usuarios up ON c.paciente_id = up.id
         JOIN medicos m ON c.medico_id = m.id
         JOIN usuarios um ON m.usuario_id = um.id
         WHERE c.paciente_id = $1
         ORDER BY c.fecha_hora DESC
         LIMIT $2 OFFSET $3`,
        [pacienteId, limit, offset]
      );
      
      // Obtener el conteo total para paginación
      const countResult = await query(
        `SELECT COUNT(*) FROM citas WHERE paciente_id = $1`,
        [pacienteId]
      );
      
      return {
        citas: result.rows,
        total: parseInt(countResult.rows[0].count)
      };
    } catch (error: any) {
      logger.error('Error al buscar citas por ID de paciente', { error: error.message });
      throw new AppError('Error al buscar citas', 500);
    }
  }

  /**
   * Busca citas por ID de médico
   */
  async findByMedicoId(medicoId: string, fecha?: Date, page = 1, limit = 10): Promise<{ citas: CitaCompleta[], total: number }> {
    const offset = (page - 1) * limit;
    const values: any[] = [medicoId];
    let condicionFecha = '';
    
    // Si se proporciona fecha, filtrar por ese día
    if (fecha) {
      const inicio = startOfDay(fecha);
      const fin = endOfDay(fecha);
      condicionFecha = ' AND c.fecha_hora BETWEEN $2 AND $3';
      values.push(inicio, fin);
    }
    
    values.push(limit, offset);
    
    try {
      const result = await query(
        `SELECT c.*, 
                up.nombre as nombre_paciente,
                up.email as email_paciente,
                um.nombre as nombre_medico,
                m.especialidad,
                m.duracion_cita
         FROM citas c
         JOIN usuarios up ON c.paciente_id = up.id
         JOIN medicos m ON c.medico_id = m.id
         JOIN usuarios um ON m.usuario_id = um.id
         WHERE c.medico_id = $1${condicionFecha}
         ORDER BY c.fecha_hora ASC
         LIMIT $${values.length - 1} OFFSET $${values.length}`,
        values
      );
      
      // Obtener el conteo total para paginación
      const countValues = values.slice(0, fecha ? 3 : 1); // Solo usar medicoId y posiblemente fechas
      const countResult = await query(
        `SELECT COUNT(*) FROM citas c WHERE c.medico_id = $1${condicionFecha}`,
        countValues
      );
      
      return {
        citas: result.rows,
        total: parseInt(countResult.rows[0].count)
      };
    } catch (error: any) {
      logger.error('Error al buscar citas por ID de médico', { error: error.message });
      throw new AppError('Error al buscar citas', 500);
    }
  }

  /**
   * Filtra citas por diferentes criterios
   */
  async findByFilters(filtros: CitaFiltro, page = 1, limit = 10): Promise<{ citas: CitaCompleta[], total: number }> {
    const offset = (page - 1) * limit;
    const where: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (filtros.fecha_inicio && filtros.fecha_fin) {
      where.push(`c.fecha_hora BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
      values.push(filtros.fecha_inicio, filtros.fecha_fin);
      paramIndex += 2;
    } else if (filtros.fecha_inicio) {
      where.push(`c.fecha_hora >= $${paramIndex}`);
      values.push(filtros.fecha_inicio);
      paramIndex++;
    } else if (filtros.fecha_fin) {
      where.push(`c.fecha_hora <= $${paramIndex}`);
      values.push(filtros.fecha_fin);
      paramIndex++;
    }
    
    if (filtros.paciente_id) {
      where.push(`c.paciente_id = $${paramIndex}`);
      values.push(filtros.paciente_id);
      paramIndex++;
    }
    
    if (filtros.medico_id) {
      where.push(`c.medico_id = $${paramIndex}`);
      values.push(filtros.medico_id);
      paramIndex++;
    }
    
    if (filtros.estado) {
      where.push(`c.estado = $${paramIndex}`);
      values.push(filtros.estado);
      paramIndex++;
    }
    
    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    
    values.push(limit, offset);
    
    try {
      const query_text = `
        SELECT c.*, 
               up.nombre as nombre_paciente,
               up.email as email_paciente,
               um.nombre as nombre_medico,
               m.especialidad,
               m.duracion_cita
        FROM citas c
        JOIN usuarios up ON c.paciente_id = up.id
        JOIN medicos m ON c.medico_id = m.id
        JOIN usuarios um ON m.usuario_id = um.id
        ${whereClause}
        ORDER BY c.fecha_hora ASC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      const result = await query(query_text, values);
      
      // Obtener el conteo total para paginación
      const countValues = values.slice(0, values.length - 2); // Excluir limit y offset
      const countResult = await query(
        `SELECT COUNT(*) 
         FROM citas c
         JOIN usuarios up ON c.paciente_id = up.id
         JOIN medicos m ON c.medico_id = m.id
         JOIN usuarios um ON m.usuario_id = um.id
         ${whereClause}`,
        countValues
      );
      
      return {
        citas: result.rows,
        total: parseInt(countResult.rows[0].count)
      };
    } catch (error: any) {
      logger.error('Error al filtrar citas', { error: error.message });
      throw new AppError('Error al buscar citas', 500);
    }
  }

  /**
   * Verifica la disponibilidad de un médico en un horario específico
   * @param citaIdExcluir ID de cita a excluir (para actualizaciones)
   */
  async verificarDisponibilidad(medicoId: string, fechaHora: Date, citaIdExcluir?: string): Promise<boolean> {
    try {
      // Obtener la duración de cita del médico
      const medicoResult = await query(
        'SELECT duracion_cita FROM medicos WHERE id = $1',
        [medicoId]
      );
      
      if (medicoResult.rows.length === 0) {
        throw new AppError('Médico no encontrado', 404);
      }
      
      const duracionCita = medicoResult.rows[0].duracion_cita;
      
      // Calcular el fin de la cita
      const finCita = new Date(fechaHora);
      finCita.setMinutes(finCita.getMinutes() + duracionCita);
      
      // Verificar si hay citas solapadas
      let queryText = `
        SELECT COUNT(*) FROM citas 
        WHERE medico_id = $1 
        AND estado != 'cancelada'
        AND (
          (fecha_hora <= $2 AND fecha_hora + (interval '1 minute' * $4) > $2)
          OR
          (fecha_hora < $3 AND fecha_hora + (interval '1 minute' * $4) >= $3)
          OR
          (fecha_hora >= $2 AND fecha_hora < $3)
        )
      `;
      
      const values = [medicoId, fechaHora, finCita, duracionCita];
      
      // Si estamos actualizando una cita, excluir esa cita de la verificación
      if (citaIdExcluir) {
        queryText += ' AND id != $5';
        values.push(citaIdExcluir);
      }
      
      const result = await query(queryText, values);
      
      // Si hay citas solapadas, no está disponible
      const count = parseInt(result.rows[0].count);
      return count === 0;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Error al verificar disponibilidad', { error: error.message });
      throw new AppError('Error al verificar disponibilidad', 500);
    }
  }

  /**
   * Obtiene citas para una fecha específica (para agenda diaria)
   */
  async findByFecha(fecha: Date): Promise<CitaCompleta[]> {
    const inicio = startOfDay(fecha);
    const fin = endOfDay(fecha);
    
    try {
      const result = await query(
        `SELECT c.*, 
                up.nombre as nombre_paciente,
                up.email as email_paciente,
                um.nombre as nombre_medico,
                m.especialidad,
                m.duracion_cita
         FROM citas c
         JOIN usuarios up ON c.paciente_id = up.id
         JOIN medicos m ON c.medico_id = m.id
         JOIN usuarios um ON m.usuario_id = um.id
         WHERE c.fecha_hora BETWEEN $1 AND $2
         ORDER BY c.fecha_hora ASC`,
        [inicio, fin]
      );
      
      return result.rows;
    } catch (error: any) {
      logger.error('Error al buscar citas por fecha', { error: error.message });
      throw new AppError('Error al buscar citas', 500);
    }
  }
}

export default new CitaRepository();