import { db } from "../db";
import { trainingModules, driveAssets } from "@shared/schema";
import { eq, ilike, or, and, isNull } from "drizzle-orm";

interface SourceMapping {
  moduleId: string;
  keywords: string[];
  preferredSources?: string[];
}

const MODULE_SOURCE_MAPPINGS: SourceMapping[] = [
  { moduleId: "ecs-101-discovery", keywords: ["endocannabinoid", "cannabinoid", "ECS", "discovery"] },
  { moduleId: "ecs-102-receptors", keywords: ["CB1", "CB2", "receptor", "cannabinoid"] },
  { moduleId: "ecs-103-endocannabinoids", keywords: ["anandamide", "2-AG", "endocannabinoid"] },
  { moduleId: "ecs-104-deficiency", keywords: ["clinical endocannabinoid deficiency", "CED"] },
  { moduleId: "ecs-105-support", keywords: ["ECS support", "cannabinoid", "natural"] },
  { moduleId: "ecs-201-neuroanatomy", keywords: ["neuroanatomy", "cannabinoid", "brain", "CNS"] },
  { moduleId: "ecs-202-immune-system", keywords: ["immune", "cannabinoid", "inflammation"] },
  { moduleId: "ecs-203-patient-assessment", keywords: ["patient", "assessment", "cannabinoid"] },
  { moduleId: "ecs-204-phytocannabinoids", keywords: ["phytocannabinoid", "THC", "CBD", "cannabis"] },
  { moduleId: "ecs-205-terpenes", keywords: ["terpene", "entourage effect", "cannabis"] },
  { moduleId: "ecs-206-dosing", keywords: ["dosing", "titration", "cannabinoid"] },
  { moduleId: "ecs-207-drug-interactions", keywords: ["drug interaction", "safety", "cannabinoid"] },
  { moduleId: "ecs-208-certification-exam-prep", keywords: ["certification", "ECS", "exam"] },
  { moduleId: "ecs-301-research-review", keywords: ["research", "cannabinoid", "clinical"] },
  { moduleId: "ecs-302-complex-conditions", keywords: ["complex", "condition", "cannabinoid"] },
  { moduleId: "ecs-303-compounding", keywords: ["compounding", "cannabinoid", "formulation"] },
  { moduleId: "ecs-304-emerging-therapies", keywords: ["emerging", "therapy", "cannabinoid"] },
  { moduleId: "ecs-305-case-studies", keywords: ["case study", "clinical", "cannabinoid"] },
  { moduleId: "ecs-306-specialist-exam", keywords: ["specialist", "exam", "ECS"] },
  { moduleId: "c6054366-5063-4710-b2cb-674b4d3f107d", keywords: ["peptide", "therapy", "introduction"] },
  { moduleId: "e0cf9a56-cae4-4bc9-a130-7fe90c016b99", keywords: ["BPC-157", "peptide", "healing"] },
  { moduleId: "28191eb2-58bd-4ede-a4ce-f6cafdcafb51", keywords: ["bioregulator", "peptide", "Khavinson"] },
  { moduleId: "e736ebf0-c14d-4f59-926d-4271b0a44b7b", keywords: ["GLP-1", "peptide", "diabetes"] },
  { moduleId: "6e075459-f517-47ad-a494-471f2cc6d370", keywords: ["blood", "analysis", "diagnostic", "live blood"] },
  { moduleId: "21240eeb-04ca-4e16-b41d-b09571060562", keywords: ["IV", "therapy", "infusion", "administration"] },
  { moduleId: "3cba6221-d593-486d-b04d-5f4b9be66c45", keywords: ["mineral", "Wallach", "nutrition", "colloidal"] },
  { moduleId: "2f4f2f25-79c0-4079-955f-47163ca006d0", keywords: ["5 Rs", "protocol", "remove", "replace", "reinoculate"] },
  { moduleId: "pma-101-legal-systems", keywords: ["legal", "system", "civil", "common law"] },
  { moduleId: "pma-102-common-law-origins", keywords: ["common law", "origin", "custom", "usage"] },
  { moduleId: "pma-103-constitutional-rights", keywords: ["constitution", "rights", "protection", "amendment"] },
  { moduleId: "pma-104-state-action", keywords: ["state", "federal", "authority", "jurisdiction"] },
  { moduleId: "pma-105-pma-structure", keywords: ["PMA", "private member", "association", "structure"] },
  { moduleId: "pma-106-freedom-contract", keywords: ["contract", "freedom", "private", "agreement"] },
  { moduleId: "pma-107-case-law", keywords: ["case law", "precedent", "court", "ruling"] },
  { moduleId: "pma-108-practical-application", keywords: ["practical", "application", "member", "PMA"] },
];

async function findBestSourceForModule(mapping: SourceMapping): Promise<{ fileId: string; name: string } | null> {
  const keywordPatterns = mapping.keywords.map(k => `%${k}%`);
  
  for (const pattern of keywordPatterns) {
    const results = await db.select()
      .from(driveAssets)
      .where(
        and(
          ilike(driveAssets.name, pattern),
          eq(driveAssets.category, "document")
        )
      )
      .limit(1);
    
    if (results.length > 0) {
      return { fileId: results[0].driveFileId, name: results[0].name };
    }
  }
  
  return null;
}

export async function connectSourceMaterials(): Promise<{
  connected: number;
  notFound: number;
  details: { moduleId: string; sourceFile: string | null }[];
}> {
  console.log("[Source Connector] Starting source material connection...");
  
  const details: { moduleId: string; sourceFile: string | null }[] = [];
  let connected = 0;
  let notFound = 0;

  for (const mapping of MODULE_SOURCE_MAPPINGS) {
    const module = await db.select()
      .from(trainingModules)
      .where(eq(trainingModules.id, mapping.moduleId))
      .limit(1);
    
    if (module.length === 0) {
      console.log(`[Source Connector] Module not found: ${mapping.moduleId}`);
      continue;
    }

    if (module[0].driveFileId) {
      console.log(`[Source Connector] Module already has source: ${mapping.moduleId}`);
      details.push({ moduleId: mapping.moduleId, sourceFile: "already connected" });
      continue;
    }

    const source = await findBestSourceForModule(mapping);
    
    if (source) {
      await db.update(trainingModules)
        .set({ 
          driveFileId: source.fileId,
          pdfUrl: `https://drive.google.com/file/d/${source.fileId}/view`,
          updatedAt: new Date()
        })
        .where(eq(trainingModules.id, mapping.moduleId));
      
      console.log(`[Source Connector] Connected: ${mapping.moduleId} -> ${source.name.slice(0, 40)}...`);
      details.push({ moduleId: mapping.moduleId, sourceFile: source.name });
      connected++;
    } else {
      console.log(`[Source Connector] No source found for: ${mapping.moduleId}`);
      details.push({ moduleId: mapping.moduleId, sourceFile: null });
      notFound++;
    }
  }

  console.log(`[Source Connector] Complete: ${connected} connected, ${notFound} not found`);
  
  return { connected, notFound, details };
}

export async function autoConnectByKeywordMatch(): Promise<{
  connected: number;
  details: { moduleId: string; moduleName: string; sourceFile: string }[];
}> {
  console.log("[Auto Connector] Scanning modules without source files...");
  
  const modulesWithoutSource = await db.select()
    .from(trainingModules)
    .where(isNull(trainingModules.driveFileId));
  
  console.log(`[Auto Connector] Found ${modulesWithoutSource.length} modules without sources`);
  
  const details: { moduleId: string; moduleName: string; sourceFile: string }[] = [];
  let connected = 0;

  const keywordMappings: Record<string, string[]> = {
    "ECS": ["cannabinoid", "endocannabinoid", "ECS"],
    "Peptide": ["peptide", "amino acid", "bioregulator"],
    "PMA": ["legal", "law", "constitution", "rights"],
    "Blood": ["blood", "analysis", "diagnostic"],
    "Doctor": ["clinical", "patient", "physician"],
    "Nutrition": ["diet", "nutrition", "food", "mineral"],
    "IV": ["IV", "infusion", "therapy"],
  };

  for (const module of modulesWithoutSource) {
    const title = module.title.toLowerCase();
    const category = (module.category || "").toLowerCase();
    
    let searchTerms: string[] = [];
    
    for (const [key, terms] of Object.entries(keywordMappings)) {
      if (title.includes(key.toLowerCase()) || category.includes(key.toLowerCase())) {
        searchTerms = terms;
        break;
      }
    }

    const titleWords = title.split(/\s+/).filter(w => w.length > 4);
    searchTerms = [...searchTerms, ...titleWords.slice(0, 3)];

    for (const term of searchTerms) {
      const results = await db.select()
        .from(driveAssets)
        .where(
          and(
            ilike(driveAssets.name, `%${term}%`),
            eq(driveAssets.category, "document")
          )
        )
        .limit(1);
      
      if (results.length > 0) {
        await db.update(trainingModules)
          .set({ 
            driveFileId: results[0].driveFileId,
            pdfUrl: `https://drive.google.com/file/d/${results[0].driveFileId}/view`,
            updatedAt: new Date()
          })
          .where(eq(trainingModules.id, module.id));
        
        console.log(`[Auto Connector] Matched: "${module.title.slice(0, 35)}..." -> "${results[0].name.slice(0, 35)}..."`);
        details.push({ 
          moduleId: module.id, 
          moduleName: module.title,
          sourceFile: results[0].name 
        });
        connected++;
        break;
      }
    }
  }

  console.log(`[Auto Connector] Complete: ${connected} modules auto-connected`);
  
  return { connected, details };
}
