import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

// Official ALLIO Drive folder ID - DO NOT CHANGE
// This is the correct folder as specified by Trustee: https://drive.google.com/drive/folders/1ui5cbRdyVhIojeG44EYg17puOdt4bStH
const OFFICIAL_ALLIO_FOLDER_ID = "1ui5cbRdyVhIojeG44EYg17puOdt4bStH";

// Protocol Transcripts folder - canonical source for patient protocol transcripts
// https://drive.google.com/drive/folders/10BqHP7hXwBGskvoNePMuvFuTNspKy0ur?usp=sharing
export const PROTOCOL_TRANSCRIPTS_FOLDER_ID = "10BqHP7hXwBGskvoNePMuvFuTNspKy0ur";

const EXTERNAL_LINKS_FILE = path.join(process.cwd(), 'data', 'external-folder-links.json');

const SEED_EXTERNAL_FOLDER_LINKS: Record<string, { folderId: string; label: string }[]> = {
  CHIRO: [{ folderId: '1vUOmOHvweQkOXN46Hxbbx1OM8PKk24TB', label: 'Chiro Books' }],
};

let externalFolderLinksCache: Record<string, { folderId: string; label: string }[]> | null = null;

function loadExternalFolderLinks(): Record<string, { folderId: string; label: string }[]> {
  if (externalFolderLinksCache) return externalFolderLinksCache;
  try {
    if (fs.existsSync(EXTERNAL_LINKS_FILE)) {
      const data = JSON.parse(fs.readFileSync(EXTERNAL_LINKS_FILE, 'utf-8'));
      externalFolderLinksCache = data;
      return data;
    }
  } catch (err) {
    console.error('[Drive] Error loading external folder links:', err);
  }
  externalFolderLinksCache = JSON.parse(JSON.stringify(SEED_EXTERNAL_FOLDER_LINKS));
  saveExternalFolderLinks(externalFolderLinksCache!);
  return externalFolderLinksCache!;
}

function saveExternalFolderLinks(links: Record<string, { folderId: string; label: string }[]>): void {
  try {
    const dir = path.dirname(EXTERNAL_LINKS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(EXTERNAL_LINKS_FILE, JSON.stringify(links, null, 2));
    externalFolderLinksCache = links;
  } catch (err) {
    console.error('[Drive] Error saving external folder links:', err);
  }
}

export function getExternalFolderLinks(): Record<string, { folderId: string; label: string }[]> {
  return loadExternalFolderLinks();
}

export function getExternalFoldersForAgent(agentName: string): { folderId: string; label: string }[] {
  const all = getExternalFolderLinks();
  return all[agentName.toUpperCase()] || [];
}

export function addExternalFolderLink(agentName: string, folderId: string, label: string): void {
  const links = loadExternalFolderLinks();
  const key = agentName.toUpperCase();
  if (!links[key]) links[key] = [];
  if (!links[key].some(f => f.folderId === folderId)) {
    links[key].push({ folderId, label });
    saveExternalFolderLinks(links);
  }
}

export function removeExternalFolderLink(agentName: string, folderId: string): boolean {
  const links = loadExternalFolderLinks();
  const key = agentName.toUpperCase();
  if (!links[key]) return false;
  const before = links[key].length;
  links[key] = links[key].filter(f => f.folderId !== folderId);
  const after = links[key].length;
  if (after === 0) delete links[key];
  if (after < before) {
    saveExternalFolderLinks(links);
    return true;
  }
  return false;
}

export async function getUncachableGoogleDriveClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  if (!process.env.GOOGLE_REFRESH_TOKEN) {
    throw new Error('Google OAuth is not fully configured - missing GOOGLE_REFRESH_TOKEN in .env');
  }

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });
  return google.drive({ version: 'v3', auth: oauth2Client });
}

export async function checkDriveConnection(): Promise<{ connected: boolean; email?: string }> {
  try {
    const drive = await getUncachableGoogleDriveClient();
    const about = await drive.about.get({ fields: 'user' });
    return {
      connected: true,
      email: about.data.user?.emailAddress || undefined
    };
  } catch (error) {
    console.error('Drive connection check failed:', error);
    return { connected: false };
  }
}

export async function findAllioFolder(): Promise<{ id: string; name: string } | null> {
  // ALWAYS return the official ALLIO folder - NEVER search or create new ones
  // Official folder: https://drive.google.com/drive/folders/16wOdbJPoOVOz5GE0mtlzf84c896JX1UC
  return {
    id: OFFICIAL_ALLIO_FOLDER_ID,
    name: 'ALLIO'
  };
}

export async function createAllioFolder(): Promise<{ id: string; name: string }> {
  // NEVER create new ALLIO folders - always use the official one
  // This function now just returns the official folder
  console.log('[Drive] WARNING: createAllioFolder called - returning official folder instead of creating new one');
  return {
    id: OFFICIAL_ALLIO_FOLDER_ID,
    name: 'ALLIO'
  };
}

export async function createSubfolder(parentId: string, folderName: string): Promise<{ id: string; name: string }> {
  try {
    const drive = await getUncachableGoogleDriveClient();

    // FIRST: Check if folder already exists to prevent duplicates
    const existingFolderId = await findFolderByName(parentId, folderName);
    if (existingFolderId) {
      console.log(`[Drive] Subfolder "${folderName}" already exists, reusing it`);
      return {
        id: existingFolderId,
        name: folderName
      };
    }

    // Only create if it doesn't exist
    console.log(`[Drive] Creating new subfolder: ${folderName}`);
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId]
    };
    const file = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id, name'
    });
    return {
      id: file.data.id!,
      name: file.data.name!
    };
  } catch (error) {
    console.error(`Error creating subfolder ${folderName}:`, error);
    throw error;
  }
}

export async function listFolderContents(folderId: string): Promise<Array<{
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  thumbnailLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
}>> {
  try {
    const drive = await getUncachableGoogleDriveClient();
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, webViewLink, thumbnailLink, createdTime, modifiedTime, size)',
      orderBy: 'modifiedTime desc',
      pageSize: 100
    });

    return (response.data.files || []).map(file => ({
      id: file.id!,
      name: file.name!,
      mimeType: file.mimeType!,
      webViewLink: file.webViewLink || undefined,
      thumbnailLink: file.thumbnailLink || undefined,
      createdTime: file.createdTime || undefined,
      modifiedTime: file.modifiedTime || undefined,
      size: file.size || undefined
    }));
  } catch (error) {
    console.error('Error listing folder contents:', error);
    return [];
  }
}

export async function getAllioStructure(): Promise<{
  allio: { id: string; name: string } | null;
  subfolders: Array<{ id: string; name: string; files: Array<any> }>;
}> {
  try {
    const allioFolder = await findAllioFolder();

    if (!allioFolder) {
      throw new Error('ALLIO folder not found - cannot create structure');
    }

    const contents = await listFolderContents(allioFolder.id);
    const subfolders: Array<{ id: string; name: string; files: Array<any> }> = [];

    for (const item of contents) {
      if (item.mimeType === 'application/vnd.google-apps.folder') {
        const files = await listFolderContents(item.id);
        subfolders.push({
          id: item.id,
          name: item.name,
          files: files.filter(f => f.mimeType !== 'application/vnd.google-apps.folder')
        });
      }
    }

    const rootFiles = contents.filter(f => f.mimeType !== 'application/vnd.google-apps.folder');
    if (rootFiles.length > 0) {
      subfolders.unshift({
        id: allioFolder.id,
        name: 'Root',
        files: rootFiles
      });
    }

    return {
      allio: allioFolder,
      subfolders
    };
  } catch (error) {
    console.error('Error getting Allio structure:', error);
    return { allio: null, subfolders: [] };
  }
}

export async function getDivisionStructure(divisionName: string): Promise<{
  allio: { id: string; name: string } | null;
  subfolders: Array<{ id: string; name: string; files: Array<any> }>;
}> {
  try {
    const allioFolder = await findAllioFolder();
    if (!allioFolder) {
      throw new Error('ALLIO folder not found');
    }

    const divisionsFolderId = await findFolderByName(allioFolder.id, '02_DIVISIONS');
    if (!divisionsFolderId) return { allio: allioFolder, subfolders: [] };

    const divisionFolderId = await findFolderByName(divisionsFolderId, divisionName);
    if (!divisionFolderId) return { allio: allioFolder, subfolders: [] };

    // Get the agents within the division
    const agents = await listFolderContents(divisionFolderId);
    const subfolders: Array<{ id: string; name: string; files: Array<any> }> = [];

    for (const agent of agents) {
      if (agent.mimeType === 'application/vnd.google-apps.folder') {
        const agentContents = await listFolderContents(agent.id);
        const outputFolder = agentContents.find(f => f.name === 'output' && f.mimeType === 'application/vnd.google-apps.folder');

        if (outputFolder) {
          // Flatten all files inside output/ (handling nested date folders)
          const dateFolders = await listFolderContents(outputFolder.id);
          const allAgentFiles = [];
          for (const item of dateFolders) {
            if (item.mimeType === 'application/vnd.google-apps.folder') {
              const files = await listFolderContents(item.id);
              allAgentFiles.push(...files.filter(f => f.mimeType !== 'application/vnd.google-apps.folder'));
            } else {
              // Push direct files just in case
              allAgentFiles.push(item);
            }
          }

          if (allAgentFiles.length > 0) {
            subfolders.push({
              id: outputFolder.id,
              name: `${agent.name} Output`,
              files: allAgentFiles.sort((a, b) => {
                const dateA = a.createdTime || a.modifiedTime || '';
                const dateB = b.createdTime || b.modifiedTime || '';
                return dateB.localeCompare(dateA);
              })
            });
          }
        }
      }
    }

    return { allio: allioFolder, subfolders };
  } catch (error) {
    console.error(`Error getting ${divisionName} structure:`, error);
    return { allio: null, subfolders: [] };
  }
}

export async function getMarketingStructure() {
  return getDivisionStructure('Marketing');
}

export async function getAllDivisionsStructure(): Promise<{
  allio: { id: string; name: string } | null;
  divisions: Record<string, Array<{ id: string; name: string; files: Array<any> }>>;
}> {
  try {
    const allioFolder = await findAllioFolder();
    if (!allioFolder) {
      throw new Error('ALLIO folder not found');
    }

    const divisionsFolderId = await findFolderByName(allioFolder.id, '02_DIVISIONS');
    if (!divisionsFolderId) return { allio: allioFolder, divisions: {} };

    const divisionFolders = await listFolderContents(divisionsFolderId);
    const divisions: Record<string, Array<{ id: string; name: string; files: Array<any> }>> = {};

    for (const divFolder of divisionFolders) {
      if (divFolder.mimeType === 'application/vnd.google-apps.folder') {
        const agents = await listFolderContents(divFolder.id);
        const subfolders: Array<{ id: string; name: string; files: Array<any> }> = [];

        for (const agent of agents) {
          if (agent.mimeType === 'application/vnd.google-apps.folder') {
            const agentContents = await listFolderContents(agent.id);
            const outputFolder = agentContents.find(f => f.name === 'output' && f.mimeType === 'application/vnd.google-apps.folder');

            if (outputFolder) {
              const dateFolders = await listFolderContents(outputFolder.id);
              const allAgentFiles = [];
              for (const item of dateFolders) {
                if (item.mimeType === 'application/vnd.google-apps.folder') {
                  const files = await listFolderContents(item.id);
                  allAgentFiles.push(...files.filter(f => f.mimeType !== 'application/vnd.google-apps.folder'));
                } else {
                  allAgentFiles.push(item);
                }
              }

              if (allAgentFiles.length > 0) {
                subfolders.push({
                  id: outputFolder.id,
                  name: `${agent.name} Output`,
                  files: allAgentFiles.sort((a, b) => {
                    const dateA = a.createdTime || a.modifiedTime || '';
                    const dateB = b.createdTime || b.modifiedTime || '';
                    return dateB.localeCompare(dateA);
                  })
                });
              }
            }
          }
        }

        if (subfolders.length > 0) {
          divisions[divFolder.name] = subfolders;
        }
      }
    }

    return { allio: allioFolder, divisions };
  } catch (error) {
    console.error('Error getting all divisions structure:', error);
    return { allio: null, divisions: {} };
  }
}

export async function uploadTextDocument(
  folderId: string,
  fileName: string,
  content: string,
  mimeType: string = 'text/plain'
): Promise<{ id: string; webViewLink: string; webContentLink: string } | null> {
  try {

    if (process.env.GOOGLE_REFRESH_TOKEN === 'dummy-local-token') {
      console.error(`[Drive] ERROR: Google Drive not configured (dummy-local-token). Cannot upload "${fileName}". Set a real GOOGLE_REFRESH_TOKEN.`);
      return null;
    }

    const drive = await getUncachableGoogleDriveClient();

    const fileMetadata = {
      name: fileName,
      parents: [folderId],
      mimeType: 'application/vnd.google-apps.document'
    };

    const media = {
      mimeType: mimeType,
      body: content
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink, webContentLink'
    });

    return {
      id: file.data.id!,
      webViewLink: file.data.webViewLink || '',
      webContentLink: file.data.webContentLink || ''
    };
  } catch (error) {
    console.error('Error uploading document to Drive:', error);
    return null;
  }
}

export async function uploadPresentation(
  folderId: string,
  fileName: string,
  content: string,
  mimeType: string = 'text/plain'
): Promise<{ id: string; webViewLink: string; webContentLink: string } | null> {
  try {
    if (process.env.GOOGLE_REFRESH_TOKEN === 'dummy-local-token') {
      console.error(`[Drive] ERROR: Google Drive not configured (dummy-local-token). Cannot upload presentation "${fileName}". Set a real GOOGLE_REFRESH_TOKEN.`);
      return null;
    }

    const drive = await getUncachableGoogleDriveClient();

    const fileMetadata = {
      name: fileName,
      parents: [folderId],
      mimeType: 'application/vnd.google-apps.presentation'
    };

    const media = {
      mimeType: mimeType,
      body: content
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink, webContentLink'
    });

    return {
      id: file.data.id!,
      webViewLink: file.data.webViewLink || '',
      webContentLink: file.data.webContentLink || ''
    };
  } catch (error) {
    console.error('Error uploading presentation to Drive:', error);
    return null;
  }
}

export async function findFolderByName(parentId: string, folderName: string): Promise<string | null> {
  try {

    if (process.env.GOOGLE_REFRESH_TOKEN === 'dummy-local-token') {
      console.error(`[Drive] ERROR: Google Drive not configured (dummy-local-token). Cannot search for folder "${folderName}". Set a real GOOGLE_REFRESH_TOKEN.`);
      return null;
    }

    const drive = await getUncachableGoogleDriveClient();
    const response = await drive.files.list({
      q: `'${parentId}' in parents and name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id)',
      spaces: 'drive'
    });

    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0].id!;
    }
    return null;
  } catch (error) {
    console.error(`Error finding folder ${folderName}:`, error);
    return null;
  }
}

export async function setupAgentFolders(allioFolderId: string): Promise<{
  success: boolean;
  folders: Array<{ agent: string; folderId: string }>;
}> {
  const agentFolders = [
    'PRISM - Videos',
    'FORGE - Production',
    'PIXEL - Design Assets',
    'AURORA - Frequency Research',
    'ATHENA - Communications',
    'HERMES - Drive Organization',
    'ATLAS - Financial Reports',
    'Legal - Contracts & Agreements',
    'Member Content',
    'Brand Assets'
  ];

  const createdFolders: Array<{ agent: string; folderId: string }> = [];

  try {
    const existingContents = await listFolderContents(allioFolderId);
    const existingFolderNames = new Set(
      existingContents
        .filter(f => f.mimeType === 'application/vnd.google-apps.folder')
        .map(f => f.name)
    );

    for (const folderName of agentFolders) {
      if (!existingFolderNames.has(folderName)) {
        const folder = await createSubfolder(allioFolderId, folderName);
        createdFolders.push({ agent: folderName, folderId: folder.id });
      } else {
        const existing = existingContents.find(f => f.name === folderName);
        if (existing) {
          createdFolders.push({ agent: folderName, folderId: existing.id });
        }
      }
    }

    return { success: true, folders: createdFolders };
  } catch (error) {
    console.error('Error setting up agent folders:', error);
    return { success: false, folders: createdFolders };
  }
}

export async function uploadFileFromPath(
  folderId: string,
  filePath: string,
  fileName?: string
): Promise<{ id: string; name: string; webViewLink: string } | null> {
  try {
    const actualFileName = fileName || path.basename(filePath);


    if (process.env.GOOGLE_REFRESH_TOKEN === 'dummy-local-token') {
      console.error(`[Drive] ERROR: Google Drive not configured (dummy-local-token). Cannot upload file "${actualFileName}". Set a real GOOGLE_REFRESH_TOKEN.`);
      return null;
    }

    const drive = await getUncachableGoogleDriveClient();

    const ext = path.extname(filePath).toLowerCase();
    let mimeType = 'application/octet-stream';
    if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.gif') mimeType = 'image/gif';
    else if (ext === '.webp') mimeType = 'image/webp';
    else if (ext === '.mp4') mimeType = 'video/mp4';
    else if (ext === '.webm') mimeType = 'video/webm';
    else if (ext === '.mov') mimeType = 'video/quicktime';
    else if (ext === '.pdf') mimeType = 'application/pdf';
    else if (ext === '.doc') mimeType = 'application/msword';
    else if (ext === '.docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    const fileMetadata = {
      name: actualFileName,
      parents: [folderId]
    };

    const media = {
      mimeType: mimeType,
      body: fs.createReadStream(filePath)
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink'
    });

    return {
      id: file.data.id!,
      name: file.data.name!,
      webViewLink: file.data.webViewLink || ''
    };
  } catch (error) {
    console.error(`Error uploading file ${filePath} to Drive:`, error);
    return null;
  }
}

export async function uploadMarketingAssets(): Promise<{
  success: boolean;
  uploaded: Array<{ name: string; type: string; driveLink: string }>;
  errors: string[];
}> {
  const uploaded: Array<{ name: string; type: string; driveLink: string }> = [];
  const errors: string[] = [];

  try {
    let allioFolder = await findAllioFolder();
    if (!allioFolder) {
      allioFolder = await createAllioFolder();
    }

    await setupAgentFolders(allioFolder.id);

    const pixelFolderId = await findFolderByName(allioFolder.id, 'PIXEL - Design Assets');
    const prismFolderId = await findFolderByName(allioFolder.id, 'PRISM - Videos');

    if (!pixelFolderId || !prismFolderId) {
      errors.push('Could not find or create agent folders');
      return { success: false, uploaded, errors };
    }

    const imagesDir = 'attached_assets/generated_images';
    const videosDir = 'attached_assets/generated_videos';

    if (fs.existsSync(imagesDir)) {
      const images = fs.readdirSync(imagesDir).filter(f =>
        f.startsWith('allio') && (f.endsWith('.png') || f.endsWith('.jpg'))
      );

      for (const img of images) {
        const filePath = path.join(imagesDir, img);
        const result = await uploadFileFromPath(pixelFolderId, filePath);
        if (result) {
          uploaded.push({ name: img, type: 'image', driveLink: result.webViewLink });
        } else {
          errors.push(`Failed to upload ${img}`);
        }
      }
    }

    if (fs.existsSync(videosDir)) {
      const videos = fs.readdirSync(videosDir).filter(f =>
        f.startsWith('allio') && f.endsWith('.mp4')
      );

      for (const vid of videos) {
        const filePath = path.join(videosDir, vid);
        const result = await uploadFileFromPath(prismFolderId, filePath);
        if (result) {
          uploaded.push({ name: vid, type: 'video', driveLink: result.webViewLink });
        } else {
          errors.push(`Failed to upload ${vid}`);
        }
      }
    }

    return { success: true, uploaded, errors };
  } catch (error) {
    console.error('Error uploading marketing assets:', error);
    errors.push(`Upload failed: ${error}`);
    return { success: false, uploaded, errors };
  }
}

export async function uploadLegalDocuments(): Promise<{
  success: boolean;
  uploaded: Array<{ name: string; driveLink: string }>;
  errors: string[];
}> {
  const uploaded: Array<{ name: string; driveLink: string }> = [];
  const errors: string[] = [];

  try {
    let allioFolder = await findAllioFolder();
    if (!allioFolder) {
      allioFolder = await createAllioFolder();
    }

    await setupAgentFolders(allioFolder.id);

    const legalFolderId = await findFolderByName(allioFolder.id, 'Legal - Contracts & Agreements');

    if (!legalFolderId) {
      errors.push('Could not find or create Legal folder');
      return { success: false, uploaded, errors };
    }

    const legalDocsDir = 'docs/legal';

    if (fs.existsSync(legalDocsDir)) {
      const docs = fs.readdirSync(legalDocsDir).filter(f =>
        f.endsWith('.md') || f.endsWith('.pdf') || f.endsWith('.txt')
      );

      for (const doc of docs) {
        const filePath = path.join(legalDocsDir, doc);
        const content = fs.readFileSync(filePath, 'utf-8');
        const result = await uploadTextDocument(legalFolderId, doc, content, 'text/markdown');
        if (result) {
          uploaded.push({ name: doc, driveLink: result.webViewLink });
        } else {
          errors.push(`Failed to upload ${doc}`);
        }
      }
    }

    return { success: true, uploaded, errors };
  } catch (error) {
    console.error('Error uploading legal documents:', error);
    errors.push(`Upload failed: ${error}`);
    return { success: false, uploaded, errors };
  }
}

export async function uploadBloodAnalysisFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  patientId?: string,
  analysisType?: string
): Promise<{
  success: boolean;
  fileId?: string;
  webViewLink?: string;
  thumbnailLink?: string;
  error?: string;
}> {
  try {
    const drive = await getUncachableGoogleDriveClient();

    let allioFolder = await findAllioFolder();
    if (!allioFolder) {
      allioFolder = await createAllioFolder();
    }

    await setupAgentFolders(allioFolder.id);

    const memberContentId = await findFolderByName(allioFolder.id, 'Member Content');
    if (!memberContentId) {
      return { success: false, error: 'Could not find Member Content folder' };
    }

    let bloodAnalysisFolderId = await findFolderByName(memberContentId, 'Blood Analysis Uploads');
    if (!bloodAnalysisFolderId) {
      const newFolder = await createSubfolder(memberContentId, 'Blood Analysis Uploads');
      bloodAnalysisFolderId = newFolder.id;
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    const sanitizedFileName = `${timestamp}_${patientId || 'unknown'}_${analysisType || 'lba'}_${fileName}`;

    const { Readable } = await import('stream');
    const bufferStream = Readable.from(buffer);

    const fileMetadata = {
      name: sanitizedFileName,
      parents: [bloodAnalysisFolderId],
      description: `Blood analysis upload: ${analysisType || 'LBA'} for patient ${patientId || 'unknown'}`
    };

    const media = {
      mimeType: mimeType,
      body: bufferStream
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink, thumbnailLink'
    });

    return {
      success: true,
      fileId: file.data.id || undefined,
      webViewLink: file.data.webViewLink || undefined,
      thumbnailLink: file.data.thumbnailLink || undefined
    };
  } catch (error: any) {
    console.error('Error uploading blood analysis file:', error);
    return { success: false, error: error.message || 'Upload failed' };
  }
}

export async function uploadXrayFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  patientId?: string
): Promise<{
  success: boolean;
  fileId?: string;
  webViewLink?: string;
  error?: string;
}> {
  try {
    const drive = await getUncachableGoogleDriveClient();

    let allioFolder = await findAllioFolder();
    if (!allioFolder) {
      allioFolder = await createAllioFolder();
    }

    await setupAgentFolders(allioFolder.id);

    const memberContentId = await findFolderByName(allioFolder.id, 'Member Content');
    if (!memberContentId) {
      return { success: false, error: 'Could not find Member Content folder' };
    }

    let xrayFolderId = await findFolderByName(memberContentId, 'X-Ray Uploads');
    if (!xrayFolderId) {
      const newFolder = await createSubfolder(memberContentId, 'X-Ray Uploads');
      xrayFolderId = newFolder.id;
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    const sanitizedFileName = `${timestamp}_${patientId || 'unknown'}_xray_${fileName}`;

    const { Readable } = await import('stream');
    const bufferStream = Readable.from(buffer);

    const fileMetadata = {
      name: sanitizedFileName,
      parents: [xrayFolderId],
      description: `X-ray upload for patient ${patientId || 'unknown'}`
    };

    const media = {
      mimeType: mimeType,
      body: bufferStream
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink'
    });

    return {
      success: true,
      fileId: file.data.id || undefined,
      webViewLink: file.data.webViewLink || undefined
    };
  } catch (error: any) {
    console.error('Error uploading X-ray file:', error);
    return { success: false, error: error.message || 'Upload failed' };
  }
}

export async function uploadSkinAnalysisFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  patientId?: string
): Promise<{
  success: boolean;
  fileId?: string;
  webViewLink?: string;
  thumbnailLink?: string;
  error?: string;
}> {
  try {
    const drive = await getUncachableGoogleDriveClient();

    let allioFolder = await findAllioFolder();
    if (!allioFolder) {
      allioFolder = await createAllioFolder();
    }

    await setupAgentFolders(allioFolder.id);

    const memberContentId = await findFolderByName(allioFolder.id, 'Member Content');
    if (!memberContentId) {
      return { success: false, error: 'Could not find Member Content folder' };
    }

    let skinAnalysisFolderId = await findFolderByName(memberContentId, 'Skin Analysis Uploads');
    if (!skinAnalysisFolderId) {
      const newFolder = await createSubfolder(memberContentId, 'Skin Analysis Uploads');
      skinAnalysisFolderId = newFolder.id;
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    const sanitizedFileName = `${timestamp}_${patientId || 'unknown'}_skin_${fileName}`;

    const { Readable } = await import('stream');
    const bufferStream = Readable.from(buffer);

    const fileMetadata = {
      name: sanitizedFileName,
      parents: [skinAnalysisFolderId],
      description: `Skin analysis upload for patient ${patientId || 'unknown'}`
    };

    const media = {
      mimeType: mimeType,
      body: bufferStream
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink, thumbnailLink'
    });

    return {
      success: true,
      fileId: file.data.id || undefined,
      webViewLink: file.data.webViewLink || undefined,
      thumbnailLink: file.data.thumbnailLink || undefined
    };
  } catch (error: any) {
    console.error('Error uploading skin analysis file:', error);
    return { success: false, error: error.message || 'Upload failed' };
  }
}

export async function createBakerFilesFolder(): Promise<{
  success: boolean;
  folderId?: string;
  error?: string;
}> {
  try {
    const drive = await getUncachableGoogleDriveClient();

    let allioFolder = await findAllioFolder();
    if (!allioFolder) {
      allioFolder = await createAllioFolder();
    }

    await setupAgentFolders(allioFolder.id);

    const memberContentId = await findFolderByName(allioFolder.id, 'Member Content');
    if (!memberContentId) {
      return { success: false, error: 'Could not find Member Content folder' };
    }

    let bakerFolderId = await findFolderByName(memberContentId, 'Baker Files');
    if (!bakerFolderId) {
      const newFolder = await createSubfolder(memberContentId, 'Baker Files');
      bakerFolderId = newFolder.id;
      console.log('[Drive] Created Baker Files folder:', bakerFolderId);
    }

    return { success: true, folderId: bakerFolderId };
  } catch (error: any) {
    console.error('Error creating Baker Files folder:', error);
    return { success: false, error: error.message || 'Failed to create folder' };
  }
}

export async function uploadToBakerFiles(
  localFilePath: string,
  fileName?: string
): Promise<{
  success: boolean;
  fileId?: string;
  webViewLink?: string;
  error?: string;
}> {
  try {
    const bakerResult = await createBakerFilesFolder();
    if (!bakerResult.success || !bakerResult.folderId) {
      return { success: false, error: bakerResult.error || 'Could not access Baker Files folder' };
    }

    const result = await uploadFileFromPath(bakerResult.folderId, localFilePath, fileName);
    if (!result) {
      return { success: false, error: 'File upload failed' };
    }

    return {
      success: true,
      fileId: result.id,
      webViewLink: result.webViewLink
    };
  } catch (error: any) {
    console.error('Error uploading to Baker Files:', error);
    return { success: false, error: error.message || 'Upload failed' };
  }
}

export async function getBloodAnalysisUploads(): Promise<Array<{
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  thumbnailLink?: string;
  createdTime?: string;
  description?: string;
}>> {
  try {
    const drive = await getUncachableGoogleDriveClient();

    let allioFolder = await findAllioFolder();
    if (!allioFolder) {
      return [];
    }

    const memberContentId = await findFolderByName(allioFolder.id, 'Member Content');
    if (!memberContentId) {
      return [];
    }

    const bloodAnalysisFolderId = await findFolderByName(memberContentId, 'Blood Analysis Uploads');
    if (!bloodAnalysisFolderId) {
      return [];
    }

    const response = await drive.files.list({
      q: `'${bloodAnalysisFolderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, webViewLink, thumbnailLink, createdTime, description)',
      orderBy: 'createdTime desc',
      pageSize: 100
    });

    return (response.data.files || []).map(file => ({
      id: file.id!,
      name: file.name!,
      mimeType: file.mimeType!,
      webViewLink: file.webViewLink || undefined,
      thumbnailLink: file.thumbnailLink || undefined,
      createdTime: file.createdTime || undefined,
      description: file.description || undefined
    }));
  } catch (error) {
    console.error('Error getting blood analysis uploads:', error);
    return [];
  }
}

export async function uploadVideoToMarketing(
  videoPath: string,
  title: string
): Promise<{ success: boolean; driveLink?: string; fileId?: string; error?: string }> {
  try {
    const allioFolder = await findAllioFolder();
    if (!allioFolder) {
      return { success: false, error: 'ALLIO folder not found' };
    }

    // Use proper structure: 02_DIVISIONS/Marketing/PRISM/output/{date}/
    let divisionsFolder = await findFolderByName(allioFolder.id, '02_DIVISIONS');
    if (!divisionsFolder) {
      const newFolder = await createSubfolder(allioFolder.id, '02_DIVISIONS');
      divisionsFolder = newFolder.id;
    }

    let marketingFolder = await findFolderByName(divisionsFolder, 'Marketing');
    if (!marketingFolder) {
      const newFolder = await createSubfolder(divisionsFolder, 'Marketing');
      marketingFolder = newFolder.id;
    }

    let prismFolder = await findFolderByName(marketingFolder, 'PRISM');
    if (!prismFolder) {
      const newFolder = await createSubfolder(marketingFolder, 'PRISM');
      prismFolder = newFolder.id;
    }

    let outputFolder = await findFolderByName(prismFolder, 'output');
    if (!outputFolder) {
      const newFolder = await createSubfolder(prismFolder, 'output');
      outputFolder = newFolder.id;
    }

    // Get today's date folder
    const today = new Date().toISOString().slice(0, 10);
    let dateFolder = await findFolderByName(outputFolder, today);
    if (!dateFolder) {
      const newFolder = await createSubfolder(outputFolder, today);
      dateFolder = newFolder.id;
    }

    const fileName = `PRISM_${title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.mp4`;
    const result = await uploadFileFromPath(dateFolder, videoPath, fileName);

    if (result) {
      console.log(`[Drive] Video uploaded to 02_DIVISIONS/Marketing/PRISM/output/${today}: ${result.webViewLink}`);
      return {
        success: true,
        driveLink: result.webViewLink,
        fileId: result.id
      };
    } else {
      return { success: false, error: 'Upload failed' };
    }
  } catch (error: any) {
    console.error('Error uploading video to Marketing:', error);
    return { success: false, error: error.message };
  }
}

export async function scanForBackgroundMusic(): Promise<Array<{
  id: string;
  name: string;
  webContentLink?: string;
}>> {
  try {
    const allioFolder = await findAllioFolder();
    if (!allioFolder) return [];

    const forgeFolderId = await findFolderByName(allioFolder.id, 'FORGE - Production');
    if (!forgeFolderId) {
      console.log('[Drive] FORGE folder not found');
      return [];
    }

    const contents = await listFolderContents(forgeFolderId);
    const audioExts = ['.mp3', '.wav', '.aac', '.m4a', '.ogg', '.flac'];

    const musicFiles = contents.filter(file => {
      const ext = path.extname(file.name).toLowerCase();
      return audioExts.includes(ext);
    });

    console.log(`[Drive] Found ${musicFiles.length} audio files in FORGE folder`);

    const drive = await getUncachableGoogleDriveClient();
    const results: Array<{ id: string; name: string; webContentLink?: string }> = [];

    for (const file of musicFiles) {
      const fileData = await drive.files.get({
        fileId: file.id,
        fields: 'id, name, webContentLink'
      });
      results.push({
        id: fileData.data.id!,
        name: fileData.data.name!,
        webContentLink: fileData.data.webContentLink || undefined
      });
    }

    return results;
  } catch (error) {
    console.error('[Drive] Error scanning for music:', error);
    return [];
  }
}

export async function downloadFileById(
  fileId: string,
  outputPath: string
): Promise<boolean> {
  try {
    const drive = await getUncachableGoogleDriveClient();

    const response = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    const dest = fs.createWriteStream(outputPath);

    return new Promise((resolve, reject) => {
      response.data
        .on('end', () => {
          console.log(`[Drive] Downloaded file to ${outputPath}`);
          resolve(true);
        })
        .on('error', (err: Error) => {
          console.error('[Drive] Download error:', err);
          reject(err);
        })
        .pipe(dest);
    });
  } catch (error) {
    console.error(`[Drive] Error downloading file ${fileId}:`, error);
    return false;
  }
}

export async function uploadAudioToAgentFolder(
  audioPath: string,
  agentFolder: string,
  fileName: string
): Promise<{ success: boolean; driveLink?: string; fileId?: string; error?: string }> {
  try {
    let allioFolder = await findAllioFolder();
    if (!allioFolder) {
      allioFolder = await createAllioFolder();
    }

    await setupAgentFolders(allioFolder.id);

    const folderId = await findFolderByName(allioFolder.id, agentFolder);
    if (!folderId) {
      return { success: false, error: `Could not find ${agentFolder} folder` };
    }

    const result = await uploadFileFromPath(folderId, audioPath, fileName);

    if (result) {
      console.log(`[Drive] Audio uploaded to ${agentFolder}: ${result.webViewLink}`);
      return {
        success: true,
        driveLink: result.webViewLink,
        fileId: result.id
      };
    } else {
      return { success: false, error: 'Upload failed' };
    }
  } catch (error: any) {
    console.error(`Error uploading audio to ${agentFolder}:`, error);
    return { success: false, error: error.message };
  }
}

export async function searchDriveLibrary(query: string, agentName?: string): Promise<Array<{
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
}>> {
  try {
    const drive = await getUncachableGoogleDriveClient();
    const sanitizedQuery = query.replace(/'/g, "\\'");

    const agentFolderIds: string[] = [];
    if (agentName) {
      const externalFolders = getExternalFoldersForAgent(agentName);
      for (const ef of externalFolders) {
        agentFolderIds.push(ef.folderId);
      }
      try {
        const librariesId = await getOrCreateAgentLibrariesFolder();
        const uploadFolderId = await findFolderByName(librariesId, agentName);
        if (uploadFolderId) agentFolderIds.push(uploadFolderId);
      } catch {}
    }

    if (agentFolderIds.length > 0) {
      const parentClauses = agentFolderIds.map(id => `'${id}' in parents`).join(' or ');
      const agentResponse = await drive.files.list({
        q: `(${parentClauses}) and (fullText contains '${sanitizedQuery}' or name contains '${sanitizedQuery}') and trashed = false`,
        fields: 'files(id, name, mimeType, webViewLink)',
        orderBy: 'modifiedTime desc',
        pageSize: 15
      });
      const agentResults = (agentResponse.data.files || []).map(file => ({
        id: file.id!,
        name: file.name!,
        mimeType: file.mimeType!,
        webViewLink: file.webViewLink || undefined
      }));

      if (agentResults.length >= 5) return agentResults;

      const seenIds = new Set(agentResults.map(f => f.id));
      const globalResponse = await drive.files.list({
        q: `(fullText contains '${sanitizedQuery}' or name contains '${sanitizedQuery}') and trashed = false`,
        fields: 'files(id, name, mimeType, webViewLink)',
        orderBy: 'modifiedTime desc',
        pageSize: 25
      });
      const globalResults = (globalResponse.data.files || [])
        .filter(f => !seenIds.has(f.id!))
        .map(file => ({
          id: file.id!,
          name: file.name!,
          mimeType: file.mimeType!,
          webViewLink: file.webViewLink || undefined
        }));

      return [...agentResults, ...globalResults].slice(0, 25);
    }

    const response = await drive.files.list({
      q: `(fullText contains '${sanitizedQuery}' or name contains '${sanitizedQuery}') and trashed = false`,
      fields: 'files(id, name, mimeType, webViewLink)',
      orderBy: 'modifiedTime desc',
      pageSize: 25
    });

    return (response.data.files || []).map(file => ({
      id: file.id!,
      name: file.name!,
      mimeType: file.mimeType!,
      webViewLink: file.webViewLink || undefined
    }));
  } catch (error) {
    console.error('[Drive] Error searching library:', error);
    return [];
  }
}

export async function searchDriveLibraryScoped(
  query: string,
  agentId?: string
): Promise<Array<{
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  folderContext: string;
}>> {
  try {
    const drive = await getUncachableGoogleDriveClient();

    const SYSTEM_LIBRARY_ID = '1G1oo3_6GhnLZL9dCRS3ghQXep3Zn1Ez6';
    const CHIRO_LIBRARY_ID = '1vUOmOHvweQkOXN46Hxbbx1OM8PKk24TB';

    const folderIds: Array<{ id: string; context: string }> = [
      { id: SYSTEM_LIBRARY_ID, context: 'System Library' },
    ];

    if (agentId === 'chiro' || !agentId) {
      folderIds.push({ id: CHIRO_LIBRARY_ID, context: 'Chiro Books' });
    }

    if (agentId) {
      try {
        const agentName = agentId.toUpperCase().replace(/-/g, '_');
        const librariesId = await getOrCreateAgentLibrariesFolder();
        const agentFolderId = await findFolderByName(librariesId, agentName);
        if (agentFolderId) {
          folderIds.push({ id: agentFolderId, context: `${agentName} Library` });
        }
      } catch (e) {
        console.error(`[Drive] Could not resolve agent library folder for ${agentId}:`, e);
      }
    }

    const escapedQuery = query.replace(/'/g, "\\'");
    const allResults: Array<{
      id: string;
      name: string;
      mimeType: string;
      webViewLink?: string;
      folderContext: string;
    }> = [];

    for (const folder of folderIds) {
      try {
        const response = await drive.files.list({
          q: `(fullText contains '${escapedQuery}' or name contains '${escapedQuery}') and trashed = false and '${folder.id}' in parents`,
          fields: 'files(id, name, mimeType, webViewLink)',
          orderBy: 'modifiedTime desc',
          pageSize: 10
        });

        for (const file of response.data.files || []) {
          allResults.push({
            id: file.id!,
            name: file.name!,
            mimeType: file.mimeType!,
            webViewLink: file.webViewLink || undefined,
            folderContext: folder.context
          });
        }
      } catch (e) {
        console.error(`[Drive] Error searching folder ${folder.context}:`, e);
      }
    }

    return allResults;
  } catch (error) {
    console.error('[Drive] Error in scoped library search:', error);
    return [];
  }
}

export async function trashDriveFile(fileId: string): Promise<boolean> {
  try {
    const drive = await getUncachableGoogleDriveClient();
    await drive.files.update({
      fileId: fileId,
      requestBody: { trashed: true }
    });
    console.log(`[Drive] Trashed file ${fileId}`);
    return true;
  } catch (error) {
    console.error(`[Drive] Error trashing file ${fileId}:`, error);
    return false;
  }
}

export async function deleteDriveFile(fileId: string): Promise<boolean> {
  try {
    const drive = await getUncachableGoogleDriveClient();
    await drive.files.delete({ fileId });
    console.log(`[Drive] Permanently deleted file ${fileId}`);
    return true;
  } catch (error) {
    console.error(`[Drive] Error deleting file ${fileId}:`, error);
    return false;
  }
}

export async function getOrCreateAgentLibrariesFolder(): Promise<string> {
  const allioFolder = await findAllioFolder();
  if (!allioFolder) throw new Error('ALLIO folder not found');

  let librariesId = await findFolderByName(allioFolder.id, 'Agent_Libraries');
  if (!librariesId) {
    const folder = await createSubfolder(allioFolder.id, 'Agent_Libraries');
    librariesId = folder.id;
    console.log('[Drive] Created Agent_Libraries folder:', librariesId);
  }
  return librariesId;
}

export async function getOrCreateAgentLibraryFolder(agentName: string): Promise<string> {
  const librariesId = await getOrCreateAgentLibrariesFolder();
  let agentFolderId = await findFolderByName(librariesId, agentName);
  if (!agentFolderId) {
    const folder = await createSubfolder(librariesId, agentName);
    agentFolderId = folder.id;
    console.log(`[Drive] Created agent library folder for ${agentName}:`, agentFolderId);
  }
  return agentFolderId;
}

export async function uploadToAgentLibrary(
  agentName: string,
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<{
  success: boolean;
  fileId?: string;
  name?: string;
  webViewLink?: string;
  size?: number;
  error?: string;
}> {
  try {
    const folderId = await getOrCreateAgentLibraryFolder(agentName);
    const drive = await getUncachableGoogleDriveClient();

    const { Readable } = await import('stream');
    const bufferStream = Readable.from(buffer);

    const file = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [folderId]
      },
      media: {
        mimeType,
        body: bufferStream
      },
      fields: 'id, name, webViewLink, size'
    });

    return {
      success: true,
      fileId: file.data.id || undefined,
      name: file.data.name || undefined,
      webViewLink: file.data.webViewLink || undefined,
      size: file.data.size ? parseInt(file.data.size) : buffer.length
    };
  } catch (error: any) {
    console.error(`[Drive] Error uploading to agent library ${agentName}:`, error);
    return { success: false, error: error.message || 'Upload failed' };
  }
}

export async function listAgentLibraryFiles(agentName: string): Promise<Array<{
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  webViewLink?: string;
  source?: string;
}>> {
  try {
    const drive = await getUncachableGoogleDriveClient();
    const allFiles: Array<{
      id: string; name: string; mimeType: string;
      size?: string; createdTime?: string; webViewLink?: string; source?: string;
    }> = [];

    const librariesId = await getOrCreateAgentLibrariesFolder();
    const agentFolderId = await findFolderByName(librariesId, agentName);
    if (agentFolderId) {
      const response = await drive.files.list({
        q: `'${agentFolderId}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType, size, createdTime, webViewLink)',
        orderBy: 'createdTime desc',
        pageSize: 200
      });
      for (const file of response.data.files || []) {
        allFiles.push({
          id: file.id!, name: file.name!, mimeType: file.mimeType!,
          size: file.size || undefined, createdTime: file.createdTime || undefined,
          webViewLink: file.webViewLink || undefined, source: 'uploaded'
        });
      }
    }

    const externalFolders = getExternalFoldersForAgent(agentName);
    for (const ef of externalFolders) {
      try {
        const response = await drive.files.list({
          q: `'${ef.folderId}' in parents and trashed = false`,
          fields: 'files(id, name, mimeType, size, createdTime, webViewLink)',
          orderBy: 'createdTime desc',
          pageSize: 200
        });
        for (const file of response.data.files || []) {
          if (!allFiles.some(f => f.id === file.id)) {
            allFiles.push({
              id: file.id!, name: file.name!, mimeType: file.mimeType!,
              size: file.size || undefined, createdTime: file.createdTime || undefined,
              webViewLink: file.webViewLink || undefined, source: ef.label
            });
          }
        }
      } catch (err) {
        console.error(`[Drive] Error listing external folder ${ef.label} (${ef.folderId}) for ${agentName}:`, err);
      }
    }

    allFiles.sort((a, b) => {
      const dateA = a.createdTime ? new Date(a.createdTime).getTime() : 0;
      const dateB = b.createdTime ? new Date(b.createdTime).getTime() : 0;
      return dateB - dateA;
    });

    return allFiles;
  } catch (error) {
    console.error(`[Drive] Error listing agent library for ${agentName}:`, error);
    return [];
  }
}

export async function verifyFileInAgentLibrary(fileId: string, agentName: string): Promise<boolean> {
  try {
    const librariesId = await getOrCreateAgentLibrariesFolder();
    const agentFolderId = await findFolderByName(librariesId, agentName);
    if (!agentFolderId) return false;

    const drive = await getUncachableGoogleDriveClient();
    const file = await drive.files.get({ fileId, fields: 'parents' });
    const parents = file.data.parents || [];
    return parents.includes(agentFolderId);
  } catch {
    return false;
  }
}

export async function deleteAgentLibraryFile(fileId: string, agentName: string): Promise<{ success: boolean; error?: string }> {
  const belongs = await verifyFileInAgentLibrary(fileId, agentName);
  if (!belongs) {
    return { success: false, error: 'File does not belong to this agent\'s library' };
  }
  const deleted = await trashDriveFile(fileId);
  return { success: deleted };
}

export async function createPatientProtocolsFolder(): Promise<{
  success: boolean;
  folderId?: string;
  error?: string;
}> {
  try {
    let allioFolder = await findAllioFolder();
    if (!allioFolder) {
      allioFolder = await createAllioFolder();
    }

    await setupAgentFolders(allioFolder.id);

    const memberContentId = await findFolderByName(allioFolder.id, 'Member Content');
    if (!memberContentId) {
      return { success: false, error: 'Could not find Member Content folder' };
    }

    let protocolsFolderId = await findFolderByName(memberContentId, 'Patient Protocols');
    if (!protocolsFolderId) {
      const newFolder = await createSubfolder(memberContentId, 'Patient Protocols');
      protocolsFolderId = newFolder.id;
      console.log('[Drive] Created Patient Protocols folder:', protocolsFolderId);
    }

    return { success: true, folderId: protocolsFolderId };
  } catch (error: any) {
    console.error('Error creating Patient Protocols folder:', error);
    return { success: false, error: error.message || 'Failed to create folder' };
  }
}

export async function uploadProtocolToDrive(
  pdfBuffer: Buffer,
  fileName: string
): Promise<{
  success: boolean;
  fileId?: string;
  webViewLink?: string;
  error?: string;
}> {
  try {
    const folderResult = await createPatientProtocolsFolder();
    if (!folderResult.success || !folderResult.folderId) {
      return { success: false, error: folderResult.error || 'Could not access Patient Protocols folder' };
    }

    const drive = await getUncachableGoogleDriveClient();
    const { Readable } = await import('stream');

    const file = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [folderResult.folderId],
        mimeType: 'application/pdf',
      },
      media: {
        mimeType: 'application/pdf',
        body: Readable.from(pdfBuffer),
      },
      fields: 'id, name, webViewLink',
    });

    return {
      success: true,
      fileId: file.data.id || undefined,
      webViewLink: file.data.webViewLink || undefined,
    };
  } catch (error: any) {
    console.error('Error uploading protocol to Drive:', error);
    return { success: false, error: error.message || 'Upload failed' };
  }
}
