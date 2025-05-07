import citaRepository from '../../src/repositories/cita.repo';
import { query } from '../../src/config/database';
import { CitaFiltro, CitaUpdateInput, EstadoCita } from '../../src/models/cita';
import { startOfDay, endOfDay } from '../../src/utils/date-utils';

// Mock del módulo de base de datos
jest.mock('../../src/config/database', () => ({
  query: jest.fn()
}));

describe('Cita Repository', () => {
  // Datos de prueba
  const mockCitaId = '123e4567-e89b-12d3-a456-426614174000';
  const mockCitaInput = {
    paciente_id: '123e4567-e89b-12d3-a456-426614174001',
    medico_id: '123e4567-e89b-12d3-a456-426614174002',
    fecha_hora: new Date('2025-06-01T14:30:00Z')
  };
  
  const mockCita = {
    id: mockCitaId,
    ...mockCitaInput,
    estado: 'agendada' as EstadoCita,
    created_at: new Date()
  };
  
  const mockCitaCompleta = {
    ...mockCita,
    nombre_paciente: 'Juan Pérez',
    email_paciente: 'paciente@ejemplo.com',
    nombre_medico: 'Dra. María Rodríguez',
    especialidad: 'Cardiología',
    duracion_cita: 30
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('debería crear una cita exitosamente', async () => {
      // Mock para verificarDisponibilidad
      jest.spyOn(citaRepository, 'verificarDisponibilidad').mockResolvedValue(true);
      
      // Mock para query
      (query as jest.Mock).mockResolvedValue({ rows: [mockCita] });
      
      const result = await citaRepository.create(mockCitaInput);
      
      expect(citaRepository.verificarDisponibilidad).toHaveBeenCalledWith(mockCitaInput.medico_id, mockCitaInput.fecha_hora);
      expect(query).toHaveBeenCalled();
      expect(result).toEqual(mockCita);
    });
    
    it('debería lanzar error si el médico no está disponible', async () => {
      jest.spyOn(citaRepository, 'verificarDisponibilidad').mockResolvedValue(false);
      
      await expect(citaRepository.create(mockCitaInput))
        .rejects.toThrow('El médico no está disponible en ese horario');
    });
  });

  describe('findById', () => {
    it('debería encontrar una cita por ID', async () => {
      (query as jest.Mock).mockResolvedValue({ rows: [mockCita] });
      
      const result = await citaRepository.findById(mockCitaId);
      
      expect(query).toHaveBeenCalledWith(expect.any(String), [mockCitaId]);
      expect(result).toEqual(mockCita);
    });
    
    it('debería devolver null si la cita no existe', async () => {
      (query as jest.Mock).mockResolvedValue({ rows: [] });
      
      const result = await citaRepository.findById('id-no-existente');
      
      expect(result).toBeNull();
    });
  });

  describe('findCompletaById', () => {
    it('debería encontrar información completa de una cita', async () => {
      (query as jest.Mock).mockResolvedValue({ rows: [mockCitaCompleta] });
      
      const result = await citaRepository.findCompletaById(mockCitaId);
      
      expect(query).toHaveBeenCalledWith(expect.any(String), [mockCitaId]);
      expect(result).toEqual(mockCitaCompleta);
      expect(result?.email_paciente).toBe('paciente@ejemplo.com');
    });
    
    it('debería devolver null si la cita completa no existe', async () => {
      (query as jest.Mock).mockResolvedValue({ rows: [] });
      
      const result = await citaRepository.findCompletaById('id-no-existente');
      
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('debería actualizar una cita', async () => {
      const updateData: CitaUpdateInput = { estado: 'en espera' as EstadoCita };
      
      // Mock para verificarDisponibilidad si es necesario
      jest.spyOn(citaRepository, 'findById').mockResolvedValue(mockCita);
      
      // Mock para query
      (query as jest.Mock).mockResolvedValue({ 
        rows: [{ ...mockCita, estado: 'en espera' as EstadoCita }] 
      });
      
      const result = await citaRepository.update(mockCitaId, updateData);
      
      expect(query).toHaveBeenCalled();
      expect(result.estado).toBe('en espera');
    });
    
    it('debería verificar disponibilidad al cambiar fecha', async () => {
      const nuevaFecha = new Date('2025-06-10T10:00:00Z');
      const updateData: CitaUpdateInput = { fecha_hora: nuevaFecha };
      
      jest.spyOn(citaRepository, 'findById').mockResolvedValue(mockCita);
      jest.spyOn(citaRepository, 'verificarDisponibilidad').mockResolvedValue(true);
      
      (query as jest.Mock).mockResolvedValue({ 
        rows: [{ ...mockCita, fecha_hora: nuevaFecha }] 
      });
      
      await citaRepository.update(mockCitaId, updateData);
      
      expect(citaRepository.verificarDisponibilidad).toHaveBeenCalledWith(
        mockCita.medico_id, 
        nuevaFecha,
        mockCitaId
      );
    });
    
    it('debería rechazar cuando no hay campos para actualizar', async () => {
      const updateData = {} as CitaUpdateInput;
      
      await expect(citaRepository.update(mockCitaId, updateData))
        .rejects.toThrow('No hay datos para actualizar');
        
      expect(query).not.toHaveBeenCalled();
    });
  });

  describe('updateEstado', () => {
    it('debería actualizar el estado de una cita', async () => {
      (query as jest.Mock).mockResolvedValue({ 
        rows: [{ ...mockCita, estado: 'cancelada' as EstadoCita }] 
      });
      
      const result = await citaRepository.updateEstado(mockCitaId, 'cancelada' as EstadoCita);
      
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE citas SET estado'),
        ['cancelada', mockCitaId]
      );
      expect(result.estado).toBe('cancelada');
    });
    
    it('debería manejar citas no encontradas', async () => {
      (query as jest.Mock).mockResolvedValue({ rows: [] });
      
      await expect(citaRepository.updateEstado(mockCitaId, 'cancelada' as EstadoCita))
        .rejects.toThrow('Cita no encontrada');
    });
  });

  describe('delete', () => {
    it('debería eliminar una cita', async () => {
      (query as jest.Mock).mockResolvedValue({ rows: [{ id: mockCitaId }] });
      
      const result = await citaRepository.delete(mockCitaId);
      
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM citas'),
        [mockCitaId]
      );
      expect(result).toBe(true);
    });
    
    it('debería manejar cuando la cita a eliminar no existe', async () => {
      (query as jest.Mock).mockResolvedValue({ rows: [] });
      
      await expect(citaRepository.delete('id-inexistente'))
        .rejects.toThrow('Cita no encontrada');
    });
  });

  describe('findByFilters', () => {
    it('debería filtrar citas por varios criterios', async () => {
      const filtros: CitaFiltro = {
        fecha_inicio: new Date('2025-06-01'),
        fecha_fin: new Date('2025-06-30'),
        medico_id: '123e4567-e89b-12d3-a456-426614174002',
        estado: 'agendada' as EstadoCita
      };
      
      const mockCitas = [mockCitaCompleta, { ...mockCitaCompleta, id: '999' }];
      
      (query as jest.Mock)
        .mockResolvedValueOnce({ rows: mockCitas })  // Para la consulta principal
        .mockResolvedValueOnce({ rows: [{ count: '2' }] });  // Para el conteo
      
      const result = await citaRepository.findByFilters(filtros);
      
      expect(query).toHaveBeenCalled();
      expect(result.citas.length).toBe(2);
      expect(result.total).toBe(2);
    });
    
    it('debería manejar filtros parciales', async () => {
      const filtrosParciales: CitaFiltro = {
        fecha_inicio: new Date('2025-06-01')
      };
      
      const mockCitas = [mockCitaCompleta];
      
      (query as jest.Mock)
        .mockResolvedValueOnce({ rows: mockCitas })
        .mockResolvedValueOnce({ rows: [{ count: '1' }] });
      
      const result = await citaRepository.findByFilters(filtrosParciales);
      
      expect(query).toHaveBeenCalled();
      expect(result.total).toBe(1);
    });
  });
  
  describe('findByPacienteId', () => {
    it('debería encontrar citas de un paciente', async () => {
      const pacienteId = mockCitaInput.paciente_id;
      const mockCitas = [mockCitaCompleta];
      
      (query as jest.Mock)
        .mockResolvedValueOnce({ rows: mockCitas })
        .mockResolvedValueOnce({ rows: [{ count: '1' }] });
      
      const result = await citaRepository.findByPacienteId(pacienteId);
      
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE c.paciente_id ='),
        expect.arrayContaining([pacienteId])
      );
      expect(result.citas).toEqual(mockCitas);
    });
  });
  
  describe('findByMedicoId', () => {
    it('debería encontrar citas de un médico', async () => {
      const medicoId = mockCitaInput.medico_id;
      const mockCitas = [mockCitaCompleta];
      
      (query as jest.Mock)
        .mockResolvedValueOnce({ rows: mockCitas })
        .mockResolvedValueOnce({ rows: [{ count: '1' }] });
      
      const result = await citaRepository.findByMedicoId(medicoId);
      
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE c.medico_id ='),
        expect.arrayContaining([medicoId])
      );
      expect(result.citas).toEqual(mockCitas);
    });
    
    it('debería filtrar por fecha si se proporciona', async () => {
      const medicoId = mockCitaInput.medico_id;
      const fecha = new Date('2025-06-01');
      
      (query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] });
      
      await citaRepository.findByMedicoId(medicoId, fecha);
      
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('BETWEEN'),
        expect.arrayContaining([medicoId, startOfDay(fecha), endOfDay(fecha)])
      );
    });
  });
  
  describe('findByFecha', () => {
    it('debería encontrar citas para una fecha específica', async () => {
      const fecha = new Date('2025-06-01');
      const mockCitas = [mockCitaCompleta];
      
      (query as jest.Mock).mockResolvedValue({ rows: mockCitas });
      
      const result = await citaRepository.findByFecha(fecha);
      
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('BETWEEN'),
        [startOfDay(fecha), endOfDay(fecha)]
      );
      expect(result).toEqual(mockCitas);
    });
  });
  
  describe('verificarDisponibilidad', () => {
    it('debería verificar disponibilidad del médico', async () => {
      const medicoId = mockCitaInput.medico_id;
      const fechaHora = new Date('2025-06-01T14:30:00Z');
      
      // Mock para obtener duración de cita del médico
      (query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ duracion_cita: 30 }] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] });
      
      const result = await citaRepository.verificarDisponibilidad(medicoId, fechaHora);
      
      expect(query).toHaveBeenCalledTimes(2);
      expect(result).toBe(true);
    });
    
    it('debería manejar cuando el médico no existe', async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      
      const result = await citaRepository.verificarDisponibilidad('medico-inexistente', new Date());
      expect(result).toBe(true); // O ajusta según el comportamiento esperado
    });
  });
});