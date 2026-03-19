import type { Express, Request, Response } from "express";
import { db } from "../db";
import { libraryItems } from "@shared/schema";
import { eq, and, isNotNull, or, isNull } from "drizzle-orm";
import { requireAuth, requireRole } from "../working-auth";
import { syncDriveLibrary, getDriveLibraryCategories } from "../services/drive-library-sync";

export function registerLibraryRoutes(app: Express): void {
  app.get("/api/library", requireAuth, async (_req: Request, res: Response) => {
    try {
      const items = await db
        .select()
        .from(libraryItems)
        .where(eq(libraryItems.isActive, true));

      const enriched = items.map((item) => ({
        ...item,
        isDriveDocument: !!item.driveFileId,
        webViewLink: item.driveWebViewLink,
        mimeType: item.fileMimeType,
      }));

      enriched.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      res.json(enriched);
    } catch (error: unknown) {
      console.error("[Library] Error fetching items:", error);
      res.status(500).json({ error: "Failed to fetch library items" });
    }
  });

  app.get("/api/library/categories", requireAuth, async (_req: Request, res: Response) => {
    try {
      const categories = await getDriveLibraryCategories();
      res.json(categories);
    } catch (error: unknown) {
      console.error("[Library] Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.get("/api/library/:slug", requireAuth, async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;

      const [item] = await db
        .select()
        .from(libraryItems)
        .where(eq(libraryItems.slug, slug));

      if (!item) {
        return res.status(404).json({ error: "Library item not found" });
      }

      res.json({
        ...item,
        isDriveDocument: !!item.driveFileId,
        webViewLink: item.driveWebViewLink,
        mimeType: item.fileMimeType,
      });
    } catch (error: unknown) {
      console.error("[Library] Error fetching item:", error);
      res.status(500).json({ error: "Failed to fetch library item" });
    }
  });

  app.post("/api/library/sync-drive", requireRole("admin"), async (_req: Request, res: Response) => {
    try {
      const result = await syncDriveLibrary();
      res.json({
        success: true,
        message: `Synced ${result.synced} new items, updated ${result.updated}, removed ${result.removed} across ${result.categories} categories`,
        ...result,
      });
    } catch (error: any) {
      console.error("[Library] Drive sync error:", error);
      res.status(500).json({ error: "Drive sync failed: " + error.message });
    }
  });
}
