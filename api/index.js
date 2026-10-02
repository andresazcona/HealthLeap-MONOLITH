// Entrada para Vercel: la app Express compilada como función serverless.
// Socket.io no corre aquí (Vercel no mantiene conexiones abiertas); el resto de la API sí.
module.exports = require('../dist/app').default;
