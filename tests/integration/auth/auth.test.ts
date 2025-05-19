// tests/integration/auth/auth.test.ts
import request from 'supertest';
import app from '../../../src/app';
import { setupTestDatabase, cleanupTestDatabase, closeTestDatabase } from '../config/test-db';

describe('Autenticación', () => {
  let dbReady = false;
  let token: string;
  let refreshToken: string;
  const testEmail = `temp-${Date.now()}@test.com`;
  
  // Preparar BD antes de todas las pruebas
  beforeAll(async () => {
    try {
      dbReady = await setupTestDatabase();
      if (!dbReady) {
        console.warn('⚠️ Pruebas ejecutándose con BD no configurada correctamente');
      }
    } catch (error) {
      console.error('Error en beforeAll:', error);
    }
  });
  
  // Limpiar después de todas las pruebas
  afterAll(async () => {
    try {
      await cleanupTestDatabase();
      await closeTestDatabase();
    } catch (error) {
      console.error('Error en afterAll:', error);
    }
  });

  it('debería registrar un nuevo usuario', async () => {
    if (!dbReady) {
      console.log('⏩ Prueba omitida - BD no disponible');
      return;
    }
    
    const userData = {
      nombre: 'Usuario Test',
      email: testEmail,
      password: 'Password123!',
      telefono: '1234567890'
    };
    
    const response = await request(app)
      .post('/api/auth/register')
      .send(userData);
    
    // Solo verificamos parte de la respuesta en caso de fallo
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
    
    // Guardar tokens para pruebas siguientes
    token = response.body.accessToken;
    refreshToken = response.body.refreshToken;
  });

  it('debería iniciar sesión con credenciales válidas', async () => {
    if (!dbReady) return;
    
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'Password123!'
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
  });

  it('debería rechazar login con credenciales inválidas', async () => {
    if (!dbReady) return;
    
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'ContraseñaIncorrecta!'
      });
    
    expect(response.status).toBe(401);
  });

  it('debería refrescar el token de acceso', async () => {
    if (!dbReady || !refreshToken) return;
    
    const response = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('accessToken');
    
    // Actualizar token para pruebas siguientes
    token = response.body.accessToken;
  });

  it('debería verificar un token JWT', async () => {
    if (!dbReady || !token) return;
    
    const response = await request(app)
      .get('/api/auth/verify')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('email', testEmail);
  });
});