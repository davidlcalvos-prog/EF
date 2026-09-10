import { Injectable } from '@nestjs/common';
import { GetPendingCountsPayload, PendingCountsDto } from '@ef/contracts';
import { PendingRepository } from './repositories/pending.repository';

@Injectable()
export class PendingService {
  constructor(private readonly pendingRepository: PendingRepository) {}

  counts(payload: GetPendingCountsPayload): Promise<PendingCountsDto> {
    return this.pendingRepository.countForUser(payload.userId);
  }
}
