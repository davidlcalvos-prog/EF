import { ConflictException, Injectable } from '@nestjs/common';
import {
  addExtraRoundMatches,
  DomainCourtSize,
  DomainMatch,
  ensureGroupIds,
  generateFixture,
  GenerateFixtureResultDto,
  maxPlayersPerTeam,
  TournamentCourtSizeDto,
  TournamentDto,
  TournamentMatchStatusDto,
  TournamentScheduleDto,
  TournamentTeamInputDto,
} from '@ef/contracts';
import { TournamentRepository } from './repositories/tournament.repository';

@Injectable()
export class TournamentsService {
  constructor(private readonly tournamentRepository: TournamentRepository) {}

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
    return this.tournamentRepository.create(ownerId, dto);
  }

  update(
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
    return this.tournamentRepository.update(tournamentId, ownerId, patch);
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
    return this.persistGeneratedMatches(tournamentId, row.venueId, ownerId, generated, row.name);
  }

  async addExtraRound(tournamentId: string, ownerId: string): Promise<GenerateFixtureResultDto> {
    const row = await this.tournamentRepository.requireOwned(tournamentId, ownerId);
    const domainTournament = this.tournamentRepository.toDomainTournament(row);

    if (!domainTournament.extraRoundEnabled) {
      await this.tournamentRepository.update(tournamentId, ownerId, { extraRoundEnabled: true });
    }

    const extended = addExtraRoundMatches({ ...domainTournament, extraRoundEnabled: true });
    const newMatches = extended.slice(domainTournament.matches.length);

    return this.persistGeneratedMatches(tournamentId, row.venueId, ownerId, newMatches, row.name);
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

  /**
   * Inserta los partidos generados y, para cada uno con horario asignado,
   * intenta reservar la cancha real. Si hay choque (con otra reserva ya
   * existente, de cualquier origen), el partido queda sin fecha/reserva —
   * mismo camino que ya usa el algoritmo cuando se queda sin slots.
   */
  private async persistGeneratedMatches(
    tournamentId: string,
    venueId: string,
    ownerId: string,
    matches: DomainMatch[],
    tournamentName: string,
  ): Promise<GenerateFixtureResultDto> {
    const venueName = await this.tournamentRepository.findVenueName(venueId);
    const created = await this.tournamentRepository.insertMatches(tournamentId, matches);

    let unscheduledCount = 0;
    for (const match of created) {
      if (!match.startsAt || !match.endsAt) {
        unscheduledCount++;
        continue;
      }
      const overlaps = await this.tournamentRepository.hasOverlap(
        venueId,
        match.startsAt,
        match.endsAt,
      );
      if (overlaps) {
        await this.tournamentRepository.clearMatchSchedule(match.id);
        unscheduledCount++;
        continue;
      }
      await this.tournamentRepository.createReservationForMatch({
        ownerId,
        venueId,
        venueName,
        matchId: match.id,
        startsAt: match.startsAt,
        endsAt: match.endsAt,
        notes: `${tournamentName} · Cancha ${match.courtNumber}`,
      });
    }

    const tournament = await this.tournamentRepository.getOwned(tournamentId, ownerId);
    return { tournament, unscheduledCount };
  }
}
