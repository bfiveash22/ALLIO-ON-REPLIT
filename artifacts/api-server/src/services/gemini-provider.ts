import { GoogleGenAI } from '@google/genai';
import { execSync } from 'child_process';

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || process.env.AI_INTEGRATIONS_GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;
try {
    if (apiKey) {
        ai = new GoogleGenAI({ apiKey });
        console.log('[Gemini Provider] Initialized with SDK + CLI bridge');
    }
} catch (e) {
    console.error('[Gemini Provider] Failed to initialize:', e);
}

export function isGeminiAvailable(): boolean {
    return ai !== null;
}

export async function analyzeWithGemini(prompt: string, context?: string): Promise<string> {
    if (!ai) {
        throw new Error('Gemini API is not configured (missing GEMINI_API_KEY)');
    }

    try {
        const fullPrompt = context ? `Context:\n${context}\n\nTask:\n${prompt}` : prompt;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
        });

        return response.text || "No analysis returned.";
    } catch (error: any) {
        console.error('[Gemini API] Error:', error);
        throw new Error(`Gemini Analysis Failed: ${error.message}`);
    }
}

export async function geminiDeepAnalysis(prompt: string, options?: {
    model?: string;
    maxTokens?: number;
    systemInstruction?: string;
}): Promise<string> {
    if (!ai) {
        throw new Error('Gemini API is not configured');
    }

    try {
        const config: any = {};
        if (options?.maxTokens) config.maxOutputTokens = options.maxTokens;

        const response = await ai.models.generateContent({
            model: options?.model || 'gemini-2.5-flash',
            contents: prompt,
            config,
        });

        return response.text || "No analysis returned.";
    } catch (error: any) {
        console.error('[Gemini Deep Analysis] Error:', error);
        throw new Error(`Gemini Deep Analysis Failed: ${error.message}`);
    }
}

export async function geminiSummarize(text: string, style: 'brief' | 'detailed' | 'bullet-points' = 'detailed'): Promise<string> {
    const styleInstructions: Record<string, string> = {
        'brief': 'Provide a concise 2-3 sentence summary.',
        'detailed': 'Provide a comprehensive summary with key points and conclusions.',
        'bullet-points': 'Summarize as organized bullet points with main themes and sub-points.',
    };

    return analyzeWithGemini(
        `${styleInstructions[style]}\n\nText to summarize:\n${text}`
    );
}

export async function geminiResearch(topic: string, depth: 'overview' | 'comprehensive' = 'comprehensive'): Promise<string> {
    const depthInstruction = depth === 'overview'
        ? 'Provide a high-level overview with key facts and current understanding.'
        : 'Provide an in-depth analysis with scientific backing, historical context, mechanisms of action, and clinical applications where relevant.';

    return analyzeWithGemini(
        `Research Topic: ${topic}\n\n${depthInstruction}\n\nInclude citations to notable studies or reviews where possible. Focus on evidence-based information relevant to healthcare and wellness.`
    );
}

export async function geminiCodeReview(code: string, language: string = 'typescript'): Promise<string> {
    return analyzeWithGemini(
        `Review the following ${language} code for:\n1. Bugs and potential issues\n2. Security vulnerabilities\n3. Performance improvements\n4. Best practices\n5. Suggestions for improvement\n\nProvide actionable feedback.\n\n\`\`\`${language}\n${code}\n\`\`\``
    );
}

export async function geminiTransform(content: string, targetFormat: string): Promise<string> {
    return analyzeWithGemini(
        `Transform the following content into ${targetFormat} format. Preserve all key information while adapting the structure and presentation.\n\nContent:\n${content}`
    );
}

export function getGeminiCliPath(): string | null {
    try {
        const path = execSync('which gemini 2>/dev/null', { encoding: 'utf-8' }).trim();
        return path || null;
    } catch {
        return null;
    }
}

export function getGeminiCliVersion(): string | null {
    const cliPath = getGeminiCliPath();
    if (!cliPath) return null;
    return '0.34.0';
}

export const GEMINI_TOOLS_DEFINITIONS = [
    {
        type: 'function' as const,
        function: {
            name: 'gemini_deep_analysis',
            description: 'Perform deep analysis using Google Gemini AI. Use for complex reasoning, large context processing, multimodal analysis, and scientific research synthesis.',
            parameters: {
                type: 'object',
                properties: {
                    prompt: {
                        type: 'string',
                        description: 'The analysis prompt or question',
                    },
                    context: {
                        type: 'string',
                        description: 'Additional context to include (optional)',
                    },
                },
                required: ['prompt'],
            },
        },
    },
    {
        type: 'function' as const,
        function: {
            name: 'gemini_summarize',
            description: 'Summarize text content using Gemini AI. Supports brief, detailed, or bullet-point formats.',
            parameters: {
                type: 'object',
                properties: {
                    text: {
                        type: 'string',
                        description: 'The text to summarize',
                    },
                    style: {
                        type: 'string',
                        enum: ['brief', 'detailed', 'bullet-points'],
                        description: 'Summary style (default: detailed)',
                    },
                },
                required: ['text'],
            },
        },
    },
    {
        type: 'function' as const,
        function: {
            name: 'gemini_research',
            description: 'Research a topic using Gemini AI with deep knowledge synthesis. Good for scientific, medical, and healthcare topics.',
            parameters: {
                type: 'object',
                properties: {
                    topic: {
                        type: 'string',
                        description: 'The research topic',
                    },
                    depth: {
                        type: 'string',
                        enum: ['overview', 'comprehensive'],
                        description: 'Research depth (default: comprehensive)',
                    },
                },
                required: ['topic'],
            },
        },
    },
    {
        type: 'function' as const,
        function: {
            name: 'gemini_code_review',
            description: 'Review code for bugs, security issues, and improvements using Gemini AI.',
            parameters: {
                type: 'object',
                properties: {
                    code: {
                        type: 'string',
                        description: 'The code to review',
                    },
                    language: {
                        type: 'string',
                        description: 'Programming language (default: typescript)',
                    },
                },
                required: ['code'],
            },
        },
    },
    {
        type: 'function' as const,
        function: {
            name: 'gemini_transform',
            description: 'Transform content between formats using Gemini AI (e.g., markdown to HTML, raw notes to structured document, data to report).',
            parameters: {
                type: 'object',
                properties: {
                    content: {
                        type: 'string',
                        description: 'The content to transform',
                    },
                    target_format: {
                        type: 'string',
                        description: 'Target format or structure (e.g., "markdown", "HTML", "structured report", "executive summary")',
                    },
                },
                required: ['content', 'target_format'],
            },
        },
    },
];

export async function handleGeminiToolCall(toolName: string, args: Record<string, any>): Promise<string> {
    switch (toolName) {
        case 'gemini_deep_analysis':
            return analyzeWithGemini(args.prompt, args.context);
        case 'gemini_summarize':
            return geminiSummarize(args.text, args.style || 'detailed');
        case 'gemini_research':
            return geminiResearch(args.topic, args.depth || 'comprehensive');
        case 'gemini_code_review':
            return geminiCodeReview(args.code, args.language || 'typescript');
        case 'gemini_transform':
            return geminiTransform(args.content, args.target_format);
        default:
            throw new Error(`Unknown Gemini tool: ${toolName}`);
    }
}
