/**
 * End-to-End Integration Tests: Sentinel → Dispatcher → Tool Execution
 *
 * These tests simulate the full agentic task dispatch pipeline:
 * 1. Sentinel routes a task to the appropriate division
 * 2. The division's tool set is built via buildDivisionToolSet
 * 3. The dispatcher is invoked with a representative tool call
 * 4. The result is validated
 *
 * This covers: Science, Legal, Marketing, Engineering divisions as required.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../artifacts/api-server/src/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          {
            id: 'notif-001',
            type: 'task_routed',
            title: 'Integration Test Notification',
            message: 'Test message',
            agentId: 'TEST',
            division: 'science',
            priority: 2,
            isRead: false,
            createdAt: new Date(),
          },
        ]),
      }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  },
}));

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
  ],
  handleGeminiToolCall: vi.fn().mockResolvedValue('[Gemini] Blood panel markers show elevated inflammation indicators. Recommend mineral support protocol.'),
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
  ],
  handleNotebookLMToolCall: vi.fn().mockResolvedValue('[NotebookLM] PMA compliance requires: no public claims, member-only communications, constitutional protection under 1st/14th Amendments.'),
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
  searchAllKnowledge: vi.fn().mockResolvedValue(
    'Knowledge Base: FFPMA Protocol Library\n[1] NAD+ Cellular Restoration - Complete protocol\n[2] ECS Optimization Guide - Member wellness support\n[3] 5Rs Detoxification Protocol'
  ),
}));

vi.mock('../../artifacts/api-server/src/services/docs', () => ({
  readDocument: vi.fn().mockResolvedValue(
    'PMA Member Agreement v2.3\nThis agreement is between Forgotten Formula PMA and the member...\nConstitutional protections: 1st and 14th Amendments apply.'
  ),
}));

vi.mock('../../artifacts/api-server/src/services/sheets', () => ({
  readSheet: vi.fn().mockResolvedValue([
    ['Member ID', 'Status', 'Protocol'],
    ['M-001', 'Active', 'NAD+ Phase 2'],
    ['M-002', 'Active', 'ECS Foundation'],
  ]),
}));

vi.mock('../../artifacts/api-server/src/services/calendar', () => ({
  createCalendarEvent: vi.fn().mockResolvedValue({
    eventLink: 'https://calendar.google.com/event/abc123',
    meetLink: 'https://meet.google.com/xyz-789',
  }),
  listUpcomingEvents: vi.fn().mockResolvedValue([
    { summary: 'Trustee Weekly Review', start: { dateTime: '2026-03-25T10:00:00Z' } },
    { summary: 'Science Division Sync', start: { dateTime: '2026-03-26T14:00:00Z' } },
  ]),
}));

vi.mock('../../artifacts/api-server/src/services/research-apis', () => ({
  searchAllSources: vi.fn().mockResolvedValue({
    success: true,
    papers: [
      {
        title: 'NAD+ Supplementation Restores Mitochondrial Function',
        authors: ['Rajman L', 'Chwalek K', 'Sinclair DA'],
        abstract: 'NAD+ decline with age is linked to metabolic dysfunction. Supplementation restores cellular energy production.',
        source: 'pubmed',
      },
      {
        title: 'Peptide Therapy in Regenerative Medicine',
        authors: ['Smith JA', 'Brown KL'],
        abstract: 'BPC-157 and other peptides show remarkable wound healing and tissue regeneration properties.',
        source: 'openalex',
      },
    ],
  }),
}));

vi.mock('../../artifacts/api-server/src/services/huggingface-media', () => ({
  generateImage: vi.fn().mockResolvedValue({
    modelUsed: 'stabilityai/stable-diffusion-xl-base-1.0',
    imageBlob: { size: 2048000 },
  }),
}));

import { SentinelService, AGENT_DIVISIONS } from '../../artifacts/api-server/src/services/sentinel';
import { buildDivisionToolSet } from '../../artifacts/api-server/src/services/agent-tool-dispatcher';
import type { Division } from '../../artifacts/api-server/src/services/sentinel';

/**
 * Simulates a full task dispatch cycle:
 * 1. Sentinel routes task to division
 * 2. Build division tool set for the target agent
 * 3. Invoke a representative tool call
 * 4. Return the result
 */
async function simulateTaskDispatch(
  taskType: string,
  taskDetails: string,
  toolName: string,
  toolArgs: Record<string, unknown>
): Promise<{ division: Division; lead: string; toolResult: string }> {
  const sentinel = new SentinelService();
  const routing = await sentinel.routeTaskToDivision(taskType, taskDetails);

  const agentId = routing.lead.toLowerCase();
  const toolSet = buildDivisionToolSet(routing.division, agentId);

  const toolExists = toolSet.tools.some((t) => {
    const tool = t as { function: { name: string } };
    return tool.function.name === toolName;
  });

  if (!toolExists) {
    throw new Error(`Tool "${toolName}" is not available in ${routing.division} division tool set.`);
  }

  const toolResult = await toolSet.dispatcher(toolName, toolArgs);

  return {
    division: routing.division,
    lead: routing.lead,
    toolResult,
  };
}

describe('E2E: Science Division — Research Search Workflow', () => {
  it('routes "blood analysis" task to science, then executes research_search', async () => {
    const result = await simulateTaskDispatch(
      'blood analysis',
      'Analyze member CBC panel and identify healing protocol',
      'research_search',
      { query: 'NAD+ mitochondrial healing', limit: 2 }
    );

    expect(result.division).toBe('science');
    expect(typeof result.lead).toBe('string');
    expect(result.toolResult).toContain('NAD+');
    expect(result.toolResult).toContain('Sinclair');
  });

  it('science dispatcher successfully calls search_all_knowledge for protocol context', async () => {
    const result = await simulateTaskDispatch(
      'protocol',
      'Create peptide protocol for member recovery',
      'search_all_knowledge',
      { query: 'BPC-157 peptide healing protocol' }
    );

    expect(result.division).toBe('science');
    expect(result.toolResult).toContain('Knowledge Base');
    expect(result.toolResult).toContain('NAD+');
  });

  it('science dispatcher can invoke gemini_deep_analysis for complex analysis', async () => {
    const result = await simulateTaskDispatch(
      'analysis',
      'Deep analysis of rife frequency effectiveness',
      'gemini_deep_analysis',
      { prompt: 'Analyze the effectiveness of 528Hz frequency for cellular repair' }
    );

    expect(result.division).toBe('science');
    expect(result.toolResult).toContain('[Gemini]');
    expect(result.toolResult).toContain('inflammation');
  });

  it('science tool set does NOT expose calendar tools (not configured for science)', () => {
    const toolSet = buildDivisionToolSet('science', 'helix');
    const toolNames = toolSet.tools.map((t) => (t as { function: { name: string } }).function.name);
    expect(toolNames).not.toContain('create_calendar_event');
    expect(toolNames).not.toContain('list_upcoming_calendar_events');
  });
});

describe('E2E: Legal Division — Document Generation Workflow', () => {
  it('routes "legal" task to legal division, then executes notebook_source_query', async () => {
    const result = await simulateTaskDispatch(
      'legal',
      'Draft PMA compliance document for new member onboarding',
      'notebook_source_query',
      { query: 'PMA constitutional compliance requirements member agreements' }
    );

    expect(result.division).toBe('legal');
    expect(result.toolResult).toContain('[NotebookLM]');
    expect(result.toolResult).toContain('PMA');
    expect(result.toolResult).toContain('1st');
  });

  it('legal dispatcher reads Google Doc for member agreement context', async () => {
    const result = await simulateTaskDispatch(
      'document',
      'Review and update member informed consent document',
      'read_google_doc',
      { documentId: 'member-agreement-template-v23' }
    );

    expect(result.division).toBe('legal');
    expect(result.toolResult).toContain('PMA Member Agreement');
    expect(result.toolResult).toContain('Constitutional protections');
  });

  it('legal dispatcher can query member data from Google Sheets', async () => {
    const result = await simulateTaskDispatch(
      'compliance',
      'Audit member agreement status across member database',
      'read_google_sheet',
      { spreadsheetId: 'member-db-sheet', range: 'Members!A1:C10' }
    );

    expect(result.division).toBe('legal');
    expect(result.toolResult).toContain('Member ID');
    expect(result.toolResult).toContain('M-001');
  });

  it('legal tool set does NOT include research_search (science-only)', () => {
    const toolSet = buildDivisionToolSet('legal', 'juris');
    const toolNames = toolSet.tools.map((t) => (t as { function: { name: string } }).function.name);
    expect(toolNames).not.toContain('research_search');
  });

  it('throws clear error when tool is not available in legal division', async () => {
    await expect(
      simulateTaskDispatch('legal', 'Create visual asset', 'generate_image', { prompt: 'test' })
    ).rejects.toThrow('Tool "generate_image" is not available in legal division tool set.');
  });
});

describe('E2E: Marketing Division — Asset Creation Workflow', () => {
  it('routes "content" task to marketing, then executes generate_image', async () => {
    const result = await simulateTaskDispatch(
      'content',
      'Create healing imagery for March 2026 campaign launch',
      'generate_image',
      { prompt: 'Ethereal healing light waves with DNA helix, teal and gold colors', style: 'healing' }
    );

    expect(result.division).toBe('marketing');
    expect(result.toolResult).toContain('Image generated successfully');
    expect(result.toolResult).toContain('2048000 bytes');
  });

  it('marketing dispatcher searches knowledge base for campaign context', async () => {
    const result = await simulateTaskDispatch(
      'campaign',
      'Develop member testimonial campaign for ECS optimization',
      'search_all_knowledge',
      { query: 'ECS endocannabinoid system member wellness' }
    );

    expect(result.division).toBe('marketing');
    expect(result.toolResult).toContain('Knowledge Base');
    expect(result.toolResult).toContain('ECS');
  });

  it('marketing tool set includes generate_image and search_all_knowledge', () => {
    const toolSet = buildDivisionToolSet('marketing', 'muse');
    const toolNames = toolSet.tools.map((t) => (t as { function: { name: string } }).function.name);
    expect(toolNames).toContain('generate_image');
    expect(toolNames).toContain('search_all_knowledge');
  });

  it('marketing tool set does NOT include research_search (science-specific)', () => {
    const toolSet = buildDivisionToolSet('marketing', 'muse');
    const toolNames = toolSet.tools.map((t) => (t as { function: { name: string } }).function.name);
    expect(toolNames).not.toContain('research_search');
  });
});

describe('E2E: Engineering Division — System Query Workflow', () => {
  it('routes "integration" task to engineering, then executes search_all_knowledge', async () => {
    const result = await simulateTaskDispatch(
      'integration',
      'Build REST API integration for the platform infrastructure',
      'search_all_knowledge',
      { query: 'REST API integration architecture patterns' }
    );

    expect(result.division).toBe('engineering');
    expect(result.toolResult).toContain('Knowledge Base');
  });

  it('routes "api" task to engineering division', async () => {
    const sentinel = new SentinelService();
    const routing = await sentinel.routeTaskToDivision('api', 'Build REST API for member portal');
    expect(routing.division).toBe('engineering');
    expect(routing.routed).toBe(true);
  });

  it('engineering dispatcher enforces filesystem write block for MCP tools', async () => {
    const { mcpClientManager } = await import('../../artifacts/api-server/src/services/mcp-client-manager');
    vi.mocked(mcpClientManager.isToolFromMcp).mockReset();
    vi.mocked(mcpClientManager.isToolFromMcp).mockReturnValue(null);

    const toolSet = buildDivisionToolSet('engineering', 'forge');

    await expect(
      toolSet.dispatcher('mcp_filesystem_write_file', { path: '/etc/hosts', content: 'hacked' })
    ).rejects.toThrow('[Security] Filesystem write operation blocked');
  });

  it('engineering dispatcher returns structured error for unregistered MCP tools', async () => {
    const { mcpClientManager } = await import('../../artifacts/api-server/src/services/mcp-client-manager');
    vi.mocked(mcpClientManager.isToolFromMcp).mockReset();
    vi.mocked(mcpClientManager.isToolFromMcp).mockReturnValue(null);

    const toolSet = buildDivisionToolSet('engineering', 'forge');

    await expect(
      toolSet.dispatcher('mcp_github_create_repository', { name: 'test-repo' })
    ).rejects.toThrow('MCP tool not found:');
  });
});

describe('E2E: Executive Division — Calendar and Knowledge Workflow', () => {
  it('executive division has access to all tool categories', () => {
    const toolSet = buildDivisionToolSet('executive', 'athena');
    const toolNames = toolSet.tools.map((t) => (t as { function: { name: string } }).function.name);

    expect(toolNames).toContain('search_all_knowledge');
    expect(toolNames).toContain('create_calendar_event');
    expect(toolNames).toContain('list_upcoming_calendar_events');
    expect(toolNames).toContain('read_google_doc');
    expect(toolNames).toContain('read_google_sheet');
    expect(toolNames).toContain('research_search');
    expect(toolNames).toContain('generate_image');
  });

  it('executive dispatcher can create calendar events with Meet link', async () => {
    const toolSet = buildDivisionToolSet('executive', 'athena');
    const result = await toolSet.dispatcher('create_calendar_event', {
      summary: 'Trustee Monthly Review',
      startTime: '2026-04-01T10:00:00Z',
      endTime: '2026-04-01T11:00:00Z',
      addMeetLink: true,
    });

    expect(result).toContain('Calendar event created');
    expect(result).toContain('https://calendar.google.com/event/abc123');
    expect(result).toContain('Meet link: https://meet.google.com/xyz-789');
  });
});

describe('E2E: Cross-Division Coordination', () => {
  it('sentinel coordinates science → legal for protocol legal review', async () => {
    const sentinel = new SentinelService();
    const coordId = await sentinel.coordinateCrossDivision(
      'science',
      'legal',
      'task-science-001',
      'Legal review required for new member peptide protocol before distribution'
    );

    expect(typeof coordId).toBe('string');
    expect(coordId).toMatch(/^coord_\d+$/);
  });

  it('sentinel coordinates marketing → engineering for campaign API integration', async () => {
    const sentinel = new SentinelService();
    const coordId = await sentinel.coordinateCrossDivision(
      'marketing',
      'engineering',
      'task-marketing-002',
      'Need API endpoint to track campaign email opens and member conversions'
    );

    expect(typeof coordId).toBe('string');
    expect(coordId).toMatch(/^coord_\d+$/);
  });

  it('after coordination, each division can still build complete independent tool sets', async () => {
    const sentinel = new SentinelService();
    await sentinel.coordinateCrossDivision('science', 'legal', 'cross-001', 'test requirement');

    const scienceToolSet = buildDivisionToolSet('science', 'helix');
    const legalToolSet = buildDivisionToolSet('legal', 'juris');

    const scienceNames = scienceToolSet.tools.map((t) => (t as { function: { name: string } }).function.name);
    const legalNames = legalToolSet.tools.map((t) => (t as { function: { name: string } }).function.name);

    expect(scienceNames).toContain('research_search');
    expect(legalNames).toContain('notebook_source_query');
    expect(scienceNames).not.toContain('generate_image');
    expect(legalNames).not.toContain('research_search');
  });
});
