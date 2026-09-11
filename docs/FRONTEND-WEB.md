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
| `/legal/privacidad` | Política de privacidad — texto real aprobado (`LegalContentPage`); fuente versionada en `docs/politica-de-privacidad-elite-forge.md` |
| `/legal/terminos` | Términos de uso — **placeholder a propósito** (`LegalPlaceholderPage`), documento pendiente de redacción/revisión |

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

## Recuperación de contraseña (2026-09-11)

Dos páginas nuevas bajo `app/auth/`, mismo patrón que `login` y `sign-up` (client components, `useState` para campos/error/loading, validación local, `lib/api/auth.ts` → `apiFetch`, mapeo de `ApiError.status`, `Label`/`Input`/`Button` de `components/ui`, layout `auth/layout.tsx`). `sign-up` y el enlace a `/legal/privacidad` no se tocaron.

| Ruta | Qué hace |
|---|---|
| `/auth/forgot-password` | Un campo email → `forgotPassword`. Muestra **siempre** el mismo mensaje de éxito ("si existe una cuenta con ese correo te enviamos un enlace; revisá spam"), porque el backend responde 200 exista o no el correo (anti-enumeración). Solo distingue 429 ("demasiados intentos") y error de red. Botones: volver a iniciar sesión / usar otro correo. |
| `/auth/reset-password?token=…` | Lee el token de la URL (`useSearchParams`, envuelto en `Suspense` para que `next build` prerenderice), dos campos con las reglas del registro (8–72, letra + número, coincidencia) → `resetPassword`. Éxito: pantalla "¡Contraseña actualizada!" con **Descargar app** y Volver al inicio, como "Cuenta confirmada". 400 (inválido, vencido o ya usado) o token ausente/corto: "Enlace inválido o vencido" con **Pedir un enlace nuevo**. |
| `/auth/login` | Enlace "¿Olvidaste tu contraseña?" debajo del campo contraseña. |

El enlace que llega por correo lo arma el backend con `WEB_BASE_URL` (`https://eliteforge.tech/auth/reset-password?token=<43 caracteres>`); vence a los 30 minutos y sirve una sola vez. `lib/api/auth.ts`: `forgotPassword`, `resetPassword`. Sin cambios en `next.config`, rewrites ni variables de la web. Detalle del backend (tabla, throttles, revocación de sesiones): [BACKEND.md](./BACKEND.md#correo-por-smtp-y-recuperación-de-contraseña-2026-09-11).

**Pendiente (fase siguiente):** "Cambiar contraseña" en el portal admin para dueños de cancha y Administrador (el endpoint `POST /api/auth/password/change` ya existe), y el enlace en `LoginScreen` de la app móvil (build nuevo).

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

Regla desde 2026-09-07: **la landing solo promete lo que la app hace**. Cada texto tiene que poder señalarse en `apps/mobile` (pantalla, clave de `es.ts`) o en el portal admin. Si una función todavía no existe, no se anuncia — ni "próximamente", salvo las tiendas.

| Componente | Tipo | Contenido |
|------------|------|-----------|
| `LandingNav` | cliente | Logo (lockup) + anclas Rendimiento / Comodín / Canchas + "Soy dueño de cancha", "Registro gratis", "Descargar" |
| `Hero` | estático (server, lee `public/` con `fs`) + `HeroPlayer` cliente | Composición a sangre: imagen de fondo (si existe) + overlay oscuro + líneas de velocidad en SVG + **silueta animada de futbolista** (recibe → dribla → tira) a la derecha; eyebrow "ELITE FORGE"; slogan en dos líneas **"El talento no nace." / "Se forja."** (blanco / cian) a la izquierda; CTAs "Prueba inicial" (registro) y "Cómo funciona" (`#rendimiento`). Sin balón junto al titular. Ver [Hero: imagen a sangre](#hero-imagen-a-sangre) y [Hero: silueta animada](#hero-silueta-animada) |
| `PerformanceSection` | estático (+ `StatsRadar` cliente) | Radar con las **6 stats reales** en el orden de `STAT_ORDER` (Ataque, Defensa, Resistencia, Velocidad, Pases, Regate); 6 tests físicos cargados a mano + test de mentalidad |
| `TournamentsSection` | cliente | 3 cards-botón (grupo, partidos internos/VS, campeonatos) que abren `FeatureDialog` con los pasos reales de la app |
| `MatchFinderSection` | estático (+ `MatchFinderCta` cliente) | Comodín "Cerca de mí" como **lista por municipio**; el SVG de Colombia es decorativo (`aria-hidden`); el botón abre el modal explicativo |
| `CommunitySection` | estático | 4 posts de muestra con grupos, VS, comodín y tests; ficha de los 7 tests (reemplaza a la "progresión histórica") |
| `CourtsSection` | estático | Portal de dueños (calendario, inventario 6/8/11, ocupación) y reservas `pending` que confirma el dueño |
| `DownloadSection` | estático | Tiendas visibles pero **deshabilitadas** ("Próximamente"), sin `href="#"`; CTA a crear cuenta |
| `FinalCta` + `LandingFooter` | estático | CTA + footer (Jugadores / Canchas / Legal) |
| `FeatureDialog` | cliente | Modal reutilizable (icono, tagline, pasos numerados, nota honesta, CTA a registro) sobre `components/ui/dialog.tsx` |

**Identidad (lote 2):** el logo es un lockup horizontal (`public/brand/elite-forge-lockup.png`, 540×256) generado por `scripts/generate-brand-assets.js` a partir del logo maestro de mobile — recorta emblema y wordmark por alfa (mismo criterio que `apps/mobile/scripts/generate-brand-assets.js`) y los compone en horizontal; también deja `elite-forge-emblem.png` y `elite-forge-wordmark.png`. `components/logo.tsx` lo renderiza a `h-14 sm:h-16` con un solo `<img>`, así `[&_img]:h-9` desde `app/auth/layout.tsx` / admin sigue funcionando. Regenerar con `node scripts/generate-brand-assets.js` desde `apps/web` si cambia el logo maestro.

**Iconos futbolísticos:** `components/icons/football.tsx` — `SoccerBallIcon`, `PitchIcon`, `WhistleIcon`, `BootsIcon`, SVG propios con las reglas de lucide (viewBox 24, stroke 2, `currentColor`). lucide-react no trae balón, silbato, botines ni cancha. Se mantiene lucide donde funciona (Trophy, Brain, MapPin, LayoutDashboard…).

**Animación (sin librerías nuevas):** `@keyframes` propios en `globals.css` (`ef-rise`, `ef-speed`, `ef-spark`, `ef-kick`, `ef-sweep`) + utilidades `.ef-enter` (entrada escalonada del hero), `.ef-speed` / `.ef-spark` (líneas de velocidad y partículas del hero; con reduced-motion se ocultan), `.ef-reveal` (revelado al scroll con `animation-timeline: view()`, progresivo: donde no hay soporte se ve el estado final) y patada/destello al hover de `.ef-card-hover`. Todo dentro de `@media (prefers-reduced-motion: no-preference)`, y un bloque `reduce` apaga también `animate-in/out` de tw-animate-css y `animate-ping/pulse/spin/bounce`.

**Modales:** `components/ui/dialog.tsx` es el Dialog de shadcn (estilo base-nova) sobre `@base-ui/react/dialog`, escrito a mano con la misma API que genera la CLI (`Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose`…) para no depender de la red en el build. Animación con tw-animate-css sobre `data-open` / `data-closed`.

### Hero: imagen a sangre

El hero está preparado para una ilustración a ancho completo que **todavía no existe en el repo** (se encarga aparte). `components/landing/hero.tsx` busca en build `public/hero-player.webp` y, si no, `public/hero-player.png` (`resolveHeroImage`, con `fs.existsSync` sobre `process.cwd()/public`, que en el standalone de producción es la copia que hace `scripts/copy-standalone-assets.js`). Mientras no exista ninguno, el hero no pide nada y deja ver `landing-bg.svg`, el fondo fijo de toda la landing. Cuando la imagen aparezca hay que **rebuildear** (la página es estática).

Capas, de atrás hacia adelante: imagen (`bg-cover`, foco en `70% center`) → overlay `from-background via-background/80 to-background/10` de izquierda a derecha + fundido inferior de 10 rem → glow naranja → líneas de velocidad (`SpeedLines`, SVG `viewBox 0 0 100 100`, animadas con `ef-speed`/`ef-spark`) → silueta animada (`HeroPlayer`) → degradado extra solo en móvil (`md:hidden`) → texto.

**Especificación para el ilustrador / la imagen:**

| Aspecto | Valor |
|---|---|
| Formato | `.webp` (preferido) o `.png`; nombre exacto `hero-player.webp` / `hero-player.png` en `apps/web/public/` |
| Dimensiones | 2560 × 1440 px (16:9). Mínimo 1920 × 1080. El hero mide ~82 vh, así que en pantallas altas se recorta arriba/abajo y en móviles se recorta a los lados: nada importante en los bordes |
| Peso | ≤ 400 KB en webp (≤ 900 KB en png). `images.unoptimized` está activo: se sirve tal cual |
| Foco | El sujeto (jugador) en la **mitad derecha**, centro de interés alrededor del 70 % del ancho y 50 % del alto (`background-position: 70% center`) |
| Zona segura (despejada o muy oscura) | **Mitad izquierda**: del 0 % al 55 % del ancho, entre el 30 % y el 80 % del alto. Ahí caen el eyebrow, el titular de dos líneas, el subtítulo y los dos botones. El overlay la oscurece igual, pero el sujeto no debe pasar por ahí |
| Tono | Fondo oscuro en la gama carbón (#424242 → #2e2e2e) para fundirse con el overlay y con `landing-bg.svg` en el borde inferior; acentos cian #00cec8 / naranja #ff8c00 opcionales |
| Móvil | En < 640 px el texto ocupa casi todo el ancho: la imagen se ve como fondo detrás del overlay. Que el sujeto siga reconocible aunque quede parcialmente tapado |

### Hero: silueta animada

`components/landing/hero-player.tsx` (cliente, sin JS de animación) muestra un futbolista en silueta con aura de energía y cicla tres poses de una jugada: **recibe** (control de pecho) → **dribla** (conducción, balón al pie) → **tira** (remate, balón saliendo con impacto naranja). Vuelve a la primera en loop.

**De dónde sale la silueta.** Dos fuentes, con la misma aura y energía SVG detrás:

1. **Ilustración (la que se usa).** `scripts/split-hero-poses.js` toma la ilustración de las tres poses (figuras negras con vetas cian/naranja y trazos de energía alrededor, generada con IA por el usuario) y la separa: `public/hero/pose-1.png … pose-3.png` (silueta recortada con fondo alfa, de izquierda a derecha) y `components/landing/hero-poses.generated.ts` (`RASTER_POSES`: ubicación de cada una en el viewBox, puntos del borde trasero para los trazos de energía, balón detectado). El componente pinta cada pose como `<image>` y el filtro del aura trabaja sobre su canal alfa, así que el efecto es el mismo que con vectores. Criterio del script: píxel "tinta" = luminancia baja (`DARK`, 96 con fondo blanco; `--dark=40` con fondo oscuro, donde las manchas negras del fondo se descartan porque tocan el borde), cierre morfológico de 5 px para conservar las vetas de color dentro del cuerpo (los píxeles casi blancos encerrados se pintan de negro), componentes conexas → las 3 más grandes son los cuerpos y el resto (balones, manos sueltas) se asigna al cuerpo más cercano; el balón se detecta como componente casi cuadrada y bien llena. Uso desde `apps/web`: `node scripts/split-hero-poses.js <ruta.png> [--dark=40]`. Si cambia la ilustración, volver a correrlo y rebuildear.
2. **Vectorial de respaldo.** Si `RASTER_POSES` es `null`, las figuras se construyen por partes desde un esqueleto (`POSES`, ver más abajo).

**Cómo funciona el ciclo.** Cada pose es un `<div class="ef-pose ef-pose-N">` con tres `<svg>` (energía, aura y silueta) sobre el mismo `viewBox 0 0 400 440`. Las tres comparten la animación `ef-pose-cycle` (opacity + `translateX` de ±3,5 % en el sentido de la jugada, izquierda → derecha) con `animation-delay` escalonado: pose 2 arranca a `--pose-duration`, pose 3 a `2 × --pose-duration`. Las transiciones se solapan (crossfade real: mientras una se va, la siguiente ya entra), por eso el ciclo es `3 × --pose-duration` y no `3 × (duración + transición)`. Por qué HTML y no `<g>`: opacity/transform sobre elementos HTML se componen en GPU sin re-rasterizar el filtro del aura en cada frame (un `transform` sobre un `<g>` interno lo re-aplicaría). Solo se animan `opacity` y `transform`.

**Dónde ajustar los tiempos.** En `globals.css`, regla `.ef-hero-player`:

| Custom property | Default | Qué controla |
|---|---|---|
| `--pose-duration` | `4.5s` | Lo que cada pose queda quieta. El usuario pidió al principio 15 s por pose; se dejó en 4,5 s y se parametrizó para subirlo acá (con 15 s el ciclo pasa a 45 s) |
| `--pose-transition` | `0.8s` | Duración del crossfade. Los porcentajes de `ef-pose-cycle` (5,93 % / 33,33 % / 39,26 %) están calculados para 0,8 s sobre un ciclo de 13,5 s: si cambiás solo `--pose-duration`, la transición escala en proporción; para fijarla en segundos exactos hay que recalcular esos tres porcentajes (fórmula en el comentario del CSS) |
| `--pose-cycle` | `calc(3 * var(--pose-duration))` | Derivada; no tocar |
| `--ef-sil` | `#262626` | Relleno de la silueta (carbón, un paso más oscuro que `--secondary`) |

Ciclo completo por defecto: **13,5 s**.

**Aura y energía.** Un filtro SVG **por pose** (`#ef-aura-filter-1/2/3`, semilla de ruido y deriva propias para que las tres nieblas no se parezcan) aplicado a un `<use>` de la silueta, con región amplia (`x -90 % / w 280 %`) para que nada se recorte. Cómo se logra "densa pegada al cuerpo, se apaga al alejarse, sin patrón": cada capa parte de la silueta dilatada y difuminada (el alfa codifica la distancia al cuerpo), una curva `feFuncA type="table"` concentra la densidad cerca y la apaga rápido, el alfa se **multiplica por ruido fractal** (`feComposite operator="arithmetic" k1`) para que la densidad tenga grumos y claros irregulares, y recién después se deforma el borde con otro ruido (`feDisplacementMap`). Capas de adentro hacia afuera: contorno (dilate 2,5, cian 92 %), capa cercana cian (dilate 5 + blur 10, curva `0 .45 .85 1 1`, ruido medio × fino, 90 %) y capa media naranja (dilate 12 + blur 22, curva `0 .2 .55 .9 1`, ruido ancho × medio, 60 %). Tres `feTurbulence` por filtro (0.05 / 0.018 / 0.007). **Solo alrededor del cuerpo**: a pedido del usuario se quitaron la bruma lejana corrida hacia la estela, los trazos de energía que salían hacia atrás (y su filtro `#ef-streak-glow`) y los wisps del lado de la estela. La capa `.ef-energy-layer` queda solo con la luz de suelo. El campo `anchors` de `hero-poses.generated.ts` sigue generándose pero no se usa. Los tres `<svg>` de cada pose llevan `overflow-visible`: el halo y los trazos salen del viewBox 400×440 sin cortarse (solo recorta el `overflow-hidden` del hero). Los cinco wisps sobre cabeza y hombros alternan cian y naranja. Debajo, la capa de energía (`.ef-energy-layer`): trazos quebrados que salen del cuerpo hacia atrás (sentido contrario al movimiento, `trail` por pose) generados de forma determinista (`energyStreaks`, LCG con semilla por pose para que servidor y cliente coincidan) desde anclas en cabeza, hombros, codos, cadera, rodillas y tobillo, con el filtro `#ef-streak-glow` (blur ancho + núcleo nítido) y una luz de suelo bajo los pies (`#ef-ground-blur`). La capa deriva apenas hacia atrás con `ef-energy-drift` (3,6 s). La capa del aura respira con `ef-breathe` (opacity 0,72 ↔ 1 y `scale` 1 ↔ 1,018 en 4,2 s, ease-in-out, nunca parpadea). Cinco "wisps" (`.ef-wisp`, `<span>` con `radial-gradient` + `blur(6px)`) nacen sobre cabeza y hombros, ascienden, se abren y se disipan (`ef-vapor`, 5,2 s, desfasados). En la pose 3, un `radialGradient` naranja detrás del balón, tres estelas y seis partículas (`.ef-spark-impact`, `ef-impact-spark`) marcan el impacto.

**Tokens de color.** Solo paleta Elite Forge: `var(--color-emerald)` (#00cec8) para contorno, halo, energía, luz de suelo, ojo y vapor; `var(--color-orange)` (#ff8c00) para impacto, estelas y partículas; `--ef-sil` #262626 para el relleno; el fondo es el del hero (`--background` #424242 + overlay). **No** se usa el verde lima de la referencia. Los `feFlood`/`stop` llevan el hex como fallback y el token vía `style` (`flood-color`/`stop-color` aceptan `var()`).

**Reduced motion.** `@media (prefers-reduced-motion: reduce)`: una sola pose estática (dribla), aura y energía fijas al 85 %, wisps y partículas ocultos.

**Responsive.** La caja se posiciona desde `hero.tsx`: en `lg` ocupa el 80 % de alto del hero pegada a la derecha; en `md` 74 %; en `sm` 62 % con opacidad 0,85; en móvil 48 %, corrida un 30 % fuera del borde derecho y al 60 % de opacidad, y un degradado extra (`md:hidden`) por encima asegura el contraste del titular. El texto (`max-w-2xl`, izquierda) nunca se superpone con la silueta en `md+`.

**Poses vectoriales (respaldo).** Cada pose es un esqueleto de articulaciones (`Joints`: cabeza e inclinación, cuello, hombros, codos, muñecas, caderas, rodillas, tobillos, puntas de pie, balón) en `POSES`; `Figure` lo convierte en silueta con piezas anatómicas: segmentos cónicos (`Seg`: muslo ancho en la cadera y fino en la rodilla, pantorrilla con gemelo, antebrazo), torso con cintura y hombros redondeados, mangas y pantalón con dobladillo (dan el escalón de la ropa en el contorno), media alta, botín con talón, suela y punta (`Boot`), puño, cabeza con mentón, pelo en puntas (`HAIR`, rotado con `headTilt`) y un ojo elíptico en cian. Para retocar una pose se cambian coordenadas en `POSES`; aura y energía se recalculan solas. Referencia visual del usuario: siluetas anime con energía neón; se replica el tratamiento (silueta oscura, contorno intenso, halo quebrado, trazos que salen hacia atrás, ojo encendido) con la paleta propia.

**Título de la landing:** `app/page.tsx` exporta su propio `metadata` ("ELITE FORGE — El talento no nace. Se forja."); `app/layout.tsx` (compartido con las páginas legales declaradas en Play Console) conserva el suyo y no se toca.

---

## Registro de cambios

### 2026-09-11 — "Olvidé mi contraseña": `/auth/forgot-password`, `/auth/reset-password` y enlace en login

- Dos páginas nuevas bajo `app/auth` con el patrón de login/sign-up; mensaje de éxito idéntico exista o no el correo; reset con token de la URL (`Suspense`), reglas del registro y pantalla final con "Descargar app". `lib/api/auth.ts`: `forgotPassword`, `resetPassword`. `next build` en verde; `sign-up` y `/legal/privacidad` intactos. Ver [Recuperación de contraseña](#recuperación-de-contraseña-2026-09-11).

### 2026-09-07 — Hero con silueta animada de futbolista (recibe → dribla → tira)

- [x] Sexta pasada: solo el aura que queda alrededor del cuerpo — fuera la bruma lejana, los trazos de energía hacia atrás y los wisps de la estela.
- [x] Quinta pasada: aura densa contra el cuerpo y apagada hacia afuera (curvas `feFuncA table`), densidad irregular (alfa × ruido fractal), un filtro por pose con semillas distintas y bruma corrida hacia la estela.
- [x] Cuarta pasada: aura sin recortes (`overflow-visible` + región del filtro ampliada) y niebla más densa en capas cian/naranja; wisps y trazos alternan los dos colores.
- [x] Tercera pasada: la silueta sale de la **ilustración del usuario** (tres futbolistas anime en negro con vetas cian/naranja). `scripts/split-hero-poses.js` separa las tres figuras a PNG con alfa y genera `hero-poses.generated.ts`; el hero las muestra como `<image>` con el aura, la energía y el impacto SVG detrás. Las figuras vectoriales quedan como respaldo si el archivo generado es `null`.
- [x] Segunda pasada, buscando la referencia visual del usuario (siluetas anime con energía): figuras reconstruidas desde un esqueleto de articulaciones con piezas anatómicas (cónicas, cintura, mangas, pantalón, botines, puños, pelo en puntas, ojo encendido); nueva capa de energía con trazos quebrados hacia atrás y luz de suelo; halo más quebrado (`scale 64`, 3 octavas). Sigue siendo cian + naranja, sin verde lima.
- [x] `components/landing/hero-player.tsx`: silueta SVG en carbón con aura de calor corporal (filtro `feMorphology` + `feGaussianBlur` + `feTurbulence`/`feDisplacementMap`, respiración suave, vapor que asciende) que cicla tres poses en crossfade con desplazamiento direccional. CSS puro (`ef-pose-cycle`, `ef-breathe`, `ef-vapor`, `ef-impact-spark`), solo `opacity`/`transform`, cada pose en su propio `<div>` para no re-rasterizar el filtro por frame. Tiempos en `--pose-duration` (4,5 s) y `--pose-transition` (0,8 s); ciclo 13,5 s. Colores: cian `--color-emerald` + naranja `--color-orange` (impacto del balón). Reduced motion: una pose estática sin aura pulsante. Ver [Hero: silueta animada](#hero-silueta-animada).

### 2026-09-07 — Ajuste del hero: sin balón, titular a la izquierda, composición a sangre

- [x] Fuera el balón del slogan (`SoccerBallIcon` sigue en `components/icons/football.tsx` para las cards). Titular en dos líneas y dos pesos ("El talento no nace." blanco / "Se forja." cian), alineado a la izquierda, `text-4xl → lg:text-6xl` (antes llegaba a `text-8xl`), `leading-[0.9]` y `tracking-[-0.03em]` para que lea como bloque; itálica, bold y mayúsculas como el titular original.
- [x] Dirección de arte: imagen a sangre con overlay oscuro de izquierda a derecha + fundido inferior, eyebrow "ELITE FORGE" con `tracking-[0.35em]`, líneas de velocidad y partículas en SVG animadas por CSS (`ef-speed`, `ef-spark`; ocultas con reduced-motion). Sin librerías nuevas.
- [x] Placeholder de la ilustración: `hero-player.webp/png` se detecta en build y, si falta, se ve `landing-bg.svg`. Especificación de dimensiones, formato, foco y zona segura en [Hero: imagen a sangre](#hero-imagen-a-sangre).

### 2026-09-07 — Landing veraz, identidad y cards interactivas (3 lotes)

Origen: demo con usuarios reales + auditoría de promesas. Tres commits separados en `Dev-David`.

- [x] **Lote 1 — veracidad.** Se eliminaron de la landing estas promesas sin respaldo en el producto (registro de por qué el copy dice lo que dice): "tecnología de rastreo técnico" / "analiza cada sprint, pase y disparo"; "Velocidad Máxima y Aceleración"; "Mapas de Calor Posicionales"; "Eficiencia de Pases y Tiros" (como métrica por partido); radar de 5 stats (Velocidad/Defensa/Pase/Tiro/Físico); "Nivel PRO / SEMI-PRO / AMATEUR"; "Posición Ranking #5"; "Puntuación 79/100"; "Estadísticas en tiempo real"; "define tu táctica maestra"; "ligas locales, sube de división y gana recompensas"; "compara… en tu ciudad o país"; "mapa interactivo" / "Explorar Mapa" / "partidos disponibles" en el mapa; "79 km recorridos", "liga nocturna", insignias MVP/GOLEADOR; "Progresión histórica" (el backend guarda solo `latestTestResults`); "flujo de ingresos en tiempo real" del portal; "confirmación instantánea y división de pagos"; "Licencia Manager"; QR falso y tiendas con `href="#"` (el "siempre me lleva al mismo lugar" del feedback: `#` hace scroll al tope); "Únete a miles de jugadores". Lo que sí se cuenta ahora: 6 tests físicos cargados a mano + test de mentalidad, grupos y amigos, partidos internos con "Sortear equipos", VS entre grupos amigos, comodín "Cerca de mí" por municipio, reservas `pending` que confirma el dueño, campeonatos con rankings por torneo, feed con fotos reales.
- [x] **Lote 2 — identidad.** Slogan "El talento no nace. Se forja."; lockup horizontal del logo legible; iconos futbolísticos propios; animación de "saque inicial" con reduced-motion; `hero-player.png` (1,28 MB sin uso) y el PNG cuadrado del logo borrados. Ver [Landing — secciones](#landing--secciones).
- [x] **Lote 3 — cards interactivas.** Las 3 cards de "Grupos, partidos y campeonatos" y el botón de "Cerca de mí" abren un modal (`FeatureDialog`) con los pasos tal cual existen en la app y una nota honesta de límites (sin invitación con aceptación, sin transferir creador, sin goles por jugador, sin tabla global, sin mapa). El CTA a registro vive dentro del modal; el hero suma "Cómo funciona" para que la landing no sea un embudo único a `/auth/sign-up`.
- Restricción vigente: `app/legal/*`, `components/legal/*`, `app/auth/*` y `app/layout.tsx` no se tocan (la URL de privacidad está declarada en Play Console). `next build` en verde en cada lote antes de commitear.

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

### 2026-09 — Enlace a la Política de Privacidad en el registro web

- [x] `/auth/sign-up` (el registro real — mobile solo redirige acá) muestra, justo debajo del botón "Crear cuenta gratis", "Al crear tu cuenta, aceptás nuestra Política de Privacidad" con `Link` interno a `/legal/privacidad`, mismo tratamiento visual que el otro link del formulario (`font-medium text-primary hover:underline`) (2026-09-06). Cierra el pendiente anotado en la entrada anterior; el aviso del `LoginScreen` de mobile queda como estaba.

### 2026-09 — Política de privacidad publicada

- [x] `/legal/privacidad` muestra el texto legal real (2026-09-06). `components/legal/legal-page.tsx` se separó en dos: `LegalPlaceholderPage` (sin cambios; lo sigue usando `/legal/terminos`, que queda en placeholder a propósito) y `LegalContentPage({ title, updatedAt, children })`, mismo marco visual (nav, fondo, footer, título, "Última actualización") con el cuerpo como JSX (`h2`/`h3`/`p`/`ul` — el proyecto no tiene renderer de markdown y no vale una dependencia solo para esto). El texto se transcribió **sin cambiar una palabra** desde `docs/politica-de-privacidad-elite-forge.md` (fuente de verdad versionada — si hay que corregir algo, se corrige ahí primero); verificado palabra por palabra contra el HTML generado. La fecha es la de publicación, no la de redacción. En mobile se agregó el enlace "Al registrarte, aceptás nuestra Política de Privacidad" en `LoginScreen` (junto a "Crear cuenta"; `RegisterScreen` es solo un puente al navegador) → `https://eliteforge.tech/legal/privacidad`. Pendiente: la página de sign-up web tampoco enlaza a la política.

### 2026-09 — Fase W.3: página "Dueños de cancha" (solo Administrador)

- [x] Nueva `app/admin/(portal)/duenos-de-cancha/` (`page.tsx` + `actions.ts`) + DAL `lib/dal/admin/venue-owners.ts` + `components/admin/venue-owners-dashboard.tsx` (2026-09-02). Tabla de Empresarios (nombre, correo, complejo, estado, alta) con activar/desactivar, y alta con contraseña temporal: botón "Generar" (12 caracteres aleatorios con `crypto.getRandomValues`, garantiza letra+número) y aviso post-creación que muestra la clave **una sola vez** para que David se la envíe al dueño. Ítem "Dueños de cancha" en la sección nueva **Usuarios** del sidebar de Administrador; la página redirige a `/admin/reservas` si entra un Empresario (mismo mecanismo que Campeonatos Elite Forge) y el backend devuelve 403 igual. Un dueño recién creado sin venue ve el flujo existente "Sin cancha configurada → Mi cancha" (verificado en vivo).

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
