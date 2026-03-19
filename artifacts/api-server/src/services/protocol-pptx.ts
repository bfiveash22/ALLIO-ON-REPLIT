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

const PRIMARY = "1A2440";
const SECONDARY = "C9A54E";
const ACCENT = "C9A54E";
const TEAL = "C8CFE0";
const DARK_BG = "0A0E1A";
const CARD_BG = "243055";
const WHITE = "FFFFFF";
const LIGHT_GRAY = "E8EDF5";
const TEXT_DARK = "1A2440";
const TEXT_MED = "5A6B8A";
const RED_ACCENT = "C62828";
const GREEN_ACCENT = "2E7D32";
const ORANGE_ACCENT = "C9A54E";
const PURPLE_ACCENT = "4A3080";

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
  const slide = pres.addSlide();
  const originalAddText = slide.addText.bind(slide);
  slide.addText = ((text: string | PptxGenJS.TextProps[], opts?: Record<string, unknown>) => {
    return originalAddText(sanitizeTextInput(text) as string, opts);
  }) as typeof slide.addText;
  return slide;
}

const FF_WEBSITE = "https://www.forgottenformula.com";
const FF_SHOP = `${FF_WEBSITE}/shop`;

const HEADER_FONT = "Playfair Display";
const BODY_FONT = "Source Sans 3";

const REFERENCE_PPTX_DRIVE_FILE_ID = "1Tc_hVN7M6c2Q41151GXsvrH8OWAZ7hPL";
const TRUSTEE_TEMPLATE_FILE = "Trustee_FFPMA_Protocol_Final_Template_1773763070654.pptx";
const REFERENCE_PPTX_PROVENANCE = `Structural template derived from Trustee FINAL reference PPTX (Drive: ${REFERENCE_PPTX_DRIVE_FILE_ID}). Color theme: Navy (#1A2440/#0A0E1A) + Gold (#C9A54E) + Lavender (#E8EDF5/#C8CFE0). Fonts: Playfair Display (headers) + Source Sans 3 (body). Based on ${TRUSTEE_TEMPLATE_FILE}. 34-slide structure.`;

const REFERENCE_SLIDE_ORDER = [
  "cover",
  "about-pma",
  "protocol-overview",
  "philosophy",
  "5rs-phases",
  "diagnostic-framework",
  "program-structure",
  "intake-personal",
  "intake-health-history",
  "intake-symptoms-goals",
  "peptide-therapy-intro",
  "peptides-immune",
  "peptides-cellular-cancer",
  "peptides-metabolic-hormonal",
  "peptides-longevity",
  "hbot-therapy",
  "hbot-systems",
  "detox-iv-sequence",
  "home-protocols",
  "dental-biological",
  "dietary-protocol",
  "advanced-modalities",
  "mitostac-phase4",
  "mito-pathway-map",
  "cannabinoid-ligand-map",
  "protocol-builder",
  "daily-schedule",
  "program-timeline",
  "monitoring-followup",
  "ai-research-tool",
  "research-links",
  "library-resources",
  "protocol-summary",
  "closing",
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
  slideAboutPMA(pres);
  slideProtocolOverview(pres, protocol);
  slidePhilosophy(pres);

  if (protocol.phases?.length) {
    slide5Rs(pres, protocol);
  }

  slideDiagnosticFramework(pres, protocol);
  slideProgramStructure(pres, protocol);

  slideIntakePersonal(pres, protocol, profile);
  slideIntakeHealthHistory(pres, protocol, profile);
  slideIntakeSymptomsGoals(pres, protocol, profile);

  slidePeptideTherapyIntro(pres, protocol);

  const allPeptides = [
    ...(protocol.injectablePeptides || []),
    ...(protocol.oralPeptides || []),
    ...(protocol.bioregulators || []),
  ];
  const immunePeptides = allPeptides.filter((p: any) => /immun|ll-?37|thymo|kpv|antimicro/i.test(`${p.name} ${p.category || ''} ${p.mechanism || ''}`));
  const cancerPeptides = allPeptides.filter((p: any) => /cancer|tumor|pnc|foxo|p53|senol/i.test(`${p.name} ${p.category || ''} ${p.mechanism || ''}`));
  const metabolicPeptides = allPeptides.filter((p: any) => /metabol|hormon|retatrutide|semaglutide|glp|weight|insulin/i.test(`${p.name} ${p.category || ''} ${p.mechanism || ''}`));
  const longevityPeptides = allPeptides.filter((p: any) => /longev|aging|epithalon|pinealon|telomer|bioregul/i.test(`${p.name} ${p.category || ''} ${p.mechanism || ''}`));

  if (immunePeptides.length > 0) slidePeptideCategory(pres, "IMMUNE SUPPORT", "Immune Surveillance & Defense", immunePeptides);
  if (cancerPeptides.length > 0) slidePeptideCategory(pres, "CELLULAR & CANCER", "Cellular Repair & Tumor Suppression", cancerPeptides);
  if (metabolicPeptides.length > 0) slidePeptideCategory(pres, "METABOLIC & HORMONAL", "Metabolic Reset & Hormonal Balance", metabolicPeptides);
  if (longevityPeptides.length > 0) slidePeptideCategory(pres, "LONGEVITY", "Anti-Aging & Cellular Longevity", longevityPeptides);

  const uncategorized = allPeptides.filter((p: any) =>
    !immunePeptides.includes(p) && !cancerPeptides.includes(p) &&
    !metabolicPeptides.includes(p) && !longevityPeptides.includes(p)
  );
  if (uncategorized.length > 0) slidePeptideCategory(pres, "ADDITIONAL PEPTIDES", "Additional Peptide Protocols", uncategorized);

  slideHBOTTherapy(pres, protocol);
  slideHBOTSystems(pres);

  if (protocol.detoxProtocols?.length || protocol.ivTherapies?.length) {
    slideDetoxIVSequence(pres, protocol);
  }

  slideHomeProtocols(pres, protocol);
  slideDentalBiological(pres);

  if (protocol.dietaryProtocol?.phases?.length) {
    slideDietaryProtocol(pres, protocol);
  }

  slideAdvancedModalities(pres, protocol);

  if (protocol.sirtuinStack?.mitoSTAC) {
    slideSirtuinMito(pres, protocol);
  }
  slideMitoPathwayMap(pres);

  if (protocol.ecsProtocol?.overview) {
    slideCannabinoidLigandMap(pres, protocol);
  }

  slideProtocolBuilder(pres, protocol);
  slideDailySchedule(pres, protocol);
  slideProgramTimeline(pres, protocol);

  if (protocol.followUpPlan?.length || protocol.labsRequired?.length) {
    slideMonitoringFollowup(pres, protocol);
  }

  slideAIResearchTool(pres);
  slideResearchLinks(pres, resources);
  slideLibraryResources(pres, resources);

  slideProtocolSummary(pres, protocol, profile);
  slideClosing(pres);

  const slideCount = (pres as unknown as { slides: unknown[] }).slides?.length || 0;
  console.log(`[PPTX] Generated ${slideCount} slides for ${protocol.patientName} — modalities: ECS=${!!protocol.ecsProtocol}, sirtuin=${!!protocol.sirtuinStack}, liposomals=${protocol.liposomals?.length || 0}, nebulization=${protocol.nebulization?.length || 0}, topicals=${protocol.topicals?.length || 0}, exosomes=${protocol.exosomes?.length || 0}`);
  const data = await pres.write({ outputType: "nodebuffer" });
  return Buffer.from(data as ArrayBuffer);
}

function slideCover(pres: PptxPresentation, protocol: HealingProtocol, date: string, isCancer: boolean) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: DARK_BG };

  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: ACCENT } });
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.565, w: 10, h: 0.06, fill: { color: ACCENT } });

  slide.addText("FORGOTTEN FORMULA", {
    x: 0, y: 1, w: 10, h: 0.8,
    fontSize: 36, fontFace: HEADER_FONT, color: WHITE, align: "center", bold: true,
  });
  slide.addText("PRIVATE MEMBER ASSOCIATION", {
    x: 0, y: 1.7, w: 10, h: 0.5,
    fontSize: 14, fontFace: BODY_FONT, color: ACCENT, align: "center",
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
    fontSize: 20, fontFace: BODY_FONT, color: TEAL, align: "center",
  });
  slide.addText(`Prepared by: FF Trustee Michael Blake`, {
    x: 0, y: 3.9, w: 10, h: 0.4,
    fontSize: 11, fontFace: BODY_FONT, color: "8A95B0", align: "center",
  });

  if (isCancer) {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 3.2, y: 4.3, w: 3.6, h: 0.35,
      fill: { color: "1A0A0A" },
    });
    slide.addText("CANCER-SPECIFIC PROTOCOL", {
      x: 3.2, y: 4.3, w: 3.6, h: 0.35,
      fontSize: 10, fontFace: BODY_FONT, color: "FF4444", align: "center", valign: "middle",
    });
  }

  slide.addText([
    { text: '"Before you heal someone, ask him if he\'s willing to give up the things that make him sick"', options: { italic: true, color: "8A95B0", fontSize: 9, breakLine: true } },
    { text: "— Hippocrates", options: { color: ACCENT, fontSize: 9 } },
  ], { x: 1.5, y: 4.8, w: 7, h: 0.6, align: "center", fontFace: BODY_FONT });
}

function slideAboutPMA(pres: PptxPresentation) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: DARK_BG };

  slide.addText("ABOUT OUR ASSOCIATION", {
    x: 0.5, y: 0.2, w: 9, h: 0.4,
    fontSize: 12, fontFace: BODY_FONT, color: ACCENT, bold: true,
  });
  slide.addText("What Is Forgotten Formula PMA?", {
    x: 0.5, y: 0.55, w: 9, h: 0.5,
    fontSize: 24, fontFace: HEADER_FONT, color: WHITE, bold: true,
  });

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.2, w: 9, h: 1.4,
    fill: { color: CARD_BG },
  });
  slide.addText("Forgotten Formula PMA is a Private Members Association operating at the constitutional level — providing medical freedom through natural therapies, peptide protocols, and regenerative modalities.\n\nThe Supreme Court has upheld the constitutional right to private association, allowing members to access modalities and therapeutic formulations outside of conventional regulation.", {
    x: 0.7, y: 1.3, w: 8.6, h: 1.2,
    fontSize: 10, fontFace: BODY_FONT, color: TEAL, valign: "top",
  });

  const pillars = [
    { title: "Constitutional Protection", desc: "Operating above state-level regulation under the right to private association" },
    { title: "In-House Manufacturing", desc: "Custom peptide compounding and bioregulator formulation" },
    { title: "AI-Powered Research", desc: "DR. FORMULA protocol assembly backed by published PubMed research" },
  ];

  pillars.forEach((p, i) => {
    const x = 0.5 + i * 3.1;
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: 2.85, w: 2.9, h: 1.4,
      fill: { color: CARD_BG },
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: 2.85, w: 2.9, h: 0.04,
      fill: { color: ACCENT },
    });
    slide.addText(p.title, {
      x: x + 0.15, y: 3.0, w: 2.6, h: 0.3,
      fontSize: 11, fontFace: HEADER_FONT, color: ACCENT, bold: true,
    });
    slide.addText(p.desc, {
      x: x + 0.15, y: 3.35, w: 2.6, h: 0.8,
      fontSize: 9, fontFace: BODY_FONT, color: TEAL,
    });
  });

  slide.addText('"We hold these truths to be self-evident…" — Declaration of Independence', {
    x: 1, y: 4.6, w: 8, h: 0.4,
    fontSize: 9, fontFace: BODY_FONT, color: "8A95B0", align: "center", italic: true,
  });
}

function slideProtocolOverview(pres: PptxPresentation, protocol: HealingProtocol) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: DARK_BG };

  slide.addText("PROTOCOL OVERVIEW", {
    x: 0.5, y: 0.2, w: 9, h: 0.4,
    fontSize: 12, fontFace: BODY_FONT, color: ACCENT, bold: true,
  });
  slide.addText("What We'll Cover", {
    x: 0.5, y: 0.55, w: 9, h: 0.5,
    fontSize: 24, fontFace: HEADER_FONT, color: WHITE, bold: true,
  });

  const sections = [
    { num: "01", title: "PMA Foundation", desc: "Constitutional framework & philosophy" },
    { num: "02", title: "Root-Cause Analysis", desc: "Diagnostic methodology" },
    { num: "03", title: "Peptide Therapy", desc: "Injectable, oral & bioregulator protocols" },
    { num: "04", title: "HBOT & IV Systems", desc: "Hyperbaric & infusion therapy" },
    { num: "05", title: "Detoxification", desc: "Heavy metal, pathogen & gut protocols" },
    { num: "06", title: "ECS Optimization", desc: "Endocannabinoid system support" },
    { num: "07", title: "Diet & Nutrition", desc: "Phased dietary protocol" },
    { num: "08", title: "Monitoring", desc: "Follow-up labs & milestones" },
  ];

  sections.forEach((s, i) => {
    const row = Math.floor(i / 2);
    const col = i % 2;
    const x = 0.5 + col * 4.7;
    const y = 1.2 + row * 0.95;

    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 4.4, h: 0.8,
      fill: { color: CARD_BG },
    });
    slide.addText(s.num, {
      x: x + 0.1, y, w: 0.5, h: 0.8,
      fontSize: 18, fontFace: HEADER_FONT, color: ACCENT, bold: true, valign: "middle",
    });
    slide.addText(s.title, {
      x: x + 0.65, y, w: 3.5, h: 0.4,
      fontSize: 12, fontFace: HEADER_FONT, color: WHITE, bold: true, valign: "bottom",
    });
    slide.addText(s.desc, {
      x: x + 0.65, y: y + 0.4, w: 3.5, h: 0.35,
      fontSize: 9, fontFace: BODY_FONT, color: TEAL, valign: "top",
    });
  });
}

function slidePhilosophy(pres: PptxPresentation) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: DARK_BG };

  slide.addText("PHILOSOPHY", {
    x: 0.5, y: 0.2, w: 9, h: 0.4,
    fontSize: 12, fontFace: BODY_FONT, color: ACCENT, bold: true,
  });
  slide.addText("The Root-Cause Approach", {
    x: 0.5, y: 0.55, w: 9, h: 0.5,
    fontSize: 24, fontFace: HEADER_FONT, color: WHITE, bold: true,
  });

  slide.addText('"Illness is the summation of experience" — every symptom traces back to a disrupted foundation', {
    x: 0.7, y: 1.15, w: 8.6, h: 0.4,
    fontSize: 11, fontFace: BODY_FONT, color: TEAL, italic: true,
  });

  const causes = [
    { title: "CarbonCycle", desc: "Environmental toxin accumulation disrupts cellular energy", color: ACCENT },
    { title: "MicrobiotaShift", desc: "Gut flora dysbiosis triggers systemic immune dysfunction", color: ACCENT },
    { title: "MitochondrialDrift", desc: "ATP production failure leads to chronic fatigue and degeneration", color: ACCENT },
    { title: "AutoimmuneLoop", desc: "Chronic inflammation creates self-perpetuating tissue damage", color: ACCENT },
  ];

  causes.forEach((c, i) => {
    const y = 1.7 + i * 0.85;
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y, w: 9, h: 0.7,
      fill: { color: CARD_BG },
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y, w: 0.06, h: 0.7,
      fill: { color: c.color },
    });
    slide.addText(c.title, {
      x: 0.7, y, w: 2.8, h: 0.7,
      fontSize: 12, fontFace: HEADER_FONT, color: ACCENT, bold: true, valign: "middle",
    });
    slide.addText(c.desc, {
      x: 3.6, y, w: 5.7, h: 0.7,
      fontSize: 10, fontFace: BODY_FONT, color: TEAL, valign: "middle",
    });
  });

  slide.addText('"The body was designed to heal itself — given the proper conditions" — Hippocrates', {
    x: 1, y: 5.0, w: 8, h: 0.4,
    fontSize: 9, fontFace: BODY_FONT, color: "8A95B0", align: "center", italic: true,
  });
}

function slideDiagnosticFramework(pres: PptxPresentation, protocol: HealingProtocol) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: DARK_BG };

  slide.addText("DIAGNOSTIC FRAMEWORK", {
    x: 0.5, y: 0.2, w: 9, h: 0.4,
    fontSize: 12, fontFace: BODY_FONT, color: ACCENT, bold: true,
  });
  slide.addText("Three Systems of Focus", {
    x: 0.5, y: 0.55, w: 9, h: 0.5,
    fontSize: 24, fontFace: HEADER_FONT, color: WHITE, bold: true,
  });

  const systems = [
    {
      title: "P53",
      subtitle: "Tumor Suppressor Pathways",
      desc: "The P53 gene is the body's master cancer defense. When disrupted by toxins, oxidative stress, or chronic inflammation, malignant cells escape surveillance.",
      peptides: "Key Peptides: PNC-27, FOXO4-DRI, MENK",
    },
    {
      title: "ATP",
      subtitle: "Mitochondrial Function",
      desc: "Mitochondria produce cellular energy. Dysfunction leads to fatigue, neurodegeneration, and metabolic collapse. Supporting ATP production is foundational.",
      peptides: "Key Peptides: SS-31, MOTS-c, Epithalon",
    },
    {
      title: "ECS",
      subtitle: "Endocannabinoid System",
      desc: "The ECS regulates pain, mood, immunity, and homeostasis. Deficiency drives chronic illness. Targeted cannabinoid ratios restore balance.",
      peptides: "Key Compounds: CBD, CBG, CBN, THC, DMSO",
    },
  ];

  systems.forEach((sys, i) => {
    const x = 0.5 + i * 3.1;
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.2, w: 2.9, h: 3.6,
      fill: { color: CARD_BG },
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.2, w: 2.9, h: 0.04,
      fill: { color: ACCENT },
    });
    slide.addText(sys.title, {
      x: x + 0.15, y: 1.35, w: 2.6, h: 0.5,
      fontSize: 22, fontFace: HEADER_FONT, color: ACCENT, bold: true,
    });
    slide.addText(sys.subtitle, {
      x: x + 0.15, y: 1.85, w: 2.6, h: 0.3,
      fontSize: 10, fontFace: BODY_FONT, color: WHITE, bold: true,
    });
    slide.addText(sys.desc, {
      x: x + 0.15, y: 2.25, w: 2.6, h: 1.5,
      fontSize: 9, fontFace: BODY_FONT, color: TEAL,
    });
    slide.addText(sys.peptides, {
      x: x + 0.15, y: 3.9, w: 2.6, h: 0.4,
      fontSize: 8, fontFace: BODY_FONT, color: ACCENT, italic: true,
    });
  });
}

function slideProgramStructure(pres: PptxPresentation, protocol: HealingProtocol) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: DARK_BG };

  slide.addText("PROGRAM STRUCTURE", {
    x: 0.5, y: 0.2, w: 9, h: 0.4,
    fontSize: 12, fontFace: BODY_FONT, color: ACCENT, bold: true,
  });
  slide.addText("The 90-Day Protocol + Phase 4", {
    x: 0.5, y: 0.55, w: 9, h: 0.5,
    fontSize: 24, fontFace: HEADER_FONT, color: WHITE, bold: true,
  });

  const phaseColors = [RED_ACCENT, SECONDARY, TEAL, GREEN_ACCENT];
  const phases = [
    {
      name: "Phase 1 — Foundation",
      range: "Days 1–30",
      items: ["Detox IV protocol (5-step)", "Begin oral peptides & bioregulators", "ECS suppository introduction", "Dietary elimination phase", "Baseline labs & imaging"],
    },
    {
      name: "Phase 2 — Build",
      range: "Days 31–60",
      items: ["Add injectable peptides", "HBOT sessions begin", "Increase cannabinoid ratios", "Gut flora optimization", "Nutrient repletion protocols"],
    },
    {
      name: "Phase 3 — Optimize",
      range: "Days 61–90",
      items: ["Full-spectrum modality stack", "Advanced sirtuin/mito support", "Exosome therapy if indicated", "Re-assess labs & markers", "Transition planning"],
    },
    {
      name: "Phase 4 — Maintain",
      range: "Ongoing",
      items: ["Maintenance peptide cycles", "Quarterly lab monitoring", "Lifestyle integration", "Community support access", "Ongoing ECS optimization"],
    },
  ];

  phases.forEach((phase, i) => {
    const x = 0.3 + i * 2.45;
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.2, w: 2.3, h: 4.0,
      fill: { color: CARD_BG },
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.2, w: 2.3, h: 0.04,
      fill: { color: phaseColors[i] },
    });
    slide.addText(phase.name, {
      x: x + 0.1, y: 1.35, w: 2.1, h: 0.35,
      fontSize: 10, fontFace: HEADER_FONT, color: phaseColors[i], bold: true,
    });
    slide.addText(phase.range, {
      x: x + 0.1, y: 1.7, w: 2.1, h: 0.2,
      fontSize: 8, fontFace: BODY_FONT, color: TEXT_MED,
    });
    const items = phase.items.map((item, j) => ({
      text: `▸ ${item}`,
      options: { fontSize: 8, color: TEAL, breakLine: j < phase.items.length - 1 },
    }));
    slide.addText(items, {
      x: x + 0.1, y: 2.0, w: 2.1, h: 3.0,
      fontFace: BODY_FONT, valign: "top",
    });
  });
}

function slidePeptideTherapyIntro(pres: PptxPresentation, protocol: HealingProtocol) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: DARK_BG };

  slide.addText("PEPTIDE THERAPY", {
    x: 0, y: 1.5, w: 10, h: 0.8,
    fontSize: 36, fontFace: HEADER_FONT, color: WHITE, align: "center", bold: true,
  });

  const inj = protocol.injectablePeptides?.length || 0;
  const oral = protocol.oralPeptides?.length || 0;
  const bio = protocol.bioregulators?.length || 0;
  const total = inj + oral + bio;

  slide.addText(`${total} Custom Peptides — Injectable, Oral & Bioregulator Protocols`, {
    x: 1, y: 2.3, w: 8, h: 0.6,
    fontSize: 14, fontFace: BODY_FONT, color: ACCENT, align: "center",
  });

  slide.addShape(pres.shapes.LINE, {
    x: 3.5, y: 3.1, w: 3, h: 0,
    line: { color: ACCENT, width: 1.5 },
  });

  const stats = [
    { label: "Injectable", count: inj },
    { label: "Oral", count: oral },
    { label: "Bioregulators", count: bio },
  ];

  stats.forEach((s, i) => {
    const x = 1.5 + i * 2.8;
    slide.addText(String(s.count), {
      x, y: 3.4, w: 2.2, h: 0.6,
      fontSize: 28, fontFace: HEADER_FONT, color: ACCENT, align: "center", bold: true,
    });
    slide.addText(s.label, {
      x, y: 3.95, w: 2.2, h: 0.3,
      fontSize: 11, fontFace: BODY_FONT, color: TEAL, align: "center",
    });
  });
}

function slideHBOTTherapy(pres: PptxPresentation, _protocol: HealingProtocol) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: DARK_BG };

  slide.addText("HBOT THERAPY", {
    x: 0.5, y: 0.2, w: 9, h: 0.4,
    fontSize: 12, fontFace: BODY_FONT, color: ACCENT, bold: true,
  });
  slide.addText("Hyperbaric Oxygen Therapy", {
    x: 0.5, y: 0.55, w: 9, h: 0.5,
    fontSize: 24, fontFace: HEADER_FONT, color: WHITE, bold: true,
  });

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.2, w: 9, h: 1.2,
    fill: { color: CARD_BG },
  });
  slide.addText("HBOT delivers 100% oxygen under increased atmospheric pressure, driving oxygen deep into tissues, plasma, and cerebrospinal fluid. This accelerates wound healing, reduces inflammation, stimulates stem cell mobilization, and enhances mitochondrial function.\n\nFFPMA operates its own HBOT Systems Division with medical-grade chambers available to members.", {
    x: 0.7, y: 1.3, w: 8.6, h: 1.0,
    fontSize: 10, fontFace: BODY_FONT, color: TEAL,
  });

  const benefits = [
    { title: "Neovascularization", desc: "Stimulates new blood vessel growth in damaged tissues" },
    { title: "Stem Cell Release", desc: "Up to 8x increase in circulating stem cells" },
    { title: "Anti-Inflammatory", desc: "Reduces cytokine storms and systemic inflammation" },
    { title: "Neuroprotection", desc: "Enhances brain oxygenation and cognitive recovery" },
  ];

  benefits.forEach((b, i) => {
    const x = 0.5 + i * 2.35;
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: 2.7, w: 2.15, h: 1.2,
      fill: { color: CARD_BG },
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: 2.7, w: 2.15, h: 0.04,
      fill: { color: ACCENT },
    });
    slide.addText(b.title, {
      x: x + 0.1, y: 2.85, w: 1.95, h: 0.3,
      fontSize: 10, fontFace: HEADER_FONT, color: ACCENT, bold: true,
    });
    slide.addText(b.desc, {
      x: x + 0.1, y: 3.15, w: 1.95, h: 0.6,
      fontSize: 8, fontFace: BODY_FONT, color: TEAL,
    });
  });

  slide.addText("FFPMA HBOT Systems Division — Contact us for availability and member pricing", {
    x: 0.5, y: 4.2, w: 9, h: 0.3,
    fontSize: 9, fontFace: BODY_FONT, color: TEXT_MED, align: "center",
  });
}

function slideHomeProtocols(pres: PptxPresentation, protocol: HealingProtocol) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: DARK_BG };

  slide.addText("HOME PROTOCOLS", {
    x: 0.5, y: 0.2, w: 9, h: 0.4,
    fontSize: 12, fontFace: BODY_FONT, color: ACCENT, bold: true,
  });
  slide.addText("At-Home Therapeutic Protocols", {
    x: 0.5, y: 0.55, w: 9, h: 0.5,
    fontSize: 24, fontFace: HEADER_FONT, color: WHITE, bold: true,
  });

  const homeItems = [
    { title: "Detox Baths", desc: "Epsom salt, bentonite clay, and essential oil baths — 3x per week for lymphatic drainage and toxin elimination" },
    { title: "Castor Oil Packs", desc: "Apply to liver area 30–60 min, 3–4x/week to stimulate lymphatic flow and reduce inflammation" },
    { title: "Coffee Enemas", desc: "Organic coffee retention enemas for glutathione production and bile duct cleansing — per protocol schedule" },
    { title: "Nebulization", desc: "Colloidal silver, glutathione, or hydrogen peroxide nebulization for respiratory and immune support" },
    { title: "Red Light Therapy", desc: "NIR/red light panel sessions for mitochondrial support, wound healing, and inflammation reduction" },
    { title: "Grounding", desc: "Barefoot earthing 20+ min/day for inflammation reduction and circadian rhythm regulation" },
  ];

  homeItems.forEach((item, i) => {
    const row = Math.floor(i / 2);
    const col = i % 2;
    const x = 0.5 + col * 4.7;
    const y = 1.2 + row * 1.1;

    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 4.4, h: 0.95,
      fill: { color: CARD_BG },
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 0.06, h: 0.95,
      fill: { color: ACCENT },
    });
    slide.addText(item.title, {
      x: x + 0.2, y, w: 4.0, h: 0.3,
      fontSize: 11, fontFace: HEADER_FONT, color: ACCENT, bold: true,
    });
    slide.addText(item.desc, {
      x: x + 0.2, y: y + 0.3, w: 4.0, h: 0.6,
      fontSize: 8, fontFace: BODY_FONT, color: TEAL,
    });
  });
}

function slideAdvancedModalities(pres: PptxPresentation, protocol: HealingProtocol) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: DARK_BG };

  slide.addText("ADVANCED MODALITIES", {
    x: 0.5, y: 0.2, w: 9, h: 0.4,
    fontSize: 12, fontFace: BODY_FONT, color: ACCENT, bold: true,
  });
  slide.addText("Additional Therapeutic Stack", {
    x: 0.5, y: 0.55, w: 9, h: 0.5,
    fontSize: 24, fontFace: HEADER_FONT, color: WHITE, bold: true,
  });

  const modalities: Array<{ title: string; desc: string; count: number }> = [];

  if (protocol.liposomals?.length) {
    modalities.push({ title: "Liposomal Supplements", desc: protocol.liposomals.map(l => l.name).join(", "), count: protocol.liposomals.length });
  }
  if (protocol.nebulization?.length) {
    modalities.push({ title: "Nebulization Protocols", desc: protocol.nebulization.map(n => n.name).join(", "), count: protocol.nebulization.length });
  }
  if (protocol.topicals?.length) {
    modalities.push({ title: "Topical Protocols", desc: protocol.topicals.map(t => t.name).join(", "), count: protocol.topicals.length });
  }
  if (protocol.exosomes?.length) {
    modalities.push({ title: "Exosome Therapy", desc: protocol.exosomes.map(e => e.name).join(", "), count: protocol.exosomes.length });
  }
  if (protocol.lifestyleRecommendations?.length) {
    modalities.push({ title: "Lifestyle Modifications", desc: protocol.lifestyleRecommendations.slice(0, 3).map(l => l.category).join(", "), count: protocol.lifestyleRecommendations.length });
  }
  if (protocol.dietaryGuidelines?.length) {
    modalities.push({ title: "Dietary Guidelines", desc: protocol.dietaryGuidelines.slice(0, 2).join("; ").substring(0, 80), count: protocol.dietaryGuidelines.length });
  }

  if (modalities.length === 0) {
    modalities.push(
      { title: "Liposomal Delivery", desc: "Enhanced bioavailability through liposomal encapsulation", count: 0 },
      { title: "Nebulization", desc: "Aerosolized therapeutic delivery for respiratory and systemic benefit", count: 0 },
      { title: "Topical Protocols", desc: "Transdermal application of peptides and cannabinoids", count: 0 },
    );
  }

  modalities.slice(0, 6).forEach((mod, i) => {
    const row = Math.floor(i / 2);
    const col = i % 2;
    const x = 0.5 + col * 4.7;
    const y = 1.2 + row * 1.1;

    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 4.4, h: 0.95,
      fill: { color: CARD_BG },
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 0.06, h: 0.95,
      fill: { color: ACCENT },
    });
    slide.addText(mod.title, {
      x: x + 0.2, y, w: 3.5, h: 0.3,
      fontSize: 11, fontFace: HEADER_FONT, color: ACCENT, bold: true,
    });
    if (mod.count > 0) {
      slide.addText(String(mod.count), {
        x: x + 3.7, y, w: 0.5, h: 0.3,
        fontSize: 14, fontFace: HEADER_FONT, color: ACCENT, bold: true, align: "right",
      });
    }
    slide.addText(mod.desc.substring(0, 100), {
      x: x + 0.2, y: y + 0.3, w: 4.0, h: 0.6,
      fontSize: 8, fontFace: BODY_FONT, color: TEAL,
    });
  });
}

function slideAIResearchTool(pres: PptxPresentation) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: DARK_BG };

  slide.addText("AI RESEARCH TOOL", {
    x: 0.5, y: 0.2, w: 9, h: 0.4,
    fontSize: 12, fontFace: BODY_FONT, color: ACCENT, bold: true,
  });
  slide.addText("Peptide Chat — AI Assistant", {
    x: 0.5, y: 0.55, w: 9, h: 0.5,
    fontSize: 24, fontFace: HEADER_FONT, color: WHITE, bold: true,
  });

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.2, w: 9, h: 1.6,
    fill: { color: CARD_BG },
  });
  slide.addText("Access our custom AI research assistant trained on thousands of peptide studies, clinical trials, and mechanism-of-action papers.\n\nAsk questions about any peptide in your protocol — interactions, dosing rationale, mechanism of action, supporting research.", {
    x: 0.7, y: 1.3, w: 8.6, h: 1.2,
    fontSize: 10, fontFace: BODY_FONT, color: TEAL,
  });

  const examples = [
    '"What is the mechanism of PNC-27 against pancreatic cancer?"',
    '"Can LL-37 and KPV be taken simultaneously?"',
    '"Show me clinical trials for Epithalon and telomere extension"',
  ];

  examples.forEach((ex, i) => {
    const y = 3.1 + i * 0.5;
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 1, y, w: 8, h: 0.4,
      fill: { color: CARD_BG },
    });
    slide.addText(ex, {
      x: 1.2, y, w: 7.6, h: 0.4,
      fontSize: 9, fontFace: BODY_FONT, color: ACCENT, italic: true, valign: "middle",
    });
  });

  slide.addText("Launch Peptide Chat →", {
    x: 3, y: 4.8, w: 4, h: 0.4,
    fontSize: 12, fontFace: BODY_FONT, color: ACCENT, bold: true, align: "center",
    hyperlink: { url: "https://peptide-chat.abacusai.app" },
  });
}

function slideProtocolSummary(pres: PptxPresentation, protocol: HealingProtocol, profile: PatientProfile) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: DARK_BG };

  slide.addText("PROTOCOL SUMMARY", {
    x: 0.5, y: 0.2, w: 9, h: 0.4,
    fontSize: 12, fontFace: BODY_FONT, color: ACCENT, bold: true,
  });
  slide.addText("Your Custom Protocol — At a Glance", {
    x: 0.5, y: 0.55, w: 9, h: 0.5,
    fontSize: 24, fontFace: HEADER_FONT, color: WHITE, bold: true,
  });

  const fields = [
    { label: "Member Name", value: protocol.patientName },
    { label: "Start Date", value: protocol.generatedDate || new Date().toISOString().split("T")[0] },
    { label: "Selected Peptides", value: [
      ...(protocol.injectablePeptides || []).map(p => p.name),
      ...(protocol.oralPeptides || []).map(p => p.name),
    ].slice(0, 6).join(", ") || "See peptide slides" },
    { label: "Duration", value: `${protocol.protocolDurationDays} days` },
    { label: "Key Modalities", value: [
      protocol.ivTherapies?.length ? "IV Therapy" : "",
      protocol.imTherapies?.length ? "IM Injections" : "",
      protocol.ecsProtocol ? "ECS Optimization" : "",
      protocol.sirtuinStack ? "Sirtuin/Mito Support" : "",
      "HBOT",
    ].filter(Boolean).join(", ") },
    { label: "Dietary Focus", value: protocol.dietaryProtocol?.phases?.[0]?.name || "Per protocol schedule" },
  ];

  fields.forEach((f, i) => {
    const y = 1.2 + i * 0.6;
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y, w: 9, h: 0.5,
      fill: { color: CARD_BG },
    });
    slide.addText(f.label, {
      x: 0.7, y, w: 2.5, h: 0.5,
      fontSize: 10, fontFace: BODY_FONT, color: ACCENT, bold: true, valign: "middle",
    });
    slide.addText(f.value, {
      x: 3.3, y, w: 6.0, h: 0.5,
      fontSize: 10, fontFace: BODY_FONT, color: TEAL, valign: "middle",
    });
  });
}

function slideClosing(pres: PptxPresentation) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: DARK_BG };

  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: ACCENT } });
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.565, w: 10, h: 0.06, fill: { color: ACCENT } });

  slide.addText("Your Healing Begins Here", {
    x: 0, y: 1.2, w: 10, h: 0.8,
    fontSize: 32, fontFace: HEADER_FONT, color: WHITE, align: "center", bold: true,
  });
  slide.addText("A root-cause approach to regeneration — customized for your body, backed by science, protected by constitutional right.", {
    x: 1, y: 2.1, w: 8, h: 0.6,
    fontSize: 12, fontFace: BODY_FONT, color: TEAL, align: "center",
  });

  slide.addShape(pres.shapes.LINE, {
    x: 3.5, y: 2.9, w: 3, h: 0,
    line: { color: ACCENT, width: 1.5 },
  });

  const contacts = [
    { label: "Contact", value: "forgottenformulapma.com" },
    { label: "Research", value: "peptide-chat.abacusai.app" },
    { label: "HBOT Systems", value: "FFPMA Division" },
  ];

  contacts.forEach((c, i) => {
    const x = 1 + i * 3;
    slide.addText(c.label, {
      x, y: 3.3, w: 2.5, h: 0.3,
      fontSize: 10, fontFace: BODY_FONT, color: ACCENT, bold: true, align: "center",
    });
    slide.addText(c.value, {
      x, y: 3.6, w: 2.5, h: 0.3,
      fontSize: 9, fontFace: BODY_FONT, color: TEAL, align: "center",
    });
  });

  slide.addText([
    { text: '"Before you heal someone, ask him if he\'s willing to give up the things that make him sick"', options: { italic: true, color: "8A95B0", fontSize: 9, breakLine: true } },
    { text: "— Hippocrates", options: { color: ACCENT, fontSize: 9 } },
  ], { x: 1.5, y: 4.5, w: 7, h: 0.6, align: "center", fontFace: BODY_FONT });

  slide.addText("Confidential — Private Members Association", {
    x: 0, y: 5.1, w: 10, h: 0.3,
    fontSize: 8, fontFace: BODY_FONT, color: "5A6B8A", align: "center",
  });
}

function slideIntakePersonal(pres: PptxPresentation, protocol: HealingProtocol, profile: PatientProfile) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: DARK_BG };
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: ACCENT } });

  slide.addText("MEMBER INTAKE — SECTION 1 OF 3", {
    x: 0.3, y: 0.15, w: 9.4, h: 0.4,
    fontSize: 10, fontFace: BODY_FONT, color: ACCENT, bold: true,
  });
  slide.addText("Personal Information", {
    x: 0.5, y: 0.5, w: 9, h: 0.5,
    fontSize: 24, fontFace: HEADER_FONT, color: WHITE, bold: true,
  });

  const p = profile as any;
  const fields = [
    { label: "Full Legal Name", value: protocol.patientName || "[Enter full name]" },
    { label: "Date of Birth", value: p.dateOfBirth || "MM / DD / YYYY" },
    { label: "Phone Number", value: p.phone || "(___) ___-____" },
    { label: "Email Address", value: p.email || "email@example.com" },
    { label: "Mailing Address", value: profile.location || "Street, City, State, ZIP" },
    { label: "Emergency Contact", value: p.emergencyContact || "Name & phone number" },
    { label: "Height / Weight", value: p.heightWeight || "___ft ___in / ___lbs" },
    { label: "Gender", value: profile.gender || "Select..." },
  ];

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.1, w: 9, h: 4.2,
    fill: { color: CARD_BG }, rectRadius: 0.1,
  });

  fields.forEach((f, i) => {
    const row = Math.floor(i / 2);
    const col = i % 2;
    const x = 0.7 + col * 4.3;
    const y = 1.3 + row * 0.95;

    slide.addText(f.label, {
      x, y, w: 3.8, h: 0.25,
      fontSize: 9, fontFace: BODY_FONT, color: ACCENT, bold: true,
    });
    slide.addText(f.value, {
      x, y: y + 0.25, w: 3.8, h: 0.35,
      fontSize: 11, fontFace: BODY_FONT, color: WHITE,
    });
  });
}

function slideIntakeHealthHistory(pres: PptxPresentation, protocol: HealingProtocol, profile: PatientProfile) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: DARK_BG };
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: ACCENT } });

  slide.addText("MEMBER INTAKE — SECTION 2 OF 3", {
    x: 0.3, y: 0.15, w: 9.4, h: 0.4,
    fontSize: 10, fontFace: BODY_FONT, color: ACCENT, bold: true,
  });
  slide.addText("Health History & Current Conditions", {
    x: 0.5, y: 0.5, w: 9, h: 0.5,
    fontSize: 24, fontFace: HEADER_FONT, color: WHITE, bold: true,
  });

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.1, w: 9, h: 4.2,
    fill: { color: CARD_BG }, rectRadius: 0.1,
  });

  const p = profile as any;
  const sections = [
    { label: "Primary Health Concern(s)", value: (profile.chiefComplaints || []).join(", ") || "Describe your main health concerns..." },
    { label: "Previous Diagnoses", value: (profile.currentDiagnoses || []).join(", ") || "List any diagnoses received..." },
    { label: "Current Medications & Supplements", value: (profile.currentMedications || []).join(", ") || "Include dosages if known..." },
    { label: "Known Allergies", value: (p.allergies || []).join(", ") || "Medications, foods, environmental..." },
    { label: "Family History", value: p.familyHistory || "Cancer, autoimmune, cardiovascular..." },
    { label: "Prior Surgeries / Procedures", value: (profile.surgicalHistory || []).join(", ") || "List with approximate dates..." },
  ];

  sections.forEach((s, i) => {
    const y = 1.3 + i * 0.65;
    slide.addText(s.label, {
      x: 0.7, y, w: 8.6, h: 0.2,
      fontSize: 9, fontFace: BODY_FONT, color: ACCENT, bold: true,
    });
    slide.addText(s.value, {
      x: 0.7, y: y + 0.2, w: 8.6, h: 0.35,
      fontSize: 10, fontFace: BODY_FONT, color: TEAL,
    });
  });
}

function slideIntakeSymptomsGoals(pres: PptxPresentation, protocol: HealingProtocol, profile: PatientProfile) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: DARK_BG };
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: ACCENT } });

  slide.addText("MEMBER INTAKE — SECTION 3 OF 3", {
    x: 0.3, y: 0.15, w: 9.4, h: 0.4,
    fontSize: 10, fontFace: BODY_FONT, color: ACCENT, bold: true,
  });
  slide.addText("Symptoms, Lifestyle & Goals", {
    x: 0.5, y: 0.5, w: 9, h: 0.5,
    fontSize: 24, fontFace: HEADER_FONT, color: WHITE, bold: true,
  });

  const symptoms = [
    "Chronic fatigue", "Joint/muscle pain", "Brain fog", "Digestive issues",
    "Insomnia / poor sleep", "Weight gain/loss", "Skin issues", "Mood / anxiety / depression",
    "Hormonal imbalance", "Autoimmune flare-ups", "Frequent infections", "Chemical sensitivity",
  ];

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.1, w: 4.3, h: 2.5,
    fill: { color: CARD_BG }, rectRadius: 0.1,
  });

  slide.addText("Current Symptoms (check all that apply)", {
    x: 0.7, y: 1.15, w: 4.0, h: 0.25,
    fontSize: 9, fontFace: BODY_FONT, color: ACCENT, bold: true,
  });

  const complaintSet = new Set((profile.chiefComplaints || []).map(c => c.toLowerCase()));
  symptoms.forEach((s, i) => {
    const col = Math.floor(i / 6);
    const row = i % 6;
    const checked = complaintSet.has(s.toLowerCase()) ? "☑" : "☐";
    slide.addText(`${checked} ${s}`, {
      x: 0.7 + col * 2.0, y: 1.5 + row * 0.3, w: 1.9, h: 0.25,
      fontSize: 8, fontFace: BODY_FONT, color: WHITE,
    });
  });

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 5.2, y: 1.1, w: 4.3, h: 2.5,
    fill: { color: CARD_BG }, rectRadius: 0.1,
  });

  slide.addText("Lifestyle & Environmental", {
    x: 5.4, y: 1.15, w: 4.0, h: 0.25,
    fontSize: 9, fontFace: BODY_FONT, color: ACCENT, bold: true,
  });

  const pAny = profile as any;
  const toxicList = [
    profile.environmentalExposures?.moldExposure ? "Mold" : "",
    profile.environmentalExposures?.heavyMetals ? "Heavy metals" : "",
    profile.environmentalExposures?.pesticides ? "Pesticides" : "",
    profile.environmentalExposures?.radiation ? "Radiation" : "",
    ...(profile.environmentalExposures?.otherToxins || []),
  ].filter(Boolean);

  const lifestyleFields = [
    { label: "Diet Type", value: pAny.dietType || "Standard / Keto / Paleo / Vegan..." },
    { label: "Exercise Frequency", value: pAny.exerciseFrequency || "None / 1-2x / 3-5x / Daily" },
    { label: "Toxic Exposures", value: toxicList.length > 0 ? toxicList.join(", ") : "Mold, heavy metals, pesticides..." },
    { label: "Stress Level", value: pAny.stressLevel || "Low / Moderate / High / Severe" },
  ];

  lifestyleFields.forEach((f, i) => {
    slide.addText(f.label, { x: 5.4, y: 1.55 + i * 0.55, w: 4.0, h: 0.18, fontSize: 8, fontFace: BODY_FONT, color: ACCENT, bold: true });
    slide.addText(f.value, { x: 5.4, y: 1.73 + i * 0.55, w: 4.0, h: 0.25, fontSize: 9, fontFace: BODY_FONT, color: TEAL });
  });

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 3.8, w: 9, h: 1.5,
    fill: { color: CARD_BG }, rectRadius: 0.1,
  });

  slide.addText("Health Goals & Desired Outcomes", {
    x: 0.7, y: 3.85, w: 8.6, h: 0.25,
    fontSize: 9, fontFace: BODY_FONT, color: ACCENT, bold: true,
  });

  const goals = ((protocol as any).healthGoals || []).slice(0, 4) as string[];
  if (goals.length > 0) {
    slide.addText(goals.map((g: string, i: number) => ({
      text: g, options: { bullet: true, breakLine: i < goals.length - 1, fontSize: 10, color: WHITE },
    })), { x: 0.7, y: 4.2, w: 8.6, h: 1.0, fontFace: BODY_FONT, valign: "top" });
  } else {
    slide.addText("What are your top health goals for this 90-day program?", {
      x: 0.7, y: 4.2, w: 8.6, h: 0.4, fontSize: 10, fontFace: BODY_FONT, color: TEAL, italic: true,
    });
  }
}

function slidePeptideCategory(pres: PptxPresentation, category: string, subtitle: string, peptides: any[]) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: DARK_BG };
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: ACCENT } });

  slide.addText(`PEPTIDE PROTOCOLS — ${category}`, {
    x: 0.3, y: 0.15, w: 9.4, h: 0.4,
    fontSize: 10, fontFace: BODY_FONT, color: ACCENT, bold: true,
  });
  slide.addText(subtitle, {
    x: 0.5, y: 0.5, w: 9, h: 0.5,
    fontSize: 24, fontFace: HEADER_FONT, color: WHITE, bold: true,
  });

  const maxCards = Math.min(peptides.length, 4);
  const cardW = maxCards <= 2 ? 4.3 : 2.1;
  const startX = 0.5;
  const gap = maxCards <= 2 ? 0.4 : 0.2;

  peptides.slice(0, maxCards).forEach((pep: any, i: number) => {
    const x = startX + i * (cardW + gap);

    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.1, w: cardW, h: 4.1,
      fill: { color: CARD_BG }, rectRadius: 0.1,
    });

    slide.addText(pep.name || "Peptide", {
      x: x + 0.1, y: 1.2, w: cardW - 0.2, h: 0.35,
      fontSize: 13, fontFace: HEADER_FONT, color: ACCENT, bold: true,
    });

    const subtitle2 = pep.category || pep.type || "";
    if (subtitle2) {
      slide.addText(subtitle2, {
        x: x + 0.1, y: 1.55, w: cardW - 0.2, h: 0.2,
        fontSize: 8, fontFace: BODY_FONT, color: TEAL, italic: true,
      });
    }

    const desc = pep.mechanism || pep.description || pep.rationale || "";
    if (desc) {
      slide.addText(desc.substring(0, 200), {
        x: x + 0.1, y: 1.8, w: cardW - 0.2, h: 1.2,
        fontSize: 8, fontFace: BODY_FONT, color: WHITE, valign: "top",
      });
    }

    const details = [
      { label: "Dose:", value: pep.dosage || pep.dose || "As directed" },
      { label: "Route:", value: pep.route || "SubQ" },
      { label: "Frequency:", value: pep.frequency || "Daily" },
      { label: "Cycle:", value: pep.cycleDuration || pep.duration || "30 days" },
    ];

    details.forEach((d, j) => {
      slide.addText(`${d.label}`, {
        x: x + 0.1, y: 3.1 + j * 0.4, w: 0.8, h: 0.3,
        fontSize: 8, fontFace: BODY_FONT, color: ACCENT, bold: true,
      });
      slide.addText(d.value, {
        x: x + 0.9, y: 3.1 + j * 0.4, w: cardW - 1.1, h: 0.3,
        fontSize: 8, fontFace: BODY_FONT, color: WHITE,
      });
    });
  });

  if (peptides.length > 4) {
    slide.addText(`+ ${peptides.length - 4} additional peptides in this category`, {
      x: 0.5, y: 5.2, w: 9, h: 0.3,
      fontSize: 9, fontFace: BODY_FONT, color: TEAL, align: "center", italic: true,
    });
  }
}

function slideHBOTSystems(pres: PptxPresentation) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: DARK_BG };
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: ACCENT } });

  slide.addText("HBOT SYSTEMS", {
    x: 0.3, y: 0.15, w: 9.4, h: 0.4,
    fontSize: 10, fontFace: BODY_FONT, color: ACCENT, bold: true,
  });
  slide.addText("Chamber Options", {
    x: 0.5, y: 0.5, w: 9, h: 0.5,
    fontSize: 24, fontFace: HEADER_FONT, color: WHITE, bold: true,
  });

  const chambers = [
    {
      name: "HE5000 Plus", tier: "Premium",
      desc: "Clinical-grade hard-shell chamber with full 1.5 ATA capability. Walk-in design seats 5 people. Ideal for families, clinics, and high-volume use.",
      features: ["1.5 ATA maximum pressure", "Walk-in, 5-person capacity", "Medical-grade oxygen concentrator", "Built-in cooling system"],
    },
    {
      name: "Vitaeris 320", tier: "Standard",
      desc: "Portable soft-shell chamber rated to 1.3 ATA. Single-person design, easy setup. Perfect for daily home use and maintenance protocols.",
      features: ["1.3 ATA maximum pressure", "Single-person portable", "Easy home setup", "Quiet operation"],
    },
    {
      name: "Military Grade", tier: "Professional",
      desc: "Dual-person hard-shell chamber rated to 2.0 ATA. Hospital-grade construction with advanced monitoring. For clinics and serious practitioners.",
      features: ["2.0 ATA maximum pressure", "Dual-person capacity", "Hospital-grade construction", "Advanced pressure monitoring"],
    },
  ];

  chambers.forEach((ch, i) => {
    const x = 0.5 + i * 3.15;
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.1, w: 2.95, h: 4.2,
      fill: { color: CARD_BG }, rectRadius: 0.1,
    });

    slide.addText(ch.name, {
      x: x + 0.1, y: 1.2, w: 2.75, h: 0.35,
      fontSize: 14, fontFace: HEADER_FONT, color: WHITE, bold: true,
    });
    slide.addText(ch.tier, {
      x: x + 0.1, y: 1.55, w: 2.75, h: 0.2,
      fontSize: 9, fontFace: BODY_FONT, color: ACCENT, bold: true,
    });
    slide.addText(ch.desc, {
      x: x + 0.1, y: 1.85, w: 2.75, h: 1.2,
      fontSize: 8, fontFace: BODY_FONT, color: TEAL, valign: "top",
    });

    ch.features.forEach((f, j) => {
      slide.addText(`▸ ${f}`, {
        x: x + 0.1, y: 3.2 + j * 0.35, w: 2.75, h: 0.3,
        fontSize: 8, fontFace: BODY_FONT, color: WHITE,
      });
    });
  });
}

function slideDetoxIVSequence(pres: PptxPresentation, protocol: HealingProtocol) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: DARK_BG };
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: ACCENT } });

  slide.addText("DETOXIFICATION PROTOCOLS", {
    x: 0.3, y: 0.15, w: 9.4, h: 0.4,
    fontSize: 10, fontFace: BODY_FONT, color: ACCENT, bold: true,
  });
  slide.addText("5-Step Detox IV Sequence", {
    x: 0.5, y: 0.5, w: 9, h: 0.5,
    fontSize: 24, fontFace: HEADER_FONT, color: WHITE, bold: true,
  });

  slide.addText("Administered sequentially in-clinic to chelate heavy metals, replenish nutrients, and support detox pathways", {
    x: 0.5, y: 1.0, w: 9, h: 0.35,
    fontSize: 10, fontFace: BODY_FONT, color: TEAL, align: "center",
  });

  const ivSteps = [
    { num: "1", name: "EDTA", desc: "Chelation therapy — binds and removes lead, mercury, cadmium, arsenic from bloodstream" },
    { num: "2", name: "Myers' Cocktail", desc: "Magnesium, calcium, B-vitamins, vitamin C — replenishes minerals depleted by chelation" },
    { num: "3", name: "Glutathione Push", desc: "Master antioxidant — supports liver detox pathways, protects cells during chelation" },
    { num: "4", name: "High-Dose Vitamin C", desc: "25–75g IV — generates hydrogen peroxide in cancer cells, spares healthy tissue" },
    { num: "5", name: "Phosphatidylcholine", desc: "Cell membrane repair — restores lipid bilayer integrity damaged by toxins" },
  ];

  const protocolDetox = protocol.detoxProtocols || [];
  const ivTherapies = protocol.ivTherapies || [];
  const allItems = [...ivSteps];

  allItems.forEach((item, i) => {
    const y = 1.5 + i * 0.8;
    slide.addShape(pres.shapes.OVAL, {
      x: 0.6, y: y + 0.05, w: 0.5, h: 0.5,
      fill: { color: ACCENT },
    });
    slide.addText(item.num, {
      x: 0.6, y: y + 0.05, w: 0.5, h: 0.5,
      fontSize: 16, fontFace: HEADER_FONT, color: DARK_BG, align: "center", valign: "middle", bold: true,
    });
    slide.addText(item.name, {
      x: 1.3, y, w: 2.0, h: 0.35,
      fontSize: 12, fontFace: HEADER_FONT, color: WHITE, bold: true,
    });
    slide.addText(item.desc, {
      x: 1.3, y: y + 0.35, w: 8.0, h: 0.35,
      fontSize: 9, fontFace: BODY_FONT, color: TEAL,
    });
  });
}

function slideDentalBiological(pres: PptxPresentation) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: DARK_BG };
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: RED_ACCENT } });

  slide.addText("CRITICAL PREREQUISITE — BIOLOGICAL DENTISTRY", {
    x: 0.3, y: 0.15, w: 9.4, h: 0.4,
    fontSize: 10, fontFace: BODY_FONT, color: RED_ACCENT, bold: true,
  });
  slide.addText("Dental Dangers & Disease", {
    x: 0.5, y: 0.5, w: 9, h: 0.5,
    fontSize: 24, fontFace: HEADER_FONT, color: WHITE, bold: true,
  });

  slide.addText('"Fix the roof before it rains — amalgam, cavitations, and root canals are silent drivers of systemic disease"', {
    x: 0.5, y: 1.0, w: 9, h: 0.4,
    fontSize: 10, fontFace: BODY_FONT, color: TEAL, italic: true, align: "center",
  });

  const dangers = [
    { title: "Mercury Amalgam Fillings", desc: "Each amalgam filling contains ~50% mercury — a potent neurotoxin. Mercury vapor is released 24/7, accumulating in brain, kidneys, and gut. Safe removal by IAOMT-certified dentist required.", color: RED_ACCENT },
    { title: "Root Canals & Cavitations", desc: "Dead teeth harbor anaerobic bacteria that produce potent toxins (thioethers). These drain into the bloodstream, contributing to autoimmune disease, cancer, and chronic inflammation.", color: RED_ACCENT },
    { title: "Galvanic Currents", desc: "Mixed metals in the mouth create battery-like electrical currents that disrupt the nervous system and accelerate mercury release from amalgam fillings.", color: ORANGE_ACCENT },
  ];

  dangers.forEach((d, i) => {
    const y = 1.6 + i * 1.3;
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y, w: 9, h: 1.1,
      fill: { color: CARD_BG }, rectRadius: 0.1,
      line: { color: d.color, width: 1.5 },
    });
    slide.addText(d.title, {
      x: 0.7, y: y + 0.1, w: 8.6, h: 0.3,
      fontSize: 13, fontFace: HEADER_FONT, color: d.color, bold: true,
    });
    slide.addText(d.desc, {
      x: 0.7, y: y + 0.45, w: 8.6, h: 0.55,
      fontSize: 9, fontFace: BODY_FONT, color: WHITE, valign: "top",
    });
  });
}

function slideMitoPathwayMap(pres: PptxPresentation) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: DARK_BG };
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: ACCENT } });

  slide.addText("MITOCHONDRIAL PATHWAY MAP", {
    x: 0.3, y: 0.15, w: 9.4, h: 0.4,
    fontSize: 10, fontFace: BODY_FONT, color: ACCENT, bold: true,
  });
  slide.addText("MitoSTAC Activation Cascade", {
    x: 0.5, y: 0.5, w: 9, h: 0.5,
    fontSize: 24, fontFace: HEADER_FONT, color: WHITE, bold: true,
  });

  const inputs = [
    { name: "NMN / NR", desc: "NAD+ precursors" },
    { name: "Resveratrol + Quercetin", desc: "STAC activators" },
    { name: "CoQ10 + PQQ", desc: "ETC cofactors" },
    { name: "ALA + Glutathione", desc: "Antioxidant shield" },
    { name: "Fisetin + Curcumin", desc: "Senolytic + NF-kB" },
  ];

  slide.addText("Input Compounds", {
    x: 0.3, y: 1.1, w: 2.5, h: 0.3,
    fontSize: 11, fontFace: HEADER_FONT, color: ACCENT, bold: true,
  });
  slide.addText("Oral / IV / Suppository", {
    x: 0.3, y: 1.35, w: 2.5, h: 0.2,
    fontSize: 8, fontFace: BODY_FONT, color: TEAL,
  });

  inputs.forEach((inp, i) => {
    const y = 1.7 + i * 0.65;
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.3, y, w: 2.5, h: 0.55,
      fill: { color: CARD_BG }, rectRadius: 0.05,
    });
    slide.addText(inp.name, { x: 0.4, y, w: 2.3, h: 0.3, fontSize: 9, fontFace: BODY_FONT, color: WHITE, bold: true });
    slide.addText(inp.desc, { x: 0.4, y: y + 0.25, w: 2.3, h: 0.25, fontSize: 7, fontFace: BODY_FONT, color: TEAL });
  });

  [1.9, 2.55, 3.2].forEach(y => {
    slide.addText("→", { x: 2.9, y, w: 0.5, h: 0.3, fontSize: 16, color: ACCENT, align: "center" });
  });

  const targets = [
    { name: "NAD+ Pool ↑", desc: "Sirtuin activation" },
    { name: "ETC Efficiency ↑", desc: "ATP production" },
    { name: "Senescent Cell ↓", desc: "Zombie cell clearance" },
    { name: "Inflammation ↓", desc: "NF-kB suppression" },
  ];

  slide.addText("Cellular Targets", {
    x: 3.5, y: 1.1, w: 2.5, h: 0.3,
    fontSize: 11, fontFace: HEADER_FONT, color: ACCENT, bold: true,
  });

  targets.forEach((t, i) => {
    const y = 1.7 + i * 0.75;
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 3.5, y, w: 2.5, h: 0.6,
      fill: { color: CARD_BG }, rectRadius: 0.05,
    });
    slide.addText(t.name, { x: 3.6, y, w: 2.3, h: 0.3, fontSize: 9, fontFace: BODY_FONT, color: GREEN_ACCENT, bold: true });
    slide.addText(t.desc, { x: 3.6, y: y + 0.3, w: 2.3, h: 0.25, fontSize: 7, fontFace: BODY_FONT, color: TEAL });
  });

  const outcomes = [
    "↑ Cellular energy (ATP)",
    "↑ DNA repair capacity",
    "↓ Oxidative stress",
    "↓ Biological age markers",
    "↑ Telomere maintenance",
  ];

  slide.addText("Outcomes", {
    x: 6.8, y: 1.1, w: 2.8, h: 0.3,
    fontSize: 11, fontFace: HEADER_FONT, color: ACCENT, bold: true,
  });

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 6.8, y: 1.5, w: 2.8, h: 3.5,
    fill: { color: CARD_BG }, rectRadius: 0.1,
  });

  outcomes.forEach((o, i) => {
    slide.addText(o, {
      x: 7.0, y: 1.7 + i * 0.6, w: 2.4, h: 0.4,
      fontSize: 9, fontFace: BODY_FONT, color: WHITE,
    });
  });
}

function slideCannabinoidLigandMap(pres: PptxPresentation, protocol: HealingProtocol) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: DARK_BG };
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: GREEN_ACCENT } });

  slide.addText("CANNABINOID LIGAND PATHWAY MAP", {
    x: 0.3, y: 0.15, w: 9.4, h: 0.4,
    fontSize: 10, fontFace: BODY_FONT, color: GREEN_ACCENT, bold: true,
  });
  slide.addText("Endocannabinoid System & Ligand Pathways", {
    x: 0.5, y: 0.5, w: 9, h: 0.5,
    fontSize: 22, fontFace: HEADER_FONT, color: WHITE, bold: true,
  });

  slide.addText("Source: Cannabinoid Ligand Pathway Research (FFPMA Drive) — CB1/CB2 receptor signaling cascade", {
    x: 0.5, y: 1.0, w: 9, h: 0.25,
    fontSize: 8, fontFace: BODY_FONT, color: TEAL, italic: true, align: "center",
  });

  const cb1 = {
    title: "CB1 Receptors", location: "Brain, CNS, Nervous System",
    functions: ["Pain modulation", "Mood & anxiety regulation", "Appetite control", "Memory & cognition"],
  };

  const cb2 = {
    title: "CB2 Receptors", location: "Immune System, Periphery",
    functions: ["Immune modulation", "Anti-inflammatory signaling", "Bone density regulation", "Gut barrier integrity"],
  };

  [cb1, cb2].forEach((receptor, i) => {
    const x = 0.5 + i * 4.8;
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.4, w: 4.5, h: 3.5,
      fill: { color: CARD_BG }, rectRadius: 0.1,
    });
    slide.addText(receptor.title, {
      x: x + 0.15, y: 1.5, w: 4.2, h: 0.35,
      fontSize: 14, fontFace: HEADER_FONT, color: GREEN_ACCENT, bold: true,
    });
    slide.addText(receptor.location, {
      x: x + 0.15, y: 1.85, w: 4.2, h: 0.2,
      fontSize: 9, fontFace: BODY_FONT, color: TEAL, italic: true,
    });
    receptor.functions.forEach((f, j) => {
      slide.addText(`▸ ${f}`, {
        x: x + 0.15, y: 2.2 + j * 0.4, w: 4.2, h: 0.35,
        fontSize: 10, fontFace: BODY_FONT, color: WHITE,
      });
    });
  });

  const ecsData = protocol.ecsProtocol;
  if (ecsData?.overview) {
    slide.addText(ecsData.overview.substring(0, 120), {
      x: 0.5, y: 5.0, w: 9, h: 0.4,
      fontSize: 8, fontFace: BODY_FONT, color: TEAL, align: "center", italic: true,
    });
  }
}

function slideProtocolBuilder(pres: PptxPresentation, protocol: HealingProtocol) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: DARK_BG };
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: ACCENT } });

  slide.addText("PROTOCOL BUILDER — MODALITY SELECTION", {
    x: 0.3, y: 0.15, w: 9.4, h: 0.4,
    fontSize: 10, fontFace: BODY_FONT, color: ACCENT, bold: true,
  });
  slide.addText("Build Your Custom Protocol", {
    x: 0.5, y: 0.5, w: 9, h: 0.5,
    fontSize: 24, fontFace: HEADER_FONT, color: WHITE, bold: true,
  });
  slide.addText("Select all modalities and products for this member's program", {
    x: 0.5, y: 1.0, w: 9, h: 0.25,
    fontSize: 10, fontFace: BODY_FONT, color: TEAL, align: "center",
  });

  const allPeptideNames = [
    ...(protocol.injectablePeptides || []).map((p: any) => p.name),
    ...(protocol.oralPeptides || []).map((p: any) => p.name),
    ...(protocol.bioregulators || []).map((p: any) => p.name),
  ];

  const categories = [
    { title: "Peptide Selection", items: allPeptideNames.length > 0 ? allPeptideNames : ["LL-37", "Thymosin Alpha-1", "PNC-27", "FOXO4-DRI", "Retatrutide", "Epithalon"] },
    { title: "HBOT Chamber", items: ["HE5000 Plus (1.5 ATA)", "Vitaeris 320 (1.3 ATA)", "Military Grade (2.0 ATA)"] },
    { title: "IV Protocols", items: ["EDTA Chelation", "Myers' Cocktail", "Glutathione Push", "High-Dose Vit C", "Phosphatidylcholine"] },
    { title: "Additional Modalities", items: ["Detox Bath Protocol", "Biological Dentistry", "5-Day Fast", "Cannabinoid Pathway", "MitoSTAC Stack"] },
  ];

  categories.forEach((cat, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.5 + col * 4.8;
    const y = 1.4 + row * 2.1;

    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 4.5, h: 1.9,
      fill: { color: CARD_BG }, rectRadius: 0.1,
    });

    slide.addText(cat.title, {
      x: x + 0.15, y: y + 0.1, w: 4.2, h: 0.25,
      fontSize: 11, fontFace: HEADER_FONT, color: ACCENT, bold: true,
    });

    const maxItems = Math.min(cat.items.length, 6);
    cat.items.slice(0, maxItems).forEach((item, j) => {
      const selected = allPeptideNames.includes(item) || protocol.ivTherapies?.some((iv: any) => item.includes(iv.name));
      const check = selected ? "☑" : "☐";
      slide.addText(`${check} ${item}`, {
        x: x + 0.15, y: y + 0.45 + j * 0.22, w: 4.2, h: 0.2,
        fontSize: 8, fontFace: BODY_FONT, color: WHITE,
      });
    });
  });
}

function slideProgramTimeline(pres: PptxPresentation, protocol: HealingProtocol) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: DARK_BG };
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: ACCENT } });

  slide.addText("PROGRAM TIMELINE", {
    x: 0.3, y: 0.15, w: 9.4, h: 0.4,
    fontSize: 10, fontFace: BODY_FONT, color: ACCENT, bold: true,
  });
  slide.addText("90-Day Schedule", {
    x: 0.5, y: 0.5, w: 9, h: 0.5,
    fontSize: 24, fontFace: HEADER_FONT, color: WHITE, bold: true,
  });

  const phases = [
    {
      title: "Weeks 1–4: Foundation", items: [
        "Week 1: Intake + labs + detox bath begins",
        "Week 2: First IV sequence + immune peptides",
        "Week 3: 5-day fast (supervised)",
        "Week 4: Liver cleanse + HBOT starts",
      ]
    },
    {
      title: "Weeks 5–8: Rebuild", items: [
        "Week 5: Full peptide stack active",
        "Week 6: Daily HBOT sessions begin",
        "Week 7: Mid-protocol labs",
        "Week 8: Bioregulator cycle starts",
      ]
    },
    {
      title: "Weeks 9–12: Optimize", items: [
        "Week 9: Advanced modalities introduced",
        "Week 10: MitoSTAC activation",
        "Week 11: Cannabinoid pathway tuning",
        "Week 12: Final labs + protocol review",
      ]
    },
    {
      title: "Phase 4: Maintain", items: [
        "Monthly HBOT maintenance",
        "Quarterly lab monitoring",
        "Bioregulator cycling continues",
        "Lifestyle protocol maintenance",
      ]
    },
  ];

  phases.forEach((phase, i) => {
    const x = 0.3 + i * 2.4;
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.1, w: 2.3, h: 4.2,
      fill: { color: CARD_BG }, rectRadius: 0.1,
    });

    slide.addText(phase.title, {
      x: x + 0.1, y: 1.2, w: 2.1, h: 0.4,
      fontSize: 10, fontFace: HEADER_FONT, color: ACCENT, bold: true,
    });

    phase.items.forEach((item, j) => {
      slide.addText(item, {
        x: x + 0.1, y: 1.7 + j * 0.7, w: 2.1, h: 0.6,
        fontSize: 8, fontFace: BODY_FONT, color: WHITE, valign: "top",
      });
    });
  });
}

function slideMonitoringFollowup(pres: PptxPresentation, protocol: HealingProtocol) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: DARK_BG };
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: ACCENT } });

  slide.addText("MONITORING & FOLLOW-UP", {
    x: 0.3, y: 0.15, w: 9.4, h: 0.4,
    fontSize: 10, fontFace: BODY_FONT, color: ACCENT, bold: true,
  });
  slide.addText("Progress Tracking & Lab Schedule", {
    x: 0.5, y: 0.5, w: 9, h: 0.5,
    fontSize: 24, fontFace: HEADER_FONT, color: WHITE, bold: true,
  });

  const labSchedule = [
    { timing: "Baseline Labs", week: "Week 1", tests: "CBC, CMP, thyroid panel, hormone panel, inflammatory markers (CRP, ESR), heavy metals, mycotoxins, vitamin D, B12, folate" },
    { timing: "Mid-Protocol Labs", week: "Week 6", tests: "Repeat inflammatory markers, metabolic panel, hormone re-check, liver enzymes, kidney function" },
    { timing: "Final Labs", week: "Week 12", tests: "Full repeat of baseline panel, before/after comparison, P53 markers, telomere length" },
    { timing: "Maintenance Labs", week: "Quarterly", tests: "Inflammatory markers, metabolic panel, vitamin levels, hormone panel" },
  ];

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.1, w: 9, h: 2.8,
    fill: { color: CARD_BG }, rectRadius: 0.1,
  });

  slide.addText("Lab Work Schedule", {
    x: 0.7, y: 1.15, w: 8.6, h: 0.3,
    fontSize: 12, fontFace: HEADER_FONT, color: ACCENT, bold: true,
  });

  labSchedule.forEach((lab, i) => {
    const y = 1.55 + i * 0.55;
    slide.addText(lab.timing, { x: 0.7, y, w: 1.8, h: 0.25, fontSize: 9, fontFace: BODY_FONT, color: ACCENT, bold: true });
    slide.addText(lab.week, { x: 2.5, y, w: 0.8, h: 0.25, fontSize: 9, fontFace: BODY_FONT, color: WHITE, bold: true });
    slide.addText(lab.tests, { x: 3.3, y, w: 6.0, h: 0.45, fontSize: 7, fontFace: BODY_FONT, color: TEAL });
  });

  const followUps = protocol.followUpPlan || [];
  if (followUps.length > 0) {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 4.1, w: 9, h: 1.2,
      fill: { color: CARD_BG }, rectRadius: 0.1,
    });
    slide.addText("Follow-Up Schedule", {
      x: 0.7, y: 4.15, w: 8.6, h: 0.3,
      fontSize: 12, fontFace: HEADER_FONT, color: ACCENT, bold: true,
    });
    followUps.slice(0, 4).forEach((fu: any, i: number) => {
      slide.addText(`▸ ${fu.milestone || fu}`, {
        x: 0.7, y: 4.5 + i * 0.2, w: 8.6, h: 0.2,
        fontSize: 8, fontFace: BODY_FONT, color: WHITE,
      });
    });
  }
}

function slideLibraryResources(pres: PptxPresentation, resources: ReturnType<typeof getPatientResources>) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: DARK_BG };
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: ACCENT } });

  slide.addText("LIBRARY & RESOURCES", {
    x: 0.3, y: 0.15, w: 9.4, h: 0.4,
    fontSize: 10, fontFace: BODY_FONT, color: ACCENT, bold: true,
  });
  slide.addText("Your Protocol Library", {
    x: 0.5, y: 0.5, w: 9, h: 0.5,
    fontSize: 24, fontFace: HEADER_FONT, color: WHITE, bold: true,
  });
  slide.addText("All books, research documents, schedules, and protocol guides in one place", {
    x: 0.5, y: 1.0, w: 9, h: 0.25,
    fontSize: 10, fontFace: BODY_FONT, color: TEAL, align: "center",
  });

  if (resources.books.length > 0) {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 1.4, w: 4.3, h: 3.5,
      fill: { color: CARD_BG }, rectRadius: 0.1,
    });
    slide.addText("Recommended Reading", {
      x: 0.7, y: 1.5, w: 4.0, h: 0.3,
      fontSize: 11, fontFace: HEADER_FONT, color: ACCENT, bold: true,
    });
    resources.books.slice(0, 6).forEach((book, i) => {
      slide.addText(book.title, {
        x: 0.7, y: 1.9 + i * 0.5, w: 4.0, h: 0.2,
        fontSize: 9, fontFace: BODY_FONT, color: WHITE, bold: true,
      });
      slide.addText(book.reason, {
        x: 0.7, y: 2.1 + i * 0.5, w: 4.0, h: 0.2,
        fontSize: 7, fontFace: BODY_FONT, color: TEAL,
      });
    });
  }

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 5.2, y: 1.4, w: 4.3, h: 3.5,
    fill: { color: CARD_BG }, rectRadius: 0.1,
  });
  slide.addText("Drive Resources", {
    x: 5.4, y: 1.5, w: 4.0, h: 0.3,
    fontSize: 11, fontFace: HEADER_FONT, color: ACCENT, bold: true,
  });

  const driveLinks = (resources as any).driveLinks || [];
  if (driveLinks.length > 0) {
    driveLinks.slice(0, 8).forEach((link: any, i: number) => {
      slide.addText(`▸ ${link.label || link.name || link}`, {
        x: 5.4, y: 1.9 + i * 0.35, w: 4.0, h: 0.3,
        fontSize: 8, fontFace: BODY_FONT, color: WHITE,
      });
    });
  } else {
    slide.addText("Protocol documents, research papers, and guides will be shared via Google Drive after onboarding.", {
      x: 5.4, y: 1.9, w: 4.0, h: 1.0,
      fontSize: 9, fontFace: BODY_FONT, color: TEAL,
    });
  }
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
    const colors = [RED_ACCENT, SECONDARY, "C8CFE0", GREEN_ACCENT, "243055"];

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

  const phaseColors = [RED_ACCENT, SECONDARY, "C8CFE0", GREEN_ACCENT, "243055"];
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
    { key: "morning" as const, label: "MORNING", color: "C9A54E" },
    { key: "midday" as const, label: "MIDDAY", color: "243055" },
    { key: "evening" as const, label: "EVENING", color: "1A2440" },
    { key: "bedtime" as const, label: "BEDTIME", color: "0A0E1A" },
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
    fontSize: 24, fontFace: HEADER_FONT, color: ACCENT, bold: true, margin: 0,
  });

  const peptides = protocol.injectablePeptides || [];

  const headerRow = [
    { text: "Peptide", options: { bold: true, color: DARK_BG, fontSize: 9, fill: { color: ACCENT } } },
    { text: "Vial/Recon", options: { bold: true, color: DARK_BG, fontSize: 9, fill: { color: ACCENT } } },
    { text: "Dose", options: { bold: true, color: DARK_BG, fontSize: 9, fill: { color: ACCENT } } },
    { text: "Frequency", options: { bold: true, color: DARK_BG, fontSize: 9, fill: { color: ACCENT } } },
    { text: "Duration", options: { bold: true, color: DARK_BG, fontSize: 9, fill: { color: ACCENT } } },
    { text: "Purpose", options: { bold: true, color: DARK_BG, fontSize: 9, fill: { color: ACCENT } } },
  ];

  const tableRows: PptxGenJS.TableCell[][] = [headerRow];
  peptides.forEach(p => {
    tableRows.push([
      { text: p.name, options: { fontSize: 8, color: ACCENT, bold: true } },
      { text: `${p.vialSize}\n${p.reconstitution}`, options: { fontSize: 7, color: TEAL } },
      { text: p.dose, options: { fontSize: 8, color: TEAL } },
      { text: p.frequency, options: { fontSize: 8, color: TEAL } },
      { text: p.duration, options: { fontSize: 8, color: TEAL } },
      { text: p.purpose, options: { fontSize: 7, color: "8A95B0" } },
    ]);
  });

  slide.addTable(tableRows, {
    x: 0.3, y: 1.0, w: 9.4,
    colW: [1.5, 1.8, 1.2, 1.2, 1.0, 2.7],
    border: { pt: 0.5, color: "1A2440" },
    fill: { color: CARD_BG },
    autoPage: false,
  });
}

function slideOralPeptides(pres: PptxPresentation, protocol: HealingProtocol) {
  const slide = addSanitizedSlide(pres);
  slide.background = { color: LIGHT_GRAY };

  slide.addText("Therapeutics: Oral Peptides", {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 24, fontFace: HEADER_FONT, color: PRIMARY, bold: true, margin: 0,
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
    fontSize: 22, fontFace: HEADER_FONT, color: PRIMARY, bold: true, margin: 0,
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
    { text: `${b.name}`, options: { bold: true, color: SECONDARY, fontSize: 12, breakLine: false } },
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
    fontSize: 24, fontFace: HEADER_FONT, color: PRIMARY, bold: true, margin: 0,
  });

  let y = 1.0;

  if (protocol.ivTherapies?.length) {
    slide.addText("IV Therapies:", {
      x: 0.5, y, w: 9, h: 0.3,
      fontSize: 13, fontFace: BODY_FONT, color: SECONDARY, bold: true,
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
      fontSize: 13, fontFace: BODY_FONT, color: SECONDARY, bold: true,
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
    fontSize: 24, fontFace: HEADER_FONT, color: PRIMARY, bold: true, margin: 0,
  });

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.0, w: 9, h: 4.2,
    fill: { color: WHITE }, shadow: makeShadow(),
  });

  const prots = protocol.parasiteAntiviralProtocols || [];
  const items = prots.slice(0, 8).map((p, i) => ([
    { text: p.name, options: { bold: true, color: SECONDARY, fontSize: 12, breakLine: false } },
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


function slideECS(pres: PptxPresentation, protocol: HealingProtocol) {
  const sectionSlide = addSanitizedSlide(pres);
  sectionSlide.background = { color: DARK_BG };
  sectionSlide.addText("ECS PROTOCOL", {
    x: 0, y: 1.8, w: 10, h: 0.8,
    fontSize: 36, fontFace: HEADER_FONT, color: WHITE, align: "center", bold: true,
  });
  sectionSlide.addText("Endocannabinoid System Optimization — Suppositories, Tinctures & Targeted Ratios", {
    x: 1, y: 2.6, w: 8, h: 0.6,
    fontSize: 14, fontFace: BODY_FONT, color: ACCENT, align: "center",
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
  sectionSlide.background = { color: DARK_BG };
  sectionSlide.addText("MITOCHONDRIAL & SIRTUIN SUPPORT", {
    x: 0, y: 1.8, w: 10, h: 0.8,
    fontSize: 32, fontFace: HEADER_FONT, color: WHITE, align: "center", bold: true,
  });
  sectionSlide.addText("NAD+, GlyNAC, MitoSTAC Complex, Methylation, Cellular Energy Restoration", {
    x: 1, y: 2.6, w: 8, h: 0.6,
    fontSize: 14, fontFace: BODY_FONT, color: ACCENT, align: "center",
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

  const allPeptides = [
    ...(protocol.injectablePeptides || []),
    ...(protocol.oralPeptides || []),
    ...(protocol.bioregulators || []),
  ];

  const checks: Array<{ section: typeof REFERENCE_SLIDE_ORDER[number]; present: boolean }> = [
    { section: "cover", present: true },
    { section: "about-pma", present: true },
    { section: "protocol-overview", present: true },
    { section: "philosophy", present: true },
    { section: "5rs-phases", present: true },
    { section: "diagnostic-framework", present: true },
    { section: "program-structure", present: true },
    { section: "intake-personal", present: true },
    { section: "intake-health-history", present: true },
    { section: "intake-symptoms-goals", present: true },
    { section: "peptide-therapy-intro", present: true },
    { section: "peptides-immune", present: allPeptides.some((p: any) => /immun|ll-?37|thymo|kpv|antimicro/i.test(`${p.name} ${p.category || ''} ${p.mechanism || ''}`)) },
    { section: "peptides-cellular-cancer", present: allPeptides.some((p: any) => /cancer|tumor|pnc|foxo|p53|senol/i.test(`${p.name} ${p.category || ''} ${p.mechanism || ''}`)) },
    { section: "peptides-metabolic-hormonal", present: allPeptides.some((p: any) => /metabol|hormon|retatrutide|semaglutide|glp|weight|insulin/i.test(`${p.name} ${p.category || ''} ${p.mechanism || ''}`)) },
    { section: "peptides-longevity", present: allPeptides.some((p: any) => /longev|aging|epithalon|pinealon|telomer|bioregul/i.test(`${p.name} ${p.category || ''} ${p.mechanism || ''}`)) },
    { section: "hbot-therapy", present: true },
    { section: "hbot-systems", present: true },
    { section: "detox-iv-sequence", present: (protocol.detoxProtocols?.length || 0) > 0 || (protocol.ivTherapies?.length || 0) > 0 },
    { section: "home-protocols", present: true },
    { section: "dental-biological", present: true },
    { section: "dietary-protocol", present: !!protocol.dietaryProtocol?.phases?.length },
    { section: "advanced-modalities", present: true },
    { section: "mitostac-phase4", present: !!protocol.sirtuinStack },
    { section: "mito-pathway-map", present: true },
    { section: "cannabinoid-ligand-map", present: !!protocol.ecsProtocol },
    { section: "protocol-builder", present: true },
    { section: "daily-schedule", present: true },
    { section: "program-timeline", present: true },
    { section: "monitoring-followup", present: (protocol.followUpPlan?.length || 0) > 0 || (protocol.labsRequired?.length || 0) > 0 },
    { section: "ai-research-tool", present: true },
    { section: "research-links", present: true },
    { section: "library-resources", present: true },
    { section: "protocol-summary", present: true },
    { section: "closing", present: true },
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
