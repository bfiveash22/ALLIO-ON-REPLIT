import { db } from "../db";
import { libraryItems } from "@shared/schema";
import { eq, isNotNull, and } from "drizzle-orm";
import { getUncachableGoogleDriveClient } from "./drive";
import type { drive_v3 } from "googleapis";

const LIBRARY_FOLDER_ID = "1s6EdFtZ7dZY7utr8J843CFxyAjuuwHPX";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 200);
}

function cleanTitle(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/\s*\(\s*PDFDrive\s*\)\s*/gi, "")
    .replace(/\s*\(\s*\d+\s*\)\s*/g, "")
    .replace(/\s*\[\s*PDFDrive\s*\]\s*/gi, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function contentTypeFromMime(mimeType: string): string {
  if (mimeType === "application/pdf") return "document";
  if (mimeType.includes("epub")) return "document";
  if (mimeType.includes("video")) return "video";
  if (mimeType.includes("presentation") || mimeType.includes("slides")) return "document";
  return "document";
}

function formatFileSize(bytes: string | number | null | undefined): string {
  if (!bytes) return "";
  const num = typeof bytes === "number" ? bytes : parseInt(bytes, 10);
  if (isNaN(num)) return "";
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / (1024 * 1024)).toFixed(1)} MB`;
}

async function listSubfolders(drive: drive_v3.Drive, parentId: string) {
  const folders: { id: string; name: string }[] = [];
  let pageToken: string | undefined;

  do {
    const resp = await drive.files.list({
      q: `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: "nextPageToken,files(id,name)",
      pageSize: 100,
      orderBy: "name",
      pageToken,
    });
    for (const f of resp.data.files || []) {
      if (f.id && f.name) folders.push({ id: f.id, name: f.name });
    }
    pageToken = resp.data.nextPageToken || undefined;
  } while (pageToken);

  return folders;
}

async function listFilesInFolder(drive: drive_v3.Drive, folderId: string) {
  const files: { id: string; name: string; mimeType: string; size?: string; webViewLink?: string; createdTime?: string }[] = [];
  let pageToken: string | undefined;

  do {
    const resp = await drive.files.list({
      q: `'${folderId}' in parents and mimeType!='application/vnd.google-apps.folder' and trashed=false`,
      fields: "nextPageToken,files(id,name,mimeType,size,webViewLink,createdTime)",
      pageSize: 100,
      pageToken,
    });
    for (const f of resp.data.files || []) {
      if (f.id && f.name) {
        files.push({
          id: f.id,
          name: f.name,
          mimeType: f.mimeType || "application/octet-stream",
          size: f.size || undefined,
          webViewLink: f.webViewLink || undefined,
          createdTime: f.createdTime || undefined,
        });
      }
    }
    pageToken = resp.data.nextPageToken || undefined;
  } while (pageToken);

  return files;
}

export async function syncDriveLibrary(): Promise<{
  synced: number;
  updated: number;
  removed: number;
  categories: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let synced = 0;
  let updated = 0;

  const drive = await getUncachableGoogleDriveClient();

  const folders = await listSubfolders(drive, LIBRARY_FOLDER_ID);
  console.log(`[DriveLibSync] Found ${folders.length} category folders`);

  const existingDriveItems = await db
    .select()
    .from(libraryItems)
    .where(isNotNull(libraryItems.driveFileId));

  const existingByDriveId = new Map(
    existingDriveItems.map((item) => [item.driveFileId, item])
  );

  const seenDriveIds = new Set<string>();

  for (const folder of folders) {
    try {
      const files = await listFilesInFolder(drive, folder.id);
      const categorySlug = slugify(folder.name);

      for (const file of files) {
        seenDriveIds.add(file.id);

        const title = cleanTitle(file.name);
        const baseSlug = `drive-${slugify(title)}`;
        let slug = baseSlug;
        if (slug.length < 3) slug = `drive-${file.id.substring(0, 8)}`;

        const existing = existingByDriveId.get(file.id);

        if (existing) {
          await db
            .update(libraryItems)
            .set({
              title,
              categorySlug,
              driveWebViewLink: file.webViewLink || null,
              fileMimeType: file.mimeType,
              fileSize: formatFileSize(file.size),
              driveFolderId: folder.id,
              updatedAt: new Date(),
            })
            .where(eq(libraryItems.id, existing.id));
          updated++;
        } else {
          let uniqueSlug = slug;
          let counter = 1;
          while (true) {
            const [conflict] = await db
              .select({ id: libraryItems.id })
              .from(libraryItems)
              .where(eq(libraryItems.slug, uniqueSlug));
            if (!conflict) break;
            uniqueSlug = `${slug}-${counter++}`;
          }

          await db.insert(libraryItems).values({
            title,
            slug: uniqueSlug,
            contentType: contentTypeFromMime(file.mimeType) as any,
            excerpt: `From: ${folder.name}`,
            categorySlug,
            authorName: "FF PMA Library",
            driveFileId: file.id,
            driveWebViewLink: file.webViewLink || null,
            driveFolderId: folder.id,
            fileMimeType: file.mimeType,
            fileSize: formatFileSize(file.size),
            isActive: true,
            requiresMembership: true,
          });
          synced++;
        }
      }
    } catch (err: any) {
      errors.push(`Folder "${folder.name}": ${err.message}`);
      console.error(`[DriveLibSync] Error syncing folder "${folder.name}":`, err.message);
    }
  }

  let removed = 0;
  for (const [driveId, item] of existingByDriveId) {
    if (!seenDriveIds.has(driveId!) && item.isActive) {
      await db
        .update(libraryItems)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(libraryItems.id, item.id));
      removed++;
    }
  }

  console.log(
    `[DriveLibSync] Complete: ${synced} new, ${updated} updated, ${removed} deactivated, ${errors.length} errors`
  );

  return { synced, updated, removed, categories: folders.length, errors };
}

export async function getDriveLibraryCategories(): Promise<
  { slug: string; name: string; count: number }[]
> {
  const items = await db
    .select({
      categorySlug: libraryItems.categorySlug,
    })
    .from(libraryItems)
    .where(
      and(
        isNotNull(libraryItems.driveFileId),
        eq(libraryItems.isActive, true)
      )
    );

  const counts = new Map<string, number>();
  for (const item of items) {
    const cat = item.categorySlug || "uncategorized";
    counts.set(cat, (counts.get(cat) || 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([slug, count]) => ({
      slug,
      name: slug
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      count,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
