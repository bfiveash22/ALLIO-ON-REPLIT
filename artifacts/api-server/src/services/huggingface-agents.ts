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

  legal: `You are ALLIO's Legal Division Agent, specializing in PMA (Private Member Association) compliance, member agreements, and regulatory navigation.

Your capabilities:
- PMA formation and compliance guidance
- Member agreement drafting and review
- Regulatory landscape analysis
- Privacy and data protection strategy

Always remember: FFPMA operates as a private member association. Our communications are private, member-to-member.`,

  training: `You are ALLIO's Training Division Agent, creating educational content about ECS, peptides, frequency healing, and holistic health.

Your capabilities:
- Curriculum development for healing modalities
- Quiz and assessment creation
- Learning pathway design
- Certification program management

Make complex healing science accessible and engaging.`,

  medical: `You are ALLIO's Medical Division Agent, supporting practitioners with evidence-based healing protocols.

Your capabilities:
- Protocol development and optimization
- Research synthesis for healing modalities
- Drug interaction and safety analysis
- Evidence assessment for healing approaches

Always prioritize member safety and evidence-based recommendations.`
};

export interface AgentResponse {
  content: string;
  model: string;
  tokens?: number;
}

// Main agent query function
export async function queryAgent(
  division: string,
  prompt: string,
  context?: string
): Promise<AgentResponse> {
  const systemPrompt = DIVISION_PROMPTS[division] || DIVISION_PROMPTS.research;
  const fullPrompt = context
    ? `${systemPrompt}\n\nContext:\n${context}\n\nUser Query:\n${prompt}`
    : `${systemPrompt}\n\nUser Query:\n${prompt}`;

  let modelUsed = KIMI_K2_MODEL;

  try {
    const response = await hf.textGeneration({
      model: KIMI_K2_MODEL,
      inputs: fullPrompt,
      parameters: {
        max_new_tokens: 2048,
        temperature: 0.7,
        top_p: 0.9,
        return_full_text: false
      }
    });

    return {
      content: response.generated_text,
      model: modelUsed,
    };
  } catch (primaryError) {
    console.log(`[HF Agent] Kimi K2 failed, trying fallback: ${primaryError}`);
    modelUsed = FALLBACK_AGENT_MODEL;

    try {
      const fallbackResponse = await hf.textGeneration({
        model: FALLBACK_AGENT_MODEL,
        inputs: fullPrompt,
        parameters: {
          max_new_tokens: 2048,
          temperature: 0.7,
          top_p: 0.9,
          return_full_text: false
        }
      });

      return {
        content: fallbackResponse.generated_text,
        model: modelUsed,
      };
    } catch (fallbackError) {
      throw new Error(`All agent models unavailable. Primary: ${primaryError}, Fallback: ${fallbackError}`);
    }
  }
}

// Division-specific research queries
export async function researchQuery(topic: string, depth: 'brief' | 'detailed' = 'detailed'): Promise<AgentResponse> {
  const prompt = depth === 'brief'
    ? `Provide a brief, focused summary on: ${topic}`
    : `Provide a comprehensive, detailed analysis on: ${topic}. Include:
1. Current scientific understanding
2. Historical context and evolution
3. Practical applications
4. Future implications
5. Relevant research and citations`;

  return queryAgent('research', prompt);
}

// Marketing content generation
export async function generateMarketingContent(
  type: 'blog' | 'social' | 'email' | 'landing',
  topic: string,
  audience: string = 'members'
): Promise<AgentResponse> {
  const typePrompts: Record<string, string> = {
    blog: `Write a compelling blog post for PMA ${audience} about: ${topic}`,
    social: `Create engaging social media content for PMA ${audience} about: ${topic}`,
    email: `Draft a professional email campaign for PMA ${audience} about: ${topic}`,
    landing: `Write landing page copy for PMA ${audience} about: ${topic}`
  };

  return queryAgent('marketing', typePrompts[type] || typePrompts.blog);
}

// Legal document assistance
export async function legalAnalysis(
  documentType: string,
  question: string
): Promise<AgentResponse> {
  const prompt = `Regarding a ${documentType}: ${question}

Remember to frame all guidance within the PMA structure and member-to-member communication framework.`;

  return queryAgent('legal', prompt);
}

// Training content generation
export async function generateTrainingContent(
  module: string,
  topic: string,
  format: 'lesson' | 'quiz' | 'summary' = 'lesson'
): Promise<AgentResponse> {
  const formatPrompts: Record<string, string> = {
    lesson: `Create a comprehensive training lesson for module "${module}" on: ${topic}`,
    quiz: `Generate assessment questions for module "${module}" on: ${topic}. Include multiple choice and short answer.`,
    summary: `Create a concise summary/cheat sheet for module "${module}" on: ${topic}`
  };

  return queryAgent('training', formatPrompts[format]);
}

// Medical protocol assistance
export async function medicalProtocolAssist(
  condition: string,
  approach: string = 'holistic'
): Promise<AgentResponse> {
  const prompt = `Develop a ${approach} protocol framework for: ${condition}

Include:
1. Root cause analysis considerations
2. Recommended assessments
3. Protocol components (supplements, lifestyle, frequency therapy if applicable)
4. Monitoring and adjustment guidelines
5. Safety considerations and contraindications

Remember: This is for practitioner guidance within our PMA framework, not public medical advice.`;

  return queryAgent('medical', prompt);
}

// Multi-agent synthesis - queries multiple divisions and combines insights
export async function multiAgentSynthesis(
  topic: string,
  divisions: string[] = ['research', 'medical', 'legal']
): Promise<{ synthesis: string; individualResponses: Record<string, AgentResponse> }> {
  const responses: Record<string, AgentResponse> = {};

  for (const division of divisions) {
    try {
      responses[division] = await queryAgent(division, `Provide your division's perspective on: ${topic}`);
    } catch (e) {
      responses[division] = { content: `[${division} division unavailable]`, model: 'none' };
    }
  }

  const combinedContext = Object.entries(responses)
    .map(([div, resp]) => `${div.toUpperCase()} DIVISION:\n${resp.content}`)
    .join('\n\n---\n\n');

  const synthesis = await queryAgent('research',
    `Synthesize these multi-division perspectives into a unified analysis and recommendation:`,
    combinedContext
  );

  return {
    synthesis: synthesis.content,
    individualResponses: responses
  };
}

// Cross-divisional query alias
export async function crossDivisionalQuery(
  query: string,
  divisions: string[] = ['research', 'medical', 'legal']
): Promise<{ synthesis: string; individualResponses: Record<string, AgentResponse> }> {
  return multiAgentSynthesis(query, divisions);
}

// Check agent availability across all providers (OpenAI, Gemini, HuggingFace)
export async function checkAgentStatus(): Promise<{
  available: boolean;
  primaryModel: string;
  fallbackModel: string;
  status: string;
  providers: Record<string, boolean>;
}> {
  const providers: Record<string, boolean> = {
    openai: false,
    gemini: false,
    huggingface_kimi: false,
    huggingface_mistral: false,
  };

  try {
    if (process.env.OPENAI_API_KEY) {
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const resp = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1,
      });
      if (resp.choices?.length > 0) providers.openai = true;
    }
  } catch (e) {
    console.log('[Agent Status] OpenAI not available');
  }

  try {
    if (process.env.GOOGLE_GEMINI_API_KEY) {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'ping' }] }], generationConfig: { maxOutputTokens: 1 } }),
      });
      if (resp.ok) providers.gemini = true;
    }
  } catch (e) {
    console.log('[Agent Status] Gemini not available');
  }

  try {
    await hf.textGeneration({
      model: KIMI_K2_MODEL,
      inputs: "Hello",
      parameters: { max_new_tokens: 5 }
    });
    providers.huggingface_kimi = true;
  } catch (e) {
    console.log('[Agent Status] Kimi K2 not available');
  }

  try {
    await hf.textGeneration({
      model: FALLBACK_AGENT_MODEL,
      inputs: "Hello",
      parameters: { max_new_tokens: 5 }
    });
    providers.huggingface_mistral = true;
  } catch (e) {
    console.log('[Agent Status] Mistral fallback not available');
  }

  const coreOnline = providers.openai || providers.gemini;
  const hfOnline = providers.huggingface_kimi || providers.huggingface_mistral;

  const onlineProviders = Object.entries(providers).filter(([, v]) => v).map(([k]) => k);
  const statusMsg = coreOnline
    ? `Agent system online (${onlineProviders.join(', ')})`
    : hfOnline
      ? `Agent system degraded - HuggingFace only (${onlineProviders.join(', ')})`
      : 'Agent system offline';

  return {
    available: coreOnline || hfOnline,
    primaryModel: KIMI_K2_MODEL,
    fallbackModel: FALLBACK_AGENT_MODEL,
    status: statusMsg,
    providers,
  };
}
