import { db } from '../db';
import { implementedOutputs, agentTasks } from '@shared/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { getUncachableGoogleDriveClient, listFolderContents, trashDriveFile, findAllioFolder, createSubfolder } from './drive';
import { sentinel } from './sentinel';
import { sendToTrustee } from './openclaw';
import { orchestrator } from './sentinel-orchestrator';
import { agents } from '@shared/agents';
import * as fs from 'fs';
import * as path from 'path';

const OFFICIAL_ALLIO_FOLDER_ID = "1ui5cbRdyVhIojeG44EYg17puOdt4bStH";

const KNOWN_LEGACY_FOLDERS = new Set([
    'TESLA', 'TITAN', 'GAVEL', 'LEAD-ENGINEER', 'CHIEF-SCIENCE', 'LEGAL-LEAD',
    'CHIEF_SCIENCE', 'LEAD_ENGINEER', 'LEGAL_LEAD',
]);

const DRIVE_FOLDER_ALIASES: Record<string, string> = {
    'DR_TRIAGE': 'DR-TRIAGE',
    'DR_FORMULA': 'DR-FORMULA',
    'MAX_MINERAL': 'MAX-MINERAL',
    'ALLIO_SUPPORT': 'ALLIO-SUPPORT',
};

const CROSS_AGENT_ROUTING_MAP: Record<string, string[]> = {
    'FORGE': ['DAEDALUS', 'ARACHNE', 'SERPENS'],
    'SYNTHESIS': ['FORGE', 'DAEDALUS'],
    'MUSE': ['PIXEL', 'PRISM', 'AURORA'],
    'HELIX': ['HIPPOCRATES', 'PARACELSUS'],
};

interface PipelineRunSummary {
    totalScanned: number;
    duplicatesTrashed: number;
    filesDeployed: number;
    filesPendingReview: number;
    filesFailed: number;
    filesIgnored: number;
    crossAgentRouted: number;
    tasksCompleted: number;
    tasksFailed: number;
    healthCheckPassed: boolean;
    healthCheckIssues: string[];
    startedAt: Date;
    completedAt: Date | null;
}

class AutoImplementer {
    private isProcessing = false;

    public checkGoogleOAuthSecrets(): { valid: boolean; missing: string[] } {
        const required = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN'];
        const missing = required.filter(key => !process.env[key]);
        return { valid: missing.length === 0, missing };
    }

    public async runDriveFolderHealthCheck(): Promise<{ healthy: boolean; issues: string[] }> {
        const issues: string[] = [];

        try {
            const driveClient = await getUncachableGoogleDriveClient();
            try {
                const testAccess = await driveClient.files.get({
                    fileId: OFFICIAL_ALLIO_FOLDER_ID,
                    fields: 'id, name',
                });
                if (!testAccess.data.id) {
                    issues.push(`ALLIO root folder (${OFFICIAL_ALLIO_FOLDER_ID}) is not accessible`);
                    return { healthy: false, issues };
                }
            } catch (accessErr: any) {
                issues.push(`ALLIO root folder (${OFFICIAL_ALLIO_FOLDER_ID}) access failed: ${accessErr.message}`);
                return { healthy: false, issues };
            }

            const allioContents = await listFolderContents(OFFICIAL_ALLIO_FOLDER_ID);
            if (allioContents.length === 0) {
                issues.push(`ALLIO folder (${OFFICIAL_ALLIO_FOLDER_ID}) returned empty - may be inaccessible`);
                return { healthy: false, issues };
            }

            const divisionsFolder = allioContents.find(f => f.name === '02_DIVISIONS' && f.mimeType === 'application/vnd.google-apps.folder');
            if (!divisionsFolder) {
                issues.push('02_DIVISIONS folder not found inside ALLIO');
                return { healthy: false, issues };
            }

            const divisions = await listFolderContents(divisionsFolder.id);
            if (divisions.length === 0) {
                issues.push('02_DIVISIONS folder is empty - no division folders found');
                return { healthy: false, issues };
            }

            const registeredAgents = new Set(agents.map(a => a.id.toUpperCase()));
            const foundAgents = new Set<string>();
            const agentsWithOutput = new Set<string>();

            for (const divisionFolder of divisions) {
                if (divisionFolder.mimeType !== 'application/vnd.google-apps.folder') continue;

                const agentFolders = await listFolderContents(divisionFolder.id);
                for (const agentFolder of agentFolders) {
                    if (agentFolder.mimeType !== 'application/vnd.google-apps.folder') continue;

                    const agentIdUpper = agentFolder.name.toUpperCase();
                    const resolvedId = DRIVE_FOLDER_ALIASES[agentIdUpper] || agentIdUpper;
                    if (KNOWN_LEGACY_FOLDERS.has(agentIdUpper)) continue;
                    if (!registeredAgents.has(resolvedId)) continue;

                    foundAgents.add(resolvedId);
                    const agentSubFolders = await listFolderContents(agentFolder.id);
                    const outputFolder = agentSubFolders.find(f => f.name.toLowerCase() === 'output');
                    if (outputFolder) {
                        agentsWithOutput.add(resolvedId);
                    } else {
                        issues.push(`Agent ${resolvedId} in ${divisionFolder.name} has no output folder`);
                    }
                }
            }

            for (const agentId of registeredAgents) {
                if (!foundAgents.has(agentId)) {
                    issues.push(`Registered agent ${agentId} has no folder in 02_DIVISIONS`);
                }
            }

            if (foundAgents.size === 0) {
                issues.push('No registered agent folders found in any division');
            }

            console.log(`[AUTO-IMPLEMENTER] Health check: ${foundAgents.size}/${registeredAgents.size} agent folders found, ${agentsWithOutput.size} with output folders, ${issues.length} issues`);

        } catch (error: any) {
            issues.push(`Drive health check error: ${error.message}`);
        }

        const criticalIssues = issues.filter(i =>
            !i.startsWith('Agent ') && !i.startsWith('Registered agent ')
        );
        return { healthy: criticalIssues.length === 0, issues };
    }

    private verifyDeployedFile(targetPath: string, category: string): { verified: boolean; reason: string } {
        try {
            if (!fs.existsSync(targetPath)) {
                return { verified: false, reason: `File does not exist at ${targetPath}` };
            }

            const stats = fs.statSync(targetPath);
            if (stats.size === 0) {
                return { verified: false, reason: `File at ${targetPath} is empty (0 bytes)` };
            }

            if (category === 'code') {
                const content = fs.readFileSync(targetPath, 'utf-8');
                if (content.trim().length === 0) {
                    return { verified: false, reason: `Code file at ${targetPath} contains only whitespace` };
                }
            }

            if (category === 'knowledge_base') {
                try {
                    fs.readFileSync(targetPath, 'utf-8');
                } catch {
                    return { verified: false, reason: `Knowledge base file at ${targetPath} is not readable` };
                }
            }

            if (category === 'copy' || category === 'marketing') {
                const publicDir = path.join(process.cwd(), 'dist/public/assets/auto');
                if (!targetPath.startsWith(publicDir)) {
                    return { verified: false, reason: `Marketing asset not in public directory: ${targetPath}` };
                }
            }

            return { verified: true, reason: 'Verification passed' };
        } catch (error: any) {
            return { verified: false, reason: `Verification error: ${error.message}` };
        }
    }

    private detectCrossAgentNeed(file: { name: string; agentId: string }, category: string): string | null {
        const nameLower = file.name.toLowerCase();
        const sourceAgent = file.agentId.toUpperCase();

        if (sourceAgent === 'FORGE' && (nameLower.includes('component') || nameLower.includes('ui'))) {
            return 'DAEDALUS';
        }
        if (sourceAgent === 'SYNTHESIS' && (nameLower.includes('data') || nameLower.includes('schema'))) {
            return 'FORGE';
        }
        if (sourceAgent === 'MUSE' && (nameLower.includes('visual') || nameLower.includes('design'))) {
            return 'PIXEL';
        }
        if (sourceAgent === 'HELIX' && (nameLower.includes('protocol') || nameLower.includes('research'))) {
            return 'HIPPOCRATES';
        }

        const targets = CROSS_AGENT_ROUTING_MAP[sourceAgent];
        if (targets && nameLower.includes('handoff')) {
            return targets[0];
        }

        return null;
    }

    private async routeToAgent(
        file: { id: string; name: string; mimeType: string; agentId: string },
        targetAgentId: string
    ): Promise<boolean> {
        try {
            const targetAgent = agents.find(a => a.id.toUpperCase() === targetAgentId.toUpperCase());
            if (!targetAgent) {
                console.error(`[AUTO-IMPLEMENTER] Cross-agent routing failed: target agent ${targetAgentId} not found`);
                return false;
            }

            let fileCopied = false;
            try {
                const driveClient = await getUncachableGoogleDriveClient();
                const allioContents = await listFolderContents(OFFICIAL_ALLIO_FOLDER_ID);
                const divisionsFolder = allioContents.find(f => f.name === '02_DIVISIONS' && f.mimeType === 'application/vnd.google-apps.folder');

                if (divisionsFolder) {
                    const divisions = await listFolderContents(divisionsFolder.id);
                    for (const divFolder of divisions) {
                        if (divFolder.mimeType !== 'application/vnd.google-apps.folder') continue;
                        const agentFolders = await listFolderContents(divFolder.id);
                        const targetFolder = agentFolders.find(f =>
                            f.mimeType === 'application/vnd.google-apps.folder' &&
                            f.name.toUpperCase() === targetAgentId.toUpperCase()
                        );
                        if (targetFolder) {
                            const subFolders = await listFolderContents(targetFolder.id);
                            let inputFolder = subFolders.find(f => f.name.toLowerCase() === 'input');
                            if (!inputFolder) {
                                const created = await createSubfolder(targetFolder.id, 'input');
                                inputFolder = { id: created.id, name: created.name, mimeType: 'application/vnd.google-apps.folder' };
                            }

                            await driveClient.files.copy({
                                fileId: file.id,
                                requestBody: {
                                    name: `[FROM_${file.agentId}] ${file.name}`,
                                    parents: [inputFolder.id],
                                },
                            });
                            fileCopied = true;
                            console.log(`[AUTO-IMPLEMENTER] File copied to ${targetAgentId}/input in Drive: ${file.name}`);
                            break;
                        }
                    }
                }
            } catch (driveErr: any) {
                console.error(`[AUTO-IMPLEMENTER] Drive file copy for cross-agent routing failed: ${driveErr.message}`);
                await sendToTrustee('SENTINEL', `Cross-agent file transfer failed: ${file.name} from ${file.agentId} to ${targetAgentId}. Error: ${driveErr.message}`, 'high');
                return false;
            }

            if (!fileCopied) {
                console.error(`[AUTO-IMPLEMENTER] Could not find target agent ${targetAgentId} folder in Drive for file transfer`);
                await sendToTrustee('SENTINEL', `Cross-agent routing failed: target folder for ${targetAgentId} not found in Drive`, 'high');
                return false;
            }

            await orchestrator.assignTask({
                agentId: targetAgentId,
                title: `Process handoff from ${file.agentId}: ${file.name}`,
                description: `File "${file.name}" from ${file.agentId} has been copied to your Drive input folder for further processing.`,
                priority: 2,
                assignedBy: 'AUTO-IMPLEMENTER',
                crossDivisionFrom: agents.find(a => a.id.toUpperCase() === file.agentId)?.division,
                crossDivisionTo: targetAgent.division,
            });

            console.log(`[AUTO-IMPLEMENTER] Cross-agent file routed: ${file.name} from ${file.agentId} -> ${targetAgentId}`);
            return true;
        } catch (error: any) {
            console.error(`[AUTO-IMPLEMENTER] Cross-agent routing error:`, error);
            return false;
        }
    }

    private async linkOutputToAgentTask(
        file: { id: string; agentId: string; name: string },
        implementationStatus: 'deployed_successfully' | 'deployment_failed',
        errorMessage: string | null
    ): Promise<boolean> {
        try {
            const matchByDriveFileId = await db.select().from(agentTasks)
                .where(eq(agentTasks.outputDriveFileId, file.id));

            let task = matchByDriveFileId.length > 0 ? matchByDriveFileId[0] : null;

            if (!task) {
                const inProgressTasks = await db.select().from(agentTasks)
                    .where(
                        and(
                            eq(agentTasks.agentId, file.agentId),
                            eq(agentTasks.status, 'in_progress')
                        )
                    );

                if (inProgressTasks.length === 1) {
                    task = inProgressTasks[0];
                }
            }

            if (!task) {
                console.log(`[AUTO-IMPLEMENTER] No matching task found for ${file.agentId} output ${file.name} - skipping task link`);
                return false;
            }

            if (implementationStatus === 'deployed_successfully') {
                await db.update(agentTasks).set({
                    status: 'completed',
                    completedAt: new Date(),
                    outputDriveFileId: file.id,
                    evidenceVerified: true,
                    evidenceVerifiedAt: new Date(),
                    evidenceNotes: 'Auto-verified by implementation pipeline',
                    updatedAt: new Date(),
                }).where(eq(agentTasks.id, task.id));

                console.log(`[AUTO-IMPLEMENTER] Task ${task.id} (${task.title}) marked complete via implementation verification`);
            } else {
                const currentRetryCount = task.retryCount || 0;
                await db.update(agentTasks).set({
                    status: 'needs_retry',
                    retryCount: currentRetryCount + 1,
                    errorLog: errorMessage || 'Implementation verification failed',
                    lastErrorAt: new Date(),
                    nextRetryAt: new Date(Date.now() + 15 * 60 * 1000),
                    updatedAt: new Date(),
                }).where(eq(agentTasks.id, task.id));

                await sendToTrustee('SENTINEL', `Task "${task.title}" for ${file.agentId} failed implementation and needs retry (attempt ${currentRetryCount + 1}). Error: ${errorMessage}`, 'high');
                console.log(`[AUTO-IMPLEMENTER] Task ${task.id} (${task.title}) set to needs_retry`);
            }

            return true;
        } catch (error: any) {
            console.error(`[AUTO-IMPLEMENTER] Error linking output to task:`, error);
            return false;
        }
    }

    private sanitizeFileName(fileName: string): string {
        return path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
    }

    public async runRetroactiveProcessing() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        const summary: PipelineRunSummary = {
            totalScanned: 0,
            duplicatesTrashed: 0,
            filesDeployed: 0,
            filesPendingReview: 0,
            filesFailed: 0,
            filesIgnored: 0,
            crossAgentRouted: 0,
            tasksCompleted: 0,
            tasksFailed: 0,
            healthCheckPassed: false,
            healthCheckIssues: [],
            startedAt: new Date(),
            completedAt: null,
        };

        try {
            console.log('[AUTO-IMPLEMENTER] Starting Output Detection Pipeline...');

            const healthCheck = await this.runDriveFolderHealthCheck();
            summary.healthCheckPassed = healthCheck.healthy;
            summary.healthCheckIssues = healthCheck.issues;

            if (!healthCheck.healthy) {
                console.error('[AUTO-IMPLEMENTER] Critical health check failures - pausing pipeline');
                await sendToTrustee('SENTINEL',
                    `Auto-Implementer PAUSED: Drive folder health check failed.\n` +
                    `Issues:\n${healthCheck.issues.map(i => `- ${i}`).join('\n')}`,
                    'urgent'
                );
                summary.completedAt = new Date();
                await this.sendPipelineSummary(summary);
                return;
            }

            if (healthCheck.issues.length > 0) {
                await sendToTrustee('SENTINEL',
                    `Auto-Implementer health check warnings:\n${healthCheck.issues.map(i => `- ${i}`).join('\n')}`,
                    'normal'
                );
            }

            const allioFolder = await findAllioFolder();
            if (!allioFolder) {
                console.warn('[AUTO-IMPLEMENTER] ALLIO folder not found. Aborting.');
                return;
            }

            const validAgents = new Set(agents.map(a => a.id.toUpperCase()));
            const allDriveFiles: Array<{ id: string; name: string; mimeType: string; agentId: string; modifiedTime: string }> = [];

            const allioContents = await listFolderContents(allioFolder.id);
            const divisionsFolder = allioContents.find(f => f.name === '02_DIVISIONS' && f.mimeType === 'application/vnd.google-apps.folder');

            if (divisionsFolder) {
                const divisions = await listFolderContents(divisionsFolder.id);
                for (const divisionFolder of divisions) {
                    if (divisionFolder.mimeType === 'application/vnd.google-apps.folder') {
                        const agentFolders = await listFolderContents(divisionFolder.id);
                        for (const agentFolder of agentFolders) {
                            if (agentFolder.mimeType === 'application/vnd.google-apps.folder') {
                                const agentSubFolders = await listFolderContents(agentFolder.id);
                                const outputFolder = agentSubFolders.find(f => f.name.toLowerCase() === 'output');

                                if (outputFolder) {
                                    const agentIdUpper = agentFolder.name.toUpperCase();
                                    const resolvedAgentId = DRIVE_FOLDER_ALIASES[agentIdUpper] || agentIdUpper;
                                    if (KNOWN_LEGACY_FOLDERS.has(agentIdUpper)) {
                                        continue;
                                    } else if (validAgents.has(resolvedAgentId)) {
                                        const dateFolders = await listFolderContents(outputFolder.id);
                                        for (const item of dateFolders) {
                                            if (item.mimeType === 'application/vnd.google-apps.folder') {
                                                const files = await listFolderContents(item.id);
                                                files.forEach(o => {
                                                    if (o.mimeType !== 'application/vnd.google-apps.folder') {
                                                        allDriveFiles.push({
                                                            id: o.id,
                                                            name: o.name,
                                                            mimeType: o.mimeType,
                                                            agentId: resolvedAgentId,
                                                            modifiedTime: o.modifiedTime || o.createdTime || ''
                                                        });
                                                    }
                                                });
                                            } else {
                                                allDriveFiles.push({
                                                    id: item.id,
                                                    name: item.name,
                                                    mimeType: item.mimeType,
                                                    agentId: resolvedAgentId,
                                                    modifiedTime: item.modifiedTime || item.createdTime || ''
                                                });
                                            }
                                        }
                                    } else {
                                        console.log(`[AUTO-IMPLEMENTER] Skipping unrecognized agent folder: ${agentFolder.name}`);
                                    }
                                }
                            }
                        }
                    }
                }
            }

            summary.totalScanned = allDriveFiles.length;
            console.log(`[AUTO-IMPLEMENTER] Detected ${allDriveFiles.length} raw outputs in Google Drive.`);

            const latestFiles = new Map<string, typeof allDriveFiles[0]>();
            const duplicateIdsToTrash: string[] = [];

            for (const f of allDriveFiles) {
                const key = `${f.agentId}_${f.name}`;
                if (latestFiles.has(key)) {
                    const existing = latestFiles.get(key)!;
                    if (f.modifiedTime > existing.modifiedTime) {
                        duplicateIdsToTrash.push(existing.id);
                        latestFiles.set(key, f);
                    } else {
                        duplicateIdsToTrash.push(f.id);
                    }
                } else {
                    latestFiles.set(key, f);
                }
            }

            for (const id of duplicateIdsToTrash) {
                try {
                    await trashDriveFile(id);
                } catch (err) {
                    console.error(`[AUTO-IMPLEMENTER] Failed to trash duplicate ${id}`);
                }
            }

            summary.duplicatesTrashed = duplicateIdsToTrash.length;
            if (duplicateIdsToTrash.length > 0) {
                console.log(`[AUTO-IMPLEMENTER] Trashed ${duplicateIdsToTrash.length} duplicate outputs.`);
            }

            const uniqueFiles = Array.from(latestFiles.values());
            if (uniqueFiles.length === 0) {
                summary.completedAt = new Date();
                await this.sendPipelineSummary(summary);
                return;
            }

            const existingRecords = await db.select().from(implementedOutputs)
                .where(inArray(implementedOutputs.driveFileId, uniqueFiles.map(f => f.id)));

            const processedIds = new Set(existingRecords.map(r => r.driveFileId));
            const unprocessedFiles = uniqueFiles.filter(f => !processedIds.has(f.id));

            console.log(`[AUTO-IMPLEMENTER] Backlog remaining: ${unprocessedFiles.length} unique files to process.`);

            for (const file of unprocessedFiles) {
                const category = this.categorizeOutput(file.name, file.agentId);
                let finalStatus: 'pending_review' | 'deployed_successfully' | 'deployment_failed' | 'rolled_back' | 'ignored' = 'pending_review';
                let targetPath: string | null = null;
                let errorMessage: string | null = null;
                let backupPath: string | null = null;

                const crossAgentTarget = this.detectCrossAgentNeed(file, category);
                if (crossAgentTarget) {
                    const routed = await this.routeToAgent(file, crossAgentTarget);
                    if (routed) {
                        summary.crossAgentRouted++;
                        console.log(`[AUTO-IMPLEMENTER] File ${file.name} routed to ${crossAgentTarget} for processing`);
                    }
                }

                if (category === 'legal' || category === 'financial') {
                    finalStatus = 'pending_review';
                    summary.filesPendingReview++;
                    console.log(`[AUTO-IMPLEMENTER] Safety Rule applied: ${file.name} requires manual review.`);
                    await sendToTrustee('SENTINEL', `Safety Rule Applied: ${file.agentId} generated a ${category} output (${file.name}) requiring manual review.`, 'high');
                } else if (category === 'member_data') {
                    finalStatus = 'pending_review';
                    summary.filesPendingReview++;
                } else {
                    try {
                        if (category === 'code') {
                            await sendToTrustee('SENTINEL', `Auto-implementing code from ${file.agentId}: ${file.name}.\nTargeting direct deployment.`, 'urgent');
                            const deploymentResult = await this.deployCode(file);
                            targetPath = deploymentResult.targetPath;
                            backupPath = deploymentResult.backupPath;

                            const verification = this.verifyDeployedFile(targetPath, category);
                            if (verification.verified) {
                                finalStatus = 'deployed_successfully';
                                summary.filesDeployed++;
                                fs.writeFileSync(path.join(process.cwd(), '.rebuild-needed'), Date.now().toString());
                                await sendToTrustee('SENTINEL', `Code deployed and verified from ${file.agentId}: ${file.name}. Run: npm run build && pm2 restart allio-v1 --update-env`, 'urgent');
                            } else {
                                console.error(`[AUTO-IMPLEMENTER] Verification failed for ${file.name}: ${verification.reason}`);
                                if (backupPath && fs.existsSync(backupPath)) {
                                    fs.copyFileSync(backupPath, targetPath);
                                    console.log(`[AUTO-IMPLEMENTER] Rolled back ${targetPath}`);
                                }
                                finalStatus = 'rolled_back';
                                errorMessage = `Verification failed, rolled back: ${verification.reason}`;
                                summary.filesFailed++;
                                await sendToTrustee('SENTINEL', `Deployment verification FAILED for ${file.name} from ${file.agentId}: ${verification.reason}. Rolled back.`, 'urgent');
                            }
                        } else if (category === 'knowledge_base') {
                            await sendToTrustee('SENTINEL', `Routing new knowledge base document from ${file.agentId}: ${file.name}`, 'normal');
                            const deploymentResult = await this.deployKnowledgeBase(file);
                            targetPath = deploymentResult.targetPath;
                            backupPath = deploymentResult.backupPath;

                            const verification = this.verifyDeployedFile(targetPath, category);
                            if (verification.verified) {
                                finalStatus = 'deployed_successfully';
                                summary.filesDeployed++;
                            } else {
                                if (backupPath && fs.existsSync(backupPath)) {
                                    fs.copyFileSync(backupPath, targetPath);
                                }
                                finalStatus = 'rolled_back';
                                errorMessage = `Verification failed, rolled back: ${verification.reason}`;
                                summary.filesFailed++;
                                await sendToTrustee('SENTINEL', `KB deployment verification FAILED for ${file.name}: ${verification.reason}. Rolled back.`, 'high');
                            }
                        } else if (category === 'recommendation') {
                            await sendToTrustee('SENTINEL', `New recommendation from ${file.agentId}: ${file.name}. Awaiting Trustee review.`, 'high');
                            
                            if (file.name.toLowerCase().endsWith('.pdf') && ['FORGE', 'SYNTHESIS'].includes(file.agentId)) {
                                try {
                                    const { uiRefactorProposals } = await import('@shared/schema');
                                    const { getUncachableGoogleDriveClient } = await import('./drive');
                                    const pdfParse = (await import('pdf-parse')).default;
                                    
                                    const driveClient = await getUncachableGoogleDriveClient();
                                    const res = await driveClient.files.get({ fileId: file.id, alt: 'media' }, { responseType: 'arraybuffer' });
                                    const buffer = Buffer.from(res.data as ArrayBuffer);
                                    
                                    let parsedText = '';
                                    try {
                                        const pdfData = await pdfParse(buffer);
                                        parsedText = pdfData.text;
                                    } catch (pdfErr) {
                                        console.error('[AUTO-IMPLEMENTER] PDF Parse Error:', pdfErr);
                                        parsedText = "Warning: Could not extract text from PDF. Please see the source document.";
                                    }
                                    
                                    const metaRes = await driveClient.files.get({ fileId: file.id, fields: 'webViewLink' });
                                    const webViewLink = metaRes.data.webViewLink || '';

                                    await db.insert(uiRefactorProposals).values({
                                        agentId: file.agentId,
                                        targetFile: file.name.replace('.pdf', ''),
                                        proposedDiff: parsedText.substring(0, 10000),
                                        description: `[Automatic Extraction] PDF Design Proposal: ${file.name}`,
                                        previewImageUrl: webViewLink,
                                        status: 'pending'
                                    });
                                    console.log(`[AUTO-IMPLEMENTER] Injected PDF Flow Optimization into UI Proposals: ${file.name}`);
                                } catch (err) {
                                    console.error(`[AUTO-IMPLEMENTER] Failed to inject UI Proposal for ${file.name}:`, err);
                                }
                            }

                            finalStatus = 'pending_review';
                            summary.filesPendingReview++;
                        } else if (category === 'copy' || category === 'marketing') {
                            const driveClient = await getUncachableGoogleDriveClient();
                            const res = await driveClient.files.get({ fileId: file.id, alt: 'media' }, { responseType: 'arraybuffer' });
                            const buffer = Buffer.from(res.data as ArrayBuffer);
                            const outputDir = path.join(process.cwd(), 'dist/public/assets/auto');
                            if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
                            const safeName = this.sanitizeFileName(file.name);
                            const outputPath = path.resolve(outputDir, safeName);
                            if (!outputPath.startsWith(outputDir)) {
                                throw new Error(`Path traversal attempt blocked for marketing asset: ${file.name}`);
                            }
                            fs.writeFileSync(outputPath, buffer);
                            targetPath = outputPath;

                            const verification = this.verifyDeployedFile(targetPath, category);
                            if (verification.verified) {
                                finalStatus = 'deployed_successfully';
                                summary.filesDeployed++;
                            } else {
                                try { fs.unlinkSync(outputPath); } catch {}
                                finalStatus = 'deployment_failed';
                                errorMessage = `Verification failed: ${verification.reason}`;
                                summary.filesFailed++;
                            }
                        } else {
                            finalStatus = 'ignored';
                            summary.filesIgnored++;
                        }
                    } catch (err: any) {
                        errorMessage = err.message;
                        finalStatus = 'deployment_failed';
                        summary.filesFailed++;
                        await sendToTrustee('SENTINEL', `Deployment FAILED for ${file.name} from ${file.agentId}: ${errorMessage}`, 'urgent');

                        if (backupPath && targetPath) {
                            console.log(`[AUTO-IMPLEMENTER] Rolling back ${targetPath} to ${backupPath}`);
                            if (fs.existsSync(backupPath)) {
                                fs.copyFileSync(backupPath, targetPath);
                            }
                        }
                    }
                }

                await db.insert(implementedOutputs).values({
                    driveFileId: file.id,
                    fileName: file.name,
                    mimeType: file.mimeType,
                    agentId: file.agentId,
                    category,
                    status: finalStatus,
                    targetPath,
                    backupPath,
                    errorLog: errorMessage,
                    deployedAt: finalStatus === 'deployed_successfully' ? new Date() : null,
                });

                if (finalStatus === 'deployed_successfully') {
                    const linked = await this.linkOutputToAgentTask(file, 'deployed_successfully', null);
                    if (linked) summary.tasksCompleted++;
                } else if (finalStatus === 'deployment_failed' || finalStatus === 'rolled_back') {
                    const linked = await this.linkOutputToAgentTask(file, 'deployment_failed', errorMessage);
                    if (linked) summary.tasksFailed++;
                }
            }

            if (unprocessedFiles.length > 0) {
                await sentinel.notify({
                    type: 'system_alert',
                    title: `Auto-Implementation Report: ${unprocessedFiles.length} objects processed`,
                    message: `Pipeline Results:\n` +
                        `Deployed: ${summary.filesDeployed}\n` +
                        `Pending Review: ${summary.filesPendingReview}\n` +
                        `Failed/Rolled-back: ${summary.filesFailed}\n` +
                        `Cross-Agent Routed: ${summary.crossAgentRouted}\n` +
                        `Tasks Closed: ${summary.tasksCompleted}`,
                    agentId: 'SENTINEL',
                    division: 'executive',
                    priority: 3
                });
            }

            summary.completedAt = new Date();
            await this.sendPipelineSummary(summary);

        } catch (error) {
            console.error('[AUTO-IMPLEMENTER] Fatal error during pipeline execution:', error);
            await sendToTrustee('SENTINEL', `Fatal error in Auto-Implementer pipeline: ${error}`, 'urgent');
            summary.completedAt = new Date();
            await this.sendPipelineSummary(summary);
        } finally {
            this.isProcessing = false;
        }
    }

    private async sendPipelineSummary(summary: PipelineRunSummary): Promise<void> {
        const duration = summary.completedAt
            ? Math.round((summary.completedAt.getTime() - summary.startedAt.getTime()) / 1000)
            : 0;

        const summaryMessage = [
            `Auto-Implementer Pipeline Run Summary`,
            `Duration: ${duration}s`,
            `Health Check: ${summary.healthCheckPassed ? 'PASSED' : 'ISSUES DETECTED'}`,
            summary.healthCheckIssues.length > 0 ? `Health Issues: ${summary.healthCheckIssues.length}` : null,
            ``,
            `Files Scanned: ${summary.totalScanned}`,
            `Duplicates Trashed: ${summary.duplicatesTrashed}`,
            `Files Deployed: ${summary.filesDeployed}`,
            `Files Pending Review: ${summary.filesPendingReview}`,
            `Files Failed: ${summary.filesFailed}`,
            `Files Ignored: ${summary.filesIgnored}`,
            `Cross-Agent Routed: ${summary.crossAgentRouted}`,
            ``,
            `Tasks Auto-Completed: ${summary.tasksCompleted}`,
            `Tasks Marked Failed: ${summary.tasksFailed}`,
        ].filter(Boolean).join('\n');

        await sendToTrustee('SENTINEL', summaryMessage, summary.filesFailed > 0 ? 'high' : 'normal');

        await sentinel.notify({
            type: 'system_alert',
            title: `Pipeline Run Complete - ${summary.filesDeployed} deployed, ${summary.filesFailed} failed`,
            message: summaryMessage,
            agentId: 'SENTINEL',
            division: 'executive',
            priority: summary.filesFailed > 0 ? 1 : 3,
        });

        console.log(`[AUTO-IMPLEMENTER] Pipeline summary sent. Deployed: ${summary.filesDeployed}, Failed: ${summary.filesFailed}, Review: ${summary.filesPendingReview}`);
    }

    private categorizeOutput(fileName: string, agentId: string): string {
        const nameLower = fileName.toLowerCase();

        if (agentId === 'JURIS' || nameLower.includes('legal') || nameLower.includes('contract') || nameLower.includes('agreement') || nameLower.includes('pma')) {
            return 'legal';
        }
        if (agentId === 'ATLAS' || nameLower.includes('invoice') || nameLower.includes('financial') || nameLower.includes('price')) {
            return 'financial';
        }
        if (nameLower.includes('patient') || nameLower.includes('member') || nameLower.includes('profile')) {
            return 'member_data';
        }

        const kbAgents = ['HIPPOCRATES', 'PARACELSUS', 'CHIRO', 'PROMETHEUS', 'DR-FORMULA', 'VITALIS', 'MICROBIA'];
        if (kbAgents.includes(agentId)) {
            return 'knowledge_base';
        }

        if (
            (nameLower.endsWith('.md') || nameLower.endsWith('.txt') || nameLower.endsWith('.pdf')) &&
            ['FORGE', 'SHIELD', 'SENTINEL', 'GUARDIAN', 'CIPHER', 'ATLAS', 'SYNTHESIS'].includes(agentId)
        ) {
            return 'recommendation';
        }

        if (nameLower.endsWith('.tsx') || nameLower.endsWith('.ts') || nameLower.endsWith('.js') || nameLower.endsWith('.css') || agentId === 'FORGE' || agentId === 'DAEDALUS' || agentId === 'ARACHNE' || agentId === 'ARCHITECT' || agentId === 'SERPENS') {
            return 'code';
        }
        if (nameLower.includes('copy') || agentId === 'MUSE' || nameLower.endsWith('.html') || nameLower.endsWith('.txt')) {
            return 'copy';
        }
        if (nameLower.endsWith('.png') || nameLower.endsWith('.jpg') || nameLower.endsWith('.mp4') || agentId === 'PIXEL' || agentId === 'PRISM' || agentId === 'AURORA') {
            return 'marketing';
        }

        return 'general';
    }

    private async deployCode(file: { id: string, name: string, mimeType: string }): Promise<{ targetPath: string, backupPath: string }> {
        const drive = await getUncachableGoogleDriveClient();
        let content = '';

        if (file.mimeType === 'application/vnd.google-apps.document') {
            const res = await drive.files.export({ fileId: file.id, mimeType: 'text/plain' });
            content = res.data as string;
        } else {
            const res = await drive.files.get({ fileId: file.id, alt: 'media' }, { responseType: 'text' });
            content = res.data as string;
        }

        const projectRoot = process.cwd();

        let targetRelativePath = file.name;
        const lines = content.split('\n');
        if (lines[0] && lines[0].includes('Target:')) {
            const match = lines[0].match(/Target:\s*(\S+)/);
            if (match && match[1]) {
                targetRelativePath = match[1];
            }
        }

        if (content.match(/```[a-z]*\n/)) {
            content = content.replace(/[\s\S]*?```[a-z]*\n/m, '');
            content = content.replace(/\n```[\s\S]*$/, '');
        }

        const safeRelative = targetRelativePath.startsWith('/') ? targetRelativePath.substring(1) : targetRelativePath;
        const resolvedTargetPath = path.resolve(projectRoot, safeRelative);

        if (!resolvedTargetPath.startsWith(projectRoot)) {
            throw new Error(`Path traversal attempt blocked: ${resolvedTargetPath}`);
        }

        const backupPath = resolvedTargetPath + `.backup-${Date.now()}`;

        const dir = path.dirname(resolvedTargetPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        if (fs.existsSync(resolvedTargetPath)) {
            fs.copyFileSync(resolvedTargetPath, backupPath);
        } else {
            fs.writeFileSync(backupPath, "EMPTY_BACKUP_MARKER");
        }

        fs.writeFileSync(resolvedTargetPath, content);

        return { targetPath: resolvedTargetPath, backupPath };
    }

    private async deployKnowledgeBase(file: { id: string, name: string, mimeType: string }): Promise<{ targetPath: string, backupPath: string }> {
        const drive = await getUncachableGoogleDriveClient();
        let content = '';

        if (file.mimeType === 'application/vnd.google-apps.document') {
            const res = await drive.files.export({ fileId: file.id, mimeType: 'text/plain' });
            content = res.data as string;
        } else {
            const res = await drive.files.get({ fileId: file.id, alt: 'media' }, { responseType: 'text' });
            content = res.data as string;
        }

        const projectRoot = process.cwd();
        const kbDir = path.join(projectRoot, 'knowledge-base');

        if (!fs.existsSync(kbDir)) {
            fs.mkdirSync(kbDir, { recursive: true });
        }

        const resolvedTargetPath = path.join(kbDir, file.name.endsWith('.md') ? file.name : `${file.name}.md`);
        const backupPath = resolvedTargetPath + `.backup-${Date.now()}`;

        if (fs.existsSync(resolvedTargetPath)) {
            fs.copyFileSync(resolvedTargetPath, backupPath);
        } else {
            fs.writeFileSync(backupPath, "EMPTY_BACKUP_MARKER");
        }

        fs.writeFileSync(resolvedTargetPath, content);

        return { targetPath: resolvedTargetPath, backupPath };
    }
}

export const autoImplementer = new AutoImplementer();
