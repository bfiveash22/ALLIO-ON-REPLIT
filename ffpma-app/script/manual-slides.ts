import { findAllioFolder, uploadPresentation, findFolderByName, createSubfolder } from '../server/services/drive';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

async function generateGoogleSlides() {
    console.log("Starting script to convert manual content to Google Slides...");

    try {
        const contentPath = path.join(process.cwd(), 'content_utf8.md');
        const rawContent = fs.readFileSync(contentPath, 'utf8');

        // Split into the 3 presentations using regex to handle newlines
        const p1Start = rawContent.indexOf('# PRESENTATION 1');
        const p2Start = rawContent.indexOf('# PRESENTATION 2');
        const p3Start = rawContent.indexOf('# PRESENTATION 3');
        const pEnd = rawContent.indexOf('# END OF PRESENTATIONS');

        const presentations = [
            {
                title: "Annette Gomer - Metastatic Adenocarcinoma Protocol - FFPMA",
                startIndex: p1Start,
                endIndex: p2Start
            },
            {
                title: "Recurring Breast Cancer - Mercury Toxicity Protocol - FFPMA",
                startIndex: p2Start,
                endIndex: p3Start
            },
            {
                title: "80M Crop Duster - Stage 4 CKD Reversal - FFPMA",
                startIndex: p3Start,
                endIndex: pEnd > -1 ? pEnd : rawContent.length
            }
        ];

        let allioFolder = await findAllioFolder();
        if (!allioFolder) {
            console.error("Could not find root ALLIO folder");
            process.exit(1);
        }

        // Find member content
        let memberContentId = await findFolderByName(allioFolder.id, 'Member Content');
        if (!memberContentId) {
            console.log("Could not find Member Content folder. Creating it...");
            const mcFolder = await createSubfolder(allioFolder.id, 'Member Content');
            memberContentId = mcFolder.id;
        }

        let presentationsFolderId = await findFolderByName(memberContentId, 'Presentations');
        if (!presentationsFolderId) {
            const pFolder = await createSubfolder(memberContentId, 'Presentations');
            presentationsFolderId = pFolder.id;
        }

        // Generate the slides
        for (const p of presentations) {
            if (p.startIndex === -1 || p.endIndex === -1) {
                console.error(`Could not extract boundaries for: ${p.title}`);
                continue;
            }

            const slideContent = rawContent.substring(p.startIndex, p.endIndex).trim();
            console.log(`Extracting slides for ${p.title} (${slideContent.length} chars)`);

            const result = await uploadPresentation(presentationsFolderId, p.title, slideContent, 'text/plain');
            if (result) {
                console.log(`✅ Success: ${p.title}`);
                console.log(`➡️ URL: ${result.webViewLink}`);
            } else {
                console.error(`❌ Failed to upload: ${p.title}`);
            }
        }

        console.log("All manual presentations uploaded!");
        process.exit(0);
    } catch (error) {
        console.error("Error creating manual presentations:", error);
        process.exit(1);
    }
}

generateGoogleSlides();
