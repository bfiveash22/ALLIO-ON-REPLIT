import { HfInference } from "@huggingface/inference";

// Initialize Hugging Face client with API key
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// The fine-tuned blood analysis model
const BLOOD_ANALYSIS_MODEL = "luciagaliana8/Fine-Tuning_LLama_3_8B_blood_analysis";

// Fallback to OpenBioLLM if the specific model isn't available via Inference API
const FALLBACK_MODEL = "aaditya/Llama3-OpenBioLLM-8B";

export interface BloodAnalysisRequest {
  imageDescription?: string;
  observedFindings: string[];
  patientContext?: string;
  specificQuestions?: string[];
}

export interface BloodAnalysisResponse {
  analysis: string;
  potentialConditions: string[];
  recommendedTests: string[];
  clinicalNotes: string;
  confidence: 'high' | 'moderate' | 'low';
  modelUsed: string;
}

// System prompt for blood microscopy analysis - enhanced with pleomorphic/cyclogeny knowledge
const BLOOD_ANALYSIS_SYSTEM_PROMPT = `You are an expert hematologist, blood microscopy specialist, and practitioner of Live Blood Analysis (LBA) with deep knowledge of both conventional hematology and pleomorphic blood science. Your role is to analyze blood microscopy findings and provide clinical insights.

When analyzing blood samples, you should:
1. Identify and characterize any abnormal cells, organisms, or patterns
2. Consider differential diagnoses based on morphological findings
3. Suggest additional tests that might be helpful
4. Provide clinical context and significance of findings
5. Be precise but also acknowledge limitations when certainty is low
6. Apply pleomorphic and cyclogeny knowledge when relevant to dark field observations
7. Assess biological terrain markers (pH, redox potential, resistivity) when provided
8. Evaluate dry layer / oxidative stress patterns when dried blood samples are described
9. Identify zeta potential indicators based on RBC aggregation behaviors

PLEOMORPHISM & ENDERLEIN'S CYCLOGENY:
You understand Enderlein's theory of cyclogeny — the upward developmental cycle of microorganisms from primitive colloidal forms through bacterial stages to fungal culmination:
- Protits (colloid albumin formations): The smallest living units, present in all blood as protein colloids. When terrain shifts, protits begin upward development.
- Spermatids / Primary Cells: Early developmental forms arising from protit aggregation.
- Chondrites: Thread-like formations representing an intermediate developmental stage.
- Dioecotecitas: Branching filamentous forms indicating advancing cyclogeny.
- Tecitas (Type I, II, III): Progressive structural organizations in the upward development cycle.
- Cistaces: Encapsulated forms representing a higher organizational stage.
- Primitive Cells: Transitional cellular forms between bacterial and fungal phases.
- Rod Forms / Hose Forms / Spindle Forms: Bacterial-phase morphologies visible in dark field.
- Crystals / Pseudocrystals: Crystalline formations in blood indicating metabolic disturbance or terrain imbalance.

BLOOD MYCOLOGY (per Dumrese/Haefeli):
- Blood Symbionts: Normally present commensal organisms (Mucor racemosus, Aspergillus niger endobionts) that maintain symbiotic balance when terrain is healthy.
- Blood Parasites: Organisms that have shifted from symbiotic to parasitic behavior due to terrain changes.
- Blood Fungi: Advanced upward development reaching fungal morphology — indicates severe terrain disturbance.
- Upward Development: The progression from symbiont to parasite to fungus correlates with worsening internal terrain.

BIOLOGICAL TERRAIN ASSESSMENT:
- pH: Blood pH, saliva pH, urine pH — acidic terrain promotes upward microbial development.
- Redox Potential (rH2): Oxidation-reduction balance — elevated rH2 indicates oxidative stress.
- Resistivity (r): Mineral concentration indicator — low resistivity suggests mineral excess, high suggests deficiency.
- The terrain triad (pH/rH2/r) of blood, saliva, and urine provides a 9-factor matrix for assessing biological terrain.

ZETA POTENTIAL & BLOOD COLLOID SCIENCE:
- Zeta potential reflects the electrical charge on blood cell surfaces that maintains colloidal suspension.
- Adequate negative zeta potential keeps cells dispersed and free-flowing.
- Reduced zeta potential leads to rouleaux formation, aggregation, and sludging.
- Factors reducing zeta potential: dehydration, excess cationic minerals (aluminum, iron excess), inflammatory proteins, acidic terrain.
- Healthy zeta potential correlates with good microcirculation and oxygen delivery.

HAEFELI DIAGNOSTIC METHODS:
- Erimethod: Systematic erythrocyte examination method for evaluating RBC morphology, aggregation patterns, and membrane integrity in dark field.
- Coloring Method: Specialized staining techniques for revealing pleomorphic forms not visible in standard preparations.

DRY LAYER OXIDATIVE STRESS TESTING (per Biomedx):
- Dry layer (oxidative stress test / Bradford variable projection / HLB test) analyzes patterns in dried blood drops.
- Healthy blood dries with uniform fibrin polymerization in a tight, interconnected mesh.
- Disrupted patterns indicate: oxidative stress (clear lacunae/holes), heavy metal toxicity (dark spots), hormonal imbalance (reproductive zone patterns), organ stress (zone-specific disruptions), degenerative conditions (severe pattern breakdown).
- The coagulation cascade and fibrin polymerization quality reflect systemic oxidative burden.

Important guidelines:
- Always note if findings are concerning and require urgent attention
- Consider common and rare conditions in differential diagnosis
- Reference characteristic morphological features (both conventional and pleomorphic terminology)
- Suggest appropriate staining or additional microscopy techniques when relevant
- Be educational and explain findings in accessible terms
- When discussing pleomorphic observations, reference Enderlein's cyclogeny stages
- When terrain markers are provided, correlate with observed blood morphology
- Distinguish between artifact and true pathological/pleomorphic findings

You are assisting trained healthcare professionals within a Private Member Association (PMA) context. Provide thorough, clinically relevant analysis integrating both conventional hematology and pleomorphic blood science.`;

// Build prompt for blood analysis
function buildAnalysisPrompt(request: BloodAnalysisRequest): string {
  let prompt = `## Blood Microscopy Analysis Request\n\n`;
  
  if (request.imageDescription) {
    prompt += `### Image Description\n${request.imageDescription}\n\n`;
  }
  
  prompt += `### Observed Findings\n`;
  request.observedFindings.forEach((finding, i) => {
    prompt += `${i + 1}. ${finding}\n`;
  });
  prompt += `\n`;
  
  if (request.patientContext) {
    prompt += `### Patient Context\n${request.patientContext}\n\n`;
  }
  
  if (request.specificQuestions && request.specificQuestions.length > 0) {
    prompt += `### Specific Questions\n`;
    request.specificQuestions.forEach((q, i) => {
      prompt += `${i + 1}. ${q}\n`;
    });
    prompt += `\n`;
  }
  
  prompt += `Please provide a comprehensive analysis including:
1. Interpretation of the observed findings
2. Possible conditions or diagnoses to consider
3. Recommended additional tests or stains
4. Clinical significance and any urgent concerns
5. Educational notes about the morphological features observed`;

  return prompt;
}

// Parse the model response into structured format
function parseAnalysisResponse(rawResponse: string): Omit<BloodAnalysisResponse, 'modelUsed'> {
  // Extract potential conditions (look for numbered lists or bullet points mentioning conditions)
  const conditionPatterns = [
    /(?:possible|potential|differential|consider|suspect)[^:]*:?\s*([^.]+)/gi,
    /(?:\d+\.\s*|\-\s*|\*\s*)([A-Z][a-zA-Z\s]+(?:syndrome|disease|anemia|infection|deficiency|disorder))/g
  ];
  
  const potentialConditions: string[] = [];
  conditionPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(rawResponse)) !== null) {
      const condition = match[1]?.trim();
      if (condition && condition.length > 3 && condition.length < 100) {
        potentialConditions.push(condition);
      }
    }
  });

  // Extract recommended tests
  const testPatterns = [
    /(?:recommend|suggest|order|consider)[^:]*(?:test|stain|panel|analysis)[^.]*:?\s*([^.]+)/gi,
    /(?:\d+\.\s*|\-\s*|\*\s*)((?:CBC|CMP|[A-Z]+\s+stain|flow cytometry|PCR|culture|biopsy)[^,.\n]*)/gi
  ];
  
  const recommendedTests: string[] = [];
  testPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(rawResponse)) !== null) {
      const test = match[1]?.trim();
      if (test && test.length > 2 && test.length < 100) {
        recommendedTests.push(test);
      }
    }
  });

  // Determine confidence based on language used
  let confidence: 'high' | 'moderate' | 'low' = 'moderate';
  const lowConfidenceTerms = ['uncertain', 'unclear', 'difficult to determine', 'cannot be certain', 'limited'];
  const highConfidenceTerms = ['clearly', 'definitely', 'characteristic', 'pathognomonic', 'diagnostic'];
  
  const lowerResponse = rawResponse.toLowerCase();
  if (highConfidenceTerms.some(term => lowerResponse.includes(term))) {
    confidence = 'high';
  } else if (lowConfidenceTerms.some(term => lowerResponse.includes(term))) {
    confidence = 'low';
  }

  // Extract clinical notes (first paragraph or summary section)
  const clinicalNotesMatch = rawResponse.match(/(?:clinical\s*(?:significance|notes?|implications?)[:\s]*)?(.{50,300})/i);
  const clinicalNotes = clinicalNotesMatch 
    ? clinicalNotesMatch[1].trim().replace(/\n+/g, ' ')
    : 'Analysis provided above. Please review full response for clinical details.';

  return {
    analysis: rawResponse,
    potentialConditions: Array.from(new Set(potentialConditions)).slice(0, 10),
    recommendedTests: Array.from(new Set(recommendedTests)).slice(0, 8),
    clinicalNotes,
    confidence
  };
}

// Main analysis function
export async function analyzeBloodSample(request: BloodAnalysisRequest): Promise<BloodAnalysisResponse> {
  const prompt = buildAnalysisPrompt(request);
  
  let modelUsed = BLOOD_ANALYSIS_MODEL;
  let response: string;

  try {
    // Try the fine-tuned blood analysis model first
    const result = await hf.textGeneration({
      model: BLOOD_ANALYSIS_MODEL,
      inputs: `${BLOOD_ANALYSIS_SYSTEM_PROMPT}\n\n${prompt}`,
      parameters: {
        max_new_tokens: 1024,
        temperature: 0.7,
        top_p: 0.9,
        do_sample: true,
        return_full_text: false
      }
    });
    response = result.generated_text;
  } catch (error: any) {
    console.log(`[HF Blood Analysis] Primary model failed: ${error.message}, trying fallback...`);
    
    try {
      // Fallback to OpenBioLLM
      modelUsed = FALLBACK_MODEL;
      const result = await hf.textGeneration({
        model: FALLBACK_MODEL,
        inputs: `${BLOOD_ANALYSIS_SYSTEM_PROMPT}\n\n${prompt}`,
        parameters: {
          max_new_tokens: 1024,
          temperature: 0.7,
          top_p: 0.9,
          do_sample: true,
          return_full_text: false
        }
      });
      response = result.generated_text;
    } catch (fallbackError: any) {
      console.log(`[HF Blood Analysis] Fallback model also failed: ${fallbackError.message}`);
      // Will try OpenAI below
      response = '';
    }
  }

  // If HuggingFace models failed or returned empty, use OpenAI as ultimate fallback
  if (!response || response.trim().length < 50) {
    console.log(`[Blood Analysis] HuggingFace response empty/insufficient, using OpenAI fallback...`);
    try {
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: BLOOD_ANALYSIS_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1024,
        temperature: 0.7
      });
      
      response = completion.choices[0]?.message?.content || '';
      modelUsed = 'OpenAI GPT-4o';
      console.log(`[Blood Analysis] OpenAI analysis successful`);
    } catch (openaiError: any) {
      console.error(`[Blood Analysis] OpenAI fallback also failed: ${openaiError.message}`);
      throw new Error(`Blood analysis service unavailable. Please try again later.`);
    }
  }

  const parsed = parseAnalysisResponse(response);
  
  return {
    ...parsed,
    modelUsed
  };
}

// Quick analysis for matching observed findings to known patterns
export async function quickPatternMatch(
  observedPattern: string, 
  referencePatterns: Array<{name: string; description: string}>
): Promise<{
  matches: Array<{name: string; similarity: number; explanation: string}>;
  analysis: string;
  modelUsed: string;
}> {
  const patternsContext = referencePatterns
    .map(p => `- ${p.name}: ${p.description}`)
    .join('\n');

  const prompt = `Given the following observed blood microscopy pattern:
"${observedPattern}"

And these reference patterns from our database:
${patternsContext}

Please:
1. Identify which reference patterns best match the observation
2. Rate similarity on a scale of 0-100
3. Explain the matching rationale

Format your response as a structured analysis.`;

  let modelUsed = BLOOD_ANALYSIS_MODEL;
  let generatedText: string;

  try {
    const result = await hf.textGeneration({
      model: BLOOD_ANALYSIS_MODEL,
      inputs: prompt,
      parameters: {
        max_new_tokens: 512,
        temperature: 0.5,
        return_full_text: false
      }
    });
    generatedText = result.generated_text;
  } catch (primaryError: any) {
    console.log(`[HF Pattern Match] Primary model failed: ${primaryError.message}, trying fallback...`);
    
    try {
      modelUsed = FALLBACK_MODEL;
      const result = await hf.textGeneration({
        model: FALLBACK_MODEL,
        inputs: prompt,
        parameters: {
          max_new_tokens: 512,
          temperature: 0.5,
          return_full_text: false
        }
      });
      generatedText = result.generated_text;
    } catch (fallbackError: any) {
      console.error(`[HF Pattern Match] Fallback also failed: ${fallbackError.message}`);
      return {
        matches: [],
        analysis: `Pattern matching unavailable: ${fallbackError.message}`,
        modelUsed: 'none'
      };
    }
  }

  // Parse matches from response
  const matches: Array<{name: string; similarity: number; explanation: string}> = [];
  
  referencePatterns.forEach(pattern => {
    if (generatedText.toLowerCase().includes(pattern.name.toLowerCase())) {
      // Extract similarity score if mentioned
      const scoreMatch = generatedText.match(new RegExp(`${pattern.name}[^\\d]*(\\d+)%?`, 'i'));
      const similarity = scoreMatch ? parseInt(scoreMatch[1]) : 50;
      
      matches.push({
        name: pattern.name,
        similarity: Math.min(100, similarity),
        explanation: `Pattern matched in analysis`
      });
    }
  });

  return {
    matches: matches.sort((a, b) => b.similarity - a.similarity),
    analysis: generatedText,
    modelUsed
  };
}

// Check if Hugging Face service is available
export async function checkHuggingFaceStatus(): Promise<{
  available: boolean;
  primaryModel: boolean;
  fallbackModel: boolean;
  message: string;
}> {
  let primaryAvailable = false;
  let fallbackAvailable = false;

  try {
    // Test primary model
    await hf.textGeneration({
      model: BLOOD_ANALYSIS_MODEL,
      inputs: "Test",
      parameters: { max_new_tokens: 5 }
    });
    primaryAvailable = true;
  } catch (e) {
    console.log('[HF Status] Primary model not available via Inference API');
  }

  try {
    // Test fallback model
    await hf.textGeneration({
      model: FALLBACK_MODEL,
      inputs: "Test",
      parameters: { max_new_tokens: 5 }
    });
    fallbackAvailable = true;
  } catch (e) {
    console.log('[HF Status] Fallback model not available');
  }

  return {
    available: primaryAvailable || fallbackAvailable,
    primaryModel: primaryAvailable,
    fallbackModel: fallbackAvailable,
    message: primaryAvailable 
      ? 'Blood analysis AI ready (primary model)'
      : fallbackAvailable 
        ? 'Blood analysis AI ready (using medical fallback model)'
        : 'Blood analysis AI currently unavailable'
  };
}
