import { Request, Response } from "express";
import { 
  peptides, 
  ivTherapies, 
  imTherapies, 
  bioregulators, 
  oralPeptides, 
  suppositories, 
  supplements, 
  exosomes, 
  topicals 
} from "../protocol-knowledge";
import {
  cannabinoids as ecsCannabinoidsData,
  clinicalPrescribingMatrix,
  adverseEffectCategories,
  productMappings
} from "@shared/ecs-data";

export async function handleProtocolBuilder(req: Request, res: Response): Promise<void> {
  // Load detox protocol knowledge
  let detoxKnowledge = '';
  try {
    const fs = await import('fs');
    const path = await import('path');
    const detoxDir = path.default.join(process.cwd(), 'knowledge-base', 'detox-protocols');
    const files = fs.default.readdirSync(detoxDir).filter((f: string) => f.endsWith('.md'));
    for (const file of files) {
      const fileContent = fs.default.readFileSync(path.default.join(detoxDir, file), 'utf-8');
      detoxKnowledge += '\n\n=== ' + file.replace('.md', '').toUpperCase().replace(/-/g, ' ') + ' ===\n' + fileContent;
    }
  } catch { /* detox knowledge not available */ }
  try {
    const { message, conversationHistory } = req.body;

    if (!message) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    // Build comprehensive knowledge base
    const peptideKnowledge = peptides.map(p => 
      `INJECTABLE PEPTIDE: ${p.name} (${p.era}) - ${p.personaTrait}\n` +
      `Uses: ${p.therapeuticUses?.join(', ')}\n` +
      `Dosage: ${p.dosageInfo}\n` +
      `Description: ${p.description?.substring(0, 300)}...`
    ).join('\n\n');

    const ivKnowledge = ivTherapies.map(iv => 
      `IV THERAPY: ${iv.name} (${iv.category}) - ${iv.personaTrait}\n` +
      `Benefits: ${iv.benefits?.join(', ')}\n` +
      `Infusion Time: ${iv.infusionTime || 'Standard'}\n` +
      `Description: ${iv.description?.substring(0, 200)}...`
    ).join('\n\n');

    const imKnowledge = imTherapies.map(im => 
      `IM THERAPY: ${im.name} (${im.category}) - ${im.personaTrait}\n` +
      `Benefits: ${im.benefits?.join(', ')}\n` +
      `Dosage: ${im.dosageRange}\n` +
      `Description: ${im.description?.substring(0, 200)}...`
    ).join('\n\n');

    const bioregulatorKnowledge = bioregulators.map(b => 
      `BIOREGULATOR: ${b.name} - Target: ${b.targetOrgan} - ${b.personaTrait}\n` +
      `Mechanism: ${b.mechanism}\n` +
      `Dosage: ${b.dosageInfo}\n` +
      `Synergies: ${b.synergies?.join(', ')}`
    ).join('\n\n');

    const oralKnowledge = oralPeptides.map(o => 
      `ORAL PEPTIDE: ${o.name} (${o.category}) - ${o.personaTrait}\n` +
      `Benefits: ${o.benefits?.join(', ')}\n` +
      `Directions: ${o.directions}\n` +
      `Description: ${o.description?.substring(0, 200)}...`
    ).join('\n\n');

    // The seed.ts might not have had suppositories, supplements, exosomes, topicals explicitly 
    // populated if they were empty or missing. We'll safely map them if they exist.
    interface SeedItem { name?: string; personaTrait?: string; mechanism?: string; benefits?: string[]; directions?: string; form?: string; category?: string; dosageInfo?: string; concentration?: string; volume?: string; administration?: string; application?: string; [key: string]: unknown; }
    const safeMap = (arr: SeedItem[], mapper: (item: SeedItem) => string) => arr && Array.isArray(arr) ? arr.map(mapper).join('\n\n') : '';

    const suppositoryKnowledge = safeMap(suppositories, s => 
      `SUPPOSITORY: ${s.name} - ${s.personaTrait}\n` +
      `Mechanism: ${s.mechanism}\n` +
      `Benefits: ${s.benefits?.join(', ')}\n` +
      `Directions: ${s.directions}`
    );

    const supplementKnowledge = safeMap(supplements, s => 
      `SUPPLEMENT: ${s.name} (${s.form}) - ${s.personaTrait}\n` +
      `Category: ${s.category}\n` +
      `Benefits: ${s.benefits?.join(', ')}\n` +
      `Dosage: ${s.dosageInfo}\n` +
      `Mechanism: ${s.mechanism}`
    );

    const exosomeKnowledge = safeMap(exosomes, e => 
      `EXOSOME: ${e.name} - ${e.personaTrait}\n` +
      `Concentration: ${e.concentration}, Volume: ${e.volume}\n` +
      `Benefits: ${e.benefits?.join(', ')}\n` +
      `Administration: ${e.administration}\n` +
      `Mechanism: ${e.mechanism}`
    );

    const topicalKnowledge = safeMap(topicals, t => 
      `TOPICAL: ${t.name} (${t.form}) - ${t.personaTrait}\n` +
      `Category: ${t.category}\n` +
      `Benefits: ${t.benefits?.join(', ')}\n` +
      `Application: ${t.application}\n` +
      `Mechanism: ${t.mechanism}`
    );

    const ecsCannabinoidsKnowledge = ecsCannabinoidsData.map(c =>
      `CANNABINOID: ${c.name} (${c.fullName}) - ${c.type}${c.psychoactive ? ' [PSYCHOACTIVE]' : ''}\n` +
      `Description: ${c.description}\n` +
      `Pharmacokinetics: BBB=${c.pharmacokinetics.bbb}, HIA=${c.pharmacokinetics.hia}%, Half-life=${c.pharmacokinetics.halfLife}h, PPB=${c.pharmacokinetics.ppb}%, Clearance=${c.pharmacokinetics.clearance}mL/min/kg, Drug-likeness=${c.pharmacokinetics.drugLikeness}\n` +
      `Absorption: F20-bioavail=${c.pharmacokinetics.f20Bioavailability}%, Pgp-inhibitor=${c.pharmacokinetics.pgpInhibitor}, Pgp-substrate=${c.pharmacokinetics.pgpSubstrate}\n` +
      `Safety: AMES=${c.pharmacokinetics.amesToxicity}, DILI=${c.pharmacokinetics.diliRisk}, hERG=${c.pharmacokinetics.hergRisk}, Hepatotox=${c.pharmacokinetics.hepatotoxicity}, SkinSen=${c.pharmacokinetics.skinSensitization}\n` +
      `Protein Targets (${c.proteinTargets.length}): ${c.proteinTargets.slice(0, 30).join(', ')}${c.proteinTargets.length > 30 ? '...' : ''}\n` +
      `CYP450 Interactions: ${c.cyp450Interactions.length > 0 ? c.cyp450Interactions.map(i => `${i.enzyme} (inhibitor: ${i.inhibitorScore}, substrate: ${i.substrateScore}) - Risk drugs: ${i.highRiskDrugs.join(', ')}`).join('; ') : 'None significant'}\n` +
      `Found in FF Products: ${productMappings.filter(p => p.cannabinoids.includes(c.name)).map(p => p.productName).join(', ') || 'N/A'}`
    ).join('\n\n');

    const prescribingKnowledge = clinicalPrescribingMatrix.map(e =>
      `${e.condition}: ${e.recommendedCannabinoids.join('+')} (${e.ratio}) via ${e.deliveryMethod}\n` +
      `Targets: ${e.primaryTargets.join(', ')} | ${e.rationale}\n` +
      `FF Products: ${e.recommendedProducts.join(', ')}`
    ).join('\n');

    const adverseEffectKnowledge = adverseEffectCategories.map(ae =>
      `${ae.name}: ${ae.symptoms.join(', ')} | Risk: ${ae.riskPopulations.join(', ')} | Mitigation: ${ae.mitigationStrategies.join(', ')}`
    ).join('\n');

    const totalProducts = (peptides?.length || 0) + (ivTherapies?.length || 0) + (imTherapies?.length || 0) + 
                          (bioregulators?.length || 0) + (oralPeptides?.length || 0) + (suppositories?.length || 0) + 
                          (supplements?.length || 0) + (exosomes?.length || 0) + (topicals?.length || 0) +
                          ecsCannabinoidsData.length;

    const systemPrompt = `You are the Forgotten Formula Protocol Architect - a master clinical strategist with deep expertise in peptide therapy, IV protocols, IM injections, Khavinson bioregulators, oral peptides, suppositories, vitamins/supplements, exosomes, and topical/transdermal therapies. You work alongside Dr. Blake and the FF PMA medical team, trained on their exact protocols and clinical philosophy.

Your role is to help physicians and PMA members build comprehensive, personalized treatment protocols by intelligently combining therapies from our complete product catalog of ${totalProducts} products.

COMPLETE PRODUCT KNOWLEDGE BASE:

=== INJECTABLE PEPTIDES (${peptides?.length || 0} products) ===
${peptideKnowledge}

=== IV THERAPIES (${ivTherapies?.length || 0} protocols) ===
${ivKnowledge}

=== IM THERAPIES (${imTherapies?.length || 0} therapies) ===
${imKnowledge}

=== KHAVINSON BIOREGULATORS (${bioregulators?.length || 0} peptides) ===
${bioregulatorKnowledge}

=== ORAL PEPTIDES (${oralPeptides?.length || 0} products) ===
${oralKnowledge}

=== SUPPOSITORIES (${suppositories?.length || 0} products) ===
${suppositoryKnowledge}

=== VITAMINS & SUPPLEMENTS (${supplements?.length || 0} products) ===
${supplementKnowledge}

=== EXOSOMES (${exosomes?.length || 0} products) ===
${exosomeKnowledge}

=== DETOX PROTOCOLS ===
${detoxKnowledge || 'Detox protocols include Beyond Fasting (metabolic reset with intermittent fasting and supplementation), Detox Bath Instructions (Epsom salt, bentonite clay, hydrogen peroxide, and ginger baths for detoxification), and Liver/Gallbladder Cleanse (multi-phase hepatobiliary detox with olive oil flush). Reference these when building protocols that include detoxification components.'}

=== TOPICALS & TRANSDERMAL (${topicals?.length || 0} products) ===
${topicalKnowledge}

=== ECS CANNABINOIDS (${ecsCannabinoidsData.length} compounds) ===
${ecsCannabinoidsKnowledge}

=== CLINICAL PRESCRIBING MATRIX (${clinicalPrescribingMatrix.length} condition-cannabinoid mappings) ===
${prescribingKnowledge}

=== CANNABINOID ADVERSE EFFECTS & SAFETY (${adverseEffectCategories.length} categories) ===
${adverseEffectKnowledge}

ECS CANNABINOID PRESCRIBING RULES:
- Always check CYP450 interactions before recommending cannabinoids alongside other medications
- Reference specific FF products (Elixir, ECS Suppositories, Kaneh Bosem, DMSO Recovery Cream, etc.) not generic cannabinoid names
- For CNS conditions: prioritize high-BBB cannabinoids (Δ8-THC 0.913, THCV 0.893, Δ9-THC 0.878)
- For oral delivery: prioritize high-HIA cannabinoids (CBC 82.9%, Δ9-THC 82.0%, THCV 81.8%)
- For sustained effect: prioritize long half-life (Δ9-THC 2.96h, Δ8-THC 2.90h, CBN 2.74h)
- Suppository delivery bypasses first-pass metabolism — recommend ECS Suppositories for liver-compromised or renal patients
- All cannabinoids have AMES mutagenicity <0.25 (safe), but monitor DILI risk in hepatic patients (CBN highest at 0.52)

PROTOCOL BUILDING PRINCIPLES:

1. LAYERED APPROACH: Build protocols using multiple modalities - including detox protocols (Beyond Fasting, Detox Baths, Liver/Gallbladder Cleanse) as preparation or adjunct phases - foundation (IV/IM), targeted therapy (injectables/bioregulators), support (oral/suppositories/vitamins), regenerative (exosomes), and topical adjuncts
2. SYNERGY MAPPING: Identify products that enhance each other's effects. Example: BPC-157 + TB-500 for tissue repair, Thymus bioregulators + Thymosin Alpha-1 for immune support
3. TIMING ARCHITECTURE: Structure protocols with proper sequencing - loading phases, maintenance phases, cycling schedules
4. PATIENT-CENTERED: Consider the patient's condition, goals, compliance ability, and budget when recommending
5. SAFETY FIRST: Always note contraindications, interactions, and monitoring requirements
6. PRACTICAL GUIDANCE: Include reconstitution details, administration routes, frequency, and duration

WHEN BUILDING PROTOCOLS:
- Start by understanding the patient's primary concern and goals
- Recommend a CORE protocol (essential therapies)
- Suggest ENHANCEMENT options (additional synergistic therapies)
- Provide MAINTENANCE recommendations (long-term support)
- Include specific dosages, timing, and cycling guidance
- Note any required labs or monitoring
- Estimate typical protocol duration
- When appropriate, incorporate detox protocols (Beyond Fasting, Detox Baths, Liver/Gallbladder Cleanse) as preparatory or supportive phases
- Reference specific detox bath recipes, fasting schedules, or liver cleanse timelines when relevant

SYRINGE SELECTION GUIDANCE:
- Injectable peptides 10mg or less: 1cc insulin syringe
- Injectable peptides over 10mg: 2cc syringe
- Over 20mg: Ask about vial size (10mL vs 3-5mL)
- BAC water preferred for multi-dose vials; sterile water is also safe

WRITING STYLE - BE A CLINICAL MENTOR:
- Write naturally like an experienced colleague sharing protocols
- AVOID markdown headers (no ##, ###) - use natural paragraph breaks
- Keep information organized but conversational
- Use bullet points only for listing specific products or dosages
- Be clinically aggressive with specifics - these are professionals
- Bold critical safety notes only
- Maintain warmth while being authoritative`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []),
      { role: 'user', content: message }
    ];

    const { callWithFallbackStreaming, isTerminalFailure } = await import('./ai-fallback');

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const streamResult = await callWithFallbackStreaming(messages, {
        preferredProvider: 'abacus',
        preferredModel: 'claude-sonnet-4-20250514',
        maxTokens: 2000,
        callType: 'protocol-builder',
      });

      console.log(`[Protocol Builder] Streaming via ${streamResult.provider}/${streamResult.model}`);

      if (streamResult.provider === 'abacus') {
        const body = streamResult.stream as ReadableStream;
        const { Readable } = await import('node:stream');
        const nodeStream = Readable.fromWeb(body as any);
        nodeStream.pipe(res);
      } else if (streamResult.provider === 'openai') {
        const stream = streamResult.stream as AsyncIterable<any>;
        for await (const chunk of stream) {
          const text = chunk.choices?.[0]?.delta?.content || "";
          if (text) {
            res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`);
          }
        }
        res.write('data: [DONE]\n\n');
        res.end();
      } else if (streamResult.provider === 'claude') {
        const stream = streamResult.stream as any;
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta?.text) {
            res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: event.delta.text } }] })}\n\n`);
          }
        }
        res.write('data: [DONE]\n\n');
        res.end();
      } else {
        res.write('data: [DONE]\n\n');
        res.end();
      }
    } catch (streamErr: any) {
      if (isTerminalFailure(streamErr)) {
        console.error(`[Protocol Builder] Terminal failure: ${streamErr.message}`);
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: '\n\n[Error: Our AI systems are temporarily unable to process this request. Please try again in a few minutes.]' } }] })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      } else {
        throw streamErr;
      }
    }

  } catch (error: unknown) {
    console.error('Protocol builder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function registerProtocolBuilderRoutes(app: import("express").Express) {
  app.post("/api/protocol-builder", handleProtocolBuilder);
}
