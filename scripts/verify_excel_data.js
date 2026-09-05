const fs = require('fs');
const path = require('path');
const XLSX = require(path.join(__dirname, '..', 'backend', 'node_modules', 'xlsx'));
const { Pool } = require(path.join(__dirname, '..', 'backend', 'node_modules', 'pg'));
require(path.join(__dirname, '..', 'backend', 'node_modules', 'dotenv')).config({
  path: path.join(__dirname, '..', 'backend', '.env')
});

const pool = new Pool({
  host: process.env.DB_HOST || 'fia-postgres.postgres.database.azure.com',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'adminfia',
  password: process.env.DB_PASSWORD || 'PF8600324509*',
  database: process.env.DB_NAME || 'pf_operacional',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  try {
    const excelPath = path.join(__dirname, '..', 'INVENTARIOS TI 2.xlsx');
    console.log(`=== AUDITORÍA Y COMPARACIÓN CON EXCEL ===`);
    console.log(`Ruta archivo: ${excelPath}`);

    const wb = XLSX.readFile(excelPath);
    console.log(`Hojas disponibles en el archivo Excel:`, wb.SheetNames);

    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { defval: null });
      console.log(`\n--- Hoja: "${sheetName}" ---`);
      console.log(`Total de filas detectadas: ${data.length}`);
      if (data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log(`Total de columnas: ${columns.length}`);
        console.log(`Columnas:`, columns);
      }
    }

    await client.query('SET search_path TO "InventariosTI", public;');

    // 1. Comparar Inventarios Sedes
    const rawSedes = XLSX.utils.sheet_to_json(wb.Sheets['Inventarios Sedes'], { defval: null });
    const dbSedesRes = await client.query('SELECT COUNT(*) as count FROM inventario_sedes;');
    const dbSedesCount = parseInt(dbSedesRes.rows[0].count, 10);

    console.log(`\n========================================`);
    console.log(`COMPARACIÓN SEDES TI:`);
    console.log(`Filas en Excel ('Inventarios Sedes'): ${rawSedes.length}`);
    console.log(`Registros en Base de Datos (inventario_sedes): ${dbSedesCount}`);

    // Verificar si hay IDs del excel que falten en BD
    const dbSedesIds = await client.query('SELECT excel_id, id, nombre_computo, placa_sistemas, serial_computo FROM inventario_sedes ORDER BY excel_id ASC;');
    const dbExcelIdsSet = new Set(dbSedesIds.rows.map(r => r.excel_id).filter(Boolean));
    const missingInDbSedes = [];
    rawSedes.forEach((r, idx) => {
      const eid = r['Id'] ? parseInt(r['Id'], 10) : null;
      if (eid && !dbExcelIdsSet.has(eid)) {
        missingInDbSedes.push({ filaExcel: idx + 2, id: eid, nombre: r['NOMBRE DE COMPUTO'] });
      }
    });
    console.log(`Filas faltantes en BD Sedes: ${missingInDbSedes.length}`);
    if (missingInDbSedes.length > 0) {
      console.log('Detalle de faltantes:', missingInDbSedes);
    }

    // 2. Comparar Equipos PDV
    const rawPdvs = XLSX.utils.sheet_to_json(wb.Sheets['Equipos PDV'], { defval: null });
    const validRawPdvs = rawPdvs.filter(r => r['PDV'] && String(r['PDV']).trim() !== '');
    const dbPdvsRes = await client.query('SELECT COUNT(*) as count FROM equipos_pdv;');
    const dbPdvsCount = parseInt(dbPdvsRes.rows[0].count, 10);

    console.log(`\n========================================`);
    console.log(`COMPARACIÓN EQUIPOS PDV:`);
    console.log(`Filas totales en Excel ('Equipos PDV'): ${rawPdvs.length}`);
    console.log(`Filas con PDV válido en Excel: ${validRawPdvs.length}`);
    console.log(`Registros en Base de Datos (equipos_pdv): ${dbPdvsCount}`);

    const dbPdvs = await client.query('SELECT id, numero, pdv_nombre, pc_modelo, pc_placa, anydesk FROM equipos_pdv ORDER BY numero ASC, id ASC;');
    console.log(`PDVs en BD (${dbPdvs.rows.length}):`);
    dbPdvs.rows.forEach(p => {
      console.log(`  [#${p.numero || '?'}] ${p.pdv_nombre} | PC: ${p.pc_modelo || 'N/A'} | Placa: ${p.pc_placa || 'N/A'} | AnyDesk: ${p.anydesk || 'N/A'}`);
    });

    // 3. Revisar si hay campos clave vacíos o nulos en BD
    console.log(`\n========================================`);
    console.log(`INTEGRIDAD DE COLUMNAS CLAVE:`);
    const sedesNullCheck = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(nombre_computo) as con_nombre_computo,
        COUNT(modelo_computo) as con_modelo,
        COUNT(placa_sistemas) as con_placa_sistemas,
        COUNT(serial_computo) as con_serial,
        COUNT(procesador) as con_procesador,
        COUNT(ram_capacidad) as con_ram,
        COUNT(disco_capacidad) as con_disco,
        COUNT(id_anydesk) as con_anydesk,
        COUNT(usuario_asignado) as con_usuario,
        COUNT(ubicacion_fisica) as con_ubicacion
      FROM inventario_sedes;
    `);
    console.log('Estadísticas columnas Sedes TI en BD:', sedesNullCheck.rows[0]);

    const pdvsNullCheck = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(pdv_nombre) as con_nombre,
        COUNT(pc_modelo) as con_pc,
        COUNT(impresora) as con_impresora,
        COUNT(dvr) as con_dvr,
        COUNT(anydesk) as con_anydesk,
        COUNT(bascula_peso) as con_bascula,
        COUNT(cajon_monedero) as con_cajon
      FROM equipos_pdv;
    `);
    console.log('Estadísticas columnas PDV en BD:', pdvsNullCheck.rows[0]);

  } catch (err) {
    console.error('Error durante la verificación:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
