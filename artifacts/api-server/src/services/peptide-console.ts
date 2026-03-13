import type { Express, Request, Response } from "express";
import fetch from "node-fetch";

const ABACUSAI_API_KEY = process.env.ABACUSAI_API_KEY;

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

      const messages = [
        { role: 'system', content: PEPTIDE_CONSOLE_SYSTEM_PROMPT },
        ...conversationHistory.map((m: any) => ({ role: m.role, content: m.content })),
        { role: 'user', content: message }
      ];

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      if (ABACUSAI_API_KEY) {
        // Use Abacus AI if configured
        const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ABACUSAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-4.1-mini', // or the configured abacus model
            messages,
            stream: true,
            max_tokens: 1500
          })
        });

        if (!response.ok) {
          throw new Error('Abacus API error');
        }

        const body = response.body;
        if (!body) throw new Error("No response body");

        body.on('data', (chunk: Buffer) => {
          const text = chunk.toString();
          const lines = text.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                res.write('data: {"done":true}\n\n');
                return;
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
        });

        body.on('end', () => {
          res.end();
        });

      } else {
        // Fallback to OpenAI if Abacus is not configured
        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        
        const stream = await openai.chat.completions.create({
          model: "gpt-4",
          messages: messages as any,
          stream: true,
        });

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        }
        res.write('data: {"done":true}\n\n');
        res.end();
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
}
