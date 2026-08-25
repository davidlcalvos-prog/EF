import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';
import { MongoDatabaseModule, PrismaModule } from '@ef/database';
import { GroupFriendshipsModule } from './group-friendships/group-friendships.module';
import { GroupsModule } from './groups/groups.module';
import { MatchesModule } from './matches/matches.module';
import { FeedModule } from './feed/feed.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ProfileStatsModule } from './profile-stats/profile-stats.module';
import { PushTokensModule } from './push-tokens/push-tokens.module';
import { RankingsModule } from './rankings/rankings.module';
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
    ScheduleModule.forRoot(),
    PrismaModule,
    MongoDatabaseModule.forRoot(),
    UsersModule,
    ProfileStatsModule,
    GroupsModule,
    GroupFriendshipsModule,
    MatchesModule,
    FeedModule,
    PushTokensModule,
    RankingsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
