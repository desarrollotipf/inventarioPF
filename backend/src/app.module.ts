import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { CatalogosModule } from './catalogos/catalogos.module';
import { PdvModule } from './pdv/pdv.module';
import { InventarioTiModule } from './inventario-ti/inventario-ti.module';
import { CctvModule } from './cctv/cctv.module';
import { MantenimientoModule } from './mantenimiento/mantenimiento.module';
import { ImportExportModule } from './import-export/import-export.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    CatalogosModule,
    PdvModule,
    InventarioTiModule,
    CctvModule,
    MantenimientoModule,
    ImportExportModule,
    AuthModule,
  ],
})
export class AppModule {}
