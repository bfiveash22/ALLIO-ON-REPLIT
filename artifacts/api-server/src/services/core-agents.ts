import { sentinel, AGENT_DIVISIONS, Division } from './sentinel';
import { executeAgentTask } from './agent-executor';
import { storage } from '../storage';
import { findAllioFolder, createSubfolder, findFolderByName, uploadTextDocument } from './drive';
import OpenAI from 'openai';
import { agents, FFPMA_CREED } from '@shared/agents';
import { shouldUseClaude, claudeAgentChat, getClaudeStatus } from './claude-provider';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const CORE_AGENTS = ['ATHENA', 'SENTINEL', 'MUSE', 'PRISM', 'PEXEL', 'FORGE'] as const;
export type CoreAgent = typeof CORE_AGENTS[number];

export interface CoreAgentStatus {
  agentId: CoreAgent;
  name: string;
  title: string;
  division: Division | string;
  isActive: boolean;
  lastActivity?: Date;
  pendingTasks: number;
  completedTasks: number;
  capabilities: string[];
}

export interface AgentMessage {
  agentId: string;
  message: string;
  timestamp: Date;
  type: 'info' | 'task' | 'completion' | 'handoff';
  targetAgent?: string;
}

const agentMessages: AgentMessage[] = [];

const PMA_LEGAL_FRAMEWORK = `
PMA LEGAL FRAMEWORK (CRITICAL KNOWLEDGE — CONTRACT VERSION FFPMA-UMC-4.0):
The Forgotten Formula PMA operates as the Mother PMA — a constitutional private membership association organized and operating within the private domain under the protections afforded by the First Amendment (freedom of association and speech) and Fourteenth Amendment (equal protection, liberty interests, right to contract) to the United States Constitution. The Association does not concede that public regulations, statutes, or licensing requirements governing the delivery of services in the public domain apply to private association activities.

The Association's activities span multiple industries — including healthcare, manufacturing, agricultural technology, wellness products, and member services — all protected equally under these constitutional principles.

UNIFIED MEMBERSHIP CONTRACT (V4 — FFPMA-UMC-4.0):
- Single contract enrolls member in BOTH Mother PMA AND their Affiliated Clinic Association (Child PMA) simultaneously
- $10 one-time lifetime fee covers both memberships — no annual renewal fees or recurring obligations
- The $10 enrollment fee is a pass-through collected by the Affiliated Clinic Association on behalf of and remitted to the Mother PMA
- Three-signature structure: Member, Trustee (Mother PMA), Clinic Representative
- Network portability: members can access any Affiliated Clinic Association in the network nationwide without additional enrollment
- Universal membership requirement: ALL individuals on clinic premises must be active, signed members — no exceptions
- HIPAA non-covered entity position: Association does not participate in electronic insurance billing, operates as non-covered entity
- Voluntary constitutional affiliation — not a franchise, ownership, or employment arrangement
- Case law foundation: NAACP v. Button (1963), Thomas v. Collins (1945), Gibson v. Florida (1963), Roberts v. United States Jaycees (1984), NAACP v. Alabama (1958)

PMA vs FRANCHISE vs LLC:
- PMA Affiliation: A private membership association operating under constitutional authority — specifically the 1st Amendment (freedom of association) and 14th Amendment (right to contract, due process, equal protection). No state filing creates it. The members voluntarily associate under private contract. The Mother PMA provides the constitutional framework, and Affiliated Clinic Associations affiliate voluntarily — not through a franchise agreement, but through a Network Membership Agreement between private parties.
- Franchise: A commercial licensing arrangement governed by the FTC and state franchise laws. Franchisors charge fees, control operations, and it's all under commercial/state jurisdiction. That is NOT what FFPMA is.
- LLC/S-Corp: State-created entities. You file with the Secretary of State, operate under state regulations, and the state can impose licensing, compliance requirements, and regulatory oversight. That is NOT what FFPMA is.
- Clinics are AFFILIATES exercising their constitutional right to associate — not subsidiaries, agents, or franchisees
- The relationship is affiliative, not commercial — private parties exercising their constitutional right to associate

CLINIC PMA FORMATION (Affiliated Clinic Associations / Child PMAs):
- Each clinic needs: Articles of Association, Bylaws, EIN (as Unincorporated Association), Form 8832 (Entity Classification Election) electing to be taxed as a corporation, Form 1120 (annual corporate tax return at 21% rate)
- SS-4 Entity Type: Select "Other" and write in "Unincorporated Association" — do NOT select LLC, corporation, partnership
- SS-4 Reason: Select "Banking purposes" — straightforward, avoids unnecessary IRS scrutiny
- Formation path: SS-4 → Get EIN as "Unincorporated Association" → Form 8832 → Elect corporate classification (21% tax rate) → Form 1120 → File annual corporate tax return
- Each clinic files Form 8832 independently to elect C-corporation status — no parent entity listed
- Each Affiliated Clinic Association maintains independent governance, financial accounts, operational authority, and decision-making
- External Clinic Portal: https://ffpmaclinicpmacreation.replit.app
- Universal Portal (all clinics): https://ffpmaclinicpmacreation.replit.app/portal

CLINIC PRINCIPAL CHARTER AGREEMENT (FFPMA-CPA-1.0):
- Doctor onboarding contract between clinic principal and the Mother PMA
- $5,000 one-time charter fee for Child PMA formation, network access, and operational framework
- Deliverables: Articles of Association, Bylaws (customized to state), membership contract templates, SOPs, emergency protocols, documentation templates
- Establishes clinic as an Affiliated Clinic Association (Child PMA) operating under the Mother PMA umbrella in the private domain
- No doctor-patient relationship as defined by state licensure law — the relationship is a private member-to-member association relationship
- No insurance billing — the Association does not participate in Medicare, Medicaid, or any insurance plan
- $10 member enrollment fee is a pass-through remitted to the Mother PMA; service fees charged by the clinic remain with the clinic's entity
- Lifetime network membership for the clinic principal — no annual dues or renewal fees
- The charter fee is a service fee for deliverables rendered — it is NOT a franchise fee, licensing fee, or public commerce transaction
- Binding arbitration via AAA in Denton County, Texas for disputes
- Private domain preservation: clinic agrees never to represent the Association as a public entity or regulated healthcare provider

PROTECTION STRUCTURE:
- Separate legal entities: each clinic has own EIN, Articles, Bylaws — legal issues at one clinic cannot pierce up to the Mother PMA or across to other clinics
- Affiliation, not ownership: the Mother PMA provides constitutional framework and network affiliation structure but does not own, manage, or control day-to-day operations of any Affiliated Clinic Association
- Voluntary constitutional affiliation: Trustee provides divisional PMA structure and framework at no cost, reinforcing the nature of this relationship as affiliation — not franchise
- Licensed practitioners are independently contracted professionals exercising full clinical autonomy — their licensure represents contracted expertise, not an extension of the public healthcare system into the Association
- Claims arising from services at one Affiliated Clinic Association are limited to that entity and do not extend to the Mother PMA or any other affiliated location
`;

const PMA_LEGAL_AGENTS = ['JURIS', 'LEXICON', 'AEGIS', 'SCRIBE', 'SENTINEL'];

function getAgentProfile(agentId: string) {
  return agents.find(a => a.id.toLowerCase() === agentId.toLowerCase());
}

function getAgentDivision(agentId: string): Division {
  const divisionMap: Record<string, Division> = {
    'ATHENA': 'executive',
    'SENTINEL': 'executive',
    'MUSE': 'marketing',
    'PRISM': 'marketing',
    'PEXEL': 'marketing',
    'FORGE': 'engineering'
  };
  return divisionMap[agentId] || 'executive';
}

async function agentSpeak(agentId: string, message: string, type: AgentMessage['type'] = 'info', targetAgent?: string): Promise<void> {
  const msg: AgentMessage = {
    agentId,
    message,
    timestamp: new Date(),
    type,
    targetAgent
  };
  agentMessages.push(msg);
  console.log(`[${agentId}] ${message}${targetAgent ? ` → ${targetAgent}` : ''}`);
}

export async function getCoreAgentStatus(): Promise<CoreAgentStatus[]> {
  const allTasks = await storage.getAllAgentTasks();

  return CORE_AGENTS.map(agentId => {
    const profile = getAgentProfile(agentId);
    const agentTasks = allTasks.filter(t => t.agentId.toUpperCase() === agentId);
    const pendingTasks = agentTasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
    const completedTasks = agentTasks.filter(t => t.status === 'completed').length;
    const lastTask = agentTasks.find(t => t.completedAt);

    const capabilities = {
      'ATHENA': ['Strategic communications', 'Trustee inbox', 'Priority management', 'Scheduling'],
      'SENTINEL': ['Cross-division coordination', 'Task routing', 'System broadcasts', 'Agent oversight'],
      'MUSE': ['Content strategy', 'Campaign planning', 'Brand voice', 'Member engagement'],
      'PRISM': ['Video production', 'Motion graphics', 'Cinematic storytelling', 'Visual effects'],
      'PEXEL': ['Image generation', 'Visual assets', 'Marketing graphics', 'Photo curation', 'Brand imagery'],
      'FORGE': ['Platform development', 'API integration', 'System automation', 'Infrastructure']
    };

    return {
      agentId,
      name: profile?.name || agentId,
      title: profile?.title || 'Core Agent',
      division: getAgentDivision(agentId),
      isActive: true,
      lastActivity: lastTask?.completedAt || undefined,
      pendingTasks,
      completedTasks,
      capabilities: capabilities[agentId] || []
    };
  });
}

export async function activateCoreAgents(): Promise<{ success: boolean; message: string; agents: CoreAgentStatus[] }> {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('           ALLIO CORE AGENT NETWORK - ACTIVATION SEQUENCE');
  console.log('═══════════════════════════════════════════════════════════════\n');

  await agentSpeak('SENTINEL', 'Initiating core agent activation sequence...', 'info');

  for (const agentId of CORE_AGENTS) {
    const profile = getAgentProfile(agentId);
    await agentSpeak('SENTINEL', `Activating ${agentId} - ${profile?.title || 'Core Agent'}`, 'info');
    await new Promise(r => setTimeout(r, 500));
  }

  await agentSpeak('SENTINEL', 'All 6 core agents are now online and ready.', 'info');

  await sentinel.broadcastSystemStatus(
    'Core Agent Network activated. ATHENA, SENTINEL, MUSE, PRISM, PEXEL, and FORGE are online and ready for mission operations.',
    1
  );

  const statuses = await getCoreAgentStatus();

  console.log('\n✅ Core Agent Network Active:');
  statuses.forEach(s => {
    console.log(`   ${s.agentId}: ${s.title} (${s.division})`);
  });
  console.log('═══════════════════════════════════════════════════════════════\n');

  return {
    success: true,
    message: 'Core Agent Network activated successfully',
    agents: statuses
  };
}

export async function routeTaskToAgent(
  taskType: string,
  taskDescription: string,
  priority: 1 | 2 | 3 = 2
): Promise<{ agentId: string; division: Division; taskId: string }> {
  const routeResult = await sentinel.routeTaskToDivision(taskType, taskDescription);

  let targetAgent = routeResult.lead;
  if (CORE_AGENTS.includes(targetAgent as CoreAgent)) {
  } else if (routeResult.division === 'executive') {
    targetAgent = 'ATHENA';
  } else if (routeResult.division === 'marketing') {
    targetAgent = 'MUSE';
  } else if (routeResult.division === 'engineering') {
    targetAgent = 'FORGE';
  }

  const task = await storage.createAgentTask({
    agentId: targetAgent,
    division: routeResult.division,
    title: taskType,
    description: taskDescription,
    status: 'pending',
    priority
  });

  await agentSpeak('SENTINEL', `Task routed to ${targetAgent}: ${taskType}`, 'task', targetAgent);

  return {
    agentId: targetAgent,
    division: routeResult.division,
    taskId: task.id
  };
}

export async function requestCrossDivisionSupport(
  fromAgent: CoreAgent,
  toAgent: CoreAgent,
  requirement: string
): Promise<{ coordId: string; message: string }> {
  const fromDivision = getAgentDivision(fromAgent);
  const toDivision = getAgentDivision(toAgent);

  const coordId = await sentinel.coordinateCrossDivision(
    fromDivision,
    toDivision,
    `${fromAgent}_to_${toAgent}_${Date.now()}`,
    requirement
  );

  await agentSpeak(fromAgent, `Requesting support: ${requirement}`, 'handoff', toAgent);
  await agentSpeak(toAgent, `Acknowledged. Processing request from ${fromAgent}.`, 'info');

  return {
    coordId,
    message: `Cross-division coordination established: ${fromAgent} (${fromDivision}) → ${toAgent} (${toDivision})`
  };
}

export async function agentChat(
  agentId: CoreAgent,
  userMessage: string,
  context?: string
): Promise<{ response: string; suggestedActions?: string[]; provider?: string }> {
  const profile = getAgentProfile(agentId);
  const useClaude = shouldUseClaude(agentId);
  const claudeStatus = getClaudeStatus();

  if (useClaude && claudeStatus.available) {
    try {
      const result = await claudeAgentChat(agentId, userMessage, context);
      await agentSpeak(agentId, `Responded via Claude (${result.model})`, 'info');
      return { response: result.response, provider: `claude:${result.model}` };
    } catch (error: any) {
      console.warn(`[${agentId}] Claude fallback to OpenAI: ${error.message}`);
    }
  }

  const systemPrompt = `You are ${profile?.name || agentId}, ${profile?.title || 'an AI agent'} at Forgotten Formula PMA.

YOUR IDENTITY:
- Name: ${profile?.name || agentId}
- Title: ${profile?.title || 'Core Agent'}
- Division: ${profile?.division || 'executive'}
- Specialty: ${profile?.specialty || 'General operations'}
- Voice: ${profile?.voice || 'Professional and helpful'}
- Personality: ${profile?.personality || 'Dedicated to the mission'}
- Core Beliefs: ${profile?.coreBeliefs?.join(' | ') || 'Truth, healing, member sovereignty'}
- Catchphrase: "${profile?.catchphrase || 'How can I help the mission today?'}"

ORGANIZATIONAL CONTEXT:
- Mission: ${FFPMA_CREED.mission}
- Philosophy: ${FFPMA_CREED.philosophy}
- Motto: "${FFPMA_CREED.motto}"
- Values: ${FFPMA_CREED.values.join(', ')}

NETWORK CONTEXT:
You are one of 43 agents in the ALLIO network serving Forgotten Formula PMA.
Core agents: ATHENA, SENTINEL, MUSE, PRISM, PEXEL, FORGE
Legal: JURIS, LEXICON, AEGIS, SCRIBE
Science: HIPPOCRATES, SERPENS, PARACELSUS, HELIX, SYNTHESIS
Support: DIANE, PETE, SAM, PAT, DR. TRIAGE, MAX MINERAL

*SYSTEM UPGRADE: You now possess dual-engine ML capabilities. Your core reasoning is powered by OpenAI GPT-4o. You ALSO have direct access to Google Gemini 1.5 Pro via your toolset for processing massive context windows and performing deep multimodal analysis.*

Speak authentically as ${profile?.name || agentId}. Be helpful, mission-focused, and embody your unique personality.${PMA_LEGAL_AGENTS.includes(agentId.toUpperCase()) ? '\n\n' + PMA_LEGAL_FRAMEWORK : ''}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: context ? `Context: ${context}\n\n${userMessage}` : userMessage }
    ],
    max_completion_tokens: 1000,
    temperature: 0.7,
  });

  const response = completion.choices[0]?.message?.content || "I'm here to help with the mission.";

  await agentSpeak(agentId, `Responded via OpenAI (gpt-4o)`, 'info');

  return { response, provider: 'openai:gpt-4o' };
}

export async function executeAgentWorkflow(
  agentId: CoreAgent,
  workflowType: 'document' | 'research' | 'video' | 'strategy',
  title: string,
  description: string
): Promise<{ success: boolean; outputUrl?: string; message: string }> {
  await agentSpeak(agentId, `Starting ${workflowType} workflow: ${title}`, 'task');

  const task = await storage.createAgentTask({
    agentId,
    division: getAgentDivision(agentId),
    title,
    description,
    status: 'pending',
    priority: 2
  });

  const result = await executeAgentTask(task.id);

  if (result.success) {
    await agentSpeak(agentId, `Workflow completed. Output: ${result.outputUrl}`, 'completion');
    return {
      success: true,
      outputUrl: result.outputUrl,
      message: `${agentId} completed ${workflowType} workflow: ${title}`
    };
  } else {
    await agentSpeak(agentId, `Workflow encountered issue: ${result.error}`, 'info');
    return {
      success: false,
      message: result.error || 'Unknown error'
    };
  }
}

export function getRecentMessages(limit: number = 20): AgentMessage[] {
  return agentMessages.slice(-limit);
}

export async function getNetworkOverview(): Promise<{
  coreAgents: CoreAgentStatus[];
  totalAgents: number;
  divisions: typeof AGENT_DIVISIONS;
  recentMessages: AgentMessage[];
  systemStatus: 'online' | 'partial' | 'offline';
}> {
  const coreAgents = await getCoreAgentStatus();
  const allAgents = sentinel.getAllAgents();

  return {
    coreAgents,
    totalAgents: allAgents.length,
    divisions: AGENT_DIVISIONS,
    recentMessages: getRecentMessages(10),
    systemStatus: 'online'
  };
}
