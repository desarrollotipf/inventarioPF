import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  async login(correo: string, passwordPlain: string) {
    const userRes = await this.db.query('SELECT * FROM usuarios_sistema WHERE correo = $1 AND activo = true', [correo]);
    if (userRes.rows.length === 0) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const user = userRes.rows[0];

    const isMatch = await bcrypt.compare(passwordPlain, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = {
      sub: user.id,
      correo: user.correo,
      nombre: user.nombre_completo,
      rol: user.rol,
    };

    const token = this.jwtService.sign(payload);
    return {
      accessToken: token,
      token,
      user: {
        id: user.id,
        correo: user.correo,
        nombre: user.nombre_completo,
        rol: user.rol,
      },
    };
  }

  async getUsuarios() {
    const res = await this.db.query('SELECT id, correo, nombre_completo, rol, activo, created_at FROM usuarios_sistema ORDER BY id ASC');
    return res.rows;
  }
}
