import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MESSAGE_PATTERNS } from '@ef/common';
import {
  CreateTournamentPayload,
  ListTournamentsMinePayload,
  TournamentIdPayload,
  UpdateTournamentMatchResultPayload,
  UpdateTournamentPayload,
  UpsertTournamentTeamsPayload,
} from '@ef/contracts';
import { TournamentsService } from './tournaments.service';

@Controller()
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @MessagePattern(MESSAGE_PATTERNS.TOURNAMENTS.LIST_MINE)
  listMine(@Payload() data: ListTournamentsMinePayload) {
    return this.tournamentsService.listMine(data.ownerId);
  }

  @MessagePattern(MESSAGE_PATTERNS.TOURNAMENTS.GET_MINE)
  getMine(@Payload() data: TournamentIdPayload) {
    return this.tournamentsService.getMine(data.tournamentId, data.ownerId);
  }

  @MessagePattern(MESSAGE_PATTERNS.TOURNAMENTS.CREATE)
  create(@Payload() data: CreateTournamentPayload) {
    const { ownerId, ...dto } = data;
    return this.tournamentsService.create(ownerId, dto);
  }

  @MessagePattern(MESSAGE_PATTERNS.TOURNAMENTS.UPDATE)
  update(@Payload() data: UpdateTournamentPayload) {
    const { tournamentId, ownerId, ...patch } = data;
    return this.tournamentsService.update(tournamentId, ownerId, patch);
  }

  @MessagePattern(MESSAGE_PATTERNS.TOURNAMENTS.DELETE)
  delete(@Payload() data: TournamentIdPayload) {
    return this.tournamentsService.delete(data.tournamentId, data.ownerId);
  }

  @MessagePattern(MESSAGE_PATTERNS.TOURNAMENTS.UPSERT_TEAMS)
  upsertTeams(@Payload() data: UpsertTournamentTeamsPayload) {
    return this.tournamentsService.upsertTeams(data.tournamentId, data.ownerId, data.teams);
  }

  @MessagePattern(MESSAGE_PATTERNS.TOURNAMENTS.GENERATE_FIXTURE)
  generateFixture(@Payload() data: TournamentIdPayload) {
    return this.tournamentsService.generateFixture(data.tournamentId, data.ownerId);
  }

  @MessagePattern(MESSAGE_PATTERNS.TOURNAMENTS.ADD_EXTRA_ROUND)
  addExtraRound(@Payload() data: TournamentIdPayload) {
    return this.tournamentsService.addExtraRound(data.tournamentId, data.ownerId);
  }

  @MessagePattern(MESSAGE_PATTERNS.TOURNAMENTS.UPDATE_MATCH_RESULT)
  updateMatchResult(@Payload() data: UpdateTournamentMatchResultPayload) {
    const { tournamentId, matchId, ownerId, ...patch } = data;
    return this.tournamentsService.updateMatchResult(tournamentId, matchId, ownerId, patch);
  }
}
