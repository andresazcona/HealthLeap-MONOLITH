// tests/integration/flujos/e2e.test.ts
import request from 'supertest';
import app from '../../../src/app';
import { setupTestDatabase, cleanupTestDatabase } from '../config/test-db';

describe('Flujos End-to-End', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });
  
  afterAll(async () => {
    await cleanupTestDatabase();
  });

  it('flujo completo: registro, búsqueda médico, agenda y cancelación', async () => {
    // 1. Registro de paciente
    const registroRes = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Paciente E2E',
        email: 'paciente.e2e@test.com',
        password: 'Password123!',
        telefono: '1234567890'
      });
    
    expect(registroRes.status).toBe(201);
    const token = registroRes.body.accessToken;
    
    // 2. Búsqueda de médicos por especialidad
    const medicosRes = await request(app)
      .get('/api/medicos?especialidad=Medicina General')
      .set('Authorization', `Bearer ${token}`);
    
    expect(medicosRes.status).toBe(200);
    expect(medicosRes.body.medicos.length).toBeGreaterThan(0);
    const medicoId = medicosRes.body.medicos[0].id;
    
    // 3. Consulta de disponibilidad
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const disponibilidadRes = await request(app)
      .get(`/api/disponibilidad/${medicoId}/${tomorrowStr}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(disponibilidadRes.status).toBe(200);
    
    // Obtener un horario disponible
    const horaDisponible = disponibilidadRes.body.bloquesDisponibles.length > 0 
      ? disponibilidadRes.body.bloquesDisponibles[0].inicio 
      : `${tomorrowStr}T09:00:00`;
    
    // 4. Agendar cita
    const citaRes = await request(app)
      .post('/api/citas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        medico_id: medicoId,
        fecha_hora: horaDisponible,
        motivo: 'TEST: Consulta de flujo E2E'
      });
    
    expect(citaRes.status).toBe(201);
    const citaId = citaRes.body.id;
    
    // 5. Verificar cita agendada
    const misCitasRes = await request(app)
      .get('/api/citas/mis-citas')
      .set('Authorization', `Bearer ${token}`);
    
    expect(misCitasRes.status).toBe(200);
    expect(misCitasRes.body.citas.some(c => c.id === citaId)).toBe(true);
    
    // 6. Cancelar cita
    const cancelarRes = await request(app)
      .put(`/api/citas/${citaId}/cancelar`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        motivo_cancelacion: 'TEST: Cancelación de prueba E2E'
      });
    
    expect(cancelarRes.status).toBe(200);
    expect(cancelarRes.body.estado).toBe('cancelada');
    
    // 7. Verificar que la cita está cancelada
    const verificacionRes = await request(app)
      .get(`/api/citas/${citaId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(verificacionRes.status).toBe(200);
    expect(verificacionRes.body.estado).toBe('cancelada');
  });

  it('flujo completo: médico configura agenda, paciente agenda y médico atiende', async () => {
    // 1. Login como médico
    const medicoLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'medico@test.com',
        password: 'Password123!'
      });
    
    expect(medicoLoginRes.status).toBe(200);
    const medicoToken = medicoLoginRes.body.accessToken;
    const medicoId = 'test-medico-id';
    
    // 2. Médico configura su disponibilidad
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const bloquearRes = await request(app)
      .post('/api/disponibilidad/bloquear')
      .set('Authorization', `Bearer ${medicoToken}`)
      .send({
        medico_id: medicoId,
        fecha: tomorrowStr,
        bloques_bloqueados: [
          {
            inicio: `${tomorrowStr}T12:00:00`,
            fin: `${tomorrowStr}T13:00:00`
          }
        ]
      });
    
    expect(bloquearRes.status).toBe(200);
    
    // 3. Login como paciente
    const pacienteLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'paciente@test.com',
        password: 'Password123!'
      });
    
    expect(pacienteLoginRes.status).toBe(200);
    const pacienteToken = pacienteLoginRes.body.accessToken;
    
    // 4. Paciente consulta disponibilidad
    const disponibilidadRes = await request(app)
      .get(`/api/disponibilidad/${medicoId}/${tomorrowStr}`)
      .set('Authorization', `Bearer ${pacienteToken}`);
    
    expect(disponibilidadRes.status).toBe(200);
    
    // Obtener un horario disponible fuera del bloque bloqueado
    const horaDisponible = `${tomorrowStr}T09:00:00`;
    
    // 5. Paciente agenda cita
    const citaRes = await request(app)
      .post('/api/citas')
      .set('Authorization', `Bearer ${pacienteToken}`)
      .send({
        medico_id: medicoId,
        fecha_hora: horaDisponible,
        motivo: 'TEST: Consulta médica de prueba E2E'
      });
    
    expect(citaRes.status).toBe(201);
    const citaId = citaRes.body.id;
    
    // 6. Médico verifica sus citas programadas
    const citasMedicoRes = await request(app)
      .get('/api/citas/medico')
      .set('Authorization', `Bearer ${medicoToken}`);
    
    expect(citasMedicoRes.status).toBe(200);
    expect(citasMedicoRes.body.citas.some(c => c.id === citaId)).toBe(true);
    
    // 7. Médico completa la cita
    const completarRes = await request(app)
      .put(`/api/citas/${citaId}/completar`)
      .set('Authorization', `Bearer ${medicoToken}`)
      .send({
        observaciones: 'TEST: Consulta completada exitosamente',
        diagnostico: 'TEST: Paciente en buen estado general'
      });
    
    expect(completarRes.status).toBe(200);
    expect(completarRes.body.estado).toBe('completada');
    
    // 8. Paciente verifica que su cita está completada
    const verificacionRes = await request(app)
      .get(`/api/citas/${citaId}`)
      .set('Authorization', `Bearer ${pacienteToken}`);
    
    expect(verificacionRes.status).toBe(200);
    expect(verificacionRes.body.estado).toBe('completada');
    expect(verificacionRes.body.diagnostico).toContain('buen estado');
  });
});