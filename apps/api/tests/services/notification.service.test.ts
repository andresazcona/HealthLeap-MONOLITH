import notificationService from '../../src/services/notification.service';
import emailConfig from '../../src/config/email'; // Changed import
import { EstadoCita } from '../../src/models/cita';
import AppError from '../../src/utils/AppError';

// Mock dependencies
jest.mock('../../src/config/email');
jest.mock('../../src/utils/logger');

describe('NotificationService', () => {
  // Test data
  const mockCitaId = '123e4567-e89b-12d3-a456-426614174000';
  
  const mockCitaCompleta = {
    id: mockCitaId,
    paciente_id: '123e4567-e89b-12d3-a456-426614174001',
    medico_id: '123e4567-e89b-12d3-a456-426614174002',
    fecha_hora: new Date('2025-06-01T14:30:00Z'),
    estado: 'agendada' as EstadoCita,
    created_at: new Date(),
    nombre_paciente: 'Juan Pérez',
    email_paciente: 'paciente@ejemplo.com',
    nombre_medico: 'Dra. María Rodríguez',
    especialidad: 'Cardiología',
    duracion_cita: 30
  };

  // Mock transporter
  const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'mock-message-id' });
  const mockTransporter = { sendMail: mockSendMail };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock for email transporter
    (emailConfig.getTransporter as jest.Mock).mockReturnValue(mockTransporter);
  });

  describe('sendEmail', () => {
    it('should send an email successfully', async () => {
      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        body: '<p>Test body</p>'
      };
      
      const result = await notificationService.sendEmail(emailData);
      
      expect(emailConfig.getTransporter).toHaveBeenCalled();
      expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.body
      }));
      expect(result).toBe('mock-message-id');
    });

    it('should throw an error if email sending fails', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('Email sending failed'));
      
      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        body: '<p>Test body</p>'
      };
      
      await expect(notificationService.sendEmail(emailData))
        .rejects.toThrow(new AppError('Error al enviar el correo electrónico', 500));
    });
  });

  describe('enviarConfirmacionCita', () => {
    it('should send appointment confirmation email', async () => {
      // Mock the sendEmail method within the service
      jest.spyOn(notificationService, 'sendEmail').mockResolvedValue('message-id');
      
      await notificationService.enviarConfirmacionCita(mockCitaCompleta);
      
      expect(notificationService.sendEmail).toHaveBeenCalledWith({
        to: mockCitaCompleta.email_paciente,
        subject: expect.stringContaining('Confirmación'),
        body: expect.stringContaining(mockCitaCompleta.nombre_paciente)
      });
    });

    it('should skip sending if patient has no email', async () => {
      // Mock the sendEmail method within the service
      jest.spyOn(notificationService, 'sendEmail').mockResolvedValue('message-id');
      
      const citaSinEmail = { ...mockCitaCompleta, email_paciente: '' };
      
      await notificationService.enviarConfirmacionCita(citaSinEmail);
      
      expect(notificationService.sendEmail).not.toHaveBeenCalled();
    });

    it('should throw an error if there is a problem with notification', async () => {
      // Mock the sendEmail method to throw an error
      jest.spyOn(notificationService, 'sendEmail').mockRejectedValue(new Error('Failed'));
      
      await expect(notificationService.enviarConfirmacionCita(mockCitaCompleta))
        .rejects.toThrow(new AppError('Error al enviar la confirmación de cita', 500));
    });
  });

  describe('enviarRecordatorioCita', () => {
    it('should send appointment reminder email', async () => {
      // Mock the sendEmail method within the service
      jest.spyOn(notificationService, 'sendEmail').mockResolvedValue('message-id');
      
      await notificationService.enviarRecordatorioCita(mockCitaCompleta);
      
      expect(notificationService.sendEmail).toHaveBeenCalledWith({
        to: mockCitaCompleta.email_paciente,
        subject: expect.stringContaining('Recordatorio'),
        body: expect.stringContaining(mockCitaCompleta.nombre_paciente)
      });
    });

    it('should skip sending if patient has no email', async () => {
      // Mock the sendEmail method within the service
      jest.spyOn(notificationService, 'sendEmail').mockResolvedValue('message-id');
      
      const citaSinEmail = { ...mockCitaCompleta, email_paciente: '' };
      
      await notificationService.enviarRecordatorioCita(citaSinEmail);
      
      expect(notificationService.sendEmail).not.toHaveBeenCalled();
    });
  });
});