import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class CatalogosService {
  constructor(private readonly db: DatabaseService) {}

  async getSedes(tipo?: string) {
    let sql = 'SELECT * FROM sedes WHERE activo = true';
    const params: any[] = [];
    if (tipo) {
      sql += ' AND tipo = $1';
      params.push(tipo);
    }
    sql += ' ORDER BY nombre ASC';
    const res = await this.db.query(sql, params);
    return res.rows;
  }

  async getTiposEquipo(categoria?: string) {
    const res = await this.db.query(`
      SELECT DISTINCT tipo_equipo as id, tipo_equipo as nombre
      FROM inventario_sedes
      WHERE tipo_equipo IS NOT NULL AND tipo_equipo != ''
      ORDER BY tipo_equipo ASC;
    `);
    return res.rows;
  }

  async getProcesos() {
    const res = await this.db.query(`
      SELECT DISTINCT proceso_oficina as id, proceso_oficina as nombre
      FROM inventario_sedes
      WHERE proceso_oficina IS NOT NULL 
        AND proceso_oficina != ''
        AND proceso_oficina NOT ILIKE '%pdv%'
        AND proceso_oficina NOT ILIKE '%punto express%'
      ORDER BY proceso_oficina ASC;
    `);
    return res.rows;
  }

  async getMarcas() {
    const res = await this.db.query(`
      SELECT DISTINCT monitor_marca as id, monitor_marca as nombre
      FROM inventario_sedes
      WHERE monitor_marca IS NOT NULL AND monitor_marca != '' AND monitor_marca != 'N/A'
      ORDER BY monitor_marca ASC;
    `);
    return res.rows;
  }

  async getEstados() {
    const res = await this.db.query(`
      SELECT DISTINCT estado_equipo as id, estado_equipo as nombre
      FROM inventario_sedes
      WHERE estado_equipo IS NOT NULL AND estado_equipo != ''
      ORDER BY estado_equipo ASC;
    `);
    return res.rows;
  }

  async getEmpleados(sedeId?: number, estado?: string) {
    const res = await this.db.query(`
      SELECT DISTINCT usuario_asignado as id, usuario_asignado as nombre_completo, proceso_oficina as proceso
      FROM inventario_sedes
      WHERE usuario_asignado IS NOT NULL AND usuario_asignado != ''
      ORDER BY usuario_asignado ASC;
    `);
    return res.rows;
  }

  async globalSearch(q: string) {
    if (!q || !q.trim()) {
      return {
        query: '',
        total: 0,
        sedes_ti: [],
        puntos_venta: [],
        cctv: [],
        mantenimientos: [],
      };
    }

    const term = `%${q.trim()}%`;

    // 1. Sedes TI
    const sedesTiRes = await this.db.query(`
      SELECT 
        e.id,
        e.nombre_computo,
        e.modelo_computo,
        e.placa_sistemas,
        e.placa_inventario,
        e.serial_computo,
        e.usuario_asignado,
        e.ubicacion_fisica,
        e.id_anydesk,
        e.tipo_equipo,
        e.estado_equipo
      FROM inventario_sedes e
      WHERE (
        (COALESCE(e.ubicacion_fisica, '') NOT ILIKE '%pdv%' AND COALESCE(e.proceso_oficina, '') NOT ILIKE '%pdv%' AND COALESCE(e.ubicacion_fisica, '') NOT ILIKE '%punto express%' AND COALESCE(e.proceso_oficina, '') NOT ILIKE '%punto express%')
        OR e.id = 2
      ) AND (
        e.nombre_computo ILIKE $1 OR 
        e.modelo_computo ILIKE $1 OR 
        e.placa_sistemas ILIKE $1 OR 
        e.placa_inventario ILIKE $1 OR 
        e.serial_computo ILIKE $1 OR 
        e.usuario_asignado ILIKE $1 OR 
        e.ubicacion_fisica ILIKE $1 OR 
        e.id_anydesk ILIKE $1
      )
      ORDER BY e.id ASC
      LIMIT 12;
    `, [term]);

    // 2. Puntos de Venta (PDVs)
    const pdvRes = await this.db.query(`
      SELECT 
        p.id,
        p.numero,
        p.pdv_nombre,
        p.pc_modelo,
        p.pc_placa,
        p.anydesk,
        p.impresora,
        p.dvr,
        p.camaras,
        s.ciudad
      FROM equipos_pdv p
      LEFT JOIN sedes s ON p.sede_id = s.id
      WHERE 
        p.pdv_nombre ILIKE $1 OR 
        p.pc_modelo ILIKE $1 OR 
        p.pc_placa ILIKE $1 OR 
        p.anydesk ILIKE $1 OR 
        s.ciudad ILIKE $1 OR
        p.impresora ILIKE $1 OR
        p.dvr ILIKE $1
      ORDER BY p.numero ASC, p.id ASC
      LIMIT 12;
    `, [term]);

    // 3. CCTV (Equipos PDV con DVR o Cámaras)
    const cctvRes = await this.db.query(`
      SELECT 
        p.id,
        p.pdv_nombre,
        p.dvr,
        p.camaras,
        s.ciudad
      FROM equipos_pdv p
      LEFT JOIN sedes s ON p.sede_id = s.id
      WHERE (p.dvr IS NOT NULL AND p.dvr != '' AND p.dvr != 'N/A')
        AND (p.pdv_nombre ILIKE $1 OR p.dvr ILIKE $1 OR s.ciudad ILIKE $1)
      LIMIT 8;
    `, [term]);

    // 4. Mantenimientos
    let mantenimientosRes: any = { rows: [] };
    try {
      mantenimientosRes = await this.db.query(`
        SELECT 
          m.id,
          m.tipo,
          m.descripcion,
          m.tecnico_responsable,
          m.estado,
          m.fecha_programada,
          m.origen,
          m.registro_id,
          COALESCE(s_inv.nombre_computo, p_inv.pdv_nombre, 'Activo TI') as equipo_nombre
        FROM mantenimientos m
        LEFT JOIN inventario_sedes s_inv ON m.origen = 'SEDES' AND m.registro_id = s_inv.id
        LEFT JOIN equipos_pdv p_inv ON m.origen = 'PDV' AND m.registro_id = p_inv.id
        WHERE 
          m.descripcion ILIKE $1 OR 
          m.tecnico_responsable ILIKE $1 OR 
          m.tipo ILIKE $1 OR 
          COALESCE(s_inv.nombre_computo, '') ILIKE $1 OR 
          COALESCE(p_inv.pdv_nombre, '') ILIKE $1
        ORDER BY m.id DESC
        LIMIT 8;
      `, [term]);
    } catch {
      mantenimientosRes = { rows: [] };
    }

    const total = 
      sedesTiRes.rows.length + 
      pdvRes.rows.length + 
      cctvRes.rows.length + 
      mantenimientosRes.rows.length;

    return {
      query: q,
      total,
      sedes_ti: sedesTiRes.rows,
      puntos_venta: pdvRes.rows,
      cctv: cctvRes.rows,
      mantenimientos: mantenimientosRes.rows,
    };
  }

  async getConfiguraciones() {
    return [];
  }

  async updateConfiguracion(clave: string, valor: string) {
    return { clave, valor };
  }
}
