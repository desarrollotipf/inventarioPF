import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class MantenimientoService {
  constructor(private readonly db: DatabaseService) {}

  async getAllMantenimientos(filters: {
    estado?: string;
    tipo?: string;
    sede_id?: number;
    equipo_id?: number;
    tecnico?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
  }) {
    let sql = `
      SELECT 
        m.id,
        m.origen,
        m.registro_id,
        m.tipo,
        m.descripcion,
        m.descripcion as descripcion_falla,
        m.tecnico_responsable,
        m.estado,
        m.fecha_programada,
        m.fecha_realizado,
        m.created_at,
        COALESCE(s_inv.nombre_computo, p_inv.pdv_nombre, 'Activo TI') as equipo_nombre_estacion,
        COALESCE(s_inv.modelo_computo, p_inv.pc_modelo, 'Equipo Computo') as equipo_modelo,
        COALESCE(s_inv.placa_sistemas, s_inv.placa_inventario, p_inv.pc_placa, 'S/P') as equipo_placa,
        COALESCE(s_inv.serial_computo, 'S/S') as equipo_serial,
        COALESCE(s1.nombre, s2.nombre, s_inv.ubicacion_fisica, p_inv.pdv_nombre, 'Sede Pollo Fiesta') as sede_nombre,
        COALESCE(s1.ciudad, s2.ciudad, 'Bogotá') as sede_ciudad
      FROM mantenimientos m
      LEFT JOIN inventario_sedes s_inv ON m.origen = 'SEDE' AND m.registro_id = s_inv.id
      LEFT JOIN sedes s1 ON s_inv.sede_id = s1.id
      LEFT JOIN equipos_pdv p_inv ON m.origen = 'PDV' AND m.registro_id = p_inv.id
      LEFT JOIN sedes s2 ON p_inv.sede_id = s2.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.estado) {
      params.push(filters.estado);
      sql += ` AND m.estado = $${params.length}`;
    }

    if (filters.tipo) {
      params.push(filters.tipo);
      sql += ` AND m.tipo = $${params.length}`;
    }

    if (filters.tecnico) {
      params.push(`%${filters.tecnico}%`);
      sql += ` AND m.tecnico_responsable ILIKE $${params.length}`;
    }

    if (filters.fecha_desde) {
      params.push(filters.fecha_desde);
      sql += ` AND m.fecha_programada >= $${params.length}`;
    }

    if (filters.fecha_hasta) {
      params.push(filters.fecha_hasta);
      sql += ` AND m.fecha_programada <= $${params.length}`;
    }

    sql += ' ORDER BY m.fecha_programada DESC NULLS LAST, m.id DESC';
    const res = await this.db.query(sql, params);
    return res.rows;
  }

  async getMantenimientoById(id: number) {
    const res = await this.db.query(`
      SELECT 
        m.id,
        m.origen,
        m.registro_id,
        m.tipo,
        m.descripcion,
        m.descripcion as descripcion_falla,
        m.tecnico_responsable,
        m.estado,
        m.fecha_programada,
        m.fecha_realizado,
        m.created_at,
        COALESCE(s_inv.nombre_computo, p_inv.pdv_nombre, 'Activo TI') as equipo_nombre_estacion,
        COALESCE(s_inv.modelo_computo, p_inv.pc_modelo, 'Equipo Computo') as equipo_modelo,
        COALESCE(s_inv.placa_sistemas, s_inv.placa_inventario, p_inv.pc_placa, 'S/P') as equipo_placa,
        COALESCE(s_inv.serial_computo, 'S/S') as equipo_serial,
        COALESCE(s1.nombre, s2.nombre, s_inv.ubicacion_fisica, p_inv.pdv_nombre, 'Sede Pollo Fiesta') as sede_nombre
      FROM mantenimientos m
      LEFT JOIN inventario_sedes s_inv ON m.origen = 'SEDE' AND m.registro_id = s_inv.id
      LEFT JOIN sedes s1 ON s_inv.sede_id = s1.id
      LEFT JOIN equipos_pdv p_inv ON m.origen = 'PDV' AND m.registro_id = p_inv.id
      LEFT JOIN sedes s2 ON p_inv.sede_id = s2.id
      WHERE m.id = $1
    `, [id]);

    if (res.rows.length === 0) {
      throw new NotFoundException(`Mantenimiento con ID ${id} no encontrado`);
    }
    return res.rows[0];
  }

  async createMantenimiento(dto: any) {
    const origen = dto.origen || 'SEDE';
    const registro_id = dto.registro_id || dto.equipo_id || 1;
    const tipo = dto.tipo || 'PREVENTIVO';
    const descripcion = dto.descripcion || dto.descripcion_falla || 'Mantenimiento programado de equipo';
    const tecnico = dto.tecnico_responsable || 'Técnico Soporte TI';
    const estado = dto.estado || 'PROGRAMADO';
    const fechaProg = dto.fecha_programada || new Date();
    const fechaReal = dto.fecha_realizado || dto.fecha_ejecucion || null;

    const res = await this.db.query(`
      INSERT INTO mantenimientos (
        origen, registro_id, tipo, descripcion, tecnico_responsable,
        estado, fecha_programada, fecha_realizado
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8
      ) RETURNING *
    `, [
      origen,
      registro_id,
      tipo,
      descripcion,
      tecnico,
      estado,
      fechaProg,
      fechaReal,
    ]);

    return res.rows[0];
  }

  async updateMantenimiento(id: number, dto: any) {
    const fields: string[] = [];
    const params: any[] = [id];
    const allowed = [
      'origen', 'registro_id', 'tipo', 'descripcion', 'tecnico_responsable',
      'estado', 'fecha_programada', 'fecha_realizado'
    ];

    for (const col of allowed) {
      if (dto[col] !== undefined) {
        params.push(dto[col]);
        fields.push(`${col} = $${params.length}`);
      }
    }

    if (fields.length === 0) {
      const existing = await this.db.query('SELECT * FROM mantenimientos WHERE id = $1', [id]);
      return existing.rows[0];
    }

    const sql = `UPDATE mantenimientos SET ${fields.join(', ')} WHERE id = $1 RETURNING *;`;
    const res = await this.db.query(sql, params);

    if (res.rows.length === 0) {
      throw new NotFoundException(`Mantenimiento ID ${id} no encontrado`);
    }

    return res.rows[0];
  }

  async deleteMantenimiento(id: number) {
    const res = await this.db.query('DELETE FROM mantenimientos WHERE id = $1 RETURNING *', [id]);
    if (res.rows.length === 0) {
      throw new NotFoundException(`Mantenimiento ID ${id} no encontrado`);
    }
    return { success: true, message: 'Mantenimiento eliminado' };
  }
}
