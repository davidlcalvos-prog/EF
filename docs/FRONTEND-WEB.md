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
| Resumen | Ocupación en vivo por inventario 6/8/11 |
| Reservas | Calendario Día/Semana/Mes + API + demo/local |
| Mi cancha | Identidad API + inventario/tarifas/amenities locales |
| Analíticas | Dashboard ocupación y clientes (frontend) |
| Torneos | Crear, agenda, equipos, partidos, rankings (localStorage) |
| Métricas (Administrador) | Placeholder |
| Supabase | **Eliminado** — auth vía NestJS + PostgreSQL |

### Producción y desarrollo

| Concepto | Valor |
|----------|-------|
| URL pública | https://sandybrown-pigeon-607893.hostingersite.com |
| Hosting | Hostinger Node.js Web Apps |
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
| Prod | Hostinger `/auth/sign-up` |

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
├── next.config.mjs                      # Rewrites + Cache-Control
├── hostinger.json
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

Muchas capacidades B2B son **solo frontend** hasta existir modelo en API:

| Clave `localStorage` | Contenido |
|----------------------|-----------|
| `ef-venue-extras:{venueId}` | Inventario 6/8/11, tarifas 8/11, amenities |
| `ef-admin-phone-reservations` | Reservas añadidas por llamada |
| `ef-admin-edited-reservations` | Ediciones locales de reservas |
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
| Concurrencia | Hasta 5 chips/hora |
| Chip | Nombre; color por estado |
| Modal | Confirmar / Cancelar / Editar |
| Fuentes | API + demo (`mock-reservations`) + teléfono + ediciones + **torneos** |
| Colores | Confirmada `#00CEC8` · Pendiente gris · Cancelada `#FF8C00` |

### Mi cancha (`/admin/mi-cancha`) — `venue-settings-form.tsx`

| Sección | Persistencia |
|---------|--------------|
| Nombre / dirección | API `saveVenue` |
| Inventario 6vs6 / 8vs8 / 11vs11 | `localStorage` |
| Tarifas por formato | 6vs6 → API `price_per_hour`; resto local |
| Cafetería / transferencias / baños | `localStorage` |

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
| `npm run dev` | Dev puerto **5175** |
| `npm run build` | Build prod |
| `npm run start` | Servir build |
| `npm run lint` | ESLint |

> Si ves UI antigua (sin Analíticas/Torneos): cierra pestañas de `:5173`, usa **5175**, o ventana de incógnito.

---

## Deploy (Hostinger)

| Setting | Valor |
|---------|--------|
| Install | `npm install` / `npm ci` |
| Build | `npm run build` |
| Start | `npm run start -- -p $PORT` |
| Node | 20.x |

Tras cambiar `NEXT_PUBLIC_*`: Redeploy. Si ves versión vieja: Cache Manager → Purge All.

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

### Pendiente

- [ ] Métricas reales para Administrador.
- [ ] Dominio de producción definitivo.
- [ ] Persistir torneos, inventario y amenities en API NestJS.

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

*Última actualización: 2026-07-15 — documentación regenerada con portal completo (Resumen, Reservas, Mi cancha, Analíticas, Torneos).*
