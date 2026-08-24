import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { OwnerPayload } from '../venues';

export * from './domain';

export type TournamentCourtSizeDto = '6vs6' | '8vs8' | '11vs11';
export type TournamentFormatDto = 'groups_of_4' | 'round_robin' | 'brackets';
export type TournamentStatusDto = 'draft' | 'registration' | 'active' | 'finished';
export type TournamentMatchStatusDto =
  | 'scheduled'
  | 'played'
  | 'walkover_home'
  | 'walkover_away';
/** private = Torneos privados (7.1, dueño de cancha). elite_forge = Copa Elite Forge (7.2, Administrador). */
export type TournamentKindDto = 'private' | 'elite_forge';

export interface TournamentScheduleDto {
  weekdays: number[];
  startHour: number;
  endHour: number;
  matchDurationHours: number;
  courtsPerSlot: number;
}

export interface TournamentPlayerDto {
  id: string;
  name: string;
  isGoalkeeper: boolean;
  goals: number;
  goalsAgainst: number;
  assists: number;
  dfr: number;
  yellowCards: number;
  redCards: number;
}

export interface TournamentTeamDto {
  id: string;
  name: string;
  players: TournamentPlayerDto[];
  wins: number;
  draws: number;
  losses: number;
  lossesByW: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  groupId: string | null;
}

export interface TournamentMatchPlayerStatDto {
  playerId: string;
  teamId: string;
  goals: number;
  assists: number;
  goalsAgainst: number;
  dfr: number;
  yellowCards: number;
  redCards: number;
}

export interface TournamentMatchDto {
  id: string;
  roundLabel: string;
  keyIndex: number;
  homeTeamId: string;
  awayTeamId: string;
  homeGoals: number | null;
  awayGoals: number | null;
  status: TournamentMatchStatusDto;
  playerStats: TournamentMatchPlayerStatDto[];
  startsAt: string | null;
  endsAt: string | null;
  courtNumber: number;
}

export interface TournamentDto {
  id: string;
  ownerId: string;
  kind: TournamentKindDto;
  /** Cancha fija (private) o null (elite_forge — la cancha se decide por partido). */
  venueId: string | null;
  name: string;
  courtSize: TournamentCourtSizeDto;
  format: TournamentFormatDto;
  maxTeams: number;
  bracketKeys: number;
  extraRoundEnabled: boolean;
  status: TournamentStatusDto;
  schedule: TournamentScheduleDto;
  teams: TournamentTeamDto[];
  matches: TournamentMatchDto[];
  createdAt: string;
  updatedAt: string;
}

/** Resultado de GENERATE_FIXTURE / ADD_EXTRA_ROUND — incluye cuántos partidos quedaron sin reserva por choque de horario. */
export interface GenerateFixtureResultDto {
  tournament: TournamentDto;
  unscheduledCount: number;
}

export class TournamentScheduleInputDto {
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  weekdays!: number[];

  @IsInt()
  @Min(0)
  @Max(23)
  startHour!: number;

  @IsInt()
  @Min(1)
  @Max(24)
  endHour!: number;

  @IsInt()
  @Min(1)
  @Max(4)
  matchDurationHours!: number;

  @IsInt()
  @Min(1)
  @Max(2)
  courtsPerSlot!: number;
}

export class CreateTournamentDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsUUID()
  venueId!: string;

  @IsIn(['6vs6', '8vs8', '11vs11'])
  courtSize!: TournamentCourtSizeDto;

  @IsIn(['groups_of_4', 'round_robin', 'brackets'])
  format!: TournamentFormatDto;

  @IsInt()
  @Min(2)
  @Max(16)
  maxTeams!: number;

  @IsInt()
  @Min(1)
  @Max(8)
  bracketKeys!: number;

  @ValidateNested()
  @Type(() => TournamentScheduleInputDto)
  schedule!: TournamentScheduleInputDto;
}

export class CreateTournamentPayload extends CreateTournamentDto {
  @IsUUID()
  ownerId!: string;
}

/**
 * Copa Elite Forge (Fase 7.2) — mismos campos que CreateTournamentDto salvo
 * venueId: acá no hay cancha fija, se asigna por partido al generar el fixture.
 */
export class CreateEliteForgeTournamentDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsIn(['6vs6', '8vs8', '11vs11'])
  courtSize!: TournamentCourtSizeDto;

  @IsIn(['groups_of_4', 'round_robin', 'brackets'])
  format!: TournamentFormatDto;

  @IsInt()
  @Min(2)
  @Max(16)
  maxTeams!: number;

  @IsInt()
  @Min(1)
  @Max(8)
  bracketKeys!: number;

  @ValidateNested()
  @Type(() => TournamentScheduleInputDto)
  schedule!: TournamentScheduleInputDto;
}

export class CreateEliteForgeTournamentPayload extends CreateEliteForgeTournamentDto {
  @IsUUID()
  ownerId!: string;
}

export class UpdateTournamentDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsIn(['6vs6', '8vs8', '11vs11'])
  courtSize?: TournamentCourtSizeDto;

  @IsOptional()
  @IsIn(['groups_of_4', 'round_robin', 'brackets'])
  format?: TournamentFormatDto;

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(16)
  maxTeams?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(8)
  bracketKeys?: number;

  @IsOptional()
  @IsBoolean()
  extraRoundEnabled?: boolean;

  @IsOptional()
  @IsIn(['draft', 'registration', 'active', 'finished'])
  status?: TournamentStatusDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TournamentScheduleInputDto)
  schedule?: TournamentScheduleInputDto;
}

export class UpdateTournamentPayload extends UpdateTournamentDto {
  @IsUUID()
  tournamentId!: string;

  @IsUUID()
  ownerId!: string;
}

export class TournamentPlayerInputDto {
  /** Puede ser un uuid real (jugador ya guardado) o un id temporal generado en el cliente (jugador nuevo). */
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsBoolean()
  isGoalkeeper!: boolean;
}

export class TournamentTeamInputDto {
  /** Igual que arriba: uuid real o id temporal si es un equipo nuevo. */
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  groupId?: string | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TournamentPlayerInputDto)
  players!: TournamentPlayerInputDto[];
}

export class UpsertTournamentTeamsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TournamentTeamInputDto)
  teams!: TournamentTeamInputDto[];
}

export class UpsertTournamentTeamsPayload extends UpsertTournamentTeamsDto {
  @IsUUID()
  tournamentId!: string;

  @IsUUID()
  ownerId!: string;
}

export class TournamentMatchStatPayload {
  @IsString()
  playerId!: string;

  @IsUUID()
  teamId!: string;

  @IsInt()
  @Min(0)
  goals!: number;

  @IsInt()
  @Min(0)
  assists!: number;

  @IsInt()
  @Min(0)
  goalsAgainst!: number;

  @IsInt()
  @Min(0)
  dfr!: number;

  @IsInt()
  @Min(0)
  yellowCards!: number;

  @IsInt()
  @Min(0)
  redCards!: number;
}

export class UpdateTournamentMatchResultDto {
  @IsIn(['scheduled', 'played', 'walkover_home', 'walkover_away'])
  status!: TournamentMatchStatusDto;

  @IsOptional()
  @IsInt()
  @Min(0)
  homeGoals?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  awayGoals?: number | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TournamentMatchStatPayload)
  playerStats?: TournamentMatchStatPayload[];
}

export class UpdateTournamentMatchResultPayload extends UpdateTournamentMatchResultDto {
  @IsUUID()
  tournamentId!: string;

  @IsUUID()
  matchId!: string;

  @IsUUID()
  ownerId!: string;
}

export class TournamentIdPayload {
  @IsUUID()
  tournamentId!: string;

  @IsUUID()
  ownerId!: string;
}

export { OwnerPayload as ListTournamentsMinePayload };

// --- Copa Elite Forge (Fase 7.2): lado jugador (cualquier autenticado) ---

export class GetPublicTournamentDto {
  @IsUUID()
  tournamentId!: string;
}

/** El lider de grupo inscribe a SU grupo, eligiendo manualmente el roster. */
export class EnrollGroupDto {
  @IsUUID()
  groupId!: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  playerUserIds!: string[];
}

export class EnrollGroupPayload extends EnrollGroupDto {
  @IsUUID()
  tournamentId!: string;

  /** El usuario autenticado que pide inscribir — se valida que sea creator/admin del groupId. */
  @IsUUID()
  requesterId!: string;
}

// --- Copa Elite Forge (Fase 7.2): lado dueño de cancha sintética ---

/** Un partido de Copa Elite Forge que le tocó a la cancha de este owner. */
export interface AssignedTournamentMatchDto {
  matchId: string;
  tournamentId: string;
  tournamentName: string;
  homeTeamName: string;
  awayTeamName: string;
  startsAt: string | null;
  endsAt: string | null;
  courtNumber: number;
  matchStatus: TournamentMatchStatusDto;
  /** Null si el partido quedó sin reserva (choque de horario al momento de generar). */
  reservationId: string | null;
  reservationStatus: 'pending' | 'confirmed' | 'cancelled' | null;
}
