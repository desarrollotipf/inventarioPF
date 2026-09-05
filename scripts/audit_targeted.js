const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'backend', 'node_modules', 'pg'));
const xlsx = require(path.join(__dirname, '..', 'backend', 'node_modules', 'xlsx'));
require(path.join(__dirname, '..', 'backend', 'node_modules', 'dotenv')).config({
  path: path.join(__dirname, '..', 'backend', '.env')
});

async function check() {
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

  console.log('=== 1. SEDES COLUMNS & SAMPLE ===');
  const colsSedes = await client.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_schema='InventariosTI' AND table_name='sedes'
    ORDER BY ordinal_position;
  `);
  console.log('Columns:', colsSedes.rows.map(r => r.column_name).join(', '));
  const sedesRows = await client.query('SELECT * FROM sedes LIMIT 5;');
  console.log('Sample sedes:', sedesRows.rows);

  console.log('\n=== 2. CCTV COLUMNS & SAMPLE ===');
  const colsCctv = await client.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_schema='InventariosTI' AND table_name='pdv_circuitos_cctv'
    ORDER BY ordinal_position;
  `);
  console.log('Columns:', colsCctv.rows.map(r => r.column_name).join(', '));
  const sampleCctv = await client.query('SELECT * FROM pdv_circuitos_cctv LIMIT 5;');
  console.log('Sample CCTV rows:', sampleCctv.rows);

  console.log('\n=== 3. DUPLICATE PLACAS IN EQUIPOS ===');
  const dups = await client.query(`
    SELECT id, modulo, codigo_interno, placa_inventario, placa_sistemas, serial_fabricante, nombre_estacion, modelo, created_at 
    FROM equipos 
    WHERE placa_inventario IN ('3547', '4186', '0037', '3555') 
    ORDER BY placa_inventario, id;
  `);
  console.log('Duplicate examples in equipos:', dups.rows);

  console.log('\n=== 4. PDV GUADALUPE ROWS IN EQUIPOS_PDV ===');
  const guad = await client.query(`
    SELECT id, numero, pdv_nombre, pc_modelo, pc_placa, anydesk, teclado, mouse, impresora, camaras 
    FROM equipos_pdv 
    WHERE pdv_nombre ILIKE '%guadalupe%'
    ORDER BY id;
  `);
  console.log('Guadalupe in equipos_pdv:', guad.rows);

  console.log('\n=== 5. SOGAMOSO & CANAGUARO IN EXCEL ===');
  const wb = xlsx.readFile('C:/Users/Desarrollo TI/Downloads/INVENTARIOS TI (1).xlsx');
  const sheetSedes = xlsx.utils.sheet_to_json(wb.Sheets['Inventarios Sedes'], { defval: '' });
  const sogamosoRows = sheetSedes.filter(r => 
    String(r['Ubicacion Fisica']).toLowerCase().includes('sogamoso') ||
    String(r['NOMBRE DE COMPUTO']).toLowerCase().includes('sogamoso') ||
    String(r['Ubicacion Fisica']).toLowerCase().includes('canaguaro')
  );
  console.log('Sogamoso and Canaguaro rows in Excel:', sogamosoRows);

  console.log('\n=== 6. PDVS AND THEIR SEDE_ID RELATION ===');
  const pdvs = await client.query('SELECT id, pdv_nombre, sede_id FROM equipos_pdv ORDER BY id');
  for (const p of pdvs.rows) {
    if (p.sede_id) {
      const s = await client.query('SELECT id, nombre, tipo FROM sedes WHERE id = $1', [p.sede_id]);
      console.log(`PDV ${p.id} "${p.pdv_nombre}" -> sede_id ${p.sede_id}: "${s.rows[0]?.nombre}" (${s.rows[0]?.tipo})`);
    } else {
      console.log(`PDV ${p.id} "${p.pdv_nombre}" -> sede_id is NULL`);
    }
  }

  console.log('\n=== 7. CCTV SEDES DISTRIBUTION ===');
  const cctvSedes = await client.query(`
    SELECT c.sede_id, s.nombre, s.tipo, count(*) as camaras_count 
    FROM pdv_circuitos_cctv c
    LEFT JOIN sedes s ON s.id = c.sede_id
    GROUP BY c.sede_id, s.nombre, s.tipo
    ORDER BY c.sede_id;
  `);
  console.log('CCTV distribution across sedes:', cctvSedes.rows);

  client.release();
  await pool.end();
}

check().catch(console.error);
