import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

function trimString({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function normalizeEmail({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

/**
 * Fase W.3 — alta de dueños de cancha (Empresario) desde el portal de
 * Administrador. Los dueños no se registran solos: el registro público
 * rechaza ese rol a propósito; los da de alta un Administrador. Mismas
 * reglas de saneo que RegisterDto (email normalizado, nombre saneado,
 * contraseña con letra + número).
 */
export class CreateVenueOwnerDto {
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'email must be a valid email address' })
  @MaxLength(254)
  email!: string;

  @Transform(trimString)
  @IsString()
  @MinLength(2, { message: 'name must be at least 2 characters' })
  @MaxLength(80, { message: 'name must be at most 80 characters' })
  @Matches(/^[\p{L}\p{M}][\p{L}\p{M}\s'.-]*$/u, {
    message: 'name contains invalid characters',
  })
  name!: string;

  /** Temporal: el Administrador se la comunica al dueño, que la cambia después. */
  @IsString()
  @MinLength(8, { message: 'password must be at least 8 characters' })
  @MaxLength(72, { message: 'password must be at most 72 characters' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'password must contain at least one letter and one number',
  })
  password!: string;
}

export class SetVenueOwnerStatusDto {
  @IsBoolean()
  estado!: boolean;
}

export class SetVenueOwnerStatusPayload extends SetVenueOwnerStatusDto {
  @IsUUID()
  userId!: string;
}

export interface VenueOwnerDto {
  id: string;
  email: string;
  name: string;
  estado: boolean;
  createdAt: string;
  /** Nombre de su complejo si ya lo creó (primero por fecha), para la lista. */
  venueName: string | null;
}
