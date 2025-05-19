// tests/integration/reportes/reportes.test.ts
import request from 'supertest';
import app from '../../../src/app';
import { setupTestDatabase, cleanupTestDatabase } from '../config/test-db';
import fs from 'fs';

describe('Generación de Reportes', () => {
  let adminToken: string;
  let medicoToken: string;
  
  beforeAll(async () => {
    await setupTestDatabase();
    
    // Obtener tokens
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'Password123!' });
    adminToken = adminRes.body.accessToken;
    
    const medicoRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'medico@test.com', password: 'Password123!' });
    medicoToken = medicoRes.body.accessToken;
    
    // Crear algunas citas para reportes
    await request(app)
      .post('/api/citas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        medico_id: 'test-medico-id',
        paciente_id: 'test-paciente-id',
        fecha_hora: new Date().toISOString(),
        motivo: 'TEST: Cita para reporte 1'
      });
    
    await request(app)
      .post('/api/citas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        medico_id: 'test-medico-id',
        paciente_id: 'test-paciente-id',
        fecha_hora: new Date().toISOString(),
        motivo: 'TEST: Cita para reporte 2'
      });
  });
  
  afterAll(async () => {
    await cleanupTestDatabase();
  });

  it('debería generar un reporte de citas para administradores', async () => {
    const mesActual = new Date().getMonth() + 1;
    const anioActual = new Date().getFullYear();
    
    const response = await request(app)
      .get(`/api/reportes/citas?mes=${mesActual}&anio=${anioActual}`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('debería permitir al médico ver reportes de sus citas', async () => {
    const mesActual = new Date().getMonth() + 1;
    const anioActual = new Date().getFullYear();
    
    const response = await request(app)
      .get(`/api/reportes/mis-citas?mes=${mesActual}&anio=${anioActual}`)
      .set('Authorization', `Bearer ${medicoToken}`);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('debería generar un reporte en formato CSV', async () => {
    const mesActual = new Date().getMonth() + 1;
    const anioActual = new Date().getFullYear();
    
    const response = await request(app)
      .get(`/api/reportes/descargar?mes=${mesActual}&anio=${anioActual}&formato=csv`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/csv');
    
    // Verificar que el contenido tenga estructura de CSV
    expect(response.text).toContain(',');
    expect(response.text.split('\n').length).toBeGreaterThan(1);
  });

  it('debería generar un resumen estadístico', async () => {
    const response = await request(app)
      .get('/api/reportes/resumen')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('total');
    expect(response.body).toHaveProperty('porEspecialidad');
  });
});