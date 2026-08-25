#!/usr/bin/env bash
# Restaura um dump no banco de PRODUÇÃO (destrutivo: --clean derruba e recria
# os objetos antes de restaurar). Pede confirmação explícita.
#
# Uso:    ./infra/backup/restore.sh backups/daily-20260825-031700.dump
# Drill:  ./infra/backup/restore.sh --drill backups/daily-....dump
#         (restaura num banco descartável wgotalent_restore_drill e valida —
#          rode isso 1x/mês; backup nunca testado não é backup)
set -euo pipefail
cd "$(dirname "$0")/../.."

COMPOSE="docker compose -f docker-compose.prod.yml"
DRILL=0
[ "${1:-}" = "--drill" ] && { DRILL=1; shift; }
DUMP="${1:?uso: restore.sh [--drill] <arquivo.dump>}"
[ -f "$DUMP" ] || { echo "ERRO: $DUMP não existe"; exit 1; }

if [ "$DRILL" = "1" ]; then
  DB_DRILL="wgotalent_restore_drill"
  echo "==> DRILL: restaurando em banco descartável '$DB_DRILL'"
  $COMPOSE exec -T postgres sh -c \
    'dropdb -U "$POSTGRES_USER" --if-exists '"$DB_DRILL"' && createdb -U "$POSTGRES_USER" '"$DB_DRILL"''
  $COMPOSE exec -T postgres sh -c \
    'pg_restore -U "$POSTGRES_USER" -d '"$DB_DRILL"' --no-owner' < "$DUMP"
  echo "==> Validação: contagem de candidatos no dump restaurado"
  $COMPOSE exec -T postgres sh -c \
    'psql -U "$POSTGRES_USER" -d '"$DB_DRILL"' -c "select count(*) from wgotalent_candidatos;"'
  $COMPOSE exec -T postgres sh -c 'dropdb -U "$POSTGRES_USER" '"$DB_DRILL"''
  echo "Drill concluído: o dump é restaurável."
  exit 0
fi

echo "!!! Isto vai SOBRESCREVER o banco de produção com: $DUMP"
read -r -p "Digite o nome do banco para confirmar: " CONFIRM
DBNAME=$($COMPOSE exec -T postgres sh -c 'echo -n "$POSTGRES_DB"')
[ "$CONFIRM" = "$DBNAME" ] || { echo "Confirmação incorreta; abortado."; exit 1; }

echo "==> Parando o app (evita escritas durante o restore)"
# stop envia SIGTERM; após stop_grace_period (padrão 10 s) o Docker dispara
# SIGKILL automaticamente — comportamento correto e esperado aqui.
$COMPOSE stop app

echo "==> pg_restore --clean --if-exists"
$COMPOSE exec -T postgres sh -c \
  'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner' < "$DUMP"

echo "==> Religando o app"
$COMPOSE up -d app
echo "Restore concluído. Verifique /api/health e os dados."
