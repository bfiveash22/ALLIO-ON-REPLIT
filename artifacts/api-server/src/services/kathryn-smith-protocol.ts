import type { PatientProfile, HealingProtocol } from "@shared/types/protocol-assembly";

export function buildKathrynSmithProfile(): PatientProfile {
  return {
    patientName: "Kathryn Smith",
    patientAge: 65,
    gender: "Female",
    location: "Fort Worth, TX",
    chiefComplaints: [
      "Recurrent breast cancer (ER+/PR+/HER2+) - second occurrence in right breast",
      "Lymph node involvement (right armpit nodule confirmed via biopsy)",
      "Chronic respiratory issues (cough, mucus production)",
      "Severe mineral deficiencies (copper, iodine, selenium)",
      "Mercury toxicity from amalgam filling still present",
      "Unresolved childhood trauma contributing to hormone dysregulation"
    ],
    currentDiagnoses: [
      "Breast Cancer - ER+/PR+/HER2+ (second occurrence, Feb 2026)",
      "Lymph node metastasis (right axillary)",
      "Chronic allergic rhinitis / hay fever",
      "Eczema (history)",
      "Stress-related urinary urgency (nervous bladder)",
      "Severe copper deficiency (solid gray hair indicator)",
      "Mercury toxicity (amalgam filling present since teenage years)"
    ],
    currentMedications: [],
    currentSupplements: [],
    allergies: ["Hay fever / seasonal allergies"],
    surgicalHistory: [
      "Heart murmur surgery at 14 months (hole closure - successful)",
      "Lumpectomy right breast (~2018, first breast cancer occurrence)"
    ],
    familyHistory: [
      "Mother - breast cancer (traditional chemo/radiation - poor outcome)",
      "Sister - breast cancer (traditional chemo/radiation - poor outcome)",
      "Grandmother - cancer (traditional treatment)",
      "Sister - asthma (childhood respiratory issues from shared mold exposure)",
      "Father - Navy veteran, electronics engineer, former smoker"
    ],
    environmentalExposures: [
      "Chronic mold exposure ages 6-13 (bedroom roof leak - mycotoxin burden)",
      "Mercury amalgam filling (1 filling, still present from teenage years)",
      "Father's secondhand smoke in home (early childhood)",
      "Tetracycline exposure as child (resulted in permanent gray teeth)"
    ],
    traumaHistory: [
      "Sexual abuse by uncle ages 6-10 (not disclosed until age 32)",
      "Early puberty onset at age 10 (trauma-cortisol-estrogen cascade)",
      "22 years of undisclosed trauma - prolonged psychological impact",
      "Family dynamics stress (sister's behavioral issues dominated family attention)"
    ],
    lifestyleFactors: {
      diet: "Standard American diet - needs complete overhaul",
      exercise: "Minimal - no organized sports history beyond PE",
      sleep: "Disrupted by chronic cough and mucus production",
      stress: "Moderate-high (cancer recurrence, family concerns)",
      alcohol: "Unknown - to be assessed",
      smoking: "Never"
    },
    goals: [
      "Eliminate breast cancer without chemotherapy or radiation",
      "Address root causes: mold burden, mineral deficiencies, trauma",
      "Remove mercury amalgam filling safely",
      "Restore hormonal balance (address estrogen dominance)",
      "Strengthen immune system and activate p53/p21 tumor suppressors",
      "Achieve cellular-level healing through FF PMA 5R Framework"
    ],
    medicalTimeline: [
      { ageRange: "Birth", year: "~1961", event: "Natural birth in San Diego, CA (not breastfed)", significance: "Non-breastfed - reduced initial immune transfer" },
      { ageRange: "1 year", year: "~1962", event: "Heart murmur diagnosed", significance: "Early cardiovascular stress" },
      { ageRange: "14 months", year: "~1962", event: "Heart surgery - hole closure (successful)", significance: "Early surgical intervention, anesthesia exposure" },
      { ageRange: "Ages 6-13", year: "1967-1974", event: "Chronic mold exposure from bedroom roof leak", significance: "CRITICAL: Mycotoxin burden, respiratory damage, pleomorphic bacterial shift" },
      { ageRange: "Ages 6-10", year: "1967-1971", event: "Sexual abuse by uncle", significance: "CRITICAL: Extreme cortisol imbalance triggering early puberty and lifelong hormone disruption" },
      { ageRange: "Ages 6-13", year: "1967-1974", event: "Chronic respiratory infections treated with tetracycline", significance: "Antibiotic damage to gut microbiome, permanent gray teeth" },
      { ageRange: "Age 10", year: "~1971", event: "Early puberty onset", significance: "Trauma-cortisol-estrogen cascade begins - estrogen dominance pathway established" },
      { ageRange: "Teenage", year: "~1975", event: "Amalgam filling placed + braces", significance: "Mercury exposure begins - still present in 2026" },
      { ageRange: "Age 23", year: "~1984", event: "Marriage (42 years by 2026)", significance: "Strong support system established" },
      { ageRange: "Age 32", year: "~1993", event: "First disclosure of childhood sexual abuse", significance: "22 years of undisclosed trauma - prolonged cortisol/hormone disruption" },
      { ageRange: "Adult", year: "Ongoing", event: "Chronic eczema, hay fever, persistent cough, mucus", significance: "Ongoing inflammatory burden from unresolved mold/mycotoxin exposure" },
      { ageRange: "~Age 57", year: "~2018", event: "First breast cancer diagnosis - right breast, lumpectomy only", significance: "Root causes NOT addressed - surgical removal only" },
      { ageRange: "Age 65", year: "Feb 2026", event: "Second breast cancer - ER+/PR+/HER2+, right breast + lymph node", significance: "Recurrence confirms unaddressed root causes; lymph node involvement indicates spread" }
    ],
    practitionerNotes: "This case exemplifies lifetime accumulation of insults: mold/mycotoxin childhood exposure, severe trauma triggering early puberty and lifelong estrogen dominance, critical mineral depletion (copper for p53/p21, iodine for breast tissue, selenium for antioxidant defense), ongoing mercury exposure from amalgam, and incomplete first cancer treatment (lumpectomy only, no root cause work). Patient is highly motivated, has strong family support (husband, 6 children, 14 grandchildren), and is firmly opposed to chemo/radiation based on witnessing poor outcomes in mother, sister, and grandmother. Early engagement (2 days post-diagnosis) and high expected compliance make this an ideal candidate for aggressive FF PMA 5R protocol.",
    rawTranscript: "",
    intakeFormId: undefined,
  };
}

export function buildKathrynSmithProtocol(): HealingProtocol {
  return {
    patientName: "Kathryn Smith",
    patientAge: 65,
    generatedDate: "2026-03-16",
    protocolDurationDays: 90,
    summary: "Comprehensive 90-day healing protocol for Kathryn Smith addressing recurrent ER+/PR+/HER2+ breast cancer through the FF PMA 5R Framework. This protocol targets six identified root causes: childhood mold/mycotoxin burden, sexual abuse trauma-driven estrogen dominance, critical mineral deficiencies (copper/iodine/selenium), mercury toxicity from amalgam, viral/parasite load, and gut/mitochondrial dysfunction. The approach layers immune recalibration, senolytic clearing, hormonal rebalancing, aggressive detoxification, and oxygen-driven healing to restore cellular environment and reactivate tumor suppressor genes (p53/p21).",
    rootCauseAnalysis: [
      {
        rank: 1,
        cause: "Childhood Mold/Mycotoxin Exposure (Ages 6-13)",
        category: "Environmental Toxicity",
        details: "Chronic mold exposure from leaking bedroom roof throughout childhood. Mycotoxin burden led to pleomorphic bacterial shift, chronic respiratory damage, ongoing mucus production, and systemic inflammatory cascade. Treated with tetracycline (gut microbiome destruction). Sister developed asthma from same exposure.",
        relatedSymptoms: ["Chronic cough", "Mucus production", "Respiratory infections", "Allergies/hay fever", "Eczema"]
      },
      {
        rank: 2,
        cause: "Sexual Abuse Trauma (Ages 6-10) → Estrogen Dominance",
        category: "Trauma/Hormonal Disruption",
        details: "Extreme childhood trauma triggered sustained cortisol elevation, causing early puberty at age 10 (significantly premature). This established lifelong estrogen/testosterone dysregulation and estrogen dominance - the direct pathway to ER+/PR+ breast cancer. Trauma undisclosed for 22 years, compounding psychological and physiological impact.",
        relatedSymptoms: ["Early puberty", "Hormone disruption", "ER+/PR+ cancer", "Nervous bladder", "Stress response dysfunction"]
      },
      {
        rank: 3,
        cause: "Critical Mineral Deficiencies (Copper, Iodine, Selenium)",
        category: "Nutritional Deficiency",
        details: "Severe copper deficiency (solid gray hair is pathognomonic indicator) → p53/p21 gene dysfunction → failure of cell cycle control → uncontrolled cell replication. Iodine deficiency → breast tissue vulnerability (iodine is essential for breast tissue health and cancer prevention). Selenium deficiency → compromised antioxidant defense and thyroid function. Of the 90 nutrients needed daily, at least 60 must be supplemented.",
        relatedSymptoms: ["Gray hair (copper)", "Breast cancer recurrence (iodine)", "Immune dysfunction (selenium)", "Cell cycling failure (p53/p21)"]
      },
      {
        rank: 4,
        cause: "Mercury Toxicity (Amalgam Filling Still Present)",
        category: "Heavy Metal Toxicity",
        details: "One amalgam filling placed in teenage years still present in 2026 - approximately 50 years of continuous mercury vapor exposure. Mercury suppresses immune function, disrupts endocrine system, and creates environment for cell pathogen colonization. Immediate biodentist referral required for safe removal using SMART protocol.",
        relatedSymptoms: ["Immune suppression", "Endocrine disruption", "Cell pathogen colonization", "Neurological impact"]
      },
      {
        rank: 5,
        cause: "Viral & Parasite Load",
        category: "Pathogenic Burden",
        details: "Suppresses cancer suppression genes (p53, p21). Cell pathogen colonies present. Chickenpox/varicella exposure in early childhood establishes latent viral reservoirs. Combined with compromised immune function from mineral deficiencies and mercury toxicity, pathogenic burden compounds cancer risk.",
        relatedSymptoms: ["Immune suppression", "Cancer recurrence", "Chronic inflammation", "Gene suppression"]
      },
      {
        rank: 6,
        cause: "Gut/Mitochondrial Dysfunction",
        category: "Cellular Dysfunction",
        details: "Tetracycline damage to gut microbiome in childhood, combined with decades of standard American diet, has compromised gut integrity and mitochondrial energy production. Damaged mitochondria cannot properly trigger apoptosis in cancer cells. Chronic inflammation from gut dysbiosis fuels tumor microenvironment.",
        relatedSymptoms: ["Chronic inflammation", "Energy dysfunction", "Impaired apoptosis", "Immune dysregulation"]
      }
    ],
    phases: [
      {
        phaseNumber: 1,
        name: "Foundation & Detoxification",
        weekRange: "Weeks 1-4",
        focus: "Establish supplement foundation, begin aggressive detoxification, safe amalgam removal coordination, pathogen elimination, gut restoration initiation",
        keyActions: [
          "Begin full supplement protocol (minerals, vitamins, trace minerals)",
          "Start parasite/antiviral protocols (Fenbendazole, Ivermectin, Nitazoxanide)",
          "Initiate detox baths 3x/week minimum (baking soda + clay)",
          "Schedule biodentist appointment for amalgam removal (SMART protocol)",
          "Begin nebulization protocol 3x/weekly (respiratory support)",
          "Start injectable peptides: Thymogen, LL-37, PNC-27",
          "Begin PCC Bioregulator rotation",
          "HBOT 3x/weekly begins",
          "Implement FF Detox Bath protocol",
          "Begin DIANE anti-cancer diet immediately"
        ]
      },
      {
        phaseNumber: 2,
        name: "Targeted Therapy & Hormonal Rebalancing",
        weekRange: "Weeks 5-8",
        focus: "Hormone rebalancing, targeted cancer peptides, ECS optimization, stem cell consultation, heavy metal chelation post-amalgam removal",
        keyActions: [
          "Post-amalgam removal chelation protocol (if removal completed)",
          "Escalate PNC-27 (cancer-targeting peptide)",
          "Add FOXO4-DRI (senolytic clearing of zombie cells)",
          "Begin ECS suppository rotation for immune/gut optimization",
          "Stem cell consultation with holisticcare.com",
          "RGCC testing for personalized cancer vaccine development",
          "Liver & Gallbladder Cleanse protocol",
          "Continue HBOT 3x/weekly",
          "Trauma/mental health work initiation"
        ]
      },
      {
        phaseNumber: 3,
        name: "Regeneration & Immune Recalibration",
        weekRange: "Weeks 9-12",
        focus: "Transition to oral peptides, cellular regeneration, immune system rebuild, senescent cell clearing, mitochondrial restoration",
        keyActions: [
          "Transition to oral peptide phase (Thymogen Alpha-1, TB-Frag Max, GutFeeling, Pineal Pep)",
          "5-Day Fast protocol for autophagy and cellular cleanup",
          "Intensify MitoStac mitochondrial support",
          "Continue HBOT through week 12",
          "Reassess with labs and imaging",
          "Continue ECS suppository rotation",
          "Stem cell therapy if approved",
          "Continue trauma/mental health work"
        ]
      },
      {
        phaseNumber: 4,
        name: "Maintenance & Monitoring",
        weekRange: "Ongoing post-90 days",
        focus: "Sustain gains, long-term supplement maintenance, quarterly reassessment, continued dietary compliance",
        keyActions: [
          "Quarterly lab work and imaging",
          "Maintain core supplement stack",
          "Continue DIANE dietary protocol",
          "Monthly HBOT maintenance sessions",
          "Ongoing trauma resolution work",
          "Annual RGCC monitoring"
        ]
      }
    ],
    dailySchedule: {
      morning: [
        { time: "6:00 AM", item: "Warm Lemon Water + Nascent Iodine (3 drops)", details: "On empty stomach, wait 20 min before anything else", frequency: "Daily" },
        { time: "6:30 AM", item: "Morning Supplements", details: "Liquid Multivitamin, Liposomal Vitamin C 2000mg, D3-K2 10,000IU, Selenium 200mcg, Copper 2mg, Astaxanthin 12mg, Thiamine 100mg", frequency: "Daily" },
        { time: "6:45 AM", item: "PCC Bioregulators (AM)", details: "Thymus PCC + Mammary PCC + Liver PCC + Ovary PCC", frequency: "Daily" },
        { time: "7:00 AM", item: "Injectable Peptides (AM)", details: "LL-37 (5mg vial recon 1mL, 4-8 units subQ) + PNC-27 (10mg vial recon 1mL, 20 units subQ)", frequency: "Daily (LL-37 daily x6 weeks, PNC-27 daily x6 weeks)" },
        { time: "7:30 AM", item: "Breakfast", details: "DIANE Protocol: Anti-inflammatory, alkaline-focused meal. Organic eggs with turmeric, sauteed greens, avocado. No sugar, no GMO, no processed foods.", frequency: "Daily" },
        { time: "8:00 AM", item: "Reds + Greens + Elixir", details: "Mix in 12oz filtered water", frequency: "Daily" },
        { time: "8:30 AM", item: "Nebulization", details: "Saline + food-grade peroxide + nascent iodine - 15 minutes", frequency: "3x weekly (M/W/F)" }
      ],
      midday: [
        { time: "12:00 PM", item: "Lunch", details: "DIANE Protocol: Large salad with wild-caught fish or organic poultry. Olive oil/lemon dressing. Include cruciferous vegetables (broccoli, cauliflower, Brussels sprouts) for estrogen metabolism support.", frequency: "Daily" },
        { time: "12:30 PM", item: "Midday Supplements", details: "Liposomal Curcumin+ 1000mg, Turkey Tail 1000mg, Goldenseal 500mg, B17 (amygdalin) 500mg, Mighty Blue (methylene blue)", frequency: "Daily" },
        { time: "1:00 PM", item: "Parasite/Antiviral Protocol", details: "Fenbendazole 222mg (3 days on, 4 days off) + Ivermectin 12mg (2x/week) + Nitazoxanide 500mg (weeks 1-4)", frequency: "Per schedule" },
        { time: "2:00 PM", item: "HBOT Session", details: "2.0 ATA x 60 minutes at nearest FF clinic", frequency: "3x weekly (M/W/F)" }
      ],
      evening: [
        { time: "5:00 PM", item: "Injectable Peptides (PM)", details: "Thymogen (20mg vial recon 2mL, 20 units subQ M/W/F x4 weeks) + Epithalon/Pinealon (45mg vial recon 2mL, 10-20 units daily x30 days)", frequency: "Per schedule" },
        { time: "5:30 PM", item: "Dinner", details: "DIANE Protocol: Organic protein (grass-fed beef, wild salmon, or pastured chicken) with steamed vegetables, sweet potato or quinoa. Anti-inflammatory spices (turmeric, ginger, garlic).", frequency: "Daily" },
        { time: "6:00 PM", item: "Evening Supplements", details: "Trace Minerals (liquid), Flaxseed Oil 2 tbsp, C60 Oil, Probiotics/Kefir, Liposomal Selenium 200mcg", frequency: "Daily" },
        { time: "6:30 PM", item: "PCC Bioregulators (PM)", details: "Pineal PCC + Mammary PCC (PM dose)", frequency: "Daily" },
        { time: "7:00 PM", item: "Detox Bath", details: "FF Detox Bath Protocol: Baking soda (1 cup) + Bentonite Clay (1/2 cup) + Epsom salt (2 cups) + 10 drops essential oil (lavender). Soak 30-45 min.", frequency: "3x weekly minimum" }
      ],
      bedtime: [
        { time: "8:30 PM", item: "Zeolite Clinoptilolite", details: "Liquid zeolite - heavy metal binding (critical for mercury detox)", frequency: "Daily" },
        { time: "8:45 PM", item: "ECS Suppository", details: "Rotate: CBD/CBG suppository (immune/gut support) - follow ECS rotation protocol", frequency: "Nightly" },
        { time: "9:00 PM", item: "MitoStac", details: "Mitochondrial activation complex - replaces NMN, NR, TMG, PQQ, CoQ10, ALA, ALCAR. Supports NAD+, SIRT1/3/6, ATP, AMPK.", frequency: "Daily" },
        { time: "9:15 PM", item: "Mental/Trauma Work", details: "Positive affirmations, journaling, goal setting. Address childhood trauma processing. 15-20 minutes.", frequency: "Daily" },
        { time: "9:30 PM", item: "Blushwood Berry Extract", details: "Anti-tumor support - take on empty stomach before sleep", frequency: "Daily" }
      ]
    },
    injectablePeptides: [
      {
        name: "Thymogen",
        vialSize: "20mg",
        reconstitution: "Reconstitute with 2mL bacteriostatic water",
        dose: "20 units (200mcg)",
        frequency: "M/W/F",
        duration: "4 weeks",
        route: "Subcutaneous (abdominal rotation)",
        purpose: "Thymic immune reconstitution - critical for cancer immune response. Restores thymus function depleted by decades of cortisol elevation from trauma.",
        notes: "Store reconstituted vial refrigerated. Use insulin syringe 29-31 gauge."
      },
      {
        name: "LL-37",
        vialSize: "5mg",
        reconstitution: "Reconstitute with 1mL bacteriostatic water",
        dose: "4-8 units (20-40mcg)",
        frequency: "Daily",
        duration: "6 weeks",
        route: "Subcutaneous",
        purpose: "Antimicrobial peptide - broad-spectrum pathogen elimination. Targets bacterial, viral, and fungal pathogens contributing to tumor microenvironment.",
        notes: "Essential for addressing mycotoxin-related pathogenic colonization from childhood mold exposure."
      },
      {
        name: "PNC-27",
        vialSize: "10mg",
        reconstitution: "Reconstitute with 1mL bacteriostatic water",
        dose: "2mg (20 units)",
        frequency: "Daily",
        duration: "6 weeks",
        route: "Subcutaneous (rotate injection sites near affected area)",
        purpose: "Cancer-targeting peptide - selectively binds to HDM-2 protein overexpressed in cancer cells, inducing membranolysis (cancer cell destruction) while sparing healthy cells. Critical for ER+/PR+/HER2+ breast cancer.",
        notes: "PRIMARY ANTI-CANCER PEPTIDE. Rotate injection sites. Monitor for injection site reactions."
      },
      {
        name: "Epithalon + Pinealon",
        vialSize: "45mg combined",
        reconstitution: "Reconstitute with 2mL bacteriostatic water",
        dose: "10-20 units",
        frequency: "Daily",
        duration: "30 days (4 vials total)",
        route: "Subcutaneous",
        purpose: "Telomere protection and pineal gland restoration. Epithalon activates telomerase for cellular longevity. Pinealon supports melatonin production (anti-cancer, sleep quality).",
        notes: "Evening administration preferred for pineal synergy. Melatonin is a potent anti-cancer agent."
      },
      {
        name: "FOXO4-DRI",
        vialSize: "10mg",
        reconstitution: "Reconstitute with 2mL bacteriostatic water",
        dose: "5mg weekly",
        frequency: "Weekly",
        duration: "4 weeks (starting Week 5)",
        route: "Subcutaneous",
        purpose: "Senolytic peptide - triggers apoptosis in senescent (zombie) cells. Cancer recruits senescent cells to build tumor microenvironment. FOXO4-DRI disrupts this process.",
        notes: "Phase 2 peptide. Do not start until foundation phase complete. Monitor for temporary fatigue (expected as senescent cells clear)."
      },
      {
        name: "KGlow-25",
        vialSize: "25mg",
        reconstitution: "Reconstitute with 2mL bacteriostatic water",
        dose: "10-20 units",
        frequency: "M/W/F",
        duration: "90 days",
        route: "Subcutaneous",
        purpose: "Skin and tissue regeneration, collagen synthesis support, wound healing optimization.",
        notes: "Full protocol duration peptide."
      },
      {
        name: "Gonadorelin",
        vialSize: "2mg",
        reconstitution: "Reconstitute with 1mL bacteriostatic water",
        dose: "20 units",
        frequency: "M/W/F",
        duration: "8 weeks",
        route: "Subcutaneous",
        purpose: "GnRH analog - hormonal axis optimization. Supports proper FSH/LH signaling to rebalance estrogen/progesterone ratio disrupted since early puberty.",
        notes: "Critical for addressing estrogen dominance pathway. Monitor hormone levels at weeks 4 and 8."
      }
    ],
    oralPeptides: [
      { name: "Thymogen Alpha-1", dose: "1 capsule", frequency: "Daily", duration: "Weeks 7-12", purpose: "Immune modulation continuation after injectable Thymogen completes" },
      { name: "TB-Frag Max", dose: "1 capsule", frequency: "Daily", duration: "Weeks 7-12", purpose: "Tissue repair and anti-inflammatory support" },
      { name: "GutFeeling", dose: "1 capsule", frequency: "Twice daily", duration: "Weeks 7-12", purpose: "Gut barrier restoration - addresses tetracycline damage and microbiome rebuilding" },
      { name: "Pineal Pep", dose: "1 capsule", frequency: "Daily at bedtime", duration: "Weeks 7-12", purpose: "Pineal gland support, melatonin optimization for anti-cancer benefit" },
      { name: "5-Amino-1MQ", dose: "1 capsule", frequency: "Daily", duration: "Weeks 7-12", purpose: "NNMT inhibitor - metabolic optimization, fat metabolism, cellular energy" },
      { name: "Dihexa", dose: "1 capsule", frequency: "Daily", duration: "Weeks 7-12", purpose: "Cognitive support and neurotropic factor enhancement" }
    ],
    bioregulators: [
      { name: "Thymus PCC", targetOrgan: "Thymus", dose: "1 capsule", frequency: "Daily (AM)", duration: "90 days" },
      { name: "Mammary PCC", targetOrgan: "Mammary/Breast", dose: "1 capsule", frequency: "Twice daily (AM + PM)", duration: "90 days" },
      { name: "Liver PCC", targetOrgan: "Liver", dose: "1 capsule", frequency: "Daily (AM)", duration: "90 days" },
      { name: "Ovary PCC", targetOrgan: "Ovary", dose: "1 capsule", frequency: "Daily (AM)", duration: "90 days" },
      { name: "Pineal PCC", targetOrgan: "Pineal Gland", dose: "1 capsule", frequency: "Daily (PM)", duration: "90 days" }
    ],
    supplements: [
      { name: "Nascent Iodine", dose: "3 drops in warm lemon water", timing: "First thing AM, empty stomach", purpose: "Breast tissue protection, thyroid support, iodine deficiency correction" },
      { name: "Liquid Multivitamin", dose: "1 oz", timing: "Morning with breakfast", purpose: "Broad-spectrum nutritional foundation" },
      { name: "Mighty Blue (Methylene Blue)", dose: "Per label", timing: "Midday", purpose: "Mitochondrial electron transport support, anti-cancer properties" },
      { name: "Elixir", dose: "1 serving", timing: "Morning", purpose: "FF proprietary wellness blend" },
      { name: "Reds + Greens", dose: "1 scoop each", timing: "Morning in water", purpose: "Phytonutrient density, alkalizing" },
      { name: "Liposomal Vitamin C", dose: "2000mg", timing: "Morning", purpose: "Antioxidant defense, collagen synthesis, immune support" },
      { name: "Liposomal D3-K2", dose: "10,000 IU D3 / 200mcg K2", timing: "Morning with fat", purpose: "Immune modulation, calcium metabolism, anti-cancer (vitamin D receptor activation)" },
      { name: "Liposomal Curcumin+", dose: "1000mg", timing: "Midday", purpose: "Anti-inflammatory, NF-kB inhibition, tumor microenvironment disruption" },
      { name: "Selenium", dose: "200mcg", timing: "Morning + Evening (split)", purpose: "Antioxidant defense, thyroid function, p53 cofactor" },
      { name: "Copper", dose: "2mg", timing: "Morning", purpose: "CRITICAL: p53/p21 gene function restoration, cell cycle control" },
      { name: "Thiamine (B1)", dose: "100mg", timing: "Morning", purpose: "Mitochondrial energy metabolism, nerve function" },
      { name: "Astaxanthin", dose: "12mg", timing: "Morning with fat", purpose: "Powerful antioxidant, breast cancer protective, anti-inflammatory" },
      { name: "Trace Minerals (Liquid)", dose: "1 serving", timing: "Evening", purpose: "85% NaCl + trace/rare earth minerals - cellular function restoration" },
      { name: "Probiotics / Kefir", dose: "50B CFU / 8oz kefir", timing: "Evening", purpose: "Microbiome restoration (tetracycline damage repair)" },
      { name: "Bentonite Clay", dose: "1 tsp in water", timing: "Between meals", purpose: "Heavy metal binding, mycotoxin absorption, gut cleansing" },
      { name: "Zeolite Clinoptilolite", dose: "Per label (liquid)", timing: "Bedtime", purpose: "Heavy metal chelation - critical for mercury detoxification" },
      { name: "B17 (Amygdalin)", dose: "500mg", timing: "Midday", purpose: "Selective cancer cell targeting (metabolized by beta-glucosidase in cancer cells)" },
      { name: "Turkey Tail Mushroom", dose: "1000mg", timing: "Midday", purpose: "PSK/PSP immune activation, anti-tumor, gut microbiome support" },
      { name: "Goldenseal", dose: "500mg", timing: "Midday", purpose: "Berberine source - antimicrobial, anti-inflammatory, blood sugar regulation" },
      { name: "C60 Oil", dose: "1 tsp", timing: "Evening", purpose: "Carbon-60 fullerene antioxidant - 172x more potent than vitamin C" },
      { name: "Flaxseed Oil", dose: "2 tbsp", timing: "Evening", purpose: "Omega-3/lignans for estrogen metabolism and anti-inflammatory support" },
      { name: "MitoStac", dose: "Per label", timing: "Bedtime", purpose: "Replaces NMN, NR, TMG, PQQ, CoQ10, ALA, ALCAR. NAD+, SIRT1/3/6, ATP, AMPK activation." }
    ],
    ivTherapies: [
      { name: "IV Vitamin C (High Dose)", frequency: "2x/week", duration: "Weeks 1-12", purpose: "Pro-oxidant cancer cell destruction at high doses, immune support", notes: "50-100g per session. G6PD test required before first infusion." },
      { name: "IV DMSO", frequency: "1x/week", duration: "Weeks 1-8", purpose: "Chelation, anti-inflammatory, crosses blood-brain barrier for mercury detox" },
      { name: "IV Hydrogen Peroxide", frequency: "1x/week", duration: "Weeks 1-8", purpose: "Oxygenation therapy - anaerobic pathogen elimination, arterial plaque support" },
      { name: "Ozonated Glycerin IV", frequency: "1x/week", duration: "Weeks 5-12", purpose: "Ozone therapy for immune activation and pathogen elimination" }
    ],
    imTherapies: [
      { name: "NAD+ IM", dose: "250mg", frequency: "1x/week", purpose: "Mitochondrial restoration, DNA repair, cellular energy" },
      { name: "LipoB IM", dose: "1mL", frequency: "1x/week", purpose: "Fat metabolism, liver support, energy" }
    ],
    detoxProtocols: [
      {
        name: "FF Detox Bath Protocol",
        method: "Immersion bath",
        frequency: "3x/week minimum",
        duration: "30-45 minutes per session, ongoing",
        instructions: "Fill bathtub with warm water (not hot). Add: 1 cup baking soda + 1/2 cup bentonite clay + 2 cups Epsom salt + 10 drops lavender essential oil. Soak 30-45 minutes. Dry brush skin before entering. Hydrate with 32oz filtered water during and after. This protocol pulls heavy metals, mycotoxins, and metabolic waste through the skin."
      },
      {
        name: "Liver & Gallbladder Cleanse",
        method: "Oral protocol (multi-day)",
        frequency: "Once during Week 6-7",
        duration: "5-day preparation + 1-day flush",
        instructions: "Day 1-5: Apple juice (malic acid softens stones), light meals, no fat after 2pm on Day 5. Day 5 evening: Epsom salt drink (6pm, 8pm), olive oil + grapefruit juice mixture (10pm). Day 6: Epsom salt AM, light meals resume noon. Gallbladder still intact - this cleanse flushes bile sludge, gallstones, and liver congestion. CRITICAL for estrogen metabolism (estrogen is processed through liver)."
      },
      {
        name: "5-Day Fast (Autophagy Protocol)",
        method: "Water/broth fast",
        frequency: "Once during Weeks 9-10",
        duration: "5 consecutive days",
        instructions: "Physician-supervised 5-day water/bone broth fast to induce deep autophagy. This triggers cellular cleanup - damaged organelles, misfolded proteins, and pre-cancerous cells are recycled. Break fast gradually with bone broth, then soft vegetables, then normal DIANE diet. Do NOT fast if underweight or malnourished - ensure 8 weeks of nutritional foundation first."
      },
      {
        name: "Ozone Oil Pulling",
        method: "Oral swish",
        frequency: "Daily (AM before brushing)",
        duration: "20 minutes",
        instructions: "1 tbsp ozonated olive/coconut oil - swish and pull through teeth for 20 minutes. Spit into trash (not drain). Draws toxins from oral mucosa, addresses periodontal pathogens, supports amalgam detox."
      },
      {
        name: "Clay Detox (Internal)",
        method: "Oral",
        frequency: "Daily between meals",
        duration: "Ongoing",
        instructions: "1 tsp food-grade bentonite clay in 8oz water, taken 2 hours away from supplements/medications. Binds mycotoxins, heavy metals, and endotoxins in the GI tract."
      }
    ],
    parasiteAntiviralProtocols: [
      { name: "Fenbendazole", dose: "222mg", schedule: "3 days on, 4 days off", duration: "12 weeks", purpose: "Anti-parasitic and anti-cancer (disrupts microtubule formation in cancer cells, inhibits glucose uptake)" },
      { name: "Ivermectin", dose: "12mg (0.2mg/kg)", schedule: "2x/week", duration: "12 weeks", purpose: "Broad-spectrum anti-parasitic, anti-viral, anti-cancer properties (inhibits Akt/mTOR pathway)" },
      { name: "Nitazoxanide", dose: "500mg", schedule: "2x/day with food", duration: "Weeks 1-4", purpose: "Anti-protozoal, targets Cryptosporidium, Giardia, and other gut parasites" },
      { name: "Blushwood Berry Extract", dose: "Per label", schedule: "Daily at bedtime", duration: "12 weeks", purpose: "EBC-46 compound - triggers rapid tumor necrosis and immune activation against cancer cells" }
    ],
    lifestyleRecommendations: [
      { category: "Diet", recommendation: "DIANE Anti-Cancer Protocol", details: "Zero sugar, zero GMO, zero alcohol for 90 days minimum. Organic only. Alkaline-focused. Cruciferous vegetables daily for estrogen metabolism (DIM pathway). Landrace seeds when possible. Durum wheat only if any pasta consumed." },
      { category: "Diet", recommendation: "Alkaline Food Focus", details: "80% alkaline foods, 20% acid. Cancer thrives in acidic, anaerobic environments. Sea salt with 85+ trace minerals for cooking. Fresh vegetable juicing daily." },
      { category: "Hydration", recommendation: "Structured Water Protocol", details: "Minimum 80oz filtered/structured water daily. Add trace minerals to water. No tap water (fluoride, chlorine, pharmaceutical residues)." },
      { category: "Exercise", recommendation: "Gentle Movement", details: "Daily walking 30-60 minutes. Rebounding (mini trampoline) 10 min/day for lymphatic drainage. No intense exercise during detox phases." },
      { category: "Sleep", recommendation: "Sleep Optimization", details: "In bed by 9:30 PM, dark room, no screens 1 hour before bed. Melatonin support via Pinealon/Pineal PCC. Target 8-9 hours." },
      { category: "EMF", recommendation: "EMF Reduction", details: "Phone on airplane mode at night. No WiFi router in bedroom. Minimize cell phone use against body. Consider EMF-blocking clothing for breast area." },
      { category: "Mental Health", recommendation: "Trauma Processing", details: "Weekly counseling or EMDR for childhood trauma processing. Daily positive affirmations. Journaling. Faith/prayer practice. 'Must believe you can overcome this' - mental fortitude is critical to healing." },
      { category: "Dental", recommendation: "URGENT: Amalgam Removal", details: "Schedule biodentist appointment IMMEDIATELY for SMART protocol amalgam removal. One filling still present from teenage years = ~50 years of mercury exposure. Also evaluate for old cavitations (jawbone infections from previous dental work) and assess any root canals for pathogen colonization." },
      { category: "Dental", recommendation: "Cavitation Assessment", details: "After amalgam removal, request 3D cone beam CT scan to evaluate jawbone for cavitations (NICO lesions). Old extraction sites and root canal teeth can harbor anaerobic bacteria that seed distant infections including cancer sites." },
      { category: "Stem Cells", recommendation: "Stem Cell Therapy Consultation", details: "Contact holisticcare.com for stem cell concierge services. Mesenchymal stem cells for tissue regeneration, immune modulation, and anti-inflammatory support. Schedule consultation during Phase 2 (Weeks 5-8)." }
    ],
    dietaryGuidelines: [
      "ZERO sugar - cancer cells consume 18x more glucose than normal cells (Warburg effect)",
      "ZERO GMO foods - glyphosate residues damage gut microbiome and endocrine system",
      "ZERO alcohol for 90 days minimum - liver must focus on estrogen metabolism and detoxification",
      "Organic only - reduce pesticide/herbicide toxic burden",
      "Cruciferous vegetables DAILY (broccoli, cauliflower, Brussels sprouts, kale) - DIM (diindolylmethane) supports healthy estrogen metabolism",
      "Wild-caught fish 3x/week (salmon, sardines, mackerel) - omega-3 anti-inflammatory",
      "Grass-fed/pastured meats only - no conventional feedlot animal products",
      "Fermented foods daily (sauerkraut, kimchi, kefir) - microbiome restoration",
      "Fresh vegetable juice daily - concentrated phytonutrients and enzymes",
      "Anti-inflammatory spices: turmeric, ginger, garlic, oregano in every meal",
      "Seeds with meals: flax, chia, hemp - lignans for estrogen balance",
      "Moringa, Chlorella, Marine Phytoplankton - supergreen supplementation",
      "Bone broth daily - gut lining repair, collagen, minerals",
      "No processed foods, no seed oils (canola, soy, corn, sunflower), use olive oil, coconut oil, avocado oil only",
      "Nicotine patch 7mg - anti-inflammatory, neuroprotective (optional per Trustee evaluation)"
    ],
    followUpPlan: [
      { weekNumber: 2, action: "Phone check-in", details: "Assess supplement tolerance, injection technique comfort, diet compliance" },
      { weekNumber: 4, action: "Lab work + assessment", details: "CBC, CMP, hormone panel (estrogen, progesterone, testosterone, cortisol), copper/zinc ratio, iodine loading test, selenium levels, inflammatory markers (CRP, ESR, IL-6)" },
      { weekNumber: 4, action: "Amalgam removal status", details: "Confirm biodentist appointment scheduled or completed. Begin chelation if removal done." },
      { weekNumber: 6, action: "Liver & Gallbladder Cleanse", details: "Supervised cleanse protocol during this week" },
      { weekNumber: 8, action: "Comprehensive reassessment", details: "Repeat labs, imaging comparison, vitality assessment, adjust protocol based on response" },
      { weekNumber: 8, action: "RGCC results review", details: "Personalized cancer vaccine development based on circulating tumor cell analysis" },
      { weekNumber: 10, action: "5-Day Fast", details: "Supervised autophagy protocol - deep cellular cleanup" },
      { weekNumber: 12, action: "90-day protocol completion", details: "Full lab panel, imaging, vitality score comparison. Determine Phase 4 maintenance plan. Assess for stem cell therapy readiness." },
      { weekNumber: 16, action: "Quarterly follow-up", details: "Ongoing monitoring, supplement adjustments, continued dietary compliance verification" }
    ],
    contraindications: [
      "G6PD deficiency testing REQUIRED before high-dose IV Vitamin C",
      "Monitor potassium levels during Liver & Gallbladder Cleanse (Epsom salt is magnesium sulfate)",
      "5-Day Fast contraindicated if BMI < 18.5 or signs of malnutrition",
      "FOXO4-DRI may cause temporary fatigue/flu-like symptoms as senescent cells clear",
      "Amalgam removal MUST use SMART protocol (rubber dam, high-volume suction, separate air supply) to prevent mercury vapor inhalation",
      "Fenbendazole may cause transient liver enzyme elevation - monitor ALT/AST at week 4",
      "Do not take Bentonite Clay within 2 hours of medications or supplements (binds indiscriminately)",
      "Nebulization peroxide concentration must be food-grade 3% diluted per protocol - never use household peroxide"
    ],
    labsRequired: [
      "Complete Blood Count (CBC) with differential",
      "Comprehensive Metabolic Panel (CMP)",
      "Hormone Panel: Estradiol, Progesterone, Total/Free Testosterone, DHEA-S, Cortisol (AM)",
      "Thyroid Panel: TSH, Free T3, Free T4, Reverse T3, Thyroid antibodies (TPO, TG)",
      "Copper/Zinc Ratio (serum copper, serum zinc, ceruloplasmin)",
      "Iodine Loading Test (24-hour urine)",
      "Selenium (serum)",
      "Vitamin D (25-OH)",
      "Heavy Metals Panel (mercury, lead, arsenic, cadmium - blood + urine)",
      "Glyphosate Urine Test",
      "Mycotoxin Panel (urine)",
      "Inflammatory Markers: CRP (hs-CRP), ESR, IL-6, TNF-alpha",
      "G6PD (glucose-6-phosphate dehydrogenase) - BEFORE IV Vitamin C",
      "RGCC Test (Circulating Tumor Cell analysis + chemo-sensitivity + natural substance sensitivity)",
      "Comprehensive Stool Analysis (GI-MAP or equivalent) - microbiome, parasites, fungi",
      "Organic Acids Test (OAT) - mitochondrial function, neurotransmitters, yeast/fungal markers"
    ]
  };
}
