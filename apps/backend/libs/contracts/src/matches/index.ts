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

export type MatchTeam = 'A' | 'B';

export interface MatchParticipantDto {
  userId: string;
  email: string;
  name: string;
  confirmedAt: string;
  /** null hasta que el líder sortea equipos (Fase 6.5.4, solo partidos internal). */
  team: MatchTeam | null;
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
  /** null si nunca se sortearon equipos; se pisa en cada re-sorteo. */
  teamsRandomizedAt: string | null;
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

export interface RandomizeTeamsPayload {
  matchId: string;
  requesterId: string;
}

export type PositionCategory = 'goalkeeper' | 'defense' | 'midfield' | 'forward';

/**
 * `message` es texto interno de depuración (en español) — el mobile NO lo
 * muestra tal cual, traduce a partir de `team` + `position` (ver "Antes de
 * terminar" de la Fase 6.5.4: no se muestra texto crudo del backend en los
 * otros 6 idiomas).
 */
export interface TeamAssignmentWarningDto {
  team: MatchTeam;
  position: PositionCategory;
  message: string;
}

export interface RandomizeTeamsResultDto {
  match: MatchDto;
  warnings: TeamAssignmentWarningDto[];
}

/**
 * Mensajes de error estables para que el gateway distinga sub-razones de un
 * mismo 409 — toHttpException solo preserva `message` a través del límite de
 * microservicio (ver libs/common/src/rpc/microservice-error.util.ts), así que
 * no se puede viajar un campo extra tipo `reason`. El cliente mobile duplica
 * estos strings literalmente (mismo criterio que el resto de DTOs, que se
 * calcan a mano en services/api/types.ts).
 */
export const RANDOMIZE_TEAMS_ERRORS = {
  NOT_FULL: 'Match is not full yet',
  INVALID_STATUS: 'Match must be scheduled to randomize teams',
} as const;
