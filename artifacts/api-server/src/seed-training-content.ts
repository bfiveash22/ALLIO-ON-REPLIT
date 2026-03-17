import { db } from "./db";
import { libraryItems, moduleContent, quizQuestions, quizAnswers, quizzes, moduleQuizzes } from "@shared/schema";

const COMPREHENSIVE_LESSONS = [
  // ECS Foundations
  {
    title: "ECS Discovery: How It All Began",
    slug: "ecs-discovery-history",
    contentType: "lesson",
    content: `
# The Discovery of the Endocannabinoid System

## The 1988 Breakthrough
In 1988, researchers at St. Louis University discovered the first cannabinoid receptor (CB1) in the brain of a rat. This discovery opened an entirely new understanding of human physiology.

## Dr. Raphael Mechoulam's Legacy
Israeli scientist Dr. Raphael Mechoulam, the "Father of Cannabis Research," identified THC in 1964 and later discovered anandamide, our body's own cannabinoid, in 1992.

## Why It Matters for Healing
The ECS regulates:
- **Homeostasis** - maintaining balance in all body systems
- **Pain perception** - natural pain modulation
- **Mood and stress** - emotional regulation
- **Immune function** - inflammation control
- **Sleep cycles** - circadian rhythm regulation
- **Appetite and metabolism** - energy balance

## Clinical Implications
Understanding the ECS opens doors to:
1. Natural therapies without synthetic chemicals
2. Targeted interventions for chronic conditions
3. Personalized healing protocols
4. Prevention strategies based on ECS optimization

## Key Takeaways
- The ECS is present in every human body
- It was discovered through cannabis research but exists independently
- Supporting ECS function is fundamental to true healing
    `,
    excerpt: "Learn about the groundbreaking discovery of the Endocannabinoid System and why it's the body's master regulatory system.",
    categorySlug: "ecs-foundations"
  },
  {
    title: "CB1 and CB2 Receptors Explained",
    slug: "cb1-cb2-receptors-detailed",
    contentType: "lesson",
    content: `
# Understanding Cannabinoid Receptors

## CB1 Receptors: The Brain's Gateway
CB1 receptors are primarily found in:
- **Brain and central nervous system** - highest concentration
- **Lungs, liver, and kidneys** - organ regulation
- **Reproductive organs** - fertility and hormone balance

### CB1 Functions:
- Memory and learning modulation
- Motor control and coordination
- Pain perception at the spinal level
- Appetite regulation (the "munchies" effect)
- Mood and emotional processing

## CB2 Receptors: The Immune Guardian
CB2 receptors are concentrated in:
- **Immune cells** - T-cells, B-cells, macrophages
- **Spleen and lymph nodes** - immune system headquarters
- **Bone marrow** - blood cell production
- **Gut-associated lymphoid tissue** - intestinal immunity

### CB2 Functions:
- Inflammatory response modulation
- Immune cell migration and function
- Bone metabolism and density
- Intestinal inflammation control
- Neuroprotection in disease states

## Clinical Applications
Understanding receptor distribution helps practitioners:
1. Target specific symptoms with appropriate cannabinoids
2. Predict potential side effects
3. Develop personalized treatment protocols
4. Monitor therapeutic responses

## Receptor Sensitivity Factors
- Genetics (CNR1 and CNR2 gene variants)
- Diet and lifestyle
- Chronic stress levels
- Pre-existing conditions
- Medication interactions
    `,
    excerpt: "Explore the two main cannabinoid receptors - their locations, functions, and clinical implications.",
    categorySlug: "ecs-foundations"
  },
  {
    title: "Anandamide and 2-AG: Your Natural Cannabinoids",
    slug: "endocannabinoids-anandamide-2ag",
    contentType: "lesson",
    content: `
# Your Body's Own Cannabinoids

## Anandamide: The "Bliss Molecule"
Named from the Sanskrit word "ananda" meaning bliss, anandamide was the first endocannabinoid discovered.

### Anandamide Functions:
- **Mood elevation** - natural antidepressant effects
- **Pain reduction** - binds CB1 receptors in pain pathways
- **Memory modulation** - helps forget traumatic experiences
- **Appetite suppression** - unlike THC, it reduces appetite
- **Fertility** - essential for embryo implantation

### Boosting Anandamide Naturally:
- Exercise (Runner's High is anandamide-mediated)
- Dark chocolate consumption
- Omega-3 fatty acids
- Stress reduction practices
- Quality sleep

## 2-AG: The Abundant Endocannabinoid
2-Arachidonoylglycerol is the most abundant endocannabinoid in the body.

### 2-AG Functions:
- **Immune regulation** - primary modulator of inflammation
- **Cardiovascular health** - blood pressure regulation
- **Bone health** - osteoblast activity
- **Neuroprotection** - released after brain injury
- **Gut health** - intestinal motility and inflammation

### Supporting 2-AG Production:
- Omega-6/Omega-3 balance (arachidonic acid is precursor)
- Healthy fat consumption
- Reduced processed food intake
- Regular physical activity

## The Entourage Effect
Both endocannabinoids work synergistically with:
- Phytocannabinoids from plants
- Terpenes and flavonoids
- Other lipid signaling molecules

This synergy is why whole-plant therapies often outperform isolated compounds.
    `,
    excerpt: "Discover anandamide and 2-AG - the two primary endocannabinoids your body naturally produces.",
    categorySlug: "ecs-foundations"
  },
  {
    title: "Clinical Endocannabinoid Deficiency (CECD)",
    slug: "clinical-endocannabinoid-deficiency",
    contentType: "lesson",
    content: `
# When the ECS Is Underactive

## The CECD Theory
Proposed by Dr. Ethan Russo, Clinical Endocannabinoid Deficiency suggests that some people have naturally lower endocannabinoid tone, leading to specific conditions.

## Conditions Associated with CECD:
1. **Fibromyalgia** - widespread pain, fatigue, cognitive issues
2. **Migraine headaches** - chronic, recurring head pain
3. **Irritable Bowel Syndrome (IBS)** - digestive dysfunction
4. **Treatment-resistant conditions** - when standard therapies fail

## Signs of Low ECS Tone:
- Heightened sensitivity to pain
- Poor stress resilience
- Digestive irregularities
- Difficulty relaxing or sleeping
- Increased anxiety or depression
- Heightened inflammation

## Root Causes:
### Genetic Factors
- FAAH gene variations (enzyme that breaks down anandamide)
- CB receptor polymorphisms
- Endocannabinoid synthesis gene variants

### Environmental Factors
- Chronic stress depleting the ECS
- Poor diet lacking cannabinoid precursors
- Sedentary lifestyle
- Sleep deprivation
- Toxin exposure

## Restoring ECS Balance:
### Lifestyle Interventions
- Regular aerobic exercise
- Stress management techniques
- Quality sleep optimization
- Anti-inflammatory diet

### Nutritional Support
- Omega-3 fatty acids (EPA/DHA)
- Dark chocolate (cacao)
- Black pepper (beta-caryophyllene)
- Cloves and oregano
- CBD and other phytocannabinoids

### Targeted Therapies
- FAAH inhibitors (natural or pharmaceutical)
- CB receptor agonists
- Palmitoylethanolamide (PEA)
- Oleoylethanolamine (OEA)
    `,
    excerpt: "Understand CECD - when the ECS is underactive - and its connection to chronic conditions.",
    categorySlug: "ecs-foundations"
  },
  // Peptide Training
  {
    title: "Introduction to Peptide Therapy",
    slug: "peptide-therapy-fundamentals",
    contentType: "lesson",
    content: `
# Peptide Therapy Fundamentals

## What Are Peptides?
Peptides are short chains of amino acids (2-50 amino acids). They act as signaling molecules, telling your cells what to do.

### Key Characteristics:
- **Highly specific** - target exact cellular pathways
- **Naturally occurring** - your body already makes them
- **Low side effects** - work with natural processes
- **Rapid action** - effects often seen within weeks

## Categories of Therapeutic Peptides:

### 1. Tissue Repair Peptides
- **BPC-157** - gut and musculoskeletal healing
- **TB-500** - injury recovery and inflammation
- **GHK-Cu** - skin and wound healing

### 2. Metabolic Peptides
- **GLP-1 agonists** - weight management, blood sugar
- **MOTS-c** - metabolic regulation
- **Humanin** - mitochondrial function

### 3. Cognitive Peptides
- **Semax** - neuroprotection and cognition
- **Selank** - anxiety and immune modulation
- **Dihexa** - memory and learning

### 4. Anti-Aging Peptides
- **Epithalon** - telomere lengthening
- **Thymalin** - immune rejuvenation
- **Bioregulators** - organ-specific restoration

## Safety Considerations:
1. Source quality is critical (pharmaceutical grade only)
2. Proper reconstitution and storage
3. Correct dosing protocols
4. Medical supervision recommended
5. Contraindications must be evaluated

## Getting Started:
- Comprehensive lab work first
- Medical history review
- Clear therapeutic goals
- Practitioner guidance
- Regular monitoring
    `,
    excerpt: "Learn the fundamentals of peptide therapy including mechanisms, categories, and safety.",
    categorySlug: "peptides"
  },
  {
    title: "BPC-157: The Body Protection Compound",
    slug: "bpc-157-comprehensive-guide",
    contentType: "lesson",
    content: `
# BPC-157 Deep Dive

## What Is BPC-157?
BPC-157 (Body Protection Compound-157) is a pentadecapeptide derived from human gastric juice. It's a 15-amino-acid chain with remarkable healing properties.

## Mechanisms of Action:
1. **Angiogenesis** - promotes new blood vessel formation
2. **Collagen synthesis** - enhances tissue repair
3. **Nitric oxide modulation** - improves blood flow
4. **Growth factor upregulation** - accelerates healing
5. **Anti-inflammatory** - reduces inflammatory markers

## Clinical Applications:

### Musculoskeletal:
- Tendon and ligament injuries
- Muscle tears and strains
- Joint pain and arthritis
- Post-surgical healing
- Sports injuries

### Gastrointestinal:
- Leaky gut syndrome
- IBD and IBS
- NSAID-induced damage
- Ulcer healing
- Gut-brain axis support

### Neurological:
- Neuroprotection
- Dopamine system support
- Depression and anxiety
- Traumatic brain injury
- Peripheral nerve damage

## Dosing Protocols:

### Standard Protocol:
- **Dose**: 250-500 mcg per day
- **Frequency**: 1-2x daily
- **Duration**: 4-8 weeks typically
- **Administration**: Subcutaneous near injury site, or systemic

### Advanced Protocol:
- Higher doses for acute injuries
- Combination with TB-500
- Oral form for GI issues
- Cycling for long-term use

## Reconstitution:
1. Use bacteriostatic water
2. Add water slowly to vial wall
3. Swirl gently - never shake
4. Refrigerate after mixing
5. Use within 30 days

## Safety Profile:
- No known toxic dose in studies
- Minimal side effects reported
- No hormonal disruption
- Safe with most medications
    `,
    excerpt: "Comprehensive training on BPC-157 including dosing, reconstitution, and clinical applications.",
    categorySlug: "peptides"
  },
  // Live Blood Analysis
  {
    title: "Live Blood Analysis Fundamentals",
    slug: "live-blood-analysis-basics",
    contentType: "lesson",
    content: `
# Live Blood Analysis Fundamentals

## What Is Live Blood Analysis?
Live Blood Analysis (LBA) is a microscopy technique where fresh, unfixed blood is examined under a dark field microscope to observe living cells in real-time.

## Equipment Required:
- **Dark field microscope** - 1000x magnification
- **Glass slides and coverslips** - clean, oil-free
- **Lancet device** - sterile finger prick
- **Camera system** - for documentation
- **Immersion oil** - for proper optics

## Proper Sample Collection:
1. Clean the finger with alcohol, allow to dry
2. Use sterile lancet on side of fingertip
3. Wipe away first drop (tissue fluid contamination)
4. Place small drop on slide
5. Apply coverslip immediately
6. Analyze within 20 minutes

## Normal Blood Findings:
- **Round, uniform red blood cells** - biconcave discs
- **Clear plasma** - no excessive debris
- **Normal white blood cells** - active, mobile
- **Platelets visible** - small, scattered
- **No excessive fibrin** - minimal strands

## Common Abnormal Findings:

### Red Blood Cell Morphology:
- **Rouleaux formation** - stacking (inflammation, dehydration)
- **Echinocytes** - spiky cells (oxidative stress)
- **Target cells** - liver/spleen issues
- **Poikilocytosis** - varied shapes (nutritional deficiency)

### Plasma Abnormalities:
- **Fibrin nets** - inflammation, clotting tendency
- **Crystals** - metabolic issues
- **Debris/plaque** - poor detoxification
- **Parasites** - systemic infection

### White Blood Cell Changes:
- **Sluggish movement** - immune suppression
- **Excessive numbers** - active infection
- **Unusual morphology** - various conditions

## Clinical Interpretation:
LBA provides clues about:
- Nutritional status
- Oxidative stress levels
- Immune function
- Hydration status
- Potential underlying conditions

**Important**: LBA is a screening tool, not a diagnostic test.
    `,
    excerpt: "Master the art of live blood analysis for identifying nutritional deficiencies and cellular health markers.",
    categorySlug: "diagnostics"
  },
  // IV Therapy
  {
    title: "IV Vitamin Therapy Administration",
    slug: "iv-therapy-administration-guide",
    contentType: "lesson",
    content: `
# IV Vitamin Therapy Administration

## Why IV Therapy?
Intravenous administration bypasses the digestive system, achieving:
- **100% bioavailability** - direct cellular access
- **Higher therapeutic doses** - not limited by gut absorption
- **Rapid effects** - immediate tissue saturation
- **Correcting severe deficiencies** - faster than oral

## Common IV Formulas:

### Myers' Cocktail:
- Magnesium chloride (2-5g)
- Calcium gluconate (1-2g)
- Vitamin C (2-5g)
- B-complex vitamins
- B12 (1000mcg)
**Uses**: Fatigue, fibromyalgia, migraines, immune support

### High-Dose Vitamin C:
- 25-100g Vitamin C
- Requires G6PD testing first
**Uses**: Immune support, chronic infections, adjunctive cancer care

### Glutathione Push:
- 600-2000mg glutathione
- Given as slow IV push
**Uses**: Detoxification, neurological support, skin brightening

### NAD+ Infusion:
- 250-500mg+ NAD+
- Slow infusion (2-4 hours)
**Uses**: Energy, cognitive function, addiction recovery, anti-aging

## Safety Protocols:

### Pre-Infusion:
1. Complete health history
2. Vital signs baseline
3. Lab work review
4. Consent documentation
5. IV access establishment

### During Infusion:
1. Monitor vital signs every 15-30 minutes
2. Watch for reactions (flushing, chest tightness)
3. Adjust rate as needed
4. Document everything

### Common Reactions:
- **Magnesium flush** - slow the rate
- **Taste changes** - normal with B vitamins
- **Cooling sensation** - normal
- **Hypotension** - lay member flat, slow rate

## Contraindications:
- G6PD deficiency (high-dose C)
- Renal impairment
- Heart failure (volume considerations)
- Active infection at IV site
- Known allergies to components
    `,
    excerpt: "Safety protocols and administration techniques for IV vitamin therapy.",
    categorySlug: "iv-therapy"
  },
  // Dr. Wallach's 90 Essential Nutrients
  {
    title: "The 90 Essential Nutrients",
    slug: "90-essential-nutrients-guide",
    contentType: "lesson",
    content: `
# Dr. Joel Wallach's 90 Essential Nutrients

## The Foundation of Health
Dr. Joel Wallach, ND, identified 90 nutrients that the human body cannot manufacture and must obtain from diet or supplementation.

## The Categories:

### 60 Minerals
Essential minerals include:
- **Calcium** - bone health, muscle function
- **Magnesium** - 300+ enzymatic reactions
- **Zinc** - immune function, wound healing
- **Selenium** - thyroid, antioxidant
- **Chromium** - blood sugar regulation
- **Copper** - collagen, iron metabolism
- **Iodine** - thyroid hormone production
- And 53 more trace minerals

### 16 Vitamins
Essential vitamins:
- **Vitamin A** - vision, immunity
- **Vitamin D3** - bone health, immune modulation
- **Vitamin E** - antioxidant protection
- **Vitamin K2** - calcium direction
- **Vitamin C** - collagen, immune function
- **B-Complex** (8 vitamins) - energy, nervous system
- **Choline** - brain health, liver function

### 12 Amino Acids
Essential amino acids:
- **Leucine, Isoleucine, Valine** - BCAAs for muscle
- **Lysine** - collagen, calcium absorption
- **Methionine** - detoxification
- **Phenylalanine** - neurotransmitters
- **Threonine** - immune proteins
- **Tryptophan** - serotonin precursor
- **Histidine** - histamine, hemoglobin
- And conditionally essential amino acids

### 2-3 Essential Fatty Acids
- **Omega-3** (EPA/DHA) - inflammation, brain
- **Omega-6** (GLA) - hormone balance
- Proper ratio crucial (1:1 to 4:1 omega-6:omega-3)

## Deficiency Diseases:
Every nutrient deficiency creates specific symptoms:
- **Selenium deficiency** - cardiomyopathy, cancer risk
- **Zinc deficiency** - poor wound healing, hair loss
- **Magnesium deficiency** - muscle cramps, anxiety
- **Chromium deficiency** - blood sugar dysregulation
- **Copper deficiency** - anemia, connective tissue weakness

## Supplementation Strategy:
1. Foundation formula covering all 90
2. Additional support based on testing
3. Quality matters - bioavailable forms
4. Consistency over perfection
    `,
    excerpt: "Dr. Wallach's 90 essential nutrients database with deficiency symptoms and recommendations.",
    categorySlug: "nutrition"
  },
  // 5Rs Protocol
  {
    title: "The 5Rs to Homeostasis Protocol",
    slug: "5rs-homeostasis-complete",
    contentType: "lesson",
    content: `
# The 5 Rs to Homeostasis

## Overview
The 5Rs protocol is a systematic approach to restoring the body's natural balance, developed from functional medicine principles.

## R1: REMOVE
**Eliminate what's harming the body**

### What to Remove:
- **Pathogens** - bacteria, viruses, parasites, fungi
- **Toxins** - heavy metals, chemicals, mold
- **Allergens** - food sensitivities, environmental triggers
- **Stressors** - emotional, physical, chemical stress

### How to Remove:
- Antimicrobial protocols (natural or pharmaceutical)
- Detoxification support
- Elimination diets
- Environmental clean-up
- Lifestyle modifications

## R2: REPLACE
**Provide what's missing or deficient**

### What to Replace:
- **Digestive enzymes** - for proper breakdown
- **Stomach acid** - HCl if hypochlorhydric
- **Bile support** - for fat digestion
- **Nutrients** - identified deficiencies
- **Hormones** - if testing indicates need

### Assessment Tools:
- Comprehensive stool analysis
- Organic acids testing
- Nutrient panels
- Hormone testing

## R3: REINOCULATE
**Restore healthy microbiome**

### Strategies:
- **Probiotics** - multi-strain, high potency
- **Prebiotics** - fiber for beneficial bacteria
- **Fermented foods** - natural probiotics
- **Synbiotics** - combined pre/probiotics

### Key Strains:
- Lactobacillus species
- Bifidobacterium species
- Saccharomyces boulardii
- Akkermansia muciniphila

## R4: REPAIR
**Heal damaged tissues**

### Gut Repair Nutrients:
- **L-Glutamine** - enterocyte fuel
- **Zinc carnosine** - mucosal healing
- **DGL** - stomach lining
- **Aloe vera** - soothing, healing
- **Collagen peptides** - tissue repair
- **Butyrate** - colonocyte fuel

### Systemic Repair:
- Peptide therapies (BPC-157, TB-500)
- Stem cell/exosome support
- Nutrient repletion

## R5: REBALANCE
**Support whole-body harmony**

### Focus Areas:
- **Sleep optimization** - circadian rhythm
- **Stress management** - HPA axis balance
- **Movement** - appropriate exercise
- **Mindset** - emotional/spiritual health
- **Community** - social connection

### Maintenance:
- Regular reassessment
- Adjusted protocols as needed
- Long-term lifestyle integration
    `,
    excerpt: "Complete healing protocol: Remove, Replace, Reinoculate, Repair, Rebalance.",
    categorySlug: "protocols"
  },
  // GLP-1 Program
  {
    title: "GLP-1 Peptide Therapy for Weight Management",
    slug: "glp1-weight-management-program",
    contentType: "lesson",
    content: `
# GLP-1 Peptide Therapy

## Understanding GLP-1
Glucagon-Like Peptide-1 (GLP-1) is an incretin hormone naturally produced in the gut that plays crucial roles in metabolism.

## Natural GLP-1 Functions:
- **Glucose regulation** - stimulates insulin release
- **Appetite suppression** - signals satiety to brain
- **Gastric emptying** - slows digestion
- **Blood sugar control** - prevents spikes
- **Cardiovascular protection** - heart health benefits

## Therapeutic GLP-1 Options:

### Peptide Agonists:
- **Semaglutide** - weekly injection, most potent
- **Tirzepatide** - dual GIP/GLP-1 agonist
- **Liraglutide** - daily injection option

### Expected Results:
- 15-25% body weight loss over 12-16 weeks
- Reduced food cravings
- Improved blood sugar control
- Better lipid profiles
- Reduced inflammation

## Program Structure:

### Week 1-4: Initiation
- Start with lowest dose
- Monitor for side effects
- Hydration focus
- Protein intake optimization

### Week 5-8: Titration
- Gradual dose increases
- Weekly check-ins
- Adjust as tolerated
- Begin exercise integration

### Week 9-16: Optimization
- Reach therapeutic dose
- Maximum appetite suppression
- Lifestyle habit formation
- Body recomposition phase

### Maintenance Phase:
- Dose adjustment or tapering
- Sustainable habits established
- Continued monitoring
- Long-term support

## Side Effect Management:

### Common (usually temporary):
- Nausea - eat smaller meals
- Constipation - increase fiber, water
- Injection site reactions - rotate sites
- Headache - hydration helps

### When to Contact Provider:
- Severe abdominal pain
- Persistent vomiting
- Signs of pancreatitis
- Hypoglycemia symptoms

## Contraindications:
- Personal/family history of medullary thyroid carcinoma
- MEN2 syndrome
- Pancreatitis history
- Severe GI conditions
- Pregnancy/breastfeeding
    `,
    excerpt: "Sustainable weight management with GLP-1 peptides including protocols and monitoring.",
    categorySlug: "peptides"
  },
  // NAD+ Therapy
  {
    title: "NAD+ Cellular Revival Therapy",
    slug: "nad-cellular-revival-therapy",
    contentType: "lesson",
    content: `
# NAD+ Therapy

## What Is NAD+?
Nicotinamide Adenine Dinucleotide (NAD+) is a coenzyme found in every living cell, essential for:
- **Energy production** - powers mitochondria
- **DNA repair** - maintains genetic integrity
- **Cellular signaling** - communication pathways
- **Gene expression** - epigenetic regulation
- **Longevity pathways** - SIREN activation

## Why NAD+ Declines:
- Normal aging (50% reduction by age 50)
- Chronic inflammation
- Stress (physical, emotional, chemical)
- Poor diet
- Alcohol consumption
- Chronic illness

## Benefits of NAD+ Therapy:

### Cognitive:
- Mental clarity and focus
- Memory improvement
- Reduced brain fog
- Neuroprotection

### Energy:
- Increased cellular energy
- Reduced fatigue
- Better exercise performance
- Faster recovery

### Anti-Aging:
- DNA repair enhancement
- Cellular regeneration
- Telomere protection
- Skin health improvement

### Addiction Recovery:
- Reduced cravings
- Faster detoxification
- Neurotransmitter restoration
- Mental clarity during recovery

## Administration Methods:

### IV Infusion (Most Effective):
- 250-500mg+ per session
- 2-4 hour infusion time
- Series of 4-10 treatments
- Maintenance monthly

### Subcutaneous Injection:
- 50-100mg daily
- Self-administered at home
- Convenient maintenance
- Lower immediate impact

### Oral Precursors:
- NMN (Nicotinamide Mononucleotide)
- NR (Nicotinamide Riboside)
- Less direct but supportive
- Daily supplementation

## What to Expect During IV:
- Mild chest tightness (normal)
- Flushing sensation
- Increased energy during/after
- Some experience cramping (slow rate)
- Deep relaxation

## Supporting NAD+ Naturally:
- Exercise (especially HIIT)
- Intermittent fasting
- Cold exposure
- Quality sleep
- Reducing alcohol
- Reducing processed foods
    `,
    excerpt: "NAD+ therapy for energy, cognitive enhancement, and longevity support.",
    categorySlug: "iv-therapy"
  },
  // Parasite Cleanse
  {
    title: "Comprehensive Parasite Cleanse Protocol",
    slug: "parasite-cleanse-complete-protocol",
    contentType: "lesson",
    content: `
# Parasite Cleanse Protocol

## Understanding Parasitic Infections
Parasites are more common than most realize. Studies suggest up to 80% of the population may harbor some form of parasitic organism.

## Types of Parasites:

### Protozoa (Single-celled):
- Giardia lamblia
- Cryptosporidium
- Entamoeba histolytica
- Blastocystis hominis

### Helminths (Worms):
- Roundworms (Ascaris)
- Pinworms (Enterobius)
- Hookworms
- Tapeworms
- Liver flukes

## Signs of Parasitic Infection:
- Chronic digestive issues
- Unexplained fatigue
- Skin conditions (eczema, hives)
- Teeth grinding at night
- Anal itching
- Joint and muscle pain
- Food cravings (especially sugar)
- Mood changes
- Nutrient deficiencies despite supplementation

## The Cleanse Protocol:

### Phase 1: Preparation (Week 1-2)
**Goal: Open drainage pathways**
- Liver/gallbladder support
- Lymphatic drainage
- Bowel regularity ensured
- Binders introduced

### Phase 2: Active Cleanse (Week 3-10)
**Antimicrobial Protocol:**
- **Wormwood** - broad-spectrum antiparasitic
- **Black walnut hull** - kills adult worms
- **Clove** - destroys eggs
- **Mimosa pudica** - physically traps parasites
- **Neem** - ancient Ayurvedic remedy

**Rotation Schedule:**
- Different herbs on different days
- Prevents resistance
- Full moon intensification (parasites more active)

### Phase 3: Biofilm Breakdown (Ongoing)
- NAC (N-Acetyl Cysteine)
- Serrapeptase/Nattokinase
- Oregano oil
- Berberine

### Phase 4: Restoration (Week 11-12)
- Gut healing nutrients
- Probiotic restoration
- Immune support
- Prevention strategies

## Diet During Cleanse:
### Avoid:
- Sugar and refined carbs
- Alcohol
- Processed foods
- Dairy (feeds parasites)
- Pork (high parasite risk)

### Emphasize:
- Raw garlic
- Pumpkin seeds
- Papaya seeds
- Fermented vegetables
- Bitter greens
- Plenty of fiber

## What to Expect:
- Herxheimer reactions possible
- Symptom fluctuations
- Visible parasites in stool (not always)
- Gradual improvement in symptoms
- Full moon symptom flares

## Safety Notes:
- Not during pregnancy
- Support liver function
- Stay hydrated
- Work with practitioner
- Complete full protocol
    `,
    excerpt: "Natural parasite elimination for optimal gut health using proven protocols.",
    categorySlug: "protocols"
  }
];

const ADDITIONAL_QUIZ_QUESTIONS = [
  // Peptide Quiz
  { quizId: "quiz-bpc157", text: "What is the recommended storage temperature for reconstituted BPC-157?", type: "multiple_choice", explanation: "Reconstituted BPC-157 should be stored in the refrigerator (36-46°F) and used within 30 days.", sortOrder: 1, points: 1 },
  { quizId: "quiz-bpc157", text: "How many amino acids are in the BPC-157 peptide chain?", type: "multiple_choice", explanation: "BPC-157 is a pentadecapeptide, meaning it contains 15 amino acids.", sortOrder: 2, points: 1 },
  { quizId: "quiz-bpc157", text: "What is the primary mechanism by which BPC-157 promotes healing?", type: "multiple_choice", explanation: "BPC-157 primarily works by upregulating growth factors and promoting angiogenesis (new blood vessel formation).", sortOrder: 3, points: 1 },
  { quizId: "quiz-bpc157", text: "Which route of administration is best for gastrointestinal issues?", type: "multiple_choice", explanation: "Oral or sublingual administration is most effective for GI issues as it delivers BPC-157 directly to the gut.", sortOrder: 4, points: 1 },
  { quizId: "quiz-bpc157", text: "What type of water should be used to reconstitute BPC-157?", type: "multiple_choice", explanation: "Bacteriostatic water (BAC water) should be used for reconstitution as it contains a preservative.", sortOrder: 5, points: 1 },
  // Mineral Quiz
  { quizId: "quiz-mineral", text: "How many essential minerals are included in Dr. Wallach's 90 essential nutrients?", type: "multiple_choice", explanation: "Dr. Wallach identified 60 essential minerals as part of the 90 essential nutrients.", sortOrder: 1, points: 1 },
  { quizId: "quiz-mineral", text: "Which mineral deficiency is most commonly associated with muscle cramps?", type: "multiple_choice", explanation: "Magnesium deficiency is the most common cause of muscle cramps and spasms.", sortOrder: 2, points: 1 },
  { quizId: "quiz-mineral", text: "What is the relationship between zinc and copper?", type: "multiple_choice", explanation: "Zinc and copper are antagonistic - high zinc intake can deplete copper levels.", sortOrder: 3, points: 1 },
  { quizId: "quiz-mineral", text: "Which mineral is essential for thyroid hormone production?", type: "multiple_choice", explanation: "Iodine is essential for the synthesis of thyroid hormones T3 and T4.", sortOrder: 4, points: 1 },
  { quizId: "quiz-mineral", text: "What mineral is critical for blood sugar regulation?", type: "multiple_choice", explanation: "Chromium is essential for insulin function and blood sugar regulation.", sortOrder: 5, points: 1 },
  // ECS Quiz (new)
  { quizId: "quiz-ecs", text: "In what year was the first cannabinoid receptor discovered?", type: "multiple_choice", explanation: "The CB1 receptor was first discovered in 1988 at St. Louis University.", sortOrder: 1, points: 1 },
  { quizId: "quiz-ecs", text: "What is the 'bliss molecule' called?", type: "multiple_choice", explanation: "Anandamide is called the 'bliss molecule' - its name comes from the Sanskrit word 'ananda' meaning bliss.", sortOrder: 2, points: 1 },
  { quizId: "quiz-ecs", text: "Which receptor type is primarily found in the immune system?", type: "multiple_choice", explanation: "CB2 receptors are primarily found in immune cells, the spleen, and lymphoid tissue.", sortOrder: 3, points: 1 },
  { quizId: "quiz-ecs", text: "What does CECD stand for?", type: "multiple_choice", explanation: "CECD stands for Clinical Endocannabinoid Deficiency.", sortOrder: 4, points: 1 },
  { quizId: "quiz-ecs", text: "Which activity naturally increases anandamide levels?", type: "multiple_choice", explanation: "Aerobic exercise naturally increases anandamide levels, contributing to the 'Runner's High'.", sortOrder: 5, points: 1 },
  { quizId: "quiz-ecs", text: "What is 2-AG?", type: "multiple_choice", explanation: "2-AG (2-Arachidonoylglycerol) is the most abundant endocannabinoid in the human body.", sortOrder: 6, points: 1 }
];

const QUIZ_ANSWERS = [
  // BPC-157 answers
  { questionId: "q-bpc-storage", text: "Refrigerator (36-46°F)", isCorrect: true },
  { questionId: "q-bpc-storage", text: "Room temperature", isCorrect: false },
  { questionId: "q-bpc-storage", text: "Freezer", isCorrect: false },
  { questionId: "q-bpc-storage", text: "Any temperature", isCorrect: false },
  
  { questionId: "q-bpc-amino", text: "15 amino acids", isCorrect: true },
  { questionId: "q-bpc-amino", text: "10 amino acids", isCorrect: false },
  { questionId: "q-bpc-amino", text: "20 amino acids", isCorrect: false },
  { questionId: "q-bpc-amino", text: "5 amino acids", isCorrect: false },
  
  { questionId: "q-bpc-mechanism", text: "Angiogenesis and growth factor upregulation", isCorrect: true },
  { questionId: "q-bpc-mechanism", text: "Direct tissue regeneration", isCorrect: false },
  { questionId: "q-bpc-mechanism", text: "Hormonal stimulation", isCorrect: false },
  { questionId: "q-bpc-mechanism", text: "Immune suppression", isCorrect: false },
  
  { questionId: "q-bpc-gi", text: "Oral or sublingual", isCorrect: true },
  { questionId: "q-bpc-gi", text: "Subcutaneous only", isCorrect: false },
  { questionId: "q-bpc-gi", text: "Intramuscular", isCorrect: false },
  { questionId: "q-bpc-gi", text: "Intravenous", isCorrect: false },
  
  { questionId: "q-bpc-water", text: "Bacteriostatic water", isCorrect: true },
  { questionId: "q-bpc-water", text: "Tap water", isCorrect: false },
  { questionId: "q-bpc-water", text: "Distilled water", isCorrect: false },
  { questionId: "q-bpc-water", text: "Saline solution", isCorrect: false }
];

export async function seedTrainingContent() {
  console.log("[Seed] Starting comprehensive training content seed...");
  
  // Insert library items (lessons)
  for (const lesson of COMPREHENSIVE_LESSONS) {
    try {
      await db.insert(libraryItems).values({
        title: lesson.title,
        slug: lesson.slug,
        contentType: "training",
        content: lesson.content,
        excerpt: lesson.excerpt,
        categorySlug: lesson.categorySlug,
        isActive: true,
        requiresMembership: true
      }).onConflictDoNothing();
      console.log(`[Seed] Created lesson: ${lesson.title}`);
    } catch (error: any) {
      if (!error.message.includes("duplicate")) {
        console.error(`[Seed] Error creating lesson ${lesson.slug}:`, error.message);
      }
    }
  }
  
  // Create ECS Quiz if it doesn't exist
  try {
    await db.insert(quizzes).values({
      id: "quiz-ecs",
      title: "Endocannabinoid System Quiz",
      slug: "ecs-quiz",
      description: "Test your knowledge of the Endocannabinoid System",
      difficulty: "beginner",
      passingScore: 70,
      questionsCount: 6,
      isActive: true,
      requiresMembership: true
    }).onConflictDoNothing();
    console.log("[Seed] Created ECS quiz");
  } catch (error: any) {
    if (!error.message.includes("duplicate")) {
      console.error("[Seed] Error creating ECS quiz:", error.message);
    }
  }
  
  // Insert additional quiz questions
  for (const question of ADDITIONAL_QUIZ_QUESTIONS) {
    try {
      const questionId = `q-${question.quizId}-${question.sortOrder}`;
      await db.insert(quizQuestions).values({
        id: questionId,
        quizId: question.quizId,
        questionText: question.text,
        questionType: question.type,
        explanation: question.explanation,
        sortOrder: question.sortOrder,
        points: question.points,
        isActive: true
      }).onConflictDoNothing();
      console.log(`[Seed] Created question: ${question.text.substring(0, 50)}...`);
    } catch (error: any) {
      if (!error.message.includes("duplicate")) {
        console.error(`[Seed] Error creating question:`, error.message);
      }
    }
  }
  
  console.log("[Seed] Training content seed completed!");
}

// Run if executed directly
seedTrainingContent().catch(console.error);
