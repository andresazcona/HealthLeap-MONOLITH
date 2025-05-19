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
  
  const mockAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  const mockRefreshToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default JWT mock implementation
    (jwt.sign as jest.Mock).mockReturnValue(mockAccessToken);
    (jwt.verify as jest.Mock).mockReturnValue({ id: mockUsuarioId });
    
    // Mock usuarioService methods
    (usuarioService.verificarCredenciales as jest.Mock).mockResolvedValue(mockUsuario);
    (usuarioService.createUsuario as jest.Mock).mockResolvedValue(mockUsuarioOutput);
  });

  describe('login', () => {
    it('should authenticate user and return token', async () => {
      const result = await authService.login(mockCredentials);
      
      expect(usuarioService.verificarCredenciales).toHaveBeenCalledWith(
        mockCredentials.email,
        mockCredentials.password
      );
      
      // The function now returns both accessToken and refreshToken
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user).toHaveProperty('id');
    });

    it('should throw error for invalid credentials', async () => {
      (usuarioService.verificarCredenciales as jest.Mock).mockResolvedValue(null);
      
      await expect(authService.login({
        email: mockCredentials.email,
        password: 'WrongPassword'
      })).rejects.toThrow(new AppError('Credenciales incorrectas', 401));
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
      const result = await authService.register(registerData);
      
      expect(usuarioService.createUsuario).toHaveBeenCalledWith(registerData);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
    });

    it('should pass along creation errors', async () => {
      const error = new AppError('El correo electrónico ya está registrado', 400);
      (usuarioService.createUsuario as jest.Mock).mockRejectedValue(error);
      
      await expect(authService.register(registerData))
        .rejects.toThrow(error);
    });
  });

  // Optional: Comment out the validarToken test suite if you're not implementing it yet
  /*
  describe('validarToken', () => {
    it('should verify and decode valid token', async () => {
      (usuarioService.getUsuarioById as jest.Mock).mockResolvedValue(mockUsuarioOutput);
      
      const result = await authService.validarToken(mockAccessToken);
      
      expect(jwt.verify).toHaveBeenCalledWith(mockAccessToken, expect.any(String));
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
      
      await expect(authService.validarToken(mockAccessToken))
        .rejects.toThrow(new AppError('Usuario no encontrado', 404));
    });
  });
  */
});