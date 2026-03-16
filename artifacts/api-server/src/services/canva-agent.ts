import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

let browserUseAvailable: boolean | null = null;

async function checkBrowserUseInstalled(): Promise<boolean> {
  if (browserUseAvailable !== null) return browserUseAvailable;
  try {
    await execAsync('which browser-use', { timeout: 5000 });
    browserUseAvailable = true;
  } catch {
    browserUseAvailable = false;
  }
  return browserUseAvailable;
}

export class CanvaAgentService {
  validateCredentials(): { valid: boolean; error?: string } {
    const sessionId = process.env.CANVA_SESSION_ID;
    if (!sessionId) {
      return { valid: false, error: 'CANVA_SESSION_ID environment variable is not configured. Canva automation requires a pre-authenticated browser session ID.' };
    }
    return { valid: true };
  }

  async getStatus(): Promise<{
    available: boolean;
    browserUseInstalled: boolean;
    sessionConfigured: boolean;
    sessionId?: string;
    error?: string;
  }> {
    const validation = this.validateCredentials();
    const browserInstalled = await checkBrowserUseInstalled();
    const errors: string[] = [];

    if (!browserInstalled) {
      errors.push('browser-use CLI is not installed');
    }
    if (!validation.valid && validation.error) {
      errors.push(validation.error);
    }

    const ready = browserInstalled && validation.valid;

    return {
      available: ready,
      browserUseInstalled: browserInstalled,
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

    const browserInstalled = await checkBrowserUseInstalled();
    if (!browserInstalled) {
      console.error('[CANVA-AGENT] browser-use CLI is not installed');
      return { success: false, error: 'browser-use CLI is not installed. Run: pip install browser-use' };
    }

    console.log(`[CANVA-AGENT] Starting task execution with session ID: ${sessionId.substring(0, 10)}...`);

    try {
      const fullPrompt = `Navigate to Canva. ${prompt}. Once the design is created, copy the share link. Ensure the task is marked as complete and provide the URL in the output.`;

      const escapedPrompt = fullPrompt.replace(/"/g, '\\"');
      const escapedSessionId = sessionId.replace(/"/g, '\\"');
      const bashCommand = `browser-use --json -b remote run "${escapedPrompt}" --llm gpt-4o --session-id "${escapedSessionId}"`;
      console.log(`[CANVA-AGENT] Running browser-use command...`);

      const { stdout, stderr } = await execAsync(bashCommand, {
        maxBuffer: 1024 * 1024 * 10,
        timeout: 300000,
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
        // Not valid JSON, fall through
      }

      console.log(`[CANVA-AGENT] No Canva URL extracted from output.`);
      return { success: true, outputUrl: 'Task completed, but no explicit Canva URL extracted. Check your Canva workspace.' };
    } catch (error: any) {
      console.error(`[CANVA-AGENT] Execution failed: `, error);
      if (error.killed) {
        return { success: false, error: 'browser-use execution timed out after 5 minutes' };
      }
      return { success: false, error: error.message || 'Unknown browser-use execution error' };
    }
  }
}

export const canvaAgent = new CanvaAgentService();
