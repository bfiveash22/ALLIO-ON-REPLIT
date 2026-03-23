import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export interface AIProviderResult {
  response: string;
  provider: string;
  model: string;
  fallbackUsed: boolean;
  escalationUsed: boolean;
  qualityScore: number;
  latencyMs: number;
  attempts: AICallAttempt[];
}

export interface AICallAttempt {
  provider: string;
  model: string;
  tier: ModelTier;
  latencyMs: number;
  responseLength: number;
  qualityScore: number;
  success: boolean;
  error?: string;
  escalated: boolean;
  timestamp: string;
}

export interface QualityValidationResult {
  score: number;
  pass: boolean;
  reasons: string[];
}

export type ModelTier = 'economy' | 'standard' | 'premium';

export type CallType =
  | 'protocol-generation'
  | 'agent-chat'
  | 'document-generation'
  | 'peptide-console'
  | 'protocol-builder'
  | 'analysis'
  | 'general';

interface ModelConfig {
  model: string;
  tier: ModelTier;
}

interface ProviderConfig {
  name: string;
  models: ModelConfig[];
  enabled: () => boolean;
  call: (prompt: string, model: string, systemPrompt?: string, maxTokens?: number) => Promise<string>;
}

export interface AICallLog {
  timestamp: string;
  callType: CallType;
  providerChain: string[];
  finalProvider: string;
  finalModel: string;
  latencyMs: number;
  responseLength: number;
  qualityScore: number;
  fallbackUsed: boolean;
  escalationUsed: boolean;
  success: boolean;
  error?: string;
}

interface ProviderHealthWindow {
  calls: AICallLog[];
  lastUpdated: string;
}

const QUALITY_THRESHOLDS: Record<CallType, { minLength: number; minScore: number }> = {
  'protocol-generation': { minLength: 500, minScore: 60 },
  'agent-chat': { minLength: 20, minScore: 40 },
  'document-generation': { minLength: 200, minScore: 55 },
  'peptide-console': { minLength: 30, minScore: 40 },
  'protocol-builder': { minLength: 100, minScore: 50 },
  'analysis': { minLength: 100, minScore: 50 },
  'general': { minLength: 10, minScore: 30 },
};

const FAILURE_PATTERNS = [
  /^i cannot/i,
  /^i'm unable to/i,
  /^as an ai/i,
  /^i apologize,? but i/i,
  /^sorry,? (but )?i (can't|cannot|am unable)/i,
  /^unfortunately,? i (can't|cannot|am unable)/i,
];

const TRUNCATION_PATTERNS = [
  /\.{3,}$/,
  /[^.!?]\s*$/,
  /\w+$/,
];

const REPETITION_THRESHOLD = 3;

const PMA_PROHIBITED_TERMS = [
  'treatment', 'treat', 'diagnosis', 'diagnose', 'prescribe',
  'prescription', 'patient', 'medical advice', 'cure',
];

const healthWindow: Record<string, ProviderHealthWindow> = {};
const ROLLING_WINDOW_SIZE = 100;

function recordCall(log: AICallLog): void {
  const provider = log.finalProvider;
  if (!healthWindow[provider]) {
    healthWindow[provider] = { calls: [], lastUpdated: new Date().toISOString() };
  }
  healthWindow[provider].calls.push(log);
  if (healthWindow[provider].calls.length > ROLLING_WINDOW_SIZE) {
    healthWindow[provider].calls = healthWindow[provider].calls.slice(-ROLLING_WINDOW_SIZE);
  }
  healthWindow[provider].lastUpdated = new Date().toISOString();

  if (!healthWindow['_all']) {
    healthWindow['_all'] = { calls: [], lastUpdated: new Date().toISOString() };
  }
  healthWindow['_all'].calls.push(log);
  if (healthWindow['_all'].calls.length > ROLLING_WINDOW_SIZE * 5) {
    healthWindow['_all'].calls = healthWindow['_all'].calls.slice(-ROLLING_WINDOW_SIZE * 5);
  }
  healthWindow['_all'].lastUpdated = new Date().toISOString();
}

export function validateAIResponse(
  response: string,
  callType: CallType = 'general',
  expectedFields?: string[]
): QualityValidationResult {
  const reasons: string[] = [];
  let score = 100;
  const thresholds = QUALITY_THRESHOLDS[callType] || QUALITY_THRESHOLDS['general'];

  if (!response || response.trim().length === 0) {
    return { score: 0, pass: false, reasons: ['Empty response'] };
  }

  if (response.length < thresholds.minLength) {
    const penalty = Math.min(40, Math.round((1 - response.length / thresholds.minLength) * 40));
    score -= penalty;
    reasons.push(`Response too short (${response.length} < ${thresholds.minLength})`);
  }

  for (const pattern of FAILURE_PATTERNS) {
    if (pattern.test(response.trim())) {
      score -= 50;
      reasons.push(`Detected refusal pattern: "${response.trim().substring(0, 60)}..."`);
      break;
    }
  }

  const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 10);
  if (sentences.length >= REPETITION_THRESHOLD) {
    const normalized = sentences.map(s => s.trim().toLowerCase());
    const uniqueRatio = new Set(normalized).size / normalized.length;
    if (uniqueRatio < 0.5) {
      score -= 30;
      reasons.push(`High repetition detected (${Math.round(uniqueRatio * 100)}% unique)`);
    }
  }

  if (response.length > 200) {
    for (const pattern of TRUNCATION_PATTERNS) {
      if (pattern.test(response.trim()) && !response.trim().endsWith('.') && !response.trim().endsWith('!') && !response.trim().endsWith('?')) {
        score -= 10;
        reasons.push('Possible truncation detected');
        break;
      }
    }
  }

  if (callType === 'protocol-generation' || callType === 'protocol-builder' || callType === 'document-generation') {
    let pmaViolations = 0;
    const lowerResponse = response.toLowerCase();
    for (const term of PMA_PROHIBITED_TERMS) {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      const matches = lowerResponse.match(regex);
      if (matches) {
        pmaViolations += matches.length;
      }
    }
    if (pmaViolations > 0) {
      const penalty = Math.min(20, pmaViolations * 3);
      score -= penalty;
      reasons.push(`PMA compliance: ${pmaViolations} prohibited term(s) found`);
    }
  }

  if (expectedFields && expectedFields.length > 0) {
    try {
      const parsed = JSON.parse(response);
      const missingFields = expectedFields.filter(f => !(f in parsed));
      if (missingFields.length > 0) {
        const penalty = Math.min(30, Math.round((missingFields.length / expectedFields.length) * 30));
        score -= penalty;
        reasons.push(`Missing fields: ${missingFields.join(', ')}`);
      }
    } catch {
      if (callType === 'protocol-generation') {
        let fieldCount = 0;
        for (const field of expectedFields) {
          if (response.toLowerCase().includes(field.toLowerCase())) fieldCount++;
        }
        if (fieldCount < expectedFields.length * 0.5) {
          score -= 15;
          reasons.push(`Response may be missing expected structure (${fieldCount}/${expectedFields.length} fields found in text)`);
        }
      }
    }
  }

  score = Math.max(0, Math.min(100, score));
  const pass = score >= thresholds.minScore;

  if (reasons.length === 0) {
    reasons.push('All quality checks passed');
  }

  return { score, pass, reasons };
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function callOpenAI(prompt: string, model: string, systemPrompt?: string, maxTokens?: number): Promise<string> {
  const messages: ChatCompletionMessageParam[] = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: prompt });

  const completion = await openai.chat.completions.create({
    model,
    messages,
    max_completion_tokens: maxTokens || 2048,
  });
  return completion.choices[0]?.message?.content || '';
}

async function callClaude(prompt: string, model: string, systemPrompt?: string, maxTokens?: number): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  const baseURL = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL || 'https://api.anthropic.com';
  if (!apiKey) throw new Error('No Anthropic API key available');

  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey, baseURL });
  const response = await client.messages.create({
    model,
    max_tokens: maxTokens || 2048,
    system: systemPrompt || undefined,
    messages: [{ role: 'user', content: prompt }],
  });
  const textBlock = response.content.find((c) => c.type === 'text');
  return textBlock && 'text' in textBlock ? textBlock.text : '';
}

async function callGemini(prompt: string, model: string, systemPrompt?: string): Promise<string> {
  const { GoogleGenAI } = await import('@google/genai');
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini API key not configured');
  const ai = new GoogleGenAI({ apiKey });
  const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
  const response = await ai.models.generateContent({
    model,
    contents: fullPrompt,
  });
  return response.text || '';
}

async function callSelfHosted(prompt: string, _model: string, systemPrompt?: string): Promise<string> {
  const endpoint = process.env.SELF_HOSTED_AI_ENDPOINT;
  if (!endpoint) throw new Error('SELF_HOSTED_AI_ENDPOINT not configured');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, system: systemPrompt, max_tokens: 2048 }),
  });

  if (!response.ok) {
    throw new Error(`Self-hosted AI returned ${response.status}: ${await response.text()}`);
  }

  const data = await response.json() as Record<string, unknown>;
  return String(data.response || data.text || data.content || '');
}

async function callOpenRouter(prompt: string, model: string, systemPrompt?: string, maxTokens?: number): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('No OpenRouter API key available');

  const messages: Array<{ role: string; content: string }> = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: prompt });

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://ffpma.replit.app',
      'X-Title': 'Forgotten Formula PMA',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens || 4096,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter returned ${response.status}: ${errText}`);
  }

  const data = await response.json() as any;
  const content = data.choices?.[0]?.message?.content;
  if (content && content.length > 0) return content;
  throw new Error('OpenRouter returned empty response');
}

async function callAbacus(prompt: string, model: string, systemPrompt?: string, maxTokens?: number): Promise<string> {
  const apiKey = process.env.ABACUSAI_API_KEY;
  if (!apiKey) throw new Error('No Abacus AI API key available');

  const isDeploymentCall = model === 'deployment:dr-formula-protocol';

  if (isDeploymentCall) {
    const response = await fetch("https://api.abacus.ai/api/v0/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        deploymentId: "dr-formula-protocol",
        queryData: {
          systemPrompt: systemPrompt || "",
          userMessage: prompt,
          model: "gpt-4.1-mini",
          maxTokens: maxTokens || 12000,
          temperature: 0.4,
          responseFormat: "json",
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Abacus AI (deployment) returned ${response.status}: ${await response.text()}`);
    }

    const data = await response.json() as Record<string, unknown>;
    const rawResult = data.result || data.prediction || data.response;
    if (typeof rawResult === "string" && rawResult.length > 0) return rawResult;
    throw new Error('Abacus AI (deployment) returned empty/invalid response');
  }

  const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt },
      ],
      max_tokens: maxTokens || 4096,
    }),
  });

  if (!response.ok) {
    throw new Error(`Abacus AI (chat) returned ${response.status}: ${await response.text()}`);
  }

  const data = await response.json() as any;
  const content = data.choices?.[0]?.message?.content;
  if (content && content.length > 0) return content;
  throw new Error('Abacus AI (chat) returned empty response');
}

function getProviderChain(): ProviderConfig[] {
  return [
    {
      name: 'abacus',
      models: [
        { model: 'gpt-4.1-mini', tier: 'economy' },
        { model: 'gpt-4.1', tier: 'standard' },
        { model: 'claude-sonnet-4-20250514', tier: 'standard' },
        { model: 'gpt-4o', tier: 'premium' },
        { model: 'deployment:dr-formula-protocol', tier: 'standard' },
      ],
      enabled: () => !!process.env.ABACUSAI_API_KEY,
      call: callAbacus,
    },
    {
      name: 'openai',
      models: [
        { model: 'gpt-4o-mini', tier: 'economy' },
        { model: 'gpt-4o', tier: 'standard' },
      ],
      enabled: () => !!process.env.OPENAI_API_KEY,
      call: callOpenAI,
    },
    {
      name: 'claude',
      models: [
        { model: 'claude-haiku-4-5', tier: 'economy' },
        { model: 'claude-sonnet-4-20250514', tier: 'standard' },
      ],
      enabled: () => !!(process.env.ANTHROPIC_API_KEY || process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY),
      call: callClaude,
    },
    {
      name: 'gemini',
      models: [
        { model: 'gemini-2.5-flash', tier: 'economy' },
        { model: 'gemini-2.5-pro', tier: 'standard' },
      ],
      enabled: () => !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY),
      call: callGemini,
    },
    {
      name: 'openrouter',
      models: [
        { model: 'deepseek/deepseek-chat-v3-0324', tier: 'economy' },
        { model: 'meta-llama/llama-4-maverick', tier: 'economy' },
        { model: 'qwen/qwen3.5-122b-a10b', tier: 'standard' },
        { model: 'mistralai/mistral-large', tier: 'standard' },
        { model: 'x-ai/grok-4-fast', tier: 'premium' },
      ],
      enabled: () => !!process.env.OPENROUTER_API_KEY,
      call: callOpenRouter,
    },
    {
      name: 'self-hosted',
      models: [
        { model: 'self-hosted', tier: 'economy' },
      ],
      enabled: () => !!process.env.SELF_HOSTED_AI_ENDPOINT,
      call: callSelfHosted,
    },
  ];
}

function getModelsForTierEscalation(provider: ProviderConfig, startTier: ModelTier): ModelConfig[] {
  const tierOrder: ModelTier[] = ['economy', 'standard', 'premium'];
  const startIdx = tierOrder.indexOf(startTier);
  return provider.models
    .filter(m => tierOrder.indexOf(m.tier) >= startIdx)
    .sort((a, b) => tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier));
}

export interface TerminalFailureError {
  isTerminalFailure: true;
  message: string;
  userMessage: string;
  attempts: AICallAttempt[];
  providersAttempted: string[];
}

function createTerminalFailure(attempts: AICallAttempt[]): TerminalFailureError {
  const providersAttempted = [...new Set(attempts.map(a => a.provider))];
  const errorSummary = attempts
    .filter(a => a.error)
    .map(a => `${a.provider}/${a.model}: ${a.error}`)
    .join('; ');

  return {
    isTerminalFailure: true,
    message: `[AI Fallback] All providers exhausted. Attempted: ${providersAttempted.join(' → ')}. Errors: ${errorSummary}`,
    userMessage: 'Our AI systems are temporarily unable to process this request. Please try again in a few minutes, or contact support if the issue persists.',
    attempts,
    providersAttempted,
  };
}

export function isTerminalFailure(err: any): err is TerminalFailureError {
  return err && err.isTerminalFailure === true;
}

export async function callWithFallback(
  prompt: string,
  options?: {
    systemPrompt?: string;
    preferredProvider?: string;
    preferredModel?: string;
    maxRetries?: number;
    maxTokens?: number;
    callType?: CallType;
    expectedFields?: string[];
    startTier?: ModelTier;
    skipQualityCheck?: boolean;
  }
): Promise<AIProviderResult> {
  const chain = getProviderChain().filter(p => p.enabled());
  const {
    systemPrompt,
    preferredProvider,
    preferredModel,
    maxRetries = 1,
    maxTokens,
    callType = 'general',
    expectedFields,
    startTier = 'economy',
    skipQualityCheck = false,
  } = options || {};

  if (preferredProvider) {
    const preferredIdx = chain.findIndex(p => p.name === preferredProvider);
    if (preferredIdx > 0) {
      const [preferred] = chain.splice(preferredIdx, 1);
      chain.unshift(preferred);
    }
  }

  if (chain.length === 0) {
    const failure = createTerminalFailure([]);
    throw failure;
  }

  const allAttempts: AICallAttempt[] = [];
  let fallbackUsed = false;

  for (let i = 0; i < chain.length; i++) {
    const provider = chain[i];
    if (i > 0) fallbackUsed = true;

    let modelsToTry: ModelConfig[];
    if (preferredModel && i === 0) {
      const exactModel = provider.models.find(m => m.model === preferredModel);
      if (exactModel) {
        const remaining = getModelsForTierEscalation(provider, exactModel.tier)
          .filter(m => m.model !== preferredModel);
        modelsToTry = [exactModel, ...remaining];
      } else {
        modelsToTry = getModelsForTierEscalation(provider, startTier);
      }
    } else {
      modelsToTry = getModelsForTierEscalation(provider, startTier);
    }

    if (modelsToTry.length === 0) {
      modelsToTry = provider.models.slice(0, 1);
    }

    for (let modelIdx = 0; modelIdx < modelsToTry.length; modelIdx++) {
      const modelConfig = modelsToTry[modelIdx];
      const escalated = modelIdx > 0;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const startTime = Date.now();
        try {
          const label = `${provider.name}/${modelConfig.model} [${modelConfig.tier}]`;
          console.log(
            `[AI Fallback] Trying ${label}` +
            `${attempt > 0 ? ` retry ${attempt}` : ''}` +
            `${escalated ? ' [escalated]' : ''}` +
            `${fallbackUsed ? ' [fallback]' : ''}` +
            ` (type: ${callType})`
          );

          const response = await provider.call(prompt, modelConfig.model, systemPrompt, maxTokens);
          const latencyMs = Date.now() - startTime;

          let qualityResult: QualityValidationResult;
          if (skipQualityCheck) {
            qualityResult = { score: 100, pass: true, reasons: ['Quality check skipped'] };
          } else {
            qualityResult = validateAIResponse(response, callType, expectedFields);
          }

          const attemptLog: AICallAttempt = {
            provider: provider.name,
            model: modelConfig.model,
            tier: modelConfig.tier,
            latencyMs,
            responseLength: response.length,
            qualityScore: qualityResult.score,
            success: qualityResult.pass,
            escalated,
            timestamp: new Date().toISOString(),
          };
          allAttempts.push(attemptLog);

          if (qualityResult.pass) {
            console.log(
              `[AI Fallback] Success via ${label}, ` +
              `length: ${response.length}, quality: ${qualityResult.score}/100, ` +
              `latency: ${latencyMs}ms`
            );

            const callLog: AICallLog = {
              timestamp: new Date().toISOString(),
              callType,
              providerChain: chain.map(p => p.name),
              finalProvider: provider.name,
              finalModel: modelConfig.model,
              latencyMs,
              responseLength: response.length,
              qualityScore: qualityResult.score,
              fallbackUsed,
              escalationUsed: escalated,
              success: true,
            };
            recordCall(callLog);

            return {
              response,
              provider: provider.name,
              model: modelConfig.model,
              fallbackUsed,
              escalationUsed: escalated,
              qualityScore: qualityResult.score,
              latencyMs,
              attempts: allAttempts,
            };
          }

          console.warn(
            `[AI Fallback] ${label} quality check failed ` +
            `(score: ${qualityResult.score}): ${qualityResult.reasons.join(', ')}`
          );

          if (modelIdx < modelsToTry.length - 1) {
            console.log(`[AI Fallback] Escalating within ${provider.name}...`);
            break;
          }
        } catch (err: any) {
          const latencyMs = Date.now() - startTime;
          const attemptLog: AICallAttempt = {
            provider: provider.name,
            model: modelConfig.model,
            tier: modelConfig.tier,
            latencyMs,
            responseLength: 0,
            qualityScore: 0,
            success: false,
            error: err.message,
            escalated,
            timestamp: new Date().toISOString(),
          };
          allAttempts.push(attemptLog);

          console.warn(
            `[AI Fallback] ${provider.name}/${modelConfig.model} failed` +
            `${attempt > 0 ? ` (attempt ${attempt + 1})` : ''}: ${err.message}`
          );
        }
      }
    }
  }

  const failureLog: AICallLog = {
    timestamp: new Date().toISOString(),
    callType,
    providerChain: chain.map(p => p.name),
    finalProvider: allAttempts.length > 0 ? allAttempts[allAttempts.length - 1].provider : 'none',
    finalModel: allAttempts.length > 0 ? allAttempts[allAttempts.length - 1].model : 'none',
    latencyMs: allAttempts.reduce((sum, a) => sum + a.latencyMs, 0),
    responseLength: 0,
    qualityScore: 0,
    fallbackUsed,
    escalationUsed: allAttempts.some(a => a.escalated),
    success: false,
    error: 'All providers exhausted',
  };
  recordCall(failureLog);

  throw createTerminalFailure(allAttempts);
}

export interface ToolCallEntry {
  toolName: string;
  argsSummary: string;
  resultLength: number;
  latencyMs: number;
  iteration: number;
  timestamp: string;
}

export interface AgenticLoopResult {
  response: string;
  provider: string;
  model: string;
  iterations: number;
  toolCallLog: ToolCallEntry[];
  totalTokensEstimate: number;
}

interface ToolProviderConfig {
  name: string;
  client: any;
  economyModel: string;
  premiumModel: string;
}

async function buildToolProviderChain(preferredProvider?: string): Promise<ToolProviderConfig[]> {
  const OpenAILib = (await import('openai')).default;

  const abacusKey = process.env.ABACUSAI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const abacusConfig: ToolProviderConfig | null = abacusKey ? {
    name: 'abacus',
    client: new OpenAILib({ apiKey: abacusKey, baseURL: 'https://apps.abacus.ai/v1' }),
    economyModel: 'gpt-4.1-mini',
    premiumModel: 'gpt-4.1',
  } : null;

  const openaiConfig: ToolProviderConfig | null = openaiKey ? {
    name: 'openai',
    client: new OpenAILib({ apiKey: openaiKey }),
    economyModel: 'gpt-4o-mini',
    premiumModel: 'gpt-4o',
  } : null;

  const allProviders = [abacusConfig, openaiConfig].filter(Boolean) as ToolProviderConfig[];

  if (!preferredProvider) return allProviders;

  const preferred = preferredProvider.toLowerCase();
  const sorted = [
    ...allProviders.filter(p => p.name === preferred),
    ...allProviders.filter(p => p.name !== preferred),
  ];
  return sorted;
}

async function runToolLoop(
  client: any,
  economyModel: string,
  conversationMessages: any[],
  tools: any[],
  toolDispatcher: (toolName: string, args: Record<string, any>) => Promise<string>,
  maxTokens: number,
  maxIterations: number,
  toolCallLog: ToolCallEntry[],
  providerName: string
): Promise<{ finalText: string; iterations: number; totalTokensEstimate: number } | null> {
  let iterations = 0;
  let totalTokensEstimate = 0;
  const msgs = [...conversationMessages];

  while (iterations < maxIterations) {
    iterations++;
    console.log(`[callWithTools] Iteration ${iterations}/${maxIterations} (${providerName}/${economyModel})`);

    const completion = await client.chat.completions.create({
      model: economyModel,
      messages: msgs,
      tools: tools.length > 0 ? tools : undefined,
      tool_choice: tools.length > 0 ? 'auto' : undefined,
      max_completion_tokens: maxTokens,
    });

    const responseMsg = completion.choices[0]?.message;
    totalTokensEstimate += completion.usage?.total_tokens || Math.round((JSON.stringify(msgs).length + (responseMsg?.content?.length || 0)) / 4);

    if (!responseMsg) return null;
    msgs.push(responseMsg);

    if (!responseMsg.tool_calls || responseMsg.tool_calls.length === 0) {
      return { finalText: responseMsg.content || '', iterations, totalTokensEstimate };
    }

    for (const toolCall of responseMsg.tool_calls) {
      const toolName = toolCall.function.name;
      let args: Record<string, any> = {};
      try { args = JSON.parse(toolCall.function.arguments || '{}'); } catch { args = {}; }

      const argsSummary = Object.keys(args).map(k => `${k}=${String(args[k]).substring(0, 60)}`).join(', ');
      console.log(`[callWithTools] Tool call: ${toolName}(${argsSummary})`);

      const toolStart = Date.now();
      let toolResult: string;
      try {
        toolResult = await toolDispatcher(toolName, args);
      } catch (err: any) {
        toolResult = `[Tool error: ${err.message}]`;
        console.warn(`[callWithTools] Tool ${toolName} failed: ${err.message}`);
      }
      const toolLatency = Date.now() - toolStart;

      toolCallLog.push({
        toolName,
        argsSummary,
        resultLength: toolResult.length,
        latencyMs: toolLatency,
        iteration: iterations,
        timestamp: new Date().toISOString(),
      });

      msgs.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: toolResult.substring(0, 12000),
      });
    }
  }

  console.warn(`[callWithTools] Hit max iterations (${maxIterations}), forcing synthesis`);
  const finalCompletion = await client.chat.completions.create({
    model: economyModel,
    messages: [
      ...msgs,
      { role: 'user', content: 'Based on all information gathered above, provide your final comprehensive response now.' },
    ],
    max_completion_tokens: maxTokens,
  });
  totalTokensEstimate += finalCompletion.usage?.total_tokens || 0;
  return { finalText: finalCompletion.choices[0]?.message?.content || '', iterations, totalTokensEstimate };
}

export async function callWithTools(
  messages: Array<{ role: string; content: string }>,
  tools: any[],
  toolDispatcher: (toolName: string, args: Record<string, any>) => Promise<string>,
  options?: {
    systemPrompt?: string;
    maxTokens?: number;
    maxIterations?: number;
    callType?: CallType;
    skipQualityCheck?: boolean;
    preferredProvider?: string;
  }
): Promise<AgenticLoopResult> {
  const {
    systemPrompt,
    maxTokens = 4096,
    maxIterations = 10,
    callType = 'document-generation',
    skipQualityCheck = false,
    preferredProvider,
  } = options || {};

  const providerChain = await buildToolProviderChain(preferredProvider);
  if (providerChain.length === 0) {
    throw new Error('[callWithTools] No compatible provider available for tool-calling (requires OpenAI or Abacus)');
  }

  const baseMessages: any[] = [];
  if (systemPrompt) {
    baseMessages.push({ role: 'system', content: systemPrompt });
  }
  baseMessages.push(...messages);

  const toolCallLog: ToolCallEntry[] = [];

  for (let pi = 0; pi < providerChain.length; pi++) {
    const provider = providerChain[pi];

    let loopResult: { finalText: string; iterations: number; totalTokensEstimate: number } | null = null;
    try {
      loopResult = await runToolLoop(
        provider.client,
        provider.economyModel,
        baseMessages,
        tools,
        toolDispatcher,
        maxTokens,
        maxIterations,
        toolCallLog,
        provider.name
      );
    } catch (err: any) {
      console.warn(`[callWithTools] Provider ${provider.name} loop failed: ${err.message}`);
      if (pi < providerChain.length - 1) continue;
      throw err;
    }

    if (!loopResult) {
      if (pi < providerChain.length - 1) continue;
      throw new Error('[callWithTools] All providers returned empty response');
    }

    const { finalText, iterations, totalTokensEstimate } = loopResult;
    let usedModel = provider.economyModel;

    if (!skipQualityCheck) {
      const quality = validateAIResponse(finalText, callType);
      console.log(`[callWithTools] Quality check (${provider.name}/${usedModel}): score=${quality.score} pass=${quality.pass}`);

      if (!quality.pass) {
        console.log(`[callWithTools] Quality failed (${quality.score}/100), escalating to ${provider.name}/${provider.premiumModel}`);
        try {
          const escalationCompletion = await provider.client.chat.completions.create({
            model: provider.premiumModel,
            messages: [
              ...baseMessages,
              { role: 'assistant', content: `[Previous draft - quality score ${quality.score}/100, needs improvement: ${quality.reasons.join(', ')}]\n\n${finalText}` },
              { role: 'user', content: 'The above draft did not meet quality standards. Please produce a significantly improved, comprehensive, and complete version.' },
            ],
            max_completion_tokens: maxTokens,
          });
          const escalatedText = escalationCompletion.choices[0]?.message?.content || finalText;
          const escalatedQuality = validateAIResponse(escalatedText, callType);
          console.log(`[callWithTools] Escalated quality: score=${escalatedQuality.score} pass=${escalatedQuality.pass}`);
          usedModel = provider.premiumModel;

          if (escalatedQuality.pass || pi === providerChain.length - 1) {
            return {
              response: escalatedText,
              provider: provider.name,
              model: usedModel,
              iterations,
              toolCallLog,
              totalTokensEstimate: totalTokensEstimate + (escalationCompletion.usage?.total_tokens || 0),
            };
          }
          console.log(`[callWithTools] Escalated quality still failed (${escalatedQuality.score}/100), trying next provider`);
          continue;
        } catch (escalationErr: any) {
          console.warn(`[callWithTools] Escalation failed: ${escalationErr.message}, using original`);
        }
      }
    }

    console.log(`[callWithTools] Final response via ${provider.name}/${usedModel} after ${iterations} iteration(s), length: ${finalText.length}, tokens~${totalTokensEstimate}`);
    return {
      response: finalText,
      provider: provider.name,
      model: usedModel,
      iterations,
      toolCallLog,
      totalTokensEstimate,
    };
  }

  throw new Error('[callWithTools] All providers in chain exhausted');
}

export async function callWithFallbackStreaming(
  messages: Array<{ role: string; content: string }>,
  options?: {
    preferredProvider?: string;
    preferredModel?: string;
    maxTokens?: number;
    callType?: CallType;
  }
): Promise<{ stream: ReadableStream | AsyncIterable<any>; provider: string; model: string; cleanup: () => void }> {
  const {
    preferredProvider,
    preferredModel,
    maxTokens = 2000,
    callType = 'general',
  } = options || {};

  const chain = getProviderChain().filter(p => p.enabled());
  if (preferredProvider) {
    const idx = chain.findIndex(p => p.name === preferredProvider);
    if (idx > 0) {
      const [preferred] = chain.splice(idx, 1);
      chain.unshift(preferred);
    }
  }

  if (chain.length === 0) {
    throw createTerminalFailure([]);
  }

  const startTime = Date.now();

  for (let provIdx = 0; provIdx < chain.length; provIdx++) {
    const provider = chain[provIdx];
    const model = (provIdx === 0 && preferredProvider && preferredModel && provider.name === preferredProvider)
      ? preferredModel
      : provider.models[0]?.model || 'unknown';

    try {
      if (provider.name === 'abacus') {
        const apiKey = process.env.ABACUSAI_API_KEY;
        if (!apiKey) continue;

        const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ model, messages, stream: true, max_tokens: maxTokens }),
        });

        if (!response.ok) throw new Error(`Abacus streaming returned ${response.status}`);
        if (!response.body) throw new Error('No response body from Abacus');

        console.log(`[AI Fallback Streaming] Using ${provider.name}/${model} (type: ${callType})`);
        recordCall({
          timestamp: new Date().toISOString(),
          callType,
          providerChain: chain.map(p => p.name),
          finalProvider: provider.name,
          finalModel: model,
          latencyMs: Date.now() - startTime,
          responseLength: 0,
          qualityScore: -1,
          fallbackUsed: provIdx > 0,
          escalationUsed: false,
          success: true,
        });

        return {
          stream: response.body as any,
          provider: provider.name,
          model,
          cleanup: () => {},
        };
      }

      if (provider.name === 'openai') {
        const stream = await openai.chat.completions.create({
          model,
          messages: messages as any,
          stream: true,
          max_completion_tokens: maxTokens,
        });

        console.log(`[AI Fallback Streaming] Using ${provider.name}/${model} (type: ${callType})`);
        recordCall({
          timestamp: new Date().toISOString(),
          callType,
          providerChain: chain.map(p => p.name),
          finalProvider: provider.name,
          finalModel: model,
          latencyMs: Date.now() - startTime,
          responseLength: 0,
          qualityScore: -1,
          fallbackUsed: provIdx > 0,
          escalationUsed: false,
          success: true,
        });

        return {
          stream: stream as any,
          provider: provider.name,
          model,
          cleanup: () => {},
        };
      }

      if (provider.name === 'openrouter') {
        const orApiKey = process.env.OPENROUTER_API_KEY;
        if (!orApiKey) continue;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${orApiKey}`,
            'HTTP-Referer': 'https://ffpma.replit.app',
            'X-Title': 'Forgotten Formula PMA',
          },
          body: JSON.stringify({ model, messages, stream: true, max_tokens: maxTokens }),
        });

        if (!response.ok) throw new Error(`OpenRouter streaming returned ${response.status}`);
        if (!response.body) throw new Error('No response body from OpenRouter');

        console.log(`[AI Fallback Streaming] Using ${provider.name}/${model} (type: ${callType})`);
        recordCall({
          timestamp: new Date().toISOString(),
          callType,
          providerChain: chain.map(p => p.name),
          finalProvider: provider.name,
          finalModel: model,
          latencyMs: Date.now() - startTime,
          responseLength: 0,
          qualityScore: -1,
          fallbackUsed: provIdx > 0,
          escalationUsed: false,
          success: true,
        });

        return {
          stream: response.body as any,
          provider: provider.name,
          model,
          cleanup: () => {},
        };
      }

      if (provider.name === 'claude') {
        const apiKey = process.env.ANTHROPIC_API_KEY || process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
        const baseURL = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL || 'https://api.anthropic.com';
        if (!apiKey) continue;

        const Anthropic = (await import('@anthropic-ai/sdk')).default;
        const client = new Anthropic({ apiKey, baseURL });

        const systemMsg = messages.find(m => m.role === 'system');
        const nonSystemMsgs = messages.filter(m => m.role !== 'system');

        const stream = client.messages.stream({
          model,
          max_tokens: maxTokens,
          system: systemMsg?.content || undefined,
          messages: nonSystemMsgs.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        });

        console.log(`[AI Fallback Streaming] Using ${provider.name}/${model} (type: ${callType})`);
        recordCall({
          timestamp: new Date().toISOString(),
          callType,
          providerChain: chain.map(p => p.name),
          finalProvider: provider.name,
          finalModel: model,
          latencyMs: Date.now() - startTime,
          responseLength: 0,
          qualityScore: -1,
          fallbackUsed: provIdx > 0,
          escalationUsed: false,
          success: true,
        });

        return {
          stream: stream as any,
          provider: provider.name,
          model,
          cleanup: () => { stream.abort(); },
        };
      }
    } catch (err: any) {
      console.warn(`[AI Fallback Streaming] ${provider.name} failed: ${err.message}`);
      continue;
    }
  }

  throw createTerminalFailure([]);
}

export function getAvailableProviders(): string[] {
  return getProviderChain().filter(p => p.enabled()).map(p => `${p.name}:${p.models.map(m => m.model).join(',')}`);
}

export interface AIHealthReport {
  timestamp: string;
  providers: Record<string, {
    name: string;
    available: boolean;
    models: ModelConfig[];
    recentCalls: number;
    successRate: number;
    averageLatencyMs: number;
    averageQualityScore: number;
    lastCallAt: string | null;
    recentErrors: string[];
  }>;
  overallStats: {
    totalCalls: number;
    successRate: number;
    averageLatencyMs: number;
    averageQualityScore: number;
    callsByType: Record<string, number>;
    last24hCalls: number;
  };
}

export function getAIHealthReport(): AIHealthReport {
  const now = new Date();
  const providers: AIHealthReport['providers'] = {};
  const providerChain = getProviderChain();

  for (const provider of providerChain) {
    const window = healthWindow[provider.name];
    const calls = window?.calls || [];
    const successCalls = calls.filter(c => c.success);
    const qualityCalls = calls.filter(c => c.qualityScore >= 0);
    const recentErrors = calls
      .filter(c => !c.success && c.error)
      .slice(-5)
      .map(c => c.error!);

    providers[provider.name] = {
      name: provider.name,
      available: provider.enabled(),
      models: provider.models,
      recentCalls: calls.length,
      successRate: calls.length > 0 ? Math.round((successCalls.length / calls.length) * 100) : 0,
      averageLatencyMs: calls.length > 0 ? Math.round(calls.reduce((s, c) => s + c.latencyMs, 0) / calls.length) : 0,
      averageQualityScore: qualityCalls.length > 0 ? Math.round(qualityCalls.reduce((s, c) => s + c.qualityScore, 0) / qualityCalls.length) : 0,
      lastCallAt: window?.lastUpdated || null,
      recentErrors,
    };
  }

  const allCalls = healthWindow['_all']?.calls || [];
  const allSuccess = allCalls.filter(c => c.success);
  const allQuality = allCalls.filter(c => c.qualityScore >= 0);
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const last24h = allCalls.filter(c => c.timestamp > twentyFourHoursAgo);

  const callsByType: Record<string, number> = {};
  for (const call of allCalls) {
    callsByType[call.callType] = (callsByType[call.callType] || 0) + 1;
  }

  return {
    timestamp: now.toISOString(),
    providers,
    overallStats: {
      totalCalls: allCalls.length,
      successRate: allCalls.length > 0 ? Math.round((allSuccess.length / allCalls.length) * 100) : 0,
      averageLatencyMs: allCalls.length > 0 ? Math.round(allCalls.reduce((s, c) => s + c.latencyMs, 0) / allCalls.length) : 0,
      averageQualityScore: allQuality.length > 0 ? Math.round(allQuality.reduce((s, c) => s + c.qualityScore, 0) / allQuality.length) : 0,
      callsByType,
      last24hCalls: last24h.length,
    },
  };
}
