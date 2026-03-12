import { db } from "../db";
import { trainingModules, trainingModuleSections, trainingModuleKeyPoints } from "@shared/schema";
import { createTrainingContent } from "../services/muse-content-creator";
import { eq } from "drizzle-orm";

const DIET_CANCER_AUDIO_FILE_ID = "1VnK0m20kft2etji6OIac9_N-W8a2SlPn";

const AUDIO_DESCRIPTION = `
This audio recording covers the relationship between diet and cancer, including:
- How dietary choices impact cancer risk and prevention
- The role of inflammation in cancer development
- Anti-cancer foods and their specific compounds
- The importance of plant-based nutrition
- Fasting and its effects on cancer cells
- Practical dietary recommendations for cancer prevention
- The connection between processed foods and cancer risk
- Evidence-based nutritional strategies used in integrative oncology
`;

const dietCancerModule = {
  id: "diet-cancer-fundamentals",
  title: "Diet and Cancer: Nutritional Strategies for Prevention and Healing",
  slug: "diet-cancer-fundamentals",
  description: "Explore the powerful connection between what you eat and cancer prevention. Learn evidence-based nutritional strategies, anti-cancer foods, and lifestyle modifications that support your body's natural defenses.",
  imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800",
  category: "Nutrition & Healing",
  sortOrder: 1,
  duration: "35 min",
  difficulty: "beginner" as const,
  isActive: true,
  requiresMembership: true,
  roleAccess: ["member", "doctor", "admin"],
  audioUrl: `https://drive.google.com/uc?export=download&id=${DIET_CANCER_AUDIO_FILE_ID}`,
  driveFileId: DIET_CANCER_AUDIO_FILE_ID,
  isInteractive: true,
  hasQuiz: true,
};

const dietCancerContent = {
  sections: [
    {
      title: "The Food-Cancer Connection",
      content: "Research consistently shows that diet plays a significant role in cancer prevention - some estimates suggest that 30-40% of all cancers could be prevented through dietary and lifestyle modifications. The foods we eat can either promote inflammation and cellular damage, or provide protective compounds that support our body's natural defenses against cancer development. Understanding this connection empowers you to make informed choices that support long-term health."
    },
    {
      title: "Anti-Cancer Foods and Compounds",
      content: "Certain foods contain powerful compounds that actively fight cancer. Cruciferous vegetables like broccoli, cauliflower, and kale contain sulforaphane, which helps the body detoxify carcinogens. Berries are rich in anthocyanins and ellagic acid, potent antioxidants that protect DNA from damage. Turmeric's curcumin has been shown in hundreds of studies to inhibit cancer cell growth. Garlic and onions contain organosulfur compounds that support liver detoxification. Green tea provides EGCG, a catechin that can induce cancer cell death while leaving healthy cells unharmed."
    },
    {
      title: "Foods to Minimize or Avoid",
      content: "Just as important as what to eat is understanding what to limit. Processed meats are classified as Group 1 carcinogens by the WHO - meaning there's sufficient evidence they cause cancer. Heavily charred or grilled meats contain heterocyclic amines (HCAs) and polycyclic aromatic hydrocarbons (PAHs). Refined sugars and processed carbohydrates can promote insulin resistance and inflammation. Alcohol increases risk for multiple cancer types. Trans fats and excessive omega-6 oils promote inflammatory pathways."
    },
    {
      title: "The Anti-Inflammatory Approach",
      content: "Chronic inflammation is a key driver of cancer development. An anti-inflammatory diet emphasizes whole foods, healthy fats (especially omega-3s from fish, flax, and walnuts), abundant vegetables and fruits, and herbs and spices. The Mediterranean diet pattern consistently shows protective effects. Focus on colorful produce - the pigments that give foods their colors are often the same compounds that fight cancer. Aim for 8-10 servings of vegetables and fruits daily, with emphasis on variety."
    },
    {
      title: "Practical Implementation",
      content: "Transforming your diet doesn't require perfection - progress matters. Start by adding rather than restricting: add a serving of cruciferous vegetables daily, swap processed snacks for berries and nuts, use turmeric and garlic liberally in cooking. Prioritize organic for the 'Dirty Dozen' produce items. Stay well-hydrated with filtered water and green tea. Consider working with a nutrition-savvy practitioner to personalize your approach based on your health history and goals."
    }
  ],
  keyPoints: [
    "30-40% of cancers may be preventable through diet and lifestyle",
    "Cruciferous vegetables, berries, turmeric, and garlic are powerful anti-cancer foods",
    "Minimize processed meats, refined sugars, and alcohol",
    "Anti-inflammatory eating patterns (like Mediterranean diet) are protective",
    "Focus on adding protective foods rather than just restricting harmful ones"
  ]
};

export async function seedDietCancerTraining(useAI: boolean = false) {
  console.log("[Diet-Cancer Seed] Starting Diet and Cancer training seed...");
  console.log(`[Diet-Cancer Seed] Using AI content generation: ${useAI}`);
  
  try {
    await db.insert(trainingModules)
      .values(dietCancerModule)
      .onConflictDoUpdate({
        target: trainingModules.id,
        set: {
          title: dietCancerModule.title,
          description: dietCancerModule.description,
          imageUrl: dietCancerModule.imageUrl,
          audioUrl: dietCancerModule.audioUrl,
          driveFileId: dietCancerModule.driveFileId,
          isInteractive: dietCancerModule.isInteractive,
          hasQuiz: dietCancerModule.hasQuiz,
          sortOrder: dietCancerModule.sortOrder,
        }
      });
    
    console.log(`[Diet-Cancer Seed] Created/updated module: ${dietCancerModule.title}`);
    
    let generatedContent = dietCancerContent;
    
    if (useAI) {
      console.log("[Diet-Cancer Seed] MUSE generating content with Gemini from audio description...");
      try {
        const aiContent = await createTrainingContent(
          AUDIO_DESCRIPTION,
          "Diet and Cancer: Nutritional Strategies",
          "health-conscious members seeking to understand the diet-cancer connection"
        );
        
        console.log("[Diet-Cancer Seed] MUSE generated content successfully");
        
        await db.delete(trainingModuleSections).where(
          eq(trainingModuleSections.moduleId, dietCancerModule.id)
        );
        await db.delete(trainingModuleKeyPoints).where(
          eq(trainingModuleKeyPoints.moduleId, dietCancerModule.id)
        );
        
        for (let i = 0; i < aiContent.sections.length; i++) {
          await db.insert(trainingModuleSections).values({
            moduleId: dietCancerModule.id,
            title: aiContent.sections[i].title,
            content: aiContent.sections[i].content,
            sortOrder: i,
          });
        }
        
        for (let i = 0; i < aiContent.keyPoints.length; i++) {
          await db.insert(trainingModuleKeyPoints).values({
            moduleId: dietCancerModule.id,
            point: aiContent.keyPoints[i],
            sortOrder: i,
          });
        }
        
        generatedContent = {
          sections: aiContent.sections,
          keyPoints: aiContent.keyPoints,
        };
        
        console.log("[Diet-Cancer Seed] Stored AI-generated content in database");
      } catch (aiError) {
        console.error("[Diet-Cancer Seed] AI generation failed, using fallback content:", aiError);
      }
    }
    
    console.log("[Diet-Cancer Seed] Diet and Cancer training seed completed successfully");
    
    return { 
      success: true, 
      module: dietCancerModule,
      content: generatedContent,
      usedAI: useAI
    };
  } catch (error) {
    console.error("[Diet-Cancer Seed] Error seeding Diet and Cancer training:", error);
    throw error;
  }
}

export { dietCancerContent };
