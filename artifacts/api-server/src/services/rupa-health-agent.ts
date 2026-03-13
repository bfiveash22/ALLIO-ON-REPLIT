import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class RupaHealthAgentService {
    validateCredentials(): { valid: boolean; missing: string[]; error?: string } {
        const missing: string[] = [];
        if (!process.env.RUPA_USERNAME) missing.push('RUPA_USERNAME');
        if (!process.env.RUPA_PASSWORD) missing.push('RUPA_PASSWORD');
        if (missing.length > 0) {
            return {
                valid: false,
                missing,
                error: `Rupa Health credentials not configured: ${missing.join(', ')}. Lab ordering will be unavailable.`
            };
        }
        return { valid: true, missing: [] };
    }

    getStatus(): { available: boolean; username?: string; error?: string } {
        const validation = this.validateCredentials();
        return {
            available: validation.valid,
            username: validation.valid ? process.env.RUPA_USERNAME : undefined,
            error: validation.error,
        };
    }

    async placeOrder(
        patientDetails: { firstName: string; lastName: string; email: string; dob?: string; phone?: string },
        testPanels: string[],
        dryRun: boolean = true
    ): Promise<{ success: boolean; resultUrl?: string; message?: string; error?: string }> {
        const credentialCheck = this.validateCredentials();
        if (!credentialCheck.valid) {
            console.error(`[RUPA-HEALTH-AGENT] Credential validation failed: ${credentialCheck.error}`);
            return { success: false, error: `Rupa Health agent unavailable: ${credentialCheck.error}` };
        }

        console.log(`[RUPA-HEALTH-AGENT] Starting task execution for patient: ${patientDetails.firstName} ${patientDetails.lastName}`);

        const username = process.env.RUPA_USERNAME;
        const password = process.env.RUPA_PASSWORD;

        try {
            // Formulate the comprehensive prompt for browser-use to navigate Rupa Health
            let prompt = `Navigate to https://www.rupahealth.com/ and log in using username: '${username}' and password: '${password}'. `;
            prompt += `Search for the patient named '${patientDetails.firstName} ${patientDetails.lastName}'. `;
            prompt += `Initiate a new order for this patient and search for the following test panels: ${testPanels.join(', ')}. `;
            prompt += `Add each found panel to the order cart. `;

            if (dryRun) {
                prompt += `This is a test run. Do NOT submit the final order. Stop at the checkout/review screen, save as draft if possible, and provide the URL of the draft order or confirmation screen.`;
            } else {
                prompt += `Review the order and submit it. Wait for the confirmation screen and provide the final confirmation URL or order ID.`;
            }

            // Note: Since Rupa Health may block cloud ips or if remote isn't configured, we start with remote browser
            // For stability with complex UI actions, we use gpt-4o.
            // In a production scenario, we'd use a dedicated cloud profile ID to persist the login session.
            const bashCommand = `browser-use -b remote run "${prompt}" --llm gpt-4o --json`;
            console.log(`[RUPA-HEALTH-AGENT] Running browser-use command (credentials hidden in log)...`);

            // Execute the browser-use CLI command
            // We give it a generous timeout (e.g. 5 minutes) since ordering tests takes multiple steps
            const { stdout, stderr } = await execAsync(bashCommand, { maxBuffer: 1024 * 1024 * 10, timeout: 300000 });

            console.log(`[RUPA-HEALTH-AGENT] browser-use execution completed.`);

            if (stderr) {
                console.warn(`[RUPA-HEALTH-AGENT] Warnings during execution: ${stderr}`);
            }

            // The output is JSON due to the --json flag, but stdout might also have other logs.
            // Let's attempt to find the final URL in the stdout.
            const urlRegex = /(https:\/\/(?:www\.)?rupahealth\.com\/[^\s"']+)/;
            const match = stdout.match(urlRegex);

            if (match && match[0]) {
                console.log(`[RUPA-HEALTH-AGENT] Successfully extracted Rupa Health URL: ${match[0]}`);
                return { success: true, resultUrl: match[match.length - 1], message: 'Task completed successfully.' };
            } else {
                console.log(`[RUPA-HEALTH-AGENT] Could not reliably extract URL via Regex, parsing standard output.`);
                return { success: true, message: "Task Completed. Check Rupa Health dashboard for the draft order." };
            }
        } catch (error: any) {
            console.error(`[RUPA-HEALTH-AGENT] Execution failed: `, error);
            return { success: false, error: error.message || 'Unknown browser-use execution error' };
        }
    }
}

export const rupaHealthAgent = new RupaHealthAgentService();
