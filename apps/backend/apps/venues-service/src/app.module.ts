import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { PrismaModule } from '@ef/database';
import { VenuesModule } from './venues/venues.module';
import { TournamentsModule } from './tournaments/tournaments.module';

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
    VenuesModule,
    TournamentsModule,
  ],
})
export class AppModule {}
