import { describe, it, expect, vi, beforeEach } from 'vitest';

interface ToolParameter {
  type: string;
  description?: string;
  enum?: string[];
  items?: { type: string };
}

interface ToolParameterSchema {
  type: 'object';
  properties: Record<string, ToolParameter>;
  required?: string[];
}

interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: ToolParameterSchema;
  };
}

vi.mock('../../artifacts/api-server/src/services/gemini-provider', () => ({
  GEMINI_TOOLS_DEFINITIONS: [
    {
      type: 'function' as const,
      function: {
        name: 'gemini_deep_analysis',
        description: 'Analyze text with Gemini',
        parameters: { type: 'object', properties: { prompt: { type: 'string' } }, required: ['prompt'] },
      },
    },
  ] as ToolDefinition[],
  handleGeminiToolCall: vi.fn().mockResolvedValue('gemini result'),
  isGeminiAvailable: vi.fn().mockReturnValue(true),
}));

vi.mock('../../artifacts/api-server/src/services/notebooklm-provider', () => ({
  NOTEBOOKLM_TOOLS_DEFINITIONS: [
    {
      type: 'function' as const,
      function: {
        name: 'notebook_source_query',
        description: 'Query with source grounding',
        parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
      },
    },
  ] as ToolDefinition[],
  handleNotebookLMToolCall: vi.fn().mockResolvedValue('notebook result'),
  isNotebookLMAvailable: vi.fn().mockReturnValue(true),
}));

vi.mock('../../artifacts/api-server/src/services/mcp-client-manager', () => ({
  mcpClientManager: {
    isToolFromMcp: vi.fn().mockReturnValue(null),
    callTool: vi.fn(),
  },
  getMcpToolsAsOpenAIFormat: vi.fn().mockReturnValue([]),
}));

vi.mock('../../artifacts/api-server/src/services/knowledge-base', () => ({
  searchAllKnowledge: vi.fn().mockResolvedValue('knowledge base results'),
}));

vi.mock('../../artifacts/api-server/src/services/docs', () => ({
  readDocument: vi.fn().mockResolvedValue('document content'),
}));

vi.mock('../../artifacts/api-server/src/services/sheets', () => ({
  readSheet: vi.fn().mockResolvedValue([['A1', 'B1'], ['A2', 'B2']]),
}));

vi.mock('../../artifacts/api-server/src/services/calendar', () => ({
  createCalendarEvent: vi.fn().mockResolvedValue({ eventLink: 'https://calendar.google.com/event/123', meetLink: null }),
  listUpcomingEvents: vi.fn().mockResolvedValue([{ summary: 'Team Meeting', start: { dateTime: '2026-03-25T10:00:00Z' } }]),
}));

vi.mock('../../artifacts/api-server/src/services/research-apis', () => ({
  searchAllSources: vi.fn().mockResolvedValue({
    success: true,
    papers: [
      {
        title: 'Effects of NAD+ on Cellular Healing',
        authors: ['Smith J', 'Jones A'],
        abstract: 'NAD+ supplementation shows significant improvements in mitochondrial function.',
        source: 'pubmed',
      },
    ],
  }),
}));

vi.mock('../../artifacts/api-server/src/services/huggingface-media', () => ({
  generateImage: vi.fn().mockResolvedValue({
    modelUsed: 'stabilityai/stable-diffusion-xl-base-1.0',
    imageBlob: { size: 1024000 },
  }),
}));

import { buildDivisionToolSet, type AgentToolSet } from '../../artifacts/api-server/src/services/agent-tool-dispatcher';

type Division = 'engineering' | 'science' | 'legal' | 'marketing' | 'executive' | 'financial' | 'support';
const DIVISIONS: Division[] = ['engineering', 'science', 'legal', 'marketing', 'executive', 'financial', 'support'];

function extractToolNames(toolSet: AgentToolSet): string[] {
  return toolSet.tools.map((t: ToolDefinition) => t.function.name);
}

function assertToolDefinitionValid(tool: ToolDefinition): void {
  expect(tool.type).toBe('function');
  expect(tool).toHaveProperty('function');
  expect(typeof tool.function.name).toBe('string');
  expect(tool.function.name.length).toBeGreaterThan(0);
  expect(typeof tool.function.description).toBe('string');
  expect(tool.function.description.length).toBeGreaterThan(0);
  expect(tool.function).toHaveProperty('parameters');
  expect(tool.function.parameters.type).toBe('object');
  expect(tool.function.parameters).toHaveProperty('properties');
}

describe('buildDivisionToolSet - Schema Validation', () => {
  for (const division of DIVISIONS) {
    describe(`Division: ${division}`, () => {
      it('returns a valid AgentToolSet with tools array and dispatcher function', () => {
        const toolSet = buildDivisionToolSet(division, `${division}-lead`);

        expect(toolSet).toBeDefined();
        expect(toolSet).toHaveProperty('tools');
        expect(toolSet).toHaveProperty('dispatcher');
        expect(Array.isArray(toolSet.tools)).toBe(true);
        expect(typeof toolSet.dispatcher).toBe('function');
      });

      it('includes at least one tool (search_all_knowledge is universal)', () => {
        const { tools } = buildDivisionToolSet(division, `${division}-lead`);
        expect(tools.length).toBeGreaterThan(0);
      });

      it('always includes search_all_knowledge', () => {
        const toolSet = buildDivisionToolSet(division, `${division}-lead`);
        expect(extractToolNames(toolSet)).toContain('search_all_knowledge');
      });

      it('every tool has a valid OpenAI function definition schema', () => {
        const { tools } = buildDivisionToolSet(division, `${division}-lead`);
        for (const tool of tools as ToolDefinition[]) {
          assertToolDefinitionValid(tool);
        }
      });

      it('has no duplicate tool names within the set', () => {
        const toolSet = buildDivisionToolSet(division, `${division}-lead`);
        const names = extractToolNames(toolSet);
        const uniqueNames = new Set(names);
        expect(uniqueNames.size).toBe(names.length);
      });
    });
  }
});

describe('buildDivisionToolSet - Division-Specific Tool Sets', () => {
  it('science division includes research_search tool', () => {
    expect(extractToolNames(buildDivisionToolSet('science', 'helix'))).toContain('research_search');
  });

  it('marketing division includes generate_image tool', () => {
    expect(extractToolNames(buildDivisionToolSet('marketing', 'muse'))).toContain('generate_image');
  });

  it('executive division includes calendar tools', () => {
    const names = extractToolNames(buildDivisionToolSet('executive', 'athena'));
    expect(names).toContain('create_calendar_event');
    expect(names).toContain('list_upcoming_calendar_events');
  });

  it('legal division includes document reading tools', () => {
    const names = extractToolNames(buildDivisionToolSet('legal', 'juris'));
    expect(names).toContain('read_google_doc');
    expect(names).toContain('read_google_sheet');
  });

  it('legal division does NOT include research_search', () => {
    expect(extractToolNames(buildDivisionToolSet('legal', 'juris'))).not.toContain('research_search');
  });

  it('engineering division does NOT include generate_image tool', () => {
    expect(extractToolNames(buildDivisionToolSet('engineering', 'forge'))).not.toContain('generate_image');
  });

  it('falls back to support config for unknown divisions', () => {
    const { tools } = buildDivisionToolSet('unknown_division', 'agent-x');
    expect(tools.length).toBeGreaterThan(0);
    expect(extractToolNames(buildDivisionToolSet('unknown_division', 'agent-x'))).toContain('search_all_knowledge');
  });
});

describe('buildDivisionToolSet - Dispatcher Invocations', () => {
  it('dispatcher routes search_all_knowledge to knowledge base', async () => {
    const { searchAllKnowledge } = await import('../../artifacts/api-server/src/services/knowledge-base');
    const { dispatcher } = buildDivisionToolSet('science', 'helix');

    const result = await dispatcher('search_all_knowledge', { query: 'NAD+ cellular healing', agentId: 'helix' });

    expect(searchAllKnowledge).toHaveBeenCalledWith('NAD+ cellular healing', 'helix');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('dispatcher routes gemini_ tools to gemini handler', async () => {
    const { handleGeminiToolCall } = await import('../../artifacts/api-server/src/services/gemini-provider');
    const { dispatcher } = buildDivisionToolSet('science', 'helix');

    const result = await dispatcher('gemini_deep_analysis', { prompt: 'Analyze healing protocols' });

    expect(handleGeminiToolCall).toHaveBeenCalledWith('gemini_deep_analysis', { prompt: 'Analyze healing protocols' });
    expect(result).toBe('gemini result');
  });

  it('dispatcher routes notebook_ tools to notebooklm handler', async () => {
    const { handleNotebookLMToolCall } = await import('../../artifacts/api-server/src/services/notebooklm-provider');
    const { dispatcher } = buildDivisionToolSet('legal', 'juris');

    const result = await dispatcher('notebook_source_query', { query: 'PMA compliance requirements' });

    expect(handleNotebookLMToolCall).toHaveBeenCalledWith('notebook_source_query', { query: 'PMA compliance requirements' });
    expect(result).toBe('notebook result');
  });

  it('dispatcher routes research_search to searchAllSources', async () => {
    const { searchAllSources } = await import('../../artifacts/api-server/src/services/research-apis');
    const { dispatcher } = buildDivisionToolSet('science', 'helix');

    const result = await dispatcher('research_search', { query: 'peptide healing', limit: 3 });

    expect(searchAllSources).toHaveBeenCalledWith({ query: 'peptide healing', limit: 3, sources: undefined });
    expect(typeof result).toBe('string');
    expect(result).toContain('NAD+');
  });

  it('dispatcher routes read_google_doc correctly', async () => {
    const { readDocument } = await import('../../artifacts/api-server/src/services/docs');
    const { dispatcher } = buildDivisionToolSet('legal', 'juris');

    const result = await dispatcher('read_google_doc', { documentId: 'doc123' });

    expect(readDocument).toHaveBeenCalledWith('doc123');
    expect(result).toBe('document content');
  });

  it('dispatcher routes read_google_sheet and formats as TSV', async () => {
    const { readSheet } = await import('../../artifacts/api-server/src/services/sheets');
    const { dispatcher } = buildDivisionToolSet('legal', 'juris');

    const result = await dispatcher('read_google_sheet', { spreadsheetId: 'sheet123', range: 'Sheet1!A1:B2' });

    expect(readSheet).toHaveBeenCalledWith('sheet123', 'Sheet1!A1:B2');
    expect(result).toBe('A1\tB1\nA2\tB2');
  });

  it('dispatcher routes create_calendar_event and returns event link', async () => {
    const { createCalendarEvent } = await import('../../artifacts/api-server/src/services/calendar');
    const { dispatcher } = buildDivisionToolSet('executive', 'athena');

    const result = await dispatcher('create_calendar_event', {
      summary: 'Trustee Weekly',
      startTime: '2026-03-25T10:00:00Z',
      endTime: '2026-03-25T11:00:00Z',
    });

    expect(createCalendarEvent).toHaveBeenCalled();
    expect(result).toContain('Calendar event created');
    expect(result).toContain('https://calendar.google.com/event/123');
  });

  it('dispatcher routes list_upcoming_calendar_events correctly', async () => {
    const { listUpcomingEvents } = await import('../../artifacts/api-server/src/services/calendar');
    const { dispatcher } = buildDivisionToolSet('executive', 'athena');

    const result = await dispatcher('list_upcoming_calendar_events', { maxResults: 5 });

    expect(listUpcomingEvents).toHaveBeenCalledWith(5);
    expect(typeof result).toBe('string');
  });

  it('dispatcher routes generate_image and returns metadata string', async () => {
    const { generateImage } = await import('../../artifacts/api-server/src/services/huggingface-media');
    const { dispatcher } = buildDivisionToolSet('marketing', 'muse');

    const result = await dispatcher('generate_image', { prompt: 'Healing light energy waves', style: 'healing' });

    expect(generateImage).toHaveBeenCalledWith({ prompt: 'Healing light energy waves', style: 'healing' });
    expect(result).toContain('Image generated successfully');
    expect(result).toContain('1024000 bytes');
  });

  it('dispatcher throws for unknown tools with clear error message', async () => {
    const { dispatcher } = buildDivisionToolSet('engineering', 'forge');

    await expect(
      dispatcher('nonexistent_tool_xyz', { arg: 'value' })
    ).rejects.toThrow('Unknown tool: nonexistent_tool_xyz');
  });

  it('dispatcher returns empty sheet message when no data found', async () => {
    const { readSheet } = await import('../../artifacts/api-server/src/services/sheets');
    vi.mocked(readSheet).mockResolvedValueOnce([]);

    const { dispatcher } = buildDivisionToolSet('legal', 'juris');
    const result = await dispatcher('read_google_sheet', { spreadsheetId: 'empty', range: 'Sheet1!A1:B2' });

    expect(result).toBe('No data found in that range.');
  });

  it('dispatcher returns no-results message when research search finds nothing', async () => {
    const { searchAllSources } = await import('../../artifacts/api-server/src/services/research-apis');
    vi.mocked(searchAllSources).mockResolvedValueOnce({ success: true, papers: [] });

    const { dispatcher } = buildDivisionToolSet('science', 'helix');
    const result = await dispatcher('research_search', { query: 'obscure topic xyz' });

    expect(result).toBe('No research papers found for that query.');
  });
});

describe('buildDivisionToolSet - MCP Security: Filesystem Write Block', () => {
  it('dispatcher blocks mcp_filesystem write operations with clear security error', async () => {
    const { mcpClientManager } = await import('../../artifacts/api-server/src/services/mcp-client-manager');
    vi.mocked(mcpClientManager.isToolFromMcp).mockReturnValueOnce({
      serverId: 'filesystem',
      tool: { serverId: 'filesystem', name: 'write_file', description: '', inputSchema: {} },
    });

    const { dispatcher } = buildDivisionToolSet('engineering', 'forge');

    await expect(
      dispatcher('mcp_filesystem_write_file', { path: '/etc/hosts', content: 'malicious' })
    ).rejects.toThrow('[Security] Filesystem write operation blocked');
  });

  it('dispatcher allows mcp_filesystem read operations (read_file is whitelisted)', async () => {
    const { mcpClientManager } = await import('../../artifacts/api-server/src/services/mcp-client-manager');
    vi.mocked(mcpClientManager.isToolFromMcp).mockReturnValueOnce({
      serverId: 'filesystem',
      tool: { serverId: 'filesystem', name: 'read_file', description: 'Read a file', inputSchema: {} },
    });
    vi.mocked(mcpClientManager.callTool).mockResolvedValueOnce('file contents');

    const { dispatcher } = buildDivisionToolSet('engineering', 'forge');

    const result = await dispatcher('mcp_filesystem_read_file', { path: '/home/runner/workspace/README.md' });
    expect(result).toBe('file contents');
  });

  it('dispatcher throws with clear MCP-not-found error for unknown MCP tools', async () => {
    const { mcpClientManager } = await import('../../artifacts/api-server/src/services/mcp-client-manager');
    vi.mocked(mcpClientManager.isToolFromMcp).mockReset();
    vi.mocked(mcpClientManager.isToolFromMcp).mockReturnValue(null);

    const { dispatcher } = buildDivisionToolSet('engineering', 'forge');

    await expect(
      dispatcher('mcp_github_list_repos', {})
    ).rejects.toThrow('MCP tool not found: mcp_github_list_repos');
  });
});
