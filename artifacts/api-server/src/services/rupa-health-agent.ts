import { chromium, type Browser, type BrowserContext } from 'playwright';
import { sendToTrustee } from './openclaw';
import { sendToOpenClaw } from './openclaw';

let playwrightAvailable: boolean | null = null;
let browserLaunchable: boolean | null = null;

async function sendLabOrderToTrustee(
  patientName: string,
  panels: string[],
  context?: string
): Promise<{ success: boolean; error?: string }> {
  const manualUrl = 'https://app.rupahealth.com/orders/new';
  const panelList = panels.join(', ');
  const msg = [
    `🔬 RUPA LAB ORDER REQUEST`,
    ``,
    `Patient: ${patientName}`,
    `Panels: ${panelList}`,
    ...(context ? [`Context: ${context}`] : []),
    ``,
    `Order here: ${manualUrl}`,
  ].join('\n');

  try {
    const trusteeResult = await sendToTrustee('RUPA_HEALTH_AGENT', msg, 'urgent');
    const openClawResult = await sendToOpenClaw({
      agentId: 'RUPA_HEALTH_AGENT',
      taskType: 'lab_order',
      description: `Lab order for ${patientName}: ${panelList}`,
      priority: 'urgent',
      context: { patientName, panels, manualUrl },
    });

    if (!trusteeResult && !openClawResult.success) {
      console.error('[RUPA-HEALTH-AGENT] Both notification channels failed');
      return { success: false, error: 'Failed to deliver lab order to Trustee via both channels' };
    }

    console.log('[RUPA-HEALTH-AGENT] Lab order task sent to Trustee via OpenClaw/Telegram');
    return { success: true };
  } catch (notifyErr: any) {
    console.error('[RUPA-HEALTH-AGENT] Failed to send lab order notification:', notifyErr);
    return { success: false, error: `Notification delivery failed: ${notifyErr.message || 'unknown error'}` };
  }
}

async function checkPlaywrightAvailable(): Promise<boolean> {
  if (playwrightAvailable !== null) return playwrightAvailable;
  try {
    const pw = await import('playwright');
    playwrightAvailable = !!pw.chromium;
  } catch {
    playwrightAvailable = false;
  }
  return playwrightAvailable;
}

async function checkBrowserLaunchable(): Promise<boolean> {
  if (browserLaunchable !== null) return browserLaunchable;
  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    browserLaunchable = true;
  } catch {
    browserLaunchable = false;
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
  return browserLaunchable;
}

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
    dryRun: boolean = true,
    options?: { forceAutomation?: boolean }
  ): Promise<{ success: boolean; terminal?: boolean; resultUrl?: string; message?: string; error?: string }> {
    const patientName = `${patientDetails.firstName} ${patientDetails.lastName}`;
    const manualUrl = 'https://app.rupahealth.com/orders/new';

    if (!options?.forceAutomation) {
      console.log(`[RUPA-HEALTH-AGENT] Routing lab order to Trustee (HITL primary path) for patient: ${patientName}`);
      const delivery = await sendLabOrderToTrustee(patientName, testPanels);
      if (!delivery.success) {
        return {
          success: false,
          error: delivery.error || 'Failed to deliver lab order to Trustee',
          resultUrl: manualUrl,
          message: `Lab order delivery failed. Manual action required at ${manualUrl} for patient "${patientName}": ${testPanels.join(', ')}.`,
        };
      }
      return {
        success: true,
        resultUrl: manualUrl,
        message: `Lab order request sent to Trustee via OpenClaw/Telegram for patient "${patientName}": ${testPanels.join(', ')}. Trustee will place the order manually at ${manualUrl}.`,
      };
    }

    const credentialCheck = this.validateCredentials();
    if (!credentialCheck.valid) {
      console.error(`[RUPA-HEALTH-AGENT] Credential validation failed: ${credentialCheck.error}`);
      const delivery = await sendLabOrderToTrustee(patientName, testPanels, 'Credentials not configured');
      return {
        success: delivery.success,
        error: delivery.success ? undefined : (delivery.error || credentialCheck.error),
        resultUrl: manualUrl,
        message: delivery.success
          ? `Credentials unavailable. Lab order request sent to Trustee instead.`
          : `Credentials unavailable and notification delivery also failed.`,
      };
    }

    console.log(`[RUPA-HEALTH-AGENT] forceAutomation=true — attempting browser automation for patient: ${patientName}`);

    const username = process.env.RUPA_USERNAME!;
    const password = process.env.RUPA_PASSWORD!;

    const browserReady = await checkPlaywrightAvailable();
    if (!browserReady) {
      console.warn('[RUPA-HEALTH-AGENT] Playwright not available — falling back to HITL');
      const delivery = await sendLabOrderToTrustee(patientName, testPanels, 'Playwright not available');
      return {
        success: delivery.success,
        error: delivery.success ? undefined : delivery.error,
        resultUrl: manualUrl,
        message: delivery.success
          ? `Playwright unavailable. Lab order sent to Trustee for manual placement.`
          : `Playwright unavailable and notification delivery failed.`,
      };
    }

    const canLaunch = await checkBrowserLaunchable();
    if (!canLaunch) {
      console.warn('[RUPA-HEALTH-AGENT] Browser cannot launch — falling back to HITL');
      const delivery = await sendLabOrderToTrustee(patientName, testPanels, 'Browser cannot launch');
      return {
        success: delivery.success,
        error: delivery.success ? undefined : delivery.error,
        resultUrl: manualUrl,
        message: delivery.success
          ? `Browser unavailable. Lab order sent to Trustee for manual placement.`
          : `Browser unavailable and notification delivery failed.`,
      };
    }

    let browser: Browser | null = null;
    let context: BrowserContext | null = null;

    try {
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });

      context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });

      const page = await context.newPage();
      page.setDefaultTimeout(30000);

      console.log(`[RUPA-HEALTH-AGENT] Navigating to Rupa Health login...`);
      await page.goto('https://app.rupahealth.com/sign-in', { waitUntil: 'networkidle', timeout: 60000 });

      console.log(`[RUPA-HEALTH-AGENT] Attempting login with username: ${username}`);
      const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i], input[id*="email" i]').first();
      await emailInput.waitFor({ state: 'visible', timeout: 15000 });
      await emailInput.fill(username);

      const passwordInput = page.locator('input[type="password"]').first();
      await passwordInput.waitFor({ state: 'visible', timeout: 5000 });
      await passwordInput.fill(password);

      const submitButton = page.locator('button[type="submit"], button:has-text("Log In"), button:has-text("Sign In"), button:has-text("Continue")').first();
      await submitButton.click();
      console.log(`[RUPA-HEALTH-AGENT] Login form submitted, waiting for dashboard...`);

      await page.waitForURL('**/dashboard**', { timeout: 30000 }).catch(() => {
        console.log(`[RUPA-HEALTH-AGENT] Dashboard URL pattern not detected, continuing...`);
      });
      await page.waitForTimeout(3000);

      console.log(`[RUPA-HEALTH-AGENT] Navigating to new order flow...`);
      const newOrderButton = page.locator('a:has-text("New Order"), button:has-text("New Order"), a:has-text("Order Labs"), button:has-text("Order Labs"), [data-testid="new-order"]').first();
      if (await newOrderButton.isVisible({ timeout: 10000 }).catch(() => false)) {
        await newOrderButton.click();
        await page.waitForTimeout(3000);
      }

      console.log(`[RUPA-HEALTH-AGENT] Searching for patient: ${patientDetails.firstName} ${patientDetails.lastName}`);
      const patientSearch = page.locator('input[placeholder*="patient" i], input[placeholder*="search" i], input[name*="patient" i]').first();
      if (await patientSearch.isVisible({ timeout: 10000 }).catch(() => false)) {
        await patientSearch.fill(`${patientDetails.firstName} ${patientDetails.lastName}`);
        await page.waitForTimeout(3000);

        const patientResult = page.locator(`text="${patientDetails.firstName}", [data-testid*="patient-result"]`).first();
        if (await patientResult.isVisible({ timeout: 5000 }).catch(() => false)) {
          await patientResult.click();
          console.log(`[RUPA-HEALTH-AGENT] Selected patient`);
          await page.waitForTimeout(2000);
        }
      }

      console.log(`[RUPA-HEALTH-AGENT] Adding test panels: ${testPanels.join(', ')}`);
      for (const panel of testPanels) {
        const testSearch = page.locator('input[placeholder*="test" i], input[placeholder*="search" i], input[name*="search" i]').first();
        if (await testSearch.isVisible({ timeout: 5000 }).catch(() => false)) {
          await testSearch.fill('');
          await testSearch.fill(panel);
          console.log(`[RUPA-HEALTH-AGENT] Searching for panel: ${panel}`);
          await page.waitForTimeout(3000);

          const panelResult = page.locator(`[data-testid*="test-result"], .test-result, text="${panel}"`).first();
          if (await panelResult.isVisible({ timeout: 5000 }).catch(() => false)) {
            await panelResult.click();
            console.log(`[RUPA-HEALTH-AGENT] Added panel: ${panel}`);
            await page.waitForTimeout(1000);
          } else {
            const addButton = page.locator('button:has-text("Add"), button:has-text("Select")').first();
            if (await addButton.isVisible({ timeout: 3000 }).catch(() => false)) {
              await addButton.click();
              console.log(`[RUPA-HEALTH-AGENT] Added panel via button: ${panel}`);
              await page.waitForTimeout(1000);
            }
          }
        }
      }

      if (dryRun) {
        console.log(`[RUPA-HEALTH-AGENT] Dry run mode - looking for save draft option...`);
        const saveDraftButton = page.locator('button:has-text("Save Draft"), button:has-text("Save"), a:has-text("Save Draft")').first();
        if (await saveDraftButton.isVisible({ timeout: 5000 }).catch(() => false)) {
          await saveDraftButton.click();
          console.log(`[RUPA-HEALTH-AGENT] Saved as draft`);
          await page.waitForTimeout(3000);
        } else {
          console.log(`[RUPA-HEALTH-AGENT] No draft button found, stopping at current state`);
        }
      } else {
        console.log(`[RUPA-HEALTH-AGENT] Submitting order...`);
        const submitOrder = page.locator('button:has-text("Submit Order"), button:has-text("Place Order"), button:has-text("Confirm")').first();
        if (await submitOrder.isVisible({ timeout: 10000 }).catch(() => false)) {
          await submitOrder.click();
          console.log(`[RUPA-HEALTH-AGENT] Order submitted`);
          await page.waitForTimeout(5000);
        }
      }

      const currentUrl = page.url();
      const urlRegex = /(https:\/\/(?:app\.)?rupahealth\.com\/[^\s"']+)/;
      const match = currentUrl.match(urlRegex);

      if (match && match[0]) {
        console.log(`[RUPA-HEALTH-AGENT] Successfully extracted Rupa Health URL: ${match[match.length - 1]}`);
        return { success: true, resultUrl: match[match.length - 1], message: 'Task completed successfully.' };
      }

      const orderLinks = await page.evaluate(() => {
        const anchors = document.querySelectorAll('a[href*="rupahealth.com/order"], a[href*="rupahealth.com/draft"]');
        return Array.from(anchors).map(a => (a as HTMLAnchorElement).href);
      });

      if (orderLinks.length > 0) {
        console.log(`[RUPA-HEALTH-AGENT] Found order link: ${orderLinks[0]}`);
        return { success: true, resultUrl: orderLinks[0], message: 'Task completed successfully.' };
      }

      console.log(`[RUPA-HEALTH-AGENT] Order flow completed. Current URL: ${currentUrl}`);
      return { success: true, message: "Task completed. Check Rupa Health dashboard for the draft order." };
    } catch (error: any) {
      const errMsg = error.message || 'Unknown Playwright execution error';
      console.warn(`[RUPA-HEALTH-AGENT] Browser automation failed, falling back to HITL: ${errMsg}`);

      const delivery = await sendLabOrderToTrustee(patientName, testPanels, `Automation failed: ${errMsg}`);

      return {
        success: delivery.success,
        error: delivery.success ? undefined : delivery.error,
        resultUrl: manualUrl,
        message: delivery.success
          ? `Browser automation failed. Lab order sent to Trustee for manual placement at ${manualUrl}.`
          : `Browser automation failed and notification delivery also failed.`,
      };
    } finally {
      if (context) await context.close().catch(() => {});
      if (browser) await browser.close().catch(() => {});
    }
  }
}

export const rupaHealthAgent = new RupaHealthAgentService();
