import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ApplyGuestRequestPayload,
  DEFAULT_GUEST_REQUEST_RADIUS_KM,
  GetGuestRequestForMatchPayload,
  GuestApplicationActionPayload,
  GUEST_REQUEST_DEFAULT_TTL_HOURS,
  ListGuestApplicationsPayload,
  ListNearbyGuestRequestsPayload,
  MatchGuestApplicationDto,
  MatchGuestRequestActionPayload,
  MatchGuestRequestDto,
  OpenGuestRequestPayload,
  WithdrawGuestApplicationPayload,
} from '@ef/contracts';
import { GroupRepository } from '../../groups/repositories/group.repository';
import { NotificationsService } from '../../notifications/notifications.service';
import { UserProfileRepository } from '../../users/repositories/user-profile.repository';
import { MatchRepository } from '../repositories/match.repository';
import { MatchGuestRequestRepository } from './repositories/match-guest-request.repository';

type GroupRole = 'creator' | 'admin' | 'member';

@Injectable()
export class MatchGuestRequestsService {
  constructor(
    private readonly guestRequestRepository: MatchGuestRequestRepository,
    private readonly matchRepository: MatchRepository,
    private readonly groupRepository: GroupRepository,
    private readonly userProfileRepository: UserProfileRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  async open(payload: OpenGuestRequestPayload): Promise<MatchGuestRequestDto> {
    const { matchId, requesterId, requestedPosition, radiusKm } = payload;
    const match = await this.requireMatch(matchId);
    await this.requireLeader(match.originGroupId, requesterId);

    if (match.type !== 'internal') {
      throw new BadRequestException(
        'Guest requests are only available for internal matches',
      );
    }
    if (match.status !== 'scheduled') {
      throw new ConflictException(
        'The match must be scheduled to open a guest request',
      );
    }
    if (match.latitude == null || match.longitude == null) {
      throw new BadRequestException(
        'El partido necesita una sede para buscar comodín',
      );
    }

    const participantCount = await this.matchRepository.countParticipants(matchId);
    if (participantCount >= match.maxPlayers) {
      throw new ConflictException('This match already has a full roster');
    }

    const existingOpen = await this.guestRequestRepository.findOpenForMatch(matchId);
    if (existingOpen) {
      throw new ConflictException(
        'There is already an open guest request for this match',
      );
    }

    const expiresAt =
      match.scheduledAt ??
      new Date(Date.now() + GUEST_REQUEST_DEFAULT_TTL_HOURS * 60 * 60 * 1000);

    const created = await this.guestRequestRepository.create({
      matchId,
      requestedBy: requesterId,
      requestedPosition: requestedPosition ?? null,
      radiusKm: radiusKm ?? DEFAULT_GUEST_REQUEST_RADIUS_KM,
      expiresAt,
    });

    // Best-effort, síncrono (volumen chico): push a los candidatos del radio.
    await this.notifyNearby({
      requestId: created.id,
      matchLat: match.latitude,
      matchLng: match.longitude,
      originGroupId: match.originGroupId,
      requestedPosition: created.requestedPosition,
      radiusKm: created.radiusKm,
    });

    return this.guestRequestRepository.toDto(created, 0, 'none');
  }

  async cancel(payload: MatchGuestRequestActionPayload): Promise<{ success: true }> {
    const match = await this.requireMatch(payload.matchId);
    await this.requireLeader(match.originGroupId, payload.requesterId);

    const open = await this.guestRequestRepository.findOpenForMatch(payload.matchId);
    if (!open) {
      throw new NotFoundException('There is no open guest request for this match');
    }

    await this.guestRequestRepository.cancel(open.id);
    const rejectedUserIds = await this.guestRequestRepository.rejectOtherPendingApplications(
      open.id,
      null,
    );
    await Promise.all(
      rejectedUserIds.map((userId) =>
        this.notificationsService.sendToUser(
          userId,
          'Búsqueda de comodín cancelada',
          'La vacante para ese partido ya no está disponible.',
        ),
      ),
    );

    return { success: true };
  }

  async listNearby(payload: ListNearbyGuestRequestsPayload): Promise<MatchGuestRequestDto[]> {
    await this.guestRequestRepository.expireStale();

    const location = await this.userProfileRepository.findLocation(payload.userId);
    if (!location) {
      // Sin zona cargada no hay desde dónde medir el radio — [] y mobile
      // invita a cargarla (ya tiene el dato de sobra vía GET /users/:id).
      return [];
    }

    return this.guestRequestRepository.listNearby(
      payload.userId,
      location.latitude,
      location.longitude,
    );
  }

  async getForMatch(payload: GetGuestRequestForMatchPayload): Promise<MatchGuestRequestDto> {
    const match = await this.requireMatch(payload.matchId);
    await this.requireMembership(match.originGroupId, payload.requesterId);
    await this.guestRequestRepository.expireStale();

    const request = await this.guestRequestRepository.findLatestForMatch(payload.matchId);
    if (!request) {
      throw new NotFoundException('This match has no guest request');
    }

    const [applicationsCount, myStatus] = await Promise.all([
      this.guestRequestRepository.countApplications(request.id),
      this.guestRequestRepository.findMyApplicationStatus(request.id, payload.requesterId),
    ]);

    return this.guestRequestRepository.toDto(request, applicationsCount, myStatus ?? 'none');
  }

  async apply(payload: ApplyGuestRequestPayload): Promise<MatchGuestRequestDto> {
    const { requestId, userId } = payload;
    const request = await this.requireOpenRequest(requestId);

    if (request.status !== 'open') {
      throw new ConflictException('This guest request is no longer open');
    }
    if (new Date(request.expiresAt) < new Date()) {
      throw new ConflictException('This guest request has expired');
    }

    const membership = await this.groupRepository.findMembership(
      request.match.originGroupId,
      userId,
    );
    if (membership) {
      throw new ConflictException('You are already a member of this group');
    }

    const alreadyParticipant = await this.matchRepository.isParticipant(
      request.matchId,
      userId,
    );
    if (alreadyParticipant) {
      throw new ConflictException('You are already a participant of this match');
    }

    const existingApplication = await this.guestRequestRepository.findApplicationForUser(
      requestId,
      userId,
    );
    if (existingApplication && existingApplication.status !== 'withdrawn') {
      throw new ConflictException('You already applied to this guest request');
    }

    await this.guestRequestRepository.createApplication(requestId, userId);

    await this.notificationsService.sendToUser(
      request.requestedBy,
      'Nuevo postulante a comodín',
      'Alguien se postuló para tu vacante de comodín.',
      {
        type: 'match_guest_application',
        matchGuestRequestId: requestId,
        matchId: request.matchId,
      },
    );

    const [applicationsCount, myStatus] = await Promise.all([
      this.guestRequestRepository.countApplications(requestId),
      this.guestRequestRepository.findMyApplicationStatus(requestId, userId),
    ]);
    return this.guestRequestRepository.toDto(request, applicationsCount, myStatus ?? 'none');
  }

  async withdraw(payload: WithdrawGuestApplicationPayload): Promise<{ success: true }> {
    const application = await this.requireApplication(payload.applicationId);
    if (application.userId !== payload.userId) {
      throw new ForbiddenException('You can only withdraw your own application');
    }
    if (application.status !== 'pending') {
      throw new ConflictException('This application is not pending');
    }
    await this.guestRequestRepository.withdrawApplication(payload.applicationId);
    return { success: true };
  }

  async listApplications(
    payload: ListGuestApplicationsPayload,
  ): Promise<MatchGuestApplicationDto[]> {
    const request = await this.requireOpenRequest(payload.requestId);
    await this.requireLeader(request.match.originGroupId, payload.requesterId);
    return this.guestRequestRepository.listApplications(payload.requestId);
  }

  async accept(payload: GuestApplicationActionPayload): Promise<MatchGuestApplicationDto> {
    const application = await this.requireApplication(payload.applicationId);
    const request = await this.requireOpenRequest(application.requestId);
    await this.requireLeader(request.match.originGroupId, payload.requesterId);

    if (request.status !== 'open') {
      throw new ConflictException('This guest request is no longer open');
    }
    if (application.status !== 'pending') {
      throw new ConflictException('This application is not pending');
    }

    // Lock + chequeo de cupo reutilizados de la Fase 8.2 (ver repositorio) —
    // acá solo se decide QUÉ hacer con el resultado (avisos push).
    const rejectedUserIds = await this.guestRequestRepository.acceptApplication({
      applicationId: application.id,
      requestId: request.id,
      matchId: request.matchId,
      userId: application.userId,
      maxPlayers: request.match.maxPlayers,
    });

    await this.notificationsService.sendToUser(
      application.userId,
      '¡Fuiste aceptado como comodín!',
      'Ya sos parte del partido. Revisá los detalles en la app.',
      { type: 'match_guest_accepted', matchId: request.matchId },
    );
    await Promise.all(
      rejectedUserIds.map((userId) =>
        this.notificationsService.sendToUser(
          userId,
          'Vacante de comodín ocupada',
          'Otro jugador fue aceptado para esa vacante.',
        ),
      ),
    );

    return {
      id: application.id,
      status: 'accepted',
      user: application.user,
      createdAt: application.createdAt,
    };
  }

  async reject(payload: GuestApplicationActionPayload): Promise<{ success: true }> {
    const application = await this.requireApplication(payload.applicationId);
    const request = await this.requireOpenRequest(application.requestId);
    await this.requireLeader(request.match.originGroupId, payload.requesterId);

    if (application.status !== 'pending') {
      throw new ConflictException('This application is not pending');
    }

    await this.guestRequestRepository.rejectApplication(application.id);
    await this.notificationsService.sendToUser(
      application.userId,
      'Postulación rechazada',
      'Tu postulación como comodín no fue aceptada esta vez.',
    );

    return { success: true };
  }

  // ── Privados ─────────────────────────────────────────────────────────

  private async notifyNearby(params: {
    requestId: string;
    matchLat: number;
    matchLng: number;
    originGroupId: string;
    requestedPosition: string | null;
    radiusKm: number;
  }): Promise<void> {
    const candidateIds = await this.guestRequestRepository.findNotifyCandidates({
      matchLat: params.matchLat,
      matchLng: params.matchLng,
      radiusKm: params.radiusKm,
      originGroupId: params.originGroupId,
      requestedPosition: params.requestedPosition,
    });
    await Promise.all(
      candidateIds.map((userId) =>
        this.notificationsService.sendToUser(
          userId,
          'Se busca comodín cerca tuyo',
          'Un partido cerca de tu zona necesita un jugador más.',
          { type: 'match_guest_request', matchGuestRequestId: params.requestId },
        ),
      ),
    );
  }

  private isGroupLeader(role?: GroupRole): boolean {
    return role === 'creator' || role === 'admin';
  }

  private async requireMatch(matchId: string) {
    const match = await this.matchRepository.findCore(matchId);
    if (!match) {
      throw new NotFoundException(`Match ${matchId} not found`);
    }
    return match;
  }

  private async requireMembership(groupId: string, userId: string): Promise<GroupRole> {
    const membership = await this.groupRepository.findMembership(groupId, userId);
    if (!membership) {
      throw new ForbiddenException('You are not a member of this group');
    }
    return membership.role as GroupRole;
  }

  private async requireLeader(groupId: string, userId: string): Promise<void> {
    const role = await this.requireMembership(groupId, userId);
    if (!this.isGroupLeader(role)) {
      throw new ForbiddenException(
        'Only the creator or an admin of the group can do that',
      );
    }
  }

  private async requireOpenRequest(requestId: string) {
    const request = await this.guestRequestRepository.findById(requestId);
    if (!request) {
      throw new NotFoundException(`Guest request ${requestId} not found`);
    }
    return request;
  }

  private async requireApplication(applicationId: string) {
    const application = await this.guestRequestRepository.findApplicationById(applicationId);
    if (!application) {
      throw new NotFoundException(`Application ${applicationId} not found`);
    }
    return {
      id: application.id,
      requestId: application.requestId,
      userId: application.userId,
      status: application.status,
      createdAt: application.createdAt.toISOString(),
      user: {
        id: application.user.id,
        displayName: [application.user.firstname, application.user.lastname]
          .filter(Boolean)
          .join(' ')
          .trim(),
        alias: application.user.profile?.alias ?? null,
        favoritePosition: application.user.profile?.favoritePosition ?? null,
        avatarBase64: application.user.profile?.avatarBase64 ?? null,
      },
    };
  }
}
