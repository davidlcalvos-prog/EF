import { Module } from '@nestjs/common';
import { MicroservicesClientsModule } from '../clients/microservices-clients.module';
import { AuthProxyModule } from '../auth/auth-proxy.module';
import { TournamentsProxyController } from './tournaments-proxy.controller';
import { TournamentsProxyService } from './tournaments-proxy.service';

@Module({
  imports: [MicroservicesClientsModule, AuthProxyModule],
  controllers: [TournamentsProxyController],
  providers: [TournamentsProxyService],
})
export class TournamentsProxyModule {}
