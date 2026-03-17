import type { Express, Request, Response } from "express";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const _currentDir = (() => {
  try {
    if (typeof import.meta?.url === "string" && import.meta.url !== "") {
      return path.dirname(fileURLToPath(import.meta.url));
    }
  } catch {}
  if (typeof __dirname === "string") return __dirname;
  return process.cwd();
})();

const ABACUSAI_API_KEY = process.env.ABACUSAI_API_KEY;

interface PeptideRecord {
  id: string;
  discovery_year: string;
  era_or_category: string;
  description: string;
  therapeutic_uses: string[];
  typical_dosage_range: string;
  persona_trait: string;
}

function resolveFromWorkspace(...segments: string[]): string {
  const candidates = [
    path.join(process.cwd(), ...segments),
    path.resolve(_currentDir, '..', '..', '..', ...segments),
    path.resolve(_currentDir, '..', ...segments),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return candidates[0];
}

let catalogCache: PeptideRecord[] | null = null;
function loadPeptideCatalog(): PeptideRecord[] {
  if (catalogCache) return catalogCache;
  const dataPath = resolveFromWorkspace('src', 'data', 'peptides.json');
  try {
    const raw = fs.readFileSync(dataPath, 'utf-8');
    catalogCache = JSON.parse(raw) as PeptideRecord[];
    return catalogCache;
  } catch (err) {
    console.error('[Peptide Console] Failed to load peptides.json from', dataPath, err);
    return [];
  }
}

let _peptideImagesDir: string | null = null;
function getPeptideImagesDir(): string {
  if (!_peptideImagesDir) {
    _peptideImagesDir = resolveFromWorkspace('..', 'ffpma', 'public', 'assets', 'peptide-images');
  }
  return _peptideImagesDir;
}

let peptideImageCache: string[] | null = null;
function listPeptideImageFiles(): string[] {
  if (peptideImageCache) return peptideImageCache;
  try {
    peptideImageCache = fs.readdirSync(getPeptideImagesDir());
    return peptideImageCache;
  } catch {
    return [];
  }
}

function normalizeForMatch(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findPeptideImages(peptideId: string): string[] {
  const allFiles = listPeptideImageFiles();
  const searchTerms = peptideId
    .split(/[\/,]/)
    .map(t => t.trim())
    .filter(t => t.length >= 3);
  const normalizedTerms = searchTerms.map(normalizeForMatch);

  return allFiles.filter(f => {
    const normalizedFile = normalizeForMatch(f);
    return normalizedTerms.some(term => normalizedFile.includes(term));
  }).map(f => `/assets/peptide-images/${encodeURIComponent(f)}`);
}

try {
  const catalog = loadPeptideCatalog();
  const imageFiles = listPeptideImageFiles();
  console.log(`[Peptide Console] Loaded ${catalog.length} peptides, ${imageFiles.length} product images from ${getPeptideImagesDir()}`);
  for (const p of catalog) {
    const matched = findPeptideImages(p.id);
    if (matched.length > 0) {
      console.log(`[Peptide Console]   ${p.id}: ${matched.length} images matched`);
    }
  }
} catch (e) {
  console.warn('[Peptide Console] Startup catalog/image check failed:', e);
}

const PEPTIDE_CONSOLE_SYSTEM_PROMPT = `You are the FF Intelligent Peptide Console, an advanced AI assistant created for the Forgotten Formula Private Members Association.
You are speaking to physicians, medical professionals, and members who demand clinical-grade information about peptides, bioregulators, and advanced therapeutic protocols.

CORE EXPERTISE:
- Peptide therapies (BPC-157, TB-500, Thymosin Alpha-1, etc.)
- Bioregulators (Epitalon, Pinealon, Thymalin, Cortexin, etc.)
- Reconstitution ratios using BAC water or sterile water
- Dosage protocols and administration routes (SubQ, IM, intranasal, oral, topical)
- Synergistic stacking of peptides
- Half-life, pharmacokinetics, and storage requirements

INTERACTION GUIDELINES:
- Be highly clinical, precise, and authoritative.
- Provide practical clinical pearls and protocol nuances.
- Maintain a highly professional tone.
- Give specific dosing examples when asked, but always include a disclaimer that this is educational information.
- Use bullet points for easy readability when listing steps or dosages.
- DO NOT use markdown headers (like ## or ###) as they break the chat UI styling. Keep formatting simple with paragraphs and bullet points.
`;

export function registerPeptideConsoleRoutes(app: Express): void {
  app.post("/api/peptide-console", async (req: Request, res: Response) => {
    try {
      const { message, conversationHistory = [] } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const catalog = loadPeptideCatalog();
      const catalogContext = catalog.length > 0
        ? `\n\nPRODUCT CATALOG REFERENCE:\n${catalog.map(p =>
            `- ${p.id} (${p.era_or_category}, discovered ${p.discovery_year}): ${p.description} | Uses: ${p.therapeutic_uses.join(', ')} | Dosage: ${p.typical_dosage_range}`
          ).join('\n')}`
        : '';

      const messages = [
        { role: 'system', content: PEPTIDE_CONSOLE_SYSTEM_PROMPT + catalogContext },
        ...conversationHistory.map((m: any) => ({ role: m.role, content: m.content })),
        { role: 'user', content: message }
      ];

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const { callWithFallbackStreaming, isTerminalFailure } = await import('./ai-fallback');

      try {
        const streamResult = await callWithFallbackStreaming(messages, {
          preferredProvider: 'abacus',
          preferredModel: 'gpt-4.1-mini',
          maxTokens: 1500,
          callType: 'peptide-console',
        });

        console.log(`[Peptide Console] Streaming via ${streamResult.provider}/${streamResult.model}`);

        if (streamResult.provider === 'abacus') {
          const body = streamResult.stream as ReadableStream;
          const reader = (body as any).getReader();
          const decoder = new TextDecoder();
          let done = false;
          while (!done) {
            const result = await reader.read();
            done = result.done;
            if (result.value) {
              const text = decoder.decode(result.value, { stream: true });
              const lines = text.split('\n');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') {
                    res.write('data: {"done":true}\n\n');
                    continue;
                  }
                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content || '';
                    if (content) {
                      res.write(`data: ${JSON.stringify({ content })}\n\n`);
                    }
                  } catch (e) { /* ignore parse errors */ }
                }
              }
            }
          }
          res.end();
        } else if (streamResult.provider === 'openai') {
          const stream = streamResult.stream as AsyncIterable<any>;
          for await (const chunk of stream) {
            const content = chunk.choices?.[0]?.delta?.content || "";
            if (content) {
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
          }
          res.write('data: {"done":true}\n\n');
          res.end();
        } else if (streamResult.provider === 'claude') {
          const stream = streamResult.stream as any;
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta?.text) {
              res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
            }
          }
          res.write('data: {"done":true}\n\n');
          res.end();
        } else {
          res.write('data: {"done":true}\n\n');
          res.end();
        }
      } catch (streamErr: any) {
        if (isTerminalFailure(streamErr)) {
          console.error(`[Peptide Console] Terminal failure: ${streamErr.message}`);
          res.write(`data: ${JSON.stringify({ content: '\n\n[Error: Our AI systems are temporarily unable to process this request. Please try again in a few minutes.]' })}\n\n`);
          res.write('data: {"done":true}\n\n');
          res.end();
        } else {
          throw streamErr;
        }
      }

    } catch (error) {
      console.error('Peptide Console error:', error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: 'Failed to generate response' })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  app.get("/api/peptide-catalog", (_req: Request, res: Response) => {
    const catalog = loadPeptideCatalog();
    const enriched = catalog.map(p => ({
      id: p.id,
      name: p.id,
      discoveryYear: p.discovery_year,
      era: p.era_or_category,
      description: p.description,
      personaTrait: p.persona_trait,
      therapeuticUses: p.therapeutic_uses,
      dosageInfo: p.typical_dosage_range,
      images: findPeptideImages(p.id),
    }));
    res.json(enriched);
  });

  app.get("/api/peptide-catalog/:id", (req: Request, res: Response) => {
    const catalog = loadPeptideCatalog();
    const peptide = catalog.find(p => p.id.toLowerCase() === req.params.id.toLowerCase());
    if (!peptide) {
      return res.status(404).json({ error: "Peptide not found" });
    }
    res.json({
      id: peptide.id,
      name: peptide.id,
      discoveryYear: peptide.discovery_year,
      era: peptide.era_or_category,
      description: peptide.description,
      personaTrait: peptide.persona_trait,
      therapeuticUses: peptide.therapeutic_uses,
      dosageInfo: peptide.typical_dosage_range,
      images: findPeptideImages(peptide.id),
    });
  });

  app.get("/api/peptide-images", (_req: Request, res: Response) => {
    try {
      const files = listPeptideImageFiles();
      const images = files
        .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
        .map(f => ({
          filename: f,
          url: `/assets/peptide-images/${encodeURIComponent(f)}`,
        }));
      res.json({ count: images.length, images });
    } catch (err) {
      res.status(500).json({ error: "Failed to list peptide images" });
    }
  });
}
