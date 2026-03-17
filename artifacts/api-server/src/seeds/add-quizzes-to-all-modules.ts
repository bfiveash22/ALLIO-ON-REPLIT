import { db } from '../db';
import { trainingModules, quizzes, quizQuestions, quizAnswers, moduleQuizzes } from '@shared/schema';
import { eq, isNull, sql } from 'drizzle-orm';

interface QuizTemplate {
  title: string;
  description: string;
  questions: Array<{
    question: string;
    answers: Array<{ text: string; correct: boolean }>;
    explanation: string;
  }>;
}

const categoryQuizTemplates: Record<string, QuizTemplate> = {
  "Advanced Therapeutics": {
    title: "Advanced Therapeutics Assessment",
    description: "Test your understanding of advanced therapeutic protocols",
    questions: [
      {
        question: "What is the primary mechanism of action for most advanced therapeutics?",
        answers: [
          { text: "Targeting specific cellular pathways", correct: true },
          { text: "Random cellular destruction", correct: false },
          { text: "Only affecting external symptoms", correct: false },
          { text: "Blocking all cellular activity", correct: false }
        ],
        explanation: "Advanced therapeutics work by targeting specific cellular pathways to modulate biological processes."
      },
      {
        question: "Why is individualized dosing important in advanced therapeutics?",
        answers: [
          { text: "Every member responds differently based on their unique biology", correct: true },
          { text: "It makes treatment more expensive", correct: false },
          { text: "Standard doses always work the same", correct: false },
          { text: "Dosing doesn't matter for therapeutic outcomes", correct: false }
        ],
        explanation: "Individual variation in metabolism, genetics, and health status requires personalized dosing approaches."
      },
      {
        question: "What should be monitored during advanced therapeutic protocols?",
        answers: [
          { text: "Member response, side effects, and biomarkers", correct: true },
          { text: "Only the calendar date", correct: false },
          { text: "Nothing - advanced therapies are always safe", correct: false },
          { text: "Only the cost of treatment", correct: false }
        ],
        explanation: "Comprehensive monitoring ensures safety and allows for protocol adjustments based on member response."
      }
    ]
  },
  "Constitutional Law": {
    title: "Constitutional Law Fundamentals",
    description: "Assess your understanding of constitutional protections for health freedom",
    questions: [
      {
        question: "Which constitutional amendment is most often cited in health freedom cases?",
        answers: [
          { text: "The 9th Amendment (unenumerated rights)", correct: true },
          { text: "The 3rd Amendment (quartering soldiers)", correct: false },
          { text: "The 7th Amendment (civil trials)", correct: false },
          { text: "The 27th Amendment (congressional pay)", correct: false }
        ],
        explanation: "The 9th Amendment protects unenumerated rights retained by the people, including health autonomy."
      },
      {
        question: "What legal status do Private Member Associations have?",
        answers: [
          { text: "They are protected private contracts between consenting adults", correct: true },
          { text: "They have no legal standing", correct: false },
          { text: "They are automatically illegal", correct: false },
          { text: "They only exist in certain states", correct: false }
        ],
        explanation: "PMAs are constitutionally protected as private contractual agreements under freedom of association."
      },
      {
        question: "What is the key principle of common law relevant to PMAs?",
        answers: [
          { text: "Freedom of contract between private parties", correct: true },
          { text: "Government controls all health decisions", correct: false },
          { text: "Corporations have unlimited power", correct: false },
          { text: "No contracts are enforceable", correct: false }
        ],
        explanation: "Common law recognizes the fundamental right of individuals to enter into private contracts."
      }
    ]
  },
  "Doctor Onboarding": {
    title: "Doctor Onboarding Certification",
    description: "Verify your understanding of doctor protocols and procedures",
    questions: [
      {
        question: "What is the first step when onboarding a new patient?",
        answers: [
          { text: "Complete comprehensive health intake and history", correct: true },
          { text: "Immediately prescribe treatments", correct: false },
          { text: "Skip documentation and start therapy", correct: false },
          { text: "Focus only on the chief complaint", correct: false }
        ],
        explanation: "A thorough intake ensures safe, personalized care based on complete health history."
      },
      {
        question: "How should doctors utilize ALLIO AI agents in their practice?",
        answers: [
          { text: "As assistive tools to enhance member wellness and research", correct: true },
          { text: "To replace all clinical decision making", correct: false },
          { text: "AI agents should be avoided entirely", correct: false },
          { text: "Only for administrative tasks", correct: false }
        ],
        explanation: "AI agents augment clinical expertise, providing research support and protocol assistance."
      },
      {
        question: "What documentation is required for member referrals?",
        answers: [
          { text: "Signed membership agreement and health questionnaire", correct: true },
          { text: "No documentation needed", correct: false },
          { text: "Only a verbal agreement", correct: false },
          { text: "Credit card information only", correct: false }
        ],
        explanation: "Proper documentation protects both the practitioner and the member legally."
      }
    ]
  },
  "ECS Foundations": {
    title: "ECS Foundations Quiz",
    description: "Test your foundational knowledge of the Endocannabinoid System",
    questions: [
      {
        question: "What is the primary function of the Endocannabinoid System?",
        answers: [
          { text: "Maintaining homeostasis (internal balance)", correct: true },
          { text: "Creating cannabinoids from plants", correct: false },
          { text: "Only managing pain", correct: false },
          { text: "Controlling only mood", correct: false }
        ],
        explanation: "The ECS is the master regulatory system that maintains balance across all body systems."
      },
      {
        question: "What are endocannabinoids?",
        answers: [
          { text: "Cannabinoids naturally produced by the body", correct: true },
          { text: "Only found in cannabis plants", correct: false },
          { text: "Synthetic laboratory compounds", correct: false },
          { text: "Prescription medications", correct: false }
        ],
        explanation: "Endocannabinoids like anandamide are produced internally to regulate ECS function."
      },
      {
        question: "Which system does the ECS NOT directly regulate?",
        answers: [
          { text: "The ECS regulates virtually all body systems", correct: true },
          { text: "Immune system", correct: false },
          { text: "Nervous system", correct: false },
          { text: "Digestive system", correct: false }
        ],
        explanation: "The ECS has receptors and influence throughout virtually every body system."
      }
    ]
  },
  "ECS Advanced": {
    title: "Advanced ECS Assessment",
    description: "Demonstrate advanced understanding of ECS therapeutics",
    questions: [
      {
        question: "What is the entourage effect?",
        answers: [
          { text: "Synergistic interaction between cannabinoids and terpenes", correct: true },
          { text: "A side effect of THC", correct: false },
          { text: "Tolerance to cannabinoids", correct: false },
          { text: "Addiction to cannabis", correct: false }
        ],
        explanation: "The entourage effect describes how multiple compounds work together for enhanced therapeutic benefit."
      },
      {
        question: "How does Clinical Endocannabinoid Deficiency (CECD) manifest?",
        answers: [
          { text: "As treatment-resistant conditions like migraine, fibromyalgia, IBS", correct: true },
          { text: "Only as mental health issues", correct: false },
          { text: "It has no clinical symptoms", correct: false },
          { text: "Only in elderly patients", correct: false }
        ],
        explanation: "CECD theory explains why some conditions share common therapeutic response to cannabinoid therapy."
      },
      {
        question: "What is the recommended approach to cannabinoid dosing?",
        answers: [
          { text: "Start low, go slow, and titrate to effect", correct: true },
          { text: "Maximum dose from the start", correct: false },
          { text: "One size fits all", correct: false },
          { text: "No dosing guidelines exist", correct: false }
        ],
        explanation: "Careful titration allows finding the minimum effective dose while minimizing side effects."
      }
    ]
  },
  "ECS Practitioner": {
    title: "ECS Practitioner Certification",
    description: "Certification exam for ECS practitioners",
    questions: [
      {
        question: "What is the first consideration when assessing a member for ECS support?",
        answers: [
          { text: "Complete health history including current medications", correct: true },
          { text: "Only their interest in cannabis", correct: false },
          { text: "Their age only", correct: false },
          { text: "Previous cannabis use", correct: false }
        ],
        explanation: "Comprehensive assessment ensures safe recommendations and identifies potential interactions."
      },
      {
        question: "Which terpene is known for its calming effects?",
        answers: [
          { text: "Linalool", correct: true },
          { text: "Limonene", correct: false },
          { text: "Pinene", correct: false },
          { text: "Caryophyllene", correct: false }
        ],
        explanation: "Linalool, also found in lavender, is associated with relaxation and anxiety reduction."
      },
      {
        question: "What are potential drug interactions to monitor with cannabinoids?",
        answers: [
          { text: "Blood thinners, sedatives, and CYP450 metabolized drugs", correct: true },
          { text: "Cannabinoids have no drug interactions", correct: false },
          { text: "Only with illegal substances", correct: false },
          { text: "Only with other cannabinoids", correct: false }
        ],
        explanation: "Cannabinoids can affect drug metabolism, requiring careful monitoring with certain medications."
      }
    ]
  },
  "Nutrition": {
    title: "Nutrition & Mineral Balance",
    description: "Test your understanding of nutritional healing principles",
    questions: [
      {
        question: "According to Dr. Wallach, what percentage of diseases are related to nutritional deficiencies?",
        answers: [
          { text: "Over 90%", correct: true },
          { text: "About 10%", correct: false },
          { text: "About 50%", correct: false },
          { text: "None", correct: false }
        ],
        explanation: "Dr. Wallach's research suggests most chronic conditions stem from mineral and nutrient deficiencies."
      },
      {
        question: "Why are minerals from plants considered more bioavailable?",
        answers: [
          { text: "Plants convert metallic minerals to colloidal form", correct: true },
          { text: "They taste better", correct: false },
          { text: "They are not more bioavailable", correct: false },
          { text: "Plants add synthetic compounds", correct: false }
        ],
        explanation: "Plant-derived minerals are in a colloidal form that the body can absorb more efficiently."
      },
      {
        question: "What is the relationship between soil depletion and health?",
        answers: [
          { text: "Depleted soils produce nutrient-poor foods, contributing to deficiencies", correct: true },
          { text: "Soil quality doesn't affect food nutrition", correct: false },
          { text: "Modern farming improves soil nutrients", correct: false },
          { text: "Only organic foods lack nutrients", correct: false }
        ],
        explanation: "Industrial farming has depleted soil minerals, meaning foods today have fewer nutrients."
      }
    ]
  },
  "Nutrition & Healing": {
    title: "Diet & Cancer Prevention",
    description: "Assess your knowledge of dietary approaches to cancer prevention",
    questions: [
      {
        question: "Which food group has the strongest anti-cancer evidence?",
        answers: [
          { text: "Cruciferous vegetables (broccoli, cabbage, kale)", correct: true },
          { text: "Processed meats", correct: false },
          { text: "Refined sugars", correct: false },
          { text: "Fried foods", correct: false }
        ],
        explanation: "Cruciferous vegetables contain sulforaphane and other compounds that support cellular detox."
      },
      {
        question: "What dietary pattern is most associated with cancer prevention?",
        answers: [
          { text: "Mediterranean diet", correct: true },
          { text: "Standard American diet", correct: false },
          { text: "High-sugar diet", correct: false },
          { text: "Processed food diet", correct: false }
        ],
        explanation: "The Mediterranean diet emphasizes anti-inflammatory whole foods that support cellular health."
      },
      {
        question: "Which compounds in turmeric are studied for anti-cancer effects?",
        answers: [
          { text: "Curcuminoids", correct: true },
          { text: "Caffeine", correct: false },
          { text: "Sugar", correct: false },
          { text: "Alcohol", correct: false }
        ],
        explanation: "Curcumin and related curcuminoids have demonstrated anti-inflammatory and anti-cancer properties."
      }
    ]
  },
  "Ozone Therapy": {
    title: "Ozone Therapy Certification",
    description: "Demonstrate understanding of ozone therapy protocols",
    questions: [
      {
        question: "What is the primary therapeutic mechanism of ozone therapy?",
        answers: [
          { text: "Improved oxygen utilization and immune modulation", correct: true },
          { text: "Killing all cells indiscriminately", correct: false },
          { text: "Only treating surface wounds", correct: false },
          { text: "Replacing medication", correct: false }
        ],
        explanation: "Ozone therapy works by enhancing cellular oxygenation and stimulating immune function."
      },
      {
        question: "Which administration method is used for systemic ozone therapy?",
        answers: [
          { text: "Major autohemotherapy (MAH)", correct: true },
          { text: "Inhalation of ozone gas", correct: false },
          { text: "Drinking ozonated water only", correct: false },
          { text: "Ozone cannot be used systemically", correct: false }
        ],
        explanation: "MAH involves treating blood with ozone and reinfusing it for systemic benefits."
      },
      {
        question: "What conditions show promising response to ozone therapy?",
        answers: [
          { text: "Chronic infections, poor circulation, autoimmune conditions", correct: true },
          { text: "Ozone therapy has no medical applications", correct: false },
          { text: "Only cosmetic issues", correct: false },
          { text: "Only dental problems", correct: false }
        ],
        explanation: "Research supports ozone therapy for various chronic conditions involving infection and inflammation."
      }
    ]
  },
  "PMA Law Foundations": {
    title: "PMA Law Foundations",
    description: "Test your understanding of PMA legal foundations",
    questions: [
      {
        question: "What historical precedent supports the right to private association?",
        answers: [
          { text: "Freedom of assembly in the First Amendment", correct: true },
          { text: "There is no precedent", correct: false },
          { text: "Only state laws apply", correct: false },
          { text: "Corporate law exclusively", correct: false }
        ],
        explanation: "The First Amendment guarantees the right of peaceful assembly and association."
      },
      {
        question: "What is the legal basis of common law?",
        answers: [
          { text: "Precedent from court decisions over centuries", correct: true },
          { text: "Only recently written legislation", correct: false },
          { text: "International treaties", correct: false },
          { text: "Executive orders", correct: false }
        ],
        explanation: "Common law evolved from centuries of court decisions establishing fundamental rights."
      },
      {
        question: "Why are PMAs considered constitutionally protected?",
        answers: [
          { text: "They represent private contracts between consenting adults", correct: true },
          { text: "They are government agencies", correct: false },
          { text: "They are not protected", correct: false },
          { text: "Only corporations are protected", correct: false }
        ],
        explanation: "The Constitution protects private contractual relationships between consenting parties."
      }
    ]
  },
  "Peptide Science": {
    title: "Peptide Science Assessment",
    description: "Evaluate your understanding of peptide therapeutics",
    questions: [
      {
        question: "What are peptides?",
        answers: [
          { text: "Short chains of amino acids that signal biological processes", correct: true },
          { text: "Synthetic drugs with no natural equivalent", correct: false },
          { text: "Only found in laboratory settings", correct: false },
          { text: "Types of vitamins", correct: false }
        ],
        explanation: "Peptides are naturally occurring signaling molecules made of amino acid chains."
      },
      {
        question: "What is BPC-157's primary therapeutic application?",
        answers: [
          { text: "Tissue healing and gut repair", correct: true },
          { text: "Weight loss only", correct: false },
          { text: "Hair growth", correct: false },
          { text: "Skin tanning", correct: false }
        ],
        explanation: "BPC-157 is studied for its remarkable tissue regeneration and gut healing properties."
      },
      {
        question: "How do bioregulators differ from other peptides?",
        answers: [
          { text: "They target specific organs with tissue-specific repair signals", correct: true },
          { text: "They are exactly the same as hormones", correct: false },
          { text: "They have no specific targets", correct: false },
          { text: "They are only for bodybuilding", correct: false }
        ],
        explanation: "Bioregulators like Epithalon target specific tissues with precision signaling."
      }
    ]
  },
  "Peptides": {
    title: "Advanced Peptide Therapeutics",
    description: "Test advanced peptide knowledge",
    questions: [
      {
        question: "What class of peptides are GLP-1 agonists?",
        answers: [
          { text: "Metabolic regulators that affect appetite and blood sugar", correct: true },
          { text: "Immune suppressants", correct: false },
          { text: "Muscle builders", correct: false },
          { text: "Sleep aids", correct: false }
        ],
        explanation: "GLP-1 agonists like semaglutide regulate metabolism, appetite, and glucose."
      },
      {
        question: "What is the mechanism of thymosin alpha-1?",
        answers: [
          { text: "Immune modulation and T-cell activation", correct: true },
          { text: "Muscle growth", correct: false },
          { text: "Fat burning", correct: false },
          { text: "Hair restoration", correct: false }
        ],
        explanation: "Thymosin alpha-1 is a powerful immune modulator that enhances T-cell function."
      },
      {
        question: "Why is peptide stability important for storage?",
        answers: [
          { text: "Peptides can degrade without proper temperature control", correct: true },
          { text: "Storage doesn't affect peptides", correct: false },
          { text: "Peptides last forever", correct: false },
          { text: "Only for aesthetic reasons", correct: false }
        ],
        explanation: "Proper cold storage maintains peptide integrity and therapeutic efficacy."
      }
    ]
  },
  "Practical Skills": {
    title: "Practical Application Skills",
    description: "Test your practical knowledge for member support",
    questions: [
      {
        question: "How should members apply PMA knowledge in their health journey?",
        answers: [
          { text: "By making informed choices as private individuals", correct: true },
          { text: "By ignoring all medical advice", correct: false },
          { text: "By practicing medicine without training", correct: false },
          { text: "By avoiding all healthcare", correct: false }
        ],
        explanation: "PMA membership empowers informed health decisions within a protected private framework."
      },
      {
        question: "What is the member's responsibility in the PMA?",
        answers: [
          { text: "To act in good faith and maintain confidentiality", correct: true },
          { text: "No responsibilities exist", correct: false },
          { text: "Only financial obligations", correct: false },
          { text: "To recruit others", correct: false }
        ],
        explanation: "Members agree to conduct themselves with integrity and protect the privacy of all members."
      },
      {
        question: "How should members document their health protocols?",
        answers: [
          { text: "Keep detailed records of products, doses, and responses", correct: true },
          { text: "Never keep records", correct: false },
          { text: "Only track costs", correct: false },
          { text: "Documentation is not important", correct: false }
        ],
        explanation: "Good documentation helps members and their healthcare providers optimize their protocols."
      }
    ]
  },
  "Protocols": {
    title: "Healing Protocols Assessment",
    description: "Test your understanding of healing protocols",
    questions: [
      {
        question: "What do the '5 Rs' in healing protocols represent?",
        answers: [
          { text: "Remove, Replace, Reinoculate, Repair, Rebalance", correct: true },
          { text: "Run, Rest, Repeat, Recover, Resume", correct: false },
          { text: "They have no specific meaning", correct: false },
          { text: "Reduce, Restrict, Relax, Restore, Revive", correct: false }
        ],
        explanation: "The 5 Rs framework addresses root causes of dysfunction systematically."
      },
      {
        question: "Why is 'Remove' the first step in the 5 Rs protocol?",
        answers: [
          { text: "Healing cannot begin while stressors and toxins remain", correct: true },
          { text: "It's alphabetically first", correct: false },
          { text: "It's the easiest step", correct: false },
          { text: "Order doesn't matter", correct: false }
        ],
        explanation: "Removing sources of inflammation and toxicity creates the foundation for healing."
      },
      {
        question: "What does 'Reinoculate' mean in the 5 Rs?",
        answers: [
          { text: "Restoring beneficial microbiome with probiotics", correct: true },
          { text: "Getting vaccinations", correct: false },
          { text: "Taking antibiotics", correct: false },
          { text: "Eating more sugar", correct: false }
        ],
        explanation: "Reinoculation restores healthy gut flora essential for immune and digestive function."
      }
    ]
  },
  "Site Training": {
    title: "Platform Training Quiz",
    description: "Verify your understanding of the platform",
    questions: [
      {
        question: "What is the primary mission of Forgotten Formula PMA?",
        answers: [
          { text: "Empowering members with healing knowledge and products", correct: true },
          { text: "Selling only supplements", correct: false },
          { text: "Replacing medical care", correct: false },
          { text: "Political activism", correct: false }
        ],
        explanation: "The PMA exists to provide members access to healing resources within a protected framework."
      },
      {
        question: "How should members navigate the product catalog?",
        answers: [
          { text: "Browse by category and consult the AI agents for guidance", correct: true },
          { text: "Products are not organized", correct: false },
          { text: "Only through doctor referral", correct: false },
          { text: "Products are hidden from members", correct: false }
        ],
        explanation: "The catalog is organized by category, and AI agents can help with product selection."
      },
      {
        question: "What resources are available in the training section?",
        answers: [
          { text: "Educational modules, videos, quizzes, and certifications", correct: true },
          { text: "Only text documents", correct: false },
          { text: "Nothing is available", correct: false },
          { text: "Only for doctors", correct: false }
        ],
        explanation: "Comprehensive training includes interactive modules with video content and quizzes."
      }
    ]
  },
  "IV Therapy": {
    title: "IV Therapy Safety Assessment",
    description: "Demonstrate IV therapy safety knowledge",
    questions: [
      {
        question: "What is the most critical safety concern in IV therapy?",
        answers: [
          { text: "Sterile technique and proper vein access", correct: true },
          { text: "Speed of administration", correct: false },
          { text: "Cost of materials", correct: false },
          { text: "Member comfort only", correct: false }
        ],
        explanation: "Maintaining sterility prevents infection, the primary risk of IV therapy."
      },
      {
        question: "What should be verified before starting any IV infusion?",
        answers: [
          { text: "Member allergies, correct solution, and expiration dates", correct: true },
          { text: "Only the patient's name", correct: false },
          { text: "Nothing needs verification", correct: false },
          { text: "Only payment information", correct: false }
        ],
        explanation: "Triple-checking prevents adverse reactions and medication errors."
      },
      {
        question: "When should an IV infusion be stopped immediately?",
        answers: [
          { text: "Signs of infiltration, allergic reaction, or member distress", correct: true },
          { text: "When the member asks questions", correct: false },
          { text: "Never - always complete the infusion", correct: false },
          { text: "Only when the bag is empty", correct: false }
        ],
        explanation: "Immediate response to adverse signs prevents serious complications."
      }
    ]
  }
};

export async function addQuizzesToAllModules() {
  console.log('[Quiz Seed] Starting quiz creation for all modules...');
  const results: any[] = [];

  const modulesWithoutQuizzes = await db.execute(sql`
    SELECT tm.id, tm.title, tm.category 
    FROM training_modules tm 
    LEFT JOIN module_quizzes mq ON tm.id = mq.module_id 
    WHERE mq.module_id IS NULL
    ORDER BY tm.category, tm.title
  `);

  console.log(`[Quiz Seed] Found ${modulesWithoutQuizzes.rows.length} modules without quizzes`);

  for (const moduleRow of modulesWithoutQuizzes.rows) {
    const moduleId = moduleRow.id as string;
    const moduleTitle = moduleRow.title as string;
    const category = moduleRow.category as string;

    try {
      const template = categoryQuizTemplates[category];
      if (!template) {
        console.log(`[Quiz Seed] No template for category: ${category}, using default`);
      }

      const quizTemplate = template || categoryQuizTemplates["Site Training"];
      const quizId = `quiz-${moduleId}`;

      const [existingQuiz] = await db.select()
        .from(quizzes)
        .where(eq(quizzes.id, quizId))
        .limit(1);

      if (existingQuiz) {
        console.log(`[Quiz Seed] Quiz already exists for ${moduleId}`);
        const existingLink = await db.select()
          .from(moduleQuizzes)
          .where(eq(moduleQuizzes.moduleId, moduleId))
          .limit(1);

        if (existingLink.length === 0) {
          await db.insert(moduleQuizzes).values({
            moduleId,
            quizId: existingQuiz.id,
            sortOrder: 0,
            isRequired: true
          });
        }
        results.push({ moduleId, moduleTitle, status: 'linked_existing' });
        continue;
      }

      const quizSlug = `quiz-${moduleId}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      const [newQuiz] = await db.insert(quizzes).values({
        id: quizId,
        title: `${moduleTitle} Quiz`,
        slug: quizSlug,
        description: `Assessment quiz for ${moduleTitle}`,
        difficulty: 'intermediate',
        passingScore: 80,
        isActive: true
      }).returning();

      for (let i = 0; i < quizTemplate.questions.length; i++) {
        const q = quizTemplate.questions[i];
        const questionId = `${quizId}-q${i + 1}`;

        const [newQuestion] = await db.insert(quizQuestions).values({
          id: questionId,
          quizId: newQuiz.id,
          questionText: q.question,
          questionType: 'multiple_choice',
          sortOrder: i,
          points: 10,
          explanation: q.explanation
        }).returning();

        for (let j = 0; j < q.answers.length; j++) {
          const a = q.answers[j];
          await db.insert(quizAnswers).values({
            id: `${questionId}-a${j + 1}`,
            questionId: newQuestion.id,
            answerText: a.text,
            isCorrect: a.correct,
            sortOrder: j
          });
        }
      }

      await db.insert(moduleQuizzes).values({
        moduleId,
        quizId: newQuiz.id,
        sortOrder: 0,
        isRequired: true
      });

      console.log(`[Quiz Seed] Created quiz for ${moduleTitle}`);
      results.push({ moduleId, moduleTitle, status: 'created', quizId: newQuiz.id });

    } catch (error: any) {
      console.error(`[Quiz Seed] Error creating quiz for ${moduleId}:`, error.message);
      results.push({ moduleId, moduleTitle, status: 'error', error: error.message });
    }
  }

  await db.update(trainingModules)
    .set({ isInteractive: true })
    .where(eq(trainingModules.isInteractive, false));

  console.log('[Quiz Seed] Complete!');
  return {
    success: true,
    modulesProcessed: modulesWithoutQuizzes.rows.length,
    quizzesCreated: results.filter(r => r.status === 'created').length,
    results
  };
}
