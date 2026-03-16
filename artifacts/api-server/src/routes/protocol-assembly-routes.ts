import type { Express, Request, Response } from "express";
import { requireAuth, requireRole } from "../working-auth";
import { db } from "../db";
import { eq, desc, and } from "drizzle-orm";
import { asyncHandler, AppError } from "../middleware/error-handler";
import { intakeForms, generatedProtocols } from "@shared/schema";
import type { HealingProtocol, PatientProfile } from "@shared/types/protocol-assembly";

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
    runProtocolQA,
  } = await import('../services/protocol-assembly');

  const DOCTOR_ROLE_NAMES = ['doctor', 'physician', 'ff_doctor', 'ff_healer', 'healer', 'practitioner', 'um_doctor', 'um_healer', 'um_practitioner', 'wellness_practitioner', 'healthcare_provider'];
  const ADMIN_ROLE_NAMES = ['administrator', 'shop_manager'];

  function isDoctorOnly(req: Request): boolean {
    const wpRoles: string[] = (req as any).user?.wpRoles || [];
    const isDoctor = wpRoles.some((r: string) => DOCTOR_ROLE_NAMES.includes(r));
    const isAdmin = wpRoles.some((r: string) => ADMIN_ROLE_NAMES.includes(r));
    return isDoctor && !isAdmin;
  }

  function getUserId(req: Request): string | undefined {
    return (req as any).user?.id;
  }

  function enforceDoctorOwnership(req: Request, record: { doctorId?: string | null }): void {
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
      const profile = await analyzeTranscript(transcript);
      const protocol = await generateProtocol(profile);
      const creatorId = getUserId(req);
      const creatorDoctorId = isDoctorOnly(req) ? creatorId : undefined;
      const protocolId = await saveProtocol(profile, protocol, 'transcript', (req.user as { username?: string })?.username, memberId as string | undefined, creatorDoctorId);
      let slides = null;
      if (shouldGenerateSlides) {
        try {
          slides = await generateProtocolSlides(protocol, profile);
          await updateProtocolSlides(protocolId, slides.presentationId, slides.webViewLink);
        } catch (slideError: any) {
          console.error('[Protocol Assembly] Slide generation failed:', slideError.message);
        }
      }
      res.json({ id: protocolId, profile, protocol, slides });
    } catch (error: any) {
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
      const creatorId2 = getUserId(req);
      const creatorDoctorId2 = isDoctorOnly(req) ? creatorId2 : undefined;
      const protocolId = await saveProtocol(profile, protocol, 'intake_form', (req.user as { username?: string })?.username, req.body?.memberId as string | undefined, creatorDoctorId2);
      const { generateSlides: shouldGenerateSlides } = req.body || {};
      let slides = null;
      if (shouldGenerateSlides) {
        try {
          slides = await generateProtocolSlides(protocol, profile);
          await updateProtocolSlides(protocolId, slides.presentationId, slides.webViewLink);
        } catch (slideError: any) {
          console.error('[Protocol Assembly] Slide generation failed:', slideError.message);
        }
      }
      res.json({ id: protocolId, profile, protocol, slides });
    } catch (error: any) {
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
    } catch (error: any) {
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
      slidesWebViewLink: generatedProtocols.slidesWebViewLink,
      pdfDriveFileId: generatedProtocols.pdfDriveFileId,
      pdfDriveWebViewLink: generatedProtocols.pdfDriveWebViewLink,
      generatedBy: generatedProtocols.generatedBy,
      reviewedBy: generatedProtocols.reviewedBy,
      reviewedAt: generatedProtocols.reviewedAt,
      reviewNotes: generatedProtocols.reviewNotes,
      createdAt: generatedProtocols.createdAt,
      updatedAt: generatedProtocols.updatedAt,
    }).from(generatedProtocols)
      .where(eq(generatedProtocols.status, 'pending_review'))
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
    } catch (error: any) {
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
      const protocol = record.protocol as any;
      const profile = record.patientProfile as any;
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
    } catch (error: any) {
      console.error('[Protocol Assembly] PDF generation error:', error);
      res.status(500).json({ error: 'Failed to generate PDF. Please try again.' });
    }
  });

  app.post('/api/protocol-assembly/protocols/:id/qa', requireAuth, requireRole('admin', 'trustee', 'doctor'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
      const record = await getProtocol(id);
      if (!record) return res.status(404).json({ error: 'Protocol not found' });
      enforceDoctorOwnership(req, record);
      const protocol = record.protocol as any;
      const qaReport = await runProtocolQA(protocol);
      res.json({
        protocolId: id,
        patientName: record.patientName,
        ...qaReport,
      });
    } catch (error: any) {
      console.error('[Protocol Assembly] QA validation error:', error);
      res.status(500).json({ error: 'Failed to run QA validation. Please try again.' });
    }
  });

  app.post('/api/protocol-assembly/rebuild-kathryn-smith', requireAuth, requireRole('admin', 'trustee'), async (_req: Request, res: Response) => {
    try {
      const { rebuildKathrynSmithProtocol } = await import('../services/kathryn-smith-protocol');
      console.log('[Protocol Assembly] Starting Kathryn Smith protocol rebuild...');
      const result = await rebuildKathrynSmithProtocol();
      res.json({
        success: true,
        message: 'Kathryn Smith protocol rebuild complete',
        patientRecordId: result.patientRecordId,
        patientProtocolId: result.patientProtocolId,
        generatedProtocolId: result.generatedProtocolId,
        citationCount: result.citations.length,
        pdfSize: result.pdfSize,
        pdfUrl: result.pdfUrl,
        qaResult: result.qaResult,
        ecsProfile: result.ecsProfile,
        protocol: result.protocol,
        profile: result.profile,
      });
    } catch (error: any) {
      console.error('[Protocol Assembly] Kathryn Smith rebuild error:', error);
      res.status(500).json({ error: 'Failed to rebuild Kathryn Smith protocol. ' + (error.message || '') });
    }
  });

  app.get('/api/protocol-assembly/protocols/:id/presentation', requireAuth, requireRole('admin', 'trustee', 'doctor'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
      const record = await getProtocol(id);
      if (!record) return res.status(404).json({ error: 'Protocol not found' });
      enforceDoctorOwnership(req, record);
      const protocol = record.protocol as any;
      const profile = record.patientProfile as any;
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
        trusteeNotes: profile.practitionerNotes || '',
      });
    } catch (error: any) {
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
      const protocol = record.protocol as any;
      const profile = record.patientProfile as any;
      const citations = await fetchProtocolCitations(protocol, profile);
      res.json({ protocolId: id, citationCount: citations.length, citations });
    } catch (error: any) {
      console.error('[Protocol Assembly] Citations error:', error);
      res.status(500).json({ error: 'Failed to fetch citations. Please try again.' });
    }
  });

  app.patch('/api/protocol-assembly/protocols/:id/status', requireAuth, requireRole('admin', 'trustee'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

      const { status, reviewNotes, doctorId } = req.body;
      const validStatuses = ['draft', 'pending_review', 'approved', 'rejected'];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      }

      const record = await getProtocol(id);
      if (!record) return res.status(404).json({ error: 'Protocol not found' });

      const user = (req as any).user;
      const reviewerUsername = user?.email || user?.firstName || 'trustee';
      const updateData: Record<string, unknown> = {
        status,
        updatedAt: new Date(),
      };

      if (status === 'approved' || status === 'rejected') {
        updateData.reviewedBy = reviewerUsername;
        updateData.reviewedAt = new Date();
      } else {
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
          const pdfBuffer = await generateProtocolPDFBuffer(protocol, profile, citations);
          const safeName = (protocol.patientName || 'protocol').replace(/[^a-zA-Z0-9_-]/g, '_');
          const fileName = `${safeName}_Protocol_${protocol.generatedDate || new Date().toISOString().split('T')[0]}.pdf`;

          const { uploadProtocolToDrive } = await import('../services/drive');
          const driveResult = await uploadProtocolToDrive(pdfBuffer, fileName);
          if (driveResult.success) {
            uploadedPdfLink = driveResult.webViewLink || null;
            await db.update(generatedProtocols).set({
              pdfDriveFileId: driveResult.fileId,
              pdfDriveWebViewLink: driveResult.webViewLink,
            }).where(eq(generatedProtocols.id, id));
            console.log(`[Protocol Delivery] Uploaded protocol ${id} to Drive: ${driveResult.webViewLink}`);
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
                `**PDF:** ${pdfLink}\n` +
                `**Presentation:** ${slidesLink}\n\n` +
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
      res.json({ success: true, protocol: updated });
    } catch (error: any) {
      console.error('[Protocol Assembly] Status update error:', error);
      res.status(500).json({ error: 'Failed to update protocol status' });
    }
  });

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
    } catch (error: any) {
      console.error('[Protocol Assembly] Drive upload error:', error);
      res.status(500).json({ error: 'Failed to upload protocol to Drive' });
    }
  });
}
