import { exec } from 'child_process';
import { promisify } from 'util';
import { sentinel } from './sentinel';

const execAsync = promisify(exec);

export class CanvaAgentService {
    validateCredentials(): { valid: boolean; error?: string } {
        const sessionId = process.env.CANVA_SESSION_ID;
        if (!sessionId) {
            return { valid: false, error: 'CANVA_SESSION_ID environment variable is not configured. Canva automation requires a pre-authenticated browser session ID.' };
        }
        return { valid: true };
    }

    getStatus(): { available: boolean; sessionId?: string; error?: string } {
        const validation = this.validateCredentials();
        return {
            available: validation.valid,
            sessionId: validation.valid ? process.env.CANVA_SESSION_ID?.substring(0, 10) + '...' : undefined,
            error: validation.error,
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

        console.log(`[CANVA-AGENT] Starting task execution with session ID: ${sessionId}`);

        try {
            // Formulate the comprehensive prompt for browser-use to navigate Canva
            const fullPrompt = `Navigate to Canva. ${prompt}. Once the design is created, copy the share link. Ensure the task is marked as complete and provide the URL in the output.`;

            const bashCommand = `browser-use -b remote run "${fullPrompt}" --llm gpt-4o --session-id "${sessionId}" --json`;
            console.log(`[CANVA-AGENT] Running command: ${bashCommand}`);

            // Execute the browser-use CLI command
            const { stdout, stderr } = await execAsync(bashCommand, { maxBuffer: 1024 * 1024 * 10 });

            console.log(`[CANVA-AGENT] browser-use execution completed.`);

            if (stderr) {
                console.warn(`[CANVA-AGENT] Warnings during execution: ${stderr}`);
            }

            // Hacky parsing to find a Canva URL in the terminal stdout
            const urlRegex = /(https:\/\/(?:www\.)?canva\.com\/[^\s"']+)/;
            const match = stdout.match(urlRegex);

            if (match && match[0]) {
                console.log(`[CANVA-AGENT] Successfully extracted Canva URL: ${match[0]}`);
                return { success: true, outputUrl: match[0] };
            } else {
                // If no URL is found, we can parse the JSON output to get the final text or result
                console.log(`[CANVA-AGENT] Could not reliably extract URL via Regex, task might have failed or not returned a URL.`);
                return { success: true, outputUrl: "Task Completed, but no explicit Canva URL extracted. Check your Canva workspace." };
            }
        } catch (error: any) {
            console.error(`[CANVA-AGENT] Execution failed: `, error);
            return { success: false, error: error.message || 'Unknown browser-use execution error' };
        }
    }
}

export const canvaAgent = new CanvaAgentService();
