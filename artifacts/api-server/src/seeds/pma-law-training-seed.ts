import { db } from "../db";
import { trainingTracks, trainingModules, trackModules, agentTasks, dianeKnowledge } from "@shared/schema";
import { sql } from "drizzle-orm";

export const pmaLawTrainingTrackData = {
  id: "pma-law-principles",
  title: "PMA Principles & Common Law",
  slug: "pma-law-principles",
  description: "Essential legal foundations for PMA members. Understanding Common Law principles, constitutional rights, and private member association protections.",
  imageUrl: "https://drive.google.com/uc?id=1PMA_LAW_COVER",
  totalModules: 8,
  estimatedDuration: "12 hours",
  difficulty: "intermediate" as const,
  isActive: true,
  requiresMembership: true,
};

export const pmaLawModules = [
  {
    id: "pma-101-legal-systems",
    title: "Understanding Legal Systems",
    slug: "pma-101-legal-systems",
    description: "Learn the fundamental difference between Civil Code and Common Law systems, and why the U.S. operates under English Common Law.",
    category: "PMA Law Foundations",
    sortOrder: 1,
    duration: "60 min",
    difficulty: "beginner" as const,
    isActive: true,
    requiresMembership: true,
    imageUrl: "https://drive.google.com/uc?id=1IMG_LEGAL_SYSTEMS",
  },
  {
    id: "pma-102-common-law-origins",
    title: "Origins of Common Law",
    slug: "pma-102-common-law-origins",
    description: "Explore how Common Law was derived from custom and usage over time, and how it differs from Civil Law declarations.",
    category: "PMA Law Foundations",
    sortOrder: 2,
    duration: "75 min",
    difficulty: "beginner" as const,
    isActive: true,
    requiresMembership: true,
    imageUrl: "https://drive.google.com/uc?id=1IMG_COMMON_LAW",
  },
  {
    id: "pma-103-constitutional-rights",
    title: "Constitutional Rights & Protections",
    slug: "pma-103-constitutional-rights",
    description: "Deep dive into the 14th Amendment, equal protection, and how the Constitution is the supreme law of the land.",
    category: "Constitutional Law",
    sortOrder: 3,
    duration: "90 min",
    difficulty: "intermediate" as const,
    isActive: true,
    requiresMembership: true,
    imageUrl: "https://drive.google.com/uc?id=1IMG_CONSTITUTIONAL",
  },
  {
    id: "pma-104-state-action",
    title: "State Action & Federal Authority",
    slug: "pma-104-state-action",
    description: "Understanding the relationship between state and federal power, including landmark cases like Marbury v. Madison.",
    category: "Constitutional Law",
    sortOrder: 4,
    duration: "90 min",
    difficulty: "intermediate" as const,
    isActive: true,
    requiresMembership: true,
    imageUrl: "https://drive.google.com/uc?id=1IMG_STATE_ACTION",
  },
  {
    id: "pma-105-pma-structure",
    title: "Private Member Association Structure",
    slug: "pma-105-pma-structure",
    description: "Learn how PMAs operate within the legal framework, member rights, and the protections afforded to private associations.",
    category: "PMA Operations",
    sortOrder: 5,
    duration: "120 min",
    difficulty: "intermediate" as const,
    isActive: true,
    requiresMembership: true,
    imageUrl: "https://drive.google.com/uc?id=1IMG_PMA_STRUCTURE",
  },
  {
    id: "pma-106-freedom-contract",
    title: "Freedom of Contract",
    slug: "pma-106-freedom-contract",
    description: "Explore the constitutional right to enter private contracts and how it protects PMA member agreements.",
    category: "PMA Operations",
    sortOrder: 6,
    duration: "75 min",
    difficulty: "intermediate" as const,
    isActive: true,
    requiresMembership: true,
    imageUrl: "https://drive.google.com/uc?id=1IMG_CONTRACT",
  },
  {
    id: "pma-107-case-law",
    title: "Key Case Law & Precedents",
    slug: "pma-107-case-law",
    description: "Study important court decisions that establish the legal foundation for PMA operations including U.S. v. Caldwell and Cooper v. Aaron.",
    category: "Legal Precedents",
    sortOrder: 7,
    duration: "90 min",
    difficulty: "advanced" as const,
    isActive: true,
    requiresMembership: true,
    imageUrl: "https://drive.google.com/uc?id=1IMG_CASE_LAW",
  },
  {
    id: "pma-108-practical-application",
    title: "Practical Application for Members",
    slug: "pma-108-practical-application",
    description: "Apply legal principles to real-world PMA scenarios, member interactions, and compliance requirements.",
    category: "Practical Skills",
    sortOrder: 8,
    duration: "90 min",
    difficulty: "intermediate" as const,
    isActive: true,
    requiresMembership: true,
    imageUrl: "https://drive.google.com/uc?id=1IMG_PRACTICAL",
  },
];

export const pmaLawKnowledgeEntries = [
  {
    category: "research" as const,
    title: "Common Law vs Civil Law Systems",
    summary: "Understanding the two primary legal systems in the world and how they affect your rights.",
    content: `COMMON LAW vs CIVIL LAW SYSTEMS

There are two (2) types of legal systems in the world:
1. Civil Code
2. Common Law

The basis of our legal system in the U.S. is English Common Law. Each state in the U.S., except Louisiana, has Common Law for the basis of its legal system.

TYPES OF COMMON LAW:
1. Common Law of England
2. Common Law of Several States
...expressed either by Statute or Court Decisions or both.

KEY DIFFERENCES:

COMMON LAW:
- Derived from custom and usage over a period of time
- Generally accepted by the people through written and reported court decisions
- You can do anything EXCEPT what the law forbids
- Statutes should be nothing more than written declarations of common law

CIVIL LAW:
- Derived from declarations of the persons in power
- You cannot do anything EXCEPT what the law authorizes

This fundamental distinction is critical for understanding your rights as a PMA member. Under Common Law, you have inherent rights that exist unless specifically prohibited, whereas under Civil Law, you only have rights that are explicitly granted.`,
    sourceDocument: "ForgottenFormula PMA Principles Law Reference Manual 2024",
    driveFileId: "1PMA_LAW_MANUAL",
    tags: ["common law", "civil law", "legal systems", "PMA", "constitutional rights"],
    relatedProducts: [],
    relatedGenes: [],
    isActive: true,
  },
  {
    category: "research" as const,
    title: "The 14th Amendment & Equal Protection",
    summary: "How the 14th Amendment protects your constitutional rights against state action.",
    content: `THE 14TH AMENDMENT & EQUAL PROTECTION

The controlling legal principle: The command of the Fourteenth Amendment is that no 'State' shall deny to any person within its jurisdiction the equal protection of the laws.

STATE ACTION DOCTRINE:
'A State acts by its legislative, its executive, or its judicial authorities. It can act in no other way.'

The constitutional provision means that NO agency of the State, or of the officers or agents by whom its powers are exerted, shall deny to any person within its jurisdiction the equal protection of the laws.

KEY PRINCIPLE:
'Whoever, by virtue of public position under a State government, denies or takes away the equal protection of the laws, violates the constitutional inhibition; and as he acts in the name and for the State, and is clothed with the State's power, his act is that of the State.'
- Ex parte Virginia, 100 U.S. 339, 347

THE SUPREMACY CLAUSE (Article VI):
The Constitution is the 'supreme Law of the Land.'

Chief Justice Marshall in Marbury v. Madison (1803):
'It is emphatically the province and duty of the judicial department to say what the law is.'

This decision established that the federal judiciary is supreme in the exposition of the law of the Constitution - a permanent and indispensable feature of our constitutional system.

BINDING EFFECT:
Art. VI makes constitutional interpretations of binding effect on the States 'any Thing in the Constitution or Laws of any State to the Contrary notwithstanding.'

Every state legislator, executive, and judicial officer is solemnly committed by oath (Art. VI, ¶3) 'to support this Constitution.'`,
    sourceDocument: "ForgottenFormula PMA Principles Law Reference Manual 2024",
    driveFileId: "1PMA_LAW_MANUAL",
    tags: ["14th amendment", "equal protection", "state action", "supremacy clause", "constitutional law"],
    relatedProducts: [],
    relatedGenes: [],
    isActive: true,
  },
  {
    category: "research" as const,
    title: "U.S. v. Caldwell - Limits on Government Power",
    summary: "The landmark case establishing limits on government's power to criminalize private conduct.",
    content: `U.S. v. CALDWELL - 989 F.2d 1056 (9th Cir. 1993)

This important case addresses the limits of government power to prosecute citizens for "obstructing" the government.

KEY HOLDING:
The court stated it cannot "lightly infer that in enacting 18 U.S.C. § 371 Congress meant to forbid all things that obstruct the government, or require citizens to do all those things that could make the government's job easier."

CRITICAL PRINCIPLE:
"So long as they don't act dishonestly or deceitfully" - citizens are not required to make the government's job easier.

IMPLICATIONS FOR PMA MEMBERS:
1. Private agreements between members are protected
2. Government cannot criminalize private conduct simply because it doesn't assist their enforcement
3. Honest, non-deceptive private transactions remain protected
4. The burden is on government to prove dishonesty or deceit

This case reinforces the Common Law principle that citizens can do anything except what the law specifically forbids, rather than needing permission for every action.`,
    sourceDocument: "ForgottenFormula PMA Principles Law Reference Manual 2024",
    driveFileId: "1PMA_LAW_MANUAL",
    tags: ["US v Caldwell", "government power", "obstruction", "case law", "PMA protection"],
    relatedProducts: [],
    relatedGenes: [],
    isActive: true,
  },
];

export const pmaLegalAgentTask = {
  agentId: "JURIS",
  division: "legal" as const,
  title: "Review & Learn PMA Principles Law Reference Manual",
  description: `PRIORITY LEARNING ASSIGNMENT

Document: ForgottenFormula PMA Principles Law Reference Manual 2024 (173 pages)

OBJECTIVES:
1. Review the complete PMA Principles & Law Reference Manual
2. Extract key legal principles relevant to PMA operations
3. Identify case law precedents that support PMA structure
4. Create compliance checklists for member protection
5. Prepare internal guidance documents for team

KEY AREAS TO FOCUS:
- Common Law vs Civil Law distinctions
- 14th Amendment protections
- State action doctrine
- Supremacy Clause implications
- Freedom of contract principles
- U.S. v. Caldwell precedent

DELIVERABLES:
- Summary brief of key legal principles (2-3 pages)
- Compliance checklist for PMA operations
- Training notes for staff education
- Legal FAQ for member inquiries

DEADLINE: Within 7 days
PRIORITY: High

Report findings to ATHENA upon completion.`,
  status: "pending" as const,
  priority: 1,
  assignedBy: "SENTINEL",
};

export const pmaMarketingAgentTask = {
  agentId: "MUSE",
  division: "marketing" as const,
  title: "Bring PMA Law Training to Life - Create Engaging Content",
  description: `CREATIVE BRIEF: PMA Law Education Campaign

OBJECTIVE:
Transform the PMA Principles & Law Reference Manual into engaging, accessible content for members.

BRAND VOICE:
- Empowering and educational
- Professional but approachable
- Trust-building and reassuring
- ALLIO unified healing energy

DELIVERABLES REQUESTED:

1. VIDEO CONTENT (assign to PRISM):
   - 3-5 minute animated explainer: "Your Rights Under Common Law"
   - Member testimonial compilation on PMA benefits
   - Brief legal concept videos for each training module

2. VISUAL ASSETS (assign to PEXEL):
   - Infographic series: "Common Law vs Civil Law"
   - Social media graphics (carousel format)
   - Training module cover images
   - Quote cards from key case law

3. WRITTEN CONTENT:
   - Member newsletter article
   - Blog post series (3-4 articles)
   - Email campaign for training launch
   - FAQ document in plain language

4. INTERACTIVE ELEMENTS:
   - Quiz questions for training modules
   - Discussion prompts for community
   - Knowledge check assessments

TARGET AUDIENCE: PMA Members, New Signups, Health Practitioners

TIMELINE: 
- Phase 1 (Week 1): Visual assets and infographics
- Phase 2 (Week 2): Video production begins
- Phase 3 (Week 3): Written content and launch

Coordinate with Legal (JURIS) for accuracy review before publishing.

PRIORITY: High
Report progress to ATHENA weekly.`,
  status: "pending" as const,
  priority: 1,
  assignedBy: "SENTINEL",
};

export async function seedPMALawTraining() {
  console.log("[Seed] Starting PMA Law Training seed...");
  
  try {
    // 1. Create the training track with proper roleAccess array
    await db.insert(trainingTracks).values({
      ...pmaLawTrainingTrackData,
      roleAccess: ["admin", "member", "doctor"],
    }).onConflictDoNothing();
    console.log("[Seed] Created PMA Law training track");
    
    // 2. Create the training modules
    for (const module of pmaLawModules) {
      await db.insert(trainingModules).values(module).onConflictDoNothing();
    }
    console.log(`[Seed] Created ${pmaLawModules.length} training modules`);
    
    // 3. Link modules to track
    for (let i = 0; i < pmaLawModules.length; i++) {
      await db.insert(trackModules).values({
        trackId: pmaLawTrainingTrackData.id,
        moduleId: pmaLawModules[i].id,
        sortOrder: i + 1,
        isRequired: true,
      }).onConflictDoNothing();
    }
    console.log("[Seed] Linked modules to track");
    
    // 4. Add knowledge base entries
    for (const entry of pmaLawKnowledgeEntries) {
      await db.insert(dianeKnowledge).values(entry).onConflictDoNothing();
    }
    console.log(`[Seed] Added ${pmaLawKnowledgeEntries.length} knowledge base entries`);
    
    // 5. Create Legal agent task (skip if ANY copy exists in any status)
    const existingJuris = await db.select({ id: agentTasks.id }).from(agentTasks)
      .where(sql`LOWER(agent_id) = 'juris' AND LOWER(title) = LOWER(${pmaLegalAgentTask.title})`)
      .limit(1);
    if (existingJuris.length === 0) {
      await db.insert(agentTasks).values(pmaLegalAgentTask);
      console.log("[Seed] Created Legal division task for JURIS");
    } else {
      console.log("[Seed] JURIS PMA Law task already exists, skipping");
    }

    // 6. Create Marketing agent task (skip if ANY copy exists in any status)
    const existingMuse = await db.select({ id: agentTasks.id }).from(agentTasks)
      .where(sql`LOWER(agent_id) = 'muse' AND LOWER(title) = LOWER(${pmaMarketingAgentTask.title})`)
      .limit(1);
    if (existingMuse.length === 0) {
      await db.insert(agentTasks).values(pmaMarketingAgentTask);
      console.log("[Seed] Created Marketing division task for MUSE");
    } else {
      console.log("[Seed] MUSE PMA Law task already exists, skipping");
    }

    return {
      success: true,
      track: pmaLawTrainingTrackData.title,
      modulesCreated: pmaLawModules.length,
      knowledgeEntries: pmaLawKnowledgeEntries.length,
      agentTasks: {
        legal: pmaLegalAgentTask.title,
        marketing: pmaMarketingAgentTask.title,
      },
    };
  } catch (error: any) {
    console.error("[Seed] Error seeding PMA Law training:", error);
    throw error;
  }
}
