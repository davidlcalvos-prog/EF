import { Injectable, Logger } from '@nestjs/common';
import { RegisterPushTokenPayload, RemovePushTokenPayload } from '@ef/contracts';
import { PushTokenRepository } from './repositories/push-token.repository';

@Injectable()
export class PushTokensService {
  private readonly logger = new Logger(PushTokensService.name);

  constructor(private readonly pushTokenRepository: PushTokenRepository) {}

  async register(payload: RegisterPushTokenPayload): Promise<{ success: true }> {
    await this.pushTokenRepository.upsert(payload.userId, payload.token, payload.platform);
    // Rastro del lado del servidor (build 5, habilitación de FCM): con esto
    // `docker compose logs users-service | grep -i push` muestra tanto los
    // registros como los envíos omitidos/rechazados. Solo los últimos 8
    // caracteres del token, alcanza para cruzar con `push_tokens`.
    this.logger.log(
      `Push token registrado: usuario ${payload.userId}, ${payload.platform}, …${payload.token.slice(-8)}`,
    );
    return { success: true };
  }

  async remove(payload: RemovePushTokenPayload): Promise<{ success: true }> {
    if (payload.token) {
      await this.pushTokenRepository.removeByToken(payload.userId, payload.token);
    } else {
      await this.pushTokenRepository.removeAllForUser(payload.userId);
    }
    return { success: true };
  }
}
