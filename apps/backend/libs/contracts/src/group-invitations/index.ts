import { IsEmail, IsUUID, ValidateIf } from 'class-validator';

/**
 * Invitaciones a grupo (2026-09-11): el creador o un admin invitan y el
 * invitado acepta o rechaza. Mientras está `pending` NO es miembro a ningún
 * efecto (no existe en `group_memberships`).
 */
export type GroupInvitationStatus = 'pending' | 'accepted' | 'declined';

export interface GroupInvitationDto {
  id: string;
  status: GroupInvitationStatus;
  createdAt: string;
  respondedAt: string | null;
  group: {
    id: string;
    name: string;
    photoBase64: string | null;
    city: string | null;
    memberCount: number;
  };
  /** El invitado (para la lista del líder). */
  user: {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
    avatarBase64: string | null;
  };
  /** Quién invitó (informativo: la invitación es del grupo). */
  invitedBy: {
    id: string;
    firstname: string;
    lastname: string;
  };
}

/** Por userId o por email, uno de los dos (heredado del alta directa, borrada en el build 7). */
export class InviteToGroupDto {
  @ValidateIf((dto: InviteToGroupDto) => !dto.email)
  @IsUUID()
  userId?: string;

  @ValidateIf((dto: InviteToGroupDto) => !dto.userId)
  @IsEmail()
  email?: string;
}

export class InviteToGroupPayload extends InviteToGroupDto {
  @IsUUID()
  groupId!: string;

  @IsUUID()
  requesterId!: string;
}

export class ListGroupInvitationsPayload {
  @IsUUID()
  groupId!: string;

  @IsUUID()
  requesterId!: string;
}

export class GroupInvitationActionPayload {
  @IsUUID()
  invitationId!: string;

  @IsUUID()
  requesterId!: string;
}

export class ListMyGroupInvitationsPayload {
  @IsUUID()
  requesterId!: string;
}
