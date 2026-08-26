import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@ef/database';
import {
  FriendSuggestionDto,
  FriendSuggestionsPayload,
  FriendshipStatusDto,
  GetFriendshipStatusPayload,
  ListUserFriendshipsPayload,
  PlayerSearchResultDto,
  RequestUserFriendshipPayload,
  SearchPlayersPayload,
  UserFriendshipActionPayload,
  UserFriendshipDto,
} from '@ef/contracts';
import { NotificationsService } from '../notifications/notifications.service';
import {
  toUserSummary,
  UserFriendshipRepository,
} from './repositories/user-friendship.repository';

const SEARCH_MIN_LENGTH = 3;
const SEARCH_MAX_RESULTS = 20;
const SUGGESTIONS_MAX = 15;

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

  /**
   * Búsqueda de jugadores (Fase 10.1). Privacidad del correo: si la query es
   * un email, SOLO coincidencia exacta case-insensitive — nunca prefijo ni
   * contains, para que un correo no pueda enumerarse por aproximación. El
   * email jamás viaja en la respuesta (toUserSummary no lo incluye).
   */
  async search(payload: SearchPlayersPayload): Promise<PlayerSearchResultDto[]> {
    const { requesterId } = payload;
    const query = payload.query.trim().toLowerCase();
    if (query.length < SEARCH_MIN_LENGTH) return [];

    const atIndex = query.indexOf('@');
    const isEmail = atIndex > 0 && query.includes('.', atIndex);

    let users;
    if (isEmail) {
      const user = await this.friendshipRepository.findActiveUserByEmail(
        query,
        requesterId,
      );
      users = user ? [user] : [];
    } else {
      const term = query.startsWith('@') ? query.slice(1) : query;
      if (term.length < 2) return [];
      users = await this.friendshipRepository.searchActiveUsersByAliasOrName(
        term,
        requesterId,
        SEARCH_MAX_RESULTS,
      );
      // Alias exacto primero, luego alfabético por nombre visible.
      users.sort((a, b) => {
        const aExact = a.profile?.alias?.toLowerCase() === term ? 0 : 1;
        const bExact = b.profile?.alias?.toLowerCase() === term ? 0 : 1;
        if (aExact !== bExact) return aExact - bExact;
        return toUserSummary(a).displayName.localeCompare(toUserSummary(b).displayName);
      });
    }

    const statuses = await this.friendshipRepository.statusesFor(
      requesterId,
      users.map((u) => u.id),
    );
    return users.map((user) => ({
      user: toUserSummary(user),
      friendship: statuses.get(user.id) ?? { status: 'none', friendshipId: null },
    }));
  }

  /**
   * Sugerencias (Fase 10.1), por prioridad: compañeros de mis grupos, amigos
   * de mis amigos (con conteo), miembros de grupos amigos de mis grupos.
   * Pocas consultas: ids primero, usuarios al final (patrón visibleAuthorIds).
   */
  async suggestions(payload: FriendSuggestionsPayload): Promise<FriendSuggestionDto[]> {
    const { requesterId } = payload;

    const [friendIds, pendingIds, myMemberships] = await Promise.all([
      this.friendshipRepository.friendIdsOf(requesterId),
      this.friendshipRepository.pendingIdsOf(requesterId),
      this.prisma.groupMembership.findMany({
        where: { userId: requesterId },
        select: { groupId: true, group: { select: { name: true } } },
      }),
    ]);
    const excluded = new Set<string>([requesterId, ...friendIds, ...pendingIds]);
    const myGroupIds = myMemberships.map((m) => m.groupId);

    // 1) same_group: miembros de mis grupos.
    const sameGroup = new Map<string, string>(); // userId -> groupName
    if (myGroupIds.length > 0) {
      const members = await this.prisma.groupMembership.findMany({
        where: { groupId: { in: myGroupIds }, userId: { not: requesterId } },
        select: { userId: true, group: { select: { name: true } } },
      });
      for (const member of members) {
        if (!sameGroup.has(member.userId)) {
          sameGroup.set(member.userId, member.group.name);
        }
      }
    }

    // 2) mutual_friends: amigos de mis amigos, con conteo de conexiones.
    const mutualCount = new Map<string, number>();
    const friendSet = new Set(friendIds);
    const rows = await this.friendshipRepository.acceptedInvolving(friendIds);
    for (const row of rows) {
      // Cada fila conecta a uno de mis amigos con un tercero.
      const [a, b] = [row.requesterId, row.addresseeId];
      const candidate = friendSet.has(a) ? b : friendSet.has(b) ? a : null;
      if (!candidate) continue;
      mutualCount.set(candidate, (mutualCount.get(candidate) ?? 0) + 1);
    }

    // 3) friend_group: miembros de grupos amigos (GroupFriendship accepted).
    const friendGroup = new Map<string, string>(); // userId -> groupName
    if (myGroupIds.length > 0) {
      const groupFriendships = await this.prisma.groupFriendship.findMany({
        where: {
          status: 'accepted',
          OR: [
            { groupAId: { in: myGroupIds } },
            { groupBId: { in: myGroupIds } },
          ],
        },
        select: {
          groupAId: true,
          groupBId: true,
          groupA: { select: { name: true } },
          groupB: { select: { name: true } },
        },
      });
      const myGroupSet = new Set(myGroupIds);
      const otherGroups = new Map<string, string>(); // groupId -> name
      for (const gf of groupFriendships) {
        if (!myGroupSet.has(gf.groupAId)) otherGroups.set(gf.groupAId, gf.groupA.name);
        if (!myGroupSet.has(gf.groupBId)) otherGroups.set(gf.groupBId, gf.groupB.name);
      }
      if (otherGroups.size > 0) {
        const members = await this.prisma.groupMembership.findMany({
          where: { groupId: { in: [...otherGroups.keys()] } },
          select: { userId: true, groupId: true },
        });
        for (const member of members) {
          if (!friendGroup.has(member.userId)) {
            friendGroup.set(member.userId, otherGroups.get(member.groupId) ?? '');
          }
        }
      }
    }

    // Merge por prioridad, conservando mutualFriends cuando aplique.
    type Candidate = Pick<FriendSuggestionDto, 'reason' | 'mutualFriends' | 'groupName'>;
    const candidates = new Map<string, Candidate>();
    for (const [userId, count] of mutualCount) {
      if (excluded.has(userId)) continue;
      candidates.set(userId, { reason: 'mutual_friends', mutualFriends: count, groupName: null });
    }
    for (const [userId, groupName] of friendGroup) {
      if (excluded.has(userId) || candidates.has(userId)) continue;
      candidates.set(userId, {
        reason: 'friend_group',
        mutualFriends: mutualCount.get(userId) ?? 0,
        groupName,
      });
    }
    for (const [userId, groupName] of sameGroup) {
      if (excluded.has(userId)) continue;
      candidates.set(userId, {
        reason: 'same_group',
        mutualFriends: mutualCount.get(userId) ?? 0,
        groupName,
      });
    }

    const users = await this.friendshipRepository.findActiveUsersByIds([
      ...candidates.keys(),
    ]);
    const suggestions = users.map((user) => ({
      user: toUserSummary(user),
      ...(candidates.get(user.id) as Candidate),
    }));

    suggestions.sort((a, b) => {
      const aGroup = a.reason === 'same_group' ? 0 : 1;
      const bGroup = b.reason === 'same_group' ? 0 : 1;
      if (aGroup !== bGroup) return aGroup - bGroup;
      if (a.mutualFriends !== b.mutualFriends) return b.mutualFriends - a.mutualFriends;
      return a.user.displayName.localeCompare(b.user.displayName);
    });
    return suggestions.slice(0, SUGGESTIONS_MAX);
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
