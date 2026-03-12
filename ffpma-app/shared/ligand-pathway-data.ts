export interface ProteinTarget {
  symbol: string;
  name: string;
  function: string;
  pathways: string[];
  clinicalRelevance: string[];
}

export interface Cannabinoid {
  id: string;
  name: string;
  abbreviation: string;
  type: 'phytocannabinoid' | 'acid' | 'synthetic';
  source: string;
  targets: string[];
  benefits: string[];
  considerations: string[];
}

export interface LigandPathway {
  cannabinoid: string;
  protein: string;
  effect: 'activates' | 'inhibits' | 'modulates';
  bindingAffinity: 'high' | 'moderate' | 'low';
  clinicalImplication: string;
}

export interface ConditionProfile {
  condition: string;
  category: string;
  relevantProteins: string[];
  recommendedCannabinoids: string[];
  rationale: string;
  contraindications?: string[];
}

// Pharmacokinetic (ADMET) data from in silico prediction studies
export interface CannabinoidPharmacokinetics {
  id: string;
  name: string;
  abbreviation: string;
  // Drug-likeness
  drugLikeness: number;
  // Physicochemical properties
  logS: number; // Solubility
  logD74: number; // Distribution coefficient at pH 7.4
  logP: number; // Partition coefficient
  logPapp: number; // Caco-2 permeability
  pgpInhibitor: number; // P-glycoprotein inhibitor probability
  pgpSubstrate: number; // P-glycoprotein substrate probability
  // Absorption
  hia: number; // Human intestinal absorption (%)
  f20: number; // 20% bioavailability probability
  f30: number; // 30% bioavailability probability
  // Distribution
  ppb: number; // Plasma protein binding (%)
  bbb: number; // Blood-brain barrier penetration probability
  logVD: number; // Volume of distribution
  // Metabolism (CYP450 interactions)
  cyp1a2Inhibitor: number;
  cyp1a2Substrate: number;
  cyp3a4Inhibitor: number;
  cyp3a4Substrate: number;
  cyp2c9Inhibitor: number;
  cyp2c9Substrate: number;
  cyp2c19Inhibitor: number;
  cyp2c19Substrate: number;
  cyp2d6Inhibitor: number;
  cyp2d6Substrate: number;
  // Excretion
  halfLife: number; // Hours
  clearance: number; // mL/min/kg
  // Toxicity
  herg: number; // hERG channel blocker probability
  hepatotoxicity: number; // Human hepatotoxicity probability
  ames: number; // Ames mutagenicity probability
  skinSensitization: number;
  logLD50: number; // Acute toxicity (negative log)
  dili: number; // Drug-induced liver injury probability
  fdaMDD: number; // FDA max recommended daily dose probability
}

// Comprehensive pharmacokinetic data for 12 cannabinoids
// Source: In silico ADMET prediction studies (Table S1)
export const cannabinoidPharmacokinetics: Record<string, CannabinoidPharmacokinetics> = {
  CBGA: {
    id: 'CBGA',
    name: 'Cannabigerolic Acid',
    abbreviation: 'CBGA',
    drugLikeness: 0.546,
    logS: -5.891,
    logD74: 1.558,
    logP: 5.764,
    logPapp: -5.077,
    pgpInhibitor: 0.6,
    pgpSubstrate: 0.032,
    hia: 52.9,
    f20: 40.5,
    f30: 34.2,
    ppb: 86.9,
    bbb: 0.196,
    logVD: -0.445,
    cyp1a2Inhibitor: 0.214,
    cyp1a2Substrate: 0.292,
    cyp3a4Inhibitor: 0.131,
    cyp3a4Substrate: 0.4,
    cyp2c9Inhibitor: 0.5,
    cyp2c9Substrate: 0.456,
    cyp2c19Inhibitor: 0.133,
    cyp2c19Substrate: 0.456,
    cyp2d6Inhibitor: 0.472,
    cyp2d6Substrate: 0.488,
    halfLife: 1.67,
    clearance: 1.97,
    herg: 0.465,
    hepatotoxicity: 0.56,
    ames: 0.112,
    skinSensitization: 0.484,
    logLD50: 2.616,
    dili: 0.23,
    fdaMDD: 0.606
  },
  CBG: {
    id: 'CBG',
    name: 'Cannabigerol',
    abbreviation: 'CBG',
    drugLikeness: 0.698,
    logS: -5.507,
    logD74: 1.989,
    logP: 6.066,
    logPapp: -4.936,
    pgpInhibitor: 0.665,
    pgpSubstrate: 0.116,
    hia: 70.6,
    f20: 44,
    f30: 37.7,
    ppb: 88.79,
    bbb: 0.665,
    logVD: 0.471,
    cyp1a2Inhibitor: 0.494,
    cyp1a2Substrate: 0.326,
    cyp3a4Inhibitor: 0.238,
    cyp3a4Substrate: 0.434,
    cyp2c9Inhibitor: 0.699,
    cyp2c9Substrate: 0.532,
    cyp2c19Inhibitor: 0.47,
    cyp2c19Substrate: 0.532,
    cyp2d6Inhibitor: 0.451,
    cyp2d6Substrate: 0.559,
    halfLife: 1.98,
    clearance: 1.56,
    herg: 0.669,
    hepatotoxicity: 0.464,
    ames: 0.112,
    skinSensitization: 0.618,
    logLD50: 2.159,
    dili: 0.158,
    fdaMDD: 0.572
  },
  CBDA: {
    id: 'CBDA',
    name: 'Cannabidiolic Acid',
    abbreviation: 'CBDA',
    drugLikeness: 0.564,
    logS: -5.8,
    logD74: 1.466,
    logP: 5.545,
    logPapp: -5.072,
    pgpInhibitor: 0.771,
    pgpSubstrate: 0.09,
    hia: 55.5,
    f20: 43.9,
    f30: 28.8,
    ppb: 88.1,
    bbb: 0.226,
    logVD: -0.458,
    cyp1a2Inhibitor: 0.149,
    cyp1a2Substrate: 0.3,
    cyp3a4Inhibitor: 0.24,
    cyp3a4Substrate: 0.576,
    cyp2c9Inhibitor: 0.288,
    cyp2c9Substrate: 0.494,
    cyp2c19Inhibitor: 0.2,
    cyp2c19Substrate: 0.494,
    cyp2d6Inhibitor: 0.459,
    cyp2d6Substrate: 0.425,
    halfLife: 1.96,
    clearance: 1.99,
    herg: 0.476,
    hepatotoxicity: 0.718,
    ames: 0.096,
    skinSensitization: 0.418,
    logLD50: 3.013,
    dili: 0.374,
    fdaMDD: 0.382
  },
  CBD: {
    id: 'CBD',
    name: 'Cannabidiol',
    abbreviation: 'CBD',
    drugLikeness: 0.87,
    logS: -5.258,
    logD74: 1.864,
    logP: 5.847,
    logPapp: -4.923,
    pgpInhibitor: 0.858,
    pgpSubstrate: 0.29,
    hia: 70.3,
    f20: 46.7,
    f30: 29.2,
    ppb: 88.5,
    bbb: 0.696,
    logVD: 0.582,
    cyp1a2Inhibitor: 0.312,
    cyp1a2Substrate: 0.337,
    cyp3a4Inhibitor: 0.299,
    cyp3a4Substrate: 0.597,
    cyp2c9Inhibitor: 0.319,
    cyp2c9Substrate: 0.692,
    cyp2c19Inhibitor: 0.426,
    cyp2c19Substrate: 0.692,
    cyp2d6Inhibitor: 0.511,
    cyp2d6Substrate: 0.423,
    halfLife: 2.39,
    clearance: 1.48,
    herg: 0.66,
    hepatotoxicity: 0.546,
    ames: 0.078,
    skinSensitization: 0.537,
    logLD50: 2.618,
    dili: 0.282,
    fdaMDD: 0.32
  },
  CBC: {
    id: 'CBC',
    name: 'Cannabichromene',
    abbreviation: 'CBC',
    drugLikeness: 0.626,
    logS: -4.98,
    logD74: 1.968,
    logP: 6.036,
    logPapp: -4.728,
    pgpInhibitor: 0.76,
    pgpSubstrate: 0.308,
    hia: 82.9,
    f20: 25.8,
    f30: 38.6,
    ppb: 93.7,
    bbb: 0.724,
    logVD: 0.859,
    cyp1a2Inhibitor: 0.233,
    cyp1a2Substrate: 0.326,
    cyp3a4Inhibitor: 0.469,
    cyp3a4Substrate: 0.6,
    cyp2c9Inhibitor: 0.604,
    cyp2c9Substrate: 0.528,
    cyp2c19Inhibitor: 0.669,
    cyp2c19Substrate: 0.528,
    cyp2d6Inhibitor: 0.475,
    cyp2d6Substrate: 0.386,
    halfLife: 2.35,
    clearance: 1.69,
    herg: 0.708,
    hepatotoxicity: 0.596,
    ames: 0.122,
    skinSensitization: 0.534,
    logLD50: 2.356,
    dili: 0.244,
    fdaMDD: 0.48
  },
  THCA: {
    id: 'THCA',
    name: 'Delta-9-Tetrahydrocannabinolic Acid',
    abbreviation: 'Δ9-THCA',
    drugLikeness: 0.5,
    logS: -5.434,
    logD74: 1.593,
    logP: 5.434,
    logPapp: -5.029,
    pgpInhibitor: 0.889,
    pgpSubstrate: 0.083,
    hia: 57.7,
    f20: 34.5,
    f30: 25.1,
    ppb: 94.2,
    bbb: 0.531,
    logVD: -0.164,
    cyp1a2Inhibitor: 0.161,
    cyp1a2Substrate: 0.334,
    cyp3a4Inhibitor: 0.291,
    cyp3a4Substrate: 0.73,
    cyp2c9Inhibitor: 0.418,
    cyp2c9Substrate: 0.612,
    cyp2c19Inhibitor: 0.339,
    cyp2c19Substrate: 0.612,
    cyp2d6Inhibitor: 0.476,
    cyp2d6Substrate: 0.313,
    halfLife: 2.1,
    clearance: 1.98,
    herg: 0.467,
    hepatotoxicity: 0.65,
    ames: 0.25,
    skinSensitization: 0.386,
    logLD50: 3.237,
    dili: 0.288,
    fdaMDD: 0.334
  },
  THC: {
    id: 'THC',
    name: 'Delta-9-Tetrahydrocannabinol',
    abbreviation: 'Δ9-THC',
    drugLikeness: 0.778,
    logS: -3.5,
    logD74: 2.007,
    logP: 5.736,
    logPapp: -4.746,
    pgpInhibitor: 0.922,
    pgpSubstrate: 0.226,
    hia: 82,
    f20: 20.6,
    f30: 14.1,
    ppb: 96.7,
    bbb: 0.878,
    logVD: 1.494,
    cyp1a2Inhibitor: 0.273,
    cyp1a2Substrate: 0.37,
    cyp3a4Inhibitor: 0.364,
    cyp3a4Substrate: 0.86,
    cyp2c9Inhibitor: 0.45,
    cyp2c9Substrate: 0.794,
    cyp2c19Inhibitor: 0.612,
    cyp2c19Substrate: 0.794,
    cyp2d6Inhibitor: 0.529,
    cyp2d6Substrate: 0.182,
    halfLife: 2.96,
    clearance: 1.44,
    herg: 0.657,
    hepatotoxicity: 0.848,
    ames: 0.09,
    skinSensitization: 0.535,
    logLD50: 2.666,
    dili: 0.246,
    fdaMDD: 0.248
  },
  THC8: {
    id: 'THC8',
    name: 'Delta-8-Tetrahydrocannabinol',
    abbreviation: 'Δ8-THC',
    drugLikeness: 0.53,
    logS: -3.723,
    logD74: 2.011,
    logP: 5.736,
    logPapp: -4.746,
    pgpInhibitor: 0.845,
    pgpSubstrate: 0.219,
    hia: 82,
    f20: 20.6,
    f30: 28.8,
    ppb: 96.7,
    bbb: 0.913,
    logVD: 1.458,
    cyp1a2Inhibitor: 0.281,
    cyp1a2Substrate: 0.412,
    cyp3a4Inhibitor: 0.415,
    cyp3a4Substrate: 0.734,
    cyp2c9Inhibitor: 0.535,
    cyp2c9Substrate: 0.708,
    cyp2c19Inhibitor: 0.64,
    cyp2c19Substrate: 0.708,
    cyp2d6Inhibitor: 0.537,
    cyp2d6Substrate: 0.36,
    halfLife: 2.9,
    clearance: 1.46,
    herg: 0.657,
    hepatotoxicity: 0.842,
    ames: 0.09,
    skinSensitization: 0.535,
    logLD50: 2.666,
    dili: 0.246,
    fdaMDD: 0.38
  },
  CBN: {
    id: 'CBN',
    name: 'Cannabinol',
    abbreviation: 'CBN',
    drugLikeness: 0.542,
    logS: -5.086,
    logD74: 1.861,
    logP: 5.728,
    logPapp: -4.718,
    pgpInhibitor: 0.765,
    pgpSubstrate: 0.365,
    hia: 80.7,
    f20: 32.7,
    f30: 32.6,
    ppb: 92.7,
    bbb: 0.661,
    logVD: 1.26,
    cyp1a2Inhibitor: 0.686,
    cyp1a2Substrate: 0.45,
    cyp3a4Inhibitor: 0.72,
    cyp3a4Substrate: 0.636,
    cyp2c9Inhibitor: 0.763,
    cyp2c9Substrate: 0.72,
    cyp2c19Inhibitor: 0.926,
    cyp2c19Substrate: 0.72,
    cyp2d6Inhibitor: 0.627,
    cyp2d6Substrate: 0.483,
    halfLife: 2.74,
    clearance: 1.85,
    herg: 0.647,
    hepatotoxicity: 0.81,
    ames: 0.206,
    skinSensitization: 0.399,
    logLD50: 2.619,
    dili: 0.52,
    fdaMDD: 0.456
  },
  '11-OH-THC': {
    id: '11-OH-THC',
    name: '11-Hydroxy-THC',
    abbreviation: '11-OH-THC',
    drugLikeness: 0.662,
    logS: -4.678,
    logD74: 1.811,
    logP: 4.708,
    logPapp: -4.951,
    pgpInhibitor: 0.865,
    pgpSubstrate: 0.266,
    hia: 73.2,
    f20: 37.5,
    f30: 22.8,
    ppb: 94.4,
    bbb: 0.748,
    logVD: 0.915,
    cyp1a2Inhibitor: 0.237,
    cyp1a2Substrate: 0.414,
    cyp3a4Inhibitor: 0.32,
    cyp3a4Substrate: 0.8,
    cyp2c9Inhibitor: 0.429,
    cyp2c9Substrate: 0.766,
    cyp2c19Inhibitor: 0.353,
    cyp2c19Substrate: 0.766,
    cyp2d6Inhibitor: 0.514,
    cyp2d6Substrate: 0.247,
    halfLife: 2.49,
    clearance: 1.72,
    herg: 0.639,
    hepatotoxicity: 0.718,
    ames: 0.19,
    skinSensitization: 0.4,
    logLD50: 2.856,
    dili: 0.274,
    fdaMDD: 0.224
  },
  THCV: {
    id: 'THCV',
    name: 'Delta-9-Tetrahydrocannabivarin',
    abbreviation: 'Δ9-THCV',
    drugLikeness: 0.72,
    logS: -4.708,
    logD74: 1.845,
    logP: 4.956,
    logPapp: -4.677,
    pgpInhibitor: 0.867,
    pgpSubstrate: 0.166,
    hia: 81.8,
    f20: 27.5,
    f30: 27.4,
    ppb: 94.1,
    bbb: 0.893,
    logVD: 1.301,
    cyp1a2Inhibitor: 0.194,
    cyp1a2Substrate: 0.406,
    cyp3a4Inhibitor: 0.264,
    cyp3a4Substrate: 0.818,
    cyp2c9Inhibitor: 0.281,
    cyp2c9Substrate: 0.766,
    cyp2c19Inhibitor: 0.56,
    cyp2c19Substrate: 0.766,
    cyp2d6Inhibitor: 0.509,
    cyp2d6Substrate: 0.225,
    halfLife: 2.61,
    clearance: 1.87,
    herg: 0.635,
    hepatotoxicity: 0.674,
    ames: 0.14,
    skinSensitization: 0.525,
    logLD50: 2.577,
    dili: 0.282,
    fdaMDD: 0.25
  },
  CBDV: {
    id: 'CBDV',
    name: 'Cannabidivarin',
    abbreviation: 'CBDV',
    drugLikeness: 0.778,
    logS: -5.119,
    logD74: 1.714,
    logP: 5.066,
    logPapp: -4.892,
    pgpInhibitor: 0.756,
    pgpSubstrate: 0.212,
    hia: 69.8,
    f20: 51.5,
    f30: 40,
    ppb: 87.6,
    bbb: 0.733,
    logVD: 0.53,
    cyp1a2Inhibitor: 0.19,
    cyp1a2Substrate: 0.385,
    cyp3a4Inhibitor: 0.208,
    cyp3a4Substrate: 0.572,
    cyp2c9Inhibitor: 0.158,
    cyp2c9Substrate: 0.67,
    cyp2c19Inhibitor: 0.374,
    cyp2c19Substrate: 0.67,
    cyp2d6Inhibitor: 0.483,
    cyp2d6Substrate: 0.416,
    halfLife: 2.22,
    clearance: 1.74,
    herg: 0.646,
    hepatotoxicity: 0.488,
    ames: 0.108,
    skinSensitization: 0.541,
    logLD50: 2.593,
    dili: 0.308,
    fdaMDD: 0.322
  }
};

// Helper function to get pharmacokinetic interpretation
export function interpretPharmacokinetics(cannabinoid: CannabinoidPharmacokinetics): {
  absorption: string;
  brainPenetration: string;
  metabolismRisk: string;
  toxicityProfile: string;
  overallSafety: string;
} {
  const absorption = cannabinoid.hia > 70 ? 'High absorption' : cannabinoid.hia > 50 ? 'Moderate absorption' : 'Low absorption';
  const brainPenetration = cannabinoid.bbb > 0.7 ? 'High BBB penetration' : cannabinoid.bbb > 0.4 ? 'Moderate BBB penetration' : 'Low BBB penetration';
  
  const cypInteractions = [
    cannabinoid.cyp3a4Inhibitor,
    cannabinoid.cyp2c9Inhibitor,
    cannabinoid.cyp2c19Inhibitor,
    cannabinoid.cyp2d6Inhibitor
  ];
  const avgCypInhibition = cypInteractions.reduce((a, b) => a + b, 0) / cypInteractions.length;
  const metabolismRisk = avgCypInhibition > 0.5 ? 'High drug interaction risk' : avgCypInhibition > 0.3 ? 'Moderate interaction risk' : 'Low interaction risk';
  
  const toxicityScore = (cannabinoid.hepatotoxicity + cannabinoid.ames + cannabinoid.dili) / 3;
  const toxicityProfile = toxicityScore > 0.5 ? 'Higher toxicity concern' : toxicityScore > 0.3 ? 'Moderate toxicity profile' : 'Favorable toxicity profile';
  
  const overallScore = (cannabinoid.drugLikeness + (1 - toxicityScore) + (cannabinoid.hia / 100)) / 3;
  const overallSafety = overallScore > 0.7 ? 'Excellent safety profile' : overallScore > 0.5 ? 'Good safety profile' : 'Use with caution';
  
  return { absorption, brainPenetration, metabolismRisk, toxicityProfile, overallSafety };
}

export const proteinTargets: Record<string, ProteinTarget> = {
  HMGCR: {
    symbol: 'HMGCR',
    name: 'HMG-CoA Reductase',
    function: 'Rate-limiting enzyme in cholesterol synthesis; lowering its activity helps reduce cholesterol buildup',
    pathways: ['Cholesterol metabolism', 'Lipid homeostasis', 'Steroid biosynthesis'],
    clinicalRelevance: ['Cardiovascular health', 'Prostate health', 'Liver function']
  },
  AKT1: {
    symbol: 'AKT1',
    name: 'AKT Serine/Threonine Kinase 1',
    function: 'Serine/threonine kinase localized in cholesterol-rich lipid rafts; regulates cell growth and survival',
    pathways: ['PI3K-AKT signaling', 'Cell survival', 'Apoptosis regulation', 'mTOR signaling'],
    clinicalRelevance: ['Cancer cell proliferation', 'Insulin signaling', 'Neurodegeneration']
  },
  CYP17A1: {
    symbol: 'CYP17A1',
    name: 'Cytochrome P450 17A1',
    function: 'Key enzyme in steroidogenesis; links cholesterol metabolism to androgen production',
    pathways: ['Steroid hormone biosynthesis', 'Androgen synthesis', 'Adrenal function'],
    clinicalRelevance: ['Prostate cancer', 'PCOS', 'Adrenal disorders', 'Hormone-dependent cancers']
  },
  PRKCA: {
    symbol: 'PRKCA',
    name: 'Protein Kinase C Alpha',
    function: 'Protein kinase involved in cell proliferation and triglyceride homeostasis; sensitive to cholesterol content',
    pathways: ['Calcium signaling', 'Cell proliferation', 'Lipid metabolism', 'Inflammation'],
    clinicalRelevance: ['Cancer', 'Metabolic disorders', 'Cardiac function']
  },
  PRKCB: {
    symbol: 'PRKCB',
    name: 'Protein Kinase C Beta',
    function: 'Protein kinase contributing to endothelial dysfunction and lipid metabolism',
    pathways: ['Vascular function', 'Lipid metabolism', 'Insulin signaling', 'Inflammation'],
    clinicalRelevance: ['Diabetic complications', 'Cardiovascular disease', 'Obesity']
  },
  TNF: {
    symbol: 'TNF',
    name: 'Tumor Necrosis Factor',
    function: 'Pro-inflammatory cytokine; elevated in chronic prostatitis/BPH; inflammation exacerbated by high cholesterol',
    pathways: ['NF-κB signaling', 'Apoptosis', 'Inflammation', 'Immune response'],
    clinicalRelevance: ['Chronic inflammation', 'Autoimmune diseases', 'Cancer', 'Metabolic syndrome']
  },
  CASP9: {
    symbol: 'CASP9',
    name: 'Caspase-9',
    function: 'Initiates mitochondrial apoptosis (autophagy/apoptosis often suppressed in hyperplastic tissue)',
    pathways: ['Intrinsic apoptosis', 'Mitochondrial pathway', 'Caspase cascade'],
    clinicalRelevance: ['Cancer treatment', 'Neurodegenerative diseases', 'Tissue homeostasis']
  },
  CAT: {
    symbol: 'CAT',
    name: 'Catalase',
    function: 'Detoxifies reactive oxygen species generated by lipid peroxidation',
    pathways: ['Oxidative stress response', 'ROS detoxification', 'Antioxidant defense'],
    clinicalRelevance: ['Aging', 'Oxidative damage', 'Neurodegenerative diseases', 'Liver health']
  },
  GSTA2: {
    symbol: 'GSTA2',
    name: 'Glutathione S-Transferase Alpha 2',
    function: 'Involved in detoxifying electrophilic compounds and oxidative-stress products; activity may be limited in liver/lipid overload',
    pathways: ['Glutathione metabolism', 'Phase II detoxification', 'Xenobiotic metabolism'],
    clinicalRelevance: ['Liver detoxification', 'Drug metabolism', 'Cancer prevention']
  },
  GSTM3: {
    symbol: 'GSTM3',
    name: 'Glutathione S-Transferase Mu 3',
    function: 'Phase II detoxification enzyme; protects cells from oxidative damage',
    pathways: ['Glutathione metabolism', 'Detoxification', 'Drug metabolism'],
    clinicalRelevance: ['Cancer susceptibility', 'Toxin clearance', 'Drug response']
  },
  GSTP1: {
    symbol: 'GSTP1',
    name: 'Glutathione S-Transferase Pi 1',
    function: 'Protects cells from oxidative stress and carcinogens; involved in drug resistance',
    pathways: ['Glutathione conjugation', 'Drug metabolism', 'Oxidative stress response'],
    clinicalRelevance: ['Cancer biomarker', 'Chemotherapy resistance', 'Detoxification']
  },
  HMOX1: {
    symbol: 'HMOX1',
    name: 'Heme Oxygenase 1',
    function: 'Stress-response protein with antioxidant and anti-inflammatory properties',
    pathways: ['Heme catabolism', 'Antioxidant response', 'Anti-inflammatory signaling'],
    clinicalRelevance: ['Cardiovascular protection', 'Neuroprotection', 'Anti-inflammatory']
  },
  PLCG1: {
    symbol: 'PLCG1',
    name: 'Phospholipase C Gamma 1',
    function: 'Signal transduction enzyme; generates second messengers for calcium signaling',
    pathways: ['Calcium signaling', 'IP3 pathway', 'Receptor tyrosine kinase signaling'],
    clinicalRelevance: ['Cell signaling', 'Immune function', 'Cancer']
  },
  CYCS: {
    symbol: 'CYCS',
    name: 'Cytochrome C',
    function: 'Electron carrier in respiratory chain; triggers apoptosis when released from mitochondria',
    pathways: ['Electron transport chain', 'Intrinsic apoptosis', 'Energy metabolism'],
    clinicalRelevance: ['Mitochondrial function', 'Apoptosis regulation', 'Cancer therapy']
  },
  CNR1: {
    symbol: 'CNR1',
    name: 'Cannabinoid Receptor 1',
    function: 'Primary cannabinoid receptor in CNS; modulates neurotransmitter release',
    pathways: ['Endocannabinoid signaling', 'Retrograde synaptic transmission', 'cAMP regulation'],
    clinicalRelevance: ['Pain modulation', 'Mood regulation', 'Appetite control', 'Memory']
  },
  CNR2: {
    symbol: 'CNR2',
    name: 'Cannabinoid Receptor 2',
    function: 'Cannabinoid receptor expressed in prostate tissue; reduces androgen receptor signaling and cell viability',
    pathways: ['Immune modulation', 'Inflammation regulation', 'Bone metabolism'],
    clinicalRelevance: ['Inflammation', 'Immune disorders', 'Prostate health', 'Bone density']
  },
  CREB1: {
    symbol: 'CREB1',
    name: 'CREB Binding Protein 1',
    function: 'Transcription factor regulating gene expression in response to cellular signals',
    pathways: ['Gene transcription', 'Memory formation', 'Synaptic plasticity'],
    clinicalRelevance: ['Learning and memory', 'Addiction', 'Mood disorders']
  },
  GRIN2B: {
    symbol: 'GRIN2B',
    name: 'Glutamate Ionotropic Receptor NMDA Type Subunit 2B',
    function: 'NMDA receptor subunit; crucial for synaptic plasticity and memory',
    pathways: ['Glutamate signaling', 'Synaptic plasticity', 'Long-term potentiation'],
    clinicalRelevance: ['Cognition', 'Pain processing', 'Neurodevelopment', 'Schizophrenia']
  },
  COMT: {
    symbol: 'COMT',
    name: 'Catechol-O-Methyltransferase',
    function: 'Degrades catecholamines (dopamine, norepinephrine, epinephrine)',
    pathways: ['Catecholamine metabolism', 'Dopamine regulation', 'Estrogen metabolism'],
    clinicalRelevance: ['Pain sensitivity', 'Psychiatric disorders', 'Parkinson\'s disease']
  }
};

export const cannabinoids: Record<string, Cannabinoid> = {
  CBD: {
    id: 'CBD',
    name: 'Cannabidiol',
    abbreviation: 'CBD',
    type: 'phytocannabinoid',
    source: 'Cannabis sativa (hemp)',
    targets: ['CNR1', 'CNR2', 'HMGCR', 'AKT1', 'CYP17A1', 'CASP9', 'CAT', 'GSTA2', 'GSTP1', 'HMOX1', 'PLCG1'],
    benefits: [
      'Anti-inflammatory',
      'Anxiolytic (anti-anxiety)',
      'Neuroprotective',
      'Anti-seizure',
      'Pain modulation',
      'Antioxidant',
      'Anti-tumor (research stage)'
    ],
    considerations: [
      'CYP450 enzyme inhibition (drug interactions)',
      'May increase blood levels of other medications',
      'Biphasic dosing effects',
      'Quality and source verification important'
    ]
  },
  CBDA: {
    id: 'CBDA',
    name: 'Cannabidiolic Acid',
    abbreviation: 'CBDA',
    type: 'acid',
    source: 'Raw cannabis (decarboxylates to CBD)',
    targets: ['HMGCR', 'AKT1', 'CYP17A1', 'CASP9', 'CAT'],
    benefits: [
      'Anti-nausea (potentially more potent than CBD)',
      'Anti-inflammatory',
      'COX-2 inhibition',
      'Anti-tumor properties (research)'
    ],
    considerations: [
      'Heat-sensitive (degrades to CBD)',
      'Requires raw/fresh cannabis',
      'Less researched than CBD'
    ]
  },
  THC: {
    id: 'THC',
    name: 'Delta-9-Tetrahydrocannabinol',
    abbreviation: 'Δ9-THC',
    type: 'phytocannabinoid',
    source: 'Cannabis sativa',
    targets: ['CNR1', 'CNR2', 'PRKCA', 'PRKCB', 'GSTA2', 'TNF'],
    benefits: [
      'Pain relief',
      'Appetite stimulation',
      'Anti-nausea',
      'Muscle relaxation',
      'Sleep aid',
      'Glaucoma (IOP reduction)'
    ],
    considerations: [
      'Psychoactive effects',
      'Impairs short-term memory',
      'May increase anxiety at high doses',
      'Legal restrictions in many jurisdictions'
    ]
  },
  THC8: {
    id: 'THC8',
    name: 'Delta-8-Tetrahydrocannabinol',
    abbreviation: 'Δ8-THC',
    type: 'phytocannabinoid',
    source: 'Cannabis (trace amounts), converted from CBD',
    targets: ['CNR1', 'CNR2', 'TNF'],
    benefits: [
      'Milder psychoactive effects than Δ9-THC',
      'Anti-nausea',
      'Appetite stimulation',
      'Pain relief',
      'Anxiolytic'
    ],
    considerations: [
      'Legal status varies',
      'Often synthetically converted',
      'Less research available'
    ]
  },
  CBN: {
    id: 'CBN',
    name: 'Cannabinol',
    abbreviation: 'CBN',
    type: 'phytocannabinoid',
    source: 'Oxidation product of THC',
    targets: ['CNR1', 'CNR2', 'PRKCA', 'PRKCB', 'GSTA2'],
    benefits: [
      'Sedative effects',
      'Sleep aid',
      'Appetite stimulation',
      'Antibacterial',
      'Pain relief'
    ],
    considerations: [
      'Mildly psychoactive',
      'Best used with other cannabinoids',
      'Forms from aged cannabis'
    ]
  },
  CBC: {
    id: 'CBC',
    name: 'Cannabichromene',
    abbreviation: 'CBC',
    type: 'phytocannabinoid',
    source: 'Cannabis sativa',
    targets: ['PRKCA', 'PRKCB', 'GSTA2', 'TRPV1', 'TRPA1'],
    benefits: [
      'Anti-inflammatory',
      'Antidepressant potential',
      'Pain relief (via TRP channels)',
      'Neurogenesis (brain cell growth)',
      'Antimicrobial'
    ],
    considerations: [
      'Non-psychoactive',
      'Often present in full-spectrum products',
      'Synergizes with other cannabinoids'
    ]
  },
  CBG: {
    id: 'CBG',
    name: 'Cannabigerol',
    abbreviation: 'CBG',
    type: 'phytocannabinoid',
    source: 'Cannabis sativa (precursor cannabinoid)',
    targets: ['CNR1', 'CNR2', 'TRPV1', 'PPAR-γ', 'α2-adrenergic'],
    benefits: [
      'Antibacterial (including MRSA)',
      'Anti-inflammatory',
      'Neuroprotective',
      'Appetite stimulation (without psychoactive effects)',
      'Potential anti-cancer properties'
    ],
    considerations: [
      'Non-psychoactive',
      'Expensive to produce (low yields)',
      'Parent molecule to all cannabinoids'
    ]
  },
  CBGA: {
    id: 'CBGA',
    name: 'Cannabigerolic Acid',
    abbreviation: 'CBGA',
    type: 'acid',
    source: 'Raw cannabis (mother of all cannabinoids)',
    targets: ['PPAR-α', 'PPAR-γ', 'COX-1', 'COX-2'],
    benefits: [
      'Metabolic regulation',
      'Anti-inflammatory',
      'Precursor to all other cannabinoids'
    ],
    considerations: [
      'Heat-sensitive',
      'Found in raw/fresh cannabis only',
      'Limited direct research'
    ]
  }
};

export const ligandPathways: LigandPathway[] = [
  { cannabinoid: 'CBD', protein: 'HMGCR', effect: 'inhibits', bindingAffinity: 'moderate', clinicalImplication: 'May help reduce cholesterol synthesis' },
  { cannabinoid: 'CBD', protein: 'AKT1', effect: 'modulates', bindingAffinity: 'high', clinicalImplication: 'Affects cell growth and survival signaling' },
  { cannabinoid: 'CBD', protein: 'CYP17A1', effect: 'inhibits', bindingAffinity: 'moderate', clinicalImplication: 'May reduce androgen production' },
  { cannabinoid: 'CBD', protein: 'CAT', effect: 'activates', bindingAffinity: 'moderate', clinicalImplication: 'Enhances antioxidant capacity' },
  { cannabinoid: 'CBD', protein: 'CASP9', effect: 'activates', bindingAffinity: 'moderate', clinicalImplication: 'Promotes apoptosis in abnormal cells' },
  { cannabinoid: 'CBDA', protein: 'HMGCR', effect: 'inhibits', bindingAffinity: 'moderate', clinicalImplication: 'Cholesterol regulation' },
  { cannabinoid: 'CBDA', protein: 'AKT1', effect: 'modulates', bindingAffinity: 'moderate', clinicalImplication: 'Cell signaling modulation' },
  { cannabinoid: 'THC', protein: 'CNR1', effect: 'activates', bindingAffinity: 'high', clinicalImplication: 'Primary psychoactive and pain-relieving mechanism' },
  { cannabinoid: 'THC', protein: 'CNR2', effect: 'activates', bindingAffinity: 'moderate', clinicalImplication: 'Immune modulation and anti-inflammation' },
  { cannabinoid: 'THC', protein: 'PRKCA', effect: 'modulates', bindingAffinity: 'moderate', clinicalImplication: 'Cell proliferation effects' },
  { cannabinoid: 'THC', protein: 'PRKCB', effect: 'modulates', bindingAffinity: 'moderate', clinicalImplication: 'Vascular and metabolic effects' },
  { cannabinoid: 'THC', protein: 'GSTA2', effect: 'activates', bindingAffinity: 'low', clinicalImplication: 'Detoxification support' },
  { cannabinoid: 'CBC', protein: 'PRKCA', effect: 'modulates', bindingAffinity: 'moderate', clinicalImplication: 'Anti-inflammatory action' },
  { cannabinoid: 'CBC', protein: 'PRKCB', effect: 'modulates', bindingAffinity: 'moderate', clinicalImplication: 'Metabolic regulation' },
  { cannabinoid: 'CBC', protein: 'GSTA2', effect: 'activates', bindingAffinity: 'low', clinicalImplication: 'Antioxidant support' },
  { cannabinoid: 'CBN', protein: 'CNR1', effect: 'activates', bindingAffinity: 'low', clinicalImplication: 'Mild sedative effects' },
  { cannabinoid: 'CBN', protein: 'CNR2', effect: 'activates', bindingAffinity: 'low', clinicalImplication: 'Immune modulation' },
  { cannabinoid: 'CBN', protein: 'PRKCA', effect: 'modulates', bindingAffinity: 'low', clinicalImplication: 'Cell signaling' },
  { cannabinoid: 'CBN', protein: 'PRKCB', effect: 'modulates', bindingAffinity: 'low', clinicalImplication: 'Metabolic effects' },
  { cannabinoid: 'CBN', protein: 'GSTA2', effect: 'activates', bindingAffinity: 'low', clinicalImplication: 'Detox support' },
  { cannabinoid: 'THC8', protein: 'CNR1', effect: 'activates', bindingAffinity: 'moderate', clinicalImplication: 'Milder psychoactive effects than Δ9-THC' },
  { cannabinoid: 'THC8', protein: 'TNF', effect: 'inhibits', bindingAffinity: 'moderate', clinicalImplication: 'Anti-inflammatory' },
  { cannabinoid: 'CBG', protein: 'CNR1', effect: 'modulates', bindingAffinity: 'low', clinicalImplication: 'Partial agonist effects' },
  { cannabinoid: 'CBG', protein: 'CNR2', effect: 'modulates', bindingAffinity: 'low', clinicalImplication: 'Immune modulation' }
];

export const conditionProfiles: ConditionProfile[] = [
  {
    condition: 'Prostate Health / BPH',
    category: 'Urological',
    relevantProteins: ['HMGCR', 'AKT1', 'CYP17A1', 'PRKCA', 'PRKCB', 'TNF', 'CASP9', 'CAT', 'GSTA2', 'CNR1', 'CNR2'],
    recommendedCannabinoids: ['CBD', 'CBDA', 'CBC'],
    rationale: 'CBD/CBDA inhibit cholesterol metabolism and androgen synthesis pathways; CBC provides anti-inflammatory support; CNR1/CNR2 activation reduces androgen receptor signaling'
  },
  {
    condition: 'Chronic Inflammation',
    category: 'Inflammatory',
    relevantProteins: ['TNF', 'PRKCA', 'PRKCB', 'CNR2', 'HMOX1'],
    recommendedCannabinoids: ['CBD', 'CBC', 'CBG', 'THC8'],
    rationale: 'TNF inhibition reduces inflammatory cascades; CB2 activation modulates immune response; HMOX1 activation provides antioxidant protection'
  },
  {
    condition: 'Anxiety/Mood Disorders',
    category: 'Neuropsychiatric',
    relevantProteins: ['CNR1', 'CNR2', 'CREB1', 'GRIN2B', 'COMT'],
    recommendedCannabinoids: ['CBD', 'CBG'],
    rationale: 'Modulation of cannabinoid receptors without psychoactive effects; CREB involvement in mood regulation',
    contraindications: ['THC may worsen anxiety at high doses']
  },
  {
    condition: 'Pain Management',
    category: 'Neurological',
    relevantProteins: ['CNR1', 'CNR2', 'GRIN2B', 'TNF', 'COMT'],
    recommendedCannabinoids: ['CBD', 'THC', 'CBC', 'CBG'],
    rationale: 'CB1 activation provides central pain relief; CB2 reduces inflammatory pain; NMDA modulation for neuropathic pain'
  },
  {
    condition: 'Oxidative Stress / Aging',
    category: 'Metabolic',
    relevantProteins: ['CAT', 'GSTA2', 'GSTM3', 'GSTP1', 'HMOX1'],
    recommendedCannabinoids: ['CBD', 'CBDA', 'CBC'],
    rationale: 'Activation of antioxidant enzymes; enhanced glutathione metabolism; heme oxygenase induction'
  },
  {
    condition: 'Sleep Disorders',
    category: 'Neurological',
    relevantProteins: ['CNR1', 'CREB1'],
    recommendedCannabinoids: ['CBN', 'CBD', 'THC'],
    rationale: 'CBN provides sedative effects; CBD at higher doses promotes sleep; THC reduces sleep latency'
  },
  {
    condition: 'Nausea/Appetite Issues',
    category: 'Gastrointestinal',
    relevantProteins: ['CNR1', 'CNR2'],
    recommendedCannabinoids: ['THC', 'CBDA', 'THC8', 'CBG'],
    rationale: 'CB1 activation stimulates appetite; CBDA particularly effective for nausea via serotonin receptors'
  },
  {
    condition: 'Cardiovascular / Cholesterol',
    category: 'Cardiovascular',
    relevantProteins: ['HMGCR', 'PRKCB', 'TNF', 'HMOX1'],
    recommendedCannabinoids: ['CBD', 'CBDA', 'CBG'],
    rationale: 'HMGCR inhibition reduces cholesterol; anti-inflammatory effects protect vasculature; HMOX1 is cardioprotective'
  }
];

export function getPathwaysForCannabinoid(cannabinoidId: string): LigandPathway[] {
  return ligandPathways.filter(lp => lp.cannabinoid === cannabinoidId);
}

export function getCannabinoidsByProtein(proteinSymbol: string): string[] {
  return ligandPathways
    .filter(lp => lp.protein === proteinSymbol)
    .map(lp => lp.cannabinoid);
}

export function getConditionRecommendations(condition: string): ConditionProfile | undefined {
  return conditionProfiles.find(cp => 
    cp.condition.toLowerCase().includes(condition.toLowerCase())
  );
}

export function getProteinsForCondition(condition: string): ProteinTarget[] {
  const profile = getConditionRecommendations(condition);
  if (!profile) return [];
  return profile.relevantProteins
    .map(symbol => proteinTargets[symbol])
    .filter(Boolean);
}
