export type McpTransportType = 'stdio' | 'sse';

export interface McpServerConfig {
  id: string;
  name: string;
  description: string;
  transport: McpTransportType;
  enabled: boolean;
  allowedDivisions?: string[];
  stdio?: {
    command: string;
    args: string[];
    env?: Record<string, string>;
  };
  sse?: {
    url: string;
    headers?: Record<string, string>;
  };
  healthCheckTimeoutMs?: number;
}

function getGitHubToken(): string | undefined {
  try {
    const connections = JSON.parse(process.env.REPLIT_GITHUB_CONNECTIONS || '[]');
    if (connections.length > 0 && connections[0].accessToken) {
      return connections[0].accessToken;
    }
  } catch {}
  return process.env.GITHUB_TOKEN || process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
}

const mcpServerRegistry: McpServerConfig[] = [
  {
    id: 'github',
    name: 'GitHub MCP Server',
    description: 'Access GitHub repositories, issues, pull requests, and code search via the official GitHub MCP server.',
    transport: 'stdio',
    enabled: true,
    allowedDivisions: ['engineering', 'executive', 'science'],
    stdio: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      env: {
        ...(getGitHubToken() ? { GITHUB_PERSONAL_ACCESS_TOKEN: getGitHubToken()! } : {}),
      },
    },
    healthCheckTimeoutMs: 15000,
  },
  {
    id: 'fetch',
    name: 'Web Fetch MCP Server',
    description: 'Fetch and extract content from web URLs. Useful for retrieving documentation, web pages, and API responses.',
    transport: 'stdio',
    enabled: true,
    allowedDivisions: ['engineering', 'science', 'executive'],
    stdio: {
      command: 'npx',
      args: ['-y', '@anthropic-ai/mcp-server-fetch'],
    },
    healthCheckTimeoutMs: 15000,
  },
  {
    id: 'filesystem',
    name: 'Filesystem MCP Server',
    description: 'Search and read files from the project workspace for code analysis and knowledge retrieval.',
    transport: 'stdio',
    enabled: true,
    allowedDivisions: ['engineering', 'executive'],
    stdio: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '/home/runner/workspace'],
    },
    healthCheckTimeoutMs: 15000,
  },
];

export function getMcpServerRegistry(): McpServerConfig[] {
  return mcpServerRegistry.filter(s => s.enabled);
}

export function getMcpServerById(id: string): McpServerConfig | undefined {
  return mcpServerRegistry.find(s => s.id === id);
}

export function getMcpServersForDivision(division: string): McpServerConfig[] {
  return mcpServerRegistry.filter(s => {
    if (!s.enabled) return false;
    if (!s.allowedDivisions) return true;
    return s.allowedDivisions.includes(division.toLowerCase());
  });
}

export function registerMcpServer(config: McpServerConfig): void {
  const existing = mcpServerRegistry.findIndex(s => s.id === config.id);
  if (existing >= 0) {
    mcpServerRegistry[existing] = config;
  } else {
    mcpServerRegistry.push(config);
  }
  console.log(`[MCP Registry] Registered server: ${config.id} (${config.name})`);
}

export function deregisterMcpServer(id: string): boolean {
  const index = mcpServerRegistry.findIndex(s => s.id === id);
  if (index >= 0) {
    mcpServerRegistry.splice(index, 1);
    console.log(`[MCP Registry] Deregistered server: ${id}`);
    return true;
  }
  return false;
}
