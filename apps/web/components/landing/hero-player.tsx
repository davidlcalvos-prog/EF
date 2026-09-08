'use client'

/**
 * Silueta de futbolista en SVG con aura de "calor corporal", que cicla tres
 * poses de una jugada: recibe (control de pecho) → dribla (conducción) →
 * tira (remate). Sin JavaScript de animación: cada pose es un <div> con su
 * propio <svg>, y el ciclo (crossfade + leve desplazamiento hacia la
 * derecha, sentido de la jugada) lo hace CSS en globals.css:
 *
 *   .ef-hero-player  → --pose-duration / --pose-transition (tiempos)
 *   .ef-pose         → @keyframes ef-pose-cycle
 *   .ef-aura-layer   → @keyframes ef-breathe (respiración del aura)
 *   .ef-wisp         → @keyframes ef-vapor  (vapor que asciende)
 *
 * Por qué cada pose vive en su propio <svg> dentro de un <div>: la animación
 * de opacity/transform corre sobre elementos HTML, que el navegador
 * compone en GPU sin volver a rasterizar el filtro del aura (un transform
 * sobre un <g> interno de SVG re-aplicaría el filtro en cada frame).
 *
 * Colores: solo tokens del proyecto — var(--color-emerald) #00cec8 para el
 * aura, var(--color-orange) #ff8c00 para el impacto del balón, y carbón
 * (--ef-sil, #262626, un paso más oscuro que --secondary #2e2e2e) para el
 * relleno. Nada de verde lima.
 *
 * Con prefers-reduced-motion: una sola pose (dribla) estática, aura fija,
 * sin vapor ni partículas (globals.css).
 */

type Pt = [number, number]

const pts = (points: Pt[]) => points.map((p) => p.join(',')).join(' ')

/** Extremidad: polilínea gruesa con extremos y codos/rodillas redondos. */
function Limb({ points, width }: { points: Pt[]; width: number }) {
  return (
    <polyline
      points={pts(points)}
      fill="none"
      stroke="currentColor"
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  )
}

/** Brazo: húmero más grueso que el antebrazo, mano redonda. */
function Arm({ shoulder, elbow, wrist }: { shoulder: Pt; elbow: Pt; wrist: Pt }) {
  return (
    <>
      <Limb points={[shoulder, elbow]} width={15} />
      <Limb points={[elbow, wrist]} width={12} />
      <circle cx={wrist[0]} cy={wrist[1]} r={6.5} fill="currentColor" />
    </>
  )
}

/** Pierna: muslo, pantorrilla y pie (del tobillo a la punta). */
function Leg({ hip, knee, ankle, toe }: { hip: Pt; knee: Pt; ankle: Pt; toe: Pt }) {
  return (
    <>
      <Limb points={[hip, knee]} width={23} />
      <Limb points={[knee, ankle]} width={17} />
      <Limb points={[ankle, toe]} width={12} />
    </>
  )
}

function Head({ c }: { c: Pt }) {
  return (
    <>
      <circle cx={c[0]} cy={c[1]} r={15.5} fill="currentColor" />
      {/* cuello */}
      <Limb points={[[c[0], c[1] + 13], [c[0] - 2, c[1] + 31]]} width={12} />
    </>
  )
}

/** Balón: carbón con costuras cian (pentágono central). */
function Ball({ c, r = 18 }: { c: Pt; r?: number }) {
  const k = r / 18
  const pent: Pt[] = [
    [0, -7],
    [6.66, -2.16],
    [4.11, 5.66],
    [-4.11, 5.66],
    [-6.66, -2.16],
  ].map(([x, y]) => [c[0] + x * k, c[1] + y * k] as Pt)
  return (
    <g>
      <circle
        cx={c[0]}
        cy={c[1]}
        r={r}
        fill="currentColor"
        stroke="var(--color-emerald)"
        strokeWidth={2.5}
      />
      <polygon
        points={pts(pent)}
        fill="none"
        stroke="var(--color-emerald)"
        strokeWidth={2}
        strokeLinejoin="round"
        opacity={0.9}
      />
    </g>
  )
}

const VIEWBOX = '0 0 400 440'

/* ── Pose 1 · RECIBE: control de pecho. Parado, leve inclinación atrás,
   pecho hacia el balón, brazos abiertos para equilibrar, pie trasero en
   punta. ─────────────────────────────────────────────────────────────── */
function PoseReceive() {
  return (
    <g id="ef-sil-1" className="ef-sil">
      <Head c={[176, 60]} />
      <polygon points="146,96 206,100 210,140 197,170 199,214 151,214 153,170 144,140" fill="currentColor" />
      <polygon points="148,206 200,206 204,258 144,258" fill="currentColor" />
      {/* brazo lejano (detrás) */}
      <Arm shoulder={[152, 104]} elbow={[116, 148]} wrist={[120, 190]} />
      {/* pierna lejana, en punta */}
      <Leg hip={[160, 214]} knee={[146, 300]} ankle={[140, 376]} toe={[170, 388]} />
      {/* pierna cercana, plantada */}
      <Leg hip={[188, 214]} knee={[200, 300]} ankle={[200, 380]} toe={[236, 386]} />
      {/* brazo cercano */}
      <Arm shoulder={[200, 106]} elbow={[238, 146]} wrist={[228, 190]} />
      <Ball c={[230, 126]} />
    </g>
  )
}

/* ── Pose 2 · DRIBLA: conducción en carrera. Tronco inclinado adelante,
   brazos en péndulo, pierna delantera lleva el balón al pie, la trasera
   queda flexionada atrás. ─────────────────────────────────────────────── */
function PoseDribble() {
  return (
    <g id="ef-sil-2" className="ef-sil">
      <Head c={[206, 64]} />
      <polygon points="176,96 232,102 228,146 212,172 194,214 154,212 160,170 164,146" fill="currentColor" />
      <polygon points="152,206 196,208 206,256 142,254" fill="currentColor" />
      {/* brazo lejano, adelante */}
      <Arm shoulder={[182, 104]} elbow={[214, 140]} wrist={[252, 118]} />
      {/* pierna trasera, flexionada */}
      <Leg hip={[160, 214]} knee={[126, 286]} ankle={[100, 344]} toe={[82, 370]} />
      {/* pierna delantera, al balón */}
      <Leg hip={[190, 214]} knee={[250, 284]} ankle={[268, 368]} toe={[300, 378]} />
      {/* brazo cercano, atrás */}
      <Arm shoulder={[226, 108]} elbow={[204, 152]} wrist={[170, 186]} />
      <Ball c={[326, 372]} />
    </g>
  )
}

/* ── Pose 3 · TIRA: remate. Pierna de apoyo plantada, pierna de golpeo
   extendida tras el impacto, tronco atrás, brazos abiertos; el balón sale
   arriba a la derecha con impacto naranja. ────────────────────────────── */
function PoseShoot() {
  return (
    <g id="ef-sil-3" className="ef-sil">
      <Head c={[150, 66]} />
      <polygon points="122,98 182,102 192,146 188,172 188,216 144,216 140,172 132,146" fill="currentColor" />
      <polygon points="144,208 190,208 202,254 140,258" fill="currentColor" />
      {/* brazo lejano, atrás para equilibrar */}
      <Arm shoulder={[128, 106]} elbow={[96, 136]} wrist={[106, 180]} />
      {/* pierna de apoyo */}
      <Leg hip={[152, 216]} knee={[142, 300]} ankle={[132, 380]} toe={[166, 386]} />
      {/* pierna de golpeo, extendida */}
      <Leg hip={[184, 216]} knee={[246, 258]} ankle={[300, 236]} toe={[326, 220]} />
      {/* brazo cercano, adelante y arriba */}
      <Arm shoulder={[176, 108]} elbow={[216, 120]} wrist={[254, 96]} />
      <Ball c={[346, 190]} />
    </g>
  )
}

/** Estelas del balón tras el remate (naranja, estáticas dentro de la pose). */
function ShotStreaks() {
  const streaks: [Pt, Pt][] = [
    [[322, 200], [298, 208]],
    [[318, 184], [290, 186]],
    [[326, 172], [306, 160]],
  ]
  return (
    <g stroke="var(--color-orange)" strokeWidth={3} strokeLinecap="round" opacity={0.75}>
      {streaks.map(([a, b], i) => (
        <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />
      ))}
    </g>
  )
}

const POSES = [
  { id: 1, Shape: PoseReceive, label: 'recibe' },
  { id: 2, Shape: PoseDribble, label: 'dribla' },
  { id: 3, Shape: PoseShoot, label: 'tira' },
] as const

/** Vapor: posiciones (en % de la caja) sobre cabeza y hombros, y desfase. */
const WISPS = [
  { left: 36, top: 8, delay: 0, size: 16 },
  { left: 47, top: 4, delay: 1.4, size: 20 },
  { left: 56, top: 10, delay: 2.6, size: 14 },
  { left: 41, top: 18, delay: 3.5, size: 18 },
  { left: 52, top: 16, delay: 0.8, size: 12 },
]

/** Partículas del impacto (pose 3), alrededor del balón (86.5 %, 43 %). */
const SPARKS = [
  { dx: 26, dy: -18, delay: 0 },
  { dx: 32, dy: 6, delay: 0.5 },
  { dx: 18, dy: -32, delay: 1.0 },
  { dx: 30, dy: -6, delay: 1.5 },
  { dx: 12, dy: 28, delay: 0.25 },
  { dx: 36, dy: -26, delay: 1.25 },
]

export function HeroPlayer({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`ef-hero-player ${className}`}>
      {/* Definiciones compartidas: el filtro del aura y el impacto naranja. */}
      <svg width={0} height={0} className="absolute" focusable="false">
        <defs>
          <filter
            id="ef-aura-filter"
            x="-40%"
            y="-30%"
            width="180%"
            height="160%"
            colorInterpolationFilters="sRGB"
          >
            {/* Contorno brillante: la silueta dilatada 3 px, apenas difusa. */}
            <feMorphology in="SourceAlpha" operator="dilate" radius="2.5" result="edge" />
            <feGaussianBlur in="edge" stdDeviation="1.6" result="edgeSoft" />
            <feFlood
              floodColor="#00cec8"
              floodOpacity="0.8"
              style={{ floodColor: 'var(--color-emerald)' }}
              result="cyan"
            />
            <feComposite in="cyan" in2="edgeSoft" operator="in" result="ring" />
            {/* Halo de calor: dilatada 10 px, muy difusa, y deformada con
                ruido para que el borde sea orgánico (vapor, no neón). */}
            <feMorphology in="SourceAlpha" operator="dilate" radius="12" result="wide" />
            <feGaussianBlur in="wide" stdDeviation="20" result="halo" />
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.018"
              numOctaves="2"
              seed="7"
              result="noise"
            />
            <feDisplacementMap
              in="halo"
              in2="noise"
              scale="42"
              xChannelSelector="R"
              yChannelSelector="G"
              result="haloWarp"
            />
            <feFlood
              floodColor="#00cec8"
              floodOpacity="0.45"
              style={{ floodColor: 'var(--color-emerald)' }}
              result="cyanSoft"
            />
            <feComposite in="cyanSoft" in2="haloWarp" operator="in" result="haloColored" />
            <feMerge>
              <feMergeNode in="haloColored" />
              <feMergeNode in="ring" />
            </feMerge>
          </filter>
          <radialGradient id="ef-impact" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff8c00" style={{ stopColor: 'var(--color-orange)' }} stopOpacity="0.85" />
            <stop offset="45%" stopColor="#ff8c00" style={{ stopColor: 'var(--color-orange)' }} stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ff8c00" style={{ stopColor: 'var(--color-orange)' }} stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>

      {POSES.map(({ id, Shape, label }) => (
        <div key={id} className={`ef-pose ef-pose-${id}`} data-pose={label}>
          {/* Aura: la misma silueta pasada por el filtro, en su propia capa
              para que la respiración (opacity/transform) no re-rasterice. */}
          <div className="ef-aura-layer">
            <svg viewBox={VIEWBOX} className="h-full w-full" focusable="false">
              {id === 3 && <circle cx={346} cy={190} r={64} fill="url(#ef-impact)" />}
              <use href={`#ef-sil-${id}`} filter="url(#ef-aura-filter)" />
            </svg>
          </div>
          <svg viewBox={VIEWBOX} className="ef-sil-layer h-full w-full" focusable="false">
            <Shape />
            {id === 3 && <ShotStreaks />}
          </svg>
          {id === 3 &&
            SPARKS.map((s, i) => (
              <span
                key={i}
                className="ef-spark-impact"
                style={
                  {
                    left: '86.5%',
                    top: '43.2%',
                    '--dx': `${s.dx}px`,
                    '--dy': `${s.dy}px`,
                    animationDelay: `${s.delay}s`,
                  } as React.CSSProperties
                }
              />
            ))}
        </div>
      ))}

      {/* Vapor que asciende desde cabeza y hombros (común a las tres poses). */}
      {WISPS.map((w, i) => (
        <span
          key={i}
          className="ef-wisp"
          style={{
            left: `${w.left}%`,
            top: `${w.top}%`,
            width: `${w.size}%`,
            animationDelay: `${w.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
