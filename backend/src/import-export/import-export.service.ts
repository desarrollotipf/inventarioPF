import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as XLSX from 'xlsx';

const cleanVal = (val: any): string | null => {
  if (val === undefined || val === null) return null;
  const str = String(val).trim();
  if (str === '' || str === 'N/A' || str === 'n/a' || str === 'NULL' || str === 'null') return null;
  return str;
};

@Injectable()
export class ImportExportService {
  private readonly logger = new Logger(ImportExportService.name);

  constructor(private readonly db: DatabaseService) {}

  async getPlantilla(modulo: string) {
    const wb = XLSX.utils.book_new();
    const mod = modulo.toUpperCase();

    if (mod === 'PDV') {
      const sampleData = [
        {
          'NUMERO': 1,
          'PDV': 'PDV 20 DE JULIO',
          'PC': 'AIO HP-20-C016LA-8CC6500SZN',
          'MONITOR': '',
          'PROCESADOR': 'INTEL CELERON J3060',
          'RAM': '8 GB DDR3',
          'DISCO': 'SSD 240 GB',
          'PLACA': '3547',
          'TECLADO': 'GENIUS - 3440',
          'MOUSE': 'HP - 3433',
          'IMPRESORA': 'EPSON U220 - 3432',
          'DVR': 'DAHUA 4 PUERTOS',
          'CAMARAS': '3 DAHUA',
          'CAJON MONEDERO': 'CAJON DYNAPOS',
          'MODEM': 'CLARO 5 PUERTOS',
          'TELEVISOR': 'LG 42 PULGADAS',
          'BASCULA DE PESO': 'TEK GALAXY',
          'UPS': 'APC 650VA',
          'ANYDESK': '514980022',
        },
      ];
      const ws = XLSX.utils.json_to_sheet(sampleData);
      XLSX.utils.book_append_sheet(wb, ws, 'Equipos PDV');
    } else {
      const sampleData = [
        {
          'NOMBRE DE COMPUTO': 'Soporte-TI',
          'Tipo de equipo': 'Portatil',
          'MODELO (COMPUTO)': 'HP 14 CM0XXX',
          'PLACA SISTEMAS (COMPUTO)': '1652',
          'PLACA INVENTARIO (COMPUTO)': '05337',
          'SERIAL (COMPUTO)': '5CG8384W79',
          'Procesador': 'AMD Ryzen 3 2200u',
          'TIPO (RAM)': 'DDR3',
          'CAPACIDAD (RAM)': '8 GB',
          'Tipo de disco': 'SSD',
          'CAPACIDAD (DISCO)': '240 GB',
          'ID ANYDESK': '1520566861',
          'Sistema Operativo': 'Windows 11 Home',
          'Software Base': 'Chrome - Office 365 - 7Zip - AnyDesk',
          'Usuario Asignado': 'Antonio Palmera',
          'PROCESO O OFICINA': 'Sistemas',
          'Ubicacion Fisica': 'Sede Administrativa',
          'Estado de Equipo (Computo)': 'Buen estado',
          'Accesorios': 'Cargador HP punta azul',
          'Marca (Monitor)': 'Lenovo',
          'Placa (Monitor)': 'M-1234',
          'Serial (Monitor)': 'SN-9988',
          'TECLADO (PLACA)': 'T-4455',
          'MOUSE (PLACA)': 'M-7788',
          'IMPRESORA (PLACA)': 'P-1122',
          'MODEM': 'CLARO',
          'TELEVISOR': 'LG',
          'DVR': 'DAHUA',
          'CAMARAS (PDV)': '',
          'CAJON MONEDERO (PDV)': '',
          'BASCULA (PDV)': '',
          'Foto de equipo (Computo)': '',
        },
      ];
      const ws = XLSX.utils.json_to_sheet(sampleData);
      XLSX.utils.book_append_sheet(wb, ws, 'Inventarios Sedes');
    }

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  async exportarEquipos(modulo?: string, sedeId?: number): Promise<Buffer> {
    const wb = XLSX.utils.book_new();
    const mod = (modulo || 'COMPLETO').toUpperCase();

    if (mod === 'PDV') {
      const pdvRows = await this.getEquiposPdvData(sedeId);
      const ws = XLSX.utils.json_to_sheet(pdvRows);
      XLSX.utils.book_append_sheet(wb, ws, 'Equipos PDV');
    } else if (mod === 'TI') {
      const tiRows = await this.getInventarioSedesData(sedeId);
      const ws = XLSX.utils.json_to_sheet(tiRows);
      XLSX.utils.book_append_sheet(wb, ws, 'Inventarios Sedes');
    } else {
      // Exportación Completa Consolidada
      const pdvRows = await this.getEquiposPdvData(sedeId);
      const wsPdv = XLSX.utils.json_to_sheet(pdvRows);
      XLSX.utils.book_append_sheet(wb, wsPdv, 'Equipos PDV');

      const tiRows = await this.getInventarioSedesData(sedeId);
      const wsTi = XLSX.utils.json_to_sheet(tiRows);
      XLSX.utils.book_append_sheet(wb, wsTi, 'Inventarios Sedes TI');

      const sedesRows = await this.getSedesData();
      const wsSedes = XLSX.utils.json_to_sheet(sedesRows);
      XLSX.utils.book_append_sheet(wb, wsSedes, 'Catálogo de Sedes');

      const mantenimientosRows = await this.getMantenimientosData();
      const wsMant = XLSX.utils.json_to_sheet(mantenimientosRows);
      XLSX.utils.book_append_sheet(wb, wsMant, 'Mantenimientos');
    }

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  private async getEquiposPdvData(sedeId?: number) {
    let sql = `
      SELECT 
        p.numero as "N°",
        p.pdv_nombre as "Punto de Venta (PDV)",
        COALESCE(s.ciudad, 'Bogotá') as "Ciudad",
        p.pc_modelo as "Modelo PC",
        p.pc_placa as "Placa PC",
        p.procesador as "Procesador",
        p.ram as "RAM",
        p.disco as "Disco",
        p.monitor as "Monitor",
        p.teclado as "Teclado",
        p.mouse as "Mouse",
        p.impresora as "Impresora POS",
        p.dvr as "DVR",
        p.camaras as "Cámaras CCTV",
        p.cajon_monedero as "Cajón Monedero",
        p.modem as "Módem",
        p.televisor as "Televisor",
        p.bascula_peso as "Báscula",
        p.ups as "UPS",
        p.anydesk as "AnyDesk ID",
        p.estado as "Estado"
      FROM equipos_pdv p
      LEFT JOIN sedes s ON p.sede_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (sedeId) {
      params.push(sedeId);
      sql += ` AND p.sede_id = $${params.length}`;
    }
    sql += ` ORDER BY p.numero ASC NULLS LAST, p.pdv_nombre ASC`;

    const res = await this.db.query(sql, params);
    return res.rows;
  }

  private async getInventarioSedesData(sedeId?: number) {
    let sql = `
      SELECT 
        e.id as "ID",
        e.nombre_computo as "Nombre Computo / Hostname",
        e.tipo_equipo as "Tipo Equipo",
        e.modelo_computo as "Modelo Computo",
        e.placa_sistemas as "Placa Sistemas",
        e.placa_inventario as "Placa Inventario",
        e.serial_computo as "Serial",
        e.procesador as "Procesador",
        e.ram_tipo as "Tipo RAM",
        e.ram_capacidad as "RAM Capacidad",
        e.disco_tipo as "Tipo Disco",
        e.disco_capacidad as "Disco Capacidad",
        e.id_anydesk as "AnyDesk ID",
        e.sistema_operativo as "Sistema Operativo",
        e.software_base as "Software Base",
        e.usuario_asignado as "Usuario Asignado",
        e.proceso_oficina as "Proceso / Oficina",
        e.ubicacion_fisica as "Ubicación Física",
        COALESCE(s.ciudad, 'Bogotá') as "Ciudad",
        e.estado_equipo as "Estado Equipo",
        e.accesorios as "Accesorios",
        e.monitor_marca as "Marca Monitor",
        e.monitor_placa as "Placa Monitor",
        e.monitor_serial as "Serial Monitor",
        e.teclado_placa as "Placa Teclado",
        e.mouse_placa as "Placa Mouse",
        e.impresora_placa as "Placa Impresora",
        e.modem as "Módem",
        e.televisor as "Televisor",
        e.dvr as "DVR",
        e.camaras as "Cámaras",
        e.cajon_monedero as "Cajón Monedero",
        e.bascula as "Báscula",
        e.foto_url as "Foto URL"
      FROM inventario_sedes e
      LEFT JOIN sedes s ON e.sede_id = s.id
      WHERE (
        (COALESCE(e.ubicacion_fisica, '') NOT ILIKE '%pdv%' AND COALESCE(e.proceso_oficina, '') NOT ILIKE '%pdv%' AND COALESCE(e.ubicacion_fisica, '') NOT ILIKE '%punto express%' AND COALESCE(e.proceso_oficina, '') NOT ILIKE '%punto express%')
        OR e.id = 2
      )
    `;
    const params: any[] = [];
    if (sedeId) {
      params.push(sedeId);
      sql += ` AND e.sede_id = $${params.length}`;
    }
    sql += ` ORDER BY s.nombre ASC NULLS LAST, e.id ASC`;

    const res = await this.db.query(sql, params);
    return res.rows;
  }

  private async getSedesData() {
    const res = await this.db.query(`
      SELECT 
        id as "ID",
        nombre as "Nombre Sede / PDV",
        tipo as "Tipo",
        ciudad as "Ciudad",
        direccion as "Dirección",
        telefono as "Teléfono",
        CASE WHEN activo THEN 'ACTIVO' ELSE 'INACTIVO' END as "Estado"
      FROM sedes
      ORDER BY tipo ASC, nombre ASC
    `);
    return res.rows;
  }

  private async getMantenimientosData() {
    const res = await this.db.query(`
      SELECT 
        m.id as "ID",
        m.origen as "Módulo (SEDE / PDV)",
        m.registro_id as "ID Registro",
        m.tipo as "Tipo Mantenimiento",
        m.descripcion as "Descripción",
        m.tecnico_responsable as "Técnico Responsable",
        m.estado as "Estado",
        m.fecha_programada as "Fecha Programada",
        m.fecha_realizado as "Fecha Realizado"
      FROM mantenimientos m
      ORDER BY m.created_at DESC
    `);
    return res.rows;
  }

  async importarExcel(fileBuffer: Buffer, modulo?: string) {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new BadRequestException('El archivo Excel está vacío o es inválido.');
    }

    let wb: XLSX.WorkBook;
    try {
      wb = XLSX.read(fileBuffer, { type: 'buffer' });
    } catch (e: any) {
      throw new BadRequestException('No se pudo leer el archivo Excel. Formato no compatible.');
    }

    if (!wb.SheetNames || wb.SheetNames.length === 0) {
      throw new BadRequestException('El archivo Excel no contiene hojas de cálculo.');
    }

    // 1. Pre-cargar sedes en un mapa en memoria
    const sedesRes = await this.db.query('SELECT id, nombre FROM sedes');
    const sedesMap = new Map<string, number>();
    for (const s of sedesRes.rows) {
      if (s.nombre) sedesMap.set(s.nombre.toLowerCase().trim(), s.id);
    }

    // 2. Pre-cargar índices de Equipos PDV existentes en memoria
    const pdvExistingRes = await this.db.query('SELECT id, pdv_nombre, pc_placa FROM equipos_pdv');
    const pdvByNameMap = new Map<string, number>();
    const pdvByPlacaMap = new Map<string, number>();
    for (const p of pdvExistingRes.rows) {
      if (p.pdv_nombre) pdvByNameMap.set(p.pdv_nombre.toLowerCase().trim(), p.id);
      if (p.pc_placa) pdvByPlacaMap.set(p.pc_placa.toLowerCase().trim(), p.id);
    }

    // 3. Pre-cargar índices de Inventario Sedes existentes en memoria
    const sedesExistingRes = await this.db.query(
      'SELECT id, placa_sistemas, placa_inventario, serial_computo, nombre_computo FROM inventario_sedes',
    );
    const sedeByPlacaSistemasMap = new Map<string, number>();
    const sedeByPlacaInvMap = new Map<string, number>();
    const sedeBySerialMap = new Map<string, number>();
    const sedeByHostnameMap = new Map<string, number>();
    for (const s of sedesExistingRes.rows) {
      if (s.placa_sistemas) sedeByPlacaSistemasMap.set(s.placa_sistemas.toLowerCase().trim(), s.id);
      if (s.placa_inventario) sedeByPlacaInvMap.set(s.placa_inventario.toLowerCase().trim(), s.id);
      if (s.serial_computo) sedeBySerialMap.set(s.serial_computo.toLowerCase().trim(), s.id);
      if (s.nombre_computo) sedeByHostnameMap.set(s.nombre_computo.toLowerCase().trim(), s.id);
    }

    const report = {
      success: true,
      procesados: 0,
      insertados: 0,
      actualizados: 0,
      totalFilas: 0,
      detalles: {
        pdv: { insertados: 0, actualizados: 0 },
        sedes: { insertados: 0, actualizados: 0 },
      },
      errores: [] as { fila: number; hoja: string; error: string; data?: any }[],
    };

    const targetModulo = modulo ? modulo.toUpperCase().trim() : null;

    // Procesar cada hoja del libro
    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: null });

      if (!rows || rows.length === 0) continue;

      const sheetLower = sheetName.toLowerCase().trim();
      const firstRow = rows[0] || {};
      const keys = Object.keys(firstRow).map(k => k.toLowerCase().trim());

      const isPdvSheet =
        targetModulo === 'PDV' ||
        sheetLower.includes('pdv') ||
        keys.includes('pdv') ||
        keys.includes('punto de venta');

      const isSedesSheet =
        targetModulo === 'TI' ||
        sheetLower.includes('sedes') ||
        sheetLower.includes('inventario') ||
        keys.includes('ubicacion fisica') ||
        keys.includes('nombre de computo') ||
        keys.includes('usuario asignado');

      if (targetModulo === 'PDV' && isPdvSheet) {
        await this.procesarFilasPdv(rows, sheetName, sedesMap, pdvByNameMap, pdvByPlacaMap, report);
      } else if (targetModulo === 'TI' && isSedesSheet) {
        await this.procesarFilasSedes(
          rows,
          sheetName,
          sedesMap,
          sedeByPlacaSistemasMap,
          sedeByPlacaInvMap,
          sedeBySerialMap,
          sedeByHostnameMap,
          report,
        );
      } else if (!targetModulo || targetModulo === 'AUTO' || targetModulo === 'COMPLETO') {
        if (isPdvSheet) {
          await this.procesarFilasPdv(rows, sheetName, sedesMap, pdvByNameMap, pdvByPlacaMap, report);
        } else if (isSedesSheet) {
          await this.procesarFilasSedes(
            rows,
            sheetName,
            sedesMap,
            sedeByPlacaSistemasMap,
            sedeByPlacaInvMap,
            sedeBySerialMap,
            sedeByHostnameMap,
            report,
          );
        }
      }
    }

    report.procesados = report.insertados + report.actualizados;

    if (report.totalFilas === 0) {
      throw new BadRequestException(
        'No se encontraron filas de datos reconocibles en el archivo. Verifica el formato de columnas o descarga las plantillas de ejemplo.',
      );
    }

    return report;
  }

  private async resolverSedeId(
    nombreSede: string | null,
    tipo: 'PDV' | 'SEDE_ADMINISTRATIVA',
    sedesMap: Map<string, number>,
  ): Promise<number | null> {
    if (!nombreSede) return null;
    const cleanNombre = nombreSede.trim();
    const key = cleanNombre.toLowerCase();

    if (sedesMap.has(key)) {
      return sedesMap.get(key)!;
    }

    let ciudad = 'Bogotá';
    const nLower = cleanNombre.toLowerCase();
    if (nLower.includes('soacha')) ciudad = 'Soacha';
    else if (nLower.includes('fusagasuga') || nLower.includes('fusagasugá')) ciudad = 'Fusagasugá';
    else if (nLower.includes('tunja')) ciudad = 'Tunja';
    else if (nLower.includes('chiquinquira') || nLower.includes('chiquinquirá')) ciudad = 'Chiquinquirá';
    else if (nLower.includes('yopal')) ciudad = 'Yopal';

    try {
      const insRes = await this.db.query(
        `INSERT INTO sedes (nombre, tipo, ciudad, activo)
         VALUES ($1, $2, $3, true)
         ON CONFLICT (nombre) DO UPDATE SET tipo = EXCLUDED.tipo
         RETURNING id, nombre`,
        [cleanNombre, tipo, ciudad],
      );
      const newId = insRes.rows[0].id;
      sedesMap.set(key, newId);
      return newId;
    } catch (e) {
      this.logger.error(`Error al crear sede: ${cleanNombre}`, e);
      return null;
    }
  }

  private async procesarFilasPdv(
    rows: any[],
    sheetName: string,
    sedesMap: Map<string, number>,
    pdvByNameMap: Map<string, number>,
    pdvByPlacaMap: Map<string, number>,
    report: any,
  ) {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const filaNum = i + 2;

      const pdvNom = cleanVal(row['PDV'] || row['Punto de Venta'] || row['Punto de Venta (PDV)'] || row['pdv_nombre']);
      const pcModelo = cleanVal(row['PC'] || row['Modelo PC'] || row['pc_modelo'] || row['Computador']);
      const pcPlaca = cleanVal(row['PLACA'] || row['Placa PC'] || row['pc_placa'] || row['Placa']);

      if (!pdvNom && !pcModelo && !pcPlaca) {
        continue; // Fila vacía en Excel
      }

      report.totalFilas++;

      try {
        const sedeId = await this.resolverSedeId(pdvNom, 'PDV', sedesMap);
        const numero = row['NUMERO'] || row['N°'] || row['numero'] ? parseInt(row['NUMERO'] || row['N°'] || row['numero'], 10) : null;

        // Búsqueda instantánea en mapas en memoria
        let existingId: number | null = null;
        if (pdvNom && pdvByNameMap.has(pdvNom.toLowerCase())) {
          existingId = pdvByNameMap.get(pdvNom.toLowerCase())!;
        } else if (pcPlaca && pdvByPlacaMap.has(pcPlaca.toLowerCase())) {
          existingId = pdvByPlacaMap.get(pcPlaca.toLowerCase())!;
        }

        const procesador = cleanVal(row['PROCESADOR'] || row['Procesador'] || row['procesador']);
        const ram = cleanVal(row['RAM'] || row['ram']);
        const disco = cleanVal(row['DISCO'] || row['Disco'] || row['disco']);
        const monitor = cleanVal(row['MONITOR'] || row['Monitor'] || row['monitor']);
        const teclado = cleanVal(row['TECLADO'] || row['Teclado'] || row['teclado']);
        const mouse = cleanVal(row['MOUSE'] || row['Mouse'] || row['mouse']);
        const impresora = cleanVal(row['IMPRESORA'] || row['Impresora POS'] || row['Impresora'] || row['impresora']);
        const dvr = cleanVal(row['DVR'] || row['dvr']);
        const camaras = cleanVal(row['CAMARAS'] || row['Cámaras CCTV'] || row['Cámaras'] || row['camaras']);
        const cajon = cleanVal(row['CAJON MONEDERO'] || row['Cajón Monedero'] || row['cajon_monedero']);
        const modem = cleanVal(row['MODEM'] || row['Módem'] || row['modem']);
        const televisor = cleanVal(row['TELEVISOR'] || row['Televisor'] || row['televisor']);
        const bascula = cleanVal(row['BASCULA DE PESO'] || row['Báscula'] || row['bascula_peso'] || row['BASCULA']);
        const ups = cleanVal(row['UPS'] || row['ups']);
        const anydesk = cleanVal(row['ANYDESK'] || row['AnyDesk ID'] || row['anydesk']);
        const estado = cleanVal(row['ESTADO'] || row['Estado'] || row['estado']) || 'OPERATIVO';

        if (existingId) {
          // Actualizar registro existente
          await this.db.query(
            `UPDATE equipos_pdv SET
              numero = COALESCE($1, numero),
              pdv_nombre = COALESCE($2, pdv_nombre),
              sede_id = COALESCE($3, sede_id),
              pc_modelo = COALESCE($4, pc_modelo),
              monitor = COALESCE($5, monitor),
              procesador = COALESCE($6, procesador),
              ram = COALESCE($7, ram),
              disco = COALESCE($8, disco),
              pc_placa = COALESCE($9, pc_placa),
              teclado = COALESCE($10, teclado),
              mouse = COALESCE($11, mouse),
              impresora = COALESCE($12, impresora),
              dvr = COALESCE($13, dvr),
              camaras = COALESCE($14, camaras),
              cajon_monedero = COALESCE($15, cajon_monedero),
              modem = COALESCE($16, modem),
              televisor = COALESCE($17, televisor),
              bascula_peso = COALESCE($18, bascula_peso),
              ups = COALESCE($19, ups),
              anydesk = COALESCE($20, anydesk),
              estado = COALESCE($21, estado),
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $22`,
            [
              numero, pdvNom, sedeId, pcModelo, monitor, procesador, ram, disco,
              pcPlaca, teclado, mouse, impresora, dvr, camaras, cajon, modem,
              televisor, bascula, ups, anydesk, estado, existingId,
            ],
          );
          report.actualizados++;
          report.detalles.pdv.actualizados++;
        } else {
          // Insertar nuevo registro
          const insRes = await this.db.query(
            `INSERT INTO equipos_pdv (
              numero, pdv_nombre, sede_id, pc_modelo, monitor, procesador,
              ram, disco, pc_placa, teclado, mouse, impresora, dvr, camaras,
              cajon_monedero, modem, televisor, bascula_peso, ups, anydesk, estado
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
              $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
            ) RETURNING id`,
            [
              numero, pdvNom || 'PDV Sin Nombre', sedeId, pcModelo, monitor, procesador,
              ram, disco, pcPlaca, teclado, mouse, impresora, dvr, camaras,
              cajon, modem, televisor, bascula, ups, anydesk, estado,
            ],
          );
          const newPdvId = insRes.rows[0].id;
          if (pdvNom) pdvByNameMap.set(pdvNom.toLowerCase(), newPdvId);
          if (pcPlaca) pdvByPlacaMap.set(pcPlaca.toLowerCase(), newPdvId);

          report.insertados++;
          report.detalles.pdv.insertados++;
        }
      } catch (err: any) {
        report.errores.push({
          fila: filaNum,
          hoja: sheetName,
          error: err.message,
          data: row,
        });
      }
    }
  }

  private async procesarFilasSedes(
    rows: any[],
    sheetName: string,
    sedesMap: Map<string, number>,
    sedeByPlacaSistemasMap: Map<string, number>,
    sedeByPlacaInvMap: Map<string, number>,
    sedeBySerialMap: Map<string, number>,
    sedeByHostnameMap: Map<string, number>,
    report: any,
  ) {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const filaNum = i + 2;

      const nombreComputo = cleanVal(row['NOMBRE DE COMPUTO'] || row['Nombre Computo'] || row['nombre_computo'] || row['Hostname']);
      const modeloComputo = cleanVal(row['MODELO (COMPUTO)'] || row['Modelo Computo'] || row['modelo_computo'] || row['Modelo']);
      const placaSistemas = cleanVal(row['PLACA SISTEMAS (COMPUTO)'] || row['Placa Sistemas'] || row['placa_sistemas']);
      const placaInventario = cleanVal(row['PLACA INVENTARIO (COMPUTO)'] || row['Placa Inventario'] || row['placa_inventario']);
      const serialComputo = cleanVal(row['SERIAL (COMPUTO)'] || row['Serial'] || row['serial_computo']);
      const ubicacionFisica = cleanVal(row['Ubicacion Fisica'] || row['Ubicación Física'] || row['ubicacion_fisica'] || row['Sede']);
      const procesoOficina = cleanVal(row['PROCESO O OFICINA'] || row['Proceso / Oficina'] || row['proceso_oficina'] || row['Area']);

      // Evitar que puestos que pertenecen a PDV se registren en inventario sedes
      if (
        (ubicacionFisica && (ubicacionFisica.toLowerCase().includes('pdv') || ubicacionFisica.toLowerCase().includes('punto express'))) ||
        (procesoOficina && (procesoOficina.toLowerCase().includes('pdv') || procesoOficina.toLowerCase().includes('punto express')))
      ) {
        continue;
      }

      if (!nombreComputo && !modeloComputo && !placaSistemas && !placaInventario && !serialComputo) {
        continue; // Fila vacía
      }

      report.totalFilas++;

      try {
        const sedeId = await this.resolverSedeId(ubicacionFisica, 'SEDE_ADMINISTRATIVA', sedesMap);

        // Búsqueda instantánea en mapas en memoria
        let existingId: number | null = null;
        if (placaSistemas && sedeByPlacaSistemasMap.has(placaSistemas.toLowerCase())) {
          existingId = sedeByPlacaSistemasMap.get(placaSistemas.toLowerCase())!;
        } else if (placaInventario && sedeByPlacaInvMap.has(placaInventario.toLowerCase())) {
          existingId = sedeByPlacaInvMap.get(placaInventario.toLowerCase())!;
        } else if (serialComputo && sedeBySerialMap.has(serialComputo.toLowerCase())) {
          existingId = sedeBySerialMap.get(serialComputo.toLowerCase())!;
        } else if (nombreComputo && sedeByHostnameMap.has(nombreComputo.toLowerCase())) {
          existingId = sedeByHostnameMap.get(nombreComputo.toLowerCase())!;
        }

        const tipoEquipo = cleanVal(row['Tipo de equipo'] || row['Tipo Equipo'] || row['tipo_equipo'] || 'Portatil');
        const procesador = cleanVal(row['Procesador'] || row['PROCESADOR'] || row['procesador']);
        const ramTipo = cleanVal(row['TIPO (RAM)'] || row['Tipo RAM'] || row['ram_tipo']);
        const ramCapacidad = cleanVal(row['CAPACIDAD (RAM)'] || row['RAM Capacidad'] || row['ram_capacidad'] || row['RAM']);
        const discoTipo = cleanVal(row['Tipo de disco'] || row['Tipo Disco'] || row['disco_tipo']);
        const discoCapacidad = cleanVal(row['CAPACIDAD (DISCO)'] || row['Disco Capacidad'] || row['disco_capacidad'] || row['Disco']);
        const anydesk = cleanVal(row['ID ANYDESK'] || row['AnyDesk ID'] || row['id_anydesk'] || row['Anydesk']);
        const so = cleanVal(row['Sistema Operativo'] || row['sistema_operativo']);
        const softwareBase = cleanVal(row['Software Base'] || row['software_base']);
        const usuarioAsignado = cleanVal(row['Usuario Asignado'] || row['usuario_asignado']);
        const estadoEquipo = cleanVal(row['Estado de Equipo (Computo)'] || row['Estado'] || row['estado_equipo']) || 'Buen estado';
        const accesorios = cleanVal(row['Accesorios'] || row['accesorios']);
        const fotoUrl = cleanVal(row['Foto de equipo (Computo)'] || row['Foto URL'] || row['foto_url']);

        const monitorMarca = cleanVal(row['Marca (Monitor)'] || row['monitor_marca']);
        const monitorPlaca = cleanVal(row['Placa (Monitor)'] || row['monitor_placa']);
        const monitorSerial = cleanVal(row['Serial (Monitor)'] || row['monitor_serial']);
        const tecladoPlaca = cleanVal(row['TECLADO (PLACA)'] || row['teclado_placa']);
        const mousePlaca = cleanVal(row['MOUSE (PLACA)'] || row['mouse_placa']);
        const impresoraPlaca = cleanVal(row['IMPRESORA (PLACA)'] || row['impresora_placa']);
        const modem = cleanVal(row['MODEM'] || row['modem']);
        const televisor = cleanVal(row['TELEVISOR'] || row['televisor']);
        const dvr = cleanVal(row['DVR'] || row['dvr']);
        const camaras = cleanVal(row['CAMARAS (PDV)'] || row['camaras']);
        const cajonMonedero = cleanVal(row['CAJON MONEDERO (PDV)'] || row['cajon_monedero']);
        const bascula = cleanVal(row['BASCULA (PDV)'] || row['bascula']);

        if (existingId) {
          // Actualizar
          await this.db.query(
            `UPDATE inventario_sedes SET
              nombre_computo = COALESCE($1, nombre_computo),
              tipo_equipo = COALESCE($2, tipo_equipo),
              modelo_computo = COALESCE($3, modelo_computo),
              placa_sistemas = COALESCE($4, placa_sistemas),
              placa_inventario = COALESCE($5, placa_inventario),
              serial_computo = COALESCE($6, serial_computo),
              procesador = COALESCE($7, procesador),
              ram_tipo = COALESCE($8, ram_tipo),
              ram_capacidad = COALESCE($9, ram_capacidad),
              disco_tipo = COALESCE($10, disco_tipo),
              disco_capacidad = COALESCE($11, disco_capacidad),
              id_anydesk = COALESCE($12, id_anydesk),
              sistema_operativo = COALESCE($13, sistema_operativo),
              software_base = COALESCE($14, software_base),
              usuario_asignado = COALESCE($15, usuario_asignado),
              proceso_oficina = COALESCE($16, proceso_oficina),
              ubicacion_fisica = COALESCE($17, ubicacion_fisica),
              sede_id = COALESCE($18, sede_id),
              estado_equipo = COALESCE($19, estado_equipo),
              foto_url = COALESCE($20, foto_url),
              accesorios = COALESCE($21, accesorios),
              monitor_marca = COALESCE($22, monitor_marca),
              monitor_placa = COALESCE($23, monitor_placa),
              monitor_serial = COALESCE($24, monitor_serial),
              teclado_placa = COALESCE($25, teclado_placa),
              mouse_placa = COALESCE($26, mouse_placa),
              impresora_placa = COALESCE($27, impresora_placa),
              modem = COALESCE($28, modem),
              televisor = COALESCE($29, televisor),
              dvr = COALESCE($30, dvr),
              camaras = COALESCE($31, camaras),
              cajon_monedero = COALESCE($32, cajon_monedero),
              bascula = COALESCE($33, bascula),
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $34`,
            [
              nombreComputo, tipoEquipo, modeloComputo, placaSistemas, placaInventario,
              serialComputo, procesador, ramTipo, ramCapacidad, discoTipo,
              discoCapacidad, anydesk, so, softwareBase, usuarioAsignado,
              procesoOficina, ubicacionFisica, sedeId, estadoEquipo, fotoUrl,
              accesorios, monitorMarca, monitorPlaca, monitorSerial, tecladoPlaca,
              mousePlaca, impresoraPlaca, modem, televisor, dvr,
              camaras, cajonMonedero, bascula, existingId,
            ],
          );
          report.actualizados++;
          report.detalles.sedes.actualizados++;
        } else {
          // Insertar
          const insRes = await this.db.query(
            `INSERT INTO inventario_sedes (
              nombre_computo, tipo_equipo, modelo_computo, placa_sistemas, placa_inventario,
              serial_computo, procesador, ram_tipo, ram_capacidad, disco_tipo,
              disco_capacidad, id_anydesk, sistema_operativo, software_base, usuario_asignado,
              proceso_oficina, ubicacion_fisica, sede_id, estado_equipo, foto_url,
              accesorios, monitor_marca, monitor_placa, monitor_serial, teclado_placa,
              mouse_placa, impresora_placa, modem, televisor, dvr,
              camaras, cajon_monedero, bascula
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
              $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
              $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
              $31, $32, $33
            ) RETURNING id`,
            [
              nombreComputo, tipoEquipo, modeloComputo, placaSistemas, placaInventario,
              serialComputo, procesador, ramTipo, ramCapacidad, discoTipo,
              discoCapacidad, anydesk, so, softwareBase, usuarioAsignado,
              procesoOficina, ubicacionFisica, sedeId, estadoEquipo, fotoUrl,
              accesorios, monitorMarca, monitorPlaca, monitorSerial, tecladoPlaca,
              mousePlaca, impresoraPlaca, modem, televisor, dvr,
              camaras, cajonMonedero, bascula,
            ],
          );
          const newSedeId = insRes.rows[0].id;
          if (placaSistemas) sedeByPlacaSistemasMap.set(placaSistemas.toLowerCase(), newSedeId);
          if (placaInventario) sedeByPlacaInvMap.set(placaInventario.toLowerCase(), newSedeId);
          if (serialComputo) sedeBySerialMap.set(serialComputo.toLowerCase(), newSedeId);
          if (nombreComputo) sedeByHostnameMap.set(nombreComputo.toLowerCase(), newSedeId);

          report.insertados++;
          report.detalles.sedes.insertados++;
        }
      } catch (err: any) {
        report.errores.push({
          fila: filaNum,
          hoja: sheetName,
          error: err.message,
          data: row,
        });
      }
    }
  }
}
