import type { Express, Request, Response } from "express";
import { requireRole } from "../working-auth";
import { storage } from "../storage";
import { type BloodworkUpload, type InsertBloodworkUpload } from "@shared/schema";
import multer from "multer";

type ExtractedMarker = NonNullable<BloodworkUpload["extractedMarkers"]>[number];

type MarkerHistoryEntry = {
  date: string;
  value: number;
  unit: string;
  status: string;
  uploadId: string;
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
] as const;

type AllowedMimeType = typeof ALLOWED_MIME_TYPES[number];

function isAllowedMimeType(mimeType: string): mimeType is AllowedMimeType {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType);
}

// Role constants must mirror the mapping in requireRole() in working-auth.ts
const DOCTOR_ROLE_NAMES = [
  "doctor", "physician", "ff_doctor", "ff_healer", "healer",
  "practitioner", "um_doctor", "um_healer", "um_practitioner",
  "wellness_practitioner", "healthcare_provider",
];
const ADMIN_ROLE_NAMES = ["administrator", "shop_manager", "admin", "trustee"];
const TRUSTEE_EMAILS = ["blake@forgottenformula.com"];

function getRequestUserId(req: Request): string {
  return req.user?.id || "system";
}

/**
 * Returns true if the requester is an admin, trustee, or super-user.
 * Matches the same mapping used by requireRole() in working-auth.ts.
 */
function isElevatedRole(req: Request): boolean {
  const roles: string[] = req.user?.wpRoles || [];
  const email = (req.user?.email || "").toLowerCase();
  return (
    roles.some((r) => ADMIN_ROLE_NAMES.includes(r)) ||
    TRUSTEE_EMAILS.includes(email)
  );
}

/**
 * Returns true if the requester is a doctor-only role (not admin/trustee).
 * Includes all WP role variants that map to the doctor role.
 */
function isDoctorOnly(req: Request): boolean {
  const roles: string[] = req.user?.wpRoles || [];
  return (
    roles.some((r) => DOCTOR_ROLE_NAMES.includes(r)) &&
    !isElevatedRole(req)
  );
}

export function registerBloodworkUploadRoutes(app: Express): void {
  app.post(
    "/api/bloodwork/upload",
    requireRole("admin", "doctor"),
    upload.single("file"),
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return void res.status(400).json({ success: false, error: "No file uploaded" });
        }

        const { memberId, memberName, notes, labName, collectionDate } = req.body as {
          memberId?: string;
          memberName?: string;
          notes?: string;
          labName?: string;
          collectionDate?: string;
        };

        if (!memberId) {
          return void res.status(400).json({ success: false, error: "memberId is required" });
        }

        if (!isAllowedMimeType(req.file.mimetype)) {
          return void res.status(400).json({
            success: false,
            error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF, PDF",
          });
        }

        const doctorId = getRequestUserId(req);
        const fileType = req.file.mimetype === "application/pdf" ? "pdf" : "image";

        const insertData: InsertBloodworkUpload = {
          memberId,
          memberName: memberName || null,
          doctorId,
          fileName: req.file.originalname,
          fileType,
          mimeType: req.file.mimetype,
          fileSize: req.file.size,
          status: "analyzing",
          notes: notes || null,
          labName: labName || null,
          collectionDate: collectionDate ? new Date(collectionDate) : null,
        };

        const uploadRecord = await storage.createBloodworkUpload(insertData);

        const { uploadBloodAnalysisFile } = await import("../services/drive");
        const driveResult = await uploadBloodAnalysisFile(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          memberId,
          "lab-report"
        );

        if (!driveResult.success || !driveResult.fileId) {
          await storage.updateBloodworkUpload(uploadRecord.id, {
            status: "failed",
            analysisError: "Failed to persist file to Google Drive. Upload aborted.",
          });
          return void res.status(500).json({
            success: false,
            error: "File could not be saved to Google Drive. Please try again.",
          });
        }

        await storage.updateBloodworkUpload(uploadRecord.id, {
          driveFileId: driveResult.fileId,
          driveWebViewLink: driveResult.webViewLink || null,
        });

        const fileBuffer = req.file.buffer;
        const fileMimeType = req.file.mimetype;
        const memberContext = memberName || memberId;

        analyzeBloodworkAsync(uploadRecord.id, fileBuffer, fileMimeType, memberContext).catch(
          (err: Error) => console.error("[Bloodwork] Async analysis failed:", err.message)
        );

        return void res.json({
          success: true,
          uploadId: uploadRecord.id,
          status: "analyzing",
          driveFileId: driveResult.fileId,
          driveWebViewLink: driveResult.webViewLink,
          message: "File uploaded and saved. AI analysis is running in the background.",
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("[Bloodwork Upload] Error:", message);
        return void res.status(500).json({ success: false, error: message });
      }
    }
  );

  app.get(
    "/api/bloodwork/uploads/:memberId",
    requireRole("admin", "trustee", "doctor"),
    async (req: Request, res: Response) => {
      try {
        const { memberId } = req.params;

        if (isDoctorOnly(req)) {
          const doctorId = getRequestUserId(req);
          const doctorUploads = await storage.getBloodworkUploadsByDoctor(doctorId);
          const memberUploads = doctorUploads.filter((u) => u.memberId === memberId);
          return void res.json({ success: true, uploads: memberUploads });
        }

        const uploads = await storage.getBloodworkUploads(memberId);
        return void res.json({ success: true, uploads });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return void res.status(500).json({ success: false, error: message });
      }
    }
  );

  app.get(
    "/api/bloodwork/my-uploads",
    requireRole("admin", "trustee", "doctor"),
    async (req: Request, res: Response) => {
      try {
        const doctorId = getRequestUserId(req);
        const uploads = await storage.getBloodworkUploadsByDoctor(doctorId);
        return void res.json({ success: true, uploads });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return void res.status(500).json({ success: false, error: message });
      }
    }
  );

  app.get(
    "/api/bloodwork/upload/:id",
    requireRole("admin", "trustee", "doctor"),
    async (req: Request, res: Response) => {
      try {
        const existing = await storage.getBloodworkUpload(req.params.id);
        if (!existing) {
          return void res.status(404).json({ success: false, error: "Upload not found" });
        }

        if (isDoctorOnly(req)) {
          const doctorId = getRequestUserId(req);
          if (existing.doctorId !== doctorId) {
            return void res.status(403).json({ success: false, error: "Access denied" });
          }
        }

        return void res.json({ success: true, upload: existing });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return void res.status(500).json({ success: false, error: message });
      }
    }
  );

  app.delete(
    "/api/bloodwork/upload/:id",
    requireRole("admin", "trustee", "doctor"),
    async (req: Request, res: Response) => {
      try {
        const existing = await storage.getBloodworkUpload(req.params.id);
        if (!existing) {
          return void res.status(404).json({ success: false, error: "Upload not found" });
        }

        if (isDoctorOnly(req)) {
          const doctorId = getRequestUserId(req);
          if (existing.doctorId !== doctorId) {
            return void res.status(403).json({ success: false, error: "Access denied" });
          }
        }

        await storage.deleteBloodworkUpload(req.params.id);
        return void res.json({ success: true });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return void res.status(500).json({ success: false, error: message });
      }
    }
  );

  app.get(
    "/api/bloodwork/history/:memberId",
    requireRole("admin", "trustee", "doctor"),
    async (req: Request, res: Response) => {
      try {
        const { memberId } = req.params;

        let allUploads: BloodworkUpload[];
        if (isDoctorOnly(req)) {
          const doctorId = getRequestUserId(req);
          const doctorUploads = await storage.getBloodworkUploadsByDoctor(doctorId);
          allUploads = doctorUploads.filter((u) => u.memberId === memberId);
        } else {
          allUploads = await storage.getBloodworkUploads(memberId);
        }

        const completedUploads = allUploads.filter(
          (u): u is BloodworkUpload & { extractedMarkers: ExtractedMarker[] } =>
            u.status === "completed" && Array.isArray(u.extractedMarkers)
        );

        const markerHistory: Record<string, MarkerHistoryEntry[]> = {};

        for (const upload of completedUploads) {
          const date = upload.collectionDate
            ? new Date(upload.collectionDate).toISOString()
            : new Date(upload.createdAt!).toISOString();

          for (const marker of upload.extractedMarkers) {
            if (!markerHistory[marker.testName]) {
              markerHistory[marker.testName] = [];
            }
            markerHistory[marker.testName].push({
              date,
              value: marker.value,
              unit: marker.unit,
              status: marker.status,
              uploadId: upload.id,
            });
          }
        }

        for (const testName of Object.keys(markerHistory)) {
          markerHistory[testName].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );
        }

        return void res.json({
          success: true,
          memberId,
          totalUploads: completedUploads.length,
          markerHistory,
          uploads: completedUploads.map((u) => ({
            id: u.id,
            fileName: u.fileName,
            labName: u.labName,
            collectionDate: u.collectionDate,
            createdAt: u.createdAt,
            markerCount: u.extractedMarkers.length,
            abnormalCount: u.extractedMarkers.filter((m) => m.status !== "normal").length,
          })),
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return void res.status(500).json({ success: false, error: message });
      }
    }
  );

  app.get(
    "/api/bloodwork/protocol-context/:memberId",
    requireRole("admin", "trustee", "doctor"),
    async (req: Request, res: Response) => {
      try {
        const { memberId } = req.params;

        let allUploads: BloodworkUpload[];
        if (isDoctorOnly(req)) {
          const doctorId = getRequestUserId(req);
          const doctorUploads = await storage.getBloodworkUploadsByDoctor(doctorId);
          allUploads = doctorUploads.filter((u) => u.memberId === memberId);
        } else {
          allUploads = await storage.getBloodworkUploads(memberId);
        }

        const completedUploads = allUploads.filter((u) => u.status === "completed");

        const { buildBloodworkProtocolContext } = await import("../services/bloodwork-ai-analyzer");
        const context = buildBloodworkProtocolContext(completedUploads);

        return void res.json({
          success: true,
          memberId,
          uploadCount: completedUploads.length,
          protocolContext: context,
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return void res.status(500).json({ success: false, error: message });
      }
    }
  );
}

async function analyzeBloodworkAsync(
  uploadId: string,
  buffer: Buffer,
  mimeType: string,
  memberContext: string
): Promise<void> {
  try {
    const { analyzeBloodworkReport, analyzeBloodworkPDF } = await import(
      "../services/bloodwork-ai-analyzer"
    );

    let result;
    if (mimeType === "application/pdf") {
      result = await analyzeBloodworkPDF(buffer, memberContext);
    } else {
      const base64 = buffer.toString("base64");
      result = await analyzeBloodworkReport(base64, mimeType, memberContext);
    }

    const updateData: Partial<BloodworkUpload> = {
      status: "completed",
      aiAnalyzed: true,
      aiAnalyzedAt: new Date(),
      extractedMarkers: result.extractedMarkers,
      clinicalSummary: result.clinicalSummary,
      aiObservations: result.aiObservations,
      protocolAlignments: result.protocolAlignments,
      abnormalFlags: result.abnormalFlags,
      confidence: result.confidence,
      labName: result.labName || null,
      collectionDate: result.collectionDate ? new Date(result.collectionDate) : null,
    };

    await storage.updateBloodworkUpload(uploadId, updateData);

    console.log(
      `[Bloodwork AI] Analysis complete for upload ${uploadId}: ${result.extractedMarkers.length} markers extracted`
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    console.error(`[Bloodwork AI] Analysis failed for upload ${uploadId}:`, message);
    await storage.updateBloodworkUpload(uploadId, {
      status: "failed",
      analysisError: message,
    });
  }
}
