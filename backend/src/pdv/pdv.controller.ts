import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { PdvService } from './pdv.service';

@Controller('pdv')
export class PdvController {
  constructor(private readonly pdvService: PdvService) {}

  @Get()
  getAllPdvs(@Query('search') search?: string) {
    return this.pdvService.getAllPdvs(search);
  }

  @Get(':id')
  getPdvById(@Param('id') id: string) {
    return this.pdvService.getPdvById(parseInt(id, 10));
  }

  @Post()
  createPdv(@Body() dto: any) {
    return this.pdvService.createPdv(dto);
  }

  @Put(':id')
  updatePdv(@Param('id') id: string, @Body() dto: any) {
    return this.pdvService.updatePdv(parseInt(id, 10), dto);
  }

  @Delete(':id')
  deletePdv(@Param('id') id: string) {
    return this.pdvService.deletePdv(parseInt(id, 10));
  }

  @Post(':id/notas')
  addNota(
    @Param('id') id: string,
    @Body('autor') autor: string,
    @Body('nota') nota: string,
  ) {
    return this.pdvService.addNota(parseInt(id, 10), autor || 'Soporte TI', nota);
  }
}
