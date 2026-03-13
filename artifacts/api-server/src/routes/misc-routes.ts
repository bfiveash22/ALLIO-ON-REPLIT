import type { Express, Request, Response } from "express";
import { requireAuth, requireRole } from "../working-auth";
import { storage } from "../storage";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { lockManager } from "../services/agent-locks";
import { signNowService } from "../services/signnow";
import { sendEmail } from "../services/gmail";
import { submitIntakeForm } from "../services/intake";
import { intakeForms } from "@shared/schema";
import { fetchCatalogContent, searchCatalog, getCatalogSections, getProductInfo } from "../services/catalog-service";
import { indexAllMarketingAssets, searchAssets, checkExistingAsset, getAssetStats } from "../services/asset-catalog";
import { connectSourceMaterials, autoConnectByKeywordMatch } from "../seeds/connect-source-materials-seed";
import { generateInteractiveContent, generateSingleModuleContent } from "../seeds/batch-interactive-content-seed";
import { seedECSTraining } from "../seeds/ecs-training-seed";
import { seedGersonTherapy } from "../seeds/gerson-therapy-seed";
import { seedPMALawTraining } from "../seeds/pma-law-training-seed";
import { seedPeptideTraining } from "../seeds/peptide-training-seed";
import { seedDianeCandidaCookbook } from "../seeds/diane-candida-cookbook-seed";
import { seedOzoneTraining } from "../seeds/ozone-training-seed";
import { seedDietCancerTraining } from "../seeds/diet-cancer-training-seed";
import { seedIvermectinTraining } from "../seeds/ivermectin-training-seed";
import { seedRemainingModules } from "../seeds/complete-remaining-modules-seed";
import { enhanceModulesWithMedia, getAvailableMediaAssets } from "../seeds/enhance-modules-with-media";
import { seedAchievements } from "../seeds/achievements-seed";
import { wooCommerceService } from "../services/woocommerce";
import multer from "multer";
import OpenAI from "openai";

const upload = multer({ storage: multer.memoryStorage() });

export function registerMiscRoutes(app: Express): void {
  app.post("/api/admin/system/update", requireAuth, requireRole('trustee'), async (req, res) => {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      res.json({ message: "Update initiated. System will reload shortly without downtime." });
      setTimeout(async () => {
        try { await execAsync('npm run build && pm2 reload allio-v1'); } catch (error) { console.error('[OVERSEER] Update failed:', error); }
      }, 1000);
    } catch (error: any) {
      if (!res.headersSent) res.status(500).json({ error: error.message || "Failed to trigger update" });
    }
  });

  app.post("/api/intake/save-draft", async (req: Request, res: Response) => {
    try {
      const { draftId, patientInfo, formData } = req.body;
      const draftData = {
        patientName: patientInfo?.name || "Anonymous", patientEmail: patientInfo?.email || "No Email",
        patientPhone: patientInfo?.phone || null, dateOfBirth: patientInfo?.dob ? new Date(patientInfo.dob) : null,
        age: patientInfo?.age ? parseInt(patientInfo.age, 10) : null, formData: formData || {}, status: "draft", updatedAt: new Date(),
      };
      if (draftId) {
        await db.update(intakeForms).set(draftData).where(eq(intakeForms.id, parseInt(draftId, 10)));
        return res.json({ success: true, draftId });
      } else {
        const [newDraft] = await db.insert(intakeForms).values({ ...draftData, createdAt: new Date() }).returning({ id: intakeForms.id });
        return res.json({ success: true, draftId: newDraft.id });
      }
    } catch (error: any) { res.status(500).json({ error: error.message || "Failed to save draft" }); }
  });

  app.post("/api/intake/submit", async (req: Request, res: Response) => {
    try {
      const { patientInfo, formData } = req.body;
      if (!patientInfo?.name || !patientInfo?.email) return res.status(400).json({ error: "Patient name and email are required" });
      const result = await submitIntakeForm(patientInfo, formData);
      try { await sendEmail(patientInfo.email, "FFPMA - Patient Intake Received", `Dear ${patientInfo.name},\n\nWe have received your completed patient intake form.\n\nBest regards,\nThe FFPMA Team`); } catch {}
      try { await sendEmail("blake@forgottenformula.com", "New Patient Intake Submitted", `A new patient intake form has been submitted by ${patientInfo.name} (${patientInfo.email}).`); } catch {}
      res.json(result);
    } catch (error: any) { res.status(500).json({ error: error.message || "Failed to submit intake form" }); }
  });

  app.get("/api/checkout/health", requireRole("admin"), async (req: Request, res: Response) => {
    try { res.json(await wooCommerceService.checkCommerceHealth()); }
    catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.post("/api/checkout/wc-create-order", requireAuth, async (req: Request, res: Response) => {
    try {
      const { items, billing } = req.body;
      if (!items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ error: "Cart items required" });
      if (!billing?.email || !billing?.first_name || !billing?.last_name) return res.status(400).json({ error: "Billing name and email required" });

      const userWpRoles = req.user ? ((req.user as any).wpRoles || []) : [];
      const userRole = req.user ? (req.user as any).role : 'guest';
      const effectiveRoles = [...userWpRoles, userRole].map((r: string) => r.toLowerCase());

      const getRolePrice = (productOrVariation: any, roles: string[]): number | null => {
        if (!productOrVariation.rolePricing) return null;
        const normalizedPrices: Record<string, any> = {};
        for (const [key, value] of Object.entries(productOrVariation.rolePricing)) normalizedPrices[key.toLowerCase()] = value;
        for (const role of roles) { if (normalizedPrices[role]?.visible) { const price = parseFloat(normalizedPrices[role].price); if (!isNaN(price) && price > 0) return price; } }
        return null;
      };

      const lineItems = await Promise.all(items.map(async (item: any) => {
        const productId = parseInt(item.wcProductId || item.productId);
        const quantity = parseInt(item.quantity) || 1;
        if (isNaN(productId) || productId <= 0) throw new Error(`Invalid product ID`);
        const product = await wooCommerceService.getProductById(productId);
        if (!product) throw new Error(`Product not found: ${productId}`);
        let unitPrice = product.salePrice || product.price;
        if (item.variationId) {
          const variation = product.variations?.find(v => v.id === parseInt(item.variationId));
          if (variation) { const varRolePrice = getRolePrice(variation, effectiveRoles); unitPrice = varRolePrice !== null ? varRolePrice : (variation.salePrice || variation.price); }
        } else { const prodRolePrice = getRolePrice(product, effectiveRoles); if (prodRolePrice !== null) unitPrice = prodRolePrice; }
        return { product_id: productId, quantity, total: String(unitPrice * quantity), ...(item.variationId ? { variation_id: parseInt(item.variationId) } : {}) };
      }));

      try {
        const wcOrder = await wooCommerceService.createOrder({
          customer_id: (req.user as any)?.wpUserId || 0,
          billing: { first_name: billing.first_name, last_name: billing.last_name, email: billing.email, phone: billing.phone || '', address_1: billing.address_1 || '', city: billing.city || '', state: billing.state || '', postcode: billing.postcode || '', country: billing.country || 'US' },
          line_items: lineItems, meta_data: [{ key: '_allio_source', value: 'member_portal' }],
        } as any);
        return res.json({ orderId: wcOrder.id, orderKey: wcOrder.order_key, total: wcOrder.total, checkoutUrl: wcOrder.checkout_url, status: wcOrder.status, method: 'order_api' });
      } catch {}

      const wcStoreUrl = process.env.WOOCOMMERCE_URL || 'https://www.forgottenformula.com';
      const addToCartParams = lineItems.map((item: any) => `add-to-cart=${item.product_id}&quantity=${item.quantity}`).join('&');
      const billingParams = new URLSearchParams({ billing_first_name: billing.first_name, billing_last_name: billing.last_name, billing_email: billing.email }).toString();
      res.json({ checkoutUrl: `${wcStoreUrl}/?${addToCartParams}&${billingParams}`, method: 'add_to_cart_redirect', status: 'redirect' });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.get("/api/checkout/wc-order/:orderId", requireAuth, async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) return res.status(400).json({ error: "Invalid order ID" });
      const order = await wooCommerceService.getOrderById(orderId);
      if (!order) return res.status(404).json({ error: "Order not found" });
      res.json({ id: order.id, status: order.status, total: order.total, currency: order.currency, date_created: order.date_created, payment_method: order.payment_method, line_items: order.line_items, billing_email: order.billing?.email });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.get("/api/admin/agents/locks", requireRole("admin"), async (req: Request, res: Response) => {
    try { res.json(lockManager.getAllLocks()); } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.post("/api/admin/agents/locks/clear", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { resourceId } = req.body;
      if (!resourceId) return res.status(400).json({ error: "resourceId is required" });
      res.json({ success: lockManager.forceReleaseLock(resourceId) });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.post("/api/search/suggestions", requireAuth, async (req: Request, res: Response) => {
    try {
      const { query } = req.body;
      if (!query || typeof query !== 'string' || query.length < 2) return res.json({ suggestions: [] });
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: `You are a search assistant for ALLIO. Generate 3 relevant search suggestions. Return ONLY a JSON array of 3 short strings.` }, { role: "user", content: `Query: "${query}"` }],
        max_tokens: 100, temperature: 0.7,
      });
      let suggestions: string[] = [];
      try { const parsed = JSON.parse(completion.choices[0]?.message?.content || '[]'); if (Array.isArray(parsed)) suggestions = parsed.slice(0, 3); } catch {}
      res.json({ suggestions });
    } catch (error: any) { res.json({ suggestions: [] }); }
  });

  app.post("/api/tts/generate", requireAuth, async (req: Request, res: Response) => {
    try {
      const { text, voice = "onyx" } = req.body;
      if (!text || typeof text !== 'string') return res.status(400).json({ error: "Text is required" });
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.audio.speech.create({ model: "tts-1", voice: voice as any, input: text.slice(0, 4000) });
      const buffer = Buffer.from(await response.arrayBuffer());
      res.set({ "Content-Type": "audio/mpeg", "Content-Length": buffer.length.toString() });
      res.send(buffer);
    } catch (error: any) { res.status(500).json({ error: "Failed to generate audio", details: error?.message }); }
  });

  app.post("/api/vision/analyze-blood", requireRole("trustee"), async (req: Request, res: Response) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) return res.status(400).json({ error: "imageBase64 is required" });
      const { analyzeBloodMicroscopyVision } = await import("../services/google-ml");
      res.json(await analyzeBloodMicroscopyVision(imageBase64));
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.post("/api/rupa-health/order", requireAuth, async (req: Request, res: Response) => {
    try {
      const { patientDetails, testPanels, dryRun } = req.body;
      if (!patientDetails || !testPanels || !Array.isArray(testPanels)) return res.status(400).json({ error: "patientDetails and testPanels array are required" });
      const { rupaHealthAgent } = await import("../services/rupa-health-agent");
      rupaHealthAgent.placeOrder(patientDetails, testPanels, dryRun !== false).catch(err => console.error("[Rupa Health API] Order placement failed:", err));
      res.json({ message: "Rupa Health order initiated." });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.get("/api/calendar/events", requireRole("trustee"), async (req: Request, res: Response) => {
    try {
      const { listUpcomingEvents } = await import("../services/calendar");
      res.json(await listUpcomingEvents(10));
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.get("/api/signnow/status", requireRole("admin"), async (req: Request, res: Response) => {
    try { res.json(await signNowService.getStatus()); } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.get("/api/signnow/documents", requireRole("admin"), async (req: Request, res: Response) => {
    try { res.json(await signNowService.listDocuments()); } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.get("/api/signnow/documents/:id", requireRole("admin"), async (req: Request, res: Response) => {
    try { res.json(await signNowService.getDocument(req.params.id)); } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.post("/api/signnow/documents", requireRole("admin"), upload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });
      res.json(await signNowService.uploadDocumentFromBuffer(req.file.buffer, req.file.originalname));
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.post("/api/signnow/documents/:id/invite", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { signerEmail, signerName, subject, message } = req.body;
      if (!signerEmail || !subject) return res.status(400).json({ error: "signerEmail and subject are required" });
      res.json(await signNowService.sendInvite(req.params.id, signerEmail, signerName || signerEmail, subject, message || "Please sign this document"));
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.post("/api/signnow/documents/:id/embedded-invite", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { signerEmail, roleId } = req.body;
      if (!signerEmail || !roleId) return res.status(400).json({ error: "signerEmail and roleId are required" });
      res.json(await signNowService.createEmbeddedInvite(req.params.id, signerEmail, roleId));
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.post("/api/signnow/documents/:id/signing-link", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { fieldInviteUniqueId, expirationMinutes } = req.body;
      if (!fieldInviteUniqueId) return res.status(400).json({ error: "fieldInviteUniqueId is required" });
      res.json(await signNowService.generateSigningLink(req.params.id, fieldInviteUniqueId, expirationMinutes || 30));
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.get("/api/signnow/documents/:id/download", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const buffer = await signNowService.downloadDocument(req.params.id);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="document-${req.params.id}.pdf"`);
      res.send(buffer);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.post("/api/signnow/documents/:id/cancel", requireRole("admin"), async (req: Request, res: Response) => {
    try { await signNowService.cancelInvite(req.params.id); res.json({ success: true }); } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.delete("/api/signnow/documents/:id", requireRole("admin"), async (req: Request, res: Response) => {
    try { await signNowService.deleteDocument(req.params.id); res.json({ success: true }); } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.get("/api/catalog", async (req: Request, res: Response) => {
    try { const content = await fetchCatalogContent(); res.json({ success: true, length: content.length, content }); }
    catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
  });

  app.get("/api/catalog/search", async (req: Request, res: Response) => {
    try {
      const { query } = req.query;
      if (!query) return res.status(400).json({ error: "Query parameter required" });
      const results = await searchCatalog(query as string);
      res.json({ success: true, query, resultCount: results.length, results });
    } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
  });

  app.get("/api/catalog/sections", async (req: Request, res: Response) => {
    try { res.json({ success: true, sections: await getCatalogSections() }); }
    catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
  });

  app.get("/api/catalog/product/:name", async (req: Request, res: Response) => {
    try { res.json({ success: true, product: await getProductInfo(req.params.name) }); }
    catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
  });

  app.post("/api/assets/index", requireRole("admin"), async (req: Request, res: Response) => {
    try { res.json({ success: true, ...(await indexAllMarketingAssets()) }); }
    catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
  });

  app.get("/api/assets/search", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { query, division, agent, category, limit } = req.query;
      res.json(await searchAssets({ query: query as string, division: division as string, agent: agent as string, category: category as string, limit: limit ? parseInt(limit as string) : 50 }));
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.get("/api/assets/check-existing", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { name } = req.query;
      if (!name) return res.status(400).json({ error: "Name parameter required" });
      const existing = await checkExistingAsset(name as string);
      res.json({ exists: !!existing, asset: existing });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.get("/api/assets/stats", requireRole("admin"), async (req: Request, res: Response) => {
    try { res.json(await getAssetStats()); } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.post("/api/admin/seed-ecs-training", requireRole("admin"), async (req: Request, res: Response) => {
    try { res.json(await seedECSTraining()); } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
  });

  app.post("/api/admin/seed-gerson-therapy", requireRole("admin"), async (req: Request, res: Response) => {
    try { res.json(await seedGersonTherapy()); } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
  });

  app.post("/api/admin/seed-pma-law-training", requireRole("admin"), async (req: Request, res: Response) => {
    try { res.json(await seedPMALawTraining()); } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
  });

  app.post("/api/admin/seed-peptide-training", requireRole("admin"), async (req: Request, res: Response) => {
    try { const { useAI = false } = req.body; res.json(await seedPeptideTraining(useAI)); } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
  });

  app.post("/api/admin/seed-diet-cancer-training", requireRole("admin"), async (req: Request, res: Response) => {
    try { const { useAI = false } = req.body; res.json(await seedDietCancerTraining(useAI)); } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
  });

  app.post("/api/admin/seed-diane-candida-cookbook", requireRole("admin"), async (req: Request, res: Response) => {
    try { const { useAI = false } = req.body; res.json(await seedDianeCandidaCookbook(useAI)); } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
  });

  app.post("/api/admin/seed-ozone-training", requireRole("admin"), async (req: Request, res: Response) => {
    try { const { useAI = false } = req.body; res.json(await seedOzoneTraining(useAI)); } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
  });

  app.post("/api/admin/connect-source-materials", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { autoConnect = false } = req.body;
      if (autoConnect) res.json({ success: true, mode: "auto", ...(await autoConnectByKeywordMatch()) });
      else res.json({ success: true, mode: "mapped", ...(await connectSourceMaterials()) });
    } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
  });

  app.post("/api/admin/generate-interactive-content", requireRole("admin"), async (req: Request, res: Response) => {
    try { const { limit = 10, category, dryRun = false } = req.body; res.json({ success: true, ...(await generateInteractiveContent({ limit, category, dryRun })) }); }
    catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
  });

  app.post("/api/admin/generate-module-content/:moduleId", requireRole("admin"), async (req: Request, res: Response) => {
    try { const result = await generateSingleModuleContent(req.params.moduleId); res.json({ success: result.status === "success", ...result }); }
    catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
  });

  app.post("/api/admin/seed-ivermectin-training", requireRole("admin"), async (req: Request, res: Response) => {
    try { res.json({ success: true, ...(await seedIvermectinTraining()) }); } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
  });

  app.post("/api/admin/seed-remaining-modules", requireRole("admin"), async (req: Request, res: Response) => {
    try { res.json({ success: true, ...(await seedRemainingModules()) }); } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
  });

  app.post("/api/admin/enhance-modules-media", requireRole("admin"), async (req: Request, res: Response) => {
    try { res.json({ success: true, ...(await enhanceModulesWithMedia()) }); } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
  });

  app.get("/api/admin/available-media", requireRole("admin"), async (req: Request, res: Response) => {
    try { res.json({ success: true, ...(await getAvailableMediaAssets()) }); } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
  });

  app.post("/api/admin/seed-achievements", requireRole("admin"), async (req: Request, res: Response) => {
    try { res.json({ success: true, ...(await seedAchievements()) }); } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
  });

  app.post("/api/admin/add-quizzes-all-modules", requireRole("admin"), async (req: Request, res: Response) => {
    try { const { addQuizzesToAllModules } = await import("../seeds/add-quizzes-to-all-modules"); res.json(await addQuizzesToAllModules()); }
    catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
  });

  app.post("/api/admin/upload-video-to-drive", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { videoPath, title } = req.body;
      if (!videoPath || !title) return res.status(400).json({ success: false, error: "videoPath and title required" });
      const { uploadVideoToMarketing } = await import("../services/drive");
      res.json(await uploadVideoToMarketing(videoPath, title));
    } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
  });

  app.post("/api/admin/upload-all-videos-to-drive", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const fs = await import("fs");
      const path = await import("path");
      const { uploadVideoToMarketing } = await import("../services/drive");
      const videosDir = "attached_assets/generated_videos";
      const files = fs.readdirSync(videosDir).filter(f => f.endsWith(".mp4"));
      const results: any[] = [];
      for (const file of files) { const result = await uploadVideoToMarketing(path.join(videosDir, file), `PRISM_${file.replace(".mp4", "")}`); results.push({ file, ...result }); }
      res.json({ success: true, uploaded: results.filter(r => r.success).length, failed: results.filter(r => !r.success).length, results });
    } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
  });
}
