import 'dotenv/config';
import { db } from '@db';
import { libraryItems, trainingModules, agentKnowledge, agentTasks } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

function scrubPII(text: string | null): string {
  if (!text) return '';
  let scrubbed = text;
  scrubbed = scrubbed.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]');
  scrubbed = scrubbed.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE_REDACTED]');
  scrubbed = scrubbed.replace(/\(\d{3}\)\s*\d{3}[-.]?\d{4}\b/g, '[PHONE_REDACTED]');
  scrubbed = scrubbed.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN_REDACTED]');
  scrubbed = scrubbed.replace(/(Name|Patient|Member|Dr\.|Doctor):\s*[A-Z][a-z]+ [A-Z][a-z]+/g, '$1: [NAME_REDACTED]');
  return scrubbed;
}

async function extractTrainingData() {
  console.log('Starting data extraction for fine-tuning...');
  const extractedData: any[] = [];
  
  console.log('Extracting library items...');
  const library = await db.select().from(libraryItems).where(eq(libraryItems.isActive, true));
  for (const item of library) {
    if (item.content) {
      extractedData.push({ source: 'libraryItem', title: item.title, type: item.contentType, content: scrubPII(item.content) });
    }
  }

  console.log('Extracting training modules...');
  const modules = await db.select().from(trainingModules);
  for (const mod of modules) {
    if (mod.description) {
      extractedData.push({ source: 'trainingModule', title: mod.title, content: scrubPII(mod.description) });
    }
  }

  console.log('Extracting agent knowledge...');
  try {
    const knowledge = await db.select().from(agentKnowledge).where(eq(agentKnowledge.isActive, true));
    for (const k of knowledge) {
      if (k.content) {
        extractedData.push({ source: 'agentKnowledge', agentId: k.agentId, category: k.category, title: k.title, content: scrubPII(k.content) });
      }
    }
  } catch(e) { console.log('agentKnowledge extraction skipped / error: ', e.message); }

  console.log('Extracting historical tasks...');
  try {
    const tasks = await db.select().from(agentTasks).where(eq(agentTasks.status, 'completed')).orderBy(desc(agentTasks.completedAt)).limit(500);
    for (const task of tasks) {
      if (task.description) {
        extractedData.push({ source: 'agentTask', agentId: task.agentId, title: scrubPII(task.title), content: scrubPII(task.description) });
      }
    }
  } catch(e) { console.log('agentTasks extraction skipped / error: ', e.message); }

  const outDir = path.join(process.cwd(), 'data', 'training_staging');
  if (!fs.existsSync(outDir)) { fs.mkdirSync(outDir, { recursive: true }); }
  const outPath = path.join(outDir, 'raw_extracted_knowledge.json');
  fs.writeFileSync(outPath, JSON.stringify(extractedData, null, 2));
  
  console.log(`Extraction complete. Extracted ${extractedData.length} documents.`);
  console.log(`Saved to ${outPath}`);
  process.exit(0);
}

extractTrainingData().catch((err) => {
  console.error("Extraction failed:", err);
  process.exit(1);
});
