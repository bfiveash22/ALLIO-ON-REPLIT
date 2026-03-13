import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import path from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { pool as dbPool } from "./db";
import { startScheduler, stopScheduler } from "./services/scheduler";
import { startAgentScheduler, stopAgentScheduler, seedInitialTasks } from "./services/agent-scheduler";
import { sentinel } from "./services/sentinel";

// CRASH MONITORING: Prevent unhandled rejections/exceptions from taking down PM2
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 UNHANDLED PROMISE REJECTION:', reason);
  // Do not crash the app, just log it. Sentinel could be notified here.
  try {
    const s = sentinel as any;
    if (s && typeof s.createNotification === 'function') {
      s.createNotification('system', 'System Monitor', `CRITICAL UNHANDLED REJECTION: ${String(reason)}`).catch(console.error);
    }
  } catch (e) {
    // Ignore alert failures to prevent cascade loops
  }
});

process.on('uncaughtException', (error) => {
  console.error('🚨 UNCAUGHT EXCEPTION:', error);
  try {
    const s = sentinel as any;
    if (s && typeof s.createNotification === 'function') {
      s.createNotification('system', 'System Monitor', `CRITICAL UNCAUGHT EXCEPTION: ${error.message}`).catch(console.error);
    }
  } catch (e) {
    // Ignore alert failures
  }
  // Let it crash on uncaught sync exceptions to avoid unstable memory states, 
  // but we logged it first! Unhandled rejections (above) will not crash the app.
});

const app = express();

// Security Middleware: Helmet sets various HTTP headers to secure the app
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      connectSrc: ["'self'", "https:", "ws:", "wss:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

app.use((_req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  next();
});

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

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const pollingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
});

app.use('/api/agent-network', pollingLimiter);
app.use('/api/sentinel', pollingLimiter);
app.use('/api/agent-tasks', pollingLimiter);
app.use('/api/agents', pollingLimiter);
app.use('/api/profile', pollingLimiter);
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);

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
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
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
  // Startup data integrity cleanup: remove orphaned member_profiles
  // These are profiles pointing to user IDs that no longer exist in the users table.
  // This happened when the DB was copied from dev to production, leaving ghost profiles
  // that inflate member/doctor counts (e.g. showing 2,181 instead of 1,107).
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

  // Health check endpoint
  app.get('/api/health', async (_req: Request, res: Response) => {
    try {
      const result = await dbPool.query('SELECT 1 AS ok');
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: result.rows?.[0]?.ok === 1 ? 'connected' : 'error',
      });
    } catch (err: any) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: process.env.NODE_ENV === 'production' ? 'Database connection failed' : err.message,
      });
    }
  });

  // Serve generated images from attached_assets/generated_images
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

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const timestamp = new Date().toISOString();
    log(`[${timestamp}] ERROR ${status}: ${err.message}\n${err.stack || ''}`, 'error-handler');
    if (res.headersSent) return;
    const safeMessage = status < 500 ? (err.message || 'Request error') : 'Internal Server Error';
    res.status(status).json({ message: safeMessage, timestamp });
  });

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port ${port}`);

      // Start ATHENA's 6-hour report scheduler
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

  process.on('unhandledRejection', (reason, promise) => {
    log(`Unhandled Rejection: ${reason}`, 'error');
  });

  process.on('uncaughtException', (error) => {
    log(`Uncaught Exception: ${error.message}`, 'error');
    gracefulShutdown('uncaughtException');
  });
})();
