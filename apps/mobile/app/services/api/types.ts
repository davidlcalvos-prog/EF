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

export interface MatchParticipantApiDto {
  userId: string
  email: string
  name: string
  confirmedAt: string
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
  participants: MatchParticipantApiDto[]
  createdAt: string
  updatedAt: string
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
