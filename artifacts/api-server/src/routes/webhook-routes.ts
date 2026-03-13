import type { Express, Request, Response } from "express";
import express from "express";

export function registerWebhookRoutes(app: Express): void {
  app.post(
    "/api/webhooks/wordpress",
    express.raw({ type: "application/json" }),
    async (req: Request, res: Response): Promise<any> => {
      try {
        const rawBody = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : JSON.stringify(req.body);
        const payload = Buffer.isBuffer(req.body) ? JSON.parse(rawBody) : req.body;

        const topic = (req.headers["x-wc-webhook-topic"] as string) ||
                      (req.headers["x-wp-webhook-topic"] as string) ||
                      (req.query.topic as string) ||
                      "";

        const signature = (req.headers["x-wc-webhook-signature"] as string) || "";

        if (!topic) {
          return res.status(400).json({ error: "Missing webhook topic" });
        }

        const webhookSecret = process.env.WP_WEBHOOK_SECRET || "";

        if (webhookSecret) {
          if (!signature) {
            console.warn("[Webhook] Missing signature for topic:", topic);
            return res.status(401).json({ error: "Webhook signature required" });
          }

          const { verifyWebhookSignature } = await import("../services/wordpress-sync");
          const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
          if (!isValid) {
            console.warn("[Webhook] Invalid signature for topic:", topic);
            return res.status(401).json({ error: "Invalid webhook signature" });
          }
        } else if (process.env.NODE_ENV === "production") {
          console.warn("[Webhook] WP_WEBHOOK_SECRET not configured - rejecting in production");
          return res.status(403).json({ error: "Webhook secret not configured" });
        }

        const { handleWordPressWebhook } = await import("../services/wordpress-sync");
        const result = await handleWordPressWebhook(topic, payload, signature);

        const { syncEvents } = await import("@shared/schema");
        const { db } = await import("../db");
        try {
          await db.insert(syncEvents).values({
            eventType: `webhook.${topic}`,
            entityType: topic.split(".")[0] || "unknown",
            entityId: payload?.id ? String(payload.id) : null,
            wpEntityId: payload?.id ? String(payload.id) : null,
            status: result.success ? "success" : "error",
            details: JSON.stringify({ topic, action: result.action, message: result.message }),
          });
        } catch (logError) {
          console.error("[Webhook] Failed to log event:", logError);
        }

        res.json(result);
      } catch (error: any) {
        console.error("[Webhook] Error processing webhook:", error);
        res.status(500).json({ error: error.message });
      }
    }
  );

  app.get("/api/webhooks/wordpress/status", async (req: Request, res: Response) => {
    try {
      const { wpWebhooks } = await import("@shared/schema");
      const { db } = await import("../db");
      const webhooks = await db.select().from(wpWebhooks);
      res.json({
        configured: webhooks.length > 0,
        webhooks: webhooks.map(w => ({
          id: w.id,
          topic: w.topic,
          isActive: w.isActive,
          lastTriggeredAt: w.lastTriggeredAt,
        })),
        receiverUrl: "/api/webhooks/wordpress",
        secretConfigured: !!process.env.WP_WEBHOOK_SECRET,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}
