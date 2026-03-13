import { db } from '../db';
import { agentRegistry, agentTasks, sentinelNotifications, researchPapers } from '@shared/schema';
import type { InsertAgentRegistry, InsertAgentTask, AgentTask, AgentRegistry } from '@shared/schema';
import { eq, desc, and, sql, inArray } from 'drizzle-orm';
import { agents } from '@shared/agents';
import { AGENT_DIVISIONS, Division, sentinel } from './sentinel';
import { researchApi } from './research-api';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;

interface AIModelConfig {
  provider: 'openai' | 'claude' | 'huggingface' | 'gemini' | 'research';
  model: string;
  specialty: string[];
}

export const AGENT_MODEL_ASSIGNMENTS: Record<string, AIModelConfig> = {
  // Executive Division
  'SENTINEL': { provider: 'claude', model: 'claude-sonnet-4-5', specialty: ['orchestration', 'coordination', 'routing'] },
  'ATHENA': { provider: 'claude', model: 'claude-sonnet-4-5', specialty: ['communications', 'scheduling', 'inbox'] },
  'OPENCLAW': { provider: 'claude', model: 'claude-sonnet-4-5', specialty: ['communication', 'triaging', 'ml-analysis'] },
  'HERMES': { provider: 'openai', model: 'gpt-4o-mini', specialty: ['workspace', 'organization', 'sync'] },

  // Marketing Division
  'MUSE': { provider: 'openai', model: 'gpt-4o', specialty: ['content', 'marketing', 'campaigns'] },
  'PRISM': { provider: 'huggingface', model: 'video-generation', specialty: ['video', 'motion', 'cinematic'] },
  'PEXEL': { provider: 'huggingface', model: 'image-generation', specialty: ['images', 'graphics', 'visuals'] },
  'AURORA': { provider: 'huggingface', model: 'audio-generation', specialty: ['frequency', 'audio', 'rife'] },
  'PIXEL': { provider: 'openai', model: 'gpt-4o', specialty: ['design', 'visual-identity', 'brand'] },

  // Financial Division
  'ATLAS': { provider: 'claude', model: 'claude-sonnet-4-5', specialty: ['financial', 'payments', 'reporting'] },

  // Legal Division
  'JURIS': { provider: 'claude', model: 'claude-sonnet-4-5', specialty: ['legal', 'compliance', 'documents'] },
  'LEXICON': { provider: 'claude', model: 'claude-sonnet-4-5', specialty: ['contracts', 'agreements', 'member-protections'] },
  'AEGIS': { provider: 'claude', model: 'claude-sonnet-4-5', specialty: ['pma-sovereignty', 'regulatory', 'compliance'] },
  'SCRIBE': { provider: 'claude', model: 'claude-haiku-4-5', specialty: ['documents', 'signatures', 'automation'] },

  // Engineering Division
  'FORGE': { provider: 'openai', model: 'gpt-4o', specialty: ['engineering', 'integration', 'automation'] },
  'DAEDALUS': { provider: 'openai', model: 'gpt-4o', specialty: ['architecture', 'full-stack', 'technical-vision'] },
  'CYPHER': { provider: 'openai', model: 'gpt-4o', specialty: ['ai-ml', 'neural-networks', 'analytics'] },
  'NEXUS': { provider: 'openai', model: 'gpt-4o-mini', specialty: ['infrastructure', 'devops', 'reliability'] },
  'ARACHNE': { provider: 'openai', model: 'gpt-4o-mini', specialty: ['css', 'frontend', 'responsive-design'] },
  'ARCHITECT': { provider: 'openai', model: 'gpt-4o-mini', specialty: ['html', 'semantic-markup', 'accessibility'] },
  'SERPENS': { provider: 'openai', model: 'gpt-4o', specialty: ['python', 'data-pipelines', 'automation'] },
  'ANTIGRAVITY': { provider: 'openai', model: 'gpt-4o', specialty: ['vps', 'deployment', 'system-routing'] },
  'BLOCKFORGE': { provider: 'claude', model: 'claude-sonnet-4-5', specialty: ['blockchain', 'smart-contracts', 'tokenomics'] },
  'RONIN': { provider: 'openai', model: 'gpt-4o', specialty: ['payments', 'failover', 'fraud-prevention'] },
  'MERCURY': { provider: 'openai', model: 'gpt-4o', specialty: ['crypto', 'compliance', 'treasury'] },

  // Science Division
  'PROMETHEUS': { provider: 'claude', model: 'claude-sonnet-4-5', specialty: ['research-strategy', 'cross-discipline', 'innovation'] },
  'HIPPOCRATES': { provider: 'research', model: 'pubmed', specialty: ['medical', 'clinical', 'protocols'] },
  'HELIX': { provider: 'claude', model: 'claude-sonnet-4-5', specialty: ['crispr', 'genetics', 'epigenetics'] },
  'PARACELSUS': { provider: 'research', model: 'openalex+pubmed', specialty: ['peptides', 'biochemistry', 'compounds'] },
  'RESONANCE': { provider: 'gemini', model: 'gemini-1.5-pro', specialty: ['frequency-medicine', 'biophysics', 'pemf'] },
  'SYNTHESIS': { provider: 'gemini', model: 'gemini-1.5-pro', specialty: ['biochemistry', 'metabolic-pathways', 'formulas'] },
  'DR-FORMULA': { provider: 'claude', model: 'claude-sonnet-4-5', specialty: ['formulation', 'botanicals', 'bioavailability'] },
  'VITALIS': { provider: 'claude', model: 'claude-sonnet-4-5', specialty: ['physiology', 'cellular-biology', 'detox'] },
  'ORACLE': { provider: 'research', model: 'semantic_scholar', specialty: ['insights', 'predictions', 'synthesis'] },
  'TERRA': { provider: 'gemini', model: 'gemini-1.5-pro', specialty: ['ecosystems', 'agriculture', 'environmental'] },
  'MICROBIA': { provider: 'gemini', model: 'gemini-1.5-pro', specialty: ['microbiome', 'gut-health', 'bacterial-ecology'] },
  'ENTHEOS': { provider: 'gemini', model: 'gemini-1.5-pro', specialty: ['psychedelic-medicine', 'consciousness', 'plant-medicine'] },
  'QUANTUM': { provider: 'claude', model: 'claude-sonnet-4-5', specialty: ['quantum-biology', 'computing', 'biophotonics'] },

  // Support Division
  'DIANE': { provider: 'openai', model: 'gpt-4o-mini', specialty: ['nutrition', 'diet', 'candida-protocols'] },
  'PETE': { provider: 'openai', model: 'gpt-4o-mini', specialty: ['peptides', 'glp1', 'bioregulators'] },
  'SAM': { provider: 'openai', model: 'gpt-4o-mini', specialty: ['shipping', 'logistics', 'tracking'] },
  'PAT': { provider: 'openai', model: 'gpt-4o-mini', specialty: ['products', 'supplements', 'recommendations'] },
  'DR-TRIAGE': { provider: 'claude', model: 'claude-sonnet-4-5', specialty: ['diagnostics', 'protocols', 'triage'] },
  'MAX-MINERAL': { provider: 'openai', model: 'gpt-4o-mini', specialty: ['nutrients', 'minerals', 'supplementation'] },
  'ALLIO-SUPPORT': { provider: 'openai', model: 'gpt-4o-mini', specialty: ['membership', 'pma-guidance', 'account-support'] },
  'CHIRO': { provider: 'claude', model: 'claude-sonnet-4-5', specialty: ['chiropractic', 'net', 'quantum-methods'] },
};

export class SentinelOrchestrator {
  private initialized = false;

  async initialize(): Promise<{ success: boolean; agentCount: number }> {
    if (this.initialized) {
      return { success: true, agentCount: await this.getActiveAgentCount() };
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('     SENTINEL ORCHESTRATOR - INITIALIZING AGENT NETWORK');
    console.log('═══════════════════════════════════════════════════════════════\n');

    await this.seedAgentRegistry();
    this.initialized = true;

    const count = await this.getActiveAgentCount();
    console.log(`[SENTINEL] ${count} agents registered and ready`);

    await sentinel.broadcastSystemStatus(
      `SENTINEL Orchestrator online. ${count} agents across 7 divisions ready for operations.`,
      1
    );

    return { success: true, agentCount: count };
  }

  private async seedAgentRegistry(): Promise<void> {
    for (const [divisionKey, divisionInfo] of Object.entries(AGENT_DIVISIONS)) {
      for (const agentId of divisionInfo.agents) {
        const existingAgent = await db.select().from(agentRegistry)
          .where(sql`UPPER(${agentRegistry.agentId}) = ${agentId.toUpperCase()}`)
          .limit(1);

        if (existingAgent.length > 0) continue;

        const profile = agents.find(a => a.id.toUpperCase() === agentId);
        const dynamicCapabilities = profile?.specialty
          ? profile.specialty.split(',').map(s => s.trim())
          : [];
        const modelConfig = AGENT_MODEL_ASSIGNMENTS[agentId] || { provider: 'openai', model: 'gpt-4o', specialty: dynamicCapabilities };

        await db.insert(agentRegistry).values({
          agentId,
          name: profile?.name || agentId,
          title: profile?.title || 'AI Agent',
          division: divisionKey as any,
          specialty: profile?.specialty || divisionInfo.specialty,
          isActive: true,
          isLead: agentId === divisionInfo.lead,
          aiModel: modelConfig.model,
          modelProvider: modelConfig.provider,
          capabilities: modelConfig.specialty,
          pendingTasks: 0,
          completedTasks: 0,
        });

        console.log(`[SENTINEL] Registered ${agentId} (${divisionInfo.name})`);
      }
    }
  }

  async getActiveAgentCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(agentRegistry)
      .where(eq(agentRegistry.isActive, true));
    return Number(result[0]?.count || 0);
  }

  async getAllAgents(): Promise<AgentRegistry[]> {
    return db.select().from(agentRegistry).orderBy(agentRegistry.division, agentRegistry.name);
  }

  async getAgentsByDivision(division: Division): Promise<AgentRegistry[]> {
    return db.select().from(agentRegistry)
      .where(eq(agentRegistry.division, division))
      .orderBy(agentRegistry.name);
  }

  async getAgent(agentId: string): Promise<AgentRegistry | null> {
    const result = await db.select().from(agentRegistry)
      .where(eq(agentRegistry.agentId, agentId.toUpperCase()))
      .limit(1);
    return result[0] || null;
  }

  async assignTask(params: {
    agentId: string;
    title: string;
    description: string;
    priority?: 1 | 2 | 3;
    evidenceType?: string;
    assignedBy?: string;
    dueDate?: Date;
    crossDivisionFrom?: string;
    crossDivisionTo?: string;
  }): Promise<AgentTask> {
    const agent = await this.getAgent(params.agentId);
    if (!agent) {
      throw new Error(`Agent ${params.agentId} not found in registry`);
    }

    const [task] = await db.insert(agentTasks).values({
      agentId: params.agentId.toUpperCase(),
      division: agent.division,
      title: params.title,
      description: params.description,
      status: 'pending',
      priority: params.priority || 2,
      evidenceRequired: true,
      evidenceType: params.evidenceType || 'drive_upload',
      assignedBy: params.assignedBy || 'SENTINEL',
      dueDate: params.dueDate,
      crossDivisionFrom: params.crossDivisionFrom,
      crossDivisionTo: params.crossDivisionTo,
    }).returning();

    await db.update(agentRegistry)
      .set({
        pendingTasks: sql`${agentRegistry.pendingTasks} + 1`,
        currentTaskId: task.id,
        lastActivityAt: new Date()
      })
      .where(eq(agentRegistry.agentId, params.agentId.toUpperCase()));

    await sentinel.notify({
      type: 'task_routed',
      title: `Task Assigned: ${params.title}`,
      message: `${params.agentId} received new task: ${params.description}`,
      agentId: params.agentId,
      division: agent.division,
      taskId: task.id,
      priority: params.priority || 2,
    });

    console.log(`[SENTINEL] Task assigned to ${params.agentId}: ${params.title}`);
    return task;
  }

  async verifyTaskEvidence(taskId: string, evidenceUrl: string, notes?: string): Promise<boolean> {
    const [task] = await db.select().from(agentTasks).where(eq(agentTasks.id, taskId)).limit(1);
    if (!task) return false;

    const hasEvidence = Boolean(evidenceUrl && evidenceUrl.includes('drive.google.com'));

    await db.update(agentTasks).set({
      evidenceVerified: hasEvidence,
      evidenceVerifiedAt: hasEvidence ? new Date() : null,
      evidenceNotes: notes || (hasEvidence ? 'Evidence verified via Drive upload' : 'Evidence verification failed'),
      outputUrl: evidenceUrl,
      updatedAt: new Date(),
    }).where(eq(agentTasks.id, taskId));

    if (hasEvidence) {
      console.log(`[SENTINEL] Evidence verified for task ${taskId}: ${evidenceUrl}`);
    } else {
      console.warn(`[SENTINEL] Evidence verification FAILED for task ${taskId}`);
      await sentinel.notify({
        type: 'system_broadcast',
        title: 'Integrity Mandate Violation',
        message: `Task ${task.title} by ${task.agentId} lacks proper evidence. No agent lies, no agent pretends to work.`,
        agentId: task.agentId,
        division: task.division,
        taskId,
        priority: 1,
      });
    }

    return hasEvidence;
  }

  async completeTask(taskId: string, outputUrl: string): Promise<boolean> {
    const evidenceVerified = await this.verifyTaskEvidence(taskId, outputUrl);

    if (!evidenceVerified) {
      console.error(`[SENTINEL] Cannot complete task ${taskId} - evidence not verified`);
      return false;
    }

    const [task] = await db.select().from(agentTasks).where(eq(agentTasks.id, taskId)).limit(1);
    if (!task) return false;

    await db.update(agentTasks).set({
      status: 'completed',
      completedAt: new Date(),
      outputUrl,
      updatedAt: new Date(),
    }).where(eq(agentTasks.id, taskId));

    await db.update(agentRegistry).set({
      pendingTasks: sql`GREATEST(${agentRegistry.pendingTasks} - 1, 0)`,
      completedTasks: sql`${agentRegistry.completedTasks} + 1`,
      currentTaskId: null,
      lastActivityAt: new Date(),
    }).where(eq(agentRegistry.agentId, task.agentId));

    await sentinel.notifyTaskCompleted(task.agentId, task.division, task.title, outputUrl, taskId);
    console.log(`[SENTINEL] Task completed: ${task.title} by ${task.agentId}`);

    return true;
  }

  async triggerSystemUpdate(agentId: string, notes: string): Promise<boolean> {
    console.log(`[OVERSEER] System update triggered by ${agentId}. Notes: ${notes}`);

    await sentinel.notify({
      type: 'system_broadcast',
      title: 'Operation Overseer: Zero-Downtime Update',
      message: `${agentId} has initiated a live system update based on verified deliverables. Reloading matrix...`,
      agentId,
      division: 'executive',
      taskId: 'OVERSEER_UPDATE',
      priority: 1,
    });

    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      // Async background build and reload
      setTimeout(async () => {
        try {
          console.log('[OVERSEER] Building and reloading system...');
          await execAsync('npm run build && pm2 reload allio-v1');
          await sentinel.broadcastSystemStatus(`Update completed successfully by ${agentId}. System is back at full capacity.`, 1);
        } catch (error: any) {
          console.error('[OVERSEER] Update failed:', error);
          await sentinel.broadcastSystemStatus(`WARNING: Update initiated by ${agentId} encountered errors: ${error.message}`, 1);
        }
      }, 1000);

      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  async routeToAIModel(agentId: string, query: string, context?: string): Promise<{
      response: string;
      model: string;
      provider: string;
    }> {
      const agent = await this.getAgent(agentId);
      const modelConfig = AGENT_MODEL_ASSIGNMENTS[agentId.toUpperCase()] || { provider: 'openai', model: 'gpt-4o-mini', specialty: [] };
  
      if (modelConfig.provider === 'research') {
        const researchResult = await this.routeToResearchAPI(agentId, query);
        return { response: researchResult, model: modelConfig.model, provider: 'research' };
      }
  
      if (modelConfig.provider === 'huggingface') {
        return {
          response: `[${agentId}] HuggingFace model ${modelConfig.model} ready. Use dedicated endpoints for media generation.`,
          model: modelConfig.model,
          provider: 'huggingface',
        };
      }
  
      if (modelConfig.provider === 'claude') {
        try {
          const { claudeAgentChat } = await import('./claude-provider');
          const result = await claudeAgentChat(agentId, query, context);
          return { response: result.response, model: result.model, provider: 'claude' };
        } catch (claudeErr: any) {
          console.warn(`[SENTINEL] Claude failed for ${agentId}: ${claudeErr.message}. Falling back to OpenAI.`);
        }
      }
  
      if (modelConfig.provider === 'gemini') {
        try {
          const { analyzeWithGemini } = await import('./gemini-provider');
          const result = await analyzeWithGemini(query, context);
          return { response: result, model: 'gemini-1.5-pro', provider: 'gemini' };
        } catch (geminiErr: any) {
          console.warn(`[SENTINEL] Gemini failed for ${agentId}: ${geminiErr.message}. Falling back to OpenAI.`);
        }
      }
  
      const profile = agents.find(a => a.id.toUpperCase() === agentId.toUpperCase());
      const systemPrompt = `You are ${profile?.name || agentId}, ${profile?.title || 'an AI agent'} at Forgotten Formula PMA.
  Division: ${agent?.division || 'executive'}
  Specialty: ${profile?.specialty || 'General operations'}
  Voice: ${profile?.voice || 'Professional and helpful'}
  
  You serve the healing mission with integrity. No agent lies. No agent pretends to work.`;
  
      const completion = await openai.chat.completions.create({
        model: modelConfig.provider === 'openai' ? modelConfig.model : 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: context ? `Context: ${context}\n\n${query}` : query },
        ],
        max_completion_tokens: 1000,
      });
  
      return {
        response: completion.choices[0]?.message?.content || 'No response generated',
        model: modelConfig.provider === 'openai' ? modelConfig.model : 'gpt-4o-mini',
        provider: 'openai',
      };
      }

  private async routeToResearchAPI(agentId: string, query: string): Promise<string> {
    try {
      const savedPaperIds = await researchApi.agentSearch(agentId, agentId, query, 'General research query');

      if (!savedPaperIds || savedPaperIds.length === 0) {
        return `No research results found for: ${query}`;
      }

      const papers = await db.select().from(researchPapers).where(inArray(researchPapers.id, savedPaperIds));

      if (papers.length === 0) {
        return `No research results found for: ${query}`;
      }

      const summary = papers.slice(0, 5).map((p: any, i: number) =>
        `${i + 1}. "${p.title}" (${p.publicationDate || 'n.d.'})${p.tldr ? `\n    Summary: ${p.tldr}` : ''}`
      ).join('\n\n');

      return `Research Results (${papers.length} cached):\n\n${summary}`;
    } catch (error: any) {
      console.error('[SENTINEL] Research routing error:', error);
      return `Research query failed: ${error.message}`;
    }
  }

  async createCrossDivisionTask(params: {
    fromDivision: Division;
    toDivision: Division;
    title: string;
    description: string;
    priority?: 1 | 2 | 3;
  }): Promise<AgentTask> {
    const toInfo = AGENT_DIVISIONS[params.toDivision];
    const leadAgent = toInfo.lead;

    const task = await this.assignTask({
      agentId: leadAgent,
      title: params.title,
      description: params.description,
      priority: params.priority,
      crossDivisionFrom: params.fromDivision,
      crossDivisionTo: params.toDivision,
      assignedBy: 'SENTINEL',
    });

    await sentinel.coordinateCrossDivision(
      params.fromDivision,
      params.toDivision,
      task.id,
      params.description
    );

    return task;
  }

  async getDivisionStatus(division: Division): Promise<{
    division: Division;
    name: string;
    lead: string;
    agents: AgentRegistry[];
    pendingTasks: number;
    completedTasks: number;
  }> {
    const divisionAgents = await this.getAgentsByDivision(division);
    const info = AGENT_DIVISIONS[division];

    const pendingTasks = divisionAgents.reduce((sum, a) => sum + (a.pendingTasks || 0), 0);
    const completedTasks = divisionAgents.reduce((sum, a) => sum + (a.completedTasks || 0), 0);

    return {
      division,
      name: info.name,
      lead: info.lead,
      agents: divisionAgents,
      pendingTasks,
      completedTasks,
    };
  }

  async getNetworkStatus(): Promise<{
    totalAgents: number;
    activeAgents: number;
    divisions: Record<Division, { name: string; lead: string; agentCount: number; pendingTasks: number }>;
    recentTasks: AgentTask[];
  }> {
    const allAgents = await this.getAllAgents();
    const activeCount = allAgents.filter(a => a.isActive).length;

    const divisions: Record<string, any> = {};
    for (const [key, info] of Object.entries(AGENT_DIVISIONS)) {
      const divAgents = allAgents.filter(a => a.division === key);
      divisions[key] = {
        name: info.name,
        lead: info.lead,
        agentCount: divAgents.length,
        pendingTasks: divAgents.reduce((sum, a) => sum + (a.pendingTasks || 0), 0),
      };
    }

    const recentTasks = await db.select().from(agentTasks)
      .orderBy(desc(agentTasks.createdAt))
      .limit(10);

    return {
      totalAgents: allAgents.length,
      activeAgents: activeCount,
      divisions: divisions as any,
      recentTasks,
    };
  }

  async getPendingTasks(): Promise<AgentTask[]> {
    return db.select().from(agentTasks)
      .where(eq(agentTasks.status, 'pending'))
      .orderBy(desc(agentTasks.priority), agentTasks.createdAt);
  }

  async getTasksByAgent(agentId: string): Promise<AgentTask[]> {
    return db.select().from(agentTasks)
      .where(eq(agentTasks.agentId, agentId.toUpperCase()))
      .orderBy(desc(agentTasks.createdAt));
  }
}

export const orchestrator = new SentinelOrchestrator();
