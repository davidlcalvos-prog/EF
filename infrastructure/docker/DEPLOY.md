# Despliegue del MVP — VPS Ubuntu 24 + Docker Compose + Caddy

Runbook paso a paso para levantar el stack completo (4 microservicios + Postgres + **web Next.js** + HTTPS automático) en un VPS recién creado. Mobile se compila con EAS (`apps/mobile/eas.json`).

**Fase W.5:** la web ya NO se despliega en el shared hosting de Hostinger — su límite de hilos/procesos (CloudLinux LVE) mataba el build de Next.js (Turbopack con `panic`/`EAGAIN`, Webpack con `EAGAIN` al optimizar fuentes e imágenes de Leaflet, confirmado por SSH). Corre como un contenedor más de este compose (`web`, `Dockerfile.web`), detrás de Caddy. Los `hostinger.json` se eliminaron del repo.

## 0. Requisitos previos

- Un VPS Ubuntu 24 con IP pública y acceso SSH como root (o usuario con sudo).
- Un subdominio para el API — en producción real: `api.eliteforge.tech` — y el dominio raíz para la web (`eliteforge.tech` + `www`).
- **DNS primero**: los registros `A` (subdominio del API y dominio raíz) deben apuntar a la IP del VPS **antes** de levantar el compose — Caddy necesita que cada dominio resuelva para emitir su certificado de Let's Encrypt. Verificalo con `nslookup api.eliteforge.tech` y `nslookup eliteforge.tech` desde tu PC. (El `A` de la raíz ya quedó apuntando al VPS cuando Hostinger vinculó el dominio.)

## 1. Instalar Docker + Compose plugin

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

## 2. Clonar el repo y crear el `.env.production`

```bash
git clone https://github.com/davidlcalvos-prog/EF.git
cd EF
cp .env.production.example .env.production
nano .env.production
```

Valores a rellenar (los `[SECRETO]` se generan, nunca se inventan a mano):

| Variable | Cómo obtenerla |
|---|---|
| `API_DOMAIN` | Tu subdominio del API (producción real: `api.eliteforge.tech`) |
| `WEB_DOMAIN` | Hostnames de la web separados por **espacio** (`eliteforge.tech www.eliteforge.tech`) — Caddy los toma como dos direcciones del mismo bloque |
| `WEB_DOMAIN_PRIMARY` | UN dominio canónico sin protocolo (`eliteforge.tech`) — arma `NEXT_PUBLIC_SITE_URL` en el **build** de la web (Next lo incrusta al compilar; por eso no alcanza una sola variable) |
| `POSTGRES_PASSWORD` | `openssl rand -base64 24` |
| `JWT_SECRET` | `openssl rand -base64 48` |
| `CORS_ORIGINS` | Dominios de la web separados por coma (`https://eliteforge.tech,https://www.eliteforge.tech`) |
| `POSTGRES_USER` / `POSTGRES_DB` | Podés dejar `ef_user` / `ef_db` |
| `EXPO_ACCESS_TOKEN` | Vacío (hoy no se usa; ver `apps/backend/.env.example`) |

## 3. Levantar

> El compose lee las variables de `.env.production` (raíz del repo) vía `--env-file` — es la ruta oficial documentada. Ejecutá siempre desde la raíz del repo.

```bash
docker compose --env-file .env.production -f infrastructure/docker/docker-compose.prod.yml up -d --build
```

Qué pasa al levantar: Postgres arranca y pasa su healthcheck → el servicio one-shot `migrate` corre `prisma migrate deploy` (aplica todas las migraciones a la base vacía y termina) → recién entonces arrancan los 4 servicios → arranca `web` (Next.js standalone, `HOSTNAME=0.0.0.0` para que Caddy lo alcance en la red interna) → Caddy pide los certificados (API + web) y publica 80/443.

### 3.1 Primer arranque: bootstrap de roles + Administrador (obligatorio)

`migrate deploy` crea las tablas pero **no inserta los roles del sistema** — sin ellos, el registro de jugadores falla. Y `seed.ts` **no se corre en producción**: tiene contraseñas fijas públicas (el repo es público), crea datos de demo, y su "admin" es un Empresario — no crea ningún Administrador, que es el único rol que puede dar de alta dueños de cancha.

Para eso existe `prisma/bootstrap-prod.js` (idempotente, viaja dentro de las imágenes): asegura los 4 roles del sistema y crea la cuenta de Administrador desde variables de entorno, sin ningún default. La contraseña no debe quedar en el historial de bash — usar `read -s`:

```bash
read -s -p "Contraseña del Administrador: " BOOTSTRAP_ADMIN_PASSWORD; echo
docker compose --env-file .env.production -f infrastructure/docker/docker-compose.prod.yml \
  exec -e BOOTSTRAP_ADMIN_EMAIL=davidlcalvos@gmail.com \
       -e BOOTSTRAP_ADMIN_PASSWORD="$BOOTSTRAP_ADMIN_PASSWORD" \
       users-service node prisma/bootstrap-prod.js
unset BOOTSTRAP_ADMIN_PASSWORD
```

Reglas del script: aborta si faltan email o contraseña, si la contraseña tiene menos de 12 caracteres, o si es una de las del seed de dev (`Admin123!`/`Demo123!`). Si el email ya existe no toca la contraseña ("ya existe, sin cambios") salvo que se pase `-e BOOTSTRAP_ADMIN_RESET_PASSWORD=true`. Opcionales: `BOOTSTRAP_ADMIN_FIRSTNAME`/`BOOTSTRAP_ADMIN_LASTNAME`. Nunca crea datos de demo ni loguea la contraseña. Se puede correr de nuevo tras cada redeploy sin duplicar nada.

**Sobre el build de `web`:** `NEXT_PUBLIC_API_URL` (`/api`) y `NEXT_PUBLIC_SITE_URL` (`https://$WEB_DOMAIN_PRIMARY`) viajan como **build args** porque Next.js los incrusta en el bundle del cliente al compilar. El rewrite `/api → api-gateway` también queda horneado en build (`routes-manifest.json` del standalone) apuntando a `http://api-gateway:3000` — está fijado dentro de `Dockerfile.web`, no es configurable porque el DNS interno del compose nunca cambia.

## 4. Verificar

```bash
# Estado de los contenedores (migrate debe figurar como Exited (0))
docker compose --env-file .env.production -f infrastructure/docker/docker-compose.prod.yml ps

# Logs (todos, o de un servicio)
docker compose --env-file .env.production -f infrastructure/docker/docker-compose.prod.yml logs -f
docker compose --env-file .env.production -f infrastructure/docker/docker-compose.prod.yml logs -f api-gateway

# Health por HTTPS (desde cualquier máquina)
curl https://api.eliteforge.tech/api/health

# La web (debe devolver el HTML de la landing)
curl -I https://eliteforge.tech
```

Si el certificado no sale: casi siempre es el DNS que aún no propagó, o los puertos 80/443 cerrados en el firewall del proveedor. `docker compose ... logs caddy` lo dice explícito.

## 5. Actualizar a una versión nueva

```bash
cd EF
git pull
docker compose --env-file .env.production -f infrastructure/docker/docker-compose.prod.yml up -d --build
```

`migrate` vuelve a correr y aplica solo las migraciones nuevas (`migrate deploy` es idempotente). Los servicios se recrean solo si su imagen cambió.

## 6. Backup y restore de Postgres

Backup manual (comprimido, con fecha):

```bash
./infrastructure/docker/backup.sh
```

(equivale a `docker compose ... exec postgres pg_dump -U ef_user ef_db | gzip > backup-FECHA.sql.gz`)

Backup diario automático a las 03:00 — agregar con `crontab -e`:

```
0 3 * * * cd /root/EF && ./infrastructure/docker/backup.sh >> /var/log/ef-backup.log 2>&1
```

Restaurar un backup en una base limpia:

```bash
gunzip -c backups/ef_db-2026-08-25.sql.gz | docker compose --env-file .env.production -f infrastructure/docker/docker-compose.prod.yml exec -T postgres psql -U ef_user -d ef_db
```

## 7. Notas

- El `"prepare": "husky install || true"` del `package.json` raíz es a propósito: dentro de las imágenes de Docker el `npm ci --omit=dev` no instala `husky` (devDependency) y sin el `|| true` el script `prepare` moría con exit 127 y tiraba abajo el build de las 4 imágenes. En desarrollo local (con devDependencies) `husky install` corre normal y el pre-commit no cambia.
- Solo Caddy publica puertos al exterior (80/443). Postgres y los microservicios viven en la red interna del compose — no son accesibles desde afuera.
- El compose falla a propósito si `JWT_SECRET` o `POSTGRES_PASSWORD` faltan en el `.env.production` — no hay defaults inseguros en producción.
- Mobile para Play Store: en `apps/mobile/eas.json`, el perfil `production` está en `"buildType": "apk"` para distribución interna inicial; para subir a Play Store cambiarlo a `"buildType": "app-bundle"` (AAB) y correr `npx eas-cli build --profile production --platform android`.
