import { Transform } from 'class-transformer';
import {
  Equals,
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Formato de `termsVersion`: la fecha de publicación del documento (YYYY-MM-DD). */
export const TERMS_VERSION_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function trimString({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function normalizeEmail({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

/**
 * Login: validación estricta de formato.
 * Mensaje de error genérico en AuthService (no revelar si el email existe).
 */
export class LoginDto {
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'email must be a valid email address' })
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(8, { message: 'password must be at least 8 characters' })
  @MaxLength(72, { message: 'password must be at most 72 characters' })
  password!: string;
}

/**
 * Registro público: contraseña con letra + número; nombre saneado.
 * Rol siempre lo asigna el servidor (Jugador) — no se acepta role en el body.
 */
export class RegisterDto {
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'email must be a valid email address' })
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(8, { message: 'password must be at least 8 characters' })
  @MaxLength(72, { message: 'password must be at most 72 characters' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'password must contain at least one letter and one number',
  })
  password!: string;

  @Transform(trimString)
  @IsString()
  @MinLength(2, { message: 'name must be at least 2 characters' })
  @MaxLength(80, { message: 'name must be at most 80 characters' })
  @Matches(/^[\p{L}\p{M}][\p{L}\p{M}\s'.-]*$/u, {
    message: 'name contains invalid characters',
  })
  name!: string;

  /**
   * Aceptación de los Términos y Condiciones (2026-09-11). Obligatoria y
   * validada acá, no solo en el checkbox del navegador: un registro sin
   * `acceptTerms: true` es 400. `termsVersion` es la fecha de publicación del
   * documento que se mostró (apps/web/lib/legal/terms.ts); se guarda para
   * poder demostrar qué texto aceptó cada cuenta.
   */
  @Equals(true, { message: 'terms must be accepted' })
  acceptTerms!: true;

  @IsString()
  @Matches(TERMS_VERSION_REGEX, { message: 'termsVersion must be a YYYY-MM-DD date' })
  termsVersion!: string;
}

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface AuthMeResponse {
  id: string;
  email: string;
  name: string;
  role: string;
}

export class ValidateTokenDto {
  @IsString()
  @MinLength(1)
  token!: string;
}

export interface ValidateTokenResponse {
  valid: boolean;
  userId?: string;
  email?: string;
}

// ── Recuperación y cambio de contraseña (2026-09-11) ──────────────────────

/** Regla compartida por registro, reset y cambio: 8–72 caracteres, letra + número. */
export const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[A-Za-z])(?=.*\d).+$/;

/**
 * Pedir enlace. La respuesta es SIEMPRE 200 `{ ok: true }` con el mismo
 * cuerpo y tiempo, exista o no el correo, esté activa o no la cuenta:
 * no se puede enumerar usuarios por acá.
 */
export class ForgotPasswordDto {
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'email must be a valid email address' })
  @MaxLength(254)
  email!: string;
}

/** Canjear el token del enlace. 400 idéntico si es inválido, vencido o ya usado. */
export class ResetPasswordDto {
  @IsString()
  @MinLength(20)
  @MaxLength(128)
  token!: string;

  @IsString()
  @MinLength(8, { message: 'password must be at least 8 characters' })
  @MaxLength(72, { message: 'password must be at most 72 characters' })
  @Matches(PASSWORD_COMPLEXITY_REGEX, {
    message: 'password must contain at least one letter and one number',
  })
  password!: string;
}

/** Cambiar contraseña estando logueado: la actual es obligatoria. */
export class ChangePasswordDto {
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  currentPassword!: string;

  @IsString()
  @MinLength(8, { message: 'password must be at least 8 characters' })
  @MaxLength(72, { message: 'password must be at most 72 characters' })
  @Matches(PASSWORD_COMPLEXITY_REGEX, {
    message: 'password must contain at least one letter and one number',
  })
  newPassword!: string;
}

export class ChangePasswordPayload extends ChangePasswordDto {
  @IsString()
  @MinLength(1)
  userId!: string;
}

export interface PasswordActionResponse {
  ok: true;
}

/** Estado de sesión que el gateway consulta por request (JWT stateless): activo y último cambio de clave. */
export interface SessionStateResponse {
  estado: boolean;
  /** Epoch ms del último cambio de contraseña; null si nunca cambió. */
  passwordChangedAt: number | null;
}
