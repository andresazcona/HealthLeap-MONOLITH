import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { setupSocketHandlers } from './realtime/socket-handler';
import { sensitiveRateLimit } from './middlewares/rateLimiter';
import errorHandler from './middlewares/errorHandler';

// Importar rutas
import authRoutes from './routes/auth.routes';
import usuarioRoutes from './routes/usuario.routes';
import medicoRoutes from './routes/medico.routes';
import admisionRoutes from './routes/admision.routes';
import citaRoutes from './routes/cita.routes';
import notificationRoutes from './routes/notification.routes';
import disponibilidadRoutes from './routes/disponibilidad.routes';
import reporteRoutes from './routes/reporte.routes';
import healthRoutes from './routes/health.route';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
});

// Configurar WebSockets
setupSocketHandlers(io);

// Middlewares globales
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Aplicar rate limit a rutas sensibles
app.use('/api/auth/login', sensitiveRateLimit);
app.use('/api/auth/register', sensitiveRateLimit);

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/medicos', medicoRoutes);
app.use('/api/admision', admisionRoutes);
app.use('/api/citas', citaRoutes);
app.use('/api/notify', notificationRoutes);
app.use('/api/disponibilidad', disponibilidadRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/health', healthRoutes);

// Ruta de health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Manejo de rutas no existentes
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Ruta ${req.originalUrl} no encontrada`
  });
});

// Middleware de manejo de errores
app.use(errorHandler);

export { httpServer };
export default app;