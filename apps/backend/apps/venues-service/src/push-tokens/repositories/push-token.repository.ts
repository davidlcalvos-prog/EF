import { Injectable } from '@nestjs/common';
import { PrismaService } from '@ef/database';

export interface PushTokenRow {
  id: string;
  token: string;
}

/**
 * Solo lectura + limpieza — el registro de tokens vive en users-service
 * (push-tokens.controller.ts). venues-service comparte la misma base Postgres
 * y solo necesita leerlos para mandar push (dueño confirma/rechaza, jugador
 * recibe), mismo criterio que VenueRepository.findMatchGroups leyendo `Match`
 * directo en vez de cruzar el límite del microservicio.
 */
@Injectable()
export class PushTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<PushTokenRow[]> {
    return this.prisma.pushToken.findMany({
      where: { userId },
      select: { id: true, token: true },
    });
  }

  /** Limpieza automática: Expo marcó este token como muerto/inválido. */
  async removeByTokenValue(token: string): Promise<void> {
    await this.prisma.pushToken.deleteMany({ where: { token } });
  }
}
