import type { Express, Request, Response } from "express";
import { requireRole } from "../working-auth";
import { storage } from "../storage";
import { z } from "zod";

export function registerBloodResearchRoutes(app: Express): void {
  const bloodSampleQuerySchema = z.object({
    organismType: z.enum(["virus", "bacteria", "parasite", "fungus", "cell_abnormality", "blood_cell_morphology", "artifact", "crystal", "protein_pattern"]).optional(),
    category: z.enum(["pathogen", "morphology", "nutritional_marker", "toxicity_indicator", "immune_response", "oxidative_stress", "coagulation", "reference_normal"]).optional(),
    search: z.string().max(200).optional(),
    tags: z.string().max(500).optional()
  });

  app.get("/api/blood-samples", requireRole("admin", "trustee", "doctor", "clinic"), async (req: Request, res: Response) => {
    try {
      const parsed = bloodSampleQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid query parameters", details: parsed.error.errors });
      }

      const { organismType, category, search, tags } = parsed.data;
      const filters: any = {};

      if (organismType) filters.organismType = organismType;
      if (category) filters.category = category;
      if (search) filters.search = search;
      if (tags) filters.tags = tags.split(',').map(t => t.trim()).filter(Boolean);

      const samples = await storage.getBloodSamples(filters);
      res.json(samples);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/blood-samples/tags", requireRole("admin", "trustee", "doctor", "clinic"), async (req: Request, res: Response) => {
    try {
      const tags = await storage.getAllBloodSampleTags();
      res.json(tags);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const aiSearchQuerySchema = z.object({
    query: z.string().min(1).max(500),
    limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1).max(50)).optional()
  });

  app.get("/api/blood-samples/search-for-ai", requireRole("admin", "trustee", "doctor", "clinic"), async (req: Request, res: Response) => {
    try {
      const parsed = aiSearchQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid query parameters", details: parsed.error.errors });
      }

      const samples = await storage.searchBloodSamplesForAI(
        parsed.data.query,
        parsed.data.limit || 10
      );
      res.json(samples);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/blood-samples/:id", requireRole("admin", "trustee", "doctor", "clinic"), async (req: Request, res: Response) => {
    try {
      const sample = await storage.getBloodSampleById(req.params.id);
      if (!sample) {
        return res.status(404).json({ error: "Sample not found" });
      }

      const tags = await storage.getBloodSampleTags(sample.id);
      res.json({ ...sample, tags: tags.map(t => t.tag) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/blood-samples/:id/tags", requireRole("admin", "trustee", "doctor", "clinic"), async (req: Request, res: Response) => {
    try {
      const tags = await storage.getBloodSampleTags(req.params.id);
      res.json(tags);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const bloodAnalysisSchema = z.object({
    imageDescription: z.string().optional(),
    observedFindings: z.array(z.string()).min(1),
    patientContext: z.string().optional(),
    specificQuestions: z.array(z.string()).optional()
  });

  app.post("/api/blood-analysis/analyze", requireRole("admin", "trustee", "doctor", "clinic"), async (req: Request, res: Response) => {
    try {
      const parsed = bloodAnalysisSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.errors });
      }

      const { analyzeBloodSample } = await import("../services/huggingface-blood-analysis");
      const result = await analyzeBloodSample(parsed.data);
      res.json(result);
    } catch (error: any) {
      console.error("[Blood Analysis] Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/blood-analysis/status", requireRole("admin", "trustee", "doctor", "clinic"), async (req: Request, res: Response) => {
    try {
      const { checkHuggingFaceStatus } = await import("../services/huggingface-blood-analysis");
      const status = await checkHuggingFaceStatus();
      res.json(status);
    } catch (error: any) {
      res.status(500).json({
        available: false,
        primaryModel: false,
        fallbackModel: false,
        message: error.message
      });
    }
  });

  const patternMatchSchema = z.object({
    observedPattern: z.string().min(1).max(1000),
    referencePatterns: z.array(z.object({
      name: z.string(),
      description: z.string()
    })).optional()
  });

  app.post("/api/blood-analysis/pattern-match", requireRole("admin", "trustee", "doctor", "clinic"), async (req: Request, res: Response) => {
    try {
      const parsed = patternMatchSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.errors });
      }

      const { quickPatternMatch } = await import("../services/huggingface-blood-analysis");

      let patterns = parsed.data.referencePatterns;
      if (!patterns || patterns.length === 0) {
        const samples = await storage.searchBloodSamplesForAI(parsed.data.observedPattern, 10);
        patterns = samples.map(s => ({
          name: s.title,
          description: s.morphologyDescription || s.clinicalSignificance || ''
        }));
      }

      const result = await quickPatternMatch(parsed.data.observedPattern, patterns);
      res.json(result);
    } catch (error: any) {
      console.error("[Pattern Match] Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  const researchSearchSchema = z.object({
    query: z.string().min(1).max(500),
    sources: z.array(z.enum(['openalex', 'pubmed', 'semantic_scholar', 'arxiv'])).optional(),
    limit: z.number().min(1).max(100).optional(),
    yearFrom: z.number().min(1900).max(2030).optional(),
    openAccessOnly: z.boolean().optional()
  });

  app.post("/api/research/search", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const parsed = researchSearchSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.errors });
      }

      const { searchAllSources } = await import("../services/research-apis");
      const result = await searchAllSources(parsed.data);

      res.json({ ...result, success: true });
    } catch (error: any) {
      console.error("[Research] Search error:", error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/research/hippocrates", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { query, limit } = req.body;
      if (!query) {
        return res.status(400).json({ error: "Query required" });
      }

      const { hippocratesSearch } = await import("../services/research-apis");
      const result = await hippocratesSearch(query, limit || 20);

      res.json({ ...result, success: true, agent: 'HIPPOCRATES' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/research/paracelsus", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { query, limit } = req.body;
      if (!query) {
        return res.status(400).json({ error: "Query required" });
      }

      const { paracelsusSearch } = await import("../services/research-apis");
      const result = await paracelsusSearch(query, limit || 20);

      res.json({ ...result, success: true, agent: 'PARACELSUS' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/research/helix", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { query, limit } = req.body;
      if (!query) {
        return res.status(400).json({ error: "Query required" });
      }

      const { helixSearch } = await import("../services/research-apis");
      const result = await helixSearch(query, limit || 20);

      res.json({ ...result, success: true, agent: 'HELIX' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/research/oracle", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { query, limit } = req.body;
      if (!query) {
        return res.status(400).json({ error: "Query required" });
      }

      const { oracleSearch } = await import("../services/research-apis");
      const result = await oracleSearch(query, limit || 20);

      res.json({ ...result, success: true, agent: 'ORACLE' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/research/openalex", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Query parameter 'q' required" });
      }

      const { searchOpenAlex } = await import("../services/research-apis");
      const result = await searchOpenAlex(query, { limit: 25 });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/research/pubmed", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Query parameter 'q' required" });
      }

      const { searchPubMed } = await import("../services/research-apis");
      const result = await searchPubMed(query, { limit: 25 });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
}
