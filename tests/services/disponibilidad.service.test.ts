import disponibilidadService from '../../src/services/disponibilidad.service';
import disponibilidadRepository from '../../src/repositories/disponibilidad.repo';
import medicoRepository from '../../src/repositories/medico.repo';
import citaRepository from '../../src/repositories/cita.repo';
import { ConfiguracionAgenda } from '../../src/models/disponibilidad';
import AppError from '../../src/utils/AppError';

// Mock dependencies
jest.mock('../../src/repositories/disponibilidad.repo');
jest.mock('../../src/repositories/medico.repo');
jest.mock('../../src/repositories/cita.repo');
jest.mock('../../src/utils/logger');

describe('DisponibilidadService', () => {
  // Test data
  const mockMedicoId = '123e4567-e89b-12d3-a456-426614174001';
  const mockFecha = '2025-06-01';
  
  const mockBloqueDisponible = {
    inicio: new Date(`${mockFecha}T09:00:00`),
    fin: new Date(`${mockFecha}T09:30:00`)
  };
  
  const mockDisponibilidadDiaria = {
    fecha: mockFecha,
    medico_id: mockMedicoId,
    bloquesDisponibles: [mockBloqueDisponible],
    bloquesBloqueados: [],
    citasAgendadas: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock por defecto para que el médico exista
    (medicoRepository.findById as jest.Mock).mockResolvedValue({
      id: mockMedicoId,
      nombre: 'Dr. Test',
      especialidad: 'Cardiología',
      activo: true
    });
  });

  describe('getDisponibilidadMedico', () => {
    it('should get availability for a specific doctor and date', async () => {
      (disponibilidadRepository.getDisponibilidad as jest.Mock).mockResolvedValue([mockBloqueDisponible]);
      (citaRepository.findByMedicoId as jest.Mock).mockResolvedValue({
        citas: [],
        total: 0
      });
      
      const result = await disponibilidadService.getDisponibilidadMedico(mockMedicoId, mockFecha);
      
      expect(disponibilidadRepository.getDisponibilidad).toHaveBeenCalledWith(mockMedicoId, mockFecha);
      expect(citaRepository.findByMedicoId).toHaveBeenCalled();
      expect(result.bloquesDisponibles).toEqual([mockBloqueDisponible]);
      expect(result.fecha).toBe(mockFecha);
    });

    it('should handle repository errors', async () => {
      // El médico existe, pero falla el repositorio de disponibilidad
      (disponibilidadRepository.getDisponibilidad as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });
      
      try {
        await disponibilidadService.getDisponibilidadMedico(mockMedicoId, mockFecha);
        fail('Debería haber lanzado un error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).message).toContain('Error al obtener disponibilidad');
      }
    });

    it('should pass along AppErrors from the repository', async () => {
      const appError = new AppError('Médico no encontrado', 404);
      (disponibilidadRepository.getDisponibilidad as jest.Mock).mockRejectedValue(appError);
      
      await expect(disponibilidadService.getDisponibilidadMedico(mockMedicoId, mockFecha))
        .rejects.toThrow(appError);
    });
  });

  describe('getAgendaGlobal', () => {
    it('should get global agenda for a specific date', async () => {
      const mockMedicos = [
        { id: mockMedicoId, nombre: 'Dr. López', especialidad: 'Cardiología' },
        { id: 'medico2', nombre: 'Dra. García', especialidad: 'Neurología' }
      ];
      
      (medicoRepository.findByFilters as jest.Mock).mockResolvedValue({
        medicos: mockMedicos,
        total: 2
      });
      
      (disponibilidadService.getDisponibilidadMedico as jest.Mock) = jest.fn()
        .mockResolvedValueOnce(mockDisponibilidadDiaria)
        .mockResolvedValueOnce({
          ...mockDisponibilidadDiaria,
          medico_id: 'medico2'
        });
      
      const result = await disponibilidadService.getAgendaGlobal(mockFecha);
      
      expect(medicoRepository.findByFilters).toHaveBeenCalled();
      expect(Object.keys(result).length).toBe(2);
      expect(result[mockMedicoId]).toBeDefined();
      expect(result['medico2']).toBeDefined();
    });
  });

  describe('bloquearHorarios', () => {
    it('should block time slots in a doctor\'s schedule', async () => {
      const config: ConfiguracionAgenda = {
        medico_id: mockMedicoId,
        fecha: mockFecha,
        bloques_bloqueados: [
          {
            inicio: new Date(`${mockFecha}T09:00:00`),
            fin: new Date(`${mockFecha}T10:00:00`)
          }
        ]
      };
      
      (disponibilidadRepository.bloquearHorarios as jest.Mock).mockResolvedValue(config);
      
      const result = await disponibilidadService.bloquearHorarios(config);
      
      expect(disponibilidadRepository.bloquearHorarios).toHaveBeenCalledWith(config);
      expect(result).toEqual(config);
    });

    it('should handle repository errors', async () => {
      const config: ConfiguracionAgenda = {
        medico_id: mockMedicoId,
        fecha: mockFecha,
        bloques_bloqueados: [
          {
            inicio: new Date(`${mockFecha}T09:00:00`),
            fin: new Date(`${mockFecha}T10:00:00`)
          }
        ]
      };
      
      // El médico existe, pero falla el repositorio al bloquear
      (disponibilidadRepository.bloquearHorarios as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });
      
      try {
        await disponibilidadService.bloquearHorarios(config);
        fail('Debería haber lanzado un error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).message).toContain('Error al bloquear horarios');
      }
    });
  });

  describe('cerrarAgenda', () => {
    it('should close a doctor\'s schedule for an entire day', async () => {
      (disponibilidadRepository.cerrarAgenda as jest.Mock).mockResolvedValue(true);
      
      const result = await disponibilidadService.cerrarAgenda(mockMedicoId, mockFecha);
      
      expect(disponibilidadRepository.cerrarAgenda).toHaveBeenCalledWith(mockMedicoId, mockFecha);
      expect(result).toBe(true);
    });

    it('should handle repository errors', async () => {
      (disponibilidadRepository.cerrarAgenda as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );
      
      await expect(disponibilidadService.cerrarAgenda(mockMedicoId, mockFecha))
        .rejects.toThrow(new AppError('Error al cerrar agenda', 500));
    });
  });
});