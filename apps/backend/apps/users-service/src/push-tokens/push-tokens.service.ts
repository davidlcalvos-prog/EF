import { Injectable } from '@nestjs/common';
import { RegisterPushTokenPayload, RemovePushTokenPayload } from '@ef/contracts';
import { PushTokenRepository } from './repositories/push-token.repository';

@Injectable()
export class PushTokensService {
  constructor(private readonly pushTokenRepository: PushTokenRepository) {}

  async register(payload: RegisterPushTokenPayload): Promise<{ success: true }> {
    await this.pushTokenRepository.upsert(payload.userId, payload.token, payload.platform);
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
