// tests/integration/disponibilidad/disponibilidad.test.ts
import request from 'supertest';
import app from '../../../src/app';
import { setupTestDatabase, cleanupTestDatabase } from '../config/test-db';

describe('Gestión de Disponibilidad', () => {
  let medicoToken: string;
  let adminToken: string;
  
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
  });
  
  afterAll(async () => {
    await cleanupTestDatabase();
  });

  // Formato de fecha para mañana
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  it('debería permitir al médico bloquear horarios', async () => {
    const response = await request(app)
      .post('/api/disponibilidad/bloquear')
      .set('Authorization', `Bearer ${medicoToken}`)
      .send({
        medico_id: 'test-medico-id',
        fecha: tomorrowStr,
        bloques_bloqueados: [
          {
            inicio: `${tomorrowStr}T11:00:00`,
            fin: `${tomorrowStr}T12:00:00`
          }
        ]
      });
    
    expect(response.status).toBe(200);
  });

  it('debería consultar la disponibilidad de un médico', async () => {
    const response = await request(app)
      .get(`/api/disponibilidad/test-medico-id/${tomorrowStr}`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('bloquesDisponibles');
    expect(response.body).toHaveProperty('bloquesBloqueados');
  });

  it('debería permitir cerrar la agenda completa de un día', async () => {
    // Selecciona un día futuro para hacer pruebas
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];
    
    const response = await request(app)
      .post('/api/disponibilidad/cerrar')
      .set('Authorization', `Bearer ${medicoToken}`)
      .send({
        medico_id: 'test-medico-id',
        fecha: nextWeekStr
      });
    
    expect(response.status).toBe(200);
    
    // Verificar que el día está cerrado
    const checkRes = await request(app)
      .get(`/api/disponibilidad/test-medico-id/${nextWeekStr}`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(checkRes.status).toBe(200);
    expect(checkRes.body.bloquesDisponibles.length).toBe(0);
  });

  it('debería consultar la agenda global para un día específico', async () => {
    const response = await request(app)
      .get(`/api/disponibilidad/agenda/${tomorrowStr}`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(response.status).toBe(200);
    expect(typeof response.body).toBe('object');
  });
});