import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { PLAYER_POSITION_IDS, PlayerPositionId } from '../profile-stats';

function trimString({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

/** Mismo valor que MAX_GROUP_PHOTO_BASE64_LENGTH (groups) — ~375KB de imagen real. */
export const MAX_AVATAR_BASE64_LENGTH = 500_000;

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarBase64: string | null;
  /** Zona (Fase L.0). Nunca se exponen lat/lng de personas. */
  city: string | null;
  department: string | null;
  municipalityCode: string | null;
  createdAt: Date;
}

export class UpdateProfileDto {
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MinLength(2, { message: 'name must be at least 2 characters' })
  @MaxLength(80, { message: 'name must be at most 80 characters' })
  @Matches(/^[\p{L}\p{M}][\p{L}\p{M}\s'.-]*$/u, {
    message: 'name contains invalid characters',
  })
  name?: string;

  @IsOptional()
  @IsIn(PLAYER_POSITION_IDS)
  favoritePosition?: PlayerPositionId | null;

  @IsOptional()
  @IsString()
  avatarBase64?: string;

  /** Si viene true, se ignora avatarBase64 y el perfil queda con avatarBase64: null. */
  @IsOptional()
  @IsBoolean()
  removeAvatar?: boolean;

  /**
   * Código DANE del municipio (Fase L.0); null limpia la zona. El servidor
   * resuelve city/department/lat/lng del dato estático — nunca del cliente.
   */
  @IsOptional()
  @ValidateIf((dto: UpdateProfileDto) => dto.municipalityCode !== null)
  @Matches(/^\d{5}$/, { message: 'municipalityCode must be a 5-digit DANE code' })
  municipalityCode?: string | null;
}

export class UpdatePreferencesDto {
  @IsObject()
  preferences!: Record<string, unknown>;
}

export interface UserPreferences {
  userId: string;
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
  metadata?: Record<string, unknown>;
}
