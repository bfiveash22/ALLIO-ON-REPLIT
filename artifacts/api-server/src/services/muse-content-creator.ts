import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || process.env.AI_INTEGRATIONS_GEMINI_API_KEY || 'dummy_key_to_prevent_startup_crash',
  ...((!process.env.GEMINI_API_KEY && !process.env.GOOGLE_GEMINI_API_KEY && process.env.AI_INTEGRATIONS_GEMINI_BASE_URL) ? { httpOptions: { apiVersion: '', baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL } } : {}),
});

export interface TrainingContent {
  title: string;
  description: string;
  sections: Array<{ title: string; content: string }>;
  keyPoints: string[];
  category: string;
  duration: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

export async function createTrainingContent(
  sourceText: string,
  topic: string,
  targetAudience: string = "health-conscious members"
): Promise<TrainingContent> {
  const prompt = `You are MUSE, the Marketing lead for ALLIO - a healing ecosystem by Forgotten Formula PMA. 
Your role is to transform dense academic or medical content into engaging, accessible training materials.

SOURCE CONTENT:
${sourceText}

TOPIC: ${topic}
TARGET AUDIENCE: ${targetAudience}

Create an engaging training module with:
1. A compelling title that draws learners in
2. A clear, motivating description (2-3 sentences)
3. 4-6 sections that break down the content into digestible lessons
4. 5 key takeaways that learners should remember
5. Estimated duration and difficulty level

Respond in JSON format:
{
  "title": "string",
  "description": "string",
  "sections": [{"title": "string", "content": "string (2-3 paragraphs each)"}],
  "keyPoints": ["string"],
  "category": "string",
  "duration": "string (e.g. '30 min')",
  "difficulty": "beginner|intermediate|advanced"
}

Make the content warm, informative, and empowering - not clinical or dry.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  const text = response.text || "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse training content from response");
  }

  return JSON.parse(jsonMatch[0]) as TrainingContent;
}

export async function summarizeChapter(
  chapterText: string,
  chapterTitle: string
): Promise<{ summary: string; keyPoints: string[] }> {
  const prompt = `You are MUSE, transforming dense content into engaging learning material.

CHAPTER: ${chapterTitle}
CONTENT:
${chapterText.slice(0, 8000)}

Create:
1. A clear, engaging summary (3-4 paragraphs) that captures the essential knowledge
2. 3-5 key takeaways

Respond in JSON: {"summary": "string", "keyPoints": ["string"]}

Make it accessible and actionable, not academic.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  const text = response.text || "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse chapter summary");
  }

  return JSON.parse(jsonMatch[0]);
}

export async function generateVideoScript(
  audioTranscript: string,
  topic: string
): Promise<{ title: string; scenes: Array<{ narration: string; visualDescription: string; duration: string }> }> {
  const prompt = `You are MUSE creating a video training script from audio content.

AUDIO TRANSCRIPT:
${audioTranscript.slice(0, 10000)}

TOPIC: ${topic}

Create a video script with:
1. An engaging title
2. 4-6 scenes, each with:
   - Narration text (what to say)
   - Visual description (what viewers see)
   - Approximate duration

Respond in JSON:
{
  "title": "string",
  "scenes": [{"narration": "string", "visualDescription": "string", "duration": "string"}]
}

Make it educational yet captivating.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  const text = response.text || "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse video script");
  }

  return JSON.parse(jsonMatch[0]);
}

export async function transcribeAudioContent(audioDescription: string): Promise<string> {
  const prompt = `Given this audio file description about diet and cancer, generate educational content that would be covered:

${audioDescription}

Create detailed, accurate educational content about the relationship between diet and cancer prevention/treatment. Include:
- Key nutritional principles
- Specific foods and their benefits
- Lifestyle recommendations
- Evidence-based approaches

Write 4-5 paragraphs of substantive educational content.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return response.text || "";
}
