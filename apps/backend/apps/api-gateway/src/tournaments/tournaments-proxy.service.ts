import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { MESSAGE_PATTERNS, SERVICE_NAMES, toHttpException } from '@ef/common';
import {
  CreateTournamentDto,
  GenerateFixtureResultDto,
  TournamentDto,
  UpdateTournamentDto,
  UpdateTournamentMatchResultDto,
  UpsertTournamentTeamsDto,
} from '@ef/contracts';

@Injectable()
export class TournamentsProxyService {
  constructor(
    @Inject(SERVICE_NAMES.VENUES) private readonly venuesClient: ClientProxy,
  ) {}

  listMine(ownerId: string): Promise<TournamentDto[]> {
    return this.send<TournamentDto[]>(MESSAGE_PATTERNS.TOURNAMENTS.LIST_MINE, { ownerId });
  }

  getMine(ownerId: string, tournamentId: string): Promise<TournamentDto> {
    return this.send<TournamentDto>(MESSAGE_PATTERNS.TOURNAMENTS.GET_MINE, {
      ownerId,
      tournamentId,
    });
  }

  create(ownerId: string, dto: CreateTournamentDto): Promise<TournamentDto> {
    return this.send<TournamentDto>(MESSAGE_PATTERNS.TOURNAMENTS.CREATE, { ownerId, ...dto });
  }

  update(
    ownerId: string,
    tournamentId: string,
    dto: UpdateTournamentDto,
  ): Promise<TournamentDto> {
    return this.send<TournamentDto>(MESSAGE_PATTERNS.TOURNAMENTS.UPDATE, {
      ownerId,
      tournamentId,
      ...dto,
    });
  }

  delete(ownerId: string, tournamentId: string): Promise<void> {
    return this.send<void>(MESSAGE_PATTERNS.TOURNAMENTS.DELETE, { ownerId, tournamentId });
  }

  upsertTeams(
    ownerId: string,
    tournamentId: string,
    dto: UpsertTournamentTeamsDto,
  ): Promise<TournamentDto> {
    return this.send<TournamentDto>(MESSAGE_PATTERNS.TOURNAMENTS.UPSERT_TEAMS, {
      ownerId,
      tournamentId,
      ...dto,
    });
  }

  generateFixture(ownerId: string, tournamentId: string): Promise<GenerateFixtureResultDto> {
    return this.send<GenerateFixtureResultDto>(MESSAGE_PATTERNS.TOURNAMENTS.GENERATE_FIXTURE, {
      ownerId,
      tournamentId,
    });
  }

  addExtraRound(ownerId: string, tournamentId: string): Promise<GenerateFixtureResultDto> {
    return this.send<GenerateFixtureResultDto>(MESSAGE_PATTERNS.TOURNAMENTS.ADD_EXTRA_ROUND, {
      ownerId,
      tournamentId,
    });
  }

  updateMatchResult(
    ownerId: string,
    tournamentId: string,
    matchId: string,
    dto: UpdateTournamentMatchResultDto,
  ): Promise<TournamentDto> {
    return this.send<TournamentDto>(MESSAGE_PATTERNS.TOURNAMENTS.UPDATE_MATCH_RESULT, {
      ownerId,
      tournamentId,
      matchId,
      ...dto,
    });
  }

  private send<T>(pattern: string, payload: unknown): Promise<T> {
    return firstValueFrom(
      this.venuesClient.send<T>(pattern, payload).pipe(
        catchError((error: unknown) => throwError(() => toHttpException(error))),
      ),
    );
  }
}
