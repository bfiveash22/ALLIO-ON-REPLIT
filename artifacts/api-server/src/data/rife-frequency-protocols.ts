export interface RifeProtocol {
  id: string;
  conditionName: string;
  category: "infectious" | "chronic" | "detox_cellular_repair";
  categoryLabel: string;
  frequencyRange: string;
  primaryFrequencies: number[];
  mechanism: string;
  treatmentDuration: string;
  sessionsPerWeek: number;
  equipment: string[];
  safetyProtocols: string[];
  contraindications: string[];
  notes: string;
  researchBasis: string;
  tags: string[];
}

export const RIFE_FREQUENCY_PROTOCOLS: RifeProtocol[] = [
  {
    id: "rife-lyme-disease",
    conditionName: "Lyme Disease (Borrelia burgdorferi)",
    category: "infectious",
    categoryLabel: "Infectious Diseases",
    frequencyRange: "432–864 Hz",
    primaryFrequencies: [432, 484, 610, 625, 690, 727, 787, 864],
    mechanism: "Targets the spirochete Borrelia burgdorferi through mortal oscillatory resonance (MOR). The frequencies disrupt the cell membrane integrity of the spirochete, causing structural lysis. Multiple frequencies address different life stages including cyst and biofilm forms.",
    treatmentDuration: "3-minute sweep per frequency, total session 30–45 minutes",
    sessionsPerWeek: 3,
    equipment: ["Rife frequency generator", "Plasma tube or contact pads", "Timer"],
    safetyProtocols: [
      "Start with lower frequencies and shorter sessions to manage Herxheimer reactions",
      "Ensure adequate hydration before and after sessions",
      "Monitor for detox symptoms including fatigue, headache, and joint pain",
      "Allow 48 hours between sessions for detox clearance"
    ],
    contraindications: [
      "Pregnancy",
      "Active cardiac pacemaker or implanted electronic devices",
      "Epilepsy or seizure disorders",
      "Do not use near the head for patients with metal implants"
    ],
    notes: "Lyme protocols often require extended treatment over 3-6 months due to the spirochete's ability to form cysts and biofilms. Combining with herbal antimicrobials (e.g., cat's claw, Japanese knotweed) may enhance results.",
    researchBasis: "Based on Dr. Royal Rife's original research on bacterial resonance frequencies and modern Rife practitioner protocols. The 727 Hz and 787 Hz frequencies are among the most validated in Rife therapy literature.",
    tags: ["lyme", "borrelia", "spirochete", "infectious", "tick-borne"]
  },
  {
    id: "rife-candida-albicans",
    conditionName: "Candida Albicans (Systemic Yeast)",
    category: "infectious",
    categoryLabel: "Infectious Diseases",
    frequencyRange: "414–886 Hz",
    primaryFrequencies: [414, 464, 465, 677, 688, 880, 886],
    mechanism: "Disrupts the cell wall structure of Candida albicans yeast through resonant frequency vibration. The frequencies target the chitin and beta-glucan layers of the fungal cell wall, leading to osmotic stress and cellular death.",
    treatmentDuration: "3-minute exposure per frequency, total session 25–35 minutes",
    sessionsPerWeek: 4,
    equipment: ["Rife frequency generator", "Contact pads (hands/feet)", "Optional: plasma tube for full-body exposure"],
    safetyProtocols: [
      "Strict anti-candida dietary protocol during treatment (no sugar, refined carbs, alcohol)",
      "Probiotics should be taken 2 hours after session",
      "Start with 2 sessions per week and increase gradually",
      "Monitor for die-off reactions (brain fog, fatigue, skin rashes)"
    ],
    contraindications: [
      "Pregnancy",
      "Active cardiac pacemaker",
      "Severe liver impairment (reduced detox capacity)",
      "Immunosuppressive medication without medical supervision"
    ],
    notes: "Candida protocols work best in conjunction with dietary changes and antifungal supplementation. Biofilm-disrupting enzymes (serrapeptase, nattokinase) may improve frequency penetration.",
    researchBasis: "Frequencies derived from Rife frequency databases and validated by practitioner clinical observations. The 880 Hz frequency is a classic Rife pathogen disruption frequency.",
    tags: ["candida", "yeast", "fungal", "infectious", "gut-health"]
  },
  {
    id: "rife-parasites-general",
    conditionName: "Parasitic Infections (General)",
    category: "infectious",
    categoryLabel: "Infectious Diseases",
    frequencyRange: "20–10000 Hz",
    primaryFrequencies: [20, 60, 72, 95, 120, 125, 440, 444, 727, 787, 880, 5000, 10000],
    mechanism: "Broad-spectrum frequency sweep targeting common parasites including roundworms, flatworms, and protozoa. Lower frequencies target larger organisms while higher frequencies address microscopic parasites. The frequencies create a hostile vibrational environment that disrupts parasite metabolism and reproduction.",
    treatmentDuration: "2-minute sweep per frequency, total session 30–40 minutes",
    sessionsPerWeek: 3,
    equipment: ["Rife frequency generator with sweep capability", "Contact pads or plasma tube", "Timer with programmable sequences"],
    safetyProtocols: [
      "Always treat during waning moon phases when parasites are most active in the intestinal tract",
      "Ensure bowel motility is active before starting treatment",
      "Take binders (activated charcoal, bentonite clay) 1 hour after sessions",
      "Hydrate extensively with mineralized water"
    ],
    contraindications: [
      "Pregnancy",
      "Pacemaker or electronic implants",
      "Children under 5 without practitioner supervision",
      "Active gastrointestinal bleeding"
    ],
    notes: "Parasite protocols should follow a specific schedule: 2 weeks on, 1 week off, repeated for 3 cycles to address different life stages (egg, larva, adult). Full moon protocols may be added for enhanced effectiveness.",
    researchBasis: "Compiled from multiple Rife practitioner databases and the work of Dr. Hulda Clark on parasite frequency resonance.",
    tags: ["parasites", "worms", "protozoa", "infectious", "gut-health"]
  },
  {
    id: "rife-epstein-barr",
    conditionName: "Epstein-Barr Virus (EBV/Mono)",
    category: "infectious",
    categoryLabel: "Infectious Diseases",
    frequencyRange: "660–880 Hz",
    primaryFrequencies: [660, 663, 669, 727, 738, 787, 880],
    mechanism: "Targets the protein capsid of the Epstein-Barr herpes virus through vibrational resonance. The frequencies work to denature the viral envelope proteins, preventing cell attachment and replication. Also supports immune modulation to enhance the body's antiviral response.",
    treatmentDuration: "3-minute exposure per frequency, total session 25–30 minutes",
    sessionsPerWeek: 3,
    equipment: ["Rife frequency generator", "Plasma tube (preferred for viral protocols)", "Contact pads as alternative"],
    safetyProtocols: [
      "Monitor for Herxheimer-like reactions including fatigue and swollen lymph nodes",
      "Support liver detoxification with milk thistle or NAC",
      "Reduce session frequency if fatigue worsens",
      "Maintain adequate vitamin D and zinc levels during treatment"
    ],
    contraindications: [
      "Pregnancy",
      "Pacemaker or electronic implants",
      "Active organ transplant immunosuppression",
      "Severe chronic fatigue (start with lower intensity)"
    ],
    notes: "EBV often reactivates during stress or immune compromise. Rife protocols for EBV work best as part of a comprehensive immune support program including adaptogens, antivirals (lysine, monolaurin), and stress management.",
    researchBasis: "Frequencies based on Rife viral frequency databases and clinical practitioner experience with herpes-family viruses.",
    tags: ["ebv", "epstein-barr", "herpes", "viral", "chronic-fatigue"]
  },
  {
    id: "rife-streptococcus",
    conditionName: "Streptococcus Infections",
    category: "infectious",
    categoryLabel: "Infectious Diseases",
    frequencyRange: "556–880 Hz",
    primaryFrequencies: [556, 616, 660, 690, 727, 776, 787, 802, 880],
    mechanism: "Targets streptococcal bacteria through resonant disruption of the cell membrane. The frequencies induce mechanical stress on the bacterial cell wall, leading to lysis. Multiple frequencies address different streptococcal strains (Group A, B, etc.).",
    treatmentDuration: "3-minute sweep per frequency, total session 30 minutes",
    sessionsPerWeek: 4,
    equipment: ["Rife frequency generator", "Contact pads", "Optional plasma tube"],
    safetyProtocols: [
      "Seek conventional medical evaluation for acute strep infections",
      "Use Rife as complementary therapy alongside medical treatment",
      "Monitor temperature and symptoms closely",
      "Adequate hydration and rest during treatment"
    ],
    contraindications: [
      "Pregnancy",
      "Pacemaker or electronic implants",
      "Acute rheumatic fever (requires immediate medical care)",
      "Children under 3 without medical supervision"
    ],
    notes: "Rife therapy for strep should be used as a complementary approach. Acute strep throat and invasive strep infections require conventional medical treatment. Rife may help with chronic or recurrent strep colonization.",
    researchBasis: "Based on classic Rife frequency databases for bacterial pathogens. The 727 Hz and 787 Hz frequencies are foundational Rife pathogen frequencies.",
    tags: ["streptococcus", "bacterial", "strep", "infectious"]
  },
  {
    id: "rife-staphylococcus",
    conditionName: "Staphylococcus (including MRSA)",
    category: "infectious",
    categoryLabel: "Infectious Diseases",
    frequencyRange: "453–886 Hz",
    primaryFrequencies: [453, 478, 550, 616, 623, 727, 786, 787, 880, 886],
    mechanism: "Targets staphylococcal bacteria including methicillin-resistant strains (MRSA). Frequencies disrupt the bacterial cell wall and biofilm matrix, improving susceptibility to the immune system and complementary antimicrobial therapies.",
    treatmentDuration: "3-minute sweep per frequency, total session 35 minutes",
    sessionsPerWeek: 4,
    equipment: ["Rife frequency generator", "Contact pads placed near infection site", "Plasma tube for systemic infections"],
    safetyProtocols: [
      "MRSA requires concurrent medical treatment - Rife is adjunctive only",
      "Clean contact pads thoroughly between uses to prevent cross-contamination",
      "Monitor wound sites for signs of worsening infection",
      "Report any spreading redness or fever to medical provider immediately"
    ],
    contraindications: [
      "Pregnancy",
      "Pacemaker or electronic implants",
      "Active sepsis (requires emergency medical care)",
      "Do not use as sole treatment for serious staph infections"
    ],
    notes: "Staphylococcus, particularly MRSA, forms resilient biofilms. Biofilm-disrupting enzymes and silver-based topicals may enhance Rife effectiveness. Always use under medical supervision for serious infections.",
    researchBasis: "Frequencies compiled from Rife practitioner databases. The combination approach addresses both planktonic and biofilm-embedded bacteria.",
    tags: ["staphylococcus", "mrsa", "bacterial", "biofilm", "infectious"]
  },
  {
    id: "rife-fibromyalgia",
    conditionName: "Fibromyalgia",
    category: "chronic",
    categoryLabel: "Chronic Conditions",
    frequencyRange: "2–880 Hz",
    primaryFrequencies: [2, 10, 15, 20, 28, 40, 120, 125, 304, 464, 660, 690, 727, 787, 880],
    mechanism: "Multi-frequency approach addressing the complex pathophysiology of fibromyalgia. Low frequencies (2-40 Hz) target pain modulation through endorphin release and nervous system regulation. Mid-range frequencies address inflammation and cellular repair. Higher frequencies target potential infectious co-factors often found in fibromyalgia patients.",
    treatmentDuration: "3-minute exposure per frequency, total session 45–60 minutes",
    sessionsPerWeek: 3,
    equipment: ["Rife frequency generator with wide range capability", "Contact pads (full-body preferred)", "Comfortable treatment position (lying down)"],
    safetyProtocols: [
      "Start with low-frequency protocols only for first 2 weeks",
      "Gradually introduce higher frequencies as tolerance builds",
      "Expect initial symptom flare (healing crisis) in first 1-2 weeks",
      "Combine with gentle movement and stretching post-session"
    ],
    contraindications: [
      "Pregnancy",
      "Pacemaker or electronic implants",
      "Severe anxiety or panic disorder (some frequencies may trigger)",
      "Uncontrolled hypertension"
    ],
    notes: "Fibromyalgia responds best to a comprehensive protocol including Rife therapy, anti-inflammatory diet, gentle exercise, sleep optimization, and stress reduction. Many fibromyalgia patients have underlying infections (EBV, Lyme) that should be addressed.",
    researchBasis: "Protocol combines pain management frequencies with pathogen-targeting frequencies based on research linking fibromyalgia to chronic infections and nervous system dysregulation.",
    tags: ["fibromyalgia", "chronic-pain", "inflammation", "nervous-system", "chronic"]
  },
  {
    id: "rife-arthritis",
    conditionName: "Arthritis (Osteo & Rheumatoid)",
    category: "chronic",
    categoryLabel: "Chronic Conditions",
    frequencyRange: "1.2–10000 Hz",
    primaryFrequencies: [1.2, 10, 15, 20, 28, 120, 250, 304, 440, 600, 625, 650, 660, 690, 727, 787, 880, 10000],
    mechanism: "Dual approach: anti-inflammatory frequencies reduce joint inflammation and swelling while regenerative frequencies promote cartilage repair and synovial fluid production. For rheumatoid arthritis, additional pathogen frequencies address the autoimmune infectious triggers.",
    treatmentDuration: "3-minute sweep per frequency, total session 45 minutes",
    sessionsPerWeek: 4,
    equipment: ["Rife frequency generator", "Contact pads placed on or near affected joints", "PEMF mat for whole-body sessions"],
    safetyProtocols: [
      "Apply contact pads carefully around inflamed joints - avoid direct pressure",
      "Start with anti-inflammatory frequencies before adding pathogen frequencies",
      "Monitor joint temperature and swelling after sessions",
      "Maintain prescribed medications while using Rife therapy"
    ],
    contraindications: [
      "Pregnancy",
      "Pacemaker or electronic implants",
      "Joint replacement surgery within last 6 months",
      "Active joint infection (requires medical treatment)"
    ],
    notes: "Arthritis protocols benefit from concurrent supplementation with glucosamine, chondroitin, MSM, turmeric, and omega-3 fatty acids. Cold-laser therapy and PEMF complement Rife frequency therapy well.",
    researchBasis: "Frequencies based on anti-inflammatory Rife protocols and PEMF research on cartilage regeneration. Low-frequency PEMF has strong clinical evidence for osteoarthritis pain reduction.",
    tags: ["arthritis", "joint-pain", "inflammation", "autoimmune", "chronic"]
  },
  {
    id: "rife-chronic-fatigue",
    conditionName: "Chronic Fatigue Syndrome (ME/CFS)",
    category: "chronic",
    categoryLabel: "Chronic Conditions",
    frequencyRange: "10–10000 Hz",
    primaryFrequencies: [10, 20, 40, 120, 125, 304, 432, 528, 660, 690, 727, 787, 880, 5000, 10000],
    mechanism: "Addresses the multifactorial nature of CFS through mitochondrial support frequencies, nervous system regulation, and targeting common viral co-infections (EBV, HHV-6, CMV). Low frequencies support cellular energy production while mid-range frequencies modulate immune function.",
    treatmentDuration: "2-minute sweep per frequency, total session 35–45 minutes",
    sessionsPerWeek: 2,
    equipment: ["Rife frequency generator", "Contact pads", "Plasma tube for viral protocols"],
    safetyProtocols: [
      "CFS patients are highly sensitive - start with minimal frequency count and short durations",
      "Never exceed 2 sessions per week initially",
      "Post-exertional malaise may worsen initially - reduce intensity if needed",
      "Ensure complete rest for 24 hours after sessions"
    ],
    contraindications: [
      "Pregnancy",
      "Pacemaker or electronic implants",
      "Severe orthostatic intolerance (treatment position must accommodate)",
      "Active seizure disorder"
    ],
    notes: "CFS patients require the gentlest approach. Start with supportive frequencies (432, 528 Hz) before introducing pathogen frequencies. Mitochondrial support (CoQ10, D-ribose, PQQ, NAD+) is essential alongside Rife therapy.",
    researchBasis: "Protocol based on the viral reactivation model of CFS and clinical observations linking EBV/HHV-6 to chronic fatigue pathology.",
    tags: ["chronic-fatigue", "cfs", "me-cfs", "viral", "mitochondrial", "chronic"]
  },
  {
    id: "rife-hypertension",
    conditionName: "Hypertension (High Blood Pressure)",
    category: "chronic",
    categoryLabel: "Chronic Conditions",
    frequencyRange: "7.83–304 Hz",
    primaryFrequencies: [7.83, 10, 15, 20, 40, 73, 95, 125, 304],
    mechanism: "Low-frequency protocols promote vascular relaxation and parasympathetic nervous system activation. The Schumann resonance (7.83 Hz) helps restore natural biorhythms. Alpha-range frequencies (10 Hz) promote relaxation and reduce sympathetic overdrive contributing to elevated blood pressure.",
    treatmentDuration: "5-minute exposure per frequency, total session 40–50 minutes",
    sessionsPerWeek: 5,
    equipment: ["Rife frequency generator", "Contact pads (wrist/ankle placement)", "Comfortable reclining position"],
    safetyProtocols: [
      "Do not discontinue blood pressure medications without medical supervision",
      "Monitor blood pressure before and after each session",
      "Report any significant blood pressure changes to healthcare provider",
      "Avoid sessions during hypertensive crisis (BP > 180/120)"
    ],
    contraindications: [
      "Pregnancy (risk of blood pressure fluctuation)",
      "Pacemaker or electronic implants",
      "History of stroke within last 3 months",
      "Aortic aneurysm"
    ],
    notes: "Rife frequency therapy for hypertension should complement lifestyle modifications including dietary changes (DASH diet), exercise, stress management, and medication as prescribed. Regular blood pressure monitoring is essential.",
    researchBasis: "Based on PEMF research demonstrating vasodilation effects and parasympathetic activation. The Schumann resonance has been studied for its effects on cardiovascular regulation.",
    tags: ["hypertension", "blood-pressure", "cardiovascular", "chronic"]
  },
  {
    id: "rife-diabetes-support",
    conditionName: "Diabetes Support (Type 2)",
    category: "chronic",
    categoryLabel: "Chronic Conditions",
    frequencyRange: "20–10000 Hz",
    primaryFrequencies: [20, 35, 40, 48, 72, 95, 125, 304, 465, 528, 660, 690, 727, 787, 880, 10000],
    mechanism: "Addresses pancreatic function support, insulin sensitivity enhancement, and inflammation reduction. Lower frequencies support cellular metabolism and insulin receptor sensitivity. Mid-range frequencies address chronic inflammation associated with insulin resistance. Higher frequencies target potential infectious factors that can exacerbate blood sugar dysregulation.",
    treatmentDuration: "3-minute sweep per frequency, total session 45 minutes",
    sessionsPerWeek: 3,
    equipment: ["Rife frequency generator", "Contact pads (abdominal and extremity placement)", "Blood glucose monitor"],
    safetyProtocols: [
      "Monitor blood glucose before and after every session",
      "Have glucose source available in case of hypoglycemic episode",
      "Do not adjust diabetes medications without medical supervision",
      "Report consistent blood sugar changes to healthcare provider"
    ],
    contraindications: [
      "Pregnancy",
      "Pacemaker or insulin pump (electronic device interference)",
      "Diabetic ketoacidosis (requires emergency medical care)",
      "Active diabetic foot ulcer at contact pad site"
    ],
    notes: "Rife therapy for diabetes is strictly complementary to medical management. Blood sugar may fluctuate initially as cellular metabolism shifts. Chromium, berberine, and cinnamon supplementation may synergize with frequency therapy.",
    researchBasis: "Based on PEMF research on glucose metabolism and pancreatic beta-cell function. Frequencies selected from anti-inflammatory and metabolic support protocols.",
    tags: ["diabetes", "blood-sugar", "metabolic", "pancreatic", "chronic"]
  },
  {
    id: "rife-liver-detox",
    conditionName: "Liver Detoxification & Support",
    category: "detox_cellular_repair",
    categoryLabel: "Detox & Cellular Repair",
    frequencyRange: "1.5–10000 Hz",
    primaryFrequencies: [1.5, 2.5, 3.6, 10, 20, 26, 35, 40, 72, 95, 125, 304, 440, 528, 660, 690, 727, 787, 880, 10000],
    mechanism: "Supports hepatic detoxification pathways (Phase I and Phase II) through resonant stimulation of liver tissue. Low frequencies enhance bile flow and hepatocyte function. Mid-range frequencies address liver inflammation and fibrosis. Higher frequencies target hepatotoxic pathogens (hepatitis viruses, liver flukes).",
    treatmentDuration: "2-minute sweep per frequency, total session 40–50 minutes",
    sessionsPerWeek: 3,
    equipment: ["Rife frequency generator", "Contact pads (placed over liver region - right upper abdomen)", "Plasma tube for systemic detox"],
    safetyProtocols: [
      "Ensure bowel motility before liver detox protocols - liver dumps toxins into bile",
      "Support with milk thistle, NAC, and glutathione during treatment",
      "Start with shorter sessions and fewer frequencies",
      "Drink 8-12 glasses of water daily during treatment period"
    ],
    contraindications: [
      "Pregnancy",
      "Pacemaker or electronic implants",
      "Acute hepatitis or liver failure",
      "Active gallstone obstruction",
      "Taking blood thinners (warfarin) - frequency may alter metabolism"
    ],
    notes: "Liver detox protocols should follow a preparatory phase: 1 week of dietary cleanup and binder support before starting Rife therapy. Coffee enemas may complement the detoxification process. Always ensure the elimination pathways (bowels, kidneys, skin) are open before liver detox.",
    researchBasis: "Frequencies based on organ-specific resonance databases and hepatic PEMF research showing improved liver enzyme profiles and reduced hepatic inflammation.",
    tags: ["liver", "detox", "hepatic", "cleansing", "cellular-repair"]
  },
  {
    id: "rife-kidney-support",
    conditionName: "Kidney Support & Detoxification",
    category: "detox_cellular_repair",
    categoryLabel: "Detox & Cellular Repair",
    frequencyRange: "10–880 Hz",
    primaryFrequencies: [10, 20, 40, 72, 95, 125, 248, 304, 440, 528, 660, 690, 727, 787, 880],
    mechanism: "Supports renal filtration and detoxification. Low frequencies enhance kidney blood flow and glomerular filtration. Mid-range frequencies address renal inflammation and support nephron function. Pathogen frequencies target urinary tract infections that may compromise kidney function.",
    treatmentDuration: "3-minute sweep per frequency, total session 45 minutes",
    sessionsPerWeek: 3,
    equipment: ["Rife frequency generator", "Contact pads (placed over kidney region - lower back)", "Adequate water supply"],
    safetyProtocols: [
      "Maintain high fluid intake (minimum 3 liters daily) during kidney protocols",
      "Monitor urine output and color - should remain light yellow",
      "Avoid kidney protocols if creatinine levels are significantly elevated",
      "Electrolyte monitoring recommended during extended treatment"
    ],
    contraindications: [
      "Pregnancy",
      "Pacemaker or electronic implants",
      "End-stage renal disease or dialysis",
      "Active kidney stones larger than 5mm (risk of obstruction)",
      "Kidney transplant recipients"
    ],
    notes: "Kidney support protocols work best with adequate hydration and mineral supplementation. Marshmallow root tea, corn silk tea, and parsley support renal function. Always address kidney function before intensive detox protocols.",
    researchBasis: "Based on renal-supportive frequency databases and PEMF research on renal blood flow enhancement.",
    tags: ["kidney", "renal", "detox", "urinary", "cellular-repair"]
  },
  {
    id: "rife-lymphatic-drainage",
    conditionName: "Lymphatic Drainage & Support",
    category: "detox_cellular_repair",
    categoryLabel: "Detox & Cellular Repair",
    frequencyRange: "3–880 Hz",
    primaryFrequencies: [3, 6, 10, 15, 20, 40, 48, 72, 95, 120, 125, 304, 440, 528, 660, 727, 787, 880],
    mechanism: "Stimulates lymphatic flow and drainage through low-frequency mechanical vibration of lymphatic vessels. The frequencies promote rhythmic contraction of lymphatic smooth muscle, enhancing the movement of lymph fluid and immune surveillance. Higher frequencies address lymphatic congestion and potential infections within lymph nodes.",
    treatmentDuration: "2-minute sweep per frequency, total session 40 minutes",
    sessionsPerWeek: 3,
    equipment: ["Rife frequency generator", "Contact pads (placed along lymphatic pathways - neck, armpits, groin)", "PEMF mat for whole-body lymphatic stimulation"],
    safetyProtocols: [
      "Gentle dry brushing before sessions enhances lymphatic response",
      "Rebound exercise (mini-trampoline) after sessions supports drainage",
      "Stay well-hydrated to support lymphatic fluid volume",
      "Avoid heavy meals 2 hours before treatment"
    ],
    contraindications: [
      "Pregnancy",
      "Pacemaker or electronic implants",
      "Active lymphoma or lymphatic cancer",
      "Acute deep vein thrombosis (risk of clot dislodgement)",
      "Active cellulitis or lymphangitis"
    ],
    notes: "Lymphatic protocols are foundational to all detox programs. The lymphatic system should be addressed first before liver, kidney, or pathogen protocols. Manual lymphatic drainage massage complements Rife lymphatic protocols effectively.",
    researchBasis: "Based on research demonstrating mechanical vibration effects on lymphatic vessel contractility and flow enhancement.",
    tags: ["lymphatic", "drainage", "detox", "immune", "cellular-repair"]
  },
  {
    id: "rife-heavy-metal-detox",
    conditionName: "Heavy Metal Detoxification",
    category: "detox_cellular_repair",
    categoryLabel: "Detox & Cellular Repair",
    frequencyRange: "10–10000 Hz",
    primaryFrequencies: [10, 20, 35, 40, 72, 95, 125, 304, 432, 440, 528, 660, 690, 727, 787, 880, 5000, 10000],
    mechanism: "Supports the mobilization and elimination of heavy metals (mercury, lead, aluminum, cadmium, arsenic) from tissues. Low frequencies enhance cellular detoxification enzyme activity. Mid-range healing frequencies (432, 528 Hz) support cellular repair from metal-induced damage. Higher frequencies address secondary infections that thrive in heavy metal-burdened tissues.",
    treatmentDuration: "2-minute sweep per frequency, total session 40 minutes",
    sessionsPerWeek: 2,
    equipment: ["Rife frequency generator", "Full-body contact pads or PEMF mat", "Heavy metal binders on hand (chlorella, zeolite, modified citrus pectin)"],
    safetyProtocols: [
      "ALWAYS use binders (chlorella, zeolite, activated charcoal) 30 minutes after sessions",
      "Start with only 2 sessions per week - heavy metal mobilization can cause severe symptoms",
      "Mineral replacement essential - metals compete with essential minerals",
      "Monitor for redistribution symptoms: headache, metallic taste, brain fog, fatigue",
      "Sauna or Epsom salt baths after sessions support elimination through skin"
    ],
    contraindications: [
      "Pregnancy (mobilized metals can cross placenta)",
      "Pacemaker or electronic implants",
      "Active dental amalgam removal in progress (wait 2 weeks after removal)",
      "Severe kidney impairment (metals must be filtered by kidneys)",
      "Children under 12 without specialized practitioner guidance"
    ],
    notes: "Heavy metal detox is a gradual process requiring 3-12 months. The order of elimination matters: open drainage pathways (lymph, liver, kidneys) before mobilizing metals. Testing (hair mineral analysis, urine provocation test) helps guide protocol intensity.",
    researchBasis: "Based on chelation-supportive frequency protocols and research on PEMF effects on cellular detoxification pathways.",
    tags: ["heavy-metals", "mercury", "lead", "detox", "chelation", "cellular-repair"]
  },
  {
    id: "rife-cellular-regeneration",
    conditionName: "Cellular Regeneration & Anti-Aging",
    category: "detox_cellular_repair",
    categoryLabel: "Detox & Cellular Repair",
    frequencyRange: "7.83–963 Hz",
    primaryFrequencies: [7.83, 10, 40, 111, 174, 285, 396, 417, 432, 528, 639, 741, 852, 963],
    mechanism: "Combines Schumann resonance (Earth frequency) with the complete Solfeggio scale to promote cellular regeneration, DNA repair, and anti-aging at the cellular level. The 528 Hz frequency is particularly associated with DNA repair enzyme activation. The 432 Hz frequency promotes cellular coherence and natural resonance patterns.",
    treatmentDuration: "5-minute exposure per frequency, total session 60–75 minutes",
    sessionsPerWeek: 3,
    equipment: ["Rife frequency generator or Solfeggio tone generator", "Full-body PEMF mat", "Comfortable reclining position", "Optional: headphones for binaural delivery"],
    safetyProtocols: [
      "This is a gentle, restorative protocol suitable for most individuals",
      "Can be used daily for maintenance after initial protocol period",
      "Combine with meditation or breathwork for enhanced results",
      "Ensure adequate sleep (7-9 hours) to support cellular repair processes"
    ],
    contraindications: [
      "Pacemaker or electronic implants",
      "Active cancer treatment (consult oncologist before use)",
      "Severe mental health conditions without professional oversight"
    ],
    notes: "Cellular regeneration protocols are the foundation of anti-aging Rife therapy. Best combined with NAD+ precursors, resveratrol, fasting/autophagy protocols, and red light therapy. This protocol has the widest safety margin and is suitable for long-term maintenance.",
    researchBasis: "Based on Solfeggio frequency traditions, Schumann resonance research, and studies on PEMF effects on stem cell activation and telomere maintenance.",
    tags: ["regeneration", "anti-aging", "dna-repair", "solfeggio", "cellular-repair"]
  },
  {
    id: "rife-inflammation",
    conditionName: "Systemic Inflammation Reduction",
    category: "chronic",
    categoryLabel: "Chronic Conditions",
    frequencyRange: "1.2–880 Hz",
    primaryFrequencies: [1.2, 3, 7.83, 10, 15, 20, 28, 40, 72, 95, 120, 125, 250, 304, 432, 528, 660, 727, 787, 880],
    mechanism: "Multi-frequency anti-inflammatory protocol targeting NF-κB pathway modulation, prostaglandin regulation, and cytokine balance. Low frequencies (1.2-40 Hz) promote endorphin release and parasympathetic activation. Mid-range frequencies reduce tissue inflammation. Healing frequencies (432, 528 Hz) support tissue repair.",
    treatmentDuration: "2-minute sweep per frequency, total session 45 minutes",
    sessionsPerWeek: 4,
    equipment: ["Rife frequency generator", "Contact pads or PEMF mat", "Infrared sauna (complementary)"],
    safetyProtocols: [
      "Anti-inflammatory diet should accompany Rife therapy",
      "Omega-3 supplementation enhances anti-inflammatory effects",
      "Monitor inflammatory markers (CRP, ESR) before and during treatment",
      "Gradual reduction of anti-inflammatory medications under medical supervision only"
    ],
    contraindications: [
      "Pregnancy",
      "Pacemaker or electronic implants",
      "Active autoimmune flare (may temporarily worsen before improving)",
      "Post-surgical healing within first 2 weeks"
    ],
    notes: "Systemic inflammation is the root of most chronic diseases. This protocol should be considered foundational and can be combined with condition-specific protocols. Curcumin, SPMs (specialized pro-resolving mediators), and glutathione support the anti-inflammatory effect.",
    researchBasis: "Extensive PEMF research supports low-frequency electromagnetic field therapy for inflammation reduction. Multiple clinical trials show reduced inflammatory markers with PEMF therapy.",
    tags: ["inflammation", "anti-inflammatory", "chronic", "autoimmune", "cytokine"]
  },
  {
    id: "rife-mold-mycotoxins",
    conditionName: "Mold Exposure & Mycotoxin Illness",
    category: "infectious",
    categoryLabel: "Infectious Diseases",
    frequencyRange: "222–10000 Hz",
    primaryFrequencies: [222, 242, 254, 321, 331, 345, 414, 464, 465, 524, 565, 660, 677, 688, 727, 787, 880, 886, 10000],
    mechanism: "Targets common pathogenic molds (Aspergillus, Penicillium, Stachybotrys, Cladosporium) and supports mycotoxin elimination. The frequencies disrupt mold spore germination and hyphal growth while supporting the body's mycotoxin detoxification pathways.",
    treatmentDuration: "2-minute sweep per frequency, total session 40 minutes",
    sessionsPerWeek: 3,
    equipment: ["Rife frequency generator", "Plasma tube (preferred for mold protocols)", "Contact pads as alternative", "Air purifier in treatment room"],
    safetyProtocols: [
      "Must remove from mold-contaminated environment before starting treatment",
      "Binders (cholestyramine, activated charcoal, bentonite clay) essential during treatment",
      "Support glutathione production with NAC, liposomal glutathione, or IV glutathione",
      "Watch for severe Herxheimer reactions - mold die-off can be intense",
      "Nasal rinse with colloidal silver may complement sinus mold colonization treatment"
    ],
    contraindications: [
      "Pregnancy",
      "Pacemaker or electronic implants",
      "Severe MCS (Multiple Chemical Sensitivity) - start very slowly",
      "Active pulmonary aspergillosis (requires medical treatment)"
    ],
    notes: "Mold illness (CIRS - Chronic Inflammatory Response Syndrome) is complex and requires comprehensive treatment. Rife therapy addresses the mold/fungal component but environmental remediation, binder therapy, and immune support are equally critical.",
    researchBasis: "Frequencies compiled from antifungal Rife databases targeting specific mold species identified through environmental testing.",
    tags: ["mold", "mycotoxin", "fungal", "cirs", "infectious", "environmental"]
  },
  {
    id: "rife-gut-repair",
    conditionName: "Gut Repair & Microbiome Support",
    category: "detox_cellular_repair",
    categoryLabel: "Detox & Cellular Repair",
    frequencyRange: "7.83–880 Hz",
    primaryFrequencies: [7.83, 10, 20, 40, 72, 95, 125, 174, 285, 304, 432, 528, 660, 690, 727, 787, 880],
    mechanism: "Addresses intestinal permeability (leaky gut), inflammation, and pathogenic overgrowth. Low frequencies promote parasympathetic (rest-and-digest) activation essential for gut healing. Healing frequencies support mucosal repair and tight junction protein restoration. Antimicrobial frequencies address SIBO, candida, and other gut pathogens.",
    treatmentDuration: "3-minute sweep per frequency, total session 50 minutes",
    sessionsPerWeek: 3,
    equipment: ["Rife frequency generator", "Contact pads (placed on abdomen)", "Comfortable reclining position"],
    safetyProtocols: [
      "Elimination diet should precede and accompany gut repair protocols",
      "Introduce probiotics 2 weeks after starting antimicrobial frequencies",
      "Monitor stool changes - temporary changes in consistency/frequency are normal",
      "L-glutamine supplementation supports intestinal lining repair"
    ],
    contraindications: [
      "Pregnancy",
      "Pacemaker or electronic implants",
      "Active inflammatory bowel disease flare (Crohn's, UC)",
      "Recent abdominal surgery within 6 weeks",
      "Intestinal obstruction"
    ],
    notes: "Gut repair is fundamental to overall health restoration. The protocol follows a 5R framework: Remove (pathogens/irritants), Replace (enzymes/acids), Reinoculate (probiotics), Repair (mucosal support), and Rebalance (lifestyle). Bone broth, collagen peptides, and zinc carnosine support mucosal healing.",
    researchBasis: "Combines antimicrobial Rife frequencies with tissue-healing frequency research. PEMF abdominal application studies show improved gut motility and reduced intestinal inflammation.",
    tags: ["gut", "microbiome", "leaky-gut", "sibo", "digestive", "cellular-repair"]
  },
  {
    id: "rife-nerve-repair",
    conditionName: "Nerve Repair & Neuropathy",
    category: "detox_cellular_repair",
    categoryLabel: "Detox & Cellular Repair",
    frequencyRange: "2–10000 Hz",
    primaryFrequencies: [2, 7.83, 10, 15, 20, 28, 40, 72, 95, 125, 304, 432, 528, 660, 880, 10000],
    mechanism: "Promotes peripheral nerve regeneration and pain modulation. Very low frequencies (2-28 Hz) stimulate nerve growth factor (NGF) production and Schwann cell activity. Mid-range frequencies support myelin sheath repair. The 10 Hz frequency is particularly effective for nerve conduction enhancement and pain reduction in neuropathic conditions.",
    treatmentDuration: "5-minute exposure per frequency, total session 60 minutes",
    sessionsPerWeek: 4,
    equipment: ["Rife frequency generator", "Contact pads (placed along affected nerve pathways)", "PEMF mat for whole-body nerve support"],
    safetyProtocols: [
      "Pad placement is critical - follow nerve dermatome maps for optimal targeting",
      "Sensation changes (tingling, warmth) during treatment are normal and indicate nerve response",
      "Avoid extreme temperatures on neuropathic areas after treatment",
      "B-vitamin complex supplementation essential for nerve repair (B1, B6, B12, folate)"
    ],
    contraindications: [
      "Pregnancy",
      "Pacemaker or electronic implants",
      "Active nerve compression requiring surgical intervention",
      "Spinal cord injury (requires specialized protocol under medical supervision)"
    ],
    notes: "Neuropathy protocols require patience - nerve regeneration occurs at approximately 1mm per day. Alpha-lipoic acid, acetyl-L-carnitine, and lion's mane mushroom support nerve regeneration alongside Rife therapy. Blood sugar control is essential for diabetic neuropathy.",
    researchBasis: "Strong PEMF evidence for nerve regeneration. Multiple clinical studies show low-frequency PEMF enhances peripheral nerve repair, reduces neuropathic pain, and promotes NGF expression.",
    tags: ["neuropathy", "nerve-repair", "pain", "peripheral-nerve", "cellular-repair"]
  }
];

export const RIFE_SAFETY_GUIDELINES = {
  generalSafety: [
    "Always consult a qualified healthcare provider before starting any Rife frequency protocol",
    "Rife therapy is complementary and should not replace conventional medical treatment",
    "Start all protocols with the lowest intensity and shortest duration, gradually increasing",
    "Maintain adequate hydration (minimum 2-3 liters of water daily) during treatment periods",
    "Allow at least 24-48 hours between sessions for detoxification and recovery",
    "Keep a treatment journal documenting frequencies used, session duration, and any reactions",
    "Store all frequency equipment according to manufacturer specifications",
    "Never operate frequency equipment while driving or operating heavy machinery"
  ],
  universalContraindications: [
    "Pregnancy and breastfeeding",
    "Cardiac pacemakers, defibrillators, or implanted electronic medical devices",
    "Epilepsy or seizure disorders (unless under direct medical supervision)",
    "Active organ transplant immunosuppression",
    "Children under 5 years of age without specialized practitioner guidance"
  ],
  herxheimerReaction: {
    description: "A Herxheimer reaction (healing crisis) occurs when pathogen die-off releases toxins faster than the body can eliminate them. Symptoms may include fatigue, headache, joint/muscle pain, brain fog, skin eruptions, digestive changes, and flu-like symptoms.",
    management: [
      "Reduce session frequency and duration immediately",
      "Increase water intake to 3-4 liters daily",
      "Take activated charcoal or bentonite clay binders 30 minutes after sessions",
      "Epsom salt baths, dry brushing, and infrared sauna support toxin elimination",
      "Rest and allow the body to process the die-off",
      "Resume treatment at lower intensity once symptoms subside"
    ]
  },
  equipmentGuidelines: {
    plasmaDevices: "Plasma tube devices emit electromagnetic frequencies through noble gas (argon, helium) plasma. Maintain 12-18 inches distance from the body. Session times typically 3-5 minutes per frequency. Most effective for whole-body and deep-tissue applications.",
    contactDevices: "Contact pad/electrode devices deliver frequencies through direct skin contact. Clean pads with alcohol between uses. Ensure good skin contact with conductive gel or damp cloth. Most effective for targeted local application.",
    pemfDevices: "PEMF (Pulsed Electromagnetic Field) mats deliver low-frequency therapeutic fields across the entire body. Follow manufacturer intensity guidelines. Sessions typically 20-60 minutes. Excellent for systemic inflammation and pain protocols."
  }
};

export const RIFE_CATEGORY_INFO = {
  infectious: {
    label: "Infectious Diseases",
    description: "Protocols targeting bacterial, viral, fungal, and parasitic pathogens through mortal oscillatory resonance (MOR) and cellular disruption frequencies.",
    icon: "shield"
  },
  chronic: {
    label: "Chronic Conditions",
    description: "Multi-frequency approaches addressing chronic inflammatory, autoimmune, metabolic, and pain conditions through immune modulation and tissue repair.",
    icon: "heart"
  },
  detox_cellular_repair: {
    label: "Detox & Cellular Repair",
    description: "Protocols supporting organ detoxification, heavy metal elimination, cellular regeneration, and tissue repair through low-frequency stimulation and healing frequencies.",
    icon: "sparkles"
  }
};
