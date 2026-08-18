import { Module } from '@nestjs/common';
import { MicroservicesClientsModule } from '../clients/microservices-clients.module';
import { AuthProxyModule } from '../auth/auth-proxy.module';
import { ReservationsProxyController } from './reservations-proxy.controller';
import { ReservationsProxyService } from './reservations-proxy.service';

@Module({
  imports: [MicroservicesClientsModule, AuthProxyModule],
  controllers: [ReservationsProxyController],
  providers: [ReservationsProxyService],
})
export class ReservationsProxyModule {}
