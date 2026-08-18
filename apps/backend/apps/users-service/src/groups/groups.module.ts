import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { GroupRepository } from './repositories/group.repository';

@Module({
  controllers: [GroupsController],
  providers: [GroupsService, GroupRepository],
})
export class GroupsModule {}
