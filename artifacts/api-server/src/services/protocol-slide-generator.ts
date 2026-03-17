import { getUncachableSlidesClient } from './slides';
import { findAllioFolder, createSubfolder, findFolderByName, getUncachableGoogleDriveClient } from './drive';
import { sanitizePmaLanguage } from '@shared/pma-language';

const FFPMA_COLORS = {
  deepBlue: { red: 0.102, green: 0.212, blue: 0.365 },
  teal: { red: 0.051, green: 0.580, blue: 0.533 },
  cyan: { red: 0.024, green: 0.714, blue: 0.831 },
  gold: { red: 0.961, green: 0.620, blue: 0.043 },
  white: { red: 1, green: 1, blue: 1 },
  lightGray: { red: 0.95, green: 0.95, blue: 0.97 },
  darkText: { red: 0.15, green: 0.15, blue: 0.2 },
  bodyText: { red: 0.25, green: 0.25, blue: 0.3 },
  subtleText: { red: 0.5, green: 0.5, blue: 0.55 },
};

const RESEARCH_LINKS: Record<string, { url: string; label: string }[]> = {
  'BPC-157': [
    { url: 'https://pubmed.ncbi.nlm.nih.gov/27847034/', label: 'PubMed: BPC-157 wound healing' },
    { url: 'https://pubmed.ncbi.nlm.nih.gov/30915550/', label: 'PubMed: BPC-157 GI protection' },
  ],
  'Epithalon': [
    { url: 'https://pubmed.ncbi.nlm.nih.gov/12851085/', label: 'PubMed: Epithalon telomerase activation' },
    { url: 'https://pubmed.ncbi.nlm.nih.gov/14523363/', label: 'PubMed: Epithalon anti-aging' },
  ],
  'TB-500': [
    { url: 'https://pubmed.ncbi.nlm.nih.gov/20587038/', label: 'PubMed: TB-500 tissue repair' },
  ],
  'Mercury Amalgam': [
    { url: 'https://pubmed.ncbi.nlm.nih.gov/16079072/', label: 'PubMed: Mercury amalgam health effects' },
    { url: 'https://pubmed.ncbi.nlm.nih.gov/27188709/', label: 'PubMed: Mercury toxicity review' },
  ],
  'NAD+': [
    { url: 'https://pubmed.ncbi.nlm.nih.gov/29514064/', label: 'PubMed: NAD+ and aging' },
    { url: 'https://pubmed.ncbi.nlm.nih.gov/30457958/', label: 'PubMed: NMN research review' },
  ],
  'ECS Cannabinoid': [
    { url: 'https://pubmed.ncbi.nlm.nih.gov/17369778/', label: 'PubMed: ECS and cancer' },
    { url: 'https://pubmed.ncbi.nlm.nih.gov/22625422/', label: 'PubMed: Cannabinoids immunomodulation' },
  ],
  'Fenbendazole': [
    { url: 'https://pubmed.ncbi.nlm.nih.gov/29891643/', label: 'PubMed: Fenbendazole anti-cancer' },
  ],
  'Vitamin C IV': [
    { url: 'https://pubmed.ncbi.nlm.nih.gov/28353481/', label: 'PubMed: High-dose IV Vitamin C cancer' },
  ],
  'Peptide Suppliers': [
    { url: 'https://www.peptidesciences.com/', label: 'Peptide Sciences' },
    { url: 'https://www.tailor-made-compounding.com/', label: 'Tailor Made Compounding' },
  ],
  'Supplement Suppliers': [
    { url: 'https://www.thecandidadiet.com/', label: 'The Candida Diet (TheCandidaDiet.com)' },
    { url: 'https://www.pureencapsulations.com/', label: 'Pure Encapsulations' },
    { url: 'https://www.designsforhealth.com/', label: 'Designs for Health' },
  ],
  'Mistletoe': [
    { url: 'https://pubmed.ncbi.nlm.nih.gov/23922235/', label: 'PubMed: Mistletoe therapy oncology' },
  ],
  'Glutathione': [
    { url: 'https://pubmed.ncbi.nlm.nih.gov/24672763/', label: 'PubMed: Glutathione and heavy metal detox' },
  ],
};

const PRODUCT_LINKS: Record<string, { url: string; label: string }> = {
  'TheCandidaDiet': { url: 'https://www.thecandidadiet.com', label: 'TheCandidaDiet.com' },
  'Supplements': { url: 'https://www.thecandidadiet.com/shop/', label: 'TheCandidaDiet Shop' },
  'FFPMA': { url: 'https://forgottenformulapma.com', label: 'FFPMA Website' },
};

interface SlideRequest {
  [key: string]: unknown;
}

export interface ProtocolSlideResult {
  presentationId: string;
  webViewLink: string;
  slideCount: number;
  driveFileId?: string;
}

export async function generateAnnetteGomerSlides(): Promise<ProtocolSlideResult> {
  const slides = await getUncachableSlidesClient();

  const createRes = await slides.presentations.create({
    requestBody: {
      title: 'Annette Gomer - Complete Healing Protocol | FF PMA Model',
      pageSize: {
        width: { magnitude: 720, unit: 'PT' },
        height: { magnitude: 405, unit: 'PT' },
      },
    },
  });

  const presentationId = createRes.data.presentationId!;
  const initialSlideId = createRes.data.slides?.[0]?.objectId;
  const requests: SlideRequest[] = [];
  let slideIndex = 0;

  function addSlide(): string {
    const slideId = `protocol_slide_${slideIndex}`;
    requests.push({
      createSlide: {
        objectId: slideId,
        insertionIndex: slideIndex,
        slideLayoutReference: { predefinedLayout: 'BLANK' },
      },
    });
    slideIndex++;
    return slideId;
  }

  function addBackground(slideId: string, color: { red: number; green: number; blue: number }) {
    requests.push({
      updatePageProperties: {
        objectId: slideId,
        pageProperties: {
          pageBackgroundFill: {
            solidFill: { color: { rgbColor: color } },
          },
        },
        fields: 'pageBackgroundFill.solidFill.color',
      },
    });
  }

  function addTextBox(
    slideId: string,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    fontSize: number = 14,
    bold: boolean = false,
    color?: { red: number; green: number; blue: number },
    fontFamily: string = 'Montserrat'
  ): string {
    const boxId = `${slideId}_tb_${requests.length}`;
    requests.push({
      createShape: {
        objectId: boxId,
        shapeType: 'TEXT_BOX',
        elementProperties: {
          pageObjectId: slideId,
          size: {
            width: { magnitude: w, unit: 'PT' },
            height: { magnitude: h, unit: 'PT' },
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: x,
            translateY: y,
            unit: 'PT',
          },
        },
      },
    });
    requests.push({
      insertText: { objectId: boxId, text: sanitizePmaLanguage(text) },
    });
    requests.push({
      updateTextStyle: {
        objectId: boxId,
        style: {
          fontSize: { magnitude: fontSize, unit: 'PT' },
          bold,
          fontFamily,
          ...(color ? { foregroundColor: { opaqueColor: { rgbColor: color } } } : {}),
        },
        textRange: { type: 'ALL' },
        fields: `fontSize,bold,fontFamily${color ? ',foregroundColor' : ''}`,
      },
    });
    return boxId;
  }

  function addAccentBar(slideId: string, x: number, y: number, w: number, h: number, color: { red: number; green: number; blue: number }) {
    const barId = `${slideId}_bar_${requests.length}`;
    requests.push({
      createShape: {
        objectId: barId,
        shapeType: 'RECTANGLE',
        elementProperties: {
          pageObjectId: slideId,
          size: {
            width: { magnitude: w, unit: 'PT' },
            height: { magnitude: h, unit: 'PT' },
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: x,
            translateY: y,
            unit: 'PT',
          },
        },
      },
    });
    requests.push({
      updateShapeProperties: {
        objectId: barId,
        shapeProperties: {
          shapeBackgroundFill: {
            solidFill: { color: { rgbColor: color } },
          },
          outline: { outlineFill: { solidFill: { color: { rgbColor: color } } }, weight: { magnitude: 0.5, unit: 'PT' } },
        },
        fields: 'shapeBackgroundFill.solidFill.color,outline',
      },
    });
  }

  function buildSectionSlide(title: string, subtitle: string, bgColor: { red: number; green: number; blue: number }, textColor: { red: number; green: number; blue: number }) {
    const sid = addSlide();
    addBackground(sid, bgColor);
    addAccentBar(sid, 0, 0, 720, 6, FFPMA_COLORS.gold);
    addAccentBar(sid, 0, 399, 720, 6, FFPMA_COLORS.gold);
    addTextBox(sid, title, 40, 130, 640, 60, 36, true, textColor, 'Montserrat');
    addTextBox(sid, subtitle, 40, 200, 640, 40, 16, false, { ...textColor, red: textColor.red * 0.8, green: textColor.green * 0.8, blue: textColor.blue * 0.8 }, 'Open Sans');
    addTextBox(sid, 'FORGOTTEN FORMULA PMA', 40, 360, 300, 20, 10, true, FFPMA_COLORS.gold, 'Montserrat');
    return sid;
  }

  function addClickableLink(boxId: string, linkLabel: string, url: string, startIndex: number) {
    requests.push({
      updateTextStyle: {
        objectId: boxId,
        style: {
          link: { url },
          foregroundColor: { opaqueColor: { rgbColor: FFPMA_COLORS.teal } },
          underline: true,
        },
        textRange: {
          type: 'FIXED_RANGE',
          startIndex,
          endIndex: startIndex + linkLabel.length,
        },
        fields: 'link,foregroundColor,underline',
      },
    });
  }

  function buildContentSlide(title: string, content: string, links?: { url: string; label: string }[]) {
    const sid = addSlide();
    addBackground(sid, FFPMA_COLORS.white);
    addAccentBar(sid, 0, 0, 720, 4, FFPMA_COLORS.deepBlue);
    addAccentBar(sid, 0, 0, 4, 405, FFPMA_COLORS.teal);
    addTextBox(sid, title, 30, 12, 660, 35, 20, true, FFPMA_COLORS.deepBlue, 'Montserrat');
    addAccentBar(sid, 30, 48, 200, 2, FFPMA_COLORS.gold);
    addTextBox(sid, content, 30, 58, 660, 310, 10, false, FFPMA_COLORS.bodyText, 'Open Sans');

    if (links && links.length > 0) {
      const linksText = links.map(l => l.label).join('  |  ');
      const linksBoxId = addTextBox(sid, linksText, 30, 375, 660, 20, 7, false, FFPMA_COLORS.teal, 'Open Sans');

      let currentIndex = 0;
      for (const link of links) {
        addClickableLink(linksBoxId, link.label, link.url, currentIndex);
        currentIndex += link.label.length + 5;
      }
    }

    addTextBox(sid, 'FF PMA | Annette Gomer Protocol', 500, 390, 200, 15, 7, false, FFPMA_COLORS.subtleText, 'Open Sans');
    return sid;
  }

  // ═══════════════════════════════════════════
  // SLIDE 1: Title Slide
  // ═══════════════════════════════════════════
  const titleSlide = addSlide();
  addBackground(titleSlide, FFPMA_COLORS.deepBlue);
  addAccentBar(titleSlide, 0, 0, 720, 8, FFPMA_COLORS.gold);
  addAccentBar(titleSlide, 0, 397, 720, 8, FFPMA_COLORS.gold);
  addTextBox(titleSlide, 'ANNETTE GOMER', 40, 80, 640, 50, 40, true, FFPMA_COLORS.white, 'Montserrat');
  addTextBox(titleSlide, 'Complete Healing Protocol', 40, 140, 640, 40, 24, false, FFPMA_COLORS.cyan, 'Montserrat');
  addTextBox(titleSlide, 'FF PMA Model — The 5 Rs of Forgotten Formula', 40, 185, 640, 30, 14, false, FFPMA_COLORS.gold, 'Open Sans');
  addTextBox(titleSlide, 'Prepared by: FFPMA Wellness Team\nDate: March 9, 2026\nMember DOB: September 7, 1950 (Age 75)', 40, 240, 400, 60, 11, false, FFPMA_COLORS.lightGray, 'Open Sans');
  addTextBox(titleSlide, 'FORGOTTEN FORMULA PMA\n"Before you heal someone, ask them if they\'re willing to give up the things that make them sick." — Hippocrates', 40, 330, 640, 40, 9, false, FFPMA_COLORS.subtleText, 'Open Sans');

  // ═══════════════════════════════════════════
  // SLIDE 2: Member Overview
  // ═══════════════════════════════════════════
  buildContentSlide(
    'MEMBER OVERVIEW',
    [
      'Member: Annette Gomer  |  Age: 75  |  DOB: September 7, 1950',
      '',
      'PRIMARY CONDITIONS:',
      '• Graves Disease + Hashimoto\'s Thyroiditis (thyroid autoimmune)',
      '• Metastatic Adenocarcinoma of Unknown Primary (2007 — residual tumor remains)',
      '• History of Melanoma (2007 — removed)',
      '• Hiatal Hernia (managed with Omeprazole since 2009)',
      '',
      'ROOT CAUSE HYPOTHESIS:',
      '7-9 Silver Amalgam Fillings (Mercury Toxicity) — Present ~60+ years',
      '',
      'Mechanism: Chronic mercury exposure → immune dysregulation → autoimmune thyroid + cancer + systemic inflammation → compromised gut/gallbladder/appendix removal compounding absorption issues.',
      '',
      'SECONDARY FACTORS:',
      '• Appendix removal (1967) → Microbiome dysregulation',
      '• Gallbladder removal (2007) → Fat/nutrient malabsorption',
      '• Hysterectomy (2002, no HRT) → Hormone disruption',
      '• Omeprazole (2009-present) → Blocks mineral absorption',
      '• Divorce trauma (1995) → 5 years chronic stress → Immune suppression',
      '• Bilateral knee replacements (2013) → Potential metal sensitivity',
      '',
      'GOAL: Remove root cause (amalgam), restore immune function, eliminate cancer burden, heal thyroid, restore gut health, optimize detoxification.',
      'TIMELINE: 12-18 months comprehensive protocol with follow-up every 4-6 weeks.',
    ].join('\n'),
    RESEARCH_LINKS['Mercury Amalgam']
  );

  // ═══════════════════════════════════════════
  // SLIDE 3: Medical Timeline
  // ═══════════════════════════════════════════
  buildContentSlide(
    'HEALTH TIMELINE',
    [
      '1950s-1970s: 7-9 Silver Amalgam fillings placed — chronic mercury exposure begins',
      '1967: Appendix removed → Microbiome dysregulation begins',
      '1995: Divorce → 5 years chronic stress → HPA axis dysregulation, immune suppression',
      '2002: Hysterectomy (no HRT started) → Hormone cascade disruption',
      '2007: Gallbladder removed → Fat/nutrient malabsorption',
      '2007: Melanoma identified and removed',
      '2007: Metastatic Adenocarcinoma of Unknown Primary identified (residual tumor remains)',
      '2009: Omeprazole started for hiatal hernia → Blocks mineral absorption, increases infection risk',
      '2013: Bilateral knee replacements (titanium) → Potential metal sensitivity added',
      '2026: FFPMA protocol initiated — root cause approach begins',
      '',
      '═══ KEY INSIGHT ═══',
      'The 60+ years of continuous mercury exposure from amalgam fillings created a cascading toxicity pattern:',
      'Mercury → Immune dysregulation → Autoimmune thyroid → Cancer vulnerability → Organ removal cascade → Malabsorption → Chronic medication dependence',
      '',
      'This protocol addresses the ROOT CAUSE, not just symptoms.',
    ].join('\n')
  );

  // ═══════════════════════════════════════════
  // SLIDE 4: Section Divider — R1: REDUCE
  // ═══════════════════════════════════════════
  buildSectionSlide(
    'R1: REDUCE',
    'Detoxification & Pathogen Elimination — Mercury Chelation, Parasite Elimination, Cancer Support',
    FFPMA_COLORS.deepBlue,
    FFPMA_COLORS.white
  );

  // ═══════════════════════════════════════════
  // SLIDE 5: R1 Detail — Mercury Chelation
  // ═══════════════════════════════════════════
  buildContentSlide(
    'R1: REDUCE — Mercury Chelation & Amalgam Removal',
    [
      'PHASE 1: Pre-Amalgam Removal Support (Weeks 1-4)',
      'Mercury Binders (START IMMEDIATELY):',
      '• Activated Charcoal: 1000mg, 2x daily (away from food/supplements)',
      '• Chlorella: 3-6g daily (divided doses)',
      '• Modified Citrus Pectin: 5g, 2x daily',
      '• Bentonite Clay: 1 tsp in water, 1x daily (evening)',
      '',
      'Glutathione Support:',
      '• NAC (N-Acetyl Cysteine): 600mg, 2x daily',
      '• Alpha Lipoic Acid: 300mg, 2x daily (with food)',
      '• Selenium: 200mcg daily (critical for thyroid + mercury detox)',
      '',
      'Liver Support:',
      '• Milk Thistle (Silymarin): 300mg, 2x daily',
      '• Dandelion Root: 500mg, 2x daily',
      '• Burdock Root: 500mg daily',
      '',
      'PHASE 2: Amalgam Removal (Week 5)',
      'Biological dentist — SMART protocol (Safe Mercury Amalgam Removal Technique)',
      'Location: Biodentist in Mexico (60% cheaper than US)',
      '• Full rubber dam isolation, high-volume suction, oxygen supply',
      '• IV Vitamin C (25-50g) during/after procedure',
      '',
      'PHASE 3: Post-Removal Chelation (Weeks 6-12)',
      '• DMSA: 500mg, 3x daily for 3 days, then 11 days off (3-6 month cycles)',
      '• Monitor kidney function monthly',
    ].join('\n'),
    [...(RESEARCH_LINKS['Mercury Amalgam'] || []), ...(RESEARCH_LINKS['Glutathione'] || [])]
  );

  // ═══════════════════════════════════════════
  // SLIDE 6: R1 Detail — Parasite & Cancer
  // ═══════════════════════════════════════════
  buildContentSlide(
    'R1: REDUCE — Parasite Elimination & Cancer Support',
    [
      'PARASITE & PATHOGEN ELIMINATION (Weeks 1-16):',
      'Anti-Parasitic Protocol (3-month cycles):',
      '• Ivermectin: 12-18mg daily (weight-based) for 5 days, repeat monthly',
      '• Fenbendazole: 222mg daily for 3 days, repeat weekly for 12 weeks',
      '• Black Walnut Hull: 500mg 2x daily  |  Wormwood: 300mg 2x daily  |  Clove: 500mg 2x daily',
      '',
      'Antiviral Support:',
      '• Monolaurin: 1200mg 3x daily  |  Lysine: 1000mg 3x daily (EBV, CMV)',
      '• Olive Leaf Extract: 500mg 2x daily  |  Cat\'s Claw: 500mg 2x daily',
      '',
      'Biofilm Disruptors:',
      '• Serrapeptase: 120,000 SPU, 2x daily (empty stomach)',
      '• Nattokinase: 2000 FU, 2x daily  |  EDTA suppositories: 2-3x weekly',
      '',
      'CANCER SUPPORT (Ongoing):',
      '• High-Dose Vitamin C IV: 50-100g IV, 2-3x weekly for 12 weeks → 1x weekly maintenance',
      '• Mistletoe Therapy (Iscador): 0.1-1mg SubQ, 3x weekly',
      '',
      'Metabolic Therapy:',
      '• Fenbendazole: (anti-parasitic + anti-cancer dual action)',
      '• Berberine: 500mg 3x daily  |  Curcumin (Liposomal): 1000mg 2x daily',
    ].join('\n'),
    [...(RESEARCH_LINKS['Fenbendazole'] || []), ...(RESEARCH_LINKS['Vitamin C IV'] || []), ...(RESEARCH_LINKS['Mistletoe'] || [])]
  );

  // ═══════════════════════════════════════════
  // SLIDE 7: R1 — Peptide Protocols
  // ═══════════════════════════════════════════
  buildContentSlide(
    'R1: REDUCE — Peptide Protocols',
    [
      'PEPTIDE PROTOCOLS FOR HEALING & IMMUNE SUPPORT:',
      '',
      '┌────────────────────────────────────────────────────────────────┐',
      '│ Thymosin Beta-4 (TB-500)                                      │',
      '│ Dose: 5-10mg, 2x weekly (subcutaneous)                        │',
      '│ Purpose: Immune modulation, tissue repair, anti-inflammatory   │',
      '│ Reconstitution: 5mg vial + 1mL BAC water = 5mg/mL             │',
      '└────────────────────────────────────────────────────────────────┘',
      '',
      '┌────────────────────────────────────────────────────────────────┐',
      '│ BPC-157                                                        │',
      '│ Dose: 250-500mcg, 2x daily (subcutaneous or oral)             │',
      '│ Purpose: Gut healing, systemic repair, angiogenesis support    │',
      '│ Reconstitution: 5mg vial + 1mL BAC water = 5mg/mL             │',
      '│ Loading: 500mcg 2x/day x 4 weeks → Maintenance: 250mcg daily  │',
      '└────────────────────────────────────────────────────────────────┘',
      '',
      '┌────────────────────────────────────────────────────────────────┐',
      '│ Epithalon                                                      │',
      '│ Dose: 10mg daily for 10 days (monthly cycles)                  │',
      '│ Purpose: Telomerase activation, anti-aging, immune support     │',
      '│ Reconstitution: 10mg vial + 1mL BAC water                      │',
      '└────────────────────────────────────────────────────────────────┘',
    ].join('\n'),
    [...(RESEARCH_LINKS['BPC-157'] || []), ...(RESEARCH_LINKS['Epithalon'] || []), ...(RESEARCH_LINKS['TB-500'] || []), ...(RESEARCH_LINKS['Peptide Suppliers'] || [])]
  );

  // ═══════════════════════════════════════════
  // SLIDE 8: Section Divider — R2: REBALANCE
  // ═══════════════════════════════════════════
  buildSectionSlide(
    'R2: REBALANCE',
    'Gut Microbiome Restoration — Omeprazole Taper, Probiotic Restoration, Gut Lining Repair',
    FFPMA_COLORS.teal,
    FFPMA_COLORS.white
  );

  // ═══════════════════════════════════════════
  // SLIDE 9: R2 Detail
  // ═══════════════════════════════════════════
  buildContentSlide(
    'R2: REBALANCE — Gut Microbiome Restoration',
    [
      'CHALLENGE: Appendix removed (1967), gallbladder removed (2007), chronic Omeprazole (2009-present)',
      '',
      'PHASE 1: Stop Omeprazole (Gradual Taper — Weeks 1-4)',
      '• Week 1-2: Reduce to 20mg daily  |  Week 3: 10mg daily  |  Week 4: Stop',
      'Replacement: DGL 400mg before meals | Slippery Elm 400mg 2x | Marshmallow Root 500mg 2x | Aloe Vera 2oz 2x',
      '',
      'PHASE 2: Probiotic Restoration (Ongoing)',
      '• Multi-strain Probiotic: 100+ billion CFU daily (Lactobacillus, Bifido, S. boulardii)',
      '• Soil-Based Organisms: Bacillus subtilis, B. coagulans',
      '• Prebiotics: Inulin 5-10g, FOS 3-5g, Resistant Starch 2-4 tbsp daily',
      '• Fermented Foods: Kefir, sauerkraut, kimchi, kombucha (start small)',
      '',
      'PHASE 3: Gut Lining Repair',
      '• BPC-157: 250-500mcg 2x daily (oral for GI focus)',
      '• KPV: 500mcg 2x daily (anti-inflammatory gut repair)',
      '• L-Glutamine: 5-10g 2x daily | Collagen Peptides: 10-20g daily',
      '• Zinc Carnosine: 75mg 2x daily',
      '',
      'DIGESTIVE ENZYME SUPPORT (Compensate for Gallbladder Loss):',
      '• Full-Spectrum Enzymes with each meal | Ox Bile: 500mg with fat-containing meals',
      '• Betaine HCl: 500mg with meals (if low stomach acid suspected)',
    ].join('\n')
  );

  // ═══════════════════════════════════════════
  // SLIDE 10: Section Divider — R3: REACTIVATE
  // ═══════════════════════════════════════════
  buildSectionSlide(
    'R3: REACTIVATE',
    'Endocannabinoid System (ECS) Optimization — Suppositories, Tinctures, Wellness Mappings',
    FFPMA_COLORS.deepBlue,
    FFPMA_COLORS.white
  );

  // ═══════════════════════════════════════════
  // SLIDE 11: R3 Detail
  // ═══════════════════════════════════════════
  buildContentSlide(
    'R3: REACTIVATE — ECS Protocols',
    [
      'GOAL: Restore ECS function for homeostasis — regulate immune, endocrine, digestive, nervous systems',
      '',
      'WHY CRITICAL FOR ANNETTE:',
      '• Cancer: Targeting AKT1 (PI3K-AKT pathway) and CASP9 (apoptosis induction)',
      '• Detox: Targeting GSTP1 for Phase II liver detoxification',
      '• Pain: Targeting GRIN2B (NMDA receptor) for knee replacement pain',
      '',
      'ECS SUPPOSITORIES (Primary Delivery — bypass liver, higher bioavailability):',
      'Daytime: CBD 25-50mg + CBG 10-25mg + CBN 5-10mg + DMSO 5-10% in cacao butter',
      'Nighttime: CBD 50-100mg + THC 10-25mg + CBN 10-20mg + DMSO 5-10% in cacao butter',
      '→ 1 suppository, 2x daily (morning + night)',
      '',
      'ELIXIR FOR EVERYTHING (Oral Tincture):',
      '12 Non-Psychoactive Cannabinoids: CBD, CBG, CBC, CBDV, CBN, THCV, CBDA, CBGA, CBCA, THCA, CBDVA, CBCVA',
      '→ 1-2 mL, 2x daily (sublingual, hold 60 seconds)',
      '',
      'TARGETED RATIOS:',
      '• Autoimmune (Graves + Hashimoto\'s): CBD:THC 20:1',
      '• Cancer (AKT1 & CASP9): THC:CBD 1:1 (high-dose THC for apoptosis)',
      '• Detox (GSTP1): CBD-dominant full spectrum',
      '• Pain/Inflammation (GRIN2B): CBD:THC 1:1 or 2:1',
    ].join('\n'),
    RESEARCH_LINKS['ECS Cannabinoid']
  );

  // ═══════════════════════════════════════════
  // SLIDE 12: Section Divider — R4: RESTORE
  // ═══════════════════════════════════════════
  buildSectionSlide(
    'R4: RESTORE',
    'Mitochondrial Function — Sirtuins, NAD+, Glutathione, Methylation Support',
    FFPMA_COLORS.teal,
    FFPMA_COLORS.white
  );

  // ═══════════════════════════════════════════
  // SLIDE 13: R4 Detail
  // ═══════════════════════════════════════════
  buildContentSlide(
    'R4: RESTORE — Mitochondrial Function',
    [
      'SIRTUINS ACTIVATION (Longevity Pathways — SIRT1-7):',
      'MitoSTAC Complex: Resveratrol 500mg | Pterostilbene 100mg | Quercetin 500mg 2x | Fisetin 100mg',
      '',
      'NAD+ PRECURSORS:',
      '• NMN: 500-1000mg daily (or NR: 300-600mg daily)',
      '• Boosts cellular energy, DNA repair, mitochondrial function',
      '',
      'GLUTATHIONE PRODUCTION (Master Antioxidant — critical for mercury detox):',
      '• GlyNAC Protocol: Glycine 2-3g 2x daily + NAC 600mg 2x daily',
      '• Liposomal Glutathione: 500mg daily (direct supplementation)',
      '',
      'MITOCHONDRIAL SUPPORT STACK:',
      '• CoQ10 (Ubiquinol): 200-400mg daily — electron transport chain, ATP',
      '• L-Carnitine: 1000-2000mg daily — fatty acid transport into mitochondria',
      '• PQQ: 20mg daily — mitochondrial biogenesis (new mitochondria)',
      '• D-Ribose: 5g 2x daily — ATP precursor',
      '',
      'METHYLATION SUPPORT:',
      '• TMG: 500-1000mg daily | Methylfolate 1000mcg | Methylcobalamin 1000-5000mcg',
      '',
      'TRACE MINERALS:',
      '• Magnesium (glycinate): 400-600mg | Zinc: 30-50mg + Copper 2-4mg | Manganese: 5-10mg | Molybdenum: 150-300mcg',
    ].join('\n'),
    RESEARCH_LINKS['NAD+']
  );

  // ═══════════════════════════════════════════
  // SLIDE 14: Section Divider — R5: REVITALIZE
  // ═══════════════════════════════════════════
  buildSectionSlide(
    'R5: REVITALIZE',
    'Mind, Body, Spirit, Emotions — Trauma Release, Frequencies, Movement, Community',
    FFPMA_COLORS.deepBlue,
    FFPMA_COLORS.white
  );

  // ═══════════════════════════════════════════
  // SLIDE 15: R5 Detail
  // ═══════════════════════════════════════════
  buildContentSlide(
    'R5: REVITALIZE — Mind, Body, Spirit',
    [
      'MENTAL/EMOTIONAL HEALING:',
      'Daily Affirmations (As Directed):',
      '  "Today\'s going to be a great day"  |  "My body heals quickly, easily, and completely"',
      '  "I am healthy, vibrant, and cancer-free"',
      '• Meditation: 10-20 minutes daily  |  Gratitude Journal: 3 things daily',
      '• Visualization: See yourself healthy, with great-grandchildren',
      '• Therapy/EMDR/EFT for trauma release (divorce, illness, mortality)',
      '',
      'FREQUENCY & LIGHT THERAPIES:',
      'Solfeggio Frequencies: 528 Hz (DNA repair) | 396 Hz (grounding) | 741 Hz (detox) — 20-30 min daily',
      'Chakra Focus: Throat (thyroid) + Heart (immune, emotional healing)',
      'Red Light/Infrared: 15-20 minutes daily — mitochondrial support, inflammation reduction',
      '',
      'BATH THERAPIES:',
      '• Epsom Salt Baths: 2 cups + 1 cup baking soda, 20 min, 2-3x weekly',
      '• Castor Oil Packs: Over liver/abdomen, 3x weekly — lymphatic drainage',
      '• Clay Baths: Bentonite/zeolite, 1 cup per bath — heavy metal binding',
      '',
      'MOVEMENT: Walking 20-30 min | Gentle Yoga | Tai Chi/Qigong | Rebounding 5-10 min',
      'LYMPHATIC: Professional massage 1-2x monthly | Dry brushing daily',
      '',
      'COMMUNITY: Join FFPMA community | Connect with daughters regularly',
      'GOAL: Be healthy enough to see great-grandchildren',
    ].join('\n')
  );

  // ═══════════════════════════════════════════
  // SLIDE 16: Dietary Protocol
  // ═══════════════════════════════════════════
  buildContentSlide(
    'DIETARY PROTOCOL',
    [
      'PHASE 1: Anti-Inflammatory, Detox-Supporting Diet',
      '',
      'ELIMINATE:',
      '✗ Processed foods, Sugar, Gluten, Dairy, Soy, Alcohol, Caffeine',
      '',
      'EMPHASIZE:',
      '✓ Organic vegetables (50% raw/50% cooked) — cruciferous, leafy greens, sulfur-rich',
      '✓ Wild-caught fish (salmon, sardines, mackerel) — omega-3, selenium',
      '✓ Grass-fed/pastured meats (moderate portions)',
      '✓ Healthy fats: Avocado, olive oil, coconut oil, ghee, MCT oil',
      '✓ Fermented foods (kefir, sauerkraut, kimchi)',
      '✓ Bone broth: 2-3 cups daily — gut healing, collagen, minerals',
      '',
      'PHASE 2: Thyroid-Specific Nutrition',
      '• Selenium 200mcg (converts T4→T3) | Iodine (careful) | Zinc 30-50mg',
      '• Vitamin D 5000-10,000 IU | B-Vitamins (methylated)',
      '',
      'PHASE 3: Cancer-Starving Diet (Modified Keto)',
      '• Low carb: 50-100g daily (vegetables only) | Moderate protein: 0.8-1g/lb',
      '• High healthy fat: 60-70% calories — forces cancer cells to metabolic crisis',
      '',
      'INTERMITTENT FASTING: 16:8 protocol (eat 12pm-8pm, fast 8pm-12pm)',
      '→ Autophagy, cellular cleanup, cancer suppression',
    ].join('\n'),
    [PRODUCT_LINKS['TheCandidaDiet']]
  );

  // ═══════════════════════════════════════════
  // SLIDE 17: Supplement Stack
  // ═══════════════════════════════════════════
  buildContentSlide(
    'SUPPLEMENT PROTOCOL — Dr. Wallach\'s 90 Essential Nutrients',
    [
      'FOUNDATION: 90 Essential Nutrients (90 for 90 Days)',
      'Critical given missing gallbladder + Omeprazole blocking absorption',
      '',
      'MINERALS (60):',
      '• Colloidal or plant-derived minerals (liquid form for absorption)',
      '• Key: Selenium, Zinc, Magnesium, Iodine + all trace minerals',
      '',
      'VITAMINS (16):',
      '• Full-spectrum multivitamin (methylated forms)',
      '• Extra: D3 5000-10,000 IU | K2 | C | E | B-complex',
      '',
      'AMINO ACIDS (12):',
      '• Complete protein or essential amino acid supplement',
      '',
      'FATTY ACIDS (2):',
      '• Omega-3 (EPA/DHA from fish oil or algae)',
      '',
      '═══ DAILY SUPPLEMENT TIMING ═══',
      'MORNING (with breakfast): Minerals, B-complex, D3+K2, Omega-3, Digestive enzymes + Ox Bile',
      'MIDDAY (with lunch): Curcumin, Berberine, Digestive enzymes + Ox Bile',
      'EVENING (with dinner): Magnesium glycinate, Zinc + Copper, Digestive enzymes + Ox Bile',
      'BEDTIME: Melatonin support, Probiotic (away from antibacterials)',
      '',
      'FASTING SUPPLEMENTS (empty stomach): Serrapeptase, Nattokinase, Activated Charcoal',
    ].join('\n'),
    [PRODUCT_LINKS['Supplements'], ...(RESEARCH_LINKS['Supplement Suppliers'] || [])]
  );

  // ═══════════════════════════════════════════
  // SLIDE 18: Daily Schedule
  // ═══════════════════════════════════════════
  buildContentSlide(
    'DAILY SCHEDULE',
    [
      '6:00 AM — WAKE & AFFIRM',
      '"Today\'s going to be a great day" | Meditation 10-20 min | Gratitude journal',
      '',
      '6:30 AM — FASTING SUPPLEMENTS',
      'Activated Charcoal 1000mg | Serrapeptase 120,000 SPU | Nattokinase 2000 FU',
      '',
      '7:00 AM — MOVEMENT',
      'Walking 20-30 min OR gentle yoga OR rebounding 5-10 min | Dry brushing before shower',
      '',
      '8:00 AM — FIRST MEAL + SUPPLEMENTS',
      'Anti-inflammatory breakfast | All AM supplements | Digestive enzymes + Ox Bile',
      'ECS Daytime Suppository | Elixir tincture 1mL sublingual',
      '',
      '12:00 PM — LUNCH + MIDDAY SUPPLEMENTS',
      'Bone broth + whole food meal | Curcumin, Berberine | Enzymes + Ox Bile',
      '',
      '3:00 PM — AFTERNOON THERAPIES',
      'Red Light/Infrared 15-20 min | Solfeggio frequencies | BPC-157 injection (if SubQ)',
      '',
      '6:00 PM — DINNER + EVENING SUPPLEMENTS',
      'Last meal before 8pm | Magnesium, Zinc | Enzymes + Ox Bile',
      '',
      '8:00 PM — EVENING PROTOCOL',
      'Detox bath (3x/week) OR castor oil pack (3x/week) | ECS Nighttime Suppository',
      '',
      '9:30 PM — BEDTIME: Probiotic | Elixir tincture | Peptide injections (TB-500, Epithalon)',
    ].join('\n')
  );

  // ═══════════════════════════════════════════
  // SLIDE 19: Monitoring & Costs
  // ═══════════════════════════════════════════
  buildContentSlide(
    'BLOOD WORK, MONITORING & COST OVERVIEW',
    [
      'BASELINE LABS (Before Protocol):',
      '• CBC with differential | CMP | Thyroid Panel (TSH, Free T3/T4, RT3, TPO, TG antibodies)',
      '• Cancer Markers: CEA, CA 19-9, CA 125 | Heavy Metals Panel (mercury, lead, arsenic, cadmium)',
      '• Vitamin D, B12, Folate, Ferritin, Iron Panel | Omega-3 Index | hsCRP',
      '',
      'FOLLOW-UP LABS (Every 4-6 Weeks):',
      '• Thyroid panel | Cancer markers | CMP (kidney/liver during chelation) | Heavy metals progress',
      '',
      'TIMELINE & MILESTONES:',
      'Weeks 1-4: Pre-amalgam prep, begin REDUCE, start probiotics',
      'Week 5: Amalgam removal in Mexico',
      'Weeks 6-12: Intensive chelation (DMSA cycles)',
      'Weeks 13-16: Complete first parasite elimination cycle',
      'Month 6-9: Maintenance phase | Month 12: Comprehensive re-evaluation',
      'Month 18: GOAL — Remission/stabilization',
      '',
      'COST OVERVIEW:',
      'Monthly: Supplements/Peptides/Cannabinoids $800-1200 | IV Vitamin C $300-500 | Probiotics $100-200 | Organic food $200-400',
      'One-Time: Amalgam removal (Mexico) $3000-5000 | Baseline bloodwork $500-1000',
      'Total First Year: $15,000-25,000 (includes amalgam removal)',
    ].join('\n')
  );

  // ═══════════════════════════════════════════
  // SLIDE 20: Closing Slide
  // ═══════════════════════════════════════════
  const closingSlide = addSlide();
  addBackground(closingSlide, FFPMA_COLORS.deepBlue);
  addAccentBar(closingSlide, 0, 0, 720, 8, FFPMA_COLORS.gold);
  addAccentBar(closingSlide, 0, 397, 720, 8, FFPMA_COLORS.gold);
  addTextBox(closingSlide, 'YOU ARE NOT YOUR CONDITION.', 40, 60, 640, 50, 28, true, FFPMA_COLORS.gold, 'Montserrat');
  addTextBox(closingSlide, [
    'Your body has an innate ability to heal when given the right conditions.',
    '',
    'This protocol removes obstacles (mercury), provides building blocks',
    '(nutrition, supplements), and activates healing mechanisms',
    '(ECS, mitochondria, detox pathways).',
    '',
    'The root cause — those amalgam fillings — has been poisoning your',
    'system for 60+ years. Removing them and chelating the mercury will',
    'lift a massive burden from your immune system, thyroid, and cellular function.',
  ].join('\n'), 40, 120, 640, 140, 12, false, FFPMA_COLORS.lightGray, 'Open Sans');
  addTextBox(closingSlide, 'YOUR GOAL: Be healthy enough to see your great-grandchildren.\nWE WILL ACHIEVE THIS.', 40, 270, 640, 40, 16, true, FFPMA_COLORS.cyan, 'Montserrat');
  addTextBox(closingSlide, 'Say it out loud every morning:\n"Today\'s going to be a great day."', 40, 320, 640, 40, 14, false, FFPMA_COLORS.white, 'Open Sans');
  addTextBox(closingSlide, 'FORGOTTEN FORMULA PMA  |  forgottenformulapma.com  |  Annette, you\'ve already committed. Now we heal.', 40, 375, 640, 20, 9, false, FFPMA_COLORS.subtleText, 'Open Sans');

  if (initialSlideId) {
    requests.push({ deleteObject: { objectId: initialSlideId } });
  }

  if (requests.length > 0) {
    await slides.presentations.batchUpdate({
      presentationId,
      requestBody: { requests },
    });
  }

  const webViewLink = `https://docs.google.com/presentation/d/${presentationId}/edit`;

  let driveFileId: string | undefined;
  try {
    const allioFolder = await findAllioFolder();
    if (allioFolder) {
      let protocolsFolder = await findFolderByName(allioFolder.id, 'Protocols');
      if (!protocolsFolder) {
        const created = await createSubfolder(allioFolder.id, 'Protocols');
        protocolsFolder = created.id;
      }
      const drive = await getUncachableGoogleDriveClient();
      await drive.files.update({
        fileId: presentationId,
        addParents: protocolsFolder,
        fields: 'id',
      });
      driveFileId = presentationId;
    }
  } catch (err) {
    console.error('[Protocol Slides] Failed to move to ALLIO folder:', err);
  }

  return {
    presentationId,
    webViewLink,
    slideCount: slideIndex,
    driveFileId,
  };
}

export async function generateKathrynSmithSlides(): Promise<ProtocolSlideResult> {
  const slides = await getUncachableSlidesClient();

  const createRes = await slides.presentations.create({
    requestBody: {
      title: 'Kathryn Smith - Complete Healing Protocol | FF PMA Model',
      pageSize: {
        width: { magnitude: 720, unit: 'PT' },
        height: { magnitude: 405, unit: 'PT' },
      },
    },
  });

  const presentationId = createRes.data.presentationId!;
  const initialSlideId = createRes.data.slides?.[0]?.objectId;
  const requests: SlideRequest[] = [];
  let slideIndex = 0;

  function addSlide(): string {
    const slideId = `ks_slide_${slideIndex}`;
    requests.push({
      createSlide: {
        objectId: slideId,
        insertionIndex: slideIndex,
        slideLayoutReference: { predefinedLayout: 'BLANK' },
      },
    });
    slideIndex++;
    return slideId;
  }

  function addBackground(slideId: string, color: { red: number; green: number; blue: number }) {
    requests.push({
      updatePageProperties: {
        objectId: slideId,
        pageProperties: {
          pageBackgroundFill: {
            solidFill: { color: { rgbColor: color } },
          },
        },
        fields: 'pageBackgroundFill.solidFill.color',
      },
    });
  }

  function addTextBox(
    slideId: string,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    fontSize: number = 14,
    bold: boolean = false,
    color?: { red: number; green: number; blue: number },
    fontFamily: string = 'Montserrat'
  ): string {
    const boxId = `${slideId}_tb_${requests.length}`;
    requests.push({
      createShape: {
        objectId: boxId,
        shapeType: 'TEXT_BOX',
        elementProperties: {
          pageObjectId: slideId,
          size: {
            width: { magnitude: w, unit: 'PT' },
            height: { magnitude: h, unit: 'PT' },
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: x,
            translateY: y,
            unit: 'PT',
          },
        },
      },
    });
    requests.push({
      insertText: { objectId: boxId, text: sanitizePmaLanguage(text) },
    });
    requests.push({
      updateTextStyle: {
        objectId: boxId,
        style: {
          fontSize: { magnitude: fontSize, unit: 'PT' },
          bold,
          fontFamily,
          ...(color ? { foregroundColor: { opaqueColor: { rgbColor: color } } } : {}),
        },
        textRange: { type: 'ALL' },
        fields: `fontSize,bold,fontFamily${color ? ',foregroundColor' : ''}`,
      },
    });
    return boxId;
  }

  function addAccentBar(slideId: string, x: number, y: number, w: number, h: number, color: { red: number; green: number; blue: number }) {
    const barId = `${slideId}_bar_${requests.length}`;
    requests.push({
      createShape: {
        objectId: barId,
        shapeType: 'RECTANGLE',
        elementProperties: {
          pageObjectId: slideId,
          size: {
            width: { magnitude: w, unit: 'PT' },
            height: { magnitude: h, unit: 'PT' },
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: x,
            translateY: y,
            unit: 'PT',
          },
        },
      },
    });
    requests.push({
      updateShapeProperties: {
        objectId: barId,
        shapeProperties: {
          shapeBackgroundFill: {
            solidFill: { color: { rgbColor: color } },
          },
          outline: { outlineFill: { solidFill: { color: { rgbColor: color } } }, weight: { magnitude: 0.5, unit: 'PT' } },
        },
        fields: 'shapeBackgroundFill.solidFill.color,outline',
      },
    });
  }

  function buildSectionSlide(title: string, subtitle: string, bgColor: { red: number; green: number; blue: number }, textColor: { red: number; green: number; blue: number }) {
    const sid = addSlide();
    addBackground(sid, bgColor);
    addAccentBar(sid, 0, 0, 720, 6, FFPMA_COLORS.gold);
    addAccentBar(sid, 0, 399, 720, 6, FFPMA_COLORS.gold);
    addTextBox(sid, title, 40, 130, 640, 60, 36, true, textColor, 'Montserrat');
    addTextBox(sid, subtitle, 40, 200, 640, 40, 16, false, { ...textColor, red: textColor.red * 0.8, green: textColor.green * 0.8, blue: textColor.blue * 0.8 }, 'Open Sans');
    addTextBox(sid, 'FORGOTTEN FORMULA PMA', 40, 360, 300, 20, 10, true, FFPMA_COLORS.gold, 'Montserrat');
    return sid;
  }

  function addClickableLink(boxId: string, linkLabel: string, url: string, startIndex: number) {
    requests.push({
      updateTextStyle: {
        objectId: boxId,
        style: {
          link: { url },
          foregroundColor: { opaqueColor: { rgbColor: FFPMA_COLORS.teal } },
          underline: true,
        },
        textRange: {
          type: 'FIXED_RANGE',
          startIndex,
          endIndex: startIndex + linkLabel.length,
        },
        fields: 'link,foregroundColor,underline',
      },
    });
  }

  function buildContentSlide(title: string, content: string, links?: { url: string; label: string }[]) {
    const sid = addSlide();
    addBackground(sid, FFPMA_COLORS.white);
    addAccentBar(sid, 0, 0, 720, 4, FFPMA_COLORS.deepBlue);
    addAccentBar(sid, 0, 0, 4, 405, FFPMA_COLORS.teal);
    addTextBox(sid, title, 30, 12, 660, 35, 20, true, FFPMA_COLORS.deepBlue, 'Montserrat');
    addAccentBar(sid, 30, 48, 200, 2, FFPMA_COLORS.gold);
    addTextBox(sid, content, 30, 58, 660, 310, 10, false, FFPMA_COLORS.bodyText, 'Open Sans');

    if (links && links.length > 0) {
      const linksText = links.map(l => l.label).join('  |  ');
      const linksBoxId = addTextBox(sid, linksText, 30, 375, 660, 20, 7, false, FFPMA_COLORS.teal, 'Open Sans');

      let currentIndex = 0;
      for (const link of links) {
        addClickableLink(linksBoxId, link.label, link.url, currentIndex);
        currentIndex += link.label.length + 5;
      }
    }

    addTextBox(sid, 'FF PMA | Kathryn Smith Protocol', 500, 390, 200, 15, 7, false, FFPMA_COLORS.subtleText, 'Open Sans');
    return sid;
  }

  const titleSlide = addSlide();
  addBackground(titleSlide, FFPMA_COLORS.deepBlue);
  addAccentBar(titleSlide, 0, 0, 720, 8, FFPMA_COLORS.gold);
  addAccentBar(titleSlide, 0, 397, 720, 8, FFPMA_COLORS.gold);
  addTextBox(titleSlide, 'KATHRYN SMITH', 40, 80, 640, 50, 40, true, FFPMA_COLORS.white, 'Montserrat');
  addTextBox(titleSlide, 'Complete Healing Protocol', 40, 140, 640, 40, 24, false, FFPMA_COLORS.cyan, 'Montserrat');
  addTextBox(titleSlide, 'FF PMA Model — Breast Cancer (Second Occurrence) — Root Cause Approach', 40, 185, 640, 30, 14, false, FFPMA_COLORS.gold, 'Open Sans');
  addTextBox(titleSlide, 'Prepared by: FFPMA Wellness Team\nDate: March 13, 2026\nMember DOB: ~1951 (Age 75)', 40, 240, 400, 60, 11, false, FFPMA_COLORS.lightGray, 'Open Sans');
  addTextBox(titleSlide, 'FORGOTTEN FORMULA PMA\n"Before you heal someone, ask them if they\'re willing to give up the things that make them sick." — Hippocrates', 40, 330, 640, 40, 9, false, FFPMA_COLORS.subtleText, 'Open Sans');

  buildContentSlide(
    'MEMBER OVERVIEW',
    [
      'Member: Kathryn Smith  |  Age: 75  |  Married 42 years  |  6 Children  |  14 Grandchildren',
      '',
      'PRIMARY CONDITION:',
      '• Breast Cancer — Second Occurrence (Feb 2026)',
      '  - First occurrence ~2018: Lumpectomy, right breast (no root cause addressed)',
      '  - Second occurrence Feb 2026: Right breast + right armpit lymph node involvement',
      '  - ER+, PR+, HER2+ (aggressive markers)',
      '',
      'ROOT CAUSE HYPOTHESIS:',
      'Lifetime accumulation of insults — mold exposure, childhood trauma, mineral depletion, mercury amalgam, hormone disruption — created cascading immune dysfunction leading to cancer.',
      '',
      'CONTRIBUTING FACTORS:',
      '• Childhood mold exposure (ages 6-13) → chronic respiratory damage, mycotoxin burden',
      '• Sexual abuse trauma (ages 6-10) → early puberty at age 10, hormone disruption',
      '• Mercury amalgam filling (teenage years, still present) → immune suppression',
      '• Severe mineral deficiencies (copper, iodine, selenium) → p53/p21 gene dysfunction',
      '• Chronic cough, eczema, hay fever, nervous bladder → systemic inflammation markers',
      '',
      'GOAL: Address root causes, restore immune function, eliminate cancer burden, optimize detoxification.',
      'TIMELINE: 12-18 months comprehensive protocol with follow-up every 4-6 weeks.',
    ].join('\n'),
    RESEARCH_LINKS['Mercury Amalgam']
  );

  buildContentSlide(
    'HEALTH TIMELINE',
    [
      'BIRTH & EARLY CHILDHOOD:',
      '• Natural birth (not breastfed) — born San Diego, CA (father in Navy)',
      '• Age 1: Heart murmur identified → Age 14 months: Surgery to close hole in heart (successful)',
      '• Chickenpox (very young)',
      '',
      'CRITICAL PERIOD (Ages 6-13):',
      '• Chronic mold exposure — bedroom roof leaked → respiratory infections in both sisters',
      '• Given tetracycline as child → permanent gray teeth',
      '• Sexual abuse by uncle (ages 6-10) — not disclosed until age 32',
      '• Early puberty at age 10 (trauma → cortisol → estradiol/testosterone disruption)',
      '• Age 13: Family moved to new house (mold exposure resolved)',
      '',
      'ADOLESCENCE & YOUNG ADULTHOOD:',
      '• One amalgam filling placed (mercury exposure begins) + braces',
      '• "Nervous bladder" (stress-triggered urinary urgency — persists today)',
      '• Attended TCU, married at age 23, six children',
      '',
      'ADULT HEALTH:',
      '• Chronic conditions: Eczema, hay fever, chronic cough, mucus production',
      '• Solid gray hair (indicator of severe copper deficiency)',
      '• Gallbladder & appendix still intact',
      '',
      'CANCER HISTORY:',
      '• ~2018: First breast cancer — lumpectomy, right breast (no root cause protocol)',
      '• Feb 18, 2026: Biopsy → Feb 24: Assessment (ER+, PR+, HER2+)',
      '• Feb 26, 2026: Consultation with Michael Blake / Forgotten Formula PMA',
      '• Lymph node involvement (right armpit) — indicates potential spread',
    ].join('\n')
  );

  buildContentSlide(
    'ROOT CAUSE ANALYSIS',
    [
      '═══ 6 PRIMARY ROOT CAUSES ═══',
      '',
      '1. CHRONIC MOLD EXPOSURE (Childhood, Ages 6-13)',
      '   • Early respiratory damage, mycotoxin burden',
      '   • Fungus → pleomorphic bacterial shift',
      '   • Ongoing sensitivity: mucus production, chronic cough',
      '',
      '2. SEXUAL ABUSE TRAUMA (Ages 6-10)',
      '   • Extreme cortisol imbalance → early puberty (age 10)',
      '   • Disrupted estrogen/testosterone production pathways',
      '   • Disclosure delayed 22 years → prolonged psychological burden',
      '   • Estrogen dominance → breast cancer vulnerability',
      '',
      '3. MINERAL DEFICIENCIES (Critical)',
      '   • Copper deficiency (SEVERE) — solid gray hair, p53/p21 gene dysfunction',
      '   • Iodine deficiency — breast tissue health compromised',
      '   • Selenium deficiency — antioxidant protection, thyroid function',
      '   • 90 nutrients needed daily; 60 must be supplemented',
      '',
      '4. HEAVY METAL TOXICITY',
      '   • Mercury amalgam filling (1 from teenage years — STILL PRESENT)',
      '   • Chronic low-level mercury exposure → immune suppression',
      '',
      '5. VIRAL & PARASITE LOAD',
      '   • Suppresses cancer suppression genes (p53, p21)',
      '   • Cell pathogen colonies present',
      '',
      '6. GUT / MITOCHONDRIAL DYSFUNCTION',
      '   • Chronic inflammation cascade',
      '   • Damaged cellular energy production',
      '',
      '═══ KEY INSIGHT ═══',
      'Mold → Trauma → Mineral depletion → Mercury → Hormone disruption → First cancer (2018, untreated root cause) → Recurrence (2026)',
    ].join('\n')
  );

  buildSectionSlide(
    'R1: REDUCE',
    'Detoxification & Pathogen Elimination — Mercury Chelation, Mold Detox, Parasite Clearance, Cancer Support',
    FFPMA_COLORS.deepBlue,
    FFPMA_COLORS.white
  );

  buildContentSlide(
    'R1: REDUCE — Mercury Chelation & Amalgam Removal',
    [
      'PHASE 1: Pre-Amalgam Removal Support (Weeks 1-4)',
      'Mercury Binders (START IMMEDIATELY):',
      '• Activated Charcoal: 1000mg, 2x daily (away from food/supplements)',
      '• Chlorella: 3-6g daily (divided doses)',
      '• Modified Citrus Pectin: 5g, 2x daily',
      '• Bentonite Clay: 1 tsp in water, 1x daily (evening)',
      '',
      'Glutathione Support:',
      '• NAC (N-Acetyl Cysteine): 600mg, 2x daily',
      '• Alpha Lipoic Acid: 300mg, 2x daily (with food)',
      '• Selenium: 200mcg daily (critical for breast tissue + mercury detox)',
      '',
      'Liver Support:',
      '• Milk Thistle (Silymarin): 300mg, 2x daily',
      '• Dandelion Root: 500mg, 2x daily',
      '• Burdock Root: 500mg daily',
      '',
      'PHASE 2: Amalgam Removal (Week 5)',
      'Biological dentist — SMART protocol (Safe Mercury Amalgam Removal Technique)',
      '• Full rubber dam isolation, high-volume suction, oxygen supply',
      '• IV Vitamin C (25-50g) during/after procedure',
      '• Only 1 amalgam filling to remove (faster procedure)',
      '',
      'PHASE 3: Post-Removal Chelation (Weeks 6-12)',
      '• DMSA: 500mg, 3x daily for 3 days, then 11 days off (3-6 month cycles)',
      '• Monitor kidney function monthly',
    ].join('\n'),
    [...(RESEARCH_LINKS['Mercury Amalgam'] || []), ...(RESEARCH_LINKS['Glutathione'] || [])]
  );

  buildContentSlide(
    'R1: REDUCE — Mold Detox & Mycotoxin Clearance',
    [
      'CRITICAL: Kathryn had years of chronic mold exposure (ages 6-13) with lasting effects.',
      'Ongoing symptoms: chronic cough, mucus production, hay fever — indicate mycotoxin burden.',
      '',
      'MYCOTOXIN BINDERS (Weeks 1-12):',
      '• Activated Charcoal: 1000mg, 2x daily (away from food)',
      '• Bentonite Clay: 1 tsp in water daily',
      '• Cholestyramine: As suggested (detox binder)',
      '• Modified Citrus Pectin: 5g, 2x daily',
      '',
      'ANTIFUNGAL SUPPORT:',
      '• Oregano Oil: 200mg, 2x daily (enteric-coated)',
      '• Caprylic Acid: 600mg, 3x daily',
      '• Pau D\'Arco: 500mg, 2x daily',
      '• Grapefruit Seed Extract: 250mg, 2x daily',
      '',
      'RESPIRATORY SUPPORT (addressing chronic cough):',
      '• NAC: 600mg, 2x daily (mucolytic — breaks up mucus)',
      '• Quercetin: 500mg, 2x daily (antihistamine, anti-inflammatory)',
      '• Bromelain: 500mg, 2x daily (reduces mucus, anti-inflammatory)',
      '• Nebulized glutathione: 3x weekly (direct lung support)',
      '',
      'ENVIRONMENT:',
      '• Test current home for mold (ERMI testing)',
      '• HEPA air purifier in bedroom',
      '• Nasal rinse with colloidal silver or Xlear 2x daily',
    ].join('\n')
  );

  buildContentSlide(
    'R1: REDUCE — Parasite Elimination & Cancer Support',
    [
      'PARASITE & PATHOGEN ELIMINATION (Weeks 1-16):',
      'Anti-Parasitic Protocol (3-month cycles):',
      '• Ivermectin: 12-18mg daily (weight-based) for 5 days, repeat monthly',
      '• Fenbendazole: 222mg daily for 3 days, repeat weekly for 12 weeks',
      '• Black Walnut Hull: 500mg 2x daily  |  Wormwood: 300mg 2x daily  |  Clove: 500mg 2x daily',
      '',
      'Antiviral Support:',
      '• Monolaurin: 1200mg 3x daily  |  Lysine: 1000mg 3x daily (EBV, CMV)',
      '• Olive Leaf Extract: 500mg 2x daily  |  Cat\'s Claw: 500mg 2x daily',
      '',
      'Biofilm Disruptors:',
      '• Serrapeptase: 120,000 SPU, 2x daily (empty stomach)',
      '• Nattokinase: 2000 FU, 2x daily  |  EDTA suppositories: 2-3x weekly',
      '',
      'CANCER SUPPORT (Ongoing — ER+, PR+, HER2+):',
      '• High-Dose Vitamin C IV: 50-100g IV, 2-3x weekly for 12 weeks → 1x weekly maintenance',
      '• Mistletoe Therapy (Iscador): 0.1-1mg SubQ, 3x weekly',
      '• RGCC Testing: Personalized cancer vaccine development (scheduled)',
      '',
      'Metabolic Therapy:',
      '• Fenbendazole: (anti-parasitic + anti-cancer dual action)',
      '• Berberine: 500mg 3x daily  |  Curcumin (Liposomal): 1000mg 2x daily',
      '• DIM (Diindolylmethane): 200mg daily (estrogen metabolism — critical for ER+ cancer)',
      '• Calcium D-Glucarate: 500mg 2x daily (estrogen clearance)',
    ].join('\n'),
    [...(RESEARCH_LINKS['Fenbendazole'] || []), ...(RESEARCH_LINKS['Vitamin C IV'] || []), ...(RESEARCH_LINKS['Mistletoe'] || [])]
  );

  buildContentSlide(
    'R1: REDUCE — Peptide Protocols',
    [
      'PEPTIDE PROTOCOLS FOR HEALING & IMMUNE SUPPORT:',
      '',
      '┌────────────────────────────────────────────────────────────────┐',
      '│ Thymosin Beta-4 (TB-500)                                      │',
      '│ Dose: 5-10mg, 2x weekly (subcutaneous)                        │',
      '│ Purpose: Immune modulation, tissue repair, anti-inflammatory   │',
      '│ Reconstitution: 5mg vial + 1mL BAC water = 5mg/mL             │',
      '└────────────────────────────────────────────────────────────────┘',
      '',
      '┌────────────────────────────────────────────────────────────────┐',
      '│ BPC-157                                                        │',
      '│ Dose: 250-500mcg, 2x daily (subcutaneous or oral)             │',
      '│ Purpose: Gut healing, systemic repair, angiogenesis support    │',
      '│ Reconstitution: 5mg vial + 1mL BAC water = 5mg/mL             │',
      '│ Loading: 500mcg 2x/day x 4 weeks → Maintenance: 250mcg daily  │',
      '└────────────────────────────────────────────────────────────────┘',
      '',
      '┌────────────────────────────────────────────────────────────────┐',
      '│ Epithalon                                                      │',
      '│ Dose: 10mg daily for 10 days (monthly cycles)                  │',
      '│ Purpose: Telomerase activation, anti-aging, immune support     │',
      '│ Reconstitution: 10mg vial + 1mL BAC water                      │',
      '└────────────────────────────────────────────────────────────────┘',
      '',
      '┌────────────────────────────────────────────────────────────────┐',
      '│ Thymosin Alpha 1                                               │',
      '│ Dose: 1.6mg SubQ, 2-3x weekly                                 │',
      '│ Purpose: Immune system activation (critical for cancer)        │',
      '└────────────────────────────────────────────────────────────────┘',
    ].join('\n'),
    [...(RESEARCH_LINKS['BPC-157'] || []), ...(RESEARCH_LINKS['Epithalon'] || []), ...(RESEARCH_LINKS['TB-500'] || []), ...(RESEARCH_LINKS['Peptide Suppliers'] || [])]
  );

  buildSectionSlide(
    'R2: REBALANCE',
    'Gut Microbiome & Hormone Restoration — Gut Repair, Estrogen Metabolism, Mineral Repletion',
    FFPMA_COLORS.teal,
    FFPMA_COLORS.white
  );

  buildContentSlide(
    'R2: REBALANCE — Gut & Hormone Restoration',
    [
      'GUT MICROBIOME RESTORATION:',
      'Note: Gallbladder & appendix are INTACT (advantage over many members)',
      '',
      'Probiotic Restoration:',
      '• Multi-strain Probiotic: 100+ billion CFU daily (Lactobacillus, Bifido, S. boulardii)',
      '• Soil-Based Organisms: Bacillus subtilis, B. coagulans',
      '• Prebiotics: Inulin 5-10g, FOS 3-5g, Resistant Starch 2-4 tbsp daily',
      '• Fermented Foods: Kefir, sauerkraut, kimchi, kombucha (start small)',
      '',
      'Gut Lining Repair:',
      '• BPC-157: 250-500mcg 2x daily (oral for GI focus)',
      '• L-Glutamine: 5-10g 2x daily | Collagen Peptides: 10-20g daily',
      '• Zinc Carnosine: 75mg 2x daily',
      '',
      'HORMONE REBALANCING (Critical for ER+/PR+ Cancer):',
      '• DIM: 200mg daily — shifts estrogen to protective 2-OH pathway',
      '• Calcium D-Glucarate: 500mg 2x daily — blocks beta-glucuronidase, clears estrogen',
      '• Sulforaphane: 50mg daily (broccoli sprout extract) — Phase II detox',
      '• Iodine: 12.5-50mg daily (Lugol\'s/Iodoral) — breast tissue health',
      '',
      'MINERAL REPLETION (Addressing Severe Deficiencies):',
      '• Copper: 2-4mg daily (critical — p53/p21 gene function, gray hair reversal)',
      '• Selenium: 200mcg daily (thyroid, antioxidant, breast cancer protective)',
      '• Iodine: As above (breast tissue, thyroid)',
      '• Zinc: 30-50mg daily (balanced with copper)',
    ].join('\n')
  );

  buildSectionSlide(
    'R3: REACTIVATE',
    'Endocannabinoid System — ECS Suppositories, Targeted Cannabinoid Ratios, Full-Spectrum Support',
    FFPMA_COLORS.deepBlue,
    FFPMA_COLORS.white
  );

  buildContentSlide(
    'R3: REACTIVATE — ECS Protocols',
    [
      'GOAL: Restore ECS function for homeostasis — regulate immune, endocrine, and cellular repair systems',
      '',
      'WHY CRITICAL FOR KATHRYN:',
      '• Cancer (ER+/PR+/HER2+): Targeting AKT1 (PI3K-AKT pathway) and CASP9 (apoptosis)',
      '• Hormone Disruption: ECS modulates estrogen receptor signaling',
      '• Mold/Inflammation: ECS anti-inflammatory & immune regulation',
      '• Trauma: ECS regulates cortisol/stress response',
      '',
      'ECS SUPPOSITORIES (Primary Delivery — bypass liver, higher bioavailability):',
      'Daytime: CBD 25-50mg + CBG 10-25mg + CBN 5-10mg + DMSO 5-10% in cacao butter',
      'Nighttime: CBD 50-100mg + THC 10-25mg + CBN 10-20mg + DMSO 5-10% in cacao butter',
      '→ 1 suppository, 2x daily (morning + night)',
      '',
      'ELIXIR FOR EVERYTHING (Oral Tincture):',
      '12 Non-Psychoactive Cannabinoids: CBD, CBG, CBC, CBDV, CBN, THCV, CBDA, CBGA, CBCA, THCA, CBDVA, CBCVA',
      '→ 1-2 mL, 2x daily (sublingual, hold 60 seconds)',
      '',
      'TARGETED RATIOS:',
      '• Breast Cancer (ER+, HER2+): THC:CBD 1:1 (high-dose THC for apoptosis)',
      '• Inflammation/Mold Recovery: CBD-dominant full spectrum',
      '• Trauma/Anxiety: CBD:THC 20:1',
      '• Pain/Tissue Repair: CBD:THC 1:1 or 2:1',
    ].join('\n'),
    RESEARCH_LINKS['ECS Cannabinoid']
  );

  buildSectionSlide(
    'R4: RESTORE',
    'Mitochondrial Function — Sirtuins, NAD+, Glutathione, Methylation Support',
    FFPMA_COLORS.teal,
    FFPMA_COLORS.white
  );

  buildContentSlide(
    'R4: RESTORE — Mitochondrial Function',
    [
      'SIRTUINS ACTIVATION (Longevity Pathways — SIRT1-7):',
      'MitoSTAC Complex: Resveratrol 500mg | Pterostilbene 100mg | Quercetin 500mg 2x | Fisetin 100mg',
      '',
      'NAD+ PRECURSORS:',
      '• NMN: 500-1000mg daily (or NR: 300-600mg daily)',
      '• Boosts cellular energy, DNA repair, mitochondrial function',
      '',
      'GLUTATHIONE PRODUCTION (Master Antioxidant — critical for mercury + mold detox):',
      '• GlyNAC Protocol: Glycine 2-3g 2x daily + NAC 600mg 2x daily',
      '• Liposomal Glutathione: 500mg daily (direct supplementation)',
      '• Nebulized Glutathione: 3x weekly (respiratory/mold support)',
      '',
      'MITOCHONDRIAL SUPPORT STACK:',
      '• CoQ10 (Ubiquinol): 200-400mg daily — electron transport chain, ATP',
      '• L-Carnitine: 1000-2000mg daily — fatty acid transport into mitochondria',
      '• PQQ: 20mg daily — mitochondrial biogenesis (new mitochondria)',
      '• D-Ribose: 5g 2x daily — ATP precursor',
      '',
      'METHYLATION SUPPORT:',
      '• TMG: 500-1000mg daily | Methylfolate 1000mcg | Methylcobalamin 1000-5000mcg',
      '',
      'TRACE MINERALS:',
      '• Magnesium (glycinate): 400-600mg | Zinc: 30-50mg + Copper 2-4mg | Manganese: 5-10mg | Molybdenum: 150-300mcg',
    ].join('\n'),
    RESEARCH_LINKS['NAD+']
  );

  buildSectionSlide(
    'R5: REVITALIZE',
    'Mind, Body, Spirit, Emotions — Trauma Release, Frequencies, Movement, Family Support',
    FFPMA_COLORS.deepBlue,
    FFPMA_COLORS.white
  );

  buildContentSlide(
    'R5: REVITALIZE — Mind, Body, Spirit',
    [
      'MENTAL/EMOTIONAL HEALING (CRITICAL — Unresolved Childhood Trauma):',
      'Trauma Processing:',
      '• EMDR Therapy: Target sexual abuse trauma (ages 6-10)',
      '• EFT/Tapping: Daily for anxiety & fear processing',
      '• Somatic experiencing: Release stored body trauma',
      '',
      'Daily Affirmations (As Directed):',
      '  "Today\'s going to be a great day"  |  "My body heals quickly, easily, and completely"',
      '  "I am healthy, vibrant, and cancer-free"  |  "I will see my great-grandchildren"',
      '• Meditation: 10-20 minutes daily  |  Gratitude Journal: 3 things daily',
      '• Visualization: See yourself healthy, surrounded by grandchildren and future great-grandchildren',
      '',
      'FREQUENCY & LIGHT THERAPIES:',
      'Solfeggio Frequencies: 528 Hz (DNA repair) | 396 Hz (grounding) | 741 Hz (detox) — 20-30 min daily',
      'Chakra Focus: Heart (emotional healing, immune) + Sacral (trauma, reproductive)',
      'Red Light/Infrared: 15-20 minutes daily — mitochondrial support, inflammation reduction',
      '',
      'BATH THERAPIES:',
      '• Epsom Salt Baths: 2 cups + 1 cup baking soda, 20 min, 2-3x weekly',
      '• Castor Oil Packs: Over liver and breast area, 3x weekly',
      '• Clay Baths: Bentonite/zeolite, 1 cup per bath — heavy metal & mycotoxin binding',
      '',
      'MOVEMENT: Walking 20-30 min | Gentle Yoga | Tai Chi/Qigong | Rebounding 5-10 min',
      'FAMILY: Lean into support system (husband, 6 children, 14 grandchildren)',
      'COMMUNITY: Join FFPMA community | Connect with other breast cancer survivors',
    ].join('\n')
  );

  buildContentSlide(
    'DIETARY PROTOCOL',
    [
      'PHASE 1: Anti-Inflammatory, Detox-Supporting Diet',
      '',
      'ELIMINATE:',
      '✗ Processed foods, Sugar, Gluten, Dairy, Soy, Alcohol, Caffeine',
      '✗ Xenoestrogens: Plastics, conventional produce, hormone-laden meat',
      '',
      'EMPHASIZE:',
      '✓ Organic vegetables (50% raw/50% cooked) — cruciferous (broccoli, cauliflower, kale)',
      '✓ Wild-caught fish (salmon, sardines, mackerel) — omega-3, selenium',
      '✓ Grass-fed/pastured meats (moderate portions)',
      '✓ Healthy fats: Avocado, olive oil, coconut oil, ghee, MCT oil',
      '✓ Fermented foods (kefir, sauerkraut, kimchi)',
      '✓ Bone broth: 2-3 cups daily — gut healing, collagen, minerals',
      '',
      'PHASE 2: Anti-Estrogen Nutrition (Critical for ER+ Cancer)',
      '• Cruciferous vegetables daily (DIM, I3C naturally)',
      '• Ground flaxseed: 2 tbsp daily (lignans — estrogen modulation)',
      '• Green tea: 3-4 cups daily (EGCG — anti-cancer, anti-estrogen)',
      '• Turmeric: 1-2 tsp daily in food + supplement',
      '',
      'PHASE 3: Cancer-Starving Diet (Modified Keto)',
      '• Low carb: 50-100g daily (vegetables only) | Moderate protein: 0.8-1g/lb',
      '• High healthy fat: 60-70% calories — forces cancer cells to metabolic crisis',
      '',
      'INTERMITTENT FASTING: 16:8 protocol (eat 12pm-8pm, fast 8pm-12pm)',
      '→ Autophagy, cellular cleanup, cancer suppression',
    ].join('\n'),
    [PRODUCT_LINKS['TheCandidaDiet']]
  );

  buildContentSlide(
    'SUPPLEMENT PROTOCOL — 90 Essential Nutrients',
    [
      'FOUNDATION: 90 Essential Nutrients (90 for 90 Days)',
      'Priority: Addressing severe mineral deficiencies identified in assessment',
      '',
      'CRITICAL MINERALS (Immediate):',
      '• Copper: 2-4mg daily — SEVERE deficiency (solid gray hair = p53/p21 dysfunction)',
      '• Iodine: 12.5-50mg daily (Lugol\'s) — breast tissue health, thyroid support',
      '• Selenium: 200mcg daily — antioxidant, thyroid, breast cancer protection',
      '• Full colloidal/plant-derived mineral complex (liquid form for absorption)',
      '',
      'VITAMINS (16):',
      '• Full-spectrum multivitamin (methylated forms)',
      '• Extra: D3 5000-10,000 IU | K2 | C | E | B-complex',
      '',
      'AMINO ACIDS (12):',
      '• Complete protein or essential amino acid supplement',
      '',
      'FATTY ACIDS (2):',
      '• Omega-3 (EPA/DHA from fish oil or algae)',
      '',
      '═══ DAILY SUPPLEMENT TIMING ═══',
      'MORNING (with breakfast): Copper, Iodine, B-complex, D3+K2, Omega-3',
      'MIDDAY (with lunch): Curcumin, Berberine, DIM, Calcium D-Glucarate',
      'EVENING (with dinner): Magnesium glycinate, Zinc, Selenium',
      'BEDTIME: Melatonin 20mg (anti-cancer dose), Probiotic (away from antibacterials)',
      '',
      'FASTING SUPPLEMENTS (empty stomach): Serrapeptase, Nattokinase, Activated Charcoal',
    ].join('\n'),
    [PRODUCT_LINKS['Supplements'], ...(RESEARCH_LINKS['Supplement Suppliers'] || [])]
  );

  buildContentSlide(
    'DAILY SCHEDULE',
    [
      '6:00 AM — WAKE & AFFIRM',
      '"Today\'s going to be a great day" | Meditation 10-20 min | Gratitude journal',
      '',
      '6:30 AM — FASTING SUPPLEMENTS',
      'Activated Charcoal 1000mg | Serrapeptase 120,000 SPU | Nattokinase 2000 FU',
      '',
      '7:00 AM — MOVEMENT',
      'Walking 20-30 min OR gentle yoga OR rebounding 5-10 min | Dry brushing before shower',
      '',
      '8:00 AM — FIRST MEAL + SUPPLEMENTS',
      'Anti-inflammatory breakfast | Copper, Iodine, AM supplements',
      'ECS Daytime Suppository | Elixir tincture 1mL sublingual',
      '',
      '10:00 AM — TRAUMA WORK (3x weekly)',
      'EMDR session or EFT tapping practice | Journaling',
      '',
      '12:00 PM — LUNCH + MIDDAY SUPPLEMENTS',
      'Bone broth + whole food meal | Curcumin, Berberine, DIM',
      '',
      '3:00 PM — AFTERNOON THERAPIES',
      'Red Light/Infrared 15-20 min | Solfeggio frequencies | BPC-157 injection (if SubQ)',
      '',
      '6:00 PM — DINNER + EVENING SUPPLEMENTS',
      'Last meal before 8pm | Magnesium, Zinc, Selenium',
      '',
      '8:00 PM — EVENING PROTOCOL',
      'Detox bath (3x/week) OR castor oil pack (3x/week) | ECS Nighttime Suppository',
      '',
      '9:30 PM — BEDTIME: Melatonin 20mg | Probiotic | Peptide injections (TB-500, Epithalon)',
    ].join('\n')
  );

  buildContentSlide(
    'BLOOD WORK, MONITORING & COST OVERVIEW',
    [
      'BASELINE LABS (Before Protocol):',
      '• CBC with differential | CMP | Thyroid Panel (TSH, Free T3/T4)',
      '• Cancer Markers: CEA, CA 15-3, CA 27-29, HER2/neu | Estradiol, Progesterone',
      '• Heavy Metals Panel (mercury, lead, arsenic, cadmium)',
      '• Vitamin D, B12, Folate, Ferritin, Iron Panel | Copper & Ceruloplasmin',
      '• Omega-3 Index | hsCRP | Mycotoxin panel (urine)',
      '• RGCC Testing (cancer-specific — personalized vaccine development)',
      '',
      'FOLLOW-UP LABS (Every 4-6 Weeks):',
      '• Cancer markers | Hormone panel | CMP (kidney/liver during chelation) | Heavy metals progress',
      '',
      'TIMELINE & MILESTONES:',
      'Weeks 1-4: Pre-amalgam prep, begin REDUCE, mold detox, probiotics',
      'Week 5: Amalgam removal (1 filling)',
      'Weeks 6-12: Intensive chelation (DMSA cycles) + IV Vitamin C',
      'Weeks 13-16: Complete first parasite elimination cycle',
      'Month 6: RGCC results → personalized cancer vaccine protocol',
      'Month 9: Maintenance phase assessment',
      'Month 12: Comprehensive re-evaluation',
      'Month 18: GOAL — Remission/stabilization',
      '',
      'COST OVERVIEW:',
      'Monthly: Supplements/Peptides/Cannabinoids $800-1200 | IV Vitamin C $300-500 | Probiotics $100-200',
      'One-Time: Amalgam removal $500-1000 (1 filling) | RGCC Testing $2500-3500 | Baseline bloodwork $500-1000',
      'Total First Year: $15,000-25,000 (including RGCC testing)',
    ].join('\n')
  );

  buildContentSlide(
    'RESEARCH & REFERENCES',
    [
      'PEER-REVIEWED CITATIONS:',
      '',
      'MERCURY & HEAVY METALS:',
      '• Mercury amalgam health effects — PubMed: 16079072',
      '• Mercury toxicity review — PubMed: 27188709',
      '• Glutathione and heavy metal detoxification — PubMed: 24672763',
      '',
      'CANCER SUPPORT:',
      '• High-dose IV Vitamin C in cancer — PubMed: 28353481',
      '• Fenbendazole anti-cancer mechanisms — PubMed: 29891643',
      '• Mistletoe therapy in oncology — PubMed: 23922235',
      '• ECS and cancer — PubMed: 17369778',
      '• Cannabinoids immunomodulation — PubMed: 22625422',
      '',
      'PEPTIDES:',
      '• BPC-157 wound healing — PubMed: 27847034',
      '• BPC-157 GI protection — PubMed: 30915550',
      '• Epithalon telomerase activation — PubMed: 12851085',
      '• TB-500 tissue repair — PubMed: 20587038',
      '',
      'MITOCHONDRIAL SUPPORT:',
      '• NAD+ and aging — PubMed: 29514064',
      '• NMN research review — PubMed: 30457958',
      '',
      'SUPPLIERS:',
      '• Peptide Sciences: peptidesciences.com',
      '• Tailor Made Compounding: tailor-made-compounding.com',
      '• Pure Encapsulations | Designs for Health | TheCandidaDiet.com',
    ].join('\n'),
    [
      ...(RESEARCH_LINKS['Mercury Amalgam'] || []),
      ...(RESEARCH_LINKS['Vitamin C IV'] || []),
      ...(RESEARCH_LINKS['BPC-157'] || []),
      ...(RESEARCH_LINKS['NAD+'] || []),
      PRODUCT_LINKS['FFPMA'],
    ]
  );

  const closingSlide = addSlide();
  addBackground(closingSlide, FFPMA_COLORS.deepBlue);
  addAccentBar(closingSlide, 0, 0, 720, 8, FFPMA_COLORS.gold);
  addAccentBar(closingSlide, 0, 397, 720, 8, FFPMA_COLORS.gold);
  addTextBox(closingSlide, 'YOU ARE NOT YOUR CONDITION.', 40, 60, 640, 50, 28, true, FFPMA_COLORS.gold, 'Montserrat');
  addTextBox(closingSlide, [
    'Your body has an innate ability to heal when given the right conditions.',
    '',
    'This protocol addresses the ROOT CAUSES that have accumulated over',
    'a lifetime — mold exposure, childhood trauma, mineral depletion,',
    'mercury toxicity, and hormone disruption.',
    '',
    'Your first cancer was treated with surgery alone — the root causes',
    'were never addressed. This time, we fix the foundation.',
  ].join('\n'), 40, 120, 640, 140, 12, false, FFPMA_COLORS.lightGray, 'Open Sans');
  addTextBox(closingSlide, 'You have the strongest advantage: Family.\n42 years of marriage, 6 children, 14 grandchildren — and great-grandchildren to come.', 40, 270, 640, 40, 14, true, FFPMA_COLORS.cyan, 'Montserrat');
  addTextBox(closingSlide, 'Say it out loud every morning:\n"Today\'s going to be a great day."', 40, 320, 640, 40, 14, false, FFPMA_COLORS.white, 'Open Sans');
  addTextBox(closingSlide, 'FORGOTTEN FORMULA PMA  |  forgottenformulapma.com  |  Kathryn, your determination is your greatest medicine. Now we heal.', 40, 375, 640, 20, 9, false, FFPMA_COLORS.subtleText, 'Open Sans');

  if (initialSlideId) {
    requests.push({ deleteObject: { objectId: initialSlideId } });
  }

  if (requests.length > 0) {
    await slides.presentations.batchUpdate({
      presentationId,
      requestBody: { requests },
    });
  }

  const webViewLink = `https://docs.google.com/presentation/d/${presentationId}/edit`;

  let driveFileId: string | undefined;
  try {
    const allioFolder = await findAllioFolder();
    if (allioFolder) {
      let protocolsFolder = await findFolderByName(allioFolder.id, 'Protocols');
      if (!protocolsFolder) {
        const created = await createSubfolder(allioFolder.id, 'Protocols');
        protocolsFolder = created.id;
      }
      const drive = await getUncachableGoogleDriveClient();
      await drive.files.update({
        fileId: presentationId,
        addParents: protocolsFolder,
        fields: 'id',
      });
      driveFileId = presentationId;
    }
  } catch (err) {
    console.error('[Protocol Slides] Failed to move Kathryn Smith slides to ALLIO folder:', err);
  }

  return {
    presentationId,
    webViewLink,
    slideCount: slideIndex,
    driveFileId,
  };
}
