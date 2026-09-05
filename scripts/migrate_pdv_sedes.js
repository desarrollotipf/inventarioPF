const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'backend', 'node_modules', 'pg'));
require(path.join(__dirname, '..', 'backend', 'node_modules', 'dotenv')).config({
  path: path.join(__dirname, '..', 'backend', '.env')
});

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const client = await pool.connect();
  try {
    await client.query('SET search_path TO "InventariosTI", public;');
    await client.query('BEGIN;');

    console.log('--- 1. ENRIQUECIENDO EQUIPOS_PDV CON DATOS FALTANTES ---');
    // Pradera: Anydesk
    await client.query(`
      UPDATE equipos_pdv 
      SET anydesk = '1554387230' 
      WHERE numero = 11 AND (anydesk IS NULL OR anydesk = '');
    `);
    console.log('✓ PDV Pradera AnyDesk actualizado.');

    // Engativá: Anydesk
    await client.query(`
      UPDATE equipos_pdv 
      SET anydesk = '1660636830' 
      WHERE numero = 15 AND (anydesk IS NULL OR anydesk = '');
    `);
    console.log('✓ PDV Engativá AnyDesk actualizado.');

    // Fiesta Express: Anydesk
    await client.query(`
      UPDATE equipos_pdv 
      SET anydesk = '375208941' 
      WHERE numero = 6 AND (anydesk IS NULL OR anydesk = '');
    `);
    console.log('✓ Fiesta Express AnyDesk actualizado.');

    // Suba: Anydesk
    await client.query(`
      UPDATE equipos_pdv 
      SET anydesk = '533137864' 
      WHERE numero = 12 AND (anydesk IS NULL OR anydesk = '');
    `);
    console.log('✓ PDV Suba AnyDesk actualizado.');

    // Floresta: Hardware completo que estaba null
    await client.query(`
      UPDATE equipos_pdv 
      SET 
        pc_modelo = COALESCE(pc_modelo, 'AIO Lenovo C260'),
        pc_placa = COALESCE(pc_placa, '0592'),
        procesador = COALESCE(procesador, 'INTEL PENTIUM J2900'),
        ram = COALESCE(ram, '2 GB'),
        disco = COALESCE(disco, '240 GB')
      WHERE (pdv_nombre ILIKE '%floresta%' OR numero = 23);
    `);
    console.log('✓ PDV Floresta especificaciones de cómputo completadas.');

    console.log('\n--- 2. ELIMINANDO REGISTROS PDV DE INVENTARIO_SEDES ---');
    const deleteRes = await client.query(`
      DELETE FROM inventario_sedes
      WHERE (
        ubicacion_fisica ILIKE '%pdv%' 
        OR proceso_oficina ILIKE '%pdv%' 
        OR ubicacion_fisica ILIKE '%punto express%' 
        OR proceso_oficina ILIKE '%punto express%'
      )
      AND id != 2 -- Preservar Mayerlis Campos (AuditorPDV en Sede Administrativa)
      RETURNING id, ubicacion_fisica, proceso_oficina, nombre_computo;
    `);

    console.log(`✓ Se eliminaron ${deleteRes.rowCount} filas de PDV en inventario_sedes:`);
    deleteRes.rows.forEach(r => {
      console.log(`  - [ID ${r.id}] ${r.ubicacion_fisica || 'Sin Ubicación'} | Proceso: ${r.proceso_oficina || 'N/A'} | PC: ${r.nombre_computo || 'N/A'}`);
    });

    console.log('\n--- 3. VERIFICACIÓN DE TOTALES POST-MIGRACIÓN ---');
    const sedesCount = await client.query('SELECT COUNT(*) as count FROM inventario_sedes;');
    const pdvCount = await client.query('SELECT COUNT(*) as count FROM equipos_pdv;');

    console.log(`Total final en Sedes TI (inventario_sedes): ${sedesCount.rows[0].count}`);
    console.log(`Total final en Puntos de Venta (equipos_pdv): ${pdvCount.rows[0].count}`);

    await client.query('COMMIT;');
    console.log('\n¡TRANSACCIÓN COMPLETADA CON ÉXITO!');
  } catch (err) {
    await client.query('ROLLBACK;');
    console.error('Error durante la migración, se hizo ROLLBACK:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
