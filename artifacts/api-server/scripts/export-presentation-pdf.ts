import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

const DEV_DOMAIN = process.env.REPLIT_DEV_DOMAIN;
const PRESENTATION_URL = `https://${DEV_DOMAIN}/protocol-presentation/`;
const OUTPUT_DIR = path.resolve(process.cwd(), "..", "..", "public", "protocols");
const TOTAL_SLIDES = 30;

export async function exportPresentationPDF(outputPath?: string): Promise<string> {
  if (!DEV_DOMAIN) {
    throw new Error("REPLIT_DEV_DOMAIN not set");
  }

  const finalOutputPath = outputPath || path.join(OUTPUT_DIR, "Kathryn_Smith_Protocol_Presentation.pdf");
  const outputDir = path.dirname(finalOutputPath);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`[Export] Launching browser...`);
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
    ],
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  console.log(`[Export] Loading presentation: ${PRESENTATION_URL}`);
  await page.goto(PRESENTATION_URL, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(3000);

  console.log(`[Export] Capturing ${TOTAL_SLIDES} slides...`);

  const { PDFDocument } = await import("pdf-lib");
  const pdfDoc = await PDFDocument.create();
  const slideWidth = 1920;
  const slideHeight = 1080;

  for (let i = 0; i < TOTAL_SLIDES; i++) {
    console.log(`[Export] Capturing slide ${i + 1}/${TOTAL_SLIDES}...`);
    await page.waitForTimeout(600);

    const pngBuffer = await page.screenshot({ type: "png", fullPage: false });
    const pngImage = await pdfDoc.embedPng(pngBuffer);
    const pdfPage = pdfDoc.addPage([slideWidth, slideHeight]);
    pdfPage.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: slideWidth,
      height: slideHeight,
    });

    if (i < TOTAL_SLIDES - 1) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(500);
    }
  }

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(finalOutputPath, Buffer.from(pdfBytes));
  const sizeMB = (pdfBytes.length / 1024 / 1024).toFixed(2);
  console.log(`[Export] PDF saved to ${finalOutputPath} (${sizeMB} MB, ${TOTAL_SLIDES} slides)`);

  await browser.close();
  console.log("[Export] Done!");
  return finalOutputPath;
}

const isMainModule = process.argv[1]?.includes("export-presentation-pdf");
if (isMainModule) {
  exportPresentationPDF().catch((err) => {
    console.error("[Export] Fatal error:", err);
    process.exit(1);
  });
}
