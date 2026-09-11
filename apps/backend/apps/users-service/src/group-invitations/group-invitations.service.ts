import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  GroupInvitationActionPayload,
  GroupInvitationDto,
  InviteToGroupPayload,
  ListGroupInvitationsPayload,
  ListMyGroupInvitationsPayload,
} from '@ef/contracts';
import { GroupRepository } from '../groups/repositories/group.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { GroupInvitationRepository } from './repositories/group-invitation.repository';

type GroupRole = 'creator' | 'admin' | 'member';

/**
 * Invitaciones a grupo (2026-09-11). Reemplaza al alta directa de miembros:
 * el creador/admin invita, el invitado acepta o rechaza, y la membresía se
 * crea RECIÉN al aceptar. Mientras está pendiente no es miembro a ningún
 * efecto (no existe en `group_memberships`).
 */
@Injectable()
export class GroupInvitationsService {
  private readonly logger = new Logger(GroupInvitationsService.name);

  constructor(
    private readonly invitationRepository: GroupInvitationRepository,
    private readonly groupRepository: GroupRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  async invite(payload: InviteToGroupPayload): Promise<GroupInvitationDto> {
    const { groupId, requesterId } = payload;
    const group = await this.requireLeadership(groupId, requesterId);

    const targetUserId = payload.userId ?? (await this.resolveUserIdByEmail(payload.email!));

    // Ya es miembro (incluido invitarse a uno mismo): 409, como el alta directa de antes.
    const membership = await this.groupRepository.findMembership(groupId, targetUserId);
    if (membership) {
      throw new ConflictException('User is already a member of this group');
    }

    const existing = await this.invitationRepository.findByGroupAndUser(groupId, targetUserId);
    let invitationId: string;
    if (existing?.status === 'pending') {
      // Duplicada: 409 y SIN segundo push.
      throw new ConflictException('User already has a pending invitation to this group');
    } else if (existing) {
      // Rechazada (o aceptada y luego expulsado): se reabre la misma fila.
      await this.invitationRepository.reopen(existing.id, requesterId);
      invitationId = existing.id;
    } else {
      invitationId = await this.invitationRepository.createPending(groupId, targetUserId, requesterId);
    }

    await this.notifyInvitee(targetUserId, invitationId, group.id, group.name, requesterId);

    return (await this.invitationRepository.getDto(invitationId))!;
  }

  async listForGroup(payload: ListGroupInvitationsPayload): Promise<GroupInvitationDto[]> {
    await this.requireLeadership(payload.groupId, payload.requesterId);
    return this.invitationRepository.listForGroup(payload.groupId);
  }

  async cancel(payload: GroupInvitationActionPayload): Promise<{ success: true }> {
    const invitation = await this.requireInvitation(payload.invitationId);
    await this.requireLeadership(invitation.groupId, payload.requesterId);
    if (invitation.status !== 'pending') {
      throw new ConflictException('Only pending invitations can be cancelled');
    }
    await this.invitationRepository.delete(invitation.id);
    return { success: true };
  }

  listMine(payload: ListMyGroupInvitationsPayload): Promise<GroupInvitationDto[]> {
    return this.invitationRepository.listMineForUser(payload.requesterId);
  }

  /**
   * Aceptar: solo el invitado, solo si sigue `pending`. Grupo borrado = la
   * invitación cayó en cascada → 404. Si ya era miembro por otro camino, la
   * invitación se cierra igual y se responde 409.
   */
  async accept(payload: GroupInvitationActionPayload): Promise<GroupInvitationDto> {
    const invitation = await this.requireOwnPendingInvitation(payload);
    const { alreadyMember } = await this.invitationRepository.accept(
      invitation.id,
      invitation.groupId,
      invitation.userId,
    );
    if (alreadyMember) {
      throw new ConflictException('User is already a member of this group');
    }
    return (await this.invitationRepository.getDto(invitation.id))!;
  }

  async decline(payload: GroupInvitationActionPayload): Promise<{ success: true }> {
    const invitation = await this.requireOwnPendingInvitation(payload);
    await this.invitationRepository.decline(invitation.id);
    return { success: true };
  }

  // ── Privados ─────────────────────────────────────────────────────────

  /**
   * "{Nombre} te invitó al grupo {grupo}". Sale por NotificationsService, así
   * que hereda el filtro de user_preferences.notifications: quien las tiene
   * apagadas no recibe push pero SÍ ve la invitación en Grupos y el punto
   * naranja (el contador no depende del push).
   */
  private async notifyInvitee(
    inviteeId: string,
    invitationId: string,
    groupId: string,
    groupName: string,
    inviterId: string,
  ): Promise<void> {
    try {
      const inviter = await this.invitationRepository.findUserName(inviterId);
      const inviterName = inviter
        ? [inviter.firstname, inviter.lastname].filter(Boolean).join(' ').trim()
        : 'Alguien';
      await this.notificationsService.sendToUser(
        inviteeId,
        'Invitación a grupo',
        `${inviterName} te invitó al grupo ${groupName}`,
        {
          v: 1,
          type: 'group_invitation',
          screen: 'Groups',
          params: { initialSection: 'invitations', invitationId, groupId },
          pending: 'groupInvites',
        },
      );
    } catch (error) {
      this.logger.error(`Failed to notify group invitation ${invitationId}: ${String(error)}`);
    }
  }

  private async requireInvitation(invitationId: string) {
    const invitation = await this.invitationRepository.findById(invitationId);
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }
    return invitation;
  }

  private async requireOwnPendingInvitation(payload: GroupInvitationActionPayload) {
    const invitation = await this.requireInvitation(payload.invitationId);
    if (invitation.userId !== payload.requesterId) {
      throw new ForbiddenException('This invitation is not yours');
    }
    if (invitation.status !== 'pending') {
      throw new ConflictException('This invitation was already answered');
    }
    return invitation;
  }

  /** Mismo guard que el alta directa de antes: grupo existente (404), miembro (403), creador o admin (403). */
  private async requireLeadership(groupId: string, userId: string) {
    const group = await this.groupRepository.findGroupById(groupId);
    if (!group) {
      throw new NotFoundException(`Group ${groupId} not found`);
    }
    const membership = await this.groupRepository.findMembership(groupId, userId);
    if (!membership) {
      throw new ForbiddenException('You are not a member of this group');
    }
    const role = membership.role as GroupRole;
    if (role !== 'creator' && role !== 'admin') {
      throw new ForbiddenException('Only the creator or an admin can invite members');
    }
    return group;
  }

  private async resolveUserIdByEmail(email: string): Promise<string> {
    const user = await this.groupRepository.findUserByEmail(email);
    if (!user) {
      throw new NotFoundException(`No user found with email ${email}`);
    }
    return user.id;
  }
}
