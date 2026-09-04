#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST="$ROOT/stirling-pdf"
COMMIT="$(tr -d '[:space:]' < "$ROOT/VERSION")"

if [[ -z "$COMMIT" ]]; then
  echo "engine/VERSION is empty" >&2
  exit 1
fi

if [[ -d "$DEST/.git" ]]; then
  git -C "$DEST" fetch --depth 1 origin "$COMMIT"
  git -C "$DEST" checkout --detach "$COMMIT"
else
  rm -rf "$DEST"
  git clone --filter=blob:none --no-checkout https://github.com/Stirling-Tools/Stirling-PDF.git "$DEST"
  git -C "$DEST" fetch --depth 1 origin "$COMMIT"
  git -C "$DEST" checkout --detach "$COMMIT"
fi

echo "Vendored Stirling-PDF source at $COMMIT"
