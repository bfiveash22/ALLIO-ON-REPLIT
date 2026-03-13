// Google Drive Integration for Forgotten Formula PMA
// Used to sync training materials like Seminar Handouts and IV Guidelines
// Auth: VPS-compatible OAuth2 via GOOGLE_REFRESH_TOKEN (Replit connector removed 2026-03-11)

import { google, drive_v3 } from 'googleapis';

// Get a fresh Google Drive client using standard OAuth2 refresh token (VPS-safe, no Replit deps)
export async function getGoogleDriveClient(): Promise<drive_v3.Drive> {
  if (!process.env.GOOGLE_REFRESH_TOKEN) {
    throw new Error('Google OAuth is not configured - missing GOOGLE_REFRESH_TOKEN in .env');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });

  return google.drive({ version: 'v3', auth: oauth2Client });
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  description?: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
  parents?: string[];
}

export interface DriveFolder {
  id: string;
  name: string;
  files: DriveFile[];
  subfolders: DriveFolder[];
}

// List files in a folder
export async function listFilesInFolder(folderId: string): Promise<DriveFile[]> {
  try {
    const drive = await getGoogleDriveClient();

    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, webViewLink, webContentLink, thumbnailLink, description, createdTime, modifiedTime, size, parents)',
      pageSize: 100,
    });

    return (response.data.files || []) as DriveFile[];
  } catch (error) {
    console.error(`[Drive API Error] listFilesInFolder failed for ${folderId}:`, error);
    return [];
  }
}

// Search for folders by name
export async function searchFoldersByName(folderName: string): Promise<DriveFile[]> {
  try {
    const drive = await getGoogleDriveClient();

    const response = await drive.files.list({
      q: `name contains '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name, mimeType, webViewLink, description, createdTime, modifiedTime, parents)',
      pageSize: 50,
    });

    return (response.data.files || []) as DriveFile[];
  } catch (error) {
    console.error(`[Drive API Error] searchFoldersByName failed for ${folderName}:`, error);
    return [];
  }
}

// Search for files by name (all file types, not just folders)
export async function searchFilesByName(fileName: string): Promise<DriveFile[]> {
  try {
    const drive = await getGoogleDriveClient();

    const response = await drive.files.list({
      q: `name contains '${fileName}' and trashed = false`,
      fields: 'files(id, name, mimeType, webViewLink, webContentLink, thumbnailLink, description, createdTime, modifiedTime, size, parents)',
      pageSize: 100,
    });

    return (response.data.files || []) as DriveFile[];
  } catch (error) {
    console.error(`[Drive API Error] searchFilesByName failed for ${fileName}:`, error);
    return [];
  }
}

// List all folders the user has access to
export async function listAllFolders(): Promise<DriveFile[]> {
  try {
    const drive = await getGoogleDriveClient();

    const response = await drive.files.list({
      q: `mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name, mimeType, webViewLink, description, createdTime, modifiedTime, parents)',
      pageSize: 100,
    });

    return (response.data.files || []) as DriveFile[];
  } catch (error) {
    console.error(`[Drive API Error] listAllFolders failed:`, error);
    return [];
  }
}

// Get folder contents recursively
export async function getFolderContents(folderId: string, depth: number = 1): Promise<DriveFolder | null> {
  try {
    const drive = await getGoogleDriveClient();

    // Get folder metadata
    const folderMeta = await drive.files.get({
      fileId: folderId,
      fields: 'id, name, mimeType',
    });

    // Get all items in folder
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, webViewLink, webContentLink, thumbnailLink, description, createdTime, modifiedTime, size, parents)',
      pageSize: 100,
    });

    const files: DriveFile[] = [];
    const subfolders: DriveFolder[] = [];

    for (const file of response.data.files || []) {
      if (file.mimeType === 'application/vnd.google-apps.folder') {
        if (depth > 0) {
          const subfolder = await getFolderContents(file.id!, depth - 1);
          if (subfolder) subfolders.push(subfolder);
        } else {
          subfolders.push({
            id: file.id!,
            name: file.name!,
            files: [],
            subfolders: [],
          });
        }
      } else {
        files.push(file as DriveFile);
      }
    }

    return {
      id: folderMeta.data.id!,
      name: folderMeta.data.name!,
      files,
      subfolders,
    };
  } catch (error) {
    console.error(`[Drive API Error] getFolderContents failed for ${folderId}:`, error);
    return null;
  }
}

// Get file content as text (for Google Docs)
export async function getDocumentContent(fileId: string): Promise<string> {
  try {
    const drive = await getGoogleDriveClient();

    const response = await drive.files.export({
      fileId,
      mimeType: 'text/html',
    });

    return response.data as string;
  } catch (error) {
    console.error(`[Drive API Error] getDocumentContent failed for ${fileId}:`, error);
    return '';
  }
}

// Get file metadata
export async function getFileMetadata(fileId: string): Promise<DriveFile | null> {
  try {
    const drive = await getGoogleDriveClient();

    const response = await drive.files.get({
      fileId,
      fields: 'id, name, mimeType, webViewLink, webContentLink, thumbnailLink, description, createdTime, modifiedTime, size, parents',
    });

    return response.data as DriveFile;
  } catch (error) {
    console.error(`[Drive API Error] getFileMetadata failed for ${fileId}:`, error);
    return null;
  }
}

// Download file content
export async function downloadFile(fileId: string): Promise<Buffer | null> {
  try {
    const drive = await getGoogleDriveClient();

    const response = await drive.files.get({
      fileId,
      alt: 'media',
    }, {
      responseType: 'arraybuffer',
    });

    return Buffer.from(response.data as ArrayBuffer);
  } catch (error) {
    console.error(`[Drive API Error] downloadFile failed for ${fileId}:`, error);
    return null;
  }
}

// Get content type category from MIME type
export function getContentTypeFromMime(mimeType: string): string {
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('video')) return 'video';
  if (mimeType.includes('image')) return 'image';
  if (mimeType.includes('document') || mimeType.includes('word')) return 'document';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'spreadsheet';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
  if (mimeType.includes('text')) return 'text';
  return 'file';
}
