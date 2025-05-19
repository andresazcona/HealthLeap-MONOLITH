import usuarioRepository from '../repositories/usuario.repo';
import { Usuario, UsuarioInput, UsuarioUpdateInput, UsuarioOutput } from '../models/usuario';
import bcrypt from 'bcrypt';
import AppError from '../utils/AppError';
import logger from '../utils/logger';

class UsuarioService {
  /**
   * Crea un nuevo usuario
   */
  async createUsuario(userData: UsuarioInput): Promise<Usuario> {
    try {
      // Verificar si el email ya existe
      const existingUser = await usuarioRepository.findByEmail(userData.email);
      if (existingUser) {
        throw new AppError('El email ya está registrado', 400);
      }
      
      // Hash de la contraseña - simplificado para consistencia con los tests
      const password_hash = await bcrypt.hash(userData.password, 10);
      
      // Crear el usuario
      return await usuarioRepository.create({
        ...userData,
        password_hash
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error al crear usuario', { error });
      throw new AppError('Error al crear usuario', 500);
    }
  }

  /**
   * Obtiene un usuario por ID
   */
  async getUsuarioById(id: string): Promise<UsuarioOutput> {
    try {
      const usuario = await usuarioRepository.findById(id);
      
      if (!usuario) {
        throw new AppError('Usuario no encontrado', 404);
      }
      
      // Eliminar el hash de la contraseña para la respuesta
      const { password_hash, ...usuarioSinPassword } = usuario;
      return usuarioSinPassword as UsuarioOutput;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error al obtener usuario por ID', { error, id });
      throw new AppError('Error al obtener el usuario', 500);
    }
  }

  /**
   * Obtiene un usuario por email
   */
  async getUsuarioByEmail(email: string): Promise<UsuarioOutput> {
    try {
      const usuario = await usuarioRepository.findByEmail(email);
      
      if (!usuario) {
        throw new AppError('Usuario no encontrado', 404);
      }
      
      // Eliminar el hash de la contraseña para la respuesta
      const { password_hash, ...usuarioSinPassword } = usuario;
      return usuarioSinPassword as UsuarioOutput;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error al obtener usuario por email', { error, email });
      throw new AppError('Error al obtener el usuario', 500);
    }
  }

  /**
   * Actualiza un usuario existente
   */
  async updateUsuario(id: string, userData: UsuarioUpdateInput): Promise<UsuarioOutput> {
    try {
      // Verificar si el usuario existe
      const existingUser = await usuarioRepository.findById(id);
      if (!existingUser) {
        throw new AppError('Usuario no encontrado', 404);
      }
      
      // Preparar datos para actualización con tipado correcto
      // Usamos una intersección de tipos para incluir password
      const updateData = { ...userData } as Partial<Usuario> & { password?: string };
      
      // Si hay cambio de contraseña, hashearla
      if (userData.password) {
        // Usar directamente 10 como salt rounds para consistencia con los tests
        updateData.password_hash = await bcrypt.hash(userData.password, 10);
        delete updateData.password;
      }
      
      // Si hay cambio de email, verificar que no esté ya registrado
      if (userData.email && userData.email !== existingUser.email) {
        const emailExists = await usuarioRepository.findByEmail(userData.email);
        if (emailExists) {
          throw new AppError('El correo electrónico ya está registrado', 400);
        }
      }
      
      // Actualizar usuario con type assertion
      const updatedUser = await usuarioRepository.update(id, updateData as any);
      
      // Eliminar el hash de la contraseña para la respuesta
      const { password_hash, ...usuarioSinPassword } = updatedUser;
      return usuarioSinPassword as UsuarioOutput;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error al actualizar usuario', { error, id });
      throw new AppError('Error al actualizar el usuario', 500);
    }
  }

  /**
   * Elimina un usuario por ID
   */
  async deleteUsuario(id: string): Promise<boolean> {
    try {
      return await usuarioRepository.delete(id);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error al eliminar usuario', { error, id });
      throw new AppError('Error al eliminar el usuario', 500);
    }
  }

  /**
   * Obtiene todos los usuarios con paginación y filtro opcional por rol
   */
  async getAllUsuarios(page: number, limit: number, rol?: string): Promise<{ usuarios: UsuarioOutput[], total: number }> {
    try {
      const result = await usuarioRepository.findAll(page, limit, rol);
      
      // Eliminar los hash de contraseñas
      const usuarios = result.usuarios.map(usuario => {
        // Aunque el repo ya debería retornar sin password_hash, aseguramos la respuesta
        const { password_hash, ...usuarioSinPassword } = usuario as any;
        return usuarioSinPassword;
      });
      
      return {
        usuarios,
        total: result.total
      };
    } catch (error) {
      logger.error('Error al obtener todos los usuarios', { error });
      throw new AppError('Error al obtener los usuarios', 500);
    }
  }

  /**
   * Verifica las credenciales de un usuario
   * @returns El usuario completo con password_hash si las credenciales son válidas
   */
  async verificarCredenciales(email: string, password: string): Promise<Usuario | null> {
    try {
      // Obtener usuario por email
      const usuario = await usuarioRepository.findByEmail(email);
      
      if (!usuario) {
        return null;
      }
      
      // Verificar contraseña
      const passwordValid = await bcrypt.compare(password, usuario.password_hash);
      
      if (!passwordValid) {
        return null;
      }
      
      return usuario;
    } catch (error) {
      logger.error('Error al verificar credenciales', { error, email });
      throw new AppError('Error al verificar credenciales', 500);
    }
  }

  /**
   * Cambia la contraseña de un usuario
   */
  async cambiarPassword(id: string, oldPassword: string, newPassword: string): Promise<boolean> {
    try {
      // Obtener usuario actual
      const usuario = await usuarioRepository.findById(id);
      
      if (!usuario) {
        throw new AppError('Usuario no encontrado', 404);
      }
      
      // Verificar contraseña actual
      const passwordValid = await bcrypt.compare(oldPassword, usuario.password_hash);
      
      if (!passwordValid) {
        throw new AppError('Contraseña actual incorrecta', 400);
      }
      
      // Hashear nueva contraseña - simplificado para consistencia con los tests
      const password_hash = await bcrypt.hash(newPassword, 10);
      
      // Actualizar contraseña
      await usuarioRepository.update(id, { password_hash } as any);
      
      return true;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error al cambiar contraseña', { error, id });
      throw new AppError('Error al cambiar la contraseña', 500);
    }
  }
}

export default new UsuarioService();