import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  AddMemberDto,
  AuthTokenPayload,
  CreateGroupDto,
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

  @Get(':id')
  getDetail(@Param('id') id: string, @CurrentUser() user: AuthTokenPayload) {
    return this.groupsProxy.getDetail(id, user.sub);
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
