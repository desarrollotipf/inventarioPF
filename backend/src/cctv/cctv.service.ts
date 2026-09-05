import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class CctvService {
  constructor(private readonly db: DatabaseService) {}

  async getCircuitoBySede(sedeId: number) {
    try {
      const pdvRes = await this.db.query('SELECT * FROM equipos_pdv WHERE sede_id = $1 OR id = $1', [sedeId]);
      const pdv = pdvRes.rows[0];

      return {
        pdv: pdv || null,
        dvrs: pdv?.dvr ? [{ id: pdv.id, modelo: pdv.dvr, dvr: pdv.dvr, camaras: pdv.camaras }] : [],
        canales: [],
      };
    } catch {
      return { pdv: null, dvrs: [], canales: [] };
    }
  }

  async createOrUpdateCanal(sedeId: number, dto: any) {
    if (dto.id) {
      const res = await this.db.query(`
        UPDATE pdv_circuitos_cctv SET
          dvr_equipo_id = $1,
          camara_equipo_id = $2,
          numero_canal = $3,
          nombre_camara = $4,
          ubicacion_en_pdv = $5,
          tipo_camara = $6,
          resolucion = $7,
          estado_senal = $8,
          observaciones = $9
        WHERE id = $10 AND sede_id = $11
        RETURNING *
      `, [
        dto.dvr_equipo_id || null,
        dto.camara_equipo_id || null,
        dto.numero_canal,
        dto.nombre_camara,
        dto.ubicacion_en_pdv || '',
        dto.tipo_camara || 'Domo',
        dto.resolucion || '1080p Full HD',
        dto.estado_senal || 'ONLINE',
        dto.observaciones || '',
        dto.id,
        sedeId,
      ]);
      return res.rows[0];
    } else {
      const res = await this.db.query(`
        INSERT INTO pdv_circuitos_cctv (
          sede_id, dvr_equipo_id, camara_equipo_id, numero_canal, nombre_camara,
          ubicacion_en_pdv, tipo_camara, resolucion, estado_senal, observaciones
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
        ) RETURNING *
      `, [
        sedeId,
        dto.dvr_equipo_id || null,
        dto.camara_equipo_id || null,
        dto.numero_canal,
        dto.nombre_camara || `Cámara Canal ${dto.numero_canal}`,
        dto.ubicacion_en_pdv || '',
        dto.tipo_camara || 'Domo',
        dto.resolucion || '1080p Full HD',
        dto.estado_senal || 'ONLINE',
        dto.observaciones || '',
      ]);
      return res.rows[0];
    }
  }

  async deleteCanal(id: number) {
    const res = await this.db.query('DELETE FROM pdv_circuitos_cctv WHERE id = $1 RETURNING *', [id]);
    if (res.rows.length === 0) {
      throw new NotFoundException(`Canal CCTV con ID ${id} no encontrado`);
    }
    return { success: true, message: 'Canal de CCTV eliminado' };
  }
}
