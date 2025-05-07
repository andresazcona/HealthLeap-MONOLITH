import disponibilidadRepository from '../../src/repositories/disponibilidad.repo';
import { query } from '../../src/config/database';
import citaRepo from '../../src/repositories/cita.repo';
import medicoRepo from '../../src/repositories/medico.repo';
import { BloqueDisponible, ConfiguracionAgenda } from '../../src/models/disponibilidad';
import { startOfDay, endOfDay } from '../../src/utils/date-utils';

// Mocks necesarios
jest.mock('../../src/config/database', () => ({
  query: jest.fn()
}));

jest.mock('../../src/repositories/medico.repo', () => ({
  findById: jest.fn()
}));

jest.mock('../../src/repositories/cita.repo', () => ({
  findByMedicoId: jest.fn()
}));

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn()
}));

describe('Disponibilidad Repository', () => {
  // Datos de prueba
  const mockMedicoId = '123e4567-e89b-12d3-a456-426614174001';
  const mockFecha = '2025-06-01';
  
  const mockMedico = {
    id: mockMedicoId,
    usuario_id: '123e4567-e89b-12d3-a456-426614174005',
    especialidad: 'Cardiología',
    duracion_cita: 30
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('inicializarTabla', () => {
    it('debería inicializar la tabla de bloques bloqueados', async () => {
      (query as jest.Mock).mockResolvedValue({ rows: [] });
      
      // La inicialización ocurre en el constructor, así que podemos probar
      // llamando al método directamente
      await (disponibilidadRepository as any).inicializarTabla();
      
      expect(query).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS bloques_bloqueados'));
    });
  });

  describe('getDisponibilidad', () => {
    it('debería obtener bloques de tiempo disponibles', async () => {
      // Mock para encontrar al médico
      (medicoRepo.findById as jest.Mock).mockResolvedValue(mockMedico);
      
      // Mock para encontrar citas (sin citas)
      (citaRepo.findByMedicoId as jest.Mock).mockResolvedValue({ 
        citas: [], 
        total: 0 
      });
      
      // Mock para bloques bloqueados
      jest.spyOn(disponibilidadRepository, 'getBloquesBloqueados').mockResolvedValue([]);
      
      const result = await disponibilidadRepository.getDisponibilidad(mockMedicoId, mockFecha);
      
      expect(medicoRepo.findById).toHaveBeenCalledWith(mockMedicoId);
      expect(citaRepo.findByMedicoId).toHaveBeenCalled();
      expect(disponibilidadRepository.getBloquesBloqueados).toHaveBeenCalledWith(mockMedicoId, mockFecha);
      
      // Verificar que retorna un array de bloques
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      // Verificar estructura de cada bloque
      result.forEach(bloque => {
        expect(bloque).toHaveProperty('inicio');
        expect(bloque).toHaveProperty('fin');
        expect(bloque.inicio).toBeInstanceOf(Date);
        expect(bloque.fin).toBeInstanceOf(Date);
      });
    });
    
    it('debería manejar cuando el médico no existe', async () => {
      (medicoRepo.findById as jest.Mock).mockResolvedValue(null);
      
      await expect(disponibilidadRepository.getDisponibilidad('medico-inexistente', mockFecha))
        .rejects.toThrow('Médico no encontrado');
    });
    
    it('debería considerar citas existentes como no disponibles', async () => {
      // Mock para encontrar al médico
      (medicoRepo.findById as jest.Mock).mockResolvedValue(mockMedico);
      
      // Crear una cita a las 10:00 AM
      const fechaCita = new Date(mockFecha);
      fechaCita.setHours(10, 0, 0, 0);
      
      // Mock para encontrar citas (con una cita existente)
      (citaRepo.findByMedicoId as jest.Mock).mockResolvedValue({ 
        citas: [{
          id: 'cita-id',
          fecha_hora: fechaCita,
          estado: 'agendada'
        }], 
        total: 1 
      });
      
      // Mock para bloques bloqueados (sin bloques)
      jest.spyOn(disponibilidadRepository, 'getBloquesBloqueados').mockResolvedValue([]);
      
      const result = await disponibilidadRepository.getDisponibilidad(mockMedicoId, mockFecha);
      
      // Verificar que el horario de 10:00 AM no está entre los disponibles
      const bloqueDeLas10 = result.find(b => 
        b.inicio.getHours() === 10 && b.inicio.getMinutes() === 0
      );
      
      expect(bloqueDeLas10).toBeUndefined();
    });
  });

  describe('getBloquesBloqueados', () => {
    it('debería obtener bloques bloqueados para un médico y fecha', async () => {
      const mockBloques = [
        { hora_inicio: '09:00:00', hora_fin: '10:00:00' },
        { hora_inicio: '14:00:00', hora_fin: '15:00:00' }
      ];
      
      (query as jest.Mock).mockResolvedValue({ rows: mockBloques });
      
      const result = await disponibilidadRepository.getBloquesBloqueados(mockMedicoId, mockFecha);
      
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT hora_inicio, hora_fin FROM bloques_bloqueados'),
        [mockMedicoId, mockFecha]
      );
      expect(result.length).toBe(2);
      expect(result[0]).toEqual(expect.objectContaining({
        inicio: expect.any(Date),
        fin: expect.any(Date)
      }));
      
      // Verificar que se combinó correctamente la fecha con la hora
      const primerBloque = result[0];
      expect(primerBloque.inicio.toISOString()).toContain('T09:00:00');
      expect(primerBloque.fin.toISOString()).toContain('T10:00:00');
    });
    
    it('debería devolver array vacío cuando no hay bloques', async () => {
      (query as jest.Mock).mockResolvedValue({ rows: [] });
      
      const result = await disponibilidadRepository.getBloquesBloqueados(mockMedicoId, mockFecha);
      
      expect(result).toEqual([]);
    });
  });

  describe('bloquearHorarios', () => {
    it('debería bloquear horarios en la agenda de un médico', async () => {
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
      
      // Mock para encontrar al médico
      (medicoRepo.findById as jest.Mock).mockResolvedValue(mockMedico);
      
      // Mock para encontrar citas (sin citas)
      (citaRepo.findByMedicoId as jest.Mock).mockResolvedValue({ 
        citas: [], 
        total: 0 
      });
      
      // Mock para las consultas
      (query as jest.Mock).mockResolvedValue({ rows: [] });
      
      const result = await disponibilidadRepository.bloquearHorarios(config);
      
      expect(medicoRepo.findById).toHaveBeenCalledWith(mockMedicoId);
      
      // Verificar que se llamó a DELETE para limpiar bloques existentes
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM bloques_bloqueados'),
        expect.arrayContaining([mockMedicoId])
      );
      
      // Verificar que se llamó a INSERT para cada bloque
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO bloques_bloqueados'),
        expect.arrayContaining([
          mockMedicoId,
          expect.any(String), // fecha formateada
          '09:00:00',
          '10:00:00'
        ])
      );
      
      // Verificar la estructura del resultado
      expect(result).toEqual({
        medico_id: mockMedicoId,
        fecha: expect.any(String),
        bloques: config.bloques_bloqueados
      });
    });
    
    it('debería manejar cuando hay solapamiento con citas existentes', async () => {
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
      
      // Mock para encontrar al médico
      (medicoRepo.findById as jest.Mock).mockResolvedValue(mockMedico);
      
      // Mock para encontrar citas (con una cita a las 09:30)
      const fechaCita = new Date(mockFecha);
      fechaCita.setHours(9, 30, 0, 0);
      
      (citaRepo.findByMedicoId as jest.Mock).mockResolvedValue({ 
        citas: [{
          id: 'cita-id',
          fecha_hora: fechaCita,
          estado: 'agendada'
        }], 
        total: 1 
      });
      
      // Este test no está completo ya que la implementación actual no verifica 
      // solapamiento con citas existentes al bloquear horarios.
      // Debería agregarse esta validación al método bloquearHorarios en la implementación
    });
  });

  describe('cerrarAgenda', () => {
    it('debería cerrar la agenda para un día completo', async () => {
      // Mock para encontrar al médico
      (medicoRepo.findById as jest.Mock).mockResolvedValue(mockMedico);
      
      // Mock para encontrar citas (sin citas)
      (citaRepo.findByMedicoId as jest.Mock).mockResolvedValue({ 
        citas: [], 
        total: 0 
      });
      
      // Mock para las consultas
      (query as jest.Mock).mockResolvedValue({ rows: [] });
      
      const result = await disponibilidadRepository.cerrarAgenda(mockMedicoId, mockFecha);
      
      expect(medicoRepo.findById).toHaveBeenCalledWith(mockMedicoId);
      expect(citaRepo.findByMedicoId).toHaveBeenCalled();
      
      // Verificar que se eliminaron bloques existentes
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM bloques_bloqueados'),
        expect.arrayContaining([mockMedicoId])
      );
      
      // Verificar que se creó un bloque que cubre todo el día
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO bloques_bloqueados'),
        expect.arrayContaining([
          mockMedicoId,
          expect.any(String), // fecha formateada
          '08:00:00',
          '17:00:00'
        ])
      );
      
      expect(result).toBe(true);
    });
    
    it('debería rechazar cerrar agenda cuando hay citas programadas', async () => {
      // Mock para encontrar al médico
      (medicoRepo.findById as jest.Mock).mockResolvedValue(mockMedico);
      
      // Mock para encontrar citas (con citas)
      (citaRepo.findByMedicoId as jest.Mock).mockResolvedValue({ 
        citas: [{
          id: 'cita-id',
          estado: 'agendada'
        }], 
        total: 1 
      });
      
      await expect(disponibilidadRepository.cerrarAgenda(mockMedicoId, mockFecha))
        .rejects.toThrow('No se puede cerrar la agenda porque hay citas programadas');
      
      // Verificar que no se realizaron operaciones en la base de datos
      expect(query).not.toHaveBeenCalled();
    });
  });
});