import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export type PostMediaType = 'none' | 'image' | 'video';

export const DEFAULT_FEED_PAGE_SIZE = 20;
export const MAX_FEED_PAGE_SIZE = 50;

export interface PostDto {
  id: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorAvatarBase64: string | null;
  content: string;
  mediaType: PostMediaType;
  mediaUrl: string | null;
  likesCount: number;
  commentsCount: number;
  likedByMe: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommentDto {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorAvatarBase64: string | null;
  content: string;
  createdAt: string;
}

export class PaginationDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_FEED_PAGE_SIZE)
  pageSize?: number;
}

export class CreatePostDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;

  /** Si viene mediaUrl, mediaType no puede ser 'none' — validado en el service (regla cruzada). */
  @IsOptional()
  @IsIn(['none', 'image', 'video'])
  mediaType?: PostMediaType;

  @IsOptional()
  @IsUrl()
  mediaUrl?: string;
}

export class CreatePostPayload extends CreatePostDto {
  @IsUUID()
  authorId!: string;
}

export class CreateCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  content!: string;
}

export class CreateCommentPayload extends CreateCommentDto {
  @IsUUID()
  postId!: string;

  @IsUUID()
  authorId!: string;
}

/** Detalle, borrar post, alternar like — todos necesitan postId + quién pregunta. */
export class PostActionPayload {
  @IsUUID()
  postId!: string;

  @IsUUID()
  requesterId!: string;
}

export class CommentActionPayload {
  @IsUUID()
  commentId!: string;

  @IsUUID()
  requesterId!: string;
}

export class ListPostsPayload extends PaginationDto {
  /** Para resolver likedByMe de cada post. */
  @IsUUID()
  requesterId!: string;
}

export class ListCommentsPayload extends PaginationDto {
  @IsUUID()
  postId!: string;
}
