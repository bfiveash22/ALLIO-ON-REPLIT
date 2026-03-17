import { db } from "../db";
import { dianeKnowledge } from "@shared/schema";

interface GersonEntry {
  category: "therapy_protocol" | "recipe" | "supplement" | "detox" | "diet_plan" | "healing_modality" | "research" | "case_study";
  title: string;
  summary: string;
  content: string;
  sourceDocument: string;
  driveFileId: string;
  tags: string[];
  relatedProducts: string[];
  relatedGenes: string[];
  isActive: boolean;
}

const GERSON_THERAPY_DATA: GersonEntry[] = [
  {
    category: "therapy_protocol",
    title: "Gerson Therapy Overview",
    summary: "A comprehensive metabolic therapy developed by Dr. Max Gerson for cancer and chronic disease support through diet, juicing, and detoxification.",
    content: `The Gerson Therapy is a natural wellness system developed by Dr. Max Gerson (1881-1959) that activates the body's extraordinary ability to heal itself. The therapy is based on the role of minerals, enzymes, and other nutrients in healing.

KEY PRINCIPLES:
1. DETOXIFICATION - Coffee enemas to detoxify the liver and eliminate toxic buildup
2. NUTRITION - Massive quantities of nutrients through 13 fresh organic juices daily
3. SUPPLEMENTATION - Potassium compound, thyroid hormone, Lugol's solution, pancreatic enzymes, B-12

CORE COMPONENTS:
- 13 glasses of fresh, raw carrot/apple and green-leaf juices daily
- Three full vegetarian meals from organically grown fruits and vegetables
- Coffee enemas up to 5 times daily
- No salt, oil, fats, or animal proteins (with limited exceptions)
- Potassium compound solution added to juices
- Thyroid and liver support supplements

The therapy works by flooding the body with nutrients from about 15-20 pounds of organically-grown fruits and vegetables daily while simultaneously detoxifying the body.`,
    sourceDocument: "A Cancer Therapy: Results of Fifty Cases by Dr. Max Gerson",
    driveFileId: "1iWVxSRpfYLF62HMxKennjoF-LDQ1wOS8",
    tags: ["gerson", "cancer therapy", "detox", "juicing", "metabolic therapy", "coffee enema"],
    relatedProducts: ["Organic Carrot Juice", "Coffee Enema Kit", "Potassium Compound", "Lugol's Solution", "Pancreatic Enzymes", "Thyroid Support"],
    relatedGenes: ["P53", "BCL-2", "VEGF", "NFkB", "COX-2", "mTOR"],
    isActive: true
  },
  {
    category: "recipe",
    title: "Gerson Green Juice Recipe",
    summary: "The essential green juice recipe used in Gerson Therapy, rich in chlorophyll and enzymes.",
    content: `GERSON GREEN JUICE RECIPE

Ingredients (makes approximately 8 oz of juice):
- Romaine lettuce (or red leaf lettuce) - 3-4 leaves
- Swiss chard - 2-3 leaves
- Beet tops (young leaves) - 2-3 leaves
- Watercress - small bunch
- Red cabbage - 2-3 leaves
- Green bell pepper - 1/4 pepper
- Endive (optional) - 2-3 leaves
- Escarole (optional) - 2-3 leaves
- 1 medium green apple (Granny Smith)

Instructions:
1. Wash all produce thoroughly with filtered water
2. Use a two-stage juicer (masticating grinder + hydraulic press) for maximum nutrient extraction
3. Alternate leafy greens with apple chunks through the grinder
4. Press the pulp immediately using hydraulic press
5. Drink immediately for maximum enzyme activity

TIMING: Consume one 8oz glass every hour, alternating with carrot-apple juice
TEMPERATURE: Drink at room temperature, never heated
STORAGE: Do not store - must be consumed immediately for maximum therapeutic benefit

This juice provides:
- Chlorophyll for blood building
- Potassium for cellular function
- Live enzymes for digestion
- Phytonutrients for healing`,
    sourceDocument: "A Cancer Therapy: Results of Fifty Cases by Dr. Max Gerson",
    driveFileId: "1iWVxSRpfYLF62HMxKennjoF-LDQ1wOS8",
    tags: ["gerson", "juice recipe", "green juice", "chlorophyll", "enzymes"],
    relatedProducts: ["Norwalk Juicer", "Organic Leafy Greens", "Green Apple Organic"],
    relatedGenes: [],
    isActive: true
  },
  {
    category: "recipe",
    title: "Gerson Carrot-Apple Juice Recipe",
    summary: "The foundational carrot-apple juice that forms the basis of Gerson Therapy nutrition.",
    content: `GERSON CARROT-APPLE JUICE RECIPE

Ingredients (makes approximately 8 oz of juice):
- Organic carrots - 3-4 medium carrots (about 1 pound)
- Green apple (Granny Smith) - 1 small to medium

Instructions:
1. Wash carrots thoroughly - do not peel (nutrients are in the skin)
2. Cut carrots into pieces suitable for your grinder
3. Core the apple and cut into pieces
4. Use a two-stage juicer (masticating grinder + hydraulic press)
5. Grind carrots and apple together
6. Press immediately using hydraulic press
7. Add potassium compound as directed
8. Drink immediately

FREQUENCY: 4-5 glasses per day, alternating with green juice
TIMING: First juice at 8 AM, then every hour until evening

THERAPEUTIC BENEFITS:
- Beta-carotene (Vitamin A precursor) - immune support, tissue repair
- Natural sugars for energy without insulin spike
- Potassium for cellular detoxification
- Live enzymes for metabolic function

IMPORTANT NOTES:
- Only use organically grown produce
- Never add anything except directed supplements
- Temperature should be room temperature
- Must be consumed within 20 minutes of pressing`,
    sourceDocument: "A Cancer Therapy: Results of Fifty Cases by Dr. Max Gerson",
    driveFileId: "1iWVxSRpfYLF62HMxKennjoF-LDQ1wOS8",
    tags: ["gerson", "juice recipe", "carrot juice", "beta-carotene", "potassium"],
    relatedProducts: ["Organic Carrots", "Green Apple Organic", "Norwalk Juicer", "Potassium Compound"],
    relatedGenes: [],
    isActive: true
  },
  {
    category: "detox",
    title: "Gerson Coffee Enema Protocol",
    summary: "The detoxification procedure central to Gerson Therapy that stimulates liver function and bile flow.",
    content: `GERSON COFFEE ENEMA PROTOCOL

The coffee enema is a critical component of Gerson Therapy that opens the bile ducts, stimulates the liver to produce more bile, and enhances the body's ability to eliminate toxins.

MATERIALS NEEDED:
- Enema bucket or bag (stainless steel or glass preferred)
- Medical-grade silicone tubing
- Organic, light or medium roast coffee (not instant, not decaf)
- Filtered or distilled water
- Lubricant (organic coconut oil)

PREPARATION:
1. Add 3 rounded tablespoons of drip-grind organic coffee to 1 quart of filtered water
2. Boil for 3 minutes, then simmer for 15 minutes
3. Strain through fine mesh or paper filter
4. Add enough water to make 1 quart
5. Cool to body temperature (test on wrist)

PROCEDURE:
1. Lie on right side with knees drawn up
2. Insert tube 6-8 inches into rectum
3. Allow coffee to flow in slowly
4. Hold for 12-15 minutes
5. Release and evacuate

FREQUENCY: Up to 5 times daily during intensive therapy
TIMING: Usually after meals and when detox symptoms occur

THERAPEUTIC MECHANISM:
- Caffeine absorbed through hemorrhoidal vein goes directly to liver
- Theophylline and theobromine dilate blood vessels and bile ducts
- Palmitic acid enhances glutathione S-transferase (detox enzyme) by 600-700%
- Stimulates vagus nerve for increased bile flow

CAUTIONS:
- Always use organic coffee
- Never use hot coffee
- Ensure electrolyte balance with potassium supplementation
- Consult healthcare provider before starting`,
    sourceDocument: "A Cancer Therapy: Results of Fifty Cases by Dr. Max Gerson",
    driveFileId: "1iWVxSRpfYLF62HMxKennjoF-LDQ1wOS8",
    tags: ["gerson", "coffee enema", "detox", "liver support", "glutathione"],
    relatedProducts: ["Organic Coffee for Enemas", "Enema Bucket Kit", "Potassium Compound"],
    relatedGenes: ["P450", "GST", "NRF2"],
    isActive: true
  },
  {
    category: "diet_plan",
    title: "Gerson Therapy Daily Schedule",
    summary: "The complete daily schedule for Gerson Therapy including juices, meals, enemas, and supplements.",
    content: `GERSON THERAPY DAILY SCHEDULE

EARLY MORNING (6:00 AM):
- Wake and prepare first juices
- Coffee enema #1

8:00 AM - JUICE #1:
- Orange juice (8 oz) OR Carrot-apple juice

9:00 AM - JUICE #2:
- Green juice (8 oz)
- Add potassium compound

BREAKFAST (9:30 AM):
- Oatmeal with fresh fruit
- Whole grain bread (salt-free, fat-free)
- Fresh fruit plate

10:00 AM - JUICE #3:
- Carrot-apple juice (8 oz)

11:00 AM - JUICE #4:
- Green juice (8 oz)
- Coffee enema #2

12:00 PM - JUICE #5:
- Carrot-apple juice (8 oz)

LUNCH (12:30 PM):
- Large raw vegetable salad
- Hippocrates soup
- Baked potato
- Steamed vegetables
- Fresh fruit for dessert

1:00 PM - JUICE #6:
- Green juice (8 oz)

2:00 PM - JUICE #7:
- Carrot-apple juice (8 oz)
- Coffee enema #3

3:00 PM - JUICE #8:
- Green juice (8 oz)

4:00 PM - JUICE #9:
- Carrot-apple juice (8 oz)

5:00 PM - JUICE #10:
- Green juice (8 oz)
- Coffee enema #4

DINNER (6:00 PM):
- Hippocrates soup
- Large salad
- Baked or steamed vegetables
- Whole grain bread
- Fresh fruit dessert

7:00 PM - JUICE #11:
- Carrot-apple juice (8 oz)

8:00 PM - JUICE #12:
- Green juice (8 oz)
- Coffee enema #5 (if needed)

9:00 PM - JUICE #13:
- Final carrot-apple juice (8 oz)

SUPPLEMENTS (taken with juices):
- Potassium compound: Added to 10 juices
- Thyroid: 5 grains daily (split doses)
- Lugol's solution: 3 drops 3x daily
- Liver capsules/injection: As directed
- Pancreatin: 3 tablets 4x daily
- Acidol pepsin: With meals
- Niacin: 50mg 6x daily
- B-12 injection: Weekly`,
    sourceDocument: "A Cancer Therapy: Results of Fifty Cases by Dr. Max Gerson",
    driveFileId: "1iWVxSRpfYLF62HMxKennjoF-LDQ1wOS8",
    tags: ["gerson", "daily schedule", "meal plan", "supplement protocol", "therapy schedule"],
    relatedProducts: ["Potassium Compound", "Thyroid Support", "Lugol's Solution", "Pancreatic Enzymes", "B-12 Injectable", "Niacin"],
    relatedGenes: [],
    isActive: true
  },
  {
    category: "recipe",
    title: "Hippocrates Soup (Gerson Special Soup)",
    summary: "The special vegetable soup created by Dr. Gerson that is consumed twice daily as part of the therapy.",
    content: `HIPPOCRATES SOUP (GERSON SPECIAL SOUP)

This soup, named after the father of medicine, is a cornerstone of Gerson Therapy and is consumed at least twice daily.

INGREDIENTS:
- 1 medium celery knob (celeriac) - or 3-4 stalks of celery
- 1 medium parsley root (if available)
- 2 small leeks (if not available, replace with onions)
- 1.5 lbs tomatoes or more
- 2 medium onions
- 1 lb potatoes
- A little parsley
- Garlic as desired
- Filtered water to cover

INSTRUCTIONS:
1. Do not peel any vegetables (nutrients are in the skin)
2. Wash all vegetables thoroughly
3. Cut vegetables into cubes (roughly 1-inch pieces)
4. Place all vegetables in a large stainless steel pot
5. Cover with filtered water (do not use aluminum cookware)
6. Bring to a boil, then reduce to low simmer
7. Cook slowly for 1.5 to 2 hours until all vegetables are soft
8. Put through a food mill in small quantities (mashing helps retain fiber)
9. Vary the amount of water for desired consistency

SERVING:
- Serve warm (not hot)
- Consume at least two bowls daily (lunch and dinner)
- May be stored in glass jars in refrigerator for up to 2 days
- Reheat gently - never microwave

THERAPEUTIC BENEFITS:
- Potassium-rich for cellular health
- Easy to digest for compromised systems
- Provides essential minerals in bioavailable form
- Supports kidney function
- Anti-inflammatory properties from onion and garlic

VARIATIONS ALLOWED:
- Add more garlic for immune support
- Include a small amount of fresh herbs after cooking
- Adjust consistency to member preference

DO NOT ADD:
- Salt
- Oil or fat
- Pepper or spices
- Meat stock`,
    sourceDocument: "A Cancer Therapy: Results of Fifty Cases by Dr. Max Gerson",
    driveFileId: "1iWVxSRpfYLF62HMxKennjoF-LDQ1wOS8",
    tags: ["gerson", "hippocrates soup", "vegetable soup", "healing soup", "potassium"],
    relatedProducts: ["Organic Vegetables", "Food Mill", "Stainless Steel Cookware"],
    relatedGenes: [],
    isActive: true
  },
  {
    category: "healing_modality",
    title: "Gerson Therapy Liver Support Protocol",
    summary: "The liver support components of Gerson Therapy including castor oil packs and liver extract.",
    content: `GERSON THERAPY LIVER SUPPORT PROTOCOL

The liver is central to Gerson Therapy as it is responsible for detoxification and metabolic regulation. Dr. Gerson developed specific protocols to support and regenerate liver function.

CASTOR OIL PROTOCOL:
- Take 2 tablespoons castor oil orally (by mouth)
- Follow with a small cup of black coffee
- Apply castor oil pack to liver area (right side of abdomen)
- Keep warm with heating pad for 1-2 hours
- Perform every other day during intensive therapy

LIVER EXTRACT/CAPSULES:
- Crude liver extract provides B-12 and other liver-supporting factors
- Originally given as injections, now available as desiccated liver capsules
- Dosage: 2-3 capsules 3x daily with meals

THYROID SUPPORT:
- Thyroid hormone supports metabolism and liver function
- Armour thyroid or desiccated thyroid gland
- Dosage: Start at 1 grain, increase gradually to 5 grains daily
- Split into 2-3 doses throughout the day

LUGOL'S SOLUTION (Potassium Iodide):
- Supports thyroid function
- Antimicrobial properties
- Dosage: 3 drops in juice 3x daily
- Add to carrot-apple juice

POTASSIUM COMPOUND:
Dr. Gerson's potassium compound formula:
- 33g Potassium gluconate
- 33g Potassium acetate
- 33g Potassium phosphate monobasic
- Dissolved in 1 liter of water
- Add 2 teaspoons to each juice (10 juices daily)

MECHANISM OF ACTION:
1. Coffee enemas open bile ducts and increase glutathione
2. Potassium restores cellular potassium/sodium balance
3. Thyroid accelerates metabolism and healing
4. Liver extract provides regenerative factors
5. Iodine supports thyroid and immune function

SIGNS OF HEALING REACTIONS:
- Temporary worsening of symptoms
- Flu-like symptoms
- Skin eruptions
- Digestive changes
- These indicate the body is detoxifying`,
    sourceDocument: "A Cancer Therapy: Results of Fifty Cases by Dr. Max Gerson",
    driveFileId: "1iWVxSRpfYLF62HMxKennjoF-LDQ1wOS8",
    tags: ["gerson", "liver support", "castor oil", "potassium compound", "thyroid", "detox"],
    relatedProducts: ["Castor Oil Pack Kit", "Desiccated Liver", "Armour Thyroid", "Lugol's Solution", "Potassium Compound"],
    relatedGenes: ["CYP450", "GST", "UGT", "SULT"],
    isActive: true
  },
  {
    category: "research",
    title: "Gerson Therapy Scientific Rationale",
    summary: "The scientific principles behind Gerson Therapy including sodium/potassium balance, oxidative phosphorylation, and tissue damage theory.",
    content: `GERSON THERAPY SCIENTIFIC RATIONALE

Dr. Max Gerson developed his therapy based on careful observation of member outcomes and the scientific understanding of his era. Modern research continues to validate many of his principles.

SODIUM/POTASSIUM BALANCE:
- Cancer cells have elevated sodium and depleted potassium
- Healthy cells maintain high intracellular potassium
- Gerson therapy floods the body with potassium while restricting sodium
- This helps restore normal cell membrane potential
- Modern research confirms: K+/Na+ ratio affects gene expression, cell cycle, and apoptosis

TISSUE DAMAGE THEORY:
- Dr. Gerson observed that cancer develops in "sick" tissue
- He believed healing the tissue environment would eliminate cancer
- This aligns with modern understanding of the tumor microenvironment
- Inflammation and oxidative stress create conditions favorable to cancer

OXIDATIVE METABOLISM:
- Cancer cells rely on glycolysis (Warburg effect)
- Healthy cells use oxidative phosphorylation
- Gerson therapy supports mitochondrial function
- Thyroid hormone, CoQ10 precursors from vegetables, and potassium all support oxidative metabolism

LIVER FUNCTION:
- The liver is the primary detoxification organ
- Cancer members often have compromised liver function
- Coffee enemas increase glutathione S-transferase by 600-700%
- This enhances Phase II liver detoxification

IMMUNE ACTIVATION:
- Fresh juices provide immune-supporting phytonutrients
- Detoxification reduces immune burden
- Potassium supports T-cell function
- Beta-carotene and other nutrients support immune surveillance

RELEVANT TUMOR GENES:
- P53 (tumor suppressor): Supported by nutrients in Gerson juices
- BCL-2 (anti-apoptotic): Potassium helps normalize
- VEGF (angiogenesis): Reduced by detoxification and anti-inflammatory diet
- NFkB (inflammation): Inhibited by quercetin, curcumin (sometimes added)
- COX-2: Reduced by elimination of pro-inflammatory foods
- mTOR: Caloric moderation in therapy reduces mTOR signaling

DOCUMENTED OUTCOMES:
- 1958 US Congressional testimony documented cancer remissions
- Gerson Institute continues to report case studies
- Peer-reviewed publications in alternative medicine journals
- Most dramatic results in melanoma and other solid tumors`,
    sourceDocument: "A Cancer Therapy: Results of Fifty Cases by Dr. Max Gerson",
    driveFileId: "1iWVxSRpfYLF62HMxKennjoF-LDQ1wOS8",
    tags: ["gerson", "scientific rationale", "warburg effect", "sodium potassium", "oxidative metabolism", "tumor microenvironment"],
    relatedProducts: [],
    relatedGenes: ["P53", "BCL-2", "VEGF", "NFkB", "COX-2", "mTOR", "PTEN", "c-MET"],
    isActive: true
  }
];

export async function seedGersonTherapy() {
  console.log("[Seed] Starting Gerson Therapy knowledge base seed...");
  
  try {
    for (const entry of GERSON_THERAPY_DATA) {
      await db.insert(dianeKnowledge).values(entry);
      console.log(`[Seed] Added: ${entry.title}`);
    }
    
    console.log(`[Seed] Successfully seeded ${GERSON_THERAPY_DATA.length} Gerson Therapy entries`);
    return { success: true, count: GERSON_THERAPY_DATA.length };
  } catch (error: any) {
    console.error("[Seed] Error seeding Gerson Therapy:", error);
    return { success: false, error: error.message };
  }
}
