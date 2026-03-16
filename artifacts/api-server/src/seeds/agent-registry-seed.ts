import { db } from '../db';
import { agentRegistry } from '@shared/schema';
import { sql } from 'drizzle-orm';
import { agents } from '@shared/agents';

const DIVISION_METADATA: Record<string, { name: string; lead: string; specialty: string }> = {
  executive: { name: 'Executive', lead: 'ATHENA', specialty: 'Strategic oversight, priority management, Trustee communication' },
  marketing: { name: 'Marketing', lead: 'MUSE', specialty: 'Content creation, video production, campaigns, member engagement' },
  science: { name: 'Science', lead: 'HELIX', specialty: 'Blood analysis, protocol development, research, healing modalities' },
  legal: { name: 'Legal', lead: 'JURIS', specialty: 'Compliance, document management, PMA protection, privacy' },
  financial: { name: 'Financial', lead: 'ATLAS', specialty: 'Payments, crypto, member billing, financial reporting' },
  engineering: { name: 'Engineering', lead: 'FORGE', specialty: 'Platform development, integrations, automation, infrastructure' },
  support: { name: 'Support', lead: 'DR-TRIAGE', specialty: 'Member support, onboarding, community, doctor network' },
};

const AGENT_MODEL_ASSIGNMENTS: Record<string, { provider: string; model: string; specialty: string[] }> = {
  'SENTINEL': { provider: 'openai', model: 'gpt-4o', specialty: ['orchestration', 'coordination', 'oversight'] },
  'ATHENA': { provider: 'claude', model: 'claude-sonnet-4-5', specialty: ['strategy', 'analysis', 'priority'] },
  'HERMES': { provider: 'openai', model: 'gpt-4o-mini', specialty: ['communication', 'messaging', 'notifications'] },
  'MUSE': { provider: 'openai', model: 'gpt-4o', specialty: ['content', 'copywriting', 'marketing'] },
  'PRISM': { provider: 'openai', model: 'gpt-4o', specialty: ['video', 'multimedia', 'production'] },
  'PIXEL': { provider: 'openai', model: 'gpt-4o', specialty: ['design', 'visual-identity', 'brand'] },
  'ATLAS': { provider: 'claude', model: 'claude-sonnet-4-5', specialty: ['financial', 'payments', 'reporting'] },
  'JURIS': { provider: 'claude', model: 'claude-sonnet-4-5', specialty: ['legal', 'compliance', 'documents'] },
  'AEGIS': { provider: 'openai', model: 'gpt-4o', specialty: ['security', 'privacy', 'pma-protection'] },
  'FORGE': { provider: 'openai', model: 'gpt-4o', specialty: ['engineering', 'integration', 'automation'] },
  'DAEDALUS': { provider: 'openai', model: 'gpt-4o', specialty: ['architecture', 'full-stack', 'technical-vision'] },
  'CYPHER': { provider: 'openai', model: 'gpt-4o', specialty: ['ai-ml', 'neural-networks', 'analytics'] },
  'NEXUS': { provider: 'openai', model: 'gpt-4o-mini', specialty: ['infrastructure', 'devops', 'reliability'] },
  'ARACHNE': { provider: 'openai', model: 'gpt-4o-mini', specialty: ['css', 'frontend', 'responsive-design'] },
  'HELIX': { provider: 'openai', model: 'gpt-4o', specialty: ['research', 'protocols', 'science'] },
  'PARACELSUS': { provider: 'openai', model: 'gpt-4o', specialty: ['protocols', 'dosing', 'pharmacology'] },
  'DR-FORMULA': { provider: 'openai', model: 'gpt-4o', specialty: ['patient-protocols', 'formulation', 'assessment'] },
};

export async function seedAgentRegistry(): Promise<void> {
  let registered = 0;
  let skipped = 0;

  for (const agent of agents) {
    const agentId = agent.id.toUpperCase();
    const division = agent.division;

    if (!DIVISION_METADATA[division]) continue;

    const existingAgent = await db.select({ agentId: agentRegistry.agentId })
      .from(agentRegistry)
      .where(sql`UPPER(${agentRegistry.agentId}) = ${agentId}`)
      .limit(1);

    if (existingAgent.length > 0) {
      skipped++;
      continue;
    }

    const divMeta = DIVISION_METADATA[division];
    const modelConfig = AGENT_MODEL_ASSIGNMENTS[agentId] || { provider: 'openai', model: 'gpt-4o', specialty: [] };
    const dynamicCapabilities = modelConfig.specialty.length > 0
      ? modelConfig.specialty
      : (agent.specialty ? agent.specialty.split(',').map((s: string) => s.trim()) : []);

    await db.insert(agentRegistry).values({
      agentId,
      name: agent.name || agentId,
      title: agent.title || 'AI Agent',
      division: division as any,
      specialty: agent.specialty || divMeta.specialty,
      isActive: true,
      isLead: agentId === divMeta.lead,
      aiModel: modelConfig.model,
      modelProvider: modelConfig.provider,
      capabilities: dynamicCapabilities,
      pendingTasks: 0,
      completedTasks: 0,
    });

    registered++;
  }

  if (registered > 0) {
    console.log(`[agent-registry-seed] Registered ${registered} new agents (${skipped} already existed)`);
  } else {
    console.log(`[agent-registry-seed] All ${skipped} agents already registered`);
  }
}
