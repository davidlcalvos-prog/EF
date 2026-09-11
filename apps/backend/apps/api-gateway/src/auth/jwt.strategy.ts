import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { firstValueFrom, timeout } from 'rxjs';
import { MESSAGE_PATTERNS, SERVICE_NAMES } from '@ef/common';
import { AuthTokenPayload, SessionStateResponse } from '@ef/contracts';

/** Caché corta del estado de sesión: amortigua ráfagas (el feed dispara varios requests juntos). */
const SESSION_STATE_TTL_MS = 10_000;

interface CachedState {
  value: SessionStateResponse;
  expiresAt: number;
}

/**
 * El JWT es stateless y dura 7 días: sin esto, una sesión robada sobrevivía a
 * un reset de contraseña y un usuario desactivado seguía entrando hasta que
 * venciera el token. Desde el 2026-09-11 cada request autenticado consulta a
 * auth-service (con caché de 10 s) el estado de la cuenta y el último cambio
 * de clave, y rechaza tokens emitidos antes de ese cambio (`iat` anterior a
 * `passwordChangedAt`). Si auth-service no responde, se deja pasar el token
 * con firma válida (degradación controlada, con log) — no se tumba la API por
 * el chequeo extra.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
  private readonly cache = new Map<string, CachedState>();

  constructor(
    config: ConfigService,
    @Inject(SERVICE_NAMES.AUTH) private readonly authClient: ClientProxy,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        config.get<string>('JWT_SECRET') ?? 'ef-dev-secret-change-in-production',
    });
  }

  async validate(payload: AuthTokenPayload & { iat?: number }): Promise<AuthTokenPayload> {
    const state = await this.sessionState(payload.sub);
    if (state) {
      if (!state.estado) {
        throw new UnauthorizedException('Account disabled');
      }
      // `iat` tiene precisión de SEGUNDOS y `passwordChangedAt` de milisegundos.
      // Se compara truncando el cambio al segundo: el token que auth-service
      // firma justo después de cambiar la clave (mismo segundo, build 7) es
      // válido; uno emitido cualquier segundo anterior sigue rechazado.
      if (
        state.passwordChangedAt !== null &&
        typeof payload.iat === 'number' &&
        payload.iat < Math.floor(state.passwordChangedAt / 1000)
      ) {
        throw new UnauthorizedException('Session expired: password changed');
      }
    }
    return payload;
  }

  /** Invalida la caché de un usuario (la usa el propio gateway tras un cambio de clave). */
  forget(userId: string): void {
    this.cache.delete(userId);
  }

  private async sessionState(userId: string): Promise<SessionStateResponse | null> {
    const cached = this.cache.get(userId);
    if (cached && cached.expiresAt > Date.now()) return cached.value;
    try {
      const value = await firstValueFrom(
        this.authClient
          .send<SessionStateResponse>(MESSAGE_PATTERNS.AUTH.SESSION_STATE, { userId })
          .pipe(timeout(1_500)),
      );
      this.cache.set(userId, { value, expiresAt: Date.now() + SESSION_STATE_TTL_MS });
      return value;
    } catch (error) {
      this.logger.warn(`No se pudo consultar el estado de sesión de ${userId}: ${String(error)}`);
      return null;
    }
  }
}
