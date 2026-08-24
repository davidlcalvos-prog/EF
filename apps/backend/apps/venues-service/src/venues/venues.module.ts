import { Module } from '@nestjs/common';
import { VenuesController } from './venues.controller';
import { VenuesService } from './venues.service';
import { VenueRepository } from './repositories/venue.repository';

@Module({
  controllers: [VenuesController],
  providers: [VenuesService, VenueRepository],
  exports: [VenueRepository],
})
export class VenuesModule {}
