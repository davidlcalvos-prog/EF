import { Module } from '@nestjs/common';
import { PendingController } from './pending.controller';
import { PendingService } from './pending.service';
import { PendingRepository } from './repositories/pending.repository';

/** Conteo de pendientes para los indicadores del drawer (Fase B). */
@Module({
  controllers: [PendingController],
  providers: [PendingService, PendingRepository],
})
export class PendingModule {}
