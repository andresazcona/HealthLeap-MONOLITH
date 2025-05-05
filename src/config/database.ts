import { Pool } from 'pg';
import config from './enviroment';
import logger from '../utils/logger';

// Configuración del pool de conexiones mejorada
const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: { 
    rejectUnauthorized: false  // Siempre usar SSL con rejectUnauthorized: false para Neon
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,  // Aumentar el timeout a 5 segundos
});

// Eventos para monitoreo de conexión
pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', { error: err.message });
});

pool.on('connect', () => {
  logger.debug('New database connection established');
});

// Verificar conexión a la base de datos con reintentos
const maxRetries = 3;
let retries = 0;

const testConnection = async () => {
  while (retries < maxRetries) {
    try {
      const client = await pool.connect();
      logger.info('Database connection established successfully');
      client.release();
      return;
    } catch (err: any) {
      retries++;
      logger.warn(`Failed to connect to database (attempt ${retries}/${maxRetries})`, { error: err.message });
      
      if (retries >= maxRetries) {
        logger.error('Database connection error - max retries reached', { error: err.message });
        // No hacemos process.exit(1) para permitir que el servidor inicie y reintente más tarde
        return;
      }
      
      // Esperar antes de reintentar (backoff exponencial)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
    }
  }
};

// Iniciar la verificación de conexión
testConnection();

// Helper para queries con reintentos
export const query = async (text: string, params?: any[], maxQueryRetries = 2) => {
  let queryRetries = 0;
  
  while (queryRetries < maxQueryRetries) {
    try {
      const client = await pool.connect();
      try {
        const result = await client.query(text, params);
        return result;
      } finally {
        client.release();
      }
    } catch (error: any) {
      queryRetries++;
      logger.warn(`Query failed (attempt ${queryRetries}/${maxQueryRetries})`, { 
        error: error.message, 
        query: text.substring(0, 100) + '...' 
      });
      
      if (queryRetries >= maxQueryRetries) {
        throw error;
      }
      
      // Esperar antes de reintentar
      await new Promise(resolve => setTimeout(resolve, 500 * queryRetries));
    }
  }
};

export default pool;