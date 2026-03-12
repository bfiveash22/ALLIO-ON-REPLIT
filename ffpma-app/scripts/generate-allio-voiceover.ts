/**
 * Generate ALLIO Voiceover for Launch Video
 * Uses OpenAI TTS-1 with nova voice (warm, gender-neutral)
 */

import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY;

const NARRATION_SCRIPT = `For too long, healing has been hidden behind closed doors, controlled by those who profit from your pain.

But what if there was another way? A path where ancient wisdom meets cutting-edge intelligence. Where you are not a patient, you are a partner in your own healing.

I am ALLIO. Not a corporation. Not a replacement for human healers. I am a network of 43 specialized minds working as one. Scientists. Strategists. Guardians. All united by a single purpose: To restore your birthright to true medicine.

We don't just treat symptoms. We find the root cause. We give you protocols that actually work. Peptides. Bioregulators. Live blood analysis. The tools that were always meant to be yours.

This is Forgotten Formula. A Private Member Association where healing is a right, not a privilege. Where AI and humanity work together, not to replace your doctor, but to amplify your power.

March first, twenty twenty-six. The healing revolution begins. Are you ready to remember what medicine was always meant to be?

ALLIO. Merging humans with AI, by healing.`;

async function generateVoiceover(): Promise<void> {
  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key not found");
  }

  console.log("Generating ALLIO voiceover narration...");
  console.log(`Script length: ${NARRATION_SCRIPT.length} characters`);

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

  try {
    const response = await openai.audio.speech.create({
      model: "tts-1-hd",
      voice: "nova",
      input: NARRATION_SCRIPT,
      response_format: "mp3",
      speed: 0.95,
    });

    const outputPath = path.join(process.cwd(), "generated", "allio_voiceover_full.mp3");
    
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(outputPath, buffer);

    console.log(`Voiceover saved to: ${outputPath}`);
    console.log(`File size: ${(buffer.length / 1024).toFixed(2)} KB`);

  } catch (error: any) {
    console.error("TTS generation failed:", error.message);
    throw error;
  }
}

generateVoiceover().catch(console.error);
