/**
 * Despachador de push: lista blanca, contrato nuevo, payload viejo, cola.
 * `navigationRef` se mockea: lo que importa es QUÉ se navega y CUÁNDO.
 */
import {
  clearPendingPushNavigation,
  dispatchPushNavigation,
  flushPendingPushNavigation,
  getPendingPushTarget,
  handlePushResponse,
  resolvePushTarget,
} from "./pushNavigation"

// Prefijo `mock`: es lo único que babel-jest deja referenciar dentro del factory hoisteado.
const mockNavigate = jest.fn()
const mockState = { ready: false, routeNames: [] as string[] }

jest.mock("@/navigators/navigationUtilities", () => ({
  navigationRef: {
    isReady: () => mockState.ready,
    getRootState: () => ({ routeNames: mockState.routeNames }),
    navigate: (...args: unknown[]) => mockNavigate(...args),
  },
}))

const navigateMock = mockNavigate
const state = mockState

const AUTHENTICATED_ROUTES = [
  "Feed",
  "Friends",
  "MatchDetail",
  "NearbyGuestRequests",
  "ReservationDetail",
]

beforeEach(() => {
  navigateMock.mockClear()
  state.ready = false
  state.routeNames = []
  clearPendingPushNavigation()
  jest.spyOn(console, "warn").mockImplementation(() => undefined)
  jest.spyOn(console, "info").mockImplementation(() => undefined)
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe("resolvePushTarget — contrato v1", () => {
  test("solicitud de amistad → Friends con pestaña Solicitudes", () => {
    expect(
      resolvePushTarget({
        v: 1,
        type: "friendship_request",
        screen: "Friends",
        params: { initialTab: "requests", friendshipId: "f1" },
      }),
    ).toEqual({ screen: "Friends", params: { initialTab: "requests" } })
  })

  test("nuevo postulante → MatchDetail con la lista de postulantes abierta", () => {
    expect(
      resolvePushTarget({
        v: 1,
        type: "match_guest_application",
        screen: "MatchDetail",
        params: { matchId: "m1", openApplicants: "1" },
      }),
    ).toEqual({ screen: "MatchDetail", params: { matchId: "m1", openApplicants: true } })
  })

  test("Copa anunciada (A3) → TournamentDetail con tournamentId; sin id no navega", () => {
    expect(
      resolvePushTarget({
        v: 1,
        type: "tournament_announced",
        screen: "TournamentDetail",
        params: { tournamentId: "t1" },
      }),
    ).toEqual({ screen: "TournamentDetail", params: { tournamentId: "t1" } })
    expect(
      resolvePushTarget({ v: 1, type: "tournament_announced", screen: "TournamentDetail" }),
    ).toBeNull()
  })

  test("invitación a grupo → Groups con el bloque de invitaciones (params extra se descartan)", () => {
    expect(
      resolvePushTarget({
        v: 1,
        type: "group_invitation",
        screen: "Groups",
        params: { initialSection: "invitations", invitationId: "i1", groupId: "g1" },
        pending: "groupInvites",
      }),
    ).toEqual({ screen: "Groups", params: { initialSection: "invitations" } })
    expect(resolvePushTarget({ v: 1, type: "x", screen: "Groups" })).toEqual({
      screen: "Groups",
      params: undefined,
    })
  })

  test("pantalla fuera de la lista blanca no navega, aunque exista como ruta", () => {
    expect(resolvePushTarget({ v: 1, type: "x", screen: "Login" })).toBeNull()
    expect(resolvePushTarget({ v: 1, type: "x", screen: "ProfileEdit" })).toBeNull()
    expect(resolvePushTarget({ v: 1, type: "x", screen: "__proto__" })).toBeNull()
  })

  test("sin screen (aviso informativo) o versión desconocida → null", () => {
    expect(
      resolvePushTarget({ v: 1, type: "new_reservation", params: { reservationId: "r" } }),
    ).toBeNull()
    expect(resolvePushTarget({ v: 2, type: "friendship_request", screen: "Friends" })).toBeNull()
  })

  test("params imprescindibles ausentes → null (MatchDetail sin matchId)", () => {
    expect(
      resolvePushTarget({ v: 1, type: "match_guest_accepted", screen: "MatchDetail" }),
    ).toBeNull()
    expect(
      resolvePushTarget({
        v: 1,
        type: "reservation_status",
        screen: "ReservationDetail",
        params: {},
      }),
    ).toBeNull()
  })

  test("params que no son string se ignoran", () => {
    expect(
      resolvePushTarget({ v: 1, type: "x", screen: "MatchDetail", params: { matchId: 42 } }),
    ).toBeNull()
  })
})

describe("resolvePushTarget — payload viejo (sin v)", () => {
  test("friendship_request → Friends/requests", () => {
    expect(resolvePushTarget({ type: "friendship_request", friendshipId: "f1" })).toEqual({
      screen: "Friends",
      params: { initialTab: "requests" },
    })
  })

  test("recordatorio de 30 min (solo matchId) → MatchDetail", () => {
    expect(resolvePushTarget({ matchId: "m9" })).toEqual({
      screen: "MatchDetail",
      params: { matchId: "m9" },
    })
  })

  test("reservation_status con reservationId → ReservationDetail", () => {
    expect(resolvePushTarget({ type: "reservation_status", reservationId: "r1" })).toEqual({
      screen: "ReservationDetail",
      params: { reservationId: "r1" },
    })
  })

  test("tipo desconocido, sin data o basura → null", () => {
    expect(resolvePushTarget({ type: "algo_nuevo" })).toBeNull()
    expect(resolvePushTarget(undefined)).toBeNull()
    expect(resolvePushTarget("string")).toBeNull()
    expect(resolvePushTarget({})).toBeNull()
  })
})

describe("cola de navegación", () => {
  const target = { screen: "Friends" as const, params: { initialTab: "requests" as const } }

  test("app abierta con sesión: navega en el acto", () => {
    state.ready = true
    state.routeNames = AUTHENTICATED_ROUTES
    expect(dispatchPushNavigation(target)).toBe("navigated")
    expect(navigateMock).toHaveBeenCalledWith("Friends", { initialTab: "requests" })
    expect(getPendingPushTarget()).toBeNull()
  })

  test("app cerrada: contenedor no listo → cola; onReady la consume", () => {
    expect(dispatchPushNavigation(target)).toBe("queued")
    expect(navigateMock).not.toHaveBeenCalled()

    state.ready = true
    state.routeNames = AUTHENTICATED_ROUTES
    expect(flushPendingPushNavigation()).toBe(true)
    expect(navigateMock).toHaveBeenCalledTimes(1)
    expect(flushPendingPushNavigation()).toBe(false) // idempotente
  })

  test("sin sesión: la ruta no existe → cola; después del login se navega", () => {
    state.ready = true
    state.routeNames = ["Login", "Register"]
    expect(dispatchPushNavigation(target)).toBe("queued")
    expect(flushPendingPushNavigation()).toBe(false) // sigue sin sesión

    state.routeNames = AUTHENTICATED_ROUTES // AuthContext puso el token, AppStack montó la rama
    expect(flushPendingPushNavigation()).toBe(true)
    expect(navigateMock).toHaveBeenCalledWith("Friends", { initialTab: "requests" })
  })

  test("solo se conserva el último destino en cola", () => {
    dispatchPushNavigation({ screen: "NearbyGuestRequests" })
    dispatchPushNavigation(target)
    state.ready = true
    state.routeNames = AUTHENTICATED_ROUTES
    flushPendingPushNavigation()
    expect(navigateMock).toHaveBeenCalledTimes(1)
    expect(navigateMock).toHaveBeenCalledWith("Friends", { initialTab: "requests" })
  })

  test("logout descarta la cola", () => {
    dispatchPushNavigation(target)
    clearPendingPushNavigation()
    state.ready = true
    state.routeNames = AUTHENTICATED_ROUTES
    expect(flushPendingPushNavigation()).toBe(false)
  })
})

describe("handlePushResponse", () => {
  test("tap sin destino → ignored, sin navegar ni encolar", () => {
    state.ready = true
    state.routeNames = AUTHENTICATED_ROUTES
    expect(handlePushResponse({ v: 1, type: "new_reservation" })).toBe("ignored")
    expect(navigateMock).not.toHaveBeenCalled()
    expect(getPendingPushTarget()).toBeNull()
  })

  test("tap válido con la app abierta → navigated", () => {
    state.ready = true
    state.routeNames = AUTHENTICATED_ROUTES
    expect(
      handlePushResponse({
        v: 1,
        type: "reservation_status",
        screen: "ReservationDetail",
        params: { reservationId: "r1" },
      }),
    ).toBe("navigated")
    expect(navigateMock).toHaveBeenCalledWith("ReservationDetail", { reservationId: "r1" })
  })
})
