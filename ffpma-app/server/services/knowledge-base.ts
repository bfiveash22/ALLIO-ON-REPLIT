import * as fs from 'fs/promises';
import * as path from 'path';

const KB_DIR = process.env.NODE_ENV === 'production'
    ? '/root/allio-v1/knowledge-base'
    : path.join(process.cwd(), 'knowledge-base');

/**
 * Searches the local knowledge base directory for relevant information.
 * Currently supports simple text/markdown extraction.
 */
export async function searchKnowledgeBase(query: string, specificFile?: string): Promise<string> {
    try {
        // Ensure KB directory exists
        try {
            const stats = await fs.stat(KB_DIR);
            if (!stats.isDirectory()) {
                return `Error: ${KB_DIR} is not a directory.`;
            }
        } catch (e: any) {
            if (e.code === 'ENOENT') {
                // Create it if it doesn't exist locally to prevent crashes
                await fs.mkdir(KB_DIR, { recursive: true });
                return `The knowledge base directory is currently empty.`;
            }
            return `Error accessing knowledge base: ${e.message}`;
        }

        const files = await fs.readdir(KB_DIR);
        if (files.length === 0) {
            return "No documents currently found in the knowledge base.";
        }

        // Search recursively across all txt/md files
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
        if (allFiles.length === 0) {
            return "No text or markdown documents currently found anywhere in the knowledge base or subdirectories.";
        }

        // If they ask for a specific file, just read that one
        if (specificFile) {
            const targetPath = allFiles.find(f => path.basename(f) === specificFile || f.endsWith(specificFile));
            if (!targetPath) {
                return `Error: Could not find file ${specificFile} within the knowledge base.`;
            }

            try {
                const content = await fs.readFile(targetPath, 'utf8');
                return `--- Content of ${path.basename(targetPath)} ---\n${content.substring(0, 15000)}`;
            } catch (err) {
                return `Error: Could not read file ${specificFile}.`;
            }
        }

        // Search across all discovered txt/md files
        let results = [];
        for (const fullPath of allFiles) {
            const fileBasename = path.basename(fullPath);
            const content = await fs.readFile(fullPath, 'utf8');

            // Find matching keyword logic
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

        if (results.length > 0) {
            return results.join('\n\n');
        }

        return `Available files in the knowledge base: \n${files.join('\n')}\n\nNone matched the query precisely. Try requesting a specific file by name.`;

    } catch (error: any) {
        console.error("[KnowledgeBase] Search error:", error);
        return `Failed to search knowledge base: ${error.message}`;
    }
}
