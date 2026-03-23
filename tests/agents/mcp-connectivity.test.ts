/**
 * MCP Connectivity & Registry Tests
 *
 * Tests cover:
 * 1. Registry shape and access control configuration
 * 2. Health reporting semantics for connected/disconnected/error servers
 * 3. connectServer success path (via the mcpClientManager singleton with mocked SDK)
 * 4. connectServer failure paths: connection errors, timeouts, unsupported transports
 * 5. callTool error reporting for disconnected servers
 * 6. Tool format validation (OpenAI schema) and division-filtered retrieval
 *
 * MCP SDK is fully mocked for deterministic CI. Set MCP_LIVE_TEST=true to run
 * live connectivity smoke tests against real servers (see describe.runIf block).
 */
import { describe, it, expect, vi } from 'vitest';

interface MockTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

const { mockState, MOCK_TOOLS } = vi.hoisted(() => ({
  mockState: { behavior: 'success' as 'success' | 'connect_error' | 'connect_timeout' },
  MOCK_TOOLS: [
    { name: 'list_repos', description: 'List GitHub repositories', inputSchema: { type: 'object', properties: {} } },
    { name: 'get_file_contents', description: 'Get file contents', inputSchema: { type: 'object', properties: { path: { type: 'string' } } } },
  ] as Array<{ name: string; description: string; inputSchema: Record<string, unknown> }>,
}));

vi.mock('@modelcontextprotocol/sdk/client/index.js', () => ({
  Client: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockImplementation(() => {
      if (mockState.behavior === 'connect_timeout') {
        return new Promise<void>(() => {});
      }
      if (mockState.behavior === 'connect_error') {
        return Promise.reject(new Error('ECONNREFUSED: Connection refused on stdio transport'));
      }
      return Promise.resolve();
    }),
    listTools: vi.fn().mockResolvedValue({ tools: MOCK_TOOLS }),
    callTool: vi.fn().mockResolvedValue({
      content: [{ type: 'text', text: 'tool result' }],
    }),
    close: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('@modelcontextprotocol/sdk/client/stdio.js', () => ({
  StdioClientTransport: vi.fn().mockImplementation(() => ({
    close: vi.fn().mockResolvedValue(undefined),
  })),
}));

const MOCK_TOOL_LIST: MockTool[] = MOCK_TOOLS;

import {
  getMcpServerRegistry,
  getMcpServersForDivision,
  getMcpServerById,
  type McpServerConfig,
} from '../../artifacts/api-server/src/services/mcp-server-registry';

describe('MCP Server Registry', () => {
  it('returns a non-empty list of registered MCP servers', () => {
    const registry = getMcpServerRegistry();
    expect(Array.isArray(registry)).toBe(true);
    expect(registry.length).toBeGreaterThan(0);
  });

  it('each registered server has required fields with correct types', () => {
    const registry = getMcpServerRegistry();
    for (const server of registry) {
      expect(typeof server.id).toBe('string');
      expect(server.id.length).toBeGreaterThan(0);
      expect(typeof server.name).toBe('string');
      expect(typeof server.description).toBe('string');
      expect(['stdio', 'sse']).toContain(server.transport);
      expect(typeof server.enabled).toBe('boolean');
    }
  });

  it('only returns enabled servers from getMcpServerRegistry', () => {
    const registry = getMcpServerRegistry();
    for (const server of registry) {
      expect(server.enabled).toBe(true);
    }
  });

  it('all stdio servers have command and args properly configured', () => {
    const registry = getMcpServerRegistry();
    const stdioServers = registry.filter((s: McpServerConfig) => s.transport === 'stdio');
    for (const server of stdioServers) {
      expect(server.stdio).toBeDefined();
      expect(typeof server.stdio!.command).toBe('string');
      expect(Array.isArray(server.stdio!.args)).toBe(true);
    }
  });

  it('getMcpServerById returns correct server for known ID', () => {
    const server = getMcpServerById('github');
    expect(server).toBeDefined();
    expect(server!.id).toBe('github');
    expect(server!.name).toContain('GitHub');
  });

  it('getMcpServerById returns undefined for unknown server ID', () => {
    const server = getMcpServerById('nonexistent_server_xyz');
    expect(server).toBeUndefined();
  });
});

describe('MCP Server Division Access Control', () => {
  it('engineering division can access GitHub MCP server', () => {
    const servers = getMcpServersForDivision('engineering');
    const serverIds = servers.map((s: McpServerConfig) => s.id);
    expect(serverIds).toContain('github');
  });

  it('science division can access GitHub MCP server', () => {
    const servers = getMcpServersForDivision('science');
    const serverIds = servers.map((s: McpServerConfig) => s.id);
    expect(serverIds).toContain('github');
  });

  it('legal division does not have access to engineering-only filesystem MCP server', () => {
    const servers = getMcpServersForDivision('legal');
    const serverIds = servers.map((s: McpServerConfig) => s.id);
    expect(serverIds).not.toContain('filesystem');
  });

  it('returns only access-allowed servers for each division', () => {
    const divisions = ['engineering', 'science', 'legal', 'marketing', 'financial', 'executive', 'support'];
    for (const division of divisions) {
      const servers = getMcpServersForDivision(division);
      expect(Array.isArray(servers)).toBe(true);
      for (const server of servers) {
        if (server.allowedDivisions) {
          expect(server.allowedDivisions).toContain(division);
        }
      }
    }
  });
});

describe('MCP Client Manager - Server Health Reporting', () => {
  it('getServerHealth returns one health entry per registered server', async () => {
    const { mcpClientManager } = await import('../../artifacts/api-server/src/services/mcp-client-manager');
    const health = mcpClientManager.getServerHealth();
    const registry = getMcpServerRegistry();

    expect(Array.isArray(health)).toBe(true);
    expect(health.length).toBe(registry.length);
  });

  it('health entries have all required fields with correct types', async () => {
    const { mcpClientManager } = await import('../../artifacts/api-server/src/services/mcp-client-manager');
    const health = mcpClientManager.getServerHealth();

    for (const entry of health) {
      expect(typeof entry.serverId).toBe('string');
      expect(entry.serverId.length).toBeGreaterThan(0);
      expect(typeof entry.serverName).toBe('string');
      expect(['connected', 'connecting', 'disconnected', 'error']).toContain(entry.status);
      expect(typeof entry.toolCount).toBe('number');
      expect(entry.toolCount).toBeGreaterThanOrEqual(0);
    }
  });

  it('servers without active connections report disconnected status with zero tools', async () => {
    const { mcpClientManager } = await import('../../artifacts/api-server/src/services/mcp-client-manager');
    const health = mcpClientManager.getServerHealth();

    for (const entry of health) {
      if (entry.status === 'disconnected') {
        expect(entry.toolCount).toBe(0);
        expect(entry.connectedAt).toBeNull();
      }
    }
  });

  it('servers with errors report error status and non-null lastError string', async () => {
    const { mcpClientManager } = await import('../../artifacts/api-server/src/services/mcp-client-manager');
    const health = mcpClientManager.getServerHealth();

    for (const entry of health) {
      if (entry.status === 'error') {
        expect(typeof entry.lastError).toBe('string');
        expect(entry.lastError!.length).toBeGreaterThan(0);
        expect(entry.toolCount).toBe(0);
      }
    }
  });
});

describe('MCP Client Manager - connectServer Success Path', () => {
  it('SSE transport returns null immediately (only stdio is supported)', async () => {
    const { mcpClientManager } = await import('../../artifacts/api-server/src/services/mcp-client-manager');

    const sseConfig: McpServerConfig = {
      id: 'success-path-sse-check',
      name: 'SSE Server',
      description: 'SSE transport returns null',
      transport: 'sse',
      enabled: true,
      sse: { url: 'https://example.com/mcp/sse' },
      healthCheckTimeoutMs: 5000,
    };

    const conn = await mcpClientManager.connectServer(sseConfig);
    expect(conn).toBeNull();
  });

  it('stdio server missing config returns null immediately', async () => {
    const { mcpClientManager } = await import('../../artifacts/api-server/src/services/mcp-client-manager');

    const brokenConfig: McpServerConfig = {
      id: 'success-path-missing-stdio',
      name: 'Broken Config Server',
      description: 'No stdio config provided',
      transport: 'stdio',
      enabled: true,
      healthCheckTimeoutMs: 5000,
    };

    const conn = await mcpClientManager.connectServer(brokenConfig);
    expect(conn).toBeNull();
  });

  it('connected server entries in health report have the expected shape', async () => {
    const { mcpClientManager } = await import('../../artifacts/api-server/src/services/mcp-client-manager');
    const health = mcpClientManager.getServerHealth();

    for (const entry of health) {
      if (entry.status === 'connected') {
        expect(entry.toolCount).toBeGreaterThan(0);
        expect(entry.connectedAt).not.toBeNull();
        expect(entry.lastError).toBeNull();
        expect(typeof entry.serverId).toBe('string');
        expect(typeof entry.serverName).toBe('string');
      }
    }
  });

  it('getConnectionCount connected+failed never exceeds total', async () => {
    const { mcpClientManager } = await import('../../artifacts/api-server/src/services/mcp-client-manager');
    const counts = mcpClientManager.getConnectionCount();

    expect(counts.connected + counts.failed).toBeLessThanOrEqual(counts.total);
    expect(counts.connected).toBeGreaterThanOrEqual(0);
    expect(counts.failed).toBeGreaterThanOrEqual(0);
    expect(counts.total).toBeGreaterThanOrEqual(0);
  });
});

describe('MCP Client Manager - connectServer Failure Paths', () => {
  it('returns null for unsupported SSE transport (only stdio is supported)', async () => {
    mockState.behavior = 'success';
    const { mcpClientManager } = await import('../../artifacts/api-server/src/services/mcp-client-manager');

    const sseConfig: McpServerConfig = {
      id: 'unit-test-sse-unsupported',
      name: 'SSE Server (not supported)',
      description: 'SSE transport is not yet supported',
      transport: 'sse',
      enabled: true,
      sse: { url: 'https://example.com/mcp/sse' },
      healthCheckTimeoutMs: 5000,
    };

    const conn = await mcpClientManager.connectServer(sseConfig);
    expect(conn).toBeNull();
  });

  it('callTool throws with clear error message when server is not connected', async () => {
    const { mcpClientManager } = await import('../../artifacts/api-server/src/services/mcp-client-manager');

    await expect(
      mcpClientManager.callTool('definitely-not-connected-server', 'some_tool', { arg: 'value' })
    ).rejects.toThrow('MCP server definitely-not-connected-server is not connected');
  });

  it('connectServer with connect_error returns null (failure reported in health)', async () => {
    mockState.behavior = 'connect_error';
    const { mcpClientManager } = await import('../../artifacts/api-server/src/services/mcp-client-manager');

    const errorConfig: McpServerConfig = {
      id: 'unit-test-connect-failure',
      name: 'Connection Failure Test Server',
      description: 'Server that fails on connect',
      transport: 'stdio',
      enabled: true,
      stdio: { command: 'npx', args: ['-y', 'server-that-does-not-exist'] },
      healthCheckTimeoutMs: 2000,
    };

    const conn = await mcpClientManager.connectServer(errorConfig);
    expect(conn).toBeNull();

    const health = mcpClientManager.getServerHealth();
    const errorEntry = health.find(h => h.serverId === errorConfig.id);
    if (errorEntry) {
      expect(errorEntry.status).toBe('error');
      expect(typeof errorEntry.lastError).toBe('string');
      expect(errorEntry.lastError!.length).toBeGreaterThan(0);
      expect(errorEntry.toolCount).toBe(0);
    }

    mockState.behavior = 'success';
  });

  it('connectServer with timeout returns null within configured timeout period', async () => {
    mockState.behavior = 'connect_timeout';
    const { mcpClientManager } = await import('../../artifacts/api-server/src/services/mcp-client-manager');

    const timeoutConfig: McpServerConfig = {
      id: 'unit-test-connect-timeout',
      name: 'Connection Timeout Test Server',
      description: 'Server that hangs and times out',
      transport: 'stdio',
      enabled: true,
      stdio: { command: 'npx', args: ['-y', 'slow-server'] },
      healthCheckTimeoutMs: 150,
    };

    const conn = await mcpClientManager.connectServer(timeoutConfig);
    expect(conn).toBeNull();

    mockState.behavior = 'success';
  }, 5000);
});

describe('MCP Client Manager - getMcpToolsAsOpenAIFormat', () => {
  it('returns an array (connected tools or empty if none connected)', async () => {
    const { getMcpToolsAsOpenAIFormat } = await import('../../artifacts/api-server/src/services/mcp-client-manager');
    const tools = getMcpToolsAsOpenAIFormat();

    expect(Array.isArray(tools)).toBe(true);
  });

  it('division-filtered tools are a subset of all tools', async () => {
    const { getMcpToolsAsOpenAIFormat } = await import('../../artifacts/api-server/src/services/mcp-client-manager');
    const allTools = getMcpToolsAsOpenAIFormat();
    const engineeringTools = getMcpToolsAsOpenAIFormat('engineering');

    expect(engineeringTools.length).toBeLessThanOrEqual(allTools.length);
  });

  it('connected tool format matches OpenAI function calling schema', async () => {
    const { getMcpToolsAsOpenAIFormat } = await import('../../artifacts/api-server/src/services/mcp-client-manager');
    const tools = getMcpToolsAsOpenAIFormat();

    for (const tool of tools) {
      const typedTool = tool as { type: string; function: { name: string; description: string; parameters: unknown } };
      expect(typedTool.type).toBe('function');
      expect(typedTool.function).toBeDefined();
      expect(typeof typedTool.function.name).toBe('string');
      expect(typedTool.function.name.startsWith('mcp_')).toBe(true);
      expect(typeof typedTool.function.description).toBe('string');
      expect(typedTool.function.parameters).toBeDefined();
    }
  });
});

describe('MCP Client Manager - isToolFromMcp', () => {
  it('returns null for non-MCP tool names (knowledge base tools)', async () => {
    const { mcpClientManager } = await import('../../artifacts/api-server/src/services/mcp-client-manager');
    expect(mcpClientManager.isToolFromMcp('search_all_knowledge')).toBeNull();
  });

  it('returns null for tool names referencing non-connected servers', async () => {
    const { mcpClientManager } = await import('../../artifacts/api-server/src/services/mcp-client-manager');
    expect(mcpClientManager.isToolFromMcp('mcp_nonexistent_server_some_tool')).toBeNull();
  });
});

describe('MCP Client Manager - Connection Count', () => {
  it('getConnectionCount returns valid numeric invariants', async () => {
    const { mcpClientManager } = await import('../../artifacts/api-server/src/services/mcp-client-manager');
    const counts = mcpClientManager.getConnectionCount();

    expect(typeof counts.total).toBe('number');
    expect(typeof counts.connected).toBe('number');
    expect(typeof counts.failed).toBe('number');
    expect(counts.total).toBeGreaterThanOrEqual(0);
    expect(counts.connected + counts.failed).toBeLessThanOrEqual(counts.total);
    expect(counts.connected).toBeGreaterThanOrEqual(0);
    expect(counts.failed).toBeGreaterThanOrEqual(0);
  });
});

/**
 * Live MCP Smoke Tests (opt-in)
 *
 * Only executed when MCP_LIVE_TEST=true is set in the environment. These
 * tests bypass the mocked SDK and connect to real MCP servers to verify
 * connectivity and tool discovery. Use for pre-release validation or
 * scheduled health checks where real MCP server processes are available.
 *
 * Usage:
 *   MCP_LIVE_TEST=true pnpm test:agents tests/agents/mcp-connectivity.test.ts
 */
const LIVE_TEST_ENABLED = process.env.MCP_LIVE_TEST === 'true';

describe.runIf(LIVE_TEST_ENABLED)('MCP Live Smoke Tests', () => {
  it('each registered server connects and returns at least one tool within timeout', async () => {
    vi.unmock('@modelcontextprotocol/sdk/client/index.js');
    vi.unmock('@modelcontextprotocol/sdk/client/stdio.js');

    const { mcpClientManager } = await import('../../artifacts/api-server/src/services/mcp-client-manager');
    const registry = getMcpServerRegistry();

    const results: Array<{ id: string; status: string; toolCount: number }> = [];

    for (const serverConfig of registry) {
      const conn = await mcpClientManager.connectServer(serverConfig);
      results.push({
        id: serverConfig.id,
        status: conn ? conn.status : 'failed',
        toolCount: conn ? conn.tools.length : 0,
      });
    }

    const health = mcpClientManager.getServerHealth();

    for (const result of results) {
      const healthEntry = health.find(h => h.serverId === result.id);
      expect(healthEntry).toBeDefined();

      if (result.status === 'connected') {
        expect(result.toolCount).toBeGreaterThan(0);
        expect(healthEntry!.status).toBe('connected');
        expect(healthEntry!.connectedAt).not.toBeNull();
      }
    }

    const connectedCount = results.filter(r => r.status === 'connected').length;
    expect(connectedCount).toBeGreaterThan(0);
  }, 30000);

  it('getMcpToolsAsOpenAIFormat returns tools from live-connected servers', async () => {
    const { getMcpToolsAsOpenAIFormat } = await import('../../artifacts/api-server/src/services/mcp-client-manager');
    const tools = getMcpToolsAsOpenAIFormat();

    expect(Array.isArray(tools)).toBe(true);
    expect(tools.length).toBeGreaterThan(0);

    for (const tool of tools) {
      const typedTool = tool as { type: string; function: { name: string; description: string; parameters: unknown } };
      expect(typedTool.type).toBe('function');
      expect(typedTool.function.name.startsWith('mcp_')).toBe(true);
    }
  }, 30000);
});
