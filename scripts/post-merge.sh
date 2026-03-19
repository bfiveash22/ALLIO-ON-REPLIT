#!/bin/bash
set -e
pnpm install --no-frozen-lockfile
pnpm --filter @workspace/api-server run db:push
