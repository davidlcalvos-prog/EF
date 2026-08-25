import type {
  TournamentCourtSizeApi,
  TournamentMatchApiDto,
  TournamentTeamApiDto,
} from "@/services/api"

/**
 * Misma fórmula que libs/contracts/src/tournaments/domain.ts del backend
 * (playersOnField + 4 suplentes). Solo para que la UI no deje seleccionar de
 * más en el roster picker — la validación real y final sigue siendo del backend.
 */
export function playersOnField(size: TournamentCourtSizeApi): number {
  if (size === "6vs6") return 6
  if (size === "8vs8") return 8
  return 11
}

export function maxPlayersPerTeam(size: TournamentCourtSizeApi): number {
  return playersOnField(size) + 4
}

export function courtSizeLabel(size: TournamentCourtSizeApi): string {
  if (size === "6vs6") return "6 vs 6"
  if (size === "8vs8") return "8 vs 8"
  return "11 vs 11"
}

/**
 * Orden de tabla — mismos criterios que ya aplica el panel web sobre los
 * valores que calcula el backend (puntos, diferencia de gol, goles a favor).
 * Los VALORES nunca se recalculan acá: vienen listos en el DTO.
 */
export function standingSort(a: TournamentTeamApiDto, b: TournamentTeamApiDto): number {
  if (b.points !== a.points) return b.points - a.points
  const gdA = a.goalsFor - a.goalsAgainst
  const gdB = b.goalsFor - b.goalsAgainst
  if (gdB !== gdA) return gdB - gdA
  return b.goalsFor - a.goalsFor
}

/** Partidos jugados (cualquier estado distinto de `scheduled`) — solo conteo presentacional. */
export function playedCount(team: TournamentTeamApiDto, matches: TournamentMatchApiDto[]): number {
  return matches.filter(
    (m) => (m.homeTeamId === team.id || m.awayTeamId === team.id) && m.status !== "scheduled",
  ).length
}

/** Fixture ordenado por fecha, los sin fecha al final. */
export function sortMatchesByDate(matches: TournamentMatchApiDto[]): TournamentMatchApiDto[] {
  return [...matches].sort((a, b) => {
    const ta = a.startsAt ? new Date(a.startsAt).getTime() : Number.MAX_SAFE_INTEGER
    const tb = b.startsAt ? new Date(b.startsAt).getTime() : Number.MAX_SAFE_INTEGER
    return ta - tb
  })
}
