import { Medico, MedicoInput, MedicoUpdateInput, MedicoCompleto, MedicoFiltro } from '../models/medico';
import { query } from '../config/database';
import AppError from '../utils/AppError';
import logger from '../utils/logger';

class MedicoRepository {
  /**
   * Crea un nuevo médico en la base de datos
   */
  async create(medico: MedicoInput): Promise<Medico> {
    const { usuario_id, especialidad, centro_id, duracion_cita = 30 } = medico;
    
    try {
      const result = await query(
        `INSERT INTO medicos (usuario_id, especialidad, centro_id, duracion_cita) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [usuario_id, especialidad, centro_id, duracion_cita]
      );
      
      return result?.rows[0];
    } catch (error: any) {
      if (error.code === '23505') {
        throw new AppError('El usuario ya está registrado como médico', 400);
      }
      logger.error('Error al crear médico', { error: error.message });
      throw new AppError('Error al crear el médico', 500);
    }
  }

  /**
   * Busca un médico por ID
   */
  async findById(id: string): Promise<Medico | null> {
    try {
      const result = await query('SELECT * FROM medicos WHERE id = $1', [id]);
      
      if (!result || result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error: any) {
      logger.error('Error al buscar médico por ID', { error: error.message });
      throw new AppError('Error al buscar el médico', 500);
    }
  }

  /**
   * Busca un médico por ID de usuario
   */
  async findByUsuarioId(usuarioId: string): Promise<Medico | null> {
    try {
      const result = await query('SELECT * FROM medicos WHERE usuario_id = $1', [usuarioId]);
      
      if (!result || result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error: any) {
      logger.error('Error al buscar médico por ID de usuario', { error: error.message });
      throw new AppError('Error al buscar el médico', 500);
    }
  }

  /**
   * Obtiene información completa de un médico incluyendo datos de usuario
   */
  async findCompletoById(id: string): Promise<MedicoCompleto | null> {
    try {
      const result = await query(
        `SELECT m.*, u.nombre, u.email
         FROM medicos m
         JOIN usuarios u ON m.usuario_id = u.id
         WHERE m.id = $1`,
        [id]
      );
      
      if (!result || result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error: any) {
      logger.error('Error al buscar médico completo por ID', { error: error.message });
      throw new AppError('Error al buscar el médico', 500);
    }
  }

  /**
   * Actualiza un médico existente
   */
  async update(id: string, data: MedicoUpdateInput): Promise<Medico> {
    const fields: string[] = [];
    const values: any[] = [];
    let count = 1;
    
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
        `UPDATE medicos 
         SET ${fields.join(', ')} 
         WHERE id = $${count} 
         RETURNING *`,
        values
      );
      
      if (!result || result.rows.length === 0) {
        throw new AppError('Médico no encontrado', 404);
      }
      
      return result.rows[0];
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Error al actualizar médico', { error: error.message });
      throw new AppError('Error al actualizar el médico', 500);
    }
  }

  /**
   * Elimina un médico de la base de datos
   */
  async delete(id: string): Promise<boolean> {
    try {
      // Primero verificamos si tiene citas asociadas
      const citasResult = await query('SELECT COUNT(*) FROM citas WHERE medico_id = $1', [id]);
      
      if (!citasResult) {
        throw new AppError('Error al verificar citas asociadas', 500);
      }
      
      if (parseInt(citasResult.rows[0].count) > 0) {
        throw new AppError('No se puede eliminar un médico que tiene citas asociadas', 400);
      }
      
      const result = await query('DELETE FROM medicos WHERE id = $1 RETURNING id', [id]);
      
      if (!result || result.rows.length === 0) {
        throw new AppError('Médico no encontrado', 404);
      }
      
      return true;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Error al eliminar médico', { error: error.message });
      throw new AppError('Error al eliminar el médico', 500);
    }
  }

  /**
   * Busca médicos por especialidad
   */
  async findByEspecialidad(especialidad: string): Promise<MedicoCompleto[]> {
    try {
      const result = await query(
        `SELECT m.*, u.nombre, u.email
         FROM medicos m
         JOIN usuarios u ON m.usuario_id = u.id
         WHERE m.especialidad = $1
         ORDER BY u.nombre ASC`,
        [especialidad]
      );
      
      if (!result) {
        return [];
      }
      
      return result.rows;
    } catch (error: any) {
      logger.error('Error al buscar médicos por especialidad', { error: error.message });
      throw new AppError('Error al buscar médicos por especialidad', 500);
    }
  }

  /**
   * Filtra médicos por diferentes criterios
   */
  async findByFilters(filtros: MedicoFiltro, page = 1, limit = 10): Promise<{ medicos: MedicoCompleto[], total: number }> {
    const offset = (page - 1) * limit;
    const where: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (filtros.especialidad) {
      where.push(`m.especialidad = $${paramIndex}`);
      values.push(filtros.especialidad);
      paramIndex++;
    }
    
    if (filtros.centro_id) {
      where.push(`m.centro_id = $${paramIndex}`);
      values.push(filtros.centro_id);
      paramIndex++;
    }
    
    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    
    try {
      const query_text = `
        SELECT m.*, u.nombre, u.email
        FROM medicos m
        JOIN usuarios u ON m.usuario_id = u.id
        ${whereClause}
        ORDER BY u.nombre ASC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      values.push(limit, offset);
      
      const result = await query(query_text, values);
      
      // Obtener el conteo total para paginación
      const countResult = await query(
        `SELECT COUNT(*) 
         FROM medicos m
         JOIN usuarios u ON m.usuario_id = u.id
         ${whereClause}`,
        values.slice(0, values.length - 2) // Excluir limit y offset
      );
      
      if (!result || !countResult) {
        return { medicos: [], total: 0 };
      }
      
      return {
        medicos: result.rows,
        total: parseInt(countResult.rows[0].count || '0')
      };
    } catch (error: any) {
      logger.error('Error al filtrar médicos', { error: error.message });
      throw new AppError('Error al buscar médicos', 500);
    }
  }

  /**
   * Obtiene todas las especialidades disponibles
   */
  async getAllEspecialidades(): Promise<string[]> {
    try {
      const result = await query(
        `SELECT DISTINCT especialidad FROM medicos ORDER BY especialidad ASC`
      );
      
      if (!result) {
        return [];
      }
      
      return result.rows.map(row => row.especialidad);
    } catch (error: any) {
      logger.error('Error al obtener especialidades', { error: error.message });
      throw new AppError('Error al obtener especialidades', 500);
    }
  }
}

export default new MedicoRepository();