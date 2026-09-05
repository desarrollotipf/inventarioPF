const path = require('path');
const fs = require('fs');
const XLSX = require(path.join(__dirname, '..', 'backend', 'node_modules', 'xlsx'));
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

const cleanVal = (val) => {
  if (val === undefined || val === null) return null;
  const str = String(val).trim();
  if (str === '' || str === 'N/A' || str === 'n/a' || str === 'NULL' || str === 'null') return null;
  return str;
};

async function run() {
  const client = await pool.connect();
  try {
    await client.query('SET search_path TO "InventariosTI", public;');
    console.log('--- ENRIQUECIENDO PERIFÉRICOS DE EQUIPOS_PDV (TECLADO, MOUSE, IMPRESORA, ETC) ---');

    // Buscar el archivo con datos detallados de periféricos
    let sourceFile = path.join(__dirname, '..', 'INVENTARIOS TI 2.xlsx');
    const downloadsFile = 'C:/Users/Desarrollo TI/Downloads/INVENTARIOS TI (1).xlsx';
    if (fs.existsSync(downloadsFile)) {
      sourceFile = downloadsFile;
    }
    console.log(`Leyendo fuente de datos: ${sourceFile}`);
    const wb = XLSX.readFile(sourceFile);

    const sedesRows = XLSX.utils.sheet_to_json(wb.Sheets['Inventarios Sedes'] || wb.Sheets[wb.SheetNames[0]], { defval: null });
    const pdvSource = sedesRows.filter(r => {
      const u = cleanVal(r['Ubicacion Fisica']) || '';
      const p = cleanVal(r['PROCESO O OFICINA']) || '';
      return u.toLowerCase().includes('pdv') || p.toLowerCase().includes('pdv');
    });

    console.log(`Se encontraron ${pdvSource.length} registros PDV en la hoja de Inventarios con detalle de periféricos.`);

    const dbPdvs = await client.query('SELECT * FROM equipos_pdv ORDER BY id ASC;');
    console.log(`Puntos de venta en BD: ${dbPdvs.rows.length}`);

    let updatedCount = 0;

    for (const p of dbPdvs.rows) {
      const pClean = p.pdv_nombre.toLowerCase().replace('pdv', '').replace(/[^a-z0-9]/g, '').trim();

      const match = pdvSource.find(s => {
        const u = (s['Ubicacion Fisica'] || s['NOMBRE DE COMPUTO'] || '').toLowerCase().replace('pdv', '').replace(/[^a-z0-9]/g, '').trim();
        return u === pClean || (pClean.length > 3 && (u.includes(pClean) || pClean.includes(u)));
      });

      if (!match) {
        console.log(`[SIN MATCH] ${p.pdv_nombre}`);
        continue;
      }

      const teclado = cleanVal(match['TECLADO (PLACA)']) || p.teclado;
      const mouse = cleanVal(match['MOUSE (PLACA)']) || p.mouse;
      const impresora = cleanVal(match['IMPRESORA (PLACA)']) || p.impresora;
      const cajon = cleanVal(match['CAJON MONEDERO (PDV)']) || p.cajon_monedero;
      const bascula = cleanVal(match['BASCULA (PDV)']) || p.bascula_peso;
      const modem = cleanVal(match['MODEM']) || p.modem;
      const pcSerial = cleanVal(match['SERIAL (COMPUTO)']);
      const pcModelo = cleanVal(match['MODELO (COMPUTO)']) || p.pc_modelo;

      const needsUpdate = 
        teclado !== p.teclado ||
        mouse !== p.mouse ||
        impresora !== p.impresora ||
        cajon !== p.cajon_monedero ||
        bascula !== p.bascula_peso ||
        modem !== p.modem;

      if (needsUpdate) {
        await client.query(`
          UPDATE equipos_pdv SET
            teclado = COALESCE($1, teclado),
            mouse = COALESCE($2, mouse),
            impresora = COALESCE($3, impresora),
            cajon_monedero = COALESCE($4, cajon_monedero),
            bascula_peso = COALESCE($5, bascula_peso),
            modem = COALESCE($6, modem),
            pc_modelo = COALESCE(pc_modelo, $7),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $8;
        `, [teclado, mouse, impresora, cajon, bascula, modem, pcModelo, p.id]);

        console.log(`✓ [ACTUALIZADO] ${p.pdv_nombre}:`);
        console.log(`    Teclado: ${teclado} (antes: ${p.teclado})`);
        console.log(`    Mouse:   ${mouse} (antes: ${p.mouse})`);
        console.log(`    Impresora: ${impresora} (antes: ${p.impresora})`);
        console.log(`    Cajón:   ${cajon} (antes: ${p.cajon_monedero})`);
        updatedCount++;
      } else {
        console.log(`= [SIN CAMBIOS] ${p.pdv_nombre}: Teclado: ${p.teclado}, Mouse: ${p.mouse}`);
      }
    }

    console.log(`\n--- PROCESO COMPLETADO: ${updatedCount} PDVs enriquecidos con periféricos y placas ---`);

    // Mostrar estado final de PDV Chiquinquira
    const chRes = await client.query("SELECT * FROM equipos_pdv WHERE pdv_nombre ILIKE '%chiquin%';");
    console.log('\n--- ESTADO FINAL PDV CHIQUINQUIRA ---');
    console.log(chRes.rows[0]);

  } catch (err) {
    console.error('Error durante la actualización de periféricos:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
