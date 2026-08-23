/**
 * This Api class lets you define an API endpoint and methods to request
 * data and process it.
 *
 * See the [Backend API Integration](https://docs.infinite.red/ignite-cli/boilerplate/app/services/#backend-api-integration)
 * documentation for more details.
 */
import { ApiResponse, ApisauceInstance, create } from "apisauce"

import Config from "@/config"
import type { PhysicalTestId } from "@/data/mockPlayerProfile"
import type { PlayerPositionId } from "@/data/suggestPlayerPosition"
import type {
  AuthApiResponse,
  CommentApiDto,
  EpisodeItem,
  ApiConfig,
  ApiFeedResponse,
  GroupDetailApiDto,
  GroupFriendshipApiDto,
  GroupSearchResultApiDto,
  GroupSummaryApiDto,
  MatchApiDto,
  MatchSummaryApiDto,
  MatchTypeApi,
  MyReservationApiDto,
  TeamAssignmentWarningApiDto,
  PostApiDto,
  PostMediaType,
  ProfileStatsApiResponse,
  PublicMemberProfileApiDto,
  PublicVenueApiDto,
} from "@/services/api/types"

import { GeneralApiProblem, getGeneralApiProblem } from "./apiProblem"

export type {
  AuthApiResponse,
  AuthUser,
  ProfileStatsApiResponse,
  PhysicalTestResultApiDto,
  PsychAssessmentApiDto,
  PostApiDto,
  CommentApiDto,
  PostMediaType,
  GroupMemberRoleApi,
  GroupMemberApiDto,
  GroupSummaryApiDto,
  GroupDetailApiDto,
  GroupFriendshipStatusApi,
  GroupFriendshipApiDto,
  GroupSearchResultApiDto,
} from "./types"
export type {
  MatchTypeApi,
  MatchStatusApi,
  MatchTeamApi,
  MatchSideApi,
  MatchParticipantApiDto,
  MatchApiDto,
  MatchSummaryApiDto,
  PositionCategoryApi,
  TeamAssignmentWarningApiDto,
  ReservationStatusApi,
  PublicVenueApiDto,
  MyReservationApiDto,
  PublicMemberProfileApiDto,
} from "./types"

/**
 * Configuring the apisauce instance.
 */
export const DEFAULT_API_CONFIG: ApiConfig = {
  url: Config.API_URL,
  timeout: 10000,
}

/**
 * Manages all requests to the API. You can use this class to build out
 * various requests that you need to call from your backend API.
 */
export class Api {
  apisauce: ApisauceInstance
  config: ApiConfig

  /**
   * Set up our API instance. Keep this lightweight!
   */
  constructor(config: ApiConfig = DEFAULT_API_CONFIG) {
    this.config = config
    this.apisauce = create({
      baseURL: this.config.url,
      timeout: this.config.timeout,
      headers: {
        Accept: "application/json",
      },
    })
  }

  /**
   * Authenticates a user via the API Gateway (proxies auth-service).
   */
  async login(
    email: string,
    password: string,
  ): Promise<
    { kind: "ok"; accessToken: string; user: AuthApiResponse["user"] } | GeneralApiProblem
  > {
    const response = await this.apisauce.post<AuthApiResponse>("auth/login", {
      email,
      password,
    })

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "unknown", temporary: true }
    }

    const data = response.data
    if (!data?.accessToken || !data?.user) {
      return { kind: "bad-data" }
    }

    return {
      kind: "ok",
      accessToken: data.accessToken,
      user: data.user,
    }
  }

  /**
   * Adjunta (o quita) el Bearer token usado por los endpoints autenticados
   * (`/api/profile/*`, etc). Debe llamarse cada vez que `authToken` cambia
   * (login, logout, hidratación inicial desde MMKV) — ver `AuthContext`.
   */
  setAuthToken(token?: string) {
    if (token) {
      this.apisauce.setHeader("Authorization", `Bearer ${token}`)
    } else {
      this.apisauce.deleteHeader("Authorization")
    }
  }

  /**
   * Perfil "rico" del jugador (stats, tests físicos, evaluación psicológica,
   * posición favorita) — usado para reconstruir el perfil en un dispositivo nuevo.
   */
  async getProfileStats(): Promise<
    { kind: "ok"; data: ProfileStatsApiResponse } | GeneralApiProblem
  > {
    const response = await this.apisauce.get<ProfileStatsApiResponse>("profile/stats")

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "unknown", temporary: true }
    }

    if (!response.data) return { kind: "bad-data" }
    return { kind: "ok", data: response.data }
  }

  /**
   * Guarda un resultado de test físico en el backend. 409 si el servidor
   * ya tiene un resultado de ese test en el mes calendario en curso.
   */
  async savePhysicalTestResult(
    testId: PhysicalTestId,
    rawData: Record<string, unknown>,
    score: number,
  ): Promise<{ kind: "ok" } | GeneralApiProblem> {
    const response = await this.apisauce.put(`profile/physical-tests/${testId}`, {
      rawData,
      score,
    })

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "unknown", temporary: true }
    }
    return { kind: "ok" }
  }

  /**
   * Guarda el resultado del test psicológico en el backend. 409 si el
   * servidor ya tiene una evaluación en el mes calendario en curso.
   */
  async savePsychAssessment(payload: {
    answers: number[]
    teamworkScore: number
    onFieldScore: number
    overallScore: number
    traits: Record<string, number>
  }): Promise<{ kind: "ok" } | GeneralApiProblem> {
    const response = await this.apisauce.put("profile/psych-assessment", payload)

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "unknown", temporary: true }
    }
    return { kind: "ok" }
  }

  /** Actualiza la posición favorita del jugador. */
  async updateFavoritePosition(
    favoritePosition: PlayerPositionId | null,
  ): Promise<{ kind: "ok" } | GeneralApiProblem> {
    const response = await this.apisauce.patch("profile", { favoritePosition })

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "unknown", temporary: true }
    }
    return { kind: "ok" }
  }

  /** Sube el avatar de perfil en base64 (400 si supera el límite de tamaño). */
  async updateProfileAvatar(avatarBase64: string): Promise<{ kind: "ok" } | GeneralApiProblem> {
    const response = await this.apisauce.patch("profile", { avatarBase64 })

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "unknown", temporary: true }
    }
    return { kind: "ok" }
  }

  /**
   * Ficha pública de un compañero de grupo. 403 si no comparten ningún
   * grupo (validado server-side), 404 si el usuario no existe.
   */
  async getPublicMemberProfile(
    userId: string,
  ): Promise<{ kind: "ok"; profile: PublicMemberProfileApiDto } | GeneralApiProblem> {
    const response = await this.apisauce.get<PublicMemberProfileApiDto>(`profile/stats/${userId}`)

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "unknown", temporary: true }
    }
    if (!response.data) return { kind: "bad-data" }
    return { kind: "ok", profile: response.data }
  }

  /** Feed global paginado, más reciente primero. */
  async listFeedPosts(
    page: number,
    pageSize: number,
  ): Promise<{ kind: "ok"; posts: PostApiDto[] } | GeneralApiProblem> {
    const response = await this.apisauce.get<PostApiDto[]>("feed/posts", { page, pageSize })

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "unknown", temporary: true }
    }
    if (!response.data) return { kind: "bad-data" }
    return { kind: "ok", posts: response.data }
  }

  /** Publica un post nuevo. mediaUrl requiere mediaType != 'none' (validado en el backend). */
  async createFeedPost(
    content: string,
    mediaType?: PostMediaType,
    mediaUrl?: string,
  ): Promise<{ kind: "ok"; post: PostApiDto } | GeneralApiProblem> {
    const response = await this.apisauce.post<PostApiDto>("feed/posts", {
      content,
      mediaType,
      mediaUrl,
    })

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "unknown", temporary: true }
    }
    if (!response.data) return { kind: "bad-data" }
    return { kind: "ok", post: response.data }
  }

  /** Borra un post propio (403 si no es el autor). */
  async deleteFeedPost(postId: string): Promise<{ kind: "ok" } | GeneralApiProblem> {
    const response = await this.apisauce.delete(`feed/posts/${postId}`)

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "unknown", temporary: true }
    }
    return { kind: "ok" }
  }

  /** Alterna like/unlike de un post. Devuelve el post actualizado (likesCount/likedByMe). */
  async toggleFeedLike(
    postId: string,
  ): Promise<{ kind: "ok"; post: PostApiDto } | GeneralApiProblem> {
    const response = await this.apisauce.post<PostApiDto>(`feed/posts/${postId}/like`)

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "unknown", temporary: true }
    }
    if (!response.data) return { kind: "bad-data" }
    return { kind: "ok", post: response.data }
  }

  /** Comentarios de un post, paginados, más reciente primero. */
  async listFeedComments(
    postId: string,
    page: number,
    pageSize: number,
  ): Promise<{ kind: "ok"; comments: CommentApiDto[] } | GeneralApiProblem> {
    const response = await this.apisauce.get<CommentApiDto[]>(`feed/posts/${postId}/comments`, {
      page,
      pageSize,
    })

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "unknown", temporary: true }
    }
    if (!response.data) return { kind: "bad-data" }
    return { kind: "ok", comments: response.data }
  }

  /** Comenta en cualquier post (propio o ajeno). */
  async createFeedComment(
    postId: string,
    content: string,
  ): Promise<{ kind: "ok"; comment: CommentApiDto } | GeneralApiProblem> {
    const response = await this.apisauce.post<CommentApiDto>(`feed/posts/${postId}/comments`, {
      content,
    })

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "unknown", temporary: true }
    }
    if (!response.data) return { kind: "bad-data" }
    return { kind: "ok", comment: response.data }
  }

  /** Borra un comentario — permitido para el autor del comentario o el autor del post (403 si no). */
  async deleteFeedComment(commentId: string): Promise<{ kind: "ok" } | GeneralApiProblem> {
    const response = await this.apisauce.delete(`feed/comments/${commentId}`)

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "unknown", temporary: true }
    }
    return { kind: "ok" }
  }

  /** Grupos del usuario autenticado, con su rol en cada uno. */
  async listMyGroups(): Promise<{ kind: "ok"; groups: GroupSummaryApiDto[] } | GeneralApiProblem> {
    const response = await this.apisauce.get<GroupSummaryApiDto[]>("groups/mine")

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "unknown", temporary: true }
    }
    if (!response.data) return { kind: "bad-data" }
    return { kind: "ok", groups: response.data }
  }

  /** Crea un grupo nuevo — el usuario autenticado queda como creador. */
  async createGroup(
    name: string,
  ): Promise<{ kind: "ok"; group: GroupDetailApiDto } | GeneralApiProblem> {
    const response = await this.apisauce.post<GroupDetailApiDto>("groups", { name })

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "unknown", temporary: true }
    }
    if (!response.data) return { kind: "bad-data" }
    return { kind: "ok", group: response.data }
  }

  /** Detalle de un grupo (miembros incluidos). 403 si el usuario no es miembro. */
  async getGroupDetail(
    groupId: string,
  ): Promise<{ kind: "ok"; group: GroupDetailApiDto } | GeneralApiProblem> {
    const response = await this.apisauce.get<GroupDetailApiDto>(`groups/${groupId}`)

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "unknown", temporary: true }
    }
    if (!response.data) return { kind: "bad-data" }
    return { kind: "ok", group: response.data }
  }

  /**
   * Renombra el grupo y/o cambia su foto — solo el creator (403 si no).
   * 400 si el nombre no cumple longitud o la foto supera el límite de tamaño.
   */
  async updateGroup(
    groupId: string,
    payload: { name: string; photoBase64?: string; removePhoto?: boolean },
  ): Promise<{ kind: "ok"; group: GroupDetailApiDto } | GeneralApiProblem> {
    const response = await this.apisauce.patch<GroupDetailApiDto>(`groups/${groupId}`, payload)

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "unknown", temporary: true }
    }
    if (!response.data) return { kind: "bad-data" }
    return { kind: "ok", group: response.data }
  }

  /**
   * Agrega un miembro por userId o email (uno de los dos). Solo creator/admin
   * pueden hacerlo (403 si no) — validado server-side.
   */
  async addGroupMember(
    groupId: string,
    identifier: { userId?: string; email?: string },
  ): Promise<{ kind: "ok"; group: GroupDetailApiDto } | GeneralApiProblem> {
    const response = await this.apisauce.post<GroupDetailApiDto>(
      `groups/${groupId}/members`,
      identifier,
    )

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "unknown", temporary: true }
    }
    if (!response.data) return { kind: "bad-data" }
    return { kind: "ok", group: response.data }
  }

  /** Solo el creador puede cambiar roles. Máximo 2 admins por grupo (409 si ya hay 2). */
  async updateGroupMemberRole(
    groupId: string,
    targetUserId: string,
    role: "admin" | "member",
  ): Promise<{ kind: "ok"; group: GroupDetailApiDto } | GeneralApiProblem> {
    const response = await this.apisauce.patch<GroupDetailApiDto>(
      `groups/${groupId}/members/${targetUserId}/role`,
      { role },
    )

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "unknown", temporary: true }
    }
    if (!response.data) return { kind: "bad-data" }
    return { kind: "ok", group: response.data }
  }

  /** Mismo endpoint sirve para "salir del grupo" (targetUserId = el propio) y remover a otro. */
  async removeGroupMember(
    groupId: string,
    targetUserId: string,
  ): Promise<{ kind: "ok" } | GeneralApiProblem> {
    const response = await this.apisauce.delete(`groups/${groupId}/members/${targetUserId}`)

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "unknown", temporary: true }
    }
    return { kind: "ok" }
  }

  /** Solo el creador puede eliminar el grupo (403 si no). */
  async deleteGroup(groupId: string): Promise<{ kind: "ok" } | GeneralApiProblem> {
    const response = await this.apisauce.delete(`groups/${groupId}`)

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "unknown", temporary: true }
    }
    return { kind: "ok" }
  }

  /** Búsqueda de grupos por nombre (2+ caracteres) — para pedir amistad entre grupos. */
  async searchGroups(
    q: string,
  ): Promise<{ kind: "ok"; groups: GroupSearchResultApiDto[] } | GeneralApiProblem> {
    const response = await this.apisauce.get<GroupSearchResultApiDto[]>("groups/search", { q })

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "unknown", temporary: true }
    }
    if (!response.data) return { kind: "bad-data" }
    return { kind: "ok", groups: response.data }
  }

  /** Amistades de un grupo (pendientes y aceptadas, en ambos sentidos). */
  async listGroupFriendships(
    groupId: string,
  ): Promise<{ kind: "ok"; friendships: GroupFriendshipApiDto[] } | GeneralApiProblem> {
    const response = await this.apisauce.get<GroupFriendshipApiDto[]>(
      `groups/${groupId}/friendships`,
    )

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "unknown", temporary: true }
    }
    if (!response.data) return { kind: "bad-data" }
    return { kind: "ok", friendships: response.data }
  }

  /** Solo creator/admin del grupo (403 si no). 409 si ya son amigos o ya hay una solicitud pendiente. */
  async requestGroupFriendship(
    groupId: string,
    targetGroupId: string,
  ): Promise<{ kind: "ok"; friendship: GroupFriendshipApiDto } | GeneralApiProblem> {
    const response = await this.apisauce.post<GroupFriendshipApiDto>(
      `groups/${groupId}/friendships`,
      { targetGroupId },
    )

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "unknown", temporary: true }
    }
    if (!response.data) return { kind: "bad-data" }
    return { kind: "ok", friendship: response.data }
  }

  /** Solo creator/admin del grupo retado puede aceptar (403 si no, 409 si ya no está pendiente). */
  async acceptGroupFriendship(
    friendshipId: string,
  ): Promise<{ kind: "ok"; friendship: GroupFriendshipApiDto } | GeneralApiProblem> {
    const response = await this.apisauce.post<GroupFriendshipApiDto>(
      `group-friendships/${friendshipId}/accept`,
    )

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "unknown", temporary: true }
    }
    if (!response.data) return { kind: "bad-data" }
    return { kind: "ok", friendship: response.data }
  }

  /** Cualquiera de los dos grupos puede terminar la amistad (creator/admin, 403 si no). */
  async removeGroupFriendship(friendshipId: string): Promise<{ kind: "ok" } | GeneralApiProblem> {
    const response = await this.apisauce.delete(`group-friendships/${friendshipId}`)

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "unknown", temporary: true }
    }
    return { kind: "ok" }
  }

  /**
   * Crea un partido. Los partidos 'vs' requieren que el grupo origen y el
   * rival sean amigos (ver useGroupFriendships) — el backend devuelve 403 si no.
   */
  async createMatch(payload: {
    originGroupId: string
    type: MatchTypeApi
    opponentGroupId?: string
    format: string
    maxPlayers: number
    scheduledAt?: string
  }): Promise<{ kind: "ok"; match: MatchApiDto } | GeneralApiProblem> {
    const response = await this.apisauce.post<MatchApiDto>("matches", payload)

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "unknown", temporary: true }
    }
    if (!response.data) return { kind: "bad-data" }
    return { kind: "ok", match: response.data }
  }

  /** Partidos de todos los grupos del usuario autenticado. */
  async listMyMatches(): Promise<
    { kind: "ok"; matches: MatchSummaryApiDto[] } | GeneralApiProblem
  > {
    const response = await this.apisauce.get<MatchSummaryApiDto[]>("matches/mine")

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "unknown", temporary: true }
    }
    if (!response.data) return { kind: "bad-data" }
    return { kind: "ok", matches: response.data }
  }

  /** Partidos de un grupo específico (requiere ser miembro). */
  async listGroupMatches(
    groupId: string,
  ): Promise<{ kind: "ok"; matches: MatchSummaryApiDto[] } | GeneralApiProblem> {
    const response = await this.apisauce.get<MatchSummaryApiDto[]>(`matches/group/${groupId}`)

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "unknown", temporary: true }
    }
    if (!response.data) return { kind: "bad-data" }
    return { kind: "ok", matches: response.data }
  }

  /** Detalle completo (participantes, nombres de grupo). 403 si no eres miembro de ninguno. */
  async getMatchDetail(
    matchId: string,
  ): Promise<{ kind: "ok"; match: MatchApiDto } | GeneralApiProblem> {
    const response = await this.apisauce.get<MatchApiDto>(`matches/${matchId}`)

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "unknown", temporary: true }
    }
    if (!response.data) return { kind: "bad-data" }
    return { kind: "ok", match: response.data }
  }

  /**
   * 409 si ya está lleno (o el lado correspondiente, en vs) o si ya te uniste.
   * `joinAsGroupId` es obligatorio solo si sos miembro de los dos grupos del
   * partido (400 si falta en ese caso) — el backend infiere el lado si no.
   */
  async joinMatch(
    matchId: string,
    joinAsGroupId?: string,
  ): Promise<{ kind: "ok"; match: MatchApiDto } | GeneralApiProblem> {
    const response = await this.apisauce.post<MatchApiDto>(
      `matches/${matchId}/join`,
      joinAsGroupId ? { joinAsGroupId } : {},
    )

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "unknown", temporary: true }
    }
    if (!response.data) return { kind: "bad-data" }
    return { kind: "ok", match: response.data }
  }

  /** 404 si no eras participante. */
  async leaveMatch(
    matchId: string,
  ): Promise<{ kind: "ok"; match: MatchApiDto } | GeneralApiProblem> {
    const response = await this.apisauce.post<MatchApiDto>(`matches/${matchId}/leave`)

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "unknown", temporary: true }
    }
    if (!response.data) return { kind: "bad-data" }
    return { kind: "ok", match: response.data }
  }

  /** Solo creator/admin del opponentGroupId, con el partido en pending_opponent (409 si no). */
  async acceptMatch(
    matchId: string,
  ): Promise<{ kind: "ok"; match: MatchApiDto } | GeneralApiProblem> {
    const response = await this.apisauce.post<MatchApiDto>(`matches/${matchId}/accept`)

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "unknown", temporary: true }
    }
    if (!response.data) return { kind: "bad-data" }
    return { kind: "ok", match: response.data }
  }

  /** Mismos requisitos que acceptMatch — deja el partido en cancelled. */
  async rejectMatch(
    matchId: string,
  ): Promise<{ kind: "ok"; match: MatchApiDto } | GeneralApiProblem> {
    const response = await this.apisauce.post<MatchApiDto>(`matches/${matchId}/reject`)

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "unknown", temporary: true }
    }
    if (!response.data) return { kind: "bad-data" }
    return { kind: "ok", match: response.data }
  }

  /** Solo el creador/admin de un grupo involucrado puede hacerlo (403 si no). */
  async updateMatchStatus(
    matchId: string,
    status: "played" | "cancelled",
  ): Promise<{ kind: "ok"; match: MatchApiDto } | GeneralApiProblem> {
    const response = await this.apisauce.patch<MatchApiDto>(`matches/${matchId}/status`, {
      status,
    })

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "unknown", temporary: true }
    }
    if (!response.data) return { kind: "bad-data" }
    return { kind: "ok", match: response.data }
  }

  /**
   * Sortea equipos balanceados para un partido internal lleno (403/400/409 —
   * ver matches.service.ts randomizeTeams). El backend solo puede viajar el
   * `message` de la excepción a través del límite de microservicio (no un
   * campo `reason` extra — ver RANDOMIZE_TEAMS_ERRORS en libs/contracts), así
   * que estos dos strings deben calzar exactamente con los del backend.
   */
  async randomizeTeams(matchId: string): Promise<
    | { kind: "ok"; match: MatchApiDto; warnings: TeamAssignmentWarningApiDto[] }
    | { kind: "not-full" }
    | { kind: "wrong-status" }
    | GeneralApiProblem
  > {
    const response = await this.apisauce.post<{
      match: MatchApiDto
      warnings: TeamAssignmentWarningApiDto[]
    }>(`matches/${matchId}/randomize-teams`)

    if (!response.ok) {
      if (response.status === 409) {
        const message = (response.data as { message?: string } | undefined)?.message
        if (message === "Match is not full yet") return { kind: "not-full" }
        return { kind: "wrong-status" }
      }
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "unknown", temporary: true }
    }
    if (!response.data) return { kind: "bad-data" }
    return { kind: "ok", match: response.data.match, warnings: response.data.warnings }
  }

  /** Lista pública de canchas — cualquier usuario autenticado, sin roles especiales. */
  async listVenues(): Promise<{ kind: "ok"; venues: PublicVenueApiDto[] } | GeneralApiProblem> {
    const response = await this.apisauce.get<PublicVenueApiDto[]>("venues")

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "unknown", temporary: true }
    }
    if (!response.data) return { kind: "bad-data" }
    return { kind: "ok", venues: response.data }
  }

  /**
   * Nace siempre en 'pending'. 400 si endsAt <= startsAt, 409 si hay choque de
   * horario o si el matchId ya tiene reserva, 404 si el matchId no existe,
   * 403 si no eres creator/admin del grupo origen o rival del partido.
   */
  async createReservation(payload: {
    venueId: string
    startsAt: string
    endsAt: string
    notes?: string
    matchId?: string
  }): Promise<{ kind: "ok"; reservation: MyReservationApiDto } | GeneralApiProblem> {
    const response = await this.apisauce.post<MyReservationApiDto>("my-reservations", payload)

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "unknown", temporary: true }
    }
    if (!response.data) return { kind: "bad-data" }
    return { kind: "ok", reservation: response.data }
  }

  /** Todas las reservas del usuario autenticado, sin importar el estado. */
  async listMyReservations(): Promise<
    { kind: "ok"; reservations: MyReservationApiDto[] } | GeneralApiProblem
  > {
    const response = await this.apisauce.get<MyReservationApiDto[]>("my-reservations")

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "unknown", temporary: true }
    }
    if (!response.data) return { kind: "bad-data" }
    return { kind: "ok", reservations: response.data }
  }

  /** 403 si la reserva no es tuya. */
  async getReservation(
    reservationId: string,
  ): Promise<{ kind: "ok"; reservation: MyReservationApiDto } | GeneralApiProblem> {
    const response = await this.apisauce.get<MyReservationApiDto>(
      `my-reservations/${reservationId}`,
    )

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "unknown", temporary: true }
    }
    if (!response.data) return { kind: "bad-data" }
    return { kind: "ok", reservation: response.data }
  }

  /** 409 si ya estaba cancelada o si startsAt ya pasó. */
  async cancelReservation(
    reservationId: string,
  ): Promise<{ kind: "ok"; reservation: MyReservationApiDto } | GeneralApiProblem> {
    const response = await this.apisauce.patch<MyReservationApiDto>(
      `my-reservations/${reservationId}/cancel`,
    )

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "unknown", temporary: true }
    }
    if (!response.data) return { kind: "bad-data" }
    return { kind: "ok", reservation: response.data }
  }

  /** Registra el push token de este dispositivo contra el usuario autenticado. */
  async registerPushToken(
    token: string,
    platform: "ios" | "android",
  ): Promise<{ kind: "ok" } | GeneralApiProblem> {
    const response = await this.apisauce.post("push-tokens", { token, platform })

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "unknown", temporary: true }
    }
    return { kind: "ok" }
  }

  /**
   * Sin `token`: borra todos los tokens del usuario. `bearerToken` permite pasar
   * el Authorization explícito (usado en logout, donde el header compartido de
   * `apisauce` puede haberse limpiado ya para cuando esta llamada resuelve).
   */
  async removePushToken(
    token?: string,
    bearerToken?: string,
  ): Promise<{ kind: "ok" } | GeneralApiProblem> {
    const axiosConfig: { data?: { token: string }; headers?: Record<string, string> } = {}
    if (token) axiosConfig.data = { token }
    if (bearerToken) axiosConfig.headers = { Authorization: `Bearer ${bearerToken}` }

    const response = await this.apisauce.delete("push-tokens", {}, axiosConfig)

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "unknown", temporary: true }
    }
    return { kind: "ok" }
  }

  /**
   * Gets a list of recent React Native Radio episodes.
   */
  async getEpisodes(): Promise<{ kind: "ok"; episodes: EpisodeItem[] } | GeneralApiProblem> {
    // make the api call
    const response: ApiResponse<ApiFeedResponse> = await this.apisauce.get(
      `api.json?rss_url=https%3A%2F%2Ffeeds.simplecast.com%2FhEI_f9Dx`,
    )

    // the typical ways to die when calling an api
    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }

    // transform the data into the format we are expecting
    try {
      const rawData = response.data

      // This is where we transform the data into the shape we expect for our model.
      const episodes: EpisodeItem[] =
        rawData?.items.map((raw) => ({
          ...raw,
        })) ?? []

      return { kind: "ok", episodes }
    } catch (e) {
      if (__DEV__ && e instanceof Error) {
        console.error(`Bad data: ${e.message}\n${response.data}`, e.stack)
      }
      return { kind: "bad-data" }
    }
  }
}

// Singleton instance of the API for convenience
export const api = new Api()
