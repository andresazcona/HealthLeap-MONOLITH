import admisionRepository from '../../src/repositories/admision.repo';
import { query } from '../../src/config/database';
import { AdmisionInput, AdmisionUpdateInput } from '../../src/models/admision';

// Mock del módulo de base de datos
jest.mock('../../src/config/database', () => ({
  query: jest.fn()
}));

describe('Admision Repository', () => {
  // Datos de prueba
  const mockAdmisionId = '123e4567-e89b-12d3-a456-426614174000';
  const mockUsuarioId = '123e4567-e89b-12d3-a456-426614174001';
  
  const mockAdmisionInput: AdmisionInput = {
    usuario_id: mockUsuarioId,
    area: 'Recepción General'
  };
  
  const mockAdmision = {
    id: mockAdmisionId,
    ...mockAdmisionInput,
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

  describe('create', () => {
    it('debería crear un registro de admisión', async () => {
      (query as jest.Mock).mockResolvedValue({ rows: [mockAdmision] });
      
      const result = await admisionRepository.create(mockAdmisionInput);
      
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO admisiones'),
        expect.arrayContaining([
          mockAdmisionInput.usuario_id,
          mockAdmisionInput.area
        ])
      );
      expect(result).toEqual(mockAdmision);
    });

    it('debería manejar errores al crear', async () => {
      const dbError = new Error('Error de base de datos');
      (query as jest.Mock).mockRejectedValue(dbError);
      
      await expect(admisionRepository.create(mockAdmisionInput))
        .rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('debería encontrar un registro de admisión por ID', async () => {
      (query as jest.Mock).mockResolvedValue({ rows: [mockAdmision] });
      
      const result = await admisionRepository.findById(mockAdmisionId);
      
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM admisiones WHERE id'),
        [mockAdmisionId]
      );
      expect(result).toEqual(mockAdmision);
    });
    
    it('debería devolver null si no existe', async () => {
      (query as jest.Mock).mockResolvedValue({ rows: [] });
      
      const result = await admisionRepository.findById('id-no-existente');
      
      expect(result).toBeNull();
    });
  });

  describe('findByUsuarioId', () => {
    it('debería encontrar admisión por ID de usuario', async () => {
      (query as jest.Mock).mockResolvedValue({ rows: [mockAdmision] });
      
      const result = await admisionRepository.findByUsuarioId(mockUsuarioId);
      
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM admisiones WHERE usuario_id'),
        [mockUsuarioId]
      );
      expect(result).toEqual(mockAdmision);
    });

    it('debería devolver null cuando no hay coincidencias', async () => {
      (query as jest.Mock).mockResolvedValue({ rows: [] });
      
      const result = await admisionRepository.findByUsuarioId('usuario-inexistente');
      
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('debería devolver todos los registros de admisión con información completa', async () => {
      const mockAdmisiones = [
        mockAdmisionCompleto,
        { ...mockAdmisionCompleto, id: '999', nombre: 'Carlos López', area: 'Urgencias' }
      ];
      
      // Mock de la consulta principal y luego el conteo
      (query as jest.Mock)
        .mockResolvedValueOnce({ rows: mockAdmisiones })
        .mockResolvedValueOnce({ rows: [{ count: '2' }] });
      
      const result = await admisionRepository.findAll();
      
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT a.*, u.nombre, u.email'),
        expect.any(Array)
      );
      expect(result.admisiones).toEqual(mockAdmisiones);
      expect(result.admisiones.length).toBe(2);
      expect(result.total).toBe(2);
    });

    it('debería manejar cuando no hay registros', async () => {
      // Mock de la consulta principal y luego el conteo
      (query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] });
      
      const result = await admisionRepository.findAll();
      
      expect(result.admisiones).toEqual([]);
      expect(result.admisiones.length).toBe(0);
      expect(result.total).toBe(0);
    });
  });

  describe('update', () => {
    it('debería actualizar un registro de admisión', async () => {
      const updateData: AdmisionUpdateInput = { area: 'Urgencias' };
      
      (query as jest.Mock).mockResolvedValue({ rows: [{ ...mockAdmision, ...updateData }] });
      
      const result = await admisionRepository.update(mockAdmisionId, updateData);
      
      expect(query).toHaveBeenCalledWith(
        expect.stringMatching(/UPDATE admisiones\s+SET area/),
        expect.arrayContaining(['Urgencias', mockAdmisionId])
      );
      expect(result.area).toBe('Urgencias');
    });

    it('debería manejar cuando no hay campos para actualizar', async () => {
      const emptyUpdate = {} as AdmisionUpdateInput;
      
      await expect(admisionRepository.update(mockAdmisionId, emptyUpdate))
        .rejects.toThrow('No hay datos para actualizar');
      
      expect(query).not.toHaveBeenCalled();
    });

    it('debería manejar cuando el registro no existe', async () => {
      const updateData: AdmisionUpdateInput = { area: 'Urgencias' };
      (query as jest.Mock).mockResolvedValue({ rows: [] });
      
      await expect(admisionRepository.update('id-inexistente', updateData))
        .rejects.toThrow('Personal de admisión no encontrado');
    });
  });

  describe('delete', () => {
    it('debería eliminar un registro de admisión', async () => {
      (query as jest.Mock).mockResolvedValue({ rows: [{ id: mockAdmisionId }] });
      
      const result = await admisionRepository.delete(mockAdmisionId);
      
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM admisiones WHERE id'),
        [mockAdmisionId]
      );
      expect(result).toBe(true);
    });

    it('debería manejar cuando el registro no existe', async () => {
      (query as jest.Mock).mockResolvedValue({ rows: [] });
      
      await expect(admisionRepository.delete('id-no-existente'))
        .rejects.toThrow('Personal de admisión no encontrado');
    });
  });
});