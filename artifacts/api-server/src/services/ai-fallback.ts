import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export interface AIProviderResult {
  response: string;
  provider: string;
  model: string;
  fallbackUsed: boolean;
}

interface ProviderConfig {
  name: string;
  model: string;
  enabled: boolean;
  call: (prompt: string, systemPrompt?: string, maxTokens?: number) => Promise<string>;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function callOpenAI(prompt: string, systemPrompt?: string, maxTokens?: number): Promise<string> {
  const messages: ChatCompletionMessageParam[] = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: prompt });

  const completion = await openai.chat.completions.create({
    model: maxTokens && maxTokens > 4096 ? 'gpt-4o' : 'gpt-4o-mini',
    messages,
    max_completion_tokens: maxTokens || 2048,
  });
  return completion.choices[0]?.message?.content || '';
}

async function callClaude(prompt: string, systemPrompt?: string, maxTokens?: number): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  const baseURL = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL || 'https://api.anthropic.com';
  if (!apiKey) throw new Error('No Anthropic API key available');

  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey, baseURL });
  const response = await client.messages.create({
    model: maxTokens && maxTokens > 4096 ? 'claude-sonnet-4-20250514' : 'claude-haiku-4-5',
    max_tokens: maxTokens || 2048,
    system: systemPrompt || undefined,
    messages: [{ role: 'user', content: prompt }],
  });
  const textBlock = response.content.find((c) => c.type === 'text');
  return textBlock && 'text' in textBlock ? textBlock.text : '';
}

async function callGemini(prompt: string, systemPrompt?: string): Promise<string> {
  const { analyzeWithGemini } = await import('./gemini-provider');
  const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
  return await analyzeWithGemini(fullPrompt);
}

async function callSelfHosted(prompt: string, systemPrompt?: string): Promise<string> {
  const endpoint = process.env.SELF_HOSTED_AI_ENDPOINT;
  if (!endpoint) throw new Error('SELF_HOSTED_AI_ENDPOINT not configured');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      system: systemPrompt,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    throw new Error(`Self-hosted AI returned ${response.status}: ${await response.text()}`);
  }

  const data = await response.json() as Record<string, unknown>;
  return String(data.response || data.text || data.content || '');
}

async function callAbacus(prompt: string, systemPrompt?: string): Promise<string> {
  const apiKey = process.env.ABACUSAI_API_KEY;
  if (!apiKey) throw new Error('No Abacus AI API key available');

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
        maxTokens: 12000,
        temperature: 0.4,
        responseFormat: "json",
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Abacus AI returned ${response.status}: ${await response.text()}`);
  }

  const data = await response.json() as Record<string, unknown>;
  const rawResult = data.result || data.prediction || data.response;
  if (typeof rawResult === "string" && rawResult.length > 0) return rawResult;
  throw new Error('Abacus AI returned empty/invalid response');
}

function getProviderChain(): ProviderConfig[] {
  return [
    {
      name: 'abacus',
      model: 'gpt-4.1-mini',
      enabled: !!process.env.ABACUSAI_API_KEY,
      call: callAbacus,
    },
    {
      name: 'openai',
      model: 'gpt-4o-mini',
      enabled: !!process.env.OPENAI_API_KEY,
      call: callOpenAI,
    },
    {
      name: 'claude',
      model: 'claude-haiku-4-5',
      enabled: !!(process.env.ANTHROPIC_API_KEY || process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY),
      call: callClaude,
    },
    {
      name: 'gemini',
      model: 'gemini-1.5-pro',
      enabled: !!process.env.GOOGLE_GEMINI_API_KEY,
      call: callGemini,
    },
    {
      name: 'self-hosted',
      model: 'self-hosted',
      enabled: !!process.env.SELF_HOSTED_AI_ENDPOINT,
      call: callSelfHosted,
    },
  ];
}

export async function callWithFallback(
  prompt: string,
  options?: {
    systemPrompt?: string;
    preferredProvider?: string;
    maxRetries?: number;
    maxTokens?: number;
  }
): Promise<AIProviderResult> {
  const chain = getProviderChain().filter(p => p.enabled);
  const { systemPrompt, preferredProvider, maxRetries = 1, maxTokens } = options || {};

  if (preferredProvider) {
    const preferredIdx = chain.findIndex(p => p.name === preferredProvider);
    if (preferredIdx > 0) {
      const [preferred] = chain.splice(preferredIdx, 1);
      chain.unshift(preferred);
    }
  }

  if (chain.length === 0) {
    throw new Error('[AI Fallback] No AI providers are configured. Set at least one API key.');
  }

  let lastError: Error | null = null;
  let fallbackUsed = false;

  for (let i = 0; i < chain.length; i++) {
    const provider = chain[i];
    if (i > 0) fallbackUsed = true;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[AI Fallback] Trying ${provider.name} (${provider.model})${attempt > 0 ? ` retry ${attempt}` : ''}${fallbackUsed ? ' [fallback]' : ''}`);
        const response = await provider.call(prompt, systemPrompt, maxTokens);

        if (response && response.length > 0) {
          console.log(`[AI Fallback] Success via ${provider.name} (${provider.model}), response length: ${response.length}`);
          return {
            response,
            provider: provider.name,
            model: provider.model,
            fallbackUsed,
          };
        }
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.warn(`[AI Fallback] ${provider.name} failed${attempt > 0 ? ` (attempt ${attempt + 1})` : ''}: ${lastError.message}`);
      }
    }
  }

  throw new Error(`[AI Fallback] All providers failed. Last error: ${lastError?.message}`);
}

export function getAvailableProviders(): string[] {
  return getProviderChain().filter(p => p.enabled).map(p => `${p.name}:${p.model}`);
}
