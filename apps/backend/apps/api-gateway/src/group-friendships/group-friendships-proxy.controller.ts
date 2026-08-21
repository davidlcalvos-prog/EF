import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthTokenPayload, RequestGroupFriendshipDto } from '@ef/contracts';
import { CurrentUser } from '../auth/decorators';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GroupFriendshipsProxyService } from './group-friendships-proxy.service';

/**
 * Amistad entre grupos, requisito para retar en VS (Fase 6.5.3). Sin prefijo
 * de clase porque mezcla rutas bajo /groups/:id/friendships y /group-friendships/:id.
 */
@Controller()
@UseGuards(JwtAuthGuard)
export class GroupFriendshipsProxyController {
  constructor(private readonly friendshipsProxy: GroupFriendshipsProxyService) {}

  @Get('groups/:id/friendships')
  listForGroup(@Param('id') groupId: string, @CurrentUser() user: AuthTokenPayload) {
    return this.friendshipsProxy.listForGroup(groupId, user.sub);
  }

  @Post('groups/:id/friendships')
  request(
    @Param('id') groupId: string,
    @Body() dto: RequestGroupFriendshipDto,
    @CurrentUser() user: AuthTokenPayload,
  ) {
    return this.friendshipsProxy.request(groupId, user.sub, dto);
  }

  @Post('group-friendships/:friendshipId/accept')
  accept(@Param('friendshipId') friendshipId: string, @CurrentUser() user: AuthTokenPayload) {
    return this.friendshipsProxy.accept(friendshipId, user.sub);
  }

  @Delete('group-friendships/:friendshipId')
  remove(@Param('friendshipId') friendshipId: string, @CurrentUser() user: AuthTokenPayload) {
    return this.friendshipsProxy.remove(friendshipId, user.sub);
  }
}
