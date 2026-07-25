#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

docker compose -f "$ROOT_DIR/docker-compose.yml" up --build -d

echo ""
echo "Suraksha Diary is starting in the background."
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:8000/api/"