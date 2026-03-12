import { db } from '../db';
import { trainingModules, trainingModuleSections, trainingModuleKeyPoints, quizzes, quizQuestions, quizAnswers, moduleQuizzes } from '@shared/schema';
import { eq } from 'drizzle-orm';

const TRAINING_VIDEO_ID = '1TaREjW9CYSHOoXCjCXaxW7joCRBrGNJo';

interface ModuleContent {
  id: string;
  title: string;
  videoUrl?: string;
  sections: Array<{
    id: string;
    title: string;
    content: string;
    sortOrder: number;
  }>;
  keyPoints: Array<{
    point: string;
    sortOrder: number;
  }>;
  quiz: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
  }>;
}

const moduleContents: ModuleContent[] = [
  {
    id: 'site-102-platform-nav',
    title: 'Platform Navigation',
    videoUrl: `https://drive.google.com/file/d/${TRAINING_VIDEO_ID}/preview`,
    sections: [
      {
        id: 'nav-dashboard',
        title: 'Understanding Your Dashboard',
        content: 'The ALLIO dashboard is your command center for healing. Learn to navigate the main areas: Member Portal for your healing journey, Training Academy for education, Products for healing protocols, and Support for assistance. The sidebar provides quick access to all features, while the top bar shows notifications and your profile.',
        sortOrder: 0
      },
      {
        id: 'nav-training',
        title: 'Accessing Training Modules',
        content: 'Navigate to the Training Academy by clicking the graduation cap icon. Modules are organized by category: Blood Analysis, Protocols, PMA Legal, and Site Training. Track your progress with completion indicators. Each module includes interactive content, quizzes, and certificates upon completion.',
        sortOrder: 1
      },
      {
        id: 'nav-protocols',
        title: 'Finding Healing Protocols',
        content: 'Access healing protocols through the Protocols section. Search by condition, browse by category, or use AI-powered recommendations. Each protocol includes dosing guidance, duration, and supporting materials. Bookmark protocols for quick access.',
        sortOrder: 2
      },
      {
        id: 'nav-support',
        title: 'Getting Help & Support',
        content: 'Multiple support channels are available: AI Agent Hub for instant assistance, Knowledge Base for self-service, and Direct Contact for complex issues. DIANE is your primary AI assistant for navigation help, while specialized agents handle specific needs.',
        sortOrder: 3
      }
    ],
    keyPoints: [
      { point: 'Dashboard provides quick overview of your healing journey and pending actions', sortOrder: 0 },
      { point: 'Training modules track progress automatically and award certificates', sortOrder: 1 },
      { point: 'Product catalog integrates with protocols for seamless ordering', sortOrder: 2 },
      { point: 'AI agents are available 24/7 for guidance and support', sortOrder: 3 },
      { point: 'Bookmarks and favorites help organize your most-used resources', sortOrder: 4 }
    ],
    quiz: [
      { question: 'Where do you find your healing protocols?', options: ['Settings', 'Protocols section', 'Admin panel', 'Chat only'], correctAnswer: 1 },
      { question: 'Which AI agent helps with general navigation?', options: ['MUSE', 'DIANA', 'DIANE', 'ATHENA'], correctAnswer: 2 },
      { question: 'How do you track training progress?', options: ['Manual logging', 'Automatic progress tracking', 'Email reports only', 'No tracking available'], correctAnswer: 1 },
      { question: 'What does the graduation cap icon access?', options: ['Products', 'Training Academy', 'Profile', 'Support'], correctAnswer: 1 }
    ]
  },
  {
    id: 'site-104-support-skills',
    title: 'Member Support Excellence',
    sections: [
      {
        id: 'support-philosophy',
        title: 'The ALLIO Support Philosophy',
        content: 'Support at Forgotten Formula goes beyond answering questions—it\'s about guiding members on their healing journey. We combine AI efficiency with human empathy. Every interaction should leave members feeling heard, understood, and empowered.',
        sortOrder: 0
      },
      {
        id: 'support-communication',
        title: 'Communication Best Practices',
        content: 'Use clear, compassionate language free of medical jargon. Listen actively before responding. Acknowledge emotions and concerns. Provide actionable guidance. Follow up on complex issues. Document interactions for continuity.',
        sortOrder: 1
      },
      {
        id: 'support-escalation',
        title: 'Escalation Procedures',
        content: 'Know when to escalate: Medical concerns go to qualified practitioners. Legal questions to the Legal division. Technical issues to Engineering. Financial matters to Nancy or Kami. Urgent security concerns to SENTINEL immediately.',
        sortOrder: 2
      },
      {
        id: 'support-tools',
        title: 'Support Tools & Systems',
        content: 'Master the support toolkit: CRM for member history, Knowledge Base for quick answers, Ticket system for tracking, AI agents for assistance. DIANE handles first-line queries while you focus on complex needs.',
        sortOrder: 3
      }
    ],
    keyPoints: [
      { point: 'Every member interaction is an opportunity to support healing', sortOrder: 0 },
      { point: 'Empathy first, then information—acknowledge feelings before solutions', sortOrder: 1 },
      { point: 'Document all interactions for team continuity and member history', sortOrder: 2 },
      { point: 'Know your escalation paths—medical, legal, technical, financial', sortOrder: 3 },
      { point: 'Leverage AI agents to enhance—not replace—human connection', sortOrder: 4 }
    ],
    quiz: [
      { question: 'What should you do first when a member expresses frustration?', options: ['Provide solution immediately', 'Acknowledge their feelings', 'Escalate to manager', 'Send documentation'], correctAnswer: 1 },
      { question: 'Medical concerns should be escalated to:', options: ['Engineering', 'Marketing', 'Qualified practitioners', 'AI agents only'], correctAnswer: 2 },
      { question: 'Why do we document all interactions?', options: ['Legal requirement only', 'Continuity and member history', 'Performance tracking', 'AI training'], correctAnswer: 1 },
      { question: 'Which AI agent handles first-line support queries?', options: ['MUSE', 'ATHENA', 'DIANE', 'PIXEL'], correctAnswer: 2 }
    ]
  },
  {
    id: 'site-105-compliance',
    title: 'PMA Compliance & Legal',
    sections: [
      {
        id: 'compliance-pma-basics',
        title: 'Understanding PMA Legal Framework',
        content: 'A Private Member Association operates under constitutional protections of freedom of association and contract. We are NOT a medical practice—we are a private association of individuals pursuing health freedom. Understanding this distinction is crucial for all communications.',
        sortOrder: 0
      },
      {
        id: 'compliance-language',
        title: 'Approved Language & Terminology',
        content: 'Never use: diagnose, treat, cure, prescribe, patient. Instead use: assess, support, protocol, suggest, member. Our products "support wellness" not "treat conditions." We share "educational information" not "medical advice."',
        sortOrder: 1
      },
      {
        id: 'compliance-documentation',
        title: 'Documentation Requirements',
        content: 'All members must sign the Membership Agreement before accessing services. Informed consent for protocols. Privacy agreements for data handling. Keep records organized and accessible. Use SignNow for official documents.',
        sortOrder: 2
      },
      {
        id: 'compliance-boundaries',
        title: 'Legal Boundaries',
        content: 'Know what we can and cannot do: We educate, we don\'t practice medicine. We suggest protocols, we don\'t prescribe. We support healing, we don\'t treat disease. When in doubt, escalate to Legal division.',
        sortOrder: 3
      }
    ],
    keyPoints: [
      { point: 'PMA operates under constitutional freedom of association', sortOrder: 0 },
      { point: 'Never use medical terminology: diagnose, treat, cure, prescribe', sortOrder: 1 },
      { point: 'All members must complete proper onboarding documentation', sortOrder: 2 },
      { point: 'We educate and support—we do not practice medicine', sortOrder: 3 },
      { point: 'When uncertain about compliance, always escalate to Legal', sortOrder: 4 }
    ],
    quiz: [
      { question: 'What should you call someone receiving services?', options: ['Patient', 'Client', 'Member', 'Customer'], correctAnswer: 2 },
      { question: 'Our products do what?', options: ['Treat conditions', 'Cure diseases', 'Support wellness', 'Prescribe solutions'], correctAnswer: 2 },
      { question: 'What document must all members sign first?', options: ['Prescription form', 'Membership Agreement', 'Medical history', 'Insurance form'], correctAnswer: 1 },
      { question: 'PMA operates under which constitutional protection?', options: ['Commerce clause', 'Freedom of association', 'Tax exemption', 'Medical license'], correctAnswer: 1 }
    ]
  },
  {
    id: 'pma-105-pma-structure',
    title: 'Private Member Association Structure',
    sections: [
      {
        id: 'structure-definition',
        title: 'What is a PMA?',
        content: 'A Private Member Association is a group of individuals who have joined together for a common purpose, protected by the First and Fourteenth Amendments. Members contract privately, outside regulatory jurisdiction that governs public commerce.',
        sortOrder: 0
      },
      {
        id: 'structure-hierarchy',
        title: 'Organizational Hierarchy',
        content: 'The Trustee (T) holds ultimate authority and decision-making power. Below are division leads managing specific functions. All team members operate as trustees of their responsibilities. SENTINEL coordinates AI operations across all divisions.',
        sortOrder: 1
      },
      {
        id: 'structure-membership',
        title: 'Membership Tiers & Rights',
        content: 'Members join voluntarily and agree to association terms. Different tiers offer varying access levels. All members have privacy protections. Rights include access to education, protocols, and community. Responsibilities include confidentiality and respectful engagement.',
        sortOrder: 2
      },
      {
        id: 'structure-operations',
        title: 'Operational Guidelines',
        content: 'Daily operations follow established protocols. Communication flows through proper channels. Documentation maintains organizational memory. Regular reviews ensure alignment with mission. All activities support the core goal: true healing.',
        sortOrder: 3
      }
    ],
    keyPoints: [
      { point: 'PMAs are protected by First and Fourteenth Amendments', sortOrder: 0 },
      { point: 'The Trustee holds ultimate authority—never use personal names', sortOrder: 1 },
      { point: 'Members contract privately, outside public commerce regulation', sortOrder: 2 },
      { point: 'All operations serve the mission: merging humans with AI by healing', sortOrder: 3 },
      { point: 'Documentation and proper channels maintain organizational integrity', sortOrder: 4 }
    ],
    quiz: [
      { question: 'Which amendments protect PMA operations?', options: ['Second and Third', 'First and Fourteenth', 'Fourth and Fifth', 'Tenth and Eleventh'], correctAnswer: 1 },
      { question: 'How should you refer to the organization leader?', options: ['By first name', 'The Trustee or T', 'The CEO', 'The Doctor'], correctAnswer: 1 },
      { question: 'PMAs operate outside of:', options: ['All laws', 'Public commerce regulation', 'Constitutional protection', 'Membership agreements'], correctAnswer: 1 },
      { question: 'What coordinates AI operations across divisions?', options: ['DIANE', 'ATHENA', 'SENTINEL', 'MUSE'], correctAnswer: 2 }
    ]
  },
  {
    id: 'pma-106-freedom-contract',
    title: 'Freedom of Contract',
    sections: [
      {
        id: 'contract-foundation',
        title: 'Constitutional Foundation',
        content: 'Freedom of contract is an implied constitutional right derived from due process protections. Adults have the right to enter private agreements without government interference, provided no fraud or duress exists. This is foundational to PMA operations.',
        sortOrder: 0
      },
      {
        id: 'contract-elements',
        title: 'Elements of Valid Contracts',
        content: 'Valid contracts require: offer, acceptance, consideration (exchange of value), capacity (mental competence), and legality of purpose. PMA membership agreements contain all these elements, creating enforceable private contracts.',
        sortOrder: 1
      },
      {
        id: 'contract-privacy',
        title: 'Privacy of Private Agreements',
        content: 'Private contracts between consenting adults are protected from regulatory interference. Members agree to keep association matters confidential. This privacy extends to protocols, communications, and membership details.',
        sortOrder: 2
      },
      {
        id: 'contract-enforcement',
        title: 'Contract Enforcement',
        content: 'Disputes are resolved according to agreement terms, typically through private arbitration. Courts generally uphold private contracts. Good faith and fair dealing are expected from all parties.',
        sortOrder: 3
      }
    ],
    keyPoints: [
      { point: 'Freedom of contract is an implied constitutional right', sortOrder: 0 },
      { point: 'Valid contracts need offer, acceptance, consideration, capacity, legality', sortOrder: 1 },
      { point: 'Private agreements are protected from regulatory interference', sortOrder: 2 },
      { point: 'Disputes resolve through terms specified in agreements', sortOrder: 3 },
      { point: 'Good faith and fair dealing are expected from all parties', sortOrder: 4 }
    ],
    quiz: [
      { question: 'What is the source of freedom of contract?', options: ['Tax code', 'Due process protections', 'Commerce clause', 'State regulations'], correctAnswer: 1 },
      { question: 'Which is NOT an element of a valid contract?', options: ['Consideration', 'Government approval', 'Capacity', 'Acceptance'], correctAnswer: 1 },
      { question: 'How are PMA disputes typically resolved?', options: ['Federal court', 'Private arbitration', 'State board', 'Public voting'], correctAnswer: 1 },
      { question: 'What protects private contracts from interference?', options: ['Insurance', 'Constitutional rights', 'Business license', 'Medical board'], correctAnswer: 1 }
    ]
  },
  {
    id: 'pma-107-case-law',
    title: 'Key Case Law & Precedents',
    sections: [
      {
        id: 'caselaw-association',
        title: 'Freedom of Association Cases',
        content: 'NAACP v. Alabama (1958) established freedom of association as a constitutional right. Boy Scouts of America v. Dale (2000) affirmed private organizations\' right to determine membership. These cases form the legal backbone of PMA protections.',
        sortOrder: 0
      },
      {
        id: 'caselaw-contract',
        title: 'Contract Freedom Precedents',
        content: 'Lochner v. New York (1905) originally established economic liberty including contract freedom. While modified, the core principle that adults can freely contract remains. Allgeyer v. Louisiana (1897) affirmed liberty of contract under the 14th Amendment.',
        sortOrder: 1
      },
      {
        id: 'caselaw-privacy',
        title: 'Privacy Rights Cases',
        content: 'Griswold v. Connecticut (1965) established zones of privacy in the Constitution. These privacy protections extend to private associations and their internal matters. Members\' health decisions fall within protected privacy zones.',
        sortOrder: 2
      },
      {
        id: 'caselaw-application',
        title: 'Applying Precedent',
        content: 'Understanding case law helps defend PMA operations. Reference these cases when explaining legal protections to members. Always consult Legal division for specific situations. Stay informed about new relevant rulings.',
        sortOrder: 3
      }
    ],
    keyPoints: [
      { point: 'NAACP v. Alabama established constitutional freedom of association', sortOrder: 0 },
      { point: 'Boy Scouts v. Dale affirmed private organizational autonomy', sortOrder: 1 },
      { point: 'Griswold v. Connecticut established constitutional privacy zones', sortOrder: 2 },
      { point: 'Contract freedom derives from 14th Amendment liberty protections', sortOrder: 3 },
      { point: 'Always consult Legal division for specific case applications', sortOrder: 4 }
    ],
    quiz: [
      { question: 'Which case established freedom of association?', options: ['Roe v. Wade', 'NAACP v. Alabama', 'Brown v. Board', 'Miranda v. Arizona'], correctAnswer: 1 },
      { question: 'Griswold v. Connecticut established:', options: ['Voting rights', 'Privacy zones', 'Gun rights', 'Property rights'], correctAnswer: 1 },
      { question: 'Contract freedom is protected under which amendment?', options: ['First', 'Second', 'Fourteenth', 'Twenty-first'], correctAnswer: 2 },
      { question: 'Who should interpret case law for specific situations?', options: ['Any team member', 'AI agents only', 'Legal division', 'External lawyers only'], correctAnswer: 2 }
    ]
  },
  {
    id: 'site-106-new-staff-quiz',
    title: 'New Staff Certification Quiz',
    videoUrl: `https://drive.google.com/file/d/${TRAINING_VIDEO_ID}/preview`,
    sections: [
      {
        id: 'cert-overview',
        title: 'Certification Overview',
        content: 'This certification validates your understanding of Forgotten Formula PMA operations, compliance requirements, and support skills. Successful completion grants access to member-facing systems and responsibilities.',
        sortOrder: 0
      },
      {
        id: 'cert-requirements',
        title: 'Certification Requirements',
        content: 'Complete all prerequisite modules: Platform Navigation, PMA Structure, Compliance & Legal, Freedom of Contract, and Member Support. Score 80% or higher on each module quiz. Pass this final certification quiz with 85% or higher.',
        sortOrder: 1
      },
      {
        id: 'cert-responsibilities',
        title: 'Certified Staff Responsibilities',
        content: 'Upon certification, you represent Forgotten Formula PMA to members. Maintain confidentiality, use approved language, follow escalation procedures, and embody our healing mission in all interactions.',
        sortOrder: 2
      },
      {
        id: 'cert-renewal',
        title: 'Ongoing Requirements',
        content: 'Certifications renew annually. Complete continuing education modules. Stay updated on policy changes. Participate in team training sessions. Your growth supports our collective mission.',
        sortOrder: 3
      }
    ],
    keyPoints: [
      { point: 'Certification requires 80% on module quizzes, 85% on final', sortOrder: 0 },
      { point: 'Prerequisite modules must be completed before certification', sortOrder: 1 },
      { point: 'Certified staff represent FFPMA to all members', sortOrder: 2 },
      { point: 'Annual renewal keeps knowledge current', sortOrder: 3 },
      { point: 'Continuing education supports collective mission success', sortOrder: 4 }
    ],
    quiz: [
      { question: 'What score is required on the final certification quiz?', options: ['70%', '75%', '80%', '85%'], correctAnswer: 3 },
      { question: 'How often must certification be renewed?', options: ['Monthly', 'Quarterly', 'Annually', 'Never'], correctAnswer: 2 },
      { question: 'What is the minimum score for module quizzes?', options: ['70%', '75%', '80%', '85%'], correctAnswer: 2 },
      { question: 'Certified staff must maintain:', options: ['Public visibility', 'Confidentiality', 'Social media presence', 'External partnerships'], correctAnswer: 1 }
    ]
  }
];

export async function seedRemainingModules() {
  console.log('[Seed] Starting remaining modules content generation...');
  const results = [];
  
  for (const moduleContent of moduleContents) {
    try {
      console.log(`[Seed] Processing module: ${moduleContent.id}`);
      
      const existingModule = await db
        .select()
        .from(trainingModules)
        .where(eq(trainingModules.id, moduleContent.id))
        .limit(1);
      
      if (existingModule.length === 0) {
        console.log(`[Seed] Module ${moduleContent.id} not found, skipping...`);
        results.push({ id: moduleContent.id, status: 'not_found' });
        continue;
      }
      
      await db.delete(trainingModuleSections).where(eq(trainingModuleSections.moduleId, moduleContent.id));
      await db.delete(trainingModuleKeyPoints).where(eq(trainingModuleKeyPoints.moduleId, moduleContent.id));
      
      if (moduleContent.videoUrl) {
        await db.update(trainingModules)
          .set({ 
            videoUrl: moduleContent.videoUrl,
            isInteractive: true 
          })
          .where(eq(trainingModules.id, moduleContent.id));
      }
      
      for (const section of moduleContent.sections) {
        await db.insert(trainingModuleSections).values({
          moduleId: moduleContent.id,
          title: section.title,
          content: section.content,
          sortOrder: section.sortOrder
        });
      }
      console.log(`[Seed] Created ${moduleContent.sections.length} sections`);
      
      for (const kp of moduleContent.keyPoints) {
        await db.insert(trainingModuleKeyPoints).values({
          moduleId: moduleContent.id,
          point: kp.point,
          sortOrder: kp.sortOrder
        });
      }
      console.log(`[Seed] Created ${moduleContent.keyPoints.length} key points`);
      
      const quizId = `quiz-${moduleContent.id}`;
      const quizSlug = moduleContent.id.replace(/[^a-z0-9-]/g, '-');
      const existingQuizzes = await db.select().from(quizzes).where(eq(quizzes.id, quizId)).limit(1);
      
      if (existingQuizzes.length === 0) {
        await db.insert(quizzes).values({
          id: quizId,
          slug: quizSlug,
          title: `${moduleContent.title} Quiz`,
          description: `Assessment quiz for ${moduleContent.title}`,
          difficulty: 'beginner',
          passingScore: 80,
          timeLimit: 15
        });
        
        await db.insert(moduleQuizzes).values({
          moduleId: moduleContent.id,
          quizId: quizId
        }).onConflictDoNothing();
      }
      
      for (let i = 0; i < moduleContent.quiz.length; i++) {
        const q = moduleContent.quiz[i];
        const questionId = `${quizId}-q${i + 1}`;
        
        const existingQ = await db.select().from(quizQuestions).where(eq(quizQuestions.id, questionId)).limit(1);
        if (existingQ.length === 0) {
          await db.insert(quizQuestions).values({
            id: questionId,
            quizId: quizId,
            questionText: q.question,
            sortOrder: i
          });
          
          for (let j = 0; j < q.options.length; j++) {
            await db.insert(quizAnswers).values({
              questionId: questionId,
              answerText: q.options[j],
              isCorrect: j === q.correctAnswer,
              sortOrder: j
            });
          }
        }
      }
      console.log(`[Seed] Created ${moduleContent.quiz.length} quiz questions`);
      
      await db.update(trainingModules)
        .set({ isInteractive: true, hasQuiz: true })
        .where(eq(trainingModules.id, moduleContent.id));
      
      results.push({ 
        id: moduleContent.id, 
        status: 'success',
        sections: moduleContent.sections.length,
        keyPoints: moduleContent.keyPoints.length,
        questions: moduleContent.quiz.length
      });
      
    } catch (error: any) {
      console.error(`[Seed] Error processing ${moduleContent.id}:`, error.message);
      results.push({ id: moduleContent.id, status: 'error', error: error.message });
    }
  }
  
  console.log('[Seed] Remaining modules content generation complete!');
  return {
    modulesProcessed: results.length,
    successful: results.filter(r => r.status === 'success').length,
    results
  };
}
