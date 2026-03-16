import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const OUTPUT_DIR = "/home/runner/workspace/attached_assets";
const LOGO_PATH = "/home/runner/workspace/artifacts/ffpma/src/assets/ff_pma_allio_combined_logo.png";

const NAVY = "#1B2A4A";
const NAVY_DARK = "#0F1D30";
const CYAN = "#00B4D8";
const GOLD = "#C9A84C";
const TEXT = "#2D3748";
const LIGHT_GRAY = "#EEF2F7";
const WHITE = "#FFFFFF";

function addHeader(doc: InstanceType<typeof PDFDocument>, title: string, subtitle: string) {
  if (fs.existsSync(LOGO_PATH)) {
    doc.image(LOGO_PATH, doc.page.width / 2 - 100, 30, { width: 200 });
    doc.moveDown(6);
  }
  doc.fontSize(24).fillColor(NAVY).font("Helvetica-Bold").text(title, { align: "center" });
  doc.fontSize(13).fillColor("#2A4F7A").font("Helvetica-Bold").text(subtitle, { align: "center" });
  doc.fontSize(8).fillColor("#8395A7").font("Helvetica")
    .text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} | FF PMA 5R Framework`, { align: "center" });
  doc.moveDown(1);
}

function addSectionTitle(doc: InstanceType<typeof PDFDocument>, title: string, color = NAVY) {
  doc.moveDown(0.5);
  doc.fontSize(13).fillColor(color).font("Helvetica-Bold").text(title);
  doc.moveTo(doc.x, doc.y).lineTo(doc.x + 200, doc.y).strokeColor(CYAN).lineWidth(1.5).stroke();
  doc.moveDown(0.3);
}

function drawTable(doc: InstanceType<typeof PDFDocument>, headers: string[], rows: string[][], colWidths: number[], headerColor = NAVY) {
  const startX = doc.x;
  const rowHeight = 18;
  let y = doc.y;

  const pageBottom = doc.page.height - doc.page.margins.bottom - 30;

  doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill(headerColor);
  let x = startX;
  for (let i = 0; i < headers.length; i++) {
    doc.fontSize(7.5).fillColor(WHITE).font("Helvetica-Bold").text(headers[i], x + 3, y + 4, { width: colWidths[i] - 6, height: rowHeight });
    x += colWidths[i];
  }
  y += rowHeight;

  for (let r = 0; r < rows.length; r++) {
    if (y + rowHeight > pageBottom) {
      doc.addPage();
      y = doc.page.margins.top;
      addPageFooter(doc);
    }

    if (r % 2 === 1) {
      doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill(LIGHT_GRAY);
    }

    x = startX;
    for (let c = 0; c < rows[r].length; c++) {
      const isFirst = c === 0;
      doc.fontSize(7).fillColor(isFirst ? NAVY : TEXT).font(isFirst ? "Helvetica-Bold" : "Helvetica")
        .text(rows[r][c], x + 3, y + 4, { width: colWidths[c] - 6, height: rowHeight });
      x += colWidths[c];
    }
    y += rowHeight;
  }

  doc.x = startX;
  doc.y = y + 4;
}

function addPageFooter(doc: InstanceType<typeof PDFDocument>) {
  const bottom = doc.page.height - 18;
  doc.rect(0, bottom, doc.page.width, 18).fill(NAVY);
  doc.fontSize(6).fillColor("#B0B8C8").font("Helvetica")
    .text("www.ffpma.com", doc.page.margins.left, bottom + 5, { continued: false })
    .text("Confidential — Private Member Communication", doc.page.width / 2 - 80, bottom + 5);
}

function generateFullProtocol() {
  const filePath = path.join(OUTPUT_DIR, "Kathryn_Smith_Full_Protocol.pdf");
  const doc = new PDFDocument({ size: "letter", margins: { top: 40, bottom: 40, left: 45, right: 45 } });
  doc.pipe(fs.createWriteStream(filePath));

  addHeader(doc, "KATHRYN SMITH", "90-Day Root Cause Healing Protocol");
  addPageFooter(doc);

  doc.fontSize(9).fillColor(CYAN).font("Helvetica-Bold")
    .text("Remove • Restore • Replenish • Regenerate • Rebalance", { align: "center" });
  doc.moveDown(0.5);

  addSectionTitle(doc, "EXECUTIVE SUMMARY");
  doc.fontSize(9).fillColor(TEXT).font("Helvetica")
    .text("Comprehensive 90-day healing protocol addressing recurrent ER+/PR+/HER2+ breast cancer through the Forgotten Formula PMA 5R Framework. This protocol identifies and addresses six root causes spanning environmental toxicity, childhood trauma, nutritional deficiency, heavy metal poisoning, pathogenic burden, and cellular dysfunction.", { align: "justify" });
  doc.moveDown(0.4);

  addSectionTitle(doc, "PRACTITIONER NOTES");
  doc.fontSize(8.5).fillColor("#4A5568").font("Helvetica-Oblique")
    .text("After meeting with Kathryn and understanding her story, her life, and her responsibilities as a mother and grandmother of 14, I feel strongly that this is something we can address. Kathryn's case exemplifies the lifetime accumulation of health insults — from childhood mold exposure that damaged her respiratory system, to devastating trauma that triggered early puberty and lifelong estrogen dominance, to critical mineral depletion that disabled her body's natural cancer defenses. The mercury amalgam still in her mouth has been slowly poisoning her immune system for 50 years. Her first cancer was treated with surgery alone — the root causes were never touched. That's why it came back. We will not make that mistake.", { align: "justify" });
  doc.moveDown(0.5);

  addSectionTitle(doc, "ROOT CAUSE ANALYSIS");
  drawTable(doc,
    ["#", "Root Cause", "Category", "Details"],
    [
      ["1", "Childhood Mold Exposure (Ages 6-13)", "Environmental", "Chronic mold from bedroom roof leak. Mycotoxin burden."],
      ["2", "Sexual Abuse → Estrogen Dominance", "Trauma/Hormonal", "Extreme trauma → cortisol → early puberty → ER+/PR+ cancer."],
      ["3", "Critical Mineral Deficiencies", "Nutritional", "Copper → p53/p21 dysfunction. Iodine → breast vulnerability."],
      ["4", "Mercury Toxicity (Amalgam Present)", "Heavy Metal", "50 years continuous mercury vapor from amalgam filling."],
      ["5", "Viral & Parasite Load", "Pathogenic", "Suppresses p53/p21 cancer suppressors."],
      ["6", "Gut/Mitochondrial Dysfunction", "Cellular", "Tetracycline damage + standard diet → gut integrity loss."],
    ],
    [20, 150, 70, 270]
  );

  addSectionTitle(doc, "TREATMENT PHASES");
  drawTable(doc,
    ["Phase", "Timeline", "Focus", "Key Actions"],
    [
      ["1. Foundation & Detox", "Weeks 1-4", "Supplement foundation, detox", "FF Detox IV (Wk 1), then M/W Vit C + F Ozone, parasite protocols, detox baths, HBOT"],
      ["2. Targeted Therapy", "Weeks 5-8", "Hormones, cancer peptides", "Post-amalgam chelation, FOXO4-DRI, ECS rotation, stem cell consult, RGCC, liver cleanse"],
      ["3. Regeneration", "Weeks 9-12", "Oral peptides, regeneration", "Oral peptide transition, 5-day fast, MitoStac, labs/imaging reassessment"],
      ["4. Maintenance", "Ongoing", "Sustain gains", "Quarterly labs, core supplements, monthly HBOT, annual RGCC"],
    ],
    [100, 65, 120, 230]
  );

  doc.addPage();
  addPageFooter(doc);

  addSectionTitle(doc, "INJECTABLE PEPTIDES");
  drawTable(doc,
    ["Peptide", "Vial", "Reconstitution", "Dose", "Frequency", "Duration", "Purpose"],
    [
      ["LL-37", "5mg", "1mL BAC water", "4-8 units", "Daily", "6 weeks", "Antimicrobial — pathogen elimination"],
      ["PNC-27", "10mg", "1mL BAC water", "20 units", "Daily", "6 weeks", "Cancer cell targeting — p53 activation"],
      ["Thymogen", "20mg", "2mL BAC water", "20 units", "M/W/F", "4 weeks", "Thymic immune reconstitution"],
      ["Epithalon+Pinealon", "45mg", "2mL BAC water", "10-20 units", "Daily", "30 days", "Telomere protection, pineal restoration"],
      ["FOXO4-DRI", "10mg", "2mL BAC water", "5mg wkly", "Weekly", "4 wks (Ph2)", "Senolytic — clears zombie cells"],
      ["KGlow-25", "25mg", "2mL BAC water", "10-20 units", "M/W/F", "90 days", "Tissue regeneration, collagen"],
      ["Gonadorelin", "2mg", "1mL BAC water", "20 units", "M/W/F", "8 weeks", "Hormonal axis optimization"],
    ],
    [68, 35, 65, 50, 48, 50, 195]
  );

  addSectionTitle(doc, "PCC BIOREGULATORS");
  drawTable(doc,
    ["Bioregulator", "Target Organ", "Dose", "Frequency", "Duration"],
    [
      ["Thymus PCC", "Thymus", "1 capsule", "Daily (AM)", "90 days"],
      ["Mammary PCC", "Mammary/Breast", "1 capsule", "2x daily (AM+PM)", "90 days"],
      ["Liver PCC", "Liver", "1 capsule", "Daily (AM)", "90 days"],
      ["Ovary PCC", "Ovary", "1 capsule", "Daily (AM)", "90 days"],
      ["Pineal PCC", "Pineal Gland", "1 capsule", "Daily (PM)", "90 days"],
    ],
    [80, 90, 65, 100, 60]
  );

  addSectionTitle(doc, "SUPPLEMENTS");
  drawTable(doc,
    ["Supplement", "Dose", "Timing", "Purpose"],
    [
      ["Nascent Iodine", "3 drops", "AM empty stomach", "Breast tissue protection"],
      ["Copper", "2mg", "Morning", "p53/p21 gene restoration"],
      ["Selenium", "200mcg", "AM+PM split", "Antioxidant defense"],
      ["Liposomal Vitamin C", "2000mg", "Morning", "Immune + antioxidant"],
      ["D3-K2", "10,000IU", "Morning", "Immune modulation"],
      ["Curcumin+", "1000mg", "Midday", "Anti-inflammatory"],
      ["Turkey Tail", "1000mg", "Midday", "Immune activation"],
      ["B17", "500mg", "Midday", "Cancer cell targeting"],
      ["MitoStac", "Per label", "Bedtime", "Mitochondrial activation"],
      ["Mighty Blue", "Per label", "Midday", "Mitochondrial support"],
      ["Zeolite", "Per label", "Bedtime", "Heavy metal chelation"],
      ["Trace Minerals", "1 serving", "Evening", "Cellular function"],
    ],
    [100, 65, 90, 260]
  );

  doc.addPage();
  addPageFooter(doc);

  addSectionTitle(doc, "PARASITE / ANTIVIRAL PROTOCOLS");
  drawTable(doc,
    ["Agent", "Dose", "Schedule", "Duration", "Purpose"],
    [
      ["Fenbendazole", "222mg", "3 days on, 4 off", "12 weeks", "Anti-parasitic + anti-cancer"],
      ["Ivermectin", "12mg", "2x/week", "12 weeks", "Broad-spectrum anti-parasitic"],
      ["Nitazoxanide", "500mg", "2x/day", "Weeks 1-4", "Anti-protozoal"],
      ["Blushwood Berry", "Per label", "Daily bedtime", "12 weeks", "Tumor necrosis compound"],
    ],
    [85, 55, 90, 65, 220]
  );

  addSectionTitle(doc, "IV / IM THERAPIES");
  drawTable(doc,
    ["Therapy", "Frequency", "Duration", "Purpose"],
    [
      ["FF Detox IV (Full Sequence)", "1x (Wk 1)", "Week 1 only", "EDTA Chelation + Myers' Cocktail + Glutathione + ALA + DMSO + Lipo-B"],
      ["IV Vitamin C (High Dose)", "Mon/Wed", "Wks 2-12", "Pro-oxidant cancer cell destruction"],
      ["Ozonated Glycerin IV", "Friday", "Wks 2-12", "Immune activation, pathogen elimination"],
      ["NAD+ IM", "1x/week", "Ongoing", "Mitochondrial restoration"],
      ["LipoB IM", "1x/week", "Ongoing", "Fat metabolism, liver support"],
    ],
    [130, 65, 70, 250]
  );

  addSectionTitle(doc, "DETOX PROTOCOLS");
  drawTable(doc,
    ["Protocol", "Method", "Frequency", "Instructions"],
    [
      ["FF Detox Bath", "Immersion", "3x/week", "Baking soda + Clay + Epsom salt + lavender. 30-45 min."],
      ["Liver & Gallbladder Cleanse", "Oral protocol", "Once (Wk 6-7)", "Apple juice prep, olive oil + grapefruit juice flush."],
      ["5-Day Fast", "Water/broth", "Once (Wks 9-10)", "Physician-supervised autophagy protocol."],
      ["Ozone Oil Pulling", "Oral swish", "Daily AM", "Ozonated oil, 20 min. Addresses oral pathogens."],
      ["Clay Detox (Internal)", "Oral", "Daily", "Bentonite clay binds mycotoxins in GI tract."],
    ],
    [110, 65, 80, 260]
  );

  addSectionTitle(doc, "LIFESTYLE & DIETARY RECOMMENDATIONS");
  const lifestyle = [
    "ZERO sugar — cancer cells consume 18x more glucose (Warburg effect)",
    "ZERO GMO foods — glyphosate damages gut and endocrine system",
    "ZERO alcohol for 90 days — liver must focus on estrogen metabolism",
    "Organic only — reduce toxic burden",
    "Cruciferous vegetables DAILY — DIM for estrogen metabolism",
    "Wild-caught fish 3x/week — omega-3 anti-inflammatory",
    "URGENT: Amalgam removal (SMART protocol biodentist)",
    "Weekly counseling or EMDR for childhood trauma",
    "EMF reduction — phone airplane mode at night, no WiFi in bedroom",
  ];
  for (const item of lifestyle) {
    doc.fontSize(8.5).fillColor(TEXT).font("Helvetica").text(`▸ ${item}`, { indent: 10 });
  }

  doc.moveDown(0.5);
  addSectionTitle(doc, "REQUIRED LABS");
  const labs = ["CBC with differential", "Comprehensive Metabolic Panel",
    "Hormone Panel (Estradiol, Progesterone, Testosterone, DHEA-S, Cortisol)",
    "Thyroid Panel (TSH, Free T3/T4, Reverse T3, antibodies)",
    "Copper/Zinc Ratio", "Iodine Loading Test", "Heavy Metals Panel",
    "Mycotoxin Panel", "Inflammatory Markers (hs-CRP, ESR, IL-6)",
    "G6PD (before IV Vitamin C)", "RGCC Test", "GI-MAP Stool Analysis"];
  for (const lab of labs) {
    doc.fontSize(8.5).fillColor(TEXT).font("Helvetica").text(`▸ ${lab}`, { indent: 10 });
  }

  doc.moveDown(0.5);
  addSectionTitle(doc, "FOLLOW-UP SCHEDULE");
  drawTable(doc,
    ["Week", "Action", "Details"],
    [
      ["Week 2", "Phone check-in", "Assess tolerance and compliance"],
      ["Week 4", "Lab work + assessment", "CBC, hormones, minerals, inflammatory markers"],
      ["Week 6", "Liver & Gallbladder Cleanse", "Supervised cleanse protocol"],
      ["Week 8", "Comprehensive reassessment", "Repeat labs, imaging, protocol adjustment"],
      ["Week 10", "5-Day Fast", "Supervised autophagy protocol"],
      ["Week 12", "90-day completion", "Full assessment, Phase 4 planning"],
    ],
    [55, 140, 320]
  );

  doc.moveDown(1);
  doc.fontSize(7).fillColor("#8395A7").font("Helvetica")
    .text("Forgotten Formula PMA • www.ffpma.com • www.forgottenformula.com", { align: "center" })
    .text("For licensed practitioners. Individualize per patient response and safety.", { align: "center" })
    .text("This document is a private member-to-member communication protected under the 1st and 14th Amendments.", { align: "center" });

  doc.end();
  console.log(`Full Protocol PDF: ${filePath}`);
  return filePath;
}

function generateDailySchedule() {
  const filePath = path.join(OUTPUT_DIR, "Kathryn_Smith_Daily_Schedule.pdf");
  const doc = new PDFDocument({ size: "letter", margins: { top: 40, bottom: 40, left: 45, right: 45 } });
  doc.pipe(fs.createWriteStream(filePath));

  addHeader(doc, "KATHRYN SMITH", "90-Day Healing Protocol — Daily Schedule");
  addPageFooter(doc);

  const sections: [string, string, string[][]][] = [
    ["MORNING PROTOCOL", "#059669", [
      ["6:00 AM", "Warm Lemon Water + Nascent Iodine (3 drops)", "Empty stomach, wait 20 min", "Daily"],
      ["6:30 AM", "Morning Supplements", "Multivitamin, Liposomal C, D3-K2, Selenium, Copper, Astaxanthin", "Daily"],
      ["6:45 AM", "PCC Bioregulators (AM)", "Thymus + Mammary + Liver + Ovary PCC", "Daily"],
      ["7:00 AM", "Injectable Peptides (AM)", "LL-37 + PNC-27", "Daily"],
      ["7:30 AM", "Breakfast", "Anti-inflammatory: organic eggs, turmeric, greens, avocado", "Daily"],
      ["8:00 AM", "Reds + Greens + Elixir", "Mix in 12oz filtered water", "Daily"],
      ["8:30 AM", "Nebulization", "Saline + peroxide + iodine, 15 min", "M/W/F"],
    ]],
    ["MIDDAY PROTOCOL", "#2563EB", [
      ["12:00 PM", "Lunch", "Salad with wild fish/organic poultry, cruciferous vegetables", "Daily"],
      ["12:30 PM", "Midday Supplements", "Curcumin+, Turkey Tail, Goldenseal, B17, Mighty Blue", "Daily"],
      ["1:00 PM", "Parasite/Antiviral Protocol", "Fenbendazole + Ivermectin + Nitazoxanide per schedule", "Per sched"],
      ["2:00 PM", "HBOT Session", "2.0 ATA x 60 minutes", "M/W/F"],
    ]],
    ["EVENING PROTOCOL", "#D97706", [
      ["5:00 PM", "Injectable Peptides (PM)", "Thymogen M/W/F + Epithalon/Pinealon daily", "Per sched"],
      ["5:30 PM", "Dinner", "Organic protein, steamed vegetables, anti-inflammatory spices", "Daily"],
      ["6:00 PM", "Evening Supplements", "Trace Minerals, Flaxseed Oil, C60 Oil, Probiotics, Selenium", "Daily"],
      ["6:30 PM", "PCC Bioregulators (PM)", "Pineal PCC + Mammary PCC", "Daily"],
      ["7:00 PM", "Detox Bath", "Baking soda + Clay + Epsom salt + lavender, 30-45 min", "3x/week"],
    ]],
    ["BEDTIME PROTOCOL", "#7C3AED", [
      ["8:30 PM", "Zeolite Clinoptilolite", "Heavy metal binding (mercury detox)", "Daily"],
      ["8:45 PM", "ECS Suppository", "CBD/CBG rotation", "Nightly"],
      ["9:00 PM", "MitoStac", "Mitochondrial activation complex", "Daily"],
      ["9:15 PM", "Mental/Trauma Work", "Affirmations, journaling, trauma processing", "Daily"],
      ["9:30 PM", "Blushwood Berry Extract", "Anti-tumor support", "Daily"],
    ]],
  ];

  for (const [title, color, items] of sections) {
    addSectionTitle(doc, title, color);
    drawTable(doc,
      ["Time", "Item", "Details", "Freq"],
      items,
      [55, 140, 240, 55],
      color
    );
  }

  doc.moveDown(0.5);
  doc.fontSize(8.5).fillColor(NAVY).font("Helvetica-Bold")
    .text("DIETARY GUIDELINES: ZERO sugar, ZERO GMO, ZERO alcohol for 90 days. Organic only. Cruciferous vegetables daily. Wild-caught fish 3x/week. No processed foods, no seed oils.");

  doc.moveDown(0.5);
  doc.fontSize(7).fillColor("#8395A7").font("Helvetica")
    .text("Forgotten Formula PMA • www.ffpma.com • www.forgottenformula.com", { align: "center" })
    .text("For licensed practitioners trained in integrative protocols.", { align: "center" });

  doc.end();
  console.log(`Daily Schedule PDF: ${filePath}`);
  return filePath;
}

function generatePeptideSchedule() {
  const filePath = path.join(OUTPUT_DIR, "Kathryn_Smith_Peptide_Schedule.pdf");
  const doc = new PDFDocument({ size: "letter", margins: { top: 40, bottom: 40, left: 45, right: 45 } });
  doc.pipe(fs.createWriteStream(filePath));

  addHeader(doc, "KATHRYN SMITH", "Injectable Peptide & Bioregulator Schedule");
  addPageFooter(doc);

  addSectionTitle(doc, "INJECTABLE PEPTIDES");
  drawTable(doc,
    ["Peptide", "Vial", "Reconstitution", "Dose", "Frequency", "Duration", "Purpose"],
    [
      ["LL-37", "5mg", "1mL BAC water", "4-8 units", "Daily", "6 weeks", "Antimicrobial — pathogen elimination"],
      ["PNC-27", "10mg", "1mL BAC water", "20 units", "Daily", "6 weeks", "Cancer cell targeting — p53"],
      ["Thymogen", "20mg", "2mL BAC water", "20 units", "M/W/F", "4 weeks", "Thymic immune reconstitution"],
      ["Epithalon+Pinealon", "45mg", "2mL BAC water", "10-20 u", "Daily", "30 days", "Telomere/pineal restoration"],
      ["FOXO4-DRI", "10mg", "2mL BAC water", "5mg wk", "Weekly", "4 wks", "Senolytic — zombie cells"],
      ["KGlow-25", "25mg", "2mL BAC water", "10-20 u", "M/W/F", "90 days", "Tissue regen, collagen"],
      ["Gonadorelin", "2mg", "1mL BAC water", "20 units", "M/W/F", "8 weeks", "Hormonal axis optimization"],
    ],
    [68, 35, 68, 48, 48, 46, 198]
  );

  addSectionTitle(doc, "PCC BIOREGULATORS", "#059669");
  drawTable(doc,
    ["Bioregulator", "Target Organ", "Dose", "Frequency", "Duration"],
    [
      ["Thymus PCC", "Thymus", "1 capsule", "Daily (AM)", "90 days"],
      ["Mammary PCC", "Mammary/Breast", "1 capsule", "2x daily", "90 days"],
      ["Liver PCC", "Liver", "1 capsule", "Daily (AM)", "90 days"],
      ["Ovary PCC", "Ovary", "1 capsule", "Daily (AM)", "90 days"],
      ["Pineal PCC", "Pineal Gland", "1 capsule", "Daily (PM)", "90 days"],
    ],
    [80, 90, 65, 100, 60],
    "#059669"
  );

  addSectionTitle(doc, "ORAL PEPTIDES (Weeks 7-12 Transition)", "#7C3AED");
  drawTable(doc,
    ["Peptide", "Dose", "Frequency", "Duration", "Purpose"],
    [
      ["Thymogen Alpha-1", "1 cap", "Daily", "Wks 7-12", "Immune modulation continuation"],
      ["TB-Frag Max", "1 cap", "Daily", "Wks 7-12", "Tissue repair"],
      ["GutFeeling", "1 cap", "2x daily", "Wks 7-12", "Gut barrier restoration"],
      ["Pineal Pep", "1 cap", "Bedtime", "Wks 7-12", "Pineal/melatonin support"],
      ["5-Amino-1MQ", "1 cap", "Daily", "Wks 7-12", "Metabolic optimization"],
      ["Dihexa", "1 cap", "Daily", "Wks 7-12", "Cognitive support"],
    ],
    [95, 45, 60, 60, 250],
    "#7C3AED"
  );

  addSectionTitle(doc, "PARASITE / ANTIVIRAL PROTOCOLS", "#DC2626");
  drawTable(doc,
    ["Agent", "Dose", "Schedule", "Duration", "Purpose"],
    [
      ["Fenbendazole", "222mg", "3 days on, 4 off", "12 weeks", "Anti-parasitic + anti-cancer"],
      ["Ivermectin", "12mg", "2x/week", "12 weeks", "Broad-spectrum anti-parasitic"],
      ["Nitazoxanide", "500mg", "2x/day", "Weeks 1-4", "Anti-protozoal"],
      ["Blushwood Berry", "Per label", "Daily bedtime", "12 weeks", "Tumor necrosis compound"],
    ],
    [85, 55, 90, 65, 220],
    "#DC2626"
  );

  addSectionTitle(doc, "IV / IM THERAPIES", "#D97706");
  drawTable(doc,
    ["Therapy", "Frequency", "Duration", "Purpose"],
    [
      ["FF Detox IV (Full Sequence)", "1x (Wk 1)", "Week 1 only", "EDTA + Myers' + Glutathione + ALA + DMSO + Lipo-B"],
      ["IV Vitamin C (High Dose)", "Mon/Wed", "Wks 2-12", "Pro-oxidant cancer cell destruction"],
      ["Ozonated Glycerin IV", "Friday", "Wks 2-12", "Immune activation, pathogen elimination"],
      ["NAD+ IM", "1x/week", "Ongoing", "Mitochondrial restoration"],
      ["LipoB IM", "1x/week", "Ongoing", "Fat metabolism, liver support"],
    ],
    [130, 65, 70, 250],
    "#D97706"
  );

  doc.moveDown(0.8);
  doc.fontSize(8.5).fillColor("#4A5568").font("Helvetica")
    .text("RECONSTITUTION NOTES: All peptides reconstituted with Bacteriostatic (BAC) Water. Store reconstituted vials refrigerated. Use insulin syringes for SubQ injections. Rotate injection sites (abdomen, thigh). Allow vial to reach room temperature before injection.");

  doc.moveDown(0.5);
  doc.fontSize(7).fillColor("#8395A7").font("Helvetica")
    .text("Forgotten Formula PMA • www.ffpma.com • www.forgottenformula.com", { align: "center" })
    .text("For licensed practitioners trained in integrative protocols.", { align: "center" });

  doc.end();
  console.log(`Peptide Schedule PDF: ${filePath}`);
  return filePath;
}

generateFullProtocol();
generateDailySchedule();
generatePeptideSchedule();
console.log("\nAll 3 PDFs generated successfully!");
