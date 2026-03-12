import { db } from '../db';
import { products } from '@shared/schema';
import { eq, isNull, or } from 'drizzle-orm';
import { GoogleGenAI } from "@google/genai";
import { generateMarketingAsset, checkMediaStatus } from './huggingface-media';
import { sentinel } from './sentinel';
import fs from 'fs/promises';
import path from 'path';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || process.env.AI_INTEGRATIONS_GEMINI_API_KEY || 'dummy_key_to_prevent_startup_crash',
  ...((!process.env.GEMINI_API_KEY && !process.env.GOOGLE_GEMINI_API_KEY && process.env.AI_INTEGRATIONS_GEMINI_BASE_URL) ? { httpOptions: { apiVersion: '', baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL } } : {}),
});

export class MarketingOrchestrator {
  /**
   * Run the daily marketing enhancement loop for products.
   */
  async runDailyProductEnhancement(limit: number = 3): Promise<void> {
    console.log('[MARKETING] Starting daily product enhancement loop...');
    
    try {
      // 1. Check if media generation is available (PIXEL)
      const mediaStatus = await checkMediaStatus();
      if (!mediaStatus.imageGeneration) {
        console.warn('[MARKETING] PIXEL image generation is offline. Aborting enhancement loop.');
        return;
      }

      // 2. Find products that lack an image
      const productsWithoutImages = await db.query.products.findMany({
        where: or(isNull(products.imageUrl), eq(products.imageUrl, '')),
        limit: limit,
      });

      if (productsWithoutImages.length === 0) {
        console.log('[MARKETING] No products found needing images right now.');
        return;
      }

      console.log(`[MARKETING] Found ${productsWithoutImages.length} products needing images. Engaging MUSE & PIXEL.`);
      await sentinel.broadcastSystemStatus(`Marketing Machine active. Enhancing ${productsWithoutImages.length} products.`, 2);

      const uploadsDir = path.join(process.cwd(), 'client', 'public', 'uploads');
      await fs.mkdir(uploadsDir, { recursive: true });

      for (const product of productsWithoutImages) {
        await this.enhanceProductMedia(product, uploadsDir);
      }

      await sentinel.broadcastSystemStatus(`Marketing Machine finished daily enhancement loop.`, 1);

    } catch (error: any) {
      console.error('[MARKETING] Error in daily enhancement loop:', error);
      await sentinel.notify({
        type: 'system_alert',
        title: 'Marketing Loop Error',
        message: `Failed to complete product enhancements: ${error.message}`,
        agentId: 'MUSE',
        division: 'marketing',
        priority: 3
      });
    }
  }

  /**
   * Instructs MUSE to draft an image prompt, then PIXEL to generate it.
   */
  private async enhanceProductMedia(product: any, uploadsDir: string) {
    console.log(`[MARKETING] Enhancing product: ${product.name}`);
    try {
      // Step 1: MUSE creates a visual description based on product data
      const musePrompt = `You are MUSE, the Marketing Lead. We need to generate a beautiful, professional e-commerce product image for the following item:
Product Name: "${product.name}"
Description: "${product.description || product.shortDescription || 'A holistic health and wellness product.'}"

Write a detailed, 1-2 sentence visual description that can be fed into an AI image generator (like Midjourney or Flux). It should be styled as "Product photography style, clean background, professional lighting,..." Focus on the actual physical appearance the product should have (bottle, capsules, tincture, natural ingredients around it). DO NOT include text placeholders.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: musePrompt,
      });

      const visualDescription = response.text || `Product photography style, professional lighting, ${product.name}, clean background, wellness aesthetic`;
      console.log(`[MUSE] Drafted visual description for ${product.name}: ${visualDescription}`);

      // Step 2: PIXEL generates the image
      const pixelResult = await generateMarketingAsset('product_image', visualDescription);
      
      if (!pixelResult || !pixelResult.imageBlob) {
         throw new Error('PIXEL failed to return valid image blob.');
      }

      // Step 3: Save the image locally
      const filename = `product_${product.id}_${Date.now()}.png`;
      const filepath = path.join(uploadsDir, filename);
      
      // Convert blob to buffer
      const arrayBuffer = await pixelResult.imageBlob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await fs.writeFile(filepath, buffer);

      const publicUrl = `/uploads/${filename}`;

      // Step 4: Update the database
      await db.update(products)
        .set({ imageUrl: publicUrl })
        .where(eq(products.id, product.id));

      console.log(`[MARKETING] Successfully updated ${product.name} with new image: ${publicUrl}`);

      // Notify Sentinel
      await sentinel.notifyProductUpdate(product.name, `Generated new high-quality product image via PIXEL (Model: ${pixelResult.modelUsed})`);

    } catch (error: any) {
      console.error(`[MARKETING] Failed to enhance product ${product.name}:`, error.message);
    }
  }
}

export const marketingOrchestrator = new MarketingOrchestrator();
