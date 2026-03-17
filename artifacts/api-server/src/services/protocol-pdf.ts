import PDFDocument from "pdfkit";
import type {
  HealingProtocol,
  PatientProfile,
} from "@shared/types/protocol-assembly";
import { sanitizePmaLanguage, PMA_PDF_FOOTER } from "@shared/pma-language";
import { getPatientResources, type PatientResources } from "./protocol-resources";

const COLORS = {
  darkBg: "#0F1923",
  cardBg: "#1A2A3A",
  primary: "#1B2A4A",
  secondary: "#00B4D8",
  accent: "#D4A843",
  teal: "#00D4AA",
  text: "#222222",
  lightText: "#666666",
  headerBg: "#E8F4F8",
  white: "#FFFFFF",
  border: "#CCCCCC",
  urgentRed: "#FF4444",
  warningOrange: "#FF8C00",
  successGreen: "#00C853",
  sectionBg: "#F0F8FF",
};

const FF_WEBSITE = "https://www.forgottenformula.com";
const FF_SHOP = `${FF_WEBSITE}/shop`;

function drawBrandedCoverPage(doc: PDFKit.PDFDocument, title: string, subtitle: string, patientName: string, date: string, isCancer: boolean) {
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.darkBg);

  doc.rect(0, 0, doc.page.width, 4).fill(COLORS.secondary);
  doc.rect(0, doc.page.height - 4, doc.page.width, 4).fill(COLORS.secondary);

  const cx = doc.page.width / 2;
  doc.save();
  doc.lineWidth(1.5).strokeColor(COLORS.secondary).strokeOpacity(0.3);
  doc.moveTo(cx - 120, 180).lineTo(cx + 120, 180).stroke();
  doc.moveTo(cx - 80, 185).lineTo(cx + 80, 185).stroke();
  doc.restore();

  doc.fontSize(32).fillColor(COLORS.white).text("FORGOTTEN FORMULA", 0, 220, { align: "center" });
  doc.fontSize(14).fillColor(COLORS.secondary).text("PRIVATE MEMBER ASSOCIATION", 0, 260, { align: "center" });

  doc.moveDown(2);
  doc.moveTo(cx - 100, doc.y).lineTo(cx + 100, doc.y).strokeColor(COLORS.accent).lineWidth(2).stroke();

  doc.moveDown(1.5);
  doc.fontSize(24).fillColor(COLORS.accent).text(title, 0, doc.y, { align: "center" });
  doc.moveDown(0.4);
  doc.fontSize(13).fillColor(COLORS.white).text(subtitle, { align: "center" });

  doc.moveDown(2);
  doc.fontSize(18).fillColor(COLORS.secondary).text(patientName, { align: "center" });
  doc.moveDown(0.3);
  doc.fontSize(11).fillColor("#AAAAAA").text(`Generated: ${date}`, { align: "center" });
  doc.fontSize(11).fillColor("#AAAAAA").text("Prepared by: DR. FORMULA — Chief Medical Protocol Agent", { align: "center" });

  if (isCancer) {
    doc.moveDown(1.5);
    doc.roundedRect(cx - 140, doc.y, 280, 30, 5).fill("#331111");
    doc.fontSize(10).fillColor(COLORS.urgentRed).text("CANCER-SPECIFIC PROTOCOL", cx - 130, doc.y - 25, { width: 260, align: "center" });
  }

  doc.moveDown(3);
  doc.fontSize(9).fillColor("#777777").text(
    '"Before you heal someone, ask them if they\'re willing to give up the things that make them sick."',
    55, doc.page.height - 120, { align: "center", width: doc.page.width - 110, oblique: true }
  );
  doc.moveDown(0.3);
  doc.fontSize(9).fillColor(COLORS.secondary).text("— Hippocrates", { align: "center" });

  doc.moveDown(0.5);
  doc.fontSize(8).fillColor("#555555").text("This protocol is for private membership association (PMA) use only.", { align: "center" });
  doc.text("Member sovereignty and informed consent are foundational principles.", { align: "center" });
}

function drawPageHeader(doc: PDFKit.PDFDocument, patientName: string) {
  doc.save();
  doc.rect(0, 0, doc.page.width, 40).fill("#F7FBFE");
  doc.moveTo(0, 40).lineTo(doc.page.width, 40).strokeColor(COLORS.secondary).lineWidth(1).stroke();
  doc.fontSize(8).fillColor(COLORS.primary).text("FORGOTTEN FORMULA PMA", 55, 14);
  doc.fontSize(8).fillColor(COLORS.lightText).text(patientName, doc.page.width - 200, 14, { width: 145, align: "right" });
  doc.restore();
  doc.y = 55;
}

function drawSectionHeader(doc: PDFKit.PDFDocument, text: string, color?: string) {
  checkPage(doc, 80);
  const startY = doc.y;
  doc.rect(55, startY, doc.page.width - 110, 28).fill(color || COLORS.primary);
  doc.fontSize(13).fillColor(COLORS.white).text(text.toUpperCase(), 65, startY + 7, { width: doc.page.width - 130 });
  doc.y = startY + 36;
  doc.moveDown(0.3);
}

function drawSubheader(doc: PDFKit.PDFDocument, text: string) {
  checkPage(doc, 50);
  doc.moveDown(0.3);
  doc.moveTo(55, doc.y).lineTo(55 + 3, doc.y).strokeColor(COLORS.secondary).lineWidth(3).stroke();
  doc.fontSize(12).fillColor(COLORS.secondary).text(`  ${text}`, 58, doc.y - 5);
  doc.moveDown(0.2);
}

function drawBody(doc: PDFKit.PDFDocument, text: string) {
  doc.fontSize(10).fillColor(COLORS.text).text(text, 55, undefined, { width: doc.page.width - 110 });
}

function drawBullet(doc: PDFKit.PDFDocument, text: string, indent: number = 0) {
  checkPage(doc, 20);
  doc.fontSize(10).fillColor(COLORS.teal).text("\u2022", 60 + indent, doc.y, { continued: true });
  doc.fillColor(COLORS.text).text(` ${text}`, { width: doc.page.width - 130 - indent });
}

function drawLabelValue(doc: PDFKit.PDFDocument, label: string, value: string) {
  checkPage(doc, 18);
  doc.fontSize(10).fillColor(COLORS.secondary).text(`${label}: `, 65, doc.y, { continued: true });
  doc.fillColor(COLORS.text).text(value);
}

function drawInfoBox(doc: PDFKit.PDFDocument, text: string, bgColor: string = COLORS.sectionBg) {
  checkPage(doc, 40);
  const startY = doc.y;
  doc.rect(55, startY, doc.page.width - 110, 30).fill(bgColor);
  doc.rect(55, startY, 3, 30).fill(COLORS.secondary);
  doc.fontSize(9).fillColor(COLORS.text).text(text, 65, startY + 9, { width: doc.page.width - 135 });
  doc.y = startY + 36;
}

function checkPage(doc: PDFKit.PDFDocument, needed: number = 80) {
  if (doc.y > doc.page.height - doc.page.margins.bottom - needed) {
    doc.addPage();
  }
}

function newPage(doc: PDFKit.PDFDocument, patientName: string) {
  doc.addPage();
  drawPageHeader(doc, patientName);
}

function drawResourceLink(doc: PDFKit.PDFDocument, title: string, category: string, description: string) {
  checkPage(doc, 45);
  const startY = doc.y;
  doc.rect(60, startY, doc.page.width - 120, 35).fill("#F5F9FC");
  doc.rect(60, startY, 3, 35).fill(COLORS.accent);
  doc.fontSize(10).fillColor(COLORS.primary).text(title, 70, startY + 5, { width: doc.page.width - 145, underline: false });
  doc.fontSize(8).fillColor(COLORS.accent).text(category, doc.page.width - 200, startY + 5, { width: 140, align: "right" });
  doc.fontSize(8).fillColor(COLORS.lightText).text(description, 70, startY + 20, { width: doc.page.width - 145 });
  doc.y = startY + 40;
}

function drawProductItem(doc: PDFKit.PDFDocument, name: string, category: string, dose?: string) {
  checkPage(doc, 22);
  doc.fontSize(10).fillColor(COLORS.primary).text(`\u2022 ${name}`, 65, doc.y, { continued: dose ? true : false });
  if (dose) {
    doc.fillColor(COLORS.lightText).text(` — ${dose}`);
  }
}

function drawCommitmentPage(doc: PDFKit.PDFDocument, patientName: string) {
  newPage(doc, patientName);
  doc.moveDown(1);
  drawSectionHeader(doc, "My Commitment to You");
  doc.moveDown(0.5);

  doc.fontSize(10).fillColor(COLORS.text).text(
    "I will do everything in my power and knowledge to focus on the root of all problems. Most doctors focus only on the symptoms, " +
    "not the underlying cause of the disease or issue. We will not give up on you, but you need to work with us on every step of this protocol.",
    65, undefined, { width: doc.page.width - 130 }
  );
  doc.moveDown(0.5);

  doc.fontSize(10).fillColor(COLORS.text).text(
    "Don't lose hope and don't give up! There is no single pill or capsule that will fix this. Only a commitment to follow the steps " +
    "laid herein — if you choose to do so, the ECS, the gut, and your body will take care of itself. Homeostasis is about balance in the body.",
    65, undefined, { width: doc.page.width - 130 }
  );
  doc.moveDown(0.5);

  doc.fontSize(10).fillColor(COLORS.text).text(
    "There is no value in radiation or chemo if the underlying issues that caused the body to malfunction aren't addressed. " +
    "You do not treat the body with poison to cure it. That is a profit model, not a cure. The Pharma model has made trillions and cured nothing.",
    65, undefined, { width: doc.page.width - 130 }
  );
  doc.moveDown(0.5);

  doc.fontSize(10).fillColor(COLORS.text).text(
    "We have provided the educational tools and research to help guide you through your journey. Please utilize these resources. " +
    "These are extremely specific formulations that only a handful of folks know how to do — it's my lifelong work.",
    65, undefined, { width: doc.page.width - 130 }
  );
  doc.moveDown(1);

  doc.fontSize(11).fillColor(COLORS.secondary).text(
    '"Hope is coming and a solution is in route. There is no doubt in my mind about the efficacy of our formulations and our 5 steps to health and wellness."',
    65, undefined, { align: "center", width: doc.page.width - 130, oblique: true }
  );
  doc.moveDown(1);
  doc.fontSize(10).fillColor(COLORS.text).text("Thank you for giving us this opportunity. We are looking forward to healing you.", { align: "center" });
  doc.moveDown(1.5);
  doc.fontSize(12).fillColor(COLORS.primary).text("Michael Blake", { align: "center" });
  doc.fontSize(10).fillColor(COLORS.secondary).text("FF Founder and Medical Trustee", { align: "center" });
}

function drawDisclaimer(doc: PDFKit.PDFDocument) {
  newPage(doc, "");
  doc.moveDown(3);
  doc.rect(55, doc.y, doc.page.width - 110, 1).fill(COLORS.secondary);
  doc.moveDown(1);

  doc.fontSize(12).fillColor(COLORS.primary).text("DISCLAIMER", { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(9).fillColor(COLORS.lightText).text(
    "This protocol has been generated by DR. FORMULA, Chief Medical Protocol Agent of Forgotten Formula PMA. " +
    "This document is intended solely for private membership association (PMA) use and does not constitute medical advice, " +
    "diagnosis, or treatment in the public domain. All protocols are wellness suggestions subject to Trustee review and refinement. " +
    "Member sovereignty and informed consent are foundational principles of this association.",
    55, undefined, { align: "center", width: doc.page.width - 110 }
  );
  doc.moveDown(1.5);
  doc.fontSize(11).fillColor(COLORS.secondary).text(
    '"Your body is a self-healing organism. My job is to identify what\'s blocking that healing and give you the tools to remove those blocks."',
    55, undefined, { align: "center", width: doc.page.width - 110, oblique: true }
  );
  doc.moveDown(0.3);
  doc.fontSize(11).fillColor(COLORS.primary).text("— DR. FORMULA", { align: "center" });

  doc.moveDown(2);
  doc.fontSize(10).fillColor(COLORS.secondary).text("Forgotten Formula PMA", { align: "center" });
  doc.fontSize(9).fillColor(COLORS.lightText).text(`${FF_WEBSITE}`, { align: "center", link: FF_WEBSITE });
  doc.moveDown(0.3);
  doc.fontSize(9).fillColor(COLORS.lightText).text("Powered by ALLIO v1 — The All-In-One Healing Ecosystem", { align: "center" });
}


export function generateProtocolPDF(
  protocol: HealingProtocol,
  profile: PatientProfile,
  citations?: Array<{ title: string; authors: string[]; journal?: string; year?: string; url?: string }>
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "LETTER",
        margins: { top: 60, bottom: 60, left: 55, right: 55 },
        info: {
          Title: `${protocol.patientName} - Healing Protocol`,
          Author: "Forgotten Formula PMA - DR. FORMULA",
          Subject: "Personalized Healing Protocol",
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const pn = protocol.patientName;
      const resources = getPatientResources(protocol, profile);
      const dateStr = protocol.generatedDate || new Date().toISOString().split("T")[0];

      drawBrandedCoverPage(doc, "Personalized Healing Protocol", "FF PMA 2026 Protocol — The 5R Framework", pn, dateStr, resources.isCancer);

      newPage(doc, pn);
      drawSectionHeader(doc, "Executive Summary");
      drawBody(doc, protocol.summary || "");
      doc.moveDown(0.5);

      drawSubheader(doc, "Member Overview");
      drawLabelValue(doc, "Name", protocol.patientName);
      drawLabelValue(doc, "Age", String(protocol.patientAge));
      drawLabelValue(doc, "Gender", profile.gender || "N/A");
      if (profile.location) drawLabelValue(doc, "Location", profile.location);
      drawLabelValue(doc, "Protocol Duration", `${protocol.protocolDurationDays} days`);
      doc.moveDown(0.3);

      if (profile.chiefComplaints?.length > 0) {
        drawSubheader(doc, "Chief Complaints");
        profile.chiefComplaints.forEach(c => drawBullet(doc, c));
      }

      if (profile.currentDiagnoses?.length > 0) {
        drawSubheader(doc, "Current Diagnoses");
        profile.currentDiagnoses.forEach(d => drawBullet(doc, d));
      }

      if (profile.goals?.length > 0) {
        drawSubheader(doc, "Member Wellness Goals");
        profile.goals.forEach(g => drawBullet(doc, g));
      }

      newPage(doc, pn);
      drawSectionHeader(doc, "Root Cause Analysis");
      if (protocol.rootCauseAnalysis?.length > 0) {
        protocol.rootCauseAnalysis.forEach(rc => {
          checkPage(doc, 60);
          doc.fontSize(12).fillColor(COLORS.secondary).text(`${rc.rank}. ${rc.cause}`, 60);
          doc.fontSize(9).fillColor(COLORS.accent).text(`   Category: ${rc.category.toUpperCase()}`, 65);
          doc.fontSize(10).fillColor(COLORS.text).text(`   ${rc.details}`, 65, undefined, { width: doc.page.width - 130 });
          if (rc.relatedSymptoms?.length > 0) {
            doc.fontSize(9).fillColor(COLORS.lightText).text(`   Related symptoms: ${rc.relatedSymptoms.join(", ")}`, 65, undefined, { width: doc.page.width - 130 });
          }
          doc.moveDown(0.4);
        });
      }

      if (protocol.phases?.length > 0) {
        newPage(doc, pn);
        drawSectionHeader(doc, "The 5 Rs — Wellness Phases");
        const phaseColors = ["#C62828", "#EF6C00", "#F9A825", "#2E7D32", "#1565C0"];
        protocol.phases.forEach((phase, idx) => {
          checkPage(doc, 100);
          const startY = doc.y;
          doc.rect(55, startY, doc.page.width - 110, 24).fill(phaseColors[idx] || COLORS.primary);
          doc.fontSize(11).fillColor(COLORS.white).text(
            `Phase ${phase.phaseNumber}: ${phase.name} (${phase.weekRange})`,
            65, startY + 6, { width: doc.page.width - 130 }
          );
          doc.y = startY + 30;
          doc.fontSize(10).fillColor(COLORS.text).text(phase.focus, 65, undefined, { width: doc.page.width - 130 });
          doc.moveDown(0.2);
          phase.keyActions?.forEach(action => drawBullet(doc, action, 10));
          doc.moveDown(0.5);
        });
      }

      if (protocol.injectablePeptides?.length > 0) {
        newPage(doc, pn);
        drawSectionHeader(doc, "Injectable Peptide Protocol");
        protocol.injectablePeptides.forEach(p => {
          checkPage(doc, 110);
          const startY = doc.y;
          doc.rect(55, startY, doc.page.width - 110, 22).fill("#1A2A3A");
          doc.fontSize(12).fillColor(COLORS.teal).text(p.name, 65, startY + 5);
          doc.y = startY + 28;

          drawLabelValue(doc, "Vial Size", p.vialSize);
          drawLabelValue(doc, "Reconstitution", p.reconstitution);
          drawLabelValue(doc, "Dose", p.dose);
          drawLabelValue(doc, "Route", p.route);
          drawLabelValue(doc, "Frequency", p.frequency);
          drawLabelValue(doc, "Duration", p.duration);
          drawLabelValue(doc, "Purpose", p.purpose);
          if (p.notes) {
            doc.fontSize(9).fillColor(COLORS.lightText).text(`Note: ${p.notes}`, 65, undefined, { width: doc.page.width - 130 });
          }
          doc.fontSize(8).fillColor(COLORS.accent).text(`Shop: ${FF_SHOP}`, 65, undefined, { link: FF_SHOP });
          doc.moveDown(0.5);
        });
      }

      if (protocol.oralPeptides?.length > 0) {
        checkPage(doc, 100);
        drawSectionHeader(doc, "Oral Peptides", "#2E7D32");
        protocol.oralPeptides.forEach(p => {
          checkPage(doc, 50);
          doc.fontSize(11).fillColor(COLORS.primary).text(p.name, 65);
          drawLabelValue(doc, "Dose", `${p.dose} | ${p.frequency} | ${p.duration}`);
          drawLabelValue(doc, "Purpose", p.purpose);
          doc.moveDown(0.3);
        });
      }

      if (protocol.bioregulators?.length > 0) {
        checkPage(doc, 100);
        drawSectionHeader(doc, "Bioregulators (Khavinson Peptides)", "#6A1B9A");
        protocol.bioregulators.forEach(b => {
          checkPage(doc, 50);
          doc.fontSize(11).fillColor(COLORS.primary).text(b.name, 65);
          drawLabelValue(doc, "Target Organ", b.targetOrgan);
          drawLabelValue(doc, "Dose & Schedule", `${b.dose} | ${b.frequency} | ${b.duration}`);
          doc.moveDown(0.3);
        });
      }

      if (protocol.ivTherapies?.length > 0) {
        checkPage(doc, 100);
        drawSectionHeader(doc, "IV Therapy Schedule", "#00838F");
        protocol.ivTherapies.forEach(iv => {
          checkPage(doc, 50);
          doc.fontSize(11).fillColor(COLORS.primary).text(iv.name, 65);
          drawLabelValue(doc, "Frequency", iv.frequency);
          drawLabelValue(doc, "Duration", iv.duration);
          drawLabelValue(doc, "Purpose", iv.purpose);
          if (iv.notes) doc.fontSize(9).fillColor(COLORS.lightText).text(`Note: ${iv.notes}`, 65);
          doc.moveDown(0.3);
        });
      }

      if (protocol.imTherapies?.length > 0) {
        checkPage(doc, 100);
        drawSectionHeader(doc, "IM Therapy Schedule", "#4527A0");
        protocol.imTherapies.forEach(im => {
          checkPage(doc, 40);
          doc.fontSize(11).fillColor(COLORS.primary).text(im.name, 65);
          drawLabelValue(doc, "Dose", `${im.dose} | ${im.frequency}`);
          drawLabelValue(doc, "Purpose", im.purpose);
          doc.moveDown(0.3);
        });
      }

      if (protocol.supplements?.length > 0) {
        newPage(doc, pn);
        drawSectionHeader(doc, "Supplement Stack");
        protocol.supplements.forEach(s => {
          checkPage(doc, 35);
          doc.fontSize(10).fillColor(COLORS.teal).text(`\u2022 ${s.name}`, 65, doc.y, { continued: true });
          doc.fillColor(COLORS.text).text(` — ${s.dose} (${s.timing})`);
          doc.fontSize(9).fillColor(COLORS.lightText).text(`    Purpose: ${s.purpose}`, 70);
          doc.moveDown(0.15);
        });
      }

      if (protocol.detoxProtocols?.length > 0) {
        newPage(doc, pn);
        drawSectionHeader(doc, "Detox Protocols", "#E65100");
        protocol.detoxProtocols.forEach(d => {
          checkPage(doc, 80);
          doc.fontSize(12).fillColor(COLORS.primary).text(d.name, 65);
          drawLabelValue(doc, "Method", d.method);
          drawLabelValue(doc, "Frequency", d.frequency);
          drawLabelValue(doc, "Duration", d.duration);
          doc.fontSize(10).fillColor(COLORS.text).text(`Instructions: ${d.instructions}`, 65, undefined, { width: doc.page.width - 130 });
          doc.moveDown(0.4);
        });
      }

      if (protocol.parasiteAntiviralProtocols?.length > 0) {
        checkPage(doc, 100);
        drawSectionHeader(doc, "Parasite & Antiviral Protocols", "#880E4F");
        protocol.parasiteAntiviralProtocols.forEach(p => {
          checkPage(doc, 50);
          doc.fontSize(11).fillColor(COLORS.primary).text(p.name, 65);
          drawLabelValue(doc, "Dose", p.dose);
          drawLabelValue(doc, "Schedule", `${p.schedule} for ${p.duration}`);
          drawLabelValue(doc, "Purpose", p.purpose);
          doc.moveDown(0.3);
        });
      }

      if (protocol.dailySchedule) {
        newPage(doc, pn);
        drawSectionHeader(doc, "Daily Schedule Overview");
        const periods = [
          { key: "morning" as const, label: "MORNING (6:00 AM — 10:00 AM)", color: "#FF8F00" },
          { key: "midday" as const, label: "MIDDAY (10:00 AM — 2:00 PM)", color: "#0097A7" },
          { key: "evening" as const, label: "EVENING (5:00 PM — 8:00 PM)", color: "#5C6BC0" },
          { key: "bedtime" as const, label: "BEDTIME (9:00 PM — 10:00 PM)", color: "#37474F" },
        ];
        periods.forEach(period => {
          const items = protocol.dailySchedule[period.key];
          if (items?.length > 0) {
            checkPage(doc, 60);
            const startY = doc.y;
            doc.rect(60, startY, doc.page.width - 120, 20).fill(period.color);
            doc.fontSize(10).fillColor(COLORS.white).text(period.label, 70, startY + 4);
            doc.y = startY + 25;
            items.forEach(item => {
              checkPage(doc, 25);
              const timeStr = item.time ? `[${item.time}] ` : "";
              doc.fontSize(10).fillColor(COLORS.primary).text(`  ${timeStr}${item.item}`, 65);
              if (item.details) {
                doc.fontSize(9).fillColor(COLORS.lightText).text(`       ${item.details}`, 70, undefined, { width: doc.page.width - 140 });
              }
            });
            doc.moveDown(0.4);
          }
        });
      }

      if (protocol.lifestyleRecommendations?.length > 0 || protocol.dietaryGuidelines?.length > 0) {
        newPage(doc, pn);
        drawSectionHeader(doc, "Lifestyle & Dietary Guidelines");

        if (protocol.lifestyleRecommendations?.length > 0) {
          drawSubheader(doc, "Lifestyle Recommendations");
          protocol.lifestyleRecommendations.forEach(l => {
            checkPage(doc, 30);
            doc.fontSize(10).fillColor(COLORS.secondary).text(`${l.category}:`, 65, doc.y, { continued: true });
            doc.fillColor(COLORS.text).text(` ${l.recommendation}${l.details ? ` — ${l.details}` : ""}`);
          });
        }

        if (protocol.dietaryGuidelines?.length > 0) {
          drawSubheader(doc, "Dietary Guidelines");
          protocol.dietaryGuidelines.forEach(d => drawBullet(doc, d));
        }
      }

      if (protocol.followUpPlan?.length > 0 || protocol.labsRequired?.length > 0) {
        newPage(doc, pn);
        drawSectionHeader(doc, "Follow-Up Plan & Lab Orders");

        if (protocol.followUpPlan?.length > 0) {
          drawSubheader(doc, "Follow-Up Schedule");
          protocol.followUpPlan.forEach(f => {
            checkPage(doc, 30);
            doc.fontSize(10).fillColor(COLORS.secondary).text(`Week ${f.weekNumber}:`, 65, doc.y, { continued: true });
            doc.fillColor(COLORS.text).text(` ${f.action}${f.details ? ` — ${f.details}` : ""}`);
          });
        }

        if (protocol.labsRequired?.length > 0) {
          drawSubheader(doc, "Required Laboratory Tests");
          protocol.labsRequired.forEach(l => drawBullet(doc, l));
        }
      }

      if (protocol.ecsProtocol?.overview) {
        newPage(doc, pn);
        drawSectionHeader(doc, "ECS Protocol — Endocannabinoid System Optimization", "#2E7D32");
        drawBody(doc, protocol.ecsProtocol.overview);
        doc.moveDown(0.5);

        drawSubheader(doc, "Daytime Suppository Formula");
        const df = protocol.ecsProtocol.daytimeFormula;
        if (df) {
          drawLabelValue(doc, "CBD", df.CBD || "N/A");
          drawLabelValue(doc, "CBG", df.CBG || "N/A");
          if (df.CBN) drawLabelValue(doc, "CBN", df.CBN);
          if (df.THC) drawLabelValue(doc, "THC", df.THC);
          drawLabelValue(doc, "DMSO", df.DMSO || "N/A");
          drawLabelValue(doc, "Base", df.base || "cacao butter");
          drawLabelValue(doc, "Delivery", df.deliveryMethod || "suppository");
        }
        doc.moveDown(0.3);

        drawSubheader(doc, "Nighttime Suppository Formula");
        const nf = protocol.ecsProtocol.nighttimeFormula;
        if (nf) {
          drawLabelValue(doc, "CBD", nf.CBD || "N/A");
          if (nf.CBG) drawLabelValue(doc, "CBG", nf.CBG);
          drawLabelValue(doc, "CBN", nf.CBN || "N/A");
          drawLabelValue(doc, "THC", nf.THC || "N/A");
          drawLabelValue(doc, "DMSO", nf.DMSO || "N/A");
          drawLabelValue(doc, "Base", nf.base || "cacao butter");
        }
        doc.moveDown(0.3);

        if (protocol.ecsProtocol.tincture) {
          drawSubheader(doc, `Tincture: ${protocol.ecsProtocol.tincture.name}`);
          drawLabelValue(doc, "Cannabinoids", protocol.ecsProtocol.tincture.cannabinoids?.join(", ") || "Full spectrum");
          drawLabelValue(doc, "Dose", protocol.ecsProtocol.tincture.dose || "1-2 mL");
          drawLabelValue(doc, "Frequency", protocol.ecsProtocol.tincture.frequency || "2x daily sublingual");
        }

        if (protocol.ecsProtocol.targetedRatios?.length > 0) {
          doc.moveDown(0.3);
          drawSubheader(doc, "Condition-Specific Cannabinoid Ratios");
          protocol.ecsProtocol.targetedRatios.forEach(tr => {
            checkPage(doc, 25);
            doc.fontSize(10).fillColor(COLORS.secondary).text(`${tr.condition}:`, 65, doc.y, { continued: true });
            doc.fillColor(COLORS.text).text(` ${tr.ratio} — ${tr.rationale}`);
          });
        }

        if (protocol.ecsProtocol.molecularTargets?.length > 0) {
          doc.moveDown(0.3);
          drawSubheader(doc, "Molecular Targets");
          protocol.ecsProtocol.molecularTargets.forEach(t => drawBullet(doc, t));
        }
      }

      if (protocol.suppositories?.length > 0) {
        checkPage(doc, 100);
        drawSectionHeader(doc, "Suppository Protocols", "#2E7D32");
        protocol.suppositories.forEach(s => {
          checkPage(doc, 60);
          doc.fontSize(11).fillColor(COLORS.primary).text(`${s.name} (${s.timing})`, 65);
          drawLabelValue(doc, "Formula", s.formula);
          if (s.cannabinoids?.CBD) drawLabelValue(doc, "CBD", s.cannabinoids.CBD);
          if (s.cannabinoids?.CBG) drawLabelValue(doc, "CBG", s.cannabinoids.CBG);
          if (s.cannabinoids?.CBN) drawLabelValue(doc, "CBN", s.cannabinoids.CBN);
          if (s.cannabinoids?.THC) drawLabelValue(doc, "THC", s.cannabinoids.THC);
          if (s.cannabinoids?.DMSO) drawLabelValue(doc, "DMSO", s.cannabinoids.DMSO);
          drawLabelValue(doc, "Base", s.base);
          drawLabelValue(doc, "Frequency", s.frequency);
          drawLabelValue(doc, "Purpose", s.purpose);
          doc.moveDown(0.3);
        });
      }

      if (protocol.sirtuinStack?.mitoSTAC) {
        newPage(doc, pn);
        drawSectionHeader(doc, "Sirtuin & Mitochondrial Support", "#6A1B9A");
        const ss = protocol.sirtuinStack;

        drawSubheader(doc, "MitoSTAC Complex (Sirtuin Activation)");
        drawLabelValue(doc, "Resveratrol", ss.mitoSTAC.resveratrol);
        drawLabelValue(doc, "Pterostilbene", ss.mitoSTAC.pterostilbene);
        drawLabelValue(doc, "Quercetin", ss.mitoSTAC.quercetin);
        drawLabelValue(doc, "Fisetin", ss.mitoSTAC.fisetin);
        doc.moveDown(0.3);

        drawSubheader(doc, "NAD+ Precursors");
        drawLabelValue(doc, ss.nadPrecursors.compound, `${ss.nadPrecursors.dose} — ${ss.nadPrecursors.frequency}`);
        doc.moveDown(0.3);

        drawSubheader(doc, "GlyNAC Protocol");
        drawLabelValue(doc, "Glycine", ss.glyNAC.glycine);
        drawLabelValue(doc, "NAC", ss.glyNAC.nac);
        drawLabelValue(doc, "Frequency", ss.glyNAC.frequency);
        doc.moveDown(0.3);

        if (ss.mitochondrialSupport?.length > 0) {
          drawSubheader(doc, "Mitochondrial Support Stack");
          ss.mitochondrialSupport.forEach(m => {
            checkPage(doc, 20);
            doc.fontSize(10).fillColor(COLORS.teal).text(`\u2022 ${m.name}`, 65, doc.y, { continued: true });
            doc.fillColor(COLORS.text).text(` — ${m.dose} (${m.purpose})`);
          });
        }

        if (ss.methylationSupport?.length > 0) {
          doc.moveDown(0.3);
          drawSubheader(doc, "Methylation Support");
          ss.methylationSupport.forEach(m => {
            drawBullet(doc, `${m.name}: ${m.dose}`);
          });
        }
      }

      if (protocol.liposomals?.length > 0) {
        checkPage(doc, 100);
        drawSectionHeader(doc, "Liposomal Supplements", "#00838F");
        protocol.liposomals.forEach(l => {
          checkPage(doc, 35);
          doc.fontSize(10).fillColor(COLORS.teal).text(`\u2022 ${l.name}`, 65, doc.y, { continued: true });
          doc.fillColor(COLORS.text).text(` — ${l.dose} (${l.timing})`);
          doc.fontSize(9).fillColor(COLORS.lightText).text(`    Purpose: ${l.purpose}`, 70);
        });
      }

      if (protocol.nebulization?.length > 0) {
        checkPage(doc, 100);
        drawSectionHeader(doc, "Nebulization Protocols", "#4527A0");
        protocol.nebulization.forEach(n => {
          checkPage(doc, 60);
          doc.fontSize(11).fillColor(COLORS.primary).text(n.name, 65);
          drawLabelValue(doc, "Solution", n.solution);
          drawLabelValue(doc, "Dose", n.dose);
          drawLabelValue(doc, "Frequency", n.frequency);
          drawLabelValue(doc, "Duration", n.duration);
          drawLabelValue(doc, "Purpose", n.purpose);
          doc.moveDown(0.3);
        });
      }

      if (protocol.topicals?.length > 0) {
        checkPage(doc, 100);
        drawSectionHeader(doc, "Topical Protocols", "#EF6C00");
        protocol.topicals.forEach(t => {
          checkPage(doc, 40);
          doc.fontSize(11).fillColor(COLORS.primary).text(`${t.name} (${t.form})`, 65);
          drawLabelValue(doc, "Application", t.application);
          drawLabelValue(doc, "Frequency", t.frequency);
          drawLabelValue(doc, "Purpose", t.purpose);
          doc.moveDown(0.3);
        });
      }

      if (protocol.exosomes?.length > 0) {
        checkPage(doc, 100);
        drawSectionHeader(doc, "Exosome Therapy", "#880E4F");
        protocol.exosomes.forEach(e => {
          checkPage(doc, 60);
          doc.fontSize(11).fillColor(COLORS.primary).text(e.name, 65);
          drawLabelValue(doc, "Source", e.source);
          drawLabelValue(doc, "Concentration", e.concentration);
          drawLabelValue(doc, "Route", e.route);
          drawLabelValue(doc, "Frequency", e.frequency);
          drawLabelValue(doc, "Purpose", e.purpose);
          if (e.notes) doc.fontSize(9).fillColor(COLORS.lightText).text(`Note: ${e.notes}`, 65);
          doc.moveDown(0.3);
        });
      }

      if (protocol.dietaryProtocol?.phases?.length > 0) {
        newPage(doc, pn);
        drawSectionHeader(doc, "Dietary Protocol");
        protocol.dietaryProtocol.phases.forEach((phase, idx) => {
          checkPage(doc, 80);
          const phaseColors = ["#C62828", "#EF6C00", "#2E7D32"];
          const startY = doc.y;
          doc.rect(55, startY, doc.page.width - 110, 22).fill(phaseColors[idx] || COLORS.primary);
          doc.fontSize(11).fillColor(COLORS.white).text(`${phase.name} (${phase.duration})`, 65, startY + 4);
          doc.y = startY + 28;
          doc.fontSize(10).fillColor(COLORS.text).text(phase.focus, 65, undefined, { width: doc.page.width - 130 });
          doc.moveDown(0.2);
          if (phase.eliminate?.length > 0) {
            doc.fontSize(9).fillColor(COLORS.urgentRed).text("ELIMINATE:", 65);
            phase.eliminate.forEach(e => drawBullet(doc, e, 10));
          }
          if (phase.emphasize?.length > 0) {
            doc.fontSize(9).fillColor("#2E7D32").text("EMPHASIZE:", 65);
            phase.emphasize.forEach(e => drawBullet(doc, e, 10));
          }
          doc.moveDown(0.4);
        });

        if (protocol.dietaryProtocol.intermittentFasting) {
          drawSubheader(doc, "Intermittent Fasting");
          const fast = protocol.dietaryProtocol.intermittentFasting;
          drawLabelValue(doc, "Protocol", fast.protocol);
          drawLabelValue(doc, "Schedule", fast.schedule);
          drawLabelValue(doc, "Purpose", fast.purpose);
        }
      }

      if (protocol.contraindications?.length > 0) {
        checkPage(doc, 80);
        drawSectionHeader(doc, "Contraindications & Warnings", COLORS.urgentRed);
        protocol.contraindications.forEach(c => drawBullet(doc, c));
      }

      newPage(doc, pn);
      drawSectionHeader(doc, "Shopping List — FFPMA Product Catalog");

      const allProducts: Array<{ name: string; category: string; dose?: string }> = [];
      protocol.injectablePeptides?.forEach(p => allProducts.push({ name: p.name, category: "Injectable Peptide", dose: p.dose }));
      protocol.oralPeptides?.forEach(p => allProducts.push({ name: p.name, category: "Oral Peptide", dose: p.dose }));
      protocol.bioregulators?.forEach(b => allProducts.push({ name: b.name, category: "Bioregulator", dose: b.dose }));
      protocol.supplements?.forEach(s => allProducts.push({ name: s.name, category: "Supplement", dose: s.dose }));
      protocol.ivTherapies?.forEach(iv => allProducts.push({ name: iv.name, category: "IV Therapy" }));
      protocol.imTherapies?.forEach(im => allProducts.push({ name: im.name, category: "IM Therapy", dose: im.dose }));
      protocol.detoxProtocols?.forEach(d => allProducts.push({ name: d.name, category: "Detox" }));
      protocol.parasiteAntiviralProtocols?.forEach(p => allProducts.push({ name: p.name, category: "Antiparasitic/Antiviral", dose: p.dose }));
      protocol.suppositories?.forEach(s => allProducts.push({ name: s.name, category: "Suppository" }));
      protocol.liposomals?.forEach(l => allProducts.push({ name: l.name, category: "Liposomal", dose: l.dose }));
      protocol.exosomes?.forEach(e => allProducts.push({ name: e.name, category: "Exosome" }));
      protocol.topicals?.forEach(t => allProducts.push({ name: t.name, category: "Topical" }));
      protocol.nebulization?.forEach(n => allProducts.push({ name: n.name, category: "Nebulization" }));

      drawInfoBox(doc, `Total items in protocol: ${allProducts.length} | Shop at: ${FF_SHOP}`);
      doc.moveDown(0.3);

      const grouped = new Map<string, typeof allProducts>();
      allProducts.forEach(p => {
        const list = grouped.get(p.category) || [];
        list.push(p);
        grouped.set(p.category, list);
      });
      grouped.forEach((items, category) => {
        checkPage(doc, 50);
        drawSubheader(doc, `${category} (${items.length})`);
        items.forEach(item => drawProductItem(doc, item.name, item.category, item.dose));
        doc.moveDown(0.3);
      });

      doc.moveDown(0.5);
      doc.fontSize(10).fillColor(COLORS.secondary).text("Browse & Order Products:", 65, doc.y, { continued: true });
      doc.fillColor(COLORS.accent).text(` ${FF_SHOP}`, { link: FF_SHOP, underline: true });
      doc.moveDown(0.2);
      doc.fontSize(9).fillColor(COLORS.lightText).text("Healer pricing applied at checkout for PMA members.", 65);

      if (resources.books.length > 0) {
        newPage(doc, pn);
        drawSectionHeader(doc, "Recommended Reading — Starter Books");
        drawBody(doc, "Based on your specific conditions, these books have been selected to support your understanding of the healing process:");
        doc.moveDown(0.5);
        resources.books.forEach(book => {
          checkPage(doc, 55);
          const startY = doc.y;
          doc.rect(60, startY, doc.page.width - 120, 45).fill("#F5F9FC");
          doc.rect(60, startY, 4, 45).fill(COLORS.accent);
          doc.fontSize(11).fillColor(COLORS.primary).font("Helvetica-Bold").text(book.title, 72, startY + 5, { width: doc.page.width - 150 }).font("Helvetica");
          doc.fontSize(9).fillColor(COLORS.accent).text(`by ${book.author}`, 72, startY + 20);
          doc.fontSize(9).fillColor(COLORS.lightText).text(book.reason, 72, startY + 32, { width: doc.page.width - 150 });
          doc.y = startY + 50;
        });
      }

      if (resources.researchLinks.length > 0) {
        newPage(doc, pn);
        drawSectionHeader(doc, "Research Backing Our Protocols");
        drawBody(doc, "The following research and articles support the interventions used in your protocol:");
        doc.moveDown(0.5);
        resources.researchLinks.forEach(link => {
          checkPage(doc, 40);
          doc.fontSize(10).fillColor(COLORS.secondary).text(link.title, 65, doc.y, { link: link.url, underline: true, width: doc.page.width - 130 });
          doc.fontSize(9).fillColor(COLORS.lightText).text(link.description, 65, undefined, { width: doc.page.width - 130 });
          doc.fontSize(8).fillColor(COLORS.accent).text(link.url, 65, undefined, { link: link.url, width: doc.page.width - 130 });
          doc.moveDown(0.4);
        });
      }

      newPage(doc, pn);
      drawSectionHeader(doc, "Google Drive Links & Resources");
      drawBody(doc, "Links to your Daily Schedule, Library, Research Documents, Detox Baths, and 5-Day Fasting instructions:");
      doc.moveDown(0.5);
      resources.driveResources.forEach(dr => {
        checkPage(doc, 45);
        const typeLabel = dr.type === "folder" ? "Drive Folder" : dr.type === "document" ? "Document" : "Guide";
        drawResourceLink(doc, dr.title, typeLabel, dr.description);
        doc.fontSize(8).fillColor(COLORS.secondary).text(dr.url, 70, undefined, { link: dr.url, width: doc.page.width - 140 });
        doc.moveDown(0.2);
      });

      if (resources.youtubeResources.length > 0) {
        doc.moveDown(0.5);
        drawSubheader(doc, "Helpful YouTube Channels & Videos");
        resources.youtubeResources.forEach(yt => {
          checkPage(doc, 35);
          doc.fontSize(10).fillColor(COLORS.primary).text(yt.title, 65, doc.y, { width: doc.page.width - 130 });
          doc.fontSize(9).fillColor(COLORS.lightText).text(yt.description, 75, undefined, { width: doc.page.width - 140 });
          doc.fontSize(8).fillColor(COLORS.secondary).text(yt.url, 75, undefined, { link: yt.url, width: doc.page.width - 140 });
          doc.moveDown(0.3);
        });
      }

      if (citations && citations.length > 0) {
        newPage(doc, pn);
        drawSectionHeader(doc, "Research Citations");
        drawBody(doc, "Peer-reviewed evidence supporting major interventions in this protocol:");
        doc.moveDown(0.3);
        citations.forEach((cite, idx) => {
          checkPage(doc, 40);
          const authorStr = cite.authors?.slice(0, 3).join(", ") || "Unknown";
          const yearStr = cite.year || "n.d.";
          const journalStr = cite.journal ? ` ${cite.journal}.` : "";
          doc.fontSize(9).fillColor(COLORS.text).text(
            `[${idx + 1}] ${authorStr} (${yearStr}). "${cite.title}."${journalStr}`,
            65, undefined, { link: cite.url || undefined, width: doc.page.width - 130 }
          );
          doc.moveDown(0.15);
        });
      }

      drawCommitmentPage(doc, pn);
      drawDisclaimer(doc);
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}


export function generateDailySchedulePDF(
  protocol: HealingProtocol,
  profile: PatientProfile
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "LETTER",
        margins: { top: 60, bottom: 60, left: 55, right: 55 },
        info: {
          Title: `${protocol.patientName} - Daily Protocol Schedule`,
          Author: "Forgotten Formula PMA - DR. FORMULA",
          Subject: "Daily Protocol Schedule",
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const pn = protocol.patientName;
      const resources = getPatientResources(protocol, profile);
      const isCancer = resources.isCancer;
      const dateStr = protocol.generatedDate || new Date().toISOString().split("T")[0];

      drawBrandedCoverPage(doc, "Daily Protocol Schedule", `Complete daily routine — ${protocol.protocolDurationDays || 90} Day Protocol`, pn, dateStr, isCancer);

      newPage(doc, pn);
      drawSectionHeader(doc, "Your Daily Protocol Routine");
      drawInfoBox(doc, `This schedule should be followed daily for the duration of your ${protocol.protocolDurationDays || 90}-day protocol. Adjust timing as needed but maintain the sequence.`);
      doc.moveDown(0.5);

      if (protocol.dailySchedule) {
        const periods = [
          { key: "morning" as const, label: "MORNING ROUTINE", time: "6:00 AM — 10:00 AM", color: "#FF8F00", icon: "Rise & Shine" },
          { key: "midday" as const, label: "MIDDAY ROUTINE", time: "10:00 AM — 2:00 PM", color: "#0097A7", icon: "Midday Focus" },
          { key: "evening" as const, label: "EVENING ROUTINE", time: "5:00 PM — 8:00 PM", color: "#5C6BC0", icon: "Wind Down" },
          { key: "bedtime" as const, label: "BEDTIME ROUTINE", time: "9:00 PM — 10:00 PM", color: "#37474F", icon: "Restful Sleep" },
        ];

        periods.forEach(period => {
          const items = protocol.dailySchedule[period.key];
          if (items?.length > 0) {
            checkPage(doc, 80);
            const headerY = doc.y;
            doc.rect(55, headerY, doc.page.width - 110, 30).fill(period.color);
            doc.fontSize(13).fillColor(COLORS.white).text(period.label, 65, headerY + 4);
            doc.fontSize(9).fillColor("#FFFFFF").text(period.time, doc.page.width - 220, headerY + 8, { width: 160, align: "right" });
            doc.y = headerY + 36;

            items.forEach(item => {
              checkPage(doc, 40);
              const itemY = doc.y;
              doc.rect(60, itemY, doc.page.width - 120, 1).fill("#E0E0E0");

              const timeStr = item.time ? `${item.time}` : "";
              if (timeStr) {
                doc.fontSize(9).fillColor(COLORS.accent).text(timeStr, 65, itemY + 5, { width: 60 });
                doc.fontSize(10).fillColor(COLORS.primary).text(item.item, 130, itemY + 4, { width: doc.page.width - 200 });
              } else {
                doc.fontSize(10).fillColor(COLORS.primary).text(item.item, 65, itemY + 4, { width: doc.page.width - 130 });
              }

              let nextY = doc.y + 2;
              if (item.details) {
                doc.fontSize(9).fillColor(COLORS.lightText).text(item.details, timeStr ? 130 : 75, nextY, { width: doc.page.width - 200 });
                nextY = doc.y + 2;
              }
              if (item.frequency && item.frequency !== "Daily") {
                doc.fontSize(8).fillColor(COLORS.secondary).text(`Frequency: ${item.frequency}`, timeStr ? 130 : 75, nextY);
              }
              doc.moveDown(0.3);
            });
            doc.moveDown(0.5);
          }
        });
      } else {
        drawBody(doc, "No daily schedule has been defined for this protocol. Contact your Trustee for guidance.");
      }

      if (protocol.lifestyleRecommendations?.length > 0) {
        newPage(doc, pn);
        drawSectionHeader(doc, "Lifestyle Recommendations");
        protocol.lifestyleRecommendations.forEach(l => {
          checkPage(doc, 35);
          doc.fontSize(10).fillColor(COLORS.secondary).text(`${l.category}`, 65, doc.y);
          doc.fontSize(10).fillColor(COLORS.text).text(`  ${l.recommendation}${l.details ? ` — ${l.details}` : ""}`, 75, undefined, { width: doc.page.width - 140 });
          doc.moveDown(0.2);
        });
      }

      if (protocol.dietaryGuidelines?.length > 0) {
        checkPage(doc, 80);
        drawSectionHeader(doc, "Dietary Guidelines");
        protocol.dietaryGuidelines.forEach(d => drawBullet(doc, d));
      }

      if (isCancer) {
        newPage(doc, pn);
        drawSectionHeader(doc, "Cancer Protocol — Daily Essentials", "#C62828");
        drawInfoBox(doc, "CRITICAL: These items are non-negotiable for cancer protocol members. Follow this schedule precisely.", "#FFF3F3");
        doc.moveDown(0.3);

        const cancerDaily = [
          { time: "Morning", item: "CBD/CBG Sublingual Tincture", details: "50mg CBD + 25mg CBG sublingual — hold 60 seconds" },
          { time: "Morning", item: "Nascent Iodine Protocol", details: "Start 1 drop, titrate up. Take with selenium companion" },
          { time: "With Meals", item: "Digestive Enzymes", details: "Full-spectrum enzymes with every meal" },
          { time: "Afternoon", item: "IV Vitamin C (clinic days)", details: "25-75g high-dose IV vitamin C, 2-3x per week" },
          { time: "Evening", item: "ECS Suppository", details: "FF PMA formulation — nightly rotation for localized CB2 activation" },
          { time: "Evening", item: "Detox Bath", details: "Baking soda + bentonite clay + epsom salt, 3x per week minimum" },
          { time: "Bedtime", item: "Evening CBD/CBG/CBN", details: "50mg CBD + 25mg CBG + 10mg CBN + 5mg THC for overnight immune activation" },
          { time: "Daily", item: "DIANE Diet Compliance", details: "Zero sugar, zero GMO, organic only, cruciferous vegetables every meal" },
        ];

        cancerDaily.forEach(item => {
          checkPage(doc, 35);
          doc.fontSize(9).fillColor(COLORS.urgentRed).text(item.time, 65, doc.y, { width: 75 });
          doc.fontSize(10).fillColor(COLORS.primary).text(item.item, 145, doc.y - 11, { width: doc.page.width - 210 });
          doc.fontSize(9).fillColor(COLORS.lightText).text(item.details, 145, undefined, { width: doc.page.width - 210 });
          doc.moveDown(0.3);
        });
      }

      if (protocol.ecsProtocol?.daytimeFormula || protocol.suppositories?.length) {
        newPage(doc, pn);
        drawSectionHeader(doc, "ECS Protocol — Daily Suppository Schedule");
        if (protocol.ecsProtocol?.overview) {
          drawInfoBox(doc, protocol.ecsProtocol.overview);
          doc.moveDown(0.3);
        }
        if (protocol.ecsProtocol?.daytimeFormula) {
          const df = protocol.ecsProtocol.daytimeFormula;
          checkPage(doc, 50);
          doc.fontSize(11).fillColor(COLORS.secondary).text("Daytime Formula", 65, doc.y);
          doc.fontSize(10).fillColor(COLORS.text).text(
            `CBD: ${df.CBD || "N/A"} | CBG: ${df.CBG || "N/A"}${df.CBN ? ` | CBN: ${df.CBN}` : ""}${df.DMSO ? ` | DMSO: ${df.DMSO}` : ""} — ${df.base || "cacao butter"} ${df.deliveryMethod || "suppository"}`,
            75, undefined, { width: doc.page.width - 150 }
          );
          doc.moveDown(0.3);
        }
        if (protocol.ecsProtocol?.nighttimeFormula) {
          const nf = protocol.ecsProtocol.nighttimeFormula;
          checkPage(doc, 50);
          doc.fontSize(11).fillColor(COLORS.secondary).text("Nighttime Formula", 65, doc.y);
          doc.fontSize(10).fillColor(COLORS.text).text(
            `CBD: ${nf.CBD || "N/A"}${nf.CBN ? ` | CBN: ${nf.CBN}` : ""} | THC: ${nf.THC || "N/A"}${nf.DMSO ? ` | DMSO: ${nf.DMSO}` : ""} — ${nf.base || "cacao butter"} ${nf.deliveryMethod || "suppository"}`,
            75, undefined, { width: doc.page.width - 150 }
          );
          doc.moveDown(0.3);
        }
        if (protocol.ecsProtocol?.tincture) {
          checkPage(doc, 40);
          doc.fontSize(11).fillColor(COLORS.secondary).text("Tincture", 65, doc.y);
          doc.fontSize(10).fillColor(COLORS.text).text(
            `${protocol.ecsProtocol.tincture.name}: ${protocol.ecsProtocol.tincture.dose} — ${protocol.ecsProtocol.tincture.frequency}`,
            75, undefined, { width: doc.page.width - 150 }
          );
          doc.moveDown(0.5);
        }
      }

      if (protocol.sirtuinStack?.mitoSTAC || protocol.sirtuinStack?.nadPrecursors) {
        checkPage(doc, 100);
        drawSectionHeader(doc, "Sirtuin & Mitochondrial Support — Daily");
        if (protocol.sirtuinStack?.mitoSTAC) {
          const m = protocol.sirtuinStack.mitoSTAC;
          drawBullet(doc, `Resveratrol: ${m.resveratrol}`);
          drawBullet(doc, `Pterostilbene: ${m.pterostilbene}`);
          drawBullet(doc, `Quercetin: ${m.quercetin}`);
          drawBullet(doc, `Fisetin: ${m.fisetin}`);
        }
        if (protocol.sirtuinStack?.nadPrecursors) {
          drawBullet(doc, `NAD+: ${protocol.sirtuinStack.nadPrecursors.compound} ${protocol.sirtuinStack.nadPrecursors.dose} — ${protocol.sirtuinStack.nadPrecursors.frequency}`);
        }
        if (protocol.sirtuinStack?.glyNAC) {
          drawBullet(doc, `GlyNAC: Glycine ${protocol.sirtuinStack.glyNAC.glycine} + NAC ${protocol.sirtuinStack.glyNAC.nac} — ${protocol.sirtuinStack.glyNAC.frequency}`);
        }
        doc.moveDown(0.3);
      }

      if (protocol.liposomals?.length) {
        checkPage(doc, 60);
        drawSectionHeader(doc, "Liposomal Supplements — Daily");
        protocol.liposomals.forEach(l => {
          drawBullet(doc, `${l.name}: ${l.dose} — ${l.frequency} (${l.timing || "with meals"})`);
        });
        doc.moveDown(0.3);
      }

      if (protocol.nebulization?.length) {
        checkPage(doc, 60);
        drawSectionHeader(doc, "Nebulization Protocol");
        protocol.nebulization.forEach(n => {
          drawBullet(doc, `${n.name}: ${n.solution || n.dose} — ${n.frequency}${n.duration ? `, ${n.duration}` : ""}`);
        });
        doc.moveDown(0.3);
      }

      if (protocol.topicals?.length) {
        checkPage(doc, 60);
        drawSectionHeader(doc, "Topical Applications");
        protocol.topicals.forEach(t => {
          drawBullet(doc, `${t.name} (${t.form || "topical"}): ${t.application} — ${t.frequency}`);
        });
        doc.moveDown(0.3);
      }

      if (protocol.exosomes?.length) {
        checkPage(doc, 60);
        drawSectionHeader(doc, "Exosome Therapy Schedule");
        protocol.exosomes.forEach(e => {
          drawBullet(doc, `${e.name} (${e.source}): ${e.concentration} via ${e.route} — ${e.frequency}${e.notes ? ` — ${e.notes}` : ""}`);
        });
        doc.moveDown(0.3);
      }

      newPage(doc, pn);
      drawSectionHeader(doc, "Resources & Guides");
      doc.fontSize(10).fillColor(COLORS.text).text(
        "These complementary guides are available from your Trustee via the Forgotten Formula Drive Library:",
        65, undefined, { width: doc.page.width - 130 }
      );
      doc.moveDown(0.3);
      resources.driveResources.forEach(dr => {
        const typeLabel = dr.type === "folder" ? "Drive Folder" : dr.type === "document" ? "Document" : "Guide";
        drawResourceLink(doc, dr.title, typeLabel, dr.description);
      });

      drawDisclaimer(doc);
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}


export function generatePeptideSchedulePDF(
  protocol: HealingProtocol,
  _profile: PatientProfile
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "LETTER",
        margins: { top: 60, bottom: 60, left: 55, right: 55 },
        info: {
          Title: `${protocol.patientName} - Peptide & Injection Protocol`,
          Author: "Forgotten Formula PMA - DR. FORMULA",
          Subject: "Peptide Protocol Schedule",
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const pn = protocol.patientName;
      const isCancer = getPatientResources(protocol, _profile).isCancer;
      const dateStr = protocol.generatedDate || new Date().toISOString().split("T")[0];
      const totalPeptides = (protocol.injectablePeptides?.length || 0) + (protocol.oralPeptides?.length || 0) + (protocol.bioregulators?.length || 0);

      drawBrandedCoverPage(doc, "Peptide & Injection Protocol", `${totalPeptides} compounds — Complete dosing & reconstitution guide`, pn, dateStr, isCancer);

      if (protocol.injectablePeptides?.length > 0) {
        newPage(doc, pn);
        drawSectionHeader(doc, "Injectable Peptides");
        drawInfoBox(doc, `${protocol.injectablePeptides.length} injectable peptides in this protocol. All products available at ${FF_SHOP}`);
        doc.moveDown(0.3);

        protocol.injectablePeptides.forEach(p => {
          checkPage(doc, 140);
          const startY = doc.y;

          doc.rect(55, startY, doc.page.width - 110, 24).fill("#1A2A3A");
          doc.fontSize(13).fillColor(COLORS.teal).text(p.name, 65, startY + 5);
          doc.y = startY + 30;

          const fields = [
            { label: "Vial Size", value: p.vialSize },
            { label: "Reconstitution", value: p.reconstitution },
            { label: "Dose", value: p.dose },
            { label: "Route", value: p.route },
            { label: "Frequency", value: p.frequency },
            { label: "Duration", value: p.duration },
            { label: "Purpose", value: p.purpose },
          ];

          fields.forEach(f => {
            if (f.value) {
              checkPage(doc, 18);
              doc.rect(65, doc.y - 1, doc.page.width - 135, 16).fill(doc.y % 2 === 0 ? "#FAFAFA" : COLORS.white);
              doc.fontSize(9).fillColor(COLORS.secondary).text(`${f.label}:`, 70, doc.y + 2, { continued: true, width: 100 });
              doc.fillColor(COLORS.text).text(` ${f.value}`, { width: doc.page.width - 210 });
            }
          });

          if (p.notes) {
            doc.fontSize(9).fillColor(COLORS.warningOrange).text(`\u26A0 ${p.notes}`, 70, undefined, { width: doc.page.width - 140 });
          }

          doc.moveDown(0.6);
          doc.rect(55, doc.y, doc.page.width - 110, 0.5).fill("#E0E0E0");
          doc.moveDown(0.4);
        });
      }

      if (protocol.bioregulators?.length > 0) {
        newPage(doc, pn);
        drawSectionHeader(doc, "PCC Bioregulators (Khavinson Peptides)", "#6A1B9A");
        drawInfoBox(doc, "Bioregulators are short-chain peptides that target specific organs for cellular regeneration. Take on empty stomach.");
        doc.moveDown(0.3);

        protocol.bioregulators.forEach(b => {
          checkPage(doc, 80);
          doc.fontSize(12).fillColor(COLORS.primary).text(b.name, 65);
          doc.moveDown(0.1);
          drawLabelValue(doc, "Target Organ", b.targetOrgan || "General");
          drawLabelValue(doc, "Dose", b.dose);
          drawLabelValue(doc, "Frequency", b.frequency);
          drawLabelValue(doc, "Duration", b.duration);
          doc.moveDown(0.4);
        });
      }

      if (protocol.oralPeptides?.length > 0) {
        checkPage(doc, 100);
        drawSectionHeader(doc, "Oral Peptides", "#2E7D32");
        protocol.oralPeptides.forEach(p => {
          checkPage(doc, 60);
          doc.fontSize(12).fillColor(COLORS.primary).text(p.name, 65);
          drawLabelValue(doc, "Dose", p.dose);
          drawLabelValue(doc, "Frequency", p.frequency);
          drawLabelValue(doc, "Duration", p.duration);
          drawLabelValue(doc, "Purpose", p.purpose);
          doc.moveDown(0.4);
        });
      }

      if (protocol.imTherapies?.length > 0) {
        checkPage(doc, 100);
        drawSectionHeader(doc, "IM (Intramuscular) Therapies", "#4527A0");
        protocol.imTherapies.forEach(im => {
          checkPage(doc, 60);
          doc.fontSize(12).fillColor(COLORS.primary).text(im.name, 65);
          drawLabelValue(doc, "Dose", im.dose);
          drawLabelValue(doc, "Frequency", im.frequency);
          drawLabelValue(doc, "Purpose", im.purpose);
          doc.moveDown(0.4);
        });
      }

      if (protocol.ivTherapies?.length > 0) {
        checkPage(doc, 100);
        drawSectionHeader(doc, "IV Therapy Schedule", "#00838F");
        protocol.ivTherapies.forEach(iv => {
          checkPage(doc, 60);
          doc.fontSize(12).fillColor(COLORS.primary).text(iv.name, 65);
          drawLabelValue(doc, "Frequency", iv.frequency);
          drawLabelValue(doc, "Duration", iv.duration);
          drawLabelValue(doc, "Purpose", iv.purpose);
          if (iv.notes) {
            doc.fontSize(9).fillColor(COLORS.lightText).text(`Note: ${iv.notes}`, 70, undefined, { width: doc.page.width - 140 });
          }
          doc.moveDown(0.4);
        });
      }

      if (protocol.suppositories?.length > 0) {
        checkPage(doc, 100);
        drawSectionHeader(doc, "ECS Suppository Protocols", "#2E7D32");
        drawInfoBox(doc, "Suppositories bypass first-pass metabolism for higher bioavailability. Store refrigerated, insert rectally.");
        doc.moveDown(0.3);

        protocol.suppositories.forEach(s => {
          checkPage(doc, 80);
          doc.fontSize(12).fillColor(COLORS.primary).text(`${s.name} (${s.timing})`, 65);
          drawLabelValue(doc, "Formula", s.formula);
          drawLabelValue(doc, "Base", s.base);
          drawLabelValue(doc, "Frequency", s.frequency);
          drawLabelValue(doc, "Purpose", s.purpose);
          doc.moveDown(0.4);
        });
      }

      if (protocol.exosomes?.length > 0) {
        checkPage(doc, 100);
        drawSectionHeader(doc, "Exosome Therapy", "#880E4F");
        protocol.exosomes.forEach(e => {
          checkPage(doc, 80);
          doc.fontSize(12).fillColor(COLORS.primary).text(e.name, 65);
          drawLabelValue(doc, "Source", e.source);
          drawLabelValue(doc, "Concentration", e.concentration);
          drawLabelValue(doc, "Route", e.route);
          drawLabelValue(doc, "Frequency", e.frequency);
          drawLabelValue(doc, "Purpose", e.purpose);
          if (e.notes) doc.fontSize(9).fillColor(COLORS.lightText).text(`Note: ${e.notes}`, 70, undefined, { width: doc.page.width - 140 });
          doc.moveDown(0.4);
        });
      }

      if (protocol.nebulization?.length > 0) {
        checkPage(doc, 100);
        drawSectionHeader(doc, "Nebulization Protocols", "#4527A0");
        protocol.nebulization.forEach(n => {
          checkPage(doc, 80);
          doc.fontSize(12).fillColor(COLORS.primary).text(n.name, 65);
          drawLabelValue(doc, "Solution", n.solution);
          drawLabelValue(doc, "Dose", n.dose);
          drawLabelValue(doc, "Frequency", n.frequency);
          drawLabelValue(doc, "Duration", n.duration);
          drawLabelValue(doc, "Purpose", n.purpose);
          doc.moveDown(0.4);
        });
      }

      if (protocol.liposomals?.length > 0) {
        checkPage(doc, 100);
        drawSectionHeader(doc, "Liposomal Supplements", "#00695C");
        drawInfoBox(doc, "Liposomal delivery provides enhanced bioavailability. Take on empty stomach for best absorption.");
        doc.moveDown(0.3);
        protocol.liposomals.forEach(l => {
          checkPage(doc, 60);
          doc.fontSize(12).fillColor(COLORS.primary).text(l.name, 65);
          drawLabelValue(doc, "Dose", l.dose);
          drawLabelValue(doc, "Frequency", l.frequency);
          drawLabelValue(doc, "Purpose", l.purpose);
          doc.moveDown(0.4);
        });
      }

      if (protocol.topicals?.length > 0) {
        checkPage(doc, 100);
        drawSectionHeader(doc, "Topical Protocols", "#5D4037");
        protocol.topicals.forEach(t => {
          checkPage(doc, 60);
          doc.fontSize(12).fillColor(COLORS.primary).text(t.name, 65);
          drawLabelValue(doc, "Form", t.form);
          drawLabelValue(doc, "Application", t.application);
          drawLabelValue(doc, "Frequency", t.frequency);
          drawLabelValue(doc, "Purpose", t.purpose);
          doc.moveDown(0.4);
        });
      }

      if (protocol.sirtuinStack?.mitoSTAC || protocol.sirtuinStack?.glyNAC || protocol.sirtuinStack?.nadPrecursors) {
        checkPage(doc, 100);
        drawSectionHeader(doc, "Sirtuin & Mitochondrial Stack", "#1565C0");
        drawInfoBox(doc, "Sirtuin activation and mitochondrial support are foundational to the FF PMA 2026 methodology.");
        doc.moveDown(0.3);

        if (protocol.sirtuinStack.mitoSTAC) {
          checkPage(doc, 60);
          doc.fontSize(12).fillColor(COLORS.primary).text("MitoSTAC Protocol", 65);
          drawLabelValue(doc, "Resveratrol", protocol.sirtuinStack.mitoSTAC.resveratrol);
          drawLabelValue(doc, "Pterostilbene", protocol.sirtuinStack.mitoSTAC.pterostilbene);
          drawLabelValue(doc, "Quercetin", protocol.sirtuinStack.mitoSTAC.quercetin);
          drawLabelValue(doc, "Fisetin", protocol.sirtuinStack.mitoSTAC.fisetin);
          doc.moveDown(0.4);
        }
        if (protocol.sirtuinStack.glyNAC) {
          checkPage(doc, 40);
          doc.fontSize(12).fillColor(COLORS.primary).text("GlyNAC Protocol", 65);
          drawLabelValue(doc, "Glycine", protocol.sirtuinStack.glyNAC.glycine);
          drawLabelValue(doc, "NAC", protocol.sirtuinStack.glyNAC.nac);
          drawLabelValue(doc, "Frequency", protocol.sirtuinStack.glyNAC.frequency);
          doc.moveDown(0.4);
        }
        if (protocol.sirtuinStack.nadPrecursors) {
          checkPage(doc, 40);
          doc.fontSize(12).fillColor(COLORS.primary).text("NAD+ Precursors", 65);
          drawLabelValue(doc, "Compound", protocol.sirtuinStack.nadPrecursors.compound);
          drawLabelValue(doc, "Dose", protocol.sirtuinStack.nadPrecursors.dose);
          drawLabelValue(doc, "Frequency", protocol.sirtuinStack.nadPrecursors.frequency);
          doc.moveDown(0.4);
        }
      }

      if (!protocol.injectablePeptides?.length && !protocol.bioregulators?.length &&
          !protocol.oralPeptides?.length && !protocol.imTherapies?.length && !protocol.ivTherapies?.length) {
        newPage(doc, pn);
        drawBody(doc, "No peptide or injection protocols have been defined for this protocol. Contact your Trustee for guidance.");
      }

      newPage(doc, pn);
      drawSectionHeader(doc, "Order Products");
      doc.fontSize(11).fillColor(COLORS.text).text(
        "All peptides, bioregulators, and supplements referenced in this protocol are available through the Forgotten Formula PMA product catalog. " +
        "Healer pricing is applied at checkout for PMA members.",
        65, undefined, { width: doc.page.width - 130 }
      );
      doc.moveDown(0.5);

      doc.fontSize(12).fillColor(COLORS.secondary).text("Shop Now:", 65, doc.y, { continued: true });
      doc.fillColor(COLORS.accent).text(` ${FF_SHOP}`, { link: FF_SHOP, underline: true });

      doc.moveDown(1);
      drawSubheader(doc, "Resources & Guides");
      const pepResources = getPatientResources(protocol, _profile);
      pepResources.driveResources.slice(0, 3).forEach(dr => {
        const typeLabel = dr.type === "folder" ? "Drive Folder" : dr.type === "document" ? "Document" : "Guide";
        drawResourceLink(doc, dr.title, typeLabel, dr.description);
      });

      drawDisclaimer(doc);
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
