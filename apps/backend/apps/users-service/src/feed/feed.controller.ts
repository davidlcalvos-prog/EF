import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MESSAGE_PATTERNS } from '@ef/common';
import {
  CommentActionPayload,
  CreateCommentPayload,
  CreatePostPayload,
  ListCommentsPayload,
  ListPostsPayload,
  PostActionPayload,
} from '@ef/contracts';
import { FeedService } from './feed.service';

@Controller()
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @MessagePattern(MESSAGE_PATTERNS.FEED.CREATE_POST)
  createPost(@Payload() data: CreatePostPayload) {
    return this.feedService.createPost(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.FEED.LIST_POSTS)
  listPosts(@Payload() data: ListPostsPayload) {
    return this.feedService.listPosts(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.FEED.GET_POST)
  getPost(@Payload() data: PostActionPayload) {
    return this.feedService.getPost(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.FEED.DELETE_POST)
  deletePost(@Payload() data: PostActionPayload) {
    return this.feedService.deletePost(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.FEED.TOGGLE_LIKE)
  toggleLike(@Payload() data: PostActionPayload) {
    return this.feedService.toggleLike(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.FEED.LIST_COMMENTS)
  listComments(@Payload() data: ListCommentsPayload) {
    return this.feedService.listComments(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.FEED.CREATE_COMMENT)
  createComment(@Payload() data: CreateCommentPayload) {
    return this.feedService.createComment(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.FEED.DELETE_COMMENT)
  deleteComment(@Payload() data: CommentActionPayload) {
    return this.feedService.deleteComment(data);
  }
}
