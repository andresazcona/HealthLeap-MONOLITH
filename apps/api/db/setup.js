// Crea el esquema y, opcionalmente, el primer admin y los datos de demo.
//   node db/setup.js            -> solo esquema (+ admin si ADMIN_EMAIL y ADMIN_PASSWORD)
//   node db/setup.js --demo     -> además cuentas y citas de demo (contraseña pública: no usar en producción)
// También se activa la demo con SEED_DEMO=true. Todo es idempotente.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { Client } = require('pg');

const url = process.env.DATABASE_URL;
if (!url) throw new Error('Falta DATABASE_URL');
const demo = process.argv.includes('--demo') || process.env.SEED_DEMO === 'true';

(async () => {
  const client = new Client({
    connectionString: url,
    ssl: url.includes('sslmode=') ? { rejectUnauthorized: false } : false,
  });
  await client.connect();

  await client.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
  console.log('OK esquema');

  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NOMBRE } = process.env;
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    if (ADMIN_PASSWORD.length < 8) throw new Error('ADMIN_PASSWORD debe tener al menos 8 caracteres');
    const r = await client.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (email) DO NOTHING`,
      [ADMIN_NOMBRE || 'Administrador', ADMIN_EMAIL, await bcrypt.hash(ADMIN_PASSWORD, 10)]
    );
    console.log(r.rowCount ? `OK admin ${ADMIN_EMAIL}` : `OK admin ${ADMIN_EMAIL} ya existía`);
  }

  if (demo) {
    await client.query(fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8'));
    console.log('OK datos de demo (contraseña Demo1234!)');
  }

  await client.end();
})().catch(err => { console.error(err.message); process.exit(1); });
