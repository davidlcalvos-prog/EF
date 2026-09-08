/**
 * Genera los assets de marca de la web a partir del logo maestro
 * (apps/mobile/assets/images/elite-forge-logo.png, 1024×1024 con emblema
 * arriba y wordmark "ELITE FORGE" abajo).
 *
 * Mismo criterio que apps/mobile/scripts/generate-brand-assets.js: se mide el
 * contenido real por alfa, se recorta el emblema en el hueco más grande entre
 * bloques, y el wordmark es lo que queda debajo. Salidas en public/brand/:
 *
 *   elite-forge-emblem.png   emblema solo, transparente (tamaños chicos)
 *   elite-forge-wordmark.png "ELITE FORGE" solo, transparente
 *   elite-forge-lockup.png   emblema + wordmark en horizontal (nav, footer)
 *
 * Uso: node scripts/generate-brand-assets.js   (desde apps/web)
 */
const fs = require("fs")
const path = require("path")
const sharp = require("sharp")

const webRoot = path.join(__dirname, "..")
const repoRoot = path.join(webRoot, "..", "..")
const SOURCE_LOGO = path.join(repoRoot, "apps", "mobile", "assets", "images", "elite-forge-logo.png")
const OUT_DIR = path.join(webRoot, "public", "brand")

const ALPHA_THRESHOLD = 16
/** Alto del lockup (px). El emblema ocupa todo el alto; el wordmark, una fracción. */
const LOCKUP_HEIGHT = 256
const WORDMARK_FRACTION = 0.6
const LOCKUP_GAP = 22

async function analyze(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  const rowHasContent = new Array(height).fill(false)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * channels + 3] > ALPHA_THRESHOLD) {
        rowHasContent[y] = true
        break
      }
    }
  }
  return { width, height, rowHasContent, data, channels }
}

function boundsIn(analysis, fromRow, toRow) {
  const { width, data, channels } = analysis
  let top = -1
  let bottom = -1
  let left = width
  let right = -1
  for (let y = fromRow; y < toRow; y++) {
    let rowHas = false
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * channels + 3] > ALPHA_THRESHOLD) {
        rowHas = true
        if (x < left) left = x
        if (x > right) right = x
      }
    }
    if (rowHas) {
      if (top === -1) top = y
      bottom = y
    }
  }
  return { top, bottom, left, right }
}

/** El hueco transparente más grande entre bloques separa emblema y wordmark. */
function findBiggestGap(analysis) {
  const { rowHasContent, height } = analysis
  const gaps = []
  let gapStart = null
  let seenContent = false
  for (let y = 0; y < height; y++) {
    if (rowHasContent[y]) {
      if (gapStart !== null && seenContent) gaps.push({ start: gapStart, end: y - 1, size: y - gapStart })
      gapStart = null
      seenContent = true
    } else if (gapStart === null && seenContent) {
      gapStart = y
    }
  }
  if (gaps.length === 0) throw new Error("No se encontró el hueco emblema/wordmark — ¿cambió el logo?")
  return gaps.reduce((a, b) => (b.size > a.size ? b : a))
}

async function crop(box) {
  return sharp(SOURCE_LOGO)
    .extract({ left: box.left, top: box.top, width: box.right - box.left + 1, height: box.bottom - box.top + 1 })
    .png()
    .toBuffer()
}

async function main() {
  const analysis = await analyze(SOURCE_LOGO)
  const gap = findBiggestGap(analysis)
  const emblemBox = boundsIn(analysis, 0, gap.start)
  const wordmarkBox = boundsIn(analysis, gap.end + 1, analysis.height)

  const emblem = await crop(emblemBox)
  const wordmark = await crop(wordmarkBox)

  const emblemScaled = await sharp(emblem).resize({ height: LOCKUP_HEIGHT }).png().toBuffer()
  const wordmarkScaled = await sharp(wordmark)
    .resize({ height: Math.round(LOCKUP_HEIGHT * WORDMARK_FRACTION) })
    .png()
    .toBuffer()
  const [em, wm] = await Promise.all([sharp(emblemScaled).metadata(), sharp(wordmarkScaled).metadata()])

  const lockup = await sharp({
    create: {
      width: em.width + LOCKUP_GAP + wm.width,
      height: LOCKUP_HEIGHT,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: emblemScaled, left: 0, top: 0 },
      { input: wordmarkScaled, left: em.width + LOCKUP_GAP, top: Math.round((LOCKUP_HEIGHT - wm.height) / 2) },
    ])
    .png()
    .toBuffer()

  fs.mkdirSync(OUT_DIR, { recursive: true })
  const outputs = [
    ["elite-forge-emblem.png", emblemScaled],
    ["elite-forge-wordmark.png", wordmarkScaled],
    ["elite-forge-lockup.png", lockup],
  ]
  for (const [name, buffer] of outputs) {
    const file = path.join(OUT_DIR, name)
    fs.writeFileSync(file, buffer)
    const meta = await sharp(file).metadata()
    console.log(`${path.relative(repoRoot, file)}  ${meta.width}x${meta.height}  ${Math.round(buffer.length / 1024)} KB`)
  }
  console.log(
    `Emblema: filas ${emblemBox.top}-${emblemBox.bottom}; wordmark: filas ${wordmarkBox.top}-${wordmarkBox.bottom} (hueco ${gap.size}px)`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
