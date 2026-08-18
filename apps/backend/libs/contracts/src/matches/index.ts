import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches as MatchesRegex,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export type MatchType = 'internal' | 'vs';

export type MatchStatus =
  | 'draft'
  | 'pending_opponent'
  | 'scheduled'
  | 'played'
  | 'cancelled';

export interface MatchParticipantDto {
  userId: string;
  email: string;
  name: string;
  confirmedAt: string;
}

export interface MatchDto {
  id: string;
  originGroupId: string;
  originGroupName: string;
  opponentGroupId: string | null;
  opponentGroupName: string | null;
  type: MatchType;
  format: string;
  maxPlayers: number;
  status: MatchStatus;
  scheduledAt: string | null;
  createdBy: string;
  reservationId: string | null;
  participants: MatchParticipantDto[];
  createdAt: string;
  updatedAt: string;
}

/** Item de GET /api/matches/mine y GET /api/matches/group/:groupId. */
export interface MatchSummaryDto {
  id: string;
  originGroupId: string;
  opponentGroupId: string | null;
  type: MatchType;
  format: string;
  maxPlayers: number;
  status: MatchStatus;
  scheduledAt: string | null;
  participantCount: number;
  createdAt: string;
}

export class CreateMatchDto {
  @IsUUID()
  originGroupId!: string;

  @IsIn(['internal', 'vs'])
  type!: MatchType;

  /** Obligatorio y validado como distinto de originGroupId en el service (regla cruzada). */
  @ValidateIf((dto: CreateMatchDto) => dto.type === 'vs')
  @IsUUID()
  opponentGroupId?: string;

  @IsString()
  @MatchesRegex(/^\d{1,2}v\d{1,2}$/, {
    message: 'format must look like 6v6, 8v8, 11v11, etc.',
  })
  format!: string;

  @IsInt()
  @Min(2)
  @Max(30)
  maxPlayers!: number;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}

export class CreateMatchPayload extends CreateMatchDto {
  @IsUUID()
  requesterId!: string;
}

/** GET detalle, accept, reject, join, leave — todos solo necesitan matchId + quién pregunta. */
export class MatchActionPayload {
  @IsUUID()
  matchId!: string;

  @IsUUID()
  requesterId!: string;
}

export class ListByGroupPayload {
  @IsUUID()
  groupId!: string;

  @IsUUID()
  requesterId!: string;
}

export class UpdateMatchStatusDto {
  @IsIn(['played', 'cancelled'])
  status!: 'played' | 'cancelled';
}

export class UpdateMatchStatusPayload extends UpdateMatchStatusDto {
  @IsUUID()
  matchId!: string;

  @IsUUID()
  requesterId!: string;
}
