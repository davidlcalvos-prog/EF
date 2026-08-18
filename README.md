# Elite Forge

Monorepo técnico de **Elite Forge** — aplicación móvil de fútbol con perfil de jugador inteligente, red social deportiva, organización de partidos y reservas de canchas.

| Documento | Descripción |
|-----------|-------------|
| **[docs/ELITE_FORGE.md](./docs/ELITE_FORGE.md)** | Producto, lógica de negocio, logo, módulos funcionales |
| **[docs/FRONTEND.md](./docs/FRONTEND.md)** | Implementación técnica del mobile, changelog |
| **[docs/GRUPOS-PARTIDOS-RESERVAS-SPEC.md](./docs/GRUPOS-PARTIDOS-RESERVAS-SPEC.md)** | Definiciones de producto Fase 0: Grupos, Partidos, Reservas y Ranking |
| Este README | Stack técnico, inicio rápido, infraestructura y despliegue |

## Resumen del producto

- **Perfil inteligente** que evoluciona con partidos, votaciones y tests físicos.
- **Feed social** tipo red social en la pantalla principal.
- **Grupos** con líder, administradores y creación de partidos con cupos (8v8, 11v11, etc.).
- **Partidos** con historial, calendario futuro e invitaciones por notificación.
- **Amistades** con privacidad configurable y Tag ID de jugador.
- **Reservas de canchas** conectadas a un dashboard web en tiempo real para dueños.

## Estructura del Proyecto

```
EF/
├── docs/
│   └── ELITE_FORGE.md          # Producto, negocio, logo, módulos
├── apps/
│   ├── mobile/                 # React Native + Ignite + Tamagui
│   │   └── app/
│   │       └── components/
│   │           └── ui/         # Componentes reutilizables (Button, Card, Logo, Navbar, Toggle)
│   └── backend/                # NestJS Microservicios
│       ├── apps/
│       │   ├── api-gateway/    # Punto de entrada HTTP (REST)
│       │   ├── auth-service/   # Autenticación (PostgreSQL)
│       │   └── users-service/  # Usuarios (PostgreSQL + MongoDB)
│       └── libs/
│           ├── common/         # Pipes, filtros, interceptores, constantes
│           ├── contracts/      # DTOs e interfaces compartidas
│           └── database/       # Módulos PostgreSQL y MongoDB
├── infrastructure/
│   ├── docker/                 # Docker Compose + Dockerfiles
│   ├── kubernetes/             # Manifiestos K8s
│   └── aws/                    # Terraform + scripts de despliegue
└── .github/workflows/          # CI/CD con GitHub Actions
```

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React Native, Ignite CLI, Tamagui |
| Backend | Node.js, NestJS (Microservicios) |
| Base de Datos | PostgreSQL (relacional) + MongoDB (documentos) |
| Contenedores | Docker, Kubernetes |
| Cloud | AWS (ECR, EKS, RDS, DocumentDB) |
| CI/CD | GitHub Actions |

## Sistema de Diseño — Paleta de Colores

La identidad visual de **Elite Forge** se basa en cuatro colores predefinidos y una distribución **bicolor simétrica**: el lado izquierdo de la interfaz usa **Verde Esmeralda** y el lado derecho usa **Naranja Oscuro**.

### Colores premeditados

| Color | Hex | Uso |
|-------|-----|-----|
| **Naranja Oscuro** | `#FF8C00` | Interfaz (lado derecho) |
| **Verde Esmeralda** | `#00CEC8` | Interfaz (lado izquierdo) |
| **Gris Carbón** | `#424242` | Background |
| **Blanco Puro** | `#FFFFFF` | Letras y texto principal |

### Lógica de distribución

La UI sigue un esquema de **split-color** (división izquierda / derecha):

- **Background general:** `#424242` (Gris Carbón).
- **Texto, etiquetas y encabezados:** `#FFFFFF` (Blanco Puro).
- **Lado izquierdo** → `#00CEC8` (Verde Esmeralda).
- **Lado derecho** → `#FF8C00` (Naranja Oscuro).

### Distribución por elemento

#### Verde Esmeralda `#00CEC8` — lado izquierdo

| Elemento | Aplicación |
|----------|------------|
| Logo | Marca **Elite Forge** (esquina superior izquierda) |
| Bordes | Mitad izquierda del marco hexagonal del avatar y mitad izquierda del borde del contenedor principal |
| Stats e iconos | Métricas del lado izquierdo: **TÉCNICO**, **PODER** |
| Gráfico radar | Mitad izquierda del spider / radar chart central |
| Botones | Fondo del botón **VIEW MATCHES** (texto en blanco) |

#### Naranja Oscuro `#FF8C00` — lado derecho

| Elemento | Aplicación |
|----------|------------|
| Bordes | Mitad derecha del marco hexagonal del avatar y mitad derecha del borde del contenedor principal |
| Stats e iconos | Métricas del lado derecho: **FÍSICO**, **MENTAL** |
| Gráfico radar | Mitad derecha del spider / radar chart central |
| Botones | Fondo del botón **COMMUNITY HUB** (texto en blanco) |

#### Gris Carbón `#424242` — fondos

- Pantallas principales en modo oscuro.
- Barras inferiores (ej. **RANKING GLOBAL: #342**).
- Contenedores secundarios y áreas de apoyo visual.

#### Blanco Puro `#FFFFFF` — tipografía

- Títulos de pantalla (ej. **LOG IN**).
- Nombres de usuario y etiquetas de nivel.
- Texto dentro de botones de acción sobre fondos de color.
- Iconografía y datos numéricos sobre fondos oscuros.

### Referencia visual

La pantalla de login / perfil de referencia aplica esta distribución en un layout centrado:

```
┌─────────────────────────────────────┐
│  Elite Forge (verde)     [status]   │
│           LOG IN 🔥                 │
│    ┌─────────────────────┐        │
│    │  avatar hexagonal   │        │
│    │ verde │ naranja     │        │
│    │   DAVID MARTÍNEZ    │        │
│    │   LEVEL 14          │        │
│    │  [radar bicolor]    │        │
│    │ TÉCNICO │ FÍSICO    │        │
│    │ PODER   │ MENTAL    │        │
│    └─────────────────────┘        │
│  [VIEW MATCHES] [COMMUNITY HUB]     │
│  verde          naranja             │
│  RANKING GLOBAL: #342               │
└─────────────────────────────────────┘
  fondo: #424242  ·  texto: #FFFFFF
```

> Guía de colores para UI en `apps/mobile/`. Identidad de marca y logo en [docs/ELITE_FORGE.md](./docs/ELITE_FORGE.md#logo-e-identidad-de-marca).

### UI responsiva (Android e iOS)

Toda pantalla nueva debe ser responsiva. Usar el hook `apps/mobile/app/hooks/useResponsiveLayout.ts` y seguir la regla en `.cursor/rules/mobile-responsive-ui.mdc`.

## Requisitos Previos

- Node.js >= 20
- Docker y Docker Compose
- Para mobile: Android Studio / Xcode (según plataforma)
- Para AWS: AWS CLI, kubectl, Terraform (opcional)

## Inicio Rápido

### 1. Clonar e instalar

```bash
git clone <tu-repositorio-github>
cd EF
cp .env.example .env

# Instalar dependencias del monorepo
npm install

# Instalar dependencias del backend
cd apps/backend && npm install && cd ../..
```

### 2. Infraestructura local (Docker)

Hay **dos modos** de desarrollo backend. No los mezcles: ambos usan los puertos **3000** y **3001**.

| Modo | Cuándo usarlo | Qué corre en Docker | Qué corre en local (Node) |
|------|---------------|---------------------|---------------------------|
| **Híbrido (recomendado)** | Desarrollo diario con Prisma, hot-reload | PostgreSQL, MongoDB | auth-service, users-service, api-gateway |
| **Full Docker** | Probar imágenes / CI / despliegue | Todo el stack | Nada |

#### Modo híbrido — solo bases de datos en Docker

```bash
# Desde la raíz del monorepo
docker compose -f infrastructure/docker/docker-compose.yml up postgres mongodb -d
```

#### Modo full Docker — stack completo

```bash
npm run docker:up
```

> **Importante:** si usas el modo híbrido, **no** levantes `api-gateway`, `auth-service` ni `users-service` en Docker. El contenedor `ef-api-gateway` publica el puerto **3000** en el host y provoca `EADDRINUSE` al arrancar el gateway local.

### 3. Backend — desarrollo local (modo hibrido)

Arquitectura esperada:

```
Bruno / mobile / web
        │
        ▼
  API Gateway (local)     :3000  HTTP  /api/*
        │ TCP
        ├── auth-service (local)   :3001
        └── users-service (local)  :3002
                │
        ┌───────┴────────┐
        ▼                ▼
   PostgreSQL         MongoDB
   (Docker :5433)    (Docker :27018)
```

#### Puertos

| Componente | Variable | Puerto | Dónde corre |
|------------|----------|--------|-------------|
| API Gateway | `API_GATEWAY_PORT` | **3000** | Local |
| auth-service | `AUTH_SERVICE_PORT` | **3001** | Local |
| users-service | `USERS_SERVICE_PORT` | **3002** | Local |
| PostgreSQL | `POSTGRES_HOST_PORT` | **5433** → 5432 | Docker |
| MongoDB | `MONGO_HOST_PORT` | **27018** → 27017 | Docker |

Definidos en: `.env`, `apps/backend/apps/*/src/main.ts`, `infrastructure/docker/docker-compose.yml`.

#### Orden de arranque limpio

**1. Dejar el entorno libre de conflictos** (ver sección [Evitar EADDRINUSE](#evitar-eaddrinuse) más abajo).

**2. Levantar PostgreSQL (y MongoDB si usas users-service):**

```bash
docker compose -f infrastructure/docker/docker-compose.yml up postgres mongodb -d
```

**3. Seed Prisma** (solo la primera vez o si faltan roles del sistema):

```bash
cd apps/backend
npm run prisma:seed
```

**4. Arrancar microservicios** (una terminal por servicio, desde `apps/backend`):

```bash
# Terminal 1 — Auth
npm run start:auth

# Terminal 2 — Users (si aplica)
npm run start:users

# Terminal 3 — Gateway
npm run start:gateway
```

Desde la raíz del monorepo también puedes usar:

```bash
npm run backend:auth      # Terminal 1
npm run backend:users     # Terminal 2
npm run backend:gateway   # Terminal 3
```

Espera en auth-service: `PostgreSQL connection established` y `Auth Service (TCP) running on port 3001`.

API disponible en: `http://localhost:3000/api`

#### Evitar EADDRINUSE

El error `listen EADDRINUSE` significa que **3000** o **3001** ya están ocupados. Causas habituales:

| Puerto | Ocupado por | Cómo comprobarlo |
|--------|-------------|------------------|
| **3000** | Contenedor `ef-api-gateway` o gateway Node antiguo | `lsof -i :3000` |
| **3001** | Proceso Node de `nest start auth-service` duplicado | `lsof -i :3001` |

**Comprobar qué usa cada puerto:**

```bash
lsof -i :3000
lsof -i :3001
lsof -i :3002
docker ps --format 'table {{.Names}}\t{{.Ports}}\t{{.Status}}'
```

**Limpiar entorno para desarrollo híbrido** (no borra volúmenes ni imágenes):

```bash
# Detener solo los microservicios Docker (deja postgres y mongodb)
docker compose -f infrastructure/docker/docker-compose.yml stop api-gateway auth-service users-service

# O detener contenedores concretos por nombre
docker stop ef-api-gateway ef-auth-service ef-users-service
```

**Detener procesos Node locales** (sustituye `<PID>` por el valor de `lsof`):

```bash
kill <PID>
```

Si quedaron procesos `nest` en segundo plano:

```bash
pkill -f "nest start api-gateway"
pkill -f "nest start auth-service"
pkill -f "nest start users-service"
```

**Verificar que los puertos quedaron libres** (sin salida = libre):

```bash
lsof -i :3000
lsof -i :3001
```

Luego sigue el [orden de arranque limpio](#orden-de-arranque-limpio) de arriba.

### 4. Mobile

```bash
npm run mobile          # Expo dev server
npm run mobile:android  # Android
npm run mobile:ios      # iOS (macOS)
```

## Componentes UI Reutilizables

Los componentes Tamagui viven en `apps/mobile/app/components/ui/`:

```tsx
import { Button, Card, Logo, Navbar, Toggle } from "@/components/ui"
```

| Componente | Descripción |
|-----------|-------------|
| `Button` | Botón con variantes: primary, secondary, outline, ghost |
| `Card` | Tarjeta con título y subtítulo opcionales |
| `Logo` | Logo de la app con texto opcional |
| `Navbar` | Barra de navegación superior reutilizable |
| `Toggle` | Switch con etiqueta y descripción |

## Arquitectura Backend (SOLID)

- **S**ingle Responsibility: cada microservicio tiene una responsabilidad única
- **O**pen/Closed: libs extensibles sin modificar servicios existentes
- **L**iskov Substitution: interfaces de repositorio intercambiables
- **I**nterface Segregation: DTOs específicos en `@ef/contracts`
- **D**ependency Inversion: servicios dependen de abstracciones (repositorios)

### Endpoints API Gateway

Detalle de flujos, User/Profile y permisos: **[docs/BACKEND.md](./docs/BACKEND.md)**.

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/health` | No | Health check |
| POST | `/api/auth/register` | No | Registro (User + Profile, rol Jugador) |
| POST | `/api/auth/login` | No | Login → JWT |
| GET | `/api/auth/me` | JWT | Usuario autenticado |
| POST | `/api/auth/validate` | Body `token` | Validar JWT |
| GET | `/api/users/:id` | JWT | Perfil (propietario o Administrador) |
| PATCH | `/api/users/:id/profile` | JWT | Actualizar perfil |
| GET | `/api/users/:id/preferences` | JWT | Preferencias (MongoDB) |
| PATCH | `/api/users/:id/preferences` | JWT | Actualizar preferencias |

## Kubernetes

```bash
kubectl apply -f infrastructure/kubernetes/namespace.yaml
kubectl apply -f infrastructure/kubernetes/configmap.yaml
kubectl apply -f infrastructure/kubernetes/secrets.example.yaml  # renombrar y configurar
kubectl apply -f infrastructure/kubernetes/postgres/
kubectl apply -f infrastructure/kubernetes/mongodb/
kubectl apply -f infrastructure/kubernetes/services/
```

## Despliegue AWS

1. Configurar credenciales AWS
2. Aplicar Terraform: `cd infrastructure/aws/terraform && terraform init && terraform apply`
3. Desplegar con GitHub Actions (workflow `Deploy AWS`) o script:

```bash
export AWS_ACCOUNT_ID=123456789012
bash infrastructure/aws/scripts/deploy.sh
```

### Secrets de GitHub requeridos

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_ACCOUNT_ID`

## GitHub

```bash
git init
git add .
git commit -m "feat: initial monorepo setup"
git remote add origin https://github.com/davidcalvoelite-lang/EF.git
git push -u origin main
```

## Licencia

Privado — Todos los derechos reservados.
