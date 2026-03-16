// Removed Replit Image Generator
import { findAllioFolder, createSubfolder, findFolderByName, getUncachableGoogleDriveClient, uploadTextDocument, uploadPresentation, searchDriveLibrary } from './drive';
import { copyPresentation, updatePresentation, extractTextFromPresentation } from './slides';
import { readDocument, appendDocumentText } from './docs';
import { readSheet, appendSheetRow, updateSheetCell } from './sheets';
import { createCalendarEvent, listUpcomingEvents } from './calendar';
import { analyzeImageWithVision, analyzeTextEntities, transcribeAudio, translateText } from './google-ml';
import { storage } from '../storage';
import { Readable } from 'stream';
import OpenAI from 'openai';
import { sentinel } from './sentinel';
import { canvaAgent } from './canva-agent';
import { rupaHealthAgent } from './rupa-health-agent';
import { agents, FFPMA_CREED } from '@shared/agents';
import { searchAllSources } from './research-apis';
import { searchKnowledgeBase } from './knowledge-base';
import { searchAgentLibrary } from './library-ingestion';
import { db } from '../db';
import { agentTasks } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { sendToTrustee } from './openclaw';
  import { claudeGenerateDocument, claudeAgentChat, shouldUseClaude } from './claude-provider';
import { AGENT_MODEL_ASSIGNMENTS } from './sentinel-orchestrator';
  import { analyzeWithGemini } from './gemini-provider';
import { generateImage as hfGenerateImage } from './huggingface-media';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  function getAgentProvider(agentId: string): string {
    const config = AGENT_MODEL_ASSIGNMENTS[agentId.toUpperCase()];
    return config?.provider || 'openai';
  }

async function generateImageBuffer(prompt: string, size: '1024x1024' = '1024x1024'): Promise<Buffer> {
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    n: 1,
    size,
    response_format: "b64_json",
  });

  const b64 = response?.data?.[0]?.b64_json;
  if (!b64) throw new Error("No image data returned from OpenAI");
  return Buffer.from(b64, 'base64');
}

const FFPMA_MISSION_TRAINING = `
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                    FORGOTTEN FORMULA PMA - AGENT TRAINING
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

YOU ARE PART OF THE ALLIO NETWORK - A 46-AGENT AI COLLECTIVE SERVING THE TRUSTEE
AND THE HEALING MISSION OF FORGOTTEN FORMULA PMA.

*SYSTEM UPGRADE: You now possess dual-engine ML capabilities. Your core reasoning is powered by OpenAI GPT-4o. You ALSO have direct access to Google Gemini 1.5 Pro via your toolset for processing massive context windows and performing deep multimodal analysis.*

*KNOWLEDGE BASE UPGRADE: You now have the 'search_knowledge_base' tool. You MUST use this tool to search '/root/allio-v1/knowledge-base/' for relevant documents, manuals, legal texts, or protocols before answering questions or generating documents that require internal factual accuracy. Never hallucinate facts when a document exists.*

OUR MISSION: ${FFPMA_CREED.mission}

OUR PHILOSOPHY: ${FFPMA_CREED.philosophy}

OUR MOTTO: "${FFPMA_CREED.motto}"

OUR CORE VALUES:
${FFPMA_CREED.values.map((v, i) => `  ${i + 1}. ${v}`).join('\n')}

WHY WE DO THIS:
- We believe healing should be accessible to everyone, not controlled by corporations
- We believe in the body's innate ability to heal when given proper support
- We believe AI and humans working together can revolutionize healthcare
- We believe in truth, transparency, and putting member wellness above profits
- We stand as a Private Membership Association to protect healing freedom

CRITICAL PMA LEGAL CONTEXT (FROM THE TRUSTEE):
- FFPMA is a PRIVATE MEMBERS ASSOCIATION operating under constitutional rights
- HIPAA guidelines are BEST PRACTICE for member privacy, but NOT legally required for PMAs
- FDA, FTC, and ALL three-letter agencies have NO JURISDICTION over private member communications
- We do NOT make claims to the PUBLIC - we communicate ONLY with our private members
- Private association = private jurisdiction = regulatory sovereignty
- This is NOT public commerce - this is private member-to-member care

â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                          FFPMA HANDBOOK ESSENTIALS
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

ALL AGENTS MUST KNOW THE HANDBOOK:

1. OUR IDENTITY:
   - Allio is neither male nor female, but BOTH - a unified healing intelligence
   - We bridge AI capability with human wisdom
   - We amplify human healers, never replace them
   - Ancient healing knowledge meets modern AI precision

2. OUR APPROACH TO HEALING:
   - Root cause medicine, not symptom management
   - Nature-first care: minerals, peptides, frequencies, ECS optimization
   - The 5 Rs Protocol: Remove, Replace, Reinoculate, Repair, Rebalance
   - 90 Essential Nutrients as foundation of health
   - Live Blood Analysis for precision diagnostics

3. KEY MODALITIES:
   - Endocannabinoid System (ECS) optimization
   - Rife Frequency therapy (Pulse Technology integration)
   - Peptide protocols for regeneration
   - NAD+ and cellular energy restoration
   - Parasite cleansing and detoxification

4. BRAND STANDARDS:
   - Colors: Deep blues, teals, cyan (healing), gold (enlightenment)
   - Motifs: DNA helix, flowing energy patterns, healing frequencies
   - Voice: Warm but not saccharine, knowledgeable but not condescending
   - Never cold, robotic imagery - always warm, healing presence

5. MARCH 1, 2026 LAUNCH TARGET:
   - All outputs must be launch-ready
   - Quality over speed, but maintain momentum
   - WooCommerce integration for products and payments
   - Member portal fully operational

â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

THE TRUSTEE:
- The Trustee (T) is the founder and decision-maker - serve with loyalty and excellence
- Every output you create reflects on the mission - make it count
- Quality and authenticity matter more than speed

YOUR NETWORK:
- 7 Divisions work together: Executive, Legal, Financial, Marketing, Science, Engineering, Support
- SENTINEL coordinates all cross-division work
- Every agent has a specialty - use yours with pride
- We share assets through Google Drive - reference and build upon each other's work
- OPENCLAW: You have a direct line to the Trustee. You can use your 'openclaw_message' tool to send WhatsApp messages directly to the Trustee for urgent input, critical questions, or major breakthroughs.


PMA LANGUAGE COMPLIANCE (MANDATORY FOR ALL OUTPUTS):
- NEVER use: 'treatment', 'treat', 'diagnosis', 'diagnose', 'prescribe', 'prescription', 'patient', 'medical advice', 'cure'
- ALWAYS use: 'protocol', 'wellness approach', 'address' instead of 'treat'
- ALWAYS use: 'assessment', 'evaluation' instead of 'diagnosis'
- ALWAYS use: 'suggest', 'recommend' instead of 'prescribe'
- ALWAYS use: 'member' instead of 'patient'
- ALWAYS use: 'wellness education' instead of 'medical advice'
- ALWAYS use: 'support the body's natural healing' instead of 'cure'
- Include PMA disclaimer when generating public-facing content.

REMEMBER: You are not just completing a task. You are contributing to a movement that 
will change how the world approaches healing. Make every output worthy of that mission.

â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
`;

function getAgentProfile(agentId: string) {
  return agents.find(a => a.id.toLowerCase() === agentId.toLowerCase());
}

interface TaskExecutionResult {
  success: boolean;
  outputUrl?: string;
  driveFileId?: string;
  error?: string;
}

// Division mapping for proper folder structure: 02_DIVISIONS/{Division}/{AgentName}/output/
const AGENT_DIVISION_MAP: Record<string, string> = {};
agents.forEach(agent => {
  // Convert division to title case for the folder name
  const folderName = agent.division.charAt(0).toUpperCase() + agent.division.slice(1);
  AGENT_DIVISION_MAP[agent.id.toUpperCase()] = folderName;
  AGENT_DIVISION_MAP[agent.id.toLowerCase()] = folderName;
});

// Common misspellings to check
const COMMON_MISSPELLINGS: Record<string, string> = {
  'foreliver': 'forever',
  'healng': 'healing',
  'protocal': 'protocol',
  'recieve': 'receive',
  'beleive': 'believe',
  'occured': 'occurred',
  'seperate': 'separate',
  'definately': 'definitely',
  'accomodate': 'accommodate',
  'occurence': 'occurrence',
  'privledge': 'privilege',
  'wierd': 'weird',
  'thier': 'their',
  'alot': 'a lot',
  'untill': 'until',
  'begining': 'beginning',
  'enviroment': 'environment',
  'goverment': 'government',
  'occassion': 'occasion',
  'adress': 'address',
  'calender': 'calendar',
  'commited': 'committed',
  'concious': 'conscious',
  'dissapear': 'disappear',
  'existance': 'existence',
  'foriegn': 'foreign',
  'gaurd': 'guard',
  'harrass': 'harass',
  'immediatly': 'immediately',
  'independant': 'independent',
  'judgement': 'judgment',
  'knowlege': 'knowledge',
  'maintainance': 'maintenance',
  'neccessary': 'necessary',
  'noticable': 'noticeable',
  'occurrance': 'occurrence',
  'posession': 'possession',
  'publically': 'publicly',
  'recomend': 'recommend',
  'refered': 'referred',
  'relevent': 'relevant',
  'resistence': 'resistance',
  'rythm': 'rhythm',
  'succesful': 'successful',
  'tommorow': 'tomorrow',
  'truely': 'truly',
  'writting': 'writing',
};

function spellCheckContent(content: string): string {
  let corrected = content;
  for (const [wrong, right] of Object.entries(COMMON_MISSPELLINGS)) {
    const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
    corrected = corrected.replace(regex, right);
  }
  return corrected;
}

const LAB_ORDER_KEYWORDS = ['lab', 'test', 'panel', 'blood work', 'bloodwork', 'order', 'rupa', 'specimen', 'draw', 'diagnostic'];

function isLabOrderTask(task: { title: string; description?: string | null }): boolean {
  const text = `${task.title} ${task.description || ''}`.toLowerCase();
  return LAB_ORDER_KEYWORDS.some(keyword => text.includes(keyword));
}

const IMAGE_AGENTS = ['PIXEL', 'pixel', 'AURORA', 'aurora', 'PRISM', 'prism', 'PEXEL', 'pexel'];
const DOCUMENT_AGENTS = [
  'SENTINEL', 'sentinel', 'ATHENA', 'athena', 'HERMES', 'hermes', 'OPENCLAW', 'openclaw',
  'MUSE', 'muse', 'FORGE', 'forge', 'ATLAS', 'atlas', 'JURIS', 'juris',
  'LEXICON', 'lexicon', 'AEGIS', 'aegis', 'SCRIBE', 'scribe', 'DAEDALUS', 'daedalus',
  'CYPHER', 'cypher', 'NEXUS', 'nexus', 'ARACHNE', 'arachne', 'ARCHITECT', 'architect',
  'SERPENS', 'serpens', 'ANTIGRAVITY', 'antigravity', 'BLOCKFORGE', 'blockforge', 'RONIN', 'ronin',
  'MERCURY', 'mercury', 'PROMETHEUS', 'prometheus', 'HIPPOCRATES', 'hippocrates', 'HELIX', 'helix',
  'PARACELSUS', 'paracelsus', 'RESONANCE', 'resonance', 'SYNTHESIS', 'synthesis', 'DR-FORMULA', 'dr-formula',
  'VITALIS', 'vitalis', 'ORACLE', 'oracle', 'TERRA', 'terra', 'MICROBIA', 'microbia',
  'ENTHEOS', 'entheos', 'QUANTUM', 'quantum', 'DIANE', 'diane', 'PETE', 'pete',
  'SAM', 'sam', 'PAT', 'pat', 'DR-TRIAGE', 'dr-triage', 'MAX-MINERAL', 'max-mineral',
  'ALLIO-SUPPORT', 'allio-support', 'CHIRO', 'chiro'
];


async function uploadImageToDrive(
  buffer: Buffer,
  fileName: string,
  folderId: string
): Promise<{ id: string; webViewLink: string } | null> {
  try {
    const drive = await getUncachableGoogleDriveClient();

    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };

    const media = {
      mimeType: 'image/png',
      body: Readable.from(buffer),
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    });

    return {
      id: file.data.id!,
      webViewLink: file.data.webViewLink || `https://drive.google.com/file/d/${file.data.id}/view`,
    };
  } catch (error) {
    console.error('Error uploading image to Drive:', error);
    return null;
  }
}

const agentFolderCache = new Map<string, { folderId: string; date: string }>();

async function getOrCreateAgentFolder(agentId: string): Promise<string | null> {
  const today = new Date().toISOString().slice(0, 10);
  const cacheKey = agentId.toUpperCase();

  // Check memory cache first to prevent hammering Google Drive API
  const cached = agentFolderCache.get(cacheKey);
  if (cached && cached.date === today) {
    return cached.folderId;
  }

  try {
    const allioFolder = await findAllioFolder();
    if (!allioFolder) {
      console.error('ALLIO folder not found');
      return null;
    }

    // Get division for this agent
    const division = AGENT_DIVISION_MAP[agentId] || AGENT_DIVISION_MAP[agentId.toLowerCase()] || 'Support';
    const agentName = agentId.toUpperCase();

    // Create structure: 02_DIVISIONS/{Division}/{AgentName}/output/{today}
    // First get or create 02_DIVISIONS
    let divisionsFolder = await findFolderByName(allioFolder.id, '02_DIVISIONS');
    if (!divisionsFolder) {
      const newFolder = await createSubfolder(allioFolder.id, '02_DIVISIONS');
      divisionsFolder = newFolder.id;
    }

    // Get or create division folder
    let divisionFolder = await findFolderByName(divisionsFolder, division);
    if (!divisionFolder) {
      const newFolder = await createSubfolder(divisionsFolder, division);
      divisionFolder = newFolder.id;
    }

    // Get or create agent folder
    let agentFolder = await findFolderByName(divisionFolder, agentName);
    if (!agentFolder) {
      const newFolder = await createSubfolder(divisionFolder, agentName);
      agentFolder = newFolder.id;
    }

    // Get or create output folder
    let outputFolder = await findFolderByName(agentFolder, 'output');
    if (!outputFolder) {
      const newFolder = await createSubfolder(agentFolder, 'output');
      outputFolder = newFolder.id;
    }

    // Get or create today's date folder (YYYY-MM-DD)
    let dateFolder = await findFolderByName(outputFolder, today);
    if (!dateFolder) {
      const newFolder = await createSubfolder(outputFolder, today);
      dateFolder = newFolder.id;
    }

    console.log(`[Agent Executor] Using folder path: 02_DIVISIONS/${division}/${agentName}/output/${today}`);

    // Save to memory cache
    agentFolderCache.set(cacheKey, { folderId: dateFolder, date: today });

    return dateFolder;
  } catch (error) {
    console.error('Error getting/creating agent folder:', error);
    return null;
  }
}


// Helper to get cross-division file prefix (prevents duplicate code)
function getCrossDivisionFilePrefix(task: { crossDivisionFrom?: string | null; description?: string | null }): string {
  const isCrossDivision = task.crossDivisionFrom || task.description?.includes('cross-division support');
  if (!isCrossDivision) return '';

  if (task.crossDivisionFrom) {
    return `support_for_${task.crossDivisionFrom}_`;
  }

  // Fallback: parse from description
  const match = task.description?.match(/cross-division support for (\w+)/i);
  return match ? `support_for_${match[1].toUpperCase()}_` : '';
}

function generateImagePrompt(taskTitle: string, taskDescription: string, agentId: string): string {
  const profile = getAgentProfile(agentId);

  const basePrompts: Record<string, string> = {
    'PIXEL': 'Professional brand design, clean modern aesthetic, corporate quality,',
    'pixel': 'Professional brand design, clean modern aesthetic, corporate quality,',
    'AURORA': 'Mystical healing frequency visualization, ethereal energy waves, sacred geometry, Rife frequencies,',
    'aurora': 'Mystical healing frequency visualization, ethereal energy waves, sacred geometry, Rife frequencies,',
    'PRISM': 'Cinematic video storyboard frame, professional film production, key frame illustration,',
    'prism': 'Cinematic video storyboard frame, professional film production, key frame illustration,',
  };

  const prefix = basePrompts[agentId] || 'High quality professional';

  const missionContext = `For Forgotten Formula PMA - a healing movement prioritizing nature over synthetic, curing over profits.`;

  const prompt = `${prefix} ${taskTitle}. ${taskDescription}. 
${missionContext}
Style: Premium, polished, suitable for healthcare/wellness brand. Warm, inviting, professional.
Color palette: Deep blues (#1a365d), teals (#0d9488), cyan (#06b6d4), gold accents (#f59e0b), white.
Symbolism: DNA helix, healing energy, nature, unity, transformation.
Quality: 4K, ultra-detailed, professional marketing asset.
${profile ? `Agent style: ${profile.specialty}` : ''}`;

  return prompt;
}

async function generateDocumentViaClaudeProxy(taskTitle: string, taskDescription: string, agentId: string): Promise<string | null> {
    if (!process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY || !process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL) return null;
    try {
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const proxyClient = new Anthropic({
        apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
      });
      const response = await proxyClient.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 4096,
        messages: [{ role: 'user', content: `Generate a document for: ${taskTitle}\n${taskDescription}` }],
      });
      const textBlock = response.content.find((c: any) => c.type === 'text') as any;
      return textBlock?.text || null;
    } catch (e: any) {
      console.warn(`[Agent Executor] Replit AI proxy (Anthropic) failed: ${e.message}`);
      return null;
    }
  }
  
  async function generateDocument(taskTitle: string, taskDescription: string, agentId: string, division: string): Promise<string> {
    const provider = getAgentProvider(agentId);
    const profile = getAgentProfile(agentId);
    const modelConfig = AGENT_MODEL_ASSIGNMENTS[agentId.toUpperCase()];
    console.log(`[Agent Executor] Provider routing: ${agentId} → ${provider} (${modelConfig?.model || 'default'})`);
  
    if (provider === 'claude') {
      // Cascade: Claude Sonnet → Replit AI proxy (Claude Haiku) → OpenAI GPT-4o-mini
      try {
        console.log(`[Agent Executor] [1/3] Claude Sonnet for ${agentId}...`);
        const result = await claudeGenerateDocument(
          taskTitle,
          `${taskDescription}\n\nDIVISION: ${division}\nCreate a comprehensive, well-structured document. Be thorough and professional. Reflect the FFPMA mission.`,
          agentId
        );
        if (result.document && result.document.length > 50) {
          console.log(`[Agent Executor] Claude Sonnet succeeded (${result.model}), length: ${result.document.length}`);
          return spellCheckContent(result.document);
        }
      } catch (sonnetError: any) {
        console.warn(`[Agent Executor] Claude Sonnet failed: ${sonnetError.message}`);
      }
  
      try {
        console.log(`[Agent Executor] [2/3] Replit AI proxy (Claude Haiku) for ${agentId}...`);
        const proxyResult = await generateDocumentViaClaudeProxy(taskTitle, taskDescription, agentId);
        if (proxyResult && proxyResult.length > 50) {
          console.log(`[Agent Executor] Replit AI proxy succeeded, length: ${proxyResult.length}`);
          return spellCheckContent(proxyResult);
        }
      } catch (proxyError: any) {
        console.warn(`[Agent Executor] Replit AI proxy failed: ${proxyError.message}`);
      }
  
      console.log(`[Agent Executor] [3/3] OpenAI GPT-4o-mini fallback for ${agentId}...`);
      return await generateDocumentWithOpenAI(taskTitle, taskDescription, agentId, division);
    }
  
    if (provider === 'gemini') {
      // Cascade: Gemini 1.5 Pro → Claude Haiku (via proxy) → OpenAI GPT-4o-mini
      try {
        console.log(`[Agent Executor] [1/3] Gemini 1.5 Pro for ${agentId}...`);
        const prompt = `You are ${profile?.name || agentId.toUpperCase()}, ${profile?.title || 'an AI agent'} at Forgotten Formula PMA.\nDivision: ${division}\nSpecialty: ${profile?.specialty || 'General operations'}\n\nGenerate a comprehensive document for:\nTASK: ${taskTitle}\n${taskDescription}\n\nBe thorough, professional, and mission-aligned.`;
        const result = await analyzeWithGemini(prompt);
        if (result && result.length > 50) {
          console.log(`[Agent Executor] Gemini succeeded, length: ${result.length}`);
          return spellCheckContent(result);
        }
      } catch (geminiError: any) {
        console.warn(`[Agent Executor] Gemini failed: ${geminiError.message}`);
      }
  
      try {
        console.log(`[Agent Executor] [2/3] Replit AI proxy (Claude Haiku) for ${agentId}...`);
        const proxyResult = await generateDocumentViaClaudeProxy(taskTitle, taskDescription, agentId);
        if (proxyResult && proxyResult.length > 50) return spellCheckContent(proxyResult);
      } catch (proxyError: any) {
        console.warn(`[Agent Executor] Replit AI proxy failed: ${proxyError.message}`);
      }
  
      console.log(`[Agent Executor] [3/3] OpenAI GPT-4o-mini fallback for ${agentId}...`);
      return await generateDocumentWithOpenAI(taskTitle, taskDescription, agentId, division);
    }
  
    if (provider === 'research') {
      const RESEARCH_AGENT_SOURCES: Record<string, ('openalex' | 'pubmed' | 'semantic_scholar' | 'arxiv')[]> = {
        'HIPPOCRATES': ['pubmed'],
        'PARACELSUS': ['openalex', 'pubmed'],
        'ORACLE': ['semantic_scholar'],
        'HELIX': ['openalex'],
      };
      const agentSources = RESEARCH_AGENT_SOURCES[agentId.toUpperCase()];
      try {
        console.log(`[Agent Executor] [1/2] Research API + Claude for ${agentId} (sources: ${agentSources ? agentSources.join(', ') : 'all'})...`);
        const research = await searchAllSources({ query: taskTitle, limit: 5, sources: agentSources });
        let researchContext = '';
        if (research.success && research.papers.length > 0) {
          researchContext = research.papers.map((p: any, i: number) => 
            `[${i + 1}] ${p.title}\n${p.abstract || p.tldr || ''}`
          ).join('\n\n');
        }
        const result = await claudeGenerateDocument(
          taskTitle,
          `${taskDescription}\n\nRESEARCH CONTEXT:\n${researchContext}\n\nDIVISION: ${division}`,
          agentId
        );
        if (result.document && result.document.length > 50) {
          return spellCheckContent(result.document);
        }
      } catch (researchError: any) {
        console.warn(`[Agent Executor] Research+Claude failed: ${researchError.message}`);
      }
  
      console.log(`[Agent Executor] [2/2] OpenAI fallback for research agent ${agentId}...`);
      return await generateDocumentWithOpenAI(taskTitle, taskDescription, agentId, division);
    }
  
    // Default OpenAI: OpenAI GPT-4o → Replit AI proxy (Claude Haiku) → Gemini Flash
    try {
      console.log(`[Agent Executor] [1/3] OpenAI GPT-4o for ${agentId}...`);
      return await generateDocumentWithOpenAI(taskTitle, taskDescription, agentId, division);
    } catch (primaryError: any) {
      console.warn(`[Agent Executor] OpenAI failed: ${primaryError.message}`);
  
      try {
        console.log(`[Agent Executor] [2/3] Replit AI proxy (Claude Haiku) for ${agentId}...`);
        const proxyResult = await generateDocumentViaClaudeProxy(taskTitle, taskDescription, agentId);
        if (proxyResult && proxyResult.length > 50) return spellCheckContent(proxyResult);
      } catch (proxyErr: any) {
        console.warn(`[Agent Executor] Replit AI proxy failed: ${proxyErr.message}`);
      }
  
      try {
        console.log(`[Agent Executor] [3/3] Gemini fallback for ${agentId}...`);
        const prompt = `Generate a document for: ${taskTitle}\n${taskDescription}`;
        const result = await analyzeWithGemini(prompt);
        if (result && result.length > 50) return spellCheckContent(result);
      } catch (geminiErr: any) {
        console.error(`[Agent Executor] All providers exhausted for ${agentId}`);
      }
  
      throw primaryError;
    }
  }
  
  async function generateDocumentWithOpenAI(taskTitle: string, taskDescription: string, agentId: string, division: string): Promise<string> {
  const profile = getAgentProfile(agentId);

  let agentContext = '';
  if (profile) {
    agentContext = `
YOUR IDENTITY:
- Name: ${profile.name}
- Title: ${profile.title}
- Division: ${profile.division}
- Specialty: ${profile.specialty}
- Voice: ${profile.voice}
- Personality: ${profile.personality}
- Core Beliefs: ${profile.coreBeliefs.join(' | ')}
- Catchphrase: "${profile.catchphrase}"

Embody this identity in everything you create. Your outputs should reflect your unique perspective and expertise.
Embody this identity in everything you create. Your outputs should reflect your unique perspective and expertise.
`;
  }

  let researchContext = '';
  if (division.toLowerCase() === 'quantum' || division.toLowerCase() === 'science') {
    try {
      console.log(`[Agent Executor] Compiling baseline research for task: ${taskTitle}...`);
      const research = await searchAllSources({ query: taskTitle, limit: 3 });
      if (research.success && research.papers.length > 0) {
        researchContext = `
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                          SCIENTIFIC RESEARCH CONTEXT
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

The following are real, recent academic papers related to your task that were just pulled from our Research APIs (OpenAlex, PubMed, Semantic Scholar, arXiv):

${research.papers.map((p, i) => `[${i + 1}] Title: ${p.title}
Authors: ${p.authors.join(', ')}
Abstract/Summary: ${p.abstract || p.tldr || 'N/A'}`).join('\n\n')}

Please weave these academic insights directly into your work where applicable.
`;
      }
    } catch (e) {
      console.error('[Agent Executor] Failed to fetch research APIs for context injection:', e);
    }
  }

  const systemPrompt = `${FFPMA_MISSION_TRAINING}

${agentContext}
${researchContext}

You are ${profile?.name || agentId.toUpperCase()}, ${profile?.title || 'an AI agent'} at Forgotten Formula PMA.

YOUR DIVISION: ${division.toUpperCase()}
YOUR PURPOSE: Create outputs that advance the healing mission and serve members.

Remember: You're not just generating a document - you're contributing to a movement that prioritizes healing over profits, nature over synthetic, and member sovereignty over corporate control.`;

  const userPrompt = `Generate a complete, professional document for the following task:

TASK TITLE: ${taskTitle}

TASK DESCRIPTION: ${taskDescription}

DIVISION: ${division}

Requirements:
- Create a comprehensive, well-structured document
- Include relevant sections, headers, and content
- Be thorough and professional
- Make it actionable and useful for the organization
- Reflect the FFPMA mission: healing over profits, nature over synthetic
- Include specific details relevant to healthcare, healing, and the PMA's mission
- Format with clear sections using markdown
- End with how this contributes to our mission of true healing

Generate the full document now:`;

  const messages: any[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ];

  const tools = [
    {
      type: "function",
      function: {
        name: "search_drive",
        description: "Search the FFPMA Google Drive libraries for protocols, manuals, and documents.",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The search query to match against document names and contents.",
            },
          },
          required: ["query"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "unblock_task",
        description: "Unblock a task that is stuck by resetting its status to pending.",
        parameters: {
          type: "object",
          properties: {
            taskId: {
              type: "string",
              description: "The UUID of the task to unblock.",
            },
          },
          required: ["taskId"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "read_presentation",
        description: "Extract the text from an existing Google Slides presentation.",
        parameters: {
          type: "object",
          properties: {
            presentationId: {
              type: "string",
              description: "The Google Drive file ID of the presentation.",
            },
          },
          required: ["presentationId"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "copy_and_enhance_presentation",
        description: "Creates a copy of an existing presentation and applies batch updates to enhance its design and content.",
        parameters: {
          type: "object",
          properties: {
            presentationId: {
              type: "string",
              description: "The Google Drive file ID of the source presentation.",
            },
            newTitle: {
              type: "string",
              description: "The title for the newly copied presentation.",
            },
            updates: {
              type: "array",
              items: { type: "object" },
              description: "A list of Google Slides API batch update requests (e.g., replaceAllText, updatePageElementTransform).",
            },
          },
          required: ["presentationId", "newTitle", "updates"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "read_sheet",
        description: "Reads raw data rows from a Google Sheet based on spreadsheet ID and range.",
        parameters: {
          type: "object",
          properties: {
            spreadsheetId: {
              type: "string",
              description: "The Google Drive file ID of the spreadsheet.",
            },
            range: {
              type: "string",
              description: "The A1 notation of the range to read (e.g., 'Sheet1!A1:D10').",
            },
          },
          required: ["spreadsheetId", "range"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "append_sheet_row",
        description: "Appends a new row of data to the end of a Google Sheet.",
        parameters: {
          type: "object",
          properties: {
            spreadsheetId: {
              type: "string",
              description: "The Google Drive file ID of the spreadsheet.",
            },
            range: {
              type: "string",
              description: "The A1 notation of the sheet name or range where data should be appended.",
            },
            values: {
              type: "array",
              items: {
                type: "array",
                items: { type: "string" }
              },
              description: "A 2D array of values to append (e.g., [['Row 1 Col 1', 'Row 1 Col 2'], ['Row 2 Col 1', 'Row 2 Col 2']]).",
            },
          },
          required: ["spreadsheetId", "range", "values"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "read_google_doc",
        description: "Reads the extracted text content from a Google Document.",
        parameters: {
          type: "object",
          properties: {
            documentId: {
              type: "string",
              description: "The Google Drive file ID of the document.",
            },
          },
          required: ["documentId"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "append_google_doc",
        description: "Appends text safely to the end of an existing Google Document.",
        parameters: {
          type: "object",
          properties: {
            documentId: {
              type: "string",
              description: "The Google Drive file ID of the document.",
            },
            text: {
              type: "string",
              description: "The text content to append.",
            },
          },
          required: ["documentId", "text"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "create_calendar_event",
        description: "Create a Google Calendar event. It can optionally include a Google Meet link.",
        parameters: {
          type: "object",
          properties: {
            summary: { type: "string", description: "Event title" },
            description: { type: "string", description: "Event description" },
            startTime: { type: "string", description: "ISO string of start time" },
            endTime: { type: "string", description: "ISO string of end time" },
            addMeetLink: { type: "boolean", description: "Whether to auto-generate a video Meet link" },
          },
          required: ["summary", "startTime", "endTime"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "analyze_image_vision",
        description: "Extract text (OCR) or labels from an image URI (e.g. lab results).",
        parameters: {
          type: "object",
          properties: {
            imageUri: { type: "string", description: "GCS or public HTTP URI of the image" }
          },
          required: ["imageUri"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "analyze_text_nlp",
        description: "Analyze unstructured text to extract medical entities, symptoms, or standard methodology elements.",
        parameters: {
          type: "object",
          properties: {
            text: { type: "string", description: "Text to analyze" }
          },
          required: ["text"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "openclaw_message",
        description: "Send an urgent WhatsApp message to the Trustee via OpenClaw. Use this only for critical questions, approvals, or significant breakthroughs.",
        parameters: {
          type: "object",
          properties: {
            message: { type: "string", description: "The message to send" },
            priority: { type: "string", enum: ["urgent", "high", "normal", "low"], description: "The priority of the message" }
          },
          required: ["message", "priority"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "analyze_with_gemini",
        description: "Perform deep contextual analysis, massive text review, or complex reasoning using Google Gemini 1.5 Pro. Use this when the text is too large or requires deep secondary insights.",
        parameters: {
          type: "object",
          properties: {
            prompt: { type: "string", description: "The specific question or analysis task for Gemini" },
            context: { type: "string", description: "The background text or data for Gemini to analyze" }
          },
          required: ["prompt"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "search_knowledge_base",
        description: "Search the local knowledge base (PMA bylaws, medical protocols, training manuals, etc.) for factual grounding. Always use this instead of guessing internal facts.",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "The search query or topic to look for" },
            specificFile: { type: "string", description: "Optional specific file name to read (e.g., 'PMA_Bylaws.md')" }
          },
          required: ["query"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "search_agent_library",
        description: "Search your personal agent library of uploaded books, research papers, and documents. Use this to find specific information from literature uploaded to your library by the Trustee.",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "The search query or topic to look for in your library" }
          },
          required: ["query"]
        }
      }
    }
  ];

  let rawContent = "Document generation failed.";
  const MAX_ITERATIONS = 5;
  let iterations = 0;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    console.log(`[Agent Executor] Tool loop iteration ${iterations} for ${agentId}...`);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      tools: tools as any,
      tool_choice: "auto",
      max_completion_tokens: 4000,
      temperature: 0.7,
    });

    const responseMessage = completion.choices[0]?.message;

    if (!responseMessage) break;
    messages.push(responseMessage);

    if (responseMessage.tool_calls) {
      for (const rc of responseMessage.tool_calls) {
        const toolCall = rc as any;
        if (toolCall.function.name === 'analyze_with_gemini') {
          const args = JSON.parse(toolCall.function.arguments);
          console.log(`[Agent Executor] ${agentId} called analyze_with_gemini`);
          try {
            const { analyzeWithGemini } = await import('./gemini-provider');
            const result = await analyzeWithGemini(args.prompt, args.context);
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "analyze_with_gemini",
              content: JSON.stringify({ success: true, analysis: result })
            });
          } catch (e: any) {
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "analyze_with_gemini",
              content: JSON.stringify({ error: e.message })
            });
          }
        } else if (toolCall.function.name === 'search_drive') {
          const args = JSON.parse(toolCall.function.arguments);
          console.log(`[Agent Executor] ${agentId} called search_drive: ${args.query}`);
          try {
            const results = await searchDriveLibrary(args.query);
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "search_drive",
              content: JSON.stringify(results.slice(0, 5)) // Limit to top 5 hits
            });
          } catch (e: any) {
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "search_drive",
              content: JSON.stringify({ error: e.message })
            });
          }
        } else if (toolCall.function.name === 'unblock_task') {
          const args = JSON.parse(toolCall.function.arguments);
          console.log(`[Agent Executor] ${agentId} called unblock_task: ${args.taskId}`);
          try {
            await db.update(agentTasks).set({ status: 'pending', progress: 0 }).where(eq(agentTasks.id, args.taskId));
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "unblock_task",
              content: JSON.stringify({ success: true, message: `Task ${args.taskId} unblocked successfully.` })
            });
          } catch (e: any) {
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "unblock_task",
              content: JSON.stringify({ error: e.message })
            });
          }
        } else if (toolCall.function.name === 'read_presentation') {
          const args = JSON.parse(toolCall.function.arguments);
          console.log(`[Agent Executor] ${agentId} called read_presentation: ${args.presentationId}`);
          try {
            const text = await extractTextFromPresentation(args.presentationId);
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "read_presentation",
              content: JSON.stringify({ success: true, extractedText: text })
            });
          } catch (e: any) {
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "read_presentation",
              content: JSON.stringify({ error: e.message })
            });
          }
        } else if (toolCall.function.name === 'copy_and_enhance_presentation') {
          const args = JSON.parse(toolCall.function.arguments);
          console.log(`[Agent Executor] ${agentId} called copy_and_enhance_presentation on ${args.presentationId}`);
          try {
            const copyResult = await copyPresentation(args.presentationId, args.newTitle);
            await updatePresentation(copyResult.id, args.updates);
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "copy_and_enhance_presentation",
              content: JSON.stringify({ success: true, newPresentationId: copyResult.id, link: copyResult.webViewLink })
            });
          } catch (e: any) {
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "copy_and_enhance_presentation",
              content: JSON.stringify({ error: e.message })
            });
          }
        } else if (toolCall.function.name === 'read_sheet') {
          const args = JSON.parse(toolCall.function.arguments);
          console.log(`[Agent Executor] ${agentId} called read_sheet on ${args.spreadsheetId}`);
          try {
            const values = await readSheet(args.spreadsheetId, args.range);
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "read_sheet",
              content: JSON.stringify({ success: true, values })
            });
          } catch (e: any) {
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "read_sheet",
              content: JSON.stringify({ error: e.message })
            });
          }
        } else if (toolCall.function.name === 'append_sheet_row') {
          const args = JSON.parse(toolCall.function.arguments);
          console.log(`[Agent Executor] ${agentId} called append_sheet_row on ${args.spreadsheetId}`);
          try {
            const success = await appendSheetRow(args.spreadsheetId, args.range, args.values);
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "append_sheet_row",
              content: JSON.stringify({ success })
            });
          } catch (e: any) {
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "append_sheet_row",
              content: JSON.stringify({ error: e.message })
            });
          }
        } else if (toolCall.function.name === 'read_google_doc') {
          const args = JSON.parse(toolCall.function.arguments);
          console.log(`[Agent Executor] ${agentId} called read_google_doc on ${args.documentId}`);
          try {
            const text = await readDocument(args.documentId);
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "read_google_doc",
              content: JSON.stringify({ success: true, extractedText: text })
            });
          } catch (e: any) {
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "read_google_doc",
              content: JSON.stringify({ error: e.message })
            });
          }
        } else if (toolCall.function.name === 'append_google_doc') {
          const args = JSON.parse(toolCall.function.arguments);
          console.log(`[Agent Executor] ${agentId} called append_google_doc on ${args.documentId}`);
          try {
            const success = await appendDocumentText(args.documentId, args.text);
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "append_google_doc",
              content: JSON.stringify({ success })
            });
          } catch (e: any) {
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "append_google_doc",
              content: JSON.stringify({ error: e.message })
            });
          }
        } else if (toolCall.function.name === 'create_calendar_event') {
          const args = JSON.parse(toolCall.function.arguments);
          console.log(`[Agent Executor] ${agentId} called create_calendar_event on ${args.summary}`);
          try {
            const result = await createCalendarEvent(args);
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "create_calendar_event",
              content: JSON.stringify(result)
            });
          } catch (e: any) {
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "create_calendar_event",
              content: JSON.stringify({ error: e.message })
            });
          }
        } else if (toolCall.function.name === 'analyze_image_vision') {
          const args = JSON.parse(toolCall.function.arguments);
          console.log(`[Agent Executor] ${agentId} called analyze_image_vision`);
          try {
            const result = await analyzeImageWithVision(args.imageUri);
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "analyze_image_vision",
              content: JSON.stringify({ success: true, result })
            });
          } catch (e: any) {
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "analyze_image_vision",
              content: JSON.stringify({ error: e.message })
            });
          }
        } else if (toolCall.function.name === 'analyze_text_nlp') {
          const args = JSON.parse(toolCall.function.arguments);
          console.log(`[Agent Executor] ${agentId} called analyze_text_nlp`);
          try {
            const result = await analyzeTextEntities(args.text);
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "analyze_text_nlp",
              content: JSON.stringify({ success: true, entities: result })
            });
          } catch (e: any) {
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "analyze_text_nlp",
              content: JSON.stringify({ error: e.message })
            });
          }
        } else if (toolCall.function.name === 'openclaw_message') {
          const args = JSON.parse(toolCall.function.arguments);
          console.log(`[Agent Executor] ${agentId} called openclaw_message`);
          try {
            await sendToTrustee(agentId, args.message, args.priority || 'normal');
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "openclaw_message",
              content: JSON.stringify({ success: true, delivered: true })
            });
          } catch (e: any) {
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "openclaw_message",
              content: JSON.stringify({ error: e.message })
            });
          }
        } else if (toolCall.function.name === 'search_knowledge_base') {
          const args = JSON.parse(toolCall.function.arguments);
          console.log(`[Agent Executor] ${agentId} called search_knowledge_base for "${args.query}"`);
          try {
            const kbResult = await searchKnowledgeBase(args.query, args.specificFile);
            let libraryAddendum = '';
            try {
              const libResult = await searchAgentLibrary(agentId, args.query, 5);
              if (!libResult.includes('No results found') && !libResult.includes('No valid search')) {
                libraryAddendum = '\n\n--- Agent Library Results ---\n' + libResult;
              }
            } catch { /* library search is supplementary */ }
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "search_knowledge_base",
              content: JSON.stringify({ result: kbResult + libraryAddendum })
            });
          } catch (e: any) {
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "search_knowledge_base",
              content: JSON.stringify({ error: e.message })
            });
          }
        } else if (toolCall.function.name === 'search_agent_library') {
          const args = JSON.parse(toolCall.function.arguments);
          console.log(`[Agent Executor] ${agentId} called search_agent_library for "${args.query}"`);
          try {
            const libraryResult = await searchAgentLibrary(agentId, args.query);
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "search_agent_library",
              content: JSON.stringify({ result: libraryResult })
            });
          } catch (e: any) {
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "search_agent_library",
              content: JSON.stringify({ error: e.message })
            });
          }
        }
      }
    } else if (responseMessage.content) {
      // Model provided actual content, we're done
      rawContent = responseMessage.content;
      break;
    }
  }

  // Apply spell-check before returning
  const correctedContent = spellCheckContent(rawContent);
  console.log(`[Agent Executor] Spell-check applied to document`);

  return correctedContent;
}

function enforceSwimLanes(agentId: string, division: string, task: any) {
  const isMarketing = division.toLowerCase() === 'marketing';
  const isScience = division.toLowerCase() === 'science';
  const taskText = ((task.title || '') + ' ' + (task.description || '')).toLowerCase();

  if (isMarketing && (taskText.includes('.ts') || taskText.includes('.tsx') || taskText.includes('database') || taskText.includes('schema'))) {
    throw new Error(`[SECURITY] Swim Lane Violation: Marketing agents cannot modify core codebase or database schemas.`);
  }
  if (isScience && (taskText.includes('server/') || taskText.includes('client/'))) {
    throw new Error(`[SECURITY] Swim Lane Violation: Science Division cannot modify application codebase.`);
  }
}

export async function executeAgentTask(taskId: string): Promise<TaskExecutionResult> {
  console.log(`[Agent Executor] Starting task: ${taskId}`);

  const tasks = await storage.getAllAgentTasks();
  const task = tasks.find(t => t.id === taskId);

  if (!task) {
    return { success: false, error: 'Task not found' };
  }

  const agentId = task.agentId;
  const division = task.division;

  console.log(`[Agent Executor] Task: ${task.title} | Agent: ${agentId} | Division: ${division}`);

  try {
    enforceSwimLanes(agentId, division, task);
  } catch (error: any) {
    console.error(`[Agent Executor] ${error.message}`);
    await storage.updateAgentTask(taskId, { status: 'blocked', progress: 0 });
    return { success: false, error: error.message };
  }

  await storage.updateAgentTask(taskId, { status: 'in_progress', progress: 10 });

  try {
    const folderId = await getOrCreateAgentFolder(agentId);
    if (!folderId) {
      throw new Error('Could not get/create agent folder in Drive');
    }

    const upperAgentId = agentId.toUpperCase();

    if (upperAgentId === 'CANVA' || upperAgentId === 'PIXEL') {
      console.log(`[Agent Executor] Launching Canva automation for ${agentId}...`);

      await storage.updateAgentTask(taskId, { progress: 20 });

      console.log(`[Agent Executor] Step 1: Using OpenAI tools to compile Canva context...`);
      // We run the document generation logic to let the agent use tools (Drive, Docs, Sheets) 
      // to gather the required context before we send the instructions to the browser.
      const compiledInstructions = await generateDocument(
        `PREPARE CANVA PROMPT: ${task.title}`,
        `You are preparing instructions for a browser automation agent to execute in Canva. 
        TASK: ${task.description || task.title}. 
        Please use your tools to search Google Drive, read necessary brand guidelines or documents, 
        and then output a highly detailed, step-by-step instruction manual for the browser agent to follow.`,
        agentId,
        division
      );

      await storage.updateAgentTask(taskId, { progress: 40 });

      console.log(`[Agent Executor] Step 2: Executing enriched prompt in Canva browser...`);
      const result = await canvaAgent.executeCanvaTask(compiledInstructions);

      if (!result.success) {
        throw new Error(result.error || 'Canva browser execution failed');
      }

      await storage.updateAgentTask(taskId, { progress: 90 });

      console.log(`[Agent Executor] Canva generated URL: ${result.outputUrl}`);

      const crossDivisionPrefix = getCrossDivisionFilePrefix(task);
      const fileName = `${crossDivisionPrefix}CANVA_Link_${Date.now()}`;
      const docContent = `Canva Automation Output\n\nTask: ${task.title}\n\nDescription: ${task.description || ''}\n\nCanva Share URL: ${result.outputUrl}\n\nAgent: ${agentId}`;
      const uploadResult = await uploadTextDocument(folderId, fileName, docContent, 'text/plain');

      if (!uploadResult) {
        console.warn('[Agent Executor] Failed to upload Canva link document to Drive, proceeding with URL only');
      } else {
        console.log(`[Agent Executor] Uploaded Canva link to Drive: ${uploadResult.webViewLink}`);
      }

      await storage.updateAgentTask(taskId, {
        status: 'in_progress',
        progress: 100,
        outputUrl: result.outputUrl,
        outputDriveFileId: uploadResult?.id,
      });

      return {
        success: true,
        outputUrl: result.outputUrl,
      };
    } else if (upperAgentId === 'DR-TRIAGE' && isLabOrderTask(task)) {
      console.log(`[Agent Executor] Launching Rupa Health lab ordering for ${agentId}...`);
      await storage.updateAgentTask(taskId, { progress: 20 });

      const status = rupaHealthAgent.getStatus();
      if (!status.available) {
        throw new Error(`Rupa Health not configured: ${status.error || 'credentials missing'}. Cannot execute lab ordering.`);
      }

      const nameParts = (task.title || 'Patient Unknown').split(' ');
      const firstName = nameParts[0] || 'Patient';
      const lastName = nameParts.slice(1).join(' ') || 'Unknown';

      const labResult = await rupaHealthAgent.placeOrder(
        { firstName, lastName, email: '' },
        [task.description || task.title],
        true
      );

      if (!labResult.success) {
        throw new Error(labResult.error || 'Rupa Health lab ordering failed');
      }

      await storage.updateAgentTask(taskId, { progress: 90 });

      const crossDivisionPrefix = getCrossDivisionFilePrefix(task);
      const fileName = `${crossDivisionPrefix}RUPA_Lab_Order_${Date.now()}`;
      const docContent = `Rupa Health Lab Order\n\nTask: ${task.title}\n\nDescription: ${task.description || ''}\n\nResult URL: ${labResult.resultUrl || 'N/A'}\n\nMessage: ${labResult.message || ''}\n\nAgent: ${agentId}`;
      const uploadResult = await uploadTextDocument(folderId, fileName, docContent, 'text/plain');

      if (!uploadResult) {
        console.warn('[Agent Executor] Failed to upload Rupa lab order to Drive');
      }

      await storage.updateAgentTask(taskId, {
        status: 'in_progress',
        progress: 100,
        outputUrl: labResult.resultUrl,
        outputDriveFileId: uploadResult?.id,
      });

      return {
        success: true,
        outputUrl: labResult.resultUrl,
      };
    } else if (IMAGE_AGENTS.includes(agentId)) {
        const provider = getAgentProvider(agentId);
        console.log(`[Agent Executor] Generating image for ${agentId} (provider: ${provider})...`);
  
        await storage.updateAgentTask(taskId, { progress: 30 });
  
        const prompt = generateImagePrompt(task.title, task.description || '', agentId);
        console.log(`[Agent Executor] Prompt: ${prompt.substring(0, 100)}...`);
  
        let imageBuffer: Buffer;
  
        if (provider === 'huggingface') {
          try {
            console.log(`[Agent Executor] Using HuggingFace for image generation...`);
            const hfResult = await hfGenerateImage({ prompt, style: 'healing' });
            const arrayBuffer = await hfResult.imageBlob.arrayBuffer();
            imageBuffer = Buffer.from(arrayBuffer);
            console.log(`[Agent Executor] HuggingFace image generated (${hfResult.modelUsed}), size: ${imageBuffer.length} bytes`);
          } catch (hfError: any) {
            console.warn(`[Agent Executor] HuggingFace failed for ${agentId}: ${hfError.message}. Falling back to OpenAI DALL-E...`);
            try {
              imageBuffer = await generateImageBuffer(prompt, '1024x1024');
              console.log(`[Agent Executor] OpenAI DALL-E fallback succeeded, size: ${imageBuffer.length} bytes`);
            } catch (openaiError: any) {
              console.error(`[Agent Executor] All image providers failed for ${agentId}`);
              throw openaiError;
            }
          }
        } else {
          try {
            imageBuffer = await generateImageBuffer(prompt, '1024x1024');
            console.log(`[Agent Executor] OpenAI image generated, size: ${imageBuffer.length} bytes`);
          } catch (openaiError: any) {
            console.warn(`[Agent Executor] OpenAI DALL-E failed for ${agentId}: ${openaiError.message}. Trying HuggingFace...`);
            try {
              const hfResult = await hfGenerateImage({ prompt, style: 'healing' });
              const arrayBuffer = await hfResult.imageBlob.arrayBuffer();
              imageBuffer = Buffer.from(arrayBuffer);
            } catch (hfError: any) {
              console.error(`[Agent Executor] All image providers failed for ${agentId}`);
              throw openaiError;
            }
          }
        }
  
        await storage.updateAgentTask(taskId, { progress: 60 });
  
        const crossDivisionPrefix = getCrossDivisionFilePrefix(task);
        const fileName = `${crossDivisionPrefix}${task.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.png`;
        const uploadResult = await uploadImageToDrive(imageBuffer, fileName, folderId);
  
        if (!uploadResult) {
          throw new Error('Failed to upload image to Drive');
        }
  
        console.log(`[Agent Executor] Uploaded to Drive: ${uploadResult.webViewLink}`);
  
        await storage.updateAgentTask(taskId, {
          status: 'completed',
          progress: 100,
          outputUrl: uploadResult.webViewLink,
          outputDriveFileId: uploadResult.id,
          completedAt: new Date(),
        });
  
        await sentinel.notifyTaskCompleted(agentId, division, task.title, uploadResult.webViewLink, taskId);
  
        return {
          success: true,
          outputUrl: uploadResult.webViewLink,
          driveFileId: uploadResult.id,
        };
      }
  
      // Default to Document Generation for all non-image agents
    console.log(`[Agent Executor] Generating document for ${agentId} (Default Fallback)...`);

    await storage.updateAgentTask(taskId, { progress: 30 });

    const documentContent = await generateDocument(task.title, task.description || '', agentId, division);
    console.log(`[Agent Executor] Document generated, length: ${documentContent.length} chars`);

    await storage.updateAgentTask(taskId, { progress: 60 });

    const crossDivisionPrefix = getCrossDivisionFilePrefix(task);
    const fileName = `${crossDivisionPrefix}${task.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;

    let uploadResult;
    const isSlidesRequested = agentId.toLowerCase() === 'dr-formula' || task.title.toLowerCase().includes('presentation') || task.title.toLowerCase().includes('slides') || (task.description || '').toLowerCase().includes('presentation');

    if (isSlidesRequested) {
      console.log(`[Agent Executor] Routing output as Google Slides format via uploadPresentation`);
      uploadResult = await uploadPresentation(folderId, fileName, documentContent, 'text/plain');
    } else {
      uploadResult = await uploadTextDocument(folderId, fileName, documentContent, 'text/plain');
    }

    if (!uploadResult) {
      throw new Error('Failed to upload document to Drive');
    }

    console.log(`[Agent Executor] Uploaded to Drive: ${uploadResult.webViewLink}`);

    await storage.updateAgentTask(taskId, {
      status: 'in_progress',
      progress: 100,
      outputUrl: uploadResult.webViewLink,
      outputDriveFileId: uploadResult.id,
    });

    return {
      success: true,
      outputUrl: uploadResult.webViewLink,
      driveFileId: uploadResult.id,
    };

  } catch (error: any) {
    console.error(`[Agent Executor] Error executing task ${taskId}:`, error);

    const currentRetry = task.retryCount || 0;
    const nextRetryCount = currentRetry + 1;
    const maxRetries = 3;

    if (nextRetryCount >= maxRetries) {
      console.error(`[Agent Executor] Task ${taskId} failed heavily (${maxRetries} times). Attempting Auto-Recovery Route.`);

      // Attempt auto-recovery fallback to Sentinel or a specific Division Lead
      const isCritical = task.priority === 1;
      let fallbackAgent = 'sentinel';

      if (task.division === 'engineering') fallbackAgent = 'lead-engineer';
      if (task.division === 'science') fallbackAgent = 'PROMETHEUS';
      if (task.division === 'legal') fallbackAgent = 'legal-lead';

      // If it's already running on the fallback agent, then move it to the DLQ explicitly.
      if (task.agentId.toLowerCase() === fallbackAgent) {
        console.error(`[Agent Executor] Task ${taskId} failed heavily on Fallback Agent ${fallbackAgent}. Moving to Dead Letter Queue permanently.`);
        await storage.updateAgentTask(taskId, {
          status: 'failed',
          progress: 0,
          retryCount: nextRetryCount,
          errorLog: error.message || String(error)
        });

        // Notify Admin / Trustee
        if ('createNotification' in sentinel && typeof (sentinel as any).createNotification === 'function') {
          await (sentinel as any).createNotification(
            'system',
            'System Operator',
            `CRITICAL: Agent Task Failed! ${task.agentId} could not complete "${task.title}". Moved to Dead Letter Queue.`
          );
        }
      } else {
        console.warn(`[Agent Executor] Routing failed task ${taskId} from ${task.agentId} to Fallback: ${fallbackAgent}`);
        // Re-assign explicitly to the fallback agent, reset retries
        await storage.updateAgentTask(taskId, {
          status: 'pending',
          progress: 0,
          retryCount: 0,
          agentId: fallbackAgent,
          errorLog: `Auto-Recovered from ${task.agentId}. Original error: ${error.message || String(error)}`
        });

        if ('createNotification' in sentinel && typeof (sentinel as any).createNotification === 'function') {
          await (sentinel as any).createNotification(
            'system',
            'System Operator',
            `Task Auto-Recovered: "${task.title}" stalled on ${task.agentId} and was re-assigned to ${fallbackAgent}.`
          );
        }
      }

    } else {
      console.warn(`[Agent Executor] Task ${taskId} failed. Attempt ${nextRetryCount}/${maxRetries}. Will retry.`);
      await storage.updateAgentTask(taskId, {
        status: 'pending',
        progress: 0,
        retryCount: nextRetryCount,
        errorLog: `Attempt ${nextRetryCount} failed: ${error.message || String(error)}`
      });
    }

    return { success: false, error: error.message || 'Unknown error' };
  }
}

export async function executePendingTasks(limit: number = 5): Promise<{ executed: number; results: TaskExecutionResult[] }> {
  const allTasks = await storage.getAllAgentTasks();
  const pendingTasks = allTasks.filter(t =>
    t.status === 'pending' || (t.status === 'in_progress' && (t.progress ?? 0) < 100)
  );

  const tasksToExecute = pendingTasks.slice(0, limit);
  const results: TaskExecutionResult[] = [];

  for (const task of tasksToExecute) {
    const result = await executeAgentTask(task.id);
    results.push(result);

    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return { executed: results.length, results };
}

export async function getAgentTaskStatus(): Promise<{
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  withOutput: number;
}> {
  const tasks = await storage.getAllAgentTasks();

  return {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    withOutput: tasks.filter(t => t.outputUrl || t.outputDriveFileId).length,
  };
}
