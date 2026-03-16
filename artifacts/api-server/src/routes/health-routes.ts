import { Express, Request, Response } from "express";
import { pool } from "../db";
import { getRecentLogs, getSlowRequests, getErrorRequests } from "../middleware/request-logger";
import { apiCache } from "../lib/cache";
import { requireAuth, requireRole } from "../working-auth";

const startTime = Date.now();

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

  app.get("/api/health/logs", requireAuth, requireRole("admin", "trustee"), async (req: Request, res: Response) => {
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
