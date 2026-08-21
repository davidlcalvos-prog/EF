import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  AddMemberDto,
  AuthTokenPayload,
  CreateGroupDto,
  UpdateGroupDto,
  UpdateMemberRoleDto,
} from '@ef/contracts';
import { CurrentUser } from '../auth/decorators';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GroupsProxyService } from './groups-proxy.service';

/**
 * Grupos de jugadores. JWT obligatorio en todas las rutas; los permisos
 * (dueño/admin/creador) se validan server-side en users-service, no aquí.
 */
@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsProxyController {
  constructor(private readonly groupsProxy: GroupsProxyService) {}

  @Post()
  create(@Body() dto: CreateGroupDto, @CurrentUser() user: AuthTokenPayload) {
    return this.groupsProxy.create(user.sub, dto);
  }

  @Get('mine')
  listMine(@CurrentUser() user: AuthTokenPayload) {
    return this.groupsProxy.listMine(user.sub);
  }

  /**
   * Búsqueda por nombre para pedir amistad entre grupos. Antes de 'GET :id'
   * porque si no, Nest intentaría matchear "search" como :id.
   */
  @Get('search')
  search(@Query('q') q?: string) {
    if (!q || q.trim().length < 2) {
      throw new BadRequestException('q must be at least 2 characters');
    }
    return this.groupsProxy.search(q.trim());
  }

  @Get(':id')
  getDetail(@Param('id') id: string, @CurrentUser() user: AuthTokenPayload) {
    return this.groupsProxy.getDetail(id, user.sub);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateGroupDto,
    @CurrentUser() user: AuthTokenPayload,
  ) {
    return this.groupsProxy.update(id, user.sub, dto);
  }

  @Post(':id/members')
  addMember(
    @Param('id') id: string,
    @Body() dto: AddMemberDto,
    @CurrentUser() user: AuthTokenPayload,
  ) {
    return this.groupsProxy.addMember(id, user.sub, dto);
  }

  @Patch(':id/members/:userId/role')
  updateMemberRole(
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
    @Body() dto: UpdateMemberRoleDto,
    @CurrentUser() user: AuthTokenPayload,
  ) {
    return this.groupsProxy.updateMemberRole(id, user.sub, targetUserId, dto);
  }

  @Delete(':id/members/:userId')
  removeMember(
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: AuthTokenPayload,
  ) {
    return this.groupsProxy.removeMember(id, user.sub, targetUserId);
  }

  @Delete(':id')
  deleteGroup(@Param('id') id: string, @CurrentUser() user: AuthTokenPayload) {
    return this.groupsProxy.deleteGroup(id, user.sub);
  }
}
