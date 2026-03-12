import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const lines = envContent.split('\n');
let yamlContent = '';

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  
  const separatorIdx = trimmed.indexOf('=');
  if (separatorIdx === -1) continue;
  
  const key = trimmed.substring(0, separatorIdx).trim();
  let value = trimmed.substring(separatorIdx + 1).trim();
  
  // Remove wrapping quotes if present
  if (value.startsWith('"') && value.endsWith('"')) {
    value = value.substring(1, value.length - 1);
  } else if (value.startsWith("'") && value.endsWith("'")) {
    value = value.substring(1, value.length - 1);
  }
  
  // YAML string formatting for values with special characters
  yamlContent += `${key}: "${value.replace(/"/g, '\\"')}"\n`;
}

fs.writeFileSync('env.yaml', yamlContent);
console.log('Successfully created env.yaml');
