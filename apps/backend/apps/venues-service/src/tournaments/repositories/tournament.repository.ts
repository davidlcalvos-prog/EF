import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@ef/database';
import {
  AssignedTournamentMatchDto,
  DomainMatch,
  DomainMatchPlayerStat,
  DomainPlayer,
  DomainTeam,
  DomainTournament,
  RankingEntry,
  recomputeStandings,
  TournamentCourtSizeDto,
  TournamentDto,
  TournamentKindDto,
  TournamentMatchDto,
  TournamentPlayerDto,
  TournamentRankingsResponse,
  TournamentScheduleDto,
  TournamentStatusDto,
  TournamentTeamDto,
  TournamentTeamInputDto,
} from '@ef/contracts';
import { GroupRole, TournamentCourtSize as PrismaCourtSize, Prisma } from '@prisma/client';
import { VenueRepository } from '../../venues/repositories/venue.repository';

const GROUP_LEADER_ROLES: GroupRole[] = ['creator', 'admin'];

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
  matches: { include: { venue: { select: { name: true } } } },
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

  // --- Copa Elite Forge (Fase 7.2): lado jugador ---

  /** Cualquier usuario autenticado — sin filtro de owner. */
  async listActiveForPlayer(): Promise<TournamentDto[]> {
    const rows = await this.prisma.tournament.findMany({
      where: { kind: 'elite_forge', status: { in: ['registration', 'active'] } },
      include: TOURNAMENT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toTournamentDto(row));
  }

  /** Detalle público (fixture/equipos/standings) de un torneo elite_forge — cualquier autenticado. */
  async getPublic(tournamentId: string): Promise<TournamentDto> {
    const row = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: TOURNAMENT_INCLUDE,
    });
    if (!row) throw new NotFoundException(`Tournament ${tournamentId} not found`);
    if (row.kind !== 'elite_forge') {
      throw new ForbiddenException('This tournament is private');
    }
    return this.toTournamentDto(row);
  }

  /**
   * Rankings del torneo consultado (Fase 9, corregida: por campeonato, no
   * globales). Solo elite_forge — mismo guard que getPublic. Agregación en
   * memoria: el volumen es el roster de UN torneo.
   */
  async getTournamentRankings(tournamentId: string): Promise<TournamentRankingsResponse> {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { kind: true },
    });
    if (!tournament) throw new NotFoundException(`Tournament ${tournamentId} not found`);
    if (tournament.kind !== 'elite_forge') {
      throw new ForbiddenException('This tournament is private');
    }

    const rows = await this.prisma.tournamentPlayer.findMany({
      where: {
        userId: { not: null },
        user: { estado: true },
        team: { tournamentId },
      },
      select: {
        userId: true,
        isGoalkeeper: true,
        goals: true,
        goalsAgainst: true,
        assists: true,
        dfr: true,
        team: { select: { wins: true, draws: true, losses: true, lossesByW: true } },
        user: {
          select: {
            firstname: true,
            lastname: true,
            profile: { select: { alias: true, favoritePosition: true } },
          },
        },
      },
    });

    // Agrupado por userId (Fase 8.2): si un mismo usuario aparece en dos
    // rosters del mismo torneo (dos grupos inscritos con ese jugador — hoy
    // nada lo impide), sale UNA sola vez con goles/GC/PJ sumados, en vez de
    // duplicar la fila (y romper la key de la lista en mobile).
    const byUser = new Map<
      string,
      {
        userId: string;
        displayName: string;
        favoritePosition: string | null;
        goals: number;
        goalsAgainst: number;
        assists: number;
        dfr: number;
        isGoalkeeper: boolean;
        matchesPlayed: number;
      }
    >();
    for (const row of rows) {
      const userId = row.userId as string; // where garantiza != null
      const alias = row.user?.profile?.alias;
      const displayName =
        alias ??
        [row.user?.firstname ?? '', row.user?.lastname ?? '']
          .map((part) => part.trim())
          .filter(Boolean)
          .join(' ');
      const current = byUser.get(userId) ?? {
        userId,
        displayName,
        favoritePosition: row.user?.profile?.favoritePosition ?? null,
        goals: 0,
        goalsAgainst: 0,
        assists: 0,
        dfr: 0,
        isGoalkeeper: false,
        matchesPlayed: 0,
      };
      current.goals += row.goals;
      current.goalsAgainst += row.goalsAgainst;
      current.assists += row.assists;
      current.dfr += row.dfr;
      // Arquero en al menos uno de sus rosters: entra a la tabla de valla.
      current.isGoalkeeper = current.isGoalkeeper || row.isGoalkeeper;
      // No hay conteo de partidos POR JUGADOR en el schema: se usa el del
      // equipo (wins+draws+losses+lossesByW) como aproximación aceptada —
      // asume que el jugador jugó los partidos de su equipo.
      current.matchesPlayed += row.team.wins + row.team.draws + row.team.losses + row.team.lossesByW;
      byUser.set(userId, current);
    }
    const entries = [...byUser.values()];

    /**
     * Top 5 por métrica acumulada (Fase 9.1): filtro > 0, orden desc,
     * desempate por menos partidos jugados y luego displayName asc. Solo para
     * las tablas descendentes — bestGoalkeepers tiene reglas propias (asc,
     * división por PJ, exclusión de 0 PJ) y queda aparte.
     */
    const buildTopFive = (pick: (e: (typeof entries)[number]) => number): RankingEntry[] =>
      entries
        .filter((e) => pick(e) > 0)
        .sort(
          (a, b) =>
            pick(b) - pick(a) ||
            a.matchesPlayed - b.matchesPlayed ||
            a.displayName.localeCompare(b.displayName),
        )
        .slice(0, 5)
        .map((e) => ({
          userId: e.userId,
          displayName: e.displayName,
          favoritePosition: e.favoritePosition,
          value: pick(e),
          secondary: e.matchesPlayed,
        }));

    const topScorers = buildTopFive((e) => e.goals);
    const bestDefenders = buildTopFive((e) => e.dfr);
    const topAssisters = buildTopFive((e) => e.assists);

    // Excluir 0 partidos jugados: si no, cualquier arquero sin jugar saldría primero con 0.
    const bestGoalkeepers: RankingEntry[] = entries
      .filter((e) => e.isGoalkeeper && e.matchesPlayed > 0)
      .map((e) => ({
        ...e,
        concededPerMatch: Math.round((e.goalsAgainst / e.matchesPlayed) * 100) / 100,
      }))
      .sort(
        (a, b) =>
          a.concededPerMatch - b.concededPerMatch ||
          b.matchesPlayed - a.matchesPlayed ||
          a.displayName.localeCompare(b.displayName),
      )
      .slice(0, 5)
      .map((e) => ({
        userId: e.userId,
        displayName: e.displayName,
        favoritePosition: e.favoritePosition,
        value: e.concededPerMatch,
        secondary: e.matchesPlayed,
      }));

    return { topScorers, bestGoalkeepers, bestDefenders, topAssisters };
  }

  async getEnrollmentContext(
    tournamentId: string,
  ): Promise<{ kind: TournamentKindDto; status: TournamentStatusDto; courtSize: TournamentCourtSizeDto } | null> {
    const row = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { kind: true, status: true, courtSize: true },
    });
    if (!row) return null;
    return { kind: row.kind, status: row.status, courtSize: COURT_SIZE_FROM_PRISMA[row.courtSize] };
  }

  /** Reusa la misma consulta que ya usa VenueRepository para el mismo criterio creator/admin. */
  findGroupLeaderRole(groupId: string, userId: string): Promise<GroupRole | null> {
    return this.venueRepository.findGroupMembershipRole(groupId, userId);
  }

  async isGroupEnrolled(tournamentId: string, groupId: string): Promise<boolean> {
    const existing = await this.prisma.tournamentTeam.findFirst({
      where: { tournamentId, enrolledGroupId: groupId },
      select: { id: true },
    });
    return existing != null;
  }

  /**
   * Inscribe el grupo como TournamentTeam + un TournamentPlayer por cada
   * userId elegido. isGoalkeeper se resuelve por favoritePosition==='goalkeeper'
   * (mismo criterio simple; no se usa el fallback por stats del randomizador de
   * partidos internos, que exigiría traer PlayerStats acá sin necesidad real —
   * ver nota en TournamentsService.enrollGroup).
   */
  async enrollGroup(
    tournamentId: string,
    groupId: string,
    playerUserIds: string[],
  ): Promise<TournamentDto> {
    const members = await this.prisma.groupMembership.findMany({
      where: { groupId, userId: { in: playerUserIds } },
      select: { userId: true },
    });
    const validIds = new Set(members.map((m) => m.userId));
    const invalid = playerUserIds.filter((id) => !validIds.has(id));
    if (invalid.length > 0) {
      throw new ConflictException('Some selected players are not members of this group');
    }

    const [group, users] = await Promise.all([
      this.prisma.group.findUniqueOrThrow({ where: { id: groupId }, select: { name: true } }),
      this.prisma.user.findMany({
        where: { id: { in: playerUserIds } },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          profile: { select: { favoritePosition: true } },
        },
      }),
    ]);

    await this.prisma.tournamentTeam.create({
      data: {
        tournamentId,
        enrolledGroupId: groupId,
        name: group.name,
        players: {
          create: users.map((u) => ({
            userId: u.id,
            name: [u.firstname, u.lastname]
              .map((part) => part.trim())
              .filter(Boolean)
              .join(' '),
            isGoalkeeper: u.profile?.favoritePosition === 'goalkeeper',
          })),
        },
      },
    });

    const reloaded = await this.prisma.tournament.findUniqueOrThrow({
      where: { id: tournamentId },
      include: TOURNAMENT_INCLUDE,
    });
    return this.toTournamentDto(reloaded);
  }

  // --- Copa Elite Forge (Fase 7.2): lado dueño de cancha sintética ---

  async listAssignedMatchesForVenueOwner(ownerId: string): Promise<AssignedTournamentMatchDto[]> {
    const venues = await this.prisma.venue.findMany({ where: { ownerId }, select: { id: true } });
    const venueIds = venues.map((v) => v.id);
    if (venueIds.length === 0) return [];

    const matches = await this.prisma.tournamentMatch.findMany({
      where: { venueId: { in: venueIds }, tournament: { kind: 'elite_forge' } },
      include: {
        tournament: { select: { id: true, name: true } },
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
        reservation: { select: { id: true, status: true } },
      },
      orderBy: { startsAt: 'asc' },
    });

    return matches.map((m) => ({
      matchId: m.id,
      tournamentId: m.tournament.id,
      tournamentName: m.tournament.name,
      homeTeamName: m.homeTeam.name,
      awayTeamName: m.awayTeam.name,
      startsAt: m.startsAt ? m.startsAt.toISOString() : null,
      endsAt: m.endsAt ? m.endsAt.toISOString() : null,
      courtNumber: m.courtNumber,
      matchStatus: m.status,
      reservationId: m.reservation?.id ?? null,
      reservationStatus: m.reservation?.status ?? null,
    }));
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

  /**
   * kind='private': venueId obligatorio, se valida que la cancha sea del owner
   * (comportamiento igual a la 7.1). kind='elite_forge': sin venueId — la
   * cancha se decide por partido al generar el fixture (ver persistGeneratedMatches
   * en TournamentsService).
   */
  async create(
    ownerId: string,
    payload: {
      name: string;
      kind: TournamentKindDto;
      venueId?: string;
      courtSize: TournamentCourtSizeDto;
      format: 'groups_of_4' | 'round_robin' | 'brackets';
      maxTeams: number;
      bracketKeys: number;
      schedule: TournamentScheduleDto;
    },
  ): Promise<TournamentDto> {
    let venueId: string | null = null;
    if (payload.kind === 'private') {
      if (!payload.venueId) {
        throw new ConflictException('venueId is required for private tournaments');
      }
      const venue = await this.prisma.venue.findUnique({
        where: { id: payload.venueId },
        select: { id: true, ownerId: true },
      });
      if (!venue) throw new NotFoundException(`Venue ${payload.venueId} not found`);
      if (venue.ownerId !== ownerId) {
        throw new ForbiddenException('This venue does not belong to you');
      }
      venueId = payload.venueId;
    }

    const created = await this.prisma.tournament.create({
      data: {
        ownerId,
        kind: payload.kind,
        venueId,
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

  async delete(tournamentId: string, ownerId: string): Promise<{ success: true }> {
    const tournament = await this.requireOwned(tournamentId, ownerId);
    await this.deleteReservationsForMatches(tournament.matches.map((m) => m.id));
    // Cascade se encarga de teams/players/matches.
    await this.prisma.tournament.delete({ where: { id: tournamentId } });
    return { success: true };
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

  /**
   * Transacción interactiva para la generación de fixture (Fase 8.2): todos
   * los métodos de abajo aceptan un `client` opcional para participar de ella.
   * Timeout ampliado: un fixture grande con muchos hasOverlap puede superar
   * los 5 s del default de Prisma.
   */
  runInTransaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn, { timeout: 30_000, maxWait: 5_000 });
  }

  /**
   * Lock de fila sobre la cancha (SELECT ... FOR UPDATE en `venues`) — dos
   * generaciones de fixture concurrentes que evalúan la misma cancha se
   * serializan y la segunda ve las reservas que la primera acaba de crear.
   * Solo tiene sentido DENTRO de runInTransaction.
   */
  async lockVenueRow(venueId: string, tx: Prisma.TransactionClient): Promise<void> {
    await tx.$executeRaw`SELECT id FROM venues WHERE id = ${venueId}::uuid FOR UPDATE`;
  }

  async insertMatches(
    tournamentId: string,
    matches: DomainMatch[],
    client: Prisma.TransactionClient = this.prisma,
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
      const row = await client.tournamentMatch.create({
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

  async clearMatchSchedule(
    matchId: string,
    client: Prisma.TransactionClient = this.prisma,
  ): Promise<void> {
    await client.tournamentMatch.update({
      where: { id: matchId },
      data: { startsAt: null, endsAt: null, venueId: null },
    });
  }

  /** Cancha real asignada a ESTE partido (fija para private, sorteada para elite_forge). */
  async assignMatchVenue(
    matchId: string,
    venueId: string,
    client: Prisma.TransactionClient = this.prisma,
  ): Promise<void> {
    await client.tournamentMatch.update({
      where: { id: matchId },
      data: { venueId },
    });
  }

  async hasOverlap(
    venueId: string,
    startsAt: Date,
    endsAt: Date,
    client: Prisma.TransactionClient = this.prisma,
  ): Promise<boolean> {
    return this.venueRepository.hasOverlappingReservation(venueId, startsAt, endsAt, client);
  }

  /** Pool de canchas synthetic_grass para el sorteo de Copa Elite Forge. */
  listSyntheticVenues(
    client: Prisma.TransactionClient = this.prisma,
  ): Promise<{ id: string; name: string; ownerId: string }[]> {
    return this.venueRepository.listSyntheticGrassVenues(client);
  }

  /**
   * userId: a quién le pertenece la reserva a efectos de /admin/reservas — para
   * kind=private es el ownerId del torneo (== dueño de la cancha fija); para
   * kind=elite_forge es el ownerId REAL de la cancha sorteada, que casi nunca
   * coincide con el ownerId del torneo (el Administrador que lo creó). El
   * caller (TournamentsService) decide cuál pasar — este método no lo infiere.
   */
  async createReservationForMatch(
    params: {
      userId: string;
      venueId: string;
      venueName: string;
      matchId: string;
      startsAt: Date;
      endsAt: Date;
      notes: string;
    },
    client: Prisma.TransactionClient = this.prisma,
  ): Promise<void> {
    await client.reservation.create({
      data: {
        userId: params.userId,
        venueId: params.venueId,
        venueName: params.venueName,
        startsAt: params.startsAt,
        endsAt: params.endsAt,
        notes: params.notes,
        tournamentMatchId: params.matchId,
        status: 'confirmed',
        // Fase W.1: se marca explícitamente en vez de dejar el default 'app' —
        // el portal la muestra distinto (icono/etiqueta "Torneo") en el calendario.
        source: 'tournament',
      },
    });
  }

  async findVenueName(
    venueId: string,
    client: Prisma.TransactionClient = this.prisma,
  ): Promise<string> {
    const venue = await client.venue.findUniqueOrThrow({
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
      kind: row.kind,
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
      enrolledGroupId: row.enrolledGroupId,
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
      venueName: row.venue?.name ?? null,
    };
  }
}
