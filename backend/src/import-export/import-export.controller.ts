import { Controller, Get, Post, Query, Res, UseInterceptors, UploadedFile, Param, Body, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ImportExportService } from './import-export.service';

@Controller('import-export')
export class ImportExportController {
  constructor(private readonly importExportService: ImportExportService) {}

  @Get('plantilla/:modulo')
  async downloadPlantilla(@Param('modulo') modulo: string, @Res() res: Response) {
    const buffer = await this.importExportService.getPlantilla(modulo.toUpperCase());
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Plantilla_${modulo.toUpperCase()}.xlsx`,
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.send(buffer);
  }

  @Get('export/:tipo')
  async exportByTipo(@Param('tipo') tipo: string, @Res() res: Response) {
    const buffer = await this.importExportService.exportarEquipos(tipo);
    const dateStr = new Date().toISOString().split('T')[0];
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Inventario_PolloFiesta_${tipo.toUpperCase()}_${dateStr}.xlsx`,
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.send(buffer);
  }

  @Get('exportar')
  async exportar(
    @Query('modulo') modulo: string,
    @Query('sedeId') sedeId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.importExportService.exportarEquipos(
      modulo,
      sedeId ? parseInt(sedeId, 10) : undefined,
    );
    const dateStr = new Date().toISOString().split('T')[0];
    const modStr = (modulo || 'COMPLETO').toUpperCase();
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Inventario_PolloFiesta_${modStr}_${dateStr}.xlsx`,
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.send(buffer);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('modulo') modulo?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Debes adjuntar un archivo Excel (.xlsx o .xls).');
    }
    return this.importExportService.importarExcel(file.buffer, modulo);
  }

  @Post('importar/:modulo')
  @UseInterceptors(FileInterceptor('file'))
  async importarModulo(
    @Param('modulo') modulo: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Debes adjuntar un archivo Excel (.xlsx o .xls).');
    }
    return this.importExportService.importarExcel(file.buffer, modulo);
  }
}
