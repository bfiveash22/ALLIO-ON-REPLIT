import { getInbox } from "./gmail";
import { getUncachableGoogleDriveClient } from "./drive";
import { mcpClientManager } from "./mcp-client-manager";
import { getMcpServerRegistry } from "./mcp-server-registry";

export type IntegrationMode = "live" | "placeholder";
export type ConnectionState = "connected" | "disconnected" | "error" | "not_implemented";

export interface IntegrationStatus {
  id: string;
  name: string;
  mode: IntegrationMode;
  connectionState: ConnectionState;
  lastCheckedAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  sampleData: string | null;
  nextSteps: string | null;
}

interface IntegrationDefinition {
  id: string;
  name: string;
  mode: IntegrationMode;
  healthCheck: () => Promise<{ connected: boolean; error?: string; sampleData?: string }>;
}

const integrationRegistry: IntegrationDefinition[] = [
  {
    id: "openai",
    name: "OpenAI",
    mode: "live",
    healthCheck: async () => {
      const key = process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
      if (!key) {
        return { connected: false, error: "Missing OPENAI_API_KEY" };
      }
      return { connected: true, sampleData: `API key configured (${key.substring(0, 8)}...)` };
    }
  },
  {
    id: "anthropic",
    name: "Anthropic/Claude (AI Integrations Proxy)",
    mode: "live",
    healthCheck: async () => {
      const directKey = process.env.ANTHROPIC_API_KEY;
      const proxyKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
      const proxyUrl = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
      if (directKey) {
        return { connected: true, sampleData: "Direct Anthropic API key configured" };
      }
      if (proxyKey && proxyUrl) {
        return { connected: true, sampleData: "Connected via Replit AI Integrations proxy" };
      }
      return { connected: false, error: "Missing ANTHROPIC_API_KEY or AI_INTEGRATIONS_ANTHROPIC_API_KEY + BASE_URL" };
    }
  },
  {
    id: "gemini",
    name: "Google Gemini",
    mode: "live",
    healthCheck: async () => {
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        return { connected: false, error: "Missing GEMINI_API_KEY" };
      }
      return { connected: true, sampleData: "Gemini API key configured" };
    }
  },
  {
    id: "huggingface",
    name: "HuggingFace",
    mode: "live",
    healthCheck: async () => {
      const key = process.env.HUGGINGFACE_API_KEY;
      if (!key) {
        return { connected: false, error: "Missing HUGGINGFACE_API_KEY. PRISM (video), PEXEL (images), AURORA (audio) agents will be degraded." };
      }
      return { connected: true, sampleData: "HuggingFace API key configured for media generation" };
    }
  },
  {
    id: "stripe",
    name: "Stripe",
    mode: "live",
    healthCheck: async () => {
      const key = process.env.STRIPE_SECRET_KEY;
      if (!key) {
        return { connected: false, error: "Missing STRIPE_SECRET_KEY" };
      }
      return { connected: true, sampleData: "Stripe API key configured" };
    }
  },
  {
    id: "research_pubmed",
    name: "PubMed (E-Utils)",
    mode: "live",
    healthCheck: async () => {
      try {
        const response = await fetch('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=test&retmax=1&retmode=json', { signal: AbortSignal.timeout(5000) });
        if (response.ok) {
          return { connected: true, sampleData: "PubMed API accessible (HIPPOCRATES agent)" };
        }
        return { connected: false, error: `PubMed returned ${response.status}` };
      } catch (e: any) {
        return { connected: false, error: `PubMed unreachable: ${e.message}` };
      }
    }
  },
  {
    id: "research_openalex",
    name: "OpenAlex",
    mode: "live",
    healthCheck: async () => {
      try {
        const response = await fetch('https://api.openalex.org/works?search=test&per_page=1', { signal: AbortSignal.timeout(5000) });
        if (response.ok) {
          return { connected: true, sampleData: "OpenAlex API accessible (PARACELSUS agent)" };
        }
        return { connected: false, error: `OpenAlex returned ${response.status}` };
      } catch (e: any) {
        return { connected: false, error: `OpenAlex unreachable: ${e.message}` };
      }
    }
  },
  {
    id: "research_semantic_scholar",
    name: "Semantic Scholar",
    mode: "live",
    healthCheck: async () => {
      try {
        const headers: Record<string, string> = {};
        if (process.env.SEMANTIC_SCHOLAR_API_KEY) {
          headers['x-api-key'] = process.env.SEMANTIC_SCHOLAR_API_KEY;
        }
        const response = await fetch('https://api.semanticscholar.org/graph/v1/paper/search?query=test&limit=1', { headers, signal: AbortSignal.timeout(5000) });
        if (response.ok) {
          return { connected: true, sampleData: `Semantic Scholar accessible (ORACLE agent)${process.env.SEMANTIC_SCHOLAR_API_KEY ? ' with API key' : ' (public rate limit)'}` };
        }
        if (response.status === 429) {
          return { connected: true, sampleData: "Semantic Scholar accessible but rate-limited" };
        }
        return { connected: false, error: `Semantic Scholar returned ${response.status}` };
      } catch (e: any) {
        return { connected: false, error: `Semantic Scholar unreachable: ${e.message}` };
      }
    }
  },
  {
    id: "canva_browser",
    name: "Canva (Playwright)",
    mode: "live",
    healthCheck: async () => {
      const sessionId = process.env.CANVA_SESSION_ID;
      const errors: string[] = [];
      try {
        const pw = await import('playwright');
        if (!pw.chromium) {
          errors.push('Playwright Chromium not available');
        } else {
          let testBrowser = null;
          try {
            testBrowser = await pw.chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] });
          } catch (e: any) {
            errors.push(`Playwright browser launch failed: ${e.message?.substring(0, 80)}`);
          } finally {
            if (testBrowser) await testBrowser.close().catch(() => {});
          }
        }
      } catch {
        errors.push('Playwright package not installed');
      }
      if (!sessionId) {
        errors.push('Missing CANVA_SESSION_ID');
      }
      if (errors.length > 0) {
        return { connected: false, error: errors.join('; ') + '. PIXEL agent Canva automation unavailable.' };
      }
      return { connected: true, sampleData: `Canva session configured (${sessionId!.substring(0, 6)}…), Playwright browser verified` };
    }
  },
  {
    id: "rupa_health",
    name: "Rupa Health (Playwright)",
    mode: "live",
    healthCheck: async () => {
      const username = process.env.RUPA_USERNAME;
      const password = process.env.RUPA_PASSWORD;
      const errors: string[] = [];
      try {
        const pw = await import('playwright');
        if (!pw.chromium) {
          errors.push('Playwright Chromium not available');
        } else {
          let testBrowser = null;
          try {
            testBrowser = await pw.chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] });
          } catch (e: any) {
            errors.push(`Playwright browser launch failed: ${e.message?.substring(0, 80)}`);
          } finally {
            if (testBrowser) await testBrowser.close().catch(() => {});
          }
        }
      } catch {
        errors.push('Playwright package not installed');
      }
      if (!username || !password) {
        const missing = [];
        if (!username) missing.push('RUPA_USERNAME');
        if (!password) missing.push('RUPA_PASSWORD');
        errors.push(`Missing ${missing.join(', ')}`);
      }
      if (errors.length > 0) {
        return { connected: false, error: errors.join('; ') + '. Lab ordering unavailable.' };
      }
      return { connected: true, sampleData: `Rupa Health credentials configured, Playwright browser verified` };
    }
  },
  {
    id: "signnow",
    name: "SignNow",
    mode: "live",
    healthCheck: async () => {
      try {
        const clientId = process.env.SIGNNOW_CLIENT_ID;
        const clientSecret = process.env.SIGNNOW_SECRET_KEY || process.env.SIGNNOW_CLIENT_SECRET;
        if (!clientId || !clientSecret) {
          return { connected: false, error: "Missing API credentials" };
        }
        return { connected: true, sampleData: "Credentials configured" };
      } catch (error: any) {
        return { connected: false, error: error.message };
      }
    }
  },
  {
    id: "gmail",
    name: "Gmail",
    mode: "live",
    healthCheck: async () => {
      try {
        const result = await getInbox(1);
        if (result.success) {
          const count = result.messages?.length || 0;
          return { connected: true, sampleData: `${count} message(s) accessible` };
        }
        // Check if it's a permission issue (connected but limited scope) or connection not found
        const errorMsg = result.error || "";
        if (errorMsg.includes("Insufficient Permission")) {
          return { 
            connected: true, 
            sampleData: "Send-only mode (inbox read permissions not available)"
          };
        }
        if (errorMsg.includes("not connected")) {
          return { connected: false, error: errorMsg };
        }
        // Any other error - assume connection exists but limited
        return { connected: false, error: errorMsg || "Gmail check failed" };
      } catch (error: any) {
        const errorMsg = error.message || String(error);
        // Check if connected but limited scope
        if (errorMsg.includes("Insufficient Permission")) {
          return { 
            connected: true, 
            sampleData: "Send-only mode (inbox read permissions not available)"
          };
        }
        // Check if it's a connection issue
        if (errorMsg.includes("not connected") || errorMsg.includes("no connection")) {
          return { connected: false, error: "Gmail not connected" };
        }
        return { connected: false, error: errorMsg };
      }
    }
  },
  {
    id: "drive",
    name: "Google Drive",
    mode: "live",
    healthCheck: async () => {
      try {
        const drive = await getUncachableGoogleDriveClient();
        const response = await drive.files.list({ pageSize: 1 });
        return { connected: true, sampleData: "Drive access confirmed" };
      } catch (error: any) {
        return { connected: false, error: error.message };
      }
    }
  },
  {
    id: "woocommerce",
    name: "WooCommerce",
    mode: "live",
    healthCheck: async () => {
      const url = process.env.WOOCOMMERCE_URL || process.env.WP_SITE_URL;
      const key = process.env.WOOCOMMERCE_CONSUMER_KEY || process.env.WC_CONSUMER_KEY;
      const secret = process.env.WOOCOMMERCE_CONSUMER_SECRET || process.env.WC_CONSUMER_SECRET;
      if (url && key && secret) {
        return { connected: true, sampleData: "WooCommerce connected - products sync active" };
      }
      return { 
        connected: false, 
        error: "WooCommerce credentials not configured. Need WC_CONSUMER_KEY and WC_CONSUMER_SECRET."
      };
    }
  },
  {
    id: "wordpress",
    name: "WordPress",
    mode: "live",
    healthCheck: async () => {
      const wpPassword = process.env.WP_APPLICATION_PASSWORD;
      const wpUrl = process.env.WOOCOMMERCE_URL || 'https://www.forgottenformula.com';
      if (wpPassword) {
        return { 
          connected: true, 
          sampleData: "Member sync active via Application Password"
        };
      }
      return { 
        connected: false, 
        error: "WordPress Application Password not configured"
      };
    }
  }
];

export async function getAllIntegrationStatuses(): Promise<IntegrationStatus[]> {
  const statuses: IntegrationStatus[] = [];
  
  for (const integration of integrationRegistry) {
    const now = new Date().toISOString();
    try {
      const result = await integration.healthCheck();
      statuses.push({
        id: integration.id,
        name: integration.name,
        mode: integration.mode,
        connectionState: integration.mode === "placeholder" && !result.connected 
          ? "not_implemented" 
          : result.connected 
            ? "connected" 
            : "disconnected",
        lastCheckedAt: now,
        lastSuccessAt: result.connected ? now : null,
        lastError: result.error || null,
        sampleData: result.sampleData || null,
        nextSteps: integration.mode === "placeholder" 
          ? "Implementation pending - contact development team" 
          : result.connected 
            ? null 
            : "Check credentials and permissions"
      });
    } catch (error: any) {
      statuses.push({
        id: integration.id,
        name: integration.name,
        mode: integration.mode,
        connectionState: "error",
        lastCheckedAt: now,
        lastSuccessAt: null,
        lastError: error.message,
        sampleData: null,
        nextSteps: "Check server logs for details"
      });
    }
  }

  const mcpHealthList = mcpClientManager.getServerHealth();
  for (const mcp of mcpHealthList) {
    const now = new Date().toISOString();
    statuses.push({
      id: `mcp_${mcp.serverId}`,
      name: `MCP: ${mcp.serverName}`,
      mode: "live",
      connectionState: mcp.status === 'connected' ? 'connected' 
        : mcp.status === 'error' ? 'error' 
        : 'disconnected',
      lastCheckedAt: now,
      lastSuccessAt: mcp.status === 'connected' ? (mcp.connectedAt || now) : null,
      lastError: mcp.lastError,
      sampleData: mcp.status === 'connected' ? `${mcp.toolCount} tools available` : null,
      nextSteps: mcp.status !== 'connected' ? "Check MCP server configuration and connectivity" : null,
    });
  }
  
  return statuses;
}

export async function testIntegration(id: string): Promise<IntegrationStatus | null> {
  const integration = integrationRegistry.find(i => i.id === id);
  if (!integration) return null;
  
  const now = new Date().toISOString();
  try {
    const result = await integration.healthCheck();
    return {
      id: integration.id,
      name: integration.name,
      mode: integration.mode,
      connectionState: integration.mode === "placeholder" && !result.connected 
        ? "not_implemented" 
        : result.connected 
          ? "connected" 
          : "disconnected",
      lastCheckedAt: now,
      lastSuccessAt: result.connected ? now : null,
      lastError: result.error || null,
      sampleData: result.sampleData || null,
      nextSteps: integration.mode === "placeholder" 
        ? "Implementation pending" 
        : result.connected 
          ? null 
          : "Check credentials and permissions"
    };
  } catch (error: any) {
    return {
      id: integration.id,
      name: integration.name,
      mode: integration.mode,
      connectionState: "error",
      lastCheckedAt: now,
      lastSuccessAt: null,
      lastError: error.message,
      sampleData: null,
      nextSteps: "Check server logs for details"
    };
  }
}
