import { httpServer } from './app';
import config from './config/enviroment';
import logger from './utils/logger';

const PORT = config.port;

// MODIFICADO: Usar el httpServer de app.ts en lugar de app.listen
// Esto asegura que Socket.IO funcione correctamente
httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${config.env} mode`);
});

// Manejo de errores no capturados
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (err: Error) => {
  logger.error('Unhandled rejection', { error: err.message, stack: err.stack });
  httpServer.close(() => {
    process.exit(1);
  });
});

export default httpServer;