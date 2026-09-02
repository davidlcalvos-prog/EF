/**
 * Identidad de marca — genera TODOS los íconos de la app (mobile + web) a
 * partir del logo fuente. Reproducible: si cambia el logo, correr
 * `npm run generate:brand` (desde apps/mobile) y se regenera todo.
 *
 * Decisión de diseño: los íconos chicos usan SOLO el emblema (escudo + pelota),
 * sin la franja de texto "ELITE FORGE" — a 32 px el texto es ilegible. El logo
 * completo con texto se usa únicamente en el splash.
 *
 * El recorte del emblema NO usa coordenadas mágicas: se mide el alfa del PNG
 * fila por fila y se busca el hueco transparente que separa el emblema del
 * bloque de texto inferior; luego se ajusta el bounding box por columnas.
 */
const fs = require("fs")
const path = require("path")
const sharp = require("sharp")

const CARBON = "#424242"
const mobileRoot = path.join(__dirname, "..")
const repoRoot = path.join(mobileRoot, "..", "..")
const SOURCE_LOGO = path.join(mobileRoot, "assets", "images", "elite-forge-logo.png")
const mobileImages = path.join(mobileRoot, "assets", "images")
const webApp = path.join(repoRoot, "apps", "web", "app")

/** Perfil de alfa por fila y por columna del PNG (para medir contenido real). */
async function analyze(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  const rowHasContent = new Array(height).fill(false)
  const colHasContent = new Array(width).fill(false)
  const THRESHOLD = 16 // alfa mínimo para considerar "contenido"
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * channels + 3]
      if (alpha > THRESHOLD) {
        rowHasContent[y] = true
        colHasContent[x] = true
      }
    }
  }
  return { width, height, rowHasContent, colHasContent, data, channels }
}

/** Bounding box de contenido dentro de un rango de filas. */
function boundsIn(analysis, fromRow, toRow) {
  const { width, data, channels } = analysis
  let top = -1
  let bottom = -1
  let left = width
  let right = -1
  for (let y = fromRow; y < toRow; y++) {
    let rowHas = false
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * channels + 3] > 16) {
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

/**
 * Filas donde termina el emblema: el hueco transparente MÁS GRANDE entre
 * bloques de contenido (separa el emblema del texto "ELITE FORGE").
 */
function findEmblemRowRange(analysis) {
  const { rowHasContent, height } = analysis
  const gaps = []
  let gapStart = null
  let seenContent = false
  for (let y = 0; y < height; y++) {
    if (rowHasContent[y]) {
      if (gapStart !== null && seenContent) {
        gaps.push({ start: gapStart, end: y - 1, size: y - gapStart })
      }
      gapStart = null
      seenContent = true
    } else if (gapStart === null && seenContent) {
      gapStart = y
    }
  }
  if (gaps.length === 0) {
    throw new Error("No se encontró el hueco emblema/texto — ¿cambió el layout del logo?")
  }
  const biggest = gaps.reduce((a, b) => (b.size > a.size ? b : a))
  const firstContent = rowHasContent.indexOf(true)
  return { top: firstContent, bottom: biggest.start - 1 }
}

/** Recorta el emblema (sin texto) a su bounding box exacto. */
async function extractEmblem() {
  const analysis = await analyze(SOURCE_LOGO)
  const rows = findEmblemRowRange(analysis)
  const box = boundsIn(analysis, rows.top, rows.bottom + 1)
  const emblem = await sharp(SOURCE_LOGO)
    .extract({
      left: box.left,
      top: box.top,
      width: box.right - box.left + 1,
      height: box.bottom - box.top + 1,
    })
    .png()
    .toBuffer()
  return { emblem, box }
}

/** Bounding box del logo COMPLETO (para el splash). */
async function extractFullLogo() {
  const analysis = await analyze(SOURCE_LOGO)
  const box = boundsIn(analysis, 0, analysis.height)
  return sharp(SOURCE_LOGO)
    .extract({
      left: box.left,
      top: box.top,
      width: box.right - box.left + 1,
      height: box.bottom - box.top + 1,
    })
    .png()
    .toBuffer()
}

/** Emblema centrado en lienzo cuadrado `size`, ocupando `fraction` del lado. */
async function emblemOnSquare(emblem, size, fraction, background, keepAlphaChannel) {
  const target = Math.round(size * fraction)
  const scaled = await sharp(emblem)
    .resize(target, target, { fit: "inside" })
    .png()
    .toBuffer()
  let img = sharp({
    create: { width: size, height: size, channels: 4, background },
  }).composite([{ input: scaled, gravity: "centre" }])
  img = img.png()
  const buffer = await img.toBuffer()
  if (!keepAlphaChannel) {
    return sharp(buffer).flatten({ background }).removeAlpha().png().toBuffer()
  }
  return buffer
}

/**
 * Foreground adaptativo de Android: el sistema recorta hasta un círculo
 * central del ~66% del lienzo — el emblema entero (su DIAGONAL) tiene que
 * caber dentro de ese círculo, con margen.
 */
async function adaptiveForeground(emblem, size) {
  const meta = await sharp(emblem).metadata()
  const safeRadius = (size * 0.66) / 2
  const margin = 0.92 // 8% de aire dentro del círculo
  const diag = Math.sqrt(meta.width ** 2 + meta.height ** 2)
  const scale = (2 * safeRadius * margin) / diag
  const w = Math.round(meta.width * scale)
  const h = Math.round(meta.height * scale)
  const scaled = await sharp(emblem).resize(w, h).png().toBuffer()
  return sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: scaled, gravity: "centre" }])
    .png()
    .toBuffer()
}

/** Silueta blanca sobre transparente (solo canal alfa) para notificaciones. */
async function whiteSilhouette(emblem, size) {
  const fraction = 0.9
  const target = Math.round(size * fraction)
  const { data, info } = await sharp(emblem)
    .resize(target, target, { fit: "inside" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  for (let i = 0; i < data.length; i += info.channels) {
    data[i] = 255
    data[i + 1] = 255
    data[i + 2] = 255
  }
  const white = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  })
    .png()
    .toBuffer()
  return sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: white, gravity: "centre" }])
    .png()
    .toBuffer()
}

async function main() {
  const { emblem, box } = await extractEmblem()
  console.log(
    `Emblema medido: filas ${box.top}-${box.bottom}, columnas ${box.left}-${box.right} ` +
      `(${box.right - box.left + 1}x${box.bottom - box.top + 1})`,
  )

  const outputs = []
  const write = async (filePath, buffer) => {
    fs.writeFileSync(filePath, buffer)
    const meta = await sharp(filePath).metadata()
    outputs.push(
      `${path.relative(repoRoot, filePath)}  ${meta.width}x${meta.height}  ` +
        `${meta.hasAlpha ? "RGBA" : "RGB"}`,
    )
  }

  // --- Mobile: íconos de app ---
  await write(
    path.join(mobileImages, "app-icon-all.png"),
    await emblemOnSquare(emblem, 1024, 0.7, CARBON, false),
  )
  await write(
    path.join(mobileImages, "app-icon-ios.png"),
    await emblemOnSquare(emblem, 1024, 0.7, CARBON, false),
  )
  await write(
    path.join(mobileImages, "app-icon-android-legacy.png"),
    await emblemOnSquare(emblem, 1024, 0.7, CARBON, false),
  )
  await write(
    path.join(mobileImages, "app-icon-android-adaptive-foreground.png"),
    await adaptiveForeground(emblem, 1024),
  )
  await write(
    path.join(mobileImages, "app-icon-android-adaptive-background.png"),
    await sharp({ create: { width: 1024, height: 1024, channels: 4, background: CARBON } })
      .flatten({ background: CARBON })
      .removeAlpha()
      .png()
      .toBuffer(),
  )
  await write(
    path.join(mobileImages, "app-icon-web-favicon.png"),
    await emblemOnSquare(emblem, 64, 0.8, CARBON, false),
  )
  await write(
    path.join(mobileImages, "notification-icon.png"),
    await whiteSilhouette(emblem, 96),
  )

  // --- Mobile: splash (logo COMPLETO, con texto — acá hay espacio) ---
  const fullLogo = await extractFullLogo()
  const splash = await sharp(fullLogo).resize(1024, null, { fit: "inside" }).png().toBuffer()
  await write(path.join(mobileImages, "splash-logo.png"), splash)

  // --- Web: favicon / apple icon (convención de metadata de App Router) ---
  await write(path.join(webApp, "icon.png"), await emblemOnSquare(emblem, 512, 0.8, CARBON, false))
  await write(
    path.join(webApp, "apple-icon.png"),
    await emblemOnSquare(emblem, 180, 0.8, CARBON, false),
  )

  console.log("\nGenerado:")
  for (const line of outputs) console.log("  " + line)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
