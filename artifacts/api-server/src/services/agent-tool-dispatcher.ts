import { handleGeminiToolCall, GEMINI_TOOLS_DEFINITIONS } from './gemini-provider';
import { handleNotebookLMToolCall, NOTEBOOKLM_TOOLS_DEFINITIONS } from './notebooklm-provider';
import { mcpClientManager, getMcpToolsAsOpenAIFormat } from './mcp-client-manager';
import { searchAllKnowledge } from './knowledge-base';
import { readDocument } from './docs';
import { readSheet } from './sheets';
import { createCalendarEvent, listUpcomingEvents } from './calendar';
import { searchAllSources } from './research-apis';
import { generateImage as hfGenerateImage } from './huggingface-media';

const MCP_FILESYSTEM_READONLY_ALLOWLIST = new Set([
  'read_file',
  'read_text_file',
  'read_media_file',
  'read_multiple_files',
  'list_directory',
  'list_directory_with_sizes',
  'directory_tree',
  'search_files',
  'get_file_info',
  'list_allowed_directories',
]);

function filterReadOnlyMcpTools(tools: any[]): any[] {
  return tools.filter(tool => {
    const rawName: string = tool.function?.name || '';
    const parts = rawName.split('_');
    if (parts[0] === 'mcp' && parts[1] === 'filesystem') {
      const operationName = parts.slice(2).join('_');
      return MCP_FILESYSTEM_READONLY_ALLOWLIST.has(operationName);
    }
    return true;
  });
}

export interface AgentToolSet {
  tools: any[];
  dispatcher: (toolName: string, args: Record<string, any>) => Promise<string>;
}

const SEARCH_ALL_KNOWLEDGE_DEFINITION = {
  type: 'function' as const,
  function: {
    name: 'search_all_knowledge',
    description: 'Search ALL knowledge sources at once — local knowledge base files, compound interaction data, library database, and Drive documents. Use this before answering factual questions or generating content requiring internal accuracy.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The search query' },
        agentId: { type: 'string', description: 'Agent ID for specialty-prioritized results (optional)' },
      },
      required: ['query'],
    },
  },
};

const READ_DOCUMENT_DEFINITION = {
  type: 'function' as const,
  function: {
    name: 'read_google_doc',
    description: 'Read the text content of a Google Doc by its document ID.',
    parameters: {
      type: 'object',
      properties: {
        documentId: { type: 'string', description: 'The Google Docs document ID' },
      },
      required: ['documentId'],
    },
  },
};

const READ_SHEET_DEFINITION = {
  type: 'function' as const,
  function: {
    name: 'read_google_sheet',
    description: 'Read data from a Google Sheet. Returns cell values for the specified range.',
    parameters: {
      type: 'object',
      properties: {
        spreadsheetId: { type: 'string', description: 'The Google Sheets spreadsheet ID' },
        range: { type: 'string', description: 'The A1 notation range (e.g. "Sheet1!A1:D10")' },
      },
      required: ['spreadsheetId', 'range'],
    },
  },
};

const CREATE_CALENDAR_EVENT_DEFINITION = {
  type: 'function' as const,
  function: {
    name: 'create_calendar_event',
    description: 'Create a Google Calendar event with optional Meet link and attendees.',
    parameters: {
      type: 'object',
      properties: {
        summary: { type: 'string', description: 'Event title' },
        description: { type: 'string', description: 'Event description (optional)' },
        startTime: { type: 'string', description: 'Start time as ISO string (e.g. 2026-03-25T10:00:00Z)' },
        endTime: { type: 'string', description: 'End time as ISO string' },
        attendees: { type: 'array', items: { type: 'string' }, description: 'List of attendee email addresses (optional)' },
        addMeetLink: { type: 'boolean', description: 'Whether to add a Google Meet link (optional)' },
      },
      required: ['summary', 'startTime', 'endTime'],
    },
  },
};

const LIST_CALENDAR_EVENTS_DEFINITION = {
  type: 'function' as const,
  function: {
    name: 'list_upcoming_calendar_events',
    description: 'List upcoming events from the primary Google Calendar.',
    parameters: {
      type: 'object',
      properties: {
        maxResults: { type: 'number', description: 'Maximum number of events to return (default: 10)' },
      },
    },
  },
};

const RESEARCH_SEARCH_DEFINITION = {
  type: 'function' as const,
  function: {
    name: 'research_search',
    description: 'Search scientific literature using multiple research APIs (PubMed, OpenAlex, Semantic Scholar, ArXiv). Use for finding evidence-based information, clinical research, and scientific papers.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The research query' },
        sources: {
          type: 'array',
          items: { type: 'string', enum: ['openalex', 'pubmed', 'semantic_scholar', 'arxiv'] },
          description: 'Which research sources to search (default: all available)',
        },
        limit: { type: 'number', description: 'Max papers to return (default: 5)' },
      },
      required: ['query'],
    },
  },
};

const GENERATE_IMAGE_DEFINITION = {
  type: 'function' as const,
  function: {
    name: 'generate_image',
    description: 'Generate an image using AI (HuggingFace diffusion models). Use for creating marketing visuals, brand assets, healing imagery, and illustrative content.',
    parameters: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Detailed text description of the image to generate' },
        style: {
          type: 'string',
          enum: ['healing', 'professional', 'nature', 'abstract'],
          description: 'Visual style of the image (default: healing)',
        },
      },
      required: ['prompt'],
    },
  },
};

const DIVISION_TOOL_CONFIG: Record<string, {
  includeGemini: boolean;
  includeNotebookLM: boolean;
  includeMCP: boolean;
  includeResearch: boolean;
  includeDocuments: boolean;
  includeCalendar: boolean;
  includeImageGeneration: boolean;
}> = {
  engineering: {
    includeGemini: true,
    includeNotebookLM: false,
    includeMCP: true,
    includeResearch: false,
    includeDocuments: true,
    includeCalendar: false,
    includeImageGeneration: false,
  },
  science: {
    includeGemini: true,
    includeNotebookLM: true,
    includeMCP: true,
    includeResearch: true,
    includeDocuments: true,
    includeCalendar: false,
    includeImageGeneration: false,
  },
  legal: {
    includeGemini: false,
    includeNotebookLM: true,
    includeMCP: false,
    includeResearch: false,
    includeDocuments: true,
    includeCalendar: false,
    includeImageGeneration: false,
  },
  marketing: {
    includeGemini: true,
    includeNotebookLM: false,
    includeMCP: false,
    includeResearch: false,
    includeDocuments: true,
    includeCalendar: false,
    includeImageGeneration: true,
  },
  executive: {
    includeGemini: true,
    includeNotebookLM: true,
    includeMCP: true,
    includeResearch: true,
    includeDocuments: true,
    includeCalendar: true,
    includeImageGeneration: true,
  },
  financial: {
    includeGemini: false,
    includeNotebookLM: true,
    includeMCP: false,
    includeResearch: false,
    includeDocuments: true,
    includeCalendar: false,
    includeImageGeneration: false,
  },
  support: {
    includeGemini: false,
    includeNotebookLM: true,
    includeMCP: false,
    includeResearch: false,
    includeDocuments: true,
    includeCalendar: false,
    includeImageGeneration: false,
  },
};

export function buildDivisionToolSet(division: string, agentId: string): AgentToolSet {
  const divisionLower = division.toLowerCase();
  const config = DIVISION_TOOL_CONFIG[divisionLower] || DIVISION_TOOL_CONFIG['support'];

  const tools: any[] = [SEARCH_ALL_KNOWLEDGE_DEFINITION];

  if (config.includeGemini) {
    tools.push(...GEMINI_TOOLS_DEFINITIONS);
  }

  if (config.includeNotebookLM) {
    tools.push(...NOTEBOOKLM_TOOLS_DEFINITIONS);
  }

  if (config.includeMCP) {
    const mcpTools = filterReadOnlyMcpTools(getMcpToolsAsOpenAIFormat(divisionLower));
    tools.push(...mcpTools);
  }

  if (config.includeResearch) {
    tools.push(RESEARCH_SEARCH_DEFINITION);
  }

  if (config.includeDocuments) {
    tools.push(READ_DOCUMENT_DEFINITION);
    tools.push(READ_SHEET_DEFINITION);
  }

  if (config.includeCalendar) {
    tools.push(CREATE_CALENDAR_EVENT_DEFINITION);
    tools.push(LIST_CALENDAR_EVENTS_DEFINITION);
  }

  if (config.includeImageGeneration) {
    tools.push(GENERATE_IMAGE_DEFINITION);
  }

  const dispatcher = async (toolName: string, args: Record<string, any>): Promise<string> => {
    console.log(`[AgentToolDispatcher] Dispatching tool: ${toolName} for ${agentId} (${division})`);

    if (toolName === 'search_all_knowledge') {
      return searchAllKnowledge(args.query, args.agentId || agentId);
    }

    if (toolName.startsWith('gemini_')) {
      return handleGeminiToolCall(toolName, args);
    }

    if (toolName.startsWith('notebook_')) {
      return handleNotebookLMToolCall(toolName, args);
    }

    if (toolName.startsWith('mcp_')) {
      const parts = toolName.split('_');
      if (parts[1] === 'filesystem') {
        const operationName = parts.slice(2).join('_');
        if (!MCP_FILESYSTEM_READONLY_ALLOWLIST.has(operationName)) {
          throw new Error(`[Security] Filesystem write operation blocked: ${toolName}. Only read-only filesystem operations are permitted.`);
        }
      }
      const match = mcpClientManager.isToolFromMcp(toolName);
      if (!match) {
        throw new Error(`MCP tool not found: ${toolName}`);
      }
      const result = await mcpClientManager.callTool(match.serverId, match.tool.name, args);
      return typeof result === 'string' ? result : JSON.stringify(result, null, 2);
    }

    if (toolName === 'research_search') {
      const result = await searchAllSources({
        query: args.query,
        limit: args.limit || 5,
        sources: args.sources,
      });
      if (!result.success || result.papers.length === 0) {
        return 'No research papers found for that query.';
      }
      return result.papers.map((p: any, i: number) =>
        `[${i + 1}] ${p.title}\nAuthors: ${(p.authors || []).join(', ')}\nAbstract: ${p.abstract || p.tldr || 'N/A'}`
      ).join('\n\n');
    }

    if (toolName === 'read_google_doc') {
      return readDocument(args.documentId);
    }

    if (toolName === 'read_google_sheet') {
      const rows = await readSheet(args.spreadsheetId, args.range);
      if (!rows || rows.length === 0) return 'No data found in that range.';
      return rows.map(row => row.join('\t')).join('\n');
    }

    if (toolName === 'create_calendar_event') {
      const result = await createCalendarEvent({
        summary: args.summary,
        description: args.description,
        startTime: args.startTime,
        endTime: args.endTime,
        attendees: args.attendees,
        addMeetLink: args.addMeetLink,
      });
      return `Calendar event created: ${result.eventLink || 'success'}${result.meetLink ? '\nMeet link: ' + result.meetLink : ''}`;
    }

    if (toolName === 'list_upcoming_calendar_events') {
      const events = await listUpcomingEvents(args.maxResults || 10);
      if (!events || (Array.isArray(events) && events.length === 0)) return 'No upcoming events found.';
      return JSON.stringify(events, null, 2);
    }

    if (toolName === 'generate_image') {
      const result = await hfGenerateImage({ prompt: args.prompt, style: args.style || 'healing' });
      return `Image generated successfully. Model used: ${result.modelUsed}. The image blob is available (${result.imageBlob.size} bytes). Note: In the agentic context, use this to describe the image that should be created; the actual image upload is handled by the task execution pipeline.`;
    }

    throw new Error(`Unknown tool: ${toolName}`);
  };

  return { tools, dispatcher };
}
