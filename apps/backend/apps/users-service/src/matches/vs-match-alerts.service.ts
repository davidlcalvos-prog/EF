import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificationsService } from '../notifications/notifications.service';
import { GroupRepository } from '../groups/repositories/group.repository';
import {
  AlertFlagField,
  MatchRepository,
  VsMatchAlertCandidate,
} from './repositories/match.repository';

interface AlertThreshold {
  minutes: number;
  field: AlertFlagField;
  urgent: boolean;
}

/** Umbrales en orden ascendente — importa para no saltarse uno si el cron
 * estuvo caído: se evalúan todos los que ya se cruzaron en cada corrida. */
const ALERT_THRESHOLDS: AlertThreshold[] = [
  { minutes: 30, field: 'alertSent30m', urgent: true },
  { minutes: 60, field: 'alertSent1h', urgent: false },
  { minutes: 180, field: 'alertSent3h', urgent: false },
  { minutes: 360, field: 'alertSent6h', urgent: false },
];

@Injectable()
export class VsMatchAlertsService {
  private readonly logger = new Logger(VsMatchAlertsService.name);

  constructor(
    private readonly matchRepository: MatchRepository,
    private readonly groupRepository: GroupRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron('*/5 * * * *')
  async checkIncompleteRosters(): Promise<void> {
    const candidates = await this.matchRepository.findVsMatchesNeedingAlertCheck();
    for (const match of candidates) {
      await this.evaluateMatch(match);
    }
  }

  private async evaluateMatch(match: VsMatchAlertCandidate): Promise<void> {
    const minutesUntilKickoff = (match.scheduledAt.getTime() - Date.now()) / 60_000;

    for (const threshold of ALERT_THRESHOLDS) {
      if (minutesUntilKickoff > threshold.minutes) continue; // todavía no se cruzó
      if (match[threshold.field]) continue; // ya se mandó este umbral

      const originIncomplete = match.originSideCount < match.sideCapacity;
      const opponentIncomplete = match.opponentSideCount < match.sideCapacity;
      if (!originIncomplete && !opponentIncomplete) continue; // se completó justo antes de esta corrida

      // Marca el flag antes de mandar nada más de este partido, para que un
      // cron posterior (o el resto de este mismo loop) no lo repita.
      await this.matchRepository.markAlertSent(match.id, threshold.field);

      if (originIncomplete) {
        await this.notifyGroupLeaders(match.originGroupId, match.id, threshold.urgent);
      }
      if (opponentIncomplete) {
        await this.notifyGroupLeaders(match.opponentGroupId, match.id, threshold.urgent);
      }
    }
  }

  private async notifyGroupLeaders(
    groupId: string,
    matchId: string,
    urgent: boolean,
  ): Promise<void> {
    const leaderIds = await this.groupRepository.findLeaderUserIds(groupId);
    const title = urgent ? '¡Faltan 30 minutos!' : 'Cupo incompleto';
    const body = urgent
      ? 'Tu grupo todavía no completó el cupo para el partido VS. Podés cancelarlo si no llega a tiempo.'
      : 'Tu grupo todavía no completó el cupo para el próximo partido VS.';

    await Promise.all(
      leaderIds.map((userId) =>
        this.notificationsService
          .sendToUser(userId, title, body, { matchId })
          .catch((error) =>
            this.logger.error(`Failed to notify user ${userId} for match ${matchId}: ${String(error)}`),
          ),
      ),
    );
  }
}
