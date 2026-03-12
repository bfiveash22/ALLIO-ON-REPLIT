import { db } from "../db";
import { dianeKnowledge } from "@shared/schema";
import { extractPdfFromDrive, truncateText } from "../services/pdf-extractor";
import { createTrainingContent } from "../services/muse-content-creator";

const CANDIDA_COOKBOOK_FILE_ID = "1LYnq7aC3BPBZC011ZffuDH7VYHfxQsr9";

export async function seedDianeCandidaCookbook(useAI: boolean = false) {
  console.log("[Diane Seed] Starting Candida Cookbook seed...");
  console.log(`[Diane Seed] Using MUSE AI generation: ${useAI}`);
  
  try {
    if (useAI) {
      console.log("[Diane Seed] Extracting PDF content...");
      const pdfContent = await extractPdfFromDrive(CANDIDA_COOKBOOK_FILE_ID);
      console.log(`[Diane Seed] Extracted ${pdfContent.numPages} pages from ${pdfContent.title}`);
      
      const truncatedText = truncateText(pdfContent.text, 25000);
      
      console.log("[Diane Seed] Generating MUSE content from cookbook...");
      const generatedContent = await createTrainingContent(
        "Candida Cookbook: Anti-Fungal Diet Recipes",
        "A comprehensive collection of candida-friendly recipes for managing fungal overgrowth through diet",
        truncatedText
      );
      
      const mainEntry = {
        category: "recipe" as const,
        title: "Candida Cookbook Mega Bundle - Anti-Fungal Diet Guide",
        summary: "A comprehensive 7-manuscript collection with 300+ candida-friendly recipes designed to combat fungal overgrowth through strategic nutrition. Covers breakfast, lunch, dinner, snacks, and healing protocols.",
        content: generatedContent.sections.map(s => `## ${s.title}\n\n${s.content}`).join('\n\n'),
        sourceDocument: "CANDIDA COOKBOOK MEGA BUNDLE – 7 Manuscripts in 1 – 300+ Candida-friendly recipes",
        driveFileId: CANDIDA_COOKBOOK_FILE_ID,
        tags: ["candida", "anti-fungal", "recipes", "diet", "healing", "cookbook", "yeast overgrowth", "gut health"],
        relatedProducts: ["Caprylic Acid", "Oregano Oil", "Probiotics", "Antifungal Support", "Digestive Enzymes"],
        relatedGenes: ["FLO11", "CYP51", "ERG11", "CDR1", "MDR1"],
        isActive: true,
      };
      
      await db.insert(dianeKnowledge)
        .values(mainEntry)
        .onConflictDoNothing();
      
      console.log("[Diane Seed] Added main Candida Cookbook entry to Diane's knowledge base");
      
      for (const keyPoint of generatedContent.keyPoints) {
        const keyPointEntry = {
          category: "diet_plan" as const,
          title: `Candida Diet Key Insight: ${keyPoint.substring(0, 80)}...`,
          summary: keyPoint,
          content: keyPoint,
          sourceDocument: "CANDIDA COOKBOOK MEGA BUNDLE",
          driveFileId: CANDIDA_COOKBOOK_FILE_ID,
          tags: ["candida", "diet tip", "key insight"],
          relatedProducts: [],
          relatedGenes: [],
          isActive: true,
        };
        
        await db.insert(dianeKnowledge)
          .values(keyPointEntry)
          .onConflictDoNothing();
      }
      
      console.log(`[Diane Seed] Added ${generatedContent.keyPoints.length} key insight entries`);
      
      return {
        success: true,
        entriesAdded: 1 + generatedContent.keyPoints.length,
        message: `Added Candida Cookbook to Diane's knowledge base with ${generatedContent.sections.length} sections and ${generatedContent.keyPoints.length} key insights`,
      };
    } else {
      const staticEntry = {
        category: "recipe" as const,
        title: "Candida Cookbook Mega Bundle - Anti-Fungal Diet Guide",
        summary: "A comprehensive 7-manuscript collection with 300+ candida-friendly recipes designed to combat fungal overgrowth through strategic nutrition.",
        content: `CANDIDA COOKBOOK MEGA BUNDLE
        
This comprehensive guide includes 7 manuscripts with over 300 recipes specifically designed for those managing candida overgrowth.

KEY DIETARY PRINCIPLES:
- Eliminate sugar and refined carbohydrates
- Avoid yeast-containing foods
- Focus on anti-fungal foods like garlic, coconut oil, and ginger
- Include plenty of non-starchy vegetables
- Incorporate fermented foods for probiotics

MEAL CATEGORIES COVERED:
- Breakfast options
- Lunch recipes
- Dinner meals
- Snacks and desserts
- Beverages and smoothies
- Healing broths and soups
- Special occasion meals

The recipes in this collection are designed to starve candida while nourishing your body with essential nutrients for healing.`,
        sourceDocument: "CANDIDA COOKBOOK MEGA BUNDLE – 7 Manuscripts in 1",
        driveFileId: CANDIDA_COOKBOOK_FILE_ID,
        tags: ["candida", "anti-fungal", "recipes", "diet", "cookbook"],
        relatedProducts: ["Caprylic Acid", "Oregano Oil", "Probiotics"],
        relatedGenes: [],
        isActive: true,
      };
      
      await db.insert(dianeKnowledge)
        .values(staticEntry)
        .onConflictDoNothing();
      
      return {
        success: true,
        entriesAdded: 1,
        message: "Added Candida Cookbook to Diane's knowledge base (static content)",
      };
    }
  } catch (error: any) {
    console.error("[Diane Seed] Error:", error);
    throw error;
  }
}
