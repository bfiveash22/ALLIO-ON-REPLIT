import { Express, Request, Response } from 'express';
import { orchestrator, validateProviderCredentials, AGENT_MODEL_ASSIGNMENTS, SPECIALIZED_SERVICE_AGENTS } from './services/sentinel-orchestrator';
import { AGENT_DIVISIONS, Division } from './services/sentinel';
import { requireRole } from './working-auth';
import { storage } from './storage';
import { canvaAgent } from './services/canva-agent';
import { executeAgentTask } from './services/agent-executor';
import * as fs from 'fs/promises';
import * as path from 'path';

// Sentinel is an internal system component. Bypass session auth for internal agent operations 
// originating from localhost, otherwise require admin role.
const adminOnly = (req: any, res: any, next: any) => {
  const ip = req.ip || req.connection?.remoteAddress;
  if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') {
    return next();
  }
  return requireRole('admin')(req, res, next);
};
export function registerSentinelRoutes(app: Express): void {
  app.post('/api/sentinel/initialize', adminOnly, async (_req: Request, res: Response) => {
    try {
      const result = await orchestrator.initialize();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/sentinel/status', adminOnly, async (_req: Request, res: Response) => {
    try {
      const status = await orchestrator.getNetworkStatus();
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/sentinel/agents', adminOnly, async (_req: Request, res: Response) => {
    try {
      const agents = await orchestrator.getAllAgents();
      res.json({ agents, count: agents.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/sentinel/agents/:agentId', adminOnly, async (req: Request, res: Response) => {
    try {
      const agent = await orchestrator.getAgent(req.params.agentId);
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }
      res.json(agent);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/sentinel/divisions', adminOnly, async (_req: Request, res: Response) => {
    try {
      const divisions = Object.entries(AGENT_DIVISIONS).map(([key, info]) => ({
        id: key,
        ...info,
      }));
      res.json({ divisions });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/sentinel/divisions/:division', adminOnly, async (req: Request, res: Response) => {
    try {
      const division = req.params.division as Division;
      if (!AGENT_DIVISIONS[division]) {
        return res.status(404).json({ error: 'Division not found' });
      }
      const status = await orchestrator.getDivisionStatus(division);
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/sentinel/tasks', adminOnly, async (req: Request, res: Response) => {
    try {
      const { agentId, title, description, priority, evidenceType, dueDate } = req.body;
      if (!agentId || !title || !description) {
        return res.status(400).json({ error: 'agentId, title, and description are required' });
      }
      const task = await orchestrator.assignTask({
        agentId,
        title,
        description,
        priority,
        evidenceType,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      });
      res.json(task);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/sentinel/tasks', adminOnly, async (_req: Request, res: Response) => {
    try {
      const tasks = await orchestrator.getPendingTasks();
      res.json({ tasks, count: tasks.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/sentinel/tasks/:agentId', adminOnly, async (req: Request, res: Response) => {
    try {
      const tasks = await orchestrator.getTasksByAgent(req.params.agentId);
      res.json({ tasks, count: tasks.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/sentinel/tasks/:taskId/complete', adminOnly, async (req: Request, res: Response) => {
    try {
      const { outputUrl } = req.body;
      if (!outputUrl) {
        return res.status(400).json({ error: 'outputUrl (Drive link) is required for Integrity Mandate compliance' });
      }
      const success = await orchestrator.completeTask(req.params.taskId, outputUrl);
      if (!success) {
        return res.status(400).json({ error: 'Task completion failed - evidence not verified' });
      }
      res.json({ success: true, message: 'Task completed with verified evidence' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/sentinel/tasks/:taskId/verify', adminOnly, async (req: Request, res: Response) => {
    try {
      const { evidenceUrl, notes } = req.body;
      const verified = await orchestrator.verifyTaskEvidence(req.params.taskId, evidenceUrl, notes);
      res.json({ verified, message: verified ? 'Evidence verified' : 'Evidence verification failed' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/sentinel/cross-division', adminOnly, async (req: Request, res: Response) => {
    try {
      const { fromDivision, toDivision, title, description, priority } = req.body;
      if (!fromDivision || !toDivision || !title || !description) {
        return res.status(400).json({ error: 'fromDivision, toDivision, title, and description are required' });
      }
      const task = await orchestrator.createCrossDivisionTask({
        fromDivision,
        toDivision,
        title,
        description,
        priority,
      });
      res.json(task);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/sentinel/agent/:agentId/query', adminOnly, async (req: Request, res: Response) => {
    try {
      const { query, context } = req.body;
      if (!query) {
        return res.status(400).json({ error: 'query is required' });
      }
      const result = await orchestrator.routeToAIModel(req.params.agentId, query, context);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/sentinel/contract-review', adminOnly, async (_req: Request, res: Response) => {
    try {
      const { isReviewInProgress, initiateContractReview } = await import('./services/contract-review');
      if (isReviewInProgress()) {
        return res.status(409).json({ error: 'A contract review is already in progress' });
      }
      const reviewPromise = initiateContractReview();
      res.json({ status: 'initiated', message: 'Contract V4 legal review initiated. SENTINEL coordinating JURIS, LEXICON, AEGIS, SCRIBE.' });
      reviewPromise.catch(err => console.error('[SENTINEL] Contract review error:', err));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/sentinel/contract-review', adminOnly, async (_req: Request, res: Response) => {
    try {
      const { getLatestReview, isReviewInProgress } = await import('./services/contract-review');
      const review = await getLatestReview();
      res.json({
        review,
        inProgress: isReviewInProgress(),
        available: review !== null
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/sentinel/system/update', adminOnly, async (req: Request, res: Response) => {
    try {
      const { notes } = req.body;
      const success = await orchestrator.triggerSystemUpdate('SENTINEL', notes || 'Manual verification and update via dashboard.');

      if (success) {
        res.json({ message: "Overseer deployment initiated. The matrix is reloading." });
      } else {
        res.status(500).json({ error: "Failed to initiate update sequence." });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- UI Refactor Proposals ---

  app.get('/api/sentinel/ui-proposals', adminOnly, async (_req: Request, res: Response) => {
    try {
      const proposals = await storage.getUiRefactorProposals();
      res.json({ proposals, count: proposals.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/sentinel/ui-proposals/:id/approve', adminOnly, async (req: Request, res: Response) => {
    try {
      const proposal = await storage.getUiRefactorProposal(req.params.id);
      if (!proposal) {
        return res.status(404).json({ error: 'Proposal not found' });
      }
      if (proposal.status !== 'pending') {
        return res.status(400).json({ error: `Proposal already ${proposal.status}` });
      }

      // Execute file change
      // We assume proposedDiff contains the FULL modified file content generated by the AI
      const filePath = path.resolve(process.cwd(), proposal.targetFile);

      // Safety backup
      try {
        const backupPath = `${filePath}.backup-${Date.now()}`;
        await fs.copyFile(filePath, backupPath);
      } catch (e) {
        // ignore if file doesn't exist to backup
      }

      await fs.writeFile(filePath, proposal.proposedDiff, 'utf8');

      const updated = await storage.updateUiRefactorProposal(req.params.id, { status: 'approved' });
      res.json({ success: true, proposal: updated, message: 'File cleanly updated on host machine' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/sentinel/ui-proposals/:id/reject', adminOnly, async (req: Request, res: Response) => {
    try {
      const updated = await storage.updateUiRefactorProposal(req.params.id, { status: 'rejected' });
      if (!updated) {
        return res.status(404).json({ error: 'Proposal not found' });
      }
      res.json({ success: true, proposal: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/sentinel/ui-proposals/:id/revise', adminOnly, async (req: Request, res: Response) => {
    try {
      const { feedback } = req.body;
      const proposal = await storage.getUiRefactorProposal(req.params.id);

      if (!proposal) {
        return res.status(404).json({ error: 'Proposal not found' });
      }

      // Instead of changing status immediately to pending again, we reject this specific version 
      // and spawn a new task. Or we can just leave it as rejected.
      // Easiest is to update the description with feedback and keep it 'pending' to trigger the agent again.
      // But in this implementation, we will assign a new task to the agent with the feedback.

      await orchestrator.assignTask({
        agentId: proposal.agentId,
        title: `Revise UI Proposal for ${proposal.targetFile}`,
        description: `The Trustee requested revisions on your previous proposal.\nFeedback: ${feedback || 'Please improve the design and resubmit.'}\nMake sure to use the ui-ux-pro-max and frontend-design skills to generate a premium mockup before proposing final code.`,
        priority: 2,
        assignedBy: 'TRUSTEE'
      });

      const updated = await storage.updateUiRefactorProposal(req.params.id, {
        status: 'rejected',
        description: `Rejected for revision. Feedback: ${feedback}`
      });

      res.json({ success: true, proposal: updated, message: 'Revision task assigned to agent.' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Agent Task Management (DLQ & Retries) ---
  app.post('/api/agent-tasks/:id/retry', adminOnly, async (req: Request, res: Response) => {
    try {
      const task = await storage.getAgentTask(req.params.id);
      if (!task) return res.status(404).json({ error: 'Task not found' });

      const updated = await storage.updateAgentTask(task.id, {
        status: 'pending',
        progress: 0,
        retryCount: 0, // Reset retry count for a fresh start
        errorLog: null
      });
      res.json({ success: true, task: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/agent-tasks/:id/reassign', adminOnly, async (req: Request, res: Response) => {
    try {
      const { newAgentId } = req.body;
      if (!newAgentId) return res.status(400).json({ error: 'newAgentId is required' });

      const task = await storage.getAgentTask(req.params.id);
      if (!task) return res.status(404).json({ error: 'Task not found' });

      const updated = await storage.updateAgentTask(task.id, {
        agentId: newAgentId.toUpperCase(),
        status: 'pending',
        progress: 0,
        retryCount: 0,
        errorLog: null
      });
      res.json({ success: true, task: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/admin/clean-duplicate-tasks', adminOnly, async (_req: Request, res: Response) => {
    try {
      const allTasks = await storage.getAllAgentTasks();
      const seen = new Map<string, string>();
      const duplicateIds: string[] = [];

      for (const task of allTasks) {
        if (task.status !== 'pending' && task.status !== 'in_progress') continue;

        const key = `${task.agentId.toLowerCase()}::${(task.title || '').toLowerCase().trim()}`;
        if (seen.has(key)) {
          duplicateIds.push(task.id);
        } else {
          seen.set(key, task.id);
        }
      }

      for (const id of duplicateIds) {
        await storage.updateAgentTask(id, {
          status: 'failed',
          errorLog: `[DEDUP] Cancelled as duplicate at ${new Date().toISOString()}`,
        });
      }

      res.json({
        success: true,
        duplicatesFound: duplicateIds.length,
        duplicateIds,
        message: `Cancelled ${duplicateIds.length} duplicate tasks`,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- AI Model Evaluations (HuggingFace) ---
  app.get('/api/sentinel/agent-evaluations', adminOnly, async (req: Request, res: Response) => {
    try {
      const evaluations = await storage.getAiModelEvaluations(req.query.status as string);
      res.json({ evaluations, count: evaluations.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/sentinel/agent-evaluations/:id/approve', adminOnly, async (req: Request, res: Response) => {
    try {
      const evaluation = await storage.getAiModelEvaluation(Number(req.params.id));
      if (!evaluation) {
        return res.status(404).json({ error: 'Evaluation not found' });
      }

      const updated = await storage.updateAiModelEvaluation(Number(req.params.id), { status: 'approved', reviewedAt: new Date() });

      // Notify the Sentinel Agent network that a new model was hot-swapped
      await orchestrator.assignTask({
        agentId: 'SENTINEL',
        title: `HuggingFace Model Upgrade: ${evaluation.modelId}`,
        description: `The Trustee has approved the hot-swap to ${evaluation.modelId} for ${evaluation.category}. Please update the global model registry.`,
        priority: 1,
        assignedBy: 'SYSTEM'
      });

      res.json({ success: true, evaluation: updated, message: 'Model approved and Sentinel notified.' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/sentinel/agent-evaluations/:id/reject', adminOnly, async (req: Request, res: Response) => {
    try {
      const updated = await storage.updateAiModelEvaluation(Number(req.params.id), { status: 'rejected', reviewedAt: new Date() });
      if (!updated) {
        return res.status(404).json({ error: 'Evaluation not found' });
      }
      res.json({ success: true, evaluation: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });


  app.get('/api/sentinel/implementation-status', adminOnly, async (_req: Request, res: Response) => {
    try {
      const { implementedOutputs } = await import('@shared/schema');
      const { desc } = await import('drizzle-orm');
      const { db } = await import('./db');
      const outputs = await db.select().from(implementedOutputs)
        .orderBy(desc(implementedOutputs.createdAt))
        .limit(100);

      const statusCounts = {
        pending_review: 0,
        deployed_successfully: 0,
        deployment_failed: 0,
        rolled_back: 0,
        ignored: 0,
      };
      for (const o of outputs) {
        if (o.status && statusCounts.hasOwnProperty(o.status)) {
          statusCounts[o.status as keyof typeof statusCounts]++;
        }
      }

      res.json({
        outputs,
        count: outputs.length,
        statusCounts,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/sentinel/auto-implementer/run', adminOnly, async (_req: Request, res: Response) => {
    try {
      const { autoImplementer } = await import('./services/auto-implementer');
      const oauthCheck = autoImplementer.checkGoogleOAuthSecrets();
      if (!oauthCheck.valid) {
        return res.status(400).json({
          error: `Missing Google OAuth secrets: ${oauthCheck.missing.join(', ')}`,
          missing: oauthCheck.missing,
        });
      }
      autoImplementer.runRetroactiveProcessing().catch(e => console.error('[AUTO-IMPLEMENTER] Manual trigger error:', e));
      res.json({ status: 'initiated', message: 'Auto-Implementer pipeline triggered. Check notifications for results.' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/sentinel/auto-implementer/health', adminOnly, async (_req: Request, res: Response) => {
    try {
      const { autoImplementer } = await import('./services/auto-implementer');
      const oauthCheck = autoImplementer.checkGoogleOAuthSecrets();
      if (!oauthCheck.valid) {
        return res.json({
          healthy: false,
          oauthConfigured: false,
          missingSecrets: oauthCheck.missing,
          driveHealth: null,
        });
      }
      const driveHealth = await autoImplementer.runDriveFolderHealthCheck();
      res.json({
        healthy: driveHealth.healthy,
        oauthConfigured: true,
        missingSecrets: [],
        driveHealth,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/sentinel/network-health', adminOnly, async (_req: Request, res: Response) => {
    try {
      const healthReport = await orchestrator.getAgentHealthReport();
      const providers = validateProviderCredentials();

      const summary = {
        operational: healthReport.filter(a => a.operationalState === 'operational').length,
        degraded: healthReport.filter(a => a.operationalState === 'degraded').length,
        offline: healthReport.filter(a => a.operationalState === 'offline').length,
        total: healthReport.length,
      };

      const byDivision: Record<string, { operational: number; degraded: number; offline: number; agents: string[] }> = {};
      for (const agent of healthReport) {
        if (!byDivision[agent.division]) {
          byDivision[agent.division] = { operational: 0, degraded: 0, offline: 0, agents: [] };
        }
        byDivision[agent.division][agent.operationalState]++;
        byDivision[agent.division].agents.push(agent.agentId);
      }

      const canvaStatus = await canvaAgent.getStatus();
      const browserUseAgents = {
        canva: {
          agentId: 'PIXEL',
          browserUseInstalled: canvaStatus.browserUseInstalled,
          sessionConfigured: canvaStatus.sessionConfigured,
          status: canvaStatus.available ? 'ready' : (canvaStatus.error || 'not ready'),
        },
        rupaHealth: {
          agentId: 'DR-TRIAGE',
          credentialsConfigured: !!(process.env.RUPA_USERNAME && process.env.RUPA_PASSWORD),
          status: (process.env.RUPA_USERNAME && process.env.RUPA_PASSWORD) ? 'ready' : 'missing RUPA_USERNAME/RUPA_PASSWORD',
        },
      };

      res.json({
        timestamp: new Date().toISOString(),
        summary,
        providers,
        browserUseAgents,
        byDivision,
        agents: healthReport,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/canva/status', adminOnly, async (_req: Request, res: Response) => {
    try {
      const status = await canvaAgent.getStatus();
      res.json({
        agent: 'PIXEL',
        integration: 'canva_browser',
        ...status,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/canva/generate', adminOnly, async (req: Request, res: Response) => {
    try {
      const { prompt, title, description, priority } = req.body;

      if (!prompt && !description) {
        return res.status(400).json({ error: 'Either "prompt" or "description" is required' });
      }

      const canvaStatus = await canvaAgent.getStatus();
      const taskTitle = title || 'Canva Design Generation';
      const taskDescription = description || prompt;

      const task = await storage.createAgentTask({
        agentId: 'PIXEL',
        division: 'marketing',
        title: taskTitle,
        description: taskDescription,
        status: 'pending',
        priority: priority || 2,
      });

      console.log(`[CANVA-API] Created task ${task.id} for Canva generation: ${taskTitle}`);

      if (!canvaStatus.available) {
        const errorNote = `[PREREQUISITE CHECK FAILED: ${canvaStatus.error || 'Canva agent not ready'}. Task queued but will fail until prerequisites are met.]`;
        await storage.updateAgentTask(task.id, {
          description: `${taskDescription}\n\n${errorNote}`,
        });
        console.warn(`[CANVA-API] Task ${task.id} created with prerequisite warning: ${canvaStatus.error}`);
        return res.status(202).json({
          taskId: task.id,
          agentId: 'PIXEL',
          status: 'queued_with_warnings',
          message: `PIXEL task queued but Canva prerequisites are not met. Poll task status at GET /api/sentinel/tasks/${task.id}`,
          prerequisites: {
            playwrightAvailable: canvaStatus.browserUseInstalled,
            sessionConfigured: canvaStatus.sessionConfigured,
            error: canvaStatus.error,
          },
        });
      }

      executeAgentTask(task.id).then((result) => {
        console.log(`[CANVA-API] Task ${task.id} completed:`, result.success ? 'success' : result.error);
      }).catch((err) => {
        console.error(`[CANVA-API] Task ${task.id} failed:`, err.message);
      });

      res.status(202).json({
        taskId: task.id,
        agentId: 'PIXEL',
        status: 'accepted',
        message: `Canva generation task queued. Poll task status at GET /api/sentinel/tasks/${task.id}`,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Dedicated PIXEL design task trigger with explicit prerequisite validation
  app.post('/api/sentinel/pixel/trigger', adminOnly, async (req: Request, res: Response) => {
    try {
      const { prompt, title, description, priority, skipPrerequisiteCheck } = req.body;

      if (!prompt && !description) {
        return res.status(400).json({
          error: 'Either "prompt" or "description" is required',
          example: { prompt: 'Create a logo for FFPMA healing brand', title: 'FFPMA Logo Design' },
        });
      }

      // Always validate prerequisites and report them
      const canvaStatus = await canvaAgent.getStatus();
      const prerequisites = {
        // playwrightInstalled: true when the playwright package is importable
        playwrightInstalled: canvaStatus.browserUseInstalled,
        // browserLaunchable: true when Chromium can actually be launched (subset of playwrightInstalled)
        browserLaunchable: canvaStatus.available || canvaStatus.browserUseInstalled,
        sessionConfigured: canvaStatus.sessionConfigured,
        ready: canvaStatus.available,
        error: canvaStatus.error,
      };

      if (!canvaStatus.available && !skipPrerequisiteCheck) {
        return res.status(503).json({
          error: 'Canva prerequisites not met. Task not created.',
          prerequisites,
          hint: canvaStatus.sessionConfigured
            ? 'Playwright/Chromium is not available. Ensure chromium browsers are installed.'
            : 'CANVA_SESSION_ID environment variable is not set. Configure it to enable Canva automation.',
          bypass: 'Pass "skipPrerequisiteCheck": true to queue the task anyway (it will fail at execution time with a clear error).',
        });
      }

      const taskTitle = title || (prompt ? `PIXEL Design: ${prompt.substring(0, 60)}` : 'PIXEL Design Task');
      const taskDescription = description || prompt;

      const task = await storage.createAgentTask({
        agentId: 'PIXEL',
        division: 'marketing',
        title: taskTitle,
        description: taskDescription,
        status: 'pending',
        priority: priority ?? 2,
      });

      console.log(`[PIXEL-TRIGGER] Created task ${task.id}: "${taskTitle}"`);

      if (!canvaStatus.available && skipPrerequisiteCheck) {
        const errorNote = `[PREREQUISITE CHECK SKIPPED: ${canvaStatus.error || 'Canva not ready'}. Task will fail at execution unless prerequisites are resolved.]`;
        await storage.updateAgentTask(task.id, {
          description: `${taskDescription}\n\n${errorNote}`,
        });
      }

      // Immediately dispatch to agent executor (non-blocking)
      executeAgentTask(task.id).then((result) => {
        if (result.success) {
          console.log(`[PIXEL-TRIGGER] Task ${task.id} succeeded. Output: ${result.outputUrl}`);
        } else {
          console.error(`[PIXEL-TRIGGER] Task ${task.id} failed: ${result.error}`);
        }
      }).catch((err) => {
        console.error(`[PIXEL-TRIGGER] Task ${task.id} executor error: ${err.message}`);
      });

      // When skipPrerequisiteCheck was used with an unavailable agent, use 'dispatched_with_warnings'
      // to distinguish from a clean dispatch (all prerequisites met)
      const responseStatus = canvaStatus.available
        ? 'dispatched'
        : (skipPrerequisiteCheck ? 'dispatched_with_warnings' : 'queued_with_warnings');

      res.status(202).json({
        taskId: task.id,
        agentId: 'PIXEL',
        service: 'canva-agent',
        status: responseStatus,
        message: `PIXEL task dispatched. Poll status at GET /api/sentinel/tasks/${task.id}`,
        prerequisites,
        pollUrl: `/api/sentinel/tasks/${task.id}`,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  console.log('[SENTINEL] Orchestrator routes registered (admin-protected)');
  console.log('[SENTINEL] Canva API routes registered: GET /api/canva/status, POST /api/canva/generate, POST /api/sentinel/pixel/trigger');
}
