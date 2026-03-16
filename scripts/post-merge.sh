#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm --filter db push

# Install browser-use Python package and CLI for Canva/Rupa agents
if ! which browser-use >/dev/null 2>&1; then
  echo "Installing browser-use and playwright Python packages..."
  SITE_PKG="/home/runner/workspace/.pythonlibs/lib/python3.11/site-packages"
  uv pip install --target "$SITE_PKG" browser-use playwright 2>/dev/null || true
  SITE_BIN="$SITE_PKG/bin"
  PY_BIN="/home/runner/workspace/.pythonlibs/bin"
  for cmd in browser-use browser browseruse bu; do
    if [ -f "$SITE_BIN/$cmd" ] && [ ! -f "$PY_BIN/$cmd" ]; then
      ln -sf "$SITE_BIN/$cmd" "$PY_BIN/$cmd"
    fi
  done
  echo "browser-use CLI installed."
fi

# Install Playwright Chromium browser binary if missing
PLAYWRIGHT_DIR="/home/runner/workspace/.cache/ms-playwright"
if [ ! -d "$PLAYWRIGHT_DIR" ] || [ -z "$(ls -A "$PLAYWRIGHT_DIR" 2>/dev/null)" ]; then
  echo "Installing Playwright Chromium browser..."
  source .agents/skills/browser-use/scripts/setup_env.sh 2>/dev/null || true
  python3 -m playwright install chromium 2>/dev/null || true
  echo "Playwright Chromium installed."
fi
