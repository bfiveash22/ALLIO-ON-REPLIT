import type { Express, Request, Response } from "express";
import { requireAuth, requireRole } from "../working-auth";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { doctorOnboarding, memberEnrollment, doctorAppointments, doctorPatientMessages } from "@shared/schema";
import { signNowService } from "../services/signnow";
import { wordPressAuthService } from "../services/wordpress-auth";
import { triggerWelcomeOnSignup } from "../services/enrollment-automation";

const DOCTOR_ONBOARDING_TEMPLATE = process.env.SIGNNOW_DOCTOR_ONBOARDING_TEMPLATE_ID || '253597f6c6724abd976af62a69b3e0a5b92b38dd';
const MEMBER_ONBOARDING_TEMPLATE = process.env.SIGNNOW_MEMBER_TEMPLATE_ID || '';
const DOCTOR_MEMBERSHIP_PRODUCT_ID = process.env.WC_DOCTOR_MEMBERSHIP_PRODUCT_ID || '5000';
const WOOCOMMERCE_URL = process.env.WOOCOMMERCE_URL || 'https://forgottenformula.com';
const SIGNNOW_WEBHOOK_SECRET = process.env.SIGNNOW_WEBHOOK_SECRET || '';

async function generateUniqueDoctorCode(maxRetries = 10): Promise<string> {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const doctorCode = `DR-${code}`;
    const existing = await db.query.doctorOnboarding.findFirst({
      where: (d, { eq }) => eq(d.doctorCode, doctorCode)
    });
    if (!existing) return doctorCode;
  }
  throw new Error('Unable to generate unique doctor code after max retries');
}

function verifySignNowWebhook(req: Request): { valid: boolean; error?: string } {
  const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
  if (!SIGNNOW_WEBHOOK_SECRET) {
    if (isDevelopment) {
      console.warn("DEV MODE: SIGNNOW_WEBHOOK_SECRET not configured - webhook verification bypassed");
      return { valid: true };
    }
    console.error("SIGNNOW_WEBHOOK_SECRET not configured - rejecting webhook in production");
    return { valid: false, error: "Webhook secret not configured" };
  }
  const signature = req.headers['x-signnow-signature'] || req.headers['x-event-signature'];
  if (!signature) return { valid: false, error: "Missing signature header" };
  const rawBody = (req as any).rawBody as Buffer | undefined;
  if (!rawBody) return { valid: false, error: "Raw body not available" };
  const crypto = require('crypto');
  const expectedSignature = crypto.createHmac('sha256', SIGNNOW_WEBHOOK_SECRET).update(rawBody).digest('hex');
  const signatureStr = Array.isArray(signature) ? signature[0] : signature;
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
  const providedBuffer = Buffer.from(signatureStr, 'utf8');
  if (expectedBuffer.length !== providedBuffer.length) return { valid: false, error: "Invalid signature" };
  const isValid = crypto.timingSafeEqual(providedBuffer, expectedBuffer);
  if (!isValid) return { valid: false, error: "Invalid signature" };
  return { valid: true };
}

export function registerOnboardingRoutes(app: Express): void {
  app.post("/api/onboarding/doctor/start", async (req: Request, res: Response) => {
    try {
      const { email, fullName, clinicName, licenseNumber, practiceType, phone, referredBy } = req.body;
      if (!email || !fullName) return res.status(400).json({ error: "email and fullName are required" });
      if (!DOCTOR_ONBOARDING_TEMPLATE) return res.status(500).json({ error: "Doctor onboarding template not configured" });

      const doctorCode = await generateUniqueDoctorCode();
      const signNowResult = await signNowService.createDoctorAgreement(DOCTOR_ONBOARDING_TEMPLATE, {
        doctorName: fullName, doctorEmail: email, clinicName, licenseNumber,
      });

      const onboardingRecord = await db.insert(doctorOnboarding).values({
        email, fullName, clinicName, licenseNumber, practiceType, phone,
        status: 'document_sent',
        signNowDocumentId: signNowResult.documentId,
        signNowTemplateId: DOCTOR_ONBOARDING_TEMPLATE,
        signingUrl: signNowResult.signingUrl,
        doctorCode,
        memberSignupUrl: `/join/${doctorCode}`,
        referredBy,
      }).returning();

      res.json({ success: true, onboardingId: onboardingRecord[0].id, doctorCode, signingUrl: signNowResult.signingUrl, documentId: signNowResult.documentId });
    } catch (error: any) {
      console.error("Error starting doctor onboarding:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/onboarding/doctor/:id", async (req: Request, res: Response) => {
    try {
      const record = await db.query.doctorOnboarding.findFirst({ where: (d, { eq }) => eq(d.id, req.params.id) });
      if (!record) return res.status(404).json({ error: "Onboarding record not found" });
      res.json(record);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.get("/api/doctors/:code", async (req: Request, res: Response) => {
    try {
      const doctor = await db.query.doctorOnboarding.findFirst({
        where: (d, { eq, and }) => and(eq(d.doctorCode, req.params.code), eq(d.status, 'completed'))
      });
      if (!doctor) return res.status(404).json({ error: "Doctor not found or not yet active" });
      res.json({ doctorCode: doctor.doctorCode, clinicName: doctor.clinicName, practiceType: doctor.practiceType });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.post("/api/onboarding/member/start", async (req: Request, res: Response) => {
    try {
      const { email, fullName, phone, doctorCode } = req.body;
      if (!email || !fullName || !doctorCode) return res.status(400).json({ error: "email, fullName, and doctorCode are required" });

      const doctor = await db.query.doctorOnboarding.findFirst({
        where: (d, { eq, and }) => and(eq(d.doctorCode, doctorCode), eq(d.status, 'completed'))
      });
      if (!doctor) return res.status(400).json({ error: "Invalid doctor code or doctor not yet active" });
      if (!MEMBER_ONBOARDING_TEMPLATE) return res.status(500).json({ error: "Member template not configured" });

      const signNowResult = await signNowService.createMemberAgreement(MEMBER_ONBOARDING_TEMPLATE, { memberName: fullName, memberEmail: email });

      const enrollmentRecord = await db.insert(memberEnrollment).values({
        email, fullName, phone, doctorCode,
        status: 'document_sent',
        signNowDocumentId: signNowResult.documentId,
        signingUrl: signNowResult.signingUrl,
      }).returning();

      triggerWelcomeOnSignup(email, fullName, doctorCode).then((result) => {
        if (result.emailSent) {
          console.log(`[enrollment] Welcome email sent to ${email}`);
        } else {
          console.warn(`[enrollment] Welcome email failed for ${email}: ${result.error}`);
        }
      }).catch((err) => {
        console.error(`[enrollment] Welcome email error for ${email}:`, err.message);
      });

      res.json({ success: true, enrollmentId: enrollmentRecord[0].id, signingUrl: signNowResult.signingUrl, documentId: signNowResult.documentId, doctorClinic: doctor.clinicName });
    } catch (error: any) {
      console.error("Error starting member enrollment:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/webhooks/signnow", async (req: Request, res: Response) => {
    try {
      const verification = verifySignNowWebhook(req);
      if (!verification.valid) return res.status(401).json({ error: `Unauthorized - ${verification.error}` });

      const { event, document_id } = req.body;
      console.log("SignNow webhook received:", { event, document_id });

      if (event === 'document_complete' || event === 'document.complete') {
        const doctorRecord = await db.query.doctorOnboarding.findFirst({ where: (d, { eq }) => eq(d.signNowDocumentId, document_id) });
        if (doctorRecord) {
          if (doctorRecord.status !== 'document_sent') return res.json({ success: true, type: 'doctor_onboarding', skipped: true });
          await db.update(doctorOnboarding).set({ status: 'document_signed', documentSignedAt: new Date(), updatedAt: new Date() }).where(eq(doctorOnboarding.signNowDocumentId, document_id));
          return res.json({ success: true, type: 'doctor_onboarding' });
        }
        const memberRecord = await db.query.memberEnrollment.findFirst({ where: (m, { eq }) => eq(m.signNowDocumentId, document_id) });
        if (memberRecord) {
          if (memberRecord.status !== 'document_sent') return res.json({ success: true, type: 'member_enrollment', skipped: true });
          await db.update(memberEnrollment).set({ status: 'document_signed', documentSignedAt: new Date(), updatedAt: new Date() }).where(eq(memberEnrollment.signNowDocumentId, document_id));
          return res.json({ success: true, type: 'member_enrollment' });
        }
      }
      res.json({ success: true, message: 'Webhook processed' });
    } catch (error: any) {
      console.error("SignNow webhook error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/onboarding/doctor/:id/complete", async (req: Request, res: Response) => {
    try {
      const { wcOrderId } = req.body;
      const record = await db.query.doctorOnboarding.findFirst({ where: (d, { eq }) => eq(d.id, req.params.id) });
      if (!record) return res.status(404).json({ error: "Onboarding record not found" });
      if (record.status !== 'document_signed') return res.status(400).json({ error: `Cannot complete onboarding in '${record.status}' status. Document must be signed first.` });
      if (!wcOrderId) return res.status(400).json({ error: "wcOrderId is required to verify payment" });

      const nameParts = (record.fullName || '').trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      let wpUserId: number | null = null;
      const wpResult = await wordPressAuthService.createUser({
        email: record.email, firstName, lastName, role: 'doctor',
        meta: { doctor_code: record.doctorCode || '', clinic_name: record.clinicName || '', license_number: record.licenseNumber || '', practice_type: record.practiceType || '', onboarding_id: String(record.id) },
      });
      if (wpResult.success && wpResult.user) { wpUserId = wpResult.user.id; }

      await db.update(doctorOnboarding).set({ status: 'completed', wcOrderId: parseInt(wcOrderId), wpUserId, paymentCompletedAt: new Date(), updatedAt: new Date() }).where(eq(doctorOnboarding.id, req.params.id));

      res.json({ success: true, doctorCode: record.doctorCode, memberSignupUrl: `${WOOCOMMERCE_URL}/member-signup-clinic/?clinic_id=${record.doctorCode}`, dashboardUrl: '/doctors', wpUserId });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.get("/api/onboarding/doctor/:id/checkout", async (req: Request, res: Response) => {
    try {
      const record = await db.query.doctorOnboarding.findFirst({ where: (d, { eq }) => eq(d.id, req.params.id) });
      if (!record) return res.status(404).json({ error: "Onboarding record not found" });
      const checkoutUrl = `${WOOCOMMERCE_URL}/?add-to-cart=${DOCTOR_MEMBERSHIP_PRODUCT_ID}&onboarding_id=${record.id}&doctor_code=${record.doctorCode}`;
      res.json({ checkoutUrl, productId: DOCTOR_MEMBERSHIP_PRODUCT_ID, doctorCode: record.doctorCode });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.get("/api/doctor/referral", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub || (req as any).session?.passport?.user?.claims?.sub;
      let userEmail: string | null = null;
      if (userId) {
        const user = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.id, userId) });
        userEmail = user?.email || null;
      }
      if (!userEmail) userEmail = (req as any).session?.passport?.user?.email || null;
      if (!userEmail) return res.status(401).json({ error: "Not authenticated" });

      const doctor = await db.query.doctorOnboarding.findFirst({
        where: (d, { eq, and }) => and(eq(d.email, userEmail!), eq(d.status, 'completed'))
      });

      if (!doctor) {
        const profile = await db.query.memberProfiles.findFirst({ where: (p, { eq }) => eq(p.userId, userId || '') });
        if (profile?.role !== 'doctor' && profile?.role !== 'admin') return res.status(404).json({ error: "No active doctor profile found for this email" });
        return res.json({ doctorCode: null, memberSignupUrl: null, allioSignupUrl: null, enrolledMemberCount: 0, clinicName: null, practiceType: null, isAdmin: true });
      }

      const enrolledMembers = await db.query.memberEnrollment.findMany({ where: (m, { eq }) => eq(m.doctorCode, doctor.doctorCode || '') });
      res.json({ doctorCode: doctor.doctorCode, memberSignupUrl: `${WOOCOMMERCE_URL}/member-signup-clinic/?clinic_id=${doctor.doctorCode}`, allioSignupUrl: `/join/${doctor.doctorCode}`, enrolledMemberCount: enrolledMembers.length, clinicName: doctor.clinicName, practiceType: doctor.practiceType });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.get("/api/doctor/members", requireRole("admin", "doctor"), async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub || (req as any).session?.passport?.user?.claims?.sub;
      let userEmail: string | null = null;
      if (userId) {
        const user = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.id, userId) });
        userEmail = user?.email || null;
      }
      if (!userEmail) userEmail = (req as any).session?.passport?.user?.email || null;
      if (!userEmail) return res.status(401).json({ error: "Not authenticated" });

      const doctor = await db.query.doctorOnboarding.findFirst({
        where: (d, { eq, and }) => and(eq(d.email, userEmail!), eq(d.status, 'completed'))
      });

      if (!doctor) {
        const profile = await db.query.memberProfiles.findFirst({ where: (p, { eq }) => eq(p.userId, userId || '') });
        if (profile?.role === 'admin') {
          const allEnrollments = await db.query.memberEnrollment.findMany({ orderBy: (m, { desc }) => desc(m.createdAt), limit: 50 });
          return res.json({
            members: allEnrollments.map(m => ({ id: m.id, name: m.fullName, email: m.email, phone: m.phone, status: m.status, enrolledAt: m.createdAt, documentSigned: !!m.documentSignedAt, paymentComplete: !!m.paymentCompletedAt, doctorCode: m.doctorCode })),
            total: allEnrollments.length, isAdmin: true
          });
        }
        return res.status(404).json({ error: "No active doctor profile found" });
      }

      const enrolledMembers = await db.query.memberEnrollment.findMany({ where: (m, { eq }) => eq(m.doctorCode, doctor.doctorCode || ''), orderBy: (m, { desc }) => desc(m.createdAt) });
      res.json({
        members: enrolledMembers.map(m => ({ id: m.id, name: m.fullName, email: m.email, phone: m.phone, status: m.status, enrolledAt: m.createdAt, documentSigned: !!m.documentSignedAt, paymentComplete: !!m.paymentCompletedAt })),
        total: enrolledMembers.length
      });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.get("/api/doctor/appointments", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const appointments = await db.query.doctorAppointments.findMany({ where: (a, { eq }) => eq(a.doctorId, userId), orderBy: (a, { asc }) => asc(a.appointmentDate) });
      res.json(appointments);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.post("/api/doctor/appointments", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const { patientId, appointmentDate, durationMinutes, appointmentType, notes } = req.body;
      if (!patientId || !appointmentDate) return res.status(400).json({ error: "Missing required fields" });
      const newAppointment = await db.insert(doctorAppointments).values({ doctorId: userId, patientId, appointmentDate: new Date(appointmentDate), durationMinutes: durationMinutes || 60, appointmentType: appointmentType || "consultation", notes }).returning();
      res.json(newAppointment[0]);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.get("/api/doctor/messages/:patientId", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const { patientId } = req.params;
      const messages = await db.query.doctorPatientMessages.findMany({
        where: (m, { and, or, eq }) => or(and(eq(m.senderId, userId), eq(m.recipientId, patientId)), and(eq(m.senderId, patientId), eq(m.recipientId, userId))),
        orderBy: (m, { asc }) => asc(m.createdAt)
      });
      res.json(messages.map(m => ({ ...m, messageText: m.content })));
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.post("/api/doctor/messages/:patientId", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const { patientId } = req.params;
      const { messageText } = req.body;
      if (!messageText) return res.status(400).json({ error: "Message text required" });
      const newMessage = await db.insert(doctorPatientMessages).values({ conversationId: `${userId}-${patientId}`, senderId: userId, senderRole: 'doctor', recipientId: patientId, recipientRole: 'patient', content: messageText }).returning();
      res.json({ ...newMessage[0], messageText: newMessage[0].content });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.get("/api/join/:doctorCode", async (req: Request, res: Response) => {
    try {
      const doctor = await db.query.doctorOnboarding.findFirst({
        where: (d, { eq, and }) => and(eq(d.doctorCode, req.params.doctorCode), eq(d.status, 'completed'))
      });
      if (!doctor) return res.status(404).json({ error: "Invalid doctor code or doctor not active" });
      res.json({ valid: true, clinicName: doctor.clinicName, practiceType: doctor.practiceType, doctorCode: doctor.doctorCode });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });
}
