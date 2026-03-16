#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm --filter db push

# Install browser-use Python package and CLI for Canva/Rupa agents
if ! which browser-use >/dev/null 2>&1; then
  echo "Installing browser-use Python package..."
  uv pip install --target /home/runner/workspace/.pythonlibs/lib/python3.11/site-packages browser-use 2>/dev/null || true
  SITE_BIN="/home/runner/workspace/.pythonlibs/lib/python3.11/site-packages/bin"
  PY_BIN="/home/runner/workspace/.pythonlibs/bin"
  for cmd in browser-use browser browseruse bu; do
    if [ -f "$SITE_BIN/$cmd" ] && [ ! -f "$PY_BIN/$cmd" ]; then
      ln -sf "$SITE_BIN/$cmd" "$PY_BIN/$cmd"
    fi
  done
  echo "browser-use installed."
fi
