import { Express, Request, Response } from "express";
import { pool } from "../db";
import { getRecentLogs, getSlowRequests, getErrorRequests, getErrorRate, getAverageResponseTime } from "../middleware/request-logger";
import { apiCache } from "../lib/cache";
import { requireAuth, requireRole } from "../working-auth";
import { getAllCircuitBreakerStats, circuitBreakers } from "../lib/circuit-breaker";
import { getAllOutboundLimiterStats } from "../lib/rate-limiter";
import { logger } from "../lib/logger";

const startTime = Date.now();

interface DependencyCheckResult {
  name: string;
  status: "pass" | "fail" | "degraded" | "unconfigured";
  latencyMs?: number;
  error?: string;
  details?: DatabasePoolDetails;
}

interface DatabasePoolDetails {
  total: number;
  idle: number;
  waiting: number;
}

async function checkDatabase(): Promise<DependencyCheckResult> {
  const start = Date.now();
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    const details: DatabasePoolDetails = {
      total: pool.totalCount,
      idle: pool.idleCount,
      waiting: pool.waitingCount,
    };
    return {
      name: "database",
      status: "pass",
      latencyMs: Date.now() - start,
      details,
    };
  } catch (err: unknown) {
    return {
      name: "database",
      status: "fail",
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function checkStripe(): Promise<DependencyCheckResult> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return { name: "stripe", status: "unconfigured", error: "STRIPE_SECRET_KEY not set" };
  }

  const start = Date.now();
  try {
    await circuitBreakers.stripe.call(async () => {
      const response = await fetch("https://api.stripe.com/v1/balance", {
        headers: { Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({})) as { error?: { message?: string } };
        throw new Error(body?.error?.message || `HTTP ${response.status}`);
      }
    });
    return { name: "stripe", status: "pass", latencyMs: Date.now() - start };
  } catch (err: unknown) {
    return { name: "stripe", status: "fail", latencyMs: Date.now() - start, error: err instanceof Error ? err.message : String(err) };
  }
}

async function checkWooCommerce(): Promise<DependencyCheckResult> {
  const url = process.env.WOOCOMMERCE_URL;
  const key = process.env.WOOCOMMERCE_CONSUMER_KEY || process.env.WC_CONSUMER_KEY;
  const secret = process.env.WOOCOMMERCE_CONSUMER_SECRET || process.env.WC_CONSUMER_SECRET;
  if (!url || !key || !secret) {
    return { name: "woocommerce", status: "unconfigured", error: "WOOCOMMERCE_URL / WOOCOMMERCE_CONSUMER_KEY / WOOCOMMERCE_CONSUMER_SECRET not fully set" };
  }

  const start = Date.now();
  try {
    await circuitBreakers.woocommerce.call(async () => {
      const response = await fetch(`${url}/wp-json/wc/v3/system_status`, {
        headers: {
          Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`,
        },
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    });
    return { name: "woocommerce", status: "pass", latencyMs: Date.now() - start };
  } catch (err: unknown) {
    return { name: "woocommerce", status: "fail", latencyMs: Date.now() - start, error: err instanceof Error ? err.message : String(err) };
  }
}

async function checkSignNow(): Promise<DependencyCheckResult> {
  const clientId = process.env.SIGNNOW_CLIENT_ID;
  const clientSecret = process.env.SIGNNOW_CLIENT_SECRET || process.env.SIGNNOW_SECRET_KEY;
  const username = process.env.SIGNNOW_USERNAME || process.env.SIGNNOW_EMAIL;
  const password = process.env.SIGNNOW_PASSWORD;
  if (!clientId || !clientSecret) {
    return { name: "signnow", status: "unconfigured", error: "SIGNNOW_CLIENT_ID / SIGNNOW_CLIENT_SECRET not set" };
  }

  const start = Date.now();
  try {
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    await circuitBreakers.signnow.call(async () => {
      const response = await fetch("https://api.signnow.com/oauth2/token", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "password",
          username: username || "",
          password: password || "",
          scope: "*",
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok && response.status !== 400) {
        throw new Error(`HTTP ${response.status}`);
      }
      if (response.status === 400) {
        const degraded: DependencyCheckResult = {
          name: "signnow",
          status: "degraded",
          latencyMs: Date.now() - start,
          error: "API reachable but auth failed — check SIGNNOW_USERNAME / SIGNNOW_PASSWORD",
        };
        throw Object.assign(new Error("degraded"), { degraded });
      }
    });
    return { name: "signnow", status: "pass", latencyMs: Date.now() - start };
  } catch (err: unknown) {
    if (err instanceof Error && "degraded" in err) {
      return (err as Error & { degraded: DependencyCheckResult }).degraded;
    }
    return { name: "signnow", status: "fail", latencyMs: Date.now() - start, error: err instanceof Error ? err.message : String(err) };
  }
}

async function checkGoogleDrive(): Promise<DependencyCheckResult> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return { name: "google_drive", status: "unconfigured", error: "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN not fully set" };
  }

  if (refreshToken === "dummy-local-token") {
    return { name: "google_drive", status: "unconfigured", error: "GOOGLE_REFRESH_TOKEN is a placeholder — set a real token" };
  }

  const start = Date.now();
  try {
    await circuitBreakers.googledrive.call(async () => {
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (!tokenResponse.ok) {
        throw new Error(`Token refresh failed: HTTP ${tokenResponse.status}`);
      }
      const tokenData = await tokenResponse.json() as { access_token?: string };
      if (!tokenData.access_token) {
        throw new Error("No access_token in token refresh response");
      }
    });
    return { name: "google_drive", status: "pass", latencyMs: Date.now() - start };
  } catch (err: unknown) {
    return { name: "google_drive", status: "fail", latencyMs: Date.now() - start, error: err instanceof Error ? err.message : String(err) };
  }
}

export function registerHealthRoutes(app: Express): void {
  app.get("/api/healthz", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  app.get("/api/health", async (_req: Request, res: Response) => {
    let dbStatus: "connected" | "disconnected" = "disconnected";
    try {
      const client = await pool.connect();
      await client.query("SELECT 1");
      client.release();
      dbStatus = "connected";
    } catch {
      dbStatus = "disconnected";
    }

    res.json({
      status: dbStatus === "connected" ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/health/details", requireAuth, requireRole("admin", "trustee"), async (_req: Request, res: Response) => {
    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
    const memUsage = process.memoryUsage();

    let dbStatus: "connected" | "disconnected" = "disconnected";
    let dbLatencyMs: number | null = null;
    let poolStats = { total: 0, idle: 0, waiting: 0 };

    try {
      const dbStart = Date.now();
      const client = await pool.connect();
      await client.query("SELECT 1");
      client.release();
      dbLatencyMs = Date.now() - dbStart;
      dbStatus = "connected";
      poolStats = {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount,
      };
    } catch {
      dbStatus = "disconnected";
    }

    res.json({
      status: dbStatus === "connected" ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: uptimeSeconds,
        formatted: formatUptime(uptimeSeconds),
      },
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        pool: poolStats,
      },
      memory: {
        rss: formatBytes(memUsage.rss),
        heapUsed: formatBytes(memUsage.heapUsed),
        heapTotal: formatBytes(memUsage.heapTotal),
        external: formatBytes(memUsage.external),
      },
      cache: apiCache.stats(),
      node: {
        version: process.version,
        pid: process.pid,
      },
    });
  });

  app.get("/api/health/deep", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
    const memUsage = process.memoryUsage();
    const requestId = req.requestId;

    logger.info("Deep health check initiated", { source: "health", requestId });

    const [dbResult, stripeResult, wooResult, signnowResult, driveResult] = await Promise.allSettled([
      checkDatabase(),
      checkStripe(),
      checkWooCommerce(),
      checkSignNow(),
      checkGoogleDrive(),
    ]);

    const deps: DependencyCheckResult[] = [
      dbResult.status === "fulfilled" ? dbResult.value : { name: "database", status: "fail", error: String((dbResult as PromiseRejectedResult).reason) },
      stripeResult.status === "fulfilled" ? stripeResult.value : { name: "stripe", status: "fail", error: String((stripeResult as PromiseRejectedResult).reason) },
      wooResult.status === "fulfilled" ? wooResult.value : { name: "woocommerce", status: "fail", error: String((wooResult as PromiseRejectedResult).reason) },
      signnowResult.status === "fulfilled" ? signnowResult.value : { name: "signnow", status: "fail", error: String((signnowResult as PromiseRejectedResult).reason) },
      driveResult.status === "fulfilled" ? driveResult.value : { name: "google_drive", status: "fail", error: String((driveResult as PromiseRejectedResult).reason) },
    ];

    const criticalFailed = deps.filter(d => d.name === "database").some(d => d.status === "fail");
    const anyFailed = deps.some(d => d.status === "fail");

    let overallStatus: "healthy" | "degraded" | "critical";
    if (criticalFailed) {
      overallStatus = "critical";
    } else if (anyFailed) {
      overallStatus = "degraded";
    } else {
      overallStatus = "healthy";
    }

    const recentLogs = getRecentLogs(200);
    const errorRate = getErrorRate(recentLogs);
    const avgResponseTime = getAverageResponseTime(recentLogs);

    logger.info("Deep health check complete", {
      source: "health",
      requestId,
      overallStatus,
      failedDeps: deps.filter(d => d.status === "fail").map(d => d.name),
    });

    res.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: uptimeSeconds,
        formatted: formatUptime(uptimeSeconds),
      },
      dependencies: deps,
      circuitBreakers: getAllCircuitBreakerStats(),
      metrics: {
        errorRatePercent: errorRate,
        avgResponseTimeMs: avgResponseTime,
        recentRequestCount: recentLogs.length,
      },
      memory: {
        rssBytes: memUsage.rss,
        heapUsedBytes: memUsage.heapUsed,
        heapTotalBytes: memUsage.heapTotal,
        rss: formatBytes(memUsage.rss),
        heapUsed: formatBytes(memUsage.heapUsed),
        heapTotal: formatBytes(memUsage.heapTotal),
      },
      database: {
        pool: deps[0].details ?? {},
        latencyMs: deps[0].latencyMs,
      },
      node: {
        version: process.version,
        pid: process.pid,
        platform: process.platform,
      },
    });
  });

  app.get("/api/health/logs", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 100;
    const type = req.query.type as string;

    if (type === "slow") {
      const threshold = parseInt(req.query.threshold as string) || 3000;
      res.json({ logs: getSlowRequests(threshold, limit) });
      return;
    }
    if (type === "errors") {
      res.json({ logs: getErrorRequests(limit) });
      return;
    }
    res.json({ logs: getRecentLogs(limit) });
  });

  app.get("/api/health/circuit-breakers", requireAuth, requireRole("admin"), (_req: Request, res: Response) => {
    res.json({
      circuitBreakers: getAllCircuitBreakerStats(),
      outboundLimiters: getAllOutboundLimiterStats(),
    });
  });
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);
  return parts.join(" ");
}

function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}
