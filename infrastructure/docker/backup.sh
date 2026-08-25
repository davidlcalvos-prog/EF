#!/usr/bin/env bash
# Backup manual/cron de Postgres (producción) — pg_dump comprimido con fecha.
# Uso: ./infrastructure/docker/backup.sh   (desde la raíz del repo, en el VPS)
# Cron diario 03:00:  0 3 * * * cd /root/EF && ./infrastructure/docker/backup.sh >> /var/log/ef-backup.log 2>&1
set -euo pipefail

cd "$(dirname "$0")/../.."

ENV_FILE=".env.production"
COMPOSE_FILE="infrastructure/docker/docker-compose.prod.yml"
BACKUP_DIR="backups"

# shellcheck disable=SC1090
source <(grep -E '^(POSTGRES_USER|POSTGRES_DB)=' "$ENV_FILE")

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%F)"
OUT="$BACKUP_DIR/${POSTGRES_DB}-${STAMP}.sql.gz"

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T postgres \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$OUT"

echo "[$(date -Is)] backup ok -> $OUT ($(du -h "$OUT" | cut -f1))"
