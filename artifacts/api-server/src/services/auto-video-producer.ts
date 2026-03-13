import { VideoTemplate, TemplateScene, getTemplateById, getAllTemplates } from './video-templates';
import { generateSpeech, generateMusic } from './huggingface-audio';
import { uploadVideoToMarketing, scanForBackgroundMusic, downloadFileById, getAllioStructure } from './drive';
import { downloadAsset, createImageSlideshow, mergeAudioTracks, concatenateAudioFiles, getMediaDuration, createMixedMediaSlideshow, MixedMediaAsset } from './video-production';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface AutoProductionRequest {
  templateId?: string;
  customScenes?: Array<{
    name: string;
    narration: string;
    duration: number;
    imageUrl?: string;
  }>;
  title: string;
  musicPrompt?: string;
  voiceStyle?: 'female' | 'male' | 'neutral';
  uploadToDrive?: boolean;
}

export interface AutoProductionResult {
  success: boolean;
  videoPath?: string;
  driveLink?: string;
  driveFileId?: string;
  steps: string[];
  duration: number;
  error?: string;
}

export interface ProductionProgress {
  phase: 'initializing' | 'generating_narration' | 'matching_images' | 'generating_music' | 'merging_audio' | 'assembling_video' | 'uploading' | 'complete' | 'error';
  progress: number;
  message: string;
  currentScene?: number;
  totalScenes?: number;
}

const TEMP_DIR = path.join(process.cwd(), 'temp_video_assets');
const OUTPUT_DIR = path.join(process.cwd(), 'generated_videos');

async function ensureDirectories() {
  await fs.mkdir(TEMP_DIR, { recursive: true });
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
}

export interface DriveAsset {
  name: string;
  id: string;
  url?: string;
  mimeType?: string;
}

export async function loadDriveAssets(): Promise<{
  videos: DriveAsset[];
  images: DriveAsset[];
}> {
  try {
    const structure = await getAllioStructure();
    
    const prismFolder = structure.subfolders.find(f => f.name === 'PRISM - Videos');
    const pixelFolder = structure.subfolders.find(f => f.name === 'PIXEL - Design Assets');
    
    const videos: DriveAsset[] = [];
    const images: DriveAsset[] = [];
    
    if (prismFolder) {
      for (const file of prismFolder.files) {
        if (file.mimeType?.startsWith('video/')) {
          videos.push({ name: file.name, id: file.id, mimeType: file.mimeType });
        }
      }
    }
    
    if (pixelFolder) {
      for (const file of pixelFolder.files) {
        if (file.mimeType?.startsWith('image/')) {
          images.push({ name: file.name, id: file.id, mimeType: file.mimeType });
        }
      }
    }
    
    console.log(`[AutoProducer] Loaded ${videos.length} videos and ${images.length} images from Drive`);
    return { videos, images };
  } catch (error: any) {
    console.error('[AutoProducer] Failed to load Drive assets:', error.message);
    return { videos: [], images: [] };
  }
}

export async function findPreferredAsset(
  scene: TemplateScene,
  driveAssets: { videos: DriveAsset[]; images: DriveAsset[] }
): Promise<{ type: 'video' | 'image'; asset: DriveAsset } | null> {
  const preferred = scene.preferredAssets;
  
  if (preferred) {
    if (preferred.priority === 'video' && preferred.videos?.length) {
      for (const videoName of preferred.videos) {
        const match = driveAssets.videos.find(v => 
          v.name.toLowerCase() === videoName.toLowerCase() ||
          v.name.toLowerCase().includes(videoName.toLowerCase().replace('.mp4', ''))
        );
        if (match) {
          console.log(`[AutoProducer] Found preferred video: ${match.name}`);
          return { type: 'video', asset: match };
        }
      }
    }
    
    if (preferred.images?.length || preferred.priority === 'image') {
      const imageList = preferred.images || [];
      for (const imageName of imageList) {
        const match = driveAssets.images.find(img => 
          img.name.toLowerCase() === imageName.toLowerCase() ||
          img.name.toLowerCase().includes(imageName.toLowerCase().replace('.png', ''))
        );
        if (match) {
          console.log(`[AutoProducer] Found preferred image: ${match.name}`);
          return { type: 'image', asset: match };
        }
      }
    }
    
    if (preferred.priority === 'video' && preferred.images?.length) {
      for (const imageName of preferred.images) {
        const match = driveAssets.images.find(img => 
          img.name.toLowerCase().includes(imageName.toLowerCase().replace('.png', ''))
        );
        if (match) {
          console.log(`[AutoProducer] Fallback to image: ${match.name}`);
          return { type: 'image', asset: match };
        }
      }
    }
  }
  
  return null;
}

export async function matchAssetToScene(
  scene: TemplateScene,
  driveAssets: { videos: DriveAsset[]; images: DriveAsset[] }
): Promise<{ type: 'video' | 'image'; asset: DriveAsset } | null> {
  const preferred = await findPreferredAsset(scene, driveAssets);
  if (preferred) return preferred;
  
  const keywords = scene.imageKeywords.map(k => k.toLowerCase());
  
  let bestVideo: { asset: DriveAsset; score: number } | null = null;
  for (const video of driveAssets.videos) {
    const name = video.name.toLowerCase();
    let score = 0;
    for (const keyword of keywords) {
      if (name.includes(keyword)) score += 10;
    }
    if (name.includes('allio')) score += 5;
    if (score > 0 && (!bestVideo || score > bestVideo.score)) {
      bestVideo = { asset: video, score };
    }
  }
  
  if (bestVideo) {
    console.log(`[AutoProducer] Matched video by keywords: ${bestVideo.asset.name} (score: ${bestVideo.score})`);
    return { type: 'video', asset: bestVideo.asset };
  }
  
  let bestImage: { asset: DriveAsset; score: number } | null = null;
  for (const image of driveAssets.images) {
    const name = image.name.toLowerCase();
    let score = 0;
    for (const keyword of keywords) {
      if (name.includes(keyword)) score += 10;
    }
    if (name.includes('allio')) score += 5;
    if (score > 0 && (!bestImage || score > bestImage.score)) {
      bestImage = { asset: image, score };
    }
  }
  
  if (bestImage) {
    console.log(`[AutoProducer] Matched image by keywords: ${bestImage.asset.name} (score: ${bestImage.score})`);
    return { type: 'image', asset: bestImage.asset };
  }
  
  if (driveAssets.images.length > 0) {
    const fallback = driveAssets.images[Math.floor(Math.random() * driveAssets.images.length)];
    console.log(`[AutoProducer] Using random fallback image: ${fallback.name}`);
    return { type: 'image', asset: fallback };
  }
  
  return null;
}

export async function matchImageToScene(
  sceneKeywords: string[],
  availableImages: Array<{ name: string; url: string; thumbnailLink?: string }>
): Promise<string | null> {
  const normalizedKeywords = sceneKeywords.map(k => k.toLowerCase());
  
  let bestMatch: { name: string; url: string; score: number } | null = null;
  
  for (const image of availableImages) {
    const imageName = image.name.toLowerCase();
    let score = 0;
    
    for (const keyword of normalizedKeywords) {
      if (imageName.includes(keyword)) {
        score += 10;
      }
      const partialMatches = keyword.split('_').filter(part => imageName.includes(part));
      score += partialMatches.length * 3;
    }
    
    if (imageName.includes('allio')) score += 5;
    
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { name: image.name, url: image.url, score };
    }
  }
  
  if (bestMatch) {
    console.log(`[AutoProducer] Matched image: ${bestMatch.name} (score: ${bestMatch.score})`);
    return bestMatch.url;
  }
  
  if (availableImages.length > 0) {
    const randomIndex = Math.floor(Math.random() * availableImages.length);
    return availableImages[randomIndex].url;
  }
  
  return null;
}

export async function produceVideoAutomatically(
  request: AutoProductionRequest,
  availableImages: Array<{ name: string; url: string }> = [],
  onProgress?: (progress: ProductionProgress) => void
): Promise<AutoProductionResult> {
  const steps: string[] = [];
  const startTime = Date.now();
  
  const reportProgress = (progress: ProductionProgress) => {
    steps.push(progress.message);
    console.log(`[AutoProducer] ${progress.phase}: ${progress.message}`);
    if (onProgress) onProgress(progress);
  };
  
  try {
    await ensureDirectories();
    
    reportProgress({
      phase: 'initializing',
      progress: 0,
      message: `Starting automated production for: ${request.title}`
    });
    
    let scenes: Array<{ name: string; narration: string; duration: number; imageKeywords?: string[] }>;
    let musicPrompt: string;
    let voiceStyle: 'female' | 'male' | 'neutral';
    
    if (request.templateId) {
      const template = getTemplateById(request.templateId);
      if (!template) {
        return { success: false, error: `Template not found: ${request.templateId}`, steps, duration: 0 };
      }
      scenes = template.scenes.map(s => ({
        name: s.name,
        narration: s.narration,
        duration: s.duration,
        imageKeywords: s.imageKeywords
      }));
      musicPrompt = request.musicPrompt || template.musicMood;
      voiceStyle = request.voiceStyle || template.voiceStyle;
      reportProgress({ phase: 'initializing', progress: 5, message: `Using template: ${template.name}` });
    } else if (request.customScenes) {
      scenes = request.customScenes;
      musicPrompt = request.musicPrompt || 'ambient healing meditation background music';
      voiceStyle = request.voiceStyle || 'neutral';
    } else {
      return { success: false, error: 'Must provide either templateId or customScenes', steps, duration: 0 };
    }
    
    reportProgress({
      phase: 'generating_narration',
      progress: 10,
      message: `Generating narration for ${scenes.length} scenes...`,
      totalScenes: scenes.length
    });
    
    const sceneAudioPaths: string[] = [];
    const timestamp = Date.now();
    
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      reportProgress({
        phase: 'generating_narration',
        progress: 10 + (i / scenes.length) * 20,
        message: `Generating narration for scene ${i + 1}: ${scene.name}`,
        currentScene: i + 1,
        totalScenes: scenes.length
      });
      
      const narrationResult = await generateSpeech({ text: scene.narration, voice: voiceStyle });
      const audioExt = narrationResult.format === 'audio/mp3' ? 'mp3' : 'wav';
      const scenePath = path.join(TEMP_DIR, `narration_scene_${i}_${timestamp}.${audioExt}`);
      await fs.writeFile(scenePath, Buffer.from(narrationResult.audioBase64, 'base64'));
      sceneAudioPaths.push(scenePath);
    }
    
    const narrationPath = path.join(TEMP_DIR, `narration_combined_${timestamp}.aac`);
    await concatenateAudioFiles(sceneAudioPaths, narrationPath);
    
    reportProgress({
      phase: 'generating_narration',
      progress: 30,
      message: `Narration audio generated for all ${scenes.length} scenes`
    });
    
    reportProgress({
      phase: 'matching_images',
      progress: 35,
      message: 'Matching images to scenes...'
    });
    
    const imageUrls: string[] = [];
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      reportProgress({
        phase: 'matching_images',
        progress: 35 + (i / scenes.length) * 15,
        message: `Matching image for scene ${i + 1}: ${scene.name}`,
        currentScene: i + 1,
        totalScenes: scenes.length
      });
      
      const keywords = scene.imageKeywords || scene.name.toLowerCase().split(' ');
      const matchedUrl = await matchImageToScene(keywords, availableImages);
      
      if (matchedUrl) {
        imageUrls.push(matchedUrl);
      }
    }
    
    reportProgress({
      phase: 'matching_images',
      progress: 50,
      message: `Matched ${imageUrls.length}/${scenes.length} scenes with images`
    });
    
    let finalAudioPath = narrationPath;
    
    reportProgress({
      phase: 'generating_music',
      progress: 52,
      message: 'Scanning Drive for background music...'
    });
    
    try {
      const availableMusicTracks = await scanForBackgroundMusic();
      
      if (availableMusicTracks.length > 0) {
        const selectedTrack = availableMusicTracks.find(t => 
          t.name.toLowerCase().includes('healing') || 
          t.name.toLowerCase().includes('ambient') ||
          t.name.toLowerCase().includes('meditation')
        ) || availableMusicTracks[0];
        
        reportProgress({
          phase: 'generating_music',
          progress: 58,
          message: `Using background music: ${selectedTrack.name}`
        });
        
        const ext = path.extname(selectedTrack.name).toLowerCase() || '.mp3';
        const musicPath = path.join(TEMP_DIR, `music_${Date.now()}${ext}`);
        
        const downloaded = await downloadFileById(selectedTrack.id, musicPath);
        
        if (downloaded) {
          reportProgress({
            phase: 'merging_audio',
            progress: 68,
            message: 'Merging narration with background music...'
          });
          
          finalAudioPath = path.join(TEMP_DIR, `final_audio_${Date.now()}.aac`);
          await mergeAudioTracks(narrationPath, musicPath, finalAudioPath, { musicVolume: 0.2 });
          
          reportProgress({
            phase: 'merging_audio',
            progress: 75,
            message: `Audio merged with ${selectedTrack.name}`
          });
        } else {
          reportProgress({
            phase: 'generating_music',
            progress: 75,
            message: 'Music download failed - using narration only'
          });
        }
      } else {
        reportProgress({
          phase: 'generating_music',
          progress: 75,
          message: 'No background music found in FORGE folder - using narration only'
        });
      }
    } catch (musicError: any) {
      console.warn(`[AutoProducer] Music handling error: ${musicError.message}`);
      reportProgress({
        phase: 'generating_music',
        progress: 75,
        message: 'Background music unavailable - using narration only'
      });
    }
    
    let outputVideoPath: string | null = null;
    
    if (imageUrls.length > 0) {
      reportProgress({
        phase: 'assembling_video',
        progress: 78,
        message: 'Downloading scene images...'
      });
      
      const imagePaths: string[] = [];
      const durations: number[] = [];
      
      for (let i = 0; i < Math.min(imageUrls.length, scenes.length); i++) {
        try {
          const imagePath = await downloadAsset(imageUrls[i], `scene_${i}_${Date.now()}.jpg`);
          imagePaths.push(imagePath);
          durations.push(scenes[i].duration);
        } catch (err) {
          console.error(`[AutoProducer] Failed to download image ${i}:`, err);
        }
      }
      
      if (imagePaths.length > 0) {
        reportProgress({
          phase: 'assembling_video',
          progress: 85,
          message: `Assembling video with ${imagePaths.length} scenes and Ken Burns effects...`
        });
        
        const safeTitle = request.title.replace(/[^a-zA-Z0-9]/g, '_');
        outputVideoPath = path.join(OUTPUT_DIR, `${safeTitle}_${Date.now()}.mp4`);
        
        await createImageSlideshow(imagePaths, durations, finalAudioPath, outputVideoPath, {
          resolution: { width: 1920, height: 1080 },
          fps: 30,
          kenBurns: true
        });
        
        const expectedDuration = durations.reduce((sum, d) => sum + d, 0);
        const actualDuration = await getMediaDuration(outputVideoPath);
        const minAcceptable = expectedDuration * 0.8;
        
        if (actualDuration < minAcceptable) {
          throw new Error(`Video duration validation failed: expected ~${expectedDuration}s, got ${actualDuration.toFixed(1)}s. Video is truncated.`);
        }
        
        reportProgress({
          phase: 'assembling_video',
          progress: 95,
          message: `Video assembled successfully! Duration: ${actualDuration.toFixed(1)}s`
        });
      }
    }
    
    let driveLink: string | undefined;
    let driveFileId: string | undefined;
    
    if (outputVideoPath && request.uploadToDrive !== false) {
      reportProgress({
        phase: 'uploading',
        progress: 97,
        message: 'Uploading to Google Drive Marketing folder...'
      });
      
      const uploadResult = await uploadVideoToMarketing(outputVideoPath, request.title);
      if (uploadResult.success) {
        driveLink = uploadResult.driveLink;
        driveFileId = uploadResult.fileId;
        reportProgress({
          phase: 'uploading',
          progress: 99,
          message: `Uploaded to Drive: ${driveLink}`
        });
      }
    }
    
    const duration = (Date.now() - startTime) / 1000;
    
    reportProgress({
      phase: 'complete',
      progress: 100,
      message: `Production complete in ${duration.toFixed(1)} seconds`
    });
    
    return {
      success: true,
      videoPath: outputVideoPath || undefined,
      driveLink,
      driveFileId,
      steps,
      duration
    };
    
  } catch (error: any) {
    console.error('[AutoProducer] Production failed:', error);
    return {
      success: false,
      error: error.message,
      steps,
      duration: (Date.now() - startTime) / 1000
    };
  }
}

export async function getAvailableTemplates() {
  return getAllTemplates().map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
    category: t.category,
    sceneCount: t.scenes.length,
    totalDuration: t.scenes.reduce((sum, s) => sum + s.duration, 0)
  }));
}

export async function produceVideoPremium(
  request: AutoProductionRequest,
  onProgress?: (progress: ProductionProgress) => void
): Promise<AutoProductionResult> {
  const steps: string[] = [];
  const startTime = Date.now();
  
  const reportProgress = (progress: ProductionProgress) => {
    steps.push(progress.message);
    console.log(`[PremiumProducer] ${progress.phase}: ${progress.message}`);
    if (onProgress) onProgress(progress);
  };
  
  try {
    await ensureDirectories();
    
    reportProgress({
      phase: 'initializing',
      progress: 0,
      message: `Starting PREMIUM video production for: ${request.title}`
    });
    
    const template = request.templateId ? getTemplateById(request.templateId) : null;
    if (!template && !request.customScenes) {
      return { success: false, error: 'Must provide either templateId or customScenes', steps, duration: 0 };
    }
    
    const templateScenes = template?.scenes || [];
    const voiceStyle = request.voiceStyle || template?.voiceStyle || 'neutral';
    
    reportProgress({
      phase: 'initializing',
      progress: 3,
      message: `Loading assets from Google Drive...`
    });
    
    const driveAssets = await loadDriveAssets();
    reportProgress({
      phase: 'initializing',
      progress: 8,
      message: `Loaded ${driveAssets.videos.length} videos and ${driveAssets.images.length} images from Drive`
    });
    
    reportProgress({
      phase: 'generating_narration',
      progress: 10,
      message: `Generating narration for ${templateScenes.length} scenes...`,
      totalScenes: templateScenes.length
    });
    
    const sceneAudioPaths: string[] = [];
    const timestamp = Date.now();
    
    for (let i = 0; i < templateScenes.length; i++) {
      const scene = templateScenes[i];
      
      // Skip narration for scenes with empty narration (e.g., logo reveal)
      if (!scene.narration || scene.narration.trim() === '') {
        console.log(`[PremiumProducer] Skipping narration for scene ${i + 1}: ${scene.name} (no narration text)`);
        continue;
      }
      
      reportProgress({
        phase: 'generating_narration',
        progress: 10 + (i / templateScenes.length) * 20,
        message: `Generating narration for scene ${i + 1}: ${scene.name}`,
        currentScene: i + 1,
        totalScenes: templateScenes.length
      });
      
      const narrationResult = await generateSpeech({ text: scene.narration, voice: voiceStyle });
      const audioExt = narrationResult.format === 'audio/mp3' ? 'mp3' : 'wav';
      const scenePath = path.join(TEMP_DIR, `narration_scene_${i}_${timestamp}.${audioExt}`);
      await fs.writeFile(scenePath, Buffer.from(narrationResult.audioBase64, 'base64'));
      sceneAudioPaths.push(scenePath);
    }
    
    const narrationPath = path.join(TEMP_DIR, `narration_combined_${timestamp}.aac`);
    await concatenateAudioFiles(sceneAudioPaths, narrationPath);
    
    reportProgress({
      phase: 'generating_narration',
      progress: 30,
      message: `Narration audio generated for all ${templateScenes.length} scenes`
    });
    
    reportProgress({
      phase: 'matching_images',
      progress: 35,
      message: 'Matching mixed media assets (videos + images) to scenes...'
    });
    
    const sceneAssets: Array<{ type: 'video' | 'image'; path: string; duration: number }> = [];
    
    for (let i = 0; i < templateScenes.length; i++) {
      const scene = templateScenes[i];
      reportProgress({
        phase: 'matching_images',
        progress: 35 + (i / templateScenes.length) * 20,
        message: `Finding asset for scene ${i + 1}: ${scene.name}`,
        currentScene: i + 1,
        totalScenes: templateScenes.length
      });
      
      // Check for local asset first (e.g., logo)
      if (scene.useLocalAsset) {
        const localPath = path.join(process.cwd(), scene.useLocalAsset);
        try {
          await fs.access(localPath);
          console.log(`[PremiumProducer] Using local asset for scene ${i + 1}: ${scene.useLocalAsset}`);
          sceneAssets.push({
            type: 'image',
            path: localPath,
            duration: scene.duration
          });
          continue;
        } catch (err) {
          console.warn(`[PremiumProducer] Local asset not found: ${scene.useLocalAsset}`);
        }
      }
      
      const match = await matchAssetToScene(scene, driveAssets);
      
      if (match) {
        const ext = match.type === 'video' ? '.mp4' : '.png';
        const assetPath = path.join(TEMP_DIR, `scene_asset_${i}_${timestamp}${ext}`);
        
        const downloaded = await downloadFileById(match.asset.id, assetPath);
        if (downloaded) {
          sceneAssets.push({
            type: match.type,
            path: assetPath,
            duration: scene.duration
          });
        }
      }
    }
    
    const videoCount = sceneAssets.filter(a => a.type === 'video').length;
    const imageCount = sceneAssets.filter(a => a.type === 'image').length;
    
    if (sceneAssets.length < templateScenes.length) {
      const missingCount = templateScenes.length - sceneAssets.length;
      console.warn(`[PremiumProducer] Warning: ${missingCount} scenes missing assets`);
    }
    
    if (sceneAssets.length === 0) {
      return { success: false, error: 'No assets could be downloaded for any scene', steps, duration: (Date.now() - startTime) / 1000 };
    }
    
    reportProgress({
      phase: 'matching_images',
      progress: 55,
      message: `Matched ${sceneAssets.length}/${templateScenes.length} scenes (${videoCount} videos, ${imageCount} images)`
    });
    
    let finalAudioPath = narrationPath;
    
    reportProgress({
      phase: 'generating_music',
      progress: 58,
      message: 'Scanning Drive for background music...'
    });
    
    try {
      const availableMusicTracks = await scanForBackgroundMusic();
      
      if (availableMusicTracks.length > 0) {
        const selectedTrack = availableMusicTracks.find(t => 
          t.name.toLowerCase().includes('epic') ||
          t.name.toLowerCase().includes('cinematic') ||
          t.name.toLowerCase().includes('healing') || 
          t.name.toLowerCase().includes('ambient')
        ) || availableMusicTracks[0];
        
        reportProgress({
          phase: 'generating_music',
          progress: 62,
          message: `Using background music: ${selectedTrack.name}`
        });
        
        const ext = path.extname(selectedTrack.name).toLowerCase() || '.mp3';
        const musicPath = path.join(TEMP_DIR, `music_${Date.now()}${ext}`);
        
        const downloaded = await downloadFileById(selectedTrack.id, musicPath);
        
        if (downloaded) {
          reportProgress({
            phase: 'merging_audio',
            progress: 68,
            message: 'Merging narration with background music...'
          });
          
          finalAudioPath = path.join(TEMP_DIR, `final_audio_${Date.now()}.aac`);
          await mergeAudioTracks(narrationPath, musicPath, finalAudioPath, { musicVolume: 0.15 });
          
          reportProgress({
            phase: 'merging_audio',
            progress: 72,
            message: `Audio merged with ${selectedTrack.name}`
          });
        }
      } else {
        reportProgress({
          phase: 'generating_music',
          progress: 72,
          message: 'No background music in FORGE folder - using narration only'
        });
      }
    } catch (musicError: any) {
      console.warn(`[PremiumProducer] Music handling error: ${musicError.message}`);
      reportProgress({
        phase: 'generating_music',
        progress: 72,
        message: 'Background music unavailable - using narration only'
      });
    }
    
    let outputVideoPath: string | null = null;
    
    if (sceneAssets.length > 0) {
      reportProgress({
        phase: 'assembling_video',
        progress: 75,
        message: `Assembling premium video with ${sceneAssets.length} scenes (mixed media, enforced 16:9)...`
      });
      
      const mixedAssets: MixedMediaAsset[] = sceneAssets.map(a => ({
        type: a.type,
        path: a.path,
        duration: a.duration
      }));
      
      const safeTitle = request.title.replace(/[^a-zA-Z0-9]/g, '_');
      outputVideoPath = path.join(OUTPUT_DIR, `${safeTitle}_${Date.now()}.mp4`);
      
      await createMixedMediaSlideshow(mixedAssets, finalAudioPath, outputVideoPath, {
        resolution: { width: 1920, height: 1080 },
        fps: 30
      });
      
      const expectedDuration = sceneAssets.reduce((sum, a) => sum + a.duration, 0);
      const actualDuration = await getMediaDuration(outputVideoPath);
      const minAcceptable = expectedDuration * 0.8;
      
      if (actualDuration < minAcceptable) {
        throw new Error(`Video duration validation failed: expected ~${expectedDuration}s, got ${actualDuration.toFixed(1)}s. Video is truncated.`);
      }
      
      reportProgress({
        phase: 'assembling_video',
        progress: 92,
        message: `Premium video assembled! Duration: ${actualDuration.toFixed(1)}s (${videoCount} video clips, ${imageCount} images)`
      });
    } else {
      return { success: false, error: 'No assets could be matched to scenes', steps, duration: (Date.now() - startTime) / 1000 };
    }
    
    let driveLink: string | undefined;
    let driveFileId: string | undefined;
    
    if (outputVideoPath && request.uploadToDrive !== false) {
      reportProgress({
        phase: 'uploading',
        progress: 95,
        message: 'Uploading premium video to Google Drive...'
      });
      
      const uploadResult = await uploadVideoToMarketing(outputVideoPath, request.title);
      if (uploadResult.success) {
        driveLink = uploadResult.driveLink;
        driveFileId = uploadResult.fileId;
        reportProgress({
          phase: 'uploading',
          progress: 99,
          message: `Uploaded to Drive: ${driveLink}`
        });
      }
    }
    
    const duration = (Date.now() - startTime) / 1000;
    
    reportProgress({
      phase: 'complete',
      progress: 100,
      message: `Premium production complete in ${duration.toFixed(1)} seconds`
    });
    
    return {
      success: true,
      videoPath: outputVideoPath,
      driveLink,
      driveFileId,
      steps,
      duration
    };
    
  } catch (error: any) {
    console.error('[PremiumProducer] Production failed:', error);
    return {
      success: false,
      error: error.message,
      steps,
      duration: (Date.now() - startTime) / 1000
    };
  }
}
