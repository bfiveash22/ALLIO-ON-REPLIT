// Removed Replit Image Generator
import { findAllioFolder, createSubfolder, findFolderByName, getUncachableGoogleDriveClient, uploadTextDocument, uploadPresentation, searchDriveLibrary } from './drive';
import { searchAllKnowledge } from './knowledge-base';
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
import { db } from '../db';
import { agentTasks, memberProfiles } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { notificationService } from './notification-service';
import { sendToTrustee } from './openclaw';
  import { claudeGenerateDocument, claudeAgentChat, shouldUseClaude } from './claude-provider';
import { AGENT_MODEL_ASSIGNMENTS } from './sentinel-orchestrator';
  import { analyzeWithGemini, GEMINI_TOOLS_DEFINITIONS, handleGeminiToolCall, isGeminiAvailable } from './gemini-provider';
import { NOTEBOOKLM_TOOLS_DEFINITIONS, handleNotebookLMToolCall, isNotebookLMAvailable } from './notebooklm-provider';
import { mcpClientManager, getMcpToolsAsOpenAIFormat } from './mcp-client-manager';
import { buildDivisionToolSet } from './agent-tool-dispatcher';
import { callWithTools } from './ai-fallback';
import { generateImage as hfGenerateImage } from './huggingface-media';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

async function notifyTrustees(title: string, message: string, metadata?: Record<string, unknown>): Promise<void> {
  try {
    const admins = await db.select({ userId: memberProfiles.userId })
      .from(memberProfiles)
      .where(eq(memberProfiles.role, 'admin'));
    for (const admin of admins) {
      await notificationService.createForUser(admin.userId, 'agent_task_completed', title, message, metadata).catch(() => {});
    }
  } catch {
  }
}
  
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

*SYSTEM UPGRADE: You now possess dual-engine ML capabilities. Your core reasoning is powered by OpenAI GPT-4o. You ALSO have direct access to Google Gemini 2.5 Flash via your toolset for processing massive context windows, deep multimodal analysis, research synthesis, code review, and content transformation. Use the gemini_deep_analysis, gemini_summarize, gemini_research, gemini_code_review, and gemini_transform tools for Gemini-powered capabilities. The Google Gemini CLI (v0.34.0) is installed globally and available for advanced agentic workflows.*

*NOTEBOOKLM INTEGRATION: You have access to NotebookLM-style source-grounded analysis tools powered by Gemini. These tools automatically gather sources from the FFPMA knowledge base, Google Drive, and research APIs, then produce source-cited outputs. Available tools: notebook_source_query (source-grounded Q&A), notebook_study_guide (comprehensive study guides), notebook_briefing_doc (professional briefing documents), notebook_multi_doc_synthesis (multi-document pattern analysis), notebook_audio_script (podcast-style audio overview scripts). Always prefer these tools when you need evidence-based, source-cited analysis.*

*UNIFIED KNOWLEDGE SEARCH: You have the 'search_all_knowledge' tool which searches ALL knowledge sources at once — local knowledge base files, compound interaction data, the library database (articles, protocols, training content), Drive documents, and your agent-specific library folders. Results are ranked by relevance with source attribution. You MUST use this tool before answering questions or generating documents that require internal factual accuracy. Never hallucinate facts when a document exists.*

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

CONSTITUTIONAL LAW FOUNDATIONS:
- 1st Amendment: Freedom of association protects PMA membership and private communications (NAACP v. Alabama, 1958; Roberts v. Jaycees, 1984; Boy Scouts v. Dale, 2000)
- 14th Amendment: Due process protects private member agreements from state interference (Meyer v. Nebraska, 1923; Griswold v. Connecticut, 1965)
- 9th Amendment: Right to choose healthcare approach is an unenumerated right retained by the people
- 10th Amendment: Regulatory agencies derive authority from Commerce Clause — PMAs outside interstate commerce are beyond their reach
- Private member-to-member communications are constitutionally shielded from regulatory overreach
- All legal documents filed under: Legal Compliance/{Constitutional Law, Case Law, Reference Materials, PMA Formation Documents}
- Member contracts filed under: Member Contracts/{MemberName}/

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
- OPENCLAW: You have a direct line to the Trustee. You can use your 'openclaw_message' tool to send Telegram messages directly to the Trustee for urgent input, critical questions, or major breakthroughs.


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

  async function generateDocument(taskTitle: string, taskDescription: string, agentId: string, division: string): Promise<{ content: string; toolCallLog: any[]; iterations: number }> {
    const { callWithFallback, isTerminalFailure } = await import('./ai-fallback');
    const profile = getAgentProfile(agentId);
    const modelConfig = AGENT_MODEL_ASSIGNMENTS[agentId.toUpperCase()];
    const provider = getAgentProvider(agentId);
    console.log(`[Agent Executor] Provider routing via centralized fallback: ${agentId} → preferred ${provider} (${modelConfig?.model || 'default'})`);

    let researchContext = '';
    if (provider === 'research') {
      const RESEARCH_AGENT_SOURCES: Record<string, ('openalex' | 'pubmed' | 'semantic_scholar' | 'arxiv')[]> = {
        'HIPPOCRATES': ['pubmed'],
        'PARACELSUS': ['openalex', 'pubmed'],
        'ORACLE': ['semantic_scholar'],
        'HELIX': ['openalex'],
      };
      const agentSources = RESEARCH_AGENT_SOURCES[agentId.toUpperCase()];
      try {
        const research = await searchAllSources({ query: taskTitle, limit: 5, sources: agentSources });
        if (research.success && research.papers.length > 0) {
          researchContext = '\n\nRESEARCH CONTEXT:\n' + research.papers.map((p: any, i: number) =>
            `[${i + 1}] ${p.title}\n${p.abstract || p.tldr || ''}`
          ).join('\n\n');
        }
      } catch (researchError: any) {
        console.warn(`[Agent Executor] Research API fetch failed: ${researchError.message}`);
      }
    }

    if (division.toLowerCase() === 'quantum' || division.toLowerCase() === 'science') {
      try {
        const research = await searchAllSources({ query: taskTitle, limit: 3 });
        if (research.success && research.papers.length > 0) {
          researchContext += '\n\nSCIENTIFIC RESEARCH CONTEXT:\n' + research.papers.map((p: any, i: number) =>
            `[${i + 1}] Title: ${p.title}\nAuthors: ${p.authors.join(', ')}\nAbstract/Summary: ${p.abstract || p.tldr || 'N/A'}`
          ).join('\n\n');
        }
      } catch (e) {
        console.error('[Agent Executor] Failed to fetch research APIs for context injection:', e);
      }
    }

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
`;
    }

    if (profile?.division === 'legal') {
      agentContext += `
LEGAL DIVISION RESOURCE MANIFEST:
You have access to the following legal resources and must reference them in your work:

1. CONSTITUTIONAL LAW FRAMEWORK (getConstitutionalLawFramework):
   - 1st Amendment: Freedom of association (NAACP v. Alabama 1958, Roberts v. Jaycees 1984, Boy Scouts v. Dale 2000)
   - 14th Amendment: Due process protection (Meyer v. Nebraska 1923, Griswold v. Connecticut 1965)
   - 9th Amendment: Unenumerated rights (healthcare choice)
   - 10th Amendment: Reserved powers (Commerce Clause limits)
   - Regulatory jurisdiction analysis (FDA, FTC, State Medical Boards)

2. PMA LEGAL DOCUMENTS (via getAllLegalDocuments):
   - PMA Member Agreement (pma-agreement)
   - Privacy Policy (privacy-policy)
   - Terms of Service (terms-of-service)
   - Doctor Onboarding Contract (doctor-onboarding-contract)
   - Trademark Application (trademark-application)
   - Declaration of Intent to Use (declaration-of-intent-to-use)
   - Master Copyright Assignment (master-copyright-assignment)
   - Private Domain IP Policy (private-domain-ip-policy)
   - Member IP Acknowledgment (member-ip-acknowledgment)
   - Copyright Registration Cover Sheet (copyright-registration-cover-sheet)
   - Power of Attorney (power-of-attorney)
   - Specimens of Use Package (specimens-of-use-package)

3. DRIVE FOLDER STRUCTURE (managed by HERMES):
   - ALLIO/Legal Compliance/Constitutional Law/ — constitutional framework docs
   - ALLIO/Legal Compliance/Case Law/ — court decisions
   - ALLIO/Legal Compliance/Reference Materials/ — general legal guides
   - ALLIO/Legal Compliance/PMA Formation Documents/ — formation checklist, articles
   - ALLIO/Member Contracts/{MemberName}/ — per-member agreement files (Kathryn Smith, Annette Gomer, John D., Margaret R.)

4. LOCAL LEGAL DOCS (artifacts/api-server/docs/legal/):
   - allio-ip-protection-requirements.md
   - allio-patent-disclosure-form.md
   - allio-trademark-application-form.md

When generating legal documents, ALWAYS cross-reference the constitutional framework and cite relevant case law.
When filing documents, ALWAYS use the correct Drive folder path from the structure above.
`;
    }

    const systemPrompt = `${FFPMA_MISSION_TRAINING}\n\n${agentContext}${researchContext}\n\nYou are ${profile?.name || agentId.toUpperCase()}, ${profile?.title || 'an AI agent'} at Forgotten Formula PMA.\n\nYOUR DIVISION: ${division.toUpperCase()}\nYOUR PURPOSE: Create outputs that advance the healing mission and serve members.`;

    const userPrompt = `Generate a complete, professional document for the following task:\n\nTASK TITLE: ${taskTitle}\n\nTASK DESCRIPTION: ${taskDescription}\n\nDIVISION: ${division}\n\nRequirements:\n- Create a comprehensive, well-structured document\n- Include relevant sections, headers, and content\n- Be thorough and professional\n- Make it actionable and useful for the organization\n- Reflect the FFPMA mission: healing over profits, nature over synthetic\n- Include specific details relevant to healthcare, healing, and the PMA's mission\n- Format with clear sections using markdown\n- End with how this contributes to our mission of true healing\n\nGenerate the full document now:`;

    const preferredProviderName = provider === 'research' ? 'claude' : provider;
    const toolPreferredProvider = ['abacus', 'openai'].includes(preferredProviderName) ? preferredProviderName : 'abacus';

    const { tools, dispatcher } = buildDivisionToolSet(division, agentId);

    console.log(`[Agent Executor] Agentic loop starting for ${agentId} (${division}) with ${tools.length} tools (tool provider: ${toolPreferredProvider})`);

    try {
      const agenticResult = await callWithTools(
        [{ role: 'user', content: userPrompt }],
        tools,
        dispatcher,
        {
          systemPrompt,
          maxTokens: 8192,
          maxIterations: 10,
          preferredProvider: toolPreferredProvider,
        }
      );

      console.log(`[Agent Executor] Agentic loop complete for ${agentId}: ${agenticResult.iterations} iteration(s), ${agenticResult.toolCallLog.length} tool calls, ~${agenticResult.totalTokensEstimate} tokens`);

      if (agenticResult.toolCallLog.length > 0) {
        const toolSummary = agenticResult.toolCallLog.map(tc =>
          `${tc.toolName}(${tc.argsSummary.substring(0, 40)}) → ${tc.resultLength}chars [${tc.latencyMs}ms]`
        ).join('; ');
        console.log(`[Agent Executor] Tools used: ${toolSummary}`);
      }

      return {
        content: spellCheckContent(agenticResult.response),
        toolCallLog: agenticResult.toolCallLog,
        iterations: agenticResult.iterations,
      };

    } catch (agenticErr: any) {
      console.warn(`[Agent Executor] Agentic loop failed for ${agentId}, falling back to standard generation: ${agenticErr.message}`);

      try {
        const result = await callWithFallback(userPrompt, {
          systemPrompt,
          preferredProvider: preferredProviderName === 'huggingface' ? 'openai' : preferredProviderName,
          preferredModel: modelConfig?.model,
          callType: 'document-generation',
          maxTokens: 8192,
          maxRetries: 1,
          startTier: 'economy',
        });
        console.log(`[Agent Executor] Fallback document generated via ${result.provider}/${result.model}`);
        return {
          content: spellCheckContent(result.response),
          toolCallLog: [],
          iterations: 1,
        };
      } catch (err: any) {
        if (isTerminalFailure(err)) {
          console.error(`[Agent Executor] Terminal failure for ${agentId}: ${err.message}`);
          throw new Error(err.userMessage);
        }
        throw err;
      }
    }
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

    if (upperAgentId === 'CANVA' || upperAgentId === 'PIXEL' || upperAgentId === 'PEXEL') {
      console.log(`[Agent Executor] Launching Canva automation for ${agentId}...`);

      await storage.updateAgentTask(taskId, { progress: 20 });

      console.log(`[Agent Executor] Step 1: Using OpenAI tools to compile Canva context...`);
      // We run the document generation logic to let the agent use tools (Drive, Docs, Sheets) 
      // to gather the required context before we send the instructions to the browser.
      const compiledInstructionsResult = await generateDocument(
        `PREPARE CANVA PROMPT: ${task.title}`,
        `You are preparing instructions for a browser automation agent to execute in Canva. 
        TASK: ${task.description || task.title}. 
        Please use your tools to search Google Drive, read necessary brand guidelines or documents, 
        and then output a highly detailed, step-by-step instruction manual for the browser agent to follow.`,
        agentId,
        division
      );
      const compiledInstructions = compiledInstructionsResult.content;

      await storage.updateAgentTask(taskId, {
        progress: 40,
        toolCalls: compiledInstructionsResult.toolCallLog.length > 0 ? JSON.stringify(compiledInstructionsResult.toolCallLog) : null,
        agenticIterations: compiledInstructionsResult.iterations,
      });

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
        status: 'completed',
        progress: 100,
        outputUrl: result.outputUrl,
        outputDriveFileId: uploadResult?.id,
      });

      return {
        success: true,
        outputUrl: result.outputUrl,
      };
    } else if (upperAgentId === 'DR-TRIAGE' && isLabOrderTask(task)) {
      console.log(`[Agent Executor] Routing Rupa Health lab order for ${agentId} (HITL primary)...`);
      await storage.updateAgentTask(taskId, { progress: 20 });

      const nameParts = (task.title || 'Patient Unknown').split(' ');
      const firstName = nameParts[0] || 'Patient';
      const lastName = nameParts.slice(1).join(' ') || 'Unknown';

      const labResult = await rupaHealthAgent.placeOrder(
        { firstName, lastName, email: '' },
        [task.description || task.title],
        true
      );

      if (!labResult.success) {
        console.error(`[Agent Executor] Lab order routing failed: ${labResult.error || 'unknown'}`);
        await storage.updateAgentTask(taskId, {
          status: 'failed',
          progress: 100,
          errorLog: labResult.error || 'Lab order routing failed',
        });
        return {
          success: false,
          error: labResult.error || 'Lab order routing failed',
        };
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
        status: 'completed',
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
        notifyTrustees(`Agent Task Completed: ${agentId}`, `${task.title} has been completed by the ${division} division.`, { taskId, outputUrl: uploadResult.webViewLink });
  
        return {
          success: true,
          outputUrl: uploadResult.webViewLink,
          driveFileId: uploadResult.id,
        };
      }
  
      // Default to Document Generation for all non-image agents (agentic loop)
    console.log(`[Agent Executor] Starting agentic document generation for ${agentId} (${division})...`);

    await storage.updateAgentTask(taskId, { progress: 30 });

    const trackedResult = await generateDocument(task.title, task.description || '', agentId, division);
    const documentContent = trackedResult.content;
    console.log(`[Agent Executor] Document generated, length: ${documentContent.length} chars, ${trackedResult.iterations} iterations, ${trackedResult.toolCallLog.length} tool calls`);

    await storage.updateAgentTask(taskId, {
      progress: 60,
      toolCalls: trackedResult.toolCallLog.length > 0 ? JSON.stringify(trackedResult.toolCallLog) : null,
      agenticIterations: trackedResult.iterations,
    });

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
