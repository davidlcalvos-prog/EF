# Elite Forge — Documentación Frontend (Mobile)

Registro técnico de la implementación del frontend móvil en el monorepo `EF`. Para producto y negocio, ver [ELITE_FORGE.md](./ELITE_FORGE.md).

---

## Overview

El frontend vive en `apps/mobile/` y es una aplicación **React Native** generada con **Ignite CLI**, extendida con **Tamagui** como sistema de diseño y componentes UI propios bajo `app/components/ui/`.

### Estado actual

| Área | Estado |
|------|--------|
| Pantalla de **Login** | Implementada + conectada al API Gateway |
| Pantalla **Perfil** | Implementada (stats, tests físicos in-app, test psicológico, edición, avatar sincronizado al backend, sugerencia de posición) |
| Pantalla **Feed** (red social) | Implementada y conectada al backend — filtrada por red (amigos + grupos, Fase 10), fotos de perfil reales |
| Grupos / Partidos / Reservas / Amigos / Comodín | Implementadas y conectadas al backend (ver secciones correspondientes más abajo) |
| Pantalla de **Register** (placeholder) | En stack; registro real vía portal web externo |
| **Alertas nativas** | Eliminadas — `AppAlert` propio en toda la app, ver [AppAlert](#appalert-reemplazo-de-alertalert-nativo) |
| **Expo Dev Client** | Configurado para Android/iOS |

### Flujo de arranque

```
app.tsx
  ├── TamaguiProvider (tamagui.config.ts + tokens Elite Forge)
  ├── AuthProvider
  ├── SafeAreaProvider + KeyboardProvider
  └── AppNavigator
        ├── No autenticado → Login / Register
        └── Autenticado     → Feed / Demo
```

La pantalla inicial para usuarios autenticados es **Feed** (`FeedScreen`). Sin sesión → **Login**.

---

## Stack tecnológico

| Capa | Tecnología | Versión / notas |
|------|------------|-----------------|
| Runtime | React Native | 0.83.6 |
| UI library | React | 19.2.0 |
| Framework móvil | Expo | ~55.0.27 |
| Dev build | expo-dev-client | Requiere build nativo (no Expo Go) |
| Boilerplate | Ignite CLI | Estructura base del proyecto |
| Design system | Tamagui | ^2.4.0 |
| Navegación | React Navigation | Native Stack v7 |
| Animaciones | react-native-reanimated | 4.2.1 |
| Gestos | react-native-gesture-handler | ~2.30.0 |
| Teclado | react-native-keyboard-controller | 1.20.7 |
| i18n | i18next + react-i18next | 7 idiomas |
| Persistencia local | react-native-mmkv | 3.3.3 |
| Fuentes | @expo-google-fonts/space-grotesk | — |
| Web (opcional) | react-native-web | ~0.21.0 |
| Lenguaje | TypeScript | ~5.9.2 |

---

## Dependencias principales

### Producción (`apps/mobile/package.json`)

| Paquete | Uso en Elite Forge |
|---------|-------------------|
| `expo`, `expo-dev-client` | Entorno, builds nativos, Metro |
| `tamagui`, `@tamagui/config`, `@tamagui/babel-plugin`, `@tamagui/metro-plugin` | Tema, componentes, compilación |
| `@react-navigation/native`, `native-stack`, `bottom-tabs` | Navegación entre pantallas |
| `react-native-reanimated` | Animaciones de hover/press en login |
| `react-native-safe-area-context` | Insets y layout responsivo |
| `react-native-screens` | Optimización de navegación nativa |
| `react-native-edge-to-edge` | Pantalla edge-to-edge |
| `i18next`, `react-i18next`, `expo-localization` | Traducciones |
| `apisauce` | Cliente HTTP (login + demo podcast) |
| `date-fns` | Formateo de fechas |
| `react-native-drawer-layout` | Drawer lateral del Feed (menú) |
| `react-native-svg` | Radar chart de stats en Perfil |
| `expo-image-picker` | Selección de foto de perfil desde galería |
| `expo-file-system` | Persistencia local del avatar en `document/profile-avatars/` |

### Desarrollo

| Paquete | Uso |
|---------|-----|
| `typescript` | Tipado estático |
| `eslint`, `eslint-config-expo`, `prettier` | Lint y formato |
| `jest`, `jest-expo`, `@testing-library/react-native` | Tests |
| `reactotron-react-native` | Debug en desarrollo |

---

## Estructura relevante

```
apps/mobile/
├── app/
│   ├── app.tsx                    # Entry: providers + navigator
│   ├── components/ui/           # Componentes Elite Forge reutilizables
│   ├── hooks/
│   │   ├── useResponsiveLayout.ts
│   │   └── useInteractiveMotion.ts
│   ├── data/
│   │   ├── mockFeedPosts.ts       # Posts mock del Feed (sin backend)
│   │   ├── mockPlayerProfile.ts   # Stats, definiciones de tests físicos, Tag ID
│   │   ├── profileTestScoring.ts  # Conversión raw → score 0–100 por test
│   │   ├── psychologicalTest.ts   # 10 preguntas situacionales + rasgos psicológicos
│   │   ├── suggestPlayerPosition.ts # Sugerencia de posición (físico + mental)
│   │   └── beepTestProtocol.ts    # Protocolo del beep test in-app
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── feed/
│   │   │   ├── FeedScreen.tsx
│   │   │   └── components/        # FeedNavbar, FeedDrawer, FeedPostCard, etc.
│   │   └── profile/               # Módulo Perfil (rama Dev-David)
│   │       ├── ProfileScreen.tsx
│   │       ├── ProfileEditScreen.tsx
│   │       ├── PhysicalTestSessionScreen.tsx
│   │       ├── PsychologicalTestScreen.tsx
│   │       ├── useProfileStats.ts
│   │       ├── usePlayerProfile.ts
│   │       ├── components/        # Radar, avatar, tests, medición, psico
│   │       ├── hooks/             # useStopwatch, useBeepTestRunner
│   │       └── utils/
│   │           └── pickProfileImage.ts
│   ├── utils/
│   │   ├── profileStatsStorage.ts # MMKV: tests físicos + stats
│   │   └── playerProfileStorage.ts # MMKV: perfil + test psicológico
│   ├── navigators/AppNavigator.tsx
│   ├── theme/
│   │   ├── eliteForgeColors.ts
│   │   └── context.tsx
│   └── i18n/                      # en, es, fr, ja, ko, hi, ar
├── assets/images/
│   └── elite-forge-logo.png       # Logo en app (RGBA, transparente)
├── tamagui.config.ts              # Tokens de color Elite Forge
└── package.json
```

**Assets compartidos con documentación:**

| Ruta | Descripción |
|------|-------------|
| `docs/assets/elite-forge-logo.png` | Fuente oficial del logo |
| `apps/mobile/assets/images/elite-forge-logo.png` | Copia usada por la app |

---

## Sistema de diseño

### Paleta (`eliteForgeColors.ts` + `tamagui.config.ts`)

| Token | Hex | Uso |
|-------|-----|-----|
| `emerald` | `#00CEC8` | Acentos izquierda, botón primario, enlaces |
| `orange` | `#FF8C00` | Acentos derecha, barra del formulario |
| `carbon` | `#424242` | Fondo principal de pantallas auth |
| `white` | `#FFFFFF` | Texto |
| `carbonElevated` | `#363636` | Tarjeta del formulario de login |
| `carbonBorder` | `#555555` | Bordes |
| `carbonInput` | `#2e2e2e` | Fondo de inputs |
| `mutedSurface` | `#9C9C9C` | Token reservado (no usado como fondo global) |

### Split-color en login

La tarjeta de login incluye una franja superior de 3px: mitad esmeralda, mitad naranja, reflejando la identidad bicolor del producto.

### Logo

- Componente: `EliteForgeLogo` (`app/components/ui/Logo.tsx`)
- Render con `Image` de **react-native** (no Tamagui `Image` con `require()`)
- PNG con **fondo transparente** (canal alpha)
- Tamaño responsivo vía `useResponsiveLayout().logoWidth` (62–68% del ancho, máx. 280–320px)

---

## Componentes UI implementados

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| `Button` | `Button.tsx` | Variantes: primary, secondary, outline, ghost. Animación press/hover |
| `Input` | `Input.tsx` | Label, campo, toggle Ver/Ocultar en contraseña. Focus/hover animado |
| `SocialButton` | `SocialButton.tsx` | Google y Facebook. Modo `compact` para fila horizontal |
| `AuthFormCard` | `AuthFormCard.tsx` | Contenedor del formulario con barra bicolor y hover |
| `EliteForgeLogo` | `Logo.tsx` | Logo de marca responsivo |
| `Divider` | `Divider.tsx` | Separador con etiqueta ("o continuar con") |
| `LinkText` | `LinkText.tsx` | Texto + enlace (ej. crear cuenta) |
| `Card`, `Navbar`, `Toggle` | — | Base reutilizable / demo |

Export centralizado: `app/components/ui/index.ts`

---

## Pantalla de Login — implementación

**Archivo:** `app/screens/auth/LoginScreen.tsx`

### Layout

- Fondo `#424242` (Gris Carbón)
- `KeyboardAvoidingView` + `ScrollView` responsivo
- `useResponsiveLayout()` para padding, gaps y ancho máximo
- Sin título "Login" — solo logo ampliado + subtítulo

### Contenido (de arriba a abajo)

1. **Logo Elite Forge** (grande, centrado)
2. **Subtítulo** i18n (`loginScreen:subtitle`)
3. **AuthFormCard** con:
   - Input usuario
   - Input contraseña (secure + Ver/Ocultar)
   - Botón Sign in (conectado al API)
   - Enlace a Register
4. **Divider** + botones sociales **Gmail** y **Facebook** en **una fila** (modo compact)

### Comportamiento

- Login real vía `api.login()`; token en `AuthContext` (MMKV) → redirección automática a **Feed**
- `handleCreateAccount` abre `Config.SIGN_UP_URL` → `apps/web` `/auth/sign-up` (NestJS/Prisma)
- Botones Gmail/Facebook (solo UI)

---

## Pantalla Feed — red social

**Archivo principal:** `app/screens/feed/FeedScreen.tsx`

Destino post-login. Estilo tipo **Facebook**: publicaciones de jugadores, anuncios Elite Forge, composer superior y acciones sociales — conectado al backend real (`useFeed.ts`, `GET/POST /api/feed/*`).

**Ya no es un feed global** (Fase 10): `useFeed` pagina `GET /api/feed/posts`, que en el backend ya viene filtrado por red — el usuario ve sus propios posts, los de sus amigos aceptados y los de cualquier compañero de sus grupos (ver [BACKEND.md → Feed](./BACKEND.md#feed--users-service)). Los anuncios "Elite Forge" siguen intercalándose client-side desde `mockFeedPosts.ts` (uno cada 4 posts reales) — eso no cambió.

### Layout

- `react-native-drawer-layout` — menú lateral (~82% ancho)
- `FeedNavbar` — barra bicolor, botón menú animado, logo, miniatura de perfil del usuario
- `FlatList` responsiva con `useResponsiveLayout()`
- Fondo `#424242`

### Componentes del Feed

| Componente | Descripción |
|------------|-------------|
| `FeedNavbar` | Navbar interactivo; logo centrado; avatar (foto real o iniciales) abre el drawer |
| `FeedDrawer` | Perfil, Grupos, Amigos, Partidos, Cerca de mí, Campeonatos, Reservas + cerrar sesión — todas navegan a pantallas reales |
| `FeedComposer` | “¿Qué quieres compartir?” + accesos Foto / Video / Partido (compose real conectado al backend; adjuntar foto/video/partido sigue siendo stub) |
| `FeedPostCard` | Tarjeta de publicación real: texto, imagen, video, likes/comentarios, foto de perfil del autor |
| `FeedAvatar` | Avatar circular — foto real (`photoBase64`) si el autor tiene una, si no iniciales + color, con animación press |
| `mockFeedPosts.ts` | Solo los anuncios "Elite Forge" (intercalados client-side); los posts reales vienen del backend |

### Drawer — accesos

| Ítem | Destino |
|------|--------|
| Perfil | `ProfileScreen` |
| Grupos | `GroupsScreen` |
| Amigos | `FriendsScreen` (Fase 10) |
| Partidos | `MatchesScreen` |
| Cerca de mí | `NearbyGuestRequestsScreen` — vacantes de comodín cerca de tu zona (Fase 11) |
| Campeonatos | `TournamentsScreen` |
| Reservas | `ReservationsScreen` |
| Cerrar sesión | `logout()` → Login |

### i18n

Claves `feedScreen:*` y `feedDrawer:*` en los 7 idiomas.

---

## Animaciones e interacción

**Hook:** `app/hooks/useInteractiveMotion.ts`  
**Motor:** `react-native-reanimated` (spring: damping 20, stiffness 320)

| Preset | Elemento | Hover (web) | Press / focus |
|--------|----------|-------------|---------------|
| `button` | Sign in | Escala +2%, sube 2px | Escala 97% |
| `social` | Gmail / Facebook | Escala +3%, sube 2px | Escala 96% + cambio de color |
| `card` | AuthFormCard | Sube 3px, borde esmeralda | — |
| `input` | Campos usuario/contraseña | Escala +1.2%, borde esmeralda | Igual al enfocar |

> En **Android/iOS** no hay hover con ratón; el feedback es al **presionar** y al **enfocar** inputs. En **web** también aplica hover.

---

## Responsividad

**Hook:** `app/hooks/useResponsiveLayout.ts`

| Parámetro | Lógica |
|-----------|--------|
| `isSmallScreen` | Altura &lt; 700px o ancho &lt; 360px |
| `isTablet` | Ancho ≥ 768px |
| `horizontalPadding` | max(16, 6% del ancho) |
| `contentMaxWidth` | Hasta 440px (480 en tablet) |
| `logoWidth` | 62–68% del ancho, tope 280–320px |
| `sectionGap` | 14 / 22 / 28 según tamaño |
| Safe areas | `useSafeAreaInsets()` |

**Regla Cursor:** `.cursor/rules/mobile-responsive-ui.mdc` — toda pantalla nueva debe seguir este patrón.

---

## Internacionalización (i18n)

Claves relevantes del login en `app/i18n/*.ts`:

| Clave | Ejemplo (es) |
|-------|----------------|
| `loginScreen:subtitle` | Subtítulo de bienvenida |
| `loginScreen:usernameFieldLabel` | Usuario |
| `loginScreen:passwordFieldLabel` | Contraseña |
| `loginScreen:signInButton` | Iniciar sesión |
| `loginScreen:googleButton` | Continuar con Gmail (accesibilidad) |
| `loginScreen:googleButtonShort` | Gmail (UI compacta) |
| `loginScreen:facebookButton` | Continuar con Facebook |
| `loginScreen:facebookButtonShort` | Facebook |

Claves del perfil: `profileScreen:*` (stats, tests físicos, test psicológico, edición, posiciones, medición in-app).

Idiomas: `en`, `es`, `fr`, `ja`, `ko`, `hi`, `ar`.

---

## Pantalla Perfil — implementación (rama `Dev-David`)

Módulo completo de perfil de jugador en `app/screens/profile/`. **Local-first**: persistencia local con **MMKV** por usuario (`authEmail` o `"guest"`) para lectura instantánea y uso offline; desde la Tarea H, stats/tests físicos/evaluación psicológica/posición favorita se sincronizan con `users-service` (backend = fuente de verdad) — ver [BACKEND.md → Profile stats](./BACKEND.md#profile-stats--users-service).

### Navegación

Rutas en `AppNavigator.tsx` / `navigationTypes.ts`:

| Ruta | Pantalla | Parámetros |
|------|----------|------------|
| `Profile` | `ProfileScreen` | — |
| `ProfileEdit` | `ProfileEditScreen` | — |
| `PhysicalTestSession` | `PhysicalTestSessionScreen` | `{ testId: PhysicalTestId }` |
| `PsychologicalTest` | `PsychologicalTestScreen` | — |

**Entrada desde Feed:** avatar del `FeedNavbar` o ítem **Perfil** del `FeedDrawer` → `navigation.navigate("Profile")`.

### Arquitectura de datos

| Archivo | Responsabilidad |
|---------|-----------------|
| `mockPlayerProfile.ts` | 6 stats, 6 tests físicos, definiciones, bloqueo mensual, Tag ID |
| `profileTestScoring.ts` | Raw de medición → score 0–100 |
| `psychologicalTest.ts` | 10 preguntas situacionales, rasgos, scoring teamwork/mindset |
| `suggestPlayerPosition.ts` | Sugerencia entre 7 posiciones (72% físico + 28% mental) |
| `profileStatsStorage.ts` | MMKV `profileStats.v2.{userKey}` |
| `playerProfileStorage.ts` | MMKV `playerProfile.v1.{userKey}` |
| `hydrateProfileFromBackend.ts` | `GET /api/profile/stats` → puebla MMKV cuando no hay datos locales (dispositivo nuevo / datos borrados) |

**Hooks:**

| Hook | Uso |
|------|-----|
| `useProfileStats` | Stats, radar, tests físicos, completar test, sugerencia de posición |
| `usePlayerProfile` | Datos personales, avatar, posición favorita, test psicológico |

### Stats y radar (`StatsRadarChart`)

Seis estadísticas, **una por test físico**:

| Stat | Test |
|------|------|
| Ataque | 10 tiros desde 16 m |
| Defensa | Control y recuperación (rúbrica) |
| Resistencia | Beep test |
| Velocidad | Sprint 30 m |
| Pases | Loughborough |
| Regate | Agilidad Illinois |

- Gráfico **radar SVG** (`react-native-svg`): cuadrícula, ejes, polígono relleno, puntos y etiquetas.
- Filas inferiores clicables → abren el test correspondiente.
- Promedio **AVG** solo con stats ya medidas (> 0).

### Tests físicos in-app

Flujo en `PhysicalTestSessionScreen`: **protocolo → medir → confirmar**.

| Test ID | Panel de medición |
|---------|-------------------|
| `attackShots16m` | `TestShotCounterPanel` (goles / fallos) |
| `defenseControl` | `TestDefenseRubricPanel` (rúbrica 1–5) |
| `beepTest` | `TestBeepRunnerPanel` + `useBeepTestRunner` |
| `sprint30m` | `TestStopwatchPanel` |
| `loughboroughPass` | `TestPassCounterPanel` |
| `illinoisAgility` | `TestStopwatchPanel` |

- **Bloqueo mensual** por test (calendario); no se puede repetir hasta el mes siguiente.
- Resultado guardado en MMKV; el radar se actualiza al volver al perfil (`useFocusEffect`).
- Botón **dev** (`__DEV__`): “Reiniciar tests” limpia tests físicos + psicológico.

### Sugerencia de posición

`PositionSuggestionCard` + `suggestPlayerPosition()`:

- **7 posiciones:** ST, extremo, CAM, CM, CDM, lateral, central.
- Pesos ideales por stat según posición.
- Confianza según cobertura de tests (mín. 3 para “lista”) y margen entre 1.º y 2.º.
- **Posición favorita** (editar perfil) tiene prioridad en el header (badge “Favorita”).
- Sin favorita: muestra sugerida (badge “Sugerida”) + tarjeta con detalle.
- Con test psicológico completo (10 respuestas): mezcla **28% perfil mental** (`psychInfluenced: true`).

### Test psicológico (Mindset & Teamwork)

`PsychologicalTestScreen` + `PsychTestCard`:

- **10 escenarios** futbolísticos (salida bajo presión, jerarquía, transiciones, gestión de resultado, etc.).
- Likert 1–5; algunas preguntas **invertidas** (p. ej. evitar compañero tras error grave).
- **5 rasgos:** organizador, verticalidad, disciplina, creatividad, competitividad.
- Scores: **Teamwork**, **Mindset** (on-field), **Overall**.
- Gráfico ligero `PsychScoresChart`: medidores en arco SVG (teamwork violeta, mindset naranja).
- **Bloqueo mensual** al confirmar.
- Respuestas antiguas (8 preguntas) no alimentan la sugerencia de posición hasta repetir el test.

### Edición de perfil y avatar

`ProfileEditScreen`:

- Nombre, apodo, email, edad, bio.
- **Posición favorita** (`PositionPicker`, 7 posiciones).
- Foto desde galería (`expo-image-picker` + `expo-file-system`).

`pickProfileImageFromGallery(userKey, previousUri)`:

- Copia la imagen a `document/profile-avatars/{userKey}.{ext}`.
- URI persistente en MMKV; sobrevive reinicios de app. Si MMKV no tiene `avatarUri` (instalación nueva, datos borrados), `ProfileAvatar` cae a `photoBase64` = `authAvatarBase64` de `AuthContext` (la foto que ya tiene el servidor) — fix 2026-09-09, ver registro de cambios.
- En **ProfileScreen**, tocar avatar abre galería y guarda al instante (`updateProfile`).

Plugin en `app.json`: `expo-image-picker` con permiso de fotos.

### Secciones de `ProfileScreen`

1. **Header** — avatar, nombre, apodo, email, Tag ID, posición (favorita / sugerida / default).
2. **Sobre mí** — edad y bio (`ProfilePersonalCard`).
3. **Sugerencia de posición** — si aplica (`PositionSuggestionCard`).
4. **Estadísticas** — radar + hint.
5. **Tests físicos** — lista de `PhysicalTestCard` (estado, bloqueo, CTA).
6. **Evaluación psicológica** — `PsychTestCard`.
7. **Accesos rápidos** — Grupos, Partidos, Reservas → `showFeedComingSoon()` (stub).

### Componentes del módulo

| Componente | Descripción |
|------------|-------------|
| `ProfileHeader` | Back, barra bicolor, avatar editable, badges |
| `ProfileAvatar` | Iniciales o imagen, badge cámara |
| `StatsRadarChart` | Radar SVG + barras por stat |
| `PhysicalTestCard` | Tarjeta por test con estado mensual |
| `PsychTestCard` | CTA + `PsychScoresChart` si hay resultado |
| `PsychScoresChart` | Arcos SVG teamwork / mindset |
| `PositionSuggestionCard` | Posición sugerida + confianza |
| `PositionPicker` | Grid de posiciones en edición |
| `ProfileQuickLinkCard` | Enlaces stub (grupos, partidos, reservas) |
| `TestMeasurePanel` | Router a panel según `inputType` del test |

### i18n

Namespace `profileScreen:*` en los **7 idiomas**: stats, tests, medición, psico (10 preguntas), edición, posiciones, dev reset, permisos de galería.

---

## Amistad entre jugadores y búsqueda (Fase 10 / 10.1)

**Pantalla:** `app/screens/friends/FriendsScreen.tsx` + hook `useFriends.ts`.

Tres pestañas: **Amigos**, **Solicitudes** (recibidas/enviadas) y **Sugerencias** (amigos en común, compañeros de grupo). Al escribir en el buscador (mín. 3 caracteres, debounce 400 ms — mismo patrón de secuencia monotónica que `MunicipalityPicker` para descartar respuestas fuera de orden) se reemplaza la lista de pestañas por resultados de `GET /api/friendships/search`.

**Regla de privacidad de la búsqueda** (validada server-side, ver [BACKEND.md → User Friendships](./BACKEND.md#user-friendships--users-service)): si el texto tiene forma de correo, la búsqueda es **exacta** — nunca se puede encontrar a alguien tecleando un fragmento de su email. Por `@alias` o nombre sí admite coincidencia parcial.

Acciones (`useFriends.ts`): enviar solicitud, aceptar, rechazar/cancelar/eliminar — todas optimistas sobre el estado local, sin recargar toda la lista. El botón de amistad (agregar / solicitud enviada / aceptar-rechazar / ya amigos + eliminar) vive dentro de `MemberProfileModal` (ver sección siguiente), no en `FriendsScreen`.

## Ficha de miembro — `MemberProfileModal`

**Archivo:** `app/screens/groups/components/MemberProfileModal.tsx` — ficha de solo lectura de un jugador, reutilizada desde Grupos, Amigos, Rankings de torneo y postulantes a comodín.

**Prop `source: MemberProfileSource`** (`"group" | "friends" | "search" | "suggestions" | "rankings" | "guest_application"`) — decide **de dónde** se abrió la ficha, no solo cosmética: controla la regla de producto `canShowStats`.

**Regla `canShowStats`** (explícita, no cambiar sin pedirlo el producto):

```ts
const canShowStats =
  source === "group" || source === "rankings" || friendship?.status === "accepted"
```

Las estadísticas (radar) solo se ven si la ficha se abrió desde un **grupo compartido** o desde **rankings de torneo**, o si hay **amistad aceptada** con esa persona — nunca desde una búsqueda o sugerencia sin ser todavía amigos. Si no se cumple, se muestra un candado en vez del radar. `preview` (nombre/alias/posición/avatar de la fila que abrió la ficha) permite mostrar la cabecera al instante mientras el resto carga.

Botón de amistad según `friendship.status` (`none`/`pending_sent`/`pending_received`/`accepted`): agregar, solicitud enviada + cancelar, aceptar + rechazar, o ya amigos + eliminar (con confirmación).

## Ubicación (Fase L.0)

**Componente:** `app/components/MunicipalityPicker.tsx` — buscador con debounce sobre `GET /api/geo/municipalities` (dataset estático de municipios de Colombia).

**Dónde se usa:** edición de perfil (`ProfileEditScreen`) y creación/edición de grupo (`GroupCreateModal`/`GroupEditModal`). **No** hay selector de ubicación en el partido — la sede de un `Match` se resuelve del lado del backend a partir de la cancha reservada o del grupo origen (`venueId`/lat-lng copiados, o `venueText` libre), sin un picker propio en esa pantalla.

**Decisión explícita de esta etapa:** sin GPS ni mapas nativos en mobile — la ubicación se elige por municipio (búsqueda de texto), y lat/lng son siempre el centroide resuelto server-side. El pin arrastrable sobre un mapa real (Leaflet/OpenStreetMap) existe solo en el portal web ("Mi cancha", ver [FRONTEND-WEB.md](./FRONTEND-WEB.md)), no en mobile.

## Comodín (Fase 11)

Vacante para cubrir un cupo faltante en un partido `internal` `scheduled`, publicada por el líder/vice y visible para otros jugadores cerca de su zona guardada.

| Pantalla / componente | Rol |
|---|---|
| `NearbyGuestRequestsScreen.tsx` + `useNearbyGuestRequests.ts` | Lista de vacantes abiertas cerca de tu municipio (acceso "Cerca de mí" del drawer) |
| `GuestRequestModal.tsx` | El líder/vice publica la vacante (posiciones multi-selección, cantidad de cupos, radio en km) |
| `GuestApplicantsModal.tsx` | El líder/vice revisa postulaciones y acepta/rechaza |
| `GuestRequestCard.tsx` | Tarjeta de una vacante en la lista de "Cerca de mí" |
| `useMatchGuestRequest.ts` | Ciclo de vida de la vacante de UN partido (abrir, cancelar, postulaciones) |

En el roster del partido, un participante que entró como comodín (no por membresía de grupo) lleva el badge **"Comodín"** (`MatchParticipant.isGuest`).

**Comodín múltiple (Fase 11.1):** una búsqueda pide hasta 5 cupos y acepta varias posiciones (o ninguna = cualquiera):

- `GuestRequestModal`: los chips de posición pasaron a multi-selección (toggle por chip; ninguno = "cualquier posición"), y se agregó el selector de cantidad (chips `1..N`, con `N = min(5, cupos libres del partido)` — la prop `freeSpots` viene de `MatchDetailScreen`). Envía `requestedPositions` (array) y `slotsTotal`.
- Banner "Buscando comodín" en `MatchDetailScreen`: además de posiciones (lista separada por comas) y radio, muestra el progreso `X/Y cupos · N postulantes` (`guestOpenBannerProgress`). Aceptar un postulante con cupos restantes deja la búsqueda `open` y a los demás pendientes visibles — solo al llenar el último cupo pasa a `filled` y el backend rechaza el resto.
- `GuestRequestCard` ("Cerca de mí"): chip naranja con las posiciones pedidas (o "Cualquiera") + chip emerald "Faltan N jugador(es)" (`guestSlotsRemaining`, `slotsTotal - slotsFilled`).

**Preferencia de perfil:** `ProfileEditScreen` tiene el toggle "avisarme si falta un jugador cerca" (`Profile.notifyNearbyGuestRequests`, opt-in, guardado al toque — no espera al botón Guardar general). Solo controla si se recibe **push** cuando se publica una vacante cerca; no afecta qué aparece en "Cerca de mí", que siempre se calcula por zona.

## Reservas — selección por tamaño (Fase W.1.1)

**Archivo:** `app/screens/reservations/components/CreateReservationModal.tsx`.

El jugador elige complejo y **tamaño de cancha** (5v5/6v6/7v7/8v8/11v11) — ya no una cancha específica por nombre. Al completar complejo + tamaño + horario válido, un chequeo con debounce (350 ms, mismo patrón de secuencia que el resto de la app) consulta `GET /api/venues/:id/availability` y muestra cuántas canchas de ese tamaño están libres **antes** de dejar confirmar — nunca se llega a un error de solape recién al final. El backend auto-asigna la cancha puntual (ver [BACKEND.md → Reservations](./BACKEND.md#reservations-lado-jugador--venues-service)); `ReservationDetailScreen` muestra qué cancha específica le tocó ("Te asignamos: {cancha}") una vez confirmada.

Las reservas telefónicas que carga el dueño desde el portal web siguen sin cambios: ahí sí elige la cancha directo por nombre (es el dueño quien gestiona su propio inventario).

**Servicios del complejo (2026-08-31):** la tarjeta de cada complejo en el selector muestra chips con sus servicios (`PublicVenueApiDto.amenities`: cafetería, transferencias, baños — claves i18n `reservationsScreen:amenity_*` en los 7 idiomas), para que el jugador los vea antes de elegir dónde reservar. Si el complejo no tiene servicios marcados, no se muestra nada (sin hueco).

## Crear partido — sede antes que formato, selector de fecha compartido

**Archivo:** `app/screens/matches/components/CreateMatchModal.tsx`.

**Componente compartido:** `app/components/DateTimeRangePicker.tsx` exporta `buildDateOptions()` (hoy + 14 días), `isValidTime(hour, minute)` y `combineDateTime(date, hour, minute)` (arma el ISO o `null` si la hora es inválida) como funciones puras, más el componente `DateTimeRangePicker` — la fila de días (`DayCard`, weekday + número) y los campos de hora son ahora una sola implementación usada tanto por Reservas como por Crear partido, en vez de dos copias divergentes.

```ts
interface DateTimeRangePickerProps {
  mode: "range" | "single"           // "range": Reservas (inicio + fin). "single": Crear partido (solo inicio)
  dateOptions: Date[]
  selectedDate: Date | null
  onSelectDate: (date: Date | null) => void
  dateLabel: string
  allowUnset?: boolean               // agrega una tarjeta "Sin definir" antes de la fila de días
  unsetLabel?: string
  startTimeLabel: string
  startHour: string
  startMinute: string
  onStartHourChange: (value: string) => void
  onStartMinuteChange: (value: string) => void
  endTimeLabel?: string              // solo mode="range"
  endHour?: string
  endMinute?: string
  onEndHourChange?: (value: string) => void
  onEndMinuteChange?: (value: string) => void
  invalidRangeError?: string         // solo mode="range"
  isRangeValid?: boolean
}
```

- **`CreateReservationModal`** lo usa en `mode="range"` (sin `allowUnset`) — comportamiento idéntico al de antes de la extracción, ahora sobre el componente compartido.
- **`CreateMatchModal`** lo usa en `mode="single"` `allowUnset` — la fila de días es visualmente la misma que en Reservas, con una tarjeta extra "Sin definir" al principio (selecciona `selectedDate = null`) y sin pedir hora de fin.

**Orden del formulario (antes: tipo → rival → formato → cupo → fecha → sede; ahora):** tipo de partido → grupo rival (si es VS) → **sede** → **formato** → cupo máximo → fecha y hora. La sede pasa antes que el formato porque la cancha real elegida informa qué formato tiene sentido — al revés de como estaba.

**Sede informativa, sin reservar nada:** elegir una cancha de la app en este formulario sigue siendo puramente informativo — no crea ni bloquea ningún `Reservation`, no llama a `getAvailability`, y no está integrado con la auto-asignación de la W.1.1 (eso queda para una fase futura). Al elegir "Cancha de la app" y un complejo, se muestra un resumen con los mismos `PublicVenueApiDto.courtSizes` que usa Reservas (sin inventar otra consulta): tamaño de cancha (`courtSizeLabel`, `app/utils/courtSize.ts`) y cantidad de canchas de cada tamaño.

**Sugerencia de formato:** si se eligió una cancha de la app, el campo Formato se pre-llena con el tamaño más común de ese complejo (`mostCommonCourtSize` + `courtSizeToFormat` en `app/utils/courtSize.ts`) — sigue siendo editable, es una sugerencia y no una restricción (un líder puede querer igual un partido 5v5 en una cancha etiquetada 6v6). La sugerencia solo se reemplaza a sí misma mientras el usuario no haya tocado el campo a mano; en cuanto edita el formato (chip o texto libre), deja de auto-actualizarse aunque cambie de cancha. Si no se eligió cancha de la app ("Sin sede" u "Otra cancha"), el campo se comporta exactamente igual que antes — chips + texto libre, sin sugerencia.

## AppAlert (reemplazo de `Alert.alert` nativo)

**Archivo:** `app/components/AppAlert.tsx` — `Alert.alert(...)` de `react-native` dibuja el diálogo del sistema operativo: no hereda nada de la identidad visual de la app y es imposible repintarlo. Se reemplazó en los 16 puntos del código que lo usaban por un modal propio con la paleta Elite Forge.

- **`AppAlertProvider`** envuelve la app en `app/app.tsx` (dentro de `AuthProvider`/`ThemeProvider`, fuera de `AppNavigator`).
- **`useAppAlert()`** expone `showAlert(title, message?, buttons?)` — misma firma que `Alert.alert`, para que el cambio en cada pantalla fuera mecánico (import + nombre de la llamada).
- Modal centrado, fade + scale al aparecer; botón `default` (emerald), `cancel` (neutral) o `destructive` (borde/texto rojo) según `style`. Tocar afuera cierra solo si hay un botón `cancel` — igual que el `Alert.alert` nativo.
- Dos utilidades que no son componentes React (`pickProfileImage.ts`, `pickGroupPhoto.ts`) reciben `showAlert` como **parámetro** en vez de usar el hook directo, pasado por el componente que las llama.

**Convención del proyecto:** ningún archivo debe importar `Alert` de `react-native` directamente — usar `useAppAlert()`. Desde el 2026-08-31 la convención está **reforzada por ESLint**: `no-restricted-imports` en `eslint.config.js` bloquea el import de `Alert` desde `react-native` con el mensaje "No uses Alert.alert directo — usá useAppAlert() de '@/components/AppAlert'", junto a la regla ya existente para `Text`/`Button`/`TextInput`. `AppAlert.tsx` no importa `Alert` (es un modal propio sobre `Modal`/`Animated`), así que la regla no lo afecta.

## Fotos de perfil reales en el feed

El feed (drawer, composer, navbar, tarjetas de post, comentarios) mostraba únicamente iniciales con color — nunca la foto real de nadie, ni la propia.

- **`FeedAvatar.tsx`** gana `photoBase64?: string | null` (mismo patrón que `GroupAvatar.tsx`): si viene con valor renderiza la imagen; si no, mantiene el círculo de inicial + color de siempre.
- **Avatar propio** — fuente única: `AuthContext` gana `authAvatarBase64: string | null`, **en memoria** (no MMKV, a propósito — repoblar desde el backend con `getMyProfile()` al loguear alcanza, evitar otra capa de caché que se desincronice, mismo problema que el token en la Fase 8.1). Se actualiza al instante al elegir una foto nueva en `ProfileScreen`, sin esperar la confirmación de red ni reiniciar la app. Reemplaza 4 copias sueltas de `getUserColor` (en `FeedDrawer`/`FeedComposeModal`/`FeedComposer`/`FeedNavbar`) por una sola en `app/utils/avatarColor.ts`, usada como fallback cuando no hay foto.
- **Avatar de otros** — `PostDto`/`CommentDto` ya traen `authorAvatarBase64` desde el backend (ver [BACKEND.md](./BACKEND.md#feed--users-service)); `useFeed.ts` lo mapea a `authorAvatarPhoto` en `FeedPost`.

**Subida de la foto (fix 2026-09-05):** la foto elegida en Perfil se **redimensiona a 512×512 JPEG calidad 0,7** con `expo-image-manipulator` (`resizeForAvatar` en `pickProfileImage.ts`) antes de persistirla y de generar el base64. El mismo redimensionado sirve para el archivo local que muestra Perfil y para lo que se sube — lo que ve el usuario es lo que ven los demás. Antes el picker devolvía el recorte a resolución de cámara (1–4 MB, 1,3–5 M caracteres en base64), `syncAvatarToBackend` lo descartaba en silencio por superar `MAX_AVATAR_BASE64_LENGTH` (500 000) y la foto nunca salía del teléfono: Perfil la mostraba (archivo local) pero feed/grupos/partidos (que leen el dato del servidor) veían la inicial. Con 512×512 q0,7 una foto de cámara queda en ~30–110 K caracteres (medido: una imagen de 10,9 MB baja a ~29 K). `syncAvatarToBackend` ya **no descarta en silencio**: si no hay base64, supera el límite o el `PATCH` falla, loguea con `console.warn` y avisa con `AppAlert` (`profileScreen:avatarUploadFailed*`, 7 idiomas). `expo-image-manipulator` es un módulo nativo — requiere recompilar el dev client / AAB con EAS.

## Fotos de perfil reales en miembros de grupo y roster de partidos

Auditoría posterior a la Fase 12: los dos lugares que seguían mostrando solo inicial+color porque el backend no enviaba la foto eran la lista de miembros de un grupo (`GroupMemberRow.tsx`) y el roster de un partido (`ParticipantRow` en `MatchDetailScreen.tsx`).

- `GroupMemberApiDto` y `MatchParticipantApiDto` ganan `avatarBase64: string | null` (ver [BACKEND.md](./BACKEND.md#groups--users-service)).
- Ambas filas reemplazan su círculo inline de inicial+color por **`FeedAvatar`** (que ya soporta `photoBase64` desde la Fase 12), con `getUserColor` de `app/utils/avatarColor.ts` como color de fallback — se eliminaron las dos copias locales de `pickAvatarColor` (mismo algoritmo y paleta, el color visible no cambia). Un usuario sin foto se ve exactamente igual que antes.
- `TournamentRankingsScreen` queda **sin** avatar a propósito: sus filas son texto plano (nunca tuvieron avatar, ni de inicial) y el contrato `RankingEntry` documenta explícitamente que no lleva `avatarBase64` porque la ficha al tocar una fila ya trae la foto por `getPublicMemberProfile`. Agregarlo implicaría rediseñar la fila y reabrir esa decisión — fuera de esta fase.
- `FriendsScreen` y `GuestApplicantsModal` ya mostraban la foto real — confirmado, sin cambios.

## Identidad de marca — íconos, splash y nombre de la app

**Script:** `apps/mobile/scripts/generate-brand-assets.js` (`npm run generate:brand` desde `apps/mobile`; usa `sharp`, devDependency). Genera TODOS los íconos (mobile y web) desde el logo fuente (`assets/images/elite-forge-logo.png`, 1024×1024 RGBA) — reproducible: si cambia el logo, se corre el script y se regenera todo.

**Decisión de diseño:** los íconos chicos (app, favicon, notificaciones) usan **solo el emblema** (escudo + pelota), sin la franja de texto "ELITE FORGE" — a 32 px el texto es ilegible. El logo completo con texto se usa únicamente en el splash. El recorte del emblema se **mide** (perfil de alfa fila por fila; el hueco transparente más grande separa emblema de texto; bounding box por columnas), sin coordenadas mágicas.

Generados (mismos nombres que los placeholders de Ignite, así `app.json` no cambia rutas):

| Archivo | Formato |
|---|---|
| `app-icon-all.png` / `app-icon-ios.png` / `app-icon-android-legacy.png` | 1024×1024 **RGB sin alfa** (iOS rechaza transparencia), emblema al 70% sobre carbón `#424242` |
| `app-icon-android-adaptive-foreground.png` | 1024×1024 RGBA transparente; el emblema escala por su **diagonal** para caber entero en el círculo del 66% con 8% de margen |
| `app-icon-android-adaptive-background.png` | 1024×1024 carbón sólido |
| `app-icon-web-favicon.png` | 64×64 sobre carbón |
| `notification-icon.png` (nuevo) | 96×96, silueta 100% blanca sobre transparente (Android solo usa el canal alfa); `expo-notifications` con `color: #00CEC8` |
| `splash-logo.png` (nuevo) | logo completo con texto, 1024 de ancho, transparente; splash con `backgroundColor: #424242`, `imageWidth: 220`, `contain` |

**Identidad en `app.json`:** `name: "Elite Forge"`, `scheme: "eliteforge"` (no había ningún `mobile://` hardcodeado), `android.package` y `ios.bundleIdentifier`: `com.eliteforge.app` (inmutables una vez publicados en tienda). Pendiente antes de tienda: restringir `usesCleartextTraffic` a desarrollo.

**EAS (2026-09-01):** el proyecto está vinculado a la cuenta de Expo de David — `owner: "david.c18"`, `slug: "elite-forge"`. El proyecto original (`owner: elite-forge`, `projectId e70c95c5-…`) pertenecía a la cuenta de Alexis, que ya no forma parte del proyecto; como nunca se publicó ningún build bajo ese proyecto, se revinculó desde cero con `eas init` (que escribe el `extra.eas.projectId` nuevo en `app.json`). Los builds se lanzan logueado como `david.c18` (`eas login`).

**`versionCode` administrado por EAS (2026-09-05):** Google Play rechazó un `.aab` nuevo ("El código de versión 1 ya se ha usado") porque `eas.json` no tenía `appVersionSource` y `app.json` no tiene `android.versionCode` — no había ninguna fuente estable de la que incrementar. Ahora `cli.appVersionSource: "remote"` (EAS guarda el `versionCode` en sus servidores, atado al proyecto `@david.c18/elite-forge`, no al repo) **más** `production.autoIncrement: true` (lo sube en 1 antes de cada build de producción — sin `autoIncrement`, `remote` solo guarda el número, no lo incrementa). No hay que tocar `app.json` ni acordarse de subir nada a mano. **Una sola vez**, antes del próximo `.aab`: como Play ya consumió el 1, inicializar el contador remoto con `eas build:version:set --platform android` y responder `1` (el siguiente build sale con 2) — o directamente `2` si preferís que no incremente en ese primer build. `eas build:version:get --platform android` muestra el valor vigente.

**Perfiles de build y formato Android (2026-09-04):** el perfil `production` de `eas.json` **no** declara `buildType`, así que usa el default de EAS, `app-bundle`, y genera un **`.aab`** (Android App Bundle). Es obligatorio: Google Play solo acepta `.aab` para cualquier pista de la consola — incluidas "Pruebas internas" y "Pruebas cerradas" — y rechaza `.apk` en apps nuevas. Los perfiles `development`, `development:device` y `preview` sí declaran `"buildType": "apk"` a propósito: generan un **`.apk`** para instalar directo en un teléfono (`distribution: internal`) en pruebas manuales; ese archivo **no** sirve para subir a la tienda. Resumen: `eas build -p android --profile production` → `.aab` para Google Play; `--profile preview` / `development` → `.apk` para instalar a mano.

**Proyecto EAS activo (verificado 2026-09-09):** `apps/mobile/app.json` → `extra.eas.projectId = 8494aae2-3590-420c-bcf8-c7c0de4d6b6f`, que `eas project:info` resuelve a **`@david.c18/elite-forge`**. Todo comando `eas` se corre **desde `apps/mobile`**. En la raíz del repo había un `app.json` y un `eas.json` sin trackear (residuo de un `eas init` en la carpeta equivocada) con otro `projectId` (`5a56a482-…`, proyecto `@david.c18/ef-monorepo`, que no es el de la tienda): se borraron y `/app.json` + `/eas.json` quedaron en el `.gitignore` de la raíz para que no vuelvan a entrar. Ningún script del monorepo ni de los workspaces invoca `eas` desde la raíz; si se corre ahí por error, ahora falla en vez de resolver un proyecto ajeno.

## Teclado en modales y pantallas (fixes de QA en dispositivo real, 2026-09-05)

**Regla de la app:** todo `KeyboardAvoidingView` usa `behavior={Platform.OS === "ios" ? "padding" : "height"}` — el `undefined` en Android deja los campos tapados por el teclado (era el bug de `ProfileEditScreen`, único lugar con el patrón roto; `Screen.tsx` y `LoginScreen` ya lo hacían bien).

**Modales:** un `<Modal>` de React Native es una jerarquía de vistas nativa separada — **no hereda** el `KeyboardAvoidingView` de la pantalla que lo abre. Todo modal con entrada de texto lleva el suyo propio como raíz (la View raíz del modal ES el `KeyboardAvoidingView`, mismo behavior). Aplicado en 8 modales con `TextField`: `MunicipalityPicker`, `GroupSearchModal`, `FeedCommentsSheet`, `GroupAddMemberModal`, `GroupCreateModal`, `GroupEditModal`, `CreateMatchModal` y `CreateReservationModal`. Si se crea un modal nuevo con inputs, seguir este patrón.

**Excepción — `FeedComposeModal` (regresión corregida 2026-09-09):** este modal ya acomodaba el sheet a mano desde antes de la QA (listener de `keyboardDidShow`/`Hide` + sheet `position: "absolute"` anclado a `bottom: keyboardHeight + 22`, porque su altura se calcula en función del teclado para dejar ver el feed detrás). En la ronda del 2026-09-05 se le sumó el `KeyboardAvoidingView` encima sin quitar ese manejo: el KAV (behavior `"height"`) encogía el contenedor una altura de teclado y el sheet sumaba otra, así que quedaba a 2× teclado del fondo y "rebotaba" con cada `keyboardDidShow` repetido de Android (los testers del build 3 lo reportaron como modal "despegado", "que sale de su carril" y app "tildada" al cerrar el teclado). Se quitó el KAV y quedó **un solo** mecanismo, el manual — es el que gobierna también la altura del sheet, así que es el único que puede ser la fuente de verdad. `isSmallScreen` se mide sobre `Dimensions.get("screen")` en vez de la ventana (que en Android se encoge con el teclado y hacía recalcular `sheetHeight` dos veces por evento). El componente lleva un comentario de cabecera que prohíbe volver a envolverlo en `KeyboardAvoidingView`. Verificado con grep al cerrar el fix: es el único archivo de `app/` con `Keyboard.addListener`; los otros 8 modales solo tienen el KAV.

**Lección (regla de trabajo):** aplicar un patrón uniforme a varios componentes "en lote" sin verificar si alguno ya tenía manejo propio genera regresiones. Antes de envolver, reemplazar o estandarizar N archivos con la misma receta, revisar cada uno buscando el mecanismo equivalente que ya exista (para teclado: `Keyboard.addListener`, `useWindowDimensions`, offsets manuales, `KeyboardAwareScrollView`); si lo hay, el patrón nuevo **reemplaza** al viejo o se documenta la excepción — nunca se suman los dos. El grep que hubiera evitado esto tarda diez segundos: `grep -rl "Keyboard.addListener" app/`.

**Idioma de respaldo:** `app/i18n/index.ts` → `fallbackLocale = "es"` (antes `"en-US"`): si el idioma del sistema no coincide con ninguno de los 7 soportados, la app cae a español. La detección del idioma del sistema (`Localization.getLocales()`) no cambió.

## Barras del sistema y safe area en Android (edge-to-edge, fix 2026-09-05)

`app.json` activa `edgeToEdgeEnabled` con el plugin `react-native-edge-to-edge` y `enforceNavigationBarContrast: false` (barra de navegación totalmente transparente, también en modo 3 botones). Con eso, el color de los íconos de las barras lo gobierna la app — y con `parentTheme: "Light"` salían **oscuros sobre el fondo carbón**: en teléfonos con navegación por 3 botones, Atrás/Inicio/Recientes quedaban invisibles ("el UI oculta las funciones del teléfono").

- **`parentTheme` → `"Default"`** (tema DayNight de edge-to-edge; `"Dark"` no existe en la librería). El contraste real lo fija el punto siguiente, no el tema.
- **Un solo `<SystemBars style="light" />`** en `app/app.tsx` (raíz, dentro de `SafeAreaProvider`) para toda la app — reemplaza los 19 `<StatusBar barStyle="light-content">` de `react-native` que había en cada pantalla (deprecado con edge-to-edge según la propia librería, y que además no gobernaba la barra de navegación). La app es oscura de punta a punta, así que no hace falta variarlo por pantalla; si alguna vez una pantalla clara lo necesita, `SystemBars` acepta `style` por pantalla.
- **Safe area**: `components/Screen.tsx` (wrapper de Ignite con `safeAreaEdges`) **no lo usa ninguna pantalla real** — solo `WelcomeScreen`, que no está en ningún navegador. La convención vigente es manual: cada pantalla aplica `insets.top`/`insets.bottom` de `useResponsiveLayout()`. `MatchDetailScreen` y `ReservationDetailScreen` eran las únicas dos con `paddingBottom` fijo al final del scroll (los botones de acción quedaban bajo la barra de gestos/botones); ahora usan `insets.bottom + 16`. Migrar todo al wrapper compartido sería una fase aparte, decidida explícitamente.

## `TextField`: altura fija y padding (fix de QA 2026-09-07)

`components/TextField.tsx` (wrapper de Ignite, único lugar con `TextInput` crudo — la regla `no-restricted-imports` lo bloquea en el resto) fija en `$inputStyle` **`height: 24` + `paddingVertical: 0`** como workaround del issue de RN 21720. La prop `style` entra **última** en el array de estilos del input, así que sobreescribe el padding pero no la altura: pasar `paddingVertical: 12` deja 24 − 24 = **0 px de área de texto**, y en Android el texto queda invisible al escribir (el campo funciona — el estado cambia y la búsqueda dispara — solo que no se ve nada). Eran exactamente dos campos: el buscador de **Amigos** (`FriendsScreen`) y el de **Municipio** (`MunicipalityPicker`); los otros 11 `TextField` del proyecto no pasan padding vertical por `style` (auditado al cerrar el fix).

**Regla:** nunca pasar `paddingVertical`/`paddingTop`/`paddingBottom` por la prop `style` de un `TextField`. Si un campo necesita más espacio vertical, aplicarlo en `inputWrapperStyle` (el wrapper `View`), no en el input. El `height: 24` de `TextField.tsx` **no** se tocó (refactor del componente = fase aparte); queda un comentario junto a esa línea con la advertencia. Nota: el fix no cambia la altura visual de los dos campos — el alto ya era 24 fijo con el bug — así que no hizo falta compensar en el wrapper.

**Lo que NO era la causa** (verificado durante la investigación): los 13 `TextField` y los 7 `Input` (Tamagui, color `$efWhite` fijo en `ui/Input.tsx`) tienen `color` y `placeholderTextColor` explícitos, y el cambio de `parentTheme` `"Light"` → `"Default"` no afecta el color del texto (el default del tema solo aplica cuando `color` no está seteado).

## Indicadores de pendientes (Fase B, 2026-09-10)

Punto naranja en el botón hamburguesa del feed cuando hay algo que resolver, y sobre el ítem del drawer correspondiente al abrirlo (Amigos, Grupos, Partidos).

**Estado — `context/pendingStore.ts` + `context/PendingContext.tsx`.** El store es puro (sin React, testeado en `pendingStore.test.ts`, 13 casos) y `PendingProvider` lo expone con `useSyncExternalStore`. Vive en `app.tsx` dentro de `AuthProvider`. `usePending()` devuelve `{ counts, total, refresh, bump }`; fuera del provider devuelve ceros y no-ops (showroom/tests no rompen).

- `refresh({ force? })`: deduplicado (las llamadas concurrentes comparten la promesa en vuelo) y con **throttle de 60 s** salvo `force`. Nunca rechaza. Si `GET /api/me/pending` falla, se conservan las cifras anteriores y **no hay estado de error**: el punto no aparece y la UI no se entera. Claves desconocidas del backend se ignoran; valores inválidos quedan en 0.
- `bump(kind, delta)`: ajuste optimista, nunca baja de 0. Siempre seguido de `refresh({ force: true })` por quien lo llama, para corregir con el dato real.
- Sin sesión (`authToken` vacío) el store se resetea a cero y **no se llama al endpoint**; una respuesta de la sesión anterior que llegue tarde se descarta (contador de generación).

**Cuándo se refresca — sin polling, nadie llama por tiempo:**

| Disparador | Dónde | Llamada |
|---|---|---|
| Arranque con sesión / login | efecto de `PendingProvider` sobre `authToken` | `refresh({ force })` |
| Vuelta a primer plano | `AppState` → `active` | `refresh()` (respeta el throttle) |
| Push recibido con la app abierta | `addPushReceivedListener` | si `data.pending` es una clave válida → `bump(+1)`; siempre `refresh({ force })` |
| Tap en un push | `addPushResponseListener` (segundo listener, además del despachador de la Fase A) | `refresh({ force })` |
| El usuario resuelve un pendiente | `useFriends.accept/remove` (solo recibidas), `GroupFriendsScreen` aceptar/rechazar, `MatchDetailScreen` aceptar/rechazar desafío y aceptar/rechazar postulante | `bump(-1)` + `refresh({ force })` |

**UI — de contexto, no por props.** `FeedMenuButton` lee `usePending().total` y pinta `PendingDot` en su esquina; `FeedDrawer` lee `counts` y pasa `pendingCount` a cada `DrawerMenuItem`. `FeedScreen` y `FeedNavbar` no cambian ni saben del contador.

**Mapeo clave → ítem, objeto estático** (`FeedDrawer.tsx`):

```ts
export const PENDING_DRAWER_ITEM: Record<PendingKind, FeedDrawerItemId> = {
  friendRequests: "friends",
  groupFriendRequests: "groups",
  matchChallenges: "matches",
  guestApplications: "matches",
}
```

Varias claves pueden apuntar al mismo ítem (Partidos suma desafíos y postulantes).

**Color: naranja `#FF8C00`, no cian.** El cian/esmeralda ya es el color de todos los íconos y chevrons del navbar y del drawer, así que un punto cian se lee como decoración más; el naranja es el color de "atención" de la marca (mitad del degradado, botón de cerrar sesión), contrasta ~7,5:1 sobre carbón y se distingue de los íconos cian de al lado. `PendingDot` lleva borde carbón para no fundirse con el ícono cuando se superpone.

**Cómo agregar un contador nuevo sin tocar componentes:** (1) la clave en `PendingKind` y `PENDING_KINDS` (`services/api/types.ts`, calcado del contrato); (2) su ítem en `PENDING_DRAWER_ITEM`; (3) en la pantalla que resuelve ese pendiente, `bump(clave, -1)` + `refresh({ force: true })` tras la acción; (4) en el backend, el `count` y el `pending: '<clave>'` en el push (ver [BACKEND.md](./BACKEND.md#pendientes-get-apimepending-fase-b-indicadores-en-el-drawer--2026-09-10)). `FeedMenuButton`, `FeedDrawer`, `DrawerMenuItem` y `PendingProvider` no cambian.

**La pestaña "Solicitudes" de Amigos se dejó como está** (`FriendsScreen.tsx`, badge = `incoming.length` de `useFriends`). Se evaluó pasarla al contexto y no conviene: ese badge etiqueta la lista que la pantalla acaba de cargar, así que es la cifra exacta de lo que el usuario ve; el contexto es optimista y con throttle, y podría discrepar unos segundos de la lista de al lado. Además `useFriends` ya empuja `bump`/`refresh` al aceptar o rechazar, así que las dos cifras convergen solas. Cambiarlo agregaría una dependencia de red a un número que hoy sale de datos locales, sin beneficio. Lo que sí queda anotado como deuda de esa pantalla (no de esta fase): carga tres listas completas en paralelo para pintar la pestaña.

**QA en dispositivo (pendiente, build 6):** (a) recibir una solicitud de amistad con la app abierta → punto en la hamburguesa y en "Amigos" sin tocar nada; (b) aceptarla → el punto desaparece; (c) recibirla con la app cerrada → al abrir, punto tras el primer `refresh`; (d) logout → sin punto; login con otra cuenta → punto según esa cuenta; (e) sin red → sin punto, sin error.

## Deep linking desde una notificación (Fase A, 2026-09-10)

**Antes:** tres listeners por tipo en `pushNotifications.ts` (`matchId` → partido, `match_guest_request` → Cerca de mí, `reservation_status` → reserva). La solicitud de amistad no coincidía con ninguno y el tap abría el Feed; con la app **cerrada** ningún tipo navegaba (el listener no reproduce la respuesta que lanzó el proceso, y `navigate()` descartaba en silencio si el contenedor no estaba listo); sin sesión, la ruta no existía y se perdía el destino.

**Ahora — un solo despachador, `utils/pushNavigation.ts`:**

1. **Contrato.** El backend manda `data: PushData` (`services/api/types.ts`, calcado de `libs/contracts/src/push`): `{ v: 1, type, screen?, params?, pending? }`. El destino lo declara el backend; la app no lo deduce del `type`.
2. **Lista blanca.** `PUSH_SCREENS` mapea cada `PushScreen` permitida (`Feed`, `Friends`, `MatchDetail`, `NearbyGuestRequests`, `ReservationDetail`, `GroupDetail`) a un conversor que transforma los params del push (siempre strings) en los params tipados de la ruta y devuelve `null` si falta algo imprescindible. `resolvePushTarget(data)` valida `v`, `screen ∈ PUSH_SCREENS` y los params; **nunca se navega a un `screen` que no esté en la lista**, venga de donde venga (`"Login"`, `"ProfileEdit"`, `"__proto__"` → null, cubierto por tests).
3. **Cola.** `dispatchPushNavigation` navega solo si `navigationRef.isReady()` **y la ruta existe en el estado raíz** (la rama autenticada del `AppStack` está montada). Si no, guarda el destino (solo el último, en memoria) y lo consumen `flushPendingPushNavigation()` desde `AppNavigator` (`onReady` del `NavigationContainer`) y desde `AppStack` (efecto sobre `isAuthenticated`: login después del tap). `logout` la descarta (`clearPendingPushNavigation`) para no arrastrar un destino a otra sesión.
4. **App cerrada.** `consumeLaunchNotificationData()` (`pushNotifications.ts`) lee `Notifications.getLastNotificationResponse()` una vez al montar `App` y lo limpia con `clearLastNotificationResponseAsync()` para no repetirlo en el próximo arranque; el `data` pasa por el mismo `handlePushResponse` → cola → `onReady`.
5. **Abierta / segundo plano.** `addPushResponseListener(handlePushResponse)`, único listener de `addNotificationResponseReceivedListener`.
6. **Compatibilidad.** Payload sin `v` (backend anterior a la Fase A) → `LEGACY_PUSH_MAP` traduce `type` + ids al nivel raíz (y `matchId` solo = recordatorio de 30 min) al contrato. En el otro sentido, el backend espeja `matchId`/`reservationId` al nivel raíz para builds ≤ 5 (ver [BACKEND.md](./BACKEND.md#notificaciones-push-contrato-pushdata-fase-a-deep-linking--2026-09-10)). Ambos son temporales.
7. **Destinos inexistentes.** El despachador **siempre navega** si el `data` es válido; decide la pantalla: `MatchDetail` y `ReservationDetail` ya muestran "no encontrado" + volver; `Friends` con la pestaña Solicitudes vacía si la solicitud ya se resolvió; `NearbyGuestRequests` simplemente no lista la vacante cerrada. No se consulta la API antes de navegar.

**Params nuevos de ruta** (`navigationTypes.ts`): `Friends: { initialTab?: "requests" }` — `FriendsScreen` arranca en esa pestaña y reacciona si el param cambia con la pantalla ya montada; `MatchDetail: { matchId; openApplicants?: boolean }` — `MatchDetailScreen` abre `GuestApplicantsModal` apenas la vacante carga (solo si el usuario puede gestionarla y la vacante sigue abierta) y consume el param con `setParams` para que no se reabra al volver.

**Cómo agregar un tipo nuevo SIN tocar la app:** en el backend, `sendToUser(..., { v: 1, type: '<nuevo>', screen: '<una de PushScreen>', params: {...} })`. Si el `screen` ya está en `PUSH_SCREENS`, la app lo navega tal cual. La app solo cambia cuando el destino es una **pantalla nueva** (agregar la entrada a `PUSH_SCREENS` con su conversor de params, y el literal a `PushScreen` en `types.ts` y en el contrato del backend) o cuando una pantalla existente necesita un param que hoy no acepta (agregarlo a `navigationTypes.ts` y al conversor).

**Cómo probar sin mandar un push real:** Reactotron → comando **Simulate push tap** (`pushTap`) con el `data` en JSON, por ejemplo `{"v":1,"type":"friendship_request","screen":"Friends","params":{"initialTab":"requests"}}`. Pasa por el mismo despachador que producción (lista blanca + cola), así que sirve para probar destinos, params inválidos y el caso sin sesión (ejecutarlo en Login: queda en cola y navega al loguearse).

**Matriz de QA en dispositivo (pendiente de correr en el build 6, no se pudo en la sesión de implementación):**

| Estado de la app | Con sesión | Sin sesión (logout previo) |
|---|---|---|
| Abierta | tap → navega en el acto | tap → cola → login → navega |
| Segundo plano | tap → navega al volver | tap → cola → login → navega |
| Cerrada (proceso muerto) | tap → arranca → `onReady` → navega | tap → arranca en Login → cola → login → navega |

Para los cuatro destinos: amistad (`Friends`/Solicitudes), nuevo postulante (`MatchDetail` + modal), comodín cerca (`NearbyGuestRequests`), reserva (`ReservationDetail`). Extra: tocar una notificación cuya solicitud ya fue aceptada (pestaña vacía, sin crash) y una de un partido borrado ("no encontrado"). Lo cubierto por tests unitarios (`utils/pushNavigation.test.ts`, 17 casos): lista blanca, contrato, payload viejo, cola en los tres estados, logout.

## Notificaciones push en Android: Firebase/FCM y registro del token (build 5, 2026-09-09)

**Por qué nunca llegó ningún push (testers build 3):** en Android, `Notifications.getExpoPushTokenAsync()` necesita Firebase Cloud Messaging debajo. La app no tenía `google-services.json` ni `android.googleServicesFile`, así que la llamada lanzaba `Default FirebaseApp is not initialized`, `registerPushToken` la atrapaba y salía por el `console.warn("[push] registerPushToken lanzó excepción")`, y el `POST /api/push-tokens` nunca ocurría. `push_tokens` quedaba vacía y el backend logueaba "Push omitido … 0 válidos" para todos — incluidas las solicitudes de amistad que en su momento parecieron un bug del backend. Además, aunque hubiera token, el servicio de push de Expo necesita la **credencial FCM V1** del proyecto Firebase cargada en EAS para entregar en Android.

### Paso 1 — Firebase (lo hace David en la consola; no se puede automatizar)

1. Entrar a <https://console.firebase.google.com> con la cuenta de Google del proyecto → **Agregar proyecto** → nombre `Elite Forge` (el nombre es libre) → Google Analytics: **desactivar** (no se usa) → Crear.
2. En la portada del proyecto → **Agregar app** → ícono **Android**.
   - **Nombre del paquete de Android:** `com.eliteforge.app` — **exactamente** ese, es el `android.package` de `apps/mobile/app.json`. Si no coincide, Firebase entrega igual el archivo, el build compila igual, y FCM rechaza el token en silencio: es el error más fácil de cometer y el más difícil de ver.
   - Apodo: `Elite Forge Android` (opcional). **Certificado SHA-1: dejar vacío** — solo hace falta para Google Sign-In / Dynamic Links, no para push.
   - Registrar app.
3. **Descargar `google-services.json`** y guardarlo en **`apps/mobile/google-services.json`** (raíz de la app móvil, al lado de `app.json`). Está en `.gitignore`: **no se commitea**. Los pasos siguientes de la consola ("Agregar el SDK de Firebase" con Gradle) **se saltean** — Expo los hace en el prebuild.
4. Verificar el archivo: tiene que contener `"package_name": "com.eliteforge.app"` dentro de `client[].client_info.android_client_info`. Si dice otra cosa, se registró mal la app: borrarla en Firebase y repetir el paso 2.
5. **Credencial FCM V1** (para que Expo pueda enviar): en Firebase → ⚙️ **Configuración del proyecto** → pestaña **Cuentas de servicio** → **Generar nueva clave privada** → se descarga un JSON (`elite-forge-xxxxx-firebase-adminsdk-….json`). Guardarlo **fuera del repo** (p. ej. `~/Documentos/elite-forge-fcm-v1.json`). Es una credencial de administrador: no compartirla ni commitearla. No usar la "clave del servidor" legada (Cloud Messaging API heredada): está discontinuada.

### Paso 2 — Subir el `google-services.json` a EAS (lo consume el build en la nube)

`apps/mobile/app.config.ts` fija `android.googleServicesFile = process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json"`: en EAS el archivo llega como **variable de entorno de tipo file** (EAS la escribe en disco y pone la ruta en la variable); en local se usa el archivo de `apps/mobile/`. Como el archivo está ignorado por git, EAS **no lo sube con el proyecto** — de ahí la variable. Desde `apps/mobile`, una vez por entorno (eas-cli 23.x):

```bash
npx eas-cli env:create --scope project --name GOOGLE_SERVICES_JSON --type file --visibility secret --environment production --value ./google-services.json
```

```bash
npx eas-cli env:create --scope project --name GOOGLE_SERVICES_JSON --type file --visibility secret --environment preview --value ./google-services.json
```

```bash
npx eas-cli env:create --scope project --name GOOGLE_SERVICES_JSON --type file --visibility secret --environment development --value ./google-services.json
```

Comprobar con `npx eas-cli env:list --environment production` (la variable figura como `file`, valor oculto). Los perfiles de `eas.json` declaran ahora `"environment"` explícito (`production` / `preview` / `development`) para que no haya ambigüedad sobre qué variables recibe cada build. Alternativa si algún día se prefiere commitear el archivo (Firebase lo considera seguro de embeber, no da acceso a nada por sí solo): quitar la línea de `.gitignore` y no hace falta la variable — el fallback `./google-services.json` lo toma.

### Paso 3 — Cargar la credencial FCM V1 en EAS (para el envío)

Desde `apps/mobile`, interactivo (no hay forma no-interactiva para este paso):

```bash
npx eas-cli credentials --platform android
```

Elegir el perfil **`production`** → **Push Notifications: Manage your FCM V1 service account key** → **Set up a Google Service Account Key for Push Notifications (FCM V1)** → **Upload a new service account key** → pegar la ruta del JSON del paso 1.5. La credencial queda asociada a la app Android del proyecto EAS `@david.c18/elite-forge` (8494aae2-…), no al perfil: se carga **una sola vez** y sirve para todos los builds. Verificar: repetir `eas credentials`, mismo menú, tiene que mostrar la cuenta de servicio cargada. El backend no cambia: `expo-server-sdk` manda a `exp.host` y Expo reenvía a FCM con esa credencial.

### Paso 4 — Rebuild nativo

- **Sí, hace falta rebuild**: `google-services.json` lo consume el plugin de Gradle de Google Services en tiempo de compilación; ningún OTA/`expo start` lo aplica.
- **Prebuild: no hace falta correrlo a mano.** `apps/mobile/android` e `ios` están en `.gitignore` (flujo managed): EAS corre `expo prebuild` en la nube en cada build a partir de `app.json` + `app.config.ts`. Si alguna vez se compila **en local**, sí: `npx expo prebuild --clean` primero, porque la carpeta `android/` local que hay en la máquina de David es de un prebuild viejo y no tiene el archivo.
- **versionCode:** `appVersionSource: remote` + `autoIncrement: true` en el perfil `production` — EAS lo incrementa solo en cada build de producción; no hay que tocar nada. Los perfiles `preview`/`development` no incrementan (APK de instalación manual).
- **Firma:** sin cambios. La keystore la administra EAS y FCM no exige SHA-1 para push. El `.aab` nuevo se sube a la misma pista de pruebas cerradas de Play Console.
- Build para los testers: `npx eas-cli build -p android --profile production` (AAB para Play) o `--profile preview` (APK directo).

### Registro del token: cuándo se intenta (antes solo en el login)

`utils/pushNotifications.ts` → `registerPushToken({ prompt })` + `watchPushRegistration()`, enganchados en `AuthContext` con un efecto sobre `authToken`:

| Momento | Quién | `prompt` | Pide permiso |
|---|---|---|---|
| Login | `LoginScreen` | `"always"` | Sí, es el momento natural |
| Arranque con sesión guardada | efecto de `AuthContext` | `"ifUndetermined"` | Solo si nunca se preguntó (si ya lo negó, no se lo molesta en cada apertura) |
| App vuelve a primer plano | `watchPushRegistration` (AppState `active`) | `"never"` | No; aprovecha si lo activó en Ajustes del sistema |
| FCM rota el token del dispositivo | `watchPushRegistration` (`addPushTokenListener`) | `"never"`, `force` | No; vuelve a pedir el Expo token y lo registra |
| Logout | `unregisterPushToken` | — | Borra el token en el backend y limpia el caché local |

Es idempotente dentro de la sesión de JS (`lastRegisteredToken`: mismo token → sin POST) y las llamadas concurrentes comparten la misma promesa (`inFlight`): en el login, `LoginScreen` y el efecto de `AuthContext` disparan casi a la vez y solo hay un diálogo y un POST. El backend hace upsert por `(userId, token)`, así que un registro repetido no duplica filas.

### Permisos: ¿queda muerto si lo niega?

- **Android 13+**: el diálogo se puede volver a mostrar mientras `canAskAgain` sea `true` (una negativa). Tras la segunda negativa el sistema lo bloquea (`canAskAgain: false`) y `requestPermissionsAsync` devuelve `denied` sin mostrar nada: la única vía es **Ajustes del sistema → Apps → Elite Forge → Notificaciones**. Android < 13 no pide permiso (siempre `granted`).
- **iOS**: el sistema pregunta **una sola vez**; después, solo Ajustes.
- Con este cambio, si el usuario lo activa en Ajustes, la app lo detecta sola al volver a primer plano y registra el token (antes quedaba muerto hasta el próximo login). Lo que **no** está todavía: un atajo en la app a Ajustes (`Linking.openSettings()`) cuando el toggle "avisarme si falta un jugador cerca" de `ProfileEditScreen` se activa con el permiso negado — implica texto en 7 idiomas; queda anotado como mejora.

### Cómo diagnosticar en producción (el logging del build 4 + este)

- **Teléfono** (`adb logcat | grep "\[push\]"`): `token registrado …XXXXXXXX (prompt=…)` en el camino feliz; si no, uno de: `permiso de notificaciones "denied" (canAskAgain=…)`, `Expo no devolvió token`, `el backend rechazó el token …: <kind>` o `registerPushToken lanzó excepción` (en Android, `Default FirebaseApp is not initialized` = falta `google-services.json` en el build; `MismatchSenderId`/`SenderId mismatch` = el paquete registrado en Firebase no es `com.eliteforge.app`).
- **Servidor** (`docker compose logs users-service | grep -i push`): `Push token registrado: usuario …, android, …XXXXXXXX` al registrar (nuevo), `Push omitido: … 0 válidos` cuando el destinatario no tiene token, y `Push rechazado por Expo … InvalidCredentials|MismatchSenderId|DeviceNotRegistered|…` cuando Expo no puede entregar (`InvalidCredentials` = falta o está mal la credencial FCM V1 del paso 3). Los últimos 8 caracteres del token permiten cruzar teléfono ↔ `push_tokens` ↔ envío.
- Prueba end-to-end: dos cuentas, enviar solicitud de amistad desde una; en el log del servidor tiene que aparecer el envío sin "omitido" ni "rechazado" y la notificación en el otro teléfono con la app **cerrada**.

**Pendiente de decisión de producto:** el canal Android `default` se crea con `AndroidImportance.DEFAULT` — la notificación entra en la bandeja sin banner flotante ni sonido "heads-up". Para que una solicitud de amistad "salte", el canal tendría que ser `HIGH`; Android cachea la configuración del canal por instalación, así que el cambio solo aplica a instalaciones nuevas (o a un canal con otro id). No se cambió en esta fase.

## Notificaciones push: registro del token con rastro (fix 2026-09-07)

`utils/pushNotifications.ts` → `registerPushToken()` (se llama una vez al hacer login) es best-effort: si el usuario niega el permiso, Expo no devuelve token (falta `projectId` de EAS) o el backend rechaza el `POST /api/push-tokens`, **no reintenta ni bloquea** — pero ahora deja un `console.warn("[push] ...")` **fuera de `__DEV__`** con el motivo (antes salía en silencio y solo logueaba la excepción en dev). El comportamiento funcional no cambió; el punto es que "no me llegó la solicitud de amistad" sea diagnosticable desde el log del dispositivo (`adb logcat`) en vez de parecer un bug del backend. Contraparte en el backend: [BACKEND.md](./BACKEND.md#registro-de-cambios) (`NotificationsService.sendToUser` loguea warning cuando el destinatario no tiene tokens).

## Registro de cambios (sesión de implementación)

### 2026-09-10 — Fase B: punto de pendientes en la hamburguesa y el drawer

- `context/pendingStore.ts` (store puro: dedupe, throttle 60 s, `force`, `bump` optimista, sin estado de error, reset por generación) + `context/PendingContext.tsx` (`PendingProvider` en `app.tsx` dentro de `AuthProvider`; `usePending()` con valor por defecto fuera del provider). Tests: `pendingStore.test.ts` (13 casos).
- `api.getPendingCounts()` → `GET /api/me/pending`; tipos `PendingCountsApiDto`/`PENDING_KINDS` en `types.ts`.
- `pushNotifications.ts`: `addPushReceivedListener` (push en foreground).
- `PendingDot` (naranja, borde carbón); `FeedMenuButton` lo pinta desde el contexto; `FeedDrawer` gana `PENDING_DRAWER_ITEM` (objeto estático) y `DrawerMenuItem.pendingCount`. `FeedScreen`/`FeedNavbar` sin cambios.
- `useFriends`, `GroupFriendsScreen`, `MatchDetailScreen`: `bump(-1)` + `refresh({ force })` al resolver un pendiente.
- Ver [Indicadores de pendientes](#indicadores-de-pendientes-fase-b-2026-09-10). Contraparte: [BACKEND.md](./BACKEND.md#pendientes-get-apimepending-fase-b-indicadores-en-el-drawer--2026-09-10).

### 2026-09-10 — Fase A: deep linking desde notificaciones con un solo despachador

- Nuevo `utils/pushNavigation.ts`: `resolvePushTarget` (contrato `PushData` + lista blanca `PUSH_SCREENS` + `LEGACY_PUSH_MAP` para payloads viejos), `dispatchPushNavigation` con cola en memoria, `flushPendingPushNavigation` (consumida en `AppNavigator.onReady` y en `AppStack` al montar la rama autenticada), `clearPendingPushNavigation` (logout). Tests: `pushNavigation.test.ts` (17 casos).
- `pushNotifications.ts`: los tres listeners por tipo se reemplazan por `addPushResponseListener` + `consumeLaunchNotificationData` (`getLastNotificationResponse` + `clearLastNotificationResponseAsync`, app cerrada). `app.tsx` los usa.
- `navigationTypes.ts`: `Friends.initialTab`, `MatchDetail.openApplicants`; `FriendsScreen` y `MatchDetailScreen` los consumen.
- `services/api/types.ts`: `PushData` y tipos asociados, calcados del contrato del backend.
- Reactotron: comando `pushTap` para simular el tap con un `data` JSON.
- Ver [Deep linking desde una notificación](#deep-linking-desde-una-notificación-fase-a-2026-09-10). Contraparte: [BACKEND.md](./BACKEND.md#notificaciones-push-contrato-pushdata-fase-a-deep-linking--2026-09-10).

### 2026-09-09 — Build 5: push en Android (Firebase/FCM) + registro del token fuera del login

- `app.config.ts`: `android.googleServicesFile = process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json"`; el archivo queda en `.gitignore` de `apps/mobile` y llega al build como variable EAS de tipo file. `eas.json`: cada perfil declara `"environment"` explícito. **Requiere que David genere `google-services.json` y la credencial FCM V1 en Firebase, cargue ambas en EAS y recompile** — pasos exactos en [Notificaciones push en Android](#notificaciones-push-en-android-firebasefcm-y-registro-del-token-build-5-2026-09-09).
- `pushNotifications.ts`: `registerPushToken({ prompt, force })` con política de diálogo (`always` en login, `ifUndetermined` al arrancar con sesión, `never` al volver a primer plano), caché `lastRegisteredToken` + dedupe de llamadas concurrentes, `console.info` al registrar; nuevo `watchPushRegistration()` (AppState `active` + `addPushTokenListener`). `AuthContext`: efecto sobre `authToken` que registra al arrancar con sesión y mantiene el watch; `LoginScreen` no cambia.
- Sin cambios de `versionCode` manuales (remoto, autoincremento en `production`) ni de firma. Prebuild solo si se compila en local.

### 2026-09-09 — Build 4: fixes rápidos de la ronda 1 de testers (build 3, 17 personas)

- **Grupo A (modal de crear publicación: "se tilda al cerrar el teclado", "sale de su carril", "despegado hacia arriba")** — `FeedComposeModal`: se quita el `KeyboardAvoidingView` que la QA del 2026-09-05 le había puesto encima de su manejo manual del teclado (regresión nuestra). Queda un solo mecanismo (listener + sheet absoluto), `isSmallScreen` medido sobre la pantalla física, y un comentario de cabecera que prohíbe volver a envolverlo. Ver [Teclado en modales](#teclado-en-modales-y-pantallas-fixes-de-qa-en-dispositivo-real-2026-09-05) → Excepción.
- **Grupo B1/B2 (feed: "loop infinito al entrar", "se queda cargando y no muestra los posts")** — no era un `loading` colgado (apisauce tiene timeout de 10 s y `refresh` siempre lo baja): era el spinner del footer en bucle. `onEndReached` de VirtualizedList dispara también sobre una lista vacía (`cellsAroundViewport.last === -1 === itemCount - 1`), `loadMore` pedía la página 2, y en error no bajaba `hasMore`; como cada aparición/desaparición del spinner cambia el `contentLength`, la lista volvía a disparar `onEndReached` sin fin (y podía pegarle al throttler del gateway, 120 req/min). `useFeed.loadMore` ahora no corre sin posts ni durante la carga inicial, y en error corta la paginación (`hasMore = false`; pull-to-refresh la reactiva). `refresh` gana `{ silent }` y `FeedScreen` la llama con `useFocusEffect` al **volver** al Feed (antes no había recarga al recuperar foco: la pantalla queda montada bajo el stack y los posts nuevos de otros no aparecían sin tirar hacia abajo). El primer foco se saltea porque coincide con la carga del montaje.
- **Grupo B1/B2, sesión vencida → logout** — el JWT dura 7 días (`auth-service`) y el token quedaba en MMKV para siempre: un tester que volvía con sesión vieja seguía "logueado" con un feed que respondía 401 en cada carga (exactamente el mismo reporte). `services/api` gana un `addMonitor`: cualquier **401 de un endpoint protegido habiendo token guardado** llama a `api.setUnauthorizedHandler(...)`, que `AuthContext` registra una sola vez con el mismo `logout` del drawer (limpia MMKV → el navegador cae a Login). Se excluye `auth/*` (un 401 de login es "credenciales inválidas"). Sin mensaje al usuario por ahora — la pantalla de Login aparece sola; un aviso "tu sesión venció" implicaría 7 idiomas y queda para después.
- **Deuda técnica (no resuelta, cambio de contrato):** cada `PostDto`/`CommentDto` viaja con `authorAvatarBase64` **inline** (`feed.repository.ts` → `include profile.avatarBase64`). Una página de 20 posts de usuarios con foto pesa 0,6–2 MB y con datos móviles lentos supera los 10 s de `timeout` de apisauce, que es una de las formas en que la primera carga del feed falla. Solución real: servir el avatar como URL (endpoint `GET /api/users/:id/avatar` con cache HTTP, o almacenamiento) y que el feed traiga solo la referencia. Depende de la fase de media/almacenamiento — mismo bloque que la subida de fotos a posts.
- **Grupo B3 (la foto de perfil "no aparece hasta volver a subirla")** — `avatarUri` vive solo en MMKV como ruta `file://` local, `ProfileScreen`/`ProfileEditScreen` eran las únicas lectoras y nada lo rehidrataba desde el servidor: instalación nueva o datos borrados = inicial de color aunque el backend tuviera la foto (y el feed la mostrara). `ProfileAvatar` gana `photoBase64` con el mismo contrato que `FeedAvatar` (`data:image/jpeg;base64,…`), `ProfileHeader` lo pasa como `avatarBase64`, y ambas pantallas lo alimentan con `authAvatarBase64` de `AuthContext` (que ya se repuebla con `getMyProfile()` al loguear). Prioridad: archivo local recién elegido > foto del servidor > inicial. El flujo de subida (`handlePickAvatar` → `updateProfile` + `setAuthAvatarBase64` + `syncAvatarToBackend`) no cambia; no se escribe nada nuevo en MMKV ni en disco.
- **Grupo D (drawer: "Cerrar sesión queda superpuesto sobre Cerca de mí y Campeonatos")** — no era un `position: absolute`: en `FeedDrawer` la lista de 7 ítems era un `YStack flex={1}` sin scroll ni safe area inferior; en pantallas cortas Yoga la encogía para que entrara el botón de logout, pero los ítems no se recortan y los últimos se dibujaban encima. Ahora la lista es un `ScrollView` (`flex: 1`), "Cerrar sesión" queda fijo al pie con `paddingBottom = max(insets.bottom, 12) + 8`, y el `paddingTop` fijo de 48 pasa a `insets.top + 20`. Un archivo; sin cambios visuales en pantallas donde ya entraba todo.
- **Grupo C (mitigación: "publicar imágenes y videos no funciona")** — no existe subida de media: los chips Foto/Video de `FeedComposer` y `FeedComposeModal` eran decorativos (abrían el modal de texto o no tenían `onPress`), `createPost` solo manda texto, el backend exige `mediaUrl` como URL (`@IsUrl`, sin endpoint de subida ni almacenamiento) y el gateway limita el JSON a 1 MB. Se **quitan** los dos chips en ambos lugares (ocultos, no deshabilitados: un botón gris invita a preguntar por qué no anda) para dejar de prometer algo que no está; queda solo "Partido" (sin cambios). Las claves i18n `composerPhoto`/`composerVideo` y el soporte de `mediaType`/`mediaUrl` en `api.createFeedPost`, `FeedPostCard` y el backend **se conservan** para cuando exista la implementación real. **Qué falta para volver a mostrarlos** (fase aparte): (1) endpoint de subida en el backend — multipart o URL firmada, nunca base64 por JSON (el gateway limita el cuerpo a 1 MB y un video de pocos segundos en base64 son decenas de MB); (2) almacenamiento — S3/R2 o disco del VPS servido por Caddy — que devuelva la URL que hoy exige `CreatePostDto.mediaUrl` (`@IsUrl`); (3) límite de tamaño y de duración de video, validado en cliente y en servidor; (4) redimensionado en cliente antes de subir, como `resizeForAvatar` (512×512 q0,7) pero con una resolución de post (p. ej. 1280 px lado mayor) y compresión de video; (5) picker en el feed (`expo-image-picker` ya está; para video hace falta `expo-video`) y reproducción en `FeedPostCard`.

### 2026-09-07 — Fix de QA: texto invisible en dos `TextField` + rastro del registro del push token

- `FriendsScreen` y `MunicipalityPicker`: se quita `paddingVertical: 12` del `style` que pasaban al `TextField` (con el `height: 24` fijo del componente dejaba 0 px de área de texto → texto invisible en Android). Sin cambios visuales de altura; ningún otro `TextField` tenía el patrón.
- `TextField.tsx`: comentario preventivo junto a `height: 24` (no pasar padding vertical por `style`; usar `inputWrapperStyle`). El componente no se refactorizó.
- `pushNotifications.ts` → `registerPushToken`: `console.warn` fuera de `__DEV__` cuando no hay permiso, Expo no devuelve token, el backend lo rechaza o hay excepción. Sin cambio funcional.
- Ver [`TextField`: altura fija y padding](#textfield-altura-fija-y-padding-fix-de-qa-2026-09-07) y [Notificaciones push: registro del token con rastro](#notificaciones-push-registro-del-token-con-rastro-fix-2026-09-07).

### 2026-09-05 — Fix: barra de navegación de Android invisible + insets faltantes

- `app.json`: `parentTheme` `"Light"` → `"Default"`; `<SystemBars style="light" />` único en `app.tsx` en lugar de los 19 `<StatusBar>` por pantalla.
- `MatchDetailScreen` y `ReservationDetailScreen`: `paddingBottom: insets.bottom + 16` en el scroll.
- Ver [Barras del sistema y safe area](#barras-del-sistema-y-safe-area-en-android-edge-to-edge-fix-2026-09-05).

### 2026-09-05 — Fix: la foto de perfil se descartaba en silencio antes de llegar al servidor

- `pickProfileImage.ts`: redimensionado a 512×512 JPEG q0,7 con `expo-image-manipulator` (nuevo, `~55.0.21`, módulo nativo → recompilar con EAS) para el archivo local y el base64 que se sube.
- `ProfileScreen.syncAvatarToBackend`: nunca más un `return` silencioso — log de advertencia + `AppAlert` cuando la foto no se pudo subir. 2 claves i18n nuevas (`avatarUploadFailedTitle/Message`) en los 7 idiomas.
- Ver [Fotos de perfil reales en el feed](#fotos-de-perfil-reales-en-el-feed).

### 2026-09-05 — Fixes de QA: teclado en Android, teclado en modales, fallback en español

- `ProfileEditScreen`: `behavior` del `KeyboardAvoidingView` pasa de `undefined` a `"height"` en Android (el teclado tapaba los campos).
- Los 9 modales con `TextField` ganan su propio `KeyboardAvoidingView` raíz (un `Modal` no hereda el de la pantalla).
- `fallbackLocale` pasa de `"en-US"` a `"es"`.
- Ver [Teclado en modales y pantallas](#teclado-en-modales-y-pantallas-fixes-de-qa-en-dispositivo-real-2026-09-05).

### 2026-09-01 — Identidad de marca: íconos reales, splash y nombre

- Nuevo `scripts/generate-brand-assets.js` (`npm run generate:brand`, sharp): regenera todos los íconos desde el logo — emblema solo para íconos chicos, logo completo para el splash.
- `app.json`: `name: "Elite Forge"`, `scheme: "eliteforge"`, `package`/`bundleIdentifier: com.eliteforge.app`; splash carbón con el logo completo; notificaciones con silueta blanca + `#00CEC8`. `slug`/`projectId` intactos.
- Ver [Identidad de marca](#identidad-de-marca--íconos-splash-y-nombre-de-la-app).

### 2026-08-31 — Comodín múltiple (Fase 11.1)

- `GuestRequestModal`: posiciones multi-selección + selector de cupos (1..min(5, lugares libres), prop `freeSpots`); envía `requestedPositions` y `slotsTotal`.
- Banner de `MatchDetailScreen` muestra progreso "X/Y cupos · N postulantes"; `GuestRequestCard` muestra posiciones pedidas y "Faltan N jugador(es)".
- 4 claves i18n nuevas/ajustadas (`guestSlotsLabel`, `guestOpenBannerProgress`, `guestSlotsRemaining`, `guestPositionLabel` en plural) en los 7 idiomas.
- Ver [Comodín](#comodín-fase-11).

### 2026-08-31 — Fotos de perfil reales en miembros de grupo y roster de partidos

- `GroupMemberRow` y `ParticipantRow` (`MatchDetailScreen`) pasan de inicial+color a `FeedAvatar` con la foto real (`avatarBase64` nuevo en `GroupMemberApiDto`/`MatchParticipantApiDto`); fallback de inicial+color idéntico al de antes vía `getUserColor`.
- Rankings de torneo quedan sin avatar a propósito (decisión previa documentada en el contrato `RankingEntry`).
- Ver [Fotos de perfil reales en miembros de grupo y roster de partidos](#fotos-de-perfil-reales-en-miembros-de-grupo-y-roster-de-partidos).

### 2026-08-31 — Crear partido: sede antes que formato, mismo selector de fecha que Reservas

- Extraído `app/components/DateTimeRangePicker.tsx` (día-fila + validación de hora) desde `CreateReservationModal`, usado ahora por ambos formularios (`mode="range"` en Reservas, `mode="single" allowUnset` en Crear partido) — sin lógica duplicada.
- `CreateMatchModal`: reordenado a tipo → rival → **sede** → **formato** → cupo → fecha/hora; al elegir cancha de la app se muestra el resumen de tamaños del complejo (mismos `courtSizes` que Reservas) y el formato se pre-llena con el tamaño más común (editable, no bloqueante). Sigue sin crear ni chequear ninguna `Reservation` real.
- Nuevo `app/utils/courtSize.ts` (`courtSizeLabel`, `courtSizeToFormat`, `mostCommonCourtSize`), reemplaza la copia local que tenía `CreateReservationModal`.
- Ver [Crear partido — sede antes que formato](#crear-partido--sede-antes-que-formato-selector-de-fecha-compartido).

### 2026-08-31 — Servicios del complejo en el selector de reservas + regla ESLint para `Alert`

- Chips de servicios (cafetería/transferencias/baños) en la tarjeta de cada complejo del `CreateReservationModal` (`PublicVenueApiDto.amenities`, ver [BACKEND.md](./BACKEND.md#reservations-lado-jugador--venues-service)); 3 claves i18n nuevas (`amenity_*`) en los 7 idiomas.
- `no-restricted-imports` en `eslint.config.js` ahora bloquea importar `Alert` de `react-native` — la convención de `useAppAlert()` deja de ser manual, ver [AppAlert](#appalert-reemplazo-de-alertalert-nativo).

### 2026-08-29 — Fotos de perfil reales en el feed

- `FeedAvatar` gana `photoBase64`; `AuthContext` gana `authAvatarBase64` (en memoria, repoblado al loguear) como fuente única del avatar propio.
- Reemplazadas 4 copias de `getUserColor` (`FeedDrawer`/`FeedComposeModal`/`FeedComposer`/`FeedNavbar`) por `app/utils/avatarColor.ts`.
- Ver [Fotos de perfil reales en el feed](#fotos-de-perfil-reales-en-el-feed).

### 2026-08-28 — `AppAlert` reemplaza `Alert.alert` nativo

- Nuevo `app/components/AppAlert.tsx`: `AppAlertProvider` + `useAppAlert()`, misma firma que `Alert.alert`. Migrados los 16 puntos del código que usaban el diálogo nativo del sistema operativo.
- Ver [AppAlert](#appalert-reemplazo-de-alertalert-nativo).

### 2026-08-28 — Fix: radar de estadísticas colgado al abrir ficha desde grupo

- `MemberProfileModal`: el efecto que carga las estadísticas incluía `loading`/`error`/`forbidden` en su propio arreglo de dependencias — al llamar `setLoading(true)`, React re-ejecutaba el efecto y su `cleanup` marcaba `cancelled = true` sobre la petición recién disparada, así que la respuesta real (aunque llegaba bien) se descartaba en silencio y el spinner quedaba colgado para siempre.
- Se sacaron esos tres estados de las dependencias — el guard sigue usando `profile` (legítimo, evita repetir el pedido si ya hay datos).

### 2026-08-27 — Reservas por tamaño, con auto-asignación y aprobación del dueño (Fase W.1 + W.1.1)

- `CreateReservationModal`: el jugador elige complejo + **tamaño** de cancha (ya no una cancha por nombre — ese primer intento de la Fase W.1 quedó superado por la W.1.1 en el mismo ciclo). Chequeo de disponibilidad con debounce antes de dejar confirmar.
- `ReservationDetailScreen` muestra qué cancha específica asignó el backend.
- Las reservas creadas desde la app nacen `pending` (requieren aprobación del dueño desde el portal web) — antes nacían `confirmed` directo.
- Ver [Reservas — selección por tamaño](#reservas--selección-por-tamaño-fase-w11).

### 2026-08-26 — Comodín para partidos internos (Fase 11)

- Nuevas pantallas `NearbyGuestRequestsScreen`, `GuestRequestModal`, `GuestApplicantsModal`, `GuestRequestCard`; hooks `useMatchGuestRequest`, `useNearbyGuestRequests`.
- Badge "Comodín" en el roster para participantes que entraron por esta vía (`MatchParticipant.isGuest`).
- Nuevo toggle en `ProfileEditScreen`: "avisarme si falta un jugador cerca" (`notifyNearbyGuestRequests`).
- Ver [Comodín](#comodín-fase-11).

### 2026-08-26 — Fundaciones de ubicación (Fase L.0)

- Nuevo `MunicipalityPicker`, usado en edición de perfil y creación/edición de grupo. Sin GPS ni mapas nativos en esta etapa — búsqueda por municipio contra `GET /api/geo/municipalities`.
- Ver [Ubicación](#ubicación-fase-l0).

### 2026-08-26 — Búsqueda y sugerencias de amigos (Fase 10.1)

- `FriendsScreen` gana pestaña Sugerencias y buscador (`@alias`/correo, con la regla de privacidad de coincidencia exacta por email).
- Ver [Amistad entre jugadores y búsqueda](#amistad-entre-jugadores-y-búsqueda-fase-10--101).

### 2026-08-26 — Amistad entre jugadores y feed filtrado (Fase 10)

- Nueva pantalla `FriendsScreen` (pestañas Amigos/Solicitudes) y hook `useFriends`.
- `MemberProfileModal` gana la prop `source` y la regla de producto `canShowStats` (estadísticas solo desde grupo/rankings, o con amistad aceptada) — reutilizada después por Rankings (Fase 9.1) y postulantes a comodín (Fase 11).
- El Feed deja de ser global — ver [Pantalla Feed](#pantalla-feed--red-social).
- Ver [Ficha de miembro](#ficha-de-miembro--memberprofilemodal).

### 2026-08-18 — Sincronización de perfil con backend, Tarea H (`Dev-David`)

- [x] `Api.setAuthToken` + `AuthContext` sincroniza el header `Authorization` en login/logout/hidratación inicial
- [x] `getProfileStats`, `savePhysicalTestResult`, `savePsychAssessment`, `updateFavoritePosition` en el cliente API
- [x] `useProfileStats`/`usePlayerProfile` hacen `PUT` best-effort al backend tras completar un test físico/psicológico o elegir posición favorita — no bloquea si falla (sin reintento automático, deuda pendiente)
- [x] `hydrateProfileFromBackend` reconstruye MMKV desde `GET /api/profile/stats` al entrar a `ProfileScreen` sin datos locales (dispositivo nuevo o datos borrados); backend gana si difiere de lo local
- [x] Avatar/foto de perfil sigue siendo local — fuera de alcance de esta tarea

### 2026-08-17 — Quick wins Fase 0 (`Dev-David`)

- [x] `DEV_LAN_HOST` sale del código fuente: ahora se lee de `EXPO_PUBLIC_DEV_LAN_HOST` (con fallback si no está seteada); documentado en [Desarrollo en dispositivo físico](#desarrollo-en-dispositivo-físico)
- [x] Botones sociales (Gmail/Facebook) ocultos tras el flag `SOCIAL_LOGIN_ENABLED = false` en `LoginScreen` (mobile) y en `apps/web/app/auth/sign-up/page.tsx` — no hay OAuth real implementado aún, código listo para reactivarse

### 2026-08-03 — Módulo Perfil completo (`Dev-David`)

- [x] `ProfileScreen` con header, stats, tests, psico y accesos rápidos
- [x] Navegación Feed → Perfil (navbar + drawer)
- [x] Rutas `ProfileEdit`, `PhysicalTestSession`, `PsychologicalTest`
- [x] 6 stats + 6 tests físicos con medición **in-app** (cronómetro, contadores, beep, rúbrica)
- [x] Scoring 0–100 (`profileTestScoring.ts`) y bloqueo mensual por test
- [x] Persistencia MMKV (`profileStatsStorage`, `playerProfileStorage`)
- [x] Radar chart SVG (`StatsRadarChart`, `react-native-svg`)
- [x] Sugerencia de posición por stats (`suggestPlayerPosition.ts`, 7 posiciones)
- [x] Test psicológico: 10 escenarios, rasgos, `PsychScoresChart`, bloqueo mensual
- [x] Integración mental en sugerencia de posición (72% / 28%)
- [x] Edición de perfil: datos personales, posición favorita, bio
- [x] Avatar desde galería con persistencia (`expo-image-picker`, `expo-file-system`)
- [x] Botón dev `__DEV__`: reiniciar tests físicos + psicológico
- [x] i18n `profileScreen:*` en 7 idiomas

### 2026-08-03 — Pantalla Perfil (UI mock)

- [x] Primera iteración: radar mock, tests listados, navegación desde Feed
- [x] *(Supersedido por el módulo completo de arriba)*

### 2026-07-31 — Fix lint CI (prettier + TextInput)

- [x] `eslint --fix` en mobile: Prettier e `import/order` en UI, login y feed
- [x] `FeedComposeModal` usa `TextField` en lugar de `TextInput` de `react-native` (regla `no-restricted-imports`)
- [x] `npm run lint:check` sin errores (quedan warnings i18n demo)

### 2026-07-17 — Fix Android monorepo (react-native-worklets)

- [x] Causa: `android/build/generated/autolinking/autolinking.json` apuntaba a `apps/mobile/node_modules/*` (hoist npm workspaces → raíz)
- [x] `android/settings.gradle` y `app/build.gradle` resuelven Node desde `apps/mobile` (paquete workspace)
- [x] `react-native.config.js` + `experiments.autolinkingModuleResolution`
- [x] Eliminado `apps/mobile/package-lock.json` / `node_modules` anidados
- [x] Workaround Gradle 9 + foojay 0.5.0 (`scripts/patch-rn-gradle-foojay.js` + `postinstall`)
- [x] `assembleDebug` OK (`npx expo run:android`)

### 2026-07-17 — Registro web NestJS (`apps/web`)

- [x] `SIGN_UP_URL` en `config.dev.ts` usa el mismo host que la API (`getDevApiHost`) → `http://<host>:5173/auth/sign-up`
- [x] `RegisterScreen` abre el formulario web y vuelve al login (ya no es placeholder con solo “atrás”)
- [x] `openLinkInBrowser` siempre intenta `Linking.openURL` (fix Android)
- [x] `SIGN_UP_URL` en `config.prod.ts` deja Hostinger (Supabase) y apunta a `apps/web` (`http://192.168.1.132:5173/auth/sign-up` hasta deploy público)
- [x] `DEV_LAN_HOST` actualizado a `192.168.1.132`

### Infraestructura y base

- [x] Monorepo con app móvil Ignite en `apps/mobile/`
- [x] Integración Tamagui + tokens `eliteForgeColors` en `tamagui.config.ts`
- [x] Navegación auth: `Login` → `Register` en `AppNavigator`
- [x] Hook `useResponsiveLayout` para Android/iOS
- [x] Regla Cursor `mobile-responsive-ui.mdc`

### Pantalla Login

- [x] UI completa: logo, subtítulo, formulario, redes sociales
- [x] Fondo global `#424242` (revertido desde gris `#9C9C9C`)
- [x] Tarjeta elevada `#363636` con franja bicolor superior
- [x] Inputs con labels, placeholders i18n y toggle de contraseña
- [x] Enlace "Crear cuenta" → `Config.SIGN_UP_URL` (`apps/web` `/auth/sign-up` vía `openLinkInBrowser`)
- [x] Botones Gmail/Facebook (solo UI)
- [x] `handleLogin` conectado al API Gateway — `api.login()`, token en `AuthContext` (MMKV)
- [x] `handleCreateAccount` abre registro web (`apps/web`); en dev usa el mismo host que la API
- [x] Validación email/contraseña, errores i18n, estado de carga
- [x] `config.dev.ts` API `http://<host>:3000/api/` y sign-up `http://<host>:5173/auth/sign-up`

### Pantalla Login

- [x] Nuevo logo oficial en `docs/assets/` y `apps/mobile/assets/images/`
- [x] Documentación de composición en `ELITE_FORGE.md`
- [x] PNG con transparencia real (RGBA) — corrección de fondo negro aplanado al exportar
- [x] Limpieza de huecos en letras (ej. interior de la "O" en FORGE)
- [x] Eliminación del título "Login" — logo como protagonista visual
- [x] Aumento de tamaño del logo (62–68% ancho, máx. 280–320px)

### Botones sociales

- [x] Modo `compact`: icono + etiqueta corta (Gmail / Facebook)
- [x] Ambos en **una fila** (`XStack` con `flex: 1`)
- [x] Claves i18n `*ButtonShort` para etiquetas compactas

### Animaciones

- [x] Hook `useInteractiveMotion` con presets
- [x] Animaciones en `Button`, `SocialButton`, `Input`
- [x] Componente `AuthFormCard` con hover en contenedor del login

### Feed (red social)

- [x] `FeedScreen` como destino post-login en `AppNavigator`
- [x] `FeedNavbar` interactivo con miniatura de perfil y menú
- [x] `FeedNavbar` sin texto "Feed" — solo logo Elite Forge centrado
- [x] `FeedMenuButton` (hamburguesa estándar) y nombre bajo avatar eliminado en navbar
- [x] Avatar del navbar y ítem **Perfil** del drawer navegan a `ProfileScreen`
- [x] `FeedDrawer` con accesos futuros (Perfil, Grupos, Partidos, Reservas) y logout
- [x] `FeedComposer`, `FeedPostCard`, `FeedAvatar` — estilo Facebook
- [x] Mock data: publicaciones de jugadores + anuncios Elite Forge (`mockFeedPosts.ts`)
- [x] i18n `feedScreen` / `feedDrawer` (7 idiomas)
- [x] Sin backend — solo UI y datos locales

### Pendiente / fuera de alcance actual

Ya completado (no repetir como pendiente): API real del Feed + fotos de perfil reales, backend de perfil (stats/tests/avatar), pantallas Grupos/Partidos/Reservas/Amigos/Comodín, `AppAlert` en toda la app.

- [ ] Formulario completo de Register in-app
- [ ] OAuth real (Google / Facebook SDK)
- [ ] Eliminar o aislar pantallas demo de Ignite
- [ ] Reintento automático / cola offline para el sync de profile-stats cuando falla por red
- [ ] En curso, sin mergear a `Dev-David` todavía: comodín múltiple (`feature/comodin-multiple`) — no documentar hasta que mergee

### Desarrollo en dispositivo físico

- [x] `config.dev.ts` detecta emulador vs móvil real — LAN IP en dispositivo físico, `10.0.2.2` en emulador Android
- [x] La LAN IP (`DEV_LAN_HOST`) ya **no** está hardcodeada en el código: se lee de la variable de entorno `EXPO_PUBLIC_DEV_LAN_HOST`, con un valor por defecto de respaldo si no está seteada

**Configurar tu IP local (cada desarrollador, en su máquina):**

1. Averigua la IP LAN de tu PC en la red WiFi (`ipconfig` en Windows, `ifconfig`/`ip a` en macOS/Linux).
2. Copia `apps/mobile/.env.example` a `apps/mobile/.env.local` (no versionado, ya cubierto por `.gitignore`) y setea tu IP:

   ```bash
   EXPO_PUBLIC_DEV_LAN_HOST=192.168.x.x
   ```

3. Reinicia Metro (`npm start` en `apps/mobile`) para que Expo recargue las variables `EXPO_PUBLIC_*`.

Si cambias de red (casa, universidad, datos móviles, otro router), solo necesitas actualizar ese archivo local — no vuelve a tocar código versionado.

---

## Comandos de desarrollo

```bash
cd apps/mobile

# Metro bundler
npm start

# Compilar e instalar dev build Android
npm run android

# iOS (macOS)
npm run ios

# Web
npm run web

# Typecheck
npm run compile

# Lint
npm run lint:check
```

### Notas Android (Windows)

- El proyecto usa **Expo Dev Client**, no Expo Go.
- Puede requerir `apps/mobile/android/local.properties` con `sdk.dir`.
- En rutas largas de Windows, usar `npx expo start --clear` o `--active-arch-only` si falla el build.

---

## Mantenimiento de documentación

**Regla del proyecto:** todo cambio en `apps/mobile/` debe registrarse y actualizarse en este archivo (`docs/FRONTEND.md`). Ver `.cursor/rules/frontend-documentation.mdc`.

Al implementar algo nuevo:

1. Actualizar la sección correspondiente (componentes, pantallas, dependencias, etc.).
2. Añadir una entrada en **Registro de cambios** con `[x]`.
3. Ajustar **Overview / estado** si el alcance del frontend cambia.

---

## Referencias

| Documento | Contenido |
|-----------|-----------|
| [ELITE_FORGE.md](./ELITE_FORGE.md) | Producto, módulos, logo, negocio |
| [BACKEND.md](./BACKEND.md) | API, microservicios, base de datos |
| [README.md](../README.md) | Monorepo completo, backend, infra |
| `.cursor/rules/mobile-responsive-ui.mdc` | Estándares UI responsiva |

---

*Última actualización: 2026-08-29 — sincronizado con todo lo mergeado a `Dev-David` desde el 18/08: Amistades + feed filtrado (Fase 10/10.1), ubicación (Fase L.0), comodín (Fase 11), reservas por tamaño (Fase W.1/W.1.1), `AppAlert` y fotos de perfil reales en el feed.*
