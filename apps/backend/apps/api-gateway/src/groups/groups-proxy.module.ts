import { Module } from '@nestjs/common';
import { MicroservicesClientsModule } from '../clients/microservices-clients.module';
import { AuthProxyModule } from '../auth/auth-proxy.module';
import { GroupsProxyController } from './groups-proxy.controller';
import { GroupsProxyService } from './groups-proxy.service';

@Module({
  imports: [MicroservicesClientsModule, AuthProxyModule],
  controllers: [GroupsProxyController],
  providers: [GroupsProxyService],
})
export class GroupsProxyModule {}
