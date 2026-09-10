import { Injectable } from '@nestjs/common';
import { PrismaService } from '@ef/database';
import { PendingCountsDto } from '@ef/contracts';

const LEADER_ROLES = ['creator', 'admin'] as const;

/**
 * Cuatro `count` de Prisma, nunca listas completas. Los predicados son los
 * MISMOS que autorizan la acción en cada servicio (aceptar amistad, responder
 * amistad de grupo, responder desafío, gestionar postulantes), así que el
 * punto en el drawer nunca cuenta algo que el usuario no pueda resolver.
 */
@Injectable()
export class PendingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async countForUser(userId: string): Promise<PendingCountsDto> {
    const leaderGroupIds = await this.findLeaderGroupIds(userId);

    const [friendRequests, groupFriendRequests, matchChallenges, guestApplications] =
      await Promise.all([
        // Solicitudes de amistad que ME mandaron y siguen pendientes.
        this.prisma.userFriendship.count({
          where: { addresseeId: userId, status: 'pending' },
        }),
        // Amistades entre grupos pendientes recibidas por un grupo que lidero
        // (el grupo receptor es el par que NO la pidió).
        leaderGroupIds.length === 0
          ? 0
          : this.prisma.groupFriendship.count({
              where: {
                status: 'pending',
                OR: [
                  { groupAId: { in: leaderGroupIds }, NOT: { requestedByGroupId: { in: leaderGroupIds } } },
                  { groupBId: { in: leaderGroupIds }, NOT: { requestedByGroupId: { in: leaderGroupIds } } },
                ],
              },
            }),
        // Partidos VS que desafiaron a un grupo que lidero y esperan respuesta.
        leaderGroupIds.length === 0
          ? 0
          : this.prisma.match.count({
              where: { status: 'pending_opponent', opponentGroupId: { in: leaderGroupIds } },
            }),
        // Postulaciones pendientes a vacantes de comodín que publiqué y siguen abiertas.
        this.prisma.matchGuestApplication.count({
          where: {
            status: 'pending',
            request: { requestedBy: userId, status: 'open' },
          },
        }),
      ]);

    return { friendRequests, groupFriendRequests, matchChallenges, guestApplications };
  }

  private async findLeaderGroupIds(userId: string): Promise<string[]> {
    const rows = await this.prisma.groupMembership.findMany({
      where: { userId, role: { in: [...LEADER_ROLES] } },
      select: { groupId: true },
    });
    return rows.map((row) => row.groupId);
  }
}
