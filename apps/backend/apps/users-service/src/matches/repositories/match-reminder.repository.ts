import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@ef/database';

/**
 * Marca atómica de "este recordatorio ya salió" (2026-09-10). La garantía de
 * UNA sola vez es el UNIQUE (matchId, kind) de `match_reminders`: `claim` es
 * un INSERT y, si otra corrida del cron u otra instancia del servicio ya
 * insertó, Postgres devuelve P2002 y esta corrida NO envía. Funciona con
 * varias instancias sin locks ni coordinación: la base arbitra.
 */
@Injectable()
export class MatchReminderRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** id de la fila si ESTA corrida reclamó el envío; null si ya estaba reclamado. */
  async claim(matchId: string, kind: string, scheduledAt: Date): Promise<string | null> {
    try {
      const row = await this.prisma.matchReminder.create({
        data: { matchId, kind, scheduledAtSnapshot: scheduledAt },
        select: { id: true },
      });
      return row.id;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return null;
      }
      throw error;
    }
  }

  /** Auditoría: cuándo salió y a cuántos participantes. */
  async markSent(id: string, recipients: number): Promise<void> {
    await this.prisma.matchReminder.update({
      where: { id },
      data: { sentAt: new Date(), recipients },
    });
  }
}
