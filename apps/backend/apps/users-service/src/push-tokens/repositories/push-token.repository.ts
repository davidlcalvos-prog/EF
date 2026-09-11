import { Injectable } from '@nestjs/common';
import { PrismaService } from '@ef/database';

export interface PushTokenRow {
  id: string;
  token: string;
}

@Injectable()
export class PushTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** userId+token es único — un mismo dispositivo nunca duplica fila. */
  async upsert(userId: string, token: string, platform: string): Promise<void> {
    await this.prisma.pushToken.upsert({
      where: { userId_token: { userId, token } },
      update: { platform },
      create: { userId, token, platform },
    });
  }

  /** Tokens de varios usuarios en una sola consulta (envíos en lote, 2026-09-10). */
  async findByUserIds(userIds: string[]): Promise<{ userId: string; token: string }[]> {
    if (userIds.length === 0) return [];
    return this.prisma.pushToken.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, token: true },
    });
  }

  async findByUserId(userId: string): Promise<PushTokenRow[]> {
    return this.prisma.pushToken.findMany({
      where: { userId },
      select: { id: true, token: true },
    });
  }

  async removeByToken(userId: string, token: string): Promise<void> {
    await this.prisma.pushToken.deleteMany({ where: { userId, token } });
  }

  async removeAllForUser(userId: string): Promise<void> {
    await this.prisma.pushToken.deleteMany({ where: { userId } });
  }

  /** Limpieza automática: Expo marcó este token como muerto/inválido. */
  async removeByTokenValue(token: string): Promise<void> {
    await this.prisma.pushToken.deleteMany({ where: { token } });
  }
}
