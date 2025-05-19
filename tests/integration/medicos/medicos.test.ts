// tests/integration/medicos/medicos.test.ts
import request from 'supertest';
import app from '../../../src/app';
import { setupTestDatabase, cleanupTestDatabase } from '../config/test-db';

describe('Gestión de Médicos', () => {
  let adminToken: string;
  let medicoToken: string;
  let pacienteToken: string;
  
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
    
    const pacienteRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'paciente@test.com', password: 'Password123!' });
    pacienteToken = pacienteRes.body.accessToken;
  });
  
  afterAll(async () => {
    await cleanupTestDatabase();
  });

  it('debería permitir al admin crear un nuevo médico', async () => {
    const response = await request(app)
      .post('/api/medicos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'Dr. Nuevo Test',
        email: 'nuevodoctor@test.com',
        password: 'Doctor123!',
        especialidad: 'Cardiología',
        telefono: '1234567890',
        horario_inicio: '09:00',
        horario_fin: '18:00'
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.especialidad).toBe('Cardiología');
  });

  it('no debería permitir a pacientes crear médicos', async () => {
    const response = await request(app)
      .post('/api/medicos')
      .set('Authorization', `Bearer ${pacienteToken}`)
      .send({
        nombre: 'Dr. No Debería Crearse',
        email: 'nocreado@test.com',
        password: 'Doctor123!',
        especialidad: 'Cardiología'
      });
    
    expect(response.status).toBe(403);
  });

  it('debería listar médicos por especialidad', async () => {
    const response = await request(app)
      .get('/api/medicos?especialidad=Medicina General')
      .set('Authorization', `Bearer ${pacienteToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('medicos');
    expect(Array.isArray(response.body.medicos)).toBe(true);
  });

  it('debería permitir al admin actualizar información de un médico', async () => {
    const response = await request(app)
      .put('/api/medicos/test-medico-id')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        especialidad: 'Neurología',
        horario_inicio: '10:00',
        horario_fin: '19:00'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.especialidad).toBe('Neurología');
  });

  it('debería permitir al médico ver su propio perfil', async () => {
    const response = await request(app)
      .get('/api/medicos/perfil')
      .set('Authorization', `Bearer ${medicoToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('especialidad');
  });
});