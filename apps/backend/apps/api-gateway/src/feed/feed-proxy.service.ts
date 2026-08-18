import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { MESSAGE_PATTERNS, SERVICE_NAMES, toHttpException } from '@ef/common';
import {
  CommentDto,
  CreateCommentDto,
  CreatePostDto,
  PaginationDto,
  PostDto,
} from '@ef/contracts';

@Injectable()
export class FeedProxyService {
  constructor(
    @Inject(SERVICE_NAMES.USERS) private readonly usersClient: ClientProxy,
  ) {}

  createPost(authorId: string, dto: CreatePostDto): Promise<PostDto> {
    return this.send<PostDto>(MESSAGE_PATTERNS.FEED.CREATE_POST, {
      authorId,
      ...dto,
    });
  }

  listPosts(requesterId: string, pagination: PaginationDto): Promise<PostDto[]> {
    return this.send<PostDto[]>(MESSAGE_PATTERNS.FEED.LIST_POSTS, {
      requesterId,
      ...pagination,
    });
  }

  getPost(postId: string, requesterId: string): Promise<PostDto> {
    return this.send<PostDto>(MESSAGE_PATTERNS.FEED.GET_POST, {
      postId,
      requesterId,
    });
  }

  deletePost(postId: string, requesterId: string): Promise<{ success: true }> {
    return this.send<{ success: true }>(MESSAGE_PATTERNS.FEED.DELETE_POST, {
      postId,
      requesterId,
    });
  }

  toggleLike(postId: string, requesterId: string): Promise<PostDto> {
    return this.send<PostDto>(MESSAGE_PATTERNS.FEED.TOGGLE_LIKE, {
      postId,
      requesterId,
    });
  }

  listComments(postId: string, pagination: PaginationDto): Promise<CommentDto[]> {
    return this.send<CommentDto[]>(MESSAGE_PATTERNS.FEED.LIST_COMMENTS, {
      postId,
      ...pagination,
    });
  }

  createComment(
    postId: string,
    authorId: string,
    dto: CreateCommentDto,
  ): Promise<CommentDto> {
    return this.send<CommentDto>(MESSAGE_PATTERNS.FEED.CREATE_COMMENT, {
      postId,
      authorId,
      ...dto,
    });
  }

  deleteComment(
    commentId: string,
    requesterId: string,
  ): Promise<{ success: true }> {
    return this.send<{ success: true }>(MESSAGE_PATTERNS.FEED.DELETE_COMMENT, {
      commentId,
      requesterId,
    });
  }

  private send<T>(pattern: string, payload: unknown): Promise<T> {
    return firstValueFrom(
      this.usersClient.send<T>(pattern, payload).pipe(
        catchError((error: unknown) =>
          throwError(() => toHttpException(error)),
        ),
      ),
    );
  }
}
