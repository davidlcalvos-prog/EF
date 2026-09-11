import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthTokenPayload, InviteToGroupDto } from '@ef/contracts';
import { CurrentUser } from '../auth/decorators';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GroupInvitationsProxyService } from './group-invitations-proxy.service';

/**
 * Invitaciones a grupo (2026-09-11). Sin prefijo de clase porque mezcla rutas
 * bajo /groups/:id/invitations (líder) y /group-invitations (invitado), como
 * las amistades entre grupos. El permiso de invitar se valida en users-service
 * con el mismo guard de creador/admin que tenía el alta directa.
 */
@Controller()
@UseGuards(JwtAuthGuard)
export class GroupInvitationsProxyController {
  constructor(private readonly invitationsProxy: GroupInvitationsProxyService) {}

  @Post('groups/:id/invitations')
  invite(
    @Param('id') groupId: string,
    @Body() dto: InviteToGroupDto,
    @CurrentUser() user: AuthTokenPayload,
  ) {
    return this.invitationsProxy.invite(groupId, user.sub, dto);
  }

  @Get('groups/:id/invitations')
  listForGroup(@Param('id') groupId: string, @CurrentUser() user: AuthTokenPayload) {
    return this.invitationsProxy.listForGroup(groupId, user.sub);
  }

  @Delete('groups/:id/invitations/:invitationId')
  cancel(@Param('invitationId') invitationId: string, @CurrentUser() user: AuthTokenPayload) {
    return this.invitationsProxy.cancel(invitationId, user.sub);
  }

  @Get('group-invitations')
  listMine(@CurrentUser() user: AuthTokenPayload) {
    return this.invitationsProxy.listMine(user.sub);
  }

  @Post('group-invitations/:invitationId/accept')
  accept(@Param('invitationId') invitationId: string, @CurrentUser() user: AuthTokenPayload) {
    return this.invitationsProxy.accept(invitationId, user.sub);
  }

  @Post('group-invitations/:invitationId/decline')
  decline(@Param('invitationId') invitationId: string, @CurrentUser() user: AuthTokenPayload) {
    return this.invitationsProxy.decline(invitationId, user.sub);
  }
}
