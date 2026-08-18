# Elite Forge — Documentación Frontend (Mobile)

Registro técnico de la implementación del frontend móvil en el monorepo `EF`. Para producto y negocio, ver [ELITE_FORGE.md](./ELITE_FORGE.md).

---

## Overview

El frontend vive en `apps/mobile/` y es una aplicación **React Native** generada con **Ignite CLI**, extendida con **Tamagui** como sistema de diseño y componentes UI propios bajo `app/components/ui/`.

### Estado actual

| Área | Estado |
|------|--------|
| Pantalla de **Login** | Implementada + conectada al API Gateway |
| Pantalla **Perfil** | Implementada (stats, tests físicos in-app, test psicológico, edición, avatar, sugerencia de posición) |
| Pantalla **Feed** (red social) | Implementada (UI mock, sin backend) |
| Pantalla de **Register** (placeholder) | En stack; registro real vía portal web externo |
| **Backend / auth real** | Login conectado al API Gateway (`POST /api/auth/login`) |
| **Feed backend** | No implementado — datos mock en `app/data/mockFeedPosts.ts` |
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

## Pantalla Feed — red social (UI)

**Archivo principal:** `app/screens/feed/FeedScreen.tsx`

Destino post-login. Estilo tipo **Facebook**: publicaciones de jugadores, anuncios Elite Forge, composer superior y acciones sociales (solo UI).

### Layout

- `react-native-drawer-layout` — menú lateral (~82% ancho)
- `FeedNavbar` — barra bicolor, botón menú animado, logo, miniatura de perfil del usuario
- `FlatList` responsiva con `useResponsiveLayout()`
- Fondo `#424242`

### Componentes del Feed

| Componente | Descripción |
|------------|-------------|
| `FeedNavbar` | Navbar interactivo; logo centrado; avatar abre el drawer |
| `FeedDrawer` | Perfil, Grupos, Partidos, Reservas (próximamente) + cerrar sesión |
| `FeedComposer` | “¿Qué quieres compartir?” + accesos Foto / Video / Partido (stub) |
| `FeedPostCard` | Tarjeta de publicación: texto, imagen, video, likes/comentarios |
| `FeedAvatar` | Avatar circular con iniciales y animación press |
| `mockFeedPosts.ts` | Datos mock (jugadores + anuncios Elite Forge) |

### Drawer — accesos futuros

| Ítem | Estado |
|------|--------|
| Perfil | Navega a `ProfileScreen` |
| Grupos | Alert “Próximamente” |
| Partidos | Alert “Próximamente” |
| Reservas | Alert “Próximamente” |
| Cerrar sesión | Funcional (`logout()` → Login) |

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

## Registro de cambios (sesión de implementación)

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

- [ ] API real del Feed (publicaciones, likes, comentarios)
- [ ] Backend de perfil (stats, tests, avatar en servidor)
- [ ] Pantallas Grupos, Partidos, Reservas (solo stub desde perfil y drawer)
- [ ] Formulario completo de Register in-app
- [ ] OAuth real (Google / Facebook SDK)
- [ ] Eliminar o aislar pantallas demo de Ignite

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

*Última actualización: módulo Perfil completo en rama `Dev-David` (tests in-app, psico, avatar, sugerencia de posición).*
