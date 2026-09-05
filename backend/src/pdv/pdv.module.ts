import { Module } from '@nestjs/common';
import { PdvService } from './pdv.service';
import { PdvController } from './pdv.controller';

@Module({
  controllers: [PdvController],
  providers: [PdvService],
  exports: [PdvService],
})
export class PdvModule {}
