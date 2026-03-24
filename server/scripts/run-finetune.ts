import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

// Initialize the OpenAI Client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Maximum token allocation per fine-tuning budget (e.g., 5,000,000 tokens)
// Gpt-4o-mini fine tuning costs ~$3.00 / 1M tokens, so 5M tokens is ~$15.00
const TOKEN_BUDGET_CEILING = 5000000; 

async function startFineTune() {
  console.log('Initiating Fine-Tuning Pipeline...');
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY environment variable is missing.');
    process.exit(1);
  }

  const inDir = path.join(process.cwd(), 'data', 'training_staging');
  const datasetPath = path.join(inDir, 'fine_tuning_dataset.jsonl');

  if (!fs.existsSync(datasetPath)) {
    console.error(`Error: Dataset not found at ${datasetPath}. Please run format-jsonl.ts first and HUMAN REVIEW the file.`);
    process.exit(1);
  }

  // Budget Validation
  const stats = fs.statSync(datasetPath);
  const sizeMB = stats.size / (1024 * 1024);
  const estimatedTokens = Math.round(stats.size / 4); // rough approximation
  
  console.log(`Dataset Size: ${sizeMB.toFixed(2)} MB`);
  console.log(`Estimated Tokens: ~${estimatedTokens}`);

  if (estimatedTokens > TOKEN_BUDGET_CEILING) {
    console.error(`\n[BUDGET ENFORCEMENT FAILURE]`);
    console.error(`Estimated token count (${estimatedTokens}) exceeds the strict programmatic budget ceiling of ${TOKEN_BUDGET_CEILING}.`);
    console.error(`To proceed, you must trim the dataset or explicitly increase TOKEN_BUDGET_CEILING in the script.`);
    process.exit(1);
  }

  try {
    // 1. Upload File
    console.log('\n[1/3] Uploading dataset to OpenAI...');
    const file = await openai.files.create({
      file: fs.createReadStream(datasetPath),
      purpose: 'fine-tune'
    });
    console.log(`✅ File uploaded successfully. File ID: ${file.id}`);

    // Wait a brief moment for the file to process
    console.log('Waiting for file indexing...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 2. Launch Job
    console.log('\n[2/3] Launching fine-tuning job...');
    const job = await openai.fineTuning.jobs.create({
      training_file: file.id,
      model: 'gpt-4o-mini-2024-07-18', // Standard highly efficient base model
      hyperparameters: {
        n_epochs: 3 // Start with 3 epochs to avoid overfitting the dogma
      }
    });

    console.log(`✅ Fine-Tuning Job created successfully!`);
    console.log(`Job ID: ${job.id}`);
    console.log(`Status: ${job.status}`);

    // 3. Monitor Instructions
    console.log('\n[3/3] Next Steps:');
    console.log(`The job is now running on OpenAI servers asynchronously. It may take several hours to complete.`);
    console.log(`Check the status using the OpenAI Dashboard or by calling:`);
    console.log(`npx vite-node eval "const OpenAI = require('openai'); new OpenAI().fineTuning.jobs.retrieve('${job.id}').then(console.log)"`);
    
  } catch (err: any) {
    console.error('\nAPI Operation Failed:', err.message);
    if (err.status === 401) {
      console.error('Check your OPENAI_API_KEY value.');
    }
  }
}

startFineTune();
