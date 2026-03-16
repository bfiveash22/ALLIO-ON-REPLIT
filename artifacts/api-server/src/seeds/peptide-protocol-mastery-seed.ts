import { db } from "../db";
import { trainingTracks, trainingModules, trackModules, quizzes, quizQuestions, quizAnswers, moduleQuizzes } from "@shared/schema";

export const peptideProtocolTrack = {
  id: "track-peptide-protocol-mastery",
  title: "Peptide Protocol Mastery",
  slug: "peptide-protocol-mastery",
  description: "Advanced clinical training in peptide therapeutics. Master dosing protocols, reconstitution, cycling strategies, and patient management. Guided by PARACELSUS agent expertise.",
  imageUrl: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800",
  totalModules: 6,
  estimatedDuration: "8 hours",
  difficulty: "advanced" as const,
  isActive: true,
  requiresMembership: true,
  roleAccess: ["doctor", "admin"],
};

export const peptideProtocolModules = [
  {
    id: "ppm-101-pharmacokinetics",
    title: "Peptide Pharmacokinetics & Pharmacodynamics",
    slug: "ppm-101-pharmacokinetics",
    description: "Understand how therapeutic peptides are absorbed, distributed, metabolized, and eliminated. Learn half-lives, bioavailability, and factors affecting peptide efficacy.",
    imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800",
    category: "Peptide Protocol Mastery",
    sortOrder: 1,
    duration: "75 min",
    difficulty: "advanced" as const,
    isActive: true,
    requiresMembership: true,
    roleAccess: ["doctor", "admin"],
    isInteractive: true,
    hasQuiz: true,
  },
  {
    id: "ppm-102-reconstitution-handling",
    title: "Reconstitution, Storage & Handling",
    slug: "ppm-102-reconstitution-handling",
    description: "Master the proper techniques for reconstituting lyophilized peptides, cold chain storage requirements, sterile handling procedures, and stability considerations.",
    imageUrl: "https://images.unsplash.com/photo-1559757175-7b21e0ed3a23?w=800",
    category: "Peptide Protocol Mastery",
    sortOrder: 2,
    duration: "60 min",
    difficulty: "intermediate" as const,
    isActive: true,
    requiresMembership: true,
    roleAccess: ["doctor", "admin"],
    isInteractive: true,
    hasQuiz: false,
  },
  {
    id: "ppm-103-healing-peptides",
    title: "Healing Peptide Protocols: BPC-157, TB-500 & KPV",
    slug: "ppm-103-healing-peptides",
    description: "Clinical protocols for tissue-healing peptides. Dosing strategies, injection sites, cycling schedules, and combination approaches for accelerated recovery.",
    imageUrl: "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800",
    category: "Peptide Protocol Mastery",
    sortOrder: 3,
    duration: "90 min",
    difficulty: "advanced" as const,
    isActive: true,
    requiresMembership: true,
    roleAccess: ["doctor", "admin"],
    isInteractive: true,
    hasQuiz: true,
  },
  {
    id: "ppm-104-immune-longevity",
    title: "Immune & Longevity Peptides: Thymosin, Epithalon & GHK-Cu",
    slug: "ppm-104-immune-longevity",
    description: "Protocols for immune-modulating and anti-aging peptides. Thymosin Alpha-1 for immunity, Epithalon for telomere support, and GHK-Cu for tissue regeneration.",
    imageUrl: "https://images.unsplash.com/photo-1582719471137-c3967ffb1c42?w=800",
    category: "Peptide Protocol Mastery",
    sortOrder: 4,
    duration: "80 min",
    difficulty: "advanced" as const,
    isActive: true,
    requiresMembership: true,
    roleAccess: ["doctor", "admin"],
    isInteractive: true,
    hasQuiz: false,
  },
  {
    id: "ppm-105-metabolic-peptides",
    title: "Metabolic Peptides: GLP-1 Agonists & Growth Hormone Secretagogues",
    slug: "ppm-105-metabolic-peptides",
    description: "Advanced protocols for semaglutide, tirzepatide, and GH secretagogues (Ipamorelin, CJC-1295, Tesamorelin). Titration schedules and metabolic optimization.",
    imageUrl: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800",
    category: "Peptide Protocol Mastery",
    sortOrder: 5,
    duration: "85 min",
    difficulty: "advanced" as const,
    isActive: true,
    requiresMembership: true,
    roleAccess: ["doctor", "admin"],
    isInteractive: true,
    hasQuiz: true,
  },
  {
    id: "ppm-106-patient-management",
    title: "Patient Management & Protocol Design",
    slug: "ppm-106-patient-management",
    description: "Design comprehensive peptide treatment plans. Patient assessment, protocol selection, monitoring schedules, adjustments, and managing side effects in clinical practice.",
    imageUrl: "https://images.unsplash.com/photo-1628595351029-c2bf17511435?w=800",
    category: "Peptide Protocol Mastery",
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

export const peptideProtocolQuizzes = [
  {
    id: "quiz-ppm-101",
    title: "Peptide Pharmacokinetics Quiz",
    slug: "peptide-pharmacokinetics-quiz",
    description: "Test your understanding of peptide absorption, distribution, metabolism, and elimination.",
    difficulty: "advanced" as const,
    passingScore: 75,
    timeLimit: 15,
    questionsCount: 5,
    isActive: true,
    requiresMembership: true,
    moduleId: "ppm-101-pharmacokinetics",
  },
  {
    id: "quiz-ppm-103",
    title: "Healing Peptide Protocols Quiz",
    slug: "healing-peptide-protocols-quiz",
    description: "Assess your knowledge of BPC-157, TB-500, and KPV dosing and clinical application.",
    difficulty: "advanced" as const,
    passingScore: 75,
    timeLimit: 15,
    questionsCount: 5,
    isActive: true,
    requiresMembership: true,
    moduleId: "ppm-103-healing-peptides",
  },
  {
    id: "quiz-ppm-105",
    title: "Metabolic Peptides Quiz",
    slug: "metabolic-peptides-quiz",
    description: "Test your expertise in GLP-1 agonist and growth hormone secretagogue protocols.",
    difficulty: "advanced" as const,
    passingScore: 75,
    timeLimit: 15,
    questionsCount: 5,
    isActive: true,
    requiresMembership: true,
    moduleId: "ppm-105-metabolic-peptides",
  },
];

export const peptideProtocolQuizQuestions = [
  {
    id: "q-ppm101-1",
    quizId: "quiz-ppm-101",
    questionText: "Why are most therapeutic peptides administered via injection rather than orally?",
    questionType: "multiple_choice",
    explanation: "Peptides are rapidly degraded by digestive enzymes and have poor oral bioavailability due to their amino acid structure.",
    sortOrder: 1,
    points: 1,
    answers: [
      { id: "a-ppm101-1a", text: "Injections work faster than any oral method", isCorrect: false },
      { id: "a-ppm101-1b", text: "Digestive enzymes break down peptides before absorption", isCorrect: true },
      { id: "a-ppm101-1c", text: "Oral peptides cause allergic reactions", isCorrect: false },
      { id: "a-ppm101-1d", text: "Peptides taste too bitter for oral use", isCorrect: false },
    ],
  },
  {
    id: "q-ppm101-2",
    quizId: "quiz-ppm-101",
    questionText: "What does 'half-life' refer to in peptide pharmacokinetics?",
    questionType: "multiple_choice",
    explanation: "Half-life is the time required for the concentration of a peptide in the body to reduce by 50%, which determines dosing frequency.",
    sortOrder: 2,
    points: 1,
    answers: [
      { id: "a-ppm101-2a", text: "How long the peptide stays in the vial", isCorrect: false },
      { id: "a-ppm101-2b", text: "Time for concentration to reduce by 50%", isCorrect: true },
      { id: "a-ppm101-2c", text: "The shelf life of the reconstituted peptide", isCorrect: false },
      { id: "a-ppm101-2d", text: "How long until the peptide expires", isCorrect: false },
    ],
  },
  {
    id: "q-ppm101-3",
    quizId: "quiz-ppm-101",
    questionText: "Subcutaneous injection sites are preferred for peptides because they:",
    questionType: "multiple_choice",
    explanation: "Subcutaneous tissue provides slow, steady absorption, resulting in more consistent blood levels compared to intramuscular or intravenous routes.",
    sortOrder: 3,
    points: 1,
    answers: [
      { id: "a-ppm101-3a", text: "Are less painful than all alternatives", isCorrect: false },
      { id: "a-ppm101-3b", text: "Provide slow, steady absorption for consistent levels", isCorrect: true },
      { id: "a-ppm101-3c", text: "Require no sterile technique", isCorrect: false },
      { id: "a-ppm101-3d", text: "Work only for large peptides", isCorrect: false },
    ],
  },
  {
    id: "q-ppm101-4",
    quizId: "quiz-ppm-101",
    questionText: "Peptide bioavailability refers to:",
    questionType: "multiple_choice",
    explanation: "Bioavailability is the fraction of administered peptide that reaches systemic circulation in active form.",
    sortOrder: 4,
    points: 1,
    answers: [
      { id: "a-ppm101-4a", text: "How easy it is to purchase the peptide", isCorrect: false },
      { id: "a-ppm101-4b", text: "The fraction that reaches systemic circulation in active form", isCorrect: true },
      { id: "a-ppm101-4c", text: "The total amount of peptide in the vial", isCorrect: false },
      { id: "a-ppm101-4d", text: "How long the peptide remains biologically active in storage", isCorrect: false },
    ],
  },
  {
    id: "q-ppm101-5",
    quizId: "quiz-ppm-101",
    questionText: "Which factor does NOT typically affect peptide pharmacokinetics?",
    questionType: "multiple_choice",
    explanation: "Hair color has no effect on peptide absorption, distribution, or metabolism. Body composition, injection site, and hydration status do affect pharmacokinetics.",
    sortOrder: 5,
    points: 1,
    answers: [
      { id: "a-ppm101-5a", text: "Body composition and fat distribution", isCorrect: false },
      { id: "a-ppm101-5b", text: "Injection site selection", isCorrect: false },
      { id: "a-ppm101-5c", text: "Hair color", isCorrect: true },
      { id: "a-ppm101-5d", text: "Hydration status", isCorrect: false },
    ],
  },
  {
    id: "q-ppm103-1",
    quizId: "quiz-ppm-103",
    questionText: "What is the standard dosing range for BPC-157?",
    questionType: "multiple_choice",
    explanation: "BPC-157 is typically dosed at 250-500 mcg per injection, administered once or twice daily.",
    sortOrder: 1,
    points: 1,
    answers: [
      { id: "a-ppm103-1a", text: "10-25 mcg daily", isCorrect: false },
      { id: "a-ppm103-1b", text: "250-500 mcg once or twice daily", isCorrect: true },
      { id: "a-ppm103-1c", text: "1-5 mg weekly", isCorrect: false },
      { id: "a-ppm103-1d", text: "50-100 mg monthly", isCorrect: false },
    ],
  },
  {
    id: "q-ppm103-2",
    quizId: "quiz-ppm-103",
    questionText: "TB-500 is best known for its ability to:",
    questionType: "multiple_choice",
    explanation: "TB-500 (Thymosin Beta-4) promotes tissue repair by upregulating actin, supporting cell migration, and reducing inflammation in damaged tissues.",
    sortOrder: 2,
    points: 1,
    answers: [
      { id: "a-ppm103-2a", text: "Suppress appetite for weight loss", isCorrect: false },
      { id: "a-ppm103-2b", text: "Promote tissue repair and reduce inflammation", isCorrect: true },
      { id: "a-ppm103-2c", text: "Increase testosterone levels", isCorrect: false },
      { id: "a-ppm103-2d", text: "Improve visual acuity", isCorrect: false },
    ],
  },
  {
    id: "q-ppm103-3",
    quizId: "quiz-ppm-103",
    questionText: "When stacking BPC-157 and TB-500, a common approach is to:",
    questionType: "multiple_choice",
    explanation: "BPC-157 and TB-500 are commonly stacked by injecting near the injury site, as their complementary mechanisms enhance overall tissue healing.",
    sortOrder: 3,
    points: 1,
    answers: [
      { id: "a-ppm103-3a", text: "Never combine them due to interaction risk", isCorrect: false },
      { id: "a-ppm103-3b", text: "Inject both near the injury site for synergistic healing", isCorrect: true },
      { id: "a-ppm103-3c", text: "Take them orally together on an empty stomach", isCorrect: false },
      { id: "a-ppm103-3d", text: "Alternate months between each peptide", isCorrect: false },
    ],
  },
  {
    id: "q-ppm103-4",
    quizId: "quiz-ppm-103",
    questionText: "Typical BPC-157 cycle length for soft tissue injuries is:",
    questionType: "multiple_choice",
    explanation: "BPC-157 is typically cycled for 4-12 weeks for soft tissue injuries, with duration depending on injury severity and healing response.",
    sortOrder: 4,
    points: 1,
    answers: [
      { id: "a-ppm103-4a", text: "1-3 days", isCorrect: false },
      { id: "a-ppm103-4b", text: "4-12 weeks", isCorrect: true },
      { id: "a-ppm103-4c", text: "6-12 months", isCorrect: false },
      { id: "a-ppm103-4d", text: "Indefinitely without breaks", isCorrect: false },
    ],
  },
  {
    id: "q-ppm103-5",
    quizId: "quiz-ppm-103",
    questionText: "KPV peptide is primarily used for its:",
    questionType: "multiple_choice",
    explanation: "KPV is a tripeptide fragment of alpha-MSH known for its potent anti-inflammatory properties, particularly in gut and skin conditions.",
    sortOrder: 5,
    points: 1,
    answers: [
      { id: "a-ppm103-5a", text: "Muscle-building effects", isCorrect: false },
      { id: "a-ppm103-5b", text: "Anti-inflammatory properties, especially for gut and skin", isCorrect: true },
      { id: "a-ppm103-5c", text: "Fat-burning capabilities", isCorrect: false },
      { id: "a-ppm103-5d", text: "Cognitive enhancement", isCorrect: false },
    ],
  },
  {
    id: "q-ppm105-1",
    quizId: "quiz-ppm-105",
    questionText: "What is the recommended starting dose for semaglutide titration?",
    questionType: "multiple_choice",
    explanation: "Semaglutide titration starts at 0.25 mg weekly for 4 weeks to minimize gastrointestinal side effects before increasing.",
    sortOrder: 1,
    points: 1,
    answers: [
      { id: "a-ppm105-1a", text: "0.25 mg weekly for 4 weeks", isCorrect: true },
      { id: "a-ppm105-1b", text: "2.4 mg weekly immediately", isCorrect: false },
      { id: "a-ppm105-1c", text: "1 mg daily", isCorrect: false },
      { id: "a-ppm105-1d", text: "5 mg monthly", isCorrect: false },
    ],
  },
  {
    id: "q-ppm105-2",
    quizId: "quiz-ppm-105",
    questionText: "Tirzepatide differs from semaglutide because it is a:",
    questionType: "multiple_choice",
    explanation: "Tirzepatide is a dual GIP/GLP-1 receptor agonist, acting on both receptors for enhanced metabolic effects compared to semaglutide's GLP-1-only action.",
    sortOrder: 2,
    points: 1,
    answers: [
      { id: "a-ppm105-2a", text: "Pure GLP-1 receptor agonist", isCorrect: false },
      { id: "a-ppm105-2b", text: "Dual GIP/GLP-1 receptor agonist", isCorrect: true },
      { id: "a-ppm105-2c", text: "Growth hormone secretagogue", isCorrect: false },
      { id: "a-ppm105-2d", text: "Insulin analog", isCorrect: false },
    ],
  },
  {
    id: "q-ppm105-3",
    quizId: "quiz-ppm-105",
    questionText: "Ipamorelin is classified as a:",
    questionType: "multiple_choice",
    explanation: "Ipamorelin is a selective growth hormone secretagogue that stimulates natural GH release from the pituitary gland with minimal side effects.",
    sortOrder: 3,
    points: 1,
    answers: [
      { id: "a-ppm105-3a", text: "Direct growth hormone replacement", isCorrect: false },
      { id: "a-ppm105-3b", text: "Selective growth hormone secretagogue", isCorrect: true },
      { id: "a-ppm105-3c", text: "Testosterone precursor", isCorrect: false },
      { id: "a-ppm105-3d", text: "Anti-inflammatory peptide", isCorrect: false },
    ],
  },
  {
    id: "q-ppm105-4",
    quizId: "quiz-ppm-105",
    questionText: "Why is protein intake especially important for patients on GLP-1 agonists?",
    questionType: "multiple_choice",
    explanation: "GLP-1 agonists reduce appetite significantly, and without adequate protein (1g per pound of lean mass), patients risk losing muscle mass alongside fat.",
    sortOrder: 4,
    points: 1,
    answers: [
      { id: "a-ppm105-4a", text: "Protein neutralizes the medication", isCorrect: false },
      { id: "a-ppm105-4b", text: "Reduced appetite risks muscle loss without adequate protein", isCorrect: true },
      { id: "a-ppm105-4c", text: "Protein makes the medication work faster", isCorrect: false },
      { id: "a-ppm105-4d", text: "It has no special importance", isCorrect: false },
    ],
  },
  {
    id: "q-ppm105-5",
    quizId: "quiz-ppm-105",
    questionText: "CJC-1295 with DAC differs from CJC-1295 no-DAC primarily in:",
    questionType: "multiple_choice",
    explanation: "The Drug Affinity Complex (DAC) extends CJC-1295's half-life from ~30 minutes to ~8 days, allowing less frequent dosing but less pulsatile GH release.",
    sortOrder: 5,
    points: 1,
    answers: [
      { id: "a-ppm105-5a", text: "Its amino acid sequence", isCorrect: false },
      { id: "a-ppm105-5b", text: "Extended half-life from ~30 minutes to ~8 days", isCorrect: true },
      { id: "a-ppm105-5c", text: "The organ it targets", isCorrect: false },
      { id: "a-ppm105-5d", text: "Its route of administration", isCorrect: false },
    ],
  },
];

export async function seedPeptideProtocolMastery() {
  console.log("[Peptide Protocol Mastery Seed] Starting peptide protocol mastery seed...");

  try {
    await db.insert(trainingTracks).values(peptideProtocolTrack).onConflictDoNothing();
    console.log("[Peptide Protocol Mastery Seed] Upserted track");

    for (const module of peptideProtocolModules) {
      await db.insert(trainingModules).values(module).onConflictDoNothing();
      console.log(`[Peptide Protocol Mastery Seed] Upserted module: ${module.title}`);
    }

    const trackModuleLinks = peptideProtocolModules.map((m, i) => ({
      id: `tm-${peptideProtocolTrack.id}-${m.id}`,
      trackId: peptideProtocolTrack.id,
      moduleId: m.id,
      sortOrder: i + 1,
      isRequired: true,
    }));

    for (const link of trackModuleLinks) {
      await db.insert(trackModules).values(link).onConflictDoNothing();
    }
    console.log(`[Peptide Protocol Mastery Seed] Linked ${trackModuleLinks.length} modules to track`);

    for (const quiz of peptideProtocolQuizzes) {
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
    console.log(`[Peptide Protocol Mastery Seed] Inserted ${peptideProtocolQuizzes.length} quizzes`);

    for (const question of peptideProtocolQuizQuestions) {
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
    console.log(`[Peptide Protocol Mastery Seed] Inserted ${peptideProtocolQuizQuestions.length} questions with answers`);

    console.log("[Peptide Protocol Mastery Seed] Completed successfully!");
    return {
      success: true,
      modules: peptideProtocolModules.length,
      quizzes: peptideProtocolQuizzes.length,
      questions: peptideProtocolQuizQuestions.length,
      message: `Seeded ${peptideProtocolModules.length} peptide protocol mastery modules with ${peptideProtocolQuizzes.length} quizzes`,
    };
  } catch (error: any) {
    console.error("[Peptide Protocol Mastery Seed] Error:", error);
    throw error;
  }
}
