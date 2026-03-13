import { db } from "../db";
import { trainingTracks, trainingModules, trackModules, quizzes, quizQuestions, quizAnswers, moduleQuizzes } from "@shared/schema";

export const formulaAnalysisTrack = {
  id: "track-formula-analysis",
  title: "Formula Analysis & Optimization",
  slug: "formula-analysis-optimization",
  description: "Learn to analyze, design, and optimize therapeutic formulations. Master ingredient synergies, dosing calculations, and quality assurance. Guided by SYNTHESIS agent intelligence.",
  imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800",
  totalModules: 6,
  estimatedDuration: "7.5 hours",
  difficulty: "advanced" as const,
  isActive: true,
  requiresMembership: true,
  roleAccess: ["doctor", "admin"],
};

export const formulaAnalysisModules = [
  {
    id: "fa-101-formulation-principles",
    title: "Formulation Science Principles",
    slug: "fa-101-formulation-principles",
    description: "Foundational principles of therapeutic formulation. Learn about bioavailability, synergistic interactions, delivery systems, and the science behind effective product design.",
    imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800",
    category: "Formula Analysis",
    sortOrder: 1,
    duration: "70 min",
    difficulty: "intermediate" as const,
    isActive: true,
    requiresMembership: true,
    roleAccess: ["doctor", "admin"],
    isInteractive: true,
    hasQuiz: true,
  },
  {
    id: "fa-102-ingredient-synergies",
    title: "Ingredient Synergies & Interactions",
    slug: "fa-102-ingredient-synergies",
    description: "Deep dive into how ingredients interact. Understand synergistic, additive, and antagonistic relationships between vitamins, minerals, peptides, and botanical compounds.",
    imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800",
    category: "Formula Analysis",
    sortOrder: 2,
    duration: "80 min",
    difficulty: "advanced" as const,
    isActive: true,
    requiresMembership: true,
    roleAccess: ["doctor", "admin"],
    isInteractive: true,
    hasQuiz: true,
  },
  {
    id: "fa-103-iv-formulation",
    title: "IV Therapy Formulation & Compounding",
    slug: "fa-103-iv-formulation",
    description: "Master IV nutrient formulation design. Learn compatibility considerations, osmolarity calculations, pH balancing, and the science behind drip protocols like the Myers' Cocktail.",
    imageUrl: "https://images.unsplash.com/photo-1559757175-7b21e0ed3a23?w=800",
    category: "Formula Analysis",
    sortOrder: 3,
    duration: "85 min",
    difficulty: "advanced" as const,
    isActive: true,
    requiresMembership: true,
    roleAccess: ["doctor", "admin"],
    isInteractive: true,
    hasQuiz: false,
  },
  {
    id: "fa-104-supplement-optimization",
    title: "Supplement Stack Optimization",
    slug: "fa-104-supplement-optimization",
    description: "Design optimized supplement protocols. Timing strategies, absorption enhancers, nutrient competition, and building condition-specific stacks for maximum therapeutic benefit.",
    imageUrl: "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800",
    category: "Formula Analysis",
    sortOrder: 4,
    duration: "75 min",
    difficulty: "intermediate" as const,
    isActive: true,
    requiresMembership: true,
    roleAccess: ["member", "doctor", "admin"],
    isInteractive: true,
    hasQuiz: false,
  },
  {
    id: "fa-105-quality-assurance",
    title: "Quality Assurance & Testing Standards",
    slug: "fa-105-quality-assurance",
    description: "Understand cGMP manufacturing, third-party testing, certificate of analysis (COA) interpretation, purity verification, and quality standards for therapeutic products.",
    imageUrl: "https://images.unsplash.com/photo-1582719471137-c3967ffb1c42?w=800",
    category: "Formula Analysis",
    sortOrder: 5,
    duration: "65 min",
    difficulty: "intermediate" as const,
    isActive: true,
    requiresMembership: true,
    roleAccess: ["member", "doctor", "admin"],
    isInteractive: true,
    hasQuiz: true,
  },
  {
    id: "fa-106-protocol-design",
    title: "Custom Protocol Design & Case Studies",
    slug: "fa-106-protocol-design",
    description: "Apply formula analysis skills to real patient scenarios. Design custom therapeutic protocols integrating IV therapy, supplements, peptides, and botanicals for complex conditions.",
    imageUrl: "https://images.unsplash.com/photo-1628595351029-c2bf17511435?w=800",
    category: "Formula Analysis",
    sortOrder: 6,
    duration: "75 min",
    difficulty: "advanced" as const,
    isActive: true,
    requiresMembership: true,
    roleAccess: ["doctor", "admin"],
    isInteractive: true,
    hasQuiz: false,
  },
];

export const formulaAnalysisQuizzes = [
  {
    id: "quiz-fa-101",
    title: "Formulation Science Principles Quiz",
    slug: "formulation-science-quiz",
    description: "Test your understanding of therapeutic formulation fundamentals.",
    difficulty: "intermediate" as const,
    passingScore: 70,
    timeLimit: 15,
    questionsCount: 5,
    isActive: true,
    requiresMembership: true,
    moduleId: "fa-101-formulation-principles",
  },
  {
    id: "quiz-fa-102",
    title: "Ingredient Synergies Quiz",
    slug: "ingredient-synergies-quiz",
    description: "Assess your knowledge of ingredient interactions and synergistic combinations.",
    difficulty: "advanced" as const,
    passingScore: 75,
    timeLimit: 15,
    questionsCount: 5,
    isActive: true,
    requiresMembership: true,
    moduleId: "fa-102-ingredient-synergies",
  },
  {
    id: "quiz-fa-105",
    title: "Quality Assurance Standards Quiz",
    slug: "quality-assurance-quiz",
    description: "Test your knowledge of manufacturing standards and quality testing.",
    difficulty: "intermediate" as const,
    passingScore: 70,
    timeLimit: 15,
    questionsCount: 5,
    isActive: true,
    requiresMembership: true,
    moduleId: "fa-105-quality-assurance",
  },
];

export const formulaAnalysisQuizQuestions = [
  {
    id: "q-fa101-1",
    quizId: "quiz-fa-101",
    questionText: "Bioavailability refers to:",
    questionType: "multiple_choice",
    explanation: "Bioavailability is the proportion of a substance that enters systemic circulation and is available for biological activity at the target site.",
    sortOrder: 1,
    points: 1,
    answers: [
      { id: "a-fa101-1a", text: "How easily a product can be purchased", isCorrect: false },
      { id: "a-fa101-1b", text: "The proportion absorbed and available for biological activity", isCorrect: true },
      { id: "a-fa101-1c", text: "The total amount of ingredients in a formula", isCorrect: false },
      { id: "a-fa101-1d", text: "How long a product stays on the shelf", isCorrect: false },
    ],
  },
  {
    id: "q-fa101-2",
    quizId: "quiz-fa-101",
    questionText: "A liposomal delivery system improves bioavailability by:",
    questionType: "multiple_choice",
    explanation: "Liposomes encapsulate active ingredients in phospholipid vesicles that protect them from degradation and enhance absorption through cell membranes.",
    sortOrder: 2,
    points: 1,
    answers: [
      { id: "a-fa101-2a", text: "Adding more of the active ingredient", isCorrect: false },
      { id: "a-fa101-2b", text: "Encapsulating ingredients in phospholipid vesicles for enhanced absorption", isCorrect: true },
      { id: "a-fa101-2c", text: "Making the product taste better", isCorrect: false },
      { id: "a-fa101-2d", text: "Removing inactive ingredients", isCorrect: false },
    ],
  },
  {
    id: "q-fa101-3",
    quizId: "quiz-fa-101",
    questionText: "When two ingredients together produce a greater effect than the sum of their individual effects, this is called:",
    questionType: "multiple_choice",
    explanation: "Synergy occurs when combined ingredients produce effects greater than the sum of their individual contributions (1+1=3).",
    sortOrder: 3,
    points: 1,
    answers: [
      { id: "a-fa101-3a", text: "Antagonism", isCorrect: false },
      { id: "a-fa101-3b", text: "Synergy", isCorrect: true },
      { id: "a-fa101-3c", text: "Additivity", isCorrect: false },
      { id: "a-fa101-3d", text: "Competition", isCorrect: false },
    ],
  },
  {
    id: "q-fa101-4",
    quizId: "quiz-fa-101",
    questionText: "The enteric coating on supplements serves to:",
    questionType: "multiple_choice",
    explanation: "Enteric coatings resist stomach acid, protecting sensitive ingredients from degradation and allowing them to dissolve in the intestines for better absorption.",
    sortOrder: 4,
    points: 1,
    answers: [
      { id: "a-fa101-4a", text: "Make pills easier to swallow", isCorrect: false },
      { id: "a-fa101-4b", text: "Protect ingredients from stomach acid for intestinal release", isCorrect: true },
      { id: "a-fa101-4c", text: "Add vitamins to the coating", isCorrect: false },
      { id: "a-fa101-4d", text: "Change the color of the supplement", isCorrect: false },
    ],
  },
  {
    id: "q-fa101-5",
    quizId: "quiz-fa-101",
    questionText: "Which delivery method provides the highest bioavailability?",
    questionType: "multiple_choice",
    explanation: "Intravenous (IV) delivery provides 100% bioavailability because it bypasses all absorption barriers, delivering nutrients directly to the bloodstream.",
    sortOrder: 5,
    points: 1,
    answers: [
      { id: "a-fa101-5a", text: "Oral capsule", isCorrect: false },
      { id: "a-fa101-5b", text: "Topical cream", isCorrect: false },
      { id: "a-fa101-5c", text: "Intravenous (IV)", isCorrect: true },
      { id: "a-fa101-5d", text: "Sublingual tablet", isCorrect: false },
    ],
  },
  {
    id: "q-fa102-1",
    quizId: "quiz-fa-102",
    questionText: "Vitamin C enhances the absorption of:",
    questionType: "multiple_choice",
    explanation: "Vitamin C (ascorbic acid) converts non-heme iron to its more absorbable ferrous form, significantly enhancing iron absorption from plant foods and supplements.",
    sortOrder: 1,
    points: 1,
    answers: [
      { id: "a-fa102-1a", text: "Calcium", isCorrect: false },
      { id: "a-fa102-1b", text: "Iron", isCorrect: true },
      { id: "a-fa102-1c", text: "Vitamin A", isCorrect: false },
      { id: "a-fa102-1d", text: "Fiber", isCorrect: false },
    ],
  },
  {
    id: "q-fa102-2",
    quizId: "quiz-fa-102",
    questionText: "Calcium and iron supplements should ideally be taken:",
    questionType: "multiple_choice",
    explanation: "Calcium and iron compete for absorption in the gut. Taking them at different times of day prevents this competition and maximizes absorption of both.",
    sortOrder: 2,
    points: 1,
    answers: [
      { id: "a-fa102-2a", text: "Together for enhanced absorption", isCorrect: false },
      { id: "a-fa102-2b", text: "At different times to avoid absorption competition", isCorrect: true },
      { id: "a-fa102-2c", text: "Only at bedtime", isCorrect: false },
      { id: "a-fa102-2d", text: "Only on an empty stomach together", isCorrect: false },
    ],
  },
  {
    id: "q-fa102-3",
    quizId: "quiz-fa-102",
    questionText: "Piperine (black pepper extract) is commonly added to turmeric formulas because it:",
    questionType: "multiple_choice",
    explanation: "Piperine inhibits glucuronidation of curcumin in the liver, increasing curcumin bioavailability by up to 2,000%.",
    sortOrder: 3,
    points: 1,
    answers: [
      { id: "a-fa102-3a", text: "Improves the taste", isCorrect: false },
      { id: "a-fa102-3b", text: "Increases curcumin bioavailability by up to 2,000%", isCorrect: true },
      { id: "a-fa102-3c", text: "Adds additional antioxidants", isCorrect: false },
      { id: "a-fa102-3d", text: "Acts as a preservative", isCorrect: false },
    ],
  },
  {
    id: "q-fa102-4",
    quizId: "quiz-fa-102",
    questionText: "Fat-soluble vitamins (A, D, E, K) are best absorbed when taken:",
    questionType: "multiple_choice",
    explanation: "Fat-soluble vitamins require dietary fat for absorption. Taking them with a meal containing fat significantly increases their bioavailability.",
    sortOrder: 4,
    points: 1,
    answers: [
      { id: "a-fa102-4a", text: "On an empty stomach with water", isCorrect: false },
      { id: "a-fa102-4b", text: "With a meal containing dietary fat", isCorrect: true },
      { id: "a-fa102-4c", text: "Before bedtime without food", isCorrect: false },
      { id: "a-fa102-4d", text: "Only in the morning", isCorrect: false },
    ],
  },
  {
    id: "q-fa102-5",
    quizId: "quiz-fa-102",
    questionText: "Zinc and copper have what type of relationship in supplementation?",
    questionType: "multiple_choice",
    explanation: "High-dose zinc supplementation can deplete copper levels because zinc induces metallothionein, which binds copper and prevents its absorption.",
    sortOrder: 5,
    points: 1,
    answers: [
      { id: "a-fa102-5a", text: "Synergistic — they enhance each other", isCorrect: false },
      { id: "a-fa102-5b", text: "Antagonistic — high zinc can deplete copper", isCorrect: true },
      { id: "a-fa102-5c", text: "No interaction at all", isCorrect: false },
      { id: "a-fa102-5d", text: "They must always be taken together", isCorrect: false },
    ],
  },
  {
    id: "q-fa105-1",
    quizId: "quiz-fa-105",
    questionText: "What does cGMP stand for in manufacturing?",
    questionType: "multiple_choice",
    explanation: "cGMP stands for Current Good Manufacturing Practice — FDA-regulated standards ensuring products are consistently produced and controlled for quality.",
    sortOrder: 1,
    points: 1,
    answers: [
      { id: "a-fa105-1a", text: "Certified Generic Medicine Production", isCorrect: false },
      { id: "a-fa105-1b", text: "Current Good Manufacturing Practice", isCorrect: true },
      { id: "a-fa105-1c", text: "Complete General Manufacturing Protocol", isCorrect: false },
      { id: "a-fa105-1d", text: "Clinical Grade Medical Products", isCorrect: false },
    ],
  },
  {
    id: "q-fa105-2",
    quizId: "quiz-fa-105",
    questionText: "A Certificate of Analysis (COA) should include:",
    questionType: "multiple_choice",
    explanation: "A proper COA includes identity confirmation, potency assay, purity testing, contaminant screening, and the testing laboratory's certification.",
    sortOrder: 2,
    points: 1,
    answers: [
      { id: "a-fa105-2a", text: "Only the product name and batch number", isCorrect: false },
      { id: "a-fa105-2b", text: "Identity, potency, purity, and contaminant testing results", isCorrect: true },
      { id: "a-fa105-2c", text: "Marketing claims and benefits", isCorrect: false },
      { id: "a-fa105-2d", text: "Ingredient costs and profit margins", isCorrect: false },
    ],
  },
  {
    id: "q-fa105-3",
    quizId: "quiz-fa-105",
    questionText: "Third-party testing is important because it:",
    questionType: "multiple_choice",
    explanation: "Third-party testing provides independent, unbiased verification of product quality, identity, and purity — free from the manufacturer's potential conflicts of interest.",
    sortOrder: 3,
    points: 1,
    answers: [
      { id: "a-fa105-3a", text: "Is required by all countries", isCorrect: false },
      { id: "a-fa105-3b", text: "Provides independent verification free from manufacturer bias", isCorrect: true },
      { id: "a-fa105-3c", text: "Makes products cheaper to produce", isCorrect: false },
      { id: "a-fa105-3d", text: "Is only needed for prescription drugs", isCorrect: false },
    ],
  },
  {
    id: "q-fa105-4",
    quizId: "quiz-fa-105",
    questionText: "What is the minimum purity standard for therapeutic-grade peptides?",
    questionType: "multiple_choice",
    explanation: "Therapeutic-grade peptides should have a minimum purity of 98% as verified by HPLC analysis, ensuring minimal degradation products and contaminants.",
    sortOrder: 4,
    points: 1,
    answers: [
      { id: "a-fa105-4a", text: "80%", isCorrect: false },
      { id: "a-fa105-4b", text: "90%", isCorrect: false },
      { id: "a-fa105-4c", text: "98%", isCorrect: true },
      { id: "a-fa105-4d", text: "100% — no impurities allowed", isCorrect: false },
    ],
  },
  {
    id: "q-fa105-5",
    quizId: "quiz-fa-105",
    questionText: "Heavy metal testing in supplements should check for:",
    questionType: "multiple_choice",
    explanation: "Standard heavy metal panels test for lead, mercury, arsenic, and cadmium — the four most common and dangerous heavy metal contaminants in supplements.",
    sortOrder: 5,
    points: 1,
    answers: [
      { id: "a-fa105-5a", text: "Only lead", isCorrect: false },
      { id: "a-fa105-5b", text: "Lead, mercury, arsenic, and cadmium", isCorrect: true },
      { id: "a-fa105-5c", text: "Iron and zinc levels", isCorrect: false },
      { id: "a-fa105-5d", text: "Gold and silver content", isCorrect: false },
    ],
  },
];

export async function seedFormulaAnalysisTraining() {
  console.log("[Formula Analysis Seed] Starting formula analysis training seed...");

  try {
    await db.insert(trainingTracks).values(formulaAnalysisTrack).onConflictDoNothing();
    console.log("[Formula Analysis Seed] Upserted formula analysis track");

    for (const module of formulaAnalysisModules) {
      await db.insert(trainingModules).values(module).onConflictDoNothing();
      console.log(`[Formula Analysis Seed] Upserted module: ${module.title}`);
    }

    const trackModuleLinks = formulaAnalysisModules.map((m, i) => ({
      id: `tm-${formulaAnalysisTrack.id}-${m.id}`,
      trackId: formulaAnalysisTrack.id,
      moduleId: m.id,
      sortOrder: i + 1,
      isRequired: true,
    }));

    for (const link of trackModuleLinks) {
      await db.insert(trackModules).values(link).onConflictDoNothing();
    }
    console.log(`[Formula Analysis Seed] Linked ${trackModuleLinks.length} modules to track`);

    for (const quiz of formulaAnalysisQuizzes) {
      const { moduleId, trackId, ...quizData } = quiz;
      await db.insert(quizzes).values(quizData).onConflictDoNothing();

      if (moduleId) {
        await db.insert(moduleQuizzes).values({
          id: `mq-${moduleId}-${quiz.id}`,
          moduleId,
          quizId: quiz.id,
          sortOrder: 1,
          isRequired: true,
        }).onConflictDoNothing();
      }
    }
    console.log(`[Formula Analysis Seed] Inserted ${formulaAnalysisQuizzes.length} quizzes`);

    for (const question of formulaAnalysisQuizQuestions) {
      const { answers, ...questionData } = question;
      await db.insert(quizQuestions).values(questionData).onConflictDoNothing();

      for (const answer of answers) {
        await db.insert(quizAnswers).values({
          id: answer.id,
          questionId: question.id,
          answerText: answer.text,
          isCorrect: answer.isCorrect,
          sortOrder: answers.indexOf(answer) + 1,
        }).onConflictDoNothing();
      }
    }
    console.log(`[Formula Analysis Seed] Inserted ${formulaAnalysisQuizQuestions.length} questions with answers`);

    console.log("[Formula Analysis Seed] Completed successfully!");
    return {
      success: true,
      modules: formulaAnalysisModules.length,
      quizzes: formulaAnalysisQuizzes.length,
      questions: formulaAnalysisQuizQuestions.length,
      message: `Seeded ${formulaAnalysisModules.length} formula analysis modules with ${formulaAnalysisQuizzes.length} quizzes`,
    };
  } catch (error: any) {
    console.error("[Formula Analysis Seed] Error:", error);
    throw error;
  }
}
