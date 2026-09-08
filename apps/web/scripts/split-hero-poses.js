/**
 * Separa las tres siluetas de futbolista de una ilustración (figuras negras
 * sobre fondo blanco o transparente, con trazos de energía alrededor) y las
 * deja listas para el hero:
 *
 *   public/hero/pose-1.png … pose-3.png     silueta recortada, fondo alfa,
 *                                            ordenadas de izquierda a derecha
 *   components/landing/hero-poses.generated.ts
 *                                            ubicación de cada una en el
 *                                            viewBox 400×440 del hero, puntos
 *                                            del borde trasero (anclas de los
 *                                            trazos de energía) y balón
 *
 * Cómo decide qué es "silueta": píxeles oscuros (luminancia < DARK). Los
 * trazos de energía de la ilustración son de color (cian/naranja) y quedan
 * fuera; el aura la vuelve a poner el SVG del hero. Las líneas de color
 * DENTRO del cuerpo se conservan: un cierre morfológico (dilatar + erosionar)
 * rellena esos huecos y el recorte copia el píxel original, así que la
 * silueta sale negra con sus vetas cian/naranja.
 *
 * Uso (desde apps/web):
 *   node scripts/split-hero-poses.js <ruta/a/la/ilustracion.png>
 *   node scripts/split-hero-poses.js            (usa public/hero/source.png)
 */
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const webRoot = path.join(__dirname, '..')
const input = path.resolve(process.argv[2] || path.join(webRoot, 'public', 'hero', 'source.png'))
const OUT_DIR = path.join(webRoot, 'public', 'hero')
const GEN = path.join(webRoot, 'components', 'landing', 'hero-poses.generated.ts')

/**
 * Luminancia máxima para considerar "tinta". Con fondo blanco alcanza 96;
 * si la ilustración viene sobre fondo oscuro con glow, bajar (--dark=40):
 * las figuras son negro puro y el fondo negro se descarta aparte porque
 * toca el borde de la imagen.
 */
const DARK = Number((process.argv.find((a) => a.startsWith('--dark=')) || '').split('=')[1]) || 96
const CLOSE_R = 5 // radio del cierre morfológico (rellena vetas de color dentro del cuerpo)
const MIN_AREA_RATIO = 0.0004 // componentes más chicos que esto son ruido
const PAD = 14 // aire alrededor del recorte, en px de la imagen original
/** Caja del hero: viewBox 400×440, suelo en y=396, alto máximo de figura 372. */
const VIEW = { w: 400, h: 440, ground: 396, maxH: 372, maxW: 340 }
const TRAILS = [
  [-0.85, 0.4],
  [-1, 0.12],
  [-0.9, 0.3],
]
const ANCHOR_ROWS = 12

function luminance(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

/** Dilatación/erosión con elemento cuadrado, separable (horizontal + vertical). */
function morph(mask, w, h, r, dilate) {
  const pass = (src, dst, stepX, stepY, length, count) => {
    for (let i = 0; i < count; i++) {
      for (let j = 0; j < length; j++) {
        let hit = dilate ? 0 : 1
        for (let k = -r; k <= r; k++) {
          const jj = j + k
          if (jj < 0 || jj >= length) {
            if (!dilate) hit = 0
            continue
          }
          const v = src[(stepX === 1 ? i * w + jj : jj * w + i)]
          if (dilate ? v : !v) {
            hit = dilate ? 1 : 0
            break
          }
        }
        dst[stepX === 1 ? i * w + j : j * w + i] = hit
      }
    }
  }
  const tmp = new Uint8Array(w * h)
  const out = new Uint8Array(w * h)
  pass(mask, tmp, 1, 0, w, h) // filas
  pass(tmp, out, 0, 1, h, w) // columnas
  return out
}

/** Componentes conexas (4-vecinos) sobre la máscara. */
function components(mask, w, h) {
  const labels = new Int32Array(w * h).fill(-1)
  const comps = []
  const stack = new Int32Array(w * h)
  for (let start = 0; start < w * h; start++) {
    if (!mask[start] || labels[start] !== -1) continue
    const id = comps.length
    const c = { id, area: 0, minX: w, minY: h, maxX: 0, maxY: 0, sumX: 0, sumY: 0 }
    let sp = 0
    stack[sp++] = start
    labels[start] = id
    while (sp > 0) {
      const p = stack[--sp]
      const x = p % w
      const y = (p - x) / w
      c.area++
      c.sumX += x
      c.sumY += y
      if (x < c.minX) c.minX = x
      if (x > c.maxX) c.maxX = x
      if (y < c.minY) c.minY = y
      if (y > c.maxY) c.maxY = y
      const nb = [p - 1, p + 1, p - w, p + w]
      if (x === 0) nb[0] = -1
      if (x === w - 1) nb[1] = -1
      for (const q of nb) {
        if (q < 0 || q >= w * h || !mask[q] || labels[q] !== -1) continue
        labels[q] = id
        stack[sp++] = q
      }
    }
    comps.push(c)
  }
  return { labels, comps }
}

function distToBox(px, py, b) {
  const dx = Math.max(b.minX - px, 0, px - b.maxX)
  const dy = Math.max(b.minY - py, 0, py - b.maxY)
  return Math.hypot(dx, dy)
}

async function main() {
  if (!fs.existsSync(input)) {
    console.error(`No existe ${input}. Guardá la ilustración ahí o pasá la ruta como argumento.`)
    process.exit(1)
  }
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h, channels } = info

  // 1) Máscara de tinta oscura.
  const raw = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) {
    const o = i * channels
    if (data[o + 3] < 128) continue
    if (luminance(data[o], data[o + 1], data[o + 2]) < DARK) raw[i] = 1
  }
  // 2) Cierre: rellena las vetas de color dentro del cuerpo.
  const mask = morph(morph(raw, w, h, CLOSE_R, true), w, h, CLOSE_R, false)

  // 3) Componentes; las 3 más grandes son los cuerpos, el resto se asigna al más cercano.
  const { labels, comps } = components(mask, w, h)
  const minArea = MIN_AREA_RATIO * w * h
  const touchesBorder = (c) => c.minX === 0 || c.minY === 0 || c.maxX === w - 1 || c.maxY === h - 1
  const valid = comps
    .filter((c) => c.area >= minArea)
    .filter((c) => {
      // Fondo oscuro (ilustraciones con glow): las manchas negras del fondo
      // tocan el borde de la imagen; una figura entera, no.
      if (touchesBorder(c) && c.area > 0.02 * w * h) {
        console.log(`descartado: mancha de ${c.area} px que toca el borde (fondo)`)
        return false
      }
      return true
    })
    .sort((a, b) => b.area - a.area)
  if (valid.length < 3) {
    console.error(`Encontré ${valid.length} figuras y hacen falta 3. ¿Es una imagen de siluetas oscuras sobre claro?`)
    process.exit(1)
  }
  const bodies = valid.slice(0, 3).map((c) => ({ body: c, parts: [c] }))
  for (const c of valid.slice(3)) {
    const cx = c.sumX / c.area
    const cy = c.sumY / c.area
    let best = bodies[0]
    let bestD = Infinity
    for (const g of bodies) {
      const d = distToBox(cx, cy, g.body)
      if (d < bestD) {
        bestD = d
        best = g
      }
    }
    best.parts.push(c)
  }
  bodies.sort((a, b) => a.body.minX - b.body.minX) // izquierda → derecha = pose 1, 2, 3

  fs.mkdirSync(OUT_DIR, { recursive: true })
  const generated = []

  for (let idx = 0; idx < bodies.length; idx++) {
    const g = bodies[idx]
    const ids = new Set(g.parts.map((p) => p.id))
    const box = g.parts.reduce(
      (b, p) => ({
        minX: Math.min(b.minX, p.minX),
        minY: Math.min(b.minY, p.minY),
        maxX: Math.max(b.maxX, p.maxX),
        maxY: Math.max(b.maxY, p.maxY),
      }),
      { minX: w, minY: h, maxX: 0, maxY: 0 },
    )
    const x0 = Math.max(0, box.minX - PAD)
    const y0 = Math.max(0, box.minY - PAD)
    const x1 = Math.min(w - 1, box.maxX + PAD)
    const y1 = Math.min(h - 1, box.maxY + PAD)
    const cw = x1 - x0 + 1
    const ch = y1 - y0 + 1

    // 4) Recorte RGBA: píxel original donde hay silueta, transparente afuera.
    const out = Buffer.alloc(cw * ch * 4)
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        const src = (y0 + y) * w + (x0 + x)
        const dst = (y * cw + x) * 4
        if (mask[src] && ids.has(labels[src])) {
          const o = src * channels
          // Dentro del cuerpo se conservan las vetas cian/naranja, pero un
          // píxel casi blanco (brillo del glow que quedó encerrado) sería un
          // agujero blanco en la silueta: se pinta de negro.
          const bright = luminance(data[o], data[o + 1], data[o + 2]) > 190
          out[dst] = bright ? 0 : data[o]
          out[dst + 1] = bright ? 0 : data[o + 1]
          out[dst + 2] = bright ? 0 : data[o + 2]
          out[dst + 3] = 255
        }
      }
    }
    const file = `pose-${idx + 1}.png`
    await sharp(out, { raw: { width: cw, height: ch, channels: 4 } })
      .png({ compressionLevel: 9 })
      .toFile(path.join(OUT_DIR, file))

    // 5) Ubicación en el viewBox del hero: pies al suelo, centrada.
    const scale = Math.min(VIEW.maxH / ch, VIEW.maxW / cw)
    const vw = cw * scale
    const vh = ch * scale
    const vx = (VIEW.w - vw) / 2
    const vy = VIEW.ground - vh
    const toView = (px, py) => [+(vx + (px / cw) * vw).toFixed(1), +(vy + (py / ch) * vh).toFixed(1)]

    // 6) Anclas: borde trasero (izquierdo) del cuerpo, en filas repartidas.
    const anchors = []
    for (let r = 0; r < ANCHOR_ROWS; r++) {
      const py = Math.round(g.body.minY + ((g.body.maxY - g.body.minY) * (r + 0.5)) / ANCHOR_ROWS)
      for (let px = g.body.minX; px <= g.body.maxX; px++) {
        const i = py * w + px
        if (mask[i] && labels[i] === g.body.id) {
          anchors.push(toView(px - x0, py - y0))
          break
        }
      }
    }

    // 7) Balón: componente casi cuadrada y bien llena, separada del cuerpo.
    let ball = null
    for (const p of g.parts) {
      if (p === g.body) continue
      const bw = p.maxX - p.minX + 1
      const bh = p.maxY - p.minY + 1
      const aspect = bw / bh
      const fill = p.area / (bw * bh)
      const size = bh / (g.body.maxY - g.body.minY + 1)
      if (aspect > 0.8 && aspect < 1.25 && fill > 0.6 && fill < 0.92 && size > 0.06) {
        const c = toView(p.sumX / p.area - x0, p.sumY / p.area - y0)
        const cand = [c[0], c[1], +((bw / 2) * scale).toFixed(1)]
        if (!ball || cand[2] > ball[2]) ball = cand
      }
    }

    generated.push({
      src: `/hero/${file}`,
      width: cw,
      height: ch,
      x: +vx.toFixed(1),
      y: +vy.toFixed(1),
      w: +vw.toFixed(1),
      h: +vh.toFixed(1),
      anchors,
      ball,
      trail: TRAILS[idx],
    })
    console.log(
      `${file}  ${cw}x${ch}  partes=${g.parts.length}  balón=${ball ? 'sí' : 'no'}  → viewBox x=${vx.toFixed(0)} y=${vy.toFixed(0)} ${vw.toFixed(0)}x${vh.toFixed(0)}`,
    )
  }

  const ts = `// GENERADO por scripts/split-hero-poses.js a partir de la ilustración de las
// tres poses — no editar a mano; volver a correr el script si cambia la imagen.
// Coordenadas en el viewBox 400×440 del hero (components/landing/hero-player.tsx).

export interface RasterPose {
  /** Ruta pública del PNG con alfa. */
  src: string
  /** Tamaño natural del PNG, en px. */
  width: number
  height: number
  /** Ubicación en el viewBox del hero. */
  x: number
  y: number
  w: number
  h: number
  /** Puntos del borde trasero del cuerpo: de ahí salen los trazos de energía. */
  anchors: [number, number][]
  /** Centro y radio del balón en el viewBox, si se detectó separado del cuerpo. */
  ball: [number, number, number] | null
  /** Dirección de los trazos (sentido contrario al movimiento). */
  trail: [number, number]
}

export const RASTER_POSES: RasterPose[] | null = ${JSON.stringify(generated, null, 2)}
`
  fs.writeFileSync(GEN, ts)
  console.log(`→ ${path.relative(webRoot, GEN)}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
