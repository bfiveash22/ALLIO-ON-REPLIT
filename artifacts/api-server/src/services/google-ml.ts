import { google } from 'googleapis';

export async function getGoogleAuthClient() {
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
  
  return oauth2Client;
}

/**
 * Cloud Vision API
 * Used for OCR (Optical Character Recognition) on scanned member records, intake forms, or IDs.
 * Aligns with moving away from manual clerical work, empowering clinics to digitize instantly.
 */
export async function analyzeImageWithVision(imageUri: string) {
  try {
    const auth = await getGoogleAuthClient();
    const vision = google.vision({ version: 'v1', auth });
    
    const request = {
      image: { source: { imageUri } },
      features: [{ type: 'TEXT_DETECTION' }, { type: 'LABEL_DETECTION' }]
    };
    
    const response = await vision.images.annotate({
      requestBody: {
        requests: [request]
      }
    });
    
    return response.data.responses?.[0];
  } catch (error: any) {
    console.error('Failed to analyze image with Vision API:', error);
    throw new Error(`Vision API error: ${error.message}`);
  }
}

/**
 * Cloud Natural Language API
 * Used to extract conditions, symptoms, and methodologies from unstructured text.
 * Assists in validating member files against the FFPMA 2026 Protocol (5 Rs).
 */
export async function analyzeTextEntities(text: string) {
  try {
    const auth = await getGoogleAuthClient();
    const language = google.language({ version: 'v1', auth });
    
    const response = await language.documents.analyzeEntities({
      requestBody: {
        document: {
          type: 'PLAIN_TEXT',
          content: text
        },
        encodingType: 'UTF8'
      }
    });
    
    return response.data.entities;
  } catch (error: any) {
    console.error('Failed to analyze text with NLP API:', error);
    throw new Error(`NLP API error: ${error.message}`);
  }
}

/**
 * Cloud Speech-to-Text API
 * Used to transcribe audio of consultations, freeing practitioners from taking notes 
 * and allowing them to focus entirely on the human connection with the patient.
 */
export async function transcribeAudio(audioUri: string) {
  try {
    const auth = await getGoogleAuthClient();
    const speech = google.speech({ version: 'v1', auth });

    const response = await speech.speech.recognize({
      requestBody: {
        config: {
          encoding: 'LINEAR16', // Adjust based on actual input
          languageCode: 'en-US',
          enableAutomaticPunctuation: true,
        },
        audio: {
          uri: audioUri // Often requires a gs:// Google Cloud Storage path
        }
      }
    });

    return response.data.results;
  } catch (error: any) {
    console.error('Failed to transcribe audio:', error);
    throw new Error(`Speech API error: ${error.message}`);
  }
}

/**
 * Cloud Translation API
 * For clinics outside the native language, spreading the FFPMA methodology globally.
 */
export async function translateText(text: string, targetLanguage: string) {
  try {
    const auth = await getGoogleAuthClient();
    const translate = google.translate({ version: 'v2', auth });

    const response = await translate.translations.translate({
      requestBody: {
        q: [text],
        target: targetLanguage,
        format: 'text'
      }
    });

    return response.data.translations;
  } catch (error: any) {
    console.error('Failed to translate text:', error);
    throw new Error(`Translation API error: ${error.message}`);
  }
}

/**
 * Multimodal Vision Analysis for Blood Microscopy
 * Uses GPT-4o to analyze live blood microscopy images and correlate findings 
 * with the FFPMA 2026 Protocol.
 */
export async function analyzeBloodMicroscopyVision(imageBase64: string) {
  try {
    const openai = new (await import("openai")).default({ apiKey: process.env.OPENAI_API_KEY });
    
    // Ensure the base64 string is properly formatted for the OpenAI API
    const base64Data = imageBase64.startsWith('data:image') 
      ? imageBase64 
      : `data:image/jpeg;base64,${imageBase64}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert FFPMA hematologist and live blood microscopy specialist. 
Your task is to analyze the provided blood microscopy image and correlate any findings with the FFPMA 2026 Protocol.

Focus your analysis on the following areas:
1. **Morphological Observations**: Describe the shape, behavior, and arrangement of red blood cells (e.g., Rouleaux formation, echinocytes), white blood cells, and plasma conditions.
2. **Potential Root Causes**: Explain what these morphological patterns typically indicate (e.g., oxidative stress, acidic blood, liver stress, toxic burden, poor circulation).
3. **FFPMA Protocol Alignment**: Based on the 5 Rs (REDUCE, REBALANCE, REACTIVATE, RESTORE, REVITALIZE), suggest potential therapeutic focuses (e.g., specific IV therapies, peptides like BPC-157, minerals, detox protocols).

Format your response as a structured JSON object with the following keys:
- "observations": Array of strings describing visual findings.
- "rootCauses": Array of strings describing potential systemic causes.
- "protocolRecommendations": Array of strings suggesting FFPMA 2026 Protocol aligning actions.
- "clinicalSummary": A brief 2-3 sentence summary of the overall terrain.
- "confidence": "high", "moderate", or "low".`
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Please analyze this blood microscopy image." },
            { type: "image_url", image_url: { url: base64Data } }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No analysis returned from Vision AI.");

    return JSON.parse(content);
  } catch (error: any) {
    console.error('Failed to analyze blood microscopy with Vision AI:', error);
    throw new Error(`Vision AI error: ${error.message}`);
  }
}
