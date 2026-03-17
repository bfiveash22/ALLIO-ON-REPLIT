import { db } from "../db";
import { eq, inArray } from "drizzle-orm";
import {
  trainingModules,
  trainingTracks,
  trackModules,
  trainingModuleSections,
  trainingModuleKeyPoints,
  quizzes,
  quizQuestions,
  quizAnswers,
  moduleQuizzes,
  achievements,
} from "@shared/schema";

const LBA_TRACK_ID = "track-lba-practitioner";

const LBA_MODULES = [
  {
    id: "lba-mod-01",
    title: "Foundations of Live Blood Analysis",
    slug: "lba-foundations",
    description: "History, scientific basis, and equipment setup for Live Blood Analysis practice. Covers Antoine Bechamp, pleomorphism theory origins, dark field microscopy techniques, and legal/ethical considerations.",
    category: "lba-certification",
    sortOrder: 1,
    duration: "4 hours",
    difficulty: "beginner" as const,
    instructorName: "HIPPOCRATES AI",
    instructorTitle: "LBA Training Division",
    hasQuiz: true,
    isInteractive: true,
    sections: [
      {
        title: "History and Development of Live Blood Analysis",
        content: `Live Blood Analysis (LBA) traces its origins to Antoine Bechamp (1816-1908), who proposed that tiny particles he called "microzymes" were the fundamental units of life, capable of evolving into bacteria and other forms depending on the terrain (internal environment) of the host. This concept, known as pleomorphism, stands in contrast to Louis Pasteur's monomorphism — the idea that each microorganism has a fixed form.

Bechamp's work was largely overshadowed by Pasteur's germ theory, which became the dominant paradigm in medicine. However, pleomorphic thinking continued through researchers like Gunther Enderlein (1872-1968), who developed a comprehensive theory of cyclogeny — the developmental cycle of microorganisms from primitive colloidal forms (protits) through bacterial stages to fungal culmination.

Dark field microscopy, which illuminates specimens against a dark background to reveal structures invisible in bright field, became the primary tool for observing these pleomorphic phenomena in living blood. Practitioners like Gaston Naessens, Robert O. Young, and the Dumrese/Haefeli school further developed the diagnostic and therapeutic applications of live blood observation.

Today, LBA is practiced within integrative, naturopathic, and functional medicine settings as a real-time assessment tool providing visual feedback about nutritional status, oxidative stress, immune function, and biological terrain. Within the FFPMA framework, LBA serves as a cornerstone of the nature-first diagnostic approach.`,
      },
      {
        title: "Scientific Basis and Methodology",
        content: `Live Blood Analysis examines fresh, unfixed blood under a high-powered dark field or phase contrast microscope to observe living cells in real-time. Unlike conventional blood tests that analyze dried, stained, and fixed samples, LBA preserves the dynamic state of blood components.

Key Scientific Principles:
- Blood Composition: Plasma (55%), red blood cells (44%), white blood cells and platelets (1%). Each component provides diagnostic information.
- Cellular Morphology: The shape, size, and behavior of blood cells reflects underlying physiological conditions.
- Terrain Theory vs Germ Theory: LBA practitioners work with the understanding that the body's internal terrain (pH, oxidation-reduction potential, mineral balance) determines health status and microbial behavior.
- Pleomorphism: The observation that microorganisms can change form based on environmental conditions — a foundational concept for interpreting LBA findings.

Differences from Conventional Hematology:
Conventional hematology uses Wright-Giemsa staining on dried blood films and automated analyzers. LBA uses unstained, living blood in dark field. Conventional provides quantitative counts; LBA provides qualitative morphological and dynamic assessment. Both approaches provide complementary information.

Research Support:
While LBA is not considered a standard diagnostic tool in conventional medicine, peer-reviewed research supports many of its individual observations: rouleaux formation correlating with inflammation, echinocyte formation with oxidative stress, fibrin activity with coagulation abnormalities, and crystalline formations with metabolic disorders.`,
      },
      {
        title: "Equipment and Setup",
        content: `Essential Equipment for LBA Practice:

1. Dark Field Microscope:
- Minimum 1000x magnification (oil immersion)
- Dark field condenser with proper numerical aperture
- Phase contrast capabilities (optional but recommended)
- Binocular or trinocular head (trinocular for camera attachment)
- Recommended brands: Olympus, Nikon, Zeiss (research-grade preferred)
- Budget options available but sacrifice image quality

2. Camera System:
- High-resolution digital camera adapted for microscopy
- Live video feed capability for member education
- Image capture software for documentation
- Monitor for real-time display to patients
- Storage system for before/after comparisons

3. Sample Collection Supplies:
- Sterile lancets (2.4mm depth, single-use)
- Glass microscope slides (pre-cleaned, oil-free)
- Coverslips (#1 thickness, 18x18mm or 22x22mm)
- Alcohol swabs (70% isopropyl)
- Gauze pads and bandages
- Sharps disposal container
- Immersion oil (Type A for dark field)

4. Workspace Requirements:
- Vibration-free surface
- Controlled lighting (dim ambient light for dark field)
- Temperature-controlled environment
- HIPAA-compliant storage for member images
- Cleaning supplies for slide preparation

5. Calibration and Maintenance:
- Regular microscope alignment (Kohler illumination)
- Condenser centering and adjustment
- Objective lens cleaning protocol
- Camera white balance calibration
- Annual professional microscope servicing`,
      },
    ],
    keyPoints: [
      "LBA originated from Bechamp's pleomorphism theory and evolved through Enderlein's cyclogeny research",
      "Dark field microscopy reveals structures invisible in conventional bright field preparation",
      "LBA provides qualitative, real-time assessment complementary to conventional blood testing",
      "A minimum 1000x dark field microscope with camera system is required for practice",
      "Proper sample collection technique is essential — sterile lancet, clean slide, coverslip within 20 minutes",
      "LBA operates within the terrain theory framework, assessing internal environment rather than seeking specific pathogens",
    ],
  },
  {
    id: "lba-mod-02",
    title: "Dark Field Microscopy Mastery",
    slug: "lba-dark-field-mastery",
    description: "Advanced dark field microscopy techniques including Kohler illumination, oil immersion, sample collection protocol, and the FFPMA 5-Zone systematic observation method.",
    category: "lba-certification",
    sortOrder: 2,
    duration: "6 hours",
    difficulty: "intermediate" as const,
    instructorName: "PARACELSUS AI",
    instructorTitle: "Microscopy Training Division",
    hasQuiz: true,
    isInteractive: true,
    sections: [
      {
        title: "Microscopy Fundamentals",
        content: `Dark Field Microscopy Principles:
In dark field microscopy, the condenser blocks direct light from reaching the objective. Only light scattered by the specimen enters the objective, creating bright objects against a dark background. This technique reveals structures that are transparent or too small to see in bright field.

Kohler Illumination Setup:
1. Focus specimen with 10x objective
2. Close field diaphragm until you see the diaphragm edges
3. Center the condenser so diaphragm image is centered
4. Open field diaphragm until just outside field of view
5. Adjust condenser aperture for optimal contrast

Oil Immersion Technique:
- Always use the correct immersion oil (Type A for dark field)
- Apply a small drop to the condenser top AND the slide bottom
- Lower the dark field condenser until oil contacts the slide
- Apply oil to the top of the slide for the 100x objective
- Focus slowly to avoid crushing the coverslip
- Clean all surfaces after each session

Objective Lens Selection:
- 10x: Overview scanning, locating areas of interest
- 40x: General observation, cell counting estimation
- 100x (oil): Detailed morphological examination, pleomorphic form identification
- Phase contrast (if available): Enhanced visualization of transparent structures

Condenser Alignment:
The dark field condenser must be precisely aligned for optimal results. Misalignment causes uneven illumination and poor contrast. Check alignment at the start of each session and readjust as needed.`,
      },
      {
        title: "Sample Collection Protocol",
        content: `Proper Sample Collection for LBA:

Member Preparation:
- Ideally fasting 12 hours (minimum 4 hours)
- Well hydrated (8oz water 30 minutes prior)
- No supplements or medications for 4 hours if possible
- Document current medications and supplements
- Record last meal and time

Finger Prick Technique:
1. Warm the hands (cold fingers = poor blood flow)
2. Select the ring finger of non-dominant hand
3. Clean with 70% isopropyl alcohol
4. Allow alcohol to completely dry (30 seconds)
5. Use sterile lancet on the SIDE of the fingertip (2.4mm depth)
6. Wipe away the first drop with sterile gauze (contains tissue fluid)
7. Allow a small drop to form by gravity (do NOT squeeze)
8. Touch the slide to the blood drop (do NOT smear)
9. Apply coverslip immediately at a 45-degree angle
10. Place on microscope within 2 minutes

Critical Timing:
- Blood begins changing immediately upon leaving the body
- Optimal observation window: first 15-20 minutes
- After 20 minutes, artifacts increase significantly
- Document time of sample collection
- Sequential observations every 5 minutes reveal dynamic changes

Common Errors:
- Squeezing the finger (introduces tissue fluid)
- Alcohol not fully dry (causes echinocyte artifact)
- Air bubbles under coverslip (use 45-degree angle technique)
- Too much or too little blood (affects cell distribution)
- Thick preparation (cells overlap, cannot assess individual morphology)`,
      },
      {
        title: "The FFPMA 5-Zone Systematic Observation Method",
        content: `Systematic observation ensures consistent, thorough analysis. The FFPMA 5-Zone Protocol provides a structured approach:

Zone 1 - Center Field:
- Initial cell distribution assessment
- RBC density and uniformity
- Immediate morphological impression
- Identify dominant patterns
- Note any obvious abnormalities

Zone 2 - Peripheral Scan:
- Edge phenomena and drying patterns
- Cell behavior at slide margins
- Platelet distribution
- Fibrin formation patterns
- Artifact identification at edges

Zone 3 - Plasma Quality:
- Debris assessment (type and quantity)
- Crystal identification (shape, size, location)
- Fibrin activity (spicules, strands, networks)
- Microbial forms (protits, bacterial-phase forms)
- Chylomicron assessment (post-meal fat globules)

Zone 4 - Cell-to-Cell Interaction:
- Rouleaux formation (degree and extent)
- RBC aggregation patterns
- WBC-RBC interactions
- Platelet aggregation behavior
- Zeta potential assessment

Zone 5 - Dynamic Assessment:
- Cell movement and motility
- WBC activity level (sluggish vs active)
- Phagocytic activity observation
- Time-lapse changes (5, 10, 15, 20 minutes)
- Vitality scoring (1-10 scale)

Documentation at Each Zone:
- Photograph/video capture
- Written notes with standardized terminology
- Severity grading (mild/moderate/severe)
- Comparison with patient's previous sessions
- Time stamp for dynamic observations`,
      },
    ],
    keyPoints: [
      "Dark field creates bright objects on dark background by blocking direct light transmission",
      "Kohler illumination setup is essential for consistent, high-quality imaging",
      "Oil immersion at 100x is required for detailed morphological and pleomorphic form identification",
      "Wipe away the first blood drop — it contains tissue fluid that creates artifacts",
      "The 15-20 minute observation window is critical; artifacts increase rapidly after",
      "The FFPMA 5-Zone Protocol ensures systematic, thorough analysis of every sample",
    ],
  },
  {
    id: "lba-mod-03",
    title: "Red Blood Cell Analysis",
    slug: "lba-rbc-analysis",
    description: "Comprehensive RBC morphology assessment including normal morphology, abnormal findings (rouleaux, echinocytes, acanthocytes, target cells, poikilocytosis), and vitality scoring.",
    category: "lba-certification",
    sortOrder: 3,
    duration: "6 hours",
    difficulty: "intermediate" as const,
    instructorName: "HIPPOCRATES AI",
    instructorTitle: "Hematology Training",
    hasQuiz: true,
    isInteractive: true,
    sections: [
      {
        title: "Healthy RBC Morphology",
        content: `Normal Red Blood Cell Characteristics:
- Size: 7-8 micrometers diameter (use as internal size reference)
- Shape: Biconcave disc with central pallor visible in bright field
- Dark Field: Bright, round discs with slight central dimple
- Membrane: Smooth, no projections or irregularities
- Distribution: Free-flowing, non-aggregated, evenly spaced
- Color: Uniform brightness in dark field
- Flexibility: Should deform slightly when passing through gaps

Assessing RBC Health:
The quality of red blood cells reflects:
1. Nutritional status (iron, B12, folate, essential fatty acids)
2. Oxidative stress levels (membrane integrity)
3. Hydration status (cell volume and behavior)
4. Liver function (membrane lipid composition)
5. Bone marrow health (cell production quality)
6. Toxic burden (membrane damage patterns)

Size Variations:
- Normocytic: 7-8 micrometers (normal)
- Microcytic: <7 micrometers (iron deficiency, thalassemia)
- Macrocytic: >8 micrometers (B12/folate deficiency, liver disease)
- Anisocytosis: Variable sizes in same sample (multiple deficiencies)`,
      },
      {
        title: "Abnormal RBC Findings",
        content: `Rouleaux Formation (Stacking):
- Appearance: RBCs stacked like coins in rolls
- Causes: Elevated fibrinogen, immunoglobulins, inflammation
- Clinical significance: Poor circulation, reduced oxygen delivery
- Nutritional associations: Protein digestion issues, enzyme deficiency
- Differentiate from: Agglutination (irregular clumps) and artifact
- Zeta potential connection: Reduced surface charge allows stacking

Echinocytes (Crenated/Spiky Cells):
- Appearance: Evenly distributed spicules around cell surface (10-30)
- Causes: Oxidative stress, fatty acid imbalance, uremia
- Associated conditions: Liver stress, EFA deficiency
- Key distinction: Artifact echinocytes are uniform throughout; true echinocytes correlate with clinical findings

Acanthocytes (Spur Cells):
- Appearance: Irregular, unevenly distributed spicules (3-12)
- Causes: Severe liver disease, abetalipoproteinemia
- Clinical significance: Membrane lipid composition abnormality
- Key distinction: Irregular spicules vs the regular spicules of echinocytes

Target Cells (Codocytes):
- Appearance: Bulls-eye pattern with central density
- Causes: Liver disease, hemoglobinopathies, iron deficiency
- In dark field: Central bright spot within the disc

Poikilocytosis (Shape Variations):
- Tear drops (dacrocytes): Myelofibrosis, bone marrow infiltration
- Sickle cells (drepanocytes): Sickle cell disease
- Helmet cells (schistocytes): Mechanical damage, DIC, TTP
- Spherocytes: Hereditary spherocytosis, autoimmune hemolytic anemia
- Multiple abnormalities indicate systemic issues`,
      },
      {
        title: "RBC Vitality Assessment",
        content: `RBC Vitality Scoring System (1-10):

Score 9-10 (Excellent):
- Round, uniform biconcave discs
- Free-flowing, no aggregation
- Smooth membranes
- Good flexibility observed
- Consistent size throughout

Score 7-8 (Good):
- Mostly round with minor variations
- Minimal rouleaux (2-3 cell stacks occasional)
- Smooth membranes with rare irregularities
- Good overall distribution

Score 5-6 (Fair):
- Noticeable morphological variations
- Moderate rouleaux (5-8 cell stacks common)
- Some echinocytes visible
- Occasional target cells or other variants

Score 3-4 (Poor):
- Significant morphological abnormalities
- Heavy rouleaux (>10 cell stacks)
- Multiple echinocytes and/or acanthocytes
- Poikilocytosis evident
- Reduced membrane clarity

Score 1-2 (Critical):
- Severe morphological disturbance
- Complete aggregation / sludging
- Extensive poikilocytosis
- Schistocytes or severely damaged cells
- Minimal free-flowing cells visible

Membrane Flexibility Observations:
Watch how cells deform when they encounter other cells or slide edges. Healthy cells flex and bounce back. Stiff cells indicate oxidative damage to the membrane lipid bilayer.

Oxygen-Carrying Capacity Indicators:
- Central pallor assessment (hypochromia = reduced hemoglobin)
- Cell size (microcytic = reduced capacity per cell)
- Cell brightness in dark field (reflects hemoglobin content)

Document vitality score at each observation time point (0, 5, 10, 15, 20 minutes) to assess rate of deterioration.`,
      },
    ],
    keyPoints: [
      "Normal RBCs are 7-8 micrometers, biconcave, smooth-membraned, and free-flowing",
      "Rouleaux formation indicates elevated plasma proteins, inflammation, and reduced zeta potential",
      "Echinocytes have even spicules (oxidative stress); acanthocytes have irregular spicules (liver disease)",
      "Target cells appear in liver disease, hemoglobinopathies, and iron deficiency",
      "The vitality scoring system (1-10) provides standardized assessment across practitioners",
      "Document vitality at multiple time points to assess the rate of blood deterioration",
    ],
  },
  {
    id: "lba-mod-04",
    title: "White Blood Cell Analysis",
    slug: "lba-wbc-analysis",
    description: "WBC types, functions, activity assessment, immune status indicators, and recognizing signs of chronic vs acute inflammation in live blood.",
    category: "lba-certification",
    sortOrder: 4,
    duration: "4 hours",
    difficulty: "intermediate" as const,
    instructorName: "HIPPOCRATES AI",
    instructorTitle: "Immunology Training",
    hasQuiz: true,
    isInteractive: true,
    sections: [
      {
        title: "WBC Types and Functions in Dark Field",
        content: `White Blood Cell Identification in Dark Field:

Neutrophils (50-70% of WBCs):
- Dark field appearance: Large, round, multilobed nucleus visible as darker region
- Active motility — should move across the slide
- Phagocytic activity may be directly observed
- First responders to bacterial infection
- Granules may be visible in phase contrast

Lymphocytes (20-40% of WBCs):
- Smaller than neutrophils, round with large nucleus
- Less motile, more stationary behavior in dark field
- Key players in adaptive immunity and viral defense
- B-cells (antibody production) and T-cells (cellular immunity)

Monocytes (2-8% of WBCs):
- Largest WBCs, kidney-shaped or bilobed nucleus
- Active phagocytic behavior — become macrophages in tissues
- "Cleanup crew" — engulf debris, dead cells, pathogens
- Watch for active engulfment during observation

Eosinophils (1-4% of WBCs):
- Bilobed nucleus with prominent granules
- Elevated in parasitic infections and allergic conditions
- Granules may appear refractile in dark field

Basophils (<1% of WBCs):
- Rare — bilobed nucleus obscured by dark granules
- Histamine release, inflammatory mediation
- Rarely encountered in LBA`,
      },
      {
        title: "WBC Activity Assessment and Immune Status",
        content: `Assessing WBC Activity in Live Blood:

Active/Healthy WBC Behavior:
- Visible motility across the slide
- Active pseudopod extension (neutrophils, monocytes)
- Phagocytic activity — engulfing debris or organisms
- Responsive to stimuli
- Normal size and nuclear morphology

Sluggish/Suppressed WBC Behavior:
- Minimal movement
- Rounded, non-extending morphology
- No phagocytic activity observed
- May appear "stuck" or immobile
- Indicates immune suppression or exhaustion

Hyperactive WBC Behavior:
- Rapid, aggressive movement
- Multiple WBCs congregating
- Excessive phagocytic activity
- May indicate acute infection or inflammatory response

Immune Status Indicators:
1. WBC Relative Count Estimation: While not a substitute for CBC, gross estimation of WBC frequency provides contextual information.
2. Activity Level Score (1-5): Rate overall WBC activity from minimal (1) to hyperactive (5).
3. Phagocytic Efficiency: How effectively WBCs engulf and process targets.
4. Nuclear Morphology: Hypersegmentation (B12/folate), left shift (acute infection), toxic granulation.

Signs of Chronic vs Acute Inflammation:
- Chronic: Sluggish WBCs, background debris, persistent fibrin, moderate rouleaux
- Acute: Hyperactive WBCs, fresh fibrin formation, increased WBC numbers
- Autoimmune: WBCs may appear confused or attacking normal structures`,
      },
    ],
    keyPoints: [
      "Neutrophils are the most common WBC and their activity level reflects immune competence",
      "WBC motility and phagocytic activity are directly observable in live blood",
      "Sluggish WBC behavior indicates immune suppression or exhaustion",
      "The WBC activity score (1-5) standardizes immune function assessment",
      "Chronic inflammation shows sluggish WBCs with background debris; acute shows hyperactive WBCs",
      "Monocyte phagocytic activity — watching cleanup in real-time — is a powerful member education tool",
    ],
  },
  {
    id: "lba-mod-05",
    title: "Plasma Analysis",
    slug: "lba-plasma-analysis",
    description: "Plasma quality assessment including fibrin activity, crystalline formations, debris/particles, chylomicrons, and bacterial/fungal indicators.",
    category: "lba-certification",
    sortOrder: 5,
    duration: "4 hours",
    difficulty: "intermediate" as const,
    instructorName: "PARACELSUS AI",
    instructorTitle: "Biochemistry Training",
    hasQuiz: true,
    isInteractive: true,
    sections: [
      {
        title: "Healthy Plasma and Abnormal Findings",
        content: `Healthy Plasma Characteristics in Dark Field:
- Clear background with minimal debris
- Free-flowing cells with adequate spacing
- Minimal or no fibrin strands
- No crystalline formations
- Absence of visible microbial forms beyond normal protit activity

Fibrin Activity Assessment:
Fibrin spicules and strands indicate activation of the coagulation cascade:
- Mild: Occasional short spicules radiating from cell surfaces
- Moderate: Multiple strands visible, some forming networks
- Severe: Extensive fibrin networks entrapping cells, "spider web" appearance
- Clinical correlation: Liver stress, chronic inflammation, cardiovascular risk
- Nutritional focus: Proteolytic enzymes (nattokinase, serrapeptase, bromelain)

Crystalline Formations:
- Uric acid crystals: Needle-shaped, associated with gout and kidney stress
- Cholesterol crystals: Plate-like, rhomboid, associated with lipid metabolism
- Plaque formations: Irregular aggregates of lipid and mineral deposits
- Calcium crystals: Variable morphology, associated with mineral imbalance
- Identification technique: Shape, size, refractivity, and clinical correlation

Debris and Particles:
- Bacterial forms: Small motile or static forms (assess within cyclogeny context)
- Fungal/yeast indicators: Larger forms, possible hyphal elements
- Undigested material: Irregular particles suggesting digestive insufficiency
- Toxic burden indicators: Background "snow" or particulate debris
- Chylomicrons: Fat globules visible after recent meal (test fasting to avoid)`,
      },
    ],
    keyPoints: [
      "Healthy plasma is clear with minimal debris and no excessive fibrin activity",
      "Fibrin severity grading (mild/moderate/severe) provides standardized assessment",
      "Crystal morphology identifies the underlying metabolic issue (uric acid vs cholesterol vs mineral)",
      "Background debris or 'snow' in plasma indicates toxic burden or digestive insufficiency",
      "Chylomicrons from recent meals can confuse analysis — fasting samples are essential",
      "Plasma quality reflects liver function, inflammatory status, and metabolic health",
    ],
  },
  {
    id: "lba-mod-06",
    title: "Platelet Assessment",
    slug: "lba-platelet-assessment",
    description: "Normal and abnormal platelet presentations, aggregation assessment, and coagulation implications.",
    category: "lba-certification",
    sortOrder: 6,
    duration: "2 hours",
    difficulty: "beginner" as const,
    instructorName: "HIPPOCRATES AI",
    instructorTitle: "Hematology Training",
    hasQuiz: true,
    isInteractive: true,
    sections: [
      {
        title: "Platelet Assessment in Live Blood",
        content: `Normal Platelet Presentation:
- Size: 2-4 micrometers (smallest blood cells)
- Shape: Round to oval, may appear as tiny bright dots in dark field
- Distribution: Scattered evenly, not clumped
- Aggregation: Mild grouping is normal; excessive clumping is not
- Count estimation: Should see scattered platelets throughout fields

Abnormal Platelet Findings:
1. Excessive Aggregation:
   - Large clumps of platelets
   - Indicates clotting tendency
   - May suggest cardiovascular risk
   - Differentiate from: EDTA-induced pseudothrombocytopenia (artifact in drawn blood; not seen in finger-prick LBA)

2. Giant Platelets:
   - Platelets approaching RBC size
   - May indicate myeloproliferative disorders or rapid turnover
   - Assess in context of overall blood picture

3. Reduced Platelet Visibility:
   - Very few platelets seen
   - May indicate thrombocytopenia
   - Correlate with CBC for confirmation

4. Platelet-Fibrin Interactions:
   - Platelets enmeshed in fibrin strands
   - Indicates coagulation cascade activation
   - Correlates with cardiovascular and inflammatory risk

Coagulation Assessment:
Platelets work with fibrin to form clots. In LBA, observe the relationship between platelet behavior, fibrin formation, and overall blood fluidity to assess coagulation tendency.`,
      },
    ],
    keyPoints: [
      "Normal platelets are 2-4 micrometers, round, and scattered throughout the field",
      "Excessive platelet aggregation indicates clotting tendency and cardiovascular risk",
      "Giant platelets may indicate myeloproliferative disorders or rapid platelet turnover",
      "Platelet-fibrin interactions reveal coagulation cascade activation status",
      "Platelet assessment in LBA complements but does not replace CBC platelet counts",
    ],
  },
  {
    id: "lba-mod-07",
    title: "Clinical Correlation & Pattern Recognition",
    slug: "lba-clinical-correlation",
    description: "Pattern recognition for oxidative stress, digestive dysfunction, chronic inflammation, dehydration, and nutritional deficiency. Integration with conventional testing.",
    category: "lba-certification",
    sortOrder: 7,
    duration: "4 hours",
    difficulty: "advanced" as const,
    instructorName: "PARACELSUS AI",
    instructorTitle: "Clinical Training",
    hasQuiz: true,
    isInteractive: true,
    sections: [
      {
        title: "Pattern Recognition and Clinical Integration",
        content: `Recognizing Clinical Patterns in LBA:

Oxidative Stress Pattern:
- Echinocytes (spiky cells) — membrane lipid peroxidation
- Background debris in plasma
- Fibrin activity
- Reduced RBC vitality score
- Correlate with: Antioxidant status, lipid peroxides, 8-OHdG

Digestive Dysfunction Pattern:
- Undigested particles in plasma
- Chylomicrons visible in fasting sample
- Bacterial forms suggesting dysbiosis
- Nutritional deficiency indicators in RBCs (size/color variations)
- Correlate with: Comprehensive stool analysis, organic acids

Chronic Inflammation Pattern:
- Heavy rouleaux formation
- Sluggish WBC activity
- Persistent fibrin strands
- Background debris
- Correlate with: CRP, ESR, inflammatory cytokines

Dehydration Pattern:
- Moderate rouleaux (reduced zeta potential from concentrated proteins)
- Cells appear packed closely
- Reduced plasma volume between cells
- Rapid deterioration of sample
- Correlate with: BUN/creatinine ratio, urine specific gravity

Nutritional Deficiency Patterns:
- Iron deficiency: Microcytic, hypochromic RBCs
- B12/Folate deficiency: Macrocytic RBCs, hypersegmented neutrophils
- EFA deficiency: Echinocytes without other oxidative markers
- Mineral imbalance: Crystalline formations in plasma

Integration with Conventional Testing:
LBA findings should always be correlated with:
1. Complete Blood Count (CBC) with differential
2. Comprehensive Metabolic Panel (CMP)
3. Inflammatory markers (CRP, ESR)
4. Nutrient levels (iron studies, B12, folate, vitamin D)
5. Liver function tests
6. Lipid panel`,
      },
    ],
    keyPoints: [
      "Oxidative stress pattern: echinocytes + debris + fibrin = membrane lipid peroxidation",
      "Digestive dysfunction: undigested particles + bacterial forms + chylomicrons in fasting sample",
      "Chronic inflammation: heavy rouleaux + sluggish WBCs + persistent fibrin",
      "Always correlate LBA findings with conventional laboratory testing",
      "Pattern recognition improves with experience — document and compare cases systematically",
      "LBA provides qualitative context that makes quantitative lab values more meaningful",
    ],
  },
  {
    id: "lba-mod-08",
    title: "Treatment Protocols & Monitoring",
    slug: "lba-treatment-monitoring",
    description: "Baseline documentation, progress monitoring, protocol adjustments based on LBA observations, and before/after comparison techniques.",
    category: "lba-certification",
    sortOrder: 8,
    duration: "4 hours",
    difficulty: "intermediate" as const,
    instructorName: "HIPPOCRATES AI",
    instructorTitle: "Protocol Training",
    hasQuiz: true,
    isInteractive: true,
    sections: [
      {
        title: "Treatment Monitoring with LBA",
        content: `Baseline Documentation Protocol:
Every new patient/member should receive a baseline LBA session with:
1. Standardized collection conditions (fasting, hydrated, same time of day)
2. Full 5-Zone assessment with photographs at each zone
3. Vitality score documentation at 0, 5, 10, 15, 20 minutes
4. Written narrative of all findings using standardized terminology
5. Correlation with any available laboratory data

Progress Monitoring Schedule:
- Acute protocols: Retest at 2 weeks
- Standard protocols: Retest at 4 weeks
- Maintenance: Retest every 3-6 months
- Before/after comparisons require identical collection conditions

Visual Comparison Techniques:
- Side-by-side photograph comparison (same magnification, same zone)
- Vitality score trending over time
- Pattern severity grading comparison (mild/moderate/severe)
- Member education using before/after images

Protocol Adjustment Indicators:
- Improving vitality score: Protocol is working, continue
- Stable vitality score: May need dose adjustment or additional interventions
- Declining vitality score: Protocol is not effective, reassess
- New findings appearing: Address emerging issues
- Resolution of previous findings: Note improvement, may simplify protocol

Referral Guidelines:
Refer to conventional medical evaluation when:
- Severe morphological abnormalities suggest serious hematological disease
- Findings are inconsistent with expected patterns
- Member symptoms do not improve with appropriate interventions
- Findings suggest acute medical conditions requiring immediate attention`,
      },
    ],
    keyPoints: [
      "Baseline documentation under standardized conditions is essential for meaningful comparison",
      "Optimal retest intervals: 2 weeks (acute), 4 weeks (standard), 3-6 months (maintenance)",
      "Before/after comparisons require identical collection conditions",
      "Vitality score trending provides objective progress measurement",
      "Protocol adjustments should be guided by LBA improvements, not just symptom changes",
      "Know when to refer — LBA is complementary, not a replacement for medical evaluation",
    ],
  },
  {
    id: "lba-mod-09",
    title: "AI-Enhanced Blood Analysis",
    slug: "lba-ai-integration",
    description: "Using the ALLIO AI blood analysis platform for pattern recognition, second opinions, treatment suggestions, and documentation automation.",
    category: "lba-certification",
    sortOrder: 9,
    duration: "4 hours",
    difficulty: "intermediate" as const,
    instructorName: "SYNTHESIS AI",
    instructorTitle: "Technology Integration",
    hasQuiz: true,
    isInteractive: true,
    sections: [
      {
        title: "ALLIO Blood Analysis AI Integration",
        content: `Using AI-Enhanced Blood Analysis:

The ALLIO platform integrates AI-powered blood analysis to support practitioners:

1. Image Upload and Analysis:
   - Capture high-resolution microscopy images
   - Upload to the ALLIO platform for AI pattern recognition
   - AI identifies morphological features including pleomorphic forms
   - Confidence scores indicate reliability of AI identification

2. Second Opinion Functionality:
   - Submit findings for AI review
   - AI cross-references against the blood sample database
   - Provides differential considerations
   - Highlights findings you may have missed

3. Pattern Matching:
   - AI compares current sample to known patterns in the database
   - Matches against conventional and pleomorphic morphology references
   - Provides similarity scores and explanations
   - Helps identify rare or unusual findings

4. Treatment Integration:
   - AI suggests relevant protocols based on findings
   - Cross-references with the FFPMA 2026 Protocol database
   - Provides nutritional and supplemental recommendations
   - Documents treatment rationale

5. Documentation Automation:
   - AI generates structured reports from observations
   - Standardized format for consistent documentation
   - Before/after comparison assistance
   - HIPAA-compliant storage and retrieval

Human Oversight Requirements:
- AI is a support tool — never a replacement for practitioner judgment
- All AI suggestions must be reviewed by qualified practitioner
- Confidence scores below 70% require careful manual verification
- Clinical context that AI cannot assess must be integrated by the practitioner`,
      },
    ],
    keyPoints: [
      "ALLIO AI provides pattern recognition, second opinions, and documentation support",
      "AI cross-references against both conventional and pleomorphic morphology databases",
      "Confidence scores indicate reliability — low scores require manual verification",
      "AI is a support tool, never a replacement for practitioner clinical judgment",
      "Automated documentation saves time while maintaining standardized reporting",
      "AI treatment suggestions should always be reviewed within the clinical context",
    ],
  },
  {
    id: "lba-mod-10",
    title: "Certification Examination Preparation",
    slug: "lba-certification-exam-prep",
    description: "Review of all modules, examination preparation, certification requirements, and the FFPMA practitioner agreement.",
    category: "lba-certification",
    sortOrder: 10,
    duration: "2 hours",
    difficulty: "advanced" as const,
    instructorName: "HIPPOCRATES AI",
    instructorTitle: "Certification Division",
    hasQuiz: true,
    isInteractive: true,
    sections: [
      {
        title: "Certification Requirements and Exam Preparation",
        content: `FFPMA LBA Practitioner Certification Requirements:

1. Complete all course modules (Modules 1-17) with passing quiz scores (80%+)
2. Pass the 100-question written certification examination (80%+)
3. Sign the FFPMA Practitioner Agreement
4. Maintain annual continuing education (10 hours)

Written Examination Format:
- 100 multiple choice questions
- Covers all 17 modules
- 2 hour time limit
- Passing score: 80% (80/100 correct)
- Open book for reference materials
- Maximum 3 attempts

Exam Content Distribution:
- Foundations & Equipment: 10 questions
- Dark Field Microscopy Technique: 10 questions
- RBC Analysis: 12 questions
- WBC Analysis: 8 questions
- Plasma Analysis: 8 questions
- Platelet Assessment: 5 questions
- Clinical Correlation: 8 questions
- Treatment Monitoring: 5 questions
- AI Integration: 4 questions
- Dry Layer Testing: 8 questions
- Biological Terrain: 6 questions
- Pleomorphism & Cyclogeny: 8 questions
- Blood Mycology: 4 questions
- Zeta Potential: 4 questions
- Parasitology: 5 questions
- Practice Management/Legal: 5 questions

Practitioner Agreement:
Upon certification, practitioners agree to:
- Operate within PMA guidelines
- Present LBA as educational assessment, not medical diagnosis
- Maintain documentation standards
- Continue education requirements
- Uphold ethical standards of the FFPMA`,
      },
    ],
    keyPoints: [
      "All 17 modules must be completed with 80%+ quiz scores before the final exam",
      "The certification exam is 100 questions, 2 hours, 80% passing score",
      "Maximum 3 attempts on the certification exam",
      "Annual continuing education of 10 hours required to maintain certification",
      "The FFPMA Practitioner Agreement establishes scope of practice and ethical standards",
    ],
  },
  {
    id: "lba-mod-11",
    title: "Dry Layer / Oxidative Stress Testing",
    slug: "lba-dry-layer-testing",
    description: "Complete dry layer oxidative stress testing (Bradford/HLB test) including sample preparation, pattern interpretation, zone mapping, and clinical correlation.",
    category: "lba-certification",
    sortOrder: 11,
    duration: "4 hours",
    difficulty: "intermediate" as const,
    instructorName: "PARACELSUS AI",
    instructorTitle: "Biomedx Protocol Training",
    hasQuiz: true,
    isInteractive: true,
    sections: [
      {
        title: "Dry Layer Oxidative Stress Testing",
        content: `The Dry Layer Test (Oxidative Stress Test / Bradford Variable Projection / HLB Test):

This test analyzes patterns formed when drops of blood are allowed to dry on a glass slide. The way blood coagulates and polymerizes its fibrin mesh during drying reveals information about oxidative stress, heavy metal burden, and organ system status.

Sample Collection for Dry Layer:
1. Use the same finger prick as live blood analysis
2. After collecting the live blood sample, place 8 sequential drops on a clean slide
3. Each drop should be approximately the same size (2-3mm diameter)
4. Space drops evenly across the slide
5. Allow to air dry completely (10-15 minutes, undisturbed)
6. Examine under bright field or phase contrast at 40-100x

The 8-Layer System:
Each dried blood drop shows 8 concentric rings (layers) from center to periphery. Each layer correlates with specific organ systems:
- Layer 1 (center): Cardiovascular system
- Layer 2: Respiratory system
- Layer 3: Gastrointestinal tract (upper)
- Layer 4: Liver / Gallbladder
- Layer 5: Kidneys / Urinary
- Layer 6: Reproductive / Hormonal
- Layer 7: Immune / Lymphatic
- Layer 8 (periphery): Musculoskeletal / Nervous system

Pattern Interpretation:
1. Normal: Tight, uniform polymerized fibrin mesh across all layers
2. Lacunae (clear holes): Oxidative stress — free radical damage disrupted fibrin polymerization
3. Dark spots: Heavy metal accumulation, toxic burden
4. Broken mesh: Severe oxidative damage, degenerative tendencies
5. Color variations: May indicate hormonal or metabolic patterns
6. Edge irregularities: Immune system and musculoskeletal issues

Clinical Correlation:
- Layer-specific lacunae suggest organ-specific oxidative burden
- Pattern severity correlates with overall oxidative stress level
- Serial testing shows response to antioxidant interventions
- Combined with live blood provides comprehensive assessment`,
      },
    ],
    keyPoints: [
      "Dry layer testing reveals oxidative stress patterns invisible in live blood analysis",
      "8 sequential drops are analyzed using the 8-layer organ mapping system",
      "Lacunae (clear holes) indicate free radical damage disrupting fibrin polymerization",
      "Dark spots in dried blood correlate with heavy metal toxicity burden",
      "Normal dried blood shows tight, uniform fibrin mesh across all layers",
      "Serial dry layer testing tracks antioxidant intervention effectiveness",
    ],
  },
  {
    id: "lba-mod-12",
    title: "Biological Terrain Assessment",
    slug: "lba-biological-terrain",
    description: "pH, redox potential (rH2), and resistivity testing of blood, saliva, and urine. The 9-factor terrain matrix and its clinical interpretation.",
    category: "lba-certification",
    sortOrder: 12,
    duration: "4 hours",
    difficulty: "advanced" as const,
    instructorName: "PARACELSUS AI",
    instructorTitle: "Terrain Science Training",
    hasQuiz: true,
    isInteractive: true,
    sections: [
      {
        title: "Biological Terrain Assessment (BTA)",
        content: `Biological Terrain Assessment — The Science of the Internal Environment:

The concept of biological terrain originates with Claude Bernard's "milieu interieur" and was developed by Professor Louis-Claude Vincent into a quantifiable assessment system. It measures three parameters in three body fluids to create a 9-factor terrain matrix.

Three Parameters:
1. pH (Potential Hydrogen): Measures acid-alkaline balance
   - Scale: 0-14 (7 = neutral, <7 = acid, >7 = alkaline)
   - Blood: Normal 7.35-7.45 (tightly regulated)
   - Saliva: Normal 6.5-7.0 (reflects digestive terrain)
   - Urine: Normal 6.0-7.0 (reflects metabolic waste)
   - Acidic terrain promotes: upward microbial development, mineral loss, inflammation
   - Alkaline excess: tissue rigidity, mineral deposition, nerve irritability

2. rH2 (Redox Potential): Measures oxidation-reduction balance
   - Scale: 0-42 (higher = more oxidized)
   - Normal blood rH2: 21-23 (balanced)
   - Elevated rH2: Oxidative stress, free radical excess
   - Low rH2: Reductive stress, inadequate oxidative defense
   - Optimal zone for health: rH2 21-23 in blood
   - Correlates with: glutathione status, antioxidant reserves, oxidative damage

3. r (Resistivity): Measures mineral/electrolyte concentration
   - Measured in ohms (higher = fewer dissolved minerals)
   - Blood: 190-210 ohms (reflects mineral concentration)
   - Saliva: 150-250 ohms
   - Urine: 30-60 ohms
   - Low resistivity: Mineral excess, toxic metal burden
   - High resistivity: Mineral deficiency, inadequate nutrition

The 9-Factor Matrix:
Testing pH, rH2, and resistivity in blood, saliva, and urine creates a comprehensive terrain picture:
| Factor | Blood | Saliva | Urine |
| pH | Systemic acid-base | Digestive terrain | Metabolic waste |
| rH2 | Oxidative stress | Oral oxidative | Kidney oxidative |
| r | Mineral status | Digestive minerals | Mineral excretion |

Clinical Interpretation:
- Terrain assessment guides treatment: acidic terrain needs alkalinizing, oxidized terrain needs antioxidants, mineral-depleted terrain needs supplementation
- Terrain correlates with LBA findings: acidic + oxidized terrain typically shows echinocytes, rouleaux, and advanced pleomorphic forms
- Vincent's research showed specific terrain patterns associated with cancer risk, cardiovascular disease, and degenerative conditions`,
      },
    ],
    keyPoints: [
      "Biological terrain is quantified by pH, rH2 (redox), and resistivity in three body fluids",
      "The 9-factor matrix (3 parameters x 3 fluids) provides a comprehensive internal environment picture",
      "Acidic terrain promotes upward microbial development and mineral loss",
      "Elevated rH2 indicates oxidative stress — correlates with echinocytes in LBA",
      "Resistivity reflects mineral concentration — low r suggests excess minerals or toxic metals",
      "Terrain assessment guides treatment: alkalize, reduce oxidative stress, optimize minerals",
    ],
  },
  {
    id: "lba-mod-13",
    title: "Pleomorphism & Enderlein's Cyclogeny",
    slug: "lba-pleomorphism-cyclogeny",
    description: "Deep study of Enderlein's cyclogeny theory, the upward development cycle from protits to fungi, and practical identification of cyclogeny stages in dark field microscopy.",
    category: "lba-certification",
    sortOrder: 13,
    duration: "6 hours",
    difficulty: "advanced" as const,
    instructorName: "HIPPOCRATES AI",
    instructorTitle: "Pleomorphic Science",
    hasQuiz: true,
    isInteractive: true,
    sections: [
      {
        title: "Enderlein's Cyclogeny — The Developmental Cycle",
        content: `Professor Gunther Enderlein's Cyclogeny Theory:

Enderlein (1872-1968) proposed that all microorganisms exist within developmental cycles (cyclogeny) that progress from primitive colloidal forms through bacterial stages to fungal culmination. The direction of development — upward (toward fungus) or downward (toward symbiont) — is determined by the biological terrain.

The Cyclogeny Stages (Upward Development):

1. Protit (Colloid Stage):
   - The fundamental unit — protein-based colloidal particles
   - Present in all living blood
   - In healthy terrain: remain as protits, perform symbiotic functions
   - When terrain disturbs: begin aggregating and developing upward
   - Dark field: tiny, bright, motile points in plasma

2. Chondrit (Thread Stage):
   - Thread-like formations arising from protit aggregation
   - May appear as short filaments or chains
   - Represents the first morphological departure from protit state
   - Dark field: fine, bright threads in plasma

3. Bacterial Phase:
   - Rod forms (Stabchen), spindle forms (Husen), and other bacterial morphologies
   - True bacterial-level organisms developed from lower stages
   - This is the stage recognized by conventional bacteriology
   - May include cocci, rods, and filamentous bacterial forms

4. Fungal Phase (Culmination):
   - The highest development stage in the cyclogeny
   - Branching hyphae, spore-forming structures
   - Represents severe terrain disturbance
   - Two primary cycles: Mucor racemosus and Aspergillus niger

Downward Development (Therapeutic Goal):
The goal of isopathic therapy is to reverse the cyclogeny — to push organisms back down from fungal/bacterial phases toward the harmless protit phase. This is achieved through:
- Terrain correction (pH, redox, minerals)
- Isopathic remedies (Sanum remedies: Mucokehl, Nigersan, etc.)
- Nutritional optimization
- Detoxification protocols

Key Pleomorphic Terminology:
- Cyclogeny: The complete developmental cycle of a microorganism
- Upward development: Progression from protit toward fungal forms (pathological)
- Downward development: Regression from fungal forms toward protit (therapeutic goal)
- Endobiont: An organism that lives permanently within the host
- Isopathy: Treatment using preparations from the same organism cycle`,
      },
      {
        title: "Practical Identification of Cyclogeny Stages",
        content: `Identifying Cyclogeny Stages in Dark Field Practice:

Protit Identification:
- Smallest visible units — points of light in dark field
- Active motility (not just Brownian motion)
- Normal: scattered, individual
- Abnormal: aggregating, clustering, increased density

Chondrit Identification:
- Thread-like formations, uniform diameter
- Distinguished from fibrin: more uniform, different behavior
- May be straight, curved, or gently undulating
- Often seen alongside protit aggregation

Bacterial Phase Identification:
- Rod forms: elongated, defined borders, motile
- May appear alongside earlier cyclogeny forms
- Distinguished from exogenous bacteria by context
- Size and morphology consistent with bacterial dimensions

Fungal Phase Identification:
- Branching hyphae visible in severe cases
- Spore-like structures may be visible
- Represents the most advanced cyclogeny stage
- Correlates with severe terrain disturbance and chronic illness

Mucor Racemosus Cycle:
- Primarily affects: blood coagulation, vascular system
- Symbiont phase: normal protit activity
- Parasitic phase: increased rod forms, fibrin activity
- Fungal phase: branching forms, thrombotic tendencies
- Isopathic remedy: Mucokehl (Sanum)

Aspergillus Niger Cycle:
- Primarily affects: calcium metabolism, skeletal system
- Symbiont phase: normal mineral handling
- Parasitic phase: mineral deposition patterns
- Fungal phase: septate hyphae, joint/skeletal symptoms
- Isopathic remedy: Nigersan (Sanum)

Documentation:
- Always document which cyclogeny stage is predominant
- Note the presence of multiple stages (suggests active development)
- Photograph representative forms
- Correlate with terrain assessment results`,
      },
    ],
    keyPoints: [
      "Cyclogeny is the developmental cycle from protits through bacteria to fungi",
      "Upward development (toward fungus) is pathological; downward (toward protit) is therapeutic",
      "Terrain determines direction: acidic + oxidized terrain drives upward development",
      "Two primary endobiont cycles: Mucor racemosus (vascular) and Aspergillus niger (skeletal)",
      "Isopathic therapy uses preparations from the organism's own cycle to drive downward development",
      "Practical identification requires correlating morphological observations with terrain assessment",
    ],
  },
  {
    id: "lba-mod-14",
    title: "Blood Mycology",
    slug: "lba-blood-mycology",
    description: "Blood fungi, symbionts, parasites, and the upward development of endobiont organisms. Mucor racemosus and Aspergillus niger cycles, isopathic therapy.",
    category: "lba-certification",
    sortOrder: 14,
    duration: "4 hours",
    difficulty: "advanced" as const,
    instructorName: "PARACELSUS AI",
    instructorTitle: "Mycology Training",
    hasQuiz: true,
    isInteractive: true,
    sections: [
      {
        title: "Blood Mycology — The Fungal Dimension",
        content: `Blood Mycology according to Dumrese/Haefeli:

Chapter VI of the Dumrese/Haefeli manual addresses the fungal dimension of blood — the understanding that fungal organisms exist within the blood as endobionts (permanent internal organisms) that can shift from symbiotic to parasitic to fungal phases based on the terrain.

Blood Fungi — Development and Origin:
In Enderlein's framework, blood fungi are not external invaders but the culmination of upward development of organisms that normally exist in symbiotic balance. The progression:
1. Symbiont (protit phase) — helps regulate blood functions
2. Parasite (bacterial phase) — begins causing dysfunction
3. Fungus (mycotic phase) — causes significant pathology

The Mucor Racemosus Cycle in Detail:
- Normal function: Participates in fibrin regulation and blood fluidity
- Parasitic phase: Contributes to excessive coagulation, fibrin overproduction
- Fungal phase: Associated with thrombosis, vascular occlusion, tissue infarction
- Clinical markers: Fibrin activity in LBA, coagulation abnormalities in labs
- Therapeutic approach: Mucokehl (isopathic), terrain correction, blood-thinning protocols

The Aspergillus Niger Cycle in Detail:
- Normal function: Participates in mineral (especially calcium) metabolism
- Parasitic phase: Contributes to abnormal calcium deposition
- Fungal phase: Associated with calcification, joint destruction, skeletal disorders
- Clinical markers: Crystal formations in LBA, elevated calcium, joint symptoms
- Therapeutic approach: Nigersan (isopathic), mineral balancing, anti-calcification protocols

Recognizing Mycotic Progression:
- Early signs: Increased protit aggregation, thread formations
- Intermediate: Rod forms, filaments, transitional morphologies
- Advanced: Branching structures, spore-like formations
- Severe: Visible fungal hyphae, extensive mycotic involvement

Treatment Philosophy:
The goal is not to "kill" the endobiont (which would theoretically be impossible as it exists at the protit level in all blood) but to shift it back downward to its symbiotic phase through terrain correction and isopathic therapy.`,
      },
    ],
    keyPoints: [
      "Blood fungi are the culmination of endobiont upward development, not external invaders",
      "Mucor racemosus cycle: relates to coagulation and vascular health",
      "Aspergillus niger cycle: relates to calcium metabolism and skeletal health",
      "Progression: symbiont (helpful) to parasite (disruptive) to fungus (pathological)",
      "Treatment goal: shift organisms downward to symbiotic phase through terrain correction",
      "Isopathic remedies (Mucokehl, Nigersan) are specific to each endobiont cycle",
    ],
  },
  {
    id: "lba-mod-15",
    title: "Zeta Potential & Blood Colloid Science",
    slug: "lba-zeta-potential",
    description: "Blood as a colloidal system, zeta potential science, factors affecting surface charge, clinical implications for microcirculation and cardiovascular health.",
    category: "lba-certification",
    sortOrder: 15,
    duration: "3 hours",
    difficulty: "advanced" as const,
    instructorName: "PARACELSUS AI",
    instructorTitle: "Colloid Science Training",
    hasQuiz: true,
    isInteractive: true,
    sections: [
      {
        title: "Zeta Potential and Blood Colloid Science",
        content: `Understanding Blood as a Colloidal System:

Blood is a colloidal suspension — particles (cells) suspended in a liquid medium (plasma). The stability of this suspension depends on the electrical charge on cell surfaces, known as the zeta potential.

Zeta Potential Explained:
- Blood cells carry a negative surface charge (from sialic acid on glycocalyx)
- This negative charge creates an electrical double layer around each cell
- Like charges repel — keeping cells separated in a dispersed, free-flowing state
- The zeta potential is the measured electrical potential at the slip plane of this double layer
- Healthy zeta potential: -15 to -20 millivolts or more (more negative = better dispersion)

When Zeta Potential Decreases:
- Cells lose negative surface charge
- Repulsive forces weaken
- Cells begin aggregating (rouleaux, sludging)
- Blood viscosity increases
- Microcirculation compromised
- Oxygen delivery impaired

Factors That Reduce Zeta Potential:
1. Dehydration: Concentrated plasma proteins neutralize surface charge
2. Acidosis: Excess H+ ions neutralize negative charge
3. Cationic minerals: Aluminum, excess iron, excess calcium overwhelm surface charge
4. Inflammatory proteins: Elevated fibrinogen, immunoglobulins bridge cells together
5. Toxic metals: Heavy metals disrupt glycocalyx and surface chemistry
6. Processed foods: High sodium, additives, trans fats affect membrane composition

Factors That Improve Zeta Potential:
1. Adequate hydration: Dilutes plasma proteins, supports surface charge
2. Alkaline minerals: Potassium, magnesium support negative charge
3. Essential fatty acids: Maintain membrane fluidity and charge
4. Antioxidants: Protect membrane lipids from oxidation
5. Reducing toxic exposure: Eliminate charge-neutralizing toxins
6. Exercise: Improves circulation and cellular health

Clinical Implications:
- Cardiovascular disease: Reduced zeta potential correlates with atherosclerosis risk
- Stroke risk: Blood sludging impairs cerebral microcirculation
- Peripheral neuropathy: Microcirculation compromise in extremities
- Cognitive decline: Brain depends on optimal microcirculation
- Wound healing: Reduced delivery of oxygen and nutrients to tissues

Assessment in LBA:
Grade zeta potential by rouleaux/aggregation severity:
- Grade 0: No aggregation, free-flowing cells (excellent zeta potential)
- Grade 1: Mild rouleaux, 2-4 cell stacks (adequate zeta potential)
- Grade 2: Moderate rouleaux, 5-10 cell stacks (reduced zeta potential)
- Grade 3: Heavy rouleaux/sludging, >10 cell stacks (poor zeta potential)
- Grade 4: Near-complete aggregation (critical zeta potential loss)`,
      },
    ],
    keyPoints: [
      "Blood is a colloidal suspension maintained by negative surface charge (zeta potential) on cells",
      "Healthy zeta potential keeps cells dispersed; reduced zeta potential causes aggregation",
      "Dehydration, acidosis, cationic minerals, and inflammatory proteins reduce zeta potential",
      "Hydration, alkaline minerals, EFAs, and antioxidants improve zeta potential",
      "LBA aggregation grading (0-4) provides visual zeta potential assessment",
      "Reduced zeta potential correlates with cardiovascular, neurological, and microcirculation risk",
    ],
  },
  {
    id: "lba-mod-16",
    title: "Parasitology in Blood",
    slug: "lba-parasitology",
    description: "Identifying parasitic organisms in live blood including protozoa, helminth fragments, and parasitic indicators. Conventional and pleomorphic perspectives.",
    category: "lba-certification",
    sortOrder: 16,
    duration: "4 hours",
    difficulty: "advanced" as const,
    instructorName: "HIPPOCRATES AI",
    instructorTitle: "Parasitology Training",
    hasQuiz: true,
    isInteractive: true,
    sections: [
      {
        title: "Blood Parasitology for LBA Practitioners",
        content: `Parasitology in Live Blood Analysis:

Conventional Blood Parasites:
Certain parasites are directly visible in blood specimens:
1. Plasmodium species (malaria): Ring forms, trophozoites, gametocytes within RBCs
2. Babesia: Ring forms, Maltese cross tetrads within RBCs
3. Trypanosoma: Motile flagellated forms in plasma
4. Microfilaria: Long, motile worms in blood (Wuchereria, Brugia, Loa loa)
5. Borrelia (spirochetes): Corkscrew-shaped, motile in dark field

Signs of Parasitic Involvement in LBA (Indirect Indicators):
Even when parasites are not directly visualized, LBA can reveal signs suggesting parasitic burden:
- Elevated eosinophils (WBC differential estimation)
- Specific debris patterns in plasma
- RBC morphology changes consistent with parasitic infection
- Inflammatory patterns correlating with parasitic immune response
- Cyclical pattern variations (parasites often have life cycle rhythms)

Pleomorphic Perspective on Parasitism:
In the pleomorphic/Enderlein framework, the concept of parasitism extends beyond external organisms:
- Endobiont organisms shifting from symbiotic to parasitic phases
- The internal terrain determining whether organisms behave as symbionts or parasites
- The cyclogeny stages representing different levels of parasitic behavior
- Treatment focusing on terrain correction rather than solely organism elimination

Practical Identification Tips:
- Use both dark field and phase contrast when available
- Observe at multiple magnifications (40x for overview, 100x for detail)
- Note motility patterns — parasites have characteristic movement
- Document with photographs and video when possible
- Correlate with member history (travel, exposure, symptoms)
- Confirm with conventional parasitology testing when indicated

Full Moon Observation Note:
Many LBA practitioners note increased parasitic activity around the full moon. While not conventionally validated, documenting timing of observations in relation to lunar cycle is part of comprehensive LBA practice within the PMA framework.`,
      },
    ],
    keyPoints: [
      "Blood parasites (malaria, Babesia, Trypanosoma, spirochetes) may be directly visualized in LBA",
      "Indirect parasitic indicators include elevated eosinophils, specific debris patterns, and inflammatory signs",
      "The pleomorphic perspective views endobiont organisms shifting to parasitic behavior based on terrain",
      "Use multiple magnifications and both dark field and phase contrast for parasite identification",
      "Always confirm significant parasitic findings with conventional parasitology testing",
      "Treatment includes both direct anti-parasitic approaches and terrain correction",
    ],
  },
  {
    id: "lba-mod-17",
    title: "Practice Management, Legal & PMA Compliance",
    slug: "lba-practice-management",
    description: "Legal framework for LBA practice within a PMA, CLIA compliance considerations, documentation standards, member communication, and business practices.",
    category: "lba-certification",
    sortOrder: 17,
    duration: "3 hours",
    difficulty: "beginner" as const,
    instructorName: "SYNTHESIS AI",
    instructorTitle: "Compliance Training",
    hasQuiz: true,
    isInteractive: true,
    sections: [
      {
        title: "Practice Management and Legal Framework",
        content: `Legal Framework for LBA Practice:

Private Member Association (PMA) Context:
LBA within the FFPMA operates under the PMA legal framework:
- Member-to-member health sharing and education
- Private contract protections between members
- Not subject to FDA/medical board oversight when properly structured
- Members voluntarily join and consent to services
- All services are educational, not diagnostic or prescriptive

Scope of Practice:
- LBA is presented as an educational assessment tool
- Findings are "observations" not "diagnoses"
- Recommendations are "educational suggestions" not "prescriptions"
- Always document that members understand this distinction
- Never claim to diagnose, treat, cure, or prevent disease

CLIA Considerations:
- Clinical Laboratory Improvement Amendments (CLIA) regulate clinical labs
- LBA within a PMA context may fall outside CLIA scope
- However, practitioners should understand CLIA requirements
- If operating outside PMA: CLIA waiver or certification may be required
- Consult with legal counsel regarding specific jurisdictional requirements

Documentation Standards:
- Member consent form signed before every session
- Standardized observation reports using consistent terminology
- HIPAA-compliant storage of all member images and records
- Before/after comparison documentation
- Time and date stamps on all records
- Secure backup of all digital records

Member Communication Best Practices:
- Explain what LBA is AND what it is not before each session
- Use educational language, not diagnostic language
- Show members their own blood as a teaching tool
- Document member understanding and consent
- Provide written educational materials to accompany verbal explanations
- Follow up with actionable educational suggestions

Business Practices:
- Set clear session pricing and package options
- Define session duration and what is included
- Maintain professional liability considerations
- Build referral network with complementary practitioners
- Continue education to stay current with developments
- Participate in PMA community and events`,
      },
    ],
    keyPoints: [
      "LBA within FFPMA operates under PMA legal framework with member-to-member protections",
      "Present LBA as educational assessment — never claim to diagnose, treat, cure, or prevent",
      "Use observation language, not diagnostic language in all documentation",
      "Member consent must be obtained and documented before every session",
      "Understand CLIA requirements even when operating within PMA context",
      "HIPAA-compliant storage and documentation standards must be maintained",
    ],
  },
];

const LBA_QUIZ_DATA: Array<{
  moduleId: string;
  quizId: string;
  title: string;
  slug: string;
  description: string;
  questions: Array<{
    id: string;
    text: string;
    explanation: string;
    answers: Array<{ text: string; isCorrect: boolean }>;
  }>;
}> = [
  {
    moduleId: "lba-mod-01",
    quizId: "quiz-lba-01",
    title: "LBA Foundations Quiz",
    slug: "lba-foundations-quiz",
    description: "Test your knowledge of LBA history, scientific basis, and equipment.",
    questions: [
      { id: "q-lba01-01", text: "Who proposed the pleomorphism theory that forms the basis of LBA?", explanation: "Antoine Bechamp (1816-1908) proposed that microzymes could evolve into different forms based on the host terrain, a concept known as pleomorphism.", answers: [{ text: "Antoine Bechamp", isCorrect: true }, { text: "Louis Pasteur", isCorrect: false }, { text: "Robert Koch", isCorrect: false }, { text: "Joseph Lister", isCorrect: false }] },
      { id: "q-lba01-02", text: "What does pleomorphism mean?", explanation: "Pleomorphism means 'multiple forms' or 'richness of forms' — the ability of microorganisms to change form based on environmental conditions.", answers: [{ text: "Multiple forms or richness of forms", isCorrect: true }, { text: "Single fixed form", isCorrect: false }, { text: "Cell division", isCorrect: false }, { text: "Genetic mutation", isCorrect: false }] },
      { id: "q-lba01-03", text: "What minimum magnification is required for LBA microscopy?", explanation: "A minimum of 1000x magnification with oil immersion is required for proper dark field LBA examination.", answers: [{ text: "1000x", isCorrect: true }, { text: "400x", isCorrect: false }, { text: "100x", isCorrect: false }, { text: "10,000x", isCorrect: false }] },
      { id: "q-lba01-04", text: "Who developed the comprehensive theory of cyclogeny?", explanation: "Gunther Enderlein (1872-1968) developed the comprehensive theory of cyclogeny — the developmental cycle of microorganisms from protits through bacteria to fungi.", answers: [{ text: "Gunther Enderlein", isCorrect: true }, { text: "Antoine Bechamp", isCorrect: false }, { text: "Gaston Naessens", isCorrect: false }, { text: "Claude Bernard", isCorrect: false }] },
      { id: "q-lba01-05", text: "What type of microscopy is primarily used for LBA?", explanation: "Dark field microscopy is the primary technique, illuminating specimens against a dark background to reveal structures invisible in bright field.", answers: [{ text: "Dark field microscopy", isCorrect: true }, { text: "Electron microscopy", isCorrect: false }, { text: "Fluorescence microscopy", isCorrect: false }, { text: "Confocal microscopy", isCorrect: false }] },
      { id: "q-lba01-06", text: "How does LBA differ from conventional hematology?", explanation: "LBA examines fresh, unfixed, unstained blood in dark field, providing qualitative morphological and dynamic assessment versus conventional dried, stained, quantitative analysis.", answers: [{ text: "Uses fresh, unstained blood in dark field for qualitative assessment", isCorrect: true }, { text: "Uses the same techniques but different equipment", isCorrect: false }, { text: "Only examines plasma, not cells", isCorrect: false }, { text: "Requires automated analyzers", isCorrect: false }] },
      { id: "q-lba01-07", text: "What is the terrain theory in the context of LBA?", explanation: "Terrain theory holds that the body's internal environment (pH, oxidation-reduction potential, mineral balance) determines health and microbial behavior, rather than specific pathogens alone.", answers: [{ text: "Internal environment determines health and microbial behavior", isCorrect: true }, { text: "Specific germs cause specific diseases", isCorrect: false }, { text: "Blood type determines disease risk", isCorrect: false }, { text: "Genetics alone determine health outcomes", isCorrect: false }] },
      { id: "q-lba01-08", text: "What lancet depth is recommended for LBA sample collection?", explanation: "A 2.4mm depth sterile lancet is recommended for finger prick blood collection in LBA.", answers: [{ text: "2.4mm", isCorrect: true }, { text: "1.0mm", isCorrect: false }, { text: "5.0mm", isCorrect: false }, { text: "0.5mm", isCorrect: false }] },
      { id: "q-lba01-09", text: "Which observation is LBA best suited to provide?", explanation: "LBA provides real-time qualitative morphological and dynamic assessment of living blood cells — complementary to quantitative lab testing.", answers: [{ text: "Real-time qualitative morphological assessment", isCorrect: true }, { text: "Precise cell counts", isCorrect: false }, { text: "Genetic analysis", isCorrect: false }, { text: "Hormone level measurement", isCorrect: false }] },
      { id: "q-lba01-10", text: "What camera feature is recommended for LBA documentation?", explanation: "A trinocular microscope head allows camera attachment for live video feed and image capture, essential for documentation and member education.", answers: [{ text: "Trinocular head with live video capability", isCorrect: true }, { text: "Smartphone attachment only", isCorrect: false }, { text: "Sketch pad for drawings", isCorrect: false }, { text: "Audio recording device", isCorrect: false }] },
    ],
  },
  {
    moduleId: "lba-mod-02",
    quizId: "quiz-lba-02",
    title: "Dark Field Microscopy Quiz",
    slug: "lba-dark-field-quiz",
    description: "Test your mastery of dark field microscopy techniques.",
    questions: [
      { id: "q-lba02-01", text: "How does dark field microscopy create contrast?", explanation: "Dark field blocks direct light from reaching the objective — only light scattered by the specimen enters, creating bright objects on a dark background.", answers: [{ text: "Blocks direct light; only scattered light enters the objective", isCorrect: true }, { text: "Uses fluorescent dyes", isCorrect: false }, { text: "Stains specimens with heavy metals", isCorrect: false }, { text: "Uses laser illumination", isCorrect: false }] },
      { id: "q-lba02-02", text: "What is the purpose of Kohler illumination?", explanation: "Kohler illumination provides even, optimal illumination by properly aligning the light path, condenser, and field diaphragm for consistent imaging.", answers: [{ text: "Provides even, optimal illumination for consistent imaging", isCorrect: true }, { text: "Creates fluorescence", isCorrect: false }, { text: "Increases magnification", isCorrect: false }, { text: "Reduces vibration", isCorrect: false }] },
      { id: "q-lba02-03", text: "Why is the first blood drop wiped away during collection?", explanation: "The first drop contains tissue fluid that dilutes the sample and can create artifacts, so it is wiped away before collecting the actual sample.", answers: [{ text: "Contains tissue fluid that creates artifacts", isCorrect: true }, { text: "Contains too many platelets", isCorrect: false }, { text: "Is contaminated by alcohol", isCorrect: false }, { text: "Has too high a temperature", isCorrect: false }] },
      { id: "q-lba02-04", text: "What is the optimal observation window for a live blood sample?", explanation: "Blood begins changing immediately upon leaving the body. The optimal window is 15-20 minutes, after which artifacts increase significantly.", answers: [{ text: "15-20 minutes", isCorrect: true }, { text: "1 hour", isCorrect: false }, { text: "5 minutes", isCorrect: false }, { text: "45 minutes", isCorrect: false }] },
      { id: "q-lba02-05", text: "How many zones does the FFPMA systematic observation method use?", explanation: "The FFPMA 5-Zone Protocol provides structured observation: Center Field, Peripheral Scan, Plasma Quality, Cell-to-Cell Interaction, and Dynamic Assessment.", answers: [{ text: "5 zones", isCorrect: true }, { text: "3 zones", isCorrect: false }, { text: "8 zones", isCorrect: false }, { text: "10 zones", isCorrect: false }] },
      { id: "q-lba02-06", text: "What type of oil should be used for dark field oil immersion?", explanation: "Type A immersion oil is specifically designed for dark field microscopy and should be applied to both the condenser top and the slide.", answers: [{ text: "Type A immersion oil", isCorrect: true }, { text: "Mineral oil", isCorrect: false }, { text: "Olive oil", isCorrect: false }, { text: "Any clear oil", isCorrect: false }] },
      { id: "q-lba02-07", text: "What happens if alcohol is not fully dry before lancet prick?", explanation: "Residual alcohol on the finger can enter the blood sample and cause echinocyte artifact — RBCs become spiky due to alcohol exposure.", answers: [{ text: "Causes echinocyte artifact", isCorrect: true }, { text: "Prevents coagulation", isCorrect: false }, { text: "Kills white blood cells", isCorrect: false }, { text: "Makes blood too thin", isCorrect: false }] },
      { id: "q-lba02-08", text: "At what angle should the coverslip be applied?", explanation: "Applying the coverslip at a 45-degree angle helps prevent air bubbles from being trapped under the glass.", answers: [{ text: "45 degrees", isCorrect: true }, { text: "90 degrees (straight down)", isCorrect: false }, { text: "10 degrees", isCorrect: false }, { text: "Flat (0 degrees)", isCorrect: false }] },
      { id: "q-lba02-09", text: "What does Zone 5 of the FFPMA protocol assess?", explanation: "Zone 5 (Dynamic Assessment) evaluates cell movement, WBC activity, phagocytic activity, time-lapse changes, and vitality scoring.", answers: [{ text: "Dynamic assessment — movement, activity, time-lapse changes", isCorrect: true }, { text: "Cell counting", isCorrect: false }, { text: "Crystal identification", isCorrect: false }, { text: "Platelet distribution", isCorrect: false }] },
      { id: "q-lba02-10", text: "Why should you NOT squeeze the finger during blood collection?", explanation: "Squeezing introduces tissue fluid into the sample, diluting the blood and potentially creating artifacts that mimic pathological findings.", answers: [{ text: "Introduces tissue fluid that creates artifacts", isCorrect: true }, { text: "Causes pain", isCorrect: false }, { text: "Produces too much blood", isCorrect: false }, { text: "Breaks red blood cells", isCorrect: false }] },
    ],
  },
  {
    moduleId: "lba-mod-03",
    quizId: "quiz-lba-03",
    title: "RBC Analysis Quiz",
    slug: "lba-rbc-quiz",
    description: "Test your knowledge of red blood cell analysis in LBA.",
    questions: [
      { id: "q-lba03-01", text: "What is the normal diameter of a red blood cell?", explanation: "Normal RBCs are 7-8 micrometers in diameter, which serves as an internal size reference when examining blood samples.", answers: [{ text: "7-8 micrometers", isCorrect: true }, { text: "2-4 micrometers", isCorrect: false }, { text: "15-20 micrometers", isCorrect: false }, { text: "50-100 micrometers", isCorrect: false }] },
      { id: "q-lba03-02", text: "What is rouleaux formation?", explanation: "Rouleaux formation is when RBCs stack like coins in rolls due to elevated plasma proteins (fibrinogen, immunoglobulins), indicating inflammation or reduced zeta potential.", answers: [{ text: "RBCs stacked like coins due to elevated plasma proteins", isCorrect: true }, { text: "RBCs forming irregular clumps", isCorrect: false }, { text: "RBCs becoming spiky", isCorrect: false }, { text: "RBCs changing color", isCorrect: false }] },
      { id: "q-lba03-03", text: "What distinguishes echinocytes from acanthocytes?", explanation: "Echinocytes have evenly distributed, regular spicules (10-30). Acanthocytes have irregular, unevenly distributed spicules (3-12) of variable length.", answers: [{ text: "Echinocytes: regular, even spicules; Acanthocytes: irregular, uneven spicules", isCorrect: true }, { text: "Size difference only", isCorrect: false }, { text: "Color difference", isCorrect: false }, { text: "They are the same finding", isCorrect: false }] },
      { id: "q-lba03-04", text: "What causes echinocyte formation?", explanation: "Echinocytes are caused by oxidative stress and fatty acid imbalance affecting the RBC membrane lipid bilayer, as well as uremia and liver stress.", answers: [{ text: "Oxidative stress and fatty acid imbalance", isCorrect: true }, { text: "Genetic mutation", isCorrect: false }, { text: "Bacterial infection", isCorrect: false }, { text: "Dehydration alone", isCorrect: false }] },
      { id: "q-lba03-05", text: "What does a bulls-eye pattern in an RBC indicate?", explanation: "A bulls-eye pattern indicates target cells (codocytes), associated with liver disease, hemoglobinopathies, and iron deficiency.", answers: [{ text: "Target cells associated with liver disease or hemoglobinopathies", isCorrect: true }, { text: "Normal variant", isCorrect: false }, { text: "Parasitic infection", isCorrect: false }, { text: "Vitamin B12 deficiency", isCorrect: false }] },
      { id: "q-lba03-06", text: "What vitality score range indicates 'Poor' RBC health?", explanation: "A vitality score of 3-4 indicates poor RBC health with significant morphological abnormalities, heavy rouleaux, and multiple types of abnormal cells.", answers: [{ text: "3-4", isCorrect: true }, { text: "7-8", isCorrect: false }, { text: "1-2", isCorrect: false }, { text: "9-10", isCorrect: false }] },
      { id: "q-lba03-07", text: "What does microcytosis indicate?", explanation: "Microcytic RBCs (<7 micrometers) most commonly indicate iron deficiency anemia or thalassemia.", answers: [{ text: "Iron deficiency or thalassemia", isCorrect: true }, { text: "B12 deficiency", isCorrect: false }, { text: "Dehydration", isCorrect: false }, { text: "Normal aging", isCorrect: false }] },
      { id: "q-lba03-08", text: "What is the significance of RBC membrane flexibility?", explanation: "Flexible membranes indicate healthy RBCs. Stiff membranes suggest oxidative damage to the lipid bilayer, reducing oxygen delivery capability.", answers: [{ text: "Reflects membrane health — stiff membranes indicate oxidative damage", isCorrect: true }, { text: "Has no clinical significance", isCorrect: false }, { text: "Only relevant in sickle cell disease", isCorrect: false }, { text: "Indicates immune function", isCorrect: false }] },
      { id: "q-lba03-09", text: "What does the rouleaux formation indicate about zeta potential?", explanation: "Rouleaux formation indicates reduced zeta potential — the cells have lost sufficient negative surface charge to maintain colloidal repulsion.", answers: [{ text: "Reduced zeta potential and loss of surface charge", isCorrect: true }, { text: "Increased zeta potential", isCorrect: false }, { text: "Normal zeta potential with infection", isCorrect: false }, { text: "Zeta potential is not related to rouleaux", isCorrect: false }] },
      { id: "q-lba03-10", text: "At how many time points should vitality be documented?", explanation: "Vitality score should be documented at 0, 5, 10, 15, and 20 minutes to assess the rate of blood deterioration over time.", answers: [{ text: "5 time points (0, 5, 10, 15, 20 minutes)", isCorrect: true }, { text: "1 time point only", isCorrect: false }, { text: "3 time points", isCorrect: false }, { text: "Every minute for 30 minutes", isCorrect: false }] },
    ],
  },
  {
    moduleId: "lba-mod-04",
    quizId: "quiz-lba-04",
    title: "WBC Analysis Quiz",
    slug: "lba-wbc-quiz",
    description: "Test your knowledge of white blood cell analysis in LBA.",
    questions: [
      { id: "q-lba04-01", text: "Which WBC type is the most abundant in normal blood?", explanation: "Neutrophils make up 50-70% of all white blood cells and are the first responders to bacterial infection.", answers: [{ text: "Neutrophils (50-70%)", isCorrect: true }, { text: "Lymphocytes", isCorrect: false }, { text: "Monocytes", isCorrect: false }, { text: "Eosinophils", isCorrect: false }] },
      { id: "q-lba04-02", text: "What does sluggish WBC movement indicate?", explanation: "Sluggish WBC movement indicates immune suppression or exhaustion, meaning the immune system is not functioning optimally.", answers: [{ text: "Immune suppression or exhaustion", isCorrect: true }, { text: "Normal resting state", isCorrect: false }, { text: "Acute infection", isCorrect: false }, { text: "Allergic reaction", isCorrect: false }] },
      { id: "q-lba04-03", text: "Which WBC type is elevated in parasitic infections?", explanation: "Eosinophils are elevated in parasitic infections and allergic conditions, making them important markers in LBA.", answers: [{ text: "Eosinophils", isCorrect: true }, { text: "Neutrophils", isCorrect: false }, { text: "Basophils", isCorrect: false }, { text: "Lymphocytes", isCorrect: false }] },
      { id: "q-lba04-04", text: "What can be directly observed regarding WBC function in LBA?", explanation: "Phagocytic activity — the engulfment and processing of debris or organisms by WBCs — can be directly observed in live blood.", answers: [{ text: "Phagocytic activity", isCorrect: true }, { text: "Antibody production", isCorrect: false }, { text: "DNA replication", isCorrect: false }, { text: "Cytokine levels", isCorrect: false }] },
      { id: "q-lba04-05", text: "Which WBC type becomes a macrophage in tissues?", explanation: "Monocytes, the largest WBCs, become macrophages when they leave the bloodstream and enter tissues.", answers: [{ text: "Monocytes", isCorrect: true }, { text: "Neutrophils", isCorrect: false }, { text: "Lymphocytes", isCorrect: false }, { text: "Basophils", isCorrect: false }] },
      { id: "q-lba04-06", text: "What characterizes chronic inflammation in LBA?", explanation: "Chronic inflammation shows sluggish WBCs, background debris, persistent fibrin, and moderate rouleaux, indicating long-term immune challenge.", answers: [{ text: "Sluggish WBCs, debris, persistent fibrin, moderate rouleaux", isCorrect: true }, { text: "Hyperactive WBCs with fresh fibrin", isCorrect: false }, { text: "No visible WBCs", isCorrect: false }, { text: "Only platelet changes", isCorrect: false }] },
      { id: "q-lba04-07", text: "What is the WBC activity score range?", explanation: "WBC activity is scored on a 1-5 scale: 1 = minimal activity, 5 = hyperactive.", answers: [{ text: "1-5", isCorrect: true }, { text: "1-10", isCorrect: false }, { text: "A-F", isCorrect: false }, { text: "1-100", isCorrect: false }] },
      { id: "q-lba04-08", text: "What does acute inflammation look like in LBA?", explanation: "Acute inflammation shows hyperactive WBCs, fresh fibrin formation, and increased WBC numbers, indicating an active immune response.", answers: [{ text: "Hyperactive WBCs, fresh fibrin, increased WBC numbers", isCorrect: true }, { text: "No WBC activity", isCorrect: false }, { text: "Crystal formations", isCorrect: false }, { text: "Only RBC changes", isCorrect: false }] },
      { id: "q-lba04-09", text: "Which WBC type is responsible for adaptive immunity?", explanation: "Lymphocytes (T-cells and B-cells) are responsible for adaptive immunity, including antibody production and cellular immune responses.", answers: [{ text: "Lymphocytes", isCorrect: true }, { text: "Neutrophils", isCorrect: false }, { text: "Monocytes", isCorrect: false }, { text: "Eosinophils", isCorrect: false }] },
      { id: "q-lba04-10", text: "What indicates hypersegmented neutrophils in LBA?", explanation: "Neutrophils with 6 or more nuclear lobes indicate hypersegmentation, an early marker of B12 or folate deficiency.", answers: [{ text: "6 or more nuclear lobes indicating B12/folate deficiency", isCorrect: true }, { text: "No nuclear lobes", isCorrect: false }, { text: "Excessive granulation", isCorrect: false }, { text: "Small cell size", isCorrect: false }] },
    ],
  },
  {
    moduleId: "lba-mod-05",
    quizId: "quiz-lba-05",
    title: "Plasma Analysis Quiz",
    slug: "lba-plasma-quiz",
    description: "Test your knowledge of plasma analysis in LBA.",
    questions: [
      { id: "q-lba05-01", text: "What does excessive fibrin activity in plasma indicate?", explanation: "Excessive fibrin spicules and strands indicate activation of the coagulation cascade, suggesting liver stress, inflammation, and cardiovascular risk.", answers: [{ text: "Liver stress, inflammation, cardiovascular risk", isCorrect: true }, { text: "Healthy coagulation", isCorrect: false }, { text: "Dehydration only", isCorrect: false }, { text: "Parasitic infection", isCorrect: false }] },
      { id: "q-lba05-02", text: "What crystal shape is associated with gout?", explanation: "Needle-shaped (acicular) crystals in blood are associated with uric acid and gout/kidney stress.", answers: [{ text: "Needle-shaped crystals", isCorrect: true }, { text: "Plate-shaped crystals", isCorrect: false }, { text: "Cubic crystals", isCorrect: false }, { text: "Star-shaped crystals", isCorrect: false }] },
      { id: "q-lba05-03", text: "What are chylomicrons in LBA?", explanation: "Chylomicrons are fat globules visible in plasma after a recent meal, which is why fasting samples are essential for accurate assessment.", answers: [{ text: "Fat globules visible after recent meal", isCorrect: true }, { text: "White blood cell fragments", isCorrect: false }, { text: "Bacterial colonies", isCorrect: false }, { text: "Crystal formations", isCorrect: false }] },
      { id: "q-lba05-04", text: "What does background 'snow' in plasma suggest?", explanation: "Background 'snow' or particulate debris in plasma indicates toxic burden or digestive insufficiency with circulating unprocessed material.", answers: [{ text: "Toxic burden or digestive insufficiency", isCorrect: true }, { text: "Normal finding", isCorrect: false }, { text: "Equipment malfunction", isCorrect: false }, { text: "Healthy immune activity", isCorrect: false }] },
      { id: "q-lba05-05", text: "How is fibrin severity graded?", explanation: "Fibrin is graded as mild (occasional spicules), moderate (multiple strands/small networks), or severe (extensive networks entrapping cells).", answers: [{ text: "Mild, moderate, severe based on extent and complexity", isCorrect: true }, { text: "Numerical score 1-100", isCorrect: false }, { text: "By color intensity", isCorrect: false }, { text: "By crystal content", isCorrect: false }] },
      { id: "q-lba05-06", text: "What nutritional approach addresses excessive fibrin?", explanation: "Proteolytic enzymes like nattokinase, serrapeptase, and bromelain help break down excessive fibrin and support healthy coagulation.", answers: [{ text: "Proteolytic enzymes (nattokinase, serrapeptase, bromelain)", isCorrect: true }, { text: "Vitamin C only", isCorrect: false }, { text: "Iron supplementation", isCorrect: false }, { text: "Calcium supplementation", isCorrect: false }] },
      { id: "q-lba05-07", text: "What shape are cholesterol crystals?", explanation: "Cholesterol crystals appear as plate-like, rhomboid structures in plasma, indicating lipid metabolism dysfunction.", answers: [{ text: "Plate-like, rhomboid", isCorrect: true }, { text: "Needle-shaped", isCorrect: false }, { text: "Spherical", isCorrect: false }, { text: "Star-shaped", isCorrect: false }] },
      { id: "q-lba05-08", text: "Why are fasting samples important for plasma analysis?", explanation: "Fasting eliminates chylomicrons (fat globules from recent meals) that would cloud plasma and confuse interpretation.", answers: [{ text: "Eliminates chylomicrons from recent meals", isCorrect: true }, { text: "Makes blood flow faster", isCorrect: false }, { text: "Increases white blood cell count", isCorrect: false }, { text: "Has no real benefit", isCorrect: false }] },
      { id: "q-lba05-09", text: "What does healthy plasma look like in dark field?", explanation: "Healthy plasma appears clear with minimal debris, no excessive fibrin, no crystals, and no visible microbial forms beyond normal protit activity.", answers: [{ text: "Clear, minimal debris, no excessive fibrin or crystals", isCorrect: true }, { text: "Cloudy with many particles", isCorrect: false }, { text: "Bright yellow", isCorrect: false }, { text: "Contains visible organisms", isCorrect: false }] },
      { id: "q-lba05-10", text: "What does plasma quality primarily reflect?", explanation: "Plasma quality reflects liver function, inflammatory status, and metabolic health, as the liver produces most plasma proteins.", answers: [{ text: "Liver function, inflammatory status, metabolic health", isCorrect: true }, { text: "Kidney function only", isCorrect: false }, { text: "Lung function", isCorrect: false }, { text: "Heart function only", isCorrect: false }] },
    ],
  },
  {
    moduleId: "lba-mod-06",
    quizId: "quiz-lba-06",
    title: "Platelet Assessment Quiz",
    slug: "lba-platelet-quiz",
    description: "Test your knowledge of platelet assessment in LBA.",
    questions: [
      { id: "q-lba06-01", text: "What is the normal size of platelets?", explanation: "Normal platelets are 2-4 micrometers, making them the smallest formed elements in blood.", answers: [{ text: "2-4 micrometers", isCorrect: true }, { text: "7-8 micrometers", isCorrect: false }, { text: "10-15 micrometers", isCorrect: false }, { text: "0.1-0.5 micrometers", isCorrect: false }] },
      { id: "q-lba06-02", text: "What does excessive platelet aggregation suggest?", explanation: "Excessive platelet clumping indicates increased clotting tendency and potential cardiovascular risk.", answers: [{ text: "Increased clotting tendency and cardiovascular risk", isCorrect: true }, { text: "Immune activation", isCorrect: false }, { text: "Nutritional deficiency", isCorrect: false }, { text: "Normal finding", isCorrect: false }] },
      { id: "q-lba06-03", text: "What might giant platelets indicate?", explanation: "Giant platelets (approaching RBC size) may indicate myeloproliferative disorders or rapid platelet turnover.", answers: [{ text: "Myeloproliferative disorders or rapid turnover", isCorrect: true }, { text: "Iron deficiency", isCorrect: false }, { text: "Normal variant", isCorrect: false }, { text: "Dehydration", isCorrect: false }] },
      { id: "q-lba06-04", text: "What does platelet-fibrin interaction reveal?", explanation: "Platelets enmeshed in fibrin strands indicate coagulation cascade activation, correlating with cardiovascular and inflammatory risk.", answers: [{ text: "Coagulation cascade activation", isCorrect: true }, { text: "Normal platelet function", isCorrect: false }, { text: "Immune response", isCorrect: false }, { text: "Nutritional status", isCorrect: false }] },
      { id: "q-lba06-05", text: "What is the normal distribution of platelets in LBA?", explanation: "Normal platelets should be scattered evenly throughout the field, not clumped together.", answers: [{ text: "Scattered evenly, not clumped", isCorrect: true }, { text: "All concentrated in one area", isCorrect: false }, { text: "Attached to red blood cells", isCorrect: false }, { text: "Invisible in dark field", isCorrect: false }] },
      { id: "q-lba06-06", text: "How do platelets appear in dark field microscopy?", explanation: "Platelets appear as tiny bright dots in dark field microscopy, much smaller than RBCs.", answers: [{ text: "Tiny bright dots, much smaller than RBCs", isCorrect: true }, { text: "Large dark circles", isCorrect: false }, { text: "Invisible — they cannot be seen", isCorrect: false }, { text: "Same size as RBCs", isCorrect: false }] },
      { id: "q-lba06-07", text: "What artifact can mimic platelet clumping in drawn blood?", explanation: "EDTA-induced pseudothrombocytopenia causes platelet clumping in drawn blood, but this artifact is not seen in finger-prick LBA samples.", answers: [{ text: "EDTA-induced pseudothrombocytopenia", isCorrect: true }, { text: "Temperature changes", isCorrect: false }, { text: "Light exposure", isCorrect: false }, { text: "Slide contamination", isCorrect: false }] },
      { id: "q-lba06-08", text: "Can LBA replace a CBC for platelet counting?", explanation: "LBA provides qualitative platelet assessment but does not replace CBC for precise quantitative platelet counts.", answers: [{ text: "No — LBA is qualitative, not a substitute for CBC counts", isCorrect: true }, { text: "Yes — LBA is more accurate", isCorrect: false }, { text: "Yes — if done by experienced practitioner", isCorrect: false }, { text: "Platelet counting is unnecessary", isCorrect: false }] },
      { id: "q-lba06-09", text: "What do very few visible platelets suggest?", explanation: "Very few visible platelets may indicate thrombocytopenia, which should be confirmed with a CBC.", answers: [{ text: "Possible thrombocytopenia — confirm with CBC", isCorrect: true }, { text: "Healthy blood", isCorrect: false }, { text: "Equipment malfunction", isCorrect: false }, { text: "Normal variation", isCorrect: false }] },
      { id: "q-lba06-10", text: "What is the relationship between platelets and coagulation?", explanation: "Platelets work with fibrin to form clots. Their behavior in LBA, combined with fibrin observations, provides a comprehensive coagulation assessment.", answers: [{ text: "Platelets and fibrin work together to form clots", isCorrect: true }, { text: "Platelets prevent clotting", isCorrect: false }, { text: "They are unrelated", isCorrect: false }, { text: "Platelets only function outside blood vessels", isCorrect: false }] },
    ],
  },
  {
    moduleId: "lba-mod-07",
    quizId: "quiz-lba-07",
    title: "Clinical Correlation Quiz",
    slug: "lba-clinical-quiz",
    description: "Test your pattern recognition and clinical correlation skills.",
    questions: [
      { id: "q-lba07-01", text: "What LBA pattern indicates oxidative stress?", explanation: "Echinocytes + background debris + fibrin activity indicates oxidative stress with membrane lipid peroxidation.", answers: [{ text: "Echinocytes + debris + fibrin activity", isCorrect: true }, { text: "Rouleaux only", isCorrect: false }, { text: "Large WBCs", isCorrect: false }, { text: "Clear plasma", isCorrect: false }] },
      { id: "q-lba07-02", text: "What characterizes the digestive dysfunction pattern?", explanation: "Undigested particles + bacterial forms + chylomicrons in a fasting sample indicate digestive dysfunction.", answers: [{ text: "Undigested particles + bacterial forms + fasting chylomicrons", isCorrect: true }, { text: "Only rouleaux", isCorrect: false }, { text: "Crystal formations alone", isCorrect: false }, { text: "Active WBCs", isCorrect: false }] },
      { id: "q-lba07-03", text: "Should LBA findings be correlated with conventional testing?", explanation: "Yes — LBA findings should always be correlated with conventional laboratory testing for comprehensive assessment.", answers: [{ text: "Yes — always correlate with conventional lab testing", isCorrect: true }, { text: "No — LBA is sufficient alone", isCorrect: false }, { text: "Only when abnormalities are found", isCorrect: false }, { text: "Only for serious conditions", isCorrect: false }] },
      { id: "q-lba07-04", text: "What conventional test correlates best with rouleaux findings?", explanation: "ESR (erythrocyte sedimentation rate) and CRP directly correlate with the inflammatory markers that cause rouleaux formation.", answers: [{ text: "ESR and CRP", isCorrect: true }, { text: "Hemoglobin A1c", isCorrect: false }, { text: "Thyroid function", isCorrect: false }, { text: "Vitamin D level", isCorrect: false }] },
      { id: "q-lba07-05", text: "What does the dehydration pattern look like in LBA?", explanation: "Dehydration shows moderate rouleaux, cells packed closely, reduced plasma between cells, and rapid sample deterioration.", answers: [{ text: "Moderate rouleaux, closely packed cells, reduced plasma, rapid deterioration", isCorrect: true }, { text: "Only crystal formations", isCorrect: false }, { text: "Excessive WBC activity", isCorrect: false }, { text: "Normal-appearing blood", isCorrect: false }] },
      { id: "q-lba07-06", text: "What nutritional deficiency shows macrocytic RBCs?", explanation: "Macrocytic (enlarged) RBCs indicate B12 or folate deficiency, especially when accompanied by hypersegmented neutrophils.", answers: [{ text: "Vitamin B12 or folate deficiency", isCorrect: true }, { text: "Iron deficiency", isCorrect: false }, { text: "Vitamin C deficiency", isCorrect: false }, { text: "Zinc deficiency", isCorrect: false }] },
      { id: "q-lba07-07", text: "What is the hallmark of the chronic inflammation pattern?", explanation: "Heavy rouleaux + sluggish WBCs + persistent fibrin strands indicates chronic inflammation.", answers: [{ text: "Heavy rouleaux + sluggish WBCs + persistent fibrin", isCorrect: true }, { text: "Active, moving WBCs", isCorrect: false }, { text: "Clear plasma only", isCorrect: false }, { text: "Normal cell morphology", isCorrect: false }] },
      { id: "q-lba07-08", text: "How does EFA deficiency appear different from general oxidative stress?", explanation: "EFA deficiency shows echinocytes without other major oxidative markers, suggesting membrane composition issues rather than free radical damage.", answers: [{ text: "Echinocytes without other major oxidative markers", isCorrect: true }, { text: "Identical to general oxidative stress", isCorrect: false }, { text: "Target cells only", isCorrect: false }, { text: "Macrocytic cells", isCorrect: false }] },
      { id: "q-lba07-09", text: "What test helps confirm iron deficiency suspected from LBA?", explanation: "Iron studies (serum iron, ferritin, TIBC, transferrin saturation) confirm iron deficiency suspected from microcytic hypochromic RBCs.", answers: [{ text: "Iron studies (ferritin, TIBC, serum iron)", isCorrect: true }, { text: "Vitamin D level", isCorrect: false }, { text: "Thyroid panel", isCorrect: false }, { text: "Liver enzymes", isCorrect: false }] },
      { id: "q-lba07-10", text: "How does pattern recognition improve?", explanation: "Pattern recognition improves with experience through systematic documentation and comparison of cases over time.", answers: [{ text: "Through systematic documentation and case comparison over time", isCorrect: true }, { text: "From reading textbooks alone", isCorrect: false }, { text: "It cannot be improved", isCorrect: false }, { text: "Only through AI assistance", isCorrect: false }] },
    ],
  },
];

const LBA_QUIZ_DATA_MODULES_8_17: typeof LBA_QUIZ_DATA = [
  {
    moduleId: "lba-mod-09",
    quizId: "quiz-lba-09",
    title: "AI-Enhanced Blood Analysis Quiz",
    slug: "lba-ai-quiz",
    description: "Test your knowledge of AI integration in blood analysis.",
    questions: [
      { id: "q-lba09-01", text: "What is the AI's primary role in the ALLIO blood analysis platform?", explanation: "The AI provides pattern recognition, second opinions, and documentation support — but never replaces practitioner judgment.", answers: [{ text: "Pattern recognition, second opinions, and documentation support", isCorrect: true }, { text: "Replacing practitioner diagnosis", isCorrect: false }, { text: "Prescribing treatments", isCorrect: false }, { text: "Running laboratory tests", isCorrect: false }] },
      { id: "q-lba09-02", text: "What confidence score threshold requires manual verification?", explanation: "AI confidence scores below 70% require careful manual verification by the practitioner.", answers: [{ text: "Below 70%", isCorrect: true }, { text: "Below 99%", isCorrect: false }, { text: "Below 50%", isCorrect: false }, { text: "Below 10%", isCorrect: false }] },
      { id: "q-lba09-03", text: "Can AI replace practitioner clinical judgment in LBA?", explanation: "No — AI is strictly a support tool. All AI suggestions must be reviewed by a qualified practitioner with clinical context.", answers: [{ text: "No — AI supports but never replaces clinical judgment", isCorrect: true }, { text: "Yes — AI is always more accurate", isCorrect: false }, { text: "Yes — for routine findings", isCorrect: false }, { text: "Only for experienced practitioners", isCorrect: false }] },
      { id: "q-lba09-04", text: "What databases does the AI cross-reference?", explanation: "The AI cross-references both conventional hematology and pleomorphic morphology databases for comprehensive analysis.", answers: [{ text: "Both conventional and pleomorphic morphology databases", isCorrect: true }, { text: "Conventional hematology only", isCorrect: false }, { text: "Social media databases", isCorrect: false }, { text: "Pharmaceutical databases only", isCorrect: false }] },
      { id: "q-lba09-05", text: "What benefit does AI documentation provide?", explanation: "AI automates structured report generation, saving time while maintaining standardized documentation format.", answers: [{ text: "Automated structured reports with standardized format", isCorrect: true }, { text: "Eliminates need for documentation", isCorrect: false }, { text: "Only stores images", isCorrect: false }, { text: "Replaces member consent", isCorrect: false }] },
      { id: "q-lba09-06", text: "What can AI help identify that a practitioner might miss?", explanation: "AI pattern matching can highlight findings the practitioner may have overlooked by comparing against a large database of known patterns.", answers: [{ text: "Findings missed by comparing against known pattern database", isCorrect: true }, { text: "Member emotional state", isCorrect: false }, { text: "Financial status", isCorrect: false }, { text: "AI cannot identify anything new", isCorrect: false }] },
      { id: "q-lba09-07", text: "What type of image should be uploaded for AI analysis?", explanation: "High-resolution microscopy images captured at appropriate magnification with proper illumination.", answers: [{ text: "High-resolution microscopy images with proper illumination", isCorrect: true }, { text: "Smartphone selfies", isCorrect: false }, { text: "Low-resolution thumbnails", isCorrect: false }, { text: "Scanned documents", isCorrect: false }] },
      { id: "q-lba09-08", text: "What clinical context can AI NOT assess?", explanation: "AI cannot assess member history, symptoms, medications, lifestyle, and other clinical context that the practitioner integrates.", answers: [{ text: "Member history, symptoms, medications, and lifestyle context", isCorrect: true }, { text: "Image patterns", isCorrect: false }, { text: "Morphological features", isCorrect: false }, { text: "Database comparisons", isCorrect: false }] },
      { id: "q-lba09-09", text: "How does AI assist with treatment decisions?", explanation: "AI suggests relevant protocols from the FFPMA database based on findings, but all suggestions must be reviewed by the practitioner.", answers: [{ text: "Suggests protocols from FFPMA database for practitioner review", isCorrect: true }, { text: "Prescribes medications directly", isCorrect: false }, { text: "Does not assist with treatment", isCorrect: false }, { text: "Overrides practitioner decisions", isCorrect: false }] },
      { id: "q-lba09-10", text: "What storage standard applies to AI-processed images?", explanation: "All images and records, including AI-processed ones, must comply with HIPAA-compliant storage requirements.", answers: [{ text: "HIPAA-compliant storage", isCorrect: true }, { text: "No storage requirements", isCorrect: false }, { text: "Public cloud only", isCorrect: false }, { text: "Local computer only", isCorrect: false }] },
    ],
  },
  {
    moduleId: "lba-mod-10",
    quizId: "quiz-lba-10",
    title: "Certification Exam Preparation Quiz",
    slug: "lba-exam-prep-quiz",
    description: "Test your readiness for the LBA certification examination.",
    questions: [
      { id: "q-lba10-01", text: "How many modules must be completed before the certification exam?", explanation: "All 17 LBA certification modules must be completed with passing quiz scores before taking the final exam.", answers: [{ text: "17 modules", isCorrect: true }, { text: "10 modules", isCorrect: false }, { text: "5 modules", isCorrect: false }, { text: "Any number", isCorrect: false }] },
      { id: "q-lba10-02", text: "What is the passing score for the certification exam?", explanation: "80% (80 out of 100 questions correct) is required to pass the certification exam.", answers: [{ text: "80%", isCorrect: true }, { text: "50%", isCorrect: false }, { text: "70%", isCorrect: false }, { text: "100%", isCorrect: false }] },
      { id: "q-lba10-03", text: "How many questions are on the certification exam?", explanation: "The certification exam contains 100 multiple-choice questions covering all 17 modules.", answers: [{ text: "100", isCorrect: true }, { text: "50", isCorrect: false }, { text: "200", isCorrect: false }, { text: "25", isCorrect: false }] },
      { id: "q-lba10-04", text: "What is the time limit for the certification exam?", explanation: "The certification exam has a 2-hour (120-minute) time limit.", answers: [{ text: "2 hours", isCorrect: true }, { text: "30 minutes", isCorrect: false }, { text: "4 hours", isCorrect: false }, { text: "No time limit", isCorrect: false }] },
      { id: "q-lba10-05", text: "How many attempts are allowed on the certification exam?", explanation: "A maximum of 3 attempts is allowed on the LBA certification exam.", answers: [{ text: "3", isCorrect: true }, { text: "1", isCorrect: false }, { text: "Unlimited", isCorrect: false }, { text: "5", isCorrect: false }] },
      { id: "q-lba10-06", text: "What type of certificate is issued upon passing?", explanation: "A numbered FFPMA LBA Practitioner Certificate with verification code is issued.", answers: [{ text: "Numbered FFPMA LBA Practitioner Certificate with verification code", isCorrect: true }, { text: "Informal email confirmation", isCorrect: false }, { text: "No certificate", isCorrect: false }, { text: "Generic participation certificate", isCorrect: false }] },
      { id: "q-lba10-07", text: "What annual requirement maintains the certification?", explanation: "10 hours of continuing education per year is required to maintain active certification.", answers: [{ text: "10 hours of continuing education", isCorrect: true }, { text: "Nothing", isCorrect: false }, { text: "Full re-examination", isCorrect: false }, { text: "100 hours", isCorrect: false }] },
      { id: "q-lba10-08", text: "What must be signed upon certification?", explanation: "The FFPMA Practitioner Agreement establishing scope of practice and ethical standards.", answers: [{ text: "FFPMA Practitioner Agreement", isCorrect: true }, { text: "Nothing", isCorrect: false }, { text: "Medical license application", isCorrect: false }, { text: "Insurance waiver", isCorrect: false }] },
      { id: "q-lba10-09", text: "What passing score is required for module quizzes?", explanation: "Each module quiz requires 80% to pass before the student can proceed.", answers: [{ text: "80%", isCorrect: true }, { text: "50%", isCorrect: false }, { text: "70%", isCorrect: false }, { text: "100%", isCorrect: false }] },
      { id: "q-lba10-10", text: "Is the certification exam open book?", explanation: "Yes, the certification exam is open book for reference materials.", answers: [{ text: "Yes — open book for reference materials", isCorrect: true }, { text: "No — closed book only", isCorrect: false }, { text: "Only digital resources", isCorrect: false }, { text: "Only printed materials", isCorrect: false }] },
    ],
  },
  {
    moduleId: "lba-mod-08",
    quizId: "quiz-lba-08",
    title: "Treatment Monitoring Quiz",
    slug: "lba-treatment-quiz",
    description: "Test your knowledge of treatment protocols and monitoring.",
    questions: [
      { id: "q-lba08-01", text: "What is the optimal retest interval for standard protocols?", explanation: "4 weeks is the optimal retest interval for standard treatment protocols to allow time for interventions to take effect.", answers: [{ text: "4 weeks", isCorrect: true }, { text: "1 day", isCorrect: false }, { text: "6 months", isCorrect: false }, { text: "1 year", isCorrect: false }] },
      { id: "q-lba08-02", text: "What must be identical for valid before/after comparison?", explanation: "Collection conditions (fasting status, time of day, hydration, same technique) must be identical for meaningful comparison.", answers: [{ text: "Collection conditions (fasting, timing, hydration, technique)", isCorrect: true }, { text: "Only the microscope brand", isCorrect: false }, { text: "The room temperature", isCorrect: false }, { text: "Nothing needs to be identical", isCorrect: false }] },
      { id: "q-lba08-03", text: "When should a member be referred to conventional medical evaluation?", explanation: "Refer when severe morphological abnormalities suggest serious hematological disease, symptoms don't improve, or findings suggest acute conditions.", answers: [{ text: "When findings suggest serious disease or symptoms don't improve", isCorrect: true }, { text: "Never — LBA handles all conditions", isCorrect: false }, { text: "Only when member requests it", isCorrect: false }, { text: "After every session", isCorrect: false }] },
      { id: "q-lba08-04", text: "What does a declining vitality score indicate?", explanation: "A declining vitality score indicates the current protocol is not effective and reassessment is needed.", answers: [{ text: "Protocol is not effective — reassess", isCorrect: true }, { text: "Protocol is working", isCorrect: false }, { text: "Normal fluctuation", isCorrect: false }, { text: "Equipment problem", isCorrect: false }] },
      { id: "q-lba08-05", text: "How many elements should baseline documentation include?", explanation: "Baseline includes: standardized conditions, full 5-zone assessment with photos, vitality score at 5 time points, written narrative, and lab correlation.", answers: [{ text: "5 elements: conditions, 5-zone photos, vitality timing, narrative, labs", isCorrect: true }, { text: "Just a photograph", isCorrect: false }, { text: "Just a vitality score", isCorrect: false }, { text: "3 elements", isCorrect: false }] },
      { id: "q-lba08-06", text: "What retest interval is used for acute protocols?", explanation: "Acute protocols warrant retesting at 2 weeks to assess rapid response.", answers: [{ text: "2 weeks", isCorrect: true }, { text: "24 hours", isCorrect: false }, { text: "3 months", isCorrect: false }, { text: "6 months", isCorrect: false }] },
      { id: "q-lba08-07", text: "What does a stable vitality score suggest?", explanation: "A stable but not improving vitality score may indicate the need for dose adjustment or additional interventions.", answers: [{ text: "May need dose adjustment or additional interventions", isCorrect: true }, { text: "Complete success", isCorrect: false }, { text: "Treatment should stop", isCorrect: false }, { text: "Equipment is miscalibrated", isCorrect: false }] },
      { id: "q-lba08-08", text: "What is the maintenance retest interval?", explanation: "Maintenance retesting every 3-6 months monitors ongoing health status and protocol adherence.", answers: [{ text: "3-6 months", isCorrect: true }, { text: "Daily", isCorrect: false }, { text: "Weekly", isCorrect: false }, { text: "Annually", isCorrect: false }] },
      { id: "q-lba08-09", text: "Why is visual comparison important for patients?", explanation: "Showing patients before/after images of their own blood provides powerful motivation for protocol adherence.", answers: [{ text: "Provides motivation for protocol adherence", isCorrect: true }, { text: "Has no patient benefit", isCorrect: false }, { text: "Only for insurance documentation", isCorrect: false }, { text: "Required by law", isCorrect: false }] },
      { id: "q-lba08-10", text: "What should happen when new findings appear during monitoring?", explanation: "New findings that weren't present at baseline should be addressed with additional targeted interventions.", answers: [{ text: "Address with additional targeted interventions", isCorrect: true }, { text: "Ignore them", isCorrect: false }, { text: "Stop all treatment", isCorrect: false }, { text: "Repeat baseline only", isCorrect: false }] },
    ],
  },
  {
    moduleId: "lba-mod-11",
    quizId: "quiz-lba-11",
    title: "Dry Layer Testing Quiz",
    slug: "lba-dry-layer-quiz",
    description: "Test your knowledge of dry layer oxidative stress testing.",
    questions: [
      { id: "q-lba11-01", text: "How many drops are used in the dry layer test?", explanation: "8 sequential drops are placed on a clean slide and allowed to air dry for analysis.", answers: [{ text: "8 sequential drops", isCorrect: true }, { text: "1 drop", isCorrect: false }, { text: "3 drops", isCorrect: false }, { text: "20 drops", isCorrect: false }] },
      { id: "q-lba11-02", text: "What do lacunae (clear holes) in the dry layer indicate?", explanation: "Lacunae indicate that free radicals have disrupted fibrin polymerization, revealing oxidative stress.", answers: [{ text: "Free radical damage disrupting fibrin polymerization", isCorrect: true }, { text: "Normal drying pattern", isCorrect: false }, { text: "Bacterial contamination", isCorrect: false }, { text: "Excessive iron", isCorrect: false }] },
      { id: "q-lba11-03", text: "How many concentric layers does each dried drop show?", explanation: "Each dried blood drop shows 8 concentric layers from center to periphery, each correlating with specific organ systems.", answers: [{ text: "8 layers", isCorrect: true }, { text: "3 layers", isCorrect: false }, { text: "12 layers", isCorrect: false }, { text: "No distinct layers", isCorrect: false }] },
      { id: "q-lba11-04", text: "What does a normal dry layer pattern look like?", explanation: "Normal dried blood shows tight, uniform polymerized fibrin mesh across all layers with no holes, dark spots, or disruptions.", answers: [{ text: "Tight, uniform fibrin mesh with no holes or disruptions", isCorrect: true }, { text: "Many holes and dark spots", isCorrect: false }, { text: "Complete transparency", isCorrect: false }, { text: "Bright red uniform color", isCorrect: false }] },
      { id: "q-lba11-05", text: "What do dark spots in the dry layer suggest?", explanation: "Dark concentrated areas in the dried blood pattern correlate with heavy metal toxicity and toxic burden.", answers: [{ text: "Heavy metal toxicity", isCorrect: true }, { text: "Normal variant", isCorrect: false }, { text: "Vitamin deficiency", isCorrect: false }, { text: "Dehydration", isCorrect: false }] },
      { id: "q-lba11-06", text: "Which layers correspond to cardiovascular/respiratory systems?", explanation: "Center layers (1-2) of the dried blood drop correspond to cardiovascular and respiratory systems.", answers: [{ text: "Layers 1-2 (center)", isCorrect: true }, { text: "Layers 7-8 (periphery)", isCorrect: false }, { text: "Layer 4 only", isCorrect: false }, { text: "All layers equally", isCorrect: false }] },
      { id: "q-lba11-07", text: "What magnification is used for dry layer analysis?", explanation: "Dry layer analysis uses 40-100x magnification under bright field or phase contrast.", answers: [{ text: "40-100x", isCorrect: true }, { text: "1000x oil immersion", isCorrect: false }, { text: "10x only", isCorrect: false }, { text: "Electron microscopy", isCorrect: false }] },
      { id: "q-lba11-08", text: "How long should drops dry before examination?", explanation: "Drops should air dry completely for 10-15 minutes, undisturbed, before examination.", answers: [{ text: "10-15 minutes undisturbed", isCorrect: true }, { text: "1 minute", isCorrect: false }, { text: "1 hour", isCorrect: false }, { text: "Heat-dry immediately", isCorrect: false }] },
      { id: "q-lba11-09", text: "What does severe pattern breakdown indicate?", explanation: "Severe breakdown of the fibrin mesh pattern indicates degenerative conditions with significant oxidative stress.", answers: [{ text: "Degenerative conditions with significant oxidative stress", isCorrect: true }, { text: "Normal aging", isCorrect: false }, { text: "Recent meal", isCorrect: false }, { text: "Cold temperature", isCorrect: false }] },
      { id: "q-lba11-10", text: "How is dry layer testing used for monitoring treatment?", explanation: "Serial dry layer testing tracks the effectiveness of antioxidant interventions by comparing patterns over time.", answers: [{ text: "Serial testing tracks antioxidant intervention effectiveness", isCorrect: true }, { text: "Single test is sufficient", isCorrect: false }, { text: "Cannot be used for monitoring", isCorrect: false }, { text: "Only useful at baseline", isCorrect: false }] },
    ],
  },
  {
    moduleId: "lba-mod-12",
    quizId: "quiz-lba-12",
    title: "Biological Terrain Quiz",
    slug: "lba-terrain-quiz",
    description: "Test your knowledge of biological terrain assessment.",
    questions: [
      { id: "q-lba12-01", text: "What three parameters define biological terrain?", explanation: "Biological terrain is defined by pH (acid-alkaline), rH2 (redox potential/oxidation-reduction), and resistivity (mineral concentration).", answers: [{ text: "pH, rH2 (redox potential), and resistivity", isCorrect: true }, { text: "Temperature, pressure, volume", isCorrect: false }, { text: "Hemoglobin, hematocrit, platelets", isCorrect: false }, { text: "Glucose, insulin, cortisol", isCorrect: false }] },
      { id: "q-lba12-02", text: "What body fluids are tested in the 9-factor terrain matrix?", explanation: "Blood, saliva, and urine are tested for pH, rH2, and resistivity, creating a 9-factor matrix.", answers: [{ text: "Blood, saliva, and urine", isCorrect: true }, { text: "Blood only", isCorrect: false }, { text: "Blood and sweat", isCorrect: false }, { text: "Saliva only", isCorrect: false }] },
      { id: "q-lba12-03", text: "What does elevated rH2 indicate?", explanation: "Elevated rH2 (redox potential) indicates oxidative stress — excess oxidation and free radical activity.", answers: [{ text: "Oxidative stress and free radical excess", isCorrect: true }, { text: "Healthy antioxidant status", isCorrect: false }, { text: "Dehydration", isCorrect: false }, { text: "Alkalosis", isCorrect: false }] },
      { id: "q-lba12-04", text: "What is the normal blood pH range?", explanation: "Normal blood pH is tightly regulated between 7.35-7.45.", answers: [{ text: "7.35-7.45", isCorrect: true }, { text: "6.0-6.5", isCorrect: false }, { text: "8.0-8.5", isCorrect: false }, { text: "5.0-5.5", isCorrect: false }] },
      { id: "q-lba12-05", text: "What does acidic terrain promote in the pleomorphic framework?", explanation: "Acidic terrain promotes upward microbial development (from symbiont toward parasitic/fungal forms) and mineral loss.", answers: [{ text: "Upward microbial development and mineral loss", isCorrect: true }, { text: "Improved immune function", isCorrect: false }, { text: "Better oxygen delivery", isCorrect: false }, { text: "Reduced inflammation", isCorrect: false }] },
      { id: "q-lba12-06", text: "What does low resistivity indicate?", explanation: "Low resistivity indicates mineral excess or toxic metal burden — too many dissolved minerals/metals in the fluid.", answers: [{ text: "Mineral excess or toxic metal burden", isCorrect: true }, { text: "Mineral deficiency", isCorrect: false }, { text: "Normal mineral status", isCorrect: false }, { text: "Dehydration", isCorrect: false }] },
      { id: "q-lba12-07", text: "Who developed the quantifiable terrain assessment system?", explanation: "Professor Louis-Claude Vincent developed the Bio-Electronic Vincent (BEV) terrain assessment system.", answers: [{ text: "Professor Louis-Claude Vincent", isCorrect: true }, { text: "Gunther Enderlein", isCorrect: false }, { text: "Antoine Bechamp", isCorrect: false }, { text: "Louis Pasteur", isCorrect: false }] },
      { id: "q-lba12-08", text: "What is the optimal blood rH2 range?", explanation: "Optimal blood rH2 is 21-23, indicating balanced oxidation-reduction status.", answers: [{ text: "21-23", isCorrect: true }, { text: "0-5", isCorrect: false }, { text: "35-42", isCorrect: false }, { text: "7-8", isCorrect: false }] },
      { id: "q-lba12-09", text: "How does terrain assessment guide treatment?", explanation: "Terrain guides treatment: acidic terrain needs alkalinizing, oxidized terrain needs antioxidants, mineral-depleted terrain needs supplementation.", answers: [{ text: "Acidic: alkalinize; Oxidized: antioxidants; Depleted: supplement", isCorrect: true }, { text: "Same treatment for all terrain types", isCorrect: false }, { text: "Terrain has no treatment implications", isCorrect: false }, { text: "Only pharmaceutical interventions", isCorrect: false }] },
      { id: "q-lba12-10", text: "What terrain pattern correlates with echinocytes in LBA?", explanation: "Acidic + oxidized terrain (low pH + high rH2) typically shows echinocytes, rouleaux, and advanced pleomorphic forms.", answers: [{ text: "Acidic + oxidized terrain (low pH + high rH2)", isCorrect: true }, { text: "Alkaline + reduced terrain", isCorrect: false }, { text: "Normal terrain", isCorrect: false }, { text: "Terrain does not correlate with LBA", isCorrect: false }] },
    ],
  },
  {
    moduleId: "lba-mod-13",
    quizId: "quiz-lba-13",
    title: "Pleomorphism & Cyclogeny Quiz",
    slug: "lba-cyclogeny-quiz",
    description: "Test your knowledge of Enderlein's cyclogeny theory.",
    questions: [
      { id: "q-lba13-01", text: "What is the fundamental unit in Enderlein's cyclogeny?", explanation: "The protit is the fundamental unit — the smallest living protein colloidal particle that is the base of all microbial development.", answers: [{ text: "Protit", isCorrect: true }, { text: "Bacterium", isCorrect: false }, { text: "Virus", isCorrect: false }, { text: "Fungal spore", isCorrect: false }] },
      { id: "q-lba13-02", text: "What does upward development mean in cyclogeny?", explanation: "Upward development is the pathological progression from protit through bacterial stages to fungal culmination, driven by terrain disturbance.", answers: [{ text: "Progression from protit to bacteria to fungus (pathological)", isCorrect: true }, { text: "Growth in height", isCorrect: false }, { text: "Increasing cell count", isCorrect: false }, { text: "Improved health", isCorrect: false }] },
      { id: "q-lba13-03", text: "What determines the direction of cyclogeny development?", explanation: "The biological terrain (pH, redox, minerals) determines whether organisms develop upward (pathological) or downward (therapeutic).", answers: [{ text: "Biological terrain (pH, redox, minerals)", isCorrect: true }, { text: "Genetics alone", isCorrect: false }, { text: "External infection", isCorrect: false }, { text: "Random chance", isCorrect: false }] },
      { id: "q-lba13-04", text: "What are the two primary endobiont cycles?", explanation: "Mucor racemosus (vascular/coagulation) and Aspergillus niger (skeletal/mineral metabolism) are the two primary endobiont cycles.", answers: [{ text: "Mucor racemosus and Aspergillus niger", isCorrect: true }, { text: "E. coli and Staph", isCorrect: false }, { text: "Candida and Streptococcus", isCorrect: false }, { text: "Salmonella and Listeria", isCorrect: false }] },
      { id: "q-lba13-05", text: "What is isopathic therapy?", explanation: "Isopathic therapy uses preparations from the same organism cycle to drive organisms back downward toward the harmless protit phase.", answers: [{ text: "Using preparations from the organism's own cycle to reverse development", isCorrect: true }, { text: "Using antibiotics to kill organisms", isCorrect: false }, { text: "Surgical removal of infected tissue", isCorrect: false }, { text: "Vaccination", isCorrect: false }] },
      { id: "q-lba13-06", text: "What cyclogeny stage are chondrites?", explanation: "Chondrites are thread-like formations representing an intermediate stage between protits and bacterial-phase forms.", answers: [{ text: "Intermediate thread-like stage between protit and bacterial", isCorrect: true }, { text: "The most advanced fungal stage", isCorrect: false }, { text: "A normal blood component", isCorrect: false }, { text: "A type of crystal", isCorrect: false }] },
      { id: "q-lba13-07", text: "What is the therapeutic goal regarding cyclogeny?", explanation: "The goal is downward development — pushing organisms back from fungal/bacterial phases to the harmless, symbiotic protit phase.", answers: [{ text: "Downward development to symbiotic protit phase", isCorrect: true }, { text: "Upward development to fungal phase", isCorrect: false }, { text: "Complete elimination of all organisms", isCorrect: false }, { text: "Stabilization at bacterial phase", isCorrect: false }] },
      { id: "q-lba13-08", text: "What is an endobiont?", explanation: "An endobiont is an organism that lives permanently within the host, existing in all blood at the protit level.", answers: [{ text: "An organism living permanently within the host", isCorrect: true }, { text: "An external pathogen", isCorrect: false }, { text: "A laboratory contaminant", isCorrect: false }, { text: "A type of vitamin", isCorrect: false }] },
      { id: "q-lba13-09", text: "What isopathic remedy addresses the Mucor racemosus cycle?", explanation: "Mucokehl is the isopathic remedy specific to the Mucor racemosus endobiont cycle.", answers: [{ text: "Mucokehl", isCorrect: true }, { text: "Nigersan", isCorrect: false }, { text: "Penicillin", isCorrect: false }, { text: "Aspirin", isCorrect: false }] },
      { id: "q-lba13-10", text: "What does the presence of multiple cyclogeny stages suggest?", explanation: "Multiple stages visible simultaneously suggests active upward development — the cyclogeny is progressing, indicating terrain deterioration.", answers: [{ text: "Active upward development and terrain deterioration", isCorrect: true }, { text: "Normal, healthy blood", isCorrect: false }, { text: "Sample contamination", isCorrect: false }, { text: "Equipment malfunction", isCorrect: false }] },
    ],
  },
  {
    moduleId: "lba-mod-14",
    quizId: "quiz-lba-14",
    title: "Blood Mycology Quiz",
    slug: "lba-mycology-quiz",
    description: "Test your knowledge of blood mycology.",
    questions: [
      { id: "q-lba14-01", text: "What system does the Mucor racemosus cycle primarily affect?", explanation: "Mucor racemosus primarily affects blood coagulation and the vascular system.", answers: [{ text: "Blood coagulation and vascular system", isCorrect: true }, { text: "Skeletal system", isCorrect: false }, { text: "Nervous system", isCorrect: false }, { text: "Respiratory system", isCorrect: false }] },
      { id: "q-lba14-02", text: "What system does the Aspergillus niger cycle primarily affect?", explanation: "Aspergillus niger primarily affects calcium metabolism and the skeletal system.", answers: [{ text: "Calcium metabolism and skeletal system", isCorrect: true }, { text: "Coagulation system", isCorrect: false }, { text: "Digestive system", isCorrect: false }, { text: "Immune system", isCorrect: false }] },
      { id: "q-lba14-03", text: "What is the progression of endobiont behavior?", explanation: "The progression is symbiont (helpful) to parasite (disruptive) to fungus (pathological), driven by terrain deterioration.", answers: [{ text: "Symbiont to parasite to fungus", isCorrect: true }, { text: "Fungus to bacteria to virus", isCorrect: false }, { text: "Parasite to symbiont to fungus", isCorrect: false }, { text: "Fungus to symbiont to parasite", isCorrect: false }] },
      { id: "q-lba14-04", text: "What is the treatment goal for blood mycology?", explanation: "The goal is to shift organisms back to their symbiotic phase through terrain correction and isopathic therapy.", answers: [{ text: "Shift organisms back to symbiotic phase", isCorrect: true }, { text: "Kill all organisms", isCorrect: false }, { text: "Promote fungal development", isCorrect: false }, { text: "No treatment is needed", isCorrect: false }] },
      { id: "q-lba14-05", text: "Are blood fungi external invaders in the Enderlein framework?", explanation: "No — blood fungi are the culmination of upward development of organisms that normally exist in symbiotic balance, not external invaders.", answers: [{ text: "No — they develop from endogenous organisms through terrain disturbance", isCorrect: true }, { text: "Yes — they are always external infections", isCorrect: false }, { text: "Sometimes external, sometimes internal", isCorrect: false }, { text: "They do not exist", isCorrect: false }] },
      { id: "q-lba14-06", text: "What isopathic remedy is specific to the Aspergillus niger cycle?", explanation: "Nigersan is the isopathic remedy specific to the Aspergillus niger endobiont cycle.", answers: [{ text: "Nigersan", isCorrect: true }, { text: "Mucokehl", isCorrect: false }, { text: "Penicillin", isCorrect: false }, { text: "Nystatin", isCorrect: false }] },
      { id: "q-lba14-07", text: "What early signs suggest mycotic progression?", explanation: "Increased protit aggregation and thread formations are early signs of upward development toward mycotic (fungal) phases.", answers: [{ text: "Increased protit aggregation and thread formations", isCorrect: true }, { text: "Clear plasma only", isCorrect: false }, { text: "Normal RBC morphology", isCorrect: false }, { text: "Reduced WBC count", isCorrect: false }] },
      { id: "q-lba14-08", text: "What clinical marker correlates with Mucor parasitic phase?", explanation: "Fibrin activity in LBA and coagulation abnormalities in labs correlate with the Mucor racemosus parasitic phase.", answers: [{ text: "Fibrin activity and coagulation abnormalities", isCorrect: true }, { text: "Normal coagulation", isCorrect: false }, { text: "Joint pain only", isCorrect: false }, { text: "Skin rashes", isCorrect: false }] },
      { id: "q-lba14-09", text: "How does severe Aspergillus development manifest?", explanation: "Severe Aspergillus development shows septate hyphae and is associated with calcification, joint destruction, and skeletal disorders.", answers: [{ text: "Septate hyphae, calcification, joint destruction", isCorrect: true }, { text: "Blood clotting only", isCorrect: false }, { text: "Respiratory symptoms only", isCorrect: false }, { text: "Skin lesions", isCorrect: false }] },
      { id: "q-lba14-10", text: "Can the endobiont ever be completely eliminated?", explanation: "No — per Enderlein, the endobiont exists at the protit level in all blood and cannot be completely eliminated. The goal is terrain correction.", answers: [{ text: "No — it exists permanently; the goal is terrain correction", isCorrect: true }, { text: "Yes — with strong antibiotics", isCorrect: false }, { text: "Yes — with antifungal drugs", isCorrect: false }, { text: "Yes — with surgery", isCorrect: false }] },
    ],
  },
  {
    moduleId: "lba-mod-15",
    quizId: "quiz-lba-15",
    title: "Zeta Potential Quiz",
    slug: "lba-zeta-quiz",
    description: "Test your knowledge of zeta potential and blood colloid science.",
    questions: [
      { id: "q-lba15-01", text: "What is zeta potential?", explanation: "Zeta potential is the electrical potential at the slip plane of the double layer surrounding blood cells, maintaining colloidal suspension.", answers: [{ text: "Electrical potential maintaining blood cell colloidal suspension", isCorrect: true }, { text: "Blood pressure measurement", isCorrect: false }, { text: "Oxygen saturation level", isCorrect: false }, { text: "Body temperature", isCorrect: false }] },
      { id: "q-lba15-02", text: "What charge do healthy blood cells carry?", explanation: "Healthy blood cells carry a negative surface charge (from sialic acid on the glycocalyx) that keeps them dispersed.", answers: [{ text: "Negative charge", isCorrect: true }, { text: "Positive charge", isCorrect: false }, { text: "Neutral charge", isCorrect: false }, { text: "Variable charge", isCorrect: false }] },
      { id: "q-lba15-03", text: "What happens when zeta potential decreases?", explanation: "Decreased zeta potential reduces repulsive forces between cells, leading to aggregation, rouleaux, sludging, and impaired microcirculation.", answers: [{ text: "Cells aggregate, forming rouleaux and sludging", isCorrect: true }, { text: "Cells spread apart more", isCorrect: false }, { text: "Blood becomes thinner", isCorrect: false }, { text: "Nothing changes", isCorrect: false }] },
      { id: "q-lba15-04", text: "Which minerals can reduce zeta potential?", explanation: "Cationic minerals like aluminum, excess iron, and excess calcium can overwhelm the negative surface charge and reduce zeta potential.", answers: [{ text: "Aluminum, excess iron, excess calcium", isCorrect: true }, { text: "Potassium and magnesium", isCorrect: false }, { text: "Sodium chloride", isCorrect: false }, { text: "All minerals equally", isCorrect: false }] },
      { id: "q-lba15-05", text: "What improves zeta potential?", explanation: "Adequate hydration, alkaline minerals (potassium, magnesium), essential fatty acids, and antioxidants improve zeta potential.", answers: [{ text: "Hydration, alkaline minerals, EFAs, antioxidants", isCorrect: true }, { text: "Dehydration", isCorrect: false }, { text: "Acidic foods only", isCorrect: false }, { text: "Heavy metal exposure", isCorrect: false }] },
      { id: "q-lba15-06", text: "How is zeta potential graded in LBA?", explanation: "Zeta potential is graded 0-4 based on aggregation severity: 0 (none) to 4 (near-complete aggregation).", answers: [{ text: "Grade 0-4 based on aggregation severity", isCorrect: true }, { text: "Measured with a voltmeter", isCorrect: false }, { text: "Calculated from blood pressure", isCorrect: false }, { text: "Estimated by blood color", isCorrect: false }] },
      { id: "q-lba15-07", text: "What is the healthy zeta potential range?", explanation: "Healthy zeta potential is -15 to -20 millivolts or more negative, maintaining adequate cell dispersion.", answers: [{ text: "-15 to -20 millivolts or more negative", isCorrect: true }, { text: "0 millivolts", isCorrect: false }, { text: "+10 millivolts", isCorrect: false }, { text: "-1 millivolt", isCorrect: false }] },
      { id: "q-lba15-08", text: "How does dehydration affect zeta potential?", explanation: "Dehydration concentrates plasma proteins which neutralize the negative surface charge on cells, reducing zeta potential.", answers: [{ text: "Concentrated proteins neutralize surface charge", isCorrect: true }, { text: "It increases zeta potential", isCorrect: false }, { text: "No effect", isCorrect: false }, { text: "Only affects platelets", isCorrect: false }] },
      { id: "q-lba15-09", text: "What cardiovascular risk is associated with poor zeta potential?", explanation: "Poor zeta potential increases blood viscosity and sludging, correlating with atherosclerosis, stroke, and cardiovascular disease risk.", answers: [{ text: "Atherosclerosis, stroke, cardiovascular disease", isCorrect: true }, { text: "No cardiovascular risk", isCorrect: false }, { text: "Only affects bones", isCorrect: false }, { text: "Heart valve problems only", isCorrect: false }] },
      { id: "q-lba15-10", text: "What Grade 3 zeta potential assessment shows in LBA?", explanation: "Grade 3 shows heavy rouleaux/sludging with stacks >10 cells, indicating poor zeta potential requiring intervention.", answers: [{ text: "Heavy rouleaux/sludging, >10 cell stacks", isCorrect: true }, { text: "Free-flowing cells", isCorrect: false }, { text: "Mild 2-4 cell stacks", isCorrect: false }, { text: "Crystal formations", isCorrect: false }] },
    ],
  },
  {
    moduleId: "lba-mod-16",
    quizId: "quiz-lba-16",
    title: "Parasitology Quiz",
    slug: "lba-parasitology-quiz",
    description: "Test your knowledge of blood parasitology.",
    questions: [
      { id: "q-lba16-01", text: "Which parasite shows Maltese cross tetrads in blood?", explanation: "Babesia shows characteristic Maltese cross (tetrad) formations in RBCs, which are pathognomonic.", answers: [{ text: "Babesia", isCorrect: true }, { text: "Malaria", isCorrect: false }, { text: "Trypanosoma", isCorrect: false }, { text: "Borrelia", isCorrect: false }] },
      { id: "q-lba16-02", text: "What shape does Borrelia (Lyme spirochete) show in dark field?", explanation: "Borrelia burgdorferi shows characteristic corkscrew/helical shape with undulating motility in dark field.", answers: [{ text: "Corkscrew/helical shape with undulating motility", isCorrect: true }, { text: "Round spheres", isCorrect: false }, { text: "Square blocks", isCorrect: false }, { text: "Flat discs", isCorrect: false }] },
      { id: "q-lba16-03", text: "What WBC type elevation suggests parasitic burden?", explanation: "Elevated eosinophils suggest parasitic infection or allergic conditions.", answers: [{ text: "Eosinophils", isCorrect: true }, { text: "Neutrophils", isCorrect: false }, { text: "Basophils", isCorrect: false }, { text: "Monocytes", isCorrect: false }] },
      { id: "q-lba16-04", text: "Should parasitic findings in LBA be confirmed with conventional testing?", explanation: "Yes — significant parasitic findings should always be confirmed with conventional parasitology testing (stool analysis, serology, PCR).", answers: [{ text: "Yes — always confirm with conventional testing", isCorrect: true }, { text: "No — LBA is sufficient", isCorrect: false }, { text: "Only for malaria", isCorrect: false }, { text: "Only in endemic areas", isCorrect: false }] },
      { id: "q-lba16-05", text: "What distinguishes Babesia from malaria ring forms?", explanation: "Babesia ring forms have no hemozoin pigment (unlike malaria) and may show pathognomonic Maltese cross tetrads.", answers: [{ text: "No hemozoin pigment and possible Maltese cross tetrads", isCorrect: true }, { text: "They are identical", isCorrect: false }, { text: "Size only", isCorrect: false }, { text: "Color only", isCorrect: false }] },
      { id: "q-lba16-06", text: "What does the pleomorphic perspective add to parasitology?", explanation: "The pleomorphic perspective extends parasitism to include endobiont organisms shifting from symbiotic to parasitic behavior based on terrain.", answers: [{ text: "Endobionts can shift from symbiotic to parasitic based on terrain", isCorrect: true }, { text: "Nothing additional", isCorrect: false }, { text: "Only considers external parasites", isCorrect: false }, { text: "Rejects all parasite concepts", isCorrect: false }] },
      { id: "q-lba16-07", text: "What magnification options should be used for parasite identification?", explanation: "Use multiple magnifications: 40x for overview scanning and 100x oil immersion for detailed identification.", answers: [{ text: "40x for overview and 100x for detailed identification", isCorrect: true }, { text: "Only 10x", isCorrect: false }, { text: "Only electron microscopy", isCorrect: false }, { text: "400x only", isCorrect: false }] },
      { id: "q-lba16-08", text: "What is characteristic of P. falciparum gametocytes?", explanation: "P. falciparum gametocytes have a distinctive banana/crescent shape that is pathognomonic.", answers: [{ text: "Banana/crescent shape", isCorrect: true }, { text: "Spherical shape", isCorrect: false }, { text: "Star shape", isCorrect: false }, { text: "Square shape", isCorrect: false }] },
      { id: "q-lba16-09", text: "What motility pattern characterizes Trypanosoma in blood?", explanation: "Trypanosoma shows active flagellar motility with C or S-shaped bodies undulating through the plasma.", answers: [{ text: "Active flagellar motility with undulating C/S-shaped bodies", isCorrect: true }, { text: "No motility", isCorrect: false }, { text: "Rotation only", isCorrect: false }, { text: "Linear movement only", isCorrect: false }] },
      { id: "q-lba16-10", text: "Why do some LBA practitioners note the lunar cycle?", explanation: "Many practitioners observe increased parasitic activity around the full moon, documenting timing as part of comprehensive LBA practice.", answers: [{ text: "Increased parasitic activity may correlate with full moon cycles", isCorrect: true }, { text: "It has no relevance", isCorrect: false }, { text: "Parasites are only active during new moon", isCorrect: false }, { text: "Required by regulation", isCorrect: false }] },
    ],
  },
  {
    moduleId: "lba-mod-17",
    quizId: "quiz-lba-17",
    title: "Practice Management Quiz",
    slug: "lba-practice-quiz",
    description: "Test your knowledge of practice management and legal compliance.",
    questions: [
      { id: "q-lba17-01", text: "How should LBA be presented within the PMA framework?", explanation: "LBA must be presented as an educational assessment tool, not as medical diagnosis, within the PMA member-to-member context.", answers: [{ text: "As an educational assessment tool, not medical diagnosis", isCorrect: true }, { text: "As a replacement for all medical testing", isCorrect: false }, { text: "As a diagnostic procedure", isCorrect: false }, { text: "As a treatment modality", isCorrect: false }] },
      { id: "q-lba17-02", text: "What type of language should be used in LBA reports?", explanation: "Use observation language ('observations suggest' not 'diagnosis shows'), educational suggestions not prescriptions.", answers: [{ text: "Observation language, not diagnostic language", isCorrect: true }, { text: "Medical diagnostic terminology", isCorrect: false }, { text: "Legal terminology", isCorrect: false }, { text: "Any language is acceptable", isCorrect: false }] },
      { id: "q-lba17-03", text: "What must be obtained before every LBA session?", explanation: "Member consent must be obtained and documented before every session, including understanding of LBA's educational nature.", answers: [{ text: "Member consent with understanding of LBA's educational nature", isCorrect: true }, { text: "Insurance authorization", isCorrect: false }, { text: "Medical referral", isCorrect: false }, { text: "Nothing is required", isCorrect: false }] },
      { id: "q-lba17-04", text: "What data storage standard must LBA records comply with?", explanation: "All member images and records must be stored in HIPAA-compliant systems with proper security measures.", answers: [{ text: "HIPAA-compliant storage", isCorrect: true }, { text: "No storage requirements", isCorrect: false }, { text: "Public cloud storage", isCorrect: false }, { text: "Paper records only", isCorrect: false }] },
      { id: "q-lba17-05", text: "What should practitioners never claim about LBA?", explanation: "Practitioners should never claim to diagnose, treat, cure, or prevent any disease through LBA.", answers: [{ text: "To diagnose, treat, cure, or prevent disease", isCorrect: true }, { text: "To provide educational assessment", isCorrect: false }, { text: "To show visual findings", isCorrect: false }, { text: "To complement other testing", isCorrect: false }] },
      { id: "q-lba17-06", text: "What annual requirement maintains LBA certification?", explanation: "10 hours of continuing education per year is required to maintain FFPMA LBA Practitioner certification.", answers: [{ text: "10 hours of continuing education", isCorrect: true }, { text: "No ongoing requirements", isCorrect: false }, { text: "100 hours per year", isCorrect: false }, { text: "Full re-examination", isCorrect: false }] },
      { id: "q-lba17-07", text: "What is the PMA legal protection based on?", explanation: "PMA protection is based on member-to-member private contracts, voluntary membership, and constitutional rights to private association.", answers: [{ text: "Member-to-member private contracts and constitutional rights", isCorrect: true }, { text: "Medical licensing", isCorrect: false }, { text: "Insurance coverage", isCorrect: false }, { text: "Government approval", isCorrect: false }] },
      { id: "q-lba17-08", text: "What should be understood about CLIA in the PMA context?", explanation: "Practitioners should understand CLIA requirements even within PMA context, as jurisdictional requirements vary.", answers: [{ text: "Understand CLIA requirements — jurisdictional requirements vary", isCorrect: true }, { text: "CLIA never applies", isCorrect: false }, { text: "CLIA always requires certification", isCorrect: false }, { text: "CLIA only applies to hospitals", isCorrect: false }] },
      { id: "q-lba17-09", text: "What terminology should replace 'prescription' in PMA context?", explanation: "Within PMA context, use 'educational suggestion' instead of 'prescription' to stay within proper scope of practice.", answers: [{ text: "Educational suggestion", isCorrect: true }, { text: "Medical order", isCorrect: false }, { text: "Treatment plan", isCorrect: false }, { text: "Prescription alternative", isCorrect: false }] },
      { id: "q-lba17-10", text: "Why is documentation standardization important?", explanation: "Standardized documentation ensures consistency, enables meaningful case comparison, supports member care continuity, and provides legal protection.", answers: [{ text: "Consistency, case comparison, care continuity, legal protection", isCorrect: true }, { text: "Only for billing purposes", isCorrect: false }, { text: "Not important", isCorrect: false }, { text: "Only for research papers", isCorrect: false }] },
    ],
  },
];

const ALL_QUIZ_DATA = [...LBA_QUIZ_DATA, ...LBA_QUIZ_DATA_MODULES_8_17];

const LBA_ACHIEVEMENTS = [
  {
    name: "Microscopy Initiate",
    description: "Complete the LBA Foundations module",
    type: "module_complete" as const,
    icon: "microscope",
    color: "bronze",
    points: 15,
    criteria: { lbaModule: "lba-foundations", trackId: LBA_TRACK_ID },
  },
  {
    name: "Dark Field Observer",
    description: "Complete the Dark Field Microscopy Mastery module",
    type: "module_complete" as const,
    icon: "eye",
    color: "silver",
    points: 25,
    criteria: { lbaModule: "lba-dark-field-mastery", trackId: LBA_TRACK_ID },
  },
  {
    name: "Blood Cell Scholar",
    description: "Complete both RBC and WBC Analysis modules",
    type: "module_complete" as const,
    icon: "heart-pulse",
    color: "silver",
    points: 35,
    criteria: { lbaModules: ["lba-rbc-analysis", "lba-wbc-analysis"], trackId: LBA_TRACK_ID },
  },
  {
    name: "Pleomorphism Scholar",
    description: "Complete the Pleomorphism & Cyclogeny module",
    type: "module_complete" as const,
    icon: "dna",
    color: "gold",
    points: 40,
    criteria: { lbaModule: "lba-pleomorphism-cyclogeny", trackId: LBA_TRACK_ID },
  },
  {
    name: "Terrain Analyst",
    description: "Complete the Biological Terrain Assessment module",
    type: "module_complete" as const,
    icon: "flask-round",
    color: "gold",
    points: 40,
    criteria: { lbaModule: "lba-biological-terrain", trackId: LBA_TRACK_ID },
  },
  {
    name: "Mycology Explorer",
    description: "Complete the Blood Mycology module",
    type: "module_complete" as const,
    icon: "bug",
    color: "silver",
    points: 30,
    criteria: { lbaModule: "lba-blood-mycology", trackId: LBA_TRACK_ID },
  },
  {
    name: "Colloid Scientist",
    description: "Complete the Zeta Potential & Blood Colloid Science module",
    type: "module_complete" as const,
    icon: "atom",
    color: "gold",
    points: 35,
    criteria: { lbaModule: "lba-zeta-potential", trackId: LBA_TRACK_ID },
  },
  {
    name: "LBA Course Graduate",
    description: "Complete all 17 LBA certification modules",
    type: "track_complete" as const,
    icon: "graduation-cap",
    color: "gold",
    points: 75,
    criteria: { trackId: LBA_TRACK_ID, allModulesComplete: true },
  },
  {
    name: "LBA Practitioner Certified",
    description: "Pass the 100-question LBA Certification Examination with 80%+",
    type: "certification_earned" as const,
    icon: "shield-check",
    color: "gold",
    points: 150,
    criteria: { certificationExam: "quiz-lba-certification", passingScore: 80, trackId: LBA_TRACK_ID },
  },
];

export async function seedLBACertification(): Promise<void> {
  console.log("[LBA Seed] Starting LBA Certification Course seeding...");

  const moduleIds = LBA_MODULES.map(m => m.id);
  const allQuizIds = ALL_QUIZ_DATA.map(q => q.quizId);
  const allQuestionIds = ALL_QUIZ_DATA.flatMap(q => q.questions.map(qq => qq.id));
  const achievementNames = LBA_ACHIEVEMENTS.map(a => a.name);

  console.log("[LBA Seed] Cleaning existing LBA data for idempotent re-seed...");
  try {
    if (allQuestionIds.length > 0) {
      await db.delete(quizAnswers).where(inArray(quizAnswers.questionId, allQuestionIds));
    }
    if (allQuizIds.length > 0) {
      await db.delete(quizQuestions).where(inArray(quizQuestions.quizId, allQuizIds));
      await db.delete(moduleQuizzes).where(inArray(moduleQuizzes.quizId, allQuizIds));
      await db.delete(quizzes).where(inArray(quizzes.id, allQuizIds));
    }
    if (moduleIds.length > 0) {
      await db.delete(trainingModuleSections).where(inArray(trainingModuleSections.moduleId, moduleIds));
      await db.delete(trainingModuleKeyPoints).where(inArray(trainingModuleKeyPoints.moduleId, moduleIds));
      await db.delete(trackModules).where(eq(trackModules.trackId, LBA_TRACK_ID));
      await db.delete(trainingModules).where(inArray(trainingModules.id, moduleIds));
    }
    if (achievementNames.length > 0) {
      await db.delete(achievements).where(inArray(achievements.name, achievementNames));
    }
    await db.delete(trainingTracks).where(eq(trainingTracks.id, LBA_TRACK_ID));
    console.log("[LBA Seed] Cleanup complete");
  } catch (e: any) {
    console.log("[LBA Seed] Cleanup note:", e.message?.substring(0, 100));
  }

  try {
    await db.insert(trainingTracks).values({
      id: LBA_TRACK_ID,
      title: "Live Blood Analysis Practitioner Certification",
      slug: "lba-practitioner-certification",
      description: "Comprehensive 17-module certification program covering dark field microscopy, pleomorphism, biological terrain, dry layer testing, blood mycology, zeta potential, parasitology, and practice management. Earn your FFPMA LBA Practitioner certificate upon completion.",
      totalModules: 17,
      estimatedDuration: "60 hours",
      difficulty: "advanced",
      isActive: true,
      requiresMembership: true,
    }).onConflictDoNothing();
    console.log("[LBA Seed] Created LBA training track");
  } catch (e: any) {
    console.log("[LBA Seed] Track may already exist:", e.message?.substring(0, 80));
  }

  for (const mod of LBA_MODULES) {
    try {
      const { sections, keyPoints, ...moduleData } = mod;
      await db.insert(trainingModules).values({
        ...moduleData,
        isActive: true,
        requiresMembership: true,
      }).onConflictDoNothing();
      console.log(`[LBA Seed] Created module: ${mod.title}`);

      await db.insert(trackModules).values({
        trackId: LBA_TRACK_ID,
        moduleId: mod.id,
        sortOrder: mod.sortOrder,
        isRequired: true,
      }).onConflictDoNothing();

      for (let i = 0; i < sections.length; i++) {
        await db.insert(trainingModuleSections).values({
          moduleId: mod.id,
          title: sections[i].title,
          content: sections[i].content,
          sortOrder: i + 1,
        }).onConflictDoNothing();
      }

      for (let i = 0; i < keyPoints.length; i++) {
        await db.insert(trainingModuleKeyPoints).values({
          moduleId: mod.id,
          point: keyPoints[i],
          sortOrder: i + 1,
        }).onConflictDoNothing();
      }
    } catch (e: any) {
      console.log(`[LBA Seed] Module ${mod.slug} may already exist:`, e.message?.substring(0, 80));
    }
  }

  for (const quizData of ALL_QUIZ_DATA) {
    try {
      await db.insert(quizzes).values({
        id: quizData.quizId,
        title: quizData.title,
        slug: quizData.slug,
        description: quizData.description,
        difficulty: "intermediate",
        passingScore: 80,
        questionsCount: quizData.questions.length,
        isActive: true,
        requiresMembership: true,
      }).onConflictDoNothing();
      console.log(`[LBA Seed] Created quiz: ${quizData.title}`);

      await db.insert(moduleQuizzes).values({
        moduleId: quizData.moduleId,
        quizId: quizData.quizId,
        sortOrder: 1,
        isRequired: true,
      }).onConflictDoNothing();

      for (const q of quizData.questions) {
        await db.insert(quizQuestions).values({
          id: q.id,
          quizId: quizData.quizId,
          questionText: q.text,
          questionType: "multiple_choice",
          explanation: q.explanation,
          sortOrder: quizData.questions.indexOf(q) + 1,
          points: 1,
          isActive: true,
        }).onConflictDoNothing();

        for (let a = 0; a < q.answers.length; a++) {
          await db.insert(quizAnswers).values({
            questionId: q.id,
            answerText: q.answers[a].text,
            isCorrect: q.answers[a].isCorrect,
            sortOrder: a + 1,
          }).onConflictDoNothing();
        }
      }
    } catch (e: any) {
      console.log(`[LBA Seed] Quiz ${quizData.slug} may already exist:`, e.message?.substring(0, 80));
    }
  }

  for (const achievement of LBA_ACHIEVEMENTS) {
    try {
      await db.insert(achievements).values(achievement).onConflictDoNothing();
      console.log(`[LBA Seed] Created achievement: ${achievement.name}`);
    } catch (e: any) {
      console.log(`[LBA Seed] Achievement ${achievement.name} may already exist:`, e.message?.substring(0, 80));
    }
  }

  console.log("[LBA Seed] LBA Certification Course seeding complete!");
}
