import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { downloadFile, getFileMetadata } from './google-drive-full';

export interface ExtractedPdfContent {
  title: string;
  text: string;
  numPages: number;
  fileId: string;
}

export async function extractPdfFromDrive(fileId: string): Promise<ExtractedPdfContent> {
  console.log(`[PDF Extractor] Fetching PDF from Drive: ${fileId}`);

  const metadata = await getFileMetadata(fileId);
  console.log(`[PDF Extractor] File name: ${metadata?.name}`);

  const buffer = await downloadFile(fileId);
  if (!buffer) {
    throw new Error(`[PDF Extractor] Failed to download PDF buffer for fileId: ${fileId}`);
  }
  console.log(`[PDF Extractor] Downloaded ${buffer.length} bytes`);

  const uint8Array = new Uint8Array(buffer);
  const pdf = await getDocument({
    data: uint8Array,
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
    disableFontFace: true,
  }).promise;

  let text = '';
  const numPages = pdf.numPages;

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    text += pageText + '\n\n';
  }

  console.log(`[PDF Extractor] Extracted ${numPages} pages, ${text.length} characters`);

  return {
    title: metadata?.name?.replace('.pdf', '') || 'Untitled',
    text,
    numPages,
    fileId,
  };
}

export function truncateText(text: string, maxChars: number = 30000): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '\n\n[Content truncated for processing...]';
}
