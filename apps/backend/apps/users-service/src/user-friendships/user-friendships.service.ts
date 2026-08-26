import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@ef/database';
import {
  FriendshipStatusDto,
  GetFriendshipStatusPayload,
  ListUserFriendshipsPayload,
  RequestUserFriendshipPayload,
  UserFriendshipActionPayload,
  UserFriendshipDto,
} from '@ef/contracts';
import { NotificationsService } from '../notifications/notifications.service';
import { UserFriendshipRepository } from './repositories/user-friendship.repository';

@Injectable()
export class UserFriendshipsService {
  constructor(
    private readonly friendshipRepository: UserFriendshipRepository,
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  list(payload: ListUserFriendshipsPayload): Promise<UserFriendshipDto[]> {
    return this.friendshipRepository.listForUser(
      payload.requesterId,
      payload.filter ?? 'accepted',
    );
  }

  async getStatus(payload: GetFriendshipStatusPayload): Promise<FriendshipStatusDto> {
    const { requesterId, otherUserId } = payload;
    const row = await this.friendshipRepository.findBetween(requesterId, otherUserId);
    if (!row) {
      return { status: 'none', friendshipId: null };
    }
    if (row.status === 'accepted') {
      return { status: 'accepted', friendshipId: row.id };
    }
    return {
      status: row.requesterId === requesterId ? 'pending_sent' : 'pending_received',
      friendshipId: row.id,
    };
  }

  /**
   * Unicidad bidireccional: nunca existen (A→B) y (B→A) a la vez. Si B ya me
   * había solicitado, mi "solicitud" acepta la suya en vez de crear otra fila.
   */
  async request(payload: RequestUserFriendshipPayload): Promise<UserFriendshipDto> {
    const { requesterId, userId: addresseeId } = payload;

    if (requesterId === addresseeId) {
      throw new BadRequestException('You cannot send a friend request to yourself');
    }
    await this.requireActiveUser(addresseeId);
    const requester = await this.requireActiveUser(requesterId);

    const existing = await this.friendshipRepository.findBetween(
      requesterId,
      addresseeId,
    );
    if (existing) {
      if (existing.status === 'pending' && existing.requesterId === addresseeId) {
        // El otro ya me había solicitado: esto equivale a aceptar.
        const accepted = await this.friendshipRepository.accept(
          existing.id,
          requesterId,
        );
        await this.notifyAccepted(requesterId, addresseeId, requester);
        return accepted;
      }
      throw new ConflictException(
        existing.status === 'accepted'
          ? 'You are already friends with this user'
          : 'A friend request between you two is already pending',
      );
    }

    const created = await this.friendshipRepository.create(
      requesterId,
      addresseeId,
      requesterId,
    );
    await this.notificationsService.sendToUser(
      addresseeId,
      'Solicitud de amistad',
      `${this.displayName(requester)} te envió una solicitud de amistad`,
      { type: 'friendship_request', friendshipId: created.id },
    );
    return created;
  }

  async accept(payload: UserFriendshipActionPayload): Promise<UserFriendshipDto> {
    const friendship = await this.requireFriendship(payload.friendshipId);
    if (friendship.addresseeId !== payload.requesterId) {
      throw new ForbiddenException('Only the addressee can accept this request');
    }
    if (friendship.status !== 'pending') {
      throw new ConflictException('This friend request is not pending');
    }

    const accepted = await this.friendshipRepository.accept(
      friendship.id,
      payload.requesterId,
    );
    const accepter = await this.requireActiveUser(payload.requesterId);
    await this.notifyAccepted(payload.requesterId, friendship.requesterId, accepter);
    return accepted;
  }

  /** Sirve para rechazar (addressee), cancelar (requester) y eliminar (ambos). */
  async remove(payload: UserFriendshipActionPayload): Promise<{ success: true }> {
    const friendship = await this.requireFriendship(payload.friendshipId);
    const isParty =
      friendship.requesterId === payload.requesterId ||
      friendship.addresseeId === payload.requesterId;
    if (!isParty) {
      throw new ForbiddenException('You are not part of this friendship');
    }
    await this.friendshipRepository.remove(friendship.id);
    return { success: true };
  }

  /** Usado por el feed y por profile-stats. */
  friendIdsOf(userId: string): Promise<string[]> {
    return this.friendshipRepository.friendIdsOf(userId);
  }

  areFriends(userA: string, userB: string): Promise<boolean> {
    return this.friendshipRepository.existsAccepted(userA, userB);
  }

  private async notifyAccepted(
    accepterId: string,
    originalRequesterId: string,
    accepter: { firstname: string; lastname: string },
  ): Promise<void> {
    await this.notificationsService.sendToUser(
      originalRequesterId,
      'Solicitud aceptada',
      `${this.displayName(accepter)} aceptó tu solicitud de amistad`,
      { type: 'friendship_accepted', userId: accepterId },
    );
  }

  private displayName(user: { firstname: string; lastname: string }): string {
    return [user.firstname, user.lastname].filter(Boolean).join(' ').trim();
  }

  private async requireActiveUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, estado: true, firstname: true, lastname: true },
    });
    if (!user || !user.estado) {
      throw new NotFoundException(`User ${userId} not found`);
    }
    return user;
  }

  private async requireFriendship(friendshipId: string) {
    const friendship = await this.friendshipRepository.findById(friendshipId);
    if (!friendship) {
      throw new NotFoundException(`Friendship ${friendshipId} not found`);
    }
    return friendship;
  }
}
