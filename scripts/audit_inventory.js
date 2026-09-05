const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'backend', 'node_modules', 'pg'));
const xlsx = require(path.join(__dirname, '..', 'backend', 'node_modules', 'xlsx'));
require(path.join(__dirname, '..', 'backend', 'node_modules', 'dotenv')).config({
  path: path.join(__dirname, '..', 'backend', '.env')
});

async function deepAudit() {
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

  const wb = xlsx.readFile('C:/Users/Desarrollo TI/Downloads/INVENTARIOS TI (1).xlsx');
  const sheetSedes = xlsx.utils.sheet_to_json(wb.Sheets['Inventarios Sedes'] || wb.Sheets[wb.SheetNames[0]], { defval: '' });
  const sheetPdv = xlsx.utils.sheet_to_json(wb.Sheets['Equipos PDV'], { defval: '' });

  console.log('================================================================');
  console.log('            AUDITORIA INTEGRAL DE DATOS TI                     ');
  console.log('================================================================');

  // 1. Columnas de equipos_pdv
  const colPdvRes = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'InventariosTI' AND table_name = 'equipos_pdv'
    ORDER BY ordinal_position;
  `);
  console.log('\nColumnas de equipos_pdv:');
  console.log(colPdvRes.rows.map(r => r.column_name).join(', '));

  // 2. Registros de equipos_pdv
  const dbPdvRes = await client.query('SELECT * FROM equipos_pdv ORDER BY id ASC;');
  console.log(`\nTotal PDVs en Base de Datos: ${dbPdvRes.rows.length}`);

  console.log('\n--- LISTADO DE PDVS EN BD ---');
  dbPdvRes.rows.forEach(r => {
    console.log(`ID ${r.id}: "${r.pdv_nombre}" | Placa PC: "${r.pc_placa || r.placa_computador || 'N/A'}" | AnyDesk: "${r.anydesk}" | Teclado: "${r.teclado}" | Mouse: "${r.mouse}" | Impresora: "${r.impresora}" | Camaras: "${r.camaras}"`);
  });

  // 3. Comparación detallada de PDVs
  console.log('\n--- COMPARACION EXCEL "Equipos PDV" vs BD "equipos_pdv" ---');
  const validExcelPdv = sheetPdv.filter(r => r.PDV && String(r.PDV).trim() !== '');
  console.log(`PDVs válidos en hoja "Equipos PDV": ${validExcelPdv.length}`);

  for (const exp of validExcelPdv) {
    const pName = String(exp.PDV).trim();
    // Buscar en BD
    const match = dbPdvRes.rows.find(db => {
      const dbName = (db.pdv_nombre || '').toUpperCase().trim();
      const cleanDb = dbName.replace(/PDV\s*/i, '').trim();
      const cleanExp = pName.toUpperCase().replace(/PDV\s*/i, '').trim();
      return dbName === pName.toUpperCase() || cleanDb === cleanExp || (cleanExp.length > 3 && cleanDb.includes(cleanExp));
    });

    if (!match) {
      console.log(`⚠️ [PDV NO ENCONTRADO EN BD]: "${pName}" (Excel)`);
    } else {
      // Verificar inconsistencias
      const anydeskExp = String(exp.ANYDESK || '').trim();
      const anydeskDb = String(match.anydesk || '').trim();
      const placaExp = String(exp.PLACA || '').trim();
      const placaDb = String(match.pc_placa || match.placa_computador || '').trim();

      const issues = [];
      if (anydeskExp && anydeskDb && anydeskExp !== anydeskDb) {
        issues.push(`AnyDesk DIFERENTE (Excel: "${anydeskExp}" vs BD: "${anydeskDb}")`);
      }
      if (placaExp && placaDb && placaExp !== placaDb && !placaDb.includes(placaExp)) {
        issues.push(`Placa DIFERENTE (Excel: "${placaExp}" vs BD: "${placaDb}")`);
      }
      if (!anydeskDb && anydeskExp) {
        issues.push(`AnyDesk faltante en BD (Excel tiene: "${anydeskExp}")`);
      }
      if (issues.length > 0) {
        console.log(`🔍 [DESCUADRE EN ${match.pdv_nombre}]: ${issues.join(' | ')}`);
      }
    }
  }

  // 4. Ver si hay PDVs en hoja "Inventarios Sedes" que no están en "Equipos PDV" ni en BD
  console.log('\n--- VERIFICACION DE PDVS EN HOJA "Inventarios Sedes" ---');
  const pdvsInSedes = sheetSedes.filter(r => {
    const u = String(r['Ubicacion Fisica'] || '').toUpperCase();
    const p = String(r['PROCESO O OFICINA'] || '').toUpperCase();
    return u.includes('PDV') || p.includes('PDV');
  });
  console.log(`Total filas en "Inventarios Sedes" marcadas como PDV: ${pdvsInSedes.length}`);
  pdvsInSedes.forEach(r => {
    const loc = String(r['Ubicacion Fisica'] || r['PROCESO O OFICINA']).trim();
    const anydesk = String(r['ID ANYDESK'] || '').trim();
    const placaInv = String(r['PLACA INVENTARIO (COMPUTO)'] || '').trim();
    const placaSis = String(r['PLACA SISTEMAS (COMPUTO)'] || '').trim();
    const nombre = String(r['NOMBRE DE COMPUTO'] || '').trim();
    const serial = String(r['SERIAL (COMPUTO)'] || '').trim();
    
    // Buscar en dbPdvRes
    const match = dbPdvRes.rows.find(db => {
      const dbN = (db.pdv_nombre || '').toUpperCase().replace(/PDV\s*/i, '').replace(/[^A-Z0-9]/g, '');
      const locN = loc.toUpperCase().replace(/PDV\s*/i, '').replace(/[^A-Z0-9]/g, '');
      return dbN === locN || (locN.length > 3 && (dbN.includes(locN) || locN.includes(dbN)));
    });

    if (!match) {
      console.log(`⚠️ PDV en 'Inventarios Sedes' no mapeado a equipos_pdv: "${loc}" | Nombre: "${nombre}" | Placa: "${placaInv || placaSis}" | AnyDesk: "${anydesk}"`);
    }
  });

  // 5. Auditoría de la tabla "equipos" (Inventario General)
  console.log('\n--- AUDITORIA DE TABLA GENERAL "equipos" (Total en BD: 885) ---');
  
  // Placas de inventario duplicadas
  const dupPlacasInv = await client.query(`
    SELECT placa_inventario, COUNT(*) 
    FROM equipos 
    WHERE placa_inventario IS NOT NULL AND placa_inventario != '' AND placa_inventario != 'N/A' AND placa_inventario != '0'
    GROUP BY placa_inventario 
    HAVING COUNT(*) > 1;
  `);
  console.log(`\nPlacas inventario duplicadas en equipos: ${dupPlacasInv.rows.length}`);
  dupPlacasInv.rows.forEach(r => {
    console.log(` - Placa Inventario "${r.placa_inventario}" repetida ${r.count} veces`);
  });

  // Placas de sistemas duplicadas
  const dupPlacasSis = await client.query(`
    SELECT placa_sistemas, COUNT(*) 
    FROM equipos 
    WHERE placa_sistemas IS NOT NULL AND placa_sistemas != '' AND placa_sistemas != 'N/A' AND placa_sistemas != '0'
    GROUP BY placa_sistemas 
    HAVING COUNT(*) > 1;
  `);
  console.log(`\nPlacas sistemas duplicadas en equipos: ${dupPlacasSis.rows.length}`);
  dupPlacasSis.rows.forEach(r => {
    console.log(` - Placa Sistemas "${r.placa_sistemas}" repetida ${r.count} veces`);
  });

  // Seriales duplicados
  const dupSerials = await client.query(`
    SELECT serial_fabricante, COUNT(*) 
    FROM equipos 
    WHERE serial_fabricante IS NOT NULL AND serial_fabricante != '' AND serial_fabricante != 'N/A' AND serial_fabricante != '0'
    GROUP BY serial_fabricante 
    HAVING COUNT(*) > 1;
  `);
  console.log(`\nSeriales duplicados en equipos: ${dupSerials.rows.length}`);
  dupSerials.rows.slice(0, 10).forEach(r => {
    console.log(` - Serial "${r.serial_fabricante}" repetido ${r.count} veces`);
  });

  // Equipos sin sede o sin estado
  const sinSede = await client.query(`SELECT COUNT(*) FROM equipos WHERE sede_id IS NULL;`);
  const sinEstado = await client.query(`SELECT COUNT(*) FROM equipos WHERE estado_id IS NULL;`);
  const sinTipo = await client.query(`SELECT COUNT(*) FROM equipos WHERE tipo_equipo_id IS NULL;`);
  console.log(`\nEquipos huérfanos de relaciones:`);
  console.log(` - Sin Sede asignada: ${sinSede.rows[0].count}`);
  console.log(` - Sin Estado: ${sinEstado.rows[0].count}`);
  console.log(` - Sin Tipo de Equipo: ${sinTipo.rows[0].count}`);

  // 6. Revisar tabla inventario_sedes (138 filas en BD)
  console.log('\n--- AUDITORIA DE TABLA "inventario_sedes" (138 filas en BD) ---');
  const colInvSedes = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'InventariosTI' AND table_name = 'inventario_sedes'
    ORDER BY ordinal_position;
  `);
  console.log('Columnas de inventario_sedes:');
  console.log(colInvSedes.rows.map(r => r.column_name).join(', '));

  // 7. Detalle de filas de "Inventarios Sedes" del Excel que puedan faltar en inventario_sedes o equipos
  console.log('\n--- ANÁLISIS DE FILAS ESPECIALES EN EXCEL "Inventarios Sedes" (165 filas) ---');
  const dbEquiposAll = await client.query('SELECT * FROM equipos;');
  let sedesNotCovered = [];

  sheetSedes.forEach((r, idx) => {
    const nombre = String(r['NOMBRE DE COMPUTO'] || '').trim();
    const serial = String(r['SERIAL (COMPUTO)'] || '').trim();
    const placaInv = String(r['PLACA INVENTARIO (COMPUTO)'] || '').trim();
    const placaSis = String(r['PLACA SISTEMAS (COMPUTO)'] || '').trim();
    const anydesk = String(r['ID ANYDESK'] || '').trim();
    const usuario = String(r['Usuario Asignado'] || '').trim();
    const ubicacion = String(r['Ubicacion Fisica'] || '').trim();

    // Comprobar si existe en equipos
    const inEquipos = dbEquiposAll.rows.find(e => {
      if (serial && e.serial_fabricante && e.serial_fabricante.trim().toUpperCase() === serial.toUpperCase()) return true;
      if (placaInv && e.placa_inventario && e.placa_inventario.trim() === placaInv) return true;
      if (placaSis && e.placa_sistemas && e.placa_sistemas.trim() === placaSis) return true;
      if (nombre && e.nombre_estacion && e.nombre_estacion.trim().toUpperCase() === nombre.toUpperCase()) return true;
      return false;
    });

    if (!inEquipos) {
      sedesNotCovered.push({
        fila: idx + 2,
        tipo: r['Tipo de equipo'],
        nombre,
        serial,
        placa: placaInv || placaSis,
        anydesk,
        ubicacion,
        usuario
      });
    }
  });

  console.log(`Total filas de Excel "Inventarios Sedes" no mapeadas directamente en tabla 'equipos': ${sedesNotCovered.length}`);
  sedesNotCovered.forEach(f => {
    console.log(` - Fila ${f.fila}: [${f.tipo}] Nombre: "${f.nombre}" | Serial: "${f.serial}" | Placa: "${f.placa}" | AnyDesk: "${f.anydesk}" | Ubicacion: "${f.ubicacion}" | Usuario: "${f.usuario}"`);
  });

  // 8. Revisión de CCTV (pdv_circuitos_cctv)
  console.log('\n--- AUDITORIA DE CCTV (pdv_circuitos_cctv) ---');
  const dbCctv = await client.query('SELECT * FROM pdv_circuitos_cctv;');
  console.log(`Total registros CCTV: ${dbCctv.rows.length}`);
  const sinPdvCctv = dbCctv.rows.filter(c => !c.pdv_id);
  console.log(`Registros CCTV sin PDV asignado: ${sinPdvCctv.length}`);

  // 9. Revisión de sedes
  console.log('\n--- AUDITORIA DE SEDES ---');
  const dbSedes = await client.query('SELECT id, nombre, ciudad, tipo_sede, activo FROM sedes ORDER BY id;');
  console.log(`Total Sedes: ${dbSedes.rows.length}`);
  const tiposSedes = {};
  dbSedes.rows.forEach(s => {
    tiposSedes[s.tipo_sede] = (tiposSedes[s.tipo_sede] || 0) + 1;
  });
  console.log('Distribución por tipo de sede:', tiposSedes);

  client.release();
  await pool.end();
}

deepAudit().catch(console.error);
