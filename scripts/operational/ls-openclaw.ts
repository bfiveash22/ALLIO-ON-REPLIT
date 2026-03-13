import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function run() {
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

  } catch (error) {
    console.error('Connection or fetch failed:', error);
  } finally {
    ssh.dispose();
  }
}

run();
