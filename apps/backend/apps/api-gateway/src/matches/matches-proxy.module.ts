import { Module } from '@nestjs/common';
import { MicroservicesClientsModule } from '../clients/microservices-clients.module';
import { AuthProxyModule } from '../auth/auth-proxy.module';
import { MatchesProxyController } from './matches-proxy.controller';
import { MatchesProxyService } from './matches-proxy.service';

@Module({
  imports: [MicroservicesClientsModule, AuthProxyModule],
  controllers: [MatchesProxyController],
  providers: [MatchesProxyService],
})
export class MatchesProxyModule {}
