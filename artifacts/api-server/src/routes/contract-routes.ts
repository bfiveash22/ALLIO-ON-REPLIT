import type { Express, Request, Response } from "express";
import { requireRole } from "../working-auth";
import { storage } from "../storage";
import { signNowService } from "../services/signnow";
import { getTrusteeSigningDocuments } from "../services/legal-documents";

const DOCTOR_TEMPLATE_ID = process.env.SIGNNOW_DOCTOR_ONBOARDING_TEMPLATE_ID || process.env.SIGNNOW_DOCTOR_TEMPLATE_ID || '253597f6c6724abd976af62a69b3e0a5b92b38dd';
const MEMBER_TEMPLATE_ID = process.env.SIGNNOW_MEMBER_TEMPLATE_ID || '';

export function registerContractRoutes(app: Express): void {
  app.post("/api/signnow/doctor-agreement", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { templateId, doctorName, doctorEmail, clinicName, licenseNumber, specialization, phone, clinicId } = req.body;

      if (!doctorName || !doctorEmail) {
        return res.status(400).json({ error: "doctorName and doctorEmail are required" });
      }

      const corporateClinic = await storage.getClinicByWpId(2);
      if (corporateClinic?.signNowDoctorLink) {
        const contract = await storage.createContract({
          userId: (req as any).user?.claims?.sub || 'anonymous',
          clinicId: corporateClinic.id,
          templateId: templateId || DOCTOR_TEMPLATE_ID,
          signNowDocumentId: null,
          signNowEnvelopeId: null,
          embeddedSigningUrl: corporateClinic.signNowDoctorLink,
          doctorName,
          doctorEmail,
          clinicName: clinicName || null,
          licenseNumber: licenseNumber || null,
          specialization: specialization || null,
          phone: phone || null,
          status: "pending",
        });

        return res.json({
          documentId: null,
          signingUrl: corporateClinic.signNowDoctorLink,
          contractId: contract.id,
          contractUrl: `/contracts/${contract.id}/sign`,
          useReusableLink: true,
        });
      }

      const effectiveTemplateId = templateId || DOCTOR_TEMPLATE_ID;

      if (!effectiveTemplateId) {
        return res.status(400).json({ error: "No doctor agreement template configured" });
      }

      const result = await signNowService.createDoctorAgreement(effectiveTemplateId, {
        doctorName,
        doctorEmail,
        clinicName,
        licenseNumber,
      });

      const contract = await storage.createContract({
        userId: (req as any).user?.claims?.sub || 'anonymous',
        clinicId: null,
        templateId: effectiveTemplateId,
        signNowDocumentId: result.documentId,
        signNowEnvelopeId: null,
        embeddedSigningUrl: result.signingUrl,
        doctorName,
        doctorEmail,
        clinicName: clinicName || null,
        licenseNumber: licenseNumber || null,
        specialization: specialization || null,
        phone: phone || null,
        status: "pending",
      });

      res.json({
        ...result,
        contractId: contract.id,
        contractUrl: `/contracts/${contract.id}/sign`,
      });
    } catch (error: any) {
      console.error("Error creating doctor agreement:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/signnow/member-agreement", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { templateId, memberName, memberEmail, clinicId } = req.body;

      if (!memberName || !memberEmail) {
        return res.status(400).json({ error: "memberName and memberEmail are required" });
      }

      let clinic = null;
      if (clinicId) {
        clinic = await storage.getClinicByWpId(parseInt(clinicId));
        if (clinic?.signNowMemberLink) {
          const contract = await storage.createContract({
            userId: (req as any).user?.claims?.sub || 'anonymous',
            clinicId: clinic.id,
            templateId: templateId || clinic.signNowTemplateId || MEMBER_TEMPLATE_ID,
            signNowDocumentId: null,
            signNowEnvelopeId: null,
            embeddedSigningUrl: clinic.signNowMemberLink,
            doctorName: memberName,
            doctorEmail: memberEmail,
            clinicName: clinic.name,
            licenseNumber: null,
            specialization: null,
            phone: null,
            status: "pending",
          });

          return res.json({
            documentId: null,
            signingUrl: clinic.signNowMemberLink,
            contractId: contract.id,
            contractUrl: `/contracts/${contract.id}/sign`,
            useReusableLink: true,
          });
        }
      }

      const effectiveTemplateId = templateId || (clinic?.signNowTemplateId) || MEMBER_TEMPLATE_ID;

      if (!effectiveTemplateId) {
        return res.status(400).json({ error: "No member agreement template configured. Please set SIGNNOW_MEMBER_TEMPLATE_ID" });
      }

      const result = await signNowService.createMemberAgreement(effectiveTemplateId, {
        memberName,
        memberEmail,
      });

      const contract = await storage.createContract({
        userId: (req as any).user?.claims?.sub || 'anonymous',
        clinicId: clinic?.id || null,
        templateId: effectiveTemplateId,
        signNowDocumentId: result.documentId,
        signNowEnvelopeId: null,
        embeddedSigningUrl: result.signingUrl,
        doctorName: memberName,
        doctorEmail: memberEmail,
        clinicName: clinic?.name || null,
        licenseNumber: null,
        specialization: null,
        phone: null,
        status: "pending",
      });

      res.json({
        ...result,
        contractId: contract.id,
        contractUrl: `/contracts/${contract.id}/sign`,
      });
    } catch (error: any) {
      console.error("Error creating member agreement:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/contracts", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const contracts = await storage.getContractsByUser(userId);
      res.json(contracts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/contracts/:id", async (req: Request, res: Response) => {
    try {
      const contract = await storage.getContract(req.params.id);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }
      res.json(contract);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/contracts/:id/refresh-url", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const contract = await storage.getContract(req.params.id);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }

      if (!contract.signNowDocumentId) {
        return res.status(400).json({ error: "No SignNow document associated with this contract" });
      }

      const roles = await signNowService.getDocumentRoles(contract.signNowDocumentId);
      const signerRole = roles.find((r: any) => r.name?.toLowerCase().includes('signer')) || roles[0];

      if (!signerRole) {
        return res.status(400).json({ error: "No signer role found on document" });
      }

      const signerEmail = contract.doctorEmail || 'signer@example.com';
      const inviteResult = await signNowService.createEmbeddedInvite(
        contract.signNowDocumentId,
        signerEmail,
        signerRole.unique_id
      );

      const inviteId = inviteResult.id || (inviteResult as any).data?.[0]?.id;
      if (!inviteId) {
        return res.status(500).json({ error: "Failed to create embedded invite" });
      }

      const linkResult = await signNowService.generateSigningLink(contract.signNowDocumentId, inviteId, 60);

      await storage.updateContract(contract.id, {
        embeddedSigningUrl: linkResult.link
      });

      res.json({ signingUrl: linkResult.link });
    } catch (error: any) {
      console.error("Error refreshing signing URL:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/contracts/:id", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      if (!["signed", "completed", "pending"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      const contract = await storage.updateContract(req.params.id, {
        status,
        signedAt: status === 'signed' ? new Date() : undefined
      });
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }
      res.json(contract);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/legal/signing-documents", requireRole("admin"), async (_req: Request, res: Response) => {
    try {
      const signingDocs = getTrusteeSigningDocuments();
      const existingLegalDocs = await storage.getAllLegalDocuments();

      const documentsWithStatus = signingDocs.map(doc => {
        const existing = existingLegalDocs.find(d =>
          d.title === doc.title ||
          (d.content && d.content.includes(doc.slug))
        );
        return {
          ...doc,
          legalDocId: existing?.id || null,
          signNowDocId: existing?.signNowDocId || null,
          status: existing?.status || 'draft',
          createdAt: existing?.createdAt || null,
          updatedAt: existing?.updatedAt || null,
        };
      });

      res.json(documentsWithStatus);
    } catch (error: any) {
      console.error("Error fetching signing documents:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/legal/signing-documents/:slug/prepare", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const signingDocs = getTrusteeSigningDocuments();
      const doc = signingDocs.find(d => d.slug === slug);

      if (!doc) {
        return res.status(404).json({ error: "Document not found" });
      }

      const existingLegalDocs = await storage.getAllLegalDocuments();
      let legalDoc = existingLegalDocs.find(d => d.title === doc.title);

      if (!legalDoc) {
        legalDoc = await storage.createLegalDocument({
          title: doc.title,
          docType: doc.docType,
          status: 'review',
          description: doc.description,
          content: doc.content,
          assignedAgent: 'THEMIS',
          priority: doc.category === 'trademark' ? 'high' : 'normal',
          jurisdiction: 'United States',
          createdBy: 'THEMIS',
        });
      } else if (legalDoc.status === 'draft') {
        legalDoc = (await storage.updateLegalDocument(legalDoc.id, {
          status: 'review',
          content: doc.content,
          description: doc.description,
        }))!;
      }

      try {
        const signerEmail = process.env.SIGNNOW_USERNAME || process.env.SIGNNOW_EMAIL || 'trustee@forgottenformula.com';
        const docText = formatDocumentAsText(doc.title, doc.content);

        const templateResult = await signNowService.uploadAndCreateTemplate(
          Buffer.from(docText),
          `${slug}.txt`,
          `Legal - ${doc.title}`,
          'Trustee'
        );

        const docCopy = await signNowService.createFromTemplate(
          templateResult.templateId,
          `${doc.title} - ${new Date().toISOString().split('T')[0]}`
        );

        await storage.updateLegalDocument(legalDoc.id, {
          signNowDocId: docCopy.id,
          signNowTemplateId: templateResult.templateId,
          status: 'pending_signature',
        });

        const signingSession = await signNowService.createEmbeddedSigningSession(
          docCopy.id,
          signerEmail,
          'Trustee'
        );

        res.json({
          legalDocId: legalDoc.id,
          signNowDocId: docCopy.id,
          templateId: templateResult.templateId,
          signingUrl: signingSession.signingUrl,
          embeddedUrl: signingSession.embeddedUrl,
          status: 'pending_signature',
        });
      } catch (signNowError: any) {
        console.error("SignNow template/invite error:", signNowError.message);
        res.json({
          legalDocId: legalDoc.id,
          signNowDocId: null,
          signingUrl: null,
          embeddedUrl: null,
          status: 'review',
          signNowError: signNowError.message,
          message: 'Document saved for review but SignNow upload failed. Configure SignNow credentials to enable digital signing.',
        });
      }
    } catch (error: any) {
      console.error("Error preparing signing document:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/legal/signing-documents/:slug/signing-link", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const signingDocs = getTrusteeSigningDocuments();
      const doc = signingDocs.find(d => d.slug === slug);

      if (!doc) {
        return res.status(404).json({ error: "Document not found" });
      }

      const existingLegalDocs = await storage.getAllLegalDocuments();
      const legalDoc = existingLegalDocs.find(d => d.title === doc.title);

      if (!legalDoc?.signNowDocId) {
        return res.status(400).json({ error: "Document has not been uploaded to SignNow yet. Use the prepare endpoint first." });
      }

      const signerEmail = process.env.SIGNNOW_USERNAME || process.env.SIGNNOW_EMAIL || 'trustee@forgottenformula.com';

      const signingSession = await signNowService.createEmbeddedSigningSession(
        legalDoc.signNowDocId,
        signerEmail,
        'Trustee'
      );

      res.json({
        signingUrl: signingSession.signingUrl,
        embeddedUrl: signingSession.embeddedUrl,
        signNowDocId: legalDoc.signNowDocId,
      });
    } catch (error: any) {
      console.error("Error generating signing link:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/legal/signing-documents/prepare-all", requireRole("admin"), async (_req: Request, res: Response) => {
    try {
      const signingDocs = getTrusteeSigningDocuments();
      const results: Array<{
        slug: string;
        title: string;
        legalDocId: string;
        signNowDocId: string | null;
        templateId?: string | null;
        status: string;
        error?: string;
      }> = [];

      for (const doc of signingDocs) {
        try {
          const existingLegalDocs = await storage.getAllLegalDocuments();
          let legalDoc = existingLegalDocs.find(d => d.title === doc.title);

          if (!legalDoc) {
            legalDoc = await storage.createLegalDocument({
              title: doc.title,
              docType: doc.docType,
              status: 'review',
              description: doc.description,
              content: doc.content,
              assignedAgent: 'THEMIS',
              priority: doc.category === 'trademark' ? 'high' : 'normal',
              jurisdiction: 'United States',
              createdBy: 'THEMIS',
            });
          } else if (!legalDoc.signNowDocId && legalDoc.status === 'draft') {
            legalDoc = (await storage.updateLegalDocument(legalDoc.id, {
              status: 'review',
              content: doc.content,
              description: doc.description,
            }))!;
          }

          let signNowDocId: string | null = legalDoc.signNowDocId || null;

          if (!signNowDocId) {
            try {
              const docText = formatDocumentAsText(doc.title, doc.content);
              const templateResult = await signNowService.uploadAndCreateTemplate(
                Buffer.from(docText),
                `${doc.slug}.txt`,
                `Legal - ${doc.title}`,
                'Trustee'
              );
              const docCopy = await signNowService.createFromTemplate(
                templateResult.templateId,
                `${doc.title} - ${new Date().toISOString().split('T')[0]}`
              );
              signNowDocId = docCopy.id;
              await storage.updateLegalDocument(legalDoc.id, {
                signNowDocId,
                signNowTemplateId: templateResult.templateId,
                status: 'pending_signature',
              });
            } catch (uploadError: any) {
              console.error(`Failed to create template for ${doc.slug}:`, uploadError.message);
            }
          }

          const updatedDoc = await storage.getLegalDocument(legalDoc.id);
          results.push({
            slug: doc.slug,
            title: doc.title,
            legalDocId: legalDoc.id,
            signNowDocId: updatedDoc?.signNowDocId || signNowDocId,
            templateId: updatedDoc?.signNowTemplateId || null,
            status: signNowDocId ? 'pending_signature' : (updatedDoc?.status || legalDoc.status || 'review'),
          });
        } catch (docError: any) {
          results.push({
            slug: doc.slug,
            title: doc.title,
            legalDocId: '',
            signNowDocId: null,
            status: 'error',
            error: docError.message,
          });
        }
      }

      res.json({
        message: `Prepared ${results.length} legal documents for signing.`,
        documents: results,
      });
    } catch (error: any) {
      console.error("Error preparing all signing documents:", error);
      res.status(500).json({ error: error.message });
    }
  });
}

function formatDocumentAsText(title: string, markdownContent: string): string {
  const plainText = markdownContent
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/---/g, '────────────────────────────────────')
    .replace(/\|.*\|/g, (match) => match.replace(/\|/g, '\t'))
    .replace(/✓/g, '[X]')
    .replace(/☐/g, '[ ]')
    .replace(/☒/g, '[X]');

  return `${title}\n${'='.repeat(title.length)}\n\n${plainText}\n`;
}
