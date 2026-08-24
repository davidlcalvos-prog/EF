/**
 * Lógica pura de torneos privados (Fase 7.1) — fixture, calendario y
 * standings. Portada 1:1 desde el prototipo original en
 * apps/web/lib/dal/admin/tournaments.ts para que el backend sea la única
 * fuente de verdad (GENERATE_FIXTURE / UPDATE_MATCH_RESULT / ADD_EXTRA_ROUND
 * corren estas mismas funciones). Sin dependencias de Nest/Prisma/Next/DOM —
 * solo objetos planos, para poder testearla y razonarla en aislamiento.
 *
 * Nombres prefijados con `Domain` a propósito: en los repositorios/servicios
 * de venues-service conviven con los tipos generados por Prisma (que usan
 * los mismos nombres de modelo pero shape/valores distintos, p.ej.
 * DomainCourtSize='6vs6' vs Prisma TournamentCourtSize='six_vs_six') y con
 * los DTOs de la API — el prefijo evita choques de imports.
 */

export type DomainCourtSize = '6vs6' | '8vs8' | '11vs11';

export type DomainTournamentFormat = 'groups_of_4' | 'round_robin' | 'brackets';

export type DomainMatchStatus =
  | 'scheduled'
  | 'played'
  | 'walkover_home'
  | 'walkover_away';

export type DomainPlayer = {
  id: string;
  name: string;
  isGoalkeeper: boolean;
  goals: number;
  goalsAgainst: number;
  assists: number;
  dfr: number;
  yellowCards: number;
  redCards: number;
};

export type DomainTeam = {
  id: string;
  name: string;
  players: DomainPlayer[];
  wins: number;
  draws: number;
  losses: number;
  lossesByW: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  groupId?: string | null;
};

export type DomainMatchPlayerStat = {
  playerId: string;
  teamId: string;
  goals: number;
  assists: number;
  goalsAgainst: number;
  dfr: number;
  yellowCards: number;
  redCards: number;
};

export type DomainMatch = {
  id: string;
  roundLabel: string;
  keyIndex: number;
  homeTeamId: string;
  awayTeamId: string;
  homeGoals: number | null;
  awayGoals: number | null;
  status: DomainMatchStatus;
  playerStats: DomainMatchPlayerStat[];
  startsAt?: string | null;
  endsAt?: string | null;
  courtNumber?: number;
};

/** 0=dom … 6=sáb (Date.getDay). */
export type DomainScheduleConfig = {
  weekdays: number[];
  startHour: number;
  endHour: number;
  matchDurationHours: number;
  /** 1 → 4 partidos/jornada (18–22); 2 → hasta 8. */
  courtsPerSlot: number;
};

export const DEFAULT_SCHEDULE: DomainScheduleConfig = {
  weekdays: [3, 4], // mié / jue
  startHour: 18,
  endHour: 22,
  matchDurationHours: 1,
  courtsPerSlot: 1,
};

export type DomainTournament = {
  id: string;
  name: string;
  courtSize: DomainCourtSize;
  format: DomainTournamentFormat;
  maxTeams: number;
  bracketKeys: number;
  extraRoundEnabled: boolean;
  schedule: DomainScheduleConfig;
  teams: DomainTeam[];
  matches: DomainMatch[];
};

export const MAX_TEAMS = 16;

export function playersOnField(size: DomainCourtSize) {
  if (size === '6vs6') return 6;
  if (size === '8vs8') return 8;
  return 11;
}

/** Titulares en cancha + 4 suplentes. */
export function maxPlayersPerTeam(size: DomainCourtSize) {
  return playersOnField(size) + 4;
}

export function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pairRound(
  home: DomainTeam,
  away: DomainTeam,
  roundLabel: string,
  keyIndex: number,
): DomainMatch {
  return {
    id: newId('match'),
    roundLabel,
    keyIndex,
    homeTeamId: home.id,
    awayTeamId: away.id,
    homeGoals: null,
    awayGoals: null,
    status: 'scheduled',
    playerStats: [],
    startsAt: null,
    endsAt: null,
    courtNumber: 1,
  };
}

/** Asigna grupo sin reordenar equipos existentes (preserva roster ya cargado). */
export function ensureGroupIds(teams: DomainTeam[]): DomainTeam[] {
  return teams.map((team, i) => ({
    ...team,
    groupId: `G${String.fromCharCode(65 + Math.floor(i / 4))}`,
  }));
}

export function assignGroups(teams: DomainTeam[]): DomainTeam[] {
  return ensureGroupIds(shuffle(teams));
}

function generateGroupsOfFour(teams: DomainTeam[]): DomainMatch[] {
  const withGroups = ensureGroupIds(teams);
  const byGroup = new Map<string, DomainTeam[]>();
  for (const team of withGroups) {
    const groupId = team.groupId || 'G?';
    const list = byGroup.get(groupId) ?? [];
    list.push(team);
    byGroup.set(groupId, list);
  }

  let key = 0;
  const buckets: DomainMatch[][] = [];
  for (const [groupId, groupTeams] of byGroup) {
    const groupMatches: DomainMatch[] = [];
    for (let i = 0; i < groupTeams.length; i++) {
      for (let j = i + 1; j < groupTeams.length; j++) {
        groupMatches.push(pairRound(groupTeams[i], groupTeams[j], `Grupo ${groupId}`, key++));
      }
    }
    buckets.push(shuffle(groupMatches));
  }

  const interleaved: DomainMatch[] = [];
  let added = true;
  while (added) {
    added = false;
    for (const bucket of buckets) {
      const next = bucket.shift();
      if (next) {
        interleaved.push(next);
        added = true;
      }
    }
  }
  return interleaved;
}

/** Round-robin por método del círculo (rondas balanceadas) + shuffle de rondas. */
function generateRoundRobin(teams: DomainTeam[]): DomainMatch[] {
  const list = [...teams];
  if (list.length % 2 === 1) {
    list.push({
      id: '__bye__',
      name: 'BYE',
      players: [],
      wins: 0,
      draws: 0,
      losses: 0,
      lossesByW: 0,
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      groupId: null,
    });
  }
  const n = list.length;
  const rounds = n - 1;
  const half = n / 2;
  const rotated = [...list];
  const roundBuckets: DomainMatch[][] = [];
  let key = 0;

  for (let r = 0; r < rounds; r++) {
    const roundMatches: DomainMatch[] = [];
    for (let i = 0; i < half; i++) {
      const home = rotated[i];
      const away = rotated[n - 1 - i];
      if (home.id === '__bye__' || away.id === '__bye__') continue;
      const [h, a] = r % 2 === 0 ? [home, away] : [away, home];
      roundMatches.push(pairRound(h, a, `Jornada ${r + 1}`, key++));
    }
    roundBuckets.push(shuffle(roundMatches));
    const fixed = rotated[0];
    const rest = rotated.slice(1);
    rest.unshift(rest.pop()!);
    rotated.splice(0, rotated.length, fixed, ...rest);
  }

  const out: DomainMatch[] = [];
  for (const bucket of shuffle(roundBuckets)) {
    out.push(...bucket);
  }
  return out;
}

function generateBrackets(
  teams: DomainTeam[],
  bracketKeys: number,
  extraRound: boolean,
): DomainMatch[] {
  const matches: DomainMatch[] = [];
  const keys = Math.max(1, bracketKeys);
  const slots = keys * 2;
  const shuffled = shuffle(teams);
  const inBracket = shuffled.slice(0, slots);
  const overflow = shuffled.slice(slots);

  let key = 0;
  const firstRound: DomainMatch[] = [];
  for (let i = 0; i < inBracket.length; i += 2) {
    const home = inBracket[i];
    const away = inBracket[i + 1];
    if (!home || !away) break;
    firstRound.push(pairRound(home, away, `Llave ${Math.floor(i / 2) + 1}`, key++));
  }
  matches.push(...shuffle(firstRound));

  if (extraRound && overflow.length > 0) {
    const extra: DomainMatch[] = [];
    for (let i = 0; i < overflow.length; i += 2) {
      const home = overflow[i];
      const away = overflow[i + 1];
      if (home && away) {
        extra.push(pairRound(home, away, 'Ronda extra', key++));
      }
    }
    matches.push(...shuffle(extra));
  }

  return matches;
}

type Slot = { start: Date; end: Date; courtNumber: number };

function buildSlots(schedule: DomainScheduleConfig, needed: number, from = new Date()): Slot[] {
  const weekdays = schedule.weekdays.length ? schedule.weekdays : DEFAULT_SCHEDULE.weekdays;
  const durationMs = schedule.matchDurationHours * 60 * 60 * 1000;
  const courts = Math.min(2, Math.max(1, schedule.courtsPerSlot));
  const slots: Slot[] = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  let guard = 0;
  while (slots.length < needed && guard < 400) {
    guard++;
    const day = cursor.getDay();
    if (weekdays.includes(day)) {
      for (let hour = schedule.startHour; hour < schedule.endHour; hour += schedule.matchDurationHours) {
        for (let court = 1; court <= courts; court++) {
          const start = new Date(cursor);
          start.setHours(hour, 0, 0, 0);
          if (start.getTime() < from.getTime()) continue;
          const end = new Date(start.getTime() + durationMs);
          slots.push({ start, end, courtNumber: court });
        }
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return slots;
}

/**
 * Asigna fechas/horarios/canchas evitando que el mismo equipo juegue dos
 * veces el mismo día cuando sea posible. Si faltan slots, deja partidos sin
 * fecha (startsAt/endsAt null) — el caller decide qué hacer con ellos (en el
 * backend: no generan reserva).
 */
export function scheduleMatches(
  matches: DomainMatch[],
  schedule: DomainScheduleConfig,
  from = new Date(),
): DomainMatch[] {
  const slots = buildSlots(schedule, matches.length + 8, from);
  const remaining = [...matches];
  const scheduled: DomainMatch[] = [];
  const teamDay = new Map<string, Set<string>>();

  function dayKey(d: Date) {
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }

  for (const slot of slots) {
    if (remaining.length === 0) break;
    const dk = dayKey(slot.start);
    let pickIdx = remaining.findIndex((m) => {
      const h = teamDay.get(m.homeTeamId);
      const a = teamDay.get(m.awayTeamId);
      return !h?.has(dk) && !a?.has(dk);
    });
    if (pickIdx < 0) pickIdx = 0;
    const [match] = remaining.splice(pickIdx, 1);
    const homeSet = teamDay.get(match.homeTeamId) ?? new Set();
    homeSet.add(dk);
    teamDay.set(match.homeTeamId, homeSet);
    const awaySet = teamDay.get(match.awayTeamId) ?? new Set();
    awaySet.add(dk);
    teamDay.set(match.awayTeamId, awaySet);

    scheduled.push({
      ...match,
      startsAt: slot.start.toISOString(),
      endsAt: slot.end.toISOString(),
      courtNumber: slot.courtNumber,
    });
  }

  for (const left of remaining) {
    scheduled.push({ ...left, startsAt: null, endsAt: null, courtNumber: 1 });
  }
  return scheduled;
}

/** Genera enfrentamientos según el formato (orden aleatorio/balanceado) y los agenda. */
export function generateFixture(tournament: DomainTournament): DomainMatch[] {
  if (tournament.teams.length < 2) return [];

  let matches: DomainMatch[];
  if (tournament.format === 'groups_of_4') {
    matches = generateGroupsOfFour(tournament.teams);
  } else if (tournament.format === 'round_robin') {
    matches = generateRoundRobin(shuffle([...tournament.teams]));
  } else {
    matches = generateBrackets(
      shuffle([...tournament.teams]),
      tournament.bracketKeys,
      tournament.extraRoundEnabled,
    );
  }

  return scheduleMatches(matches, tournament.schedule ?? DEFAULT_SCHEDULE);
}

export function addExtraRoundMatches(tournament: DomainTournament): DomainMatch[] {
  const used = new Set(tournament.matches.flatMap((m) => [m.homeTeamId, m.awayTeamId]));
  const outside = shuffle(tournament.teams.filter((t) => !used.has(t.id)));
  if (outside.length < 2) return tournament.matches;

  const extras: DomainMatch[] = [];
  let key = tournament.matches.length;
  for (let i = 0; i < outside.length; i += 2) {
    const home = outside[i];
    const away = outside[i + 1];
    if (home && away) {
      extras.push(pairRound(home, away, 'Ronda extra', key++));
    }
  }
  const timed = scheduleMatches(extras, tournament.schedule ?? DEFAULT_SCHEDULE, new Date());
  return [...tournament.matches, ...timed];
}

/** Recalcula wins/draws/losses/points/goles y stats de jugadores desde cero, a partir de `matches`. */
export function recomputeStandings(
  teams: DomainTeam[],
  matches: DomainMatch[],
): DomainTeam[] {
  const reset = teams.map((t) => ({
    ...t,
    wins: 0,
    draws: 0,
    losses: 0,
    lossesByW: 0,
    points: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    players: t.players.map((p) => ({
      ...p,
      goals: 0,
      goalsAgainst: 0,
      assists: 0,
      dfr: 0,
      yellowCards: 0,
      redCards: 0,
    })),
  }));

  const byId = new Map(reset.map((t) => [t.id, t]));

  for (const match of matches) {
    const home = byId.get(match.homeTeamId);
    const away = byId.get(match.awayTeamId);
    if (!home || !away) continue;

    if (match.status === 'walkover_home') {
      away.lossesByW += 1;
      away.losses += 1;
      home.wins += 1;
      home.points += 3;
      continue;
    }
    if (match.status === 'walkover_away') {
      home.lossesByW += 1;
      home.losses += 1;
      away.wins += 1;
      away.points += 3;
      continue;
    }
    if (match.status !== 'played') continue;
    if (match.homeGoals == null || match.awayGoals == null) continue;

    home.goalsFor += match.homeGoals;
    home.goalsAgainst += match.awayGoals;
    away.goalsFor += match.awayGoals;
    away.goalsAgainst += match.homeGoals;

    if (match.homeGoals > match.awayGoals) {
      home.wins += 1;
      home.points += 3;
      away.losses += 1;
    } else if (match.homeGoals < match.awayGoals) {
      away.wins += 1;
      away.points += 3;
      home.losses += 1;
    } else {
      home.draws += 1;
      away.draws += 1;
      home.points += 1;
      away.points += 1;
    }

    for (const stat of match.playerStats) {
      const team = byId.get(stat.teamId);
      const player = team?.players.find((p) => p.id === stat.playerId);
      if (!player) continue;
      player.goals += stat.goals;
      player.assists += stat.assists;
      player.goalsAgainst += stat.goalsAgainst;
      player.dfr += stat.dfr ?? 0;
      player.yellowCards += stat.yellowCards;
      player.redCards += stat.redCards;
    }
  }

  return Array.from(byId.values());
}
