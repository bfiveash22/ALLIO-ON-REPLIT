import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function run() {
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

  } catch (error) {
    console.error('❌ Connection or fetch failed:', error);
  } finally {
    ssh.dispose();
  }
}

run();
