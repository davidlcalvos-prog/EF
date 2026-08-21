import { Module } from '@nestjs/common';
import { MicroservicesClientsModule } from '../clients/microservices-clients.module';
import { AuthProxyModule } from '../auth/auth-proxy.module';
import { GroupFriendshipsProxyController } from './group-friendships-proxy.controller';
import { GroupFriendshipsProxyService } from './group-friendships-proxy.service';

@Module({
  imports: [MicroservicesClientsModule, AuthProxyModule],
  controllers: [GroupFriendshipsProxyController],
  providers: [GroupFriendshipsProxyService],
})
export class GroupFriendshipsProxyModule {}
