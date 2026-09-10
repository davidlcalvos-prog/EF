import { View } from "react-native"

import { eliteForgeColors } from "@/theme/eliteForgeColors"

/**
 * Punto de "hay algo pendiente" (Fase B). Naranja de la paleta (#FF8C00) y no
 * cian: el cian/esmeralda ya es el color de TODOS los íconos y chevrons del
 * navbar y del drawer, así que un punto cian se lee como decoración; el
 * naranja es el color de "atención" de la marca (la mitad del degradado, el
 * botón de cerrar sesión), contrasta ~7,5:1 sobre carbón y se distingue de
 * los íconos cian de al lado. Borde carbón para que no se funda con el ícono
 * cuando se superpone.
 */
export function PendingDot({
  visible,
  size = 10,
  absolute = true,
}: {
  visible: boolean
  size?: number
  /** Esquina superior derecha del padre (posición relativa). */
  absolute?: boolean
}) {
  if (!visible) return null
  return (
    <View
      accessibilityLabel="pendiente"
      pointerEvents="none"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#FF8C00",
        borderWidth: 2,
        borderColor: eliteForgeColors.carbon,
        ...(absolute ? { position: "absolute", top: -2, right: -2 } : null),
      }}
    />
  )
}
