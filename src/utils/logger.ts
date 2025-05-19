import winston, { transport, transports as winstonTransports } from 'winston';
import config from '../config/enviroment';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const level = () => {
  const env = config.env || 'development';
  return env === 'development' ? 'debug' : 'warn';
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message} ${
      info.splat !== undefined ? `${info.splat}` : ''
    } ${
      info.metadata && Object.keys(info.metadata).length
        ? JSON.stringify(info.metadata)
        : ''
    }`,
  ),
);

// Inicializar con transporte de consola que funciona en todos los entornos
const transports: winston.transport[] = [
  new winston.transports.Console()
];

// Agregar transportes de archivo solo si NO estamos en ambiente de pruebas
if (process.env.NODE_ENV !== 'test') {
  try {
    // Añadir transportes de archivo solo en entornos no-test
    transports.push(
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
      }),
      new winston.transports.File({ 
        filename: 'logs/all.log' 
      })
    );
  } catch (error) {
    console.warn('Error setting up file logging, falling back to console only', error);
  }
}

const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  defaultMeta: { service: 'healthleap-api' },
});

export default logger;