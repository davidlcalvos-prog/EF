import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { join } from 'path';
import { MicroservicesClientsModule } from './clients/microservices-clients.module';
import { AuthProxyModule } from './auth/auth-proxy.module';
import { UsersProxyModule } from './users/users-proxy.module';
import { VenuesProxyModule } from './venues/venues-proxy.module';
import { ProfileStatsProxyModule } from './profile-stats/profile-stats-proxy.module';
import { GroupsProxyModule } from './groups/groups-proxy.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(process.cwd(), '.env'),
        join(process.cwd(), 'apps/backend/.env'),
      ],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 120,
      },
    ]),
    MicroservicesClientsModule,
    AuthProxyModule,
    UsersProxyModule,
    VenuesProxyModule,
    ProfileStatsProxyModule,
    GroupsProxyModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
