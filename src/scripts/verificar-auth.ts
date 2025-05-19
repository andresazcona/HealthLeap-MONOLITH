import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Configura la conexión (ajusta según tu configuración)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/healthleap'
});

// Usuarios de prueba a verificar
const USUARIOS_TEST = [
  { email: 'admin@test.com', password: 'Password123!' },
  { email: 'medico@test.com', password: 'Password123!' },
  { email: 'paciente@test.com', password: 'Password123!' },
];

// Función para establecer un hash de contraseña manualmente (si es necesario)
async function establecerPasswordManual(email: string, passwordPlano: string) {
  const passwordHash = await bcrypt.hash(passwordPlano, 10);
  console.log(`\n🔧 Estableciendo contraseña para ${email}`);
  console.log(`Hash generado: ${passwordHash}`);
  
  try {
    const result = await pool.query(
      'UPDATE usuarios SET password_hash = $1 WHERE email = $2 RETURNING *',
      [passwordHash, email]
    );
    
    if (result.rowCount && result.rowCount > 0) {
      console.log('✅ Contraseña actualizada correctamente');
    } else {
      console.log('❌ No se encontró el usuario');
    }
  } catch (error) {
    console.error('Error al actualizar la contraseña:', error);
  }
}

// Función para verificar autenticación
async function verificarAutenticacion(email: string, passwordPlano: string) {
  console.log(`\n🔍 Verificando autenticación para: ${email}`);

  try {
    // 1. Obtener usuario y hash de la BD
    const userResult = await pool.query(
      'SELECT id, email, password_hash, rol FROM usuarios WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      console.log('❌ Usuario no encontrado en la base de datos');
      return false;
    }

    const usuario = userResult.rows[0];
    console.log(`Usuario encontrado: ID ${usuario.id}, rol: ${usuario.rol}`);
    
    // 2. Mostrar hash almacenado
    console.log(`Hash almacenado: ${usuario.password_hash}`);
    
    // 3. Verificar formato del hash
    const isBcryptHash = usuario.password_hash.startsWith('$2a$') || 
                         usuario.password_hash.startsWith('$2b$') ||
                         usuario.password_hash.startsWith('$2y$');
    
    console.log(`¿Es formato bcrypt válido?: ${isBcryptHash ? 'SÍ ✅' : 'NO ❌'}`);
    
    // 4. Intentar verificar la contraseña
    console.log(`Intentando verificar: "${passwordPlano}" contra el hash almacenado...`);
    const passwordValida = await bcrypt.compare(passwordPlano, usuario.password_hash);
    
    if (passwordValida) {
      console.log('✅ LA CONTRASEÑA ES VÁLIDA - Autenticación exitosa');
    } else {
      console.log('❌ LA CONTRASEÑA ES INVÁLIDA - Autenticación fallida');
    }
    
    return passwordValida;
  } catch (error) {
    console.error('Error durante la verificación:', error);
    return false;
  }
}

// Programa principal
async function main() {
  console.log('🔐 VERIFICADOR DE AUTENTICACIÓN DE USUARIOS 🔐');
  console.log('=============================================');

  let usuariosValidos = 0;
  
  // Verificar cada usuario de prueba
  for (const usuario of USUARIOS_TEST) {
    const esValido = await verificarAutenticacion(usuario.email, usuario.password);
    if (esValido) usuariosValidos++;
    
    // Opción para regenerar contraseña si falla
    if (!esValido) {
      const resetear = process.argv.includes('--reset');
      if (resetear) {
        await establecerPasswordManual(usuario.email, usuario.password);
        // Verificar de nuevo tras resetear
        console.log('\n🔄 Verificando nuevamente tras resetear contraseña:');
        await verificarAutenticacion(usuario.email, usuario.password);
      }
    }
  }
  
  // Resumen final
  console.log('\n📊 RESUMEN:');
  console.log(`Usuarios verificados: ${USUARIOS_TEST.length}`);
  console.log(`Autenticaciones exitosas: ${usuariosValidos}`);
  console.log(`Autenticaciones fallidas: ${USUARIOS_TEST.length - usuariosValidos}`);
  
  if (usuariosValidos < USUARIOS_TEST.length) {
    console.log('\n💡 SUGERENCIA: Ejecuta este script con el parámetro --reset para regenerar las contraseñas:');
    console.log('npx ts-node src/scripts/verificar-auth.ts --reset');
  }
}

// Ejecutar el programa y cerrar la conexión al finalizar
main()
  .then(() => {
    console.log('\n✅ Verificación completa');
    pool.end();
  })
  .catch(err => {
    console.error('\n❌ Error en el script:', err);
    pool.end();
    process.exit(1);
  });