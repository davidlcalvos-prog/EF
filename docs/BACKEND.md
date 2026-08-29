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
                ▼
           PostgreSQL
            (Prisma)
```

| Pieza | Rol |
|-------|-----|
| **api-gateway** | Entrada HTTP REST (`/api/*`), validación de DTOs, JWT, proxy TCP |
| **auth-service** | Registro, login, emisión/validación de JWT, creación de User + Profile |
| **users-service** | Lectura/actualización de perfil y preferencias (PostgreSQL) |
| **venues-service** | Canchas y reservas del dueño de cancha (rol Empresario/Administrador) sobre PostgreSQL |
| **PostgreSQL + Prisma** | Única base de datos (usuarios, grupos, partidos, canchas, reservas, torneos, preferencias) |

**Importante:** el frontend **nunca** debe llamar directamente a `auth-service`, `users-service` ni `venues-service`. Siempre consume el API Gateway en `/api/*`.

El dominio activo del jugador en backend es **auth + users** (incluye perfil "rico": stats, tests físicos, evaluación psicológica, Grupos, Partidos, Amistades, comodín) **+ el lado jugador de venues-service** (buscar cancha por tamaño y reservar, opcionalmente vinculado a un partido, Torneos/Copa Elite Forge).

**Despliegue de referencia** (Fase D.0): Docker Compose + Caddy sobre un único VPS Ubuntu — ver [`infrastructure/docker/DEPLOY.md`](../infrastructure/docker/DEPLOY.md). Los manifiestos de Kubernetes/AWS/Terraform quedaron archivados en `infrastructure/_legacy/` (referencia histórica, no se mantienen ni reflejan el despliegue real).

---

## Stack

| Capa | Tecnología |
|------|------------|
| Framework | NestJS 11 |
| Comunicación interna | TCP (`MessagePattern`) |
| SQL | PostgreSQL 16 + **Prisma** |
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

### Preferencias (PostgreSQL)

Tabla `user_preferences` (users-service, Prisma — migrada desde MongoDB en la Fase D.0): `userId`, `theme`, `language`, `notifications`, `metadata`.

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

### Groups → users-service

Grupos de jugadores (Fase 2 del roadmap — bloqueador de Partidos/Reservas del jugador/Campeonatos). Un usuario puede pertenecer a varios grupos simultáneamente, sin límite. Ver [docs/GRUPOS-PARTIDOS-RESERVAS-SPEC.md](./GRUPOS-PARTIDOS-RESERVAS-SPEC.md). **Solo backend en esta fase — sin pantallas en mobile todavía** (Fase 6).

| Método | Ruta | Quién puede | Notas |
|--------|------|-------------|--------|
| POST | `/api/groups` | Cualquier usuario autenticado | El creador queda con rol `creator` automáticamente |
| GET | `/api/groups/mine` | El propio usuario | Grupos donde es creador o miembro, con su rol y `memberCount` |
| GET | `/api/groups/:id` | Solo miembros del grupo | **403** si no pertenece. Detalle con todos los miembros y sus roles |
| POST | `/api/groups/:id/members` | Creador o admin | Agrega directo por `userId` o `email` (sin invitación en esta fase). **409** si ya es miembro |
| PATCH | `/api/groups/:id/members/:userId/role` | **Solo el creador** | Asigna/quita rol `admin`. **409** si ya hay 2 admins y se intenta un 3ro. El rol del creador no se puede cambiar |
| DELETE | `/api/groups/:id/members/:userId` | Ver jerarquía abajo | Creador quita a cualquiera menos a sí mismo. Admin solo quita members regulares (no otro admin ni al creador). Cualquiera puede salirse a sí mismo, **excepto el creador** |
| DELETE | `/api/groups/:id` | **Solo el creador** | Borra el grupo; cascada elimina memberships |

**Jerarquía de permisos:** creador > admin > member. Máximo **2 administradores por grupo**, validado server-side (no solo en el cliente). Todas las rutas devuelven **403** si el usuario autenticado no pertenece al grupo (excepto `POST /api/groups`, abierto a cualquiera).

Modelos Prisma `Group` y `GroupMembership` (`groups`, `group_memberships`), con `GroupRole` (`creator` | `admin` | `member`) y único `(groupId, userId)`.

**Pendiente / fuera de alcance de esta fase** (ver [Próximos pasos](#próximos-pasos)): flujo de invitación con aceptación/rechazo para unirse a un grupo (hoy se agrega directo), y transferencia de liderazgo (que el creador ceda su rol a otro miembro).

### Matches → users-service

Partidos (Fase 3 del roadmap — bloqueador de Reservas del jugador y Campeonatos). Reutiliza `Group`/`GroupMembership` de la Fase 2 (`GroupRepository` exportado desde `GroupsModule`), no duplica lógica de membership. **Solo backend en esta fase — sin pantallas en mobile todavía** (Fase 6).

| Método | Ruta | Quién puede | Notas |
|--------|------|-------------|--------|
| POST | `/api/matches` | Ver reglas abajo | El creador queda como primer participante automáticamente |
| GET | `/api/matches/mine` | Cualquier usuario autenticado | Partidos donde es participante, o pertenece a `originGroupId`/`opponentGroupId` |
| GET | `/api/matches/group/:groupId` | Solo miembros de ese grupo | **403** si no pertenece |
| GET | `/api/matches/:id` | Solo miembros de `originGroupId` u `opponentGroupId` | **403** si no pertenece a ninguno de los dos |
| POST | `/api/matches/:id/accept` | `creator`/`admin` de `opponentGroupId` | Solo si `status = pending_opponent`; **409** si no |
| POST | `/api/matches/:id/reject` | `creator`/`admin` de `opponentGroupId` | Pasa a `cancelled` |
| POST | `/api/matches/:id/join` | Miembro de un grupo elegible | Solo si `status = scheduled`. **409** si ya está lleno o ya se unió |
| POST | `/api/matches/:id/leave` | El propio participante | **404** si no estaba unido |
| PATCH | `/api/matches/:id/status` | `creator`/`admin` de `originGroupId` u `opponentGroupId` | Marca `played` o `cancelled` manualmente |

**Reglas de tipo de partido** (de [docs/GRUPOS-PARTIDOS-RESERVAS-SPEC.md](./GRUPOS-PARTIDOS-RESERVAS-SPEC.md)):

| Tipo | Quién lo crea | Confirmación |
|---|---|---|
| `internal` | Cualquier miembro de `originGroupId` (cualquier rol) | Status inicial `scheduled` directo — cupo se llena con `join` |
| `vs` | Solo `creator`/`admin` de `originGroupId` | Status inicial `pending_opponent` hasta que `creator`/`admin` de `opponentGroupId` acepte o rechace |

Modelos Prisma `Match` y `MatchParticipant` (`matches`, `match_participants`), enums `MatchType` (`internal`/`vs`) y `MatchStatus` (`draft`/`pending_opponent`/`scheduled`/`played`/`cancelled`). `reservationId` en el `MatchDto` se resuelve desde la relación inversa `Match.reservation` (FK real en `Reservation.matchId`, ver [Reservations (lado jugador) → venues-service](#reservations-lado-jugador--venues-service)).

### User Friendships → users-service

Amistad entre jugadores (Fase 10) y búsqueda/sugerencias (Fase 10.1). Sin rol especial, `JwtAuthGuard` en todas.

| Método | Ruta | Notas |
|--------|------|--------|
| GET | `/api/friendships` | Lista amistades del usuario autenticado. `?filter=accepted\|pending_received\|pending_sent` (default `accepted`) |
| GET | `/api/friendships/search` | Busca jugadores para agregar. `?q=` — ver regla de privacidad abajo |
| GET | `/api/friendships/suggestions` | Sugerencias (amigos en común, compañeros de grupo) |
| GET | `/api/friendships/status/:userId` | Estado de relación con otro usuario (`none`/`pending_sent`/`pending_received`/`accepted`) — usado por la ficha de miembro |
| POST | `/api/friendships` | Envía solicitud (body `{ userId }`). Si el otro ya había solicitado, se acepta directo en vez de crear una segunda fila |
| POST | `/api/friendships/:id/accept` | Acepta una solicitud recibida |
| DELETE | `/api/friendships/:id` | Rechaza, cancela o elimina una amistad (mismo endpoint para los tres casos según el estado) |

**Regla de privacidad de la búsqueda:** si `q` tiene forma de correo (`@` + `.` después), la búsqueda es **exacta** (`findActiveUserByEmail`) — nunca lista resultados parciales por email. Si no, busca por alias/nombre con coincidencia parcial (`@alias` o nombre), alias exacto primero.

Modelo Prisma `UserFriendship` (`user_friendships`) — ver [Modelos nuevos desde el 18/08](#modelos-nuevos-desde-el-1808).

**Feed filtrado por red** (Fase 10): `FeedRepository.visibleAuthorIds` calcula, para cada request, el propio usuario + sus amigos aceptados + todos los miembros de todos sus grupos — reemplaza el feed global de la Fase 5 (ver [Feed → users-service](#feed--users-service) abajo).

### Match Guest Requests → users-service

Comodín (Fase 11): el líder/vice de un partido `internal` `scheduled` al que le falta gente publica una vacante; otros jugadores cerca (por municipio) se postulan. Sin rol especial más allá de la validación server-side de liderazgo del partido.

| Método | Ruta | Notas |
|--------|------|--------|
| POST | `/api/matches/:matchId/guest-requests` | Publica la vacante (líder/vice). **409** si ya hay una `open` para ese partido |
| DELETE | `/api/matches/:matchId/guest-requests/current` | Cancela la vacante vigente |
| GET | `/api/matches/:matchId/guest-requests/current` | Vacante vigente de ese partido (o 404) |
| GET | `/api/guest-requests/nearby` | Vacantes abiertas cerca de la zona guardada del usuario autenticado (`Profile.municipalityCode`) |
| POST | `/api/guest-requests/:id/applications` | Se postula a una vacante |
| GET | `/api/guest-requests/:id/applications` | Lista postulaciones (líder/vice) |
| DELETE | `/api/guest-requests/applications/:id` | Retira una postulación propia |
| POST | `/api/guest-requests/applications/:id/accept` | Acepta una postulación — agrega al partido con `MatchParticipant.isGuest = true` |
| POST | `/api/guest-requests/applications/:id/reject` | Rechaza una postulación |

Modelos Prisma `MatchGuestRequest`/`MatchGuestApplication` (`match_guest_requests`/`match_guest_applications`). `Profile.notifyNearbyGuestRequests` (opt-in, default `false`) controla si el jugador recibe push cuando se publica una vacante cerca — no afecta qué ve en `nearby`, que siempre se calcula por zona.

### Geo → api-gateway (sin microservicio)

| Método | Ruta | Notas |
|--------|------|--------|
| GET | `/api/geo/municipalities` | `?q=&limit=` (máx. 30, default 10). Dataset estático de municipios de Colombia (código DANE, nombre, departamento, centroide) servido directo desde `libs/common` — no hay tabla ni microservicio detrás |

Base de la Fase L.0 (ubicación de perfil, grupo, cancha y partido) — ver [Modelos nuevos desde el 18/08](#modelos-nuevos-desde-el-1808).

### Venues → venues-service

Gestión de canchas y reservas para el **dueño de cancha**. Todos los endpoints requieren JWT y rol **Empresario** o **Administrador**.

| Método | Ruta | Auth | Notas |
|--------|------|------|--------|
| GET | `/api/venues/mine` | **JWT** (Empresario/Administrador) | Lista las canchas del dueño autenticado |
| PUT | `/api/venues/mine` | **JWT** (Empresario/Administrador) | Crea o actualiza (upsert) una cancha propia |
| GET | `/api/reservations/mine` | **JWT** (Empresario/Administrador) | Lista las reservas recibidas en las canchas del dueño |
| PATCH | `/api/reservations/:id/status` | **JWT** (Empresario/Administrador) | Confirma o rechaza una reserva `pending` de la app, o cancela cualquiera (`pending` / `confirmed` / `cancelled`) |
| POST | `/api/venues/:id/courts` | **JWT** (Empresario/Administrador) | Crea una cancha (`Court`) del complejo: nombre, `size`, `pricePerHourCents` propio, `surfaceType` opcional (Fase W.1) |
| PATCH | `/api/venues/:id/courts/:courtId` | **JWT** (Empresario/Administrador) | Edita una cancha propia |
| DELETE | `/api/venues/:id/courts/:courtId` | **JWT** (Empresario/Administrador) | Desactiva una cancha (`isActive = false`, no borra — puede tener reservas históricas) |
| POST | `/api/venues/reservations/phone` | **JWT** (Empresario/Administrador) | Carga una reserva telefónica (`source: phone`) eligiendo la cancha directo por `courtId`; nace `confirmed`. Requiere `customerName`, `customerPhone` opcional |
| PATCH | `/api/venues/reservations/:id/court` | **JWT** (Empresario/Administrador) | Reasigna manualmente una reserva de la app a otra cancha **activa del mismo tamaño** (ej. mantenimiento de último momento). **409** si la cancha destino es de otro tamaño o ya está ocupada en ese horario |

Modelos Prisma `Venue`, `Court` y `Reservation` (`venues`, `courts`, `reservations`) — ver [Modelos nuevos desde el 18/08](#modelos-nuevos-desde-el-1808).

### Reservations (lado jugador) → venues-service

Buscar cancha y reservar — cualquier usuario autenticado, sin rol especial. Endpoints separados de los de arriba (`ReservationsProxyController`, sin `RolesGuard`) para no mezclar permisos con el lado dueño de cancha.

| Método | Ruta | Auth | Notas |
|--------|------|------|--------|
| GET | `/api/venues` | **JWT** | Lista todas las canchas (`PublicVenueDto`): ya no expone canchas individuales, agrupa `courtSizes: [{ size, count, pricePerHourCents }]` por complejo (Fase W.1.1) — el jugador elige tamaño, no una cancha por nombre |
| GET | `/api/venues/:id/availability` | **JWT** | `?size=&startsAt=&endsAt=` → `{ totalCourts, availableCourts }` de ese tamaño en ese horario. Se consulta **antes** de dejar confirmar, para nunca chocar con un error de solape al final (Fase W.1.1) |
| POST | `/api/my-reservations` | **JWT** | Crea una reserva por `venueId` + `size` (ya no `courtId` directo). El backend **auto-asigna** una cancha activa de ese tamaño sin solape, dentro de una transacción con lock de fila (mismo patrón que la Fase 8.2) sobre todas las canchas candidatas — orden determinístico por `createdAt`. **409** si ninguna está libre. `matchId` opcional — ver reglas abajo. Nace `pending` (requiere aprobación del dueño, Fase W.1) |
| GET | `/api/my-reservations` | **JWT** | Reservas propias del usuario autenticado |
| GET | `/api/my-reservations/:id` | **JWT** | Detalle de una reserva propia. **403** si no es el dueño |
| PATCH | `/api/my-reservations/:id/cancel` | **JWT** | Cancela una reserva propia. **403** si no es el dueño, **409** si ya está `cancelled` o si `startsAt` ya pasó |

**Aprobación del dueño** (Fase W.1): una reserva creada desde la app (`source: app`) nace `pending` — el dueño la confirma o rechaza desde el portal (`PATCH /api/reservations/:id/status`, ver [Venues → venues-service](#venues--venues-service)). Las reservas telefónicas que carga el propio dueño (`source: phone`) nacen `confirmed` directo, sin este paso.

**Vincular una reserva a un partido** (`matchId` en el body de `POST /api/my-reservations`): solo `creator`/`admin` de `originGroupId` (o de `opponentGroupId` en un `vs`) puede vincular — **403** si no. **409** si el match ya tiene una reserva vinculada. `Reservation.matchId` es único y opcional (`@relation` real con `Match`, Fase 4 — antes era un `Match.reservationId` suelto sin relación, de la Fase 3).

El chequeo de liderazgo de grupo consulta `group_memberships` directo desde `venues-service` (mismo Postgres compartido) en vez de importar `GroupRepository` de `users-service`: son apps de monorepo independientes (`nest-cli.json`), sin alias de path entre `apps/*` — solo entre `libs/*`.

### Rankings → venues-service

Rankings de un campeonato de Copa Elite Forge (Fases 9 y 9.1) — **solo con los datos de ESE torneo**, no hay rankings globales/históricos ni tablas basadas en `PlayerStats`.

| Método | Ruta | Auth | Notas |
|--------|------|------|--------|
| GET | `/api/tournaments/:id/rankings` | **JWT** | `TournamentRankingsResponse`: cuatro tablas — `topScorers` (goleadores), `bestGoalkeepers` (menos goles recibidos por partido), `bestDefenders` (recuperos/dfr), `topAssisters` (asistencias). Cada entrada trae `displayName`, `favoritePosition`, `value` y `secondary` (partidos jugados) — sin avatar, la ficha del jugador al tocar una fila ya lo trae por `getPublicMemberProfile` |

Contrato en `libs/contracts/src/rankings/index.ts`. El acceso en mobile vive dentro de la sección de Campeonatos, no en el drawer.

### Feed → users-service

Posts, likes y comentarios. **Feed filtrado por red (Fase 10)** — ya no es global: `listPosts` solo trae posts del propio usuario, sus amigos aceptados (`UserFriendship`) y los miembros de todos sus grupos (`visibleAuthorIds`, ver [User Friendships → users-service](#user-friendships--users-service)). Sin rol especial, `JwtAuthGuard` en todos.

| Método | Ruta | Notas |
|--------|------|--------|
| POST | `/api/feed/posts` | Crea un post. `content` 1–2000 chars. **400** si `mediaUrl` viene sin `mediaType` `image`/`video` |
| GET | `/api/feed/posts` | Feed paginado (`?page=1&pageSize=20`, máx. 50), más nuevo primero. Incluye `likedByMe` del usuario autenticado |
| GET | `/api/feed/posts/:id` | Detalle de un post. **404** si no existe |
| DELETE | `/api/feed/posts/:id` | Borra un post propio. **403** si no eres el autor. Cascada borra sus likes y comentarios |
| POST | `/api/feed/posts/:id/like` | Alterna like (toggle) — devuelve el `PostDto` actualizado con `likesCount`/`likedByMe` |
| GET | `/api/feed/posts/:id/comments` | Comentarios paginados. **404** si el post no existe |
| POST | `/api/feed/posts/:id/comments` | Comenta en cualquier post existente. `content` 1–500 chars. **404** si el post no existe |
| DELETE | `/api/feed/comments/:id` | Borra un comentario. Puede el autor del comentario **o** el autor del post (moderación básica). **403** si no eres ninguno de los dos |

Modelos Prisma `Post`, `PostLike`, `PostComment` (`posts`, `post_likes`, `post_comments`), enum `PostMediaType` (`none`/`image`/`video`). `PostDto`/`CommentDto` están pensados para calzar directo con `FeedPost` del mobile (`authorName`, `authorHandle`, `authorAvatarBase64`, `mediaType`/`mediaUrl`, contadores, `likedByMe`) para que conectar la Fase 6 sea directo. `authorHandle` usa `@` + `Profile.alias`, o `@` + el local-part del email como fallback si el usuario no tiene `Profile` todavía (mismo patrón que `email.split("@")[0]` en `FeedComposeModal.tsx` del mobile). `authorAvatarBase64` (foto real del autor, foto de perfil ya mergeada) sale del mismo `include` que ya traía `alias` — sin consulta extra.

**No hay upload real de media** (sin S3/storage configurado) — `mediaUrl` solo acepta URLs externas ya alojadas. No se implementa: adjuntar un `Match` al post (chip "Partido" del compose modal), anuncios "Elite Forge" (siguen siendo contenido curado a mano en el frontend), notificaciones, ni editar posts/comentarios ya publicados.

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

### Modelos nuevos desde el 18/08

- **`UserFriendship`** (Fase 10) — amistad entre jugadores. Direccional en datos (`requesterId` → `addresseeId`) pero única lógicamente: `@@unique([requesterId, addresseeId])` y el service impide que existan a la vez `A→B` y `B→A` (si B solicita habiendo ya una `A→B` pendiente, se acepta esa). Estados `pending`/`accepted`.
- **`Court`** (Fase W.1) — cancha real dentro de un `Venue`, con `size` propio (`CourtSize`: `five`/`six`/`seven`/`eight`/`eleven`), `pricePerHourCents` propio (ya no un precio único de todo el complejo) e `isActive`. Un venue puede tener 0 canchas (no migrado, se completan desde "Mi cancha") o varias.
- **`MatchGuestRequest`** / **`MatchGuestApplication`** (Fase 11) — vacante de comodín publicada por el líder/vice de un partido `internal` `scheduled` al que le falta gente, y las postulaciones de otros jugadores a esa vacante. Solo una `open` por partido a la vez (validado en el servicio).
- **Ubicación** (Fase L.0) — `municipalityCode`/`city`/`department`/`latitude`/`longitude` agregados a `Profile`, `Group`, `Venue` (+ `locationSource`: `municipality` si es el centroide del municipio DANE, `pin` si el dueño ajustó un pin propio) y `Match` (+ `venueText` para sede sin cancha de la app; lat/lng se copian de la cancha o del grupo origen).
- **`Reservation.courtId`/`source`/`customerName`/`customerPhone`** (Fase W.1) — `courtId` vincula la reserva a una cancha específica del venue (null en reservas previas a esta fase); `source` (`app`/`phone`/`tournament`/`block`) distingue quién la originó — `app` nace `pending` (requiere aprobación del dueño), `phone` nace `confirmed` directo; `customerName`/`customerPhone` solo se llenan en reservas `phone`.
- **`UserPreferences`** (Fase D.0) — migrada desde MongoDB, ver [Preferencias (PostgreSQL)](#preferencias-postgresql) arriba.

---

## Desarrollo local (modo híbrido)

Recomendado: PostgreSQL en Docker; **api-gateway**, **auth-service**, **users-service** y **venues-service** en local.

Detalle de arranque, puertos y `EADDRINUSE`: [README del monorepo](../README.md#3-backend--desarrollo-local-modo-hibrido).

```
API Gateway (local)     :3000  HTTP  /api/*
  ├── auth-service      :3001  TCP
  ├── users-service     :3002  TCP
  └── venues-service    :3003  TCP
        └── PostgreSQL  :5433 (Docker)
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

Ya completado desde la última revisión de esta lista (no repetir como pendiente): mobile de Grupos/Partidos/Reservas/Feed conectado al backend real, Amistades + feed filtrado por red (Fase 10/10.1), Campeonatos/Copa Elite Forge (Fase 7) con rankings de 4 tablas (Fase 9/9.1), avatar de perfil sincronizado al backend y ahora visible en el feed (Fase 12), canchas reales por tamaño con aprobación y auto-asignación (Fase W.1/W.1.1), ubicación (Fase L.0), comodín para partidos internos (Fase 11), MongoDB eliminado (Fase D.0).

Pendientes (no implementados aún):

- **Reintento automático / cola offline** para el sync de profile-stats: hoy el `PUT` al completar un test sigue siendo best-effort (si falla, el resultado queda solo en MMKV hasta la próxima vez que el usuario complete otro test o entre a Profile con red).
- **Flujo de invitación** para unirse a un grupo (con aceptación/rechazo) — hoy `POST /api/groups/:id/members` agrega directo, sin confirmación del invitado.
- **Transferencia de liderazgo** de un grupo (que el creador ceda su rol `creator` a otro miembro) — hoy el creador es fijo de por vida del grupo.
- **Upload real de media** para el Feed (necesita S3/storage, no configurado) — hoy `mediaUrl` solo acepta URLs externas ya alojadas.
- Adjuntar un `Match` a un post del Feed, anuncios "Elite Forge" desde backend, notificaciones de likes/comentarios del Feed (sí existen push de partidos VS y reservas), disponibilidad avanzada por horarios configurables del venue (`Venue.availability` existe pero no se valida contra el rango pedido todavía), pagos, estadísticas post-partido que alimentan el perfil — ver [docs/GRUPOS-PARTIDOS-RESERVAS-SPEC.md](./GRUPOS-PARTIDOS-RESERVAS-SPEC.md).
- **Backlog de producto sin iniciar:** Retos, ranking global (hoy los rankings son solo por torneo), Schools.
- **En curso, sin mergear a `Dev-David` todavía:** comodín múltiple (`feature/comodin-multiple`) — no documentar hasta que mergee.

---

## Registro de cambios

### 2026-08-29 — Fotos de perfil reales en el feed

- `PostDto`/`CommentDto` ganan `authorAvatarBase64: string | null` — sale del mismo `include` de `Profile` que ya traía `alias` (`feed.repository.ts`), sin consulta extra.

### 2026-08-27 — Canchas reales y reservas por tamaño (Fase W.1 + W.1.1)

- Nuevo modelo Prisma `Court` (`courts`): cancha real dentro de un `Venue`, con `size`, `pricePerHourCents` propio e `isActive`. `Reservation` gana `courtId`, `source` (`app`/`phone`/`tournament`/`block`), `customerName`, `customerPhone`.
- **Fase W.1:** nuevos endpoints `POST/PATCH/DELETE /api/venues/:id/courts` (gestión de canchas del dueño) y `POST /api/venues/reservations/phone` (reserva telefónica, nace `confirmed`). Las reservas de la app (`source: app`) pasan a nacer `pending` y requieren aprobación del dueño (`PATCH /api/reservations/:id/status`, ya existente).
- **Fase W.1.1:** el jugador ya no elige una cancha por nombre — elige complejo + **tamaño**. Nuevo `GET /api/venues/:id/availability` para chequear cupo antes de confirmar. `POST /api/my-reservations` pasa a recibir `venueId` + `size` (no `courtId`); el backend auto-asigna una cancha activa sin solape dentro de una transacción con lock de fila (mismo patrón de concurrencia de la Fase 8.2), orden determinístico por `createdAt`. Nuevo `PATCH /api/venues/reservations/:id/court` para que el dueño reasigne manualmente a otra cancha del mismo tamaño (ej. mantenimiento).
- Ver [Venues → venues-service](#venues--venues-service) y [Reservations (lado jugador) → venues-service](#reservations-lado-jugador--venues-service).

### 2026-08-26 — Comodín para partidos internos (Fase 11)

- Nuevos modelos Prisma `MatchGuestRequest`/`MatchGuestApplication` (`match_guest_requests`/`match_guest_applications`), enums `MatchGuestRequestStatus` y `MatchGuestApplicationStatus`. `MatchParticipant.isGuest` marca a quien entró como comodín en vez de por membresía de grupo.
- Nuevos endpoints: `POST/DELETE /api/matches/:matchId/guest-requests`, `GET /api/matches/:matchId/guest-requests/current`, `GET /api/guest-requests/nearby`, `POST/GET /api/guest-requests/:id/applications`, `DELETE /api/guest-requests/applications/:id`, `POST /api/guest-requests/applications/:id/{accept,reject}` — ver [Match Guest Requests → users-service](#match-guest-requests--users-service).
- `Profile.notifyNearbyGuestRequests` (opt-in, default `false`): controla el push cuando se publica una vacante cerca; no afecta qué trae `nearby`.

### 2026-08-26 — Fundaciones de ubicación (Fase L.0)

- Campos `municipalityCode`/`city`/`department`/`latitude`/`longitude` agregados a `Profile`, `Group`, `Venue` (+ `locationSource`: `municipality` o `pin`) y `Match` (+ `venueText`, sede sin cancha de la app).
- Nuevo endpoint `GET /api/geo/municipalities` (`?q=&limit=`) — dataset estático de municipios de Colombia servido directo desde el gateway (`libs/common`), sin microservicio ni tabla — ver [Geo → api-gateway](#geo--api-gateway-sin-microservicio).
- lat/lng se resuelven siempre server-side (centroide del municipio, o pin del dueño validado a <50 km del centroide) — nunca se aceptan coordenadas sueltas del cliente sin validar.

### 2026-08-26 — Búsqueda y sugerencias de amigos (Fase 10.1)

- Nuevos endpoints `GET /api/friendships/search` y `GET /api/friendships/suggestions` — ver [User Friendships → users-service](#user-friendships--users-service).
- Regla de privacidad: búsqueda por correo es **siempre exacta** (nunca lista resultados parciales por email); por alias/nombre admite coincidencia parcial.

### 2026-08-26 — Amistad entre jugadores y feed filtrado (Fase 10)

- Nuevo modelo Prisma `UserFriendship` (`user_friendships`), estados `pending`/`accepted`, único por par direccional.
- Nuevos endpoints `GET/POST/DELETE /api/friendships`, `POST /api/friendships/:id/accept`, `GET /api/friendships/status/:userId` — ver [User Friendships → users-service](#user-friendships--users-service).
- **`GET /api/feed/posts` deja de ser global**: filtra por `visibleAuthorIds` (propio usuario + amigos aceptados + compañeros de cualquier grupo) — ver [Feed → users-service](#feed--users-service).

### 2026-08-25 — Deploy en VPS con Docker Compose + Caddy, MongoDB eliminado (Fase D.0)

- **MongoDB eliminado.** `UserPreferences` (única colección) migra a PostgreSQL/Prisma (`user_preferences`) — ni mobile ni web lo consumían todavía, no hubo datos que migrar.
- Despliegue de referencia: VPS Ubuntu + Docker Compose + Caddy (HTTPS automático) — ver [`infrastructure/docker/DEPLOY.md`](../infrastructure/docker/DEPLOY.md). Manifiestos de Kubernetes/AWS/Terraform archivados en `infrastructure/_legacy/` (ya no se mantienen).
- CI: la rama `Dev-David` se agrega a los triggers de `push`/`pull_request` (antes la rama de trabajo real no corría CI).

### 2026-08-25 — Rankings completos: mejor defensa y mejor distribuidor (Fase 9.1)

- `TournamentRankingsResponse` pasa de 2 a **4 tablas**: se agregan `bestDefenders` (recuperos/dfr) y `topAssisters` (asistencias), junto a `topScorers` y `bestGoalkeepers` ya existentes de la Fase 9.
- Sin cambios de modelo — todo sale de `TournamentPlayer`/`playerStats` (JSON) ya existentes por partido de torneo.
- Ver [Rankings → venues-service](#rankings--venues-service).

### 2026-08-25 — Hardening de concurrencia (Fase 8.2)

- `MatchRepository.addParticipant`/`addVsParticipant`: chequeo de cupo + insert en la **misma transacción**, serializados con `SELECT ... FOR UPDATE` sobre la fila del `Match` — dos `join()` concurrentes al mismo partido ya no pueden pasar ambos el chequeo de cupo (antes eran dos statements sueltos).
- `markAlertSent` pasa a `updateMany` con guard `{ [field]: false }` en el `where` — idempotente ante dos corridas concurrentes del cron de alertas.
- `TournamentRepository`/`TournamentsService`: generación de fixture transaccional; rankings agrupados por `userId` (antes podían duplicar filas de un jugador con más de una entrada de stats).
- Mismo patrón de lock de fila reutilizado después en la Fase W.1.1 para la auto-asignación de cancha por tamaño.

### 2026-08-18 — Backend del Feed (Fase 5)

- Nuevos modelos Prisma: `Post`, `PostLike`, `PostComment` (enum `PostMediaType`).
- Nuevos endpoints en `users-service`/gateway: `POST/GET /api/feed/posts`, `GET/DELETE /api/feed/posts/:id`, `POST /api/feed/posts/:id/like`, `GET/POST /api/feed/posts/:id/comments`, `DELETE /api/feed/comments/:id` — ver [Feed → users-service](#feed--users-service).
- Feed **global** entre todos los usuarios autenticados (sin `Friendship` en el MVP todavía — decisión de alcance explícita, no un descuido).
- `PostDto`/`CommentDto` diseñados para calzar directo con `FeedPost` del mobile (`authorName`, `authorHandle` con fallback a email, `mediaType`/`mediaUrl`, contadores, `likedByMe`), pensando en que conectar la Fase 6 sea directo.
- Todos los métodos que mutan devuelven el DTO actualizado o `{ success: true }`, nunca `void` (patrón consistente desde el bug de la Fase 2).

### 2026-08-18 — Backend de Reservas del jugador (Fase 4)

- **Fix**: `VenuesService.updateReservationStatus` devuelve el `ReservationDto` actualizado en vez de `void` — mismo bug de `EmptyError` (500 en el gateway pese a que Postgres se actualizaba bien) encontrado y arreglado en Grupos (Fase 2), esta vez en `venues-service`.
- `Reservation.matchId` ahora es una FK real a `Match` (antes `Match.reservationId` era un `String?` suelto sin `@relation`, de la Fase 3).
- Nuevos endpoints en `venues-service`/gateway (lado jugador, sin rol especial): `GET /api/venues`, `POST /api/my-reservations`, `GET /api/my-reservations`, `GET /api/my-reservations/:id`, `PATCH /api/my-reservations/:id/cancel` — ver [Reservations (lado jugador) → venues-service](#reservations-lado-jugador--venues-service).
- Reglas server-side: anti-solapamiento de horario por venue, vínculo a un match solo por `creator`/`admin` del grupo del match, un match solo puede tener una reserva vinculada, cancelación solo del dueño y solo antes de que empiece.

### 2026-08-18 — Backend de Partidos (Fase 3)

- Nuevos modelos Prisma: `Match`, `MatchParticipant` (enums `MatchType`, `MatchStatus`), reutilizando `Group`/`GroupMembership` de la Fase 2 sin duplicar lógica de membership.
- Nuevos endpoints en `users-service`/gateway: `POST /api/matches`, `GET /api/matches/mine`, `GET /api/matches/group/:groupId`, `GET /api/matches/:id`, `POST /api/matches/:id/{accept,reject,join,leave}`, `PATCH /api/matches/:id/status` — ver [Matches → users-service](#matches--users-service).
- Reglas de negocio validadas server-side: interno (cualquier miembro crea, cupo controla el `join`) vs VS (solo creator/admin crea y solo creator/admin del rival acepta/rechaza).
- Todos los métodos que mutan devuelven el `MatchDto` actualizado (nunca `void`), aplicando la lección del bug de `EmptyError` encontrado en la Fase 2.

### 2026-08-18 — Backend de Grupos (Fase 2)

- Nuevos modelos Prisma: `Group`, `GroupMembership` (rol `creator`/`admin`/`member`, único por `groupId+userId`).
- Nuevos endpoints en `users-service`/gateway: `POST /api/groups`, `GET /api/groups/mine`, `GET /api/groups/:id`, `POST /api/groups/:id/members`, `PATCH /api/groups/:id/members/:userId/role`, `DELETE /api/groups/:id/members/:userId`, `DELETE /api/groups/:id` — ver [Groups → users-service](#groups--users-service).
- Reglas de negocio validadas server-side: máximo 2 admins por grupo (409), jerarquía creador > admin > member, 403 si no es miembro.
- Bug encontrado y corregido corriendo contra Docker: `@MessagePattern` que resuelve `void` rompe la respuesta RPC (`EmptyError` → 500) aunque la mutación en Postgres se aplique bien. Mismo patrón detectado como pendiente en `venues-service` (no corregido ahí, fuera de alcance de esta fase).
- Solo backend — sin pantallas en mobile (Fase 6 pendiente).

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
