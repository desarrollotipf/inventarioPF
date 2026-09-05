const { Pool } = require('pg');
const XLSX = require('xlsx');
const bcrypt = require('bcrypt');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST || 'fia-postgres.postgres.database.azure.com',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'adminfia',
  password: process.env.DB_PASSWORD || 'PF8600324509*',
  database: process.env.DB_NAME || 'pf_operacional',
  ssl: { rejectUnauthorized: false },
});

async function runSeed() {
  const client = await pool.connect();
  try {
    console.log('--- STARTING COMPREHENSIVE SEEDING ---');
    await client.query('SET search_path TO "InventariosTI", public;');

    // 1. Usuarios del sistema iniciales
    console.log('1. Creando usuarios del sistema...');
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

    // 2. Catálogos base de Tipos de Equipo
    console.log('2. Poblando tipos de equipo...');
    const tipos = [
      { nombre: 'Computador AIO', categoria: 'COMPUTO', freq: 6 },
      { nombre: 'Portatil', categoria: 'COMPUTO', freq: 6 },
      { nombre: 'CPU Escritorio', categoria: 'COMPUTO', freq: 6 },
      { nombre: 'Monitor', categoria: 'PERIFERICO', freq: 12 },
      { nombre: 'DVR / NVR', categoria: 'CCTV', freq: 3 },
      { nombre: 'Camara de Seguridad', categoria: 'CCTV', freq: 6 },
      { nombre: 'Impresora POS', categoria: 'COMERCIAL', freq: 3 },
      { nombre: 'Bascula de Pesaje', categoria: 'COMERCIAL', freq: 3 },
      { nombre: 'Cajon Monedero', categoria: 'COMERCIAL', freq: 6 },
      { nombre: 'Modem / Router', categoria: 'REDES', freq: 12 },
      { nombre: 'Televisor', categoria: 'PERIFERICO', freq: 12 },
      { nombre: 'UPS', categoria: 'REDES', freq: 6 },
      { nombre: 'Teclado', categoria: 'PERIFERICO', freq: 12 },
      { nombre: 'Mouse', categoria: 'PERIFERICO', freq: 12 },
      { nombre: 'Multipuerto / Adaptador', categoria: 'PERIFERICO', freq: 12 }
    ];

    for (const t of tipos) {
      await client.query(`
        INSERT INTO tipos_equipo (nombre, categoria, frecuencia_mantenimiento_meses)
        VALUES ($1, $2, $3)
        ON CONFLICT (nombre) DO NOTHING;
      `, [t.nombre, t.categoria, t.freq]);
    }

    const tiposRes = await client.query('SELECT id, nombre FROM tipos_equipo');
    const getTipoId = (nombre) => {
      const found = tiposRes.rows.find(r => r.nombre.toLowerCase() === nombre.toLowerCase());
      return found ? found.id : tiposRes.rows[0].id;
    };

    const getOrInsertMarca = async (marcaNombre) => {
      if (!marcaNombre || marcaNombre === 'N/A' || marcaNombre.trim() === '') return null;
      const clean = marcaNombre.trim();
      const res = await client.query(`
        INSERT INTO marcas (nombre) VALUES ($1)
        ON CONFLICT (nombre) DO UPDATE SET nombre = EXCLUDED.nombre
        RETURNING id;
      `, [clean]);
      return res.rows[0].id;
    };

    // 3. Procesar EQUIPOS PDV.xlsx (23 pestañas)
    console.log('3. Parseando EQUIPOS PDV.xlsx...');
    const pdvFilePath = path.join(__dirname, '..', 'EQUIPOS PDV.xlsx');
    const pdvWb = XLSX.readFile(pdvFilePath);

    let totalPdvEquipos = 0;
    let totalPdvCamaras = 0;

    for (const sheetName of pdvWb.SheetNames) {
      const sheet = pdvWb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      if (!rows || rows.length < 2) continue;

      let pdvNombre = (rows[0][0] || sheetName).toString().trim();
      if (!pdvNombre) pdvNombre = sheetName;

      const sedeRes = await client.query(`
        INSERT INTO sedes (codigo, nombre, tipo, ciudad)
        VALUES ($1, $2, 'PDV', 'Bogotá')
        ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre
        RETURNING id;
      `, [`PDV-${sheetName.replace(/\s+/g, '_')}`, pdvNombre]);
      const sedeId = sedeRes.rows[0].id;

      let headerRowIdx = -1;
      for (let r = 0; r < Math.min(rows.length, 3); r++) {
        if (rows[r].some(cell => typeof cell === 'string' && (cell.includes('PC') || cell.includes('PROCESADOR')))) {
          headerRowIdx = r;
          break;
        }
      }

      if (headerRowIdx === -1) continue;

      const headers = rows[headerRowIdx].map(h => (h || '').toString().toUpperCase().trim());

      for (let r = headerRowIdx + 1; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.every(cell => !cell || cell.toString().trim() === '')) continue;

        const rowData = {};
        headers.forEach((h, colIdx) => {
          rowData[h] = (row[colIdx] || '').toString().trim();
        });

        const pcRaw = rowData['PC'] || '';
        const procesador = rowData['PROCESADOR'] || '';
        const ram = rowData['RAM'] || '';
        const disco = rowData['DISCO'] || '';
        const placa = rowData['PLACA'] || rowData['PLACA SISTEMAS'] || '';
        const serial = rowData['SERIAL'] || '';
        const anydesk = rowData['ANYDESK'] || '';

        let pcEquipoId = null;
        if (pcRaw || procesador || placa) {
          const isAIO = pcRaw.toUpperCase().includes('ALL IN ONE') || pcRaw.toUpperCase().includes('AIO');
          const isPortatil = pcRaw.toUpperCase().includes('PORTATIL') || pcRaw.toUpperCase().includes('LAPTOP');
          const tipoPc = isAIO ? 'Computador AIO' : (isPortatil ? 'Portatil' : 'CPU Escritorio');

          let marcaPc = 'HP';
          if (pcRaw.toUpperCase().includes('LENOVO')) marcaPc = 'Lenovo';
          else if (pcRaw.toUpperCase().includes('ASUS')) marcaPc = 'Asus';
          else if (pcRaw.toUpperCase().includes('JANUS')) marcaPc = 'Janus';
          else if (pcRaw.toUpperCase().includes('COMPAQ')) marcaPc = 'Compaq';
          const marcaId = await getOrInsertMarca(marcaPc);

          const insPc = await client.query(`
            INSERT INTO equipos (
              modulo, placa_inventario, placa_sistemas, serial_fabricante, modelo,
              tipo_equipo_id, marca_id, sede_id, estado_id, especificaciones,
              observaciones, created_by
            ) VALUES (
              'PDV', $1, $1, $2, $3,
              $4, $5, $6, 1, $7,
              'Equipo principal de punto de venta', 'SEEDER'
            ) RETURNING id;
          `, [
            placa || null,
            serial || null,
            pcRaw || `${tipoPc} ${marcaPc}`,
            getTipoId(tipoPc),
            marcaId,
            sedeId,
            JSON.stringify({
              procesador,
              ram_capacidad: ram,
              disco_capacidad: disco,
              anydesk_id: anydesk,
            }),
          ]);
          pcEquipoId = insPc.rows[0].id;
          totalPdvEquipos++;
        }

        const monitorRaw = rowData['MONITOR'] || rowData['PANTALLA'] || '';
        if (monitorRaw && monitorRaw !== 'N/A') {
          const marcaMon = monitorRaw.toUpperCase().includes('LG') ? 'LG' : (monitorRaw.toUpperCase().includes('SAMSUNG') ? 'Samsung' : 'Janus');
          const marcaId = await getOrInsertMarca(marcaMon);
          await client.query(`
            INSERT INTO equipos (modulo, modelo, tipo_equipo_id, marca_id, sede_id, estado_id, equipo_padre_id, created_by)
            VALUES ('PDV', $1, $2, $3, $4, 1, $5, 'SEEDER');
          `, [monitorRaw, getTipoId('Monitor'), marcaId, sedeId, pcEquipoId]);
          totalPdvEquipos++;
        }

        const tecladoRaw = rowData['TECLADO'] || '';
        if (tecladoRaw && tecladoRaw !== 'N/A') {
          const marcaId = await getOrInsertMarca(tecladoRaw.split(/[- ]+/)[0] || 'Genius');
          await client.query(`
            INSERT INTO equipos (modulo, modelo, tipo_equipo_id, marca_id, sede_id, estado_id, equipo_padre_id, created_by)
            VALUES ('PDV', $1, $2, $3, $4, 1, $5, 'SEEDER');
          `, [tecladoRaw, getTipoId('Teclado'), marcaId, sedeId, pcEquipoId]);
          totalPdvEquipos++;
        }

        const mouseRaw = rowData['MOUSE'] || '';
        if (mouseRaw && mouseRaw !== 'N/A') {
          const marcaId = await getOrInsertMarca(mouseRaw.split(/[- ]+/)[0] || 'Genius');
          await client.query(`
            INSERT INTO equipos (modulo, modelo, tipo_equipo_id, marca_id, sede_id, estado_id, equipo_padre_id, created_by)
            VALUES ('PDV', $1, $2, $3, $4, 1, $5, 'SEEDER');
          `, [mouseRaw, getTipoId('Mouse'), marcaId, sedeId, pcEquipoId]);
          totalPdvEquipos++;
        }

        const impRaw = rowData['IMPRESORA'] || '';
        if (impRaw && impRaw !== 'N/A') {
          const marcaImp = impRaw.toUpperCase().includes('EPSON') ? 'Epson' : (impRaw.toUpperCase().includes('BIXOLON') ? 'Bixolon' : 'SAT');
          const marcaId = await getOrInsertMarca(marcaImp);
          await client.query(`
            INSERT INTO equipos (modulo, modelo, tipo_equipo_id, marca_id, sede_id, estado_id, equipo_padre_id, created_by)
            VALUES ('PDV', $1, $2, $3, $4, 1, $5, 'SEEDER');
          `, [impRaw, getTipoId('Impresora POS'), marcaId, sedeId, pcEquipoId]);
          totalPdvEquipos++;
        }

        const cajonRaw = rowData['CAJON MONEDERO'] || '';
        if (cajonRaw && cajonRaw !== 'N/A') {
          const marcaId = await getOrInsertMarca('3nStar');
          await client.query(`
            INSERT INTO equipos (modulo, modelo, tipo_equipo_id, marca_id, sede_id, estado_id, equipo_padre_id, created_by)
            VALUES ('PDV', $1, $2, $3, $4, 1, $5, 'SEEDER');
          `, [cajonRaw, getTipoId('Cajon Monedero'), marcaId, sedeId, pcEquipoId]);
          totalPdvEquipos++;
        }

        const basculaRaw = rowData['BASCULA DE PESO'] || '';
        if (basculaRaw && basculaRaw !== 'N/A') {
          const marcaId = await getOrInsertMarca('Tek Galaxy');
          await client.query(`
            INSERT INTO equipos (modulo, modelo, tipo_equipo_id, marca_id, sede_id, estado_id, equipo_padre_id, created_by)
            VALUES ('PDV', $1, $2, $3, $4, 1, $5, 'SEEDER');
          `, [basculaRaw, getTipoId('Bascula de Pesaje'), marcaId, sedeId, pcEquipoId]);
          totalPdvEquipos++;
        }

        const modemRaw = rowData['MODEM'] || '';
        if (modemRaw && modemRaw !== 'N/A') {
          const marcaId = await getOrInsertMarca('TP-Link');
          await client.query(`
            INSERT INTO equipos (modulo, modelo, tipo_equipo_id, marca_id, sede_id, estado_id, equipo_padre_id, created_by)
            VALUES ('PDV', $1, $2, $3, $4, 1, $5, 'SEEDER');
          `, [modemRaw, getTipoId('Modem / Router'), marcaId, sedeId, pcEquipoId]);
          totalPdvEquipos++;
        }

        const tvRaw = rowData['TELEVISOR'] || '';
        if (tvRaw && tvRaw !== 'N/A') {
          const marcaId = await getOrInsertMarca('LG');
          await client.query(`
            INSERT INTO equipos (modulo, modelo, tipo_equipo_id, marca_id, sede_id, estado_id, equipo_padre_id, created_by)
            VALUES ('PDV', $1, $2, $3, $4, 1, $5, 'SEEDER');
          `, [tvRaw, getTipoId('Televisor'), marcaId, sedeId, pcEquipoId]);
          totalPdvEquipos++;
        }

        const upsRaw = rowData['UPS'] || '';
        if (upsRaw && upsRaw !== 'N/A') {
          const marcaId = await getOrInsertMarca('APC');
          await client.query(`
            INSERT INTO equipos (modulo, modelo, tipo_equipo_id, marca_id, sede_id, estado_id, equipo_padre_id, created_by)
            VALUES ('PDV', $1, $2, $3, $4, 1, $5, 'SEEDER');
          `, [upsRaw, getTipoId('UPS'), marcaId, sedeId, pcEquipoId]);
          totalPdvEquipos++;
        }

        const dvrRaw = rowData['DVR'] || '';
        const camarasRaw = rowData['CAMARAS'] || '';
        let dvrEquipoId = null;

        if (dvrRaw && dvrRaw !== 'N/A') {
          const marcaDvr = 'Dahua';
          const marcaId = await getOrInsertMarca(marcaDvr);
          const insDvr = await client.query(`
            INSERT INTO equipos (modulo, modelo, serial_fabricante, tipo_equipo_id, marca_id, sede_id, estado_id, created_by)
            VALUES ('PDV', $1, $2, $3, $4, $5, 1, 'SEEDER')
            RETURNING id;
          `, [
            dvrRaw,
            dvrRaw.split(/[- ]+/).pop() || null,
            getTipoId('DVR / NVR'),
            marcaId,
            sedeId,
          ]);
          dvrEquipoId = insDvr.rows[0].id;
          totalPdvEquipos++;
        }

        let numCamaras = 0;
        if (camarasRaw && camarasRaw !== 'N/A') {
          const match = camarasRaw.match(/\d+/);
          if (match) numCamaras = parseInt(match[0], 10);
        }
        if (numCamaras === 0 && dvrEquipoId) numCamaras = 4;

        if (numCamaras > 0) {
          for (let c = 1; c <= numCamaras; c++) {
            const insCam = await client.query(`
              INSERT INTO equipos (modulo, modelo, tipo_equipo_id, sede_id, estado_id, created_by)
              VALUES ('PDV', $1, $2, $3, 1, 'SEEDER')
              RETURNING id;
            `, [`Cámara Domo HD Canal ${c}`, getTipoId('Camara de Seguridad'), sedeId]);
            const camId = insCam.rows[0].id;

            const ubicaciones = ['Caja 1 / Facturación', 'Entrada Principal', 'Pasillo Mostrador', 'Área de Bodega / Neveras', 'Comedor / Clientes'];
            const ubic = ubicaciones[(c - 1) % ubicaciones.length];

            await client.query(`
              INSERT INTO pdv_circuitos_cctv (
                sede_id, dvr_equipo_id, camara_equipo_id, numero_canal, nombre_camara,
                ubicacion_en_pdv, tipo_camara, resolucion, estado_senal
              ) VALUES ($1, $2, $3, $4, $5, $6, 'Domo', '1080p Full HD', 'ONLINE');
            `, [sedeId, dvrEquipoId, camId, c, `Cámara Canal ${c}`, ubic]);

            totalPdvCamaras++;
            totalPdvEquipos++;
          }
        }
      }
    }

    console.log(`✅ PDV procesado con éxito: ${totalPdvEquipos} equipos registrados, ${totalPdvCamaras} cámaras CCTV mapeadas.`);

    // 4. Procesar INVENTARIOS TI.xlsx (125 registros)
    console.log('4. Parseando INVENTARIOS TI.xlsx...');
    const tiFilePath = path.join(__dirname, '..', 'INVENTARIOS TI.xlsx');
    const tiWb = XLSX.readFile(tiFilePath);
    const tiSheet = tiWb.Sheets[tiWb.SheetNames[0]];
    const tiRows = XLSX.utils.sheet_to_json(tiSheet);

    let totalTiEquipos = 0;

    for (const row of tiRows) {
      const sedeNombre = (row['Ubicacion Fisica'] || 'Sede Administrativa').toString().trim();
      let sedeId;
      const existSede = await client.query('SELECT id FROM sedes WHERE nombre = $1 LIMIT 1', [sedeNombre]);
      if (existSede.rows.length > 0) {
        sedeId = existSede.rows[0].id;
      } else {
        const insSede = await client.query(`
          INSERT INTO sedes (codigo, nombre, tipo, ciudad)
          VALUES ($1, $2, 'SEDE_ADMINISTRATIVA', 'Bogotá')
          RETURNING id;
        `, [`SEDE-${sedeNombre.replace(/[^a-zA-Z0-9]/g, '_')}`, sedeNombre]);
        sedeId = insSede.rows[0]?.id;
      }

      const usuarioNombre = (row['Usuario Asignado'] || '').toString().trim();
      let usuarioId = null;
      if (usuarioNombre && usuarioNombre !== 'N/A') {
        const correo = (row['Correo electrónico'] || '').toString().trim();
        const area = (row['Proceso e Oficina'] || '').toString().trim();

        const existUser = await client.query('SELECT id FROM usuarios_empleados WHERE nombre_completo = $1 LIMIT 1', [usuarioNombre]);
        if (existUser.rows.length > 0) {
          usuarioId = existUser.rows[0].id;
        } else {
          const insUser = await client.query(`
            INSERT INTO usuarios_empleados (nombre_completo, correo, proceso_oficina, sede_id, estado)
            VALUES ($1, $2, $3, $4, 'ACTIVO')
            RETURNING id;
          `, [usuarioNombre, correo || null, area || null, sedeId]);
          usuarioId = insUser.rows[0].id;
        }
      }

      const tipoRaw = (row['Tipo de equipo'] || 'Computador AIO').toString().trim();
      let tipoPc = 'Computador AIO';
      if (tipoRaw.toUpperCase().includes('PORTATIL') || tipoRaw.toUpperCase().includes('PORTÁTIL')) {
        tipoPc = 'Portatil';
      } else if (tipoRaw.toUpperCase().includes('CPU')) {
        tipoPc = 'CPU Escritorio';
      }

      const modelo = (row['Modelo de equipo (Computo)'] || tipoPc).toString().trim();
      let marcaNombre = 'HP';
      if (modelo.toUpperCase().includes('LENOVO')) marcaNombre = 'Lenovo';
      else if (modelo.toUpperCase().includes('ASUS')) marcaNombre = 'Asus';
      else if (modelo.toUpperCase().includes('JANUS')) marcaNombre = 'Janus';
      else if (modelo.toUpperCase().includes('DELL')) marcaNombre = 'Dell';
      else if (modelo.toUpperCase().includes('ACER')) marcaNombre = 'Acer';
      const marcaId = await getOrInsertMarca(marcaNombre);

      const estadoRaw = (row['Estado de Equipo (Computo)'] || 'Buen estado').toString().trim();
      let estadoId = 1;
      if (estadoRaw.toUpperCase().includes('LENT') || estadoRaw.toUpperCase().includes('MANCHA') || estadoRaw.toUpperCase().includes('MOLESTA')) {
        estadoId = 2;
      }

      const especificaciones = {
        procesador: row['Procesador'] || '',
        ram_tipo: row['Tipo RAM'] || '',
        ram_capacidad: row['Capacidad RAM'] || '',
        disco_tipo: row['Tipo de disco'] || '',
        disco_capacidad: row['Capacidad de Disco'] || '',
        anydesk_id: row['Anydesk ID'] || '',
        so: row['Sistema Operativo'] || '',
        software_base: row['Software Base'] || '',
        accesorios: row['Accesorios'] || '',
      };

      const insEquipo = await client.query(`
        INSERT INTO equipos (
          modulo, placa_inventario, placa_sistemas, serial_fabricante, nombre_estacion,
          tipo_equipo_id, marca_id, modelo, sede_id, usuario_asignado_id, estado_id,
          especificaciones, foto_url, created_by
        ) VALUES (
          'TI', $1, $2, $3, $4,
          $5, $6, $7, $8, $9, $10,
          $11, $12, 'SEEDER'
        ) RETURNING id;
      `, [
        row['Placa de Inventario Equipo (Computo)'] || null,
        row['Placa de Sistemas Equipo (Computo)'] || null,
        row['Serial de Equipo (Computo)'] || null,
        row['Nombre Estacion de Trabajo'] || null,
        getTipoId(tipoPc),
        marcaId,
        modelo,
        sedeId,
        usuarioId,
        estadoId,
        JSON.stringify(especificaciones),
        row['Foto de equipo (Computo)'] || null,
      ]);
      const equipoId = insEquipo.rows[0].id;
      totalTiEquipos++;

      const monitorMarca = (row['Marca (Monitor)'] || '').toString().trim();
      const monitorPlaca = (row['Placa (Monitor)'] || '').toString().trim();
      const monitorSerial = (row['Serial (Monitor)'] || '').toString().trim();

      if (monitorMarca && monitorMarca !== 'N/A') {
        const monMarcaId = await getOrInsertMarca(monitorMarca);
        await client.query(`
          INSERT INTO equipos (
            modulo, placa_inventario, serial_fabricante, modelo, tipo_equipo_id,
            marca_id, sede_id, usuario_asignado_id, estado_id, equipo_padre_id, created_by
          ) VALUES ('TI', $1, $2, $3, $4, $5, $6, $7, 1, $8, 'SEEDER');
        `, [
          monitorPlaca !== 'N/A' ? monitorPlaca : null,
          monitorSerial !== 'N/A' ? monitorSerial : null,
          `Monitor ${monitorMarca}`,
          getTipoId('Monitor'),
          monMarcaId,
          sedeId,
          usuarioId,
          equipoId,
        ]);
        totalTiEquipos++;
      }

      const tecladoMarca = (row['Teclado (Marca)'] || '').toString().trim();
      if (tecladoMarca && tecladoMarca !== 'N/A') {
        const tecMarcaId = await getOrInsertMarca(tecladoMarca.split(/[- ]+/)[0] || 'Genius');
        await client.query(`
          INSERT INTO equipos (modulo, modelo, tipo_equipo_id, marca_id, sede_id, usuario_asignado_id, estado_id, equipo_padre_id, created_by)
          VALUES ('TI', $1, $2, $3, $4, $5, 1, $6, 'SEEDER');
        `, [`Teclado ${tecladoMarca}`, getTipoId('Teclado'), tecMarcaId, sedeId, usuarioId, equipoId]);
        totalTiEquipos++;
      }

      const mouseMarca = (row['Mouse (Marca)'] || '').toString().trim();
      if (mouseMarca && mouseMarca !== 'N/A') {
        const mouseMarcaId = await getOrInsertMarca(mouseMarca.split(/[- ]+/)[0] || 'Genius');
        await client.query(`
          INSERT INTO equipos (modulo, modelo, tipo_equipo_id, marca_id, sede_id, usuario_asignado_id, estado_id, equipo_padre_id, created_by)
          VALUES ('TI', $1, $2, $3, $4, $5, 1, $6, 'SEEDER');
        `, [`Mouse ${mouseMarca}`, getTipoId('Mouse'), mouseMarcaId, sedeId, usuarioId, equipoId]);
        totalTiEquipos++;
      }
    }

    console.log(`✅ Inventarios TI procesado con éxito: ${totalTiEquipos} equipos y periféricos registrados.`);

    // 5. Mantenimientos de prueba
    console.log('5. Programando mantenimientos preventivos...');
    const randomEquipos = await client.query('SELECT id FROM equipos ORDER BY RANDOM() LIMIT 15');
    for (let i = 0; i < randomEquipos.rows.length; i++) {
      const eqId = randomEquipos.rows[i].id;
      const days = (i % 3 === 0) ? -5 : (i * 10 + 5);
      await client.query(`
        INSERT INTO mantenimientos (
          equipo_id, tipo, estado, fecha_programada, tecnico_responsable, descripcion_falla
        ) VALUES ($1, 'PREVENTIVO', 'PROGRAMADO', CURRENT_DATE + ($2 || ' days')::interval, 'Antonio Palmera', 'Mantenimiento preventivo periódico programado');
      `, [eqId, days]);
    }

    // 6. Simular usuario inactivo
    await client.query(`
      UPDATE usuarios_empleados
      SET ultimo_acceso = CURRENT_TIMESTAMP - INTERVAL '75 days', dias_inactividad_calculados = 75
      WHERE id IN (SELECT usuario_asignado_id FROM equipos WHERE usuario_asignado_id IS NOT NULL LIMIT 2);
    `);

    console.log('--- SEEDING COMPLETADO EXITOSAMENTE ---');
  } catch (err) {
    console.error('Error durante el seed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

runSeed();
