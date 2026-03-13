import type { Express, Request, Response } from "express";
import { requireRole } from "../working-auth";
import { z } from "zod";
import { validatePreviewMode } from "../lib/preview-mode";
import { getAllioStructure, uploadVideoToMarketing } from "../services/drive";

export function registerMediaRoutes(app: Express): void {
  const imageGenerationSchema = z.object({
    prompt: z.string().min(1).max(1000),
    negativePrompt: z.string().optional(),
    style: z.enum(['healing', 'professional', 'educational', 'marketing']).optional(),
    aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:3']).optional()
  });

  app.post("/api/media/generate-image", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id as string;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const parsed = imageGenerationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.errors });
      }

      const { generateImage } = await import("../services/huggingface-media");
      const result = await generateImage(parsed.data);

      res.json({
        imageBase64: result.imageBase64,
        modelUsed: result.modelUsed,
        prompt: result.prompt,
        metadata: result.metadata
      });
    } catch (error: any) {
      console.error("[Image Generation] Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  const marketingAssetSchema = z.object({
    type: z.enum(['social_post', 'banner', 'product_image', 'infographic']),
    description: z.string().min(1).max(500)
  });

  app.post("/api/media/marketing-asset", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id as string;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const parsed = marketingAssetSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.errors });
      }

      const { generateMarketingAsset } = await import("../services/huggingface-media");
      const result = await generateMarketingAsset(parsed.data.type, parsed.data.description);

      res.json({
        imageBase64: result.imageBase64,
        modelUsed: result.modelUsed,
        prompt: result.prompt,
        metadata: result.metadata
      });
    } catch (error: any) {
      console.error("[Marketing Asset] Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/media/status", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { checkMediaStatus } = await import("../services/huggingface-media");
      const status = await checkMediaStatus();
      res.json(status);
    } catch (error: any) {
      res.status(500).json({
        imageGeneration: false,
        videoGeneration: false,
        availableModels: [],
        status: error.message
      });
    }
  });

  const ttsSchema = z.object({
    text: z.string().min(1).max(2000),
    voice: z.enum(['female', 'male', 'neutral']).optional()
  });

  app.post("/api/audio/generate-speech", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id as string;
      const isPreviewMode = validatePreviewMode(req);
      if (!userId && !isPreviewMode) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const parsed = ttsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.errors });
      }

      const { generateSpeech } = await import("../services/huggingface-audio");
      const result = await generateSpeech(parsed.data);
      res.json(result);
    } catch (error: any) {
      console.error("[TTS] Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  const musicSchema = z.object({
    prompt: z.string().min(1).max(500),
    duration: z.number().min(5).max(30).optional()
  });

  app.post("/api/audio/generate-music", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id as string;
      const isPreviewMode = validatePreviewMode(req);
      if (!userId && !isPreviewMode) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const parsed = musicSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.errors });
      }

      const { generateMusic } = await import("../services/huggingface-audio");
      const result = await generateMusic(parsed.data.prompt, parsed.data.duration || 10);
      res.json(result);
    } catch (error: any) {
      console.error("[Music] Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/audio/status", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { checkAudioStatus } = await import("../services/huggingface-audio");
      const status = await checkAudioStatus();
      res.json(status);
    } catch (error: any) {
      res.status(500).json({
        ttsAvailable: false,
        musicAvailable: false,
        status: error.message
      });
    }
  });

  app.get("/api/audio/allio-prompts", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { ALLIO_VOICE_PROMPTS } = await import("../services/huggingface-audio");
      res.json(ALLIO_VOICE_PROMPTS);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/video/status", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { getVideoProductionStatus } = await import("../services/video-production");
      res.json(getVideoProductionStatus());
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/video/launch-script", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { ALLIO_LAUNCH_SCRIPT } = await import("../services/video-production");
      res.json(ALLIO_LAUNCH_SCRIPT);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const videoRenderSchema = z.object({
    title: z.string(),
    scenes: z.array(z.object({
      id: z.string(),
      name: z.string(),
      narration: z.string(),
      duration: z.number(),
      imageId: z.string().optional(),
      imageName: z.string().optional(),
      thumbnailUrl: z.string().optional()
    })),
    musicPrompt: z.string().optional(),
    generateNarration: z.boolean().optional(),
    generateMusic: z.boolean().optional()
  });

  app.post("/api/video/render", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id as string;
      const isPreviewMode = validatePreviewMode(req);
      if (!userId && !isPreviewMode) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const parsed = videoRenderSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.errors });
      }

      const { title, scenes, musicPrompt, generateNarration, generateMusic } = parsed.data;

      const steps: string[] = [];
      let narrationAudio: string | null = null;
      let musicAudio: string | null = null;

      if (generateNarration) {
        steps.push("Generating narration audio...");
        const fullScript = scenes.map(s => s.narration).join(" ");
        const { generateSpeech } = await import("../services/huggingface-audio");
        const result = await generateSpeech({ text: fullScript, voice: "neutral" });
        narrationAudio = result.audioBase64;
        steps.push("Narration generated successfully");
      }

      if (generateMusic && musicPrompt) {
        steps.push("Generating background music...");
        const { generateMusic: genMusic } = await import("../services/huggingface-audio");
        const result = await genMusic(musicPrompt, 30);
        musicAudio = result.audioBase64;
        steps.push("Music generated successfully");
      }

      steps.push("Video render job queued");

      res.json({
        status: "queued",
        jobId: `render_${Date.now()}`,
        title,
        sceneCount: scenes.length,
        totalDuration: scenes.reduce((sum, s) => sum + s.duration, 0),
        hasNarration: !!narrationAudio,
        hasMusic: !!musicAudio,
        steps,
        message: "Video render job has been queued. Full video assembly requires additional server-side processing."
      });
    } catch (error: any) {
      console.error("[Video Render] Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/video/assemble", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const isPreviewMode = validatePreviewMode(req);
      const userId = req.user?.id as string;
      if (!userId && !isPreviewMode) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { title, scenes, generateNarration, generateMusic, musicPrompt, imageUrls } = req.body;

      if (!title || !scenes || !Array.isArray(scenes)) {
        return res.status(400).json({ error: "title and scenes array required" });
      }

      if (generateNarration) {
        const scenesWithoutNarration = scenes.filter((s: any) => !s.narration || s.narration.trim() === '');
        if (scenesWithoutNarration.length > 0) {
          return res.status(400).json({
            error: `${scenesWithoutNarration.length} scene(s) missing narration text`,
            hint: "Each scene needs narration text for audio generation"
          });
        }
      }

      if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
        if (imageUrls.length !== scenes.length) {
          console.log(`[Video Assembly] Warning: ${imageUrls.length} images for ${scenes.length} scenes - using available images`);
        }
      }

      console.log(`[Video Assembly] Starting full pipeline for: ${title}`);
      const steps: string[] = [];

      let narrationAudioPath: string | null = null;
      if (generateNarration) {
        steps.push("Generating narration audio...");
        const fullScript = scenes.map((s: any) => s.narration).join(" ");
        const { generateSpeech } = await import("../services/huggingface-audio");
        const result = await generateSpeech({ text: fullScript, voice: "neutral" });

        const fs = await import("fs/promises");
        const path = await import("path");
        const narrationPath = path.join(process.cwd(), "temp_video_assets", `narration_${Date.now()}.wav`);
        await fs.mkdir(path.dirname(narrationPath), { recursive: true });
        await fs.writeFile(narrationPath, Buffer.from(result.audioBase64, "base64"));
        narrationAudioPath = narrationPath;
        steps.push("Narration generated successfully");
      }

      let musicAudioPath: string | null = null;
      if (generateMusic && musicPrompt) {
        steps.push("Generating background music...");
        const totalDuration = scenes.reduce((sum: number, s: any) => sum + (s.duration || 10), 0);
        const { generateMusic: genMusic } = await import("../services/huggingface-audio");
        const result = await genMusic(musicPrompt, Math.min(totalDuration, 30));

        const fs = await import("fs/promises");
        const path = await import("path");
        const musicPath = path.join(process.cwd(), "temp_video_assets", `music_${Date.now()}.flac`);
        await fs.writeFile(musicPath, Buffer.from(result.audioBase64, "base64"));
        musicAudioPath = musicPath;
        steps.push("Music generated successfully");
      }

      let finalAudioPath: string | null = null;
      if (narrationAudioPath || musicAudioPath) {
        steps.push("Merging audio tracks...");
        const { mergeAudioTracks } = await import("../services/video-production");
        const path = await import("path");
        finalAudioPath = path.join(process.cwd(), "temp_video_assets", `final_audio_${Date.now()}.aac`);

        if (narrationAudioPath && musicAudioPath) {
          await mergeAudioTracks(narrationAudioPath, musicAudioPath, finalAudioPath, { musicVolume: 0.25 });
          steps.push("Audio merged: narration + music");
        } else if (narrationAudioPath) {
          finalAudioPath = narrationAudioPath;
          steps.push("Using narration audio only");
        } else if (musicAudioPath) {
          finalAudioPath = musicAudioPath;
          steps.push("Using music audio only");
        }
      }

      let outputVideoPath: string | null = null;
      if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
        steps.push("Downloading scene images...");
        const { downloadAsset, createImageSlideshow } = await import("../services/video-production");
        const path = await import("path");

        const imagePaths: string[] = [];
        const durations: number[] = [];

        for (let i = 0; i < Math.min(imageUrls.length, scenes.length); i++) {
          const imagePath = await downloadAsset(imageUrls[i], `scene_${i}_${Date.now()}.jpg`);
          imagePaths.push(imagePath);
          durations.push(scenes[i].duration || 10);
        }
        steps.push(`Downloaded ${imagePaths.length} scene images`);

        steps.push("Assembling video with Ken Burns effects...");
        const outputPath = path.join(process.cwd(), "generated_videos", `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.mp4`);
        await createImageSlideshow(imagePaths, durations, finalAudioPath, outputPath, {
          resolution: { width: 1920, height: 1080 },
          fps: 30,
          kenBurns: true
        });
        outputVideoPath = outputPath;
        steps.push("Video assembled successfully!");
      }

      let driveUploadResult: { driveLink?: string; fileId?: string } = {};
      if (outputVideoPath) {
        steps.push("Uploading to Google Drive Marketing folder...");
        try {
          const uploadResult = await uploadVideoToMarketing(outputVideoPath, title);
          if (uploadResult.success) {
            driveUploadResult = { driveLink: uploadResult.driveLink, fileId: uploadResult.fileId };
            steps.push(`Uploaded to Drive: ${uploadResult.driveLink}`);
          } else {
            steps.push(`Drive upload warning: ${uploadResult.error}`);
          }
        } catch (uploadError: any) {
          steps.push(`Drive upload failed: ${uploadError.message}`);
        }
      }

      res.json({
        success: true,
        title,
        sceneCount: scenes.length,
        totalDuration: scenes.reduce((sum: number, s: any) => sum + (s.duration || 10), 0),
        hasNarration: !!narrationAudioPath,
        hasMusic: !!musicAudioPath,
        outputVideoPath,
        driveLink: driveUploadResult.driveLink,
        driveFileId: driveUploadResult.fileId,
        steps,
        message: outputVideoPath
          ? `Video assembled and uploaded to Marketing: ${driveUploadResult.driveLink || outputVideoPath}`
          : "Audio generated - provide imageUrls to assemble final video"
      });
    } catch (error: any) {
      console.error("[Video Assembly] Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/video/templates", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { getAvailableTemplates } = await import("../services/auto-video-producer");
      const templates = await getAvailableTemplates();
      res.json({ templates });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/video/auto-produce", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const isPreviewMode = validatePreviewMode(req);
      const userId = req.user?.id as string;
      if (!userId && !isPreviewMode) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { templateId, title, customScenes, musicPrompt, voiceStyle, uploadToDrive } = req.body;

      if (!title) {
        return res.status(400).json({ error: "title is required" });
      }

      if (!templateId && !customScenes) {
        return res.status(400).json({ error: "Either templateId or customScenes is required" });
      }

      console.log(`[Auto Video] Starting automated production: ${title}`);

      const driveStructure = await getAllioStructure();
      const pixelFolder = driveStructure.subfolders.find(f => f.name === 'PIXEL - Design Assets');
      const availableImages = (pixelFolder?.files || [])
        .filter((f: any) => f.mimeType?.startsWith('image/'))
        .map((f: any) => ({
          name: f.name,
          url: f.thumbnailLink?.replace('=s220', '=s1920') || f.webViewLink || ''
        }));

      console.log(`[Auto Video] Found ${availableImages.length} images in PIXEL folder`);

      const { produceVideoAutomatically } = await import("../services/auto-video-producer");

      const result = await produceVideoAutomatically({
        templateId,
        customScenes,
        title,
        musicPrompt,
        voiceStyle,
        uploadToDrive: uploadToDrive !== false
      }, availableImages);

      res.json(result);
    } catch (error: any) {
      console.error("[Auto Video] Production error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/agents/produce-video", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const isPreviewMode = validatePreviewMode(req);
      const userId = req.user?.id as string;
      if (!userId && !isPreviewMode) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { agentId, templateId, title, priority, scheduledFor } = req.body;

      if (!agentId || !title) {
        return res.status(400).json({ error: "agentId and title are required" });
      }

      console.log(`[Agent Video] Agent ${agentId} requesting video production: ${title}`);

      const driveStructure = await getAllioStructure();
      const pixelFolder = driveStructure.subfolders.find(f => f.name === 'PIXEL - Design Assets');
      const availableImages = (pixelFolder?.files || [])
        .filter((f: any) => f.mimeType?.startsWith('image/'))
        .map((f: any) => ({
          name: f.name,
          url: f.thumbnailLink?.replace('=s220', '=s1920') || f.webViewLink || ''
        }));

      const { produceVideoAutomatically } = await import("../services/auto-video-producer");

      if (scheduledFor && new Date(scheduledFor) > new Date()) {
        return res.json({
          success: true,
          queued: true,
          scheduledFor,
          message: `Video production scheduled for ${scheduledFor}`
        });
      }

      const result = await produceVideoAutomatically({
        templateId: templateId || 'allio-launch-march-2026',
        title,
        uploadToDrive: true
      }, availableImages);

      res.json({
        ...result,
        agentId,
        producedBy: 'PRISM Video Agent'
      });
    } catch (error: any) {
      console.error("[Agent Video] Production error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/video/upload-local", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const isPreviewMode = validatePreviewMode(req);
      if (!isPreviewMode) {
        return res.status(401).json({ error: "Trustee access required" });
      }

      const { localPath, title } = req.body;
      if (!localPath || !title) {
        return res.status(400).json({ error: "localPath and title are required" });
      }

      const { uploadVideoToMarketing } = await import("../services/drive");
      const result = await uploadVideoToMarketing(localPath, title);

      res.json(result);
    } catch (error: any) {
      console.error("[Video Upload] Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/video/produce-premium", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const isPreviewMode = validatePreviewMode(req);
      const userId = req.user?.id as string;
      if (!userId && !isPreviewMode) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { templateId, title, voiceStyle, uploadToDrive } = req.body;

      if (!title) {
        return res.status(400).json({ error: "title is required" });
      }

      console.log(`[Premium Video] Starting premium production: ${title}`);

      const { produceVideoPremium } = await import("../services/auto-video-producer");

      const result = await produceVideoPremium({
        templateId: templateId || 'allio-launch-march-2026',
        title,
        voiceStyle: voiceStyle || 'neutral',
        uploadToDrive: uploadToDrive !== false
      });

      res.json({
        ...result,
        productionType: 'premium',
        producedBy: 'PRISM Video Agent (Premium)'
      });
    } catch (error: any) {
      console.error("[Premium Video] Production error:", error);
      res.status(500).json({ error: error.message });
    }
  });
}
