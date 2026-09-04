#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created bbpdf/.env from .env.example. Review it before production use."
fi

bash engine/vendor-stirling.sh

docker compose up -d --build

echo
echo "BBPDF is running locally on http://127.0.0.1:8081"
echo "Health: http://127.0.0.1:8081/health"
