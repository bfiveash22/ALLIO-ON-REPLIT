import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pptxgen = require('pptxgenjs');
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';
import { getUncachableGoogleDriveClient, findAllioFolder, findFolderByName, createSubfolder } from '../server/services/drive';

async function createSlideDeck(title: string, text: string, filename: string): Promise<void> {
    let pres = new pptxgen();
    pres.layout = 'LAYOUT_16x9';
    pres.author = 'OPENCLAW';
    pres.title = title;

    // A nice master slide with FFPMA branding theme colors
    pres.defineSlideMaster({
        title: 'MASTER_SLIDE',
        background: { color: 'FFFFFF' },
        objects: [
            { rect: { x: 0, y: 0, w: '100%', h: 0.5, fill: { color: '028090' } } },
            { rect: { x: 0, y: 5.125, w: '100%', h: 0.5, fill: { color: '028090' } } },
            { text: { text: 'Forgotten Formula PMA | March 2026', options: { x: 0.5, y: 5.2, w: 9, h: 0.3, color: 'FFFFFF', fontSize: 10, align: 'left' } } }
        ]
    });

    const slideBlocks = text.split("## Slide").filter(s => s.trim().length > 0);

    for (const block of slideBlocks) {
        if (!block.match(/^\s*\d+:/) && !block.match(/^\s*[Tt]itle/)) {
            continue;
        }

        let slide = pres.addSlide({ masterName: 'MASTER_SLIDE' });

        const lines = block.split('\n');
        const slideHeaderLine = lines[0].replace(/\*\*/g, '').trim();
        let mainTitle = "Slide " + slideHeaderLine;
        let contentLines = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('**Title:**')) {
                mainTitle = line.substring(10).replace(/\*\*/g, '').trim();
            } else {
                contentLines.push(line);
            }
        }

        slide.addText(mainTitle, {
            x: 0.5, y: 0.8, w: 9, h: 0.6,
            fontSize: 32, bold: true, color: "028090"
        });

        // Parse content
        let yPos = 1.6;
        for (const line of contentLines) {
            if (!line) {
                yPos += 0.1;
                continue;
            }
            if (line.startsWith('---')) continue;

            let text = line.replace(/\*\*([^*]+)\*\*/g, '$1'); // Remove bold asterisks but keep text
            let isBullet = false;
            let isBold = line.includes('**');
            let indent = 0;

            if (text.startsWith('- ')) {
                isBullet = true;
                text = text.substring(2);
            } else if (text.match(/^\d+\.\s/)) {
                isBullet = true;
                text = text.substring(text.indexOf('.') + 2);
            } else if (text.startsWith('  - ')) {
                isBullet = true;
                text = text.substring(4);
                indent = 1;
            }

            const fontSize = isBullet ? 14 : (isBold ? 16 : 14);
            const color = isBold && !isBullet ? "00A896" : "36454F";

            let h = 0.3;
            if (text.length > 80) h = 0.5;
            if (text.length > 160) h = 0.7;

            if (yPos > 4.8) {
                // Slide overflow protection
                yPos = 1.6;
                slide = pres.addSlide({ masterName: 'MASTER_SLIDE' });
                slide.addText(mainTitle + " (Cont.)", {
                    x: 0.5, y: 0.8, w: 9, h: 0.6,
                    fontSize: 32, bold: true, color: "028090"
                });
            }

            slide.addText(text.trim(), {
                x: indent ? 1.0 : 0.5,
                y: yPos,
                w: indent ? 8.5 : 9,
                h: h,
                fontSize: fontSize,
                bold: isBold && !isBullet,
                color: color,
                bullet: isBullet,
                margin: 0
            });

            yPos += h;
        }
    }

    await pres.writeFile({ fileName: filename });
}

async function uploadToDrive(fileName: string, localFilePath: string, folderId: string) {
    const drive = await getUncachableGoogleDriveClient();
    const media = {
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        body: fs.createReadStream(localFilePath)
    };

    const requestBody = {
        name: fileName,
        parents: [folderId],
        mimeType: 'application/vnd.google-apps.presentation'
    };

    const res = await drive.files.create({
        requestBody,
        media: media,
        fields: 'id, webViewLink, name',
    });

    return res.data;
}

async function main() {
    console.log("Starting Genuine PPTX Generation & Drive Upload...");
    const contentPath = path.join(process.cwd(), 'content_utf8.md');
    const rawContent = fs.readFileSync(contentPath, 'utf8');

    const p1Start = rawContent.indexOf('# PRESENTATION 1');
    const p2Start = rawContent.indexOf('# PRESENTATION 2');
    const p3Start = rawContent.indexOf('# PRESENTATION 3');
    const pEnd = rawContent.indexOf('# END OF PRESENTATIONS');

    const presentations = [
        {
            name: "Annette Gomer - Metastatic Adenocarcinoma Protocol - FFPMA",
            filename: "patient-1.pptx",
            startIndex: p1Start,
            endIndex: p2Start
        },
        {
            name: "Recurring Breast Cancer - Mercury Toxicity Protocol - FFPMA",
            filename: "patient-2.pptx",
            startIndex: p2Start,
            endIndex: p3Start
        },
        {
            name: "80M Crop Duster - Stage 4 CKD Reversal - FFPMA",
            filename: "patient-3.pptx",
            startIndex: p3Start,
            endIndex: pEnd > -1 ? pEnd : rawContent.length
        }
    ];

    let allioFolder = await findAllioFolder();
    if (!allioFolder) {
        console.error("Could not find ALLIO folder");
        process.exit(1);
    }

    let memberContentId = await findFolderByName(allioFolder.id, 'Member Content');
    if (!memberContentId) {
        const mcFolder = await createSubfolder(allioFolder.id, 'Member Content');
        memberContentId = mcFolder.id;
    }

    let presentationsFolderId = await findFolderByName(memberContentId, 'Presentations');
    if (!presentationsFolderId) {
        const pFolder = await createSubfolder(memberContentId, 'Presentations');
        presentationsFolderId = pFolder.id;
    }

    for (const p of presentations) {
        if (p.startIndex === -1 || p.endIndex === -1) continue;
        console.log(`Generating PPTX for: ${p.name}`);
        const text = rawContent.substring(p.startIndex, p.endIndex);

        await createSlideDeck(p.name, text, p.filename);

        console.log(`Uploading ${p.name} to Drive converting to Google Slides...`);
        const result = await uploadToDrive(p.name, path.join(process.cwd(), p.filename), presentationsFolderId);

        console.log(`✅ Success: ${result.name}`);
        console.log(`➡️ URL: ${result.webViewLink}`);
    }
}

main().catch(console.error);
