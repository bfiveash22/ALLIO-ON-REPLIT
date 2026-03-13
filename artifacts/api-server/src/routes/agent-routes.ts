import type { Express, Request, Response } from "express";
import { requireRole } from "../working-auth";
import { storage } from "../storage";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { validatePreviewMode } from "../lib/preview-mode";
import { executeAgentTask, executePendingTasks, getAgentTaskStatus } from "../services/agent-executor";
import { lockManager } from "../services/agent-locks";
import { getSchedulerStatus, triggerImmediateExecution, seedInitialTasks, startAgentScheduler, stopAgentScheduler } from "../services/agent-scheduler";

export function registerAgentRoutes(app: Express): void {
  app.get("/api/sentinel/notifications", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { sentinel } = await import('../services/sentinel');
      const limit = parseInt(req.query.limit as string) || 50;
      const notifications = await sentinel.getNotifications(limit);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/sentinel/notifications/unread", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { sentinel } = await import('../services/sentinel');
      const notifications = await sentinel.getUnreadNotifications();
      res.json({ notifications, count: notifications.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/sentinel/notifications/:id/read", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { sentinel } = await import('../services/sentinel');
      await sentinel.markAsRead(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/sentinel/notifications/read-all", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { sentinel } = await import('../services/sentinel');
      await sentinel.markAllAsRead();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const adminOnly = (req: any, res: any, next: any) => {
    const ip = req.ip || req.connection?.remoteAddress;
    if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') {
      return next();
    }
    return requireRole('admin')(req, res, next);
  };

  app.get("/api/agent-tasks", adminOnly, async (req: Request, res: Response) => {
    try {
      const { division, agentId } = req.query;
      let tasks;
      if (division && typeof division === 'string') {
        tasks = await storage.getAgentTasksByDivision(division);
      } else if (agentId && typeof agentId === 'string') {
        tasks = await storage.getAgentTasksByAgent(agentId);
      } else {
        tasks = await storage.getAllAgentTasks();
      }
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/agent-tasks", adminOnly, async (req: Request, res: Response) => {
    try {
      const { insertAgentTaskSchema, agentRegistry } = await import("@shared/schema");
      const body = { ...req.body };

      if (!body.division && body.agentId) {
        const agentRows = await db.select().from(agentRegistry).where(eq(agentRegistry.agentId, body.agentId.toLowerCase()));
        if (agentRows.length > 0) {
          body.division = agentRows[0].division;
        } else {
          body.division = 'executive';
        }
      }

      if (!body.status) body.status = 'pending';

      const parseResult = insertAgentTaskSchema.safeParse(body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid task data", details: parseResult.error.flatten() });
      }
      const task = await storage.createAgentTask(parseResult.data);
      res.status(201).json(task);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/agent-tasks/:id", adminOnly, async (req: Request, res: Response) => {
    try {
      const { insertAgentTaskSchema } = await import("@shared/schema");
      const updateSchema = insertAgentTaskSchema.partial();
      const parseResult = updateSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid update data", details: parseResult.error.flatten() });
      }
      const task = await storage.updateAgentTask(req.params.id, parseResult.data);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/agent-tasks/:id", adminOnly, async (req: Request, res: Response) => {
    try {
      const { insertAgentTaskSchema } = await import("@shared/schema");
      const updateSchema = insertAgentTaskSchema.partial();
      const parseResult = updateSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid update data", details: parseResult.error.flatten() });
      }
      const task = await storage.updateAgentTask(req.params.id, parseResult.data);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/agent-tasks/:id", adminOnly, async (req: Request, res: Response) => {
    try {
      await storage.deleteAgentTask(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/agent-network/stats", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const allTasks = await storage.getAllAgentTasks();
      const divisionLeads = await storage.getDivisionLeads();
      const pendingReviews = await storage.getPendingReviews();

      const taskStats = {
        total: allTasks.length,
        pending: allTasks.filter(t => t.status === "pending").length,
        inProgress: allTasks.filter(t => t.status === "in_progress").length,
        completed: allTasks.filter(t => t.status === "completed").length,
        blocked: allTasks.filter(t => t.status === "blocked").length,
      };

      const divisionStats: Record<string, { total: number; completed: number; pending: number; inProgress: number }> = {};
      const uniqueDivisions = Array.from(new Set(allTasks.map(t => t.division).filter(Boolean)));

      for (const div of uniqueDivisions) {
        const divTasks = allTasks.filter(t => t.division === div);
        divisionStats[div] = {
          total: divTasks.length,
          completed: divTasks.filter(t => t.status === "completed").length,
          pending: divTasks.filter(t => t.status === "pending").length,
          inProgress: divTasks.filter(t => t.status === "in_progress").length,
        };
      }

      const costProjections = {
        aiCalls: {
          estimated: allTasks.length * 0.02,
          currency: "USD",
          description: "Est. OpenAI API costs (~$0.02/task)",
          isEstimate: true
        },
        storage: {
          estimated: allTasks.filter(t => t.outputDriveFileId).length * 0.001,
          currency: "USD",
          description: "Est. Drive storage (~$0.001/file)",
          isEstimate: true
        },
        total: {
          estimated: (allTasks.length * 0.02) + (allTasks.filter(t => t.outputDriveFileId).length * 0.001),
          currency: "USD",
          isEstimate: true,
          disclaimer: "Based on avg. per-task/file estimates, not actual API usage"
        }
      };

      const completionRate = taskStats.total > 0
        ? Math.round((taskStats.completed / taskStats.total) * 100)
        : 0;

      const launchDeadline = new Date("2026-04-01T00:00:00Z");
      const now = new Date();
      const daysRemaining = Math.ceil((launchDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      res.json({
        taskStats,
        divisionStats,
        divisionLeads: divisionLeads.map(d => ({
          division: d.division,
          leadAgentId: d.leadAgentId,
          progressPercent: d.progressPercent,
          status: d.status,
          lastUpdate: d.lastStatusUpdate
        })),
        pendingReviews: pendingReviews.length,
        costProjections,
        metrics: {
          completionRate,
          daysRemaining,
          outputsProduced: allTasks.filter(t => t.outputDriveFileId).length,
          activeAgents: Array.from(new Set(allTasks.filter(t => t.status === "in_progress").map(t => t.agentId))).length
        },
        lastUpdated: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/agents/scheduler/status", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const status = getSchedulerStatus();
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/agents/scheduler/trigger", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const count = parseInt(req.query.count as string) || 3;
      console.log(`[API] Triggering immediate execution of ${count} tasks...`);
      const result = await triggerImmediateExecution(count);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/agents/scheduler/seed", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      console.log(`[API] Seeding initial tasks...`);
      const result = await seedInitialTasks();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/agents/scheduler/start", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      startAgentScheduler();
      res.json({ success: true, message: "Agent scheduler started" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/agents/scheduler/stop", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      stopAgentScheduler();
      res.json({ success: true, message: "Agent scheduler stopped" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const agentQuerySchema = z.object({
    division: z.enum(['research', 'marketing', 'legal', 'training']),
    query: z.string().min(1).max(5000),
    context: z.string().optional()
  });

  app.post("/api/agents/query", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id as string;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const parsed = agentQuerySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.errors });
      }

      const { queryAgent } = await import("../services/huggingface-agents");
      const result = await queryAgent(parsed.data);
      res.json(result);
    } catch (error: any) {
      console.error("[Agent Query] Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  const crossDivisionalSchema = z.object({
    query: z.string().min(1).max(5000),
    divisions: z.array(z.enum(['research', 'marketing', 'legal', 'training'])).optional()
  });

  app.post("/api/agents/cross-divisional", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id as string;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const parsed = crossDivisionalSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.errors });
      }

      const { crossDivisionalQuery } = await import("../services/huggingface-agents");
      const result = await crossDivisionalQuery(parsed.data.query, parsed.data.divisions);
      res.json(result);
    } catch (error: any) {
      console.error("[Cross-Divisional Query] Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/agents/status", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { checkAgentStatus } = await import("../services/huggingface-agents");
      const status = await checkAgentStatus();
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ available: false, status: error.message });
    }
  });

  app.get("/api/core-agents", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { getCoreAgentStatus } = await import("../services/core-agents");
      const agents = await getCoreAgentStatus();
      res.json({ success: true, agents });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/core-agents/activate", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { activateCoreAgents } = await import("../services/core-agents");
      const result = await activateCoreAgents();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/core-agents/network", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { getNetworkOverview } = await import("../services/core-agents");
      const overview = await getNetworkOverview();
      res.json(overview);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/core-agents/:agentId/chat", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { agentId } = req.params;
      const { message, context } = req.body;
      const validAgents = ['ATHENA', 'SENTINEL', 'MUSE', 'PRISM', 'FORGE'];
      if (!validAgents.includes(agentId.toUpperCase())) {
        return res.status(400).json({ error: `Invalid core agent. Valid agents: ${validAgents.join(', ')}` });
      }
      const { agentChat } = await import("../services/core-agents");
      const result = await agentChat(agentId.toUpperCase() as any, message, context);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/core-agents/route-task", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { taskType, taskDescription, priority } = req.body;
      if (!taskType || !taskDescription) {
        return res.status(400).json({ error: "taskType and taskDescription required" });
      }
      const { routeTaskToAgent } = await import("../services/core-agents");
      const result = await routeTaskToAgent(taskType, taskDescription, priority || 2);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/core-agents/cross-division", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { fromAgent, toAgent, requirement } = req.body;
      const validAgents = ['ATHENA', 'SENTINEL', 'MUSE', 'PRISM', 'FORGE'];
      if (!validAgents.includes(fromAgent) || !validAgents.includes(toAgent)) {
        return res.status(400).json({ error: "Invalid agent(s)" });
      }
      const { requestCrossDivisionSupport } = await import("../services/core-agents");
      const result = await requestCrossDivisionSupport(fromAgent, toAgent, requirement);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/core-agents/:agentId/workflow", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { agentId } = req.params;
      const { workflowType, title, description } = req.body;
      const validAgents = ['ATHENA', 'SENTINEL', 'MUSE', 'PRISM', 'FORGE'];
      const validWorkflows = ['document', 'research', 'video', 'strategy'];
      if (!validAgents.includes(agentId.toUpperCase())) {
        return res.status(400).json({ error: "Invalid core agent" });
      }
      if (!validWorkflows.includes(workflowType)) {
        return res.status(400).json({ error: "Invalid workflow type" });
      }
      const { executeAgentWorkflow } = await import("../services/core-agents");
      const result = await executeAgentWorkflow(agentId.toUpperCase() as any, workflowType, title, description);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/core-agents/messages", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { getRecentMessages } = await import("../services/core-agents");
      const limit = parseInt(req.query.limit as string) || 20;
      const messages = getRecentMessages(limit);
      res.json({ messages });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/claude/status", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { getClaudeStatus } = await import("../services/claude-provider");
      res.json(getClaudeStatus());
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/claude/models", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { getAvailableModels } = await import("../services/claude-provider");
      res.json({ models: getAvailableModels() });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/claude/chat", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { agentId, message, context, history } = req.body;
      if (!agentId || !message) {
        return res.status(400).json({ error: "agentId and message are required" });
      }
      const { claudeAgentChat } = await import("../services/claude-provider");
      const result = await claudeAgentChat(agentId, message, context, history);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/claude/analyze", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { task, context, agentId } = req.body;
      if (!task || !context) {
        return res.status(400).json({ error: "task and context are required" });
      }
      const { claudeAnalyze } = await import("../services/claude-provider");
      const result = await claudeAnalyze(task, context, agentId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/claude/generate-document", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { documentType, requirements, agentId } = req.body;
      if (!documentType || !requirements) {
        return res.status(400).json({ error: "documentType and requirements are required" });
      }
      const { claudeGenerateDocument } = await import("../services/claude-provider");
      const result = await claudeGenerateDocument(documentType, requirements, agentId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/ai-providers", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { getClaudeStatus } = await import("../services/claude-provider");
      const claudeStatus = getClaudeStatus();

      const providers = [
        {
          id: 'openai',
          name: 'OpenAI',
          models: ['gpt-4o', 'gpt-4o-mini'],
          available: !!process.env.OPENAI_API_KEY,
          purpose: 'General agent conversations, content generation'
        },
        {
          id: 'anthropic',
          name: 'Anthropic Claude',
          models: claudeStatus.models,
          available: claudeStatus.available,
          purpose: 'Deep reasoning, legal analysis, scientific research, strategic planning',
          deepReasoningAgents: claudeStatus.deepReasoningAgents
        },
        {
          id: 'gemini',
          name: 'Google Gemini',
          models: ['gemini-2.0-flash'],
          available: !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || process.env.AI_INTEGRATIONS_GEMINI_API_KEY),
          purpose: 'Multimodal analysis, image understanding'
        }
      ];

      res.json({ providers, totalProviders: providers.filter(p => p.available).length });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/agents/cross-division/handoff", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const isPreviewMode = validatePreviewMode(req);
      const userId = req.user?.id as string;
      if (!userId && !isPreviewMode) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { taskId, fromDivision, toDivision, context, deliverables } = req.body;

      if (!taskId || !fromDivision || !toDivision) {
        return res.status(400).json({ error: "taskId, fromDivision, and toDivision required" });
      }

      console.log(`[Cross-Division] Handoff: ${fromDivision} -> ${toDivision} for task ${taskId}`);

      const { crossDivisionalQuery } = await import("../services/huggingface-agents");
      const synthesis = await crossDivisionalQuery(
        `Review the following deliverables from ${fromDivision} division and prepare instructions for ${toDivision} division:\n\nContext: ${context}\n\nDeliverables: ${JSON.stringify(deliverables)}`,
        [fromDivision as any, toDivision as any]
      );

      res.json({
        success: true,
        handoff: {
          taskId,
          fromDivision,
          toDivision,
          timestamp: new Date().toISOString()
        },
        synthesis: synthesis.synthesis,
        divisionResponses: synthesis.divisionResponses,
        modelUsed: synthesis.modelUsed
      });
    } catch (error: any) {
      console.error("[Cross-Division] Handoff error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/agents/tasks/status", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const status = await getAgentTaskStatus();
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/agents/tasks/:taskId/execute", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { taskId } = req.params;
      console.log(`[API] Executing task: ${taskId}`);
      const result = await executeAgentTask(taskId);
      res.json(result);
    } catch (error: any) {
      console.error(`[API] Task execution error:`, error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/agents/tasks/execute-all", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 3;
      console.log(`[API] Executing up to ${limit} pending tasks...`);
      const result = await executePendingTasks(limit);
      res.json(result);
    } catch (error: any) {
      console.error(`[API] Batch execution error:`, error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
}
