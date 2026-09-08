import type { SVGProps } from 'react'

/**
 * Iconos futbolísticos propios, dibujados con las mismas reglas que lucide
 * (viewBox 24, stroke currentColor, grosor 2, extremos y uniones redondos,
 * sin relleno) para convivir con los de lucide-react sin que se note el
 * cambio de set. Cada uno acepta las mismas props que un <svg>.
 */
type IconProps = SVGProps<SVGSVGElement>

function Svg({ children, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={24}
      height={24}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

/** Balón: círculo con el pentágono central y sus cinco costuras. */
export function SoccerBallIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 7.5l4.3 3.1-1.7 5.1H9.4l-1.7-5.1z" />
      <path d="M12 7.5V2.2" />
      <path d="M16.3 10.6l5.2-1.7" />
      <path d="M14.6 15.7l3.1 4.5" />
      <path d="M9.4 15.7l-3.1 4.5" />
      <path d="M7.7 10.6L2.5 8.9" />
    </Svg>
  )
}

/** Cancha vista desde arriba: perímetro, mediocampo, círculo central y áreas. */
export function PitchIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="2" y="5" width="20" height="14" rx="1.5" />
      <path d="M12 5v14" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M2 9h3.5v6H2" />
      <path d="M22 9h-3.5v6H22" />
    </Svg>
  )
}

/** Silbato de árbitro: cuerpo redondo, boquilla y anilla. */
export function WhistleIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 9h11a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-6" />
      <circle cx="9" cy="14" r="5" />
      <path d="M9 9V7a2 2 0 0 1 2-2" />
      <path d="M16 12l-2 2.5" />
    </Svg>
  )
}

/** Botín de fútbol de perfil, con tapones. */
export function BootsIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2 16h20v-3.5l-6.5-2.5-2.5-4.5a1.5 1.5 0 0 0-2.6 0L8.5 9.5C7.2 11.5 4.6 12.4 2 13z" />
      <path d="M11.5 9.5l2 1" />
      <path d="M5 16v3" />
      <path d="M10 16v3" />
      <path d="M15 16v3" />
      <path d="M20 16v3" />
    </Svg>
  )
}
