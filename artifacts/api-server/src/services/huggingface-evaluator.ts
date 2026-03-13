import { log } from '../index';

export interface HFModel {
  id: string;
  author: string;
  lastModified: string;
  downloads: number;
  tags: string[];
  description?: string;
}

/**
 * Searches the HuggingFace API for the highest trending, newly uploaded medical models.
 * Used by the ARCHITECT agent to evaluate if the ecosystem should upgrade its inference engines.
 */
export async function fetchTrendingMedicalModels(limit: number = 3): Promise<HFModel[]> {
  try {
    const response = await fetch('https://huggingface.co/api/models?search=medical&sort=downloads&direction=-1&limit=20');
    if (!response.ok) {
      throw new Error(`HF API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Filter out wildly obsolete or irrelevant models
    const validModels = data.filter((m: any) => 
      !m.id.toLowerCase().includes('deprecated') && 
      !m.id.toLowerCase().includes('test') &&
      m.downloads > 100 // Ensure it has some community traction
    );

    return validModels.slice(0, limit).map((m: any) => ({
      id: m.id,
      author: m.author,
      lastModified: m.lastModified,
      downloads: m.downloads,
      tags: m.tags || [],
    }));
  } catch (err: any) {
    log(`[HF Evaluator] Failed to fetch trending medical models: ${err.message}`, 'huggingface');
    return [];
  }
}
