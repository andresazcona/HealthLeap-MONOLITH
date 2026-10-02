// Crea el esquema y carga los datos de demo: npm run db:setup
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const url = process.env.DATABASE_URL;
if (!url) throw new Error('Falta DATABASE_URL');

(async () => {
  const client = new Client({
    connectionString: url,
    ssl: url.includes('sslmode=') ? { rejectUnauthorized: false } : false,
  });
  await client.connect();
  for (const file of ['schema.sql', 'seed.sql']) {
    await client.query(fs.readFileSync(path.join(__dirname, file), 'utf8'));
    console.log(`OK ${file}`);
  }
  await client.end();
})().catch(err => { console.error(err.message); process.exit(1); });
