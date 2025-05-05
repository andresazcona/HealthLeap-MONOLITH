import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import usuarioRepository from '../repositories/usuario.repo';
import { UsuarioLoginInput, UsuarioInput, AuthResponse, TokenPayload } from '../models/usuario';
import config from '../config/enviroment';
import AppError from '../utils/AppError';
import logger from '../utils/logger';

class AuthService {
  /**
   * Registra un nuevo usuario en el sistema
   */
  async register(userData: UsuarioInput): Promise<AuthResponse> {
    // Verificar si el email ya existe
    const userExists = await usuarioRepository.findByEmail(userData.email);
    if (userExists) {
      throw new AppError('El correo electrónico ya está registrado', 400);
    }

    // Hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(userData.password, salt);

    // Crear usuario
    const newUser = await usuarioRepository.create({
      ...userData,
      password_hash
    });

    // Generar tokens
    const tokens = this.generateTokens(newUser.id, newUser.rol);

    // Eliminar password_hash para la respuesta
    const { password_hash: _, ...userWithoutPassword } = newUser;

    return {
      user: userWithoutPassword,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    };
  }

  /**
   * Autentica un usuario y genera tokens de acceso
   */
  async login(credentials: UsuarioLoginInput): Promise<AuthResponse> {
    // Buscar usuario por email
    const user = await usuarioRepository.findByEmail(credentials.email);
    if (!user) {
      throw new AppError('Credenciales incorrectas', 401);
    }

    // Verificar contraseña
    const passwordMatches = await bcrypt.compare(credentials.password, user.password_hash);
    if (!passwordMatches) {
      throw new AppError('Credenciales incorrectas', 401);
    }

    // Generar tokens
    const tokens = this.generateTokens(user.id, user.rol);

    // Eliminar password_hash para la respuesta
    const { password_hash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    };
  }

  /**
   * Renueva el token de acceso utilizando el token de refresco
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      // Verificar token de refresco
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as TokenPayload;
      
      // Verificar que el usuario existe
      const user = await usuarioRepository.findById(decoded.id);
      if (!user) {
        throw new AppError('Usuario no encontrado', 404);
      }

      // Generar nuevo token de acceso
      const accessToken = jwt.sign(
        { id: user.id, rol: user.rol },
        config.jwt.secret,
        { expiresIn: config.jwt.accessExpirationInterval }
      );

      return { accessToken };
    } catch (error) {
      logger.error('Error al refrescar token', { error });
      throw new AppError('Token de refresco inválido o expirado', 401);
    }
  }

  /**
   * Genera tokens de acceso y refresco
   */
  private generateTokens(userId: string, userRole: string) {
    const accessToken = jwt.sign(
      { id: userId, rol: userRole },
      config.jwt.secret,
      { expiresIn: config.jwt.accessExpirationInterval }
    );

    const refreshToken = jwt.sign(
      { id: userId, rol: userRole },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpirationInterval }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Envía email para resetear contraseña
   */
  async forgotPassword(email: string): Promise<boolean> {
    // Verificar si el usuario existe
    const user = await usuarioRepository.findByEmail(email);
    if (!user) {
      // No revelar si el email existe o no por seguridad
      return true;
    }

    // En una implementación real, aquí enviaríamos el email con un token
    // Usando el servicio de notificación

    logger.info(`Solicitud de reseteo de contraseña para: ${email}`);
    return true;
  }

  /**
   * Resetea la contraseña de un usuario
   */
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    try {
      // Verificar token
      const decoded = jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;

      // Verificar que el usuario existe
      const user = await usuarioRepository.findById(decoded.id);
      if (!user) {
        throw new AppError('Usuario no encontrado', 404);
      }

      // Hash de la nueva contraseña
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(newPassword, salt);

      // Actualizar usuario
      await usuarioRepository.update(user.id, { password: password_hash });

      return true;
    } catch (error) {
      logger.error('Error al resetear contraseña', { error });
      throw new AppError('Token inválido o expirado', 401);
    }
  }

  /**
   * Cierra sesión (implementación simbólica - JWT no tiene sesiones)
   */
  async logout(): Promise<boolean> {
    // Con JWT, la invalidación debe ser manejada por el cliente eliminando tokens
    // En una implementación real, podríamos tener una lista negra de tokens
    return true;
  }
}

export default new AuthService();