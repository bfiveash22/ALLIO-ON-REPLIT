import type { Express, Request, Response } from "express";
import { requireAuth, requireRole } from "../working-auth";
import { db } from "../db";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { storage } from "../storage";
import { z } from "zod";

export function registerSettingsRoutes(app: Express): void {
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

      const { isUnsafeUrl } = await import("../services/webhook-dispatcher");
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
      const { testWebhook } = await import("../services/webhook-dispatcher");
      const result = await testWebhook(req.params.id);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/settings/briefings", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { getLatestBriefings } = await import("../services/scheduler");
      const briefings = await getLatestBriefings();
      res.json({ success: true, ...briefings });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/intake/submit", async (req: Request, res: Response) => {
    try {
      const { submitIntakeForm } = await import("../services/intake");
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
        const [draft] = await db.insert(intakeForms).values({
          patientName: patientInfo?.name || "Draft",
          patientEmail: patientInfo?.email || "draft@ffpma.com",
          formData: formData || {},
          status: "draft"
        }).returning();
        existingId = draft.id;
      } else {
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
      const { getOrCreateIntakeSheetId } = await import("../services/intake");
      const sheetId = await getOrCreateIntakeSheetId();
      res.json({ success: true, sheetId });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

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
}
