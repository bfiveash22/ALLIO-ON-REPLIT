# Environment & Deployment Rules

## 1. Local Environment
- **Operating System:** Windows
- **Development Tooling:** Ensure scripts and commands consider Windows environments (e.g., using cross-env, handling backward slashes `\`, etc.). 

## 2. Production Environment (VPS)
- **Operating System:** Linux (Ubuntu/Debian)
- **Deployment Mechanics:** When pushing code to the Linux VPS from the Windows local machine, deployment payloads must be packaged carefully to avoid directory flattening (e.g., use `pscp -r` or `tar` instead of Windows native zip tools).

## 3. Post-Deployment Protocol
- **Restart Required:** ANY deployment to the Linux VPS MUST be followed by the appropriate process restart (e.g., `pm2 restart allio-v1`). Deploying a linux code into VPS and restarting is mandatory.
- **Path Considerations:** Always account for forward slashes `/` on the Linux end. Do not use Windows-specific references on the server.
