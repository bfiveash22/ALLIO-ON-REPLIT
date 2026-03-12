import { NodeSSH } from 'node-ssh';
import * as path from 'path';
import * as fs from 'fs';

const ssh = new NodeSSH();

async function fetchFiles() {
  console.log('🚀 Connecting to VPS to fetch OpenClaw workspace...');
  
  try {
    await ssh.connect({
      host: '130.49.160.73',
      username: 'root',
      password: 'cF1o5S44w11b',
      port: 22
    });
    
    console.log('✅ Connected to VPS via SSH');
    
    // Check what is in the workspace
    const lsResult = await ssh.execCommand('ls -laR /root/.openclaw/workspace/');
    console.log('\n--- Workspace Contents ---');
    console.log(lsResult.stdout);
    
    // Download the cannabinoids directory if it exists
    const remoteDir = '/root/.openclaw/workspace/ffpma-library/cannabinoids';
    const checkDir = await ssh.execCommand(`ls ${remoteDir}`);
    
    if (checkDir.code === 0) {
      const localKnowledgeBase = path.resolve('./knowledge-base/openclaw-exports');
      if (!fs.existsSync(localKnowledgeBase)) {
        fs.mkdirSync(localKnowledgeBase, { recursive: true });
      }
      
      console.log(`\n📥 Downloading files from ${remoteDir} to ${localKnowledgeBase}...`);
      await ssh.getDirectory(localKnowledgeBase, remoteDir);
      console.log('✅ Download complete.');
    } else {
        console.log(`\n❌ Could not find ${remoteDir} or it is empty.`);
    }
  } catch (error) {
    console.error('❌ Connection or fetch failed:', error);
  } finally {
    ssh.dispose();
  }
}

fetchFiles();
