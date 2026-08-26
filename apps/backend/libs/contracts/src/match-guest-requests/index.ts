import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { PLAYER_POSITION_IDS, PlayerPositionId } from '../profile-stats';

export type MatchGuestRequestStatus = 'open' | 'filled' | 'expired' | 'cancelled';
export type MatchGuestApplicationStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export const MIN_GUEST_REQUEST_RADIUS_KM = 1;
export const MAX_GUEST_REQUEST_RADIUS_KM = 25;
export const DEFAULT_GUEST_REQUEST_RADIUS_KM = 15;
/** Si el partido no tiene scheduledAt, la vacante vence a las N horas de abrirse. */
export const GUEST_REQUEST_DEFAULT_TTL_HOURS = 6;

export interface MatchGuestRequestDto {
  id: string;
  matchId: string;
  requestedPosition: PlayerPositionId | null;
  radiusKm: number;
  status: MatchGuestRequestStatus;
  expiresAt: string;
  match: {
    originGroupName: string;
    venueName: string | null;
    city: string | null;
    scheduledAt: string | null;
    format: string;
  };
  applicationsCount: number;
  /** Estado de la postulación del usuario que pide el listado, si tiene una. */
  myApplicationStatus: 'none' | MatchGuestApplicationStatus;
  /** Solo presente en el listado "cerca de mí" — distancia calculada server-side. */
  distanceKm?: number;
}

/** Ficha limitada del postulante — nunca incluye stats ni coordenadas. */
export interface MatchGuestApplicationDto {
  id: string;
  status: MatchGuestApplicationStatus;
  user: {
    id: string;
    displayName: string;
    alias: string | null;
    favoritePosition: string | null;
    avatarBase64: string | null;
  };
  createdAt: string;
}

export class OpenGuestRequestDto {
  @IsOptional()
  @IsIn(PLAYER_POSITION_IDS)
  requestedPosition?: PlayerPositionId;

  @IsOptional()
  @IsInt()
  @Min(MIN_GUEST_REQUEST_RADIUS_KM)
  @Max(MAX_GUEST_REQUEST_RADIUS_KM)
  radiusKm?: number;
}

export class OpenGuestRequestPayload extends OpenGuestRequestDto {
  @IsUUID()
  matchId!: string;

  @IsUUID()
  requesterId!: string;
}

export class MatchGuestRequestActionPayload {
  @IsUUID()
  matchId!: string;

  @IsUUID()
  requesterId!: string;
}

export class ListNearbyGuestRequestsPayload {
  @IsUUID()
  userId!: string;
}

export class GetGuestRequestForMatchPayload {
  @IsUUID()
  matchId!: string;

  @IsUUID()
  requesterId!: string;
}

export class ApplyGuestRequestPayload {
  @IsUUID()
  requestId!: string;

  @IsUUID()
  userId!: string;
}

export class WithdrawGuestApplicationPayload {
  @IsUUID()
  applicationId!: string;

  @IsUUID()
  userId!: string;
}

export class ListGuestApplicationsPayload {
  @IsUUID()
  requestId!: string;

  @IsUUID()
  requesterId!: string;
}

export class GuestApplicationActionPayload {
  @IsUUID()
  applicationId!: string;

  @IsUUID()
  requesterId!: string;
}
