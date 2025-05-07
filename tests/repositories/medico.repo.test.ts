import medicoRepository from '../../src/repositories/medico.repo';
import { query } from '../../src/config/database';
import { MedicoInput, MedicoUpdateInput } from '../../src/models/medico';

// Mock de la base de datos
jest.mock('../../src/config/database', () => ({
  query: jest.fn()
}));

describe('Medico Repository', () => {
  // Datos de prueba
  const mockMedicoId = '123e4567-e89b-12d3-a456-426614174000';
  const mockUsuarioId = '123e4567-e89b-12d3-a456-426614174001';
  const mockCentroId = '123e4567-e89b-12d3-a456-426614174002';
  
  const mockMedicoInput: MedicoInput = {
    usuario_id: mockUsuarioId,
    especialidad: 'Cardiología',
    centro_id: mockCentroId,
    duracion_cita: 30
  };
  
  const mockMedico = {
    id: mockMedicoId,
    ...mockMedicoInput
  };
  
  const mockMedicoCompleto = {
    ...mockMedico,
    nombre: 'Dr. Juan Pérez',
    email: 'juan@example.com',
    centro_nombre: 'Hospital Central'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('debería crear un médico correctamente', async () => {
      (query as jest.Mock).mockResolvedValue({ rows: [mockMedico] });
      
      const result = await medicoRepository.create(mockMedicoInput);
      
      expect(query).toHaveBeenCalled();
      expect(result).toEqual(mockMedico);
    });
  });

  describe('findById', () => {
    it('debería encontrar un médico por ID', async () => {
      (query as jest.Mock).mockResolvedValue({ rows: [mockMedico] });
      
      const result = await medicoRepository.findById(mockMedicoId);
      
      expect(query).toHaveBeenCalledWith(expect.any(String), [mockMedicoId]);
      expect(result).toEqual(mockMedico);
    });
    
    it('debería devolver null si el médico no existe', async () => {
      (query as jest.Mock).mockResolvedValue({ rows: [] });
      
      const result = await medicoRepository.findById('id-no-existente');
      
      expect(result).toBeNull();
    });
  });

  describe('findByUsuarioId', () => {
    it('debería encontrar un médico por ID de usuario', async () => {
      (query as jest.Mock).mockResolvedValue({ rows: [mockMedico] });
      
      const result = await medicoRepository.findByUsuarioId(mockUsuarioId);
      
      expect(query).toHaveBeenCalledWith(expect.any(String), [mockUsuarioId]);
      expect(result).toEqual(mockMedico);
    });
  });

  describe('findByFilters', () => {
    it('debería devolver todos los médicos con información completa', async () => {
      const mockMedicos = [
        mockMedicoCompleto,
        { ...mockMedicoCompleto, id: '999', nombre: 'Dra. Ana López' }
      ];
      
      // Mock de la consulta principal y luego el conteo
      (query as jest.Mock)
        .mockResolvedValueOnce({ rows: mockMedicos })
        .mockResolvedValueOnce({ rows: [{ count: '2' }] });
      
      const result = await medicoRepository.findByFilters({});
      
      expect(query).toHaveBeenCalled();
      expect(result.medicos).toEqual(mockMedicos);
      expect(result.medicos.length).toBe(2);
      expect(result.total).toBe(2);
    });
  });

  describe('update', () => {
    it('debería actualizar un médico', async () => {
      const updateData: MedicoUpdateInput = { 
        especialidad: 'Neurología',
        duracion_cita: 45
      };
      
      (query as jest.Mock).mockResolvedValue({ rows: [{ ...mockMedico, ...updateData }] });
      
      const result = await medicoRepository.update(mockMedicoId, updateData);
      
      expect(query).toHaveBeenCalled();
      expect(result.especialidad).toBe('Neurología');
      expect(result.duracion_cita).toBe(45);
    });
    
    it('debería manejar cuando no hay campos para actualizar', async () => {
      const emptyUpdate = {} as MedicoUpdateInput;
      
      await expect(medicoRepository.update(mockMedicoId, emptyUpdate))
        .rejects.toThrow('No hay datos para actualizar');
      
      expect(query).not.toHaveBeenCalled();
    });
    
    it('debería manejar cuando el médico no existe', async () => {
      const updateData: MedicoUpdateInput = { especialidad: 'Neurología' };
      (query as jest.Mock).mockResolvedValue({ rows: [] });
      
      await expect(medicoRepository.update('id-inexistente', updateData))
        .rejects.toThrow('Médico no encontrado');
    });
  });

  describe('delete', () => {
    it('debería eliminar un médico', async () => {
      (query as jest.Mock).mockResolvedValue({ rows: [{ id: mockMedicoId }] });
      
      const result = await medicoRepository.delete(mockMedicoId);
      
      expect(query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM medicos'), [mockMedicoId]);
      expect(result).toBe(true);
    });
    
    it('debería manejar cuando el médico no existe', async () => {
      (query as jest.Mock).mockResolvedValue({ rows: [] });
      
      await expect(medicoRepository.delete('id-inexistente'))
        .rejects.toThrow('Error al eliminar el médico');
    });
  });

  describe('findByEspecialidad', () => {
    it('debería encontrar médicos por especialidad', async () => {
      const mockMedicos = [
        mockMedicoCompleto,
        { ...mockMedicoCompleto, id: '999', nombre: 'Dr. Carlos Ruiz' }
      ];
      
      (query as jest.Mock).mockResolvedValue({ rows: mockMedicos });
      
      const result = await medicoRepository.findByEspecialidad('Cardiología');
      
      expect(query).toHaveBeenCalledWith(expect.any(String), ['Cardiología']);
      expect(result).toEqual(mockMedicos);
      expect(result.length).toBe(2);
    });
  });
});