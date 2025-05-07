import reporteRepository from '../../src/repositories/reporte.repo';
import { query } from '../../src/config/database';
import { EstadoCita } from '../../src/models/cita';
import { FiltroReporte } from '../../src/models/reporte';

// Mock del módulo de base de datos
jest.mock('../../src/config/database', () => ({
  query: jest.fn()
}));

describe('Reporte Repository', () => {
  // Datos de prueba
  const mockFiltros: FiltroReporte = {
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
      paciente_nombre: 'Juan Pérez',
      paciente_email: 'juan@example.com',
      medico_nombre: 'Dra. María Rodríguez',
      especialidad: 'Cardiología',
      created_at: new Date('2025-01-01T08:00:00Z')
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174002',
      fecha_hora: new Date('2025-01-10T15:30:00Z'),
      estado: 'atendida',
      paciente_nombre: 'Ana López',
      paciente_email: 'ana@example.com',
      medico_nombre: 'Dra. María Rodríguez',
      especialidad: 'Cardiología',
      created_at: new Date('2025-01-02T10:00:00Z')
    }
  ];

  const mockResumen = {
    total: 50,
    agendadas: 10,
    atendidas: 30,
    canceladas: 5,
    enEspera: 5,
    porEspecialidad: {
      'Cardiología': 25,
      'Neurología': 15,
      'Pediatría': 10
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generarReporteCitas', () => {
    it('debería generar un reporte de citas con filtros', async () => {
      (query as jest.Mock).mockResolvedValue({ rows: mockCitasData });
      
      const result = await reporteRepository.generarReporteCitas(mockFiltros);
      
      expect(query).toHaveBeenCalled();
      expect(result).toEqual(mockCitasData);
      expect(result.length).toBe(2);
    });
    
    it('debería manejar filtros parciales', async () => {
      const filtrosParciales: Partial<FiltroReporte> = {
        desde: new Date('2025-01-01'),
        hasta: new Date('2025-01-31')
      };
      
      (query as jest.Mock).mockResolvedValue({ rows: mockCitasData });
      
      await reporteRepository.generarReporteCitas(filtrosParciales as FiltroReporte);
      
      // Verificar que la consulta no contenga parámetros para estado y medico_id
      expect(query).toHaveBeenCalledWith(
        expect.not.stringContaining('AND c.estado = '),
        expect.any(Array)
      );
    });

    it('debería filtrar citas por ID de médico', async () => {
      const medicoId = '123e4567-e89b-12d3-a456-426614174000';
      const filtro: FiltroReporte = {
        medico_id: medicoId,
        desde: new Date('2025-01-01'),
        hasta: new Date('2025-01-31')
      };
      
      (query as jest.Mock).mockResolvedValue({ rows: mockCitasData });
      
      const result = await reporteRepository.generarReporteCitas(filtro);
      
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE'),
        expect.arrayContaining([medicoId])
      );
      expect(result).toEqual(mockCitasData);
    });
  });

  describe('generarResumen', () => {
    it('debería generar estadísticas para un rango de fechas', async () => {
      // Configurar los mocks para los resultados de las consultas
      (query as jest.Mock)
        .mockResolvedValueOnce({ 
          rows: [{
            total: '50',
            agendadas: '10',
            en_espera: '5',
            atendidas: '30',
            canceladas: '5'
          }]
        }) // Total de citas
        .mockResolvedValueOnce({ 
          rows: [
            { especialidad: 'Cardiología', total: '25' },
            { especialidad: 'Neurología', total: '15' },
            { especialidad: 'Pediatría', total: '10' }
          ]
        }); // Citas por especialidad
      
      const result = await reporteRepository.generarResumen({
        desde: new Date('2025-01-01'),
        hasta: new Date('2025-01-31')
      });
      
      expect(query).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockResumen);
      expect(Object.keys(result.porEspecialidad).length).toBe(3);
    });
  });
});