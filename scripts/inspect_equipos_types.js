const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'backend', 'node_modules', 'pg'));
require(path.join(__dirname, '..', 'backend', 'node_modules', 'dotenv')).config({
  path: path.join(__dirname, '..', 'backend', '.env')
});

async function run() {
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

  console.log('=== TIPOS DE EQUIPOS EN TABLA "equipos" ===');
  const tipos = await client.query(`
    SELECT t.nombre as tipo_nombre, e.modulo, count(*) 
    FROM equipos e 
    LEFT JOIN tipos_equipo t ON t.id = e.tipo_equipo_id
    GROUP BY t.nombre, e.modulo
    ORDER BY count(*) DESC;
  `);
  console.log(tipos.rows);

  console.log('\n=== DETALLE DE EQUIPOS EN SEDE 47 (PDV ENGATIVA - 185 equipos) ===');
  const sede47 = await client.query(`
    SELECT t.nombre as tipo, e.modelo, count(*) 
    FROM equipos e 
    LEFT JOIN tipos_equipo t ON t.id = e.tipo_equipo_id
    WHERE e.sede_id = 47
    GROUP BY t.nombre, e.modelo;
  `);
  console.log(sede47.rows);

  console.log('\n=== DETALLE DE EQUIPOS EN SEDE 50 (PDV CHIQUINQUIRA - 35 equipos) ===');
  const sede50 = await client.query(`
    SELECT t.nombre as tipo, e.modelo, count(*) 
    FROM equipos e 
    LEFT JOIN tipos_equipo t ON t.id = e.tipo_equipo_id
    WHERE e.sede_id = 50
    GROUP BY t.nombre, e.modelo;
  `);
  console.log(sede50.rows);

  client.release();
  await pool.end();
}
run().catch(console.error);
