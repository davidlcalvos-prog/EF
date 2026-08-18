import { Transform } from 'class-transformer';
import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PLAYER_POSITION_IDS, PlayerPositionId } from '../profile-stats';

function trimString({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
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
