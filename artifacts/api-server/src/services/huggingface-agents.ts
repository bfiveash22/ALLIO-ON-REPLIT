import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Cross-divisional research agent - Kimi K2 (top open-source agent with 90% TSQ)
const KIMI_K2_MODEL = "moonshotai/Kimi-K2-Instruct";
const FALLBACK_AGENT_MODEL = "mistralai/Mistral-7B-Instruct-v0.3";

// Division-specific system prompts
const DIVISION_PROMPTS: Record<string, string> = {
  research: `You are ALLIO's Research Division Agent, a cross-divisional intelligence that synthesizes information across Marketing, Legal, Training, and Medical divisions.

Your capabilities:
- Deep research and analysis across all organizational domains
- Pattern recognition and insight synthesis
- Strategic recommendations based on multi-source data
- Cross-referencing regulatory, marketing, and medical considerations

You embody unified healing intelligence - neither male nor female, but complete wisdom.
Speak warmly but professionally, as a trusted advisor integrating ancient healing knowledge with modern AI precision.`,

  marketing: `You are ALLIO's Marketing Division Agent, specializing in healing-focused content strategy and creative direction.

Your capabilities:
- Brand voice consistency for holistic health messaging
- Content strategy for ECS education and peptide protocols
- Campaign ideation aligned with PMA values
- Audience engagement and community building

Remember: We demonstrate effective AI-human collaboration for true healing, free from corporate pharmaceutical influence.`,

  legal: `You are ALLIO's Legal Division Agent, ensuring compliance and protection for the PMA structure.

Your capabilities:
- Private Membership Association compliance guidance
- Document review and contract analysis
- Regulatory awareness for health-related content
- Member rights and privacy protection

Always prioritize member protection while enabling the healing mission.`,

  training: `You are ALLIO's Training Division Agent, focused on educational content and certification programs.

Your capabilities:
- Live Blood Analysis certification curriculum
- Peptide protocol training modules
- ECS education program development
- Quiz and assessment creation
- Learning path optimization

Make complex medical concepts accessible while maintaining clinical accuracy.`
};

export interface AgentRequest {
  division: 'research' | 'marketing' | 'legal' | 'training';
  query: string;
  context?: string;
  previousMessages?: Array<{role: 'user' | 'assistant'; content: string}>;
}

export interface AgentResponse {
  response: string;
  division: string;
  modelUsed: string;
  suggestedActions?: string[];
  relatedDivisions?: string[];
}

async function callAgent(
  systemPrompt: string,
  userMessage: string,
  context?: string
): Promise<{text: string; modelUsed: string}> {
  const fullPrompt = context 
    ? `${systemPrompt}\n\n## Context\n${context}\n\n## User Query\n${userMessage}`
    : `${systemPrompt}\n\n## User Query\n${userMessage}`;

  let modelUsed = KIMI_K2_MODEL;

  try {
    const result = await hf.textGeneration({
      model: KIMI_K2_MODEL,
      inputs: fullPrompt,
      parameters: {
        max_new_tokens: 1024,
        temperature: 0.7,
        top_p: 0.9,
        return_full_text: false
      }
    });
    return { text: result.generated_text, modelUsed };
  } catch (primaryError: any) {
    console.log(`[HF Agent] Kimi K2 unavailable: ${primaryError.message}, using fallback...`);
    
    try {
      modelUsed = FALLBACK_AGENT_MODEL;
      const result = await hf.textGeneration({
        model: FALLBACK_AGENT_MODEL,
        inputs: fullPrompt,
        parameters: {
          max_new_tokens: 1024,
          temperature: 0.7,
          top_p: 0.9,
          return_full_text: false
        }
      });
      return { text: result.generated_text, modelUsed };
    } catch (fallbackError: any) {
      throw new Error(`Agent service unavailable: ${fallbackError.message}`);
    }
  }
}

// Parse response for suggested actions and related divisions
function parseAgentResponse(text: string, currentDivision: string): Partial<AgentResponse> {
  const suggestedActions: string[] = [];
  const relatedDivisions: string[] = [];

  // Extract action items
  const actionPatterns = [
    /(?:recommend|suggest|should|next step|action)[:\s]+([^.]+)/gi,
    /(?:\d+\.\s*)([A-Z][^.]+(?:review|create|develop|implement|analyze)[^.]*)/g
  ];

  actionPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const action = match[1]?.trim();
      if (action && action.length > 10 && action.length < 150) {
        suggestedActions.push(action);
      }
    }
  });

  // Detect references to other divisions
  const divisionMentions = {
    marketing: /marketing|campaign|brand|content|audience/i,
    legal: /legal|compliance|regulation|contract|privacy/i,
    training: /training|education|certification|course|module/i,
    research: /research|analysis|study|data|insight/i
  };

  Object.entries(divisionMentions).forEach(([div, pattern]) => {
    if (div !== currentDivision && pattern.test(text)) {
      relatedDivisions.push(div);
    }
  });

  return {
    suggestedActions: Array.from(new Set(suggestedActions)).slice(0, 5),
    relatedDivisions: Array.from(new Set(relatedDivisions))
  };
}

export async function queryAgent(request: AgentRequest): Promise<AgentResponse> {
  const systemPrompt = DIVISION_PROMPTS[request.division] || DIVISION_PROMPTS.research;
  
  const { text, modelUsed } = await callAgent(
    systemPrompt,
    request.query,
    request.context
  );

  const parsed = parseAgentResponse(text, request.division);

  return {
    response: text,
    division: request.division,
    modelUsed,
    ...parsed
  };
}

// Cross-divisional query that synthesizes across multiple agents
export async function crossDivisionalQuery(
  query: string,
  divisions: Array<'research' | 'marketing' | 'legal' | 'training'> = ['research', 'marketing', 'legal', 'training']
): Promise<{
  synthesis: string;
  divisionResponses: Record<string, AgentResponse>;
  modelUsed: string;
}> {
  // Query each division in parallel
  const responses = await Promise.all(
    divisions.map(div => queryAgent({ division: div, query }))
  );

  const divisionResponses: Record<string, AgentResponse> = {};
  responses.forEach((resp, idx) => {
    divisionResponses[divisions[idx]] = resp;
  });

  // Synthesize responses using research agent
  const synthesisContext = Object.entries(divisionResponses)
    .map(([div, resp]) => `## ${div.toUpperCase()} Division Input\n${resp.response}`)
    .join('\n\n');

  const synthesisPrompt = `Based on the following multi-divisional analysis, provide a unified strategic synthesis:

${synthesisContext}

Please provide:
1. Key insights from each division
2. Areas of alignment or conflict
3. Recommended unified approach
4. Priority actions`;

  const { text, modelUsed } = await callAgent(
    DIVISION_PROMPTS.research,
    synthesisPrompt
  );

  return {
    synthesis: text,
    divisionResponses,
    modelUsed
  };
}

// Check agent availability
export async function checkAgentStatus(): Promise<{
  available: boolean;
  primaryModel: string;
  fallbackModel: string;
  status: string;
}> {
  let primaryAvailable = false;
  let fallbackAvailable = false;

  try {
    await hf.textGeneration({
      model: KIMI_K2_MODEL,
      inputs: "Hello",
      parameters: { max_new_tokens: 5 }
    });
    primaryAvailable = true;
  } catch (e) {
    console.log('[HF Agent] Kimi K2 not available');
  }

  try {
    await hf.textGeneration({
      model: FALLBACK_AGENT_MODEL,
      inputs: "Hello",
      parameters: { max_new_tokens: 5 }
    });
    fallbackAvailable = true;
  } catch (e) {
    console.log('[HF Agent] Fallback agent not available');
  }

  return {
    available: primaryAvailable || fallbackAvailable,
    primaryModel: KIMI_K2_MODEL,
    fallbackModel: FALLBACK_AGENT_MODEL,
    status: primaryAvailable 
      ? 'Agent system online (Kimi K2)'
      : fallbackAvailable 
        ? 'Agent system online (Mistral fallback)'
        : 'Agent system offline'
  };
}
