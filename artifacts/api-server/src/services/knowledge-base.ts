import * as fs from 'fs/promises';
import * as path from 'path';
import { compounds, interactions, stackingProtocols, compoundCategoryLabels } from '@shared/compound-interactions-data';
import { getAgentById } from '@shared/agents';
import { db } from '../db';
import { libraryItems, driveDocuments } from '@shared/schema';
import { ilike, or, desc } from 'drizzle-orm';
import { searchDriveLibraryScoped } from './drive';

const KB_DIR = process.env.NODE_ENV === 'production'
    ? '/root/allio-v1/knowledge-base'
    : path.join(process.cwd(), 'knowledge-base');

interface SearchResult {
    content: string;
    source: string;
    score: number;
    title: string;
}

const AGENT_SPECIALTY_KEYWORDS: Record<string, string[]> = {
    'chiro': ['chiropractic', 'spinal', 'adjustment', 'subluxation', 'vertebral', 'NET', 'neuro emotional', 'QUANTUM'],
    'paracelsus': ['peptide', 'biologics', 'protein therapeutics', 'bioavailability', 'BPC-157', 'thymosin', 'GHK-Cu'],
    'dr-formula': ['protocol', 'root cause', 'intake', 'detox', 'cellular', 'regeneration', 'minerals', 'peptides'],
    'hippocrates': ['research', 'clinical', 'evidence', 'PubMed', 'studies', 'trials'],
    'botanica': ['TCM', 'ayurveda', 'herbal', 'herbalism', 'traditional', 'botanical'],
    'helix': ['epigenetics', 'gene', 'genetics', 'CRISPR', 'DNA', 'genomic'],
    'resonance': ['frequency', 'rife', 'PEMF', 'bioresonance', 'tesla', 'hertz'],
    'synthesis': ['metabolic', 'biochemistry', 'compound', 'formula', 'synergy'],
    'vitalis': ['cellular', 'physiology', 'detox', 'regeneration', 'mitochondria'],
    'microbia': ['microbiome', 'gut', 'bacteria', 'probiotic', 'prebiotic'],
    'terra': ['soil', 'agriculture', 'ecosystem', 'environmental', 'regenerative'],
    'oracle': ['recommendation', 'personalized', 'guidance', 'healing journey'],
    'juris': ['legal', 'PMA', 'compliance', 'regulatory', 'sovereignty'],
    'lexicon': ['contract', 'agreement', 'member protections'],
    'sentinel': ['coordination', 'orchestration', 'mission', 'operations'],
    'athena': ['communications', 'scheduling', 'priority'],
};

function tokenizeQuery(query: string): string[] {
    return query.toLowerCase().split(/[\s,]+/).filter(k => k.length > 1);
}

function computeRelevanceScore(
    text: string,
    title: string,
    keywords: string[],
    agentId?: string,
    updatedAt?: Date | null
): number {
    const lowerText = text.toLowerCase();
    const lowerTitle = title.toLowerCase();
    let score = 0;

    for (const kw of keywords) {
        const titleMatches = (lowerTitle.match(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;
        score += titleMatches * 10;

        const contentMatches = (lowerText.match(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;
        score += Math.min(contentMatches, 20);
    }

    if (agentId && AGENT_SPECIALTY_KEYWORDS[agentId]) {
        const specialtyKws = AGENT_SPECIALTY_KEYWORDS[agentId];
        for (const skw of specialtyKws) {
            if (lowerTitle.includes(skw.toLowerCase()) || lowerText.includes(skw.toLowerCase())) {
                score += 5;
            }
        }
    }

    if (updatedAt) {
        const daysSinceUpdate = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceUpdate < 30) score += 3;
        else if (daysSinceUpdate < 90) score += 2;
        else if (daysSinceUpdate < 365) score += 1;
    }

    return score;
}

function extractSnippet(content: string, keywords: string[], maxLen: number = 1000): string {
    const lowerContent = content.toLowerCase();
    let bestIndex = -1;
    let bestScore = 0;

    for (const kw of keywords) {
        let searchFrom = 0;
        while (searchFrom < lowerContent.length) {
            const idx = lowerContent.indexOf(kw, searchFrom);
            if (idx === -1) break;
            let localScore = 0;
            const window = lowerContent.substring(Math.max(0, idx - 200), Math.min(lowerContent.length, idx + 500));
            for (const k of keywords) {
                if (window.includes(k)) localScore++;
            }
            if (localScore > bestScore) {
                bestScore = localScore;
                bestIndex = idx;
            }
            searchFrom = idx + kw.length;
        }
    }

    if (bestIndex === -1) {
        return content.substring(0, maxLen);
    }

    const snippetStart = Math.max(0, bestIndex - 200);
    const snippetEnd = Math.min(content.length, snippetStart + maxLen);
    return content.substring(snippetStart, snippetEnd);
}

function searchCompoundData(query: string, agentId?: string): SearchResult[] {
    const keywords = tokenizeQuery(query);
    if (keywords.length === 0) return [];

    const results: SearchResult[] = [];

    for (const compound of compounds) {
        const searchableText = `${compound.name} ${compound.description} ${compound.category} ${compound.bioavailabilityTips.join(' ')}`;
        const score = computeRelevanceScore(searchableText, compound.name, keywords, agentId);
        if (score > 0) {
            results.push({
                title: compound.name,
                source: `From: Compound Database / ${compound.name}`,
                score,
                content:
                    `Compound: ${compound.name} (${compoundCategoryLabels[compound.category]})\n` +
                    `Description: ${compound.description}\n` +
                    `Default Dose: ${compound.defaultDose} | Timing: ${compound.timing}\n` +
                    `Bioavailability Tips: ${compound.bioavailabilityTips.join('; ')}`
            });
        }
    }

    for (const interaction of interactions) {
        const compA = compounds.find(c => c.id === interaction.compoundA);
        const compB = compounds.find(c => c.id === interaction.compoundB);
        const searchableText = `${compA?.name} ${compB?.name} ${interaction.description} ${interaction.mechanism} ${interaction.type}`;
        const title = `${compA?.name} + ${compB?.name} Interaction`;
        const score = computeRelevanceScore(searchableText, title, keywords, agentId);
        if (score > 0) {
            results.push({
                title,
                source: `From: Compound Interactions / ${compA?.name} + ${compB?.name}`,
                score,
                content:
                    `Interaction [${interaction.type.toUpperCase()}]: ${compA?.name} + ${compB?.name}\n` +
                    `${interaction.description}\n` +
                    `Mechanism: ${interaction.mechanism}\n` +
                    `Recommendation: ${interaction.recommendation}`
            });
        }
    }

    for (const protocol of stackingProtocols) {
        const compoundNames = protocol.compounds.map(e => compounds.find(c => c.id === e.compoundId)?.name || '').join(' ');
        const searchableText = `${protocol.name} ${protocol.goal} ${protocol.description} ${compoundNames} ${protocol.notes.join(' ')}`;
        const score = computeRelevanceScore(searchableText, protocol.name, keywords, agentId);
        if (score > 0) {
            const compoundList = protocol.compounds.map(e => {
                const c = compounds.find(comp => comp.id === e.compoundId);
                return `  - ${c?.name}: ${e.dose} (${e.timing}, ${e.route})`;
            }).join('\n');
            results.push({
                title: protocol.name,
                source: `From: Stacking Protocols / ${protocol.name}`,
                score,
                content:
                    `Stacking Protocol: ${protocol.name}\n` +
                    `Goal: ${protocol.goal}\n` +
                    `${protocol.description}\n` +
                    `Duration: ${protocol.duration}\n` +
                    `Compounds:\n${compoundList}\n` +
                    `Notes: ${protocol.notes.join('; ')}`
            });
        }
    }

    return results;
}

async function searchLocalFiles(query: string, agentId?: string, specificFile?: string): Promise<SearchResult[]> {
    const keywords = tokenizeQuery(query);
    const results: SearchResult[] = [];

    try {
        const stats = await fs.stat(KB_DIR);
        if (!stats.isDirectory()) return results;
    } catch (e: any) {
        if (e.code === 'ENOENT') {
            await fs.mkdir(KB_DIR, { recursive: true });
        }
        return results;
    }

    const getFilesRecursively = async (dir: string): Promise<string[]> => {
        let fileList: string[] = [];
        try {
            const list = await fs.readdir(dir);
            for (const item of list) {
                const fullPath = path.join(dir, item);
                const stat = await fs.stat(fullPath);
                if (stat.isDirectory()) {
                    fileList = fileList.concat(await getFilesRecursively(fullPath));
                } else if (item.endsWith('.txt') || item.endsWith('.md') || item.endsWith('.pdf')) {
                    fileList.push(fullPath);
                }
            }
        } catch (err) {
            console.error("[KnowledgeBase] Traverse error:", err);
        }
        return fileList;
    };

    const allFiles = await getFilesRecursively(KB_DIR);

    if (specificFile) {
        const targetPath = allFiles.find(f => path.basename(f) === specificFile || f.endsWith(specificFile));
        if (targetPath && (targetPath.endsWith('.txt') || targetPath.endsWith('.md'))) {
            try {
                const content = await fs.readFile(targetPath, 'utf8');
                const relativePath = path.relative(KB_DIR, targetPath);
                results.push({
                    title: path.basename(targetPath),
                    source: `From: Local Knowledge Base / ${relativePath}`,
                    score: 100,
                    content: content.substring(0, 15000)
                });
            } catch { /* skip unreadable */ }
        }
        return results;
    }

    for (const fullPath of allFiles) {
        if (!fullPath.endsWith('.txt') && !fullPath.endsWith('.md')) continue;

        try {
            const content = await fs.readFile(fullPath, 'utf8');
            const fileBasename = path.basename(fullPath);
            const relativePath = path.relative(KB_DIR, fullPath);
            const score = computeRelevanceScore(content, fileBasename, keywords, agentId);

            if (score > 0) {
                const snippet = extractSnippet(content, keywords);
                results.push({
                    title: fileBasename,
                    source: `From: Local Knowledge Base / ${relativePath}`,
                    score,
                    content: snippet
                });
            }
        } catch { /* skip unreadable files */ }
    }

    return results;
}

async function searchLibraryDatabase(query: string, agentId?: string): Promise<SearchResult[]> {
    const keywords = tokenizeQuery(query);
    if (keywords.length === 0) return [];

    const results: SearchResult[] = [];

    try {
        const likeConditions = keywords.map(kw =>
            or(
                ilike(libraryItems.title, `%${kw}%`),
                ilike(libraryItems.content, `%${kw}%`),
                ilike(libraryItems.excerpt, `%${kw}%`)
            )
        );

        const items = await db.select({
            id: libraryItems.id,
            title: libraryItems.title,
            contentType: libraryItems.contentType,
            content: libraryItems.content,
            excerpt: libraryItems.excerpt,
            categorySlug: libraryItems.categorySlug,
            tags: libraryItems.tags,
            updatedAt: libraryItems.updatedAt,
        })
        .from(libraryItems)
        .where(or(...likeConditions))
        .orderBy(desc(libraryItems.updatedAt))
        .limit(20);

        for (const item of items) {
            const searchText = `${item.title || ''} ${item.content || ''} ${item.excerpt || ''}`;
            const score = computeRelevanceScore(searchText, item.title || '', keywords, agentId, item.updatedAt);
            const snippet = item.excerpt || extractSnippet(item.content || '', keywords, 800);

            results.push({
                title: item.title || 'Untitled',
                source: `From: Library / ${item.contentType || 'article'} / ${item.title}`,
                score,
                content: snippet
            });
        }

        const driveConditions = keywords.map(kw =>
            or(
                ilike(driveDocuments.title, `%${kw}%`),
                ilike(driveDocuments.description, `%${kw}%`),
                ilike(driveDocuments.folderPath, `%${kw}%`)
            )
        );

        const docs = await db.select({
            id: driveDocuments.id,
            title: driveDocuments.title,
            description: driveDocuments.description,
            mimeType: driveDocuments.mimeType,
            webViewLink: driveDocuments.webViewLink,
            folderPath: driveDocuments.folderPath,
            contentType: driveDocuments.contentType,
            updatedAt: driveDocuments.updatedAt,
        })
        .from(driveDocuments)
        .where(or(...driveConditions))
        .orderBy(desc(driveDocuments.updatedAt))
        .limit(20);

        for (const doc of docs) {
            const searchText = `${doc.title || ''} ${doc.description || ''} ${doc.folderPath || ''}`;
            const score = computeRelevanceScore(searchText, doc.title || '', keywords, agentId, doc.updatedAt);

            results.push({
                title: doc.title || 'Untitled Document',
                source: `From: Drive Library / ${doc.folderPath || 'root'} / ${doc.title}`,
                score,
                content: `${doc.title}${doc.description ? '\n' + doc.description : ''}${doc.webViewLink ? '\nLink: ' + doc.webViewLink : ''}`
            });
        }
    } catch (error: any) {
        console.error("[KnowledgeBase] Database search error:", error.message);
    }

    return results;
}

export async function searchKnowledgeBase(query: string, specificFile?: string, agentId?: string): Promise<string> {
    try {
        const compoundResults = searchCompoundData(query, agentId);

        try {
            const stats = await fs.stat(KB_DIR);
            if (!stats.isDirectory()) {
                if (compoundResults.length > 0) {
                    return formatResults(compoundResults);
                }
                return `Error: ${KB_DIR} is not a directory.`;
            }
        } catch (e: any) {
            if (e.code === 'ENOENT') {
                await fs.mkdir(KB_DIR, { recursive: true });
            }
        }

        const localResults = await searchLocalFiles(query, agentId, specificFile);
        const allResults = [...compoundResults, ...localResults];

        allResults.sort((a, b) => b.score - a.score);

        if (allResults.length > 0) {
            return formatResults(allResults.slice(0, 15));
        }

        return "No matching results found in the knowledge base. Try different search terms.";
    } catch (error: any) {
        console.error("[KnowledgeBase] Search error:", error);
        return `Failed to search knowledge base: ${error.message}`;
    }
}

export async function searchAllKnowledge(
    query: string,
    agentId?: string,
    specificFile?: string
): Promise<string> {
    console.log(`[KnowledgeBase] Unified search: query="${query}", agentId="${agentId || 'none'}"`);

    try {
        const [compoundResults, localResults, dbResults, driveResults] = await Promise.all([
            Promise.resolve(searchCompoundData(query, agentId)),
            searchLocalFiles(query, agentId, specificFile),
            searchLibraryDatabase(query, agentId),
            searchDriveScoped(query, agentId),
        ]);

        const allResults = [...compoundResults, ...localResults, ...dbResults, ...driveResults];

        allResults.sort((a, b) => b.score - a.score);

        const topResults = allResults.slice(0, 15);

        if (topResults.length === 0) {
            const agent = agentId ? getAgentById(agentId) : undefined;
            return `No results found for "${query}"${agent ? ` (searched with ${agent.name} specialty prioritization)` : ''}. Try different search terms or a broader query.`;
        }

        return formatResults(topResults);
    } catch (error: any) {
        console.error("[KnowledgeBase] Unified search error:", error);
        return `Failed to search knowledge sources: ${error.message}`;
    }
}

async function searchDriveScoped(query: string, agentId?: string): Promise<SearchResult[]> {
    try {
        const driveHits = await searchDriveLibraryScoped(query, agentId);
        const keywords = tokenizeQuery(query);

        return driveHits.map(hit => ({
            title: hit.name,
            source: `From: Google Drive / ${hit.folderContext || 'Library'} / ${hit.name}`,
            score: computeRelevanceScore(hit.name, hit.name, keywords, agentId),
            content: `${hit.name}${hit.webViewLink ? '\nLink: ' + hit.webViewLink : ''}\nType: ${hit.mimeType}`
        }));
    } catch (error: any) {
        console.error("[KnowledgeBase] Drive search error:", error.message);
        return [];
    }
}

function formatResults(results: SearchResult[]): string {
    const sections: string[] = [];

    for (const result of results) {
        sections.push(
            `[${result.source}] (relevance: ${result.score})\n` +
            `${result.content}`
        );
    }

    return sections.join('\n\n---\n\n');
}
