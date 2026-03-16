import type { Express, Request, Response } from "express";
import { requireRole } from "../working-auth";
import { storage } from "../storage";
import { z } from "zod";

export function registerBloodworkRoutes(app: Express): void {
  app.get("/api/doctor/lab-orders", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const doctorId = (req as any).user?.id || "system";
      const orders = await storage.getLabOrders(doctorId);
      return void res.json({ success: true, orders });
    } catch (error: any) {
      return void res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/doctor/lab-orders/:id", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const doctorId = (req as any).user?.id || "system";
      const isAdmin = (req as any).user?.wpRoles?.includes("admin") || (req as any).user?.wpRoles?.includes("trustee");
      const order = await storage.getLabOrder(req.params.id);
      if (!order) return void res.status(404).json({ success: false, error: "Order not found" });
      if (!isAdmin && order.doctorId !== doctorId) return void res.status(403).json({ success: false, error: "Access denied" });
      return void res.json({ success: true, order });
    } catch (error: any) {
      return void res.status(500).json({ success: false, error: error.message });
    }
  });

  const createLabOrderSchema = z.object({
    memberId: z.string().min(1),
    memberName: z.string().optional(),
    panels: z.array(z.string()).min(1),
    notes: z.string().optional(),
    dryRun: z.boolean().default(true),
  });

  app.post("/api/doctor/lab-orders", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const parsed = createLabOrderSchema.safeParse(req.body);
      if (!parsed.success) {
        return void res.status(400).json({ success: false, error: "Invalid request", details: parsed.error.errors });
      }

      const doctorId = (req as any).user?.id || "system";
      const { memberId, memberName, panels, notes, dryRun } = parsed.data;

      const order = await storage.createLabOrder({
        memberId,
        memberName: memberName || null,
        doctorId,
        status: dryRun ? "draft" : "pending",
        panels,
        notes: notes || null,
        orderedAt: new Date(),
        completedAt: null,
        rupaOrderId: null,
        rupaOrderUrl: null,
      });

      if (!dryRun) {
        try {
          const { rupaHealthAgent } = await import("../services/rupa-health-agent");
          const rupaStatus = rupaHealthAgent.getStatus();
          if (rupaStatus.available) {
            const result = await rupaHealthAgent.placeOrder(
              { firstName: memberName?.split(' ')[0] || 'Patient', lastName: memberName?.split(' ').slice(1).join(' ') || '', email: '' },
              panels,
              false
            );
            if (result.success) {
              await storage.updateLabOrder(order.id, {
                status: "submitted",
                rupaOrderUrl: result.resultUrl || null,
              });
            } else if (result.terminal) {
              await storage.updateLabOrder(order.id, {
                status: "pending",
                notes: `Manual order required: ${result.message || result.error}`,
              });
              console.log("[Bloodwork] Rupa automation failed (terminal) — WhatsApp fallback sent, order marked pending for manual completion");
            }
          }
        } catch (rupaError: any) {
          console.error("[Bloodwork] Rupa Health order error:", rupaError.message);
        }
      }

      return void res.json({ success: true, order });
    } catch (error: any) {
      return void res.status(500).json({ success: false, error: error.message });
    }
  });

  const updateLabOrderSchema = z.object({
    status: z.enum(["draft", "pending", "submitted", "in_progress", "completed", "cancelled"]).optional(),
    panels: z.array(z.string()).optional(),
    notes: z.string().optional(),
    memberName: z.string().optional(),
  });

  app.put("/api/doctor/lab-orders/:id", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const doctorId = (req as any).user?.id || "system";
      const isAdmin = (req as any).user?.wpRoles?.includes("admin") || (req as any).user?.wpRoles?.includes("trustee");
      const existing = await storage.getLabOrder(req.params.id);
      if (!existing) return void res.status(404).json({ success: false, error: "Order not found" });
      if (!isAdmin && existing.doctorId !== doctorId) return void res.status(403).json({ success: false, error: "Access denied" });

      const parsed = updateLabOrderSchema.safeParse(req.body);
      if (!parsed.success) return void res.status(400).json({ success: false, error: "Invalid update data" });

      const updated = await storage.updateLabOrder(req.params.id, parsed.data);
      return void res.json({ success: true, order: updated });
    } catch (error: any) {
      return void res.status(500).json({ success: false, error: error.message });
    }
  });

  app.delete("/api/doctor/lab-orders/:id", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const doctorId = (req as any).user?.id || "system";
      const isAdmin = (req as any).user?.wpRoles?.includes("admin") || (req as any).user?.wpRoles?.includes("trustee");
      const existing = await storage.getLabOrder(req.params.id);
      if (!existing) return void res.status(404).json({ success: false, error: "Order not found" });
      if (!isAdmin && existing.doctorId !== doctorId) return void res.status(403).json({ success: false, error: "Access denied" });

      await storage.deleteLabOrder(req.params.id);
      return void res.json({ success: true });
    } catch (error: any) {
      return void res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/doctor/lab-results", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const { memberId } = req.query;
      const doctorId = (req as any).user?.id || "system";
      const isAdmin = (req as any).user?.wpRoles?.includes("admin") || (req as any).user?.wpRoles?.includes("trustee");
      let results;
      if (memberId && typeof memberId === 'string') {
        if (isAdmin) {
          results = await storage.getLabResults(memberId);
        } else {
          const allResults = await storage.getLabResults(memberId);
          results = allResults.filter(r => r.doctorId === doctorId);
        }
      } else {
        results = await storage.getLabResultsByDoctor(doctorId);
      }
      return void res.json({ success: true, results });
    } catch (error: any) {
      return void res.status(500).json({ success: false, error: error.message });
    }
  });

  const createLabResultSchema = z.object({
    memberId: z.string().min(1),
    memberName: z.string().optional(),
    testName: z.string().min(1),
    category: z.string().min(1),
    value: z.string().min(1),
    unit: z.string().min(1),
    referenceMin: z.string().optional(),
    referenceMax: z.string().optional(),
    status: z.enum(["normal", "low", "high", "critical_low", "critical_high"]).default("normal"),
    resultDate: z.string().optional(),
    labOrderId: z.string().optional(),
    notes: z.string().optional(),
  });

  const createBatchLabResultsSchema = z.object({
    results: z.array(createLabResultSchema).min(1),
  });

  app.post("/api/doctor/lab-results", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const parsed = createLabResultSchema.safeParse(req.body);
      if (!parsed.success) {
        return void res.status(400).json({ success: false, error: "Invalid request", details: parsed.error.errors });
      }

      const doctorId = (req as any).user?.id || "system";
      const data = parsed.data;

      const result = await storage.createLabResult({
        memberId: data.memberId,
        memberName: data.memberName || null,
        doctorId,
        testName: data.testName,
        category: data.category,
        value: data.value,
        unit: data.unit,
        referenceMin: data.referenceMin || null,
        referenceMax: data.referenceMax || null,
        status: data.status,
        resultDate: data.resultDate ? new Date(data.resultDate) : new Date(),
        labOrderId: data.labOrderId || null,
        notes: data.notes || null,
      });

      return void res.json({ success: true, result });
    } catch (error: any) {
      return void res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/doctor/lab-results/batch", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const parsed = createBatchLabResultsSchema.safeParse(req.body);
      if (!parsed.success) {
        return void res.status(400).json({ success: false, error: "Invalid request", details: parsed.error.errors });
      }

      const doctorId = (req as any).user?.id || "system";
      const insertData = parsed.data.results.map(data => ({
        memberId: data.memberId,
        memberName: data.memberName || null,
        doctorId,
        testName: data.testName,
        category: data.category,
        value: data.value,
        unit: data.unit,
        referenceMin: data.referenceMin || null,
        referenceMax: data.referenceMax || null,
        status: data.status as any,
        resultDate: data.resultDate ? new Date(data.resultDate) : new Date(),
        labOrderId: data.labOrderId || null,
        notes: data.notes || null,
      }));

      const results = await storage.createLabResults(insertData);
      return void res.json({ success: true, results, count: results.length });
    } catch (error: any) {
      return void res.status(500).json({ success: false, error: error.message });
    }
  });

  const updateLabResultSchema = z.object({
    testName: z.string().optional(),
    category: z.string().optional(),
    value: z.string().optional(),
    unit: z.string().optional(),
    referenceMin: z.string().nullable().optional(),
    referenceMax: z.string().nullable().optional(),
    status: z.enum(["normal", "low", "high", "critical_low", "critical_high"]).optional(),
    notes: z.string().nullable().optional(),
  });

  app.put("/api/doctor/lab-results/:id", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const doctorId = (req as any).user?.id || "system";
      const isAdmin = (req as any).user?.wpRoles?.includes("admin") || (req as any).user?.wpRoles?.includes("trustee");
      const existing = await storage.getLabResult(req.params.id);
      if (!existing) return void res.status(404).json({ success: false, error: "Result not found" });
      if (!isAdmin && existing.doctorId !== doctorId) return void res.status(403).json({ success: false, error: "Access denied" });

      const parsed = updateLabResultSchema.safeParse(req.body);
      if (!parsed.success) return void res.status(400).json({ success: false, error: "Invalid update data" });

      const updated = await storage.updateLabResult(req.params.id, parsed.data);
      return void res.json({ success: true, result: updated });
    } catch (error: any) {
      return void res.status(500).json({ success: false, error: error.message });
    }
  });

  app.delete("/api/doctor/lab-results/:id", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const doctorId = (req as any).user?.id || "system";
      const isAdmin = (req as any).user?.wpRoles?.includes("admin") || (req as any).user?.wpRoles?.includes("trustee");
      const existing = await storage.getLabResult(req.params.id);
      if (!existing) return void res.status(404).json({ success: false, error: "Result not found" });
      if (!isAdmin && existing.doctorId !== doctorId) return void res.status(403).json({ success: false, error: "Access denied" });

      await storage.deleteLabResult(req.params.id);
      return void res.json({ success: true });
    } catch (error: any) {
      return void res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/doctor/saved-panels", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const doctorId = (req as any).user?.id || "system";
      const panels = await storage.getSavedTestPanels(doctorId);
      return void res.json({ success: true, panels });
    } catch (error: any) {
      return void res.status(500).json({ success: false, error: error.message });
    }
  });

  const createSavedPanelSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    testList: z.array(z.object({
      testName: z.string(),
      category: z.string(),
      unit: z.string(),
      referenceMin: z.number().optional(),
      referenceMax: z.number().optional(),
    })).min(1),
  });

  app.post("/api/doctor/saved-panels", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const parsed = createSavedPanelSchema.safeParse(req.body);
      if (!parsed.success) {
        return void res.status(400).json({ success: false, error: "Invalid request", details: parsed.error.errors });
      }

      const doctorId = (req as any).user?.id || "system";
      const panel = await storage.createSavedTestPanel({
        doctorId,
        name: parsed.data.name,
        description: parsed.data.description || null,
        testList: parsed.data.testList,
      });

      return void res.json({ success: true, panel });
    } catch (error: any) {
      return void res.status(500).json({ success: false, error: error.message });
    }
  });

  const updateSavedPanelSchema = z.object({
    name: z.string().optional(),
    description: z.string().nullable().optional(),
    testList: z.array(z.object({
      testName: z.string(),
      category: z.string(),
      unit: z.string(),
      referenceMin: z.number().optional(),
      referenceMax: z.number().optional(),
    })).optional(),
  });

  app.put("/api/doctor/saved-panels/:id", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const doctorId = (req as any).user?.id || "system";
      const isAdmin = (req as any).user?.wpRoles?.includes("admin") || (req as any).user?.wpRoles?.includes("trustee");
      const existing = await storage.getSavedTestPanel(req.params.id);
      if (!existing) return void res.status(404).json({ success: false, error: "Panel not found" });
      if (!isAdmin && existing.doctorId !== doctorId) return void res.status(403).json({ success: false, error: "Access denied" });

      const parsed = updateSavedPanelSchema.safeParse(req.body);
      if (!parsed.success) return void res.status(400).json({ success: false, error: "Invalid update data" });

      const updated = await storage.updateSavedTestPanel(req.params.id, parsed.data);
      return void res.json({ success: true, panel: updated });
    } catch (error: any) {
      return void res.status(500).json({ success: false, error: error.message });
    }
  });

  app.delete("/api/doctor/saved-panels/:id", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const doctorId = (req as any).user?.id || "system";
      const isAdmin = (req as any).user?.wpRoles?.includes("admin") || (req as any).user?.wpRoles?.includes("trustee");
      const existing = await storage.getSavedTestPanel(req.params.id);
      if (!existing) return void res.status(404).json({ success: false, error: "Panel not found" });
      if (!isAdmin && existing.doctorId !== doctorId) return void res.status(403).json({ success: false, error: "Access denied" });

      await storage.deleteSavedTestPanel(req.params.id);
      return void res.json({ success: true });
    } catch (error: any) {
      return void res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/doctor/rupa-health/status", requireRole("admin", "doctor"), async (_req: Request, res: Response) => {
    try {
      const { rupaHealthAgent } = await import("../services/rupa-health-agent");
      const status = rupaHealthAgent.getStatus();
      return void res.json({ success: true, ...status });
    } catch (error: any) {
      return void res.status(500).json({ success: false, available: false, error: error.message });
    }
  });
}
