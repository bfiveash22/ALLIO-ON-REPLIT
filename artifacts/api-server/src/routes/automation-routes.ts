import type { Express, Request, Response } from "express";
import { requireRole } from "../working-auth";
import { asyncHandler, AppError } from "../middleware/error-handler";
import {
  aggregateHealingProgress,
  generateHealingProgressPDF,
} from "../services/healing-progress-report";
import { buildECSProfile } from "../services/ecs-profile";
import {
  processNewEnrollment,
} from "../services/enrollment-automation";

function isAdmin(req: Request): boolean {
  const session = (req as any).session;
  const wpRoles = session?.user?.wpRoles || (req as any).user?.wpRoles || [];
  if (typeof wpRoles === "string") {
    return wpRoles.includes("admin") || wpRoles.includes("administrator");
  }
  if (Array.isArray(wpRoles)) {
    return wpRoles.some((r: string) => r === "admin" || r === "administrator");
  }
  return false;
}

export function registerAutomationRoutes(app: Express): void {
  app.get(
    "/api/doctor/members/:patientId/healing-report",
    requireRole("admin", "doctor"),
    asyncHandler(async (req: Request, res: Response) => {
      const doctorId = (req as any).user?.id as string;
      const { patientId } = req.params;

      const data = await aggregateHealingProgress(patientId, doctorId, isAdmin(req));
      res.json({ success: true, data });
    })
  );

  app.get(
    "/api/doctor/members/:patientId/healing-report/pdf",
    requireRole("admin", "doctor"),
    asyncHandler(async (req: Request, res: Response) => {
      const doctorId = (req as any).user?.id as string;
      const { patientId } = req.params;

      const data = await aggregateHealingProgress(patientId, doctorId, isAdmin(req));
      const pdfBuffer = await generateHealingProgressPDF(data);

      const safeName = data.patient.name.replace(/[^a-zA-Z0-9]/g, "_");
      const dateStr = new Date().toISOString().split("T")[0];

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="Healing_Report_${safeName}_${dateStr}.pdf"`
      );
      res.setHeader("Content-Length", pdfBuffer.length);
      res.send(pdfBuffer);
    })
  );

  app.get(
    "/api/doctor/members/:patientId/ecs-profile",
    requireRole("admin", "doctor"),
    asyncHandler(async (req: Request, res: Response) => {
      const doctorId = (req as any).user?.id as string;
      const { patientId } = req.params;

      const profile = await buildECSProfile(patientId, doctorId, isAdmin(req));
      res.json({ success: true, profile });
    })
  );

  app.get("/api/doctor/patients/:patientId/healing-report", (req: Request, res: Response) => {
    res.redirect(301, `/api/doctor/members/${req.params.patientId}/healing-report`);
  });
  app.get("/api/doctor/patients/:patientId/healing-report/pdf", (req: Request, res: Response) => {
    res.redirect(301, `/api/doctor/members/${req.params.patientId}/healing-report/pdf`);
  });
  app.get("/api/doctor/patients/:patientId/ecs-profile", (req: Request, res: Response) => {
    res.redirect(301, `/api/doctor/members/${req.params.patientId}/ecs-profile`);
  });

  app.post(
    "/api/enrollment/:enrollmentId/welcome",
    requireRole("admin"),
    asyncHandler(async (req: Request, res: Response) => {
      const { enrollmentId } = req.params;

      const result = await processNewEnrollment(enrollmentId);
      if (!result.success) {
        throw new AppError(
          result.error || "Failed to process enrollment",
          400,
          "ENROLLMENT_ERROR"
        );
      }

      res.json({
        success: true,
        emailSent: result.emailSent,
        message: result.emailSent
          ? "Welcome email sent successfully"
          : "Enrollment processed but email failed to send",
      });
    })
  );
}
