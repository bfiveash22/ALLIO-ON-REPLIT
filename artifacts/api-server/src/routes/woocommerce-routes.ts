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
      res.json(result);
    } catch (error: any) {
      console.error('[WooCommerce Orders] Error:', error.message);
      res.json({ orders: [], total: 0, totalPages: 0 });
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
}
