// src/routes/health.route.ts
import { Router } from 'express';
import { Pool } from 'pg';
import config from '../config/enviroment';

const router = Router();
const pool = new Pool({ connectionString: config.databaseUrl });

router.get('/', async (_req, res) => {
  try {
    // Verificar conexión a BD
    const result = await pool.query('SELECT NOW()');
    
    res.status(200).json({
      status: 'ok',
      database: 'connected',
      timestamp: result.rows[0].now,
      environment: process.env.NODE_ENV
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: errorMessage,
      environment: process.env.NODE_ENV
    });
  }
});

export default router;