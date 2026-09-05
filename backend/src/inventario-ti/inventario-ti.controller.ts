import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { InventarioTiService, FilterEquiposDto } from './inventario-ti.service';

@Controller('inventario-ti')
export class InventarioTiController {
  constructor(private readonly tiService: InventarioTiService) {}

  @Get('dashboard-kpis')
  getDashboardKpis() {
    return this.tiService.getDashboardKpis();
  }

  @Get('equipos')
  getEquipos(@Query() filters: FilterEquiposDto) {
    return this.tiService.getEquipos(filters);
  }

  @Get('equipos/:id/hoja-de-vida')
  getHojaDeVida(@Param('id') id: string) {
    return this.tiService.getHojaDeVida(parseInt(id, 10));
  }

  @Post('equipos')
  createEquipo(@Body() dto: any) {
    return this.tiService.createEquipo(dto);
  }

  @Put('equipos/:id')
  updateEquipo(@Param('id') id: string, @Body() dto: any) {
    return this.tiService.updateEquipo(parseInt(id, 10), dto);
  }

  @Delete('equipos/:id')
  deleteEquipo(@Param('id') id: string) {
    return this.tiService.deleteEquipo(parseInt(id, 10));
  }

  @Post('equipos/:id/notas')
  addNota(
    @Param('id') id: string,
    @Body('autor') autor: string,
    @Body('nota') nota: string,
  ) {
    return this.tiService.addNota(parseInt(id, 10), autor || 'Soporte TI', nota);
  }
}
