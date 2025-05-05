import dotenv from 'dotenv';
import { Pool, Client } from 'pg';
import dns from 'dns';
import { promisify } from 'util';


// Cargar variables de entorno
dotenv.config();

// Función para registrar mensajes
const log = (message: string, type: 'info' | 'error' | 'success' | 'warn' = 'info') => {
  const prefix = {
    info: '\x1b[36m[INFO]\x1b[0m',    // Cyan
    error: '\x1b[31m[ERROR]\x1b[0m',  // Red
    success: '\x1b[32m[SUCCESS]\x1b[0m', // Green
    warn: '\x1b[33m[WARN]\x1b[0m'     // Yellow
  };
  console.log(`${prefix[type]} ${message}`);
};

// Función para analizar una URL de conexión
const parseConnectionString = (connectionString: string) => {
  try {
    const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):?(\d*)\/([^?]+)/;
    const match = connectionString.match(regex);
    
    if (!match) {
      throw new Error('URL de conexión no válida');
    }
    
    const [, user, password, host, port = '5432', database] = match;
    
    // Extraer parámetros adicionales
    const paramsMatch = connectionString.match(/\?(.+)$/);
    const paramsString = paramsMatch ? paramsMatch[1] : '';
    const params: Record<string, string> = {};
    
    if (paramsString) {
      paramsString.split('&').forEach(param => {
        const [key, value] = param.split('=');
        params[key] = value;
      });
    }
    
    return {
      user,
      password: password.substring(0, 3) + '...',  // Mostrar solo parte de la contraseña
      host,
      port,
      database,
      params
    };
  } catch (error) {
    return null;
  }
};

// Prueba de conexión con detalles
const testConnection = async () => {
  log('Iniciando diagnóstico de conexión a la base de datos...');
  log(`Fecha y hora actual: ${new Date().toLocaleString()}`);
  
  // Verificar variable de entorno
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    log('La variable DATABASE_URL no está definida en el archivo .env', 'error');
    log('Asegúrate de que tu archivo .env contiene: DATABASE_URL=postgresql://usuario:contraseña@host:puerto/basedatos', 'info');
    return;
  }
  
  // Analizar la URL de conexión
  const connectionDetails = parseConnectionString(connectionString);
  if (!connectionDetails) {
    log('No se pudo analizar la URL de conexión. Verifica que tenga el formato correcto:', 'error');
    log('postgresql://usuario:contraseña@host:puerto/basedatos', 'info');
    return;
  }
  
  log('Detalles de conexión:');
  log(`- Usuario: ${connectionDetails.user}`);
  log(`- Contraseña: ${connectionDetails.password}`);
  log(`- Host: ${connectionDetails.host}`);
  log(`- Puerto: ${connectionDetails.port}`);
  log(`- Base de datos: ${connectionDetails.database}`);
  
  if (connectionDetails.params.sslmode) {
    log(`- SSL Mode: ${connectionDetails.params.sslmode}`);
  }
  
  // Verificar DNS del host
  log('\nVerificando resolución DNS del host...');
  try {
    const lookup = promisify(dns.lookup);
    const { address } = await lookup(connectionDetails.host);
    log(`Host ${connectionDetails.host} resuelve a IP ${address}`, 'success');
  } catch (error: any) {
    log(`No se pudo resolver el host: ${error.message}`, 'error');
    log('Verifica tu conexión a Internet o si el nombre del host es correcto', 'info');
  }
  
  // Probar conexión sin SSL
  log('\nProbando conexión sin SSL...');
  try {
    const clientNoSSL = new Client({
      connectionString,
      ssl: false,
      connectionTimeoutMillis: 5000
    });
    
    await clientNoSSL.connect();
    log('Conexión sin SSL exitosa', 'success');
    await clientNoSSL.end();
  } catch (error: any) {
    log(`Conexión sin SSL falló: ${error.message}`, 'error');
    
    if (error.message.includes('SSL')) {
      log('El servidor requiere SSL. Intentando con SSL...', 'info');
    }
  }
  
  // Probar conexión con SSL
  log('\nProbando conexión con SSL (rejectUnauthorized: false)...');
  try {
    const clientWithSSL = new Client({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 5000
    });
    
    await clientWithSSL.connect();
    log('Conexión con SSL exitosa', 'success');
    
    // Verificar versión de PostgreSQL
    const result = await clientWithSSL.query('SELECT version()');
    log(`Versión de PostgreSQL: ${result.rows[0].version}`, 'info');
    
    await clientWithSSL.end();
  } catch (error: any) {
    log(`Conexión con SSL falló: ${error.message}`, 'error');
  }
  
  // Probar una conexión usando Pool (como en la aplicación)
  log('\nProbando conexión usando Pool (como en la aplicación)...');
  try {
    const pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      max: 1,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000
    });
    
    const client = await pool.connect();
    log('Conexión a través de Pool exitosa', 'success');
    client.release();
    await pool.end();
  } catch (error: any) {
    log(`Conexión a través de Pool falló: ${error.message}`, 'error');
  }
  
  // Verificar si es Neon PostgreSQL
  if (connectionDetails.host.includes('neon.tech')) {
    log('\nDetectada base de datos en Neon PostgreSQL', 'info');
    log('Consejos para Neon PostgreSQL:', 'info');
    log('1. Asegúrate de que tu proyecto y rama están activos (no en modo inactivo)', 'info');
    log('2. Verifica tus límites de conexión en el plan gratuito', 'info');
    log('3. La conexión podría tardar más en establecerse la primera vez', 'info');
    log('4. Siempre usa SSL con rejectUnauthorized: false', 'info');
  }
  
  log('\nDiagnóstico finalizado. Recomendaciones:', 'info');
  log('1. Si hay problemas de timeout, aumenta connectionTimeoutMillis en la configuración', 'info');
  log('2. Si hay errores SSL, asegúrate de usar { ssl: { rejectUnauthorized: false } }', 'info');
  log('3. Verifica las credenciales y permisos de usuario en la base de datos', 'info');
  log('4. Para bases de datos en la nube, verifica el estado de servicio y restricciones de IP', 'info');
};

// Ejecutar prueba
testConnection().catch(error => {
  log(`Error inesperado: ${error.message}`, 'error');
});