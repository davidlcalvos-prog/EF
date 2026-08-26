import { Module } from '@nestjs/common';
import { MicroservicesClientsModule } from '../clients/microservices-clients.module';
import { AuthProxyModule } from '../auth/auth-proxy.module';
import { MatchGuestRequestsProxyController } from './match-guest-requests-proxy.controller';
import { MatchGuestRequestsProxyService } from './match-guest-requests-proxy.service';

@Module({
  imports: [MicroservicesClientsModule, AuthProxyModule],
  controllers: [MatchGuestRequestsProxyController],
  providers: [MatchGuestRequestsProxyService],
})
export class MatchGuestRequestsProxyModule {}
