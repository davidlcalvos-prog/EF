import { MatchTeam, PositionCategory, TeamAssignmentWarningDto } from '@ef/contracts';

type StatKey = 'attack' | 'defense' | 'endurance' | 'speed' | 'passes' | 'dribbling';

const STAT_KEYS: StatKey[] = [
  'attack',
  'defense',
  'endurance',
  'speed',
  'passes',
  'dribbling',
];

export interface RandomizerStats {
  attack: number;
  defense: number;
  endurance: number;
  speed: number;
  passes: number;
  dribbling: number;
}

export interface RandomizerPlayer {
  userId: string;
  favoritePosition: string | null;
  stats: RandomizerStats;
}

export interface RandomizerResult {
  assignments: Map<string, MatchTeam>;
  warnings: TeamAssignmentWarningDto[];
}

/**
 * Las 8 posiciones reales del producto (mobile: data/suggestPlayerPosition.ts
 * PlayerPositionId). "goalkeeper" se agregó en la Fase 6.5.4.1 — antes no
 * existía y ningún jugador podía caer nunca en la categoría 'goalkeeper' del
 * randomizador (6.5.4), ni por favorita ni por sugerida.
 *
 * winger se mapea a 'forward': su perfil de stats (speed/dribbling/attack
 * altos, defense bajo) se parece más a un delantero que a un mediocampista
 * defensivo como cdm/cm — criterio futbolístico, no un mapeo obvio.
 */
const POSITION_CATEGORY_MAP: Record<string, PositionCategory> = {
  goalkeeper: 'goalkeeper',
  fullback: 'defense',
  centerback: 'defense',
  cm: 'midfield',
  cdm: 'midfield',
  cam: 'midfield',
  striker: 'forward',
  winger: 'forward',
};

/**
 * Copia simplificada (solo físico, sin ponderación psicológica 72/28) de
 * POSITION_WEIGHTS de mobile/data/suggestPlayerPosition.ts — el backend no
 * tiene fácil acceso batched a las evaluaciones psicológicas de todo un
 * partido, y esto es solo un respaldo del sorteo, no el cálculo real de
 * "posición sugerida" que ve el jugador en su perfil.
 */
const POSITION_WEIGHTS: Record<string, Record<StatKey, number>> = {
  goalkeeper: { defense: 0.44, endurance: 0.17, passes: 0.17, speed: 0.11, dribbling: 0.06, attack: 0.05 },
  striker: { attack: 0.38, speed: 0.22, dribbling: 0.14, endurance: 0.1, passes: 0.06, defense: 0.1 },
  winger: { speed: 0.32, dribbling: 0.26, attack: 0.18, endurance: 0.12, passes: 0.07, defense: 0.05 },
  cam: { passes: 0.28, attack: 0.24, dribbling: 0.22, endurance: 0.12, speed: 0.09, defense: 0.05 },
  cm: { passes: 0.26, endurance: 0.24, defense: 0.16, dribbling: 0.14, attack: 0.1, speed: 0.1 },
  cdm: { defense: 0.32, passes: 0.24, endurance: 0.26, attack: 0.04, speed: 0.08, dribbling: 0.06 },
  fullback: { speed: 0.26, endurance: 0.24, defense: 0.22, passes: 0.14, dribbling: 0.09, attack: 0.05 },
  centerback: { defense: 0.42, endurance: 0.2, passes: 0.14, attack: 0.04, speed: 0.1, dribbling: 0.1 },
};

const MIN_PER_TEAM: Record<PositionCategory, number> = {
  goalkeeper: 1,
  defense: 2,
  midfield: 1,
  forward: 1,
};

/** Orden de reparto de mínimos: arquero primero, luego defensa/medio/delantero (regla 3). */
const CATEGORY_ORDER: PositionCategory[] = ['goalkeeper', 'defense', 'midfield', 'forward'];

function overallScore(stats: RandomizerStats): number {
  return STAT_KEYS.reduce((sum, key) => sum + stats[key], 0) / STAT_KEYS.length;
}

/** Posición sugerida por stats (respaldo) — puede devolver "goalkeeper" desde la Fase 6.5.4.1. */
function suggestedPositionId(stats: RandomizerStats): string {
  let bestId: string | null = null;
  let bestScore = -1;

  for (const [positionId, weights] of Object.entries(POSITION_WEIGHTS)) {
    let weightedSum = 0;
    let weightTotal = 0;
    for (const key of STAT_KEYS) {
      if (stats[key] <= 0) continue;
      weightedSum += stats[key] * weights[key];
      weightTotal += weights[key];
    }
    const score = weightTotal > 0 ? weightedSum / weightTotal : 0;
    if (score > bestScore) {
      bestScore = score;
      bestId = positionId;
    }
  }

  return bestId!;
}

/** Favorita primero (si mapea a una categoría clara); si no, sugerida como respaldo. */
function resolveCategory(favoritePosition: string | null, stats: RandomizerStats): PositionCategory {
  if (favoritePosition && POSITION_CATEGORY_MAP[favoritePosition]) {
    return POSITION_CATEGORY_MAP[favoritePosition];
  }
  return POSITION_CATEGORY_MAP[suggestedPositionId(stats)];
}

function warningMessage(team: MatchTeam, position: PositionCategory): string {
  if (position === 'goalkeeper') {
    // Desde la 6.5.4.1 "goalkeeper" sí es una posición real y sí se contempla
    // (favorita o sugerida) — si esto dispara es porque nadie en el partido
    // tuvo afinidad real a arquero, no por un hueco del catálogo.
    return `Equipo ${team}: no había ningún candidato a arquero (ni por posición favorita ni por sugerida), se completó con el mejor defensa disponible.`;
  }
  return `Equipo ${team}: no había suficientes candidatos para ${position} (ni por posición favorita ni por sugerida), se completó balanceando por puntaje general.`;
}

export function randomizeTeams(players: RandomizerPlayer[]): RandomizerResult {
  const scored = players.map((player) => ({
    ...player,
    category: resolveCategory(player.favoritePosition, player.stats),
    score: overallScore(player.stats),
  }));

  const assignments = new Map<string, MatchTeam>();
  const warnings: TeamAssignmentWarningDto[] = [];
  const teamTotals: Record<MatchTeam, { sum: number; count: number }> = {
    A: { sum: 0, count: 0 },
    B: { sum: 0, count: 0 },
  };

  /**
   * El tamaño de equipo manda siempre primero (nunca deben quedar a más de 1
   * de diferencia, y esa diferencia de 1 solo debería darse con total impar
   * — regla 5). El promedio de score solo desempata cuando los tamaños ya
   * están iguales. Se usa para CADA asignación (mínimos por categoría y
   * sobrantes) — antes el reparto de mínimos usaba un "draft por serpiente"
   * A,B,B,A fijo, ciego al tamaño global, que le daba siempre el candidato
   * impar de una categoría corta (ej. un solo arquero real) al mismo equipo,
   * acumulando un desbalance de 2+ jugadores cuando varias categorías
   * quedaban cortas en la misma partida.
   */
  function pickTeam(): MatchTeam {
    if (teamTotals.A.count !== teamTotals.B.count) {
      return teamTotals.A.count < teamTotals.B.count ? 'A' : 'B';
    }
    const avgA = teamTotals.A.count > 0 ? teamTotals.A.sum / teamTotals.A.count : 0;
    const avgB = teamTotals.B.count > 0 ? teamTotals.B.sum / teamTotals.B.count : 0;
    return avgA <= avgB ? 'A' : 'B';
  }

  function assign(player: (typeof scored)[number], team: MatchTeam): void {
    assignments.set(player.userId, team);
    teamTotals[team].sum += player.score;
    teamTotals[team].count += 1;
  }

  for (const category of CATEGORY_ORDER) {
    const requiredPerTeam = MIN_PER_TEAM[category];
    const requiredTotal = requiredPerTeam * 2;

    const candidates = scored
      .filter((p) => !assignments.has(p.userId) && p.category === category)
      .sort((a, b) =>
        category === 'goalkeeper' ? b.stats.defense - a.stats.defense : b.score - a.score,
      )
      .slice(0, requiredTotal);

    const countPerTeam: Record<MatchTeam, number> = { A: 0, B: 0 };
    for (const player of candidates) {
      const team = pickTeam();
      assign(player, team);
      countPerTeam[team] += 1;
    }

    (['A', 'B'] as MatchTeam[]).forEach((team) => {
      if (countPerTeam[team] < requiredPerTeam) {
        warnings.push({ team, position: category, message: warningMessage(team, category) });
      }
    });
  }

  // Resto de cupos: mismo criterio de balanceo (tamaño primero, score
  // desempata) — el jugador que sobra en total impar queda cubierto
  // naturalmente por esto (regla 5).
  const remaining = scored
    .filter((p) => !assignments.has(p.userId))
    .sort((a, b) => b.score - a.score);

  for (const player of remaining) {
    assign(player, pickTeam());
  }

  return { assignments, warnings };
}
