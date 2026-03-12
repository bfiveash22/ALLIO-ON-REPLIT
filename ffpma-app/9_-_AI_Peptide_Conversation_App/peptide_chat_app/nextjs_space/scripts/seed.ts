import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// 2026 Edition - Private Members Association Peptide Manual (No Duplicates)
const peptides = [
  // ==================== REGENERATIVE & HEALING ====================
  {
    name: "BPC-157",
    discoveryYear: "1992",
    era: "Regenerative & Healing",
    description: "Body Protection Compound-157 is a synthetic peptide derived from human gastric juice protein. Known for powerful healing and regenerative properties, BPC-157 has a strong safety profile for treating injuries, inflammation, and gastrointestinal issues. Widely used in sports medicine among athletes for accelerated recovery.",
    therapeuticUses: ["Tissue and gut healing", "Tendon/ligament repair", "Muscle recovery", "NSAID-induced damage repair", "Inflammatory bowel conditions", "Dopaminergic system modulation", "Wound healing"],
    dosageInfo: "5mg vial: Reconstitute with 1mL BAC water (5mg/mL). Standard: 250-500mcg SubQ 1-2x daily near injury or systemically. Oral: 250-500mcg 2x daily for GI. Loading: 500mcg 2x/day x 4 weeks. Maintenance: 250mcg daily.",
    personaTrait: "The Healer",
    imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400"
  },
  {
    name: "TB-500 (Thymosin Beta-4)",
    discoveryYear: "1960s",
    era: "Regenerative & Healing",
    description: "TB-500 is a synthetic peptide derived from Thymosin Beta-4, naturally found in human and animal tissues. Widely recognized for regenerative properties, promoting healing, reducing inflammation, and enhancing muscle recovery. Popular in sports medicine and rehabilitation.",
    therapeuticUses: ["Systemic tissue repair", "Cardiac regeneration", "Muscle recovery", "Chronic wound healing", "Post-surgical recovery", "Angiogenesis promotion", "Flexibility improvement"],
    dosageInfo: "5mg vial with 1mL BAC water = 5mg/mL. 10mg vial with 1mL = 10mg/mL. Initial Phase: 4-6 weeks weekly (split 3 injections/week ~33 units from 5mg vial). Maintenance: 4-8 additional weeks. SubQ near injury or IM for systemic.",
    personaTrait: "The Regenerator",
    imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400"
  },
  {
    name: "BPC-157/TB-500 Blend",
    discoveryYear: "2010s",
    era: "Regenerative & Healing",
    description: "A synergistic combination of BPC-157 and TB-500 offering complementary healing mechanisms. BPC-157 targets local tissue repair while TB-500 provides systemic regenerative support. Popular for comprehensive injury recovery protocols.",
    therapeuticUses: ["Accelerated injury healing", "Comprehensive tissue repair", "Sports injury recovery", "Post-surgical healing", "Chronic pain management", "Joint health", "Tendon/ligament repair"],
    dosageInfo: "10mg blend vial (5mg each): Reconstitute with 1mL BAC water. Standard: 0.5mL (2.5mg each) SubQ daily or split 2x daily. Loading: Daily x 4 weeks. Maintenance: 2-3x weekly.",
    personaTrait: "The Synergist",
    imageUrl: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=400"
  },
  {
    name: "GHK-Cu",
    discoveryYear: "1973",
    era: "Regenerative & Healing",
    description: "GHK-Cu (Copper Peptide) was discovered by Dr. Loren Pickart. This naturally occurring tripeptide complex with copper promotes wound healing, tissue remodeling, and has potent anti-aging effects. Extensively studied for skin regeneration and hair growth.",
    therapeuticUses: ["Wound healing", "Skin regeneration", "Anti-aging", "Hair growth promotion", "Collagen synthesis", "Anti-inflammatory", "Scar reduction"],
    dosageInfo: "50mg vial: Reconstitute with 2mL BAC water (25mg/mL). Injection: 1-2mg SubQ daily. Topical: 0.5-1% in serums. Can combine with microneedling for enhanced absorption.",
    personaTrait: "The Beautifier",
    imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400"
  },
  {
    name: "LL-37",
    discoveryYear: "1995",
    era: "Regenerative & Healing",
    description: "LL-37 is a human cathelicidin antimicrobial peptide with broad-spectrum antimicrobial activity. Beyond infection fighting, it plays roles in wound healing, angiogenesis, and immune modulation. Promising for biofilm-related infections.",
    therapeuticUses: ["Antimicrobial defense", "Biofilm disruption", "Wound healing", "Immune modulation", "Chronic infection treatment", "Lyme disease protocols", "SIBO treatment"],
    dosageInfo: "5mg vial: Reconstitute with 1mL BAC water. Standard: 50-100mcg SubQ 2-3x weekly. Can cause injection site reactions. Start low and titrate up.",
    personaTrait: "The Defender",
    imageUrl: "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400"
  },
  {
    name: "KPV",
    discoveryYear: "1990s",
    era: "Regenerative & Healing",
    description: "KPV is a tripeptide derived from alpha-MSH with powerful anti-inflammatory properties. It reduces inflammation without immunosuppression, making it valuable for inflammatory conditions, particularly gut-related issues like IBD and colitis.",
    therapeuticUses: ["Anti-inflammatory", "IBD/Colitis treatment", "Gut healing", "Skin inflammation", "Antimicrobial", "Wound healing", "Immune modulation"],
    dosageInfo: "5mg vial: Reconstitute with 1mL BAC water. Injection: 200-500mcg SubQ daily. Oral (for GI): 200-500mcg 1-2x daily. Often combined with BPC-157 for gut protocols.",
    personaTrait: "The Soother",
    imageUrl: "https://images.unsplash.com/photo-1576671081837-49000212a370?w=400"
  },
  {
    name: "KGLOW Blend (KPV/BPC/GHK-Cu/TB4)",
    discoveryYear: "2020s",
    era: "Regenerative & Healing",
    description: "Premium healing and beauty blend combining KPV's anti-inflammatory power, BPC-157's tissue repair, GHK-Cu's regenerative copper peptide benefits, and TB-500's systemic healing. The ultimate skin and tissue rejuvenation stack.",
    therapeuticUses: ["Comprehensive skin rejuvenation", "Anti-aging", "Wound healing", "Tissue regeneration", "Anti-inflammatory", "Collagen production", "Hair restoration support"],
    dosageInfo: "Reconstitute with 2mL BAC water. Standard: 0.5mL SubQ daily or every other day. Can use near treatment area or systemically. 8-12 week cycles recommended.",
    personaTrait: "The Rejuvenator",
    imageUrl: "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=400"
  },

  // ==================== GROWTH HORMONE PEPTIDES ====================
  {
    name: "Tesamorelin",
    discoveryYear: "2010",
    era: "Growth Hormone Peptides",
    description: "Tesamorelin is an FDA-approved GHRH analog for HIV-associated lipodystrophy. It stimulates natural GH release, reducing visceral adipose tissue while improving body composition. Pharmaceutical grade with extensive clinical data.",
    therapeuticUses: ["Visceral fat reduction", "Body recomposition", "Lipodystrophy treatment", "Cognitive support", "Metabolic health", "Anti-aging", "IGF-1 optimization"],
    dosageInfo: "2mg vial: Reconstitute with 2mL BAC water. Standard: 2mg SubQ daily, typically at night. FDA dosing: 2mg daily. 12-26 week cycles. Monitor IGF-1 levels.",
    personaTrait: "The Sculptor",
    imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"
  },
  {
    name: "Ipamorelin",
    discoveryYear: "1998",
    era: "Growth Hormone Peptides",
    description: "Ipamorelin is a selective growth hormone secretagogue with minimal side effects. It provides a controlled GH pulse without significantly affecting cortisol or prolactin. One of the safest GH-releasing peptides available.",
    therapeuticUses: ["GH optimization", "Anti-aging", "Improved sleep", "Fat loss support", "Muscle preservation", "Recovery enhancement", "Bone density support"],
    dosageInfo: "5mg vial: Reconstitute with 1mL BAC water. Standard: 200-300mcg SubQ 2-3x daily. Best on empty stomach, 30 min before meals or at bedtime. Often combined with CJC-1295.",
    personaTrait: "The Optimizer",
    imageUrl: "https://images.unsplash.com/photo-1594381898411-846e7d193883?w=400"
  },
  {
    name: "Sermorelin",
    discoveryYear: "1980s",
    era: "Growth Hormone Peptides",
    description: "Sermorelin is a GHRH analog containing the first 29 amino acids of natural GHRH. FDA-approved for pediatric GH deficiency, it's widely used off-label for adult anti-aging and GH optimization protocols.",
    therapeuticUses: ["GH stimulation", "Anti-aging", "Sleep quality", "Body composition", "Energy enhancement", "Skin health", "Recovery support"],
    dosageInfo: "5mg vial: Reconstitute with 2mL BAC water. Standard: 200-500mcg SubQ at bedtime. Can combine with GHRP. Cycle: 3-6 months on, 1 month off.",
    personaTrait: "The Restorer",
    imageUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400"
  },
  {
    name: "CJC-1295/Ipamorelin Blend",
    discoveryYear: "2000s",
    era: "Growth Hormone Peptides",
    description: "The gold standard GH peptide combination. CJC-1295 (without DAC) provides sustained GHRH stimulation while Ipamorelin triggers GH release. Together they create a synergistic, pulsatile GH increase mimicking natural patterns.",
    therapeuticUses: ["Optimized GH release", "Anti-aging", "Fat loss", "Muscle growth", "Improved sleep", "Recovery", "Skin health"],
    dosageInfo: "Blend vial: Reconstitute with 2mL BAC water. Standard: 100mcg each SubQ 2-3x daily. Best at bedtime and morning fasted. 12-16 week cycles.",
    personaTrait: "The Amplifier",
    imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400"
  },
  {
    name: "Tesamorelin/Ipamorelin Blend",
    discoveryYear: "2010s",
    era: "Growth Hormone Peptides",
    description: "Premium GH optimization blend combining FDA-approved Tesamorelin with Ipamorelin. Provides superior visceral fat reduction and comprehensive GH benefits. Considered a top-tier anti-aging protocol.",
    therapeuticUses: ["Superior fat loss", "Visceral fat targeting", "Anti-aging", "Metabolic optimization", "Body recomposition", "Cognitive support", "Sleep improvement"],
    dosageInfo: "Blend vial: Reconstitute with 2mL BAC water. Standard: Full blend dose SubQ at bedtime. Daily use for 12-26 weeks. Monitor IGF-1 quarterly.",
    personaTrait: "The Elite",
    imageUrl: "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=400"
  },
  {
    name: "HGH (Human Growth Hormone)",
    discoveryYear: "1985",
    era: "Growth Hormone Peptides",
    description: "Recombinant Human Growth Hormone (Somatropin) is the gold standard for GH therapy. FDA-approved for GH deficiency, it provides direct GH supplementation with predictable, dose-dependent results.",
    therapeuticUses: ["GH deficiency treatment", "Anti-aging", "Body composition", "Injury recovery", "Metabolic support", "Bone health", "Quality of life improvement"],
    dosageInfo: "Pharmaceutical: Follow prescriber instructions. Typical anti-aging: 1-2 IU daily SubQ. Performance: 2-4 IU daily. Split doses AM/PM for higher amounts. Monitor IGF-1.",
    personaTrait: "The Foundation",
    imageUrl: "https://images.unsplash.com/photo-1576678927484-cc907957088c?w=400"
  },

  // ==================== METABOLIC & WEIGHT LOSS ====================
  {
    name: "Semaglutide",
    discoveryYear: "2012",
    era: "Metabolic & Weight Loss",
    description: "Semaglutide is an FDA-approved GLP-1 receptor agonist for diabetes and obesity. It reduces appetite, slows gastric emptying, and promotes significant weight loss. Available as Ozempic (diabetes) and Wegovy (obesity).",
    therapeuticUses: ["Weight loss", "Type 2 diabetes", "Appetite control", "Cardiovascular protection", "Blood sugar regulation", "Metabolic syndrome", "NASH/fatty liver"],
    dosageInfo: "5mg vial: Reconstitute with 2mL BAC water. Titration: Week 1-4: 0.25mg weekly. Week 5-8: 0.5mg weekly. Week 9+: 1mg weekly. Max: 2.4mg weekly. SubQ injection.",
    personaTrait: "The Regulator",
    imageUrl: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400"
  },
  {
    name: "Tirzepatide",
    discoveryYear: "2022",
    era: "Metabolic & Weight Loss",
    description: "Tirzepatide is a dual GIP/GLP-1 receptor agonist representing the newest class of metabolic peptides. FDA-approved as Mounjaro/Zepbound, it shows superior weight loss compared to GLP-1 agonists alone in clinical trials.",
    therapeuticUses: ["Superior weight loss", "Type 2 diabetes", "Metabolic optimization", "Appetite control", "Cardiovascular health", "Blood sugar control", "Body recomposition"],
    dosageInfo: "5mg vial: Reconstitute with 1mL BAC water. Titration: Start 2.5mg weekly x 4 weeks. Increase by 2.5mg every 4 weeks as tolerated. Max: 15mg weekly.",
    personaTrait: "The Game-Changer",
    imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400"
  },
  {
    name: "Retatrutide",
    discoveryYear: "2023",
    era: "Metabolic & Weight Loss",
    description: "Retatrutide is a triple agonist targeting GLP-1, GIP, and glucagon receptors. Early trials show potentially superior weight loss to tirzepatide. Currently in Phase 3 trials, it represents the cutting edge of metabolic peptides.",
    therapeuticUses: ["Maximum weight loss", "Metabolic optimization", "Type 2 diabetes", "Appetite suppression", "Energy expenditure", "Cardiovascular health", "Liver fat reduction"],
    dosageInfo: "Research compound. Typical titration protocols similar to tirzepatide. Start low (1-2mg weekly) and titrate up over 8-12 weeks based on tolerance.",
    personaTrait: "The Pioneer",
    imageUrl: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400"
  },
  {
    name: "MOTS-C",
    discoveryYear: "2015",
    era: "Metabolic & Weight Loss",
    description: "MOTS-C is a mitochondrial-derived peptide that acts as an exercise mimetic. It improves metabolic homeostasis, enhances insulin sensitivity, and has been shown to reverse age-related metabolic decline in animal studies.",
    therapeuticUses: ["Metabolic enhancement", "Insulin sensitivity", "Exercise mimetic", "Anti-aging", "Fat oxidation", "Muscle metabolism", "Mitochondrial health"],
    dosageInfo: "5mg vial: Reconstitute with 1mL BAC water. Standard: 5-10mg SubQ 2-3x weekly. Some protocols use daily dosing. Often cycled 8-12 weeks on, 4 weeks off.",
    personaTrait: "The Energizer",
    imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400"
  },
  {
    name: "AICAR",
    discoveryYear: "1980s",
    era: "Metabolic & Weight Loss",
    description: "AICAR (5-Aminoimidazole-4-carboxamide ribonucleotide) is an AMPK activator that mimics exercise at the cellular level. It enhances glucose uptake, fatty acid oxidation, and mitochondrial biogenesis.",
    therapeuticUses: ["Exercise mimetic", "Fat oxidation", "Endurance enhancement", "Glucose metabolism", "Mitochondrial biogenesis", "Metabolic syndrome", "Cardioprotection"],
    dosageInfo: "50mg vial: Reconstitute with 2mL BAC water. Standard: 25-50mg SubQ daily or pre-workout. Advanced: Up to 100mg. Cycle: 4-6 weeks on, 2-4 weeks off.",
    personaTrait: "The Metabolizer",
    imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"
  },
  {
    name: "5-Amino-1MQ",
    discoveryYear: "2017",
    era: "Metabolic & Weight Loss",
    description: "5-Amino-1MQ (5-Amino-1-Methylquinolin-2(1H)-one) is a small molecule that inhibits the NNMT (nicotinamide N-methyltransferase) enzyme. By blocking NNMT, it increases NAD+ levels in cells, boosting cellular energy metabolism and promoting fat cell shrinkage. Research shows it can help reverse diet-induced obesity without affecting food intake, making it a promising peptide for metabolic optimization and body recomposition.",
    therapeuticUses: ["Fat loss", "Metabolic enhancement", "NAD+ restoration", "Cellular energy boost", "Body recomposition", "Anti-aging support", "Adipocyte regulation", "Muscle preservation"],
    dosageInfo: "50mg vial: Reconstitute with 1mL BAC water (50mg/mL). Standard: 50-100mg SubQ daily. Loading phase: 100mg daily x 2 weeks. Maintenance: 50mg daily or 100mg every other day. Cycle: 8-12 weeks on, 4 weeks off. Best taken in the morning before meals.",
    personaTrait: "The Fat Fighter",
    imageUrl: "https://images.unsplash.com/photo-1532384748853-8f54a8f476e2?w=400"
  },


  // ==================== IMMUNE & INFLAMMATION ====================
  {
    name: "Thymosin Alpha-1 (TA-1)",
    discoveryYear: "1977",
    era: "Immune & Inflammation",
    description: "Thymosin Alpha-1 is a naturally occurring thymic peptide that modulates immune function. FDA-approved in 35+ countries as Zadaxin, it enhances T-cell function and is used for chronic infections, cancer support, and immune optimization.",
    therapeuticUses: ["Immune enhancement", "Chronic viral infections", "Cancer adjunct therapy", "Vaccine response enhancement", "Chronic fatigue", "Autoimmune modulation", "Hepatitis B/C support"],
    dosageInfo: "5mg vial: Reconstitute with 1mL BAC water. Standard: 1.6mg SubQ 2x weekly. Acute infections: Daily dosing. Cancer protocols: Per oncologist guidance.",
    personaTrait: "The Guardian",
    imageUrl: "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400"
  },
  {
    name: "ARA 290 10mg Injectable",
    discoveryYear: "2000s",
    era: "Immune & Inflammation",
    description: "ARA 290 is an 11-amino acid peptide derived from the tissue-protective domain of erythropoietin (EPO). Unlike EPO, it does not stimulate red blood cell production, making it safe for long-term use without hematologic side effects. ARA 290 selectively activates the Innate Repair Receptor (IRR), a heterodimer of EPOR and CD131, triggering powerful anti-inflammatory, neuroprotective, and tissue-regenerative pathways. Clinical trials show remarkable efficacy in diabetic neuropathy, sarcoidosis-related small fiber neuropathy, and chronic inflammatory conditions. It reduces pro-inflammatory cytokines while promoting nerve fiber regeneration and metabolic recovery.",
    therapeuticUses: ["Diabetic neuropathy", "Small fiber neuropathy", "Neuroprotection", "Chronic inflammatory conditions", "Sarcoidosis", "Tissue repair & regeneration", "Metabolic recovery", "Post-injury healing", "Chronic pain syndromes", "Corneal nerve regeneration"],
    dosageInfo: "10mg vial: Reconstitute with 2mL BAC water (5mg/mL). Standard: 2-4mg SubQ daily. Neuropathy protocol: 4mg SubQ daily for 28 days, repeat after 2-week washout if needed. Maintenance: 2mg SubQ 3x weekly. Sarcoidosis: 4mg daily x 28 days per clinical trials. Store reconstituted peptide refrigerated, use within 30 days. Inject SubQ in abdomen or thigh.",
    personaTrait: "The Nerve Healer",
    imageUrl: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=400"
  },
  {
    name: "Thymogen",
    discoveryYear: "1990s",
    era: "Immune & Inflammation",
    description: "Thymogen is a Khavinson bioregulator dipeptide (EW - Glu-Trp) targeting thymus function. It restores immune system balance, enhances T-cell production, and is used for immunodeficiency and chronic infections in Russian medicine.",
    therapeuticUses: ["Immune restoration", "T-cell enhancement", "Chronic infections", "Post-radiation recovery", "Immunodeficiency", "Anti-aging", "Thymus regeneration"],
    dosageInfo: "10mg vial: Reconstitute with 1mL BAC water. Standard: 100mcg IM daily x 10 days. Maintenance: Monthly courses. Also available as nasal spray or sublingual.",
    personaTrait: "The Immunologist",
    imageUrl: "https://images.unsplash.com/photo-1576671081837-49000212a370?w=400"
  },

  // ==================== COGNITIVE & NEUROPROTECTIVE ====================
  {
    name: "Semax",
    discoveryYear: "1982",
    era: "Cognitive & Neuroprotective",
    description: "Semax is a Russian-developed synthetic peptide based on ACTH(4-10) with potent nootropic and neuroprotective properties. It enhances BDNF, improves cognitive function, and is approved in Russia for stroke and cognitive disorders.",
    therapeuticUses: ["Cognitive enhancement", "Neuroprotection", "Stroke recovery", "ADHD support", "Memory improvement", "Anxiety reduction", "Brain injury recovery"],
    dosageInfo: "5mg vial: Reconstitute with 1mL BAC water. Nasal: 200-600mcg 2-3x daily. Injectable: 100-500mcg SubQ daily. Cycles: 2-4 weeks on, 2 weeks off.",
    personaTrait: "The Cognitor",
    imageUrl: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=400"
  },
  {
    name: "Selank",
    discoveryYear: "1990s",
    era: "Cognitive & Neuroprotective",
    description: "Selank is a synthetic peptide developed from tuftsin with anxiolytic and nootropic properties. It modulates GABA, serotonin, and dopamine systems. Approved in Russia for anxiety and cognitive enhancement.",
    therapeuticUses: ["Anxiety reduction", "Cognitive enhancement", "Stress resilience", "Mood stabilization", "Memory support", "Immune modulation", "Depression support"],
    dosageInfo: "5mg vial: Reconstitute with 1mL BAC water. Nasal: 200-400mcg 2-3x daily. Injectable: 100-300mcg SubQ daily. Can use continuously for 2-4 weeks.",
    personaTrait: "The Calmer",
    imageUrl: "https://images.unsplash.com/photo-1598301257982-0cf014dabbcd?w=400"
  },
  {
    name: "Pinealon",
    discoveryYear: "2000s",
    era: "Cognitive & Neuroprotective",
    description: "Pinealon is a Khavinson bioregulator tripeptide (EDR - Glu-Asp-Arg) that targets brain tissue and the pineal gland. It promotes neurogenesis, protects neurons, and supports healthy sleep-wake cycles.",
    therapeuticUses: ["Neuroprotection", "Cognitive enhancement", "Sleep regulation", "Anti-aging brain support", "Melatonin optimization", "Memory support", "Circadian rhythm"],
    dosageInfo: "10mg vial: Reconstitute with 1mL BAC water. Standard: 10-20mcg SubQ or IM daily x 10-20 days. Also available as capsules. Cycle every 3-6 months.",
    personaTrait: "The Neurologist",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"
  },
  {
    name: "P21 (Cerebrolysin Fragment)",
    discoveryYear: "2000s",
    era: "Cognitive & Neuroprotective",
    description: "P21 is a synthetic peptide modeled after Cerebrolysin, mimicking CNTF (Ciliary Neurotrophic Factor). It promotes neurogenesis, enhances learning and memory, and has potential for neurodegenerative conditions.",
    therapeuticUses: ["Neurogenesis", "Cognitive enhancement", "Memory improvement", "Learning enhancement", "Neuroprotection", "Depression support", "Brain injury recovery"],
    dosageInfo: "Research peptide. Typical: 500mcg-1mg intranasal daily. Injectable: Similar doses SubQ. Cycles: 4 weeks on, 2-4 weeks off.",
    personaTrait: "The Regenerator",
    imageUrl: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=400"
  },
  {
    name: "PE-22-28",
    discoveryYear: "2010s",
    era: "Cognitive & Neuroprotective",
    description: "PE-22-28 is a synthetic peptide derived from the brain peptide Spadin with antidepressant properties. It blocks TREK-1 potassium channels, mimicking the mechanism of some antidepressants without typical side effects.",
    therapeuticUses: ["Depression support", "Cognitive enhancement", "Neuroplasticity", "Stress resilience", "Memory improvement", "Mood enhancement", "Anxiety support"],
    dosageInfo: "Research peptide. Typical: 500mcg-1mg intranasal or SubQ daily. Often combined with Semax or Selank. Cycles: 2-4 weeks.",
    personaTrait: "The Uplifter",
    imageUrl: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400"
  },
  {
    name: "Humanin",
    discoveryYear: "2001",
    era: "Cognitive & Neuroprotective",
    description: "Humanin is a mitochondrial-derived peptide with powerful cytoprotective effects. It protects cells from stress and apoptosis, particularly neurons. Shows promise for Alzheimer's, metabolic disorders, and longevity.",
    therapeuticUses: ["Neuroprotection", "Anti-apoptotic", "Alzheimer's support", "Metabolic regulation", "Cardioprotection", "Anti-aging", "Mitochondrial health"],
    dosageInfo: "Research peptide. Typical: 100-500mcg SubQ daily. Some protocols use higher doses. Cycling recommended: 8-12 weeks on, 4 weeks off.",
    personaTrait: "The Preserver",
    imageUrl: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400"
  },
  {
    name: "DSIP (Delta Sleep-Inducing Peptide)",
    discoveryYear: "1977",
    era: "Cognitive & Neuroprotective",
    description: "DSIP is a neuropeptide that promotes delta wave sleep and regulates circadian rhythms. It improves sleep quality without morning grogginess and has stress-protective and pain-relieving properties.",
    therapeuticUses: ["Sleep improvement", "Insomnia treatment", "Stress reduction", "Pain relief", "Circadian regulation", "Withdrawal support", "Anti-aging"],
    dosageInfo: "5mg vial: Reconstitute with 1mL BAC water. Standard: 100-300mcg SubQ at bedtime. Can use nightly for 2-4 weeks. Some use intermittently as needed.",
    personaTrait: "The Dreamer",
    imageUrl: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400"
  },
  {
    name: "Cerebrolysin",
    discoveryYear: "1949",
    era: "Cognitive & Neuroprotective",
    description: "Cerebrolysin is a brain-derived peptide complex extracted from pig brain tissue, containing neurotrophic factors (NGF, BDNF-like). Used clinically for stroke recovery, traumatic brain injury, dementia, and cognitive enhancement. Improves neuroplasticity and neuronal survival.",
    therapeuticUses: ["Stroke recovery", "Traumatic brain injury", "Dementia support", "Cognitive enhancement", "Neuroplasticity", "Alzheimer's support", "Parkinson's support", "Memory improvement"],
    dosageInfo: "Injectable solution (215.2mg/mL). Clinical: 5-30mL IV or IM daily for 10-20 days. Some protocols use 2-5mL IM 3-5x/week. Always under medical supervision. Cycles vary by condition.",
    personaTrait: "The Restorer",
    imageUrl: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400"
  },
  {
    name: "Klotho",
    discoveryYear: "1997",
    era: "Cognitive & Neuroprotective",
    description: "Klotho is an anti-aging protein/peptide that declines with age. It enhances cognition, protects against neurodegeneration, regulates calcium/phosphate metabolism, and extends lifespan in animal models. Shows remarkable cognitive benefits even from single doses.",
    therapeuticUses: ["Cognitive enhancement", "Anti-aging", "Neuroprotection", "Kidney protection", "Cardiovascular health", "Lifespan extension", "Memory improvement", "Metabolic regulation"],
    dosageInfo: "Research peptide. Emerging protocols suggest low-dose SubQ administration. Clinical trials ongoing. Consult specialized practitioners for current dosing strategies.",
    personaTrait: "The Eternal",
    imageUrl: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=400"
  },

  // ==================== SEXUAL HEALTH ====================
  {
    name: "PT-141 (Bremelanotide)",
    discoveryYear: "2019",
    era: "Sexual Health",
    description: "PT-141 (Bremelanotide/Vyleesi) is an FDA-approved melanocortin receptor agonist for hypoactive sexual desire disorder. Unlike PDE5 inhibitors, it works centrally in the brain to increase sexual desire in both men and women.",
    therapeuticUses: ["Sexual desire enhancement", "Erectile dysfunction", "Female sexual dysfunction", "Libido enhancement", "Sexual arousal"],
    dosageInfo: "10mg vial: Reconstitute with 2mL BAC water. Standard: 1-2mg SubQ 45 min before activity. Max: 2mg per dose, 8 doses/month. Can cause nausea initially.",
    personaTrait: "The Igniter",
    imageUrl: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400"
  },
  {
    name: "Melanotan II",
    discoveryYear: "1991",
    era: "Sexual Health",
    description: "Melanotan II is a synthetic melanocortin peptide originally developed for tanning. It also increases libido and can help with erectile function. Popular for cosmetic tanning and sexual enhancement.",
    therapeuticUses: ["Skin tanning", "Libido enhancement", "Erectile support", "Fat loss support", "UV protection enhancement"],
    dosageInfo: "10mg vial: Reconstitute with 2mL BAC water. Loading: 0.25-0.5mg SubQ daily x 1-2 weeks. Maintenance: 0.5mg 1-2x weekly for tan. Start low to assess tolerance.",
    personaTrait: "The Bronzer",
    imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400"
  },
  {
    name: "Kisspeptin",
    discoveryYear: "1996",
    era: "Sexual Health",
    description: "Kisspeptin is a naturally occurring hormone that plays a crucial role in reproductive hormone regulation. It stimulates GnRH release, affecting LH, FSH, and downstream sex hormones. Used in fertility research.",
    therapeuticUses: ["Fertility support", "Testosterone optimization", "LH/FSH stimulation", "Reproductive research", "PCOS support", "Hormonal regulation"],
    dosageInfo: "Research peptide. Typical: 0.1-1mcg/kg IV or SubQ. Used primarily in clinical research settings. Dosing highly variable based on application.",
    personaTrait: "The Fertility Enhancer",
    imageUrl: "https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?w=400"
  },
  {
    name: "Oxytocin",
    discoveryYear: "1952",
    era: "Sexual Health",
    description: "Oxytocin is the 'love hormone' - a naturally occurring neuropeptide involved in social bonding, intimacy, and reproduction. Pharmaceutical grade is used for labor induction; research focuses on social/psychological effects.",
    therapeuticUses: ["Social bonding", "Intimacy enhancement", "Anxiety reduction", "Autism research", "Trust enhancement", "Sexual function", "Stress reduction"],
    dosageInfo: "Nasal spray: 20-40 IU intranasally. Injectable forms available. Typically used as needed for social/intimacy situations. Effects last 1-3 hours.",
    personaTrait: "The Connector",
    imageUrl: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400"
  },
  {
    name: "Testagen",
    discoveryYear: "2000s",
    era: "Sexual Health",
    description: "Testagen is a Khavinson bioregulator peptide complex targeting testicular function. It supports healthy testosterone production, improves spermatogenesis, and helps maintain male reproductive health with aging.",
    therapeuticUses: ["Testosterone support", "Male fertility", "Spermatogenesis", "Testicular health", "Anti-aging for men", "Libido support", "Hormonal balance"],
    dosageInfo: "Typically 10mg vial: Reconstitute with 1mL BAC water. Standard: 10-20mcg IM daily x 10 days. Repeat course every 3-6 months. Also available orally.",
    personaTrait: "The Masculinizer",
    imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400"
  },

  // ==================== ANTI-AGING & LONGEVITY ====================
  {
    name: "Epithalon (Epitalon)",
    discoveryYear: "2003",
    era: "Anti-Aging & Longevity",
    description: "Epithalon is a tetrapeptide bioregulator developed by Dr. Vladimir Khavinson. It activates telomerase, potentially lengthening telomeres and extending cellular lifespan. The cornerstone of bioregulator anti-aging protocols.",
    therapeuticUses: ["Telomerase activation", "Anti-aging", "Pineal gland support", "Melatonin optimization", "Sleep improvement", "Immune enhancement", "Cancer prevention research"],
    dosageInfo: "10mg vial: Reconstitute with 1mL BAC water. Standard: 5-10mg SubQ daily x 10-20 days. Repeat course every 4-6 months. Injectable preferred for bioavailability.",
    personaTrait: "The Immortalist",
    imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400"
  },
  {
    name: "Pineal/Epitalon Blend",
    discoveryYear: "2010s",
    era: "Anti-Aging & Longevity",
    description: "A synergistic combination of Epitalon and Pinealon for comprehensive pineal gland and anti-aging support. Epitalon activates telomerase while Pinealon provides direct neuroprotection and circadian regulation.",
    therapeuticUses: ["Comprehensive anti-aging", "Pineal optimization", "Telomere support", "Sleep enhancement", "Melatonin production", "Neuroprotection", "Circadian health"],
    dosageInfo: "Blend vial: Reconstitute with 1mL BAC water. Standard: Full dose SubQ daily x 10-20 days. Course every 4-6 months. Best taken at bedtime.",
    personaTrait: "The Timekeeper",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"
  },
  {
    name: "NAD+",
    discoveryYear: "1906",
    era: "Anti-Aging & Longevity",
    description: "NAD+ (Nicotinamide Adenine Dinucleotide) is a critical coenzyme for cellular energy and DNA repair. Levels decline with age, and supplementation aims to restore youthful cellular function. A cornerstone of longevity medicine.",
    therapeuticUses: ["Cellular energy", "DNA repair", "Anti-aging", "Cognitive function", "Addiction recovery", "Metabolic health", "Mitochondrial function"],
    dosageInfo: "IV: 250-500mg over 2-4 hours initially. SubQ: 50-100mg daily. IM: 100-200mg. Start low - can cause intense flushing/nausea. Cycle: Varies by protocol.",
    personaTrait: "The Revitalizer",
    imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400"
  },
  {
    name: "SS-31 (Elamipretide)",
    discoveryYear: "2004",
    era: "Anti-Aging & Longevity",
    description: "SS-31 is a mitochondria-targeted peptide that penetrates and stabilizes the inner mitochondrial membrane. It reduces oxidative stress, improves energy production, and is in clinical trials for mitochondrial diseases.",
    therapeuticUses: ["Mitochondrial support", "Energy enhancement", "Heart failure support", "Anti-aging", "Exercise tolerance", "Muscle function", "Neuroprotection"],
    dosageInfo: "Research peptide. Typical: 10-40mg SubQ daily. Clinical trials used IV infusion. Ongoing research for optimal dosing. Cycles: 4-8 weeks.",
    personaTrait: "The Powerhouse",
    imageUrl: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400"
  },
  {
    name: "FOXO4-DRI",
    discoveryYear: "2017",
    era: "Anti-Aging & Longevity",
    description: "FOXO4-DRI is a senolytic peptide that selectively triggers apoptosis in senescent ('zombie') cells by disrupting FOXO4-p53 binding. It's part of the emerging field of senolytics for rejuvenation and healthspan extension.",
    therapeuticUses: ["Senescent cell clearance", "Anti-aging", "Tissue rejuvenation", "Healthspan extension", "Fibrosis reduction", "Rejuvenation research"],
    dosageInfo: "Expensive research peptide. Typical: 5mg/kg IV or SubQ. Dosing: 3x over 3 weeks, then monthly maintenance. Requires careful clinical oversight.",
    personaTrait: "The Clearer",
    imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400"
  },

  // ==================== KHAVINSON BIOREGULATORS ====================
  {
    name: "Ovagen",
    discoveryYear: "2000s",
    era: "Anti-Aging & Longevity",
    description: "Ovagen is a Khavinson bioregulator tripeptide targeting liver and gastrointestinal tissue. It helps restore hepatic function, supports detoxification, and promotes healthy liver regeneration.",
    therapeuticUses: ["Liver support", "Hepatoprotection", "Detoxification", "GI health", "Metabolic support", "Fatty liver support", "Anti-aging"],
    dosageInfo: "10mg vial: Reconstitute with 1mL BAC water. Standard: 10-20mcg IM daily x 10-20 days. Repeat course every 3-6 months. Also available as capsules.",
    personaTrait: "The Detoxifier",
    imageUrl: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400"
  },
  {
    name: "Livagen",
    discoveryYear: "2000s",
    era: "Anti-Aging & Longevity",
    description: "Livagen is a Khavinson tetrapeptide (AEDR) that decondenses chromatin and activates gene transcription. It has broad anti-aging effects by restoring epigenetic regulation and supporting overall cellular function.",
    therapeuticUses: ["Chromatin regulation", "Gene activation", "Anti-aging", "Liver support", "Immune enhancement", "Cellular rejuvenation", "Epigenetic support"],
    dosageInfo: "10mg vial: Reconstitute with 1mL BAC water. Standard: 10-20mcg SubQ or IM daily x 10-20 days. Course every 3-6 months.",
    personaTrait: "The Activator",
    imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400"
  },
  {
    name: "Cardiogen",
    discoveryYear: "2000s",
    era: "Anti-Aging & Longevity",
    description: "Cardiogen is a Khavinson bioregulator tripeptide specifically targeting cardiac tissue. It supports heart muscle regeneration, improves cardiac function, and is part of comprehensive cardiovascular anti-aging protocols.",
    therapeuticUses: ["Cardiac support", "Heart muscle regeneration", "Post-MI recovery", "Cardiovascular anti-aging", "Heart failure support", "Athletic heart protection"],
    dosageInfo: "10mg vial: Reconstitute with 1mL BAC water. Standard: 10-20mcg IM daily x 10-20 days. Course every 3-6 months. Critical to combine with lifestyle optimization.",
    personaTrait: "The Cardioprotector",
    imageUrl: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400"
  },
  {
    name: "Cartalax",
    discoveryYear: "2000s",
    era: "Anti-Aging & Longevity",
    description: "Cartalax is a Khavinson bioregulator tripeptide (AED) targeting cartilage and musculoskeletal tissues. It promotes cartilage regeneration, supports joint health, and is valuable for osteoarthritis and aging joints.",
    therapeuticUses: ["Cartilage regeneration", "Joint health", "Osteoarthritis support", "Musculoskeletal anti-aging", "Sports injury recovery", "Spine health", "Mobility support"],
    dosageInfo: "10mg vial: Reconstitute with 1mL BAC water. Standard: 10-20mcg IM daily x 10-20 days. Course every 3-6 months. Often combined with BPC-157/TB-500.",
    personaTrait: "The Joint Restorer",
    imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400"
  },
  {
    name: "Pancragen",
    discoveryYear: "2000s",
    era: "Anti-Aging & Longevity",
    description: "Pancragen is a Khavinson bioregulator tetrapeptide targeting pancreatic tissue. It supports healthy insulin production, helps maintain beta-cell function, and is used in metabolic and diabetes prevention protocols.",
    therapeuticUses: ["Pancreatic support", "Beta-cell preservation", "Insulin optimization", "Diabetes prevention", "Metabolic health", "Blood sugar regulation", "Anti-aging"],
    dosageInfo: "10mg vial: Reconstitute with 1mL BAC water. Standard: 10-20mcg IM daily x 10-20 days. Course every 3-6 months. Monitor glucose levels.",
    personaTrait: "The Pancreatic Guardian",
    imageUrl: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=400"
  },

  // ==================== SPECIALTY & RESEARCH ====================
  {
    name: "PNC-27",
    discoveryYear: "2000s",
    era: "Cancer & Specialized",
    description: "PNC-27 is a research peptide containing a p53 binding domain that selectively targets cancer cells expressing HDM-2. It induces necrosis in cancer cells while leaving normal cells unaffected. Experimental oncology compound.",
    therapeuticUses: ["Cancer research", "Selective tumor targeting", "Oncology support", "Experimental therapy"],
    dosageInfo: "Research compound. Protocols vary by study. Requires oncology guidance. Not for self-administration. Used in clinical research settings only.",
    personaTrait: "The Targeter",
    imageUrl: "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400"
  },
  {
    name: "HEP-1 (Human Ezrin Peptide)",
    discoveryYear: "2010s",
    era: "Cancer & Specialized",
    description: "HEP-1 is a hepatoprotective peptide derived from human ezrin protein. It protects liver cells from damage, promotes regeneration, and is being researched for liver disease and chemotherapy-induced liver injury.",
    therapeuticUses: ["Hepatoprotection", "Liver regeneration", "Chemotherapy support", "Liver disease", "Fatty liver", "Detoxification support"],
    dosageInfo: "Research peptide. Typical: 10-50mcg SubQ daily. Treatment courses vary. Used in clinical research for liver conditions.",
    personaTrait: "The Liver Guardian",
    imageUrl: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400"
  },
  {
    name: "ACE-031",
    discoveryYear: "2000s",
    era: "Cancer & Specialized",
    description: "ACE-031 is a soluble form of activin receptor type IIB that acts as a myostatin inhibitor. It promotes muscle growth and strength by blocking myostatin signaling. Studied for muscular dystrophy and muscle wasting.",
    therapeuticUses: ["Muscle growth", "Muscular dystrophy research", "Cachexia support", "Strength enhancement", "Sarcopenia", "Muscle wasting conditions"],
    dosageInfo: "Research compound. Clinical trials used IV infusion. Dosing protocols vary. Requires medical supervision. Not widely available.",
    personaTrait: "The Muscle Builder",
    imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400"
  },
  {
    name: "Follistatin",
    discoveryYear: "1987",
    era: "Cancer & Specialized",
    description: "Follistatin is a naturally occurring glycoprotein that binds and neutralizes myostatin and activin. It promotes muscle growth, enhances recovery, and is researched for muscle wasting conditions and performance enhancement.",
    therapeuticUses: ["Myostatin inhibition", "Muscle growth", "Recovery enhancement", "Sarcopenia support", "Athletic performance", "Muscle wasting"],
    dosageInfo: "Requires acetic acid reconstitution. Typical: 100-300mcg SubQ daily or EOD. Expensive and requires careful handling. Cycle: 4-8 weeks.",
    personaTrait: "The Amplifier",
    imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400"
  }
];

// ==================== IV THERAPIES ====================
const ivTherapies = [
  {
    name: "EDTA Chelation Therapy",
    category: "Detoxification",
    description: "EDTA (Ethylenediaminetetraacetic acid) is a powerful chelating agent used to remove heavy metals like lead, mercury, cadmium, and calcium deposits from the body. It improves circulation by addressing arterial plaque and is a cornerstone of integrative cardiovascular and detox protocols.",
    benefits: ["Heavy metal detoxification", "Cardiovascular support", "Improved circulation", "Arterial plaque reduction", "Kidney support", "Anti-aging benefits"],
    dosageRange: "1,500-3,000 mg per session. Up to 50 mg/kg (max 3,000 mg) based on patient weight.",
    dilution: "Dilute in 500 mL normal saline (0.9% NaCl). 250 mL may be used for smaller doses or sensitive patients.",
    infusionTime: "2-3 hours (slow drip)",
    frequency: "1-2 times weekly, individualized per protocol",
    phases: JSON.stringify({ initial: "1-2 infusions weekly for 6-12 weeks", maintenance: "Weekly to biweekly for 2-4 months", longevity: "Monthly or quarterly, adjusted per lab results" }),
    monitoring: "BUN, creatinine, electrolytes (especially calcium & magnesium)",
    precautions: "Contraindicated in severe renal impairment or hypocalcemia. Slow infusion minimizes risk of hypocalcemia or arrhythmias.",
    adjuncts: "Administer adjuncts AFTER EDTA infusion. Do not mix in same bag. Common adjuncts: magnesium, B-complex, vitamin C, trace minerals.",
    notes: "Maintain adequate hydration before and after infusion. Replete essential minerals post-treatment. Label infusion with concentration, date, and patient identifier.",
    personaTrait: "The Purifier"
  },
  {
    name: "Myers' Cocktail",
    category: "General Wellness",
    description: "The Myers' Cocktail is the gold standard IV nutrient therapy developed by Dr. John Myers. This comprehensive blend of vitamins and minerals supports energy, immunity, and overall wellness. Popular for fatigue, migraines, fibromyalgia, and general health optimization.",
    benefits: ["Energy enhancement", "Immune support", "Migraine relief", "Fibromyalgia support", "Athletic recovery", "Nutrient repletion", "Stress reduction"],
    dosageRange: "Per 10 mL FF PMA Myers: Vitamin C 7.5g, Hydroxocobalamin 200mcg, Pyridoxine 250mg, Pantothenate 500mg, Mag. Sulfate 5mg, Mag. Chloride 1.6g, Thiamine 150mg, Riboflavin 25mg, Nicotinamide 250mg, Selenium 25mcg, Copper 0.5mcg, Chromium 4mcg, Zinc 5mg",
    dilution: "Usually prepared in 250 mL normal saline (0.9% NaCl). Adjust volume based on tolerance.",
    infusionTime: "30-60 minutes (slow, comfortable rate)",
    frequency: "Weekly or as clinically indicated",
    phases: JSON.stringify({ initial: "Weekly infusions for 4-6 weeks", maintenance: "Every 2-4 weeks", longevity: "Monthly for ongoing wellness" }),
    monitoring: "Serum electrolytes if frequent dosing",
    precautions: "Use carefully in patients with renal impairment (magnesium & calcium load). Observe for warmth or flushing during infusion; slow rate if needed.",
    adjuncts: "Common adjuncts after Myers: glutathione push, additional vitamin C, or NAD+ to enhance energy metabolism and cellular recovery.",
    notes: "Confirm compatibility of all ingredients prior to compounding. Use sterile technique. Label with formulation details, date, and initials.",
    personaTrait: "The Energizer"
  },
  {
    name: "High Dose Vitamin C",
    category: "Immune & Oncology Support",
    description: "High dose intravenous Vitamin C (ascorbic acid) delivers therapeutic concentrations impossible through oral supplementation. At high doses, Vitamin C acts as a pro-oxidant that selectively targets abnormal cells while supporting immune function, collagen synthesis, and overall wellness.",
    benefits: ["Immune enhancement", "Oncology support", "Antioxidant protection", "Collagen synthesis", "Wound healing", "Fatigue reduction", "Infection support"],
    dosageRange: "Starting: 25g in 500mL saline. Max: 70g in 1000mL saline. Therapeutic range: 25-50g, titrated upward.",
    dilution: "500 mL NS for 25g, 1000 mL NS for 70g. Add: Magnesium chloride + Calcium chloride 10% at 3.5 mL per 25g Vit C.",
    infusionTime: "1.5-3 hours (slower at higher doses)",
    frequency: "1-3 times weekly based on protocol",
    phases: JSON.stringify({ initial: "25g in 500mL, assess tolerance & labs", maintenance: "25-50g 1-2x weekly for 1-3 months", longevity: "Monthly as indicated for support" }),
    monitoring: "G6PD screening REQUIRED before first infusion. BUN, creatinine, electrolytes.",
    precautions: "CONTRAINDICATED in G6PD deficiency, renal impairment, or history of kidney stones. Magnesium & calcium added to reduce burning/irritation.",
    adjuncts: "Administer after Vitamin C infusion. Do NOT mix in same bag. Ozonated glycerin should NOT be administered same day as Vitamin C. Common adjuncts: glutathione (post-infusion), B-complex, trace minerals.",
    notes: "Encourage hydration before and after. Use light-protected tubing for prolonged infusion. Label with dose, volume, and date.",
    personaTrait: "The Immunity Booster"
  },
  {
    name: "Glutathione IV Push",
    category: "Detoxification",
    description: "Glutathione is the master antioxidant, critical for detoxification, immune function, and cellular protection. IV delivery bypasses GI degradation to provide direct cellular support. Often used as a 'push' following other IV therapies for synergistic benefit.",
    benefits: ["Master antioxidant", "Liver detoxification", "Skin brightening", "Heavy metal binding", "Immune support", "Anti-aging", "Mitochondrial protection"],
    dosageRange: "600-2,000 mg per infusion. Higher doses (up to 4,000 mg) for oxidative stress and detox protocols.",
    dilution: "Typically diluted in 50-100 mL normal saline (0.9% NaCl). Often administered as IV push following larger infusion (e.g., Vitamin C or Myers').",
    infusionTime: "Slow IV push: 10-20 minutes. Or drip infusion: 50-100 mL saline over 20-30 minutes.",
    frequency: "1-3 times weekly, individualized",
    phases: JSON.stringify({ initial: "600-1,200 mg 2-3x weekly", maintenance: "1,200-2,000 mg weekly", longevity: "1,200-2,000 mg monthly for ongoing support" }),
    monitoring: "Liver function during long-term use",
    precautions: "Generally well tolerated. CAUTION in asthmatic patients (may trigger mild bronchospasm).",
    adjuncts: "Administer after Glutathione or other primary infusions. Common synergies: Myers' cocktail, NAD+, or ozone therapy for enhanced antioxidant and cellular support.",
    notes: "Use PRESERVATIVE-FREE glutathione. Prepare freshly before infusion. Label with dose, date, and initials.",
    personaTrait: "The Master Antioxidant"
  },
  {
    name: "NAD+ IV Therapy",
    category: "Anti-Aging & Cellular Repair",
    description: "NAD+ (Nicotinamide Adenine Dinucleotide) is essential for cellular energy production and DNA repair. Levels decline with age, and IV replenishment restores mitochondrial function, supports brain health, and is increasingly used for addiction recovery and anti-aging protocols.",
    benefits: ["Cellular energy restoration", "DNA repair", "Brain fog relief", "Addiction recovery support", "Anti-aging", "Mitochondrial function", "Metabolic optimization"],
    dosageRange: "250-750 mg per infusion. Therapeutic range: 250-1,000 mg depending on indication.",
    dilution: "Dilute in 250-500 mL normal saline (0.9% NaCl). Concentration adjusted per tolerance and infusion duration.",
    infusionTime: "2-4 hours (higher doses may require 6+ hours)",
    frequency: "1-2 times weekly during initial phase",
    phases: JSON.stringify({ initial: "250-500 mg 1-2x weekly for 4-6 weeks", maintenance: "500-750 mg every 1-4 weeks", longevity: "250-500 mg monthly for anti-aging support" }),
    monitoring: "Heart rate, comfort level, and tolerance throughout infusion",
    precautions: "Rapid infusion may cause: Flushing, chest tightness, light-headedness, or anxiety. Action: Slow or pause infusion if symptoms occur.",
    adjuncts: "Administer after NAD+ infusion. Common adjuncts: Myers' cocktail, B-complex, Vitamin C, or glutathione to enhance mitochondrial recovery.",
    notes: "Encourage hydration before and after. Use light-protected tubing if prolonged infusion. Label with dose, volume, and date.",
    personaTrait: "The Cellular Revitalizer"
  },
  {
    name: "Hydrogen Peroxide IV",
    category: "Oxidative Therapy",
    description: "Hydrogen Peroxide IV therapy delivers controlled oxidative stress to stimulate immune function and oxygenation. Used for chronic infections, immune support, and as part of oxidative medicine protocols. Requires careful preparation and administration.",
    benefits: ["Immune stimulation", "Increased oxygenation", "Chronic infection support", "Antimicrobial effects", "Circulation improvement", "Oxidative balance"],
    dosageRange: "Standard: 3.7% hydrogen peroxide (diluted before infusion). Final concentration: ~0.03% in IV fluid. Starting dose: 0.5 mL of 3.7% in 250 mL saline; titrate upward gradually.",
    dilution: "Dilute in 250-500 mL normal saline (0.9% NaCl). Adjust volume to achieve final concentration of ~0.03% hydrogen peroxide.",
    infusionTime: "60-90 minutes",
    frequency: "1-2 times weekly, individualized per response",
    phases: JSON.stringify({ initial: "0.5 mL of 3.7% in 250 mL saline; assess tolerance", maintenance: "1-2 mL of 3.7% in 250-500 mL saline weekly/biweekly", longevity: "Monthly for immune and oxidative support" }),
    monitoring: "Oxygenation, pulmonary status, renal function",
    precautions: "CONTRAINDICATED: COPD, emphysema, poor lung capacity, oxidative stress disorders. Use carefully in cardiovascular instability.",
    adjuncts: "Administer after H2O2 infusion. Do not mix in same bag. Common adjuncts: vitamin C, minerals, antioxidants, glutathione for redox balance.",
    notes: "Use ONLY medical-grade hydrogen peroxide (3.7%). Strict aseptic preparation required. Label clearly with dilution, date, and initials.",
    personaTrait: "The Oxygenator"
  },
  {
    name: "DMSO IV Therapy",
    category: "Anti-Inflammatory & Pain",
    description: "DMSO (Dimethyl Sulfoxide) is a powerful anti-inflammatory and penetrating agent that carries therapeutic compounds across cell membranes. IV administration provides systemic anti-inflammatory effects and is used for interstitial cystitis, pain, and inflammatory conditions.",
    benefits: ["Potent anti-inflammatory", "Pain relief", "Membrane penetration", "Interstitial cystitis support", "Neuroprotection", "Free radical scavenging"],
    dosageRange: "Common range: 25-50 mL DMSO (10-20% solution). Adjust based on patient tolerance and indication.",
    dilution: "Dilute in 250-500 mL normal saline (0.9% NaCl). Typical infusion strength: 10-20%.",
    infusionTime: "1-2 hours",
    frequency: "1-2 times weekly, individualized per response",
    phases: JSON.stringify({ initial: "25 mL at 10% → titrate upward", maintenance: "25-50 mL at 10-20% weekly/biweekly", longevity: "Monthly supportive infusions as indicated" }),
    monitoring: "Renal & hepatic function",
    precautions: "Contraindicated in severe renal/hepatic impairment. EXPECTED: Garlic-like odor/taste - counsel patients beforehand.",
    adjuncts: "Administer AFTER DMSO infusion. Do not mix in same bag. Use separate IVs for vitamin C, magnesium, or other supportive nutrients.",
    notes: "Use sterile technique. Label with concentration & date. Store DMSO at room temperature, away from light.",
    personaTrait: "The Penetrator"
  },
  {
    name: "Alpha Lipoic Acid (ALA) IV",
    category: "Metabolic & Neuroprotection",
    description: "Alpha Lipoic Acid is a powerful antioxidant that works in both water and fat-soluble environments. IV ALA supports diabetic neuropathy, liver health, heavy metal detox, and mitochondrial function. It regenerates other antioxidants like Vitamin C and E.",
    benefits: ["Universal antioxidant", "Diabetic neuropathy support", "Liver detoxification", "Blood sugar regulation", "Heavy metal chelation", "Mitochondrial support"],
    dosageRange: "Standard: 300-600 mg per infusion. Therapeutic range: 300-1,200 mg depending on indication.",
    dilution: "Dilute in 100-250 mL normal saline (0.9% NaCl). Final concentration based on desired dose and tolerance.",
    infusionTime: "30-90 minutes",
    frequency: "1-2 times weekly, individualized per response",
    phases: JSON.stringify({ initial: "300 mg 1-2x weekly for 4-6 weeks", maintenance: "600 mg weekly", longevity: "300-600 mg monthly for ongoing antioxidant support" }),
    monitoring: "Blood glucose (ALA may lower levels; caution in diabetics or those on hypoglycemics)",
    precautions: "Contraindicated in hypersensitivity. Caution when used with insulin or oral hypoglycemic agents.",
    adjuncts: "Administer ONLY AFTER ALA infusion. Do not mix B-complex, Vitamin C, glutathione in same bag. Use separate IVs.",
    notes: "PROTECT FROM LIGHT (ALA is photosensitive). Use within 4 hours of dilution. Label with dose, date, and patient initials.",
    personaTrait: "The Universal Antioxidant"
  },
  {
    name: "B17/Laetrile IV",
    category: "Oncology Support",
    description: "Laetrile (Amygdalin/Vitamin B17) is a natural compound derived from apricot kernels and other seeds. Used in integrative oncology protocols, B17 is theorized to selectively target abnormal cells. Requires careful clinical oversight and is part of comprehensive metabolic cancer support.",
    benefits: ["Integrative oncology support", "Metabolic cancer therapy", "Immune modulation", "Pain management", "Complementary cancer care"],
    dosageRange: "Variable based on clinical protocol. Typically 3-9 grams per infusion under strict medical supervision.",
    dilution: "Dilute in 250-500 mL normal saline. Concentration varies by protocol.",
    infusionTime: "60-90 minutes",
    frequency: "Per oncology protocol - typically 2-3 times weekly during intensive phases",
    phases: JSON.stringify({ initial: "Intensive phase: 2-3x weekly", maintenance: "Weekly to biweekly", longevity: "As indicated per clinical response" }),
    monitoring: "Blood cyanide levels if applicable, liver function, complete metabolic panel",
    precautions: "Requires trained practitioner. Monitor for cyanide-related symptoms. Avoid high-dose vitamin C same day (may increase cyanide release).",
    adjuncts: "Often combined with other metabolic therapies, enzyme support, and nutritional protocols as part of comprehensive approach.",
    notes: "Use only pharmaceutical-grade Laetrile. Document all administrations carefully. Part of integrative oncology protocols only.",
    personaTrait: "The Alternative Warrior"
  },
  {
    name: "Phosphatidylcholine (PC) IV",
    category: "Liver & Cellular Repair",
    description: "Phosphatidylcholine is a essential phospholipid for cell membrane integrity and liver function. IV PC (Plaquex) therapy supports liver detoxification, cardiovascular health, and cellular membrane repair. Used for fatty liver, atherosclerosis, and neurological support.",
    benefits: ["Liver detoxification", "Cell membrane repair", "Fatty liver support", "Cardiovascular health", "Cholesterol metabolism", "Brain health", "Atherosclerosis support"],
    dosageRange: "Typical: 500-1,500 mg per infusion. May increase based on protocol.",
    dilution: "Dilute in 250-500 mL normal saline or D5W. Follow manufacturer guidelines for specific products.",
    infusionTime: "1.5-2 hours",
    frequency: "1-2 times weekly during treatment phase",
    phases: JSON.stringify({ initial: "1-2x weekly for 10-20 sessions", maintenance: "Weekly to biweekly", longevity: "Monthly for ongoing liver/cardiovascular support" }),
    monitoring: "Liver function tests, lipid panel",
    precautions: "May cause mild GI upset. Caution in patients with egg allergy (PC often derived from egg).",
    adjuncts: "Often combined with EDTA for comprehensive cardiovascular protocols. May follow with glutathione.",
    notes: "Essential phospholipid therapy. Store properly. Label with concentration and date.",
    personaTrait: "The Membrane Builder"
  },
  {
    name: "Curcumin IV",
    category: "Anti-Inflammatory & Oncology Support",
    description: "Intravenous Curcumin delivers therapeutic levels of this powerful turmeric-derived anti-inflammatory compound. IV administration bypasses absorption issues, providing potent anti-inflammatory, antioxidant, and potential anti-cancer effects.",
    benefits: ["Potent anti-inflammatory", "Oncology support", "Joint health", "Antioxidant protection", "Liver support", "Neuroprotection", "Pain management"],
    dosageRange: "Typical: 100-500 mg per infusion. May vary based on formulation and indication.",
    dilution: "Dilute in 100-250 mL normal saline. Use solubilized/liposomal formulations designed for IV use.",
    infusionTime: "30-60 minutes",
    frequency: "1-3 times weekly depending on protocol",
    phases: JSON.stringify({ initial: "2-3x weekly for acute protocols", maintenance: "Weekly", longevity: "Monthly for ongoing support" }),
    monitoring: "Watch for infusion reactions. Monitor liver function with long-term use.",
    precautions: "Use only IV-grade formulations. May interact with blood thinners. Monitor for hypersensitivity reactions.",
    adjuncts: "Often combined with high-dose vitamin C, glutathione, or as part of comprehensive anti-inflammatory protocols.",
    notes: "Golden-colored solution. Use IV-specific formulations only - oral curcumin cannot be used IV. Label appropriately.",
    personaTrait: "The Golden Healer"
  },
  {
    name: "Artemisinin IV",
    category: "Oncology Support",
    description: "Artemisinin is derived from sweet wormwood (Artemisia annua) and is traditionally used for malaria. In integrative oncology, it's studied for potential anti-cancer properties through iron-dependent free radical generation in abnormal cells.",
    benefits: ["Integrative oncology support", "Antimalarial properties", "Anti-parasitic", "Immune modulation", "Iron-targeted therapy"],
    dosageRange: "Variable based on clinical protocol. Typically 100-400 mg per infusion.",
    dilution: "Dilute in 100-250 mL normal saline per manufacturer guidelines.",
    infusionTime: "30-60 minutes",
    frequency: "Per clinical protocol - often 2-3 times weekly",
    phases: JSON.stringify({ initial: "Per oncology protocol", maintenance: "Weekly to biweekly", longevity: "As indicated" }),
    monitoring: "Iron levels, liver function, complete blood count",
    precautions: "Avoid iron supplementation close to infusion (artemisinin is iron-activated). Monitor for neurological symptoms with prolonged use.",
    adjuncts: "Often part of comprehensive metabolic oncology protocols. May combine with other supportive therapies.",
    notes: "Part of integrative cancer protocols. Requires specialized knowledge. Document administration carefully.",
    personaTrait: "The Ancient Remedy"
  },
  {
    name: "Mistletoe (Iscador) IV",
    category: "Oncology Support",
    description: "Mistletoe extract (Iscador, Helixor) is one of the most studied complementary cancer therapies in Europe. It enhances immune function, improves quality of life, and is used alongside conventional cancer treatment for immune support and symptom management.",
    benefits: ["Immune enhancement", "Quality of life improvement", "Fatigue reduction", "Oncology support", "Fever therapy", "Well-being enhancement"],
    dosageRange: "Variable based on product and protocol. Typically escalating doses starting low.",
    dilution: "Follow manufacturer guidelines for specific mistletoe preparation (Iscador, Helixor, etc.).",
    infusionTime: "Variable - often given as subcutaneous injection, occasionally IV in specific protocols",
    frequency: "2-3 times weekly, following specific escalation protocols",
    phases: JSON.stringify({ initial: "Escalating dose protocol over weeks", maintenance: "Individualized based on response", longevity: "Long-term as part of integrative oncology" }),
    monitoring: "Temperature (therapeutic fever expected), injection site reactions, overall response",
    precautions: "Contraindicated in active brain tumors, severe fever, certain autoimmune conditions. Work with trained anthroposophic/integrative oncology practitioner.",
    adjuncts: "Part of comprehensive integrative oncology approach. May combine with other immune and supportive therapies.",
    notes: "European traditional medicine with extensive research. Multiple preparations available. Document all administrations.",
    personaTrait: "The European Healer"
  },
  {
    name: "Ozone Therapy IV",
    category: "Oxidative Therapy",
    description: "IV Ozone therapy (Major Autohemotherapy) involves withdrawing blood, ozonating it, and returning it to the body. This controlled oxidative stress stimulates immune function, improves oxygenation, and has antimicrobial effects. A cornerstone of biological medicine.",
    benefits: ["Immune stimulation", "Increased oxygenation", "Antimicrobial effects", "Circulation improvement", "Chronic infection support", "Wound healing", "Energy enhancement"],
    dosageRange: "Major Autohemotherapy: 50-200 mL blood treated with medical ozone at varying concentrations (typically 20-70 μg/mL).",
    dilution: "Blood is mixed with ozone gas - no saline dilution. Specific protocols vary by system used.",
    infusionTime: "30-60 minutes for full procedure",
    frequency: "1-3 times weekly depending on indication",
    phases: JSON.stringify({ initial: "Series of 10-20 treatments 2-3x weekly", maintenance: "Weekly to biweekly", longevity: "Monthly for ongoing immune support" }),
    monitoring: "Monitor for hemolysis, circulatory status, patient comfort",
    precautions: "Contraindicated in G6PD deficiency, hyperthyroidism, active hemorrhage. Requires specialized equipment and training.",
    adjuncts: "Often combined with vitamin C (not same day), glutathione, or other supportive IVs. Do NOT combine with ozonated glycerin and vitamin C same day.",
    notes: "Requires medical-grade ozone generator. Strict protocols for blood handling. Document concentrations and volumes carefully.",
    personaTrait: "The Ozone Pioneer"
  },
  {
    name: "Ozonated Glycerin",
    category: "Oxidative Therapy",
    description: "Ozonated Glycerin delivers ozone's oxidative benefits in a stabilized form, providing sustained release of ozone's therapeutic effects. Used for chronic infections, immune support, and as an alternative to Major Autohemotherapy for those who cannot undergo blood withdrawal.",
    benefits: ["Sustained ozone delivery", "Immune stimulation", "Chronic infection support", "Antimicrobial effects", "Easier administration than MAH"],
    dosageRange: "Using a 25 cc syringe: 7 cc ozonated glycerin. Final preparation includes 2 cc DMSO and 6 cc sodium bicarbonate. Volume: 14-27 cc in 500 mL, 28+ cc in 1000 mL.",
    dilution: "Mix ozonated glycerin with saline in syringe until thin enough to return to bag. Add DMSO and sodium bicarbonate per protocol.",
    infusionTime: "2-4 hours (higher doses may require 6+ hours)",
    frequency: "1 time weekly - NOT on the same day as Vitamin C infusion",
    phases: JSON.stringify({ initial: "1x weekly, increase ozonated glycerin weekly until max dose achieved", maintenance: "Weekly at maintenance dose", longevity: "As indicated for ongoing support" }),
    monitoring: "Heart rate, comfort level, tolerance throughout infusion. Watch for flushing, chest tightness, light-headedness.",
    precautions: "CRITICAL: No other IV should be administered same day as ozonated glycerin. Do NOT combine with Vitamin C on same day.",
    adjuncts: "NONE on the same day. Schedule vitamin C and other IVs on different days.",
    notes: "Must get hydration before and after infusion. Action: Slow or pause infusion if symptoms occur.",
    personaTrait: "The Sustained Oxidizer"
  },
  {
    name: "Amino Acid IV",
    category: "Nutritional Support",
    description: "Amino Acid IV therapy delivers essential and branched-chain amino acids directly into the bloodstream for optimal absorption. Used for muscle recovery, wound healing, surgical preparation, and nutritional support when oral intake is inadequate.",
    benefits: ["Muscle recovery", "Wound healing", "Surgical preparation", "Nutritional support", "Protein synthesis", "Immune support", "Energy production"],
    dosageRange: "Variable based on formulation. Typically contains essential amino acids, BCAAs, and conditionally essential amino acids.",
    dilution: "Pre-mixed formulations or diluted in 250-500 mL normal saline per manufacturer guidelines.",
    infusionTime: "1-2 hours",
    frequency: "1-3 times weekly based on nutritional needs",
    phases: JSON.stringify({ initial: "As indicated by nutritional assessment", maintenance: "Weekly to biweekly", longevity: "As needed for ongoing support" }),
    monitoring: "Renal function, metabolic panel, nitrogen balance if indicated",
    precautions: "Caution in severe renal or hepatic impairment. Monitor for amino acid imbalances.",
    adjuncts: "May combine with vitamin/mineral infusions for comprehensive nutritional support.",
    notes: "Especially valuable for athletes, surgical patients, and those with malabsorption. Document specific amino acid formulation used.",
    personaTrait: "The Builder"
  }
];

async function main() {
  console.log('Seeding 2026 Edition Peptide & IV Therapy database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('johndoe123', 10);
  await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: { isAdmin: true },
    create: {
      email: 'john@doe.com',
      name: 'Dr. John Doe',
      password: hashedPassword,
      isAdmin: true
    }
  });

  // Delete existing peptides that might be duplicates
  console.log('Cleaning up old peptide data...');
  await prisma.message.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.peptide.deleteMany({});

  // Create peptides fresh
  for (const peptide of peptides) {
    await prisma.peptide.create({
      data: peptide
    });
  }

  console.log(`Seeded ${peptides.length} unique peptides from 2026 PMA Manual.`);

  // Seed IV Therapies (clean and recreate)
  console.log('Seeding IV Therapies...');
  await prisma.iVMessage.deleteMany({});
  await prisma.iVConversation.deleteMany({});
  await prisma.iVTherapy.deleteMany({});

  for (const iv of ivTherapies) {
    await prisma.iVTherapy.create({
      data: iv
    });
  }

  console.log(`Seeded ${ivTherapies.length} IV therapies.`);

  // Seed IM Therapies
  console.log('Seeding IM Therapies...');
  await prisma.iMMessage.deleteMany({});
  await prisma.iMConversation.deleteMany({});
  await prisma.iMTherapy.deleteMany({});

  const imTherapies = [
    {
      name: "PCC Lipolytic Solution (Lipo Lab)",
      category: "Fat Dissolving",
      description: "PCC (Phosphatidylcholine Complex) from Lipo Lab is an injectable lipolytic solution designed for targeted fat reduction. It contains phosphatidylcholine and deoxycholic acid to emulsify and dissolve localized fat deposits. Popular for submental fat (double chin), love handles, and stubborn body fat areas resistant to diet and exercise.",
      benefits: ["Targeted fat reduction", "Non-surgical body contouring", "Improved facial contour", "Submental fat elimination", "Love handle reduction", "Cellulite improvement"],
      dosageRange: "2-4 mL per treatment area. Maximum 10 mL per session for larger body areas. Submental: 1-2 mL per session.",
      reconstitution: "Product comes ready-to-use. Do not dilute. Warm to room temperature before injection. Gently invert vial to mix if settling occurs.",
      injectionSite: "Submental fat (double chin), abdomen, flanks (love handles), inner thighs, upper arms, bra fat. Avoid injecting near major nerves or vessels.",
      injectionVolume: "0.2 mL per injection point, spaced 1-1.5 cm apart in a grid pattern across treatment area.",
      frequency: "Sessions spaced 2-4 weeks apart",
      phases: JSON.stringify({ initial: "3-6 sessions, 2-4 weeks apart", maintenance: "Touch-up sessions as needed every 3-6 months", longevity: "Results typically permanent if weight maintained" }),
      monitoring: "Swelling, bruising, skin irregularities. Monitor for nodule formation or tissue necrosis.",
      precautions: "CONTRAINDICATED: Active skin infection, pregnancy/breastfeeding, known allergy to phosphatidylcholine or deoxycholic acid. CAUTION: Avoid in patients with poor wound healing. Risk of marginal mandibular nerve injury with submental injections. Expect significant swelling for 3-7 days post-treatment.",
      storage: "Store refrigerated 2-8°C. Protect from light. Do not freeze. Use within expiration date.",
      notes: "Apply topical anesthetic 30 min before procedure. Use 30G or smaller needle. Massage treatment area post-injection. Compression garment recommended for body treatments. Results visible after inflammation subsides (4-6 weeks). Patient photos before/after are essential for tracking progress.",
      personaTrait: "The Fat Fighter"
    },
    {
      name: "NAD+ IM (1000mg)",
      category: "Energy & Cellular",
      description: "NAD+ (Nicotinamide Adenine Dinucleotide) intramuscular injection delivers this essential coenzyme for cellular energy production and DNA repair. IM administration offers faster delivery than subcutaneous and avoids the lengthy IV infusion times. Ideal for anti-aging protocols, cognitive enhancement, and metabolic optimization.",
      benefits: ["Cellular energy restoration", "DNA repair support", "Cognitive clarity", "Anti-aging benefits", "Metabolic optimization", "Faster than IV delivery", "No infusion time required"],
      dosageRange: "100-250 mg per IM injection. 1000mg vial can be divided into 4-10 doses depending on protocol.",
      reconstitution: "Reconstitute 1000mg lyophilized NAD+ with 10 mL bacteriostatic water for 100mg/mL concentration. Or use 5 mL for 200mg/mL concentration. Swirl gently, do not shake.",
      injectionSite: "Gluteal (ventrogluteal preferred), deltoid for smaller volumes (≤1mL). Rotate injection sites.",
      injectionVolume: "1-2.5 mL per injection depending on concentration and dose.",
      frequency: "2-3 times weekly during loading phase, then weekly for maintenance",
      phases: JSON.stringify({ initial: "100-250mg IM 2-3x weekly for 4 weeks", maintenance: "100-200mg IM weekly for 2-3 months", longevity: "100-200mg IM every 1-2 weeks ongoing" }),
      monitoring: "Injection site reactions, flushing, nausea (rare with IM vs IV). Energy levels, cognitive function assessment.",
      precautions: "May cause temporary flushing or warmth at injection site. Less likely to cause chest tightness than IV route. Use caution in patients with cardiac conditions. Start with lower doses to assess tolerance.",
      storage: "Lyophilized powder: room temperature, protect from light. Once reconstituted: refrigerate 2-8°C, use within 28 days. Label with reconstitution date.",
      notes: "IM route bypasses the slow IV drip requirement - no 2-4 hour infusions needed. Inject slowly over 30-60 seconds to minimize discomfort. May combine with B12 in same syringe for synergistic effect. Patient may feel warmth spreading within 15-30 minutes of injection - this is normal.",
      personaTrait: "The Energy Catalyst"
    },
    {
      name: "Vitamin B12 (Methylcobalamin) IM",
      category: "Energy & Cellular",
      description: "Methylcobalamin is the active, methylated form of Vitamin B12 essential for neurological function, red blood cell formation, and energy metabolism. IM delivery ensures optimal absorption, bypassing GI limitations. Commonly used for B12 deficiency, fatigue, neuropathy, and as part of weight loss and energy optimization protocols.",
      benefits: ["Energy enhancement", "Neurological support", "Red blood cell production", "Methylation support", "Mood improvement", "Weight loss support", "Neuropathy relief"],
      dosageRange: "1000-5000 mcg per injection. Most protocols use 1000 mcg (1 mg) per dose.",
      reconstitution: "Typically supplied pre-mixed in solution. No reconstitution needed. Protect from light.",
      injectionSite: "Deltoid or gluteal muscle. Rotate injection sites to prevent tissue damage.",
      injectionVolume: "1 mL per injection (standard 1000mcg/mL concentration).",
      frequency: "Weekly for deficiency correction, then monthly for maintenance",
      phases: JSON.stringify({ initial: "1000mcg IM daily for 7 days if severe deficiency", maintenance: "1000mcg IM weekly for 4-8 weeks", longevity: "1000mcg IM monthly ongoing" }),
      monitoring: "Serum B12 levels, homocysteine, MCV (mean corpuscular volume). Monitor for improvement in energy and neurological symptoms.",
      precautions: "Generally very safe. Rare allergic reactions possible. May cause mild injection site discomfort. Avoid in patients with Leber's disease (can cause severe optic atrophy).",
      storage: "Store at room temperature, protect from light. Red/pink color is normal - discard if discolored or precipitate forms.",
      notes: "Methylcobalamin preferred over cyanocobalamin for neurological conditions and those with MTHFR mutations. Can be combined with other B vitamins (B-complex IM) for enhanced effect. Vegetarians, vegans, and gastric bypass patients often require ongoing supplementation.",
      personaTrait: "The Vitality Booster"
    },
    {
      name: "Glutathione IM",
      category: "Wellness",
      description: "Glutathione is the master antioxidant, crucial for detoxification, immune function, and cellular protection. IM injection delivers glutathione directly to systemic circulation, bypassing GI degradation. Popular for skin brightening, detox protocols, immune support, and as adjunct to chelation therapy.",
      benefits: ["Antioxidant protection", "Liver detoxification", "Skin brightening", "Immune enhancement", "Heavy metal binding", "Anti-aging", "Post-treatment recovery"],
      dosageRange: "200-600 mg per IM injection. Some protocols use up to 1000mg.",
      reconstitution: "Reconstitute lyophilized glutathione with 2-3 mL sterile water or bacteriostatic water. Use preservative-free glutathione for best results.",
      injectionSite: "Gluteal (preferred for larger volumes) or deltoid. Rotate sites.",
      injectionVolume: "2-3 mL per injection.",
      frequency: "2-3 times weekly during loading, then weekly for maintenance",
      phases: JSON.stringify({ initial: "400-600mg IM 2-3x weekly for 4 weeks", maintenance: "400mg IM weekly for 2-3 months", longevity: "400mg IM every 1-2 weeks ongoing" }),
      monitoring: "Liver enzymes if used for detox. Skin tone changes for brightening protocols. Energy levels.",
      precautions: "CAUTION in asthmatic patients - may rarely trigger bronchospasm. Use preservative-free preparation. May cause mild injection site discomfort.",
      storage: "Lyophilized: room temperature, protect from light. Reconstituted: refrigerate, use within 24 hours (no preservative) or 7 days (with BAC water).",
      notes: "Best absorbed on empty stomach. For skin brightening, combine with Vitamin C (oral or IV on different day). Results for skin brightening typically visible after 2-3 months of consistent use. IM route is more convenient than IV push but may have slightly lower bioavailability.",
      personaTrait: "The Master Protector"
    },
    {
      name: "Lipotropic Complex (MIC + B12)",
      category: "Metabolic",
      description: "Lipotropic injections contain Methionine, Inositol, Choline (MIC) plus Vitamin B12 to enhance fat metabolism and liver function. This combination supports weight loss by improving fat breakdown, preventing fat accumulation in the liver, and boosting energy levels. A cornerstone of medical weight loss programs.",
      benefits: ["Enhanced fat metabolism", "Liver function support", "Energy boost", "Weight loss support", "Improved cholesterol metabolism", "Mood enhancement", "Appetite regulation"],
      dosageRange: "Standard MIC-B12: Methionine 25mg, Inositol 50mg, Choline 50mg, B12 1000mcg per mL. Dose: 1-2 mL per injection.",
      reconstitution: "Typically supplied pre-mixed. No reconstitution required. Multi-dose vials common.",
      injectionSite: "Gluteal or deltoid muscle. Rotate sites weekly.",
      injectionVolume: "1-2 mL per injection.",
      frequency: "Weekly during active weight loss phase",
      phases: JSON.stringify({ initial: "1-2 mL IM weekly during caloric restriction phase", maintenance: "1 mL IM every 2 weeks during weight maintenance", longevity: "1 mL IM monthly for ongoing metabolic support" }),
      monitoring: "Weight, body composition, liver enzymes if prolonged use. Energy levels and mood.",
      precautions: "Generally safe. Mild injection site reactions possible. Not a replacement for diet and exercise. Avoid in patients with kidney disease (high methionine load).",
      storage: "Refrigerate after opening. Protect from light. Check for particulates before use.",
      notes: "Best results when combined with reduced calorie diet and exercise program. Often given same day as medical weight loss consultation. Can be combined with other peptides (Semaglutide, Tirzepatide) in comprehensive weight loss protocols. Some patients report improved mental clarity and mood.",
      personaTrait: "The Fat Metabolizer"
    },
    {
      name: "Vitamin D3 (Cholecalciferol) IM",
      category: "Immune Support",
      description: "High-dose Vitamin D3 intramuscular injection provides rapid repletion for severe deficiency. The 'sunshine vitamin' is essential for bone health, immune function, mood regulation, and calcium absorption. IM delivery offers sustained release over weeks, ideal for patients with malabsorption or poor oral compliance.",
      benefits: ["Rapid deficiency correction", "Immune system support", "Bone health optimization", "Mood improvement", "Seasonal depression relief", "Calcium absorption", "Muscle function support"],
      dosageRange: "50,000-600,000 IU per injection depending on deficiency severity. Typical maintenance: 50,000-100,000 IU monthly.",
      reconstitution: "Supplied as oil-based solution. No reconstitution needed. Warm to body temperature for easier injection. Use 21-23G needle due to oil viscosity.",
      injectionSite: "Gluteal muscle (ventrogluteal or dorsogluteal) preferred due to volume. Deltoid acceptable for smaller volumes.",
      injectionVolume: "0.5-2 mL per injection depending on concentration and dose.",
      frequency: "Monthly or quarterly for maintenance after initial loading",
      phases: JSON.stringify({ initial: "300,000-600,000 IU single dose for severe deficiency, or 100,000 IU weekly x 3 doses", maintenance: "50,000-100,000 IU every 4-8 weeks", longevity: "Based on serum 25-OH vitamin D levels - target 50-80 ng/mL" }),
      monitoring: "25-OH Vitamin D levels (baseline, 4-6 weeks post-loading, then quarterly). Monitor calcium levels - risk of hypercalcemia with high doses.",
      precautions: "CONTRAINDICATED: Hypercalcemia, hypervitaminosis D, malabsorption of bile salts. CAUTION: Granulomatous diseases (sarcoidosis), kidney disease, cardiac glycoside use. Do not exceed cumulative 600,000 IU/year without monitoring.",
      storage: "Room temperature, protect from light. Do not refrigerate oil-based preparations.",
      notes: "Oil-based injection provides depot effect with gradual release over 2-3 months. Z-track technique recommended to prevent leakage. Patients with dark skin, obesity, or limited sun exposure often need higher maintenance doses. Combine with Vitamin K2 (oral) for optimal calcium utilization.",
      personaTrait: "The Sunshine Restorer"
    },
    {
      name: "Tri-Immune Boost (Vitamin C + Glutathione + Zinc)",
      category: "Immune Support",
      description: "Tri-Immune Boost is a powerful combination of three immune-strengthening nutrients: high-dose Ascorbic Acid (Vitamin C), Glutathione, and Zinc Sulfate. This synergistic blend provides potent antioxidant protection and immune system fortification. Ideal during cold/flu season, pre/post-travel, or for patients with chronic illness.",
      benefits: ["Immune system fortification", "Antioxidant protection", "Illness prevention", "Recovery acceleration", "Stress adaptation", "Wound healing support", "Post-travel recovery"],
      dosageRange: "Typical formulation: Ascorbic Acid 1000mg + Glutathione 200mg + Zinc Sulfate 5mg per dose.",
      reconstitution: "Available pre-mixed or as separate components to combine. If compounding, use sterile technique. Mix in syringe immediately before injection.",
      injectionSite: "Gluteal (preferred for volume) or deltoid. Rotate sites with weekly injections.",
      injectionVolume: "2-3 mL per injection.",
      frequency: "Weekly during immune challenges, bi-weekly for maintenance",
      phases: JSON.stringify({ initial: "Weekly x 4 weeks during acute illness or immune stress", maintenance: "Every 2-4 weeks for ongoing immune support", seasonal: "Weekly during flu season or high-risk periods" }),
      monitoring: "Overall well-being, frequency of illness. Zinc levels if prolonged high-dose use.",
      precautions: "Vitamin C may cause injection site burning - inject slowly. High-dose zinc long-term can deplete copper. Glutathione caution in asthmatics. May cause temporary metallic taste.",
      storage: "Pre-mixed: refrigerate 2-8°C, protect from light. Use within 24 hours if preservative-free.",
      notes: "Excellent for healthcare workers, frequent travelers, immunocompromised patients, and during viral outbreaks. Inject slowly (60-90 seconds) to minimize burning from Vitamin C. Can be given as part of 'immune boost day' with IV hydration.",
      personaTrait: "The Immune Guardian"
    },
    {
      name: "Biotin (Vitamin B7) IM",
      category: "Beauty & Hair",
      description: "Biotin (Vitamin B7) is essential for healthy hair, skin, and nails, plus carbohydrate and fat metabolism. IM injection ensures 100% bioavailability, bypassing GI absorption issues. Popular for hair loss, brittle nails, and skin health optimization, especially in patients with poor oral absorption or on medications affecting biotin.",
      benefits: ["Hair growth support", "Nail strengthening", "Skin health improvement", "Metabolic support", "Blood sugar regulation", "Nervous system support", "Pregnancy support"],
      dosageRange: "2,500-10,000 mcg (2.5-10 mg) per injection. Most protocols use 5,000 mcg (5 mg).",
      reconstitution: "Available pre-mixed. No reconstitution typically needed. Protect from light.",
      injectionSite: "Deltoid or gluteal muscle. Deltoid acceptable for typical volumes.",
      injectionVolume: "0.5-1 mL per injection.",
      frequency: "Weekly for loading, then monthly for maintenance",
      phases: JSON.stringify({ initial: "5000mcg IM weekly for 4-8 weeks", maintenance: "5000mcg IM every 2-4 weeks", longevity: "5000mcg IM monthly ongoing for hair/nail support" }),
      monitoring: "Hair density/texture, nail quality, skin condition. Note: High-dose biotin interferes with many lab tests (thyroid, troponin) - discontinue 48-72 hours before blood work.",
      precautions: "IMPORTANT LAB INTERFERENCE: High-dose biotin causes false results in thyroid tests, cardiac troponin, pregnancy tests, and many hormones. Inform lab when running tests. Generally very safe - no upper intake limit established.",
      storage: "Room temperature, protect from light. Discard if discolored.",
      notes: "Results for hair/nails typically visible after 3-4 months of consistent use. Often combined with other B vitamins or collagen peptides. Particularly beneficial for patients on anticonvulsants, antibiotics, or with egg white consumption (avidin binds biotin). Tell patients to notify all healthcare providers about biotin supplementation before lab tests.",
      personaTrait: "The Beauty Builder"
    },
    {
      name: "CoQ10 (Ubiquinone) IM",
      category: "Anti-Aging & Cardiovascular",
      description: "Coenzyme Q10 is essential for cellular energy production in mitochondria and acts as a powerful antioxidant. IM injection bypasses poor oral absorption (only 3-5% absorbed orally). Critical for heart health, energy production, statin-induced myopathy, and anti-aging protocols. Levels naturally decline with age.",
      benefits: ["Mitochondrial energy support", "Cardiovascular protection", "Statin side effect reduction", "Anti-aging antioxidant", "Exercise performance", "Migraine prevention", "Skin rejuvenation"],
      dosageRange: "50-100 mg per injection. Higher doses (200mg) available for specific conditions.",
      reconstitution: "Supplied as oil-based solution. No reconstitution. Warm to body temperature for easier injection. Use 21-23G needle.",
      injectionSite: "Gluteal muscle preferred (ventrogluteal). Z-track technique recommended for oil-based preparations.",
      injectionVolume: "1-2 mL per injection.",
      frequency: "Weekly for therapeutic effect, bi-weekly for maintenance",
      phases: JSON.stringify({ initial: "100mg IM weekly for 8-12 weeks", maintenance: "50-100mg IM every 2 weeks", longevity: "50mg IM bi-weekly for ongoing cellular support" }),
      monitoring: "Energy levels, exercise tolerance, cardiac symptoms if applicable. Serum CoQ10 levels can be measured but expensive.",
      precautions: "May lower blood pressure - monitor in patients on antihypertensives. May interact with warfarin (monitor INR). Generally well tolerated. Oil-based injection may cause temporary injection site nodules.",
      storage: "Room temperature, protect from light and heat. Oil-based preparations stable at room temperature.",
      notes: "Essential for ALL patients on statin medications to prevent myopathy and fatigue. Ubiquinol form has better bioavailability than ubiquinone if available. Heart failure patients often require higher doses. Takes 2-3 weeks to see energy benefits. Excellent combined with NAD+ for comprehensive mitochondrial support.",
      personaTrait: "The Heart Protector"
    },
    {
      name: "Super B Complex IM",
      category: "Energy & Cellular",
      description: "Comprehensive B-vitamin injection containing all eight essential B vitamins: B1 (Thiamine), B2 (Riboflavin), B3 (Niacin), B5 (Pantothenic Acid), B6 (Pyridoxine), B7 (Biotin), B9 (Folate), and B12 (Methylcobalamin). Provides synergistic support for energy production, neurological function, and metabolic health.",
      benefits: ["Comprehensive energy support", "Neurological function", "Stress adaptation", "Mood enhancement", "Metabolic optimization", "Red blood cell formation", "Homocysteine regulation"],
      dosageRange: "Standard complex: 1-2 mL containing therapeutic doses of all B vitamins. Typical includes B1 100mg, B2 2mg, B3 100mg, B5 2mg, B6 2mg, B7 300mcg, B9 1mg, B12 1000mcg.",
      reconstitution: "Supplied pre-mixed. No reconstitution needed. Bright yellow color is normal (riboflavin).",
      injectionSite: "Deltoid or gluteal. Rotate injection sites weekly.",
      injectionVolume: "1-2 mL per injection.",
      frequency: "Weekly for loading, then bi-weekly or monthly for maintenance",
      phases: JSON.stringify({ initial: "Weekly x 4-8 weeks for deficiency states or high stress", maintenance: "Every 2-4 weeks ongoing", therapeutic: "Weekly during periods of high physical/mental demand" }),
      monitoring: "Energy levels, mood, cognitive function. Homocysteine levels if cardiovascular concerns. B12 and folate serum levels.",
      precautions: "May cause temporary flushing (niacin). Bright yellow urine is normal (riboflavin). B6 in very high doses long-term can cause neuropathy - complex formulations have safe ratios. Not for patients with severe liver disease.",
      storage: "Refrigerate after opening. Protect from light - B vitamins are light-sensitive. Yellow color normal; discard if significantly darkened.",
      notes: "Ideal for high-stress individuals, athletes, vegans/vegetarians, bariatric surgery patients, and elderly. More comprehensive than B12 alone. Often combined with amino acids in 'energy shots.' Patients typically notice improved energy within 24-48 hours. Best given in morning due to energizing effect.",
      personaTrait: "The Energy Orchestrator"
    },
    {
      name: "Lipo-Mino Mix (Enhanced Lipotropic)",
      category: "Metabolic",
      description: "Advanced lipotropic formula combining traditional MIC (Methionine, Inositol, Choline) with additional amino acids and B vitamins for enhanced fat metabolism. Contains L-Carnitine for fatty acid transport, B1 for carb metabolism, and B6 for protein metabolism. The premium choice for medical weight loss protocols.",
      benefits: ["Enhanced fat burning", "Fatty acid transport to mitochondria", "Liver protection", "Energy amplification", "Appetite regulation", "Metabolic acceleration", "Muscle preservation"],
      dosageRange: "Typical formulation per mL: Methionine 25mg, Inositol 50mg, Choline 50mg, L-Carnitine 100mg, B1 50mg, B6 5mg, B12 1000mcg. Dose: 1-2 mL per injection.",
      reconstitution: "Supplied pre-mixed. No reconstitution required. Protect from light.",
      injectionSite: "Gluteal or deltoid muscle. Rotate sites with each injection.",
      injectionVolume: "1-2 mL per injection.",
      frequency: "1-2 times weekly during active weight loss",
      phases: JSON.stringify({ initial: "2 mL IM twice weekly during intensive weight loss", maintenance: "1 mL IM weekly during weight maintenance", longevity: "1 mL IM every 2 weeks for ongoing metabolic support" }),
      monitoring: "Weight, body composition, waist circumference. Liver function if prolonged use. Energy and mood levels.",
      precautions: "L-Carnitine may cause fishy body odor in some patients - reduce dose if occurs. B6 in formula - monitor total B6 intake if supplementing elsewhere. Avoid in severe kidney disease. May interact with thyroid medications (carnitine).",
      storage: "Refrigerate after opening. Protect from light. Use within 28 days of first puncture.",
      notes: "The gold standard for weight loss clinics - combines fat metabolism from multiple pathways. L-Carnitine shuttles fatty acids into mitochondria for burning. Give in morning or early afternoon due to energizing effect. Best results with 3-5 days/week cardio and caloric deficit. Often combined with Semaglutide/Tirzepatide for comprehensive protocols.",
      personaTrait: "The Metabolic Maximizer"
    }
  ];

  for (const im of imTherapies) {
    await prisma.iMTherapy.create({
      data: im
    });
  }

  console.log(`Seeded ${imTherapies.length} IM therapies.`);
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });