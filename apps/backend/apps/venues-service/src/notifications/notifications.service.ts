import { Injectable, Logger } from '@nestjs/common';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { PushTokenRepository } from '../push-tokens/repositories/push-token.repository';

/** Copia de users-service/src/notifications/notifications.service.ts — cada microservicio manda sus propios push. Mantener las dos iguales. */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  // EXPO_ACCESS_TOKEN llega por docker-compose.prod.yml; hasta el fix del
  // 2026-09-09 la variable se inyectaba pero `new Expo()` no la leía.
  private readonly expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN || undefined });

  constructor(private readonly pushTokenRepository: PushTokenRepository) {}

  /**
   * Best-effort: si el usuario no tiene tokens validos, no hace nada. Los
   * tokens que Expo marca como DeviceNotRegistered en el ticket se borran
   * (limpieza automatica — evita reintentar para siempre a un token muerto).
   */
  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    const tokens = await this.pushTokenRepository.findByUserId(userId);
    const validTokens = tokens.filter((t) => Expo.isExpoPushToken(t.token));
    if (validTokens.length === 0) {
      // Best-effort a propósito, pero con rastro: sin esto, "no me llegó la
      // solicitud" era indistinguible de un fallo real (QA 2026-09-07).
      this.logger.warn(
        `Push omitido: el usuario ${userId} no tiene tokens Expo registrados (${tokens.length} en DB, 0 válidos) — "${title}"`,
      );
      return;
    }

    const messages: ExpoPushMessage[] = validTokens.map((t) => ({
      to: t.token,
      title,
      body,
      data,
      sound: 'default',
    }));

    const chunks = this.expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        const tickets = await this.expo.sendPushNotificationsAsync(chunk);
        await this.handleTickets(userId, title, chunk, tickets);
      } catch (error) {
        this.logger.error(`Failed to send push notification chunk: ${String(error)}`);
      }
    }
  }

  /**
   * Todo ticket con `status: 'error'` queda en el log (antes solo se miraba
   * DeviceNotRegistered y el resto — InvalidCredentials/MismatchSenderId por
   * FCM sin configurar, MessageRateExceeded, etc. — se descartaba en silencio:
   * "no me llega la notificación" sin ninguna pista en el servidor, testers
   * build 3). DeviceNotRegistered además borra el token.
   */
  private async handleTickets(
    userId: string,
    title: string,
    chunk: ExpoPushMessage[],
    tickets: ExpoPushTicket[],
  ): Promise<void> {
    await Promise.all(
      tickets.map(async (ticket, index) => {
        if (ticket.status !== 'error') return;

        const token = chunk[index]?.to;
        const tokenLabel = typeof token === 'string' ? `…${token.slice(-8)}` : 'token desconocido';
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
