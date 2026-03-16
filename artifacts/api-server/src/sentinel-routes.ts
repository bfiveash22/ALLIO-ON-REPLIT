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

  // --- OpenClaw Telegram Webhooks ---
  app.post('/api/webhooks/openclaw', async (req: Request, res: Response) => {
    try {
      const { from, to_agent, message } = req.body;

      // Basic security check to ensure it's from the Trustee via OpenClaw
      if (from !== 'trustee') {
        return res.status(400).json({ error: 'Invalid sender' });
      }

      // Convert the Telegram message into a high-priority task for the designated agent
      const description = `TRUSTEE DIRECTIVE via OPENCLAW Telegram:\n"${message}"`;

      let targetAgent = (to_agent || 'SENTINEL').toUpperCase();
      if (['DR BAKER', 'DR. BAKER', 'DR FORMULA', 'DR. FORMULA'].includes(targetAgent)) {
        targetAgent = 'DR_FORMULA';
      }

      await orchestrator.assignTask({
        agentId: targetAgent,
        title: `Direct Order: Trustee via Telegram`,
        description: description,
        priority: 1, // Urgent priority for direct orders
        assignedBy: 'TRUSTEE'
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error('[OpenClaw Webhook Error]:', error);
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

      const status = await canvaAgent.getStatus();
      if (!status.available) {
        return res.status(503).json({
          error: 'Canva agent is not ready',
          details: status.error,
          browserUseInstalled: status.browserUseInstalled,
          browserUseApiKeyConfigured: status.browserUseApiKeyConfigured,
          sessionConfigured: status.sessionConfigured,
        });
      }

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

  console.log('[SENTINEL] Orchestrator routes registered (admin-protected)');
  console.log('[SENTINEL] Canva API routes registered: GET /api/canva/status, POST /api/canva/generate');
}
