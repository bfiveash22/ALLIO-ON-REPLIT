import type { Express, Request, Response } from "express";
import { requireAuth, requireRole } from "../working-auth";
import { db } from "../db";
import { payments, orders, orderItems, products } from "@shared/schema";
import { eq, desc, and, gte, count, sum, inArray } from "drizzle-orm";

interface CheckoutItem {
  productId: string;
  quantity: number;
}

interface BillingInfo {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
}

interface VerifiedItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  description?: string;
  imageUrl?: string | null;
}

interface AuthenticatedUser {
  id: string;
  email?: string;
}

function getUser(req: Request): AuthenticatedUser | null {
  const user = req.user as AuthenticatedUser | undefined;
  return user && user.id ? user : null;
}

export function registerPaymentRoutes(app: Express) {
  app.post("/api/payments/create-checkout-session", requireAuth, async (req: Request, res: Response) => {
    try {
      const { items, billing } = req.body as { items: CheckoutItem[]; billing: BillingInfo };
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "items array is required" });
      }

      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) {
        return res.status(503).json({ error: "Payment processing is not configured. Please contact support." });
      }

      const stripe = (await import("stripe")).default;
      const stripeClient = new stripe(stripeKey);

      const user = getUser(req);
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const userId = user.id;
      const userEmail = billing?.email || user.email;

      const productIds = items.map((item) => item.productId);
      const dbProducts = await db
        .select({ id: products.id, name: products.name, retailPrice: products.retailPrice, imageUrl: products.imageUrl, shortDescription: products.shortDescription })
        .from(products)
        .where(inArray(products.id, productIds));

      const productMap = new Map(dbProducts.map(p => [p.id, p]));

      const verifiedItems: VerifiedItem[] = [];
      for (const item of items) {
        const dbProduct = productMap.get(item.productId);
        if (!dbProduct) {
          return res.status(400).json({ error: `Product not found: ${item.productId}` });
        }
        const price = parseFloat(dbProduct.retailPrice);
        if (isNaN(price) || price <= 0) {
          return res.status(400).json({ error: `Invalid price for product: ${dbProduct.name}` });
        }
        verifiedItems.push({
          productId: item.productId,
          name: dbProduct.name,
          price,
          quantity: Math.max(1, parseInt(String(item.quantity)) || 1),
          description: dbProduct.shortDescription || undefined,
          imageUrl: dbProduct.imageUrl,
        });
      }

      const subtotal = verifiedItems.reduce((s, item) => s + (item.price * item.quantity), 0);

      const [order] = await db.insert(orders).values({
        userId,
        status: "pending",
        subtotal: subtotal.toFixed(2),
        total: subtotal.toFixed(2),
        notes: billing ? `${billing.first_name} ${billing.last_name} - ${billing.phone || ""}`.trim() : undefined,
      }).returning();

      for (const item of verifiedItems) {
        await db.insert(orderItems).values({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price.toFixed(2),
          total: (item.price * item.quantity).toFixed(2),
        });
      }

      let session;
      try {
        const appUrl = process.env.APP_URL || `https://${process.env.REPLIT_DEV_DOMAIN || "localhost:5000"}`;

        session = await stripeClient.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "payment",
          line_items: verifiedItems.map((item) => ({
            price_data: {
              currency: "usd",
              product_data: {
                name: item.name,
                description: item.description || undefined,
                images: item.imageUrl ? [item.imageUrl] : undefined,
              },
              unit_amount: Math.round(item.price * 100),
            },
            quantity: item.quantity,
          })),
          success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${appUrl}/cart?cancelled=true`,
          customer_email: userEmail,
          metadata: {
            userId,
            orderId: order.id,
            source: "ffpma-platform",
          },
        });
      } catch (stripeError) {
        await db.update(orders).set({ status: "cancelled", updatedAt: new Date() }).where(eq(orders.id, order.id));
        throw stripeError;
      }

      await db.insert(payments).values({
        userId,
        orderId: order.id,
        stripeSessionId: session.id,
        status: "pending",
        amount: subtotal.toFixed(2),
        currency: "usd",
        customerEmail: userEmail,
        description: `Order #${order.id.slice(0, 8)} - ${verifiedItems.length} item(s)`,
        metadata: { items: verifiedItems.map((i) => ({ name: i.name, qty: i.quantity, price: i.price })) },
      });

      res.json({
        sessionId: session.id,
        url: session.url,
        orderId: order.id,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[Payments] Checkout session error:", message);
      res.status(500).json({ error: "Failed to create checkout session. Please try again." });
    }
  });

  app.post("/api/payments/webhook", async (req: Request, res: Response) => {
    try {
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!stripeKey) {
        return res.status(503).json({ error: "Stripe not configured" });
      }

      if (!webhookSecret) {
        console.error("[Payments] STRIPE_WEBHOOK_SECRET is not configured - rejecting webhook for security");
        return res.status(500).json({ error: "Webhook verification is not configured" });
      }

      const sig = req.headers["stripe-signature"] as string;
      if (!sig) {
        return res.status(400).json({ error: "Missing stripe-signature header" });
      }

      const stripe = (await import("stripe")).default;
      const stripeClient = new stripe(stripeKey);

      const rawBody = (req as { rawBody?: Buffer }).rawBody;
      if (!rawBody) {
        return res.status(400).json({ error: "Missing raw request body" });
      }

      const event = stripeClient.webhooks.constructEvent(rawBody, sig, webhookSecret);

      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          console.log(`[Payments] Checkout completed: ${session.id}, amount: ${session.amount_total}, email: ${session.customer_email}`);

          await db.update(payments)
            .set({
              status: "succeeded",
              stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : undefined,
              updatedAt: new Date(),
            })
            .where(eq(payments.stripeSessionId, session.id));

          const orderId = session.metadata?.orderId;
          if (orderId) {
            await db.update(orders)
              .set({ status: "processing", updatedAt: new Date() })
              .where(eq(orders.id, orderId));
          }
          break;
        }

        case "checkout.session.expired": {
          const session = event.data.object;
          console.log(`[Payments] Session expired: ${session.id}`);

          await db.update(payments)
            .set({ status: "cancelled", updatedAt: new Date() })
            .where(eq(payments.stripeSessionId, session.id));

          const orderId = session.metadata?.orderId;
          if (orderId) {
            await db.update(orders)
              .set({ status: "cancelled", updatedAt: new Date() })
              .where(eq(orders.id, orderId));
          }
          break;
        }

        case "payment_intent.payment_failed": {
          const intent = event.data.object;
          console.log(`[Payments] Payment failed: ${intent.id}, error: ${intent.last_payment_error?.message}`);

          const failedPayments = await db
            .select({ id: payments.id })
            .from(payments)
            .where(eq(payments.stripePaymentIntentId, intent.id));

          if (failedPayments.length > 0) {
            await db.update(payments)
              .set({
                status: "failed",
                failureMessage: intent.last_payment_error?.message || "Payment failed",
                updatedAt: new Date(),
              })
              .where(eq(payments.stripePaymentIntentId, intent.id));
          } else {
            console.log(`[Payments] No payment record found for intent ${intent.id}`);
          }
          break;
        }

        case "charge.refunded": {
          const charge = event.data.object;
          console.log(`[Payments] Refund processed: ${charge.id}`);

          if (typeof charge.payment_intent === "string") {
            await db.update(payments)
              .set({
                status: "refunded",
                receiptUrl: charge.receipt_url || undefined,
                updatedAt: new Date(),
              })
              .where(eq(payments.stripePaymentIntentId, charge.payment_intent));
          }
          break;
        }

        default:
          console.log(`[Payments] Unhandled event: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Webhook processing failed";
      console.error("[Payments] Webhook error:", message);
      res.status(400).json({ error: "Webhook processing failed" });
    }
  });

  app.get("/api/payments/session/:sessionId", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const userId = user.id;
      const sessionId = req.params.sessionId;

      const [paymentRecord] = await db
        .select()
        .from(payments)
        .where(and(
          eq(payments.stripeSessionId, sessionId),
          eq(payments.userId, userId)
        ));

      if (!paymentRecord) {
        return res.status(404).json({ error: "Payment session not found" });
      }

      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) {
        return res.json({
          id: paymentRecord.stripeSessionId,
          payment_status: paymentRecord.status === "succeeded" ? "paid" : paymentRecord.status,
          status: paymentRecord.status,
          amount_total: Math.round(parseFloat(paymentRecord.amount) * 100),
          currency: paymentRecord.currency,
          customer_email: paymentRecord.customerEmail,
        });
      }

      const stripe = (await import("stripe")).default;
      const stripeClient = new stripe(stripeKey);

      const session = await stripeClient.checkout.sessions.retrieve(sessionId);

      res.json({
        id: session.id,
        payment_status: session.payment_status,
        status: session.status,
        amount_total: session.amount_total,
        currency: session.currency,
        customer_email: session.customer_email,
      });
    } catch (error: unknown) {
      console.error("[Payments] Session retrieval error:", error instanceof Error ? error.message : error);
      res.status(500).json({ error: "Failed to retrieve session" });
    }
  });

  app.get("/api/payments/history", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const userPayments = await db
        .select()
        .from(payments)
        .where(eq(payments.userId, user.id))
        .orderBy(desc(payments.createdAt))
        .limit(50);

      res.json(userPayments);
    } catch (error: unknown) {
      console.error("[Payments] History error:", error instanceof Error ? error.message : error);
      res.status(500).json({ error: "Failed to fetch payment history" });
    }
  });

  app.get("/api/admin/payments", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const statusFilter = req.query.status as string | undefined;

      const validStatuses = ["pending", "processing", "succeeded", "failed", "refunded", "cancelled"];
      const conditions = statusFilter && validStatuses.includes(statusFilter)
        ? eq(payments.status, statusFilter as typeof payments.status.enumValues[number])
        : undefined;

      const allPayments = await db
        .select()
        .from(payments)
        .where(conditions)
        .orderBy(desc(payments.createdAt))
        .limit(limit)
        .offset(offset);

      const [totalResult] = await db
        .select({ count: count() })
        .from(payments)
        .where(conditions);

      res.json({
        payments: allPayments,
        total: totalResult?.count || 0,
        limit,
        offset,
      });
    } catch (error: unknown) {
      console.error("[Admin Payments] Error:", error instanceof Error ? error.message : error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  app.get("/api/admin/payments/summary", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [totalRevenue] = await db
        .select({ total: sum(payments.amount), count: count() })
        .from(payments)
        .where(eq(payments.status, "succeeded"));

      const [monthlyRevenue] = await db
        .select({ total: sum(payments.amount), count: count() })
        .from(payments)
        .where(and(
          eq(payments.status, "succeeded"),
          gte(payments.createdAt, thirtyDaysAgo)
        ));

      const [weeklyRevenue] = await db
        .select({ total: sum(payments.amount), count: count() })
        .from(payments)
        .where(and(
          eq(payments.status, "succeeded"),
          gte(payments.createdAt, sevenDaysAgo)
        ));

      const [failedCount] = await db
        .select({ count: count() })
        .from(payments)
        .where(eq(payments.status, "failed"));

      const [pendingCount] = await db
        .select({ count: count() })
        .from(payments)
        .where(eq(payments.status, "pending"));

      res.json({
        totalRevenue: parseFloat(totalRevenue?.total || "0"),
        totalTransactions: totalRevenue?.count || 0,
        monthlyRevenue: parseFloat(monthlyRevenue?.total || "0"),
        monthlyTransactions: monthlyRevenue?.count || 0,
        weeklyRevenue: parseFloat(weeklyRevenue?.total || "0"),
        weeklyTransactions: weeklyRevenue?.count || 0,
        failedTransactions: failedCount?.count || 0,
        pendingTransactions: pendingCount?.count || 0,
      });
    } catch (error: unknown) {
      console.error("[Admin Payments Summary] Error:", error instanceof Error ? error.message : error);
      res.status(500).json({ error: "Failed to fetch payment summary" });
    }
  });
}
