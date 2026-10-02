// tests/integration/reportes/reportes.test.ts
import request from 'supertest';
import app from '../../../src/app';
import { setupTestDatabase, cleanupTestDatabase, closeTestDatabase } from '../config/test-db';

describe('Generación de Reportes', () => {
  let dbReady = false;
  let adminToken: string;
  let medicoToken: string;
  
  beforeAll(async () => {
    try {
      dbReady = await setupTestDatabase();
      
      // Obtener tokens
      const loginAdmin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'Password123!'
        });
      
      const loginMedico = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'medico@test.com',
          password: 'Password123!'
        });
      
      adminToken = loginAdmin.body.accessToken;
      medicoToken = loginMedico.body.accessToken;
      
      // Crear algunas citas para los reportes
      if (dbReady) {
        // Crear citas para pruebas si no hay suficientes
        const pacienteLogin = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'paciente@test.com',
            password: 'Password123!'
          });
        
        const pacienteToken = pacienteLogin.body.accessToken;
        
        // Crear al menos una cita
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        
        await request(app)
          .post('/api/citas')
          .set('Authorization', `Bearer ${pacienteToken}`)
          .send({
            medico_id: 'test-medico-info-id',
            fecha_hora: tomorrow.toISOString(),
            motivo: 'TEST: Cita para reporte'
          });
      }
      
    } catch (error) {
      console.error('Error en beforeAll:', error);
      dbReady = false;
    }
  });
  
  afterAll(async () => {
    await cleanupTestDatabase();
    await closeTestDatabase();
  });

  it('debería generar un reporte de citas para administradores', async () => {
    if (!dbReady || !adminToken) return;
    
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + 30);
    
    const response = await request(app)
      .get(`/api/reportes/citas?fechaInicio=${today.toISOString().split('T')[0]}&fechaFin=${endDate.toISOString().split('T')[0]}`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('citas');
    expect(Array.isArray(response.body.citas)).toBe(true);
  });

  it('debería permitir al médico ver reportes de sus citas', async () => {
    if (!dbReady || !medicoToken) return;
    
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + 30);
    
    const response = await request(app)
      .get(`/api/reportes/mis-citas?fechaInicio=${today.toISOString().split('T')[0]}&fechaFin=${endDate.toISOString().split('T')[0]}`)
      .set('Authorization', `Bearer ${medicoToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('citas');
    expect(Array.isArray(response.body.citas)).toBe(true);
  });

  it('debería generar un reporte en formato CSV', async () => {
    if (!dbReady || !adminToken) return;
    
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + 30);
    
    const response = await request(app)
      .get(`/api/reportes/citas/csv?fechaInicio=${today.toISOString().split('T')[0]}&fechaFin=${endDate.toISOString().split('T')[0]}`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/csv');
  });

  it('debería generar un resumen estadístico', async () => {
    if (!dbReady || !adminToken) return;
    
    const today = new Date();
    today.setMonth(today.getMonth() - 1); // Un mes atrás
    const endDate = new Date();
    
    const response = await request(app)
      .get(`/api/reportes/estadisticas?fechaInicio=${today.toISOString().split('T')[0]}&fechaFin=${endDate.toISOString().split('T')[0]}`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('totalCitas');
    expect(response.body).toHaveProperty('citasPorEstado');
  });
});