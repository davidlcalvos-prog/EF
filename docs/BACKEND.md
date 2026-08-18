# Elite Forge — Documentación Backend

Registro técnico del backend en el monorepo `EF`. Para el frontend móvil, ver [FRONTEND.md](./FRONTEND.md). Para el portal web, ver [FRONTEND-WEB.md](./FRONTEND-WEB.md).

---

## Overview — arquitectura actual

El backend vive en `apps/backend/` y se organiza en microservicios NestJS. El único punto HTTP público es el **API Gateway**.

```
Cliente (web / mobile)
        │
        ▼
  API Gateway (:3000/api)     ← único punto HTTP público
        │ TCP
        ├── auth-service (:3001)    → autenticación (JWT, bcrypt)
        ├── users-service (:3002)   → perfiles y preferencias
        └── venues-service (:3003)  → canchas y reservas (lado dueño de cancha)
                │
        ┌───────┴───────┐
        ▼               ▼
   PostgreSQL        MongoDB
   (Prisma)     (user_preferences)
```

| Pieza | Rol |
|-------|-----|
| **api-gateway** | Entrada HTTP REST (`/api/*`), validación de DTOs, JWT, proxy TCP |
| **auth-service** | Registro, login, emisión/validación de JWT, creación de User + Profile |
| **users-service** | Lectura/actualización de perfil (PostgreSQL) y preferencias (MongoDB) |
| **venues-service** | Canchas y reservas del dueño de cancha (rol Empresario/Administrador) sobre PostgreSQL |
| **PostgreSQL + Prisma** | Datos relacionales (`roles`, `users`, `profiles`, `venues`, `reservations`) |
| **MongoDB** | Colección `user_preferences` |

**Importante:** el frontend **nunca** debe llamar directamente a `auth-service`, `users-service` ni `venues-service`. Siempre consume el API Gateway en `/api/*`.

El dominio activo del jugador en backend es **auth + users** (incluye perfil "rico": stats, tests físicos, evaluación psicológica). El dominio de **venues-service** cubre hoy solo el lado dueño de cancha (gestión de sus canchas y de las reservas que recibe); el lado jugador (búsqueda pública de canchas y creación de reservas) todavía no existe — ver [Próximos pasos](#próximos-pasos).

---

## Stack

| Capa | Tecnología |
|------|------------|
| Framework | NestJS 11 |
| Comunicación interna | TCP (`MessagePattern`) |
| SQL | PostgreSQL 16 + **Prisma** |
| Documentos | MongoDB 7 + Mongoose |
| Auth | JWT (`bcrypt` + `@nestjs/jwt` + Passport en gateway) |
| Contratos compartidos | `libs/contracts` |
| Contenedores | Docker Compose (modo híbrido recomendado) |

---

## Flujo de autenticación

### Registro

```
Web (/auth/sign-up)
  → api-gateway  POST /api/auth/register
    → auth-service (TCP)
      → Prisma
        → PostgreSQL
```

Al registrarse correctamente el sistema:

- crea un **User** en PostgreSQL;
- crea un **Profile** asociado (`userId` 1:1);
- asigna el rol **Jugador** por defecto (no se acepta `role` en el body);
- guarda la contraseña con **bcrypt**;
- **normaliza el email** (trim + minúsculas).

Respuesta típica: `{ accessToken, user: { id, email, name, role } }` (HTTP **201**).

La app móvil no registra en nativo: el enlace “Crear cuenta” abre el registro web (`SIGN_UP_URL` → `apps/web` `/auth/sign-up`).

### Login

```
Web o Mobile
  → api-gateway  POST /api/auth/login
    → auth-service
      → verifica credenciales → emite JWT
```

- Login correcto → HTTP **200** + `accessToken` y datos de usuario.
- Credenciales inválidas → HTTP **401** (`Invalid credentials`).
- `GET /api/auth/me` (Bearer JWT) → datos del usuario autenticado desde base de datos.
- `POST /api/auth/validate` → comprueba el token; si es válido y el usuario está activo, responde `{ valid, userId, email }`.

---

## User y Profile

### User (información de cuenta / privada)

Modelo Prisma `User` (`users`):

| Campo | Uso |
|-------|-----|
| `email` | Identificador de acceso (único, normalizado) |
| `passwordHash` | Hash bcrypt (nunca se expone en respuestas) |
| `role` | Relación a `Role` (p. ej. Jugador, Viewer, Empresario, Administrador) |
| `estado` | Activo/inactivo; usuarios inactivos no pueden autenticarse |
| `firstname` / `lastname` | Nombre de cuenta usado en respuestas auth |

### Profile (datos del jugador en plataforma)

Modelo Prisma `Profile` (`profiles`), relación 1:1 con User:

| Campo | Uso |
|-------|-----|
| `alias` | Identificador único de perfil (generado en el registro) |
| `birthDate` | Opcional |
| `height` | Opcional |
| `weight` | Opcional |

**Profile no es un perfil público de red social.** Representa datos de cuenta/jugador ligados al User, no publicaciones, feed ni grafo social.

### Preferencias (MongoDB)

Colección `user_preferences` (users-service): `userId`, `theme`, `language`, `notifications`, `metadata`.

---

## Endpoints disponibles

Prefijo global: `/api`.

### Health

| Método | Ruta | Auth |
|--------|------|------|
| GET | `/api/health` | No |

### Auth → auth-service

| Método | Ruta | Auth | Notas |
|--------|------|------|--------|
| POST | `/api/auth/register` | No | Crea User + Profile; rol Jugador |
| POST | `/api/auth/login` | No | Devuelve JWT |
| GET | `/api/auth/me` | **JWT** | Usuario autenticado |
| POST | `/api/auth/validate` | No (body `token`) | Valida JWT + usuario activo |

Códigos relevantes: **400** validación, **401** credenciales, **409** email duplicado.

### Users → users-service

| Método | Ruta | Auth |
|--------|------|------|
| GET | `/api/users/:id` | **JWT** |
| PATCH | `/api/users/:id/profile` | **JWT** |
| GET | `/api/users/:id/preferences` | **JWT** |
| PATCH | `/api/users/:id/preferences` | **JWT** |

#### Permisos (claim `role` del JWT)

| Quién | Qué puede hacer |
|-------|-----------------|
| Propietario (`sub` === `:id`) | Consultar y modificar su perfil y preferencias |
| **Administrador** | Consultar y modificar perfil/preferencias de cualquier usuario (mismos endpoints) |
| **Jugador** / **Empresario** / **Viewer** sobre `:id` ajeno | **403** |
| Sin token | **401** |

No hay endpoints administrativos adicionales: se reutilizan las rutas existentes.

### Profile stats → users-service

Perfil "rico" del jugador (6 estadísticas físicas, historial de tests físicos, evaluación psicológica, posición favorita). Sincroniza lo que antes vivía 100% en MMKV en el mobile. Todos los endpoints son **siempre "self"** (sin `:id`, se resuelven por el `sub` del JWT) — cualquier usuario autenticado gestiona únicamente su propio perfil.

| Método | Ruta | Auth | Notas |
|--------|------|------|--------|
| GET | `/api/profile/stats` | **JWT** | `PlayerStats` + último resultado por test físico + última evaluación psicológica + `favoritePosition`. Usado por el mobile para reconstruir el perfil en un dispositivo nuevo |
| PUT | `/api/profile/physical-tests/:testId` | **JWT** | Guarda un resultado de test físico y recalcula `PlayerStats` para ese eje. **409** si ya existe un resultado de ese `testId` en el mes calendario en curso (bloqueo mensual validado server-side, no solo en el cliente) |
| PUT | `/api/profile/psych-assessment` | **JWT** | Guarda el resultado del test psicológico (10 escenarios). Mismo bloqueo mensual server-side, **409** si ya hay una evaluación este mes |
| PATCH | `/api/profile` | **JWT** | Actualiza `favoritePosition` (y opcionalmente `name`) — reutiliza el mismo flujo que `PATCH /api/users/:id/profile` en vez de duplicar lógica de persistencia |

Modelos Prisma `PlayerStats`, `PhysicalTestResult`, `PsychAssessment` (`player_stats`, `physical_test_results`, `psych_assessments`) y `Profile.favoritePosition`. El mapeo `testId → statKey` vive en `@ef/contracts` (`TEST_ID_TO_STAT_KEY`) y debe mantenerse en sync manualmente con `apps/mobile/app/data/mockPlayerProfile.ts` (mobile y backend son paquetes npm independientes, sin tipos compartidos).

El mobile sigue siendo **local-first**: MMKV es la caché de lectura instantánea y funciona offline; el backend es la fuente de verdad. El sync al completar un test es best-effort (no bloquea al usuario si falla por falta de red — sin reintento automático todavía, deuda pendiente).

### Venues → venues-service

Gestión de canchas y reservas para el **dueño de cancha**. Todos los endpoints requieren JWT y rol **Empresario** o **Administrador**.

| Método | Ruta | Auth | Notas |
|--------|------|------|--------|
| GET | `/api/venues/mine` | **JWT** (Empresario/Administrador) | Lista las canchas del dueño autenticado |
| PUT | `/api/venues/mine` | **JWT** (Empresario/Administrador) | Crea o actualiza (upsert) una cancha propia |
| GET | `/api/reservations/mine` | **JWT** (Empresario/Administrador) | Lista las reservas recibidas en las canchas del dueño |
| PATCH | `/api/reservations/:id/status` | **JWT** (Empresario/Administrador) | Cambia el estado de una reserva propia (`pending` / `confirmed` / `cancelled`) |

Modelos Prisma `Venue` y `Reservation` (`venues`, `reservations`), relacionados por `venueId`. `Reservation.userId` referencia al jugador que reservó, pero **hoy no existe un endpoint para que el jugador cree reservas** — ver [Próximos pasos](#próximos-pasos).

---

## Base de datos

### PostgreSQL (Docker local)

| Parámetro | Valor |
|-----------|-------|
| Host | `localhost` |
| Puerto host | `5433` → 5432 contenedor |
| Usuario / DB | `ef_user` / `ef_db` |
| ORM | Prisma (`apps/backend/prisma/schema.prisma`) |

Migraciones en `apps/backend/prisma/migrations/`. Seed de roles: `npm run prisma:seed` desde `apps/backend`.

### MongoDB (Docker local)

| Parámetro | Valor |
|-----------|-------|
| URI típica (host) | `mongodb://…@localhost:27018/ef_mongo?authSource=admin` |
| Colección | `user_preferences` |

---

## Desarrollo local (modo híbrido)

Recomendado: PostgreSQL + MongoDB en Docker; **api-gateway**, **auth-service**, **users-service** y **venues-service** en local.

Detalle de arranque, puertos y `EADDRINUSE`: [README del monorepo](../README.md#3-backend--desarrollo-local-modo-hibrido).

```
API Gateway (local)     :3000  HTTP  /api/*
  ├── auth-service      :3001  TCP
  ├── users-service     :3002  TCP
  └── venues-service    :3003  TCP
        ├── PostgreSQL  :5433 (Docker)
        └── MongoDB     :27018 (Docker)
```

Desde `apps/backend`:

```bash
npm run start:auth
npm run start:users
npm run start:venues
npm run start:gateway
```

API: `http://localhost:3000/api`

---

## Estado de verificación

Validado en el entorno de desarrollo (modo híbrido):

- [x] PostgreSQL en marcha y accesible
- [x] Prisma conectado al esquema migrado
- [x] Register crea **User** + **Profile** (rol Jugador, email normalizado, bcrypt)
- [x] Login emite JWT; `/auth/me` y `/auth/validate` operativos
- [x] Errores **400**, **401** y **409** en auth
- [x] api-gateway ↔ auth-service ↔ users-service por TCP
- [x] Users con JWT, ownership y acceso de Administrador según la política anterior

---

## Próximos pasos

Pendientes (no implementados aún):

- Conectar el frontend móvil con las rutas de perfil/preferencias.
- Evolucionar **Profile** solo cuando existan necesidades reales de producto (campos ya modelados en Prisma).
- **Reintento automático / cola offline** para el sync de profile-stats: hoy el `PUT` al completar un test es best-effort (si falla, el resultado queda solo en MMKV hasta la próxima vez que el usuario complete otro test o entre a Profile con red).
- Sincronizar el **avatar/foto de perfil** al backend (sigue siendo local por ahora).
- **Lado jugador de venues-service**: búsqueda pública de canchas disponibles y creación de reservas por el jugador (hoy `venues-service` solo cubre el lado dueño de cancha: gestión de sus canchas y de las reservas que recibe). No se implementa en esta tarea — queda como tarea futura separada.
- Funcionalidades deportivas o sociales futuras (Grupos, Partidos, Ranking) cuando tengan sus propios contratos y servicios — ver [docs/GRUPOS-PARTIDOS-RESERVAS-SPEC.md](./GRUPOS-PARTIDOS-RESERVAS-SPEC.md).

---

## Registro de cambios

### 2026-08-18 — Sincronización de perfil (Tarea H)

- Nuevos modelos Prisma: `PlayerStats`, `PhysicalTestResult`, `PsychAssessment`, `Profile.favoritePosition`.
- Nuevos endpoints en `users-service`/gateway: `GET /api/profile/stats`, `PUT /api/profile/physical-tests/:testId`, `PUT /api/profile/psych-assessment`, `PATCH /api/profile` — ver [Profile stats → users-service](#profile-stats--users-service).
- Bloqueo mensual de tests validado server-side (409), no solo en el cliente.
- Mobile pasa a ser local-first con backend como fuente de verdad: MMKV sigue siendo la caché de lectura instantánea; el sync al completar un test es best-effort (sin reintento automático todavía).

### 2026-08-17 — Documentar venues-service

- Se documenta el tercer microservicio **venues-service** (:3003), ya presente en el código: gestión de canchas y reservas del lado dueño de cancha.
- Diagrama de arquitectura, tabla de piezas y desarrollo local actualizados a 3 servicios.
- Endpoints reales documentados: `GET/PUT /api/venues/mine`, `GET /api/reservations/mine`, `PATCH /api/reservations/:id/status`.
- Se deja explícito que falta el lado jugador (búsqueda pública + creación de reserva).

### 2026-07-31 — Auth, users y documentación alineados al runtime

- Auth con Prisma: registro crea User + Profile; login JWT; `/auth/me` y `/auth/validate`.
- Users protegido con JWT; propietario o Administrador.
- Documentación actualizada (Prisma, endpoints reales, sin TypeORM/Hostinger como camino activo).

### 2026-07-04 — Registro vía portal web / Docker monorepo

- Registro de jugadores desde `apps/web`; móvil abre `SIGN_UP_URL`.
- Dockerfiles y puertos Postgres host `5433`.
