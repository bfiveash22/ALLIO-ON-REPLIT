import * as fs from 'fs/promises';
import * as path from 'path';
import { compounds, interactions, stackingProtocols, compoundCategoryLabels } from '@shared/compound-interactions-data';

const KB_DIR = process.env.NODE_ENV === 'production'
    ? '/root/allio-v1/knowledge-base'
    : path.join(process.cwd(), 'knowledge-base');

function searchCompoundData(query: string): string {
    const keywords = query.toLowerCase().split(/[\s,]+/).filter(k => k.length > 1);
    if (keywords.length === 0) return '';

    const results: string[] = [];

    for (const compound of compounds) {
        const searchableText = `${compound.name} ${compound.description} ${compound.category} ${compound.bioavailabilityTips.join(' ')}`.toLowerCase();
        const matches = keywords.filter(kw => searchableText.includes(kw));
        if (matches.length > 0) {
            results.push(
                `Compound: ${compound.name} (${compoundCategoryLabels[compound.category]})\n` +
                `Description: ${compound.description}\n` +
                `Default Dose: ${compound.defaultDose} | Timing: ${compound.timing}\n` +
                `Bioavailability Tips: ${compound.bioavailabilityTips.join('; ')}`
            );
        }
    }

    for (const interaction of interactions) {
        const compA = compounds.find(c => c.id === interaction.compoundA);
        const compB = compounds.find(c => c.id === interaction.compoundB);
        const searchableText = `${compA?.name} ${compB?.name} ${interaction.description} ${interaction.mechanism} ${interaction.type}`.toLowerCase();
        const matches = keywords.filter(kw => searchableText.includes(kw));
        if (matches.length > 0) {
            results.push(
                `Interaction [${interaction.type.toUpperCase()}]: ${compA?.name} + ${compB?.name}\n` +
                `${interaction.description}\n` +
                `Mechanism: ${interaction.mechanism}\n` +
                `Recommendation: ${interaction.recommendation}`
            );
        }
    }

    for (const protocol of stackingProtocols) {
        const compoundNames = protocol.compounds.map(e => compounds.find(c => c.id === e.compoundId)?.name || '').join(' ');
        const searchableText = `${protocol.name} ${protocol.goal} ${protocol.description} ${compoundNames} ${protocol.notes.join(' ')}`.toLowerCase();
        const matches = keywords.filter(kw => searchableText.includes(kw));
        if (matches.length > 0) {
            const compoundList = protocol.compounds.map(e => {
                const c = compounds.find(comp => comp.id === e.compoundId);
                return `  - ${c?.name}: ${e.dose} (${e.timing}, ${e.route})`;
            }).join('\n');
            results.push(
                `Stacking Protocol: ${protocol.name}\n` +
                `Goal: ${protocol.goal}\n` +
                `${protocol.description}\n` +
                `Duration: ${protocol.duration}\n` +
                `Compounds:\n${compoundList}\n` +
                `Notes: ${protocol.notes.join('; ')}`
            );
        }
    }

    if (results.length > 0) {
        return `--- Compound Interaction Data ---\n${results.join('\n\n')}\n`;
    }
    return '';
}

/**
 * Searches the local knowledge base directory for relevant information.
 * Currently supports simple text/markdown extraction.
 */
export async function searchKnowledgeBase(query: string, specificFile?: string): Promise<string> {
    try {
        const compoundResults = searchCompoundData(query);

        try {
            const stats = await fs.stat(KB_DIR);
            if (!stats.isDirectory()) {
                return compoundResults || `Error: ${KB_DIR} is not a directory.`;
            }
        } catch (e: any) {
            if (e.code === 'ENOENT') {
                await fs.mkdir(KB_DIR, { recursive: true });
                return compoundResults || `The knowledge base directory is currently empty.`;
            }
            return compoundResults || `Error accessing knowledge base: ${e.message}`;
        }

        const files = await fs.readdir(KB_DIR);
        if (files.length === 0 && !compoundResults) {
            return "No documents currently found in the knowledge base.";
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
                    } else if (item.endsWith('.txt') || item.endsWith('.md')) {
                        results.push(fullPath);
                    }
                }
            } catch (err) {
                console.error("[KnowledgeBase] Traverse error:", err);
            }
            return results;
        }

        const allFiles = await getFilesRecursively(KB_DIR);
        if (allFiles.length === 0 && !compoundResults) {
            return "No text or markdown documents currently found anywhere in the knowledge base or subdirectories.";
        }

        if (specificFile) {
            const targetPath = allFiles.find(f => path.basename(f) === specificFile || f.endsWith(specificFile));
            if (!targetPath) {
                return compoundResults || `Error: Could not find file ${specificFile} within the knowledge base.`;
            }

            try {
                const content = await fs.readFile(targetPath, 'utf8');
                return `${compoundResults}\n--- Content of ${path.basename(targetPath)} ---\n${content.substring(0, 15000)}`;
            } catch (err) {
                return compoundResults || `Error: Could not read file ${specificFile}.`;
            }
        }

        let results = [];
        for (const fullPath of allFiles) {
            const fileBasename = path.basename(fullPath);
            const content = await fs.readFile(fullPath, 'utf8');

            const keywords = query.toLowerCase().split(' ').filter(k => k.length > 3);
            let score = 0;
            let firstMatchIndex = -1;

            for (const kw of keywords) {
                const idx = content.toLowerCase().indexOf(kw);
                if (idx !== -1) {
                    score++;
                    if (firstMatchIndex === -1 || idx < firstMatchIndex) {
                        firstMatchIndex = idx;
                    }
                }
            }

            if (score > 0 && firstMatchIndex !== -1) {
                const snippetStart = Math.max(0, firstMatchIndex - 200);
                const snippetEnd = Math.min(content.length, firstMatchIndex + 800);
                results.push(`Found in ${fileBasename}:\n...${content.substring(snippetStart, snippetEnd)}...\n`);
            }
        }

        if (results.length > 0 || compoundResults) {
            return `${compoundResults}\n${results.join('\n\n')}`.trim();
        }

        return `Available files in the knowledge base: \n${files.join('\n')}\n\nNone matched the query precisely. Try requesting a specific file by name.`;

    } catch (error: any) {
        console.error("[KnowledgeBase] Search error:", error);
        return `Failed to search knowledge base: ${error.message}`;
    }
}
