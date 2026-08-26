import { IsIn, IsOptional, IsUUID } from 'class-validator';

export type UserFriendshipStatus = 'pending' | 'accepted';

export type UserFriendshipFilter = 'accepted' | 'pending_received' | 'pending_sent';

export const USER_FRIENDSHIP_FILTERS: UserFriendshipFilter[] = [
  'accepted',
  'pending_received',
  'pending_sent',
];

/**
 * Amistad vista desde el usuario autenticado: `user` es siempre "el otro";
 * la dirección real de la solicitud se expone solo como requestedByMe.
 */
export interface UserFriendshipDto {
  id: string;
  status: UserFriendshipStatus;
  /** true si el usuario autenticado fue quien envió la solicitud */
  requestedByMe: boolean;
  /** el otro usuario */
  user: {
    id: string;
    displayName: string;
    alias: string | null;
    favoritePosition: string | null;
    avatarBase64: string | null;
  };
  createdAt: string;
}

/** Estado de relación con otro usuario, para la ficha pública. */
export interface FriendshipStatusDto {
  status: 'none' | 'pending_sent' | 'pending_received' | 'accepted';
  friendshipId: string | null;
}

export class RequestUserFriendshipDto {
  @IsUUID()
  userId!: string;
}

export class RequestUserFriendshipPayload {
  @IsUUID()
  requesterId!: string;

  @IsUUID()
  userId!: string;
}

export class ListUserFriendshipsPayload {
  @IsUUID()
  requesterId!: string;

  @IsOptional()
  @IsIn(USER_FRIENDSHIP_FILTERS)
  filter?: UserFriendshipFilter;
}

export class GetFriendshipStatusPayload {
  @IsUUID()
  requesterId!: string;

  @IsUUID()
  otherUserId!: string;
}

/** Accept / remove — quién pregunta y sobre qué amistad. */
export class UserFriendshipActionPayload {
  @IsUUID()
  friendshipId!: string;

  @IsUUID()
  requesterId!: string;
}
