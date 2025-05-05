import { Usuario, UsuarioInput, UsuarioUpdateInput, UsuarioOutput } from '../models/usuario';
import { query } from '../config/database';
import AppError from '../utils/AppError';
import logger from '../utils/logger';

class UsuarioRepository {
  /**
   * Crea un nuevo usuario en la base de datos
   */
  async create(usuario: UsuarioInput & { password_hash: string }): Promise<Usuario> {
    const { nombre, email, password_hash, rol } = usuario;
    
    try {
      const result = await query(
        `INSERT INTO usuarios (nombre, email, password_hash, rol) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [nombre, email, password_hash, rol]
      );
      
      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23505') { // Unique violation
        throw new AppError('El correo electrónico ya está registrado', 400);
      }
      logger.error('Error al crear usuario', { error: error.message });
      throw new AppError('Error al crear el usuario', 500);
    }
  }

  /**
   * Busca un usuario por ID
   */
  async findById(id: string): Promise<Usuario | null> {
    try {
      const result = await query('SELECT * FROM usuarios WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error: any) {
      logger.error('Error al buscar usuario por ID', { error: error.message });
      throw new AppError('Error al buscar el usuario', 500);
    }
  }

  /**
   * Busca un usuario por email
   */
  async findByEmail(email: string): Promise<Usuario | null> {
    try {
      const result = await query('SELECT * FROM usuarios WHERE email = $1', [email]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error: any) {
      logger.error('Error al buscar usuario por email', { error: error.message });
      throw new AppError('Error al buscar el usuario', 500);
    }
  }

  /**
   * Actualiza un usuario existente
   */
  async update(id: string, data: UsuarioUpdateInput): Promise<Usuario> {
    const fields: string[] = [];
    const values: any[] = [];
    let count = 1;
    
    // Construir dinámicamente la consulta de actualización
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
        `UPDATE usuarios 
         SET ${fields.join(', ')} 
         WHERE id = $${count} 
         RETURNING *`,
        values
      );
      
      if (result.rows.length === 0) {
        throw new AppError('Usuario no encontrado', 404);
      }
      
      return result.rows[0];
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Error al actualizar usuario', { error: error.message });
      throw new AppError('Error al actualizar el usuario', 500);
    }
  }

  /**
   * Elimina un usuario de la base de datos
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await query('DELETE FROM usuarios WHERE id = $1 RETURNING id', [id]);
      
      if (result.rows.length === 0) {
        throw new AppError('Usuario no encontrado', 404);
      }
      
      return true;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Error al eliminar usuario', { error: error.message });
      throw new AppError('Error al eliminar el usuario', 500);
    }
  }

  /**
   * Obtiene una lista paginada de usuarios
   */
  async findAll(page = 1, limit = 10, rol?: string): Promise<{ usuarios: UsuarioOutput[], total: number }> {
    const offset = (page - 1) * limit;
    
    try {
      let query_text = 'SELECT id, nombre, email, rol, created_at FROM usuarios';
      const values: any[] = [];
      
      if (rol) {
        query_text += ' WHERE rol = $1';
        values.push(rol);
      }
      
      query_text += ' ORDER BY created_at DESC LIMIT $' + (values.length + 1) + ' OFFSET $' + (values.length + 2);
      values.push(limit, offset);
      
      const result = await query(query_text, values);
      
      // Obtener el total para la paginación
      const countResult = await query(
        'SELECT COUNT(*) FROM usuarios' + (rol ? ' WHERE rol = $1' : ''),
        rol ? [rol] : []
      );
      
      return {
        usuarios: result.rows,
        total: parseInt(countResult.rows[0].count)
      };
    } catch (error: any) {
      logger.error('Error al buscar usuarios', { error: error.message });
      throw new AppError('Error al buscar usuarios', 500);
    }
  }
}

export default new UsuarioRepository();