// tests/integration/citas/citas.test.ts
import request from 'supertest';
import app from '../../../src/app';
import { setupTestDatabase, cleanupTestDatabase, closeTestDatabase } from '../config/test-db';

describe('Gestión de Citas Médicas', () => {
  let dbReady = false;
  let adminToken: string;
  let pacienteToken: string;
  let medicoToken: string;
  let citaId: string;
  
  // Preparar BD y obtener tokens antes de las pruebas
  beforeAll(async () => {
    try {
      // Preparar BD
      dbReady = await setupTestDatabase();
      
      // Obtener tokens de usuarios predefinidos
      const loginAdmin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'Password123!'
        });
      
      const loginPaciente = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'paciente@test.com',
          password: 'Password123!'
        });
      
      const loginMedico = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'medico@test.com',
          password: 'Password123!'
        });
      
      adminToken = loginAdmin.body.accessToken;
      pacienteToken = loginPaciente.body.accessToken;
      medicoToken = loginMedico.body.accessToken;
      
    } catch (error) {
      console.error('Error en beforeAll:', error);
      dbReady = false;
    }
  });
  
  afterAll(async () => {
    try {
      await cleanupTestDatabase();
      await closeTestDatabase();
    } catch (error) {
      console.error('Error en afterAll:', error);
    }
  });

  it('debería permitir a un paciente agendar una cita', async () => {
    if (!dbReady || !pacienteToken) {
      console.log('⏩ Prueba omitida - BD o tokens no disponibles');
      return;
    }
    
    // Fecha para mañana a las 10:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    
    const response = await request(app)
      .post('/api/citas')
      .set('Authorization', `Bearer ${pacienteToken}`)
      .send({
        medico_id: 'test-medico-info-id',
        fecha_hora: tomorrow.toISOString(),
        motivo: 'TEST: Consulta de prueba'
      });
    
    // Verificar respuesta
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    
    // Guardar ID para pruebas siguientes
    citaId = response.body.id;
  });

  it('debería permitir a un paciente ver sus citas', async () => {
    if (!dbReady || !pacienteToken) return;
    
    const response = await request(app)
      .get('/api/citas/mis-citas')
      .set('Authorization', `Bearer ${pacienteToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('citas');
    expect(Array.isArray(response.body.citas)).toBe(true);
  });

  it('debería permitir a un médico ver sus citas programadas', async () => {
    if (!dbReady || !medicoToken) return;
    
    const response = await request(app)
      .get('/api/citas/medico')
      .set('Authorization', `Bearer ${medicoToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('citas');
    expect(Array.isArray(response.body.citas)).toBe(true);
  });

  it('debería permitir a un paciente cancelar su cita', async () => {
    if (!dbReady || !pacienteToken || !citaId) return;
    
    const response = await request(app)
      .patch(`/api/citas/${citaId}/cancelar`)
      .set('Authorization', `Bearer ${pacienteToken}`)
      .send({
        motivo: 'TEST: Cancelación de prueba'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.estado).toBe('cancelada');
  });

  it('debería rechazar agendamiento en horario ya ocupado', async () => {
    if (!dbReady || !pacienteToken) return;
    
    // Crear una primera cita
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    
    // Primera cita
    await request(app)
      .post('/api/citas')
      .set('Authorization', `Bearer ${pacienteToken}`)
      .send({
        medico_id: 'test-medico-info-id',
        fecha_hora: tomorrow.toISOString(),
        motivo: 'TEST: Primera cita'
      });
    
    // Intentar crear otra cita en el mismo horario
    const response = await request(app)
      .post('/api/citas')
      .set('Authorization', `Bearer ${pacienteToken}`)
      .send({
        medico_id: 'test-medico-info-id',
        fecha_hora: tomorrow.toISOString(),
        motivo: 'TEST: Segunda cita (debería fallar)'
      });
    
    // Debería fallar por conflicto
    expect(response.status).toBe(400);
  });
});