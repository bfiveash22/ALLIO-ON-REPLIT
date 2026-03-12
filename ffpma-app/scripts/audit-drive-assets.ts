/**
 * ALLIO Drive Asset Audit Script
 * Scans the entire ALLIO Drive folder and catalogs all visual assets
 */

import { google } from 'googleapis';
import fs from 'fs';

const OFFICIAL_ALLIO_FOLDER_ID = "16wOdbJPoOVOz5GE0mtlzf84c896JX1UC";

interface AssetInfo {
  id: string;
  name: string;
  mimeType: string;
  size: string;
  sizeBytes: number;
  folderPath: string;
  webViewLink: string;
  createdTime: string;
  quality: 'HD' | 'medium' | 'low' | 'unknown';
  type: 'video' | 'image' | 'document' | 'other';
  narrativeFit: boolean;
}

async function getGoogleDriveClient() {
  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!credentialsJson) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON not set');
  }
  
  const credentials = JSON.parse(credentialsJson);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.readonly']
  });
  
  return google.drive({ version: 'v3', auth });
}

async function listFolderRecursive(
  drive: any, 
  folderId: string, 
  folderPath: string = 'ALLIO'
): Promise<AssetInfo[]> {
  const assets: AssetInfo[] = [];
  
  try {
    let pageToken: string | undefined;
    
    do {
      const response = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'nextPageToken, files(id, name, mimeType, size, webViewLink, createdTime)',
        pageSize: 100,
        pageToken
      });
      
      const files = response.data.files || [];
      
      for (const file of files) {
        if (file.mimeType === 'application/vnd.google-apps.folder') {
          // Recurse into subfolder
          const subAssets = await listFolderRecursive(
            drive, 
            file.id!, 
            `${folderPath}/${file.name}`
          );
          assets.push(...subAssets);
        } else {
          // Categorize the asset
          const sizeBytes = parseInt(file.size || '0');
          const asset: AssetInfo = {
            id: file.id!,
            name: file.name!,
            mimeType: file.mimeType!,
            size: formatSize(sizeBytes),
            sizeBytes,
            folderPath,
            webViewLink: file.webViewLink || '',
            createdTime: file.createdTime || '',
            quality: assessQuality(file.mimeType!, sizeBytes),
            type: getAssetType(file.mimeType!),
            narrativeFit: assessNarrativeFit(file.name!, folderPath)
          };
          assets.push(asset);
        }
      }
      
      pageToken = response.data.nextPageToken;
    } while (pageToken);
    
  } catch (error) {
    console.error(`Error listing folder ${folderPath}:`, error);
  }
  
  return assets;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getAssetType(mimeType: string): 'video' | 'image' | 'document' | 'other' {
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.includes('document') || mimeType.includes('pdf') || mimeType.includes('text')) return 'document';
  return 'other';
}

function assessQuality(mimeType: string, sizeBytes: number): 'HD' | 'medium' | 'low' | 'unknown' {
  const type = getAssetType(mimeType);
  
  if (type === 'video') {
    // Videos: HD > 10MB, medium 2-10MB, low < 2MB
    if (sizeBytes > 10 * 1024 * 1024) return 'HD';
    if (sizeBytes > 2 * 1024 * 1024) return 'medium';
    if (sizeBytes > 0) return 'low';
  } else if (type === 'image') {
    // Images: HD > 500KB, medium 100-500KB, low < 100KB
    if (sizeBytes > 500 * 1024) return 'HD';
    if (sizeBytes > 100 * 1024) return 'medium';
    if (sizeBytes > 0) return 'low';
  }
  
  return 'unknown';
}

function assessNarrativeFit(name: string, folderPath: string): boolean {
  const nameLower = name.toLowerCase();
  const pathLower = folderPath.toLowerCase();
  
  // Keywords that fit the ALLIO healing ecosystem narrative
  const fitKeywords = [
    'allio', 'healing', 'agent', 'network', 'dna', 'helix', 
    'logo', 'brand', 'launch', 'medical', 'health', 'wellness',
    'frequency', 'rife', 'peptide', 'blood', 'analysis',
    'member', 'trustee', 'ecosystem', 'ai', 'protocol',
    'ffpma', 'forgotten', 'formula', 'sentinel', 'prism', 'pixel',
    'cinematic', 'intro', 'video', 'animation'
  ];
  
  // Keywords that don't fit
  const noFitKeywords = ['test', 'temp', 'draft', 'old', 'backup', 'copy'];
  
  for (const keyword of noFitKeywords) {
    if (nameLower.includes(keyword)) return false;
  }
  
  for (const keyword of fitKeywords) {
    if (nameLower.includes(keyword) || pathLower.includes(keyword)) return true;
  }
  
  // Default to true for images/videos in marketing folders
  if (pathLower.includes('marketing') || pathLower.includes('prism') || pathLower.includes('pixel')) {
    return true;
  }
  
  return false;
}

async function main() {
  console.log('🔍 Starting ALLIO Drive Asset Audit...\n');
  
  const drive = await getGoogleDriveClient();
  
  console.log('📁 Scanning folder: ' + OFFICIAL_ALLIO_FOLDER_ID);
  console.log('   This may take a few minutes...\n');
  
  const allAssets = await listFolderRecursive(drive, OFFICIAL_ALLIO_FOLDER_ID);
  
  // Filter to visual assets only
  const visualAssets = allAssets.filter(a => a.type === 'video' || a.type === 'image');
  
  // Separate by quality and type
  const hdVideos = visualAssets.filter(a => a.type === 'video' && a.quality === 'HD');
  const hdImages = visualAssets.filter(a => a.type === 'image' && a.quality === 'HD');
  const mediumVideos = visualAssets.filter(a => a.type === 'video' && a.quality === 'medium');
  const mediumImages = visualAssets.filter(a => a.type === 'image' && a.quality === 'medium');
  const lowQuality = visualAssets.filter(a => a.quality === 'low');
  
  // Narrative fit
  const narrativeFit = visualAssets.filter(a => a.narrativeFit && (a.quality === 'HD' || a.quality === 'medium'));
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                    ALLIO DRIVE ASSET AUDIT                     ');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log(`📊 TOTAL FILES: ${allAssets.length}`);
  console.log(`🎬 VISUAL ASSETS: ${visualAssets.length}\n`);
  
  console.log('─── HD VIDEOS (Best Quality) ───');
  if (hdVideos.length === 0) {
    console.log('   None found');
  } else {
    for (const v of hdVideos) {
      console.log(`   ✅ ${v.name}`);
      console.log(`      Size: ${v.size} | Path: ${v.folderPath}`);
      console.log(`      Link: ${v.webViewLink}`);
    }
  }
  
  console.log('\n─── HD IMAGES (Best Quality) ───');
  if (hdImages.length === 0) {
    console.log('   None found');
  } else {
    for (const img of hdImages.slice(0, 20)) {
      console.log(`   ✅ ${img.name}`);
      console.log(`      Size: ${img.size} | Path: ${img.folderPath}`);
    }
    if (hdImages.length > 20) {
      console.log(`   ... and ${hdImages.length - 20} more HD images`);
    }
  }
  
  console.log('\n─── MEDIUM QUALITY VIDEOS ───');
  for (const v of mediumVideos) {
    console.log(`   ⚠️ ${v.name} (${v.size})`);
  }
  
  console.log('\n─── LOW QUALITY (Exclude) ───');
  console.log(`   ${lowQuality.length} low quality assets to exclude`);
  
  console.log('\n─── NARRATIVE FIT (Recommended for Video) ───');
  for (const a of narrativeFit.slice(0, 30)) {
    const icon = a.type === 'video' ? '🎬' : '🖼️';
    console.log(`   ${icon} ${a.name} (${a.quality}, ${a.size})`);
  }
  if (narrativeFit.length > 30) {
    console.log(`   ... and ${narrativeFit.length - 30} more narrative-fit assets`);
  }
  
  // Save full audit to file
  const auditReport = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: allAssets.length,
      visualAssets: visualAssets.length,
      hdVideos: hdVideos.length,
      hdImages: hdImages.length,
      mediumVideos: mediumVideos.length,
      mediumImages: mediumImages.length,
      lowQuality: lowQuality.length,
      narrativeFit: narrativeFit.length
    },
    hdVideos,
    hdImages: hdImages.slice(0, 50), // Top 50
    narrativeFitAssets: narrativeFit
  };
  
  fs.writeFileSync('generated/drive-asset-audit.json', JSON.stringify(auditReport, null, 2));
  console.log('\n📄 Full audit saved to: generated/drive-asset-audit.json');
}

main().catch(console.error);
