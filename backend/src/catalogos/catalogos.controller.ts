import { Controller, Get, Put, Body, Query, Param } from '@nestjs/common';
import { CatalogosService } from './catalogos.service';

@Controller('catalogos')
export class CatalogosController {
  constructor(private readonly catalogosService: CatalogosService) {}

  @Get('global-search')
  globalSearch(@Query('q') q: string) {
    return this.catalogosService.globalSearch(q);
  }

  @Get('sedes')
  getSedes(@Query('tipo') tipo?: string) {
    return this.catalogosService.getSedes(tipo);
  }

  @Get('tipos-equipo')
  getTiposEquipo(@Query('categoria') categoria?: string) {
    return this.catalogosService.getTiposEquipo(categoria);
  }

  @Get('marcas')
  getMarcas() {
    return this.catalogosService.getMarcas();
  }

  @Get('estados')
  getEstados() {
    return this.catalogosService.getEstados();
  }

  @Get('procesos')
  getProcesos() {
    return this.catalogosService.getProcesos();
  }

  @Get('empleados')
  getEmpleados(@Query('sedeId') sedeId?: string, @Query('estado') estado?: string) {
    return this.catalogosService.getEmpleados(sedeId ? parseInt(sedeId, 10) : undefined, estado);
  }

  @Get('configuraciones')
  getConfiguraciones() {
    return this.catalogosService.getConfiguraciones();
  }

  @Put('configuraciones/:clave')
  updateConfiguracion(@Param('clave') clave: string, @Body('valor') valor: string) {
    return this.catalogosService.updateConfiguracion(clave, valor);
  }
}
