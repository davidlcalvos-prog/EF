import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { VenuesController } from './venues.controller';
import { VenuesService } from './venues.service';
import { VenueRepository } from './repositories/venue.repository';

@Module({
  imports: [NotificationsModule],
  controllers: [VenuesController],
  providers: [VenuesService, VenueRepository],
  exports: [VenueRepository],
})
export class VenuesModule {}
