import type { PatientProfile } from "@shared/types/protocol-assembly";

export function buildAnnetteGomerProfile(): PatientProfile {
  return {
    name: "Annette Gomer",
    age: 75,
    gender: "female",
    location: "United States",
    callDate: "2026-03-15",

    chiefComplaints: [
      "Metastatic adenocarcinoma — active cancer requiring comprehensive protocol",
      "Graves' disease — hyperthyroid autoimmune condition",
      "Hashimoto's thyroiditis — concurrent autoimmune thyroid destruction",
      "Dual autoimmune thyroid disorder — paradoxical Graves/Hashimoto coexistence",
      "Fatigue and declining energy",
      "Immune system dysfunction",
    ],

    currentDiagnoses: [
      "Metastatic adenocarcinoma",
      "Graves' disease",
      "Hashimoto's thyroiditis",
      "Chronic autoimmune thyroid disorder",
    ],

    currentMedications: [
      "Thyroid medication (type and dose to be confirmed at intake)",
    ],

    medicalTimeline: [
      { ageRange: "Unknown", event: "Hashimoto's thyroiditis diagnosed", significance: "Autoimmune thyroid destruction — indicates systemic immune dysregulation" },
      { ageRange: "Unknown", event: "Graves' disease diagnosed", significance: "Second autoimmune thyroid condition — rare dual presentation indicates deep immune confusion" },
      { ageRange: "70s", event: "Metastatic adenocarcinoma diagnosed", significance: "Cancer developed in context of chronic autoimmune dysfunction and immune suppression" },
    ],

    rootCauses: [
      {
        rank: 1,
        cause: "Chronic autoimmune dysregulation",
        category: "primary",
        details: "Dual Graves/Hashimoto coexistence indicates profound immune system confusion — Th1/Th2 imbalance, molecular mimicry, and loss of self-tolerance. This created the immunosuppressive environment enabling cancer development.",
        relatedSymptoms: ["Thyroid dysfunction", "Fatigue", "Immune suppression"],
      },
      {
        rank: 2,
        cause: "Mineral and nutrient depletion",
        category: "secondary",
        details: "Decades of autoimmune thyroid disease depletes selenium, iodine, zinc, and vitamin D — all critical for immune surveillance and tumor suppressor gene function. Deficiency enables cancer progression.",
        relatedSymptoms: ["Fatigue", "Immune dysfunction", "Cancer susceptibility"],
      },
      {
        rank: 3,
        cause: "Chronic inflammation and NF-κB activation",
        category: "tertiary",
        details: "Autoimmune processes drive chronic systemic inflammation via NF-κB, COX-2, and pro-inflammatory cytokine cascades, creating a tumor-promoting microenvironment.",
        relatedSymptoms: ["Systemic inflammation", "Cancer progression", "Tissue damage"],
      },
      {
        rank: 4,
        cause: "Gut permeability and microbiome dysfunction",
        category: "quaternary",
        details: "Autoimmune conditions are strongly associated with leaky gut — bacterial lipopolysaccharides entering systemic circulation perpetuate immune activation and cancer-promoting inflammation.",
        relatedSymptoms: ["Digestive issues", "Systemic inflammation", "Immune dysfunction"],
      },
      {
        rank: 5,
        cause: "Potential environmental toxin burden",
        category: "quinary",
        details: "At 75 years, lifetime accumulation of heavy metals, pesticides, and environmental toxins may contribute to both autoimmune disease and cancer development. Full toxin panel recommended.",
        relatedSymptoms: ["Cancer", "Autoimmune disease", "Metabolic dysfunction"],
      },
    ],

    environmentalExposures: {
      moldExposure: false,
      heavyMetals: false,
      heavyMetalDetails: "To be evaluated — lifetime accumulation likely given age",
      amalgamFillings: false,
      pesticides: false,
      radiation: false,
      otherToxins: ["Lifetime environmental exposure to be assessed at intake"],
    },

    traumaHistory: {
      childhoodTrauma: false,
      significantStressors: ["Chronic disease management", "Cancer diagnosis stress"],
    },

    surgicalHistory: [],

    gutHealth: {
      gallbladderRemoved: false,
      appendixRemoved: false,
      digestiveIssues: ["Autoimmune-related gut dysfunction suspected"],
      probioticHistory: undefined,
    },

    hormoneStatus: {
      thyroidIssues: "Dual Graves/Hashimoto — complex thyroid autoimmunity requiring careful management",
      estrogenDominance: false,
      hormoneDetails: "Thyroid function severely compromised by dual autoimmune attack; hormone cascade effects on adrenal and reproductive axes",
    },

    parasiteStatus: {
      everTreated: false,
      treatmentDetails: "Never treated — antiparasitic protocol essential per FF PMA methodology",
    },

    dentalHistory: {
      amalgamFillings: false,
      rootCanals: 0,
    },

    deficiencies: [
      "Selenium (critical for thyroid and immune function)",
      "Iodine (thyroid substrate — must balance with autoimmune status)",
      "Zinc (immune modulation and wound healing)",
      "Vitamin D (immune regulation and cancer prevention)",
      "Vitamin C (antioxidant and immune support)",
      "Copper (enzymatic cofactor, assess ceruloplasmin)",
      "Magnesium (>300 enzymatic reactions, often depleted)",
      "B-complex (methylation support)",
    ],

    contraindications: [
      "Thyroid-stimulating compounds must be used cautiously with Graves' disease",
      "Iodine supplementation requires careful titration with dual thyroid autoimmunity",
      "Avoid immune-stimulating agents that could exacerbate autoimmune thyroid flare",
      "Monitor thyroid labs closely throughout protocol",
    ],

    goals: [
      "Halt metastatic adenocarcinoma progression",
      "Restore immune system balance (Th1/Th2 equilibrium)",
      "Stabilize thyroid function despite dual autoimmune burden",
      "Reduce systemic inflammation and NF-κB activation",
      "Replenish critical mineral and nutrient deficiencies",
      "Support natural killer cell and cytotoxic T-cell function",
      "Optimize gut health to reduce autoimmune triggers",
      "Establish sustainable long-term maintenance protocol",
    ],
  };
}

export function buildCropDusterProfile(): PatientProfile {
  return {
    name: "John D.",
    age: 80,
    gender: "male",
    location: "Rural United States",
    callDate: "2026-03-15",

    chiefComplaints: [
      "Chronic kidney disease — renal function decline",
      "Decades of pesticide exposure from crop dusting career",
      "Heavy metal accumulation from aerial chemical application",
      "Declining energy and vitality",
      "Toxin-induced organ damage",
    ],

    currentDiagnoses: [
      "Chronic kidney disease",
      "Pesticide toxicity syndrome",
      "Heavy metal burden",
      "Renal insufficiency",
    ],

    currentMedications: [
      "Kidney support medications (to be confirmed at intake)",
    ],

    medicalTimeline: [
      { ageRange: "20s-60s", event: "Career crop duster — decades of pesticide/herbicide exposure", significance: "Massive occupational exposure to organophosphates, glyphosate, 2,4-D, and other agricultural chemicals — primary root cause of systemic toxicity" },
      { ageRange: "60s-70s", event: "Kidney function decline noted", significance: "Renal damage from decades of filtering pesticide metabolites and heavy metals" },
      { ageRange: "70s", event: "Heavy metal testing reveals elevated levels", significance: "Mercury, lead, arsenic, and cadmium accumulated from pesticide formulations and aerial application" },
      { ageRange: "80", event: "Presenting for comprehensive protocol", significance: "Seeking root cause resolution after conventional medicine failed to address toxin burden" },
    ],

    rootCauses: [
      {
        rank: 1,
        cause: "Chronic organophosphate pesticide exposure",
        category: "primary",
        details: "40+ years of crop dusting exposed him to organophosphates (cholinesterase inhibitors), glyphosate (gut microbiome destroyer), 2,4-D (endocrine disruptor), and carbamates. These chemicals cause neurological damage, kidney injury, immune suppression, and mitochondrial dysfunction.",
        relatedSymptoms: ["Kidney disease", "Fatigue", "Neurological symptoms", "Immune dysfunction"],
      },
      {
        rank: 2,
        cause: "Heavy metal accumulation",
        category: "secondary",
        details: "Agricultural chemicals contain heavy metals as impurities and adjuvants — arsenic, lead, cadmium, mercury. Decades of inhalation and dermal absorption created massive body burden. Kidneys are primary filtration organ and sustained direct damage.",
        relatedSymptoms: ["Kidney disease", "Brain fog", "Peripheral neuropathy", "Metabolic dysfunction"],
      },
      {
        rank: 3,
        cause: "Renal tubular damage and filtration collapse",
        category: "tertiary",
        details: "Years of filtering pesticide metabolites and heavy metals directly damaged renal tubules, glomeruli, and nephrons. Reduced GFR means toxins accumulate faster than the body can clear them — creating a vicious cycle.",
        relatedSymptoms: ["Elevated creatinine", "Reduced GFR", "Fluid retention", "Electrolyte imbalances"],
      },
      {
        rank: 4,
        cause: "Glyphosate-induced microbiome destruction",
        category: "quaternary",
        details: "Glyphosate (Roundup) is a patented antibiotic that destroys beneficial gut bacteria via the shikimate pathway. Chronic exposure decimated the microbiome, leading to leaky gut, systemic inflammation, and impaired detoxification.",
        relatedSymptoms: ["Gut dysfunction", "Systemic inflammation", "Impaired detox capacity"],
      },
      {
        rank: 5,
        cause: "Mitochondrial dysfunction from pesticide exposure",
        category: "quinary",
        details: "Organophosphates and heavy metals directly damage mitochondrial electron transport chain, reducing ATP production and cellular energy. At age 80, this compounds age-related mitochondrial decline.",
        relatedSymptoms: ["Profound fatigue", "Muscle weakness", "Cognitive decline", "Accelerated aging"],
      },
    ],

    environmentalExposures: {
      moldExposure: false,
      heavyMetals: true,
      heavyMetalDetails: "Massive heavy metal burden from 40+ years of crop dusting — mercury, lead, arsenic, cadmium from pesticide formulations, fuel additives, and aerial application equipment",
      amalgamFillings: false,
      pesticides: true,
      radiation: false,
      otherToxins: [
        "Organophosphate pesticides (chlorpyrifos, malathion, parathion)",
        "Glyphosate (Roundup) — extensive exposure",
        "2,4-D herbicide",
        "Carbamate insecticides",
        "Pyrethroid insecticides",
        "Fumigants and fungicides",
        "Aviation fuel and exhaust particulates",
      ],
    },

    traumaHistory: {
      childhoodTrauma: false,
      significantStressors: ["Decades of high-risk occupation", "Health decline in later years"],
    },

    surgicalHistory: [],

    gutHealth: {
      gallbladderRemoved: false,
      appendixRemoved: false,
      digestiveIssues: [
        "Glyphosate-induced microbiome disruption",
        "Suspected leaky gut from chronic chemical exposure",
        "Reduced digestive enzyme production",
      ],
      probioticHistory: undefined,
    },

    hormoneStatus: {
      thyroidIssues: "Pesticide-induced endocrine disruption — assess thyroid function",
      estrogenDominance: false,
      hormoneDetails: "Organophosphates and 2,4-D are known endocrine disruptors; testosterone likely depleted; adrenal fatigue from chronic chemical stress",
    },

    parasiteStatus: {
      everTreated: false,
      treatmentDetails: "Never treated — antiparasitic protocol essential; rural/agricultural exposure increases parasite risk",
    },

    dentalHistory: {
      amalgamFillings: false,
      rootCanals: 0,
    },

    deficiencies: [
      "Glutathione (master antioxidant — depleted by pesticide detoxification)",
      "NAC (glutathione precursor — critical for detox pathways)",
      "Selenium (kidney-protective, depleted by heavy metals)",
      "Zinc (competes with cadmium and lead for binding sites)",
      "Magnesium (depleted by glyphosate chelation)",
      "Vitamin C (massive antioxidant demand from toxin exposure)",
      "B-vitamins (methylation support for detoxification)",
      "CoQ10 (mitochondrial electron transport support)",
      "Alpha-lipoic acid (heavy metal chelator and antioxidant)",
      "Vitamin D (immune modulation)",
    ],

    contraindications: [
      "Kidney function must be monitored throughout — adjust all dosing for renal clearance",
      "Aggressive chelation may mobilize toxins faster than kidneys can clear — go slow",
      "Avoid nephrotoxic supplements and high-dose minerals without renal monitoring",
      "IV glutathione and NAC doses must be kidney-adjusted",
      "Monitor GFR, creatinine, and BUN at 2-week intervals minimum",
      "Hydration critical — ensure adequate fluid intake for renal support",
    ],

    goals: [
      "Halt kidney disease progression and restore renal function where possible",
      "Safely mobilize and eliminate decades of pesticide residues",
      "Chelate heavy metals without overwhelming compromised kidneys",
      "Restore gut microbiome destroyed by glyphosate exposure",
      "Rebuild mitochondrial function and cellular energy production",
      "Replenish critical nutrients depleted by decades of chemical exposure",
      "Support liver detoxification pathways (Phase I, II, III)",
      "Reduce systemic inflammation from toxin burden",
      "Improve quality of life and functional capacity at 80",
    ],
  };
}

export function buildBreastCancer75FProfile(): PatientProfile {
  return {
    name: "Margaret R.",
    age: 75,
    gender: "female",
    location: "United States",
    callDate: "2026-03-15",

    chiefComplaints: [
      "Recurring breast cancer — disease has returned after previous treatment",
      "9 amalgam fillings — massive mercury exposure source",
      "No gallbladder — compromised bile production and fat-soluble nutrient absorption",
      "No appendix — reduced immune tissue and microbiome reservoir",
      "Fatigue and declining vitality",
      "Concern about cancer recurrence mechanisms",
    ],

    currentDiagnoses: [
      "Recurring breast cancer",
      "Mercury toxicity (9 amalgam fillings)",
      "Post-cholecystectomy syndrome",
      "Post-appendectomy immune compromise",
    ],

    currentMedications: [
      "Cancer-related medications (to be confirmed at intake)",
    ],

    medicalTimeline: [
      { ageRange: "Unknown", event: "9 amalgam (mercury) fillings placed", significance: "Each amalgam releases 1-3 mcg mercury vapor daily — 9 fillings = massive chronic mercury exposure (9-27 mcg/day). Mercury is immunosuppressive and directly linked to breast cancer risk." },
      { ageRange: "Unknown", event: "Gallbladder removed (cholecystectomy)", significance: "Loss of bile storage impairs fat digestion, fat-soluble vitamin absorption (A, D, E, K), and bile's role in toxin elimination. Creates chronic nutrient malabsorption." },
      { ageRange: "Unknown", event: "Appendix removed (appendectomy)", significance: "Loss of appendix removes immune tissue reservoir and microbiome 'safe house'. Reduces immune resilience and microbiome recovery capacity." },
      { ageRange: "Unknown", event: "Initial breast cancer diagnosis and treatment", significance: "First cancer occurrence — root causes not addressed by conventional treatment" },
      { ageRange: "75", event: "Breast cancer recurrence", significance: "Cancer returned because root causes (mercury, nutrient depletion, immune suppression) were never resolved. Conventional treatment addressed symptoms, not etiology." },
    ],

    rootCauses: [
      {
        rank: 1,
        cause: "Chronic mercury toxicity from 9 amalgam fillings",
        category: "primary",
        details: "9 amalgam fillings represent one of the highest mercury burdens seen in clinical practice. Mercury vapor is continuously released (accelerated by hot food/drink, grinding), inhaled, and absorbed systemically. Mercury directly suppresses NK cell function, inhibits p53 tumor suppressor, disrupts estrogen metabolism, and creates immune paralysis that enables cancer growth and recurrence.",
        relatedSymptoms: ["Cancer recurrence", "Immune suppression", "Fatigue", "Brain fog"],
      },
      {
        rank: 2,
        cause: "Compromised detoxification from gallbladder removal",
        category: "secondary",
        details: "Without a gallbladder, bile is released continuously in small amounts rather than concentrated boluses. This impairs fat-soluble toxin elimination, reduces absorption of vitamins A, D, E, K (all critical for immune function and cancer prevention), and compromises the enterohepatic circulation needed for mercury excretion.",
        relatedSymptoms: ["Nutrient malabsorption", "Toxin accumulation", "Fat digestion issues", "Vitamin deficiencies"],
      },
      {
        rank: 3,
        cause: "Immune reservoir loss from appendectomy",
        category: "tertiary",
        details: "The appendix serves as a biofilm reactor and immune tissue reservoir for the gut microbiome. Its removal reduces the body's ability to recover beneficial bacteria after illness or antibiotic use, weakens mucosal immunity, and impairs the gut-immune axis critical for cancer surveillance.",
        relatedSymptoms: ["Recurrent infections", "Microbiome instability", "Reduced immune surveillance"],
      },
      {
        rank: 4,
        cause: "Estrogen metabolism disruption",
        category: "quaternary",
        details: "Mercury disrupts estrogen metabolism by inhibiting COMT (catechol-O-methyltransferase), leading to accumulation of 4-hydroxyestrone — a potent genotoxic estrogen metabolite that causes DNA damage. Combined with impaired bile elimination (no gallbladder), excess estrogens are recirculated rather than excreted, driving estrogen-dependent cancer growth.",
        relatedSymptoms: ["Breast cancer recurrence", "Estrogen dominance", "Hormonal imbalance"],
      },
      {
        rank: 5,
        cause: "Parasite burden (never treated)",
        category: "quinary",
        details: "At 75 years without ever receiving antiparasitic treatment, significant parasite burden is likely. Parasites suppress p53/p21 tumor suppressor genes, create immune evasion, and compete for nutrients. They often harbor heavy metals, complicating detoxification.",
        relatedSymptoms: ["Immune suppression", "Nutrient depletion", "Cancer susceptibility"],
      },
    ],

    environmentalExposures: {
      moldExposure: false,
      heavyMetals: true,
      heavyMetalDetails: "9 amalgam fillings — each releases 1-3 mcg mercury vapor daily. Total estimated daily mercury exposure: 9-27 mcg. Decades of continuous exposure has created massive body burden in organs, brain, and bone.",
      amalgamFillings: true,
      amalgamCount: 9,
      amalgamYears: 40,
      pesticides: false,
      radiation: false,
    },

    traumaHistory: {
      childhoodTrauma: false,
      significantStressors: ["Cancer diagnosis and recurrence", "Multiple surgical interventions"],
    },

    surgicalHistory: [
      "Cholecystectomy (gallbladder removal)",
      "Appendectomy (appendix removal)",
      "Previous breast cancer surgery/treatment",
    ],

    gutHealth: {
      gallbladderRemoved: true,
      appendixRemoved: true,
      digestiveIssues: [
        "Fat malabsorption from gallbladder removal",
        "Chronic bile insufficiency",
        "Microbiome instability from appendix removal",
        "Reduced fat-soluble vitamin absorption (A, D, E, K)",
      ],
      probioticHistory: undefined,
    },

    hormoneStatus: {
      thyroidIssues: "Mercury from amalgams can suppress thyroid function — assess",
      estrogenDominance: true,
      hormoneDetails: "Mercury inhibits COMT enzyme, causing 4-hydroxyestrone accumulation. Without gallbladder, estrogen recirculation via enterohepatic pathway is increased. DIM and calcium-d-glucarate essential for estrogen metabolism support.",
    },

    parasiteStatus: {
      everTreated: false,
      treatmentDetails: "Never treated in 75 years — comprehensive antiparasitic protocol essential before heavy metal chelation (parasites harbor metals)",
    },

    dentalHistory: {
      amalgamFillings: true,
      rootCanals: 0,
      cavitations: false,
    },

    deficiencies: [
      "Selenium (mercury antagonist — critically depleted by 9 amalgams)",
      "Zinc (competes with mercury for binding sites)",
      "Vitamin D (fat-soluble — malabsorbed without gallbladder)",
      "Vitamin A (fat-soluble — malabsorbed without gallbladder)",
      "Vitamin E (fat-soluble — malabsorbed without gallbladder)",
      "Vitamin K2 (fat-soluble — malabsorbed without gallbladder)",
      "Iodine (breast tissue health, thyroid function)",
      "Copper (assess ceruloplasmin — gray hair indicator)",
      "Glutathione (depleted by mercury detoxification demand)",
      "Magnesium (depleted by chronic stress and mercury burden)",
      "B-complex (methylation for mercury excretion)",
    ],

    contraindications: [
      "Do NOT begin heavy metal chelation until parasites are treated (parasites harbor mercury)",
      "Amalgam removal must use SMART protocol with biological dentist — improper removal causes acute mercury exposure",
      "Fat-soluble supplements require bile salt co-administration (ox bile) due to missing gallbladder",
      "Monitor liver and kidney function during mercury mobilization",
      "Estrogen-stimulating compounds contraindicated with estrogen-dependent cancer",
      "DIM and calcium-d-glucarate should accompany any hormone-modulating protocol",
    ],

    goals: [
      "Halt breast cancer recurrence by addressing root causes",
      "Safe removal of 9 amalgam fillings using SMART protocol",
      "Mercury chelation after amalgam removal and parasite clearance",
      "Restore immune surveillance (NK cells, cytotoxic T-cells)",
      "Fix estrogen metabolism (COMT support, DIM, calcium-d-glucarate)",
      "Compensate for gallbladder loss (ox bile, bile salts, fat-soluble nutrient optimization)",
      "Rebuild microbiome resilience despite appendix removal",
      "Replenish critical nutrient deficiencies (especially fat-soluble vitamins)",
      "Comprehensive antiparasitic protocol before metal chelation",
      "Establish sustainable cancer-prevention maintenance protocol",
    ],
  };
}
