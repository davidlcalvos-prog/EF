# Elite Forge — Documentación Frontend Web

Registro técnico del portal web en el monorepo `EF`.  
Producto / negocio: [ELITE_FORGE.md](./ELITE_FORGE.md) · App móvil: [FRONTEND.md](./FRONTEND.md) · Backend NestJS: [BACKEND.md](./BACKEND.md).

README del paquete: [`apps/web/README.md`](../apps/web/README.md).

---

## Overview

El frontend web vive en **`apps/web/`** (workspace npm `@ef/web`). Canales:

| Canal | Qué hace |
|-------|----------|
| **Landing** | Marketing del producto |
| **Auth público** | Registro e inicio de sesión de jugadores |
| **Portal admin B2B** | Dueños de cancha (Empresario) y panel admin plataforma |

Los jugadores usan principalmente la **app móvil**. La web sirve como landing, onboarding y panel B2B.

### Estado actual

| Área | Estado |
|------|--------|
| Landing | Implementada |
| `/auth/sign-up` · `/auth/login` | NestJS `auth/register` · `auth/login` |
| Portal admin | Cookie `ef_token` + roles NestJS |
| Resumen | Ocupación en vivo por tamaño real de cancha (API) |
| Reservas | Calendario Día/Semana/Mes — 100% API (aprobación, teléfono, reasignar cancha) |
| Mi cancha | Identidad + canchas (`Court`) por tamaño y precio propio + ubicación con pin — todo API |
| Analíticas | Dashboard ocupación y clientes (frontend) |
| Torneos | Crear, agenda, equipos, partidos, rankings (localStorage) |
| Métricas (Administrador) | Placeholder |
| Supabase | **Eliminado** — auth vía NestJS + PostgreSQL |

### Producción y desarrollo

| Concepto | Valor |
|----------|-------|
| URL pública | https://eliteforge.tech (+ `www`) |
| Hosting | VPS (Docker Compose + Caddy, junto al backend — Fase W.5) |
| Dev local | http://localhost:5175 |
| Idioma | Español (`lang="es"`) |

### Rol en el ecosistema

```
Jugador (web)                    Empresario / Administrador
      │                                      │
      ▼                                      ▼
  /auth/sign-up                    /admin/login
  /auth/login                            │
      │                                  │ cookie ef_token
      └──────────────┬───────────────────┘
                     ▼
            API Gateway (:3000/api)
                     │
         auth-service · venues-service
                     │
              PostgreSQL (Prisma)
```

Registro móvil → web:

| Entorno | `SIGN_UP_URL` |
|---------|---------------|
| Dev | `http://localhost:5175/auth/sign-up` |
| Prod | `https://eliteforge.tech/auth/sign-up` |

> Código activo solo en **`apps/web/`**.

---

## Stack tecnológico

| Capa | Tecnología | Notas |
|------|------------|-------|
| Framework | Next.js App Router | 16.2.6 |
| UI | React 19 | |
| Lenguaje | TypeScript | 5.7.3 |
| Estilos | Tailwind CSS 4.2 | |
| Componentes | shadcn/ui + `@base-ui/react` | |
| Iconos | Lucide React | |
| Gráficos | Recharts | Métricas aún placeholder |
| Auth / datos | NestJS API Gateway + Prisma | Sin Supabase |
| Analytics | Vercel Analytics | Solo production |

### Dependencias principales

| Paquete | Uso |
|---------|-----|
| `next`, `react`, `react-dom` | App y SSR |
| `tailwindcss`, `@tailwindcss/postcss` | Estilos |
| `class-variance-authority`, `clsx`, `tailwind-merge` | Variantes UI |
| `lucide-react` | Iconos |
| `recharts` | Preparado para métricas |
| `@vercel/analytics` | Telemetría prod |
| `leaflet`, `react-leaflet`, `@types/leaflet` | Mapa con pin arrastrable para la ubicación de la cancha (Fase L.0) — OpenStreetMap, sin API key |

---

## Estructura del proyecto

```
apps/web/
├── app/
│   ├── page.tsx                         # Landing
│   ├── layout.tsx                       # Fuentes, tema dark, Analytics
│   ├── globals.css
│   ├── auth/                            # login, sign-up, confirmed, error
│   ├── admin/
│   │   ├── login/page.tsx               # Login B2B
│   │   └── (portal)/                    # Requiere sesión
│   │       ├── layout.tsx               # Sidebar / nav móvil
│   │       ├── page.tsx                 # Resumen
│   │       ├── reservas/
│   │       ├── mi-cancha/
│   │       ├── analiticas/
│   │       ├── torneos/
│   │       └── metricas/                # Solo Administrador
│   └── api/session/                     # Cookie ef_token login/logout
├── components/
│   ├── ui/
│   ├── landing/
│   ├── logo.tsx                         # Solo imagen (sin <a> interno)
│   └── admin/
│       ├── sidebar.tsx                  # Nav Empresario / Administrador
│       ├── owner-summary.tsx            # Resumen ocupación en vivo
│       ├── reservations-calendar.tsx
│       ├── add-reservation-modal.tsx
│       ├── venue-settings-form.tsx
│       ├── analytics-dashboard.tsx
│       ├── tournaments-dashboard.tsx
│       ├── tournament-detail.tsx
│       └── tournament-rankings-modal.tsx
├── lib/
│   ├── api/                             # client, server-client, auth
│   ├── admin/                           # roles, session
│   ├── dal/admin/
│   │   ├── types.ts
│   │   ├── venues.ts · reservations.ts
│   │   ├── mock-reservations.ts         # Demo UI calendario
│   │   ├── venue-extras.ts              # Inventario / tarifas locales
│   │   ├── analytics.ts                 # Agregaciones analíticas
│   │   └── tournaments.ts               # Modelo torneos + fixture
│   ├── auth/constants.ts                # ef_token
│   └── theme/elite-forge.ts
├── middleware.ts
├── next.config.mjs                      # Rewrites + Cache-Control + output standalone
├── package.json
└── .env.example
```

---

## Sistema de diseño

Tokens (`lib/theme/elite-forge.ts`):

| Token | Hex | Uso |
|-------|-----|-----|
| `emerald` | `#00CEC8` | Primario, confirmadas, libres |
| `orange` | `#FF8C00` | Acento, canceladas, ocupadas |
| `carbon` | `#424242` | Fondo / themeColor |
| `white` | `#FFFFFF` | Texto |
| `muted` | `#9C9C9C` | Secundario |

### Tipografía

| Rol | Fuente | CSS |
|-----|--------|-----|
| Títulos | Space Grotesk | `font-heading` |
| Cuerpo | Inter | |
| Mono | Geist Mono | |

Tema **dark** por defecto (`class="dark"` en `<html>`).

---

## Rutas

### Públicas

| Ruta | Descripción |
|------|-------------|
| `/` | Landing |
| `/auth/sign-up` | Registro jugador → NestJS |
| `/auth/login` | Login jugador |
| `/auth/confirmed` | Post-registro |
| `/auth/error` | Error auth |
| `/dashboard` | Middleware → `/` |

### Portal admin

| Ruta | Rol | Descripción |
|------|-----|-------------|
| `/admin/login` | Público | Login B2B |
| `/admin` | Ambos | Resumen (Empresario: ocupación; Admin: CTA métricas) |
| `/admin/reservas` | Empresario | Calendario de reservas |
| `/admin/mi-cancha` | Empresario | Inventario, tarifas, servicios |
| `/admin/analiticas` | Empresario | Ocupación y clientes |
| `/admin/torneos` | Empresario | Gestión de torneos |
| `/admin/metricas` | Administrador | Placeholder KPIs |

Sin cookie `ef_token`, `/admin/*` (excepto login) → `/admin/login`.

---

## Autenticación y sesión

1. Cliente → `lib/api/auth.ts` → `NEXT_PUBLIC_API_URL` (`/api/...`).
2. Rewrite `/api/:path*` → `API_GATEWAY_URL/api/:path*`.
3. Admin válido → `POST /api/session/login` → cookie **`ef_token`**.
4. Middleware protege `/admin`.
5. Server Components: `apiFetchAuth` con Bearer.

### Roles (`lib/admin/roles.ts`)

| Rol | Home | Navegación |
|-----|------|------------|
| `Administrador` | `/admin/metricas` | Resumen, Métricas |
| `Empresario` | `/admin/reservas` | Resumen, Reservas, Mi cancha, Analíticas, Torneos |

### Demo seed (`apps/backend`)

| Email | Password | Rol |
|-------|----------|-----|
| `admin@eliteforge.com` | `Admin123!` | Empresario |
| `jugador.demo@eliteforge.com` | `Demo123!` | Jugador |

También: **Cancha Elite Demo** + reservas ejemplo.

### Registro público

Campos: nombre, email, contraseña ×2 → `{ name, email, password }` → `/auth/confirmed`.

---

## Persistencia local (browser)

**El portal ya no usa `localStorage` para nada de canchas ni reservas** (Fase W.1). Hasta esa fase, `lib/dal/admin/mock-reservations.ts` y `venue-extras.ts` guardaban inventario por tamaño, tarifas, amenities, reservas telefónicas y ediciones directo en el navegador del dueño — ambos archivos se eliminaron por completo. Motivo: esos datos se perdían al cambiar de navegador o de equipo, y el mobile nunca los veía (el jugador reservaba contra un inventario que no existía del lado del dueño). Todo — canchas, precios, reservas, su estado y su origen — vive en Postgres desde entonces (`Court`, `Reservation`, ver [BACKEND.md](./BACKEND.md#modelos-nuevos-desde-el-1808)).

**Nota:** en el mismo rediseño se perdió sin querer la sección de servicios del complejo (cafetería, transferencias, baños) — descope no intencional, recuperado el 2026-08-31: la sección "Servicios" volvió a "Mi cancha", ahora guardando en `Venue.amenities` (Postgres) en vez de `localStorage`, y el jugador la ve en mobile antes de reservar (ver [BACKEND.md](./BACKEND.md#venues--venues-service)).

Lo que sigue siendo `localStorage` (fuera del alcance de la Fase W.1, sin cambios):

| Clave `localStorage` | Contenido |
|----------------------|-----------|
| `ef-admin-tournaments` | Torneos completos |
| `ef-admin-tournament-reservations` | Bloques de cancha del fixture en calendario |

---

## Portal admin — pantallas

### Navegación (`sidebar.tsx`)

- **Desktop (`lg+`):** sidebar izquierda.
- **Móvil/tablet:** barra superior con los mismos links.
- `Logo` es solo imagen; el enlace lo pone un `Link` externo (evita `<a>` anidado / hidratación rota).

### Resumen (`/admin`) — `owner-summary.tsx`

Empresario:

| Bloque | Contenido |
|--------|-----------|
| Ocupación ahora | Totales + desglose 6/8/11; refresh cada 30 s |
| Inventario | Desde `venue-extras` (Mi cancha) |
| Operación | Complejos, pendientes, confirmadas |
| Accesos | Calendario, Mi cancha, Analíticas |

Administrador: saludo + CTA a Métricas.

### Reservas (`/admin/reservas`) — `reservations-calendar.tsx`

| Elemento | Comportamiento |
|----------|----------------|
| Vistas | Día / Semana / Mes |
| Timeline | 8 AM – 10 PM |
| Filtro | Por cancha específica del complejo, además de "todas" |
| Chip | Nombre; color por estado; ícono de origen (app / teléfono / torneo / bloqueo) |
| Reservas de la app (`source: app`) | Nacen `pending` — el modal tiene **Confirmar** / **Rechazar** (Fase W.1) |
| Reservas telefónicas (`source: phone`) | Las carga el dueño desde "Nueva reserva telefónica" con nombre y teléfono del cliente; nacen `confirmed` directo |
| Reasignar cancha | Botón en el detalle de una reserva de la app: lista canchas **activas del mismo tamaño**, marca cuáles están libres en ese horario contra las reservas ya cargadas, y llama `PATCH /api/venues/reservations/:id/court` — rechaza tamaño distinto u ocupada (Fase W.1.1) |
| Fuentes | 100% API — canchas reales, reservas de la app, telefónicas y de torneos |
| Colores | Confirmada `#00CEC8` · Pendiente gris · Cancelada `#FF8C00` |

### Mi cancha (`/admin/mi-cancha`) — `venue-settings-form.tsx`

| Sección | Persistencia |
|---------|--------------|
| Nombre / dirección | API `saveVenue` |
| Ubicación (Fase L.0) | Buscador de municipio (centroide) o pin arrastrable sobre mapa — `VenueLocationMap` (Leaflet + OpenStreetMap, sin API key, `next/dynamic` con `ssr:false` porque Leaflet toca `window`) |
| Canchas (`Court`) | `VenueCourtsSection` — alta/edición/baja de canchas individuales: nombre, **tamaño**, **precio propio por hora**, superficie (opcional, hereda la del complejo si no se define), activa/inactiva. Reemplaza el inventario 6/8/11 con tarifas por formato de antes de la Fase W.1 |
| Servicios | Checkboxes Cafetería / Transferencias / Baños (misma lista que el `venue-extras.ts` pre-W.1) — API `saveVenue` → `Venue.amenities`; el jugador los ve en mobile antes de reservar |

### Analíticas (`/admin/analiticas`) — `analytics-dashboard.tsx`

| Bloque | Contenido |
|--------|-----------|
| KPIs | Activas, canceladas, clientes únicos |
| Días más / menos ocupados | Top/bottom 3 + horarios pico |
| Horarios | Franjas 8 AM–10 PM más/menos demandadas |
| Clientes | Frecuencia, % cancelación, cumplimiento |

Fuente: mismas reservas que el calendario (API + demo + locales).

### Torneos (`/admin/torneos`)

Archivos: `tournaments-dashboard.tsx`, `tournament-detail.tsx`, `tournament-rankings-modal.tsx`, `lib/dal/admin/tournaments.ts`.

| Capacidad | Detalle |
|-----------|---------|
| Formato cancha | 6vs6 / 8vs8 / 11vs11 |
| Roster | Titulares en cancha **+ 4** suplentes |
| Cupo | Máx. **16** equipos |
| Modalidades | Grupos de 4 · Todos contra todos (top 4) · Llaves |
| Agenda | Días lun–dom + franja (default mié/jue 18–22) + 1 o 2 canchas |
| Fixture | Aleatorio / intercalado; evita (si puede) 2 partidos del mismo equipo el mismo día |
| Reservas auto | Sync a calendario al generar fixture |
| Equipos | Alta manual; **no se borran** al regenerar partidos |
| Partido | Fecha, resultado, W (walkover), goles, GC (porteros), TA/TR |
| Rankings (podio 1–5) | **Goleadores** · **Valla menos vencida** |
| Tabla | PJ / PG / PE / PP / PPW / GF / GC / Pts |

Pestañas del detalle: Configuración · Equipos · Tabla · Partidos.

### Métricas (`/admin/metricas`)

Placeholder “próximamente” (rol Administrador).

---

## Integración API Gateway

```
/api/*  →  ${API_GATEWAY_URL}/api/*
```

| Uso | Endpoint |
|-----|----------|
| Registro | `POST /api/auth/register` |
| Login | `POST /api/auth/login` |
| Sesión | `GET /api/auth/me` |
| Venues / reservas | `/api/venues/...` |

Detalle: [BACKEND.md](./BACKEND.md).

---

## Variables de entorno

`apps/web/.env.example` → `.env.local`:

```env
API_GATEWAY_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_SITE_URL=http://localhost:5175
```

| Variable | Uso |
|----------|-----|
| `API_GATEWAY_URL` | Rewrite y fetches server |
| `NEXT_PUBLIC_API_URL` | Base browser (`/api`) |
| `NEXT_PUBLIC_SITE_URL` | URL canónica |
| `NEXT_PUBLIC_BUILD_ID` | Opcional en build |

### Caché (`next.config.mjs`)

- HTML / rutas dinámicas: `Cache-Control: no-store`.
- **Producción:** `/_next/static` immutable (`max-age` largo).
- **Desarrollo:** sin header immutable en static (Turbopack reutiliza nombres de chunk; el browser podría servir JS viejo).

---

## Cómo correr en local

### Requisitos

- Node.js >= 20  
- Backend NestJS + PostgreSQL (auth, users, venues, gateway)

### Pasos

```bash
# Backend: ver docs/BACKEND.md (Postgres + servicios locales)
cd apps/backend
# migraciones + seed → admin@eliteforge.com / Admin123!

cd apps/web
cp .env.example .env.local
# Ajustar NEXT_PUBLIC_SITE_URL=http://localhost:5175
npm install
npm run dev
```

Desde la raíz del monorepo:

```bash
npm run web          # next dev -p 5175
npm run web:build
```

Abrir **http://localhost:5175** · Admin: `/admin/login`.

### Scripts (`apps/web`)

| Comando | Acción |
|---------|--------|
| `npm run dev` | Dev puerto **5175** (no afectado por `output: 'standalone'`) |
| `npm run build` | Build prod (`postbuild` copia `public/` y `.next/static/` al standalone) |
| `npm run start` | Servir el build standalone (`node .next/standalone/apps/web/server.js`) — es lo que ejecuta Hostinger |
| `npm run lint` | ESLint |

> Si ves UI antigua (sin Analíticas/Torneos): cierra pestañas de `:5173`, usa **5175**, o ventana de incógnito.

---

## Deploy (VPS en Docker — Fase W.5)

La web corre en el **mismo VPS que el backend**, como el servicio `web` de `infrastructure/docker/docker-compose.prod.yml`, detrás de Caddy (dominios `eliteforge.tech` + `www.eliteforge.tech`). Runbook completo: [DEPLOY.md](../infrastructure/docker/DEPLOY.md).

**Por qué se abandonó el shared hosting de Hostinger:** su límite estricto de hilos/procesos (CloudLinux LVE) hace fallar el build de Next.js — confirmado en vivo por SSH: Turbopack muere con `panic`/`EAGAIN` y Webpack también falla con `EAGAIN` al optimizar fuentes e imágenes de Leaflet. Los `hostinger.json` (raíz y `apps/web`) se eliminaron del repo. El registro DNS `A` de la raíz ya apuntaba al VPS, así que no hubo que tocar DNS.

Piezas del despliegue:

- **`infrastructure/docker/Dockerfile.web`** — multi-stage (node:20-alpine), mismo patrón que los 4 de backend: builder con `npm ci --workspace=@ef/web --include-workspace-root` + `next build`; producción que copia solo `.next/standalone/` (autocontenido). `CMD ["node", "apps/web/server.js"]`, `ENV PORT=3000 HOSTNAME=0.0.0.0` (sin `HOSTNAME=0.0.0.0` el standalone solo escucha en localhost y Caddy no lo alcanzaría). Tiene su propio `Dockerfile.web.dockerignore` porque el `.dockerignore` de la raíz excluye `apps/web/**` para los builds de backend (BuildKit usa el específico EN LUGAR del de la raíz).
- **Build args vs. runtime:** `NEXT_PUBLIC_API_URL` (`/api`) y `NEXT_PUBLIC_SITE_URL` (`https://$WEB_DOMAIN_PRIMARY`) se pasan como build args porque Next los incrusta en el bundle al compilar. **Ojo:** el rewrite `/api → gateway` de `next.config.mjs` TAMBIÉN se evalúa en build (queda horneado en `routes-manifest.json` del standalone), así que `API_GATEWAY_URL=http://api-gateway:3000` está fijado dentro del propio Dockerfile en el paso de build — la variable de runtime sola no alcanza en modo standalone.
- **Caddy:** bloque `{$WEB_DOMAIN} { reverse_proxy web:3000 }`; `WEB_DOMAIN` trae ambos hostnames separados por espacio y Caddy los toma como dos direcciones del mismo bloque (el placeholder se sustituye antes de tokenizar).
- **Variables nuevas de `.env.production`:** `WEB_DOMAIN` (lista con `www`, para Caddy) y `WEB_DOMAIN_PRIMARY` (un solo dominio canónico, para el build) — ver comentario en `.env.production.example`.

**Por qué standalone (fix 2026-08-31, sigue vigente en Docker):** en el monorepo con npm workspaces, `next` vive hoisted en el `node_modules` de la raíz; un runtime que solo conserve la carpeta de la app muere con `Cannot find module 'next'`. `output: 'standalone'` en `next.config.mjs` (junto al `outputFileTracingRoot` que ya existía) empaqueta una copia mínima autocontenida de las dependencias en `.next/standalone/` — la imagen de producción copia solo eso. El script `"start"` (`node .next/standalone/apps/web/server.js`) quedó del intento de Hostinger y sigue siendo el comando correcto (la imagen usa el path equivalente directo).

Estructura de salida (con `outputFileTracingRoot` en la raíz del monorepo, replica la ruta relativa completa):

```
.next/standalone/
├── node_modules/          ← dependencias mínimas, incluido `next`
└── apps/web/
    ├── server.js          ← entrypoint de producción
    ├── package.json
    ├── public/            ← copiado por `postbuild` (standalone no lo incluye solo)
    └── .next/static/      ← ídem
```

`postbuild` (`scripts/copy-standalone-assets.js`, Node y no `cp` de shell para funcionar igual en Windows local y Linux de Hostinger) copia `public/` y `.next/static/` — es el comportamiento documentado de Next.js, no un bug: standalone no los incluye automáticamente.

Tras cambiar `NEXT_PUBLIC_*` o los dominios: reconstruir la imagen (`docker compose ... up -d --build web`) — son valores de build, no de runtime.

---

## Landing — secciones

| Componente | Contenido |
|------------|-----------|
| `LandingNav` | Nav + CTAs |
| `Hero` | “Del amateur al pro” |
| `PerformanceSection` | Rendimiento |
| `TournamentsSection` | Equipos / torneos (marketing) |
| `MatchFinderSection` | Partidos |
| `CommunitySection` | Feed mock |
| `CourtsSection` | Canchas |
| `DownloadSection` | Stores |
| `FinalCta` + `LandingFooter` | CTA + footer |

---

## Registro de cambios

### 2026-07 — Base monorepo + NestJS

- [x] Web en `apps/web/` (`@ef/web`); sin Supabase; cookie `ef_token`.
- [x] Portal admin + roles Empresario / Administrador.
- [x] Rewrites `/api` → Gateway; DAL venues/reservations.
- [x] Dev en puerto **5175**.

### 2026-07 — Portal dueño (frontend)

- [x] Calendario reservas Día/Semana/Mes; demo UI; teléfono; editar.
- [x] Mi cancha: inventario 6/8/11, tarifas, amenities.
- [x] Resumen: ocupación ahora (ocupadas/libres por tamaño).
- [x] Analíticas: días/horarios y clientes frecuentes/cumplimiento.
- [x] Fix logo (sin `<a>` anidado) + nav móvil + caché static solo immutable en prod.
- [x] Torneos: modalidades, agenda→calendario, equipos manuales, W, goles/GC/tarjetas.
- [x] Rankings podio: Goleadores + Valla menos vencida (sin asistencias/DFR/mejor defensa en UI).

### 2026-09 — Favicon real (identidad de marca)

- [x] `app/icon.png` (512×512) y `app/apple-icon.png` (180×180) — emblema del logo sobre carbón `#424242`, generados por `apps/mobile/scripts/generate-brand-assets.js` (`npm run generate:brand`, ver [FRONTEND.md](./FRONTEND.md#identidad-de-marca--íconos-splash-y-nombre-de-la-app)). Next.js los sirve solo por la convención de metadata por archivos del App Router (`<link rel="icon">`/`apple-touch-icon` en el HTML, verificado con `next build`) — nada que declarar en `layout.tsx`. Eliminados los restos del template en `public/` (`icon.svg`, `icon-dark-32x32.png`, `icon-light-32x32.png`, `apple-icon.png` genérico "V0"); nada los referenciaba salvo una exclusión inofensiva de Cache-Control.

### 2026-08 — Fase W.5: web al VPS en Docker

- [x] La web se despliega en el VPS como servicio `web` del compose de producción (2026-08-31): nuevo `Dockerfile.web` (+ su `.dockerignore` propio), bloque `{$WEB_DOMAIN}` en el Caddyfile, variables `WEB_DOMAIN`/`WEB_DOMAIN_PRIMARY`. El shared hosting de Hostinger quedó descartado (límite de hilos LVE rompía el build); `hostinger.json` eliminado. Ver [Deploy](#deploy-vps-en-docker--fase-w5).

### 2026-08 — Deploy standalone (fix Hostinger)

- [x] `output: 'standalone'` en `next.config.mjs` + `postbuild` (`scripts/copy-standalone-assets.js`) (2026-08-31) — arregla el `Cannot find module 'next'` en runtime de Hostinger, ver [Deploy (Hostinger)](#deploy-hostinger).
- [x] `"start"` pasa a ser el server standalone (2026-08-31) — Hostinger no tiene campo de comando de arranque: ejecuta `"start"` automáticamente, así que el `"start:standalone"` del fix anterior nunca corría en producción; se redefinió `"start"` y se eliminó el script redundante.

### 2026-08 — CI y lint

- [x] `apps/web/.lintstagedrc.json` — pre-commit con lint-staged también en web (2026-08-26, mismo cambio que agregó el wrapper de `TextInput` en mobile).
- [x] La rama `Dev-David` se agrega a los triggers de `push`/`pull_request` de CI (Fase D.0, 2026-08-25) — antes la rama de trabajo real no corría CI.

### Pendiente

- [ ] Métricas reales para Administrador.
- [ ] Dominio de producción definitivo.
- [ ] Persistir torneos en API NestJS (inventario y amenities ya migrados: `Court` en W.1, `Venue.amenities` el 2026-08-31).

---

## Fase W.0 — Colorimetría, navegación y rediseño visual (2026-08-26)

Rama `feature/web-w0-colorimetria-navegacion`. Alcance final de la fase:

- Paleta Elite Forge como única fuente de verdad en `:root` (se eliminaron
  los bloques `.dark`/`@media` de shadcn que la pisaban); tokens
  `--color-emerald`/`--color-orange` disponibles como utilidades Tailwind.
- Cero colores hardcodeados fuera de `globals.css` y `lib/theme/elite-forge.ts`.
- Navegación: acceso "Soy dueño de cancha" en la landing, footer con
  columnas, páginas legales placeholder, header/sidebar seccionado y
  breadcrumbs en el portal, 404 y error del portal.
- Rediseño visual futurista: fondo `landing-bg.svg` fijo a página completa
  (parallax) con armonía esmeralda-estructura / naranja-luz, navbar
  transparente→vidrio al scrollear, sistema `ef-card`/`ef-chip`/`ef-cta`
  aplicado a landing, auth, 404 y portal (con velo atenuador), y mapa de
  Colombia con 7 ciudades etiquetadas en el buscador de partidos.

**Notas de cierre:**

1. **David revisó y aprobó los cambios de esta fase** (2026-08-26).
2. **La web puede recibir más cambios a futuro** — este rediseño no es
   definitivo; la Fase W.1 (persistencia real de canchas/reservas) ya se
   completó justo después (ver abajo); registro de dueños, contenido legal,
   etc. siguen pendientes.

---

## Fase W.1 — Canchas reales y reservas por tamaño (2026-08-27)

Rama `feature/web-w1-canchas-reservas` (incluye W.1 y W.1.1, mergeadas juntas). Reemplaza el modelo de canchas/reservas 100% frontend de antes por uno real en Postgres.

- **Eliminado `localStorage` para canchas y reservas** (`mock-reservations.ts`, `venue-extras.ts`) — ver [Persistencia local](#persistencia-local-browser).
- **Modelo `Court`**: cada complejo pasa de tener un precio único a canchas individuales con su propio tamaño y precio (`VenueCourtsSection` en "Mi cancha").
- **Ubicación con mapa** (Fase L.0, mergeada junto con esta): buscador de municipio + pin arrastrable (Leaflet/OpenStreetMap) para la ubicación precisa del complejo.
- **Aprobación de reservas**: las reservas creadas desde la app nacen `pending` — el dueño confirma o rechaza desde el calendario. Las telefónicas que carga el propio dueño siguen naciendo `confirmed` directo.
- **W.1.1, en el mismo ciclo**: el jugador pasó de elegir una cancha por nombre a elegir un **tamaño** — el backend auto-asigna la cancha puntual sin solape. El dueño ve en el calendario qué cancha le tocó a cada reserva y puede **reasignarla manualmente** a otra cancha activa del mismo tamaño (ej. mantenimiento de último momento) — ver [Reservas](#reservas-adminreservas--reservations-calendartsx).

Ver [BACKEND.md → Modelos nuevos desde el 18/08](./BACKEND.md#modelos-nuevos-desde-el-1808) y [FRONTEND.md → Reservas — selección por tamaño](./FRONTEND.md#reservas--selección-por-tamaño-fase-w11) para el lado backend y mobile de la misma fase.

---

## Referencias

| Recurso | Contenido |
|---------|-----------|
| [FRONTEND.md](./FRONTEND.md) | App móvil |
| [BACKEND.md](./BACKEND.md) | API, Prisma, services |
| [ELITE_FORGE.md](./ELITE_FORGE.md) | Producto |
| [`apps/web/README.md`](../apps/web/README.md) | README paquete |
| Producción | https://sandybrown-pigeon-607893.hostingersite.com |
| Admin login | https://sandybrown-pigeon-607893.hostingersite.com/admin/login |

---

*Última actualización: 2026-08-29 — Fase W.0 (paleta/navegación) y Fase W.1/W.1.1 (canchas reales, reservas por tamaño, sin `localStorage` para canchas/reservas).*
