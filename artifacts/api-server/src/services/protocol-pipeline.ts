import { db } from '../db';
import { pipelineRuns, PipelineStageRecord } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { sentinel } from './sentinel';
import { sendToTrustee } from './openclaw';

const STAGE_ESTIMATES: Record<string, number> = {
  intake: 5,
  analysis: 45,
  assembly: 60,
  presentation: 30,
  delivery: 15,
};

export type PipelineOverallStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'completed_with_warnings'
  | 'failed'
  | 'skipped';

export type PipelineStageKey = 'intake' | 'analysis' | 'assembly' | 'presentation' | 'delivery';

const STAGE_ORDER: PipelineStageKey[] = ['intake', 'analysis', 'assembly', 'presentation', 'delivery'];
const FATAL_STAGES: PipelineStageKey[] = ['intake', 'analysis', 'assembly'];
const NON_FATAL_STAGES: PipelineStageKey[] = ['presentation', 'delivery'];

function makeInitialStages(): PipelineStageRecord[] {
  return STAGE_ORDER.map(stage => ({
    stage,
    status: 'pending' as const,
    estimatedSeconds: STAGE_ESTIMATES[stage],
  }));
}

export interface PipelineExecuteOpts {
  sourceType: 'transcript' | 'intake';
  transcript?: string;
  intakeFormId?: number;
  generateSlides: boolean;
  memberId?: string;
  doctorId?: string;
  initiatedBy?: string;
  username?: string;
  /** Resume from this stage (skip all prior completed stages). Used for retries. */
  resumeFromStage?: PipelineStageKey;
}

export class ProtocolPipelineService {
  /**
   * Create a new pipeline run record and return its ID.
   * The caller passes this ID to execute() — no duplicate run is created.
   */
  async createRun(opts: {
    intakeFormId?: number;
    memberId?: string;
    doctorId?: string;
    initiatedBy?: string;
    sourceType?: string;
    transcript?: string;
  }): Promise<string> {
    const [run] = await db.insert(pipelineRuns).values({
      intakeFormId: opts.intakeFormId ?? null,
      memberId: opts.memberId ?? null,
      doctorId: opts.doctorId ?? null,
      initiatedBy: opts.initiatedBy ?? null,
      currentStage: 'intake',
      overallStatus: 'pending',
      stages: makeInitialStages(),
    }).returning({ id: pipelineRuns.id });

    console.log(`[Pipeline] Run created: ${run.id}`);
    return run.id;
  }

  async updateStage(
    runId: string,
    stage: PipelineStageRecord['stage'],
    status: PipelineStageRecord['status'],
    extra: Partial<Pick<PipelineStageRecord, 'errorMessage' | 'outputUrl'>> = {}
  ): Promise<void> {
    const [current] = await db.select().from(pipelineRuns).where(eq(pipelineRuns.id, runId));
    if (!current) {
      console.error(`[Pipeline] Run not found: ${runId}`);
      return;
    }

    const now = new Date().toISOString();
    const stages: PipelineStageRecord[] = (current.stages as PipelineStageRecord[]) ?? makeInitialStages();
    const idx = stages.findIndex(s => s.stage === stage);
    if (idx >= 0) {
      stages[idx] = {
        ...stages[idx],
        status,
        ...(status === 'in_progress' ? { startedAt: now } : {}),
        ...(status === 'completed' || status === 'failed' ? { completedAt: now } : {}),
        ...extra,
      };
    }

    const isFatalFailure = status === 'failed' && FATAL_STAGES.includes(stage as PipelineStageKey);
    await db.update(pipelineRuns).set({
      stages,
      currentStage: stage,
      overallStatus: isFatalFailure ? 'failed' : 'in_progress',
      updatedAt: new Date(),
    }).where(eq(pipelineRuns.id, runId));

    console.log(`[Pipeline] ${runId} — ${stage}: ${status}`);
  }

  async markCompleted(runId: string, driveFileUrl?: string, driveFolderId?: string, hasWarnings = false): Promise<void> {
    const status: PipelineOverallStatus = hasWarnings ? 'completed_with_warnings' : 'completed';
    await db.update(pipelineRuns).set({
      overallStatus: status,
      completedAt: new Date(),
      updatedAt: new Date(),
      driveFileUrl: driveFileUrl ?? null,
      driveFolderId: driveFolderId ?? null,
    }).where(eq(pipelineRuns.id, runId));

    console.log(`[Pipeline] Run ${status}: ${runId}`);
  }

  async markFailed(runId: string, errorMessage: string): Promise<void> {
    await db.update(pipelineRuns).set({
      overallStatus: 'failed',
      errorMessage,
      updatedAt: new Date(),
    }).where(eq(pipelineRuns.id, runId));

    console.error(`[Pipeline] Run failed: ${runId} — ${errorMessage}`);
  }

  async linkProtocol(runId: string, protocolId: number): Promise<void> {
    await db.update(pipelineRuns).set({
      protocolId,
      updatedAt: new Date(),
    }).where(eq(pipelineRuns.id, runId));
  }

  async copyDriveLinks(runId: string, driveFileUrl?: string, driveFolderId?: string): Promise<void> {
    await db.update(pipelineRuns).set({
      ...(driveFileUrl !== undefined ? { driveFileUrl } : {}),
      ...(driveFolderId !== undefined ? { driveFolderId } : {}),
      updatedAt: new Date(),
    }).where(eq(pipelineRuns.id, runId));
  }

  async notifyTrustee(runId: string, patientName: string, slidesUrl?: string | null, driveUrl?: string | null): Promise<void> {
    const parts = [
      `Protocol pipeline completed for ${patientName} (run: ${runId}).`,
      slidesUrl ? `Slides: ${slidesUrl}` : null,
      driveUrl ? `Drive PDF: ${driveUrl}` : null,
      'Please review and approve this protocol in the Trustee portal.',
    ].filter(Boolean).join('\n');

    await sendToTrustee('PIPELINE', parts, 'high');
    await sentinel.notify({
      type: 'task_completed',
      title: `Protocol Ready for Review: ${patientName}`,
      message: parts,
      agentId: 'PIPELINE',
      division: 'science',
      priority: 1,
      outputUrl: slidesUrl ?? driveUrl ?? undefined,
    });

    await db.update(pipelineRuns).set({
      trusteeNotified: true,
      updatedAt: new Date(),
    }).where(eq(pipelineRuns.id, runId));

    console.log(`[Pipeline] Trustee notified for run: ${runId}`);
  }

  async getRunStatus(runId: string) {
    const [run] = await db.select().from(pipelineRuns).where(eq(pipelineRuns.id, runId));
    return run ?? null;
  }

  async listRuns(doctorId?: string, limit = 20) {
    if (doctorId) {
      return db.select().from(pipelineRuns)
        .where(eq(pipelineRuns.doctorId, doctorId))
        .orderBy(pipelineRuns.startedAt)
        .limit(limit);
    }
    return db.select().from(pipelineRuns)
      .orderBy(pipelineRuns.startedAt)
      .limit(limit);
  }

  /**
   * Execute the pipeline for an existing run (identified by runId).
   * The run must already exist in the database (created via createRun).
   * Pass resumeFromStage to skip already-completed stages (for retries).
   *
   * Completion semantics:
   * - Fatal stages (intake, analysis, assembly): failure aborts the run with overallStatus=failed
   * - Non-fatal stages (presentation, delivery): failure marks the run completed_with_warnings
   *   so the protocol is still accessible, but the doctor knows something needs attention.
   */
  async execute(
    runId: string,
    opts: PipelineExecuteOpts
  ): Promise<{ runId: string; protocolId: number; slides: { presentationId: string; webViewLink: string } | null }> {
    const resumeIdx = opts.resumeFromStage
      ? STAGE_ORDER.indexOf(opts.resumeFromStage)
      : 0;

    try {
      const {
        analyzeTranscript,
        generateProtocol,
        generateProtocolSlides,
        profileFromIntakeForm,
        saveProtocol,
        updateProtocolSlides,
        validateProtocolWithAgents,
        generateProtocolPDFBuffer,
      } = await import('./protocol-assembly');

      const { uploadProtocolToDrive, uploadProtocolToFolder, findAllioFolder, findFolderByName, createSubfolder } = await import('./drive');

      // ── Stage 1: intake ──────────────────────────────────────────────────────
      let profile;
      if (resumeIdx <= 0) {
        await this.updateStage(runId, 'intake', 'in_progress');
        try {
          if (opts.sourceType === 'transcript') {
            if (!opts.transcript) throw new Error('transcript is required');
            profile = await analyzeTranscript(opts.transcript);
          } else {
            if (!opts.intakeFormId) throw new Error('intakeFormId is required');
            const { intakeForms } = await import('@shared/schema');
            const [intakeRecord] = await db.select().from(intakeForms)
              .where(eq(intakeForms.id, opts.intakeFormId));
            if (!intakeRecord) throw new Error('Intake form not found');
            const formData = (intakeRecord.formData || {}) as Record<string, any>;
            const patientInfo = {
              name: intakeRecord.patientName || formData.basicInfo?.name || 'Unknown',
              email: intakeRecord.patientEmail || formData.basicInfo?.email || '',
              phone: formData.basicInfo?.phone || '',
              age: formData.basicInfo?.age || null,
              dob: formData.basicInfo?.dateOfBirth || null,
            };
            profile = await profileFromIntakeForm(formData, patientInfo);
            profile.intakeFormId = opts.intakeFormId;
          }
          await this.updateStage(runId, 'intake', 'completed');
        } catch (err: any) {
          await this.updateStage(runId, 'intake', 'failed', { errorMessage: err.message });
          await this.markFailed(runId, `Intake stage failed: ${err.message}`);
          throw err;
        }
      } else {
        // Resumed past intake — re-derive profile from intake form (required for subsequent stages)
        if (!opts.intakeFormId) throw new Error('intakeFormId is required to resume pipeline');
        const { intakeForms } = await import('@shared/schema');
        const [intakeRecord] = await db.select().from(intakeForms)
          .where(eq(intakeForms.id, opts.intakeFormId));
        if (!intakeRecord) throw new Error('Intake form not found for resume');
        const formData = (intakeRecord.formData || {}) as Record<string, any>;
        const patientInfo = {
          name: intakeRecord.patientName || formData.basicInfo?.name || 'Unknown',
          email: intakeRecord.patientEmail || formData.basicInfo?.email || '',
          phone: formData.basicInfo?.phone || '',
          age: formData.basicInfo?.age || null,
          dob: formData.basicInfo?.dateOfBirth || null,
        };
        profile = await profileFromIntakeForm(formData, patientInfo);
        profile.intakeFormId = opts.intakeFormId;
      }

      // ── Stage 2: analysis ────────────────────────────────────────────────────
      let protocol;
      let qaStatus: 'draft' | 'needs_review' = 'draft';
      if (resumeIdx <= 1) {
        await this.updateStage(runId, 'analysis', 'in_progress');
        try {
          protocol = await generateProtocol(profile);
          try {
            const validation = await validateProtocolWithAgents(protocol, profile);
            if (!validation.valid) qaStatus = 'needs_review';
          } catch {
            qaStatus = 'needs_review';
          }
          await this.updateStage(runId, 'analysis', 'completed');
        } catch (err: any) {
          await this.updateStage(runId, 'analysis', 'failed', { errorMessage: err.message });
          await this.markFailed(runId, `Analysis stage failed: ${err.message}`);
          throw err;
        }
      } else {
        // Re-generate protocol even when resuming from assembly/later stages
        protocol = await generateProtocol(profile);
      }

      // ── Stage 3: assembly ────────────────────────────────────────────────────
      let protocolId: number;
      const currentRun = await this.getRunStatus(runId);
      if (resumeIdx <= 2) {
        await this.updateStage(runId, 'assembly', 'in_progress');
        try {
          protocolId = await saveProtocol(
            profile,
            protocol,
            opts.sourceType === 'transcript' ? 'transcript' : 'intake_form',
            opts.username,
            opts.memberId,
            opts.doctorId,
            qaStatus,
          );
          await this.linkProtocol(runId, protocolId);
          await this.updateStage(runId, 'assembly', 'completed');
        } catch (err: any) {
          await this.updateStage(runId, 'assembly', 'failed', { errorMessage: err.message });
          await this.markFailed(runId, `Assembly stage failed: ${err.message}`);
          throw err;
        }
      } else {
        // Resumed past assembly — use the already-linked protocol
        if (!currentRun?.protocolId) throw new Error('Protocol ID not found in resumed run');
        protocolId = currentRun.protocolId;
      }

      // ── Stage 4: presentation ────────────────────────────────────────────────
      // Non-fatal: failure sets completed_with_warnings, not failed
      let slides: { presentationId: string; webViewLink: string } | null = null;
      let driveFileUrl: string | undefined;
      let driveFolderId: string | undefined;
      let presentationWarning = false;
      if (resumeIdx <= 3) {
        await this.updateStage(runId, 'presentation', 'in_progress');
        try {
          if (opts.generateSlides) {
            slides = await generateProtocolSlides(protocol, profile);
            await updateProtocolSlides(protocolId, slides.presentationId, slides.webViewLink);
          }

          // Upload PDF to member-specific Drive folder
          const pdfBuffer = await generateProtocolPDFBuffer(protocol, profile);
          const safePatientName = profile.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
          const fileName = `${safePatientName}_Protocol_${new Date().toISOString().slice(0, 10)}.pdf`;

          // Resolve member-specific folder under ALLIO/Member Content/Patient Protocols/{Name}
          let memberFolderId: string | null = null;
          try {
            const allioFolder = await findAllioFolder();
            if (allioFolder) {
              const memberContentId = await findFolderByName(allioFolder.id, 'Member Content');
              if (memberContentId) {
                let protocolsFolderId = await findFolderByName(memberContentId, 'Patient Protocols');
                if (!protocolsFolderId) {
                  const newProtFolder = await createSubfolder(memberContentId, 'Patient Protocols');
                  protocolsFolderId = newProtFolder.id;
                }
                const existingMemberFolder = await findFolderByName(protocolsFolderId, safePatientName);
                if (existingMemberFolder) {
                  memberFolderId = existingMemberFolder;
                } else {
                  const newMemberFolder = await createSubfolder(protocolsFolderId, safePatientName);
                  memberFolderId = newMemberFolder.id;
                }
                driveFolderId = memberFolderId;
              }
            }
          } catch (folderErr: any) {
            console.warn(`[Pipeline] Could not resolve member Drive folder, using generic: ${folderErr.message}`);
          }

          // Upload to member-specific folder or fall back to generic
          const driveResult = memberFolderId
            ? await uploadProtocolToFolder(pdfBuffer, fileName, memberFolderId, 'application/pdf')
            : await uploadProtocolToDrive(pdfBuffer, fileName, 'application/pdf');

          if (driveResult?.success && driveResult.webViewLink) {
            driveFileUrl = driveResult.webViewLink;
            await this.updateStage(runId, 'presentation', 'completed', {
              outputUrl: slides?.webViewLink ?? driveFileUrl,
            });
          } else {
            // Upload failed — non-fatal but warn
            const uploadErr = driveResult?.error || 'Drive upload returned no link';
            console.warn(`[Pipeline] Drive upload failed (non-fatal): ${uploadErr}`);
            presentationWarning = true;
            await this.updateStage(runId, 'presentation', 'failed', {
              errorMessage: uploadErr,
              outputUrl: slides?.webViewLink ?? undefined,
            });
          }
        } catch (err: any) {
          console.warn(`[Pipeline] Presentation stage error (non-fatal): ${err.message}`);
          presentationWarning = true;
          await this.updateStage(runId, 'presentation', 'failed', { errorMessage: err.message });
        }
      } else {
        // Resumed past presentation — carry forward known drive URL
        driveFileUrl = currentRun?.driveFileUrl ?? undefined;
        driveFolderId = currentRun?.driveFolderId ?? undefined;
      }

      // ── Stage 5: delivery ────────────────────────────────────────────────────
      // Non-fatal: failure sets completed_with_warnings
      let deliveryWarning = false;
      if (resumeIdx <= 4) {
        await this.updateStage(runId, 'delivery', 'in_progress');
        try {
          await this.notifyTrustee(runId, profile.name, slides?.webViewLink, driveFileUrl);
          await this.updateStage(runId, 'delivery', 'completed');
        } catch (err: any) {
          console.warn(`[Pipeline] Delivery stage error (non-fatal): ${err.message}`);
          deliveryWarning = true;
          await this.updateStage(runId, 'delivery', 'failed', { errorMessage: err.message });
        }
      }

      const hasWarnings = presentationWarning || deliveryWarning;
      await this.markCompleted(runId, driveFileUrl, driveFolderId, hasWarnings);

      return { runId, protocolId: protocolId!, slides };
    } catch (err: any) {
      const current = await this.getRunStatus(runId);
      if (current && current.overallStatus !== 'failed') {
        await this.markFailed(runId, err.message);
      }
      throw err;
    }
  }
}

export const protocolPipeline = new ProtocolPipelineService();
