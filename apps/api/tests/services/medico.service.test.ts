import reporteService from '../../src/services/reporte.service';
import reporteRepository from '../../src/repositories/reporte.repo';
import { FiltroReporte } from '../../src/models/reporte';
import { generateCsv } from '../../src/utils/csv-generator';
import AppError from '../../src/utils/AppError';

// Mock dependencies
jest.mock('../../src/repositories/reporte.repo');
jest.mock('../../src/utils/csv-generator');
jest.mock('../../src/utils/logger');
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn()
}));

describe('ReporteService', () => {
  // Test data
  const mockFiltro: FiltroReporte = {
    desde: new Date('2025-01-01'),
    hasta: new Date('2025-01-31'),
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
    it('should generate an appointment report with filters', async () => {
      (reporteRepository.generarReporteCitas as jest.Mock).mockResolvedValue(mockCitasData);
      
      const result = await reporteService.generarReporteCitas(mockFiltro);
      
      expect(reporteRepository.generarReporteCitas).toHaveBeenCalledWith(mockFiltro);
      expect(result).toEqual(mockCitasData);
      expect(result.length).toBe(2);
    });

    it('should handle repository errors', async () => {
      (reporteRepository.generarReporteCitas as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );
      
      await expect(reporteService.generarReporteCitas(mockFiltro))
        .rejects.toThrow(new AppError('Error al generar reporte de citas', 500));
    });
  });

  describe('generarReporteMisCitas', () => {
    it('should generate a report for a specific doctor', async () => {
      const medicoId = '123e4567-e89b-12d3-a456-426614174000';
      
      (reporteRepository.generarReporteCitas as jest.Mock).mockResolvedValue(mockCitasData);
      
      const result = await reporteService.generarReporteMisCitas(medicoId, mockFiltro);
      
      expect(reporteRepository.generarReporteCitas).toHaveBeenCalledWith(
        expect.objectContaining({ medico_id: medicoId })
      );
      expect(result).toEqual(mockCitasData);
    });
  });

  describe('generarReporteCSV', () => {
    it('should generate a CSV file with appointment data', async () => {
      const csvPath = '/temp/report.csv';
      
      (reporteRepository.generarReporteCitas as jest.Mock).mockResolvedValue(mockCitasData);
      (generateCsv as jest.Mock).mockResolvedValue(csvPath);
      
      const result = await reporteService.generarReporteCSV(mockFiltro);
      
      expect(reporteRepository.generarReporteCitas).toHaveBeenCalledWith(mockFiltro);
      expect(generateCsv).toHaveBeenCalled();
      expect(result).toBe(csvPath);
    });

    it('should throw error if there is no data to generate report', async () => {
      (reporteRepository.generarReporteCitas as jest.Mock).mockResolvedValue([]);
      
      await expect(reporteService.generarReporteCSV(mockFiltro))
        .rejects.toThrow(new AppError('No hay datos para generar el reporte', 400));
    });
  });

  describe('generarResumen', () => {
    it('should generate statistics for a date range', async () => {
      (reporteRepository.generarResumen as jest.Mock).mockResolvedValue(mockResumen);
      
      const result = await reporteService.generarResumen(mockFiltro);
      
      expect(reporteRepository.generarResumen).toHaveBeenCalledWith(mockFiltro);
      expect(result).toEqual(mockResumen);
      expect(Object.keys(result.porEspecialidad).length).toBe(3);
    });
  });
});