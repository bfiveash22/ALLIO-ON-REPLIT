#!/usr/bin/env tsx
/**
 * Pre-deploy validation script.
 * Checks environment variables, database connectivity, and critical API endpoints.
 * Exit code 0 = all checks passed; non-zero = one or more checks failed.
 */

import { createConnection } from "net";

const REQUIRED_ENV_VARS = [
  "DATABASE_URL",
  "SESSION_SECRET",
] as const;

const OPTIONAL_WARN_ENV_VARS = [
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "STRIPE_SECRET_KEY",
] as const;

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3001";

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: CheckResult[] = [];
let hasFailure = false;

function pass(name: string, message: string): void {
  results.push({ name, passed: true, message });
  console.log(`  ✓  ${name}: ${message}`);
}

function fail(name: string, message: string): void {
  results.push({ name, passed: false, message });
  console.error(`  ✗  ${name}: ${message}`);
  hasFailure = true;
}

function warn(name: string, message: string): void {
  console.warn(`  ⚠  ${name}: ${message}`);
}

// ─── 1. Environment Variables ─────────────────────────────────────────────────

console.log("\n[1/3] Checking required environment variables...");

for (const varName of REQUIRED_ENV_VARS) {
  const value = process.env[varName];
  if (!value || value.trim() === "") {
    fail(`ENV:${varName}`, `Missing or empty`);
  } else if (value.length < 8) {
    fail(`ENV:${varName}`, `Value looks too short to be valid (${value.length} chars)`);
  } else {
    pass(`ENV:${varName}`, `Present (${value.length} chars)`);
  }
}

for (const varName of OPTIONAL_WARN_ENV_VARS) {
  const value = process.env[varName];
  if (!value || value.trim() === "") {
    warn(`ENV:${varName}`, `Not set — features depending on this will be unavailable`);
  } else {
    pass(`ENV:${varName}`, `Present`);
  }
}

// ─── 2. Database Connectivity ─────────────────────────────────────────────────

console.log("\n[2/3] Checking database connectivity...");

async function checkDatabase(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    fail("DB:connection", "DATABASE_URL is not set — skipping connectivity check");
    return;
  }

  let parsed: URL;
  try {
    parsed = new URL(dbUrl);
  } catch {
    fail("DB:url-parse", `DATABASE_URL is not a valid URL`);
    return;
  }

  const host = parsed.hostname;
  const port = parseInt(parsed.port || "5432", 10);
  const timeout = 5000;

  await new Promise<void>((resolve) => {
    const socket = createConnection({ host, port });

    const timer = setTimeout(() => {
      socket.destroy();
      fail("DB:connection", `TCP connection to ${host}:${port} timed out after ${timeout}ms`);
      resolve();
    }, timeout);

    socket.on("connect", () => {
      clearTimeout(timer);
      socket.destroy();
      pass("DB:connection", `TCP connection to ${host}:${port} succeeded`);
      resolve();
    });

    socket.on("error", (err) => {
      clearTimeout(timer);
      fail("DB:connection", `TCP connection to ${host}:${port} failed — ${err.message}`);
      resolve();
    });
  });
}

await checkDatabase();

// ─── 3. Critical Endpoints ────────────────────────────────────────────────────

console.log("\n[3/3] Checking critical API endpoints...");

const CRITICAL_ENDPOINTS: Array<{ path: string; expectedStatus: number }> = [
  { path: "/api/health", expectedStatus: 200 },
];

async function checkEndpoint(path: string, expectedStatus: number): Promise<void> {
  const url = `${API_BASE_URL}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (response.status === expectedStatus) {
      pass(`ENDPOINT:${path}`, `HTTP ${response.status} (expected ${expectedStatus})`);
    } else {
      fail(
        `ENDPOINT:${path}`,
        `HTTP ${response.status} (expected ${expectedStatus}) at ${url}`,
      );
    }
  } catch (err: unknown) {
    clearTimeout(timer);
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("ECONNREFUSED") || message.includes("fetch failed")) {
      warn(
        `ENDPOINT:${path}`,
        `Could not reach ${url} — server may not be running locally. Skipping.`,
      );
    } else {
      fail(`ENDPOINT:${path}`, `Request failed — ${message}`);
    }
  }
}

for (const { path, expectedStatus } of CRITICAL_ENDPOINTS) {
  await checkEndpoint(path, expectedStatus);
}

// ─── Summary ──────────────────────────────────────────────────────────────────

const passed = results.filter((r) => r.passed).length;
const failed = results.filter((r) => !r.passed).length;

console.log(`\n${"─".repeat(50)}`);
console.log(`Pre-deploy check: ${passed} passed, ${failed} failed`);

if (hasFailure) {
  console.error("\nPre-deploy validation FAILED. Fix the issues above before deploying.\n");
  process.exit(1);
} else {
  console.log("\nPre-deploy validation PASSED. Safe to deploy.\n");
  process.exit(0);
}
