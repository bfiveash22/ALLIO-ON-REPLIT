import { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

export interface RequestLogEntry {
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  userId?: string;
  requestId?: string;
  errorContext?: string;
  timestamp: string;
}

const recentLogs: RequestLogEntry[] = [];
const MAX_LOG_ENTRIES = 1000;

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const reqPath = req.path;

  if (!reqPath.startsWith("/api")) {
    return next();
  }

  let capturedJsonResponse: Record<string, unknown> | undefined;
  const originalResJson = res.json;
  res.json = function (bodyJson: unknown, ...args: unknown[]) {
    capturedJsonResponse = bodyJson as Record<string, unknown>;
    return originalResJson.apply(res, [bodyJson, ...(args as [])]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    const requestId = req.requestId;

    let errorContext: string | undefined;
    if (res.statusCode >= 400 && capturedJsonResponse) {
      const errMsg =
        (capturedJsonResponse as { error?: { message?: string } | string; message?: string })
          ?.error instanceof Object
          ? ((capturedJsonResponse as { error: { message?: string } }).error.message)
          : (capturedJsonResponse as { error?: string; message?: string })?.error ||
            (capturedJsonResponse as { message?: string })?.message;
      if (errMsg) {
        errorContext = typeof errMsg === "string" ? errMsg.substring(0, 200) : JSON.stringify(errMsg).substring(0, 200);
      }
    }

    const entry: RequestLogEntry = {
      method: req.method,
      path: reqPath,
      statusCode: res.statusCode,
      durationMs: duration,
      userId,
      requestId,
      errorContext,
      timestamp: new Date().toISOString(),
    };

    recentLogs.push(entry);
    if (recentLogs.length > MAX_LOG_ENTRIES) {
      recentLogs.shift();
    }

    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : duration > 5000 ? "warn" : "info";

    logger[level](`${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`, {
      source: "express",
      requestId,
      userId,
      method: req.method,
      path: reqPath,
      statusCode: res.statusCode,
      durationMs: duration,
      slow: duration > 5000 || undefined,
      error: errorContext,
    });
  });

  next();
}

export function getRecentLogs(limit = 100): RequestLogEntry[] {
  return recentLogs.slice(-limit);
}

export function getSlowRequests(thresholdMs = 3000, limit = 50): RequestLogEntry[] {
  return recentLogs
    .filter((entry) => entry.durationMs > thresholdMs)
    .slice(-limit);
}

export function getErrorRequests(limit = 50): RequestLogEntry[] {
  return recentLogs
    .filter((entry) => entry.statusCode >= 400)
    .slice(-limit);
}

export function getErrorRate(logs?: RequestLogEntry[]): number {
  const entries = logs ?? recentLogs;
  if (entries.length === 0) return 0;
  const errors = entries.filter((e) => e.statusCode >= 400).length;
  return Math.round((errors / entries.length) * 10000) / 100;
}

export function getAverageResponseTime(logs?: RequestLogEntry[]): number {
  const entries = logs ?? recentLogs;
  if (entries.length === 0) return 0;
  const total = entries.reduce((sum, e) => sum + e.durationMs, 0);
  return Math.round(total / entries.length);
}
