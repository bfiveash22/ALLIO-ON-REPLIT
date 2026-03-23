# CI/CD Pipeline

## Overview

This project uses GitHub Actions for continuous integration and Replit's deployment system for production deployments.

## CI Status

[![CI](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/ci.yml)

> Replace `YOUR_ORG/YOUR_REPO` with the actual GitHub repository path.

## Workflow: `.github/workflows/ci.yml`

The CI workflow runs on every push and pull request. It has five jobs:

| Job | Description | Triggers on |
|-----|-------------|-------------|
| `typecheck` | TypeScript type checking across all packages | Every push/PR |
| `lint` | ESLint across artifacts, lib, scripts, and tests | Every push/PR |
| `test` | Full vitest test suite | Every push/PR |
| `build` | Build verification (frontend + API) | Every push/PR (after typecheck) |
| `deploy` | Automated production deployment | Push to `main` only |

### Pull Request Checks

All four of `typecheck`, `lint`, `test`, and `build` must pass before a PR can be merged (configure this in GitHub → Settings → Branch protection rules → Require status checks).

### Deploy Job

The deploy job runs only on `main` branch merges and requires all four validation jobs to succeed. It:

1. Runs the pre-deploy validation script (`pnpm run pre-deploy`)
2. Triggers Replit's deployment webhook

## ESLint Configuration

ESLint is configured in `eslint.config.js` (ESLint v9 flat config format).

- **API server** (`artifacts/api-server/**`): Node.js environment
- **Frontend apps** (`artifacts/ffpma/**`, `artifacts/doctor-pitch-deck/**`, etc.): Browser + React environment
- **Shared libs** (`lib/**`): Node + Browser environment
- **Scripts** (`scripts/**`): Node.js environment
- **Tests** (`tests/**`): Node.js + vitest globals

Run lint locally:
```bash
pnpm run lint
pnpm run lint:fix   # auto-fix fixable issues
```

## Pre-Deploy Validation

The pre-deploy script (`scripts/pre-deploy.ts`) validates:

1. **Environment variables** — checks required vars (`DATABASE_URL`, `SESSION_SECRET`) and warns about optional ones
2. **Database connectivity** — TCP connection test to the configured PostgreSQL host
3. **Critical endpoints** — HTTP health check on `/api/health`

Run it manually:
```bash
pnpm run pre-deploy
```

## Required GitHub Secrets

Configure these in GitHub → Settings → Secrets and variables → Actions:

| Secret | Description |
|--------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Express session secret (min 32 chars recommended) |
| `REPLIT_DEPLOY_TOKEN` | Replit API token for triggering deployments |
| `REPLIT_DEPLOY_WEBHOOK_URL` | Replit deployment webhook URL |
| `API_BASE_URL` | Base URL of the deployed API (for endpoint checks) |

## Local Development

```bash
# Type checking
pnpm run typecheck

# Linting
pnpm run lint

# Tests
pnpm run test

# Full build
pnpm run build

# Pre-deploy validation
pnpm run pre-deploy
```
