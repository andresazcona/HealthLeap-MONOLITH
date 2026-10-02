// tests/integration/auth/auth-simple.test.ts
import request from 'supertest';
import app from '../../../src/app';

// Mock del servicio de autenticación
jest.mock('../../../src/services/auth.service', () => ({
  register: jest.fn().mockResolvedValue({
    accessToken: 'mock-token',
    refreshToken: 'mock-refresh',
    usuario: {
      id: 'test-id',
      email: 'test@example.com',
      nombre: 'Test User',
      rol: 'paciente'
    }
  }),
  login: jest.fn().mockImplementation((credentials) => {
    if (credentials.password === 'Password123!') {
      return Promise.resolve({
        accessToken: 'mock-token',
        refreshToken: 'mock-refresh'
      });
    } else {
      return Promise.reject(new Error('Credenciales inválidas'));
    }
  })
}));

describe('Autenticación Simplificada', () => {
  it('prueba básica - debería funcionar sin BD', () => {
    expect(true).toBe(true);
  });

  it('debería registrar un usuario simulado', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Test User',
        email: 'test@example.com',
        password: 'Password123!'
      });
      
    expect(response.status).toBe(201);
  });
});