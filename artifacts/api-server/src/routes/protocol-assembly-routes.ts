import type { Express, Request, Response } from "express";
import { requireAuth, requireRole } from "../working-auth";
import { db } from "../db";
import { eq, desc, and, inArray } from "drizzle-orm";
import { asyncHandler, AppError } from "../middleware/error-handler";
import { intakeForms, generatedProtocols, memberProfiles, protocolReviewAuditLog } from "@shared/schema";
import type { HealingProtocol, PatientProfile } from "@shared/types/protocol-assembly";
import { notificationService } from "../services/notification-service";

interface AuthenticatedUser {
  id: string;
  wpRoles?: string[];
  email?: string;
  firstName?: string;
  role?: string;
  name?: string;
  lastName?: string;
  wpUserId?: string;
}

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export async function registerProtocolAssemblyRoutes(app: Express): Promise<void> {
  const {
    analyzeTranscript,
    generateProtocol,
    generateProtocolSlides,
    profileFromIntakeForm,
    saveProtocol,
    updateProtocolSlides,
    getProtocol,
    listProtocols,
    fetchProtocolCitations,
    generateProtocolPDFBuffer,
    generateDailySchedulePDFBuffer,
    generatePeptideSchedulePDFBuffer,
    runProtocolQA,
    validateProtocolWithAgents,
  } = await import('../services/protocol-assembly');

  const DOCTOR_ROLE_NAMES = ['doctor', 'physician', 'ff_doctor', 'ff_healer', 'healer', 'practitioner', 'um_doctor', 'um_healer', 'um_practitioner', 'wellness_practitioner', 'healthcare_provider'];
  const ADMIN_ROLE_NAMES = ['administrator', 'shop_manager'];

  function isDoctorOnly(req: AuthenticatedRequest): boolean {
    const wpRoles: string[] = req.user?.wpRoles || [];
    const isDoctor = wpRoles.some((r: string) => DOCTOR_ROLE_NAMES.includes(r));
    const isAdmin = wpRoles.some((r: string) => ADMIN_ROLE_NAMES.includes(r));
    return isDoctor && !isAdmin;
  }

  function getUserId(req: AuthenticatedRequest): string | undefined {
    return req.user?.id;
  }

  function enforceDoctorOwnership(req: AuthenticatedRequest, record: { doctorId?: string | null }): void {
    if (isDoctorOnly(req)) {
      const userId = getUserId(req);
      if (!userId || record.doctorId !== userId) {
        throw new AppError('Forbidden: protocol not assigned to you', 403, 'FORBIDDEN');
      }
    }
  }

  app.post('/api/protocol-assembly/generate', requireAuth, requireRole('admin', 'trustee', 'doctor'), async (req: Request, res: Response) => {
    try {
      const { transcript, generateSlides: shouldGenerateSlides, memberId } = req.body;
      if (!transcript || typeof transcript !== 'string') {
        return res.status(400).json({ error: 'transcript is required' });
      }
      if (transcript.length > 500000) {
        return res.status(400).json({ error: 'Transcript exceeds maximum length of 500,000 characters' });
      }

      let enrichedTranscript = transcript;
      if (memberId) {
        try {
          const { storage: dbStorage } = await import('../storage');
          const { buildBloodworkProtocolContext } = await import('../services/bloodwork-ai-analyzer');
          let uploads;
          if (isDoctorOnly(req as AuthenticatedRequest)) {
            const doctorId = getUserId(req as AuthenticatedRequest);
            const doctorUploads = doctorId ? await dbStorage.getBloodworkUploadsByDoctor(doctorId) : [];
            uploads = doctorUploads.filter((u) => u.memberId === memberId);
          } else {
            uploads = await dbStorage.getBloodworkUploads(memberId);
          }
          const completedUploads = uploads.filter((u) => u.status === 'completed');
          if (completedUploads.length > 0) {
            const bloodworkContext = buildBloodworkProtocolContext(completedUploads);
            enrichedTranscript = `${transcript}\n\n${bloodworkContext}`;
            console.log(`[Protocol Assembly] Injected bloodwork context for member ${memberId}: ${completedUploads.length} lab reports`);
          }
        } catch (ctxErr: unknown) {
          const msg = ctxErr instanceof Error ? ctxErr.message : String(ctxErr);
          console.warn('[Protocol Assembly] Failed to inject bloodwork context:', msg);
        }
      }

      const profile = await analyzeTranscript(enrichedTranscript);
      const protocol = await generateProtocol(profile);

      let agentValidation: { valid: boolean; issues: string[]; suggestions: string[]; catalogMatchRate: number } | null = null;
      let qaStatus: "draft" | "needs_review" = "draft";
      try {
        agentValidation = await validateProtocolWithAgents(protocol, profile);
        if (!agentValidation.valid) {
          qaStatus = "needs_review";
          console.warn(`[Protocol Assembly] Agent QA BLOCKED — ${agentValidation.issues.length} issues, setting status to needs_review:`);
          agentValidation.issues.forEach(issue => console.warn(`  - ${issue}`));
        } else {
          console.log(`[Protocol Assembly] Agent QA PASSED — catalog match: ${agentValidation.catalogMatchRate}%`);
        }
      } catch (qaErr) {
        qaStatus = "needs_review";
        console.warn('[Protocol Assembly] Agent QA validation failed, flagging for review:', qaErr);
      }

      const creatorId = getUserId(req);
      const creatorDoctorId = isDoctorOnly(req) ? creatorId : undefined;
      const protocolId = await saveProtocol(profile, protocol, 'transcript', (req.user as { username?: string })?.username, memberId as string | undefined, creatorDoctorId, qaStatus);
      let slides = null;
      if (shouldGenerateSlides) {
        try {
          slides = await generateProtocolSlides(protocol, profile);
          await updateProtocolSlides(protocolId, slides.presentationId, slides.webViewLink);
        } catch (slideError) {
          console.error('[Protocol Assembly] Slide generation failed:', (slideError as Error).message);
        }
      }
      if (memberId) {
        const memberRecord = await db.select({ userId: memberProfiles.userId }).from(memberProfiles).where(eq(memberProfiles.id, memberId as string)).limit(1);
        if (memberRecord[0]) {
          notificationService.createForUser(memberRecord[0].userId, 'protocol_update', 'Your Protocol Is Ready', `Your personalized wellness protocol has been prepared and is ready for review.`, { protocolId }).catch(() => {});
        }
      }
      if (creatorDoctorId) {
        notificationService.createForUser(creatorDoctorId, 'protocol_update', 'Protocol Generated', `Protocol for ${profile.name || 'member'} has been generated successfully.`, { protocolId }).catch(() => {});
      }
      res.json({ id: protocolId, profile, protocol, slides, agentValidation, qaStatus });
    } catch (error) {
      console.error('[Protocol Assembly] Generate error:', error);
      res.status(500).json({ error: 'Failed to generate protocol. Please try again.' });
    }
  });

  app.post('/api/protocol-assembly/generate-from-intake/:id', requireAuth, requireRole('admin', 'trustee', 'doctor'), async (req: Request, res: Response) => {
    try {
      const intakeId = parseInt(req.params.id);
      if (isNaN(intakeId)) return res.status(400).json({ error: 'Invalid intake form ID' });
      const schemaModule = await import('@shared/schema');
      const [intakeRecord] = await db.select().from(schemaModule.intakeForms).where(eq(schemaModule.intakeForms.id, intakeId));
      if (!intakeRecord) return res.status(404).json({ error: 'Intake form not found' });
      const formData = (intakeRecord.formData || {}) as Record<string, any>;
      const patientInfo = {
        name: intakeRecord.patientName || formData.basicInfo?.name || 'Unknown',
        email: intakeRecord.patientEmail || formData.basicInfo?.email || '',
        phone: formData.basicInfo?.phone || '',
        age: formData.basicInfo?.age || null,
        dob: formData.basicInfo?.dateOfBirth || null,
      };
      const profile = await profileFromIntakeForm(formData, patientInfo);
      profile.intakeFormId = intakeId;
      const protocol = await generateProtocol(profile);

      let agentValidation: { valid: boolean; issues: string[]; suggestions: string[]; catalogMatchRate: number } | null = null;
      let qaStatus: "draft" | "needs_review" = "draft";
      try {
        agentValidation = await validateProtocolWithAgents(protocol, profile);
        if (!agentValidation.valid) {
          qaStatus = "needs_review";
          console.warn(`[Protocol Assembly] Agent QA BLOCKED — ${agentValidation.issues.length} issues, setting status to needs_review:`);
          agentValidation.issues.forEach(issue => console.warn(`  - ${issue}`));
        } else {
          console.log(`[Protocol Assembly] Agent QA PASSED — catalog match: ${agentValidation.catalogMatchRate}%`);
        }
      } catch (qaErr) {
        qaStatus = "needs_review";
        console.warn('[Protocol Assembly] Agent QA validation failed, flagging for review:', qaErr);
      }

      const creatorId2 = getUserId(req);
      const creatorDoctorId2 = isDoctorOnly(req) ? creatorId2 : undefined;
      const protocolId = await saveProtocol(profile, protocol, 'intake_form', (req.user as { username?: string })?.username, req.body?.memberId as string | undefined, creatorDoctorId2, qaStatus);
      const { generateSlides: shouldGenerateSlides } = req.body || {};
      let slides = null;
      if (shouldGenerateSlides) {
        try {
          slides = await generateProtocolSlides(protocol, profile);
          await updateProtocolSlides(protocolId, slides.presentationId, slides.webViewLink);
        } catch (slideError) {
          console.error('[Protocol Assembly] Slide generation failed:', (slideError as Error).message);
        }
      }
      res.json({ id: protocolId, profile, protocol, slides, agentValidation, qaStatus });
    } catch (error) {
      console.error('[Protocol Assembly] Generate from intake error:', error);
      res.status(500).json({ error: 'Failed to generate protocol from intake. Please try again.' });
    }
  });

  app.get('/api/protocol-assembly/intake-forms', requireAuth, requireRole('admin', 'trustee', 'doctor'), async (_req: Request, res: Response) => {
    try {
      const forms = await db.select({
        id: intakeForms.id,
        patientName: intakeForms.patientName,
        patientEmail: intakeForms.patientEmail,
        status: intakeForms.status,
        createdAt: intakeForms.createdAt,
        submittedAt: intakeForms.submittedAt,
      }).from(intakeForms).orderBy(desc(intakeForms.createdAt)).limit(100);
      res.json(forms);
    } catch (error: unknown) {
      console.error('[Protocol Assembly] List intake forms error:', error);
      res.status(500).json({ error: 'Failed to list intake forms' });
    }
  });

  app.get('/api/protocol-assembly/protocols', requireAuth, requireRole('admin', 'trustee', 'doctor'), asyncHandler(async (req, res) => {
    if (isDoctorOnly(req)) {
      const userId = getUserId(req);
      if (!userId) {
        throw new AppError('User identity required', 403, 'FORBIDDEN');
      }
      const doctorProtocols = await db.select({
        id: generatedProtocols.id,
        patientName: generatedProtocols.patientName,
        patientAge: generatedProtocols.patientAge,
        sourceType: generatedProtocols.sourceType,
        memberId: generatedProtocols.memberId,
        doctorId: generatedProtocols.doctorId,
        status: generatedProtocols.status,
        slidesWebViewLink: generatedProtocols.slidesWebViewLink,
        pdfDriveFileId: generatedProtocols.pdfDriveFileId,
        pdfDriveWebViewLink: generatedProtocols.pdfDriveWebViewLink,
        dailySchedulePdfFileId: generatedProtocols.dailySchedulePdfFileId,
        dailySchedulePdfWebViewLink: generatedProtocols.dailySchedulePdfWebViewLink,
        peptideSchedulePdfFileId: generatedProtocols.peptideSchedulePdfFileId,
        peptideSchedulePdfWebViewLink: generatedProtocols.peptideSchedulePdfWebViewLink,
        generatedBy: generatedProtocols.generatedBy,
        reviewedBy: generatedProtocols.reviewedBy,
        reviewedAt: generatedProtocols.reviewedAt,
        reviewNotes: generatedProtocols.reviewNotes,
        createdAt: generatedProtocols.createdAt,
        updatedAt: generatedProtocols.updatedAt,
      }).from(generatedProtocols)
        .where(eq(generatedProtocols.doctorId, userId))
        .orderBy(desc(generatedProtocols.createdAt))
        .limit(50);
      res.json(doctorProtocols);
      return;
    }
    const protocols = await listProtocols();
    res.json(protocols);
  }));

  app.get('/api/protocol-assembly/protocols/member/:memberId', requireAuth, requireRole('admin', 'trustee', 'doctor'), asyncHandler(async (req, res) => {
    const { memberId } = req.params;
    if (!memberId) throw new AppError('memberId is required', 400, 'VALIDATION_ERROR');

    const whereConditions = [eq(generatedProtocols.memberId, memberId)];
    if (isDoctorOnly(req)) {
      const userId = getUserId(req);
      if (!userId) throw new AppError('User identity required', 403, 'FORBIDDEN');
      whereConditions.push(eq(generatedProtocols.doctorId, userId));
    }

    const memberProtocols = await db.select({
      id: generatedProtocols.id,
      patientName: generatedProtocols.patientName,
      patientAge: generatedProtocols.patientAge,
      sourceType: generatedProtocols.sourceType,
      status: generatedProtocols.status,
      slidesWebViewLink: generatedProtocols.slidesWebViewLink,
      generatedBy: generatedProtocols.generatedBy,
      createdAt: generatedProtocols.createdAt,
      updatedAt: generatedProtocols.updatedAt,
    }).from(generatedProtocols).where(and(...whereConditions)).orderBy(desc(generatedProtocols.createdAt));
    res.json(memberProtocols);
  }));

  app.get('/api/protocol-assembly/protocols/approved', requireAuth, requireRole('admin', 'trustee', 'doctor'), asyncHandler(async (req, res) => {
    const selectFields = {
      id: generatedProtocols.id,
      patientName: generatedProtocols.patientName,
      patientAge: generatedProtocols.patientAge,
      sourceType: generatedProtocols.sourceType,
      memberId: generatedProtocols.memberId,
      status: generatedProtocols.status,
      slidesWebViewLink: generatedProtocols.slidesWebViewLink,
      pdfDriveFileId: generatedProtocols.pdfDriveFileId,
      pdfDriveWebViewLink: generatedProtocols.pdfDriveWebViewLink,
      dailySchedulePdfWebViewLink: generatedProtocols.dailySchedulePdfWebViewLink,
      peptideSchedulePdfWebViewLink: generatedProtocols.peptideSchedulePdfWebViewLink,
      generatedBy: generatedProtocols.generatedBy,
      reviewedBy: generatedProtocols.reviewedBy,
      reviewNotes: generatedProtocols.reviewNotes,
      createdAt: generatedProtocols.createdAt,
    };

    let approved;
    if (isDoctorOnly(req)) {
      const userId = getUserId(req);
      if (!userId) {
        throw new AppError('User identity required', 403, 'FORBIDDEN');
      }
      approved = await db.select(selectFields).from(generatedProtocols)
        .where(and(eq(generatedProtocols.status, 'approved'), eq(generatedProtocols.doctorId, userId)))
        .orderBy(desc(generatedProtocols.createdAt));
    } else {
      approved = await db.select(selectFields).from(generatedProtocols)
        .where(eq(generatedProtocols.status, 'approved'))
        .orderBy(desc(generatedProtocols.createdAt));
    }
    res.json(approved);
  }));

  app.get('/api/protocol-assembly/protocols/queue/pending', requireAuth, requireRole('admin', 'trustee'), asyncHandler(async (_req, res) => {
    const pending = await db.select({
      id: generatedProtocols.id,
      patientName: generatedProtocols.patientName,
      patientAge: generatedProtocols.patientAge,
      sourceType: generatedProtocols.sourceType,
      memberId: generatedProtocols.memberId,
      doctorId: generatedProtocols.doctorId,
      status: generatedProtocols.status,
      doctorReviewStatus: generatedProtocols.doctorReviewStatus,
      doctorReviewedBy: generatedProtocols.doctorReviewedBy,
      doctorReviewedAt: generatedProtocols.doctorReviewedAt,
      doctorReviewNotes: generatedProtocols.doctorReviewNotes,
      slidesWebViewLink: generatedProtocols.slidesWebViewLink,
      pdfDriveFileId: generatedProtocols.pdfDriveFileId,
      pdfDriveWebViewLink: generatedProtocols.pdfDriveWebViewLink,
      dailySchedulePdfWebViewLink: generatedProtocols.dailySchedulePdfWebViewLink,
      peptideSchedulePdfWebViewLink: generatedProtocols.peptideSchedulePdfWebViewLink,
      generatedBy: generatedProtocols.generatedBy,
      reviewedBy: generatedProtocols.reviewedBy,
      reviewedAt: generatedProtocols.reviewedAt,
      reviewNotes: generatedProtocols.reviewNotes,
      createdAt: generatedProtocols.createdAt,
      updatedAt: generatedProtocols.updatedAt,
    }).from(generatedProtocols)
      .where(inArray(generatedProtocols.status, ['needs_review', 'doctor_approved']))
      .orderBy(desc(generatedProtocols.createdAt));
    res.json(pending);
  }));

  app.get('/api/protocol-assembly/protocols/doctor/:doctorId', requireAuth, requireRole('admin', 'trustee', 'doctor'), asyncHandler(async (req, res) => {
    const { doctorId } = req.params;

    if (isDoctorOnly(req)) {
      const userId = getUserId(req);
      if (!userId || userId !== doctorId) {
        throw new AppError('Forbidden: cannot access another doctor\'s protocols', 403, 'FORBIDDEN');
      }
    }

    const protocols = await db.select({
      id: generatedProtocols.id,
      patientName: generatedProtocols.patientName,
      patientAge: generatedProtocols.patientAge,
      sourceType: generatedProtocols.sourceType,
      memberId: generatedProtocols.memberId,
      status: generatedProtocols.status,
      slidesWebViewLink: generatedProtocols.slidesWebViewLink,
      pdfDriveFileId: generatedProtocols.pdfDriveFileId,
      pdfDriveWebViewLink: generatedProtocols.pdfDriveWebViewLink,
      dailySchedulePdfWebViewLink: generatedProtocols.dailySchedulePdfWebViewLink,
      peptideSchedulePdfWebViewLink: generatedProtocols.peptideSchedulePdfWebViewLink,
      generatedBy: generatedProtocols.generatedBy,
      reviewedBy: generatedProtocols.reviewedBy,
      reviewNotes: generatedProtocols.reviewNotes,
      createdAt: generatedProtocols.createdAt,
    }).from(generatedProtocols)
      .where(eq(generatedProtocols.doctorId, doctorId))
      .orderBy(desc(generatedProtocols.createdAt));
    res.json(protocols);
  }));

  app.get('/api/protocol-assembly/protocols/:id', requireAuth, requireRole('admin', 'trustee', 'doctor'), asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new AppError('Invalid ID', 400, 'VALIDATION_ERROR');
    const protocol = await getProtocol(id);
    if (!protocol) throw new AppError('Protocol not found', 404, 'NOT_FOUND');
    enforceDoctorOwnership(req, protocol);
    res.json(protocol);
  }));

  app.post('/api/protocol-assembly/protocols/:id/slides', requireAuth, requireRole('admin', 'trustee', 'doctor'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
      const record = await getProtocol(id);
      if (!record) return res.status(404).json({ error: 'Protocol not found' });
      enforceDoctorOwnership(req, record);
      const protocol = record.protocol as Record<string, unknown>;
      const profile = record.patientProfile as Record<string, unknown>;
      const slides = await generateProtocolSlides(protocol as unknown as HealingProtocol, profile as unknown as PatientProfile);
      await updateProtocolSlides(id, slides.presentationId, slides.webViewLink);
      res.json(slides);
    } catch (error: unknown) {
      console.error('[Protocol Assembly] Slides error:', error);
      res.status(500).json({ error: 'Failed to generate slides. Please try again.' });
    }
  });

  app.get('/api/protocol-assembly/protocols/:id/pdf', requireAuth, requireRole('admin', 'trustee', 'doctor'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
      const record = await getProtocol(id);
      if (!record) return res.status(404).json({ error: 'Protocol not found' });
      enforceDoctorOwnership(req, record);
      const protocol = record.protocol as unknown as HealingProtocol;
      const profile = record.patientProfile as unknown as PatientProfile;
      let citations;
      try {
        citations = await fetchProtocolCitations(protocol, profile);
      } catch (citErr) {
        console.warn('[Protocol Assembly] Citation fetch failed for PDF, continuing without:', citErr);
      }
      const pdfBuffer = await generateProtocolPDFBuffer(protocol, profile, citations);
      const safeName = (protocol.patientName || 'protocol').replace(/[^a-zA-Z0-9_-]/g, '_');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}_Protocol_${protocol.generatedDate || 'draft'}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (error: unknown) {
      console.error('[Protocol Assembly] PDF generation error:', error);
      res.status(500).json({ error: 'Failed to generate PDF. Please try again.' });
    }
  });

  app.get('/api/protocol-assembly/protocols/:id/pdf/daily-schedule', requireAuth, requireRole('admin', 'trustee', 'doctor'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
      const record = await getProtocol(id);
      if (!record) return res.status(404).json({ error: 'Protocol not found' });
      enforceDoctorOwnership(req, record);
      const protocol = record.protocol as unknown as HealingProtocol;
      const profile = record.patientProfile as unknown as PatientProfile;
      const pdfBuffer = await generateDailySchedulePDFBuffer(protocol, profile);
      const safeName = (protocol.patientName || 'protocol').replace(/[^a-zA-Z0-9_-]/g, '_');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}_Daily_Schedule.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (error: unknown) {
      console.error('[Protocol Assembly] Daily Schedule PDF error:', error);
      res.status(500).json({ error: 'Failed to generate daily schedule PDF.' });
    }
  });

  app.get('/api/protocol-assembly/protocols/:id/pdf/peptide-schedule', requireAuth, requireRole('admin', 'trustee', 'doctor'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
      const record = await getProtocol(id);
      if (!record) return res.status(404).json({ error: 'Protocol not found' });
      enforceDoctorOwnership(req, record);
      const protocol = record.protocol as unknown as HealingProtocol;
      const profile = record.patientProfile as unknown as PatientProfile;
      const pdfBuffer = await generatePeptideSchedulePDFBuffer(protocol, profile);
      const safeName = (protocol.patientName || 'protocol').replace(/[^a-zA-Z0-9_-]/g, '_');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}_Peptide_Schedule.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (error: unknown) {
      console.error('[Protocol Assembly] Peptide Schedule PDF error:', error);
      res.status(500).json({ error: 'Failed to generate peptide schedule PDF.' });
    }
  });

  app.post('/api/protocol-assembly/protocols/:id/qa', requireAuth, requireRole('admin', 'trustee', 'doctor'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
      const record = await getProtocol(id);
      if (!record) return res.status(404).json({ error: 'Protocol not found' });
      enforceDoctorOwnership(req, record);
      const protocol = record.protocol as unknown as HealingProtocol;
      const qaReport = await runProtocolQA(protocol);
      res.json({
        protocolId: id,
        patientName: record.patientName,
        ...qaReport,
      });
    } catch (error: unknown) {
      console.error('[Protocol Assembly] QA validation error:', error);
      res.status(500).json({ error: 'Failed to run QA validation. Please try again.' });
    }
  });

  app.post('/api/protocol-assembly/rebuild-kathryn-smith', async (req: Request, res: Response, next) => {
    const internalKey = req.headers['x-internal-key'] || req.body?.internalKey;
    if (internalKey === process.env.CORE_API_KEY) return next();
    requireAuth(req, res, () => requireRole('admin', 'trustee')(req, res, next));
  }, async (_req: Request, res: Response) => {
    try {
      const { rebuildKathrynSmithProtocol } = await import('../services/kathryn-smith-protocol');
      console.log('[Protocol Assembly] Starting Kathryn Smith protocol rebuild...');
      res.json({ status: 'started', message: 'Kathryn Smith protocol rebuild started — generating in background' });
      rebuildKathrynSmithProtocol().then(result => {
        console.log(`[Protocol Assembly] Kathryn Smith rebuild COMPLETE: protocol=${result.generatedProtocolId}, citations=${result.citations.length}, pdf=${result.pdfSize}b`);
      }).catch(err => {
        console.error('[Protocol Assembly] Kathryn Smith rebuild FAILED:', err);
      });
    } catch (error: unknown) {
      console.error('[Protocol Assembly] Kathryn Smith rebuild error:', error);
      res.status(500).json({ error: 'Failed to start Kathryn Smith protocol rebuild. ' + (error instanceof Error ? error.message : String(error)) });
    }
  });

  app.get('/api/protocol-assembly/protocols/:id/presentation', requireAuth, requireRole('admin', 'trustee', 'doctor'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
      const record = await getProtocol(id);
      if (!record) return res.status(404).json({ error: 'Protocol not found' });
      enforceDoctorOwnership(req, record);
      const protocol = record.protocol as unknown as HealingProtocol;
      const profile = record.patientProfile as unknown as PatientProfile;
      let citations;
      try {
        citations = await fetchProtocolCitations(protocol, profile);
      } catch (e) {
        console.warn('[Protocol Assembly] Citation fetch for presentation:', e);
      }
      res.json({
        protocolId: id,
        patientName: record.patientName,
        profile,
        protocol,
        citations: citations || [],
        generatedDate: protocol.generatedDate,
        trusteeNotes: '',
      });
    } catch (error: unknown) {
      console.error('[Protocol Assembly] Presentation data error:', error);
      res.status(500).json({ error: 'Failed to get presentation data' });
    }
  });

  app.post('/api/protocol-assembly/protocols/:id/citations', requireAuth, requireRole('admin', 'trustee', 'doctor'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
      const record = await getProtocol(id);
      if (!record) return res.status(404).json({ error: 'Protocol not found' });
      enforceDoctorOwnership(req, record);
      const protocol = record.protocol as unknown as HealingProtocol;
      const profile = record.patientProfile as unknown as PatientProfile;
      const citations = await fetchProtocolCitations(protocol, profile);
      res.json({ protocolId: id, citationCount: citations.length, citations });
    } catch (error: unknown) {
      console.error('[Protocol Assembly] Citations error:', error);
      res.status(500).json({ error: 'Failed to fetch citations. Please try again.' });
    }
  });

  // Helper: insert audit log entry
  async function logProtocolAudit(params: {
    protocolId: number;
    action: string;
    actorId?: string;
    actorName?: string;
    actorRole?: string;
    previousStatus?: string;
    newStatus?: string;
    notes?: string;
    metadata?: Record<string, unknown>;
  }) {
    try {
      await db.insert(protocolReviewAuditLog).values({
        protocolId: params.protocolId,
        action: params.action,
        actorId: params.actorId,
        actorName: params.actorName,
        actorRole: params.actorRole,
        previousStatus: params.previousStatus,
        newStatus: params.newStatus,
        notes: params.notes,
        metadata: params.metadata,
      });
    } catch (err) {
      console.warn('[Protocol Audit] Failed to write audit log:', err);
    }
  }

  // GET /api/protocol-assembly/protocols/doctor-queue — protocols assigned to this doctor pending their review
  app.get('/api/protocol-assembly/protocols/doctor-queue', requireAuth, requireRole('admin', 'trustee', 'doctor'), asyncHandler(async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    const userId = getUserId(req as AuthenticatedRequest);
    if (!userId) throw new AppError('User identity required', 403, 'FORBIDDEN');

    const selectFields = {
      id: generatedProtocols.id,
      patientName: generatedProtocols.patientName,
      patientAge: generatedProtocols.patientAge,
      sourceType: generatedProtocols.sourceType,
      memberId: generatedProtocols.memberId,
      doctorId: generatedProtocols.doctorId,
      status: generatedProtocols.status,
      doctorReviewStatus: generatedProtocols.doctorReviewStatus,
      doctorReviewedBy: generatedProtocols.doctorReviewedBy,
      doctorReviewedAt: generatedProtocols.doctorReviewedAt,
      doctorReviewNotes: generatedProtocols.doctorReviewNotes,
      slidesWebViewLink: generatedProtocols.slidesWebViewLink,
      pdfDriveFileId: generatedProtocols.pdfDriveFileId,
      pdfDriveWebViewLink: generatedProtocols.pdfDriveWebViewLink,
      dailySchedulePdfWebViewLink: generatedProtocols.dailySchedulePdfWebViewLink,
      peptideSchedulePdfWebViewLink: generatedProtocols.peptideSchedulePdfWebViewLink,
      generatedBy: generatedProtocols.generatedBy,
      reviewedBy: generatedProtocols.reviewedBy,
      reviewNotes: generatedProtocols.reviewNotes,
      createdAt: generatedProtocols.createdAt,
      updatedAt: generatedProtocols.updatedAt,
    };

    let queue;
    if (isDoctorOnly(req as AuthenticatedRequest)) {
      // Doctors see only their own protocols
      queue = await db.select(selectFields).from(generatedProtocols)
        .where(and(
          eq(generatedProtocols.doctorId, userId),
          eq(generatedProtocols.status, 'needs_review')
        ))
        .orderBy(desc(generatedProtocols.createdAt));
    } else {
      // Admin/trustee can see all pending doctor review
      queue = await db.select(selectFields).from(generatedProtocols)
        .where(eq(generatedProtocols.status, 'needs_review'))
        .orderBy(desc(generatedProtocols.createdAt));
    }

    res.json(queue);
  }));

  // POST /api/protocol-assembly/protocols/:id/doctor-review — doctor approves, rejects, or requests changes
  app.post('/api/protocol-assembly/protocols/:id/doctor-review', requireAuth, requireRole('admin', 'trustee', 'doctor'), asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new AppError('Invalid protocol ID', 400, 'VALIDATION_ERROR');

    const { action, notes } = req.body as { action: 'approve' | 'reject' | 'request_changes'; notes?: string };
    const validActions = ['approve', 'reject', 'request_changes'];
    if (!action || !validActions.includes(action)) {
      throw new AppError(`Invalid action. Must be one of: ${validActions.join(', ')}`, 400, 'VALIDATION_ERROR');
    }

    const record = await getProtocol(id);
    if (!record) throw new AppError('Protocol not found', 404, 'NOT_FOUND');

    // Doctors can only review their own protocols; admins/trustees can review any
    if (isDoctorOnly(req as AuthenticatedRequest)) {
      const userId = getUserId(req as AuthenticatedRequest);
      if (!userId || record.doctorId !== userId) {
        throw new AppError('Forbidden: protocol not assigned to you', 403, 'FORBIDDEN');
      }
    }

    // Protocol must be in needs_review state for doctor to act on it
    if (record.status !== 'needs_review') {
      throw new AppError(`Cannot review protocol with status "${record.status}". Protocol must be in "needs_review" state.`, 400, 'INVALID_STATE');
    }

    const user = (req as AuthenticatedRequest).user;
    const actorName = user?.email || user?.firstName || user?.name || 'doctor';
    const actorId = getUserId(req as AuthenticatedRequest);
    const actorRole = isDoctorOnly(req as AuthenticatedRequest) ? 'doctor' : 'admin';

    let doctorReviewStatus: string;
    let newProtocolStatus: string;
    let auditAction: string;

    switch (action) {
      case 'approve':
        doctorReviewStatus = 'approved';
        newProtocolStatus = 'doctor_approved';
        auditAction = 'doctor_approved';
        break;
      case 'reject':
        doctorReviewStatus = 'rejected';
        newProtocolStatus = 'rejected';
        auditAction = 'doctor_rejected';
        break;
      case 'request_changes':
        doctorReviewStatus = 'changes_requested';
        newProtocolStatus = 'needs_revision';
        auditAction = 'doctor_requested_changes';
        break;
      default:
        throw new AppError('Invalid action', 400, 'VALIDATION_ERROR');
    }

    const previousStatus = record.status;

    await db.update(generatedProtocols).set({
      doctorReviewStatus,
      doctorReviewedBy: actorName,
      doctorReviewedAt: new Date(),
      doctorReviewNotes: notes || null,
      status: newProtocolStatus,
      updatedAt: new Date(),
    }).where(eq(generatedProtocols.id, id));

    await logProtocolAudit({
      protocolId: id,
      action: auditAction,
      actorId,
      actorName,
      actorRole,
      previousStatus,
      newStatus: newProtocolStatus,
      notes,
    });

    // Notify admin/trustee if doctor approved — now ready for final trustee sign-off
    if (action === 'approve') {
      try {
        const adminRows = await db.select({ userId: memberProfiles.userId }).from(memberProfiles).where(eq(memberProfiles.role, 'admin'));
        await Promise.all(adminRows.map(a =>
          notificationService.createForUser(
            a.userId,
            'protocol_approval_request',
            'Protocol Ready for Trustee Sign-Off',
            `Dr. ${actorName} has approved the protocol for ${record.patientName}. It is now pending Trustee final sign-off.`,
            { protocolId: id }
          ).catch(() => {})
        ));
      } catch (notifyErr) {
        console.warn('[Doctor Review] Trustee notification failed:', notifyErr);
      }
    }

    // Notify generating doctor if changes requested or rejected
    if ((action === 'reject' || action === 'request_changes') && record.doctorId) {
      notificationService.createForUser(
        record.doctorId,
        'protocol_update',
        action === 'reject' ? 'Protocol Rejected' : 'Protocol Changes Requested',
        `${action === 'reject' ? 'The protocol' : 'Changes have been requested for the protocol'} for ${record.patientName}.${notes ? ` Notes: ${notes}` : ''}`,
        { protocolId: id }
      ).catch(() => {});
    }

    const updated = await getProtocol(id);
    res.json({ success: true, action, protocol: updated });
  }));

  // GET /api/protocol-assembly/protocols/:id/audit-log — full audit trail for a protocol
  app.get('/api/protocol-assembly/protocols/:id/audit-log', requireAuth, requireRole('admin', 'trustee', 'doctor'), asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new AppError('Invalid protocol ID', 400, 'VALIDATION_ERROR');

    const record = await getProtocol(id);
    if (!record) throw new AppError('Protocol not found', 404, 'NOT_FOUND');
    enforceDoctorOwnership(req, record);

    const auditEntries = await db.select().from(protocolReviewAuditLog)
      .where(eq(protocolReviewAuditLog.protocolId, id))
      .orderBy(desc(protocolReviewAuditLog.createdAt));

    res.json({ protocolId: id, patientName: record.patientName, auditLog: auditEntries });
  }));

  app.patch('/api/protocol-assembly/protocols/:id/status', requireAuth, requireRole('admin', 'trustee'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

      const { status, reviewNotes, doctorId } = req.body;
      const validStatuses = ['draft', 'needs_review', 'doctor_approved', 'approved', 'rejected', 'needs_revision'];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      }

      const record = await getProtocol(id);
      if (!record) return res.status(404).json({ error: 'Protocol not found' });

      const user = (req as AuthenticatedRequest).user;
      const reviewerUsername = user?.email || user?.firstName || 'trustee';
      const actorId = (req as AuthenticatedRequest).user?.id;
      const previousStatus = record.status;
      const updateData: Record<string, unknown> = {
        status,
        updatedAt: new Date(),
      };

      if (status === 'approved' || status === 'rejected') {
        updateData.reviewedBy = reviewerUsername;
        updateData.reviewedAt = new Date();
      } else if (status === 'needs_review' || status === 'draft' || status === 'needs_revision') {
        updateData.reviewedBy = null;
        updateData.reviewedAt = null;
      }
      if (reviewNotes !== undefined) {
        updateData.reviewNotes = reviewNotes;
      }
      if (doctorId !== undefined) {
        updateData.doctorId = doctorId;
      }

      const effectiveDoctorId = doctorId || record.doctorId;
      if (status === 'approved' && !effectiveDoctorId) {
        return res.status(400).json({
          error: 'Cannot approve: a doctor must be assigned before approval. Set doctorId in the request body or assign one first.',
        });
      }

      await db.update(generatedProtocols).set(updateData).where(eq(generatedProtocols.id, id));

      // Audit log for trustee action
      const auditAction = status === 'approved' ? 'trustee_approved'
        : status === 'rejected' ? 'trustee_rejected'
        : status === 'needs_review' ? 'submitted_for_review'
        : status === 'needs_revision' ? 'trustee_requested_revision'
        : `status_changed_to_${status}`;
      await logProtocolAudit({
        protocolId: id,
        action: auditAction,
        actorId,
        actorName: reviewerUsername,
        actorRole: 'trustee',
        previousStatus,
        newStatus: status,
        notes: reviewNotes,
      });

      let uploadedPdfLink: string | null = null;
      if (status === 'approved') {
        try {
          const protocol = record.protocol as HealingProtocol;
          const profile = record.patientProfile as PatientProfile;
          let citations;
          try {
            citations = await fetchProtocolCitations(protocol, profile);
          } catch (citErr: unknown) {
            console.warn(`[Protocol Delivery] Citations fetch failed for protocol ${id}:`, citErr instanceof Error ? citErr.message : String(citErr));
          }

          const safeName = (protocol.patientName || 'protocol').replace(/[^a-zA-Z0-9_-]/g, '_');
          const dateStr = protocol.generatedDate || new Date().toISOString().split('T')[0];
          const { uploadProtocolToDrive } = await import('../services/drive');

          const [fullPdfBuffer, dailyPdfBuffer, peptidePdfBuffer] = await Promise.all([
            generateProtocolPDFBuffer(protocol, profile, citations),
            generateDailySchedulePDFBuffer(protocol, profile),
            generatePeptideSchedulePDFBuffer(protocol, profile),
          ]);
          console.log(`[Protocol Delivery] Generated 3 PDFs for protocol ${id}: Full(${fullPdfBuffer.length}), Daily(${dailyPdfBuffer.length}), Peptide(${peptidePdfBuffer.length})`);

          const [fullDriveResult, dailyDriveResult, peptideDriveResult] = await Promise.all([
            uploadProtocolToDrive(fullPdfBuffer, `${safeName}_Full_Protocol_${dateStr}.pdf`),
            uploadProtocolToDrive(dailyPdfBuffer, `${safeName}_Daily_Schedule_${dateStr}.pdf`),
            uploadProtocolToDrive(peptidePdfBuffer, `${safeName}_Peptide_Schedule_${dateStr}.pdf`),
          ]);

          const driveUpdateData: Record<string, unknown> = {};
          if (fullDriveResult.success) {
            uploadedPdfLink = fullDriveResult.webViewLink || null;
            driveUpdateData.pdfDriveFileId = fullDriveResult.fileId;
            driveUpdateData.pdfDriveWebViewLink = fullDriveResult.webViewLink;
            console.log(`[Protocol Delivery] Full Protocol PDF → Drive: ${fullDriveResult.webViewLink}`);
          }
          if (dailyDriveResult.success) {
            driveUpdateData.dailySchedulePdfFileId = dailyDriveResult.fileId;
            driveUpdateData.dailySchedulePdfWebViewLink = dailyDriveResult.webViewLink;
            console.log(`[Protocol Delivery] Daily Schedule PDF → Drive: ${dailyDriveResult.webViewLink}`);
          }
          if (peptideDriveResult.success) {
            driveUpdateData.peptideSchedulePdfFileId = peptideDriveResult.fileId;
            driveUpdateData.peptideSchedulePdfWebViewLink = peptideDriveResult.webViewLink;
            console.log(`[Protocol Delivery] Peptide Schedule PDF → Drive: ${peptideDriveResult.webViewLink}`);
          }

          if (Object.keys(driveUpdateData).length > 0) {
            await db.update(generatedProtocols).set(driveUpdateData).where(eq(generatedProtocols.id, id));
          }
        } catch (driveErr: unknown) {
          const errMsg = driveErr instanceof Error ? driveErr.message : String(driveErr);
          console.error(`[Protocol Delivery] Drive upload failed for protocol ${id}:`, errMsg);
        }

        const targetDoctorId = doctorId || record.doctorId;
        if (targetDoctorId) {
          try {
            const protocol = record.protocol as HealingProtocol;
            const { conversations, doctorPatientMessages } = await import('@shared/schema');
            const patientRecordKey = record.memberId || String(id);
            const existingConvos = await db.select().from(conversations)
              .where(eq(conversations.patientRecordId, patientRecordKey));

            let conversationId: string;
            if (existingConvos.length > 0) {
              conversationId = existingConvos[0].id;
            } else {
              const [newConvo] = await db.insert(conversations).values({
                patientRecordId: patientRecordKey,
                participantIds: ['system', targetDoctorId],
                participantNames: ['FFPMA System', 'Doctor'],
                subject: `Protocol Approved: ${record.patientName}`,
                lastMessageAt: new Date(),
                lastMessagePreview: `Protocol for ${record.patientName} has been approved`,
              }).returning();
              conversationId = newConvo.id;
            }

            const pdfLink = uploadedPdfLink || record.pdfDriveWebViewLink || 'Available in Patient Protocols folder';
            const slidesLink = record.slidesWebViewLink || 'No presentation available';
            const protocolSummary = protocol.summary || 'See full protocol for details';

            const updatedRecord = await getProtocol(id);
            const dailyLink = updatedRecord?.dailySchedulePdfWebViewLink || 'Generating...';
            const peptideLink = updatedRecord?.peptideSchedulePdfWebViewLink || 'Generating...';

            await db.insert(doctorPatientMessages).values({
              conversationId,
              senderId: 'system',
              senderRole: 'admin',
              senderName: 'FFPMA Protocol System',
              recipientId: targetDoctorId,
              recipientRole: 'doctor',
              recipientName: 'Doctor',
              subject: `Protocol Approved: ${record.patientName}`,
              content: `The protocol for ${record.patientName} has been reviewed and approved by the Trustee.\n\n` +
                `**Protocol Summary:** ${protocolSummary}\n\n` +
                `**4 Deliverables:**\n` +
                `1. Full Protocol PDF: ${pdfLink}\n` +
                `2. Daily Schedule PDF: ${dailyLink}\n` +
                `3. Peptide Schedule PDF: ${peptideLink}\n` +
                `4. Presentation: ${slidesLink}\n\n` +
                `Please review and share with the member as appropriate.`,
              isUrgent: false,
            });
            console.log(`[Protocol Delivery] Chat message sent to doctor ${targetDoctorId} for protocol ${id}`);
          } catch (chatErr: unknown) {
            const errMsg = chatErr instanceof Error ? chatErr.message : String(chatErr);
            console.error(`[Protocol Delivery] Chat notification failed for protocol ${id}:`, errMsg);
          }
        }
      }

      const updated = await getProtocol(id);

      if (status === 'needs_review') {
        const adminRows = await db.select({ userId: memberProfiles.userId }).from(memberProfiles).where(eq(memberProfiles.role, 'admin'));
        await Promise.all(adminRows.map(a => notificationService.createForUser(a.userId, 'protocol_approval_request', 'Protocol Ready for Review', `A protocol for ${record.patientName || 'a patient'} has been submitted for Trustee review.`, { protocolId: id }).catch(() => {})));
        const reviewDoctorId = effectiveDoctorId || record.doctorId;
        if (reviewDoctorId) {
          notificationService.createForUser(reviewDoctorId, 'protocol_approval_request', 'Protocol Submitted for Review', `A protocol for ${record.patientName || 'a patient'} has been submitted and is pending Trustee approval.`, { protocolId: id }).catch(() => {});
        }
      }

      if (status === 'approved') {
        const targetDoctorId = effectiveDoctorId || record.doctorId;
        if (targetDoctorId) {
          notificationService.createForUser(targetDoctorId, 'protocol_update', 'Protocol Approved — Action Required', `A patient protocol has been reviewed and approved by the Trustee. Please deliver it to the member.`, { protocolId: id }).catch(() => {});
        }
        if (record.memberId) {
          const memberRow = await db.select({ userId: memberProfiles.userId }).from(memberProfiles).where(eq(memberProfiles.id, record.memberId)).limit(1);
          if (memberRow[0]) {
            notificationService.createForUser(memberRow[0].userId, 'protocol_update', 'Your Protocol Has Been Approved', 'Your personalized wellness protocol has been reviewed and approved. Your practitioner will be in touch shortly.', { protocolId: id }).catch(() => {});
          }
        }
      }

      res.json({ success: true, protocol: updated });
    } catch (error: unknown) {
      console.error('[Protocol Assembly] Status update error:', error);
      res.status(500).json({ error: 'Failed to update protocol status' });
    }
  });

  app.post('/api/protocol-assembly/protocols/:id/finalize', requireAuth, requireRole('admin', 'trustee'), asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new AppError('Invalid protocol ID', 400, 'INVALID_ID');

    const record = await getProtocol(id);
    if (!record) throw new AppError('Protocol not found', 404, 'NOT_FOUND');

    if (record.status !== 'approved') {
      throw new AppError('Protocol must be approved before finalization', 400, 'NOT_APPROVED');
    }

    const protocol = record.protocol as HealingProtocol;
    const profile = record.patientProfile as PatientProfile;

    const catalogWarnings: string[] = [];
    try {
      const { searchCatalog } = await import('../services/catalog-service');
      const FF_DETOX_SEQUENCE = ['EDTA', "Myers'", 'Glutathione', 'ALA', 'DMSO'];
      for (const component of FF_DETOX_SEQUENCE) {
        const matches = await searchCatalog(component);
        if (matches.length === 0) {
          catalogWarnings.push(`FF Detox component "${component}" not found in product catalog`);
        }
      }

      const phases = protocol.phases || [];
      for (const phase of phases) {
        for (const action of (phase.keyActions || [])) {
          if (/lipo.?b/i.test(action) && /\biv\b/i.test(action)) {
            catalogWarnings.push(`Catalog violation: Lipo-B referenced in IV context in phase "${phase.name}". Lipo-B is IM ONLY.`);
          }
        }
      }

      const protocolAny = protocol as unknown as Record<string, unknown>;
      const ivFields = ['ivTherapies', 'ivProtocol', 'ivTreatments', 'ivSchedule'];
      for (const field of ivFields) {
        const fieldValue = protocolAny[field];
        if (fieldValue) {
          const serialized = JSON.stringify(fieldValue).toLowerCase();
          if (/lipo.?b/i.test(serialized)) {
            catalogWarnings.push(`Catalog violation: Lipo-B found in structured IV field "${field}". Lipo-B is IM ONLY (216mg/mL).`);
          }
        }
      }
    } catch (catErr) {
      console.warn(`[Finalize] Catalog cross-check failed (non-fatal):`, catErr);
      catalogWarnings.push('Catalog cross-check unavailable — could not fetch catalog');
    }

    let citations;
    try {
      citations = await fetchProtocolCitations(protocol, profile);
    } catch (citErr: unknown) {
      console.warn(`[Finalize] Citations fetch failed for protocol ${id}:`, citErr instanceof Error ? citErr.message : String(citErr));
    }

    const safeName = (protocol.patientName || 'protocol').replace(/[^a-zA-Z0-9_-]/g, '_');
    const dateStr = protocol.generatedDate || new Date().toISOString().split('T')[0];

    const [fullPdfBuffer, dailyPdfBuffer, peptidePdfBuffer] = await Promise.all([
      generateProtocolPDFBuffer(protocol, profile, citations),
      generateDailySchedulePDFBuffer(protocol, profile),
      generatePeptideSchedulePDFBuffer(protocol, profile),
    ]);
    console.log(`[Finalize] Generated 3 PDFs for protocol ${id}: Full(${fullPdfBuffer.length}), Daily(${dailyPdfBuffer.length}), Peptide(${peptidePdfBuffer.length})`);

    const { uploadProtocolToDrive } = await import('../services/drive');
    const [fullDriveResult, dailyDriveResult, peptideDriveResult] = await Promise.all([
      uploadProtocolToDrive(fullPdfBuffer, `${safeName}_Full_Protocol_${dateStr}.pdf`),
      uploadProtocolToDrive(dailyPdfBuffer, `${safeName}_Daily_Schedule_${dateStr}.pdf`),
      uploadProtocolToDrive(peptidePdfBuffer, `${safeName}_Peptide_Schedule_${dateStr}.pdf`),
    ]);

    const driveUpdateData: Record<string, unknown> = { updatedAt: new Date() };
    const deliverables: Record<string, string | null> = {};

    if (fullDriveResult.success) {
      driveUpdateData.pdfDriveFileId = fullDriveResult.fileId;
      driveUpdateData.pdfDriveWebViewLink = fullDriveResult.webViewLink;
      deliverables.fullProtocolPdf = fullDriveResult.webViewLink || null;
    }
    if (dailyDriveResult.success) {
      driveUpdateData.dailySchedulePdfFileId = dailyDriveResult.fileId;
      driveUpdateData.dailySchedulePdfWebViewLink = dailyDriveResult.webViewLink;
      deliverables.dailySchedulePdf = dailyDriveResult.webViewLink || null;
    }
    if (peptideDriveResult.success) {
      driveUpdateData.peptideSchedulePdfFileId = peptideDriveResult.fileId;
      driveUpdateData.peptideSchedulePdfWebViewLink = peptideDriveResult.webViewLink;
      deliverables.peptideSchedulePdf = peptideDriveResult.webViewLink || null;
    }

    deliverables.presentation = record.slidesWebViewLink || null;

    await db.update(generatedProtocols).set(driveUpdateData).where(eq(generatedProtocols.id, id));
    console.log(`[Finalize] Protocol ${id} finalized with ${Object.keys(deliverables).length} deliverables`);

    res.json({
      success: true,
      protocolId: id,
      deliverables,
      catalogCrossCheck: {
        passed: catalogWarnings.length === 0,
        warnings: catalogWarnings,
      },
      pdfSizes: {
        fullProtocol: fullPdfBuffer.length,
        dailySchedule: dailyPdfBuffer.length,
        peptideSchedule: peptidePdfBuffer.length,
      },
    });
  }));

  app.post('/api/protocol-assembly/protocols/:id/upload-to-drive', requireAuth, requireRole('admin', 'trustee'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

      const record = await getProtocol(id);
      if (!record) return res.status(404).json({ error: 'Protocol not found' });

      const protocol = record.protocol as HealingProtocol;
      const profile = record.patientProfile as PatientProfile;
      let citations;
      try {
        citations = await fetchProtocolCitations(protocol, profile);
      } catch (citErr: unknown) {
        console.warn(`[Protocol Delivery] Citations fetch failed for protocol ${id}:`, citErr instanceof Error ? citErr.message : String(citErr));
      }
      const pdfBuffer = await generateProtocolPDFBuffer(protocol, profile, citations);
      const safeName = (protocol.patientName || 'protocol').replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `${safeName}_Protocol_${protocol.generatedDate || new Date().toISOString().split('T')[0]}.pdf`;

      const { uploadProtocolToDrive } = await import('../services/drive');
      const driveResult = await uploadProtocolToDrive(pdfBuffer, fileName);

      if (!driveResult.success) {
        return res.status(500).json({ error: driveResult.error || 'Drive upload failed' });
      }

      await db.update(generatedProtocols).set({
        pdfDriveFileId: driveResult.fileId,
        pdfDriveWebViewLink: driveResult.webViewLink,
        updatedAt: new Date(),
      }).where(eq(generatedProtocols.id, id));

      res.json({
        success: true,
        fileId: driveResult.fileId,
        webViewLink: driveResult.webViewLink,
      });
    } catch (error: unknown) {
      console.error('[Protocol Assembly] Drive upload error:', error);
      res.status(500).json({ error: 'Failed to upload protocol to Drive' });
    }
  });

  app.post('/api/protocol-assembly/batch-generate', async (req: Request, res: Response) => {
    const internalKey = req.headers['x-internal-key'] || req.body?.internalKey;
    if (internalKey !== process.env.CORE_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized — admin key required' });
    }
    try {
      const { member } = req.body as { member?: string };
      const {
        buildAnnetteGomerProfile,
        buildCropDusterProfile,
        buildBreastCancer75FProfile,
      } = await import('../services/backlog-member-protocols');
      const { generateProtocolPPTXFromTemplate } = await import('../services/protocol-pptx-template');

      type MemberDef = { name: string; buildProfile: () => PatientProfile; filePrefix: string };
      const allMembers: MemberDef[] = [
        { name: 'Annette Gomer', buildProfile: buildAnnetteGomerProfile, filePrefix: 'Annette_Gomer' },
        { name: 'Michael Hanneman', buildProfile: buildCropDusterProfile, filePrefix: 'Michael_Hanneman' },
        { name: 'Margaret R.', buildProfile: buildBreastCancer75FProfile, filePrefix: 'Breast_Cancer_75F' },
      ];

      const targets = member
        ? allMembers.filter(m => m.name.toLowerCase().includes(member.toLowerCase()) || m.filePrefix.toLowerCase().includes(member.toLowerCase()))
        : allMembers;

      if (targets.length === 0) {
        return res.status(400).json({ error: `No member found matching "${member}"` });
      }

      res.json({ status: 'started', members: targets.map(t => t.name), count: targets.length });

      (async () => {
        for (const t of targets) {
          try {
            console.log(`[Batch Generate] Starting: ${t.name}`);
            const profile = t.buildProfile();
            console.log(`[Batch Generate] Profile built: ${profile.name}, ${profile.age}`);

            const protocol = await generateProtocol(profile);
            console.log(`[Batch Generate] Protocol generated for ${t.name}: ${protocol.injectablePeptides?.length || 0} injectables, ${protocol.supplements?.length || 0} supplements`);

            const dbResult = await db.insert(generatedProtocols).values({
              patientName: profile.name,
              patientAge: profile.age,
              sourceType: 'batch_generate',
              doctorId: 'trustee-michael-blake',
              status: 'approved',
              patientProfile: profile as unknown as Record<string, unknown>,
              protocol: protocol as unknown as Record<string, unknown>,
              generatedBy: 'batch-generate',
              notes: `Batch generated: ${protocol.injectablePeptides?.length || 0} injectables, ${protocol.supplements?.length || 0} supplements, ${protocol.bioregulators?.length || 0} bioregulators`,
            }).returning({ id: generatedProtocols.id });
            console.log(`[Batch Generate] Stored ${t.name} as DB id=${dbResult[0].id}`);

            const fs = await import('fs');
            const path = await import('path');
            const outDir = path.resolve(process.cwd(), 'generated-protocols');
            if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

            const [fullPdf, dailyPdf, peptidePdf] = await Promise.all([
              generateProtocolPDFBuffer(protocol, profile),
              generateDailySchedulePDFBuffer(protocol, profile),
              generatePeptideSchedulePDFBuffer(protocol, profile),
            ]);

            fs.writeFileSync(path.join(outDir, `${t.filePrefix}_Full_Protocol.pdf`), fullPdf);
            fs.writeFileSync(path.join(outDir, `${t.filePrefix}_Daily_Schedule.pdf`), dailyPdf);
            fs.writeFileSync(path.join(outDir, `${t.filePrefix}_Peptide_Schedule.pdf`), peptidePdf);
            console.log(`[Batch Generate] 3 PDFs written for ${t.name}`);

            const pptxBuf = await generateProtocolPPTXFromTemplate(protocol, profile);
            fs.writeFileSync(path.join(outDir, `${t.filePrefix}_Protocol_Presentation.pptx`), pptxBuf);
            console.log(`[Batch Generate] PPTX written for ${t.name} (${(pptxBuf.length / 1024).toFixed(0)} KB)`);

            console.log(`[Batch Generate] COMPLETE: ${t.name} — 4 deliverables generated`);
          } catch (err: any) {
            console.error(`[Batch Generate] FAILED: ${t.name} — ${err.message}`);
          }
        }
        console.log(`[Batch Generate] All batch generation complete`);
      })();
    } catch (error: unknown) {
      console.error('[Batch Generate] Setup error:', error);
      res.status(500).json({ error: 'Failed to start batch generation' });
    }
  });
}
