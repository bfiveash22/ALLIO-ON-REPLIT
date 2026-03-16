import type { Express, Request, Response } from "express";
import { requireAuth, requireRole } from "../working-auth";
import { db } from "../db";
import { eq, desc } from "drizzle-orm";
import { asyncHandler, AppError } from "../middleware/error-handler";
import { intakeForms, generatedProtocols } from "@shared/schema";

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
      const protocolId = await saveProtocol(profile, protocol, 'transcript', (req.user as { username?: string })?.username, memberId as string | undefined);
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
      const protocolId = await saveProtocol(profile, protocol, 'intake_form', (req.user as { username?: string })?.username, req.body?.memberId as string | undefined);
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

  app.get('/api/protocol-assembly/protocols', requireAuth, requireRole('admin', 'trustee', 'doctor'), asyncHandler(async (_req, res) => {
    const protocols = await listProtocols();
    res.json(protocols);
  }));

  app.get('/api/protocol-assembly/protocols/member/:memberId', requireAuth, requireRole('admin', 'trustee', 'doctor'), asyncHandler(async (req, res) => {
    const { memberId } = req.params;
    if (!memberId) throw new AppError('memberId is required', 400, 'VALIDATION_ERROR');
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
    }).from(generatedProtocols).where(eq(generatedProtocols.memberId, memberId)).orderBy(desc(generatedProtocols.createdAt));
    res.json(memberProtocols);
  }));

  app.get('/api/protocol-assembly/protocols/:id', requireAuth, requireRole('admin', 'trustee', 'doctor'), asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new AppError('Invalid ID', 400, 'VALIDATION_ERROR');
    const protocol = await getProtocol(id);
    if (!protocol) throw new AppError('Protocol not found', 404, 'NOT_FOUND');
    res.json(protocol);
  }));

  app.post('/api/protocol-assembly/protocols/:id/slides', requireAuth, requireRole('admin', 'trustee', 'doctor'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
      const record = await getProtocol(id);
      if (!record) return res.status(404).json({ error: 'Protocol not found' });
      const protocol = record.protocol as Record<string, unknown>;
      const profile = record.patientProfile as Record<string, unknown>;
      const slides = await generateProtocolSlides(protocol, profile);
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
      const protocol = record.protocol as any;
      const profile = record.patientProfile as any;
      const citations = await fetchProtocolCitations(protocol, profile);
      res.json({ protocolId: id, citationCount: citations.length, citations });
    } catch (error: any) {
      console.error('[Protocol Assembly] Citations error:', error);
      res.status(500).json({ error: 'Failed to fetch citations. Please try again.' });
    }
  });
}
