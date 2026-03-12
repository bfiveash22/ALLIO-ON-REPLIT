import { db } from "../db";
import { trainingModules, trainingTracks, trainingModuleSections, trainingModuleKeyPoints } from "@shared/schema";
import { extractPdfFromDrive, truncateText } from "../services/pdf-extractor";
import { createTrainingContent } from "../services/muse-content-creator";
import { eq } from "drizzle-orm";

const PEPTIDE_DRIVE_FOLDER = "1H6x0QhfKbZfkg6SHoAPAfwVMDB2Ahngu";

const peptideTrainingModules = [
  {
    id: "peptide-101-building-blocks",
    title: "Peptide Fundamentals: Building Blocks",
    slug: "peptide-101-building-blocks",
    description: "Master the foundational knowledge of amino acids and peptide chemistry. Learn about the 20 standard amino acids, their structures, and how they combine to form peptide chains.",
    imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800",
    category: "Peptide Science",
    sortOrder: 1,
    duration: "45 min",
    difficulty: "beginner" as const,
    isActive: true,
    requiresMembership: true,
    roleAccess: ["member", "doctor", "admin"],
    driveFileId: "1l9J-CQxDPhEIjk39Y3pdTdBr_ByMl5Sl",
    pdfUrl: "https://drive.google.com/file/d/1l9J-CQxDPhEIjk39Y3pdTdBr_ByMl5Sl/view",
    isInteractive: true,
    hasQuiz: true,
  },
  {
    id: "peptide-102-origins-synthesis",
    title: "Origins and Synthesis of Amino Acids",
    slug: "peptide-102-origins-synthesis",
    description: "Explore the origins of amino acids in nature and the chemical synthesis methods used in laboratories. Understand how peptides are manufactured for therapeutic applications.",
    imageUrl: "https://images.unsplash.com/photo-1559757175-7b21e0ed3a23?w=800",
    category: "Peptide Science",
    sortOrder: 2,
    duration: "50 min",
    difficulty: "intermediate" as const,
    isActive: true,
    requiresMembership: true,
    roleAccess: ["member", "doctor", "admin"],
    driveFileId: "1WEb5o7HXm2RtKVf4WCgXYdWdhuZ1cWYp",
    pdfUrl: "https://drive.google.com/file/d/1WEb5o7HXm2RtKVf4WCgXYdWdhuZ1cWYp/view",
    isInteractive: true,
    hasQuiz: true,
  },
  {
    id: "peptide-103-modified-amino-acids",
    title: "Modified Amino Acids and Enzymes",
    slug: "peptide-103-modified-amino-acids",
    description: "Deep dive into modified amino acids, organocatalysis, and enzyme function. Learn how modifications affect peptide function and therapeutic applications.",
    imageUrl: "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800",
    category: "Peptide Science",
    sortOrder: 3,
    duration: "55 min",
    difficulty: "intermediate" as const,
    isActive: true,
    requiresMembership: true,
    roleAccess: ["member", "doctor", "admin"],
    driveFileId: "1bjPawkmKxkc9ZjSpwq8Pp1f9TAwN7vzm",
    pdfUrl: "https://drive.google.com/file/d/1bjPawkmKxkc9ZjSpwq8Pp1f9TAwN7vzm/view",
    isInteractive: true,
    hasQuiz: true,
  },
  {
    id: "peptide-104-analysis-function",
    title: "Analysis and Function of Amino Acids",
    slug: "peptide-104-analysis-function",
    description: "Advanced study of analytical methods for amino acid analysis and the functional properties of peptides in biological systems.",
    imageUrl: "https://images.unsplash.com/photo-1582719471137-c3967ffb1c42?w=800",
    category: "Peptide Science",
    sortOrder: 4,
    duration: "60 min",
    difficulty: "advanced" as const,
    isActive: true,
    requiresMembership: true,
    roleAccess: ["doctor", "admin"],
    driveFileId: "1IgnlzwyZ50r0yI0ZX29NqLwBdbpkczlb",
    pdfUrl: "https://drive.google.com/file/d/1IgnlzwyZ50r0yI0ZX29NqLwBdbpkczlb/view",
    isInteractive: true,
    hasQuiz: true,
  },
  {
    id: "peptide-105-diabetes-management",
    title: "Peptides in Diabetes Management",
    slug: "peptide-105-diabetes-management",
    description: "Explore how peptide-based therapies revolutionize diabetes treatment. Learn about insulin analogs, GLP-1 agonists, and emerging peptide therapeutics for metabolic health.",
    imageUrl: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800",
    category: "Peptide Science",
    sortOrder: 5,
    duration: "50 min",
    difficulty: "intermediate" as const,
    isActive: true,
    requiresMembership: true,
    roleAccess: ["member", "doctor", "admin"],
    driveFileId: "12vCJHP4Ujaail6wlLs_oDLZhedM_xpvY",
    pdfUrl: "https://drive.google.com/file/d/12vCJHP4Ujaail6wlLs_oDLZhedM_xpvY/view",
    isInteractive: true,
    hasQuiz: true,
  },
  {
    id: "peptide-106-hormones-bioregulators",
    title: "Chemical Synthesis of Hormones and Bioregulators",
    slug: "peptide-106-hormones-bioregulators",
    description: "Advanced study of hormone and pheromone synthesis. Understand the chemical processes behind creating bioregulators for therapeutic and research applications.",
    imageUrl: "https://images.unsplash.com/photo-1628595351029-c2bf17511435?w=800",
    category: "Peptide Science",
    sortOrder: 6,
    duration: "65 min",
    difficulty: "advanced" as const,
    isActive: true,
    requiresMembership: true,
    roleAccess: ["doctor", "admin"],
    driveFileId: "14LmNE-p9BNXKNzvz-S2XMszLOFJmR0kp",
    pdfUrl: "https://drive.google.com/file/d/14LmNE-p9BNXKNzvz-S2XMszLOFJmR0kp/view",
    isInteractive: true,
    hasQuiz: true,
  },
];

const peptideTrack = {
  id: "track-peptide-science",
  title: "Peptide Science Certification",
  slug: "peptide-science-certification",
  description: "Complete certification program in peptide science, from amino acid fundamentals to advanced analysis and therapeutic applications.",
  imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800",
  totalModules: 6,
  estimatedDuration: "5.5 hours",
  difficulty: "intermediate" as const,
  isActive: true,
  requiresMembership: true,
  roleAccess: ["member", "doctor", "admin"],
};

export async function seedPeptideTraining(useAI: boolean = false) {
  console.log("[Peptide Seed] Starting peptide training seed...");
  console.log(`[Peptide Seed] Using MUSE AI content generation: ${useAI}`);
  
  try {
    for (const module of peptideTrainingModules) {
      await db.insert(trainingModules)
        .values(module)
        .onConflictDoUpdate({
          target: trainingModules.id,
          set: {
            title: module.title,
            description: module.description,
            imageUrl: module.imageUrl,
            duration: module.duration,
            difficulty: module.difficulty,
            driveFileId: module.driveFileId,
            pdfUrl: module.pdfUrl,
            isInteractive: module.isInteractive,
            hasQuiz: module.hasQuiz,
          },
        });
      console.log(`[Peptide Seed] Upserted module: ${module.title}`);
    }

    await db.insert(trainingTracks)
      .values(peptideTrack)
      .onConflictDoUpdate({
        target: trainingTracks.id,
        set: {
          title: peptideTrack.title,
          description: peptideTrack.description,
          totalModules: peptideTrack.totalModules,
          estimatedDuration: peptideTrack.estimatedDuration,
        },
      });
    console.log("[Peptide Seed] Upserted peptide science track");

    if (useAI) {
      console.log("[Peptide Seed] Generating MUSE AI content for new modules...");
      
      const modulesToProcess = [
        peptideTrainingModules.find(m => m.id === "peptide-105-diabetes-management")!,
        peptideTrainingModules.find(m => m.id === "peptide-106-hormones-bioregulators")!,
      ];

      for (const module of modulesToProcess) {
        await generateModuleContentFromPdf(module);
      }
    }

    return { 
      success: true, 
      modules: peptideTrainingModules.length,
      message: `Seeded ${peptideTrainingModules.length} peptide training modules${useAI ? ' with MUSE AI content' : ''}`,
    };
  } catch (error: any) {
    console.error("[Peptide Seed] Error:", error);
    throw error;
  }
}

async function generateModuleContentFromPdf(module: typeof peptideTrainingModules[0]) {
  console.log(`[Peptide Seed] Processing PDF for: ${module.title}`);
  
  try {
    const pdfContent = await extractPdfFromDrive(module.driveFileId);
    console.log(`[Peptide Seed] Extracted ${pdfContent.numPages} pages from ${pdfContent.title}`);
    
    const truncatedText = truncateText(pdfContent.text, 25000);
    
    const generatedContent = await createTrainingContent(
      module.title,
      module.description,
      truncatedText
    );

    console.log(`[Peptide Seed] MUSE generated ${generatedContent.sections.length} sections for ${module.title}`);

    await db.delete(trainingModuleSections).where(eq(trainingModuleSections.moduleId, module.id));
    await db.delete(trainingModuleKeyPoints).where(eq(trainingModuleKeyPoints.moduleId, module.id));

    for (let i = 0; i < generatedContent.sections.length; i++) {
      const section = generatedContent.sections[i];
      await db.insert(trainingModuleSections).values({
        id: `${module.id}-section-${i + 1}`,
        moduleId: module.id,
        title: section.title,
        content: section.content,
        sortOrder: i + 1,
      });
    }

    for (let i = 0; i < generatedContent.keyPoints.length; i++) {
      await db.insert(trainingModuleKeyPoints).values({
        id: `${module.id}-keypoint-${i + 1}`,
        moduleId: module.id,
        point: generatedContent.keyPoints[i],
        sortOrder: i + 1,
      });
    }

    console.log(`[Peptide Seed] Saved MUSE content for: ${module.title}`);
    
  } catch (error: any) {
    console.error(`[Peptide Seed] Error processing ${module.title}:`, error.message);
  }
}
