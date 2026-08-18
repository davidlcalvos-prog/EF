import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CommentActionPayload,
  CommentDto,
  CreateCommentPayload,
  CreatePostPayload,
  DEFAULT_FEED_PAGE_SIZE,
  ListCommentsPayload,
  ListPostsPayload,
  MAX_FEED_PAGE_SIZE,
  PostActionPayload,
  PostDto,
} from '@ef/contracts';
import { FeedRepository } from './repositories/feed.repository';

@Injectable()
export class FeedService {
  constructor(private readonly feedRepository: FeedRepository) {}

  async createPost(payload: CreatePostPayload): Promise<PostDto> {
    if (payload.mediaUrl && (!payload.mediaType || payload.mediaType === 'none')) {
      throw new BadRequestException(
        'mediaType must be image or video when mediaUrl is provided',
      );
    }

    return this.feedRepository.createPost(payload.authorId, {
      content: payload.content,
      mediaType: payload.mediaType,
      mediaUrl: payload.mediaUrl,
    });
  }

  listPosts(payload: ListPostsPayload): Promise<PostDto[]> {
    const { page, pageSize } = this.resolvePagination(payload.page, payload.pageSize);
    return this.feedRepository.listPosts(payload.requesterId, page, pageSize);
  }

  async getPost(payload: PostActionPayload): Promise<PostDto> {
    const post = await this.feedRepository.findDetail(payload.postId, payload.requesterId);
    if (!post) {
      throw new NotFoundException(`Post ${payload.postId} not found`);
    }
    return post;
  }

  async deletePost(payload: PostActionPayload): Promise<{ success: true }> {
    const post = await this.requirePost(payload.postId);
    if (post.authorId !== payload.requesterId) {
      throw new ForbiddenException('Only the author can delete this post');
    }
    await this.feedRepository.deletePost(payload.postId);
    return { success: true };
  }

  async toggleLike(payload: PostActionPayload): Promise<PostDto> {
    await this.requirePost(payload.postId);
    return this.feedRepository.toggleLike(payload.postId, payload.requesterId);
  }

  async listComments(payload: ListCommentsPayload): Promise<CommentDto[]> {
    await this.requirePost(payload.postId);
    const { page, pageSize } = this.resolvePagination(payload.page, payload.pageSize);
    return this.feedRepository.listComments(payload.postId, page, pageSize);
  }

  async createComment(payload: CreateCommentPayload): Promise<CommentDto> {
    await this.requirePost(payload.postId);
    return this.feedRepository.createComment(
      payload.postId,
      payload.authorId,
      payload.content,
    );
  }

  async deleteComment(payload: CommentActionPayload): Promise<{ success: true }> {
    const comment = await this.feedRepository.findCommentCore(payload.commentId);
    if (!comment) {
      throw new NotFoundException(`Comment ${payload.commentId} not found`);
    }

    const isCommentAuthor = comment.authorId === payload.requesterId;
    const isPostAuthor = comment.postAuthorId === payload.requesterId;
    if (!isCommentAuthor && !isPostAuthor) {
      throw new ForbiddenException(
        'Only the comment author or the post author can delete this comment',
      );
    }

    await this.feedRepository.deleteComment(payload.commentId);
    return { success: true };
  }

  private async requirePost(postId: string) {
    const post = await this.feedRepository.findPostCore(postId);
    if (!post) {
      throw new NotFoundException(`Post ${postId} not found`);
    }
    return post;
  }

  private resolvePagination(page?: number, pageSize?: number) {
    return {
      page: page ?? 1,
      pageSize: Math.min(pageSize ?? DEFAULT_FEED_PAGE_SIZE, MAX_FEED_PAGE_SIZE),
    };
  }
}
