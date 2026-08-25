import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MESSAGE_PATTERNS } from '@ef/common';
import {
  CreateEliteForgeTournamentPayload,
  CreateTournamentPayload,
  EnrollGroupPayload,
  GetPublicTournamentDto,
  ListTournamentsMinePayload,
  OwnerPayload,
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

  @MessagePattern(MESSAGE_PATTERNS.TOURNAMENTS.CREATE_ELITE_FORGE)
  createEliteForge(@Payload() data: CreateEliteForgeTournamentPayload) {
    const { ownerId, ...dto } = data;
    return this.tournamentsService.createEliteForge(ownerId, dto);
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

  // --- Copa Elite Forge (Fase 7.2): lado jugador ---

  @MessagePattern(MESSAGE_PATTERNS.TOURNAMENTS.LIST_ACTIVE_FOR_PLAYER)
  listActiveForPlayer() {
    return this.tournamentsService.listActiveForPlayer();
  }

  @MessagePattern(MESSAGE_PATTERNS.TOURNAMENTS.GET_PUBLIC)
  getPublic(@Payload() data: GetPublicTournamentDto) {
    return this.tournamentsService.getPublic(data.tournamentId);
  }

  @MessagePattern(MESSAGE_PATTERNS.TOURNAMENTS.GET_RANKINGS)
  getRankings(@Payload() data: GetPublicTournamentDto) {
    return this.tournamentsService.getRankings(data.tournamentId);
  }

  @MessagePattern(MESSAGE_PATTERNS.TOURNAMENTS.ENROLL_GROUP)
  enrollGroup(@Payload() data: EnrollGroupPayload) {
    return this.tournamentsService.enrollGroup(
      data.tournamentId,
      data.requesterId,
      data.groupId,
      data.playerUserIds,
    );
  }

  // --- Copa Elite Forge (Fase 7.2): lado dueño de cancha sintética ---

  @MessagePattern(MESSAGE_PATTERNS.TOURNAMENTS.LIST_ASSIGNED_MATCHES_FOR_VENUE_OWNER)
  listAssignedMatchesForVenueOwner(@Payload() data: OwnerPayload) {
    return this.tournamentsService.listAssignedMatchesForVenueOwner(data.ownerId);
  }
}
