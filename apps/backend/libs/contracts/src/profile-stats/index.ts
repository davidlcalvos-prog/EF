import { IsArray, IsIn, IsInt, IsObject, IsUUID, Max, Min } from 'class-validator';

/**
 * Debe mantenerse en sync manualmente con
 * apps/mobile/app/data/mockPlayerProfile.ts (StatKey / PhysicalTestId)
 * — el mobile y el backend son paquetes npm independientes, sin tipos compartidos.
 */
export type StatKey =
  | 'attack'
  | 'defense'
  | 'endurance'
  | 'speed'
  | 'passes'
  | 'dribbling';

export type PhysicalTestId =
  | 'attackShots16m'
  | 'defenseControl'
  | 'beepTest'
  | 'sprint30m'
  | 'loughboroughPass'
  | 'illinoisAgility';

export const PHYSICAL_TEST_IDS: PhysicalTestId[] = [
  'attackShots16m',
  'defenseControl',
  'beepTest',
  'sprint30m',
  'loughboroughPass',
  'illinoisAgility',
];

export const TEST_ID_TO_STAT_KEY: Record<PhysicalTestId, StatKey> = {
  attackShots16m: 'attack',
  defenseControl: 'defense',
  beepTest: 'endurance',
  sprint30m: 'speed',
  loughboroughPass: 'passes',
  illinoisAgility: 'dribbling',
};

/**
 * Debe mantenerse en sync con apps/mobile/app/data/suggestPlayerPosition.ts (PlayerPositionId).
 */
export type PlayerPositionId =
  | 'goalkeeper'
  | 'striker'
  | 'winger'
  | 'cam'
  | 'cm'
  | 'cdm'
  | 'fullback'
  | 'centerback';

export const PLAYER_POSITION_IDS: PlayerPositionId[] = [
  'goalkeeper',
  'striker',
  'winger',
  'cam',
  'cm',
  'cdm',
  'fullback',
  'centerback',
];

export type PlayerStatsDto = Record<StatKey, number> & { updatedAt: string };

export interface PhysicalTestResultDto {
  id: string;
  testId: PhysicalTestId;
  rawData: Record<string, unknown>;
  score: number;
  completedAt: string;
}

export interface PsychAssessmentDto {
  id: string;
  answers: number[];
  teamworkScore: number;
  onFieldScore: number;
  overallScore: number;
  traits: Record<string, number>;
  completedAt: string;
}

/** Respuesta de GET /api/profile/stats — usada por mobile para reconstruir el perfil en un dispositivo nuevo. */
export interface ProfileStatsResponseDto {
  stats: PlayerStatsDto | null;
  latestTestResults: Partial<Record<PhysicalTestId, PhysicalTestResultDto>>;
  latestPsychAssessment: PsychAssessmentDto | null;
  favoritePosition: PlayerPositionId | null;
}

/**
 * Ficha de OTRO usuario — solo lo que puede verse entre compañeros de grupo.
 * Nada de psicológico ni tests crudos, a propósito.
 */
export interface PublicMemberProfileDto {
  userId: string;
  name: string;
  avatarBase64: string | null;
  favoritePosition: PlayerPositionId | null;
  stats: PlayerStatsDto | null;
}

export class GetPublicMemberProfilePayload {
  @IsUUID()
  userId!: string;

  @IsUUID()
  requesterId!: string;
}

export class SavePhysicalTestResultDto {
  @IsObject()
  rawData!: Record<string, unknown>;

  @IsInt()
  @Min(0)
  @Max(100)
  score!: number;
}

export class SavePhysicalTestResultPayload extends SavePhysicalTestResultDto {
  @IsUUID()
  userId!: string;

  @IsIn(PHYSICAL_TEST_IDS)
  testId!: PhysicalTestId;
}

export class SavePsychAssessmentDto {
  @IsArray()
  @IsInt({ each: true })
  answers!: number[];

  @IsInt()
  @Min(0)
  @Max(100)
  teamworkScore!: number;

  @IsInt()
  @Min(0)
  @Max(100)
  onFieldScore!: number;

  @IsInt()
  @Min(0)
  @Max(100)
  overallScore!: number;

  @IsObject()
  traits!: Record<string, number>;
}

export class SavePsychAssessmentPayload extends SavePsychAssessmentDto {
  @IsUUID()
  userId!: string;
}

export class UserIdPayload {
  @IsUUID()
  userId!: string;
}
