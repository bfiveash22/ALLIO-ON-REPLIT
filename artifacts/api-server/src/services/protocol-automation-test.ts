import OpenAI from 'openai';
import { analyzeWithGemini } from './gemini-provider';
import { searchKnowledgeBase } from './knowledge-base';
import * as fs from 'fs';
import * as path from 'path';

function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

interface ScoreCategory {
  name: string;
  score: number;
  maxScore: number;
  notes: string;
}

interface AutomationTestResult {
  engine: string;
  model: string;
  timestamp: string;
  scores: ScoreCategory[];
  totalScore: number;
  maxPossibleScore: number;
  percentageScore: number;
  rawOutputLength: number;
  rawOutputPreview: string;
  processingTimeMs: number;
  errors: string[];
}

interface ComparisonReport {
  generatedAt: string;
  protocolSource: string;
  results: AutomationTestResult[];
  winner: string;
  recommendation: string;
  gaps: string[];
  hybridApproach: string;
}

const ANNETTE_GOMER_SIMULATED_TRANSCRIPT = `
CALL TRANSCRIPT — FFPMA Initial Consultation
Patient: Annette Gomer
Date: March 8, 2026
Facilitator: Michael Blake, FFPMA

MICHAEL: Annette, thanks for joining us today. Let's start with your history. Can you tell me what's been going on with your health?

ANNETTE: Well, I'm 75 years old, born September 7, 1950. My biggest concerns right now are my thyroid — I've been diagnosed with both Graves Disease and Hashimoto's Thyroiditis, which my doctors say is unusual to have both. Then in 2007, I was diagnosed with metastatic adenocarcinoma of unknown primary. They found a tumor and I still have residual tumor. That same year I also had melanoma removed. And I've had a hiatal hernia that I've been managing with Omeprazole since 2009.

MICHAEL: That's quite a history. Let's go through your medical timeline. Any surgeries?

ANNETTE: Yes, my appendix was removed in 1967. My gallbladder was removed in 2007 — same year as the cancer diagnosis. I had a hysterectomy in 2002 and was never put on hormone replacement therapy. And I had both knees replaced in 2013 — titanium implants.

MICHAEL: And your dental history — this is very important. Do you have any amalgam fillings?

ANNETTE: Oh yes, I have seven to nine silver amalgam fillings. I got them starting in elementary school, junior high, and high school. So they've been there for over 60 years.

MICHAEL: That is extremely significant. Mercury from those fillings has been slowly leaching into your system for six decades. That's very likely a primary driver of both your autoimmune thyroid conditions and your cancer. Let me explain the mechanism — chronic mercury exposure leads to immune dysregulation, which can trigger autoimmune thyroid disease and create an environment conducive to cancer development.

ANNETTE: I never connected the two. My doctors never mentioned the fillings as a possible cause.

MICHAEL: Most conventional doctors don't. Now, any emotional trauma history we should know about?

ANNETTE: Well, I went through a divorce in 1995 and it was really hard. About five years of difficulty and chronic stress after that.

MICHAEL: That chronic stress would have caused significant HPA axis dysregulation and immune suppression — right during the period leading up to your 2002 hysterectomy and 2007 cancer diagnosis. The stress, combined with the ongoing mercury exposure, created a perfect storm.

ANNETTE: That makes sense when you put it together like that.

MICHAEL: What are your goals, Annette? What do you want to achieve with this protocol?

ANNETTE: I want to be healthy enough to see my great-grandchildren. That's my biggest goal. I want to beat this cancer, get my thyroid under control, and have real energy again.

MICHAEL: Beautiful goal. We're going to design a comprehensive protocol using our 5 Rs framework — Reduce, Rebalance, Reactivate, Restore, and Revitalize. This will be a 12-18 month journey with follow-ups every 4-6 weeks.

ANNETTE: I'm ready. Whatever it takes.

MICHAEL: Good. Let's talk about the Omeprazole — that needs to be tapered off. It's blocking your mineral absorption and increasing infection risk, which is terrible when you already have compromised gut function from losing your appendix and gallbladder. We'll wean you off gradually over 4 weeks and replace with natural alternatives.

ANNETTE: My doctor has had me on it since 2009. Seventeen years.

MICHAEL: Exactly — and that's been compounding all your other issues. We also need to address the amalgam fillings. We'll do pre-amalgam support for 4 weeks, then have them removed by a biological dentist in Mexico using the SMART protocol — it's about 60% cheaper than the US and just as safe. Then post-removal chelation with DMSA for several months.

For the cancer, we're looking at high-dose IV Vitamin C, cannabinoid protocols, peptides like BPC-157, TB-500, and Epithalon, plus metabolic therapies with fenbendazole and berberine. For your thyroid, the mercury removal alone should significantly improve things, plus targeted nutrition with selenium, zinc, and iodine.

The ECS — endocannabinoid system — protocols will be critical. We'll use suppositories for better bioavailability, plus our Elixir tincture with 12 non-psychoactive cannabinoids. Different ratios for different targets — 20:1 CBD:THC for the autoimmune thyroid, 1:1 for cancer targeting.

ANNETTE: This is the most comprehensive plan anyone has ever given me. I feel hopeful for the first time in years.

MICHAEL: You should feel hopeful. Say this every morning: "Today's going to be a great day." We'll get you to those great-grandchildren, Annette.
`;

const SCORING_CRITERIA = [
  { name: 'Therapy Selection Accuracy', maxScore: 20, description: 'Correctly identifies mercury/amalgam as root cause, recommends appropriate detox, peptides, ECS, cancer support' },
  { name: 'Dosing Detail Completeness', maxScore: 20, description: 'Includes specific dosages, frequencies, reconstitution info, timing' },
  { name: 'Research Citation Quality', maxScore: 15, description: 'References scientific basis, mechanisms of action, evidence-based rationale' },
  { name: 'Daily Schedule Structure', maxScore: 15, description: 'Provides a structured daily/weekly schedule with timing' },
  { name: '5 Rs Framework Adherence', maxScore: 15, description: 'Uses Reduce/Rebalance/Reactivate/Restore/Revitalize framework properly' },
  { name: 'Patient Personalization', maxScore: 10, description: 'Tailors protocol to Annette\'s specific conditions, age, history' },
  { name: 'Completeness', maxScore: 5, description: 'Covers all major areas: supplements, peptides, diet, lifestyle, monitoring' },
];

async function scoreOutput(output: string, engine: string): Promise<ScoreCategory[]> {
  const scoringPrompt = `You are an expert medical protocol evaluator for Forgotten Formula PMA. Score the following AI-generated protocol output against the gold standard Annette Gomer protocol.

SCORING CRITERIA (score each 0 to max):
${SCORING_CRITERIA.map(c => `- ${c.name} (max ${c.maxScore}): ${c.description}`).join('\n')}

REFERENCE STANDARD (key elements that MUST be present):
- Root cause: Mercury amalgam fillings (7-9 fillings, 60+ years exposure)
- Patient: Annette Gomer, 75, female, Graves + Hashimoto's, Metastatic Adenocarcinoma, hiatal hernia
- Surgical history: Appendix (1967), gallbladder (2007), hysterectomy (2002), bilateral knee replacements (2013)
- The 5 Rs: REDUCE (mercury chelation, parasites, cancer support), REBALANCE (gut restoration), REACTIVATE (ECS protocols), RESTORE (mitochondrial function), REVITALIZE (mind/body/spirit)
- Specific peptides: BPC-157 (250-500mcg 2x daily), TB-500 (5-10mg 2x weekly), Epithalon (10mg daily x 10 days monthly)
- ECS: Suppositories (daytime/nighttime formulas), Elixir tincture (12 cannabinoids), targeted ratios
- Mercury chelation: DMSA, activated charcoal, chlorella, SMART removal protocol
- Cancer support: High-dose IV Vitamin C, fenbendazole, berberine, mistletoe, cannabinoids
- Daily schedule with specific timing
- Diet: Anti-inflammatory, modified keto, 16:8 IF
- Monitoring: Specific blood work markers, timeline milestones

AI-GENERATED OUTPUT TO SCORE:
${output.substring(0, 12000)}

Return a JSON object with a "scores" array. Each element must have: name (string), score (number), maxScore (number), notes (string).
Example: {"scores":[{"name":"Therapy Selection Accuracy","score":15,"maxScore":20,"notes":"Identified mercury but missed fenbendazole"}]}`;

  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a clinical protocol evaluator. Return ONLY a valid JSON object with a "scores" array.' },
        { role: 'user', content: scoringPrompt },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 2000,
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return SCORING_CRITERIA.map(c => ({ ...c, score: 0, notes: 'Scoring failed — no response' }));

    const parsed = JSON.parse(content);
    if (!parsed.scores || !Array.isArray(parsed.scores)) {
      console.error(`[Protocol Test] Unexpected scoring response shape for ${engine}:`, Object.keys(parsed));
      return SCORING_CRITERIA.map(c => ({ ...c, score: 0, notes: 'Scoring response missing "scores" array' }));
    }

    const validatedScores: ScoreCategory[] = parsed.scores.map((s: Record<string, unknown>) => ({
      name: String(s.name || 'Unknown'),
      score: typeof s.score === 'number' ? s.score : 0,
      maxScore: typeof s.maxScore === 'number' ? s.maxScore : 0,
      notes: String(s.notes || ''),
    }));

    if (validatedScores.length !== SCORING_CRITERIA.length) {
      console.warn(`[Protocol Test] Score count mismatch for ${engine}: got ${validatedScores.length}, expected ${SCORING_CRITERIA.length}`);
    }

    return validatedScores;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[Protocol Test] Scoring error for ${engine}:`, message);
    return SCORING_CRITERIA.map(c => ({ ...c, score: 0, notes: `Scoring error: ${message}` }));
  }
}

export async function testAbacusAI(): Promise<AutomationTestResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let rawOutput = '';

  const systemPrompt = `You are the Forgotten Formula Protocol Architect. Given a member consultation call transcript, generate a comprehensive healing protocol following the FF PMA 5 Rs framework (REDUCE, REBALANCE, REACTIVATE, RESTORE, REVITALIZE).

Include:
1. Patient overview with root cause analysis
2. Each of the 5 Rs phases with specific therapies, dosages, and timing
3. Peptide protocols with reconstitution math and syringe guidance
4. ECS/cannabinoid protocols with specific ratios and delivery methods
5. Daily schedule with exact timing
6. Dietary protocol (anti-inflammatory, modified keto, intermittent fasting)
7. Supplement stack with 90 Essential Nutrients
8. Blood work and monitoring schedule
9. Timeline and milestones
10. Cost overview

Be clinically specific with dosages, frequencies, and mechanisms of action. Reference research where applicable.`;

  try {
    const abacusKey = process.env.ABACUSAI_API_KEY;
    if (!abacusKey) {
      errors.push('ABACUSAI_API_KEY not configured');
      return buildErrorResult('Abacus AI', 'gpt-4.1-mini', startTime, errors);
    }

    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${abacusKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `CALL TRANSCRIPT:\n\n${ANNETTE_GOMER_SIMULATED_TRANSCRIPT}` },
        ],
        max_tokens: 8000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      errors.push(`Abacus AI API error ${response.status}: ${errBody.substring(0, 200)}`);
      return buildErrorResult('Abacus AI', 'gpt-4.1-mini', startTime, errors);
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    rawOutput = data.choices?.[0]?.message?.content || '';
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push(`Abacus AI call failed: ${message}`);
    return buildErrorResult('Abacus AI', 'gpt-4.1-mini', startTime, errors);
  }

  const processingTimeMs = Date.now() - startTime;
  const scores = await scoreOutput(rawOutput, 'Abacus AI');
  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
  const maxPossibleScore = scores.reduce((sum, s) => sum + s.maxScore, 0);

  return {
    engine: 'Abacus AI',
    model: 'gpt-4.1-mini',
    timestamp: new Date().toISOString(),
    scores,
    totalScore,
    maxPossibleScore,
    percentageScore: Math.round((totalScore / maxPossibleScore) * 100),
    rawOutputLength: rawOutput.length,
    rawOutputPreview: rawOutput.substring(0, 500),
    processingTimeMs,
    errors,
  };
}

export async function testGeminiRAG(): Promise<AutomationTestResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let rawOutput = '';

  try {
    let knowledgeContext = '';
    try {
      const kbResult = await searchKnowledgeBase('Annette Gomer protocol healing mercury amalgam');
      knowledgeContext = kbResult.substring(0, 5000);
    } catch (kbErr: unknown) {
      const kbMessage = kbErr instanceof Error ? kbErr.message : String(kbErr);
      errors.push(`Knowledge base search failed: ${kbMessage}`);
    }

    const protocolMdPath = path.join(process.cwd(), 'ANNETTE-GOMER-PROTOCOL-FF-PMA-MODEL.md');
    let referenceProtocol = '';
    try {
      if (fs.existsSync(protocolMdPath)) {
        referenceProtocol = fs.readFileSync(protocolMdPath, 'utf-8').substring(0, 8000);
      }
    } catch {
      errors.push('Could not load reference protocol markdown');
    }

    const prompt = `You are the Forgotten Formula Protocol Architect. Analyze the following patient consultation call transcript and generate a comprehensive healing protocol following the FF PMA 5 Rs framework.

Use the knowledge base context and reference protocol structure provided to generate a clinically complete protocol.

Include all of the following:
1. Patient overview with root cause analysis (mercury amalgam as primary cause)
2. Each of the 5 Rs phases: REDUCE (detox, chelation, parasites, cancer support), REBALANCE (gut restoration), REACTIVATE (ECS protocols with suppositories and tinctures), RESTORE (mitochondrial function, NAD+), REVITALIZE (mind/body/spirit)
3. Peptide protocols with specific reconstitution instructions
4. ECS cannabinoid protocols with delivery methods and ratios
5. Daily schedule with exact timing
6. Dietary protocol
7. Supplement stack
8. Blood work and monitoring schedule
9. Timeline and milestones
10. Cost overview

CALL TRANSCRIPT:
${ANNETTE_GOMER_SIMULATED_TRANSCRIPT}`;

    const context = knowledgeContext + (referenceProtocol ? `\n\nREFERENCE PROTOCOL FORMAT:\n${referenceProtocol}` : '');

    rawOutput = await analyzeWithGemini(prompt, context);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push(`Gemini analysis failed: ${message}`);
    return buildErrorResult('Gemini 1.5 Pro + RAG', 'gemini-1.5-pro', startTime, errors);
  }

  const processingTimeMs = Date.now() - startTime;
  const scores = await scoreOutput(rawOutput, 'Gemini 1.5 Pro + RAG');
  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
  const maxPossibleScore = scores.reduce((sum, s) => sum + s.maxScore, 0);

  return {
    engine: 'Gemini 1.5 Pro + RAG',
    model: 'gemini-1.5-pro',
    timestamp: new Date().toISOString(),
    scores,
    totalScore,
    maxPossibleScore,
    percentageScore: Math.round((totalScore / maxPossibleScore) * 100),
    rawOutputLength: rawOutput.length,
    rawOutputPreview: rawOutput.substring(0, 500),
    processingTimeMs,
    errors,
  };
}

export async function testOpenAIDirect(): Promise<AutomationTestResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let rawOutput = '';

  const systemPrompt = `You are the Forgotten Formula Protocol Architect. Given a member consultation call transcript, generate a comprehensive healing protocol following the FF PMA 5 Rs framework (REDUCE, REBALANCE, REACTIVATE, RESTORE, REVITALIZE).

Include:
1. Patient overview with root cause analysis
2. Each of the 5 Rs phases with specific therapies, dosages, and timing
3. Peptide protocols with reconstitution math and syringe guidance
4. ECS/cannabinoid protocols with specific ratios and delivery methods
5. Daily schedule with exact timing
6. Dietary protocol (anti-inflammatory, modified keto, intermittent fasting)
7. Supplement stack with 90 Essential Nutrients
8. Blood work and monitoring schedule
9. Timeline and milestones
10. Cost overview

Be clinically specific with dosages, frequencies, and mechanisms of action. Reference research where applicable.`;

  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `CALL TRANSCRIPT:\n\n${ANNETTE_GOMER_SIMULATED_TRANSCRIPT}` },
      ],
      max_tokens: 8000,
      temperature: 0.3,
    });

    rawOutput = response.choices[0]?.message?.content || '';
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push(`OpenAI direct call failed: ${message}`);
    return buildErrorResult('OpenAI Direct', 'gpt-4o', startTime, errors);
  }

  const processingTimeMs = Date.now() - startTime;
  const scores = await scoreOutput(rawOutput, 'OpenAI Direct');
  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
  const maxPossibleScore = scores.reduce((sum, s) => sum + s.maxScore, 0);

  return {
    engine: 'OpenAI Direct',
    model: 'gpt-4o',
    timestamp: new Date().toISOString(),
    scores,
    totalScore,
    maxPossibleScore,
    percentageScore: Math.round((totalScore / maxPossibleScore) * 100),
    rawOutputLength: rawOutput.length,
    rawOutputPreview: rawOutput.substring(0, 500),
    processingTimeMs,
    errors,
  };
}

function buildErrorResult(engine: string, model: string, startTime: number, errors: string[]): AutomationTestResult {
  return {
    engine,
    model,
    timestamp: new Date().toISOString(),
    scores: SCORING_CRITERIA.map(c => ({ ...c, score: 0, notes: 'Engine error — could not produce output' })),
    totalScore: 0,
    maxPossibleScore: 100,
    percentageScore: 0,
    rawOutputLength: 0,
    rawOutputPreview: '',
    processingTimeMs: Date.now() - startTime,
    errors,
  };
}

export async function runFullComparisonTest(): Promise<ComparisonReport> {
  console.log('[Protocol Automation Test] Starting full comparison test...');

  const results: AutomationTestResult[] = [];

  console.log('[Protocol Automation Test] Testing Abacus AI (gpt-4.1-mini)...');
  const abacusResult = await testAbacusAI();
  results.push(abacusResult);
  console.log(`[Protocol Automation Test] Abacus AI: ${abacusResult.percentageScore}% (${abacusResult.totalScore}/${abacusResult.maxPossibleScore})`);

  console.log('[Protocol Automation Test] Testing Gemini 1.5 Pro + RAG...');
  const geminiResult = await testGeminiRAG();
  results.push(geminiResult);
  console.log(`[Protocol Automation Test] Gemini: ${geminiResult.percentageScore}% (${geminiResult.totalScore}/${geminiResult.maxPossibleScore})`);

  console.log('[Protocol Automation Test] Testing OpenAI Direct (gpt-4o)...');
  const openaiResult = await testOpenAIDirect();
  results.push(openaiResult);
  console.log(`[Protocol Automation Test] OpenAI: ${openaiResult.percentageScore}% (${openaiResult.totalScore}/${openaiResult.maxPossibleScore})`);

  const sortedResults = [...results].sort((a, b) => b.percentageScore - a.percentageScore);
  const winner = sortedResults[0];

  const gaps: string[] = [];
  for (const result of results) {
    for (const score of result.scores) {
      if (score.score < score.maxScore * 0.6) {
        gaps.push(`${result.engine} — ${score.name}: ${score.score}/${score.maxScore} — ${score.notes}`);
      }
    }
    if (result.errors.length > 0) {
      gaps.push(`${result.engine} errors: ${result.errors.join('; ')}`);
    }
  }

  let recommendation = '';
  if (winner.percentageScore >= 80) {
    recommendation = `${winner.engine} (${winner.model}) achieves ${winner.percentageScore}% quality and is recommended as the primary engine for protocol automation. It produces clinically adequate output that can be used as a starting point with human review.`;
  } else if (winner.percentageScore >= 60) {
    recommendation = `${winner.engine} (${winner.model}) achieves ${winner.percentageScore}% quality — acceptable for draft generation but requires significant human review and enhancement. Consider a hybrid approach for production use.`;
  } else {
    recommendation = `No engine achieved acceptable quality (best: ${winner.engine} at ${winner.percentageScore}%). Full automation is not yet viable. A hybrid approach with substantial human review is required.`;
  }

  const hybridApproach = [
    'RECOMMENDED HYBRID PIPELINE:',
    '1. Gemini 1.5 Pro for initial transcript analysis (large context window handles full transcripts)',
    '2. OpenAI GPT-4o for structured protocol generation (strong at following complex schemas)',
    '3. Knowledge RAG layer for accurate dosing, product references, and research citations',
    '4. Human review step for clinical accuracy and personalization',
    '5. Google Slides generation via protocol-slide-generator.ts for final presentation',
    '',
    'OPENROUTER INTEGRATION (if needed):',
    'OpenRouter provides access to Claude 3.5 Sonnet, Llama 3.1, and other models through a single API.',
    'Integration would follow the same pattern as gemini-provider.ts — a simple fetch wrapper.',
    'Key benefit: Access to Claude for legal/compliance-sensitive protocol language.',
    'Implementation: Create openrouter-provider.ts with standard chat completion API calls to https://openrouter.ai/api/v1/chat/completions',
  ].join('\n');

  const report: ComparisonReport = {
    generatedAt: new Date().toISOString(),
    protocolSource: 'Annette Gomer Protocol (FF PMA Model)',
    results,
    winner: `${winner.engine} (${winner.model}) — ${winner.percentageScore}%`,
    recommendation,
    gaps,
    hybridApproach,
  };

  try {
    const reportMd = generateMarkdownReport(report);
    const kbDir = path.join(process.cwd(), 'knowledge-base');
    if (!fs.existsSync(kbDir)) {
      fs.mkdirSync(kbDir, { recursive: true });
    }
    const reportPath = path.join(kbDir, `AI_Protocol_Automation_Test_Report_${new Date().toISOString().slice(0, 10)}.md`);
    fs.writeFileSync(reportPath, reportMd, 'utf-8');
    console.log(`[Protocol Automation Test] Report saved to: ${reportPath}`);
  } catch (err) {
    console.error('[Protocol Automation Test] Failed to save report:', err);
  }

  return report;
}

function generateMarkdownReport(report: ComparisonReport): string {
  const lines: string[] = [
    '# AI Protocol Automation Test Report',
    `**Generated:** ${report.generatedAt}`,
    `**Protocol Source:** ${report.protocolSource}`,
    '',
    '---',
    '',
    '## Executive Summary',
    '',
    `**Winner:** ${report.winner}`,
    '',
    report.recommendation,
    '',
    '---',
    '',
    '## Detailed Results',
    '',
  ];

  for (const result of report.results) {
    lines.push(`### ${result.engine} (${result.model})`);
    lines.push(`- **Score:** ${result.totalScore}/${result.maxPossibleScore} (${result.percentageScore}%)`);
    lines.push(`- **Processing Time:** ${result.processingTimeMs}ms`);
    lines.push(`- **Output Length:** ${result.rawOutputLength} characters`);
    if (result.errors.length > 0) {
      lines.push(`- **Errors:** ${result.errors.join('; ')}`);
    }
    lines.push('');
    lines.push('| Category | Score | Max | Notes |');
    lines.push('|----------|-------|-----|-------|');
    for (const score of result.scores) {
      lines.push(`| ${score.name} | ${score.score} | ${score.maxScore} | ${score.notes} |`);
    }
    lines.push('');
    lines.push(`**Output Preview:** ${result.rawOutputPreview.substring(0, 200)}...`);
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  lines.push('## Gaps Identified');
  lines.push('');
  for (const gap of report.gaps) {
    lines.push(`- ${gap}`);
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Hybrid Approach Recommendation');
  lines.push('');
  lines.push(report.hybridApproach);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('*Report generated by FFPMA Protocol Automation Test Harness*');

  return lines.join('\n');
}

export { ANNETTE_GOMER_SIMULATED_TRANSCRIPT };
