import type { Express, Request, Response } from "express";
import { requireRole } from "../working-auth";
import { storage } from "../storage";
import { signNowService } from "../services/signnow";

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
}
