export type CourtSize = '6vs6' | '8vs8' | '11vs11'

export type TournamentFormat = 'groups_of_4' | 'round_robin' | 'brackets'

export type TournamentStatus = 'draft' | 'registration' | 'active' | 'finished'

export type MatchStatus =
  | 'scheduled'
  | 'played'
  | 'walkover_home'
  | 'walkover_away'

export type Player = {
  id: string
  name: string
  isGoalkeeper: boolean
  goals: number
  goalsAgainst: number
  assists: number
  /** Defensa férrea: recuperos de balón ante ataque rival. */
  dfr: number
  yellowCards: number
  redCards: number
}

export type Team = {
  id: string
  name: string
  players: Player[]
  wins: number
  draws: number
  losses: number
  lossesByW: number
  points: number
  goalsFor: number
  goalsAgainst: number
  groupId?: string | null
}

export type MatchPlayerStat = {
  playerId: string
  teamId: string
  goals: number
  assists: number
  goalsAgainst: number
  dfr: number
  yellowCards: number
  redCards: number
}

export type Match = {
  id: string
  roundLabel: string
  keyIndex: number
  homeTeamId: string
  awayTeamId: string
  homeGoals: number | null
  awayGoals: number | null
  status: MatchStatus
  playerStats: MatchPlayerStat[]
  /** ISO inicio programado */
  startsAt?: string | null
  endsAt?: string | null
  /** 1 o 2 = cancha simultánea */
  courtNumber?: number
}

/** 0=dom … 6=sáb (Date.getDay). */
export type ScheduleConfig = {
  weekdays: number[]
  startHour: number
  endHour: number
  matchDurationHours: number
  /** 1 → 4 partidos/jornada (18–22); 2 → hasta 8. */
  courtsPerSlot: number
}

export const DEFAULT_SCHEDULE: ScheduleConfig = {
  weekdays: [3, 4], // mié / jue
  startHour: 18,
  endHour: 22,
  matchDurationHours: 1,
  courtsPerSlot: 1,
}

export const WEEKDAY_OPTIONS = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mié' },
  { value: 4, label: 'Jue' },
  { value: 5, label: 'Vie' },
  { value: 6, label: 'Sáb' },
  { value: 0, label: 'Dom' },
] as const

/** private = Torneos privados (7.1, dueño de cancha). elite_forge = Copa Elite Forge (7.2, Administrador). */
export type TournamentKind = 'private' | 'elite_forge'

export type Tournament = {
  id: string
  ownerId: string
  kind: TournamentKind
  /** Cancha fija (private) o null (elite_forge — la cancha se decide por partido). */
  venueId: string | null
  name: string
  courtSize: CourtSize
  format: TournamentFormat
  /** Máximo de equipos inscritos (≤ 16). */
  maxTeams: number
  /** Número de llaves del bracket. */
  bracketKeys: number
  /** Ronda extra si algún equipo quedó fuera de las llaves. */
  extraRoundEnabled: boolean
  status: TournamentStatus
  schedule: ScheduleConfig
  teams: Team[]
  matches: Match[]
  createdAt: string
  updatedAt: string
}

export const MAX_TEAMS = 16

export function playersOnField(size: CourtSize) {
  if (size === '6vs6') return 6
  if (size === '8vs8') return 8
  return 11
}

/** Titulares en cancha + 4 suplentes. */
export function maxPlayersPerTeam(size: CourtSize) {
  return playersOnField(size) + 4
}

export function courtSizeLabel(size: CourtSize) {
  if (size === '6vs6') return '6 vs 6'
  if (size === '8vs8') return '8 vs 8'
  return '11 vs 11'
}

export function formatLabel(format: TournamentFormat) {
  if (format === 'groups_of_4') return 'Grupos de 4'
  if (format === 'round_robin') return 'Todos contra todos (top 4)'
  return 'Llaves / eliminación'
}

export function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function emptyPlayer(name = ''): Player {
  return {
    id: newId('player'),
    name,
    isGoalkeeper: false,
    goals: 0,
    goalsAgainst: 0,
    assists: 0,
    dfr: 0,
    yellowCards: 0,
    redCards: 0,
  }
}

export function emptyTeam(name: string): Team {
  return {
    id: newId('team'),
    name,
    players: [],
    wins: 0,
    draws: 0,
    losses: 0,
    lossesByW: 0,
    points: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    groupId: null,
  }
}

/**
 * Solo cosmético: asigna un groupId de vista previa al agregar equipos, antes
 * de generar el fixture de verdad. El backend vuelve a correr esta misma
 * regla (server-side, en GENERATE_FIXTURE) al generar/regenerar — este
 * cálculo local nunca es la fuente de verdad persistida.
 */
export function ensureGroupIds(teams: Team[]): Team[] {
  return teams.map((team, i) => ({
    ...team,
    groupId: `G${String.fromCharCode(65 + Math.floor(i / 4))}`,
  }))
}

export function formatMatchDate(iso: string | null | undefined) {
  if (!iso) return 'Sin fecha'
  const d = new Date(iso)
  return d.toLocaleString('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export type RankingPlayer = {
  playerId: string
  playerName: string
  teamName: string
  value: number
  isGoalkeeper: boolean
}

/** Goleadores top N — derivado puro de datos ya traídos del backend, solo para el modal de rankings. */
export function topScorers(tournament: Tournament, n = 5): RankingPlayer[] {
  const rows: RankingPlayer[] = []
  for (const team of tournament.teams) {
    for (const p of team.players) {
      if (p.goals <= 0) continue
      rows.push({
        playerId: p.id,
        playerName: p.name || 'Sin nombre',
        teamName: team.name,
        value: p.goals,
        isGoalkeeper: p.isGoalkeeper,
      })
    }
  }
  return rows.sort((a, b) => b.value - a.value).slice(0, n)
}

/** Valla menos vencida: porteros con menos goles en contra (mín. 1 partido con GC registrado). */
export function leastBeatenGoalkeepers(
  tournament: Tournament,
  n = 5,
): RankingPlayer[] {
  const gkMatches = new Map<string, number>()
  for (const match of tournament.matches) {
    if (match.status !== 'played') continue
    for (const stat of match.playerStats) {
      gkMatches.set(stat.playerId, (gkMatches.get(stat.playerId) ?? 0) + 1)
    }
  }

  const rows: RankingPlayer[] = []
  for (const team of tournament.teams) {
    for (const p of team.players) {
      if (!p.isGoalkeeper) continue
      const apps = gkMatches.get(p.id) ?? 0
      if (apps === 0 && p.goalsAgainst === 0) continue
      rows.push({
        playerId: p.id,
        playerName: p.name || 'Sin nombre',
        teamName: team.name,
        value: p.goalsAgainst,
        isGoalkeeper: true,
      })
    }
  }
  return rows
    .sort((a, b) => {
      if (a.value !== b.value) return a.value - b.value
      return a.playerName.localeCompare(b.playerName)
    })
    .slice(0, n)
}

export function topFourFromRoundRobin(tournament: Tournament): Team[] {
  return [...tournament.teams]
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      const gdA = a.goalsFor - a.goalsAgainst
      const gdB = b.goalsFor - b.goalsAgainst
      if (gdB !== gdA) return gdB - gdA
      return b.goalsFor - a.goalsFor
    })
    .slice(0, 4)
}

type StandingRow = Team & { played: number }

export function standingSort(a: StandingRow, b: StandingRow) {
  if (b.points !== a.points) return b.points - a.points
  const gdA = a.goalsFor - a.goalsAgainst
  const gdB = b.goalsFor - b.goalsAgainst
  if (gdB !== gdA) return gdB - gdA
  return b.goalsFor - a.goalsFor
}

export function withPlayedCount(teams: Team[], matches: Match[]): StandingRow[] {
  return teams.map((t) => {
    const played = matches.filter(
      (m) =>
        (m.homeTeamId === t.id || m.awayTeamId === t.id) &&
        m.status !== 'scheduled',
    ).length
    return { ...t, played }
  })
}

/** Resultado de generar/ampliar el fixture — cuántos partidos no pudieron reservarse por choque de horario. */
export interface GenerateFixtureResult {
  tournament: Tournament
  unscheduledCount: number
}
