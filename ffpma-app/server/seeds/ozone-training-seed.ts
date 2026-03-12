import { db } from "../db";
import { trainingModules, trainingModuleSections, trainingModuleKeyPoints } from "@shared/schema";
import { extractPdfFromDrive, truncateText } from "../services/pdf-extractor";
import { createTrainingContent } from "../services/muse-content-creator";
import { eq } from "drizzle-orm";

const ozoneTrainingModules = [
  {
    id: "ozone-therapy-comprehensive",
    title: "Comprehensive Ozone Therapy Guide",
    slug: "ozone-therapy-comprehensive",
    description: "Master the science and application of ozone therapy. This comprehensive guide covers the therapeutic uses, protocols, safety considerations, and clinical evidence for ozone as a healing modality.",
    imageUrl: "https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=800",
    category: "Ozone Therapy",
    sortOrder: 1,
    duration: "90 min",
    difficulty: "intermediate" as const,
    isActive: true,
    requiresMembership: true,
    roleAccess: ["member", "doctor", "admin"],
    driveFileId: "1g5X4hPVk9-7NjqmRJTHGlAuxE6szGmTh",
    pdfUrl: "https://drive.google.com/file/d/1g5X4hPVk9-7NjqmRJTHGlAuxE6szGmTh/view",
    isInteractive: true,
    hasQuiz: true,
  },
];

export async function seedOzoneTraining(useAI: boolean = false) {
  console.log("[MUSE] Starting Ozone Therapy training seed...");
  console.log(`[MUSE] AI content generation: ${useAI ? "ENABLED" : "DISABLED"}`);

  let modulesAdded = 0;
  let sectionsAdded = 0;
  let keyPointsAdded = 0;

  for (const moduleData of ozoneTrainingModules) {
    const existingModule = await db.query.trainingModules.findFirst({
      where: eq(trainingModules.slug, moduleData.slug),
    });

    if (existingModule) {
      console.log(`[MUSE] Module already exists: ${moduleData.title}`);
      continue;
    }

    let aiContent: { sections: any[]; keyPoints: any[] } | null = null;

    if (useAI && moduleData.driveFileId) {
      try {
        console.log(`[MUSE] Extracting PDF content from Drive: ${moduleData.driveFileId}`);
        const pdfResult = await extractPdfFromDrive(moduleData.driveFileId);
        
        if (pdfResult.text && pdfResult.text.length > 100) {
          console.log(`[MUSE] Extracted ${pdfResult.text.length} characters from PDF (${pdfResult.numPages} pages)`);
          const truncatedText = truncateText(pdfResult.text, 25000);
          
          console.log(`[MUSE] Generating AI content for: ${moduleData.title}`);
          aiContent = await createTrainingContent(truncatedText, "ozone therapy", "health practitioners and members");
          console.log(`[MUSE] Generated ${aiContent.sections.length} sections and ${aiContent.keyPoints.length} key points`);
        }
      } catch (error) {
        console.error(`[MUSE] Error processing PDF for ${moduleData.title}:`, error);
      }
    }

    const [newModule] = await db.insert(trainingModules).values(moduleData).returning();

    modulesAdded++;
    console.log(`[MUSE] Added module: ${moduleData.title}`);

    if (aiContent) {
      for (let i = 0; i < aiContent.sections.length; i++) {
        const section = aiContent.sections[i];
        await db.insert(trainingModuleSections).values({
          moduleId: newModule.id,
          title: section.title,
          content: section.content,
          sortOrder: i + 1,
        });
        sectionsAdded++;
      }

      for (let i = 0; i < aiContent.keyPoints.length; i++) {
        const keyPoint = aiContent.keyPoints[i];
        const pointText = typeof keyPoint === 'string' ? keyPoint : keyPoint.point;
        await db.insert(trainingModuleKeyPoints).values({
          moduleId: newModule.id,
          point: pointText,
          sortOrder: i + 1,
        });
        keyPointsAdded++;
      }
    } else {
      await db.insert(trainingModuleSections).values({
        moduleId: newModule.id,
        title: "Introduction to Ozone Therapy",
        content: "Ozone therapy is a form of alternative medicine that uses ozone (O3) to treat various conditions. This module covers the fundamentals of ozone therapy and its therapeutic applications.",
        sortOrder: 1,
      });
      await db.insert(trainingModuleSections).values({
        moduleId: newModule.id,
        title: "Clinical Applications",
        content: "Learn about the various clinical applications of ozone therapy, including wound healing, immune modulation, and antimicrobial effects.",
        sortOrder: 2,
      });
      sectionsAdded += 2;

      await db.insert(trainingModuleKeyPoints).values({
        moduleId: newModule.id,
        point: "Ozone (O3) is a highly reactive form of oxygen with powerful oxidizing properties",
        sortOrder: 1,
      });
      await db.insert(trainingModuleKeyPoints).values({
        moduleId: newModule.id,
        point: "Medical ozone is generated from pure oxygen using specialized equipment",
        sortOrder: 2,
      });
      keyPointsAdded += 2;
    }
  }

  console.log(`[MUSE] Ozone training seed complete: ${modulesAdded} modules, ${sectionsAdded} sections, ${keyPointsAdded} key points`);

  return {
    success: true,
    modulesAdded,
    sectionsAdded,
    keyPointsAdded,
    message: `Added ${modulesAdded} ozone therapy modules with ${sectionsAdded} sections and ${keyPointsAdded} key points`,
  };
}
