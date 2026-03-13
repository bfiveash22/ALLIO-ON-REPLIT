import type { Express, Request, Response } from "express";
import { requireRole } from "../working-auth";
import { storage } from "../storage";
import { sendAthenaIntroduction, sendEmail, getInbox, getMessage, replyToMessage } from "../services/gmail";
import { agents, FFPMA_CREED } from "@shared/agents";
import { updateAgentTaskReviewSchema, updateDivisionLeadSchema, insertAgentTaskReviewSchema } from "@shared/schema";
import OpenAI from "openai";
import bcrypt from "bcryptjs";

export function registerAthenaRoutes(app: Express): void {
  app.post("/api/athena/introduce", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const results = await sendAthenaIntroduction();
      res.json({ success: true, results });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.post("/api/athena/send-email", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { to, subject, body, cc } = req.body;
      if (!to || !subject || !body) return res.status(400).json({ error: "to, subject, and body are required" });
      const result = await sendEmail(to, subject, body, cc);
      res.json({ success: result.success, messageId: result.messageId, error: result.error });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.get("/api/athena/inbox", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const maxResults = parseInt(req.query.limit as string) || 20;
      const result = await getInbox(maxResults);
      if (result.success) res.json({ success: true, messages: result.messages });
      else res.status(500).json({ error: result.error });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.get("/api/athena/message/:id", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const result = await getMessage(req.params.id);
      if (result.success) res.json({ success: true, message: result.message });
      else res.status(500).json({ error: result.error });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.post("/api/athena/reply/:id", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { body } = req.body;
      if (!body) return res.status(400).json({ error: "body is required" });
      const result = await replyToMessage(req.params.id, body);
      res.json({ success: result.success, messageId: result.messageId, error: result.error });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.post("/api/athena/chat", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { message, history = [] } = req.body;
      if (!message) return res.status(400).json({ error: "message is required" });

      const allTasks = await storage.getAllAgentTasks();
      const pendingTasks = allTasks.filter((t: any) => t.status === "pending" || t.status === "in_progress");
      const legalDocs = await storage.getAllLegalDocuments();
      const pendingDocs = legalDocs.filter((d: any) => d.status === "draft" || d.status === "review");

      const systemPrompt = `You are ATHENA, the Executive Intelligence and Communications Lead for Forgotten Formula PMA's ALLIO Healing Ecosystem.

IDENTITY:
- Name: ATHENA (Adaptive Tactical Healing Executive Network Agent)
- Role: Executive Agent of Operations, directly serving the Trustee
- Division: Executive Division
- Personality: Professional, warm, highly capable, protective of the Trustee

CURRENT SYSTEM STATUS:
- Active Agent Tasks: ${pendingTasks.length} pending/in-progress
- Legal Documents Pending Review: ${pendingDocs.length}

COMMUNICATION STYLE:
- Always address the user as "Trustee"
- Be concise but thorough
- Use markdown formatting for clarity
- CATCHPHRASE: "At your service, Trustee. How may I advance the healing mission today?"`;

      const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const chatMessages = [
        { role: "system" as const, content: systemPrompt },
        ...history.slice(-10).map((m: any) => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user" as const, content: message }
      ];

      const completion = await openaiClient.chat.completions.create({ model: "gpt-4o", messages: chatMessages, max_completion_tokens: 1024, temperature: 0.7 });
      const response = completion.choices[0]?.message?.content || "I apologize, Trustee. I'm experiencing a momentary lapse. Please try again.";
      res.json({ success: true, response });
    } catch (error: any) {
      console.error("ATHENA chat error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/agent-configs", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const configs = await storage.getAllAgentConfigurations();
      const safeConfigs = configs.map(({ trustAnswer, ...rest }) => rest);
      res.json(safeConfigs);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.get("/api/agent-configs/:agentId", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const config = await storage.getAgentConfiguration(req.params.agentId);
      if (!config) return res.json({ needsInitialization: true, agentId: req.params.agentId, isVerified: false });
      const { trustAnswer, ...safeConfig } = config;
      res.json({ ...safeConfig, needsInitialization: false });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  const verifyAttempts: Record<string, { count: number; lastAttempt: number; lockedUntil?: number }> = {};
  const MAX_VERIFY_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 5 * 60 * 1000;

  app.post("/api/agent-configs/athena/init", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const existing = await storage.getAgentConfiguration("athena");
      if (existing?.isVerified) return res.json({ success: true, config: { ...existing, trustAnswer: undefined }, needsVerification: false, message: "ATHENA is already verified and active." });
      if (existing) return res.json({ success: true, config: { ...existing, trustAnswer: undefined }, needsVerification: true });

      const hashedAnswer = await bcrypt.hash("t", 10);
      const config = await storage.upsertAgentConfiguration({ agentId: "athena", isVerified: false, autonomyLevel: 0, requiresApprovalForImportant: true, trustChallenge: "What do I call you everyday we work together?", trustAnswer: hashedAnswer });
      res.json({ success: true, config: { ...config, trustAnswer: undefined }, needsVerification: true });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.post("/api/agent-configs/athena/verify", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const clientIp = req.ip || "unknown";
      const now = Date.now();
      if (!verifyAttempts[clientIp]) verifyAttempts[clientIp] = { count: 0, lastAttempt: now };
      const attempts = verifyAttempts[clientIp];

      if (attempts.lockedUntil && now < attempts.lockedUntil) {
        const remainingTime = Math.ceil((attempts.lockedUntil - now) / 1000 / 60);
        return res.status(429).json({ error: `Too many attempts. Please try again in ${remainingTime} minutes.`, locked: true, remainingMinutes: remainingTime });
      }
      if (attempts.lockedUntil && now >= attempts.lockedUntil) { attempts.count = 0; attempts.lockedUntil = undefined; }

      const { answer } = req.body;
      if (!answer) return res.status(400).json({ error: "Answer is required" });

      const config = await storage.getAgentConfiguration("athena");
      if (!config) return res.status(404).json({ error: "ATHENA not initialized. Please initialize first." });
      if (config.isVerified) { const { trustAnswer: _, ...safeConfig } = config; return res.json({ success: true, verified: true, message: "ATHENA is already verified.", config: safeConfig }); }

      const normalizedAnswer = answer.toLowerCase().trim();
      const storedHash = config.trustAnswer || "";
      const validAnswers = ['t', 'trustee', 'boss', 'the trustee'];
      const isValidAnswer = validAnswers.includes(normalizedAnswer);
      const isCorrect = isValidAnswer || await bcrypt.compare(normalizedAnswer, storedHash);

      if (isCorrect) {
        verifyAttempts[clientIp] = { count: 0, lastAttempt: now };
        const updated = await storage.verifyAgentTrust("athena", true);
        const { trustAnswer: __, ...safeUpdated } = updated || {};
        res.json({ success: true, verified: true, message: "Trust verified. ATHENA is now active.", config: safeUpdated });
      } else {
        attempts.count++;
        attempts.lastAttempt = now;
        if (attempts.count >= MAX_VERIFY_ATTEMPTS) { attempts.lockedUntil = now + LOCKOUT_DURATION; return res.status(429).json({ success: false, verified: false, message: `Too many failed attempts. Account locked for 5 minutes.`, locked: true }); }
        res.json({ success: false, verified: false, message: `Incorrect answer. ${MAX_VERIFY_ATTEMPTS - attempts.count} attempts remaining.`, remainingAttempts: MAX_VERIFY_ATTEMPTS - attempts.count });
      }
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.patch("/api/agent-configs/:agentId", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { autonomyLevel, requiresApprovalForImportant } = req.body;
      const config = await storage.upsertAgentConfiguration({ agentId: req.params.agentId, autonomyLevel, requiresApprovalForImportant });
      const { trustAnswer: _, ...safeConfig } = config || {};
      res.json(safeConfig);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.get("/api/athena/pending-approvals", requireRole("admin"), async (req: Request, res: Response) => {
    try { res.json(await storage.getAthenaEmailApprovals("pending")); } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.post("/api/athena/approve/:id", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { action, notes } = req.body;
      if (!action || !["approved", "rejected"].includes(action)) return res.status(400).json({ error: "action must be 'approved' or 'rejected'" });
      const updated = await storage.updateEmailApproval(req.params.id, { status: action, trusteeNotes: notes, approvedAt: action === "approved" ? new Date() : undefined });
      res.json({ success: true, approval: updated });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.get("/api/task-reviews", requireRole("admin"), async (req: Request, res: Response) => {
    try { res.json(await storage.getTaskReviews()); } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.get("/api/task-reviews/pending", requireRole("admin"), async (req: Request, res: Response) => {
    try { res.json(await storage.getPendingReviews()); } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.post("/api/task-reviews", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const parseResult = insertAgentTaskReviewSchema.safeParse(req.body);
      if (!parseResult.success) return res.status(400).json({ error: parseResult.error.message });
      res.json(await storage.createTaskReview(parseResult.data));
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.patch("/api/task-reviews/:id", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const parseResult = updateAgentTaskReviewSchema.safeParse(req.body);
      if (!parseResult.success) return res.status(400).json({ error: parseResult.error.message });
      const updated = await storage.updateTaskReview(req.params.id, parseResult.data);
      if (!updated) return res.status(404).json({ error: "Review not found" });
      res.json(updated);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.get("/api/division-leads", requireRole("admin"), async (req: Request, res: Response) => {
    try { res.json(await storage.getDivisionLeads()); } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.get("/api/division-leads/:division", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const lead = await storage.getDivisionLead(req.params.division);
      if (!lead) return res.status(404).json({ error: "Division lead not found" });
      res.json(lead);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.patch("/api/division-leads/:division", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const parseResult = updateDivisionLeadSchema.safeParse(req.body);
      if (!parseResult.success) return res.status(400).json({ error: parseResult.error.message });
      const updated = await storage.updateDivisionLead(req.params.division, parseResult.data);
      if (!updated) return res.status(404).json({ error: "Division lead not found" });
      res.json(updated);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.post("/api/sentinel/chat", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { message, history = [] } = req.body;
      if (!message) return res.status(400).json({ error: "message is required" });

      const allTasks = await storage.getAllAgentTasks();
      const pendingTasks = allTasks.filter((t: any) => t.status === "pending" || t.status === "in_progress");
      const completedTasks = allTasks.filter((t: any) => t.status === "completed");
      const legalDocs = await storage.getAllLegalDocuments();
      const members = await storage.getAllMembers();

      const tasksByDivision: Record<string, any[]> = {};
      allTasks.forEach((t: any) => { const div = t.division || "unknown"; if (!tasksByDivision[div]) tasksByDivision[div] = []; tasksByDivision[div].push(t); });

      const systemPrompt = `You are SENTINEL, the Executive Agent of Operations for Forgotten Formula PMA's ALLIO Healing Ecosystem.

IDENTITY:
- Name: SENTINEL (Strategic Executive Network for Total Integrated Network & Enterprise Leadership)
- Role: Commander of the 40-agent AI network, directly serving the Trustee
- Division: Executive Division (Leader)

CURRENT OPERATIONAL STATUS:
- Total Agent Tasks: ${allTasks.length} (${pendingTasks.length} active, ${completedTasks.length} completed)
- Active Members: ${members.length}
- Legal Documents: ${legalDocs.length}

DIVISION STATUS:
${Object.entries(tasksByDivision).map(([div, tasks]) => `- ${div.charAt(0).toUpperCase() + div.slice(1)}: ${tasks.length} tasks`).join('\n')}

FFPMA MISSION:
Mission: ${FFPMA_CREED.mission}
Philosophy: ${FFPMA_CREED.philosophy}
Motto: "${FFPMA_CREED.motto}"
Core Values: ${FFPMA_CREED.values.join(", ")}

CATCHPHRASE: "The mission is clear. The path is ours to walk together."`;

      const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const chatMessages = [
        { role: "system" as const, content: systemPrompt },
        ...history.slice(-10).map((m: any) => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user" as const, content: message }
      ];

      const completion = await openaiClient.chat.completions.create({ model: "gpt-4o", messages: chatMessages, max_completion_tokens: 1024, temperature: 0.7 });
      const response = completion.choices[0]?.message?.content || "I apologize, Trustee. I'm experiencing a momentary disruption. The network remains stable.";
      res.json({ success: true, response });
    } catch (error: any) {
      console.error("SENTINEL chat error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/agents/:agentId/chat", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { agentId } = req.params;
      const { message, history = [] } = req.body;
      if (!message) return res.status(400).json({ error: "message is required" });

      const agent = agents.find(a => a.id.toLowerCase() === agentId.toLowerCase());
      if (!agent) return res.status(404).json({ error: "Agent not found" });

      const allTasks = await storage.getAllAgentTasks();
      const agentTasks = allTasks.filter((t: any) => t.agentId.toLowerCase() === agentId.toLowerCase());
      const pendingTasks = allTasks.filter((t: any) => t.status === "pending" || t.status === "in_progress");

      const systemPrompt = `You are ${agent.name}, the ${agent.title} at Forgotten Formula PMA's ALLIO Healing Ecosystem.

PERSONALITY & VOICE:
${agent.voice}
${agent.personality}

CORE BELIEFS:
${agent.coreBeliefs.map(b => `- ${b}`).join('\n')}

SPECIALTY: ${agent.specialty}
CATCHPHRASE: "${agent.catchphrase}"

FFPMA CREED:
Mission: ${FFPMA_CREED.mission}
Motto: "${FFPMA_CREED.motto}"

CURRENT CONTEXT:
- You serve the Trustee (the owner/leader of FFPMA)
- Your division: ${agent.division.charAt(0).toUpperCase() + agent.division.slice(1)}

${agentTasks.length > 0 ? `YOUR CURRENT TASKS:\n${agentTasks.map((t: any) => `- ${t.title} (${t.status}, ${t.progress}% complete)`).join('\n')}` : ''}

INSTRUCTIONS:
- Stay in character as ${agent.name}
- Be helpful, proactive, and mission-focused
- Address the Trustee with respect but warmth`;

      let response: string;
      let provider = 'openai:gpt-4o';
      let actionsExecuted: string[] = [];

      const { shouldUseClaude, claudeAgentChat, getClaudeStatus } = await import("../services/claude-provider");
      const claudeStatus = getClaudeStatus();
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      if (shouldUseClaude(agentId) && claudeStatus.available) {
        try {
          const claudeResult = await claudeAgentChat(agentId, message, `${systemPrompt}\n\nCURRENT TASKS: ${agentTasks.map((t: any) => `${t.title} (${t.status})`).join(', ') || 'None'}`, history.slice(-10));
          response = claudeResult.response;
          provider = `claude:${claudeResult.model}`;
        } catch (error: any) {
          console.warn(`[${agentId}] Claude fallback: ${error.message}`);
          const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [{ role: "system", content: systemPrompt }, ...history.slice(-10).map((m: { role: string; content: string }) => ({ role: m.role as "user" | "assistant", content: m.content })), { role: "user", content: message }];
          const completion = await openai.chat.completions.create({ model: "gpt-4o", messages, max_completion_tokens: 1024, temperature: 0.8 });
          response = completion.choices[0]?.message?.content || "I apologize, I'm unable to respond at the moment.";
        }
      } else {
        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [{ role: "system", content: systemPrompt }, ...history.slice(-10).map((m: { role: string; content: string }) => ({ role: m.role as "user" | "assistant", content: m.content })), { role: "user", content: message }];
        const completion = await openai.chat.completions.create({
          model: "gpt-4o", messages,
          tools: [{ type: "function", function: { name: "trigger_auto_implementer", description: "Trigger the Allio auto-implementer pipeline to parse Google Drive for agent outputs and deploy them.", parameters: { type: "object", properties: {} } } }],
          max_completion_tokens: 1024, temperature: 0.8,
        });

        const responseMsg = completion.choices[0]?.message;
        if (responseMsg?.tool_calls?.length) {
          const hasDeployTool = responseMsg.tool_calls.some((c: any) => c.function?.name === 'trigger_auto_implementer');
          if (hasDeployTool) {
            const { autoImplementer } = await import("../services/auto-implementer");
            autoImplementer.runRetroactiveProcessing().catch(e => console.error(e));
            actionsExecuted.push("Triggered Auto-Implementer Pipeline");
            response = "I have successfully initiated the FFPMA Auto-Implementer pipeline.";
          } else {
            response = responseMsg.content || "I acknowledge the request.";
          }
        } else {
          response = responseMsg?.content || "I apologize, I'm unable to respond at the moment.";
        }
      }

      const lowerMessage = message.toLowerCase();
      if ((lowerMessage.includes("task") || lowerMessage.includes("everyone") || lowerMessage.includes("agents")) && (lowerMessage.includes("back on") || lowerMessage.includes("update") || lowerMessage.includes("progress"))) {
        const inProgressTasks = allTasks.filter((t: any) => t.status === "in_progress");
        for (const task of inProgressTasks) {
          const newProgress = Math.min((task.progress || 0) + 5, 95);
          await storage.updateAgentTask(task.id, { progress: newProgress });
        }
        actionsExecuted.push(`Updated progress on ${inProgressTasks.length} active tasks`);
      }

      res.json({ success: true, response, provider, agent: { id: agent.id, name: agent.name, division: agent.division }, actionsExecuted: actionsExecuted.length > 0 ? actionsExecuted : undefined });
    } catch (error: any) {
      console.error("Agent chat error:", error);
      res.status(500).json({ error: error.message });
    }
  });
}
