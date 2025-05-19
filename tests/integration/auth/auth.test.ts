// tests/integration/auth/auth.test.ts
import request from 'supertest';
import app from '../../../src/app';
import { setupTestDatabase, cleanupTestDatabase } from '../config/test-db';

describe('Autenticación', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });
  
  afterAll(async () => {
    await cleanupTestDatabase();
  });

  it('debería registrar un nuevo usuario', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Usuario Registro Test',
        email: 'registro@test.com',
        password: 'Password123!',
        telefono: '1234567890'
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
    expect(response.body.usuario.email).toBe('registro@test.com');
  });

  it('debería iniciar sesión con credenciales válidas', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'paciente@test.com',
        password: 'Password123!'
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
  });

  it('debería rechazar login con credenciales inválidas', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'paciente@test.com',
        password: 'contraseniaIncorrecta'
      });
    
    expect(response.status).toBe(401);
  });

  it('debería refrescar el token de acceso', async () => {
    // Primero login para obtener refresh token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'paciente@test.com',
        password: 'Password123!'
      });
    
    const refreshToken = loginRes.body.refreshToken;
    
    const response = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('accessToken');
  });

  it('debería validar un token JWT', async () => {
    // Primero login para obtener token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'paciente@test.com',
        password: 'Password123!'
      });
    
    const token = loginRes.body.accessToken;
    
    const response = await request(app)
      .get('/api/auth/validar')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('email');
  });
});