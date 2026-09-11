import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { SYSTEM_ROLE_NAMES } from '@ef/common';
import {
  AdminUpdateUserEmailPayload,
  AdminUserEmailDto,
  AuthMeResponse,
  AuthResponse,
  AuthTokenPayload,
  ChangePasswordPayload,
  CreateVenueOwnerDto,
  ForgotPasswordDto,
  LoginDto,
  PasswordActionResponse,
  RegisterDto,
  ResetPasswordDto,
  SessionStateResponse,
  ValidateTokenResponse,
  VenueOwnerDto,
} from '@ef/contracts';
import { MailService, maskEmail } from '../mail/mail.service';
import { PasswordResetRepository } from './repositories/password-reset.repository';
import { AuthUserRecord, UserRepository } from './repositories/user.repository';

/** Coste bcrypt (OWASP recomienda ≥10; 12 equilibra seguridad y latencia). */
const BCRYPT_ROUNDS = 12;

/** Recuperación de contraseña (2026-09-11). */
export const RESET_TOKEN_TTL_MINUTES = 30;
/** Rate limit por email: un correo por minuto, aunque el gateway deje pasar más. */
export const RESET_REQUEST_COOLDOWN_MS = 60_000;

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

/**
 * Hash bcrypt válido solo para igualar el tiempo de respuesta cuando el email
 * no existe (mitiga user enumeration por timing).
 */
const DUMMY_PASSWORD_HASH =
  '$2b$12$k1.hn/TdgBAYIFkDb3F2i.pQa2SpaP9eYOYbVt2SRPX0ax4UtcDmK';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly passwordResetRepository: PasswordResetRepository,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const user = await this.createUserWithRole(dto, undefined);
    return this.buildAuthResponse(user);
  }

  /**
   * Fase W.3: alta de un Empresario por un Administrador (el registro público
   * rechaza ese rol). Mismo camino interno que register() — normalización,
   * bcrypt cost 12, User + Profile con alias único — vía createUserWithRole.
   * No devuelve token: el dueño se loguea él mismo con la contraseña temporal.
   */
  async createVenueOwner(dto: CreateVenueOwnerDto): Promise<VenueOwnerDto> {
    const user = await this.createUserWithRole(dto, SYSTEM_ROLE_NAMES.EMPRESARIO);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      estado: user.estado,
      createdAt: new Date().toISOString(),
      venueName: null,
    };
  }

  listVenueOwners(): Promise<VenueOwnerDto[]> {
    return this.userRepository.listVenueOwners(SYSTEM_ROLE_NAMES.EMPRESARIO);
  }

  /** Activa/desactiva un Empresario. Solo Empresarios: nunca toca a un Administrador. */
  async setVenueOwnerStatus(userId: string, estado: boolean): Promise<VenueOwnerDto> {
    const target = await this.userRepository.findVenueOwnerById(userId);
    if (!target || target.roleName !== SYSTEM_ROLE_NAMES.EMPRESARIO) {
      throw new NotFoundException('Venue owner not found');
    }
    return this.userRepository.setEstado(userId, estado);
  }

  /**
   * Camino único de creación de usuario (register público + alta interna de
   * Empresario): normaliza email, hashea con BCRYPT_ROUNDS y crea User +
   * Profile con alias único. `roleName` undefined = flujo público (el
   * repositorio resuelve Jugador y rechaza roles administrativos).
   */
  private async createUserWithRole(
    dto: { email: string; name: string; password: string; termsVersion?: string },
    roleName: string | undefined,
  ): Promise<AuthUserRecord> {
    const email = dto.email.trim().toLowerCase();
    const name = dto.name.trim();

    try {
      const existing = await this.userRepository.findByEmail(email);
      if (existing) {
        throw new ConflictException('Email already registered');
      }

      const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
      return await this.userRepository.create({
        email,
        passwordHash,
        name,
        roleNameOverride: roleName,
        termsVersion: dto.termsVersion,
      });
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email already registered');
      }

      this.logger.error(
        `createUserWithRole failed for ${email}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const email = dto.email.trim().toLowerCase();

    try {
      const user = await this.userRepository.findByEmail(email);

      // Siempre comparar hash para no filtrar existencia por tiempo de respuesta.
      const hash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
      const passwordOk = await bcrypt.compare(dto.password, hash);

      if (!user || !user.estado || !passwordOk) {
        throw new UnauthorizedException('Invalid credentials');
      }

      return await this.buildAuthResponse(user);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(
        `login failed for ${email}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  // ── Recuperación y cambio de contraseña (2026-09-11) ─────────────────

  /**
   * "Olvidé mi contraseña". SIN ENUMERACIÓN: responde siempre { ok: true }
   * con el mismo cuerpo y el mismo trabajo, exista o no el correo, esté
   * activa o no la cuenta. Los tres caminos hacen un bcrypt.compare (el costo
   * dominante) y el envío del correo va fuera del await (fire-and-forget con
   * log), así que ni el status, ni el cuerpo, ni la latencia distinguen los
   * casos. Un fallo del SMTP tampoco llega al cliente: MailService lo loguea.
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<PasswordActionResponse> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.userRepository.findByEmail(email);

    // Mismo costo en todos los caminos (mitiga enumeración por timing).
    await bcrypt.compare('constant-time-padding', DUMMY_PASSWORD_HASH);

    if (!user || !user.estado) {
      this.logger.log(`Recuperación pedida para un correo sin cuenta activa (${maskEmail(email)}): sin envío`);
      return { ok: true };
    }

    // Rate limit por email: si pidió hace menos de un minuto, el token vigente
    // sigue siendo válido y NO se manda otro correo.
    const existing = await this.passwordResetRepository.findByUserId(user.id);
    if (
      existing &&
      !existing.usedAt &&
      Date.now() - existing.requestedAt.getTime() < RESET_REQUEST_COOLDOWN_MS
    ) {
      this.logger.warn(`Recuperación repetida en < 60 s para ${maskEmail(email)}: sin nuevo envío`);
      return { ok: true };
    }

    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60_000);
    // Pisa el token anterior por construcción (userId @unique + upsert).
    await this.passwordResetRepository.issue(user.id, sha256(token), expiresAt);

    const resetUrl = `${this.webBaseUrl()}/auth/reset-password?token=${token}`;
    void this.mailService
      .sendPasswordReset(user.email, resetUrl, RESET_TOKEN_TTL_MINUTES)
      .catch((error) => this.logger.error(`sendPasswordReset lanzó: ${String(error)}`));

    return { ok: true };
  }

  /**
   * Canje del enlace. `claim` es un UPDATE atómico sobre usedAt IS NULL y no
   * vencido: reutilizado, vencido o inventado dan el MISMO 400. Al cambiar la
   * clave se marca passwordChangedAt: los JWT anteriores dejan de valer.
   */
  async resetPassword(dto: ResetPasswordDto): Promise<PasswordActionResponse> {
    const userId = await this.passwordResetRepository.claim(sha256(dto.token));
    if (!userId) {
      throw new BadRequestException('invalid_or_expired');
    }
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    await this.userRepository.updatePassword(userId, passwordHash);
    this.logger.log(`Contraseña restablecida por enlace para el usuario ${userId}`);
    return { ok: true };
  }

  /** Cambio estando logueado: la contraseña actual es obligatoria (una sesión robada no puede cambiarla sola). */
  async changePassword(payload: ChangePasswordPayload): Promise<PasswordActionResponse> {
    const user = await this.userRepository.findById(payload.userId);
    const hash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
    const currentOk = await bcrypt.compare(payload.currentPassword, hash);
    if (!user || !user.estado || !currentOk) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const passwordHash = await bcrypt.hash(payload.newPassword, BCRYPT_ROUNDS);
    await this.userRepository.updatePassword(user.id, passwordHash);
    this.logger.log(`Contraseña cambiada por el usuario ${user.id}`);
    return { ok: true };
  }

  /** Para el guard del gateway: activo + último cambio de clave (rechaza JWT con iat anterior). */
  async getSessionState(userId: string): Promise<SessionStateResponse> {
    const state = await this.userRepository.findSessionState(userId);
    if (!state) return { estado: false, passwordChangedAt: null };
    return {
      estado: state.estado,
      passwordChangedAt: state.passwordChangedAt ? state.passwordChangedAt.getTime() : null,
    };
  }

  // ── Administrador: corregir el correo de un usuario (2026-09-11) ─────

  /**
   * Antes se hacía por SSH + SQL. Valida existencia (404) y unicidad (409):
   * el `findByEmail` previo da el mensaje claro y el unique de `users.email`
   * cubre la carrera (P2002 → 409). El correo llega ya normalizado por el DTO.
   */
  async updateUserEmail(payload: AdminUpdateUserEmailPayload): Promise<AdminUserEmailDto> {
    const email = payload.email.trim().toLowerCase();
    const user = await this.userRepository.findById(payload.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.email !== email) {
      const taken = await this.userRepository.findByEmail(email);
      if (taken) {
        throw new ConflictException('Email already registered');
      }
    }
    try {
      const updated = await this.userRepository.updateEmail(user.id, email);
      this.logger.log(
        `Correo corregido por Administrador: usuario ${user.id} ${maskEmail(user.email)} → ${maskEmail(email)}`,
      );
      return { id: updated.id, email: updated.email, name: updated.name, role: updated.role };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Email already registered');
      }
      throw error;
    }
  }

  /** Administrador: id de un usuario por su correo actual (para corregirlo sin SQL). 404 si no existe. */
  async findUserByEmailForAdmin(email: string): Promise<AdminUserEmailDto> {
    const user = await this.userRepository.findByEmail(email.trim().toLowerCase());
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }

  private webBaseUrl(): string {
    return (this.configService.get<string>('WEB_BASE_URL') ?? 'https://eliteforge.tech').replace(
      /\/$/,
      '',
    );
  }

  async getMe(userId: string): Promise<AuthMeResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user || !user.estado) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  async validateToken(token: string): Promise<ValidateTokenResponse> {
    try {
      const payload = await this.jwtService.verifyAsync<AuthTokenPayload>(token);
      const user = await this.userRepository.findById(payload.sub);

      // Firma JWT válida no basta: alinear con usuario real y estado en BD.
      if (!user || !user.estado) {
        return { valid: false };
      }

      return {
        valid: true,
        userId: user.id,
        email: user.email,
      };
    } catch {
      return { valid: false };
    }
  }


  private async buildAuthResponse(user: {
    id: string;
    email: string;
    name: string;
    role: string;
  }): Promise<AuthResponse> {
    try {
      const payload: AuthTokenPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };
      const accessToken = await this.jwtService.signAsync(payload);

      return {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    } catch (error) {
      this.logger.error(
        `JWT sign failed for user ${user.id}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
