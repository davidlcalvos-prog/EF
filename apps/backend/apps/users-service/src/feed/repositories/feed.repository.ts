import { Injectable } from '@nestjs/common';
import { PrismaService } from '@ef/database';
import { CommentDto, PostDto, PostMediaType } from '@ef/contracts';
import { PostMediaType as PrismaPostMediaType } from '@prisma/client';

type AuthorInfo = {
  email: string;
  firstname: string;
  lastname: string;
  profile: { alias: string } | null;
};

type PostRow = {
  id: string;
  authorId: string;
  content: string;
  mediaType: PrismaPostMediaType;
  mediaUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  author: AuthorInfo;
  _count: { likes: number; comments: number };
};

type CommentRow = {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: Date;
  author: AuthorInfo;
};

const authorInclude = {
  author: {
    include: { profile: { select: { alias: true } } },
  },
} as const;

@Injectable()
export class FeedRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPost(
    authorId: string,
    data: { content: string; mediaType?: PostMediaType; mediaUrl?: string },
  ): Promise<PostDto> {
    const post = await this.prisma.post.create({
      data: {
        authorId,
        content: data.content,
        mediaType: data.mediaType ?? 'none',
        mediaUrl: data.mediaUrl,
      },
    });
    return this.findDetail(post.id, authorId) as Promise<PostDto>;
  }

  async findPostCore(postId: string): Promise<{ id: string; authorId: string } | null> {
    return this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });
  }

  async findDetail(postId: string, requesterId: string): Promise<PostDto | null> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { ...authorInclude, _count: { select: { likes: true, comments: true } } },
    });
    if (!post) return null;
    // Un post fuera de mi red se comporta como inexistente (404), para que
    // un enlace directo no saltee el filtro del feed.
    if (post.authorId !== requesterId) {
      const visible = await this.visibleAuthorIds(requesterId);
      if (!visible.has(post.authorId)) return null;
    }
    const likedByMe = await this.hasLiked(postId, requesterId);
    return this.toPostDto(post, likedByMe);
  }

  /**
   * Red del usuario (Fase 10): él mismo, sus amigos aceptados y los miembros
   * de todos sus grupos. Dos consultas simples a propósito — el volumen es
   * chico y prima la claridad.
   */
  private async visibleAuthorIds(requesterId: string): Promise<Set<string>> {
    const [friendRows, myMemberships] = await Promise.all([
      this.prisma.userFriendship.findMany({
        where: {
          status: 'accepted',
          OR: [{ requesterId }, { addresseeId: requesterId }],
        },
        select: { requesterId: true, addresseeId: true },
      }),
      this.prisma.groupMembership.findMany({
        where: { userId: requesterId },
        select: { groupId: true },
      }),
    ]);

    const ids = new Set<string>([requesterId]);
    for (const row of friendRows) {
      ids.add(row.requesterId === requesterId ? row.addresseeId : row.requesterId);
    }

    if (myMemberships.length > 0) {
      const groupMembers = await this.prisma.groupMembership.findMany({
        where: { groupId: { in: myMemberships.map((m) => m.groupId) } },
        select: { userId: true },
      });
      for (const member of groupMembers) {
        ids.add(member.userId);
      }
    }

    return ids;
  }

  async hasLiked(postId: string, userId: string): Promise<boolean> {
    const row = await this.prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId } },
      select: { id: true },
    });
    return row != null;
  }

  async listPosts(
    requesterId: string,
    page: number,
    pageSize: number,
  ): Promise<PostDto[]> {
    const visible = await this.visibleAuthorIds(requesterId);
    const posts = await this.prisma.post.findMany({
      where: { authorId: { in: [...visible] } },
      include: { ...authorInclude, _count: { select: { likes: true, comments: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    if (posts.length === 0) return [];

    const likedRows = await this.prisma.postLike.findMany({
      where: { userId: requesterId, postId: { in: posts.map((p) => p.id) } },
      select: { postId: true },
    });
    const likedIds = new Set(likedRows.map((row) => row.postId));

    return posts.map((post) => this.toPostDto(post, likedIds.has(post.id)));
  }

  async deletePost(postId: string): Promise<void> {
    await this.prisma.post.delete({ where: { id: postId } });
  }

  async toggleLike(postId: string, userId: string): Promise<PostDto> {
    const existing = await this.prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId } },
      select: { id: true },
    });

    if (existing) {
      await this.prisma.postLike.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.postLike.create({ data: { postId, userId } });
    }

    return this.findDetail(postId, userId) as Promise<PostDto>;
  }

  async listComments(
    postId: string,
    page: number,
    pageSize: number,
  ): Promise<CommentDto[]> {
    const comments = await this.prisma.postComment.findMany({
      where: { postId },
      include: authorInclude,
      orderBy: { createdAt: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return comments.map((comment) => this.toCommentDto(comment));
  }

  async createComment(
    postId: string,
    authorId: string,
    content: string,
  ): Promise<CommentDto> {
    const comment = await this.prisma.postComment.create({
      data: { postId, authorId, content },
      include: authorInclude,
    });
    return this.toCommentDto(comment);
  }

  async findCommentCore(
    commentId: string,
  ): Promise<{ id: string; postId: string; authorId: string; postAuthorId: string } | null> {
    const comment = await this.prisma.postComment.findUnique({
      where: { id: commentId },
      include: { post: { select: { authorId: true } } },
    });
    if (!comment) return null;
    return {
      id: comment.id,
      postId: comment.postId,
      authorId: comment.authorId,
      postAuthorId: comment.post.authorId,
    };
  }

  async deleteComment(commentId: string): Promise<void> {
    await this.prisma.postComment.delete({ where: { id: commentId } });
  }

  private buildAuthorName(author: AuthorInfo): string {
    const fullName = [author.firstname, author.lastname]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(' ');
    if (fullName) return fullName;
    const local = author.email.split('@')[0] || author.email;
    return local.charAt(0).toUpperCase() + local.slice(1);
  }

  /** Mismo fallback que apps/mobile/.../FeedComposeModal.tsx (email.split("@")[0]). */
  private buildAuthorHandle(author: AuthorInfo): string {
    if (author.profile?.alias) return `@${author.profile.alias}`;
    const local = author.email.split('@')[0] || author.email;
    return `@${local}`;
  }

  private toPostDto(post: PostRow, likedByMe: boolean): PostDto {
    return {
      id: post.id,
      authorId: post.authorId,
      authorName: this.buildAuthorName(post.author),
      authorHandle: this.buildAuthorHandle(post.author),
      content: post.content,
      mediaType: post.mediaType as PostMediaType,
      mediaUrl: post.mediaUrl,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      likedByMe,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  }

  private toCommentDto(comment: CommentRow): CommentDto {
    return {
      id: comment.id,
      postId: comment.postId,
      authorId: comment.authorId,
      authorName: this.buildAuthorName(comment.author),
      authorHandle: this.buildAuthorHandle(comment.author),
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
    };
  }
}
