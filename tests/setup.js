const path = require('path');

// Establecer entorno de prueba
process.env.NODE_ENV = 'test';

// Establecer variables de entorno mock para las pruebas
process.env.DATABASE_URL = "postgres://test:test@localhost:5432/healthleap_test";
process.env.JWT_SECRET = "test_secret_key";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret_key";
process.env.JWT_ACCESS_EXPIRATION = "15m";
process.env.JWT_REFRESH_EXPIRATION = "7d";
process.env.EMAIL_HOST = "smtp.example.com";
process.env.EMAIL_PORT = "587";
process.env.EMAIL_USER = "test@example.com";
process.env.EMAIL_PASS = "testpassword";

// Mock para fs.stat usado por winston en caso de que sea necesario
const fs = require('fs');
if (!fs.stat) {
  fs.stat = (path, callback) => {
    const stat = { isDirectory: () => true };
    callback(null, stat);
  };
}

// Mock de file system para evitar errores con winston
fs.existsSync = jest.fn().mockReturnValue(true);
fs.mkdirSync = jest.fn();

// Si tienes un archivo .env.test opcional
try {
  require('dotenv').config({ path: path.resolve(__dirname, '../.env.test') });
} catch (e) {
  console.log('No .env.test file found, using default test environment variables');
}

// Elimina el bloque afterAll que causa el error
// afterAll(() => {
//   jest.useRealTimers();
// });