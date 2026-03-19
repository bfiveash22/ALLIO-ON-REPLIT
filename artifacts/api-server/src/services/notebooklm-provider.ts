import { GoogleGenAI } from '@google/genai';
import { searchAllKnowledge } from './knowledge-base';
import { searchDriveLibrary } from './drive';
import { searchAllSources } from './research-apis';

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || process.env.AI_INTEGRATIONS_GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;
try {
    if (apiKey) {
        ai = new GoogleGenAI({ apiKey });
    }
} catch (e) {
    console.error('[NotebookLM] Failed to initialize Gemini:', e);
}

export function isNotebookLMAvailable(): boolean {
    return ai !== null;
}

async function gatherSources(topic: string, sourceTypes: string[] = ['knowledge', 'drive', 'research']): Promise<{ source: string; content: string }[]> {
    const sources: { source: string; content: string }[] = [];

    const promises: Promise<void>[] = [];

    if (sourceTypes.includes('knowledge')) {
        promises.push(
            searchAllKnowledge(topic).then(results => {
                if (results && typeof results === 'string') {
                    sources.push({
                        source: 'Knowledge Base: Internal',
                        content: results,
                    });
                }
            }).catch(() => {})
        );
    }

    if (sourceTypes.includes('drive')) {
        promises.push(
            searchDriveLibrary(topic).then(results => {
                if (results && Array.isArray(results)) {
                    for (const r of results.slice(0, 5)) {
                        sources.push({
                            source: `Google Drive: ${r.name || 'Document'}`,
                            content: r.name || '',
                        });
                    }
                }
            }).catch(() => {})
        );
    }

    if (sourceTypes.includes('research')) {
        promises.push(
            searchAllSources({ query: topic, limit: 5 }).then(results => {
                if (results.success && results.papers) {
                    for (const p of results.papers.slice(0, 5)) {
                        sources.push({
                            source: `Research: ${p.title} (${p.source || 'Academic'})`,
                            content: p.abstract || p.tldr || p.title,
                        });
                    }
                }
            }).catch(() => {})
        );
    }

    await Promise.all(promises);
    return sources;
}

function formatSourcesForContext(sources: { source: string; content: string }[]): string {
    if (sources.length === 0) return 'No sources found.';
    return sources.map((s, i) =>
        `[Source ${i + 1}] ${s.source}\n${s.content}`
    ).join('\n\n---\n\n');
}

export async function notebookSourceQuery(
    question: string,
    topic: string,
    sourceTypes?: string[]
): Promise<{ answer: string; sources: { source: string; content: string }[] }> {
    if (!ai) throw new Error('NotebookLM not configured (missing Gemini API key)');

    const sources = await gatherSources(topic || question, sourceTypes);
    const sourcesText = formatSourcesForContext(sources);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are a NotebookLM-style research assistant for Forgotten Formula PMA. You ONLY answer based on the provided sources. If the sources don't contain enough information, say so explicitly.

SOURCES:
${sourcesText}

QUESTION: ${question}

Instructions:
- Answer the question using ONLY the provided sources
- Cite sources by number [Source N] when making claims
- If sources are insufficient, clearly state what information is missing
- Be thorough but concise
- Organize your answer with clear structure`,
    });

    return {
        answer: response.text || 'No answer generated.',
        sources,
    };
}

export async function notebookStudyGuide(
    topic: string,
    sourceTypes?: string[]
): Promise<{ guide: string; sources: { source: string; content: string }[] }> {
    if (!ai) throw new Error('NotebookLM not configured');

    const sources = await gatherSources(topic, sourceTypes);
    const sourcesText = formatSourcesForContext(sources);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are a NotebookLM-style study guide creator for Forgotten Formula PMA.

SOURCES:
${sourcesText}

TOPIC: ${topic}

Create a comprehensive study guide that includes:
1. **Key Concepts** — Core ideas and definitions
2. **Important Facts** — Critical data points and findings
3. **Connections** — How concepts relate to each other
4. **Clinical Applications** — Practical healthcare/wellness relevance
5. **Review Questions** — 5-10 questions to test understanding
6. **Summary** — Brief overview of the entire topic

Base everything on the provided sources. Cite [Source N] for each major claim.`,
    });

    return {
        guide: response.text || 'No guide generated.',
        sources,
    };
}

export async function notebookBriefingDoc(
    topic: string,
    audience: string = 'Trustee',
    sourceTypes?: string[]
): Promise<{ briefing: string; sources: { source: string; content: string }[] }> {
    if (!ai) throw new Error('NotebookLM not configured');

    const sources = await gatherSources(topic, sourceTypes);
    const sourcesText = formatSourcesForContext(sources);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are a NotebookLM-style briefing document creator for Forgotten Formula PMA.

SOURCES:
${sourcesText}

TOPIC: ${topic}
TARGET AUDIENCE: ${audience}

Create a professional briefing document that includes:
1. **Executive Summary** — 2-3 paragraph overview
2. **Key Findings** — Bullet-pointed critical discoveries
3. **Background** — Context and history
4. **Analysis** — Deep dive into the data and implications
5. **Recommendations** — Actionable next steps
6. **Source References** — List all sources used

Tone: Professional, evidence-based, suitable for ${audience}.
Base everything on the provided sources. Cite [Source N] throughout.`,
    });

    return {
        briefing: response.text || 'No briefing generated.',
        sources,
    };
}

export async function notebookMultiDocSynthesis(
    documents: string[],
    synthesisGoal: string
): Promise<string> {
    if (!ai) throw new Error('NotebookLM not configured');

    const docsText = documents.map((d, i) =>
        `[Document ${i + 1}]\n${d}`
    ).join('\n\n===\n\n');

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are a NotebookLM-style multi-document synthesis engine for Forgotten Formula PMA.

DOCUMENTS:
${docsText}

SYNTHESIS GOAL: ${synthesisGoal}

Instructions:
- Analyze all documents together to find patterns, connections, and insights
- Identify areas of agreement and disagreement between documents
- Synthesize a unified analysis that draws from all sources
- Cite [Document N] when referencing specific documents
- Highlight any gaps or contradictions between sources
- Provide actionable conclusions based on the combined analysis`,
    });

    return response.text || 'No synthesis generated.';
}

export async function notebookAudioScript(
    topic: string,
    sourceTypes?: string[],
    duration: 'short' | 'medium' | 'long' = 'medium'
): Promise<{ script: string; sources: { source: string; content: string }[] }> {
    if (!ai) throw new Error('NotebookLM not configured');

    const sources = await gatherSources(topic, sourceTypes);
    const sourcesText = formatSourcesForContext(sources);

    const durationGuide: Record<string, string> = {
        'short': '3-5 minutes (~500-800 words)',
        'medium': '8-12 minutes (~1200-1800 words)',
        'long': '15-20 minutes (~2500-3500 words)',
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are a NotebookLM-style audio overview script writer for Forgotten Formula PMA.

SOURCES:
${sourcesText}

TOPIC: ${topic}
TARGET LENGTH: ${durationGuide[duration]}

Create a conversational audio overview script in the style of a podcast between two hosts discussing the topic. The script should:

1. Start with a brief, engaging introduction
2. Cover all key points from the sources in an accessible way
3. Use a conversational, engaging tone (not academic)
4. Include natural transitions between subtopics
5. Reference source material naturally (e.g., "According to the research...")
6. End with key takeaways and a brief conclusion
7. Format as:
   HOST 1: [dialogue]
   HOST 2: [dialogue]

Make it informative yet engaging — like a well-produced educational podcast.
Base all content on the provided sources.`,
    });

    return {
        script: response.text || 'No script generated.',
        sources,
    };
}

export const NOTEBOOKLM_TOOLS_DEFINITIONS = [
    {
        type: 'function' as const,
        function: {
            name: 'notebook_source_query',
            description: 'Ask a question grounded in FFPMA knowledge sources (knowledge base, Google Drive, research papers). Returns a source-cited answer like NotebookLM.',
            parameters: {
                type: 'object',
                properties: {
                    question: { type: 'string', description: 'The question to answer' },
                    topic: { type: 'string', description: 'Topic area for source gathering (helps find relevant sources)' },
                    source_types: {
                        type: 'array',
                        items: { type: 'string', enum: ['knowledge', 'drive', 'research'] },
                        description: 'Which source types to search (default: all)',
                    },
                },
                required: ['question'],
            },
        },
    },
    {
        type: 'function' as const,
        function: {
            name: 'notebook_study_guide',
            description: 'Generate a comprehensive study guide on a topic using FFPMA sources. Includes key concepts, facts, clinical applications, and review questions.',
            parameters: {
                type: 'object',
                properties: {
                    topic: { type: 'string', description: 'The topic for the study guide' },
                    source_types: {
                        type: 'array',
                        items: { type: 'string', enum: ['knowledge', 'drive', 'research'] },
                        description: 'Which source types to search (default: all)',
                    },
                },
                required: ['topic'],
            },
        },
    },
    {
        type: 'function' as const,
        function: {
            name: 'notebook_briefing_doc',
            description: 'Generate a professional briefing document on a topic for a specific audience. Source-grounded with executive summary, findings, analysis, and recommendations.',
            parameters: {
                type: 'object',
                properties: {
                    topic: { type: 'string', description: 'The briefing topic' },
                    audience: { type: 'string', description: 'Target audience (default: Trustee)' },
                    source_types: {
                        type: 'array',
                        items: { type: 'string', enum: ['knowledge', 'drive', 'research'] },
                        description: 'Which source types to search (default: all)',
                    },
                },
                required: ['topic'],
            },
        },
    },
    {
        type: 'function' as const,
        function: {
            name: 'notebook_multi_doc_synthesis',
            description: 'Synthesize multiple documents together to find patterns, connections, agreements, and contradictions. Like NotebookLM multi-source analysis.',
            parameters: {
                type: 'object',
                properties: {
                    documents: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Array of document texts to synthesize',
                    },
                    synthesis_goal: { type: 'string', description: 'What the synthesis should focus on or achieve' },
                },
                required: ['documents', 'synthesis_goal'],
            },
        },
    },
    {
        type: 'function' as const,
        function: {
            name: 'notebook_audio_script',
            description: 'Generate a podcast-style audio overview script on a topic, grounded in FFPMA sources. Like NotebookLM Audio Overview feature.',
            parameters: {
                type: 'object',
                properties: {
                    topic: { type: 'string', description: 'The topic for the audio overview' },
                    duration: {
                        type: 'string',
                        enum: ['short', 'medium', 'long'],
                        description: 'Script length: short (3-5min), medium (8-12min), long (15-20min). Default: medium',
                    },
                    source_types: {
                        type: 'array',
                        items: { type: 'string', enum: ['knowledge', 'drive', 'research'] },
                        description: 'Which source types to search (default: all)',
                    },
                },
                required: ['topic'],
            },
        },
    },
];

export async function handleNotebookLMToolCall(toolName: string, args: Record<string, any>): Promise<string> {
    switch (toolName) {
        case 'notebook_source_query': {
            const result = await notebookSourceQuery(args.question, args.topic || args.question, args.source_types);
            return `${result.answer}\n\n---\nSources used: ${result.sources.map(s => s.source).join('; ')}`;
        }
        case 'notebook_study_guide': {
            const result = await notebookStudyGuide(args.topic, args.source_types);
            return `${result.guide}\n\n---\nSources used: ${result.sources.map(s => s.source).join('; ')}`;
        }
        case 'notebook_briefing_doc': {
            const result = await notebookBriefingDoc(args.topic, args.audience || 'Trustee', args.source_types);
            return `${result.briefing}\n\n---\nSources used: ${result.sources.map(s => s.source).join('; ')}`;
        }
        case 'notebook_multi_doc_synthesis':
            return notebookMultiDocSynthesis(args.documents, args.synthesis_goal);
        case 'notebook_audio_script': {
            const result = await notebookAudioScript(args.topic, args.source_types, args.duration || 'medium');
            return `${result.script}\n\n---\nSources used: ${result.sources.map(s => s.source).join('; ')}`;
        }
        default:
            throw new Error(`Unknown NotebookLM tool: ${toolName}`);
    }
}
