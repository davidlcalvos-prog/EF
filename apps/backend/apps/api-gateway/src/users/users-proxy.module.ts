import { Module } from '@nestjs/common';
import { MicroservicesClientsModule } from '../clients/microservices-clients.module';
import { AuthProxyModule } from '../auth/auth-proxy.module';
import { UsersProxyController } from './users-proxy.controller';
import { UsersProxyService } from './users-proxy.service';

@Module({
  imports: [MicroservicesClientsModule, AuthProxyModule],
  controllers: [UsersProxyController],
  providers: [UsersProxyService],
  exports: [UsersProxyService],
})
export class UsersProxyModule {}
