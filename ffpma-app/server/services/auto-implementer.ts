import { db } from '../db';
import { implementedOutputs } from '../../shared/schema';
import { eq, inArray } from 'drizzle-orm';
import { getAllioStructure, getUncachableGoogleDriveClient, listFolderContents, trashDriveFile, findAllioFolder } from './drive';
import { sentinel } from './sentinel';
import { sendToTrustee } from './openclaw';
import { agents } from '../../shared/agents';
import * as fs from 'fs';
import * as path from 'path';

// Core engine for the 5-Step Agent Output Auto-Implementation Pipeline
class AutoImplementer {
    private isProcessing = false;

    public async runRetroactiveProcessing() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        try {
            console.log('[AUTO-IMPLEMENTER] Starting Output Detection Pipeline...');

            // **STEP 1: Detection & Agent Validation**
            const allioFolder = await findAllioFolder();
            if (!allioFolder) {
                console.warn('[AUTO-IMPLEMENTER] ALLIO folder not found. Aborting.');
                return;
            }

            const validAgents = new Set(agents.map(a => a.id.toUpperCase()));
            const allDriveFiles: Array<{ id: string; name: string; mimeType: string; agentId: string; modifiedTime: string }> = [];

            // Traverse manually: ALLIO -> 02_DIVISIONS -> Division -> Agent -> output -> Date folders
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
                                    // Ignore "ghost" agents not in agents.ts
                                    if (validAgents.has(agentIdUpper)) {
                                        const dateFolders = await listFolderContents(outputFolder.id);
                                        // Handle nested date folders (YYYY-MM-DD) or direct files
                                        for (const item of dateFolders) {
                                            if (item.mimeType === 'application/vnd.google-apps.folder') {
                                                const files = await listFolderContents(item.id);
                                                files.forEach(o => {
                                                    if (o.mimeType !== 'application/vnd.google-apps.folder') {
                                                        allDriveFiles.push({
                                                            id: o.id,
                                                            name: o.name,
                                                            mimeType: o.mimeType,
                                                            agentId: agentIdUpper,
                                                            modifiedTime: o.modifiedTime || o.createdTime || ''
                                                        });
                                                    }
                                                });
                                            } else {
                                                allDriveFiles.push({
                                                    id: item.id,
                                                    name: item.name,
                                                    mimeType: item.mimeType,
                                                    agentId: agentIdUpper,
                                                    modifiedTime: item.modifiedTime || item.createdTime || ''
                                                });
                                            }
                                        }
                                    } else {
                                        console.log(`[AUTO-IMPLEMENTER] Ignored ghost agent output folder: ${agentFolder.name}`);
                                    }
                                }
                            }
                        }
                    }
                }
            }

            console.log(`[AUTO-IMPLEMENTER] Detected ${allDriveFiles.length} raw outputs in Google Drive.`);

            // **STEP 1b: Deduplication**
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

            // Trash duplicates
            for (const id of duplicateIdsToTrash) {
                try {
                    await trashDriveFile(id);
                } catch (err) {
                    console.error(`[AUTO-IMPLEMENTER] Failed to trash duplicate ${id}`);
                }
            }

            if (duplicateIdsToTrash.length > 0) {
                console.log(`[AUTO-IMPLEMENTER] Trashed ${duplicateIdsToTrash.length} duplicate outputs.`);
            }

            const uniqueFiles = Array.from(latestFiles.values());
            if (uniqueFiles.length === 0) return;

            const existingRecords = await db.select().from(implementedOutputs)
                .where(inArray(implementedOutputs.driveFileId, uniqueFiles.map(f => f.id)));

            const processedIds = new Set(existingRecords.map(r => r.driveFileId));
            const unprocessedFiles = uniqueFiles.filter(f => !processedIds.has(f.id));

            console.log(`[AUTO-IMPLEMENTER] Backlog remaining: ${unprocessedFiles.length} unique files to process.`);

            let successCount = 0;
            let reviewCount = 0;
            let failCount = 0;

            for (const file of unprocessedFiles) {
                // **STEP 2: Validation & Triage**
                const category = this.categorizeOutput(file.name, file.agentId);
                let finalStatus: 'pending_review' | 'deployed_successfully' | 'deployment_failed' | 'ignored' = 'pending_review';
                let targetPath: string | null = null;
                let errorMessage: string | null = null;
                let backupPath: string | null = null;

                // Apply strict safety rules per Trustee instructions
                if (category === 'legal' || category === 'financial') {
                    // Rule: Legal/Financial -> ALWAYS Trustee Approval
                    finalStatus = 'pending_review';
                    reviewCount++;
                    console.log(`[AUTO-IMPLEMENTER] Safety Rule applied: ${file.name} requires manual review.`);
                    await sendToTrustee('SENTINEL', `Safety Rule Applied: ${file.agentId} generated a ${category} output (${file.name}) requiring manual review.`, 'high');
                } else if (category === 'member_data') {
                    finalStatus = 'pending_review';
                    reviewCount++;
                } else {
                    try {
                        // **STEP 3 & 4: Auto-Deployment & Rollback**
                        if (category === 'code') {
                            await sendToTrustee('SENTINEL', `Auto-implementing code from ${file.agentId}: ${file.name}.\nTargeting direct deployment.`, 'urgent');
                            const deploymentResult = await this.deployCode(file);
                            targetPath = deploymentResult.targetPath;
                            backupPath = deploymentResult.backupPath;
                            finalStatus = 'deployed_successfully';
                            successCount++;
                            fs.writeFileSync(path.join(process.cwd(), '.rebuild-needed'), Date.now().toString());
                            await sendToTrustee('SENTINEL', `Code deployed from ${file.agentId}: ${file.name}. Run: npm run build && pm2 restart allio-v1 --update-env`, 'urgent');
                        } else if (category === 'knowledge_base') {
                            await sendToTrustee('SENTINEL', `Routing new knowledge base document from ${file.agentId}: ${file.name}`, 'normal');
                            const deploymentResult = await this.deployKnowledgeBase(file);
                            targetPath = deploymentResult.targetPath;
                            backupPath = deploymentResult.backupPath;
                            finalStatus = 'deployed_successfully';
                            successCount++;
                        } else if (category === 'recommendation') {
                            await sendToTrustee('SENTINEL', `New recommendation from ${file.agentId}: ${file.name}. Awaiting Trustee review.`, 'high');
                            
                            // If it's a UI/UX PDF from FORGE/SYNTHESIS, import it directly to the UI Refactor Proposals table
                            if (file.name.toLowerCase().endsWith('.pdf') && ['FORGE', 'SYNTHESIS'].includes(file.agentId)) {
                                try {
                                    const { uiRefactorProposals } = await import('../../shared/schema');
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
                                    
                                    // Make sure we have a web view link for the preview
                                    const metaRes = await driveClient.files.get({ fileId: file.id, fields: 'webViewLink' });
                                    const webViewLink = metaRes.data.webViewLink || '';

                                    await db.insert(uiRefactorProposals).values({
                                        agentId: file.agentId,
                                        targetFile: file.name.replace('.pdf', ''),
                                        proposedDiff: parsedText.substring(0, 10000), // Store up to 10k chars of the extracted text as the "diff" proposal
                                        description: `[Automatic Extraction] PDF Design Proposal: ${file.name}`,
                                        previewImageUrl: webViewLink, // Use Google drive link as preview fallback
                                        status: 'pending'
                                    });
                                    console.log(`[AUTO-IMPLEMENTER] Injected PDF Flow Optimization into UI Proposals: ${file.name}`);
                                } catch (err) {
                                    console.error(`[AUTO-IMPLEMENTER] Failed to inject UI Proposal for ${file.name}:`, err);
                                }
                            }

                            finalStatus = 'pending_review';
                            reviewCount++;
                        } else if (category === 'copy' || category === 'marketing') {
                            const driveClient = await getUncachableGoogleDriveClient();
                            const res = await driveClient.files.get({ fileId: file.id, alt: 'media' }, { responseType: 'arraybuffer' });
                            const buffer = Buffer.from(res.data as ArrayBuffer);
                            const outputDir = path.join(process.cwd(), 'dist/public/assets/auto');
                            if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
                            const outputPath = path.join(outputDir, file.name);
                            fs.writeFileSync(outputPath, buffer);
                            targetPath = outputPath;
                            finalStatus = 'deployed_successfully';
                            successCount++;
                        } else {
                            finalStatus = 'ignored';
                        }
                    } catch (err: any) {
                        errorMessage = err.message;
                        finalStatus = 'deployment_failed';
                        failCount++;
                        await sendToTrustee('SENTINEL', `Deployment FAILED for ${file.name} from ${file.agentId}: ${errorMessage}`, 'urgent');

                        // **STEP 4: Rollback execution if failed mid-flight**
                        if (backupPath && targetPath) {
                            console.log(`[AUTO-IMPLEMENTER] Rolling back ${targetPath} to ${backupPath}`);
                            if (fs.existsSync(backupPath)) {
                                fs.copyFileSync(backupPath, targetPath);
                            }
                        }
                    }
                }

                // Save record to database
                await db.insert(implementedOutputs).values({
                    driveFileId: file.id,
                    fileName: file.name,
                    mimeType: file.mimeType,
                    agentId: file.agentId,
                    category,
                    status: finalStatus as any,
                    targetPath,
                    backupPath,
                    errorLog: errorMessage,
                    deployedAt: finalStatus === 'deployed_successfully' ? new Date() : null,
                });
            }

            // **STEP 5: Notification**
            if (unprocessedFiles.length > 0) {
                await sentinel.notify({
                    type: 'system_alert',
                    title: `Auto-Implementation Report: ${unprocessedFiles.length} objects processed`,
                    message: `Pipeline Results:\n✓ Deployed: ${successCount}\n⚠️ Pending Review: ${reviewCount}\n❌ Failed/Rolled-back: ${failCount}`,
                    agentId: 'SENTINEL',
                    division: 'executive',
                    priority: 3
                });
            }

        } catch (error) {
            console.error('[AUTO-IMPLEMENTER] Fatal error during pipeline execution:', error);
            await sendToTrustee('SENTINEL', `Fatal error in Auto-Implementer pipeline: ${error}`, 'urgent');
        } finally {
            this.isProcessing = false;
        }
    }

    private categorizeOutput(fileName: string, agentId: string): string {
        const nameLower = fileName.toLowerCase();

        // Safety matching based on agent or filename
        if (agentId === 'JURIS' || nameLower.includes('legal') || nameLower.includes('contract') || nameLower.includes('agreement') || nameLower.includes('pma')) {
            return 'legal';
        }
        if (agentId === 'ATLAS' || nameLower.includes('invoice') || nameLower.includes('financial') || nameLower.includes('price')) {
            return 'financial';
        }
        if (nameLower.includes('patient') || nameLower.includes('member') || nameLower.includes('profile')) {
            return 'member_data';
        }

        // Science / Support -> Knowledge Base
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

        // Auto-deployable types
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

        // Remove markdown block backticks if present (Drive docs might embed them)
        if (content.match(/```[a-z]*\n/)) {
            // Roughly replace starting/ending markdown ticks
            content = content.replace(/[\s\S]*?```[a-z]*\n/m, '');
            content = content.replace(/\n```[\s\S]*$/, '');
        }

        const safeRelative = targetRelativePath.startsWith('/') ? targetRelativePath.substring(1) : targetRelativePath;
        const resolvedTargetPath = path.resolve(projectRoot, safeRelative);

        if (!resolvedTargetPath.startsWith(projectRoot)) {
            throw new Error(`Path traversal attempt blocked: ${resolvedTargetPath}`);
        }

        const backupPath = resolvedTargetPath + `.backup-${Date.now()}`;

        // Ensure directory exists
        const dir = path.dirname(resolvedTargetPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Create Backup
        if (fs.existsSync(resolvedTargetPath)) {
            fs.copyFileSync(resolvedTargetPath, backupPath);
        } else {
            // Create an empty backup so rollback just deletes it
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
