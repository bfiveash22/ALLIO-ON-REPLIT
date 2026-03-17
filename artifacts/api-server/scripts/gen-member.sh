#!/bin/bash
MEMBER="${1:-Annette}"
LOG_FILE="/home/runner/workspace/gen-${MEMBER,,}.log"
cd /home/runner/workspace/artifacts/api-server
echo "[$(date)] Starting generation for $MEMBER" > "$LOG_FILE"
npx tsx scripts/generate-all-protocols.ts "$MEMBER" >> "$LOG_FILE" 2>&1
echo "[$(date)] Generation complete (exit code: $?)" >> "$LOG_FILE"
