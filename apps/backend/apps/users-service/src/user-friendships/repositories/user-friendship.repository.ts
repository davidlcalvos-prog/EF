import { Injectable } from '@nestjs/common';
import { PrismaService } from '@ef/database';
import {
  UserFriendshipDto,
  UserFriendshipFilter,
  UserFriendshipStatus,
} from '@ef/contracts';
import { Prisma } from '@prisma/client';

const withUsers = Prisma.validator<Prisma.UserFriendshipDefaultArgs>()({
  include: {
    requester: { include: { profile: true } },
    addressee: { include: { profile: true } },
  },
});
type FriendshipWithUsers = Prisma.UserFriendshipGetPayload<typeof withUsers>;

function displayName(user: { firstname: string; lastname: string }): string {
  return [user.firstname, user.lastname].filter(Boolean).join(' ').trim();
}

/** DTO relativo: `user` es siempre "el otro" respecto de viewerId. */
function toDto(row: FriendshipWithUsers, viewerId: string): UserFriendshipDto {
  const requestedByMe = row.requesterId === viewerId;
  const other = requestedByMe ? row.addressee : row.requester;
  return {
    id: row.id,
    status: row.status as UserFriendshipStatus,
    requestedByMe,
    user: {
      id: other.id,
      displayName: displayName(other),
      alias: other.profile?.alias ?? null,
      favoritePosition: other.profile?.favoritePosition ?? null,
      avatarBase64: other.profile?.avatarBase64 ?? null,
    },
    createdAt: row.createdAt.toISOString(),
  };
}

@Injectable()
export class UserFriendshipRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    requesterId: string,
    addresseeId: string,
    viewerId: string,
  ): Promise<UserFriendshipDto> {
    const row = await this.prisma.userFriendship.create({
      data: { requesterId, addresseeId },
      ...withUsers,
    });
    return toDto(row, viewerId);
  }

  async findById(friendshipId: string): Promise<FriendshipWithUsers | null> {
    return this.prisma.userFriendship.findUnique({
      where: { id: friendshipId },
      ...withUsers,
    });
  }

  /** Busca la amistad en ambas direcciones (A→B o B→A). */
  async findBetween(
    userA: string,
    userB: string,
  ): Promise<FriendshipWithUsers | null> {
    return this.prisma.userFriendship.findFirst({
      where: {
        OR: [
          { requesterId: userA, addresseeId: userB },
          { requesterId: userB, addresseeId: userA },
        ],
      },
      ...withUsers,
    });
  }

  async accept(friendshipId: string, viewerId: string): Promise<UserFriendshipDto> {
    const row = await this.prisma.userFriendship.update({
      where: { id: friendshipId },
      data: { status: 'accepted' },
      ...withUsers,
    });
    return toDto(row, viewerId);
  }

  async remove(friendshipId: string): Promise<void> {
    await this.prisma.userFriendship.delete({ where: { id: friendshipId } });
  }

  async listForUser(
    userId: string,
    filter: UserFriendshipFilter,
  ): Promise<UserFriendshipDto[]> {
    const where: Prisma.UserFriendshipWhereInput =
      filter === 'accepted'
        ? {
            status: 'accepted',
            OR: [{ requesterId: userId }, { addresseeId: userId }],
          }
        : filter === 'pending_received'
          ? { status: 'pending', addresseeId: userId }
          : { status: 'pending', requesterId: userId };

    const rows = await this.prisma.userFriendship.findMany({
      where,
      ...withUsers,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => toDto(row, userId));
  }

  /** Ids de amigos aceptados en ambas direcciones. Lo usa también el feed. */
  async friendIdsOf(userId: string): Promise<string[]> {
    const rows = await this.prisma.userFriendship.findMany({
      where: {
        status: 'accepted',
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      select: { requesterId: true, addresseeId: true },
    });
    return rows.map((row) =>
      row.requesterId === userId ? row.addresseeId : row.requesterId,
    );
  }

  async existsAccepted(userA: string, userB: string): Promise<boolean> {
    const row = await this.prisma.userFriendship.findFirst({
      where: {
        status: 'accepted',
        OR: [
          { requesterId: userA, addresseeId: userB },
          { requesterId: userB, addresseeId: userA },
        ],
      },
      select: { id: true },
    });
    return row != null;
  }

  toDto(row: FriendshipWithUsers, viewerId: string): UserFriendshipDto {
    return toDto(row, viewerId);
  }
}
