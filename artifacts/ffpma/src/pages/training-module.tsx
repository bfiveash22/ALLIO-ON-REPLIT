import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  BookOpen, 
  Clock, 
  ArrowLeft,
  Download,
  FileText,
  CheckCircle2,
  Shield,
  Scale,
  Users,
  AlertCircle,
  HelpCircle,
  GraduationCap,
  Dna,
  FlaskConical,
  Loader2,
} from "lucide-react";
import type { TrainingModule } from "@shared/schema";
import { InteractiveQuiz, AITutor, ECS_QUIZ, type QuizQuestion } from "@/components/InteractiveQuiz";
import { InteractiveTrainingPlayer, AudioNarrationButton } from "@/components/InteractiveTrainingPlayer";
import { EnhancedInteractiveModule } from "@/components/EnhancedInteractiveModule";
import { getKnowledgeChecksForModule, hasKnowledgeCheck } from "@shared/training-knowledge-checks";

function isPlaceholderVideoUrl(url?: string | null): boolean {
  if (!url) return true;
  const placeholderPatterns = [
    /1VIDEO_/,
    /_VIDEO$/,
    /_VIDEO"/,
    /VIDEO_ECS/,
    /VIDEO_CB/,
    /VIDEO_ENDO/,
    /VIDEO_CECD/,
    /VIDEO_SUPPORT$/,
    /VIDEO_NEURO/,
    /VIDEO_IMMUNE/,
    /VIDEO_ASSESSMENT/,
    /VIDEO_PHYTO/,
    /VIDEO_TERPENES/,
    /VIDEO_DOSING/,
    /VIDEO_INTERACTIONS/,
    /VIDEO_EXAM/,
    /VIDEO_WELCOME/,
    /VIDEO_NAV/,
    /VIDEO_PRODUCTS/,
    /VIDEO_SUPPORT_SKILLS/,
    /VIDEO_COMPLIANCE/,
    /VIDEO_DOC/,
    /VIDEO_INTAKE/,
    /VIDEO_LBA/,
    /VIDEO_PRESCRIBING/,
    /VIDEO_REFERRALS/,
    /VIDEO_AI_AGENTS/,
    /VIDEO_CASES/,
    /VIDEO_RESEARCH/,
    /VIDEO_COMPLEX/,
    /VIDEO_COMPOUNDING/,
    /VIDEO_EMERGING/,
  ];
  return placeholderPatterns.some(p => p.test(url));
}

function getDifficultyColor(difficulty: string | null) {
  switch (difficulty) {
    case "beginner": return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400";
    case "intermediate": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "advanced": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    default: return "bg-muted text-muted-foreground";
  }
}

function getModuleIcon(slug: string) {
  if (slug.startsWith("peptide-") || slug.startsWith("ppm-")) return <Dna className="h-6 w-6" />;
  if (slug.startsWith("diet-") || slug.includes("nutrition") || slug.includes("cancer")) return <FlaskConical className="h-6 w-6" />;
  if (slug.startsWith("ancient-")) return <BookOpen className="h-6 w-6" />;
  if (slug.startsWith("fa-")) return <FlaskConical className="h-6 w-6" />;
  switch (slug) {
    case "pma-law": return <Scale className="h-6 w-6" />;
    case "constitutional-protections": return <Shield className="h-6 w-6" />;
    case "ff-handbook": return <BookOpen className="h-6 w-6" />;
    default: return <FileText className="h-6 w-6" />;
  }
}

const moduleContent: Record<string, {
  sections: Array<{ title: string; content: string }>;
  pdfUrl?: string;
  keyPoints?: string[];
  videoUrl?: string;
  interactiveElements?: Array<{ type: string; title: string; data?: any }>;
}> = {
  // ========== ECS FOUNDATIONS MODULES ==========
  "ecs-101-discovery": {
    sections: [
      {
        title: "A Revolutionary Discovery",
        content: "In the early 1990s, researchers made a groundbreaking discovery while studying how cannabis affects the human body. They found an entirely new biological system - the Endocannabinoid System (ECS) - that had been operating silently in our bodies for millions of years."
      },
      {
        title: "The Research That Changed Everything",
        content: "Israeli scientist Dr. Raphael Mechoulam, often called the 'father of cannabis research,' led the team that first identified the brain's cannabinoid receptors in 1988, and then in 1992 discovered anandamide - the first known endocannabinoid. This opened a new chapter in understanding human physiology."
      },
      {
        title: "Why It's Called the 'Master Regulator'",
        content: "The ECS doesn't just affect one body system - it regulates nearly all of them. From your mood to your sleep, from pain perception to immune function, from appetite to memory, the ECS works constantly to maintain balance. This is why it's earned the title of 'master regulatory system.'"
      },
      {
        title: "Every Vertebrate Has an ECS",
        content: "This isn't just a human system. Every animal with a backbone - from fish to birds to mammals - has an Endocannabinoid System. This ancient system evolved over 500 million years ago, demonstrating its fundamental importance to life."
      },
      {
        title: "Why Medicine Forgot This System",
        content: "Despite being one of the most important biological discoveries of the 20th century, the ECS is rarely taught in medical schools. The political controversy around cannabis created a 'research gap' that we're only now beginning to close. Understanding the ECS is essential for modern healthcare."
      }
    ],
    keyPoints: [
      "Discovered in the 1990s by Dr. Raphael Mechoulam's team",
      "Controls virtually every major body system",
      "Found in all vertebrates - 500 million years old",
      "Regulates homeostasis - the body's internal balance",
      "Massively understudied despite its critical importance"
    ],
    videoUrl: "https://drive.google.com/file/d/ECS_DISCOVERY_VIDEO"
  },
  "ecs-102-receptors": {
    sections: [
      {
        title: "The Two Main Receptor Types",
        content: "Your Endocannabinoid System communicates through two main receptor types: CB1 and CB2. Think of these receptors as locks, and cannabinoids (both from your body and from plants) as keys that activate them."
      },
      {
        title: "CB1 Receptors: The Brain's Regulators",
        content: "CB1 receptors are the most abundant G protein-coupled receptors in the brain. They're concentrated in areas controlling pain, mood, memory, appetite, and motor function. When activated, they modulate neurotransmitter release - essentially fine-tuning brain communication."
      },
      {
        title: "CB2 Receptors: The Immune Modulators",
        content: "CB2 receptors are primarily found in the immune system, spleen, tonsils, and bone cells. They play crucial roles in regulating inflammation, immune cell activity, and even bone density. Activating CB2 can reduce inflammation without the psychoactive effects associated with CB1."
      },
      {
        title: "Beyond CB1 and CB2",
        content: "Research has revealed additional receptors that interact with cannabinoids: GPR55 (sometimes called CB3), TRPV1 (the capsaicin receptor), and PPARs. These 'extended' ECS components expand our understanding of how cannabinoids work in the body."
      },
      {
        title: "How Receptors Signal",
        content: "When a cannabinoid binds to a receptor, it triggers a cascade of cellular events. This signaling can decrease neurotransmitter release, reduce inflammation, modulate pain signals, or influence gene expression - depending on the receptor and location."
      }
    ],
    keyPoints: [
      "CB1: concentrated in brain and central nervous system",
      "CB2: concentrated in immune system and peripheral tissues",
      "Both are G protein-coupled receptors (GPCRs)",
      "Additional receptors: GPR55, TRPV1, PPARs expand the system",
      "Receptor activation triggers cellular signaling cascades"
    ],
    videoUrl: "https://drive.google.com/file/d/CB_RECEPTORS_VIDEO"
  },
  "ecs-103-endocannabinoids": {
    sections: [
      {
        title: "Your Body's Own Cannabis",
        content: "Your body produces its own cannabinoids called 'endocannabinoids' (endo = within). These molecules are remarkably similar to cannabinoids found in the cannabis plant, which is why plant cannabinoids can interact with our ECS so effectively."
      },
      {
        title: "Anandamide: The Bliss Molecule",
        content: "Named from the Sanskrit word 'ananda' meaning bliss, anandamide was the first endocannabinoid discovered. It binds primarily to CB1 receptors and is associated with runner's high, mood regulation, and pain modulation. Chocolate contains compounds that prolong anandamide's effects!"
      },
      {
        title: "2-AG: The Abundant One",
        content: "2-Arachidonoylglycerol (2-AG) is present in the brain at concentrations 170 times higher than anandamide. It binds to both CB1 and CB2 receptors and plays major roles in immune regulation, appetite control, and protecting the brain from injury."
      },
      {
        title: "On-Demand Production",
        content: "Unlike neurotransmitters that are stored in vesicles, endocannabinoids are made 'on demand' from fatty acids in cell membranes. When cells are stressed or stimulated, they quickly synthesize endocannabinoids to restore balance. This makes omega-3 fatty acids essential for ECS function."
      },
      {
        title: "Enzymes: The Cleanup Crew",
        content: "After endocannabinoids do their job, enzymes break them down. FAAH breaks down anandamide; MAGL breaks down 2-AG. Some therapeutic approaches target these enzymes to boost endocannabinoid levels naturally."
      }
    ],
    keyPoints: [
      "Anandamide: the 'bliss molecule' - binds mainly to CB1",
      "2-AG: most abundant brain endocannabinoid - binds to both receptors",
      "Made on-demand from fatty acids - omega-3s are crucial",
      "FAAH and MAGL enzymes break them down after use",
      "Blocking breakdown enzymes can boost ECS tone naturally"
    ],
    videoUrl: "https://drive.google.com/file/d/ENDOCANNABINOIDS_VIDEO"
  },
  "ecs-104-deficiency": {
    sections: [
      {
        title: "When the System Fails",
        content: "What happens when your master regulatory system isn't working properly? Research suggests that many chronic conditions may be linked to Clinical Endocannabinoid Deficiency (CECD) - when the ECS is underactive or imbalanced."
      },
      {
        title: "The CECD Hypothesis",
        content: "Dr. Ethan Russo proposed in 2004 that conditions like migraine, fibromyalgia, and IBS might share a common cause: insufficient endocannabinoid tone. These conditions often occur together, resist conventional treatment, and respond to cannabinoid therapy."
      },
      {
        title: "Conditions Linked to CECD",
        content: "Growing research connects CECD to: migraines, fibromyalgia, IBS, chronic fatigue, PTSD, anxiety disorders, depression, and some autoimmune conditions. These 'treatment-resistant' conditions may actually be manifestations of an underactive ECS."
      },
      {
        title: "What Causes CECD?",
        content: "CECD may result from: genetic variations in ECS components, chronic stress depleting endocannabinoids, poor diet lacking omega fatty acids, environmental toxins, lack of exercise, or simply aging. The good news: the ECS can often be restored."
      },
      {
        title: "Testing and Assessment",
        content: "While direct endocannabinoid testing isn't widely available yet, practitioners can assess ECS function through symptom questionnaires, response to cannabinoid therapy, and associated biomarkers. The ECS Assessment Tool in Allio helps identify potential deficiency patterns."
      }
    ],
    keyPoints: [
      "CECD: Clinical Endocannabinoid Deficiency theory",
      "Linked conditions: fibromyalgia, migraines, IBS, chronic fatigue",
      "These conditions often co-occur and resist standard treatments",
      "Causes: genetics, chronic stress, poor diet, toxins, aging",
      "The ECS can often be restored with targeted interventions"
    ],
    videoUrl: "https://drive.google.com/file/d/CECD_VIDEO"
  },
  "ecs-105-support": {
    sections: [
      {
        title: "Lifestyle: The Foundation",
        content: "The most powerful ECS support comes from lifestyle. Regular exercise boosts endocannabinoid levels - this is the 'runner's high.' Quality sleep allows ECS restoration. Cold exposure activates beneficial stress responses. Managing chronic stress prevents ECS depletion."
      },
      {
        title: "Nutrition: Feeding Your ECS",
        content: "Your ECS needs specific nutrients: Omega-3 fatty acids (fish oil, flaxseed) provide the building blocks for endocannabinoids. Dark chocolate contains anandamide-like compounds. Herbs like echinacea and black pepper contain cannabinoid-like compounds. Fermented foods support the gut-ECS connection."
      },
      {
        title: "Phytocannabinoid Support",
        content: "Plant cannabinoids can directly support ECS function. CBD modulates receptor activity without intoxication. CBG offers unique benefits for inflammation and focus. Full-spectrum hemp products provide the 'entourage effect' - multiple compounds working synergistically."
      },
      {
        title: "Targeted Supplementation",
        content: "Beyond cannabinoids, specific supplements support ECS function: Beta-caryophyllene (from black pepper, cloves) activates CB2 receptors. PEA (palmitoylethanolamide) enhances anandamide activity. Omega-3s provide endocannabinoid precursors. Probiotics support the gut-ECS axis."
      },
      {
        title: "Avoiding ECS Disruptors",
        content: "Certain factors deplete or disrupt the ECS: chronic stress, pesticides (especially organophosphates), excessive alcohol, poor sleep, and processed food diets. Minimizing these factors is as important as adding supportive interventions."
      }
    ],
    keyPoints: [
      "Exercise, sleep, and stress management are foundational",
      "Omega-3 fatty acids provide endocannabinoid building blocks",
      "CBD, CBG, and full-spectrum hemp support ECS function",
      "PEA and beta-caryophyllene enhance endocannabinoid activity",
      "Avoid ECS disruptors: chronic stress, pesticides, excess alcohol"
    ],
    videoUrl: "https://drive.google.com/file/d/ECS_SUPPORT_VIDEO"
  },
  // ========== ECS PRACTITIONER MODULES ==========
  "ecs-201-neuroanatomy": {
    sections: [
      { title: "ECS Distribution in the Brain", content: "The ECS is densely expressed throughout the brain, with CB1 receptors found in the hippocampus (memory), amygdala (emotions), hypothalamus (appetite/hormones), basal ganglia (movement), and prefrontal cortex (decision-making). Understanding this distribution explains the diverse effects of cannabinoid therapy." },
      { title: "Retrograde Signaling", content: "Unlike conventional neurotransmitters that travel from presynaptic to postsynaptic neurons, endocannabinoids travel backward - from post to pre. This 'retrograde signaling' allows receiving neurons to modulate how much signal they receive, providing fine-tuned control." },
      { title: "Synaptic Plasticity", content: "The ECS plays crucial roles in synaptic plasticity - the brain's ability to strengthen or weaken connections. This underlies learning, memory formation, and the brain's ability to adapt. Dysfunction in this system may contribute to PTSD and addiction." },
      { title: "Neuroprotection", content: "Endocannabinoids protect neurons from excitotoxicity - damage from excessive neurotransmitter activity. Following brain injury, the ECS activates to limit damage. This has implications for stroke, traumatic brain injury, and neurodegenerative diseases." }
    ],
    keyPoints: ["CB1 receptors concentrated in hippocampus, amygdala, hypothalamus, basal ganglia", "Retrograde signaling provides feedback control of neurotransmission", "ECS crucial for synaptic plasticity and learning", "Neuroprotective functions activated after injury"],
    videoUrl: "https://drive.google.com/file/d/ECS_NEUROANATOMY_VIDEO"
  },
  "ecs-202-immune-system": {
    sections: [
      { title: "CB2 and Immune Cells", content: "CB2 receptors are expressed on virtually all immune cells: B cells, T cells, macrophages, dendritic cells, natural killer cells, and neutrophils. Activation generally produces anti-inflammatory effects by modulating cytokine production and immune cell migration." },
      { title: "Inflammation Regulation", content: "The ECS is a master regulator of inflammation. CB2 activation reduces pro-inflammatory cytokines (TNF-α, IL-1β, IL-6) while increasing anti-inflammatory mediators (IL-10). This makes ECS modulation valuable for inflammatory conditions." },
      { title: "Autoimmunity", content: "In autoimmune conditions, the immune system attacks self-tissue. ECS dysfunction may contribute to this loss of tolerance. Cannabinoid therapy shows promise in conditions like multiple sclerosis, rheumatoid arthritis, and inflammatory bowel disease." },
      { title: "The Gut-Immune-ECS Axis", content: "The gut contains the largest concentration of immune tissue. The ECS regulates gut permeability, immune tolerance, and microbiome balance. 'Leaky gut' and dysbiosis may involve ECS dysfunction." }
    ],
    keyPoints: ["CB2 expressed on all major immune cell types", "ECS activation generally anti-inflammatory", "Reduces pro-inflammatory cytokines, increases anti-inflammatory", "Gut-immune-ECS axis crucial for autoimmune conditions"],
    videoUrl: "https://drive.google.com/file/d/ECS_IMMUNE_VIDEO"
  },
  "ecs-203-patient-assessment": {
    sections: [
      { title: "The CECD Questionnaire", content: "A structured questionnaire assesses ECS function across six domains: mood stability, sleep quality, pain levels, digestive health, immune function, and stress response. Scores help identify members who may benefit from ECS support." },
      { title: "Symptom Pattern Recognition", content: "CECD often presents with clusters: migraine + IBS + fibromyalgia. Members with treatment-resistant conditions in multiple systems should be evaluated for ECS dysfunction. Co-occurring conditions strengthen the CECD hypothesis." },
      { title: "Response to Cannabinoid Therapy", content: "One of the best diagnostic tools is therapeutic trial. Members with CECD often show rapid, significant improvement with cannabinoid therapy. Document baseline symptoms and track response over 4-8 weeks." },
      { title: "Case Study Integration", content: "Practice applying assessment tools to real member cases. Identify patterns, formulate ECS-focused wellness protocols, and track outcomes. Case-based learning reinforces clinical reasoning skills." }
    ],
    keyPoints: ["Use standardized CECD questionnaire across 6 domains", "Look for symptom clusters suggesting systemic ECS dysfunction", "Therapeutic trial with cannabinoids is diagnostically valuable", "Document baselines and track response over 4-8 weeks"],
    videoUrl: "https://drive.google.com/file/d/ECS_ASSESSMENT_VIDEO"
  },
  "ecs-204-phytocannabinoids": {
    sections: [
      { title: "CBD: The Modulator", content: "Cannabidiol (CBD) doesn't bind directly to CB1/CB2 but modulates their activity. It also activates serotonin receptors (anxiolytic), TRPV1 (pain), and PPARs (anti-inflammatory). Doses range from 10-100+ mg daily depending on application." },
      { title: "CBG: The Parent", content: "Cannabigerol (CBG) is the precursor to all other cannabinoids. It shows unique properties: antibacterial, appetite stimulation without psychoactivity, neuroprotection, and potential anti-cancer effects. Often combined with CBD for synergy." },
      { title: "CBN: The Sleep Aid", content: "Cannabinol (CBN) forms as THC degrades. It's mildly sedating and often used for sleep support. Works best in combination with other cannabinoids rather than isolated." },
      { title: "Minor Cannabinoids", content: "CBC, THCV, CBDV, and others have unique properties being researched. Full-spectrum products contain these in natural ratios, contributing to the entourage effect." }
    ],
    keyPoints: ["CBD modulates receptors without direct binding - 10-100+ mg typical", "CBG: parent cannabinoid with unique antibacterial properties", "CBN: mildly sedating, best for sleep in combination products", "Full-spectrum provides entourage effect from minor cannabinoids"],
    videoUrl: "https://drive.google.com/file/d/PHYTOCANNABINOIDS_VIDEO"
  },
  "ecs-205-terpenes": {
    sections: [
      { title: "What Are Terpenes?", content: "Terpenes are aromatic compounds found in cannabis and thousands of other plants. They give lavender, citrus, pine, and cannabis their distinctive scents. More importantly, they have significant therapeutic effects that synergize with cannabinoids." },
      { title: "Key Therapeutic Terpenes", content: "Myrcene (sedating, muscle relaxant), Limonene (uplifting, anti-anxiety), Linalool (calming, analgesic), Pinene (alerting, anti-inflammatory), Beta-caryophyllene (directly activates CB2, anti-inflammatory). Knowing terpene profiles helps predict effects." },
      { title: "The Entourage Effect", content: "Cannabinoids and terpenes work better together than in isolation. CBD is more effective with its natural terpene companions. This is why full-spectrum products often outperform isolates." },
      { title: "Matching Terpenes to Conditions", content: "For sleep: myrcene-dominant products. For anxiety: linalool and limonene. For pain: beta-caryophyllene. For focus: pinene. Understanding terpene profiles allows personalized product selection." }
    ],
    keyPoints: ["Terpenes are therapeutic aromatic compounds from plants", "Key terpenes: myrcene (sedating), limonene (uplifting), linalool (calming)", "Beta-caryophyllene directly activates CB2 receptors", "Entourage effect: cannabinoids + terpenes work better together"],
    videoUrl: "https://drive.google.com/file/d/TERPENES_VIDEO"
  },
  "ecs-206-dosing": {
    sections: [
      { title: "Start Low, Go Slow", content: "The cardinal rule of cannabinoid dosing. Individual response varies enormously based on genetics, ECS tone, body weight, and sensitivity. Starting low (5-10mg CBD) and titrating up prevents adverse effects and finds optimal dose." },
      { title: "Biphasic Effects", content: "Many cannabinoids have biphasic effects - low doses may produce opposite effects from high doses. Low-dose THC is anxiolytic; high-dose is anxiogenic. Low-dose CBD is alerting; high-dose is sedating. Finding the therapeutic window is key." },
      { title: "Condition-Specific Dosing", content: "General anxiety: 15-50mg CBD. Chronic pain: 25-100mg CBD or combinations. Sleep: 25-75mg CBD with CBN. Severe conditions may require 100-300mg+ daily. Always start lower and titrate." },
      { title: "Timing and Delivery", content: "Oral: 1-2 hours to onset, 6-8 hour duration. Sublingual: 15-30 minutes, 4-6 hours. Inhaled: minutes, 2-3 hours. Topical: local effect only. Match delivery to therapeutic goals." }
    ],
    keyPoints: ["Start low (5-10mg), titrate up based on response", "Biphasic effects: opposite effects at low vs high doses", "Oral: 1-2 hour onset, sublingual: 15-30 min, inhaled: minutes", "Condition-specific dosing ranges; always individualize"],
    videoUrl: "https://drive.google.com/file/d/ECS_DOSING_VIDEO"
  },
  "ecs-207-drug-interactions": {
    sections: [
      { title: "CYP450 Enzyme System", content: "Cannabinoids, especially CBD, inhibit cytochrome P450 enzymes (CYP3A4, CYP2C19, CYP2D6). These enzymes metabolize ~60% of pharmaceuticals. Inhibition can increase blood levels of other medications." },
      { title: "High-Risk Medications", content: "Exercise caution with: blood thinners (warfarin), anti-epileptics (clobazam), benzodiazepines, opioids, immunosuppressants, and drugs with narrow therapeutic windows. Monitor closely and consider dose adjustments." },
      { title: "Additive Effects", content: "Cannabinoids may have additive effects with sedatives, anxiolytics, and analgesics. This can be therapeutic (allowing lower pharmaceutical doses) but requires monitoring for excessive sedation or other effects." },
      { title: "Practical Management", content: "Review all medications before starting cannabinoid therapy. Use lower cannabinoid doses when interactions are possible. Monitor drug levels if available. Educate patients to report any changes in medication effects." }
    ],
    keyPoints: ["CBD inhibits CYP450 enzymes that metabolize 60% of drugs", "High-risk: warfarin, clobazam, benzos, opioids, immunosuppressants", "Additive sedation possible with CNS depressants", "Review all meds, start low, monitor closely"],
    videoUrl: "https://drive.google.com/file/d/DRUG_INTERACTIONS_VIDEO"
  },
  "ecs-208-certification-exam-prep": {
    sections: [
      { title: "Exam Overview", content: "The ECS Practitioner Certification Exam consists of 75 multiple-choice questions covering all practitioner modules. You have 90 minutes. Passing score is 80% (60 correct answers). One attempt included; retakes available." },
      { title: "Study Strategy", content: "Review all module key points. Focus on clinical application: member assessment, dosing, drug interactions, and condition-specific protocols. Practice case-based questions. Understand mechanisms well enough to apply them." },
      { title: "What to Expect", content: "Questions test both knowledge and clinical reasoning. Many are scenario-based: 'A member with X presents. What is your approach?' Know your dosing ranges, drug interactions, and contraindications." },
      { title: "After Certification", content: "Upon passing, you receive your ECS Practitioner Certificate. You can use this credential in your practice and are eligible for the Advanced ECS Specialist program. Maintain certification with annual continuing education." }
    ],
    keyPoints: ["75 questions, 90 minutes, 80% passing (60 correct)", "Focus on clinical application and case scenarios", "Know dosing ranges, interactions, contraindications", "Certificate awarded upon passing; annual CE required"],
    videoUrl: "https://drive.google.com/file/d/ECS_EXAM_PREP_VIDEO"
  },
  // ========== SITE TRAINING MODULES ==========
  "site-101-welcome": {
    sections: [
      { title: "Our Mission", content: "Welcome to Forgotten Formula PMA - a movement dedicated to true healing. We exist at the intersection of ancient wisdom and modern science, empowering members to reclaim their health through root cause medicine, not symptom management." },
      { title: "The ALLIO AI Network", content: "You'll work alongside our AI agent network - Sentinel (oversight), ATHENA (communication), HIPPOCRATES (protocols), and more. These agents support, not replace, human wisdom and decision-making." },
      { title: "Your Role", content: "Whether you're in support, administration, or clinical roles, you're part of a team changing how healthcare works. Every interaction matters. Every member deserves excellence." },
      { title: "What Sets Us Apart", content: "We're not a clinic or supplement company. We're a Private Member Association operating under constitutional protections. Members choose their own healing paths with practitioner guidance." }
    ],
    keyPoints: ["Root cause medicine, not symptom management", "AI agents support human decision-making", "PMA structure provides constitutional protections", "Excellence in every member interaction"],
    videoUrl: "https://drive.google.com/file/d/SITE_WELCOME_VIDEO"
  },
  "site-102-platform-nav": {
    sections: [
      { title: "Dashboard Overview", content: "Your dashboard is your command center. It shows your tasks, recent activity, quick actions, and key metrics. Familiarize yourself with the layout - left sidebar for navigation, main area for content." },
      { title: "Member Portal", content: "Members access training, products, protocols, and community features through their portal. Understanding this from their perspective helps you support them better." },
      { title: "Trustee Dashboard", content: "The Trustee has a specialized dashboard with AI agent communications, security oversight, and strategic metrics. You may not have access, but understanding it helps you route requests appropriately." },
      { title: "Key Features", content: "Training Hub, Products Catalog, Protocol Library, Document Center, AI Chat - know where each lives and how to navigate quickly. Practice until it's second nature." }
    ],
    keyPoints: ["Dashboard is your command center", "Left sidebar for navigation, main area for content", "Know member vs admin vs trustee views", "Practice navigation until it's automatic"],
    videoUrl: "https://drive.google.com/file/d/PLATFORM_NAV_VIDEO"
  },
  "site-103-products-overview": {
    sections: [
      { title: "Mineral Products", content: "Based on Dr. Wallach's 90 essential nutrients research. Plant-derived colloidal minerals with 90%+ bioavailability. Key products: Tangy Tangerine, Plant Derived Minerals, Osteo-FX. Know the basics of mineral deficiency signs." },
      { title: "IV Therapies", content: "High-dose vitamins, minerals, and specialty formulas delivered directly to the bloodstream. Myers' Cocktail, high-dose vitamin C, NAD+, glutathione. Practitioners prescribe; you should know general benefits." },
      { title: "Peptides", content: "Signaling molecules that direct cellular activity. BPC-157 (healing), Thymosin Alpha-1 (immune), semaglutide (weight). Prescription required for most. Understand categories and general applications." },
      { title: "Bioregulators", content: "Ultra-short peptides that regulate gene expression. Khavinson's 40+ years of research. Organ-specific support. Taken in courses. Know the main categories: immune, brain, cardiovascular." }
    ],
    keyPoints: ["Minerals: plant-derived colloidal for 90%+ absorption", "IV: direct bloodstream delivery, various formulas", "Peptides: healing, immune, metabolic applications", "Bioregulators: gene-regulating short peptides"],
    videoUrl: "https://drive.google.com/file/d/PRODUCTS_VIDEO"
  },
  "site-104-support-skills": {
    sections: [
      { title: "Active Listening", content: "Members often contact us when struggling. Listen fully before responding. Acknowledge their concerns. Repeat back to confirm understanding. Don't rush to solutions - sometimes they need to be heard first." },
      { title: "Clear Communication", content: "Use simple language, not medical jargon. Break complex information into digestible pieces. Confirm understanding. Follow up in writing when appropriate." },
      { title: "Escalation Procedures", content: "Know when to escalate: medical emergencies, legal concerns, Trustee-level decisions, technical issues beyond your scope. Better to escalate early than make mistakes. Document everything." },
      { title: "Common Scenarios", content: "Product questions, order issues, technical support, protocol questions, membership concerns. Have resources ready for each. Know where to find answers you don't have." }
    ],
    keyPoints: ["Listen fully before responding", "Use simple language, confirm understanding", "Escalate early: medical, legal, Trustee, technical", "Document all interactions"],
    videoUrl: "https://drive.google.com/file/d/SUPPORT_SKILLS_VIDEO"
  },
  "site-105-compliance": {
    sections: [
      { title: "PMA Structure", content: "We operate as a Private Member Association under First and Fourteenth Amendment protections. Members sign agreements acknowledging they're accessing private services, not regulated medical care." },
      { title: "What We Can and Cannot Say", content: "We provide information and education, not diagnosis or treatment. Practitioners make recommendations; members make choices. Avoid claims that could be interpreted as practicing medicine without a license." },
      { title: "Documentation Requirements", content: "Member agreements, informed consent, practitioner recommendations - all must be properly documented. Follow templates. When in doubt, ask. Proper documentation protects everyone." },
      { title: "Privacy and Confidentiality", content: "Member information is private. Don't discuss members with unauthorized parties. Secure your login. Report any potential breaches immediately." }
    ],
    keyPoints: ["PMA operates under constitutional protections", "Information and education, not diagnosis or treatment", "Document everything using proper templates", "Member privacy is paramount"],
    videoUrl: "https://drive.google.com/file/d/COMPLIANCE_VIDEO"
  },
  "site-106-new-staff-quiz": {
    sections: [
      { title: "Quiz Overview", content: "The New Staff Onboarding Quiz tests your understanding of all previous modules. 25 questions, 30 minutes. You need 80% (20 correct) to pass and complete your onboarding." },
      { title: "Topics Covered", content: "Mission and values, platform navigation, product categories, support skills, compliance requirements, and PMA structure. Review your notes from each module before attempting." },
      { title: "Taking the Quiz", content: "Read each question carefully. Many are scenario-based. There's no penalty for guessing. You can review and change answers before submitting." },
      { title: "After the Quiz", content: "Upon passing, you're officially onboarded! You'll have access to all standard team resources. Your manager will assign your first tasks. Welcome to the team!" }
    ],
    keyPoints: ["25 questions, 30 minutes, 80% to pass", "Covers all onboarding modules", "Scenario-based questions - think through carefully", "Passing completes your official onboarding"],
    videoUrl: "https://drive.google.com/file/d/STAFF_QUIZ_PREP_VIDEO"
  },
  // ========== DOCTOR ONBOARDING MODULES ==========
  "doc-101-portal-orientation": {
    sections: [
      { title: "Doctor Portal Overview", content: "Your Doctor Portal is designed for efficient member management. You'll find member lists, appointment scheduling, blood analysis tools, document generation, and communication features all in one place." },
      { title: "Member Management", content: "View your member roster, their protocols, and progress. Quick actions for common tasks. Search and filter capabilities. Each member card shows key status information at a glance." },
      { title: "Blood Analysis Tools", content: "Upload Live Blood Analysis images/videos for AI-assisted interpretation. The system identifies patterns and suggests correlations. You make the final clinical judgments." },
      { title: "Document Generation", content: "Generate protocol recommendations, intake forms, and reports. Templates are customizable. Documents can be sent directly to members or downloaded for your records." }
    ],
    keyPoints: ["All-in-one portal for member management", "Member cards show key status at a glance", "AI-assisted blood analysis with doctor oversight", "Template-based document generation"],
    videoUrl: "https://drive.google.com/file/d/DOC_PORTAL_VIDEO"
  },
  "doc-102-patient-intake": {
    sections: [
      { title: "The FFPMA 12-System Review", content: "Our comprehensive intake covers all major body systems: cardiovascular, respiratory, digestive, neurological, musculoskeletal, endocrine, immune, urinary, reproductive, integumentary, lymphatic, and mental/emotional. This ensures nothing is missed." },
      { title: "Chief Complaint Deep Dive", content: "Beyond the chief complaint, explore onset, duration, triggers, relievers, associated symptoms, previous treatments, and impact on quality of life. The 5 Rs framework (Remove, Replace, Regenerate, Restore, Rebalance) guides your thinking." },
      { title: "History Taking", content: "Past medical history, family history, social history (diet, exercise, sleep, stress, environment), medication/supplement review. Look for patterns that suggest root causes." },
      { title: "Documentation Standards", content: "Use the intake template. Document in the patient's own words where relevant. Note your clinical impressions. Flag red flags immediately. Complete documentation within 24 hours." }
    ],
    keyPoints: ["12-system review ensures comprehensive assessment", "5 Rs framework guides root cause thinking", "Document thoroughly using templates", "Flag red flags immediately"],
    videoUrl: "https://drive.google.com/file/d/PATIENT_INTAKE_VIDEO"
  },
  "doc-103-lba-basics": {
    sections: [
      { title: "What is Live Blood Analysis?", content: "LBA examines fresh, unstained blood under dark field microscopy at 1000x magnification. Unlike conventional blood tests, LBA shows living cells in real-time, revealing morphology, behavior, and plasma quality." },
      { title: "Ordering and Collecting", content: "LBA can be done in-office or at designated collection sites. Finger prick technique, immediate slide preparation, analysis within 15-20 minutes. Member should fast 8-12 hours for best results." },
      { title: "AI-Assisted Interpretation", content: "Upload images/videos to Allio for HIPPOCRATES and PARACELSUS analysis. AI identifies patterns: rouleaux, echinocytes, crystals, fibrin, WBC activity. You receive a structured report with confidence scores." },
      { title: "Clinical Integration", content: "LBA findings correlate with symptoms and other tests. Use for baseline assessment, progress monitoring, and member education. The visual nature motivates compliance." }
    ],
    keyPoints: ["Dark field microscopy at 1000x, living cells in real-time", "Fast 8-12 hours, analyze within 15-20 minutes", "AI assists identification; you make clinical judgments", "Visual results motivate member compliance"],
    videoUrl: "https://drive.google.com/file/d/LBA_BASICS_VIDEO"
  },
  "doc-104-protocol-prescribing": {
    sections: [
      { title: "The Protocol Library", content: "FFPMA maintains evidence-based protocols for common conditions. Each includes rationale, product combinations, dosing, duration, monitoring, and expected outcomes. Use as templates; individualize for each member." },
      { title: "IV Therapy Protocols", content: "Specify formulation, dose, frequency, and duration. Review contraindications and drug interactions. Ensure proper member screening and informed consent. Monitor during and after infusion." },
      { title: "Peptide Protocols", content: "Select appropriate peptide(s), determine dosing and cycling, specify reconstitution and storage instructions. Many peptides are prescription-only. Document medical necessity." },
      { title: "Combination Approaches", content: "Most members benefit from multi-modal protocols: oral supplements + IV + peptides + lifestyle. Layer interventions strategically. Start simple, add complexity as needed." }
    ],
    keyPoints: ["Protocol Library provides evidence-based templates", "IV: specify formula, dose, frequency; ensure screening", "Peptides: prescription-only, document necessity", "Layer interventions strategically"],
    videoUrl: "https://drive.google.com/file/d/PROTOCOL_PRESCRIBING_VIDEO"
  },
  "doc-105-referral-network": {
    sections: [
      { title: "Member Referrals", content: "When members you've enrolled make purchases, you earn referral credits. Your unique doctor code tracks referrals. Share your signup link: forgottenformula.com/join/[your-code]." },
      { title: "Doctor-to-Doctor Referrals", content: "Refer members to specialists in the network. Orthopedic cases to our joint specialists, complex cases to experienced practitioners. Network collaboration improves outcomes." },
      { title: "Building Your Practice", content: "The network supports your practice growth. Marketing materials, educational content, and AI tools are available. Focus on member outcomes; referrals follow naturally." },
      { title: "Revenue Sharing", content: "Understand the compensation structure: membership fees, product purchases, protocol fees. Transparency builds trust. All earnings are documented in your portal." }
    ],
    keyPoints: ["Unique doctor code tracks your member referrals", "Network collaboration improves member outcomes", "Focus on outcomes; referrals follow naturally", "All earnings documented in your portal"],
    videoUrl: "https://drive.google.com/file/d/REFERRAL_NETWORK_VIDEO"
  },
  "doc-106-ai-agents": {
    sections: [
      { title: "The Agent Network", content: "ALLIO's multi-agent system supports your practice. HIPPOCRATES provides protocol guidance, PARACELSUS offers diagnostic insights, SYNTHESIS integrates findings, and specialized agents handle specific domains." },
      { title: "Using AI Appropriately", content: "AI agents provide suggestions, not directives. You are the licensed practitioner making clinical decisions. Use AI for research, pattern recognition, and second opinions. Document when AI informed your decision-making." },
      { title: "Blood Analysis AI", content: "Upload LBA images/videos for AI analysis. HIPPOCRATES identifies morphological patterns. PARACELSUS correlates findings with symptoms. You receive a structured report to inform your assessment." },
      { title: "Protocol Assistance", content: "Describe a case to receive protocol suggestions. AI considers condition, member factors, and current research. Use as a starting point for your clinical reasoning." }
    ],
    keyPoints: ["AI provides suggestions; you make clinical decisions", "HIPPOCRATES: protocols, PARACELSUS: diagnostics", "Document when AI informed decision-making", "Use as starting point for clinical reasoning"],
    videoUrl: "https://drive.google.com/file/d/AI_AGENTS_VIDEO"
  },
  "doc-107-compliance-legal": {
    sections: [
      { title: "PMA Structure for Doctors", content: "As a network physician, you operate within the PMA framework. You're providing private services to association members under constitutional protections. This is not a replacement for proper licensing in your jurisdiction." },
      { title: "Scope of Practice", content: "Practice within your license. The PMA structure doesn't expand your legal scope. If you're not licensed to prescribe in your state, the PMA doesn't change that. When in doubt, refer." },
      { title: "Documentation Requirements", content: "Thorough documentation protects you and the member. Use provided templates. Document informed consent, recommendations, and member acknowledgments. Maintain records per your state requirements." },
      { title: "Liability Protection", content: "The PMA structure provides some protection, but it's not absolute. Maintain your malpractice coverage. Practice within guidelines. Document thoroughly. When uncertain, escalate." }
    ],
    keyPoints: ["PMA doesn't expand your legal scope of practice", "Practice within your license; refer when uncertain", "Thorough documentation protects everyone", "Maintain malpractice coverage"],
    videoUrl: "https://drive.google.com/file/d/DOC_COMPLIANCE_VIDEO"
  },
  "doc-108-certification-exam": {
    sections: [
      { title: "Exam Overview", content: "The Doctor Certification Quiz consists of 40 questions covering all onboarding modules. You have 45 minutes. Passing score is 85% (34 correct). This certifies you for full network participation." },
      { title: "Topics Covered", content: "Portal navigation, member intake, LBA basics, protocol guidance, referral network, AI usage, and compliance/legal. Review each module's key points." },
      { title: "Clinical Scenarios", content: "Many questions present clinical scenarios. Apply your knowledge to member situations. Think through the appropriate response before selecting an answer." },
      { title: "After Certification", content: "Upon passing, you're fully credentialed in the network. Your profile is activated for member assignments. You'll receive your Doctor Certificate and can begin accepting members immediately." }
    ],
    keyPoints: ["40 questions, 45 minutes, 85% to pass (34 correct)", "Scenario-based questions test clinical application", "Review all module key points", "Passing activates full network participation"],
    videoUrl: "https://drive.google.com/file/d/DOC_EXAM_PREP_VIDEO"
  },
  // ========== EXISTING MODULES ==========
  "pma-law": {
    sections: [
      {
        title: "What is a Private Member Association?",
        content: "A Private Member Association (PMA) is a group of people who have come together for a common purpose and have agreed to operate under private contract law. PMAs are protected by the First Amendment's freedom of association and the Fourteenth Amendment's liberty protections."
      },
      {
        title: "Constitutional Foundations",
        content: "The right to form private associations is deeply rooted in American constitutional law. The Supreme Court has consistently upheld the right of individuals to associate privately for lawful purposes, free from government interference."
      },
      {
        title: "How PMAs Operate",
        content: "PMAs operate under private contract law between consenting members. When you become a member of a PMA, you enter into a private agreement that governs the relationship between you and the association. This private contract framework allows members to access goods and services that may not be available through conventional channels."
      },
      {
        title: "Member Rights and Responsibilities",
        content: "As a PMA member, you have the right to access association benefits, participate in decision-making, and enjoy the protections of the private membership agreement. You also have responsibilities to uphold the association's principles and respect other members' rights."
      }
    ],
    keyPoints: [
      "PMAs are protected by the First and Fourteenth Amendments",
      "Members operate under private contract law",
      "Association activities remain in the private domain",
      "Members choose their own practitioners and modalities",
      "Knowledge sharing is a fundamental member right"
    ]
  },
  "constitutional-protections": {
    sections: [
      {
        title: "First Amendment Protections",
        content: "The First Amendment guarantees the right to peaceably assemble, to associate with others, and to petition for change. These protections form the foundation for PMAs, allowing members to come together for health, wellness, and mutual benefit without government interference in their private agreements."
      },
      {
        title: "Freedom of Association",
        content: "The Supreme Court has recognized that the freedom of association is implicit in the freedoms of speech, assembly, and petition. This right allows individuals to join together in groups to pursue shared goals, including health and wellness objectives."
      },
      {
        title: "Fourteenth Amendment Liberty",
        content: "The Fourteenth Amendment's Due Process Clause protects fundamental liberties, including the right to make intimate decisions about one's own body, health, and family. This 'liberty interest' has been recognized as including personal autonomy in health decisions."
      },
      {
        title: "Right to Contract",
        content: "The freedom to enter into private contracts is a fundamental right protected by the Constitution. When PMA members agree to the membership terms, they are exercising this constitutional right to contract privately with one another."
      },
      {
        title: "Historical Context",
        content: "The Founders understood that government power must be limited to protect individual liberty. The Bill of Rights was designed to restrict government overreach and protect the natural rights of citizens, including the right to associate freely and make personal health decisions."
      }
    ],
    keyPoints: [
      "First Amendment: Freedom of speech, assembly, and petition",
      "Freedom of Association: Right to join groups for common purposes",
      "Fourteenth Amendment: Liberty protections for personal decisions",
      "Right to Contract: Freedom to enter private agreements",
      "Limited Government: Constitutional restraints on overreach"
    ]
  },
  "ff-handbook": {
    sections: [
      {
        title: "Our Purpose",
        content: "Forgotten Formula PMA exists at the intersection of ancient wisdom and cutting-edge science, where constitutional rights meet clinical innovation. We remember what conventional medicine has forgotten: that the body is designed for self-renewal when given the right conditions."
      },
      {
        title: "Our Philosophy: Root Cause, Whole Person",
        content: "We don't chase symptoms—we interrogate root causes. Your body isn't randomly attacking itself. Your energy didn't vanish for no reason. There are underlying causes like inflammatory cascades, nutrient depletion, toxic burden, and hormonal imbalance that we address at their source."
      },
      {
        title: "What We Offer",
        content: "Our members have access to IV infusion therapies, regenerative medicine, advanced diagnostics, detoxification protocols, and education that empowers. Every product meets uncompromising standards: whole plant therapeutics, cGMP manufacturing, and non-GMO organic sourcing whenever possible."
      },
      {
        title: "Join the Movement",
        content: "We are not a clinic. We are not a supplement company. We are a movement of members who refuse to accept that chronic illness is inevitable or that pharmaceutical dependency is normal. Together, we're rewriting the rules of healthcare."
      }
    ],
    pdfUrl: "/training/FF_Handbook.pdf",
    keyPoints: [
      "Root cause healing, not symptom management",
      "Constitutional rights meet clinical innovation",
      "Member-driven healthcare decisions",
      "Whole plant therapeutics and premium quality",
      "Education that empowers self-healing"
    ]
  },
  "live-blood-analysis-fundamentals": {
    sections: [
      {
        title: "Introduction to Live Blood Analysis",
        content: "Live Blood Analysis (LBA) is a diagnostic technique that examines fresh, unprocessed blood under a dark field microscope. Unlike conventional blood tests that analyze dried or chemically treated samples, LBA provides a real-time view of cellular health, allowing practitioners to observe the shape, size, and behavior of blood cells."
      },
      {
        title: "Dark Field Microscopy Basics",
        content: "Dark field microscopy illuminates specimens from the side rather than from below, causing cells to appear bright against a dark background. This technique reveals details invisible under standard bright field microscopy, including cell membrane integrity, rouleaux formation, and the presence of microorganisms or debris."
      },
      {
        title: "Key Blood Cell Observations",
        content: "Red blood cells should appear round, uniform, and freely moving. Abnormalities include rouleaux (stacking), echinocytes (spiky cells indicating oxidative stress), target cells, and abnormal shapes. White blood cells can be observed for activity levels and count estimates."
      },
      {
        title: "Interpreting Plasma Quality",
        content: "The plasma surrounding blood cells reveals important information. Excessive fibrin strands may indicate liver stress or inflammation. Crystal formations can suggest uric acid issues. Debris and particles may point to digestive problems or toxic burden."
      },
      {
        title: "Clinical Applications",
        content: "LBA helps identify nutritional deficiencies, oxidative stress, inflammation markers, and overall cellular health. It's particularly valuable for monitoring member progress during wellness protocols and providing visual feedback that motivates lifestyle changes."
      }
    ],
    keyPoints: [
      "Uses dark field microscopy at 1000x magnification",
      "Reveals real-time cellular health status",
      "Identifies rouleaux, oxidative stress, and nutritional deficiencies",
      "Sample must be analyzed within 20 minutes",
      "Valuable for monitoring treatment progress"
    ]
  },
  "iv-therapy-safety": {
    sections: [
      {
        title: "IV Therapy Fundamentals",
        content: "Intravenous (IV) therapy delivers nutrients, vitamins, and other therapeutic substances directly into the bloodstream, bypassing the digestive system for 100% bioavailability. This makes IV therapy particularly effective for individuals with absorption issues or those needing rapid nutrient repletion."
      },
      {
        title: "Safety Protocols and Screening",
        content: "Before administering IV therapy, proper member screening is essential. This includes reviewing medical history, current medications, allergies, and contraindications. Baseline vital signs (blood pressure, pulse, temperature) should be recorded, and informed consent obtained."
      },
      {
        title: "Vein Selection and Access",
        content: "Proper venipuncture technique minimizes member discomfort and complications. Select veins that are visible, palpable, and adequately sized. The antecubital fossa is preferred for larger infusions. Always rotate access sites to prevent vein damage."
      },
      {
        title: "Infusion Rate and Monitoring",
        content: "Most IV vitamin infusions run at 1-2 mL per minute. Monitor members continuously for adverse reactions: flushing (slow the rate), pain at site, dizziness, or allergic symptoms. Have emergency protocols ready for anaphylaxis or severe reactions."
      },
      {
        title: "Common IV Formulations",
        content: "Popular IV therapies include the Myers' Cocktail (B vitamins, vitamin C, magnesium, calcium), high-dose vitamin C, glutathione, NAD+, and chelation protocols. Each has specific preparation, dosing, and monitoring requirements."
      }
    ],
    keyPoints: [
      "100% bioavailability bypassing digestive system",
      "Screen for allergies and contraindications",
      "Standard infusion rate: 1-2 mL per minute",
      "Monitor vital signs before and during infusion",
      "Rotate access sites to prevent vein damage"
    ]
  },
  "mineral-balance-wallach": {
    sections: [
      {
        title: "The 90 Essential Nutrients",
        content: "Dr. Joel Wallach identified 90 essential nutrients required for optimal health: 60 minerals, 16 vitamins, 12 amino acids, and 2-3 essential fatty acids. Without these nutrients, the body cannot perform the biochemical processes necessary for health and healing."
      },
      {
        title: "Mineral Depletion Crisis",
        content: "Modern agricultural practices have depleted soil minerals by up to 85% since 1936. This means that even 'healthy' diets may be mineral-deficient. Food processing further reduces nutritional content. Supplementation has become necessary, not optional."
      },
      {
        title: "Plant-Derived vs Metallic Minerals",
        content: "Minerals come in two forms: metallic (from rocks, poorly absorbed at 3-5%) and plant-derived colloidal (absorbed from plants that pre-processed soil minerals, 90%+ absorption). Always choose plant-derived colloidal minerals for maximum bioavailability."
      },
      {
        title: "Key Mineral Functions",
        content: "Calcium supports bones and nerve function. Magnesium powers 300+ enzyme reactions. Zinc enables immune function and hormone production. Selenium protects against oxidative damage. Chromium regulates blood sugar. Each mineral has dozens of critical functions."
      },
      {
        title: "Signs of Mineral Deficiency",
        content: "Common signs include fatigue, muscle cramps, brittle nails, hair loss, poor wound healing, frequent illness, mood changes, and chronic pain. Many conditions attributed to 'aging' are actually mineral deficiencies that can be corrected with proper supplementation."
      }
    ],
    keyPoints: [
      "90 essential nutrients: 60 minerals, 16 vitamins, 12 amino acids, 2-3 fatty acids",
      "Modern soils are depleted by up to 85%",
      "Plant-derived colloidal minerals: 90%+ absorption",
      "Up to 80% of Americans are magnesium deficient",
      "Many 'aging' symptoms are actually mineral deficiencies"
    ]
  },
  "intro-peptide-therapy": {
    sections: [
      {
        title: "What Are Peptides?",
        content: "Peptides are short chains of amino acids (2-50) linked by peptide bonds. They act as signaling molecules in the body, instructing cells to perform specific functions. Unlike proteins (which are larger), peptides are small enough to penetrate tissues and trigger targeted biological responses."
      },
      {
        title: "How Peptides Work",
        content: "Peptides bind to specific receptors on cell surfaces, triggering cascades of cellular activity. They can stimulate growth hormone release, promote tissue healing, modulate immune function, enhance cognition, and regulate metabolism—depending on which peptide is used."
      },
      {
        title: "Categories of Therapeutic Peptides",
        content: "Healing peptides (BPC-157, TB-500) accelerate tissue repair. Anti-aging peptides (Epithalon, GHK-Cu) support cellular regeneration. Weight management peptides (semaglutide, tirzepatide) regulate appetite. Immune peptides (Thymosin Alpha-1) enhance immunity. Cognitive peptides (Semax, Selank) support brain function."
      },
      {
        title: "Administration Methods",
        content: "Most peptides are administered via subcutaneous injection, as oral ingestion would break them down in the digestive tract. Some peptides can be administered nasally, topically, or transbuccally. Proper reconstitution, storage, and injection technique are essential."
      },
      {
        title: "Quality and Safety Considerations",
        content: "Peptide quality varies dramatically. Always use third-party tested peptides from reputable sources. Verify purity (minimum 98%), proper cold chain storage, and sterile manufacturing. Work with knowledgeable practitioners who understand proper dosing and cycling."
      }
    ],
    keyPoints: [
      "Short amino acid chains that signal cellular activity",
      "Categories: healing, anti-aging, weight, immune, cognitive",
      "Most administered via subcutaneous injection",
      "Quality matters: verify purity and testing",
      "Work with knowledgeable practitioners"
    ]
  },
  "bpc-157-deep-dive": {
    sections: [
      {
        title: "What is BPC-157?",
        content: "BPC-157 (Body Protection Compound-157) is a 15-amino acid peptide derived from a protein found in human gastric juice. It has been extensively studied for its remarkable healing properties across multiple tissue types, earning it the nickname 'the Wolverine peptide' for its regenerative abilities."
      },
      {
        title: "Mechanism of Action",
        content: "BPC-157 promotes angiogenesis (new blood vessel formation), which is critical for tissue healing. It also modulates growth factors, reduces inflammation, protects against oxidative stress, and promotes the formation of granulation tissue. It appears to work through multiple pathways including the nitric oxide system."
      },
      {
        title: "Reconstitution and Storage",
        content: "BPC-157 comes as a lyophilized (freeze-dried) powder. Reconstitute with bacteriostatic water by injecting slowly down the vial wall. Swirl gently—never shake. Store reconstituted peptide at 2-8°C (refrigerator) and use within 2-4 weeks. Protect from light."
      },
      {
        title: "Dosing Protocols",
        content: "Standard dosing ranges from 250-500 mcg once or twice daily. For acute injuries, higher doses may be used short-term. Inject subcutaneously, either systemically or locally near the injury site. Cycles typically run 4-12 weeks depending on the condition being addressed."
      },
      {
        title: "Clinical Applications",
        content: "Research shows benefits for tendon and ligament healing, muscle tears, bone fractures, inflammatory bowel conditions, gastric ulcers, liver protection, and even brain injuries. It's particularly popular among athletes and those recovering from surgeries or chronic injuries."
      }
    ],
    keyPoints: [
      "15-amino acid peptide from human gastric juice",
      "Promotes angiogenesis and tissue healing",
      "Reconstitute with bacteriostatic water, refrigerate",
      "Standard dose: 250-500 mcg, 1-2x daily",
      "Applications: tendons, gut, muscle, bones, brain"
    ]
  },
  "bioregulators-101": {
    sections: [
      {
        title: "The Khavinson Revolution",
        content: "Professor Vladimir Khavinson of the St. Petersburg Institute of Bioregulation and Gerontology pioneered bioregulator research over 40 years ago. His work demonstrated that short peptides can restore gene expression and cellular function to more youthful states, effectively slowing or reversing aspects of aging."
      },
      {
        title: "How Bioregulators Differ",
        content: "Unlike larger therapeutic peptides, bioregulators are ultra-short (2-4 amino acids) peptides that work at the DNA level. They interact with specific DNA segments to restore normal gene expression, essentially 're-programming' aging cells to function as they did when younger."
      },
      {
        title: "Natural vs Synthetic Bioregulators",
        content: "Natural bioregulators (Cytogens) are extracted from animal organs—thymus, pineal, prostate, cartilage, etc. Synthetic bioregulators (Cytamaxes) are laboratory-produced equivalents. Both are effective; synthetics offer more precise dosing and no animal-derived concerns."
      },
      {
        title: "Key Bioregulator Peptides",
        content: "Epithalon (synthetic pineal peptide) supports telomere length and circadian rhythm. Thymalin/Thymogen (thymus peptides) enhance immune function. Vilon supports bone marrow. Cortexin/Cortagen support brain function. Each organ system has corresponding bioregulators."
      },
      {
        title: "Usage Protocols",
        content: "Bioregulators are typically taken in 10-20 day courses, 1-2 times per year for maintenance or more frequently for therapeutic purposes. They can be taken orally (capsules) or by injection. Effects are cumulative over repeated courses."
      }
    ],
    keyPoints: [
      "Short 2-4 amino acid peptides that regulate genes",
      "40+ years of Russian research by Prof. Khavinson",
      "Work at DNA level to restore youthful gene expression",
      "Organ-specific peptides for targeted support",
      "Taken in 10-20 day courses, 1-2x per year"
    ]
  },
  "glp1-in-practice": {
    sections: [
      {
        title: "Understanding GLP-1",
        content: "Glucagon-Like Peptide-1 (GLP-1) is an incretin hormone produced in the gut after eating. It signals the pancreas to release insulin, slows gastric emptying, and sends satiety signals to the brain. GLP-1 agonists mimic and enhance these effects for therapeutic benefit."
      },
      {
        title: "GLP-1 Agonist Options",
        content: "Semaglutide (Ozempic, Wegovy) is a once-weekly GLP-1 agonist. Tirzepatide (Mounjaro, Zepbound) is a dual GIP/GLP-1 agonist with enhanced effects. Liraglutide (Saxenda) is a daily option. Compounded versions offer cost-effective alternatives with similar efficacy."
      },
      {
        title: "Dose Titration",
        content: "Starting at low doses and gradually increasing is critical to minimize side effects. Typical semaglutide titration: start at 0.25mg weekly for 4 weeks, then 0.5mg for 4 weeks, increasing to maintenance dose of 1.0-2.4mg. Rushing titration significantly increases nausea."
      },
      {
        title: "Lifestyle Integration",
        content: "GLP-1 therapy works best with proper lifestyle support. Prioritize protein intake (1g per pound of lean mass) to preserve muscle. Include resistance training 2-3x weekly. Stay well hydrated. Address nutrient deficiencies. Sleep and stress management matter."
      },
      {
        title: "Managing Side Effects",
        content: "Nausea and reduced appetite are common, especially early on. Eat smaller, protein-focused meals. Avoid fatty or spicy foods. Ginger and peppermint can help. Constipation responds to fiber and hydration. Report persistent or severe symptoms to your provider."
      }
    ],
    keyPoints: [
      "GLP-1: incretin hormone that regulates appetite and insulin",
      "Tirzepatide is dual GIP/GLP-1 for enhanced effects",
      "Always titrate slowly to minimize side effects",
      "Prioritize protein and strength training for muscle preservation",
      "Lifestyle factors amplify and sustain results"
    ]
  },
  "5-rs-protocol-explained": {
    sections: [
      {
        title: "The Path to Homeostasis",
        content: "The 5 Rs Protocol provides a systematic framework for restoring the body to homeostasis—the balanced state where healing naturally occurs. Rather than chasing symptoms, this approach addresses root causes in a logical sequence: Remove, Replace, Regenerate, Restore, and Rebalance."
      },
      {
        title: "Remove: Eliminating Obstacles",
        content: "The first step is removing what's causing harm: toxins (heavy metals, environmental chemicals), pathogens (parasites, dysbiotic bacteria, viruses), allergens and food sensitivities, and inflammatory triggers. Without removal, the body cannot heal."
      },
      {
        title: "Replace: Restoring Deficiencies",
        content: "Next, replace what's missing or deficient: digestive enzymes, hydrochloric acid, bile salts, and the 90 essential nutrients. Most chronic illness involves significant nutrient depletion that must be corrected before healing can proceed."
      },
      {
        title: "Regenerate: Healing the Gut",
        content: "With obstacles removed and nutrients restored, focus on regenerating damaged tissues—especially the gut lining. Protocols include L-glutamine, bone broth, colostrum, and specific peptides (like BPC-157). Microbiome restoration with targeted probiotics completes this phase."
      },
      {
        title: "Restore and Rebalance",
        content: "Restore optimal function to organ systems: adrenal support for stress response, thyroid optimization, hormone balancing. Finally, rebalance through lifestyle: sleep optimization, stress management, appropriate movement, and ongoing maintenance to sustain the healing achieved."
      }
    ],
    keyPoints: [
      "Remove: toxins, pathogens, allergens, inflammatory triggers",
      "Replace: enzymes, stomach acid, bile, 90 essential nutrients",
      "Regenerate: gut lining, beneficial microbiome",
      "Restore: organ function, hormone balance",
      "Rebalance: lifestyle factors for sustained healing"
    ]
  },
  "peptide-101-building-blocks": {
    sections: [
      {
        title: "Introduction to Amino Acids",
        content: "Amino acids are the fundamental building blocks of all proteins and peptides. There are 20 standard amino acids encoded by the genetic code, each with unique chemical properties determined by their side chains. Understanding these building blocks is essential for grasping how peptides function therapeutically."
      },
      {
        title: "Peptide Bond Formation",
        content: "Peptides are formed when amino acids link together through peptide bonds - a special type of amide bond between the carboxyl group of one amino acid and the amino group of another. This dehydration synthesis releases water and creates chains that can range from dipeptides to complex polypeptides."
      },
      {
        title: "Primary Structure and Sequence",
        content: "The primary structure of a peptide is simply its amino acid sequence, read from the N-terminus to the C-terminus. This sequence determines all higher-order structural properties and ultimately the peptide's biological function. Even single amino acid changes can dramatically alter activity."
      },
      {
        title: "Therapeutic Peptide Applications",
        content: "Peptide therapeutics represent a rapidly growing field in medicine. From insulin (the first peptide drug) to modern GLP-1 agonists, BPC-157, and bioregulator peptides, understanding peptide chemistry enables us to harness these powerful molecules for healing."
      }
    ],
    keyPoints: [
      "20 standard amino acids with unique chemical properties",
      "Peptide bonds form through dehydration synthesis",
      "Primary structure (sequence) determines all properties",
      "Peptides range from 2 to hundreds of amino acids",
      "Foundation for understanding therapeutic peptides"
    ],
    pdfUrl: "https://drive.google.com/file/d/1l9J-CQxDPhEIjk39Y3pdTdBr_ByMl5Sl/view"
  },
  "peptide-102-origins-synthesis": {
    sections: [
      {
        title: "Prebiotic Origins",
        content: "Amino acids likely formed in the primordial Earth through various mechanisms - from volcanic activity to asteroid impacts. The famous Miller-Urey experiment demonstrated that amino acids can spontaneously form from simple molecules under early Earth conditions, suggesting life's building blocks emerged naturally."
      },
      {
        title: "Biosynthesis Pathways",
        content: "Living organisms synthesize amino acids through complex metabolic pathways. Essential amino acids must be obtained from diet because humans lack the enzymes for their synthesis. Non-essential amino acids are made from simpler precursors through transamination and other enzymatic processes."
      },
      {
        title: "Chemical Synthesis Methods",
        content: "Modern peptide synthesis primarily uses solid-phase peptide synthesis (SPPS), developed by Bruce Merrifield in 1963. This revolutionary technique anchors the growing peptide chain to an insoluble resin, enabling automated synthesis of complex peptides with high purity."
      },
      {
        title: "Quality and Purity Considerations",
        content: "Therapeutic peptides require rigorous quality control. HPLC analysis, mass spectrometry, and amino acid analysis verify identity and purity. Understanding synthesis methods helps evaluate peptide quality - crucial when selecting peptides for therapeutic applications."
      }
    ],
    keyPoints: [
      "Amino acids originated in prebiotic Earth conditions",
      "Essential vs non-essential amino acid synthesis",
      "Solid-phase peptide synthesis (SPPS) is the gold standard",
      "Recombinant DNA technology produces complex peptides",
      "Purity and quality control are critical for therapeutics"
    ],
    pdfUrl: "https://drive.google.com/file/d/1WEb5o7HXm2RtKVf4WCgXYdWdhuZ1cWYp/view"
  },
  "peptide-103-modified-amino-acids": {
    sections: [
      {
        title: "Post-Translational Modifications",
        content: "After synthesis, amino acids in peptides and proteins can be chemically modified. Phosphorylation, glycosylation, acetylation, and methylation are common modifications that regulate protein function, stability, and localization. These modifications add another layer of complexity to peptide biology."
      },
      {
        title: "Non-Standard Amino Acids",
        content: "Beyond the 20 standard amino acids, over 500 non-standard amino acids exist in nature. Selenocysteine (the 21st amino acid) and pyrrolysine (22nd) are genetically encoded in some organisms. Synthetic non-standard amino acids expand the toolkit for designing therapeutic peptides."
      },
      {
        title: "Enzyme Structure and Function",
        content: "Enzymes are proteins (large peptides) that catalyze biochemical reactions. Understanding enzyme active sites, substrate specificity, and catalytic mechanisms reveals how peptides function as biological catalysts. Many therapeutic peptides work by modulating enzyme activity."
      },
      {
        title: "Organocatalysis and Peptide Catalysts",
        content: "Small peptides can act as catalysts for organic reactions, mimicking enzymes. This field of organocatalysis has applications in pharmaceutical synthesis and green chemistry. Peptide catalysts offer advantages of specificity and environmental compatibility."
      }
    ],
    keyPoints: [
      "Post-translational modifications regulate peptide function",
      "500+ non-standard amino acids exist in nature",
      "Modifications affect stability, activity, and targeting",
      "Enzyme catalysis depends on peptide structure",
      "Peptide catalysts enable selective chemical reactions"
    ],
    pdfUrl: "https://drive.google.com/file/d/1bjPawkmKxkc9ZjSpwq8Pp1f9TAwN7vzm/view"
  },
  "peptide-104-analysis-function": {
    sections: [
      {
        title: "Analytical Techniques Overview",
        content: "Modern peptide analysis employs sophisticated techniques to determine structure, purity, and function. Mass spectrometry provides molecular weight and sequence information. Chromatographic methods separate and quantify peptides. Spectroscopy reveals conformational details."
      },
      {
        title: "Mass Spectrometry Applications",
        content: "Matrix-assisted laser desorption/ionization (MALDI) and electrospray ionization (ESI) mass spectrometry are workhorses of peptide analysis. Tandem MS enables sequencing by fragmenting peptides and analyzing the resulting ion patterns."
      },
      {
        title: "Structure-Activity Relationships",
        content: "Understanding how peptide structure relates to biological activity is central to drug design. SAR studies systematically modify peptide sequences to identify critical residues for activity. This knowledge guides the development of more potent and selective therapeutic peptides."
      },
      {
        title: "Peptide Therapeutics in Practice",
        content: "From GLP-1 agonists for diabetes and weight loss to antimicrobial peptides and cancer-targeting sequences, peptide therapeutics offer unique advantages: high specificity, low toxicity, and natural metabolic breakdown. Understanding peptide science enables informed therapeutic decisions."
      }
    ],
    keyPoints: [
      "Mass spectrometry: molecular weight and sequencing",
      "HPLC separates and quantifies peptides",
      "Structure-activity relationships guide drug design",
      "Peptide therapeutics: specific, safe, naturally degraded",
      "Knowledge enables informed therapeutic choices"
    ],
    pdfUrl: "https://drive.google.com/file/d/1IgnlzwyZ50r0yI0ZX29NqLwBdbpkczlb/view"
  },
  "diet-cancer-fundamentals": {
    sections: [
      {
        title: "The Food-Cancer Connection",
        content: "Research consistently shows that diet plays a significant role in cancer prevention - some estimates suggest that 30-40% of all cancers could be prevented through dietary and lifestyle modifications. The foods we eat can either promote inflammation and cellular damage, or provide protective compounds that support our body's natural defenses against cancer development. Understanding this connection empowers you to make informed choices that support long-term health."
      },
      {
        title: "Anti-Cancer Foods and Compounds",
        content: "Certain foods contain powerful compounds that actively fight cancer. Cruciferous vegetables like broccoli, cauliflower, and kale contain sulforaphane, which helps the body detoxify carcinogens. Berries are rich in anthocyanins and ellagic acid, potent antioxidants that protect DNA from damage. Turmeric's curcumin has been shown in hundreds of studies to inhibit cancer cell growth. Garlic and onions contain organosulfur compounds that support liver detoxification. Green tea provides EGCG, a catechin that can induce cancer cell death while leaving healthy cells unharmed."
      },
      {
        title: "Foods to Minimize or Avoid",
        content: "Just as important as what to eat is understanding what to limit. Processed meats are classified as Group 1 carcinogens by the WHO - meaning there's sufficient evidence they cause cancer. Heavily charred or grilled meats contain heterocyclic amines (HCAs) and polycyclic aromatic hydrocarbons (PAHs). Refined sugars and processed carbohydrates can promote insulin resistance and inflammation. Alcohol increases risk for multiple cancer types. Trans fats and excessive omega-6 oils promote inflammatory pathways."
      },
      {
        title: "The Anti-Inflammatory Approach",
        content: "Chronic inflammation is a key driver of cancer development. An anti-inflammatory diet emphasizes whole foods, healthy fats (especially omega-3s from fish, flax, and walnuts), abundant vegetables and fruits, and herbs and spices. The Mediterranean diet pattern consistently shows protective effects. Focus on colorful produce - the pigments that give foods their colors are often the same compounds that fight cancer. Aim for 8-10 servings of vegetables and fruits daily, with emphasis on variety."
      },
      {
        title: "Practical Implementation",
        content: "Transforming your diet doesn't require perfection - progress matters. Start by adding rather than restricting: add a serving of cruciferous vegetables daily, swap processed snacks for berries and nuts, use turmeric and garlic liberally in cooking. Prioritize organic for the 'Dirty Dozen' produce items. Stay well-hydrated with filtered water and green tea. Consider working with a nutrition-savvy practitioner to personalize your approach based on your health history and goals."
      }
    ],
    keyPoints: [
      "30-40% of cancers may be preventable through diet and lifestyle",
      "Cruciferous vegetables, berries, turmeric, and garlic are powerful anti-cancer foods",
      "Minimize processed meats, refined sugars, and alcohol",
      "Anti-inflammatory eating patterns (like Mediterranean diet) are protective",
      "Focus on adding protective foods rather than just restricting harmful ones"
    ]
  },
  "ancient-101-hippocratic-foundations": {
    sections: [
      {
        title: "The Father of Medicine",
        content: "Hippocrates of Kos (460-370 BC) is widely regarded as the 'Father of Medicine.' He separated medicine from superstition and established it as a discipline based on observation, reason, and natural causes. His most famous dictum — 'Let food be thy medicine and medicine be thy food' — remains a cornerstone of integrative health."
      },
      {
        title: "Vis Medicatrix Naturae: The Healing Power of Nature",
        content: "Central to Hippocratic medicine is the concept of Vis Medicatrix Naturae — the body's innate ability to heal itself. The physician's role is not to fight disease directly, but to support the body's natural healing mechanisms through proper nutrition, rest, exercise, and environmental factors."
      },
      {
        title: "The Four Humors Theory",
        content: "Hippocrates theorized that health depends on the balance of four bodily humors: blood, phlegm, yellow bile, and black bile. While we no longer use humoral theory literally, the concept of biological balance (homeostasis) and constitutional types remains relevant in modern functional medicine."
      },
      {
        title: "Primum Non Nocere: First, Do No Harm",
        content: "The Hippocratic principle of 'First, do no harm' guides modern integrative practice. Before adding interventions, consider whether they might cause harm. This principle supports the use of the least invasive, most natural approaches before escalating to stronger treatments."
      },
      {
        title: "Modern Applications of Hippocratic Wisdom",
        content: "Hippocratic principles map directly to modern integrative medicine: nutrition as therapy (functional nutrition), the body's self-healing capacity (regenerative medicine), individualized protocols (personalized medicine), and the importance of the member-practitioner relationship (therapeutic alliance)."
      }
    ],
    keyPoints: [
      "Hippocrates: Father of Medicine, 460-370 BC",
      "Vis Medicatrix Naturae: the body's innate healing power",
      "Four Humors: early model of biological balance (homeostasis)",
      "Primum Non Nocere: First, do no harm",
      "Hippocratic principles align with modern integrative medicine"
    ]
  },
  "ancient-102-ayurvedic-principles": {
    sections: [
      {
        title: "The Science of Life",
        content: "Ayurveda — from Sanskrit 'Ayur' (life) and 'Veda' (knowledge) — is a 5,000-year-old healing system from India. It views health as a state of balance between body, mind, and spirit, and disease as an imbalance in these fundamental energies."
      },
      {
        title: "The Three Doshas",
        content: "Ayurveda identifies three fundamental bio-energies (doshas): Vata (air/space — governs movement and communication), Pitta (fire/water — governs transformation and metabolism), and Kapha (earth/water — governs structure and stability). Every person has a unique doshic constitution (Prakriti)."
      },
      {
        title: "Constitutional Assessment",
        content: "Ayurvedic practitioners assess constitution through pulse diagnosis (Nadi Pariksha), tongue analysis, observation of physical characteristics, and detailed questioning about digestion, sleep, and temperament. This personalized approach predates modern pharmacogenomics by millennia."
      },
      {
        title: "Ayurvedic Therapeutics",
        content: "Treatment includes dietary modifications based on dosha, herbal formulations (Rasayana), massage with medicated oils (Abhyanga), yoga and pranayama, and Panchakarma — a five-step detoxification process. Each therapy is tailored to the individual's constitution."
      },
      {
        title: "Ayurveda Meets Modern Science",
        content: "Modern research validates many Ayurvedic herbs: Ashwagandha (adaptogenic, cortisol-modulating), Turmeric/Curcumin (anti-inflammatory), Triphala (gut health), and Brahmi (neuroprotective). Integrating Ayurvedic wisdom with modern testing creates powerful personalized protocols."
      }
    ],
    keyPoints: [
      "Ayurveda: 5,000-year-old 'Science of Life' from India",
      "Three doshas: Vata (air/space), Pitta (fire/water), Kapha (earth/water)",
      "Prakriti: unique constitutional type determines treatment approach",
      "Panchakarma: systematic five-step detoxification process",
      "Modern research validates ashwagandha, turmeric, triphala, brahmi"
    ]
  },
  "ancient-103-tcm-meridians": {
    sections: [
      {
        title: "Foundations of TCM",
        content: "Traditional Chinese Medicine (TCM), with over 2,500 years of history, views the body as an integrated system of energy (Qi) flowing through channels (meridians). Health exists when Qi flows freely; disease arises when flow is blocked, deficient, or excessive."
      },
      {
        title: "Yin, Yang, and the Five Elements",
        content: "TCM philosophy rests on Yin-Yang theory — complementary opposites in dynamic balance — and the Five Elements (Wu Xing): Wood, Fire, Earth, Metal, and Water. Each element corresponds to organ pairs, emotions, seasons, and therapeutic approaches."
      },
      {
        title: "The Meridian System",
        content: "Twelve primary meridians connect the body's organ systems, each with specific acupuncture points that influence Qi flow. The Lung meridian, for example, governs respiration and immunity; the Kidney meridian governs vitality and reproduction. Eight extraordinary meridians serve as reservoirs."
      },
      {
        title: "Acupuncture and Herbal Medicine",
        content: "Acupuncture stimulates specific meridian points using fine needles to restore Qi balance. TCM herbal formulas combine multiple herbs for synergistic effects — a concept remarkably similar to modern combination therapy. Classical formulas have been refined over thousands of years of clinical use."
      },
      {
        title: "TCM in Modern Integrative Practice",
        content: "TCM offers unique diagnostic insights (tongue and pulse diagnosis) and therapeutic tools that complement Western medicine. Acupuncture has strong evidence for pain management, nausea, and stress reduction. TCM herbs like astragalus and reishi have validated immune-modulating properties."
      }
    ],
    keyPoints: [
      "Qi: vital life force flowing through 12 primary meridians",
      "Yin-Yang: complementary opposites in dynamic balance",
      "Five Elements: Wood, Fire, Earth, Metal, Water",
      "Acupuncture restores Qi flow at specific meridian points",
      "TCM herbs (astragalus, reishi) have validated therapeutic properties"
    ]
  },
  "ancient-104-herbal-pharmacognosy": {
    sections: [
      {
        title: "From Folk Remedy to Pharmacology",
        content: "Pharmacognosy — the study of drugs from natural sources — bridges ancient herbal traditions and modern pharmaceutical science. Many of today's most important drugs originated from traditional plant medicines: aspirin from willow bark, digoxin from foxglove, morphine from opium poppy."
      },
      {
        title: "Key Adaptogenic Herbs",
        content: "Adaptogens help the body resist physical, chemical, and biological stress. Ashwagandha (Withania somnifera) modulates cortisol and supports thyroid function. Rhodiola rosea enhances mental performance under stress. Holy basil (Tulsi) balances cortisol and supports immune function."
      },
      {
        title: "Anti-Inflammatory Botanicals",
        content: "Turmeric (Curcuma longa) contains curcumin, which inhibits NF-κB and COX-2 pathways. Boswellia serrata inhibits 5-LOX enzyme. Ginger (Zingiber officinale) blocks prostaglandin synthesis. These herbs address inflammation through multiple mechanisms simultaneously."
      },
      {
        title: "Immune-Modulating Plants",
        content: "Astragalus (Huang Qi) enhances T-cell and NK cell activity. Echinacea stimulates innate immunity. Reishi (Ganoderma lucidum) contains beta-glucans that train the immune system. Elderberry (Sambucus nigra) has demonstrated antiviral properties against influenza."
      },
      {
        title: "Quality and Standardization",
        content: "Herbal quality varies enormously. Standardized extracts guarantee minimum levels of active compounds. Third-party testing verifies identity, potency, and absence of contaminants. Understanding extraction methods (water, ethanol, supercritical CO2) helps evaluate product quality."
      }
    ],
    keyPoints: [
      "Many modern drugs originated from traditional herbal medicines",
      "Adaptogens: ashwagandha, rhodiola, holy basil for stress resilience",
      "Curcumin, boswellia, ginger: multi-pathway anti-inflammatory action",
      "Astragalus, echinacea, reishi: validated immune modulation",
      "Standardized extracts and third-party testing ensure quality"
    ]
  },
  "ancient-105-detox-fasting": {
    sections: [
      {
        title: "Historical Detoxification Practices",
        content: "Every ancient healing tradition included detoxification protocols. Hippocrates prescribed fasting and purging. Ayurveda developed Panchakarma — a systematic five-therapy detox. TCM uses herbal formulas to clear 'heat toxins.' Native American traditions used sweat lodges. These practices recognized that toxic burden impairs healing."
      },
      {
        title: "The Science of Fasting",
        content: "Modern research validates ancient fasting practices. Intermittent fasting activates autophagy — the body's cellular recycling system. Extended fasting promotes stem cell regeneration. Time-restricted eating improves insulin sensitivity and reduces inflammation. The 2016 Nobel Prize in Medicine was awarded for autophagy research."
      },
      {
        title: "Panchakarma: Ayurvedic Detoxification",
        content: "Panchakarma includes five purification therapies: Vamana (therapeutic emesis), Virechana (purgation), Basti (medicated enemas), Nasya (nasal administration), and Raktamokshana (bloodletting). Modern adaptations focus on oil pulling, herbal laxatives, nasal irrigation, and gentle cleansing protocols."
      },
      {
        title: "Modern Detoxification Integration",
        content: "Modern detox protocols combine ancient wisdom with current science: infrared sauna therapy (mimics sweat lodge), coffee enemas (liver bile stimulation), chelation therapy (heavy metal removal), glutathione support, and targeted binders (activated charcoal, bentonite clay, chlorella)."
      },
      {
        title: "Clinical Protocols and Safety",
        content: "Safe detoxification requires proper preparation, adequate hydration, electrolyte support, and gradual progression. Members with high toxic burden may experience healing crises. Pre-detox assessment should include liver function, kidney function, and baseline symptom scoring."
      }
    ],
    keyPoints: [
      "Every ancient tradition included detoxification protocols",
      "Fasting activates autophagy — cellular recycling (Nobel Prize 2016)",
      "Panchakarma: Ayurveda's systematic five-therapy detox",
      "Modern equivalents: infrared sauna, binders, glutathione, chelation",
      "Safe detox requires preparation, hydration, and clinical oversight"
    ]
  },
  "ancient-106-integration-protocols": {
    sections: [
      {
        title: "The Integration Framework",
        content: "True integrative medicine combines the best of ancient and modern approaches. The framework uses ancient diagnostic insights (constitutional types, pattern recognition) alongside modern testing (labs, imaging) to create comprehensive treatment plans that address root causes."
      },
      {
        title: "Combining Herbal and Peptide Therapies",
        content: "Ancient herbal formulas can synergize with modern peptide therapy. Ashwagandha supports the HPA axis while Thymosin Alpha-1 modulates immunity. Turmeric's anti-inflammatory action complements BPC-157's tissue healing. Astragalus pairs with Epithalon for longevity support."
      },
      {
        title: "IV Nutrition Meets Traditional Medicine",
        content: "IV therapy provides modern delivery of nutrients recognized by ancient traditions. High-dose vitamin C (Linus Pauling's legacy) combines with traditional immune herbs. Myers' Cocktail delivers minerals emphasized by Ayurvedic and TCM practitioners. NAD+ therapy supports the mitochondrial function valued by all healing traditions."
      },
      {
        title: "Constitutional Assessment Integration",
        content: "Ayurvedic dosha typing and TCM pattern diagnosis can complement modern functional medicine testing. A Vata-dominant member may need different supplement timing than Kapha-dominant. TCM blood stasis patterns may correlate with modern inflammatory markers."
      },
      {
        title: "Building Comprehensive Protocols",
        content: "The ideal protocol layers: foundational nutrition (ancient dietary wisdom + modern supplementation), detoxification (traditional methods + modern binders), regeneration (herbal adaptogens + therapeutic peptides), and maintenance (lifestyle practices from multiple traditions)."
      }
    ],
    keyPoints: [
      "Integration framework: ancient diagnostics + modern testing",
      "Herbal-peptide synergies: ashwagandha + thymosin, turmeric + BPC-157",
      "IV therapy delivers nutrients valued by all healing traditions",
      "Constitutional typing adds personalization to modern protocols",
      "Layered protocols: nutrition, detox, regeneration, maintenance"
    ]
  },
  "ppm-101-pharmacokinetics": {
    sections: [
      {
        title: "Peptide Absorption & Bioavailability",
        content: "Therapeutic peptides face unique pharmacokinetic challenges. Most peptides have poor oral bioavailability (<2%) due to enzymatic degradation in the GI tract and limited membrane permeability. Subcutaneous injection is the primary delivery route, offering 50-80% bioavailability with slow, sustained absorption from the injection depot."
      },
      {
        title: "Distribution and Half-Life",
        content: "After absorption, peptides distribute through the bloodstream to target tissues. Most therapeutic peptides have short half-lives (minutes to hours) due to rapid enzymatic degradation by peptidases. Modifications like PEGylation, fatty acid conjugation (as in semaglutide), or DAC technology extend half-lives dramatically."
      },
      {
        title: "Metabolism and Elimination",
        content: "Unlike small-molecule drugs metabolized by CYP450 enzymes, peptides are broken down by ubiquitous peptidases into amino acid components that are recycled. This means peptide-drug interactions via liver metabolism are minimal — a significant safety advantage over conventional pharmaceuticals."
      },
      {
        title: "Dosing Principles",
        content: "Peptide dosing depends on half-life, target tissue concentration, and individual factors (body weight, body composition, injection site vascularity). Short half-life peptides (BPC-157, Ipamorelin) require daily dosing, while modified peptides (semaglutide) allow weekly administration."
      },
      {
        title: "Factors Affecting Peptide PK",
        content: "Injection site (abdomen vs. thigh vs. deltoid affects absorption rate), injection depth (subcutaneous vs. intramuscular), member body composition, hydration status, and local blood flow all influence peptide pharmacokinetics. Understanding these variables enables optimized dosing."
      }
    ],
    keyPoints: [
      "Most peptides: <2% oral bioavailability, 50-80% subcutaneous",
      "Short half-lives (minutes-hours) unless chemically modified",
      "Degraded by peptidases, not CYP450 — minimal drug interactions",
      "Dosing depends on half-life, body composition, injection site",
      "PEGylation and fatty acid conjugation extend duration of action"
    ]
  },
  "ppm-102-reconstitution-handling": {
    sections: [
      {
        title: "Understanding Lyophilized Peptides",
        content: "Therapeutic peptides are typically supplied as lyophilized (freeze-dried) powder for stability. Lyophilization removes water while preserving the peptide's three-dimensional structure. The resulting powder is stable at room temperature for shipping but requires proper reconstitution before use."
      },
      {
        title: "Reconstitution Technique",
        content: "Reconstitute with bacteriostatic water (BAC water) containing 0.9% benzyl alcohol as a preservative. Inject water slowly down the vial wall — never directly onto the powder. Swirl gently to dissolve; never shake, as this can denature the peptide. Allow bubbles to settle before drawing doses."
      },
      {
        title: "Storage Requirements",
        content: "Unreconstituted peptides: store at room temperature or refrigerate for extended shelf life. Once reconstituted: refrigerate at 2-8°C (35-46°F). Use within 2-4 weeks of reconstitution. Never freeze reconstituted peptides. Protect from light. Never expose to temperatures above 77°F (25°C)."
      },
      {
        title: "Sterile Handling Procedures",
        content: "Always swab vial tops with 70% isopropyl alcohol before piercing. Use new, sterile syringes and needles for each dose. Draw the correct volume using an insulin syringe with appropriate markings. Proper sharps disposal in puncture-resistant containers is essential."
      },
      {
        title: "Concentration Calculations",
        content: "Understanding concentration math is critical. Example: 5mg peptide reconstituted with 2mL BAC water = 2.5mg/mL = 2,500 mcg/mL. For a 250 mcg dose: 250/2500 = 0.1mL = 10 units on an insulin syringe. Always verify calculations before injection."
      }
    ],
    keyPoints: [
      "Lyophilized = freeze-dried for stability, requires reconstitution",
      "Use bacteriostatic water, inject slowly down vial wall, swirl gently",
      "Refrigerate at 2-8°C after reconstitution, use within 2-4 weeks",
      "Sterile technique: alcohol swab, new syringe each time",
      "Calculate concentration carefully: mg/mL to mcg per syringe unit"
    ]
  },
  "ppm-103-healing-peptides": {
    sections: [
      {
        title: "BPC-157: The Body Protection Compound",
        content: "BPC-157 is a 15-amino acid peptide derived from human gastric juice. It promotes angiogenesis, modulates growth factors, and accelerates healing across tendons, ligaments, muscle, gut, and even nerve tissue. Standard dosing: 250-500 mcg subcutaneously, 1-2x daily. Inject near the injury site for local effects or abdominally for systemic effects."
      },
      {
        title: "TB-500: Thymosin Beta-4",
        content: "TB-500 promotes tissue repair by upregulating actin — a protein essential for cell migration and wound healing. It reduces inflammation, promotes blood vessel growth, and supports flexibility. Loading phase: 2-2.5mg 2x/week for 4-6 weeks. Maintenance: 2mg every 2 weeks. Excellent for chronic injuries."
      },
      {
        title: "KPV: The Anti-Inflammatory Tripeptide",
        content: "KPV (Lys-Pro-Val) is a tripeptide fragment of alpha-MSH with potent anti-inflammatory properties. Particularly effective for gut inflammation (IBD, colitis) and skin conditions. Can be administered subcutaneously (200-500 mcg daily), orally in capsule form, or topically for skin conditions."
      },
      {
        title: "Stacking Strategies",
        content: "BPC-157 + TB-500 is the classic healing stack. They work through complementary mechanisms — BPC-157 promotes angiogenesis while TB-500 supports cell migration. Add KPV when inflammation is significant. Typical healing protocol: 8-12 weeks with reassessment at 6 weeks."
      },
      {
        title: "Clinical Case Applications",
        content: "Rotator cuff tendinopathy: BPC-157 250mcg + TB-500 2mg near the shoulder. Post-surgical recovery: BPC-157 500mcg systemically. Inflammatory bowel issues: BPC-157 250mcg sub-Q + KPV 500mcg orally. Chronic tendonitis: Full BPC/TB stack for 12 weeks. Document baseline and progress imaging/symptoms."
      }
    ],
    keyPoints: [
      "BPC-157: 250-500 mcg, 1-2x daily, near injury or systemic",
      "TB-500: 2-2.5mg 2x/week loading, 2mg bi-weekly maintenance",
      "KPV: 200-500 mcg daily, potent anti-inflammatory for gut/skin",
      "BPC-157 + TB-500: classic complementary healing stack",
      "8-12 week protocols with reassessment at 6 weeks"
    ]
  },
  "ppm-104-immune-longevity": {
    sections: [
      {
        title: "Thymosin Alpha-1: Immune Commander",
        content: "Thymosin Alpha-1 (TA1) is a 28-amino acid peptide naturally produced by the thymus gland. It enhances T-cell maturation, NK cell activity, and dendritic cell function. FDA-approved in 35+ countries for hepatitis B/C and as an immune adjuvant. Standard dose: 1.6mg subcutaneously, 2-3x/week."
      },
      {
        title: "Epithalon: The Telomere Guardian",
        content: "Epithalon (Epitalon) is a synthetic tetrapeptide (Ala-Glu-Asp-Gly) based on the natural pineal peptide Epithalamin. It activates telomerase, potentially slowing cellular aging. Also regulates melatonin production and circadian rhythm. Protocol: 5-10mg daily subcutaneously for 10-20 day courses, 2-3x per year."
      },
      {
        title: "GHK-Cu: Copper Peptide for Regeneration",
        content: "GHK-Cu (glycyl-L-histidyl-L-lysine copper complex) naturally occurs in human plasma. It promotes collagen synthesis, wound healing, and tissue remodeling. Declines with age from 200ng/mL at age 20 to 80ng/mL by age 60. Can be applied topically (skin) or subcutaneously (1-2mg daily) for systemic effects."
      },
      {
        title: "Longevity Stack Design",
        content: "A comprehensive longevity protocol might include: Epithalon (10-20 day course 2x/year), Thymosin Alpha-1 (ongoing immune support), GHK-Cu (topical + intermittent sub-Q), supported by NAD+ precursors, resveratrol, and targeted bioregulators for organ-specific support."
      },
      {
        title: "Monitoring and Safety",
        content: "Monitor immune markers (lymphocyte subsets, NK cell activity) for TA1. Track sleep quality and melatonin levels for Epithalon. Document skin quality metrics for GHK-Cu. These peptides have excellent safety profiles with decades of clinical use, but regular lab monitoring ensures optimal outcomes."
      }
    ],
    keyPoints: [
      "Thymosin Alpha-1: 1.6mg 2-3x/week for immune enhancement",
      "Epithalon: 5-10mg daily x 10-20 days, 2-3 courses/year for telomere support",
      "GHK-Cu: topical or 1-2mg sub-Q daily for tissue regeneration",
      "Longevity stack: Epithalon + TA1 + GHK-Cu + NAD+ support",
      "Monitor immune markers, sleep quality, and skin metrics"
    ]
  },
  "ppm-105-metabolic-peptides": {
    sections: [
      {
        title: "GLP-1 Receptor Agonists Overview",
        content: "GLP-1 receptor agonists (semaglutide, tirzepatide) mimic the incretin hormone GLP-1, reducing appetite, slowing gastric emptying, and enhancing insulin secretion. They've revolutionized weight management and metabolic health. Tirzepatide additionally targets GIP receptors for enhanced effects."
      },
      {
        title: "Semaglutide Titration Protocol",
        content: "Week 1-4: 0.25mg weekly. Week 5-8: 0.5mg weekly. Week 9-12: 1.0mg weekly. Week 13+: 1.7-2.4mg as tolerated. Never skip titration steps — rushing causes severe nausea. Compounded semaglutide follows similar titration with different concentration calculations."
      },
      {
        title: "Growth Hormone Secretagogues",
        content: "Ipamorelin: selective GH secretagogue, 200-300mcg sub-Q before bed on empty stomach. CJC-1295 (no DAC): GHRH analog, 100mcg combined with Ipamorelin for synergistic GH pulse. Tesamorelin: FDA-approved for HIV-associated lipodystrophy, 2mg daily. These stimulate natural GH release rather than replacing it."
      },
      {
        title: "Managing GLP-1 Side Effects",
        content: "Nausea: eat smaller, protein-rich meals; avoid fatty/spicy foods; ginger helps. Constipation: increase fiber and water intake. Injection site reactions: rotate sites, ensure proper technique. Fatigue: ensure adequate caloric intake despite reduced appetite. Pancreatitis (rare): discontinue and evaluate if severe abdominal pain occurs."
      },
      {
        title: "Comprehensive Metabolic Protocols",
        content: "Weight management: GLP-1 agonist + protein optimization (1g/lb lean mass) + resistance training + targeted supplements (B12, magnesium, omega-3). Body composition: add Ipamorelin/CJC-1295 for GH support. Metabolic syndrome: combine GLP-1 with berberine, chromium, and lifestyle interventions."
      }
    ],
    keyPoints: [
      "Semaglutide titration: 0.25mg → 0.5mg → 1.0mg → maintenance over 12+ weeks",
      "Tirzepatide: dual GIP/GLP-1 for enhanced metabolic effects",
      "Ipamorelin 200-300mcg + CJC-1295 100mcg before bed for GH support",
      "Protein intake critical: 1g per pound of lean mass on GLP-1 therapy",
      "Layer metabolic peptides with nutrition, exercise, and supplements"
    ]
  },
  "ppm-106-patient-management": {
    sections: [
      {
        title: "Member Assessment for Peptide Therapy",
        content: "Comprehensive assessment includes: medical history review, current medications, contraindications screening, baseline labs (CBC, CMP, hormones, inflammatory markers), body composition analysis, and treatment goals. Document everything for medical-legal protection and outcome tracking."
      },
      {
        title: "Protocol Selection Framework",
        content: "Match peptides to member needs: Healing/recovery → BPC-157/TB-500 stack. Immune support → Thymosin Alpha-1. Anti-aging → Epithalon + GHK-Cu. Weight management → GLP-1 agonist. Gut health → BPC-157 + KPV. Consider member comfort with injections, budget, and commitment level."
      },
      {
        title: "Monitoring and Adjustments",
        content: "Schedule follow-ups at 2, 6, and 12 weeks. Reassess symptoms, side effects, and labs. Adjust dosing based on response — some members need lower doses (higher sensitivity) while others need maximum therapeutic doses. Document all changes and rationale."
      },
      {
        title: "Managing Expectations and Compliance",
        content: "Set realistic timelines: healing peptides show results in 2-4 weeks, GLP-1 weight loss is gradual (1-2 lbs/week), longevity peptides require consistent courses over months/years. Provide clear injection training. Consider telemedicine check-ins to support compliance."
      },
      {
        title: "Documentation and Safety",
        content: "Maintain detailed records: informed consent, protocol prescribed, doses administered, adverse events, lab results, and outcomes. Have adverse event protocols in place. Know when to discontinue (severe reactions, contraindication development). Stay current with emerging research and safety data."
      }
    ],
    keyPoints: [
      "Comprehensive assessment: history, labs, body comp, goals",
      "Match peptide protocols to specific member needs and preferences",
      "Monitor at 2, 6, 12 weeks; adjust based on response",
      "Set realistic timelines: weeks for healing, months for metabolic",
      "Document everything: consent, protocols, adverse events, outcomes"
    ]
  },
  "fa-101-formulation-principles": {
    sections: [
      {
        title: "Bioavailability and Delivery Systems",
        content: "The effectiveness of any therapeutic formula depends on bioavailability — how much of the active ingredient actually reaches its target. Delivery systems include oral (capsules, liquids, liposomal), sublingual, transdermal, injectable, and intravenous. Each has distinct advantages: IV provides 100% bioavailability while oral may deliver only 5-20% depending on the compound."
      },
      {
        title: "Synergistic Formulation Design",
        content: "Great formulations leverage synergy — combining ingredients that enhance each other's effects. Curcumin + piperine (2,000% enhanced absorption). Vitamin C + iron (enhanced iron absorption). Vitamin D + K2 (directs calcium to bones, not arteries). Understanding these relationships is the art of formulation science."
      },
      {
        title: "Antagonistic Interactions to Avoid",
        content: "Some ingredients compete or interfere with each other. Calcium inhibits iron and zinc absorption. High-dose zinc depletes copper. Fiber can bind minerals and reduce absorption. Timing strategies (separating competing nutrients by 2+ hours) can mitigate antagonism while still providing all needed nutrients."
      },
      {
        title: "Stability and Shelf Life",
        content: "Formulation stability affects potency over time. Factors include pH, temperature, light exposure, moisture, and ingredient interactions. Probiotics require careful handling. Omega-3 oils oxidize easily. Antioxidants like vitamin E can serve as stabilizers. Proper packaging (amber glass, nitrogen flushing) protects sensitive ingredients."
      },
      {
        title: "Dose-Response Relationships",
        content: "More isn't always better. Many nutrients and compounds have U-shaped or bell-shaped dose-response curves. Low-dose vitamin D supplementation helps bone health; mega-doses can cause toxicity. Understanding therapeutic windows — the range between minimum effective dose and maximum safe dose — is essential for protocol design."
      }
    ],
    keyPoints: [
      "Bioavailability varies by delivery: IV 100%, oral 5-20% for many compounds",
      "Synergistic pairings: curcumin + piperine, vitamin C + iron, D3 + K2",
      "Antagonistic interactions: calcium vs iron, zinc vs copper",
      "Stability factors: pH, temperature, light, moisture, packaging",
      "Therapeutic windows: minimum effective to maximum safe dose"
    ]
  },
  "fa-102-ingredient-synergies": {
    sections: [
      {
        title: "Understanding Synergy Types",
        content: "Pharmacological synergy occurs when combined ingredients produce effects greater than additive. Pharmacokinetic synergy improves absorption, distribution, or reduces elimination. Piperine + curcumin is pharmacokinetic synergy (enhanced absorption). CBD + terpenes is pharmacological synergy (entourage effect)."
      },
      {
        title: "Vitamin and Mineral Interactions",
        content: "Vitamin C enhances non-heme iron absorption by converting Fe3+ to Fe2+. Vitamin D increases calcium absorption from 10-15% to 30-40%. Vitamin K2 directs calcium to bones and teeth, away from soft tissues. Magnesium is required to convert vitamin D to its active form. B vitamins work as a complex — deficiency in one affects all."
      },
      {
        title: "Botanical Synergies",
        content: "Traditional herbal formulas have always combined multiple plants for synergy. Turmeric + ginger: enhanced anti-inflammatory action. Ashwagandha + rhodiola: complementary stress adaptation pathways. Milk thistle + NAC: liver protection and glutathione support. Berberine + cinnamon: blood sugar regulation through different mechanisms."
      },
      {
        title: "Nutrient-Drug Interactions",
        content: "Some nutrients interact with pharmaceuticals: CoQ10 depleted by statins (supplement alongside). Magnesium affects antibiotic absorption (separate by 2 hours). Vitamin K interacts with warfarin (maintain consistent intake). Grapefruit inhibits CYP3A4. Knowledge of these interactions prevents adverse outcomes."
      },
      {
        title: "Designing Synergistic Formulas",
        content: "Start with the primary therapeutic goal. Add synergistic co-factors. Include absorption enhancers appropriate for the delivery system. Avoid antagonistic pairings. Consider timing protocols for nutrients that compete. Test combinations for stability. Document rationale for every ingredient inclusion."
      }
    ],
    keyPoints: [
      "Pharmacological synergy: enhanced combined effects (CBD + terpenes)",
      "Pharmacokinetic synergy: improved absorption (piperine + curcumin)",
      "Key vitamin synergies: D3+K2+magnesium, C+iron, B-complex together",
      "Botanical combos: turmeric+ginger, ashwagandha+rhodiola, berberine+cinnamon",
      "Design process: goal → synergists → enhancers → avoid antagonists"
    ]
  },
  "fa-103-iv-formulation": {
    sections: [
      {
        title: "IV Therapy Fundamentals",
        content: "Intravenous therapy delivers nutrients directly to the bloodstream, achieving 100% bioavailability. This bypasses GI absorption barriers, making it ideal for members with malabsorption, acute deficiencies, or conditions requiring high tissue concentrations. Understanding osmolarity, pH, and compatibility is essential for safe IV formulation."
      },
      {
        title: "The Myers' Cocktail and Variations",
        content: "Dr. John Myers' original formula: magnesium chloride, calcium gluconate, vitamin B-complex, B12, and vitamin C in sterile water. Modern variations add glutathione, zinc, selenium, or taurine. Standard infusion: 150-250mL over 30-45 minutes. Customize based on member needs and lab values."
      },
      {
        title: "High-Dose Vitamin C Protocols",
        content: "High-dose IV vitamin C (25-100g) is used for immune support, as an adjunct in cancer care, and for viral illness. Requires G6PD screening before first infusion. Osmolarity increases with concentration — dilution and slow infusion rates prevent vein irritation. Monitor renal function with repeated high doses."
      },
      {
        title: "Compatibility and Stability Considerations",
        content: "Not all nutrients can be mixed. Calcium and phosphate can precipitate. B vitamins are light-sensitive — protect IV bags from light. Vitamin C degrades rapidly once mixed — prepare immediately before infusion. pH extremes destabilize many nutrients. Use compatibility charts and pharmaceutical references."
      },
      {
        title: "NAD+ and Glutathione Infusions",
        content: "NAD+ (nicotinamide adenine dinucleotide) infusions support cellular energy and repair. Start at 250mg over 2-4 hours; work up to 500-1000mg. Rate-limiting side effects include chest tightness and nausea — slow the drip. Glutathione (600-2000mg) is the master antioxidant; push IV or slow drip. Both should be infused separately from other nutrients."
      }
    ],
    keyPoints: [
      "IV therapy: 100% bioavailability, bypasses GI absorption barriers",
      "Myers' Cocktail: Mg, Ca, B-complex, B12, vitamin C base formula",
      "High-dose vitamin C: screen G6PD first, monitor renal function",
      "Compatibility: Ca+phosphate precipitate, vitamin C degrades rapidly",
      "NAD+: start 250mg, titrate up; glutathione: push IV or slow drip"
    ]
  },
  "fa-104-supplement-optimization": {
    sections: [
      {
        title: "Timing Is Everything",
        content: "Nutrient timing significantly affects absorption. Fat-soluble vitamins (A, D, E, K) with meals containing fat. Iron on an empty stomach (or with vitamin C). Magnesium before bed for sleep support. Probiotics on an empty stomach or just before meals. B vitamins in the morning to avoid sleep disruption. Separate competing minerals by 2+ hours."
      },
      {
        title: "Form Matters: Choosing the Right Forms",
        content: "Magnesium glycinate (calming, well-absorbed) vs. oxide (laxative effect, poorly absorbed). Methylfolate vs. folic acid (bypasses MTHFR gene variants). Methylcobalamin vs. cyanocobalamin. Zinc picolinate or bisglycinate vs. zinc oxide. Choosing superior forms dramatically improves therapeutic outcomes."
      },
      {
        title: "Building Condition-Specific Stacks",
        content: "Sleep stack: magnesium glycinate + L-theanine + GABA + melatonin. Immune stack: vitamin D3 + K2 + zinc + vitamin C + quercetin. Joint health: glucosamine + MSM + collagen + vitamin C + BPC-157. Energy: B-complex + CoQ10 + iron (if deficient) + D-ribose. Always start with foundations before adding specialized supplements."
      },
      {
        title: "The Foundation Protocol",
        content: "Before condition-specific stacking, establish foundations: high-quality multivitamin/mineral, omega-3 fatty acids (EPA/DHA), vitamin D3 + K2 (dose based on blood levels), magnesium (most people need 400-600mg), and probiotics. Test, don't guess — use lab work to identify individual deficiencies."
      },
      {
        title: "Absorption Enhancers and Blockers",
        content: "Enhancers: piperine (broad spectrum), fat with fat-soluble nutrients, vitamin C with iron, lactoferrin with iron, phospholipids (liposomal delivery). Blockers: phytates (grains/legumes), oxalates (spinach/chocolate), tannins (tea/coffee), calcium with iron/zinc, antacids reducing mineral absorption."
      }
    ],
    keyPoints: [
      "Fat-soluble vitamins with meals; iron empty stomach; magnesium at bedtime",
      "Superior forms: glycinate, methylated B vitamins, picolinate zinc",
      "Foundation first: multi, omega-3, D3+K2, magnesium, probiotics",
      "Condition stacks: sleep, immune, joint, energy — build on foundations",
      "Piperine, vitamin C, fats enhance; phytates, tannins, calcium block"
    ]
  },
  "fa-105-quality-assurance": {
    sections: [
      {
        title: "cGMP Manufacturing Standards",
        content: "Current Good Manufacturing Practice (cGMP) regulations ensure products are consistently produced and controlled to quality standards. Key elements: facility cleanliness and environmental controls, equipment maintenance and calibration, raw material testing, in-process quality checks, and finished product testing."
      },
      {
        title: "Certificate of Analysis (COA) Interpretation",
        content: "A proper COA should include: product identity confirmation, potency/assay results (within specification), purity testing, microbial limits (total plate count, yeast/mold, pathogens), heavy metal testing (Pb, Hg, As, Cd), and the testing laboratory's accreditation. Learn to read COAs critically — not all testing is equally rigorous."
      },
      {
        title: "Third-Party Testing Programs",
        content: "Independent verification programs include USP Verified, NSF International, ConsumerLab, and BSCG (for sports supplements). These programs test for identity, potency, purity, and contaminants. Products with third-party verification provide an additional layer of consumer confidence."
      },
      {
        title: "Peptide-Specific Quality Standards",
        content: "Therapeutic peptides require: minimum 98% purity by HPLC, mass spectrometry confirmation of molecular weight, amino acid analysis for sequence verification, endotoxin testing, sterility testing for injectable products, and stability data showing potency retention over shelf life."
      },
      {
        title: "Red Flags and Due Diligence",
        content: "Warning signs of poor quality: no COA available, proprietary blends hiding doses, unrealistic health claims, dramatically lower prices than competitors, no manufacturing facility information, and resistance to sharing testing data. Always verify supplier credentials and request documentation."
      }
    ],
    keyPoints: [
      "cGMP: facility controls, equipment calibration, raw material testing",
      "COA must include identity, potency, purity, microbial, heavy metals",
      "Third-party programs: USP Verified, NSF, ConsumerLab, BSCG",
      "Peptides: 98%+ purity HPLC, mass spec, endotoxin testing",
      "Red flags: no COA, proprietary blends, unrealistic claims, low prices"
    ]
  },
  "fa-106-protocol-design": {
    sections: [
      {
        title: "Assessment-Driven Protocol Design",
        content: "Effective protocol design starts with thorough assessment: comprehensive lab panel (CBC, CMP, thyroid, hormones, nutrients, inflammatory markers), symptom questionnaire, dietary analysis, toxin exposure history, and treatment goals. Never design protocols based on symptoms alone — test to identify root causes."
      },
      {
        title: "The Protocol Layering Framework",
        content: "Layer 1: Foundation (correct deficiencies, optimize nutrition). Layer 2: Remove (detoxification, eliminate inflammatory triggers). Layer 3: Repair (gut healing, tissue regeneration with peptides). Layer 4: Optimize (hormones, immune modulation, performance). Each layer builds on the previous — don't skip ahead."
      },
      {
        title: "Case Study: Chronic Fatigue Member",
        content: "Assessment reveals: low vitamin D (18 ng/mL), suboptimal B12, elevated inflammatory markers, poor sleep. Protocol: Foundation — D3 5000IU + K2, methylated B-complex, magnesium glycinate 400mg. Repair — BPC-157 250mcg for gut healing. Optimize — Thymosin Alpha-1 for immune regulation. Reassess at 8 weeks."
      },
      {
        title: "Case Study: Post-Surgical Recovery",
        content: "Goal: accelerate healing, reduce inflammation, prevent complications. Protocol: BPC-157 500mcg + TB-500 2.5mg near surgical site. IV vitamin C 25g + Myers' Cocktail weekly. Oral: zinc 30mg, vitamin C 2g, collagen peptides, bromelain. GHK-Cu topically around incision site. Protocol: 8 weeks post-surgery."
      },
      {
        title: "Protocol Monitoring and Iteration",
        content: "Schedule follow-ups at 2, 4, 8, and 12 weeks. Track objective markers (labs, imaging) and subjective symptoms (pain scales, energy ratings, sleep quality). Adjust protocols based on response: escalate if insufficient, de-escalate if goals are met. Document everything for continuous improvement of outcomes."
      }
    ],
    keyPoints: [
      "Assessment first: comprehensive labs, symptoms, diet, toxin history",
      "Layer framework: Foundation → Remove → Repair → Optimize",
      "Case-based learning reinforces clinical decision-making",
      "Combine IV nutrition, peptides, and supplements for comprehensive care",
      "Monitor at 2, 4, 8, 12 weeks; adjust based on objective and subjective data"
    ]
  }
};

interface ModuleContent {
  sections: Array<{ title: string; content: string }>;
  keyPoints: string[];
  pdfUrl?: string;
  videoUrl?: string;
  interactiveElements?: Array<{ type: string; title: string; data?: any }>;
}

export default function TrainingModulePage() {
  const [match, params] = useRoute("/training/:slug");
  const slug = params?.slug;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCompleted, setIsCompleted] = useState(false);

  const { data: module, isLoading, error } = useQuery<TrainingModule>({
    queryKey: ["/api/training/modules", slug],
    enabled: !!slug,
  });

  const { data: dbContent } = useQuery<ModuleContent>({
    queryKey: ["/api/training/modules", module?.id, "content"],
    queryFn: async () => {
      const res = await fetch(`/api/training/modules/${module?.id}/content`);
      if (!res.ok) return null;
      const data = await res.json();
      if (data.sections?.length > 0) return data;
      return null;
    },
    enabled: !!module?.id && !!module?.isInteractive,
  });

  const { data: progressData } = useQuery({
    queryKey: ["/api/learning/progress", module?.id],
    queryFn: async () => {
      const res = await fetch(`/api/learning/progress/${module?.id}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!module?.id,
  });

  const markCompleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/learning/progress/${module?.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progressPercentage: 100, status: "completed" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to mark as complete" }));
        throw new Error(err.error || "Failed to mark as complete");
      }
      return res.json();
    },
    onSuccess: () => {
      setIsCompleted(true);
      queryClient.invalidateQueries({ queryKey: ["/api/learning/progress", module?.id] });
      toast({
        title: "Module Completed!",
        description: `You've successfully completed "${module?.title}".`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Could not mark module as complete. Please try again.",
        variant: "destructive",
      });
    },
  });

  const alreadyCompleted = isCompleted || progressData?.status === "completed";

  if (!match || !slug) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Module not found</p>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !module) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Failed to load module</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/training">Back to Training</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const staticContent = moduleContent[slug];
  const isPeptideModule = slug.startsWith("peptide-");
  const isInteractiveModule = module.isInteractive || isPeptideModule;
  
  const content = dbContent || staticContent;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/training" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {getModuleIcon(slug)}
            </div>
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-module-title">{module.title}</h1>
              <div className="flex items-center gap-3 mt-1">
                {module.category && (
                  <Badge variant="outline">{module.category}</Badge>
                )}
                <Badge className={getDifficultyColor(module.difficulty)}>
                  {module.difficulty}
                </Badge>
                {module.duration && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {module.duration}
                  </span>
                )}
                {isInteractiveModule && (
                  <Badge variant="secondary" className="bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400">
                    Interactive
                  </Badge>
                )}
                {dbContent && (
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                    MUSE AI
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isInteractiveModule && content ? (
        hasKnowledgeCheck(module.id) ? (
          <EnhancedInteractiveModule
            moduleId={module.id}
            moduleTitle={module.title}
            sections={content.sections}
            keyPoints={content.keyPoints}
            knowledgeChecks={getKnowledgeChecksForModule(module.id)}
            instructorName={module.instructorName || "Dr. Miller"}
            instructorTitle={module.instructorTitle || "Medical Director"}
            onComplete={() => markCompleteMutation.mutate()}
          />
        ) : (
          <InteractiveTrainingPlayer
            title={module.title}
            description={module.description || undefined}
            videoUrl={isPlaceholderVideoUrl(module.videoUrl) ? null : module.videoUrl}
            audioUrl={module.audioUrl}
            pdfUrl={(staticContent as any)?.pdfUrl || module.pdfUrl}
            driveFileId={module.driveFileId}
            sections={content.sections}
            keyPoints={content.keyPoints}
            onComplete={() => markCompleteMutation.mutate()}
          />
        )
      ) : (
        <Card className="border-card-border" data-testid="card-module-content">
        <CardHeader>
          <CardDescription className="text-base">
            {module.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {content?.sections.map((section, index) => (
            <div key={index} className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </span>
                {section.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed pl-8">
                {section.content}
              </p>
            </div>
          ))}

          {content?.keyPoints && (
            <div className="bg-muted/50 rounded-lg p-6 mt-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-cyan-500" />
                Key Takeaways
              </h3>
              <ul className="space-y-2">
                {content.keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-cyan-500 mt-0.5 shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {content?.pdfUrl && (
            <div className="border-t pt-6 mt-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Download Full Document
              </h3>
              <Button asChild data-testid="button-download-pdf">
                <a href={content.pdfUrl} target="_blank" rel="noopener noreferrer" download>
                  <Download className="mr-2 h-4 w-4" />
                  Download FF Handbook (PDF)
                </a>
              </Button>
            </div>
          )}
        </CardContent>
        </Card>
      )}

      {slug.startsWith("ecs-") && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-primary/20" data-testid="card-quiz-section">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Test Your Knowledge
              </CardTitle>
              <CardDescription>
                Take a quick quiz to reinforce what you've learned in this module.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InteractiveQuiz
                title="ECS Knowledge Check"
                questions={ECS_QUIZ}
                moduleSlug={slug}
                onComplete={(score, total) => {
                  console.log(`Quiz completed: ${score}/${total}`);
                }}
              />
            </CardContent>
          </Card>

          <AITutor moduleSlug={slug} moduleTitle={module.title} />
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" asChild>
          <Link href="/training" data-testid="button-back-training">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Training
          </Link>
        </Button>
        <Button
          data-testid="button-mark-complete"
          disabled={alreadyCompleted || markCompleteMutation.isPending}
          onClick={() => markCompleteMutation.mutate()}
          variant={alreadyCompleted ? "outline" : "default"}
        >
          {markCompleteMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="mr-2 h-4 w-4" />
          )}
          {alreadyCompleted ? "Completed" : markCompleteMutation.isPending ? "Saving..." : "Mark as Complete"}
        </Button>
      </div>
    </div>
  );
}
