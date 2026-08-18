import { Injectable } from '@nestjs/common';
import { PrismaService } from '@ef/database';
import { Prisma } from '@prisma/client';
import { PsychAssessmentDto } from '@ef/contracts';

function isSameCalendarMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

@Injectable()
export class PsychAssessmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findLatest(userId: string): Promise<PsychAssessmentDto | null> {
    const row = await this.prisma.psychAssessment.findFirst({
      where: { userId },
      orderBy: { completedAt: 'desc' },
    });
    return row ? this.toDto(row) : null;
  }

  async isLockedThisMonth(userId: string): Promise<boolean> {
    const latest = await this.findLatest(userId);
    if (!latest) return false;
    return isSameCalendarMonth(new Date(latest.completedAt), new Date());
  }

  async create(
    userId: string,
    answers: number[],
    teamworkScore: number,
    onFieldScore: number,
    overallScore: number,
    traits: Record<string, number>,
  ): Promise<PsychAssessmentDto> {
    const row = await this.prisma.psychAssessment.create({
      data: {
        userId,
        answers: answers as Prisma.InputJsonValue,
        teamworkScore,
        onFieldScore,
        overallScore,
        traits: traits as Prisma.InputJsonValue,
      },
    });
    return this.toDto(row);
  }

  private toDto(row: {
    id: string;
    answers: unknown;
    teamworkScore: number;
    onFieldScore: number;
    overallScore: number;
    traits: unknown;
    completedAt: Date;
  }): PsychAssessmentDto {
    return {
      id: row.id,
      answers: row.answers as number[],
      teamworkScore: row.teamworkScore,
      onFieldScore: row.onFieldScore,
      overallScore: row.overallScore,
      traits: row.traits as Record<string, number>,
      completedAt: row.completedAt.toISOString(),
    };
  }
}
