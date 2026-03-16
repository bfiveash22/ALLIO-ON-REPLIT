import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { McpServerConfig, getMcpServerRegistry, getMcpServersForDivision } from './mcp-server-registry';

export interface McpToolDefinition {
  serverId: string;
  name: string;
  description: string;
  inputSchema: Record<string, any>;
}

export interface McpServerConnection {
  serverId: string;
  client: Client;
  transport: StdioClientTransport;
  tools: McpToolDefinition[];
  connectedAt: Date;
  lastError: string | null;
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
}

export interface McpServerHealth {
  serverId: string;
  serverName: string;
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  toolCount: number;
  connectedAt: string | null;
  lastError: string | null;
}

class McpClientManager {
  private connections: Map<string, McpServerConnection> = new Map();
  private initPromises: Map<string, Promise<McpServerConnection | null>> = new Map();

  async connectServer(config: McpServerConfig): Promise<McpServerConnection | null> {
    if (this.connections.has(config.id)) {
      const existing = this.connections.get(config.id)!;
      if (existing.status === 'connected') {
        return existing;
      }
    }

    const existingPromise = this.initPromises.get(config.id);
    if (existingPromise) {
      return existingPromise;
    }

    const connectPromise = this._doConnect(config);
    this.initPromises.set(config.id, connectPromise);

    try {
      const result = await connectPromise;
      return result;
    } finally {
      this.initPromises.delete(config.id);
    }
  }

  private async _doConnect(config: McpServerConfig): Promise<McpServerConnection | null> {
    if (config.transport !== 'stdio' || !config.stdio) {
      console.warn(`[MCP Client] Server ${config.id}: only stdio transport is currently supported`);
      return null;
    }

    const conn: McpServerConnection = {
      serverId: config.id,
      client: null as any,
      transport: null as any,
      tools: [],
      connectedAt: new Date(),
      lastError: null,
      status: 'connecting',
    };
    this.connections.set(config.id, conn);

    try {
      const safeBaseEnv: Record<string, string> = {
        PATH: process.env.PATH || '',
        HOME: process.env.HOME || '',
        NODE_ENV: process.env.NODE_ENV || 'production',
        LANG: process.env.LANG || 'en_US.UTF-8',
      };
      const env: Record<string, string> = {
        ...safeBaseEnv,
        ...(config.stdio.env || {}),
      };

      const transport = new StdioClientTransport({
        command: config.stdio.command,
        args: config.stdio.args,
        env,
      });

      const client = new Client({
        name: `allio-agent-${config.id}`,
        version: '1.0.0',
      });

      const timeoutMs = config.healthCheckTimeoutMs || 15000;
      await Promise.race([
        client.connect(transport),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Connection timeout after ${timeoutMs}ms`)), timeoutMs)
        ),
      ]);

      const toolsResult = await Promise.race([
        client.listTools(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Tool discovery timeout')), timeoutMs)
        ),
      ]);

      const tools: McpToolDefinition[] = (toolsResult.tools || []).map((t: any) => ({
        serverId: config.id,
        name: t.name,
        description: t.description || '',
        inputSchema: t.inputSchema || { type: 'object', properties: {} },
      }));

      conn.client = client;
      conn.transport = transport;
      conn.tools = tools;
      conn.status = 'connected';
      conn.connectedAt = new Date();
      conn.lastError = null;

      console.log(`[MCP Client] Connected to ${config.name} (${config.id}): ${tools.length} tools discovered`);
      tools.forEach(t => console.log(`  - ${t.name}: ${t.description.substring(0, 80)}`));

      return conn;
    } catch (error: any) {
      conn.status = 'error';
      conn.lastError = error.message;
      console.error(`[MCP Client] Failed to connect to ${config.name} (${config.id}): ${error.message}`);
      try {
        if (conn.client) await conn.client.close().catch(() => {});
        if (conn.transport) await conn.transport.close().catch(() => {});
      } catch {}
      return null;
    }
  }

  async disconnectServer(serverId: string): Promise<void> {
    const conn = this.connections.get(serverId);
    if (!conn) return;

    try {
      if (conn.client && conn.status === 'connected') {
        await conn.client.close();
      }
    } catch (error: any) {
      console.warn(`[MCP Client] Error disconnecting ${serverId}: ${error.message}`);
    }

    conn.status = 'disconnected';
    this.connections.delete(serverId);
    console.log(`[MCP Client] Disconnected from ${serverId}`);
  }

  async callTool(serverId: string, toolName: string, args: Record<string, any>): Promise<any> {
    const conn = this.connections.get(serverId);
    if (!conn || conn.status !== 'connected') {
      throw new Error(`MCP server ${serverId} is not connected`);
    }

    try {
      console.log(`[MCP Client] Calling ${serverId}/${toolName}`);
      const result = await Promise.race([
        conn.client.callTool({ name: toolName, arguments: args }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Tool call timeout (30s)')), 30000)
        ),
      ]);

      if (result.content && Array.isArray(result.content)) {
        const textParts = result.content
          .filter((c: any) => c.type === 'text')
          .map((c: any) => c.text);
        return textParts.join('\n');
      }

      return JSON.stringify(result);
    } catch (error: any) {
      conn.lastError = error.message;
      console.error(`[MCP Client] Tool call failed ${serverId}/${toolName}: ${error.message}`);
      throw error;
    }
  }

  async connectAllRegistered(): Promise<void> {
    const registry = getMcpServerRegistry();
    console.log(`[MCP Client] Connecting to ${registry.length} registered MCP servers...`);

    const results = await Promise.allSettled(
      registry.map(config => this.connectServer(config))
    );

    let connected = 0;
    let failed = 0;
    results.forEach((r, i) => {
      if (r.status === 'fulfilled' && r.value?.status === 'connected') {
        connected++;
      } else {
        failed++;
      }
    });

    console.log(`[MCP Client] Connection results: ${connected} connected, ${failed} failed`);
  }

  async disconnectAll(): Promise<void> {
    const serverIds = Array.from(this.connections.keys());
    await Promise.allSettled(serverIds.map(id => this.disconnectServer(id)));
    console.log('[MCP Client] All servers disconnected');
  }

  getToolsForDivision(division: string): McpToolDefinition[] {
    const allowedServers = getMcpServersForDivision(division);
    const allowedServerIds = new Set(allowedServers.map(s => s.id));

    const tools: McpToolDefinition[] = [];
    for (const conn of this.connections.values()) {
      if (conn.status === 'connected' && allowedServerIds.has(conn.serverId)) {
        tools.push(...conn.tools);
      }
    }
    return tools;
  }

  getAllTools(): McpToolDefinition[] {
    const tools: McpToolDefinition[] = [];
    for (const conn of this.connections.values()) {
      if (conn.status === 'connected') {
        tools.push(...conn.tools);
      }
    }
    return tools;
  }

  getServerHealth(): McpServerHealth[] {
    const registry = getMcpServerRegistry();
    return registry.map(config => {
      const conn = this.connections.get(config.id);
      return {
        serverId: config.id,
        serverName: config.name,
        status: conn?.status || 'disconnected',
        toolCount: conn?.tools.length || 0,
        connectedAt: conn?.connectedAt?.toISOString() || null,
        lastError: conn?.lastError || null,
      };
    });
  }

  isToolFromMcp(toolName: string): { serverId: string; tool: McpToolDefinition } | null {
    for (const conn of this.connections.values()) {
      if (conn.status !== 'connected') continue;
      const tool = conn.tools.find(t => `mcp_${conn.serverId}_${t.name}` === toolName);
      if (tool) {
        return { serverId: conn.serverId, tool };
      }
    }
    return null;
  }

  getConnectionCount(): { total: number; connected: number; failed: number } {
    let connected = 0;
    let failed = 0;
    for (const conn of this.connections.values()) {
      if (conn.status === 'connected') connected++;
      else failed++;
    }
    return { total: this.connections.size, connected, failed };
  }
}

export const mcpClientManager = new McpClientManager();

export function getMcpToolsAsOpenAIFormat(division?: string): any[] {
  const mcpTools = division
    ? mcpClientManager.getToolsForDivision(division)
    : mcpClientManager.getAllTools();

  return mcpTools.map(tool => ({
    type: 'function',
    function: {
      name: `mcp_${tool.serverId}_${tool.name}`,
      description: `[MCP:${tool.serverId}] ${tool.description}`,
      parameters: tool.inputSchema,
    },
  }));
}
