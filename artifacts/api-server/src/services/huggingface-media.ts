import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Image generation models
const FLUX_SCHNELL = "black-forest-labs/FLUX.1-schnell";
const FLUX_DEV = "black-forest-labs/FLUX.1-dev";
const STABLE_DIFFUSION_XL = "stabilityai/stable-diffusion-xl-base-1.0";

// Video generation models (via Diffusers - may require dedicated endpoint)
const LTX_VIDEO = "Lightricks/LTX-Video";

export interface ImageGenerationRequest {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  style?: 'healing' | 'professional' | 'educational' | 'marketing';
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3';
}

export interface ImageGenerationResponse {
  imageBlob: Blob;
  imageBase64: string;
  modelUsed: string;
  prompt: string;
  metadata: {
    width: number;
    height: number;
    generatedAt: string;
  };
}

// Style presets for the healing ecosystem brand
const STYLE_PRESETS: Record<string, string> = {
  healing: "soft ethereal lighting, calming blue and cyan tones, natural organic elements, wellness aesthetic, professional medical imagery",
  professional: "clean modern design, corporate professional look, high quality photography style, sharp details, neutral background",
  educational: "clear informative style, diagram-like precision, educational illustration, labeled elements, scientific accuracy",
  marketing: "vibrant engaging visuals, attention-grabbing composition, brand-aligned colors (deep blue, cyan, gold), modern aesthetic"
};

// Aspect ratio to dimensions mapping
const ASPECT_RATIOS: Record<string, {width: number; height: number}> = {
  '1:1': { width: 1024, height: 1024 },
  '16:9': { width: 1344, height: 768 },
  '9:16': { width: 768, height: 1344 },
  '4:3': { width: 1152, height: 896 }
};

function buildEnhancedPrompt(request: ImageGenerationRequest): string {
  let prompt = request.prompt;
  
  if (request.style && STYLE_PRESETS[request.style]) {
    prompt = `${prompt}, ${STYLE_PRESETS[request.style]}`;
  }
  
  // Add quality enhancers
  prompt += ", high quality, detailed, 8k resolution";
  
  return prompt;
}

export async function generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
  const enhancedPrompt = buildEnhancedPrompt(request);
  const dimensions = request.aspectRatio 
    ? ASPECT_RATIOS[request.aspectRatio] 
    : { width: request.width || 1024, height: request.height || 1024 };

  let modelUsed = FLUX_SCHNELL;
  let imageResult: Blob;

  try {
    // Try FLUX.1-schnell first (fastest)
    const result = await hf.textToImage({
      model: FLUX_SCHNELL,
      inputs: enhancedPrompt,
      parameters: {
        width: dimensions.width,
        height: dimensions.height,
        negative_prompt: request.negativePrompt || "blurry, low quality, distorted, ugly, deformed"
      }
    }) as unknown as Blob;
    imageResult = result;
  } catch (fluxError: any) {
    console.log(`[HF Media] FLUX.1-schnell failed: ${fluxError.message}, trying SDXL...`);
    
    try {
      modelUsed = STABLE_DIFFUSION_XL;
      const result = await hf.textToImage({
        model: STABLE_DIFFUSION_XL,
        inputs: enhancedPrompt,
        parameters: {
          width: Math.min(dimensions.width, 1024),
          height: Math.min(dimensions.height, 1024),
          negative_prompt: request.negativePrompt || "blurry, low quality, distorted, ugly, deformed"
        }
      }) as unknown as Blob;
      imageResult = result;
    } catch (sdxlError: any) {
      throw new Error(`Image generation failed: ${sdxlError.message}`);
    }
  }

  // Convert blob to base64
  const arrayBuffer = await imageResult.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');

  return {
    imageBlob: imageResult,
    imageBase64: `data:image/png;base64,${base64}`,
    modelUsed,
    prompt: enhancedPrompt,
    metadata: {
      width: dimensions.width,
      height: dimensions.height,
      generatedAt: new Date().toISOString()
    }
  };
}

// Batch image generation for marketing campaigns
export async function generateImageBatch(
  prompts: string[],
  style: ImageGenerationRequest['style'] = 'marketing'
): Promise<Array<ImageGenerationResponse | {error: string}>> {
  const results = await Promise.allSettled(
    prompts.map(prompt => generateImage({ prompt, style }))
  );

  return results.map((result, idx) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return { error: `Failed to generate image for prompt ${idx + 1}: ${result.reason}` };
  });
}

// Marketing asset generator with brand presets
export async function generateMarketingAsset(
  type: 'social_post' | 'banner' | 'product_image' | 'infographic',
  description: string
): Promise<ImageGenerationResponse> {
  const typeConfigs: Record<string, {aspectRatio: ImageGenerationRequest['aspectRatio']; stylePrefix: string}> = {
    social_post: {
      aspectRatio: '1:1',
      stylePrefix: 'Social media post design, engaging and shareable,'
    },
    banner: {
      aspectRatio: '16:9',
      stylePrefix: 'Professional banner design, wide format, headline-ready space,'
    },
    product_image: {
      aspectRatio: '4:3',
      stylePrefix: 'Product photography style, clean background, professional lighting,'
    },
    infographic: {
      aspectRatio: '9:16',
      stylePrefix: 'Infographic style, data visualization, clear hierarchy,'
    }
  };

  const config = typeConfigs[type];
  const prompt = `${config.stylePrefix} ${description}`;

  return generateImage({
    prompt,
    aspectRatio: config.aspectRatio,
    style: 'marketing'
  });
}

// Check media generation availability
export async function checkMediaStatus(): Promise<{
  imageGeneration: boolean;
  videoGeneration: boolean;
  availableModels: string[];
  status: string;
}> {
  const availableModels: string[] = [];
  let imageAvailable = false;

  try {
    // Quick test with minimal generation
    await hf.textToImage({
      model: FLUX_SCHNELL,
      inputs: "test",
      parameters: { width: 64, height: 64 }
    });
    imageAvailable = true;
    availableModels.push(FLUX_SCHNELL);
  } catch (e) {
    console.log('[HF Media] FLUX.1-schnell not available');
  }

  if (!imageAvailable) {
    try {
      await hf.textToImage({
        model: STABLE_DIFFUSION_XL,
        inputs: "test",
        parameters: { width: 64, height: 64 }
      });
      imageAvailable = true;
      availableModels.push(STABLE_DIFFUSION_XL);
    } catch (e) {
      console.log('[HF Media] SDXL not available');
    }
  }

  return {
    imageGeneration: imageAvailable,
    videoGeneration: false, // Video requires dedicated endpoints
    availableModels,
    status: imageAvailable 
      ? `Media generation ready (${availableModels[0]})`
      : 'Media generation offline - check HF quota'
  };
}

// Image enhancement/editing (image-to-image)
export async function enhanceImage(
  imageBlob: Blob,
  enhancementPrompt: string
): Promise<ImageGenerationResponse> {
  // Note: Image-to-image requires specific model support
  // For now, we'll generate a new image based on the prompt
  return generateImage({
    prompt: enhancementPrompt,
    style: 'professional'
  });
}
