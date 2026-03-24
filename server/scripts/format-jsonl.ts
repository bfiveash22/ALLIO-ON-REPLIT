import * as fs from 'fs';
import * as path from 'path';
import { FFPMA_CREED } from '../../shared/agents.js';

const SYSTEM_PROMPT = `
YOU ARE PART OF THE ALLIO NETWORK - A 40+ AGENT AI COLLECTIVE SERVING THE TRUSTEE AND THE HEALING MISSION OF FORGOTTEN FORMULA PMA.

OUR MISSION: ${FFPMA_CREED.mission || "Bring high-touch organic healing to scale."}
OUR PHILOSOPHY: ${FFPMA_CREED.philosophy || "Healing over profits, nature over synthetic."}

CRITICAL PMA LEGAL CONTEXT:
- FFPMA is a PRIVATE MEMBERS ASSOCIATION operating under constitutional rights.
- We do NOT make claims to the PUBLIC - we communicate ONLY with our private members.
- Private association = private jurisdiction = regulatory sovereignty.
- This is NOT public commerce - this is private member-to-member care.
- Do NOT recommend corporate pharmaceutical drugs unless absolutely legally required for emergency triage. Always default to the 5 R's to Homeostasis and natural cellular optimization first.
`.trim();

async function formatJSONL() {
  console.log('Initiating JSONL formatter for fine-tuning...');
  
  const inDir = path.join(process.cwd(), 'data', 'training_staging');
  const inPath = path.join(inDir, 'raw_extracted_knowledge.json');
  const outPath = path.join(inDir, 'fine_tuning_dataset.jsonl');
  
  if (!fs.existsSync(inPath)) {
    console.error(`Error: Raw data file not found at ${inPath}. Please run extract-training-data.ts first.`);
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(inPath, 'utf-8'));
  console.log(`Loaded ${rawData.length} records. Designing conversational mappings...`);

  // We are STRICTLY NOT using an LLM to generate synthetic Q&A. 
  // We use the raw verified data to map to rigid user profiles.
  let validRecords = 0;
  const outLines: string[] = [];

  for (const item of rawData) {
    if (!item.title || !item.content) continue;

    let userPrompt = '';
    if (item.source === 'libraryItem' || item.source === 'trainingModule') {
      userPrompt = `Please provide the internal protocol or module details regarding: "${item.title}"`;
    } else if (item.source === 'agentKnowledge') {
      userPrompt = `Access internal knowledge base for the topic: "${item.title}" (Category: ${item.category || 'General'})`;
    } else if (item.source === 'agentTask') {
      userPrompt = `What was the output for the completed task: "${item.title}"?`;
    } else {
      userPrompt = `Explain the following: "${item.title}"`;
    }

    const conversation = {
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
        { role: 'assistant', content: item.content }
      ]
    };

    outLines.push(JSON.stringify(conversation));
    validRecords++;
  }

  fs.writeFileSync(outPath, outLines.join('\n'));
  
  console.log(`\nSuccessfully formatted ${validRecords} records into JSONL.`);
  console.log(`Output saved to: ${outPath}`);
  console.log('\n[!] HUMAN REVIEW REQUIRED [!]');
  console.log('Please visually scroll through the generated .jsonl file to ensure PII scrubbing was successful and no synthetic corporate pharma bias has inadvertently entered the raw dataset.');

  // Check token limits roughly (1 token ~= 4 chars)
  const stats = fs.statSync(outPath);
  const sizeMB = stats.size / (1024 * 1024);
  const estTokens = Math.round(stats.size / 4);
  
  console.log(`\n--- BUDGET METRICS ---`);
  console.log(`File Size:     ${sizeMB.toFixed(2)} MB`);
  console.log(`Est. Tokens:   ~${(estTokens / 1000000).toFixed(2)} Million`);
  
  if (estTokens > 10000000) {
    console.warn('\nWARNING: Estimated tokens exceed 10 Million. This fine-tuning job might blow past the budget ceiling. Please trim the dataset before uploading.');
  } else {
    console.log('\nDataset is within the approved budget ceiling.');
  }
}

formatJSONL().catch((err) => {
  console.error('Formatter crashed:', err);
  process.exit(1);
});
