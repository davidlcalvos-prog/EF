import { Module } from '@nestjs/common';
import { MicroservicesClientsModule } from '../clients/microservices-clients.module';
import { AuthProxyModule } from '../auth/auth-proxy.module';
import { UsersProxyModule } from '../users/users-proxy.module';
import { ProfileStatsProxyController } from './profile-stats-proxy.controller';
import { ProfileStatsProxyService } from './profile-stats-proxy.service';

@Module({
  imports: [MicroservicesClientsModule, AuthProxyModule, UsersProxyModule],
  controllers: [ProfileStatsProxyController],
  providers: [ProfileStatsProxyService],
})
export class ProfileStatsProxyModule {}
