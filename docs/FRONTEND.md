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
- URI persistente en MMKV; sobrevive reinicios de app.
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
| `GuestRequestModal.tsx` | El líder/vice publica la vacante (posición buscada opcional, radio en km) |
| `GuestApplicantsModal.tsx` | El líder/vice revisa postulaciones y acepta/rechaza |
| `GuestRequestCard.tsx` | Tarjeta de una vacante en la lista de "Cerca de mí" |
| `useMatchGuestRequest.ts` | Ciclo de vida de la vacante de UN partido (abrir, cancelar, postulaciones) |

En el roster del partido, un participante que entró como comodín (no por membresía de grupo) lleva el badge **"Comodín"** (`MatchParticipant.isGuest`).

**Preferencia de perfil:** `ProfileEditScreen` tiene el toggle "avisarme si falta un jugador cerca" (`Profile.notifyNearbyGuestRequests`, opt-in, guardado al toque — no espera al botón Guardar general). Solo controla si se recibe **push** cuando se publica una vacante cerca; no afecta qué aparece en "Cerca de mí", que siempre se calcula por zona.

## Reservas — selección por tamaño (Fase W.1.1)

**Archivo:** `app/screens/reservations/components/CreateReservationModal.tsx`.

El jugador elige complejo y **tamaño de cancha** (5v5/6v6/7v7/8v8/11v11) — ya no una cancha específica por nombre. Al completar complejo + tamaño + horario válido, un chequeo con debounce (350 ms, mismo patrón de secuencia que el resto de la app) consulta `GET /api/venues/:id/availability` y muestra cuántas canchas de ese tamaño están libres **antes** de dejar confirmar — nunca se llega a un error de solape recién al final. El backend auto-asigna la cancha puntual (ver [BACKEND.md → Reservations](./BACKEND.md#reservations-lado-jugador--venues-service)); `ReservationDetailScreen` muestra qué cancha específica le tocó ("Te asignamos: {cancha}") una vez confirmada.

Las reservas telefónicas que carga el dueño desde el portal web siguen sin cambios: ahí sí elige la cancha directo por nombre (es el dueño quien gestiona su propio inventario).

**Servicios del complejo (2026-08-31):** la tarjeta de cada complejo en el selector muestra chips con sus servicios (`PublicVenueApiDto.amenities`: cafetería, transferencias, baños — claves i18n `reservationsScreen:amenity_*` en los 7 idiomas), para que el jugador los vea antes de elegir dónde reservar. Si el complejo no tiene servicios marcados, no se muestra nada (sin hueco).

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

## Registro de cambios (sesión de implementación)

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
