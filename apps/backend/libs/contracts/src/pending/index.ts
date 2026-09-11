import { IsUUID } from 'class-validator';
import type { PendingKind } from '../push';

/**
 * Conteo de pendientes del usuario (Fase B, indicadores en el drawer).
 * `GET /api/me/pending`. Las claves son EXACTAMENTE `PendingKind` del
 * contrato PushData: un push con `pending: 'friendRequests'` toca la misma
 * clave que devuelve este endpoint.
 *
 * Solo cuentan estados que esperan una acción del usuario. Los eventos
 * informativos (solicitud aceptada, comodín aceptado, reserva confirmada…)
 * no cuentan. Las reservas `pending` son del dueño de cancha (portal web) y
 * quedan fuera.
 *
 * Agregar un contador nuevo = una clave más en `PendingKind`, un `count` más
 * en `PendingRepository` y la entrada en `PENDING_KINDS`; la app suma claves
 * nuevas sin cambiar el mecanismo (ver FRONTEND.md).
 */
export type PendingCountsDto = Record<PendingKind, number>;

export const PENDING_KINDS: readonly PendingKind[] = [
  'friendRequests',
  'groupFriendRequests',
  'matchChallenges',
  'guestApplications',
  'groupInvites',
] as const;

export class GetPendingCountsPayload {
  @IsUUID()
  userId!: string;
}
