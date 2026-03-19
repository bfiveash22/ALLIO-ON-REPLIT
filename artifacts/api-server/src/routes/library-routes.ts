import type { Express, Request, Response } from "express";
import { db } from "../db";
import { libraryItems } from "@shared/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../working-auth";
import * as fs from "fs/promises";
import * as path from "path";

interface ProtocolMeta {
  title: string;
  slug: string;
  category: string;
  contentType: string;
  author: string;
  division: string;
  tags: string[];
  createdAt: string;
  excerpt: string;
}

function parseFrontmatter(raw: string): { meta: ProtocolMeta | null; content: string } {
  const fmRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = raw.match(fmRegex);
  if (!match) return { meta: null, content: raw };

  const yamlBlock = match[1];
  const body = match[2];

  const meta: Partial<ProtocolMeta> = {};
  for (const line of yamlBlock.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.substring(0, colonIdx).trim() as keyof ProtocolMeta;
    let value = line.substring(colonIdx + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    if (key === "tags" && value.startsWith("[") && value.endsWith("]")) {
      try {
        (meta as Record<string, string | string[]>)[key] = JSON.parse(value) as string[];
      } catch {
        (meta as Record<string, string | string[]>)[key] = value;
      }
    } else {
      (meta as Record<string, string | string[]>)[key] = value;
    }
  }

  if (!meta.title || !meta.slug) {
    return { meta: null, content: raw };
  }

  return {
    meta: {
      title: meta.title,
      slug: meta.slug,
      category: meta.category || "",
      contentType: meta.contentType || "protocol",
      author: meta.author || "ALLIO",
      division: meta.division || "",
      tags: Array.isArray(meta.tags) ? meta.tags : [],
      createdAt: meta.createdAt || "",
      excerpt: meta.excerpt || "",
    },
    content: body,
  };
}

function markdownToHtml(md: string): string {
  let html = md;
  html = html.replace(/^### (.*$)/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.*$)/gm, "<h1>$1</h1>");
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  html = html.replace(/^\d+\. (.*$)/gm, "<oli>$1</oli>");
  html = html.replace(/((<oli>.*<\/oli>\n?)+)/g, (match) => `<ol>${match.replace(/<\/?oli>/g, (t) => t.replace("oli", "li"))}</ol>`);
  html = html.replace(/^- (.*$)/gm, "<uli>$1</uli>");
  html = html.replace(/((<uli>.*<\/uli>\n?)+)/g, (match) => `<ul>${match.replace(/<\/?uli>/g, (t) => t.replace("uli", "li"))}</ul>`);

  const tableRegex = /\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)+)/g;
  html = html.replace(tableRegex, (_match, headerRow: string, bodyRows: string) => {
    const headers = headerRow.split("|").map((h: string) => h.trim()).filter(Boolean);
    const headerHtml = headers.map((h: string) => `<th>${h}</th>`).join("");
    const rows = bodyRows.trim().split("\n").map((row: string) => {
      const cells = row.split("|").map((c: string) => c.trim()).filter(Boolean);
      return `<tr>${cells.map((c: string) => `<td>${c}</td>`).join("")}</tr>`;
    }).join("");
    return `<table><thead><tr>${headerHtml}</tr></thead><tbody>${rows}</tbody></table>`;
  });

  html = html.replace(/\n\n/g, "</p><p>");
  html = `<p>${html}</p>`;
  html = html.replace(/<p>\s*(<h[1-3]>)/g, "$1");
  html = html.replace(/(<\/h[1-3]>)\s*<\/p>/g, "$1");
  html = html.replace(/<p>\s*(<ul>)/g, "$1");
  html = html.replace(/(<\/ul>)\s*<\/p>/g, "$1");
  html = html.replace(/<p>\s*(<ol>)/g, "$1");
  html = html.replace(/(<\/ol>)\s*<\/p>/g, "$1");
  html = html.replace(/<p>\s*(<table>)/g, "$1");
  html = html.replace(/(<\/table>)\s*<\/p>/g, "$1");
  html = html.replace(/<p>\s*<\/p>/g, "");

  return html;
}

interface KBProtocolItem {
  id: string;
  title: string;
  slug: string;
  contentType: string;
  content: string;
  excerpt: string;
  imageUrl: string | null;
  categorySlug: string | null;
  tags: string[];
  authorName: string;
  wpPostId: number | null;
  viewCount: number;
  isActive: boolean;
  requiresMembership: boolean;
  roleAccess: string[] | null;
  createdAt: Date;
  updatedAt: Date;
  isKnowledgeBase: boolean;
  division: string | null;
}

const KB_BASE = path.join(process.cwd(), "knowledge-base");

async function getKnowledgeBaseProtocols(): Promise<KBProtocolItem[]> {
  const kbDir = path.join(KB_BASE, "healing-protocols");

  const protocols: KBProtocolItem[] = [];

  try {
    await fs.stat(kbDir);
  } catch {
    return protocols;
  }

  const getFilesRecursively = async (dir: string): Promise<string[]> => {
    let results: string[] = [];
    try {
      const list = await fs.readdir(dir);
      for (const item of list) {
        const fullPath = path.join(dir, item);
        const stat = await fs.stat(fullPath);
        if (stat.isDirectory()) {
          results = results.concat(await getFilesRecursively(fullPath));
        } else if (item.endsWith(".md")) {
          results.push(fullPath);
        }
      }
    } catch (err) {
      console.error("[Library] Traverse error:", err);
    }
    return results;
  };

  const files = await getFilesRecursively(kbDir);

  for (const filePath of files) {
    try {
      const raw = await fs.readFile(filePath, "utf8");
      const { meta, content } = parseFrontmatter(raw);
      if (!meta || !meta.slug || !meta.title) continue;

      protocols.push({
        id: `kb-${meta.slug}`,
        title: meta.title,
        slug: meta.slug,
        contentType: meta.contentType || "protocol",
        content: markdownToHtml(content),
        excerpt: meta.excerpt || "",
        imageUrl: null,
        categorySlug: meta.category || null,
        tags: Array.isArray(meta.tags) ? meta.tags : [],
        authorName: meta.author || "ALLIO",
        wpPostId: null,
        viewCount: 0,
        isActive: true,
        requiresMembership: true,
        roleAccess: null,
        createdAt: meta.createdAt ? new Date(meta.createdAt) : new Date(),
        updatedAt: new Date(),
        isKnowledgeBase: true,
        division: meta.division || null,
      });
    } catch (err) {
      console.error(`[Library] Error parsing ${filePath}:`, err);
    }
  }

  return protocols;
}

export function registerLibraryRoutes(app: Express): void {
  app.get("/api/library", requireAuth, async (_req: Request, res: Response) => {
    try {
      const dbItems = await db.select().from(libraryItems).where(eq(libraryItems.isActive, true));
      const kbProtocols = await getKnowledgeBaseProtocols();

      const dbSlugs = new Set(dbItems.map((item) => item.slug));
      const uniqueKbProtocols = kbProtocols.filter((p) => !dbSlugs.has(p.slug));

      const allItems = [...dbItems, ...uniqueKbProtocols];

      allItems.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      res.json(allItems);
    } catch (error: unknown) {
      console.error("[Library] Error fetching items:", error);
      res.status(500).json({ error: "Failed to fetch library items" });
    }
  });

  app.get("/api/library/categories", requireAuth, async (_req: Request, res: Response) => {
    try {
      const kbProtocols = await getKnowledgeBaseProtocols();
      const categories = [...new Set(kbProtocols.map((p) => p.categorySlug).filter(Boolean))];
      res.json(categories);
    } catch (error: unknown) {
      console.error("[Library] Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.get("/api/library/:slug", requireAuth, async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;

      const [dbItem] = await db.select().from(libraryItems).where(eq(libraryItems.slug, slug));
      if (dbItem) {
        return res.json(dbItem);
      }

      const kbProtocols = await getKnowledgeBaseProtocols();
      const kbItem = kbProtocols.find((p) => p.slug === slug);
      if (kbItem) {
        return res.json(kbItem);
      }

      res.status(404).json({ error: "Library item not found" });
    } catch (error: unknown) {
      console.error("[Library] Error fetching item:", error);
      res.status(500).json({ error: "Failed to fetch library item" });
    }
  });
}
