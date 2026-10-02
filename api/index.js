// Entrada para Vercel: la API Express compilada (apps/api) como función serverless.
// La web (apps/web/dist) se sirve como estática. Socket.io no corre en serverless; el resto sí.
module.exports = require('../apps/api/dist/app').default;
