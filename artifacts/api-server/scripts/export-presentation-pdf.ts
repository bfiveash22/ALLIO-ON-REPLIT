import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

const DEV_DOMAIN = process.env.REPLIT_DEV_DOMAIN;
const PRESENTATION_URL = `https://${DEV_DOMAIN}/protocol-presentation/`;
const OUTPUT_DIR = path.join(process.cwd(), "public", "protocols");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "Kathryn_Smith_Protocol_Presentation.pdf");

async function main() {
  if (!DEV_DOMAIN) {
    console.error("REPLIT_DEV_DOMAIN not set");
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`[Export] Launching browser...`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  console.log(`[Export] Loading presentation: ${PRESENTATION_URL}`);
  await page.goto(PRESENTATION_URL, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(3000);

  const slideCountText = await page.textContent('[class*="slide-counter"], [class*="slideCounter"]').catch(() => null);
  console.log(`[Export] Slide counter text: ${slideCountText}`);

  const totalSlides = await page.evaluate(() => {
    const counterEl = document.querySelector('[class*="text-white/50"]');
    if (counterEl) {
      const match = counterEl.textContent?.match(/of\s+(\d+)/i) || counterEl.textContent?.match(/\/\s*(\d+)/);
      if (match) return parseInt(match[1]);
    }
    return 30;
  });

  console.log(`[Export] Total slides detected: ${totalSlides}`);

  const screenshots: Buffer[] = [];

  for (let i = 0; i < totalSlides; i++) {
    console.log(`[Export] Capturing slide ${i + 1}/${totalSlides}...`);
    await page.waitForTimeout(800);

    const screenshot = await page.screenshot({
      type: "png",
      fullPage: false,
    });
    screenshots.push(screenshot);

    if (i < totalSlides - 1) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(600);
    }
  }

  console.log(`[Export] Captured ${screenshots.length} slides. Generating PDF...`);

  const screenshotDir = path.join(OUTPUT_DIR, "slide_screenshots");
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  for (let i = 0; i < screenshots.length; i++) {
    fs.writeFileSync(path.join(screenshotDir, `slide_${String(i + 1).padStart(2, '0')}.png`), screenshots[i]);
  }

  const pdfPage = await context.newPage();
  const htmlSlides = screenshots.map((_, i) => {
    const imgPath = path.join(screenshotDir, `slide_${String(i + 1).padStart(2, '0')}.png`);
    const imgData = fs.readFileSync(imgPath).toString('base64');
    return `<div class="slide"><img src="data:image/png;base64,${imgData}" /></div>`;
  }).join('\n');

  const html = `<!DOCTYPE html>
<html>
<head>
<style>
  @page { size: 1920px 1080px; margin: 0; }
  body { margin: 0; padding: 0; }
  .slide { page-break-after: always; width: 1920px; height: 1080px; overflow: hidden; }
  .slide:last-child { page-break-after: auto; }
  .slide img { width: 100%; height: 100%; object-fit: contain; }
</style>
</head>
<body>${htmlSlides}</body>
</html>`;

  await pdfPage.setContent(html, { waitUntil: "load" });
  await pdfPage.pdf({
    path: OUTPUT_FILE,
    width: "1920px",
    height: "1080px",
    printBackground: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
  });

  console.log(`[Export] PDF saved to ${OUTPUT_FILE} (${(fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(2)} MB)`);

  for (const f of fs.readdirSync(screenshotDir)) {
    fs.unlinkSync(path.join(screenshotDir, f));
  }
  fs.rmdirSync(screenshotDir);

  await browser.close();
  console.log("[Export] Done!");
}

main().catch((err) => {
  console.error("[Export] Fatal error:", err);
  process.exit(1);
});
