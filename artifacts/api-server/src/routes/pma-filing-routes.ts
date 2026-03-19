import type { Express, Request, Response } from "express";
import { db } from "../db";
import { clinics, pmaOfficers, pmaFilingDocuments } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { requireRole } from "../working-auth";
import crypto from "crypto";
import {
  generateArticlesOfAssociation,
  generateBylaws,
  generateUnifiedMembershipContract,
  generateNetworkAffiliationAgreement,
  generatePMADefenderResponse,
  type ClinicPMAData,
} from "../services/pma-document-generator";

const HMAC_SECRET = process.env.CORE_API_KEY;
if (!HMAC_SECRET) {
  console.error("[PMA Filing] CRITICAL: CORE_API_KEY not set — portal tokens will not work");
}
const PORTAL_TOKEN_EXPIRY_DAYS = 7;

function generatePortalToken(clinicId: string): string {
  if (!HMAC_SECRET) throw new Error("CORE_API_KEY not configured — cannot generate portal tokens");
  const expires = Date.now() + PORTAL_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${clinicId}:${expires}`;
  const hmac = crypto.createHmac("sha256", HMAC_SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}:${hmac}`).toString("base64url");
}

function verifyPortalToken(token: string): { clinicId: string; valid: boolean } {
  if (!HMAC_SECRET) return { clinicId: "", valid: false };
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [clinicId, expiresStr, hmac] = decoded.split(":");
    const expires = parseInt(expiresStr, 10);
    if (Date.now() > expires) return { clinicId: "", valid: false };
    const expected = crypto.createHmac("sha256", HMAC_SECRET).update(`${clinicId}:${expiresStr}`).digest("hex");
    if (hmac !== expected) return { clinicId: "", valid: false };
    return { clinicId, valid: true };
  } catch {
    return { clinicId: "", valid: false };
  }
}

export function registerPMAFilingRoutes(app: Express): void {
  app.post("/api/pma-filing/clinics", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { name, pmaName, state, city, address, phone, email, practiceType, doctorName } = req.body;
      if (!name || !state) {
        return res.status(400).json({ error: "name and state are required" });
      }

      const slug = (pmaName || name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

      const [clinic] = await db.insert(clinics).values({
        name,
        pmaName: pmaName || `${name} PMA`,
        state,
        city: city || null,
        address: address || null,
        phone: phone || null,
        email: email || null,
        practiceType: practiceType || null,
        doctorName: doctorName || null,
        slug,
        pmaType: "child",
        pmaStatus: "pending",
        parentPmaId: "forgotten-formula-pma",
        einStatus: "needs_ein",
        articlesStatus: "not_filed",
        bylawsStatus: "not_filed",
        form8832Status: "not_filed",
        form1120Status: "not_filed",
        contactStatus: "pending",
        isActive: true,
      }).returning();

      res.json({ clinic, portalToken: generatePortalToken(clinic.id) });
    } catch (err: any) {
      console.error("[PMA Filing] Create clinic error:", err.message);
      res.status(500).json({ error: "Failed to create clinic PMA" });
    }
  });

  app.get("/api/pma-filing/clinics/:id/filing-steps", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const [clinic] = await db.select().from(clinics).where(eq(clinics.id, req.params.id));
      if (!clinic) return res.status(404).json({ error: "Clinic not found" });

      const officers = await db.select().from(pmaOfficers).where(eq(pmaOfficers.clinicId, clinic.id));
      const documents = await db.select().from(pmaFilingDocuments).where(eq(pmaFilingDocuments.clinicId, clinic.id));

      const steps = [
        { step: 1, title: "Clinic Information", status: clinic.name && clinic.state ? "completed" : "pending", data: { name: clinic.name, state: clinic.state, city: clinic.city, address: clinic.address } },
        { step: 2, title: "Officer Information", status: officers.length >= 3 ? "completed" : officers.length > 0 ? "in_progress" : "pending", data: { officers, required: ["Trustee", "Secretary", "Treasurer"] } },
        { step: 3, title: "Governance Rules", status: clinic.pmaName ? "completed" : "pending" },
        { step: 4, title: "Articles of Association", status: clinic.articlesStatus === "filed" ? "completed" : documents.some(d => d.documentType === "articles") ? "generated" : "pending" },
        { step: 5, title: "Bylaws", status: clinic.bylawsStatus === "filed" ? "completed" : documents.some(d => d.documentType === "bylaws") ? "generated" : "pending" },
        { step: 6, title: "EIN Application", status: clinic.einStatus === "has_ein" ? "completed" : clinic.pmaEin ? "in_progress" : "pending", data: { ein: clinic.pmaEin } },
        { step: 7, title: "Form 8832 (Entity Classification)", status: clinic.form8832Status === "filed" ? "completed" : clinic.form8832Status === "in_progress" ? "in_progress" : "pending" },
        { step: 8, title: "Form 1120 (Annual Tax Filing)", status: clinic.form1120Status === "filed" ? "completed" : "pending" },
      ];

      const completedSteps = steps.filter(s => s.status === "completed").length;

      res.json({
        clinic: { id: clinic.id, name: clinic.name, pmaName: clinic.pmaName, state: clinic.state, pmaStatus: clinic.pmaStatus },
        steps,
        progress: { completed: completedSteps, total: steps.length, percentage: Math.round((completedSteps / steps.length) * 100) },
        documents,
      });
    } catch (err: any) {
      console.error("[PMA Filing] Get filing steps error:", err.message);
      res.status(500).json({ error: "Failed to get filing steps" });
    }
  });

  app.put("/api/pma-filing/clinics/:id/filing-steps/:step", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const stepNum = parseInt(req.params.step, 10);
      const { status, data } = req.body;

      const updateFields: Record<string, any> = {};
      switch (stepNum) {
        case 1:
          if (data) {
            if (data.name) updateFields.name = data.name;
            if (data.state) updateFields.state = data.state;
            if (data.city) updateFields.city = data.city;
            if (data.address) updateFields.address = data.address;
            if (data.phone) updateFields.phone = data.phone;
            if (data.email) updateFields.email = data.email;
            if (data.practiceType) updateFields.practiceType = data.practiceType;
            if (data.pmaName) updateFields.pmaName = data.pmaName;
          }
          break;
        case 4:
          updateFields.articlesStatus = status === "completed" ? "filed" : status;
          break;
        case 5:
          updateFields.bylawsStatus = status === "completed" ? "filed" : status;
          break;
        case 6:
          if (data?.ein) updateFields.pmaEin = data.ein;
          updateFields.einStatus = status === "completed" ? "has_ein" : status;
          break;
        case 7:
          updateFields.form8832Status = status === "completed" ? "filed" : status;
          break;
        case 8:
          updateFields.form1120Status = status === "completed" ? "filed" : status;
          break;
      }

      if (Object.keys(updateFields).length > 0) {
        await db.update(clinics).set(updateFields).where(eq(clinics.id, req.params.id));
      }

      const allFiled = await checkAllStepsCompleted(req.params.id);
      if (allFiled) {
        await db.update(clinics).set({ pmaStatus: "active" }).where(eq(clinics.id, req.params.id));
      }

      res.json({ success: true, allCompleted: allFiled });
    } catch (err: any) {
      console.error("[PMA Filing] Update filing step error:", err.message);
      res.status(500).json({ error: "Failed to update filing step" });
    }
  });

  app.post("/api/pma-filing/clinics/:id/officers", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { fullName, role, email, phone } = req.body;
      if (!fullName || !role) {
        return res.status(400).json({ error: "fullName and role are required" });
      }

      const [officer] = await db.insert(pmaOfficers).values({
        clinicId: req.params.id,
        fullName,
        role,
        email: email || null,
        phone: phone || null,
      }).returning();

      res.json({ officer });
    } catch (err: any) {
      console.error("[PMA Filing] Add officer error:", err.message);
      res.status(500).json({ error: "Failed to add officer" });
    }
  });

  app.delete("/api/pma-filing/clinics/:id/officers/:officerId", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      await db.delete(pmaOfficers).where(
        and(eq(pmaOfficers.id, req.params.officerId), eq(pmaOfficers.clinicId, req.params.id))
      );
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to remove officer" });
    }
  });

  app.get("/api/pma-filing/clinics/:id/officers", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const officers = await db.select().from(pmaOfficers).where(eq(pmaOfficers.clinicId, req.params.id));
      res.json({ officers });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to get officers" });
    }
  });

  app.post("/api/pma-filing/clinics/:id/generate-documents", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { documentTypes } = req.body;
      const types: string[] = documentTypes || ["articles", "bylaws", "umc", "naa"];

      const [clinic] = await db.select().from(clinics).where(eq(clinics.id, req.params.id));
      if (!clinic) return res.status(404).json({ error: "Clinic not found" });

      const officers = await db.select().from(pmaOfficers).where(eq(pmaOfficers.clinicId, clinic.id));

      const clinicData: ClinicPMAData = {
        clinicName: clinic.name,
        pmaName: clinic.pmaName || `${clinic.name} PMA`,
        state: clinic.state || "Texas",
        city: clinic.city || "",
        address: clinic.address || "",
        practiceType: clinic.practiceType || "Holistic Health",
        officers: officers.map(o => ({ fullName: o.fullName, role: o.role, email: o.email || undefined })),
      };

      const generated: any[] = [];

      for (const docType of types) {
        let content: string;
        let title: string;

        switch (docType) {
          case "articles":
            console.log(`[PMA Filing] Generating Articles of Association for ${clinic.name}...`);
            content = await generateArticlesOfAssociation(clinicData);
            title = `Articles of Association — ${clinicData.pmaName}`;
            break;
          case "bylaws":
            console.log(`[PMA Filing] Generating Bylaws for ${clinic.name}...`);
            content = await generateBylaws(clinicData);
            title = `Bylaws — ${clinicData.pmaName}`;
            break;
          case "umc":
            content = generateUnifiedMembershipContract(clinicData);
            title = `Unified Membership Contract (FFPMA-UMC-2.0) — ${clinicData.pmaName}`;
            break;
          case "naa":
            content = generateNetworkAffiliationAgreement(clinicData);
            title = `Network Affiliation Agreement (FFPMA-NAA-1.0) — ${clinicData.pmaName}`;
            break;
          default:
            continue;
        }

        const [doc] = await db.insert(pmaFilingDocuments).values({
          clinicId: clinic.id,
          documentType: docType,
          title,
          content,
          status: "generated",
          generatedBy: "pma-filing-manager",
        }).returning();

        generated.push(doc);
      }

      if (types.includes("articles")) {
        await db.update(clinics).set({ articlesStatus: "generated" }).where(eq(clinics.id, clinic.id));
      }
      if (types.includes("bylaws")) {
        await db.update(clinics).set({ bylawsStatus: "generated" }).where(eq(clinics.id, clinic.id));
      }

      console.log(`[PMA Filing] Generated ${generated.length} documents for ${clinic.name}`);
      res.json({ documents: generated, count: generated.length });
    } catch (err: any) {
      console.error("[PMA Filing] Generate documents error:", err.message);
      res.status(500).json({ error: "Failed to generate documents" });
    }
  });

  app.get("/api/pma-filing/clinics/:id/documents", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const documents = await db.select().from(pmaFilingDocuments).where(eq(pmaFilingDocuments.clinicId, req.params.id));
      res.json({ documents });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to get documents" });
    }
  });

  app.get("/api/pma-filing/clinics/:id/documents/:docId", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const [doc] = await db.select().from(pmaFilingDocuments).where(
        and(eq(pmaFilingDocuments.id, req.params.docId), eq(pmaFilingDocuments.clinicId, req.params.id))
      );
      if (!doc) return res.status(404).json({ error: "Document not found" });
      res.json({ document: doc });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to get document" });
    }
  });

  app.get("/api/pma-filing/clinics/:id/portal-token", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const [clinic] = await db.select().from(clinics).where(eq(clinics.id, req.params.id));
      if (!clinic) return res.status(404).json({ error: "Clinic not found" });
      const token = generatePortalToken(clinic.id);
      res.json({ token, expiresInDays: PORTAL_TOKEN_EXPIRY_DAYS });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to generate portal token" });
    }
  });

  app.get("/api/pma-filing/portal/:token", async (req: Request, res: Response) => {
    try {
      const { clinicId, valid } = verifyPortalToken(req.params.token);
      if (!valid) return res.status(401).json({ error: "Invalid or expired portal token" });

      const [clinic] = await db.select().from(clinics).where(eq(clinics.id, clinicId));
      if (!clinic) return res.status(404).json({ error: "Clinic not found" });

      const officers = await db.select().from(pmaOfficers).where(eq(pmaOfficers.clinicId, clinicId));
      const documents = await db.select().from(pmaFilingDocuments).where(eq(pmaFilingDocuments.clinicId, clinicId));

      res.json({
        clinic: {
          id: clinic.id,
          name: clinic.name,
          pmaName: clinic.pmaName,
          state: clinic.state,
          city: clinic.city,
          pmaStatus: clinic.pmaStatus,
          einStatus: clinic.einStatus,
          articlesStatus: clinic.articlesStatus,
          bylawsStatus: clinic.bylawsStatus,
          form8832Status: clinic.form8832Status,
          form1120Status: clinic.form1120Status,
        },
        officers,
        documents: documents.map(d => ({ id: d.id, title: d.title, documentType: d.documentType, status: d.status, createdAt: d.createdAt })),
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to load portal data" });
    }
  });

  app.post("/api/pma-filing/defender/chat", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { question, clinicContext } = req.body;
      if (!question) return res.status(400).json({ error: "question is required" });

      console.log(`[PMA Defender] Question: ${question.substring(0, 80)}...`);
      const answer = await generatePMADefenderResponse(question, clinicContext);
      res.json({ answer });
    } catch (err: any) {
      console.error("[PMA Defender] Chat error:", err.message);
      res.status(500).json({ error: "Failed to get PMA Defender response" });
    }
  });

  app.get("/api/pma-filing/tax-guidance", requireRole("admin"), async (_req: Request, res: Response) => {
    res.json({
      einApplication: {
        title: "EIN Application (IRS Form SS-4)",
        steps: [
          "Go to IRS.gov/EIN and click 'Apply Online Now'",
          "Select 'View Additional Types, Including Tax-Exempt and Governmental Organizations'",
          "Select 'Other' for entity type",
          "Write in 'Unincorporated Association' when prompted",
          "Select 'Banking purposes' as reason for applying",
          "Enter the PMA's legal name as shown in Articles of Association",
          "Enter the Trustee's SSN as the responsible party",
          "Complete remaining fields and submit",
          "Save the CP 575 confirmation letter — this is your EIN assignment notice",
        ],
        warnings: [
          "Do NOT select LLC, Corporation, or Partnership",
          "Do NOT file as a nonprofit or tax-exempt organization",
          "The EIN is for the PMA entity, not the individual",
        ],
      },
      form8832: {
        title: "IRS Form 8832 — Entity Classification Election",
        purpose: "Elect to be taxed as a corporation at the 21% corporate tax rate",
        steps: [
          "Download Form 8832 from IRS.gov",
          "Enter the PMA's EIN and legal name",
          "Check 'Association taxable as a corporation' in Part I, Item 5",
          "Enter the effective date (date of PMA formation)",
          "Have the Trustee sign as the authorized representative",
          "Mail to the IRS address specified in the form instructions",
          "Keep a copy for your records — the IRS will send confirmation",
        ],
        keyPoints: [
          "Each Affiliated Clinic files Form 8832 INDEPENDENTLY",
          "No parent entity is listed on the form",
          "The constitutional affiliation with the Mother PMA is through the NAA, not the tax filing",
        ],
      },
      form1120: {
        title: "IRS Form 1120 — Corporate Tax Return",
        purpose: "Annual tax return filed at the 21% corporate tax rate",
        steps: [
          "File annually by the 15th day of the 4th month after fiscal year end",
          "Report all PMA revenue and expenses",
          "Tax rate: flat 21% corporate rate",
          "Consider hiring a tax professional experienced with PMAs",
        ],
        taxProfessional: {
          name: "Susan Carlton",
          email: "susan@carltontax.com",
          phone: "+1 (585) 402-3651",
          note: "Susan is experienced with PMA tax filings and can assist with Form 1120",
        },
      },
      bankingSetup: {
        title: "Opening a Business Bank Account for Your PMA",
        whatToBring: [
          "IRS CP 575 Letter (EIN confirmation)",
          "Articles of Association (signed and dated)",
          "Bylaws",
          "Government-issued ID for the Trustee",
          "Form 8832 confirmation (if received)",
        ],
        whatToSay: [
          "Tell the bank you are opening an account for an unincorporated association",
          "Present your EIN and Articles of Association",
          "The account should be in the PMA's legal name",
          "The Trustee is the authorized signer",
        ],
        bankPushback: [
          "If the bank asks for LLC documents, explain that PMAs are unincorporated associations recognized by the IRS",
          "Show your CP 575 letter as proof of IRS recognition",
          "If they refuse, try a different branch or bank — Credit unions and community banks are often more accommodating",
          "Chase, Bank of America, and Wells Fargo have successfully opened PMA accounts",
        ],
      },
    });
  });

  console.log("[PMA Filing] Routes registered: /api/pma-filing/*");
}

async function checkAllStepsCompleted(clinicId: string): Promise<boolean> {
  const [clinic] = await db.select().from(clinics).where(eq(clinics.id, clinicId));
  if (!clinic) return false;

  const officers = await db.select().from(pmaOfficers).where(eq(pmaOfficers.clinicId, clinicId));

  return (
    clinic.name !== null &&
    clinic.state !== null &&
    officers.length >= 3 &&
    clinic.articlesStatus === "filed" &&
    clinic.bylawsStatus === "filed" &&
    clinic.einStatus === "has_ein" &&
    clinic.form8832Status === "filed"
  );
}
