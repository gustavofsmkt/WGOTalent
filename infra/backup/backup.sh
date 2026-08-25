#!/usr/bin/env bash
# Backup lógico do Postgres + tar do volume de currículos.
#
# Volume NÃO é backup: ele mora no mesmo disco da VPS e morre junto com ela
# (ou com um `rm` errado). Backup é uma cópia restaurável, com retenção,
# FORA do host. Agende no cron do host (como o usuário do deploy):
#   17 3 * * * cd /opt/wgotalent && ./infra/backup/backup.sh daily >> logs/backup.log 2>&1
#
# Uso: ./infra/backup/backup.sh [prefixo]   (prefixo default: daily)
set -euo pipefail
cd "$(dirname "$0")/../.."

COMPOSE="docker compose -f docker-compose.prod.yml"
PREFIX="${1:-daily}"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="backups"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
mkdir -p "$BACKUP_DIR"

echo "==> pg_dump (formato custom, compactado)"
# -Fc: formato custom — restaura com pg_restore, permite restore seletivo e
# paralelo. Roda dentro do container (client 16 = server 16, sem mismatch).
$COMPOSE exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' \
  > "$BACKUP_DIR/$PREFIX-$STAMP.dump"

echo "==> tar do volume de currículos (wgotalent_storage)"
docker run --rm \
  -v wgotalent_storage:/data:ro \
  -v "$PWD/$BACKUP_DIR":/backup \
  alpine tar czf "/backup/$PREFIX-storage-$STAMP.tar.gz" -C /data .

echo "==> Retenção local: removendo backups com mais de $RETENTION_DAYS dias"
find "$BACKUP_DIR" -name "*.dump" -mtime +"$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -name "*-storage-*.tar.gz" -mtime +"$RETENTION_DAYS" -delete

# Off-host: sem isto o backup ainda mora no disco que ele deveria proteger.
# Configure um remote rclone (ex.: B2, S3, Drive) e defina BACKUP_RCLONE_REMOTE
# no ambiente do cron, ex.: BACKUP_RCLONE_REMOTE="b2:wgotalent-backups"
if [ -n "${BACKUP_RCLONE_REMOTE:-}" ]; then
  echo "==> Enviando para $BACKUP_RCLONE_REMOTE"
  rclone copy "$BACKUP_DIR" "$BACKUP_RCLONE_REMOTE" --include "*$STAMP*"
  echo "==> Retenção remota: removendo arquivos com mais de $RETENTION_DAYS dias"
  rclone delete "$BACKUP_RCLONE_REMOTE" \
    --min-age "${RETENTION_DAYS}d" \
    --include "*.dump" --include "*-storage-*.tar.gz"
else
  echo "AVISO: BACKUP_RCLONE_REMOTE não definido — backup ficou APENAS neste host."
fi

echo "Backup concluído: $BACKUP_DIR/$PREFIX-$STAMP.dump"
