import { Module } from '@nestjs/common';
import { MicroservicesClientsModule } from '../clients/microservices-clients.module';
import { AuthProxyModule } from '../auth/auth-proxy.module';
import { GroupInvitationsProxyController } from './group-invitations-proxy.controller';
import { GroupInvitationsProxyService } from './group-invitations-proxy.service';

@Module({
  imports: [MicroservicesClientsModule, AuthProxyModule],
  controllers: [GroupInvitationsProxyController],
  providers: [GroupInvitationsProxyService],
})
export class GroupInvitationsProxyModule {}
