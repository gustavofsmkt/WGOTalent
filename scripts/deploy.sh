#!/usr/bin/env bash
# Deploy de produção na VPS. Ordem é o ponto: build -> backup -> migrate ->
# swap de containers. A migração roda com o código NOVO antes de o app novo
# receber tráfego; o app antigo continua servindo durante build e migração.
#
# TLS/HTTPS: gerenciado pelo Nginx Proxy Manager (NPM) da VPS — este script
# não toca nele. O NPM aponta para http://127.0.0.1:${APP_PORT:-3000}.
#
# Downtime honesto: Compose puro recria o container do app em segundos;
# nesse intervalo o NPM responde 502. Zero-downtime real exigiria duas
# réplicas com drain no proxy — fora do escopo desta stack (ver README).
set -euo pipefail
cd "$(dirname "$0")/.."

COMPOSE="docker compose -f docker-compose.prod.yml"

echo "==> Pré-checagens"
# Volumes de dados são external: o deploy se recusa a rodar sem eles, em vez
# de deixar o Compose falhar no meio (ou pior: alguém trocar para volume
# não-external e subir um banco vazio sem perceber).
docker volume inspect wgotalent_pgdata >/dev/null
docker volume inspect wgotalent_storage >/dev/null
[ -f .env ] || { echo "ERRO: .env ausente (copie de .env.example, chmod 600)"; exit 1; }
PERM="$(stat -c %a .env)"
[ "$PERM" = "600" ] || { echo "ERRO: .env deve ter chmod 600 (atual: $PERM). Corrija antes de continuar."; exit 1; }

echo "==> Build das imagens (app antigo segue no ar)"
$COMPOSE build

echo "==> Subindo/garantindo o banco"
$COMPOSE up -d postgres

echo "==> Aguardando Postgres ficar healthy"
for i in $(seq 1 30); do
  id=$($COMPOSE ps -q postgres 2>/dev/null)
  if [ -n "$id" ]; then
    status=$(docker inspect -f '{{.State.Health.Status}}' "$id" 2>/dev/null || echo starting)
  else
    status=starting
  fi
  [ "$status" = "healthy" ] && { echo "postgres healthy."; break; }
  [ "$i" = "30" ] && { echo "ERRO: postgres não ficou healthy; veja: $COMPOSE logs postgres"; exit 1; }
  sleep 2
done

echo "==> Backup pré-migração"
# Barato e é o único rollback confiável para migração destrutiva que falha
# no meio. Se o backup falhar, o deploy PARA aqui.
./infra/backup/backup.sh pre-deploy

echo "==> Aplicando migrações (drizzle-kit migrate, código novo, one-off)"
$COMPOSE run --rm migrate

echo "==> Trocando app para a imagem nova"
$COMPOSE up -d --remove-orphans

echo "==> Aguardando healthcheck do app"
for i in $(seq 1 30); do
  id=$($COMPOSE ps -q app 2>/dev/null)
  if [ -n "$id" ]; then
    status=$(docker inspect -f '{{.State.Health.Status}}' "$id" 2>/dev/null || echo starting)
  else
    status=starting
  fi
  [ "$status" = "healthy" ] && { echo "app healthy."; break; }
  [ "$i" = "30" ] && { echo "ERRO: app não ficou healthy; veja: $COMPOSE logs app"; exit 1; }
  sleep 2
done

echo "==> Limpando imagens dangling"
docker image prune -f >/dev/null

echo "Deploy concluído."

# Rollback de código:  git checkout <tag-anterior> && ./scripts/deploy.sh
# (migrações são forward-only; escreva-as expand/contract para que o código
# antigo continue funcionando sobre o schema novo — ver README).
# Rollback de migração destrutiva que quebrou:
#   ./infra/backup/restore.sh backups/pre-deploy-<timestamp>.dump
