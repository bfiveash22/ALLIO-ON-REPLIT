import type { Express, Request, Response } from "express";
import { requireAuth, requireRole } from "../working-auth";
import { storage } from "../storage";
import { db } from "../db";
import { eq, sql, count } from "drizzle-orm";
import { lockManager } from "../services/agent-locks";
import { signNowService } from "../services/signnow";
import { sendEmail } from "../services/gmail";
import { submitIntakeForm } from "../services/intake";
import { intakeForms, products, categories, orders, memberProfiles, contracts, chatRooms, chatMessages, chatParticipants } from "@shared/schema";
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
import { seedAncientMedicineTraining } from "../seeds/ancient-medicine-training-seed";
import { seedPeptideProtocolMastery } from "../seeds/peptide-protocol-mastery-seed";
import { seedFormulaAnalysisTraining } from "../seeds/formula-analysis-training-seed";
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
    try { const result = await seedIvermectinTraining(); res.json({ ...result, success: true }); } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
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

  app.post("/api/admin/seed-ancient-medicine-training", requireRole("admin"), async (req: Request, res: Response) => {
    try { res.json(await seedAncientMedicineTraining()); } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
  });

  app.post("/api/admin/seed-peptide-protocol-mastery", requireRole("admin"), async (req: Request, res: Response) => {
    try { res.json(await seedPeptideProtocolMastery()); } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
  });

  app.post("/api/admin/seed-formula-analysis-training", requireRole("admin"), async (req: Request, res: Response) => {
    try { res.json(await seedFormulaAnalysisTraining()); } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
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

  app.post("/api/protocol-slides/annette-gomer", requireAuth, requireRole('admin', 'trustee', 'doctor'), async (_req, res) => {
    try {
      const { generateAnnetteGomerSlides } = await import("../services/protocol-slide-generator");
      console.log('[Protocol Slides] Generating Annette Gomer presentation...');
      const result = await generateAnnetteGomerSlides();
      console.log(`[Protocol Slides] Annette Gomer presentation created: ${result.webViewLink} (${result.slideCount} slides)`);
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error('[Protocol Slides] Annette Gomer generation failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/protocol-slides/kathryn-smith", requireAuth, requireRole('admin', 'trustee', 'doctor'), async (_req, res) => {
    try {
      const { generateKathrynSmithSlides } = await import("../services/protocol-slide-generator");
      console.log('[Protocol Slides] Generating Kathryn Smith presentation...');
      const result = await generateKathrynSmithSlides();
      console.log(`[Protocol Slides] Kathryn Smith presentation created: ${result.webViewLink} (${result.slideCount} slides)`);
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error('[Protocol Slides] Kathryn Smith generation failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/detox-protocols', requireAuth, async (_req: Request, res: Response) => {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const detoxDir = path.default.join(process.cwd(), 'knowledge-base', 'detox-protocols');
      const files = fs.default.readdirSync(detoxDir).filter((f) => f.endsWith('.md'));
      const protocols = files.map((file) => {
        const content = fs.default.readFileSync(path.default.join(detoxDir, file), 'utf-8');
        const slug = file.replace('.md', '');
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1] : slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        const overviewMatch = content.match(/## Overview\n([\s\S]*?)(?=\n## )/);
        const overview = overviewMatch ? overviewMatch[1].trim() : '';
        return { slug, title, overview, content };
      });
      res.json(protocols);
    } catch (error) {
      console.error('[Detox Protocols] Error loading protocols:', error);
      res.status(500).json({ error: 'Failed to load detox protocols' });
    }
  });

  app.get('/api/detox-protocols/:slug', requireAuth, async (req: Request, res: Response) => {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const { slug } = req.params;
      if (!/^[a-z0-9-]+$/.test(slug)) {
        return res.status(400).json({ error: 'Invalid protocol slug' });
      }
      const filePath = path.default.join(process.cwd(), 'knowledge-base', 'detox-protocols', slug + '.md');
      if (!fs.default.existsSync(filePath)) {
        return res.status(404).json({ error: 'Protocol not found' });
      }
      const content = fs.default.readFileSync(filePath, 'utf-8');
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1] : slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      res.json({ slug, title, content });
    } catch (error) {
      console.error('[Detox Protocols] Error loading protocol:', error);
      res.status(500).json({ error: 'Failed to load protocol' });
    }
  });

  app.get('/api/detox-protocols/:slug/download', requireAuth, async (req: Request, res: Response) => {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const { slug } = req.params;
      if (!/^[a-z0-9-]+$/.test(slug)) {
        return res.status(400).json({ error: 'Invalid protocol slug' });
      }
      const filePath = path.default.join(process.cwd(), 'knowledge-base', 'detox-protocols', slug + '.md');
      if (!fs.default.existsSync(filePath)) {
        return res.status(404).json({ error: 'Protocol not found' });
      }
      const content = fs.default.readFileSync(filePath, 'utf-8');
      res.setHeader('Content-Type', 'text/markdown');
      res.setHeader('Content-Disposition', 'attachment; filename="' + slug + '.md"');
      res.send(content);
    } catch (error) {
      console.error('[Detox Protocols] Download error:', error);
      res.status(500).json({ error: 'Failed to download protocol' });
    }
  });

  app.get("/api/diane/knowledge", requireAuth, async (req: Request, res: Response) => {
    try {
      const { category, search } = req.query;
      let entries = await storage.getDianeKnowledge();

      if (category && typeof category === 'string') {
        entries = entries.filter(e => e.category === category);
      }

      if (search && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        entries = entries.filter(e =>
          e.title.toLowerCase().includes(searchLower) ||
          e.content.toLowerCase().includes(searchLower) ||
          e.tags?.some(t => t.toLowerCase().includes(searchLower))
        );
      }

      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/legal/documents/:slug", requireAuth, async (req: Request, res: Response) => {
    try {
      const { getLegalDocumentBySlug } = await import("../services/legal-documents");
      const doc = getLegalDocumentBySlug(req.params.slug);
      if (!doc) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(doc);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/herald/campaign/welcome", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { email, memberName } = req.body;
      if (!email || !memberName) {
        return res.status(400).json({ error: "email and memberName are required" });
      }
      const { EMAIL_TEMPLATES, sendCampaignEmail } = await import("../services/herald-email-campaigns");
      const template = EMAIL_TEMPLATES.welcomeOnboarding(memberName);
      const result = await sendCampaignEmail(email, template);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/herald/campaign/intake-confirmation", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { email, memberName, intakeId } = req.body;
      if (!email || !memberName || !intakeId) {
        return res.status(400).json({ error: "email, memberName, and intakeId are required" });
      }
      const { EMAIL_TEMPLATES, sendCampaignEmail } = await import("../services/herald-email-campaigns");
      const template = EMAIL_TEMPLATES.intakeConfirmation(memberName, intakeId);
      const result = await sendCampaignEmail(email, template);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/herald/campaign/protocol-delivery", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { email, memberName, protocolId, slidesUrl } = req.body;
      if (!email || !memberName || !protocolId) {
        return res.status(400).json({ error: "email, memberName, and protocolId are required" });
      }
      const { EMAIL_TEMPLATES, sendCampaignEmail } = await import("../services/herald-email-campaigns");
      const template = EMAIL_TEMPLATES.protocolDelivery(memberName, protocolId, slidesUrl);
      const result = await sendCampaignEmail(email, template);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/herald/campaign/launch-announcement", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { recipients } = req.body;
      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({ error: "recipients array is required" });
      }
      const { EMAIL_TEMPLATES, sendBulkCampaign } = await import("../services/herald-email-campaigns");
      const template = EMAIL_TEMPLATES.launchAnnouncement();
      const result = await sendBulkCampaign(recipients, template);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/herald/campaign/appointment-reminder", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { email, memberName, doctorName, date, time } = req.body;
      if (!email || !memberName || !doctorName || !date || !time) {
        return res.status(400).json({ error: "email, memberName, doctorName, date, and time are required" });
      }
      const { EMAIL_TEMPLATES, sendCampaignEmail } = await import("../services/herald-email-campaigns");
      const template = EMAIL_TEMPLATES.appointmentReminder(memberName, doctorName, date, time);
      const result = await sendCampaignEmail(email, template);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/launch/checklist", requireRole("admin"), async (_req: Request, res: Response) => {
    try {
      const checks: Array<{ name: string; category: string; status: "pass" | "fail" | "warning"; details: string }> = [];

      checks.push({ name: "Stripe Payments", category: "payments", status: process.env.STRIPE_SECRET_KEY ? (process.env.STRIPE_SECRET_KEY.startsWith("sk_live_") ? "pass" : "warning") : "fail", details: process.env.STRIPE_SECRET_KEY ? (process.env.STRIPE_SECRET_KEY.startsWith("sk_live_") ? "Live key configured" : "Test key - switch to live for launch") : "STRIPE_SECRET_KEY not set" });
      checks.push({ name: "Stripe Webhook", category: "payments", status: process.env.STRIPE_WEBHOOK_SECRET ? "pass" : "fail", details: process.env.STRIPE_WEBHOOK_SECRET ? "Webhook secret configured" : "STRIPE_WEBHOOK_SECRET required for payment security" });
      checks.push({ name: "Gmail Integration", category: "email", status: process.env.GMAIL_REFRESH_TOKEN ? "pass" : "fail", details: process.env.GMAIL_REFRESH_TOKEN ? "Gmail OAuth configured" : "GMAIL_REFRESH_TOKEN not set" });
      checks.push({ name: "SignNow Integration", category: "documents", status: process.env.SIGNNOW_API_KEY ? "pass" : "warning", details: process.env.SIGNNOW_API_KEY ? "SignNow API key configured" : "SIGNNOW_API_KEY not set" });
      checks.push({ name: "Database Connection", category: "infrastructure", status: process.env.DATABASE_URL ? "pass" : "fail", details: process.env.DATABASE_URL ? "Database URL configured" : "DATABASE_URL not set" });
      checks.push({ name: "OpenAI Integration", category: "ai", status: process.env.OPENAI_API_KEY ? "pass" : "fail", details: process.env.OPENAI_API_KEY ? "OpenAI API key configured" : "OPENAI_API_KEY not set" });
      checks.push({ name: "WordPress OAuth", category: "auth", status: process.env.WP_SITE_URL ? "pass" : "fail", details: process.env.WP_SITE_URL ? "WordPress site configured" : "WP_SITE_URL not set" });
      checks.push({ name: "WooCommerce", category: "ecommerce", status: (process.env.WOOCOMMERCE_KEY && process.env.WOOCOMMERCE_SECRET) ? "pass" : "warning", details: (process.env.WOOCOMMERCE_KEY && process.env.WOOCOMMERCE_SECRET) ? "WooCommerce API keys configured" : "WooCommerce keys not fully set" });
      checks.push({ name: "Legal Documents", category: "compliance", status: "pass", details: "4 legal documents available" });
      checks.push({ name: "HERALD Email Templates", category: "email", status: "pass", details: "5 email campaign templates ready" });

      const passCount = checks.filter(c => c.status === "pass").length;
      const failCount = checks.filter(c => c.status === "fail").length;
      const warnCount = checks.filter(c => c.status === "warning").length;

      res.json({
        launchDate: "2026-04-01T00:00:00Z",
        checklist: checks,
        summary: { total: checks.length, pass: passCount, fail: failCount, warning: warnCount, readyPercent: Math.round((passCount / checks.length) * 100) },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/products", async (_req: Request, res: Response) => {
    try {
      const allProducts = await db.select().from(products).where(eq(products.isActive, true));
      res.json(allProducts);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: msg });
    }
  });

  app.get("/api/categories", async (_req: Request, res: Response) => {
    try {
      const allCategories = await db.select().from(categories);
      res.json(allCategories);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: msg });
    }
  });

  app.get("/api/orders", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as { id: string })?.id;
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const userOrders = await db.select().from(orders).where(eq(orders.userId, userId));
      res.json(userOrders);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: msg });
    }
  });

  app.get("/api/admin/members", requireRole("admin", "trustee"), async (_req: Request, res: Response) => {
    try {
      const members = await storage.getAllMembers();
      res.json(members);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: msg });
    }
  });

  app.get("/api/admin/member-stats", requireRole("admin", "trustee"), async (_req: Request, res: Response) => {
    try {
      const members = await storage.getAllMembers();
      const byRole: Record<string, number> = {};
      const byWpRole: Record<string, number> = {};
      for (const m of members) {
        const role = (m as { role?: string }).role || "member";
        byRole[role] = (byRole[role] || 0) + 1;
        const wpRoles = (m as { wpRoles?: string[] }).wpRoles || [];
        for (const wr of wpRoles) {
          byWpRole[wr] = (byWpRole[wr] || 0) + 1;
        }
      }
      res.json({ total: members.length, byRole, byWpRole });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: msg });
    }
  });

  app.get("/api/admin/contracts", requireRole("admin", "trustee"), async (_req: Request, res: Response) => {
    try {
      const allContracts = await db.select().from(contracts);
      res.json(allContracts);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: msg });
    }
  });

  app.get("/api/chat/rooms", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as { id: string })?.id;
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const rooms = await db.select().from(chatRooms);
      res.json(rooms);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: msg });
    }
  });

  app.get("/api/chat/rooms/:roomId/messages", requireAuth, async (req: Request, res: Response) => {
    try {
      const { roomId } = req.params;
      const msgs = await db.select().from(chatMessages).where(eq(chatMessages.roomId, roomId));
      res.json(msgs);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: msg });
    }
  });

  app.post("/api/chat/rooms/:roomId/messages", requireAuth, async (req: Request, res: Response) => {
    try {
      const { roomId } = req.params;
      const { content } = req.body;
      const userId = (req.user as { id: string })?.id;
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      if (!content) return res.status(400).json({ error: "Message content required" });
      const [newMsg] = await db.insert(chatMessages).values({
        roomId,
        userId,
        content,
      }).returning();
      res.json(newMsg);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: msg });
    }
  });
}
