import { db } from "../db";
import {
  trainingTracks,
  trainingModules,
  trackModules,
  trainingModuleSections,
  trainingModuleKeyPoints,
  trainingQuizzes,
} from "@shared/schema";
import { eq } from "drizzle-orm";

export const peptideProtocols101Track = {
  id: "track-peptide-protocols-101",
  title: "Peptide Protocols 101",
  slug: "peptide-protocols-101",
  description: "Essential introduction to therapeutic peptides — fundamentals, injection techniques, storage, cycling, and stacking strategies. Guided by PARACELSUS agent expertise.",
  imageUrl: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800",
  totalModules: 5,
  estimatedDuration: "6 hours",
  difficulty: "beginner" as const,
  isActive: true,
  requiresMembership: true,
};

export const peptideProtocols101Modules = [
  {
    id: "pp101-fundamentals",
    title: "Peptide Fundamentals: What They Are & How They Work",
    slug: "pp101-fundamentals",
    description: "Understand what peptides are, how they differ from proteins and hormones, their biological roles, and why peptide therapy is gaining traction in integrative and regenerative medicine.",
    imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800",
    category: "Peptide Protocols 101",
    sortOrder: 1,
    duration: "75 min",
    difficulty: "beginner" as const,
    isActive: true,
    requiresMembership: true,
    roleAccess: ["member", "doctor", "admin"],
    isInteractive: true,
    hasQuiz: true,
  },
  {
    id: "pp101-injection-techniques",
    title: "Injection Techniques & Administration Routes",
    slug: "pp101-injection-techniques",
    description: "Learn proper subcutaneous and intramuscular injection techniques, oral and nasal peptide administration, site rotation, sterile procedures, and how to minimize discomfort.",
    imageUrl: "https://images.unsplash.com/photo-1559757175-7b21e0ed3a23?w=800",
    category: "Peptide Protocols 101",
    sortOrder: 2,
    duration: "90 min",
    difficulty: "beginner" as const,
    isActive: true,
    requiresMembership: true,
    roleAccess: ["member", "doctor", "admin"],
    isInteractive: true,
    hasQuiz: true,
  },
  {
    id: "pp101-storage-handling",
    title: "Reconstitution, Storage & Handling",
    slug: "pp101-storage-handling",
    description: "Master peptide reconstitution with bacteriostatic water, cold chain storage requirements, shelf-life management, sterile handling practices, and travel considerations.",
    imageUrl: "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800",
    category: "Peptide Protocols 101",
    sortOrder: 3,
    duration: "60 min",
    difficulty: "beginner" as const,
    isActive: true,
    requiresMembership: true,
    roleAccess: ["member", "doctor", "admin"],
    isInteractive: true,
    hasQuiz: true,
  },
  {
    id: "pp101-cycling-strategies",
    title: "Cycling Strategies & Dosing Principles",
    slug: "pp101-cycling-strategies",
    description: "Understand why peptides are cycled, how to structure on/off cycles, dose titration principles, desensitization avoidance, and how different peptides have different cycling requirements.",
    imageUrl: "https://images.unsplash.com/photo-1582719471137-c3967ffb1c42?w=800",
    category: "Peptide Protocols 101",
    sortOrder: 4,
    duration: "75 min",
    difficulty: "intermediate" as const,
    isActive: true,
    requiresMembership: true,
    roleAccess: ["member", "doctor", "admin"],
    isInteractive: true,
    hasQuiz: true,
  },
  {
    id: "pp101-stacking-combinations",
    title: "Stacking & Combination Protocols",
    slug: "pp101-stacking-combinations",
    description: "Learn the art and science of peptide stacking — which peptides synergize well together, timing considerations, contraindicated combinations, and sample starter stacks for common health goals.",
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800",
    category: "Peptide Protocols 101",
    sortOrder: 5,
    duration: "90 min",
    difficulty: "intermediate" as const,
    isActive: true,
    requiresMembership: true,
    roleAccess: ["member", "doctor", "admin"],
    isInteractive: true,
    hasQuiz: true,
  },
];

const peptideModuleSections: Record<string, Array<{ title: string; content: string }>> = {
  "pp101-fundamentals": [
    {
      title: "What Are Peptides?",
      content: "Peptides are short chains of amino acids linked by peptide bonds, typically consisting of 2 to 50 amino acids. They differ from proteins (which are longer chains, typically 50+ amino acids) and single amino acids in their size, complexity, and biological function. Peptides serve as signaling molecules in the body — they carry instructions from one cell or tissue to another, functioning as hormones, neurotransmitters, growth factors, and immune modulators. Your body naturally produces thousands of peptides that regulate virtually every biological process: from growth hormone release (GHRH) to pain modulation (endorphins) to immune defense (defensins). Therapeutic peptides are synthesized versions of these natural molecules, designed to supplement or optimize specific biological pathways that may be deficient due to aging, illness, or environmental stress.",
    },
    {
      title: "How Peptides Differ from Pharmaceuticals",
      content: "Unlike conventional pharmaceuticals that often work by blocking or inhibiting biological processes (receptor antagonists, enzyme inhibitors), peptides typically work by enhancing or modulating natural processes. This fundamental difference gives peptides several advantages: high specificity (they bind to specific receptors with minimal off-target effects), low toxicity (they break down into amino acids, which are naturally occurring), and physiological alignment (they amplify pathways the body already uses). However, peptides also have challenges: most cannot be taken orally (stomach acid destroys them), they require refrigeration, and they have short half-lives requiring strategic dosing. The emerging field of peptide engineering addresses these limitations through modifications like PEGylation (attaching polyethylene glycol chains), lipidation, and cyclization to improve stability and bioavailability.",
    },
    {
      title: "Categories of Therapeutic Peptides",
      content: "Therapeutic peptides can be organized into functional categories. Growth Hormone Secretagogues (GHS) — including Ipamorelin, CJC-1295, GHRP-6, and Sermorelin — stimulate the pituitary to release growth hormone, supporting muscle growth, fat loss, sleep quality, and tissue repair. Healing Peptides — including BPC-157 (Body Protection Compound), TB-500 (Thymosin Beta-4), and KPV — accelerate wound healing, reduce inflammation, and promote tissue regeneration. Immune Peptides — including Thymosin Alpha-1 and LL-37 — modulate and strengthen immune function. Metabolic Peptides — including GLP-1 agonists (Semaglutide, Tirzepatide) and AOD-9604 — regulate appetite, blood sugar, and fat metabolism. Cognitive Peptides — including Selank, Semax, and Dihexa — enhance memory, focus, and neuroprotection. Anti-Aging Peptides — including Epithalon, GHK-Cu, and NAD+ precursors — target cellular senescence, telomere maintenance, and mitochondrial function.",
    },
    {
      title: "The FF PMA Approach to Peptide Therapy",
      content: "Within the Forgotten Formula PMA framework, peptide therapy is integrated into the 5R Protocol based on the member's specific needs. During the Remove phase, immune-modulating peptides (Thymosin Alpha-1, LL-37) support the body's ability to clear infections and reduce pathogen burden. In the Replace phase, metabolic peptides help restore hormonal and enzymatic function. The Reinoculate phase may include gut-healing peptides (BPC-157) to repair intestinal barrier integrity before probiotic reintroduction. The Repair phase leverages healing peptides (BPC-157, TB-500, GHK-Cu) for tissue regeneration. The Rebalance phase uses growth hormone secretagogues and anti-aging peptides to optimize long-term hormonal balance and cellular health. PARACELSUS, the FF PMA's peptide specialist agent, provides personalized guidance on peptide selection and protocol design based on each member's unique health profile.",
    },
  ],
  "pp101-injection-techniques": [
    {
      title: "Subcutaneous Injection Technique",
      content: "Subcutaneous (SubQ) injection is the most common administration route for peptides. The needle delivers the peptide into the fatty tissue layer between the skin and muscle, where it is absorbed gradually into the bloodstream. Procedure: (1) Wash hands thoroughly and prepare a clean, flat surface. (2) Draw the correct dose from the vial using an insulin syringe (typically 29–31 gauge, 0.5 inch needle). (3) Clean the injection site with an alcohol swab and allow to dry. (4) Pinch a fold of skin at the injection site — common sites include the lower abdomen (2 inches from the navel), outer thigh, and back of the upper arm. (5) Insert the needle at a 45–90 degree angle (depending on body fat). (6) Inject the peptide slowly and steadily. (7) Withdraw the needle and apply gentle pressure with a cotton ball. Do not massage the site. SubQ injections are preferred for most peptides because they provide a slower, more sustained absorption profile.",
    },
    {
      title: "Intramuscular & Alternative Routes",
      content: "Intramuscular (IM) injection delivers peptides directly into muscle tissue, providing faster absorption than SubQ. IM injection is used for certain peptides where rapid onset is desired or larger volumes are needed. Common IM sites include the deltoid (upper arm), vastus lateralis (outer thigh), and gluteus medius (upper outer buttock). Use a 23–25 gauge needle, 1–1.5 inches long. Insert at a 90-degree angle into the muscle body, aspirate briefly to ensure you haven't hit a blood vessel, then inject slowly. Alternative routes include: Nasal spray — used for peptides like BPC-157 (for brain-gut axis effects), Selank, and Semax (for cognitive enhancement). Sublingual — some peptides are formulated for under-the-tongue absorption. Topical — GHK-Cu and certain healing peptides are available in cream formulations for localized application. Oral capsules — enteric-coated BPC-157 and certain stable peptides can survive gastric acid when properly formulated.",
    },
    {
      title: "Site Rotation & Injection Scheduling",
      content: "Rotating injection sites is essential to prevent lipodystrophy (changes in subcutaneous fat at repeatedly injected sites), bruising, and scar tissue formation. Divide the abdomen into four quadrants and rotate through them systematically. For thigh injections, alternate between left and right legs. Keep a simple injection log noting: date, time, peptide, dose, site used, and any reactions. Most peptide protocols involve daily or twice-daily injections. Growth hormone secretagogues (Ipamorelin, CJC-1295) are typically injected before bed (to coincide with natural GH pulses) or in the morning on an empty stomach. BPC-157 is often administered twice daily — morning and evening — near the site of injury when possible. Some peptides like CJC-1295 with DAC (Drug Affinity Complex) have extended half-lives and only require weekly injection. Understanding each peptide's pharmacokinetics guides optimal injection timing.",
    },
    {
      title: "Sterile Technique & Safety Measures",
      content: "Maintaining sterile technique is non-negotiable in peptide administration. Always use new, sealed syringes and needles — never reuse or share injection equipment. Wipe vial stoppers with alcohol before each draw. Store reconstituted peptides in the refrigerator (36–46°F / 2–8°C) and label each vial with the reconstitution date. Discard reconstituted peptides after the manufacturer-recommended period (typically 28–30 days). Use a sharps container for needle disposal — never place used needles in regular trash. Monitor injection sites for signs of infection: increasing redness, warmth, swelling, pain, or discharge. Mild redness and a small bump at the injection site are normal and resolve within hours. Report any persistent reactions to your healthcare practitioner. If you experience symptoms of anaphylaxis (difficulty breathing, facial swelling, rapid heart rate), seek emergency medical care immediately — though allergic reactions to peptides are exceedingly rare.",
    },
  ],
  "pp101-storage-handling": [
    {
      title: "Reconstitution Basics",
      content: "Most therapeutic peptides arrive as lyophilized (freeze-dried) powder in sealed vials. Reconstitution is the process of adding a diluent to restore the peptide to an injectable liquid form. The standard diluent is bacteriostatic water (BAC water) — sterile water preserved with 0.9% benzyl alcohol that prevents bacterial growth and extends the reconstituted peptide's shelf life. Reconstitution procedure: (1) Remove plastic caps from both the peptide vial and BAC water vial. (2) Swab both rubber stoppers with alcohol. (3) Draw the desired volume of BAC water into a syringe (typically 1–2 mL depending on the peptide and desired concentration). (4) Insert the needle into the peptide vial at an angle, aimed at the glass wall. (5) Slowly inject the BAC water, allowing it to run down the vial wall — NEVER squirt directly onto the powder as this can damage the peptide's molecular structure. (6) Gently swirl (don't shake) the vial until the powder is fully dissolved. The solution should be clear and colorless.",
    },
    {
      title: "Calculating Dosage After Reconstitution",
      content: "Understanding concentration calculations is essential for accurate dosing. Example: A vial contains 5 mg of BPC-157. You add 2 mL of BAC water. The concentration is now 5 mg / 2 mL = 2.5 mg/mL, or 2,500 mcg/mL. If your protocol calls for 250 mcg per dose: 250 mcg ÷ 2,500 mcg/mL = 0.1 mL (10 units on an insulin syringe). Insulin syringes are marked in 'units' where 100 units = 1 mL, so 0.1 mL = 10 units. Key formula: Dose Volume (mL) = Desired Dose (mcg) ÷ Concentration (mcg/mL). Always double-check your calculation before injecting. Many practitioners prepare a reference card for each peptide listing the reconstitution volume, resulting concentration, and injection volume for common doses. Using a consistent reconstitution volume (e.g., always using 2 mL) simplifies dosing across multiple peptides.",
    },
    {
      title: "Cold Chain Storage Requirements",
      content: "Proper storage is critical to maintaining peptide potency and safety. Lyophilized (unreconstituted) peptides should be stored in a cool, dry place. Room temperature storage is acceptable for short periods (weeks), but refrigeration (2–8°C / 36–46°F) extends shelf life to 12–24 months. For long-term storage, freezing at -20°C is ideal. Once reconstituted, peptides MUST be refrigerated (never frozen) and used within 28–30 days. Heat, light, and agitation are the three enemies of peptide stability. Never leave reconstituted vials at room temperature for extended periods. During travel, use an insulated cooler bag with ice packs. When flying, carry peptides in your carry-on (not checked luggage where temperature extremes occur). A medical letter from your recommending practitioner can prevent issues at security checkpoints. Label all vials clearly with: peptide name, concentration, reconstitution date, and expiration date.",
    },
    {
      title: "Quality Assurance & Sourcing",
      content: "Peptide quality varies dramatically between sources. Within the FF PMA framework, peptides should be sourced from compounding pharmacies that follow USP 797/800 standards or from reputable research-grade suppliers with third-party testing (HPLC purity reports, mass spectrometry verification). Key quality indicators include: purity ≥ 98% (verified by HPLC), proper lyophilization (uniform powder cake), sterility testing documentation, and batch-specific certificates of analysis (COA). Red flags for poor-quality peptides include: very low pricing, no COA available, powder that appears wet or discolored, vials with damaged seals, and suppliers that do not require any verification of intended use. Before using any peptide, verify: (1) The powder appears as a clean, white, fluffy cake. (2) The vial seal is intact. (3) Upon reconstitution, the solution is clear — cloudy or particulate solutions should be discarded. (4) The COA matches the batch number on your vial.",
    },
  ],
  "pp101-cycling-strategies": [
    {
      title: "Why Peptides Are Cycled",
      content: "Cycling — alternating periods of peptide use (on-cycle) with periods of rest (off-cycle) — is fundamental to effective peptide therapy for several reasons. First, receptor desensitization: prolonged continuous exposure to a peptide can downregulate the receptors it targets, reducing its effectiveness over time. Growth hormone secretagogues, for example, can lose potency after 3–6 months of continuous use as pituitary GH-releasing receptors desensitize. Second, hormonal homeostasis: the body's feedback loops may attempt to counterbalance the effects of exogenous peptides. Cycling allows these systems to reset. Third, safety: while therapeutic peptides have favorable safety profiles, periodic breaks allow monitoring for any cumulative effects. Fourth, cost management: strategic cycling maximizes the therapeutic benefit per unit of peptide used. The goal of cycling is to maintain the body's responsiveness to the peptide while achieving sustained clinical benefit.",
    },
    {
      title: "Common Cycling Patterns",
      content: "Different peptides require different cycling approaches based on their mechanism of action and receptor dynamics. Growth Hormone Secretagogues (Ipamorelin, GHRP-6, Sermorelin): Typical cycle is 12 weeks on, 4 weeks off, or 5 days on / 2 days off continuously. CJC-1295 with DAC has a longer half-life and may be cycled 8 weeks on / 4 weeks off. Healing Peptides (BPC-157, TB-500): Usually run for 4–8 week focused cycles during injury recovery, then discontinued. Can be restarted as needed. BPC-157 does not appear to cause significant receptor desensitization. Immune Peptides (Thymosin Alpha-1): Can be run continuously at low doses or cycled 3 months on / 1 month off at higher doses. Anti-Aging Peptides (Epithalon): Typically administered in 10–20 day courses, 2–3 times per year. GHK-Cu: Can be used topically without cycling; injectable protocols often follow 4 weeks on / 2 weeks off. Each peptide's cycling schedule should be tailored to the individual member's response and clinical objectives.",
    },
    {
      title: "Dose Titration Principles",
      content: "Proper dose titration — starting low and gradually increasing — is essential for safety, tolerability, and optimal results. The 'start low, go slow' approach allows the practitioner to identify each member's minimum effective dose while minimizing side effects. Example for Ipamorelin: Start at 100 mcg before bed for Week 1, increase to 200 mcg for Week 2, and reach the target dose of 200–300 mcg by Week 3. This approach helps identify members who are particularly sensitive to GH secretagogues (who may experience water retention, joint stiffness, or numbness/tingling at standard doses). For BPC-157: Start at 250 mcg once daily and increase to 250 mcg twice daily if needed. Monitor response and adjust accordingly. Key titration principles: (1) Allow 5–7 days at each dose level to assess response. (2) Document subjective symptoms (energy, sleep quality, pain levels) and objective markers when available. (3) The minimum effective dose is preferable to the maximum tolerated dose. (4) Down-titrate gradually when ending a cycle rather than stopping abruptly.",
    },
    {
      title: "Monitoring & Adjusting Protocols",
      content: "Effective peptide cycling requires ongoing monitoring and protocol adjustment. Subjective monitoring includes tracking: energy levels, sleep quality, recovery from exercise, pain levels, mood, appetite, and any side effects using a simple daily scoring system (1–10 scale). Objective monitoring may include: body composition measurements (lean mass, body fat percentage), blood work (IGF-1 levels for GH secretagogues, inflammatory markers for healing peptides, CBC for immune peptides), and functional tests relevant to protocol goals. Adjustments to the protocol may be warranted when: (1) The member stops responding (consider increasing dose or implementing a rest period). (2) Side effects emerge (reduce dose or lengthen off-cycle period). (3) Protocol goals are achieved (transition to a maintenance protocol with lower doses). (4) Blood work shows values outside optimal ranges. Within the FF PMA framework, the PARACELSUS agent can assist practitioners in analyzing member data and recommending protocol modifications based on protocol response patterns.",
    },
  ],
  "pp101-stacking-combinations": [
    {
      title: "The Science of Peptide Stacking",
      content: "Peptide stacking — using multiple peptides simultaneously — leverages synergistic mechanisms to achieve results greater than any single peptide alone. Effective stacking requires understanding how peptides interact at the receptor, pathway, and systemic levels. Synergistic stacks target complementary pathways: for example, combining a GHRP (like Ipamorelin, which stimulates GH release through the ghrelin receptor) with a GHRH analog (like CJC-1295, which stimulates GH release through a different receptor) produces a synergistic GH pulse 3–5 times greater than either alone. This is the most well-established peptide stack and forms the foundation of most growth hormone optimization protocols. Another example: combining BPC-157 (which works through VEGF-mediated angiogenesis and NO signaling) with TB-500 (which works through actin regulation and cell migration) addresses tissue healing through complementary mechanisms, accelerating recovery beyond what either achieves individually.",
    },
    {
      title: "Foundational Starter Stacks",
      content: "For members new to peptide therapy, well-established starter stacks provide a safe entry point. The GH Optimization Stack: Ipamorelin (200–300 mcg) + CJC-1295 no DAC (100 mcg), injected together SubQ before bed. Benefits: improved sleep, recovery, body composition, and skin quality. Cycle: 12 weeks on / 4 weeks off. The Healing & Recovery Stack: BPC-157 (250–500 mcg, twice daily) + TB-500 (750 mcg, twice weekly). Benefits: accelerated injury healing, reduced inflammation, gut repair. Cycle: 4–8 weeks targeted. The Immune Support Stack: Thymosin Alpha-1 (1.6 mg, twice weekly) + BPC-157 (250 mcg, daily). Benefits: enhanced immune function with anti-inflammatory support. Suitable for autoimmune conditions or chronic infections. The Metabolic Stack: Semaglutide or Tirzepatide (per recommended protocol) + BPC-157 (250 mcg, daily for gut support). Benefits: weight management with GI protection. Note: GLP-1 agonists require medical oversight and monitoring.",
    },
    {
      title: "Timing & Administration in Stacks",
      content: "When running a peptide stack, timing and administration details significantly impact efficacy. General timing rules: (1) GH secretagogues should be taken on an empty stomach (insulin and food suppress GH release). Inject at least 30 minutes before eating or 2+ hours after a meal. (2) BPC-157 can be taken with or without food, but splitting the dose (morning and evening) provides more consistent healing signals. (3) Most peptides can be mixed in the same syringe for injection convenience — Ipamorelin and CJC-1295 are commonly combined. However, some peptides should NOT be mixed: always inject TB-500 separately. (4) If using both morning and evening peptides, the morning dose is typically taken upon waking (fasted), and the evening dose 30 minutes before bed. (5) Separate timing of peptides that compete for the same receptors. (6) Keep injection volumes small — ideally under 0.5 mL per injection site to ensure proper absorption.",
    },
    {
      title: "Contraindicated Combinations & Safety",
      content: "Not all peptide combinations are beneficial, and some should be avoided. Avoid stacking multiple peptides that target the same receptor type — for example, using three different GHRPs simultaneously can cause excessive receptor stimulation and paradoxically reduce response. Exercise caution combining GH secretagogues with exogenous growth hormone — the interaction can lead to excessive IGF-1 levels with potential health implications. Do not combine multiple GLP-1 agonists. Use caution stacking more than 3–4 peptides simultaneously — start with a foundational stack and add one peptide at a time, allowing 2–4 weeks to assess response before adding another. Monitor for additive side effects: multiple peptides that cause water retention (e.g., GH secretagogues + Semaglutide) may produce uncomfortable fluid accumulation. Within the FF PMA framework, the PARACELSUS agent can review proposed stacks against a database of known interactions and clinical experience, providing personalized safety recommendations. Always consult your practitioner before modifying your peptide protocol.",
    },
  ],
};

const peptideModuleKeyPoints: Record<string, string[]> = {
  "pp101-fundamentals": [
    "Peptides are short chains of 2–50 amino acids that serve as signaling molecules in the body",
    "Unlike pharmaceuticals that block pathways, peptides enhance and modulate natural biological processes",
    "Therapeutic peptide categories include GH secretagogues, healing, immune, metabolic, cognitive, and anti-aging",
    "Peptides have high specificity, low toxicity, and break down into naturally occurring amino acids",
    "Within the FF PMA 5R Framework, peptides integrate into every phase based on member-specific needs",
  ],
  "pp101-injection-techniques": [
    "Subcutaneous injection into fatty tissue is the most common peptide administration route",
    "Use insulin syringes (29–31 gauge) and clean injection sites with alcohol before each injection",
    "Rotate injection sites systematically to prevent lipodystrophy and scar tissue formation",
    "Alternative routes include nasal spray, sublingual, topical, and enteric-coated oral capsules",
    "Maintain strict sterile technique — never reuse or share injection equipment",
  ],
  "pp101-storage-handling": [
    "Reconstitute lyophilized peptides with bacteriostatic water — never squirt directly onto the powder",
    "Key formula: Dose Volume (mL) = Desired Dose (mcg) ÷ Concentration (mcg/mL)",
    "Reconstituted peptides must be refrigerated (2–8°C) and used within 28–30 days",
    "Source peptides from USP 797/800 compounding pharmacies with third-party testing and COA documentation",
    "Heat, light, and agitation are the three enemies of peptide stability",
  ],
  "pp101-cycling-strategies": [
    "Cycling prevents receptor desensitization and maintains the body's responsiveness to peptides",
    "GH secretagogues: typically 12 weeks on / 4 weeks off, or 5 days on / 2 days off",
    "Healing peptides (BPC-157): 4–8 week focused cycles during injury recovery, can restart as needed",
    "Start low and go slow: allow 5–7 days at each dose level before increasing",
    "The minimum effective dose is preferable to the maximum tolerated dose",
  ],
  "pp101-stacking-combinations": [
    "Ipamorelin + CJC-1295 produces synergistic GH pulses 3–5x greater than either alone",
    "BPC-157 + TB-500 addresses tissue healing through complementary mechanisms",
    "Take GH secretagogues on an empty stomach — insulin and food suppress GH release",
    "Never stack more than 3–4 peptides simultaneously; add one at a time with 2–4 week assessment",
    "Avoid multiple peptides targeting the same receptor type to prevent paradoxical reduced response",
  ],
};

const peptideProtocolsQuizQuestions = [
  {
    question: "What distinguishes peptides from proteins?",
    options: [
      "Peptides are synthetic, proteins are natural",
      "Peptides are shorter chains (2–50 amino acids), proteins are longer (50+)",
      "Peptides are always injectable, proteins are always oral",
      "There is no difference",
    ],
    correctAnswerIndex: 1,
    explanation: "Peptides are short chains of 2–50 amino acids linked by peptide bonds, while proteins are longer chains typically consisting of 50+ amino acids with more complex three-dimensional structures.",
  },
  {
    question: "What is the standard diluent used for reconstituting lyophilized peptides?",
    options: [
      "Normal saline (0.9% NaCl)",
      "Sterile water for injection",
      "Bacteriostatic water (BAC water) with 0.9% benzyl alcohol",
      "Distilled water",
    ],
    correctAnswerIndex: 2,
    explanation: "Bacteriostatic water (BAC water) — sterile water preserved with 0.9% benzyl alcohol — is the standard diluent because it prevents bacterial growth and extends the reconstituted peptide's shelf life to 28–30 days.",
  },
  {
    question: "Why should you NEVER squirt bacteriostatic water directly onto lyophilized peptide powder?",
    options: [
      "It causes the vial to crack",
      "The force can damage the peptide's molecular structure",
      "It creates excessive bubbles",
      "It changes the color of the solution",
    ],
    correctAnswerIndex: 1,
    explanation: "Squirting BAC water directly onto the lyophilized powder can damage the peptide's delicate molecular structure. Instead, inject slowly along the vial wall and let it run down gently, then swirl (don't shake) to dissolve.",
  },
  {
    question: "What is the primary reason peptides are cycled (on/off periods)?",
    options: [
      "To save money on peptide costs",
      "Because peptides expire after a few days",
      "To prevent receptor desensitization and maintain effectiveness",
      "Because the body can only absorb peptides every other week",
    ],
    correctAnswerIndex: 2,
    explanation: "Cycling prevents receptor desensitization — prolonged continuous exposure can downregulate the receptors a peptide targets, reducing its effectiveness. Off-cycle periods allow receptors to re-sensitize.",
  },
  {
    question: "What is the typical cycling pattern for Growth Hormone Secretagogues like Ipamorelin?",
    options: [
      "1 week on, 3 weeks off",
      "12 weeks on, 4 weeks off (or 5 days on / 2 days off continuously)",
      "6 months on, 6 months off",
      "No cycling needed — continuous use indefinitely",
    ],
    correctAnswerIndex: 1,
    explanation: "Growth hormone secretagogues like Ipamorelin are typically cycled 12 weeks on / 4 weeks off, or alternatively 5 days on / 2 days off on an ongoing basis to maintain pituitary receptor sensitivity.",
  },
  {
    question: "Why does the Ipamorelin + CJC-1295 stack produce synergistic results?",
    options: [
      "They cancel each other's side effects",
      "They target different receptors (ghrelin receptor and GHRH receptor) to produce a combined GH pulse 3–5x greater than either alone",
      "One is a pill and the other is injectable",
      "They are actually the same peptide in different doses",
    ],
    correctAnswerIndex: 1,
    explanation: "Ipamorelin stimulates GH release through the ghrelin receptor while CJC-1295 stimulates through the GHRH receptor. Acting through two different pathways simultaneously produces a synergistic GH pulse 3–5 times greater than either alone.",
  },
  {
    question: "What temperature should reconstituted peptides be stored at?",
    options: [
      "Room temperature (20–25°C)",
      "Frozen (-20°C)",
      "Refrigerated (2–8°C / 36–46°F)",
      "Body temperature (37°C)",
    ],
    correctAnswerIndex: 2,
    explanation: "Reconstituted peptides MUST be refrigerated at 2–8°C (36–46°F) and used within 28–30 days. They should never be frozen once reconstituted, and room temperature storage degrades them rapidly.",
  },
  {
    question: "If a vial contains 5 mg of peptide reconstituted with 2 mL of BAC water, what volume provides a 250 mcg dose?",
    options: [
      "0.01 mL (1 unit on insulin syringe)",
      "0.1 mL (10 units on insulin syringe)",
      "0.5 mL (50 units on insulin syringe)",
      "1.0 mL (100 units on insulin syringe)",
    ],
    correctAnswerIndex: 1,
    explanation: "Concentration = 5 mg ÷ 2 mL = 2,500 mcg/mL. Dose volume = 250 mcg ÷ 2,500 mcg/mL = 0.1 mL, which equals 10 units on a standard insulin syringe (100 units = 1 mL).",
  },
  {
    question: "Which peptide combination should be AVOIDED?",
    options: [
      "BPC-157 + TB-500 for healing",
      "Ipamorelin + CJC-1295 for GH optimization",
      "Multiple GHRPs targeting the same ghrelin receptor simultaneously",
      "Thymosin Alpha-1 + BPC-157 for immune support",
    ],
    correctAnswerIndex: 2,
    explanation: "Stacking multiple peptides that target the same receptor type (e.g., multiple GHRPs all binding the ghrelin receptor) can cause excessive receptor stimulation and paradoxically reduce the GH response.",
  },
  {
    question: "What is the 'start low, go slow' principle in peptide therapy?",
    options: [
      "Always inject as slowly as possible",
      "Begin with the minimum dose and gradually increase, allowing 5–7 days at each level to assess response",
      "Only take peptides once per month",
      "Start with one peptide and never add more",
    ],
    correctAnswerIndex: 1,
    explanation: "The 'start low, go slow' principle involves beginning at a low dose and gradually titrating upward, allowing 5–7 days at each dose level to assess response and identify the minimum effective dose while minimizing side effects.",
  },
];

export async function seedPeptideProtocols101() {
  console.log("[Peptide 101 Seed] Starting Peptide Protocols 101 training seed...");

  await db
    .insert(trainingTracks)
    .values(peptideProtocols101Track)
    .onConflictDoUpdate({
      target: trainingTracks.id,
      set: {
        title: peptideProtocols101Track.title,
        description: peptideProtocols101Track.description,
        totalModules: peptideProtocols101Track.totalModules,
        estimatedDuration: peptideProtocols101Track.estimatedDuration,
        isActive: true,
      },
    });

  console.log(`[Peptide 101 Seed] Upserted track: ${peptideProtocols101Track.title}`);

  await db.delete(trackModules).where(eq(trackModules.trackId, peptideProtocols101Track.id));

  let modulesUpserted = 0;
  let sectionsInserted = 0;
  let keyPointsInserted = 0;

  for (const mod of peptideProtocols101Modules) {
    await db
      .insert(trainingModules)
      .values(mod)
      .onConflictDoUpdate({
        target: trainingModules.id,
        set: {
          title: mod.title,
          description: mod.description,
          imageUrl: mod.imageUrl,
          category: mod.category,
          sortOrder: mod.sortOrder,
          duration: mod.duration,
          difficulty: mod.difficulty,
          isActive: mod.isActive,
          isInteractive: mod.isInteractive,
          hasQuiz: mod.hasQuiz,
          updatedAt: new Date(),
        },
      });

    modulesUpserted++;
    console.log(`[Peptide 101 Seed] Upserted module: ${mod.title}`);

    await db.delete(trainingModuleSections).where(eq(trainingModuleSections.moduleId, mod.id));
    await db.delete(trainingModuleKeyPoints).where(eq(trainingModuleKeyPoints.moduleId, mod.id));

    const sections = peptideModuleSections[mod.id];
    if (sections) {
      for (let i = 0; i < sections.length; i++) {
        await db.insert(trainingModuleSections).values({
          moduleId: mod.id,
          title: sections[i].title,
          content: sections[i].content,
          sortOrder: i,
        });
        sectionsInserted++;
      }
    }

    const keyPoints = peptideModuleKeyPoints[mod.id];
    if (keyPoints) {
      for (let i = 0; i < keyPoints.length; i++) {
        await db.insert(trainingModuleKeyPoints).values({
          moduleId: mod.id,
          point: keyPoints[i],
          sortOrder: i,
        });
        keyPointsInserted++;
      }
    }

    await db
      .insert(trackModules)
      .values({
        trackId: peptideProtocols101Track.id,
        moduleId: mod.id,
        sortOrder: mod.sortOrder,
      })
      .onConflictDoNothing();
  }

  const quizId = "peptide-protocols-101-quiz";
  await db
    .insert(trainingQuizzes)
    .values({
      id: quizId,
      moduleId: "pp101-stacking-combinations",
      title: "Peptide Protocols 101 Comprehensive Assessment",
      description: "Test your understanding of peptide fundamentals, injection techniques, storage, cycling strategies, and stacking protocols.",
      questions: peptideProtocolsQuizQuestions,
      passingScore: 70,
      isActive: true,
    })
    .onConflictDoUpdate({
      target: trainingQuizzes.id,
      set: {
        title: "Peptide Protocols 101 Comprehensive Assessment",
        questions: peptideProtocolsQuizQuestions,
        passingScore: 70,
        isActive: true,
        updatedAt: new Date(),
      },
    });

  console.log(`[Peptide 101 Seed] Upserted quiz with ${peptideProtocolsQuizQuestions.length} questions`);
  console.log(`[Peptide 101 Seed] Peptide Protocols 101 seed completed: ${modulesUpserted} modules, ${sectionsInserted} sections, ${keyPointsInserted} key points`);

  return {
    success: true,
    track: peptideProtocols101Track.title,
    modules: modulesUpserted,
    sections: sectionsInserted,
    keyPoints: keyPointsInserted,
    quizQuestions: peptideProtocolsQuizQuestions.length,
  };
}
