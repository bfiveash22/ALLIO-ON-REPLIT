/**
 * Product Catalog Service for ALLIO Agents
 * 
 * This service provides access to the Forgotten Formula PMA product catalog.
 * All agents can reference this catalog for product information, protocols, and dosing.
 * 
 * Source: Google Drive Document 1igzWU6iubS5EuotKEo2QI2pz22qoeAM7vYj3AaUTMNY
 */

import { getGoogleDriveClient } from './google-drive-full';
import { google } from 'googleapis';

// Cache for catalog content
let catalogCache: {
  content: string;
  products: Product[];
  lastUpdated: Date;
} | null = null;

const CATALOG_DOC_ID = '1igzWU6iubS5EuotKEo2QI2pz22qoeAM7vYj3AaUTMNY';
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour cache

export interface Product {
  name: string;
  category: string;
  description: string;
  mechanism: string;
  applications: string[];
  dosing: string;
  storage?: string;
}

/**
 * Fetch the full catalog content from Google Drive
 */
export async function fetchCatalogContent(): Promise<string> {
  // Check cache first
  if (catalogCache && (Date.now() - catalogCache.lastUpdated.getTime() < CACHE_DURATION_MS)) {
    console.log('[Catalog] Returning cached content');
    return catalogCache.content;
  }

  console.log('[Catalog] Fetching fresh content from Google Drive...');

  try {
    const driveClient = await getGoogleDriveClient();
    const auth = (driveClient as any).context._options.auth;
    const docs = google.docs({ version: 'v1', auth });

    const doc = await docs.documents.get({
      documentId: CATALOG_DOC_ID
    });

    let text = '';
    if (doc.data.body && doc.data.body.content) {
      for (const element of doc.data.body.content) {
        if (element.paragraph && element.paragraph.elements) {
          for (const el of element.paragraph.elements) {
            if (el.textRun && el.textRun.content) {
              text += el.textRun.content;
            }
          }
        }
        if (element.table) {
          for (const row of element.table.tableRows || []) {
            for (const cell of row.tableCells || []) {
              for (const content of cell.content || []) {
                if (content.paragraph && content.paragraph.elements) {
                  for (const el of content.paragraph.elements) {
                    if (el.textRun) text += el.textRun.content + ' | ';
                  }
                }
              }
            }
            text += '\n';
          }
        }
      }
    }

    // Update cache
    catalogCache = {
      content: text,
      products: [], // Parse products on demand
      lastUpdated: new Date()
    };

    console.log('[Catalog] Fetched', text.length, 'characters');
    return text;
  } catch (error) {
    console.error(`[Catalog] Failed to fetch catalog content from Docs API (ID: ${CATALOG_DOC_ID}):`, error);
    // Return empty string on failure instead of crashing the server
    return '';
  }
}

/**
 * Search the catalog for products matching a query
 */
export async function searchCatalog(query: string): Promise<string[]> {
  const content = await fetchCatalogContent();
  const lines = content.split('\n');
  const matches: string[] = [];

  const queryLower = query.toLowerCase();

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes(queryLower)) {
      // Get surrounding context (3 lines before and after)
      const start = Math.max(0, i - 3);
      const end = Math.min(lines.length, i + 4);
      const context = lines.slice(start, end).join('\n');
      matches.push(context);
    }
  }

  return matches;
}

/**
 * Get the full catalog as structured sections
 */
export async function getCatalogSections(): Promise<Record<string, string>> {
  const content = await fetchCatalogContent();
  const sections: Record<string, string> = {};

  // Extract key sections
  const sectionMarkers = [
    'Injectable Peptides',
    'Oral Peptides',
    'Bioregulators',
    'Suppositories',
    'Topicals',
    'IV Therapy',
    'Protocol',
    'Abbreviations'
  ];

  for (const marker of sectionMarkers) {
    const startIdx = content.indexOf(marker);
    if (startIdx !== -1) {
      // Find next section or end
      let endIdx = content.length;
      for (const nextMarker of sectionMarkers) {
        if (nextMarker !== marker) {
          const nextIdx = content.indexOf(nextMarker, startIdx + marker.length);
          if (nextIdx !== -1 && nextIdx < endIdx) {
            endIdx = nextIdx;
          }
        }
      }
      sections[marker] = content.slice(startIdx, endIdx).trim();
    }
  }

  return sections;
}

/**
 * Get product information by name
 */
export async function getProductInfo(productName: string): Promise<string | null> {
  const content = await fetchCatalogContent();
  const productIdx = content.indexOf(productName);

  if (productIdx === -1) {
    return null;
  }

  // Extract product section (until next product header or section)
  const sectionEnd = content.indexOf('\n\n\n', productIdx);
  const endIdx = sectionEnd !== -1 ? sectionEnd : productIdx + 2000;

  return content.slice(productIdx, endIdx).trim();
}

/**
 * Get the full catalog content for agent context
 */
export async function getFullCatalog(): Promise<string> {
  return fetchCatalogContent();
}

/**
 * Clear the catalog cache to force refresh
 */
export function clearCatalogCache(): void {
  catalogCache = null;
  console.log('[Catalog] Cache cleared');
}
