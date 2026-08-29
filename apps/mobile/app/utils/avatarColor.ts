const AVATAR_PALETTE = ["#00CEC8", "#FF8C00", "#7B68EE", "#2ECC71", "#E74C3C"]

/**
 * Color determinístico de fallback para avatares sin foto — mismo algoritmo
 * que ya usaban por separado FeedDrawer/FeedComposeModal/FeedComposer/
 * FeedNavbar (ahora unificado acá, Fase 12).
 */
export function getUserColor(seed?: string): string {
  if (!seed) return AVATAR_PALETTE[0]
  const hash = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length]
}
