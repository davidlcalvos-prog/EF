import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  AuthTokenPayload,
  RequestUserFriendshipDto,
  USER_FRIENDSHIP_FILTERS,
  UserFriendshipFilter,
} from '@ef/contracts';
import { CurrentUser } from '../auth/decorators';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserFriendshipsProxyService } from './user-friendships-proxy.service';

/** Amistad entre jugadores (Fase 10). */
@Controller('friendships')
@UseGuards(JwtAuthGuard)
export class UserFriendshipsProxyController {
  constructor(private readonly friendshipsProxy: UserFriendshipsProxyService) {}

  @Get()
  list(
    @CurrentUser() user: AuthTokenPayload,
    @Query('filter') filter?: string,
  ) {
    const resolved = (filter ?? 'accepted') as UserFriendshipFilter;
    if (!USER_FRIENDSHIP_FILTERS.includes(resolved)) {
      throw new BadRequestException(
        `filter must be one of: ${USER_FRIENDSHIP_FILTERS.join(', ')}`,
      );
    }
    return this.friendshipsProxy.list(user.sub, resolved);
  }

  /** Antes que las rutas con :id para que 'search'/'suggestions' no matcheen como parámetro. */
  @Get('search')
  search(@CurrentUser() user: AuthTokenPayload, @Query('q') q?: string) {
    return this.friendshipsProxy.search(user.sub, q ?? '');
  }

  @Get('suggestions')
  suggestions(@CurrentUser() user: AuthTokenPayload) {
    return this.friendshipsProxy.suggestions(user.sub);
  }

  @Get('status/:userId')
  getStatus(@Param('userId') userId: string, @CurrentUser() user: AuthTokenPayload) {
    return this.friendshipsProxy.getStatus(user.sub, userId);
  }

  @Post()
  request(
    @Body() dto: RequestUserFriendshipDto,
    @CurrentUser() user: AuthTokenPayload,
  ) {
    return this.friendshipsProxy.request(user.sub, dto.userId);
  }

  @Post(':id/accept')
  accept(@Param('id') friendshipId: string, @CurrentUser() user: AuthTokenPayload) {
    return this.friendshipsProxy.accept(friendshipId, user.sub);
  }

  @Delete(':id')
  remove(@Param('id') friendshipId: string, @CurrentUser() user: AuthTokenPayload) {
    return this.friendshipsProxy.remove(friendshipId, user.sub);
  }
}
