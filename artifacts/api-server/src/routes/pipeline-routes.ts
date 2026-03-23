import type { Express, Request, Response } from "express";
import { requireAuth, requireRole } from "../working-auth";
import { asyncHandler, AppError } from "../middleware/error-handler";
import { protocolPipeline } from "../services/protocol-pipeline";
import { db } from "../db";
import { pipelineRuns } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

interface AuthenticatedUser {
  id: string;
  wpRoles?: string[];
  email?: string;
  firstName?: string;
  role?: string;
  name?: string;
  lastName?: string;
  wpUserId?: string;
  username?: string;
}

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

const DOCTOR_ROLE_NAMES = [
  "doctor", "physician", "ff_doctor", "ff_healer", "healer",
  "practitioner", "um_doctor", "um_healer", "um_practitioner",
  "wellness_practitioner", "healthcare_provider",
];
const ADMIN_ROLE_NAMES = ["administrator", "shop_manager"];

function isDoctorOnly(req: AuthenticatedRequest): boolean {
  const wpRoles: string[] = req.user?.wpRoles || [];
  const isDoctor = wpRoles.some(r => DOCTOR_ROLE_NAMES.includes(r));
  const isAdmin = wpRoles.some(r => ADMIN_ROLE_NAMES.includes(r));
  return isDoctor && !isAdmin;
}

export function registerPipelineRoutes(app: Express): void {
  /**
   * POST /api/pipeline/generate
   * Trigger the full end-to-end protocol generation pipeline.
   * Body: { sourceType: 'transcript'|'intake', transcript?, intakeFormId?, generateSlides?, memberId? }
   *
   * Responds immediately with the runId. Execution happens asynchronously.
   * Poll GET /api/pipeline/:runId for progress updates.
   */
  app.post(
    "/api/pipeline/generate",
    requireAuth,
    requireRole("admin", "trustee", "doctor"),
    asyncHandler(async (req: Request, res: Response) => {
      const authedReq = req as AuthenticatedRequest;
      const {
        sourceType = "transcript",
        transcript,
        intakeFormId,
        generateSlides = true,
        memberId,
      } = req.body;

      if (sourceType === "transcript") {
        if (!transcript || typeof transcript !== "string") {
          throw new AppError("transcript is required", 400, "VALIDATION_ERROR");
        }
        if (transcript.length > 500_000) {
          throw new AppError("Transcript exceeds maximum length of 500,000 characters", 400, "VALIDATION_ERROR");
        }
      } else if (sourceType === "intake") {
        if (!intakeFormId || isNaN(Number(intakeFormId))) {
          throw new AppError("intakeFormId is required for intake source", 400, "VALIDATION_ERROR");
        }
      } else {
        throw new AppError("sourceType must be 'transcript' or 'intake'", 400, "VALIDATION_ERROR");
      }

      const doctorId = isDoctorOnly(authedReq) ? authedReq.user?.id : undefined;
      const username = authedReq.user?.username || authedReq.user?.firstName;

      // Create the run record first — this is the single canonical run.
      const runId = await protocolPipeline.createRun({
        intakeFormId: intakeFormId ? Number(intakeFormId) : undefined,
        memberId: memberId || undefined,
        doctorId: doctorId || undefined,
        initiatedBy: username || undefined,
        sourceType: sourceType,
      });

      // Respond immediately so the client can start polling.
      res.json({ runId, status: "started", message: "Pipeline started. Poll /api/pipeline/:runId for status." });

      // Execute the pipeline asynchronously, passing the same runId.
      protocolPipeline.execute(runId, {
        sourceType: sourceType as "transcript" | "intake",
        transcript,
        intakeFormId: intakeFormId ? Number(intakeFormId) : undefined,
        generateSlides: Boolean(generateSlides),
        memberId: memberId || undefined,
        doctorId: doctorId || undefined,
        initiatedBy: username || undefined,
        username: username || undefined,
      }).then(result => {
        console.log(`[Pipeline Route] Run ${runId} completed — protocolId: ${result.protocolId}`);
      }).catch(err => {
        console.error(`[Pipeline Route] Run ${runId} failed:`, err.message);
      });
    })
  );

  /**
   * GET /api/pipeline/:runId
   * Get the status of a specific pipeline run.
   * Doctors can only see their own runs (or runs with no doctorId if they initiated it).
   */
  app.get(
    "/api/pipeline/:runId",
    requireAuth,
    requireRole("admin", "trustee", "doctor"),
    asyncHandler(async (req: Request, res: Response) => {
      const { runId } = req.params;
      const run = await protocolPipeline.getRunStatus(runId);
      if (!run) {
        throw new AppError("Pipeline run not found", 404, "NOT_FOUND");
      }

      const authedReq = req as AuthenticatedRequest;
      if (isDoctorOnly(authedReq)) {
        const userId = authedReq.user?.id;
        // If run has a doctorId it must match; if it has no doctorId, deny access for safety.
        if (!userId || run.doctorId !== userId) {
          throw new AppError("Forbidden", 403, "FORBIDDEN");
        }
      }

      res.json(run);
    })
  );

  /**
   * GET /api/pipeline
   * List recent pipeline runs (filtered by doctor if applicable).
   */
  app.get(
    "/api/pipeline",
    requireAuth,
    requireRole("admin", "trustee", "doctor"),
    asyncHandler(async (req: Request, res: Response) => {
      const authedReq = req as AuthenticatedRequest;
      const limit = Math.min(Number(req.query.limit) || 20, 100);

      if (isDoctorOnly(authedReq)) {
        const userId = authedReq.user?.id;
        if (!userId) throw new AppError("User identity required", 403, "FORBIDDEN");
        const runs = await db.select().from(pipelineRuns)
          .where(eq(pipelineRuns.doctorId, userId))
          .orderBy(desc(pipelineRuns.startedAt))
          .limit(limit);
        res.json(runs);
        return;
      }

      const runs = await db.select().from(pipelineRuns)
        .orderBy(desc(pipelineRuns.startedAt))
        .limit(limit);
      res.json(runs);
    })
  );

  /**
   * POST /api/pipeline/:runId/retry
   * Retry a failed pipeline run.
   *
   * For intake-based runs: resumes from the first failed stage (stage-resume semantics).
   *   A new run record is created that starts from the failed stage, carrying forward
   *   any artifacts already produced in prior completed stages.
   *
   * For transcript-based runs: transcripts are not persisted, so a full re-run is not
   *   possible automatically. The client must re-submit the transcript via /generate.
   *   Returns 400 RETRY_NOT_SUPPORTED with a clear explanation.
   */
  app.post(
    "/api/pipeline/:runId/retry",
    requireAuth,
    requireRole("admin", "trustee", "doctor"),
    asyncHandler(async (req: Request, res: Response) => {
      const { runId } = req.params;
      const run = await protocolPipeline.getRunStatus(runId);
      if (!run) throw new AppError("Pipeline run not found", 404, "NOT_FOUND");
      const stages = (run.stages || []) as Array<{ stage: string; status: string }>;
      const hasFailedStage = stages.some(s => s.status === "failed");
      const isRetryable =
        run.overallStatus === "failed" ||
        (run.overallStatus === "completed_with_warnings" && hasFailedStage);

      if (!isRetryable) {
        throw new AppError(
          "Only failed or completed-with-warnings pipeline runs (with failed stages) can be retried",
          400,
          "VALIDATION_ERROR"
        );
      }

      const authedReq = req as AuthenticatedRequest;
      if (isDoctorOnly(authedReq)) {
        const userId = authedReq.user?.id;
        if (!userId || run.doctorId !== userId) {
          throw new AppError("Forbidden", 403, "FORBIDDEN");
        }
      }

      if (!run.intakeFormId) {
        throw new AppError(
          "Transcript-based runs cannot be automatically retried because the transcript is not persisted. " +
          "Please re-submit the transcript using the Generate Protocol form.",
          400,
          "RETRY_NOT_SUPPORTED"
        );
      }

      const { generateSlides = true } = req.body;

      // Identify the first failed stage to resume from.
      type StageKey = "intake" | "analysis" | "assembly" | "presentation" | "delivery";
      const typedStages = stages as Array<{ stage: StageKey; status: string }>;
      const firstFailed = typedStages.find(s => s.status === "failed");
      const resumeFromStage: StageKey = firstFailed?.stage ?? "intake";

      // Create a new run record for the retry, so the original is preserved.
      const newRunId = await protocolPipeline.createRun({
        intakeFormId: run.intakeFormId,
        memberId: run.memberId ?? undefined,
        doctorId: run.doctorId ?? undefined,
        initiatedBy: run.initiatedBy ?? undefined,
        sourceType: "intake",
      });

      // If resuming past the assembly stage, carry forward the already-assembled protocolId
      // so execute() can reference it without re-assembling from scratch.
      const STAGES_AFTER_ASSEMBLY = ["presentation", "delivery"];
      if (STAGES_AFTER_ASSEMBLY.includes(resumeFromStage) && run.protocolId) {
        await protocolPipeline.linkProtocol(newRunId, run.protocolId);
      }

      // If resuming at delivery, carry forward the Drive file/folder URLs too.
      if (resumeFromStage === "delivery" && (run.driveFileUrl || run.driveFolderId)) {
        await protocolPipeline.copyDriveLinks(newRunId, run.driveFileUrl ?? undefined, run.driveFolderId ?? undefined);
      }

      res.json({
        runId: newRunId,
        status: "started",
        retryOf: runId,
        resumingFromStage: resumeFromStage,
      });

      // Execute with the new runId, resuming from the failed stage.
      protocolPipeline.execute(newRunId, {
        sourceType: "intake",
        intakeFormId: run.intakeFormId,
        generateSlides: Boolean(generateSlides),
        memberId: run.memberId ?? undefined,
        doctorId: run.doctorId ?? undefined,
        initiatedBy: run.initiatedBy ?? undefined,
        username: run.initiatedBy ?? undefined,
        resumeFromStage,
      }).catch(err => {
        console.error(`[Pipeline Route] Retry run ${newRunId} (from ${resumeFromStage}) failed:`, err.message);
      });
    })
  );
}
