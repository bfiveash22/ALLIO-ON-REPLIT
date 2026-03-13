import { type Express, type Request, type Response } from "express";
import { storage } from "../storage";
import { requireAuth, requireRole } from "../middleware/auth";
import { generateToneWav, FREQUENCY_PRESETS, CATEGORY_SEED_DATA } from "../services/frequency-generator";
import { RIFE_FREQUENCY_PROTOCOLS, RIFE_SAFETY_GUIDELINES, RIFE_CATEGORY_INFO } from "../data/rife-frequency-protocols";

export function registerFrequencyRoutes(app: Express) {
  app.get("/api/frequencies", async (req: Request, res: Response) => {
    try {
      const { category, search, featured } = req.query;
      const frequencies = await storage.getFrequencies({
        category: category as string,
        search: search as string,
        featured: featured === "true",
      });
      res.json(frequencies);
    } catch (error: any) {
      console.error("[Frequencies] List error:", error);
      res.status(500).json({ error: "Failed to fetch frequencies" });
    }
  });

  app.get("/api/frequencies/categories", async (_req: Request, res: Response) => {
    try {
      const categories = await storage.getFrequencyCategories();
      res.json(categories);
    } catch (error: any) {
      console.error("[Frequencies] Categories error:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.get("/api/frequencies/rife-protocols", async (req: Request, res: Response) => {
    try {
      const { category, search } = req.query;
      let protocols = [...RIFE_FREQUENCY_PROTOCOLS];

      if (category && category !== "all") {
        protocols = protocols.filter(p => p.category === category);
      }

      if (search && typeof search === "string") {
        const q = search.toLowerCase();
        protocols = protocols.filter(p =>
          p.conditionName.toLowerCase().includes(q) ||
          p.mechanism.toLowerCase().includes(q) ||
          p.notes.toLowerCase().includes(q) ||
          p.tags.some(t => t.toLowerCase().includes(q))
        );
      }

      res.json(protocols);
    } catch (error: any) {
      console.error("[Frequencies] Rife protocols error:", error);
      res.status(500).json({ error: "Failed to fetch Rife protocols" });
    }
  });

  app.get("/api/frequencies/rife-protocols/:id", async (req: Request, res: Response) => {
    try {
      const protocol = RIFE_FREQUENCY_PROTOCOLS.find(p => p.id === req.params.id);
      if (!protocol) {
        return res.status(404).json({ error: "Protocol not found" });
      }
      res.json(protocol);
    } catch (error: any) {
      console.error("[Frequencies] Rife protocol detail error:", error);
      res.status(500).json({ error: "Failed to fetch protocol" });
    }
  });

  app.get("/api/frequencies/rife-safety", async (_req: Request, res: Response) => {
    try {
      res.json({
        safety: RIFE_SAFETY_GUIDELINES,
        categories: RIFE_CATEGORY_INFO,
      });
    } catch (error: any) {
      console.error("[Frequencies] Safety guidelines error:", error);
      res.status(500).json({ error: "Failed to fetch safety guidelines" });
    }
  });

  app.get("/api/frequencies/:id", async (req: Request, res: Response) => {
    try {
      const frequency = await storage.getFrequency(req.params.id);
      if (!frequency) {
        return res.status(404).json({ error: "Frequency not found" });
      }
      res.json(frequency);
    } catch (error: any) {
      console.error("[Frequencies] Get error:", error);
      res.status(500).json({ error: "Failed to fetch frequency" });
    }
  });

  app.post("/api/frequencies/:id/play", requireAuth, async (req: Request, res: Response) => {
    try {
      await storage.incrementFrequencyPlayCount(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("[Frequencies] Play count error:", error);
      res.status(500).json({ error: "Failed to update play count" });
    }
  });

  app.post("/api/frequencies/generate-tone", requireAuth, async (req: Request, res: Response) => {
    try {
      const { frequencyHz, durationSeconds, waveformType, saveToLibrary, title, category } = req.body;

      if (!frequencyHz || frequencyHz < 1 || frequencyHz > 20000) {
        return res.status(400).json({ error: "Frequency must be between 1 and 20000 Hz" });
      }

      const tone = generateToneWav({
        frequencyHz,
        durationSeconds: durationSeconds || 30,
        waveformType: waveformType || "sine",
      });

      if (saveToLibrary) {
        const freq = await storage.createFrequency({
          title: title || `${frequencyHz} Hz ${waveformType || "sine"} tone`,
          description: `Generated ${waveformType || "sine"} waveform at ${frequencyHz} Hz`,
          frequencyHz: frequencyHz.toString(),
          waveformType: waveformType || "sine",
          durationSeconds: durationSeconds || 30,
          category: category || "custom",
          purpose: `Custom generated tone at ${frequencyHz} Hz`,
          sourceAgent: "USER",
          audioBase64: tone.audioBase64,
          tags: ["generated", "custom", `${frequencyHz}hz`],
          isFeatured: false,
          isActive: true,
        });
        return res.json({ ...tone, savedFrequency: freq });
      }

      res.json(tone);
    } catch (error: any) {
      console.error("[Frequencies] Generate tone error:", error);
      res.status(500).json({ error: "Failed to generate tone" });
    }
  });

  app.post("/api/frequencies/seed", requireRole("admin"), async (_req: Request, res: Response) => {
    try {
      for (const catData of CATEGORY_SEED_DATA) {
        try {
          await storage.createFrequencyCategory(catData);
        } catch (e: any) {
          if (!e.message?.includes("duplicate") && !e.message?.includes("unique")) {
            console.warn(`[Frequencies] Category seed warning: ${e.message}`);
          }
        }
      }

      let created = 0;
      for (const preset of FREQUENCY_PRESETS) {
        try {
          await storage.createFrequency({
            title: preset.title,
            description: preset.description,
            frequencyHz: preset.frequencyHz.toString(),
            waveformType: "sine",
            durationSeconds: 300,
            category: preset.category,
            purpose: preset.purpose,
            sourceAgent: preset.sourceAgent,
            tags: preset.tags,
            isFeatured: preset.isFeatured,
            isActive: true,
          });
          created++;
        } catch (e: any) {
          if (!e.message?.includes("duplicate") && !e.message?.includes("unique")) {
            console.warn(`[Frequencies] Preset seed warning: ${e.message}`);
          }
        }
      }

      res.json({ success: true, created, categories: CATEGORY_SEED_DATA.length });
    } catch (error: any) {
      console.error("[Frequencies] Seed error:", error);
      res.status(500).json({ error: "Failed to seed frequency library" });
    }
  });
}
