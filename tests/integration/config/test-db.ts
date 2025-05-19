// tests/integration/config/test-db.ts
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const testPool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export async function setupTestDatabase() {
  // Limpia solo datos de prueba
  await testPool.query("DELETE FROM citas WHERE motivo LIKE 'TEST:%'");
  await testPool.query("DELETE FROM usuarios WHERE email LIKE '%@test.com'");
  
  // Inserta datos mínimos para pruebas
  try {
    await testPool.query(`
      INSERT INTO usuarios (id, nombre, email, password_hash, rol)
      VALUES 
        ('test-admin-id', 'Admin Test', 'admin@test.com', '$2b$10$uM8i1gDzeSKwn1dxnQ22muL4JAOLVpq9xL2SHHSUGYtSGggIMT2eO', 'admin'),
        ('test-paciente-id', 'Paciente Test', 'paciente@test.com', '$2b$10$uM8i1gDzeSKwn1dxnQ22muL4JAOLVpq9xL2SHHSUGYtSGggIMT2eO', 'paciente'),
        ('test-medico-id', 'Médico Test', 'medico@test.com', '$2b$10$uM8i1gDzeSKwn1dxnQ22muL4JAOLVpq9xL2SHHSUGYtSGggIMT2eO', 'medico')
      ON CONFLICT (email) DO NOTHING;
      
      INSERT INTO medicos (id, usuario_id, especialidad, horario_inicio, horario_fin)
      VALUES ('test-medico-id', 'test-medico-id', 'Medicina General', '08:00:00', '17:00:00')
      ON CONFLICT (id) DO NOTHING;
    `);
  } catch (error) {
    console.error('Error en setup de BD de prueba:', error);
  }
}

export async function cleanupTestDatabase() {
  await testPool.query("DELETE FROM citas WHERE motivo LIKE 'TEST:%'");
  await testPool.query("DELETE FROM usuarios WHERE email LIKE '%@test.com'");
}

export default testPool;