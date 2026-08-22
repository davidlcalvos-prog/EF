import { Module } from '@nestjs/common';
import { MicroservicesClientsModule } from '../clients/microservices-clients.module';
import { AuthProxyModule } from '../auth/auth-proxy.module';
import { PushTokensProxyController } from './push-tokens-proxy.controller';
import { PushTokensProxyService } from './push-tokens-proxy.service';

@Module({
  imports: [MicroservicesClientsModule, AuthProxyModule],
  controllers: [PushTokensProxyController],
  providers: [PushTokensProxyService],
})
export class PushTokensProxyModule {}
