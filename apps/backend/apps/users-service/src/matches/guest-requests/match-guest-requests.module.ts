import { Module } from '@nestjs/common';
import { GroupsModule } from '../../groups/groups.module';
import { NotificationsModule } from '../../notifications/notifications.module';
import { UsersModule } from '../../users/users.module';
import { MatchesModule } from '../matches.module';
import { MatchGuestRequestsController } from './match-guest-requests.controller';
import { MatchGuestRequestsService } from './match-guest-requests.service';
import { MatchGuestRequestRepository } from './repositories/match-guest-request.repository';

// El repositorio importa `toUserSummary`/`UserWithProfile` (Fase 10) como
// funciones/tipos TS puros desde user-friendships — no requieren wiring de
// Nest (no se inyecta ningún provider de ese módulo).
@Module({
  imports: [MatchesModule, GroupsModule, UsersModule, NotificationsModule],
  controllers: [MatchGuestRequestsController],
  providers: [MatchGuestRequestsService, MatchGuestRequestRepository],
})
export class MatchGuestRequestsModule {}
