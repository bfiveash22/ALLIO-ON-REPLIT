import { db } from "../db";
import { trainingTracks, trainingModules, trackModules, quizzes, quizQuestions, quizAnswers, moduleQuizzes } from "@shared/schema";

export const ancientMedicineTrack = {
  id: "track-ancient-medicine",
  title: "Ancient Medicine Integration",
  slug: "ancient-medicine-integration",
  description: "Explore the wisdom of ancient healing traditions and learn how to integrate time-tested remedies with modern clinical practice. Guided by HIPPOCRATES agent insights.",
  imageUrl: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800",
  totalModules: 6,
  estimatedDuration: "7 hours",
  difficulty: "intermediate" as const,
  isActive: true,
  requiresMembership: true,
  roleAccess: ["member", "doctor", "admin"],
};

export const ancientMedicineModules = [
  {
    id: "ancient-101-hippocratic-foundations",
    title: "Hippocratic Foundations of Healing",
    slug: "ancient-101-hippocratic-foundations",
    description: "Discover the foundational principles of Hippocratic medicine — 'Let food be thy medicine' — and how ancient Greek healing philosophy maps to modern integrative practice.",
    imageUrl: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800",
    category: "Ancient Medicine",
    sortOrder: 1,
    duration: "60 min",
    difficulty: "beginner" as const,
    isActive: true,
    requiresMembership: true,
    roleAccess: ["member", "doctor", "admin"],
    isInteractive: true,
    hasQuiz: true,
  },
  {
    id: "ancient-102-ayurvedic-principles",
    title: "Ayurvedic Principles & Dosha Theory",
    slug: "ancient-102-ayurvedic-principles",
    description: "Learn the 5,000-year-old Ayurvedic system of constitutional medicine. Understand Vata, Pitta, and Kapha doshas and their role in personalized healing protocols.",
    imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800",
    category: "Ancient Medicine",
    sortOrder: 2,
    duration: "75 min",
    difficulty: "intermediate" as const,
    isActive: true,
    requiresMembership: true,
    roleAccess: ["member", "doctor", "admin"],
    isInteractive: true,
    hasQuiz: true,
  },
  {
    id: "ancient-103-tcm-meridians",
    title: "Traditional Chinese Medicine & Meridian Theory",
    slug: "ancient-103-tcm-meridians",
    description: "Explore TCM fundamentals including Qi, Yin-Yang balance, the Five Elements, and meridian theory. Understand how acupuncture and herbal formulas restore energetic balance.",
    imageUrl: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=800",
    category: "Ancient Medicine",
    sortOrder: 3,
    duration: "80 min",
    difficulty: "intermediate" as const,
    isActive: true,
    requiresMembership: true,
    roleAccess: ["member", "doctor", "admin"],
    isInteractive: true,
    hasQuiz: true,
  },
  {
    id: "ancient-104-herbal-pharmacognosy",
    title: "Herbal Pharmacognosy & Materia Medica",
    slug: "ancient-104-herbal-pharmacognosy",
    description: "Study the pharmacological basis of traditional herbs. Learn how ancient remedies like turmeric, ashwagandha, and astragalus work at the molecular level.",
    imageUrl: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800",
    category: "Ancient Medicine",
    sortOrder: 4,
    duration: "70 min",
    difficulty: "intermediate" as const,
    isActive: true,
    requiresMembership: true,
    roleAccess: ["member", "doctor", "admin"],
    isInteractive: true,
    hasQuiz: false,
  },
  {
    id: "ancient-105-detox-fasting",
    title: "Ancient Detoxification & Fasting Protocols",
    slug: "ancient-105-detox-fasting",
    description: "Examine historical detoxification practices — from Hippocratic fasting to Ayurvedic Panchakarma — and their validated modern equivalents for clinical application.",
    imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800",
    category: "Ancient Medicine",
    sortOrder: 5,
    duration: "65 min",
    difficulty: "advanced" as const,
    isActive: true,
    requiresMembership: true,
    roleAccess: ["doctor", "admin"],
    isInteractive: true,
    hasQuiz: false,
  },
  {
    id: "ancient-106-integration-protocols",
    title: "Integrating Ancient & Modern Protocols",
    slug: "ancient-106-integration-protocols",
    description: "Advanced module on combining ancient healing modalities with modern peptide therapy, IV nutrition, and functional medicine for comprehensive patient care.",
    imageUrl: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800",
    category: "Ancient Medicine",
    sortOrder: 6,
    duration: "70 min",
    difficulty: "advanced" as const,
    isActive: true,
    requiresMembership: true,
    roleAccess: ["doctor", "admin"],
    isInteractive: true,
    hasQuiz: false,
  },
];

export const ancientMedicineQuizzes = [
  {
    id: "quiz-ancient-101",
    title: "Hippocratic Foundations Quiz",
    slug: "hippocratic-foundations-quiz",
    description: "Test your understanding of Hippocratic medicine principles and their modern applications.",
    difficulty: "beginner" as const,
    passingScore: 70,
    timeLimit: 15,
    questionsCount: 5,
    isActive: true,
    requiresMembership: true,
    moduleId: "ancient-101-hippocratic-foundations",
  },
  {
    id: "quiz-ancient-102",
    title: "Ayurvedic Principles Quiz",
    slug: "ayurvedic-principles-quiz",
    description: "Assess your knowledge of Ayurvedic constitutional medicine and dosha theory.",
    difficulty: "intermediate" as const,
    passingScore: 70,
    timeLimit: 15,
    questionsCount: 5,
    isActive: true,
    requiresMembership: true,
    moduleId: "ancient-102-ayurvedic-principles",
  },
  {
    id: "quiz-ancient-103",
    title: "TCM & Meridian Theory Quiz",
    slug: "tcm-meridian-theory-quiz",
    description: "Test your grasp of Traditional Chinese Medicine fundamentals.",
    difficulty: "intermediate" as const,
    passingScore: 70,
    timeLimit: 15,
    questionsCount: 5,
    isActive: true,
    requiresMembership: true,
    moduleId: "ancient-103-tcm-meridians",
  },
];

export const ancientMedicineQuizQuestions = [
  {
    id: "q-anc101-1",
    quizId: "quiz-ancient-101",
    questionText: "What is the central Hippocratic principle regarding food and medicine?",
    questionType: "multiple_choice",
    explanation: "Hippocrates famously stated 'Let food be thy medicine and medicine be thy food,' emphasizing nutrition as the foundation of health.",
    sortOrder: 1,
    points: 1,
    answers: [
      { id: "a-anc101-1a", text: "Surgery is the only true medicine", isCorrect: false },
      { id: "a-anc101-1b", text: "Let food be thy medicine and medicine be thy food", isCorrect: true },
      { id: "a-anc101-1c", text: "Pharmaceuticals cure all disease", isCorrect: false },
      { id: "a-anc101-1d", text: "The body cannot heal itself", isCorrect: false },
    ],
  },
  {
    id: "q-anc101-2",
    quizId: "quiz-ancient-101",
    questionText: "What does the Hippocratic concept of 'Vis Medicatrix Naturae' mean?",
    questionType: "multiple_choice",
    explanation: "Vis Medicatrix Naturae means 'the healing power of nature' — the body's innate ability to heal itself when given proper support.",
    sortOrder: 2,
    points: 1,
    answers: [
      { id: "a-anc101-2a", text: "Nature is dangerous to health", isCorrect: false },
      { id: "a-anc101-2b", text: "The healing power of nature", isCorrect: true },
      { id: "a-anc101-2c", text: "Medicine from plants only", isCorrect: false },
      { id: "a-anc101-2d", text: "Natural selection in medicine", isCorrect: false },
    ],
  },
  {
    id: "q-anc101-3",
    quizId: "quiz-ancient-101",
    questionText: "Which principle is the foundation of Hippocratic ethics?",
    questionType: "multiple_choice",
    explanation: "Primum non nocere — 'First, do no harm' — is the foundational ethical principle attributed to Hippocratic medicine.",
    sortOrder: 3,
    points: 1,
    answers: [
      { id: "a-anc101-3a", text: "First, do no harm", isCorrect: true },
      { id: "a-anc101-3b", text: "Profit above all else", isCorrect: false },
      { id: "a-anc101-3c", text: "Trust only technology", isCorrect: false },
      { id: "a-anc101-3d", text: "Treat symptoms immediately", isCorrect: false },
    ],
  },
  {
    id: "q-anc101-4",
    quizId: "quiz-ancient-101",
    questionText: "Hippocratic medicine emphasized treating the patient as a:",
    questionType: "multiple_choice",
    explanation: "Hippocratic medicine viewed the patient as a whole person — mind, body, and environment — not just a collection of symptoms.",
    sortOrder: 4,
    points: 1,
    answers: [
      { id: "a-anc101-4a", text: "Collection of organs", isCorrect: false },
      { id: "a-anc101-4b", text: "Whole person — mind, body, and environment", isCorrect: true },
      { id: "a-anc101-4c", text: "Set of lab values", isCorrect: false },
      { id: "a-anc101-4d", text: "Diagnosis code", isCorrect: false },
    ],
  },
  {
    id: "q-anc101-5",
    quizId: "quiz-ancient-101",
    questionText: "The Hippocratic 'Four Humors' theory included all EXCEPT:",
    questionType: "multiple_choice",
    explanation: "The four humors were blood, phlegm, yellow bile, and black bile. Lymph was not part of the classical humoral theory.",
    sortOrder: 5,
    points: 1,
    answers: [
      { id: "a-anc101-5a", text: "Blood", isCorrect: false },
      { id: "a-anc101-5b", text: "Phlegm", isCorrect: false },
      { id: "a-anc101-5c", text: "Lymph", isCorrect: true },
      { id: "a-anc101-5d", text: "Black bile", isCorrect: false },
    ],
  },
  {
    id: "q-anc102-1",
    quizId: "quiz-ancient-102",
    questionText: "How many primary doshas exist in Ayurvedic medicine?",
    questionType: "multiple_choice",
    explanation: "Ayurveda identifies three primary doshas: Vata (air/space), Pitta (fire/water), and Kapha (earth/water).",
    sortOrder: 1,
    points: 1,
    answers: [
      { id: "a-anc102-1a", text: "Two", isCorrect: false },
      { id: "a-anc102-1b", text: "Three", isCorrect: true },
      { id: "a-anc102-1c", text: "Five", isCorrect: false },
      { id: "a-anc102-1d", text: "Seven", isCorrect: false },
    ],
  },
  {
    id: "q-anc102-2",
    quizId: "quiz-ancient-102",
    questionText: "Which dosha is associated with the elements of fire and water?",
    questionType: "multiple_choice",
    explanation: "Pitta dosha governs transformation and metabolism, associated with fire and water elements.",
    sortOrder: 2,
    points: 1,
    answers: [
      { id: "a-anc102-2a", text: "Vata", isCorrect: false },
      { id: "a-anc102-2b", text: "Pitta", isCorrect: true },
      { id: "a-anc102-2c", text: "Kapha", isCorrect: false },
      { id: "a-anc102-2d", text: "Ojas", isCorrect: false },
    ],
  },
  {
    id: "q-anc102-3",
    quizId: "quiz-ancient-102",
    questionText: "Approximately how old is the Ayurvedic healing system?",
    questionType: "multiple_choice",
    explanation: "Ayurveda is one of the oldest healing systems in the world, dating back approximately 5,000 years to ancient India.",
    sortOrder: 3,
    points: 1,
    answers: [
      { id: "a-anc102-3a", text: "500 years", isCorrect: false },
      { id: "a-anc102-3b", text: "1,000 years", isCorrect: false },
      { id: "a-anc102-3c", text: "5,000 years", isCorrect: true },
      { id: "a-anc102-3d", text: "10,000 years", isCorrect: false },
    ],
  },
  {
    id: "q-anc102-4",
    quizId: "quiz-ancient-102",
    questionText: "What does 'Ayurveda' translate to?",
    questionType: "multiple_choice",
    explanation: "Ayurveda comes from Sanskrit: 'Ayur' (life) and 'Veda' (knowledge/science), meaning 'The Science of Life.'",
    sortOrder: 4,
    points: 1,
    answers: [
      { id: "a-anc102-4a", text: "The Science of Life", isCorrect: true },
      { id: "a-anc102-4b", text: "The Art of Healing", isCorrect: false },
      { id: "a-anc102-4c", text: "Ancient Medicine", isCorrect: false },
      { id: "a-anc102-4d", text: "Natural Remedies", isCorrect: false },
    ],
  },
  {
    id: "q-anc102-5",
    quizId: "quiz-ancient-102",
    questionText: "The Ayurvedic detoxification process is called:",
    questionType: "multiple_choice",
    explanation: "Panchakarma is the Ayurvedic system of five purification therapies used for deep detoxification and rejuvenation.",
    sortOrder: 5,
    points: 1,
    answers: [
      { id: "a-anc102-5a", text: "Pranayama", isCorrect: false },
      { id: "a-anc102-5b", text: "Panchakarma", isCorrect: true },
      { id: "a-anc102-5c", text: "Dhyana", isCorrect: false },
      { id: "a-anc102-5d", text: "Abhyanga", isCorrect: false },
    ],
  },
  {
    id: "q-anc103-1",
    quizId: "quiz-ancient-103",
    questionText: "What is 'Qi' in Traditional Chinese Medicine?",
    questionType: "multiple_choice",
    explanation: "Qi (Chi) is the vital life force or energy that flows through the body along meridian pathways, sustaining all biological functions.",
    sortOrder: 1,
    points: 1,
    answers: [
      { id: "a-anc103-1a", text: "A type of herbal remedy", isCorrect: false },
      { id: "a-anc103-1b", text: "Vital life force or energy", isCorrect: true },
      { id: "a-anc103-1c", text: "A diagnostic tool", isCorrect: false },
      { id: "a-anc103-1d", text: "A form of exercise", isCorrect: false },
    ],
  },
  {
    id: "q-anc103-2",
    quizId: "quiz-ancient-103",
    questionText: "How many primary meridians exist in TCM?",
    questionType: "multiple_choice",
    explanation: "TCM identifies 12 primary meridians (channels) through which Qi flows, each associated with a major organ system.",
    sortOrder: 2,
    points: 1,
    answers: [
      { id: "a-anc103-2a", text: "7", isCorrect: false },
      { id: "a-anc103-2b", text: "12", isCorrect: true },
      { id: "a-anc103-2c", text: "20", isCorrect: false },
      { id: "a-anc103-2d", text: "36", isCorrect: false },
    ],
  },
  {
    id: "q-anc103-3",
    quizId: "quiz-ancient-103",
    questionText: "The Five Elements in TCM include all EXCEPT:",
    questionType: "multiple_choice",
    explanation: "The Five Elements (Wu Xing) are Wood, Fire, Earth, Metal, and Water. Air is not one of the TCM Five Elements.",
    sortOrder: 3,
    points: 1,
    answers: [
      { id: "a-anc103-3a", text: "Wood", isCorrect: false },
      { id: "a-anc103-3b", text: "Metal", isCorrect: false },
      { id: "a-anc103-3c", text: "Air", isCorrect: true },
      { id: "a-anc103-3d", text: "Fire", isCorrect: false },
    ],
  },
  {
    id: "q-anc103-4",
    quizId: "quiz-ancient-103",
    questionText: "Yin and Yang represent:",
    questionType: "multiple_choice",
    explanation: "Yin and Yang represent complementary, interdependent opposites that must be in balance for optimal health.",
    sortOrder: 4,
    points: 1,
    answers: [
      { id: "a-anc103-4a", text: "Good and evil forces", isCorrect: false },
      { id: "a-anc103-4b", text: "Complementary opposites in balance", isCorrect: true },
      { id: "a-anc103-4c", text: "Hot and cold temperatures", isCorrect: false },
      { id: "a-anc103-4d", text: "Male and female organs", isCorrect: false },
    ],
  },
  {
    id: "q-anc103-5",
    quizId: "quiz-ancient-103",
    questionText: "Acupuncture works primarily by:",
    questionType: "multiple_choice",
    explanation: "Acupuncture restores the flow of Qi through meridians by stimulating specific points, removing blockages and restoring balance.",
    sortOrder: 5,
    points: 1,
    answers: [
      { id: "a-anc103-5a", text: "Injecting herbal compounds", isCorrect: false },
      { id: "a-anc103-5b", text: "Stimulating meridian points to restore Qi flow", isCorrect: true },
      { id: "a-anc103-5c", text: "Releasing endorphins only", isCorrect: false },
      { id: "a-anc103-5d", text: "Cutting off nerve signals", isCorrect: false },
    ],
  },
];

export async function seedAncientMedicineTraining() {
  console.log("[Ancient Medicine Seed] Starting ancient medicine training seed...");

  try {
    await db.insert(trainingTracks).values(ancientMedicineTrack).onConflictDoNothing();
    console.log("[Ancient Medicine Seed] Upserted ancient medicine track");

    for (const module of ancientMedicineModules) {
      await db.insert(trainingModules).values(module).onConflictDoNothing();
      console.log(`[Ancient Medicine Seed] Upserted module: ${module.title}`);
    }

    const trackModuleLinks = ancientMedicineModules.map((m, i) => ({
      id: `tm-${ancientMedicineTrack.id}-${m.id}`,
      trackId: ancientMedicineTrack.id,
      moduleId: m.id,
      sortOrder: i + 1,
      isRequired: true,
    }));

    for (const link of trackModuleLinks) {
      await db.insert(trackModules).values(link).onConflictDoNothing();
    }
    console.log(`[Ancient Medicine Seed] Linked ${trackModuleLinks.length} modules to track`);

    for (const quiz of ancientMedicineQuizzes) {
      const { moduleId, trackId, ...quizData } = quiz as typeof quiz & { trackId?: string };
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
    console.log(`[Ancient Medicine Seed] Inserted ${ancientMedicineQuizzes.length} quizzes`);

    for (const question of ancientMedicineQuizQuestions) {
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
    console.log(`[Ancient Medicine Seed] Inserted ${ancientMedicineQuizQuestions.length} questions with answers`);

    console.log("[Ancient Medicine Seed] Completed successfully!");
    return {
      success: true,
      modules: ancientMedicineModules.length,
      quizzes: ancientMedicineQuizzes.length,
      questions: ancientMedicineQuizQuestions.length,
      message: `Seeded ${ancientMedicineModules.length} ancient medicine training modules with ${ancientMedicineQuizzes.length} quizzes`,
    };
  } catch (error: any) {
    console.error("[Ancient Medicine Seed] Error:", error);
    throw error;
  }
}
