#!/bin/bash
set -e

echo "=== Post-Merge Setup ==="

echo "[1/4] Installing dependencies..."
pnpm install --no-frozen-lockfile

echo "[2/4] Syncing database schema..."
pnpm --filter @workspace/api-server run db:push 2>&1 || {
  echo "[WARN] db:push failed — may need manual review. Run: pnpm --filter @workspace/api-server run db:push"
  echo "[WARN] Do NOT auto-confirm destructive changes without reviewing the diff."
}

echo "[3/4] Running completion verification checks..."

ERRORS=0

echo "  Checking TypeScript..."
if ! pnpm run typecheck 2>&1; then
  echo "  [FAIL] TypeScript errors detected"
  ERRORS=$((ERRORS + 1))
fi

echo "[4/4] Running API endpoint verification..."

API_RUNNING=false
if curl -sf http://localhost:5000/api/health > /dev/null 2>&1; then
  API_RUNNING=true
  echo "  [PASS] API is running"
else
  echo "  [FAIL] API is not running — start the app and re-run verification"
  echo "         Run: PORT=5000 pnpm --filter @workspace/api-server run dev &"
  ERRORS=$((ERRORS + 1))
fi

if [ "$API_RUNNING" = true ]; then
  API_ERRORS=0
  
  check_endpoint() {
    local path=$1
    local expected=$2
    local status
    status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5000${path}" 2>/dev/null)
    if [ "$status" = "$expected" ]; then
      echo "    [PASS] ${path}: ${status}"
    else
      echo "    [FAIL] ${path}: ${status} (expected ${expected})"
      API_ERRORS=$((API_ERRORS + 1))
    fi
  }

  check_endpoint "/api/health" "200"
  check_endpoint "/api/health/details" "401"
  check_endpoint "/api/catalog" "200"
  check_endpoint "/api/products" "200"
  check_endpoint "/api/categories" "200"
  check_endpoint "/api/programs" "200"
  check_endpoint "/api/training/modules" "200"
  check_endpoint "/api/frequencies" "200"
  check_endpoint "/api/canva/status" "200"
  check_endpoint "/api/orders" "401"
  check_endpoint "/api/admin/members" "401"
  check_endpoint "/api/admin/contracts" "401"
  check_endpoint "/api/chat/rooms" "401"
  check_endpoint "/api/library" "401"

  if [ "$API_ERRORS" -gt 0 ]; then
    echo "  [FAIL] $API_ERRORS endpoint(s) returned unexpected status codes"
    ERRORS=$((ERRORS + API_ERRORS))
  else
    echo "  [PASS] All critical endpoints responding correctly"
  fi
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
