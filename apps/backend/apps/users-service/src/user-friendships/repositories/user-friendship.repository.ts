import { Injectable } from '@nestjs/common';
import { PrismaService } from '@ef/database';
import {
  FriendshipStatusDto,
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

const userWithProfile = Prisma.validator<Prisma.UserDefaultArgs>()({
  include: { profile: true },
});
export type UserWithProfile = Prisma.UserGetPayload<typeof userWithProfile>;

function displayName(user: { firstname: string; lastname: string }): string {
  return [user.firstname, user.lastname].filter(Boolean).join(' ').trim();
}

/** Resumen público de un usuario — nunca incluye el email. */
export function toUserSummary(user: UserWithProfile): UserFriendshipDto['user'] {
  return {
    id: user.id,
    displayName: displayName(user),
    alias: user.profile?.alias ?? null,
    favoritePosition: user.profile?.favoritePosition ?? null,
    avatarBase64: user.profile?.avatarBase64 ?? null,
  };
}

/** DTO relativo: `user` es siempre "el otro" respecto de viewerId. */
function toDto(row: FriendshipWithUsers, viewerId: string): UserFriendshipDto {
  const requestedByMe = row.requesterId === viewerId;
  const other = requestedByMe ? row.addressee : row.requester;
  return {
    id: row.id,
    status: row.status as UserFriendshipStatus,
    requestedByMe,
    user: toUserSummary(other),
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

  /** Coincidencia EXACTA de email (case-insensitive) — nunca prefijo ni contains. */
  async findActiveUserByEmail(
    email: string,
    excludeUserId: string,
  ): Promise<UserWithProfile | null> {
    return this.prisma.user.findFirst({
      where: {
        email: { equals: email, mode: 'insensitive' },
        estado: true,
        id: { not: excludeUserId },
      },
      include: { profile: true },
    });
  }

  /** Alias por prefijo + nombre por contains, case-insensitive, máx `take`. */
  async searchActiveUsersByAliasOrName(
    term: string,
    excludeUserId: string,
    take: number,
  ): Promise<UserWithProfile[]> {
    return this.prisma.user.findMany({
      where: {
        estado: true,
        id: { not: excludeUserId },
        OR: [
          { profile: { alias: { startsWith: term, mode: 'insensitive' } } },
          { firstname: { contains: term, mode: 'insensitive' } },
          { lastname: { contains: term, mode: 'insensitive' } },
        ],
      },
      include: { profile: true },
      take,
    });
  }

  async findActiveUsersByIds(ids: string[]): Promise<UserWithProfile[]> {
    if (ids.length === 0) return [];
    return this.prisma.user.findMany({
      where: { id: { in: ids }, estado: true },
      include: { profile: true },
    });
  }

  /**
   * Estado de amistad con cada uno de `otherIds`, en UNA consulta.
   * Los ids sin fila devuelven { status: 'none', friendshipId: null }.
   */
  async statusesFor(
    viewerId: string,
    otherIds: string[],
  ): Promise<Map<string, FriendshipStatusDto>> {
    const map = new Map<string, FriendshipStatusDto>();
    for (const id of otherIds) {
      map.set(id, { status: 'none', friendshipId: null });
    }
    if (otherIds.length === 0) return map;

    const rows = await this.prisma.userFriendship.findMany({
      where: {
        OR: [
          { requesterId: viewerId, addresseeId: { in: otherIds } },
          { addresseeId: viewerId, requesterId: { in: otherIds } },
        ],
      },
      select: { id: true, status: true, requesterId: true, addresseeId: true },
    });
    for (const row of rows) {
      const otherId = row.requesterId === viewerId ? row.addresseeId : row.requesterId;
      map.set(otherId, {
        status:
          row.status === 'accepted'
            ? 'accepted'
            : row.requesterId === viewerId
              ? 'pending_sent'
              : 'pending_received',
        friendshipId: row.id,
      });
    }
    return map;
  }

  /** Ids con solicitud pendiente en cualquier dirección respecto de userId. */
  async pendingIdsOf(userId: string): Promise<string[]> {
    const rows = await this.prisma.userFriendship.findMany({
      where: {
        status: 'pending',
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      select: { requesterId: true, addresseeId: true },
    });
    return rows.map((row) =>
      row.requesterId === userId ? row.addresseeId : row.requesterId,
    );
  }

  /**
   * Amistades aceptadas que involucran a cualquiera de `friendIds` — para
   * calcular amigos-de-amigos con una sola consulta.
   */
  async acceptedInvolving(
    friendIds: string[],
  ): Promise<{ requesterId: string; addresseeId: string }[]> {
    if (friendIds.length === 0) return [];
    return this.prisma.userFriendship.findMany({
      where: {
        status: 'accepted',
        OR: [
          { requesterId: { in: friendIds } },
          { addresseeId: { in: friendIds } },
        ],
      },
      select: { requesterId: true, addresseeId: true },
    });
  }
}
