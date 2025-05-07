import { Admision, AdmisionInput, AdmisionUpdateInput, AdmisionCompleto } from '../models/admision';
import { query } from '../config/database';
import AppError from '../utils/AppError';
import logger from '../utils/logger';

class AdmisionRepository {
  /**
   * Crea un nuevo registro de personal de admisión
   */
  async create(admision: AdmisionInput): Promise<Admision> {
    const { usuario_id, area } = admision;
    
    try {
      const result = await query(
        `INSERT INTO admisiones (usuario_id, area) 
         VALUES ($1, $2) 
         RETURNING *`,
        [usuario_id, area]
      );
      
      if (!result) {
        throw new AppError('Error al crear personal de admisión', 500);
      }
      
      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23505') {
        throw new AppError('El usuario ya está registrado como personal de admisión', 400);
      }
      logger.error('Error al crear personal de admisión', { error: error.message });
      throw new AppError('Error al crear el personal de admisión', 500);
    }
  }

  /**
   * Busca personal de admisión por ID
   */
  async findById(id: string): Promise<Admision | null> {
    try {
      const result = await query('SELECT * FROM admisiones WHERE id = $1', [id]);
      
      if (!result || result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error: any) {
      logger.error('Error al buscar admisión por ID', { error: error.message });
      throw new AppError('Error al buscar el personal de admisión', 500);
    }
  }

  /**
   * Busca personal de admisión por ID de usuario
   */
  async findByUsuarioId(usuarioId: string): Promise<Admision | null> {
    try {
      const result = await query('SELECT * FROM admisiones WHERE usuario_id = $1', [usuarioId]);
      
      if (!result || result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error: any) {
      logger.error('Error al buscar admisión por ID de usuario', { error: error.message });
      throw new AppError('Error al buscar el personal de admisión', 500);
    }
  }

  /**
   * Obtiene información completa de un personal de admisión incluyendo datos de usuario
   */
  async findCompletoById(id: string): Promise<AdmisionCompleto | null> {
    try {
      const result = await query(
        `SELECT a.*, u.nombre, u.email
         FROM admisiones a
         JOIN usuarios u ON a.usuario_id = u.id
         WHERE a.id = $1`,
        [id]
      );
      
      if (!result || result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error: any) {
      logger.error('Error al buscar admisión completa por ID', { error: error.message });
      throw new AppError('Error al buscar el personal de admisión', 500);
    }
  }

  /**
   * Actualiza un registro de personal de admisión existente
   */
  async update(id: string, data: AdmisionUpdateInput): Promise<Admision> {
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
        `UPDATE admisiones 
         SET ${fields.join(', ')} 
         WHERE id = $${count} 
         RETURNING *`,
        values
      );
      
      if (!result || result.rows.length === 0) {
        throw new AppError('Personal de admisión no encontrado', 404);
      }
      
      return result.rows[0];
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Error al actualizar admisión', { error: error.message });
      throw new AppError('Error al actualizar el personal de admisión', 500);
    }
  }

  /**
   * Elimina un registro de personal de admisión
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await query('DELETE FROM admisiones WHERE id = $1 RETURNING id', [id]);
      
      if (!result || result.rows.length === 0) {
        throw new AppError('Personal de admisión no encontrado', 404);
      }
      
      return true;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Error al eliminar admisión', { error: error.message });
      throw new AppError('Error al eliminar el personal de admisión', 500);
    }
  }

  /**
   * Obtiene todos los registros de personal de admisión con paginación
   */
  async findAll(page = 1, limit = 10): Promise<{ admisiones: AdmisionCompleto[], total: number }> {
    const offset = (page - 1) * limit;
    
    try {
      const result = await query(
        `SELECT a.*, u.nombre, u.email
         FROM admisiones a
         JOIN usuarios u ON a.usuario_id = u.id
         ORDER BY u.nombre ASC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      
      // Obtener el conteo total para paginación
      const countResult = await query('SELECT COUNT(*) FROM admisiones');
      
      if (!result || !countResult) {
        return { admisiones: [], total: 0 };
      }
      
      return {
        admisiones: result.rows,
        total: parseInt(countResult.rows[0].count || '0')
      };
    } catch (error: any) {
      logger.error('Error al listar personal de admisión', { error: error.message });
      throw new AppError('Error al buscar personal de admisión', 500);
    }
  }

  /**
   * Obtiene todas las áreas disponibles
   */
  async getAllAreas(): Promise<string[]> {
    try {
      const result = await query(
        `SELECT DISTINCT area FROM admisiones ORDER BY area ASC`
      );
      
      if (!result) {
        return [];
      }
      
      return result.rows.map(row => row.area);
    } catch (error: any) {
      logger.error('Error al obtener áreas', { error: error.message });
      throw new AppError('Error al obtener áreas', 500);
    }
  }
}

export default new AdmisionRepository();