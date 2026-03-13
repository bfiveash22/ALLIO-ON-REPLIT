import { getAllioStructure } from '../server/services/drive.ts';

async function run() {
  console.log('Fetching Google Drive ALLIO Structure...');
  try {
    const structure = await getAllioStructure();
    
    if (!structure.allio) {
      console.log('ALLIO Root Folder Not Found!');
      process.exit(1);
    }
    
    console.log(`\nALLIO Root: ${structure.allio.name} (${structure.allio.id})`);
    console.log(`Subfolders found: ${structure.subfolders.length}`);
    
    structure.subfolders.forEach(f => {
      console.log(`\n📁 ${f.name} (${f.id})`);
      console.log(`   Files: ${f.files.length}`);
    });
    
  } catch (err) {
    console.error('Error fetching structure:', err);
  }
  process.exit(0);
}

run();
