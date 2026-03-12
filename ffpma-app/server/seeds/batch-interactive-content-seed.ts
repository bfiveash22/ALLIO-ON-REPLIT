import { db } from "../db";
import { trainingModules, trainingModuleSections, trainingModuleKeyPoints } from "@shared/schema";
import { extractPdfFromDrive, truncateText } from "../services/pdf-extractor";
import { createTrainingContent } from "../services/muse-content-creator";
import { eq, and, isNotNull, or } from "drizzle-orm";

interface ProcessResult {
  moduleId: string;
  title: string;
  status: "success" | "error" | "skipped";
  sectionsAdded?: number;
  keyPointsAdded?: number;
  error?: string;
}

export async function generateInteractiveContent(options: {
  limit?: number;
  category?: string;
  dryRun?: boolean;
} = {}): Promise<{
  processed: number;
  successful: number;
  failed: number;
  results: ProcessResult[];
}> {
  const { limit = 50, category, dryRun = false } = options;
  
  console.log("[MUSE Batch] Starting interactive content generation...");
  console.log(`[MUSE Batch] Options: limit=${limit}, category=${category || "all"}, dryRun=${dryRun}`);

  const modulesToProcess = await db.select()
    .from(trainingModules)
    .where(
      and(
        isNotNull(trainingModules.driveFileId),
        or(
          eq(trainingModules.isInteractive, false),
          eq(trainingModules.hasQuiz, false)
        )
      )
    )
    .limit(limit);

  console.log(`[MUSE Batch] Found ${modulesToProcess.length} modules needing interactive content`);

  const results: ProcessResult[] = [];
  let successful = 0;
  let failed = 0;

  for (const module of modulesToProcess) {
    console.log(`\n[MUSE Batch] Processing: ${module.title}`);
    
    if (category && module.category !== category) {
      results.push({
        moduleId: module.id,
        title: module.title,
        status: "skipped",
        error: `Category mismatch (${module.category} != ${category})`
      });
      continue;
    }

    if (!module.driveFileId) {
      results.push({
        moduleId: module.id,
        title: module.title,
        status: "skipped",
        error: "No Drive file ID"
      });
      continue;
    }

    try {
      console.log(`[MUSE Batch] Extracting PDF: ${module.driveFileId}`);
      const pdfResult = await extractPdfFromDrive(module.driveFileId);
      
      if (!pdfResult.text || pdfResult.text.length < 100) {
        results.push({
          moduleId: module.id,
          title: module.title,
          status: "error",
          error: "Insufficient PDF content extracted"
        });
        failed++;
        continue;
      }

      console.log(`[MUSE Batch] Extracted ${pdfResult.text.length} chars from ${pdfResult.numPages} pages`);
      const truncatedText = truncateText(pdfResult.text, 25000);

      const topicContext = module.category || "health and wellness";
      const audienceContext = "health practitioners and members seeking healing knowledge";

      console.log(`[MUSE Batch] Generating AI content...`);
      const aiContent = await createTrainingContent(truncatedText, topicContext, audienceContext);
      
      if (!aiContent || !aiContent.sections || aiContent.sections.length === 0) {
        results.push({
          moduleId: module.id,
          title: module.title,
          status: "error",
          error: "AI failed to generate content"
        });
        failed++;
        continue;
      }

      console.log(`[MUSE Batch] Generated ${aiContent.sections.length} sections, ${aiContent.keyPoints.length} key points`);

      if (dryRun) {
        results.push({
          moduleId: module.id,
          title: module.title,
          status: "success",
          sectionsAdded: aiContent.sections.length,
          keyPointsAdded: aiContent.keyPoints.length
        });
        successful++;
        continue;
      }

      await db.delete(trainingModuleSections).where(eq(trainingModuleSections.moduleId, module.id));
      await db.delete(trainingModuleKeyPoints).where(eq(trainingModuleKeyPoints.moduleId, module.id));

      for (let i = 0; i < aiContent.sections.length; i++) {
        const section = aiContent.sections[i];
        await db.insert(trainingModuleSections).values({
          moduleId: module.id,
          title: section.title,
          content: section.content,
          sortOrder: i + 1,
        });
      }

      for (let i = 0; i < aiContent.keyPoints.length; i++) {
        const keyPoint = aiContent.keyPoints[i] as any;
        const pointText = typeof keyPoint === 'string' ? keyPoint : keyPoint.point;
        await db.insert(trainingModuleKeyPoints).values({
          moduleId: module.id,
          point: pointText,
          sortOrder: i + 1,
        });
      }

      await db.update(trainingModules)
        .set({
          isInteractive: true,
          hasQuiz: true,
          updatedAt: new Date()
        })
        .where(eq(trainingModules.id, module.id));

      results.push({
        moduleId: module.id,
        title: module.title,
        status: "success",
        sectionsAdded: aiContent.sections.length,
        keyPointsAdded: aiContent.keyPoints.length
      });
      successful++;
      
      console.log(`[MUSE Batch] ✓ Completed: ${module.title}`);

    } catch (error: any) {
      console.error(`[MUSE Batch] Error processing ${module.title}:`, error.message);
      results.push({
        moduleId: module.id,
        title: module.title,
        status: "error",
        error: error.message
      });
      failed++;
    }
  }

  console.log(`\n[MUSE Batch] Complete: ${successful} successful, ${failed} failed`);
  
  return {
    processed: modulesToProcess.length,
    successful,
    failed,
    results
  };
}

export async function generateSingleModuleContent(moduleId: string): Promise<ProcessResult> {
  console.log(`[MUSE] Generating content for module: ${moduleId}`);
  
  const module = await db.query.trainingModules.findFirst({
    where: eq(trainingModules.id, moduleId)
  });

  if (!module) {
    return { moduleId, title: "Unknown", status: "error", error: "Module not found" };
  }

  if (!module.driveFileId) {
    return { moduleId, title: module.title, status: "error", error: "No source file linked" };
  }

  try {
    const pdfResult = await extractPdfFromDrive(module.driveFileId);
    
    if (!pdfResult.text || pdfResult.text.length < 100) {
      return { moduleId, title: module.title, status: "error", error: "Insufficient PDF content" };
    }

    const truncatedText = truncateText(pdfResult.text, 25000);
    const aiContent = await createTrainingContent(
      truncatedText, 
      module.category || "health", 
      "health practitioners and members"
    );

    if (!aiContent || !aiContent.sections?.length) {
      return { moduleId, title: module.title, status: "error", error: "AI generation failed" };
    }

    await db.delete(trainingModuleSections).where(eq(trainingModuleSections.moduleId, module.id));
    await db.delete(trainingModuleKeyPoints).where(eq(trainingModuleKeyPoints.moduleId, module.id));

    for (let i = 0; i < aiContent.sections.length; i++) {
      await db.insert(trainingModuleSections).values({
        moduleId: module.id,
        title: aiContent.sections[i].title,
        content: aiContent.sections[i].content,
        sortOrder: i + 1,
      });
    }

    for (let i = 0; i < aiContent.keyPoints.length; i++) {
      const kp = aiContent.keyPoints[i] as any;
      const point = typeof kp === 'string' ? kp : kp.point;
      await db.insert(trainingModuleKeyPoints).values({
        moduleId: module.id,
        point,
        sortOrder: i + 1,
      });
    }

    await db.update(trainingModules)
      .set({ isInteractive: true, hasQuiz: true, updatedAt: new Date() })
      .where(eq(trainingModules.id, module.id));

    return {
      moduleId,
      title: module.title,
      status: "success",
      sectionsAdded: aiContent.sections.length,
      keyPointsAdded: aiContent.keyPoints.length
    };
  } catch (error: any) {
    return { moduleId, title: module.title, status: "error", error: error.message };
  }
}
