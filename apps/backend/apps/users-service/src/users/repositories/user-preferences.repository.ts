import { Injectable } from '@nestjs/common';
import { PrismaService } from '@ef/database';
import {
  UpdatePreferencesDto,
  UserPreferences as UserPreferencesContract,
} from '@ef/contracts';
import { Prisma, UserPreferences } from '@prisma/client';

/**
 * Migrado de MongoDB a Prisma/Postgres (Fase D.0) — era la única colección de
 * Mongo y no justificaba una segunda base en producción. Mismo contrato y
 * mismo comportamiento que antes: la primera lectura crea la fila con los
 * defaults, el upsert pisa solo lo que llega.
 */
@Injectable()
export class UserPreferencesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<UserPreferencesContract> {
    const row = await this.prisma.userPreferences.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
    return this.toContract(row);
  }

  async upsert(
    userId: string,
    preferences: UpdatePreferencesDto['preferences'],
  ): Promise<UserPreferencesContract> {
    const data = {
      theme: preferences.theme as string | undefined,
      language: preferences.language as string | undefined,
      notifications: preferences.notifications as boolean | undefined,
      metadata: preferences.metadata as Prisma.InputJsonValue | undefined,
    };
    const row = await this.prisma.userPreferences.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
    return this.toContract(row);
  }

  private toContract(row: UserPreferences): UserPreferencesContract {
    return {
      userId: row.userId,
      theme: row.theme as 'light' | 'dark',
      language: row.language,
      notifications: row.notifications,
      metadata: (row.metadata as Record<string, unknown>) ?? {},
    };
  }
}
