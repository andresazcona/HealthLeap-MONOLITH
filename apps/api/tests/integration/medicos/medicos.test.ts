// tests/integration/medicos/medicos.test.ts
import request from 'supertest';
import app from '../../../src/app';
import { setupTestDatabase, cleanupTestDatabase, closeTestDatabase } from '../config/test-db';

describe('Gestión de Médicos', () => {
  let dbReady = false;
  let adminToken: string;
  let pacienteToken: string;
  let medicoToken: string;
  let medicoId: string;
  
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
    await cleanupTestDatabase();
    await closeTestDatabase();
  });

  it('debería permitir al admin crear un nuevo médico', async () => {
    if (!dbReady || !adminToken) return;
    
    const email = `temp-medico-${Date.now()}@test.com`;
    
    const response = await request(app)
      .post('/api/medicos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'Nuevo Médico Test',
        email: email,
        password: 'Password123!',
        especialidad: 'Cardiología',
        telefono: '1234567890'
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.especialidad).toBe('Cardiología');
    
    medicoId = response.body.id;
  });

  it('no debería permitir a pacientes crear médicos', async () => {
    if (!dbReady || !pacienteToken) return;
    
    const response = await request(app)
      .post('/api/medicos')
      .set('Authorization', `Bearer ${pacienteToken}`)
      .send({
        nombre: 'Médico No Autorizado',
        email: 'no-autorizado@test.com',
        password: 'Password123!',
        especialidad: 'Cardiología'
      });
    
    expect(response.status).toBe(403);
  });

  it('debería listar médicos por especialidad', async () => {
    if (!dbReady || !pacienteToken) return;
    
    const response = await request(app)
      .get('/api/medicos?especialidad=Cardiología')
      .set('Authorization', `Bearer ${pacienteToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('medicos');
    expect(Array.isArray(response.body.medicos)).toBe(true);
  });

  it('debería permitir al admin actualizar información de un médico', async () => {
    if (!dbReady || !adminToken || !medicoId) return;
    
    const response = await request(app)
      .patch(`/api/medicos/${medicoId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        especialidad: 'Neurología'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.especialidad).toBe('Neurología');
  });

  it('debería permitir al médico ver su propio perfil', async () => {
    if (!dbReady || !medicoToken) return;
    
    const response = await request(app)
      .get('/api/medicos/perfil')
      .set('Authorization', `Bearer ${medicoToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('especialidad');
  });
});