import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@ef/database';
import {
  DomainMatch,
  DomainMatchPlayerStat,
  DomainPlayer,
  DomainTeam,
  DomainTournament,
  recomputeStandings,
  TournamentCourtSizeDto,
  TournamentDto,
  TournamentMatchDto,
  TournamentPlayerDto,
  TournamentScheduleDto,
  TournamentTeamDto,
  TournamentTeamInputDto,
} from '@ef/contracts';
import { TournamentCourtSize as PrismaCourtSize, Prisma } from '@prisma/client';
import { VenueRepository } from '../../venues/repositories/venue.repository';

const COURT_SIZE_TO_PRISMA: Record<TournamentCourtSizeDto, PrismaCourtSize> = {
  '6vs6': 'six_vs_six',
  '8vs8': 'eight_vs_eight',
  '11vs11': 'eleven_vs_eleven',
};

const COURT_SIZE_FROM_PRISMA: Record<PrismaCourtSize, TournamentCourtSizeDto> = {
  six_vs_six: '6vs6',
  eight_vs_eight: '8vs8',
  eleven_vs_eleven: '11vs11',
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(id: string): boolean {
  return UUID_RE.test(id);
}

const TOURNAMENT_INCLUDE = {
  teams: { include: { players: true } },
  matches: true,
} satisfies Prisma.TournamentInclude;

type TournamentRow = Prisma.TournamentGetPayload<{ include: typeof TOURNAMENT_INCLUDE }>;
type TeamRow = TournamentRow['teams'][number];
type PlayerRow = TeamRow['players'][number];
type MatchRow = TournamentRow['matches'][number];

@Injectable()
export class TournamentRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly venueRepository: VenueRepository,
  ) {}

  async listMine(ownerId: string): Promise<TournamentDto[]> {
    const rows = await this.prisma.tournament.findMany({
      where: { ownerId },
      include: TOURNAMENT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toTournamentDto(row));
  }

  /** Lanza NotFound si no existe, Forbidden si existe pero es de otro owner (mismo criterio que VenueRepository/venues.service). */
  async requireOwned(tournamentId: string, ownerId: string): Promise<TournamentRow> {
    const row = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: TOURNAMENT_INCLUDE,
    });
    if (!row) throw new NotFoundException(`Tournament ${tournamentId} not found`);
    if (row.ownerId !== ownerId) {
      throw new ForbiddenException('This tournament does not belong to you');
    }
    return row;
  }

  async getOwned(tournamentId: string, ownerId: string): Promise<TournamentDto> {
    const row = await this.requireOwned(tournamentId, ownerId);
    return this.toTournamentDto(row);
  }

  async create(
    ownerId: string,
    payload: {
      name: string;
      venueId: string;
      courtSize: TournamentCourtSizeDto;
      format: 'groups_of_4' | 'round_robin' | 'brackets';
      maxTeams: number;
      bracketKeys: number;
      schedule: TournamentScheduleDto;
    },
  ): Promise<TournamentDto> {
    const venue = await this.prisma.venue.findUnique({
      where: { id: payload.venueId },
      select: { id: true, ownerId: true },
    });
    if (!venue) throw new NotFoundException(`Venue ${payload.venueId} not found`);
    if (venue.ownerId !== ownerId) {
      throw new ForbiddenException('This venue does not belong to you');
    }

    const created = await this.prisma.tournament.create({
      data: {
        ownerId,
        venueId: payload.venueId,
        name: payload.name,
        courtSize: COURT_SIZE_TO_PRISMA[payload.courtSize],
        format: payload.format,
        maxTeams: payload.maxTeams,
        bracketKeys: payload.bracketKeys,
        schedule: payload.schedule as unknown as Prisma.InputJsonValue,
      },
      include: TOURNAMENT_INCLUDE,
    });
    return this.toTournamentDto(created);
  }

  async update(
    tournamentId: string,
    ownerId: string,
    patch: {
      name?: string;
      courtSize?: TournamentCourtSizeDto;
      format?: 'groups_of_4' | 'round_robin' | 'brackets';
      maxTeams?: number;
      bracketKeys?: number;
      extraRoundEnabled?: boolean;
      status?: 'draft' | 'registration' | 'active' | 'finished';
      schedule?: TournamentScheduleDto;
    },
  ): Promise<TournamentDto> {
    await this.requireOwned(tournamentId, ownerId);

    const updated = await this.prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        name: patch.name,
        courtSize: patch.courtSize ? COURT_SIZE_TO_PRISMA[patch.courtSize] : undefined,
        format: patch.format,
        maxTeams: patch.maxTeams,
        bracketKeys: patch.bracketKeys,
        extraRoundEnabled: patch.extraRoundEnabled,
        status: patch.status,
        schedule: patch.schedule
          ? (patch.schedule as unknown as Prisma.InputJsonValue)
          : undefined,
      },
      include: TOURNAMENT_INCLUDE,
    });
    return this.toTournamentDto(updated);
  }

  async delete(tournamentId: string, ownerId: string): Promise<void> {
    const tournament = await this.requireOwned(tournamentId, ownerId);
    await this.deleteReservationsForMatches(tournament.matches.map((m) => m.id));
    // Cascade se encarga de teams/players/matches.
    await this.prisma.tournament.delete({ where: { id: tournamentId } });
  }

  /**
   * Reconcilia el array completo de equipos+jugadores contra lo ya guardado:
   * ids que ya existen en la base -> update; ids nuevos (temporales, no-uuid,
   * generados en el cliente) -> insert; los que ya no vienen en el array ->
   * delete (cascada limpia jugadores y, si tenían partidos, esos partidos +
   * sus reservas asociadas).
   */
  async upsertTeams(
    tournamentId: string,
    ownerId: string,
    teams: TournamentTeamInputDto[],
  ): Promise<TournamentDto> {
    const tournament = await this.requireOwned(tournamentId, ownerId);

    const existingTeams = tournament.teams;
    const existingTeamIds = new Set(existingTeams.map((t) => t.id));
    const incomingTeamIds = new Set(
      teams.filter((t) => isUuid(t.id) && existingTeamIds.has(t.id)).map((t) => t.id),
    );

    const teamsToRemove = existingTeams.filter((t) => !incomingTeamIds.has(t.id));
    if (teamsToRemove.length > 0) {
      const affectedMatchIds = tournament.matches
        .filter(
          (m) =>
            teamsToRemove.some((t) => t.id === m.homeTeamId) ||
            teamsToRemove.some((t) => t.id === m.awayTeamId),
        )
        .map((m) => m.id);
      await this.deleteReservationsForMatches(affectedMatchIds);
      await this.prisma.tournamentTeam.deleteMany({
        where: { id: { in: teamsToRemove.map((t) => t.id) } },
      });
    }

    for (const team of teams) {
      const isExisting = isUuid(team.id) && existingTeamIds.has(team.id);
      const teamId = isExisting
        ? team.id
        : (
            await this.prisma.tournamentTeam.create({
              data: { tournamentId, name: team.name, groupId: team.groupId ?? null },
              select: { id: true },
            })
          ).id;

      if (isExisting) {
        await this.prisma.tournamentTeam.update({
          where: { id: teamId },
          data: { name: team.name, groupId: team.groupId ?? null },
        });
      }

      const existingPlayerIds = new Set(
        (existingTeams.find((t) => t.id === teamId)?.players ?? []).map((p) => p.id),
      );
      const incomingPlayerIds = new Set(
        team.players.filter((p) => isUuid(p.id) && existingPlayerIds.has(p.id)).map((p) => p.id),
      );
      const playersToRemove = [...existingPlayerIds].filter((id) => !incomingPlayerIds.has(id));
      if (playersToRemove.length > 0) {
        await this.prisma.tournamentPlayer.deleteMany({ where: { id: { in: playersToRemove } } });
      }

      for (const player of team.players) {
        const isPlayerExisting = isUuid(player.id) && existingPlayerIds.has(player.id);
        if (isPlayerExisting) {
          await this.prisma.tournamentPlayer.update({
            where: { id: player.id },
            data: { name: player.name, isGoalkeeper: player.isGoalkeeper },
          });
        } else {
          await this.prisma.tournamentPlayer.create({
            data: { teamId, name: player.name, isGoalkeeper: player.isGoalkeeper },
          });
        }
      }
    }

    const reloaded = await this.prisma.tournament.findUniqueOrThrow({
      where: { id: tournamentId },
      include: TOURNAMENT_INCLUDE,
    });
    return this.toTournamentDto(reloaded);
  }

  async updateMatchResult(
    tournamentId: string,
    matchId: string,
    ownerId: string,
    patch: {
      status: 'scheduled' | 'played' | 'walkover_home' | 'walkover_away';
      homeGoals?: number | null;
      awayGoals?: number | null;
      playerStats?: DomainMatchPlayerStat[];
    },
  ): Promise<TournamentDto> {
    const tournament = await this.requireOwned(tournamentId, ownerId);
    const match = tournament.matches.find((m) => m.id === matchId);
    if (!match) throw new NotFoundException(`Match ${matchId} not found in this tournament`);

    await this.prisma.tournamentMatch.update({
      where: { id: matchId },
      data: {
        status: patch.status,
        homeGoals: patch.homeGoals ?? null,
        awayGoals: patch.awayGoals ?? null,
        playerStats: (patch.playerStats ?? []) as unknown as Prisma.InputJsonValue,
      },
    });

    return this.recomputeAndPersistStandings(tournamentId);
  }

  /** Recalcula standings desde `matches` (fuente de verdad) y persiste los agregados de equipos/jugadores. */
  private async recomputeAndPersistStandings(tournamentId: string): Promise<TournamentDto> {
    const row = await this.prisma.tournament.findUniqueOrThrow({
      where: { id: tournamentId },
      include: TOURNAMENT_INCLUDE,
    });

    const domainTeams = row.teams.map((t) => this.toDomainTeam(t));
    const domainMatches = row.matches.map((m) => this.toDomainMatch(m));
    const recomputed = recomputeStandings(domainTeams, domainMatches);

    for (const team of recomputed) {
      await this.prisma.tournamentTeam.update({
        where: { id: team.id },
        data: {
          wins: team.wins,
          draws: team.draws,
          losses: team.losses,
          lossesByW: team.lossesByW,
          points: team.points,
          goalsFor: team.goalsFor,
          goalsAgainst: team.goalsAgainst,
        },
      });
      for (const player of team.players) {
        await this.prisma.tournamentPlayer.update({
          where: { id: player.id },
          data: {
            goals: player.goals,
            goalsAgainst: player.goalsAgainst,
            assists: player.assists,
            dfr: player.dfr,
            yellowCards: player.yellowCards,
            redCards: player.redCards,
          },
        });
      }
    }

    const reloaded = await this.prisma.tournament.findUniqueOrThrow({
      where: { id: tournamentId },
      include: TOURNAMENT_INCLUDE,
    });
    return this.toTournamentDto(reloaded);
  }

  /** Borra las reservas reales vinculadas a estos partidos de torneo (limpieza al eliminar/regenerar/quitar equipos). */
  async deleteReservationsForMatches(matchIds: string[]): Promise<void> {
    if (matchIds.length === 0) return;
    await this.prisma.reservation.deleteMany({
      where: { tournamentMatchId: { in: matchIds } },
    });
  }

  async deleteAllMatches(tournamentId: string): Promise<void> {
    await this.prisma.tournamentMatch.deleteMany({ where: { tournamentId } });
  }

  async persistGroupIds(teams: DomainTeam[]): Promise<void> {
    for (const team of teams) {
      await this.prisma.tournamentTeam.update({
        where: { id: team.id },
        data: { groupId: team.groupId ?? null },
      });
    }
  }

  async insertMatches(
    tournamentId: string,
    matches: DomainMatch[],
  ): Promise<{ id: string; homeTeamId: string; awayTeamId: string; startsAt: Date | null; endsAt: Date | null; courtNumber: number }[]> {
    const created: {
      id: string;
      homeTeamId: string;
      awayTeamId: string;
      startsAt: Date | null;
      endsAt: Date | null;
      courtNumber: number;
    }[] = [];
    for (const match of matches) {
      const row = await this.prisma.tournamentMatch.create({
        data: {
          tournamentId,
          roundLabel: match.roundLabel,
          keyIndex: match.keyIndex,
          homeTeamId: match.homeTeamId,
          awayTeamId: match.awayTeamId,
          status: 'scheduled',
          playerStats: [] as unknown as Prisma.InputJsonValue,
          startsAt: match.startsAt ? new Date(match.startsAt) : null,
          endsAt: match.endsAt ? new Date(match.endsAt) : null,
          courtNumber: match.courtNumber ?? 1,
        },
        select: { id: true, homeTeamId: true, awayTeamId: true, startsAt: true, endsAt: true, courtNumber: true },
      });
      created.push(row);
    }
    return created;
  }

  async clearMatchSchedule(matchId: string): Promise<void> {
    await this.prisma.tournamentMatch.update({
      where: { id: matchId },
      data: { startsAt: null, endsAt: null },
    });
  }

  async hasOverlap(venueId: string, startsAt: Date, endsAt: Date): Promise<boolean> {
    return this.venueRepository.hasOverlappingReservation(venueId, startsAt, endsAt);
  }

  async createReservationForMatch(params: {
    ownerId: string;
    venueId: string;
    venueName: string;
    matchId: string;
    startsAt: Date;
    endsAt: Date;
    notes: string;
  }): Promise<void> {
    await this.prisma.reservation.create({
      data: {
        userId: params.ownerId,
        venueId: params.venueId,
        venueName: params.venueName,
        startsAt: params.startsAt,
        endsAt: params.endsAt,
        notes: params.notes,
        tournamentMatchId: params.matchId,
        status: 'confirmed',
      },
    });
  }

  async findVenueName(venueId: string): Promise<string> {
    const venue = await this.prisma.venue.findUniqueOrThrow({
      where: { id: venueId },
      select: { name: true },
    });
    return venue.name;
  }

  toDomainTournament(row: TournamentRow): DomainTournament {
    return {
      id: row.id,
      name: row.name,
      courtSize: COURT_SIZE_FROM_PRISMA[row.courtSize],
      format: row.format,
      maxTeams: row.maxTeams,
      bracketKeys: row.bracketKeys,
      extraRoundEnabled: row.extraRoundEnabled,
      schedule: row.schedule as unknown as DomainTournament['schedule'],
      teams: row.teams.map((t) => this.toDomainTeam(t)),
      matches: row.matches.map((m) => this.toDomainMatch(m)),
    };
  }

  private toDomainTeam(row: TeamRow): DomainTeam {
    return {
      id: row.id,
      name: row.name,
      groupId: row.groupId,
      players: row.players.map((p) => this.toDomainPlayer(p)),
      wins: row.wins,
      draws: row.draws,
      losses: row.losses,
      lossesByW: row.lossesByW,
      points: row.points,
      goalsFor: row.goalsFor,
      goalsAgainst: row.goalsAgainst,
    };
  }

  private toDomainPlayer(row: PlayerRow): DomainPlayer {
    return {
      id: row.id,
      name: row.name,
      isGoalkeeper: row.isGoalkeeper,
      goals: row.goals,
      goalsAgainst: row.goalsAgainst,
      assists: row.assists,
      dfr: row.dfr,
      yellowCards: row.yellowCards,
      redCards: row.redCards,
    };
  }

  private toDomainMatch(row: MatchRow): DomainMatch {
    return {
      id: row.id,
      roundLabel: row.roundLabel,
      keyIndex: row.keyIndex,
      homeTeamId: row.homeTeamId,
      awayTeamId: row.awayTeamId,
      homeGoals: row.homeGoals,
      awayGoals: row.awayGoals,
      status: row.status,
      playerStats: (row.playerStats as unknown as DomainMatchPlayerStat[]) ?? [],
      startsAt: row.startsAt ? row.startsAt.toISOString() : null,
      endsAt: row.endsAt ? row.endsAt.toISOString() : null,
      courtNumber: row.courtNumber,
    };
  }

  private toTournamentDto(row: TournamentRow): TournamentDto {
    return {
      id: row.id,
      ownerId: row.ownerId,
      venueId: row.venueId,
      name: row.name,
      courtSize: COURT_SIZE_FROM_PRISMA[row.courtSize],
      format: row.format,
      maxTeams: row.maxTeams,
      bracketKeys: row.bracketKeys,
      extraRoundEnabled: row.extraRoundEnabled,
      status: row.status,
      schedule: row.schedule as unknown as TournamentScheduleDto,
      teams: row.teams.map((t) => this.toTeamDto(t)),
      matches: row.matches.map((m) => this.toMatchDto(m)),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toTeamDto(row: TeamRow): TournamentTeamDto {
    return {
      id: row.id,
      name: row.name,
      groupId: row.groupId,
      players: row.players.map((p) => this.toPlayerDto(p)),
      wins: row.wins,
      draws: row.draws,
      losses: row.losses,
      lossesByW: row.lossesByW,
      points: row.points,
      goalsFor: row.goalsFor,
      goalsAgainst: row.goalsAgainst,
    };
  }

  private toPlayerDto(row: PlayerRow): TournamentPlayerDto {
    return {
      id: row.id,
      name: row.name,
      isGoalkeeper: row.isGoalkeeper,
      goals: row.goals,
      goalsAgainst: row.goalsAgainst,
      assists: row.assists,
      dfr: row.dfr,
      yellowCards: row.yellowCards,
      redCards: row.redCards,
    };
  }

  private toMatchDto(row: MatchRow): TournamentMatchDto {
    return {
      id: row.id,
      roundLabel: row.roundLabel,
      keyIndex: row.keyIndex,
      homeTeamId: row.homeTeamId,
      awayTeamId: row.awayTeamId,
      homeGoals: row.homeGoals,
      awayGoals: row.awayGoals,
      status: row.status,
      playerStats: (row.playerStats as unknown as TournamentMatchDto['playerStats']) ?? [],
      startsAt: row.startsAt ? row.startsAt.toISOString() : null,
      endsAt: row.endsAt ? row.endsAt.toISOString() : null,
      courtNumber: row.courtNumber,
    };
  }
}
