import { db } from "../db";
import { driveAssets, InsertDriveAsset } from "@shared/schema";
import { listFilesInFolder, DriveFile } from "./google-drive-full";
import { eq, ilike, or, and, sql } from "drizzle-orm";
import { DRIVE_ASSET_STRUCTURE } from "@shared/allio-identity";

const FOLDER_IDS = {
  main: "16wOdbJPoOVOz5GE0mtlzf84c896JX1UC",
  pixel: "1WElgBytVFrW41_1iIRaokP8FV2ncVe2H",
  prism: "16pddqtE-mwcEiPgjDjMPkdVU7lOnQQhs",
  sourceData: "1s6EdFtZ7dZY7utr8J843CFxyAjuuwHPX"
};

function detectDivisionAndAgent(path: string, name: string): { division?: string; agent?: string } {
  const upperName = name.toUpperCase();
  
  if (upperName.includes("PIXEL") || path.includes("PIXEL")) {
    return { division: "Marketing", agent: "PIXEL" };
  }
  if (upperName.includes("PRISM") || path.includes("PRISM")) {
    return { division: "Marketing", agent: "PRISM" };
  }
  if (upperName.includes("MUSE")) {
    return { division: "Marketing", agent: "MUSE" };
  }
  if (upperName.includes("SENTINEL")) {
    return { division: "Executive", agent: "SENTINEL" };
  }
  if (upperName.includes("ATHENA")) {
    return { division: "Executive", agent: "ATHENA" };
  }
  if (upperName.includes("HERMES")) {
    return { division: "Executive", agent: "HERMES" };
  }
  if (upperName.includes("HELIX")) {
    return { division: "Science", agent: "HELIX" };
  }
  if (upperName.includes("FORGE")) {
    return { division: "Engineering", agent: "FORGE" };
  }
  
  return {};
}

function detectCategory(mimeType: string, name: string): string {
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf") return "document";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "spreadsheet";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "presentation";
  if (mimeType.includes("document") || mimeType.includes("word")) return "document";
  if (mimeType.includes("folder")) return "folder";
  return "other";
}

function extractTags(name: string): string[] {
  const tags: string[] = [];
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes("allio")) tags.push("allio");
  if (lowerName.includes("logo")) tags.push("logo", "brand");
  if (lowerName.includes("launch")) tags.push("launch", "marketing");
  if (lowerName.includes("banner")) tags.push("banner", "social");
  if (lowerName.includes("training")) tags.push("training", "education");
  if (lowerName.includes("wellness")) tags.push("wellness", "health");
  if (lowerName.includes("healing")) tags.push("healing");
  if (lowerName.includes("social")) tags.push("social-media");
  if (lowerName.includes("promo")) tags.push("promotional");
  
  return tags;
}

export async function indexFolder(folderId: string, folderPath: string = ""): Promise<number> {
  console.log(`[Asset Catalog] Indexing folder: ${folderId} (${folderPath || "root"})`);
  
  try {
    const files = await listFilesInFolder(folderId);
    let indexed = 0;
    
    for (const file of files) {
      const { division, agent } = detectDivisionAndAgent(folderPath, file.name);
      const category = detectCategory(file.mimeType, file.name);
      const tags = extractTags(file.name);
      
      const assetData: InsertDriveAsset = {
        driveFileId: file.id,
        name: file.name,
        mimeType: file.mimeType,
        path: folderPath || "/",
        division,
        agent,
        category,
        tags,
        thumbnailLink: file.thumbnailLink,
        webViewLink: file.webViewLink,
        fileSize: file.size,
        parentFolderId: folderId,
        modifiedTime: file.modifiedTime ? new Date(file.modifiedTime) : undefined,
        isActive: true,
      };
      
      await db.insert(driveAssets)
        .values(assetData)
        .onConflictDoUpdate({
          target: driveAssets.driveFileId,
          set: {
            name: assetData.name,
            mimeType: assetData.mimeType,
            path: assetData.path,
            division: assetData.division,
            agent: assetData.agent,
            category: assetData.category,
            tags: assetData.tags,
            thumbnailLink: assetData.thumbnailLink,
            webViewLink: assetData.webViewLink,
            fileSize: assetData.fileSize,
            modifiedTime: assetData.modifiedTime,
            indexedAt: new Date(),
          },
        });
      
      indexed++;
      
      if (file.mimeType === "application/vnd.google-apps.folder") {
        const subIndexed = await indexFolder(file.id, `${folderPath}/${file.name}`);
        indexed += subIndexed;
      }
    }
    
    console.log(`[Asset Catalog] Indexed ${indexed} assets from ${folderPath || "root"}`);
    return indexed;
  } catch (error) {
    console.error(`[Asset Catalog] Error indexing folder ${folderId}:`, error);
    return 0;
  }
}

export async function indexAllMarketingAssets(): Promise<{ total: number; byFolder: Record<string, number> }> {
  console.log("[Asset Catalog] Starting full marketing asset index...");
  
  const results: Record<string, number> = {};
  
  results.pixel = await indexFolder(FOLDER_IDS.pixel, "/PIXEL-Design Assets");
  results.prism = await indexFolder(FOLDER_IDS.prism, "/PRISM-Videos");
  results.sourceData = await indexFolder(FOLDER_IDS.sourceData, "/Source Data");
  
  const total = Object.values(results).reduce((a, b) => a + b, 0);
  
  console.log(`[Asset Catalog] Complete. Total assets indexed: ${total}`);
  
  return { total, byFolder: results };
}

export async function searchAssets(options: {
  query?: string;
  division?: string;
  agent?: string;
  category?: string;
  tags?: string[];
  limit?: number;
}): Promise<typeof driveAssets.$inferSelect[]> {
  const { query, division, agent, category, tags, limit = 50 } = options;
  
  const conditions = [];
  
  if (query) {
    conditions.push(ilike(driveAssets.name, `%${query}%`));
  }
  if (division) {
    conditions.push(eq(driveAssets.division, division));
  }
  if (agent) {
    conditions.push(eq(driveAssets.agent, agent));
  }
  if (category) {
    conditions.push(eq(driveAssets.category, category));
  }
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  const results = await db.query.driveAssets.findMany({
    where: whereClause,
    limit,
    orderBy: (assets, { desc }) => [desc(assets.indexedAt)],
  });
  
  return results;
}

export async function checkExistingAsset(name: string): Promise<typeof driveAssets.$inferSelect | null> {
  const result = await db.query.driveAssets.findFirst({
    where: ilike(driveAssets.name, `%${name}%`),
  });
  
  return result || null;
}

export async function getAssetStats(): Promise<{
  total: number;
  byCategory: Record<string, number>;
  byDivision: Record<string, number>;
  byAgent: Record<string, number>;
}> {
  const allAssets = await db.query.driveAssets.findMany();
  
  const byCategory: Record<string, number> = {};
  const byDivision: Record<string, number> = {};
  const byAgent: Record<string, number> = {};
  
  for (const asset of allAssets) {
    const cat = asset.category || "unknown";
    byCategory[cat] = (byCategory[cat] || 0) + 1;
    
    if (asset.division) {
      byDivision[asset.division] = (byDivision[asset.division] || 0) + 1;
    }
    
    if (asset.agent) {
      byAgent[asset.agent] = (byAgent[asset.agent] || 0) + 1;
    }
  }
  
  return {
    total: allAssets.length,
    byCategory,
    byDivision,
    byAgent,
  };
}
