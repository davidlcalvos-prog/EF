import { Module } from '@nestjs/common';
import { PushTokensController } from './push-tokens.controller';
import { PushTokensService } from './push-tokens.service';
import { PushTokenRepository } from './repositories/push-token.repository';

@Module({
  controllers: [PushTokensController],
  providers: [PushTokensService, PushTokenRepository],
  exports: [PushTokenRepository],
})
export class PushTokensModule {}
