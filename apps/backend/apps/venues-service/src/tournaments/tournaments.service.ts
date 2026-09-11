import { ConflictException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import {
  addExtraRoundMatches,
  AssignedTournamentMatchDto,
  DomainCourtSize,
  DomainMatch,
  ensureGroupIds,
  generateFixture,
  GenerateFixtureResultDto,
  maxPlayersPerTeam,
  TournamentCourtSizeDto,
  TournamentDto,
  TournamentMatchStatusDto,
  TournamentRankingsResponse,
  TournamentScheduleDto,
  TournamentTeamInputDto,
} from '@ef/contracts';
import { NotificationsService } from '../notifications/notifications.service';
import { TournamentRepository } from './repositories/tournament.repository';

/**
 * A3: tamaño de cada página de destinatarios. Con miles de jugadores, cada
 * página es UNA consulta de ids + una llamada a `sendToUsers` (que a su vez
 * hace una consulta de preferencias, una de tokens y lotes de 100 hacia Expo).
 * Nunca se cargan todos los usuarios en memoria a la vez.
 */
export const ANNOUNCE_PAGE_SIZE = 500;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

@Injectable()
export class TournamentsService {
  private readonly logger = new Logger(TournamentsService.name);

  constructor(
    private readonly tournamentRepository: TournamentRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  listMine(ownerId: string): Promise<TournamentDto[]> {
    return this.tournamentRepository.listMine(ownerId);
  }

  getMine(tournamentId: string, ownerId: string): Promise<TournamentDto> {
    return this.tournamentRepository.getOwned(tournamentId, ownerId);
  }

  create(
    ownerId: string,
    dto: {
      name: string;
      venueId: string;
      courtSize: TournamentCourtSizeDto;
      format: 'groups_of_4' | 'round_robin' | 'brackets';
      maxTeams: number;
      bracketKeys: number;
      schedule: TournamentScheduleDto;
    },
  ): Promise<TournamentDto> {
    return this.tournamentRepository.create(ownerId, { ...dto, kind: 'private' });
  }

  /**
   * Copa Elite Forge (Fase 7.2) — solo Administrador (gateway), sin cancha fija.
   * Nace en `registration` (default del modelo), así que se anuncia acá mismo.
   */
  async createEliteForge(
    ownerId: string,
    dto: {
      name: string;
      courtSize: TournamentCourtSizeDto;
      format: 'groups_of_4' | 'round_robin' | 'brackets';
      maxTeams: number;
      bracketKeys: number;
      schedule: TournamentScheduleDto;
    },
  ): Promise<TournamentDto> {
    const created = await this.tournamentRepository.create(ownerId, {
      ...dto,
      kind: 'elite_forge',
    });
    void this.announceIfOpen(created);
    return created;
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
    const updated = await this.tournamentRepository.update(tournamentId, ownerId, patch);
    // Solo cuando el patch lo pone en inscripción (draft → registration). Un
    // patch de nombre u horario sobre un torneo ya anunciado no llega ni al
    // claim, y si llegara, `announcedAt` ya no es null y no manda nada.
    if (patch.status === 'registration') void this.announceIfOpen(updated);
    return updated;
  }

  /**
   * A3 (2026-09-11): "Copa Elite Forge abrió inscripciones" a TODOS los
   * jugadores activos (rol Jugador). Se dispara cuando el torneo ENTRA en
   * `registration` — no al crear un borrador — y solo para kind=elite_forge.
   *
   * No bloquea la respuesta al administrador (`void` en los llamadores): con
   * miles de jugadores el envío tarda segundos. Es best-effort, como todo
   * push: si algo falla a mitad de camino queda en el log; `announcedAt` ya
   * está fijado, así que no se reintenta solo (evita duplicados, que para un
   * aviso masivo es el peor de los dos males).
   *
   * Escala: `claimAnnouncement` es un UPDATE condicional atómico (un solo
   * ganador aunque lleguen dos PATCH a la vez); los destinatarios se recorren
   * por páginas de `ANNOUNCE_PAGE_SIZE` ids por cursor, y cada página va a
   * `sendToUsers` (que respeta `user_preferences.notifications` y trocea de a
   * 100 hacia Expo). Nunca hay más de una página en memoria.
   */
  async announceIfOpen(tournament: TournamentDto): Promise<void> {
    if (tournament.kind !== 'elite_forge' || tournament.status !== 'registration') return;
    try {
      const claimed = await this.tournamentRepository.claimAnnouncement(tournament.id);
      if (!claimed) return;

      const data = {
        v: 1 as const,
        type: 'tournament_announced' as const,
        screen: 'TournamentDetail' as const,
        params: { tournamentId: tournament.id },
      };
      const title = 'Nueva Copa Elite Forge';
      const body = `"${tournament.name}" abrió inscripciones. Inscribí a tu grupo desde Torneos.`;

      let cursor: string | null = null;
      let pages = 0;
      let recipients = 0;
      for (;;) {
        const ids: string[] = await this.tournamentRepository.listActivePlayerIds(
          cursor,
          ANNOUNCE_PAGE_SIZE,
        );
        if (ids.length === 0) break;
        await this.notificationsService.sendToUsers(ids, title, body, data);
        pages++;
        recipients += ids.length;
        cursor = ids[ids.length - 1];
        if (ids.length < ANNOUNCE_PAGE_SIZE) break;
      }
      this.logger.log(
        `Copa "${tournament.name}" (${tournament.id}) anunciada a ${recipients} jugador(es) en ${pages} página(s)`,
      );
    } catch (error) {
      this.logger.error(
        `No se pudo anunciar la Copa ${tournament.id}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  delete(tournamentId: string, ownerId: string): Promise<{ success: true }> {
    return this.tournamentRepository.delete(tournamentId, ownerId);
  }

  async upsertTeams(
    tournamentId: string,
    ownerId: string,
    teams: TournamentTeamInputDto[],
  ): Promise<TournamentDto> {
    const tournament = await this.tournamentRepository.getOwned(tournamentId, ownerId);

    if (tournament.kind === 'elite_forge') {
      throw new ForbiddenException(
        'Elite Forge tournaments only accept enrollment via ENROLL_GROUP',
      );
    }

    if (teams.length > tournament.maxTeams) {
      throw new ConflictException(`This tournament allows at most ${tournament.maxTeams} teams`);
    }
    const cap = maxPlayersPerTeam(tournament.courtSize as DomainCourtSize);
    for (const team of teams) {
      if (team.players.length > cap) {
        throw new ConflictException(`Team "${team.name}" exceeds the ${cap}-player roster cap`);
      }
    }

    return this.tournamentRepository.upsertTeams(tournamentId, ownerId, teams);
  }

  async generateFixture(tournamentId: string, ownerId: string): Promise<GenerateFixtureResultDto> {
    const row = await this.tournamentRepository.requireOwned(tournamentId, ownerId);
    const domainTournament = this.tournamentRepository.toDomainTournament(row);

    let teams = domainTournament.teams;
    if (domainTournament.format === 'groups_of_4') {
      teams = ensureGroupIds(teams);
      await this.tournamentRepository.persistGroupIds(teams);
    }

    // Regenerar reemplaza el fixture anterior por completo (conserva equipos/jugadores).
    await this.tournamentRepository.deleteReservationsForMatches(
      domainTournament.matches.map((m) => m.id),
    );
    await this.tournamentRepository.deleteAllMatches(tournamentId);

    const generated = generateFixture({ ...domainTournament, teams, matches: [] });
    return this.persistGeneratedMatches(tournamentId, ownerId, generated, row.name, row.kind, row.venueId);
  }

  async addExtraRound(tournamentId: string, ownerId: string): Promise<GenerateFixtureResultDto> {
    const row = await this.tournamentRepository.requireOwned(tournamentId, ownerId);
    const domainTournament = this.tournamentRepository.toDomainTournament(row);

    if (!domainTournament.extraRoundEnabled) {
      await this.tournamentRepository.update(tournamentId, ownerId, { extraRoundEnabled: true });
    }

    const extended = addExtraRoundMatches({ ...domainTournament, extraRoundEnabled: true });
    const newMatches = extended.slice(domainTournament.matches.length);

    return this.persistGeneratedMatches(tournamentId, ownerId, newMatches, row.name, row.kind, row.venueId);
  }

  updateMatchResult(
    tournamentId: string,
    matchId: string,
    ownerId: string,
    patch: {
      status: TournamentMatchStatusDto;
      homeGoals?: number | null;
      awayGoals?: number | null;
      playerStats?: {
        playerId: string;
        teamId: string;
        goals: number;
        assists: number;
        goalsAgainst: number;
        dfr: number;
        yellowCards: number;
        redCards: number;
      }[];
    },
  ): Promise<TournamentDto> {
    return this.tournamentRepository.updateMatchResult(tournamentId, matchId, ownerId, patch);
  }

  // --- Copa Elite Forge (Fase 7.2): lado jugador ---

  listActiveForPlayer(): Promise<TournamentDto[]> {
    return this.tournamentRepository.listActiveForPlayer();
  }

  getPublic(tournamentId: string): Promise<TournamentDto> {
    return this.tournamentRepository.getPublic(tournamentId);
  }

  getRankings(tournamentId: string): Promise<TournamentRankingsResponse> {
    return this.tournamentRepository.getTournamentRankings(tournamentId);
  }

  /**
   * Solo el creator/admin del grupo puede inscribirlo, y solo mientras el
   * torneo está en 'registration'. isGoalkeeper se resuelve por
   * favoritePosition==='goalkeeper' — no se usa el fallback por stats del
   * randomizador de partidos internos (team-randomizer.ts): ese fallback
   * existe para cuando hace falta balancear un partido SIN preferencia
   * declarada, algo que no aplica acá (esto es un roster fijo, no un sorteo
   * de equipos) — usar solo la posición favorita es la lectura más simple y
   * correcta para este caso, evita traer PlayerStats sin necesidad real.
   */
  async enrollGroup(
    tournamentId: string,
    requesterId: string,
    groupId: string,
    playerUserIds: string[],
  ): Promise<TournamentDto> {
    const context = await this.tournamentRepository.getEnrollmentContext(tournamentId);
    if (!context) {
      throw new ConflictException(`Tournament ${tournamentId} not found`);
    }
    if (context.kind !== 'elite_forge') {
      throw new ForbiddenException('Only Elite Forge tournaments accept group enrollment');
    }
    if (context.status !== 'registration') {
      throw new ConflictException('This tournament is not open for registration');
    }

    const role = await this.tournamentRepository.findGroupLeaderRole(groupId, requesterId);
    if (role !== 'creator' && role !== 'admin') {
      throw new ForbiddenException('Only the creator or an admin of the group can enroll it');
    }

    const alreadyEnrolled = await this.tournamentRepository.isGroupEnrolled(tournamentId, groupId);
    if (alreadyEnrolled) {
      throw new ConflictException('This group is already enrolled in this tournament');
    }

    if (playerUserIds.length === 0) {
      throw new ConflictException('At least one player is required');
    }
    const cap = maxPlayersPerTeam(context.courtSize as DomainCourtSize);
    if (playerUserIds.length > cap) {
      throw new ConflictException(`Roster exceeds the ${cap}-player cap for this format`);
    }

    return this.tournamentRepository.enrollGroup(tournamentId, groupId, playerUserIds);
  }

  // --- Copa Elite Forge (Fase 7.2): lado dueño de cancha sintética ---

  listAssignedMatchesForVenueOwner(ownerId: string): Promise<AssignedTournamentMatchDto[]> {
    return this.tournamentRepository.listAssignedMatchesForVenueOwner(ownerId);
  }

  /**
   * Inserta los partidos generados y, para cada uno con horario asignado,
   * intenta reservar cancha real:
   * - kind='private': la cancha fija del torneo (comportamiento igual a la 7.1).
   * - kind='elite_forge': sorteo entre canchas synthetic_grass — se baraja el
   *   pool y se prueba una por una con hasOverlap hasta encontrar una libre.
   *   La Reservation se crea con userId = ownerId REAL de esa cancha (nunca el
   *   ownerId del torneo, que es el Administrador que lo creó — ver nota en
   *   TournamentRepository.createReservationForMatch, es el bug más fácil de
   *   cometer acá).
   * Si no hay cancha libre (o el pool está vacío), el partido queda sin
   * fecha/reserva — mismo camino que ya usa el algoritmo cuando se queda sin
   * slots — y se cuenta en unscheduledCount.
   */
  private async persistGeneratedMatches(
    tournamentId: string,
    ownerId: string,
    matches: DomainMatch[],
    tournamentName: string,
    kind: 'private' | 'elite_forge',
    fixedVenueId: string | null,
  ): Promise<GenerateFixtureResultDto> {
    // Todo el fixture (inserts + chequeos de solape + asignación de cancha +
    // reservas) corre en UNA transacción interactiva (Fase 8.2): si algo falla
    // a mitad del loop, no quedan partidos con cancha/reserva a medias. El
    // FOR UPDATE sobre la fila de la cancha serializa dos generaciones
    // concurrentes sobre la misma cancha — la segunda ve las reservas de la
    // primera al chequear solape. Para elite_forge se lockea cada cancha en el
    // momento en que se la evalúa, no todo el pool de entrada.
    const unscheduledCount = await this.tournamentRepository.runInTransaction(async (tx) => {
      const created = await this.tournamentRepository.insertMatches(tournamentId, matches, tx);

      const fixedVenueName =
        kind === 'private' && fixedVenueId
          ? await this.tournamentRepository.findVenueName(fixedVenueId, tx)
          : null;
      const syntheticPool =
        kind === 'elite_forge' ? await this.tournamentRepository.listSyntheticVenues(tx) : [];

      let unscheduled = 0;
      for (const match of created) {
        if (!match.startsAt || !match.endsAt) {
          unscheduled++;
          continue;
        }

        if (kind === 'private') {
          await this.tournamentRepository.lockVenueRow(fixedVenueId as string, tx);
          const overlaps = await this.tournamentRepository.hasOverlap(
            fixedVenueId as string,
            match.startsAt,
            match.endsAt,
            tx,
          );
          if (overlaps) {
            await this.tournamentRepository.clearMatchSchedule(match.id, tx);
            unscheduled++;
            continue;
          }
          await this.tournamentRepository.assignMatchVenue(match.id, fixedVenueId as string, tx);
          await this.tournamentRepository.createReservationForMatch(
            {
              userId: ownerId,
              venueId: fixedVenueId as string,
              venueName: fixedVenueName as string,
              matchId: match.id,
              startsAt: match.startsAt,
              endsAt: match.endsAt,
              notes: `${tournamentName} · Cancha ${match.courtNumber}`,
            },
            tx,
          );
          continue;
        }

        let assigned = false;
        for (const venue of shuffle(syntheticPool)) {
          await this.tournamentRepository.lockVenueRow(venue.id, tx);
          const overlaps = await this.tournamentRepository.hasOverlap(
            venue.id,
            match.startsAt,
            match.endsAt,
            tx,
          );
          if (overlaps) continue;

          await this.tournamentRepository.assignMatchVenue(match.id, venue.id, tx);
          await this.tournamentRepository.createReservationForMatch(
            {
              userId: venue.ownerId,
              venueId: venue.id,
              venueName: venue.name,
              matchId: match.id,
              startsAt: match.startsAt,
              endsAt: match.endsAt,
              notes: `Copa Elite Forge · ${tournamentName} · Cancha ${match.courtNumber}`,
            },
            tx,
          );
          assigned = true;
          break;
        }
        if (!assigned) {
          await this.tournamentRepository.clearMatchSchedule(match.id, tx);
          unscheduled++;
        }
      }

      return unscheduled;
    });

    // Fuera de la transacción a propósito — es solo la respuesta.
    const tournament = await this.tournamentRepository.getOwned(tournamentId, ownerId);
    return { tournament, unscheduledCount };
  }
}
