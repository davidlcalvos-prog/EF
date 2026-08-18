import { Injectable } from '@nestjs/common';
import { PrismaService } from '@ef/database';
import { PlayerStatsDto, StatKey } from '@ef/contracts';

@Injectable()
export class PlayerStatsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<PlayerStatsDto | null> {
    const row = await this.prisma.playerStats.findUnique({ where: { userId } });
    return row ? this.toDto(row) : null;
  }

  async applyTestScore(
    userId: string,
    statKey: StatKey,
    score: number,
  ): Promise<PlayerStatsDto> {
    const row = await this.prisma.playerStats.upsert({
      where: { userId },
      create: {
        userId,
        attack: 0,
        defense: 0,
        endurance: 0,
        speed: 0,
        passes: 0,
        dribbling: 0,
        [statKey]: score,
      },
      update: {
        [statKey]: score,
      },
    });
    return this.toDto(row);
  }

  private toDto(row: {
    attack: number;
    defense: number;
    endurance: number;
    speed: number;
    passes: number;
    dribbling: number;
    updatedAt: Date;
  }): PlayerStatsDto {
    return {
      attack: row.attack,
      defense: row.defense,
      endurance: row.endurance,
      speed: row.speed,
      passes: row.passes,
      dribbling: row.dribbling,
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
