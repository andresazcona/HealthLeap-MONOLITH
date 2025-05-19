// tests/integration/config/test-db.ts
import { Pool } from 'pg';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import { exec } from 'child_process';

// Cargar variables de entorno específicas para pruebas
dotenv.config({ 
  path: path.resolve(__dirname, '../../../.env.test') 
});

// Obtener URL de conexión
const connectionString = process.env.DATABASE_URL || 
  'postgresql://postgres:postgres@localhost:5432/healthleap_test';

console.log('🔄 Conexión a BD de pruebas:', connectionString.split('@')[1]);

// Crear pool de conexiones para pruebas
const testPool = new Pool({
  connectionString,
  // Configuración para entorno de pruebas
  max: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000
});

// Inicializar esquema completo (llamar antes de todas las pruebas)
export async function initializeTestDatabase() {
  console.log('🔄 Inicializando base de datos de pruebas...');
  try {
    const scriptPath = path.resolve(__dirname, '../../../scripts/init-test-db.sql');
    
    if (!fs.existsSync(scriptPath)) {
      console.error('❌ Script de inicialización no encontrado:', scriptPath);
      return false;
    }
    
    // Extraer credenciales
    const dbParts = connectionString.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (!dbParts) {
      console.error('❌ Formato de DATABASE_URL incorrecto');
      return false;
    }
    
    const [_, user, password, host, port, dbName] = dbParts;
    
    return new Promise((resolve) => {
      // Set environment variables for PGPASSWORD to avoid prompt
      const env = { ...process.env, PGPASSWORD: password };
      
      exec(`psql -U ${user} -h ${host} -p ${port} -d ${dbName} -f "${scriptPath}"`, 
        { env },
        (error, _stdout, stderr) => {
          if (error) {
            console.error('❌ Error inicializando BD:', error.message);
            console.error(stderr);
            resolve(false);
          } else {
            console.log('✅ Base de datos inicializada correctamente');
            resolve(true);
          }
        }
      );
    });
  } catch (error) {
    console.error('❌ Error en initializeTestDatabase:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

// Verificar conexión a la base de datos
export async function verifyConnection() {
  try {
    const result = await testPool.query('SELECT NOW() as current_time');
    console.log('✅ Conexión a BD exitosa:', result.rows[0].current_time);
    return true;
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

// Preparar datos para una suite de pruebas
export async function setupTestDatabase() {
  try {
    // Verificar si las tablas existen
    const result = await testPool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'usuarios'
      );
    `);
    
    if (!result.rows[0].exists) {
      console.log('⚠️ Las tablas no existen - ejecutando inicialización');
      await initializeTestDatabase();
    }
    
    // Limpiar solo datos marcados como de prueba
    await testPool.query("DELETE FROM citas WHERE motivo LIKE 'TEST:%'");
    await testPool.query("DELETE FROM usuarios WHERE email LIKE '%@test.com' AND email NOT IN ('admin@test.com', 'paciente@test.com', 'medico@test.com')");
    
    // Verificar datos de usuarios de prueba predefinidos
    const usersExist = await testPool.query(`
      SELECT COUNT(*) FROM usuarios 
      WHERE email IN ('admin@test.com', 'paciente@test.com', 'medico@test.com')
    `);
    
    // Si no hay usuarios base de prueba, insertar
    if (parseInt(usersExist.rows[0].count) < 3) {
      console.log('🔄 Insertando datos base para pruebas');
      await testPool.query(`
        INSERT INTO usuarios (id, nombre, email, password_hash, rol)
        VALUES 
          ('test-admin-id', 'Admin Test', 'admin@test.com', '$2b$10$uM8i1gDzeSKwn1dxnQ22muL4JAOLVpq9xL2SHHSUGYtSGggIMT2eO', 'admin'),
          ('test-paciente-id', 'Paciente Test', 'paciente@test.com', '$2b$10$uM8i1gDzeSKwn1dxnQ22muL4JAOLVpq9xL2SHHSUGYtSGggIMT2eO', 'paciente'),
          ('test-medico-id', 'Médico Test', 'medico@test.com', '$2b$10$uM8i1gDzeSKwn1dxnQ22muL4JAOLVpq9xL2SHHSUGYtSGggIMT2eO', 'medico')
        ON CONFLICT (id) DO NOTHING;
      `);
      
      await testPool.query(`
        INSERT INTO medicos (id, usuario_id, especialidad)
        VALUES ('test-medico-info-id', 'test-medico-id', 'Cardiología')
        ON CONFLICT (id) DO NOTHING;
      `);
    }
    
    console.log('✅ Base de datos preparada para pruebas');
    return true;
  } catch (error) {
    console.error('❌ Error en setupTestDatabase:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

// Limpieza después de pruebas
export async function cleanupTestDatabase() {
  try {
    // Eliminar solo datos de prueba
    await testPool.query("DELETE FROM citas WHERE motivo LIKE 'TEST:%'");
    await testPool.query("DELETE FROM usuarios WHERE email LIKE 'temp-%@test.com'");
    console.log('✅ Datos de prueba limpiados');
  } catch (error) {
    console.error('❌ Error en cleanupTestDatabase:', error instanceof Error ? error.message : String(error));
  }
}

// Cerrar conexiones
export async function closeTestDatabase() {
  try {
    await testPool.end();
    console.log('✅ Conexiones a base de datos cerradas');
  } catch (error) {
    console.error('❌ Error al cerrar conexiones:', error instanceof Error ? error.message : String(error));
  }
}

export default testPool;