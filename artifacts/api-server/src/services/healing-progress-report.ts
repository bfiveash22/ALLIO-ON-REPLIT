import PDFDocument from "pdfkit";
import { db } from "../db";
import { storage } from "../storage";
import {
  patientRecords,
  patientProtocols,
  patientUploads,
  labResults,
  userAchievements,
  achievements,
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export interface HealingMilestone {
  date: string;
  type: string;
  description: string;
}

export interface HealingProgressData {
  member: {
    id: string;
    name: string;
    email?: string | null;
    status?: string | null;
    primaryConcerns?: string[] | null;
    dateOfBirth?: Date | null;
    createdAt?: Date | null;
  };
  patient: {
    id: string;
    name: string;
    email?: string | null;
    status?: string | null;
    primaryConcerns?: string[] | null;
    dateOfBirth?: Date | null;
    createdAt?: Date | null;
  };
  protocols: Array<{
    id: string;
    protocolName: string;
    protocolType?: string | null;
    status?: string | null;
    duration?: string | null;
    startDate?: Date | null;
    endDate?: Date | null;
    complianceScore?: number | null;
    expectedOutcomes?: string[] | null;
    actualOutcomes?: string[] | null;
    currentWeek?: number | null;
    products?: unknown;
  }>;
  uploads: Array<{
    id: string;
    recordType: string;
    fileName: string;
    aiAnalyzed?: boolean | null;
    aiAnalysisResult?: unknown;
    createdAt?: Date | null;
  }>;
  labData: Array<{
    testName: string;
    category: string;
    value: string;
    unit: string;
    status?: string | null;
    resultDate?: Date | null;
  }>;
  milestones: HealingMilestone[];
  achievementsEarned: Array<{
    name: string;
    description?: string | null;
    earnedAt?: Date | null;
  }>;
}

export async function aggregateHealingProgress(
  patientRecordId: string,
  doctorId: string,
  isAdmin: boolean = false
): Promise<HealingProgressData> {
  const patient = await storage.getPatientRecord(patientRecordId);
  if (!patient) {
    throw new Error("Member record not found");
  }

  if (!isAdmin && patient.doctorId !== doctorId) {
    throw new Error("Unauthorized: member does not belong to this practitioner");
  }

  const protocols = await storage.getPatientProtocols(patientRecordId);
  const uploads = await storage.getPatientUploads(patientRecordId);

  let labData: HealingProgressData["labData"] = [];
  try {
    const labs = await db
      .select()
      .from(labResults)
      .where(eq(labResults.memberId, patient.memberId))
      .orderBy(desc(labResults.resultDate));
    labData = labs.map((l) => ({
      testName: l.testName,
      category: l.category,
      value: l.value,
      unit: l.unit,
      status: l.status,
      resultDate: l.resultDate,
    }));
  } catch {
    labData = [];
  }

  const milestones: HealingMilestone[] = [];

  if (patient.createdAt) {
    milestones.push({
      date: patient.createdAt.toISOString().split("T")[0],
      type: "enrollment",
      description: "Member record created and initial assessment begun",
    });
  }

  for (const protocol of protocols) {
    if (protocol.startDate) {
      milestones.push({
        date: protocol.startDate.toISOString().split("T")[0],
        type: "protocol_start",
        description: `Started protocol: ${protocol.protocolName}`,
      });
    }
    if (protocol.status === "completed" && protocol.endDate) {
      milestones.push({
        date: protocol.endDate.toISOString().split("T")[0],
        type: "protocol_complete",
        description: `Completed protocol: ${protocol.protocolName}`,
      });
    }
  }

  for (const upload of uploads) {
    if (upload.aiAnalyzed && upload.createdAt) {
      milestones.push({
        date: upload.createdAt.toISOString().split("T")[0],
        type: "assessment",
        description: `AI analysis completed: ${upload.fileName}`,
      });
    }
  }

  milestones.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let achievementsEarned: HealingProgressData["achievementsEarned"] = [];
  try {
    const earned = await db
      .select({
        name: achievements.name,
        description: achievements.description,
        earnedAt: userAchievements.earnedAt,
      })
      .from(userAchievements)
      .innerJoin(
        achievements,
        eq(userAchievements.achievementId, achievements.id)
      )
      .where(eq(userAchievements.userId, patient.memberId))
      .orderBy(desc(userAchievements.earnedAt));
    achievementsEarned = earned;
  } catch {
    achievementsEarned = [];
  }

  const memberInfo = {
    id: patient.id,
    name: patient.memberName,
    email: patient.memberEmail,
    status: patient.status,
    primaryConcerns: patient.primaryConcerns,
    dateOfBirth: patient.dateOfBirth,
    createdAt: patient.createdAt,
  };
  return {
    member: memberInfo,
    patient: memberInfo,
    protocols,
    uploads,
    labData,
    milestones,
    achievementsEarned,
  };
}

const COLORS = {
  primary: "#331A80",
  secondary: "#6644BB",
  accent: "#8B6FCC",
  text: "#222222",
  lightText: "#666666",
  success: "#16a34a",
  warning: "#d97706",
  headerBg: "#F0EBF8",
  white: "#FFFFFF",
  border: "#CCCCCC",
};

function checkPage(doc: PDFKit.PDFDocument, needed: number = 80) {
  if (doc.y > doc.page.height - doc.page.margins.bottom - needed) {
    doc.addPage();
  }
}

function addHeader(doc: PDFKit.PDFDocument, text: string) {
  checkPage(doc, 60);
  doc.moveDown(0.5);
  doc.fontSize(18).fillColor(COLORS.primary).text(text, { underline: true });
  doc.moveDown(0.3);
}

function addSubheader(doc: PDFKit.PDFDocument, text: string) {
  checkPage(doc, 40);
  doc.moveDown(0.3);
  doc.fontSize(14).fillColor(COLORS.secondary).text(text);
  doc.moveDown(0.2);
}

function addBody(doc: PDFKit.PDFDocument, text: string) {
  doc.fontSize(10).fillColor(COLORS.text).text(text);
}

function addBullet(doc: PDFKit.PDFDocument, text: string) {
  doc
    .fontSize(10)
    .fillColor(COLORS.text)
    .text(`  \u2022 ${text}`, { indent: 10 });
}

export function generateHealingProgressPDF(
  data: HealingProgressData
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "LETTER",
        margins: { top: 60, bottom: 60, left: 55, right: 55 },
        info: {
          Title: `${data.patient.name} - Healing Progress Report`,
          Author: "Forgotten Formula PMA",
          Subject: "Member Healing Progress Report",
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc
        .fontSize(26)
        .fillColor(COLORS.primary)
        .text("FORGOTTEN FORMULA PMA", { align: "center" });
      doc.moveDown(0.2);
      doc
        .fontSize(18)
        .fillColor(COLORS.secondary)
        .text("Member Healing Progress Report", { align: "center" });
      doc.moveDown(0.5);

      doc
        .fontSize(14)
        .fillColor(COLORS.text)
        .text(data.patient.name, { align: "center" });
      doc
        .fontSize(10)
        .fillColor(COLORS.lightText)
        .text(
          `Generated: ${new Date().toLocaleDateString()} | Status: ${data.patient.status || "Active"}`,
          { align: "center" }
        );
      doc.moveDown(0.5);

      doc
        .moveTo(55, doc.y)
        .lineTo(doc.page.width - 55, doc.y)
        .strokeColor(COLORS.secondary)
        .lineWidth(2)
        .stroke();
      doc.moveDown(0.8);

      addHeader(doc, "Member Overview");
      if (data.patient.primaryConcerns?.length) {
        addBody(doc, "Primary Concerns:");
        for (const concern of data.patient.primaryConcerns) {
          addBullet(doc, concern);
        }
      }
      if (data.patient.createdAt) {
        doc.moveDown(0.2);
        addBody(
          doc,
          `Member Since: ${data.patient.createdAt.toLocaleDateString()}`
        );
      }

      if (data.protocols.length > 0) {
        addHeader(doc, "Protocol Summary");
        const active = data.protocols.filter((p) => p.status === "active");
        const completed = data.protocols.filter(
          (p) => p.status === "completed"
        );

        addBody(
          doc,
          `Total Protocols: ${data.protocols.length} | Active: ${active.length} | Completed: ${completed.length}`
        );
        doc.moveDown(0.3);

        for (const protocol of data.protocols) {
          checkPage(doc, 100);
          addSubheader(doc, protocol.protocolName);
          addBody(
            doc,
            `Type: ${protocol.protocolType || "General"} | Status: ${protocol.status || "Draft"}`
          );
          if (protocol.duration) {
            addBody(doc, `Duration: ${protocol.duration}`);
          }
          if (protocol.complianceScore !== null && protocol.complianceScore !== undefined) {
            const scoreColor =
              protocol.complianceScore >= 80
                ? COLORS.success
                : protocol.complianceScore >= 50
                  ? COLORS.warning
                  : "#dc2626";
            doc
              .fontSize(10)
              .fillColor(scoreColor)
              .text(`Compliance Score: ${protocol.complianceScore}%`);
          }
          if (protocol.expectedOutcomes?.length) {
            addBody(doc, "Expected Outcomes:");
            for (const outcome of protocol.expectedOutcomes) {
              addBullet(doc, outcome);
            }
          }
          if (protocol.actualOutcomes?.length) {
            addBody(doc, "Actual Outcomes:");
            for (const outcome of protocol.actualOutcomes) {
              addBullet(doc, outcome);
            }
          }
          doc.moveDown(0.3);
        }
      }

      if (data.labData.length > 0) {
        addHeader(doc, "Lab Results Summary");
        const categories = [...new Set(data.labData.map((l) => l.category))];
        for (const cat of categories) {
          addSubheader(doc, cat);
          const catResults = data.labData.filter((l) => l.category === cat);
          for (const result of catResults) {
            const statusIcon =
              result.status === "normal"
                ? "\u2713"
                : result.status === "critical_high" ||
                    result.status === "critical_low"
                  ? "\u26A0"
                  : "\u2022";
            addBody(
              doc,
              `${statusIcon} ${result.testName}: ${result.value} ${result.unit} (${result.status || "pending"})`
            );
          }
        }
      }

      if (data.milestones.length > 0) {
        addHeader(doc, "Healing Journey Timeline");
        for (const milestone of data.milestones) {
          checkPage(doc, 30);
          doc
            .fontSize(10)
            .fillColor(COLORS.secondary)
            .text(milestone.date, { continued: true });
          doc
            .fillColor(COLORS.text)
            .text(` — ${milestone.description}`);
        }
      }

      if (data.achievementsEarned.length > 0) {
        addHeader(doc, "Achievements Earned");
        for (const ach of data.achievementsEarned) {
          checkPage(doc, 30);
          addBullet(
            doc,
            `${ach.name}${ach.description ? ` — ${ach.description}` : ""}${ach.earnedAt ? ` (${ach.earnedAt.toLocaleDateString()})` : ""}`
          );
        }
      }

      doc.moveDown(1);
      checkPage(doc, 40);
      doc
        .fontSize(8)
        .fillColor(COLORS.lightText)
        .text(
          "This report is generated by the Forgotten Formula PMA Clinical Intelligence Console. " +
            "All information is confidential and intended for practitioner use only.",
          { align: "center" }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
