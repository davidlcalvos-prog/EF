import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { MESSAGE_PATTERNS } from '@ef/common';
import { RankingsService } from './rankings.service';

@Controller()
export class RankingsController {
  constructor(private readonly rankingsService: RankingsService) {}

  @MessagePattern(MESSAGE_PATTERNS.RANKINGS.GET_GLOBAL)
  getGlobal() {
    return this.rankingsService.getGlobal();
  }
}
