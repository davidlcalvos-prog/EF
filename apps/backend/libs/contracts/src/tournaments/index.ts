import { Type } from 'class-transformer';
import {
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
  venueId: string;
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
