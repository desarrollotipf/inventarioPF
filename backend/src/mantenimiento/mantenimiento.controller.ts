import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { MantenimientoService } from './mantenimiento.service';

@Controller('mantenimientos')
export class MantenimientoController {
  constructor(private readonly mantenimientoService: MantenimientoService) {}

  @Get()
  getAll(@Query() filters: any) {
    return this.mantenimientoService.getAllMantenimientos(filters);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.mantenimientoService.getMantenimientoById(parseInt(id, 10));
  }

  @Post()
  create(@Body() dto: any) {
    return this.mantenimientoService.createMantenimiento(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.mantenimientoService.updateMantenimiento(parseInt(id, 10), dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.mantenimientoService.deleteMantenimiento(parseInt(id, 10));
  }
}
