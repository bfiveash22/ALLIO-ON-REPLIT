import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import path from "path";
import helmet from "helmet";
import { exec } from "child_process";
import { promisify } from "util";

const execStartup = promisify(exec);

(async function setupBrowserEnv() {
  try {
    const { stdout } = await execStartup("nix-build '<nixpkgs>' -A libgbm --no-out-link 2>/dev/null", { timeout: 30000 });
    const libgbmLib = stdout.trim() + '/lib';
    process.env.LD_LIBRARY_PATH = libgbmLib + (process.env.LD_LIBRARY_PATH ? ':' + process.env.LD_LIBRARY_PATH : '');
  } catch {}
  if (!process.env.PLAYWRIGHT_BROWSERS_PATH || process.env.PLAYWRIGHT_BROWSERS_PATH === '0') {
    process.env.PLAYWRIGHT_BROWSERS_PATH = '/home/runner/workspace/.cache/ms-playwright';
  }
})();
import { startScheduler, stopScheduler } from "./services/scheduler";
import { startAgentScheduler, stopAgentScheduler, seedInitialTasks } from "./services/agent-scheduler";
import { sentinel } from "./services/sentinel";
import { requestIdMiddleware } from "./lib/request-id";
import { requestLogger } from "./middleware/request-logger";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { registerHealthRoutes } from "./routes/health-routes";
import { authRateLimiter, writeRateLimiter, readRateLimiter, agentRateLimiter, webhookRateLimiter } from "./middleware/rate-limiter";

declare global {
  namespace Express {
    interface User {
      id: string;
      email?: string;
      wpRoles?: string[];
      firstName?: string;
      lastName?: string;
      wpUserId?: string;
    }
  }
}

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

app.use(requestIdMiddleware);

app.use('/api/auth', authRateLimiter);
app.use('/api/woocommerce/webhook', webhookRateLimiter);
app.use('/api/signnow/webhook', webhookRateLimiter);
app.use('/api/agent-network', agentRateLimiter);
app.use('/api/sentinel', agentRateLimiter);
app.use('/api/agent-tasks', agentRateLimiter);
app.use('/api/agents', agentRateLimiter);
app.use('/api/intake', writeRateLimiter);
app.use('/api/checkout', writeRateLimiter);
app.use('/api/openclaw/webhook', webhookRateLimiter);
app.use('/api/openclaw', agentRateLimiter);
app.use('/api/payments/webhook', webhookRateLimiter);
app.use('/api/payments', writeRateLimiter);
app.use('/api/onboarding', writeRateLimiter);
app.use('/api/protocol-assembly', writeRateLimiter);
app.use('/api/admin', writeRateLimiter);
app.use('/api/training', readRateLimiter);
app.use('/api/catalog', readRateLimiter);
app.use('/api/programs', readRateLimiter);
app.use('/api/doctor', readRateLimiter);
app.use('/api/settings', writeRateLimiter);
app.use('/api/enrollment', writeRateLimiter);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use(requestLogger);

registerHealthRoutes(app);

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

  const { setupWorkingAuth } = await import("./working-auth");
  await setupWorkingAuth(app);

  const { registerSentinelRoutes } = await import("./sentinel-routes");
  registerSentinelRoutes(app);

  const { registerOpenClawRoutes } = await import("./openclaw-routes");
  registerOpenClawRoutes(app);

  const { registerLearningRoutes } = await import("./learning-routes");
  registerLearningRoutes(app);

  const { registerDianeRoutes } = await import("./services/diane-ai");
  registerDianeRoutes(app);

  const { registerProtocolBuilderRoutes } = await import("./services/protocol-builder");
  registerProtocolBuilderRoutes(app);

  const { registerPeptideConsoleRoutes } = await import("./services/peptide-console");
  registerPeptideConsoleRoutes(app);

  const { auditLog } = await import("./middleware/auth");
  app.use("/api/settings", auditLog());
  app.use("/api/sentinel", auditLog());
  app.use("/api/athena", auditLog());

  const { registerTrainingRoutes } = await import("./routes/training-routes");
  registerTrainingRoutes(app);
  const { registerMemberRoutes } = await import("./routes/member-routes");
  registerMemberRoutes(app);
  const { registerDoctorRoutes } = await import("./routes/doctor-routes");
  registerDoctorRoutes(app);
  const { registerSettingsRoutes } = await import("./routes/settings-routes");
  registerSettingsRoutes(app);
  const { registerMediaRoutes } = await import("./routes/media-routes");
  registerMediaRoutes(app);
  const { registerContractRoutes } = await import("./routes/contract-routes");
  registerContractRoutes(app);
  const { registerWooCommerceRoutes } = await import("./routes/woocommerce-routes");
  registerWooCommerceRoutes(app);
  const { registerOnboardingRoutes } = await import("./routes/onboarding-routes");
  registerOnboardingRoutes(app);
  const { registerAgentRoutes } = await import("./routes/agent-routes");
  registerAgentRoutes(app);
  const { registerAthenaRoutes } = await import("./routes/athena-routes");
  registerAthenaRoutes(app);
  const { registerDriveRoutes } = await import("./routes/drive-routes");
  registerDriveRoutes(app);
  const { registerBloodResearchRoutes } = await import("./routes/blood-research-routes");
  registerBloodResearchRoutes(app);
  const { registerBloodworkRoutes } = await import("./routes/bloodwork-routes");
  registerBloodworkRoutes(app);
  const { registerPaymentRoutes } = await import("./routes/payment-routes");
  registerPaymentRoutes(app);
  const { registerAdminRoutes } = await import("./routes/admin-routes");
  registerAdminRoutes(app);
  const { registerLibraryRoutes } = await import("./routes/library-routes");
  registerLibraryRoutes(app);
  const { registerMiscRoutes } = await import("./routes/misc-routes");
  registerMiscRoutes(app);
  const { registerFrequencyRoutes } = await import("./routes/frequency-routes");
  registerFrequencyRoutes(app);
  const { registerProtocolAssemblyRoutes } = await import("./routes/protocol-assembly-routes");
  await registerProtocolAssemblyRoutes(app);
  const { registerVitalityRoutes } = await import("./routes/vitality-routes");
  registerVitalityRoutes(app);
  const { registerAutomationRoutes } = await import("./routes/automation-routes");
  registerAutomationRoutes(app);

  try {
    const { seedDatabase } = await import('./seed');
    await seedDatabase();
    log('[startup] Base database seeding complete', 'seed');
  } catch (err: any) {
    log(`[startup] Base seed failed (non-fatal): ${err.message}`, 'seed');
  }

  const seedSteps: Array<{ name: string; fn: () => Promise<any> }> = [
    { name: 'ECS Training', fn: async () => { const { seedECSTraining } = await import('./seeds/ecs-training-seed'); return seedECSTraining(); } },
    { name: 'PMA Law Training', fn: async () => { const { seedPMALawTraining } = await import('./seeds/pma-law-training-seed'); return seedPMALawTraining(); } },
    { name: 'Peptide Training', fn: async () => { const { seedPeptideTraining } = await import('./seeds/peptide-training-seed'); return seedPeptideTraining(false); } },
    { name: 'Ozone Training', fn: async () => { const { seedOzoneTraining } = await import('./seeds/ozone-training-seed'); return seedOzoneTraining(false); } },
    { name: 'Diet-Cancer Training', fn: async () => { const { seedDietCancerTraining } = await import('./seeds/diet-cancer-training-seed'); return seedDietCancerTraining(false); } },
    { name: 'Ivermectin Training', fn: async () => { const { seedIvermectinTraining } = await import('./seeds/ivermectin-training-seed'); return seedIvermectinTraining(); } },
    { name: 'Frequency Medicine', fn: async () => { const { seedFrequencyMedicineTraining } = await import('./seeds/frequency-medicine-training-seed'); return seedFrequencyMedicineTraining(); } },
    { name: 'Peptide Protocols 101', fn: async () => { const { seedPeptideProtocols101 } = await import('./seeds/peptide-protocols-101-seed'); return seedPeptideProtocols101(); } },
    { name: 'Programs', fn: async () => { const { seedPrograms } = await import('./seeds/programs-seed'); return seedPrograms(); } },
    { name: 'Agent Registry', fn: async () => { const { seedAgentRegistry } = await import('./seeds/agent-registry-seed'); return seedAgentRegistry(); } },
  ];

  let seedSuccessCount = 0;
  for (const step of seedSteps) {
    try {
      await step.fn();
      seedSuccessCount++;
    } catch (err: any) {
      log(`[startup] ${step.name} seed failed (non-fatal): ${err.message}`, 'seed');
    }
  }
  log(`[startup] Training content seeding complete: ${seedSuccessCount}/${seedSteps.length} succeeded`, 'seed');

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

  if (process.env.NODE_ENV === "production") {
    const frontendDist = path.resolve(process.cwd(), "artifacts", "ffpma", "dist", "public");
    app.use(express.static(frontendDist));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api/")) {
        return next();
      }
      res.sendFile(path.join(frontendDist, "index.html"));
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port ${port}`);

      import('./services/mcp-client-manager').then(({ mcpClientManager }) => {
        mcpClientManager.connectAllRegistered().then(() => {
          const counts = mcpClientManager.getConnectionCount();
          log(`MCP servers: ${counts.connected} connected, ${counts.failed} failed out of ${counts.total}`, 'mcp');
        }).catch(err => {
          log(`MCP initialization failed (non-fatal): ${err.message}`, 'mcp');
        });
      }).catch(err => {
        log(`MCP module load failed (non-fatal): ${err.message}`, 'mcp');
      });

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
    import('./services/mcp-client-manager').then(({ mcpClientManager }) => {
      mcpClientManager.disconnectAll().catch(() => {});
    }).catch(() => {});
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
