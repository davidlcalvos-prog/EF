import { Injectable } from '@nestjs/common';
import { PrismaService } from '@ef/database';
import { GlobalRankingsResponse, RankingEntry } from '@ef/contracts';

const TOP_N = 5;

interface UserInfo {
  firstname: string;
  lastname: string;
  profile: { alias: string; favoritePosition: string | null } | null;
}

function displayNameOf(user: UserInfo): string {
  if (user.profile?.alias) return user.profile.alias;
  return [user.firstname, user.lastname]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ');
}

/** Acumulador por jugador para las tablas de campeonatos (goleadores/valla). */
interface TournamentAggregate {
  userId: string;
  displayName: string;
  favoritePosition: string | null;
  goals: number;
  goalsAgainst: number;
  matchesPlayed: number;
  isGoalkeeper: boolean;
}

@Injectable()
export class RankingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Agregación en memoria a propósito (no groupBy de Prisma): el volumen es
   * chico (filas de TournamentPlayer de torneos elite_forge, PlayerStats con
   * valor > 0) y los desempates por displayName y el cálculo de partidos
   * jugados requieren joins que groupBy no expresa con claridad.
   */
  async getGlobalRankings(): Promise<GlobalRankingsResponse> {
    const [tournamentRows, defenseRows, passesRows] = await Promise.all([
      // Fuente de goleadores y valla: SOLO campeonatos oficiales con roster
      // real (userId != null) en estado active/finished. Histórico: se suman
      // todos los torneos elite_forge del jugador.
      this.prisma.tournamentPlayer.findMany({
        where: {
          userId: { not: null },
          user: { estado: true },
          team: {
            tournament: { kind: 'elite_forge', status: { in: ['active', 'finished'] } },
          },
        },
        select: {
          userId: true,
          isGoalkeeper: true,
          goals: true,
          goalsAgainst: true,
          team: { select: { wins: true, draws: true, losses: true, lossesByW: true } },
          user: {
            select: {
              firstname: true,
              lastname: true,
              profile: { select: { alias: true, favoritePosition: true } },
            },
          },
        },
      }),
      this.prisma.playerStats.findMany({
        where: { defense: { gt: 0 }, user: { estado: true } },
        select: {
          userId: true,
          defense: true,
          passes: true,
          user: {
            select: {
              firstname: true,
              lastname: true,
              profile: { select: { alias: true, favoritePosition: true } },
            },
          },
        },
      }),
      this.prisma.playerStats.findMany({
        where: { passes: { gt: 0 }, user: { estado: true } },
        select: {
          userId: true,
          defense: true,
          passes: true,
          user: {
            select: {
              firstname: true,
              lastname: true,
              profile: { select: { alias: true, favoritePosition: true } },
            },
          },
        },
      }),
    ]);

    // --- Agregado por jugador sobre sus filas de torneo ---
    const byUser = new Map<string, TournamentAggregate>();
    for (const row of tournamentRows) {
      const userId = row.userId as string; // where garantiza != null
      const current = byUser.get(userId) ?? {
        userId,
        displayName: displayNameOf(row.user as UserInfo),
        favoritePosition: row.user?.profile?.favoritePosition ?? null,
        goals: 0,
        goalsAgainst: 0,
        matchesPlayed: 0,
        isGoalkeeper: false,
      };
      current.goals += row.goals;
      current.goalsAgainst += row.goalsAgainst;
      // No hay conteo de partidos POR JUGADOR en el schema: se usa el del
      // equipo (wins+draws+losses+lossesByW) como aproximación aceptada para
      // esta fase — asume que el jugador jugó los partidos de su equipo.
      current.matchesPlayed +=
        row.team.wins + row.team.draws + row.team.losses + row.team.lossesByW;
      // Arquero en al menos un roster: entra a la tabla de valla.
      current.isGoalkeeper = current.isGoalkeeper || row.isGoalkeeper;
      byUser.set(userId, current);
    }
    const aggregates = [...byUser.values()];

    const topScorers: RankingEntry[] = aggregates
      .filter((a) => a.goals > 0)
      .sort(
        (a, b) =>
          b.goals - a.goals ||
          a.matchesPlayed - b.matchesPlayed ||
          a.displayName.localeCompare(b.displayName),
      )
      .slice(0, TOP_N)
      .map((a) => ({
        userId: a.userId,
        displayName: a.displayName,
        favoritePosition: a.favoritePosition,
        value: a.goals,
        secondary: a.matchesPlayed,
      }));

    // Excluir 0 partidos jugados: si no, cualquiera sin jugar sale primero con 0.
    const bestGoalkeepers: RankingEntry[] = aggregates
      .filter((a) => a.isGoalkeeper && a.matchesPlayed > 0)
      .map((a) => ({
        ...a,
        concededPerMatch: Math.round((a.goalsAgainst / a.matchesPlayed) * 100) / 100,
      }))
      .sort(
        (a, b) =>
          a.concededPerMatch - b.concededPerMatch ||
          b.matchesPlayed - a.matchesPlayed ||
          a.displayName.localeCompare(b.displayName),
      )
      .slice(0, TOP_N)
      .map((a) => ({
        userId: a.userId,
        displayName: a.displayName,
        favoritePosition: a.favoritePosition,
        value: a.concededPerMatch,
        secondary: a.matchesPlayed,
      }));

    const toStatsEntry = (row: (typeof defenseRows)[number], value: number): RankingEntry => ({
      userId: row.userId,
      displayName: displayNameOf(row.user as UserInfo),
      favoritePosition: row.user?.profile?.favoritePosition ?? null,
      value,
    });

    const bestDefense: RankingEntry[] = defenseRows
      .sort(
        (a, b) =>
          b.defense - a.defense ||
          b.passes - a.passes ||
          displayNameOf(a.user as UserInfo).localeCompare(displayNameOf(b.user as UserInfo)),
      )
      .slice(0, TOP_N)
      .map((row) => toStatsEntry(row, row.defense));

    const mostPasses: RankingEntry[] = passesRows
      .sort(
        (a, b) =>
          b.passes - a.passes ||
          b.defense - a.defense ||
          displayNameOf(a.user as UserInfo).localeCompare(displayNameOf(b.user as UserInfo)),
      )
      .slice(0, TOP_N)
      .map((row) => toStatsEntry(row, row.passes));

    return { topScorers, bestGoalkeepers, bestDefense, mostPasses };
  }
}
