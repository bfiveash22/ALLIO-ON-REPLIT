import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import {
  findAllioFolder,
  findFolderByName,
  createSubfolder,
  getUncachableGoogleDriveClient,
} from "../src/services/drive";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FOUNDING_FATHERS_DIR = path.resolve(__dirname, "../../ffpma/public/assets/founding-fathers");

async function main() {
  const allioFolder = await findAllioFolder();
  if (!allioFolder) {
    console.error("ALLIO folder not found");
    process.exit(1);
  }

  let brandAssetsId = await findFolderByName(allioFolder.id, "Brand Assets");
  if (!brandAssetsId) {
    const folder = await createSubfolder(allioFolder.id, "Brand Assets");
    brandAssetsId = folder.id;
    console.log("Created Brand Assets folder");
  }

  let foundingFathersId = await findFolderByName(brandAssetsId, "Founding Fathers");
  if (!foundingFathersId) {
    const folder = await createSubfolder(brandAssetsId, "Founding Fathers");
    foundingFathersId = folder.id;
    console.log("Created Founding Fathers subfolder");
  }

  const files = fs.readdirSync(FOUNDING_FATHERS_DIR).filter(f => f.endsWith(".png"));
  console.log(`Found ${files.length} images to upload`);

  const drive = await getUncachableGoogleDriveClient();

  for (const file of files) {
    const filePath = path.join(FOUNDING_FATHERS_DIR, file);
    const stat = fs.statSync(filePath);

    console.log(`Uploading ${file} (${(stat.size / 1024).toFixed(0)} KB)...`);

    await drive.files.create({
      requestBody: {
        name: file,
        parents: [foundingFathersId],
      },
      media: {
        mimeType: "image/png",
        body: fs.createReadStream(filePath),
      },
      fields: "id, name, webViewLink",
    });

    console.log(`  Uploaded: ${file}`);
  }

  console.log(`\nAll ${files.length} Founding Fathers images uploaded to Brand Assets/Founding Fathers/`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
