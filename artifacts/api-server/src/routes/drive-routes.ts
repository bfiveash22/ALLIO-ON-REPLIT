import type { Express, Request, Response } from "express";
import { requireRole } from "../working-auth";
import multer from "multer";
import {
  checkDriveConnection, findAllioFolder, createAllioFolder,
  getAllioStructure, getMarketingStructure, setupAgentFolders,
  listFolderContents, getUncachableGoogleDriveClient,
  uploadMarketingAssets, uploadLegalDocuments,
  uploadBloodAnalysisFile, getBloodAnalysisUploads,
  uploadSkinAnalysisFile,
  createBakerFilesFolder, uploadToBakerFiles,
  uploadToAgentLibrary, listAgentLibraryFiles, deleteAgentLibraryFile,
  createPatientProtocolsFolder,
  getExternalFolderLinks, addExternalFolderLink, removeExternalFolderLink
} from "../services/drive";
import { ingestFileToLibrary, backfillAgentLibrary, getFileIndexingStatus, deleteIndexedFile } from "../services/library-ingestion";

const MAX_LIBRARY_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_LIBRARY_MIMETYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/epub+zip',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
];

const upload = multer({ storage: multer.memoryStorage() });

const libraryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_LIBRARY_FILE_SIZE }
});

export function registerDriveRoutes(app: Express): void {
  app.get("/api/drive/status", requireRole("admin"), async (req: Request, res: Response) => {
    try { res.json(await checkDriveConnection()); }
    catch (error: any) { res.status(500).json({ error: error.message, connected: false }); }
  });

  app.get("/api/drive/allio", requireRole("admin"), async (req: Request, res: Response) => {
    try { res.json(await getAllioStructure()); }
    catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.get("/api/drive/structure", requireRole("admin"), async (req: Request, res: Response) => {
    try { res.json(await getAllioStructure()); }
    catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.get("/api/drive/marketing-structure", requireRole("admin"), async (req: Request, res: Response) => {
    try { res.json(await getMarketingStructure()); }
    catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.get("/api/drive/all-divisions-structure", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { getAllDivisionsStructure } = await import("../services/drive");
      res.json(await getAllDivisionsStructure());
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.post("/api/drive/setup-folders", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      let allioFolder = await findAllioFolder();
      if (!allioFolder) allioFolder = await createAllioFolder();
      const result = await setupAgentFolders(allioFolder.id);
      res.json(result);
    } catch (error: any) { res.status(500).json({ error: error.message, success: false }); }
  });

  app.get("/api/drive/folder/:folderId", requireRole("admin"), async (req: Request, res: Response) => {
    try { res.json(await listFolderContents(req.params.folderId)); }
    catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.get("/api/drive/audit-visual-assets", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      console.log("[Drive Audit] Starting full visual asset audit...");
      const OFFICIAL_ALLIO_FOLDER_ID = "16wOdbJPoOVOz5GE0mtlzf84c896JX1UC";

      interface AssetInfo { id: string; name: string; mimeType: string; size: string; sizeBytes: number; folderPath: string; webViewLink: string; quality: 'HD' | 'medium' | 'low' | 'unknown'; type: 'video' | 'image' | 'document' | 'other'; }

      const getAssetType = (mimeType: string): 'video' | 'image' | 'document' | 'other' => {
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.includes('document') || mimeType.includes('pdf')) return 'document';
        return 'other';
      };

      const formatSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024; const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      };

      const assessQuality = (mimeType: string, sizeBytes: number): 'HD' | 'medium' | 'low' | 'unknown' => {
        const type = getAssetType(mimeType);
        if (type === 'video') { if (sizeBytes > 10 * 1024 * 1024) return 'HD'; if (sizeBytes > 2 * 1024 * 1024) return 'medium'; if (sizeBytes > 0) return 'low'; }
        else if (type === 'image') { if (sizeBytes > 500 * 1024) return 'HD'; if (sizeBytes > 100 * 1024) return 'medium'; if (sizeBytes > 0) return 'low'; }
        return 'unknown';
      };

      const drive = await getUncachableGoogleDriveClient();
      const allAssets: AssetInfo[] = [];

      const scanFolder = async (folderId: string, folderPath: string): Promise<void> => {
        let pageToken: string | undefined;
        do {
          const response = await drive.files.list({ q: `'${folderId}' in parents and trashed = false`, fields: 'nextPageToken, files(id, name, mimeType, size, webViewLink)', pageSize: 100, pageToken });
          const files = response.data.files || [];
          for (const file of files) {
            if (file.mimeType === 'application/vnd.google-apps.folder') { await scanFolder(file.id!, `${folderPath}/${file.name}`); }
            else {
              const sizeBytes = parseInt(file.size || '0');
              const type = getAssetType(file.mimeType!);
              if (type === 'video' || type === 'image') {
                allAssets.push({ id: file.id!, name: file.name!, mimeType: file.mimeType!, size: formatSize(sizeBytes), sizeBytes, folderPath, webViewLink: file.webViewLink || '', quality: assessQuality(file.mimeType!, sizeBytes), type });
              }
            }
          }
          pageToken = response.data.nextPageToken || undefined;
        } while (pageToken);
      };

      await scanFolder(OFFICIAL_ALLIO_FOLDER_ID, 'ALLIO');
      const hdVideos = allAssets.filter(a => a.type === 'video' && a.quality === 'HD');
      const hdImages = allAssets.filter(a => a.type === 'image' && a.quality === 'HD');
      const mediumVideos = allAssets.filter(a => a.type === 'video' && a.quality === 'medium');
      const mediumImages = allAssets.filter(a => a.type === 'image' && a.quality === 'medium');
      const lowQuality = allAssets.filter(a => a.quality === 'low');

      res.json({ summary: { totalVisualAssets: allAssets.length, hdVideos: hdVideos.length, hdImages: hdImages.length, mediumVideos: mediumVideos.length, mediumImages: mediumImages.length, lowQuality: lowQuality.length }, hdVideos, hdImages, mediumVideos, mediumImages, lowQuality });
    } catch (error: any) { console.error("[Drive Audit] Error:", error); res.status(500).json({ error: error.message }); }
  });

  app.post("/api/drive/upload-marketing-assets", requireRole("admin"), async (req: Request, res: Response) => {
    try { res.json(await uploadMarketingAssets()); }
    catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
  });

  app.post("/api/drive/upload-legal-documents", requireRole("admin"), async (req: Request, res: Response) => {
    try { res.json(await uploadLegalDocuments()); }
    catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
  });

  app.post("/api/blood-analysis/upload", requireRole("admin"), upload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) return res.status(400).json({ success: false, error: "No file uploaded" });
      const { patientId, analysisType } = req.body;
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];
      if (!allowedMimeTypes.includes(req.file.mimetype)) return res.status(400).json({ success: false, error: "Invalid file type." });
      if (req.file.size > 100 * 1024 * 1024) return res.status(400).json({ success: false, error: "File too large. Maximum size is 100MB." });
      const result = await uploadBloodAnalysisFile(req.file.buffer, req.file.originalname, req.file.mimetype, patientId, analysisType);
      res.json(result);
    } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
  });

  app.get("/api/blood-analysis/uploads", requireRole("admin"), async (req: Request, res: Response) => {
    try { res.json({ success: true, uploads: await getBloodAnalysisUploads() }); }
    catch (error: any) { res.status(500).json({ success: false, error: error.message, uploads: [] }); }
  });

  app.post("/api/skin-analysis/upload", requireRole("admin", "doctor"), upload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) return res.status(400).json({ success: false, error: "No file uploaded" });
      const { patientId } = req.body;
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedMimeTypes.includes(req.file.mimetype)) return res.status(400).json({ success: false, error: "Invalid file type. Please upload an image (JPEG, PNG, GIF, WebP)." });
      if (req.file.size > 50 * 1024 * 1024) return res.status(400).json({ success: false, error: "File too large. Maximum size is 50MB." });
      const result = await uploadSkinAnalysisFile(req.file.buffer, req.file.originalname, req.file.mimetype, patientId);
      res.json(result);
    } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
  });

  app.post("/api/drive/create-baker-folder", requireRole("admin"), async (req: Request, res: Response) => {
    try { res.json(await createBakerFilesFolder()); }
    catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
  });

  app.post("/api/drive/create-member-protocols-folder", requireRole("admin"), async (req: Request, res: Response) => {
    try { res.json(await createPatientProtocolsFolder()); }
    catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
  });
  app.post("/api/drive/create-patient-protocols-folder", requireRole("admin"), (req: Request, res: Response) => {
    res.redirect(307, "/api/drive/create-member-protocols-folder");
  });

  app.post("/api/drive/upload-baker-protocol", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { localPath, fileName } = req.body;
      if (!localPath) return res.status(400).json({ success: false, error: 'localPath is required' });
      res.json(await uploadToBakerFiles(localPath, fileName));
    } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
  });

  app.post("/api/agent-library/upload/:agentName", requireRole("admin"), (req: Request, res: Response, next) => {
    libraryUpload.array("files", 10)(req, res, (err: any) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ success: false, error: `File exceeds the 50MB size limit.` });
        }
        return res.status(400).json({ success: false, error: err.message || 'Upload error' });
      }
      next();
    });
  }, async (req: Request, res: Response) => {
    try {
      const { agentName } = req.params;
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) return res.status(400).json({ success: false, error: "No files uploaded" });

      const results = [];
      const errors: string[] = [];

      for (const file of files) {
        if (!ALLOWED_LIBRARY_MIMETYPES.includes(file.mimetype)) {
          errors.push(`${file.originalname}: Unsupported file type (${file.mimetype}). Allowed: PDF, DOCX, EPUB, TXT, and images.`);
          continue;
        }
        const result = await uploadToAgentLibrary(agentName, file.buffer, file.originalname, file.mimetype);
        if (result.success) {
          results.push(result);
          if (result.fileId) {
            ingestFileToLibrary(agentName, result.fileId, file.originalname, file.mimetype, file.buffer)
              .then(r => console.log(`[Library Ingestion] ${file.originalname}: ${r.chunksCreated} chunks`))
              .catch(e => console.error(`[Library Ingestion] ${file.originalname} failed:`, e.message));
          }
        } else {
          errors.push(`${file.originalname}: ${result.error || 'Upload failed'}`);
        }
      }

      res.json({ success: errors.length === 0, uploaded: results, errors });
    } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
  });

  app.get("/api/agent-library/external-folders", requireRole("admin"), async (_req: Request, res: Response) => {
    try {
      res.json({ success: true, links: getExternalFolderLinks() });
    } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
  });

  app.post("/api/agent-library/external-folders", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { agentName, folderId, label } = req.body;
      if (!agentName || !folderId || !label) {
        return res.status(400).json({ success: false, error: 'agentName, folderId, and label are required' });
      }
      addExternalFolderLink(agentName, folderId, label);
      res.json({ success: true, links: getExternalFolderLinks() });
    } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
  });

  app.delete("/api/agent-library/external-folders/:agentName/:folderId", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { agentName, folderId } = req.params;
      const removed = removeExternalFolderLink(agentName, folderId);
      res.json({ success: true, removed, links: getExternalFolderLinks() });
    } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
  });

  app.get("/api/agent-library/:agentName", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const files = await listAgentLibraryFiles(req.params.agentName);
      const indexingStatuses = await getFileIndexingStatus(req.params.agentName);
      const statusMap = new Map(indexingStatuses.map(s => [s.driveFileId, s]));
      const enrichedFiles = files.map(f => ({
        ...f,
        indexingStatus: statusMap.get(f.id)?.indexingStatus || 'pending',
        totalChunks: statusMap.get(f.id)?.totalChunks || 0,
        indexedAt: statusMap.get(f.id)?.indexedAt || null,
        indexingError: statusMap.get(f.id)?.errorMessage || null,
      }));
      res.json({ success: true, files: enrichedFiles });
    } catch (error: any) { res.status(500).json({ success: false, error: error.message, files: [] }); }
  });

  app.delete("/api/agent-library/:agentName/file/:fileId", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { agentName, fileId } = req.params;
      const result = await deleteAgentLibraryFile(fileId, agentName);
      if (!result.success) {
        return res.status(403).json(result);
      }
      deleteIndexedFile(fileId).catch(e => console.error(`[Library] Failed to clean up indexed data for ${fileId}:`, e.message));
      res.json(result);
    } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
  });

  app.post("/api/agent-library/:agentName/backfill", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { agentName } = req.params;
      const result = await backfillAgentLibrary(agentName);
      res.json({ success: true, ...result });
    } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
  });

  app.get("/api/hermes/drive-hierarchy-check", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const allioFolder = await findAllioFolder();
      if (!allioFolder) {
        return res.status(404).json({ success: false, error: "ALLIO folder not found" });
      }

      const issues: Array<{ type: string; path: string; detail: string }> = [];
      const contents = await listFolderContents(allioFolder.id);
      const topLevelFolders = contents.filter((f: any) => f.mimeType === "application/vnd.google-apps.folder");
      const topLevelFiles = contents.filter((f: any) => f.mimeType !== "application/vnd.google-apps.folder");

      for (const f of topLevelFiles) {
        issues.push({
          type: "misplaced_file",
          path: "ALLIO/",
          detail: `File "${f.name}" at root level`,
        });
      }

      const folderNameCounts = new Map<string, number>();
      for (const folder of topLevelFolders) {
        folderNameCounts.set(folder.name, (folderNameCounts.get(folder.name) || 0) + 1);
      }
      for (const [name, count] of folderNameCounts) {
        if (count > 1) {
          issues.push({
            type: "duplicate_folder",
            path: `ALLIO/${name}`,
            detail: `"${name}" has ${count} duplicates`,
          });
        }
      }

      const requiredFolders = ["Legal Compliance", "Member Contracts", "Member Content", "Protocols"];
      for (const required of requiredFolders) {
        if (!topLevelFolders.some((f: any) => f.name === required)) {
          issues.push({
            type: "missing_folder",
            path: `ALLIO/${required}`,
            detail: `Required folder "${required}" not found`,
          });
        }
      }

      const legalComplianceFolder = topLevelFolders.find((f: any) => f.name === "Legal Compliance");
      if (legalComplianceFolder) {
        const legalContents = await listFolderContents(legalComplianceFolder.id);
        const legalSubfolders = legalContents.filter((f: any) => f.mimeType === "application/vnd.google-apps.folder").map((f: any) => f.name);
        const requiredLegalSubs = ["Constitutional Law", "Case Law", "Reference Materials", "PMA Formation Documents"];
        for (const sub of requiredLegalSubs) {
          if (!legalSubfolders.includes(sub)) {
            issues.push({
              type: "missing_folder",
              path: `ALLIO/Legal Compliance/${sub}`,
              detail: `Required legal subfolder "${sub}" not found`,
            });
          }
        }
      }

      const memberContractsFolder = topLevelFolders.find((f: any) => f.name === "Member Contracts");
      if (memberContractsFolder) {
        const mcContents = await listFolderContents(memberContractsFolder.id);
        const mcFiles = mcContents.filter((f: any) => f.mimeType !== "application/vnd.google-apps.folder");
        for (const f of mcFiles) {
          issues.push({
            type: "misplaced_file",
            path: "ALLIO/Member Contracts/",
            detail: `File "${f.name}" should be in a member subfolder (Member Contracts/{MemberName}/)`,
          });
        }
      }

      res.json({
        success: true,
        agent: "HERMES",
        timestamp: new Date().toISOString(),
        totalIssues: issues.length,
        compliant: issues.length === 0,
        issues,
        structure: {
          topLevelFolders: topLevelFolders.map((f: any) => f.name),
          topLevelFileCount: topLevelFiles.length,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
}
