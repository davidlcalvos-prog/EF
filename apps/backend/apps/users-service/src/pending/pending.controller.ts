import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MESSAGE_PATTERNS } from '@ef/common';
import { GetPendingCountsPayload } from '@ef/contracts';
import { PendingService } from './pending.service';

@Controller()
export class PendingController {
  constructor(private readonly pendingService: PendingService) {}

  @MessagePattern(MESSAGE_PATTERNS.PENDING.COUNTS)
  counts(@Payload() data: GetPendingCountsPayload) {
    return this.pendingService.counts(data);
  }
}
