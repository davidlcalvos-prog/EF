import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export type GroupMemberRole = 'creator' | 'admin' | 'member';

export const MAX_GROUP_ADMINS = 2;

export interface GroupMemberDto {
  userId: string;
  email: string;
  name: string;
  role: GroupMemberRole;
  joinedAt: string;
}

/** Item de GET /api/groups/mine — incluye el rol del usuario autenticado en ese grupo. */
export interface GroupSummaryDto {
  id: string;
  name: string;
  photoBase64: string | null;
  creatorId: string;
  role: GroupMemberRole;
  memberCount: number;
  createdAt: string;
}

export interface GroupDetailDto {
  id: string;
  name: string;
  photoBase64: string | null;
  creatorId: string;
  members: GroupMemberDto[];
  createdAt: string;
  updatedAt: string;
}

export class CreateGroupDto {
  @IsString()
  @MinLength(2, { message: 'name must be at least 2 characters' })
  @MaxLength(80, { message: 'name must be at most 80 characters' })
  name!: string;
}

export class CreateGroupPayload extends CreateGroupDto {
  @IsUUID()
  creatorId!: string;
}

/** ~375KB de imagen real, suficiente para un avatar cuadrado comprimido. */
export const MAX_GROUP_PHOTO_BASE64_LENGTH = 500_000;

/**
 * Renombrar el grupo y cambiarle la foto — solo el creator (mismo criterio que
 * deleteGroup: identidad del grupo, no gestión de miembros). La foto se guarda
 * como base64 directo en Postgres (sin storage real todavía, ver decisión de
 * alcance de la Fase 6.5.1).
 */
export class UpdateGroupDto {
  @IsString()
  @MinLength(2, { message: 'name must be at least 2 characters' })
  @MaxLength(80, { message: 'name must be at most 80 characters' })
  name!: string;

  @IsOptional()
  @IsString()
  photoBase64?: string;

  /** Si viene true, se ignora photoBase64 y el grupo queda con photoBase64: null. */
  @IsOptional()
  @IsBoolean()
  removePhoto?: boolean;
}

export interface UpdateGroupPayload {
  groupId: string;
  requesterId: string;
  name: string;
  photoBase64?: string;
  removePhoto?: boolean;
}

/** Agregar miembro directo (sin invitación) — por userId o por email, uno de los dos. */
export class AddMemberDto {
  @ValidateIf((dto: AddMemberDto) => !dto.email)
  @IsUUID()
  userId?: string;

  @ValidateIf((dto: AddMemberDto) => !dto.userId)
  @IsEmail()
  email?: string;
}

export class AddMemberPayload extends AddMemberDto {
  @IsUUID()
  groupId!: string;

  @IsUUID()
  requesterId!: string;
}

export class UpdateMemberRoleDto {
  /** No se acepta 'creator' aquí — el rol de creador no se transfiere en esta fase. */
  @IsIn(['admin', 'member'])
  role!: 'admin' | 'member';
}

export class UpdateMemberRolePayload extends UpdateMemberRoleDto {
  @IsUUID()
  groupId!: string;

  @IsUUID()
  requesterId!: string;

  @IsUUID()
  targetUserId!: string;
}

/** GET detalle / DELETE grupo — solo necesitan saber quién pregunta y sobre qué grupo. */
export class GroupActionPayload {
  @IsUUID()
  groupId!: string;

  @IsUUID()
  requesterId!: string;
}

export class RemoveMemberPayload {
  @IsUUID()
  groupId!: string;

  @IsUUID()
  requesterId!: string;

  @IsUUID()
  targetUserId!: string;
}
