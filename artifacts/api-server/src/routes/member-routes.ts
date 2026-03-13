import type { Express, Request, Response } from "express";
import { requireAuth, requireRole } from "../working-auth";
import { storage } from "../storage";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { Readable } from "stream";
import { insertProgramEnrollmentSchema } from "@shared/schema";
import { getUncachableGoogleDriveClient } from "../services/drive";
import { asyncHandler, AppError } from "../middleware/error-handler";

export function registerMemberRoutes(app: Express): void {
  app.get("/api/programs", asyncHandler(async (_req: Request, res: Response) => {
    const programs = await storage.getPrograms();
    res.json(programs);
  }));

  app.get("/api/programs/:slug", asyncHandler(async (req: Request, res: Response) => {
    const program = await storage.getProgramBySlug(req.params.slug);
    if (!program) throw new AppError("Program not found", 404, "NOT_FOUND");
    res.json(program);
  }));

  app.get("/api/programs/:slug/enrollment", requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as { user?: { claims?: { sub?: string } } }).user?.claims?.sub;
    if (!userId) throw new AppError("User ID required", 401, "UNAUTHORIZED");
    const program = await storage.getProgramBySlug(req.params.slug);
    if (!program) throw new AppError("Program not found", 404, "NOT_FOUND");
    const enrollment = await storage.getProgramEnrollment(userId, program.id);
    if (!enrollment) throw new AppError("Not enrolled", 404, "NOT_FOUND");
    res.json(enrollment);
  }));

  app.post("/api/programs/:slug/enroll", requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as { user?: { claims?: { sub?: string } } }).user?.claims?.sub;
    if (!userId) throw new AppError("User ID required", 401, "UNAUTHORIZED");
    const program = await storage.getProgramBySlug(req.params.slug);
    if (!program) throw new AppError("Program not found", 404, "NOT_FOUND");
    const existingEnrollment = await storage.getProgramEnrollment(userId, program.id);
    if (existingEnrollment) {
      res.json(existingEnrollment);
      return;
    }
    const enrollment = await storage.createProgramEnrollment({
      userId,
      programId: program.id,
      status: "active",
      progress: 0,
    });
    res.status(201).json(enrollment);
  }));

  app.patch("/api/programs/:slug/progress", requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    if (!userId) throw new AppError("Not authenticated", 401, "UNAUTHORIZED");
    const program = await storage.getProgramBySlug(req.params.slug);
    if (!program) throw new AppError("Program not found", 404, "NOT_FOUND");
    const progressSchema = insertProgramEnrollmentSchema.pick({ progress: true });
    const parsed = progressSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError("Invalid progress value", 400, "VALIDATION_ERROR");
    const { progress } = parsed.data;
    const enrollment = await storage.updateProgramEnrollmentProgress(userId, program.id, progress ?? 0);
    if (!enrollment) throw new AppError("Not enrolled", 404, "NOT_FOUND");
    res.json(enrollment);
  }));

  app.get("/api/my/enrollments", requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    if (!userId) throw new AppError("Not authenticated", 401, "UNAUTHORIZED");
    const enrollments = await storage.getUserProgramEnrollments(userId);
    res.json(enrollments);
  }));

  app.get("/api/achievements", requireAuth, asyncHandler(async (_req: Request, res: Response) => {
    const achievements = await storage.getAchievements();
    res.json(achievements);
  }));

  app.get("/api/my/achievements", requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const userAchievements = await storage.getUserAchievements(userId);
    res.json(userAchievements);
  }));

  app.post("/api/my/achievements/:achievementId", requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    if (!userId) throw new AppError("Not authenticated", 401, "UNAUTHORIZED");
    const userAchievement = await storage.awardAchievement(userId, req.params.achievementId, req.body.metadata);
    res.status(201).json(userAchievement);
  }));

  app.get("/api/my/bookmarks", requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const bookmarks = await storage.getUserBookmarks(userId);
    res.json(bookmarks);
  }));

  app.post("/api/my/bookmarks", requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    if (!userId) throw new AppError("Not authenticated", 401, "UNAUTHORIZED");
    const bookmark = await storage.addBookmark({ userId, moduleId: req.body.moduleId, notes: req.body.notes });
    res.status(201).json(bookmark);
  }));

  app.delete("/api/my/bookmarks/:moduleId", requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    if (!userId) throw new AppError("Not authenticated", 401, "UNAUTHORIZED");
    await storage.removeBookmark(userId, req.params.moduleId);
    res.json({ success: true });
  }));

  app.get("/api/my/bookmarks/:moduleId/status", requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const isBookmarked = await storage.isBookmarked(userId, req.params.moduleId);
    res.json({ isBookmarked });
  }));

  app.get("/api/discussions", asyncHandler(async (req: Request, res: Response) => {
    const moduleId = req.query.moduleId as string | undefined;
    const threads = await storage.getDiscussionThreads(moduleId);
    res.json(threads);
  }));

  app.get("/api/discussions/:id", asyncHandler(async (req: Request, res: Response) => {
    const thread = await storage.getDiscussionThread(req.params.id);
    if (!thread) throw new AppError("Thread not found", 404, "NOT_FOUND");
    const replies = await storage.getDiscussionReplies(req.params.id);
    res.json({ thread, replies });
  }));

  app.post("/api/discussions", requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    if (!userId) throw new AppError("Not authenticated", 401, "UNAUTHORIZED");
    const user = await storage.getUser(userId);
    const thread = await storage.createDiscussionThread({
      moduleId: req.body.moduleId,
      title: req.body.title,
      content: req.body.content,
      authorId: userId,
      authorName: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : "Member",
    });
    res.status(201).json(thread);
  }));

  app.post("/api/discussions/:id/replies", requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    if (!userId) throw new AppError("Not authenticated", 401, "UNAUTHORIZED");
    const user = await storage.getUser(userId);
    const reply = await storage.createDiscussionReply({
      threadId: req.params.id,
      content: req.body.content,
      authorId: userId,
      authorName: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : "Member",
      parentReplyId: req.body.parentReplyId,
    });
    res.status(201).json(reply);
  }));

  app.get("/api/legal/documents", requireRole("admin"), asyncHandler(async (_req: Request, res: Response) => {
    const docs = await storage.getAllLegalDocuments();
    res.json(docs);
  }));

  app.get("/api/legal/documents/:id", requireRole("admin"), asyncHandler(async (req: Request, res: Response) => {
    const doc = await storage.getLegalDocument(req.params.id);
    if (!doc) throw new AppError("Document not found", 404, "NOT_FOUND");
    res.json(doc);
  }));

  app.post("/api/legal/documents", requireRole("admin"), asyncHandler(async (req: Request, res: Response) => {
    const doc = await storage.createLegalDocument(req.body);
    res.status(201).json(doc);
  }));

  app.patch("/api/legal/documents/:id", requireRole("admin"), asyncHandler(async (req: Request, res: Response) => {
    const doc = await storage.updateLegalDocument(req.params.id, req.body);
    if (!doc) throw new AppError("Document not found", 404, "NOT_FOUND");
    res.json(doc);
  }));

  app.delete("/api/legal/documents/:id", requireRole("admin"), asyncHandler(async (req: Request, res: Response) => {
    await storage.deleteLegalDocument(req.params.id);
    res.status(204).send();
  }));

  app.post("/api/legal/initialize", requireRole("admin"), asyncHandler(async (_req: Request, res: Response) => {
    const existingDocs = await storage.getAllLegalDocuments();
    const hasAllioTrademark = existingDocs.some(d => d.title.includes("ALLIO") && d.docType === "trademark");
    const hasFFPMAPatent = existingDocs.some(d => d.title.includes("FF PMA") && d.docType === "patent");

    const newDocs = [];

    if (!hasAllioTrademark) {
      const allioTrademark = await storage.createLegalDocument({
        title: "ALLIO Trademark Application",
        docType: "trademark",
        status: "draft",
        description: "Federal trademark registration for ALLIO - The All-In-One Healing Ecosystem brand mark",
        content: `UNITED STATES PATENT AND TRADEMARK OFFICE\nTRADEMARK APPLICATION\n\nMARK: ALLIO\n\nAPPLICANT: Forgotten Formula PMA\n\nDrafted by: JURIS (Chief Legal AI)\nDate: ${new Date().toISOString().split('T')[0]}\nStatus: DRAFT - Pending Trustee Review`,
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
        content: `UNITED STATES PATENT AND TRADEMARK OFFICE\nPROVISIONAL PATENT APPLICATION\n\nTITLE: AI-Powered Healing Protocol Management System\n\nDrafted by: JURIS (Chief Legal AI)\nDate: ${new Date().toISOString().split('T')[0]}\nStatus: DRAFT - Pending Trustee Review`,
        assignedAgent: "JURIS",
        priority: "high",
        jurisdiction: "United States",
        createdBy: "JURIS",
      });
      newDocs.push(ffpmaPatent);
    }

    const hasPMAOps = existingDocs.some(d => d.title.includes("Operating Agreement"));
    if (!hasPMAOps) {
      const pmaOps = await storage.createLegalDocument({
        title: "FF PMA Operating Agreement - Amendment Draft",
        docType: "agreement",
        status: "draft",
        description: "Amendment to the Private Membership Association operating agreement to include ALLIO platform provisions",
        content: `FORGOTTEN FORMULA PRIVATE MEMBERSHIP ASSOCIATION\nOPERATING AGREEMENT - AMENDMENT\n\nDrafted by: LEXICON (Contract Specialist)\nDate: ${new Date().toISOString().split('T')[0]}\nStatus: DRAFT - Pending Trustee Review`,
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
  }));

  app.post("/api/legal/documents/:id/upload-to-drive", requireRole("admin"), asyncHandler(async (req: Request, res: Response) => {
    const doc = await storage.getLegalDocument(req.params.id);
    if (!doc) throw new AppError("Document not found", 404, "NOT_FOUND");

    const fileContent = `${doc.title}\n\n${doc.description || ""}\n\n${doc.content || ""}`;
    const drive = await getUncachableGoogleDriveClient();
    const allioFolderId = "16wOdbJPoOVOz5GE0mtlzf84c896JX1UC";

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
  }));

  app.post("/api/legal/documents/upload-all-to-drive", requireRole("admin"), asyncHandler(async (_req: Request, res: Response) => {
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
        const allioFolderId = "16wOdbJPoOVOz5GE0mtlzf84c896JX1UC";

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
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        results.push({ id: doc.id, title: doc.title, success: false, error: message });
      }
    }

    res.json({ results });
  }));
}
