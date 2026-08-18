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
