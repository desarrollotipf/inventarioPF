import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { CctvService } from './cctv.service';

@Controller('cctv')
export class CctvController {
  constructor(private readonly cctvService: CctvService) {}

  @Get('sede/:sedeId')
  getCircuitoBySede(@Param('sedeId') sedeId: string) {
    return this.cctvService.getCircuitoBySede(parseInt(sedeId, 10));
  }

  @Post('sede/:sedeId/canal')
  createOrUpdateCanal(@Param('sedeId') sedeId: string, @Body() dto: any) {
    return this.cctvService.createOrUpdateCanal(parseInt(sedeId, 10), dto);
  }

  @Delete('canal/:id')
  deleteCanal(@Param('id') id: string) {
    return this.cctvService.deleteCanal(parseInt(id, 10));
  }
}
