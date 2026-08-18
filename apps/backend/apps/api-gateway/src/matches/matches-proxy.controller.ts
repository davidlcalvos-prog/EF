import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthTokenPayload, CreateMatchDto, UpdateMatchStatusDto } from '@ef/contracts';
import { CurrentUser } from '../auth/decorators';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MatchesProxyService } from './matches-proxy.service';

/**
 * Partidos. JWT obligatorio en todas las rutas; los permisos (miembro del
 * grupo, creador/admin, cupo, etc.) se validan server-side en users-service.
 */
@Controller('matches')
@UseGuards(JwtAuthGuard)
export class MatchesProxyController {
  constructor(private readonly matchesProxy: MatchesProxyService) {}

  @Post()
  create(@Body() dto: CreateMatchDto, @CurrentUser() user: AuthTokenPayload) {
    return this.matchesProxy.create(user.sub, dto);
  }

  @Get('mine')
  listMine(@CurrentUser() user: AuthTokenPayload) {
    return this.matchesProxy.listMine(user.sub);
  }

  @Get('group/:groupId')
  listByGroup(
    @Param('groupId') groupId: string,
    @CurrentUser() user: AuthTokenPayload,
  ) {
    return this.matchesProxy.listByGroup(groupId, user.sub);
  }

  @Get(':id')
  getDetail(@Param('id') id: string, @CurrentUser() user: AuthTokenPayload) {
    return this.matchesProxy.getDetail(id, user.sub);
  }

  @Post(':id/accept')
  accept(@Param('id') id: string, @CurrentUser() user: AuthTokenPayload) {
    return this.matchesProxy.accept(id, user.sub);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @CurrentUser() user: AuthTokenPayload) {
    return this.matchesProxy.reject(id, user.sub);
  }

  @Post(':id/join')
  join(@Param('id') id: string, @CurrentUser() user: AuthTokenPayload) {
    return this.matchesProxy.join(id, user.sub);
  }

  @Post(':id/leave')
  leave(@Param('id') id: string, @CurrentUser() user: AuthTokenPayload) {
    return this.matchesProxy.leave(id, user.sub);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateMatchStatusDto,
    @CurrentUser() user: AuthTokenPayload,
  ) {
    return this.matchesProxy.updateStatus(id, user.sub, dto);
  }
}
