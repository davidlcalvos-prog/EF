/**
 * Post-build para `output: 'standalone'` (despliegue en Hostinger): Next.js no
 * copia `public/` ni `.next/static/` dentro de `.next/standalone/` por diseño
 * (comportamiento documentado). Con `outputFileTracingRoot` en la raíz del
 * monorepo, la salida replica la ruta relativa completa, así que el server
 * queda en `.next/standalone/apps/web/server.js` y los estáticos van al lado.
 *
 * Script de Node (no `cp` de shell) para que funcione igual en Windows
 * (desarrollo local) y Linux (build de Hostinger).
 */
const fs = require('fs')
const path = require('path')

const webRoot = path.join(__dirname, '..')
const standaloneWebRoot = path.join(webRoot, '.next', 'standalone', 'apps', 'web')

if (!fs.existsSync(standaloneWebRoot)) {
  console.error(`copy-standalone-assets: no existe ${standaloneWebRoot} — ¿el build corrió con output: 'standalone'?`)
  process.exit(1)
}

const copies = [
  {
    from: path.join(webRoot, 'public'),
    to: path.join(standaloneWebRoot, 'public'),
  },
  {
    from: path.join(webRoot, '.next', 'static'),
    to: path.join(standaloneWebRoot, '.next', 'static'),
  },
]

for (const { from, to } of copies) {
  if (!fs.existsSync(from)) {
    console.warn(`copy-standalone-assets: ${from} no existe, se omite`)
    continue
  }
  fs.cpSync(from, to, { recursive: true })
  console.log(`copy-standalone-assets: ${path.relative(webRoot, from)} -> ${path.relative(webRoot, to)}`)
}
