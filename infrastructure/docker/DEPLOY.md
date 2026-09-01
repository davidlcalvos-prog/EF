# Despliegue del MVP — VPS Ubuntu 24 + Docker Compose + Caddy

Runbook paso a paso para levantar el backend completo (4 microservicios + Postgres + HTTPS automático) en un VPS recién creado. La web va aparte en Hostinger (`hostinger.json`) y mobile se compila con EAS (`apps/mobile/eas.json`).

## 0. Requisitos previos

- Un VPS Ubuntu 24 con IP pública y acceso SSH como root (o usuario con sudo).
- Un subdominio para el API — en producción real: `api.eliteforge.tech`.
- **DNS primero**: creá el registro `A` del subdominio apuntando a la IP del VPS **antes** de levantar el compose — Caddy necesita que el dominio resuelva para emitir el certificado de Let's Encrypt. Verificalo con `nslookup api.eliteforge.tech` desde tu PC.

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

Qué pasa al levantar: Postgres arranca y pasa su healthcheck → el servicio one-shot `migrate` corre `prisma migrate deploy` (aplica todas las migraciones a la base vacía y termina) → recién entonces arrancan los 4 servicios → Caddy pide el certificado y publica 80/443.

## 4. Verificar

```bash
# Estado de los contenedores (migrate debe figurar como Exited (0))
docker compose --env-file .env.production -f infrastructure/docker/docker-compose.prod.yml ps

# Logs (todos, o de un servicio)
docker compose --env-file .env.production -f infrastructure/docker/docker-compose.prod.yml logs -f
docker compose --env-file .env.production -f infrastructure/docker/docker-compose.prod.yml logs -f api-gateway

# Health por HTTPS (desde cualquier máquina)
curl https://api.eliteforge.tech/api/health
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
