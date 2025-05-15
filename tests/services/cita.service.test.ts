import citaService from '../../src/services/cita.service';
import citaRepository from '../../src/repositories/cita.repo';
import medicoRepository from '../../src/repositories/medico.repo';
import notificationService from '../../src/services/notification.service';
import { CitaInput, CitaUpdateInput, EstadoCita } from '../../src/models/cita';
import AppError from '../../src/utils/AppError';

// Mock dependencies
jest.mock('../../src/repositories/cita.repo');
jest.mock('../../src/repositories/medico.repo');
jest.mock('../../src/services/notification.service');
jest.mock('../../src/utils/logger');

describe('CitaService', () => {
  // Test data
  const mockCitaId = '123e4567-e89b-12d3-a456-426614174000';
  const mockMedicoId = '123e4567-e89b-12d3-a456-426614174001';
  const mockPacienteId = '123e4567-e89b-12d3-a456-426614174002';
  
  const mockCitaInput: CitaInput = {
    paciente_id: mockPacienteId,
    medico_id: mockMedicoId,
    fecha_hora: new Date('2025-06-01T14:30:00Z')
  };
  
  const mockCita = {
    id: mockCitaId,
    paciente_id: mockPacienteId,
    medico_id: mockMedicoId,
    fecha_hora: new Date('2025-06-01T14:30:00Z'),
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
  
  const mockMedico = {
    id: mockMedicoId,
    usuario_id: '123e4567-e89b-12d3-a456-426614174005',
    especialidad: 'Cardiología',
    duracion_cita: 30
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCita', () => {
    it('should create a new appointment successfully', async () => {
      // Setup mocks
      (medicoRepository.findById as jest.Mock).mockResolvedValue(mockMedico);
      (citaRepository.create as jest.Mock).mockResolvedValue(mockCita);
      (citaRepository.findCompletaById as jest.Mock).mockResolvedValue(mockCitaCompleta);
      (notificationService.enviarConfirmacionCita as jest.Mock).mockResolvedValue(undefined);
      
      const result = await citaService.createCita(mockCitaInput);
      
      // Assertions
      expect(medicoRepository.findById).toHaveBeenCalledWith(mockMedicoId);
      expect(citaRepository.create).toHaveBeenCalledWith(mockCitaInput);
      expect(citaRepository.findCompletaById).toHaveBeenCalledWith(mockCita.id);
      expect(notificationService.enviarConfirmacionCita).toHaveBeenCalledWith(mockCitaCompleta);
      expect(result).toEqual(mockCitaCompleta);
    });

    it('should throw an error if medico does not exist', async () => {
      // Setup mock to return null for medico
      (medicoRepository.findById as jest.Mock).mockResolvedValue(null);
      
      // Assertions
      await expect(citaService.createCita(mockCitaInput))
        .rejects.toThrow(new AppError('Médico no encontrado', 404));
    });

    it('should not fail if notification fails', async () => {
      // Setup mocks
      (medicoRepository.findById as jest.Mock).mockResolvedValue(mockMedico);
      (citaRepository.create as jest.Mock).mockResolvedValue(mockCita);
      (citaRepository.findCompletaById as jest.Mock).mockResolvedValue(mockCitaCompleta);
      (notificationService.enviarConfirmacionCita as jest.Mock).mockRejectedValue(new Error('Email error'));
      
      // This should not throw despite notification error
      const result = await citaService.createCita(mockCitaInput);
      
      expect(result).toEqual(mockCitaCompleta);
    });
  });

  describe('getCitaById', () => {
    it('should get an appointment by id', async () => {
      (citaRepository.findCompletaById as jest.Mock).mockResolvedValue(mockCitaCompleta);
      
      const result = await citaService.getCitaById(mockCitaId);
      
      expect(citaRepository.findCompletaById).toHaveBeenCalledWith(mockCitaId);
      expect(result).toEqual(mockCitaCompleta);
    });

    it('should throw an error if the appointment does not exist', async () => {
      (citaRepository.findCompletaById as jest.Mock).mockResolvedValue(null);
      
      await expect(citaService.getCitaById('nonexistent-id'))
        .rejects.toThrow(new AppError('Cita no encontrada', 404));
    });
  });

  describe('updateCita', () => {
    const updateData: CitaUpdateInput = {
      fecha_hora: new Date('2025-06-02T15:00:00Z')
    };

    it('should update an appointment successfully', async () => {
      (citaRepository.update as jest.Mock).mockResolvedValue(true);
      (citaRepository.findCompletaById as jest.Mock).mockResolvedValue({
        ...mockCitaCompleta,
        fecha_hora: updateData.fecha_hora
      });
      (notificationService.enviarActualizacionCita as jest.Mock).mockResolvedValue(undefined);
      
      const result = await citaService.updateCita(mockCitaId, updateData);
      
      expect(citaRepository.update).toHaveBeenCalledWith(mockCitaId, updateData);
      expect(notificationService.enviarActualizacionCita).toHaveBeenCalled();
      expect(result.fecha_hora).toEqual(updateData.fecha_hora);
    });

    it('should throw an error if the appointment cannot be found after update', async () => {
      (citaRepository.update as jest.Mock).mockResolvedValue(true);
      (citaRepository.findCompletaById as jest.Mock).mockResolvedValue(null);
      
      await expect(citaService.updateCita(mockCitaId, updateData))
        .rejects.toThrow(new AppError('Cita no encontrada después de actualizar', 404));
    });
  });

  describe('enviarRecordatoriosCitasDiaSiguiente', () => {
    it('should send reminders for tomorrow\'s appointments', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const mockCitas = [
        { ...mockCitaCompleta, id: '1', fecha_hora: tomorrow },
        { ...mockCitaCompleta, id: '2', fecha_hora: tomorrow }
      ];
      
      (citaRepository.findByFilters as jest.Mock).mockResolvedValue({
        citas: mockCitas,
        total: 2
      });
      (notificationService.enviarRecordatorioCita as jest.Mock).mockResolvedValue(undefined);
      
      const result = await citaService.enviarRecordatoriosCitasDiaSiguiente();
      
      expect(citaRepository.findByFilters).toHaveBeenCalled();
      expect(notificationService.enviarRecordatorioCita).toHaveBeenCalledTimes(2);
      expect(result).toBe(2); // 2 reminders sent
    });

    it('should handle notification failures for individual appointments', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const mockCitas = [
        { ...mockCitaCompleta, id: '1', fecha_hora: tomorrow },
        { ...mockCitaCompleta, id: '2', fecha_hora: tomorrow }
      ];
      
      (citaRepository.findByFilters as jest.Mock).mockResolvedValue({
        citas: mockCitas,
        total: 2
      });
      
      // First notification succeeds, second fails
      (notificationService.enviarRecordatorioCita as jest.Mock)
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Failed to send email'));
      
      const result = await citaService.enviarRecordatoriosCitasDiaSiguiente();
      
      expect(result).toBe(1); // Only 1 reminder sent successfully
    });
  });
});