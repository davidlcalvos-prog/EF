import { Injectable, Logger } from '@nestjs/common';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { PushTokenRepository } from '../push-tokens/repositories/push-token.repository';

/** Copia de users-service/src/notifications/notifications.service.ts — cada microservicio manda sus propios push. */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly expo = new Expo();

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
    if (validTokens.length === 0) return;

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
        await this.cleanupInvalidTokens(chunk, tickets);
      } catch (error) {
        this.logger.error(`Failed to send push notification chunk: ${String(error)}`);
      }
    }
  }

  private async cleanupInvalidTokens(
    chunk: ExpoPushMessage[],
    tickets: ExpoPushTicket[],
  ): Promise<void> {
    await Promise.all(
      tickets.map(async (ticket, index) => {
        if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
          const token = chunk[index]?.to;
          if (typeof token === 'string') {
            await this.pushTokenRepository.removeByTokenValue(token);
          }
        }
      }),
    );
  }
}
