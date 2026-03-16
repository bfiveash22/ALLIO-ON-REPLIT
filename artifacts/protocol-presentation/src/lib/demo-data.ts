export function buildKathrynSmithDemoData() {
  return {
    profile: {
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
        "Severe copper deficiency",
        "Mercury toxicity (amalgam filling present)"
      ],
      currentMedications: [],
      allergies: ["Hay fever / seasonal allergies"],
      surgicalHistory: [
        "Heart murmur surgery at 14 months (successful)",
        "Lumpectomy right breast (~2018)"
      ],
      goals: [
        "Eliminate breast cancer without chemotherapy or radiation",
        "Address root causes: mold burden, mineral deficiencies, trauma",
        "Remove mercury amalgam filling safely",
        "Restore hormonal balance (address estrogen dominance)",
        "Strengthen immune system and activate p53/p21 tumor suppressors",
        "Achieve cellular-level healing through FF PMA 5R Framework"
      ],
      medicalTimeline: [
        { ageRange: "Birth", year: "~1961", event: "Natural birth in San Diego, CA (not breastfed)", significance: "Reduced initial immune transfer" },
        { ageRange: "14 months", year: "~1962", event: "Heart surgery - hole closure", significance: "Early surgical intervention" },
        { ageRange: "Ages 6-13", year: "1967-1974", event: "Chronic mold exposure from bedroom roof leak", significance: "CRITICAL: Mycotoxin burden, respiratory damage" },
        { ageRange: "Ages 6-10", year: "1967-1971", event: "Sexual abuse by uncle", significance: "CRITICAL: Cortisol imbalance → early puberty → estrogen dominance" },
        { ageRange: "Age 10", year: "~1971", event: "Early puberty onset", significance: "Trauma-cortisol-estrogen cascade begins" },
        { ageRange: "Teenage", year: "~1975", event: "Amalgam filling placed", significance: "Mercury exposure begins - still present" },
        { ageRange: "Age 32", year: "~1993", event: "First disclosure of childhood abuse", significance: "22 years undisclosed trauma" },
        { ageRange: "~Age 57", year: "~2018", event: "First breast cancer - lumpectomy only", significance: "Root causes NOT addressed" },
        { ageRange: "Age 65", year: "Feb 2026", event: "Second breast cancer ER+/PR+/HER2+", significance: "Recurrence + lymph node involvement" }
      ],
      practitionerNotes: "After meeting with Kathryn and understanding her story, her life, and her responsibilities as a mother and grandmother, I feel strongly that this is something we can address. Kathryn's case exemplifies the lifetime accumulation of health insults - from childhood mold exposure that damaged her respiratory system, to the devastating trauma that triggered early puberty and lifelong estrogen dominance, to the critical mineral depletion that has disabled her body's natural cancer defenses. The mercury amalgam still in her mouth has been slowly poisoning her immune system for 50 years. Her first cancer was treated with surgery alone - the root causes were never touched. That's why it came back. We will not make that mistake. We will address every single root cause - the mold burden, the trauma, the minerals, the mercury, the pathogens - and give her body what it needs to heal itself. Kathryn is determined, her family supports her completely, and she was guided to us just 2 days after her diagnosis. That tells me everything I need to know about how this story ends."
    },
    protocol: {
      patientName: "Kathryn Smith",
      patientAge: 65,
      generatedDate: "2026-03-16",
      protocolDurationDays: 90,
      summary: "Comprehensive 90-day healing protocol addressing recurrent ER+/PR+/HER2+ breast cancer through the FF PMA 5R Framework.",
      rootCauseAnalysis: [
        { rank: 1, cause: "Childhood Mold/Mycotoxin Exposure (Ages 6-13)", category: "Environmental Toxicity", details: "Chronic mold from leaking bedroom roof. Mycotoxin burden, pleomorphic bacterial shift, respiratory damage.", relatedSymptoms: ["Chronic cough", "Mucus", "Allergies", "Eczema"] },
        { rank: 2, cause: "Sexual Abuse Trauma → Estrogen Dominance", category: "Trauma/Hormonal", details: "Extreme childhood trauma → cortisol elevation → early puberty at 10 → lifelong estrogen dominance → ER+/PR+ cancer.", relatedSymptoms: ["Early puberty", "ER+/PR+ cancer", "Nervous bladder"] },
        { rank: 3, cause: "Critical Mineral Deficiencies", category: "Nutritional", details: "Copper → p53/p21 dysfunction. Iodine → breast tissue vulnerability. Selenium → antioxidant failure.", relatedSymptoms: ["Gray hair", "Cancer recurrence", "Immune dysfunction"] },
        { rank: 4, cause: "Mercury Toxicity (Amalgam Still Present)", category: "Heavy Metal", details: "50 years continuous mercury vapor from teenage amalgam filling.", relatedSymptoms: ["Immune suppression", "Endocrine disruption"] },
        { rank: 5, cause: "Viral & Parasite Load", category: "Pathogenic", details: "Suppresses p53/p21 cancer suppressors. Cell pathogen colonies present.", relatedSymptoms: ["Cancer recurrence", "Chronic inflammation"] },
        { rank: 6, cause: "Gut/Mitochondrial Dysfunction", category: "Cellular", details: "Tetracycline damage + decades of standard diet → gut integrity loss, mitochondrial dysfunction.", relatedSymptoms: ["Inflammation", "Energy dysfunction"] }
      ],
      phases: [
        { phaseNumber: 1, name: "Foundation & Detoxification", weekRange: "Weeks 1-4", focus: "Supplement foundation, detox, amalgam removal coordination, pathogen elimination", keyActions: ["Full supplement protocol", "Parasite protocols begin", "Detox baths 3x/week", "Biodentist scheduling", "Injectable peptides start", "HBOT 3x/weekly"] },
        { phaseNumber: 2, name: "Targeted Therapy & Hormonal Rebalancing", weekRange: "Weeks 5-8", focus: "Hormone rebalancing, cancer peptides, ECS optimization, stem cell consultation", keyActions: ["Post-amalgam chelation", "FOXO4-DRI senolytic clearing", "ECS suppository rotation", "Stem cell consultation", "RGCC testing", "Liver & Gallbladder Cleanse"] },
        { phaseNumber: 3, name: "Regeneration & Immune Recalibration", weekRange: "Weeks 9-12", focus: "Oral peptides, cellular regeneration, immune rebuild", keyActions: ["Transition to oral peptides", "5-Day Fast autophagy", "MitoStac intensification", "Labs and imaging reassessment"] },
        { phaseNumber: 4, name: "Maintenance & Monitoring", weekRange: "Ongoing", focus: "Sustain gains, long-term maintenance", keyActions: ["Quarterly labs", "Core supplement maintenance", "Monthly HBOT", "Annual RGCC"] }
      ],
      dailySchedule: {
        morning: [
          { time: "6:00 AM", item: "Warm Lemon Water + Nascent Iodine (3 drops)", details: "Empty stomach, wait 20 min", frequency: "Daily" },
          { time: "6:30 AM", item: "Morning Supplements", details: "Multivitamin, Liposomal C 2000mg, D3-K2 10,000IU, Selenium 200mcg, Copper 2mg, Astaxanthin, Thiamine", frequency: "Daily" },
          { time: "6:45 AM", item: "PCC Bioregulators (AM)", details: "Thymus + Mammary + Liver + Ovary PCC", frequency: "Daily" },
          { time: "7:00 AM", item: "Injectable Peptides (AM)", details: "LL-37 + PNC-27", frequency: "Daily" },
          { time: "7:30 AM", item: "Breakfast", details: "DIANE: Anti-inflammatory, alkaline. Organic eggs, turmeric, greens, avocado.", frequency: "Daily" },
          { time: "8:00 AM", item: "Reds + Greens + Elixir", details: "Mix in 12oz filtered water", frequency: "Daily" },
          { time: "8:30 AM", item: "Nebulization", details: "Saline + peroxide + iodine, 15 min", frequency: "M/W/F" }
        ],
        midday: [
          { time: "12:00 PM", item: "Lunch", details: "DIANE: Salad with wild fish/organic poultry. Cruciferous vegetables.", frequency: "Daily" },
          { time: "12:30 PM", item: "Midday Supplements", details: "Curcumin+, Turkey Tail, Goldenseal, B17, Mighty Blue", frequency: "Daily" },
          { time: "1:00 PM", item: "Parasite/Antiviral Protocol", details: "Fenbendazole + Ivermectin + Nitazoxanide per schedule", frequency: "Per schedule" },
          { time: "2:00 PM", item: "HBOT Session", details: "2.0 ATA x 60 minutes", frequency: "M/W/F" }
        ],
        evening: [
          { time: "5:00 PM", item: "Injectable Peptides (PM)", details: "Thymogen M/W/F + Epithalon/Pinealon daily", frequency: "Per schedule" },
          { time: "5:30 PM", item: "Dinner", details: "DIANE: Organic protein, steamed vegetables, anti-inflammatory spices", frequency: "Daily" },
          { time: "6:00 PM", item: "Evening Supplements", details: "Trace Minerals, Flaxseed Oil, C60 Oil, Probiotics, Selenium", frequency: "Daily" },
          { time: "6:30 PM", item: "PCC Bioregulators (PM)", details: "Pineal PCC + Mammary PCC", frequency: "Daily" },
          { time: "7:00 PM", item: "Detox Bath", details: "FF Protocol: Baking soda + Clay + Epsom salt + lavender, 30-45 min", frequency: "3x/week" }
        ],
        bedtime: [
          { time: "8:30 PM", item: "Zeolite Clinoptilolite", details: "Heavy metal binding (mercury detox)", frequency: "Daily" },
          { time: "8:45 PM", item: "ECS Suppository", details: "CBD/CBG rotation", frequency: "Nightly" },
          { time: "9:00 PM", item: "MitoStac", details: "Mitochondrial activation complex", frequency: "Daily" },
          { time: "9:15 PM", item: "Mental/Trauma Work", details: "Affirmations, journaling, trauma processing", frequency: "Daily" },
          { time: "9:30 PM", item: "Blushwood Berry Extract", details: "Anti-tumor support", frequency: "Daily" }
        ]
      },
      injectablePeptides: [
        { name: "Thymogen", vialSize: "20mg", reconstitution: "2mL BAC water", dose: "20 units", frequency: "M/W/F", duration: "4 weeks", route: "SubQ", purpose: "Thymic immune reconstitution for cancer immune response" },
        { name: "LL-37", vialSize: "5mg", reconstitution: "1mL BAC water", dose: "4-8 units", frequency: "Daily", duration: "6 weeks", route: "SubQ", purpose: "Antimicrobial peptide - pathogen elimination" },
        { name: "PNC-27", vialSize: "10mg", reconstitution: "1mL BAC water", dose: "20 units", frequency: "Daily", duration: "6 weeks", route: "SubQ", purpose: "Cancer-targeting peptide - selective cancer cell destruction" },
        { name: "Epithalon + Pinealon", vialSize: "45mg", reconstitution: "2mL BAC water", dose: "10-20 units", frequency: "Daily", duration: "30 days", route: "SubQ", purpose: "Telomere protection and pineal restoration" },
        { name: "FOXO4-DRI", vialSize: "10mg", reconstitution: "2mL BAC water", dose: "5mg weekly", frequency: "Weekly", duration: "4 weeks (Phase 2)", route: "SubQ", purpose: "Senolytic - clears zombie cells from tumor microenvironment" },
        { name: "KGlow-25", vialSize: "25mg", reconstitution: "2mL BAC water", dose: "10-20 units", frequency: "M/W/F", duration: "90 days", route: "SubQ", purpose: "Tissue regeneration and collagen synthesis" },
        { name: "Gonadorelin", vialSize: "2mg", reconstitution: "1mL BAC water", dose: "20 units", frequency: "M/W/F", duration: "8 weeks", route: "SubQ", purpose: "Hormonal axis optimization for estrogen/progesterone rebalancing" }
      ],
      bioregulators: [
        { name: "Thymus PCC", targetOrgan: "Thymus", dose: "1 capsule", frequency: "Daily (AM)", duration: "90 days" },
        { name: "Mammary PCC", targetOrgan: "Mammary/Breast", dose: "1 capsule", frequency: "Twice daily (AM + PM)", duration: "90 days" },
        { name: "Liver PCC", targetOrgan: "Liver", dose: "1 capsule", frequency: "Daily (AM)", duration: "90 days" },
        { name: "Ovary PCC", targetOrgan: "Ovary", dose: "1 capsule", frequency: "Daily (AM)", duration: "90 days" },
        { name: "Pineal PCC", targetOrgan: "Pineal Gland", dose: "1 capsule", frequency: "Daily (PM)", duration: "90 days" }
      ],
      oralPeptides: [
        { name: "Thymogen Alpha-1", dose: "1 capsule", frequency: "Daily", duration: "Weeks 7-12", purpose: "Immune modulation continuation" },
        { name: "TB-Frag Max", dose: "1 capsule", frequency: "Daily", duration: "Weeks 7-12", purpose: "Tissue repair" },
        { name: "GutFeeling", dose: "1 capsule", frequency: "Twice daily", duration: "Weeks 7-12", purpose: "Gut barrier restoration" },
        { name: "Pineal Pep", dose: "1 capsule", frequency: "Daily bedtime", duration: "Weeks 7-12", purpose: "Pineal/melatonin support" },
        { name: "5-Amino-1MQ", dose: "1 capsule", frequency: "Daily", duration: "Weeks 7-12", purpose: "Metabolic optimization" },
        { name: "Dihexa", dose: "1 capsule", frequency: "Daily", duration: "Weeks 7-12", purpose: "Cognitive support" }
      ],
      supplements: [
        { name: "Nascent Iodine", dose: "3 drops", timing: "AM empty stomach", purpose: "Breast tissue protection" },
        { name: "Copper", dose: "2mg", timing: "Morning", purpose: "p53/p21 gene restoration" },
        { name: "Selenium", dose: "200mcg", timing: "AM+PM split", purpose: "Antioxidant defense" },
        { name: "Liposomal Vitamin C", dose: "2000mg", timing: "Morning", purpose: "Immune + antioxidant" },
        { name: "D3-K2", dose: "10,000IU", timing: "Morning", purpose: "Immune modulation" },
        { name: "Curcumin+", dose: "1000mg", timing: "Midday", purpose: "Anti-inflammatory" },
        { name: "Turkey Tail", dose: "1000mg", timing: "Midday", purpose: "Immune activation" },
        { name: "B17", dose: "500mg", timing: "Midday", purpose: "Cancer cell targeting" },
        { name: "MitoStac", dose: "Per label", timing: "Bedtime", purpose: "Mitochondrial activation" },
        { name: "Mighty Blue", dose: "Per label", timing: "Midday", purpose: "Mitochondrial support" },
        { name: "Zeolite", dose: "Per label", timing: "Bedtime", purpose: "Heavy metal chelation" },
        { name: "Trace Minerals", dose: "1 serving", timing: "Evening", purpose: "Cellular function" }
      ],
      detoxProtocols: [
        { name: "FF Detox Bath", method: "Immersion", frequency: "3x/week", duration: "30-45 min", instructions: "Baking soda + Bentonite Clay + Epsom salt + lavender. Pulls heavy metals and mycotoxins through skin." },
        { name: "Liver & Gallbladder Cleanse", method: "Oral protocol", frequency: "Once (Week 6-7)", duration: "5-day prep + 1-day flush", instructions: "Apple juice prep, olive oil + grapefruit juice flush. Critical for estrogen metabolism." },
        { name: "5-Day Fast", method: "Water/broth fast", frequency: "Once (Weeks 9-10)", duration: "5 days", instructions: "Physician-supervised autophagy protocol. Deep cellular cleanup." },
        { name: "Ozone Oil Pulling", method: "Oral swish", frequency: "Daily AM", duration: "20 minutes", instructions: "Ozonated oil through teeth. Addresses oral pathogens and supports amalgam detox." },
        { name: "Clay Detox (Internal)", method: "Oral", frequency: "Daily", duration: "Ongoing", instructions: "Bentonite clay binds mycotoxins and heavy metals in GI tract." }
      ],
      parasiteAntiviralProtocols: [
        { name: "Fenbendazole", dose: "222mg", schedule: "3 days on, 4 off", duration: "12 weeks", purpose: "Anti-parasitic + anti-cancer" },
        { name: "Ivermectin", dose: "12mg", schedule: "2x/week", duration: "12 weeks", purpose: "Broad-spectrum anti-parasitic" },
        { name: "Nitazoxanide", dose: "500mg", schedule: "2x/day", duration: "Weeks 1-4", purpose: "Anti-protozoal" },
        { name: "Blushwood Berry", dose: "Per label", schedule: "Daily bedtime", duration: "12 weeks", purpose: "Tumor necrosis compound" }
      ],
      ivTherapies: [
        { name: "FF Detox IV Protocol (Full Sequence)", frequency: "1x (Week 1)", duration: "Week 1 — single session", purpose: "Full-spectrum detox: EDTA chelation (heavy metals) → Myers' Cocktail w/ extra B-vitamins & trace minerals → Glutathione (master antioxidant) → Alpha Lipoic Acid (mitochondrial support) → DMSO (cellular transport & anti-inflammatory) → Lipo-B injection (methylation support)" },
        { name: "IV Vitamin C (High Dose)", frequency: "Mon/Wed", duration: "Weeks 2-12 (ongoing)", purpose: "Pro-oxidant cancer cell destruction at high doses" },
        { name: "Ozonated Glycerin IV", frequency: "Friday", duration: "Weeks 2-12 (ongoing)", purpose: "Immune activation and pathogen elimination" }
      ],
      imTherapies: [
        { name: "NAD+ IM", dose: "250mg", frequency: "1x/week", purpose: "Mitochondrial restoration" },
        { name: "LipoB IM", dose: "1mL", frequency: "1x/week", purpose: "Fat metabolism, liver support" }
      ],
      lifestyleRecommendations: [
        { category: "Diet", recommendation: "DIANE Anti-Cancer Protocol", details: "Zero sugar, zero GMO, zero alcohol. Organic. Cruciferous vegetables daily." },
        { category: "Dental", recommendation: "URGENT: Amalgam Removal", details: "Schedule biodentist for SMART protocol removal. 50 years of mercury exposure." },
        { category: "Dental", recommendation: "Cavitation Assessment", details: "3D cone beam CT scan for jawbone cavitations. Old extraction sites harbor anaerobic bacteria." },
        { category: "Stem Cells", recommendation: "Stem Cell Therapy Consultation", details: "Contact holisticcare.com. Mesenchymal stem cells for tissue regeneration and immune modulation." },
        { category: "Mental Health", recommendation: "Trauma Processing", details: "Weekly counseling or EMDR for childhood trauma. Daily affirmations and journaling." },
        { category: "EMF", recommendation: "EMF Reduction", details: "Phone airplane mode at night. No WiFi in bedroom." }
      ],
      dietaryGuidelines: [
        "ZERO sugar - cancer cells consume 18x more glucose (Warburg effect)",
        "ZERO GMO foods - glyphosate damages gut and endocrine system",
        "ZERO alcohol for 90 days - liver must focus on estrogen metabolism",
        "Organic only - reduce toxic burden",
        "Cruciferous vegetables DAILY - DIM for estrogen metabolism",
        "Wild-caught fish 3x/week - omega-3 anti-inflammatory",
        "Fermented foods daily - microbiome restoration",
        "Fresh vegetable juice daily",
        "Anti-inflammatory spices in every meal",
        "No processed foods, no seed oils",
        "Moringa, Chlorella, Marine Phytoplankton supplementation"
      ],
      followUpPlan: [
        { weekNumber: 2, action: "Phone check-in", details: "Assess tolerance and compliance" },
        { weekNumber: 4, action: "Lab work + assessment", details: "CBC, hormones, minerals, inflammatory markers" },
        { weekNumber: 6, action: "Liver & Gallbladder Cleanse", details: "Supervised cleanse protocol" },
        { weekNumber: 8, action: "Comprehensive reassessment", details: "Repeat labs, imaging, protocol adjustment" },
        { weekNumber: 10, action: "5-Day Fast", details: "Supervised autophagy protocol" },
        { weekNumber: 12, action: "90-day completion", details: "Full assessment, Phase 4 planning" }
      ],
      labsRequired: [
        "CBC with differential",
        "Comprehensive Metabolic Panel",
        "Hormone Panel (Estradiol, Progesterone, Testosterone, DHEA-S, Cortisol)",
        "Thyroid Panel (TSH, Free T3/T4, Reverse T3, antibodies)",
        "Copper/Zinc Ratio",
        "Iodine Loading Test",
        "Heavy Metals Panel",
        "Mycotoxin Panel",
        "Inflammatory Markers (hs-CRP, ESR, IL-6)",
        "G6PD (before IV Vitamin C)",
        "RGCC Test",
        "GI-MAP Stool Analysis"
      ]
    },
    citations: [
      { title: "Copper deficiency and p53 tumor suppressor function", authors: ["Johnson M", "Smith K"], journal: "Journal of Trace Elements", year: "2023", url: "https://pubmed.ncbi.nlm.nih.gov/" },
      { title: "Mycotoxin exposure and breast cancer risk: a systematic review", authors: ["Garcia R", "Patel A"], journal: "Environmental Health Perspectives", year: "2024", url: "https://pubmed.ncbi.nlm.nih.gov/" },
      { title: "Early life trauma and estrogen receptor positive breast cancer", authors: ["Williams D", "Chen L"], journal: "Psychoneuroendocrinology", year: "2022", url: "https://pubmed.ncbi.nlm.nih.gov/" },
      { title: "Mercury amalgam fillings and immune system dysfunction", authors: ["Anderson P", "Lee S"], journal: "Toxicology Letters", year: "2023", url: "https://pubmed.ncbi.nlm.nih.gov/" },
      { title: "Fenbendazole as a potential anti-cancer agent", authors: ["Son G", "Kim J"], journal: "Scientific Reports", year: "2024", url: "https://pubmed.ncbi.nlm.nih.gov/" }
    ],
    trusteeNotes: "After meeting with Kathryn and understanding her story, her life, and her responsibilities as a mother and grandmother of 14, I feel strongly that this is something we can address. Kathryn's case exemplifies the lifetime accumulation of health insults - childhood mold exposure that damaged her respiratory system, devastating trauma that triggered early puberty and lifelong estrogen dominance, critical mineral depletion that disabled her body's natural cancer defenses, and mercury poisoning from an amalgam filling placed 50 years ago. Her first cancer was treated with surgery alone - the root causes were never touched. That's why it came back. We will not make that mistake. We will address every single root cause and give her body what it needs to heal itself. Kathryn is determined, her family supports her completely, and she was guided to us just 2 days after her diagnosis."
  };
}
