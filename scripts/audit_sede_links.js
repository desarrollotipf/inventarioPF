const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'backend', 'node_modules', 'pg'));
require(path.join(__dirname, '..', 'backend', 'node_modules', 'dotenv')).config({
  path: path.join(__dirname, '..', 'backend', '.env')
});

async function checkSedeLinks() {
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

  const sedes = await client.query('SELECT id, nombre, tipo FROM sedes ORDER BY id;');
  console.log('SEDE_ID | EQUIPOS_COUNT | CCTV_COUNT | EQUIPOS_PDV_COUNT | INVENTARIO_SEDES_COUNT');
  for (const s of sedes.rows) {
    const eq = await client.query('SELECT count(*) FROM equipos WHERE sede_id = $1', [s.id]);
    const cctv = await client.query('SELECT count(*) FROM pdv_circuitos_cctv WHERE sede_id = $1', [s.id]);
    const pdv = await client.query('SELECT count(*) FROM equipos_pdv WHERE sede_id = $1', [s.id]);
    const inv = await client.query('SELECT count(*) FROM inventario_sedes WHERE sede_id = $1', [s.id]);
    console.log(`${s.id.toString().padStart(3, ' ')} "${s.nombre.padEnd(25, ' ')}" | eq: ${eq.rows[0].count.padStart(3, ' ')} | cctv: ${cctv.rows[0].count.padStart(3, ' ')} | pdv: ${pdv.rows[0].count.padStart(2, ' ')} | inv: ${inv.rows[0].count.padStart(3, ' ')}`);
  }

  client.release();
  await pool.end();
}

checkSedeLinks().catch(console.error);
