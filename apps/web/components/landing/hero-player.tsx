'use client'

/**
 * Silueta de futbolista en SVG con aura de energía, que cicla tres poses de
 * una jugada: recibe (control de pecho) → dribla (conducción) → tira
 * (remate). Sin JavaScript de animación: cada pose es un <div> con tres
 * <svg> (energía, aura, silueta), y el ciclo (crossfade + leve desplazamiento
 * hacia la derecha, sentido de la jugada) lo hace CSS en globals.css:
 *
 *   .ef-hero-player   → --pose-duration / --pose-transition (tiempos)
 *   .ef-pose          → @keyframes ef-pose-cycle
 *   .ef-aura-layer    → @keyframes ef-breathe (respiración del aura)
 *   .ef-energy-layer  → @keyframes ef-energy-drift (deriva de los trazos)
 *   .ef-wisp          → @keyframes ef-vapor  (vapor que asciende)
 *
 * Por qué cada capa vive en su propio <svg> dentro de un <div>: la animación
 * de opacity/transform corre sobre elementos HTML, que el navegador compone
 * en GPU sin volver a rasterizar los filtros (un transform sobre un <g>
 * interno de SVG re-aplicaría el filtro en cada frame).
 *
 * Las figuras se construyen por partes a partir de un esqueleto de
 * articulaciones (`Joints`): segmentos cónicos (muslo ancho en la cadera y
 * fino en la rodilla, pantorrilla con gemelo, antebrazo), torso con cintura,
 * mangas y pantalón con dobladillo, botines con suela, puños, cabeza con
 * mentón, pelo en puntas y un ojo que brilla. Para retocar una pose se
 * cambian coordenadas en POSES; todo lo demás se recalcula.
 *
 * Colores: solo tokens del proyecto — var(--color-emerald) #00cec8 para
 * aura, energía y ojo; var(--color-orange) #ff8c00 para el impacto del
 * balón; carbón (--ef-sil, #262626) para el relleno. Nada de verde lima.
 *
 * Con prefers-reduced-motion: una sola pose (dribla) estática, aura fija,
 * sin vapor, deriva ni partículas (globals.css).
 *
 * Dos fuentes para la silueta: si scripts/split-hero-poses.js generó
 * hero-poses.generated.ts (RASTER_POSES) a partir de la ilustración, cada
 * pose es un <image> PNG con alfa y el SVG solo pone el aura, la energía y el
 * impacto DETRÁS; si no, se usan las figuras vectoriales de abajo como
 * respaldo. El aura funciona igual en los dos casos porque el filtro trabaja
 * sobre el canal alfa (SourceAlpha) del <use>.
 */

import { RASTER_POSES, type RasterPose } from './hero-poses.generated'

type Pt = [number, number]

/* ── Vectores ─────────────────────────────────────────────────────────── */
const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]]
const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]]
const mul = (a: Pt, k: number): Pt => [a[0] * k, a[1] * k]
const len = (a: Pt) => Math.hypot(a[0], a[1])
const unit = (a: Pt): Pt => {
  const l = len(a) || 1
  return [a[0] / l, a[1] / l]
}
/** Normal (perpendicular, rotada -90°: "arriba" para un vector que va a la derecha). */
const perp = (a: Pt): Pt => [a[1], -a[0]]
const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
const f = (n: number) => Math.round(n * 10) / 10
const pts = (points: Pt[]) => points.map((p) => `${f(p[0])},${f(p[1])}`).join(' ')

/* ── Piezas ───────────────────────────────────────────────────────────── */

/** Segmento cónico entre dos articulaciones, con extremos redondos. */
function Seg({ a, b, wa, wb }: { a: Pt; b: Pt; wa: number; wb: number }) {
  const n = perp(unit(sub(b, a)))
  const poly: Pt[] = [
    add(a, mul(n, wa / 2)),
    add(b, mul(n, wb / 2)),
    sub(b, mul(n, wb / 2)),
    sub(a, mul(n, wa / 2)),
  ]
  return (
    <>
      <polygon points={pts(poly)} fill="currentColor" />
      <circle cx={f(a[0])} cy={f(a[1])} r={f(wa / 2)} fill="currentColor" />
      <circle cx={f(b[0])} cy={f(b[1])} r={f(wb / 2)} fill="currentColor" />
    </>
  )
}

/** Botín: talón, suela, punta y empeine, orientado del tobillo a la punta. */
function Boot({ ankle, toe }: { ankle: Pt; toe: Pt }) {
  const d = unit(sub(toe, ankle))
  const n = perp(d)
  const poly: Pt[] = [
    add(add(ankle, mul(n, 9)), mul(d, -2)), // empeine alto
    add(add(ankle, mul(n, 2)), mul(d, -9)), // talón
    add(add(ankle, mul(n, -6)), mul(d, -7)), // talón bajo
    add(toe, mul(n, -5)), // suela punta
    add(add(toe, mul(n, 1)), mul(d, 4)), // punta
    add(add(toe, mul(n, 6)), mul(d, -6)), // empeine punta
    add(add(lerp(ankle, toe, 0.45), mul(n, 9)), mul(d, 0)),
  ]
  return <polygon points={pts(poly)} fill="currentColor" />
}

/** Pelo en puntas (coordenadas locales, cabeza mirando a la derecha). */
const HAIR: Pt[] = [
  [7, -13],
  [12, -26],
  [3, -16],
  [-1, -31],
  [-7, -15],
  [-15, -28],
  [-13, -10],
  [-28, -17],
  [-15, -3],
  [-30, -1],
  [-14, 5],
  [-25, 12],
  [-10, 9],
  [0, 4],
]

function Head({ c, tilt }: { c: Pt; tilt: number }) {
  return (
    <g transform={`translate(${f(c[0])} ${f(c[1])}) rotate(${tilt})`}>
      <circle r={15.5} fill="currentColor" />
      {/* mentón y mandíbula hacia el frente */}
      <polygon points="6,4 15,1 13,12 4,16 -4,14" fill="currentColor" />
      <polygon points={pts(HAIR)} fill="currentColor" />
      {/* ojo que brilla */}
      <ellipse cx={8.5} cy={-2.5} rx={3.2} ry={1.6} fill="var(--color-emerald)" opacity={0.95} />
    </g>
  )
}

/** Balón: carbón con costuras cian. */
function Ball({ c, r = 19 }: { c: Pt; r?: number }) {
  const k = r / 18
  const pent: Pt[] = (
    [
      [0, -7],
      [6.66, -2.16],
      [4.11, 5.66],
      [-4.11, 5.66],
      [-6.66, -2.16],
    ] as Pt[]
  ).map(([x, y]) => [c[0] + x * k, c[1] + y * k] as Pt)
  return (
    <g>
      <circle cx={c[0]} cy={c[1]} r={r} fill="currentColor" stroke="var(--color-emerald)" strokeWidth={2.5} />
      <polygon points={pts(pent)} fill="none" stroke="var(--color-emerald)" strokeWidth={2} strokeLinejoin="round" opacity={0.9} />
      {pent.map((p, i) => {
        const out = add(c, mul(unit(sub(p, c)), r - 1))
        return <line key={i} x1={f(p[0])} y1={f(p[1])} x2={f(out[0])} y2={f(out[1])} stroke="var(--color-emerald)" strokeWidth={1.6} opacity={0.7} />
      })}
    </g>
  )
}

/* ── Esqueleto → figura ────────────────────────────────────────────────── */

interface Joints {
  head: Pt
  headTilt: number
  neck: Pt
  shoulderL: Pt
  shoulderR: Pt
  elbowL: Pt
  wristL: Pt
  elbowR: Pt
  wristR: Pt
  hipL: Pt
  hipR: Pt
  kneeL: Pt
  ankleL: Pt
  toeL: Pt
  kneeR: Pt
  ankleR: Pt
  toeR: Pt
  ball: Pt
}

function Arm({ s, e, w }: { s: Pt; e: Pt; w: Pt }) {
  const fist = add(w, mul(unit(sub(w, e)), 4))
  return (
    <>
      {/* manga */}
      <Seg a={s} b={lerp(s, e, 0.48)} wa={25} wb={22} />
      <Seg a={s} b={e} wa={17} wb={13} />
      <Seg a={e} b={lerp(e, w, 0.35)} wa={13} wb={15} />
      <Seg a={lerp(e, w, 0.35)} b={w} wa={15} wb={10} />
      <circle cx={f(fist[0])} cy={f(fist[1])} r={8} fill="currentColor" />
    </>
  )
}

function Leg({ h, k, a, t }: { h: Pt; k: Pt; a: Pt; t: Pt }) {
  const calf = lerp(k, a, 0.38)
  return (
    <>
      {/* pantalón */}
      <Seg a={h} b={lerp(h, k, 0.52)} wa={33} wb={31} />
      <Seg a={h} b={k} wa={26} wb={19} />
      <Seg a={k} b={calf} wa={19} wb={22} />
      <Seg a={calf} b={a} wa={22} wb={11} />
      {/* media alta */}
      <Seg a={lerp(k, a, 0.55)} b={a} wa={19} wb={13} />
      <Boot ankle={a} toe={t} />
    </>
  )
}

function Torso({ j }: { j: Joints }) {
  const { neck, shoulderL: SL, shoulderR: SR, hipL: HL, hipR: HR } = j
  const towards = (from: Pt, to: Pt, k: number) => add(from, mul(unit(sub(to, from)), k))
  const armpitL = towards(lerp(SL, HL, 0.2), lerp(SR, HR, 0.2), 5)
  const armpitR = towards(lerp(SR, HR, 0.2), lerp(SL, HL, 0.2), 5)
  const waistL = towards(lerp(SL, HL, 0.62), lerp(SR, HR, 0.62), 9)
  const waistR = towards(lerp(SR, HR, 0.62), lerp(SL, HL, 0.62), 9)
  const poly: Pt[] = [
    add(neck, [-9, 2]),
    add(SL, [0, -3]),
    armpitL,
    waistL,
    add(HL, [-2, 4]),
    add(HR, [2, 4]),
    waistR,
    armpitR,
    add(SR, [0, -3]),
    add(neck, [9, 2]),
  ]
  return (
    <>
      <polygon points={pts(poly)} fill="currentColor" />
      {/* hombros redondeados y pecho */}
      <circle cx={f(SL[0])} cy={f(SL[1])} r={11} fill="currentColor" />
      <circle cx={f(SR[0])} cy={f(SR[1])} r={11} fill="currentColor" />
      <Seg a={j.head} b={neck} wa={12} wb={13} />
    </>
  )
}

function Figure({ j }: { j: Joints }) {
  return (
    <>
      {/* lejos → cerca: brazo lejano, pierna lejana, torso, pierna cercana, brazo cercano, cabeza */}
      <Arm s={j.shoulderL} e={j.elbowL} w={j.wristL} />
      <Leg h={j.hipL} k={j.kneeL} a={j.ankleL} t={j.toeL} />
      <Torso j={j} />
      <Leg h={j.hipR} k={j.kneeR} a={j.ankleR} t={j.toeR} />
      <Arm s={j.shoulderR} e={j.elbowR} w={j.wristR} />
      <Head c={j.head} tilt={j.headTilt} />
      <Ball c={j.ball} />
    </>
  )
}

/* ── Poses (viewBox 0 0 400 440, suelo ≈ y 395, juega hacia la derecha) ── */

const POSES: { id: 1 | 2 | 3; label: string; j: Joints; trail: Pt }[] = [
  {
    // RECIBE: control de pecho. Tronco atrás, pecho al balón, brazos
    // abiertos para equilibrar, rodilla cercana arriba, pie lejano en punta.
    id: 1,
    label: 'recibe',
    trail: [-0.85, 0.4],
    j: {
      head: [190, 58],
      headTilt: -12,
      neck: [188, 84],
      shoulderL: [160, 98],
      shoulderR: [214, 102],
      elbowL: [126, 130],
      wristL: [112, 170],
      elbowR: [252, 122],
      wristR: [242, 162],
      hipL: [162, 212],
      hipR: [198, 214],
      kneeL: [150, 300],
      ankleL: [146, 380],
      toeL: [176, 392],
      kneeR: [238, 262],
      ankleR: [226, 330],
      toeR: [250, 348],
      ball: [240, 130],
    },
  },
  {
    // DRIBLA: conducción en carrera. Tronco adelante, puños en péndulo,
    // pierna delantera lleva el balón, la trasera va flexionada atrás.
    id: 2,
    label: 'dribla',
    trail: [-1, 0.12],
    j: {
      head: [214, 70],
      headTilt: 16,
      neck: [206, 94],
      shoulderL: [176, 104],
      shoulderR: [228, 110],
      elbowL: [214, 142],
      wristL: [254, 126],
      elbowR: [206, 152],
      wristR: [168, 180],
      hipL: [150, 214],
      hipR: [190, 216],
      kneeL: [120, 282],
      ankleL: [96, 332],
      toeL: [78, 358],
      kneeR: [254, 282],
      ankleR: [270, 368],
      toeR: [302, 380],
      ball: [330, 374],
    },
  },
  {
    // TIRA: remate. Pierna de apoyo plantada, pierna de golpeo extendida
    // tras el impacto, tronco atrás, brazos abiertos; el balón sale arriba.
    id: 3,
    label: 'tira',
    trail: [-0.9, 0.3],
    j: {
      head: [150, 72],
      headTilt: -22,
      neck: [152, 96],
      shoulderL: [122, 106],
      shoulderR: [178, 112],
      elbowL: [92, 136],
      wristL: [100, 180],
      elbowR: [214, 120],
      wristR: [250, 92],
      hipL: [144, 218],
      hipR: [186, 220],
      kneeL: [140, 304],
      ankleL: [134, 384],
      toeL: [168, 392],
      kneeR: [244, 260],
      ankleR: [300, 236],
      toeR: [326, 214],
      ball: [348, 186],
    },
  },
]

/* ── Energía: trazos quebrados que salen del cuerpo hacia atrás ─────────
   Determinista (LCG con semilla por pose) para que servidor y cliente
   rendericen lo mismo. ──────────────────────────────────────────────── */
function lcg(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
}

function jointAnchors(j: Joints): Pt[] {
  return [
    add(j.head, [-14, -6]),
    j.shoulderL,
    j.elbowL,
    lerp(j.shoulderL, j.hipL, 0.5),
    j.hipL,
    j.kneeL,
    j.ankleL,
    lerp(j.hipR, j.kneeR, 0.5),
    j.kneeR,
    j.elbowR,
  ]
}

function energyStreaks(anchors: Pt[], trail: Pt, seed: number) {
  const rand = lcg(seed)
  const dir = unit(trail)
  const n = perp(dir)
  const out: { d: string; w: number; o: number; orange: boolean }[] = []
  for (const a of anchors) {
    const count = 1 + Math.floor(rand() * 2)
    for (let c = 0; c < count; c++) {
      const start = add(a, [rand() * 16 - 8, rand() * 16 - 8])
      const length = 40 + rand() * 110
      const segs = 4 + Math.floor(rand() * 3)
      let p = start
      const points: Pt[] = [p]
      for (let s = 1; s <= segs; s++) {
        const t = s / segs
        const along = mul(dir, (length / segs) * (0.7 + rand() * 0.6))
        const side = mul(n, (rand() - 0.5) * 22 * (1 - t * 0.5))
        p = add(add(p, along), side)
        points.push(p)
      }
      out.push({ d: pts(points), w: 1.2 + rand() * 2.6, o: 0.3 + rand() * 0.55, orange: rand() < 0.35 })
    }
  }
  return out
}

const VIEWBOX = '0 0 400 440'

/** Vapor: posiciones (en % de la caja) sobre cabeza y hombros, y desfase. */
const WISPS = [
  { left: 36, top: 8, delay: 0, size: 18, orange: false },
  { left: 47, top: 4, delay: 1.4, size: 22, orange: true },
  { left: 56, top: 10, delay: 2.6, size: 16, orange: false },
  { left: 41, top: 18, delay: 3.5, size: 20, orange: true },
  { left: 52, top: 16, delay: 0.8, size: 14, orange: false },
  // detrás del cuerpo (lado de la estela)
  { left: 4, top: 30, delay: 2.1, size: 26, orange: false },
  { left: 12, top: 48, delay: 0.4, size: 24, orange: true },
  { left: 2, top: 62, delay: 3.1, size: 22, orange: false },
  { left: 16, top: 72, delay: 1.7, size: 20, orange: true },
]

/** Partículas del impacto (pose 3), alrededor del balón (87 %, 42 %). */
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
      {/* Definiciones compartidas: filtros del aura y la energía, impacto. */}
      <svg width={0} height={0} className="absolute" focusable="false">
        <defs>
          <filter id="ef-aura-filter" x="-90%" y="-70%" width="280%" height="240%" colorInterpolationFilters="sRGB">
            {/* Contorno brillante: la silueta dilatada 2.5 px, apenas difusa. */}
            <feMorphology in="SourceAlpha" operator="dilate" radius="2.5" result="edge" />
            <feGaussianBlur in="edge" stdDeviation="1.4" result="edgeSoft" />
            <feFlood floodColor="#00cec8" floodOpacity="0.92" style={{ floodColor: 'var(--color-emerald)' }} result="cyan" />
            <feComposite in="cyan" in2="edgeSoft" operator="in" result="ring" />
            {/* Niebla en tres capas, de afuera hacia adentro: bruma lejana
                cian, niebla naranja y halo cian pegado al cuerpo. Cada una
                dilata la silueta, la difumina y la deforma con ruido distinto
                para que los bordes sean quebrados y orgánicos y los dos
                colores se entremezclen sin parecer un contorno. */}
            <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="3" seed="7" result="noise" />
            <feTurbulence type="fractalNoise" baseFrequency="0.013" numOctaves="2" seed="3" result="noiseWide" />
            {/* bruma lejana (cian, tenue, muy extendida) */}
            <feMorphology in="SourceAlpha" operator="dilate" radius="28" result="far" />
            <feGaussianBlur in="far" stdDeviation="34" result="farBlur" />
            <feDisplacementMap in="farBlur" in2="noiseWide" scale="140" xChannelSelector="R" yChannelSelector="G" result="farWarp" />
            <feFlood floodColor="#00cec8" floodOpacity="0.34" style={{ floodColor: 'var(--color-emerald)' }} result="cyanFar" />
            <feComposite in="cyanFar" in2="farWarp" operator="in" result="fogFar" />
            {/* niebla naranja (media) */}
            <feMorphology in="SourceAlpha" operator="dilate" radius="18" result="mid" />
            <feGaussianBlur in="mid" stdDeviation="24" result="midBlur" />
            <feDisplacementMap in="midBlur" in2="noiseWide" scale="96" xChannelSelector="G" yChannelSelector="R" result="midWarp" />
            <feFlood floodColor="#ff8c00" floodOpacity="0.46" style={{ floodColor: 'var(--color-orange)' }} result="orangeMid" />
            <feComposite in="orangeMid" in2="midWarp" operator="in" result="fogOrange" />
            {/* halo cian pegado al cuerpo */}
            <feMorphology in="SourceAlpha" operator="dilate" radius="12" result="wide" />
            <feGaussianBlur in="wide" stdDeviation="16" result="halo" />
            <feDisplacementMap in="halo" in2="noise" scale="64" xChannelSelector="R" yChannelSelector="G" result="haloWarp" />
            <feFlood floodColor="#00cec8" floodOpacity="0.68" style={{ floodColor: 'var(--color-emerald)' }} result="cyanSoft" />
            <feComposite in="cyanSoft" in2="haloWarp" operator="in" result="haloColored" />
            <feMerge>
              <feMergeNode in="fogFar" />
              <feMergeNode in="fogOrange" />
              <feMergeNode in="haloColored" />
              <feMergeNode in="ring" />
            </feMerge>
          </filter>
          <filter id="ef-streak-glow" x="-60%" y="-60%" width="220%" height="220%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation="4" result="wide" />
            <feComponentTransfer in="wide" result="wideSoft">
              <feFuncA type="linear" slope="0.9" />
            </feComponentTransfer>
            <feGaussianBlur stdDeviation="0.7" result="core" />
            <feMerge>
              <feMergeNode in="wideSoft" />
              <feMergeNode in="core" />
            </feMerge>
          </filter>
          <filter id="ef-ground-blur" x="-20%" y="-200%" width="140%" height="500%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <radialGradient id="ef-impact" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff8c00" style={{ stopColor: 'var(--color-orange)' }} stopOpacity="0.9" />
            <stop offset="45%" stopColor="#ff8c00" style={{ stopColor: 'var(--color-orange)' }} stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ff8c00" style={{ stopColor: 'var(--color-orange)' }} stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>

      {POSES.map(({ id, label, j, trail: vectorTrail }, index) => {
        const raster: RasterPose | undefined = RASTER_POSES?.[index]
        const trail: Pt = raster ? raster.trail : vectorTrail
        const anchors: Pt[] = raster ? raster.anchors : jointAnchors(j)
        const streaks = energyStreaks(anchors, trail, 1000 + id * 97)
        const feet: Pt = raster ? [raster.x + raster.w / 2, 396] : lerp(j.toeL, j.toeR, 0.5)
        // Balón para el impacto (pose 3): detectado en la imagen o, si quedó
        // pegado al cuerpo y no se pudo separar, arriba a la derecha de la figura.
        const ball: Pt = raster
          ? raster.ball
            ? [raster.ball[0], raster.ball[1]]
            : [raster.x + raster.w * 0.9, raster.y + raster.h * 0.4]
          : j.ball
        return (
          <div key={id} className={`ef-pose ef-pose-${id}`} data-pose={label}>
            {/* Energía: trazos que salen del cuerpo hacia atrás + luz de suelo. */}
            <div className="ef-energy-layer">
              <svg viewBox={VIEWBOX} className="h-full w-full overflow-visible" focusable="false">
                <ellipse cx={f(feet[0])} cy={396} rx={110} ry={9} fill="var(--color-emerald)" opacity={0.28} filter="url(#ef-ground-blur)" />
                <g fill="none" strokeLinecap="round" strokeLinejoin="round" filter="url(#ef-streak-glow)">
                  {streaks.map((s, i) => (
                    <polyline
                      key={i}
                      points={s.d}
                      stroke={s.orange ? 'var(--color-orange)' : 'var(--color-emerald)'}
                      strokeWidth={f(s.w)}
                      opacity={f(s.o)}
                    />
                  ))}
                </g>
              </svg>
            </div>
            {/* Aura: la misma silueta pasada por el filtro, en su propia capa
                para que la respiración (opacity/transform) no re-rasterice. */}
            <div className="ef-aura-layer">
              <svg viewBox={VIEWBOX} className="h-full w-full overflow-visible" focusable="false">
                {id === 3 && <circle cx={f(ball[0])} cy={f(ball[1])} r={66} fill="url(#ef-impact)" />}
                <use href={`#ef-sil-${id}`} filter="url(#ef-aura-filter)" />
              </svg>
            </div>
            <svg viewBox={VIEWBOX} className="ef-sil-layer h-full w-full overflow-visible" focusable="false">
              <g id={`ef-sil-${id}`} className="ef-sil">
                {raster ? (
                  <image
                    href={raster.src}
                    x={raster.x}
                    y={raster.y}
                    width={raster.w}
                    height={raster.h}
                    preserveAspectRatio="xMidYMax meet"
                  />
                ) : (
                  <Figure j={j} />
                )}
              </g>
              {id === 3 && (
                <g stroke="var(--color-orange)" strokeWidth={3} strokeLinecap="round" opacity={0.8}>
                  <line x1={f(ball[0] - 26)} y1={f(ball[1] + 12)} x2={f(ball[0] - 52)} y2={f(ball[1] + 20)} />
                  <line x1={f(ball[0] - 30)} y1={f(ball[1] - 4)} x2={f(ball[0] - 60)} y2={f(ball[1] - 2)} />
                  <line x1={f(ball[0] - 22)} y1={f(ball[1] - 18)} x2={f(ball[0] - 44)} y2={f(ball[1] - 32)} />
                </g>
              )}
            </svg>
            {id === 3 &&
              SPARKS.map((s, i) => (
                <span
                  key={i}
                  className="ef-spark-impact"
                  style={
                    {
                      left: `${f((ball[0] / 400) * 100)}%`,
                      top: `${f((ball[1] / 440) * 100)}%`,
                      '--dx': `${s.dx}px`,
                      '--dy': `${s.dy}px`,
                      animationDelay: `${s.delay}s`,
                    } as React.CSSProperties
                  }
                />
              ))}
          </div>
        )
      })}

      {/* Vapor que asciende desde cabeza y hombros (común a las tres poses). */}
      {WISPS.map((w, i) => (
        <span
          key={i}
          className={`ef-wisp ${w.orange ? 'ef-wisp-orange' : ''}`}
          style={{ left: `${w.left}%`, top: `${w.top}%`, width: `${w.size}%`, animationDelay: `${w.delay}s` }}
        />
      ))}
    </div>
  )
}
