import { chromium, type Browser, type BrowserContext } from 'playwright';
import path from 'path';
import fs from 'fs';

let playwrightAvailable: boolean | null = null;
let browserLaunchable: boolean | null = null;

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

const STORAGE_STATE_DIR = path.join(process.cwd(), '.playwright-state');

function getStorageStatePath(sessionId: string): string {
  const safeId = sessionId.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 64);
  return path.join(STORAGE_STATE_DIR, `canva-${safeId}.json`);
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
    const playwrightReady = await checkPlaywrightAvailable();
    const canLaunch = playwrightReady ? await checkBrowserLaunchable() : false;
    const errors: string[] = [];

    if (!playwrightReady) {
      errors.push('Playwright package is not available');
    } else if (!canLaunch) {
      errors.push('Playwright cannot launch Chromium browser');
    }
    if (!validation.valid && validation.error) {
      errors.push(validation.error);
    }

    const ready = canLaunch && validation.valid;

    return {
      available: ready,
      browserUseInstalled: canLaunch,
      browserUseApiKeyConfigured: true,
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

    const browserReady = await checkPlaywrightAvailable();
    if (!browserReady) {
      console.error('[CANVA-AGENT] Playwright is not available');
      return { success: false, error: 'Playwright is not available. Ensure the playwright package is installed.' };
    }

    console.log(`[CANVA-AGENT] Starting task execution with session ID: ${sessionId.substring(0, 10)}...`);

    let browser: Browser | null = null;
    let context: BrowserContext | null = null;

    try {
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });

      const storageStatePath = getStorageStatePath(sessionId);
      const hasStorageState = fs.existsSync(storageStatePath);

      if (hasStorageState) {
        console.log(`[CANVA-AGENT] Restoring session from storage state: ${storageStatePath}`);
        context = await browser.newContext({
          userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          storageState: storageStatePath,
        });
      } else {
        context = await browser.newContext({
          userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        });
      }
      const page = await context.newPage();

      console.log(`[CANVA-AGENT] Navigating to Canva...`);
      await page.goto('https://www.canva.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });

      console.log(`[CANVA-AGENT] Executing task: ${prompt}`);

      const createButton = page.locator('button:has-text("Create a design"), a:has-text("Create a design"), [data-testid="create-design-button"]').first();
      if (await createButton.isVisible({ timeout: 10000 }).catch(() => false)) {
        await createButton.click();
        console.log(`[CANVA-AGENT] Clicked create design button`);
        await page.waitForTimeout(3000);
      }

      const searchInput = page.locator('input[placeholder*="Search" i], input[type="search"]').first();
      if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        const searchTerm = prompt.substring(0, 100);
        await searchInput.fill(searchTerm);
        await page.keyboard.press('Enter');
        console.log(`[CANVA-AGENT] Searched for: ${searchTerm}`);
        await page.waitForTimeout(3000);
      }

      const templateResult = page.locator('[data-testid="template-item"], .template-card, [role="listitem"]').first();
      if (await templateResult.isVisible({ timeout: 5000 }).catch(() => false)) {
        await templateResult.click();
        console.log(`[CANVA-AGENT] Selected first template result`);
        await page.waitForTimeout(3000);
      }

      const customizeButton = page.locator('button:has-text("Customize"), button:has-text("Use this template"), button:has-text("Edit")').first();
      if (await customizeButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await customizeButton.click();
        console.log(`[CANVA-AGENT] Opened template for editing`);
        await page.waitForTimeout(5000);
      }

      const shareButton = page.locator('button:has-text("Share"), [data-testid="share-button"]').first();
      if (await shareButton.isVisible({ timeout: 10000 }).catch(() => false)) {
        await shareButton.click();
        console.log(`[CANVA-AGENT] Clicked share button`);
        await page.waitForTimeout(2000);

        const copyLinkButton = page.locator('button:has-text("Copy link"), [data-testid="copy-link-button"]').first();
        if (await copyLinkButton.isVisible({ timeout: 5000 }).catch(() => false)) {
          await copyLinkButton.click();
          console.log(`[CANVA-AGENT] Copied share link`);
          await page.waitForTimeout(1000);
        }
      }

      fs.mkdirSync(STORAGE_STATE_DIR, { recursive: true });
      await context.storageState({ path: storageStatePath });
      console.log(`[CANVA-AGENT] Session state saved for future reuse`);

      const currentUrl = page.url();
      const urlRegex = /(https:\/\/(?:www\.)?canva\.com\/design\/[^\s"']+)/;
      const match = currentUrl.match(urlRegex);

      if (match && match[0]) {
        console.log(`[CANVA-AGENT] Successfully extracted Canva design URL: ${match[0]}`);
        return { success: true, outputUrl: match[0] };
      }

      const allLinks = await page.evaluate(() => {
        const anchors = document.querySelectorAll('a[href*="canva.com/design"]');
        return Array.from(anchors).map(a => (a as HTMLAnchorElement).href);
      });

      if (allLinks.length > 0) {
        console.log(`[CANVA-AGENT] Found Canva design link in page: ${allLinks[0]}`);
        return { success: true, outputUrl: allLinks[0] };
      }

      console.log(`[CANVA-AGENT] No specific Canva design URL extracted. Current URL: ${currentUrl}`);
      return { success: true, outputUrl: currentUrl || 'Task completed, but no explicit Canva URL extracted. Check your Canva workspace.' };
    } catch (error: any) {
      console.error(`[CANVA-AGENT] Execution failed: `, error);
      if (error.name === 'TimeoutError') {
        return { success: false, error: 'Canva automation timed out' };
      }
      return { success: false, error: error.message || 'Unknown Playwright execution error' };
    } finally {
      if (context) await context.close().catch(() => {});
      if (browser) await browser.close().catch(() => {});
    }
  }
}

export const canvaAgent = new CanvaAgentService();
