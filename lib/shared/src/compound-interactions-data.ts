export interface Compound {
  id: string;
  name: string;
  category: CompoundCategory;
  description: string;
  bioavailabilityTips: string[];
  defaultDose: string;
  timing: string;
}

export type CompoundCategory =
  | "peptide"
  | "cannabinoid"
  | "supplement"
  | "iv-therapy"
  | "botanical"
  | "amino-acid";

export const compoundCategoryLabels: Record<CompoundCategory, string> = {
  peptide: "Peptide",
  cannabinoid: "Cannabinoid",
  supplement: "Supplement",
  "iv-therapy": "IV Therapy",
  botanical: "Botanical",
  "amino-acid": "Amino Acid",
};

export type InteractionType = "synergy" | "caution" | "contraindication";

export interface CompoundInteraction {
  compoundA: string;
  compoundB: string;
  type: InteractionType;
  description: string;
  mechanism: string;
  recommendation: string;
}

export interface StackingProtocol {
  id: string;
  name: string;
  goal: string;
  description: string;
  compounds: StackEntry[];
  duration: string;
  notes: string[];
}

export interface StackEntry {
  compoundId: string;
  dose: string;
  timing: string;
  route: string;
}

export const compounds: Compound[] = [
  {
    id: "bpc-157",
    name: "BPC-157",
    category: "peptide",
    description:
      "Body Protection Compound-157; a pentadecapeptide derived from human gastric juice that promotes tissue repair, angiogenesis, and gut healing.",
    bioavailabilityTips: [
      "Subcutaneous injection near the injury site yields the highest local tissue concentration.",
      "Oral administration is viable for gut-related conditions due to gastric acid stability.",
      "Combine with bacteriostatic water for reconstitution; avoid repeated freeze–thaw cycles.",
    ],
    defaultDose: "250–500 mcg",
    timing: "1–2× daily",
  },
  {
    id: "tb-500",
    name: "TB-500 (Thymosin Beta-4)",
    category: "peptide",
    description:
      "A 43-amino-acid peptide that upregulates cell-building proteins such as actin, promoting wound healing, tissue repair, and anti-inflammatory responses.",
    bioavailabilityTips: [
      "Subcutaneous or intramuscular injection preferred.",
      "Systemic distribution allows injection at any site for whole-body benefit.",
      "Loading phase of 2× per week for 4–6 weeks is typical before transitioning to maintenance.",
    ],
    defaultDose: "2.5–5 mg",
    timing: "2× weekly",
  },
  {
    id: "thymosin-alpha-1",
    name: "Thymosin Alpha-1",
    category: "peptide",
    description:
      "A thymic peptide that modulates immune function by enhancing T-cell maturation and dendritic cell activity. Used for immune optimization and chronic infection support.",
    bioavailabilityTips: [
      "Subcutaneous injection is the standard route.",
      "Best administered in the morning to align with circadian immune rhythms.",
      "Store reconstituted peptide refrigerated; use within 30 days.",
    ],
    defaultDose: "1.6 mg",
    timing: "2× weekly",
  },
  {
    id: "ghk-cu",
    name: "GHK-Cu",
    category: "peptide",
    description:
      "A copper-binding tripeptide naturally occurring in human plasma that promotes collagen synthesis, skin remodeling, and wound healing. Demonstrates anti-inflammatory and antioxidant properties.",
    bioavailabilityTips: [
      "Subcutaneous injection provides systemic benefits for tissue remodeling.",
      "Topical application is effective for skin-specific applications (creams, serums).",
      "Can be combined with microneedling for enhanced dermal penetration.",
    ],
    defaultDose: "200–400 mcg",
    timing: "1× daily",
  },
  {
    id: "epithalon",
    name: "Epithalon (Epitalon)",
    category: "peptide",
    description:
      "A synthetic tetrapeptide that stimulates telomerase production, supporting cellular longevity and DNA repair. Studied for anti-aging and circadian rhythm regulation.",
    bioavailabilityTips: [
      "Subcutaneous or intramuscular injection preferred.",
      "Typically administered in 10–20 day cycles with 4–6 month breaks.",
      "Evening administration may support melatonin synthesis enhancement.",
    ],
    defaultDose: "5–10 mg",
    timing: "1× daily (cycled)",
  },
  {
    id: "cbd",
    name: "CBD (Cannabidiol)",
    category: "cannabinoid",
    description:
      "A non-psychoactive phytocannabinoid that modulates the endocannabinoid system, demonstrating anti-inflammatory, anxiolytic, and neuroprotective properties.",
    bioavailabilityTips: [
      "Sublingual oil administration bypasses first-pass metabolism, improving bioavailability to ~20–35%.",
      "Take with fatty foods to enhance absorption by up to 4–5×.",
      "Nanoemulsion formulations can significantly increase bioavailability.",
    ],
    defaultDose: "25–100 mg",
    timing: "1–2× daily",
  },
  {
    id: "cbg",
    name: "CBG (Cannabigerol)",
    category: "cannabinoid",
    description:
      "The 'parent cannabinoid' from which other cannabinoids are synthesized. Demonstrates antibacterial, neuroprotective, and appetite-stimulating properties.",
    bioavailabilityTips: [
      "Sublingual tincture for fastest onset.",
      "Synergistic with CBD (entourage effect) — combined formulations are recommended.",
      "Full-spectrum extracts preserve terpene synergies.",
    ],
    defaultDose: "10–50 mg",
    timing: "1–2× daily",
  },
  {
    id: "glutathione",
    name: "Glutathione",
    category: "supplement",
    description:
      "The body's master antioxidant, a tripeptide critical for detoxification, immune function, and protection against oxidative stress.",
    bioavailabilityTips: [
      "IV administration provides 100% bioavailability — oral forms are largely degraded in the GI tract.",
      "Liposomal glutathione is the best oral alternative (bioavailability ~30–50%).",
      "N-Acetyl Cysteine (NAC) supplementation supports endogenous glutathione production.",
    ],
    defaultDose: "600–2400 mg (IV) or 500–1000 mg (liposomal oral)",
    timing: "1× daily or weekly IV",
  },
  {
    id: "nad-plus",
    name: "NAD+",
    category: "iv-therapy",
    description:
      "Nicotinamide adenine dinucleotide; a coenzyme essential for cellular energy production, DNA repair, and sirtuin activation. Declines with age.",
    bioavailabilityTips: [
      "IV infusion provides the most reliable systemic increase — administer slowly over 2–4 hours to minimize flushing.",
      "Sublingual NMN or NR are oral precursors that support NAD+ levels.",
      "Avoid combining with high-dose niacin to reduce flush risk.",
    ],
    defaultDose: "250–1000 mg (IV)",
    timing: "Weekly to biweekly IV sessions",
  },
  {
    id: "vitamin-c",
    name: "Vitamin C (High Dose IV)",
    category: "iv-therapy",
    description:
      "Ascorbic acid at pharmacological doses acts as a pro-oxidant in diseased tissue while supporting immune function, collagen synthesis, and detoxification.",
    bioavailabilityTips: [
      "IV administration bypasses GI absorption limits, achieving plasma levels 50–100× higher than oral dosing.",
      "Check G6PD status before high-dose IV administration.",
      "Oral liposomal vitamin C is the best non-IV alternative (bioavailability ~80%).",
    ],
    defaultDose: "25–100 g (IV)",
    timing: "1–3× weekly IV sessions",
  },
  {
    id: "curcumin",
    name: "Curcumin",
    category: "botanical",
    description:
      "The primary bioactive compound in turmeric with potent anti-inflammatory and antioxidant properties. Modulates NF-κB, COX-2, and multiple inflammatory pathways.",
    bioavailabilityTips: [
      "Standard curcumin has <1% oral bioavailability — always use enhanced formulations.",
      "Piperine (black pepper extract) increases bioavailability by ~2000%.",
      "Phytosomal (Meriva) or nanoparticle formulations provide sustained plasma levels.",
    ],
    defaultDose: "500–2000 mg (enhanced formulation)",
    timing: "1–2× daily with meals",
  },
  {
    id: "quercetin",
    name: "Quercetin",
    category: "botanical",
    description:
      "A flavonoid with senolytic, anti-inflammatory, and antiviral properties. Acts as a zinc ionophore and supports immune resilience.",
    bioavailabilityTips: [
      "Take with vitamin C to enhance stability and absorption.",
      "Phytosomal formulations improve bioavailability significantly.",
      "Take with fatty meals for improved absorption.",
    ],
    defaultDose: "500–1000 mg",
    timing: "1–2× daily",
  },
  {
    id: "nac",
    name: "N-Acetyl Cysteine (NAC)",
    category: "amino-acid",
    description:
      "A precursor to glutathione that supports detoxification, mucolytic activity, and antioxidant defense. Also modulates glutamate neurotransmission.",
    bioavailabilityTips: [
      "Take on an empty stomach for optimal absorption (~6–10% oral bioavailability).",
      "Pair with vitamin C and selenium to enhance glutathione recycling.",
      "IV NAC achieves higher plasma levels for acute detoxification protocols.",
    ],
    defaultDose: "600–1800 mg",
    timing: "1–2× daily",
  },
  {
    id: "l-theanine",
    name: "L-Theanine",
    category: "amino-acid",
    description:
      "An amino acid found in green tea that promotes relaxation without sedation by increasing alpha brain wave activity and modulating GABA, serotonin, and dopamine.",
    bioavailabilityTips: [
      "High oral bioavailability — readily absorbed in the small intestine.",
      "Take on an empty stomach for fastest onset (30–60 minutes).",
      "Crosses the blood–brain barrier efficiently.",
    ],
    defaultDose: "100–400 mg",
    timing: "1–3× daily",
  },
  {
    id: "magnesium",
    name: "Magnesium (Glycinate/Threonate)",
    category: "supplement",
    description:
      "An essential mineral cofactor in 600+ enzymatic reactions. Glycinate form supports relaxation and sleep; threonate form crosses the BBB for cognitive benefits.",
    bioavailabilityTips: [
      "Glycinate and threonate forms have superior bioavailability vs. oxide or citrate.",
      "Take magnesium threonate in the evening for sleep and cognitive benefits.",
      "Avoid taking with high-dose calcium or zinc which compete for absorption.",
    ],
    defaultDose: "200–600 mg elemental",
    timing: "1–2× daily (evening preferred)",
  },
  {
    id: "semax",
    name: "Semax",
    category: "peptide",
    description:
      "A synthetic heptapeptide derived from ACTH that enhances BDNF expression, supporting cognitive function, neuroprotection, and neuroplasticity.",
    bioavailabilityTips: [
      "Intranasal administration provides direct CNS access bypassing the BBB.",
      "Effects onset within 5–15 minutes via nasal spray.",
      "Store refrigerated; nasal spray form is most practical.",
    ],
    defaultDose: "300–600 mcg",
    timing: "1–2× daily (morning preferred)",
  },
  {
    id: "ipamorelin",
    name: "Ipamorelin",
    category: "peptide",
    description:
      "A selective growth hormone secretagogue that stimulates GH release without significantly affecting cortisol or prolactin. Supports body composition, recovery, and anti-aging.",
    bioavailabilityTips: [
      "Subcutaneous injection on an empty stomach (fasted 2+ hours).",
      "Best administered before bed to synergize with natural GH pulse.",
      "Avoid carbohydrates/sugar 30 min before and after injection.",
    ],
    defaultDose: "200–300 mcg",
    timing: "1–2× daily (bedtime preferred)",
  },
  {
    id: "cjc-1295",
    name: "CJC-1295 (no DAC)",
    category: "peptide",
    description:
      "A growth hormone releasing hormone (GHRH) analog that amplifies the GH pulse when paired with a secretagogue like Ipamorelin. Supports recovery, lean mass, and sleep quality.",
    bioavailabilityTips: [
      "Subcutaneous injection, often combined in the same syringe as Ipamorelin.",
      "Administer on an empty stomach for optimal GH response.",
      "The no-DAC version has a shorter half-life, allowing more physiological pulsatile GH release.",
    ],
    defaultDose: "100–300 mcg",
    timing: "1× daily (bedtime)",
  },
];

export const interactions: CompoundInteraction[] = [
  {
    compoundA: "bpc-157",
    compoundB: "tb-500",
    type: "synergy",
    description:
      "BPC-157 and TB-500 work through complementary tissue repair mechanisms, creating a powerful healing stack.",
    mechanism:
      "BPC-157 promotes angiogenesis and nitric oxide pathways while TB-500 upregulates actin for cellular migration and repair. Together they accelerate wound healing, tendon/ligament repair, and reduce inflammation synergistically.",
    recommendation:
      "Stack together for injury recovery protocols. Inject BPC-157 locally near the injury site and TB-500 subcutaneously at any convenient location.",
  },
  {
    compoundA: "bpc-157",
    compoundB: "ghk-cu",
    type: "synergy",
    description:
      "Combined tissue regeneration through complementary collagen and wound healing pathways.",
    mechanism:
      "BPC-157 promotes angiogenesis while GHK-Cu stimulates collagen synthesis and skin remodeling. The combination supports both vascular and structural tissue repair.",
    recommendation:
      "Combine for surgical recovery, skin rejuvenation, or chronic wound protocols.",
  },
  {
    compoundA: "ipamorelin",
    compoundB: "cjc-1295",
    type: "synergy",
    description:
      "The gold standard GH-releasing combination. CJC-1295 amplifies the GH pulse initiated by Ipamorelin.",
    mechanism:
      "Ipamorelin acts as a ghrelin mimetic (GHSR agonist) while CJC-1295 stimulates GHRH receptors. Dual-pathway stimulation produces a larger, more sustained GH pulse than either alone.",
    recommendation:
      "Combine in the same syringe. Inject subcutaneously before bed on an empty stomach. Standard ratio: Ipamorelin 200–300 mcg + CJC-1295 100 mcg.",
  },
  {
    compoundA: "cbd",
    compoundB: "cbg",
    type: "synergy",
    description:
      "The entourage effect: CBD and CBG amplify each other's therapeutic benefits through complementary receptor activity.",
    mechanism:
      "CBD modulates CB1/CB2 receptors indirectly and activates 5-HT1A, while CBG acts on alpha-2 adrenergic receptors and has partial CB1/CB2 agonism. Together they provide broader anti-inflammatory and neuroprotective coverage.",
    recommendation:
      "Use combined CBD:CBG formulations (common ratios 2:1 or 1:1). Full-spectrum products preserve additional terpene synergies.",
  },
  {
    compoundA: "cbd",
    compoundB: "curcumin",
    type: "synergy",
    description:
      "Dual anti-inflammatory support through complementary pathways for systemic inflammation reduction.",
    mechanism:
      "CBD modulates endocannabinoid tone and TNF-alpha, while curcumin inhibits NF-κB and COX-2. The combination provides multi-pathway anti-inflammatory coverage.",
    recommendation:
      "Take CBD sublingually and curcumin (enhanced formulation) with meals. Effective for chronic inflammatory conditions.",
  },
  {
    compoundA: "glutathione",
    compoundB: "nac",
    type: "synergy",
    description:
      "NAC provides the rate-limiting precursor (cysteine) for endogenous glutathione synthesis, extending the benefits of direct glutathione supplementation.",
    mechanism:
      "Exogenous glutathione (IV or liposomal) provides immediate antioxidant capacity, while NAC sustains glutathione levels by supporting de novo synthesis in hepatocytes.",
    recommendation:
      "Use NAC daily (oral) as maintenance and add IV glutathione weekly for intensive detoxification protocols.",
  },
  {
    compoundA: "glutathione",
    compoundB: "vitamin-c",
    type: "synergy",
    description:
      "Vitamin C recycles oxidized glutathione back to its reduced (active) form, amplifying antioxidant defense.",
    mechanism:
      "Ascorbic acid donates electrons to regenerate GSH from GSSG (oxidized glutathione), maintaining the cellular redox pool and extending the effective half-life of glutathione.",
    recommendation:
      "Combine in IV protocols. Vitamin C can be infused first, followed by glutathione push. For oral protocols, take liposomal forms of both.",
  },
  {
    compoundA: "nad-plus",
    compoundB: "vitamin-c",
    type: "synergy",
    description:
      "Complementary cellular repair: NAD+ supports DNA repair and sirtuin activation while vitamin C provides antioxidant protection and immune support.",
    mechanism:
      "NAD+ fuels PARP enzymes for DNA repair and activates sirtuins for cellular maintenance. Vitamin C reduces oxidative burden, allowing NAD+ to focus on repair rather than oxidative stress management.",
    recommendation:
      "Administer in the same IV session. Vitamin C infusion followed by NAD+ infusion. Allow adequate time (4+ hours) for the combined session.",
  },
  {
    compoundA: "quercetin",
    compoundB: "vitamin-c",
    type: "synergy",
    description:
      "Vitamin C stabilizes quercetin and enhances its absorption, while quercetin enhances vitamin C recycling.",
    mechanism:
      "Ascorbic acid protects quercetin from oxidative degradation in the gut, improving its bioavailability. Quercetin in turn helps regenerate dehydroascorbic acid back to ascorbate.",
    recommendation:
      "Always co-administer quercetin with vitamin C (oral). Common protocol: 1000 mg quercetin + 1000 mg vitamin C twice daily.",
  },
  {
    compoundA: "curcumin",
    compoundB: "quercetin",
    type: "synergy",
    description:
      "Dual senolytic and anti-inflammatory activity for cellular renewal and chronic disease protocols.",
    mechanism:
      "Both compounds have senolytic properties (clearing senescent cells). Curcumin inhibits NF-κB while quercetin acts as a dasatinib-like senolytic agent. Together they support cellular housekeeping.",
    recommendation:
      "Combine for anti-aging or cellular renewal protocols. Take both with fatty meals and piperine/black pepper for enhanced absorption.",
  },
  {
    compoundA: "semax",
    compoundB: "l-theanine",
    type: "synergy",
    description:
      "Cognitive enhancement through BDNF upregulation paired with calming alpha-wave promotion for focused, clear thinking.",
    mechanism:
      "Semax increases BDNF expression and neuroplasticity while L-theanine promotes alpha brain waves and modulates GABA/glutamate balance, preventing overstimulation.",
    recommendation:
      "Use Semax nasal spray in the morning with oral L-theanine for calm, focused cognitive enhancement.",
  },
  {
    compoundA: "thymosin-alpha-1",
    compoundB: "epithalon",
    type: "synergy",
    description:
      "Immune rejuvenation paired with telomere maintenance for comprehensive anti-aging immune support.",
    mechanism:
      "Thymosin Alpha-1 enhances T-cell function and dendritic cell activity, while Epithalon activates telomerase in immune cells, supporting their proliferative capacity and longevity.",
    recommendation:
      "Combine in longevity protocols. Thymosin Alpha-1 2× weekly with Epithalon in 10–20 day cycles.",
  },
  {
    compoundA: "cbd",
    compoundB: "l-theanine",
    type: "synergy",
    description:
      "Complementary anxiolytic effects through different neurotransmitter pathways for stress and sleep support.",
    mechanism:
      "CBD modulates 5-HT1A serotonin receptors and endocannabinoid tone, while L-theanine increases GABA and alpha waves. Together they provide calm without sedation.",
    recommendation:
      "Combine for anxiety or sleep protocols. CBD sublingual + L-theanine oral in the evening.",
  },
  {
    compoundA: "bpc-157",
    compoundB: "nac",
    type: "synergy",
    description:
      "Gut healing and detoxification support through tissue repair and glutathione enhancement.",
    mechanism:
      "BPC-157 heals gut mucosal lining and modulates nitric oxide while NAC supports mucosal glutathione production and reduces intestinal oxidative stress.",
    recommendation:
      "Combine for gut healing and detoxification protocols. Oral BPC-157 + NAC on empty stomach in morning.",
  },
  {
    compoundA: "nad-plus",
    compoundB: "glutathione",
    type: "caution",
    description:
      "Both are commonly combined in IV protocols, but timing matters to avoid reducing the efficacy of either.",
    mechanism:
      "Glutathione is a strong reducing agent that may chemically interact with NAD+ if mixed directly in the same IV bag, potentially reducing NAD+ to NADH prematurely.",
    recommendation:
      "Administer sequentially, not simultaneously. Complete the NAD+ infusion first, then administer glutathione as a separate IV push. Do not premix.",
  },
  {
    compoundA: "cbd",
    compoundB: "nac",
    type: "caution",
    description:
      "CBD inhibits certain CYP450 enzymes that metabolize NAC, potentially altering plasma levels.",
    mechanism:
      "CBD is a known inhibitor of CYP3A4 and CYP2C19. While NAC is primarily metabolized through different pathways, high-dose CBD may affect overall hepatic metabolism.",
    recommendation:
      "Separate administration by 2–3 hours. Monitor liver enzymes if using high doses of both chronically.",
  },
  {
    compoundA: "ipamorelin",
    compoundB: "cbd",
    type: "caution",
    description:
      "CBD's effects on blood sugar and insulin sensitivity may blunt the GH response to Ipamorelin.",
    mechanism:
      "GH secretagogues require a low-insulin environment for optimal GH pulse. CBD may influence glucose metabolism and insulin sensitivity, potentially affecting the fasted state needed for optimal GH release.",
    recommendation:
      "Separate dosing by at least 2 hours. Take Ipamorelin on a fully fasted stomach; use CBD at a different time of day.",
  },
  {
    compoundA: "vitamin-c",
    compoundB: "curcumin",
    type: "caution",
    description:
      "Very high dose IV vitamin C combined with high-dose oral curcumin may increase oxalate load in susceptible individuals.",
    mechanism:
      "High-dose vitamin C can be metabolized to oxalate, and curcumin may increase oxalate absorption in the gut. Combined high doses could raise kidney stone risk in predisposed patients.",
    recommendation:
      "Screen for history of kidney stones. Ensure adequate hydration. Standard supplemental doses are generally safe; caution applies mainly to high-dose IV vitamin C protocols.",
  },
  {
    compoundA: "magnesium",
    compoundB: "nad-plus",
    type: "synergy",
    description:
      "Magnesium is a required cofactor for NAD+-dependent enzymatic reactions, supporting optimal NAD+ utilization.",
    mechanism:
      "Sirtuins and PARPs require magnesium as a cofactor. Adequate magnesium ensures NAD+ can effectively activate these repair and longevity pathways.",
    recommendation:
      "Ensure magnesium repletion before and during NAD+ protocols. Take magnesium glycinate daily alongside NAD+ IV sessions.",
  },
  {
    compoundA: "bpc-157",
    compoundB: "ipamorelin",
    type: "synergy",
    description:
      "Tissue repair enhanced by growth hormone stimulation for accelerated healing and recovery.",
    mechanism:
      "BPC-157 promotes local tissue repair and angiogenesis while Ipamorelin-stimulated GH enhances systemic protein synthesis, IGF-1 production, and recovery capacity.",
    recommendation:
      "Combine for post-surgical or intensive injury recovery protocols. BPC-157 locally + Ipamorelin/CJC-1295 at bedtime.",
  },
  {
    compoundA: "epithalon",
    compoundB: "ipamorelin",
    type: "contraindication",
    description:
      "Concurrent telomerase activation and growth hormone stimulation may pose proliferative risk in patients with active or history of hormone-sensitive cancers.",
    mechanism:
      "Epithalon activates telomerase which can extend telomeres in all dividing cells, while GH/IGF-1 axis stimulation from Ipamorelin promotes cellular proliferation. In patients with occult or active malignancies, this dual proliferative stimulus could theoretically accelerate tumor growth.",
    recommendation:
      "Do NOT combine in patients with active cancer, history of hormone-sensitive cancers, or elevated tumor markers. Screen thoroughly before initiating either compound. If both are indicated, use sequentially with appropriate washout periods and oncology clearance.",
  },
  {
    compoundA: "thymosin-alpha-1",
    compoundB: "cbd",
    type: "contraindication",
    description:
      "High-dose CBD may suppress immune activation that Thymosin Alpha-1 is intended to stimulate, creating opposing pharmacological effects.",
    mechanism:
      "Thymosin Alpha-1 upregulates T-cell and dendritic cell activity for immune stimulation. High-dose CBD (>100 mg) has demonstrated immunosuppressive properties by reducing T-cell proliferation and cytokine production, directly opposing the intended therapeutic effect.",
    recommendation:
      "Avoid concurrent use in immunocompromised patients or those on Thymosin Alpha-1 for immune activation protocols. If both are clinically indicated, separate by 8+ hours and use lower CBD doses (<50 mg). Monitor immune markers closely.",
  },
  {
    compoundA: "nad-plus",
    compoundB: "epithalon",
    type: "contraindication",
    description:
      "Dual cellular proliferative support from NAD+ repletion and telomerase activation requires cancer screening clearance before concurrent use.",
    mechanism:
      "NAD+ fuels PARP-mediated DNA repair and sirtuin activity which can benefit both healthy and malignant cells. Combined with Epithalon's telomerase activation, this creates a potent proliferative environment that may sustain damaged or pre-cancerous cells.",
    recommendation:
      "Contraindicated in patients with active malignancies or without recent comprehensive cancer screening. Require baseline tumor markers, imaging, and oncology clearance before combining. Use sequentially rather than concurrently when possible.",
  },
];

export const stackingProtocols: StackingProtocol[] = [
  {
    id: "detoxification",
    name: "Detoxification & Cellular Cleansing",
    goal: "Detoxification",
    description:
      "A comprehensive detoxification protocol combining direct antioxidant delivery, glutathione synthesis support, and gut healing to facilitate heavy metal chelation, phase I/II liver detoxification, and cellular waste clearance.",
    compounds: [
      {
        compoundId: "glutathione",
        dose: "1200 mg IV or 500 mg liposomal oral",
        timing: "Weekly IV or daily oral",
        route: "IV push or oral",
      },
      {
        compoundId: "nac",
        dose: "1200 mg",
        timing: "Morning, empty stomach",
        route: "Oral",
      },
      {
        compoundId: "vitamin-c",
        dose: "25–50 g IV or 2 g liposomal oral",
        timing: "Weekly IV or daily oral",
        route: "IV infusion or oral",
      },
      {
        compoundId: "bpc-157",
        dose: "500 mcg",
        timing: "Morning, empty stomach (oral for gut healing)",
        route: "Oral or subcutaneous",
      },
      {
        compoundId: "curcumin",
        dose: "1000 mg (phytosomal)",
        timing: "With meals, twice daily",
        route: "Oral",
      },
    ],
    duration: "8–12 weeks",
    notes: [
      "Begin with NAC and oral vitamin C for 1–2 weeks before adding IV therapies.",
      "Administer IV glutathione and vitamin C on separate days or sequentially (vitamin C first).",
      "Add BPC-157 orally if GI symptoms are present.",
      "Maintain adequate hydration (minimum 2–3 L water daily).",
      "Monitor liver enzymes and kidney function at weeks 4 and 8.",
    ],
  },
  {
    id: "ecs-optimization",
    name: "ECS Optimization & Homeostasis",
    goal: "ECS Optimization",
    description:
      "Targets endocannabinoid system balance through direct cannabinoid support, anti-inflammatory botanicals, and neuroprotective amino acids to restore homeostatic signaling across all body systems.",
    compounds: [
      {
        compoundId: "cbd",
        dose: "50 mg",
        timing: "Morning and evening",
        route: "Sublingual oil",
      },
      {
        compoundId: "cbg",
        dose: "25 mg",
        timing: "Morning and evening (combined with CBD)",
        route: "Sublingual oil",
      },
      {
        compoundId: "curcumin",
        dose: "1000 mg (phytosomal)",
        timing: "With breakfast",
        route: "Oral",
      },
      {
        compoundId: "magnesium",
        dose: "400 mg threonate",
        timing: "Evening",
        route: "Oral",
      },
      {
        compoundId: "l-theanine",
        dose: "200 mg",
        timing: "Morning and evening",
        route: "Oral",
      },
    ],
    duration: "Ongoing (assess at 8 weeks)",
    notes: [
      "Use full-spectrum CBD:CBG products when possible for enhanced entourage effect.",
      "Start CBD at 25 mg and titrate up based on response.",
      "Magnesium threonate supports ECS receptor sensitivity and sleep quality.",
      "L-theanine complements CBD's anxiolytic properties without sedation.",
      "Assess ECS function with the app's ECS Assessment Tool at baseline and 8 weeks.",
    ],
  },
  {
    id: "cellular-regeneration",
    name: "Cellular Regeneration & Longevity",
    goal: "Cellular Regeneration",
    description:
      "An advanced anti-aging protocol combining telomerase activation, NAD+ repletion, immune rejuvenation, and senolytic support to promote cellular repair, DNA integrity, and systemic rejuvenation.",
    compounds: [
      {
        compoundId: "epithalon",
        dose: "10 mg",
        timing: "Daily for 20 days (evening)",
        route: "Subcutaneous injection",
      },
      {
        compoundId: "nad-plus",
        dose: "500 mg IV",
        timing: "Weekly (slow infusion over 3 hours)",
        route: "IV infusion",
      },
      {
        compoundId: "thymosin-alpha-1",
        dose: "1.6 mg",
        timing: "Twice weekly",
        route: "Subcutaneous injection",
      },
      {
        compoundId: "quercetin",
        dose: "1000 mg",
        timing: "Daily with vitamin C",
        route: "Oral",
      },
      {
        compoundId: "magnesium",
        dose: "400 mg glycinate",
        timing: "Evening daily",
        route: "Oral",
      },
    ],
    duration: "Epithalon: 20-day cycle, 4–6 month break. Others: ongoing.",
    notes: [
      "Epithalon is administered in defined cycles — do not use continuously.",
      "Ensure magnesium repletion before starting NAD+ infusions (required cofactor).",
      "Quercetin + vitamin C provides senolytic support for clearing damaged cells.",
      "Thymosin Alpha-1 rejuvenates immune surveillance for clearing dysfunctional cells.",
      "Baseline and follow-up labs: telomere length, NAD+ levels, inflammatory markers.",
    ],
  },
  {
    id: "tissue-repair",
    name: "Tissue Repair & Injury Recovery",
    goal: "Tissue Repair",
    description:
      "A targeted recovery protocol combining peptide-mediated tissue repair with growth hormone optimization and anti-inflammatory support for accelerated healing of injuries, post-surgical recovery, and musculoskeletal rehabilitation.",
    compounds: [
      {
        compoundId: "bpc-157",
        dose: "500 mcg",
        timing: "Twice daily (near injury site)",
        route: "Subcutaneous injection",
      },
      {
        compoundId: "tb-500",
        dose: "5 mg",
        timing: "Twice weekly (loading) → weekly (maintenance)",
        route: "Subcutaneous injection",
      },
      {
        compoundId: "ghk-cu",
        dose: "400 mcg",
        timing: "Daily",
        route: "Subcutaneous injection",
      },
      {
        compoundId: "ipamorelin",
        dose: "300 mcg",
        timing: "Bedtime, fasted",
        route: "Subcutaneous injection",
      },
      {
        compoundId: "cjc-1295",
        dose: "100 mcg",
        timing: "Bedtime, with Ipamorelin",
        route: "Subcutaneous injection",
      },
    ],
    duration: "6–12 weeks depending on injury severity",
    notes: [
      "BPC-157 injection should be as close to the injury site as possible.",
      "TB-500 provides systemic healing — injection site is flexible.",
      "GHK-Cu supports collagen remodeling for connective tissue injuries.",
      "Ipamorelin + CJC-1295 bedtime stack amplifies natural GH pulse for overnight recovery.",
      "Loading phase (first 4 weeks): higher frequency dosing. Then transition to maintenance.",
    ],
  },
  {
    id: "cognitive-optimization",
    name: "Cognitive Optimization & Neuroprotection",
    goal: "Cognitive Enhancement",
    description:
      "A nootropic and neuroprotective stack combining BDNF-enhancing peptides, ECS modulation, and calming amino acids for sustained cognitive performance, neuroplasticity, and brain health.",
    compounds: [
      {
        compoundId: "semax",
        dose: "600 mcg",
        timing: "Morning",
        route: "Intranasal spray",
      },
      {
        compoundId: "l-theanine",
        dose: "200 mg",
        timing: "Morning and afternoon",
        route: "Oral",
      },
      {
        compoundId: "cbd",
        dose: "25 mg",
        timing: "Morning",
        route: "Sublingual oil",
      },
      {
        compoundId: "magnesium",
        dose: "400 mg threonate",
        timing: "Evening",
        route: "Oral",
      },
      {
        compoundId: "nad-plus",
        dose: "250 mg IV or NMN 500 mg oral",
        timing: "Weekly IV or daily oral",
        route: "IV infusion or oral",
      },
    ],
    duration: "Ongoing (assess at 4 and 12 weeks)",
    notes: [
      "Semax provides rapid cognitive enhancement — intranasal for direct CNS delivery.",
      "L-theanine prevents overstimulation while maintaining focus and clarity.",
      "Magnesium threonate is the preferred form as it crosses the blood–brain barrier.",
      "CBD at lower doses supports focus without sedation; titrate carefully.",
      "NAD+ supports neuronal energy metabolism and BDNF signaling.",
    ],
  },
];
