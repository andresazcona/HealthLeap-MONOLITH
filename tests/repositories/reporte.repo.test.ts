import reporteRepository from '../../src/repositories/reporte.repo';
import { query } from '../../src/config/database';
import { EstadoCita } from '../../src/models/cita';
import { FiltrosReporte } from '../../src/models/reporte';

// Mock del módulo de base de datos
jest.mock('../../src/config/database', () => ({
  query: jest.fn()
}));

describe('Reporte Repository', () => {
  // Datos de prueba
  const mockFiltros: FiltrosReporte = {
    desde: new Date('2025-01-01'),
    hasta: new Date('2025-01-31'),
    estado: 'atendida' as EstadoCita,
    medico_id: '123e4567-e89b-12d3-a456-426614174000'
  };
  
  const mockCitasData = [
    {
      id: '123e4567-e89b-12d3-a456-426614174001',
      fecha_hora: new Date('2025-01-05T10:00:00Z'),
      estado: 'atendida',
      nombre_paciente: 'Juan Pérez',
      nombre_medico: 'Dra. María Rodríguez',
      especialidad: 'Cardiología'
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174002',
      fecha_hora: new Date('2025-01-10T15:30:00Z'),
      estado: 'atendida',
      nombre_paciente: 'Ana López',
      nombre_medico: 'Dra. María Rodríguez',
      especialidad: 'Cardiología'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCitasByFiltros', () => {
    it('debería devolver citas por filtros aplicados', async () => {
      (query as jest.Mock).mockResolvedValue({ rows: mockCitasData });
      
      const result = await reporteRepository.getCitasByFiltros(mockFiltros);
      
      expect(query).toHaveBeenCalled();
      expect(result).toEqual(mockCitasData);
      expect(result.length).toBe(2);
    });
    
    it('debería manejar filtros parciales', async () => {
      const filtrosParciales: Partial<FiltrosReporte> = {
        desde: new Date('2025-01-01'),
        hasta: new Date('2025-01-31')
      };
      
      (query as jest.Mock).mockResolvedValue({ rows: mockCitasData });
      
      await reporteRepository.getCitasByFiltros(filtrosParciales);
      
      // Verificar que la consulta no contenga parámetros para estado y medico_id
      expect(query).toHaveBeenCalledWith(
        expect.not.stringContaining('AND c.estado = '),
        expect.any(Array)
      );
    });
  });

  describe('getEstadisticasPeriodo', () => {
    it('debería devolver estadísticas para un rango de fechas', async () => {
      // Cada parte de las estadísticas requiere una consulta separada
      (query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ total_citas: 50 }] }) // Total de citas
        .mockResolvedValueOnce({ rows: [
          { estado: 'agendada', count: 10 },
          { estado: 'en espera', count: 5 },
          { estado: 'atendida', count: 30 },
          { estado: 'cancelada', count: 5 }
        ]}) // Citas por estado
        .mockResolvedValueOnce({ rows: [
          { nombre_medico: 'Dra. María Rodríguez', total_citas: 25 },
          { nombre_medico: 'Dr. Carlos Gómez', total_citas: 15 },
          { nombre_medico: 'Dr. Juan Pérez', total_citas: 10 }
        ]}); // Citas por médico
      
      const result = await reporteRepository.getEstadisticasPeriodo({
        desde: new Date('2025-01-01'),
        hasta: new Date('2025-01-31')
      });
      
      expect(query).toHaveBeenCalledTimes(3);
      expect(result).toMatchObject({
        total_citas: 50,
        citas_por_estado: expect.any(Object),
        citas_por_medico: expect.any(Array)
      });
      expect(Object.keys(result.citas_por_estado).length).toBe(4);
      expect(result.citas_por_medico.length).toBe(3);
    });
  });

  describe('getCitasByPaciente', () => {
    it('debería devolver citas de un paciente con filtros', async () => {
      const pacienteId = '123e4567-e89b-12d3-a456-426614174003';
      
      (query as jest.Mock).mockResolvedValue({ rows: mockCitasData });
      
      const result = await reporteRepository.getCitasByPaciente(pacienteId, {
        estado: 'atendida' as EstadoCita,
        desde: new Date('2025-01-01'),
        hasta: new Date('2025-01-31')
      });
      
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('c.paciente_id = $1'),
        expect.arrayContaining([pacienteId])
      );
      expect(result).toEqual(mockCitasData);
    });
  });

  describe('getCitasByMedico', () => {
    it('debería devolver citas de un médico con filtros', async () => {
      const medicoId = '123e4567-e89b-12d3-a456-426614174000';
      
      (query as jest.Mock).mockResolvedValue({ rows: mockCitasData });
      
      const result = await reporteRepository.getCitasByMedico(medicoId, {
        estado: 'atendida' as EstadoCita,
        desde: new Date('2025-01-01'),
        hasta: new Date('2025-01-31')
      });
      
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('c.medico_id = $1'),
        expect.arrayContaining([medicoId])
      );
      expect(result).toEqual(mockCitasData);
    });
  });
});