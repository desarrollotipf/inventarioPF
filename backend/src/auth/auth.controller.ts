import { Controller, Post, Get, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() body: { correo: string; password: string }) {
    return this.authService.login(body.correo, body.password);
  }

  @Get('usuarios')
  getUsuarios() {
    return this.authService.getUsuarios();
  }
}
