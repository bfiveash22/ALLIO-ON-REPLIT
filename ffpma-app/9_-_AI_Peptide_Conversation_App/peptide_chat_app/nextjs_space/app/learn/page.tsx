'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, GraduationCap, BookOpen, Stethoscope, CheckCircle, XCircle, ChevronRight, RotateCcw, Award } from 'lucide-react';

// Quiz Data
const quizzes = [
  {
    id: 'dosing',
    title: 'Dosing & Calculations',
    description: 'Test your knowledge on peptide dosing protocols',
    questions: [
      { q: 'A 5mg BPC-157 vial reconstituted with 2mL BAC water. What is the concentration?', options: ['2.5mg/mL', '5mg/mL', '10mg/mL', '1mg/mL'], correct: 0 },
      { q: 'For a 250mcg dose from a 5mg/mL solution, how many units on an insulin syringe?', options: ['5 units', '25 units', '50 units', '2.5 units'], correct: 0 },
      { q: 'Standard Ipamorelin dosing for anti-aging is:', options: ['50-100mcg daily', '200-300mcg before bed', '1mg twice daily', '500mcg weekly'], correct: 1 },
      { q: 'TB-500 loading phase typically involves:', options: ['Daily injections for 30 days', '4-6 weeks of 2-2.5mg twice weekly', '500mcg once weekly', '10mg single dose'], correct: 1 },
      { q: 'Semaglutide titration typically starts at:', options: ['0.25mg weekly', '1mg weekly', '2.4mg weekly', '0.5mg daily'], correct: 0 },
    ]
  },
  {
    id: 'reconstitution',
    title: 'Reconstitution Protocols',
    description: 'Master proper peptide reconstitution techniques',
    questions: [
      { q: 'Which peptide REQUIRES acetic acid water to prevent gelling?', options: ['BPC-157', 'IGF-1 LR3', 'Ipamorelin', 'Epithalon'], correct: 1 },
      { q: 'Bacteriostatic water contains what preservative?', options: ['Sodium chloride', 'Benzyl alcohol 0.9%', 'Acetic acid', 'Ethanol'], correct: 1 },
      { q: 'When reconstituting, you should:', options: ['Shake vigorously', 'Inject directly into powder', 'Let water run down vial side, swirl gently', 'Heat the vial first'], correct: 2 },
      { q: 'Reconstituted peptides should typically be stored:', options: ['Room temperature', 'Frozen at -20°C', 'Refrigerated 2-8°C', 'In direct sunlight'], correct: 2 },
      { q: 'GHRP-2 and GHRP-6 may gel in BAC water because:', options: ['They are too concentrated', 'They aggregate at neutral pH', 'BAC water is contaminated', 'They expire quickly'], correct: 1 },
    ]
  },
  {
    id: 'indications',
    title: 'Clinical Indications',
    description: 'Match peptides to their therapeutic applications',
    questions: [
      { q: 'Which peptide is FDA-approved for HIV-associated lipodystrophy?', options: ['BPC-157', 'Tesamorelin', 'TB-500', 'Epithalon'], correct: 1 },
      { q: 'For tendon/ligament injuries, the most commonly used peptide is:', options: ['Semaglutide', 'PT-141', 'BPC-157', 'Melanotan II'], correct: 2 },
      { q: 'Epithalon (Epitalon) primarily works by:', options: ['Stimulating GH release', 'Activating telomerase', 'Suppressing appetite', 'Increasing melanin'], correct: 1 },
      { q: 'For sexual dysfunction, which peptide is FDA-approved?', options: ['Oxytocin', 'Kisspeptin', 'PT-141 (Bremelanotide)', 'Melanotan II'], correct: 2 },
      { q: 'MOTS-C is classified as a:', options: ['Growth hormone secretagogue', 'Mitochondrial-derived peptide', 'Antimicrobial peptide', 'Melanocortin agonist'], correct: 1 },
    ]
  },
  {
    id: 'safety',
    title: 'Safety & Monitoring',
    description: 'Essential safety protocols for peptide therapy',
    questions: [
      { q: 'GH secretagogues should be monitored with:', options: ['CBC only', 'IGF-1 and fasting glucose', 'Liver enzymes only', 'No monitoring needed'], correct: 1 },
      { q: 'Semaglutide is contraindicated in patients with:', options: ['Diabetes', 'Personal/family history of MTC', 'Obesity', 'Hypertension'], correct: 1 },
      { q: 'LL-37 may initially cause:', options: ['Weight gain', 'Transient inflammation (Herxheimer-like)', 'Hair loss', 'Insomnia'], correct: 1 },
      { q: 'Melanotan II side effects commonly include:', options: ['Weight gain', 'Nausea, flushing, darkening of moles', 'Joint pain', 'Cognitive decline'], correct: 1 },
      { q: 'Before starting GH peptides, baseline labs should include:', options: ['IGF-1, fasting glucose, lipid panel', 'Only testosterone', 'Vitamin D only', 'No labs needed'], correct: 0 },
    ]
  },
  {
    id: 'im-injections',
    title: 'IM Injection Protocols',
    description: 'Master intramuscular injection techniques and common therapies',
    questions: [
      { q: 'The preferred IM injection site for larger volume injections (>2mL) is:', options: ['Deltoid', 'Ventrogluteal', 'Vastus lateralis', 'Rectus femoris'], correct: 1 },
      { q: 'Vitamin D3 IM injections are oil-based. What needle gauge is recommended?', options: ['29-31G (insulin syringe)', '21-23G', '18G', '25-27G'], correct: 1 },
      { q: 'High-dose Biotin supplementation can interfere with which lab tests?', options: ['CBC only', 'Liver enzymes', 'Thyroid, troponin, and hormone tests', 'Kidney function only'], correct: 2 },
      { q: 'In lipotropic MIC + B12 injections, what does MIC stand for?', options: ['Methionine, Iodine, Carnitine', 'Methionine, Inositol, Choline', 'Magnesium, Inositol, Chromium', 'Methionine, Iron, Calcium'], correct: 1 },
      { q: 'NAD+ IM injections offer what advantage over IV NAD+?', options: ['Higher absorption', 'No 2-4 hour infusion time required', 'Lower cost', 'Fewer side effects at injection site'], correct: 1 },
    ]
  },
  {
    id: 'im-safety',
    title: 'IM Therapy Safety',
    description: 'Safety protocols and contraindications for IM therapies',
    questions: [
      { q: 'PCC lipolytic (Lipo Lab) injections should be spaced in a grid pattern at what distance?', options: ['0.5 cm apart', '1-1.5 cm apart', '3 cm apart', '5 cm apart'], correct: 1 },
      { q: 'Which IM therapy is contraindicated in patients with Leber\'s hereditary optic neuropathy?', options: ['Glutathione', 'Vitamin B12', 'NAD+', 'CoQ10'], correct: 1 },
      { q: 'Glutathione IM should be used with caution in which patient population?', options: ['Diabetics', 'Asthmatics', 'Hypertensive patients', 'Athletes'], correct: 1 },
      { q: 'When using CoQ10 IM, which medication interaction requires monitoring?', options: ['Metformin', 'Warfarin (monitor INR)', 'Omeprazole', 'Lisinopril'], correct: 1 },
      { q: 'Tri-Immune Boost injections may cause burning at the injection site due to:', options: ['Zinc sulfate', 'Glutathione', 'Ascorbic acid (Vitamin C)', 'Preservatives'], correct: 2 },
    ]
  }
];

// Tutorial Data
const tutorials = [
  {
    id: 'reconstitution-101',
    title: 'Peptide Reconstitution 101',
    duration: '5 min',
    steps: [
      { title: 'Gather Supplies', content: 'You\'ll need: lyophilized peptide vial, bacteriostatic water (or acetic acid for IGF-1/GHRP), alcohol swabs, insulin syringes (29-31G), and a sharps container.' },
      { title: 'Calculate Volume', content: 'Use the dosing calculator. For easy math: 5mg vial + 1mL BAC = 5mg/mL. For 250mcg dose = 0.05mL = 5 units on insulin syringe.' },
      { title: 'Prep the Vials', content: 'Wipe both vial tops with alcohol swabs. Let dry completely. Remove plastic caps if present.' },
      { title: 'Draw BAC Water', content: 'Insert syringe into BAC water vial, invert, draw desired volume. Remove air bubbles by tapping and pushing plunger.' },
      { title: 'Add to Peptide', content: 'Insert needle into peptide vial at an angle. Let water slowly run down the inside wall—NEVER spray directly onto powder. This prevents damage.' },
      { title: 'Mix Gently', content: 'DO NOT SHAKE. Gently roll the vial between your palms or let sit 5-10 minutes. Swirl gently if needed. Solution should be clear.' },
      { title: 'Storage', content: 'Store reconstituted peptides at 2-8°C (refrigerator). Most stable for 3-4 weeks. Label with date and concentration.' },
    ]
  },
  {
    id: 'subq-injection',
    title: 'Subcutaneous Injection Technique',
    duration: '4 min',
    steps: [
      { title: 'Site Selection', content: 'Common sites: abdominal fat (2 inches from navel), thigh, or upper arm. Rotate injection sites to prevent lipohypertrophy.' },
      { title: 'Prepare', content: 'Wash hands thoroughly. Clean injection site with alcohol swab in circular motion. Let dry completely (30 seconds).' },
      { title: 'Draw Peptide', content: 'Wipe vial top with alcohol. Insert needle, invert vial, draw calculated dose. Remove air bubbles.' },
      { title: 'Pinch Skin', content: 'Pinch 1-2 inches of skin between thumb and forefinger. This lifts subcutaneous tissue away from muscle.' },
      { title: 'Insert Needle', content: 'Insert needle at 45-90° angle (45° for thin patients, 90° for more adipose tissue). Quick, smooth motion.' },
      { title: 'Inject', content: 'Release pinch. Inject slowly over 5-10 seconds. This reduces discomfort and improves absorption.' },
      { title: 'Remove & Dispose', content: 'Withdraw needle quickly. Apply gentle pressure with cotton ball if needed. Dispose syringe in sharps container.' },
    ]
  },
  {
    id: 'gh-protocol',
    title: 'Designing GH Peptide Protocols',
    duration: '6 min',
    steps: [
      { title: 'Patient Assessment', content: 'Evaluate: age, goals (anti-aging vs performance), baseline IGF-1, fasting glucose, current medications, and contraindications.' },
      { title: 'Select Peptide(s)', content: 'Options: Ipamorelin (cleanest), CJC-1295/Ipamorelin (longer pulse), Tesamorelin (FDA-approved), or GHRP-2/6 (stronger but more sides).' },
      { title: 'Timing Matters', content: 'GH secretagogues work best: fasted state (2+ hours post-meal), before bed, or morning. Avoid carbs/fats 30 min before/after.' },
      { title: 'Starting Protocol', content: 'Conservative start: 100-200mcg Ipamorelin before bed x 4 weeks. Assess tolerance, then increase to 200-300mcg if needed.' },
      { title: 'Monitoring', content: 'Check IGF-1 at 4-6 weeks. Target: upper third of reference range. Monitor fasting glucose, joint symptoms, water retention.' },
      { title: 'Cycling', content: 'Standard: 5 days on/2 days off, or 8-12 weeks on/4 weeks off. This prevents receptor desensitization and maintains efficacy.' },
      { title: 'Adjustments', content: 'If IGF-1 too high: reduce dose. Joint pain: reduce dose or add BPC-157. Poor response: ensure fasted timing, consider combination.' },
    ]
  },
  {
    id: 'weight-loss-protocol',
    title: 'GLP-1 Weight Loss Protocols',
    duration: '5 min',
    steps: [
      { title: 'Patient Selection', content: 'Ideal candidates: BMI ≥27 with comorbidity or BMI ≥30. Rule out: MTC history, MEN2, pancreatitis history, pregnancy.' },
      { title: 'Choose Agent', content: 'Semaglutide: well-studied, weekly. Tirzepatide: dual GIP/GLP-1, potentially more effective. Retatrutide: triple agonist (research).' },
      { title: 'Semaglutide Titration', content: 'Week 1-4: 0.25mg weekly. Week 5-8: 0.5mg. Week 9-12: 1mg. Week 13+: 1.7-2.4mg as tolerated. Slower titration reduces GI sides.' },
      { title: 'Managing Side Effects', content: 'Nausea: eat smaller meals, avoid fatty foods, stay hydrated. Constipation: fiber, hydration, consider stool softener.' },
      { title: 'Dietary Guidance', content: 'Protein-first eating (prevents muscle loss), minimum 0.8-1g/lb protein. Hydration critical. Consider multivitamin.' },
      { title: 'Monitoring', content: 'Check: weight weekly, A1C quarterly, lipids, liver enzymes. Watch for rapid gallbladder issues with fast weight loss.' },
      { title: 'Maintenance', content: 'Most patients need ongoing therapy. If stopping, taper slowly and implement lifestyle maintenance to prevent regain.' },
    ]
  },
  {
    id: 'im-injection-technique',
    title: 'Intramuscular Injection Technique',
    duration: '5 min',
    steps: [
      { title: 'Site Selection', content: 'Ventrogluteal (preferred for most IM): Locate greater trochanter, place palm on it, point index finger toward anterior iliac spine, spread middle finger toward iliac crest—inject in the V formed. Deltoid: 2-3 finger widths below acromion process, good for volumes ≤1mL. Vastus lateralis: Outer middle third of thigh, self-injection friendly.' },
      { title: 'Equipment Selection', content: 'Needle gauge: 21-23G for oil-based (Vitamin D3, CoQ10), 25G for aqueous solutions (B12, Glutathione). Length: 1-1.5 inch depending on patient size. Use a larger gauge to draw up viscous solutions, then switch to smaller gauge for injection if needed.' },
      { title: 'Aspiration Debate', content: 'Traditional teaching recommended aspirating before IM injection. Current evidence: CDC and WHO no longer recommend aspiration for vaccine IM injections. For ventrogluteal and deltoid, aspiration is optional. Some practitioners still prefer it for larger volumes or when near vascular areas.' },
      { title: 'Z-Track Technique', content: 'Essential for oil-based injections (D3, CoQ10) to prevent medication tracking back through tissues. Pull skin laterally 1-2 cm, insert needle, inject slowly, wait 10 seconds, withdraw needle, then release skin. This creates a zigzag path that seals medication in muscle.' },
      { title: 'Injection Speed', content: 'Inject slowly: 1mL per 10 seconds for most solutions. For Vitamin C-containing products (Tri-Immune), inject even slower (60-90 seconds) to minimize burning. For viscous oil-based injections, steady slow pressure is key—don\'t force it.' },
      { title: 'Post-Injection Care', content: 'Apply light pressure with gauze—do not massage (especially oil-based medications). Bandage if bleeding. Document: site used, date, and any reactions. Rotate sites to prevent tissue damage. Advise patients about expected temporary soreness.' },
      { title: 'Patient Education', content: 'Explain expected timeline for results: Energy injections (B12, B-complex) may work within 24-48 hours. Hair/nail support (Biotin) takes 3-4 months. Fat reduction (PCC) results visible after inflammation subsides (4-6 weeks). Set realistic expectations.' },
    ]
  },
  {
    id: 'lipotropic-weight-loss',
    title: 'Lipotropic IM for Weight Loss',
    duration: '5 min',
    steps: [
      { title: 'Patient Selection', content: 'Ideal candidates: Patients actively engaged in caloric restriction and exercise. BMI ≥25 with metabolic goals. Those with sluggish metabolism or plateau in weight loss. Lipotropics work best as an adjunct, not standalone therapy.' },
      { title: 'Understanding MIC', content: 'Methionine: Essential amino acid that helps break down fat and prevents fat accumulation in liver. Inositol: B-vitamin-like compound that aids fat metabolism and supports cell membrane function. Choline: Emulsifies cholesterol and fat, prevents fatty liver, supports acetylcholine production.' },
      { title: 'Protocol Design', content: 'Basic MIC+B12: Weekly during active weight loss. Lipo-Mino Mix (MIC+Carnitine+B vitamins): 1-2x weekly for enhanced results. Often combined with GLP-1 agonists (Semaglutide/Tirzepatide) in comprehensive protocols. Give in morning or early afternoon—energizing effect may disrupt sleep if given late.' },
      { title: 'Injection Administration', content: 'Standard dose: 1-2 mL IM weekly. Site: Deltoid or gluteal, rotate weekly. Pre-mixed solutions—no reconstitution needed. Protect from light (B vitamins degrade). Check for particulates before injection.' },
      { title: 'Supporting the Patient', content: 'Lipotropics enhance but don\'t replace lifestyle changes. Emphasize: Protein intake (0.8-1g per pound body weight), hydration (half body weight in ounces), and 3-5 days/week physical activity. Some patients notice improved mental clarity and mood—the B12 effect.' },
      { title: 'Monitoring Progress', content: 'Track: Weight weekly, body measurements monthly (waist, hips, thighs), energy levels, mood. Consider liver enzymes every 3-6 months with prolonged use. Photos for documentation. Typical weight loss: 1-2 lbs/week with proper diet and exercise.' },
      { title: 'Managing Expectations', content: 'Lipotropics are metabolic support, not magic shots. Results require commitment to lifestyle changes. If no progress after 4-6 weeks, reassess diet compliance, activity level, thyroid function, and insulin resistance. May need to add or adjust other therapies.' },
    ]
  }
];

// Case Studies
const caseStudies = [
  {
    id: 'case-1',
    title: 'Chronic Tendinopathy',
    scenario: '45-year-old male athlete with chronic Achilles tendinopathy x 18 months. Failed PT, NSAIDs, and PRP. MRI shows partial tear with degeneration.',
    question: 'Which peptide protocol would you recommend?',
    options: [
      { text: 'Semaglutide 1mg weekly', rationale: 'Incorrect. Semaglutide is for metabolic conditions, not tissue repair.' },
      { text: 'BPC-157 250mcg 2x daily + TB-500 2.5mg 2x weekly x 8 weeks', rationale: 'Correct! BPC-157 promotes tendon healing via growth factor upregulation. TB-500 provides systemic regeneration and angiogenesis. Combined protocol addresses both local and systemic repair pathways.' },
      { text: 'Epithalon 5mg daily x 10 days', rationale: 'Incorrect. Epithalon is for longevity/telomerase activation, not acute tissue repair.' },
      { text: 'PT-141 1mg as needed', rationale: 'Incorrect. PT-141 is for sexual dysfunction, not tissue healing.' },
    ],
    correct: 1,
    keyPoints: ['BPC-157 has strong evidence for tendon healing', 'TB-500 synergizes by promoting angiogenesis', 'Local injection near injury site preferred for BPC-157', 'Consider 6-8 week protocol minimum for chronic injuries']
  },
  {
    id: 'case-2',
    title: 'Metabolic Optimization',
    scenario: '52-year-old female, BMI 34, pre-diabetic (A1C 6.2%), fatigue, poor sleep, declining muscle mass. Interested in comprehensive metabolic optimization.',
    question: 'What would be the most appropriate initial protocol?',
    options: [
      { text: 'Melanotan II for appetite suppression', rationale: 'Incorrect. MT2 is for tanning/sexual function. Appetite suppression is a side effect, not primary indication.' },
      { text: 'Tirzepatide 2.5mg weekly titrating up + Ipamorelin 200mcg nightly', rationale: 'Correct! Tirzepatide addresses metabolic syndrome, insulin resistance, and weight. Ipamorelin supports muscle preservation, sleep quality, and metabolic rate. Start low and titrate.' },
      { text: 'HGH 4IU daily', rationale: 'Partially correct but aggressive. Direct HGH at this dose may worsen insulin resistance initially. Secretagogues are gentler for metabolic patients.' },
      { text: 'BPC-157 only', rationale: 'Incorrect. BPC-157 is for tissue repair, not metabolic optimization.' },
    ],
    correct: 1,
    keyPoints: ['Tirzepatide is highly effective for metabolic syndrome', 'GH secretagogues preserve muscle during weight loss', 'Monitor fasting glucose closely when combining', 'Lifestyle intervention remains foundation']
  },
  {
    id: 'case-3',
    title: 'Anti-Aging Protocol',
    scenario: '62-year-old male executive seeking longevity optimization. Generally healthy, mild cognitive decline, poor sleep, wants evidence-based anti-aging approach.',
    question: 'Design an appropriate longevity-focused peptide protocol:',
    options: [
      { text: 'Retatrutide 5mg weekly for weight loss', rationale: 'Incorrect. Patient is not described as overweight. Retatrutide is metabolic-focused, not longevity-specific.' },
      { text: 'Epithalon 5mg daily x 20 days + Semax 600mcg intranasal + Ipamorelin 200mcg nightly', rationale: 'Correct! Epithalon activates telomerase (Khavinson protocol). Semax provides neuroprotection and cognitive support. Ipamorelin improves sleep and GH pulsatility. Comprehensive longevity approach.' },
      { text: 'TB-500 10mg weekly', rationale: 'Incorrect. TB-500 is for tissue regeneration, not primary longevity intervention.' },
      { text: 'Semaglutide 2.4mg weekly', rationale: 'Incorrect. Semaglutide is weight-focused. Patient needs cognitive and longevity support, not primarily metabolic.' },
    ],
    correct: 1,
    keyPoints: ['Epithalon is the gold standard for telomerase activation', 'Khavinson bioregulators have 30+ years of research', 'Semax supports BDNF and cognitive function', 'GH optimization supports overall vitality']
  },
  {
    id: 'case-4',
    title: 'Post-Surgical Recovery',
    scenario: '38-year-old female, 2 weeks post rotator cuff repair surgery. Surgeon cleared for adjunctive therapies. Wants to accelerate healing and return to activity.',
    question: 'What peptide protocol would optimize surgical recovery?',
    options: [
      { text: 'Semaglutide for inflammation reduction', rationale: 'Incorrect. Semaglutide is metabolic, not wound healing focused.' },
      { text: 'BPC-157 500mcg 2x daily near site + TB-500 2.5mg 2x weekly + GHK-Cu topical', rationale: 'Correct! BPC-157 accelerates surgical wound healing. TB-500 provides systemic regeneration. GHK-Cu supports collagen synthesis and scar reduction. Comprehensive post-surgical protocol.' },
      { text: 'PT-141 for pain management', rationale: 'Incorrect. PT-141 has no analgesic or healing properties.' },
      { text: 'Epithalon 10mg IV daily', rationale: 'Incorrect. Epithalon is for longevity, not acute surgical recovery.' },
    ],
    correct: 1,
    keyPoints: ['BPC-157 has strong evidence for surgical wound healing', 'TB-500 promotes systemic recovery and angiogenesis', 'GHK-Cu supports collagen and reduces scarring', 'Start within first 2 weeks post-surgery for best results']
  },
  {
    id: 'case-5',
    title: 'Weight Loss Plateau (IM Protocol)',
    scenario: '42-year-old female on Semaglutide 1mg weekly x 12 weeks. Lost 25 lbs initially but hit a plateau for 4 weeks. Energy levels declining, mood low. Labs normal except Vitamin D 22 ng/mL (low). Wants to reinvigorate weight loss without increasing Semaglutide dose.',
    question: 'What IM adjunct protocol would you recommend?',
    options: [
      { text: 'PCC lipolytic injections to problem areas', rationale: 'Partially correct. PCC works for localized fat but doesn\'t address the systemic metabolic plateau, low energy, or Vitamin D deficiency.' },
      { text: 'Lipo-Mino Mix 2mL IM twice weekly + Vitamin D3 100,000 IU IM loading + B12 1000mcg IM weekly', rationale: 'Correct! Lipo-Mino Mix provides L-Carnitine for fat burning, MIC for liver support, and B vitamins for energy. Vitamin D3 IM corrects deficiency that may be contributing to fatigue and metabolic slowdown. Weekly B12 boosts energy and mood. This comprehensive approach addresses multiple factors without increasing GLP-1 dose.' },
      { text: 'NAD+ 250mg IM daily for 2 weeks', rationale: 'Partially correct. NAD+ would help energy but is expensive, doesn\'t address Vitamin D deficiency, and daily IM injections may be impractical.' },
      { text: 'Increase Semaglutide to 2.4mg weekly', rationale: 'Not optimal first step. Increasing GLP-1 dose often increases side effects without proportional weight loss. Address other factors first.' },
    ],
    correct: 1,
    keyPoints: ['Weight loss plateaus often have multiple contributing factors', 'Vitamin D deficiency is common and affects metabolism/energy', 'Lipotropics complement GLP-1 therapy by supporting fat metabolism', 'Address nutritional deficiencies before increasing primary medication doses']
  },
  {
    id: 'case-6',
    title: 'Immune Support Protocol (IM)',
    scenario: '55-year-old male healthcare worker, history of recurrent respiratory infections (4-5x/year), chronically fatigued. Works long hours in hospital setting. Labs: Vitamin D 18 ng/mL, B12 low-normal at 280 pg/mL. Requesting proactive immune support during flu season.',
    question: 'Design an appropriate IM immune support protocol:',
    options: [
      { text: 'CoQ10 100mg IM weekly for mitochondrial support', rationale: 'Incorrect focus. CoQ10 is more appropriate for cardiovascular/statin patients. This patient needs immune-specific support and deficiency correction.' },
      { text: 'Vitamin D3 300,000 IU IM loading + Tri-Immune Boost weekly during flu season + Super B Complex IM bi-weekly', rationale: 'Correct! High-dose Vitamin D3 IM rapidly corrects severe deficiency (sustained release over months). Tri-Immune Boost (Vitamin C + Glutathione + Zinc) provides weekly antioxidant and immune fortification during high-risk exposure. Super B Complex addresses borderline B12 and provides comprehensive energy support for demanding work schedule.' },
      { text: 'Biotin 5000mcg IM weekly', rationale: 'Incorrect. Biotin is for hair/skin/nails, not immune support. Does not address this patient\'s needs.' },
      { text: 'Glutathione 400mg IM only', rationale: 'Partially correct. Glutathione is an antioxidant but alone doesn\'t address Vitamin D deficiency or provide comprehensive immune support.' },
    ],
    correct: 1,
    keyPoints: ['Healthcare workers benefit from proactive immune protocols during high-exposure seasons', 'Vitamin D deficiency significantly impairs immune function—correct aggressively', 'Tri-Immune Boost combines synergistic immune nutrients', 'B-complex supports energy for demanding schedules and addresses borderline deficiencies']
  }
];

export default function LearnPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<'quizzes' | 'tutorials' | 'cases'>('quizzes');
  const [selectedQuiz, setSelectedQuiz] = useState<typeof quizzes[0] | null>(null);
  const [selectedTutorial, setSelectedTutorial] = useState<typeof tutorials[0] | null>(null);
  const [selectedCase, setSelectedCase] = useState<typeof caseStudies[0] | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [caseAnswer, setCaseAnswer] = useState<number | null>(null);
  const [showCaseResult, setShowCaseResult] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  if (status === 'loading') return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full" /></div>;

  const handleAnswer = (answerIndex: number) => {
    const newAnswers = [...answers, answerIndex];
    setAnswers(newAnswers);
    if (currentQuestion < (selectedQuiz?.questions.length || 0) - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setShowResults(false);
  };

  const score = selectedQuiz ? answers.filter((a, i) => a === selectedQuiz.questions[i].correct).length : 0;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 glass border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" /><span>Back</span>
          </Link>
          <div className="flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-cyan-400" />
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Learning Center</span>
          </div>
          <div className="w-20" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-8 flex-wrap">
          <button onClick={() => { setActiveSection('quizzes'); setSelectedQuiz(null); }} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition ${activeSection === 'quizzes' ? 'bg-cyan-500 text-white' : 'bg-slate-800 hover:bg-slate-700'}`}>
            <GraduationCap className="w-5 h-5" />Quizzes
          </button>
          <button onClick={() => { setActiveSection('tutorials'); setSelectedTutorial(null); }} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition ${activeSection === 'tutorials' ? 'bg-cyan-500 text-white' : 'bg-slate-800 hover:bg-slate-700'}`}>
            <BookOpen className="w-5 h-5" />Tutorials
          </button>
          <button onClick={() => { setActiveSection('cases'); setSelectedCase(null); }} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition ${activeSection === 'cases' ? 'bg-cyan-500 text-white' : 'bg-slate-800 hover:bg-slate-700'}`}>
            <Stethoscope className="w-5 h-5" />Case Studies
          </button>
        </div>

        {/* QUIZZES SECTION */}
        {activeSection === 'quizzes' && !selectedQuiz && (
          <div className="grid md:grid-cols-2 gap-6">
            {quizzes.map(quiz => (
              <motion.div key={quiz.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onClick={() => { setSelectedQuiz(quiz); resetQuiz(); }} className="glass rounded-2xl p-6 cursor-pointer hover:shadow-xl hover:shadow-cyan-500/10 transition group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center"><GraduationCap className="w-6 h-6 text-white" /></div>
                  <div>
                    <h3 className="text-xl font-bold group-hover:text-cyan-400 transition">{quiz.title}</h3>
                    <p className="text-sm text-slate-400">{quiz.questions.length} questions</p>
                  </div>
                </div>
                <p className="text-slate-400">{quiz.description}</p>
              </motion.div>
            ))}
          </div>
        )}

        {activeSection === 'quizzes' && selectedQuiz && !showResults && (
          <div className="max-w-2xl mx-auto">
            <div className="glass rounded-2xl p-8">
              <div className="flex justify-between items-center mb-6">
                <span className="text-sm text-slate-400">Question {currentQuestion + 1} of {selectedQuiz.questions.length}</span>
                <div className="flex gap-1">{selectedQuiz.questions.map((_, i) => (<div key={i} className={`w-3 h-3 rounded-full ${i < currentQuestion ? 'bg-cyan-500' : i === currentQuestion ? 'bg-cyan-400 animate-pulse' : 'bg-slate-700'}`} />))}</div>
              </div>
              <h2 className="text-xl font-bold mb-6">{selectedQuiz.questions[currentQuestion].q}</h2>
              <div className="space-y-3">
                {selectedQuiz.questions[currentQuestion].options.map((opt, i) => (
                  <button key={i} onClick={() => handleAnswer(i)} className="w-full text-left p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500 transition">{opt}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'quizzes' && selectedQuiz && showResults && (
          <div className="max-w-2xl mx-auto">
            <div className="glass rounded-2xl p-8 text-center">
              <Award className={`w-20 h-20 mx-auto mb-4 ${score >= 4 ? 'text-yellow-400' : score >= 3 ? 'text-cyan-400' : 'text-slate-400'}`} />
              <h2 className="text-3xl font-bold mb-2">Quiz Complete!</h2>
              <p className="text-5xl font-bold text-cyan-400 mb-2">{score}/{selectedQuiz.questions.length}</p>
              <p className="text-slate-400 mb-6">{score === 5 ? 'Perfect! Expert level.' : score >= 4 ? 'Excellent work!' : score >= 3 ? 'Good job! Review missed questions.' : 'Keep studying!'}</p>
              <div className="space-y-3 text-left mb-6">
                {selectedQuiz.questions.map((q, i) => (
                  <div key={i} className={`p-4 rounded-xl ${answers[i] === q.correct ? 'bg-emerald-500/20 border border-emerald-500/50' : 'bg-red-500/20 border border-red-500/50'}`}>
                    <div className="flex items-start gap-2">
                      {answers[i] === q.correct ? <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5" /> : <XCircle className="w-5 h-5 text-red-400 mt-0.5" />}
                      <div>
                        <p className="font-medium text-sm">{q.q}</p>
                        <p className="text-sm text-slate-400">Correct: {q.options[q.correct]}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 justify-center">
                <button onClick={resetQuiz} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition"><RotateCcw className="w-4 h-4" />Retry</button>
                <button onClick={() => setSelectedQuiz(null)} className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 transition">All Quizzes</button>
              </div>
            </div>
          </div>
        )}

        {/* TUTORIALS SECTION */}
        {activeSection === 'tutorials' && !selectedTutorial && (
          <div className="grid md:grid-cols-2 gap-6">
            {tutorials.map(tut => (
              <motion.div key={tut.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onClick={() => { setSelectedTutorial(tut); setTutorialStep(0); }} className="glass rounded-2xl p-6 cursor-pointer hover:shadow-xl hover:shadow-purple-500/10 transition group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center"><BookOpen className="w-6 h-6 text-white" /></div>
                  <div>
                    <h3 className="text-xl font-bold group-hover:text-purple-400 transition">{tut.title}</h3>
                    <p className="text-sm text-slate-400">{tut.steps.length} steps • {tut.duration}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeSection === 'tutorials' && selectedTutorial && (
          <div className="max-w-3xl mx-auto">
            <div className="glass rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-6">{selectedTutorial.title}</h2>
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {selectedTutorial.steps.map((_, i) => (
                  <button key={i} onClick={() => setTutorialStep(i)} className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${i === tutorialStep ? 'bg-purple-500 text-white' : i < tutorialStep ? 'bg-purple-500/30 text-purple-300' : 'bg-slate-800'}`}>Step {i + 1}</button>
                ))}
              </div>
              <div className="bg-slate-800/50 rounded-xl p-6 mb-6">
                <h3 className="text-xl font-bold text-purple-400 mb-3">{selectedTutorial.steps[tutorialStep].title}</h3>
                <p className="text-slate-300 leading-relaxed">{selectedTutorial.steps[tutorialStep].content}</p>
              </div>
              <div className="flex justify-between">
                <button onClick={() => setTutorialStep(Math.max(0, tutorialStep - 1))} disabled={tutorialStep === 0} className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 transition">Previous</button>
                {tutorialStep < selectedTutorial.steps.length - 1 ? (
                  <button onClick={() => setTutorialStep(tutorialStep + 1)} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-500 hover:bg-purple-600 transition">Next<ChevronRight className="w-4 h-4" /></button>
                ) : (
                  <button onClick={() => setSelectedTutorial(null)} className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 transition">Complete ✓</button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CASE STUDIES SECTION */}
        {activeSection === 'cases' && !selectedCase && (
          <div className="grid md:grid-cols-2 gap-6">
            {caseStudies.map(cs => (
              <motion.div key={cs.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onClick={() => { setSelectedCase(cs); setCaseAnswer(null); setShowCaseResult(false); }} className="glass rounded-2xl p-6 cursor-pointer hover:shadow-xl hover:shadow-amber-500/10 transition group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center"><Stethoscope className="w-6 h-6 text-white" /></div>
                  <h3 className="text-xl font-bold group-hover:text-amber-400 transition">{cs.title}</h3>
                </div>
                <p className="text-slate-400 text-sm line-clamp-2">{cs.scenario}</p>
              </motion.div>
            ))}
          </div>
        )}

        {activeSection === 'cases' && selectedCase && (
          <div className="max-w-3xl mx-auto">
            <div className="glass rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-4">{selectedCase.title}</h2>
              <div className="bg-slate-800/50 rounded-xl p-6 mb-6">
                <h3 className="text-sm font-medium text-amber-400 mb-2">CLINICAL SCENARIO</h3>
                <p className="text-slate-300">{selectedCase.scenario}</p>
              </div>
              <h3 className="font-bold mb-4">{selectedCase.question}</h3>
              <div className="space-y-3 mb-6">
                {selectedCase.options.map((opt, i) => (
                  <button key={i} onClick={() => { setCaseAnswer(i); setShowCaseResult(true); }} disabled={showCaseResult} className={`w-full text-left p-4 rounded-xl border transition ${showCaseResult ? (i === selectedCase.correct ? 'bg-emerald-500/20 border-emerald-500' : caseAnswer === i ? 'bg-red-500/20 border-red-500' : 'bg-slate-800 border-slate-700') : 'bg-slate-800 border-slate-700 hover:border-amber-500'}`}>
                    <p className="font-medium">{opt.text}</p>
                    {showCaseResult && <p className="text-sm text-slate-400 mt-2">{opt.rationale}</p>}
                  </button>
                ))}
              </div>
              {showCaseResult && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 mb-6">
                  <h4 className="font-bold text-amber-400 mb-2">Key Learning Points</h4>
                  <ul className="space-y-1">{selectedCase.keyPoints.map((pt, i) => (<li key={i} className="text-slate-300 text-sm">• {pt}</li>))}</ul>
                </div>
              )}
              <button onClick={() => setSelectedCase(null)} className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition">Back to Cases</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
