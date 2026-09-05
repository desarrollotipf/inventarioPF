import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface FilterEquiposDto {
  sede?: string;
  sede_id?: number;
  proceso?: string;
  tipo_equipo?: string;
  estado?: string;
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class InventarioTiService {
  constructor(private readonly db: DatabaseService) {}

  async getEquipos(filters: FilterEquiposDto) {
    const page = filters.page ? Math.max(1, Number(filters.page)) : 1;
    const limit = filters.limit ? Math.max(1, Number(filters.limit)) : 25;
    const offset = (page - 1) * limit;

    let whereConditions: string[] = [
      '1=1',
      `(
        (COALESCE(e.ubicacion_fisica, '') NOT ILIKE '%pdv%' AND COALESCE(e.proceso_oficina, '') NOT ILIKE '%pdv%' AND COALESCE(e.ubicacion_fisica, '') NOT ILIKE '%punto express%' AND COALESCE(e.proceso_oficina, '') NOT ILIKE '%punto express%')
        OR e.id = 2
      )`
    ];
    const params: any[] = [];

    if (filters.sede_id) {
      params.push(Number(filters.sede_id));
      whereConditions.push(`e.sede_id = $${params.length}`);
    }

    if (filters.sede) {
      params.push(`%${filters.sede}%`);
      whereConditions.push(`e.ubicacion_fisica ILIKE $${params.length}`);
    }

    if (filters.proceso) {
      params.push(`%${filters.proceso}%`);
      whereConditions.push(`e.proceso_oficina ILIKE $${params.length}`);
    }

    if (filters.tipo_equipo) {
      params.push(`%${filters.tipo_equipo}%`);
      whereConditions.push(`e.tipo_equipo ILIKE $${params.length}`);
    }

    if (filters.estado) {
      params.push(`%${filters.estado}%`);
      whereConditions.push(`e.estado_equipo ILIKE $${params.length}`);
    }

    if (filters.search) {
      params.push(`%${filters.search}%`);
      const idx = params.length;
      whereConditions.push(`(
        e.nombre_computo ILIKE $${idx} OR 
        e.modelo_computo ILIKE $${idx} OR 
        e.placa_sistemas ILIKE $${idx} OR 
        e.placa_inventario ILIKE $${idx} OR 
        e.serial_computo ILIKE $${idx} OR 
        e.usuario_asignado ILIKE $${idx} OR 
        e.proceso_oficina ILIKE $${idx} OR 
        e.ubicacion_fisica ILIKE $${idx} OR 
        e.id_anydesk ILIKE $${idx}
      )`);
    }

    const whereClause = whereConditions.join(' AND ');

    // Total Count
    const countSql = `
      SELECT COUNT(e.id) as total 
      FROM inventario_sedes e
      WHERE ${whereClause}
    `;
    const countRes = await this.db.query(countSql, params);
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    // Rows
    const dataSql = `
      SELECT 
        e.*,
        s.ciudad as sede_ciudad
      FROM inventario_sedes e
      LEFT JOIN sedes s ON e.sede_id = s.id
      WHERE ${whereClause}
      ORDER BY e.id ASC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const dataRes = await this.db.query(dataSql, params);

    return {
      data: dataRes.rows,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getHojaDeVida(id: number) {
    return this.getEquipoById(id);
  }

  async getEquipoById(id: number) {
    const res = await this.db.query(`
      SELECT 
        e.*,
        s.ciudad as sede_ciudad,
        s.direccion as sede_direccion
      FROM inventario_sedes e
      LEFT JOIN sedes s ON e.sede_id = s.id
      WHERE e.id = $1
    `, [id]);

    if (res.rows.length === 0) {
      throw new NotFoundException(`Equipo de Sede con ID ${id} no encontrado`);
    }

    const eq = res.rows[0];

    // Periféricos relacionados reales
    const rawPerifericos: any[] = [];
    const hasVal = (v: any) => v !== null && v !== undefined && String(v).trim() !== '' && String(v).trim() !== 'N/A' && String(v).trim() !== 'null';

    const parseMarcaPlaca = (str: string | null) => {
      if (!hasVal(str)) return { marca: null, placa: null };
      const s = String(str).trim();
      if (s.includes('-')) {
        const parts = s.split('-');
        return { marca: parts[0].trim(), placa: parts.slice(1).join('-').trim() };
      }
      return { marca: s, placa: null };
    };

    if (hasVal(eq.monitor_marca) || hasVal(eq.monitor_placa) || hasVal(eq.monitor_serial)) {
      rawPerifericos.push({
        id: 1,
        tipo: 'Monitor',
        tipo_nombre: 'Monitor',
        marca: eq.monitor_marca || 'Genérico',
        marca_nombre: eq.monitor_marca || 'Genérico',
        modelo: 'Monitor de Visualización',
        placa: eq.monitor_placa || 'N/A',
        placa_inventario: eq.monitor_placa || 'N/A',
        serial: eq.monitor_serial || 'N/A',
        serial_fabricante: eq.monitor_serial || 'N/A',
      });
    }

    if (hasVal(eq.teclado_placa)) {
      const parsed = parseMarcaPlaca(eq.teclado_placa);
      rawPerifericos.push({
        id: 2,
        tipo: 'Teclado',
        tipo_nombre: 'Teclado USB',
        marca: parsed.marca || 'Genérico',
        marca_nombre: parsed.marca || 'Genérico',
        modelo: parsed.marca ? `Teclado ${parsed.marca}` : 'Teclado Estándar',
        placa: parsed.placa || (parsed.marca && /^\d+$/.test(parsed.marca) ? parsed.marca : 'N/A'),
        placa_inventario: parsed.placa || (parsed.marca && /^\d+$/.test(parsed.marca) ? parsed.marca : 'N/A'),
        serial: 'N/A',
        serial_fabricante: 'N/A',
      });
    }

    if (hasVal(eq.mouse_placa)) {
      const parsed = parseMarcaPlaca(eq.mouse_placa);
      rawPerifericos.push({
        id: 3,
        tipo: 'Mouse',
        tipo_nombre: 'Mouse Óptico',
        marca: parsed.marca || 'Genérico',
        marca_nombre: parsed.marca || 'Genérico',
        modelo: parsed.marca ? `Mouse ${parsed.marca}` : 'Mouse Óptico USB',
        placa: parsed.placa || (parsed.marca && /^\d+$/.test(parsed.marca) ? parsed.marca : 'N/A'),
        placa_inventario: parsed.placa || (parsed.marca && /^\d+$/.test(parsed.marca) ? parsed.marca : 'N/A'),
        serial: 'N/A',
        serial_fabricante: 'N/A',
      });
    }

    if (hasVal(eq.impresora_placa)) {
      const parsed = parseMarcaPlaca(eq.impresora_placa);
      rawPerifericos.push({
        id: 4,
        tipo: 'Impresora',
        tipo_nombre: 'Impresora',
        marca: parsed.marca || 'Genérico',
        marca_nombre: parsed.marca || 'Genérico',
        modelo: 'Impresora Térmica / POS',
        placa: parsed.placa || 'N/A',
        placa_inventario: parsed.placa || 'N/A',
        serial: 'N/A',
        serial_fabricante: 'N/A',
      });
    }

    if (hasVal(eq.modem)) {
      rawPerifericos.push({
        id: 5,
        tipo: 'Modem',
        tipo_nombre: 'Módem / Router',
        marca: 'Comunicaciones',
        marca_nombre: 'Comunicaciones',
        modelo: eq.modem,
        placa: 'N/A',
        placa_inventario: 'N/A',
        serial: 'N/A',
        serial_fabricante: 'N/A',
      });
    }

    if (hasVal(eq.televisor)) {
      rawPerifericos.push({
        id: 6,
        tipo: 'Televisor',
        tipo_nombre: 'Pantalla / Televisor',
        marca: 'Multimedia',
        marca_nombre: 'Multimedia',
        modelo: eq.televisor,
        placa: 'N/A',
        placa_inventario: 'N/A',
        serial: 'N/A',
        serial_fabricante: 'N/A',
      });
    }

    if (hasVal(eq.dvr)) {
      rawPerifericos.push({
        id: 7,
        tipo: 'DVR',
        tipo_nombre: 'Grabador Digital (DVR)',
        marca: 'CCTV',
        marca_nombre: 'CCTV',
        modelo: eq.dvr,
        placa: 'N/A',
        placa_inventario: 'N/A',
        serial: 'N/A',
        serial_fabricante: 'N/A',
      });
    }

    if (hasVal(eq.camaras)) {
      rawPerifericos.push({
        id: 8,
        tipo: 'Cámaras',
        tipo_nombre: 'Cámaras de Seguridad',
        marca: 'CCTV',
        marca_nombre: 'CCTV',
        modelo: `${eq.camaras} cámaras instaladas`,
        placa: 'N/A',
        placa_inventario: 'N/A',
        serial: 'N/A',
        serial_fabricante: 'N/A',
      });
    }

    if (hasVal(eq.cajon_monedero)) {
      rawPerifericos.push({
        id: 9,
        tipo: 'Cajón Monedero',
        tipo_nombre: 'Cajón Monedero',
        marca: 'Comercial',
        marca_nombre: 'Comercial',
        modelo: eq.cajon_monedero,
        placa: 'N/A',
        placa_inventario: 'N/A',
        serial: 'N/A',
        serial_fabricante: 'N/A',
      });
    }

    if (hasVal(eq.bascula)) {
      rawPerifericos.push({
        id: 10,
        tipo: 'Báscula',
        tipo_nombre: 'Báscula Comercial',
        marca: 'Comercial',
        marca_nombre: 'Comercial',
        modelo: eq.bascula,
        placa: 'N/A',
        placa_inventario: 'N/A',
        serial: 'N/A',
        serial_fabricante: 'N/A',
      });
    }

    const perifericos = rawPerifericos;

    // Notas de Bitácora
    const notasRes = await this.db.query(`
      SELECT * FROM bitacora_notas 
      WHERE origen = 'SEDES' AND registro_id = $1 
      ORDER BY created_at DESC
    `, [id]);

    // Historial de Mantenimientos
    const mantenimientosRes = await this.db.query(`
      SELECT * FROM mantenimientos 
      WHERE origen = 'SEDES' AND registro_id = $1 
      ORDER BY created_at DESC
    `, [id]);

    return {
      equipo: {
        id: eq.id,
        nombre_computo: eq.nombre_computo,
        tipo_equipo: eq.tipo_equipo,
        marca: eq.marca || 'Genérica/OEM',
        modelo: eq.modelo_computo,
        placa_inventario: eq.placa_inventario,
        placa_sistemas: eq.placa_sistemas,
        serial_fabricante: eq.serial_computo,
        estado: eq.estado_equipo,
        usuario_asignado: eq.usuario_asignado,
        area_proceso: eq.proceso_oficina,
        sede: eq.ubicacion_fisica,
        sede_ciudad: eq.sede_ciudad,
        foto_url: eq.foto_url,
        fecha_creacion: eq.created_at,
        especificaciones: {
          procesador: eq.procesador,
          ram: `${eq.ram_tipo || ''} ${eq.ram_capacidad || ''}`.trim(),
          disco: `${eq.disco_tipo || ''} ${eq.disco_capacidad || ''}`.trim(),
          anydesk_id: eq.id_anydesk,
          so: eq.sistema_operativo,
          software_base: eq.software_base,
          accesorios: eq.accesorios,
        },
      },
      perifericos,
      movimientos: [],
      mantenimientos: mantenimientosRes.rows,
      notas: notasRes.rows,
    };
  }

  async getDashboardKpis() {
    const filterSedesClause = `
      (
        (COALESCE(ubicacion_fisica, '') NOT ILIKE '%pdv%' AND COALESCE(proceso_oficina, '') NOT ILIKE '%pdv%' AND COALESCE(ubicacion_fisica, '') NOT ILIKE '%punto express%' AND COALESCE(proceso_oficina, '') NOT ILIKE '%punto express%')
        OR id = 2
      )
    `;
    const totalSedesRes = await this.db.query(`SELECT COUNT(*) as total FROM inventario_sedes WHERE ${filterSedesClause};`);
    const totalPdvsRes = await this.db.query('SELECT COUNT(*) as total FROM equipos_pdv;');

    // Estados en Sedes
    const estadosRes = await this.db.query(`
      SELECT 
        estado_equipo as nombre, 
        COUNT(*) as total 
      FROM inventario_sedes 
      WHERE ${filterSedesClause}
      GROUP BY estado_equipo 
      ORDER BY total DESC;
    `);

    // Tipos de equipo
    const tiposRes = await this.db.query(`
      SELECT 
        tipo_equipo as nombre, 
        COUNT(*) as total 
      FROM inventario_sedes 
      WHERE tipo_equipo IS NOT NULL AND ${filterSedesClause}
      GROUP BY tipo_equipo 
      ORDER BY total DESC;
    `);

    // Discos SSD vs HDD
    const discosRes = await this.db.query(`
      SELECT 
        disco_tipo as tipo, 
        COUNT(*) as total 
      FROM inventario_sedes 
      WHERE disco_tipo IS NOT NULL AND ${filterSedesClause}
      GROUP BY disco_tipo 
      ORDER BY total DESC;
    `);

    // Cámaras totales en PDVs
    const camarasRes = await this.db.query(`
      SELECT 
        COUNT(*) as total_pdvs,
        COUNT(CASE WHEN dvr IS NOT NULL AND dvr != 'N/A' THEN 1 END) as pdvs_con_dvr,
        COUNT(CASE WHEN bascula_peso IS NOT NULL AND bascula_peso != 'N/A' THEN 1 END) as pdvs_con_bascula,
        COUNT(CASE WHEN cajon_monedero IS NOT NULL AND cajon_monedero != 'N/A' THEN 1 END) as pdvs_con_cajon,
        COUNT(CASE WHEN impresora IS NOT NULL AND impresora != 'N/A' THEN 1 END) as pdvs_con_impresora,
        COUNT(CASE WHEN anydesk IS NOT NULL AND anydesk != 'N/A' THEN 1 END) as pdvs_con_anydesk
      FROM equipos_pdv;
    `);

    return {
      modulos: [
        { modulo: 'Sedes TI', total: totalSedesRes.rows[0]?.total || 0 },
        { modulo: 'Puntos de Venta (PDV)', total: totalPdvsRes.rows[0]?.total || 0 },
      ],
      estados: estadosRes.rows.map(r => ({
        nombre: r.nombre,
        total: r.total,
        color_hex: r.nombre.toLowerCase().includes('buen') ? '#10B981' : '#F59E0B'
      })),
      tipos: tiposRes.rows,
      discos: discosRes.rows,
      pdv_stats: camarasRes.rows[0],
    };
  }

  async createEquipo(dto: any) {
    const res = await this.db.query(`
      INSERT INTO inventario_sedes (
        nombre_computo, tipo_equipo, modelo_computo, placa_sistemas, placa_inventario,
        serial_computo, procesador, ram_tipo, ram_capacidad, disco_tipo, disco_capacidad,
        id_anydesk, sistema_operativo, software_base, usuario_asignado, proceso_oficina,
        ubicacion_fisica, sede_id, estado_equipo, foto_url, accesorios,
        monitor_marca, monitor_placa, monitor_serial, teclado_placa, mouse_placa,
        impresora_placa, modem, televisor, dvr, camaras, cajon_monedero, bascula
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33
      ) RETURNING *;
    `, [
      dto.nombre_computo || null,
      dto.tipo_equipo || null,
      dto.modelo_computo || null,
      dto.placa_sistemas || null,
      dto.placa_inventario || null,
      dto.serial_computo || null,
      dto.procesador || null,
      dto.ram_tipo || null,
      dto.ram_capacidad || null,
      dto.disco_tipo || null,
      dto.disco_capacidad || null,
      dto.id_anydesk || null,
      dto.sistema_operativo || null,
      dto.software_base || null,
      dto.usuario_asignado || null,
      dto.proceso_oficina || null,
      dto.ubicacion_fisica || null,
      dto.sede_id ? Number(dto.sede_id) : null,
      dto.estado_equipo || 'Buen estado',
      dto.foto_url || null,
      dto.accesorios || null,
      dto.monitor_marca || null,
      dto.monitor_placa || null,
      dto.monitor_serial || null,
      dto.teclado_placa || null,
      dto.mouse_placa || null,
      dto.impresora_placa || null,
      dto.modem || null,
      dto.televisor || null,
      dto.dvr || null,
      dto.camaras || null,
      dto.cajon_monedero || null,
      dto.bascula || null,
    ]);
    return res.rows[0];
  }

  async updateEquipo(id: number, dto: any) {
    const fields: string[] = [];
    const params: any[] = [id];
    const allowedCols = [
      'nombre_computo', 'tipo_equipo', 'modelo_computo', 'placa_sistemas', 'placa_inventario',
      'serial_computo', 'procesador', 'ram_tipo', 'ram_capacidad', 'disco_tipo', 'disco_capacidad',
      'id_anydesk', 'sistema_operativo', 'software_base', 'usuario_asignado', 'proceso_oficina',
      'ubicacion_fisica', 'sede_id', 'estado_equipo', 'foto_url', 'accesorios',
      'monitor_marca', 'monitor_placa', 'monitor_serial', 'teclado_placa', 'mouse_placa',
      'impresora_placa', 'modem', 'televisor', 'dvr', 'camaras', 'cajon_monedero', 'bascula'
    ];

    for (const col of allowedCols) {
      if (dto[col] !== undefined) {
        params.push(dto[col]);
        fields.push(`${col} = $${params.length}`);
      }
    }

    if (fields.length === 0) {
      const existing = await this.db.query('SELECT * FROM inventario_sedes WHERE id = $1', [id]);
      return existing.rows[0];
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    const sql = `UPDATE inventario_sedes SET ${fields.join(', ')} WHERE id = $1 RETURNING *;`;
    const res = await this.db.query(sql, params);
    if (res.rows.length === 0) {
      throw new NotFoundException(`Equipo ID ${id} no encontrado`);
    }
    return res.rows[0];
  }

  async deleteEquipo(id: number) {
    await this.db.query(`DELETE FROM bitacora_notas WHERE origen = 'SEDE' AND registro_id = $1;`, [id]);
    await this.db.query(`DELETE FROM mantenimientos WHERE origen = 'SEDE' AND registro_id = $1;`, [id]);
    const res = await this.db.query(`DELETE FROM inventario_sedes WHERE id = $1 RETURNING id;`, [id]);
    if (res.rows.length === 0) {
      throw new NotFoundException(`Equipo ID ${id} no encontrado`);
    }
    return { success: true, id };
  }

  async addNota(id: number, autor: string, nota: string) {
    const res = await this.db.query(`
      INSERT INTO bitacora_notas (origen, registro_id, autor, nota)
      VALUES ('SEDE', $1, $2, $3)
      RETURNING *;
    `, [id, autor, nota]);
    return res.rows[0];
  }
}
