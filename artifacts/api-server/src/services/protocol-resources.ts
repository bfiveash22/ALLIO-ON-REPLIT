import type {
  HealingProtocol,
  PatientProfile,
} from "@shared/types/protocol-assembly";

export interface RecommendedBook {
  title: string;
  author: string;
  reason: string;
  conditionMatch: string;
}

export interface ResearchLink {
  title: string;
  url: string;
  description: string;
  conditionMatch: string;
}

export interface DriveResource {
  title: string;
  url: string;
  description: string;
  type: "folder" | "document" | "guide";
}

export interface YouTubeResource {
  title: string;
  url: string;
  description: string;
  category: string;
}

export interface PatientResources {
  books: RecommendedBook[];
  researchLinks: ResearchLink[];
  driveResources: DriveResource[];
  youtubeResources: YouTubeResource[];
  isCancer: boolean;
  hasAmalgam: boolean;
  hasParasites: boolean;
  hasGutIssues: boolean;
  hasHormoneIssues: boolean;
  hasMetabolicIssues: boolean;
  hasHeartIssues: boolean;
  hasAutoimmune: boolean;
  hasMoldExposure: boolean;
}

const CANCER_KEYWORDS = ["cancer", "tumor", "carcinoma", "oncolog", "malignant", "metastas", "chemo", "radiation therapy", "HER2", "ER+", "PR+", "PSA", "leukemia", "lymphoma", "melanoma", "sarcoma"];
const AMALGAM_KEYWORDS = ["amalgam", "mercury", "filling", "dental", "root canal", "cavitation", "periodontal"];
const PARASITE_KEYWORDS = ["parasite", "worm", "helminth", "ivermectin", "fenbendazole", "pathogen", "antiviral", "viral load", "bacterial load"];
const GUT_KEYWORDS = ["gut", "microbiome", "digestive", "IBS", "SIBO", "candida", "gallbladder", "leaky gut", "dysbiosis", "probiotic", "bloating", "reflux", "GERD"];
const HORMONE_KEYWORDS = ["hormone", "thyroid", "estrogen", "testosterone", "progesterone", "endocrine", "adrenal", "cortisol", "HPA", "HPG", "gonadorelin", "menopause", "perimenopause"];
const METABOLIC_KEYWORDS = ["metabolic", "diabetes", "insulin", "blood sugar", "obesity", "weight", "inflammation", "mitochondr", "ATP", "NAD", "sirtuin"];
const HEART_KEYWORDS = ["heart", "cardiovascular", "atherosclerosis", "plaque", "cholesterol", "blood pressure", "hypertension", "arterial", "stroke", "cardiac"];
const AUTOIMMUNE_KEYWORDS = ["autoimmune", "lupus", "rheumatoid", "hashimoto", "graves", "MS", "multiple sclerosis", "crohn", "celiac", "psoriasis"];
const MOLD_KEYWORDS = ["mold", "mycotoxin", "fungal", "aspergillus", "stachybotrys", "CIRS"];

const BOOK_DATABASE: Array<RecommendedBook & { conditions: string[] }> = [
  {
    title: "Rapid Virus Recovery",
    author: "Dr. Thomas Levy",
    reason: "Essential reading on breaking up biofilm with nebulization and high-dose vitamin C therapy for viral recovery",
    conditionMatch: "general",
    conditions: ["general"],
  },
  {
    title: "Dental Dangers",
    author: "Dr. Bruce Shelton",
    reason: "Please read over Dental Dangers as amalgam issues and periodontal problems can significantly hurt longevity goals",
    conditionMatch: "amalgam",
    conditions: ["amalgam"],
  },
  {
    title: "A World Without Cancer",
    author: "G. Edward Griffin",
    reason: "The link between nitrilosides and cancer — the story of B17 Laetrile and why it matters for your protocol",
    conditionMatch: "cancer",
    conditions: ["cancer"],
  },
  {
    title: "The Iodine Crisis",
    author: "Lynne Farrow",
    reason: "Critical reading on the relationship between selenium, iodine, and cancer rise in the U.S.",
    conditionMatch: "cancer",
    conditions: ["cancer", "thyroid", "hormone"],
  },
  {
    title: "A Cancer Therapy: Results of Fifty Cases",
    author: "Dr. Max Gerson",
    reason: "The original Gerson therapy clinical documentation — foundational for understanding dietary protocols in cancer care",
    conditionMatch: "cancer",
    conditions: ["cancer"],
  },
  {
    title: "The Metabolic Approach to Cancer",
    author: "Dr. Nasha Winters & Jess Higgins Kelley",
    reason: "Integrative oncology nutrition and metabolic terrain assessment — essential for understanding cancer as a metabolic disease",
    conditionMatch: "cancer",
    conditions: ["cancer"],
  },
  {
    title: "One Minute Cure",
    author: "Madison Cavanaugh",
    reason: "Hydrogen peroxide therapy overview and its applications for supporting the body's natural healing processes",
    conditionMatch: "general",
    conditions: ["general"],
  },
  {
    title: "Cymatics: A Study of Wave Phenomena",
    author: "Hans Jenny",
    reason: "Foundation text for frequency-based healing modalities — understanding how sound and vibration affect cellular health",
    conditionMatch: "general",
    conditions: ["general"],
  },
  {
    title: "Toxic Dentistry Exposed",
    author: "Dr. Graeme Munro-Hall",
    reason: "Understanding how mercury amalgam fillings and root canals create systemic toxicity that undermines your healing",
    conditionMatch: "amalgam",
    conditions: ["amalgam"],
  },
  {
    title: "The Root Canal Cover-Up",
    author: "Dr. George Meinig",
    reason: "Based on Dr. Weston Price's research — why root canals can harbor bacteria that contribute to chronic disease",
    conditionMatch: "amalgam",
    conditions: ["amalgam"],
  },
  {
    title: "Parasite Rex",
    author: "Carl Zimmer",
    reason: "Understanding the hidden world of parasites and why anti-parasitic protocols are fundamental to restoring health",
    conditionMatch: "parasite",
    conditions: ["parasite"],
  },
  {
    title: "Gut and Psychology Syndrome (GAPS)",
    author: "Dr. Natasha Campbell-McBride",
    reason: "The gut-brain connection and how healing the gut microbiome is foundational to restoring systemic health",
    conditionMatch: "gut",
    conditions: ["gut"],
  },
  {
    title: "Break the Mold",
    author: "Dr. Jill Crista",
    reason: "Comprehensive guide to recovering from mold illness — detox strategies, diet, and environmental remediation",
    conditionMatch: "mold",
    conditions: ["mold"],
  },
  {
    title: "The Autoimmune Fix",
    author: "Dr. Tom O'Bryan",
    reason: "Understanding the root causes of autoimmune disease and how to reverse the inflammation cascade",
    conditionMatch: "autoimmune",
    conditions: ["autoimmune"],
  },
  {
    title: "Why We Get Sick",
    author: "Dr. Benjamin Bikman",
    reason: "Understanding insulin resistance as the root cause of most chronic metabolic diseases",
    conditionMatch: "metabolic",
    conditions: ["metabolic"],
  },
  {
    title: "The Great Cholesterol Myth",
    author: "Dr. Jonny Bowden & Dr. Stephen Sinatra",
    reason: "Why cholesterol is not the enemy — understanding the real causes of heart disease and atherosclerosis",
    conditionMatch: "heart",
    conditions: ["heart"],
  },
  {
    title: "Undoctored",
    author: "Dr. William Davis",
    reason: "Taking control of your own health with evidence-based strategies that challenge conventional medical wisdom",
    conditionMatch: "general",
    conditions: ["general"],
  },
  {
    title: "The Wahls Protocol",
    author: "Dr. Terry Wahls",
    reason: "A radical new way to treat chronic autoimmune conditions using targeted nutrition to fuel cellular recovery",
    conditionMatch: "autoimmune",
    conditions: ["autoimmune"],
  },
  {
    title: "Radical Remission",
    author: "Dr. Kelly Turner",
    reason: "Nine key factors that can make a real difference in cancer recovery, based on over 1,000 documented cases",
    conditionMatch: "cancer",
    conditions: ["cancer"],
  },
];

const RESEARCH_DATABASE: Array<ResearchLink & { conditions: string[] }> = [
  {
    title: "Moringa Health Benefits",
    url: "https://ensosuperfoods.com/blogs/supergreens/moringa-health-benefits-for-women",
    description: "Comprehensive overview of moringa's anti-inflammatory, antioxidant, and immune-supporting properties",
    conditionMatch: "general",
    conditions: ["general"],
  },
  {
    title: "Chlorella Benefits",
    url: "https://www.healthline.com/nutrition/benefits-of-chlorella",
    description: "Heavy metal detox, immune support, and nutrient density — why chlorella is in your protocol",
    conditionMatch: "general",
    conditions: ["general", "detox"],
  },
  {
    title: "Marine Phytoplankton Benefits",
    url: "https://flexhealthandwellness.com/blogs/blog/marine-phytoplankton-improves-human-health",
    description: "How marine phytoplankton provides bioavailable nutrition at the cellular level",
    conditionMatch: "general",
    conditions: ["general"],
  },
  {
    title: "Sirtuins and Atherosclerosis Reduction",
    url: "https://www.ahajournals.org/doi/10.1161/CIRCRESAHA.118.312498",
    description: "Peer-reviewed research on how sirtuin activation reduces atherosclerosis — the science behind our NAD+ protocols",
    conditionMatch: "heart",
    conditions: ["heart", "metabolic"],
  },
  {
    title: "DMSO IV for Plaque Reduction",
    url: "https://www.lifeextension.com/magazine/2007/7/cover_dmso",
    description: "How DMSO IV therapy supports plaque reduction and cardiovascular health",
    conditionMatch: "heart",
    conditions: ["heart"],
  },
  {
    title: "Hydrogen Peroxide for Clogged Arteries",
    url: "https://rmcgeorgia.com/how-hydrogen-peroxide-helps-clear-clogged-arteries/",
    description: "How hydrogen peroxide therapy supports arterial clearance and cardiovascular function",
    conditionMatch: "heart",
    conditions: ["heart"],
  },
  {
    title: "Fenbendazole and Cancer: Research Overview",
    url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7523519/",
    description: "Anti-parasitic compounds showing documented anti-tumor properties in preclinical studies",
    conditionMatch: "cancer",
    conditions: ["cancer"],
  },
  {
    title: "High-Dose Vitamin C in Cancer Treatment",
    url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5927785/",
    description: "Peer-reviewed evidence for IV vitamin C as adjunctive cancer therapy",
    conditionMatch: "cancer",
    conditions: ["cancer"],
  },
  {
    title: "Mercury Toxicity from Dental Amalgam",
    url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3388771/",
    description: "Scientific evidence linking mercury amalgam fillings to systemic toxicity and chronic health conditions",
    conditionMatch: "amalgam",
    conditions: ["amalgam"],
  },
  {
    title: "Endocannabinoid System and Immune Regulation",
    url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7023045/",
    description: "How the ECS modulates immune response — the science behind our CBD/CBG protocols",
    conditionMatch: "general",
    conditions: ["general", "cancer", "autoimmune"],
  },
  {
    title: "Iodine Deficiency and Thyroid/Cancer Connection",
    url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3752513/",
    description: "Relationship between iodine deficiency, thyroid dysfunction, and cancer risk",
    conditionMatch: "cancer",
    conditions: ["cancer", "thyroid"],
  },
  {
    title: "Gut Microbiome and Systemic Health",
    url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7510518/",
    description: "How gut dysbiosis drives systemic inflammation and chronic disease",
    conditionMatch: "gut",
    conditions: ["gut", "autoimmune"],
  },
  {
    title: "BPC-157 Healing Properties",
    url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5333585/",
    description: "Comprehensive review of BPC-157's tissue repair, anti-inflammatory, and gut healing properties",
    conditionMatch: "general",
    conditions: ["general", "gut"],
  },
  {
    title: "Mold Illness and CIRS",
    url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3654247/",
    description: "Understanding chronic inflammatory response syndrome from mold/mycotoxin exposure",
    conditionMatch: "mold",
    conditions: ["mold"],
  },
];

const STANDARD_DRIVE_RESOURCES: DriveResource[] = [
  {
    title: "FF Research Document Library",
    url: "https://drive.google.com/drive/folders/1HfK-h2NemdU2ew9L9ZwJCXUMLTI8Q-Rn?usp=drive_link",
    description: "Complete research library — peer-reviewed papers, clinical protocols, and educational materials",
    type: "folder",
  },
  {
    title: "FF Main Library",
    url: "https://drive.google.com/drive/folders/1s6EdFtZ7dZY7utr8J843CFxyAjuuwHPX?usp=drive_link",
    description: "Daily Schedule templates, Detox Bath protocols, Liver Cleanse guide, and educational resources",
    type: "folder",
  },
  {
    title: "5 Day Fast Protocol",
    url: "https://docs.google.com/document/d/1NqvmXbq4fh3j6AqAVKnCtnaD8vuTjXv3feV43KJdJGg/edit?usp=sharing",
    description: "Guided 5-day fasting protocol for deep cellular repair, autophagy, and immune reset",
    type: "document",
  },
  {
    title: "Daily Schedule & Routine Guide",
    url: "https://docs.google.com/document/d/1K_36WNxm-dAwDHKqz8juGMHJHzRRzBp2OSwiMA1Wx-Q/edit?usp=sharing",
    description: "Master daily routine template — Gallbladder/Liver Cleanse instructions and Detox Bath protocol included",
    type: "document",
  },
  {
    title: "FF Detox Bath Protocol",
    url: "https://docs.google.com/document/d/1K_36WNxm-dAwDHKqz8juGMHJHzRRzBp2OSwiMA1Wx-Q/edit?usp=sharing",
    description: "Baking soda, bentonite clay, epsom salt, lavender — complete detox bath instructions (included in Daily Schedule document above)",
    type: "guide",
  },
  {
    title: "Liver & Gallbladder Cleanse Guide",
    url: "https://docs.google.com/document/d/1K_36WNxm-dAwDHKqz8juGMHJHzRRzBp2OSwiMA1Wx-Q/edit?usp=sharing",
    description: "Step-by-step liver flush protocol with olive oil and grapefruit (included in Daily Schedule document above)",
    type: "guide",
  },
];

const STANDARD_YOUTUBE_RESOURCES: YouTubeResource[] = [
  {
    title: "Jason Stephenson — Sleep Talk Downs",
    url: "https://www.youtube.com/@jasonstephensonmeditation",
    description: "Guided sleep meditations and talk-downs for restful, restorative sleep — essential for healing",
    category: "Sleep & Recovery",
  },
  {
    title: "PowerThoughts Meditation Club — Healing Frequencies",
    url: "https://www.youtube.com/@PowerThoughtsclub",
    description: "Frequency healing work, binaural beats, and solfeggio frequencies for cellular regeneration",
    category: "Frequency Healing",
  },
  {
    title: "Dr. Rachel Knox — The Endocannabinoid System (TED Talk)",
    url: "https://www.youtube.com/watch?v=lWGirZAhDGM",
    description: "Understanding the ECS — the master regulatory system your body uses for homeostasis",
    category: "Education",
  },
];

function matchesCondition(allText: string, keywords: string[]): boolean {
  const lower = allText.toLowerCase();
  return keywords.some(kw => lower.includes(kw.toLowerCase()));
}

function buildSearchText(protocol: HealingProtocol, profile: PatientProfile): string {
  return [
    ...(profile.currentDiagnoses || []),
    ...(profile.chiefComplaints || []),
    ...(profile.goals || []),
    ...(profile.deficiencies || []),
    ...(profile.contraindications || []),
    ...(profile.surgicalHistory || []),
    ...(profile.gutHealth?.digestiveIssues || []),
    profile.hormoneStatus?.thyroidIssues || "",
    profile.hormoneStatus?.hormoneDetails || "",
    profile.environmentalExposures?.moldDetails || "",
    profile.environmentalExposures?.heavyMetalDetails || "",
    Array.isArray(profile.environmentalExposures?.otherToxins)
      ? profile.environmentalExposures.otherToxins.join(" ")
      : (typeof profile.environmentalExposures?.otherToxins === "string" ? profile.environmentalExposures.otherToxins : ""),
    profile.traumaHistory?.traumaDetails || "",
    protocol.summary || "",
    ...(protocol.rootCauseAnalysis?.map(r => `${r.cause} ${r.details}`) || []),
    ...(protocol.injectablePeptides?.map(p => `${p.name} ${p.purpose}`) || []),
    ...(protocol.supplements?.map(s => `${s.name} ${s.purpose}`) || []),
    ...(protocol.detoxProtocols?.map(d => `${d.name} ${d.instructions}`) || []),
    ...(protocol.ivTherapies?.map(iv => `${iv.name} ${iv.purpose}`) || []),
    ...(protocol.parasiteAntiviralProtocols?.map(p => `${p.name} ${p.purpose}`) || []),
    ...(protocol.lifestyleRecommendations?.map(l => `${l.recommendation} ${l.details || ""}`) || []),
  ].join(" ");
}

export function getPatientResources(protocol: HealingProtocol, profile: PatientProfile): PatientResources {
  const allText = buildSearchText(protocol, profile);

  const isCancer = matchesCondition(allText, CANCER_KEYWORDS);
  const hasAmalgam = matchesCondition(allText, AMALGAM_KEYWORDS) ||
    profile.dentalHistory?.amalgamFillings ||
    profile.environmentalExposures?.amalgamFillings;
  const hasParasites = matchesCondition(allText, PARASITE_KEYWORDS);
  const hasGutIssues = matchesCondition(allText, GUT_KEYWORDS) ||
    profile.gutHealth?.gallbladderRemoved ||
    profile.gutHealth?.appendixRemoved ||
    (profile.gutHealth?.digestiveIssues?.length || 0) > 0;
  const hasHormoneIssues = matchesCondition(allText, HORMONE_KEYWORDS);
  const hasMetabolicIssues = matchesCondition(allText, METABOLIC_KEYWORDS);
  const hasHeartIssues = matchesCondition(allText, HEART_KEYWORDS);
  const hasAutoimmune = matchesCondition(allText, AUTOIMMUNE_KEYWORDS);
  const hasMoldExposure = matchesCondition(allText, MOLD_KEYWORDS) ||
    profile.environmentalExposures?.moldExposure;

  const conditionMap: Record<string, boolean> = {
    general: true,
    cancer: isCancer,
    amalgam: hasAmalgam,
    parasite: hasParasites,
    gut: hasGutIssues,
    hormone: hasHormoneIssues,
    thyroid: hasHormoneIssues,
    metabolic: hasMetabolicIssues,
    heart: hasHeartIssues,
    autoimmune: hasAutoimmune,
    mold: hasMoldExposure,
    detox: true,
  };

  const activeConditions = Object.entries(conditionMap)
    .filter(([_, active]) => active)
    .map(([condition]) => condition);

  const books = BOOK_DATABASE
    .filter(book => book.conditions.some(c => activeConditions.includes(c)))
    .map(({ conditions, ...book }) => book);

  const researchLinks = RESEARCH_DATABASE
    .filter(link => link.conditions.some(c => activeConditions.includes(c)))
    .map(({ conditions, ...link }) => link);

  return {
    books,
    researchLinks,
    driveResources: STANDARD_DRIVE_RESOURCES,
    youtubeResources: STANDARD_YOUTUBE_RESOURCES,
    isCancer,
    hasAmalgam,
    hasParasites,
    hasGutIssues,
    hasHormoneIssues,
    hasMetabolicIssues,
    hasHeartIssues,
    hasAutoimmune,
    hasMoldExposure,
  };
}
