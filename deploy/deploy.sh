#!/usr/bin/env bash
# Deploy del portfolio su arm_php.
#
# Cosa fa:
#   1. rsync del progetto (senza .git, log, deploy/) verso /home/ubuntu/nicoweb
#   2. docker compose build + up -d sull'host remoto
#   3. controllo che il container sia healthy
#
# Pre-requisiti sull'host:
#   - Docker + Compose installati
#   - rete docker mahoboi_maho-network già presente (la crea il compose di mahoboi)
#   - Caddyfile di mahoboi aggiornato col site block per il dominio (vedi
#     deploy/wire-caddy.sh — eseguito una volta sola)
#
# Usage:
#   ./deploy/deploy.sh
#   ./deploy/deploy.sh --dry-run

set -euo pipefail

REMOTE_HOST="${REMOTE_HOST:-arm_php}"
REMOTE_PATH="${REMOTE_PATH:-/home/ubuntu/nicoweb}"
LOCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)/"
DRY_RUN=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --host)    REMOTE_HOST="$2"; shift 2 ;;
    --path)    REMOTE_PATH="$2"; shift 2 ;;
    --dry-run) DRY_RUN="--dry-run"; shift ;;
    -h|--help) sed -n '2,20p' "$0"; exit 0 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

echo "==> Sync $LOCAL_DIR  →  ${REMOTE_HOST}:${REMOTE_PATH}"
ssh "$REMOTE_HOST" "mkdir -p '$REMOTE_PATH'"

rsync -avz --delete $DRY_RUN \
  --exclude='.git/' \
  --exclude='node_modules/' \
  --exclude='*.log' \
  --exclude='.DS_Store' \
  --exclude='deploy/' \
  "$LOCAL_DIR" "${REMOTE_HOST}:${REMOTE_PATH}/"

if [[ -n "$DRY_RUN" ]]; then
  echo "==> Dry run, fermo qui."
  exit 0
fi

echo "==> Build & up del container su ${REMOTE_HOST}"
ssh "$REMOTE_HOST" "bash -se" <<EOF
  set -euo pipefail
  cd '$REMOTE_PATH'
  docker compose -f docker-compose.prod.yml up -d --build
  echo "--- Container status ---"
  docker ps --filter name=nicoweb --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
  echo "--- Smoke test interno (curl dalla rete maho) ---"
  docker run --rm --network mahoboi_maho-network alpine sh -c \
    'apk add --no-cache curl >/dev/null 2>&1 && curl -sS -o /dev/null -w "HTTP %{http_code} (%{time_total}s)\n" http://nicoweb/'
EOF

echo "==> Deploy completato."
