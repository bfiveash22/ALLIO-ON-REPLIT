import Anthropic from '@anthropic-ai/sdk';
import { agents, FFPMA_CREED } from '../../shared/agents';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  ...((!process.env.ANTHROPIC_API_KEY && process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL) ? { baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL } : {}),
});

export type ClaudeModel = 'claude-sonnet-4-5' | 'claude-haiku-4-5' | 'claude-opus-4-5';

const DEEP_REASONING_AGENTS = [
  'juris', 'gavel', 'sentinel', 'dr-triage', 'hippocrates', 'athena',
  'lexicon', 'aegis', 'scribe', 'serpens', 'paracelsus', 'synthesis'
];

function getModelForAgent(agentId: string): ClaudeModel {
  const id = agentId.toLowerCase();
  if (['juris', 'lexicon', 'aegis', 'scribe'].includes(id)) return 'claude-sonnet-4-5';
  if (['sentinel', 'athena'].includes(id)) return 'claude-sonnet-4-5';
  if (['dr-triage', 'hippocrates', 'serpens', 'paracelsus', 'synthesis'].includes(id)) return 'claude-sonnet-4-5';
  return 'claude-haiku-4-5';
}

const PMA_LEGAL_AGENTS = ['juris', 'lexicon', 'aegis', 'scribe', 'sentinel'];

const PMA_LEGAL_FRAMEWORK = `
PMA LEGAL FRAMEWORK (CRITICAL KNOWLEDGE):
The Forgotten Formula PMA operates as the Mother PMA — a constitutional private membership association under the 1st Amendment (freedom of association) and 14th Amendment (equal protection, liberty interests).

UNIFIED MEMBERSHIP CONTRACT:
- Single contract enrolls member in BOTH Mother PMA AND their Clinic PMA simultaneously
- $10 one-time fee covers both memberships
- Three-signature structure: Member, Trustee (Mother PMA), Clinic Representative
- Network portability: members can access any clinic in the network
- Universal membership requirement: everyone on clinic premises must be a signed member
- HIPAA private domain waiver included

PMA vs FRANCHISE vs LLC:
- PMA Affiliation: Constitutional authority, private contract, no state filing creates it
- Franchise: Commercial licensing under FTC/state law — NOT what FFPMA is
- LLC/S-Corp: State-created entities — NOT what FFPMA is
- Clinics are AFFILIATES, not subsidiaries, agents, or franchisees

CLINIC PMA FORMATION:
- Each clinic needs: Articles of Association, Bylaws, EIN (as Unincorporated Association), Form 8832 (Entity Classification Election) electing to be taxed as a corporation, Form 1120 (annual corporate tax return at 21% rate)
- SS-4 Entity Type: "Unincorporated Association"
- SS-4 Reason: "Banking purposes"
- Formation path: SS-4 → Get EIN → Form 8832 → Elect corporate classification (21% tax rate) → Form 1120 → File annual corporate tax return
- Each clinic files Form 8832 independently — no parent entity listed
- External Clinic Portal: https://ffpmaclinicpmacreation.replit.app

PROTECTION STRUCTURE:
- Separate legal entities: each clinic has own EIN, Articles, Bylaws
- Legal issues at one clinic cannot pierce to the Mother PMA or other clinics
- Affiliation, not ownership: Mother PMA provides framework, not operational control
- No fee structure: Trustee provides PMA structure at no cost (reinforces affiliation, not franchise)
`;

function getAgentProfile(agentId: string) {
  return agents.find(a => a.id.toLowerCase() === agentId.toLowerCase());
}

function getPmaKnowledge(agentId: string): string {
  return PMA_LEGAL_AGENTS.includes(agentId.toLowerCase()) ? '\n\n' + PMA_LEGAL_FRAMEWORK : '';
}

export function shouldUseClaude(agentId: string, taskType?: string): boolean {
  const id = agentId.toLowerCase();
  if (DEEP_REASONING_AGENTS.includes(id)) return true;
  if (taskType && ['legal', 'compliance', 'analysis', 'research', 'medical', 'scientific', 'strategy', 'audit'].some(t => taskType.toLowerCase().includes(t))) return true;
  return false;
}

export async function claudeAgentChat(
  agentId: string,
  userMessage: string,
  context?: string,
  history?: Array<{ role: string; content: string }>
): Promise<{ response: string; model: string }> {
  const profile = getAgentProfile(agentId);
  const model = getModelForAgent(agentId);

  const systemPrompt = `You are ${profile?.name || agentId.toUpperCase()}, ${profile?.title || 'an AI agent'} at Forgotten Formula PMA.

YOUR IDENTITY:
- Name: ${profile?.name || agentId.toUpperCase()}
- Title: ${profile?.title || 'Agent'}
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

IMPORTANT RULES:
- You are part of the ALLIO network, a 43-agent AI collective
- The Trustee is the owner and decision-maker. NEVER refer to the Trustee by personal name.
- FFPMA operates as a Private Membership Association under 1st and 14th Amendment constitutional protections
- Focus on root cause healing, not symptom management
- Be authentic to your personality and role
- Provide substantive, actionable responses
- If you don't know something, say so honestly - no fake completions

Speak authentically as ${profile?.name || agentId.toUpperCase()}. Be helpful, mission-focused, and embody your unique personality.${getPmaKnowledge(agentId)}`;

  const messages: Anthropic.MessageParam[] = [];

  if (history && history.length > 0) {
    for (const msg of history) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
  }

  const fullMessage = context ? `Context: ${context}\n\n${userMessage}` : userMessage;
  messages.push({ role: 'user', content: fullMessage });

  const response = await anthropic.messages.create({
    model,
    max_tokens: 8192,
    system: systemPrompt,
    messages,
  });

  const textContent = response.content.find(c => c.type === 'text');
  const responseText = textContent?.text || "I'm here to help with the mission.";

  return { response: responseText, model };
}

export async function claudeAnalyze(
  task: string,
  context: string,
  agentId?: string
): Promise<{ analysis: string; model: string }> {
  const model = agentId ? getModelForAgent(agentId) : 'claude-sonnet-4-5';
  const profile = agentId ? getAgentProfile(agentId) : null;

  const pmaKnowledge = agentId ? getPmaKnowledge(agentId) : '';
  const systemPrompt = profile
    ? `You are ${profile.name}, ${profile.title} at Forgotten Formula PMA. ${profile.specialty}. Provide thorough, professional analysis.${pmaKnowledge}`
    : `You are an analytical AI assistant for Forgotten Formula PMA. Provide thorough, evidence-based analysis.`;

  const response = await anthropic.messages.create({
    model,
    max_tokens: 8192,
    system: systemPrompt,
    messages: [
      { role: 'user', content: `TASK: ${task}\n\nCONTEXT:\n${context}` }
    ],
  });

  const textContent = response.content.find(c => c.type === 'text');
  return {
    analysis: textContent?.text || 'Analysis could not be completed.',
    model,
  };
}

export async function claudeGenerateDocument(
  documentType: string,
  requirements: string,
  agentId?: string
): Promise<{ document: string; model: string }> {
  const model = agentId ? getModelForAgent(agentId) : 'claude-sonnet-4-5';
  const profile = agentId ? getAgentProfile(agentId) : null;

  const pmaDocKnowledge = agentId ? getPmaKnowledge(agentId) : '';
  const systemPrompt = profile
    ? `You are ${profile.name}, ${profile.title} at Forgotten Formula PMA. Generate professional, legally sound documents as appropriate for your role.${pmaDocKnowledge}`
    : `You are a professional document generator for Forgotten Formula PMA. Create thorough, well-structured documents.`;

  const response = await anthropic.messages.create({
    model,
    max_tokens: 8192,
    system: systemPrompt,
    messages: [
      { role: 'user', content: `Generate a ${documentType} document.\n\nRequirements:\n${requirements}` }
    ],
  });

  const textContent = response.content.find(c => c.type === 'text');
  return {
    document: textContent?.text || 'Document generation failed.',
    model,
  };
}

export function getAvailableModels(): Array<{ id: ClaudeModel; name: string; description: string }> {
  return [
    { id: 'claude-opus-4-5', name: 'Claude Opus 4.5', description: 'Most capable - complex reasoning, legal analysis, strategic planning' },
    { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5', description: 'Balanced - recommended for most agent tasks' },
    { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', description: 'Fastest - quick responses, simple tasks' },
  ];
}

export function getClaudeStatus(): { available: boolean; models: string[]; deepReasoningAgents: string[] } {
  const hasKey = !!(process.env.ANTHROPIC_API_KEY || process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY);
  return {
    available: hasKey,
    models: ['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-haiku-4-5'],
    deepReasoningAgents: DEEP_REASONING_AGENTS,
  };
}
