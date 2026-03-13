import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { createServer } from "http";
import path from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { startScheduler, stopScheduler } from "./services/scheduler";
import { startAgentScheduler, stopAgentScheduler, seedInitialTasks } from "./services/agent-scheduler";
import { sentinel } from "./services/sentinel";

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED PROMISE REJECTION:', reason);
  try {
    const s = sentinel as any;
    if (s && typeof s.createNotification === 'function') {
      s.createNotification('system', 'System Monitor', `CRITICAL UNHANDLED REJECTION: ${String(reason)}`).catch(console.error);
    }
  } catch (e) {}
});

process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION:', error);
  try {
    const s = sentinel as any;
    if (s && typeof s.createNotification === 'function') {
      s.createNotification('system', 'System Monitor', `CRITICAL UNCAUGHT EXCEPTION: ${error.message}`).catch(console.error);
    }
  } catch (e) {}
});

const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.set("trust proxy", 1);
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  skip: (req) => {
    const excludedPrefixes = [
      '/api/agent-network',
      '/api/sentinel',
      '/api/agent-tasks',
      '/api/agents',
      '/api/auth',
      '/api/profile',
      '/api/admin'
    ];
    return excludedPrefixes.some(prefix => req.path.startsWith(prefix));
  }
});

app.use('/api/', apiLimiter);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (reqPath.startsWith("/api")) {
      let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        const jsonStr = JSON.stringify(capturedJsonResponse);
        logLine += ` :: ${jsonStr.length > 500 ? jsonStr.substring(0, 500) + '...[truncated]' : jsonStr}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    const { db } = await import('./db');
    const { memberProfiles } = await import('@shared/schema');
    const { users } = await import('@shared/models/auth');
    const { sql: sqlRaw } = await import('drizzle-orm');

    const deleted = await db.execute(
      sqlRaw`DELETE FROM member_profiles WHERE user_id NOT IN (SELECT id FROM users)`
    );
    const count = (deleted as any).rowCount ?? 0;
    if (count > 0) {
      log(`[startup] Removed ${count} orphaned member_profiles`, 'cleanup');
    } else {
      log('[startup] No orphaned member_profiles found', 'cleanup');
    }
  } catch (err: any) {
    log(`[startup] Orphan cleanup failed (non-fatal): ${err.message}`, 'cleanup');
  }

  await registerRoutes(httpServer, app);

  app.use('/generated', express.static(path.join(process.cwd(), 'attached_assets', 'generated_images')));

  app.use('/downloads', express.static(path.join(process.cwd(), 'public'), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.pdf')) {
        res.setHeader('Content-Type', 'application/pdf');
      }
    }
  }));

  app.get('/api/download/agent-guide', (_req, res) => {
    const filePath = path.join(process.cwd(), 'public', 'ALLIO_Agent_Network_Guide.pdf');
    res.download(filePath, 'ALLIO_Agent_Network_Guide.pdf');
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    log(`Error: ${message} (${status})`, 'error');
    res.status(status).json({ message });
  });

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port ${port}`);

      if (process.env.ENABLE_SCHEDULERS === "true") {
        log('Starting background schedulers...', 'startup');
        startScheduler();

        seedInitialTasks().then(result => {
          if (result.created > 0) {
            log(`Seeded ${result.created} initial agent tasks`, 'startup');
          }
          startAgentScheduler();
        });
      } else {
        log('Background schedulers are disabled (ENABLE_SCHEDULERS != true)', 'startup');
      }
    },
  );

  function gracefulShutdown(signal: string) {
    log(`Received ${signal}. Shutting down gracefully...`, 'system');
    stopAgentScheduler();
    stopScheduler();
    httpServer.close(() => {
      log('HTTP server closed', 'system');
      process.exit(0);
    });
    setTimeout(() => {
      log('Forcing shutdown after timeout', 'system');
      process.exit(1);
    }, 5000);
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
})();
