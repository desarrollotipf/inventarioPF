const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'backend', 'node_modules', 'pg'));
require(path.join(__dirname, '..', 'backend', 'node_modules', 'dotenv')).config({
  path: path.join(__dirname, '..', 'backend', '.env')
});

async function auditSedes() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  });
  const client = await pool.connect();
  await client.query('SET search_path TO "InventariosTI", public;');

  const allSedes = await client.query('SELECT * FROM sedes ORDER BY id;');
  console.log(`Total Sedes: ${allSedes.rows.length}`);
  allSedes.rows.forEach(s => {
    console.log(`ID: ${s.id.toString().padStart(2, ' ')} | Tipo: ${s.tipo.padEnd(20, ' ')} | Nombre: "${s.nombre}"`);
  });

  client.release();
  await pool.end();
}

auditSedes().catch(console.error);
