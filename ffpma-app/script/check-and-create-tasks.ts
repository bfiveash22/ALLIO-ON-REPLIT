import "dotenv/config";
import { db } from "../server/db";
import { agentTasks } from "../shared/schema";
import { eq, like, or } from "drizzle-orm";

async function run() {
  console.log("Checking for tasks...\n");
  
  const allTasks = await db.select({
    id: agentTasks.id,
    agentId: agentTasks.agentId,
    title: agentTasks.title,
    status: agentTasks.status
  }).from(agentTasks);

  console.log(`Total tasks in DB: ${allTasks.length}`);

  const bakerTasks = allTasks.filter(t => t.agentId === 'DR_BAKER');
  console.log(`\nDR_BAKER tasks: ${bakerTasks.length}`);
  bakerTasks.forEach(t => console.log(`- ${t.title}`));

  const formulaTasks = allTasks.filter(t => t.agentId?.includes('FORMULA') || t.agentId?.includes('formula'));
  console.log(`\nDR_FORMULA tasks: ${formulaTasks.length}`);
  formulaTasks.forEach(t => console.log(`- ${t.title}`));

  const chiroTasks = allTasks.filter(t => t.agentId?.includes('CHIRO') || t.agentId?.includes('chiro'));
  console.log(`\nCHIRO tasks: ${chiroTasks.length}`);
  chiroTasks.forEach(t => console.log(`- ${t.title}`));

  // If there are no Chiro tasks, let's create them!
  if (chiroTasks.length === 0) {
    console.log("\nFound 0 CHIRO tasks. Creating the 5 training/curriculum tasks for CHIRO now...");

    const newChiroTasks = [
      {
        agentId: "CHIRO",
        title: "Level 1 Foundations Training",
        description: "Search Google Drive for Level 1 Foundations materials, verify completeness, and generate an onboarding summary.",
        status: "pending" as const,
        priority: 1,
        division: "science"
      },
      {
        agentId: "CHIRO",
        title: "Level 2 NET Curriculum",
        description: "Analyze and compile all Neuro Emotional Technique materials into a cohesive syllabus.",
        status: "pending" as const,
        priority: 1,
        division: "science"
      },
      {
        agentId: "CHIRO",
        title: "Level 3 QUANTUM Protocol",
        description: "Review Quantum methods documentation and map the frequency combinations for training purposes.",
        status: "pending" as const,
        priority: 1,
        division: "science"
      },
      {
        agentId: "CHIRO",
        title: "Practitioner Onboarding Guide",
        description: "Draft the comprehensive training manual for new chiropractors joining the PMA.",
        status: "pending" as const,
        priority: 2,
        division: "science"
      },
      {
        agentId: "CHIRO",
        title: "Curriculum Consistency Audit",
        description: "Review all 3 levels of training to ensure cross-level consistency and smooth progression.",
        status: "pending" as const,
        priority: 3,
        division: "science"
      }
    ];

    for (const task of newChiroTasks) {
      await db.insert(agentTasks).values(task);
    }
    console.log("CHIRO tasks successfully inserted.");
  }

  // Check if DR FORMULA needs the protocol tasks
  if (formulaTasks.length === 3) {
      console.log("\nInjecting missing FFPMA 2026 Protocol extraction tasks for DR_FORMULA...");
      await db.insert(agentTasks).values({
        agentId: "DR_FORMULA",
        title: "FFPMA 2026 41-Slide Protocol Extraction",
        description: "Extract and structure all 41 slides from the FFPMA 2026 protocol. Organize it via the 5 Rs: REDUCE, REBALANCE, REACTIVATE, RESTORE, REVITALIZE to reduce intake from 60min to 15min.",
        status: "pending",
        priority: 1,
        division: "science"
      });
      console.log("DR_FORMULA protocol extraction task created.");
  }

  process.exit(0);
}
run();
