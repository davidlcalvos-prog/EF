import { Injectable } from '@nestjs/common';
import { PrismaService } from '@ef/database';
import { Prisma } from '@prisma/client';
import { PhysicalTestId, PhysicalTestResultDto } from '@ef/contracts';

function isSameCalendarMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

@Injectable()
export class PhysicalTestResultRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Última medición registrada para ese test — usada para el bloqueo mensual server-side. */
  async findLatestForTest(
    userId: string,
    testId: PhysicalTestId,
  ): Promise<PhysicalTestResultDto | null> {
    const row = await this.prisma.physicalTestResult.findFirst({
      where: { userId, testId },
      orderBy: { completedAt: 'desc' },
    });
    return row ? this.toDto(row) : null;
  }

  async isLockedThisMonth(userId: string, testId: PhysicalTestId): Promise<boolean> {
    const latest = await this.findLatestForTest(userId, testId);
    if (!latest) return false;
    return isSameCalendarMonth(new Date(latest.completedAt), new Date());
  }

  async create(
    userId: string,
    testId: PhysicalTestId,
    rawData: Record<string, unknown>,
    score: number,
  ): Promise<PhysicalTestResultDto> {
    const row = await this.prisma.physicalTestResult.create({
      data: { userId, testId, rawData: rawData as Prisma.InputJsonValue, score },
    });
    return this.toDto(row);
  }

  /** Último resultado por cada testId con historial — para reconstruir el perfil en un dispositivo nuevo. */
  async findLatestPerTest(
    userId: string,
  ): Promise<Partial<Record<PhysicalTestId, PhysicalTestResultDto>>> {
    const rows = await this.prisma.physicalTestResult.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
    });

    const latestByTest: Partial<Record<PhysicalTestId, PhysicalTestResultDto>> = {};
    for (const row of rows) {
      const testId = row.testId as PhysicalTestId;
      if (!latestByTest[testId]) {
        latestByTest[testId] = this.toDto(row);
      }
    }
    return latestByTest;
  }

  private toDto(row: {
    id: string;
    testId: string;
    rawData: unknown;
    score: number;
    completedAt: Date;
  }): PhysicalTestResultDto {
    return {
      id: row.id,
      testId: row.testId as PhysicalTestId,
      rawData: row.rawData as Record<string, unknown>,
      score: row.score,
      completedAt: row.completedAt.toISOString(),
    };
  }
}
