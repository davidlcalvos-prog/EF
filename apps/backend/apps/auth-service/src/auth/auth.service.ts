import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { SYSTEM_ROLE_NAMES } from '@ef/common';
import {
  AuthMeResponse,
  AuthResponse,
  AuthTokenPayload,
  CreateVenueOwnerDto,
  LoginDto,
  RegisterDto,
  ValidateTokenResponse,
  VenueOwnerDto,
} from '@ef/contracts';
import { AuthUserRecord, UserRepository } from './repositories/user.repository';

/** Coste bcrypt (OWASP recomienda ≥10; 12 equilibra seguridad y latencia). */
const BCRYPT_ROUNDS = 12;

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
    dto: { email: string; name: string; password: string },
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
