import admisionService from '../../src/services/admision.service';
import admisionRepository from '../../src/repositories/admision.repo';
import usuarioRepository from '../../src/repositories/usuario.repo';
import usuarioService from '../../src/services/usuario.service';
import { AdmisionInput, AdmisionUpdateInput } from '../../src/models/admision';
import { UsuarioInput } from '../../src/models/usuario';
import AppError from '../../src/utils/AppError';

// Mock dependencies
jest.mock('../../src/repositories/admision.repo');
jest.mock('../../src/repositories/usuario.repo');
jest.mock('../../src/services/usuario.service');
jest.mock('../../src/utils/logger');

describe('AdmisionService', () => {
  // Test data
  const mockUsuarioId = '123e4567-e89b-12d3-a456-426614174001';
  const mockAdmisionId = '123e4567-e89b-12d3-a456-426614174002';
  
  const mockUsuario = {
    id: mockUsuarioId,
    nombre: 'Ana García',
    email: 'ana@example.com',
    rol: 'admisión'
  };
  
  const mockUsuarioInput: UsuarioInput = {
    nombre: 'Ana García',
    email: 'ana@example.com',
    password: 'Password123!',
    rol: 'admisión'
  };
  
  const mockAdmisionInput: AdmisionInput = {
    usuario_id: mockUsuarioId,
    area: 'Recepción General'
  };
  
  const mockAdmision = {
    id: mockAdmisionId,
    usuario_id: mockUsuarioId,
    area: 'Recepción General',
    created_at: new Date()
  };
  
  const mockAdmisionCompleto = {
    ...mockAdmision,
    nombre: 'Ana García',
    email: 'ana@example.com'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAdmisionCompleto', () => {
    it('should create a new admission staff with user', async () => {
      // Setup mocks
      (usuarioService.createUsuario as jest.Mock).mockResolvedValue(mockUsuario);
      (admisionRepository.create as jest.Mock).mockResolvedValue(mockAdmision);
      
      const admisionData = {
        usuario: mockUsuarioInput,
        area: 'Recepción General'
      };
      
      const result = await admisionService.createAdmisionCompleto(admisionData as any);
      
      // Assertions
      expect(usuarioService.createUsuario).toHaveBeenCalledWith(
        expect.objectContaining({ rol: 'admisión' })
      );
      expect(admisionRepository.create).toHaveBeenCalledWith({
        usuario_id: mockUsuarioId,
        area: 'Recepción General'
      });
      expect(result).toEqual(mockAdmisionCompleto);
    });
  });

  describe('createAdmision', () => {
    it('should create admission staff for existing user', async () => {
      // Setup mocks
      (usuarioRepository.findById as jest.Mock).mockResolvedValue(mockUsuario);
      (admisionRepository.findByUsuarioId as jest.Mock).mockResolvedValue(null);
      (usuarioService.updateUsuario as jest.Mock).mockResolvedValue(mockUsuario);
      (admisionRepository.create as jest.Mock).mockResolvedValue(mockAdmision);
      
      const result = await admisionService.createAdmision(mockAdmisionInput);
      
      // Assertions
      expect(usuarioRepository.findById).toHaveBeenCalledWith(mockUsuarioId);
      expect(admisionRepository.findByUsuarioId).toHaveBeenCalledWith(mockUsuarioId);
      expect(admisionRepository.create).toHaveBeenCalledWith(mockAdmisionInput);
      expect(result).toEqual(mockAdmision);
    });

    it('should throw error if user is not found', async () => {
      // Mock user not found
      (usuarioRepository.findById as jest.Mock).mockResolvedValue(null);
      
      await expect(admisionService.createAdmision(mockAdmisionInput))
        .rejects.toThrow(new AppError('Usuario no encontrado', 404));
    });

    it('should throw error if user is already admission staff', async () => {
      // Mock user found but already admision
      (usuarioRepository.findById as jest.Mock).mockResolvedValue(mockUsuario);
      (admisionRepository.findByUsuarioId as jest.Mock).mockResolvedValue(mockAdmision);
      
      await expect(admisionService.createAdmision(mockAdmisionInput))
        .rejects.toThrow(new AppError('El usuario ya está registrado como personal de admisión', 400));
    });

    it('should update user role if needed', async () => {
      // Mock user with different role
      const userWithDiffRole = { ...mockUsuario, rol: 'otro' };
      
      (usuarioRepository.findById as jest.Mock).mockResolvedValue(userWithDiffRole);
      (admisionRepository.findByUsuarioId as jest.Mock).mockResolvedValue(null);
      (usuarioService.updateUsuario as jest.Mock).mockResolvedValue({ ...userWithDiffRole, rol: 'admisión' });
      (admisionRepository.create as jest.Mock).mockResolvedValue(mockAdmision);
      
      await admisionService.createAdmision(mockAdmisionInput);
      
      expect(usuarioService.updateUsuario).toHaveBeenCalledWith(
        mockUsuarioId, 
        expect.objectContaining({ rol: 'admisión' })
      );
    });
  });

  describe('getAdmisionById', () => {
    it('should return admission staff by ID', async () => {
      (admisionRepository.findCompletoById as jest.Mock).mockResolvedValue(mockAdmisionCompleto);
      
      const result = await admisionService.getAdmisionById(mockAdmisionId);
      
      expect(admisionRepository.findCompletoById).toHaveBeenCalledWith(mockAdmisionId);
      expect(result).toEqual(mockAdmisionCompleto);
    });

    it('should throw error if admission staff not found', async () => {
      (admisionRepository.findCompletoById as jest.Mock).mockResolvedValue(null);
      
      await expect(admisionService.getAdmisionById('nonexistent-id'))
        .rejects.toThrow(new AppError('Personal de admisión no encontrado', 404));
    });
  });

  describe('updateAdmision', () => {
    const updateData: AdmisionUpdateInput = {
      area: 'Urgencias'
    };

    it('should update admission staff', async () => {
      (admisionRepository.findById as jest.Mock).mockResolvedValue(mockAdmision);
      (admisionRepository.update as jest.Mock).mockResolvedValue({
        ...mockAdmision,
        area: updateData.area
      });
      
      const result = await admisionService.updateAdmision(mockAdmisionId, updateData);
      
      expect(admisionRepository.findById).toHaveBeenCalledWith(mockAdmisionId);
      expect(admisionRepository.update).toHaveBeenCalledWith(mockAdmisionId, updateData);
      expect(result.area).toBe(updateData.area);
    });

    it('should throw error if admission staff not found', async () => {
      (admisionRepository.findById as jest.Mock).mockResolvedValue(null);
      
      await expect(admisionService.updateAdmision('nonexistent-id', updateData))
        .rejects.toThrow(new AppError('Personal de admisión no encontrado', 404));
    });
  });

  describe('deleteAdmision', () => {
    it('should delete admission staff', async () => {
      (admisionRepository.delete as jest.Mock).mockResolvedValue(true);
      
      const result = await admisionService.deleteAdmision(mockAdmisionId);
      
      expect(admisionRepository.delete).toHaveBeenCalledWith(mockAdmisionId);
      expect(result).toBe(true);
    });
  });

  describe('getAllAdmisiones', () => {
    it('should get all admission staff with pagination', async () => {
      const mockAdmisiones = [
        mockAdmisionCompleto,
        { ...mockAdmisionCompleto, id: 'another-id', nombre: 'Carlos López' }
      ];
      
      (admisionRepository.findAll as jest.Mock).mockResolvedValue({
        admisiones: mockAdmisiones,
        total: 2
      });
      
      const result = await admisionService.getAllAdmisiones(1, 10);
      
      expect(admisionRepository.findAll).toHaveBeenCalledWith(1, 10);
      expect(result.admisiones.length).toBe(2);
      expect(result.total).toBe(2);
    });
  });
});