import type { PhysicalTestId, PlayerStats } from "@/data/mockPlayerProfile"
import type { PlayerPositionId } from "@/data/suggestPlayerPosition"

/**
 * These types indicate the shape of the data you expect to receive from your
 * API endpoint, assuming it's a JSON object like we have.
 */
export interface EpisodeItem {
  title: string
  pubDate: string
  link: string
  guid: string
  author: string
  thumbnail: string
  description: string
  content: string
  enclosure: {
    link: string
    type: string
    length: number
    duration: number
    rating: { scheme: string; value: string }
  }
  categories: string[]
}

export interface ApiFeedResponse {
  status: string
  feed: {
    url: string
    title: string
    link: string
    author: string
    description: string
    image: string
  }
  items: EpisodeItem[]
}

/**
 * The options used to configure apisauce.
 */
export interface ApiConfig {
  /**
   * The URL of the api.
   */
  url: string

  /**
   * Milliseconds before we timeout the request.
   */
  timeout: number
}

/** Respuesta de POST /api/auth/login y /api/auth/register (API Gateway). */
export interface AuthApiResponse {
  accessToken: string
  user: {
    id: string
    email: string
    name: string
  }
}

export interface AuthUser {
  id: string
  email: string
  name: string
}

/** Respuesta de GET /api/profile/stats — usada para reconstruir el perfil en un dispositivo nuevo. */
export interface ProfileStatsApiResponse {
  stats: (PlayerStats & { updatedAt: string }) | null
  latestTestResults: Partial<Record<PhysicalTestId, PhysicalTestResultApiDto>>
  latestPsychAssessment: PsychAssessmentApiDto | null
  favoritePosition: PlayerPositionId | null
}

/**
 * Ficha de OTRO usuario (compañero de grupo) — solo nombre, avatar, posición
 * y el radar de stats. Nada de psicológico ni tests crudos, a propósito.
 */
export interface PublicMemberProfileApiDto {
  userId: string
  name: string
  avatarBase64: string | null
  favoritePosition: PlayerPositionId | null
  stats: (PlayerStats & { updatedAt: string }) | null
}

export interface PhysicalTestResultApiDto {
  id: string
  testId: PhysicalTestId
  rawData: Record<string, unknown>
  score: number
  completedAt: string
}

export interface PsychAssessmentApiDto {
  id: string
  answers: number[]
  teamworkScore: number
  onFieldScore: number
  overallScore: number
  traits: Record<string, number>
  completedAt: string
}

/** Forma real de los datos del Feed — calcada de libs/contracts/src/feed/index.ts del backend. */
export type PostMediaType = "none" | "image" | "video"

export interface PostApiDto {
  id: string
  authorId: string
  authorName: string
  authorHandle: string
  content: string
  mediaType: PostMediaType
  mediaUrl: string | null
  likesCount: number
  commentsCount: number
  likedByMe: boolean
  createdAt: string
  updatedAt: string
}

export interface CommentApiDto {
  id: string
  postId: string
  authorId: string
  authorName: string
  authorHandle: string
  content: string
  createdAt: string
}

/** Forma real de los datos de Grupos — calcada de libs/contracts/src/groups/index.ts del backend. */
export type GroupMemberRoleApi = "creator" | "admin" | "member"

export interface GroupMemberApiDto {
  userId: string
  email: string
  name: string
  role: GroupMemberRoleApi
  joinedAt: string
}

export interface GroupSummaryApiDto {
  id: string
  name: string
  photoBase64: string | null
  creatorId: string
  role: GroupMemberRoleApi
  memberCount: number
  createdAt: string
}

export interface GroupDetailApiDto {
  id: string
  name: string
  photoBase64: string | null
  creatorId: string
  members: GroupMemberApiDto[]
  createdAt: string
  updatedAt: string
}

/** Forma real de los datos de Amistad entre grupos — calcada de libs/contracts/src/group-friendships/index.ts del backend. */
export type GroupFriendshipStatusApi = "pending" | "accepted"

export interface GroupFriendshipApiDto {
  id: string
  groupAId: string
  groupAName: string
  groupAPhotoBase64: string | null
  groupBId: string
  groupBName: string
  groupBPhotoBase64: string | null
  status: GroupFriendshipStatusApi
  requestedByGroupId: string
  createdAt: string
  updatedAt: string
}

/** Forma real de los datos de Amistad entre jugadores (Fase 10) — calcada de libs/contracts/src/user-friendships/index.ts del backend. */
export type UserFriendshipStatusApi = "pending" | "accepted"

export type UserFriendshipFilterApi = "accepted" | "pending_received" | "pending_sent"

export interface UserFriendshipApiDto {
  id: string
  status: UserFriendshipStatusApi
  /** true si el usuario autenticado fue quien envió la solicitud */
  requestedByMe: boolean
  /** el otro usuario */
  user: {
    id: string
    displayName: string
    alias: string | null
    favoritePosition: string | null
    avatarBase64: string | null
  }
  createdAt: string
}

export interface FriendshipStatusApiDto {
  status: "none" | "pending_sent" | "pending_received" | "accepted"
  friendshipId: string | null
}

/** Item de GET /groups/search — nunca incluye la lista de miembros. */
export interface GroupSearchResultApiDto {
  id: string
  name: string
  photoBase64: string | null
  memberCount: number
}

/** Forma real de los datos de Partidos — calcada de libs/contracts/src/matches/index.ts del backend. */
export type MatchTypeApi = "internal" | "vs"

export type MatchStatusApi = "draft" | "pending_opponent" | "scheduled" | "played" | "cancelled"

export type MatchTeamApi = "A" | "B"

/** Lado de un partido vs — distinto de MatchTeamApi (sorteo interno de la 6.5.4). */
export type MatchSideApi = "origin" | "opponent"

export interface MatchParticipantApiDto {
  userId: string
  email: string
  name: string
  confirmedAt: string
  team: MatchTeamApi | null
  /** solo en partidos vs; null en internal. */
  side: MatchSideApi | null
}

export interface MatchApiDto {
  id: string
  originGroupId: string
  originGroupName: string
  opponentGroupId: string | null
  opponentGroupName: string | null
  type: MatchTypeApi
  format: string
  maxPlayers: number
  status: MatchStatusApi
  scheduledAt: string | null
  createdBy: string
  reservationId: string | null
  /** En vs sin confirmar, el backend ya filtra: solo trae el lado propio del requester. */
  participants: MatchParticipantApiDto[]
  teamsRandomizedAt: string | null
  /** null hasta que ambos lados se llenan; solo vs, nunca vuelve a null. */
  rosterConfirmedAt: string | null
  originSideCount: number
  opponentSideCount: number
  /** = maxPlayers / 2, solo relevante en vs. */
  sideCapacity: number
  createdAt: string
  updatedAt: string
}

/** Calcado de libs/contracts/src/matches/index.ts PositionCategory — usado solo para traducir el `position` de un warning. */
export type PositionCategoryApi = "goalkeeper" | "defense" | "midfield" | "forward"

/** `message` es texto de depuración del backend en español — NO se muestra, el mobile traduce a partir de team+position. */
export interface TeamAssignmentWarningApiDto {
  team: MatchTeamApi
  position: PositionCategoryApi
  message: string
}

/** Item de GET /api/matches/mine y GET /api/matches/group/:groupId — sin nombres de grupo, solo ids. */
export interface MatchSummaryApiDto {
  id: string
  originGroupId: string
  opponentGroupId: string | null
  type: MatchTypeApi
  format: string
  maxPlayers: number
  status: MatchStatusApi
  scheduledAt: string | null
  participantCount: number
  createdAt: string
}

/** Forma real de los datos de Reservas — calcada de libs/contracts/src/venues/index.ts del backend. */
export type ReservationStatusApi = "pending" | "confirmed" | "cancelled"

export interface PublicVenueApiDto {
  id: string
  name: string
  address: string | null
  pricePerHourCents: number
  availability: Record<string, unknown>
}

export interface MyReservationApiDto {
  id: string
  userId: string
  venueId: string | null
  venueName: string
  startsAt: string
  endsAt: string
  status: ReservationStatusApi
  notes: string | null
  matchId: string | null
  createdAt: string
}

/**
 * Forma real de los Campeonatos Elite Forge (Fase 7.3) — calcada de
 * libs/contracts/src/tournaments/index.ts del backend. El backend devuelve el
 * mismo TournamentDto completo tanto en el listado (`GET tournaments/active`)
 * como en el detalle público (`GET tournaments/:id/public`) — no hay un
 * "summary" recortado, así que acá hay un solo tipo para ambos.
 */
export type TournamentCourtSizeApi = "6vs6" | "8vs8" | "11vs11"

export type TournamentFormatApi = "groups_of_4" | "round_robin" | "brackets"

export type TournamentStatusApi = "draft" | "registration" | "active" | "finished"

export type TournamentMatchStatusApi = "scheduled" | "played" | "walkover_home" | "walkover_away"

export type TournamentKindApi = "private" | "elite_forge"

export interface TournamentScheduleApiDto {
  weekdays: number[]
  startHour: number
  endHour: number
  matchDurationHours: number
  courtsPerSlot: number
}

export interface TournamentPlayerApiDto {
  id: string
  name: string
  isGoalkeeper: boolean
  goals: number
  goalsAgainst: number
  assists: number
  dfr: number
  yellowCards: number
  redCards: number
}

export interface TournamentTeamApiDto {
  id: string
  name: string
  players: TournamentPlayerApiDto[]
  wins: number
  draws: number
  losses: number
  lossesByW: number
  points: number
  goalsFor: number
  goalsAgainst: number
  /** Etiqueta de grupo del FIXTURE (ej. "GA") — no es un Group real. */
  groupId: string | null
  /** El Group real inscrito — usado para excluir grupos ya inscritos del flujo de inscripción. */
  enrolledGroupId: string | null
}

export interface TournamentMatchPlayerStatApiDto {
  playerId: string
  teamId: string
  goals: number
  assists: number
  goalsAgainst: number
  dfr: number
  yellowCards: number
  redCards: number
}

export interface TournamentMatchApiDto {
  id: string
  roundLabel: string
  keyIndex: number
  homeTeamId: string
  awayTeamId: string
  homeGoals: number | null
  awayGoals: number | null
  status: TournamentMatchStatusApi
  playerStats: TournamentMatchPlayerStatApiDto[]
  startsAt: string | null
  endsAt: string | null
  courtNumber: number
  /** Nombre de la cancha asignada al azar a este partido — null si aún no tiene. */
  venueName: string | null
}

/** Forma real de los Rankings de un campeonato (Fase 9) — calcada de libs/contracts/src/rankings/index.ts del backend. */
export interface RankingEntryApiDto {
  userId: string
  /** Profile.alias si existe; si no, nombre y apellido. */
  displayName: string
  favoritePosition: string | null
  /** El dato principal de esa tabla (goles, o goles recibidos por partido). */
  value: number
  /** Partidos jugados (del equipo del jugador en este torneo). */
  secondary?: number
}

export interface TournamentRankingsApiResponse {
  topScorers: RankingEntryApiDto[]
  bestGoalkeepers: RankingEntryApiDto[]
  /** value = recuperos de balón (dfr) en este torneo, secondary = partidos jugados. */
  bestDefenders: RankingEntryApiDto[]
  /** value = asistencias en este torneo, secondary = partidos jugados. */
  topAssisters: RankingEntryApiDto[]
}

export interface TournamentApiDto {
  id: string
  ownerId: string
  kind: TournamentKindApi
  venueId: string | null
  name: string
  courtSize: TournamentCourtSizeApi
  format: TournamentFormatApi
  maxTeams: number
  bracketKeys: number
  extraRoundEnabled: boolean
  status: TournamentStatusApi
  schedule: TournamentScheduleApiDto
  teams: TournamentTeamApiDto[]
  matches: TournamentMatchApiDto[]
  createdAt: string
  updatedAt: string
}
