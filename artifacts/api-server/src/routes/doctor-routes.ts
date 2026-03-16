import type { Express, Request, Response } from "express";
import { requireRole } from "../working-auth";
import { storage } from "../storage";
import { db } from "../db";
import { eq, desc, and } from "drizzle-orm";
import multer from "multer";
import { uploadXrayFile } from "../services/drive";
import { HfInference } from "@huggingface/inference";

const xrayUpload = multer({ storage: multer.memoryStorage() });

export function registerDoctorRoutes(app: Express): void {
  app.get("/api/doctor/patients", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const doctorId = req.user?.id as string;
      const patients = await storage.getPatientRecords(doctorId);
      res.json({ success: true, patients });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/doctor/patients/:id", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const patient = await storage.getPatientRecord(req.params.id);
      if (!patient) {
        return res.status(404).json({ success: false, error: "Patient not found" });
      }
      const uploads = await storage.getPatientUploads(patient.id);
      const protocols = await storage.getPatientProtocols(patient.id);
      res.json({ success: true, patient, uploads, protocols });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/doctor/patients", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const doctorId = req.user?.id as string;
      const patient = await storage.createPatientRecord({ ...req.body, doctorId });
      res.json({ success: true, patient });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.put("/api/doctor/patients/:id", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const patient = await storage.updatePatientRecord(req.params.id, req.body);
      res.json({ success: true, patient });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/doctor/patients/:patientId/uploads", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const doctorId = req.user?.id as string;
      const upload = await storage.createPatientUpload({
        ...req.body,
        patientRecordId: req.params.patientId,
        uploadedBy: doctorId,
        uploadedByRole: "doctor"
      });
      res.json({ success: true, upload });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/doctor/protocols", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const doctorId = req.user?.id as string;
      const protocols = await storage.getDoctorProtocols(doctorId);
      res.json({ success: true, protocols });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/doctor/patients/:patientId/protocols", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const doctorId = req.user?.id as string;
      const protocol = await storage.createPatientProtocol({
        ...req.body,
        patientRecordId: req.params.patientId,
        doctorId
      });
      res.json({ success: true, protocol });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.put("/api/doctor/protocols/:id", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const protocol = await storage.updatePatientProtocol(req.params.id, req.body);
      res.json({ success: true, protocol });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/doctor/conversations", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id as string;
      const conversationList = await storage.getConversations(userId);
      res.json({ success: true, conversations: conversationList });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/doctor/conversations/:id/messages", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const messages = await storage.getMessages(req.params.id);
      res.json({ success: true, messages });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/doctor/conversations", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const conversation = await storage.createConversation(req.body);
      res.json({ success: true, conversation });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/doctor/messages", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const message = await storage.createMessage(req.body);
      res.json({ success: true, message });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.put("/api/doctor/messages/:id/read", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const message = await storage.markMessageRead(req.params.id);
      res.json({ success: true, message });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/ai/analyze-image", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const { patientUploadId, analysisType, imageData } = req.body;
      const requestedBy = req.user?.id as string;

      const modelId = analysisType === "xray" ? "jiviai/Jivi-RadX-v1" : "VRJBro/skin-cancer-detection";
      const startTime = Date.now();
      let findings: Array<{ area: string; description: string; confidence: number }> = [];

      try {
        const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
        const imageBuffer = Buffer.from(imageData.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        const classifications = await hf.imageClassification({
          model: modelId,
          data: imageBuffer,
        });

        findings = classifications.map((c: any) => ({
          area: c.label || "Classification",
          description: `Pattern detected: ${c.label}`,
          confidence: c.score || 0,
        }));
      } catch (hfError: any) {
        console.error("[AI Analyze] HuggingFace API error:", hfError.message);
        findings = [
          { area: "Analysis Failed", description: `Model inference error: ${hfError.message}. Please try again later.`, confidence: 0 }
        ];
      }

      const processingTimeMs = Date.now() - startTime;
      const inferenceSucceeded = findings.length > 0 && findings[0].area !== "Analysis Failed";

      const analysisResult = {
        success: inferenceSucceeded,
        analysisType,
        model: modelId,
        result: {
          findings,
          disclaimer: "This AI analysis is for educational purposes only within the PMA. It does not constitute medical advice. All findings should be reviewed by a qualified healthcare practitioner."
        },
        processingTimeMs
      };

      const { aiAnalysisRequests } = await import("@shared/schema");
      const avgConfidence = findings.length > 0
        ? (findings.reduce((sum, f) => sum + f.confidence, 0) / findings.length).toFixed(4)
        : "0";

      await db.insert(aiAnalysisRequests).values({
        patientUploadId: patientUploadId || "demo",
        requestedBy,
        analysisType,
        model: modelId,
        status: inferenceSucceeded ? "completed" : "failed",
        result: analysisResult.result,
        confidence: avgConfidence,
        processingTimeMs,
        errorMessage: inferenceSucceeded ? undefined : findings[0]?.description,
        completedAt: new Date()
      });

      res.json(analysisResult);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/xray/upload-analyze", requireRole("admin", "doctor"), xrayUpload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) return res.status(400).json({ success: false, error: "No file uploaded" });

      const { patientId } = req.body;
      const requestedBy = req.user?.id as string;
      const startTime = Date.now();

      const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/dicom', 'application/octet-stream'];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ success: false, error: "Invalid file type. Please upload JPEG, PNG, or DICOM." });
      }

      if (patientId && patientId !== "unassigned") {
        const patient = await storage.getPatientRecord(patientId);
        if (!patient) {
          return res.status(404).json({ success: false, error: "Patient record not found." });
        }
        if (patient.doctorId !== requestedBy) {
          const user = await storage.getUser(requestedBy);
          if (!user || user.role !== "admin") {
            return res.status(403).json({ success: false, error: "You do not have access to this patient." });
          }
        }
      }

      let driveLink: string | undefined;
      let driveFileId: string | undefined;
      try {
        const driveResult = await uploadXrayFile(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          patientId
        );
        if (driveResult.success) {
          driveLink = driveResult.webViewLink;
          driveFileId = driveResult.fileId;
        }
      } catch (driveError: any) {
        console.error("[X-Ray Upload] Drive upload failed (continuing with analysis):", driveError.message);
      }

      const { patientUploads, aiAnalysisRequests } = await import("@shared/schema");
      const patientRecordId = patientId || "unassigned";
      const [uploadRecord] = await db.insert(patientUploads).values({
        patientRecordId,
        uploadedBy: requestedBy,
        uploadedByRole: "doctor",
        recordType: "x_ray",
        fileName: req.file.originalname,
        fileUrl: driveLink || null,
        driveFileId: driveFileId || null,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        description: `X-ray upload for patient ${patientRecordId}`,
      }).returning();

      let findings: Array<{ area: string; description: string; confidence: number; annotation?: { region: string; severity: string } }> = [];
      const modelId = "jiviai/Jivi-RadX-v1";
      let inferenceSucceeded = true;

      try {
        const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
        const classifications = await hf.imageClassification({
          model: modelId,
          data: req.file.buffer,
        });

        findings = classifications.map((c: any, idx: number) => ({
          area: c.label || "Classification",
          description: `Pattern detected: ${c.label}`,
          confidence: c.score || 0,
          annotation: {
            region: c.label || `region-${idx}`,
            severity: (c.score || 0) >= 0.8 ? "high" : (c.score || 0) >= 0.5 ? "moderate" : "low",
          }
        }));
      } catch (hfError: any) {
        console.error("[X-Ray Upload] HuggingFace inference error:", hfError.message);
        inferenceSucceeded = false;
        findings = [
          { area: "Analysis Unavailable", description: `Model inference failed: ${hfError.message}. Please try again later.`, confidence: 0 }
        ];
      }

      if (findings.length === 0) {
        findings = [{ area: "No Findings", description: "The model did not return any classifications for this image.", confidence: 0 }];
      }

      const processingTimeMs = Date.now() - startTime;
      const avgConfidence = findings.reduce((sum, f) => sum + f.confidence, 0) / findings.length;

      const analysisResult = {
        success: inferenceSucceeded,
        analysisType: "xray",
        model: modelId,
        result: {
          findings,
          disclaimer: "This AI analysis is for educational purposes only within the PMA. It does not constitute medical advice. All findings should be reviewed by a qualified healthcare practitioner."
        },
        processingTimeMs,
        driveLink,
        driveFileId
      };

      await db.insert(aiAnalysisRequests).values({
        patientUploadId: uploadRecord.id,
        requestedBy,
        analysisType: "xray",
        model: modelId,
        status: inferenceSucceeded ? "completed" : "failed",
        result: analysisResult.result,
        confidence: avgConfidence.toFixed(4),
        processingTimeMs,
        errorMessage: inferenceSucceeded ? undefined : findings[0]?.description,
        completedAt: new Date()
      });

      await db.update(patientUploads).set({
        aiAnalyzed: true,
        aiAnalysisResult: analysisResult.result,
        aiAnalyzedAt: new Date(),
        aiModel: modelId,
      }).where(eq(patientUploads.id, uploadRecord.id));

      res.json(analysisResult);
    } catch (error: any) {
      console.error("[X-Ray Upload] Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/xray/history", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const requestedBy = req.user?.id as string;
      const { aiAnalysisRequests } = await import("@shared/schema");
      const analyses = await db.select()
        .from(aiAnalysisRequests)
        .where(and(
          eq(aiAnalysisRequests.analysisType, "xray"),
          eq(aiAnalysisRequests.requestedBy, requestedBy)
        ))
        .orderBy(desc(aiAnalysisRequests.createdAt))
        .limit(20);

      res.json({ success: true, analyses });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message, analyses: [] });
    }
  });

  app.get("/api/xray/history/:patientId", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const requestedBy = req.user?.id as string;
      const { patientId } = req.params;

      const patient = await storage.getPatientRecord(patientId);
      if (!patient) {
        return res.status(404).json({ success: false, error: "Patient not found", analyses: [] });
      }
      if (patient.doctorId !== requestedBy) {
        const user = await storage.getUser(requestedBy);
        if (!user || user.role !== "admin") {
          return res.status(403).json({ success: false, error: "Access denied", analyses: [] });
        }
      }

      const { patientUploads } = await import("@shared/schema");
      const uploads = await db.select()
        .from(patientUploads)
        .where(and(
          eq(patientUploads.patientRecordId, patientId),
          eq(patientUploads.recordType, "x_ray")
        ))
        .orderBy(desc(patientUploads.createdAt));

      res.json({ success: true, analyses: uploads });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message, analyses: [] });
    }
  });

  app.get("/api/doctor/analytics", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const doctorId = req.user?.id as string;
      const patients = await storage.getPatientRecords(doctorId);
      const protocols = await storage.getDoctorProtocols(doctorId);

      const analytics = {
        totalPatients: patients.length,
        activePatients: patients.filter(p => p.status === "active").length,
        totalProtocols: protocols.length,
        activeProtocols: protocols.filter(p => p.status === "active").length,
        completedProtocols: protocols.filter(p => p.status === "completed").length,
        averageComplianceScore: protocols.filter(p => p.complianceScore).reduce((sum, p) => sum + (p.complianceScore || 0), 0) / Math.max(protocols.filter(p => p.complianceScore).length, 1)
      };

      res.json({ success: true, analytics });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
}
