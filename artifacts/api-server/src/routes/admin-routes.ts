import type { Express, Request, Response } from "express";
import { requireRole } from "../working-auth";
import { storage } from "../storage";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { wooCommerceService } from "../services/woocommerce";
import { signNowService } from "../services/signnow";
import { validatePreviewMode } from "../lib/preview-mode";
import { seedECSTraining } from "../seeds/ecs-training-seed";
import { seedGersonTherapy } from "../seeds/gerson-therapy-seed";
import { seedPMALawTraining } from "../seeds/pma-law-training-seed";
import { seedPeptideTraining } from "../seeds/peptide-training-seed";
import { seedDianeCandidaCookbook } from "../seeds/diane-candida-cookbook-seed";
import { seedOzoneTraining } from "../seeds/ozone-training-seed";
import { indexAllMarketingAssets, searchAssets, checkExistingAsset, getAssetStats } from "../services/asset-catalog";
import { connectSourceMaterials, autoConnectByKeywordMatch } from "../seeds/connect-source-materials-seed";
import { generateInteractiveContent, generateSingleModuleContent } from "../seeds/batch-interactive-content-seed";
import { seedDietCancerTraining, dietCancerContent } from "../seeds/diet-cancer-training-seed";
import { seedIvermectinTraining } from "../seeds/ivermectin-training-seed";
import { seedRemainingModules } from "../seeds/complete-remaining-modules-seed";
import { enhanceModulesWithMedia, getAvailableMediaAssets } from "../seeds/enhance-modules-with-media";
import { seedAchievements } from "../seeds/achievements-seed";
import { getAllIntegrationStatuses, testIntegration } from "../services/integration-registry";

export function registerAdminRoutes(app: Express): void {
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

  let adminStatsCache: { data: any; timestamp: number } | null = null;
  const ADMIN_STATS_CACHE_TTL = 60000;

  app.get("/api/admin/stats", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const now = Date.now();
      if (adminStatsCache && (now - adminStatsCache.timestamp) < ADMIN_STATS_CACHE_TTL) {
        return res.json(adminStatsCache.data);
      }

      const localMembers = await storage.getAllMembers();
      const localContracts = await storage.getAllContracts();
      const clinics = await storage.getAllClinics();

      const totalMembers = localMembers.length;
      const totalDoctors = localMembers.filter((m: any) => m.role === 'doctor').length;
      const totalClinics = clinics.length;

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const recentSignups = localMembers.filter((m: any) => m.createdAt && new Date(m.createdAt) > oneWeekAgo).length;

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

      adminStatsCache = { data: responseData, timestamp: now };
      res.json(responseData);
    } catch (error: any) {
      console.error("Admin stats error:", error);
      res.status(500).json({ error: error.message });
    }
  });

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

  app.post("/api/admin/sync-wordpress", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      import("../services/wordpress-sync").then(({ syncFromWordPress }) => {
        console.log("[WP Sync] Starting background WordPress sync (products, categories, library)...");
        syncFromWordPress()
          .then(result => console.log("[WP Sync] Background sync completed successfully:", result))
          .catch(err => console.error("[WP Sync] Background sync error:", err));
      }).catch(err => console.error("[WP Sync] Failed to load wordpress-sync module:", err));

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

  app.post("/api/admin/sync-users", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      import("../services/wordpress-sync").then(({ syncUsers }) => {
        console.log("[WP Sync] Starting background User sync...");
        syncUsers()
          .then(result => console.log(`[WP Sync] Background user sync finished. Imported: ${result.imported}, Updated: ${result.updated}`))
          .catch(err => console.error("[WP Sync] Background user sync error:", err));
      }).catch(err => console.error("[WP Sync] Failed to load wordpress-sync module:", err));

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

  app.get("/api/clinics", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const clinics = await storage.getAllClinics();
      res.json(clinics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/clinics/:id/signnow-links", requireRole("admin"), async (req: Request, res: Response) => {
    try {
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

  app.patch("/api/clinics/wp/:wpClinicId/signnow-links", requireRole("admin"), async (req: Request, res: Response) => {
    try {
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

  app.get("/api/integrations/status", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const statuses = await getAllIntegrationStatuses();
      res.json({ integrations: statuses });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/integrations/test/:serviceName", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const result = await testIntegration(req.params.serviceName);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/sync/full", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { syncUsers, syncProducts, syncCategories, syncLibraryContent, syncClinics } = await import("../services/wordpress-sync");
      const { products, categories, memberProfiles } = await import("@shared/schema");

      const results = {
        users: { imported: 0, updated: 0, skipped: 0, errors: [] as string[] },
        products: 0,
        categories: 0,
        library: 0,
        clinics: { synced: 0, updated: 0, created: 0, errors: [] as string[] },
        timestamp: new Date().toISOString(),
      };

      try {
        await syncCategories();
        const cats = await db.select().from(categories);
        results.categories = cats.length;
      } catch (err: any) {
        results.users.errors.push(`Categories: ${err.message}`);
      }

      try {
        await syncProducts();
        const prods = await db.select().from(products);
        results.products = prods.length;
      } catch (err: any) {
        results.users.errors.push(`Products: ${err.message}`);
      }

      try {
        const userResult = await syncUsers();
        results.users = userResult;
      } catch (err: any) {
        results.users.errors.push(`Users: ${err.message}`);
      }

      try {
        results.library = await syncLibraryContent();
      } catch (err: any) {
        results.users.errors.push(`Library: ${err.message}`);
      }

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

  app.post("/api/sync/clinics", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { syncClinics } = await import("../services/wordpress-sync");
      const result = await syncClinics();
      res.json(result);
    } catch (error: any) {
      console.error("Clinic sync error:", error);
      res.status(500).json({ error: error.message });
    }
  });

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

  app.post("/api/admin/seed-training-content", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const isPreviewMode = validatePreviewMode(req);
      const userId = req.user?.id as string;
      if (!userId && !isPreviewMode) {
        return res.status(401).json({ error: "Admin authentication required" });
      }

      console.log("[Admin] Seeding comprehensive training content...");
      const { seedTrainingContent } = await import("../seed-training-content");
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

  app.get("/api/gmail/inbox", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { getInbox } = await import("../services/gmail");
      const result = await getInbox(20);
      if (result.success) {
        res.json({ connected: true, messages: result.messages || [] });
      } else {
        res.json({ connected: false, messages: [], error: result.error || "Gmail not connected" });
      }
    } catch (error: any) {
      res.json({ connected: false, messages: [], error: error.message });
    }
  });

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

  app.post("/api/admin/push-user-to-wordpress/:userId", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { pushUserToWordPress } = await import("../services/wordpress-sync");
      const result = await pushUserToWordPress(req.params.userId);
      res.json(result);
    } catch (error: any) {
      console.error("Push user error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post("/api/admin/push-all-users-to-wordpress", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      import("../services/wordpress-sync").then(({ pushAllUsersToWordPress: pushAll }) => {
        console.log("[WP Push] Starting background push of all users to WordPress...");
        pushAll()
          .then(result => console.log(`[WP Push] Push complete: ${result.success} success, ${result.failed} failed, ${result.skipped} skipped`))
          .catch(err => console.error("[WP Push] Push error:", err));
      });

      res.status(202).json({
        success: true,
        message: "Push all users to WordPress started in the background.",
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post("/api/admin/push-product-to-wordpress/:productId", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { pushProductToWordPress } = await import("../services/wordpress-sync");
      const result = await pushProductToWordPress(req.params.productId);
      res.json(result);
    } catch (error: any) {
      console.error("Push product error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post("/api/admin/push-all-products-to-wordpress", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      import("../services/wordpress-sync").then(({ pushAllProductsToWordPress }) => {
        console.log("[WP Push] Starting background push of all products to WooCommerce...");
        pushAllProductsToWordPress()
          .then(result => console.log(`[WP Push] Product push complete: ${result.success} success, ${result.failed} failed, ${result.skipped} skipped`))
          .catch(err => console.error("[WP Push] Product push error:", err));
      });

      res.status(202).json({
        success: true,
        message: "Push all products to WooCommerce started in the background.",
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post("/api/admin/push-clinic-to-wordpress/:clinicId", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { pushClinicToWordPress } = await import("../services/wordpress-sync");
      const result = await pushClinicToWordPress(req.params.clinicId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post("/api/admin/push-all-clinics-to-wordpress", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      import("../services/wordpress-sync").then(({ pushAllClinicsToWordPress }) => {
        console.log("[WP Push] Starting background push of all clinics to WordPress...");
        pushAllClinicsToWordPress()
          .then(result => console.log(`[WP Push] Clinic push complete: ${result.success} success, ${result.failed} failed, ${result.skipped} skipped`))
          .catch(err => console.error("[WP Push] Clinic push error:", err));
      });

      res.status(202).json({
        success: true,
        message: "Push all clinics to WordPress started in the background.",
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post("/api/admin/push-content-to-wordpress", requireRole("admin"), async (req: Request, res: Response): Promise<any> => {
    try {
      const { title, content, wpPostId } = req.body;
      if (!title || !content) {
        return res.status(400).json({ success: false, message: "Title and content are required" });
      }
      const { pushContentToWordPress } = await import("../services/wordpress-sync");
      const result = await pushContentToWordPress(title, content, wpPostId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get("/api/admin/sync-tracking", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { getSyncTrackingSummary } = await import("../services/wordpress-sync");
      const summary = await getSyncTrackingSummary();
      res.json(summary);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/sync-conflicts", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { getSyncConflicts } = await import("../services/wordpress-sync");
      const conflicts = await getSyncConflicts();
      res.json(conflicts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/sync-conflicts/:id/resolve", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub || "admin";
      const { resolveConflict } = await import("../services/wordpress-sync");
      const result = await resolveConflict(req.params.id, userId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/wp-mirror-stats", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { products, categories, memberProfiles, clinics } = await import("@shared/schema");
      const { wordPressAuthService } = await import("../services/wordpress-auth");

      const [localProducts, localCategories, localMembers, localClinics] = await Promise.all([
        db.select().from(products),
        db.select().from(categories),
        db.select().from(memberProfiles),
        db.select().from(clinics),
      ]);

      let wpUserCounts = { total: 0, doctors: 0, clinics: 0, members: 0, admins: 0 };
      try {
        const wpResult = await wordPressAuthService.getAllUsers();
        wpUserCounts = wpResult.counts;
      } catch (e) {
        console.log("[Mirror Stats] WordPress user fetch failed, using cached data");
      }

      let wcProductCount = 0;
      let wcOrderCount = 0;
      try {
        const wcStatus = await wooCommerceService.getConnectionStatus();
        if (wcStatus.connected) {
          const prodResult = await wooCommerceService.getProducts(1, 1);
          wcProductCount = prodResult.total || 0;
          const orderStats = await wooCommerceService.getOrderStats();
          wcOrderCount = orderStats.totalOrders || 0;
        }
      } catch (e) {
        console.log("[Mirror Stats] WooCommerce fetch failed");
      }

      let syncSummary = null;
      try {
        const { getSyncTrackingSummary } = await import("../services/wordpress-sync");
        syncSummary = await getSyncTrackingSummary();
      } catch (e) {
        console.log("[Mirror Stats] Sync tracking fetch failed");
      }

      res.json({
        local: {
          users: localMembers.length,
          products: localProducts.length,
          categories: localCategories.length,
          clinics: localClinics.length,
        },
        wordpress: {
          users: wpUserCounts,
          products: wcProductCount,
          orders: wcOrderCount,
        },
        syncStatus: syncSummary,
        lastChecked: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Mirror stats error:", error);
      res.status(500).json({ error: error.message });
    }
  });
}
