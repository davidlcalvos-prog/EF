import { Injectable, Logger } from '@nestjs/common';
import { PushData } from '@ef/contracts';
import { PrismaService } from '@ef/database';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { PushTokenRepository } from '../push-tokens/repositories/push-token.repository';

/**
 * Compatibilidad con la app ANTERIOR a la Fase A (builds ≤ 5): sus listeners
 * leían `matchId` / `reservationId` al nivel raíz de `data`. Se espejan desde
 * `params` para que esos builds sigan abriendo el partido / la reserva.
 * Borrar cuando no queden builds viejos en la pista de pruebas.
 */
function withLegacyMirror(data: PushData): Record<string, unknown> {
  const mirror: Record<string, unknown> = {};
  // Solo cuando el destino declarado ES ese detalle: si no, el build viejo
  // abriría un partido al que el usuario no tiene acceso (postulante rechazado).
  if (data.screen === 'MatchDetail' && data.params?.matchId) mirror.matchId = data.params.matchId;
  if (data.screen === 'ReservationDetail' && data.params?.reservationId) {
    mirror.reservationId = data.params.reservationId;
  }
  return { ...mirror, ...data };
}

/**
 * Copia IDÉNTICA de users-service/src/notifications/notifications.service.ts —
 * cada microservicio manda sus propios push. Mantener las dos iguales.
 *
 * ÚNICO camino de salida de un push. Todo aviso — actual o futuro — pasa por
 * `sendToUsers`, y ahí se aplica el filtro de `user_preferences.notifications`
 * (2026-09-10): un usuario que desactivó las notificaciones en Ajustes NO
 * recibe nada, de ningún tipo, sin que cada disparo tenga que acordarse. La
 * política de privacidad publicada promete exactamente eso.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  // EXPO_ACCESS_TOKEN llega por docker-compose.prod.yml; hasta el fix del
  // 2026-09-09 la variable se inyectaba pero `new Expo()` no la leía.
  private readonly expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN || undefined });

  constructor(
    private readonly pushTokenRepository: PushTokenRepository,
    private readonly prisma: PrismaService,
  ) {}

  /** Un destinatario. Delega en `sendToUsers`: mismo filtro, mismo log. */
  sendToUser(userId: string, title: string, body: string, data: PushData): Promise<void> {
    return this.sendToUsers([userId], title, body, data);
  }

  /**
   * Varios destinatarios en UNA consulta de preferencias + UNA de tokens y
   * lotes de hasta 100 mensajes hacia Expo (chunkPushNotifications). Es
   * best-effort: sin tokens válidos no hace nada; los tokens que Expo marca
   * DeviceNotRegistered se borran; el resto de tickets de error queda en el
   * log (build 4).
   */
  async sendToUsers(
    userIds: string[],
    title: string,
    body: string,
    data: PushData,
  ): Promise<void> {
    const unique = [...new Set(userIds)];
    if (unique.length === 0) return;

    // ── Filtro de preferencias: acá y solo acá. ──────────────────────────
    const muted = await this.findMutedUserIds(unique);
    const recipients = unique.filter((id) => !muted.has(id));
    if (muted.size > 0) {
      this.logger.log(
        `Push omitido por preferencia (notifications=false) para ${muted.size} usuario(s) — "${title}"`,
      );
    }
    if (recipients.length === 0) return;

    const rows = await this.pushTokenRepository.findByUserIds(recipients);
    const userIdByToken = new Map<string, string>();
    for (const row of rows) {
      if (Expo.isExpoPushToken(row.token)) userIdByToken.set(row.token, row.userId);
    }
    const withToken = new Set(userIdByToken.values());
    for (const userId of recipients) {
      if (!withToken.has(userId)) {
        // Best-effort a propósito, pero con rastro: sin esto, "no me llegó la
        // solicitud" era indistinguible de un fallo real (QA 2026-09-07).
        this.logger.warn(
          `Push omitido: el usuario ${userId} no tiene tokens Expo registrados — "${title}"`,
        );
      }
    }
    if (userIdByToken.size === 0) return;

    const wireData = withLegacyMirror(data);
    const messages: ExpoPushMessage[] = [...userIdByToken.keys()].map((token) => ({
      to: token,
      title,
      body,
      data: wireData,
      sound: 'default',
    }));

    const chunks = this.expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        const tickets = await this.expo.sendPushNotificationsAsync(chunk);
        await this.handleTickets(title, chunk, tickets, userIdByToken);
      } catch (error) {
        this.logger.error(`Failed to send push notification chunk: ${String(error)}`);
      }
    }
  }

  /** userIds con `user_preferences.notifications = false`. Sin fila de preferencias = no silenciado. */
  private async findMutedUserIds(userIds: string[]): Promise<Set<string>> {
    const rows = await this.prisma.userPreferences.findMany({
      where: { userId: { in: userIds }, notifications: false },
      select: { userId: true },
    });
    return new Set(rows.map((row) => row.userId));
  }

  /**
   * Todo ticket con `status: 'error'` queda en el log (antes solo se miraba
   * DeviceNotRegistered y el resto — InvalidCredentials/MismatchSenderId por
   * FCM sin configurar, MessageRateExceeded, etc. — se descartaba en silencio:
   * "no me llega la notificación" sin ninguna pista en el servidor, testers
   * build 3). DeviceNotRegistered además borra el token.
   */
  private async handleTickets(
    title: string,
    chunk: ExpoPushMessage[],
    tickets: ExpoPushTicket[],
    userIdByToken: Map<string, string>,
  ): Promise<void> {
    await Promise.all(
      tickets.map(async (ticket, index) => {
        if (ticket.status !== 'error') return;

        const token = chunk[index]?.to;
        const tokenLabel = typeof token === 'string' ? `…${token.slice(-8)}` : 'token desconocido';
        const userId = typeof token === 'string' ? (userIdByToken.get(token) ?? '?') : '?';
        const code = ticket.details?.error ?? 'sin código';
        this.logger.warn(
          `Push rechazado por Expo para el usuario ${userId} (${tokenLabel}): ${code} — ${ticket.message} — "${title}"`,
        );

        if (code === 'DeviceNotRegistered' && typeof token === 'string') {
          await this.pushTokenRepository.removeByTokenValue(token);
        }
      }),
    );
  }
}
