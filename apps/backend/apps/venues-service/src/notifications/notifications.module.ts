import { Module } from '@nestjs/common';
import { PushTokensModule } from '../push-tokens/push-tokens.module';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [PushTokensModule],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
