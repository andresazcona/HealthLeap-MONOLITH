import authService from '../../src/services/auth.service';
import usuarioService from '../../src/services/usuario.service';
import jwt from 'jsonwebtoken';
import AppError from '../../src/utils/AppError';
import { UsuarioInput } from '../../src/models/usuario';

// Mock dependencies
jest.mock('../../src/services/usuario.service');
jest.mock('jsonwebtoken');
jest.mock('../../src/utils/logger');

describe('AuthService', () => {
  // Test data
  const mockUsuarioId = '123e4567-e89b-12d3-a456-426614174000';
  
  const mockCredentials = {
    email: 'juan@example.com',
    password: 'Password123!'
  };
  
  const mockUsuario = {
    id: mockUsuarioId,
    nombre: 'Juan Pérez',
    email: 'juan@example.com',
    password_hash: 'hashed_password',
    rol: 'paciente',
    activo: true,
    created_at: new Date()
  };
  
  const mockUsuarioOutput = {
    id: mockUsuarioId,
    nombre: 'Juan Pérez',
    email: 'juan@example.com',
    rol: 'paciente',
    activo: true,
    created_at: new Date()
  };
  
  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default JWT mock implementation
    (jwt.sign as jest.Mock).mockReturnValue(mockToken);
    (jwt.verify as jest.Mock).mockReturnValue({ id: mockUsuarioId });
  });

  describe('login', () => {
    it('should authenticate user and return token', async () => {
      (usuarioService.verificarCredenciales as jest.Mock).mockResolvedValue(mockUsuario);
      
      const result = await authService.login(mockCredentials);
      
      expect(usuarioService.verificarCredenciales).toHaveBeenCalledWith(
        mockCredentials.email,
        mockCredentials.password
      );
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: mockUsuarioId },
        expect.any(String),
        { expiresIn: expect.any(String) }
      );
      expect(result).toEqual({
        usuario: expect.objectContaining({ id: mockUsuarioId }),
        token: mockToken
      });
    });

    it('should throw error for invalid credentials', async () => {
      (usuarioService.verificarCredenciales as jest.Mock).mockResolvedValue(null);
      
      await expect(authService.login({
        email: mockCredentials.email,
        password: 'WrongPassword'
      })).rejects.toThrow(new AppError('Credenciales inválidas', 401));
    });

    it('should throw error for inactive user', async () => {
      const inactiveUser = { ...mockUsuario, activo: false };
      (usuarioService.verificarCredenciales as jest.Mock).mockResolvedValue(inactiveUser);
      
      await expect(authService.login(mockCredentials))
        .rejects.toThrow(new AppError('Usuario inactivo. Contacte al administrador', 403));
    });
  });

  describe('register', () => {
    const registerData: UsuarioInput = {
      nombre: 'Juan Pérez',
      email: 'juan@example.com',
      password: 'Password123!',
      rol: 'paciente'
    };

    it('should register new user and return token', async () => {
      (usuarioService.createUsuario as jest.Mock).mockResolvedValue(mockUsuarioOutput);
      
      const result = await authService.register(registerData);
      
      expect(usuarioService.createUsuario).toHaveBeenCalledWith(registerData);
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: mockUsuarioId },
        expect.any(String),
        { expiresIn: expect.any(String) }
      );
      expect(result).toEqual({
        usuario: mockUsuarioOutput,
        token: mockToken
      });
    });

    it('should pass along creation errors', async () => {
      const error = new AppError('El email ya está registrado', 400);
      (usuarioService.createUsuario as jest.Mock).mockRejectedValue(error);
      
      await expect(authService.register(registerData))
        .rejects.toThrow(error);
    });
  });

  describe('validarToken', () => {
    it('should verify and decode valid token', async () => {
      (usuarioService.getUsuarioById as jest.Mock).mockResolvedValue(mockUsuarioOutput);
      
      const result = await authService.validarToken(mockToken);
      
      expect(jwt.verify).toHaveBeenCalledWith(mockToken, expect.any(String));
      expect(usuarioService.getUsuarioById).toHaveBeenCalledWith(mockUsuarioId);
      expect(result).toEqual(mockUsuarioOutput);
    });

    it('should throw error for invalid token', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Token inválido');
      });
      
      await expect(authService.validarToken('invalid-token'))
        .rejects.toThrow(new AppError('Token inválido o expirado', 401));
    });

    it('should throw error for nonexistent user', async () => {
      (usuarioService.getUsuarioById as jest.Mock).mockRejectedValue(
        new AppError('Usuario no encontrado', 404)
      );
      
      await expect(authService.validarToken(mockToken))
        .rejects.toThrow(new AppError('Usuario no encontrado', 404));
    });
  });

  // Las pruebas de recuperación de contraseña se omiten ya que estos métodos
  // no están implementados aún en el servicio actual
  // Si planeas implementarlos, puedes descomentar y adaptar estas pruebas
  
  /*
  describe('solicitarRecuperacionPassword', () => {
    it('should generate recovery token and store it', async () => {
      const mockResetToken = 'reset-token-123456';
      
      // Mock para simular que encontramos el usuario
      (usuarioService.getUsuarioByEmail as jest.Mock).mockResolvedValue(mockUsuarioOutput);
      
      // Mock para la actualización del usuario con el token de recuperación
      (usuarioService.updateUsuario as jest.Mock).mockResolvedValue({
        ...mockUsuarioOutput,
        reset_token: mockResetToken,
        reset_token_expiry: expect.any(Date)
      });
      
      const result = await authService.solicitarRecuperacionPassword('juan@example.com');
      
      expect(usuarioService.getUsuarioByEmail).toHaveBeenCalledWith('juan@example.com');
      expect(usuarioService.updateUsuario).toHaveBeenCalledWith(
        mockUsuarioId,
        expect.objectContaining({
          reset_token: expect.any(String),
          reset_token_expiry: expect.any(Date)
        })
      );
      expect(result).toBe(true);
    });

    it('should throw error for nonexistent email', async () => {
      (usuarioService.getUsuarioByEmail as jest.Mock).mockRejectedValue(
        new AppError('Usuario no encontrado', 404)
      );
      
      await expect(authService.solicitarRecuperacionPassword('nonexistent@example.com'))
        .rejects.toThrow(new AppError('Usuario no encontrado', 404));
    });
  });

  describe('restablecerPassword', () => {
    const mockResetToken = 'reset-token-123456';
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 1);
    
    const recoveryData = {
      token: mockResetToken,
      newPassword: 'NewPassword456!'
    };
    
    it('should reset password with valid token', async () => {
      const userWithResetToken = {
        ...mockUsuarioOutput,
        reset_token: mockResetToken,
        reset_token_expiry: futureDate
      };
      
      // Mock para buscar usuario por token (función personalizada a implementar)
      (usuarioService.buscarPorTokenReset as jest.Mock) = jest.fn().mockResolvedValue(userWithResetToken);
      
      (usuarioService.updateUsuario as jest.Mock).mockResolvedValue({
        ...userWithResetToken,
        reset_token: null,
        reset_token_expiry: null
      });
      
      const result = await authService.restablecerPassword(
        recoveryData.token,
        recoveryData.newPassword
      );
      
      expect(usuarioService.buscarPorTokenReset).toHaveBeenCalledWith(recoveryData.token);
      expect(usuarioService.updateUsuario).toHaveBeenCalledWith(
        mockUsuarioId,
        expect.objectContaining({
          password: recoveryData.newPassword,
          reset_token: null,
          reset_token_expiry: null
        })
      );
      expect(result).toBe(true);
    });

    it('should throw error for invalid token', async () => {
      (usuarioService.buscarPorTokenReset as jest.Mock) = jest.fn().mockResolvedValue(null);
      
      await expect(authService.restablecerPassword(
        'invalid-token',
        recoveryData.newPassword
      )).rejects.toThrow(new AppError('Token inválido o expirado', 400));
    });

    it('should throw error for expired token', async () => {
      const expiredDate = new Date();
      expiredDate.setHours(expiredDate.getHours() - 1);
      
      const userWithExpiredToken = {
        ...mockUsuarioOutput,
        reset_token: mockResetToken,
        reset_token_expiry: expiredDate
      };
      
      (usuarioService.buscarPorTokenReset as jest.Mock) = jest.fn().mockResolvedValue(userWithExpiredToken);
      
      await expect(authService.restablecerPassword(
        recoveryData.token,
        recoveryData.newPassword
      )).rejects.toThrow(new AppError('Token expirado. Solicite un nuevo enlace de recuperación', 400));
    });
  });
  */
});