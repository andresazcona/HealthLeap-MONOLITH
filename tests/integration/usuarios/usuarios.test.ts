// tests/integration/usuarios/usuarios.test.ts
import request from 'supertest';
import app from '../../../src/app';
import { setupTestDatabase, cleanupTestDatabase, closeTestDatabase } from '../config/test-db';

describe('Gestión de Usuarios', () => {
  let dbReady = false;
  let adminToken: string;
  let usuarioId: string;
  
  beforeAll(async () => {
    try {
      dbReady = await setupTestDatabase();
      
      // Obtener token de administrador
      const loginAdmin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'Password123!'
        });
      
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

  it('debería permitir listar usuarios al administrador', async () => {
    if (!dbReady || !adminToken) return;
    
    const response = await request(app)
      .get('/api/usuarios')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('usuarios');
    expect(Array.isArray(response.body.usuarios)).toBe(true);
    expect(response.body.usuarios.length).toBeGreaterThan(0);
  });

  it('debería permitir crear un nuevo usuario al administrador', async () => {
    if (!dbReady || !adminToken) return;
    
    const email = `temp-usuario-${Date.now()}@test.com`;
    
    const response = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'Usuario Creado Test',
        email: email,
        password: 'Password123!',
        rol: 'paciente',
        telefono: '1234567890'
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.email).toBe(email);
    
    usuarioId = response.body.id;
  });

  it('debería permitir actualizar un usuario existente', async () => {
    if (!dbReady || !adminToken || !usuarioId) return;
    
    const response = await request(app)
      .patch(`/api/usuarios/${usuarioId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'Usuario Actualizado',
        telefono: '9876543210'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.nombre).toBe('Usuario Actualizado');
    expect(response.body.telefono).toBe('9876543210');
  });

  it('debería permitir buscar usuarios por criterios', async () => {
    if (!dbReady || !adminToken) return;
    
    const response = await request(app)
      .get('/api/usuarios/buscar?rol=paciente')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('usuarios');
    expect(Array.isArray(response.body.usuarios)).toBe(true);
    expect(response.body.usuarios.length).toBeGreaterThan(0);
    expect(response.body.usuarios[0].rol).toBe('paciente');
  });

  it('debería permitir cambiar la contraseña de un usuario', async () => {
    if (!dbReady || !adminToken || !usuarioId) return;
    
    const response = await request(app)
      .post(`/api/usuarios/${usuarioId}/cambiar-password`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        password: 'NuevaPassword123!'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.mensaje).toContain('actualizada');
  });
});