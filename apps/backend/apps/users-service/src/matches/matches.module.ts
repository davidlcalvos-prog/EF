import { Module } from '@nestjs/common';
import { GroupsModule } from '../groups/groups.module';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { MatchRepository } from './repositories/match.repository';

@Module({
  imports: [GroupsModule],
  controllers: [MatchesController],
  providers: [MatchesService, MatchRepository],
})
export class MatchesModule {}
