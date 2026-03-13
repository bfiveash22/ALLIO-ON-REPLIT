import { db } from "../db";
import {
  trainingModules,
  trainingModuleSections,
  trainingModuleKeyPoints,
  trainingQuizzes,
} from "@shared/schema";
import { eq } from "drizzle-orm";

const IVERMECTIN_SOURCES = [
  { id: "14N7LafrtQkI-oDWGVaNBiu2qKUonBuyO", name: "IvermectinStudyEquador.pdf" },
  { id: "14QFbT_qx40rFS3li8oHQFoA_uK1HHW-H", name: "IvermectinCancer.pdf" },
  { id: "14TkZ5_a-sOxVEmf7vbZrn7tQHQmuLNgu", name: "Molecular Ivermectin (1).pdf" },
  { id: "14e3obEReUHUPQ96dxNBrs-MFvBquKB6E", name: "IvermectinReversesdrugresistance.pdf" },
  { id: "1CTmsZlDAqe_gL6aFLKqAAEQKDNhQk78G", name: "ivermectinasthmaothers.pdf" },
  { id: "14Z2wyQOeoJEliVQM2PiwNwESYIIHwWk3", name: "IvermectinAntiViral.pdf" },
];

const PRESENTATION_ID = "1wg5evyCkie9g9tjzKY7-LlZ_TJdb7_QHLpQ5F9cYLpM";
const PPTX_DOWNLOAD_PATH = "/assets/Ivermectin_and_Cancer.pptx";

const ivermectinModule = {
  id: "ivermectin-101",
  slug: "ivermectin-101",
  title: "Ivermectin: From Antiparasitic to Anticancer Agent",
  description:
    "Comprehensive training on Ivermectin covering its anticancer mechanisms (apoptosis, autophagy, immunogenic cell death), cancer-type-specific research, antiviral properties, molecular pathways (Wnt/β-catenin, Akt/mTOR, MAPK), cancer stem cells, multidrug resistance reversal, and clinical implications. Based on peer-reviewed research and a 38-slide presentation.",
  imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800",
  category: "Advanced Therapeutics",
  sortOrder: 1,
  duration: "90 min",
  difficulty: "intermediate" as const,
  isActive: true,
  requiresMembership: true,
  roleAccess: ["member", "doctor", "admin"],
  driveFileId: IVERMECTIN_SOURCES[1].id,
  pdfUrl: `https://drive.google.com/file/d/${IVERMECTIN_SOURCES[1].id}/view`,
  presentationFileId: PRESENTATION_ID,
  presentationUrl: `https://docs.google.com/presentation/d/${PRESENTATION_ID}/edit`,
  instructorName: "Dr. Miller",
  instructorTitle: "Medical Director",
  instructorBio:
    "Dr. Miller brings extensive clinical experience in integrative medicine and has studied Ivermectin applications since the early research studies.",
  additionalMaterials: [
    ...IVERMECTIN_SOURCES.map((s) => ({
      fileId: s.id,
      name: s.name,
      url: `https://drive.google.com/file/d/${s.id}/view`,
    })),
    {
      fileId: "pptx-ivermectin-cancer",
      name: "Ivermectin and Cancer Presentation (PPTX)",
      url: PPTX_DOWNLOAD_PATH,
    },
  ],
  isInteractive: true,
  hasQuiz: true,
};

const ivermectinSections = [
  {
    title: "Introduction & History of Ivermectin",
    content:
      "Ivermectin is a macrocyclic lactone derived from avermectin, originally discovered in soil bacteria (Streptomyces avermitilis) in the 1970s by Satoshi Ōmura and William Campbell — a breakthrough that earned them the 2015 Nobel Prize in Physiology or Medicine. Initially developed as an antiparasitic agent, Ivermectin revolutionized the treatment of river blindness (onchocerciasis) and lymphatic filariasis, benefiting hundreds of millions of people worldwide. Over recent decades, research has expanded far beyond its antiparasitic origins. Scientists have identified Ivermectin's potential as an anticancer, antiviral, and anti-inflammatory agent, opening entirely new therapeutic frontiers. Its favorable safety profile after decades of human use makes it a compelling candidate for drug repurposing in oncology.",
  },
  {
    title: "Major Causes of Cancer & the Role of Drug Repurposing",
    content:
      "Cancer arises from a complex interplay of genetic mutations, environmental exposures (carcinogens, radiation, pollutants), chronic inflammation, viral infections (HPV, HBV, EBV), immune dysfunction, and lifestyle factors (diet, obesity, tobacco). At the cellular level, cancer involves uncontrolled proliferation, evasion of apoptosis, sustained angiogenesis, and metastatic spread. Traditional cancer treatments — surgery, chemotherapy, and radiation — often carry severe side effects and resistance challenges. Drug repurposing, the strategy of finding new therapeutic applications for existing approved drugs, offers a faster and more cost-effective path to new cancer treatments. Ivermectin's well-established safety profile and newly discovered anticancer properties make it an ideal repurposing candidate.",
  },
  {
    title: "Ivermectin's Anticancer Mechanisms of Action",
    content:
      "Ivermectin exerts anticancer effects through multiple interconnected mechanisms. It induces apoptosis (programmed cell death) by activating caspase-dependent pathways and modulating Bcl-2 family proteins. It promotes autophagy — the cellular self-digestion process — by activating Beclin-1 and LC3-II pathways, which can lead to autophagic cell death in cancer cells. Ivermectin triggers immunogenic cell death (ICD), releasing damage-associated molecular patterns (DAMPs) like calreticulin, ATP, and HMGB1 that alert the immune system to attack tumor cells. Additionally, it inhibits cancer cell proliferation by inducing cell cycle arrest at G0/G1 and G2/M phases, and suppresses angiogenesis by reducing VEGF expression, thereby cutting off the tumor's blood supply.",
  },
  {
    title: "Cancer-Type-Specific Research: Breast, Stomach & Urinary Cancers",
    content:
      "In breast cancer, Ivermectin has demonstrated the ability to inhibit proliferation of triple-negative breast cancer (TNBC) cells — one of the most aggressive subtypes — by suppressing the Akt/mTOR pathway and inducing mitochondrial-mediated apoptosis. Studies show it reduces tumor growth in xenograft models at clinically achievable doses. For gastric (stomach) cancer, Ivermectin inhibits the Wnt/β-catenin signaling pathway, which is aberrantly activated in many gastrointestinal tumors. It downregulates β-catenin target genes like cyclin D1 and c-Myc, slowing tumor proliferation. In urinary cancers (bladder and renal cell carcinoma), Ivermectin induces oxidative stress and mitochondrial dysfunction in cancer cells, leading to apoptosis while showing selectivity for malignant over normal urothelial cells.",
  },
  {
    title: "Cancer-Type-Specific Research: Hematological, Reproductive & Brain Cancers",
    content:
      "In hematological malignancies (leukemia, lymphoma, multiple myeloma), Ivermectin induces chloride-dependent membrane hyperpolarization and enhances the activity of conventional chemotherapeutics. It has shown synergistic effects with doxorubicin and vincristine in leukemia cell lines. For reproductive cancers (ovarian, cervical), Ivermectin suppresses the MAPK/ERK and PI3K/Akt signaling cascades, inhibiting proliferation and promoting apoptosis. In cervical cancer, it also targets HPV-related oncoproteins. In brain glioma — one of the most treatment-resistant cancers — Ivermectin crosses the blood-brain barrier and inhibits glioblastoma stem cell self-renewal by suppressing the Akt/mTOR pathway. It induces mitochondrial dysfunction and oxidative stress specifically in glioma cells, offering hope for this devastating cancer type.",
  },
  {
    title: "Lung Cancer & Other Solid Tumors",
    content:
      "Ivermectin shows significant activity against both non-small cell lung cancer (NSCLC) and small cell lung cancer. It inhibits the EGFR/ERK/Akt signaling axis, which is constitutively activated in many lung tumors. Ivermectin enhances the efficacy of EGFR tyrosine kinase inhibitors (TKIs) and may help overcome resistance to these targeted therapies. In colorectal cancer, it inhibits Wnt pathway signaling and promotes apoptosis through caspase-3 activation. Pancreatic cancer research shows Ivermectin disrupts mitochondrial bioenergetics in pancreatic ductal adenocarcinoma cells. Across these solid tumors, Ivermectin demonstrates a pattern of selective cytotoxicity — affecting cancer cells at concentrations that leave normal cells relatively unharmed.",
  },
  {
    title: "Antiviral Properties & Cancer-Virus Connections",
    content:
      "Beyond direct anticancer effects, Ivermectin possesses broad-spectrum antiviral activity relevant to virus-associated cancers. It inhibits importin α/β1-mediated nuclear transport, a mechanism used by many viruses to hijack host cell machinery. This has shown efficacy against dengue, Zika, HIV, and influenza viruses in laboratory studies. Given that oncogenic viruses like HPV (cervical cancer), HBV/HCV (liver cancer), EBV (lymphoma, nasopharyngeal carcinoma), and HTLV-1 (T-cell leukemia) drive a significant percentage of global cancers, Ivermectin's antiviral properties provide an additional layer of anticancer defense. By inhibiting viral replication and the nuclear import of viral proteins, Ivermectin may help prevent virus-driven carcinogenesis.",
  },
  {
    title: "Molecular Pathways: Wnt/β-catenin, Akt/mTOR & MAPK Signaling",
    content:
      "Ivermectin modulates several critical oncogenic signaling pathways. The Wnt/β-catenin pathway, frequently hyperactivated in colorectal, gastric, and liver cancers, is inhibited by Ivermectin through promotion of β-catenin degradation and suppression of TCF/LEF transcriptional activity. The Akt/mTOR pathway — a master regulator of cell growth, survival, and metabolism — is downregulated by Ivermectin, leading to reduced protein synthesis, cell cycle arrest, and enhanced autophagy. Ivermectin also suppresses the MAPK/ERK cascade, disrupting proliferative signaling in multiple cancer types. Additionally, it modulates the PAK1 kinase (p21-activated kinase 1), which is overexpressed in over 70% of human cancers and drives tumor growth, migration, and immune evasion. By simultaneously targeting these interconnected pathways, Ivermectin disrupts the signaling networks that cancer cells depend on for survival.",
  },
  {
    title: "Cancer Stem Cells & Multidrug Resistance Reversal",
    content:
      "Cancer stem cells (CSCs) are a small subpopulation within tumors responsible for treatment resistance, recurrence, and metastasis. They possess self-renewal capacity and are often resistant to conventional chemotherapy and radiation. Ivermectin targets CSCs by inhibiting their self-renewal pathways (Wnt, Hedgehog, Notch) and preferentially inducing apoptosis in stem-like cancer cells. Multidrug resistance (MDR) is another major obstacle in cancer treatment, often mediated by ABC transporter proteins (P-glycoprotein/MDR1, MRP1, BCRP) that pump chemotherapy drugs out of cancer cells. Ivermectin reverses MDR by inhibiting these efflux pumps, restoring intracellular drug accumulation. Studies demonstrate that Ivermectin sensitizes resistant cancer cells to doxorubicin, paclitaxel, and vincristine, making it a valuable adjunct to conventional chemotherapy regimens.",
  },
  {
    title: "Clinical Implications & Future Directions",
    content:
      "The preclinical evidence for Ivermectin's anticancer potential is substantial and spans multiple cancer types, mechanisms, and model systems. Its advantages for clinical translation include decades of established human safety data, oral bioavailability, low cost, and worldwide availability. Current clinical trials are evaluating Ivermectin in breast cancer, colorectal cancer, and hematological malignancies, both as a single agent and in combination with standard therapies. Key considerations include optimizing dosing strategies for anticancer effects (which may differ from antiparasitic doses), identifying patient populations most likely to benefit, and designing combination protocols that maximize synergy. The convergence of Ivermectin's anticancer, antiviral, anti-inflammatory, and immunomodulatory properties positions it as a uniquely versatile agent in integrative oncology — a drug whose full therapeutic potential is still being uncovered.",
  },
];

const ivermectinKeyPoints = [
  "Ivermectin was discovered in soil bacteria and earned the 2015 Nobel Prize for treating parasitic diseases",
  "Drug repurposing of Ivermectin for cancer leverages its established safety profile from decades of human use",
  "Ivermectin induces cancer cell death through apoptosis (caspase-dependent), autophagy (Beclin-1/LC3-II), and immunogenic cell death (DAMPs release)",
  "It inhibits breast cancer (especially triple-negative), gastric cancer, and urinary tract cancers through distinct molecular mechanisms",
  "In hematological cancers, Ivermectin enhances the activity of conventional chemotherapy drugs like doxorubicin",
  "Ivermectin crosses the blood-brain barrier and shows activity against treatment-resistant glioblastoma",
  "It targets the Wnt/β-catenin pathway (degrading β-catenin), Akt/mTOR pathway (blocking cell growth), and MAPK/ERK signaling",
  "PAK1 kinase, overexpressed in 70%+ of human cancers, is directly inhibited by Ivermectin",
  "Ivermectin possesses broad-spectrum antiviral activity by inhibiting importin α/β1 nuclear transport",
  "Oncogenic viruses (HPV, HBV, EBV, HTLV-1) that drive cancers may be suppressed by Ivermectin's antiviral mechanism",
  "Cancer stem cells responsible for recurrence and resistance are targeted by Ivermectin through Wnt/Hedgehog/Notch pathway inhibition",
  "Ivermectin reverses multidrug resistance by inhibiting ABC transporter efflux pumps (P-glycoprotein, MRP1, BCRP)",
  "It enhances sensitivity to standard chemotherapy agents including paclitaxel, doxorubicin, and vincristine",
  "Clinical trials are currently evaluating Ivermectin in breast, colorectal, and hematological cancers",
  "Ivermectin's combined anticancer, antiviral, anti-inflammatory, and immunomodulatory properties make it uniquely versatile for integrative oncology",
];

const ivermectinQuizQuestions = [
  {
    question: "What organism was Ivermectin originally derived from?",
    options: [
      "A marine fungus",
      "Soil bacteria (Streptomyces avermitilis)",
      "A tropical plant extract",
      "Synthetic laboratory creation",
    ],
    correctAnswerIndex: 1,
    explanation:
      "Ivermectin is a macrocyclic lactone derived from avermectin, discovered in the soil bacterium Streptomyces avermitilis by Ōmura and Campbell.",
  },
  {
    question: "What Nobel Prize recognition did Ivermectin receive?",
    options: [
      "2010 Nobel Prize in Chemistry",
      "2015 Nobel Prize in Physiology or Medicine",
      "2020 Nobel Prize in Medicine",
      "It has not received Nobel recognition",
    ],
    correctAnswerIndex: 1,
    explanation:
      "Satoshi Ōmura and William Campbell received the 2015 Nobel Prize in Physiology or Medicine for the discovery of avermectin/Ivermectin.",
  },
  {
    question: "Which of the following is NOT a mechanism by which Ivermectin kills cancer cells?",
    options: [
      "Apoptosis via caspase activation",
      "Autophagy through Beclin-1/LC3-II pathways",
      "Direct DNA alkylation",
      "Immunogenic cell death releasing DAMPs",
    ],
    correctAnswerIndex: 2,
    explanation:
      "Ivermectin induces apoptosis, autophagy, and immunogenic cell death but does not work through DNA alkylation, which is a mechanism of certain chemotherapy drugs like cyclophosphamide.",
  },
  {
    question: "What are DAMPs in the context of immunogenic cell death?",
    options: [
      "Drug-Activated Membrane Proteins",
      "Damage-Associated Molecular Patterns (calreticulin, ATP, HMGB1)",
      "DNA-Altered Methylation Points",
      "Dose-Adjusted Molecular Pharmaceuticals",
    ],
    correctAnswerIndex: 1,
    explanation:
      "DAMPs (Damage-Associated Molecular Patterns) like calreticulin, ATP, and HMGB1 are released during immunogenic cell death and alert the immune system to attack tumor cells.",
  },
  {
    question: "Which aggressive breast cancer subtype has Ivermectin shown particular efficacy against?",
    options: [
      "Hormone receptor-positive (HR+)",
      "HER2-positive",
      "Triple-negative breast cancer (TNBC)",
      "Lobular carcinoma in situ",
    ],
    correctAnswerIndex: 2,
    explanation:
      "Ivermectin has demonstrated the ability to inhibit proliferation of triple-negative breast cancer (TNBC) cells by suppressing the Akt/mTOR pathway.",
  },
  {
    question: "How does Ivermectin affect gastric (stomach) cancer cells?",
    options: [
      "By activating the Wnt/β-catenin pathway",
      "By inhibiting the Wnt/β-catenin pathway and downregulating cyclin D1 and c-Myc",
      "By directly killing H. pylori bacteria",
      "By increasing stomach acid production",
    ],
    correctAnswerIndex: 1,
    explanation:
      "Ivermectin inhibits the Wnt/β-catenin signaling pathway in gastric cancer, downregulating target genes like cyclin D1 and c-Myc that drive tumor proliferation.",
  },
  {
    question: "What makes Ivermectin particularly promising for brain glioma treatment?",
    options: [
      "It only works on brain tumors",
      "It crosses the blood-brain barrier and targets glioblastoma stem cell self-renewal",
      "It is already FDA-approved for brain cancer",
      "It replaces the need for brain surgery",
    ],
    correctAnswerIndex: 1,
    explanation:
      "Ivermectin can cross the blood-brain barrier and inhibits glioblastoma stem cell self-renewal by suppressing Akt/mTOR, offering hope for this treatment-resistant cancer.",
  },
  {
    question: "Which viral transport mechanism does Ivermectin inhibit?",
    options: [
      "Importin α/β1-mediated nuclear transport",
      "Endosomal membrane fusion",
      "Reverse transcriptase activity",
      "Viral capsid assembly",
    ],
    correctAnswerIndex: 0,
    explanation:
      "Ivermectin inhibits importin α/β1-mediated nuclear transport, a mechanism many viruses use to hijack host cell machinery for replication.",
  },
  {
    question: "Which oncogenic virus is associated with cervical cancer and may be suppressed by Ivermectin?",
    options: [
      "Hepatitis B virus (HBV)",
      "Epstein-Barr virus (EBV)",
      "Human papillomavirus (HPV)",
      "Human T-lymphotropic virus (HTLV-1)",
    ],
    correctAnswerIndex: 2,
    explanation:
      "HPV is the primary oncogenic virus driving cervical cancer. Ivermectin's antiviral properties may help suppress HPV-related oncoproteins.",
  },
  {
    question: "What is PAK1 kinase, and why is it relevant to Ivermectin's anticancer effects?",
    options: [
      "A tumor suppressor that Ivermectin activates",
      "A kinase overexpressed in >70% of cancers that Ivermectin inhibits",
      "A liver enzyme that metabolizes Ivermectin",
      "A protein only found in parasitic organisms",
    ],
    correctAnswerIndex: 1,
    explanation:
      "PAK1 (p21-activated kinase 1) is overexpressed in over 70% of human cancers and drives tumor growth, migration, and immune evasion. Ivermectin directly inhibits PAK1.",
  },
  {
    question: "What role do cancer stem cells (CSCs) play in tumor biology?",
    options: [
      "They are harmless remnants of normal development",
      "They are responsible for treatment resistance, recurrence, and metastasis",
      "They only exist in blood cancers",
      "They help the immune system fight tumors",
    ],
    correctAnswerIndex: 1,
    explanation:
      "Cancer stem cells are a small subpopulation within tumors responsible for treatment resistance, recurrence, and metastasis due to their self-renewal capacity.",
  },
  {
    question: "How does Ivermectin reverse multidrug resistance in cancer cells?",
    options: [
      "By increasing the dose of chemotherapy drugs",
      "By destroying the cell membrane entirely",
      "By inhibiting ABC transporter efflux pumps (P-glycoprotein, MRP1, BCRP)",
      "By converting resistant cells to normal cells",
    ],
    correctAnswerIndex: 2,
    explanation:
      "Ivermectin reverses multidrug resistance by inhibiting ABC transporter proteins that pump chemotherapy drugs out of cancer cells, restoring intracellular drug accumulation.",
  },
  {
    question: "Which chemotherapy drugs has Ivermectin been shown to enhance the efficacy of?",
    options: [
      "Only aspirin and ibuprofen",
      "Doxorubicin, paclitaxel, and vincristine",
      "Only experimental drugs not yet approved",
      "Ivermectin cannot be combined with other drugs",
    ],
    correctAnswerIndex: 1,
    explanation:
      "Studies demonstrate Ivermectin sensitizes resistant cancer cells to standard chemotherapeutics including doxorubicin, paclitaxel, and vincristine.",
  },
  {
    question: "Which cell cycle phases does Ivermectin arrest cancer cells in?",
    options: [
      "S phase only",
      "G0/G1 and G2/M phases",
      "Only during mitosis",
      "It does not affect cell cycle",
    ],
    correctAnswerIndex: 1,
    explanation:
      "Ivermectin inhibits cancer cell proliferation by inducing cell cycle arrest at both G0/G1 and G2/M phases, preventing cells from dividing.",
  },
  {
    question: "How does Ivermectin suppress tumor angiogenesis?",
    options: [
      "By increasing blood flow to tumors",
      "By reducing VEGF expression, cutting off the tumor's blood supply",
      "By strengthening existing blood vessels",
      "It has no effect on angiogenesis",
    ],
    correctAnswerIndex: 1,
    explanation:
      "Ivermectin suppresses angiogenesis by reducing VEGF (vascular endothelial growth factor) expression, thereby cutting off the blood supply tumors need to grow.",
  },
  {
    question: "What is the primary advantage of drug repurposing Ivermectin for cancer treatment?",
    options: [
      "It is a brand new compound with unknown properties",
      "Decades of established human safety data, oral bioavailability, low cost, and worldwide availability",
      "It has already completed all cancer clinical trials",
      "It only works against one specific cancer type",
    ],
    correctAnswerIndex: 1,
    explanation:
      "Ivermectin's long history of safe human use, oral administration, low cost, and global availability make it an ideal candidate for drug repurposing in oncology.",
  },
  {
    question: "Which signaling pathway does Ivermectin inhibit that serves as a 'master regulator' of cell growth and metabolism?",
    options: [
      "Notch signaling",
      "Hedgehog pathway",
      "Akt/mTOR pathway",
      "JAK/STAT pathway",
    ],
    correctAnswerIndex: 2,
    explanation:
      "The Akt/mTOR pathway is a master regulator of cell growth, survival, and metabolism. Ivermectin downregulates this pathway, leading to reduced protein synthesis and enhanced autophagy.",
  },
  {
    question: "In hematological malignancies, what cellular mechanism does Ivermectin induce?",
    options: [
      "Chloride-dependent membrane hyperpolarization",
      "Sodium channel activation",
      "Calcium influx blockade",
      "Potassium efflux inhibition",
    ],
    correctAnswerIndex: 0,
    explanation:
      "In leukemia, lymphoma, and multiple myeloma cells, Ivermectin induces chloride-dependent membrane hyperpolarization, contributing to cancer cell death.",
  },
];

export async function seedIvermectinTraining() {
  console.log("[Ivermectin Seed] Creating comprehensive Ivermectin & Cancer training module...");

  const moduleId = ivermectinModule.id;

  await db
    .insert(trainingModules)
    .values(ivermectinModule)
    .onConflictDoUpdate({
      target: trainingModules.id,
      set: {
        title: ivermectinModule.title,
        description: ivermectinModule.description,
        imageUrl: ivermectinModule.imageUrl,
        category: ivermectinModule.category,
        duration: ivermectinModule.duration,
        difficulty: ivermectinModule.difficulty,
        driveFileId: ivermectinModule.driveFileId,
        pdfUrl: ivermectinModule.pdfUrl,
        presentationFileId: ivermectinModule.presentationFileId,
        presentationUrl: ivermectinModule.presentationUrl,
        instructorName: ivermectinModule.instructorName,
        instructorTitle: ivermectinModule.instructorTitle,
        instructorBio: ivermectinModule.instructorBio,
        additionalMaterials: ivermectinModule.additionalMaterials,
        isInteractive: ivermectinModule.isInteractive,
        hasQuiz: ivermectinModule.hasQuiz,
        updatedAt: new Date(),
      },
    });

  console.log(`[Ivermectin Seed] Upserted module: ${ivermectinModule.title}`);

  await db.delete(trainingModuleSections).where(eq(trainingModuleSections.moduleId, moduleId));
  await db.delete(trainingModuleKeyPoints).where(eq(trainingModuleKeyPoints.moduleId, moduleId));

  for (let i = 0; i < ivermectinSections.length; i++) {
    await db.insert(trainingModuleSections).values({
      moduleId,
      title: ivermectinSections[i].title,
      content: ivermectinSections[i].content,
      sortOrder: i,
    });
  }

  console.log(`[Ivermectin Seed] Inserted ${ivermectinSections.length} sections`);

  for (let i = 0; i < ivermectinKeyPoints.length; i++) {
    await db.insert(trainingModuleKeyPoints).values({
      moduleId,
      point: ivermectinKeyPoints[i],
      sortOrder: i,
    });
  }

  console.log(`[Ivermectin Seed] Inserted ${ivermectinKeyPoints.length} key points`);

  const quizId = "ivermectin-101-quiz";

  await db
    .insert(trainingQuizzes)
    .values({
      id: quizId,
      moduleId,
      title: "Ivermectin & Cancer Comprehensive Assessment",
      description:
        "Test your understanding of Ivermectin's anticancer mechanisms, cancer-type-specific research, molecular pathways, antiviral properties, cancer stem cells, and multidrug resistance reversal.",
      questions: ivermectinQuizQuestions,
      passingScore: 80,
      isActive: true,
    })
    .onConflictDoUpdate({
      target: trainingQuizzes.id,
      set: {
        title: "Ivermectin & Cancer Comprehensive Assessment",
        description:
          "Test your understanding of Ivermectin's anticancer mechanisms, cancer-type-specific research, molecular pathways, antiviral properties, cancer stem cells, and multidrug resistance reversal.",
        questions: ivermectinQuizQuestions,
        passingScore: 80,
        isActive: true,
        updatedAt: new Date(),
      },
    });

  console.log(`[Ivermectin Seed] Upserted quiz with ${ivermectinQuizQuestions.length} questions`);
  console.log("[Ivermectin Seed] Ivermectin & Cancer training seed completed successfully");

  return {
    success: true,
    module: ivermectinModule,
    sections: ivermectinSections.length,
    keyPoints: ivermectinKeyPoints.length,
    quizQuestions: ivermectinQuizQuestions.length,
  };
}

export { ivermectinSections, ivermectinKeyPoints, ivermectinQuizQuestions };
