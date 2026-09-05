import { Module } from '@nestjs/common';
import { InventarioTiService } from './inventario-ti.service';
import { InventarioTiController } from './inventario-ti.controller';

@Module({
  controllers: [InventarioTiController],
  providers: [InventarioTiService],
  exports: [InventarioTiService],
})
export class InventarioTiModule {}
