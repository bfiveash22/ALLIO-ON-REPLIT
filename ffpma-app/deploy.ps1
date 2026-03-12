# Allio v1 - One-Click Deployment Script
# This script will build your project and deploy it to your VPS.

$ServerIP = "130.49.160.73"
$ServerUser = "root"
$TargetDir = "/root/allio-v1"
$CounterFile = ".deploy_count"

# --- BLOAT PURGATORY (Rule of 3) ---
$DeployCount = 1
if (Test-Path $CounterFile) {
    $DeployCount = [int](Get-Content $CounterFile) + 1
}
Set-Content -Path $CounterFile -Value $DeployCount

if ($DeployCount % 3 -eq 0) {
    Write-Host "🧹 Rule of 3 Triggered: Initiating dual-sided bloat purge..." -ForegroundColor Magenta
    
    # 1. Purge Local Windows
    Write-Host "   -> Purging Local Windows Environment..." -ForegroundColor DarkGray
    Remove-Item -Force -Recurse @("vps-check.ts", "vps-deploy.ts", "deploy.js", "deploy-remote.sh", "deploy_bot", "db.log", "drizzle_push.log", "drizzle_utf8.log", "local_err.log", "local_err_utf8.log", "pm2_error_logs.txt", "pm2_out_logs.txt", "pm2_started_logs.txt", "ts_errors*.txt", "tsc_output*.txt", "vps-error.log", "vps-pm2.log", "vps_error.log", "vps_logs.txt", "allio-deploy-*.zip", "allio-deploy-*.tar", "deploy-drformula.zip", "deploy-ecosystem.zip", "deploy.zip", "dist.zip", "test.tar.gz", "backup-pre-cleanslate.zip", "check-agents.ts", "check-duplicates.ts", "check-failures.ts", "check-pending.ts", "check-pm2.ts", "check-queue.ts", "check-tasks.ts", "check-titan.ts", "db_check.ts", "db_check_out.txt", "working-auth-fix.js", "test-auth.js", "test-ml.ts", "test-tasks.ts", "purge-duplicates.ts", "reset-tasks.ts", "parse-pdf.cjs", "parse-pdf.js", "fix-schema.cjs", "fix-schema.js", "implementation_plan4") -ErrorAction SilentlyContinue

    # 2. Add Purge Commands to Remote Execution Block
    $RemotePurgeCmd = @"
echo "🧹 Purging Remote Linux Environment..."
cd $TargetDir
rm -rf vps-check.ts vps-deploy.ts deploy.js deploy-remote.sh deploy_bot db.log drizzle_push.log drizzle_utf8.log local_err.log local_err_utf8.log pm2_error_logs.txt pm2_out_logs.txt pm2_started_logs.txt ts_errors*.txt tsc_output*.txt vps-error.log vps-pm2.log vps_error.log vps_logs.txt allio-deploy-*.zip allio-deploy-*.tar deploy-drformula.zip deploy-ecosystem.zip deploy.zip dist.zip test.tar.gz backup-pre-cleanslate.zip check-agents.ts check-duplicates.ts check-failures.ts check-pending.ts check-pm2.ts check-queue.ts check-tasks.ts check-titan.ts db_check.ts db_check_out.txt working-auth-fix.js test-auth.js test-ml.ts test-tasks.ts purge-duplicates.ts reset-tasks.ts parse-pdf.cjs parse-pdf.js fix-schema.cjs fix-schema.js implementation_plan4
"@
}
else {
    $RemotePurgeCmd = ""
}

Write-Host "--- 🚀 Starting Allio Deployment to $ServerIP ---" -ForegroundColor Cyan

# 1. Build check
Write-Host "🔨 Building..." -ForegroundColor Yellow
npm run build

# 2. Upload to server
Write-Host "📤 Creating universal tar.gz payload..." -ForegroundColor Yellow
tar -czf allio-deploy.tar.gz dist package.json .env ecosystem.config.cjs

# Ensure the remote directory exists first
echo y | plink -batch -pw "cF1o5S44w11b" "${ServerUser}@${ServerIP}" "mkdir -p $TargetDir"

# Transfer the payload
Write-Host "   -> Transferring payload (allio-deploy.tar.gz)..." -ForegroundColor Cyan
pscp -pw "cF1o5S44w11b" allio-deploy.tar.gz "${ServerUser}@${ServerIP}:${TargetDir}/"

# 3. Remote execution
Write-Host "⚙️  Configuring server and launching..." -ForegroundColor Yellow
$RemoteCommand = @"
cd $TargetDir

echo "📦 Unpacking payload..."
tar -xzf allio-deploy.tar.gz
rm allio-deploy.tar.gz

# Pre-Restart Safety Check (Prevents PM2 crashes)
if [ ! -f "dist/index.cjs" ]; then
    echo "❌ CRITICAL ERROR: dist/index.cjs was not found after transfer!"
    echo "Aborting restart to prevent taking down the live site."
    exit 1
fi
echo "✅ Integrity Check Passed: dist/index.cjs exists."

# Install Node and PM2 if missing
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# Install dependencies and aggressively restart app to guarantee new code/env is loaded
echo "♻️ FORCING PM2 RESTART TO APPLY NEW CODE AND ENV VARIABLES..."
npm install --production
pm2 flush
pm2 restart allio-v1 --update-env || pm2 start ecosystem.config.cjs --update-env
pm2 save
pm2 startup
echo "✅ PM2 successfully rebooted with latest deployment."

# Nginx block removed to protect ffpma.com settings
# Verify Deployment (Rule 3)
echo "Verification: Checking dist/index.cjs modification time..."
ls -l dist/index.cjs

$RemotePurgeCmd

echo "✅ ALLIO DEPLOYMENT COMPLETE!"
echo "Check your site at: http://vm93616.vpsone.xyz"
"@

echo y | plink -batch -pw "cF1o5S44w11b" "${ServerUser}@${ServerIP}" "$RemoteCommand"

Write-Host "--- 🎉 Deployment Finished! ---" -ForegroundColor Green
