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
  EpisodeItem,
  ApiConfig,
  ApiFeedResponse,
  ProfileStatsApiResponse,
} from "@/services/api/types"

import { GeneralApiProblem, getGeneralApiProblem } from "./apiProblem"

export type {
  AuthApiResponse,
  AuthUser,
  ProfileStatsApiResponse,
  PhysicalTestResultApiDto,
  PsychAssessmentApiDto,
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
