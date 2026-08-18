import {
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
  CreateCommentDto,
  CreatePostDto,
  PaginationDto,
} from '@ef/contracts';
import { CurrentUser } from '../auth/decorators';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FeedProxyService } from './feed-proxy.service';

/**
 * Feed global entre todos los usuarios autenticados (sin Friendship en el
 * MVP todavía). JWT obligatorio, sin RolesGuard — cualquier usuario.
 */
@Controller('feed')
@UseGuards(JwtAuthGuard)
export class FeedProxyController {
  constructor(private readonly feedProxy: FeedProxyService) {}

  @Post('posts')
  createPost(
    @Body() dto: CreatePostDto,
    @CurrentUser() user: AuthTokenPayload,
  ) {
    return this.feedProxy.createPost(user.sub, dto);
  }

  @Get('posts')
  listPosts(
    @Query() pagination: PaginationDto,
    @CurrentUser() user: AuthTokenPayload,
  ) {
    return this.feedProxy.listPosts(user.sub, pagination);
  }

  @Get('posts/:id')
  getPost(@Param('id') id: string, @CurrentUser() user: AuthTokenPayload) {
    return this.feedProxy.getPost(id, user.sub);
  }

  @Delete('posts/:id')
  deletePost(@Param('id') id: string, @CurrentUser() user: AuthTokenPayload) {
    return this.feedProxy.deletePost(id, user.sub);
  }

  @Post('posts/:id/like')
  toggleLike(@Param('id') id: string, @CurrentUser() user: AuthTokenPayload) {
    return this.feedProxy.toggleLike(id, user.sub);
  }

  @Get('posts/:id/comments')
  listComments(
    @Param('id') id: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.feedProxy.listComments(id, pagination);
  }

  @Post('posts/:id/comments')
  createComment(
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: AuthTokenPayload,
  ) {
    return this.feedProxy.createComment(id, user.sub, dto);
  }

  @Delete('comments/:id')
  deleteComment(
    @Param('id') id: string,
    @CurrentUser() user: AuthTokenPayload,
  ) {
    return this.feedProxy.deleteComment(id, user.sub);
  }
}
