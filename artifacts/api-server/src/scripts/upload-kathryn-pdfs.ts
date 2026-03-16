import { uploadFileFromPath } from "../services/drive.js";

async function main() {
  const folderId = "1ui5cbRdyVhIojeG44EYg17puOdt4bStH";
  const files = [
    "/home/runner/workspace/attached_assets/Kathryn_Smith_Full_Protocol.pdf",
    "/home/runner/workspace/attached_assets/Kathryn_Smith_Daily_Schedule.pdf",
    "/home/runner/workspace/attached_assets/Kathryn_Smith_Peptide_Schedule.pdf",
  ];

  for (const filePath of files) {
    try {
      const result = await uploadFileFromPath(folderId, filePath);
      console.log("Uploaded:", filePath.split("/").pop(), "->", result?.webViewLink || JSON.stringify(result));
    } catch (e: any) {
      console.error("Failed:", filePath.split("/").pop(), e.message);
    }
  }
}

main().catch(console.error);
