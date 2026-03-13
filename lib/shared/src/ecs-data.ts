// ECS Ligand Pathway Calculator Data
// Based on Network-Based Pharmacology Study (Li et al., Applied Sciences 2022)
// Source: MasterListofECS.xlsx - Tables S1 through S6
// Table S1: Drug-like properties (ADMET) of 12 cannabinoids (32 properties each)
// Table S2: Putative targets of 12 cannabinoids (234 unique genes)
// Table S3: GO function enrichment analysis (140 terms, top 50 included)
// Table S4: KEGG pathway enrichment analysis (101 pathways)
// Table S5: Disease-pathway mappings (67 entries)
// Table S6: Integrated centrality values of 122 protein targets

export interface PharmacokineticsData {
  bbb: number;
  hia: number;
  halfLife: number;
  ppb: number;
  amesToxicity: number;
  diliRisk: number;
  hergRisk: number;
  drugLikeness: number;
  logS: number;
  logD7_4: number;
  logP: number;
  logPapp: number;
  pgpInhibitor: number;
  pgpSubstrate: number;
  f20Bioavailability: number;
  f30Bioavailability: number;
  logVD: number;
  clearance: number;
  hepatotoxicity: number;
  skinSensitization: number;
  logLD50: number;
  fdamdd: number;
}

export interface CYP450Interaction {
  enzyme: string;
  inhibitorScore: number;
  substrateScore: number;
  affinityScore: number;
  highRiskDrugs: string[];
}

export interface Cannabinoid {
  id: string;
  name: string;
  fullName: string;
  type: 'acidic' | 'neutral' | 'metabolite';
  psychoactive: boolean;
  description: string;
  proteinTargets: string[];
  bindingAffinities: Record<string, number>;
  pharmacokinetics: PharmacokineticsData;
  cyp450Interactions: CYP450Interaction[];
}

export interface ClinicalPrescribingEntry {
  condition: string;
  category: 'cancer' | 'neurological' | 'inflammatory' | 'pain' | 'mental_health' | 'sleep' | 'metabolic' | 'immune' | 'gut';
  primaryTargets: string[];
  recommendedCannabinoids: string[];
  ratio: string;
  deliveryMethod: string;
  rationale: string;
  recommendedProducts: string[];
}

export interface AdverseEffectCategory {
  id: string;
  name: string;
  riskPopulations: string[];
  molecularTargets: string[];
  mechanism: string;
  symptoms: string[];
  mitigationStrategies: string[];
  implicated: string[];
}

export interface ProteinTarget {
  id: string;
  symbol: string;
  name: string;
  uniprot: string;
  module: number;
  icValue: number;
  functions: string[];
  relatedConditions: string[];
}

export interface HealthCondition {
  id: string;
  name: string;
  category: string;
  keggPathways: string[];
  proteinTargets: string[];
  effectType: 'beneficial' | 'adverse' | 'research';
  description: string;
}

export interface ProductMapping {
  productName: string;
  productType: 'supplement' | 'topical';
  cannabinoids: string[];
  primaryIndications: string[];
  ligandScore: number;
}

export interface GOEnrichmentTerm {
  id: string;
  description: string;
  geneRatio: string;
  pAdjust: number;
  genes: string[];
  count: number;
}

export interface KEGGPathway {
  id: string;
  description: string;
  category: string;
  geneRatio: string;
  pAdjust: number;
  genes: string[];
  count: number;
}

export interface DiseasePathwayMapping {
  pathwayId: string;
  pathwayDescription: string;
  pathwayCategory: string;
  diseaseId: string;
  diseaseDescription: string;
  diseaseCategory: string;
  effect: 'beneficial' | 'adverse' | 'unknown';
}

// 12 Key Cannabinoids with complete ADMET profiles (Table S1) and all putative targets (Table S2)
export const cannabinoids: Cannabinoid[] = [
  {
    id: 'cbd',
    name: 'CBD',
    fullName: 'Cannabidiol',
    type: 'neutral',
    psychoactive: false,
    description: 'Non-psychoactive cannabinoid with broad therapeutic potential. Key component for anti-inflammatory, neuroprotective, and anti-anxiety effects. Targets the most proteins of all cannabinoids (126 putative targets).',
    proteinTargets: ['AANAT', 'ABCB1', 'ABCC1', 'ABCG2', 'ACAT1', 'ACTA1', 'ADORA1', 'AHR', 'AKT1', 'ALOX12', 'ALOX12B', 'ALOX15', 'ALOX15B', 'ALOX5', 'ALOXE3', 'AR', 'ARHGAP5', 'CACNA1C', 'CACNA1G', 'CACNA1H', 'CACNA1I', 'CASP7', 'CASP9', 'CAT', 'CCL3', 'CCL4', 'CCL5', 'CETP', 'CHRNA7', 'CNR1', 'CNR2', 'CRYZ', 'CSDE1', 'CXCL8', 'CYBA', 'CYP17A1', 'CYP1A1', 'CYP1A2', 'CYP1B1', 'CYP2C19', 'CYP2C9', 'CYP2D6', 'CYP3A4', 'CYP3A5', 'CYP3A7', 'CYTB', 'DAGLA', 'EXOC6', 'FAAH', 'FBP1', 'FLT1', 'FLT4', 'FTL', 'GHRL', 'GLRA1', 'GLRA3', 'GLRB', 'GNA11', 'GPR12', 'GPR18', 'GPR55', 'GPX1', 'GSR', 'H3F3B', 'HBA2', 'HMGCR', 'HTR1A', 'HTR2A', 'HTR3A', 'ICAM1', 'ID1', 'IDO1', 'IFNA1', 'IFNG', 'IL1B', 'IL2', 'INS', 'KYNU', 'MAPT', 'MB', 'MEN1', 'MOG', 'MRGPRX1', 'NAAA', 'NAPEPLD', 'NISCH', 'NMRK1', 'NOS2', 'NOX1', 'NOX4', 'OPRD1', 'OPRM1', 'PARP1', 'PLA2G1B', 'PLA2G4F', 'PMP2', 'PPARG', 'PRKCA', 'PTGS1', 'PTGS2', 'RHOA', 'RORC', 'S1PR1', 'SCN8A', 'SLC29A1', 'SMPD1', 'SOCS3', 'SOD1', 'SOD2', 'TDP1', 'TIMP1', 'TNF', 'TRPA1', 'TRPM8', 'TRPV1', 'TRPV2', 'TRPV3', 'TRPV4', 'UGT1A1', 'UGT1A10', 'UGT1A7', 'UGT1A8', 'UGT1A9', 'UGT2B7', 'VCAM1', 'VDAC1'],
    bindingAffinities: { 'AKT1': -8.6, 'CASP9': -5.8, 'CAT': -7.5, 'CYP17A1': -7.4, 'CNR1': -7.3, 'CNR2': -9.2, 'PRKCA': -7.8, 'TNF': -6.0 },
    pharmacokinetics: { bbb: 0.696, hia: 70.3, halfLife: 2.39, ppb: 88.5, amesToxicity: 0.078, diliRisk: 0.282, hergRisk: 0.66, drugLikeness: 0.87, logS: -5.258, logD7_4: 1.864, logP: 5.847, logPapp: -4.923, pgpInhibitor: 0.858, pgpSubstrate: 0.29, f20Bioavailability: 46.7, f30Bioavailability: 29.2, logVD: 0.582, clearance: 1.48, hepatotoxicity: 0.546, skinSensitization: 0.537, logLD50: 2.618, fdamdd: 0.32 },
    cyp450Interactions: [
      { enzyme: 'CYP2C9', inhibitorScore: 0.319, substrateScore: 0.692, affinityScore: 0.692, highRiskDrugs: ['Anticoagulants (warfarin, apixaban)', 'NSAIDs (ibuprofen, diclofenac)', 'Sulfonylureas (glipizide, glyburide)'] },
      { enzyme: 'CYP2C19', inhibitorScore: 0.426, substrateScore: 0.692, affinityScore: 0.692, highRiskDrugs: ['Antiepileptics (clobazam, phenytoin)', 'PPIs (omeprazole, lansoprazole)', 'Antidepressants (citalopram, escitalopram)', 'Antiplatelet (clopidogrel)'] },
      { enzyme: 'CYP3A4', inhibitorScore: 0.299, substrateScore: 0.597, affinityScore: 0.597, highRiskDrugs: ['Statins (atorvastatin, simvastatin)', 'Immunosuppressants (tacrolimus, cyclosporine)', 'Chemotherapy (docetaxel, paclitaxel)'] },
      { enzyme: 'CYP2D6', inhibitorScore: 0.511, substrateScore: 0.423, affinityScore: 0.511, highRiskDrugs: ['Antidepressants (fluoxetine, paroxetine)', 'Opioids (codeine, tramadol)', 'Beta-blockers (metoprolol)'] }
    ]
  },
  {
    id: 'cbda',
    name: 'CBDA',
    fullName: 'Cannabidiolic Acid',
    type: 'acidic',
    psychoactive: false,
    description: 'Raw, acidic precursor to CBD. Superior anti-inflammatory and anti-nausea properties via serotonin receptor modulation. Second-highest target count (121 putative targets).',
    proteinTargets: ['AANAT', 'ABCB1', 'ABCC1', 'ABCG2', 'ACAT1', 'ACTA1', 'ADORA1', 'AHR', 'AKT1', 'ALB', 'ALOX12', 'ALOX12B', 'ALOX15', 'ALOX15B', 'ALOX5', 'ALOXE3', 'CACNA1G', 'CACNA1H', 'CACNA1I', 'CASP7', 'CASP9', 'CAT', 'CCL3', 'CCL4', 'CCL5', 'CHRNA7', 'CNR1', 'CNR2', 'CRYZ', 'CSDE1', 'CXCL8', 'CYBA', 'CYP17A1', 'CYP1A1', 'CYP1A2', 'CYP1B1', 'CYP2C19', 'CYP2C9', 'CYP2D6', 'CYP3A4', 'CYP3A5', 'CYP3A7', 'DAGLA', 'FAAH', 'GHRL', 'GLRA1', 'GLRA3', 'GLRB', 'GNA11', 'GPR12', 'GPR18', 'GPR55', 'GPX1', 'GSR', 'HBA2', 'HMGCR', 'HTR1A', 'HTR2A', 'HTR3A', 'ICAM1', 'ID1', 'IDO1', 'IFNA1', 'IFNG', 'IL1B', 'IL2', 'INS', 'KYNU', 'MAPKAPK2', 'MAPKAPK3', 'MAPKAPK5', 'MAPT', 'MRGPRX1', 'NAAA', 'NAPEPLD', 'NISCH', 'NMRK1', 'NOS2', 'NOX1', 'NOX4', 'OPRD1', 'OPRM1', 'PLA2G1B', 'PMP2', 'PPARG', 'PRKCA', 'PTGS1', 'PTGS2', 'PTPN1', 'PTPN2', 'RHOA', 'RUNX1T1', 'S1PR1', 'SCN8A', 'SLC29A1', 'SMPD1', 'SOCS3', 'SOD1', 'TDP1', 'TIMP1', 'TNF', 'TRPA1', 'TRPM8', 'TRPV1', 'TRPV2', 'TRPV3', 'TRPV4', 'UGT1A1', 'UGT1A10', 'UGT1A7', 'UGT1A8', 'UGT1A9', 'UGT2B7', 'VCAM1', 'VDAC1'],
    bindingAffinities: { 'AKT1': -8.8, 'CASP9': -5.9, 'CAT': -7.9, 'CYP17A1': -7.0, 'CNR1': -7.1, 'CNR2': -7.3, 'PRKCA': -6.7, 'TNF': -10.5 },
    pharmacokinetics: { bbb: 0.226, hia: 55.5, halfLife: 1.96, ppb: 88.1, amesToxicity: 0.096, diliRisk: 0.374, hergRisk: 0.476, drugLikeness: 0.564, logS: -5.8, logD7_4: 1.466, logP: 5.545, logPapp: -5.072, pgpInhibitor: 0.771, pgpSubstrate: 0.09, f20Bioavailability: 43.9, f30Bioavailability: 28.8, logVD: -0.458, clearance: 1.99, hepatotoxicity: 0.718, skinSensitization: 0.418, logLD50: 3.013, fdamdd: 0.382 },
    cyp450Interactions: [
      { enzyme: 'CYP3A4', inhibitorScore: 0.24, substrateScore: 0.576, affinityScore: 0.576, highRiskDrugs: ['Statins (atorvastatin, simvastatin)', 'Immunosuppressants (tacrolimus, cyclosporine)', 'Chemotherapy (docetaxel, paclitaxel)'] },
      { enzyme: 'CYP2C9', inhibitorScore: 0.288, substrateScore: 0.494, affinityScore: 0.494, highRiskDrugs: ['Anticoagulants (warfarin, apixaban)', 'NSAIDs (ibuprofen, diclofenac)', 'Sulfonylureas (glipizide, glyburide)'] },
      { enzyme: 'CYP2C19', inhibitorScore: 0.2, substrateScore: 0.494, affinityScore: 0.494, highRiskDrugs: ['Antiepileptics (clobazam, phenytoin)', 'PPIs (omeprazole, lansoprazole)', 'Antidepressants (citalopram, escitalopram)', 'Antiplatelet (clopidogrel)'] },
      { enzyme: 'CYP2D6', inhibitorScore: 0.459, substrateScore: 0.425, affinityScore: 0.459, highRiskDrugs: ['Antidepressants (fluoxetine, paroxetine)', 'Opioids (codeine, tramadol)', 'Beta-blockers (metoprolol)'] }
    ]
  },
  {
    id: 'cbg',
    name: 'CBG',
    fullName: 'Cannabigerol',
    type: 'neutral',
    psychoactive: false,
    description: 'The "mother cannabinoid" from which other cannabinoids are synthesized. Strong antibacterial, anti-inflammatory, and neuroprotective properties.',
    proteinTargets: ['ACTA1', 'ALOX12', 'ALOX12B', 'ALOX15', 'ALOX15B', 'ALOX5', 'ALOXE3', 'AR', 'AZGP1', 'CITED2', 'CNR1', 'CNR2', 'CSDE1', 'CUL1', 'CYCS', 'EXOC6', 'FBP1', 'FYN', 'GALM', 'GPI', 'GPR55', 'H3F3B', 'HSD17B4', 'IQUB', 'MOG', 'NR1I3', 'PATJ', 'PMP2', 'PPARA', 'PPARD', 'PPARG', 'RBP5', 'SENP7', 'TDP1', 'TRPA1', 'TRPM8', 'TRPV1', 'TRPV2', 'USP19', 'YES1'],
    bindingAffinities: { 'CYCS': -4.7, 'CNR1': -7.9, 'CNR2': -6.9, 'PRKCA': -7.4 },
    pharmacokinetics: { bbb: 0.665, hia: 70.6, halfLife: 1.98, ppb: 88.79, amesToxicity: 0.112, diliRisk: 0.158, hergRisk: 0.669, drugLikeness: 0.698, logS: -5.507, logD7_4: 1.989, logP: 6.066, logPapp: -4.936, pgpInhibitor: 0.665, pgpSubstrate: 0.116, f20Bioavailability: 44.0, f30Bioavailability: 37.7, logVD: 0.471, clearance: 1.56, hepatotoxicity: 0.464, skinSensitization: 0.618, logLD50: 2.159, fdamdd: 0.572 },
    cyp450Interactions: [
      { enzyme: 'CYP2C9', inhibitorScore: 0.699, substrateScore: 0.532, affinityScore: 0.699, highRiskDrugs: ['Anticoagulants (warfarin, apixaban)', 'NSAIDs (ibuprofen, diclofenac)', 'Sulfonylureas (glipizide, glyburide)'] },
      { enzyme: 'CYP2D6', inhibitorScore: 0.451, substrateScore: 0.559, affinityScore: 0.559, highRiskDrugs: ['Antidepressants (fluoxetine, paroxetine)', 'Opioids (codeine, tramadol)', 'Beta-blockers (metoprolol)'] },
      { enzyme: 'CYP2C19', inhibitorScore: 0.47, substrateScore: 0.532, affinityScore: 0.532, highRiskDrugs: ['Antiepileptics (clobazam, phenytoin)', 'PPIs (omeprazole, lansoprazole)', 'Antidepressants (citalopram, escitalopram)', 'Antiplatelet (clopidogrel)'] },
      { enzyme: 'CYP1A2', inhibitorScore: 0.494, substrateScore: 0.326, affinityScore: 0.494, highRiskDrugs: ['Theophylline', 'Caffeine', 'Clozapine', 'Fluvoxamine'] },
      { enzyme: 'CYP3A4', inhibitorScore: 0.238, substrateScore: 0.434, affinityScore: 0.434, highRiskDrugs: ['Statins (atorvastatin, simvastatin)', 'Immunosuppressants (tacrolimus, cyclosporine)', 'Chemotherapy (docetaxel, paclitaxel)'] }
    ]
  },
  {
    id: 'cbga',
    name: 'CBGA',
    fullName: 'Cannabigerolic Acid',
    type: 'acidic',
    psychoactive: false,
    description: 'Acidic precursor to CBG. The primary building block for all cannabinoids. Supports metabolic and inflammatory pathways.',
    proteinTargets: ['ACR', 'ACTA1', 'ACTR3', 'ALOX12', 'ALOX15', 'ALOX15B', 'ALOX5', 'AR', 'ARHGAP5', 'B2M', 'CMAS', 'CNR1', 'CNR2', 'CRSP9', 'CSDE1', 'EXOC6', 'GPI', 'H3F3B', 'HBA2', 'HSD17B4', 'KYNU', 'MAP3K3', 'MAPKAPK2', 'MAPKAPK3', 'MAPKAPK5', 'MAPT', 'MBNL1', 'MBNL2', 'MBNL3', 'MOG', 'NMRK1', 'PLCG1', 'PMP2', 'PTGS1', 'PTGS2', 'RUNX1T1', 'SAE1', 'TCEA3', 'TIMM9', 'TRAF4', 'TRPA1', 'TRPV2', 'VDR', 'ZEB2'],
    bindingAffinities: { 'PLCG1': -5.6, 'CNR1': -6.9, 'CNR2': -7.0 },
    pharmacokinetics: { bbb: 0.196, hia: 52.9, halfLife: 1.67, ppb: 86.9, amesToxicity: 0.112, diliRisk: 0.23, hergRisk: 0.465, drugLikeness: 0.546, logS: -5.891, logD7_4: 1.558, logP: 5.764, logPapp: -5.077, pgpInhibitor: 0.6, pgpSubstrate: 0.032, f20Bioavailability: 40.5, f30Bioavailability: 34.2, logVD: -0.445, clearance: 1.97, hepatotoxicity: 0.56, skinSensitization: 0.484, logLD50: 2.616, fdamdd: 0.606 },
    cyp450Interactions: [
      { enzyme: 'CYP2C9', inhibitorScore: 0.5, substrateScore: 0.456, affinityScore: 0.5, highRiskDrugs: ['Anticoagulants (warfarin, apixaban)', 'NSAIDs (ibuprofen, diclofenac)', 'Sulfonylureas (glipizide, glyburide)'] },
      { enzyme: 'CYP2D6', inhibitorScore: 0.472, substrateScore: 0.488, affinityScore: 0.488, highRiskDrugs: ['Antidepressants (fluoxetine, paroxetine)', 'Opioids (codeine, tramadol)', 'Beta-blockers (metoprolol)'] },
      { enzyme: 'CYP2C19', inhibitorScore: 0.133, substrateScore: 0.456, affinityScore: 0.456, highRiskDrugs: ['Antiepileptics (clobazam, phenytoin)', 'PPIs (omeprazole, lansoprazole)', 'Antidepressants (citalopram, escitalopram)', 'Antiplatelet (clopidogrel)'] }
    ]
  },
  {
    id: 'cbn',
    name: 'CBN',
    fullName: 'Cannabinol',
    type: 'neutral',
    psychoactive: false,
    description: 'Mildly sedating cannabinoid formed from THC degradation. Excellent for sleep, appetite stimulation, and pain relief. Highest CYP2C19 inhibition (0.926).',
    proteinTargets: ['ABCB1', 'ABCC1', 'ABCG2', 'ACTA1', 'ADCY10', 'AHR', 'ALOX12', 'ALOX15', 'ALOX5', 'AR', 'ATF2', 'CNR1', 'CNR2', 'COMT', 'CREB1', 'CSDE1', 'CUL1', 'CYP1A1', 'CYP1A2', 'CYP1B1', 'CYP2A6', 'CYP2C19', 'CYP2C9', 'CYP2D6', 'CYP3A4', 'CYTB', 'DGKA', 'DRD2', 'ESR1', 'ESR2', 'EXOC6', 'FASN', 'GCLC', 'GPI', 'GSTA2', 'GSTM3', 'GSTO1', 'GSTP1', 'H3F3B', 'HBB', 'HMOX1', 'HSD17B4', 'IL2', 'KCNIP3', 'MAPT', 'NISCH', 'NMRK1', 'NPL', 'NQO1', 'NR1I2', 'NR3C1', 'NR3C2', 'PGR', 'PMP2', 'PPP2CA', 'PPP2CB', 'PRKCA', 'PRKCB', 'PTGS1', 'SEC14L2', 'SEC14L4', 'SIGMAR1', 'SOD1', 'SOD2', 'TCEA3', 'TDP1', 'TTPA', 'UGT1A1', 'UGT1A10', 'UGT1A7', 'UGT1A8', 'UGT1A9', 'UGT2B7'],
    bindingAffinities: { 'COMT': -8.0, 'CREB1': -6.6, 'CNR1': -9.4, 'CNR2': -8.5, 'GSTA2': -6.5, 'GSTM3': -7.6, 'GSTP1': -8.1, 'HMOX1': -7.7, 'PRKCA': -8.2, 'PRKCB': -8.5 },
    pharmacokinetics: { bbb: 0.661, hia: 80.7, halfLife: 2.74, ppb: 92.7, amesToxicity: 0.206, diliRisk: 0.52, hergRisk: 0.647, drugLikeness: 0.542, logS: -5.086, logD7_4: 1.861, logP: 5.728, logPapp: -4.718, pgpInhibitor: 0.765, pgpSubstrate: 0.365, f20Bioavailability: 32.7, f30Bioavailability: 32.6, logVD: 1.26, clearance: 1.85, hepatotoxicity: 0.81, skinSensitization: 0.399, logLD50: 2.619, fdamdd: 0.456 },
    cyp450Interactions: [
      { enzyme: 'CYP2C19', inhibitorScore: 0.926, substrateScore: 0.72, affinityScore: 0.926, highRiskDrugs: ['Antiepileptics (clobazam, phenytoin)', 'PPIs (omeprazole, lansoprazole)', 'Antidepressants (citalopram, escitalopram)', 'Antiplatelet (clopidogrel)'] },
      { enzyme: 'CYP2C9', inhibitorScore: 0.763, substrateScore: 0.72, affinityScore: 0.763, highRiskDrugs: ['Anticoagulants (warfarin, apixaban)', 'NSAIDs (ibuprofen, diclofenac)', 'Sulfonylureas (glipizide, glyburide)'] },
      { enzyme: 'CYP3A4', inhibitorScore: 0.72, substrateScore: 0.636, affinityScore: 0.72, highRiskDrugs: ['Statins (atorvastatin, simvastatin)', 'Immunosuppressants (tacrolimus, cyclosporine)', 'Chemotherapy (docetaxel, paclitaxel)'] },
      { enzyme: 'CYP1A2', inhibitorScore: 0.686, substrateScore: 0.45, affinityScore: 0.686, highRiskDrugs: ['Theophylline', 'Caffeine', 'Clozapine', 'Fluvoxamine'] },
      { enzyme: 'CYP2D6', inhibitorScore: 0.627, substrateScore: 0.483, affinityScore: 0.627, highRiskDrugs: ['Antidepressants (fluoxetine, paroxetine)', 'Opioids (codeine, tramadol)', 'Beta-blockers (metoprolol)'] }
    ]
  },
  {
    id: 'cbc',
    name: 'CBC',
    fullName: 'Cannabichromene',
    type: 'neutral',
    psychoactive: false,
    description: 'Non-psychoactive cannabinoid with potent anti-inflammatory and antidepressant effects. Best intestinal absorption (82.9% HIA) among non-THC cannabinoids.',
    proteinTargets: ['ABCB1', 'ABCG2', 'ACTA1', 'ALOX12', 'ALOX12B', 'ALOX15', 'ALOX15B', 'ALOX5', 'ALOXE3', 'AR', 'AZGP1', 'CMAS', 'CNR1', 'CNR2', 'CSDE1', 'CYP1A1', 'CYP2A6', 'CYP2C19', 'CYP2C9', 'CYP3A4', 'DGKA', 'ESR2', 'EXOC6', 'FBP1', 'FLT1', 'FLT4', 'FYN', 'GCLC', 'GSTA2', 'GSTM3', 'GSTO1', 'GSTP1', 'HMOX1', 'IQUB', 'KDR', 'MOG', 'NQO1', 'NR1I2', 'PMP2', 'PPP2CA', 'PPP2CB', 'PRKCA', 'PRKCB', 'PTGS1', 'PTGS2', 'SEC14L2', 'SEC14L4', 'SOD1', 'SOD2', 'TCEA3', 'TIMM9', 'TJP2', 'TRPA1', 'TTPA', 'YES1'],
    bindingAffinities: { 'GSTA2': -7.0, 'GSTM3': -7.7, 'GSTP1': -8.7, 'HMOX1': -8.0, 'CNR1': -7.0, 'CNR2': -7.7, 'PRKCA': -7.5, 'PRKCB': -8.1 },
    pharmacokinetics: { bbb: 0.724, hia: 82.9, halfLife: 2.35, ppb: 93.7, amesToxicity: 0.122, diliRisk: 0.244, hergRisk: 0.708, drugLikeness: 0.626, logS: -4.98, logD7_4: 1.968, logP: 6.036, logPapp: -4.728, pgpInhibitor: 0.76, pgpSubstrate: 0.308, f20Bioavailability: 25.8, f30Bioavailability: 38.6, logVD: 0.859, clearance: 1.69, hepatotoxicity: 0.596, skinSensitization: 0.534, logLD50: 2.356, fdamdd: 0.48 },
    cyp450Interactions: [
      { enzyme: 'CYP2C19', inhibitorScore: 0.669, substrateScore: 0.528, affinityScore: 0.669, highRiskDrugs: ['Antiepileptics (clobazam, phenytoin)', 'PPIs (omeprazole, lansoprazole)', 'Antidepressants (citalopram, escitalopram)', 'Antiplatelet (clopidogrel)'] },
      { enzyme: 'CYP2C9', inhibitorScore: 0.604, substrateScore: 0.528, affinityScore: 0.604, highRiskDrugs: ['Anticoagulants (warfarin, apixaban)', 'NSAIDs (ibuprofen, diclofenac)', 'Sulfonylureas (glipizide, glyburide)'] },
      { enzyme: 'CYP3A4', inhibitorScore: 0.469, substrateScore: 0.6, affinityScore: 0.6, highRiskDrugs: ['Statins (atorvastatin, simvastatin)', 'Immunosuppressants (tacrolimus, cyclosporine)', 'Chemotherapy (docetaxel, paclitaxel)'] },
      { enzyme: 'CYP2D6', inhibitorScore: 0.475, substrateScore: 0.386, affinityScore: 0.475, highRiskDrugs: ['Antidepressants (fluoxetine, paroxetine)', 'Opioids (codeine, tramadol)', 'Beta-blockers (metoprolol)'] }
    ]
  },
  {
    id: 'cbdv',
    name: 'CBDV',
    fullName: 'Cannabidivarin',
    type: 'neutral',
    psychoactive: false,
    description: 'Propyl analog of CBD. Studied for anti-nausea and anti-epileptic properties. Lowest AMES mutagenicity score (0.108) indicating excellent safety profile.',
    proteinTargets: ['ALOX12', 'ALOX12B', 'ALOX15', 'ALOX15B', 'ALOX5', 'ALOXE3', 'CETP', 'CNR1', 'CNR2', 'CSDE1', 'DAGLA', 'EXOC6', 'FLNB', 'FLT1', 'GPR55', 'HDAC7', 'MAPT', 'PARP1', 'PMP2', 'PTGS1', 'PTGS2', 'RUNX1T1', 'TDP1', 'TRPA1', 'TRPV1', 'TRPV2', 'VDR'],
    bindingAffinities: { 'CNR1': -7.2, 'CNR2': -7.8 },
    pharmacokinetics: { bbb: 0.733, hia: 69.8, halfLife: 2.22, ppb: 87.6, amesToxicity: 0.108, diliRisk: 0.308, hergRisk: 0.646, drugLikeness: 0.778, logS: -5.119, logD7_4: 1.714, logP: 5.066, logPapp: -4.892, pgpInhibitor: 0.756, pgpSubstrate: 0.212, f20Bioavailability: 51.5, f30Bioavailability: 40.0, logVD: 0.53, clearance: 1.74, hepatotoxicity: 0.488, skinSensitization: 0.541, logLD50: 2.593, fdamdd: 0.322 },
    cyp450Interactions: [
      { enzyme: 'CYP2C9', inhibitorScore: 0.158, substrateScore: 0.67, affinityScore: 0.67, highRiskDrugs: ['Anticoagulants (warfarin, apixaban)', 'NSAIDs (ibuprofen, diclofenac)', 'Sulfonylureas (glipizide, glyburide)'] },
      { enzyme: 'CYP2C19', inhibitorScore: 0.374, substrateScore: 0.67, affinityScore: 0.67, highRiskDrugs: ['Antiepileptics (clobazam, phenytoin)', 'PPIs (omeprazole, lansoprazole)', 'Antidepressants (citalopram, escitalopram)', 'Antiplatelet (clopidogrel)'] },
      { enzyme: 'CYP3A4', inhibitorScore: 0.208, substrateScore: 0.572, affinityScore: 0.572, highRiskDrugs: ['Statins (atorvastatin, simvastatin)', 'Immunosuppressants (tacrolimus, cyclosporine)', 'Chemotherapy (docetaxel, paclitaxel)'] },
      { enzyme: 'CYP2D6', inhibitorScore: 0.483, substrateScore: 0.416, affinityScore: 0.483, highRiskDrugs: ['Antidepressants (fluoxetine, paroxetine)', 'Opioids (codeine, tramadol)', 'Beta-blockers (metoprolol)'] }
    ]
  },
  {
    id: 'd9_thcv',
    name: 'THCV',
    fullName: 'Tetrahydrocannabivarin',
    type: 'neutral',
    psychoactive: true,
    description: 'Propyl analog of THC with shorter, clearer effects. Known for appetite suppression, energy boost, and blood sugar regulation. Second-highest BBB penetration (0.893).',
    proteinTargets: ['ACTA1', 'CNR1', 'CNR2', 'DYRK1A', 'EGFR', 'ERBB2', 'ESR1', 'ESR2', 'FLT1', 'FLT4', 'GPR55', 'HTR1A', 'HTR1B', 'HTR1D', 'KDR', 'MAPT', 'NR1I3', 'PMP2', 'TDP1', 'TRPA1', 'TRPM8', 'TRPV2'],
    bindingAffinities: { 'CNR1': -7.5, 'CNR2': -7.9 },
    pharmacokinetics: { bbb: 0.893, hia: 81.8, halfLife: 2.61, ppb: 94.1, amesToxicity: 0.14, diliRisk: 0.282, hergRisk: 0.635, drugLikeness: 0.72, logS: -4.708, logD7_4: 1.845, logP: 4.956, logPapp: -4.677, pgpInhibitor: 0.867, pgpSubstrate: 0.166, f20Bioavailability: 27.5, f30Bioavailability: 27.4, logVD: 1.301, clearance: 1.87, hepatotoxicity: 0.674, skinSensitization: 0.525, logLD50: 2.577, fdamdd: 0.25 },
    cyp450Interactions: [
      { enzyme: 'CYP3A4', inhibitorScore: 0.264, substrateScore: 0.818, affinityScore: 0.818, highRiskDrugs: ['Statins (atorvastatin, simvastatin)', 'Immunosuppressants (tacrolimus, cyclosporine)', 'Chemotherapy (docetaxel, paclitaxel)'] },
      { enzyme: 'CYP2C9', inhibitorScore: 0.281, substrateScore: 0.766, affinityScore: 0.766, highRiskDrugs: ['Anticoagulants (warfarin, apixaban)', 'NSAIDs (ibuprofen, diclofenac)', 'Sulfonylureas (glipizide, glyburide)'] },
      { enzyme: 'CYP2C19', inhibitorScore: 0.56, substrateScore: 0.766, affinityScore: 0.766, highRiskDrugs: ['Antiepileptics (clobazam, phenytoin)', 'PPIs (omeprazole, lansoprazole)', 'Antidepressants (citalopram, escitalopram)', 'Antiplatelet (clopidogrel)'] },
      { enzyme: 'CYP2D6', inhibitorScore: 0.509, substrateScore: 0.225, affinityScore: 0.509, highRiskDrugs: ['Antidepressants (fluoxetine, paroxetine)', 'Opioids (codeine, tramadol)', 'Beta-blockers (metoprolol)'] },
      { enzyme: 'CYP1A2', inhibitorScore: 0.194, substrateScore: 0.406, affinityScore: 0.406, highRiskDrugs: ['Theophylline', 'Caffeine', 'Clozapine', 'Fluvoxamine'] }
    ]
  },
  {
    id: 'd9_thca',
    name: 'Δ9-THCA',
    fullName: 'Delta-9 Tetrahydrocannabinolic Acid',
    type: 'acidic',
    psychoactive: false,
    description: 'Raw, acidic precursor to THC. Non-psychoactive in raw form. Anti-inflammatory and neuroprotective properties without intoxication. Highest AMES score (0.25) among cannabinoids.',
    proteinTargets: ['ABCB1', 'ABCG2', 'ACHE', 'ACTA1', 'ACTR3', 'AR', 'BCHE', 'CNR1', 'CNR2', 'CSDE1', 'CYP1A1', 'CYP2A6', 'CYP2C19', 'CYP2C9', 'CYP3A4', 'DYRK1A', 'EXOC6', 'FLT1', 'FLT4', 'H3F3B', 'HBA2', 'HDAC7', 'KDR', 'LTB4R', 'LTB4R2', 'MAPT', 'MOG', 'NR1I3', 'PMP2', 'PTGS1', 'PTGS2', 'PTPN1', 'PTPN2', 'RXRB', 'SEC23A', 'SERPINE1', 'SERPINE2'],
    bindingAffinities: { 'CNR1': -7.0, 'CNR2': -7.2, 'PRKCA': -7.0 },
    pharmacokinetics: { bbb: 0.531, hia: 57.7, halfLife: 2.1, ppb: 94.2, amesToxicity: 0.25, diliRisk: 0.288, hergRisk: 0.467, drugLikeness: 0.5, logS: -5.434, logD7_4: 1.593, logP: 5.434, logPapp: -5.029, pgpInhibitor: 0.889, pgpSubstrate: 0.083, f20Bioavailability: 34.5, f30Bioavailability: 25.1, logVD: -0.164, clearance: 1.98, hepatotoxicity: 0.65, skinSensitization: 0.386, logLD50: 3.237, fdamdd: 0.334 },
    cyp450Interactions: [
      { enzyme: 'CYP3A4', inhibitorScore: 0.291, substrateScore: 0.73, affinityScore: 0.73, highRiskDrugs: ['Statins (atorvastatin, simvastatin)', 'Immunosuppressants (tacrolimus, cyclosporine)', 'Chemotherapy (docetaxel, paclitaxel)'] },
      { enzyme: 'CYP2C9', inhibitorScore: 0.418, substrateScore: 0.612, affinityScore: 0.612, highRiskDrugs: ['Anticoagulants (warfarin, apixaban)', 'NSAIDs (ibuprofen, diclofenac)', 'Sulfonylureas (glipizide, glyburide)'] },
      { enzyme: 'CYP2C19', inhibitorScore: 0.339, substrateScore: 0.612, affinityScore: 0.612, highRiskDrugs: ['Antiepileptics (clobazam, phenytoin)', 'PPIs (omeprazole, lansoprazole)', 'Antidepressants (citalopram, escitalopram)', 'Antiplatelet (clopidogrel)'] },
      { enzyme: 'CYP2D6', inhibitorScore: 0.476, substrateScore: 0.313, affinityScore: 0.476, highRiskDrugs: ['Antidepressants (fluoxetine, paroxetine)', 'Opioids (codeine, tramadol)', 'Beta-blockers (metoprolol)'] }
    ]
  },
  {
    id: 'd9_thc',
    name: 'Δ9-THC',
    fullName: 'Delta-9 Tetrahydrocannabinol',
    type: 'neutral',
    psychoactive: true,
    description: 'Primary psychoactive cannabinoid. Longest half-life (2.96h) and highest plasma protein binding (96.7%). Targets CB1/CB2 receptors for pain, appetite, and sleep.',
    proteinTargets: ['AANAT', 'ABCB1', 'ABCG2', 'ACTA1', 'ACTR3', 'ADCY10', 'AKR1B1', 'ALOX12', 'ALOX12B', 'ALOX15', 'ALOX15B', 'ALOX5', 'ALOXE3', 'AP1G1', 'AR', 'ARHGAP5', 'BCHE', 'BDNF', 'CCNA2', 'CNR1', 'CNR2', 'COMT', 'CREB1', 'CSDE1', 'CYP1A1', 'CYP1A2', 'CYP1B1', 'CYP2A6', 'CYP2C19', 'CYP2C9', 'CYP3A4', 'CYTB', 'DGKA', 'DMC1', 'E2F1', 'EXOC6', 'FA2H', 'FLT1', 'FLT4', 'GCLC', 'GPR18', 'GPR55', 'GRIN2B', 'GSTA2', 'GSTM3', 'GSTO1', 'GSTP1', 'HBA2', 'HMOX1', 'KDR', 'MAPT', 'MEN1', 'MOG', 'MTNR1B', 'NMRK1', 'NQO1', 'NR1I2', 'PMP2', 'PPARA', 'PPP2CA', 'PPP2CB', 'PRKCA', 'PRKCB', 'PTGS1', 'RHOA', 'RORC', 'SEC14L2', 'SEC14L4', 'SENP7', 'SOD1', 'TCEA3', 'TDP1', 'TH', 'TRPA1', 'TRPC6', 'TRPV1', 'TRPV4', 'TTPA', 'UGT1A1', 'UGT1A10', 'UGT1A7', 'UGT1A8'],
    bindingAffinities: { 'CNR1': -9.5, 'CNR2': -8.8, 'CREB1': -7.0, 'AKT1': -8.0, 'PRKCA': -7.5 },
    pharmacokinetics: { bbb: 0.878, hia: 82.0, halfLife: 2.96, ppb: 96.7, amesToxicity: 0.09, diliRisk: 0.246, hergRisk: 0.657, drugLikeness: 0.778, logS: -3.5, logD7_4: 2.007, logP: 5.736, logPapp: -4.746, pgpInhibitor: 0.922, pgpSubstrate: 0.226, f20Bioavailability: 20.6, f30Bioavailability: 14.1, logVD: 1.494, clearance: 1.44, hepatotoxicity: 0.848, skinSensitization: 0.535, logLD50: 2.666, fdamdd: 0.248 },
    cyp450Interactions: [
      { enzyme: 'CYP3A4', inhibitorScore: 0.364, substrateScore: 0.86, affinityScore: 0.86, highRiskDrugs: ['Statins (atorvastatin, simvastatin)', 'Immunosuppressants (tacrolimus, cyclosporine)', 'Chemotherapy (docetaxel, paclitaxel)'] },
      { enzyme: 'CYP2C9', inhibitorScore: 0.45, substrateScore: 0.794, affinityScore: 0.794, highRiskDrugs: ['Anticoagulants (warfarin, apixaban)', 'NSAIDs (ibuprofen, diclofenac)', 'Sulfonylureas (glipizide, glyburide)'] },
      { enzyme: 'CYP2C19', inhibitorScore: 0.612, substrateScore: 0.794, affinityScore: 0.794, highRiskDrugs: ['Antiepileptics (clobazam, phenytoin)', 'PPIs (omeprazole, lansoprazole)', 'Antidepressants (citalopram, escitalopram)', 'Antiplatelet (clopidogrel)'] },
      { enzyme: 'CYP2D6', inhibitorScore: 0.529, substrateScore: 0.182, affinityScore: 0.529, highRiskDrugs: ['Antidepressants (fluoxetine, paroxetine)', 'Opioids (codeine, tramadol)', 'Beta-blockers (metoprolol)'] }
    ]
  },
  {
    id: 'd8_thc',
    name: 'Δ8-THC',
    fullName: 'Delta-8 Tetrahydrocannabinol',
    type: 'neutral',
    psychoactive: true,
    description: 'Milder psychoactive cannabinoid with highest BBB penetration (0.913). Best for neurological conditions requiring CNS access. Lower anxiety risk than Δ9-THC.',
    proteinTargets: ['ACTA1', 'ALOX12', 'ALOX12B', 'ALOX15', 'ALOX15B', 'ALOX5', 'ALOXE3', 'AR', 'AZGP1', 'CNR1', 'CNR2', 'CSDE1', 'CYP3A4', 'CYTB', 'ESR1', 'ESR2', 'EXOC6', 'FLT1', 'FLT4', 'GRIN1', 'GRIN2B', 'GRIN2D', 'GRIN3A', 'GRIN3B', 'HBA2', 'HSD17B4', 'KDR', 'KYNU', 'MOG', 'NMRK1', 'PMP2', 'PPIG', 'PTGS1', 'PTGS2', 'RUNX1T1', 'SDHA', 'SUB1', 'TNF', 'UGT1A1', 'UGT1A10', 'UGT1A7', 'UGT1A8'],
    bindingAffinities: { 'CNR1': -9.2, 'CNR2': -8.5, 'CREB1': -6.8, 'AKT1': -7.8 },
    pharmacokinetics: { bbb: 0.913, hia: 82.0, halfLife: 2.9, ppb: 96.7, amesToxicity: 0.09, diliRisk: 0.246, hergRisk: 0.657, drugLikeness: 0.53, logS: -3.723, logD7_4: 2.011, logP: 5.736, logPapp: -4.746, pgpInhibitor: 0.845, pgpSubstrate: 0.219, f20Bioavailability: 20.6, f30Bioavailability: 28.8, logVD: 1.458, clearance: 1.46, hepatotoxicity: 0.842, skinSensitization: 0.535, logLD50: 2.666, fdamdd: 0.38 },
    cyp450Interactions: [
      { enzyme: 'CYP3A4', inhibitorScore: 0.415, substrateScore: 0.734, affinityScore: 0.734, highRiskDrugs: ['Statins (atorvastatin, simvastatin)', 'Immunosuppressants (tacrolimus, cyclosporine)', 'Chemotherapy (docetaxel, paclitaxel)'] },
      { enzyme: 'CYP2C9', inhibitorScore: 0.535, substrateScore: 0.708, affinityScore: 0.708, highRiskDrugs: ['Anticoagulants (warfarin, apixaban)', 'NSAIDs (ibuprofen, diclofenac)', 'Sulfonylureas (glipizide, glyburide)'] },
      { enzyme: 'CYP2C19', inhibitorScore: 0.64, substrateScore: 0.708, affinityScore: 0.708, highRiskDrugs: ['Antiepileptics (clobazam, phenytoin)', 'PPIs (omeprazole, lansoprazole)', 'Antidepressants (citalopram, escitalopram)', 'Antiplatelet (clopidogrel)'] },
      { enzyme: 'CYP2D6', inhibitorScore: 0.537, substrateScore: 0.36, affinityScore: 0.537, highRiskDrugs: ['Antidepressants (fluoxetine, paroxetine)', 'Opioids (codeine, tramadol)', 'Beta-blockers (metoprolol)'] },
      { enzyme: 'CYP1A2', inhibitorScore: 0.281, substrateScore: 0.412, affinityScore: 0.412, highRiskDrugs: ['Theophylline', 'Caffeine', 'Clozapine', 'Fluvoxamine'] }
    ]
  },
  {
    id: '11_oh_thc',
    name: '11-OH-THC',
    fullName: '11-Hydroxy-Tetrahydrocannabinol',
    type: 'metabolite',
    psychoactive: true,
    description: 'Active metabolite of THC produced during first-pass liver metabolism. More potent than THC with good BBB penetration. Primary compound from oral THC consumption.',
    proteinTargets: ['ABCB1', 'ACHE', 'ACTA1', 'ALOX12', 'ALOX12B', 'ALOX15', 'ALOX15B', 'ALOX5', 'ALOXE3', 'AR', 'BCHE', 'CNR1', 'CNR2', 'CRSP9', 'CSDE1', 'EXOC6', 'FLT1', 'FLT4', 'GUSB', 'KDR', 'MB', 'NMRK1', 'NPY5R', 'PMP2', 'TDP1'],
    bindingAffinities: { 'CNR1': -9.8, 'CNR2': -9.0, 'CREB1': -7.2 },
    pharmacokinetics: { bbb: 0.748, hia: 73.2, halfLife: 2.49, ppb: 94.4, amesToxicity: 0.19, diliRisk: 0.274, hergRisk: 0.639, drugLikeness: 0.662, logS: -4.678, logD7_4: 1.811, logP: 4.708, logPapp: -4.951, pgpInhibitor: 0.865, pgpSubstrate: 0.266, f20Bioavailability: 37.5, f30Bioavailability: 22.8, logVD: 0.915, clearance: 1.72, hepatotoxicity: 0.718, skinSensitization: 0.4, logLD50: 2.856, fdamdd: 0.224 },
    cyp450Interactions: [
      { enzyme: 'CYP3A4', inhibitorScore: 0.32, substrateScore: 0.8, affinityScore: 0.8, highRiskDrugs: ['Statins (atorvastatin, simvastatin)', 'Immunosuppressants (tacrolimus, cyclosporine)', 'Chemotherapy (docetaxel, paclitaxel)'] },
      { enzyme: 'CYP2C9', inhibitorScore: 0.429, substrateScore: 0.766, affinityScore: 0.766, highRiskDrugs: ['Anticoagulants (warfarin, apixaban)', 'NSAIDs (ibuprofen, diclofenac)', 'Sulfonylureas (glipizide, glyburide)'] },
      { enzyme: 'CYP2C19', inhibitorScore: 0.353, substrateScore: 0.766, affinityScore: 0.766, highRiskDrugs: ['Antiepileptics (clobazam, phenytoin)', 'PPIs (omeprazole, lansoprazole)', 'Antidepressants (citalopram, escitalopram)', 'Antiplatelet (clopidogrel)'] },
      { enzyme: 'CYP2D6', inhibitorScore: 0.514, substrateScore: 0.247, affinityScore: 0.514, highRiskDrugs: ['Antidepressants (fluoxetine, paroxetine)', 'Opioids (codeine, tramadol)', 'Beta-blockers (metoprolol)'] },
      { enzyme: 'CYP1A2', inhibitorScore: 0.237, substrateScore: 0.414, affinityScore: 0.414, highRiskDrugs: ['Theophylline', 'Caffeine', 'Clozapine', 'Fluvoxamine'] }
    ]
  }
];

// 18 Essential Protein Targets organized by functional modules
export const proteinTargets: ProteinTarget[] = [
  // Module 1: Metabolism & Detoxification
  { id: 'cat', symbol: 'CAT', name: 'Catalase', uniprot: 'P04040', module: 1, icValue: 0.63, functions: ['Antioxidant defense', 'H2O2 decomposition', 'Oxidative stress protection'], relatedConditions: ['Oxidative stress', 'Aging', 'Neurodegeneration'] },
  { id: 'comt', symbol: 'COMT', name: 'Catechol-O-methyltransferase', uniprot: 'P21964', module: 1, icValue: 0.57, functions: ['Dopamine metabolism', 'Norepinephrine breakdown', 'Catecholamine regulation'], relatedConditions: ['Pain sensitivity', 'Mood disorders', 'ADHD', 'Schizophrenia'] },
  { id: 'cyp17a1', symbol: 'CYP17A1', name: 'Cytochrome P450 17A1', uniprot: 'P05093', module: 1, icValue: 0.56, functions: ['Steroid hormone synthesis', 'Cortisol production', 'Sex hormone regulation'], relatedConditions: ['Hormone imbalance', 'Adrenal disorders', 'PCOS'] },
  { id: 'gsta2', symbol: 'GSTA2', name: 'Glutathione S-transferase A2', uniprot: 'P09210', module: 1, icValue: 0.51, functions: ['Phase II detoxification', 'Xenobiotic metabolism', 'Oxidative stress protection'], relatedConditions: ['Chemical sensitivity', 'Liver dysfunction', 'Cancer'] },
  { id: 'gstm3', symbol: 'GSTM3', name: 'Glutathione S-transferase M3', uniprot: 'P21266', module: 1, icValue: 0.64, functions: ['Detoxification', 'Drug metabolism', 'Cellular protection'], relatedConditions: ['Environmental toxicity', 'Drug sensitivity', 'Oxidative damage'] },
  { id: 'gstp1', symbol: 'GSTP1', name: 'Glutathione S-transferase P1', uniprot: 'P09211', module: 1, icValue: 0.72, functions: ['Detoxification', 'Cellular signaling', 'Stress response'], relatedConditions: ['Cancer', 'Drug resistance', 'Neurological disorders'] },
  { id: 'hmox1', symbol: 'HMOX1', name: 'Heme Oxygenase 1', uniprot: 'P09601', module: 1, icValue: 0.52, functions: ['Anti-inflammatory', 'Antioxidant', 'Cytoprotection'], relatedConditions: ['Inflammation', 'Cardiovascular disease', 'Neuroprotection'] },
  
  // Module 2: Cell Survival & Growth Signaling
  { id: 'akt1', symbol: 'AKT1', name: 'AKT Serine/Threonine Kinase 1', uniprot: 'P31749', module: 2, icValue: 0.81, functions: ['Cell survival signaling', 'Metabolism regulation', 'Anti-apoptosis'], relatedConditions: ['Cancer', 'Diabetes', 'Cardiovascular disease', 'Psychosis'] },
  { id: 'casp9', symbol: 'CASP9', name: 'Caspase 9', uniprot: 'P55211', module: 2, icValue: 0.67, functions: ['Apoptosis initiation', 'Programmed cell death', 'Tumor suppression'], relatedConditions: ['Cancer', 'Autoimmune disorders', 'Neurodegeneration'] },
  { id: 'plcg1', symbol: 'PLCG1', name: 'Phospholipase C Gamma 1', uniprot: 'P19174', module: 2, icValue: 0.51, functions: ['Signal transduction', 'Calcium signaling', 'Immune cell activation'], relatedConditions: ['Immune dysfunction', 'Cancer', 'Inflammatory disorders'] },
  { id: 'prkca', symbol: 'PRKCA', name: 'Protein Kinase C Alpha', uniprot: 'P17252', module: 2, icValue: 0.65, functions: ['Cell signaling', 'Apoptosis regulation', 'Neuroplasticity'], relatedConditions: ['Cancer', 'Neurological disorders', 'Cardiac dysfunction'] },
  { id: 'prkcb', symbol: 'PRKCB', name: 'Protein Kinase C Beta', uniprot: 'P05771', module: 2, icValue: 0.56, functions: ['B-cell signaling', 'Insulin signaling', 'Neuronal function'], relatedConditions: ['Diabetes', 'Immune disorders', 'Addiction'] },
  
  // Module 3: Inflammation & Immune Response
  { id: 'cycs', symbol: 'CYCS', name: 'Cytochrome C', uniprot: 'P99999', module: 3, icValue: 0.59, functions: ['Electron transport', 'Apoptosis triggering', 'Energy metabolism'], relatedConditions: ['Mitochondrial dysfunction', 'Neurodegeneration', 'Cancer'] },
  { id: 'tnf', symbol: 'TNF', name: 'Tumor Necrosis Factor', uniprot: 'P01375', module: 3, icValue: 0.55, functions: ['Pro-inflammatory signaling', 'Immune activation', 'Cell death'], relatedConditions: ['Autoimmune diseases', 'Chronic inflammation', 'Cancer', 'Rheumatoid arthritis'] },
  
  // Module 4: Cannabinoid Receptors & Neural Signaling
  { id: 'cnr1', symbol: 'CNR1', name: 'Cannabinoid Receptor 1', uniprot: 'P21554', module: 4, icValue: 0.20, functions: ['Neurotransmission modulation', 'Pain perception', 'Mood regulation', 'Memory'], relatedConditions: ['Chronic pain', 'Anxiety', 'Depression', 'Epilepsy', 'Addiction', 'Neurodegeneration'] },
  { id: 'cnr2', symbol: 'CNR2', name: 'Cannabinoid Receptor 2', uniprot: 'P34972', module: 4, icValue: 0.20, functions: ['Immune modulation', 'Inflammation control', 'Bone metabolism'], relatedConditions: ['Autoimmune disorders', 'Inflammation', 'Osteoporosis', 'Neuropathic pain'] },
  { id: 'creb1', symbol: 'CREB1', name: 'cAMP Response Element Binding Protein 1', uniprot: 'P16220', module: 4, icValue: 0.63, functions: ['Gene expression regulation', 'Memory formation', 'Neuroplasticity'], relatedConditions: ['Depression', 'Anxiety', 'Memory disorders', 'Addiction'] },
  { id: 'grin2b', symbol: 'GRIN2B', name: 'NMDA Receptor Subunit 2B', uniprot: 'Q13224', module: 4, icValue: 0.68, functions: ['Synaptic plasticity', 'Learning', 'Memory formation'], relatedConditions: ['Schizophrenia', 'Depression', 'Bipolar disorder', 'Cognitive decline'] }
];

// Health Conditions from KEGG pathway analysis
export const healthConditions: HealthCondition[] = [
  // Neurodegenerative Diseases
  { id: 'alzheimers', name: "Alzheimer's Disease", category: 'Neurodegenerative', keggPathways: ['hsa05010'], proteinTargets: ['AKT1', 'CASP9', 'GRIN2B', 'CNR1', 'CREB1'], effectType: 'beneficial', description: 'Cannabinoids show neuroprotective effects by modulating inflammation, oxidative stress, and neuroplasticity pathways.' },
  { id: 'parkinsons', name: "Parkinson's Disease", category: 'Neurodegenerative', keggPathways: ['hsa05012'], proteinTargets: ['COMT', 'CNR1', 'CNR2', 'AKT1'], effectType: 'beneficial', description: 'Cannabinoids support dopaminergic system function and reduce neuroinflammation.' },
  { id: 'huntingtons', name: "Huntington's Disease", category: 'Neurodegenerative', keggPathways: ['hsa05016'], proteinTargets: ['CNR1', 'CASP9', 'CYCS'], effectType: 'beneficial', description: 'Neuroprotection through anti-excitotoxic and anti-inflammatory mechanisms.' },
  { id: 'als', name: 'Amyotrophic Lateral Sclerosis (ALS)', category: 'Neurodegenerative', keggPathways: ['hsa05014'], proteinTargets: ['AKT1', 'CASP9', 'CNR2'], effectType: 'beneficial', description: 'Motor neuron protection via anti-inflammatory and anti-apoptotic pathways.' },
  { id: 'ms', name: 'Multiple Sclerosis', category: 'Neurodegenerative', keggPathways: ['hsa04060'], proteinTargets: ['CNR1', 'CNR2', 'TNF'], effectType: 'beneficial', description: 'Immune modulation and reduced neuroinflammation through CB2 activation.' },
  
  // Mental Health Conditions
  { id: 'anxiety', name: 'Anxiety Disorders', category: 'Mental Health', keggPathways: ['hsa04080'], proteinTargets: ['CNR1', 'CREB1', 'GRIN2B'], effectType: 'beneficial', description: 'CBD and CBDA show anxiolytic effects through serotonin and ECS modulation.' },
  { id: 'depression', name: 'Depression', category: 'Mental Health', keggPathways: ['hsa04080', 'hsa04024'], proteinTargets: ['CREB1', 'GRIN2B', 'CNR1', 'COMT'], effectType: 'beneficial', description: 'Mood regulation through endocannabinoid system and neuroplasticity pathways.' },
  { id: 'ptsd', name: 'PTSD', category: 'Mental Health', keggPathways: ['hsa04080'], proteinTargets: ['CNR1', 'CREB1', 'GRIN2B'], effectType: 'beneficial', description: 'Memory processing and fear extinction through ECS modulation.' },
  { id: 'schizophrenia', name: 'Schizophrenia', category: 'Mental Health', keggPathways: ['hsa04728'], proteinTargets: ['GRIN2B', 'COMT', 'AKT1'], effectType: 'research', description: 'CBD may counteract psychotic symptoms. THC requires caution in vulnerable individuals.' },
  
  // Pain & Inflammation
  { id: 'chronic_pain', name: 'Chronic Pain', category: 'Pain & Inflammation', keggPathways: ['hsa04080', 'hsa04750'], proteinTargets: ['CNR1', 'CNR2', 'PRKCA', 'PRKCB'], effectType: 'beneficial', description: 'Pain modulation through CB1/CB2 receptor activation and TRP channel modulation.' },
  { id: 'neuropathic_pain', name: 'Neuropathic Pain', category: 'Pain & Inflammation', keggPathways: ['hsa04080'], proteinTargets: ['CNR1', 'CNR2', 'PRKCA'], effectType: 'beneficial', description: 'Nerve pain relief through ECS activation and neuroinflammation reduction.' },
  { id: 'arthritis', name: 'Arthritis (RA/OA)', category: 'Pain & Inflammation', keggPathways: ['hsa04668'], proteinTargets: ['TNF', 'CNR2', 'HMOX1'], effectType: 'beneficial', description: 'Anti-inflammatory effects via TNF suppression and CB2 immune modulation.' },
  { id: 'fibromyalgia', name: 'Fibromyalgia', category: 'Pain & Inflammation', keggPathways: ['hsa04080'], proteinTargets: ['CNR1', 'CNR2', 'GRIN2B'], effectType: 'beneficial', description: 'Central sensitization modulation and pain threshold improvement.' },
  { id: 'ibd', name: 'Inflammatory Bowel Disease', category: 'Pain & Inflammation', keggPathways: ['hsa04060'], proteinTargets: ['CNR1', 'CNR2', 'TNF'], effectType: 'beneficial', description: 'Gut inflammation control through CB2 activation and TNF suppression.' },
  
  // Neurological Disorders
  { id: 'epilepsy', name: 'Epilepsy', category: 'Neurological', keggPathways: ['hsa04080', 'hsa04724'], proteinTargets: ['CNR1', 'GRIN2B', 'PRKCA'], effectType: 'beneficial', description: 'CBD-based treatments (Epidiolex) approved for seizure disorders.' },
  { id: 'migraines', name: 'Migraines', category: 'Neurological', keggPathways: ['hsa04726'], proteinTargets: ['CNR1', 'COMT'], effectType: 'beneficial', description: 'Endocannabinoid deficiency theory supports cannabinoid supplementation.' },
  { id: 'neuropathy', name: 'Peripheral Neuropathy', category: 'Neurological', keggPathways: ['hsa04080'], proteinTargets: ['CNR1', 'CNR2', 'AKT1'], effectType: 'beneficial', description: 'Nerve protection and pain relief through ECS activation.' },
  
  // Cancer Support
  { id: 'cancer_general', name: 'Cancer (General Support)', category: 'Cancer Support', keggPathways: ['hsa05200', 'hsa04151'], proteinTargets: ['AKT1', 'CASP9', 'GSTP1', 'PRKCA'], effectType: 'beneficial', description: 'Antiproliferative effects, apoptosis induction, and symptom management.' },
  { id: 'cancer_nausea', name: 'Cancer-Related Nausea', category: 'Cancer Support', keggPathways: ['hsa04080'], proteinTargets: ['CNR1', 'CNR2'], effectType: 'beneficial', description: 'Antiemetic effects well-documented for chemotherapy-induced nausea.' },
  { id: 'cancer_cachexia', name: 'Cancer Cachexia', category: 'Cancer Support', keggPathways: ['hsa04080'], proteinTargets: ['CNR1', 'CNR2', 'TNF'], effectType: 'beneficial', description: 'Appetite stimulation and muscle wasting prevention.' },
  
  // Metabolic & Cardiovascular
  { id: 'diabetes', name: 'Type 2 Diabetes', category: 'Metabolic', keggPathways: ['hsa04930'], proteinTargets: ['AKT1', 'PRKCB', 'CNR2'], effectType: 'beneficial', description: 'Insulin sensitivity and metabolic regulation through THCV and CBD.' },
  { id: 'obesity', name: 'Obesity', category: 'Metabolic', keggPathways: ['hsa04931'], proteinTargets: ['CNR1', 'AKT1'], effectType: 'research', description: 'THCV shows appetite-suppressing effects. ECS modulation affects metabolism.' },
  { id: 'cardiovascular', name: 'Cardiovascular Disease', category: 'Cardiovascular', keggPathways: ['hsa05418'], proteinTargets: ['HMOX1', 'AKT1', 'TNF'], effectType: 'beneficial', description: 'Cardioprotection through anti-inflammatory and vasodilatory effects.' },
  { id: 'atherosclerosis', name: 'Atherosclerosis', category: 'Cardiovascular', keggPathways: ['hsa05418'], proteinTargets: ['HMOX1', 'TNF', 'CNR2'], effectType: 'beneficial', description: 'Reduced plaque formation and vascular inflammation.' },
  
  // Autoimmune & Immune
  { id: 'autoimmune_general', name: 'Autoimmune Disorders', category: 'Immune', keggPathways: ['hsa04060'], proteinTargets: ['CNR2', 'TNF', 'PLCG1'], effectType: 'beneficial', description: 'Immune system modulation and reduced autoimmune inflammation.' },
  { id: 'lupus', name: 'Lupus (SLE)', category: 'Immune', keggPathways: ['hsa04060'], proteinTargets: ['CNR2', 'TNF'], effectType: 'beneficial', description: 'Systemic inflammation control through CB2 and TNF pathways.' },
  { id: 'psoriasis', name: 'Psoriasis', category: 'Immune', keggPathways: ['hsa04060'], proteinTargets: ['CNR2', 'PRKCA', 'TNF'], effectType: 'beneficial', description: 'Skin inflammation reduction and keratinocyte regulation.' },
  
  // Sleep & Recovery
  { id: 'insomnia', name: 'Insomnia', category: 'Sleep & Recovery', keggPathways: ['hsa04080'], proteinTargets: ['CNR1', 'CREB1'], effectType: 'beneficial', description: 'CBN and CBD support sleep through relaxation and circadian rhythm support.' },
  { id: 'sleep_apnea', name: 'Sleep Apnea', category: 'Sleep & Recovery', keggPathways: ['hsa04080'], proteinTargets: ['CNR1'], effectType: 'research', description: 'Early research suggests cannabinoids may stabilize respiratory patterns.' },
  
  // Skin & Dermatological
  { id: 'eczema', name: 'Eczema/Atopic Dermatitis', category: 'Dermatological', keggPathways: ['hsa04060'], proteinTargets: ['CNR2', 'TNF', 'PRKCA'], effectType: 'beneficial', description: 'Anti-inflammatory and anti-itch effects through skin ECS receptors.' },
  { id: 'acne', name: 'Acne', category: 'Dermatological', keggPathways: ['hsa04151'], proteinTargets: ['CNR2', 'AKT1'], effectType: 'beneficial', description: 'Sebum regulation and anti-inflammatory effects.' },
  
  // GI & Digestive
  { id: 'nausea', name: 'Nausea & Vomiting', category: 'GI & Digestive', keggPathways: ['hsa04080'], proteinTargets: ['CNR1', 'CNR2'], effectType: 'beneficial', description: 'Well-established antiemetic effects through ECS activation.' },
  { id: 'appetite_loss', name: 'Appetite Loss', category: 'GI & Digestive', keggPathways: ['hsa04080'], proteinTargets: ['CNR1'], effectType: 'beneficial', description: 'Appetite stimulation through CB1 activation.' },
  { id: 'ibs', name: 'Irritable Bowel Syndrome', category: 'GI & Digestive', keggPathways: ['hsa04080'], proteinTargets: ['CNR1', 'CNR2'], effectType: 'beneficial', description: 'Gut motility regulation and visceral pain relief.' }
];

// FF Product Mappings with cannabinoid content
export const productMappings: ProductMapping[] = [
  {
    productName: 'The Elixir for Everything (Original)',
    productType: 'supplement',
    cannabinoids: ['CBD', 'CBDA', 'CBG', 'CBGA', 'CBC', 'CBN', 'CBDV'],
    primaryIndications: ['Full ECS Activation', 'Auto-Immune Support', 'Anti-Inflammation', 'Mood Enhancement', 'Gut Health'],
    ligandScore: 10
  },
  {
    productName: 'The Elixir for Everything with C60',
    productType: 'supplement',
    cannabinoids: ['CBD', 'CBDA', 'CBG', 'CBGA', 'CBC', 'CBN', 'CBDV'],
    primaryIndications: ['Full ECS Activation', 'Longevity', 'Antioxidant Protection', 'Cellular Defense', 'Neurological Support'],
    ligandScore: 10
  },
  {
    productName: 'C60 Olive Oil (4oz)',
    productType: 'supplement',
    cannabinoids: [],
    primaryIndications: ['Antioxidant', 'Longevity', 'Mitochondrial Protection'],
    ligandScore: 0
  },
  {
    productName: 'DMSO Extended Recovery Cooling Lotion',
    productType: 'topical',
    cannabinoids: [],
    primaryIndications: ['Pain Relief', 'Anti-Inflammation', 'Transdermal Delivery'],
    ligandScore: 0
  },
  {
    productName: 'Kaneh Bosem (Ancient Healing Oil)',
    productType: 'topical',
    cannabinoids: ['CBD', 'CBC'],
    primaryIndications: ['Skin Healing', 'Anti-Inflammation', 'Ancient Formula'],
    ligandScore: 5
  },
  {
    productName: 'ECS Suppositories',
    productType: 'supplement',
    cannabinoids: ['CBD', 'CBDA', 'CBG', 'CBGA', 'CBC', 'CBN', 'CBDV'],
    primaryIndications: ['Full ECS Activation', 'Cancer Support', 'Systemic Delivery', 'Bypass First-Pass Metabolism'],
    ligandScore: 10
  },
  {
    productName: 'B17 Suppositories',
    productType: 'supplement',
    cannabinoids: [],
    primaryIndications: ['Cancer Support', 'Metabolic Therapy', 'Apoptosis Induction'],
    ligandScore: 0
  },
  {
    productName: 'DMSO Suppositories',
    productType: 'supplement',
    cannabinoids: [],
    primaryIndications: ['Pain Relief', 'Anti-Inflammation', 'Enhanced Absorption', 'Detoxification'],
    ligandScore: 0
  },
  {
    productName: 'Ivermectin Suppositories',
    productType: 'supplement',
    cannabinoids: [],
    primaryIndications: ['Antiparasitic', 'Detoxification', 'Immune Support'],
    ligandScore: 0
  },
  {
    productName: 'Probiotic Suppositories',
    productType: 'supplement',
    cannabinoids: [],
    primaryIndications: ['Gut Health', 'Microbiome Restoration', 'Immune Support'],
    ligandScore: 0
  },
  {
    productName: 'EDTA Suppositories',
    productType: 'supplement',
    cannabinoids: [],
    primaryIndications: ['Heavy Metal Chelation', 'Detoxification', 'Cardiovascular Support'],
    ligandScore: 0
  },
  {
    productName: 'Ozonated Hemp Oil Suppositories',
    productType: 'supplement',
    cannabinoids: ['CBD', 'CBC'],
    primaryIndications: ['Gut Health', 'Inflammation', 'Oxygenation'],
    ligandScore: 5
  }
];

// GO Function Enrichment Analysis (Table S3, top 50 by significance)
export const goEnrichmentTerms: GOEnrichmentTerm[] = [
  { id: 'GO:0020037', description: 'heme binding', geneRatio: '24/221', pAdjust: 1.18e-18, genes: ['CYP1A1', 'HBB', 'NOX4', 'CAT', 'CYCS', 'CYP2C19', 'PTGS2', 'IDO1', 'CYP1B1', 'CYP3A4', 'CYP3A7', 'PTGS1', 'NOS2', 'CYP1A2', 'CYP2C9', 'CYP2D6', 'CYP2A6', 'CYP17A1', 'MB', 'CYBA', 'HBA2', 'CYP3A5', 'HMOX1', 'FA2H'], count: 24 },
  { id: 'GO:0046906', description: 'tetrapyrrole binding', geneRatio: '24/221', pAdjust: 3.67e-18, genes: ['CYP1A1', 'HBB', 'NOX4', 'CAT', 'CYCS', 'CYP2C19', 'PTGS2', 'IDO1', 'CYP1B1', 'CYP3A4', 'CYP3A7', 'PTGS1', 'NOS2', 'CYP1A2', 'CYP2C9', 'CYP2D6', 'CYP2A6', 'CYP17A1', 'MB', 'CYBA', 'HBA2', 'CYP3A5', 'HMOX1', 'FA2H'], count: 24 },
  { id: 'GO:0048037', description: 'cofactor binding', geneRatio: '38/221', pAdjust: 3.39e-17, genes: ['CYP1A1', 'NOX1', 'HBB', 'NOX4', 'CAT', 'CYCS', 'ALB', 'CYP2C19', 'PTGS2', 'IDO1', 'CYP1B1', 'CYP3A4', 'CYP3A7', 'PTGS1', 'NOS2', 'CYP1A2', 'PARP1', 'CYP2C9', 'CYP2D6', 'CYP2A6', 'TH', 'CYP17A1', 'CRYZ', 'KYNU', 'GSTP1', 'GCLC', 'GSTM3', 'HMGCR', 'MB', 'FASN', 'GSR', 'CYBA', 'SDHA', 'ACAT1', 'HBA2', 'CYP3A5', 'HMOX1', 'FA2H'], count: 38 },
  { id: 'GO:0005262', description: 'calcium channel activity', geneRatio: '20/221', pAdjust: 8.37e-15, genes: ['GRIN2B', 'CNR1', 'GRIN1', 'TRPV1', 'OPRM1', 'TRPM8', 'HTR1B', 'GRIN3A', 'TRPC6', 'TRPV4', 'TRPV2', 'CACNA1I', 'CACNA1H', 'CACNA1G', 'GRIN2D', 'CACNA1C', 'CHRNA7', 'TRPA1', 'TRPV3', 'GRIN3B'], count: 20 },
  { id: 'GO:0019825', description: 'oxygen binding', geneRatio: '13/221', pAdjust: 2.54e-14, genes: ['CYP1A1', 'HBB', 'NOX4', 'ALB', 'CYP2C19', 'CYP1B1', 'CYP3A4', 'CYP3A7', 'TH', 'CYP17A1', 'MB', 'HBA2', 'CYP3A5'], count: 13 },
  { id: 'GO:0005506', description: 'iron ion binding', geneRatio: '21/221', pAdjust: 2.82e-14, genes: ['CYP1A1', 'CYP2C19', 'ALOX5', 'CYP1B1', 'CYP3A4', 'CYP3A7', 'ALOX15', 'CYP1A2', 'CYP2C9', 'CYP2D6', 'ALOX15B', 'CYP2A6', 'TH', 'CYP17A1', 'ALOX12B', 'FTL', 'HBA2', 'CYP3A5', 'ALOX12', 'FA2H', 'ALOXE3'], count: 21 },
  { id: 'GO:0015085', description: 'calcium ion transmembrane transporter activity', geneRatio: '20/221', pAdjust: 5.64e-14, genes: ['GRIN2B', 'CNR1', 'GRIN1', 'TRPV1', 'OPRM1', 'TRPM8', 'HTR1B', 'GRIN3A', 'TRPC6', 'TRPV4', 'TRPV2', 'CACNA1I', 'CACNA1H', 'CACNA1G', 'GRIN2D', 'CACNA1C', 'CHRNA7', 'TRPA1', 'TRPV3', 'GRIN3B'], count: 20 },
  { id: 'GO:0004879', description: 'nuclear receptor activity', geneRatio: '14/221', pAdjust: 5.87e-14, genes: ['RXRB', 'NR1I3', 'ESR1', 'PGR', 'PPARG', 'PPARA', 'AR', 'VDR', 'ESR2', 'NR1I2', 'AHR', 'RORC', 'NR3C1', 'PPARD'], count: 14 },
  { id: 'GO:0098531', description: 'transcription factor activity, direct ligand regulated sequence-specific DNA binding', geneRatio: '14/221', pAdjust: 5.87e-14, genes: ['RXRB', 'NR1I3', 'ESR1', 'PGR', 'PPARG', 'PPARA', 'AR', 'VDR', 'ESR2', 'NR1I2', 'AHR', 'RORC', 'NR3C1', 'PPARD'], count: 14 },
  { id: 'GO:0043177', description: 'organic acid binding', geneRatio: '23/221', pAdjust: 5.92e-14, genes: ['HBB', 'UGT1A1', 'UGT1A7', 'UGT1A9', 'GRIN2B', 'ALB', 'GRIN1', 'NOS2', 'PPARG', 'PPARA', 'VDR', 'TH', 'GRIN3A', 'GLRA1', 'UGT1A8', 'GLRA3', 'GCLC', 'PLA2G1B', 'GLRB', 'PPARD', 'HBA2', 'GRIN3B', 'PMP2'], count: 23 },
  { id: 'GO:0003707', description: 'steroid hormone receptor activity', geneRatio: '14/221', pAdjust: 1.59e-13, genes: ['RXRB', 'NR1I3', 'ESR1', 'PGR', 'PPARG', 'PPARA', 'AR', 'NR3C2', 'VDR', 'ESR2', 'NR1I2', 'RORC', 'NR3C1', 'PPARD'], count: 14 },
  { id: 'GO:0042165', description: 'neurotransmitter binding', geneRatio: '14/221', pAdjust: 1.93e-13, genes: ['GRIN2B', 'GRIN1', 'HTR2A', 'HTR1B', 'HTR1A', 'GRIN3A', 'HTR3A', 'GLRA1', 'GLRA3', 'ACHE', 'GLRB', 'BCHE', 'CHRNA7', 'GRIN3B'], count: 14 },
  { id: 'GO:0031406', description: 'carboxylic acid binding', geneRatio: '21/221', pAdjust: 1.55e-12, genes: ['UGT1A1', 'UGT1A7', 'UGT1A9', 'GRIN2B', 'ALB', 'GRIN1', 'NOS2', 'PPARG', 'PPARA', 'VDR', 'TH', 'GRIN3A', 'GLRA1', 'UGT1A8', 'GLRA3', 'GCLC', 'PLA2G1B', 'GLRB', 'PPARD', 'GRIN3B', 'PMP2'], count: 21 },
  { id: 'GO:0030594', description: 'neurotransmitter receptor activity', geneRatio: '17/221', pAdjust: 3.80e-12, genes: ['GRIN2B', 'GRIN1', 'HTR2A', 'OPRM1', 'HTR1B', 'ADORA1', 'HTR1D', 'HTR1A', 'GRIN3A', 'DRD2', 'HTR3A', 'GLRA1', 'GLRA3', 'GRIN2D', 'GLRB', 'CHRNA7', 'GRIN3B'], count: 17 },
  { id: 'GO:0016712', description: 'oxidoreductase activity, acting on paired donors, with incorporation or reduction of molecular oxygen, reduced flavin or flavoprotein as one donor, and incorporation of one atom of oxygen', geneRatio: '10/221', pAdjust: 1.42e-10, genes: ['CYP1A1', 'CYP2C19', 'CYP1B1', 'CYP3A4', 'CYP3A7', 'CYP1A2', 'CYP2C9', 'CYP2D6', 'CYP2A6', 'CYP3A5'], count: 10 },
  { id: 'GO:0005216', description: 'ion channel activity', geneRatio: '27/221', pAdjust: 1.63e-10, genes: ['GRIN2B', 'CNR1', 'GRIN1', 'TRPV1', 'OPRM1', 'TRPM8', 'HTR1B', 'GRIN3A', 'HTR3A', 'TRPC6', 'GLRA1', 'GLRA3', 'TRPV4', 'TRPV2', 'CACNA1I', 'CACNA1H', 'CACNA1G', 'GRIN2D', 'VDAC1', 'GLRB', 'KCNIP3', 'CACNA1C', 'CHRNA7', 'TRPA1', 'SCN8A', 'TRPV3', 'GRIN3B'], count: 27 },
  { id: 'GO:0015267', description: 'channel activity', geneRatio: '28/221', pAdjust: 2.13e-10, genes: ['NOX1', 'GRIN2B', 'CNR1', 'GRIN1', 'TRPV1', 'OPRM1', 'TRPM8', 'HTR1B', 'GRIN3A', 'HTR3A', 'TRPC6', 'GLRA1', 'GLRA3', 'TRPV4', 'TRPV2', 'CACNA1I', 'CACNA1H', 'CACNA1G', 'GRIN2D', 'VDAC1', 'GLRB', 'KCNIP3', 'CACNA1C', 'CHRNA7', 'TRPA1', 'SCN8A', 'TRPV3', 'GRIN3B'], count: 28 },
  { id: 'GO:0022803', description: 'passive transmembrane transporter activity', geneRatio: '28/221', pAdjust: 2.13e-10, genes: ['NOX1', 'GRIN2B', 'CNR1', 'GRIN1', 'TRPV1', 'OPRM1', 'TRPM8', 'HTR1B', 'GRIN3A', 'HTR3A', 'TRPC6', 'GLRA1', 'GLRA3', 'TRPV4', 'TRPV2', 'CACNA1I', 'CACNA1H', 'CACNA1G', 'GRIN2D', 'VDAC1', 'GLRB', 'KCNIP3', 'CACNA1C', 'CHRNA7', 'TRPA1', 'SCN8A', 'TRPV3', 'GRIN3B'], count: 28 },
  { id: 'GO:0022839', description: 'ion gated channel activity', geneRatio: '24/221', pAdjust: 2.60e-10, genes: ['NOX1', 'GRIN2B', 'CNR1', 'GRIN1', 'TRPV1', 'OPRM1', 'HTR1B', 'GRIN3A', 'HTR3A', 'GLRA1', 'GLRA3', 'TRPV4', 'CACNA1I', 'CACNA1H', 'CACNA1G', 'GRIN2D', 'VDAC1', 'GLRB', 'KCNIP3', 'CACNA1C', 'CHRNA7', 'TRPA1', 'SCN8A', 'GRIN3B'], count: 24 },
  { id: 'GO:0022838', description: 'substrate-specific channel activity', geneRatio: '27/221', pAdjust: 2.90e-10, genes: ['GRIN2B', 'CNR1', 'GRIN1', 'TRPV1', 'OPRM1', 'TRPM8', 'HTR1B', 'GRIN3A', 'HTR3A', 'TRPC6', 'GLRA1', 'GLRA3', 'TRPV4', 'TRPV2', 'CACNA1I', 'CACNA1H', 'CACNA1G', 'GRIN2D', 'VDAC1', 'GLRB', 'KCNIP3', 'CACNA1C', 'CHRNA7', 'TRPA1', 'SCN8A', 'TRPV3', 'GRIN3B'], count: 27 },
  { id: 'GO:0005261', description: 'cation channel activity', geneRatio: '23/221', pAdjust: 3.88e-10, genes: ['GRIN2B', 'CNR1', 'GRIN1', 'TRPV1', 'OPRM1', 'TRPM8', 'HTR1B', 'GRIN3A', 'HTR3A', 'TRPC6', 'TRPV4', 'TRPV2', 'CACNA1I', 'CACNA1H', 'CACNA1G', 'GRIN2D', 'KCNIP3', 'CACNA1C', 'CHRNA7', 'TRPA1', 'SCN8A', 'TRPV3', 'GRIN3B'], count: 23 },
  { id: 'GO:0022836', description: 'gated channel activity', geneRatio: '24/221', pAdjust: 3.88e-10, genes: ['NOX1', 'GRIN2B', 'CNR1', 'GRIN1', 'TRPV1', 'OPRM1', 'HTR1B', 'GRIN3A', 'HTR3A', 'GLRA1', 'GLRA3', 'TRPV4', 'CACNA1I', 'CACNA1H', 'CACNA1G', 'GRIN2D', 'VDAC1', 'GLRB', 'KCNIP3', 'CACNA1C', 'CHRNA7', 'TRPA1', 'SCN8A', 'GRIN3B'], count: 24 },
  { id: 'GO:0016209', description: 'antioxidant activity', geneRatio: '13/221', pAdjust: 1.20e-09, genes: ['SOD2', 'SOD1', 'HBB', 'GPX1', 'CAT', 'ALB', 'PTGS2', 'PTGS1', 'NQO1', 'GSTP1', 'GSTO1', 'GSR', 'HBA2'], count: 13 },
  { id: 'GO:0005496', description: 'steroid binding', geneRatio: '13/221', pAdjust: 1.80e-09, genes: ['UGT1A1', 'CYP3A4', 'ESR1', 'PGR', 'AR', 'NR3C2', 'VDR', 'ESR2', 'UGT1A8', 'RORC', 'NR3C1', 'PMP2', 'CETP'], count: 13 },
  { id: 'GO:0016705', description: 'oxidoreductase activity, acting on paired donors', geneRatio: '16/221', pAdjust: 4.20e-09, genes: ['CYP1A1', 'CYP2C19', 'PTGS2', 'CYP1B1', 'CYP3A4', 'CYP3A7', 'PTGS1', 'NOS2', 'CYP1A2', 'CYP2C9', 'CYP2D6', 'CYP2A6', 'TH', 'CYP17A1', 'CYP3A5', 'HMOX1'], count: 16 },
  { id: 'GO:0016594', description: 'glycine binding', geneRatio: '7/221', pAdjust: 5.39e-09, genes: ['GRIN2B', 'GRIN1', 'GRIN3A', 'GLRA1', 'GLRA3', 'GLRB', 'GRIN3B'], count: 7 },
  { id: 'GO:0004497', description: 'monooxygenase activity', geneRatio: '13/221', pAdjust: 5.53e-09, genes: ['CYP1A1', 'CYP2C19', 'CYP1B1', 'CYP3A4', 'CYP3A7', 'NOS2', 'CYP1A2', 'CYP2C9', 'CYP2D6', 'CYP2A6', 'TH', 'CYP17A1', 'CYP3A5'], count: 13 },
  { id: 'GO:0008395', description: 'steroid hydroxylase activity', geneRatio: '9/221', pAdjust: 6.62e-09, genes: ['CYP1A1', 'CYP2C19', 'CYP3A4', 'CYP3A7', 'CYP2C9', 'CYP2D6', 'CYP2A6', 'CYP17A1', 'CYP3A5'], count: 9 },
  { id: 'GO:0033293', description: 'monocarboxylic acid binding', geneRatio: '11/221', pAdjust: 7.19e-09, genes: ['UGT1A1', 'UGT1A7', 'UGT1A9', 'ALB', 'PPARG', 'PPARA', 'VDR', 'UGT1A8', 'PLA2G1B', 'PPARD', 'PMP2'], count: 11 },
  { id: 'GO:0016702', description: 'oxidoreductase activity, acting on single donors with incorporation of molecular oxygen, incorporation of two atoms of oxygen', geneRatio: '8/221', pAdjust: 1.74e-08, genes: ['ALOX5', 'PTGS2', 'IDO1', 'ALOX15', 'ALOX15B', 'ALOX12B', 'ALOX12', 'ALOXE3'], count: 8 },
  { id: 'GO:0016701', description: 'oxidoreductase activity, acting on single donors with incorporation of molecular oxygen', geneRatio: '8/221', pAdjust: 2.33e-08, genes: ['ALOX5', 'PTGS2', 'IDO1', 'ALOX15', 'ALOX15B', 'ALOX12B', 'ALOX12', 'ALOXE3'], count: 8 },
  { id: 'GO:0009931', description: 'calcium-dependent protein serine/threonine kinase activity', geneRatio: '6/221', pAdjust: 2.67e-08, genes: ['PRKCA', 'CCL3', 'PRKCB', 'MAPKAPK2', 'MAPKAPK3', 'MAPKAPK5'], count: 6 },
  { id: 'GO:0070405', description: 'ammonium ion binding', geneRatio: '11/221', pAdjust: 3.18e-08, genes: ['HTR2A', 'HTR1B', 'TH', 'HTR1A', 'DRD2', 'HTR3A', 'ACHE', 'BCHE', 'CHRNA7', 'GPR12', 'CETP'], count: 11 },
  { id: 'GO:0005230', description: 'extracellular ligand-gated ion channel activity', geneRatio: '11/221', pAdjust: 3.58e-08, genes: ['GRIN2B', 'GRIN1', 'TRPV1', 'GRIN3A', 'HTR3A', 'GLRA1', 'GLRA3', 'GRIN2D', 'GLRB', 'CHRNA7', 'GRIN3B'], count: 11 },
  { id: 'GO:0016597', description: 'amino acid binding', geneRatio: '10/221', pAdjust: 4.40e-08, genes: ['GRIN2B', 'GRIN1', 'NOS2', 'TH', 'GRIN3A', 'GLRA1', 'GLRA3', 'GCLC', 'GLRB', 'GRIN3B'], count: 10 },
  { id: 'GO:0010857', description: 'calcium-dependent protein kinase activity', geneRatio: '6/221', pAdjust: 4.69e-08, genes: ['PRKCA', 'CCL3', 'PRKCB', 'MAPKAPK2', 'MAPKAPK3', 'MAPKAPK5'], count: 6 },
  { id: 'GO:0022824', description: 'transmitter-gated ion channel activity', geneRatio: '10/221', pAdjust: 5.69e-08, genes: ['GRIN2B', 'GRIN1', 'GRIN3A', 'HTR3A', 'GLRA1', 'GLRA3', 'GRIN2D', 'GLRB', 'CHRNA7', 'GRIN3B'], count: 10 },
  { id: 'GO:0022835', description: 'transmitter-gated channel activity', geneRatio: '10/221', pAdjust: 5.69e-08, genes: ['GRIN2B', 'GRIN1', 'GRIN3A', 'HTR3A', 'GLRA1', 'GLRA3', 'GRIN2D', 'GLRB', 'CHRNA7', 'GRIN3B'], count: 10 },
  { id: 'GO:0005244', description: 'voltage-gated ion channel activity', geneRatio: '15/221', pAdjust: 4.37e-07, genes: ['NOX1', 'GRIN2B', 'CNR1', 'GRIN1', 'OPRM1', 'HTR1B', 'GRIN3A', 'CACNA1I', 'CACNA1H', 'CACNA1G', 'GRIN2D', 'VDAC1', 'KCNIP3', 'CACNA1C', 'SCN8A'], count: 15 },
  { id: 'GO:0022832', description: 'voltage-gated channel activity', geneRatio: '15/221', pAdjust: 4.37e-07, genes: ['NOX1', 'GRIN2B', 'CNR1', 'GRIN1', 'OPRM1', 'HTR1B', 'GRIN3A', 'CACNA1I', 'CACNA1H', 'CACNA1G', 'GRIN2D', 'VDAC1', 'KCNIP3', 'CACNA1C', 'SCN8A'], count: 15 },
  { id: 'GO:0046873', description: 'metal ion transmembrane transporter activity', geneRatio: '22/221', pAdjust: 5.87e-07, genes: ['GRIN2B', 'CNR1', 'GRIN1', 'TRPV1', 'OPRM1', 'TRPM8', 'HTR1B', 'GRIN3A', 'TRPC6', 'TRPV4', 'TRPV2', 'CACNA1I', 'CACNA1H', 'CACNA1G', 'GRIN2D', 'KCNIP3', 'CACNA1C', 'CHRNA7', 'TRPA1', 'SCN8A', 'TRPV3', 'GRIN3B'], count: 22 },
  { id: 'GO:0070330', description: 'aromatase activity', geneRatio: '6/221', pAdjust: 2.92e-06, genes: ['CYP1A1', 'CYP1B1', 'CYP3A7', 'CYP1A2', 'CYP2D6', 'CYP3A5'], count: 6 },
  { id: 'GO:0015276', description: 'ligand-gated ion channel activity', geneRatio: '12/221', pAdjust: 3.30e-06, genes: ['GRIN2B', 'GRIN1', 'TRPV1', 'GRIN3A', 'HTR3A', 'GLRA1', 'GLRA3', 'GRIN2D', 'GLRB', 'CHRNA7', 'TRPA1', 'GRIN3B'], count: 12 },
  { id: 'GO:0022834', description: 'ligand-gated channel activity', geneRatio: '12/221', pAdjust: 3.30e-06, genes: ['GRIN2B', 'GRIN1', 'TRPV1', 'GRIN3A', 'HTR3A', 'GLRA1', 'GLRA3', 'GRIN2D', 'GLRB', 'CHRNA7', 'TRPA1', 'GRIN3B'], count: 12 },
  { id: 'GO:0022843', description: 'voltage-gated cation channel activity', geneRatio: '11/221', pAdjust: 2.27e-05, genes: ['GRIN2B', 'CNR1', 'GRIN1', 'OPRM1', 'HTR1B', 'GRIN3A', 'CACNA1I', 'CACNA1H', 'CACNA1G', 'GRIN2D', 'CACNA1C'], count: 11 },
  { id: 'GO:0005245', description: 'voltage-gated calcium channel activity', geneRatio: '7/221', pAdjust: 2.45e-05, genes: ['CNR1', 'OPRM1', 'HTR1B', 'CACNA1I', 'CACNA1H', 'CACNA1G', 'CACNA1C'], count: 7 },
  { id: 'GO:0051213', description: 'dioxygenase activity', geneRatio: '9/221', pAdjust: 2.61e-05, genes: ['ALOX5', 'PTGS2', 'IDO1', 'ALOX15', 'PTGS1', 'ALOX15B', 'ALOX12B', 'ALOX12', 'ALOXE3'], count: 9 },
  { id: 'GO:0015020', description: 'glucuronosyltransferase activity', geneRatio: '6/221', pAdjust: 2.80e-05, genes: ['UGT1A10', 'UGT1A1', 'UGT1A7', 'UGT1A9', 'UGT1A8', 'UGT2B7'], count: 6 },
  { id: 'GO:0050661', description: 'NADP binding', geneRatio: '7/221', pAdjust: 3.06e-05, genes: ['NOX1', 'CAT', 'NOS2', 'CRYZ', 'HMGCR', 'FASN', 'GSR'], count: 7 },
  { id: 'GO:0004970', description: 'ionotropic glutamate receptor activity', geneRatio: '5/221', pAdjust: 3.18e-05, genes: ['GRIN2B', 'GRIN1', 'GRIN3A', 'GRIN2D', 'GRIN3B'], count: 5 }
];

// KEGG Pathway Enrichment Analysis (Table S4, 101 pathways)
export const keggPathways: KEGGPathway[] = [
  { id: 'hsa04080', description: 'Neuroactive ligand-receptor interaction', category: 'Environmental Information Processing', geneRatio: '27/188', pAdjust: 7.04e-07, genes: ['GRIN2B', 'CNR1', 'GRIN1', 'CNR2', 'TRPV1', 'HTR2A', 'OPRM1', 'HTR1B', 'ADORA1', 'HTR1D', 'HTR1A', 'GRIN3A', 'DRD2', 'NPY5R', 'LTB4R2', 'LTB4R', 'GLRA1', 'S1PR1', 'MTNR1B', 'GLRA3', 'GRIN2D', 'GLRB', 'GHRL', 'CHRNA7', 'NR3C1', 'OPRD1', 'GRIN3B'], count: 27 },
  { id: 'hsa04010', description: 'MAPK signaling pathway', category: 'Environmental Information Processing', geneRatio: '24/188', pAdjust: 2.49e-06, genes: ['AKT1', 'TNF', 'EGFR', 'INS', 'FLT1', 'KDR', 'PRKCA', 'ERBB2', 'BDNF', 'FLT4', 'PRKCB', 'ATF2', 'MAPKAPK2', 'MAPKAPK3', 'MAP3K3', 'IL1B', 'CACNA1I', 'CACNA1H', 'CACNA1G', 'PLA2G4F', 'MAPT', 'CACNA1C', 'MAPKAPK5', 'FLNB'], count: 24 },
  { id: 'hsa05204', description: 'Chemical carcinogenesis', category: 'Human Diseases', geneRatio: '21/188', pAdjust: 3.66e-14, genes: ['CYP1A1', 'UGT1A10', 'UGT1A1', 'UGT1A7', 'UGT1A9', 'CYP2C19', 'PTGS2', 'CYP1B1', 'CYP3A4', 'CYP3A7', 'CYP1A2', 'CYP2C9', 'CYP2A6', 'GSTP1', 'UGT1A8', 'GSTA2', 'UGT2B7', 'GSTO1', 'GSTM3', 'CHRNA7', 'CYP3A5'], count: 21 },
  { id: 'hsa05163', description: 'Human cytomegalovirus infection', category: 'Human Diseases', geneRatio: '20/188', pAdjust: 6.41e-06, genes: ['AKT1', 'CASP9', 'TNF', 'EGFR', 'RHOA', 'CCL5', 'CXCL8', 'CCL4', 'E2F1', 'CYCS', 'CREB1', 'PTGS2', 'PRKCA', 'B2M', 'CCL3', 'PRKCB', 'ATF2', 'IL1B', 'IFNA1', 'GNA11'], count: 20 },
  { id: 'hsa04726', description: 'Serotonergic synapse', category: 'Organismal Systems', geneRatio: '19/188', pAdjust: 1.27e-09, genes: ['CYP2C19', 'ALOX5', 'PTGS2', 'PRKCA', 'ALOX15', 'PTGS1', 'CYP2C9', 'CYP2D6', 'HTR2A', 'ALOX15B', 'PRKCB', 'HTR1B', 'HTR1D', 'HTR1A', 'HTR3A', 'ALOX12B', 'PLA2G4F', 'CACNA1C', 'ALOX12'], count: 19 },
  { id: 'hsa00980', description: 'Metabolism of xenobiotics by cytochrome P450', category: 'Metabolism', geneRatio: '18/188', pAdjust: 1.33e-11, genes: ['CYP1A1', 'UGT1A10', 'UGT1A1', 'UGT1A7', 'UGT1A9', 'CYP1B1', 'CYP3A4', 'CYP1A2', 'CYP2C9', 'CYP2D6', 'CYP2A6', 'GSTP1', 'UGT1A8', 'GSTA2', 'UGT2B7', 'GSTO1', 'GSTM3', 'CYP3A5'], count: 18 },
  { id: 'hsa04024', description: 'cAMP signaling pathway', category: 'Environmental Information Processing', geneRatio: '18/188', pAdjust: 3.38e-05, genes: ['AKT1', 'RHOA', 'GRIN2B', 'CREB1', 'GRIN1', 'BDNF', 'PPARA', 'HTR1B', 'ADORA1', 'HTR1D', 'HTR1A', 'GRIN3A', 'DRD2', 'GRIN2D', 'GHRL', 'ADCY10', 'CACNA1C', 'GRIN3B'], count: 18 },
  { id: 'hsa00982', description: 'Drug metabolism - cytochrome P450', category: 'Metabolism', geneRatio: '17/188', pAdjust: 4.69e-11, genes: ['UGT1A10', 'UGT1A1', 'UGT1A7', 'UGT1A9', 'CYP2C19', 'CYP3A4', 'CYP1A2', 'CYP2C9', 'CYP2D6', 'CYP2A6', 'GSTP1', 'UGT1A8', 'GSTA2', 'UGT2B7', 'GSTO1', 'GSTM3', 'CYP3A5'], count: 17 },
  { id: 'hsa05418', description: 'Fluid shear stress and atherosclerosis', category: 'Human Diseases', geneRatio: '17/188', pAdjust: 7.04e-07, genes: ['AKT1', 'NOX1', 'TNF', 'RHOA', 'KDR', 'NQO1', 'VCAM1', 'IFNG', 'ICAM1', 'GSTP1', 'TRPV4', 'GSTA2', 'IL1B', 'GSTO1', 'GSTM3', 'CYBA', 'HMOX1'], count: 17 },
  { id: 'hsa04020', description: 'Calcium signaling pathway', category: 'Environmental Information Processing', geneRatio: '17/188', pAdjust: 3.38e-05, genes: ['EGFR', 'GRIN1', 'PRKCA', 'ERBB2', 'NOS2', 'HTR2A', 'PRKCB', 'PLCG1', 'LTB4R2', 'CACNA1I', 'CACNA1H', 'CACNA1G', 'GRIN2D', 'VDAC1', 'CACNA1C', 'CHRNA7', 'GNA11'], count: 17 },
  { id: 'hsa04151', description: 'PI3K-Akt signaling pathway', category: 'Environmental Information Processing', geneRatio: '16/188', pAdjust: 2.73e-02, genes: ['AKT1', 'CASP9', 'EGFR', 'INS', 'PPP2CA', 'FLT1', 'CREB1', 'KDR', 'PRKCA', 'ERBB2', 'BDNF', 'FLT4', 'ATF2', 'IFNA1', 'IL2', 'PPP2CB'], count: 16 },
  { id: 'hsa04015', description: 'Rap1 signaling pathway', category: 'Environmental Information Processing', geneRatio: '15/188', pAdjust: 9.40e-04, genes: ['AKT1', 'EGFR', 'RHOA', 'GRIN2B', 'INS', 'FLT1', 'CNR1', 'GRIN1', 'KDR', 'PRKCA', 'FLT4', 'PRKCB', 'DRD2', 'PLCG1', 'ID1'], count: 15 },
  { id: 'hsa04014', description: 'Ras signaling pathway', category: 'Environmental Information Processing', geneRatio: '15/188', pAdjust: 2.24e-03, genes: ['AKT1', 'EGFR', 'RHOA', 'GRIN2B', 'INS', 'FLT1', 'GRIN1', 'KDR', 'PRKCA', 'BDNF', 'FLT4', 'PRKCB', 'PLCG1', 'PLA2G1B', 'PLA2G4F'], count: 15 },
  { id: 'hsa00140', description: 'Steroid hormone biosynthesis', category: 'Metabolism', geneRatio: '14/188', pAdjust: 4.07e-09, genes: ['CYP1A1', 'UGT1A10', 'UGT1A1', 'UGT1A7', 'UGT1A9', 'CYP1B1', 'CYP3A4', 'CYP3A7', 'CYP1A2', 'CYP17A1', 'UGT1A8', 'UGT2B7', 'COMT', 'CYP3A5'], count: 14 },
  { id: 'hsa05164', description: 'Influenza A', category: 'Human Diseases', geneRatio: '14/188', pAdjust: 3.88e-04, genes: ['AKT1', 'CASP9', 'TNF', 'CCL5', 'CXCL8', 'CYCS', 'SOCS3', 'PRKCA', 'PRKCB', 'IFNG', 'ICAM1', 'IL1B', 'IFNA1', 'VDAC1'], count: 14 },
  { id: 'hsa00830', description: 'Retinol metabolism', category: 'Metabolism', geneRatio: '13/188', pAdjust: 1.89e-07, genes: ['CYP1A1', 'UGT1A10', 'UGT1A1', 'UGT1A7', 'UGT1A9', 'CYP3A4', 'CYP3A7', 'CYP1A2', 'CYP2C9', 'CYP2A6', 'UGT1A8', 'UGT2B7', 'CYP3A5'], count: 13 },
  { id: 'hsa00983', description: 'Drug metabolism - other enzymes', category: 'Metabolism', geneRatio: '13/188', pAdjust: 8.36e-07, genes: ['UGT1A10', 'UGT1A1', 'UGT1A7', 'UGT1A9', 'CYP3A4', 'CYP2A6', 'GSTP1', 'UGT1A8', 'GSTA2', 'UGT2B7', 'GSTO1', 'GSTM3', 'GUSB'], count: 13 },
  { id: 'hsa04750', description: 'Inflammatory mediator regulation of TRP channels', category: 'Organismal Systems', geneRatio: '13/188', pAdjust: 1.00e-05, genes: ['PRKCA', 'TRPV1', 'HTR2A', 'PRKCB', 'TRPM8', 'PLCG1', 'TRPV4', 'IL1B', 'TRPV2', 'PLA2G4F', 'TRPA1', 'TRPV3', 'ALOX12'], count: 13 },
  { id: 'hsa05142', description: 'Chagas disease (American trypanosomiasis)', category: 'Human Diseases', geneRatio: '13/188', pAdjust: 1.19e-05, genes: ['AKT1', 'TNF', 'CCL5', 'CXCL8', 'PPP2CA', 'SERPINE1', 'NOS2', 'CCL3', 'IFNG', 'IL1B', 'IL2', 'PPP2CB', 'GNA11'], count: 13 },
  { id: 'hsa04066', description: 'HIF-1 signaling pathway', category: 'Environmental Information Processing', geneRatio: '13/188', pAdjust: 2.18e-05, genes: ['AKT1', 'EGFR', 'INS', 'FLT1', 'SERPINE1', 'PRKCA', 'ERBB2', 'NOS2', 'PRKCB', 'IFNG', 'PLCG1', 'TIMP1', 'HMOX1'], count: 13 },
  { id: 'hsa04071', description: 'Sphingolipid signaling pathway', category: 'Environmental Information Processing', geneRatio: '13/188', pAdjust: 4.38e-05, genes: ['AKT1', 'TNF', 'RHOA', 'PPP2CA', 'PRKCA', 'FYN', 'PRKCB', 'ABCC1', 'ADORA1', 'SMPD1', 'S1PR1', 'OPRD1', 'PPP2CB'], count: 13 },
  { id: 'hsa05034', description: 'Alcoholism', category: 'Human Diseases', geneRatio: '13/188', pAdjust: 1.94e-03, genes: ['GRIN2B', 'CREB1', 'GRIN1', 'BDNF', 'TH', 'GRIN3A', 'DRD2', 'ATF2', 'GRIN2D', 'SLC29A1', 'HDAC7', 'GRIN3B', 'H3F3B'], count: 13 },
  { id: 'hsa00590', description: 'Arachidonic acid metabolism', category: 'Metabolism', geneRatio: '12/188', pAdjust: 7.04e-07, genes: ['GPX1', 'CYP2C19', 'ALOX5', 'PTGS2', 'ALOX15', 'PTGS1', 'CYP2C9', 'ALOX15B', 'ALOX12B', 'PLA2G1B', 'PLA2G4F', 'ALOX12'], count: 12 },
  { id: 'hsa04713', description: 'Circadian entrainment', category: 'Organismal Systems', geneRatio: '12/188', pAdjust: 3.38e-05, genes: ['GRIN2B', 'CREB1', 'GRIN1', 'PRKCA', 'PRKCB', 'MTNR1B', 'CACNA1I', 'CACNA1H', 'CACNA1G', 'GRIN2D', 'ADCY10', 'CACNA1C'], count: 12 },
  { id: 'hsa04933', description: 'AGE-RAGE signaling pathway in diabetic complications', category: 'Human Diseases', geneRatio: '12/188', pAdjust: 3.99e-05, genes: ['AKT1', 'NOX1', 'NOX4', 'TNF', 'CXCL8', 'SERPINE1', 'PRKCA', 'PRKCB', 'VCAM1', 'ICAM1', 'PLCG1', 'IL1B'], count: 12 },
  { id: 'hsa04728', description: 'Dopaminergic synapse', category: 'Organismal Systems', geneRatio: '12/188', pAdjust: 4.71e-04, genes: ['AKT1', 'GRIN2B', 'PPP2CA', 'CREB1', 'PRKCA', 'PRKCB', 'TH', 'DRD2', 'ATF2', 'COMT', 'CACNA1C', 'PPP2CB'], count: 12 },
  { id: 'hsa04934', description: 'Cushing syndrome', category: 'Human Diseases', geneRatio: '12/188', pAdjust: 1.90e-03, genes: ['EGFR', 'E2F1', 'CREB1', 'CYP17A1', 'ATF2', 'MEN1', 'CACNA1I', 'CACNA1H', 'CACNA1G', 'AHR', 'CACNA1C', 'GNA11'], count: 12 },
  { id: 'hsa05160', description: 'Hepatitis C', category: 'Human Diseases', geneRatio: '12/188', pAdjust: 1.90e-03, genes: ['AKT1', 'CASP9', 'TNF', 'EGFR', 'PPP2CA', 'E2F1', 'CYCS', 'SOCS3', 'PPARA', 'IFNG', 'IFNA1', 'PPP2CB'], count: 12 },
  { id: 'hsa05161', description: 'Hepatitis B', category: 'Human Diseases', geneRatio: '12/188', pAdjust: 2.50e-03, genes: ['AKT1', 'CASP9', 'TNF', 'CXCL8', 'E2F1', 'CYCS', 'CREB1', 'PRKCA', 'PRKCB', 'ATF2', 'CCNA2', 'IFNA1'], count: 12 },
  { id: 'hsa05225', description: 'Hepatocellular carcinoma', category: 'Human Diseases', geneRatio: '12/188', pAdjust: 3.27e-03, genes: ['AKT1', 'EGFR', 'E2F1', 'PRKCA', 'NQO1', 'PRKCB', 'PLCG1', 'GSTP1', 'GSTA2', 'GSTO1', 'GSTM3', 'HMOX1'], count: 12 },
  { id: 'hsa05016', description: 'Huntington disease', category: 'Human Diseases', geneRatio: '12/188', pAdjust: 8.57e-03, genes: ['CASP9', 'SOD2', 'SOD1', 'GRIN2B', 'GPX1', 'CYCS', 'CREB1', 'GRIN1', 'BDNF', 'PPARG', 'VDAC1', 'SDHA'], count: 12 },
  { id: 'hsa04510', description: 'Focal adhesion', category: 'Cellular Processes', geneRatio: '12/188', pAdjust: 1.04e-02, genes: ['AKT1', 'EGFR', 'RHOA', 'FLT1', 'KDR', 'PRKCA', 'ERBB2', 'FYN', 'FLT4', 'PRKCB', 'FLNB', 'ARHGAP5'], count: 12 },
  { id: 'hsa05170', description: 'Human immunodeficiency virus 1 infection', category: 'Human Diseases', geneRatio: '12/188', pAdjust: 1.50e-02, genes: ['AKT1', 'CASP9', 'TNF', 'CYCS', 'CUL1', 'PRKCA', 'B2M', 'PRKCB', 'PLCG1', 'AP1G1', 'IFNA1', 'GNA11'], count: 12 },
  { id: 'hsa05031', description: 'Amphetamine addiction', category: 'Human Diseases', geneRatio: '11/188', pAdjust: 8.59e-06, genes: ['GRIN2B', 'CREB1', 'GRIN1', 'PRKCA', 'PRKCB', 'TH', 'GRIN3A', 'ATF2', 'GRIN2D', 'CACNA1C', 'GRIN3B'], count: 11 },
  { id: 'hsa04668', description: 'TNF signaling pathway', category: 'Environmental Information Processing', geneRatio: '11/188', pAdjust: 4.92e-04, genes: ['AKT1', 'TNF', 'CCL5', 'CASP7', 'CREB1', 'PTGS2', 'SOCS3', 'VCAM1', 'ICAM1', 'ATF2', 'IL1B'], count: 11 },
  { id: 'hsa05166', description: 'Human T-cell leukemia virus 1 infection', category: 'Human Diseases', geneRatio: '11/188', pAdjust: 3.82e-02, genes: ['AKT1', 'TNF', 'E2F1', 'CREB1', 'B2M', 'ICAM1', 'ATF2', 'MAP3K3', 'CCNA2', 'VDAC1', 'IL2'], count: 11 },
  { id: 'hsa04022', description: 'cGMP-PKG signaling pathway', category: 'Environmental Information Processing', geneRatio: '11/188', pAdjust: 8.56e-03, genes: ['AKT1', 'RHOA', 'INS', 'CREB1', 'ADORA1', 'TRPC6', 'ATF2', 'VDAC1', 'CACNA1C', 'OPRD1', 'GNA11'], count: 11 },
  { id: 'hsa05010', description: 'Alzheimer disease', category: 'Human Diseases', geneRatio: '11/188', pAdjust: 9.85e-03, genes: ['CASP9', 'TNF', 'GRIN2B', 'CYCS', 'CASP7', 'GRIN1', 'IL1B', 'GRIN2D', 'MAPT', 'CACNA1C', 'SDHA'], count: 11 },
  { id: 'hsa05152', description: 'Tuberculosis', category: 'Human Diseases', geneRatio: '11/188', pAdjust: 1.22e-02, genes: ['AKT1', 'CASP9', 'TNF', 'RHOA', 'CYCS', 'CREB1', 'NOS2', 'VDR', 'IFNG', 'IL1B', 'IFNA1'], count: 11 },
  { id: 'hsa05167', description: 'Kaposi sarcoma-associated herpesvirus infection', category: 'Human Diseases', geneRatio: '11/188', pAdjust: 1.53e-02, genes: ['AKT1', 'CASP9', 'CXCL8', 'E2F1', 'CYCS', 'CREB1', 'PTGS2', 'ICAM1', 'PLCG1', 'MAPKAPK2', 'IFNA1'], count: 11 },
  { id: 'hsa05205', description: 'Proteoglycans in cancer', category: 'Human Diseases', geneRatio: '11/188', pAdjust: 2.57e-02, genes: ['AKT1', 'TNF', 'EGFR', 'RHOA', 'KDR', 'PRKCA', 'ERBB2', 'ESR1', 'PRKCB', 'PLCG1', 'FLNB'], count: 11 },
  { id: 'hsa05143', description: 'African trypanosomiasis', category: 'Human Diseases', geneRatio: '10/188', pAdjust: 3.46e-07, genes: ['HBB', 'TNF', 'IDO1', 'PRKCA', 'PRKCB', 'VCAM1', 'IFNG', 'ICAM1', 'IL1B', 'HBA2'], count: 10 },
  { id: 'hsa05030', description: 'Cocaine addiction', category: 'Human Diseases', geneRatio: '10/188', pAdjust: 3.43e-06, genes: ['GRIN2B', 'CREB1', 'GRIN1', 'BDNF', 'TH', 'GRIN3A', 'DRD2', 'ATF2', 'GRIN2D', 'GRIN3B'], count: 10 },
  { id: 'hsa04370', description: 'VEGF signaling pathway', category: 'Environmental Information Processing', geneRatio: '10/188', pAdjust: 1.46e-05, genes: ['AKT1', 'CASP9', 'PTGS2', 'KDR', 'PRKCA', 'PRKCB', 'PLCG1', 'MAPKAPK2', 'MAPKAPK3', 'PLA2G4F'], count: 10 },
  { id: 'hsa04925', description: 'Aldosterone synthesis and secretion', category: 'Organismal Systems', geneRatio: '10/188', pAdjust: 7.47e-04, genes: ['CREB1', 'PRKCA', 'PRKCB', 'ATF2', 'CACNA1I', 'CACNA1H', 'CACNA1G', 'DAGLA', 'CACNA1C', 'GNA11'], count: 10 },
  { id: 'hsa04064', description: 'NF-kappa B signaling pathway', category: 'Environmental Information Processing', geneRatio: '10/188', pAdjust: 9.44e-04, genes: ['TNF', 'CXCL8', 'CCL4', 'PTGS2', 'PARP1', 'PRKCB', 'VCAM1', 'ICAM1', 'PLCG1', 'IL1B'], count: 10 },
  { id: 'hsa04152', description: 'AMPK signaling pathway', category: 'Environmental Information Processing', geneRatio: '10/188', pAdjust: 2.86e-03, genes: ['AKT1', 'INS', 'PPP2CA', 'CREB1', 'FBP1', 'PPARG', 'CCNA2', 'HMGCR', 'FASN', 'PPP2CB'], count: 10 },
  { id: 'hsa04380', description: 'Osteoclast differentiation', category: 'Organismal Systems', geneRatio: '10/188', pAdjust: 4.39e-03, genes: ['AKT1', 'NOX1', 'TNF', 'CREB1', 'SOCS3', 'FYN', 'PPARG', 'IFNG', 'IL1B', 'CYBA'], count: 10 },
  { id: 'hsa04072', description: 'Phospholipase D signaling pathway', category: 'Environmental Information Processing', geneRatio: '10/188', pAdjust: 1.04e-02, genes: ['AKT1', 'EGFR', 'RHOA', 'CXCL8', 'INS', 'PRKCA', 'FYN', 'PLCG1', 'PLA2G4F', 'DGKA'], count: 10 },
  { id: 'hsa04932', description: 'Non-alcoholic fatty liver disease (NAFLD)', category: 'Human Diseases', geneRatio: '10/188', pAdjust: 1.04e-02, genes: ['AKT1', 'TNF', 'CXCL8', 'INS', 'CYCS', 'CASP7', 'SOCS3', 'PPARA', 'IL1B', 'SDHA'], count: 10 },
  { id: 'hsa04217', description: 'Necroptosis', category: 'Cellular Processes', geneRatio: '10/188', pAdjust: 1.60e-02, genes: ['TNF', 'ALOX15', 'PARP1', 'IFNG', 'SMPD1', 'FTL', 'IL1B', 'IFNA1', 'VDAC1', 'PLA2G4F'], count: 10 },
  { id: 'hsa05014', description: 'Amyotrophic lateral sclerosis (ALS)', category: 'Human Diseases', geneRatio: '9/188', pAdjust: 3.27e-05, genes: ['CASP9', 'SOD1', 'TNF', 'GRIN2B', 'GPX1', 'CAT', 'CYCS', 'GRIN1', 'GRIN2D'], count: 9 },
  { id: 'hsa04929', description: 'GnRH secretion', category: 'Organismal Systems', geneRatio: '9/188', pAdjust: 1.53e-04, genes: ['AKT1', 'PRKCA', 'PRKCB', 'ESR2', 'CACNA1I', 'CACNA1H', 'CACNA1G', 'CACNA1C', 'GNA11'], count: 9 },
  { id: 'hsa05223', description: 'Non-small cell lung cancer', category: 'Human Diseases', geneRatio: '9/188', pAdjust: 1.92e-04, genes: ['AKT1', 'CASP9', 'EGFR', 'E2F1', 'RXRB', 'PRKCA', 'ERBB2', 'PRKCB', 'PLCG1'], count: 9 },
  { id: 'hsa05215', description: 'Prostate cancer', category: 'Human Diseases', geneRatio: '9/188', pAdjust: 2.51e-03, genes: ['AKT1', 'CASP9', 'EGFR', 'INS', 'E2F1', 'CREB1', 'ERBB2', 'AR', 'GSTP1'], count: 9 },
  { id: 'hsa04928', description: 'Parathyroid hormone synthesis, secretion and action', category: 'Organismal Systems', geneRatio: '9/188', pAdjust: 4.39e-03, genes: ['EGFR', 'RHOA', 'RXRB', 'CREB1', 'PRKCA', 'PRKCB', 'VDR', 'ATF2', 'GNA11'], count: 9 },
  { id: 'hsa04725', description: 'Cholinergic synapse', category: 'Organismal Systems', geneRatio: '9/188', pAdjust: 6.13e-03, genes: ['AKT1', 'CREB1', 'PRKCA', 'FYN', 'PRKCB', 'ACHE', 'CACNA1C', 'CHRNA7', 'GNA11'], count: 9 },
  { id: 'hsa04724', description: 'Glutamatergic synapse', category: 'Organismal Systems', geneRatio: '9/188', pAdjust: 6.83e-03, genes: ['GRIN2B', 'GRIN1', 'PRKCA', 'PRKCB', 'GRIN3A', 'GRIN2D', 'PLA2G4F', 'CACNA1C', 'GRIN3B'], count: 9 },
  { id: 'hsa00040', description: 'Pentose and glucuronate interconversions', category: 'Metabolism', geneRatio: '8/188', pAdjust: 1.39e-05, genes: ['UGT1A10', 'UGT1A1', 'UGT1A7', 'UGT1A9', 'AKR1B1', 'UGT1A8', 'UGT2B7', 'GUSB'], count: 8 },
  { id: 'hsa00380', description: 'Tryptophan metabolism', category: 'Metabolism', geneRatio: '8/188', pAdjust: 4.77e-05, genes: ['CYP1A1', 'CAT', 'IDO1', 'CYP1B1', 'CYP1A2', 'KYNU', 'ACAT1', 'AANAT'], count: 8 },
  { id: 'hsa00860', description: 'Porphyrin and chlorophyll metabolism', category: 'Metabolism', geneRatio: '8/188', pAdjust: 4.77e-05, genes: ['UGT1A10', 'UGT1A1', 'UGT1A7', 'UGT1A9', 'UGT1A8', 'UGT2B7', 'GUSB', 'HMOX1'], count: 8 },
  { id: 'hsa05144', description: 'Malaria', category: 'Human Diseases', geneRatio: '8/188', pAdjust: 1.53e-04, genes: ['HBB', 'TNF', 'CXCL8', 'VCAM1', 'IFNG', 'ICAM1', 'IL1B', 'HBA2'], count: 8 },
  { id: 'hsa04927', description: 'Cortisol synthesis and secretion', category: 'Organismal Systems', geneRatio: '8/188', pAdjust: 9.40e-04, genes: ['CREB1', 'CYP17A1', 'ATF2', 'CACNA1I', 'CACNA1H', 'CACNA1G', 'CACNA1C', 'GNA11'], count: 8 },
  { id: 'hsa01524', description: 'Platinum drug resistance', category: 'Human Diseases', geneRatio: '8/188', pAdjust: 1.90e-03, genes: ['AKT1', 'CASP9', 'CYCS', 'ERBB2', 'GSTP1', 'GSTA2', 'GSTO1', 'GSTM3'], count: 8 },
  { id: 'hsa05222', description: 'Small cell lung cancer', category: 'Human Diseases', geneRatio: '8/188', pAdjust: 6.95e-03, genes: ['AKT1', 'CASP9', 'E2F1', 'CYCS', 'RXRB', 'PTGS2', 'NOS2', 'TRAF4'], count: 8 },
  { id: 'hsa05323', description: 'Rheumatoid arthritis', category: 'Human Diseases', geneRatio: '8/188', pAdjust: 6.95e-03, genes: ['TNF', 'CCL5', 'CXCL8', 'FLT1', 'CCL3', 'IFNG', 'ICAM1', 'IL1B'], count: 8 },
  { id: 'hsa05146', description: 'Amoebiasis', category: 'Human Diseases', geneRatio: '8/188', pAdjust: 1.04e-02, genes: ['TNF', 'CXCL8', 'PRKCA', 'NOS2', 'PRKCB', 'IFNG', 'IL1B', 'GNA11'], count: 8 },
  { id: 'hsa04620', description: 'Toll-like receptor signaling pathway', category: 'Organismal Systems', geneRatio: '8/188', pAdjust: 1.15e-02, genes: ['AKT1', 'TNF', 'CCL5', 'CXCL8', 'CCL4', 'CCL3', 'IL1B', 'IFNA1'], count: 8 },
  { id: 'hsa04931', description: 'Insulin resistance', category: 'Human Diseases', geneRatio: '8/188', pAdjust: 1.39e-02, genes: ['AKT1', 'TNF', 'INS', 'PTPN1', 'CREB1', 'SOCS3', 'PPARA', 'PRKCB'], count: 8 },
  { id: 'hsa04670', description: 'Leukocyte transendothelial migration', category: 'Organismal Systems', geneRatio: '8/188', pAdjust: 1.60e-02, genes: ['RHOA', 'PRKCA', 'PRKCB', 'VCAM1', 'ICAM1', 'PLCG1', 'CYBA', 'ARHGAP5'], count: 8 },
  { id: 'hsa05135', description: 'Yersinia infection', category: 'Human Diseases', geneRatio: '8/188', pAdjust: 2.37e-02, genes: ['AKT1', 'TNF', 'RHOA', 'CXCL8', 'PLCG1', 'IL1B', 'IL2', 'ACTR3'], count: 8 },
  { id: 'hsa00591', description: 'Linoleic acid metabolism', category: 'Metabolism', geneRatio: '7/188', pAdjust: 3.99e-05, genes: ['CYP2C19', 'CYP3A4', 'ALOX15', 'CYP1A2', 'CYP2C9', 'PLA2G1B', 'PLA2G4F'], count: 7 },
  { id: 'hsa04913', description: 'Ovarian steroidogenesis', category: 'Organismal Systems', geneRatio: '7/188', pAdjust: 9.40e-04, genes: ['CYP1A1', 'INS', 'ALOX5', 'PTGS2', 'CYP1B1', 'CYP17A1', 'PLA2G4F'], count: 7 },
  { id: 'hsa00480', description: 'Glutathione metabolism', category: 'Metabolism', geneRatio: '7/188', pAdjust: 1.92e-03, genes: ['GPX1', 'GSTP1', 'GSTA2', 'GCLC', 'GSTO1', 'GSTM3', 'GSR'], count: 7 },
  { id: 'hsa04664', description: 'Fc epsilon RI signaling pathway', category: 'Organismal Systems', geneRatio: '7/188', pAdjust: 5.18e-03, genes: ['AKT1', 'TNF', 'ALOX5', 'PRKCA', 'FYN', 'PLCG1', 'PLA2G4F'], count: 7 },
  { id: 'hsa04917', description: 'Prolactin signaling pathway', category: 'Organismal Systems', geneRatio: '7/188', pAdjust: 6.05e-03, genes: ['AKT1', 'INS', 'SOCS3', 'ESR1', 'TH', 'CYP17A1', 'ESR2'], count: 7 },
  { id: 'hsa04918', description: 'Thyroid hormone synthesis', category: 'Organismal Systems', geneRatio: '7/188', pAdjust: 7.70e-03, genes: ['GPX1', 'ALB', 'CREB1', 'PRKCA', 'PRKCB', 'ATF2', 'GSR'], count: 7 },
  { id: 'hsa05140', description: 'Leishmaniasis', category: 'Human Diseases', geneRatio: '7/188', pAdjust: 8.57e-03, genes: ['TNF', 'PTGS2', 'NOS2', 'PRKCB', 'IFNG', 'IL1B', 'CYBA'], count: 7 },
  { id: 'hsa01521', description: 'EGFR tyrosine kinase inhibitor resistance', category: 'Human Diseases', geneRatio: '7/188', pAdjust: 1.02e-02, genes: ['AKT1', 'EGFR', 'KDR', 'PRKCA', 'ERBB2', 'PRKCB', 'PLCG1'], count: 7 },
  { id: 'hsa05132', description: 'Salmonella infection', category: 'Human Diseases', geneRatio: '7/188', pAdjust: 1.15e-02, genes: ['CXCL8', 'CCL4', 'NOS2', 'CCL3', 'IFNG', 'IL1B', 'FLNB'], count: 7 },
  { id: 'hsa04911', description: 'Insulin secretion', category: 'Organismal Systems', geneRatio: '7/188', pAdjust: 1.42e-02, genes: ['INS', 'CREB1', 'PRKCA', 'PRKCB', 'ATF2', 'CACNA1C', 'GNA11'], count: 7 },
  { id: 'hsa04211', description: 'Longevity regulating pathway', category: 'Organismal Systems', geneRatio: '7/188', pAdjust: 1.60e-02, genes: ['AKT1', 'SOD2', 'INS', 'CAT', 'CREB1', 'PPARG', 'ATF2'], count: 7 },
  { id: 'hsa04912', description: 'GnRH signaling pathway', category: 'Organismal Systems', geneRatio: '7/188', pAdjust: 1.98e-02, genes: ['EGFR', 'PRKCA', 'PRKCB', 'MAP3K3', 'PLA2G4F', 'CACNA1C', 'GNA11'], count: 7 },
  { id: 'hsa04350', description: 'TGF-beta signaling pathway', category: 'Environmental Information Processing', geneRatio: '7/188', pAdjust: 2.05e-02, genes: ['TNF', 'RHOA', 'PPP2CA', 'CUL1', 'IFNG', 'ID1', 'PPP2CB'], count: 7 },
  { id: 'hsa01522', description: 'Endocrine resistance', category: 'Human Diseases', geneRatio: '7/188', pAdjust: 2.46e-02, genes: ['AKT1', 'EGFR', 'E2F1', 'ERBB2', 'ESR1', 'CYP2D6', 'ESR2'], count: 7 },
  { id: 'hsa05231', description: 'Choline metabolism in cancer', category: 'Human Diseases', geneRatio: '7/188', pAdjust: 2.46e-02, genes: ['AKT1', 'EGFR', 'PRKCA', 'PRKCB', 'PLCG1', 'PLA2G4F', 'DGKA'], count: 7 },
  { id: 'hsa00053', description: 'Ascorbate and aldarate metabolism', category: 'Metabolism', geneRatio: '6/188', pAdjust: 2.61e-04, genes: ['UGT1A10', 'UGT1A1', 'UGT1A7', 'UGT1A9', 'UGT1A8', 'UGT2B7'], count: 6 },
  { id: 'hsa05033', description: 'Nicotine addiction', category: 'Human Diseases', geneRatio: '6/188', pAdjust: 1.92e-03, genes: ['GRIN2B', 'GRIN1', 'GRIN3A', 'GRIN2D', 'CHRNA7', 'GRIN3B'], count: 6 },
  { id: 'hsa05134', description: 'Legionellosis', category: 'Human Diseases', geneRatio: '6/188', pAdjust: 8.47e-03, genes: ['CASP9', 'TNF', 'CXCL8', 'CYCS', 'CASP7', 'IL1B'], count: 6 },
  { id: 'hsa04730', description: 'Long-term depression', category: 'Organismal Systems', geneRatio: '6/188', pAdjust: 1.04e-02, genes: ['PPP2CA', 'PRKCA', 'PRKCB', 'PLA2G4F', 'PPP2CB', 'GNA11'], count: 6 },
  { id: 'hsa04720', description: 'Long-term potentiation', category: 'Organismal Systems', geneRatio: '6/188', pAdjust: 1.59e-02, genes: ['GRIN2B', 'GRIN1', 'PRKCA', 'PRKCB', 'GRIN2D', 'CACNA1C'], count: 6 },
  { id: 'hsa04520', description: 'Adherens junction', category: 'Cellular Processes', geneRatio: '6/188', pAdjust: 2.00e-02, genes: ['YES1', 'EGFR', 'RHOA', 'PTPN1', 'ERBB2', 'FYN'], count: 6 },
  { id: 'hsa05214', description: 'Glioma', category: 'Human Diseases', geneRatio: '6/188', pAdjust: 2.46e-02, genes: ['AKT1', 'EGFR', 'E2F1', 'PRKCA', 'PRKCB', 'PLCG1'], count: 6 },
  { id: 'hsa05133', description: 'Pertussis', category: 'Human Diseases', geneRatio: '6/188', pAdjust: 2.56e-02, genes: ['TNF', 'RHOA', 'CXCL8', 'CASP7', 'NOS2', 'IL1B'], count: 6 },
  { id: 'hsa01523', description: 'Antifolate resistance', category: 'Human Diseases', geneRatio: '5/188', pAdjust: 3.69e-03, genes: ['TNF', 'ABCC1', 'IL1B', 'ABCG2', 'ALOX12'], count: 5 },
  { id: 'hsa05321', description: 'Inflammatory bowel disease (IBD)', category: 'Human Diseases', geneRatio: '5/188', pAdjust: 4.40e-02, genes: ['TNF', 'IFNG', 'IL1B', 'RORC', 'IL2'], count: 5 },
  { id: 'hsa04940', description: 'Type I diabetes mellitus', category: 'Human Diseases', geneRatio: '5/188', pAdjust: 1.16e-02, genes: ['TNF', 'INS', 'IFNG', 'IL1B', 'IL2'], count: 5 },
  { id: 'hsa04930', description: 'Type II diabetes mellitus', category: 'Human Diseases', geneRatio: '5/188', pAdjust: 1.48e-02, genes: ['TNF', 'INS', 'SOCS3', 'CACNA1G', 'CACNA1C'], count: 5 },
  { id: 'hsa04923', description: 'Regulation of lipolysis in adipocytes', category: 'Organismal Systems', geneRatio: '5/188', pAdjust: 2.61e-02, genes: ['AKT1', 'INS', 'PTGS2', 'PTGS1', 'ADORA1'], count: 5 },
  { id: 'hsa05219', description: 'Bladder cancer', category: 'Human Diseases', geneRatio: '4/188', pAdjust: 3.82e-02, genes: ['EGFR', 'CXCL8', 'E2F1', 'ERBB2'], count: 4 },
  { id: 'hsa05020', description: 'Prion diseases', category: 'Human Diseases', geneRatio: '4/188', pAdjust: 2.56e-02, genes: ['SOD1', 'CCL5', 'FYN', 'IL1B'], count: 4 }
];

// Disease-Pathway Mappings (Table S5)
export const diseasePathwayMappings: DiseasePathwayMapping[] = [
  { pathwayId: 'hsa04728', pathwayDescription: 'Dopaminergic synapse', pathwayCategory: 'Organismal Systems', diseaseId: 'H01649', diseaseDescription: 'Schizophrenia', diseaseCategory: 'Mental and behavioural disorders', effect: 'adverse' as const },
  { pathwayId: 'hsa05034', pathwayDescription: 'Alcohol dependence', pathwayCategory: 'Human Diseases', diseaseId: 'H01611', diseaseDescription: 'Alcohol dependence', diseaseCategory: 'Mental and behavioural disorders', effect: 'adverse' as const },
  { pathwayId: 'hsa05033', pathwayDescription: 'Nicotine addiction', pathwayCategory: 'Human Diseases', diseaseId: 'H0000D', diseaseDescription: 'Nicotine addiction', diseaseCategory: 'Mental and behavioural disorders', effect: 'adverse' as const },
  { pathwayId: 'hsa05032', pathwayDescription: 'Morphine addiction', pathwayCategory: 'Human Diseases', diseaseId: 'H0000C', diseaseDescription: 'Morphine addiction', diseaseCategory: 'Mental and behavioural disorders', effect: 'adverse' as const },
  { pathwayId: 'hsa05031', pathwayDescription: 'Amphetamine addiction', pathwayCategory: 'Human Diseases', diseaseId: 'H0000B', diseaseDescription: 'Amphetamine addiction', diseaseCategory: 'Mental and behavioural disorders', effect: 'adverse' as const },
  { pathwayId: 'hsa05030', pathwayDescription: 'Cocaine addiction', pathwayCategory: 'Human Diseases', diseaseId: 'H0000A', diseaseDescription: 'Cocaine addiction', diseaseCategory: 'Mental and behavioural disorders', effect: 'adverse' as const },
  { pathwayId: 'hsa04080', pathwayDescription: 'Neuroactive ligand-receptor interaction', pathwayCategory: 'Environmental Information Processing', diseaseId: 'H00807', diseaseDescription: 'Autosomal dominant nocturnal frontal lobe epilepsy (ADNFLE)', diseaseCategory: 'Nervous system diseases', effect: 'beneficial' as const },
  { pathwayId: 'hsa04010', pathwayDescription: 'MAPK signaling pathway', pathwayCategory: 'Environmental Information Processing', diseaseId: 'H00808', diseaseDescription: 'Idiopathic generalized epilepsies', diseaseCategory: 'Nervous system diseases', effect: 'beneficial' as const },
  { pathwayId: 'hsa04151', pathwayDescription: 'PI3K-Akt signaling pathway', pathwayCategory: 'Environmental Information Processing', diseaseId: 'H01657', diseaseDescription: 'Nephrotic syndrome', diseaseCategory: 'Urinary system disease', effect: 'beneficial' as const },
  { pathwayId: 'hsa05170', pathwayDescription: 'Human immunodeficiency virus 1 infection', pathwayCategory: 'Human Diseases', diseaseId: 'H01563', diseaseDescription: 'HIV infection', diseaseCategory: 'Infectious diseases', effect: 'beneficial' as const },
  { pathwayId: 'hsa05014', pathwayDescription: 'Amyotrophic lateral sclerosis (ALS)', pathwayCategory: 'Human Diseases', diseaseId: 'H00970', diseaseDescription: 'Juvenile primary lateral sclerosis', diseaseCategory: 'Neurodegenerative disease', effect: 'beneficial' as const },
  { pathwayId: 'hsa05144', pathwayDescription: 'Malaria', pathwayCategory: 'Human Diseases', diseaseId: 'H00361', diseaseDescription: 'Malaria', diseaseCategory: 'Infectious diseases', effect: 'beneficial' as const },
  { pathwayId: 'hsa05016', pathwayDescription: 'Huntington disease', pathwayCategory: 'Human Diseases', diseaseId: 'H00059', diseaseDescription: 'Huntington disease', diseaseCategory: 'Neurodegenerative disease', effect: 'beneficial' as const },
  { pathwayId: 'hsa05014', pathwayDescription: 'Amyotrophic lateral sclerosis (ALS)', pathwayCategory: 'Human Diseases', diseaseId: 'H00058', diseaseDescription: 'Amyotrophic lateral sclerosis (ALS)', diseaseCategory: 'Neurodegenerative disease', effect: 'beneficial' as const },
  { pathwayId: 'hsa05012', pathwayDescription: 'Parkinson\'s disease', pathwayCategory: 'Human Diseases', diseaseId: 'H00057', diseaseDescription: 'Parkinson disease', diseaseCategory: 'Neurodegenerative disease', effect: 'beneficial' as const },
  { pathwayId: 'hsa05010', pathwayDescription: 'Alzheimer disease', pathwayCategory: 'Human Diseases', diseaseId: 'H00056', diseaseDescription: 'Alzheimer disease', diseaseCategory: 'Neurodegenerative disease', effect: 'beneficial' as const },
  { pathwayId: 'hsa05225', pathwayDescription: 'Hepatocellular carcinoma', pathwayCategory: 'Human Diseases', diseaseId: 'H00048', diseaseDescription: 'Hepatocellular carcinoma', diseaseCategory: 'Cancers', effect: 'beneficial' as const },
  { pathwayId: 'hsa05214', pathwayDescription: 'Glioma', pathwayCategory: 'Human Diseases', diseaseId: 'H00042', diseaseDescription: 'Glioma', diseaseCategory: 'Cancers', effect: 'beneficial' as const },
  { pathwayId: 'hsa05167', pathwayDescription: 'Kaposi sarcoma-associated herpesvirus infection', pathwayCategory: 'Human Diseases', diseaseId: 'H00041', diseaseDescription: 'Kaposi sarcoma', diseaseCategory: 'Cancers', effect: 'beneficial' as const },
  { pathwayId: 'hsa05224', pathwayDescription: 'Breast cancer', pathwayCategory: 'Human Diseases', diseaseId: 'H00031', diseaseDescription: 'Breast cancer', diseaseCategory: 'Cancers', effect: 'beneficial' as const },
  { pathwayId: 'hsa05213', pathwayDescription: 'Endometrial cancer', pathwayCategory: 'Human Diseases', diseaseId: 'H00026', diseaseDescription: 'Endometrial cancer', diseaseCategory: 'Cancers', effect: 'beneficial' as const },
  { pathwayId: 'hsa05215', pathwayDescription: 'Prostate cancer', pathwayCategory: 'Human Diseases', diseaseId: 'H00024', diseaseDescription: 'Prostate cancer', diseaseCategory: 'Cancers', effect: 'beneficial' as const },
  { pathwayId: 'hsa05219', pathwayDescription: 'Bladder cancer', pathwayCategory: 'Human Diseases', diseaseId: 'H00022', diseaseDescription: 'Bladder cancer', diseaseCategory: 'Cancers', effect: 'beneficial' as const },
  { pathwayId: 'hsa05210', pathwayDescription: 'Colorectal cancer', pathwayCategory: 'Human Diseases', diseaseId: 'H00020', diseaseDescription: 'Colorectal cancer', diseaseCategory: 'Cancers', effect: 'beneficial' as const },
  { pathwayId: 'hsa05212', pathwayDescription: 'Pancreatic cancer', pathwayCategory: 'Human Diseases', diseaseId: 'H00019', diseaseDescription: 'Pancreatic cancer', diseaseCategory: 'Cancers', effect: 'beneficial' as const },
  { pathwayId: 'hsa05226', pathwayDescription: 'Gastric cancer', pathwayCategory: 'Human Diseases', diseaseId: 'H00018', diseaseDescription: 'Gastric cancer', diseaseCategory: 'Cancers', effect: 'beneficial' as const },
  { pathwayId: 'hsa05223', pathwayDescription: 'Non-small cell lung cancer', pathwayCategory: 'Human Diseases', diseaseId: 'H00014', diseaseDescription: 'Non-small cell lung cancer', diseaseCategory: 'Cancers', effect: 'beneficial' as const },
  { pathwayId: 'hsa05222', pathwayDescription: 'Small cell lung cancer', pathwayCategory: 'Human Diseases', diseaseId: 'H00013', diseaseDescription: 'Small cell lung cancer', diseaseCategory: 'Cancers', effect: 'beneficial' as const },
  { pathwayId: 'hsa05166', pathwayDescription: 'Human T-cell leukemia virus 1 infection', pathwayCategory: 'Human Diseases', diseaseId: 'H00009', diseaseDescription: 'Adult T-cell leukemia', diseaseCategory: 'Cancers', effect: 'beneficial' as const },
  { pathwayId: 'hsa05321', pathwayDescription: 'Inflammatory bowel disease (IBD)', pathwayCategory: 'Human Diseases', diseaseId: 'H01466', diseaseDescription: 'Ulcerative colitis', diseaseCategory: 'Immune system diseases', effect: 'beneficial' as const },
  { pathwayId: 'hsa05321', pathwayDescription: 'Inflammatory bowel disease (IBD)', pathwayCategory: 'Human Diseases', diseaseId: 'H01227', diseaseDescription: 'Inflammatory bowel disease (IBD)', diseaseCategory: 'Immune system diseases', effect: 'beneficial' as const },
  { pathwayId: 'hsa05170', pathwayDescription: 'Human immunodeficiency virus 1 infection', pathwayCategory: 'Human Diseases', diseaseId: 'H00406', diseaseDescription: 'Acquired immunodeficiency syndrome (AIDS)', diseaseCategory: 'Infectious diseases', effect: 'beneficial' as const },
  { pathwayId: 'hsa04930', pathwayDescription: 'Type II diabetes mellitus', pathwayCategory: 'Human Diseases', diseaseId: 'H00409', diseaseDescription: 'Type 2 diabetes mellitus', diseaseCategory: 'Endocrine and metabolic diseases', effect: 'beneficial' as const },
  { pathwayId: 'hsa04940', pathwayDescription: 'Type I diabetes mellitus', pathwayCategory: 'Human Diseases', diseaseId: 'H00408', diseaseDescription: 'Type 1 diabetes mellitus', diseaseCategory: 'Endocrine and metabolic diseases', effect: 'beneficial' as const },
  { pathwayId: 'hsa04934', pathwayDescription: 'Cushing syndrome', pathwayCategory: 'Human Diseases', diseaseId: 'H02049', diseaseDescription: 'Bilateral macronodular adrenal hyperplasia', diseaseCategory: 'Endocrine and metabolic diseases', effect: 'beneficial' as const },
  { pathwayId: 'hsa05323', pathwayDescription: 'Rheumatoid arthritis', pathwayCategory: 'Human Diseases', diseaseId: 'H01672', diseaseDescription: 'Juvenile idiopathic arthritis', diseaseCategory: 'Immune system diseases', effect: 'beneficial' as const },
  { pathwayId: 'hsa05323', pathwayDescription: 'Rheumatoid arthritis', pathwayCategory: 'Human Diseases', diseaseId: 'H00630', diseaseDescription: 'Rheumatoid arthritis', diseaseCategory: 'Immune system diseases', effect: 'beneficial' as const },
  { pathwayId: 'hsa00140', pathwayDescription: 'Steroid hormone biosynthesis', pathwayCategory: 'Metabolism', diseaseId: 'H01203', diseaseDescription: 'Primary congenital glaucoma', diseaseCategory: 'Congenital malformations', effect: 'beneficial' as const },
  { pathwayId: 'hsa00380', pathwayDescription: 'Tryptophan metabolism', pathwayCategory: 'Metabolism', diseaseId: 'H01203', diseaseDescription: 'Primary congenital glaucoma', diseaseCategory: 'Congenital malformations', effect: 'beneficial' as const },
  { pathwayId: 'hsa00980', pathwayDescription: 'Metabolism of xenobiotics by cytochrome P450', pathwayCategory: 'Metabolism', diseaseId: 'H01203', diseaseDescription: 'Primary congenital glaucoma', diseaseCategory: 'Congenital malformations', effect: 'beneficial' as const },
  { pathwayId: 'hsa04934', pathwayDescription: 'Cushing syndrome', pathwayCategory: 'Human Diseases', diseaseId: 'H01431', diseaseDescription: 'Cushing syndrome', diseaseCategory: 'Endocrine and metabolic diseases', effect: 'unknown' as const },
  { pathwayId: 'hsa04932', pathwayDescription: 'Non-alcoholic fatty liver disease (NAFLD)', pathwayCategory: 'Human Diseases', diseaseId: 'H01333', diseaseDescription: 'Nonalcoholic fatty liver disease', diseaseCategory: 'Endocrine and metabolic diseases', effect: 'unknown' as const },
  { pathwayId: 'hsa05145', pathwayDescription: 'Toxoplasmosis', pathwayCategory: 'Human Diseases', diseaseId: 'H00435', diseaseDescription: 'Toxoplasmosis', diseaseCategory: 'Infectious diseases', effect: 'unknown' as const },
  { pathwayId: 'hsa05160', pathwayDescription: 'Hepatitis C', pathwayCategory: 'Human Diseases', diseaseId: 'H00413', diseaseDescription: 'Hepatitis C; Hepatitis C virus (HCV) infection', diseaseCategory: 'Infectious diseases', effect: 'unknown' as const },
  { pathwayId: 'hsa05161', pathwayDescription: 'Hepatitis B', pathwayCategory: 'Human Diseases', diseaseId: 'H00412', diseaseDescription: 'Hepatitis B; Hepatitis B virus (HBV) infection', diseaseCategory: 'Infectious diseases', effect: 'unknown' as const },
  { pathwayId: 'hsa05164', pathwayDescription: 'Influenza A', pathwayCategory: 'Human Diseases', diseaseId: 'H00399', diseaseDescription: 'Avian influenza', diseaseCategory: 'Infectious diseases', effect: 'unknown' as const },
  { pathwayId: 'hsa05164', pathwayDescription: 'Influenza A', pathwayCategory: 'Human Diseases', diseaseId: 'H00398', diseaseDescription: 'Influenza', diseaseCategory: 'Infectious diseases', effect: 'unknown' as const },
  { pathwayId: 'hsa05162', pathwayDescription: 'Measles', pathwayCategory: 'Human Diseases', diseaseId: 'H00394', diseaseDescription: 'Measles', diseaseCategory: 'Infectious disease', effect: 'unknown' as const },
  { pathwayId: 'hsa05169', pathwayDescription: 'Epstein-Barr virus infection', pathwayCategory: 'Human Diseases', diseaseId: 'H00367', diseaseDescription: 'Infectious mononucleosis; Epstein-Barr virus (EBV) infection', diseaseCategory: 'Infectious disease', effect: 'unknown' as const },
  { pathwayId: 'hsa05168', pathwayDescription: 'Herpes simplex infection', pathwayCategory: 'Human Diseases', diseaseId: 'H00365', diseaseDescription: 'Herpes simplex virus infection; HSV infection', diseaseCategory: 'Infectious disease', effect: 'unknown' as const },
  { pathwayId: 'hsa05146', pathwayDescription: 'Amoebiasis', pathwayCategory: 'Human Diseases', diseaseId: 'H00360', diseaseDescription: 'Amoebiasis', diseaseCategory: 'Infectious diseases', effect: 'unknown' as const },
  { pathwayId: 'hsa05140', pathwayDescription: 'Leishmaniasis', pathwayCategory: 'Human Diseases', diseaseId: 'H00359', diseaseDescription: 'Leishmaniasis', diseaseCategory: 'Infectious diseases', effect: 'unknown' as const },
  { pathwayId: 'hsa05142', pathwayDescription: 'Chagas disease', pathwayCategory: 'Human Diseases', diseaseId: 'H00358', diseaseDescription: 'Chagas disease', diseaseCategory: 'Infectious diseases', effect: 'unknown' as const },
  { pathwayId: 'hsa05143', pathwayDescription: 'African trypanosomiasis', pathwayCategory: 'Human Diseases', diseaseId: 'H00357', diseaseDescription: 'African trypanosomiasis', diseaseCategory: 'Infectious diseases', effect: 'unknown' as const },
  { pathwayId: 'hsa05152', pathwayDescription: 'Tuberculosis', pathwayCategory: 'Human Diseases', diseaseId: 'H00342', diseaseDescription: 'Tuberculosis', diseaseCategory: 'Infectious diseases', effect: 'unknown' as const },
  { pathwayId: 'hsa05120', pathwayDescription: 'Epithelial cell signaling in Helicobacter pylori infection', pathwayCategory: 'Human Diseases', diseaseId: 'H00320', diseaseDescription: 'Helicobacter pylori infection', diseaseCategory: 'Infectious disease', effect: 'unknown' as const },
  { pathwayId: 'hsa05133', pathwayDescription: 'Pertussis', pathwayCategory: 'Human Diseases', diseaseId: 'H00319', diseaseDescription: 'Pertussis; Whooping cough', diseaseCategory: 'Infectious disease', effect: 'unknown' as const },
  { pathwayId: 'hsa05134', pathwayDescription: 'Legionellosis', pathwayCategory: 'Human Diseases', diseaseId: 'H00311', diseaseDescription: 'Legionellosis; Legionnaires disease', diseaseCategory: 'Infectious diseases', effect: 'unknown' as const },
  { pathwayId: 'hsa05416', pathwayDescription: 'Viral myocarditis', pathwayCategory: 'Human Diseases', diseaseId: 'H00295', diseaseDescription: 'Viral myocarditis', diseaseCategory: 'Cardiovascular disease', effect: 'unknown' as const },
  { pathwayId: 'hsa05130', pathwayDescription: 'Pathogenic Escherichia coli infection', pathwayCategory: 'Human Diseases', diseaseId: 'H00278', diseaseDescription: 'Enteropathogenic Escherichia coli (EPEC) infection', diseaseCategory: 'Infectious disease', effect: 'unknown' as const },
  { pathwayId: 'hsa05130', pathwayDescription: 'Pathogenic Escherichia coli infection', pathwayCategory: 'Human Diseases', diseaseId: 'H00277', diseaseDescription: 'Enterohemorrhagic Escherichia coli (EHEC) infection', diseaseCategory: 'Infectious disease', effect: 'unknown' as const },
  { pathwayId: 'hsa04934', pathwayDescription: 'Cushing syndrome', pathwayCategory: 'Human Diseases', diseaseId: 'H00260', diseaseDescription: 'Pigmented micronodular adrenocortical disease', diseaseCategory: 'Endocrine and metabolic diseases', effect: 'unknown' as const },
  { pathwayId: 'hsa05132', pathwayDescription: 'Salmonella infection', pathwayCategory: 'Human Diseases', diseaseId: 'H00111', diseaseDescription: 'Typhoid fever', diseaseCategory: 'Infectious diseases', effect: 'unknown' as const },
  { pathwayId: 'hsa05110', pathwayDescription: 'Vibrio cholerae infection', pathwayCategory: 'Human Diseases', diseaseId: 'H00110', diseaseDescription: 'Cholera', diseaseCategory: 'Infectious disease', effect: 'unknown' as const },
  { pathwayId: 'hsa05332', pathwayDescription: 'Graft-versus-host disease', pathwayCategory: 'Human Diseases', diseaseId: 'H00084', diseaseDescription: 'Graft-versus-host disease', diseaseCategory: 'Immune system diseases', effect: 'unknown' as const },
  { pathwayId: 'hsa05330', pathwayDescription: 'Allograft rejection', pathwayCategory: 'Human Diseases', diseaseId: 'H00083', diseaseDescription: 'Allograft rejection', diseaseCategory: 'Immune system disease', effect: 'unknown' as const },
  { pathwayId: 'hsa05020', pathwayDescription: 'Prion diseases', pathwayCategory: 'Human Diseases', diseaseId: 'H00061', diseaseDescription: 'Prion disease; Creutzfeldt-Jacob disease (CJD); Gerstmann-Straussler disease (GSD); Gerstmann-Straus', diseaseCategory: 'Neurodegenerative disease', effect: 'unknown' as const }
];

// Protein Target Integrated Centrality Values (Table S6)
export const proteinCentralityValues: Record<string, number> = {
  'AKT1': 0.809411,
  'GSTP1': 0.717153,
  'GRIN2B': 0.68,
  'CASP9': 0.666922,
  'PRKCA': 0.646245,
  'GSTM3': 0.639346,
  'CAT': 0.632534,
  'CREB1': 0.63,
  'CYCS': 0.590265,
  'COMT': 0.573622,
  'PRKCB': 0.564627,
  'CYP17A1': 0.560148,
  'TNF': 0.554735,
  'HMOX1': 0.515233,
  'PLCG1': 0.514013,
  'GSTA2': 0.507474,
  'BDNF': 0.491138,
  'GSTO1': 0.480576,
  'ICAM1': 0.468495,
  'RXRB': 0.451747,
  'CXCL8': 0.441848,
  'CYP1B1': 0.434098,
  'GRIN1': 0.430554,
  'PTGS2': 0.416508,
  'ATF2': 0.413721,
  'CACNA1C': 0.400161,
  'EGFR': 0.394545,
  'E2F1': 0.38565,
  'IFNG': 0.381226,
  'TH': 0.379828,
  'CYP1A1': 0.376362,
  'GNA11': 0.375979,
  'IL1B': 0.37147,
  'HDAC7': 0.359267,
  'GPX1': 0.358302,
  'DRD2': 0.354181,
  'CYBA': 0.350672,
  'IFNA1': 0.350248,
  'GRIN2D': 0.349362,
  'VCAM1': 0.346202,
  'VDAC1': 0.342162,
  'CYP1A2': 0.329871,
  'CCL5': 0.320064,
  'IL2': 0.31736,
  'ESR2': 0.314277,
  'INS': 0.313556,
  'PGR': 0.309545,
  'ERBB2': 0.308715,
  'ACAT1': 0.307187,
  'MAPKAPK5': 0.305745,
  'KYNU': 0.301193,
  'MAPT': 0.299101,
  'UGT1A1': 0.296836,
  'CACNA1I': 0.296625,
  'PPP2CA': 0.296313,
  'AANAT': 0.29581,
  'TRAF4': 0.294967,
  'FLNB': 0.293873,
  'MAPKAPK2': 0.293403,
  'UGT1A7': 0.290892,
  'NQO1': 0.287319,
  'NOS2': 0.28288,
  'FLT1': 0.282623,
  'PPP2CB': 0.279687,
  'CACNA1G': 0.277045,
  'SDHA': 0.275501,
  'GRIN3A': 0.275452,
  'MAP3K3': 0.272792,
  'UGT1A9': 0.27025,
  'UGT1A10': 0.267509,
  'FLT4': 0.265179,
  'CYP3A4': 0.263415,
  'MAPKAPK3': 0.262718,
  'CACNA1H': 0.262638,
  'UGT1A8': 0.261961,
  'UGT2B7': 0.260843,
  'SOD1': 0.260223,
  'OPRM1': 0.259166,
  'GRIN3B': 0.258337,
  'PLA2G4F': 0.252727,
  'B2M': 0.252571,
  'LTB4R2': 0.252091,
  'CYP3A5': 0.251694,
  'KDR': 0.245544,
  'CUL1': 0.24522,
  'HTR2A': 0.241864,
  'PPARG': 0.236161,
  'CYP2D6': 0.235347,
  'NPY5R': 0.234259,
  'GLRA1': 0.227536,
  'ADORA1': 0.225823,
  'CYP2A6': 0.221739,
  'CHRNA7': 0.221598,
  'CYP2C9': 0.221164,
  'MEN1': 0.217524,
  'AHR': 0.212898,
  'LTB4R': 0.2118,
  'HTR1D': 0.207817,
  'CNR2': 0.20437,
  'HTR1B': 0.198881,
  'CNR1': 0.19675,
  'SOD2': 0.193227,
  'HTR1A': 0.191407,
  'S1PR1': 0.190705,
  'GLRA3': 0.1902,
  'NR3C1': 0.190133,
  'GLRB': 0.189869,
  'OPRD1': 0.189714,
  'MTNR1B': 0.189645,
  'AP1G1': 0.184494,
  'CYP3A7': 0.169269,
  'CASP7': 0.129822,
  'SLC29A1': 0.117677,
  'AR': 0.116343,
  'HBB': 0.076835,
  'CCL3': 0.075605,
  'ESR1': 0.069472,
  'ABCB1': 0.065096,
  'IDO1': 0.063855,
  'RHOA': 0.054651,
  'RORC': 0.030089,
  'SOCS3': 0.024354
};

export function getDiseasesForPathway(pathwayId: string): DiseasePathwayMapping[] {
  return diseasePathwayMappings.filter(d => d.pathwayId === pathwayId);
}

export function getBeneficialDiseases(): DiseasePathwayMapping[] {
  return diseasePathwayMappings.filter(d => d.effect === 'beneficial');
}

export function getAdverseDiseases(): DiseasePathwayMapping[] {
  return diseasePathwayMappings.filter(d => d.effect === 'adverse');
}

export function getGOTermsForGene(gene: string): GOEnrichmentTerm[] {
  return goEnrichmentTerms.filter(t => t.genes.includes(gene));
}

export function getKEGGPathwaysForGene(gene: string): KEGGPathway[] {
  return keggPathways.filter(p => p.genes.includes(gene));
}

export function getProteinCentrality(gene: string): number {
  return proteinCentralityValues[gene] ?? 0;
}

export function getTopCentralityProteins(limit: number = 20): { gene: string; ic: number }[] {
  return Object.entries(proteinCentralityValues)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([gene, ic]) => ({ gene, ic }));
}

export function getCannabinoidTargetOverlap(cannabinoidId1: string, cannabinoidId2: string): string[] {
  const c1 = cannabinoids.find(c => c.id === cannabinoidId1);
  const c2 = cannabinoids.find(c => c.id === cannabinoidId2);
  if (!c1 || !c2) return [];
  return c1.proteinTargets.filter(t => c2.proteinTargets.includes(t));
}

// Helper function to calculate ligand pathway score for a condition
export function calculateLigandScore(conditionId: string): {
  condition: HealthCondition | undefined;
  matchingCannabinoids: Cannabinoid[];
  targetProteins: ProteinTarget[];
  recommendedProducts: ProductMapping[];
  pathwayAnalysis: {
    modules: { module: number; name: string; targets: string[]; score: number }[];
    totalScore: number;
  };
} {
  const condition = healthConditions.find(c => c.id === conditionId);
  if (!condition) {
    return {
      condition: undefined,
      matchingCannabinoids: [],
      targetProteins: [],
      recommendedProducts: [],
      pathwayAnalysis: { modules: [], totalScore: 0 }
    };
  }

  // Find protein targets for this condition
  const targetProteins = proteinTargets.filter(p => 
    condition.proteinTargets.includes(p.symbol)
  );

  // Find cannabinoids that target these proteins
  const matchingCannabinoids = cannabinoids.filter(c =>
    c.proteinTargets.some(t => condition.proteinTargets.includes(t))
  );

  // Score products based on cannabinoid coverage
  const scoredProducts = productMappings.map(product => {
    const matchCount = product.cannabinoids.filter(pc =>
      matchingCannabinoids.some(mc => mc.name === pc)
    ).length;
    return { ...product, matchScore: matchCount };
  }).filter(p => p.matchScore > 0 || p.ligandScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore || b.ligandScore - a.ligandScore);

  // Analyze modules
  const moduleNames = [
    'Metabolism & Detoxification',
    'Cell Survival & Growth Signaling',
    'Inflammation & Immune Response',
    'Cannabinoid Receptors & Neural Signaling'
  ];
  
  const modules = [1, 2, 3, 4].map(moduleNum => {
    const moduleTargets = targetProteins.filter(t => t.module === moduleNum);
    return {
      module: moduleNum,
      name: moduleNames[moduleNum - 1],
      targets: moduleTargets.map(t => t.symbol),
      score: moduleTargets.reduce((sum, t) => sum + t.icValue, 0)
    };
  }).filter(m => m.targets.length > 0);

  const totalScore = modules.reduce((sum, m) => sum + m.score, 0);

  return {
    condition,
    matchingCannabinoids,
    targetProteins,
    recommendedProducts: scoredProducts,
    pathwayAnalysis: { modules, totalScore }
  };
}

// Get all conditions by category
export function getConditionsByCategory(): Record<string, HealthCondition[]> {
  const categories: Record<string, HealthCondition[]> = {};
  healthConditions.forEach(condition => {
    if (!categories[condition.category]) {
      categories[condition.category] = [];
    }
    categories[condition.category].push(condition);
  });
  return categories;
}

// Get cannabinoid profile for a product
export function getCannabinoidProfile(productName: string): {
  product: ProductMapping | undefined;
  cannabinoidDetails: Cannabinoid[];
  targetedProteins: string[];
  supportedConditions: HealthCondition[];
} {
  const product = productMappings.find(p => p.productName === productName);
  if (!product) {
    return {
      product: undefined,
      cannabinoidDetails: [],
      targetedProteins: [],
      supportedConditions: []
    };
  }

  const cannabinoidDetails = cannabinoids.filter(c => 
    product.cannabinoids.includes(c.name)
  );

  const targetedProteins = Array.from(new Set(
    cannabinoidDetails.flatMap(c => c.proteinTargets)
  ));

  const supportedConditions = healthConditions.filter(condition =>
    condition.proteinTargets.some(t => targetedProteins.includes(t))
  );

  return { product, cannabinoidDetails, targetedProteins, supportedConditions };
}

export function getProductsForCannabinoid(cannabinoidName: string): ProductMapping[] {
  return productMappings.filter(p => p.cannabinoids.includes(cannabinoidName));
}

export function getProductRecommendations(conditionName: string): { entry: ClinicalPrescribingEntry | undefined; products: ProductMapping[] } {
  const entry = clinicalPrescribingMatrix.find(e => e.condition.toLowerCase() === conditionName.toLowerCase());
  if (!entry) return { entry: undefined, products: [] };
  const products = entry.recommendedProducts
    .map(name => productMappings.find(p => p.productName === name))
    .filter((p): p is ProductMapping => p !== undefined);
  return { entry, products };
}

export const clinicalPrescribingMatrix: ClinicalPrescribingEntry[] = [
  { condition: 'Breast Cancer (ER+)', category: 'cancer', primaryTargets: ['AKT1', 'CASP9', 'ESR1'], recommendedCannabinoids: ['CBD', 'Δ9-THC'], ratio: '2:1 CBD:THC', deliveryMethod: 'Oral', rationale: 'AKT1 inhibition, apoptosis induction, anti-estrogenic effects', recommendedProducts: ['The Elixir for Everything (Original)', 'ECS Suppositories', 'B17 Suppositories'] },
  { condition: 'Prostate Cancer', category: 'cancer', primaryTargets: ['AKT1', 'CASP9', 'AR', 'CYP17A1'], recommendedCannabinoids: ['CBD', 'THCV'], ratio: '2:1 CBD:THCV', deliveryMethod: 'Oral', rationale: 'Blocks androgen signaling via CYP17A1', recommendedProducts: ['The Elixir for Everything (Original)', 'ECS Suppositories', 'B17 Suppositories'] },
  { condition: 'Lung Cancer', category: 'cancer', primaryTargets: ['AKT1', 'EGFR', 'CASP9'], recommendedCannabinoids: ['CBD', 'CBC'], ratio: '3:1 CBD:CBC', deliveryMethod: 'Oral', rationale: 'EGFR inhibition, apoptosis pathway activation', recommendedProducts: ['The Elixir for Everything (Original)', 'ECS Suppositories', 'B17 Suppositories'] },
  { condition: 'Colon Cancer', category: 'cancer', primaryTargets: ['AKT1', 'CASP9', 'TNF'], recommendedCannabinoids: ['CBD', 'Δ9-THC'], ratio: '2:1 CBD:THC', deliveryMethod: 'Oral + Suppository', rationale: 'Apoptosis induction, TNF inflammation reduction', recommendedProducts: ['ECS Suppositories', 'The Elixir for Everything (Original)', 'B17 Suppositories'] },
  { condition: 'Brain Cancer (Glioma)', category: 'cancer', primaryTargets: ['AKT1', 'EGFR', 'CASP9'], recommendedCannabinoids: ['Δ8-THC', 'CBD'], ratio: '1:2 Δ8-THC:CBD', deliveryMethod: 'Oral (BBB penetration)', rationale: 'Δ8-THC has best BBB penetration (0.913) for brain tumor access', recommendedProducts: ['The Elixir for Everything with C60', 'ECS Suppositories', 'B17 Suppositories'] },
  { condition: 'Melanoma', category: 'cancer', primaryTargets: ['AKT1', 'CASP9'], recommendedCannabinoids: ['CBD'], ratio: 'High dose CBD', deliveryMethod: 'Topical + Oral', rationale: 'Apoptosis induction via topical and systemic routes', recommendedProducts: ['Kaneh Bosem (Ancient Healing Oil)', 'The Elixir for Everything (Original)'] },
  { condition: 'Epilepsy', category: 'neurological', primaryTargets: ['GRIN2B', 'GRIN1', 'CACNA1C'], recommendedCannabinoids: ['CBD', 'CBDV'], ratio: 'High dose CBD', deliveryMethod: 'Oral (Epidiolex-like)', rationale: 'Reduces neuronal excitability, stabilizes calcium channels', recommendedProducts: ['The Elixir for Everything (Original)', 'The Elixir for Everything with C60'] },
  { condition: "Alzheimer's Disease", category: 'neurological', primaryTargets: ['GRIN2B', 'CAT', 'CREB1'], recommendedCannabinoids: ['Δ8-THC', 'CBD'], ratio: '1:3 Δ8-THC:CBD', deliveryMethod: 'Oral (BBB penetration)', rationale: 'Δ8-THC best BBB (0.913), reduces amyloid plaque, NMDA modulation', recommendedProducts: ['The Elixir for Everything with C60', 'ECS Suppositories'] },
  { condition: "Parkinson's Disease", category: 'neurological', primaryTargets: ['DRD2', 'TNF'], recommendedCannabinoids: ['CBD'], ratio: 'High dose CBD', deliveryMethod: 'Oral + Sublingual', rationale: 'Neuroprotective, reduces neuroinflammation. Avoid high-dose THC', recommendedProducts: ['The Elixir for Everything (Original)', 'The Elixir for Everything with C60'] },
  { condition: 'ALS', category: 'neurological', primaryTargets: ['CASP9', 'TNF', 'CAT'], recommendedCannabinoids: ['CBD', 'Δ9-THC'], ratio: '1:1 CBD:THC', deliveryMethod: 'Oral + Suppositories', rationale: 'Neuroprotection, anti-inflammatory, delays motor neuron death', recommendedProducts: ['The Elixir for Everything (Original)', 'ECS Suppositories'] },
  { condition: 'Multiple Sclerosis', category: 'neurological', primaryTargets: ['TNF', 'CNR1', 'CNR2'], recommendedCannabinoids: ['Δ9-THC', 'CBD'], ratio: '1:1 THC:CBD', deliveryMethod: 'Oral + Topical', rationale: 'Reduces spasticity, pain, and inflammation (Sativex-like)', recommendedProducts: ['The Elixir for Everything (Original)', 'DMSO Extended Recovery Cooling Lotion'] },
  { condition: 'Chronic Pain', category: 'pain', primaryTargets: ['CNR1', 'TRPV1', 'OPRM1'], recommendedCannabinoids: ['Δ9-THC', 'CBD', 'CBN'], ratio: 'Variable', deliveryMethod: 'Oral (long half-life THC)', rationale: 'THC longest half-life (2.96h), CB1 activation, TRPV1 desensitization', recommendedProducts: ['The Elixir for Everything (Original)', 'DMSO Extended Recovery Cooling Lotion', 'DMSO Suppositories'] },
  { condition: 'IBD / Crohn\'s Disease', category: 'gut', primaryTargets: ['TNF', 'CNR2', 'GSTP1'], recommendedCannabinoids: ['CBC', 'CBD', 'CBDA'], ratio: '1:1 CBC:CBD', deliveryMethod: 'Oral (best HIA 82.9%)', rationale: 'CBC has best intestinal absorption, TNF suppression, gut barrier healing', recommendedProducts: ['The Elixir for Everything (Original)', 'Ozonated Hemp Oil Suppositories', 'Probiotic Suppositories'] },
  { condition: 'Rheumatoid Arthritis', category: 'inflammatory', primaryTargets: ['TNF', 'CNR2'], recommendedCannabinoids: ['CBD', 'Δ9-THC'], ratio: '2:1 CBD:THC', deliveryMethod: 'Oral + Topical', rationale: 'Suppresses autoimmune attack, reduces joint damage via TNF', recommendedProducts: ['The Elixir for Everything (Original)', 'DMSO Extended Recovery Cooling Lotion', 'Kaneh Bosem (Ancient Healing Oil)'] },
  { condition: 'Osteoarthritis', category: 'inflammatory', primaryTargets: ['PTGS2', 'TNF', 'TRPV1'], recommendedCannabinoids: ['CBD', 'CBC'], ratio: '2:1 CBD:CBC', deliveryMethod: 'Topical + Oral', rationale: 'COX-2 inhibition, reduces joint inflammation', recommendedProducts: ['DMSO Extended Recovery Cooling Lotion', 'Kaneh Bosem (Ancient Healing Oil)', 'The Elixir for Everything (Original)'] },
  { condition: 'Psoriasis', category: 'inflammatory', primaryTargets: ['TNF', 'PTGS2'], recommendedCannabinoids: ['CBD'], ratio: 'High dose CBD', deliveryMethod: 'Topical', rationale: 'Reduces skin inflammation via TNF and COX-2 pathways', recommendedProducts: ['Kaneh Bosem (Ancient Healing Oil)', 'DMSO Extended Recovery Cooling Lotion'] },
  { condition: 'Anxiety Disorders', category: 'mental_health', primaryTargets: ['HTR1A', 'GABA'], recommendedCannabinoids: ['CBD'], ratio: 'High dose CBD', deliveryMethod: 'Oral + Sublingual', rationale: '5-HT1A partial agonist, GABA modulation, no psychoactivity', recommendedProducts: ['The Elixir for Everything (Original)', 'The Elixir for Everything with C60'] },
  { condition: 'PTSD', category: 'mental_health', primaryTargets: ['CNR1', 'CREB1'], recommendedCannabinoids: ['CBD', 'Δ9-THC'], ratio: 'CBD-dominant, low THC', deliveryMethod: 'Oral', rationale: 'Enhances fear extinction learning, memory reconsolidation', recommendedProducts: ['The Elixir for Everything (Original)'] },
  { condition: 'Insomnia', category: 'sleep', primaryTargets: ['CNR1', 'HTR1A'], recommendedCannabinoids: ['CBN', 'Δ9-THC'], ratio: 'CBN-dominant', deliveryMethod: 'Oral', rationale: 'CBN sedative effect (2.74h half-life), reduces sleep latency', recommendedProducts: ['The Elixir for Everything (Original)'] },
  { condition: 'Nausea/Vomiting', category: 'gut', primaryTargets: ['HTR3A', 'CNR1'], recommendedCannabinoids: ['Δ9-THC', 'CBDA'], ratio: 'Variable', deliveryMethod: 'Oral + Sublingual', rationale: 'Blocks 5-HT3 receptors, CB1 activation for antiemetic effect', recommendedProducts: ['The Elixir for Everything (Original)'] },
  { condition: 'Cancer Cachexia', category: 'cancer', primaryTargets: ['CNR1', 'GHRL'], recommendedCannabinoids: ['Δ9-THC'], ratio: 'THC-dominant', deliveryMethod: 'Oral', rationale: 'Stimulates appetite via CB1 activation, increases caloric intake', recommendedProducts: ['The Elixir for Everything (Original)', 'ECS Suppositories'] },
  { condition: 'Detoxification Support', category: 'metabolic', primaryTargets: ['GSTP1', 'GSTM3', 'GSTA2', 'CAT'], recommendedCannabinoids: ['CBD', 'CBC'], ratio: '1:1 CBD:CBC', deliveryMethod: 'Oral', rationale: 'Strong GST enzyme activation, enhances Phase II detoxification', recommendedProducts: ['The Elixir for Everything (Original)', 'EDTA Suppositories', 'Ivermectin Suppositories'] },
  { condition: 'Renal Disease', category: 'metabolic', primaryTargets: ['AKT1', 'VEGF'], recommendedCannabinoids: ['CBD', 'CBDV'], ratio: 'CBD-dominant', deliveryMethod: 'Suppositories (bypass first-pass)', rationale: 'CBDV lowest AMES toxicity (0.108). Start 50% dose, monitor clearance', recommendedProducts: ['ECS Suppositories', 'The Elixir for Everything (Original)'] }
];

export const adverseEffectCategories: AdverseEffectCategory[] = [
  {
    id: 'brain_development',
    name: 'Brain Development Impairment',
    riskPopulations: ['Fetus (prenatal exposure)', 'Adolescents (<25 years)'],
    molecularTargets: ['GRIN2B', 'CREB1'],
    mechanism: 'Disrupts synaptic pruning, myelination, and brain maturation via NMDA receptor interference and CREB1-mediated gene transcription disruption',
    symptoms: ['Impaired brain connectivity', 'Cognitive deficits', 'Motor function deficits', 'Learning and memory problems'],
    mitigationStrategies: ['Avoid THC in pregnancy and adolescence', 'CBD appears safer but still exercise caution', 'Screen for age before prescribing THC-containing protocols'],
    implicated: ['Δ9-THC']
  },
  {
    id: 'psychiatric',
    name: 'Psychiatric Comorbidities',
    riskPopulations: ['Individuals with family history of mood disorders', 'Bipolar patients', 'Patients with prior depressive episodes'],
    molecularTargets: ['DRD2', 'HTR2A'],
    mechanism: 'High-dose THC modulates dopaminergic (DRD2) and serotonergic (HTR2A) synapse pathways, potentially worsening mood in susceptible individuals',
    symptoms: ['Depression', 'Anxiety (paradoxical)', 'Dysphoria', 'Delusions', 'Bipolar exacerbation'],
    mitigationStrategies: ['Use CBD-dominant formulations (CBD:THC >2:1)', 'Screen for family history of bipolar/psychosis', 'Monitor mood during THC titration', 'Consider CBD-only protocols for at-risk patients'],
    implicated: ['Δ9-THC', 'Δ8-THC']
  },
  {
    id: 'schizophrenia',
    name: 'Schizophrenia Risk',
    riskPopulations: ['Genetic susceptibility to schizophrenia', 'Family history of psychosis', 'Adolescent heavy cannabis users'],
    molecularTargets: ['DRD2', 'CNR1', 'GRIN2B'],
    mechanism: 'High-dose THC combined with genetic susceptibility causes dopamine-glutamate imbalance via DRD2 and CNR1, disrupting dopaminergic synapse pathway (hsa04728)',
    symptoms: ['Hallucinations', 'Paranoia', 'Disorganized thinking'],
    mitigationStrategies: ['Contraindicated: High-dose THC in schizophrenia patients or family history', 'CBD may be anti-psychotic via 5-HT1A', 'Use CBD-only protocols when psychosis risk exists'],
    implicated: ['Δ9-THC']
  },
  {
    id: 'cannabis_use_disorder',
    name: 'Cannabis Use Disorders & Withdrawal',
    riskPopulations: ['Chronic daily high-dose users', 'Patients with addiction history'],
    molecularTargets: ['CNR1'],
    mechanism: 'Chronic high-dose use causes CB1 receptor downregulation and desensitization, leading to tolerance and withdrawal symptoms',
    symptoms: ['Dizziness', 'Dry mouth', 'Somnolence', 'Confusion', 'Restlessness', 'Irritability', 'Insomnia', 'Nausea', 'Cramping'],
    mitigationStrategies: ['Taper dose gradually', 'Use CBD to ease withdrawal (CBD upregulates CB1)', 'Cycle THC-containing protocols with breaks', 'Monitor for tolerance signs'],
    implicated: ['Δ9-THC', 'Δ8-THC']
  },
  {
    id: 'hyperemesis',
    name: 'Cannabinoid Hyperemesis Syndrome',
    riskPopulations: ['Years of daily high-dose THC use', 'Chronic heavy consumers'],
    molecularTargets: ['CNR1'],
    mechanism: 'Chronic high-dose use causes CB1 receptor dysfunction in gut, producing paradoxical nausea/vomiting instead of antiemetic effects',
    symptoms: ['Severe nausea', 'Cyclical vomiting', 'Dehydration', 'Abdominal pain'],
    mitigationStrategies: ['Hot showers (temporary relief)', 'Discontinue THC', 'Switch to CBD-only protocols', 'Capsaicin cream (topical)'],
    implicated: ['Δ9-THC']
  },
  {
    id: 'addiction_dependence',
    name: 'Addiction / Substance Dependence',
    riskPopulations: ['Patients with substance use history', 'Genetic susceptibility to addiction', 'Cross-sensitization risk with other substances'],
    molecularTargets: ['CNR1', 'DRD2', 'OPRM1'],
    mechanism: 'Cannabis modulates reward circuitry via CB1 (CNR1), dopamine D2 (DRD2), and mu-opioid (OPRM1) receptors. Intersects with cocaine (hsa05030), amphetamine (hsa05031), morphine (hsa05032), nicotine (hsa05033), and alcohol (hsa05034) addiction pathways',
    symptoms: ['Physical dependence', 'Psychological dependence', 'Cross-sensitization with other drugs'],
    mitigationStrategies: ['CBD may help treat addiction (blocks reward signaling)', 'Avoid high-dose THC in patients with addiction history', 'Monitor for compulsive use patterns', 'Use structured dosing protocols with physician oversight'],
    implicated: ['Δ9-THC', 'Δ8-THC']
  }
];

export function getCYP450Warnings(cannabinoidIds: string[], medications: string[]): {
  warnings: { cannabinoid: string; enzyme: string; medication: string; riskLevel: 'high' | 'moderate'; recommendation: string }[];
} {
  const warnings: { cannabinoid: string; enzyme: string; medication: string; riskLevel: 'high' | 'moderate'; recommendation: string }[] = [];
  const medsLower = medications.map(m => m.toLowerCase());

  for (const id of cannabinoidIds) {
    const cannabinoid = cannabinoids.find(c => c.id === id);
    if (!cannabinoid) continue;

    for (const interaction of cannabinoid.cyp450Interactions) {
      for (const drugClass of interaction.highRiskDrugs) {
        const drugLower = drugClass.toLowerCase();
        for (const med of medsLower) {
          if (drugLower.includes(med) || med.includes(drugLower.split('(')[0].trim().toLowerCase())) {
            warnings.push({
              cannabinoid: cannabinoid.name,
              enzyme: interaction.enzyme,
              medication: medications[medsLower.indexOf(med)],
              riskLevel: interaction.affinityScore > 0.7 ? 'high' : 'moderate',
              recommendation: `Space ${cannabinoid.name} dosing 2-4 hours from ${medications[medsLower.indexOf(med)]}. Monitor drug levels. Consider dose adjustment.`
            });
          }
        }
      }
    }
  }

  return { warnings };
}

export function getAdverseEffectRisks(cannabinoidIds: string[]): AdverseEffectCategory[] {
  const selectedNames = cannabinoidIds
    .map(id => cannabinoids.find(c => c.id === id)?.name)
    .filter(Boolean) as string[];

  return adverseEffectCategories.filter(ae =>
    ae.implicated.some(impl => selectedNames.includes(impl))
  );
}

