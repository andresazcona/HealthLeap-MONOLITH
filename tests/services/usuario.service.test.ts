import usuarioService from '../../src/services/usuario.service';
import usuarioRepository from '../../src/repositories/usuario.repo';
import { UsuarioInput, UsuarioUpdateInput, RolUsuario } from '../../src/models/usuario';
import bcrypt from 'bcrypt';
import AppError from '../../src/utils/AppError';

// Mock dependencies
jest.mock('../../src/repositories/usuario.repo');
jest.mock('bcrypt');
jest.mock('../../src/utils/logger');

describe('UsuarioService', () => {
  // Test data
  const mockUsuarioId = '123e4567-e89b-12d3-a456-426614174000';
  
  const mockUsuarioInput: UsuarioInput = {
    nombre: 'Juan Pérez',
    email: 'juan@example.com',
    password: 'Password123!',
    rol: 'paciente' as RolUsuario
  };
  
  const mockUsuario = {
    id: mockUsuarioId,
    nombre: 'Juan Pérez',
    email: 'juan@example.com',
    password_hash: 'hashed_password',
    rol: 'paciente' as RolUsuario,
    activo: true,
    created_at: new Date()
  };
  
  const mockUsuarioOutput = {
    id: mockUsuarioId,
    nombre: 'Juan Pérez',
    email: 'juan@example.com',
    rol: 'paciente' as RolUsuario,
    activo: true,
    created_at: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default bcrypt mock implementation
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  describe('createUsuario', () => {
    it('should create a new user', async () => {
      (usuarioRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (usuarioRepository.create as jest.Mock).mockResolvedValue(mockUsuario);
      
      const result = await usuarioService.createUsuario(mockUsuarioInput);
      
      expect(usuarioRepository.findByEmail).toHaveBeenCalledWith(mockUsuarioInput.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(mockUsuarioInput.password, 10);
      expect(usuarioRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          password_hash: 'hashed_password'
        })
      );
      expect(result).toMatchObject(mockUsuarioOutput);
    });

    it('should throw error if email already exists', async () => {
      (usuarioRepository.findByEmail as jest.Mock).mockResolvedValue(mockUsuario);
      
      await expect(usuarioService.createUsuario(mockUsuarioInput))
        .rejects.toThrow(new AppError('El email ya está registrado', 400));
      
      expect(usuarioRepository.create).not.toHaveBeenCalled();
    });

    it('should handle password hashing errors', async () => {
      (usuarioRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Hashing error'));
      
      await expect(usuarioService.createUsuario(mockUsuarioInput))
        .rejects.toThrow(new AppError('Error al crear usuario', 500));
    });
  });

  describe('getUsuarioById', () => {
    it('should get a user by ID', async () => {
      (usuarioRepository.findById as jest.Mock).mockResolvedValue(mockUsuario);
      
      const result = await usuarioService.getUsuarioById(mockUsuarioId);
      
      expect(usuarioRepository.findById).toHaveBeenCalledWith(mockUsuarioId);
      expect(result).toMatchObject(mockUsuarioOutput);
      expect(result).not.toHaveProperty('password_hash');
    });

    it('should throw error if user not found', async () => {
      (usuarioRepository.findById as jest.Mock).mockResolvedValue(null);
      
      await expect(usuarioService.getUsuarioById('nonexistent-id'))
        .rejects.toThrow(new AppError('Usuario no encontrado', 404));
    });
  });

  describe('getUsuarioByEmail', () => {
    it('should get a user by email', async () => {
      (usuarioRepository.findByEmail as jest.Mock).mockResolvedValue(mockUsuario);
      
      const result = await usuarioService.getUsuarioByEmail('juan@example.com');
      
      expect(usuarioRepository.findByEmail).toHaveBeenCalledWith('juan@example.com');
      expect(result).toMatchObject(mockUsuarioOutput);
    });

    it('should throw error if user not found by email', async () => {
      (usuarioRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      
      await expect(usuarioService.getUsuarioByEmail('nonexistent@example.com'))
        .rejects.toThrow(new AppError('Usuario no encontrado', 404));
    });
  });

  describe('updateUsuario', () => {
    const updateData: UsuarioUpdateInput = {
      nombre: 'Juan Actualizado',
      email: 'juan.nuevo@example.com'
    };

    it('should update a user', async () => {
      (usuarioRepository.findById as jest.Mock).mockResolvedValue(mockUsuario);
      (usuarioRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (usuarioRepository.update as jest.Mock).mockResolvedValue({
        ...mockUsuario,
        ...updateData
      });
      
      const result = await usuarioService.updateUsuario(mockUsuarioId, updateData);
      
      expect(usuarioRepository.findById).toHaveBeenCalledWith(mockUsuarioId);
      expect(usuarioRepository.findByEmail).toHaveBeenCalledWith(updateData.email);
      expect(usuarioRepository.update).toHaveBeenCalledWith(mockUsuarioId, updateData);
      expect(result.nombre).toBe(updateData.nombre);
      expect(result.email).toBe(updateData.email);
    });

    it('should throw error if user not found', async () => {
      (usuarioRepository.findById as jest.Mock).mockResolvedValue(null);
      
      await expect(usuarioService.updateUsuario('nonexistent-id', updateData))
        .rejects.toThrow(new AppError('Usuario no encontrado', 404));
    });

    it('should throw error if new email already exists', async () => {
      const anotherUser = { ...mockUsuario, id: 'another-id' };
      
      (usuarioRepository.findById as jest.Mock).mockResolvedValue(mockUsuario);
      (usuarioRepository.findByEmail as jest.Mock).mockResolvedValue(anotherUser);
      
      await expect(usuarioService.updateUsuario(mockUsuarioId, updateData))
        .rejects.toThrow(new AppError('El email ya está en uso por otro usuario', 400));
    });

    it('should allow same email for same user', async () => {
      // When updating other fields but keeping same email
      const sameEmailUpdate = { nombre: 'Juan Actualizado' };
      
      (usuarioRepository.findById as jest.Mock).mockResolvedValue(mockUsuario);
      (usuarioRepository.update as jest.Mock).mockResolvedValue({
        ...mockUsuario,
        ...sameEmailUpdate
      });
      
      await usuarioService.updateUsuario(mockUsuarioId, sameEmailUpdate);
      
      expect(usuarioRepository.findByEmail).not.toHaveBeenCalled();
      expect(usuarioRepository.update).toHaveBeenCalledWith(mockUsuarioId, sameEmailUpdate);
    });

    it('should hash password when updating it', async () => {
      const passwordUpdate = { password: 'NewPassword123!' };
      
      (usuarioRepository.findById as jest.Mock).mockResolvedValue(mockUsuario);
      (usuarioRepository.update as jest.Mock).mockResolvedValue(mockUsuario);
      
      await usuarioService.updateUsuario(mockUsuarioId, passwordUpdate);
      
      expect(bcrypt.hash).toHaveBeenCalledWith(passwordUpdate.password, 10);
      expect(usuarioRepository.update).toHaveBeenCalledWith(
        mockUsuarioId,
        expect.objectContaining({ password_hash: 'hashed_password' })
      );
    });
  });

  describe('deleteUsuario', () => {
    it('should delete a user', async () => {
      (usuarioRepository.delete as jest.Mock).mockResolvedValue(true);
      
      const result = await usuarioService.deleteUsuario(mockUsuarioId);
      
      expect(usuarioRepository.delete).toHaveBeenCalledWith(mockUsuarioId);
      expect(result).toBe(true);
    });
  });

  describe('getAllUsuarios', () => {
    it('should get all users with pagination', async () => {
      const mockUsuarios = [
        mockUsuarioOutput,
        { ...mockUsuarioOutput, id: 'another-id', nombre: 'Ana López' }
      ];
      
      (usuarioRepository.findAll as jest.Mock).mockResolvedValue({
        usuarios: mockUsuarios,
        total: 2
      });
      
      const result = await usuarioService.getAllUsuarios(1, 10);
      
      expect(usuarioRepository.findAll).toHaveBeenCalledWith(1, 10, undefined);
      expect(result.usuarios).toEqual(mockUsuarios);
      expect(result.total).toBe(2);
    });

    it('should filter by role when specified', async () => {
      (usuarioRepository.findAll as jest.Mock).mockResolvedValue({
        usuarios: [mockUsuarioOutput],
        total: 1
      });
      
      await usuarioService.getAllUsuarios(1, 10, 'paciente');
      
      expect(usuarioRepository.findAll).toHaveBeenCalledWith(1, 10, 'paciente');
    });
  });

  describe('verificarCredenciales', () => {
    it('should verify valid credentials', async () => {
      (usuarioRepository.findByEmail as jest.Mock).mockResolvedValue(mockUsuario);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      
      const result = await usuarioService.verificarCredenciales('juan@example.com', 'Password123!');
      
      expect(usuarioRepository.findByEmail).toHaveBeenCalledWith('juan@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('Password123!', 'hashed_password');
      expect(result).toEqual(mockUsuario);
    });

    it('should return null for nonexistent user', async () => {
      (usuarioRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      
      const result = await usuarioService.verificarCredenciales('wrong@example.com', 'Password123!');
      
      expect(result).toBeNull();
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should return null for invalid password', async () => {
      (usuarioRepository.findByEmail as jest.Mock).mockResolvedValue(mockUsuario);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      
      const result = await usuarioService.verificarCredenciales('juan@example.com', 'WrongPassword');
      
      expect(result).toBeNull();
    });

    it('should handle verification errors', async () => {
      (usuarioRepository.findByEmail as jest.Mock).mockResolvedValue(mockUsuario);
      (bcrypt.compare as jest.Mock).mockRejectedValue(new Error('Bcrypt error'));
      
      await expect(usuarioService.verificarCredenciales('juan@example.com', 'Password123!'))
        .rejects.toThrow(new AppError('Error al verificar credenciales', 500));
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      (usuarioRepository.findById as jest.Mock).mockResolvedValue(mockUsuario);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (usuarioRepository.update as jest.Mock).mockResolvedValue(mockUsuario);
      
      const result = await usuarioService.changePassword(
        mockUsuarioId, 
        'Password123!', 
        'NewPassword456!'
      );
      
      expect(usuarioRepository.findById).toHaveBeenCalledWith(mockUsuarioId);
      expect(bcrypt.compare).toHaveBeenCalledWith('Password123!', 'hashed_password');
      expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword456!', 10);
      expect(usuarioRepository.update).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should throw error if user not found', async () => {
      (usuarioRepository.findById as jest.Mock).mockResolvedValue(null);
      
      await expect(usuarioService.changePassword(
        'nonexistent-id', 
        'Password123!', 
        'NewPassword456!'
      )).rejects.toThrow(new AppError('Usuario no encontrado', 404));
    });

    it('should throw error if current password is incorrect', async () => {
      (usuarioRepository.findById as jest.Mock).mockResolvedValue(mockUsuario);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      
      await expect(usuarioService.changePassword(
        mockUsuarioId, 
        'WrongPassword', 
        'NewPassword456!'
      )).rejects.toThrow(new AppError('Contraseña actual incorrecta', 400));
    });
  });
});