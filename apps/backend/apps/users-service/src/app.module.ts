import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { MongoDatabaseModule, PrismaModule } from '@ef/database';
import { ProfileStatsModule } from './profile-stats/profile-stats.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(process.cwd(), '.env'),
        join(process.cwd(), 'apps/backend/.env'),
      ],
    }),
    PrismaModule,
    MongoDatabaseModule.forRoot(),
    UsersModule,
    ProfileStatsModule,
  ],
})
export class AppModule {}
