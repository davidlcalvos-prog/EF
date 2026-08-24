import { Module } from '@nestjs/common';
import { VenuesModule } from '../venues/venues.module';
import { TournamentsController } from './tournaments.controller';
import { TournamentsService } from './tournaments.service';
import { TournamentRepository } from './repositories/tournament.repository';

@Module({
  imports: [VenuesModule],
  controllers: [TournamentsController],
  providers: [TournamentsService, TournamentRepository],
})
export class TournamentsModule {}
