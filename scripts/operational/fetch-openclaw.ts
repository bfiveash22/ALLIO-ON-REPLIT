import { NodeSSH } from 'node-ssh';
import * as path from 'path';
import * as fs from 'fs';

const ssh = new NodeSSH();

async function fetchFiles() {
  console.log('Connecting to VPS to fetch OpenClaw workspace...');

  const host = process.env.VPS_HOST;
  const username = process.env.VPS_USERNAME || 'root';
  const password = process.env.VPS_PASSWORD;

  if (!host || !password) {
    console.error('Missing required environment variables: VPS_HOST, VPS_PASSWORD');
    process.exit(1);
  }
  
  try {
    await ssh.connect({ host, username, password, port: 22 });
    
    console.log('Connected to VPS via SSH');
    
    const lsResult = await ssh.execCommand('ls -laR /root/.openclaw/workspace/');
    console.log('\n--- Workspace Contents ---');
    console.log(lsResult.stdout);
    
    const remoteDir = '/root/.openclaw/workspace/ffpma-library/cannabinoids';
    const checkDir = await ssh.execCommand(`ls ${remoteDir}`);
    
    if (checkDir.code === 0) {
      const localKnowledgeBase = path.resolve('./knowledge-base/openclaw-exports');
      if (!fs.existsSync(localKnowledgeBase)) {
        fs.mkdirSync(localKnowledgeBase, { recursive: true });
      }
      
      console.log(`\nDownloading files from ${remoteDir} to ${localKnowledgeBase}...`);
      await ssh.getDirectory(localKnowledgeBase, remoteDir);
      console.log('Download complete.');
    } else {
        console.log(`\nCould not find ${remoteDir} or it is empty.`);
    }
  } catch (error) {
    console.error('Connection or fetch failed:', error);
  } finally {
    ssh.dispose();
  }
}

fetchFiles();
