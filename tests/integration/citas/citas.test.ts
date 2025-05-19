// tests/integration/citas/citas.test.ts
import request from 'supertest';
import app from '../../../src/app';
import { setupTestDatabase, cleanupTestDatabase } from '../config/test-db';

describe('Gestión de Citas Médicas', () => {
  let pacienteToken: string;
  let medicoToken: string;
  let adminToken: string;
  let citaId: string;
  
  beforeAll(async () => {
    await setupTestDatabase();
    
    // Obtener tokens
    const pacienteRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'paciente@test.com', password: 'Password123!' });
    pacienteToken = pacienteRes.body.accessToken;
    
    const medicoRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'medico@test.com', password: 'Password123!' });
    medicoToken = medicoRes.body.accessToken;
    
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'Password123!' });
    adminToken = adminRes.body.accessToken;
  });
  
  afterAll(async () => {
    await cleanupTestDatabase();
  });

  // Formato de fecha para mañana
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  const tomorrowStr = tomorrow.toISOString();

  it('debería permitir a un paciente agendar una cita', async () => {
    const response = await request(app)
      .post('/api/citas')
      .set('Authorization', `Bearer ${pacienteToken}`)
      .send({
        medico_id: 'test-medico-id',
        fecha_hora: tomorrowStr,
        motivo: 'TEST: Consulta de prueba de integración'
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    citaId = response.body.id;
  });

  it('debería permitir a un paciente ver sus citas', async () => {
    const response = await request(app)
      .get('/api/citas/mis-citas')
      .set('Authorization', `Bearer ${pacienteToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('citas');
    expect(Array.isArray(response.body.citas)).toBe(true);
    expect(response.body.citas.length).toBeGreaterThan(0);
  });

  it('debería permitir a un médico ver sus citas programadas', async () => {
    const response = await request(app)
      .get('/api/citas/medico')
      .set('Authorization', `Bearer ${medicoToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('citas');
    expect(Array.isArray(response.body.citas)).toBe(true);
  });

  it('debería permitir a un paciente cancelar su cita', async () => {
    const response = await request(app)
      .put(`/api/citas/${citaId}/cancelar`)
      .set('Authorization', `Bearer ${pacienteToken}`)
      .send({
        motivo_cancelacion: 'TEST: Cancelación por prueba de integración'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.estado).toBe('cancelada');
  });

  it('debería permitir a un médico marcar una cita como completada', async () => {
    // Primero agenda una nueva cita
    const nuevaCita = await request(app)
      .post('/api/citas')
      .set('Authorization', `Bearer ${pacienteToken}`)
      .send({
        medico_id: 'test-medico-id',
        fecha_hora: tomorrowStr,
        motivo: 'TEST: Cita para completar'
      });
    
    const nuevaCitaId = nuevaCita.body.id;
    
    const response = await request(app)
      .put(`/api/citas/${nuevaCitaId}/completar`)
      .set('Authorization', `Bearer ${medicoToken}`)
      .send({
        observaciones: 'TEST: Cita completada satisfactoriamente',
        diagnostico: 'TEST: Diagnóstico de prueba'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.estado).toBe('completada');
  });

  it('debería rechazar agendamiento en horario ya ocupado', async () => {
    // Primero agenda una cita válida
    const citaValida = await request(app)
      .post('/api/citas')
      .set('Authorization', `Bearer ${pacienteToken}`)
      .send({
        medico_id: 'test-medico-id',
        fecha_hora: tomorrowStr, // Mismo horario que citas anteriores
        motivo: 'TEST: Cita conflicto'
      });
    
    // Ahora intenta agendar otra cita en el mismo horario
    const response = await request(app)
      .post('/api/citas')
      .set('Authorization', `Bearer ${pacienteToken}`)
      .send({
        medico_id: 'test-medico-id',
        fecha_hora: tomorrowStr, // Mismo horario
        motivo: 'TEST: Esta cita debería fallar'
      });
    
    // Debería fallar porque ya hay una cita a esa hora
    expect(response.status).toBe(400);
  });
});