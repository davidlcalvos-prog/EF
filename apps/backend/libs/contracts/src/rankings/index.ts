/**
 * Rankings globales de jugador (Fase 9). Goleadores y valla menos vencida se
 * calculan SOLO con datos de campeonatos oficiales (Tournament.kind =
 * 'elite_forge', status active/finished) — decisión de alcance: no hay carga
 * de resultados para partidos internos/VS. Defensa y pases salen de
 * PlayerStats (perfil del jugador).
 */
export interface RankingEntry {
  userId: string;
  /** Profile.alias si existe; si no, `${firstname} ${lastname}`. */
  displayName: string;
  favoritePosition: string | null;
  /** El dato principal de esa tabla (goles, goles recibidos por partido, defense, passes). */
  value: number;
  /** Goleadores/valla: partidos jugados. Ausente en defensa/pases. */
  secondary?: number;
}

/**
 * Sin avatarBase64 a propósito: son hasta 20 filas y el base64 pesa mucho —
 * la ficha al tocar una fila ya trae el avatar por getPublicMemberProfile.
 */
export interface GlobalRankingsResponse {
  /** value = goles, secondary = partidos jugados. */
  topScorers: RankingEntry[];
  /** value = goles recibidos por partido (2 decimales), secondary = partidos jugados. */
  bestGoalkeepers: RankingEntry[];
  /** value = PlayerStats.defense. */
  bestDefense: RankingEntry[];
  /** value = PlayerStats.passes. */
  mostPasses: RankingEntry[];
}
