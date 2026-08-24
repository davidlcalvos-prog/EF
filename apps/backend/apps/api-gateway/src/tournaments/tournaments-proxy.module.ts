import { Module } from '@nestjs/common';
import { MicroservicesClientsModule } from '../clients/microservices-clients.module';
import { AuthProxyModule } from '../auth/auth-proxy.module';
import { CopaEliteForgeProxyController } from './copa-elite-forge-proxy.controller';
import { TournamentsEliteForgeProxyController } from './tournaments-elite-forge-proxy.controller';
import { TournamentsProxyController } from './tournaments-proxy.controller';
import { TournamentsProxyService } from './tournaments-proxy.service';
import { TournamentsPublicProxyController } from './tournaments-public-proxy.controller';

@Module({
  imports: [MicroservicesClientsModule, AuthProxyModule],
  controllers: [
    TournamentsProxyController,
    TournamentsEliteForgeProxyController,
    TournamentsPublicProxyController,
    CopaEliteForgeProxyController,
  ],
  providers: [TournamentsProxyService],
})
export class TournamentsProxyModule {}
