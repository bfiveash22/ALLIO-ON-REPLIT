import { sendEmail } from "./gmail";
import { db } from "../db";
import { memberEnrollment, memberProfiles, clinics } from "@shared/schema";
import { users } from "@shared/models/auth";
import { eq } from "drizzle-orm";

interface EnrollmentDetails {
  email: string;
  fullName: string;
  doctorCode?: string;
  clinicName?: string;
}

function buildWelcomeEmailHtml(details: EnrollmentDetails): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8f5ff; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #331A80, #6644BB); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px; }
    .header p { color: #d4c5f0; margin: 8px 0 0; font-size: 14px; }
    .content { padding: 30px; }
    .greeting { font-size: 18px; color: #331A80; margin-bottom: 15px; }
    .body-text { color: #444; font-size: 14px; line-height: 1.8; }
    .highlight-box { background: #f0ebf8; border-left: 4px solid #6644BB; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
    .highlight-box h3 { color: #331A80; margin: 0 0 8px; }
    .highlight-box ul { margin: 0; padding-left: 20px; color: #555; }
    .highlight-box li { margin-bottom: 6px; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #331A80, #6644BB); color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }
    .footer { background: #f8f5ff; padding: 20px 30px; text-align: center; color: #999; font-size: 12px; }
    .footer a { color: #6644BB; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>FORGOTTEN FORMULA PMA</h1>
      <p>Private Membership Association</p>
    </div>
    <div class="content">
      <p class="greeting">Welcome, ${details.fullName}!</p>
      <p class="body-text">
        You are now a member of the Forgotten Formula Private Membership Association. We are
        dedicated to supporting your healing journey with cutting-edge protocols, education,
        and practitioner support.
      </p>

      <div class="highlight-box">
        <h3>What's Included in Your Membership</h3>
        <ul>
          <li>Access to the Member Portal with protocol information</li>
          <li>Training modules on the Endocannabinoid System (ECS)</li>
          <li>Personalized protocol recommendations from your practitioner</li>
          <li>Healing frequency library and tools</li>
          <li>Secure messaging with your assigned practitioner</li>
          <li>Progress tracking and healing milestone achievements</li>
        </ul>
      </div>

      <div class="highlight-box">
        <h3>Getting Started</h3>
        <ul>
          <li>Log into the Member Portal using your registered email</li>
          <li>Complete the ECS Assessment to understand your baseline</li>
          <li>Review your assigned protocols and healing plan</li>
          <li>Explore the Training Library for educational content</li>
        </ul>
      </div>

      ${details.clinicName ? `<p class="body-text">Your assigned clinic: <strong>${details.clinicName}</strong></p>` : ""}

      <p class="body-text">
        If you have any questions, reach out to your practitioner through the secure messaging
        system or contact our support team.
      </p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Forgotten Formula PMA. All rights reserved.</p>
      <p>This is a private communication for PMA members only.</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendWelcomeEmail(
  details: EnrollmentDetails
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const html = buildWelcomeEmailHtml(details);
  return sendEmail(
    details.email,
    "Welcome to Forgotten Formula PMA - Your Healing Journey Begins",
    html
  );
}

export async function processNewEnrollment(
  enrollmentId: string
): Promise<{
  success: boolean;
  emailSent: boolean;
  error?: string;
}> {
  try {
    const [enrollment] = await db
      .select()
      .from(memberEnrollment)
      .where(eq(memberEnrollment.id, enrollmentId));

    if (!enrollment) {
      return { success: false, emailSent: false, error: "Enrollment not found" };
    }

    let clinicName: string | undefined;
    if (enrollment.doctorCode) {
      const [clinic] = await db
        .select()
        .from(clinics)
        .where(eq(clinics.slug, enrollment.doctorCode));
      clinicName = clinic?.name;
    }

    const emailResult = await sendWelcomeEmail({
      email: enrollment.email,
      fullName: enrollment.fullName,
      doctorCode: enrollment.doctorCode,
      clinicName,
    });

    return {
      success: true,
      emailSent: emailResult.success,
      error: emailResult.error,
    };
  } catch (err: any) {
    return { success: false, emailSent: false, error: err.message };
  }
}

export async function triggerWelcomeOnSignup(
  email: string,
  fullName: string,
  doctorCode?: string
): Promise<{ success: boolean; emailSent: boolean; error?: string }> {
  try {
    let clinicName: string | undefined;
    if (doctorCode) {
      const [clinic] = await db
        .select()
        .from(clinics)
        .where(eq(clinics.slug, doctorCode));
      clinicName = clinic?.name;
    }

    const emailResult = await sendWelcomeEmail({
      email,
      fullName,
      doctorCode,
      clinicName,
    });

    return {
      success: true,
      emailSent: emailResult.success,
      error: emailResult.error,
    };
  } catch (err: any) {
    return { success: false, emailSent: false, error: err.message };
  }
}
