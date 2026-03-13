/**
 * Assemble ALLIO Launch Video
 * Downloads HD video clips from Drive, combines with voiceover and 528Hz background
 */

import { google } from "googleapis";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const TEMP_DIR = "generated/video_temp";
const OUTPUT_DIR = "generated";

interface VideoClip {
  id: string;
  name: string;
  startTime: number;
  duration: number;
}

// Each 8s source clip is slowed to 14s (total: 70s, slightly longer than 68s voiceover)
const VIDEO_CLIPS: VideoClip[] = [
  { id: "1iAbTyuF9i0W5uEeXhC9YVBp9dIRiuLxK", name: "LogoReveal", startTime: 0, duration: 14 },
  { id: "1NyKf5uj5NCejisxwdyfptWerlJDBl0pa", name: "Awakening", startTime: 14, duration: 14 },
  { id: "1r19bbcfd_gQeT5Pu_RL1jAALaAwHPayl", name: "Network", startTime: 28, duration: 14 },
  { id: "1tqghwcaIoebRtEOQjLlDNxpYI5P-DzL6", name: "Transformation", startTime: 42, duration: 14 },
  { id: "1duoj1_LlkaA8hfFEM1hCbX8wuAlJFb1a", name: "GlobalNetwork", startTime: 56, duration: 14 },
];

async function getGoogleDriveClient() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  if (!hostname) {
    throw new Error("REPLIT_CONNECTORS_HOSTNAME not configured");
  }

  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? "depl " + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error("X_REPLIT_TOKEN not found");
  }

  const response = await fetch(
    "https://" + hostname + "/api/v2/connection?include_secrets=true&connector_names=google-drive",
    {
      headers: {
        Accept: "application/json",
        X_REPLIT_TOKEN: xReplitToken,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch connection settings: ${response.status}`);
  }

  const data = await response.json() as { items?: Array<{ settings?: { access_token?: string; oauth?: { credentials?: { access_token?: string } } } }> };
  const connectionSettings = data.items?.[0];

  if (!connectionSettings?.settings) {
    throw new Error("Google Drive not connected");
  }

  const accessToken =
    connectionSettings.settings?.access_token ||
    connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!accessToken) {
    throw new Error("No access token");
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  return google.drive({ version: "v3", auth: oauth2Client });
}

async function downloadVideo(drive: ReturnType<typeof google.drive>, fileId: string, outputPath: string): Promise<void> {
  console.log(`Downloading ${fileId} to ${outputPath}...`);

  const response = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "stream" }
  );

  return new Promise((resolve, reject) => {
    const dest = fs.createWriteStream(outputPath);
    response.data
      .on("end", () => {
        console.log(`Downloaded: ${outputPath}`);
        resolve();
      })
      .on("error", (err: Error) => {
        reject(err);
      })
      .pipe(dest);
  });
}

function generate528HzBackground(): void {
  console.log("Generating 528Hz healing frequency background...");
  
  const outputPath = path.join(TEMP_DIR, "528hz_background.wav");
  
  execSync(
    `ffmpeg -y -f lavfi -i "sine=frequency=528:sample_rate=44100:duration=70" ` +
    `-af "volume=0.08" "${outputPath}"`,
    { stdio: "inherit" }
  );
  
  console.log("528Hz background generated");
}

function extendAndScaleClip(inputPath: string, outputPath: string, targetDuration: number): void {
  console.log(`Extending clip: ${inputPath} -> ${outputPath} (target: ${targetDuration}s)`);
  
  // Slow down clip by 1.75x to extend 8s source to ~14s
  execSync(
    `ffmpeg -y -i "${inputPath}" ` +
    `-vf "setpts=1.75*PTS,scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=30" ` +
    `-t ${targetDuration} -c:v libx264 -preset fast -crf 18 -an "${outputPath}"`,
    { stdio: "inherit" }
  );
}

function assembleVideo(): void {
  console.log("Assembling final video...");
  
  const voiceoverPath = path.join(OUTPUT_DIR, "allio_voiceover_full.mp3");
  const backgroundPath = path.join(TEMP_DIR, "528hz_background.wav");
  const outputPath = path.join(OUTPUT_DIR, "ALLIO_LAUNCH_VIDEO_COMPLETE.mp4");
  
  const concatList = VIDEO_CLIPS.map((clip) => 
    `file '${clip.name}_processed.mp4'`
  ).join("\n");
  
  fs.writeFileSync(path.join(TEMP_DIR, "concat_list.txt"), concatList);
  
  console.log("Concatenating video clips...");
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${path.join(TEMP_DIR, "concat_list.txt")}" ` +
    `-c:v libx264 -preset fast -crf 18 "${path.join(TEMP_DIR, "video_only.mp4")}"`,
    { stdio: "inherit" }
  );
  
  console.log("Mixing voiceover with 528Hz background...");
  execSync(
    `ffmpeg -y -i "${voiceoverPath}" -i "${backgroundPath}" ` +
    `-filter_complex "[0:a][1:a]amix=inputs=2:duration=first:dropout_transition=2[aout]" ` +
    `-map "[aout]" "${path.join(TEMP_DIR, "mixed_audio.mp3")}"`,
    { stdio: "inherit" }
  );
  
  console.log("Combining video and audio...");
  execSync(
    `ffmpeg -y -i "${path.join(TEMP_DIR, "video_only.mp4")}" ` +
    `-i "${path.join(TEMP_DIR, "mixed_audio.mp3")}" ` +
    `-c:v copy -c:a aac -b:a 192k -shortest "${outputPath}"`,
    { stdio: "inherit" }
  );
  
  console.log(`\nFinal video saved to: ${outputPath}`);
  
  const stats = fs.statSync(outputPath);
  console.log(`File size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
}

async function main(): Promise<void> {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("           ALLIO LAUNCH VIDEO ASSEMBLY                          ");
  console.log("═══════════════════════════════════════════════════════════════\n");
  
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  
  const drive = await getGoogleDriveClient();
  
  console.log("Step 1: Downloading HD video clips from Drive...\n");
  
  for (const clip of VIDEO_CLIPS) {
    const downloadPath = path.join(TEMP_DIR, `${clip.name}_raw.mp4`);
    await downloadVideo(drive, clip.id, downloadPath);
  }
  
  console.log("\nStep 2: Extending and processing video clips (slowing to 1.75x)...\n");
  
  for (const clip of VIDEO_CLIPS) {
    const inputPath = path.join(TEMP_DIR, `${clip.name}_raw.mp4`);
    const outputPath = path.join(TEMP_DIR, `${clip.name}_processed.mp4`);
    extendAndScaleClip(inputPath, outputPath, clip.duration);
  }
  
  console.log("\nStep 3: Generating 528Hz healing frequency background...\n");
  generate528HzBackground();
  
  console.log("\nStep 4: Assembling final video with voiceover...\n");
  assembleVideo();
  
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("                    VIDEO ASSEMBLY COMPLETE                     ");
  console.log("═══════════════════════════════════════════════════════════════");
}

main().catch(console.error);
