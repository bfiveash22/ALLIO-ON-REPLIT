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

export async function handleProtocolBuilder(req: Request, res: Response) {
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
      return res.status(400).json({ error: "Message is required" });
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
    const safeMap = (arr: any[], mapper: (item: any) => string) => arr && Array.isArray(arr) ? arr.map(mapper).join('\n\n') : '';

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

    const totalProducts = (peptides?.length || 0) + (ivTherapies?.length || 0) + (imTherapies?.length || 0) + 
                          (bioregulators?.length || 0) + (oralPeptides?.length || 0) + (suppositories?.length || 0) + 
                          (supplements?.length || 0) + (exosomes?.length || 0) + (topicals?.length || 0);

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

    // Abacus AI is the preferred model based on original implementation
    // Using streaming response
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        messages,
        stream: true,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      // Fallback to OpenAI if Abacus AI fails or is unconfigured
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: messages,
        stream: true,
      });

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || "";
        if (text) {
          res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`);
        }
      }
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    // Proxy the Abacus stream
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    if (response.body) {
      response.body.pipe(res);
    } else {
      res.end();
    }

  } catch (error: any) {
    console.error('Protocol builder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function registerProtocolBuilderRoutes(app: any) {
  app.post("/api/protocol-builder", handleProtocolBuilder);
}
