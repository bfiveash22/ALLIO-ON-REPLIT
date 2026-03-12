// ECS Ligand Pathway Calculator Data
// Based on Network-Based Pharmacology Study (Li et al., 2022) and Master ECS Tables

export interface Cannabinoid {
  id: string;
  name: string;
  fullName: string;
  type: 'acidic' | 'neutral' | 'metabolite';
  psychoactive: boolean;
  description: string;
  proteinTargets: string[];
  bindingAffinities: Record<string, number>; // protein -> kcal/mol
}

export interface ProteinTarget {
  id: string;
  symbol: string;
  name: string;
  uniprot: string;
  module: number; // Functional module 1-4
  icValue: number; // Integrated centrality value
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
  ligandScore: number; // 1-10 based on cannabinoid diversity
}

// 12 Key Cannabinoids from the study
export const cannabinoids: Cannabinoid[] = [
  {
    id: 'cbd',
    name: 'CBD',
    fullName: 'Cannabidiol',
    type: 'neutral',
    psychoactive: false,
    description: 'Non-psychoactive cannabinoid with broad therapeutic potential. Key component for anti-inflammatory, neuroprotective, and anti-anxiety effects.',
    proteinTargets: ['AKT1', 'CASP9', 'CAT', 'CYP17A1', 'CNR1', 'CNR2', 'PRKCA', 'TNF'],
    bindingAffinities: { 'AKT1': -8.6, 'CASP9': -5.8, 'CAT': -7.5, 'CYP17A1': -7.4, 'CNR1': -7.3, 'CNR2': -9.2, 'PRKCA': -7.8, 'TNF': -6.0 }
  },
  {
    id: 'cbda',
    name: 'CBDA',
    fullName: 'Cannabidiolic Acid',
    type: 'acidic',
    psychoactive: false,
    description: 'Raw, acidic precursor to CBD with enhanced bioavailability. Superior anti-inflammatory and anti-nausea properties.',
    proteinTargets: ['AKT1', 'CASP9', 'CAT', 'CYP17A1', 'CNR1', 'CNR2', 'PRKCA', 'TNF'],
    bindingAffinities: { 'AKT1': -8.8, 'CASP9': -5.9, 'CAT': -7.9, 'CYP17A1': -7.0, 'CNR1': -7.1, 'CNR2': -7.3, 'PRKCA': -6.7, 'TNF': -10.5 }
  },
  {
    id: 'cbg',
    name: 'CBG',
    fullName: 'Cannabigerol',
    type: 'neutral',
    psychoactive: false,
    description: 'The "mother cannabinoid" from which other cannabinoids are synthesized. Strong antibacterial and anti-inflammatory properties.',
    proteinTargets: ['CYCS', 'CNR1', 'CNR2', 'PRKCA'],
    bindingAffinities: { 'CYCS': -4.7, 'CNR1': -7.9, 'CNR2': -6.9, 'PRKCA': -7.4 }
  },
  {
    id: 'cbga',
    name: 'CBGA',
    fullName: 'Cannabigerolic Acid',
    type: 'acidic',
    psychoactive: false,
    description: 'Acidic precursor to CBG. The primary building block for all cannabinoids. Supports metabolic and inflammatory pathways.',
    proteinTargets: ['PLCG1', 'CNR1', 'CNR2'],
    bindingAffinities: { 'PLCG1': -5.6, 'CNR1': -6.9, 'CNR2': -7.0 }
  },
  {
    id: 'cbn',
    name: 'CBN',
    fullName: 'Cannabinol',
    type: 'neutral',
    psychoactive: false,
    description: 'Mildly sedating cannabinoid formed from THC degradation. Excellent for sleep, appetite stimulation, and pain relief.',
    proteinTargets: ['COMT', 'CREB1', 'CNR1', 'CNR2', 'GSTA2', 'GSTM3', 'GSTP1', 'HMOX1', 'PRKCA', 'PRKCB'],
    bindingAffinities: { 'COMT': -8.0, 'CREB1': -6.6, 'CNR1': -9.4, 'CNR2': -8.5, 'GSTA2': -6.5, 'GSTM3': -7.6, 'GSTP1': -8.1, 'HMOX1': -7.7, 'PRKCA': -8.2, 'PRKCB': -8.5 }
  },
  {
    id: 'cbc',
    name: 'CBC',
    fullName: 'Cannabichromene',
    type: 'neutral',
    psychoactive: false,
    description: 'Non-psychoactive cannabinoid with potent anti-inflammatory and antidepressant effects. Works synergistically with other cannabinoids.',
    proteinTargets: ['GSTA2', 'GSTM3', 'GSTP1', 'HMOX1', 'CNR1', 'CNR2', 'PRKCA', 'PRKCB'],
    bindingAffinities: { 'GSTA2': -7.0, 'GSTM3': -7.7, 'GSTP1': -8.7, 'HMOX1': -8.0, 'CNR1': -7.0, 'CNR2': -7.7, 'PRKCA': -7.5, 'PRKCB': -8.1 }
  },
  {
    id: 'cbdv',
    name: 'CBDV',
    fullName: 'Cannabidivarin',
    type: 'neutral',
    psychoactive: false,
    description: 'Propyl analog of CBD. Studied for anti-nausea and anti-epileptic properties. Non-intoxicating with neurological benefits.',
    proteinTargets: ['ALOX12', 'ALOX15', 'CNR1', 'CNR2'],
    bindingAffinities: { 'CNR1': -7.2, 'CNR2': -7.8 }
  },
  {
    id: 'thcv',
    name: 'THCV',
    fullName: 'Tetrahydrocannabivarin',
    type: 'neutral',
    psychoactive: true,
    description: 'Propyl analog of THC with shorter, clearer effects. Known for appetite suppression, energy boost, and blood sugar regulation.',
    proteinTargets: ['CNR1', 'CNR2'],
    bindingAffinities: { 'CNR1': -7.5, 'CNR2': -7.9 }
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
    productName: 'FF PMA Suppositories',
    productType: 'supplement',
    cannabinoids: ['CBD', 'CBDA', 'CBG'],
    primaryIndications: ['Cancer Support', 'Detoxification', 'Systemic Delivery'],
    ligandScore: 7
  },
  {
    productName: 'Ozonated Hemp Oil Suppositories',
    productType: 'supplement',
    cannabinoids: ['CBD', 'CBC'],
    primaryIndications: ['Gut Health', 'Inflammation', 'Oxygenation'],
    ligandScore: 5
  }
];

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
