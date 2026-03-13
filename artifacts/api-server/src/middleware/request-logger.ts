import { Request, Response, NextFunction } from "express";

interface RequestLogEntry {
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

  let capturedJsonResponse: Record<string, any> | undefined;
  const originalResJson = res.json;
  res.json = function (bodyJson: any, ...args: any[]) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    const userId = (req as any).user?.id;
    const requestId = req.requestId;

    let errorContext: string | undefined;
    if (res.statusCode >= 400 && capturedJsonResponse) {
      const errMsg = capturedJsonResponse.error?.message || capturedJsonResponse.error || capturedJsonResponse.message;
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

    const formattedTime = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    let logLine = `${formattedTime} [express] ${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
    if (requestId) logLine += ` [${requestId.substring(0, 8)}]`;
    if (userId) logLine += ` user=${userId.substring(0, 8)}`;

    if (duration > 5000) {
      logLine += ` [SLOW]`;
    }

    if (capturedJsonResponse && res.statusCode >= 400) {
      const jsonStr = JSON.stringify(capturedJsonResponse);
      logLine += ` :: ${jsonStr.length > 200 ? jsonStr.substring(0, 200) + "...[truncated]" : jsonStr}`;
    }

    console.log(logLine);
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
