#!/usr/bin/env bash
#
# FFPMA Load Test Runner
#
# Wraps the Node.js load test script with sensible defaults.
# Environment variables:
#   LOAD_TEST_URL       - Base URL of the API (default: http://localhost:5000)
#   LOAD_TEST_DURATION  - Duration in seconds per scenario run (default: 10)
#
# Usage:
#   ./tests/load/run-load-tests.sh [--scenario <name>] [--concurrency <n>]
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

export LOAD_TEST_URL="${LOAD_TEST_URL:-http://localhost:5000}"
export LOAD_TEST_DURATION="${LOAD_TEST_DURATION:-10}"

echo ""
echo "======================================================"
echo "  FFPMA API Load Test Runner"
echo "  Target: ${LOAD_TEST_URL}"
echo "  Duration per scenario: ${LOAD_TEST_DURATION}s"
echo "======================================================"
echo ""

# Check if API server is reachable before starting
echo "Checking API availability..."
if curl -sf "${LOAD_TEST_URL}/api/healthz" > /dev/null 2>&1; then
    echo "  API server is reachable. Starting load tests..."
else
    echo "  WARNING: API server not reachable at ${LOAD_TEST_URL}"
    echo "  Load tests will still run but expect high error rates."
    echo "  To run against a live server, set LOAD_TEST_URL and start the API."
    echo ""
fi

node "${SCRIPT_DIR}/load-test.js" "$@"

EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "Load tests completed successfully."
elif [ $EXIT_CODE -eq 2 ]; then
    echo ""
    echo "Load tests completed with CRITICAL issues. See report for details."
    exit $EXIT_CODE
else
    echo ""
    echo "Load tests failed with exit code ${EXIT_CODE}."
    exit $EXIT_CODE
fi
