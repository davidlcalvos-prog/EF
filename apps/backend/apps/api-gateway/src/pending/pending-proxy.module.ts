import { Module } from '@nestjs/common';
import { MicroservicesClientsModule } from '../clients/microservices-clients.module';
import { AuthProxyModule } from '../auth/auth-proxy.module';
import { PendingProxyController } from './pending-proxy.controller';
import { PendingProxyService } from './pending-proxy.service';

@Module({
  imports: [MicroservicesClientsModule, AuthProxyModule],
  controllers: [PendingProxyController],
  providers: [PendingProxyService],
})
export class PendingProxyModule {}
