// tests/integration/flujos/e2e.test.ts
import request from 'supertest';
import app from '../../../src/app';
import { setupTestDatabase, cleanupTestDatabase, closeTestDatabase } from '../config/test-db';

describe('Flujos End-to-End', () => {
  let dbReady = false;
  
  beforeAll(async () => {
    dbReady = await setupTestDatabase();
  });
  
  afterAll(async () => {
    await cleanupTestDatabase();
    await closeTestDatabase();
  });

  it('flujo completo: registro, búsqueda médico, agenda y cancelación', async () => {
    if (!dbReady) {
      console.log('⏩ Prueba omitida - BD no disponible');
      return;
    }
    
    // 1. Registrar nuevo paciente
    const email = `temp-${Date.now()}@test.com`;
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Paciente E2E',
        email: email,
        password: 'Password123!',
        telefono: '1234567890'
      });
    
    expect(registerResponse.status).toBe(201);
    const token = registerResponse.body.accessToken;
    
    // 2. Buscar médicos por especialidad
    const searchResponse = await request(app)
      .get('/api/medicos?especialidad=Cardiología')
      .set('Authorization', `Bearer ${token}`);
    
    expect(searchResponse.status).toBe(200);
    expect(searchResponse.body.medicos.length).toBeGreaterThan(0);
    const medicoId = searchResponse.body.medicos[0].id;
    
    // 3. Revisar disponibilidad
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(11, 0, 0, 0);
    
    // 4. Agendar cita
    const bookingResponse = await request(app)
      .post('/api/citas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        medico_id: medicoId,
        fecha_hora: tomorrow.toISOString(),
        motivo: 'TEST: Consulta E2E'
      });
    
    expect(bookingResponse.status).toBe(201);
    const citaId = bookingResponse.body.id;
    
    // 5. Verificar citas agendadas
    const myCitasResponse = await request(app)
      .get('/api/citas/mis-citas')
      .set('Authorization', `Bearer ${token}`);
    
    expect(myCitasResponse.status).toBe(200);
    expect(myCitasResponse.body.citas.some((c: { id: string }) => c.id === citaId)).toBe(true);
    
    // 6. Cancelar cita
    const cancelResponse = await request(app)
      .patch(`/api/citas/${citaId}/cancelar`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        motivo: 'TEST: Cancelación de prueba E2E'
      });
    
    expect(cancelResponse.status).toBe(200);
    expect(cancelResponse.body.estado).toBe('cancelada');
  });

  it('flujo completo: médico configura agenda, paciente agenda y médico atiende', async () => {
    if (!dbReady) return;
    
    // 1. Login como médico
    const loginMedico = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'medico@test.com',
        password: 'Password123!'
      });
    
    expect(loginMedico.status).toBe(200);
    const medicoToken = loginMedico.body.accessToken;
    
    // 2. Médico configura disponibilidad
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const fechaStr = tomorrow.toISOString().split('T')[0];
    
    const configResponse = await request(app)
      .post('/api/disponibilidad')
      .set('Authorization', `Bearer ${medicoToken}`)
      .send({
        fecha: fechaStr,
        hora_inicio: '09:00',
        hora_fin: '18:00',
        intervalo_minutos: 30
      });
    
    expect(configResponse.status).toBe(200);
    
    // 3. Login como paciente
    const loginPaciente = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'paciente@test.com',
        password: 'Password123!'
      });
    
    expect(loginPaciente.status).toBe(200);
    const pacienteToken = loginPaciente.body.accessToken;
    
    // 4. Paciente agenda cita
    tomorrow.setHours(10, 0, 0, 0);
    
    const bookingResponse = await request(app)
      .post('/api/citas')
      .set('Authorization', `Bearer ${pacienteToken}`)
      .send({
        medico_id: 'test-medico-info-id',
        fecha_hora: tomorrow.toISOString(),
        motivo: 'TEST: Consulta agendada para atender'
      });
    
    expect(bookingResponse.status).toBe(201);
    const citaId = bookingResponse.body.id;
    
    // 5. Médico completa la cita
    const completarResponse = await request(app)
      .patch(`/api/citas/${citaId}/completar`)
      .set('Authorization', `Bearer ${medicoToken}`)
      .send({
        observaciones: 'TEST: Paciente atendido correctamente'
      });
    
    expect(completarResponse.status).toBe(200);
    expect(completarResponse.body.estado).toBe('completada');
  });
});