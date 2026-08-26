import { Module } from '@nestjs/common';
import { MicroservicesClientsModule } from '../clients/microservices-clients.module';
import { AuthProxyModule } from '../auth/auth-proxy.module';
import { UserFriendshipsProxyController } from './user-friendships-proxy.controller';
import { UserFriendshipsProxyService } from './user-friendships-proxy.service';

@Module({
  imports: [MicroservicesClientsModule, AuthProxyModule],
  controllers: [UserFriendshipsProxyController],
  providers: [UserFriendshipsProxyService],
})
export class UserFriendshipsProxyModule {}
