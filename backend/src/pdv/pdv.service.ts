import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class PdvService {
  constructor(private readonly db: DatabaseService) {}

  async getAllPdvs(search?: string) {
    let sql = `
      SELECT 
        p.*,
        s.ciudad as ciudad
      FROM equipos_pdv p
      LEFT JOIN sedes s ON p.sede_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (search) {
      params.push(`%${search}%`);
      const idx = params.length;
      sql += ` AND (
        p.pdv_nombre ILIKE $${idx} OR 
        p.pc_modelo ILIKE $${idx} OR 
        p.pc_placa ILIKE $${idx} OR 
        p.anydesk ILIKE $${idx} OR 
        s.ciudad ILIKE $${idx}
      )`;
    }
    sql += ` ORDER BY p.numero ASC, p.id ASC`;
    const res = await this.db.query(sql, params);
    return res.rows;
  }

  async getPdvById(id: number) {
    const pdvRes = await this.db.query(`
      SELECT 
        p.*,
        s.ciudad as ciudad,
        s.direccion as direccion
      FROM equipos_pdv p
      LEFT JOIN sedes s ON p.sede_id = s.id
      WHERE p.id = $1
    `, [id]);

    if (pdvRes.rows.length === 0) {
      throw new NotFoundException(`Punto de Venta con ID ${id} no encontrado`);
    }

    const pdv = pdvRes.rows[0];

    // Notas del PDV
    const notasRes = await this.db.query(`
      SELECT * FROM bitacora_notas 
      WHERE origen = 'PDV' AND registro_id = $1 
      ORDER BY created_at DESC
    `, [id]);

    // Mantenimientos
    const mantenimientosRes = await this.db.query(`
      SELECT * FROM mantenimientos 
      WHERE origen = 'PDV' AND registro_id = $1 
      ORDER BY created_at DESC
    `, [id]);

    return {
      pdv,
      notas: notasRes.rows,
      mantenimientos: mantenimientosRes.rows,
    };
  }

  async createPdv(dto: any) {
    let nextNumero = dto.numero;
    if (!nextNumero) {
      const numRes = await this.db.query('SELECT COALESCE(MAX(numero), 0) + 1 as next_num FROM equipos_pdv;');
      nextNumero = numRes.rows[0]?.next_num || 1;
    }

    const res = await this.db.query(`
      INSERT INTO equipos_pdv (
        numero, pdv_nombre, sede_id, pc_modelo, pc_placa,
        procesador, ram, disco, monitor, teclado, mouse,
        impresora, dvr, camaras, cajon_monedero, modem,
        televisor, bascula_peso, ups, anydesk, estado
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21
      ) RETURNING *;
    `, [
      nextNumero,
      dto.pdv_nombre || 'Nuevo Punto de Venta',
      dto.sede_id ? Number(dto.sede_id) : null,
      dto.pc_modelo || null,
      dto.pc_placa || null,
      dto.procesador || null,
      dto.ram || null,
      dto.disco || null,
      dto.monitor || null,
      dto.teclado || null,
      dto.mouse || null,
      dto.impresora || null,
      dto.dvr || null,
      dto.camaras || null,
      dto.cajon_monedero || null,
      dto.modem || null,
      dto.televisor || null,
      dto.bascula_peso || null,
      dto.ups || null,
      dto.anydesk || null,
      dto.estado || 'Buen Estado'
    ]);

    return res.rows[0];
  }

  async updatePdv(id: number, dto: any) {
    const fields: string[] = [];
    const params: any[] = [id];
    const allowedCols = [
      'numero', 'pdv_nombre', 'sede_id', 'pc_modelo', 'pc_placa',
      'procesador', 'ram', 'disco', 'monitor', 'teclado', 'mouse',
      'impresora', 'dvr', 'camaras', 'cajon_monedero', 'modem',
      'televisor', 'bascula_peso', 'ups', 'anydesk', 'estado'
    ];

    for (const col of allowedCols) {
      if (dto[col] !== undefined) {
        params.push(dto[col]);
        fields.push(`${col} = $${params.length}`);
      }
    }

    if (fields.length === 0) {
      const existing = await this.db.query('SELECT * FROM equipos_pdv WHERE id = $1', [id]);
      return existing.rows[0];
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    const sql = `UPDATE equipos_pdv SET ${fields.join(', ')} WHERE id = $1 RETURNING *;`;
    const res = await this.db.query(sql, params);

    if (res.rows.length === 0) {
      throw new NotFoundException(`Punto de Venta ID ${id} no encontrado`);
    }

    return res.rows[0];
  }

  async deletePdv(id: number) {
    await this.db.query(`DELETE FROM bitacora_notas WHERE origen = 'PDV' AND registro_id = $1;`, [id]);
    await this.db.query(`DELETE FROM mantenimientos WHERE origen = 'PDV' AND registro_id = $1;`, [id]);
    const res = await this.db.query(`DELETE FROM equipos_pdv WHERE id = $1 RETURNING id;`, [id]);
    if (res.rows.length === 0) {
      throw new NotFoundException(`Punto de Venta ID ${id} no encontrado`);
    }
    return { success: true, id };
  }

  async addNota(id: number, autor: string, nota: string) {
    const res = await this.db.query(`
      INSERT INTO bitacora_notas (origen, registro_id, autor, nota)
      VALUES ('PDV', $1, $2, $3)
      RETURNING *;
    `, [id, autor, nota]);
    return res.rows[0];
  }
}
