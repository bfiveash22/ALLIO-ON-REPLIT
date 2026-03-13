// @ts-nocheck
import type { Express } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import rateLimit from "express-rate-limit";
import fs from "fs";
import path from "path";
import { storage } from "./storage";
import { seedDatabase } from "./seed";
import { setupAuth, isAuthenticated, registerAuthRoutes, getSession } from "./replit_integrations/auth";
import { syncFromWordPress, syncCategories, syncProducts } from "./wordpress-sync";
import { validateWordPressConnection } from "./wordpress-auth";
import { listAllFolders, listFilesInFolder, getFolderContents, searchFoldersByName, getContentTypeFromMime, type DriveFile } from "./google-drive";
import * as signNow from "./signnow";
import { registerDianeRoutes } from "./diane-ai";
import { registerSupportAgentRoutes } from "./support-agents";
import { registerSentinelRoutes } from "./sentinel-routes";

// Rate limiter for login attempts to prevent brute force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per IP
  message: { error: "Too many login attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Helper to check if user has admin access (via profile role or WP administrator role)
async function isUserAdmin(req: any): Promise<boolean> {
  const userId = req.user?.claims?.sub;
  if (!userId) return false;
  
  // Check member profile for admin role
  const profile = await storage.getMemberProfileByUserId(userId);
  if (profile?.role === 'admin') return true;
  
  // Check user's WordPress roles for administrator
  const user = await storage.getUser(userId);
  if (user?.wpRoles) {
    const wpRolesArray = user.wpRoles.split(',').map((r: string) => r.trim().toLowerCase());
    if (wpRolesArray.some((r: string) => r === 'administrator' || r === 'admin')) return true;
  }
  
  return false;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Explicit route for project archive download (bypasses Vite in dev mode)
  app.get("/allio-v1-project.tar.gz", (_req, res) => {
    const archivePath = "/home/runner/workspace/server/public/allio-v1-project.tar.gz";
    if (fs.existsSync(archivePath)) {
      res.setHeader("Content-Type", "application/gzip");
      res.setHeader("Content-Disposition", "attachment; filename=allio-v1-project.tar.gz");
      fs.createReadStream(archivePath).pipe(res);
    } else {
      res.status(404).json({ error: "Archive not found" });
    }
  });

  // Setup authentication first
  await setupAuth(app);
  registerAuthRoutes(app);
  
  // Register Diane AI routes
  registerDianeRoutes(app);
  
  // Register Support Agent routes
  registerSupportAgentRoutes(app);
  
  // Register SENTINEL Orchestrator routes
  registerSentinelRoutes(app);

  // Seed database on startup
  try {
    await seedDatabase();
  } catch (error) {
    console.error("Error seeding database:", error);
  }

  // WordPress Authentication Routes - using Passport strategy for security
  // Rate limiting applied to prevent brute force attacks
  app.post("/api/wp/login", loginLimiter, (req, res, next) => {
    // Capture clinic ID from request for attribution tracking
    const { clinicId, referralCode } = req.body;
    
    passport.authenticate("wordpress", async (err: any, user: any, info: any) => {
      if (err) {
        console.error("WordPress auth error:", err);
        return res.status(500).json({ error: "Authentication failed" });
      }
      
      if (!user) {
        return res.status(401).json({ 
          error: info?.message || "Invalid username or password" 
        });
      }
      
      // Use req.login to establish the session with server-verified user data
      req.login(user, async (loginErr: any) => {
        if (loginErr) {
          console.error("Session login error:", loginErr);
          return res.status(500).json({ error: "Session creation failed" });
        }
        
        try {
          // Fetch verified user data from our database
          const dbUser = await storage.getUser(user.claims.sub);
          
          if (!dbUser) {
            console.error("User not found in database after authentication");
            return res.status(500).json({ error: "User verification failed" });
          }
          
          let profile = await storage.getMemberProfile(user.claims.sub);
          
          // If clinic ID provided and profile has no clinic yet, assign to clinic
          if (clinicId && profile && !profile.clinicId) {
            // Verify clinic exists
            const clinic = await storage.getClinic(clinicId);
            if (clinic) {
              profile = await storage.updateMemberProfile(profile.id, { clinicId }) || profile;
              console.log(`Assigned member ${dbUser.email} to clinic ${clinic.name}`);
            }
          }
          
          // If referral code provided, track the referral
          if (referralCode && profile && !profile.sponsorId) {
            const referral = await storage.getReferralByCode(referralCode);
            if (referral) {
              profile = await storage.updateMemberProfile(profile.id, { 
                sponsorId: referral.referrerId 
              }) || profile;
              console.log(`Assigned sponsor ${referral.referrerId} to member ${dbUser.email}`);
            }
          }
          
          res.json({
            user: dbUser,
            profile,
            message: "Login successful",
          });
        } catch (fetchErr) {
          console.error("Error fetching user data:", fetchErr);
          return res.status(500).json({ error: "Failed to load user data" });
        }
      });
    })(req, res, next);
  });
  
  app.get("/api/wp/status", async (req, res) => {
    const status = await validateWordPressConnection();
    res.json(status);
  });

  // Products
  // Helper to normalize WordPress roles to array
  const normalizeWpRoles = (rawRoles: any): string[] => {
    if (!rawRoles) return [];
    
    if (typeof rawRoles === 'string') {
      return rawRoles.split(',').map((r: string) => r.trim().toLowerCase());
    } else if (Array.isArray(rawRoles)) {
      return rawRoles.map((r: string) => r.toLowerCase());
    } else if (typeof rawRoles === 'object') {
      return Object.keys(rawRoles).filter(k => rawRoles[k]).map(r => r.toLowerCase());
    }
    return [];
  };

  // Get user's price tier and app role from database mappings
  // Also checks clinic's pricingVisibility setting for members - doctors can hide pricing from their downline
  const getUserPricingInfo = async (req: any): Promise<{ appRole: string; priceTier: string; canViewPricing: boolean; canPurchase: boolean; clinicPricingHidden?: boolean }> => {
    const user = req.user;
    if (!user) {
      return { appRole: 'guest', priceTier: 'retail', canViewPricing: false, canPurchase: false };
    }
    
    const rawRoles = user.claims?.wpRoles || user.wpRoles || [];
    const rolesArray = normalizeWpRoles(rawRoles);
    
    // Helper to check if member's clinic has hidden pricing
    const checkClinicPricingVisibility = async (userId: string): Promise<{ hidden: boolean; clinicName?: string }> => {
      try {
        const memberProfile = await storage.getMemberProfileByUserId(userId);
        if (memberProfile?.clinicId) {
          const clinic = await storage.getClinic(memberProfile.clinicId);
          if (clinic?.pricingVisibility === 'hidden') {
            return { hidden: true, clinicName: clinic.name };
          }
        }
      } catch (err) {
        console.error('Error checking clinic pricing visibility:', err);
      }
      return { hidden: false };
    };
    
    if (rolesArray.length === 0) {
      // Check if member's clinic has hidden pricing
      const clinicCheck = await checkClinicPricingVisibility(user.id);
      return { 
        appRole: 'member', 
        priceTier: 'retail', 
        canViewPricing: !clinicCheck.hidden, 
        canPurchase: true,
        clinicPricingHidden: clinicCheck.hidden
      };
    }
    
    // Get all role mappings from database
    const allMappings = await storage.getWpRoleMappings();
    
    // Find the highest priority mapping for user's roles
    let bestMapping: any = null;
    for (const role of rolesArray) {
      const mapping = allMappings.find((m: any) => m.wpRoleSlug === role);
      if (mapping && (!bestMapping || mapping.priority > bestMapping.priority)) {
        bestMapping = mapping;
      }
    }
    
    if (bestMapping) {
      let canViewPricing = bestMapping.canViewPricing ?? true;
      let clinicPricingHidden = false;
      
      // For members, also check clinic's pricing visibility setting
      if (bestMapping.appRole === 'member' || !bestMapping.appRole) {
        const clinicCheck = await checkClinicPricingVisibility(user.id);
        if (clinicCheck.hidden) {
          canViewPricing = false;
          clinicPricingHidden = true;
        }
      }
      
      return {
        appRole: bestMapping.appRole || 'member',
        priceTier: bestMapping.priceTier || 'retail',
        canViewPricing,
        canPurchase: bestMapping.canPurchase ?? true,
        clinicPricingHidden
      };
    }
    
    // Fallback to hardcoded logic if no mapping found
    if (rolesArray.some(r => r === 'administrator' || r === 'admin')) {
      return { appRole: 'admin', priceTier: 'admin', canViewPricing: true, canPurchase: true };
    }
    if (rolesArray.some(r => r === 'ff_doctor' || r === 'doctor')) {
      return { appRole: 'doctor', priceTier: 'doctor', canViewPricing: true, canPurchase: true };
    }
    if (rolesArray.some(r => r === 'ff_clinic' || r === 'clinic' || r === 'clinic_owner' || r === 'wholesaler')) {
      return { appRole: 'clinic', priceTier: 'wholesale', canViewPricing: true, canPurchase: true };
    }
    
    // For regular members, check clinic pricing visibility
    const clinicCheck = await checkClinicPricingVisibility(user.id);
    return { 
      appRole: 'member', 
      priceTier: 'retail', 
      canViewPricing: !clinicCheck.hidden, 
      canPurchase: true,
      clinicPricingHidden: clinicCheck.hidden
    };
  };

  // Legacy helper for backward compatibility
  const getUserRole = (req: any): string => {
    const user = req.user;
    if (!user) return 'guest';
    
    const rawRoles = user.claims?.wpRoles || user.wpRoles || [];
    const rolesArray = normalizeWpRoles(rawRoles);
    
    if (rolesArray.some(r => r === 'administrator' || r === 'admin')) return 'admin';
    if (rolesArray.some(r => r === 'ff_doctor' || r === 'doctor')) return 'doctor';
    if (rolesArray.some(r => r === 'ff_clinic' || r === 'clinic' || r === 'clinic_owner')) return 'clinic';
    
    return 'member';
  };

  // Helper function to filter product prices based on price tier from role mappings
  // Security: Always strip unauthorized price fields and only expose the single authorized price
  interface PricingContext {
    priceTier: string;
    canViewPricing: boolean;
    canPurchase: boolean;
    appRole?: string;
    clinicPricingHidden?: boolean;
  }
  
  const filterPricesByTier = (product: any, pricingCtx: PricingContext, parentRequiresMembership?: boolean): any => {
    const result = { ...product };
    const { priceTier, canViewPricing, canPurchase, appRole, clinicPricingHidden } = pricingCtx;
    
    // Variations inherit membership requirement from parent product
    const requiresMembership = parentRequiresMembership ?? result.requiresMembership;
    
    // Always strip all raw price fields - we'll add back only what's authorized
    const sanitizedResult = { ...result };
    delete sanitizedResult.retailPrice;
    delete sanitizedResult.wholesalePrice;
    delete sanitizedResult.doctorPrice;
    
    // Add trusted priceTier for frontend labeling
    sanitizedResult.priceTier = priceTier;
    sanitizedResult.userRole = appRole || priceTier;
    sanitizedResult.canPurchase = canPurchase;
    
    // If user cannot view pricing OR clinic has hidden pricing, hide all prices
    if (!canViewPricing || clinicPricingHidden) {
      sanitizedResult.displayPrice = null;
      sanitizedResult.priceVisible = false;
      sanitizedResult.showAllPrices = false;
      sanitizedResult.clinicPricingHidden = clinicPricingHidden;
      return sanitizedResult;
    }
    
    // Determine which price to show based on price tier
    switch (priceTier) {
      case 'admin':
        // Admin sees all prices for management
        sanitizedResult.displayPrice = result.retailPrice;
        sanitizedResult.priceVisible = true;
        sanitizedResult.showAllPrices = true;
        // Restore all prices for admin only
        sanitizedResult.retailPrice = result.retailPrice;
        sanitizedResult.wholesalePrice = result.wholesalePrice;
        sanitizedResult.doctorPrice = result.doctorPrice;
        break;
      case 'doctor':
        // Doctor tier sees doctor price only
        sanitizedResult.displayPrice = result.doctorPrice || result.retailPrice;
        sanitizedResult.priceVisible = true;
        sanitizedResult.showAllPrices = false;
        break;
      case 'wholesale':
        // Wholesale tier sees wholesale price only
        sanitizedResult.displayPrice = result.wholesalePrice || result.retailPrice;
        sanitizedResult.priceVisible = true;
        sanitizedResult.showAllPrices = false;
        break;
      case 'retail':
      default:
        // Retail tier sees retail price only
        if (requiresMembership && appRole === 'guest') {
          sanitizedResult.displayPrice = null;
          sanitizedResult.priceVisible = false;
        } else {
          sanitizedResult.displayPrice = result.retailPrice;
          sanitizedResult.priceVisible = true;
        }
        sanitizedResult.showAllPrices = false;
        break;
    }
    
    return sanitizedResult;
  };
  
  // Legacy wrapper for backward compatibility
  const filterPricesByRole = (product: any, userRole: string, parentRequiresMembership?: boolean): any => {
    const pricingCtx: PricingContext = {
      priceTier: userRole === 'clinic' ? 'wholesale' : userRole,
      canViewPricing: userRole !== 'guest',
      canPurchase: userRole !== 'guest',
      appRole: userRole
    };
    return filterPricesByTier(product, pricingCtx, parentRequiresMembership);
  };

  app.get("/api/products", async (req: any, res) => {
    try {
      const products = await storage.getProducts();
      const pricingInfo = await getUserPricingInfo(req);
      
      // Filter prices based on database-driven price tier with role-specific price lookup
      const filteredProducts = await Promise.all(products.map(async (p) => {
        // Check for role-specific price in product_role_prices table
        const rolePrice = await storage.getProductRolePrice(p.id, pricingInfo.priceTier);
        if (rolePrice) {
          const result = { ...p };
          delete (result as any).retailPrice;
          delete (result as any).wholesalePrice;
          delete (result as any).doctorPrice;
          // If clinic pricing is hidden, hide the price
          const priceHidden = pricingInfo.clinicPricingHidden || !pricingInfo.canViewPricing;
          return {
            ...result,
            displayPrice: priceHidden ? null : rolePrice.price,
            priceVisible: priceHidden ? false : rolePrice.priceVisible,
            priceTier: pricingInfo.priceTier,
            userRole: pricingInfo.appRole,
            canPurchase: priceHidden ? false : pricingInfo.canPurchase,
            showAllPrices: false,
            clinicPricingHidden: pricingInfo.clinicPricingHidden
          };
        }
        // Fall back to tier-based pricing (clinicPricingHidden is now handled inside filterPricesByTier)
        return filterPricesByTier(p, pricingInfo);
      }));
      
      res.json(filteredProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:slug", async (req: any, res) => {
    try {
      const product = await storage.getProductBySlug(req.params.slug);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      const pricingInfo = await getUserPricingInfo(req);
      
      // Check for role-specific price first
      const rolePrice = await storage.getProductRolePrice(product.id, pricingInfo.priceTier);
      let filteredProduct: any;
      
      if (rolePrice) {
        const result = { ...product };
        delete (result as any).retailPrice;
        delete (result as any).wholesalePrice;
        delete (result as any).doctorPrice;
        // If clinic pricing is hidden, hide the price
        const priceHidden = pricingInfo.clinicPricingHidden || !pricingInfo.canViewPricing;
        filteredProduct = {
          ...result,
          displayPrice: priceHidden ? null : rolePrice.price,
          priceVisible: priceHidden ? false : rolePrice.priceVisible,
          priceTier: pricingInfo.priceTier,
          userRole: pricingInfo.appRole,
          canPurchase: priceHidden ? false : pricingInfo.canPurchase,
          showAllPrices: false,
          clinicPricingHidden: pricingInfo.clinicPricingHidden
        };
      } else {
        // clinicPricingHidden is now handled inside filterPricesByTier
        filteredProduct = filterPricesByTier(product, pricingInfo);
      }
      
      // Get variations if this is a variable product
      if (product.productType === 'variable') {
        const variations = await storage.getProductVariations(product.id);
        filteredProduct.variations = await Promise.all(variations.map(async (v) => {
          // Check for role-specific variation price
          const varRolePrice = await storage.getProductRolePrice(product.id, pricingInfo.priceTier, v.id);
          if (varRolePrice) {
            const varResult = { ...v };
            delete (varResult as any).retailPrice;
            delete (varResult as any).wholesalePrice;
            delete (varResult as any).doctorPrice;
            // If clinic pricing is hidden, hide the price
            const priceHidden = pricingInfo.clinicPricingHidden || !pricingInfo.canViewPricing;
            return {
              ...varResult,
              displayPrice: priceHidden ? null : varRolePrice.price,
              priceVisible: priceHidden ? false : varRolePrice.priceVisible,
              priceTier: pricingInfo.priceTier,
              canPurchase: priceHidden ? false : pricingInfo.canPurchase,
              clinicPricingHidden: pricingInfo.clinicPricingHidden
            };
          }
          // clinicPricingHidden is now handled inside filterPricesByTier
          return filterPricesByTier(v, pricingInfo, product.requiresMembership ?? undefined);
        }));
      }
      
      res.json(filteredProduct);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  // Get product variations
  app.get("/api/products/:id/variations", async (req: any, res) => {
    try {
      // Lookup parent product to get requiresMembership context
      const product = await storage.getProduct(req.params.id);
      const parentRequiresMembership = product?.requiresMembership;
      
      const variations = await storage.getProductVariations(req.params.id);
      const pricingInfo = await getUserPricingInfo(req);
      
      // Check for role-specific prices for each variation
      const filteredVariations = await Promise.all(variations.map(async (v) => {
        const rolePrice = await storage.getProductRolePrice(req.params.id, pricingInfo.priceTier, v.id);
        if (rolePrice) {
          const result = { ...v };
          delete (result as any).retailPrice;
          delete (result as any).wholesalePrice;
          delete (result as any).doctorPrice;
          // If clinic pricing is hidden, hide the price
          const priceHidden = pricingInfo.clinicPricingHidden || !pricingInfo.canViewPricing;
          return {
            ...result,
            displayPrice: priceHidden ? null : rolePrice.price,
            priceVisible: priceHidden ? false : rolePrice.priceVisible,
            priceTier: pricingInfo.priceTier,
            canPurchase: priceHidden ? false : pricingInfo.canPurchase,
            clinicPricingHidden: pricingInfo.clinicPricingHidden
          };
        }
        // clinicPricingHidden is now handled inside filterPricesByTier
        return filterPricesByTier(v, pricingInfo, parentRequiresMembership ?? undefined);
      }));
      
      res.json(filteredVariations);
    } catch (error) {
      console.error("Error fetching variations:", error);
      res.status(500).json({ error: "Failed to fetch variations" });
    }
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // Library Items - combines WordPress content and Google Drive documents
  app.get("/api/library", async (req, res) => {
    try {
      const [libraryItems, driveDocuments] = await Promise.all([
        storage.getLibraryItems(),
        storage.getDriveDocuments()
      ]);
      
      // Transform drive documents to library item format for unified display
      const driveAsLibrary = driveDocuments.map(doc => ({
        id: doc.id,
        title: doc.title,
        slug: doc.slug,
        contentType: doc.contentType || 'document',
        content: null,
        excerpt: doc.description,
        imageUrl: doc.thumbnailLink,
        categorySlug: doc.folderPath,
        tags: null,
        authorName: null,
        wpPostId: null,
        viewCount: doc.viewCount,
        isActive: doc.isActive,
        requiresMembership: doc.requiresMembership,
        roleAccess: doc.roleAccess,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        // Extra fields for Drive documents
        webViewLink: doc.webViewLink,
        webContentLink: doc.webContentLink,
        mimeType: doc.mimeType,
        fileSize: doc.fileSize,
        isDriveDocument: true
      }));
      
      // Combine and return all items
      const allItems = [...libraryItems, ...driveAsLibrary];
      res.json(allItems);
    } catch (error) {
      console.error("Error fetching library items:", error);
      res.status(500).json({ error: "Failed to fetch library items" });
    }
  });

  // Get drive documents separately (for direct access)
  app.get("/api/drive/documents", async (req, res) => {
    try {
      const documents = await storage.getDriveDocuments();
      res.json(documents);
    } catch (error) {
      console.error("Error fetching drive documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  // Search Drive for folders
  app.get("/api/drive/search/folders", async (req, res) => {
    try {
      const { name } = req.query;
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: "Missing 'name' parameter" });
      }
      const { searchFoldersByName } = await import('./google-drive');
      const folders = await searchFoldersByName(name);
      res.json(folders);
    } catch (error) {
      console.error("Error searching Drive folders:", error);
      res.status(500).json({ error: "Failed to search folders" });
    }
  });

  // Search Drive for files
  app.get("/api/drive/search/files", async (req, res) => {
    try {
      const { name } = req.query;
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: "Missing 'name' parameter" });
      }
      const { searchFilesByName } = await import('./google-drive');
      const files = await searchFilesByName(name);
      res.json(files);
    } catch (error) {
      console.error("Error searching Drive files:", error);
      res.status(500).json({ error: "Failed to search files" });
    }
  });

  // List files in a Drive folder
  app.get("/api/drive/folder/:folderId", async (req, res) => {
    try {
      const { listFilesInFolder } = await import('./google-drive');
      const files = await listFilesInFolder(req.params.folderId);
      res.json(files);
    } catch (error) {
      console.error("Error listing folder contents:", error);
      res.status(500).json({ error: "Failed to list folder contents" });
    }
  });

  // List all Drive folders
  app.get("/api/drive/folders", async (req, res) => {
    try {
      const { listAllFolders } = await import('./google-drive');
      const folders = await listAllFolders();
      res.json(folders);
    } catch (error) {
      console.error("Error listing all folders:", error);
      res.status(500).json({ error: "Failed to list folders" });
    }
  });

  app.get("/api/library/:slug", async (req, res) => {
    try {
      // First check library items
      const item = await storage.getLibraryItemBySlug(req.params.slug);
      if (item) {
        return res.json(item);
      }
      
      // Then check drive documents
      const driveDoc = await storage.getDriveDocumentBySlug(req.params.slug);
      if (driveDoc) {
        return res.json({
          ...driveDoc,
          content: null,
          excerpt: driveDoc.description,
          imageUrl: driveDoc.thumbnailLink,
          categorySlug: driveDoc.folderPath,
          isDriveDocument: true
        });
      }
      
      return res.status(404).json({ error: "Library item not found" });
    } catch (error) {
      console.error("Error fetching library item:", error);
      res.status(500).json({ error: "Failed to fetch library item" });
    }
  });

  // Programs
  app.get("/api/programs", async (req, res) => {
    try {
      const programs = await storage.getPrograms();
      res.json(programs);
    } catch (error) {
      console.error("Error fetching programs:", error);
      res.status(500).json({ error: "Failed to fetch programs" });
    }
  });

  app.get("/api/programs/:slug", async (req, res) => {
    try {
      const program = await storage.getProgramBySlug(req.params.slug);
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }
      res.json(program);
    } catch (error) {
      console.error("Error fetching program:", error);
      res.status(500).json({ error: "Failed to fetch program" });
    }
  });

  // Orders - Protected routes
  app.get("/api/orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orders = await storage.getOrders(userId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const order = await storage.getOrder(req.params.id);
      if (!order || order.userId !== userId) {
        return res.status(404).json({ error: "Order not found" });
      }
      const items = await storage.getOrderItems(order.id);
      res.json({ ...order, items });
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  app.post("/api/orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const order = await storage.createOrder({
        ...req.body,
        userId,
      });
      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  // Contracts - Protected routes
  app.get("/api/contracts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const contracts = await storage.getContracts(userId);
      res.json(contracts);
    } catch (error) {
      console.error("Error fetching contracts:", error);
      res.status(500).json({ error: "Failed to fetch contracts" });
    }
  });

  app.get("/api/contracts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const contract = await storage.getContract(req.params.id);
      if (!contract || contract.userId !== userId) {
        return res.status(404).json({ error: "Contract not found" });
      }
      res.json(contract);
    } catch (error) {
      console.error("Error fetching contract:", error);
      res.status(500).json({ error: "Failed to fetch contract" });
    }
  });

  // Public clinic routes - for clinic URL tracking
  app.get("/api/clinics", async (req: any, res) => {
    try {
      // Check if user is admin to return full data (uses same helper as CRUD routes)
      const isAdmin = await isUserAdmin(req);
      
      if (isAdmin) {
        // Admin gets full list including inactive clinics
        const allClinics = await (storage as any).getAllClinicsIncludingInactive?.() || await storage.getClinics();
        res.json(allClinics);
      } else {
        // Non-admin gets basic public info only
        const clinics = await storage.getClinics();
        res.json(clinics.map(c => ({ id: c.id, name: c.name, slug: c.slug })));
      }
    } catch (error) {
      console.error("Error fetching clinics:", error);
      res.status(500).json({ error: "Failed to fetch clinics" });
    }
  });

  app.get("/api/clinics/:idOrSlug", async (req, res) => {
    try {
      const { idOrSlug } = req.params;
      
      // Try to find by ID first, then by slug
      let clinic = await storage.getClinic(idOrSlug);
      if (!clinic) {
        clinic = await storage.getClinicBySlug(idOrSlug);
      }
      
      if (!clinic) {
        return res.status(404).json({ error: "Clinic not found" });
      }
      
      // Try to get doctor name from owner
      let doctorName: string | undefined;
      if (clinic.ownerId) {
        const owner = await storage.getUser(clinic.ownerId);
        if (owner) {
          doctorName = owner.firstName || owner.wpUsername || undefined;
        }
      }
      
      // Return basic public info only
      res.json({ 
        id: clinic.id, 
        name: clinic.name, 
        slug: clinic.slug,
        doctorName,
        wcMembershipProductId: clinic.wcMembershipProductId,
      });
    } catch (error) {
      console.error("Error fetching clinic:", error);
      res.status(500).json({ error: "Failed to fetch clinic" });
    }
  });

  // Member signup - public endpoint for joining via clinic link
  // Redirects to WooCommerce for payment processing
  app.post("/api/memberships/signup", async (req, res) => {
    try {
      const { 
        firstName, 
        lastName, 
        email, 
        phone, 
        address, 
        city, 
        state, 
        zipCode, 
        clinicId 
      } = req.body;

      if (!firstName || !lastName || !email) {
        return res.status(400).json({ error: "First name, last name, and email are required" });
      }

      // Verify clinic exists and get WooCommerce product ID
      let clinic = null;
      let wcProductId = null;
      if (clinicId) {
        clinic = await storage.getClinic(clinicId);
        if (!clinic) {
          // Try by slug
          clinic = await storage.getClinicBySlug(clinicId);
        }
        if (!clinic) {
          return res.status(400).json({ error: "Invalid clinic reference" });
        }
        wcProductId = clinic.wcMembershipProductId;
      }

      // WooCommerce store URL
      const wcStoreUrl = process.env.VITE_WOOCOMMERCE_URL || process.env.WP_SITE_URL || 'https://wordpress-1347597-6126502.cloudwaysapps.com';
      
      // Default WooCommerce membership product ID (you'll set this in your WooCommerce)
      // This should be the product ID for the $10 PMA Membership
      const defaultMembershipProductId = wcProductId || process.env.WC_MEMBERSHIP_PRODUCT_ID || '0';
      
      // Build WooCommerce checkout URL with member info in query params
      // WooCommerce will handle the payment via "Payments by Stripe" plugin
      const checkoutParams = new URLSearchParams({
        add_to_cart: String(defaultMembershipProductId),
        quantity: '1',
        billing_first_name: firstName,
        billing_last_name: lastName,
        billing_email: email,
        billing_phone: phone || '',
        billing_address_1: address || '',
        billing_city: city || '',
        billing_state: state || '',
        billing_postcode: zipCode || '',
        clinic_id: clinic?.id || '',
        clinic_slug: clinic?.slug || '',
      });

      // Direct to WooCommerce checkout with product in cart
      const checkoutUrl = `${wcStoreUrl}/checkout/?${checkoutParams.toString()}`;

      res.json({ checkoutUrl });
    } catch (error) {
      console.error("Error creating membership signup:", error);
      res.status(500).json({ error: "Failed to process membership signup" });
    }
  });

  // Activate membership after successful payment
  app.post("/api/memberships/activate", async (req, res) => {
    try {
      const { retrieveCheckoutSession } = await import("./stripe");
      const { sessionId } = req.body;

      if (!sessionId) {
        return res.status(400).json({ error: "Session ID required" });
      }

      // Verify payment was successful
      const session = await retrieveCheckoutSession(sessionId);
      if (!session || session.payment_status !== "paid") {
        return res.status(400).json({ error: "Payment not confirmed" });
      }

      // Check it's a membership type
      if (session.metadata?.type !== "membership") {
        return res.status(400).json({ error: "Invalid session type" });
      }

      const { firstName, lastName, email, phone, address, city, state, zipCode, clinicId } = session.metadata;

      // Check if user already exists
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Create user record without password - users authenticate via WordPress SSO
        // The user will need to create a WordPress account or use existing credentials
        user = await storage.createUser({
          email,
          firstName,
          lastName,
          // No password stored here - authentication happens via WordPress
        });
      }

      // Check if member profile exists
      let profile = await storage.getMemberProfileByUserId(user.id);
      
      if (!profile) {
        // Create member profile linked to clinic
        profile = await storage.createMemberProfile({
          userId: user.id,
          role: "member",
          clinicId: clinicId || null,
          sponsorId: clinicId ? (await storage.getClinic(clinicId))?.ownerId || null : null,
          phone: phone || null,
          address: address || null,
          city: city || null,
          state: state || null,
          zipCode: zipCode || null,
        });
      }

      // Automatically push new user to WordPress (bidirectional sync)
      // This runs in the background and doesn't block the response
      const { pushUserToWordPress } = await import("./wordpress-sync");
      pushUserToWordPress(user.id).then(result => {
        if (result.success) {
          console.log(`New member ${email} pushed to WordPress: ${result.wpUsername}`);
        } else {
          console.log(`New member ${email} not pushed to WordPress: ${result.message}`);
        }
      }).catch(err => {
        console.error(`Error pushing new member ${email} to WordPress:`, err);
      });

      res.json({ 
        success: true, 
        userId: user.id, 
        message: "Membership activated successfully" 
      });
    } catch (error) {
      console.error("Error activating membership:", error);
      res.status(500).json({ error: "Failed to activate membership" });
    }
  });

  // Clinic routes - Protected, Doctor/Clinic role
  app.get("/api/clinic", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const clinic = await storage.getClinicByOwner(userId);
      if (!clinic) {
        return res.status(404).json({ error: "Clinic not found" });
      }
      res.json(clinic);
    } catch (error) {
      console.error("Error fetching clinic:", error);
      res.status(500).json({ error: "Failed to fetch clinic" });
    }
  });

  app.get("/api/clinic/members", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const clinic = await storage.getClinicByOwner(userId);
      if (!clinic) {
        return res.json([]);
      }
      const members = await storage.getMemberProfiles(clinic.id);
      res.json(members);
    } catch (error) {
      console.error("Error fetching clinic members:", error);
      res.status(500).json({ error: "Failed to fetch clinic members" });
    }
  });

  app.post("/api/clinic", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const clinic = await storage.createClinic({
        ...req.body,
        ownerId: userId,
      });
      res.status(201).json(clinic);
    } catch (error) {
      console.error("Error creating clinic:", error);
      res.status(500).json({ error: "Failed to create clinic" });
    }
  });

  // Member Profile routes
  app.get("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getMemberProfileByUserId(userId);
      
      // Also get user's WordPress roles for role-based pricing
      const wpRoles = await storage.getUserWpRoles(userId);
      const wpRolesList = wpRoles.map(r => r.wpRoleSlug);
      
      // Always return wpRoles, even if no member profile exists
      if (profile) {
        res.json({ ...profile, wpRoles: wpRolesList });
      } else {
        // Return minimal profile with wpRoles for users without member profiles
        res.json({ 
          id: null, 
          userId, 
          role: 'member', 
          wpRoles: wpRolesList 
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.post("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.createMemberProfile({
        ...req.body,
        userId,
      });
      res.status(201).json(profile);
    } catch (error) {
      console.error("Error creating profile:", error);
      res.status(500).json({ error: "Failed to create profile" });
    }
  });

  // Program Enrollments
  app.get("/api/enrollments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const enrollments = await storage.getProgramEnrollments(userId);
      res.json(enrollments);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      res.status(500).json({ error: "Failed to fetch enrollments" });
    }
  });

  app.post("/api/enrollments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const enrollment = await storage.createProgramEnrollment({
        ...req.body,
        userId,
      });
      res.status(201).json(enrollment);
    } catch (error) {
      console.error("Error creating enrollment:", error);
      res.status(500).json({ error: "Failed to create enrollment" });
    }
  });

  // WordPress Sync - Admin only
  app.post("/api/admin/sync-wordpress", isAuthenticated, async (req: any, res) => {
    try {
      console.log("Starting WordPress sync...");
      await syncCategories();
      await syncProducts();
      const products = await storage.getProducts();
      const categories = await storage.getCategories();
      res.json({ 
        success: true, 
        message: "Sync completed",
        counts: { products: products.length, categories: categories.length }
      });
    } catch (error) {
      console.error("Error syncing from WordPress:", error);
      res.status(500).json({ error: "Failed to sync from WordPress" });
    }
  });

  // WordPress User Import - Admin only
  app.post("/api/admin/sync-users", isAuthenticated, async (req: any, res) => {
    try {
      const { syncUsers } = await import("./wordpress-sync");
      console.log("Starting WordPress user sync...");
      const result = await syncUsers();
      res.json({ 
        success: true, 
        message: `User sync completed: ${result.imported} imported, ${result.updated} updated, ${result.skipped} skipped`,
        ...result
      });
    } catch (error: any) {
      console.error("Error syncing users from WordPress:", error);
      res.status(500).json({ error: error.message || "Failed to sync users from WordPress" });
    }
  });

  // Fix Member Profile Roles - Admin only - Updates member_profiles based on existing wpRoles
  app.post("/api/admin/fix-roles", isAuthenticated, async (req: any, res) => {
    try {
      const { fixMemberProfileRoles } = await import("./wordpress-sync");
      console.log("Starting member profile role fix...");
      const result = await fixMemberProfileRoles();
      res.json({ 
        success: true, 
        message: `Role fix completed: ${result.updated} profiles updated`,
        ...result
      });
    } catch (error: any) {
      console.error("Error fixing member profile roles:", error);
      res.status(500).json({ error: error.message || "Failed to fix member profile roles" });
    }
  });

  // Push Users to WordPress - Admin only - Creates unsynced users in WordPress
  app.post("/api/admin/push-users-to-wordpress", isAuthenticated, async (req: any, res) => {
    try {
      // Verify admin role
      const userId = req.user?.claims?.sub;
      if (userId) {
        const profile = await storage.getMemberProfileByUserId(userId);
        if (!profile || profile.role !== 'admin') {
          return res.status(403).json({ error: "Admin access required" });
        }
      } else {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { pushAllUsersToWordPress } = await import("./wordpress-sync");
      console.log("Starting push users to WordPress...");
      const result = await pushAllUsersToWordPress();
      res.json({ 
        success: true, 
        message: `Push completed: ${result.success} created, ${result.failed} failed, ${result.skipped} skipped`,
        ...result
      });
    } catch (error: any) {
      console.error("Error pushing users to WordPress:", error);
      res.status(500).json({ error: error.message || "Failed to push users to WordPress" });
    }
  });

  // Push Single User to WordPress - Admin only
  app.post("/api/admin/push-user-to-wordpress/:userId", isAuthenticated, async (req: any, res) => {
    try {
      // Verify admin role
      const authUserId = req.user?.claims?.sub;
      if (authUserId) {
        const profile = await storage.getMemberProfileByUserId(authUserId);
        if (!profile || profile.role !== 'admin') {
          return res.status(403).json({ error: "Admin access required" });
        }
      } else {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { pushUserToWordPress } = await import("./wordpress-sync");
      const { userId } = req.params;
      console.log(`Pushing user ${userId} to WordPress...`);
      const result = await pushUserToWordPress(userId);
      
      if (result.success) {
        res.json({ success: true, ...result });
      } else {
        res.status(400).json({ success: false, ...result });
      }
    } catch (error: any) {
      console.error("Error pushing user to WordPress:", error);
      res.status(500).json({ error: error.message || "Failed to push user to WordPress" });
    }
  });

  // Import Clinic Master Data - Admin only - Imports clinic data from Excel spreadsheets
  app.post("/api/admin/import-clinics", isAuthenticated, async (req: any, res) => {
    try {
      // Verify admin role
      const userId = req.user?.claims?.sub;
      if (userId) {
        const profile = await storage.getMemberProfileByUserId(userId);
        if (!profile || profile.role !== 'admin') {
          return res.status(403).json({ error: "Admin access required" });
        }
      } else {
        return res.status(403).json({ error: "Admin access required" });
      }

      const XLSX = await import("xlsx");
      const fs = await import("fs");
      const path = await import("path");
      const { insertClinicSchema } = await import("@shared/schema");
      
      const results = {
        imported: 0,
        updated: 0,
        skipped: 0,
        validationErrors: 0,
        details: [] as string[]
      };

      // Load and parse the clinic master spreadsheet
      const doctorMasterPath = path.join(process.cwd(), "attached_assets/Doctor_and_Clinic_Master-_USE_THIS_ONE!!!_(1)_1768041450895.xlsx");
      const clinicsTemplatePath = path.join(process.cwd(), "attached_assets/Clinics_1768041450895.xlsx");

      // Parse Doctor/Clinic Master file (has more details)
      if (fs.existsSync(doctorMasterPath)) {
        const wb = XLSX.readFile(doctorMasterPath);
        const ws = wb.Sheets[wb.SheetNames[0]];
        const doctorRecords = XLSX.utils.sheet_to_json(ws) as any[];

        for (const record of doctorRecords) {
          try {
            const clinicName = record["Clinic Name"] || record["Dr Name"];
            const signupUrl = record["SignUpLink"];
            
            if (!clinicName) {
              results.skipped++;
              continue;
            }

            // Extract clinic_id from URL if present
            let wpClinicId: number | null = null;
            if (signupUrl && typeof signupUrl === 'string') {
              const match = signupUrl.match(/clinic_id=(\d+)/);
              if (match) {
                wpClinicId = parseInt(match[1]);
              }
            }

            // Check if clinic exists by wpClinicId
            let existingClinic = wpClinicId ? await storage.getClinicByWpId(wpClinicId) : null;

            // Prepare raw data for validation
            const rawClinicData = {
              name: String(clinicName).trim(),
              address: record["Clinic Address"] || null,
              phone: record["Phone Number Personal"] ? String(record["Phone Number Personal"]) : null,
              email: record["Email Address"] || null,
              signupUrl: signupUrl || null,
              wpClinicId: wpClinicId,
              practiceType: record["Type of Practice"] || null,
              onboardedBy: record["Onboarded By"] || null,
              onMap: record["On Map"]?.toLowerCase() === "yes" || false,
              ownerId: null, // Will be linked when doctor account is associated
            };

            // Validate using Zod schema
            const validationResult = insertClinicSchema.safeParse(rawClinicData);
            if (!validationResult.success) {
              results.validationErrors++;
              results.details.push(`Validation error: ${clinicName} - ${validationResult.error.message}`);
              continue;
            }

            const clinicData = validationResult.data;

            if (existingClinic) {
              await storage.updateClinic(existingClinic.id, clinicData);
              results.updated++;
              results.details.push(`Updated: ${clinicName} (WP ID: ${wpClinicId})`);
            } else {
              await storage.createClinic(clinicData);
              results.imported++;
              results.details.push(`Imported: ${clinicName} (WP ID: ${wpClinicId || 'none'})`);
            }
          } catch (e: any) {
            results.skipped++;
            results.details.push(`Error: ${record["Clinic Name"] || 'Unknown'} - ${e.message}`);
          }
        }
      }

      // Parse Clinics template file (has SignNow template IDs)
      if (fs.existsSync(clinicsTemplatePath)) {
        const wb = XLSX.readFile(clinicsTemplatePath);
        const ws = wb.Sheets[wb.SheetNames[0]];
        const templateRecords = XLSX.utils.sheet_to_json(ws) as any[];

        for (const record of templateRecords) {
          try {
            const signupUrl = record["URL"];
            const templateId = record["Template ID"];
            
            if (!signupUrl || !templateId) continue;

            // Extract clinic_id from URL
            const match = signupUrl.match(/clinic_id=(\d+)/);
            if (match) {
              const wpClinicId = parseInt(match[1]);
              const existingClinic = await storage.getClinicByWpId(wpClinicId);
              
              if (existingClinic) {
                await storage.updateClinic(existingClinic.id, {
                  signNowTemplateId: templateId,
                  signupUrl: signupUrl
                });
                results.details.push(`Added template to: ${existingClinic.name}`);
              }
            }
          } catch (e: any) {
            results.details.push(`Template error: ${e.message}`);
          }
        }
      }

      res.json({
        success: true,
        message: `Clinic import completed: ${results.imported} imported, ${results.updated} updated, ${results.skipped} skipped`,
        ...results
      });
    } catch (error: any) {
      console.error("Error importing clinics:", error);
      res.status(500).json({ error: error.message || "Failed to import clinics" });
    }
  });

  // Admin Clinic CRUD - Create individual clinic
  app.post("/api/admin/clinic", isAuthenticated, async (req: any, res) => {
    try {
      // Verify admin role
      if (!await isUserAdmin(req)) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { insertClinicSchema } = await import("@shared/schema");
      const validationResult = insertClinicSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationResult.error.errors 
        });
      }

      const clinic = await storage.createClinic(validationResult.data);
      res.status(201).json(clinic);
    } catch (error: any) {
      console.error("Error creating clinic:", error);
      res.status(500).json({ error: error.message || "Failed to create clinic" });
    }
  });

  // Admin Clinic CRUD - Update clinic
  app.put("/api/admin/clinic/:id", isAuthenticated, async (req: any, res) => {
    try {
      // Verify admin role
      if (!await isUserAdmin(req)) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { id } = req.params;
      const existingClinic = await storage.getClinic(id);
      
      if (!existingClinic) {
        return res.status(404).json({ error: "Clinic not found" });
      }

      // Validate update payload with partial schema
      const { insertClinicSchema } = await import("@shared/schema");
      const partialSchema = insertClinicSchema.partial();
      const validationResult = partialSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationResult.error.errors 
        });
      }

      const updatedClinic = await storage.updateClinic(id, validationResult.data);
      res.json(updatedClinic);
    } catch (error: any) {
      console.error("Error updating clinic:", error);
      res.status(500).json({ error: error.message || "Failed to update clinic" });
    }
  });

  // Admin Clinic CRUD - Delete clinic
  app.delete("/api/admin/clinic/:id", isAuthenticated, async (req: any, res) => {
    try {
      // Verify admin role
      if (!await isUserAdmin(req)) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { id } = req.params;
      const existingClinic = await storage.getClinic(id);
      
      if (!existingClinic) {
        return res.status(404).json({ error: "Clinic not found" });
      }

      await storage.deleteClinic(id);
      res.json({ success: true, message: "Clinic deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting clinic:", error);
      res.status(500).json({ error: error.message || "Failed to delete clinic" });
    }
  });

  // WordPress Role Discovery - Admin only - Explore actual WP roles and settings
  app.get("/api/admin/wp-roles", isAuthenticated, async (req: any, res) => {
    try {
      const rawWpUrl = process.env.WP_SITE_URL;
      const WC_CONSUMER_KEY = process.env.WC_CONSUMER_KEY;
      const WC_CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET;
      const WP_USERNAME = process.env.WP_USERNAME;
      const WP_PASSWORD = process.env.WP_PASSWORD;
      
      if (!rawWpUrl) {
        return res.status(500).json({ error: "WordPress site URL not configured" });
      }
      
      // Ensure URL has https:// prefix
      const WP_SITE_URL = rawWpUrl.startsWith("http") ? rawWpUrl : `https://${rawWpUrl}`;

      const results: any = {
        wpSiteUrl: WP_SITE_URL,
        roles: [],
        users: [],
        pricingMeta: [],
        errors: []
      };

      // Try to fetch WordPress users via WooCommerce API (more reliable)
      if (WC_CONSUMER_KEY && WC_CONSUMER_SECRET) {
        try {
          const wcUrl = `${WP_SITE_URL}/wp-json/wc/v3/customers?per_page=100&consumer_key=${WC_CONSUMER_KEY}&consumer_secret=${WC_CONSUMER_SECRET}`;
          const wcResponse = await fetch(wcUrl);
          if (wcResponse.ok) {
            const customers = await wcResponse.json();
            results.wcCustomers = customers.map((c: any) => ({
              id: c.id,
              email: c.email,
              username: c.username,
              role: c.role,
              firstName: c.first_name,
              lastName: c.last_name
            }));
          } else {
            results.errors.push(`WooCommerce customers API: ${wcResponse.status}`);
          }
        } catch (e: any) {
          results.errors.push(`WooCommerce API error: ${e.message}`);
        }
      }

      // Try to fetch WordPress users via REST API  
      if (WP_USERNAME && WP_PASSWORD) {
        try {
          const wpAuth = Buffer.from(`${WP_USERNAME}:${WP_PASSWORD}`).toString('base64');
          const wpUrl = `${WP_SITE_URL}/wp-json/wp/v2/users?context=edit&per_page=100`;
          const wpResponse = await fetch(wpUrl, {
            headers: { 'Authorization': `Basic ${wpAuth}` }
          });
          if (wpResponse.ok) {
            const users = await wpResponse.json();
            results.wpUsers = users.map((u: any) => ({
              id: u.id,
              email: u.email,
              username: u.username,
              name: u.name,
              roles: u.roles,
              capabilities: u.capabilities ? Object.keys(u.capabilities).filter(k => u.capabilities[k]) : []
            }));
            
            // Extract unique roles from users
            const allRoles = new Set<string>();
            users.forEach((u: any) => {
              if (Array.isArray(u.roles)) {
                u.roles.forEach((r: string) => allRoles.add(r));
              }
            });
            results.discoveredRoles = Array.from(allRoles);
          } else {
            const errText = await wpResponse.text();
            results.errors.push(`WordPress users API: ${wpResponse.status} - ${errText}`);
          }
        } catch (e: any) {
          results.errors.push(`WordPress API error: ${e.message}`);
        }
      }

      // Try to get product pricing metadata to understand pricing tiers
      if (WC_CONSUMER_KEY && WC_CONSUMER_SECRET) {
        try {
          const productsUrl = `${WP_SITE_URL}/wp-json/wc/v3/products?per_page=10&consumer_key=${WC_CONSUMER_KEY}&consumer_secret=${WC_CONSUMER_SECRET}`;
          const productsResponse = await fetch(productsUrl);
          if (productsResponse.ok) {
            const products = await productsResponse.json();
            // Extract all meta_data keys to understand pricing structure
            const metaKeys = new Set<string>();
            products.forEach((p: any) => {
              if (p.meta_data) {
                p.meta_data.forEach((m: any) => {
                  if (m.key && (m.key.includes('price') || m.key.includes('role') || m.key.includes('member') || m.key.includes('tier'))) {
                    metaKeys.add(m.key);
                  }
                });
              }
            });
            results.pricingMetaKeys = Array.from(metaKeys);
            
            // Sample one product's full meta for investigation
            if (products.length > 0) {
              results.sampleProductMeta = {
                name: products[0].name,
                meta_data: products[0].meta_data
              };
            }
          }
        } catch (e: any) {
          results.errors.push(`Products meta error: ${e.message}`);
        }
      }

      // Save discovered roles to database
      if (results.discoveredRoles && results.discoveredRoles.length > 0) {
        for (const role of results.discoveredRoles) {
          try {
            await storage.upsertWpRoleDefinition({
              wpRoleSlug: role,
              displayName: role.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
              source: 'wordpress'
            });
          } catch (e) {
            console.error(`Error saving role ${role}:`, e);
          }
        }
      }
      
      res.json(results);
    } catch (error: any) {
      console.error("Error discovering WordPress roles:", error);
      res.status(500).json({ error: error.message || "Failed to discover WordPress roles" });
    }
  });

  // Role Mapping CRUD Endpoints
  app.get("/api/admin/role-definitions", isAuthenticated, async (req: any, res) => {
    try {
      const roles = await storage.getWpRoleDefinitions();
      res.json(roles);
    } catch (error: any) {
      console.error("Error fetching role definitions:", error);
      res.status(500).json({ error: error.message || "Failed to fetch role definitions" });
    }
  });

  app.get("/api/admin/role-mappings", isAuthenticated, async (req: any, res) => {
    try {
      const mappings = await storage.getWpRoleMappings();
      res.json(mappings);
    } catch (error: any) {
      console.error("Error fetching role mappings:", error);
      res.status(500).json({ error: error.message || "Failed to fetch role mappings" });
    }
  });

  app.post("/api/admin/role-mappings", isAuthenticated, async (req: any, res) => {
    try {
      const mapping = await storage.createWpRoleMapping(req.body);
      res.json(mapping);
    } catch (error: any) {
      console.error("Error creating role mapping:", error);
      res.status(500).json({ error: error.message || "Failed to create role mapping" });
    }
  });

  app.put("/api/admin/role-mappings/:id", isAuthenticated, async (req: any, res) => {
    try {
      const mapping = await storage.updateWpRoleMapping(req.params.id, req.body);
      res.json(mapping);
    } catch (error: any) {
      console.error("Error updating role mapping:", error);
      res.status(500).json({ error: error.message || "Failed to update role mapping" });
    }
  });

  app.delete("/api/admin/role-mappings/:id", isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteWpRoleMapping(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting role mapping:", error);
      res.status(500).json({ error: error.message || "Failed to delete role mapping" });
    }
  });

  // Sync Status and Jobs Endpoints
  app.get("/api/admin/sync-jobs", isAuthenticated, async (req: any, res) => {
    try {
      const jobs = await storage.getSyncJobs(20); // Last 20 sync jobs
      res.json(jobs);
    } catch (error: any) {
      console.error("Error fetching sync jobs:", error);
      res.status(500).json({ error: error.message || "Failed to fetch sync jobs" });
    }
  });

  // Doctor Downline/Referral Endpoints
  app.get("/api/doctors/:id/downline", isAuthenticated, async (req: any, res) => {
    try {
      const downline = await storage.getDoctorDownline(req.params.id);
      res.json(downline);
    } catch (error: any) {
      console.error("Error fetching doctor downline:", error);
      res.status(500).json({ error: error.message || "Failed to fetch doctor downline" });
    }
  });

  // Get current user's downline (for doctors)
  app.get("/api/my-downline", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const downline = await storage.getDoctorDownline(userId);
      res.json(downline);
    } catch (error: any) {
      console.error("Error fetching my downline:", error);
      res.status(500).json({ error: error.message || "Failed to fetch downline" });
    }
  });

  // WooCommerce Webhook Endpoints (for real-time sync)
  // Webhook secret validation middleware
  const validateWpWebhook = async (req: any, res: any, next: any) => {
    const signature = req.headers["x-wc-webhook-signature"];
    const webhookSecret = process.env.WC_WEBHOOK_SECRET;
    
    // If no secret configured, log warning but allow in development
    if (!webhookSecret) {
      if (process.env.NODE_ENV === "production") {
        console.warn("WC_WEBHOOK_SECRET not configured - rejecting webhook");
        return res.status(401).json({ error: "Webhook authentication required" });
      }
      console.warn("WC_WEBHOOK_SECRET not configured - allowing webhook in development");
      return next();
    }
    
    if (!signature) {
      console.warn("Webhook missing signature header");
      return res.status(401).json({ error: "Missing webhook signature" });
    }
    
    try {
      const { validateWebhookSignature } = await import("./wordpress-sync");
      // Use rawBody if available, otherwise serialize the body
      // Note: For production, configure express.raw() middleware for webhook routes
      const payload = req.rawBody || JSON.stringify(req.body);
      
      if (!validateWebhookSignature(payload, signature, webhookSecret)) {
        console.warn("Invalid webhook signature");
        return res.status(401).json({ error: "Invalid webhook signature" });
      }
      
      next();
    } catch (error: any) {
      console.error("Webhook validation error:", error);
      return res.status(500).json({ error: "Webhook validation failed" });
    }
  };

  app.post("/api/wp/webhooks/user-created", validateWpWebhook, async (req: any, res) => {
    try {
      const { syncSingleUser } = await import("./wordpress-sync");
      const userData = req.body;
      console.log("Webhook: User created", userData?.email || userData?.id);
      const result = await syncSingleUser(userData);
      res.status(202).json({ success: true, ...result });
    } catch (error: any) {
      console.error("Webhook user-created error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/wp/webhooks/user-updated", validateWpWebhook, async (req: any, res) => {
    try {
      const { syncSingleUser } = await import("./wordpress-sync");
      const userData = req.body;
      console.log("Webhook: User updated", userData?.email || userData?.id);
      const result = await syncSingleUser(userData);
      res.status(202).json({ success: true, ...result });
    } catch (error: any) {
      console.error("Webhook user-updated error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/wp/webhooks/product-updated", validateWpWebhook, async (req: any, res) => {
    try {
      const { syncSingleProduct } = await import("./wordpress-sync");
      const productData = req.body;
      console.log("Webhook: Product updated", productData?.name || productData?.id);
      const result = await syncSingleProduct(productData);
      res.status(202).json({ success: true, ...result });
    } catch (error: any) {
      console.error("Webhook product-updated error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/wp/webhooks/order-created", validateWpWebhook, async (req: any, res) => {
    try {
      const orderData = req.body;
      console.log("Webhook: Order created", orderData?.id);
      // Process order - update referral tracking, etc.
      res.status(202).json({ success: true });
    } catch (error: any) {
      console.error("Webhook order-created error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Quiz Routes
  app.get("/api/quizzes", async (req, res) => {
    try {
      const quizzes = await storage.getQuizzes();
      res.json(quizzes);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      res.status(500).json({ error: "Failed to fetch quizzes" });
    }
  });

  app.get("/api/quizzes/:slug", async (req, res) => {
    try {
      const quiz = await storage.getQuizBySlug(req.params.slug);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      res.json(quiz);
    } catch (error) {
      console.error("Error fetching quiz:", error);
      res.status(500).json({ error: "Failed to fetch quiz" });
    }
  });

  app.get("/api/quizzes/:quizId/questions", isAuthenticated, async (req, res) => {
    try {
      const questions = await storage.getQuizQuestions(req.params.quizId);
      // Fetch answers for each question
      const questionsWithAnswers = await Promise.all(
        questions.map(async (q) => {
          const answers = await storage.getQuizAnswers(q.id);
          // Don't send isCorrect to client during quiz
          const safeAnswers = answers.map(({ isCorrect, ...rest }) => rest);
          return { ...q, answers: safeAnswers };
        })
      );
      res.json(questionsWithAnswers);
    } catch (error) {
      console.error("Error fetching quiz questions:", error);
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  });

  // Start a quiz attempt
  app.post("/api/quizzes/:quizId/attempts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const quizId = req.params.quizId;
      
      const attempt = await storage.createQuizAttempt({
        userId,
        quizId,
      });
      res.status(201).json(attempt);
    } catch (error) {
      console.error("Error creating quiz attempt:", error);
      res.status(500).json({ error: "Failed to start quiz" });
    }
  });

  // Submit quiz answers
  app.post("/api/quizzes/attempts/:attemptId/submit", isAuthenticated, async (req: any, res) => {
    try {
      const { attemptId } = req.params;
      const { responses } = req.body; // Array of { questionId, selectedAnswerId }
      const userId = req.user.claims.sub;
      
      const attempt = await storage.getQuizAttempt(attemptId);
      if (!attempt) {
        return res.status(404).json({ error: "Attempt not found" });
      }
      
      // Security: Verify the attempt belongs to the logged-in user
      if (attempt.userId !== userId) {
        console.warn(`Unauthorized quiz submission attempt: user ${userId} tried to submit attempt ${attemptId} owned by ${attempt.userId}`);
        return res.status(403).json({ error: "You are not authorized to submit this quiz attempt" });
      }
      
      // Prevent resubmission of completed attempts
      if (attempt.completedAt) {
        return res.status(400).json({ error: "This quiz attempt has already been submitted" });
      }
      
      const quiz = await storage.getQuiz(attempt.quizId);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      
      let score = 0;
      let maxScore = 0;
      
      // Process each response
      for (const response of responses) {
        const answers = await storage.getQuizAnswers(response.questionId);
        const correctAnswer = answers.find(a => a.isCorrect);
        const questions = await storage.getQuizQuestions(attempt.quizId);
        const question = questions.find(q => q.id === response.questionId);
        const points = question?.points || 1;
        
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
    } catch (error) {
      console.error("Error submitting quiz:", error);
      res.status(500).json({ error: "Failed to submit quiz" });
    }
  });

  // Get user's quiz attempts
  app.get("/api/my-quiz-attempts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const quizId = req.query.quizId as string | undefined;
      const attempts = await storage.getQuizAttempts(userId, quizId);
      res.json(attempts);
    } catch (error) {
      console.error("Error fetching quiz attempts:", error);
      res.status(500).json({ error: "Failed to fetch attempts" });
    }
  });

  // Admin: Create quiz
  app.post("/api/admin/quizzes", isAuthenticated, async (req: any, res) => {
    try {
      const quiz = await storage.createQuiz(req.body);
      res.status(201).json(quiz);
    } catch (error) {
      console.error("Error creating quiz:", error);
      res.status(500).json({ error: "Failed to create quiz" });
    }
  });

  // Admin: Add question to quiz
  app.post("/api/admin/quizzes/:quizId/questions", isAuthenticated, async (req: any, res) => {
    try {
      const question = await storage.createQuizQuestion({
        ...req.body,
        quizId: req.params.quizId,
      });
      res.status(201).json(question);
    } catch (error) {
      console.error("Error creating question:", error);
      res.status(500).json({ error: "Failed to create question" });
    }
  });

  // Admin: Add answer to question
  app.post("/api/admin/questions/:questionId/answers", isAuthenticated, async (req: any, res) => {
    try {
      const answer = await storage.createQuizAnswer({
        ...req.body,
        questionId: req.params.questionId,
      });
      res.status(201).json(answer);
    } catch (error) {
      console.error("Error creating answer:", error);
      res.status(500).json({ error: "Failed to create answer" });
    }
  });

  // ========== Google Drive Integration Routes ==========
  
  // List all Drive folders (admin only)
  app.get("/api/admin/drive/folders", isAuthenticated, async (req: any, res) => {
    try {
      const folders = await listAllFolders();
      res.json(folders);
    } catch (error: any) {
      console.error("Error listing Drive folders:", error);
      res.status(500).json({ error: error.message || "Failed to list folders" });
    }
  });

  // List files in a specific folder
  app.get("/api/admin/drive/folders/:folderId/files", isAuthenticated, async (req: any, res) => {
    try {
      const files = await listFilesInFolder(req.params.folderId);
      res.json(files);
    } catch (error: any) {
      console.error("Error listing files:", error);
      res.status(500).json({ error: error.message || "Failed to list files" });
    }
  });

  // Get folder contents with subfolders
  app.get("/api/admin/drive/folders/:folderId/contents", isAuthenticated, async (req: any, res) => {
    try {
      const depth = parseInt(req.query.depth as string) || 1;
      const contents = await getFolderContents(req.params.folderId, depth);
      res.json(contents);
    } catch (error: any) {
      console.error("Error getting folder contents:", error);
      res.status(500).json({ error: error.message || "Failed to get folder contents" });
    }
  });

  // Helper to generate slug from title
  function generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
  }

  // Sync Drive folder to database
  app.post("/api/admin/drive/sync", isAuthenticated, async (req: any, res) => {
    try {
      const { folderId, folderPath, roleAccess } = req.body;
      
      if (!folderId) {
        return res.status(400).json({ error: "Folder ID is required" });
      }

      const files = await listFilesInFolder(folderId);
      let synced = 0;
      let updated = 0;
      let errors: string[] = [];

      for (const file of files) {
        try {
          // Skip folders
          if (file.mimeType === 'application/vnd.google-apps.folder') {
            continue;
          }

          const existingDoc = await storage.getDriveDocumentByDriveId(file.id);
          const contentType = getContentTypeFromMime(file.mimeType);
          const slug = generateSlug(file.name) + '-' + file.id.substring(0, 6);

          const docData = {
            driveFileId: file.id,
            title: file.name,
            slug,
            description: file.description || null,
            mimeType: file.mimeType,
            contentType: contentType as any,
            webViewLink: file.webViewLink || null,
            webContentLink: file.webContentLink || null,
            thumbnailLink: file.thumbnailLink || null,
            fileSize: file.size || null,
            folderPath: folderPath || null,
            roleAccess: roleAccess || null,
          };

          if (existingDoc) {
            await storage.updateDriveDocument(existingDoc.id, docData);
            updated++;
          } else {
            await storage.createDriveDocument(docData);
            synced++;
          }
        } catch (fileError: any) {
          errors.push(`${file.name}: ${fileError.message}`);
        }
      }

      res.json({
        success: true,
        synced,
        updated,
        total: files.length,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error: any) {
      console.error("Error syncing Drive folder:", error);
      res.status(500).json({ error: error.message || "Failed to sync folder" });
    }
  });

  // ========== Training Modules Routes ==========
  
  // Get all training modules
  app.get("/api/training/modules", async (req, res) => {
    try {
      const modules = await storage.getTrainingModules();
      res.json(modules);
    } catch (error) {
      console.error("Error fetching training modules:", error);
      res.status(500).json({ error: "Failed to fetch modules" });
    }
  });

  // Get training module by slug
  app.get("/api/training/modules/:slug", async (req, res) => {
    try {
      const module = await storage.getTrainingModuleBySlug(req.params.slug);
      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }
      res.json(module);
    } catch (error) {
      console.error("Error fetching module:", error);
      res.status(500).json({ error: "Failed to fetch module" });
    }
  });

  // Get all training tracks
  app.get("/api/training/tracks", async (req, res) => {
    try {
      const tracks = await storage.getTrainingTracks();
      res.json(tracks);
    } catch (error) {
      console.error("Error fetching training tracks:", error);
      res.status(500).json({ error: "Failed to fetch tracks" });
    }
  });

  // Get training track by slug
  app.get("/api/training/tracks/:slug", async (req, res) => {
    try {
      const track = await storage.getTrainingTrackBySlug(req.params.slug);
      if (!track) {
        return res.status(404).json({ error: "Track not found" });
      }
      res.json(track);
    } catch (error) {
      console.error("Error fetching track:", error);
      res.status(500).json({ error: "Failed to fetch track" });
    }
  });

  // ========== Drive Documents Routes ==========
  
  // Get all Drive documents (library content)
  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.getDriveDocuments();
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  // Get Drive document by slug
  app.get("/api/documents/:slug", async (req, res) => {
    try {
      const document = await storage.getDriveDocumentBySlug(req.params.slug);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      // Increment view count
      await storage.updateDriveDocument(document.id, {
        viewCount: (document.viewCount || 0) + 1,
      });
      
      res.json(document);
    } catch (error) {
      console.error("Error fetching document:", error);
      res.status(500).json({ error: "Failed to fetch document" });
    }
  });

  // ========== User Progress Routes ==========
  
  // Get user's progress
  app.get("/api/my-progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const contentType = req.query.contentType as string | undefined;
      const progress = await storage.getUserProgress(userId, contentType);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  // Track content view/progress
  app.post("/api/progress/track", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { contentType, contentId, status, progressPercent, timeSpent } = req.body;

      if (!contentType || !contentId) {
        return res.status(400).json({ error: "Content type and ID are required" });
      }

      let progress = await storage.getUserProgressForContent(userId, contentType, contentId);

      if (progress) {
        // Update existing progress
        const updates: any = {
          lastViewedAt: new Date(),
          viewCount: (progress.viewCount || 0) + 1,
        };
        
        if (status) updates.status = status;
        if (progressPercent !== undefined) updates.progressPercent = progressPercent;
        if (timeSpent) updates.timeSpent = (progress.timeSpent || 0) + timeSpent;
        if (status === 'completed' && !progress.completedAt) {
          updates.completedAt = new Date();
        }

        progress = await storage.updateUserProgress(progress.id, updates);
      } else {
        // Create new progress record
        progress = await storage.createUserProgress({
          userId,
          contentType,
          contentId,
          status: status || 'in_progress',
          progressPercent: progressPercent || 0,
          timeSpent: timeSpent || 0,
          viewCount: 1,
          lastViewedAt: new Date(),
        });
      }

      res.json(progress);
    } catch (error) {
      console.error("Error tracking progress:", error);
      res.status(500).json({ error: "Failed to track progress" });
    }
  });

  // ========== Track Enrollments Routes ==========
  
  // Get user's track enrollments
  app.get("/api/my-enrollments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const enrollments = await storage.getTrackEnrollments(userId);
      res.json(enrollments);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      res.status(500).json({ error: "Failed to fetch enrollments" });
    }
  });

  // Enroll in a training track
  app.post("/api/training/tracks/:trackId/enroll", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { trackId } = req.params;

      // Check if already enrolled
      const existing = await storage.getTrackEnrollment(userId, trackId);
      if (existing) {
        return res.status(400).json({ error: "Already enrolled in this track" });
      }

      // Check track exists
      const track = await storage.getTrainingTrack(trackId);
      if (!track) {
        return res.status(404).json({ error: "Track not found" });
      }

      const enrollment = await storage.createTrackEnrollment({
        userId,
        trackId,
        status: 'in_progress',
        progressPercent: 0,
        modulesCompleted: 0,
      });

      res.status(201).json(enrollment);
    } catch (error) {
      console.error("Error enrolling in track:", error);
      res.status(500).json({ error: "Failed to enroll" });
    }
  });

  // Admin: Create training module
  app.post("/api/admin/training/modules", isAuthenticated, async (req: any, res) => {
    try {
      const module = await storage.createTrainingModule(req.body);
      res.status(201).json(module);
    } catch (error) {
      console.error("Error creating module:", error);
      res.status(500).json({ error: "Failed to create module" });
    }
  });

  // Admin: Create training track
  app.post("/api/admin/training/tracks", isAuthenticated, async (req: any, res) => {
    try {
      const track = await storage.createTrainingTrack(req.body);
      res.status(201).json(track);
    } catch (error) {
      console.error("Error creating track:", error);
      res.status(500).json({ error: "Failed to create track" });
    }
  });

  // ========== Admin Dashboard Routes ==========
  
  // Get admin stats
  app.get("/api/admin/stats", isAuthenticated, async (req: any, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Get recent member signups
  app.get("/api/admin/recent-members", isAuthenticated, async (req: any, res) => {
    try {
      const members = await storage.getRecentMembers(30); // Last 30 days
      res.json(members);
    } catch (error) {
      console.error("Error fetching recent members:", error);
      res.status(500).json({ error: "Failed to fetch members" });
    }
  });

  // Get all members with full details and filtering
  app.get("/api/admin/members", isAuthenticated, async (req: any, res) => {
    try {
      const { role, clinicId, source } = req.query;
      const filters: { role?: string; clinicId?: string; source?: string } = {};
      if (role) filters.role = role as string;
      if (clinicId) filters.clinicId = clinicId as string;
      if (source) filters.source = source as string;
      
      const members = await storage.getAllMembersWithDetails(filters);
      res.json(members);
    } catch (error) {
      console.error("Error fetching members:", error);
      res.status(500).json({ error: "Failed to fetch members" });
    }
  });

  // Get member stats breakdown by role and source
  app.get("/api/admin/member-stats", isAuthenticated, async (req: any, res) => {
    try {
      const stats = await storage.getMemberStatsByRole();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching member stats:", error);
      res.status(500).json({ error: "Failed to fetch member stats" });
    }
  });

  // Get all contracts for admin view
  app.get("/api/admin/contracts", isAuthenticated, async (req: any, res) => {
    try {
      const contracts = await storage.getAllContracts();
      res.json(contracts);
    } catch (error) {
      console.error("Error fetching contracts:", error);
      res.status(500).json({ error: "Failed to fetch contracts" });
    }
  });

  // ========== Stripe Checkout Routes ==========
  
  // Create checkout session
  app.post("/api/checkout/create-session", isAuthenticated, async (req: any, res) => {
    try {
      const { createCheckoutSession } = await import("./stripe");
      const { items, successUrl, cancelUrl } = req.body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Cart items required" });
      }

      // Get user's pricing tier from database mappings
      const pricingInfo = await getUserPricingInfo(req);

      // Validate items structure (only productId and quantity should come from client)
      const cartItems = items.map((item: any) => ({
        productId: item.productId,
        variationId: item.variationId || null,
        quantity: parseInt(item.quantity) || 1,
      }));

      // Fetch actual product data from database with ROLE-SPECIFIC pricing
      const verifiedProducts = new Map();
      for (const item of cartItems) {
        const product = await storage.getProduct(item.productId);
        if (!product) {
          return res.status(400).json({ error: `Product not found: ${item.productId}` });
        }
        if (!product.isActive) {
          return res.status(400).json({ error: `Product not available: ${product.name}` });
        }
        
        // Check for role-specific price first
        const rolePrice = await storage.getProductRolePrice(product.id, pricingInfo.priceTier, item.variationId);
        let productPrice: string;
        
        if (rolePrice) {
          // Use role-specific price
          productPrice = rolePrice.price;
        } else {
          // Fall back to tier-based pricing
          switch (pricingInfo.priceTier) {
            case 'admin':
            case 'retail':
              productPrice = String(product.retailPrice);
              break;
            case 'doctor':
              productPrice = String(product.doctorPrice || product.retailPrice);
              break;
            case 'wholesale':
              productPrice = String(product.wholesalePrice || product.retailPrice);
              break;
            default:
              // For custom roles like tricia/holtorf, fall back to retail if no specific price
              productPrice = String(product.retailPrice);
          }
        }
        
        verifiedProducts.set(item.productId, {
          id: product.id,
          name: product.name,
          price: productPrice, // Server-side role-based pricing
          imageUrl: product.imageUrl,
        });
      }

      const userId = req.user?.claims?.sub || "anonymous";
      const session = await createCheckoutSession(cartItems, verifiedProducts, userId, successUrl, cancelUrl);
      
      if (!session) {
        return res.status(500).json({ error: "Stripe is not configured" });
      }
      
      res.json({ url: session.url, sessionId: session.id });
    } catch (error: any) {
      console.error("Checkout error:", error);
      res.status(500).json({ error: error.message || "Failed to create checkout session" });
    }
  });

  // Get checkout session status
  app.get("/api/checkout/session/:sessionId", async (req, res) => {
    try {
      const { retrieveCheckoutSession } = await import("./stripe");
      const session = await retrieveCheckoutSession(req.params.sessionId);
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      
      res.json({
        id: session.id,
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        currency: session.currency,
        customer_email: session.customer_details?.email,
      });
    } catch (error: any) {
      console.error("Session fetch error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch session" });
    }
  });

  // ========== WooCommerce Checkout Routes ==========

  app.post("/api/checkout/wc-create-order", async (req, res) => {
    try {
      const { wooCommerceService } = await import("./services/woocommerce");
      const { items, billing } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Cart items required" });
      }

      if (!billing?.email || !billing?.first_name || !billing?.last_name) {
        return res.status(400).json({ error: "Billing name and email required" });
      }

      const lineItems = items.map((item: any) => ({
        product_id: parseInt(item.wcProductId || item.productId),
        quantity: parseInt(item.quantity) || 1,
        ...(item.variationId ? { variation_id: parseInt(item.variationId) } : {}),
      }));

      const wcOrder = await wooCommerceService.createOrder({
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
      });

      res.json({
        orderId: wcOrder.id,
        orderKey: wcOrder.order_key,
        total: wcOrder.total,
        checkoutUrl: wcOrder.checkout_url,
        status: wcOrder.status,
      });
    } catch (error: any) {
      console.error("WC checkout error:", error);
      res.status(500).json({ error: error.message || "Failed to create order" });
    }
  });

  app.get("/api/checkout/wc-order/:orderId", async (req, res) => {
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

  // ========== Referral Routes ==========

  // Get my referral code
  app.get("/api/referrals/my-code", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      // Generate a consistent referral code based on user ID
      const code = `REF-${userId.substring(0, 8).toUpperCase()}`;
      
      // Check if this code already exists in the database
      const existingReferral = await storage.getReferralByCode(code);
      if (!existingReferral) {
        // Create a "self" referral record to persist the code
        await storage.createReferral({
          referrerId: userId,
          referralCode: code,
          referredEmail: null,
          referredName: null,
          status: "active",
        });
      }
      
      res.json({ code });
    } catch (error) {
      console.error("Error getting referral code:", error);
      res.status(500).json({ error: "Failed to get referral code" });
    }
  });

  // Get user's referrals
  app.get("/api/referrals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const referrals = await storage.getReferrals(userId);
      res.json(referrals);
    } catch (error) {
      console.error("Error fetching referrals:", error);
      res.status(500).json({ error: "Failed to fetch referrals" });
    }
  });

  // Lookup referral by code (public - for signup flow)
  app.get("/api/referrals/lookup/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const referral = await storage.getReferralByCode(code);
      
      if (!referral) {
        return res.status(404).json({ error: "Referral code not found" });
      }
      
      // Return limited info (don't expose sensitive data)
      res.json({ 
        valid: true, 
        referrerId: referral.referrerId,
      });
    } catch (error) {
      console.error("Error looking up referral:", error);
      res.status(500).json({ error: "Failed to lookup referral" });
    }
  });

  // Create referral invitation
  app.post("/api/referrals/invite", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const { email, name } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      // Generate unique referral code
      const code = `REF-${Date.now().toString(36).toUpperCase()}`;
      
      const referral = await storage.createReferral({
        referrerId: userId,
        referralCode: code,
        referredEmail: email,
        referredName: name || null,
        status: "pending",
      });
      
      res.status(201).json(referral);
    } catch (error) {
      console.error("Error creating referral:", error);
      res.status(500).json({ error: "Failed to create referral" });
    }
  });

  // ========== Chat Routes ==========

  // Get user's chat rooms
  app.get("/api/chat/rooms", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const rooms = await storage.getChatRooms(userId);
      res.json(rooms);
    } catch (error) {
      console.error("Error fetching chat rooms:", error);
      res.status(500).json({ error: "Failed to fetch chat rooms" });
    }
  });

  // Get messages for a room
  app.get("/api/chat/rooms/:roomId/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const { roomId } = req.params;
      const limit = parseInt(req.query.limit || "100");
      
      // Verify user is participant
      const participants = await storage.getChatParticipants(roomId);
      if (!participants.some(p => p.userId === userId)) {
        return res.status(403).json({ error: "Not authorized to view this room" });
      }
      
      const messages = await storage.getChatMessages(roomId, limit);
      res.json(messages.reverse()); // Return in chronological order
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Send a message
  app.post("/api/chat/rooms/:roomId/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const { roomId } = req.params;
      const { content } = req.body;
      
      if (!content || !content.trim()) {
        return res.status(400).json({ error: "Message content is required" });
      }
      
      // Verify user is participant
      const participants = await storage.getChatParticipants(roomId);
      if (!participants.some(p => p.userId === userId)) {
        return res.status(403).json({ error: "Not authorized to send to this room" });
      }
      
      const message = await storage.createChatMessage({
        roomId,
        senderId: userId,
        content: content.trim(),
      });
      
      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Start or get direct chat with another user
  app.post("/api/chat/direct", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const { targetUserId } = req.body;
      if (!targetUserId) {
        return res.status(400).json({ error: "Target user ID is required" });
      }
      
      if (targetUserId === userId) {
        return res.status(400).json({ error: "Cannot start chat with yourself" });
      }
      
      const room = await storage.getOrCreateDirectRoom(userId, targetUserId);
      res.json(room);
    } catch (error) {
      console.error("Error creating direct chat:", error);
      res.status(500).json({ error: "Failed to create direct chat" });
    }
  });

  // Get room participants
  app.get("/api/chat/rooms/:roomId/participants", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const { roomId } = req.params;
      
      // Verify user is participant
      const participants = await storage.getChatParticipants(roomId);
      if (!participants.some(p => p.userId === userId)) {
        return res.status(403).json({ error: "Not authorized to view participants" });
      }
      
      res.json(participants);
    } catch (error) {
      console.error("Error fetching participants:", error);
      res.status(500).json({ error: "Failed to fetch participants" });
    }
  });

  // Stripe webhook
  app.post("/api/webhooks/stripe", async (req: any, res) => {
    try {
      const { constructWebhookEvent, stripe } = await import("./stripe");
      
      if (!stripe) {
        return res.status(500).json({ error: "Stripe not configured" });
      }
      
      const sig = req.headers["stripe-signature"] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      if (!webhookSecret) {
        console.warn("Webhook secret not configured - skipping signature verification");
        return res.json({ received: true });
      }
      
      // Use rawBody for signature verification (stored by express.json verify callback)
      const rawBody = req.rawBody;
      if (!rawBody) {
        console.error("Raw body not available for webhook signature verification");
        return res.status(400).json({ error: "Raw body required for signature verification" });
      }
      
      const event = constructWebhookEvent(rawBody, sig, webhookSecret);
      
      switch (event.type) {
        case "checkout.session.completed":
          const session = event.data.object as any;
          console.log("Payment completed for session:", session.id);
          
          try {
            // Extract user and cart info from metadata
            const userId = session.metadata?.userId;
            const cartItems = session.metadata?.items ? JSON.parse(session.metadata.items) : [];
            
            if (userId && cartItems.length > 0) {
              // Calculate totals from line items
              const totalAmount = (session.amount_total || 0) / 100; // Convert from cents
              const subtotal = totalAmount; // Stripe handles tax separately if configured
              
              // Create order with correct schema fields
              const order = await storage.createOrder({
                userId,
                status: "processing", // Valid status in enum
                subtotal: subtotal.toFixed(2),
                total: totalAmount.toFixed(2),
                notes: `Stripe Session: ${session.id}`,
              });
              
              // Create order items with correct schema fields
              for (const item of cartItems) {
                const product = await storage.getProduct(item.productId);
                if (product) {
                  const price = parseFloat(product.retailPrice);
                  const itemTotal = price * item.quantity;
                  await storage.createOrderItem({
                    orderId: order.id,
                    productId: item.productId,
                    quantity: item.quantity,
                    price: price.toFixed(2),
                    total: itemTotal.toFixed(2),
                  });
                }
              }
              
              console.log(`Order ${order.id} created for user ${userId}`);
            }
          } catch (orderError) {
            console.error("Error creating order from webhook:", orderError);
          }
          break;
        case "payment_intent.succeeded":
          console.log("Payment succeeded:", event.data.object);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
      
      res.json({ received: true });
    } catch (error: any) {
      console.error("Webhook error:", error.message);
      res.status(400).json({ error: error.message });
    }
  });

  // ========== SignNow E-Signature Routes ==========

  // Get SignNow status
  app.get("/api/signnow/status", isAuthenticated, async (req: any, res) => {
    try {
      const status = signNow.getSignNowStatus();
      if (status.configured) {
        // Test connection
        try {
          const user = await signNow.getCurrentUser();
          res.json({ ...status, connected: true, user: { email: user.email } });
        } catch (error: any) {
          res.json({ ...status, connected: false, error: error.message });
        }
      } else {
        res.json(status);
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // List SignNow templates
  app.get("/api/signnow/templates", isAuthenticated, async (req: any, res) => {
    try {
      const templates = await signNow.listTemplates();
      res.json(templates);
    } catch (error: any) {
      console.error("Error listing SignNow templates:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // List SignNow documents
  app.get("/api/signnow/documents", isAuthenticated, async (req: any, res) => {
    try {
      const documents = await signNow.listDocuments();
      res.json(documents);
    } catch (error: any) {
      console.error("Error listing SignNow documents:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get document status
  app.get("/api/signnow/documents/:id", isAuthenticated, async (req: any, res) => {
    try {
      const document = await signNow.getDocument(req.params.id);
      res.json(document);
    } catch (error: any) {
      console.error("Error getting SignNow document:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get template/document fields for debugging (admin only)
  app.get("/api/signnow/template-fields/:id", isAuthenticated, async (req: any, res) => {
    try {
      const fields = await signNow.getDocumentFields(req.params.id);
      res.json(fields);
    } catch (error: any) {
      console.error("Error getting SignNow template fields:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create doctor agreement from template
  // Default template ID for doctor onboarding agreement
  const DOCTOR_AGREEMENT_TEMPLATE_ID = process.env.SIGNNOW_DOCTOR_TEMPLATE_ID || '253597f6c6724abd976af62a69b3e0a5b92b38dd';
  
  app.post("/api/signnow/doctor-agreement", isAuthenticated, async (req: any, res) => {
    try {
      const { templateId, doctorName, doctorEmail, clinicName, licenseNumber, specialization, phone } = req.body;
      
      // Use provided templateId or fall back to default doctor agreement template
      const effectiveTemplateId = templateId || DOCTOR_AGREEMENT_TEMPLATE_ID;
      
      if (!doctorName || !doctorEmail) {
        return res.status(400).json({ error: "doctorName and doctorEmail are required" });
      }

      const result = await signNow.createDoctorAgreement(effectiveTemplateId, {
        doctorName,
        doctorEmail,
        clinicName,
        licenseNumber,
      });

      // Save contract to database
      const contract = await storage.createContract({
        userId: req.user.claims.sub,
        clinicId: null, // Will be assigned when doctor joins/creates clinic
        templateId: effectiveTemplateId,
        signNowDocumentId: result.documentId,
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

  // Doctor signup - redirect to WooCommerce for $5k clinic package payment
  app.post("/api/doctors/signup", async (req, res) => {
    try {
      const { 
        doctorName, 
        doctorEmail, 
        clinicName, 
        licenseNumber, 
        specialization, 
        phone,
        contractId 
      } = req.body;

      if (!doctorName || !doctorEmail) {
        return res.status(400).json({ error: "Doctor name and email are required" });
      }

      // WooCommerce store URL
      const wcStoreUrl = process.env.VITE_WOOCOMMERCE_URL || process.env.WP_SITE_URL || 'https://wordpress-1347597-6126502.cloudwaysapps.com';
      
      // WooCommerce doctor/clinic product ID (set this in your WooCommerce)
      // This should be the product ID for the $5,000 Doctor Clinic Package
      const doctorProductId = process.env.WC_DOCTOR_PRODUCT_ID || '0';
      
      // Generate a unique clinic slug from the clinic name
      const clinicSlug = clinicName 
        ? clinicName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        : doctorName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-clinic';

      // Build WooCommerce checkout URL with doctor info in query params
      const checkoutParams = new URLSearchParams({
        add_to_cart: doctorProductId,
        quantity: '1',
        billing_first_name: doctorName.split(' ')[0] || doctorName,
        billing_last_name: doctorName.split(' ').slice(1).join(' ') || '',
        billing_email: doctorEmail,
        billing_phone: phone || '',
        clinic_name: clinicName || '',
        clinic_slug: clinicSlug,
        license_number: licenseNumber || '',
        specialization: specialization || '',
        contract_id: contractId || '',
        signup_type: 'doctor',
      });

      // Direct to WooCommerce checkout with product in cart
      const checkoutUrl = `${wcStoreUrl}/checkout/?${checkoutParams.toString()}`;

      res.json({ checkoutUrl, clinicSlug });
    } catch (error) {
      console.error("Error processing doctor signup:", error);
      res.status(500).json({ error: "Failed to process doctor signup" });
    }
  });

  // Get contract details by ID (for embedded signing page)
  app.get("/api/contracts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const contract = await storage.getContract(req.params.id);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }
      
      // Only allow the contract owner or admins to view
      if (contract.userId !== req.user.claims.sub) {
        const profile = await storage.getMemberProfile(req.user.claims.sub);
        if (profile?.role !== "admin") {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      res.json(contract);
    } catch (error: any) {
      console.error("Error getting contract:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Refresh signing URL for a contract
  app.post("/api/contracts/:id/refresh-url", isAuthenticated, async (req: any, res) => {
    try {
      const contract = await storage.getContract(req.params.id);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }
      
      if (contract.userId !== req.user.claims.sub) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      if (!contract.signNowDocumentId) {
        return res.status(400).json({ error: "No SignNow document associated with this contract" });
      }
      
      // Get fresh signing link
      const signingLink = await signNow.createSigningLink(contract.signNowDocumentId);
      const newUrl = signingLink.url_no_signup || signingLink.url;
      
      // Update contract with new URL
      await storage.updateContract(contract.id, {
        embeddedSigningUrl: newUrl,
      });
      
      res.json({ signingUrl: newUrl });
    } catch (error: any) {
      console.error("Error refreshing signing URL:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Send signing invite
  app.post("/api/signnow/documents/:id/invite", isAuthenticated, async (req: any, res) => {
    try {
      const { email, subject, message, expirationDays } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "email is required" });
      }

      const result = await signNow.sendSigningInvite(req.params.id, email, {
        subject,
        message,
        expiration_days: expirationDays,
      });

      res.json(result);
    } catch (error: any) {
      console.error("Error sending signing invite:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ========== Drive Search Routes for PMA Files ==========

  // Search folders by name (find PMA files folder)
  app.get("/api/admin/drive/search", isAuthenticated, async (req: any, res) => {
    try {
      const { name } = req.query;
      if (!name) {
        return res.status(400).json({ error: "name query parameter required" });
      }
      const folders = await searchFoldersByName(name as string);
      res.json(folders);
    } catch (error: any) {
      console.error("Error searching Drive folders:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Search all files by name (not just folders)
  app.get("/api/admin/drive/files/search", isAuthenticated, async (req: any, res) => {
    try {
      const { name } = req.query;
      if (!name) {
        return res.status(400).json({ error: "name query parameter required" });
      }
      const { searchFilesByName } = await import("./google-drive");
      const files = await searchFilesByName(name as string);
      res.json(files);
    } catch (error: any) {
      console.error("Error searching Drive files:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get folder contents by ID
  app.get("/api/admin/drive/folder/:id", isAuthenticated, async (req: any, res) => {
    try {
      const contents = await getFolderContents(req.params.id, 2);
      res.json(contents);
    } catch (error: any) {
      console.error("Error getting Drive folder contents:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ========== WooCommerce Webhook Endpoints ==========

  // WooCommerce order completed webhook - handles both doctor and member signups
  app.post("/api/webhooks/woocommerce/order-completed", async (req, res) => {
    try {
      console.log("WooCommerce webhook received:", JSON.stringify(req.body, null, 2));
      
      const order = req.body;
      
      if (!order || !order.id) {
        console.log("Invalid webhook payload - no order ID");
        return res.status(400).json({ error: "Invalid webhook payload" });
      }

      // Check if order is completed
      if (order.status !== "completed" && order.status !== "processing") {
        console.log(`Order ${order.id} status is ${order.status}, ignoring`);
        return res.json({ message: "Order not completed, ignoring" });
      }

      // Extract order metadata to determine signup type
      const signupType = order.meta_data?.find((m: any) => m.key === "signup_type")?.value 
        || order.meta_data?.find((m: any) => m.key === "_signup_type")?.value;
      
      const clinicSlug = order.meta_data?.find((m: any) => m.key === "clinic_slug")?.value
        || order.meta_data?.find((m: any) => m.key === "_clinic_slug")?.value;
      
      const clinicId = order.meta_data?.find((m: any) => m.key === "clinic_id")?.value
        || order.meta_data?.find((m: any) => m.key === "_clinic_id")?.value;
      
      const contractId = order.meta_data?.find((m: any) => m.key === "contract_id")?.value
        || order.meta_data?.find((m: any) => m.key === "_contract_id")?.value;

      const billingEmail = order.billing?.email;
      const billingFirstName = order.billing?.first_name;
      const billingLastName = order.billing?.last_name;
      const billingPhone = order.billing?.phone;

      console.log("Processing order:", {
        orderId: order.id,
        signupType,
        clinicSlug,
        clinicId,
        contractId,
        billingEmail,
      });

      if (signupType === "doctor") {
        // Doctor signup - create clinic and update contract
        const clinicName = order.meta_data?.find((m: any) => m.key === "clinic_name")?.value
          || order.meta_data?.find((m: any) => m.key === "_clinic_name")?.value
          || `${billingFirstName} ${billingLastName} Clinic`;

        // IDEMPOTENCY: Check if we already have a clinic with this email (doctor already processed)
        const existingClinics = await storage.getClinics();
        const existingClinic = existingClinics.find((c: any) => c.email === billingEmail || c.doctorEmail === billingEmail);
        if (existingClinic) {
          console.log(`Doctor order ${order.id} already processed - clinic exists: ${existingClinic.slug}`);
          return res.json({
            success: true,
            type: "doctor",
            message: "Already processed",
            clinicId: existingClinic.id,
            clinicSlug: existingClinic.slug,
          });
        }

        // Check if user exists, if not create them
        let user = await storage.getUserByEmail(billingEmail);
        if (!user) {
          user = await storage.createUser({
            email: billingEmail,
            firstName: billingFirstName,
            lastName: billingLastName,
            profileImageUrl: null,
            wpUserId: null,
            wpUsername: null,
            wpRoles: "doctor",
            authProvider: "woocommerce",
          });
        }

        // Create or update member profile with doctor role
        let profile = await storage.getMemberProfile(user.id);
        if (!profile) {
          profile = await storage.createMemberProfile({
            userId: user.id,
            phone: billingPhone || null,
            role: "doctor",
            isActive: true,
          });
        } else {
          await storage.updateMemberProfile(user.id, {
            role: "doctor",
            isActive: true,
          });
        }

        // Create clinic with guaranteed unique slug (append order ID to avoid collisions)
        const baseSlug = clinicSlug || clinicName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const finalSlug = `${baseSlug}-${order.id}`;
        const clinic = await storage.createClinic({
          name: clinicName,
          slug: finalSlug,
          ownerId: user.id,
          email: billingEmail,
          isActive: true,
        });

        // Update contract if exists
        if (contractId) {
          await storage.updateContract(contractId, {
            clinicId: clinic.id,
            status: "completed",
          });
        }

        console.log(`Doctor signup completed: ${billingEmail}, clinic: ${clinic.slug}`);
        
        return res.json({ 
          success: true, 
          type: "doctor",
          userId: user.id,
          clinicId: clinic.id,
          clinicSlug: clinic.slug,
        });
      } else if (signupType === "member") {
        // Member signup - activate membership under clinic
        
        // IDEMPOTENCY: Check if member already exists with active profile
        let user = await storage.getUserByEmail(billingEmail);
        if (user) {
          const existingProfile = await storage.getMemberProfile(user.id);
          if (existingProfile && existingProfile.isActive) {
            console.log(`Member order ${order.id} already processed - profile exists for: ${billingEmail}`);
            return res.json({
              success: true,
              type: "member",
              message: "Already processed",
              userId: user.id,
              clinicId: existingProfile.clinicId,
            });
          }
        }
        
        if (!user) {
          user = await storage.createUser({
            email: billingEmail,
            firstName: billingFirstName,
            lastName: billingLastName,
            profileImageUrl: null,
            wpUserId: null,
            wpUsername: null,
            wpRoles: "member",
            authProvider: "woocommerce",
          });
        }

        // Find clinic by ID or slug
        let clinic = null;
        if (clinicId) {
          clinic = await storage.getClinic(clinicId);
        } else if (clinicSlug) {
          clinic = await storage.getClinicBySlug(clinicSlug);
        }

        // Create or update member profile
        let profile = await storage.getMemberProfile(user.id);
        if (!profile) {
          profile = await storage.createMemberProfile({
            userId: user.id,
            phone: billingPhone || null,
            role: "member",
            clinicId: clinic?.id || null,
            isActive: true,
          });
        } else if (!profile.isActive) {
          // Only update if not already active (idempotency)
          await storage.updateMemberProfile(user.id, {
            role: "member",
            clinicId: clinic?.id || null,
            isActive: true,
          });
        }

        // Note: memberCount is not in the clinics schema - track members via profiles.clinicId

        console.log(`Member signup completed: ${billingEmail}, clinic: ${clinic?.slug || 'none'}`);

        return res.json({
          success: true,
          type: "member",
          userId: user.id,
          clinicId: clinic?.id,
        });
      } else {
        // Unknown signup type - log and acknowledge
        console.log(`Unknown signup type for order ${order.id}:`, signupType);
        return res.json({ message: "Order processed, no signup action taken" });
      }
    } catch (error: any) {
      console.error("WooCommerce webhook error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
