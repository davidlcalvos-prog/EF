/**
 * Contrato del `data` de cada notificación push (Fase A, deep linking).
 *
 * El BACKEND declara a dónde va cada aviso (`screen` + `params`); la app no
 * adivina el destino a partir del `type`. Regla: agregar una notificación
 * nueva = un `sendToUser(..., { v: 1, type, screen, params })` más. Si el
 * destino es una pantalla que ya está en `PushScreen`, la app no cambia.
 *
 * Contraparte en mobile: apps/mobile/app/services/api/types.ts (`PushData`)
 * y utils/pushNavigation.ts (lista blanca de pantallas + despachador).
 * Documentación: docs/BACKEND.md → "Notificaciones push: contrato PushData".
 */

/** Versión del contrato de navegación. La app ignora versiones que no conoce. */
export const PUSH_DATA_VERSION = 1 as const;

/**
 * Identificador del evento (telemetría, compatibilidad y, en la Fase B, qué
 * contador de pendientes toca). NO define el destino: eso es `screen`.
 */
export type PushType =
  | 'friendship_request'
  | 'friendship_accepted'
  /** 2026-09-10, notificaciones por evento: partido creado en mi grupo, desafío VS al grupo rival, recordatorio 12 h / 3 h. */
  | 'match_created'
  | 'match_challenge'
  | 'match_reminder'
  /** 2026-09-11: invitación a grupo (el invitado acepta o rechaza en Grupos). */
  | 'group_invitation'
  | 'match_guest_request'
  | 'match_guest_application'
  | 'match_guest_accepted'
  | 'match_guest_slot_taken'
  | 'match_guest_rejected'
  | 'match_guest_request_cancelled'
  | 'vs_match_roster_alert'
  | 'reservation_status'
  | 'new_reservation';

/**
 * Pantallas a las que un push puede llevar. Es el nombre de ruta del AppStack
 * de mobile (navigationTypes.ts). La app valida `screen` contra su propia
 * lista blanca: un valor que no esté ahí no navega.
 */
export type PushScreen =
  | 'Feed'
  | 'Friends'
  /** 2026-09-11: "Mis grupos" con `params.initialSection = 'invitations'` (misma idea que Friends.initialTab). */
  | 'Groups'
  | 'MatchDetail'
  | 'NearbyGuestRequests'
  | 'ReservationDetail'
  | 'GroupDetail';

/**
 * Contadores de pendientes que un evento puede afectar (Fase B — indicadores
 * en el drawer). Se declara ya en el contrato para no cambiarlo dos veces; la
 * app de la Fase A lo ignora.
 */
export type PendingKind =
  | 'friendRequests'
  | 'groupFriendRequests'
  | 'matchChallenges'
  | 'guestApplications'
  /** 2026-09-11: invitaciones a grupo pendientes para mí. */
  | 'groupInvites';

/** `type` y no `interface` a propósito: así es asignable al `data: Record<string, unknown>` de expo-server-sdk. */
export type PushData = {
  v: typeof PUSH_DATA_VERSION;
  type: PushType;
  /** Sin `screen`: el aviso es informativo y el tap solo abre la app (p. ej. `new_reservation`, que es para el dueño en el portal web). */
  screen?: PushScreen;
  /** Params de esa ruta, con los nombres que espera navigationTypes.ts. Solo strings: viajan por FCM/APNs como JSON plano. */
  params?: Record<string, string>;
  pending?: PendingKind;
};
