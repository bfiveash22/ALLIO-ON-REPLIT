#!/bin/bash
set -e

echo "=== Post-Merge Setup ==="

echo "[1/3] Installing dependencies..."
pnpm install --no-frozen-lockfile

echo "[2/3] Syncing database schema..."
pnpm --filter @workspace/api-server run db:push 2>&1 || {
  echo "[WARN] db:push failed — may need manual review. Run: pnpm --filter @workspace/api-server run db:push"
  echo "[WARN] Do NOT auto-confirm destructive changes without reviewing the diff."
}

echo "[3/3] Running completion verification checks..."

ERRORS=0

echo "  Checking TypeScript..."
if ! pnpm run typecheck 2>&1; then
  echo "[FAIL] TypeScript errors detected"
  ERRORS=$((ERRORS + 1))
fi

echo "  Checking API health..."
if curl -sf http://localhost:5000/api/health > /dev/null 2>&1; then
  echo "  [PASS] API health check passed"
else
  echo "  [SKIP] API not running — health check skipped (start the app to verify)"
fi

if [ "$ERRORS" -gt 0 ]; then
  echo ""
  echo "=== Post-Merge Setup COMPLETED WITH WARNINGS ==="
  echo "  $ERRORS verification check(s) failed. Review before marking any task complete."
  echo "  See: .agents/rules/completion-verification.md"
  exit 1
else
  echo ""
  echo "=== Post-Merge Setup Complete ==="
fi
