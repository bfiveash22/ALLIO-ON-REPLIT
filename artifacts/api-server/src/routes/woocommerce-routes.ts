import type { Express, Request, Response } from "express";
import { requireAuth, requireRole } from "../working-auth";
import { wooCommerceService } from "../services/woocommerce";
import { wordPressAuthService } from "../services/wordpress-auth";

export function registerWooCommerceRoutes(app: Express): void {
  app.get("/api/woocommerce/status", async (req: Request, res: Response) => {
    try {
      const status = await wooCommerceService.getConnectionStatus();
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ error: error.message, connected: false, configured: false });
    }
  });

  app.get("/api/woocommerce/products", async (req: Request, res: Response) => {
    try {
      const userWpRoles = req.user ? ((req.user as any).wpRoles || []) : [];
      const userRole = req.user ? (req.user as any).role : 'guest';
      const effectiveRoles = [...userWpRoles, userRole].map((r: string) => r.toLowerCase());
      const isAdmin = effectiveRoles.includes('administrator') || effectiveRoles.includes('trustee');

      const filterRestricted = (product: any) => {
        if (isAdmin) return true;
        if (!product.restrictedRoles || product.restrictedRoles.length === 0) return true;
        return !effectiveRoles.some((r: string) => product.restrictedRoles!.map((rr: string) => rr.toLowerCase()).includes(r));
      };

      const fetchAll = req.query.all === 'true';
      const page = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.per_page as string) || 100;

      if (fetchAll) {
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
        const isRestricted = effectiveRoles.some((r: string) => product.restrictedRoles!.map((rr: string) => rr.toLowerCase()).includes(r));
        if (isRestricted) {
          return res.status(403).json({ error: "This product is not available for your user group." });
        }
      }

      const wooOrderId = req.query.wooOrderId ? parseInt(req.query.wooOrderId as string) : null;
      if (wooOrderId) {
        const order = await wooCommerceService.getOrderById(wooOrderId);
        if (!order) {
          return res.status(404).json({ error: "Referenced WooCommerce order not found.", qualifies: false });
        }

        const requestingUser = req.user as any;
        const userEmail = (requestingUser?.email || "").toLowerCase();
        const orderBillingEmail = (order.billing?.email || "").toLowerCase();
        const userWpRolesForOrder: string[] = requestingUser?.wpRoles || [];
        const isAdminUser =
          requestingUser?.role === "admin" ||
          requestingUser?.role === "trustee" ||
          userWpRolesForOrder.some((r: string) => ["administrator", "trustee"].includes(r.toLowerCase()));

        if (!isAdminUser && (!userEmail || userEmail !== orderBillingEmail)) {
          return res.status(403).json({ error: "You do not have permission to access this order.", qualifies: false });
        }

        const verification = wooCommerceService.verifyOrderStatus(order.status);
        if (!verification.qualifies) {
          return res.status(403).json({
            error: `Product access denied: ${verification.reason}`,
            qualifies: false,
            orderStatus: order.status,
            statusCategory: verification.category,
          });
        }
      }

      res.json(product);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/woocommerce/categories", async (req: Request, res: Response) => {
    try {
      const categories = await wooCommerceService.getCategories();
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/woocommerce/brands", async (req: Request, res: Response) => {
    try {
      const brands = await wooCommerceService.getBrands();
      res.json(brands);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/woocommerce/attributes", async (req: Request, res: Response) => {
    try {
      const attributes = await wooCommerceService.getProductAttributes();
      res.json(attributes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/woocommerce/sync", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const result = await wooCommerceService.syncAllProducts();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message, success: false });
    }
  });

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

  app.get("/api/auth/membership/:userId", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const membership = await wordPressAuthService.checkMembership(userId);
      res.json(membership);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

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

  app.get("/api/woocommerce/orders", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.per_page as string) || 20;
      const status = req.query.status as string | undefined;

      const result = await wooCommerceService.getOrders({ page, perPage, status });

      const annotatedOrders = result.orders.map((order: any) => {
        const verification = wooCommerceService.verifyOrderStatus(order.status);
        return {
          ...order,
          statusCategory: verification.category,
          qualifiesForFulfillment: verification.qualifies,
          statusReason: verification.reason,
        };
      });

      res.json({ ...result, orders: annotatedOrders });
    } catch (error: any) {
      console.error('[WooCommerce Orders] Error:', error.message);
      res.json({ orders: [], total: 0, totalPages: 0 });
    }
  });

  app.get("/api/woocommerce/orders/:id/verify-access", requireAuth, async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.id);
      if (!orderId || isNaN(orderId)) {
        return res.status(400).json({ error: "Invalid order ID" });
      }

      const order = await wooCommerceService.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found", qualifies: false });
      }

      const requestingUser = req.user as any;
      const userEmail = (requestingUser?.email || "").toLowerCase();
      const orderBillingEmail = (order.billing?.email || "").toLowerCase();
      const userWpRoles: string[] = requestingUser?.wpRoles || [];
      const isAdmin =
        requestingUser?.role === "admin" ||
        requestingUser?.role === "trustee" ||
        userWpRoles.some((r: string) => ["administrator", "trustee"].includes(r.toLowerCase()));

      if (!isAdmin && (!userEmail || userEmail !== orderBillingEmail)) {
        return res.status(403).json({ error: "You do not have permission to verify this order.", qualifies: false });
      }

      const verification = wooCommerceService.verifyOrderStatus(order.status);

      if (!verification.qualifies) {
        return res.status(403).json({
          qualifies: false,
          status: order.status,
          category: verification.category,
          reason: verification.reason,
          orderId: order.id,
        });
      }

      res.json({
        qualifies: true,
        status: order.status,
        category: verification.category,
        reason: verification.reason,
        orderId: order.id,
        lineItems: order.line_items,
        total: order.total,
        currency: order.currency,
      });
    } catch (error: any) {
      console.error('[WooCommerce VerifyAccess] Error:', error.message);
      res.status(500).json({ error: error.message, qualifies: false });
    }
  });

  app.post("/api/woocommerce/grant-access", requireAuth, async (req: Request, res: Response) => {
    try {
      const { wooOrderId, accessType } = req.body;

      if (!wooOrderId) {
        return res.status(400).json({
          error: "wooOrderId is required. Access cannot be granted without a valid WooCommerce order reference.",
          granted: false,
        });
      }

      if (!accessType || !["product", "member-tier"].includes(accessType)) {
        return res.status(400).json({
          error: "accessType must be 'product' or 'member-tier'.",
          granted: false,
        });
      }

      const orderId = parseInt(wooOrderId);
      if (!orderId || isNaN(orderId)) {
        return res.status(400).json({ error: "Invalid wooOrderId.", granted: false });
      }

      const order = await wooCommerceService.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ error: "WooCommerce order not found.", granted: false });
      }

      const requestingUser = req.user as any;
      const userEmail = (requestingUser?.email || "").toLowerCase();
      const orderBillingEmail = (order.billing?.email || "").toLowerCase();
      const userWpRolesForGrant: string[] = requestingUser?.wpRoles || [];
      const isAdminGrantUser =
        requestingUser?.role === "admin" ||
        requestingUser?.role === "trustee" ||
        userWpRolesForGrant.some((r: string) => ["administrator", "trustee"].includes(r.toLowerCase()));

      if (!isAdminGrantUser && (!userEmail || userEmail !== orderBillingEmail)) {
        return res.status(403).json({
          error: "You do not have permission to request access for this order.",
          granted: false,
        });
      }

      const verification = wooCommerceService.verifyOrderStatus(order.status);
      if (!verification.qualifies) {
        return res.status(403).json({
          error: `Access denied: ${verification.reason}`,
          granted: false,
          orderStatus: order.status,
          statusCategory: verification.category,
        });
      }

      if (accessType === "member-tier") {
        const { targetUserId, newRole } = req.body;
        if (!targetUserId || !newRole) {
          return res.status(400).json({
            error: "targetUserId and newRole are required for member-tier access grants.",
            granted: false,
          });
        }

        const requestingUserId = String(requestingUser?.id || "");
        const targetUserIdStr = String(targetUserId);

        if (!isAdminGrantUser && requestingUserId !== targetUserIdStr) {
          return res.status(403).json({
            error: "Non-admin users may only request a tier upgrade for their own account.",
            granted: false,
          });
        }

        const adminOnlyRoles = ["administrator", "trustee"];
        const allowedNonAdminRoles = ["member", "practitioner"];
        const allowedAdminRoles = ["member", "doctor", "clinic", "practitioner"];

        if (!isAdminGrantUser && !allowedNonAdminRoles.includes(newRole)) {
          return res.status(403).json({
            error: `Non-admin users may not assign privileged roles. Allowed roles: ${allowedNonAdminRoles.join(", ")}.`,
            granted: false,
          });
        }

        if (isAdminGrantUser && !allowedAdminRoles.includes(newRole) && !adminOnlyRoles.includes(newRole)) {
          return res.status(400).json({
            error: `Invalid role "${newRole}". Allowed roles: ${[...allowedAdminRoles, ...adminOnlyRoles].join(", ")}.`,
            granted: false,
          });
        }

        const roleUpdateResult = await wordPressAuthService.updateUserRole(parseInt(targetUserId), newRole);
        if (!roleUpdateResult.success) {
          return res.status(502).json({
            error: `Role upgrade failed: ${roleUpdateResult.error}`,
            granted: false,
          });
        }

        return res.json({
          granted: true,
          accessType: "member-tier",
          orderId: order.id,
          orderStatus: order.status,
          statusCategory: verification.category,
          targetUserId,
          newRole,
          message: `Member tier upgraded to "${newRole}" for user ${targetUserId}. Order #${order.id} qualified (status: ${order.status}).`,
        });
      }

      res.json({
        granted: true,
        accessType,
        orderId: order.id,
        orderStatus: order.status,
        statusCategory: verification.category,
        message: `Access of type "${accessType}" granted. Order #${order.id} qualifies (status: ${order.status}).`,
      });
    } catch (error: any) {
      console.error('[WooCommerce GrantAccess] Error:', error.message);
      res.status(500).json({ error: error.message, granted: false });
    }
  });

  app.get("/api/woocommerce/order-stats", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const stats = await wooCommerceService.getOrderStats();
      res.json(stats);
    } catch (error: any) {
      console.error('[WooCommerce Order Stats] Error:', error.message);
      res.json({ totalOrders: 0, pendingOrders: 0, processingOrders: 0, completedOrders: 0, recentRevenue: 0 });
    }
  });

  app.post("/api/checkout/stripe/create-session", requireAuth, async (req: Request, res: Response) => {
    try {
      const { lineItems, successUrl, cancelUrl, customerEmail, wooOrderId } = req.body;
      if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
        return res.status(400).json({ error: "lineItems array is required" });
      }

      if (wooOrderId) {
        const wooOrder = await wooCommerceService.getOrderById(parseInt(wooOrderId));
        if (!wooOrder) {
          return res.status(404).json({ error: "Referenced WooCommerce order not found.", qualifies: false });
        }

        const sessionUser = req.user as any;
        const sessionUserEmail = (sessionUser?.email || "").toLowerCase();
        const wooOrderEmail = (wooOrder.billing?.email || "").toLowerCase();
        const sessionUserWpRoles: string[] = sessionUser?.wpRoles || [];
        const isSessionAdmin =
          sessionUser?.role === "admin" ||
          sessionUser?.role === "trustee" ||
          sessionUserWpRoles.some((r: string) => ["administrator", "trustee"].includes(r.toLowerCase()));

        if (!isSessionAdmin && (!sessionUserEmail || sessionUserEmail !== wooOrderEmail)) {
          return res.status(403).json({ error: "You do not have permission to checkout with this order.", qualifies: false });
        }

        const verification = wooCommerceService.verifyOrderStatus(wooOrder.status);
        if (!verification.qualifies) {
          return res.status(403).json({
            error: `Cannot process checkout: ${verification.reason}`,
            qualifies: false,
            orderStatus: wooOrder.status,
            statusCategory: verification.category,
          });
        }
      }

      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) {
        return res.status(503).json({ error: "Stripe is not configured. Add STRIPE_SECRET_KEY to enable payments." });
      }

      const stripe = (await import("stripe")).default;
      const stripeClient = new stripe(stripeKey);

      const session = await stripeClient.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: lineItems.map((item: any) => ({
          price_data: {
            currency: "usd",
            product_data: {
              name: item.name,
              description: item.description,
            },
            unit_amount: Math.round(item.price * 100),
          },
          quantity: item.quantity || 1,
        })),
        success_url: successUrl || `${process.env.APP_URL || "https://www.forgottenformula.com"}/member?payment=success`,
        cancel_url: cancelUrl || `${process.env.APP_URL || "https://www.forgottenformula.com"}/member?payment=cancelled`,
        customer_email: customerEmail || (req.user as any)?.email,
        metadata: {
          userId: (req.user as any)?.id || "unknown",
          source: "allio-platform",
          ...(wooOrderId ? { wooOrderId: String(wooOrderId) } : {}),
        },
      });

      res.json({
        sessionId: session.id,
        url: session.url,
      });
    } catch (error: any) {
      console.error("[Stripe] Checkout session error:", error.message);
      res.status(500).json({ error: error.message || "Failed to create checkout session" });
    }
  });

  app.post("/api/checkout/stripe/webhook", async (req: Request, res: Response) => {
    try {
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!stripeKey) {
        return res.status(503).json({ error: "Stripe not configured" });
      }

      const stripe = (await import("stripe")).default;
      const stripeClient = new stripe(stripeKey);

      if (!webhookSecret) {
        console.warn("[Stripe] STRIPE_WEBHOOK_SECRET not set - rejecting unsigned webhook for security");
        return res.status(400).json({ error: "Webhook secret not configured. Set STRIPE_WEBHOOK_SECRET to accept webhooks." });
      }

      const sig = req.headers["stripe-signature"] as string;
      if (!sig) {
        return res.status(400).json({ error: "Missing stripe-signature header" });
      }

      const event = stripeClient.webhooks.constructEvent(req.body, sig, webhookSecret);

      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          const wooOrderId = session.metadata?.wooOrderId ? parseInt(session.metadata.wooOrderId) : null;

          if (wooOrderId) {
            const wooOrder = await wooCommerceService.getOrderById(wooOrderId);
            if (wooOrder) {
              const verification = wooCommerceService.verifyOrderStatus(wooOrder.status);
              if (!verification.qualifies) {
                console.warn(
                  `[Stripe] Fulfillment BLOCKED for session ${session.id}: WooCommerce order #${wooOrderId} has non-qualifying status "${wooOrder.status}". Reason: ${verification.reason}`
                );
                break;
              }
              console.log(`[Stripe] Fulfillment APPROVED for session ${session.id}: WooCommerce order #${wooOrderId} status "${wooOrder.status}" qualifies.`);
            }
          }

          console.log(`[Stripe] Payment completed: ${session.id}, amount: ${session.amount_total}, email: ${session.customer_email}`);
          break;
        }
        case "payment_intent.payment_failed": {
          const intent = event.data.object;
          console.log(`[Stripe] Payment failed: ${intent.id}, error: ${intent.last_payment_error?.message}`);
          break;
        }
        default:
          console.log(`[Stripe] Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error("[Stripe] Webhook error:", error.message);
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/checkout/stripe/status", requireRole("admin"), async (_req: Request, res: Response) => {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    res.json({
      configured: !!stripeKey,
      mode: stripeKey?.startsWith("sk_live_") ? "live" : stripeKey?.startsWith("sk_test_") ? "test" : "unconfigured",
      webhookConfigured: !!process.env.STRIPE_WEBHOOK_SECRET,
    });
  });
}
