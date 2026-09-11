import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { VenuesModule } from '../venues/venues.module';
import { TournamentsController } from './tournaments.controller';
import { TournamentsService } from './tournaments.service';
import { TournamentRepository } from './repositories/tournament.repository';

@Module({
  // NotificationsModule: A3 (2026-09-11), aviso "Copa abrió inscripciones".
  imports: [VenuesModule, NotificationsModule],
  controllers: [TournamentsController],
  providers: [TournamentsService, TournamentRepository],
})
export class TournamentsModule {}
