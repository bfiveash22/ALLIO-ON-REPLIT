/**
 * Upload ALLIO Launch Video to Google Drive
 */

import { google } from "googleapis";
import * as fs from "fs";
import * as path from "path";

const ALLIO_FOLDER_ID = "16wOdbJPoOVOz5GE0mtlzf84c896JX1UC";
const PRISM_VIDEOS_FOLDER_ID = "16pddqtE-mwcEiPgjDjMPkdVU7lOnQQhs";

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

async function uploadVideo(): Promise<void> {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("        UPLOADING ALLIO LAUNCH VIDEO TO GOOGLE DRIVE            ");
  console.log("═══════════════════════════════════════════════════════════════\n");
  
  const videoPath = "generated/ALLIO_LAUNCH_VIDEO_COMPLETE.mp4";
  
  if (!fs.existsSync(videoPath)) {
    throw new Error(`Video file not found: ${videoPath}`);
  }
  
  const stats = fs.statSync(videoPath);
  console.log(`Video file: ${videoPath}`);
  console.log(`File size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB\n`);
  
  const drive = await getGoogleDriveClient();
  
  const timestamp = new Date().toISOString().split('T')[0];
  const fileName = `PRISM_ALLIO_Launch_Video_Complete_${timestamp}.mp4`;
  
  console.log(`Uploading as: ${fileName}`);
  console.log(`Destination folder: PRISM-Videos (${PRISM_VIDEOS_FOLDER_ID})\n`);
  
  const fileMetadata = {
    name: fileName,
    parents: [PRISM_VIDEOS_FOLDER_ID],
    description: "ALLIO Launch Video with professional narration explaining the 43-agent healing network, mission 'Merging humans with AI by healing', and April 1, 2026 launch date. Features 528Hz healing frequency background."
  };
  
  const media = {
    mimeType: "video/mp4",
    body: fs.createReadStream(videoPath)
  };
  
  console.log("Uploading... (this may take a minute for 135MB file)");
  
  const result = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: "id, name, webViewLink, size"
  });
  
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("                  UPLOAD COMPLETE!                              ");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`File ID: ${result.data.id}`);
  console.log(`File Name: ${result.data.name}`);
  console.log(`View Link: ${result.data.webViewLink}`);
  console.log("═══════════════════════════════════════════════════════════════\n");
}

uploadVideo().catch(console.error);
