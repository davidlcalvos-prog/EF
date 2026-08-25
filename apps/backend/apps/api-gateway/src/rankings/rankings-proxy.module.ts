import { Module } from '@nestjs/common';
import { MicroservicesClientsModule } from '../clients/microservices-clients.module';
import { AuthProxyModule } from '../auth/auth-proxy.module';
import { RankingsProxyController } from './rankings-proxy.controller';
import { RankingsProxyService } from './rankings-proxy.service';

@Module({
  imports: [MicroservicesClientsModule, AuthProxyModule],
  controllers: [RankingsProxyController],
  providers: [RankingsProxyService],
})
export class RankingsProxyModule {}
