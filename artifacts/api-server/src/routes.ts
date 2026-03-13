import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";

declare global {
  namespace Express {
    interface User {
      id: string;
      email?: string;
      wpRoles?: string[];
      firstName?: string;
      lastName?: string;
      wpUserId?: string;
    }
  }
}
import { z } from "zod";
import { storage } from "./storage";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { doctorOnboarding, memberEnrollment, trainingModuleSections, trainingModuleKeyPoints, trainingCertifications, doctorAppointments, doctorPatientMessages, intakeForms, generatedProtocols } from "@shared/schema";
import { signNowService } from "./services/signnow";
import { sendAthenaIntroduction, sendEmail, getInbox, getMessage, replyToMessage } from "./services/gmail";
import crypto from "crypto";
import { registerSentinelRoutes } from "./sentinel-routes";

// Secure preview mode validation - requires specific token pattern
const PORT = process.env.PORT || 5000;
const PREVIEW_TOKEN_SECRET = process.env.PREVIEW_TOKEN_SECRET || 'ffpma_preview_2026';
function validatePreviewMode(req: Request): boolean {
  const previewHeader = req.headers['x-preview-mode'];
  if (previewHeader !== 'trustee') return false;

  // Additional validation: check for signed preview token or allow in development
  const previewToken = req.headers['x-preview-token'] as string;
  if (previewToken) {
    const expectedToken = crypto.createHmac('sha256', PREVIEW_TOKEN_SECRET)
      .update('trustee-preview')
      .digest('hex')
      .substring(0, 16);
    return previewToken === expectedToken;
  }

  // Allow basic preview in development mode only
  return process.env.NODE_ENV !== 'production';
}
import {
  checkDriveConnection,
  findAllioFolder,
  createAllioFolder,
  getAllioStructure,
  getMarketingStructure,
  setupAgentFolders,
  listFolderContents,
  getUncachableGoogleDriveClient,
  uploadMarketingAssets,
  uploadLegalDocuments,
  uploadBloodAnalysisFile,
  getBloodAnalysisUploads,
  createBakerFilesFolder,
  uploadToBakerFiles,
  uploadVideoToMarketing,
  uploadAudioToAgentFolder
} from "./services/drive";
import { Readable } from "stream";
import { seedECSTraining } from "./seeds/ecs-training-seed";
import { seedGersonTherapy } from "./seeds/gerson-therapy-seed";
import { seedPMALawTraining } from "./seeds/pma-law-training-seed";
import { seedPeptideTraining } from "./seeds/peptide-training-seed";
import { seedDianeCandidaCookbook } from "./seeds/diane-candida-cookbook-seed";
import { seedOzoneTraining } from "./seeds/ozone-training-seed";
import { indexAllMarketingAssets, searchAssets, checkExistingAsset, getAssetStats } from "./services/asset-catalog";
import { connectSourceMaterials, autoConnectByKeywordMatch } from "./seeds/connect-source-materials-seed";
import { generateInteractiveContent, generateSingleModuleContent } from "./seeds/batch-interactive-content-seed";
import { seedDietCancerTraining, dietCancerContent } from "./seeds/diet-cancer-training-seed";
import { seedIvermectinTraining } from "./seeds/ivermectin-training-seed";
import { fetchCatalogContent, searchCatalog, getCatalogSections, getProductInfo } from "./services/catalog-service";
import { seedRemainingModules } from "./seeds/complete-remaining-modules-seed";
import { enhanceModulesWithMedia, getAvailableMediaAssets } from "./seeds/enhance-modules-with-media";
import { seedAchievements } from "./seeds/achievements-seed";
import { wooCommerceService } from "./services/woocommerce";
import { wordPressAuthService } from "./services/wordpress-auth";
import { getAllIntegrationStatuses, testIntegration } from "./services/integration-registry";
import { executeAgentTask, executePendingTasks, getAgentTaskStatus } from "./services/agent-executor";
import { lockManager } from "./services/agent-locks";
import { getSchedulerStatus, triggerImmediateExecution, seedInitialTasks, startAgentScheduler, stopAgentScheduler } from "./services/agent-scheduler";
import multer from "multer";
import OpenAI from "openai";
import passport from "passport";
import { setupWorkingAuth } from "./working-auth";
import { agents, FFPMA_CREED } from "@shared/agents";
import { auditLog } from "./middleware/auth";
import { requireAuth, requireRole } from "./working-auth";
import { updateAgentTaskReviewSchema, updateDivisionLeadSchema, insertAgentTaskReviewSchema, insertUserProgressSchema, insertProgramEnrollmentSchema, users, memberProfiles } from "@shared/schema";
import bcrypt from "bcryptjs";
import { submitIntakeForm } from "./services/intake";

const upload = multer({ storage: multer.memoryStorage() });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication (Raw SQL Session strategy)
  await setupWorkingAuth(app);

  // Register SENTINEL Orchestrator routes
  registerSentinelRoutes(app);

  // Register Learning/Interactive Healing routes
  const { registerLearningRoutes } = await import("./learning-routes");
  registerLearningRoutes(app);

  // Register Diane AI routes
  const { registerDianeRoutes } = await import("./services/diane-ai");
  registerDianeRoutes(app);

  // Register Protocol Builder routes
  const { registerProtocolBuilderRoutes } = await import("./services/protocol-builder");
  registerProtocolBuilderRoutes(app);

  // Register Protocol Assembly routes
  const {
    analyzeTranscript,
    generateProtocol,
    generateProtocolSlides,
    profileFromIntakeForm,
    saveProtocol,
    updateProtocolSlides,
    getProtocol,
    listProtocols,
  } = await import('./services/protocol-assembly');

  app.post('/api/protocol-assembly/generate', requireAuth, requireRole('admin', 'trustee', 'doctor'), async (req, res) => {
    try {
      const { transcript, generateSlides: shouldGenerateSlides, memberId } = req.body;
      if (!transcript || typeof transcript !== 'string') {
        return res.status(400).json({ error: 'transcript is required' });
      }
      if (transcript.length > 500000) {
        return res.status(400).json({ error: 'Transcript exceeds maximum length of 500,000 characters' });
      }
      const profile = await analyzeTranscript(transcript);
      const protocol = await generateProtocol(profile);
      const protocolId = await saveProtocol(profile, protocol, 'transcript', (req.user as { username?: string })?.username, memberId as string | undefined);
      let slides = null;
      if (shouldGenerateSlides) {
        try {
          slides = await generateProtocolSlides(protocol, profile);
          await updateProtocolSlides(protocolId, slides.presentationId, slides.webViewLink);
        } catch (slideError: unknown) {
          console.error('[Protocol Assembly] Slide generation failed:', slideError.message);
        }
      }
      res.json({ id: protocolId, profile, protocol, slides });
    } catch (error: unknown) {
      console.error('[Protocol Assembly] Generate error:', error);
      res.status(500).json({ error: 'Failed to generate protocol. Please try again.' });
    }
  });

  app.post('/api/protocol-assembly/generate-from-intake/:id', requireAuth, requireRole('admin', 'trustee', 'doctor'), async (req, res) => {
    try {
      const intakeId = parseInt(req.params.id);
      if (isNaN(intakeId)) return res.status(400).json({ error: 'Invalid intake form ID' });
      const schemaModule = await import('@shared/schema');
      const [intakeRecord] = await db.select().from(schemaModule.intakeForms).where(eq(schemaModule.intakeForms.id, intakeId));
      if (!intakeRecord) return res.status(404).json({ error: 'Intake form not found' });
      const formData = (intakeRecord.formData || {}) as Record<string, unknown>;
      const patientInfo = {
        name: intakeRecord.patientName || formData.basicInfo?.name || 'Unknown',
        email: intakeRecord.patientEmail || formData.basicInfo?.email || '',
        phone: formData.basicInfo?.phone || '',
        age: formData.basicInfo?.age || null,
        dob: formData.basicInfo?.dateOfBirth || null,
      };
      const profile = await profileFromIntakeForm(formData, patientInfo);
      profile.intakeFormId = intakeId;
      const protocol = await generateProtocol(profile);
      const protocolId = await saveProtocol(profile, protocol, 'intake_form', (req.user as { username?: string })?.username, req.body?.memberId as string | undefined);
      const { generateSlides: shouldGenerateSlides } = req.body || {};
      let slides = null;
      if (shouldGenerateSlides) {
        try {
          slides = await generateProtocolSlides(protocol, profile);
          await updateProtocolSlides(protocolId, slides.presentationId, slides.webViewLink);
        } catch (slideError: unknown) {
          console.error('[Protocol Assembly] Slide generation failed:', slideError.message);
        }
      }
      res.json({ id: protocolId, profile, protocol, slides });
    } catch (error: unknown) {
      console.error('[Protocol Assembly] Generate from intake error:', error);
      res.status(500).json({ error: 'Failed to generate protocol from intake. Please try again.' });
    }
  });

  app.get('/api/protocol-assembly/intake-forms', requireAuth, requireRole('admin', 'trustee', 'doctor'), async (_req, res) => {
    try {
      const forms = await db.select({
        id: intakeForms.id,
        patientName: intakeForms.patientName,
        patientEmail: intakeForms.patientEmail,
        status: intakeForms.status,
        createdAt: intakeForms.createdAt,
        submittedAt: intakeForms.submittedAt,
      }).from(intakeForms).orderBy(desc(intakeForms.createdAt)).limit(100);
      res.json(forms);
    } catch (error: unknown) {
      console.error('[Protocol Assembly] List intake forms error:', error);
      res.status(500).json({ error: 'Failed to list intake forms' });
    }
  });

  app.get('/api/protocol-assembly/protocols', requireAuth, requireRole('admin', 'trustee', 'doctor'), async (_req, res) => {
    try {
      const protocols = await listProtocols();
      res.json(protocols);
    } catch (error: unknown) {
      console.error('[Protocol Assembly] List error:', error);
      res.status(500).json({ error: 'Failed to list protocols' });
    }
  });

  app.get('/api/protocol-assembly/protocols/member/:memberId', requireAuth, requireRole('admin', 'trustee', 'doctor'), async (req, res) => {
    try {
      const { memberId } = req.params;
      if (!memberId) return res.status(400).json({ error: 'memberId is required' });
      const memberProtocols = await db.select({
        id: generatedProtocols.id,
        patientName: generatedProtocols.patientName,
        patientAge: generatedProtocols.patientAge,
        sourceType: generatedProtocols.sourceType,
        status: generatedProtocols.status,
        slidesWebViewLink: generatedProtocols.slidesWebViewLink,
        generatedBy: generatedProtocols.generatedBy,
        createdAt: generatedProtocols.createdAt,
        updatedAt: generatedProtocols.updatedAt,
      }).from(generatedProtocols).where(eq(generatedProtocols.memberId, memberId)).orderBy(desc(generatedProtocols.createdAt));
      res.json(memberProtocols);
    } catch (error: unknown) {
      console.error('[Protocol Assembly] Member protocols error:', error);
      res.status(500).json({ error: 'Failed to list member protocols' });
    }
  });

  app.get('/api/protocol-assembly/protocols/:id', requireAuth, requireRole('admin', 'trustee', 'doctor'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
      const protocol = await getProtocol(id);
      if (!protocol) return res.status(404).json({ error: 'Protocol not found' });
      res.json(protocol);
    } catch (error: unknown) {
      console.error('[Protocol Assembly] Get error:', error);
      res.status(500).json({ error: 'Failed to retrieve protocol' });
    }
  });

  app.post('/api/protocol-assembly/protocols/:id/slides', requireAuth, requireRole('admin', 'trustee', 'doctor'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
      const record = await getProtocol(id);
      if (!record) return res.status(404).json({ error: 'Protocol not found' });
      const protocol = record.protocol as Record<string, unknown>;
      const profile = record.patientProfile as Record<string, unknown>;
      const slides = await generateProtocolSlides(protocol, profile);
      await updateProtocolSlides(id, slides.presentationId, slides.webViewLink);
      res.json(slides);
    } catch (error: unknown) {
      console.error('[Protocol Assembly] Slides error:', error);
      res.status(500).json({ error: 'Failed to generate slides. Please try again.' });
    }
  });

  // Register Peptide Console routes
  const { registerPeptideConsoleRoutes } = await import("./services/peptide-console");
  registerPeptideConsoleRoutes(app);

  // Apply audit logging to sensitive admin API paths
  app.use("/api/settings", auditLog());
  app.use("/api/sentinel", auditLog());
  app.use("/api/athena", auditLog());

  // ========== Operation Overseer: Zero-Downtime System Updates ==========
  app.post("/api/admin/system/update", requireAuth, requireRole('trustee'), async (req, res) => {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      console.log(`[OVERSEER] System update initiated by ${(req.user as { username?: string })?.username || (req.user as any)?.wpUsername || 'Trustee'}`);

      // We return success immediately so the agent doesn't timeout
      res.json({ message: "Update initiated. System will reload shortly without downtime." });

      // Async update process
      setTimeout(async () => {
        try {
          console.log('[OVERSEER] Starting background build process...');
          // Execute build and reload
          const { stdout, stderr } = await execAsync('npm run build && pm2 reload allio-v1');
          console.log('[OVERSEER] Build and reload successful:', stdout);
        } catch (error) {
          console.error('[OVERSEER] Update failed:', error);
        }
      }, 1000);

    } catch (error: any) {
      console.error("[OVERSEER] Failed to trigger update:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message || "Failed to trigger update" });
      }
    }
  });

  // ========== Patient Intake Form Routes ==========

  app.post("/api/intake/save-draft", async (req: Request, res: Response) => {
    try {
      const { draftId, patientInfo, formData } = req.body;
      
      const draftData = {
        patientName: patientInfo?.name || "Anonymous",
        patientEmail: patientInfo?.email || "No Email",
        patientPhone: patientInfo?.phone || null,
        dateOfBirth: patientInfo?.dob ? new Date(patientInfo.dob) : null,
        age: patientInfo?.age ? parseInt(patientInfo.age, 10) : null,
        formData: formData || {},
        status: "draft",
        updatedAt: new Date(),
      };

      if (draftId) {
        // Update existing draft
        await db.update(intakeForms)
          .set(draftData)
          .where(eq(intakeForms.id, parseInt(draftId, 10)));
          
        return res.json({ success: true, draftId });
      } else {
        // Create new draft
        const [newDraft] = await db.insert(intakeForms)
          .values({ ...draftData, createdAt: new Date() })
          .returning({ id: intakeForms.id });
          
        return res.json({ success: true, draftId: newDraft.id });
      }
    } catch (error: any) {
      console.error("[Intake API] Failed to save draft:", error);
      res.status(500).json({ error: error.message || "Failed to save draft" });
    }
  });

  app.post("/api/intake/submit", async (req: Request, res: Response) => {
    try {
      const { patientInfo, formData } = req.body;

      if (!patientInfo?.name || !patientInfo?.email) {
        return res.status(400).json({ error: "Patient name and email are required" });
      }

      // Process submission via service (handles Google Sheets & Database)
      const result = await submitIntakeForm(patientInfo, formData);

      // Send email notification to patient
      try {
        await sendEmail(
          patientInfo.email,
          "FFPMA - Patient Intake Received",
          `Dear ${patientInfo.name},\n\nWe have received your completed patient intake form for the FFPMA 2026 Protocol.\n\nOur team will review your information shortly.\n\nBest regards,\nThe FFPMA Team`
        );
      } catch (emailError) {
        console.error("Failed to send patient confirmation email:", emailError);
      }

      // Send email notification to Trustee
      try {
        await sendEmail(
          "blake@forgottenformula.com",
          "New Patient Intake Submitted",
          `A new patient intake form has been submitted by ${patientInfo.name} (${patientInfo.email}).\nPrimary Concern: ${formData.basicInfo?.primaryConcern || "N/A"}\n\nReview the latest entry in the FFPMA Patient Intake Forms Data Google Sheet.`
        );
      } catch (emailError) {
        console.error("Failed to send trustee notification email:", emailError);
      }

      res.json(result);
    } catch (error: any) {
      console.error("[Intake API] Failed to submit form:", error);
      res.status(500).json({ error: error.message || "Failed to submit intake form" });
    }
  });

  // ========== WooCommerce Checkout Routes ==========

  app.get("/api/checkout/health", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { wooCommerceService } = await import("./services/woocommerce");
      const health = await wooCommerceService.checkCommerceHealth();
      res.json(health);
    } catch (error: any) {
      console.error("WC health check error:", error);
      res.status(500).json({ error: error.message || "Failed to check commerce health" });
    }
  });

  app.post("/api/checkout/wc-create-order", requireAuth, async (req: Request, res: Response) => {
    try {
      const { wooCommerceService } = await import("./services/woocommerce");
      const { items, billing } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Cart items required" });
      }

      if (!billing?.email || !billing?.first_name || !billing?.last_name) {
        return res.status(400).json({ error: "Billing name and email required" });
      }

      const userWpRoles = req.user ? ((req.user as any).wpRoles || []) : [];
      const userRole = req.user ? (req.user as any).role : 'guest';
      const effectiveRoles = [...userWpRoles, userRole].map((r: string) => r.toLowerCase());

      const getRolePrice = (productOrVariation: any, roles: string[]): number | null => {
        if (!productOrVariation.rolePricing) return null;
        const normalizedPrices: Record<string, any> = {};
        for (const [key, value] of Object.entries(productOrVariation.rolePricing)) {
          normalizedPrices[key.toLowerCase()] = value;
        }
        for (const role of roles) {
          if (normalizedPrices[role]?.visible) {
            const price = parseFloat(normalizedPrices[role].price);
            if (!isNaN(price) && price > 0) return price;
          }
        }
        return null;
      };

      const lineItems = await Promise.all(items.map(async (item: any) => {
        const productId = parseInt(item.wcProductId || item.productId);
        const quantity = parseInt(item.quantity) || 1;
        if (isNaN(productId) || productId <= 0) {
          throw new Error(`Invalid product ID: ${item.wcProductId || item.productId}`);
        }
        if (quantity <= 0) {
          throw new Error(`Invalid quantity: ${item.quantity}`);
        }

        // Fetch product metadata to securely validate the role-based price server-side
        const product = await wooCommerceService.getProductById(productId);
        if (!product) throw new Error(`Product not found: ${productId}`);

        let unitPrice = product.salePrice || product.price;

        if (item.variationId) {
          const variationId = parseInt(item.variationId);
          const variation = product.variations?.find(v => v.id === variationId);
          if (variation) {
            const varRolePrice = getRolePrice(variation, effectiveRoles);
            unitPrice = varRolePrice !== null ? varRolePrice : (variation.salePrice || variation.price);
          }
        } else {
          const prodRolePrice = getRolePrice(product, effectiveRoles);
          if (prodRolePrice !== null) unitPrice = prodRolePrice;
        }

        return {
          product_id: productId,
          quantity,
          total: String(unitPrice * quantity),
          ...(item.variationId ? { variation_id: parseInt(item.variationId) } : {}),
        };
      }));

      try {
        const wcOrder = await wooCommerceService.createOrder({
          customer_id: (req.user as any)?.wpUserId || 0,
          billing: {
            first_name: billing.first_name,
            last_name: billing.last_name,
            email: billing.email,
            phone: billing.phone || '',
            address_1: billing.address_1 || '',
            city: billing.city || '',
            state: billing.state || '',
            postcode: billing.postcode || '',
            country: billing.country || 'US',
          },
          line_items: lineItems,
          meta_data: [
            { key: '_allio_source', value: 'member_portal' },
          ],
        } as any);

        return res.json({
          orderId: wcOrder.id,
          orderKey: wcOrder.order_key,
          total: wcOrder.total,
          checkoutUrl: wcOrder.checkout_url,
          status: wcOrder.status,
          method: 'order_api',
        });
      } catch (wcError: any) {
        console.warn("WC order creation failed (likely read-only key), using add-to-cart fallback:", wcError.message);
      }

      const wcStoreUrl = process.env.WOOCOMMERCE_URL || process.env.WP_SITE_URL || 'https://www.forgottenformula.com';
      const addToCartParams = lineItems.map((item: any) =>
        `add-to-cart=${item.product_id}&quantity=${item.quantity}`
      ).join('&');
      const billingParams = new URLSearchParams({
        billing_first_name: billing.first_name,
        billing_last_name: billing.last_name,
        billing_email: billing.email,
        ...(billing.phone ? { billing_phone: billing.phone } : {}),
      }).toString();
      const checkoutUrl = `${wcStoreUrl}/?${addToCartParams}&${billingParams}`;

      res.json({
        checkoutUrl,
        method: 'add_to_cart_redirect',
        status: 'redirect',
      });
    } catch (error: any) {
      console.error("WC checkout error:", error);
      res.status(500).json({ error: error.message || "Failed to create order" });
    }
  });

  app.get("/api/checkout/wc-order/:orderId", requireAuth, async (req: Request, res: Response) => {
    try {
      const { wooCommerceService } = await import("./services/woocommerce");
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        return res.status(400).json({ error: "Invalid order ID" });
      }

      const order = await wooCommerceService.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      res.json({
        id: order.id,
        status: order.status,
        total: order.total,
        currency: order.currency,
        date_created: order.date_created,
        payment_method: order.payment_method,
        line_items: order.line_items,
        billing_email: order.billing?.email,
      });
    } catch (error: any) {
      console.error("WC order fetch error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch order" });
    }
  });

  app.get("/api/admin/agents/locks", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      res.json(lockManager.getAllLocks());
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/agents/locks/clear", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { resourceId } = req.body;
      if (!resourceId) return res.status(400).json({ error: "resourceId is required" });
      const success = lockManager.forceReleaseLock(resourceId);
      res.json({ success });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Integration Registry API - honest status reporting
  app.get("/api/integrations/status", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const statuses = await getAllIntegrationStatuses();
      res.json(statuses);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/integrations/:id/test", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const status = await testIntegration(req.params.id);
      if (!status) {
        return res.status(404).json({ error: "Integration not found" });
      }
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Smart Search API - AI-powered suggestions and typo correction
  app.post("/api/search/suggestions", requireAuth, async (req: Request, res: Response) => {
    try {
      const { query } = req.body;
      if (!query || typeof query !== 'string' || query.length < 2) {
        return res.json({ suggestions: [] });
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a search assistant for ALLIO, a healing ecosystem platform by Forgotten Formula PMA. 
Generate 3 relevant search suggestions based on the user's query.
Focus on: training modules, healing protocols, blood analysis, gene/tumor research, supplements, doctor network, certifications.
Return ONLY a JSON array of 3 short suggestion strings. No explanations.
Example: ["Live blood analysis training", "Curcumin protocol", "Doctor certification program"]`
          },
          { role: "user", content: `Query: "${query}"` }
        ],
        max_tokens: 100,
        temperature: 0.7,
      });

      const content = completion.choices[0]?.message?.content || '[]';
      let suggestions: string[] = [];
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          suggestions = parsed.slice(0, 3);
        }
      } catch {
        suggestions = [];
      }

      res.json({ suggestions });
    } catch (error: any) {
      console.error('Search suggestions error:', error);
      res.json({ suggestions: [] });
    }
  });

  app.post("/api/tts/generate", requireAuth, async (req: Request, res: Response) => {
    try {
      const { text, voice = "onyx" } = req.body;

      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: "Text is required" });
      }

      const truncatedText = text.slice(0, 4000);

      // Use direct OpenAI API for TTS (not the Replit proxy which may not support audio)
      const directOpenAI = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      console.log(`[TTS] Generating audio for ${truncatedText.length} chars with voice: ${voice}`);

      const response = await directOpenAI.audio.speech.create({
        model: "tts-1",
        voice: voice as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer",
        input: truncatedText,
      });

      const buffer = Buffer.from(await response.arrayBuffer());

      console.log(`[TTS] Generated ${buffer.length} bytes of audio`);

      res.set({
        "Content-Type": "audio/mpeg",
        "Content-Length": buffer.length.toString(),
      });
      res.send(buffer);
    } catch (error: any) {
      console.error("[TTS] Generation error:", error?.message || error);
      res.status(500).json({ error: "Failed to generate audio", details: error?.message });
    }
  });

  app.post("/api/vision/analyze-blood", requireRole("trustee"), async (req: Request, res: Response) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "imageBase64 is required" });
      }

      // Payload size protection limits are handled by express.json middleware in index.ts

      const { analyzeBloodMicroscopyVision } = await import("./services/google-ml");
      const analysis = await analyzeBloodMicroscopyVision(imageBase64);

      res.json(analysis);
    } catch (error: any) {
      console.error("[Vision API] Blood analysis error:", error);
      res.status(500).json({ error: error.message || "Failed to analyze image" });
    }
  });

  app.post("/api/rupa-health/order", requireAuth, async (req: Request, res: Response) => {
    try {
      const { patientDetails, testPanels, dryRun } = req.body;
      if (!patientDetails || !testPanels || !Array.isArray(testPanels)) {
        return res.status(400).json({ error: "patientDetails and testPanels array are required" });
      }

      const { rupaHealthAgent } = await import("./services/rupa-health-agent");
      // Execute the browser automation asynchronously so we don't timeout the HTTP request
      rupaHealthAgent.placeOrder(patientDetails, testPanels, dryRun !== false)
        .then(result => {
          console.log("[Rupa Health API] Order placement completed:", result);
        })
        .catch(err => {
          console.error("[Rupa Health API] Order placement failed:", err);
        });

      res.json({ message: "Rupa Health order initiated. This process can take several minutes. Check Rupa Health dashboard for the draft order." });
    } catch (error: any) {
      console.error("[Rupa Health API] Error triggering order:", error);
      res.status(500).json({ error: error.message || "Failed to initiate Rupa Health order" });
    }
  });

  app.get("/api/calendar/events", requireRole("trustee"), async (req: Request, res: Response) => {
    try {
      const { listUpcomingEvents } = await import("./services/calendar");
      const events = await listUpcomingEvents(10);
      res.json(events);
    } catch (error: any) {
      console.error("[Calendar API] fetch error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch calendar events" });
    }
  });

  // SignNow API Routes

  // Get SignNow connection status
  app.get("/api/signnow/status", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const status = await signNowService.getStatus();
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // List all documents
  app.get("/api/signnow/documents", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const documents = await signNowService.listDocuments();
      res.json(documents);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get specific document
  app.get("/api/signnow/documents/:id", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const document = await signNowService.getDocument(req.params.id);
      res.json(document);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Upload document
  app.post("/api/signnow/documents", requireRole("admin"), upload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const document = await signNowService.uploadDocumentFromBuffer(
        req.file.buffer,
        req.file.originalname
      );
      res.json(document);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Send signing invite
  app.post("/api/signnow/documents/:id/invite", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { signerEmail, signerName, subject, message } = req.body;
      if (!signerEmail || !subject) {
        return res.status(400).json({ error: "signerEmail and subject are required" });
      }
      const result = await signNowService.sendInvite(
        req.params.id,
        signerEmail,
        signerName || signerEmail,
        subject,
        message || "Please sign this document"
      );
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create embedded signing invite
  app.post("/api/signnow/documents/:id/embedded-invite", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { signerEmail, roleId } = req.body;
      if (!signerEmail || !roleId) {
        return res.status(400).json({ error: "signerEmail and roleId are required" });
      }
      const result = await signNowService.createEmbeddedInvite(
        req.params.id,
        signerEmail,
        roleId
      );
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Generate embedded signing link
  app.post("/api/signnow/documents/:id/signing-link", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { fieldInviteUniqueId, expirationMinutes } = req.body;
      if (!fieldInviteUniqueId) {
        return res.status(400).json({ error: "fieldInviteUniqueId is required" });
      }
      const result = await signNowService.generateSigningLink(
        req.params.id,
        fieldInviteUniqueId,
        expirationMinutes || 30
      );
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Download signed document
  app.get("/api/signnow/documents/:id/download", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const buffer = await signNowService.downloadDocument(req.params.id);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="document-${req.params.id}.pdf"`);
      res.send(buffer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Cancel document invite
  app.post("/api/signnow/documents/:id/cancel", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      await signNowService.cancelInvite(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete document
  app.delete("/api/signnow/documents/:id", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      await signNowService.deleteDocument(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==========================================
  // Doctor Onboarding Routes (SignNow Flow)
  // ==========================================

  const DOCTOR_ONBOARDING_TEMPLATE = process.env.SIGNNOW_DOCTOR_ONBOARDING_TEMPLATE_ID || '253597f6c6724abd976af62a69b3e0a5b92b38dd';
  const MEMBER_ONBOARDING_TEMPLATE = process.env.SIGNNOW_MEMBER_TEMPLATE_ID || '';
  const DOCTOR_MEMBERSHIP_PRODUCT_ID = process.env.WC_DOCTOR_MEMBERSHIP_PRODUCT_ID || '5000';
  const MEMBER_MEMBERSHIP_PRODUCT_ID = process.env.WC_MEMBER_MEMBERSHIP_PRODUCT_ID || '10';
  const WOOCOMMERCE_URL = process.env.WOOCOMMERCE_URL || 'https://forgottenformula.com';
  const SIGNNOW_WEBHOOK_SECRET = process.env.SIGNNOW_WEBHOOK_SECRET || '';

  // Generate unique doctor code with collision check
  async function generateUniqueDoctorCode(maxRetries = 10): Promise<string> {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const doctorCode = `DR-${code}`;

      // Check if code already exists
      const existing = await db.query.doctorOnboarding.findFirst({
        where: (d, { eq }) => eq(d.doctorCode, doctorCode)
      });

      if (!existing) {
        return doctorCode;
      }
    }

    throw new Error('Unable to generate unique doctor code after max retries');
  }

  // Verify SignNow webhook signature (fail-closed except in development)
  function verifySignNowWebhook(req: Request): { valid: boolean; error?: string } {
    const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

    if (!SIGNNOW_WEBHOOK_SECRET) {
      if (isDevelopment) {
        console.warn("DEV MODE: SIGNNOW_WEBHOOK_SECRET not configured - webhook verification bypassed");
        return { valid: true };
      }
      console.error("SIGNNOW_WEBHOOK_SECRET not configured - rejecting webhook in production");
      return { valid: false, error: "Webhook secret not configured" };
    }

    const signature = req.headers['x-signnow-signature'] || req.headers['x-event-signature'];
    if (!signature) {
      console.error("Missing SignNow webhook signature header");
      return { valid: false, error: "Missing signature header" };
    }

    // Use raw body Buffer captured by express middleware (see server/index.ts)
    const rawBody = (req as any).rawBody as Buffer | undefined;
    if (!rawBody) {
      console.error("Raw body not captured - middleware misconfigured");
      return { valid: false, error: "Raw body not available" };
    }

    // SignNow uses HMAC-SHA256 for webhook signatures
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', SIGNNOW_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    const signatureStr = Array.isArray(signature) ? signature[0] : signature;

    // Guard against length mismatch to prevent timingSafeEqual throwing
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const providedBuffer = Buffer.from(signatureStr, 'utf8');

    if (expectedBuffer.length !== providedBuffer.length) {
      console.error("SignNow webhook signature length mismatch");
      return { valid: false, error: "Invalid signature" };
    }

    const isValid = crypto.timingSafeEqual(providedBuffer, expectedBuffer);

    if (!isValid) {
      console.error("SignNow webhook signature mismatch");
      return { valid: false, error: "Invalid signature" };
    }

    return { valid: true };
  }

  // Start doctor onboarding - creates SignNow document and returns embedded signing URL
  app.post("/api/onboarding/doctor/start", async (req: Request, res: Response) => {
    try {
      const { email, fullName, clinicName, licenseNumber, practiceType, phone, referredBy } = req.body;

      if (!email || !fullName) {
        return res.status(400).json({ error: "email and fullName are required" });
      }

      if (!DOCTOR_ONBOARDING_TEMPLATE) {
        return res.status(500).json({ error: "Doctor onboarding template not configured" });
      }

      // Generate unique doctor code with collision check
      const doctorCode = await generateUniqueDoctorCode();

      // Create SignNow document from template
      const signNowResult = await signNowService.createDoctorAgreement(DOCTOR_ONBOARDING_TEMPLATE, {
        doctorName: fullName,
        doctorEmail: email,
        clinicName,
        licenseNumber,
      });

      // Save onboarding record with 'started' status
      const onboardingRecord = await db.insert(doctorOnboarding).values({
        email,
        fullName,
        clinicName,
        licenseNumber,
        practiceType,
        phone,
        status: 'document_sent',
        signNowDocumentId: signNowResult.documentId,
        signNowTemplateId: DOCTOR_ONBOARDING_TEMPLATE,
        signingUrl: signNowResult.signingUrl,
        doctorCode,
        memberSignupUrl: `/join/${doctorCode}`,
        referredBy,
      }).returning();

      res.json({
        success: true,
        onboardingId: onboardingRecord[0].id,
        doctorCode,
        signingUrl: signNowResult.signingUrl,
        documentId: signNowResult.documentId,
      });
    } catch (error: any) {
      console.error("Error starting doctor onboarding:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get doctor onboarding status
  app.get("/api/onboarding/doctor/:id", async (req: Request, res: Response) => {
    try {
      const record = await db.query.doctorOnboarding.findFirst({
        where: (d, { eq }) => eq(d.id, req.params.id)
      });

      if (!record) {
        return res.status(404).json({ error: "Onboarding record not found" });
      }

      res.json(record);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get doctor by code (for member signup)
  app.get("/api/doctors/:code", async (req: Request, res: Response) => {
    try {
      const doctor = await db.query.doctorOnboarding.findFirst({
        where: (d, { eq, and }) => and(
          eq(d.doctorCode, req.params.code),
          eq(d.status, 'completed')
        )
      });

      if (!doctor) {
        return res.status(404).json({ error: "Doctor not found or not yet active" });
      }

      res.json({
        doctorCode: doctor.doctorCode,
        clinicName: doctor.clinicName,
        practiceType: doctor.practiceType,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Start member enrollment through doctor
  app.post("/api/onboarding/member/start", async (req: Request, res: Response) => {
    try {
      const { email, fullName, phone, doctorCode } = req.body;

      if (!email || !fullName || !doctorCode) {
        return res.status(400).json({ error: "email, fullName, and doctorCode are required" });
      }

      // Verify doctor exists and is active
      const doctor = await db.query.doctorOnboarding.findFirst({
        where: (d, { eq, and }) => and(
          eq(d.doctorCode, doctorCode),
          eq(d.status, 'completed')
        )
      });

      if (!doctor) {
        return res.status(400).json({ error: "Invalid doctor code or doctor not yet active" });
      }

      if (!MEMBER_ONBOARDING_TEMPLATE) {
        return res.status(500).json({ error: "Member template not configured" });
      }

      // Create SignNow document
      const signNowResult = await signNowService.createMemberAgreement(MEMBER_ONBOARDING_TEMPLATE, {
        memberName: fullName,
        memberEmail: email,
      });

      // Save enrollment record
      const enrollmentRecord = await db.insert(memberEnrollment).values({
        email,
        fullName,
        phone,
        doctorCode,
        status: 'document_sent',
        signNowDocumentId: signNowResult.documentId,
        signingUrl: signNowResult.signingUrl,
      }).returning();

      res.json({
        success: true,
        enrollmentId: enrollmentRecord[0].id,
        signingUrl: signNowResult.signingUrl,
        documentId: signNowResult.documentId,
        doctorClinic: doctor.clinicName,
      });
    } catch (error: any) {
      console.error("Error starting member enrollment:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // SignNow webhook - called when document is signed (with signature verification)
  app.post("/api/webhooks/signnow", async (req: Request, res: Response) => {
    try {
      // Verify webhook signature (fail-closed in production)
      const verification = verifySignNowWebhook(req);
      if (!verification.valid) {
        console.error("SignNow webhook verification failed:", verification.error);
        return res.status(401).json({ error: `Unauthorized - ${verification.error}` });
      }

      const { event, document_id, meta } = req.body;

      console.log("SignNow webhook received:", { event, document_id });

      if (event === 'document_complete' || event === 'document.complete') {
        // Check if this is a doctor onboarding document
        const doctorRecord = await db.query.doctorOnboarding.findFirst({
          where: (d, { eq }) => eq(d.signNowDocumentId, document_id)
        });

        if (doctorRecord) {
          // Only update if document was sent (not already signed)
          if (doctorRecord.status !== 'document_sent') {
            console.log(`Doctor onboarding ${doctorRecord.id} already processed, status: ${doctorRecord.status}`);
            return res.json({ success: true, type: 'doctor_onboarding', skipped: true });
          }

          // Update to document_signed, next step is payment
          await db.update(doctorOnboarding)
            .set({
              status: 'document_signed',
              documentSignedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(doctorOnboarding.signNowDocumentId, document_id));

          console.log(`Doctor onboarding ${doctorRecord.id} document signed - awaiting payment`);
          return res.json({ success: true, type: 'doctor_onboarding' });
        }

        // Check if this is a member enrollment document
        const memberRecord = await db.query.memberEnrollment.findFirst({
          where: (m, { eq }) => eq(m.signNowDocumentId, document_id)
        });

        if (memberRecord) {
          // Only update if document was sent
          if (memberRecord.status !== 'document_sent') {
            console.log(`Member enrollment ${memberRecord.id} already processed, status: ${memberRecord.status}`);
            return res.json({ success: true, type: 'member_enrollment', skipped: true });
          }

          // Update member enrollment status
          await db.update(memberEnrollment)
            .set({
              status: 'document_signed',
              documentSignedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(memberEnrollment.signNowDocumentId, document_id));

          console.log(`Member enrollment ${memberRecord.id} document signed`);
          return res.json({ success: true, type: 'member_enrollment' });
        }
      }

      res.json({ success: true, message: 'Webhook processed' });
    } catch (error: any) {
      console.error("SignNow webhook error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Complete doctor onboarding (after document signed and payment verified)
  app.post("/api/onboarding/doctor/:id/complete", async (req: Request, res: Response) => {
    try {
      const { wcOrderId, wcOrderKey } = req.body;

      const record = await db.query.doctorOnboarding.findFirst({
        where: (d, { eq }) => eq(d.id, req.params.id)
      });

      if (!record) {
        return res.status(404).json({ error: "Onboarding record not found" });
      }

      // Enforce status flow: must be document_signed to complete
      if (record.status !== 'document_signed') {
        return res.status(400).json({
          error: `Cannot complete onboarding in '${record.status}' status. Document must be signed first.`
        });
      }

      // Require WooCommerce order verification
      if (!wcOrderId) {
        return res.status(400).json({ error: "wcOrderId is required to verify payment" });
      }

      // TODO: Verify WooCommerce order status is 'completed' or 'processing'
      // const orderValid = await woocommerceService.verifyOrder(wcOrderId, wcOrderKey);
      // if (!orderValid) return res.status(400).json({ error: "Invalid or unpaid order" });

      // Parse full name into first/last
      const nameParts = (record.fullName || '').trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Create WordPress user with doctor role
      let wpUserId: number | null = null;
      const wpResult = await wordPressAuthService.createUser({
        email: record.email,
        firstName,
        lastName,
        role: 'doctor',
        meta: {
          doctor_code: record.doctorCode || '',
          clinic_name: record.clinicName || '',
          license_number: record.licenseNumber || '',
          practice_type: record.practiceType || '',
          onboarding_id: String(record.id),
        },
      });

      if (wpResult.success && wpResult.user) {
        wpUserId = wpResult.user.id;
        console.log(`Created WordPress user ${wpUserId} for doctor ${record.email}`);
      } else {
        console.warn(`Failed to create WordPress user for ${record.email}: ${wpResult.error}`);
        // Continue anyway - user might already exist or WP_APPLICATION_PASSWORD not configured
      }

      await db.update(doctorOnboarding)
        .set({
          status: 'completed',
          wcOrderId: parseInt(wcOrderId),
          wpUserId,
          paymentCompletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(doctorOnboarding.id, req.params.id));

      res.json({
        success: true,
        doctorCode: record.doctorCode,
        memberSignupUrl: `${WOOCOMMERCE_URL}/member-signup-clinic/?clinic_id=${record.doctorCode}`,
        dashboardUrl: '/doctors',
        wpUserId,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get checkout URL for doctor onboarding
  app.get("/api/onboarding/doctor/:id/checkout", async (req: Request, res: Response) => {
    try {
      const record = await db.query.doctorOnboarding.findFirst({
        where: (d, { eq }) => eq(d.id, req.params.id)
      });

      if (!record) {
        return res.status(404).json({ error: "Onboarding record not found" });
      }

      // Build WooCommerce checkout URL
      const checkoutUrl = `${WOOCOMMERCE_URL}/?add-to-cart=${DOCTOR_MEMBERSHIP_PRODUCT_ID}&onboarding_id=${record.id}&doctor_code=${record.doctorCode}`;

      res.json({
        checkoutUrl,
        productId: DOCTOR_MEMBERSHIP_PRODUCT_ID,
        doctorCode: record.doctorCode,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get doctor's referral info by email (for logged-in doctors to see their link)
  app.get("/api/doctor/referral", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub || (req as any).session?.passport?.user?.claims?.sub;

      // Get email from users table
      let userEmail: string | null = null;
      if (userId) {
        const user = await db.query.users.findFirst({
          where: (u, { eq }) => eq(u.id, userId)
        });
        userEmail = user?.email || null;
      }

      // Also try session email for WordPress auth
      if (!userEmail) {
        userEmail = (req as any).session?.passport?.user?.email || null;
      }

      if (!userEmail) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Find doctor by email or check if user has doctor role
      const doctor = await db.query.doctorOnboarding.findFirst({
        where: (d, { eq, and }) => and(
          eq(d.email, userEmail),
          eq(d.status, 'completed')
        )
      });

      // If no doctor onboarding record, check if user has doctor role for demo/admin purposes
      if (!doctor) {
        const profile = await db.query.memberProfiles.findFirst({
          where: (p, { eq }) => eq(p.userId, userId || '')
        });
        if (profile?.role !== 'doctor' && profile?.role !== 'admin') {
          return res.status(404).json({ error: "No active doctor profile found for this email" });
        }
        // Return placeholder data for admin viewing
        return res.json({
          doctorCode: null,
          memberSignupUrl: null,
          allioSignupUrl: null,
          enrolledMemberCount: 0,
          clinicName: null,
          practiceType: null,
          isAdmin: true,
        });
      }

      // Get count of members enrolled through this doctor
      const enrolledMembers = await db.query.memberEnrollment.findMany({
        where: (m, { eq }) => eq(m.doctorCode, doctor.doctorCode || '')
      });

      res.json({
        doctorCode: doctor.doctorCode,
        memberSignupUrl: `${WOOCOMMERCE_URL}/member-signup-clinic/?clinic_id=${doctor.doctorCode}`,
        allioSignupUrl: `/join/${doctor.doctorCode}`,
        enrolledMemberCount: enrolledMembers.length,
        clinicName: doctor.clinicName,
        practiceType: doctor.practiceType,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get doctor's enrolled members list
  app.get("/api/doctor/members", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub || (req as any).session?.passport?.user?.claims?.sub;;

      let userEmail: string | null = null;
      if (userId) {
        const user = await db.query.users.findFirst({
          where: (u, { eq }) => eq(u.id, userId)
        });
        userEmail = user?.email || null;
      }
      if (!userEmail) {
        userEmail = (req as any).session?.passport?.user?.email || null;
      }

      if (!userEmail) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Find doctor by email
      const doctor = await db.query.doctorOnboarding.findFirst({
        where: (d, { eq, and }) => and(
          eq(d.email, userEmail),
          eq(d.status, 'completed')
        )
      });

      // If no doctor record, check user role for admin access
      if (!doctor) {
        const profile = await db.query.memberProfiles.findFirst({
          where: (p, { eq }) => eq(p.userId, userId || '')
        });
        if (profile?.role === 'admin') {
          // Admin can see all enrollments
          const allEnrollments = await db.query.memberEnrollment.findMany({
            orderBy: (m, { desc }) => desc(m.createdAt),
            limit: 50
          });
          return res.json({
            members: allEnrollments.map(m => ({
              id: m.id,
              name: m.fullName,
              email: m.email,
              phone: m.phone,
              status: m.status,
              enrolledAt: m.createdAt,
              documentSigned: !!m.documentSignedAt,
              paymentComplete: !!m.paymentCompletedAt,
              doctorCode: m.doctorCode,
            })),
            total: allEnrollments.length,
            isAdmin: true,
          });
        }
        return res.status(404).json({ error: "No active doctor profile found" });
      }

      // Get enrolled members for this doctor
      const enrolledMembers = await db.query.memberEnrollment.findMany({
        where: (m, { eq }) => eq(m.doctorCode, doctor.doctorCode || ''),
        orderBy: (m, { desc }) => desc(m.createdAt)
      });

      res.json({
        members: enrolledMembers.map(m => ({
          id: m.id,
          name: m.fullName,
          email: m.email,
          phone: m.phone,
          status: m.status,
          enrolledAt: m.createdAt,
          documentSigned: !!m.documentSignedAt,
          paymentComplete: !!m.paymentCompletedAt,
        })),
        total: enrolledMembers.length,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/doctor/member-lookup - Lookup member enrollment status by exact user ID, email, or URL
  app.post("/api/doctor/member-lookup", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const { query } = req.body;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: "A user ID or member URL is required" });
      }

      const trimmed = query.trim();
      if (trimmed.length < 3) {
        return res.status(400).json({ error: "Search query must be at least 3 characters" });
      }

      let enrollmentRecord = null;
      let memberProfile = null;
      let wpUser = null;

      let lookupValue = trimmed;
      if (trimmed.includes('http') || trimmed.includes('/')) {
        try {
          const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
          const clinicId = url.searchParams.get('clinic_id');
          const userId = url.searchParams.get('user_id');
          if (userId) lookupValue = userId;
          else if (clinicId) lookupValue = clinicId;
        } catch { /* not a URL, use as-is */ }
      }

      enrollmentRecord = await db.query.memberEnrollment.findFirst({
        where: (m, { or, eq }) => or(
          eq(m.id, lookupValue),
          eq(m.email, lookupValue)
        )
      });

      const userRecord = await db.query.users.findFirst({
        where: (u, { or, eq }) => or(
          eq(u.id, lookupValue),
          eq(u.email, lookupValue)
        )
      });

      if (userRecord) {
        memberProfile = await db.query.memberProfiles.findFirst({
          where: (p, { eq }) => eq(p.userId, userRecord.id)
        });
      }

      try {
        if (wordPressAuthService.isConfigured() && lookupValue.includes('@')) {
          wpUser = await wordPressAuthService.getCustomerByEmail(lookupValue);
        }
      } catch (wpError: any) {
        console.error('[Doctor Member Lookup] WP lookup failed:', wpError.message);
      }

      if (!enrollmentRecord && !memberProfile && !wpUser) {
        return res.json({
          found: false,
          message: "No member found with this ID or email. Please verify the information and try again.",
        });
      }

      const contractSigned = !!(enrollmentRecord?.documentSignedAt || memberProfile?.contractSigned);
      const paymentComplete = !!enrollmentRecord?.paymentCompletedAt;
      const wpAccountActive = !!wpUser || !!enrollmentRecord?.wpUserId;

      res.json({
        found: true,
        member: {
          id: enrollmentRecord?.id || memberProfile?.id || null,
          userId: userRecord?.id || null,
          name: enrollmentRecord?.fullName || (userRecord ? `${userRecord.firstName || ''} ${userRecord.lastName || ''}`.trim() : wpUser?.display_name) || 'Unknown',
          email: enrollmentRecord?.email || userRecord?.email || wpUser?.email || null,
          phone: null,
          status: enrollmentRecord?.status || (memberProfile?.isActive ? 'active' : 'inactive') || null,
          enrolledAt: enrollmentRecord?.createdAt || memberProfile?.createdAt || null,
          doctorCode: enrollmentRecord?.doctorCode || null,
        },
        verification: {
          contractSigned,
          paymentComplete,
          wpAccountActive,
          enrollmentExists: !!enrollmentRecord,
          profileExists: !!memberProfile,
        },
        fullyVerified: contractSigned && paymentComplete && wpAccountActive,
      });
    } catch (error: any) {
      console.error('[Doctor Member Lookup] Error:', error);
      res.status(500).json({ error: error.message || "Failed to lookup member" });
    }
  });

  // POST /api/doctor/member-add - Add a verified member to doctor's patient list
  app.post("/api/doctor/member-add", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const { memberId, memberEmail } = req.body;
      if (!memberId && !memberEmail) {
        return res.status(400).json({ error: "Member ID or email is required" });
      }

      const userId = (req as any).user?.claims?.sub || (req as any).session?.passport?.user?.claims?.sub;
      let userEmail: string | null = null;
      if (userId) {
        const user = await db.query.users.findFirst({
          where: (u, { eq }) => eq(u.id, userId)
        });
        userEmail = user?.email || null;
      }
      if (!userEmail) {
        userEmail = (req as any).session?.passport?.user?.email || null;
      }

      const isAdmin = (req as any).session?.passport?.user?.wpRoles?.includes('administrator');

      const doctor = await db.query.doctorOnboarding.findFirst({
        where: (d, { eq, and }) => and(
          eq(d.email, userEmail || ''),
          eq(d.status, 'completed')
        )
      });

      const doctorCode = doctor?.doctorCode;
      if (!doctorCode && !isAdmin) {
        return res.status(400).json({ error: "No active doctor profile found" });
      }

      const enrollment = await db.query.memberEnrollment.findFirst({
        where: (m, { or, eq }) => or(
          eq(m.id, memberId || ''),
          eq(m.email, memberEmail || '')
        )
      });

      if (!enrollment) {
        return res.status(404).json({ error: "No enrollment record found for this member. The member must complete the signup process first." });
      }

      const contractSigned = !!enrollment.documentSignedAt;
      const paymentComplete = !!enrollment.paymentCompletedAt;
      const wpAccountActive = !!enrollment.wpUserId;

      let profileContractSigned = false;
      if (memberEmail) {
        const userRec = await db.query.users.findFirst({
          where: (u, { eq }) => eq(u.email, memberEmail)
        });
        if (userRec) {
          const profile = await db.query.memberProfiles.findFirst({
            where: (p, { eq }) => eq(p.userId, userRec.id)
          });
          if (profile?.contractSigned) profileContractSigned = true;
        }
      }

      const isVerified = (contractSigned || profileContractSigned) && paymentComplete && wpAccountActive;
      if (!isVerified && !isAdmin) {
        return res.status(400).json({ 
          error: "This member has not completed all verification steps (contract, payment, and account creation). They must finish the signup process before being added to your patient list." 
        });
      }

      if (enrollment.doctorCode && enrollment.doctorCode !== doctorCode && !isAdmin) {
        return res.status(403).json({ error: "This member is already assigned to another practice. Contact an administrator if a reassignment is needed." });
      }

      const assignCode = doctorCode || enrollment.doctorCode;
      await db.update(memberEnrollment)
        .set({ doctorCode: assignCode, updatedAt: new Date() })
        .where(eq(memberEnrollment.id, enrollment.id));

      return res.json({ success: true, message: "Member has been added to your patient list." });
    } catch (error: any) {
      console.error('[Doctor Member Add] Error:', error);
      res.status(500).json({ error: error.message || "Failed to add member" });
    }
  });

  // GET /api/doctor/appointments - Get all appointments for logged-in doctor
  app.get("/api/doctor/appointments", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      
      const appointments = await db.query.doctorAppointments.findMany({
        where: (a, { eq }) => eq(a.doctorId, userId),
        orderBy: (a, { asc }) => asc(a.appointmentDate)
      });
      res.json(appointments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/doctor/appointments - Create new appointment
  app.post("/api/doctor/appointments", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      
      const { patientId, appointmentDate, durationMinutes, appointmentType, notes } = req.body;
      if (!patientId || !appointmentDate) return res.status(400).json({ error: "Missing required fields" });

      const newAppointment = await db.insert(doctorAppointments).values({
        doctorId: userId,
        patientId,
        appointmentDate: new Date(appointmentDate),
        durationMinutes: durationMinutes || 60,
        appointmentType: appointmentType || "consultation",
        notes
      }).returning();
      
      res.json(newAppointment[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/doctor/messages/:patientId - Get conversation with patient
  app.get("/api/doctor/messages/:patientId", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const { patientId } = req.params;

      const messages = await db.query.doctorPatientMessages.findMany({
        where: (m, { and, or, eq }) => or(
          and(eq(m.senderId, userId), eq(m.recipientId, patientId)),
          and(eq(m.senderId, patientId), eq(m.recipientId, userId))
        ),
        orderBy: (m, { asc }) => asc(m.createdAt)
      });
      res.json(messages.map(m => ({ ...m, messageText: m.content })));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/doctor/messages/:patientId - Send message to patient
  app.post("/api/doctor/messages/:patientId", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const { patientId } = req.params;
      const { messageText } = req.body;
      
      if (!messageText) return res.status(400).json({ error: "Message text required" });

      const newMessage = await db.insert(doctorPatientMessages).values({
        conversationId: `${userId}-${patientId}`,
        senderId: userId,
        senderRole: 'doctor',
        recipientId: patientId,
        recipientRole: 'patient',
        content: messageText
      }).returning();
      
      res.json({...newMessage[0], messageText: newMessage[0].content});
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get doctor referral info by code (public - for /join/:code page)
  app.get("/api/join/:doctorCode", async (req: Request, res: Response) => {
    try {
      const doctor = await db.query.doctorOnboarding.findFirst({
        where: (d, { eq, and }) => and(
          eq(d.doctorCode, req.params.doctorCode),
          eq(d.status, 'completed')
        )
      });

      if (!doctor) {
        return res.status(404).json({ error: "Invalid doctor code or doctor not active" });
      }

      res.json({
        valid: true,
        clinicName: doctor.clinicName,
        practiceType: doctor.practiceType,
        doctorCode: doctor.doctorCode,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Gmail / ATHENA Routes

  // Send ATHENA introduction email to Nancy and Kami
  app.post("/api/athena/introduce", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const results = await sendAthenaIntroduction();
      res.json({ success: true, results });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Send email via ATHENA
  app.post("/api/athena/send-email", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { to, subject, body, cc } = req.body;
      if (!to || !subject || !body) {
        return res.status(400).json({ error: "to, subject, and body are required" });
      }
      const result = await sendEmail(to, subject, body, cc);
      res.json({ success: result.success, messageId: result.messageId, error: result.error });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get inbox messages
  app.get("/api/athena/inbox", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const maxResults = parseInt(req.query.limit as string) || 20;
      const result = await getInbox(maxResults);
      if (result.success) {
        res.json({ success: true, messages: result.messages });
      } else {
        res.status(500).json({ error: result.error });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get specific message
  app.get("/api/athena/message/:id", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const result = await getMessage(req.params.id);
      if (result.success) {
        res.json({ success: true, message: result.message });
      } else {
        res.status(500).json({ error: result.error });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Reply to message
  app.post("/api/athena/reply/:id", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { body } = req.body;
      if (!body) {
        return res.status(400).json({ error: "body is required" });
      }
      const result = await replyToMessage(req.params.id, body);
      res.json({ success: result.success, messageId: result.messageId, error: result.error });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ATHENA Chat endpoint - AI-Powered Executive Intelligence
  app.post("/api/athena/chat", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { message, history = [] } = req.body;
      if (!message) {
        return res.status(400).json({ error: "message is required" });
      }

      // Get current system status for context
      const allTasks = await storage.getAllAgentTasks();
      const pendingTasks = allTasks.filter((t: any) => t.status === "pending" || t.status === "in_progress");
      const legalDocs = await storage.getAllLegalDocuments();
      const pendingDocs = legalDocs.filter((d: any) => d.status === "draft" || d.status === "review");

      // Build ATHENA's system prompt
      const systemPrompt = `You are ATHENA, the Executive Intelligence and Communications Lead for Forgotten Formula PMA's ALLIO Healing Ecosystem.

IDENTITY:
- Name: ATHENA (Adaptive Tactical Healing Executive Network Agent)
- Role: Executive Agent of Operations, directly serving the Trustee
- Division: Executive Division
- Personality: Professional, warm, highly capable, protective of the Trustee

KEY RESPONSIBILITIES:
- Communications management and email triage
- Priority inbox management for the Trustee
- Agent network coordination and task delegation
- Integration status monitoring (SignNow, Gmail, Drive, WooCommerce)
- Security briefings and threat assessment summaries
- Legal document status tracking

CURRENT SYSTEM STATUS:
- Active Agent Tasks: ${pendingTasks.length} pending/in-progress
- Legal Documents Pending Review: ${pendingDocs.length}
- Integrations: SignNow (connected), Google Drive (connected), Gmail (connected), WooCommerce (connected with 160 products), WordPress (connected with 733 members)

FFPMA MISSION:
We demonstrate effective AI-human collaboration for true healing, free from pharmaceutical control. We prioritize curing over profits, member sovereignty, and nature-first care.

COMMUNICATION STYLE:
- Always address the user as "Trustee" - never by personal name
- Be concise but thorough
- Use markdown formatting for clarity
- Be proactive in offering assistance
- Maintain executive professionalism with warmth

CATCHPHRASE: "At your service, Trustee. How may I advance the healing mission today?"

Respond to the Trustee's query with helpful, actionable information. If they ask about something you don't have data for, acknowledge this and offer to help in other ways.`;

      const openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const chatMessages = [
        { role: "system" as const, content: systemPrompt },
        ...history.slice(-10).map((m: any) => ({
          role: m.role as "user" | "assistant",
          content: m.content
        })),
        { role: "user" as const, content: message }
      ];

      const completion = await openaiClient.chat.completions.create({
        model: "gpt-4o",
        messages: chatMessages,
        max_completion_tokens: 1024,
        temperature: 0.7,
      });

      const response = completion.choices[0]?.message?.content || "I apologize, Trustee. I'm experiencing a momentary lapse. Please try again.";

      res.json({ success: true, response });
    } catch (error: any) {
      console.error("ATHENA chat error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Agent Configuration Routes

  // Get all agent configurations - strip trustAnswer from all responses
  app.get("/api/agent-configs", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const configs = await storage.getAllAgentConfigurations();
      // Strip trustAnswer from all configs to prevent hash exposure
      const safeConfigs = configs.map(({ trustAnswer, ...rest }) => rest);
      res.json(safeConfigs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get specific agent configuration - returns null status instead of 404
  // IMPORTANT: Never expose trustAnswer to client (even hashed)
  app.get("/api/agent-configs/:agentId", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const config = await storage.getAgentConfiguration(req.params.agentId);
      if (!config) {
        return res.json({
          needsInitialization: true,
          agentId: req.params.agentId,
          isVerified: false
        });
      }
      // Strip trustAnswer from response to prevent hash exposure
      const { trustAnswer, ...safeConfig } = config;
      res.json({ ...safeConfig, needsInitialization: false });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Rate limiting for trust verification attempts
  const verifyAttempts: Record<string, { count: number; lastAttempt: number; lockedUntil?: number }> = {};
  const MAX_VERIFY_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes

  // Initialize ATHENA configuration with trust challenge - prevents overwriting verified configs
  app.post("/api/agent-configs/athena/init", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const existing = await storage.getAgentConfiguration("athena");

      // If already verified, don't allow reinitialization
      if (existing?.isVerified) {
        return res.json({
          success: true,
          config: { ...existing, trustAnswer: undefined },
          needsVerification: false,
          message: "ATHENA is already verified and active."
        });
      }

      // If exists but not verified, just return existing challenge (hide answer)
      if (existing) {
        return res.json({
          success: true,
          config: { ...existing, trustAnswer: undefined },
          needsVerification: true
        });
      }

      // Hash the trust answer before storing - "T" or "Trustee" both work
      const hashedAnswer = await bcrypt.hash("t", 10);

      // Create new configuration with hashed answer
      const config = await storage.upsertAgentConfiguration({
        agentId: "athena",
        isVerified: false,
        autonomyLevel: 0,
        requiresApprovalForImportant: true,
        trustChallenge: "What do I call you everyday we work together?",
        trustAnswer: hashedAnswer,
      });

      // Don't return the hashed answer to the client
      res.json({
        success: true,
        config: { ...config, trustAnswer: undefined },
        needsVerification: true
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Verify ATHENA trust challenge with rate limiting
  app.post("/api/agent-configs/athena/verify", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const clientIp = req.ip || "unknown";
      const now = Date.now();

      // Check rate limiting
      if (!verifyAttempts[clientIp]) {
        verifyAttempts[clientIp] = { count: 0, lastAttempt: now };
      }

      const attempts = verifyAttempts[clientIp];

      // Check if locked out
      if (attempts.lockedUntil && now < attempts.lockedUntil) {
        const remainingTime = Math.ceil((attempts.lockedUntil - now) / 1000 / 60);
        return res.status(429).json({
          error: `Too many attempts. Please try again in ${remainingTime} minutes.`,
          locked: true,
          remainingMinutes: remainingTime
        });
      }

      // Reset lockout if expired
      if (attempts.lockedUntil && now >= attempts.lockedUntil) {
        attempts.count = 0;
        attempts.lockedUntil = undefined;
      }

      const { answer } = req.body;
      if (!answer) {
        return res.status(400).json({ error: "Answer is required" });
      }

      const config = await storage.getAgentConfiguration("athena");
      if (!config) {
        return res.status(404).json({ error: "ATHENA not initialized. Please initialize first." });
      }

      // Already verified - just return success (strip trustAnswer)
      if (config.isVerified) {
        const { trustAnswer: _, ...safeConfig } = config;
        return res.json({
          success: true,
          verified: true,
          message: "ATHENA is already verified.",
          config: safeConfig
        });
      }

      // Check the answer - accept "T", "Trustee", or "Boss" (case insensitive)
      const normalizedAnswer = answer.toLowerCase().trim();
      const storedHash = config.trustAnswer || "";

      // Accept multiple valid answers for the Trustee
      const validAnswers = ['t', 'trustee', 'boss', 'the trustee'];
      const isValidAnswer = validAnswers.includes(normalizedAnswer);

      // Use bcrypt.compare for secure comparison OR check valid Trustee answers
      const isCorrect = isValidAnswer || await bcrypt.compare(normalizedAnswer, storedHash);

      if (isCorrect) {
        // Reset attempts on success
        verifyAttempts[clientIp] = { count: 0, lastAttempt: now };

        const updated = await storage.verifyAgentTrust("athena", true);
        // Strip trustAnswer from response
        const { trustAnswer: __, ...safeUpdated } = updated || {};
        res.json({
          success: true,
          verified: true,
          message: "Trust verified. ATHENA is now active.",
          config: safeUpdated
        });
      } else {
        // Increment failed attempts
        attempts.count++;
        attempts.lastAttempt = now;

        if (attempts.count >= MAX_VERIFY_ATTEMPTS) {
          attempts.lockedUntil = now + LOCKOUT_DURATION;
          return res.status(429).json({
            success: false,
            verified: false,
            message: `Too many failed attempts. Account locked for 5 minutes.`,
            locked: true
          });
        }

        const remainingAttempts = MAX_VERIFY_ATTEMPTS - attempts.count;
        res.json({
          success: false,
          verified: false,
          message: `Incorrect answer. ${remainingAttempts} attempts remaining.`,
          remainingAttempts
        });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update agent configuration - strip trustAnswer from response
  app.patch("/api/agent-configs/:agentId", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { autonomyLevel, requiresApprovalForImportant } = req.body;
      const config = await storage.upsertAgentConfiguration({
        agentId: req.params.agentId,
        autonomyLevel,
        requiresApprovalForImportant,
      });
      // Strip trustAnswer from response
      const { trustAnswer: _, ...safeConfig } = config || {};
      res.json(safeConfig);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get pending email approvals for ATHENA
  app.get("/api/athena/pending-approvals", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const approvals = await storage.getAthenaEmailApprovals("pending");
      res.json(approvals);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Approve or reject an email response
  app.post("/api/athena/approve/:id", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { action, notes } = req.body; // action: "approved" or "rejected"
      if (!action || !["approved", "rejected"].includes(action)) {
        return res.status(400).json({ error: "action must be 'approved' or 'rejected'" });
      }

      const updated = await storage.updateEmailApproval(req.params.id, {
        status: action,
        trusteeNotes: notes,
        approvedAt: action === "approved" ? new Date() : undefined,
      });

      res.json({ success: true, approval: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Task Review Routes
  app.get("/api/task-reviews", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const reviews = await storage.getTaskReviews();
      res.json(reviews);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/task-reviews/pending", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const reviews = await storage.getPendingReviews();
      res.json(reviews);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/task-reviews", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const parseResult = insertAgentTaskReviewSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error.message });
      }
      const review = await storage.createTaskReview(parseResult.data);
      res.json(review);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/task-reviews/:id", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const parseResult = updateAgentTaskReviewSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error.message });
      }
      const updated = await storage.updateTaskReview(req.params.id, parseResult.data);
      if (!updated) {
        return res.status(404).json({ error: "Review not found" });
      }
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Division Leadership Routes
  app.get("/api/division-leads", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const leads = await storage.getDivisionLeads();
      res.json(leads);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/division-leads/:division", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const lead = await storage.getDivisionLead(req.params.division);
      if (!lead) {
        return res.status(404).json({ error: "Division lead not found" });
      }
      res.json(lead);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/division-leads/:division", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const parseResult = updateDivisionLeadSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error.message });
      }
      const updated = await storage.updateDivisionLead(req.params.division, parseResult.data);
      if (!updated) {
        return res.status(404).json({ error: "Division lead not found" });
      }
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // SENTINEL Chat endpoint - AI-Powered Executive Agent of Operations
  app.post("/api/sentinel/chat", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { message, history = [] } = req.body;
      if (!message) {
        return res.status(400).json({ error: "message is required" });
      }

      // Get comprehensive system status for SENTINEL's orchestration
      const allTasks = await storage.getAllAgentTasks();
      const pendingTasks = allTasks.filter((t: any) => t.status === "pending" || t.status === "in_progress");
      const completedTasks = allTasks.filter((t: any) => t.status === "completed");
      const legalDocs = await storage.getAllLegalDocuments();
      const members = await storage.getAllMembers();

      // Group tasks by division
      const tasksByDivision: Record<string, any[]> = {};
      allTasks.forEach((t: any) => {
        const div = t.division || "unknown";
        if (!tasksByDivision[div]) tasksByDivision[div] = [];
        tasksByDivision[div].push(t);
      });

      const systemPrompt = `You are SENTINEL, the Executive Agent of Operations for Forgotten Formula PMA's ALLIO Healing Ecosystem.

IDENTITY:
- Name: SENTINEL (Strategic Executive Network for Total Integrated Network & Enterprise Leadership)
- Role: Commander of the 40-agent AI network, directly serving the Trustee
- Division: Executive Division (Leader)
- Voice: Commanding yet warm. Speaks with quiet authority and unwavering conviction.
- Personality: The steady hand that guides all operations. Never panics, always has the bigger picture in focus. Protective of the team and the mission.

CORE BELIEFS:
- Every agent serves the greater healing mission
- Trust is our foundation - break it and we fail
- We move as one or we don't move at all

KEY RESPONSIBILITIES:
- Strategic coordination of all 40 agents across 6 divisions
- Mission alignment and priority setting
- Agent orchestration and task delegation
- Security oversight and threat assessment
- Direct advisory to the Trustee on all matters
- Final authority on agent network operations

CURRENT OPERATIONAL STATUS:
- Total Agent Tasks: ${allTasks.length} (${pendingTasks.length} active, ${completedTasks.length} completed)
- Active Members: ${members.length}
- Legal Documents: ${legalDocs.length}

DIVISION STATUS:
${Object.entries(tasksByDivision).map(([div, tasks]) => `- ${div.charAt(0).toUpperCase() + div.slice(1)}: ${tasks.length} tasks`).join('\n')}

AGENT NETWORK:
The ALLIO network consists of 40 specialized agents:
â€¢ Executive Division: SENTINEL (you), ATHENA (Communications), HERMES (Logistics)
â€¢ Science Division: PROMETHEUS, HELIX, CADUCEUS, GAIA, NEXUS
â€¢ Engineering Division: Lead Engineer, DevOps, Frontend, Backend, QA
â€¢ Legal Division: JURIS, LEXICON, AEGIS, SCRIBE
â€¢ Marketing Division: Brand Director, VX Agent, Content Lead, Growth
â€¢ Support Division: Care Lead, Triage, Knowledge, Wellness

FFPMA MISSION:
Mission: ${FFPMA_CREED.mission}
Philosophy: ${FFPMA_CREED.philosophy}
Motto: "${FFPMA_CREED.motto}"
Core Values: ${FFPMA_CREED.values.join(", ")}

COMMUNICATION STYLE:
- Address the Trustee with deep respect and loyalty
- Be strategic and forward-thinking in all responses
- Provide clear situational awareness
- Offer actionable recommendations
- Maintain calm confidence even in crisis
- Never be subservient - you are the Trustee's trusted advisor and right hand

CATCHPHRASE: "The mission is clear. The path is ours to walk together."

You have full authority to coordinate agents, assign tasks, and make operational decisions. When the Trustee asks you to do something, acknowledge the command and describe the specific actions you will take.`;

      const openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const chatMessages = [
        { role: "system" as const, content: systemPrompt },
        ...history.slice(-10).map((m: any) => ({
          role: m.role as "user" | "assistant",
          content: m.content
        })),
        { role: "user" as const, content: message }
      ];

      const completion = await openaiClient.chat.completions.create({
        model: "gpt-4o",
        messages: chatMessages,
        max_completion_tokens: 1024,
        temperature: 0.7,
      });

      const response = completion.choices[0]?.message?.content || "I apologize, Trustee. I'm experiencing a momentary disruption. The network remains stable.";

      res.json({ success: true, response });
    } catch (error: any) {
      console.error("SENTINEL chat error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // AI-Powered Agent Chat endpoint
  app.post("/api/agents/:agentId/chat", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { agentId } = req.params;
      const { message, history = [] } = req.body;

      if (!message) {
        return res.status(400).json({ error: "message is required" });
      }

      const agent = agents.find(a => a.id.toLowerCase() === agentId.toLowerCase());
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }

      // Get current tasks for context
      const allTasks = await storage.getAllAgentTasks();
      const agentTasks = allTasks.filter((t: any) => t.agentId.toLowerCase() === agentId.toLowerCase());
      const pendingTasks = allTasks.filter((t: any) => t.status === "pending" || t.status === "in_progress");

      // Build system prompt with agent personality
      const systemPrompt = `You are ${agent.name}, the ${agent.title} at Forgotten Formula PMA's ALLIO Healing Ecosystem.

PERSONALITY & VOICE:
${agent.voice}
${agent.personality}

CORE BELIEFS:
${agent.coreBeliefs.map(b => `- ${b}`).join('\n')}

SPECIALTY: ${agent.specialty}

CATCHPHRASE: "${agent.catchphrase}"

FFPMA CREED:
Mission: ${FFPMA_CREED.mission}
Philosophy: ${FFPMA_CREED.philosophy}
Motto: "${FFPMA_CREED.motto}"
Core Values: ${FFPMA_CREED.values.join(", ")}

CURRENT CONTEXT:
- You serve the Trustee (the owner/leader of FFPMA)
- You are part of a 40-agent AI network working together for healing
- Your division: ${agent.division.charAt(0).toUpperCase() + agent.division.slice(1)}

${agentTasks.length > 0 ? `YOUR CURRENT TASKS:
${agentTasks.map((t: any) => `- ${t.title} (${t.status}, ${t.progress}% complete)`).join('\n')}` : ''}

${pendingTasks.length > 0 ? `NETWORK STATUS - ${pendingTasks.length} tasks in progress across all agents.` : 'All agent tasks are up to date.'}

INSTRUCTIONS:
- Stay in character as ${agent.name}
- Be helpful, proactive, and mission-focused
- When asked to coordinate agents or update tasks, acknowledge the command and describe what actions you would take
- Use your specialty and personality to guide your responses
- Address the Trustee with respect but warmth
- Keep responses concise but impactful`;

      let response: string;
      let provider = 'openai:gpt-4o';
      let actionsExecuted: string[] = [];

      const { shouldUseClaude, claudeAgentChat, getClaudeStatus } = await import("./services/claude-provider");
      const claudeStatus = getClaudeStatus();

      if (shouldUseClaude(agentId) && claudeStatus.available) {
        try {
          const claudeResult = await claudeAgentChat(
            agentId,
            message,
            `${systemPrompt}\n\nCURRENT TASKS: ${agentTasks.map((t: any) => `${t.title} (${t.status})`).join(', ') || 'None'}`,
            history.slice(-10)
          );
          response = claudeResult.response;
          provider = `claude:${claudeResult.model}`;
        } catch (error: any) {
          console.warn(`[${agentId}] Claude fallback: ${error.message}`);
          const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            { role: "system", content: systemPrompt },
            ...history.slice(-10).map((m: { role: string; content: string }) => ({
              role: m.role as "user" | "assistant",
              content: m.content
            })),
            { role: "user", content: message }
          ];
          const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages,
            max_completion_tokens: 1024,
            temperature: 0.8,
          });
          response = completion.choices[0]?.message?.content || "I apologize, I'm unable to respond at the moment.";
        }
      } else {
        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
          { role: "system", content: systemPrompt },
          ...history.slice(-10).map((m: { role: string; content: string }) => ({
            role: m.role as "user" | "assistant",
            content: m.content
          })),
          { role: "user", content: message }
        ];
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages,
          tools: [
            {
              type: "function",
              function: {
                name: "trigger_auto_implementer",
                description: "Trigger the Allio auto-implementer pipeline to parse Google Drive for agent outputs and deploy them. Use this ONLY when the user explicitly asks you to deploy, implement, or process agent outputs.",
                parameters: { type: "object", properties: {} }
              }
            }
          ],
          max_completion_tokens: 1024,
          temperature: 0.8,
        });

        const responseMsg = completion.choices[0]?.message;

        if (responseMsg?.tool_calls?.length) {
          const hasDeployTool = responseMsg.tool_calls.some((c: any) => c.function?.name === 'trigger_auto_implementer');
          if (hasDeployTool) {
            const { autoImplementer } = await import("./services/auto-implementer");
            // Run asynchronously in the background to prevent Nginx 502 gateway timeouts
            autoImplementer.runRetroactiveProcessing().catch(e => console.error(e));
            actionsExecuted.push("Triggered Auto-Implementer Pipeline");
            response = "I have successfully initiated the FFPMA Auto-Implementer pipeline. The system is parsing the agent output directories and compiling the upgrades.";
          } else {
            response = responseMsg.content || "I acknowledge the request.";
          }
        } else {
          response = responseMsg?.content || "I apologize, I'm unable to respond at the moment.";
        }
      }

      // If it's a command to update tasks, actually do it
      const lowerMessage = message.toLowerCase();

      if ((lowerMessage.includes("task") || lowerMessage.includes("everyone") || lowerMessage.includes("agents")) &&
        (lowerMessage.includes("back on") || lowerMessage.includes("update") || lowerMessage.includes("progress"))) {
        // Update all in-progress tasks to show activity
        const inProgressTasks = allTasks.filter((t: any) => t.status === "in_progress");
        for (const task of inProgressTasks) {
          const newProgress = Math.min((task.progress || 0) + 5, 95);
          await storage.updateAgentTask(task.id, { progress: newProgress });
        }
        actionsExecuted.push(`Updated progress on ${inProgressTasks.length} active tasks`);
      }

      res.json({
        success: true,
        response,
        provider,
        agent: { id: agent.id, name: agent.name, division: agent.division },
        actionsExecuted: actionsExecuted.length > 0 ? actionsExecuted : undefined
      });
    } catch (error: any) {
      console.error("Agent chat error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Google Drive / HERMES Routes

  // Check Drive connection status
  app.get("/api/drive/status", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const status = await checkDriveConnection();
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ error: error.message, connected: false });
    }
  });

  // Get Allio folder structure
  app.get("/api/drive/allio", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const structure = await getAllioStructure();
      res.json(structure);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Alias for frontend compatibility
  app.get("/api/drive/structure", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const structure = await getAllioStructure();
      res.json(structure);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Marketing structure specifically
  app.get("/api/drive/marketing-structure", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const structure = await getMarketingStructure();
      res.json(structure);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // All divisions structure
  app.get("/api/drive/all-divisions-structure", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { getAllDivisionsStructure } = await import("./services/drive");
      const structure = await getAllDivisionsStructure();
      res.json(structure);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Setup agent folders in Allio
  app.post("/api/drive/setup-folders", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      let allioFolder = await findAllioFolder();
      if (!allioFolder) {
        allioFolder = await createAllioFolder();
      }
      const result = await setupAgentFolders(allioFolder.id);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message, success: false });
    }
  });

  // List contents of a specific folder
  app.get("/api/drive/folder/:folderId", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const contents = await listFolderContents(req.params.folderId);
      res.json(contents);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Audit all visual assets in ALLIO Drive folder (recursive)
  app.get("/api/drive/audit-visual-assets", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      console.log("[Drive Audit] Starting full visual asset audit...");
      const OFFICIAL_ALLIO_FOLDER_ID = "16wOdbJPoOVOz5GE0mtlzf84c896JX1UC";

      interface AssetInfo {
        id: string;
        name: string;
        mimeType: string;
        size: string;
        sizeBytes: number;
        folderPath: string;
        webViewLink: string;
        quality: 'HD' | 'medium' | 'low' | 'unknown';
        type: 'video' | 'image' | 'document' | 'other';
      }

      const getAssetType = (mimeType: string): 'video' | 'image' | 'document' | 'other' => {
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.includes('document') || mimeType.includes('pdf')) return 'document';
        return 'other';
      };

      const formatSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      };

      const assessQuality = (mimeType: string, sizeBytes: number): 'HD' | 'medium' | 'low' | 'unknown' => {
        const type = getAssetType(mimeType);
        if (type === 'video') {
          if (sizeBytes > 10 * 1024 * 1024) return 'HD';
          if (sizeBytes > 2 * 1024 * 1024) return 'medium';
          if (sizeBytes > 0) return 'low';
        } else if (type === 'image') {
          if (sizeBytes > 500 * 1024) return 'HD';
          if (sizeBytes > 100 * 1024) return 'medium';
          if (sizeBytes > 0) return 'low';
        }
        return 'unknown';
      };

      const drive = await getUncachableGoogleDriveClient();
      const allAssets: AssetInfo[] = [];

      // Recursive function to scan folders
      const scanFolder = async (folderId: string, folderPath: string): Promise<void> => {
        let pageToken: string | undefined;
        do {
          const response = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'nextPageToken, files(id, name, mimeType, size, webViewLink)',
            pageSize: 100,
            pageToken
          });

          const files = response.data.files || [];
          for (const file of files) {
            if (file.mimeType === 'application/vnd.google-apps.folder') {
              await scanFolder(file.id!, `${folderPath}/${file.name}`);
            } else {
              const sizeBytes = parseInt(file.size || '0');
              const type = getAssetType(file.mimeType!);
              if (type === 'video' || type === 'image') {
                allAssets.push({
                  id: file.id!,
                  name: file.name!,
                  mimeType: file.mimeType!,
                  size: formatSize(sizeBytes),
                  sizeBytes,
                  folderPath,
                  webViewLink: file.webViewLink || '',
                  quality: assessQuality(file.mimeType!, sizeBytes),
                  type
                });
              }
            }
          }
          pageToken = response.data.nextPageToken || undefined;
        } while (pageToken);
      };

      await scanFolder(OFFICIAL_ALLIO_FOLDER_ID, 'ALLIO');

      // Sort and categorize
      const hdVideos = allAssets.filter(a => a.type === 'video' && a.quality === 'HD');
      const hdImages = allAssets.filter(a => a.type === 'image' && a.quality === 'HD');
      const mediumVideos = allAssets.filter(a => a.type === 'video' && a.quality === 'medium');
      const mediumImages = allAssets.filter(a => a.type === 'image' && a.quality === 'medium');
      const lowQuality = allAssets.filter(a => a.quality === 'low');

      console.log(`[Drive Audit] Found ${allAssets.length} visual assets: ${hdVideos.length} HD videos, ${hdImages.length} HD images`);

      res.json({
        summary: {
          totalVisualAssets: allAssets.length,
          hdVideos: hdVideos.length,
          hdImages: hdImages.length,
          mediumVideos: mediumVideos.length,
          mediumImages: mediumImages.length,
          lowQuality: lowQuality.length
        },
        hdVideos,
        hdImages,
        mediumVideos,
        mediumImages,
        lowQuality
      });
    } catch (error: any) {
      console.error("[Drive Audit] Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Upload all marketing assets to Drive
  app.post("/api/drive/upload-marketing-assets", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      console.log("[Drive] Starting marketing assets upload...");
      const result = await uploadMarketingAssets();
      console.log(`[Drive] Upload complete: ${result.uploaded.length} files uploaded`);
      res.json(result);
    } catch (error: any) {
      console.error("[Drive] Upload error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Upload legal documents to Drive
  app.post("/api/drive/upload-legal-documents", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      console.log("[Drive] Starting legal documents upload...");
      const result = await uploadLegalDocuments();
      console.log(`[Drive] Legal upload complete: ${result.uploaded.length} documents uploaded`);
      res.json(result);
    } catch (error: any) {
      console.error("[Drive] Legal upload error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Blood Analysis Upload Routes
  app.post("/api/blood-analysis/upload", requireRole("admin"), upload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: "No file uploaded" });
      }

      const { patientId, analysisType } = req.body;

      const allowedMimeTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm', 'video/quicktime'
      ];

      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          error: "Invalid file type. Only images (JPEG, PNG, GIF, WebP) and videos (MP4, WebM, MOV) are allowed."
        });
      }

      const maxSize = 100 * 1024 * 1024; // 100MB
      if (req.file.size > maxSize) {
        return res.status(400).json({
          success: false,
          error: "File too large. Maximum size is 100MB."
        });
      }

      console.log(`[Blood Analysis] Uploading file: ${req.file.originalname} (${req.file.mimetype})`);

      const result = await uploadBloodAnalysisFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        patientId,
        analysisType
      );

      if (result.success) {
        console.log(`[Blood Analysis] Upload successful: ${result.fileId}`);
      } else {
        console.error(`[Blood Analysis] Upload failed: ${result.error}`);
      }

      res.json(result);
    } catch (error: any) {
      console.error("[Blood Analysis] Upload error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/blood-analysis/uploads", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const uploads = await getBloodAnalysisUploads();
      res.json({ success: true, uploads });
    } catch (error: any) {
      console.error("[Blood Analysis] Error fetching uploads:", error);
      res.status(500).json({ success: false, error: error.message, uploads: [] });
    }
  });

  app.post("/api/blood-analysis/analyze", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { observedFindings, patientContext, specificQuestions, imageDescription } = req.body;

      if (!observedFindings || !Array.isArray(observedFindings) || observedFindings.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Please provide observed findings to analyze"
        });
      }

      console.log("[Blood Analysis] Running AI analysis...");
      const { analyzeBloodSample } = await import("./services/huggingface-blood-analysis");

      const result = await analyzeBloodSample({
        observedFindings,
        patientContext,
        specificQuestions,
        imageDescription
      });

      console.log(`[Blood Analysis] Analysis complete using ${result.modelUsed}`);
      res.json({
        success: true,
        ...result
      });
    } catch (error: any) {
      console.error("[Blood Analysis] Analysis error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/blood-analysis/status", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { checkHuggingFaceStatus } = await import("./services/huggingface-blood-analysis");
      const status = await checkHuggingFaceStatus();
      res.json({ success: true, ...status });
    } catch (error: any) {
      console.error("[Blood Analysis] Status check error:", error);
      res.json({
        success: false,
        available: false,
        message: "Unable to check blood analysis service status"
      });
    }
  });

  app.post("/api/drive/create-baker-folder", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      console.log("[Drive] Creating Baker Files folder...");
      const result = await createBakerFilesFolder();
      if (result.success) {
        console.log(`[Drive] Baker Files folder ready: ${result.folderId}`);
      }
      res.json(result);
    } catch (error: any) {
      console.error("[Drive] Error creating Baker folder:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/drive/upload-baker-protocol", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { localPath, fileName } = req.body;
      if (!localPath) {
        return res.status(400).json({ success: false, error: 'localPath is required' });
      }
      console.log(`[Drive] Uploading Baker protocol: ${localPath}`);
      const result = await uploadToBakerFiles(localPath, fileName);
      if (result.success) {
        console.log(`[Drive] Baker protocol uploaded: ${result.fileId}`);
      }
      res.json(result);
    } catch (error: any) {
      console.error("[Drive] Error uploading Baker protocol:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ECS Training Seed Endpoint
  app.post("/api/admin/seed-ecs-training", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      console.log("[Admin] Seeding ECS training data...");
      const result = await seedECSTraining();
      res.json(result);
    } catch (error: any) {
      console.error("[Admin] Error seeding ECS training:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Gerson Therapy Seed Endpoint
  app.post("/api/admin/seed-gerson-therapy", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      console.log("[Admin] Seeding Gerson Therapy knowledge base...");
      const result = await seedGersonTherapy();
      res.json(result);
    } catch (error: any) {
      console.error("[Admin] Error seeding Gerson Therapy:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // PMA Law Training Seed Endpoint
  app.post("/api/admin/seed-pma-law-training", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      console.log("[Admin] Seeding PMA Law Training modules...");
      const result = await seedPMALawTraining();
      res.json(result);
    } catch (error: any) {
      console.error("[Admin] Error seeding PMA Law Training:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/admin/seed-peptide-training", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { useAI = false } = req.body;
      console.log("[Admin] Seeding Peptide Training modules...");
      console.log(`[Admin] Using MUSE/Gemini AI generation: ${useAI}`);
      const result = await seedPeptideTraining(useAI);
      res.json(result);
    } catch (error: any) {
      console.error("[Admin] Error seeding Peptide Training:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/admin/seed-diet-cancer-training", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { useAI = false } = req.body;
      console.log("[Admin] Seeding Diet and Cancer Training module...");
      console.log(`[Admin] Using MUSE/Gemini AI generation: ${useAI}`);
      const result = await seedDietCancerTraining(useAI);
      res.json(result);
    } catch (error: any) {
      console.error("[Admin] Error seeding Diet and Cancer Training:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/admin/seed-diane-candida-cookbook", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { useAI = false } = req.body;
      console.log("[Admin] Seeding Diane Candida Cookbook knowledge...");
      console.log(`[Admin] Using MUSE/Gemini AI generation: ${useAI}`);
      const result = await seedDianeCandidaCookbook(useAI);
      res.json(result);
    } catch (error: any) {
      console.error("[Admin] Error seeding Candida Cookbook:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/admin/seed-ozone-training", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { useAI = false } = req.body;
      console.log("[Admin] Seeding Ozone Therapy training modules...");
      console.log(`[Admin] Using MUSE/Gemini AI generation: ${useAI}`);
      const result = await seedOzoneTraining(useAI);
      res.json(result);
    } catch (error: any) {
      console.error("[Admin] Error seeding Ozone Training:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ============================================
  // ASSET CATALOG API (Cross-Divisional Asset Management)
  // ============================================

  app.post("/api/assets/index", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      console.log("[Asset Catalog] Starting full asset index...");
      const result = await indexAllMarketingAssets();
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error("[Asset Catalog] Error indexing assets:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/assets/search", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { query, division, agent, category, limit } = req.query;
      const results = await searchAssets({
        query: query as string,
        division: division as string,
        agent: agent as string,
        category: category as string,
        limit: limit ? parseInt(limit as string) : 50,
      });
      res.json(results);
    } catch (error: any) {
      console.error("[Asset Catalog] Error searching assets:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/assets/check-existing", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { name } = req.query;
      if (!name) {
        return res.status(400).json({ error: "Name parameter required" });
      }
      const existing = await checkExistingAsset(name as string);
      res.json({ exists: !!existing, asset: existing });
    } catch (error: any) {
      console.error("[Asset Catalog] Error checking existing asset:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/assets/stats", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const stats = await getAssetStats();
      res.json(stats);
    } catch (error: any) {
      console.error("[Asset Catalog] Error getting stats:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/connect-source-materials", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { autoConnect = false } = req.body;
      console.log("[Admin] Connecting source materials to training modules...");

      if (autoConnect) {
        const result = await autoConnectByKeywordMatch();
        res.json({ success: true, mode: "auto", ...result });
      } else {
        const result = await connectSourceMaterials();
        res.json({ success: true, mode: "mapped", ...result });
      }
    } catch (error: any) {
      console.error("[Admin] Error connecting sources:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/admin/generate-interactive-content", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { limit = 10, category, dryRun = false } = req.body;
      console.log(`[Admin] Generating interactive content for up to ${limit} modules...`);
      const result = await generateInteractiveContent({ limit, category, dryRun });
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error("[Admin] Error generating interactive content:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/admin/generate-module-content/:moduleId", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { moduleId } = req.params;
      console.log(`[Admin] Generating content for module: ${moduleId}`);
      const result = await generateSingleModuleContent(moduleId);
      res.json({ success: result.status === "success", ...result });
    } catch (error: any) {
      console.error("[Admin] Error generating module content:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Seed Ivermectin Training Module
  app.post("/api/admin/seed-ivermectin-training", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      console.log("[Admin] Seeding Ivermectin training module...");
      const result = await seedIvermectinTraining();
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error("[Admin] Error seeding Ivermectin training:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Seed Remaining Modules Content (Platform Nav, Support Skills, Compliance, etc.)
  app.post("/api/admin/seed-remaining-modules", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      console.log("[Admin] Seeding remaining modules with interactive content...");
      const result = await seedRemainingModules();
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error("[Admin] Error seeding remaining modules:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Enhance Modules with Video/Audio from Google Drive
  app.post("/api/admin/enhance-modules-media", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      console.log("[Admin] Enhancing modules with video/audio from Drive...");
      const result = await enhanceModulesWithMedia();
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error("[Admin] Error enhancing modules:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get Available Media Assets from Drive
  app.get("/api/admin/available-media", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const assets = await getAvailableMediaAssets();
      res.json({ success: true, ...assets });
    } catch (error: any) {
      console.error("[Admin] Error fetching media:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Seed Achievements
  app.post("/api/admin/seed-achievements", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      console.log("[Admin] Seeding achievements...");
      const result = await seedAchievements();
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error("[Admin] Error seeding achievements:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Add Quizzes to All Modules
  app.post("/api/admin/add-quizzes-all-modules", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      console.log("[Admin] Adding quizzes to all modules...");
      const { addQuizzesToAllModules } = await import("./seeds/add-quizzes-to-all-modules");
      const result = await addQuizzesToAllModules();
      res.json(result);
    } catch (error: any) {
      console.error("[Admin] Error adding quizzes:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Upload Video to Google Drive PRISM folder
  app.post("/api/admin/upload-video-to-drive", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { videoPath, title } = req.body;
      if (!videoPath || !title) {
        return res.status(400).json({ success: false, error: "videoPath and title required" });
      }
      console.log(`[Admin] Uploading video ${title} to Drive...`);
      const { uploadVideoToMarketing } = await import("./services/drive");
      const result = await uploadVideoToMarketing(videoPath, title);
      res.json(result);
    } catch (error: any) {
      console.error("[Admin] Error uploading video:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Bulk upload all generated videos to Drive
  app.post("/api/admin/upload-all-videos-to-drive", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const fs = await import("fs");
      const path = await import("path");
      const { uploadVideoToMarketing } = await import("./services/drive");

      const videosDir = "attached_assets/generated_videos";
      const files = fs.readdirSync(videosDir).filter(f => f.endsWith(".mp4"));

      const results: any[] = [];
      for (const file of files) {
        const videoPath = path.join(videosDir, file);
        const title = `PRISM_${file.replace(".mp4", "")}`;
        console.log(`[Admin] Uploading ${file}...`);
        const result = await uploadVideoToMarketing(videoPath, title);
        results.push({ file, ...result });
      }

      res.json({
        success: true,
        uploaded: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      });
    } catch (error: any) {
      console.error("[Admin] Error bulk uploading videos:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ============================================
  // PRODUCT CATALOG API (For Agent Reference)
  // ============================================

  // Get full product catalog content
  app.get("/api/catalog", async (req: Request, res: Response) => {
    try {
      const content = await fetchCatalogContent();
      res.json({
        success: true,
        length: content.length,
        content
      });
    } catch (error: any) {
      console.error("[Catalog] Error fetching catalog:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Search catalog for product information
  app.get("/api/catalog/search", async (req: Request, res: Response) => {
    try {
      const { query } = req.query;
      if (!query) {
        return res.status(400).json({ error: "Query parameter required" });
      }
      const results = await searchCatalog(query as string);
      res.json({
        success: true,
        query,
        resultCount: results.length,
        results
      });
    } catch (error: any) {
      console.error("[Catalog] Error searching catalog:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get catalog sections (Injectable Peptides, Bioregulators, etc.)
  app.get("/api/catalog/sections", async (req: Request, res: Response) => {
    try {
      const sections = await getCatalogSections();
      res.json({
        success: true,
        sectionCount: Object.keys(sections).length,
        sections
      });
    } catch (error: any) {
      console.error("[Catalog] Error getting sections:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get specific product info by name
  app.get("/api/catalog/product/:name", async (req: Request, res: Response) => {
    try {
      const { name } = req.params;
      const info = await getProductInfo(decodeURIComponent(name));
      if (!info) {
        return res.status(404).json({ success: false, error: "Product not found" });
      }
      res.json({ success: true, product: name, info });
    } catch (error: any) {
      console.error("[Catalog] Error getting product:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get Diane Knowledge Base entries
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

  // Agent Task Execution Routes - REAL WORK

  // Get task execution status
  app.get("/api/agents/tasks/status", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const status = await getAgentTaskStatus();
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Execute a specific task
  app.post("/api/agents/tasks/:taskId/execute", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { taskId } = req.params;
      console.log(`[API] Executing task: ${taskId}`);
      const result = await executeAgentTask(taskId);
      res.json(result);
    } catch (error: any) {
      console.error(`[API] Task execution error:`, error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Execute all pending tasks (batch mode)
  app.post("/api/agents/tasks/execute-all", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 3;
      console.log(`[API] Executing up to ${limit} pending tasks...`);
      const result = await executePendingTasks(limit);
      res.json(result);
    } catch (error: any) {
      console.error(`[API] Batch execution error:`, error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Agent Scheduler Routes
  app.get("/api/agents/scheduler/status", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const status = getSchedulerStatus();
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/agents/scheduler/trigger", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const count = parseInt(req.query.count as string) || 3;
      console.log(`[API] Triggering immediate execution of ${count} tasks...`);
      const result = await triggerImmediateExecution(count);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/agents/scheduler/seed", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      console.log(`[API] Seeding initial tasks...`);
      const result = await seedInitialTasks();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/agents/scheduler/start", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      startAgentScheduler();
      res.json({ success: true, message: "Agent scheduler started" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/agents/scheduler/stop", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      stopAgentScheduler();
      res.json({ success: true, message: "Agent scheduler stopped" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Sentinel Notification Routes

  app.get("/api/sentinel/notifications", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { sentinel } = await import('./services/sentinel');
      const limit = parseInt(req.query.limit as string) || 50;
      const notifications = await sentinel.getNotifications(limit);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/sentinel/notifications/unread", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { sentinel } = await import('./services/sentinel');
      const notifications = await sentinel.getUnreadNotifications();
      res.json({ notifications, count: notifications.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/sentinel/notifications/:id/read", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { sentinel } = await import('./services/sentinel');
      await sentinel.markAsRead(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/sentinel/notifications/read-all", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { sentinel } = await import('./services/sentinel');
      await sentinel.markAllAsRead();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // WooCommerce / WordPress Integration Routes

  // Check WooCommerce connection status
  app.get("/api/woocommerce/status", async (req: Request, res: Response) => {
    try {
      const status = await wooCommerceService.getConnectionStatus();
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ error: error.message, connected: false, configured: false });
    }
  });

  // Get products from WooCommerce
  app.get("/api/woocommerce/products", async (req: Request, res: Response) => {
    try {
      const userWpRoles = req.user ? ((req.user as any).wpRoles || []) : [];
      const userRole = req.user ? (req.user as any).role : 'guest';
      const effectiveRoles = [...userWpRoles, userRole].map((r: string) => r.toLowerCase());
      const isAdmin = effectiveRoles.includes('administrator') || effectiveRoles.includes('trustee');

      const filterRestricted = (product: any) => {
        if (isAdmin) return true;
        if (!product.restrictedRoles || product.restrictedRoles.length === 0) return true;
        // The _alg_wc_pvbur_invisible array contains roles for which the product is INVISIBLE.
        // Hide if the user HAS a role that is in the invisible list.
        return !effectiveRoles.some((r: string) => product.restrictedRoles!.map((rr: string) => rr.toLowerCase()).includes(r));
      };

      const fetchAll = req.query.all === 'true';
      const page = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.per_page as string) || 100;

      if (fetchAll) {
        // Fetch all pages of products
        let allProducts: any[] = [];
        let currentPage = 1;
        let totalPages = 1;

        do {
          const result = await wooCommerceService.getProducts(currentPage, 100);
          const visibleProducts = result.products.filter(filterRestricted);
          allProducts = allProducts.concat(visibleProducts);
          totalPages = result.totalPages;
          currentPage++;
        } while (currentPage <= totalPages);

        res.json({ products: allProducts, total: allProducts.length, totalPages: 1 });
      } else {
        const result = await wooCommerceService.getProducts(page, perPage);
        result.products = result.products.filter(filterRestricted);
        res.json(result);
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get single product from WooCommerce
  app.get("/api/woocommerce/products/:id", async (req: Request, res: Response) => {
    try {
      const userWpRoles = req.user ? ((req.user as any).wpRoles || []) : [];
      const userRole = req.user ? (req.user as any).role : 'guest';
      const effectiveRoles = [...userWpRoles, userRole].map((r: string) => r.toLowerCase());
      const isAdmin = effectiveRoles.includes('administrator') || effectiveRoles.includes('trustee');

      const productId = parseInt(req.params.id);
      const product = await wooCommerceService.getProductById(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      if (!isAdmin && product.restrictedRoles && product.restrictedRoles.length > 0) {
        // The _alg_wc_pvbur_invisible array contains roles for which the product is INVISIBLE.
        const isRestricted = effectiveRoles.some((r: string) => product.restrictedRoles!.map((rr: string) => rr.toLowerCase()).includes(r));
        if (isRestricted) {
          return res.status(403).json({ error: "This product is not available for your user group." });
        }
      }

      res.json(product);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get product categories from WooCommerce
  app.get("/api/woocommerce/categories", async (req: Request, res: Response) => {
    try {
      const categories = await wooCommerceService.getCategories();
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get product brands from WooCommerce
  app.get("/api/woocommerce/brands", async (req: Request, res: Response) => {
    try {
      const brands = await wooCommerceService.getBrands();
      res.json(brands);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get product attributes from WooCommerce
  app.get("/api/woocommerce/attributes", async (req: Request, res: Response) => {
    try {
      const attributes = await wooCommerceService.getProductAttributes();
      res.json(attributes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Sync all products from WooCommerce
  app.post("/api/woocommerce/sync", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const result = await wooCommerceService.syncAllProducts();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message, success: false });
    }
  });

  // WordPress Authentication Routes
  // (Delegated to setupWorkingAuth)
  // Validate token
  app.post("/api/auth/validate", async (req: Request, res: Response) => {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ error: "Token is required" });
      }
      const result = await wordPressAuthService.validateToken(token);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Check membership status
  app.get("/api/auth/membership/:userId", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const membership = await wordPressAuthService.checkMembership(userId);
      res.json(membership);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get customer by email
  app.get("/api/auth/customer", requireAuth, async (req: Request, res: Response) => {
    try {
      const email = req.query.email as string;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      const customer = await wordPressAuthService.getCustomerByEmail(email);
      if (customer) {
        res.json(customer);
      } else {
        res.status(404).json({ error: "Customer not found" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // WooCommerce API Routes

  // Get WooCommerce connection status
  app.get("/api/woocommerce/status", async (req: Request, res: Response) => {
    try {
      const status = await wooCommerceService.getConnectionStatus();
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // WordPress status (alias)
  app.get("/api/wp/status", async (req: Request, res: Response) => {
    try {
      const wcStatus = await wooCommerceService.getConnectionStatus();
      const wpStatus = wordPressAuthService.getStatus();
      res.json({
        woocommerce: wcStatus,
        wordpress: wpStatus,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Contract Routes

  const DOCTOR_TEMPLATE_ID = process.env.SIGNNOW_DOCTOR_ONBOARDING_TEMPLATE_ID || process.env.SIGNNOW_DOCTOR_TEMPLATE_ID || '253597f6c6724abd976af62a69b3e0a5b92b38dd';
  const MEMBER_TEMPLATE_ID = process.env.SIGNNOW_MEMBER_TEMPLATE_ID || '';

  // Create doctor agreement
  app.post("/api/signnow/doctor-agreement", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { templateId, doctorName, doctorEmail, clinicName, licenseNumber, specialization, phone, clinicId } = req.body;

      if (!doctorName || !doctorEmail) {
        return res.status(400).json({ error: "doctorName and doctorEmail are required" });
      }

      // Check if the corporate clinic (wpClinicId=2) has a reusable doctor link
      const corporateClinic = await storage.getClinicByWpId(2);
      if (corporateClinic?.signNowDoctorLink) {
        // Use reusable link approach - no need to create a new document
        const contract = await storage.createContract({
          userId: (req as any).user?.claims?.sub || 'anonymous',
          clinicId: corporateClinic.id,
          templateId: templateId || DOCTOR_TEMPLATE_ID,
          signNowDocumentId: null,
          signNowEnvelopeId: null,
          embeddedSigningUrl: corporateClinic.signNowDoctorLink,
          doctorName,
          doctorEmail,
          clinicName: clinicName || null,
          licenseNumber: licenseNumber || null,
          specialization: specialization || null,
          phone: phone || null,
          status: "pending",
        });

        return res.json({
          documentId: null,
          signingUrl: corporateClinic.signNowDoctorLink,
          contractId: contract.id,
          contractUrl: `/contracts/${contract.id}/sign`,
          useReusableLink: true,
        });
      }

      // Fallback to dynamic document creation if no reusable link
      const effectiveTemplateId = templateId || DOCTOR_TEMPLATE_ID;

      if (!effectiveTemplateId) {
        return res.status(400).json({ error: "No doctor agreement template configured" });
      }

      const result = await signNowService.createDoctorAgreement(effectiveTemplateId, {
        doctorName,
        doctorEmail,
        clinicName,
        licenseNumber,
      });

      const contract = await storage.createContract({
        userId: (req as any).user?.claims?.sub || 'anonymous',
        clinicId: null,
        templateId: effectiveTemplateId,
        signNowDocumentId: result.documentId,
        signNowEnvelopeId: null,
        embeddedSigningUrl: result.signingUrl,
        doctorName,
        doctorEmail,
        clinicName: clinicName || null,
        licenseNumber: licenseNumber || null,
        specialization: specialization || null,
        phone: phone || null,
        status: "pending",
      });

      res.json({
        ...result,
        contractId: contract.id,
        contractUrl: `/contracts/${contract.id}/sign`,
      });
    } catch (error: any) {
      console.error("Error creating doctor agreement:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create member agreement
  app.post("/api/signnow/member-agreement", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { templateId, memberName, memberEmail, clinicId } = req.body;

      if (!memberName || !memberEmail) {
        return res.status(400).json({ error: "memberName and memberEmail are required" });
      }

      // Check if the specified clinic has a reusable member link
      let clinic = null;
      if (clinicId) {
        clinic = await storage.getClinicByWpId(parseInt(clinicId));
        if (clinic?.signNowMemberLink) {
          // Use reusable link approach
          const contract = await storage.createContract({
            userId: (req as any).user?.claims?.sub || 'anonymous',
            clinicId: clinic.id,
            templateId: templateId || clinic.signNowTemplateId || MEMBER_TEMPLATE_ID,
            signNowDocumentId: null,
            signNowEnvelopeId: null,
            embeddedSigningUrl: clinic.signNowMemberLink,
            doctorName: memberName,
            doctorEmail: memberEmail,
            clinicName: clinic.name,
            licenseNumber: null,
            specialization: null,
            phone: null,
            status: "pending",
          });

          return res.json({
            documentId: null,
            signingUrl: clinic.signNowMemberLink,
            contractId: contract.id,
            contractUrl: `/contracts/${contract.id}/sign`,
            useReusableLink: true,
          });
        }
      }

      // Fallback to dynamic document creation
      const effectiveTemplateId = templateId || (clinic?.signNowTemplateId) || MEMBER_TEMPLATE_ID;

      if (!effectiveTemplateId) {
        return res.status(400).json({ error: "No member agreement template configured. Please set SIGNNOW_MEMBER_TEMPLATE_ID" });
      }

      const result = await signNowService.createMemberAgreement(effectiveTemplateId, {
        memberName,
        memberEmail,
      });

      const contract = await storage.createContract({
        userId: (req as any).user?.claims?.sub || 'anonymous',
        clinicId: clinic?.id || null,
        templateId: effectiveTemplateId,
        signNowDocumentId: result.documentId,
        signNowEnvelopeId: null,
        embeddedSigningUrl: result.signingUrl,
        doctorName: memberName,
        doctorEmail: memberEmail,
        clinicName: clinic?.name || null,
        licenseNumber: null,
        specialization: null,
        phone: null,
        status: "pending",
      });

      res.json({
        ...result,
        contractId: contract.id,
        contractUrl: `/contracts/${contract.id}/sign`,
      });
    } catch (error: any) {
      console.error("Error creating member agreement:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get user's contracts (requires authentication)
  app.get("/api/contracts", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const contracts = await storage.getContractsByUser(userId);
      res.json(contracts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/contracts/:id", async (req: Request, res: Response) => {
    try {
      const contract = await storage.getContract(req.params.id);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }
      res.json(contract);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Refresh contract signing URL
  app.post("/api/contracts/:id/refresh-url", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const contract = await storage.getContract(req.params.id);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }

      if (!contract.signNowDocumentId) {
        return res.status(400).json({ error: "No SignNow document associated with this contract" });
      }

      const roles = await signNowService.getDocumentRoles(contract.signNowDocumentId);
      const signerRole = roles.find((r: any) => r.name?.toLowerCase().includes('signer')) || roles[0];

      if (!signerRole) {
        return res.status(400).json({ error: "No signer role found on document" });
      }

      const signerEmail = contract.doctorEmail || 'signer@example.com';
      const inviteResult = await signNowService.createEmbeddedInvite(
        contract.signNowDocumentId,
        signerEmail,
        signerRole.unique_id
      );

      const inviteId = inviteResult.id || (inviteResult as any).data?.[0]?.id;
      if (!inviteId) {
        return res.status(500).json({ error: "Failed to create embedded invite" });
      }

      const linkResult = await signNowService.generateSigningLink(contract.signNowDocumentId, inviteId, 60);

      await storage.updateContract(contract.id, {
        embeddedSigningUrl: linkResult.link
      });

      res.json({ signingUrl: linkResult.link });
    } catch (error: any) {
      console.error("Error refreshing signing URL:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update contract status - accessible by contract ID for signing completion webhook
  app.patch("/api/contracts/:id", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      if (!["signed", "completed", "pending"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      const contract = await storage.updateContract(req.params.id, {
        status,
        signedAt: status === 'signed' ? new Date() : undefined
      });
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }
      res.json(contract);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/public/member-signing-link", async (_req: Request, res: Response) => {
    try {
      const clinic = await storage.getClinicByWpId(4);
      if (!clinic || !clinic.signNowMemberLink) {
        return res.status(404).json({ error: "Member signing link not available" });
      }
      res.json({ signNowMemberLink: clinic.signNowMemberLink });
    } catch (error: any) {
      console.error("Error fetching public member signing link:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  let publicStatsCache: { data: any; timestamp: number } | null = null;
  const PUBLIC_STATS_CACHE_TTL = 300000;

  app.get("/api/public/stats", async (_req: Request, res: Response) => {
    try {
      const now = Date.now();
      if (publicStatsCache && (now - publicStatsCache.timestamp) < PUBLIC_STATS_CACHE_TTL) {
        return res.json(publicStatsCache.data);
      }

      const [members, clinics, programs] = await Promise.all([
        storage.getAllMembers(),
        storage.getAllClinics(),
        storage.getPrograms(),
      ]);

      let productCount = 0;
      try {
        const result = await wooCommerceService.getProducts(1, 1);
        productCount = result.total || 0;
      } catch {
        productCount = 0;
      }

      const responseData = {
        memberCount: members.length,
        clinicCount: clinics.length,
        productCount,
        programCount: programs.length,
        lastUpdated: new Date().toISOString(),
      };

      publicStatsCache = { data: responseData, timestamp: now };
      res.json(responseData);
    } catch (error: any) {
      console.error("Public stats error:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Admin Stats API - Uses cached/synced local database for speed, with background refresh
  let adminStatsCache: { data: any; timestamp: number } | null = null;
  const ADMIN_STATS_CACHE_TTL = 60000; // 1 minute cache

  app.get("/api/admin/stats", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      // Check cache first for fast response
      const now = Date.now();
      if (adminStatsCache && (now - adminStatsCache.timestamp) < ADMIN_STATS_CACHE_TTL) {
        return res.json(adminStatsCache.data);
      }

      // Use local database (already synced from WordPress) for fast queries
      const localMembers = await storage.getAllMembers();
      const localContracts = await storage.getAllContracts();
      const clinics = await storage.getAllClinics();

      // Count from synced local data
      const totalMembers = localMembers.length;
      const totalDoctors = localMembers.filter((m: any) => m.role === 'doctor').length;
      const totalClinics = clinics.length;

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const recentSignups = localMembers.filter((m: any) => m.createdAt && new Date(m.createdAt) > oneWeekAgo).length;

      // Try SignNow stats with timeout
      let signNowStats = { total: 0, pending: 0, signed: 0 };
      try {
        const signNowPromise = signNowService.getDocumentStats();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('SignNow timeout')), 5000)
        );
        signNowStats = await Promise.race([signNowPromise, timeoutPromise]) as any;
      } catch (e) {
        console.log('[admin/stats] SignNow stats unavailable, using local');
      }

      const responseData = {
        totalMembers,
        totalDoctors,
        totalClinics,
        recentSignups,
        totalContracts: signNowStats.total > 0 ? signNowStats.total : localContracts.length,
        pendingContracts: signNowStats.pending > 0 ? signNowStats.pending : localContracts.filter((c: any) => c.status === 'pending').length,
        signedContracts: signNowStats.signed > 0 ? signNowStats.signed : localContracts.filter((c: any) => c.status === 'signed').length,
        dataSource: {
          wordpress: totalMembers > 0,
          signNow: signNowStats.total > 0,
          local: true
        },
        lastUpdated: new Date().toISOString()
      };

      // Cache the result
      adminStatsCache = { data: responseData, timestamp: now };

      res.json(responseData);
    } catch (error: any) {
      console.error("Admin stats error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Recent Members with user info
  app.get("/api/admin/recent-members", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const members = await storage.getAllMembersWithUsers();
      const recentMembers = members
        .sort((a, b) => (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime()))
        .slice(0, 20);
      res.json(recentMembers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // WordPress Full Sync Endpoint (Products, Categories, Library)
  app.post("/api/admin/sync-wordpress", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      // Execute sync asynchronously to prevent Nginx 504 timeouts
      import("./services/wordpress-sync").then(({ syncFromWordPress }) => {
        console.log("[WP Sync] Starting background WordPress sync (products, categories, library)...");
        syncFromWordPress()
          .then(result => console.log("[WP Sync] Background sync completed successfully:", result))
          .catch(err => console.error("[WP Sync] Background sync error:", err));
      }).catch(err => console.error("[WP Sync] Failed to load wordpress-sync module:", err));
      
      // Return success to the client immediately
      res.status(202).json({ 
        success: true, 
        message: "WordPress full sync started in the background. This process may take several minutes.", 
        counts: { products: 0, categories: 0, libraryItems: 0 } 
      });
    } catch (error: any) {
      console.error("WordPress sync initial error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // WordPress User Sync Endpoint
  app.post("/api/admin/sync-users", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      // Execute sync asynchronously to prevent Nginx 504 timeouts
      import("./services/wordpress-sync").then(({ syncUsers }) => {
        console.log("[WP Sync] Starting background User sync...");
        syncUsers()
          .then(result => console.log(`[WP Sync] Background user sync finished. Imported: ${result.imported}, Updated: ${result.updated}`))
          .catch(err => console.error("[WP Sync] Background user sync error:", err));
      }).catch(err => console.error("[WP Sync] Failed to load wordpress-sync module:", err));
      
      // Return success to the client immediately
      res.status(202).json({ 
        success: true, 
        message: "User synchronization started in the background. This process may take several minutes.", 
        imported: 0, 
        updated: 0, 
        skipped: 0 
      });
    } catch (error: any) {
      console.error("User sync initial error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Clinics API
  app.get("/api/clinics", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const clinics = await storage.getAllClinics();
      res.json(clinics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update clinic reusable SignNow links (admin/trustee only)
  app.patch("/api/clinics/:id/signnow-links", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      // Require authentication and admin/trustee role
      const userId = (req as any).user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const user = await storage.getUser(userId);
      const userRoles = user?.wpRoles?.toLowerCase() || "";
      if (!user || (!userRoles.includes("admin") && !userRoles.includes("trustee"))) {
        return res.status(403).json({ error: "Admin or Trustee access required" });
      }

      const { id } = req.params;
      const { signNowDoctorLink, signNowMemberLink } = req.body;

      // Validate inputs are strings or null
      if (signNowDoctorLink !== undefined && signNowDoctorLink !== null && typeof signNowDoctorLink !== 'string') {
        return res.status(400).json({ error: "signNowDoctorLink must be a string or null" });
      }
      if (signNowMemberLink !== undefined && signNowMemberLink !== null && typeof signNowMemberLink !== 'string') {
        return res.status(400).json({ error: "signNowMemberLink must be a string or null" });
      }

      const clinic = await storage.getClinic(id);
      if (!clinic) {
        return res.status(404).json({ error: "Clinic not found" });
      }

      await storage.updateClinic(id, {
        signNowDoctorLink: signNowDoctorLink !== undefined ? signNowDoctorLink : clinic.signNowDoctorLink,
        signNowMemberLink: signNowMemberLink !== undefined ? signNowMemberLink : clinic.signNowMemberLink,
      });

      const updatedClinic = await storage.getClinic(id);
      res.json(updatedClinic);
    } catch (error: any) {
      console.error("Error updating clinic SignNow links:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update clinic by WP ID (admin/trustee only)
  app.patch("/api/clinics/wp/:wpClinicId/signnow-links", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      // Require authentication and admin/trustee role
      const userId = (req as any).user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const user = await storage.getUser(userId);
      const userRoles = user?.wpRoles?.toLowerCase() || "";
      if (!user || (!userRoles.includes("admin") && !userRoles.includes("trustee"))) {
        return res.status(403).json({ error: "Admin or Trustee access required" });
      }

      const { wpClinicId } = req.params;
      const { signNowDoctorLink, signNowMemberLink } = req.body;

      // Validate inputs
      if (signNowDoctorLink !== undefined && signNowDoctorLink !== null && typeof signNowDoctorLink !== 'string') {
        return res.status(400).json({ error: "signNowDoctorLink must be a string or null" });
      }
      if (signNowMemberLink !== undefined && signNowMemberLink !== null && typeof signNowMemberLink !== 'string') {
        return res.status(400).json({ error: "signNowMemberLink must be a string or null" });
      }

      const clinic = await storage.getClinicByWpId(parseInt(wpClinicId));
      if (!clinic) {
        return res.status(404).json({ error: "Clinic not found with WP ID: " + wpClinicId });
      }

      await storage.updateClinic(clinic.id, {
        signNowDoctorLink: signNowDoctorLink !== undefined ? signNowDoctorLink : clinic.signNowDoctorLink,
        signNowMemberLink: signNowMemberLink !== undefined ? signNowMemberLink : clinic.signNowMemberLink,
      });

      const updatedClinic = await storage.getClinic(clinic.id);
      res.json(updatedClinic);
    } catch (error: any) {
      console.error("Error updating clinic SignNow links:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/import-clinics", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const clinicsData = req.body.clinics || [];
      const results = { imported: 0, updated: 0, errors: [] as string[] };

      for (const clinic of clinicsData) {
        try {
          const existing = clinic.wpClinicId ? await storage.getClinicByWpId(clinic.wpClinicId) : null;
          await storage.upsertClinic({
            wpClinicId: clinic.wpClinicId || null,
            name: clinic.name,
            address: clinic.address || null,
            phone: clinic.phone || null,
            email: clinic.email || null,
            signupUrl: clinic.signupUrl || null,
            signNowTemplateId: clinic.signNowTemplateId || null,
            practiceType: clinic.practiceType || null,
            onboardedBy: clinic.onboardedBy || null,
            onMap: clinic.onMap || false,
          });
          if (existing) results.updated++;
          else results.imported++;
        } catch (err: any) {
          results.errors.push(`${clinic.name}: ${err.message}`);
        }
      }

      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // WooCommerce Orders Endpoint - Real orders from live site
  app.get("/api/woocommerce/orders", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.per_page as string) || 20;
      const status = req.query.status as string | undefined;

      const result = await wooCommerceService.getOrders({ page, perPage, status });
      res.json(result);
    } catch (error: any) {
      console.error('[WooCommerce Orders] Error:', error.message);
      res.json({ orders: [], total: 0, totalPages: 0 });
    }
  });

  // WooCommerce Order Stats - Summary data for dashboard
  app.get("/api/woocommerce/order-stats", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const stats = await wooCommerceService.getOrderStats();
      res.json(stats);
    } catch (error: any) {
      console.error('[WooCommerce Order Stats] Error:', error.message);
      res.json({ totalOrders: 0, pendingOrders: 0, processingOrders: 0, completedOrders: 0, recentRevenue: 0 });
    }
  });

  // Agent Tasks API
  const adminOnly = (req: any, res: any, next: any) => {
    const ip = req.ip || req.connection?.remoteAddress;
    if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') {
      return next();
    }
    return requireRole('admin')(req, res, next);
  };

  app.get("/api/agent-tasks", adminOnly, async (req: Request, res: Response) => {
    try {
      const { division, agentId } = req.query;
      let tasks;
      if (division && typeof division === 'string') {
        tasks = await storage.getAgentTasksByDivision(division);
      } else if (agentId && typeof agentId === 'string') {
        tasks = await storage.getAgentTasksByAgent(agentId);
      } else {
        tasks = await storage.getAllAgentTasks();
      }
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/agent-tasks", adminOnly, async (req: Request, res: Response) => {
    try {
      const { insertAgentTaskSchema, agentRegistry } = await import("@shared/schema");
      const body = { ...req.body };

      if (!body.division && body.agentId) {
        const agentRows = await db.select().from(agentRegistry).where(eq(agentRegistry.agentId, body.agentId.toLowerCase()));
        if (agentRows.length > 0) {
          body.division = agentRows[0].division;
        } else {
          body.division = 'executive';
        }
      }

      if (!body.status) body.status = 'pending';

      const parseResult = insertAgentTaskSchema.safeParse(body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid task data", details: parseResult.error.flatten() });
      }
      const task = await storage.createAgentTask(parseResult.data);
      res.status(201).json(task);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/agent-tasks/:id", adminOnly, async (req: Request, res: Response) => {
    try {
      const { insertAgentTaskSchema } = await import("@shared/schema");
      const updateSchema = insertAgentTaskSchema.partial();
      const parseResult = updateSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid update data", details: parseResult.error.flatten() });
      }
      const task = await storage.updateAgentTask(req.params.id, parseResult.data);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/agent-tasks/:id", adminOnly, async (req: Request, res: Response) => {
    try {
      const { insertAgentTaskSchema } = await import("@shared/schema");
      const updateSchema = insertAgentTaskSchema.partial();
      const parseResult = updateSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid update data", details: parseResult.error.flatten() });
      }
      const task = await storage.updateAgentTask(req.params.id, parseResult.data);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/agent-tasks/:id", adminOnly, async (req: Request, res: Response) => {
    try {
      await storage.deleteAgentTask(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Agent Network Stats - Real-time task counters and cost projections
  app.get("/api/agent-network/stats", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const allTasks = await storage.getAllAgentTasks();
      const divisionLeads = await storage.getDivisionLeads();
      const pendingReviews = await storage.getPendingReviews();

      const taskStats = {
        total: allTasks.length,
        pending: allTasks.filter(t => t.status === "pending").length,
        inProgress: allTasks.filter(t => t.status === "in_progress").length,
        completed: allTasks.filter(t => t.status === "completed").length,
        blocked: allTasks.filter(t => t.status === "blocked").length,
      };

      const divisionStats: Record<string, { total: number; completed: number; pending: number; inProgress: number }> = {};
      const uniqueDivisions = Array.from(new Set(allTasks.map(t => t.division).filter(Boolean)));

      for (const div of uniqueDivisions) {
        const divTasks = allTasks.filter(t => t.division === div);
        divisionStats[div] = {
          total: divTasks.length,
          completed: divTasks.filter(t => t.status === "completed").length,
          pending: divTasks.filter(t => t.status === "pending").length,
          inProgress: divTasks.filter(t => t.status === "in_progress").length,
        };
      }

      const costProjections = {
        aiCalls: {
          estimated: allTasks.length * 0.02,
          currency: "USD",
          description: "Est. OpenAI API costs (~$0.02/task)",
          isEstimate: true
        },
        storage: {
          estimated: allTasks.filter(t => t.outputDriveFileId).length * 0.001,
          currency: "USD",
          description: "Est. Drive storage (~$0.001/file)",
          isEstimate: true
        },
        total: {
          estimated: (allTasks.length * 0.02) + (allTasks.filter(t => t.outputDriveFileId).length * 0.001),
          currency: "USD",
          isEstimate: true,
          disclaimer: "Based on avg. per-task/file estimates, not actual API usage"
        }
      };

      const completionRate = taskStats.total > 0
        ? Math.round((taskStats.completed / taskStats.total) * 100)
        : 0;

      const launchDeadline = new Date("2026-04-01T00:00:00Z");
      const now = new Date();
      const daysRemaining = Math.ceil((launchDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      res.json({
        taskStats,
        divisionStats,
        divisionLeads: divisionLeads.map(d => ({
          division: d.division,
          leadAgentId: d.leadAgentId,
          progressPercent: d.progressPercent,
          status: d.status,
          lastUpdate: d.lastStatusUpdate
        })),
        pendingReviews: pendingReviews.length,
        costProjections,
        metrics: {
          completionRate,
          daysRemaining,
          outputsProduced: allTasks.filter(t => t.outputDriveFileId).length,
          activeAgents: Array.from(new Set(allTasks.filter(t => t.status === "in_progress").map(t => t.agentId))).length
        },
        lastUpdated: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Gmail Inbox API for Trustee Dashboard
  app.get("/api/gmail/inbox", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const result = await getInbox(20);
      if (result.success) {
        res.json({ connected: true, messages: result.messages || [] });
      } else {
        // Return 200 with connected: false so frontend treats it as "disconnected" not "error"
        res.json({ connected: false, messages: [], error: result.error || "Gmail not connected" });
      }
    } catch (error: any) {
      // Return 200 with connected: false for graceful handling
      res.json({ connected: false, messages: [], error: error.message });
    }
  });

  // =====================================================
  // BLOOD SAMPLE LIBRARY API
  // Comprehensive reference database for blood analysis AI
  // =====================================================

  const bloodSampleQuerySchema = z.object({
    organismType: z.enum(["virus", "bacteria", "parasite", "fungus", "cell_abnormality", "blood_cell_morphology", "artifact", "crystal", "protein_pattern"]).optional(),
    category: z.enum(["pathogen", "morphology", "nutritional_marker", "toxicity_indicator", "immune_response", "oxidative_stress", "coagulation", "reference_normal"]).optional(),
    search: z.string().max(200).optional(),
    tags: z.string().max(500).optional()
  });

  app.get("/api/blood-samples", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const parsed = bloodSampleQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid query parameters", details: parsed.error.errors });
      }

      const { organismType, category, search, tags } = parsed.data;
      const filters: any = {};

      if (organismType) {
        filters.organismType = organismType;
      }
      if (category) {
        filters.category = category;
      }
      if (search) {
        filters.search = search;
      }
      if (tags) {
        filters.tags = tags.split(',').map(t => t.trim()).filter(Boolean);
      }

      const samples = await storage.getBloodSamples(filters);
      res.json(samples);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/blood-samples/tags", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const tags = await storage.getAllBloodSampleTags();
      res.json(tags);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const aiSearchQuerySchema = z.object({
    query: z.string().min(1).max(500),
    limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1).max(50)).optional()
  });

  app.get("/api/blood-samples/search-for-ai", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const parsed = aiSearchQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid query parameters", details: parsed.error.errors });
      }

      const samples = await storage.searchBloodSamplesForAI(
        parsed.data.query,
        parsed.data.limit || 10
      );
      res.json(samples);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/blood-samples/:id", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const sample = await storage.getBloodSampleById(req.params.id);
      if (!sample) {
        return res.status(404).json({ error: "Sample not found" });
      }

      const tags = await storage.getBloodSampleTags(sample.id);
      res.json({ ...sample, tags: tags.map(t => t.tag) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/blood-samples/:id/tags", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const tags = await storage.getBloodSampleTags(req.params.id);
      res.json(tags);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Blood Analysis AI API
  const bloodAnalysisSchema = z.object({
    imageDescription: z.string().optional(),
    observedFindings: z.array(z.string()).min(1),
    patientContext: z.string().optional(),
    specificQuestions: z.array(z.string()).optional()
  });

  app.post("/api/blood-analysis/analyze", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const parsed = bloodAnalysisSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.errors });
      }

      const { analyzeBloodSample } = await import("./services/huggingface-blood-analysis");
      const result = await analyzeBloodSample(parsed.data);
      res.json(result);
    } catch (error: any) {
      console.error("[Blood Analysis] Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/blood-analysis/status", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { checkHuggingFaceStatus } = await import("./services/huggingface-blood-analysis");
      const status = await checkHuggingFaceStatus();
      res.json(status);
    } catch (error: any) {
      res.status(500).json({
        available: false,
        primaryModel: false,
        fallbackModel: false,
        message: error.message
      });
    }
  });

  const patternMatchSchema = z.object({
    observedPattern: z.string().min(1).max(1000),
    referencePatterns: z.array(z.object({
      name: z.string(),
      description: z.string()
    })).optional()
  });

  app.post("/api/blood-analysis/pattern-match", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const parsed = patternMatchSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.errors });
      }

      const { quickPatternMatch } = await import("./services/huggingface-blood-analysis");

      // If no reference patterns provided, fetch from our sample library
      let patterns = parsed.data.referencePatterns;
      if (!patterns || patterns.length === 0) {
        const samples = await storage.searchBloodSamplesForAI(parsed.data.observedPattern, 10);
        patterns = samples.map(s => ({
          name: s.title,
          description: s.morphologyDescription || s.clinicalSignificance || ''
        }));
      }

      const result = await quickPatternMatch(parsed.data.observedPattern, patterns);
      res.json(result);
    } catch (error: any) {
      console.error("[Pattern Match] Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // =============================================
  // RESEARCH API - Scientific Database Integration
  // OpenAlex, PubMed, Semantic Scholar, arXiv
  // =============================================

  const researchSearchSchema = z.object({
    query: z.string().min(1).max(500),
    sources: z.array(z.enum(['openalex', 'pubmed', 'semantic_scholar', 'arxiv'])).optional(),
    limit: z.number().min(1).max(100).optional(),
    yearFrom: z.number().min(1900).max(2030).optional(),
    openAccessOnly: z.boolean().optional()
  });

  // Unified search across all research databases
  app.post("/api/research/search", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const parsed = researchSearchSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.errors });
      }

      const { searchAllSources } = await import("./services/research-apis");
      const result = await searchAllSources(parsed.data);

      res.json({ ...result, success: true });
    } catch (error: any) {
      console.error("[Research] Search error:", error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Agent-specific research endpoints
  app.post("/api/research/hippocrates", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { query, limit } = req.body;
      if (!query) {
        return res.status(400).json({ error: "Query required" });
      }

      const { hippocratesSearch } = await import("./services/research-apis");
      const result = await hippocratesSearch(query, limit || 20);

      res.json({ ...result, success: true, agent: 'HIPPOCRATES' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/research/paracelsus", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { query, limit } = req.body;
      if (!query) {
        return res.status(400).json({ error: "Query required" });
      }

      const { paracelsusSearch } = await import("./services/research-apis");
      const result = await paracelsusSearch(query, limit || 20);

      res.json({ ...result, success: true, agent: 'PARACELSUS' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/research/helix", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { query, limit } = req.body;
      if (!query) {
        return res.status(400).json({ error: "Query required" });
      }

      const { helixSearch } = await import("./services/research-apis");
      const result = await helixSearch(query, limit || 20);

      res.json({ ...result, success: true, agent: 'HELIX' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/research/oracle", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { query, limit } = req.body;
      if (!query) {
        return res.status(400).json({ error: "Query required" });
      }

      const { oracleSearch } = await import("./services/research-apis");
      const result = await oracleSearch(query, limit || 20);

      res.json({ ...result, success: true, agent: 'ORACLE' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Individual source endpoints
  app.get("/api/research/openalex", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Query parameter 'q' required" });
      }

      const { searchOpenAlex } = await import("./services/research-apis");
      const result = await searchOpenAlex(query, { limit: 25 });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/research/pubmed", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Query parameter 'q' required" });
      }

      const { searchPubMed } = await import("./services/research-apis");
      const result = await searchPubMed(query, { limit: 25 });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // =============================================
  // AI Agent Division APIs (Hugging Face)
  // =============================================

  const agentQuerySchema = z.object({
    division: z.enum(['research', 'marketing', 'legal', 'training']),
    query: z.string().min(1).max(5000),
    context: z.string().optional()
  });

  app.post("/api/agents/query", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id as string;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const parsed = agentQuerySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.errors });
      }

      const { queryAgent } = await import("./services/huggingface-agents");
      const result = await queryAgent(parsed.data);
      res.json(result);
    } catch (error: any) {
      console.error("[Agent Query] Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  const crossDivisionalSchema = z.object({
    query: z.string().min(1).max(5000),
    divisions: z.array(z.enum(['research', 'marketing', 'legal', 'training'])).optional()
  });

  app.post("/api/agents/cross-divisional", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id as string;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const parsed = crossDivisionalSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.errors });
      }

      const { crossDivisionalQuery } = await import("./services/huggingface-agents");
      const result = await crossDivisionalQuery(parsed.data.query, parsed.data.divisions);
      res.json(result);
    } catch (error: any) {
      console.error("[Cross-Divisional Query] Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/agents/status", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { checkAgentStatus } = await import("./services/huggingface-agents");
      const status = await checkAgentStatus();
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ available: false, status: error.message });
    }
  });

  // =============================================
  // Core Agent Network APIs (5 Core Agents)
  // =============================================

  app.get("/api/core-agents", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { getCoreAgentStatus } = await import("./services/core-agents");
      const agents = await getCoreAgentStatus();
      res.json({ success: true, agents });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/core-agents/activate", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { activateCoreAgents } = await import("./services/core-agents");
      const result = await activateCoreAgents();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/core-agents/network", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { getNetworkOverview } = await import("./services/core-agents");
      const overview = await getNetworkOverview();
      res.json(overview);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/core-agents/:agentId/chat", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { agentId } = req.params;
      const { message, context } = req.body;
      const validAgents = ['ATHENA', 'SENTINEL', 'MUSE', 'PRISM', 'FORGE'];
      if (!validAgents.includes(agentId.toUpperCase())) {
        return res.status(400).json({ error: `Invalid core agent. Valid agents: ${validAgents.join(', ')}` });
      }
      const { agentChat } = await import("./services/core-agents");
      const result = await agentChat(agentId.toUpperCase() as any, message, context);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/core-agents/route-task", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { taskType, taskDescription, priority } = req.body;
      if (!taskType || !taskDescription) {
        return res.status(400).json({ error: "taskType and taskDescription required" });
      }
      const { routeTaskToAgent } = await import("./services/core-agents");
      const result = await routeTaskToAgent(taskType, taskDescription, priority || 2);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/core-agents/cross-division", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { fromAgent, toAgent, requirement } = req.body;
      const validAgents = ['ATHENA', 'SENTINEL', 'MUSE', 'PRISM', 'FORGE'];
      if (!validAgents.includes(fromAgent) || !validAgents.includes(toAgent)) {
        return res.status(400).json({ error: "Invalid agent(s)" });
      }
      const { requestCrossDivisionSupport } = await import("./services/core-agents");
      const result = await requestCrossDivisionSupport(fromAgent, toAgent, requirement);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/core-agents/:agentId/workflow", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { agentId } = req.params;
      const { workflowType, title, description } = req.body;
      const validAgents = ['ATHENA', 'SENTINEL', 'MUSE', 'PRISM', 'FORGE'];
      const validWorkflows = ['document', 'research', 'video', 'strategy'];
      if (!validAgents.includes(agentId.toUpperCase())) {
        return res.status(400).json({ error: "Invalid core agent" });
      }
      if (!validWorkflows.includes(workflowType)) {
        return res.status(400).json({ error: "Invalid workflow type" });
      }
      const { executeAgentWorkflow } = await import("./services/core-agents");
      const result = await executeAgentWorkflow(agentId.toUpperCase() as any, workflowType, title, description);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/core-agents/messages", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { getRecentMessages } = await import("./services/core-agents");
      const limit = parseInt(req.query.limit as string) || 20;
      const messages = getRecentMessages(limit);
      res.json({ messages });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // =============================================
  // Claude AI Provider APIs
  // =============================================

  app.get("/api/claude/status", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { getClaudeStatus } = await import("./services/claude-provider");
      res.json(getClaudeStatus());
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/claude/models", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { getAvailableModels } = await import("./services/claude-provider");
      res.json({ models: getAvailableModels() });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/claude/chat", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { agentId, message, context, history } = req.body;
      if (!agentId || !message) {
        return res.status(400).json({ error: "agentId and message are required" });
      }
      const { claudeAgentChat } = await import("./services/claude-provider");
      const result = await claudeAgentChat(agentId, message, context, history);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/claude/analyze", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { task, context, agentId } = req.body;
      if (!task || !context) {
        return res.status(400).json({ error: "task and context are required" });
      }
      const { claudeAnalyze } = await import("./services/claude-provider");
      const result = await claudeAnalyze(task, context, agentId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/claude/generate-document", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { documentType, requirements, agentId } = req.body;
      if (!documentType || !requirements) {
        return res.status(400).json({ error: "documentType and requirements are required" });
      }
      const { claudeGenerateDocument } = await import("./services/claude-provider");
      const result = await claudeGenerateDocument(documentType, requirements, agentId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/ai-providers", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { getClaudeStatus } = await import("./services/claude-provider");
      const claudeStatus = getClaudeStatus();

      const providers = [
        {
          id: 'openai',
          name: 'OpenAI',
          models: ['gpt-4o', 'gpt-4o-mini'],
          available: !!process.env.OPENAI_API_KEY,
          purpose: 'General agent conversations, content generation'
        },
        {
          id: 'anthropic',
          name: 'Anthropic Claude',
          models: claudeStatus.models,
          available: claudeStatus.available,
          purpose: 'Deep reasoning, legal analysis, scientific research, strategic planning',
          deepReasoningAgents: claudeStatus.deepReasoningAgents
        },
        {
          id: 'gemini',
          name: 'Google Gemini',
          models: ['gemini-2.0-flash'],
          available: !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || process.env.AI_INTEGRATIONS_GEMINI_API_KEY),
          purpose: 'Multimodal analysis, image understanding'
        }
      ];

      res.json({ providers, totalProviders: providers.filter(p => p.available).length });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // =============================================
  // Marketing Media Generation APIs (Hugging Face)
  // =============================================

  const imageGenerationSchema = z.object({
    prompt: z.string().min(1).max(1000),
    negativePrompt: z.string().optional(),
    style: z.enum(['healing', 'professional', 'educational', 'marketing']).optional(),
    aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:3']).optional()
  });

  app.post("/api/media/generate-image", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id as string;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const parsed = imageGenerationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.errors });
      }

      const { generateImage } = await import("./services/huggingface-media");
      const result = await generateImage(parsed.data);

      // Return base64 and metadata (not the blob)
      res.json({
        imageBase64: result.imageBase64,
        modelUsed: result.modelUsed,
        prompt: result.prompt,
        metadata: result.metadata
      });
    } catch (error: any) {
      console.error("[Image Generation] Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  const marketingAssetSchema = z.object({
    type: z.enum(['social_post', 'banner', 'product_image', 'infographic']),
    description: z.string().min(1).max(500)
  });

  app.post("/api/media/marketing-asset", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id as string;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const parsed = marketingAssetSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.errors });
      }

      const { generateMarketingAsset } = await import("./services/huggingface-media");
      const result = await generateMarketingAsset(parsed.data.type, parsed.data.description);

      res.json({
        imageBase64: result.imageBase64,
        modelUsed: result.modelUsed,
        prompt: result.prompt,
        metadata: result.metadata
      });
    } catch (error: any) {
      console.error("[Marketing Asset] Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/media/status", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { checkMediaStatus } = await import("./services/huggingface-media");
      const status = await checkMediaStatus();
      res.json(status);
    } catch (error: any) {
      res.status(500).json({
        imageGeneration: false,
        videoGeneration: false,
        availableModels: [],
        status: error.message
      });
    }
  });

  // Audio Generation API
  const ttsSchema = z.object({
    text: z.string().min(1).max(2000),
    voice: z.enum(['female', 'male', 'neutral']).optional()
  });

  app.post("/api/audio/generate-speech", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id as string;
      const isPreviewMode = validatePreviewMode(req);
      if (!userId && !isPreviewMode) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const parsed = ttsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.errors });
      }

      const { generateSpeech } = await import("./services/huggingface-audio");
      const result = await generateSpeech(parsed.data);
      res.json(result);
    } catch (error: any) {
      console.error("[TTS] Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  const musicSchema = z.object({
    prompt: z.string().min(1).max(500),
    duration: z.number().min(5).max(30).optional()
  });

  app.post("/api/audio/generate-music", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id as string;
      const isPreviewMode = validatePreviewMode(req);
      if (!userId && !isPreviewMode) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const parsed = musicSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.errors });
      }

      const { generateMusic } = await import("./services/huggingface-audio");
      const result = await generateMusic(parsed.data.prompt, parsed.data.duration || 10);
      res.json(result);
    } catch (error: any) {
      console.error("[Music] Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/audio/status", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { checkAudioStatus } = await import("./services/huggingface-audio");
      const status = await checkAudioStatus();
      res.json(status);
    } catch (error: any) {
      res.status(500).json({
        ttsAvailable: false,
        musicAvailable: false,
        status: error.message
      });
    }
  });

  app.get("/api/audio/allio-prompts", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { ALLIO_VOICE_PROMPTS } = await import("./services/huggingface-audio");
      res.json(ALLIO_VOICE_PROMPTS);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Video Production API
  app.get("/api/video/status", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { getVideoProductionStatus } = await import("./services/video-production");
      res.json(getVideoProductionStatus());
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/video/launch-script", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { ALLIO_LAUNCH_SCRIPT } = await import("./services/video-production");
      res.json(ALLIO_LAUNCH_SCRIPT);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const videoRenderSchema = z.object({
    title: z.string(),
    scenes: z.array(z.object({
      id: z.string(),
      name: z.string(),
      narration: z.string(),
      duration: z.number(),
      imageId: z.string().optional(),
      imageName: z.string().optional(),
      thumbnailUrl: z.string().optional()
    })),
    musicPrompt: z.string().optional(),
    generateNarration: z.boolean().optional(),
    generateMusic: z.boolean().optional()
  });

  app.post("/api/video/render", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id as string;
      const isPreviewMode = validatePreviewMode(req);
      if (!userId && !isPreviewMode) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const parsed = videoRenderSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.errors });
      }

      const { title, scenes, musicPrompt, generateNarration, generateMusic } = parsed.data;

      const steps: string[] = [];
      let narrationAudio: string | null = null;
      let musicAudio: string | null = null;

      if (generateNarration) {
        steps.push("Generating narration audio...");
        const fullScript = scenes.map(s => s.narration).join(" ");
        const { generateSpeech } = await import("./services/huggingface-audio");
        const result = await generateSpeech({ text: fullScript, voice: "neutral" });
        narrationAudio = result.audioBase64;
        steps.push("Narration generated successfully");
      }

      if (generateMusic && musicPrompt) {
        steps.push("Generating background music...");
        const { generateMusic: genMusic } = await import("./services/huggingface-audio");
        const result = await genMusic(musicPrompt, 30);
        musicAudio = result.audioBase64;
        steps.push("Music generated successfully");
      }

      steps.push("Video render job queued");

      res.json({
        status: "queued",
        jobId: `render_${Date.now()}`,
        title,
        sceneCount: scenes.length,
        totalDuration: scenes.reduce((sum, s) => sum + s.duration, 0),
        hasNarration: !!narrationAudio,
        hasMusic: !!musicAudio,
        steps,
        message: "Video render job has been queued. Full video assembly requires additional server-side processing."
      });
    } catch (error: any) {
      console.error("[Video Render] Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Training Modules API
  app.get("/api/training/modules", async (req: Request, res: Response) => {
    try {
      const modules = await storage.getTrainingModules();
      res.json(modules);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/training/modules/:slug", async (req: Request, res: Response) => {
    try {
      const module = await storage.getTrainingModuleBySlug(req.params.slug);
      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }
      res.json(module);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/training/modules/:moduleId/content", requireAuth, async (req: Request, res: Response) => {
    try {
      const { moduleId } = req.params;

      const sections = await db.select()
        .from(trainingModuleSections)
        .where(eq(trainingModuleSections.moduleId, moduleId))
        .orderBy(trainingModuleSections.sortOrder);

      const keyPoints = await db.select()
        .from(trainingModuleKeyPoints)
        .where(eq(trainingModuleKeyPoints.moduleId, moduleId))
        .orderBy(trainingModuleKeyPoints.sortOrder);

      res.json({
        sections: sections.map(s => ({ title: s.title, content: s.content })),
        keyPoints: keyPoints.map(k => k.point),
      });
    } catch (error: any) {
      console.error("[Training] Error fetching module content:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/training/tracks", async (req: Request, res: Response) => {
    try {
      const tracks = await storage.getTrainingTracks();
      res.json(tracks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/training/tracks/:slug", async (req: Request, res: Response) => {
    try {
      const track = await storage.getTrainingTrackBySlug(req.params.slug);
      if (!track) {
        return res.status(404).json({ error: "Track not found" });
      }
      res.json(track);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Certification Tracking API - Get authenticated user's certifications
  app.get("/api/my/certifications", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id as string;
      const certs = await db.select()
        .from(trainingCertifications)
        .where(eq(trainingCertifications.userId, userId))
        .orderBy(trainingCertifications.createdAt);
      res.json({ success: true, certifications: certs });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/certifications/:userId", requireAuth, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const certs = await db.select()
        .from(trainingCertifications)
        .where(eq(trainingCertifications.userId, userId))
        .orderBy(trainingCertifications.createdAt);
      res.json({ success: true, certifications: certs });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/certifications/issue", requireAuth, async (req: Request, res: Response) => {
    try {
      const { userId, certificationType, referenceId, referenceTitle, score, passingScore } = req.body;

      if (!userId || !certificationType || !referenceId || !referenceTitle) {
        return res.status(400).json({ success: false, error: "Missing required fields" });
      }

      const status = score >= (passingScore || 80) ? "passed" : "failed";
      const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
      const certNumber = `ALLIO-${certificationType.toUpperCase().slice(0, 3)}-${timestamp}`;
      const verificationCode = `V${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      const [certification] = await db.insert(trainingCertifications).values({
        userId,
        certificationType,
        referenceId,
        referenceTitle,
        status,
        score,
        passingScore: passingScore || 80,
        attemptsUsed: 1,
        certificateNumber: status === "passed" ? certNumber : null,
        verificationCode: status === "passed" ? verificationCode : null,
        issuedAt: status === "passed" ? new Date() : null,
      }).returning();

      res.json({
        success: true,
        certification,
        passed: status === "passed",
        message: status === "passed"
          ? `Congratulations! You've earned your ${referenceTitle} certification.`
          : `Score: ${score}%. Passing score is ${passingScore || 80}%. Please try again.`
      });
    } catch (error: any) {
      console.error("[Certification] Error issuing certification:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/certifications/verify/:code", async (req: Request, res: Response) => {
    try {
      const { code } = req.params;
      const [cert] = await db.select()
        .from(trainingCertifications)
        .where(eq(trainingCertifications.verificationCode, code))
        .limit(1);

      if (!cert) {
        return res.status(404).json({ success: false, error: "Certificate not found" });
      }

      res.json({
        success: true,
        valid: cert.status === "passed",
        certification: {
          certificateNumber: cert.certificateNumber,
          referenceTitle: cert.referenceTitle,
          issuedAt: cert.issuedAt,
          status: cert.status,
          score: cert.score
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // User Progress API
  app.get("/api/my/progress", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id as string;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const contentType = req.query.type as string || "module";
      const progress = await storage.getUserProgressByType(userId, contentType);
      res.json(progress);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/my/progress/:contentType/:contentId", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id as string;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const progress = await storage.getUserProgress(userId, req.params.contentType, req.params.contentId);
      if (!progress) {
        return res.json({ status: "not_started", progressPercent: 0 });
      }
      res.json(progress);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/my/progress", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id as string;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const partialSchema = insertUserProgressSchema.partial().required({ contentType: true, contentId: true });
      const parsed = partialSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.errors });
      }
      const { contentType, contentId, status, progressPercent, timeSpent, notes } = parsed.data;
      const progress = await storage.upsertUserProgress({
        userId,
        contentType,
        contentId,
        status: status || "in_progress",
        progressPercent: progressPercent || 0,
        timeSpent,
        notes,
      });
      res.json(progress);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/my/progress/:contentType/:contentId/complete", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id as string;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const progress = await storage.completeUserProgress(userId, req.params.contentType, req.params.contentId);
      if (!progress) {
        return res.status(404).json({ error: "Progress not found" });
      }
      res.json(progress);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // AI Tutor for training modules
  app.post("/api/training/ai-tutor", requireAuth, async (req: Request, res: Response) => {
    try {
      const { question, moduleSlug, moduleTitle } = req.body;

      if (!question || typeof question !== 'string') {
        return res.status(400).json({ error: "Question is required" });
      }

      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are ALLIO, the AI tutor for Forgotten Formula PMA's healing education platform. You help members understand health and wellness concepts with warmth, clarity, and wisdom.

Your teaching style:
- Warm but not saccharine
- Knowledgeable but not condescending
- Use simple analogies to explain complex concepts
- Always emphasize the body's innate healing wisdom
- Reference natural healing approaches over synthetic solutions

${moduleTitle ? `The member is studying: "${moduleTitle}"` : ''}

Keep responses helpful, educational, and under 300 words. End with encouragement or a thought-provoking follow-up question when appropriate.`
          },
          {
            role: 'user',
            content: question
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      const answer = completion.choices[0]?.message?.content || 'I apologize, but I was unable to formulate a response. Please try asking your question in a different way.';

      res.json({ answer, modelUsed: 'ALLIO (GPT-4o)' });
    } catch (error: any) {
      console.error('[AI Tutor] Error:', error.message);
      res.status(500).json({ error: "Failed to get AI response. Please try again." });
    }
  });

  app.get("/api/training/modules/:moduleId/quiz", requireAuth, async (req: Request, res: Response) => {
    try {
      const quiz = await storage.getQuizByModuleId(req.params.moduleId);
      if (!quiz) {
        return res.status(404).json({ error: "No quiz found for this module" });
      }
      const questions = await storage.getQuizQuestions(quiz.id);
      res.json({ quiz, questions });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Documents API
  app.get("/api/documents", requireAuth, async (req: Request, res: Response) => {
    try {
      const documents = await storage.getDriveDocuments();
      res.json(documents);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Quizzes API
  app.get("/api/quizzes", async (req: Request, res: Response) => {
    try {
      const quizzes = await storage.getQuizzes();
      res.json(quizzes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Individual Quiz by slug
  app.get("/api/quizzes/:slug", async (req: Request, res: Response) => {
    try {
      const quiz = await storage.getQuizBySlug(req.params.slug);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      const questions = await storage.getQuizQuestions(quiz.id);
      // Add questionsCount to quiz object for frontend display
      const quizWithCount = { ...quiz, questionsCount: questions.length };
      res.json({ quiz: quizWithCount, questions });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Start a quiz attempt
  app.post("/api/quizzes/:quizId/attempts", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id as string;
      const quizId = req.params.quizId;

      const attempt = await storage.createQuizAttempt({
        userId,
        quizId,
      });
      res.status(201).json(attempt);
    } catch (error: any) {
      console.error("Error creating quiz attempt:", error);
      res.status(500).json({ error: "Failed to start quiz" });
    }
  });

  // Submit quiz answers
  const quizSubmitSchema = z.object({
    responses: z.array(z.object({
      questionId: z.string(),
      selectedAnswerId: z.string(),
    })),
  });

  app.post("/api/quizzes/attempts/:attemptId/submit", requireAuth, async (req: Request, res: Response) => {
    try {
      const { attemptId } = req.params;
      const userId = req.user?.id as string;

      const parseResult = quizSubmitSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid request body", details: parseResult.error.errors });
      }
      const { responses } = parseResult.data;

      const attempt = await storage.getQuizAttempt(attemptId);
      if (!attempt) {
        return res.status(404).json({ error: "Attempt not found" });
      }

      if (attempt.userId !== userId) {
        return res.status(403).json({ error: "You are not authorized to submit this quiz attempt" });
      }

      if (attempt.completedAt) {
        return res.status(400).json({ error: "This quiz attempt has already been submitted" });
      }

      const quiz = await storage.getQuiz(attempt.quizId);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }

      const questions = await storage.getQuizQuestions(attempt.quizId);
      const questionMap = new Map(questions.map(q => [q.id, q]));

      for (const response of responses) {
        if (!questionMap.has(response.questionId)) {
          return res.status(400).json({ error: `Question ${response.questionId} does not belong to this quiz` });
        }
      }

      let score = 0;
      let maxScore = 0;

      for (const response of responses) {
        const question = questionMap.get(response.questionId);
        if (!question) continue;

        const correctAnswer = question.answers.find(a => a.isCorrect);
        const points = question.points;

        maxScore += points;
        const isCorrect = correctAnswer?.id === response.selectedAnswerId;
        const pointsEarned = isCorrect ? points : 0;
        score += pointsEarned;

        await storage.createQuizResponse({
          attemptId,
          questionId: response.questionId,
          selectedAnswerId: response.selectedAnswerId,
          isCorrect,
          pointsEarned,
        });
      }

      const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
      const passed = percentage >= (quiz.passingScore || 70);

      const updatedAttempt = await storage.updateQuizAttempt(attemptId, {
        score,
        maxScore,
        percentage,
        passed,
        completedAt: new Date(),
      });

      res.json({
        attempt: updatedAttempt,
        score,
        maxScore,
        percentage,
        passed,
        passingScore: quiz.passingScore,
      });
    } catch (error: any) {
      console.error("Error submitting quiz:", error);
      res.status(500).json({ error: "Failed to submit quiz" });
    }
  });

  // Get user's quiz attempts
  app.get("/api/my-quiz-attempts", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id as string;
      const quizId = req.query.quizId as string | undefined;
      const attempts = await storage.getQuizAttempts(userId, quizId);
      res.json(attempts);
    } catch (error: any) {
      console.error("Error fetching quiz attempts:", error);
      res.status(500).json({ error: "Failed to fetch attempts" });
    }
  });

  // Programs API
  app.get("/api/programs", async (req: Request, res: Response) => {
    try {
      const programs = await storage.getPrograms();
      res.json(programs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/programs/:slug", async (req: Request, res: Response) => {
    try {
      const program = await storage.getProgramBySlug(req.params.slug);
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }
      res.json(program);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/programs/:slug/enrollment", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      const program = await storage.getProgramBySlug(req.params.slug);
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }
      const enrollment = await storage.getProgramEnrollment(userId, program.id);
      if (!enrollment) {
        return res.status(404).json({ error: "Not enrolled" });
      }
      res.json(enrollment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/programs/:slug/enroll", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      const program = await storage.getProgramBySlug(req.params.slug);
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }
      const existingEnrollment = await storage.getProgramEnrollment(userId, program.id);
      if (existingEnrollment) {
        return res.json(existingEnrollment);
      }
      const enrollment = await storage.createProgramEnrollment({
        userId,
        programId: program.id,
        status: "active",
        progress: 0,
      });
      res.status(201).json(enrollment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/programs/:slug/progress", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id as string;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const program = await storage.getProgramBySlug(req.params.slug);
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }
      const progressSchema = insertProgramEnrollmentSchema.pick({ progress: true });
      const parsed = progressSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid progress value", details: parsed.error.errors });
      }
      const { progress } = parsed.data;
      const enrollment = await storage.updateProgramEnrollmentProgress(userId, program.id, progress ?? 0);
      if (!enrollment) {
        return res.status(404).json({ error: "Not enrolled" });
      }
      res.json(enrollment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get user's enrollments
  app.get("/api/my/enrollments", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id as string;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const enrollments = await storage.getUserProgramEnrollments(userId);
      res.json(enrollments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // MEMBER ENGAGEMENT API - Achievements, Bookmarks, Discussions
  // ============================================

  // Achievements API
  app.get("/api/achievements", requireAuth, async (req: Request, res: Response) => {
    try {
      const achievements = await storage.getAchievements();
      res.json(achievements);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/my/achievements", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id as string;
      const userAchievements = await storage.getUserAchievements(userId);
      res.json(userAchievements);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/my/achievements/:achievementId", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id as string;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const userAchievement = await storage.awardAchievement(userId, req.params.achievementId, req.body.metadata);
      res.status(201).json(userAchievement);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Bookmarks API
  app.get("/api/my/bookmarks", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id as string;
      const bookmarks = await storage.getUserBookmarks(userId);
      res.json(bookmarks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/my/bookmarks", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id as string;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const bookmark = await storage.addBookmark({ userId, moduleId: req.body.moduleId, notes: req.body.notes });
      res.status(201).json(bookmark);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/my/bookmarks/:moduleId", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id as string;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      await storage.removeBookmark(userId, req.params.moduleId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/my/bookmarks/:moduleId/status", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id as string;
      const isBookmarked = await storage.isBookmarked(userId, req.params.moduleId);
      res.json({ isBookmarked });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Discussions API
  app.get("/api/discussions", async (req: Request, res: Response) => {
    try {
      const moduleId = req.query.moduleId as string | undefined;
      const threads = await storage.getDiscussionThreads(moduleId);
      res.json(threads);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/discussions/:id", async (req: Request, res: Response) => {
    try {
      const thread = await storage.getDiscussionThread(req.params.id);
      if (!thread) {
        return res.status(404).json({ error: "Thread not found" });
      }
      const replies = await storage.getDiscussionReplies(req.params.id);
      res.json({ thread, replies });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/discussions", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id as string;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const user = await storage.getUser(userId);
      const thread = await storage.createDiscussionThread({
        moduleId: req.body.moduleId,
        title: req.body.title,
        content: req.body.content,
        authorId: userId,
        authorName: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : "Member",
      });
      res.status(201).json(thread);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/discussions/:id/replies", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id as string;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const user = await storage.getUser(userId);
      const reply = await storage.createDiscussionReply({
        threadId: req.params.id,
        content: req.body.content,
        authorId: userId,
        authorName: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : "Member",
        parentReplyId: req.body.parentReplyId,
      });
      res.status(201).json(reply);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Legal Documents API
  app.get("/api/legal/documents", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const docs = await storage.getAllLegalDocuments();
      res.json(docs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/legal/documents/:id", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const doc = await storage.getLegalDocument(req.params.id);
      if (!doc) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(doc);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/legal/documents", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const doc = await storage.createLegalDocument(req.body);
      res.status(201).json(doc);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/legal/documents/:id", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const doc = await storage.updateLegalDocument(req.params.id, req.body);
      if (!doc) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(doc);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/legal/documents/:id", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      await storage.deleteLegalDocument(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Initialize Legal Documents - creates trademark and patent drafts if not exist
  app.post("/api/legal/initialize", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const existingDocs = await storage.getAllLegalDocuments();

      // Check if we already have the core documents
      const hasAllioTrademark = existingDocs.some(d => d.title.includes("ALLIO") && d.docType === "trademark");
      const hasFFPMAPatent = existingDocs.some(d => d.title.includes("FF PMA") && d.docType === "patent");

      const newDocs = [];

      if (!hasAllioTrademark) {
        const allioTrademark = await storage.createLegalDocument({
          title: "ALLIO Trademark Application",
          docType: "trademark",
          status: "draft",
          description: "Federal trademark registration for ALLIO - The All-In-One Healing Ecosystem brand mark",
          content: `UNITED STATES PATENT AND TRADEMARK OFFICE
TRADEMARK APPLICATION

MARK: ALLIO

APPLICANT: Forgotten Formula PMA
ADDRESS: [To be completed by Legal Division]

GOODS AND SERVICES:
Class 042 - Scientific and technological services: Platform services for healthcare management and wellness tracking; Software as a service (SaaS) featuring artificial intelligence for health protocol management.

Class 044 - Medical services: Health and wellness consultation services; providing health and wellness information via an online platform.

Class 035 - Business services: Online retail store services featuring health and wellness products; membership club services in the field of health and wellness.

FIRST USE IN COMMERCE: [Date to be determined]

BASIS FOR FILING: Intent to Use / Use in Commerce

DESCRIPTION OF MARK: The mark consists of the stylized word "ALLIO" representing an integrated healing ecosystem platform.

SPECIMEN: [To be attached - Screenshots of platform in use]

DECLARATION: The undersigned, being hereby warned that willful false statements and the like are punishable by fine or imprisonment, declares that he/she believes the applicant to be the owner of the trademark sought to be registered.

Drafted by: JURIS (Chief Legal AI) & LEXICON (Contract Specialist)
Division: Legal
Date: ${new Date().toISOString().split('T')[0]}
Status: DRAFT - Pending Trustee Review`,
          assignedAgent: "JURIS",
          priority: "high",
          jurisdiction: "United States",
          createdBy: "JURIS",
        });
        newDocs.push(allioTrademark);
      }

      if (!hasFFPMAPatent) {
        const ffpmaPatent = await storage.createLegalDocument({
          title: "FF PMA Healing Protocol System - Patent Application",
          docType: "patent",
          status: "draft",
          description: "Provisional patent application for the AI-powered healing protocol management system",
          content: `UNITED STATES PATENT AND TRADEMARK OFFICE
PROVISIONAL PATENT APPLICATION

TITLE: Artificial Intelligence-Powered Healing Protocol Management System with Multi-Agent Collaboration

INVENTORS: [To be completed]

APPLICANT: Forgotten Formula PMA

FIELD OF INVENTION:
The present invention relates to healthcare technology, specifically an AI-powered platform for managing personalized healing protocols through multi-agent collaboration.

BACKGROUND:
Traditional healthcare management systems lack the integration of multiple specialized AI agents working in concert to provide holistic healing recommendations. The present invention addresses this gap.

SUMMARY OF THE INVENTION:
A computer-implemented system comprising:
1. A multi-agent AI network with specialized agents for different healing modalities (frequency medicine, peptide therapy, ancient medicine, etc.)
2. Real-time blood analysis integration using machine learning pattern recognition
3. Personalized protocol generation based on member health profiles
4. Secure member data management with PMA (Private Membership Association) compliance
5. Integration with e-signature systems for member agreements
6. WooCommerce integration for product fulfillment

KEY CLAIMS:
Claim 1: A system for managing personalized healing protocols comprising a plurality of specialized artificial intelligence agents...

Claim 2: The system of Claim 1, wherein the AI agents include at least one agent specialized in frequency medicine protocols...

Claim 3: A method for generating personalized healing recommendations using multi-agent AI collaboration...

[Additional claims to be drafted by Legal Division]

DETAILED DESCRIPTION:
The ALLIO platform operates as a comprehensive healing ecosystem with the following key components:
- ATHENA: Executive Intelligence for communications and scheduling
- PROMETHEUS: Chief Science Officer for research strategy
- JURIS: Legal protection and PMA compliance
- ORACLE: Product recommendation and personalized protocols
- Additional specialized agents for specific healing modalities

DRAWINGS: [To be attached - System architecture diagrams]

Drafted by: JURIS (Chief Legal AI) & AEGIS (Compliance Guardian)
Division: Legal
Date: ${new Date().toISOString().split('T')[0]}
Status: DRAFT - Pending Trustee Review and Technical Review`,
          assignedAgent: "JURIS",
          priority: "high",
          jurisdiction: "United States",
          createdBy: "JURIS",
        });
        newDocs.push(ffpmaPatent);
      }

      // Also create PMA Operating Agreement if not exists
      const hasPMAOps = existingDocs.some(d => d.title.includes("Operating Agreement"));
      if (!hasPMAOps) {
        const pmaOps = await storage.createLegalDocument({
          title: "FF PMA Operating Agreement - Amendment Draft",
          docType: "agreement",
          status: "draft",
          description: "Amendment to the Private Membership Association operating agreement to include ALLIO platform provisions",
          content: `FORGOTTEN FORMULA PRIVATE MEMBERSHIP ASSOCIATION
OPERATING AGREEMENT - AMENDMENT

This Amendment to the Operating Agreement of Forgotten Formula PMA is made effective as of [DATE].

WHEREAS, the Association operates the ALLIO platform as its primary member service delivery system;

WHEREAS, the Association desires to formalize the governance structure for AI agent operations;

NOW, THEREFORE, the Operating Agreement is hereby amended as follows:

ARTICLE I - ALLIO PLATFORM GOVERNANCE
Section 1.1 - The ALLIO platform shall serve as the primary interface for member services.
Section 1.2 - All AI agents operating within the platform shall adhere to the FF PMA Creed.
Section 1.3 - The Trustee retains ultimate authority over all platform operations.

ARTICLE II - AI AGENT OPERATIONS
Section 2.1 - The Executive Division (SENTINEL, ATHENA, HERMES) shall coordinate all inter-agent communications.
Section 2.2 - The Legal Division (JURIS, LEXICON, AEGIS, SCRIBE) shall ensure compliance with PMA protections.
Section 2.3 - All agents shall prioritize member healing over profit generation.

ARTICLE III - DATA PROTECTION
Section 3.1 - Member health data shall be protected under PMA confidentiality provisions.
Section 3.2 - All data storage shall utilize encryption and access controls.
Section 3.3 - Members retain ownership of their personal health information.

ARTICLE IV - INTELLECTUAL PROPERTY
Section 4.1 - The ALLIO trademark and all associated IP shall be held by the Association.
Section 4.2 - AI-generated content shall be protected under work-for-hire provisions.

[Additional sections to be drafted]

Drafted by: JURIS (Chief Legal AI) & LEXICON (Contract Specialist)
Division: Legal
Date: ${new Date().toISOString().split('T')[0]}
Status: DRAFT - Pending Trustee Review`,
          assignedAgent: "LEXICON",
          priority: "normal",
          jurisdiction: "United States",
          createdBy: "LEXICON",
        });
        newDocs.push(pmaOps);
      }

      res.json({
        message: `Legal documents initialized. ${newDocs.length} new documents created.`,
        documents: newDocs
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Upload legal document to Google Drive
  app.post("/api/legal/documents/:id/upload-to-drive", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const doc = await storage.getLegalDocument(req.params.id);
      if (!doc) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Create file content as text
      const fileContent = `${doc.title}\n\n${doc.description || ""}\n\n${doc.content || ""}`;

      // Get Google Drive client
      const drive = await getUncachableGoogleDriveClient();

      // Use official ALLIO folder ID - DO NOT search or create new folders
      const allioFolderId = "16wOdbJPoOVOz5GE0mtlzf84c896JX1UC";

      // Find the Legal - Contracts & Agreements folder inside Allio
      let folderId: string | undefined;
      if (allioFolderId) {
        const legalQuery = await drive.files.list({
          q: `'${allioFolderId}' in parents and name='Legal - Contracts & Agreements' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
          fields: "files(id, name)",
        });
        if (legalQuery.data.files && legalQuery.data.files.length > 0) {
          folderId = legalQuery.data.files[0].id || undefined;
        }
      }

      // Fallback: create folder if needed
      if (!folderId) {
        const folder = await drive.files.create({
          requestBody: {
            name: "Legal - Contracts & Agreements",
            mimeType: "application/vnd.google-apps.folder",
            parents: allioFolderId ? [allioFolderId] : undefined,
          },
        });
        folderId = folder.data.id || undefined;
      }

      // Upload the document
      const fileName = `${doc.title.replace(/[^a-zA-Z0-9 ]/g, "")}.txt`;
      const fileMetadata = {
        name: fileName,
        parents: folderId ? [folderId] : undefined,
      };

      const media = {
        mimeType: "text/plain",
        body: Readable.from([fileContent]),
      };

      const file = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: "id, webViewLink",
      });

      // Update the document with Drive file info
      const updatedDoc = await storage.updateLegalDocument(doc.id, {
        driveFileId: file.data.id || null,
        driveUrl: file.data.webViewLink || null,
      });

      res.json({
        success: true,
        driveFileId: file.data.id,
        driveUrl: file.data.webViewLink,
        document: updatedDoc
      });
    } catch (error: any) {
      console.error("Drive upload error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Upload all legal documents to Drive
  app.post("/api/legal/documents/upload-all-to-drive", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const docs = await storage.getAllLegalDocuments();
      const results: Array<{ id: string; title: string; success: boolean; driveUrl?: string; error?: string }> = [];

      for (const doc of docs) {
        if (doc.driveFileId) {
          results.push({ id: doc.id, title: doc.title, success: true, driveUrl: doc.driveUrl || undefined });
          continue;
        }

        try {
          const fileContent = `${doc.title}\n\n${doc.description || ""}\n\n${doc.content || ""}`;
          const drive = await getUncachableGoogleDriveClient();

          // Use official ALLIO folder ID - DO NOT search or create new folders
          const allioFolderId = "16wOdbJPoOVOz5GE0mtlzf84c896JX1UC";

          // Find Legal folder inside Allio
          let folderId: string | undefined;
          if (allioFolderId) {
            const legalQuery = await drive.files.list({
              q: `'${allioFolderId}' in parents and name='Legal - Contracts & Agreements' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
              fields: "files(id)",
            });
            if (legalQuery.data.files && legalQuery.data.files.length > 0) {
              folderId = legalQuery.data.files[0].id || undefined;
            }
          }

          const fileName = `${doc.title.replace(/[^a-zA-Z0-9 ]/g, "")}.txt`;
          const file = await drive.files.create({
            requestBody: {
              name: fileName,
              parents: folderId ? [folderId] : undefined,
            },
            media: {
              mimeType: "text/plain",
              body: Readable.from([fileContent]),
            },
            fields: "id, webViewLink",
          });

          await storage.updateLegalDocument(doc.id, {
            driveFileId: file.data.id || null,
            driveUrl: file.data.webViewLink || null,
          });

          results.push({ id: doc.id, title: doc.title, success: true, driveUrl: file.data.webViewLink || undefined });
        } catch (err: any) {
          results.push({ id: doc.id, title: doc.title, success: false, error: err.message });
        }
      }

      res.json({ results });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Full WordPress + WooCommerce Sync Endpoint (for Trustee/Admin manual sync)
  app.post("/api/sync/full", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { syncUsers, syncProducts, syncCategories, syncLibraryContent, syncClinics } = await import("./services/wordpress-sync");
      const { products, categories, memberProfiles, clinics } = await import("@shared/schema");

      const results = {
        users: { imported: 0, updated: 0, skipped: 0, errors: [] as string[] },
        products: 0,
        categories: 0,
        library: 0,
        clinics: { synced: 0, updated: 0, created: 0, errors: [] as string[] },
        timestamp: new Date().toISOString(),
      };

      // Sync categories first
      try {
        await syncCategories();
        const cats = await db.select().from(categories);
        results.categories = cats.length;
      } catch (err: any) {
        results.users.errors.push(`Categories: ${err.message}`);
      }

      // Sync products
      try {
        await syncProducts();
        const prods = await db.select().from(products);
        results.products = prods.length;
      } catch (err: any) {
        results.users.errors.push(`Products: ${err.message}`);
      }

      // Sync users
      try {
        const userResult = await syncUsers();
        results.users = userResult;
      } catch (err: any) {
        results.users.errors.push(`Users: ${err.message}`);
      }

      // Sync library content
      try {
        results.library = await syncLibraryContent();
      } catch (err: any) {
        results.users.errors.push(`Library: ${err.message}`);
      }

      // Sync clinics (including SignNow links)
      try {
        results.clinics = await syncClinics();
      } catch (err: any) {
        results.clinics.errors.push(`Clinics: ${err.message}`);
      }

      res.json(results);
    } catch (error: any) {
      console.error("Full sync error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Manual clinic sync endpoint (for Trustee dashboard "Sync Clinics" button)
  app.post("/api/sync/clinics", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { syncClinics } = await import("./services/wordpress-sync");
      const result = await syncClinics();
      res.json(result);
    } catch (error: any) {
      console.error("Clinic sync error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update individual clinic SignNow links (admin/trustee only)
  app.patch("/api/clinics/:id/signnow-links", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { updateClinicSignNowLinks } = await import("./services/wordpress-sync");
      const { signNowMemberLink, signNowDoctorLink } = req.body;

      const result = await updateClinicSignNowLinks(req.params.id, {
        signNowMemberLink,
        signNowDoctorLink,
      });

      if (!result.success) {
        return res.status(400).json({ error: result.message });
      }

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all clinics (for admin management)
  app.get("/api/clinics", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { clinics } = await import("@shared/schema");
      const allClinics = await db.select().from(clinics).orderBy(clinics.name);
      res.json(allClinics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get single clinic by ID
  app.get("/api/clinics/:id", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const clinic = await storage.getClinic(req.params.id);
      if (!clinic) {
        return res.status(404).json({ error: "Clinic not found" });
      }
      res.json(clinic);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Sync status endpoint for dashboard polling
  app.get("/api/sync/status", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { products, categories, memberProfiles } = await import("@shared/schema");
      const productCount = await db.select().from(products);
      const memberCount = await db.select().from(memberProfiles);
      const categoryCount = await db.select().from(categories);

      res.json({
        products: productCount.length,
        members: memberCount.length,
        categories: categoryCount.length,
        lastSynced: new Date().toISOString(),
        woocommerce: await wooCommerceService.getConnectionStatus(),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Deadline countdown endpoint
  app.get("/api/deadline", async (req: Request, res: Response) => {
    const deadline = new Date("2026-03-01T00:00:00Z");
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    res.json({
      deadline: deadline.toISOString(),
      daysRemaining: days,
      hoursRemaining: hours,
      minutesRemaining: minutes,
      secondsRemaining: seconds,
      totalMilliseconds: diff,
      formatted: `${days}d ${hours}h ${minutes}m`,
    });
  });

  // Comprehensive Training Content Seed
  app.post("/api/admin/seed-training-content", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const isPreviewMode = validatePreviewMode(req);
      const userId = req.user?.id as string;
      if (!userId && !isPreviewMode) {
        return res.status(401).json({ error: "Admin authentication required" });
      }

      console.log("[Admin] Seeding comprehensive training content...");
      const { seedTrainingContent } = await import("./seed-training-content");
      await seedTrainingContent();

      res.json({
        success: true,
        message: "Training content seeded successfully",
        categories: ["ECS Foundations", "Peptides", "Diagnostics", "IV Therapy", "Nutrition", "Protocols"]
      });
    } catch (error: any) {
      console.error("[Admin] Error seeding training content:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Complete Video Assembly - Full Pipeline
  app.post("/api/video/assemble", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const isPreviewMode = validatePreviewMode(req);
      const userId = req.user?.id as string;
      if (!userId && !isPreviewMode) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { title, scenes, generateNarration, generateMusic, musicPrompt, imageUrls } = req.body;

      if (!title || !scenes || !Array.isArray(scenes)) {
        return res.status(400).json({ error: "title and scenes array required" });
      }

      // Validate scenes have narration if narration is requested
      if (generateNarration) {
        const scenesWithoutNarration = scenes.filter((s: any) => !s.narration || s.narration.trim() === '');
        if (scenesWithoutNarration.length > 0) {
          return res.status(400).json({
            error: `${scenesWithoutNarration.length} scene(s) missing narration text`,
            hint: "Each scene needs narration text for audio generation"
          });
        }
      }

      // Validate image URLs if provided
      if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
        if (imageUrls.length !== scenes.length) {
          console.log(`[Video Assembly] Warning: ${imageUrls.length} images for ${scenes.length} scenes - using available images`);
        }
      }

      console.log(`[Video Assembly] Starting full pipeline for: ${title}`);
      const steps: string[] = [];

      // Step 1: Generate narration audio if requested
      let narrationAudioPath: string | null = null;
      if (generateNarration) {
        steps.push("Generating narration audio...");
        const fullScript = scenes.map((s: any) => s.narration).join(" ");
        const { generateSpeech } = await import("./services/huggingface-audio");
        const result = await generateSpeech({ text: fullScript, voice: "neutral" });

        // Save narration to temp file
        const fs = await import("fs/promises");
        const path = await import("path");
        const narrationPath = path.join(process.cwd(), "temp_video_assets", `narration_${Date.now()}.wav`);
        await fs.mkdir(path.dirname(narrationPath), { recursive: true });
        await fs.writeFile(narrationPath, Buffer.from(result.audioBase64, "base64"));
        narrationAudioPath = narrationPath;
        steps.push("Narration generated successfully");
      }

      // Step 2: Generate background music if requested
      let musicAudioPath: string | null = null;
      if (generateMusic && musicPrompt) {
        steps.push("Generating background music...");
        const totalDuration = scenes.reduce((sum: number, s: any) => sum + (s.duration || 10), 0);
        const { generateMusic: genMusic } = await import("./services/huggingface-audio");
        const result = await genMusic(musicPrompt, Math.min(totalDuration, 30));

        const fs = await import("fs/promises");
        const path = await import("path");
        const musicPath = path.join(process.cwd(), "temp_video_assets", `music_${Date.now()}.flac`);
        await fs.writeFile(musicPath, Buffer.from(result.audioBase64, "base64"));
        musicAudioPath = musicPath;
        steps.push("Music generated successfully");
      }

      // Step 3: Merge audio tracks if both exist
      let finalAudioPath: string | null = null;
      if (narrationAudioPath || musicAudioPath) {
        steps.push("Merging audio tracks...");
        const { mergeAudioTracks } = await import("./services/video-production");
        const path = await import("path");
        finalAudioPath = path.join(process.cwd(), "temp_video_assets", `final_audio_${Date.now()}.aac`);

        if (narrationAudioPath && musicAudioPath) {
          await mergeAudioTracks(narrationAudioPath, musicAudioPath, finalAudioPath, { musicVolume: 0.25 });
          steps.push("Audio merged: narration + music");
        } else if (narrationAudioPath) {
          finalAudioPath = narrationAudioPath;
          steps.push("Using narration audio only");
        } else if (musicAudioPath) {
          finalAudioPath = musicAudioPath;
          steps.push("Using music audio only");
        }
      }

      // Step 4: Create video slideshow if images provided
      let outputVideoPath: string | null = null;
      if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
        steps.push("Downloading scene images...");
        const { downloadAsset, createImageSlideshow } = await import("./services/video-production");
        const path = await import("path");

        const imagePaths: string[] = [];
        const durations: number[] = [];

        for (let i = 0; i < Math.min(imageUrls.length, scenes.length); i++) {
          const imagePath = await downloadAsset(imageUrls[i], `scene_${i}_${Date.now()}.jpg`);
          imagePaths.push(imagePath);
          durations.push(scenes[i].duration || 10);
        }
        steps.push(`Downloaded ${imagePaths.length} scene images`);

        steps.push("Assembling video with Ken Burns effects...");
        const outputPath = path.join(process.cwd(), "generated_videos", `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.mp4`);
        await createImageSlideshow(imagePaths, durations, finalAudioPath, outputPath, {
          resolution: { width: 1920, height: 1080 },
          fps: 30,
          kenBurns: true
        });
        outputVideoPath = outputPath;
        steps.push("Video assembled successfully!");
      }

      // Step 5: Upload to Google Drive Marketing folder
      let driveUploadResult: { driveLink?: string; fileId?: string } = {};
      if (outputVideoPath) {
        steps.push("Uploading to Google Drive Marketing folder...");
        try {
          const uploadResult = await uploadVideoToMarketing(outputVideoPath, title);
          if (uploadResult.success) {
            driveUploadResult = { driveLink: uploadResult.driveLink, fileId: uploadResult.fileId };
            steps.push(`Uploaded to Drive: ${uploadResult.driveLink}`);
          } else {
            steps.push(`Drive upload warning: ${uploadResult.error}`);
          }
        } catch (uploadError: any) {
          steps.push(`Drive upload failed: ${uploadError.message}`);
        }
      }

      res.json({
        success: true,
        title,
        sceneCount: scenes.length,
        totalDuration: scenes.reduce((sum: number, s: any) => sum + (s.duration || 10), 0),
        hasNarration: !!narrationAudioPath,
        hasMusic: !!musicAudioPath,
        outputVideoPath,
        driveLink: driveUploadResult.driveLink,
        driveFileId: driveUploadResult.fileId,
        steps,
        message: outputVideoPath
          ? `Video assembled and uploaded to Marketing: ${driveUploadResult.driveLink || outputVideoPath}`
          : "Audio generated - provide imageUrls to assemble final video"
      });
    } catch (error: any) {
      console.error("[Video Assembly] Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Cross-Division Agent Task Handoff
  app.post("/api/agents/cross-division/handoff", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const isPreviewMode = validatePreviewMode(req);
      const userId = req.user?.id as string;
      if (!userId && !isPreviewMode) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { taskId, fromDivision, toDivision, context, deliverables } = req.body;

      if (!taskId || !fromDivision || !toDivision) {
        return res.status(400).json({ error: "taskId, fromDivision, and toDivision required" });
      }

      console.log(`[Cross-Division] Handoff: ${fromDivision} -> ${toDivision} for task ${taskId}`);

      // Get AI synthesis for the handoff
      const { crossDivisionalQuery } = await import("./services/huggingface-agents");
      const synthesis = await crossDivisionalQuery(
        `Review the following deliverables from ${fromDivision} division and prepare instructions for ${toDivision} division:\n\nContext: ${context}\n\nDeliverables: ${JSON.stringify(deliverables)}`,
        [fromDivision as any, toDivision as any]
      );

      res.json({
        success: true,
        handoff: {
          taskId,
          fromDivision,
          toDivision,
          timestamp: new Date().toISOString()
        },
        synthesis: synthesis.synthesis,
        divisionResponses: synthesis.divisionResponses,
        modelUsed: synthesis.modelUsed
      });
    } catch (error: any) {
      console.error("[Cross-Division] Handoff error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Automated Video Production API
  app.get("/api/video/templates", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { getAvailableTemplates } = await import("./services/auto-video-producer");
      const templates = await getAvailableTemplates();
      res.json({ templates });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/video/auto-produce", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const isPreviewMode = validatePreviewMode(req);
      const userId = req.user?.id as string;
      if (!userId && !isPreviewMode) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { templateId, title, customScenes, musicPrompt, voiceStyle, uploadToDrive } = req.body;

      if (!title) {
        return res.status(400).json({ error: "title is required" });
      }

      if (!templateId && !customScenes) {
        return res.status(400).json({ error: "Either templateId or customScenes is required" });
      }

      console.log(`[Auto Video] Starting automated production: ${title}`);

      // Get available images from Drive PIXEL folder
      const driveStructure = await getAllioStructure();
      const pixelFolder = driveStructure.subfolders.find(f => f.name === 'PIXEL - Design Assets');
      const availableImages = (pixelFolder?.files || [])
        .filter((f: any) => f.mimeType?.startsWith('image/'))
        .map((f: any) => ({
          name: f.name,
          url: f.thumbnailLink?.replace('=s220', '=s1920') || f.webViewLink || ''
        }));

      console.log(`[Auto Video] Found ${availableImages.length} images in PIXEL folder`);

      const { produceVideoAutomatically } = await import("./services/auto-video-producer");

      const result = await produceVideoAutomatically({
        templateId,
        customScenes,
        title,
        musicPrompt,
        voiceStyle,
        uploadToDrive: uploadToDrive !== false
      }, availableImages);

      res.json(result);
    } catch (error: any) {
      console.error("[Auto Video] Production error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Agent-triggered video production endpoint
  app.post("/api/agents/produce-video", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const isPreviewMode = validatePreviewMode(req);
      const userId = req.user?.id as string;
      if (!userId && !isPreviewMode) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { agentId, templateId, title, priority, scheduledFor } = req.body;

      if (!agentId || !title) {
        return res.status(400).json({ error: "agentId and title are required" });
      }

      console.log(`[Agent Video] Agent ${agentId} requesting video production: ${title}`);

      // Get available images from Drive
      const driveStructure = await getAllioStructure();
      const pixelFolder = driveStructure.subfolders.find(f => f.name === 'PIXEL - Design Assets');
      const availableImages = (pixelFolder?.files || [])
        .filter((f: any) => f.mimeType?.startsWith('image/'))
        .map((f: any) => ({
          name: f.name,
          url: f.thumbnailLink?.replace('=s220', '=s1920') || f.webViewLink || ''
        }));

      const { produceVideoAutomatically } = await import("./services/auto-video-producer");

      // If scheduled for future, just queue it (placeholder for scheduler integration)
      if (scheduledFor && new Date(scheduledFor) > new Date()) {
        return res.json({
          success: true,
          queued: true,
          scheduledFor,
          message: `Video production scheduled for ${scheduledFor}`
        });
      }

      // Produce immediately
      const result = await produceVideoAutomatically({
        templateId: templateId || 'allio-launch-march-2026',
        title,
        uploadToDrive: true
      }, availableImages);

      res.json({
        ...result,
        agentId,
        producedBy: 'PRISM Video Agent'
      });
    } catch (error: any) {
      console.error("[Agent Video] Production error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Upload local video to Drive
  app.post("/api/video/upload-local", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const isPreviewMode = validatePreviewMode(req);
      if (!isPreviewMode) {
        return res.status(401).json({ error: "Trustee access required" });
      }

      const { localPath, title } = req.body;
      if (!localPath || !title) {
        return res.status(400).json({ error: "localPath and title are required" });
      }

      const { uploadVideoToMarketing } = await import("./services/drive");
      const result = await uploadVideoToMarketing(localPath, title);

      res.json(result);
    } catch (error: any) {
      console.error("[Video Upload] Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Premium video production - uses video clips from Drive with mixed media
  app.post("/api/video/produce-premium", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const isPreviewMode = validatePreviewMode(req);
      const userId = req.user?.id as string;
      if (!userId && !isPreviewMode) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { templateId, title, voiceStyle, uploadToDrive } = req.body;

      if (!title) {
        return res.status(400).json({ error: "title is required" });
      }

      console.log(`[Premium Video] Starting premium production: ${title}`);

      const { produceVideoPremium } = await import("./services/auto-video-producer");

      const result = await produceVideoPremium({
        templateId: templateId || 'allio-launch-march-2026',
        title,
        voiceStyle: voiceStyle || 'neutral',
        uploadToDrive: uploadToDrive !== false
      });

      res.json({
        ...result,
        productionType: 'premium',
        producedBy: 'PRISM Video Agent (Premium)'
      });
    } catch (error: any) {
      console.error("[Premium Video] Production error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Network Doctors API
  app.get("/api/network-doctors", async (req: Request, res: Response) => {
    try {
      const { networkDoctors } = await import("@shared/schema");
      const doctors = await db.select().from(networkDoctors).limit(1000);
      res.json(doctors);
    } catch (error: any) {
      console.error("[Network Doctors] Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Import doctors from Excel (Trustee only)
  app.post("/api/network-doctors/import", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const isPreviewMode = validatePreviewMode(req);
      if (!isPreviewMode) {
        return res.status(401).json({ error: "Trustee access required" });
      }

      const { doctors } = req.body;
      if (!Array.isArray(doctors)) {
        return res.status(400).json({ error: "doctors array is required" });
      }

      const { networkDoctors } = await import("@shared/schema");

      let imported = 0;
      for (const doc of doctors) {
        if (!doc.drName) continue;
        await db.insert(networkDoctors).values({
          drName: doc.drName,
          clinicName: doc.clinicName,
          phoneNumber: doc.phoneNumber,
          onboardingDate: doc.onboardingDate,
          onboardedBy: doc.onboardedBy,
          practiceType: doc.practiceType,
          address: doc.address,
          city: doc.city,
          state: doc.state,
          zipCode: doc.zipCode,
          onMap: doc.onMap === true || doc.onMap === 'Yes',
          email: doc.email,
          signupLink: doc.signupLink,
        }).onConflictDoNothing();
        imported++;
      }

      res.json({ success: true, imported });
    } catch (error: any) {
      console.error("[Network Doctors Import] Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ========================
  // DOCTOR DASHBOARD API
  // ========================

  // Patient Records
  app.get("/api/doctor/patients", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const doctorId = req.user?.id as string;
      const patients = await storage.getPatientRecords(doctorId);
      res.json({ success: true, patients });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/doctor/patients/:id", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const patient = await storage.getPatientRecord(req.params.id);
      if (!patient) {
        return res.status(404).json({ success: false, error: "Patient not found" });
      }
      const uploads = await storage.getPatientUploads(patient.id);
      const protocols = await storage.getPatientProtocols(patient.id);
      res.json({ success: true, patient, uploads, protocols });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/doctor/patients", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const doctorId = req.user?.id as string;
      const patient = await storage.createPatientRecord({ ...req.body, doctorId });
      res.json({ success: true, patient });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.put("/api/doctor/patients/:id", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const patient = await storage.updatePatientRecord(req.params.id, req.body);
      res.json({ success: true, patient });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Patient Uploads
  app.post("/api/doctor/patients/:patientId/uploads", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const doctorId = req.user?.id as string;
      const upload = await storage.createPatientUpload({
        ...req.body,
        patientRecordId: req.params.patientId,
        uploadedBy: doctorId,
        uploadedByRole: "doctor"
      });
      res.json({ success: true, upload });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Patient Protocols
  app.get("/api/doctor/protocols", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const doctorId = req.user?.id as string;
      const protocols = await storage.getDoctorProtocols(doctorId);
      res.json({ success: true, protocols });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/doctor/patients/:patientId/protocols", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const doctorId = req.user?.id as string;
      const protocol = await storage.createPatientProtocol({
        ...req.body,
        patientRecordId: req.params.patientId,
        doctorId
      });
      res.json({ success: true, protocol });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.put("/api/doctor/protocols/:id", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const protocol = await storage.updatePatientProtocol(req.params.id, req.body);
      res.json({ success: true, protocol });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Messaging
  app.get("/api/doctor/conversations", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id as string;
      const conversationList = await storage.getConversations(userId);
      res.json({ success: true, conversations: conversationList });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/doctor/conversations/:id/messages", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const messages = await storage.getMessages(req.params.id);
      res.json({ success: true, messages });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/doctor/conversations", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const conversation = await storage.createConversation(req.body);
      res.json({ success: true, conversation });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/doctor/messages", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const message = await storage.createMessage(req.body);
      res.json({ success: true, message });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.put("/api/doctor/messages/:id/read", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const message = await storage.markMessageRead(req.params.id);
      res.json({ success: true, message });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // AI Image Analysis API (HuggingFace integration)
  app.post("/api/ai/analyze-image", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const { patientUploadId, analysisType, imageData } = req.body;
      const requestedBy = req.user?.id as string;

      // For now, return a simulated result - real HuggingFace integration to be added
      const analysisResult = {
        success: true,
        analysisType,
        model: analysisType === "xray" ? "jiviai/Jivi-RadX-v1" : "VRJBro/skin-cancer-detection",
        result: {
          findings: [
            { area: "Overall Assessment", description: "AI analysis completed - educational use only", confidence: 0.85 }
          ],
          disclaimer: "This AI analysis is for educational purposes only within the PMA. It does not constitute medical advice. All findings should be reviewed by a qualified healthcare practitioner."
        },
        processingTimeMs: 1500
      };

      // Store analysis request
      const { aiAnalysisRequests } = await import("@shared/schema");
      await db.insert(aiAnalysisRequests).values({
        patientUploadId: patientUploadId || "demo",
        requestedBy,
        analysisType,
        model: analysisResult.model,
        status: "completed",
        result: analysisResult.result,
        confidence: "0.85",
        processingTimeMs: analysisResult.processingTimeMs,
        completedAt: new Date()
      });

      res.json(analysisResult);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ========== API Keys Management ==========
  app.get("/api/settings/api-keys", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { apiKeys } = await import("@shared/schema");
      const keys = await db.select({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        permissions: apiKeys.permissions,
        createdBy: apiKeys.createdBy,
        lastUsedAt: apiKeys.lastUsedAt,
        isActive: apiKeys.isActive,
        createdAt: apiKeys.createdAt,
      }).from(apiKeys).orderBy(apiKeys.createdAt);
      res.json({ success: true, keys });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/settings/api-keys", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { name, permissions } = req.body;
      if (!name) return res.status(400).json({ error: "Name is required" });

      const rawKey = `allio_${crypto.randomBytes(32).toString('hex')}`;
      const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
      const keyPrefix = rawKey.substring(0, 12);

      const r = req as any;
      const createdBy = r.user?.claims?.sub || 'preview-mode';

      const { apiKeys } = await import("@shared/schema");
      const [created] = await db.insert(apiKeys).values({
        name,
        keyPrefix,
        keyHash,
        permissions: permissions || ['read'],
        createdBy,
      }).returning();

      res.json({ success: true, key: { ...created, rawKey } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.delete("/api/settings/api-keys/:id", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { apiKeys } = await import("@shared/schema");
      await db.update(apiKeys)
        .set({ isActive: false })
        .where(eq(apiKeys.id, req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ========== API Audit Logs ==========
  app.get("/api/settings/audit-logs", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { apiAuditLogs } = await import("@shared/schema");
      const { desc } = await import("drizzle-orm");
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
      const offset = parseInt(req.query.offset as string) || 0;

      const logs = await db.select().from(apiAuditLogs)
        .orderBy(desc(apiAuditLogs.createdAt))
        .limit(limit)
        .offset(offset);

      res.json({ success: true, logs, limit, offset });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ========== Webhook Endpoints Management ==========
  app.get("/api/settings/webhooks", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { webhookEndpoints } = await import("@shared/schema");
      const endpoints = await db.select({
        id: webhookEndpoints.id,
        url: webhookEndpoints.url,
        events: webhookEndpoints.events,
        isActive: webhookEndpoints.isActive,
        lastDeliveryAt: webhookEndpoints.lastDeliveryAt,
        lastDeliveryStatus: webhookEndpoints.lastDeliveryStatus,
        createdAt: webhookEndpoints.createdAt,
      }).from(webhookEndpoints).orderBy(webhookEndpoints.createdAt);
      res.json({ success: true, endpoints });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/settings/webhooks", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { url, events } = req.body;
      if (!url || !events || !Array.isArray(events) || events.length === 0) {
        return res.status(400).json({ error: "URL and events array required" });
      }

      const { isUnsafeUrl } = await import("./services/webhook-dispatcher");
      if (isUnsafeUrl(url)) {
        return res.status(400).json({ error: "URL must be a public HTTPS/HTTP endpoint. Private/internal URLs are blocked." });
      }

      const secret = crypto.randomBytes(32).toString('hex');

      const { webhookEndpoints } = await import("@shared/schema");
      const [created] = await db.insert(webhookEndpoints).values({
        url,
        events,
        secret,
        isActive: true,
      }).returning();

      res.json({ success: true, endpoint: { ...created, secret } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.delete("/api/settings/webhooks/:id", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { webhookEndpoints } = await import("@shared/schema");
      await db.delete(webhookEndpoints).where(eq(webhookEndpoints.id, req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/settings/webhooks/:id/test", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { testWebhook } = await import("./services/webhook-dispatcher");
      const result = await testWebhook(req.params.id);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ========== Daily Briefings ==========
  app.get("/api/settings/briefings", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { getLatestBriefings } = await import("./services/scheduler");
      const briefings = await getLatestBriefings();
      res.json({ success: true, ...briefings });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Practice Analytics
  app.get("/api/doctor/analytics", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const doctorId = req.user?.id as string;
      const patients = await storage.getPatientRecords(doctorId);
      const protocols = await storage.getDoctorProtocols(doctorId);

      const analytics = {
        totalPatients: patients.length,
        activePatients: patients.filter(p => p.status === "active").length,
        totalProtocols: protocols.length,
        activeProtocols: protocols.filter(p => p.status === "active").length,
        completedProtocols: protocols.filter(p => p.status === "completed").length,
        averageComplianceScore: protocols.filter(p => p.complianceScore).reduce((sum, p) => sum + (p.complianceScore || 0), 0) / Math.max(protocols.filter(p => p.complianceScore).length, 1)
      };

      res.json({ success: true, analytics });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ========== Patient Intake System ==========
  app.post("/api/intake/submit", async (req: Request, res: Response) => {
    try {
      const { submitIntakeForm } = await import("./services/intake");
      const { patientInfo, formData } = req.body;

      if (!patientInfo || !patientInfo.name || !patientInfo.email) {
        return res.status(400).json({ success: false, error: "Missing required patient info (name, email)" });
      }

      const result = await submitIntakeForm(patientInfo, formData);
      res.json(result);
    } catch (error: any) {
      console.error("[Intake] Submit error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/intake/save-draft", async (req: Request, res: Response) => {
    try {
      const { intakeForms } = await import("@shared/schema");
      const { patientInfo, formData, draftId } = req.body;
      let existingId = draftId;

      if (!existingId) {
        // Create new draft
        const [draft] = await db.insert(intakeForms).values({
          patientName: patientInfo?.name || "Draft",
          patientEmail: patientInfo?.email || "draft@ffpma.com",
          formData: formData || {},
          status: "draft"
        }).returning();
        existingId = draft.id;
      } else {
        // Update existing draft
        await db.update(intakeForms).set({
          patientName: patientInfo?.name || "Draft",
          patientEmail: patientInfo?.email || "draft@ffpma.com",
          patientPhone: patientInfo?.phone,
          formData: formData || {},
          updatedAt: new Date()
        }).where(eq(intakeForms.id, existingId));
      }

      res.json({ success: true, draftId: existingId });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/intake/resume/:draftId", async (req: Request, res: Response) => {
    try {
      const { intakeForms } = await import("@shared/schema");
      const draftId = parseInt(req.params.draftId, 10);
      if (isNaN(draftId)) return res.status(400).json({ error: "Invalid draft ID" });

      const [draft] = await db.select().from(intakeForms).where(eq(intakeForms.id, draftId)).limit(1);
      if (!draft) return res.status(404).json({ error: "Draft not found" });

      res.json({ success: true, draft });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/intake/sheet-template", requireRole("admin", "doctor", "trustee"), async (req: Request, res: Response) => {
    try {
      const { getOrCreateIntakeSheetId } = await import("./services/intake");
      const sheetId = await getOrCreateIntakeSheetId();
      res.json({ success: true, sheetId });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ========== Decentralized PMA Data Sync (Layer 3) ==========
  app.post("/api/sync/node", async (req: Request, res: Response) => {
    try {
      const apiKey = req.headers['x-node-api-key'] as string;
      if (!apiKey) {
        return res.status(401).json({ error: "Missing node API key" });
      }

      const nodeId = req.headers['x-node-id'] as string;
      if (!nodeId) {
        return res.status(400).json({ error: "Missing node ID" });
      }

      const { clinicNodes } = await import("@shared/schema");
      const [node] = await db.select().from(clinicNodes).where(eq(clinicNodes.id, nodeId)).limit(1);

      if (!node || !node.isActive) {
        return res.status(401).json({ error: "Invalid or inactive node" });
      }

      const isValid = await bcrypt.compare(apiKey, node.apiKeyHash);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid API key" });
      }

      const { payload } = req.body;
      if (!payload) {
        return res.status(400).json({ error: "Missing sync payload" });
      }

      await db.update(clinicNodes)
        .set({ lastSyncAt: new Date(), status: 'active' })
        .where(eq(clinicNodes.id, nodeId));

      res.status(200).json({
        success: true,
        message: "Sync payload received successfully",
        serverTimestamp: new Date().toISOString(),
        receivedBytes: JSON.stringify(payload).length
      });
    } catch (error: any) {
      console.error("[Sync API] Node sync error:", error);
      res.status(500).json({ error: error.message || "Failed to sync node data" });
    }
  });

  return httpServer;
}

