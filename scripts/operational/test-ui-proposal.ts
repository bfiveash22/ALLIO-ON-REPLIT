import { storage } from '../../artifacts/api-server/src/storage';
import fs from 'fs';
import path from 'path';

async function run() {
  console.log('Inserting mock UI Refactor Proposal from FORGE...');
  try {
    const filePath = path.resolve(process.cwd(), 'client/src/components/ui/button.tsx');
    const existingCode = fs.readFileSync(filePath, 'utf8');

    // Simulate FORGE adding a fancy hover scale effect to the button component
    const modifiedCode = existingCode.replace(
      '"bg-primary text-primary-foreground shadow hover:bg-primary/90"',
      '"bg-primary text-primary-foreground shadow hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"'
    );

    const proposal = await storage.createUiRefactorProposal({
      agentId: 'FORGE',
      targetFile: 'client/src/components/ui/button.tsx',
      proposedDiff: modifiedCode,
      description: 'Added smooth hover scaling animations to all primary buttons to enhance the premium feel of the Dashboard.',
      status: 'pending'
    });
    console.log('Successfully inserted mock UI Proposal. ID:', proposal.id);
  } catch (err) {
    console.error('Error inserting mock proposal:', err);
    process.exit(1);
  }
  process.exit(0);
}

run();
