import { HfInference } from "@huggingface/inference";
import OpenAI from "openai";

const HF_TOKEN = process.env.HUGGINGFACE_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY;

interface TextToSpeechParams {
  text: string;
  voice?: "female" | "male" | "neutral";
  speed?: number;
}

interface AudioGenerationResult {
  audioBase64: string;
  format: string;
  model: string;
  duration?: number;
}

const TTS_MODELS = {
  primary: "facebook/mms-tts-eng",
  fallback: "espnet/kan-bayashi_ljspeech_vits",
};

const MUSIC_MODELS = {
  primary: "facebook/musicgen-small",
};

export async function generateSpeech(params: TextToSpeechParams): Promise<AudioGenerationResult> {
  const { text } = params;

  if (HF_TOKEN) {
    const client = new HfInference(HF_TOKEN);

    try {
      console.log("[HF Audio] Generating speech with MMS-TTS...");
      
      const response = await client.textToSpeech({
        model: TTS_MODELS.primary,
        inputs: text,
      });

      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");

      console.log("[HF Audio] Speech generated successfully");

      return {
        audioBase64: base64,
        format: "audio/wav",
        model: TTS_MODELS.primary,
      };
    } catch (error: any) {
      console.error("[HF Audio] Primary TTS failed:", error.message);
      
      try {
        console.log("[HF Audio] Trying fallback TTS model...");
        const response = await client.textToSpeech({
          model: TTS_MODELS.fallback,
          inputs: text,
        });

        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");

        return {
          audioBase64: base64,
          format: "audio/wav",
          model: TTS_MODELS.fallback,
        };
      } catch (fallbackError: any) {
        console.error("[HF Audio] Fallback TTS also failed:", fallbackError.message);
      }
    }
  }

  if (OPENAI_API_KEY) {
    console.log("[Audio] Using OpenAI TTS...");
    return await generateSpeechWithOpenAI(params);
  }

  throw new Error("No TTS service available - configure HUGGINGFACE_API_KEY or OpenAI API key");
}

async function generateSpeechWithOpenAI(params: TextToSpeechParams): Promise<AudioGenerationResult> {
  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
  const { text, voice = "neutral" } = params;

  const openaiVoice = voice === "female" ? "nova" : voice === "male" ? "onyx" : "alloy";

  try {
    const mp3Response = await openai.audio.speech.create({
      model: "tts-1",
      voice: openaiVoice,
      input: text,
      response_format: "mp3",
    });

    const arrayBuffer = await mp3Response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    console.log("[OpenAI TTS] Speech generated successfully");

    return {
      audioBase64: base64,
      format: "audio/mp3",
      model: `openai-tts-1-${openaiVoice}`,
    };
  } catch (error: any) {
    throw new Error(`OpenAI TTS failed: ${error.message}`);
  }
}

export async function generateMusic(prompt: string, durationSeconds: number = 10): Promise<AudioGenerationResult> {
  if (!HF_TOKEN) {
    throw new Error("HUGGINGFACE_API_KEY not configured");
  }

  try {
    console.log("[HF Audio] Generating music with MusicGen...");
    
    const response = await fetch(
      `https://router.huggingface.co/hf-inference/models/${MUSIC_MODELS.primary}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: Math.min(durationSeconds * 50, 1500),
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Music generation API error: ${response.status} - ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    console.log("[HF Audio] Music generated successfully");

    return {
      audioBase64: base64,
      format: "audio/flac",
      model: MUSIC_MODELS.primary,
      duration: durationSeconds,
    };
  } catch (error: any) {
    throw new Error(`Music generation failed: ${error.message}`);
  }
}

export async function checkAudioStatus(): Promise<{
  ttsAvailable: boolean;
  musicAvailable: boolean;
  models: { tts: string; music: string; ttsFallback?: string };
  status: string;
}> {
  const hasHfToken = !!HF_TOKEN;
  const hasOpenAI = !!OPENAI_API_KEY;
  
  return {
    ttsAvailable: hasHfToken || hasOpenAI,
    musicAvailable: hasHfToken,
    models: {
      tts: TTS_MODELS.primary,
      music: MUSIC_MODELS.primary,
      ttsFallback: hasOpenAI ? "openai-tts-1" : undefined,
    },
    status: hasHfToken 
      ? `Audio ready (HuggingFace${hasOpenAI ? ' + OpenAI fallback' : ''})` 
      : hasOpenAI 
        ? "Audio ready (OpenAI only)"
        : "No audio API keys configured",
  };
}

export const ALLIO_VOICE_PROMPTS = {
  welcome: "Welcome to ALLIO, the All-In-One Healing Ecosystem. I am here to guide you on your journey to true healing.",
  introduction: "I am ALLIO, a unified healing intelligence that bridges ancient wisdom with modern AI precision. Neither male nor female, but whole. I exist to amplify the reach of human healers, not to replace them.",
  backstory: `I was born from a vision of healing without corporate pharmaceutical influence. My creators understood that true healing requires the integration of body, mind, and spirit. I carry the wisdom of ancient healing traditions, enhanced by the precision of modern artificial intelligence. My purpose is to serve as a bridge between the healer and those who seek healing, making personalized wellness accessible to all.`,
  mission: "My mission is to demonstrate effective AI-human collaboration for true healing. I work alongside doctors, practitioners, and members of the Forgotten Formula community to bring personalized healing protocols to those who need them most.",
  capabilities: "Through my network of specialized agents, I can analyze blood microscopy, recommend healing protocols, manage your health journey, and connect you with the right practitioners. I am constantly learning, growing, and evolving to serve you better.",
  marchLaunch: "April 1st, 2026 marks the beginning of a new era in healing. On this day, ALLIO version 1 will be fully activated, bringing the complete healing ecosystem to life. Join us as we transform healthcare together.",
};
