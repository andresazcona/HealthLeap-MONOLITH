import usuarioRepository from '../../src/repositories/usuario.repo';
import { query } from '../../src/config/database';
import bcrypt from 'bcrypt';
import { RolUsuario, UsuarioInput, UsuarioUpdateInput } from '../../src/models/usuario';

// Mocks
jest.mock('../../src/config/database', () => ({
  query: jest.fn()
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
  genSalt: jest.fn().mockResolvedValue('salt')
}));

describe('Usuario Repository', () => {
  // Datos de prueba
  const mockUsuarioId = '123e4567-e89b-12d3-a456-426614174000';
  const mockUsuarioInput = {
    nombre: 'Juan Pérez',
    email: 'juan@example.com',
    password: 'secreto123',
    rol: 'paciente' as RolUsuario
  };
  
  const mockUsuario = {
    id: mockUsuarioId,
    nombre: 'Juan Pérez',
    email: 'juan@example.com',
    password_hash: 'hashed_password',
    rol: 'paciente' as RolUsuario,
    created_at: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('debería crear un usuario correctamente', async () => {
      (query as jest.Mock).mockResolvedValue({ rows: [mockUsuario] });
      
      const result = await usuarioRepository.create({
        ...mockUsuarioInput,
        password_hash: 'hashed_password'
      });
      
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO usuarios'),
        expect.arrayContaining([
          mockUsuarioInput.nombre,
          mockUsuarioInput.email,
          'hashed_password',
          mockUsuarioInput.rol
        ])
      );
      expect(result).toEqual(mockUsuario);
    });

    it('debería manejar errores de violación de unicidad', async () => {
      const error = new Error('Email duplicado');
      (error as any).code = '23505';
      (query as jest.Mock).mockRejectedValue(error);

      await expect(usuarioRepository.create({
        ...mockUsuarioInput,
        password_hash: 'hashed_password'
      })).rejects.toThrow('El correo electrónico ya está registrado');
    });
  });

  describe('findById', () => {
    it('debería encontrar un usuario por ID', async () => {
      (query as jest.Mock).mockResolvedValue({ rows: [mockUsuario] });
      
      const result = await usuarioRepository.findById(mockUsuarioId);
      
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM usuarios WHERE id'),
        [mockUsuarioId]
      );
      expect(result).toEqual(mockUsuario);
    });
    
    it('debería devolver null si el usuario no existe', async () => {
      (query as jest.Mock).mockResolvedValue({ rows: [] });
      
      const result = await usuarioRepository.findById('id-no-existente');
      
      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('debería encontrar un usuario por email', async () => {
      (query as jest.Mock).mockResolvedValue({ rows: [mockUsuario] });
      
      const result = await usuarioRepository.findByEmail(mockUsuario.email);
      
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM usuarios WHERE email'),
        [mockUsuario.email]
      );
      expect(result).toEqual(mockUsuario);
    });

    it('debería devolver null si el email no existe', async () => {
      (query as jest.Mock).mockResolvedValue({ rows: [] });
      
      const result = await usuarioRepository.findByEmail('no-existe@example.com');
      
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('debería actualizar un usuario', async () => {
      const updateData = { nombre: 'Juan Actualizado' };
      
      (query as jest.Mock).mockResolvedValue({ 
        rows: [{ ...mockUsuario, ...updateData }] 
      });
      
      const result = await usuarioRepository.update(mockUsuarioId, updateData);
      
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE usuarios'),
        expect.arrayContaining([updateData.nombre, mockUsuarioId])
      );
      expect(result.nombre).toBe('Juan Actualizado');
    });
    
    it('debería hashear la contraseña al actualizar', async () => {
      const updateData = { password: 'nuevaContraseña' } as UsuarioUpdateInput;
      
      (query as jest.Mock).mockResolvedValue({ 
        rows: [{ 
          ...mockUsuario, 
          password_hash: 'hashed_password' 
        }] 
      });
      
      await usuarioRepository.update(mockUsuarioId, updateData);
      
      expect(bcrypt.hash).toHaveBeenCalledWith('nuevaContraseña', 10);
    });

    it('debería manejar cuando no hay campos para actualizar', async () => {
      const emptyUpdate = {};
      
      await expect(usuarioRepository.update(mockUsuarioId, emptyUpdate))
        .rejects.toThrow('No hay datos para actualizar');
      
      expect(query).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('debería eliminar un usuario', async () => {
      (query as jest.Mock).mockResolvedValue({ 
        rows: [{ id: mockUsuarioId }] 
      });
      
      const result = await usuarioRepository.delete(mockUsuarioId);
      
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM usuarios'),
        [mockUsuarioId]
      );
      expect(result).toBe(true);
    });

    it('debería lanzar error si el usuario no existe', async () => {
      (query as jest.Mock).mockResolvedValue({ rows: [] });
      
      await expect(usuarioRepository.delete('id-no-existente'))
        .rejects.toThrow('Usuario no encontrado');
    });
  });

  describe('findAll', () => {
    it('debería obtener usuarios con paginación', async () => {
      const mockUsers = [
        { ...mockUsuario, id: '1' },
        { ...mockUsuario, id: '2', nombre: 'Ana López' }
      ];
      
      (query as jest.Mock)
        .mockResolvedValueOnce({ rows: mockUsers })
        .mockResolvedValueOnce({ rows: [{ count: '2' }] });
      
      const result = await usuarioRepository.findAll(1, 10);
      
      expect(query).toHaveBeenCalledTimes(2);
      expect(result.usuarios).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('debería filtrar por rol', async () => {
      const mockUsers = [mockUsuario];
      
      (query as jest.Mock)
        .mockResolvedValueOnce({ rows: mockUsers })
        .mockResolvedValueOnce({ rows: [{ count: '1' }] });
      
      await usuarioRepository.findAll(1, 10, 'paciente');
      
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE rol = $1'),
        expect.arrayContaining(['paciente'])
      );
    });
  });
});