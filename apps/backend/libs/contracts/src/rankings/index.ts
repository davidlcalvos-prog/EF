/**
 * Rankings de un campeonato oficial (Fase 9, corregida): se calculan SOLO con
 * los datos del torneo consultado (Tournament.kind = 'elite_forge') — no hay
 * rankings globales/históricos ni tablas basadas en PlayerStats. El acceso en
 * mobile vive dentro de la sección de Campeonatos, no en el drawer.
 */
export interface RankingEntry {
  userId: string;
  /** Profile.alias si existe; si no, `${firstname} ${lastname}`. */
  displayName: string;
  favoritePosition: string | null;
  /** El dato principal de esa tabla (goles, o goles recibidos por partido). */
  value: number;
  /** Partidos jugados (del equipo del jugador en este torneo). */
  secondary?: number;
}

/**
 * Sin avatarBase64 a propósito: la ficha al tocar una fila ya trae el avatar
 * por getPublicMemberProfile.
 */
export interface TournamentRankingsResponse {
  /** value = goles en este torneo, secondary = partidos jugados. */
  topScorers: RankingEntry[];
  /** value = goles recibidos por partido (2 decimales), secondary = partidos jugados. */
  bestGoalkeepers: RankingEntry[];
}
