import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini client using the new official SDK
let ai: GoogleGenAI | null = null;
try {
    if (process.env.GEMINI_API_KEY) {
        ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
} catch (e) {
    console.error('[Gemini Provider] Failed to initialize:', e);
}

export async function analyzeWithGemini(prompt: string, context?: string): Promise<string> {
    if (!ai) {
        throw new Error('Gemini API is not configured (missing GEMINI_API_KEY)');
    }

    try {
        const fullPrompt = context ? `Context:\n${context}\n\nTask:\n${prompt}` : prompt;

        // We use gemini-1.5-pro for deep analysis
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-pro',
            contents: fullPrompt,
        });

        return response.text || "No analysis returned.";
    } catch (error: any) {
        console.error('[Gemini API] Error:', error);
        throw new Error(`Gemini Analysis Failed: ${error.message}`);
    }
}
