---
description: How to deploy the application from Windows to Linux VPS
---

# Windows to Linux VPS Deployment Rules

When deploying code or payloads from this local Windows machine to the production Linux VPS, you MUST follow these critical rules to prevent cross-platform file system corruption:

1. **NEVER USE NATIVE WINDOWS `tar` OR `Compress-Archive` FOR LINUX PAYLOADS.**
   - Windows archive utilities inject `\` (backslashes) into path separators.
   - When extracted on Ubuntu/Linux, these slashes break directory structures, causing files to extract completely flat or fail silently.

2. **USE DIRECT FOLDER TRANSFER (`pscp -r`) WITH EXPLICIT TARGETING INSTEAD.**
   - Do not zip or tar the `dist` folder.
   - However, **WARNING**: Windows `pscp` can unpredictably flatten directories if the target path evaluation is ambiguous.
   - To prevent the `dist` folder from flattening into the project root (causing PM2 `ERR_MODULE_NOT_FOUND` crashes), ALWAYS:
     1. Explicitly create the target sub-directory first: `mkdir -p $TargetDir/dist`
     2. Copy the contents using wildcards directly into the sub-directory: `pscp -r dist\* root@[VPS_IP]:/root/[PROJECT_DIR]/dist/`

3. **VERIFY DEPLOYMENT WITH SSH PRE-RESTART CHECKS.**
   - Before running `pm2 restart`, your remote bash execution script MUST perform an integrity check on the critical build file:
     ```bash
     if [ ! -f "dist/index.cjs" ]; then
         echo "❌ CRITICAL ERROR: dist/index.cjs was not found!"
         exit 1
     fi
     ```
   - This guarantees zero-downtime if the transfer silently fails or flattens.
