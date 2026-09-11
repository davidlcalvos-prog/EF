import { Injectable } from '@nestjs/common';
import { PrismaService } from '@ef/database';

export interface ResetTokenRow {
  userId: string;
  requestedAt: Date;
  expiresAt: Date;
  usedAt: Date | null;
}

/**
 * Tokens de recuperación (2026-09-11). Guarda SOLO el SHA-256 del token.
 * Un token activo por usuario (userId @unique): `issue` hace upsert y pisa el
 * anterior por construcción. `claim` es el ÚNICO camino para canjear: un
 * UPDATE atómico sobre usedAt IS NULL y no vencido — dos canjes concurrentes
 * del mismo enlace terminan con un solo count === 1.
 */
@Injectable()
export class PasswordResetRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<ResetTokenRow | null> {
    return this.prisma.passwordResetToken.findUnique({
      where: { userId },
      select: { userId: true, requestedAt: true, expiresAt: true, usedAt: true },
    });
  }

  /** Crea o reemplaza el token del usuario (el enlace anterior deja de matchear). */
  async issue(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    const now = new Date();
    await this.prisma.passwordResetToken.upsert({
      where: { userId },
      create: { userId, tokenHash, expiresAt, requestedAt: now, usedAt: null },
      update: { tokenHash, expiresAt, requestedAt: now, usedAt: null },
    });
  }

  /**
   * Marca el token como usado si (y solo si) sigue vigente. Devuelve el
   * userId cuando ESTA llamada lo canjeó; null si no existe, venció o ya se usó
   * — sin distinguir cuál (el cliente recibe el mismo 400).
   */
  async claim(tokenHash: string): Promise<string | null> {
    const now = new Date();
    const { count } = await this.prisma.passwordResetToken.updateMany({
      where: { tokenHash, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (count !== 1) return null;
    const row = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: { userId: true },
    });
    return row?.userId ?? null;
  }
}
