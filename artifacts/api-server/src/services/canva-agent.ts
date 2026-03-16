import { exec, execFile } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

let browserUseAvailable: boolean | null = null;
let browserUsePath: string | null = null;
let libgbmPath: string | null = null;

async function resolveLibgbm(): Promise<string | null> {
  if (libgbmPath !== null) return libgbmPath;
  try {
    const { stdout } = await execAsync("nix-build '<nixpkgs>' -A libgbm --no-out-link 2>/dev/null", { timeout: 30000 });
    libgbmPath = stdout.trim() + '/lib';
  } catch {
    libgbmPath = '';
  }
  return libgbmPath || null;
}

function getBrowserEnv(): Record<string, string> {
  const env: Record<string, string> = { ...process.env as Record<string, string> };
  if (libgbmPath) {
    env.LD_LIBRARY_PATH = libgbmPath + (env.LD_LIBRARY_PATH ? ':' + env.LD_LIBRARY_PATH : '');
  }
  const playwrightPath = '/home/runner/workspace/.cache/ms-playwright';
  if (!env.PLAYWRIGHT_BROWSERS_PATH || env.PLAYWRIGHT_BROWSERS_PATH === '0') {
    env.PLAYWRIGHT_BROWSERS_PATH = playwrightPath;
  }
  return env;
}

async function checkBrowserUseInstalled(): Promise<boolean> {
  if (browserUseAvailable !== null) return browserUseAvailable;
  try {
    const { stdout } = await execAsync('which browser-use', { timeout: 5000 });
    browserUsePath = stdout.trim();
    browserUseAvailable = true;
    await resolveLibgbm();
  } catch {
    browserUseAvailable = false;
  }
  return browserUseAvailable;
}

function getBrowserUsePath(): string {
  return browserUsePath || 'browser-use';
}

export class CanvaAgentService {
  validateCredentials(): { valid: boolean; error?: string } {
    const sessionId = process.env.CANVA_SESSION_ID;
    if (!sessionId) {
      return { valid: false, error: 'CANVA_SESSION_ID environment variable is not configured. Canva automation requires a pre-authenticated browser session ID.' };
    }
    return { valid: true };
  }

  checkBrowserUseApiKey(): { configured: boolean; error?: string } {
    const apiKey = process.env.BROWSER_USE_API_KEY;
    if (!apiKey) {
      return { configured: false, error: 'BROWSER_USE_API_KEY is not configured. Required for remote browser-use execution. Get one at https://browser-use.com/new-api-key' };
    }
    return { configured: true };
  }

  async getStatus(): Promise<{
    available: boolean;
    browserUseInstalled: boolean;
    browserUseApiKeyConfigured: boolean;
    sessionConfigured: boolean;
    sessionId?: string;
    error?: string;
  }> {
    const validation = this.validateCredentials();
    const browserInstalled = await checkBrowserUseInstalled();
    const apiKeyCheck = this.checkBrowserUseApiKey();
    const errors: string[] = [];

    if (!browserInstalled) {
      errors.push('browser-use CLI is not installed');
    }
    if (!apiKeyCheck.configured && apiKeyCheck.error) {
      errors.push(apiKeyCheck.error);
    }
    if (!validation.valid && validation.error) {
      errors.push(validation.error);
    }

    const ready = browserInstalled && validation.valid && apiKeyCheck.configured;

    return {
      available: ready,
      browserUseInstalled: browserInstalled,
      browserUseApiKeyConfigured: apiKeyCheck.configured,
      sessionConfigured: validation.valid,
      sessionId: validation.valid ? process.env.CANVA_SESSION_ID?.substring(0, 10) + '...' : undefined,
      error: errors.length > 0 ? errors.join('; ') : undefined,
    };
  }

  async executeCanvaTask(
    prompt: string,
    sessionId: string = process.env.CANVA_SESSION_ID || 'canva-default-session'
  ): Promise<{ success: boolean; outputUrl?: string; error?: string }> {
    const credentialCheck = this.validateCredentials();
    if (!credentialCheck.valid) {
      console.error(`[CANVA-AGENT] Credential validation failed: ${credentialCheck.error}`);
      return { success: false, error: `Canva agent unavailable: ${credentialCheck.error}` };
    }

    const apiKeyCheck = this.checkBrowserUseApiKey();
    if (!apiKeyCheck.configured) {
      console.error(`[CANVA-AGENT] ${apiKeyCheck.error}`);
      return { success: false, error: `Canva agent unavailable: ${apiKeyCheck.error}` };
    }

    const browserInstalled = await checkBrowserUseInstalled();
    if (!browserInstalled) {
      console.error('[CANVA-AGENT] browser-use CLI is not installed');
      return { success: false, error: 'browser-use CLI is not installed. Run: pip install browser-use' };
    }

    console.log(`[CANVA-AGENT] Starting task execution with session ID: ${sessionId.substring(0, 10)}...`);

    try {
      const fullPrompt = `Navigate to Canva. ${prompt}. Once the design is created, copy the share link. Ensure the task is marked as complete and provide the URL in the output.`;

      const args = [
        '--json',
        '-b', 'remote',
        'run', fullPrompt,
        '--llm', 'gpt-4o',
        '--session-id', sessionId,
      ];

      console.log(`[CANVA-AGENT] Running browser-use command...`);

      const { stdout, stderr } = await execFileAsync(getBrowserUsePath(), args, {
        maxBuffer: 1024 * 1024 * 10,
        timeout: 300000,
        env: getBrowserEnv(),
      });

      console.log(`[CANVA-AGENT] browser-use execution completed.`);

      if (stderr) {
        console.warn(`[CANVA-AGENT] Warnings during execution: ${stderr}`);
      }

      const urlRegex = /(https:\/\/(?:www\.)?canva\.com\/[^\s"']+)/;
      const match = stdout.match(urlRegex);

      if (match && match[0]) {
        console.log(`[CANVA-AGENT] Successfully extracted Canva URL: ${match[0]}`);
        return { success: true, outputUrl: match[0] };
      }

      try {
        const jsonOutput = JSON.parse(stdout);
        if (jsonOutput?.output || jsonOutput?.result) {
          const textResult = jsonOutput.output || jsonOutput.result;
          const textMatch = String(textResult).match(urlRegex);
          if (textMatch && textMatch[0]) {
            return { success: true, outputUrl: textMatch[0] };
          }
        }
      } catch {
      }

      console.log(`[CANVA-AGENT] No Canva URL extracted from output.`);
      return { success: true, outputUrl: 'Task completed, but no explicit Canva URL extracted. Check your Canva workspace.' };
    } catch (error: any) {
      console.error(`[CANVA-AGENT] Execution failed: `, error);
      if (error.killed) {
        return { success: false, error: 'browser-use execution timed out after 5 minutes' };
      }
      const stderrMsg = error.stderr || '';
      if (stderrMsg.includes('API Key Required')) {
        return { success: false, error: 'BROWSER_USE_API_KEY is missing or invalid. Remote browser requires an API key from https://browser-use.com/new-api-key' };
      }
      return { success: false, error: error.message || 'Unknown browser-use execution error' };
    }
  }
}

export const canvaAgent = new CanvaAgentService();
