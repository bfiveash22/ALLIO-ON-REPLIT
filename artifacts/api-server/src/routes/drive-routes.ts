import type { Express, Request, Response } from "express";
import { requireRole } from "../working-auth";
import multer from "multer";
import {
  checkDriveConnection, findAllioFolder, createAllioFolder,
  getAllioStructure, getMarketingStructure, setupAgentFolders,
  listFolderContents, getUncachableGoogleDriveClient,
  uploadMarketingAssets, uploadLegalDocuments,
  uploadBloodAnalysisFile, getBloodAnalysisUploads,
  createBakerFilesFolder, uploadToBakerFiles
} from "../services/drive";

const upload = multer({ storage: multer.memoryStorage() });

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

  app.post("/api/drive/create-baker-folder", requireRole("admin"), async (req: Request, res: Response) => {
    try { res.json(await createBakerFilesFolder()); }
    catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
  });

  app.post("/api/drive/upload-baker-protocol", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { localPath, fileName } = req.body;
      if (!localPath) return res.status(400).json({ success: false, error: 'localPath is required' });
      res.json(await uploadToBakerFiles(localPath, fileName));
    } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
  });
}
