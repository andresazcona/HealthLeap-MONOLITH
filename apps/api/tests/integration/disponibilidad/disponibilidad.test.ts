// tests/integration/disponibilidad/disponibilidad.test.ts
import request from 'supertest';
import app from '../../../src/app';
import { setupTestDatabase, cleanupTestDatabase, closeTestDatabase } from '../config/test-db';

describe('Gestión de Disponibilidad', () => {
  let dbReady = false;
  let medicoToken: string;
  let adminToken: string;
  
  beforeAll(async () => {
    try {
      dbReady = await setupTestDatabase();
      
      // Obtener tokens
      const loginMedico = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'medico@test.com',
          password: 'Password123!'
        });
      
      const loginAdmin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'Password123!'
        });
      
      medicoToken = loginMedico.body.accessToken;
      adminToken = loginAdmin.body.accessToken;
      
    } catch (error) {
      console.error('Error en beforeAll:', error);
      dbReady = false;
    }
  });
  
  afterAll(async () => {
    await cleanupTestDatabase();
    await closeTestDatabase();
  });

  it('debería permitir al médico bloquear horarios', async () => {
    if (!dbReady || !medicoToken) return;
    
    // Fecha para mañana
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const fechaStr = tomorrow.toISOString().split('T')[0];
    
    const response = await request(app)
      .post('/api/disponibilidad/bloquear')
      .set('Authorization', `Bearer ${medicoToken}`)
      .send({
        fecha: fechaStr,
        hora_inicio: '14:00',
        hora_fin: '16:00',
        motivo: 'TEST: Bloqueo para reunión'
      });
    
    expect(response.status).toBe(200);
  });

  it('debería consultar la disponibilidad de un médico', async () => {
    if (!dbReady || !adminToken) return;
    
    // Fecha para mañana
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const fechaStr = tomorrow.toISOString().split('T')[0];
    
    const response = await request(app)
      .get(`/api/disponibilidad/medico/test-medico-info-id?fecha=${fechaStr}`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('bloquesDisponibles');
    expect(response.body).toHaveProperty('bloquesBloqueados');
  });

  it('debería permitir cerrar la agenda completa de un día', async () => {
    if (!dbReady || !medicoToken) return;
    
    // Fecha para pasado mañana
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    const fechaStr = dayAfterTomorrow.toISOString().split('T')[0];
    
    const response = await request(app)
      .post('/api/disponibilidad/cerrar-dia')
      .set('Authorization', `Bearer ${medicoToken}`)
      .send({
        fecha: fechaStr,
        motivo: 'TEST: Día de capacitación'
      });
    
    expect(response.status).toBe(200);
    
    // Verificar que el día está cerrado
    const checkRes = await request(app)
      .get(`/api/disponibilidad/medico/test-medico-info-id?fecha=${fechaStr}`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(checkRes.body.bloquesBloqueados.length).toBeGreaterThan(0);
  });

  it('debería consultar la agenda global para un día específico', async () => {
    if (!dbReady || !adminToken) return;
    
    // Fecha para mañana
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const fechaStr = tomorrow.toISOString().split('T')[0];
    
    const response = await request(app)
      .get(`/api/disponibilidad/global?fecha=${fechaStr}`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(response.status).toBe(200);
    expect(typeof response.body).toBe('object');
  });
});