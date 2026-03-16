import { db } from '../db';
import { agentLibraryChunks, agentLibraryFiles } from '@shared/schema';
import { eq, and, sql, ilike, or } from 'drizzle-orm';
import { downloadFile } from './google-drive-full';
import { listAgentLibraryFiles } from './drive';

const CHUNK_SIZE = 2000;
const CHUNK_OVERLAP = 200;

export async function extractTextFromBuffer(buffer: Buffer, mimeType: string, fileName: string): Promise<string> {
  if (mimeType === 'text/plain') {
    return buffer.toString('utf-8');
  }

  if (mimeType === 'application/pdf') {
    return extractPdfText(buffer);
  }

  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return extractDocxText(buffer);
  }

  if (mimeType === 'application/msword') {
    throw new Error('Legacy .doc format is not supported for text extraction. Please convert to .docx format.');
  }

  if (mimeType === 'application/epub+zip') {
    return extractEpubText(buffer);
  }

  throw new Error(`Unsupported file type for text extraction: ${mimeType}`);
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const uint8Array = new Uint8Array(buffer);
  const pdf = await getDocument({
    data: uint8Array,
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
    disableFontFace: true,
  }).promise;

  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    text += pageText + '\n\n';
  }
  return text;
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

const MAX_EXTRACTED_TEXT_SIZE = 10 * 1024 * 1024;

async function extractEpubText(buffer: Buffer): Promise<string> {
  const AdmZip = (await import('adm-zip')).default;
  const { JSDOM } = await import('jsdom');

  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();
  const textParts: string[] = [];
  let totalSize = 0;

  for (const entry of entries) {
    if (entry.header.size > MAX_EXTRACTED_TEXT_SIZE) continue;
    if (entry.entryName.endsWith('.xhtml') || entry.entryName.endsWith('.html') || entry.entryName.endsWith('.htm')) {
      try {
        const html = entry.getData().toString('utf-8');
        totalSize += html.length;
        if (totalSize > MAX_EXTRACTED_TEXT_SIZE) break;
        const dom = new JSDOM(html);
        const bodyText = dom.window.document.body?.textContent?.trim();
        if (bodyText && bodyText.length > 10) {
          textParts.push(bodyText);
        }
      } catch {
        // skip malformed entries
      }
    }
  }

  return textParts.join('\n\n');
}

export function chunkText(text: string, fileName: string): Array<{ content: string; chunkTitle: string; chunkIndex: number }> {
  const cleaned = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

  if (cleaned.length <= CHUNK_SIZE) {
    return [{ content: cleaned, chunkTitle: `${fileName} [1/1]`, chunkIndex: 0 }];
  }

  const sections = splitBySections(cleaned);
  const chunks: Array<{ content: string; chunkTitle: string; chunkIndex: number }> = [];

  for (const section of sections) {
    if (section.length <= CHUNK_SIZE) {
      chunks.push({
        content: section,
        chunkTitle: `${fileName} [${chunks.length + 1}]`,
        chunkIndex: chunks.length,
      });
    } else {
      const subChunks = splitBySize(section, CHUNK_SIZE, CHUNK_OVERLAP);
      for (const sub of subChunks) {
        chunks.push({
          content: sub,
          chunkTitle: `${fileName} [${chunks.length + 1}]`,
          chunkIndex: chunks.length,
        });
      }
    }
  }

  for (let i = 0; i < chunks.length; i++) {
    chunks[i].chunkTitle = `${fileName} [${i + 1}/${chunks.length}]`;
  }

  return chunks;
}

function splitBySections(text: string): string[] {
  const sectionPattern = /\n(?=(?:Chapter|CHAPTER|Part|PART|Section|SECTION)\s+[\dIVXLCDM]+)/g;
  const parts = text.split(sectionPattern);
  if (parts.length > 1) return parts.filter(p => p.trim().length > 0);

  const headingPattern = /\n(?=[A-Z][A-Z\s]{5,}(?:\n|$))/g;
  const headingParts = text.split(headingPattern);
  if (headingParts.length > 1) return headingParts.filter(p => p.trim().length > 0);

  return [text];
}

function splitBySize(text: string, size: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + size;

    if (end < text.length) {
      const newlineIdx = text.lastIndexOf('\n', end);
      const spaceIdx = text.lastIndexOf(' ', end);
      if (newlineIdx > start + size * 0.5) {
        end = newlineIdx + 1;
      } else if (spaceIdx > start + size * 0.5) {
        end = spaceIdx + 1;
      }
    } else {
      end = text.length;
    }

    chunks.push(text.slice(start, end).trim());
    start = end - overlap;
    if (start >= text.length) break;
  }

  return chunks.filter(c => c.length > 0);
}

export async function ingestFileToLibrary(
  agentName: string,
  driveFileId: string,
  fileName: string,
  mimeType: string,
  buffer: Buffer
): Promise<{ success: boolean; chunksCreated: number; error?: string }> {
  try {
    await db.insert(agentLibraryFiles).values({
      agentName,
      driveFileId,
      fileName,
      mimeType,
      fileSize: buffer.length,
      indexingStatus: 'processing',
    }).onConflictDoUpdate({
      target: agentLibraryFiles.driveFileId,
      set: {
        indexingStatus: 'processing',
        errorMessage: null,
      },
    });

    const isImage = mimeType.startsWith('image/');
    if (isImage) {
      await db.update(agentLibraryFiles)
        .set({ indexingStatus: 'indexed', totalChunks: 0, indexedAt: new Date() })
        .where(eq(agentLibraryFiles.driveFileId, driveFileId));
      return { success: true, chunksCreated: 0 };
    }

    const text = await extractTextFromBuffer(buffer, mimeType, fileName);

    if (!text || text.trim().length < 10) {
      await db.update(agentLibraryFiles)
        .set({ indexingStatus: 'failed', errorMessage: 'No extractable text content found' })
        .where(eq(agentLibraryFiles.driveFileId, driveFileId));
      return { success: false, chunksCreated: 0, error: 'No extractable text content' };
    }

    await db.delete(agentLibraryChunks)
      .where(and(
        eq(agentLibraryChunks.agentName, agentName),
        eq(agentLibraryChunks.driveFileId, driveFileId)
      ));

    const chunks = chunkText(text, fileName);

    const batchSize = 50;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      await db.insert(agentLibraryChunks).values(
        batch.map(chunk => ({
          agentName,
          driveFileId,
          fileName,
          mimeType,
          chunkIndex: chunk.chunkIndex,
          totalChunks: chunks.length,
          content: chunk.content,
          chunkTitle: chunk.chunkTitle,
        }))
      );
    }

    await db.update(agentLibraryFiles)
      .set({
        indexingStatus: 'indexed',
        totalChunks: chunks.length,
        indexedAt: new Date(),
        errorMessage: null,
      })
      .where(eq(agentLibraryFiles.driveFileId, driveFileId));

    console.log(`[Library Ingestion] Indexed ${fileName} for ${agentName}: ${chunks.length} chunks`);
    return { success: true, chunksCreated: chunks.length };
  } catch (error: any) {
    console.error(`[Library Ingestion] Error ingesting ${fileName} for ${agentName}:`, error);
    await db.update(agentLibraryFiles)
      .set({ indexingStatus: 'failed', errorMessage: error.message || 'Unknown error' })
      .where(eq(agentLibraryFiles.driveFileId, driveFileId));
    return { success: false, chunksCreated: 0, error: error.message };
  }
}

export async function searchAgentLibrary(
  agentName: string,
  query: string,
  maxResults: number = 10
): Promise<string> {
  try {
    const keywords = query.toLowerCase().split(/[\s,]+/).filter(k => k.length > 2);
    if (keywords.length === 0) {
      return 'No valid search keywords provided.';
    }

    const dbLimit = maxResults * 5;
    const matchingChunks = await db.select({
      content: agentLibraryChunks.content,
      chunkTitle: agentLibraryChunks.chunkTitle,
      fileName: agentLibraryChunks.fileName,
      chunkIndex: agentLibraryChunks.chunkIndex,
      totalChunks: agentLibraryChunks.totalChunks,
    })
    .from(agentLibraryChunks)
    .where(
      and(
        eq(agentLibraryChunks.agentName, agentName),
        or(
          ...keywords.map(kw => ilike(agentLibraryChunks.content, `%${kw}%`))
        )
      )
    )
    .limit(dbLimit);

    if (matchingChunks.length === 0) {
      const fileCount = await db.select({ count: sql<number>`count(*)` })
        .from(agentLibraryFiles)
        .where(eq(agentLibraryFiles.agentName, agentName));
      const total = fileCount[0]?.count || 0;
      return `No results found for "${query}" in ${agentName}'s library (${total} files indexed).`;
    }

    const scored = matchingChunks.map(chunk => {
      const lowerContent = chunk.content.toLowerCase();
      let score = 0;
      for (const kw of keywords) {
        if (lowerContent.includes(kw)) score++;
      }
      return { ...chunk, score };
    }).sort((a, b) => b.score - a.score).slice(0, maxResults);

    const results = scored.map(chunk => {
      const preview = chunk.content.length > 800 ? chunk.content.slice(0, 800) + '...' : chunk.content;
      return `--- ${chunk.chunkTitle} ---\n${preview}`;
    });

    return `Found ${matchingChunks.length} matching chunks in ${agentName}'s library:\n\n${results.join('\n\n')}`;
  } catch (error: any) {
    console.error(`[Library Search] Error searching ${agentName}'s library:`, error);
    return `Error searching library: ${error.message}`;
  }
}

export async function deleteIndexedFile(driveFileId: string): Promise<void> {
  await db.delete(agentLibraryChunks).where(eq(agentLibraryChunks.driveFileId, driveFileId));
  await db.delete(agentLibraryFiles).where(eq(agentLibraryFiles.driveFileId, driveFileId));
  console.log(`[Library Ingestion] Deleted indexed data for file ${driveFileId}`);
}

export async function getFileIndexingStatus(agentName: string) {
  return db.select({
    driveFileId: agentLibraryFiles.driveFileId,
    fileName: agentLibraryFiles.fileName,
    indexingStatus: agentLibraryFiles.indexingStatus,
    totalChunks: agentLibraryFiles.totalChunks,
    indexedAt: agentLibraryFiles.indexedAt,
    errorMessage: agentLibraryFiles.errorMessage,
  })
  .from(agentLibraryFiles)
  .where(eq(agentLibraryFiles.agentName, agentName));
}

export async function backfillAgentLibrary(agentName: string): Promise<{
  processed: number;
  skipped: number;
  errors: string[];
}> {
  const driveFiles = await listAgentLibraryFiles(agentName);
  let processed = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const file of driveFiles) {
    if (file.mimeType.startsWith('image/')) {
      skipped++;
      continue;
    }

    const existing = await db.select({ id: agentLibraryFiles.id })
      .from(agentLibraryFiles)
      .where(and(
        eq(agentLibraryFiles.driveFileId, file.id),
        eq(agentLibraryFiles.indexingStatus, 'indexed')
      ));

    if (existing.length > 0) {
      skipped++;
      continue;
    }

    try {
      const buffer = await downloadFile(file.id);
      if (!buffer) {
        errors.push(`${file.name}: Failed to download from Drive`);
        continue;
      }

      const result = await ingestFileToLibrary(agentName, file.id, file.name, file.mimeType, buffer);
      if (result.success) {
        processed++;
      } else {
        errors.push(`${file.name}: ${result.error}`);
      }
    } catch (error: any) {
      errors.push(`${file.name}: ${error.message}`);
    }
  }

  console.log(`[Library Backfill] ${agentName}: processed=${processed}, skipped=${skipped}, errors=${errors.length}`);
  return { processed, skipped, errors };
}
