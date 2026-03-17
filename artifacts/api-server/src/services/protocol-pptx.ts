import PptxGenJS from "pptxgenjs";
type PptxPresentation = InstanceType<typeof PptxGenJS> & { readonly shapes: typeof PptxGenJS.shapes };
const PptxModule = PptxGenJS as unknown as Record<string, unknown>;
const PptxCtor = (typeof PptxModule["default"] === "function" ? PptxModule["default"] : PptxGenJS) as typeof PptxGenJS;
import type {
  HealingProtocol,
  PatientProfile,
} from "@shared/types/protocol-assembly";
import { getPatientResources } from "./protocol-resources";
import { sanitizePmaLanguage } from "@shared/pma-language";

const PRIMARY = "1B2A4A";
const SECONDARY = "00B4D8";
const ACCENT = "D4A843";
const TEAL = "00D4AA";
const DARK_BG = "0F1923";
const CARD_BG = "1A2A3A";
const WHITE = "FFFFFF";
const LIGHT_GRAY = "F2F4F7";
const TEXT_DARK = "222222";
const TEXT_MED = "666666";
const RED_ACCENT = "C62828";
const GREEN_ACCENT = "2E7D32";
const ORANGE_ACCENT = "EF6C00";
const PURPLE_ACCENT = "6A1B9A";

function sanitizeTextInput(text: string | PptxGenJS.TextProps[]): string | PptxGenJS.TextProps[] {
  if (typeof text === 'string') return sanitizePmaLanguage(text);
  if (Array.isArray(text)) {
    return text.map(item => {
      if (typeof item === 'object' && item !== null && 'text' in item && typeof item.text === 'string') {
        return { ...item, text: sanitizePmaLanguage(item.text) };
      }
      return item;
    });
  }
  return text;
}

function addSanitizedSlide(pres: PptxPresentation) {
  const slide = addSanitizedSlide(pres);
  const originalAddText = slide.addText.bind(slide);
  slide.addText = ((text: string | PptxGenJS.TextProps[], opts?: Record<string, unknown>) => {
    return originalAddText(sanitizeTextInput(text) as string, opts);
  }) as typeof slide.addText;
  return slide;
}

const FF_WEBSITE = "https://www.forgottenformula.com";
const FF_SHOP = `${FF_WEBSITE}/shop`;

const HEADER_FONT = "Georgia";
const BODY_FONT = "Calibri";

const REFERENCE_PPTX_DRIVE_FILE_ID = "1Tc_hVN7M6c2Q41151GXsvrH8OWAZ7hPL";
const REFERENCE_PPTX_PROVENANCE = `Structural template derived from Trustee reference PPTX (Drive: ${REFERENCE_PPTX_DRIVE_FILE_ID}). Slide order, color palette, and section groupings match the reference document.`;

const REFERENCE_SLIDE_ORDER = [
  "cover",
  "summary",
  "member-info",
  "timeline",
  "trustee-analysis",
  "root-causes",
  "5rs-phases",
  "daily-schedule",
  "products-ff",
  "injectable-peptides",
  "oral-peptides",
  "bioregulators",
  "supplements",
  "supplement-timing",
  "iv-im-therapies",
  "detox-protocols",
  "parasite-antiviral",
  "ecs-protocol",
  "suppositories",
  "sirtuin-mito",
  "liposomals",
  "nebulization",
  "topicals",
  "exosomes",
  "dietary-protocol",
  "lifestyle",
  "follow-up",
  "books",
  "research-links",
  "drive-links",
  "commitment",
] as const;

function makeShadow(): PptxGenJS.ShadowProps {
  return { type: "outer", blur: 6, offset: 2, color: "000000", opacity: 0.15, angle: 135 };
}

export async function generateProtocolPPTX(
  protocol: HealingProtocol,
  profile: PatientProfile
): Promise<Buffer> {
  console.log(`[PPTX] Generating presentation for ${protocol.patientName} (${REFERENCE_SLIDE_ORDER.length} slide types in reference order)`);
  console.log(`[PPTX] Provenance: ${REFERENCE_PPTX_PROVENANCE}`);
  const pres = new PptxCtor() as PptxPresentation;
  pres.layout = "LAYOUT_16x9";
  pres.author = "Forgotten Formula PMA — DR. FORMULA";
  pres.title = `${protocol.patientName} — Member Protocol 2026`;
  pres.subject = REFERENCE_PPTX_PROVENANCE;

  const resources = getPatientResources(protocol, profile);
  const dateStr = protocol.generatedDate || new Date().toISOString().split("T")[0];

  slideCover(pres, protocol, dateStr, resources.isCancer);
  slideSummary(pres, protocol);
  slideMemberInfo(pres, protocol, profile, resources);
  slideTimeline(pres, profile);
  slideTrusteeAnalysis(pres, protocol);
  slideRootCauses(pres, protocol);

  if (protocol.phases?.length) {
    slide5Rs(pres, protocol);
  }

  slideDailySchedule(pres, protocol);

  slideProductsFF(pres, protocol);
  if (protocol.injectablePeptides?.length) {
    slideInjectablePeptides(pres, protocol);
  }
  if (protocol.oralPeptides?.length) {
    slideOralPeptides(pres, protocol);
  }
  if (protocol.bioregulators?.length) {
    slideBioregulators(pres, protocol);
  }
  if (protocol.supplements?.length) {
    slideSupplements(pres, protocol);
    slideSupplementTiming(pres, protocol);
  }
  if (protocol.ivTherapies?.length || protocol.imTherapies?.length) {
    slideIVIM(pres, protocol);
  }
  if (protocol.detoxProtocols?.length) {
    slideDetox(pres, protocol);
  }
  if (protocol.parasiteAntiviralProtocols?.length) {
    slideParasite(pres, protocol);
  }
  if (protocol.ecsProtocol?.overview) {
    slideECS(pres, protocol);
  }
  if (protocol.suppositories?.length) {
    slideSuppositories(pres, protocol);
  }
  if (protocol.sirtuinStack?.mitoSTAC) {
    slideSirtuinMito(pres, protocol);
  }
  if (protocol.liposomals?.length) {
    slideLiposomals(pres, protocol);
  }
  if (protocol.nebulization?.length) {
    slideNebulization(pres, protocol);
  }
  if (protocol.topicals?.length) {
    slideTopicals(pres, protocol);
  }
  if (protocol.exosomes?.length) {
    slideExosomes(pres, protocol);
  }
  if (protocol.dietaryProtocol?.phases?.length) {
    slideDietaryProtocol(pres, protocol);
  }
  if (protocol.lifestyleRecommendations?.length || protocol.dietaryGuidelines?.length) {
    slideLifestyle(pres, protocol);
  }
  if (protocol.followUpPlan?.length || protocol.labsRequired?.length) {
    slideFollowUp(pres, protocol);
  }

  if (resources.books.length > 0) {
    slideBooks(pres, resources);
  }
  slideResearchLinks(pres, resources);
  slideDriveLinks(pres, resources);
  slideCommitment(pres);

  const slideCount = (pres as unknown as { slides: unknown[] }).slides?.length || 0;
  console.log(`[PPTX] Generated ${slideCount} slides for ${protocol.patientName} — modalities: ECS=${!!protocol.ecsProtocol}, sirtuin=${!!protocol.sirtuinStack}, liposomals=${protocol.liposomals?.length || 0}, nebulization=${protocol.nebulization?.length || 0}, topicals=${protocol.topicals?.length || 0}, exosomes=${protocol.exosomes?.length || 0}`);
  const data = await pres.write({ outputType: "nodebuffer" });
  return Buffer.from(data as ArrayBuffer);
}

function slideCover(pres: PptxPresentation, protocol: HealingProtocol, date: string, isCancer: boolean) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: DARK_BG };

  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: SECONDARY } });
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.565, w: 10, h: 0.06, fill: { color: SECONDARY } });

  slide.addText("FORGOTTEN FORMULA", {
    x: 0, y: 1, w: 10, h: 0.8,
    fontSize: 36, fontFace: HEADER_FONT, color: WHITE, align: "center", bold: true,
  });
  slide.addText("PRIVATE MEMBER ASSOCIATION", {
    x: 0, y: 1.7, w: 10, h: 0.5,
    fontSize: 14, fontFace: BODY_FONT, color: SECONDARY, align: "center",
  });

  slide.addShape(pres.shapes.LINE, {
    x: 3.5, y: 2.4, w: 3, h: 0,
    line: { color: ACCENT, width: 2 },
  });

  slide.addText("Member Protocol  2026", {
    x: 0, y: 2.7, w: 10, h: 0.7,
    fontSize: 28, fontFace: HEADER_FONT, color: ACCENT, align: "center",
  });
  slide.addText(protocol.patientName, {
    x: 0, y: 3.4, w: 10, h: 0.5,
    fontSize: 20, fontFace: BODY_FONT, color: SECONDARY, align: "center",
  });
  slide.addText(`Prepared by: FF Trustee Michael Blake`, {
    x: 0, y: 3.9, w: 10, h: 0.4,
    fontSize: 11, fontFace: BODY_FONT, color: "AAAAAA", align: "center",
  });

  if (isCancer) {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 3.2, y: 4.3, w: 3.6, h: 0.35,
      fill: { color: "331111" },
    });
    slide.addText("CANCER-SPECIFIC PROTOCOL", {
      x: 3.2, y: 4.3, w: 3.6, h: 0.35,
      fontSize: 10, fontFace: BODY_FONT, color: "FF4444", align: "center", valign: "middle",
    });
  }

  slide.addText([
    { text: '"Before you heal someone, ask him if he\'s willing to give up the things that make him sick"', options: { italic: true, color: "777777", fontSize: 9, breakLine: true } },
    { text: "— Hippocrates", options: { color: SECONDARY, fontSize: 9 } },
  ], { x: 1.5, y: 4.8, w: 7, h: 0.6, align: "center", fontFace: BODY_FONT });
}

function slideSummary(pres: PptxPresentation, protocol: HealingProtocol) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: LIGHT_GRAY };

  slide.addText("Presentation Summary", {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 28, fontFace: HEADER_FONT, color: PRIMARY, bold: true, margin: 0,
  });

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 0.95, w: 9, h: 4.3,
    fill: { color: WHITE }, shadow: makeShadow(),
  });

  const summaryText = protocol.summary || "Comprehensive healing protocol covering detox, immune restoration, peptide therapy, and metabolic repair.";

  slide.addText(summaryText, {
    x: 0.8, y: 1.1, w: 8.4, h: 2.5,
    fontSize: 13, fontFace: BODY_FONT, color: TEXT_DARK, valign: "top",
  });

  const highlights = [
    "Addresses toxin exposure, gut health, and nutrient deficiencies",
    "5 Stages of Wellness to achieve balance",
    "Emphasizes holistic approach focusing on inflammation, viral load, parasite load, and metabolic functionality",
  ];

  slide.addText(highlights.map((h, i) => ({
    text: h,
    options: { bullet: true, breakLine: i < highlights.length - 1, fontSize: 12, color: TEXT_DARK },
  })), {
    x: 0.8, y: 3.5, w: 8.4, h: 1.5,
    fontFace: BODY_FONT, valign: "top",
  });

  slide.addText('"The natural healing force within each of us is the greatest force in getting well"', {
    x: 1, y: 5.0, w: 8, h: 0.5,
    fontSize: 10, fontFace: BODY_FONT, color: SECONDARY, italic: true, align: "center",
  });
}

function slideMemberInfo(pres: PptxPresentation, protocol: HealingProtocol, profile: PatientProfile, resources: ReturnType<typeof getPatientResources>) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: LIGHT_GRAY };

  slide.addText("Member Information", {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 28, fontFace: HEADER_FONT, color: PRIMARY, bold: true, margin: 0,
  });

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 0.95, w: 4.2, h: 2.2,
    fill: { color: WHITE }, shadow: makeShadow(),
  });

  const fields = [
    { label: "Name", value: protocol.patientName },
    { label: "Age", value: String(protocol.patientAge) },
    { label: "Gender", value: profile.gender || "N/A" },
    { label: "Location", value: profile.location || "N/A" },
    { label: "Protocol Duration", value: `${protocol.protocolDurationDays} days` },
  ];

  slide.addText(fields.map((f, i) => ([
    { text: `${f.label}: `, options: { bold: true, color: SECONDARY, fontSize: 11, breakLine: false } },
    { text: f.value, options: { color: TEXT_DARK, fontSize: 11, breakLine: i < fields.length - 1 } },
  ])).flat(), {
    x: 0.7, y: 1.1, w: 3.8, h: 2.0,
    fontFace: BODY_FONT, valign: "top",
  });

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 5.0, y: 0.95, w: 4.5, h: 2.2,
    fill: { color: WHITE }, shadow: makeShadow(),
  });

  const diagnoses = (profile.currentDiagnoses || []).slice(0, 5);
  const complaints = (profile.chiefComplaints || []).slice(0, 5);

  slide.addText("Current Assessments:", {
    x: 5.2, y: 1.0, w: 4.1, h: 0.3,
    fontSize: 11, fontFace: BODY_FONT, color: SECONDARY, bold: true,
  });

  if (diagnoses.length > 0) {
    slide.addText(diagnoses.map((d, i) => ({
      text: d,
      options: { bullet: true, breakLine: i < diagnoses.length - 1, fontSize: 10, color: TEXT_DARK },
    })), {
      x: 5.2, y: 1.3, w: 4.1, h: 0.9,
      fontFace: BODY_FONT, valign: "top",
    });
  }

  if (complaints.length > 0) {
    slide.addText("Symptoms:", {
      x: 5.2, y: 2.2, w: 4.1, h: 0.3,
      fontSize: 11, fontFace: BODY_FONT, color: SECONDARY, bold: true,
    });
    slide.addText(complaints.map((c, i) => ({
      text: c,
      options: { bullet: true, breakLine: i < complaints.length - 1, fontSize: 10, color: TEXT_DARK },
    })), {
      x: 5.2, y: 2.5, w: 4.1, h: 0.6,
      fontFace: BODY_FONT, valign: "top",
    });
  }

  if (resources.books.length > 0) {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 3.35, w: 9, h: 2.0,
      fill: { color: WHITE }, shadow: makeShadow(),
    });

    slide.addText("Recommended Starter Books:", {
      x: 0.7, y: 3.4, w: 8.6, h: 0.3,
      fontSize: 12, fontFace: HEADER_FONT, color: ACCENT, bold: true,
    });

    const bookItems = resources.books.slice(0, 6).map((book, i) => ([
      { text: `${book.title}`, options: { bold: true, color: PRIMARY, fontSize: 10, breakLine: false } },
      { text: ` — ${book.reason}`, options: { color: TEXT_MED, fontSize: 9, breakLine: i < Math.min(resources.books.length, 6) - 1 } },
    ])).flat();

    slide.addText(bookItems, {
      x: 0.7, y: 3.75, w: 8.6, h: 1.5,
      fontFace: BODY_FONT, valign: "top",
    });
  }
}

function slideTimeline(pres: PptxPresentation, profile: PatientProfile) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: LIGHT_GRAY };

  slide.addText("Member Timeline", {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 28, fontFace: HEADER_FONT, color: PRIMARY, bold: true, margin: 0,
  });

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 0.95, w: 9, h: 4.3,
    fill: { color: WHITE }, shadow: makeShadow(),
  });

  const events = (profile.medicalTimeline || []).slice(0, 8);
  if (events.length > 0) {
    const items = events.map((ev, i) => ([
      { text: `${ev.ageRange}${ev.year ? ` (${ev.year})` : ""}`, options: { bold: true, color: SECONDARY, fontSize: 11, breakLine: false } },
      { text: ` — ${ev.event}`, options: { color: TEXT_DARK, fontSize: 11, breakLine: false } },
      { text: ` (${ev.significance})`, options: { color: TEXT_MED, fontSize: 9, breakLine: i < events.length - 1 } },
    ])).flat();

    slide.addText(items, {
      x: 0.7, y: 1.1, w: 8.6, h: 4.0,
      fontFace: BODY_FONT, valign: "top",
    });
  } else {
    slide.addText("Timeline will be populated from intake call and medical history review.", {
      x: 0.7, y: 2.5, w: 8.6, h: 0.5,
      fontSize: 14, fontFace: BODY_FONT, color: TEXT_MED, align: "center",
    });
  }
}

function slideTrusteeAnalysis(pres: PptxPresentation, protocol: HealingProtocol) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: LIGHT_GRAY };

  slide.addText("Trustee's Analysis", {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 28, fontFace: HEADER_FONT, color: PRIMARY, bold: true, margin: 0,
  });

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 0.95, w: 9, h: 4.3,
    fill: { color: WHITE }, shadow: makeShadow(),
  });

  slide.addText(protocol.summary || "", {
    x: 0.7, y: 1.1, w: 8.6, h: 4.0,
    fontSize: 12, fontFace: BODY_FONT, color: TEXT_DARK, valign: "top",
  });
}

function slideRootCauses(pres: PptxPresentation, protocol: HealingProtocol) {
  if (!protocol.rootCauseAnalysis?.length) return;

  const slide = addSanitizedSlide(pres);
  slide.background = { color: LIGHT_GRAY };

  slide.addText("Root Cause Analysis", {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 28, fontFace: HEADER_FONT, color: PRIMARY, bold: true, margin: 0,
  });

  const causes = protocol.rootCauseAnalysis.slice(0, 5);
  const cardHeight = Math.min(0.85, 4.0 / causes.length);
  const startY = 1.0;

  causes.forEach((rc, idx) => {
    const y = startY + idx * (cardHeight + 0.1);
    const colors = [RED_ACCENT, ORANGE_ACCENT, "F9A825", GREEN_ACCENT, "1565C0"];

    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y, w: 9, h: cardHeight,
      fill: { color: WHITE }, shadow: makeShadow(),
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y, w: 0.08, h: cardHeight,
      fill: { color: colors[idx] || PRIMARY },
    });

    slide.addText(`${rc.rank}. ${rc.cause}`, {
      x: 0.7, y, w: 3, h: cardHeight * 0.5,
      fontSize: 12, fontFace: HEADER_FONT, color: PRIMARY, bold: true, valign: "middle",
    });
    slide.addText(rc.category.toUpperCase(), {
      x: 0.7, y: y + cardHeight * 0.45, w: 2, h: cardHeight * 0.4,
      fontSize: 8, fontFace: BODY_FONT, color: colors[idx] || ACCENT, valign: "top",
    });
    slide.addText(rc.details, {
      x: 3.5, y, w: 5.8, h: cardHeight,
      fontSize: 10, fontFace: BODY_FONT, color: TEXT_DARK, valign: "middle",
    });
  });
}

function slide5Rs(pres: PptxPresentation, protocol: HealingProtocol) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: DARK_BG };

  slide.addText("5 R's to Healing at FF PMA", {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 28, fontFace: HEADER_FONT, color: WHITE, bold: true, margin: 0,
  });

  const phaseColors = [RED_ACCENT, ORANGE_ACCENT, "F9A825", GREEN_ACCENT, "1565C0"];
  const phases = protocol.phases?.slice(0, 5) || [];

  phases.forEach((phase, idx) => {
    const y = 1.1 + idx * 0.85;

    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y, w: 9, h: 0.75,
      fill: { color: CARD_BG },
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y, w: 0.08, h: 0.75,
      fill: { color: phaseColors[idx] || SECONDARY },
    });

    slide.addText(`Phase ${phase.phaseNumber}: ${phase.name}`, {
      x: 0.7, y, w: 3.5, h: 0.35,
      fontSize: 13, fontFace: HEADER_FONT, color: phaseColors[idx] || SECONDARY, bold: true, valign: "middle",
    });
    slide.addText(phase.weekRange, {
      x: 0.7, y: y + 0.35, w: 2, h: 0.3,
      fontSize: 9, fontFace: BODY_FONT, color: TEXT_MED, valign: "top",
    });
    slide.addText(phase.focus, {
      x: 4.2, y, w: 5.1, h: 0.75,
      fontSize: 10, fontFace: BODY_FONT, color: WHITE, valign: "middle",
    });
  });
}

function slideDailySchedule(pres: PptxPresentation, protocol: HealingProtocol) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: LIGHT_GRAY };

  slide.addText("Daily Schedule", {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 28, fontFace: HEADER_FONT, color: PRIMARY, bold: true, margin: 0,
  });

  if (!protocol.dailySchedule) return;

  const periods = [
    { key: "morning" as const, label: "MORNING", color: "FF8F00" },
    { key: "midday" as const, label: "MIDDAY", color: "0097A7" },
    { key: "evening" as const, label: "EVENING", color: "5C6BC0" },
    { key: "bedtime" as const, label: "BEDTIME", color: "37474F" },
  ];

  const colW = 2.15;
  periods.forEach((period, colIdx) => {
    const x = 0.5 + colIdx * (colW + 0.15);
    const items = protocol.dailySchedule[period.key] || [];

    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.0, w: colW, h: 0.35,
      fill: { color: period.color },
    });
    slide.addText(period.label, {
      x, y: 1.0, w: colW, h: 0.35,
      fontSize: 11, fontFace: BODY_FONT, color: WHITE, align: "center", valign: "middle", bold: true,
    });

    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.35, w: colW, h: 3.8,
      fill: { color: WHITE }, shadow: makeShadow(),
    });

    const textItems = items.slice(0, 10).map((item, i) => ({
      text: `${item.item}${item.details ? ` — ${item.details}` : ""}`,
      options: {
        bullet: true,
        breakLine: i < Math.min(items.length, 10) - 1,
        fontSize: 8,
        color: TEXT_DARK,
      },
    }));

    if (textItems.length > 0) {
      slide.addText(textItems, {
        x: x + 0.05, y: 1.4, w: colW - 0.1, h: 3.7,
        fontFace: BODY_FONT, valign: "top",
      });
    }
  });
}

function slideProductsFF(pres: PptxPresentation, protocol: HealingProtocol) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: LIGHT_GRAY };

  slide.addText("Therapeutics: Forgotten Formula Products", {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 24, fontFace: HEADER_FONT, color: PRIMARY, bold: true, margin: 0,
  });

  const allItems: string[] = [];
  protocol.supplements?.forEach(s => allItems.push(`${s.name} — ${s.dose} (${s.timing})`));
  protocol.detoxProtocols?.forEach(d => allItems.push(`${d.name} — ${d.method}`));

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.0, w: 9, h: 4.2,
    fill: { color: WHITE }, shadow: makeShadow(),
  });

  const textItems = allItems.slice(0, 16).map((item, i) => ({
    text: item,
    options: { bullet: true, breakLine: i < Math.min(allItems.length, 16) - 1, fontSize: 11, color: TEXT_DARK },
  }));

  if (textItems.length > 0) {
    slide.addText(textItems, {
      x: 0.7, y: 1.1, w: 8.6, h: 3.5,
      fontFace: BODY_FONT, valign: "top",
    });
  }

  slide.addText(`Shop: ${FF_SHOP}`, {
    x: 0.7, y: 4.7, w: 8.6, h: 0.4,
    fontSize: 10, fontFace: BODY_FONT, color: ACCENT, hyperlink: { url: FF_SHOP },
  });
}

function slideInjectablePeptides(pres: PptxPresentation, protocol: HealingProtocol) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: DARK_BG };

  slide.addText("Therapeutics: Injectable Peptide Protocol", {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 24, fontFace: HEADER_FONT, color: TEAL, bold: true, margin: 0,
  });

  const peptides = protocol.injectablePeptides || [];

  const headerRow = [
    { text: "Peptide", options: { bold: true, color: WHITE, fontSize: 9, fill: { color: PRIMARY } } },
    { text: "Vial/Recon", options: { bold: true, color: WHITE, fontSize: 9, fill: { color: PRIMARY } } },
    { text: "Dose", options: { bold: true, color: WHITE, fontSize: 9, fill: { color: PRIMARY } } },
    { text: "Frequency", options: { bold: true, color: WHITE, fontSize: 9, fill: { color: PRIMARY } } },
    { text: "Duration", options: { bold: true, color: WHITE, fontSize: 9, fill: { color: PRIMARY } } },
    { text: "Purpose", options: { bold: true, color: WHITE, fontSize: 9, fill: { color: PRIMARY } } },
  ];

  const tableRows: PptxGenJS.TableCell[][] = [headerRow];
  peptides.forEach(p => {
    tableRows.push([
      { text: p.name, options: { fontSize: 8, color: TEAL, bold: true } },
      { text: `${p.vialSize}\n${p.reconstitution}`, options: { fontSize: 7, color: WHITE } },
      { text: p.dose, options: { fontSize: 8, color: WHITE } },
      { text: p.frequency, options: { fontSize: 8, color: WHITE } },
      { text: p.duration, options: { fontSize: 8, color: WHITE } },
      { text: p.purpose, options: { fontSize: 7, color: "AAAAAA" } },
    ]);
  });

  slide.addTable(tableRows, {
    x: 0.3, y: 1.0, w: 9.4,
    colW: [1.5, 1.8, 1.2, 1.2, 1.0, 2.7],
    border: { pt: 0.5, color: "333333" },
    fill: { color: CARD_BG },
    autoPage: false,
  });
}

function slideOralPeptides(pres: PptxPresentation, protocol: HealingProtocol) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: LIGHT_GRAY };

  slide.addText("Therapeutics: Oral Peptides", {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 24, fontFace: HEADER_FONT, color: GREEN_ACCENT, bold: true, margin: 0,
  });

  const peptides = protocol.oralPeptides || [];

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.0, w: 9, h: 4.2,
    fill: { color: WHITE }, shadow: makeShadow(),
  });

  const items = peptides.slice(0, 10).map((p, i) => ([
    { text: p.name, options: { bold: true, color: PRIMARY, fontSize: 12, breakLine: false } },
    { text: ` — ${p.dose} | ${p.frequency} | ${p.duration}`, options: { color: TEXT_MED, fontSize: 10, breakLine: false } },
    { text: `\n   Purpose: ${p.purpose}`, options: { color: TEXT_DARK, fontSize: 9, breakLine: i < peptides.length - 1 } },
  ])).flat();

  slide.addText(items, {
    x: 0.7, y: 1.1, w: 8.6, h: 4.0,
    fontFace: BODY_FONT, valign: "top",
  });
}

function slideBioregulators(pres: PptxPresentation, protocol: HealingProtocol) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: LIGHT_GRAY };

  slide.addText("Therapeutics: Forgotten Formula Oral Bioregulators", {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 22, fontFace: HEADER_FONT, color: PURPLE_ACCENT, bold: true, margin: 0,
  });

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.0, w: 9, h: 4.2,
    fill: { color: WHITE }, shadow: makeShadow(),
  });

  slide.addText("The following bioregulators run for the entire 90-day protocol:", {
    x: 0.7, y: 1.05, w: 8.6, h: 0.3,
    fontSize: 11, fontFace: BODY_FONT, color: TEXT_MED,
  });

  const bios = protocol.bioregulators || [];
  const items = bios.slice(0, 10).map((b, i) => ([
    { text: `${b.name}`, options: { bold: true, color: PURPLE_ACCENT, fontSize: 12, breakLine: false } },
    { text: ` — Target: ${b.targetOrgan} | ${b.dose} | ${b.frequency} | ${b.duration}`, options: { color: TEXT_DARK, fontSize: 10, breakLine: i < bios.length - 1 } },
  ])).flat();

  slide.addText(items, {
    x: 0.7, y: 1.5, w: 8.6, h: 3.5,
    fontFace: BODY_FONT, valign: "top",
  });
}

function slideSupplements(pres: PptxPresentation, protocol: HealingProtocol) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: LIGHT_GRAY };

  slide.addText("Some of your Supplements Explained", {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 24, fontFace: HEADER_FONT, color: PRIMARY, bold: true, margin: 0,
  });

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.0, w: 9, h: 4.2,
    fill: { color: WHITE }, shadow: makeShadow(),
  });

  const supps = protocol.supplements || [];
  const items = supps.slice(0, 12).map((s, i) => ([
    { text: s.name, options: { bold: true, color: SECONDARY, fontSize: 11, breakLine: false } },
    { text: ` — ${s.dose} (${s.timing})`, options: { color: TEXT_DARK, fontSize: 10, breakLine: false } },
    { text: `\n   ${s.purpose}`, options: { color: TEXT_MED, fontSize: 9, breakLine: i < Math.min(supps.length, 12) - 1 } },
  ])).flat();

  slide.addText(items, {
    x: 0.7, y: 1.1, w: 8.6, h: 4.0,
    fontFace: BODY_FONT, valign: "top",
  });
}

function slideSupplementTiming(pres: PptxPresentation, protocol: HealingProtocol) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: LIGHT_GRAY };

  slide.addText("Supplement Timing Guide", {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 24, fontFace: HEADER_FONT, color: PRIMARY, bold: true, margin: 0,
  });

  slide.addText("Proper timing maximizes absorption and minimizes interactions", {
    x: 0.5, y: 0.85, w: 9, h: 0.3,
    fontSize: 11, fontFace: BODY_FONT, color: TEXT_MED, italic: true,
  });

  const supps = protocol.supplements || [];
  const lipos = protocol.liposomals || [];

  const timingGroups: Record<string, Array<{ name: string; dose: string }>> = {
    "Morning (Empty Stomach)": [],
    "With Breakfast": [],
    "Midday": [],
    "With Dinner": [],
    "Bedtime": [],
  };

  for (const s of supps) {
    const t = (s.timing || "").toLowerCase();
    if (t.includes("empty") || t.includes("fasting") || t.includes("wake")) {
      timingGroups["Morning (Empty Stomach)"].push({ name: s.name, dose: s.dose });
    } else if (t.includes("morning") || t.includes("breakfast")) {
      timingGroups["With Breakfast"].push({ name: s.name, dose: s.dose });
    } else if (t.includes("midday") || t.includes("lunch") || t.includes("afternoon")) {
      timingGroups["Midday"].push({ name: s.name, dose: s.dose });
    } else if (t.includes("dinner") || t.includes("evening")) {
      timingGroups["With Dinner"].push({ name: s.name, dose: s.dose });
    } else if (t.includes("bed") || t.includes("night")) {
      timingGroups["Bedtime"].push({ name: s.name, dose: s.dose });
    } else {
      timingGroups["With Breakfast"].push({ name: s.name, dose: s.dose });
    }
  }
  for (const l of lipos) {
    const t = (l.timing || "").toLowerCase();
    if (t.includes("morning") || t.includes("empty")) {
      timingGroups["Morning (Empty Stomach)"].push({ name: `${l.name} (liposomal)`, dose: l.dose });
    } else {
      timingGroups["With Breakfast"].push({ name: `${l.name} (liposomal)`, dose: l.dose });
    }
  }

  let yPos = 1.2;
  for (const [period, items] of Object.entries(timingGroups)) {
    if (items.length === 0) continue;

    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: yPos, w: 9, h: 0.3,
      fill: { color: PRIMARY },
    });
    slide.addText(period, {
      x: 0.7, y: yPos, w: 8.6, h: 0.3,
      fontSize: 11, fontFace: BODY_FONT, color: WHITE, bold: true, valign: "middle",
    });
    yPos += 0.35;

    for (const item of items.slice(0, 4)) {
      slide.addShape(pres.shapes.RECTANGLE, {
        x: 0.5, y: yPos, w: 9, h: 0.35,
        fill: { color: WHITE }, shadow: makeShadow(),
      });
      slide.addText([
        { text: item.name, options: { bold: true, color: TEXT_DARK, fontSize: 10 } },
        { text: ` — ${item.dose}`, options: { color: TEXT_MED, fontSize: 9 } },
      ], {
        x: 0.7, y: yPos, w: 8.6, h: 0.35,
        fontFace: BODY_FONT, valign: "middle",
      });
      yPos += 0.38;
    }
    yPos += 0.1;

    if (yPos > 5.0) break;
  }
}

function slideIVIM(pres: PptxPresentation, protocol: HealingProtocol) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: LIGHT_GRAY };

  slide.addText("Therapeutics: IV & IM Therapy Schedule", {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 24, fontFace: HEADER_FONT, color: "00838F", bold: true, margin: 0,
  });

  let y = 1.0;

  if (protocol.ivTherapies?.length) {
    slide.addText("IV Therapies:", {
      x: 0.5, y, w: 9, h: 0.3,
      fontSize: 13, fontFace: BODY_FONT, color: "00838F", bold: true,
    });
    y += 0.35;

    protocol.ivTherapies.slice(0, 5).forEach(iv => {
      slide.addShape(pres.shapes.RECTANGLE, {
        x: 0.5, y, w: 9, h: 0.55,
        fill: { color: WHITE }, shadow: makeShadow(),
      });
      slide.addText(`${iv.name} — ${iv.frequency} for ${iv.duration} | ${iv.purpose}`, {
        x: 0.7, y, w: 8.6, h: 0.55,
        fontSize: 10, fontFace: BODY_FONT, color: TEXT_DARK, valign: "middle",
      });
      y += 0.65;
    });
  }

  if (protocol.imTherapies?.length) {
    y += 0.2;
    slide.addText("IM Therapies:", {
      x: 0.5, y, w: 9, h: 0.3,
      fontSize: 13, fontFace: BODY_FONT, color: "4527A0", bold: true,
    });
    y += 0.35;

    protocol.imTherapies.slice(0, 5).forEach(im => {
      slide.addShape(pres.shapes.RECTANGLE, {
        x: 0.5, y, w: 9, h: 0.55,
        fill: { color: WHITE }, shadow: makeShadow(),
      });
      slide.addText(`${im.name} — ${im.dose} | ${im.frequency} | ${im.purpose}`, {
        x: 0.7, y, w: 8.6, h: 0.55,
        fontSize: 10, fontFace: BODY_FONT, color: TEXT_DARK, valign: "middle",
      });
      y += 0.65;
    });
  }
}

function slideDetox(pres: PptxPresentation, protocol: HealingProtocol) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: LIGHT_GRAY };

  slide.addText("Detox & Pathogen Support", {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 24, fontFace: HEADER_FONT, color: ORANGE_ACCENT, bold: true, margin: 0,
  });

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.0, w: 9, h: 4.2,
    fill: { color: WHITE }, shadow: makeShadow(),
  });

  const detox = protocol.detoxProtocols || [];
  const items = detox.slice(0, 8).map((d, i) => ([
    { text: d.name, options: { bold: true, color: ORANGE_ACCENT, fontSize: 12, breakLine: false } },
    { text: ` — ${d.method} | ${d.frequency} for ${d.duration}`, options: { color: TEXT_DARK, fontSize: 10, breakLine: false } },
    { text: `\n   ${d.instructions}`, options: { color: TEXT_MED, fontSize: 9, breakLine: i < detox.length - 1 } },
  ])).flat();

  slide.addText(items, {
    x: 0.7, y: 1.1, w: 8.6, h: 4.0,
    fontFace: BODY_FONT, valign: "top",
  });
}

function slideParasite(pres: PptxPresentation, protocol: HealingProtocol) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: LIGHT_GRAY };

  slide.addText("Parasite & Antiviral Protocols", {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 24, fontFace: HEADER_FONT, color: "880E4F", bold: true, margin: 0,
  });

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.0, w: 9, h: 4.2,
    fill: { color: WHITE }, shadow: makeShadow(),
  });

  const prots = protocol.parasiteAntiviralProtocols || [];
  const items = prots.slice(0, 8).map((p, i) => ([
    { text: p.name, options: { bold: true, color: "880E4F", fontSize: 12, breakLine: false } },
    { text: ` — ${p.dose} | ${p.schedule} for ${p.duration}`, options: { color: TEXT_DARK, fontSize: 10, breakLine: false } },
    { text: `\n   Purpose: ${p.purpose}`, options: { color: TEXT_MED, fontSize: 9, breakLine: i < prots.length - 1 } },
  ])).flat();

  slide.addText(items, {
    x: 0.7, y: 1.1, w: 8.6, h: 4.0,
    fontFace: BODY_FONT, valign: "top",
  });
}

function slideLifestyle(pres: PptxPresentation, protocol: HealingProtocol) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: LIGHT_GRAY };

  slide.addText("Lifestyle & Dietary Guidelines", {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 24, fontFace: HEADER_FONT, color: PRIMARY, bold: true, margin: 0,
  });

  let y = 1.0;

  if (protocol.lifestyleRecommendations?.length) {
    const recs = protocol.lifestyleRecommendations.slice(0, 8);
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y, w: 4.3, h: 4.2,
      fill: { color: WHITE }, shadow: makeShadow(),
    });
    slide.addText("Lifestyle", {
      x: 0.7, y, w: 3.9, h: 0.3,
      fontSize: 12, fontFace: BODY_FONT, color: SECONDARY, bold: true,
    });

    const items = recs.map((l, i) => ({
      text: `${l.category}: ${l.recommendation}`,
      options: { bullet: true, breakLine: i < recs.length - 1, fontSize: 9, color: TEXT_DARK },
    }));
    slide.addText(items, {
      x: 0.7, y: y + 0.35, w: 3.9, h: 3.7,
      fontFace: BODY_FONT, valign: "top",
    });
  }

  if (protocol.dietaryGuidelines?.length) {
    const guidelines = protocol.dietaryGuidelines.slice(0, 8);
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 5.1, y, w: 4.4, h: 4.2,
      fill: { color: WHITE }, shadow: makeShadow(),
    });
    slide.addText("Dietary Guidelines", {
      x: 5.3, y, w: 4.0, h: 0.3,
      fontSize: 12, fontFace: BODY_FONT, color: GREEN_ACCENT, bold: true,
    });

    const items = guidelines.map((d, i) => ({
      text: d,
      options: { bullet: true, breakLine: i < guidelines.length - 1, fontSize: 9, color: TEXT_DARK },
    }));
    slide.addText(items, {
      x: 5.3, y: y + 0.35, w: 4.0, h: 3.7,
      fontFace: BODY_FONT, valign: "top",
    });
  }
}

function slideFollowUp(pres: PptxPresentation, protocol: HealingProtocol) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: LIGHT_GRAY };

  slide.addText("Follow-Up Plan & Lab Orders", {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 24, fontFace: HEADER_FONT, color: PRIMARY, bold: true, margin: 0,
  });

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.0, w: 9, h: 4.2,
    fill: { color: WHITE }, shadow: makeShadow(),
  });

  let y = 1.1;

  if (protocol.followUpPlan?.length) {
    slide.addText("Follow-Up Schedule:", {
      x: 0.7, y, w: 8.6, h: 0.3,
      fontSize: 12, fontFace: BODY_FONT, color: SECONDARY, bold: true,
    });
    y += 0.35;

    const items = protocol.followUpPlan.slice(0, 6).map((f, i) => ({
      text: `Week ${f.weekNumber}: ${f.action}${f.details ? ` — ${f.details}` : ""}`,
      options: { bullet: true, breakLine: i < protocol.followUpPlan!.length - 1, fontSize: 10, color: TEXT_DARK },
    }));
    slide.addText(items, {
      x: 0.7, y, w: 8.6, h: 1.5,
      fontFace: BODY_FONT, valign: "top",
    });
    y += 1.7;
  }

  if (protocol.labsRequired?.length) {
    slide.addText("Required Labs:", {
      x: 0.7, y, w: 8.6, h: 0.3,
      fontSize: 12, fontFace: BODY_FONT, color: SECONDARY, bold: true,
    });
    y += 0.35;

    const items = protocol.labsRequired.slice(0, 8).map((l, i) => ({
      text: l,
      options: { bullet: true, breakLine: i < protocol.labsRequired!.length - 1, fontSize: 10, color: TEXT_DARK },
    }));
    slide.addText(items, {
      x: 0.7, y, w: 8.6, h: 1.5,
      fontFace: BODY_FONT, valign: "top",
    });
  }
}

function slideBooks(pres: PptxPresentation, resources: ReturnType<typeof getPatientResources>) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: LIGHT_GRAY };

  slide.addText("Recommended Reading", {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 28, fontFace: HEADER_FONT, color: PRIMARY, bold: true, margin: 0,
  });

  const books = resources.books.slice(0, 8);
  const cardH = Math.min(0.55, 4.2 / books.length);

  books.forEach((book, idx) => {
    const y = 1.0 + idx * (cardH + 0.08);
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y, w: 9, h: cardH,
      fill: { color: WHITE }, shadow: makeShadow(),
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y, w: 0.06, h: cardH,
      fill: { color: ACCENT },
    });

    slide.addText(book.title, {
      x: 0.7, y, w: 3, h: cardH * 0.5,
      fontSize: 11, fontFace: HEADER_FONT, color: PRIMARY, bold: true, valign: "bottom",
    });
    slide.addText(`by ${book.author}`, {
      x: 0.7, y: y + cardH * 0.5, w: 3, h: cardH * 0.4,
      fontSize: 8, fontFace: BODY_FONT, color: ACCENT, valign: "top",
    });
    slide.addText(book.reason, {
      x: 3.8, y, w: 5.5, h: cardH,
      fontSize: 9, fontFace: BODY_FONT, color: TEXT_DARK, valign: "middle",
    });
  });
}

function slideResearchLinks(pres: PptxPresentation, resources: ReturnType<typeof getPatientResources>) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: LIGHT_GRAY };

  slide.addText("Research Backing Our Protocols", {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 24, fontFace: HEADER_FONT, color: PRIMARY, bold: true, margin: 0,
  });

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.0, w: 9, h: 4.2,
    fill: { color: WHITE }, shadow: makeShadow(),
  });

  const links = resources.researchLinks.slice(0, 10);
  const items = links.map((link, i) => ([
    { text: link.title, options: { bold: true, color: SECONDARY, fontSize: 10, breakLine: false } },
    { text: ` — ${link.description}`, options: { color: TEXT_MED, fontSize: 9, breakLine: false } },
    { text: `\n${link.url}`, options: { color: ACCENT, fontSize: 8, breakLine: i < links.length - 1 } },
  ])).flat();

  slide.addText(items, {
    x: 0.7, y: 1.1, w: 8.6, h: 4.0,
    fontFace: BODY_FONT, valign: "top",
  });
}

function slideDriveLinks(pres: PptxPresentation, resources: ReturnType<typeof getPatientResources>) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: LIGHT_GRAY };

  slide.addText("Additional Research and Google Drive Links", {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 22, fontFace: HEADER_FONT, color: PRIMARY, bold: true, margin: 0,
  });

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.0, w: 9, h: 3.0,
    fill: { color: WHITE }, shadow: makeShadow(),
  });

  slide.addText("Links to Daily Schedule, Library and Research, Detox Baths, and 5 Day fasting instructions", {
    x: 0.7, y: 1.05, w: 8.6, h: 0.3,
    fontSize: 11, fontFace: BODY_FONT, color: TEXT_MED,
  });

  const driveItems = resources.driveResources.map((dr, i) => ([
    { text: dr.title, options: { bold: true, color: PRIMARY, fontSize: 10, breakLine: false } },
    { text: ` — ${dr.description}`, options: { color: TEXT_MED, fontSize: 9, breakLine: false } },
    { text: `\n${dr.url}`, options: { color: SECONDARY, fontSize: 8, breakLine: i < resources.driveResources.length - 1 } },
  ])).flat();

  slide.addText(driveItems, {
    x: 0.7, y: 1.4, w: 8.6, h: 2.5,
    fontFace: BODY_FONT, valign: "top",
  });

  if (resources.youtubeResources.length > 0) {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 4.2, w: 9, h: 1.1,
      fill: { color: WHITE }, shadow: makeShadow(),
    });

    const ytItems = resources.youtubeResources.map((yt, i) => ([
      { text: yt.title, options: { bold: true, color: PRIMARY, fontSize: 10, breakLine: false } },
      { text: ` — ${yt.description}`, options: { color: TEXT_MED, fontSize: 9, breakLine: false } },
      { text: `\n${yt.url}`, options: { color: SECONDARY, fontSize: 8, breakLine: i < resources.youtubeResources.length - 1 } },
    ])).flat();

    slide.addText(ytItems, {
      x: 0.7, y: 4.25, w: 8.6, h: 1.0,
      fontFace: BODY_FONT, valign: "top",
    });
  }
}

function slideCommitment(pres: PptxPresentation) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: DARK_BG };

  slide.addText("My Commitment to You", {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 28, fontFace: HEADER_FONT, color: ACCENT, bold: true, margin: 0,
  });

  slide.addText([
    { text: "I will do everything in my power and knowledge to focus on the root of all problems. Most doctors focus only on the symptoms, not the underlying cause of the disease or issue. We will not give up on you, but you need to work with us on every step of this protocol.", options: { breakLine: true, fontSize: 11, color: WHITE } },
    { text: "\nDon't lose hope and don't give up! There is no single pill or capsule that will fix this. Only a commitment to follow the steps laid herein — if you choose to do so, the ECS, the gut, and your body will take care of itself. Homeostasis is about balance in the body.", options: { breakLine: true, fontSize: 11, color: WHITE } },
    { text: "\nWe have provided the educational tools and research to help guide you through your journey. Please utilize these resources. These are extremely specific formulations that only a handful of folks know how to do — it's my lifelong work.", options: { breakLine: true, fontSize: 11, color: WHITE } },
    { text: "\nHope is coming and a solution is in route. There is no doubt in my mind about the efficacy of our formulations and our 5 steps to health and wellness.", options: { breakLine: true, fontSize: 12, color: SECONDARY, italic: true } },
    { text: "\nThank you for giving us this opportunity. We are looking forward to healing you.", options: { breakLine: true, fontSize: 11, color: WHITE } },
  ], {
    x: 0.7, y: 1.0, w: 8.6, h: 3.2,
    fontFace: BODY_FONT, valign: "top",
  });

  slide.addText("Michael Blake", {
    x: 0, y: 4.4, w: 10, h: 0.4,
    fontSize: 16, fontFace: HEADER_FONT, color: WHITE, align: "center", bold: true,
  });
  slide.addText("FF Founder and Medical Trustee", {
    x: 0, y: 4.8, w: 10, h: 0.3,
    fontSize: 12, fontFace: BODY_FONT, color: SECONDARY, align: "center",
  });

  slide.addText('"Before you heal someone, ask him if he\'s willing to give up the things that make him sick"', {
    x: 1, y: 5.1, w: 8, h: 0.4,
    fontSize: 9, fontFace: BODY_FONT, color: "777777", align: "center", italic: true,
  });
}

function slideECS(pres: PptxPresentation, protocol: HealingProtocol) {
  const sectionSlide = addSanitizedSlide(pres);
  sectionSlide.background = { color: "0B3D2E" };
  sectionSlide.addText("ECS PROTOCOL", {
    x: 0, y: 1.8, w: 10, h: 0.8,
    fontSize: 36, fontFace: HEADER_FONT, color: WHITE, align: "center", bold: true,
  });
  sectionSlide.addText("Endocannabinoid System Optimization — Suppositories, Tinctures & Targeted Ratios", {
    x: 1, y: 2.6, w: 8, h: 0.6,
    fontSize: 14, fontFace: BODY_FONT, color: TEAL, align: "center",
  });

  const slide = addSanitizedSlide(pres);
  slide.background = { color: LIGHT_GRAY };
  slide.addText("ECS Protocol — Endocannabinoid System", {
    x: 0.5, y: 0.2, w: 9, h: 0.5,
    fontSize: 22, fontFace: HEADER_FONT, color: PRIMARY, bold: true,
  });

  const ecs = protocol.ecsProtocol!;
  slide.addText(ecs.overview || "", {
    x: 0.5, y: 0.75, w: 9, h: 0.5,
    fontSize: 10, fontFace: BODY_FONT, color: TEXT_MED,
  });

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 1.4, w: 4.5, h: 1.8,
    fill: { color: WHITE }, shadow: makeShadow(),
  });
  const df = ecs.daytimeFormula;
  const dayItems: Array<{text: string; options: Record<string, unknown>}> = [
    { text: "DAYTIME SUPPOSITORY", options: { bold: true, color: PRIMARY, fontSize: 12, breakLine: true } },
    { text: `CBD: ${df?.CBD || "25-50mg"}`, options: { fontSize: 10, color: TEXT_DARK, breakLine: true } },
    { text: `CBG: ${df?.CBG || "10-25mg"}`, options: { fontSize: 10, color: TEXT_DARK, breakLine: true } },
    { text: `DMSO: ${df?.DMSO || "5-10%"}`, options: { fontSize: 10, color: TEXT_DARK, breakLine: true } },
    { text: `Base: ${df?.base || "cacao butter"}`, options: { fontSize: 9, color: TEXT_MED, breakLine: true } },
    { text: `Delivery: ${df?.deliveryMethod || "suppository"}`, options: { fontSize: 9, color: TEXT_MED } },
  ];
  slide.addText(dayItems, { x: 0.5, y: 1.5, w: 4.1, h: 1.6, fontFace: BODY_FONT, valign: "top" });

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 5.2, y: 1.4, w: 4.5, h: 1.8,
    fill: { color: WHITE }, shadow: makeShadow(),
  });
  const nf = ecs.nighttimeFormula;
  const nightItems: Array<{text: string; options: Record<string, unknown>}> = [
    { text: "NIGHTTIME SUPPOSITORY", options: { bold: true, color: PRIMARY, fontSize: 12, breakLine: true } },
    { text: `CBD: ${nf?.CBD || "50-100mg"}`, options: { fontSize: 10, color: TEXT_DARK, breakLine: true } },
    { text: `THC: ${nf?.THC || "10-25mg"}`, options: { fontSize: 10, color: TEXT_DARK, breakLine: true } },
    { text: `CBN: ${nf?.CBN || "10-20mg"}`, options: { fontSize: 10, color: TEXT_DARK, breakLine: true } },
    { text: `DMSO: ${nf?.DMSO || "5-10%"}`, options: { fontSize: 9, color: TEXT_MED, breakLine: true } },
    { text: `Base: ${nf?.base || "cacao butter"}`, options: { fontSize: 9, color: TEXT_MED } },
  ];
  slide.addText(nightItems, { x: 5.4, y: 1.5, w: 4.1, h: 1.6, fontFace: BODY_FONT, valign: "top" });

  if (ecs.tincture) {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.3, y: 3.4, w: 9.4, h: 0.7,
      fill: { color: WHITE }, shadow: makeShadow(),
    });
    slide.addText([
      { text: `${ecs.tincture.name || "Elixir for Everything"}: `, options: { bold: true, color: PRIMARY, fontSize: 11 } },
      { text: `${ecs.tincture.dose || "1-2 mL"} ${ecs.tincture.frequency || "2x daily sublingual"} — ${ecs.tincture.cannabinoids?.join(", ") || "12 cannabinoids"}`, options: { color: TEXT_DARK, fontSize: 10 } },
    ], { x: 0.5, y: 3.45, w: 9.0, h: 0.6, fontFace: BODY_FONT, valign: "middle" });
  }

  if (ecs.targetedRatios?.length > 0) {
    const ratioItems = ecs.targetedRatios.map(tr => ([
      { text: `${tr.condition}: `, options: { bold: true, color: SECONDARY, fontSize: 10, breakLine: false } },
      { text: `${tr.ratio} — ${tr.rationale}`, options: { color: TEXT_DARK, fontSize: 9, breakLine: true } },
    ])).flat();

    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.3, y: 4.3, w: 9.4, h: 1.1,
      fill: { color: WHITE }, shadow: makeShadow(),
    });
    slide.addText([
      { text: "TARGETED CANNABINOID RATIOS", options: { bold: true, color: PRIMARY, fontSize: 11, breakLine: true } },
      ...ratioItems,
    ], { x: 0.5, y: 4.35, w: 9.0, h: 1.0, fontFace: BODY_FONT, valign: "top" });
  }
}

function slideSuppositories(pres: PptxPresentation, protocol: HealingProtocol) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: LIGHT_GRAY };
  slide.addText("Suppository Protocols", {
    x: 0.5, y: 0.2, w: 9, h: 0.5,
    fontSize: 22, fontFace: HEADER_FONT, color: PRIMARY, bold: true,
  });

  const items = (protocol.suppositories || []).map(s => ([
    { text: `${s.name} (${s.timing})`, options: { bold: true, color: PRIMARY, fontSize: 11, breakLine: true } },
    { text: `Formula: ${s.formula} | Base: ${s.base} | Freq: ${s.frequency}`, options: { color: TEXT_DARK, fontSize: 9, breakLine: true } },
    { text: `Purpose: ${s.purpose}`, options: { color: TEXT_MED, fontSize: 9, breakLine: true } },
    { text: "", options: { fontSize: 4, breakLine: true } },
  ])).flat();

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 0.8, w: 9, h: 4.5,
    fill: { color: WHITE }, shadow: makeShadow(),
  });
  slide.addText(items, { x: 0.7, y: 0.9, w: 8.6, h: 4.3, fontFace: BODY_FONT, valign: "top" });
}

function slideSirtuinMito(pres: PptxPresentation, protocol: HealingProtocol) {
  const sectionSlide = addSanitizedSlide(pres);
  sectionSlide.background = { color: "1A0A3E" };
  sectionSlide.addText("MITOCHONDRIAL & SIRTUIN SUPPORT", {
    x: 0, y: 1.8, w: 10, h: 0.8,
    fontSize: 32, fontFace: HEADER_FONT, color: WHITE, align: "center", bold: true,
  });
  sectionSlide.addText("NAD+, GlyNAC, MitoSTAC Complex, Methylation, Cellular Energy Restoration", {
    x: 1, y: 2.6, w: 8, h: 0.6,
    fontSize: 14, fontFace: BODY_FONT, color: "B39DDB", align: "center",
  });

  const slide = addSanitizedSlide(pres);
  slide.background = { color: LIGHT_GRAY };
  slide.addText("Sirtuin & Mitochondrial Stack", {
    x: 0.5, y: 0.2, w: 9, h: 0.5,
    fontSize: 22, fontFace: HEADER_FONT, color: PRIMARY, bold: true,
  });

  const ss = protocol.sirtuinStack!;

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 0.8, w: 4.5, h: 1.8,
    fill: { color: WHITE }, shadow: makeShadow(),
  });
  slide.addText([
    { text: "MitoSTAC Complex (Sirtuin Activation)", options: { bold: true, color: PURPLE_ACCENT, fontSize: 11, breakLine: true } },
    { text: `Resveratrol: ${ss.mitoSTAC.resveratrol}`, options: { fontSize: 10, color: TEXT_DARK, breakLine: true } },
    { text: `Pterostilbene: ${ss.mitoSTAC.pterostilbene}`, options: { fontSize: 10, color: TEXT_DARK, breakLine: true } },
    { text: `Quercetin: ${ss.mitoSTAC.quercetin}`, options: { fontSize: 10, color: TEXT_DARK, breakLine: true } },
    { text: `Fisetin: ${ss.mitoSTAC.fisetin}`, options: { fontSize: 10, color: TEXT_DARK } },
  ], { x: 0.5, y: 0.9, w: 4.1, h: 1.6, fontFace: BODY_FONT, valign: "top" });

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 5.2, y: 0.8, w: 4.5, h: 1.8,
    fill: { color: WHITE }, shadow: makeShadow(),
  });
  slide.addText([
    { text: "NAD+ & GlyNAC", options: { bold: true, color: PURPLE_ACCENT, fontSize: 11, breakLine: true } },
    { text: `${ss.nadPrecursors.compound}: ${ss.nadPrecursors.dose} — ${ss.nadPrecursors.frequency}`, options: { fontSize: 10, color: TEXT_DARK, breakLine: true } },
    { text: "", options: { fontSize: 4, breakLine: true } },
    { text: "GlyNAC Protocol:", options: { bold: true, fontSize: 10, color: TEXT_DARK, breakLine: true } },
    { text: `Glycine: ${ss.glyNAC.glycine}`, options: { fontSize: 10, color: TEXT_DARK, breakLine: true } },
    { text: `NAC: ${ss.glyNAC.nac}`, options: { fontSize: 10, color: TEXT_DARK, breakLine: true } },
    { text: `Frequency: ${ss.glyNAC.frequency}`, options: { fontSize: 9, color: TEXT_MED } },
  ], { x: 5.4, y: 0.9, w: 4.1, h: 1.6, fontFace: BODY_FONT, valign: "top" });

  if (ss.mitochondrialSupport?.length > 0) {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.3, y: 2.8, w: 9.4, h: 1.4,
      fill: { color: WHITE }, shadow: makeShadow(),
    });
    const mitoItems: Array<{text: string; options: Record<string, unknown>}> = [
      { text: "Mitochondrial Support Stack", options: { bold: true, color: PURPLE_ACCENT, fontSize: 11, breakLine: true } },
    ];
    ss.mitochondrialSupport.forEach(m => {
      mitoItems.push({ text: `${m.name}: ${m.dose} — ${m.purpose}`, options: { fontSize: 9, color: TEXT_DARK, breakLine: true } });
    });
    slide.addText(mitoItems, { x: 0.5, y: 2.85, w: 9.0, h: 1.3, fontFace: BODY_FONT, valign: "top" });
  }

  if (ss.methylationSupport?.length > 0) {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.3, y: 4.4, w: 9.4, h: 0.9,
      fill: { color: WHITE }, shadow: makeShadow(),
    });
    const methItems: Array<{text: string; options: Record<string, unknown>}> = [
      { text: "Methylation Support: ", options: { bold: true, color: PURPLE_ACCENT, fontSize: 11 } },
    ];
    const methStr = ss.methylationSupport.map(m => `${m.name} ${m.dose}`).join(" | ");
    methItems.push({ text: methStr, options: { fontSize: 10, color: TEXT_DARK } });
    slide.addText(methItems, { x: 0.5, y: 4.45, w: 9.0, h: 0.8, fontFace: BODY_FONT, valign: "top" });
  }
}

function slideLiposomals(pres: PptxPresentation, protocol: HealingProtocol) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: LIGHT_GRAY };
  slide.addText("Liposomal Supplements", {
    x: 0.5, y: 0.2, w: 9, h: 0.5,
    fontSize: 22, fontFace: HEADER_FONT, color: PRIMARY, bold: true,
  });

  const items = (protocol.liposomals || []).map(l => ([
    { text: `${l.name}`, options: { bold: true, color: PRIMARY, fontSize: 11, breakLine: false } },
    { text: ` — ${l.dose} (${l.timing})`, options: { color: TEXT_DARK, fontSize: 10, breakLine: true } },
    { text: `   Purpose: ${l.purpose}`, options: { color: TEXT_MED, fontSize: 9, breakLine: true } },
  ])).flat();

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 0.8, w: 9, h: 4.5,
    fill: { color: WHITE }, shadow: makeShadow(),
  });
  slide.addText(items, { x: 0.7, y: 0.9, w: 8.6, h: 4.3, fontFace: BODY_FONT, valign: "top" });
}

function slideNebulization(pres: PptxPresentation, protocol: HealingProtocol) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: LIGHT_GRAY };
  slide.addText("Nebulization Protocols", {
    x: 0.5, y: 0.2, w: 9, h: 0.5,
    fontSize: 22, fontFace: HEADER_FONT, color: PRIMARY, bold: true,
  });

  const items = (protocol.nebulization || []).map(n => ([
    { text: n.name, options: { bold: true, color: PRIMARY, fontSize: 11, breakLine: true } },
    { text: `Solution: ${n.solution} | Dose: ${n.dose}`, options: { color: TEXT_DARK, fontSize: 10, breakLine: true } },
    { text: `Frequency: ${n.frequency} | Duration: ${n.duration}`, options: { color: TEXT_DARK, fontSize: 10, breakLine: true } },
    { text: `Purpose: ${n.purpose}`, options: { color: TEXT_MED, fontSize: 9, breakLine: true } },
    { text: "", options: { fontSize: 4, breakLine: true } },
  ])).flat();

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 0.8, w: 9, h: 4.5,
    fill: { color: WHITE }, shadow: makeShadow(),
  });
  slide.addText(items, { x: 0.7, y: 0.9, w: 8.6, h: 4.3, fontFace: BODY_FONT, valign: "top" });
}

function slideTopicals(pres: PptxPresentation, protocol: HealingProtocol) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: LIGHT_GRAY };
  slide.addText("Topical Protocols", {
    x: 0.5, y: 0.2, w: 9, h: 0.5,
    fontSize: 22, fontFace: HEADER_FONT, color: PRIMARY, bold: true,
  });

  const items = (protocol.topicals || []).map(t => ([
    { text: `${t.name} (${t.form})`, options: { bold: true, color: PRIMARY, fontSize: 11, breakLine: true } },
    { text: `Application: ${t.application} | Frequency: ${t.frequency}`, options: { color: TEXT_DARK, fontSize: 10, breakLine: true } },
    { text: `Purpose: ${t.purpose}`, options: { color: TEXT_MED, fontSize: 9, breakLine: true } },
    { text: "", options: { fontSize: 4, breakLine: true } },
  ])).flat();

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 0.8, w: 9, h: 4.5,
    fill: { color: WHITE }, shadow: makeShadow(),
  });
  slide.addText(items, { x: 0.7, y: 0.9, w: 8.6, h: 4.3, fontFace: BODY_FONT, valign: "top" });
}

function slideExosomes(pres: PptxPresentation, protocol: HealingProtocol) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: LIGHT_GRAY };
  slide.addText("Exosome Therapy", {
    x: 0.5, y: 0.2, w: 9, h: 0.5,
    fontSize: 22, fontFace: HEADER_FONT, color: PRIMARY, bold: true,
  });

  const items = (protocol.exosomes || []).map(e => ([
    { text: e.name, options: { bold: true, color: PRIMARY, fontSize: 11, breakLine: true } },
    { text: `Source: ${e.source} | ${e.concentration} | Route: ${e.route}`, options: { color: TEXT_DARK, fontSize: 10, breakLine: true } },
    { text: `Frequency: ${e.frequency}`, options: { color: TEXT_DARK, fontSize: 10, breakLine: true } },
    { text: `Purpose: ${e.purpose}`, options: { color: TEXT_MED, fontSize: 9, breakLine: true } },
    { text: "", options: { fontSize: 4, breakLine: true } },
  ])).flat();

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 0.8, w: 9, h: 4.5,
    fill: { color: WHITE }, shadow: makeShadow(),
  });
  slide.addText(items, { x: 0.7, y: 0.9, w: 8.6, h: 4.3, fontFace: BODY_FONT, valign: "top" });
}

function slideDietaryProtocol(pres: PptxPresentation, protocol: HealingProtocol) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: LIGHT_GRAY };
  slide.addText("Dietary Protocol", {
    x: 0.5, y: 0.2, w: 9, h: 0.5,
    fontSize: 22, fontFace: HEADER_FONT, color: PRIMARY, bold: true,
  });

  const dp = protocol.dietaryProtocol!;
  const phaseColors = [RED_ACCENT, ORANGE_ACCENT, GREEN_ACCENT];
  let yPos = 0.8;

  dp.phases?.forEach((phase, idx) => {
    const cardH = 1.3;
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: yPos, w: 9, h: cardH,
      fill: { color: WHITE }, shadow: makeShadow(),
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: yPos, w: 0.06, h: cardH,
      fill: { color: phaseColors[idx] || PRIMARY },
    });

    const phaseItems: Array<{text: string; options: Record<string, unknown>}> = [
      { text: `${phase.name} (${phase.duration})`, options: { bold: true, color: PRIMARY, fontSize: 11, breakLine: true } },
      { text: phase.focus, options: { color: TEXT_MED, fontSize: 9, breakLine: true } },
    ];
    if (phase.eliminate?.length > 0) {
      phaseItems.push({ text: `Eliminate: ${phase.eliminate.join(", ")}`, options: { color: RED_ACCENT, fontSize: 9, breakLine: true } });
    }
    if (phase.emphasize?.length > 0) {
      phaseItems.push({ text: `Emphasize: ${phase.emphasize.join(", ")}`, options: { color: GREEN_ACCENT, fontSize: 9, breakLine: true } });
    }

    slide.addText(phaseItems, { x: 0.7, y: yPos + 0.05, w: 8.6, h: cardH - 0.1, fontFace: BODY_FONT, valign: "top" });
    yPos += cardH + 0.1;
  });

  if (dp.intermittentFasting) {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: yPos, w: 9, h: 0.6,
      fill: { color: WHITE }, shadow: makeShadow(),
    });
    slide.addText([
      { text: `Intermittent Fasting: ${dp.intermittentFasting.protocol} `, options: { bold: true, color: PRIMARY, fontSize: 10 } },
      { text: `— ${dp.intermittentFasting.schedule} (${dp.intermittentFasting.purpose})`, options: { color: TEXT_DARK, fontSize: 9 } },
    ], { x: 0.7, y: yPos + 0.05, w: 8.6, h: 0.5, fontFace: BODY_FONT, valign: "middle" });
  }
}

export interface PptxParityResult {
  valid: boolean;
  totalSlides: number;
  expectedMinSlides: number;
  missingSections: string[];
  presentSections: string[];
  referenceFileId: string;
}

export function validatePptxParity(
  protocol: HealingProtocol,
  profile: PatientProfile
): PptxParityResult {
  const presentSections: string[] = [];
  const missingSections: string[] = [];

  const checks: Array<{ section: typeof REFERENCE_SLIDE_ORDER[number]; present: boolean }> = [
    { section: "cover", present: true },
    { section: "summary", present: true },
    { section: "member-info", present: true },
    { section: "timeline", present: (profile.medicalTimeline?.length || 0) > 0 },
    { section: "trustee-analysis", present: true },
    { section: "root-causes", present: true },
    { section: "5rs-phases", present: true },
    { section: "daily-schedule", present: true },
    { section: "products-ff", present: true },
    { section: "injectable-peptides", present: (protocol.injectablePeptides?.length || 0) > 0 },
    { section: "oral-peptides", present: (protocol.oralPeptides?.length || 0) > 0 },
    { section: "bioregulators", present: (protocol.bioregulators?.length || 0) > 0 },
    { section: "supplements", present: (protocol.supplements?.length || 0) > 0 },
    { section: "supplement-timing", present: (protocol.supplements?.length || 0) > 0 || (protocol.liposomals?.length || 0) > 0 },
    { section: "iv-im-therapies", present: (protocol.ivTherapies?.length || 0) > 0 || (protocol.imTherapies?.length || 0) > 0 },
    { section: "detox-protocols", present: (protocol.detoxProtocols?.length || 0) > 0 },
    { section: "parasite-antiviral", present: true },
    { section: "ecs-protocol", present: !!protocol.ecsProtocol || (protocol.suppositories?.length || 0) > 0 },
    { section: "suppositories", present: (protocol.suppositories?.length || 0) > 0 },
    { section: "sirtuin-mito", present: !!protocol.sirtuinStack },
    { section: "liposomals", present: (protocol.liposomals?.length || 0) > 0 },
    { section: "nebulization", present: (protocol.nebulization?.length || 0) > 0 },
    { section: "topicals", present: (protocol.topicals?.length || 0) > 0 },
    { section: "exosomes", present: (protocol.exosomes?.length || 0) > 0 },
    { section: "dietary-protocol", present: !!protocol.dietaryProtocol?.phases?.length },
    { section: "lifestyle", present: (protocol.lifestyleRecommendations?.length || 0) > 0 },
    { section: "follow-up", present: true },
    { section: "books", present: true },
    { section: "research-links", present: true },
    { section: "drive-links", present: true },
    { section: "commitment", present: true },
  ];

  for (const check of checks) {
    if (check.present) {
      presentSections.push(check.section);
    } else {
      missingSections.push(check.section);
    }
  }

  const expectedMinSlides = 20;

  return {
    valid: presentSections.length >= expectedMinSlides && missingSections.length <= 5,
    totalSlides: presentSections.length,
    expectedMinSlides,
    missingSections,
    presentSections,
    referenceFileId: REFERENCE_PPTX_DRIVE_FILE_ID,
  };
}
