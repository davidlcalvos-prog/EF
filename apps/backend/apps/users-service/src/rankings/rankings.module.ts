import { Module } from '@nestjs/common';
import { RankingsController } from './rankings.controller';
import { RankingsService } from './rankings.service';
import { RankingsRepository } from './repositories/rankings.repository';

@Module({
  controllers: [RankingsController],
  providers: [RankingsService, RankingsRepository],
})
export class RankingsModule {}
