import { IsString, IsUUID, MinLength } from 'class-validator';

export type GroupFriendshipStatus = 'pending' | 'accepted';

/**
 * groupAId/groupBId son siempre el par canonicalizado (orden de string,
 * ver GroupFriendshipsService) — no necesariamente origen/destino de la
 * solicitud, para eso está requestedByGroupId.
 */
export interface GroupFriendshipDto {
  id: string;
  groupAId: string;
  groupBId: string;
  status: GroupFriendshipStatus;
  requestedByGroupId: string;
  createdAt: string;
  updatedAt: string;
}

export class RequestGroupFriendshipDto {
  @IsUUID()
  targetGroupId!: string;
}

export class RequestGroupFriendshipPayload extends RequestGroupFriendshipDto {
  @IsUUID()
  groupId!: string;

  @IsUUID()
  requesterId!: string;
}

/** Accept / remove — solo necesitan saber quién pregunta y sobre qué amistad. */
export class GroupFriendshipActionPayload {
  @IsUUID()
  friendshipId!: string;

  @IsUUID()
  requesterId!: string;
}

export class ListGroupFriendshipsPayload {
  @IsUUID()
  groupId!: string;

  @IsUUID()
  requesterId!: string;
}

/** Item de GET /groups/search — nunca expone la lista de miembros. */
export interface GroupSearchResultDto {
  id: string;
  name: string;
  photoBase64: string | null;
  memberCount: number;
}

export class SearchGroupsDto {
  @IsString()
  @MinLength(2, { message: 'q must be at least 2 characters' })
  q!: string;
}
