import dotenv from 'dotenv';
import Joi from 'joi';

// Carga las variables de entorno
dotenv.config();

// Esquema para validar las variables de entorno
const envSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    PORT: Joi.number().default(3000),
    DATABASE_URL: Joi.string().required(),
    JWT_SECRET: Joi.string().required(),
    JWT_ACCESS_EXPIRATION: Joi.string().default('2h'),
    JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),
    JWT_REFRESH_SECRET: Joi.string().required(),
    RATE_LIMIT_WINDOW_MS: Joi.number().default(900000),
    RATE_LIMIT_MAX: Joi.number().default(100),
    EMAIL_SERVICE: Joi.string().default('gmail'),
    EMAIL_USER: Joi.string().required(),
    EMAIL_APP_PASSWORD: Joi.string().required(),
    EMAIL_FROM: Joi.string().default('HealthLeap <no-reply@healthleap.com>'),
  })
  .unknown();

const { value: envVars, error } = envSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export default {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  databaseUrl: envVars.DATABASE_URL,
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationInterval: envVars.JWT_ACCESS_EXPIRATION,
    refreshExpirationInterval: envVars.JWT_REFRESH_EXPIRATION,
    refreshSecret: envVars.JWT_REFRESH_SECRET,
  },
  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW_MS,
    max: envVars.RATE_LIMIT_MAX,
  },
  email: {
    service: envVars.EMAIL_SERVICE,
    user: envVars.EMAIL_USER,
    password: envVars.EMAIL_APP_PASSWORD,
    from: envVars.EMAIL_FROM,
  }
};