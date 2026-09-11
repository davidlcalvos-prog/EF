import { Module } from '@nestjs/common';
import { GroupsModule } from '../groups/groups.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { GroupInvitationsController } from './group-invitations.controller';
import { GroupInvitationsService } from './group-invitations.service';
import { GroupInvitationRepository } from './repositories/group-invitation.repository';

/** Invitaciones a grupo con aceptar/rechazar (2026-09-11). */
@Module({
  imports: [GroupsModule, NotificationsModule],
  controllers: [GroupInvitationsController],
  providers: [GroupInvitationsService, GroupInvitationRepository],
})
export class GroupInvitationsModule {}
