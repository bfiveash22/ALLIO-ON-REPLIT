import { NodeSSH } from 'node-ssh';
import * as path from 'path';

const ssh = new NodeSSH();

async function deploy() {
  console.log('Starting automated VPS deployment...');

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
    
    const localFile = path.resolve('allio-deploy-slides.zip');
    const remoteFile = '/root/allio-deploy-slides.zip';
    const targetDir = '/root/allio-v1';
    
    console.log('Uploading zip file...');
    await ssh.putFile(localFile, remoteFile);
    console.log('Upload complete');
    
    const commands = [
      `mkdir -p ${targetDir}`,
      `unzip -o ${remoteFile} -d ${targetDir}`,
      `cd ${targetDir} && npm install --production --force`,
      `cd ${targetDir} && pm2 delete allio-v1 2>/dev/null || true`,
      `cd ${targetDir} && pm2 start ecosystem.config.cjs`,
      `cd ${targetDir} && pm2 save`,
      `rm ${remoteFile}`
    ];
    
    console.log('Executing deployment commands on VPS...');
    
    for (const cmd of commands) {
        console.log(`> ${cmd}`);
        const result = await ssh.execCommand(cmd);
        if (result.stdout) console.log(result.stdout);
        if (result.stderr) console.error(result.stderr);
    }
    
    console.log('Deployment complete! Server is restarting.');
    
  } catch (error) {
    console.error('Deployment failed:', error);
  } finally {
    ssh.dispose();
  }
}

deploy();
