const fs = require('fs');
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'backend', 'node_modules', 'pg'));
const XLSX = require(path.join(__dirname, '..', 'backend', 'node_modules', 'xlsx'));
const bcrypt = require(path.join(__dirname, '..', 'backend', 'node_modules', 'bcrypt'));
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

const cleanVal = (val) => {
  if (val === undefined || val === null) return null;
  const str = String(val).trim();
  if (str === '' || str === 'N/A' || str === 'n/a') return null;
  return str;
};

async function seed() {
  const client = await pool.connect();
  try {
    console.log('--- INICIANDO REESTRUCTURACIÓN Y SIEMBRA DE INVENTARIOS V2 ---');

    // 1. Ejecutar DDL
    const ddlPath = path.join(__dirname, 'rebuild_schema_v2.sql');
    const ddlSql = fs.readFileSync(ddlPath, 'utf8');
    console.log('1. Ejecutando DDL rebuild_schema_v2.sql...');
    await client.query(ddlSql);
    console.log('   Esquema y tablas creadas exitosamente.');

    await client.query('SET search_path TO "InventariosTI", public;');

    // 2. Usuarios del Sistema
    console.log('2. Insertando usuarios del sistema...');
    const adminPass = await bcrypt.hash('Admin2026*', 10);
    const tecPass = await bcrypt.hash('Tecnico2026*', 10);
    const audPass = await bcrypt.hash('Auditor2026*', 10);

    await client.query(`
      INSERT INTO usuarios_sistema (correo, nombre_completo, password_hash, rol, activo)
      VALUES 
        ('admin@pollofiesta.com', 'Administrador Principal TI', $1, 'ADMIN', true),
        ('soporte@pollofiesta.com', 'Técnico Soporte TI', $2, 'TECNICO', true),
        ('auditoria@pollofiesta.com', 'Auditor Operativo', $3, 'AUDITOR', true)
      ON CONFLICT (correo) DO UPDATE SET 
        nombre_completo = EXCLUDED.nombre_completo,
        password_hash = EXCLUDED.password_hash;
    `, [adminPass, tecPass, audPass]);
    console.log('   Usuarios creados: admin@pollofiesta.com, soporte@pollofiesta.com, auditoria@pollofiesta.com');

    // 3. Cargar archivo Excel
    const excelPath = path.join(__dirname, '..', 'INVENTARIOS TI 2.xlsx');
    console.log(`3. Leyendo archivo: ${excelPath}`);
    const wb = XLSX.readFile(excelPath);

    // 4. Catálogo de Sedes y PDVs
    console.log('4. Extrayendo y catalogando sedes y puntos de venta...');
    const rawSedes = XLSX.utils.sheet_to_json(wb.Sheets['Inventarios Sedes'], { defval: null });
    const rawPdvs = XLSX.utils.sheet_to_json(wb.Sheets['Equipos PDV'], { defval: null });

    const sedesSet = new Map(); // nombre -> tipo

    rawSedes.forEach(r => {
      const u = cleanVal(r['Ubicacion Fisica']);
      if (u) {
        const tipo = u.toLowerCase().includes('pdv') ? 'PDV' : 
                     (u.toLowerCase().includes('planta') ? 'PLANTA' : 'SEDE_ADMINISTRATIVA');
        if (!sedesSet.has(u)) sedesSet.set(u, tipo);
      }
    });

    rawPdvs.forEach(r => {
      const p = cleanVal(r['PDV']);
      if (p) {
        if (!sedesSet.has(p)) sedesSet.set(p, 'PDV');
      }
    });

    const sedesMap = new Map(); // nombre -> id

    for (const [nombre, tipo] of sedesSet.entries()) {
      let ciudad = 'Bogotá';
      const nLower = nombre.toLowerCase();
      if (nLower.includes('soacha')) ciudad = 'Soacha';
      else if (nLower.includes('fusagasuga') || nLower.includes('fusagasugá')) ciudad = 'Fusagasugá';
      else if (nLower.includes('tunja')) ciudad = 'Tunja';
      else if (nLower.includes('chiquinquira') || nLower.includes('chiquinquirá')) ciudad = 'Chiquinquirá';
      else if (nLower.includes('yopal')) ciudad = 'Yopal';

      const res = await client.query(`
        INSERT INTO sedes (nombre, tipo, ciudad, activo)
        VALUES ($1, $2, $3, true)
        ON CONFLICT (nombre) DO UPDATE SET tipo = EXCLUDED.tipo
        RETURNING id, nombre;
      `, [nombre, tipo, ciudad]);
      sedesMap.set(nombre, res.rows[0].id);
    }
    console.log(`   ${sedesMap.size} sedes y puntos de venta registrados en catálogo.`);

    // 5. Poblar Inventarios Sedes
    console.log('5. Poblando tabla "inventario_sedes"...');
    let sedesInsertCount = 0;

    for (const row of rawSedes) {
      const u = cleanVal(row['Ubicacion Fisica']);
      const p = cleanVal(row['Proceso']);
      // Excluir todo lo que sea PDV o Punto Express para que solo vaya a la lista de PDVs
      if (
        (u && (u.toLowerCase().includes('pdv') || u.toLowerCase().includes('punto express'))) ||
        (p && (p.toLowerCase().includes('pdv') || p.toLowerCase().includes('punto express')))
      ) {
        continue;
      }
      const sedeId = u && sedesMap.has(u) ? sedesMap.get(u) : null;

      await client.query(`
        INSERT INTO inventario_sedes (
          excel_id,
          tipo_equipo,
          televisor,
          impresora_placa,
          camaras,
          cajon_monedero,
          bascula,
          dvr,
          monitor_placa,
          monitor_marca,
          monitor_serial,
          modem,
          nombre_computo,
          modelo_computo,
          placa_sistemas,
          placa_inventario,
          serial_computo,
          procesador,
          ram_tipo,
          ram_capacidad,
          disco_tipo,
          disco_capacidad,
          id_anydesk,
          sistema_operativo,
          software_base,
          usuario_asignado,
          proceso_oficina,
          ubicacion_fisica,
          sede_id,
          teclado_placa,
          mouse_placa,
          accesorios,
          estado_equipo,
          foto_url
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
          $31, $32, $33, $34
        );
      `, [
        cleanVal(row['Id']) ? parseInt(row['Id'], 10) : null,
        cleanVal(row['Tipo de equipo']),
        cleanVal(row['TELEVISOR']),
        cleanVal(row['IMPRESORA (PLACA)']),
        cleanVal(row['CAMARAS (PDV)']),
        cleanVal(row['CAJON MONEDERO (PDV)']),
        cleanVal(row['BASCULA (PDV)']),
        cleanVal(row['DVR']),
        cleanVal(row['Placa (Monitor)']),
        cleanVal(row['Marca (Monitor)']),
        cleanVal(row['Serial (Monitor)']),
        cleanVal(row['MODEM']),
        cleanVal(row['NOMBRE DE COMPUTO']),
        cleanVal(row['MODELO (COMPUTO)']),
        cleanVal(row['PLACA SISTEMAS (COMPUTO)']),
        cleanVal(row['PLACA INVENTARIO (COMPUTO)']),
        cleanVal(row['SERIAL (COMPUTO)']),
        cleanVal(row['Procesador']),
        cleanVal(row['TIPO (RAM)']),
        cleanVal(row['CAPACIDAD (RAM)']),
        cleanVal(row['Tipo de disco']),
        cleanVal(row['CAPACIDAD (DISCO)']),
        cleanVal(row['ID ANYDESK']),
        cleanVal(row['Sistema Operativo']),
        cleanVal(row['Software Base']),
        cleanVal(row['Usuario Asignado']),
        cleanVal(row['PROCESO O OFICINA']),
        cleanVal(row['Ubicacion Fisica']),
        sedeId,
        cleanVal(row['TECLADO (PLACA)']),
        cleanVal(row['MOUSE (PLACA)']),
        cleanVal(row['Accesorios']),
        cleanVal(row['Estado de Equipo (Computo)']) || 'Buen estado',
        cleanVal(row['Foto de equipo (Computo)'])
      ]);
      sedesInsertCount++;
    }
    console.log(`   ${sedesInsertCount} puestos de trabajo de Sedes insertados.`);

    // 6. Poblar Equipos PDV
    console.log('6. Poblando tabla "equipos_pdv"...');
    let pdvInsertCount = 0;

    for (const row of rawPdvs) {
      const pdvNom = cleanVal(row['PDV']);
      if (!pdvNom && !row['PC'] && !row['PROCESADOR']) continue; // saltar filas vacías

      const sedeId = pdvNom && sedesMap.has(pdvNom) ? sedesMap.get(pdvNom) : null;

      await client.query(`
        INSERT INTO equipos_pdv (
          numero,
          pdv_nombre,
          sede_id,
          pc_modelo,
          monitor,
          procesador,
          ram,
          disco,
          pc_placa,
          teclado,
          mouse,
          impresora,
          dvr,
          camaras,
          cajon_monedero,
          modem,
          televisor,
          bascula_peso,
          ups,
          anydesk
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
        );
      `, [
        cleanVal(row['NUMERO']) ? parseInt(row['NUMERO'], 10) : null,
        pdvNom || 'PDV Sin Nombre',
        sedeId,
        cleanVal(row['PC']),
        cleanVal(row['MONITOR']),
        cleanVal(row['PROCESADOR']),
        cleanVal(row['RAM']),
        cleanVal(row['DISCO']),
        cleanVal(row['PLACA']),
        cleanVal(row['TECLADO']),
        cleanVal(row['MOUSE']),
        cleanVal(row['IMPRESORA']),
        cleanVal(row['DVR']),
        cleanVal(row['CAMARAS']),
        cleanVal(row['CAJON MONEDERO']),
        cleanVal(row['MODEM']),
        cleanVal(row['TELEVISOR']),
        cleanVal(row['BASCULA DE PESO']),
        cleanVal(row['UPS']),
        cleanVal(row['ANYDESK'])
      ]);
      pdvInsertCount++;
    }
    console.log(`   ${pdvInsertCount} puntos de venta insertados.`);

    // 7. Resumen de Verificación
    console.log('\n--- VERIFICACIÓN FINAL ---');
    const totalSedesRes = await client.query('SELECT COUNT(*) FROM inventario_sedes;');
    const totalPdvsRes = await client.query('SELECT COUNT(*) FROM equipos_pdv;');
    const totalCatalogoRes = await client.query('SELECT COUNT(*) FROM sedes;');

    console.log(`Total en inventario_sedes: ${totalSedesRes.rows[0].count} (Esperado: 163)`);
    console.log(`Total en equipos_pdv:     ${totalPdvsRes.rows[0].count} (Esperado: 22-25)`);
    console.log(`Total en sedes catálogo:  ${totalCatalogoRes.rows[0].count}`);
    console.log('--- MIGRACIÓN COMPLETADA CON ÉXITO ---');

  } catch (err) {
    console.error('Error durante la siembra de base de datos:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
