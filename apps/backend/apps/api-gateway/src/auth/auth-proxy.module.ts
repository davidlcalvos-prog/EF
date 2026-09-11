import { Module } from '@nestjs/common';
import { MicroservicesClientsModule } from '../clients/microservices-clients.module';
import { GatewayAuthModule } from './gateway-auth.module';
import { AdminUsersProxyController } from './admin-users-proxy.controller';
import { AdminVenueOwnersProxyController } from './admin-venue-owners-proxy.controller';
import { AuthProxyController } from './auth-proxy.controller';
import { AuthProxyService } from './auth-proxy.service';

@Module({
  imports: [MicroservicesClientsModule, GatewayAuthModule],
  controllers: [AuthProxyController, AdminVenueOwnersProxyController, AdminUsersProxyController],
  providers: [AuthProxyService],
  exports: [GatewayAuthModule],
})
export class AuthProxyModule {}
