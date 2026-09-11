import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@ef/database';
import { GroupInvitationDto, GroupInvitationStatus } from '@ef/contracts';

export interface InvitationRow {
  id: string;
  groupId: string;
  userId: string;
  invitedBy: string;
  status: GroupInvitationStatus;
}

const invitationInclude = {
  group: {
    select: {
      id: true,
      name: true,
      photoBase64: true,
      city: true,
      _count: { select: { members: true } },
    },
  },
  user: {
    select: {
      id: true,
      email: true,
      firstname: true,
      lastname: true,
      profile: { select: { avatarBase64: true } },
    },
  },
  inviter: { select: { id: true, firstname: true, lastname: true } },
} satisfies Prisma.GroupInvitationInclude;

type InvitationWithRelations = Prisma.GroupInvitationGetPayload<{ include: typeof invitationInclude }>;

/**
 * Tabla aparte de `group_memberships` (2026-09-11): acá viven las invitaciones;
 * la membresía solo aparece al aceptar, dentro de `accept()`.
 */
@Injectable()
export class GroupInvitationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByGroupAndUser(groupId: string, userId: string): Promise<InvitationRow | null> {
    return this.prisma.groupInvitation.findUnique({
      where: { groupId_userId: { groupId, userId } },
      select: { id: true, groupId: true, userId: true, invitedBy: true, status: true },
    });
  }

  async findById(id: string): Promise<InvitationRow | null> {
    return this.prisma.groupInvitation.findUnique({
      where: { id },
      select: { id: true, groupId: true, userId: true, invitedBy: true, status: true },
    });
  }

  /** INSERT; si dos líderes invitan a la vez, el unique (groupId, userId) corta al segundo con 409. */
  async createPending(groupId: string, userId: string, invitedBy: string): Promise<string> {
    try {
      const row = await this.prisma.groupInvitation.create({
        data: { groupId, userId, invitedBy },
        select: { id: true },
      });
      return row.id;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('User already has a pending invitation to this group');
      }
      throw error;
    }
  }

  /** Reinvitar tras un rechazo (o tras una aceptación cuyo miembro fue expulsado después): misma fila, vuelve a `pending`. */
  async reopen(id: string, invitedBy: string): Promise<void> {
    await this.prisma.groupInvitation.update({
      where: { id },
      data: { status: 'pending', invitedBy, respondedAt: null, createdAt: new Date() },
    });
  }

  /**
   * Aceptar: membresía `member` + invitación `accepted` en UNA transacción.
   * Si el usuario ya era miembro (agregado por otro camino entre medio), la
   * invitación se marca `accepted` igual para que no quede colgada y se
   * devuelve `alreadyMember: true` (el servicio responde 409).
   */
  async accept(invitationId: string, groupId: string, userId: string): Promise<{ alreadyMember: boolean }> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.groupMembership.findUnique({
        where: { groupId_userId: { groupId, userId } },
        select: { id: true },
      });
      if (!existing) {
        await tx.groupMembership.create({ data: { groupId, userId, role: 'member' } });
      }
      await tx.groupInvitation.update({
        where: { id: invitationId },
        data: { status: 'accepted', respondedAt: new Date() },
      });
      return { alreadyMember: !!existing };
    });
  }

  async decline(invitationId: string): Promise<void> {
    await this.prisma.groupInvitation.update({
      where: { id: invitationId },
      data: { status: 'declined', respondedAt: new Date() },
    });
  }

  /** Cancelar (líder): se borra la fila; reinvitar después crea una nueva. */
  async delete(invitationId: string): Promise<void> {
    await this.prisma.groupInvitation.delete({ where: { id: invitationId } });
  }

  /** Para el líder: pendientes y rechazadas del grupo (las aceptadas ya son miembros). */
  async listForGroup(groupId: string): Promise<GroupInvitationDto[]> {
    const rows = await this.prisma.groupInvitation.findMany({
      where: { groupId, status: { in: ['pending', 'declined'] } },
      include: invitationInclude,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toDto(row));
  }

  /** Para el invitado: solo pendientes. */
  async listMineForUser(userId: string): Promise<GroupInvitationDto[]> {
    const rows = await this.prisma.groupInvitation.findMany({
      where: { userId, status: 'pending' },
      include: invitationInclude,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toDto(row));
  }

  async getDto(invitationId: string): Promise<GroupInvitationDto | null> {
    const row = await this.prisma.groupInvitation.findUnique({
      where: { id: invitationId },
      include: invitationInclude,
    });
    return row ? this.toDto(row) : null;
  }

  async findUserName(userId: string): Promise<{ firstname: string; lastname: string } | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstname: true, lastname: true },
    });
  }

  private toDto(row: InvitationWithRelations): GroupInvitationDto {
    return {
      id: row.id,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      respondedAt: row.respondedAt ? row.respondedAt.toISOString() : null,
      group: {
        id: row.group.id,
        name: row.group.name,
        photoBase64: row.group.photoBase64,
        city: row.group.city,
        memberCount: row.group._count.members,
      },
      user: {
        id: row.user.id,
        email: row.user.email,
        firstname: row.user.firstname,
        lastname: row.user.lastname,
        avatarBase64: row.user.profile?.avatarBase64 ?? null,
      },
      invitedBy: {
        id: row.inviter.id,
        firstname: row.inviter.firstname,
        lastname: row.inviter.lastname,
      },
    };
  }
}
