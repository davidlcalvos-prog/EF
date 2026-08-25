import { Injectable } from '@nestjs/common';
import { GlobalRankingsResponse } from '@ef/contracts';
import { RankingsRepository } from './repositories/rankings.repository';

@Injectable()
export class RankingsService {
  constructor(private readonly rankingsRepository: RankingsRepository) {}

  getGlobal(): Promise<GlobalRankingsResponse> {
    return this.rankingsRepository.getGlobalRankings();
  }
}
