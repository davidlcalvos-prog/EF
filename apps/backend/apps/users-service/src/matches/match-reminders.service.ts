import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificationsService } from '../notifications/notifications.service';
import { MatchReminderRepository } from './repositories/match-reminder.repository';
import { MatchRepository, ReminderCandidate } from './repositories/match.repository';

export interface ReminderThreshold {
  /** Clave en `match_reminders.kind`. */
  kind: '3h' | '12h';
  minutes: number;
}

/**
 * ASCENDENTE a propósito: se evalúa primero el umbral más cercano al kickoff.
 * Si el cron estuvo caído y se cruzaron varios, se manda SOLO el más cercano
 * pendiente (un aviso, no dos seguidos); si el más cercano ya salió, los más
 * lejanos que faltaron se omiten porque ya son viejos.
 */
export const REMINDER_THRESHOLDS: readonly ReminderThreshold[] = [
  { kind: '3h', minutes: 180 },
  { kind: '12h', minutes: 720 },
] as const;

/** Ventana de búsqueda del cron = el umbral más lejano. */
export const REMINDER_WINDOW_MS = 12 * 60 * 60 * 1000;

/** Zona fija: los partidos y los usuarios son de Colombia (sin horario de verano). */
export const REMINDER_TIME_ZONE = 'America/Bogota';

const kickoffFormatter = new Intl.DateTimeFormat('es-CO', {
  timeZone: REMINDER_TIME_ZONE,
  weekday: 'long',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/** "jueves a las 19:00" — hora local de Colombia, explícita; nunca la del contenedor (UTC). */
export function formatKickoff(scheduledAt: Date): string {
  const parts = kickoffFormatter.formatToParts(scheduledAt);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('weekday')} a las ${get('hour')}:${get('minute')}`;
}

/** "en 3 horas" / "en 45 minutos" a partir del tiempo REAL que falta, no del umbral. */
export function formatRelative(minutesUntil: number): string {
  const rounded = Math.max(1, Math.round(minutesUntil));
  if (rounded < 60) return `en ${rounded} minuto${rounded === 1 ? '' : 's'}`;
  const hours = Math.round(rounded / 60);
  return `en ${hours} hora${hours === 1 ? '' : 's'}`;
}

/**
 * Recordatorios 12 h y 3 h antes del kickoff (2026-09-10). Mismo mecanismo
 * que la alerta de cupo VS (`VsMatchAlertsService`): cron cada 5 min, consulta
 * acotada, umbrales ascendentes, y **marca atómica ANTES de enviar** — acá la
 * marca es el INSERT con UNIQUE (matchId, kind) de `match_reminders`, que
 * arbitra también entre varias instancias. Destinatarios: los participantes
 * (creador, quienes se unieron y comodines aceptados), no todo el grupo ni
 * solo los líderes. Solo partidos `scheduled` con hora; cancelados y jugados
 * quedan fuera por la consulta.
 */
@Injectable()
export class MatchRemindersService {
  private readonly logger = new Logger(MatchRemindersService.name);

  constructor(
    private readonly matchRepository: MatchRepository,
    private readonly reminderRepository: MatchReminderRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron('*/5 * * * *')
  async run(): Promise<void> {
    const candidates = await this.matchRepository.findMatchesNeedingReminder(REMINDER_WINDOW_MS);
    for (const match of candidates) {
      try {
        await this.evaluate(match);
      } catch (error) {
        this.logger.error(`Reminder evaluation failed for match ${match.id}: ${String(error)}`);
      }
    }
  }

  /** Expuesto para tests; `now` inyectable. Devuelve el umbral enviado o null. */
  async evaluate(match: ReminderCandidate, now: number = Date.now()): Promise<string | null> {
    const minutesUntil = (match.scheduledAt.getTime() - now) / 60_000;
    if (minutesUntil <= 0) return null;

    for (const threshold of REMINDER_THRESHOLDS) {
      if (minutesUntil > threshold.minutes) continue; // todavía no se cruzó
      // El más cercano cruzado ya salió → no mandar los más lejanos que faltaron.
      if (match.claimedKinds.includes(threshold.kind)) return null;

      const claimId = await this.reminderRepository.claim(match.id, threshold.kind, match.scheduledAt);
      if (!claimId) {
        this.logger.debug(
          `Reminder ${threshold.kind} for match ${match.id} already claimed by another run — skipping`,
        );
        return null;
      }

      const recipients = await this.matchRepository.findParticipantUserIds(match.id);
      await this.notificationsService.sendToUsers(
        recipients,
        'Recordatorio de partido',
        `Tu partido con ${match.originGroupName} es ${formatKickoff(match.scheduledAt)} — ${formatRelative(minutesUntil)}.`,
        {
          v: 1,
          type: 'match_reminder',
          screen: 'MatchDetail',
          params: { matchId: match.id, reminder: threshold.kind },
        },
      );
      await this.reminderRepository.markSent(claimId, recipients.length);
      this.logger.log(
        `Reminder ${threshold.kind} sent for match ${match.id} to ${recipients.length} participant(s)`,
      );
      return threshold.kind; // un recordatorio por corrida y por partido
    }
    return null;
  }
}
