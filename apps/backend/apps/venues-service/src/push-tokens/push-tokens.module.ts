import { Module } from '@nestjs/common';
import { PushTokenRepository } from './repositories/push-token.repository';

@Module({
  providers: [PushTokenRepository],
  exports: [PushTokenRepository],
})
export class PushTokensModule {}
