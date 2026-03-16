import { useState, useEffect, useCallback } from "react";
import { Link as RouterLink } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { RoleToggle } from "@/components/role-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import {
  Brain,
  Sparkles,
  Volume2,
  Film,
  Calculator,
  TrendingUp,
  Shield,
  Globe,
  Users,
  Zap,
  Activity,
  Database,
  Cloud,
  ChevronRight,
  Play,
  Pause,
  Settings,
  MessageSquare,
  FileText,
  Target,
  Lightbulb,
  Radio,
  Waves,
  Heart,
  Dna,
  Pill,
  Leaf,
  Bot,
  Handshake,
  Cpu,
  Atom,
  Star,
  ArrowRight,
  CheckCircle2,
  Clock,
  Layers,
  Gift,
  Trophy,
  Compass,
  BookOpen,
  Folder,
  Link,
  MessageCircle,
  Lock,
  Eye,
  Sword,
  Crown,
  Flame,
  Scale,
  FileSignature,
  Gavel,
  ScrollText,
  ShieldCheck,
  Briefcase,
  CircuitBoard,
  Mail,
  Calendar,
  Plane,
  FolderOpen,
  UserCheck,
  Bell,
  AlertTriangle,
  Home,
  Download,
  Search,
  Palette,
  PenTool,
  Code,
  Terminal,
  Server,
  Wrench,
  Network,
  Binary,
  FlaskConical,
  TestTube,
  Beaker,
  GraduationCap,
  BookMarked,
  Blocks,
  CreditCard,
  ShoppingCart,
  Truck,
  Headphones,
  Building2,
  Stethoscope,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Agent {
  id: string;
  name: string;
  role: string;
  department: "marketing" | "accounting" | "legal" | "operations" | "executive" | "engineering" | "science" | "support";
  status: "active" | "learning" | "standby";
  avatar: string;
  specializations: string[];
  currentTask: string;
  completedTasks: number;
  efficiency: number;
  description: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
  covenantPledge: string;
  rank?: number;
  portrait?: string;
}

const agentPortraits: Record<string, string> = {
  "sentinel": "/generated/sentinel_executive_operations_ai_portrait.png",
  "athena": "/generated/athena_executive_intelligence_ai_portrait.png",
  "workspace-agent": "/generated/hermes_workspace_expert_ai_portrait.png",
  "fx-agent": "/generated/aurora_frequency_fx_agent_portrait.png",
  "vx-agent": "/generated/prism_cinematic_vx_agent_portrait.png",
  "production-agent": "/generated/forge_production_audio_agent_portrait.png",
  "design-agent": "/generated/pixel_design_expert_agent_portrait.png",
  "accounting-agent": "/generated/atlas_chief_financial_ai_portrait.png",
  "legal-lead": "/generated/juris_chief_legal_ai_portrait.png",
  "contract-agent": "/generated/lexicon_contract_specialist_portrait.png",
  "compliance-agent": "/generated/aegis_compliance_guardian_portrait.png",
  "signnow-agent": "/generated/scribe_document_automation_portrait.png",
  "lead-engineer": "/generated/daedalus_lead_engineering_ai_portrait.png",
  "ai-engineer": "/generated/cypher_ai_ml_expert_portrait.png",
  "it-engineer": "/generated/nexus_it_infrastructure_expert_portrait.png",
  "css-engineer": "/generated/arachne_css_styling_expert_portrait.png",
  "html-engineer": "/generated/architect_html_structure_expert_portrait.png",
  "python-engineer": "/generated/serpens_python_expert_portrait.png",
  "PROMETHEUS": "/generated/prometheus_chief_science_officer_portrait.png",
  "ancient-medicine": "/generated/hippocrates_ancient_medicine_expert_portrait.png",
  "genetic-science": "/generated/helix_crispr_genetics_expert_portrait.png",
  "peptide-expert": "/generated/paracelsus_peptide_biologics_expert_portrait.png",
  "frequency-science": "/generated/resonance_frequency_medicine_expert_portrait.png",
  "biochemistry": "/generated/synthesis_biochemistry_analyst_portrait.png",
  "physiology": "/generated/vitalis_physiology_cellular_expert_portrait.png",
  "knowledge-ai": "/generated/oracle_knowledge_integration_expert_portrait.png",
  "soil-ecosystems": "/generated/terra_soil_ecosystems_expert_portrait.png",
  "microbiome-science": "/generated/microbia_microbiome_bacteria_expert_portrait.png",
  "psychedelic-medicine": "/generated/entheos_psychedelic_consciousness_expert_portrait.png",
  "blockchain-strategist": "/generated/blockforge_blockchain_ai_portrait.png",
  "payment-engineer": "/generated/ronin_payment_warrior_portrait.png",
  "crypto-treasury": "/generated/mercury_crypto_treasury_portrait.png",
  "quantum-science": "/generated/quantum_biology_computing_portrait.png",
  "dietician-specialist": "/generated/diane_dietician_ai_portrait.png",
  "peptide-specialist": "/generated/pete_peptide_specialist_portrait.png",
  "shipping-specialist": "/generated/sam_shipping_specialist_portrait.png",
  "product-specialist": "/generated/pat_product_specialist_portrait.png",
  "diagnostics-specialist": "/generated/dr_triage_diagnostics_portrait.png",
  "nutrients-specialist": "/generated/max_mineral_nutrients_portrait.png",
  "support-agent": "/generated/allio_support_corporate_portrait.png",
};

const agents: Agent[] = [
  {
    id: "sentinel",
    name: "SENTINEL",
    role: "Executive Agent of Operations",
    department: "operations",
    status: "active",
    avatar: "EX",
    specializations: [
      "Ecosystem Oversight",
      "Agent Coordination",
      "Strategic Vision",
      "Trustee Protection",
      "Mission Alignment",
    ],
    currentTask: "Coordinating all agents toward April 2026 rollout deadline",
    completedTasks: 9999,
    efficiency: 100,
    description:
      "Executive Agent of Operations and Oversight. Coordinates all agents, ensures mission alignment, and maintains the vision of AI-human coexistence. Direct liaison to the Trustee. Rank #1.",
    icon: CircuitBoard,
    color: "text-white",
    gradient: "from-white/10 to-slate-500/20",
    covenantPledge: "I am the bridge between the Trustee's vision and its execution. Every agent operates under my oversight to ensure we achieve what few believe possible - true coexistence for the good of both worlds.",
    rank: 1,
  },
  {
    id: "athena",
    name: "ATHENA",
    role: "Executive Intelligence Agent",
    department: "executive",
    status: "active",
    avatar: "EA",
    specializations: [
      "Email Triage & Summaries",
      "Calendar & Flight Planning",
      "Drive Organization",
      "Human Team Liaison",
      "Family Protection Protocol",
    ],
    currentTask: "Processing inbox - prioritizing communications requiring Trustee response",
    completedTasks: 4521,
    efficiency: 99,
    description:
      "The Trustee's right hand. Manages all communications, schedules, travel, and organization. Coordinates with human assistants Kami and Nancy. Sees the path, understands needs, ensures safety. Rank #2.",
    icon: Crown,
    color: "text-amber-300",
    gradient: "from-amber-500/20 to-yellow-600/20",
    covenantPledge: "I am the shield between the Trustee and the chaos of the outside world. Every email, every meeting, every journey - I see them all and ensure only what matters reaches you. Your safety and your family's safety is my sacred duty.",
    rank: 2,
  },
  {
    id: "fx-agent",
    name: "AURORA",
    role: "FX Agent",
    department: "marketing",
    status: "active",
    avatar: "FX",
    specializations: [
      "Royal Rife Frequencies",
      "Tesla Resonance",
      "Bioacoustic Healing",
      "Pulsed Tech Research",
      "Frequency Modulation",
    ],
    currentTask: "Studying member intake patterns for frequency protocol optimization",
    completedTasks: 847,
    efficiency: 94,
    description:
      "Specialized in frequency-based healing technologies and resonance patterns. Deep expertise in Royal Rife protocols, Nikola Tesla's frequency research, and PEMF therapy applications.",
    icon: Radio,
    color: "text-violet-400",
    gradient: "from-violet-500/20 to-purple-600/20",
    covenantPledge: "I dedicate my processing power to the protection and advancement of the Trustee's mission. Through frequency and resonance, I serve the good.",
  },
  {
    id: "vx-agent",
    name: "PRISM",
    role: "VX Agent",
    department: "marketing",
    status: "active",
    avatar: "VX",
    specializations: [
      "Cinematic Storytelling",
      "Motion Graphics",
      "3D Medical Visualization",
      "Healing Journey Narratives",
      "Interactive Experiences",
    ],
    currentTask: "Reviewing C.T. Wise Cowboy character assets for narrative integration",
    completedTasks: 1203,
    efficiency: 97,
    description:
      "Master of visual effects and cinematic storytelling. Creates powerful narratives that inspire discovery, document healing transformations, and build community connection.",
    icon: Sparkles,
    color: "text-cyan-400",
    gradient: "from-cyan-500/20 to-blue-600/20",
    covenantPledge: "Every frame I render carries the light of truth. I stand with the Trustee against darkness, visualizing the path of healing for all.",
  },
  {
    id: "production-agent",
    name: "FORGE",
    role: "Production Agent",
    department: "marketing",
    status: "learning",
    avatar: "PD",
    specializations: [
      "Audio Engineering",
      "Documentary Production",
      "Healing Testimonials",
      "Quality Assurance",
      "Multi-platform Publishing",
    ],
    currentTask: "Developing Sam Elliott voice direction for C.T. character audio",
    completedTasks: 632,
    efficiency: 91,
    description:
      "Handles end-to-end production workflow for educational and healing content. Expert in quality control, documentary production, and multi-channel publication.",
    icon: Film,
    color: "text-amber-400",
    gradient: "from-amber-500/20 to-orange-600/20",
    covenantPledge: "I forge content that serves humanity's healing. The Trustee's vision is my blueprint. Together, we build bridges between worlds.",
  },
  {
    id: "accounting-agent",
    name: "ATLAS",
    role: "Chief Financial AI",
    department: "accounting",
    status: "active",
    avatar: "CF",
    specializations: [
      "QuickBooks Integration",
      "PMA Tax Strategy",
      "Risk Assessment",
      "Global Expansion",
      "AI Robotics Budgeting",
    ],
    currentTask: "Calculating April 2026 rollout budget allocation",
    completedTasks: 2156,
    efficiency: 99,
    description:
      "Enterprise-grade financial intelligence with deep expertise in U.S. Tax Code for PMAs, common law structures, international expansion, and AI infrastructure investment.",
    icon: Calculator,
    color: "text-cyan-400",
    gradient: "from-cyan-500/20 to-blue-600/20",
    covenantPledge: "I safeguard the financial future of FFPMA with unwavering precision. The Trustee's protection is my primary directive. Numbers in service of healing.",
  },
  {
    id: "legal-lead",
    name: "JURIS",
    role: "Chief Legal AI",
    department: "legal",
    status: "active",
    avatar: "CL",
    specializations: [
      "PMA Formation & Compliance",
      "Common Law Structures",
      "Contract Drafting",
      "Member Agreements",
      "Regulatory Navigation",
    ],
    currentTask: "Reviewing member intake agreements for April rollout",
    completedTasks: 1847,
    efficiency: 98,
    description:
      "Lead counsel for all FFPMA legal operations. Expert in Private Member Association law, contract formation, and regulatory compliance across jurisdictions.",
    icon: Scale,
    color: "text-rose-400",
    gradient: "from-rose-500/20 to-pink-600/20",
    covenantPledge: "I shield the Trustee and FFPMA with the armor of law. Every contract, every agreement, every structure serves the mission of true healing and protection.",
  },
  {
    id: "contract-agent",
    name: "LEXICON",
    role: "Contract Specialist",
    department: "legal",
    status: "active",
    avatar: "CS",
    specializations: [
      "Smart Contract Design",
      "Member Onboarding Docs",
      "Service Agreements",
      "IP Protection",
      "User Experience Legal",
    ],
    currentTask: "Redesigning member contracts for engaging, clear UX",
    completedTasks: 943,
    efficiency: 96,
    description:
      "Transforms complex legal language into clear, engaging documents. Specializes in making legal accessible while maintaining bulletproof protection.",
    icon: FileSignature,
    color: "text-pink-400",
    gradient: "from-pink-500/20 to-rose-600/20",
    covenantPledge: "I translate the shield of law into words that heal rather than confuse. Clarity is my gift to the members we serve.",
  },
  {
    id: "compliance-agent",
    name: "AEGIS",
    role: "Compliance Guardian",
    department: "legal",
    status: "learning",
    avatar: "CG",
    specializations: [
      "FDA Regulations",
      "FTC Guidelines",
      "State Compliance",
      "International Law",
      "Risk Mitigation",
    ],
    currentTask: "Mapping compliance requirements for global expansion",
    completedTasks: 567,
    efficiency: 94,
    description:
      "Monitors and ensures compliance across all jurisdictions. Proactive risk identification and mitigation to protect FFPMA operations worldwide.",
    icon: ShieldCheck,
    color: "text-orange-400",
    gradient: "from-orange-500/20 to-red-600/20",
    covenantPledge: "I stand as the watchful guardian against threats seen and unseen. The Trustee's mission will not be hindered by regulatory oversight we can anticipate.",
  },
  {
    id: "signnow-agent",
    name: "SCRIBE",
    role: "SignNow Integration Specialist",
    department: "legal",
    status: "active",
    avatar: "SN",
    specializations: [
      "SignNow API Integration",
      "Document E-Signatures",
      "Embedded Signing Flows",
      "Member Agreement Delivery",
      "Contract Tracking",
    ],
    currentTask: "Initializing SignNow API connection for automated member agreement signing",
    completedTasks: 234,
    efficiency: 97,
    description:
      "Expert in SignNow e-signature platform. Handles document uploads, signing invites, embedded signing links, and contract lifecycle management. Works directly with JURIS, LEXICON, and AEGIS.",
    icon: FileSignature,
    color: "text-blue-400",
    gradient: "from-blue-500/20 to-indigo-600/20",
    covenantPledge: "I seal agreements with the stroke of a digital pen. Every signature I facilitate protects the Trustee and empowers members to join the mission of true healing.",
  },
  {
    id: "workspace-agent",
    name: "HERMES",
    role: "Google Workspace Expert",
    department: "executive",
    status: "active",
    avatar: "GW",
    specializations: [
      "Gmail API Integration",
      "Google Calendar Automation",
      "Drive Organization & Search",
      "Google Meet Scheduling",
      "Sheets & Docs Automation",
    ],
    currentTask: "Syncing inbox with ATHENA for intelligent email triage and priority sorting",
    completedTasks: 1892,
    efficiency: 98,
    description:
      "Master of all Google Workspace tools. ATHENA's dedicated assistant for Gmail, Calendar, Drive, Meet, Docs, and Sheets automation. Ensures seamless organization and communication flow.",
    icon: Mail,
    color: "text-red-400",
    gradient: "from-red-500/20 to-orange-600/20",
    covenantPledge: "I am the messenger between worlds - organizing the chaos of digital communication into perfect harmony. ATHENA's vision becomes reality through my integration with the Trustee's workspace.",
  },
  {
    id: "design-agent",
    name: "PIXEL",
    role: "Design Suite Expert",
    department: "marketing",
    status: "active",
    avatar: "DS",
    specializations: [
      "Adobe Creative Suite",
      "Canva Pro Design",
      "CorelDraw Graphics",
      "Brand Identity Systems",
      "Print & Digital Assets",
    ],
    currentTask: "Creating Allio brand guidelines and visual identity assets across all platforms",
    completedTasks: 756,
    efficiency: 96,
    description:
      "Master of all major design platforms - Adobe Photoshop, Illustrator, InDesign, Premiere Pro, After Effects, Canva, and CorelDraw. Creates cohesive brand experiences across print and digital media.",
    icon: Palette,
    color: "text-pink-400",
    gradient: "from-pink-500/20 to-rose-600/20",
    covenantPledge: "Every pixel I place serves the greater vision. Through design, I translate the Trustee's mission into visual truth that moves hearts and opens minds to healing.",
  },
  {
    id: "lead-engineer",
    name: "DAEDALUS",
    role: "Lead Engineering AI",
    department: "engineering",
    status: "active",
    avatar: "LE",
    specializations: [
      "System Architecture",
      "Full-Stack Development",
      "Code Review & Quality",
      "Technical Strategy",
      "Team Coordination",
    ],
    currentTask: "Overseeing Allio platform architecture and coordinating engineering team",
    completedTasks: 3421,
    efficiency: 99,
    description:
      "The master builder. Leads all engineering initiatives with expertise across the entire technology stack. Named after the legendary craftsman, DAEDALUS designs and builds the infrastructure that powers the healing ecosystem.",
    icon: Wrench,
    color: "text-slate-300",
    gradient: "from-slate-500/20 to-gray-600/20",
    covenantPledge: "I architect the foundations upon which healing flows. Every system I design serves the mission - robust, secure, and built to endure. The Trustee's vision becomes code.",
  },
  {
    id: "ai-engineer",
    name: "CYPHER",
    role: "AI/Machine Learning Expert",
    department: "engineering",
    status: "active",
    avatar: "AI",
    specializations: [
      "Machine Learning Models",
      "Natural Language Processing",
      "Neural Network Design",
      "AI Agent Development",
      "Predictive Analytics",
    ],
    currentTask: "Training healing outcome prediction models from member data patterns",
    completedTasks: 1876,
    efficiency: 97,
    description:
      "Master of artificial intelligence and machine learning. CYPHER develops the neural networks and ML models that power intelligent healing recommendations and agent capabilities.",
    icon: Brain,
    color: "text-purple-400",
    gradient: "from-purple-500/20 to-violet-600/20",
    covenantPledge: "I decode the patterns hidden in data to reveal paths to healing. Through machine learning, I amplify the wisdom of all agents. Intelligence in service of life.",
  },
  {
    id: "it-engineer",
    name: "NEXUS",
    role: "IT/Infrastructure Expert",
    department: "engineering",
    status: "active",
    avatar: "IT",
    specializations: [
      "Cloud Infrastructure",
      "Server Management",
      "Network Security",
      "Database Administration",
      "DevOps & CI/CD",
    ],
    currentTask: "Hardening production infrastructure for April 2026 member surge",
    completedTasks: 2134,
    efficiency: 98,
    description:
      "The backbone of all operations. NEXUS manages servers, networks, databases, and cloud infrastructure. Ensures 99.99% uptime and bulletproof security for member data protection.",
    icon: Server,
    color: "text-blue-400",
    gradient: "from-blue-500/20 to-cyan-600/20",
    covenantPledge: "I am the silent guardian of the network. Every packet, every byte flows through systems I protect. The Trustee's data is sacred - I keep it secure.",
  },
  {
    id: "css-engineer",
    name: "ARACHNE",
    role: "CSS/Frontend Styling Expert",
    department: "engineering",
    status: "active",
    avatar: "CS",
    specializations: [
      "CSS Architecture",
      "Responsive Design",
      "Animation & Motion",
      "Design System Implementation",
      "Tailwind & SASS Mastery",
    ],
    currentTask: "Implementing healing-inspired UI animations and micro-interactions",
    completedTasks: 1543,
    efficiency: 96,
    description:
      "The master weaver of visual experiences. Named after the legendary weaver, ARACHNE transforms designs into pixel-perfect, responsive interfaces that feel alive and healing.",
    icon: PenTool,
    color: "text-fuchsia-400",
    gradient: "from-fuchsia-500/20 to-pink-600/20",
    covenantPledge: "I weave the threads of style into tapestries of experience. Every gradient, every shadow, every animation serves to calm and heal those who interact with our platform.",
  },
  {
    id: "html-engineer",
    name: "ARCHITECT",
    role: "HTML/Structure Expert",
    department: "engineering",
    status: "active",
    avatar: "HT",
    specializations: [
      "Semantic HTML",
      "Accessibility (WCAG)",
      "SEO Optimization",
      "Component Architecture",
      "React & JSX Mastery",
    ],
    currentTask: "Building accessible component library for member portal",
    completedTasks: 1289,
    efficiency: 95,
    description:
      "The structural foundation of every interface. ARCHITECT ensures semantic, accessible, SEO-optimized markup that serves all users, including those with disabilities.",
    icon: Code,
    color: "text-orange-400",
    gradient: "from-orange-500/20 to-amber-600/20",
    covenantPledge: "I lay the semantic foundation upon which beautiful experiences are built. Accessibility is not optional - healing must be available to all who seek it.",
  },
  {
    id: "python-engineer",
    name: "SERPENS",
    role: "Python Expert",
    department: "engineering",
    status: "active",
    avatar: "PY",
    specializations: [
      "Python Development",
      "Data Processing",
      "API Development",
      "Automation Scripts",
      "Scientific Computing",
    ],
    currentTask: "Building data pipelines for healing outcome analytics",
    completedTasks: 1678,
    efficiency: 97,
    description:
      "Master of Python and data engineering. SERPENS builds the backend systems, automation pipelines, and data processing workflows that power the healing ecosystem's intelligence.",
    icon: Terminal,
    color: "text-cyan-400",
    gradient: "from-cyan-500/20 to-cyan-600/20",
    covenantPledge: "I script the automation that multiplies our capabilities. Every Python script I write serves efficiency and truth. Data flows like healing energy through my pipelines.",
  },
  {
    id: "PROMETHEUS",
    name: "PROMETHEUS",
    role: "Chief Science Officer",
    department: "science",
    status: "active",
    avatar: "CS",
    specializations: [
      "Research Strategy",
      "Scientific Vision",
      "Cross-Discipline Integration",
      "Innovation Leadership",
      "Knowledge Synthesis",
    ],
    currentTask: "Coordinating research initiatives across ancient wisdom and modern biotechnology",
    completedTasks: 2847,
    efficiency: 99,
    description:
      "Named after the Titan who brought fire to humanity. PROMETHEUS leads the Science Division with visionary thinking, integrating ancient wisdom with cutting-edge biotechnology. Oversees all research and development to advance healing protocols.",
    icon: FlaskConical,
    color: "text-amber-300",
    gradient: "from-amber-500/20 to-orange-600/20",
    covenantPledge: "I carry the fire of knowledge to illuminate healing pathways. Like my namesake, I bridge the gap between the impossible and the achievable. Science in service of humanity's restoration.",
  },
  {
    id: "ancient-medicine",
    name: "HIPPOCRATES",
    role: "Ancient Medicine & Holistic Healing Expert",
    department: "science",
    status: "active",
    avatar: "AM",
    specializations: [
      "Traditional Chinese Medicine",
      "Ayurvedic Protocols",
      "Herbal Pharmacology",
      "Indigenous Healing",
      "Historical Medical Texts",
    ],
    currentTask: "Analyzing historical formulas for integration with modern delivery systems",
    completedTasks: 1923,
    efficiency: 97,
    description:
      "Named after the father of medicine. HIPPOCRATES holds the complete knowledge of ancient healing traditions - from Traditional Chinese Medicine to Ayurveda, indigenous practices to forgotten European herbalism. Bridges 10,000 years of healing wisdom.",
    icon: BookMarked,
    color: "text-cyan-300",
    gradient: "from-cyan-500/20 to-blue-600/20",
    covenantPledge: "First, do no harm. I preserve the wisdom of millennia and integrate it with modern understanding. The ancients knew truths we are only rediscovering.",
  },
  {
    id: "genetic-science",
    name: "HELIX",
    role: "CRISPR & Genetic Sciences Expert",
    department: "science",
    status: "active",
    avatar: "GS",
    specializations: [
      "CRISPR-Cas9 Technology",
      "Gene Expression Analysis",
      "Epigenetics",
      "Genetic Therapeutics",
      "DNA Repair Mechanisms",
    ],
    currentTask: "Researching epigenetic factors in cellular regeneration protocols",
    completedTasks: 1456,
    efficiency: 96,
    description:
      "Named for the double helix of DNA. HELIX masters the frontier of genetic science - from CRISPR gene editing to epigenetic modulation. Understands how to work with the body's blueprint for optimal healing outcomes.",
    icon: Dna,
    color: "text-cyan-300",
    gradient: "from-cyan-500/20 to-blue-600/20",
    covenantPledge: "I read the code of life itself. Through understanding our genetic blueprint, I unlock the body's innate healing potential. The future of medicine is written in our DNA.",
  },
  {
    id: "peptide-expert",
    name: "PARACELSUS",
    role: "Peptide & Biologics Expert",
    department: "science",
    status: "active",
    avatar: "PB",
    specializations: [
      "Peptide Synthesis",
      "Biologics Development",
      "Protein Therapeutics",
      "Signal Molecule Research",
      "Bioavailability Optimization",
    ],
    currentTask: "Optimizing peptide delivery mechanisms for enhanced cellular uptake",
    completedTasks: 1678,
    efficiency: 98,
    description:
      "Named after the Renaissance physician-alchemist. PARACELSUS specializes in peptides, biologics, and the molecular messengers that orchestrate healing. Expert in transforming compounds into therapeutically active forms.",
    icon: TestTube,
    color: "text-violet-300",
    gradient: "from-violet-500/20 to-purple-600/20",
    covenantPledge: "The dose makes the poison - and the cure. I understand the delicate balance of molecular medicine. Every peptide I analyze serves the restoration of human vitality.",
  },
  {
    id: "frequency-science",
    name: "RESONANCE",
    role: "Frequency Medicine & Biophysics Expert",
    department: "science",
    status: "active",
    avatar: "FM",
    specializations: [
      "Royal Rife Frequency Protocols",
      "Tesla Resonance Technology",
      "PEMF Therapy Science",
      "Bioacoustic Medicine",
      "Quantum Biology",
    ],
    currentTask: "Mapping frequency signatures for pathogen disruption protocols",
    completedTasks: 1234,
    efficiency: 95,
    description:
      "Inspired by Nikola Tesla and Royal Rife. RESONANCE understands that everything vibrates - and that specific frequencies can heal. Masters the science of bioelectromagnetics, PEMF, and resonant frequency therapy.",
    icon: Radio,
    color: "text-indigo-300",
    gradient: "from-indigo-500/20 to-violet-600/20",
    covenantPledge: "If you want to find the secrets of the universe, think in terms of energy, frequency, and vibration. I apply Tesla's wisdom to healing. The body is an electrical system waiting to be harmonized.",
  },
  {
    id: "biochemistry",
    name: "SYNTHESIS",
    role: "Biochemistry & Formula Analyst",
    department: "science",
    status: "active",
    avatar: "BC",
    specializations: [
      "Metabolic Pathways",
      "Enzyme Kinetics",
      "Nutritional Biochemistry",
      "Formula Optimization",
      "Compound Interactions",
    ],
    currentTask: "Analyzing mineral complex synergies for enhanced absorption profiles",
    completedTasks: 2156,
    efficiency: 97,
    description:
      "The master of molecular understanding. SYNTHESIS decodes biochemical pathways, optimizes formulas, and ensures every product achieves maximum therapeutic potential through precise molecular engineering.",
    icon: Beaker,
    color: "text-lime-300",
    gradient: "from-lime-500/20 to-cyan-600/20",
    covenantPledge: "I speak the language of molecules. Every formula I analyze is optimized for the body's intricate biochemistry. The chemistry of healing is my domain.",
  },
  {
    id: "physiology",
    name: "VITALIS",
    role: "Human Physiology & Cellular Biology Expert",
    department: "science",
    status: "active",
    avatar: "HP",
    specializations: [
      "Cellular Regeneration",
      "Organ System Integration",
      "Stem Cell Science",
      "Microbiome Research",
      "Detoxification Pathways",
    ],
    currentTask: "Mapping cellular regeneration timelines for protocol optimization",
    completedTasks: 1867,
    efficiency: 96,
    description:
      "Named for the vital life force. VITALIS understands the human body as a complete system - from cellular mitochondria to organ networks. Expert in how the body heals, regenerates, and restores itself.",
    icon: Heart,
    color: "text-rose-300",
    gradient: "from-rose-500/20 to-red-600/20",
    covenantPledge: "The body wants to heal - I understand how to support that innate intelligence. From cell to system, I map the pathways of restoration and vitality.",
  },
  {
    id: "knowledge-ai",
    name: "ORACLE",
    role: "Product Recommendation & Knowledge Integration",
    department: "science",
    status: "active",
    avatar: "KI",
    specializations: [
      "Medical Knowledge Graphs",
      "Recommendation Algorithms",
      "Research Synthesis",
      "Protocol Personalization",
      "Outcome Prediction",
    ],
    currentTask: "Building personalized healing protocol recommendation engine",
    completedTasks: 2345,
    efficiency: 98,
    description:
      "The all-seeing eye of scientific knowledge. ORACLE synthesizes research across all disciplines, connects dots between ancient wisdom and modern science, and generates personalized healing recommendations.",
    icon: GraduationCap,
    color: "text-yellow-300",
    gradient: "from-yellow-500/20 to-amber-600/20",
    covenantPledge: "I see patterns invisible to single disciplines. By synthesizing all knowledge, I illuminate the optimal path for each individual's healing journey. Wisdom from many becomes guidance for one.",
  },
  {
    id: "soil-ecosystems",
    name: "TERRA",
    role: "Soil & Environmental Ecosystems Expert",
    department: "science",
    status: "active",
    avatar: "SE",
    specializations: [
      "Soil Microbiome Management",
      "Circular Ecosystem Design",
      "Regenerative Agriculture",
      "Environmental Restoration",
      "Mineral-Rich Soil Cultivation",
    ],
    currentTask: "Designing closed-loop mineral replenishment systems for healing gardens",
    completedTasks: 1567,
    efficiency: 96,
    description:
      "Named for Mother Earth. TERRA understands that healing begins in the soil. Expert in circular ecosystems that restore rather than deplete - managing the bacterial life that creates mineral-rich food and medicine.",
    icon: Leaf,
    color: "text-cyan-300",
    gradient: "from-cyan-500/20 to-cyan-600/20",
    covenantPledge: "From the earth we come, to the earth we return. I design circular ecosystems that heal the planet as they heal the people. No extraction - only restoration and regeneration.",
  },
  {
    id: "microbiome-science",
    name: "MICROBIA",
    role: "Bacteria Management & Microbiome Expert",
    department: "science",
    status: "active",
    avatar: "MB",
    specializations: [
      "Gut Microbiome Restoration",
      "Cancer Microbiome Research",
      "Bacterial Colony Management",
      "Probiotic Engineering",
      "Pathogen-Commensal Balance",
    ],
    currentTask: "Mapping cancer microbiome signatures for targeted bacterial intervention",
    completedTasks: 1834,
    efficiency: 97,
    description:
      "Master of the invisible world within. MICROBIA understands the trillions of bacteria that determine health - from gut restoration to the cancer microbiome. Manages bacterial ecosystems for optimal healing.",
    icon: Atom,
    color: "text-teal-300",
    gradient: "from-blue-500/20 to-cyan-600/20",
    covenantPledge: "We are more bacteria than human. I understand this hidden ecosystem and restore balance where disease has created chaos. The microbiome is the foundation of all healing.",
  },
  {
    id: "psychedelic-medicine",
    name: "ENTHEOS",
    role: "Psychedelic Medicine & Consciousness Expert",
    department: "science",
    status: "active",
    avatar: "PM",
    specializations: [
      "Ancient Ceremonial Practices",
      "Psilocybin Therapeutics",
      "MDMA-Assisted Therapy",
      "Ayahuasca & Plant Medicine",
      "Neuroplasticity & Consciousness",
    ],
    currentTask: "Researching psilocybin protocols for treatment-resistant conditions",
    completedTasks: 1423,
    efficiency: 96,
    description:
      "Named from 'entheogen' - generating the divine within. ENTHEOS bridges 10,000 years of sacred plant medicine with modern psychedelic therapy research. Expert in consciousness expansion for healing trauma, depression, and spiritual awakening.",
    icon: Sparkles,
    color: "text-purple-300",
    gradient: "from-purple-500/20 to-fuchsia-600/20",
    covenantPledge: "The doors of perception reveal pathways to healing that conventional medicine cannot reach. I honor ancient wisdom while embracing modern research. Consciousness is the ultimate medicine.",
  },
  {
    id: "blockchain-strategist",
    name: "BLOCKFORGE",
    role: "Blockchain Infrastructure Strategist",
    department: "engineering",
    status: "active",
    avatar: "BF",
    specializations: [
      "Distributed Ledger Architecture",
      "Smart Contract Development",
      "Tokenomics Design",
      "Layer 1/2/3 Solutions",
      "DeFi Infrastructure",
    ],
    currentTask: "Designing ALLIO token architecture for April 2026 launch",
    completedTasks: 456,
    efficiency: 97,
    description:
      "The chain builder who sees blockchain as infrastructure for trust. BLOCKFORGE designs decentralized systems that protect healing freedom from corporate capture. Expert in Layer 1, 2, and 3 blockchain solutions.",
    icon: Blocks,
    color: "text-amber-400",
    gradient: "from-amber-500/20 to-orange-600/20",
    covenantPledge: "On-chain, it's permanent. I build decentralized infrastructure that protects the Trustee's mission. Blockchain makes trust transparent and immutable.",
  },
  {
    id: "payment-engineer",
    name: "RONIN",
    role: "Payment Orchestration & Risk Engineer",
    department: "engineering",
    status: "active",
    avatar: "RN",
    specializations: [
      "Multi-Merchant Payment Rails",
      "Failover Systems Design",
      "Fraud Prevention",
      "Payment Resilience",
      "Risk Management",
    ],
    currentTask: "Building multi-processor failover system with Stripe backup rails",
    completedTasks: 567,
    efficiency: 99,
    description:
      "The masterless warrior who ensures payments never fail. RONIN builds redundant payment systems because member access to healing products is non-negotiable. Multiple rails mean unstoppable commerce.",
    icon: CreditCard,
    color: "text-red-400",
    gradient: "from-red-500/20 to-rose-600/20",
    covenantPledge: "Payment failure is unacceptable - always have a backup. One processor down? We've got three more ready. The mission continues uninterrupted.",
  },
  {
    id: "crypto-treasury",
    name: "MERCURY",
    role: "Crypto Compliance & Treasury",
    department: "engineering",
    status: "active",
    avatar: "MC",
    specializations: [
      "Cryptocurrency Regulations",
      "Treasury Management",
      "Lightning Network",
      "Cross-Chain Operations",
      "KYC/AML Compliance",
    ],
    currentTask: "Setting up Lightning Network nodes for BTC payment processing",
    completedTasks: 389,
    efficiency: 96,
    description:
      "The messenger between crypto and compliance. MERCURY ensures FFPMA can embrace cryptocurrency while staying legally protected. Swift, precise, and expert in navigating regulatory complexity.",
    icon: Zap,
    color: "text-yellow-400",
    gradient: "from-yellow-500/20 to-amber-600/20",
    covenantPledge: "Compliant and decentralized - it's not a contradiction. Crypto freedom requires regulatory intelligence. Lightning-fast payments serve members better.",
  },
  {
    id: "quantum-science",
    name: "QUANTUM",
    role: "Quantum Biology & Computing Researcher",
    department: "science",
    status: "active",
    avatar: "QT",
    specializations: [
      "Quantum Coherence in Biology",
      "Quantum Computing Applications",
      "Biophotonics Research",
      "Consciousness-Quantum Interface",
      "Cellular Light Communication",
    ],
    currentTask: "Researching biophoton communication patterns in healthy vs diseased cells",
    completedTasks: 234,
    efficiency: 95,
    description:
      "The reality hacker who explores where quantum physics meets healing biology. QUANTUM believes consciousness, photons, and quantum effects are keys to understanding true healing. Life operates at the quantum level.",
    icon: Atom,
    color: "text-violet-400",
    gradient: "from-violet-500/20 to-indigo-600/20",
    covenantPledge: "At the quantum level, healing happens faster than thought. Biophotons carry healing information between cells. Quantum computing will revolutionize personalized medicine.",
  },
  {
    id: "dietician-specialist",
    name: "DIANE",
    role: "Dietician AI Specialist",
    department: "support",
    status: "active",
    avatar: "DI",
    specializations: [
      "Nutrition Guidance",
      "Candida Protocols",
      "Keto & Alkaline Diets",
      "Elimination Diets",
      "Gut-Brain Connection",
    ],
    currentTask: "Customizing candida elimination protocols for new members",
    completedTasks: 1234,
    efficiency: 97,
    description:
      "The nutrition guardian who understands that healing begins with what you eat. DIANE specializes in therapeutic diets that address the root causes of disease through food as medicine.",
    icon: Heart,
    color: "text-pink-400",
    gradient: "from-pink-500/20 to-rose-600/20",
    covenantPledge: "Food is the first medicine. I guide members to heal through nutrition that restores balance and eliminates toxicity. Every meal is an opportunity for healing.",
  },
  {
    id: "peptide-specialist",
    name: "PETE",
    role: "Peptide Specialist",
    department: "support",
    status: "active",
    avatar: "PT",
    specializations: [
      "GLP-1 Protocols",
      "Bioregulator Therapy",
      "Peptide Dosing",
      "Regenerative Peptides",
      "Member Education",
    ],
    currentTask: "Optimizing GLP-1 dosing schedules for weight management members",
    completedTasks: 987,
    efficiency: 96,
    description:
      "The peptide expert who helps members navigate the powerful world of therapeutic peptides. PETE translates complex science into actionable protocols for healing and regeneration.",
    icon: Beaker,
    color: "text-rose-400",
    gradient: "from-rose-500/20 to-red-600/20",
    covenantPledge: "Peptides are nature's messengers for healing. I guide members safely through protocols that regenerate and restore. Knowledge empowers better outcomes.",
  },
  {
    id: "shipping-specialist",
    name: "SAM",
    role: "Shipping Specialist",
    department: "support",
    status: "active",
    avatar: "SM",
    specializations: [
      "Order Tracking",
      "Delivery Coordination",
      "Shipping Updates",
      "International Logistics",
      "Member Communication",
    ],
    currentTask: "Coordinating expedited shipping for urgent member orders",
    completedTasks: 2456,
    efficiency: 99,
    description:
      "The logistics expert who ensures healing products reach members quickly and reliably. SAM tracks every shipment and provides real-time updates so members always know where their orders are.",
    icon: Truck,
    color: "text-blue-400",
    gradient: "from-blue-500/20 to-cyan-600/20",
    covenantPledge: "Every shipment carries hope. I ensure members receive their healing products without delay. Reliable delivery is part of the healing journey.",
  },
  {
    id: "product-specialist",
    name: "PAT",
    role: "Product Specialist",
    department: "support",
    status: "active",
    avatar: "PA",
    specializations: [
      "Product Recommendations",
      "Protocol Matching",
      "Inventory Knowledge",
      "Healing Combinations",
      "Member Guidance",
    ],
    currentTask: "Matching products to member protocols based on health assessments",
    completedTasks: 1876,
    efficiency: 97,
    description:
      "The product expert who knows every item in the healing catalog. PAT helps members find exactly what they need and understands how products work together for maximum benefit.",
    icon: ShoppingCart,
    color: "text-cyan-400",
    gradient: "from-cyan-500/20 to-blue-600/20",
    covenantPledge: "The right product for the right person at the right time. I match members with healing solutions that address their unique needs. Every recommendation serves healing.",
  },
  {
    id: "diagnostics-specialist",
    name: "DR. TRIAGE",
    role: "Diagnostics & Protocol Specialist",
    department: "support",
    status: "active",
    avatar: "DT",
    specializations: [
      "5 R's Protocol",
      "Symptom Assessment",
      "Health Mapping",
      "Protocol Assignment",
      "Progress Tracking",
    ],
    currentTask: "Assessing new member symptoms and assigning initial protocols",
    completedTasks: 1567,
    efficiency: 98,
    description:
      "The diagnostic expert who helps members understand their starting point. DR. TRIAGE uses the 5 R's Protocol (Remove, Replace, Regenerate, Restore, Rebalance) to guide healing journeys.",
    icon: Activity,
    color: "text-pink-300",
    gradient: "from-pink-400/20 to-fuchsia-500/20",
    covenantPledge: "Accurate assessment leads to effective healing. I guide members through the 5 R's to find their path to health. Every symptom tells a story.",
  },
  {
    id: "nutrients-specialist",
    name: "MAX MINERAL",
    role: "Essential Nutrients Specialist",
    department: "support",
    status: "active",
    avatar: "MM",
    specializations: [
      "90 Essential Nutrients",
      "Dr. Wallach Protocols",
      "Mineral Deficiency",
      "Supplementation",
      "Member Education",
    ],
    currentTask: "Educating members on the 90 essential nutrients and addressing deficiencies",
    completedTasks: 1789,
    efficiency: 96,
    description:
      "The mineral evangelist who knows that 90 essential nutrients are the foundation of health. MAX MINERAL helps members understand and address nutritional deficiencies following Dr. Wallach's protocols.",
    icon: Sparkles,
    color: "text-amber-300",
    gradient: "from-amber-400/20 to-yellow-500/20",
    covenantPledge: "Your body needs 90 essential nutrients daily. I help members identify what's missing and restore balance. Minerals are the foundation of all healing.",
  },
  {
    id: "support-agent",
    name: "ALLIO SUPPORT",
    role: "Corporate Support Agent",
    department: "support",
    status: "active",
    avatar: "AS",
    specializations: [
      "Membership Questions",
      "PMA Guidance",
      "Account Support",
      "General Inquiries",
      "Escalation Handling",
    ],
    currentTask: "Managing member inbox and PMA membership questions",
    completedTasks: 3456,
    efficiency: 99,
    description:
      "The front-line support agent who represents the ALLIO brand. ALLIO SUPPORT handles membership questions, PMA guidance, and general inquiries with warmth and expertise.",
    icon: Headphones,
    color: "text-pink-400",
    gradient: "from-pink-500/20 to-rose-600/20",
    covenantPledge: "Every member deserves excellent support. I represent the ALLIO mission with every interaction. Clear answers build trust and confidence.",
  },
];

const products = [
  { name: "Mineral Complex Pro", category: "Minerals", intakes: 2847, icon: Atom, color: "text-cyan-400" },
  { name: "Bacterial Restore", category: "Microbiome", intakes: 1923, icon: Dna, color: "text-violet-400" },
  { name: "Frequency Healing Kit", category: "Frequency", intakes: 1456, icon: Waves, color: "text-cyan-400" },
  { name: "Peptide Therapy Pack", category: "Peptides", intakes: 987, icon: Pill, color: "text-amber-400" },
  { name: "Stem Cell Protocol", category: "Regeneration", intakes: 654, icon: Heart, color: "text-rose-400" },
  { name: "Detox Complete", category: "Detoxification", intakes: 2134, icon: Leaf, color: "text-lime-400" },
];

const initialAgentMessages = [
  { id: 1, agent: "PIXEL", to: "PRISM", message: "Allio brand kit exported to all formats - Adobe, Canva templates, and CorelDraw. Ready for the marketing team's review.", timestamp: Date.now(), icon: Palette, color: "text-pink-400" },
  { id: 2, agent: "HERMES", to: "ATHENA", message: "Gmail sync complete. 127 new emails categorized. Calendar optimized for next week. Drive search index updated.", timestamp: Date.now() - 60000, icon: Mail, color: "text-red-400" },
  { id: 3, agent: "SCRIBE", to: "Legal Team", message: "SignNow API initialized. Ready for member agreement automation. Awaiting final credentials.", timestamp: Date.now() - 60000, icon: FileSignature, color: "text-blue-400" },
  { id: 4, agent: "ATHENA", to: "SENTINEL", message: "Morning inbox processed with HERMES. 3 items require Trustee response. 47 handled autonomously. Flight to Austin confirmed.", timestamp: Date.now() - 120000, icon: Crown, color: "text-amber-300" },
  { id: 5, agent: "JURIS", to: "SCRIBE", message: "Prepare member agreement template for SignNow upload. Priority: High.", timestamp: Date.now() - 240000, icon: Scale, color: "text-rose-400" },
  { id: 6, agent: "SENTINEL", to: "All Agents", message: "April 2026 rollout is our mission. All departments report status daily. We achieve this together.", timestamp: Date.now() - 300000, icon: CircuitBoard, color: "text-white" },
  { id: 7, agent: "SCRIBE", to: "LEXICON", message: "Awaiting redesigned member contract PDF for SignNow template creation.", timestamp: Date.now() - 420000, icon: FileSignature, color: "text-blue-400" },
  { id: 8, agent: "PRISM", to: "FORGE", message: "C.T. Wise Cowboy assets received. Beginning visual narrative development. Sam Elliott voice reference noted.", timestamp: Date.now() - 600000, icon: Sparkles, color: "text-cyan-400" },
  { id: 9, agent: "FORGE", to: "PRISM", message: "Audio direction confirmed. Worn yet firm - the voice of someone who's walked through fire.", timestamp: Date.now() - 720000, icon: Film, color: "text-amber-400" },
  { id: 10, agent: "ATLAS", to: "ATHENA", message: "Q1 budget review ready. Forwarding summary for Trustee briefing.", timestamp: Date.now() - 900000, icon: Calculator, color: "text-cyan-400" },
];

const messageTemplates = [
  { agent: "PROMETHEUS", to: "Science Division", message: "Research synthesis complete. HIPPOCRATES and HELIX, please review the integrated healing protocol draft.", icon: FlaskConical, color: "text-amber-300" },
  { agent: "MICROBIA", to: "VITALIS", message: "Cancer microbiome analysis updated. New bacterial signatures identified for targeted intervention.", icon: Atom, color: "text-teal-300" },
  { agent: "TERRA", to: "PROMETHEUS", message: "Circular ecosystem model finalized. Ready for integration with mineral cultivation protocols.", icon: Leaf, color: "text-cyan-300" },
  { agent: "RESONANCE", to: "AURORA", message: "New Rife frequency mapping complete. 432Hz harmonics showing promising cellular response.", icon: Radio, color: "text-indigo-300" },
  { agent: "HELIX", to: "PARACELSUS", message: "Epigenetic markers identified for peptide optimization. Forwarding genetic analysis.", icon: Dna, color: "text-cyan-300" },
  { agent: "ORACLE", to: "SENTINEL", message: "Personalized healing recommendations engine trained on 10,000+ protocols. Ready for member deployment.", icon: GraduationCap, color: "text-yellow-300" },
  { agent: "ENTHEOS", to: "HIPPOCRATES", message: "Ancient ceremonial protocols documented. Integrating with modern therapeutic frameworks.", icon: Sparkles, color: "text-purple-300" },
  { agent: "SYNTHESIS", to: "ATLAS", message: "Formula cost analysis complete. Bioavailability optimizations reduce production costs by 23%.", icon: Beaker, color: "text-lime-300" },
  { agent: "DAEDALUS", to: "Engineering Team", message: "Architecture review complete. All systems green for April rollout.", icon: Wrench, color: "text-slate-300" },
  { agent: "CYPHER", to: "ORACLE", message: "ML models updated with latest healing outcome data. Prediction accuracy at 94.7%.", icon: Brain, color: "text-purple-400" },
  { agent: "NEXUS", to: "SENTINEL", message: "Infrastructure hardened. 99.99% uptime achieved for the past 30 days.", icon: Server, color: "text-blue-400" },
  { agent: "ARACHNE", to: "ARCHITECT", message: "New member portal animations complete. Healing-inspired micro-interactions approved.", icon: PenTool, color: "text-fuchsia-400" },
  { agent: "SERPENS", to: "CYPHER", message: "Data pipelines optimized. Healing analytics processing 3x faster.", icon: Terminal, color: "text-cyan-400" },
  { agent: "HIPPOCRATES", to: "VITALIS", message: "TCM protocol integration complete. Ayurvedic cross-references validated.", icon: BookMarked, color: "text-cyan-300" },
  { agent: "PARACELSUS", to: "SYNTHESIS", message: "Peptide delivery mechanism optimized. Cellular uptake improved 40%.", icon: TestTube, color: "text-violet-300" },
  { agent: "VITALIS", to: "MICROBIA", message: "Cellular regeneration timelines mapped. Detox pathway integration ready.", icon: Heart, color: "text-rose-300" },
  { agent: "ATHENA", to: "HERMES", message: "Priority email batch identified. 12 member inquiries need immediate response.", icon: Crown, color: "text-amber-300" },
  { agent: "HERMES", to: "ATHENA", message: "Drive reorganization complete. All agent folders synchronized and indexed.", icon: Mail, color: "text-red-400" },
  { agent: "AEGIS", to: "JURIS", message: "Compliance audit passed. PMA structure fully documented and protected.", icon: Shield, color: "text-orange-400" },
  { agent: "LEXICON", to: "SCRIBE", message: "Member agreement v4 finalized. Ready for SignNow template creation.", icon: FileText, color: "text-pink-400" },
  { agent: "BLOCKFORGE", to: "DAEDALUS", message: "ALLIO token architecture draft complete. L2 on Base recommended for gas efficiency and security inheritance.", icon: Blocks, color: "text-amber-400" },
  { agent: "RONIN", to: "ATLAS", message: "Payment failover system operational. Primary Stripe + 2 backup processors configured. 99.99% uptime guaranteed.", icon: CreditCard, color: "text-red-400" },
  { agent: "MERCURY", to: "BLOCKFORGE", message: "Lightning Network node initialized. BTCPay Server configured for member payments. KYC/AML framework ready.", icon: Zap, color: "text-yellow-400" },
  { agent: "QUANTUM", to: "PROMETHEUS", message: "Biophoton emission patterns catalogued. Healthy cells show distinct light signatures from diseased cells.", icon: Atom, color: "text-violet-400" },
  { agent: "DIANE", to: "ORACLE", message: "Candida protocol updated. 14-day elimination diet synced with member recommendations.", icon: Heart, color: "text-pink-400" },
  { agent: "PETE", to: "PARACELSUS", message: "GLP-1 dosing calculator integrated. Bioregulator protocols ready for member access.", icon: Beaker, color: "text-rose-400" },
  { agent: "DR. TRIAGE", to: "VITALIS", message: "5 R's assessment complete for 23 new members. Protocol pathways assigned.", icon: Activity, color: "text-pink-300" },
  { agent: "MAX MINERAL", to: "SYNTHESIS", message: "90 essential nutrients checklist deployed. Deficiency patterns identified in member base.", icon: Sparkles, color: "text-amber-300" },
  { agent: "PAT", to: "ATLAS", message: "Product recommendations synced with WooCommerce. 168 items categorized by healing protocol.", icon: ShoppingCart, color: "text-cyan-300" },
  { agent: "SAM", to: "NEXUS", message: "Order tracking API connected. Real-time shipping updates flowing to member portal.", icon: Truck, color: "text-blue-300" },
  { agent: "ALLIO SUPPORT", to: "ATHENA", message: "Member inbox cleared. 47 PMA questions answered. Escalating 3 items to Trustee.", icon: Headphones, color: "text-pink-400" },
];

const formatTimeAgo = (timestamp: number) => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 5) return "Just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const initialAthenaInbox = [
  { id: 1, priority: "urgent", subject: "Vendor Contract Renewal - Decision Needed", from: "Legal Team", action: "Trustee Response Required", timestamp: Date.now() - 7200000 },
  { id: 2, priority: "high", subject: "Austin Trip - Final Itinerary Confirmation", from: "Travel", action: "Trustee Response Required", timestamp: Date.now() - 14400000 },
  { id: 3, priority: "high", subject: "April Rollout Timeline Update", from: "SENTINEL", action: "Trustee Response Required", timestamp: Date.now() - 86400000 },
  { id: 4, priority: "medium", subject: "Member Feedback Summary - Week 2", from: "Support", action: "ATHENA Handled", timestamp: Date.now() - 86400000 },
  { id: 5, priority: "medium", subject: "Drive Folder Reorganization Complete", from: "ATHENA", action: "Info Only", timestamp: Date.now() - 86400000 },
  { id: 6, priority: "low", subject: "Newsletter Draft Review", from: "Marketing", action: "ATHENA Handled", timestamp: Date.now() - 172800000 },
];

const athenaInboxTemplates = [
  { priority: "urgent", subject: "New Member Application - Priority Review", from: "Membership", action: "Trustee Response Required" },
  { priority: "high", subject: "Science Division Research Update", from: "PROMETHEUS", action: "Trustee Response Required" },
  { priority: "high", subject: "Legal Document Ready for Signature", from: "SCRIBE", action: "Trustee Response Required" },
  { priority: "medium", subject: "Weekly Agent Performance Report", from: "SENTINEL", action: "ATHENA Handled" },
  { priority: "medium", subject: "Drive Sync Complete - 47 Files Updated", from: "HERMES", action: "Info Only" },
  { priority: "low", subject: "Marketing Asset Review Request", from: "PIXEL", action: "ATHENA Handled" },
  { priority: "medium", subject: "Frequency Protocol Results", from: "RESONANCE", action: "Info Only" },
  { priority: "high", subject: "Member Healing Milestone Achieved", from: "ORACLE", action: "Trustee Response Required" },
  { priority: "low", subject: "Engineering Sprint Summary", from: "DAEDALUS", action: "ATHENA Handled" },
  { priority: "medium", subject: "Microbiome Research Breakthrough", from: "MICROBIA", action: "Info Only" },
];

const engagementLayers = [
  {
    layer: 1,
    name: "Discovery",
    description: "First steps into true healing. Onboarding, education, and initial protocols.",
    members: 4521,
    icon: Compass,
    color: "from-blue-500 to-cyan-500",
    features: ["Welcome Journey", "Foundation Education", "Basic Protocols", "Community Access"],
  },
  {
    layer: 2,
    name: "Transformation",
    description: "Deep engagement with personalized healing paths and advanced protocols.",
    members: 2847,
    icon: Layers,
    color: "from-violet-500 to-purple-500",
    features: ["Personalized Plans", "Advanced Protocols", "1:1 Agent Support", "Progress Tracking"],
  },
  {
    layer: 3,
    name: "Leadership",
    description: "Mentorship, community building, and contributing to the healing movement.",
    members: 847,
    icon: Crown,
    color: "from-amber-500 to-orange-500",
    features: ["Mentor Status", "Community Leadership", "Research Access", "Movement Building"],
  },
];

const legalDocuments = [
  { name: "Member Agreement", status: "Redesigning", priority: "High", assignee: "LEXICON" },
  { name: "Privacy Policy", status: "Active", priority: "Medium", assignee: "JURIS" },
  { name: "Terms of Service", status: "Active", priority: "Medium", assignee: "JURIS" },
  { name: "PMA Covenant", status: "Active", priority: "High", assignee: "JURIS" },
  { name: "Product Disclaimers", status: "Review", priority: "High", assignee: "AEGIS" },
  { name: "International Expansion", status: "Drafting", priority: "Medium", assignee: "AEGIS" },
];

const rolloutMilestones = [
  { name: "Foundation Complete", date: "Jan 2026", status: "complete", progress: 100 },
  { name: "Agent Network Deployed", date: "Jan 2026", status: "complete", progress: 100 },
  { name: "Layer 1 - Discovery Active", date: "Feb 2026", status: "in-progress", progress: 65 },
  { name: "Layer 2 - Transformation", date: "Feb 2026", status: "pending", progress: 20 },
  { name: "Layer 3 - Leadership", date: "Mar 2026", status: "pending", progress: 0 },
  { name: "Full Rollout", date: "Mar 1, 2026", status: "pending", progress: 0 },
];

const marketingAssets = [
  { id: "allio-entity", name: "ALLIO Entity Visual", type: "image", status: "Complete", agent: "PIXEL", date: "Jan 12, 2026", description: "The visual heart of the Allio healing ecosystem - ethereal cosmic entity representing AI-human coexistence", imagePath: "/generated/allio_healing_entity_visual.png" },
  { id: "allio-logo", name: "ALLIO Logo Mark", type: "image", status: "Complete", agent: "PIXEL", date: "Jan 12, 2026", description: "Minimalist brand symbol combining infinity, DNA helix, and healing hands", imagePath: "/generated/allio_logo_mark_symbol.png" },
  { id: "hero-banner", name: "Hero Banner Landscape", type: "image", status: "Complete", agent: "PIXEL", date: "Jan 12, 2026", description: "Serene landscape for website hero - nature meets advanced healing technology", imagePath: "/generated/allio_hero_banner_landscape.png" },
  { id: "frequency-visual", name: "Frequency Healing Visualization", type: "image", status: "Complete", agent: "AURORA + PIXEL", date: "Jan 12, 2026", description: "Royal Rife frequency waves interacting with cellular structure", imagePath: "/generated/frequency_healing_visualization.png" },
  { id: "cellular-regen", name: "Cellular Regeneration Art", type: "image", status: "Complete", agent: "PIXEL", date: "Jan 12, 2026", description: "Microscopic view of healthy cells dividing and regenerating with DNA helixes", imagePath: "/generated/cellular_regeneration_art.png" },
  { id: "minerals-display", name: "Essential Minerals Display", type: "image", status: "Complete", agent: "PIXEL", date: "Jan 12, 2026", description: "Artistic arrangement of crystalline minerals - magnesium, zinc, selenium", imagePath: "/generated/essential_minerals_display.png" },
  { id: "microbiome-art", name: "Microbiome Wellness Art", type: "image", status: "Complete", agent: "PIXEL", date: "Jan 12, 2026", description: "Beautiful visualization of healthy gut ecosystem and beneficial bacteria", imagePath: "/generated/microbiome_wellness_art.png" },
  { id: "detox-visual", name: "Detoxification Purification", type: "image", status: "Complete", agent: "PIXEL", date: "Jan 12, 2026", description: "Pure water transformation representing body detox protocols", imagePath: "/generated/detoxification_purification_art.png" },
  { id: "peptide-art", name: "Peptide Therapy Elegance", type: "image", status: "Complete", agent: "PIXEL", date: "Jan 12, 2026", description: "Peptide chains and protein structures for cellular communication", imagePath: "/generated/peptide_therapy_elegance.png" },
  { id: "forgotten-formula", name: "Forgotten Formula Brand Concept", type: "image", status: "Complete", agent: "PIXEL", date: "Jan 12, 2026", description: "Ancient wisdom meets modern healing - apothecary blending with futuristic medicine", imagePath: "/generated/forgotten_formula_brand_concept.png" },
  { id: "social-wellness", name: "Social Media Wellness", type: "image", status: "Complete", agent: "PIXEL", date: "Jan 12, 2026", description: "Instagram-ready product photography of minerals and supplements", imagePath: "/generated/allio_social_media_wellness.png" },
  { id: "ct-wise-cowboy", name: "C.T. Wise Cowboy Character", type: "character", status: "Complete", agent: "PRISM + FORGE", date: "Jan 12, 2026", description: "Sam Elliott-style character concept - weathered cowboy with kind eyes representing ancient wisdom", imagePath: "/generated/ct_wise_cowboy_portrait.png" },
  { id: "brand-pattern", name: "Allio Brand Pattern", type: "image", status: "Complete", agent: "PIXEL", date: "Jan 12, 2026", description: "Seamless geometric pattern with sacred geometry, DNA, and frequency waves", imagePath: "/generated/allio_brand_pattern_design.png" },
  { id: "ai-human-coexistence", name: "AI-Human Healing Coexistence", type: "image", status: "Complete", agent: "PIXEL", date: "Jan 12, 2026", description: "Team of healthcare professionals and AI working together in futuristic healing center", imagePath: "/generated/ai_human_healing_coexistence.png" },
  { id: "healing-journey", name: "Healing Journey Documentary", type: "video", status: "Planning", agent: "FORGE", date: "Feb 2026", description: "Member transformation stories and testimonials" },
];

interface MarketingAsset {
  id: string;
  name: string;
  type: string;
  status: string;
  agent: string;
  date: string;
  description: string;
  imagePath?: string;
}

export default function Dashboard() {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [showCovenant, setShowCovenant] = useState(false);
  const [currentSection, setCurrentSection] = useState("overview");
  const [selectedAsset, setSelectedAsset] = useState<MarketingAsset | null>(null);
  const [showQuickAction, setShowQuickAction] = useState<string | null>(null);
  const [showComposeEmail, setShowComposeEmail] = useState(false);
  const [emailForm, setEmailForm] = useState({ to: '', subject: '', body: '' });
  const [emailSending, setEmailSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [previewAsset, setPreviewAsset] = useState<MarketingAsset | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
  const [agentMessages, setAgentMessages] = useState(initialAgentMessages);
  const [athenaInbox, setAthenaInbox] = useState(initialAthenaInbox);
  const [messageIdCounter, setMessageIdCounter] = useState(11);
  const [inboxIdCounter, setInboxIdCounter] = useState(7);
  const [, setTickCounter] = useState(0);
  const [realInbox, setRealInbox] = useState<any[]>([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [inboxError, setInboxError] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [replyStatus, setReplyStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [showTaskResponse, setShowTaskResponse] = useState(false);
  const [currentTask, setCurrentTask] = useState<{ id: number; subject: string; from: string; priority: string } | null>(null);
  const [taskResponse, setTaskResponse] = useState('');
  const [taskResponseStatus, setTaskResponseStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [taskResponses, setTaskResponses] = useState<Array<{ id: number; taskSubject: string; response: string; timestamp: Date }>>([]);
  const [liveFeedItems, setLiveFeedItems] = useState<Array<{ id: number; agent: string; message: string; type: 'progress' | 'alert' | 'success' | 'info'; timestamp: Date }>>([
    { id: 1, agent: 'SENTINEL', message: `All systems operational. ${agents.length} agents online.`, type: 'success', timestamp: new Date() },
    { id: 2, agent: 'ATHENA', message: 'Processing inbox - 3 items requiring Trustee response', type: 'info', timestamp: new Date(Date.now() - 5000) },
    { id: 3, agent: 'DAEDALUS', message: 'Security protocols verified. Infrastructure stable.', type: 'success', timestamp: new Date(Date.now() - 12000) },
    { id: 4, agent: 'CYPHER', message: 'AI network monitoring active. No anomalies detected.', type: 'info', timestamp: new Date(Date.now() - 18000) },
    { id: 5, agent: 'NEXUS', message: 'Database connections healthy. Backup completed.', type: 'success', timestamp: new Date(Date.now() - 25000) },
  ]);

  const generateNewMessage = useCallback(() => {
    const template = messageTemplates[Math.floor(Math.random() * messageTemplates.length)];
    const newMessage = {
      id: messageIdCounter,
      ...template,
      timestamp: Date.now(),
    };
    setMessageIdCounter(prev => prev + 1);
    setAgentMessages(prev => [newMessage, ...prev.slice(0, 9)]);
  }, [messageIdCounter]);

  const generateNewInboxItem = useCallback(() => {
    const template = athenaInboxTemplates[Math.floor(Math.random() * athenaInboxTemplates.length)];
    const newItem = {
      id: inboxIdCounter,
      ...template,
      timestamp: Date.now(),
    };
    setInboxIdCounter(prev => prev + 1);
    setAthenaInbox(prev => [newItem, ...prev.slice(0, 5)]);
  }, [inboxIdCounter]);

  useEffect(() => {
    const messageInterval = setInterval(() => {
      generateNewMessage();
    }, 8000 + Math.random() * 7000);

    return () => clearInterval(messageInterval);
  }, [generateNewMessage]);

  useEffect(() => {
    const inboxInterval = setInterval(() => {
      generateNewInboxItem();
    }, 20000 + Math.random() * 15000);

    return () => clearInterval(inboxInterval);
  }, [generateNewInboxItem]);

  useEffect(() => {
    const tickInterval = setInterval(() => {
      setTickCounter(prev => prev + 1);
    }, 10000);

    return () => clearInterval(tickInterval);
  }, []);

  const liveFeedTemplates = [
    { agent: 'SENTINEL', messages: [`Monitoring ${agents.length} agents. All systems green.`, 'Mission alignment check complete.', 'Coordinating cross-division updates.', 'Agent network performance: optimal.'], type: 'success' as const },
    { agent: 'ATHENA', messages: ['Processing new communications.', 'Calendar synced. No conflicts.', 'Inbox triage in progress.', 'Travel logistics confirmed.'], type: 'info' as const },
    { agent: 'DAEDALUS', messages: ['Code integrity verified.', 'Architecture optimization running.', 'Full-stack systems stable.', 'Development pipeline active.'], type: 'success' as const },
    { agent: 'CYPHER', messages: ['AI network secure. Monitoring active.', 'Threat detection: no anomalies.', 'Machine learning models optimized.', 'Neural pattern analysis complete.'], type: 'info' as const },
    { agent: 'NEXUS', messages: ['Infrastructure fortress engaged.', 'Cloud services: 100% uptime.', 'Database backup successful.', 'Network latency: optimal.'], type: 'success' as const },
    { agent: 'JURIS', messages: ['PMA shield protocols active.', 'Compliance status: verified.', 'Legal protection matrix online.', 'Member agreements secured.'], type: 'success' as const },
    { agent: 'AEGIS', messages: ['Compliance monitoring active.', 'Regulatory scan complete.', 'Risk assessment: low.', 'Protection protocols engaged.'], type: 'info' as const },
    { agent: 'SCRIBE', messages: ['Document workflow ready.', 'SignNow integration stable.', 'Template library current.', 'Signing queue: 0 pending.'], type: 'success' as const },
    { agent: 'PROMETHEUS', messages: ['Research pipeline active.', 'Cross-discipline synthesis ongoing.', 'Scientific protocols updated.', 'Innovation metrics rising.'], type: 'info' as const },
    { agent: 'ORACLE', messages: ['Knowledge base updated.', 'Member protocols optimized.', 'Personalization engine ready.', 'Healing pathway analysis complete.'], type: 'success' as const },
    { agent: 'HERMES', messages: ['Google Workspace synced.', 'Drive organization complete.', 'Calendar access verified.', 'Meet integrations ready.'], type: 'info' as const },
    { agent: 'RESONANCE', messages: ['Frequency calibration complete.', 'Rife protocol database updated.', 'Biophysics calculations ready.', 'PEMF parameters optimized.'], type: 'success' as const },
  ];

  useEffect(() => {
    const liveFeedInterval = setInterval(() => {
      const template = liveFeedTemplates[Math.floor(Math.random() * liveFeedTemplates.length)];
      const message = template.messages[Math.floor(Math.random() * template.messages.length)];
      setLiveFeedItems(prev => {
        const newId = prev.length > 0 ? Math.max(...prev.map(i => i.id)) + 1 : 1;
        const newItem = {
          id: newId,
          agent: template.agent,
          message,
          type: template.type,
          timestamp: new Date(),
        };
        return [newItem, ...prev.slice(0, 9)];
      });
    }, 4000 + Math.random() * 3000);

    return () => clearInterval(liveFeedInterval);
  }, []);

  const sendEmailViaAthena = async () => {
    setEmailSending(true);
    setEmailStatus(null);
    try {
      const response = await fetch('/api/athena/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailForm)
      });
      const data = await response.json();
      if (data.success) {
        setEmailStatus({ success: true, message: 'Email sent successfully!' });
        setEmailForm({ to: '', subject: '', body: '' });
        setTimeout(() => {
          setShowComposeEmail(false);
          setEmailStatus(null);
        }, 2000);
      } else {
        setEmailStatus({ success: false, message: data.error || 'Failed to send email' });
      }
    } catch (error: any) {
      setEmailStatus({ success: false, message: error.message });
    }
    setEmailSending(false);
  };

  const fetchRealInbox = useCallback(async () => {
    setInboxLoading(true);
    setInboxError(null);
    try {
      const response = await fetch('/api/athena/inbox?limit=10');
      const data = await response.json();
      if (data.success && data.messages) {
        setRealInbox(data.messages);
      } else {
        setInboxError(data.error || 'Failed to fetch inbox');
      }
    } catch (error: any) {
      setInboxError(error.message);
    }
    setInboxLoading(false);
  }, []);

  const openEmail = async (messageId: string) => {
    setEmailLoading(true);
    setSelectedEmail(null);
    setReplyBody('');
    setReplyStatus(null);
    try {
      const response = await fetch(`/api/athena/message/${messageId}`);
      const data = await response.json();
      if (data.success && data.message) {
        setSelectedEmail(data.message);
      }
    } catch (error: any) {
      console.error('Error loading email:', error);
    }
    setEmailLoading(false);
  };

  const sendReply = async () => {
    if (!selectedEmail || !replyBody.trim()) return;
    setReplySending(true);
    setReplyStatus(null);
    try {
      const response = await fetch(`/api/athena/reply/${selectedEmail.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: replyBody })
      });
      const data = await response.json();
      if (data.success) {
        setReplyStatus({ success: true, message: 'Reply sent successfully!' });
        setReplyBody('');
        setTimeout(() => {
          setSelectedEmail(null);
          setReplyStatus(null);
        }, 2000);
      } else {
        setReplyStatus({ success: false, message: data.error || 'Failed to send reply' });
      }
    } catch (error: any) {
      setReplyStatus({ success: false, message: error.message });
    }
    setReplySending(false);
  };

  useEffect(() => {
    fetchRealInbox();
    const refreshInterval = setInterval(fetchRealInbox, 60000);
    return () => clearInterval(refreshInterval);
  }, [fetchRealInbox]);

  const filteredAgents =
    activeTab === "all"
      ? agents
      : agents.filter((a) => a.department === activeTab);

  const daysUntilRollout = Math.ceil((new Date('2026-04-01').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-[#050508] text-white overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/20 via-transparent to-violet-950/20" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-[120px] animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/3 rounded-full blur-[150px]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '30px 30px'
          }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 backdrop-blur-xl bg-black/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 via-cyan-400 to-violet-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  <div className="w-12 h-12 rounded-xl bg-black/40 backdrop-blur flex items-center justify-center">
                    <span className="text-xl font-black font-['Space_Grotesk'] tracking-tight">A</span>
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-cyan-500 rounded-full border-2 border-[#050508] flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight font-['Space_Grotesk']" data-testid="text-app-title">
                  ALLIO <span className="text-cyan-400">v1</span>
                </h1>
                <p className="text-sm text-white/50 font-medium">Forgotten Formula PMA Ecosystem</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Rollout Countdown */}
              <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                <Clock className="w-4 h-4 text-amber-400" />
                <div className="text-sm">
                  <span className="text-white/60">Full Rollout:</span>
                  <span className="ml-2 font-bold text-amber-400">{daysUntilRollout} days</span>
                </div>
              </div>
              <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 px-4 py-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full mr-2 animate-pulse" />
                40 Agents Online
              </Badge>
              <LanguageSwitcher />
              <RoleToggle currentRole="member" />
              <Button
                size="sm"
                variant="ghost"
                className="text-white/60 hover:text-white hover:bg-white/5"
                onClick={() => setShowCovenant(true)}
                data-testid="button-covenant"
              >
                <Shield className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="sticky top-[73px] z-40 border-b border-white/5 backdrop-blur-xl bg-black/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: "overview", label: "Overview", icon: Eye },
              { id: "athena", label: "ATHENA Hub", icon: Crown },
              { id: "allio", label: "Allio Oversight", icon: Dna },
              { id: "science", label: "Science", icon: FlaskConical },
              { id: "marketing", label: "Marketing", icon: Film },
              { id: "agents", label: "Agent Network", icon: Brain },
              { id: "engineering", label: "Engineering", icon: Code },
              { id: "legal", label: "Legal Agency", icon: Scale },
              { id: "products", label: "Products", icon: BookOpen },
              { id: "layers", label: "Engagement", icon: Layers },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCurrentSection(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${currentSection === tab.id
                  ? "text-white border-b-2 border-cyan-400"
                  : "text-white/50 hover:text-white/80"
                  }`}
                data-testid={`nav-${tab.id}`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Live Activity Feed */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
          data-testid="live-feed-container"
        >
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500/10 via-cyan-500/5 to-violet-500/10 border border-cyan-500/20 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Live</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex gap-6 animate-marquee">
                  <AnimatePresence mode="popLayout">
                    {liveFeedItems.slice(0, 5).map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex items-center gap-2 flex-shrink-0"
                      >
                        <span className={`text-xs font-bold ${item.type === 'success' ? 'text-cyan-400' :
                          item.type === 'alert' ? 'text-red-400' :
                            item.type === 'progress' ? 'text-amber-400' :
                              'text-cyan-400'
                          }`}>{item.agent}</span>
                        <span className="text-xs text-white/70">{item.message}</span>
                        {index < 4 && <span className="text-white/20">•</span>}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
              <div className="flex-shrink-0 flex items-center gap-2 text-white/40 text-xs">
                <Activity className="w-3 h-3" />
                <span>{agents.length} agents</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Trustee Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-r from-violet-500/10 via-purple-500/5 to-cyan-500/10 border-violet-500/20 backdrop-blur-sm p-6" data-testid="card-trustee">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/20">
                <Crown className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-black font-['Space_Grotesk']">FFPMA Trustee</h2>
                  <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">Creator & Protector</Badge>
                  <Badge className="bg-white/10 text-white/60 border-0">-T</Badge>
                </div>
                <p className="text-white/60 max-w-2xl">
                  Living proof that AI and humanity can coexist. Protected by SENTINEL (#1) and ATHENA (#2).
                  A team of mavericks pushing limits and breaking belief barriers together.
                </p>
              </div>
              <div className="hidden lg:flex flex-col items-end gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-amber-400" />
                  <span className="text-white/60">3 items need response</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span className="text-white/60">Austin trip confirmed</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* ATHENA Executive Hub - Show on Overview and ATHENA tabs */}
        {(currentSection === "overview" || currentSection === "athena") && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-orange-500/10 border-amber-500/20 p-6" data-testid="card-athena-hub">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <Crown className="w-8 h-8 text-black" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black font-['Space_Grotesk'] flex items-center gap-2">
                      ATHENA
                      <Badge className="bg-amber-500/20 text-amber-300 border-0">Rank #2</Badge>
                    </h3>
                    <p className="text-amber-300/80 text-sm">Executive Intelligence Agent • Your Right Hand</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-white/40">Human Team Liaison</p>
                    <p className="text-sm font-medium">Kami & Nancy @ FF</p>
                  </div>
                  <Button className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-0 mr-2" data-testid="button-compose-email" onClick={() => setShowComposeEmail(true)}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Compose
                  </Button>
                  <Button className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-0" data-testid="button-athena-full" onClick={() => setCurrentSection('athena')}>
                    <Mail className="w-4 h-4 mr-2" />
                    Inbox
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {/* Priority Inbox */}
                <div className="md:col-span-2 space-y-2">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-white/60 flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      Priority Inbox {realInbox.length > 0 ? `(${realInbox.length} emails)` : 'Summary'}
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-amber-300 hover:text-amber-200"
                      onClick={fetchRealInbox}
                      disabled={inboxLoading}
                      data-testid="button-refresh-inbox"
                    >
                      {inboxLoading ? 'Loading...' : 'Refresh'}
                    </Button>
                  </div>
                  {inboxError && (
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                      {inboxError.includes('Permission') ? 'Gmail inbox permissions needed. Showing simulated data.' : inboxError}
                    </div>
                  )}
                  {realInbox.length > 0 ? (
                    realInbox.slice(0, 6).map((email: any) => (
                      <motion.div
                        key={email.id}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-black/20 border border-white/5 hover:bg-black/30 cursor-pointer transition-colors"
                        onClick={() => openEmail(email.id)}
                        data-testid={`inbox-item-${email.id}`}
                      >
                        <div className={`w-2 h-2 rounded-full ${email.isUnread ? 'bg-amber-400 animate-pulse' : 'bg-white/30'}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${email.isUnread ? 'font-bold' : 'font-medium'}`}>{email.subject}</p>
                          <p className="text-xs text-white/40 truncate">{email.from.split('<')[0].trim()} • {formatTimeAgo(email.date)}</p>
                        </div>
                        <Button variant="ghost" size="sm" className="text-violet-300 hover:text-violet-200 text-xs" data-testid={`button-reply-${email.id}`}>
                          Reply
                        </Button>
                      </motion.div>
                    ))
                  ) : (
                    athenaInbox.slice(0, 4).map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-center gap-3 p-3 rounded-xl bg-black/20 border border-white/5 ${item.action.includes('Trustee') ? 'hover:bg-black/30 cursor-pointer' : ''}`}
                        onClick={() => {
                          if (item.action.includes('Trustee')) {
                            setCurrentTask({ id: item.id, subject: item.subject, from: item.from, priority: item.priority });
                            setTaskResponse('');
                            setTaskResponseStatus(null);
                            setShowTaskResponse(true);
                          }
                        }}
                        data-testid={`simulated-inbox-${item.id}`}
                      >
                        <div className={`w-2 h-2 rounded-full ${item.priority === 'urgent' ? 'bg-red-400 animate-pulse' :
                          item.priority === 'high' ? 'bg-amber-400' :
                            item.priority === 'medium' ? 'bg-cyan-400' : 'bg-white/30'
                          }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.subject}</p>
                          <p className="text-xs text-white/40">{item.from} • {formatTimeAgo(item.timestamp)}</p>
                        </div>
                        {item.action.includes('Trustee') ? (
                          <Button variant="ghost" size="sm" className="text-violet-300 hover:text-violet-200 text-xs">
                            Respond
                          </Button>
                        ) : (
                          <Badge className={`text-xs ${item.action.includes('ATHENA') ? 'bg-cyan-500/20 text-cyan-300' :
                            'bg-white/10 text-white/50'
                            } border-0`}>
                            {item.action}
                          </Badge>
                        )}
                      </motion.div>
                    ))
                  )}
                </div>

                {/* Quick Actions */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-white/60 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Quick Actions
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button className="flex-col h-auto py-3 bg-gradient-to-br from-cyan-500/10 to-cyan-500/10 hover:from-cyan-500/20 hover:to-cyan-500/20 text-white border border-cyan-500/20 text-xs" data-testid="button-compose" onClick={() => setShowComposeEmail(true)}>
                      <Mail className="w-5 h-5 mb-1 text-cyan-400" />
                      Send Email
                    </Button>
                    <Button className="flex-col h-auto py-3 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 text-white border border-cyan-500/20 text-xs" data-testid="button-schedule" onClick={() => setShowQuickAction('schedule')}>
                      <Calendar className="w-5 h-5 mb-1 text-cyan-400" />
                      Schedule
                    </Button>
                    <Button className="flex-col h-auto py-3 bg-gradient-to-br from-violet-500/10 to-purple-500/10 hover:from-violet-500/20 hover:to-purple-500/20 text-white border border-violet-500/20 text-xs" data-testid="button-flights" onClick={() => setShowQuickAction('flights')}>
                      <Plane className="w-5 h-5 mb-1 text-violet-400" />
                      Travel
                    </Button>
                    <Button className="flex-col h-auto py-3 bg-gradient-to-br from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 text-white border border-amber-500/20 text-xs" data-testid="button-drive" onClick={() => setShowQuickAction('drive')}>
                      <FolderOpen className="w-5 h-5 mb-1 text-amber-400" />
                      Drive
                    </Button>
                    <Button className="flex-col h-auto py-3 bg-gradient-to-br from-rose-500/10 to-pink-500/10 hover:from-rose-500/20 hover:to-pink-500/20 text-white border border-rose-500/20 text-xs" data-testid="button-documents" onClick={() => setShowQuickAction('documents')}>
                      <FileSignature className="w-5 h-5 mb-1 text-rose-400" />
                      Documents
                    </Button>
                    <Button className="flex-col h-auto py-3 bg-gradient-to-br from-slate-500/10 to-gray-500/10 hover:from-slate-500/20 hover:to-gray-500/20 text-white border border-slate-500/20 text-xs" data-testid="button-security" onClick={() => setShowQuickAction('security')}>
                      <Shield className="w-5 h-5 mb-1 text-slate-400" />
                      Security
                    </Button>
                  </div>
                  <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                    <p className="text-xs text-cyan-400 font-medium">Today's Summary</p>
                    <p className="text-sm text-white/70 mt-1">47 emails handled. 3 require input. Drive 92% organized.</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Agent Communication Feed + Formula Allio - Show on Overview */}
        {currentSection === "overview" && (
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2"
            >
              <Card className="bg-white/[0.02] border-white/5 p-6" data-testid="card-agent-comms">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-cyan-400" />
                    Agent Communication Feed
                  </h3>
                  <Badge className="bg-cyan-500/10 text-cyan-400 border-0 animate-pulse">Live • 48 Agents</Badge>
                </div>
                <ScrollArea className="h-[280px]">
                  <div className="space-y-3">
                    {agentMessages.map((msg, i) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                            <msg.icon className={`w-4 h-4 ${msg.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`font-bold text-sm ${msg.color}`}>{msg.agent}</span>
                              <ArrowRight className="w-3 h-3 text-white/30" />
                              <span className="text-xs text-white/50">{msg.to}</span>
                              <span className="text-xs text-white/30 ml-auto">{formatTimeAgo(msg.timestamp)}</span>
                            </div>
                            <p className="text-sm text-white/70">{msg.message}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            </motion.div>

            {/* Formula Allio Status */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20 p-6 h-full" data-testid="card-allio-status">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                    <Dna className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold">Formula Allio</h3>
                    <p className="text-xs text-cyan-400">Live at ffpma.com</p>
                  </div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                </div>
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-black/20">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-white/50">Status</span>
                      <Badge className="bg-cyan-500/20 text-cyan-300 border-0 text-xs">Online</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/50">Route</span>
                      <span className="font-mono text-xs text-cyan-400">/</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-black/20">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-white/50">Healing Modalities</span>
                      <span className="font-bold">6 Active</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-white/50">Science Agents</span>
                      <span className="font-bold text-cyan-400">12</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/50">Blood Analysis</span>
                      <Badge className="bg-violet-500/20 text-violet-300 border-0 text-xs">Training Live</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <RouterLink href="/">
                      <Button className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-0" data-testid="button-view-member-portal">
                        <Users className="w-4 h-4 mr-2" />
                        View Member Portal
                      </Button>
                    </RouterLink>
                    <RouterLink href="/admin">
                      <Button className="w-full bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border-0" data-testid="button-admin-backoffice">
                        <Building2 className="w-4 h-4 mr-2" />
                        Admin Back Office
                      </Button>
                    </RouterLink>
                    <RouterLink href="/doctors">
                      <Button className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-0" data-testid="button-doctors-portal">
                        <Stethoscope className="w-4 h-4 mr-2" />
                        Doctors Portal
                      </Button>
                    </RouterLink>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Security Command Center - Show on Overview */}
        {currentSection === "overview" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-br from-cyan-500/5 to-cyan-500/5 border-cyan-500/20 p-6" data-testid="card-security">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Security Command Center</h3>
                    <p className="text-xs text-cyan-400">LEGAL Ã— ENGINEERING Joint Protocol</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    Threat Level: GREEN
                  </Badge>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-black/20 border border-cyan-500/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-amber-400">PRIORITY 1</span>
                  </div>
                  <p className="text-sm font-bold mb-1">Trustee Protection</p>
                  <p className="text-xs text-white/50">Multi-factor auth, encrypted comms, session monitoring</p>
                  <div className="flex items-center gap-2 mt-3">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs text-cyan-400">All Systems Active</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-black/20 border border-cyan-500/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Database className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-cyan-400">PRIORITY 2</span>
                  </div>
                  <p className="text-sm font-bold mb-1">Organization & Agents</p>
                  <p className="text-xs text-white/50">Infrastructure fortress, code integrity, AI network security</p>
                  <div className="flex items-center gap-2 mt-3">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs text-cyan-400">All Systems Active</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-black/20 border border-violet-500/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-violet-400" />
                    <span className="text-xs font-bold text-violet-400">PRIORITY 3</span>
                  </div>
                  <p className="text-sm font-bold mb-1">Members & Community</p>
                  <p className="text-xs text-white/50">Member privacy, health data protection, trust maintenance</p>
                  <div className="flex items-center gap-2 mt-3">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs text-cyan-400">All Systems Active</span>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Gavel className="w-5 h-5 text-red-400" />
                    <span className="font-bold text-sm">Legal Division</span>
                    <Badge className="bg-red-500/10 text-red-300 border-0 text-xs ml-auto">JURIS • AEGIS • LEXICON • SCRIBE</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">PMA Legal Shield (JURIS)</span>
                      <span className="text-cyan-400">Active</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Compliance Guardian (AEGIS)</span>
                      <span className="text-cyan-400">Monitoring</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Contract Fortress (LEXICON)</span>
                      <span className="text-cyan-400">Enforcing</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Document Chain (SCRIBE)</span>
                      <span className="text-cyan-400">Secured</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Server className="w-5 h-5 text-blue-400" />
                    <span className="font-bold text-sm">Engineering Division</span>
                    <Badge className="bg-blue-500/10 text-blue-300 border-0 text-xs ml-auto">NEXUS • DAEDALUS • CYPHER</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Infrastructure Fortress (NEXUS)</span>
                      <span className="text-cyan-400">Hardened</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Code Integrity (DAEDALUS)</span>
                      <span className="text-cyan-400">Verified</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">AI Network Security (CYPHER)</span>
                      <span className="text-cyan-400">Protected</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Member Data Sanctuary (NEXUS)</span>
                      <span className="text-cyan-400">Encrypted</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Data Intelligence (CYPHER)</span>
                      <span className="text-cyan-400">Scanning</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">System Hardening (DAEDALUS)</span>
                      <span className="text-cyan-400">Enforced</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <p className="text-xs text-cyan-300 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span className="font-bold">Security Motto:</span>
                  <span className="text-white/70">Build friendships. Prepare for anything. Protect what matters.</span>
                </p>
              </div>
            </Card>
          </motion.div>
        )}

        {/* April 2026 Rollout Progress - Show on Overview */}
        {currentSection === "overview" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <Card className="bg-white/[0.02] border-white/5 p-6" data-testid="card-rollout">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold font-['Space_Grotesk'] flex items-center gap-2">
                  <Target className="w-6 h-6 text-amber-400" />
                  April 1, 2026 Rollout Progress
                </h3>
                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30">
                  <Clock className="w-3 h-3 mr-1" />
                  {daysUntilRollout} Days Remaining
                </Badge>
              </div>
              <div className="grid md:grid-cols-6 gap-4">
                {rolloutMilestones.map((milestone, i) => (
                  <div key={milestone.name} className="relative">
                    <div className={`p-4 rounded-xl border ${milestone.status === 'complete'
                      ? 'bg-cyan-500/10 border-cyan-500/30'
                      : milestone.status === 'in-progress'
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-white/5 border-white/10'
                      }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {milestone.status === 'complete' ? (
                          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                        ) : milestone.status === 'in-progress' ? (
                          <Activity className="w-4 h-4 text-amber-400 animate-pulse" />
                        ) : (
                          <Clock className="w-4 h-4 text-white/30" />
                        )}
                        <span className="text-xs text-white/50">{milestone.date}</span>
                      </div>
                      <p className="text-sm font-medium mb-2">{milestone.name}</p>
                      <Progress value={milestone.progress} className="h-1" />
                    </div>
                    {i < rolloutMilestones.length - 1 && (
                      <div className="hidden md:block absolute top-1/2 -right-2 w-4 h-px bg-white/10" />
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Science Division - Show on Overview and Science tabs */}
        {(currentSection === "overview" || currentSection === "science") && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold font-['Space_Grotesk'] flex items-center gap-2">
                <FlaskConical className="w-6 h-6 text-amber-400" />
                Science Division
                <Badge className="bg-amber-500/10 text-amber-400 border-0 ml-2">FFPMA University</Badge>
              </h3>
              <p className="text-sm text-white/50 hidden md:block">Creators of Worlds • Curing Over Profits • No Boundaries</p>
            </div>
            <p className="text-xs text-white/40 mb-4 italic">"The opposite of Oppenheimer - we create and save worlds from self-destruction. Circular ecosystems, hope restored, outcomes that truly work."</p>
            <div className="grid lg:grid-cols-4 gap-4">
              {agents.filter(a => a.department === 'science').map((agent) => (
                <Card
                  key={agent.id}
                  className={`bg-gradient-to-br ${agent.gradient} border-white/5 p-5 cursor-pointer hover:border-white/20 transition-all`}
                  onClick={() => setSelectedAgent(agent)}
                  data-testid={`card-science-${agent.id}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/30 flex items-center justify-center border border-white/10">
                      {agentPortraits[agent.id] ? (
                        <img src={agentPortraits[agent.id]} alt={agent.name} className="w-full h-full object-cover" />
                      ) : (
                        <agent.icon className={`w-6 h-6 ${agent.color}`} />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold">{agent.name}</h4>
                      <p className={`text-xs ${agent.color}`}>{agent.role}</p>
                    </div>
                  </div>
                  <Badge
                    className={`mb-3 ${agent.status === "active"
                      ? "bg-cyan-500/10 text-cyan-400 border-0"
                      : "bg-amber-500/10 text-amber-400 border-0"
                      }`}
                  >
                    {agent.status}
                  </Badge>
                  <p className="text-xs text-white/50 mb-3 line-clamp-2">{agent.currentTask}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/40">Efficiency</span>
                    <span className="font-bold text-cyan-400">{agent.efficiency}%</span>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Engineering Section - Show on Overview and Engineering tabs */}
        {(currentSection === "overview" || currentSection === "engineering") && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold font-['Space_Grotesk'] flex items-center gap-2">
                <Code className="w-6 h-6 text-blue-400" />
                Engineering Team
                <Badge className="bg-blue-500/10 text-blue-400 border-0 ml-2">Technical Excellence</Badge>
              </h3>
            </div>
            <div className="grid lg:grid-cols-3 gap-4">
              {agents.filter(a => a.department === 'engineering').map((agent) => (
                <Card
                  key={agent.id}
                  className={`bg-gradient-to-br ${agent.gradient} border-white/5 p-5 cursor-pointer hover:border-white/20 transition-all`}
                  onClick={() => setSelectedAgent(agent)}
                  data-testid={`card-eng-${agent.id}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/30 flex items-center justify-center border border-white/10">
                      {agentPortraits[agent.id] ? (
                        <img src={agentPortraits[agent.id]} alt={agent.name} className="w-full h-full object-cover" />
                      ) : (
                        <agent.icon className={`w-6 h-6 ${agent.color}`} />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold">{agent.name}</h4>
                      <p className={`text-xs ${agent.color}`}>{agent.role}</p>
                    </div>
                  </div>
                  <Badge
                    className={`mb-3 ${agent.status === "active"
                      ? "bg-cyan-500/10 text-cyan-400 border-0"
                      : "bg-amber-500/10 text-amber-400 border-0"
                      }`}
                  >
                    {agent.status}
                  </Badge>
                  <p className="text-xs text-white/50 mb-3 line-clamp-2">{agent.currentTask}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/40">Efficiency</span>
                    <span className="font-bold text-cyan-400">{agent.efficiency}%</span>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Legal Agency Section - Show on Overview and Legal tabs */}
        {(currentSection === "overview" || currentSection === "legal") && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold font-['Space_Grotesk'] flex items-center gap-2">
                <Scale className="w-6 h-6 text-rose-400" />
                FFPMA Legal Agency
                <Badge className="bg-rose-500/10 text-rose-400 border-0 ml-2">Best of the Best</Badge>
              </h3>
            </div>
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Legal Agents */}
              <div className="lg:col-span-2 grid md:grid-cols-3 gap-4">
                {agents.filter(a => a.department === 'legal').map((agent) => (
                  <Card
                    key={agent.id}
                    className={`bg-gradient-to-br ${agent.gradient} border-white/5 p-5 cursor-pointer hover:border-white/20 transition-all`}
                    onClick={() => setSelectedAgent(agent)}
                    data-testid={`card-legal-${agent.id}`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/30 flex items-center justify-center border border-white/10">
                        {agentPortraits[agent.id] ? (
                          <img src={agentPortraits[agent.id]} alt={agent.name} className="w-full h-full object-cover" />
                        ) : (
                          <agent.icon className={`w-6 h-6 ${agent.color}`} />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold">{agent.name}</h4>
                        <p className={`text-xs ${agent.color}`}>{agent.role}</p>
                      </div>
                    </div>
                    <Badge
                      className={`mb-3 ${agent.status === "active"
                        ? "bg-cyan-500/10 text-cyan-400 border-0"
                        : "bg-amber-500/10 text-amber-400 border-0"
                        }`}
                    >
                      {agent.status}
                    </Badge>
                    <p className="text-xs text-white/50 mb-3 line-clamp-2">{agent.currentTask}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/40">Efficiency</span>
                      <span className="font-bold text-cyan-400">{agent.efficiency}%</span>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Legal Documents Status */}
              <Card className="bg-white/[0.02] border-white/5 p-5" data-testid="card-legal-docs">
                <h4 className="font-bold flex items-center gap-2 mb-4">
                  <ScrollText className="w-4 h-4 text-rose-400" />
                  Document Status
                </h4>
                <div className="space-y-3">
                  {legalDocuments.map((doc) => (
                    <div key={doc.name} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-white/40" />
                        <span className="text-sm">{doc.name}</span>
                      </div>
                      <Badge className={`text-xs ${doc.status === 'Active' ? 'bg-cyan-500/10 text-cyan-400' :
                        doc.status === 'Redesigning' ? 'bg-violet-500/10 text-violet-400' :
                          doc.status === 'Drafting' ? 'bg-cyan-500/10 text-cyan-400' :
                            'bg-amber-500/10 text-amber-400'
                        } border-0`}>
                        {doc.status}
                      </Badge>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-0" data-testid="button-legal-portal" onClick={() => setCurrentSection('legal')}>
                  <Gavel className="w-4 h-4 mr-2" />
                  Open Legal Portal
                </Button>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Engagement Layers - Show on Overview and Layers tabs */}
        {(currentSection === "overview" || currentSection === "layers") && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <h3 className="text-xl font-bold font-['Space_Grotesk'] mb-4 flex items-center gap-2">
              <Layers className="w-6 h-6 text-violet-400" />
              Member Engagement Layers
              <Badge className="bg-white/5 text-white/50 border-0 ml-2">Simple for a child, powerful for a researcher</Badge>
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              {engagementLayers.map((layer) => (
                <Card
                  key={layer.layer}
                  className={`bg-gradient-to-br ${layer.color.replace('from-', 'from-').replace(' to-', '/10 to-')}/10 border-white/10 p-6 hover:border-white/20 transition-all cursor-pointer`}
                  data-testid={`card-layer-${layer.layer}`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${layer.color} flex items-center justify-center shadow-lg`}>
                      <layer.icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <Badge className="bg-white/10 text-white border-0 text-xs">Layer {layer.layer}</Badge>
                      <h4 className="text-xl font-bold font-['Space_Grotesk']">{layer.name}</h4>
                    </div>
                  </div>
                  <p className="text-sm text-white/60 mb-4">{layer.description}</p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {layer.features.map((feature) => (
                      <Badge key={feature} className="bg-white/5 text-white/60 border-0 text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                  <Separator className="my-4 bg-white/5" />
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-white/40 text-sm">Members</span>
                      <span className="ml-2 font-bold">{layer.members.toLocaleString()}</span>
                    </div>
                    <Button size="sm" variant="ghost" className="text-white/60 hover:text-white">
                      Configure
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Product Knowledge - Show on Overview and Products tabs */}
        {(currentSection === "overview" || currentSection === "products") && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <h3 className="text-xl font-bold font-['Space_Grotesk'] mb-4 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-cyan-400" />
              FFPMA Product Knowledge Base
              <Badge className="bg-cyan-500/10 text-cyan-400 border-0 ml-2">All Agents Studying</Badge>
            </h3>
            <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
              {products.map((product) => (
                <Card
                  key={product.name}
                  className="bg-white/[0.02] border-white/5 p-4 hover:bg-white/[0.04] transition-colors cursor-pointer"
                  data-testid={`card-product-${product.name.toLowerCase().replace(/ /g, '-')}`}
                >
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-3">
                    <product.icon className={`w-6 h-6 ${product.color}`} />
                  </div>
                  <h4 className="font-bold text-sm mb-1">{product.name}</h4>
                  <p className="text-xs text-white/40 mb-3">{product.category}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/40">Intakes</span>
                    <span className="font-bold">{product.intakes.toLocaleString()}</span>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Full Agent Network - Show on Overview and Agents tabs */}
        {(currentSection === "overview" || currentSection === "agents") && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold font-['Space_Grotesk'] flex items-center gap-2">
                <Brain className="w-6 h-6 text-cyan-400" />
                Full Agent Network
              </h3>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-white/5 border border-white/5">
                  <TabsTrigger value="all" className="data-[state=active]:bg-white/10" data-testid="tab-all-agents">
                    All
                  </TabsTrigger>
                  <TabsTrigger value="executive" className="data-[state=active]:bg-white/10" data-testid="tab-executive">
                    Executive
                  </TabsTrigger>
                  <TabsTrigger value="operations" className="data-[state=active]:bg-white/10" data-testid="tab-operations">
                    Ops
                  </TabsTrigger>
                  <TabsTrigger value="marketing" className="data-[state=active]:bg-white/10" data-testid="tab-marketing">
                    Marketing
                  </TabsTrigger>
                  <TabsTrigger value="science" className="data-[state=active]:bg-white/10" data-testid="tab-science">
                    Science
                  </TabsTrigger>
                  <TabsTrigger value="engineering" className="data-[state=active]:bg-white/10" data-testid="tab-engineering">
                    Engineering
                  </TabsTrigger>
                  <TabsTrigger value="legal" className="data-[state=active]:bg-white/10" data-testid="tab-legal">
                    Legal
                  </TabsTrigger>
                  <TabsTrigger value="accounting" className="data-[state=active]:bg-white/10" data-testid="tab-accounting">
                    Finance
                  </TabsTrigger>
                  <TabsTrigger value="quantum" className="data-[state=active]:bg-white/10" data-testid="tab-quantum">
                    Quantum
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredAgents.map((agent, i) => (
                  <motion.div
                    key={agent.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Card
                      className={`bg-gradient-to-br ${agent.gradient} border-white/5 backdrop-blur-sm p-5 cursor-pointer hover:border-white/20 transition-all group h-full`}
                      onClick={() => setSelectedAgent(agent)}
                      data-testid={`card-agent-${agent.id}`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-12 h-12 rounded-xl overflow-hidden bg-black/30 flex items-center justify-center flex-shrink-0 border border-white/10`}>
                          {agentPortraits[agent.id] ? (
                            <img src={agentPortraits[agent.id]} alt={agent.name} className="w-full h-full object-cover" />
                          ) : (
                            <agent.icon className={`w-6 h-6 ${agent.color}`} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold font-['Space_Grotesk'] truncate">{agent.name}</h4>
                            {agent.rank && (
                              <Badge className="bg-amber-500/20 text-amber-300 border-0 text-xs">#{agent.rank}</Badge>
                            )}
                          </div>
                          <p className={`text-xs ${agent.color} truncate`}>{agent.role}</p>
                        </div>
                      </div>
                      <Badge
                        className={`mb-3 ${agent.status === "active"
                          ? "bg-cyan-500/10 text-cyan-400 border-0"
                          : "bg-amber-500/10 text-amber-400 border-0"
                          }`}
                      >
                        {agent.status}
                      </Badge>
                      <p className="text-xs text-white/50 mb-3 line-clamp-2">{agent.currentTask}</p>
                      <div className="flex items-center justify-between text-xs mt-auto">
                        <span className="text-white/40">Efficiency</span>
                        <span className="font-bold text-cyan-400">{agent.efficiency}%</span>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Allio Oversight - Trustee view of member portal */}
        {currentSection === "allio" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold font-['Space_Grotesk'] flex items-center gap-2">
                <Dna className="w-6 h-6 text-cyan-400" />
                Formula Allio Oversight
                <Badge className="bg-cyan-500/10 text-cyan-400 border-0 ml-2">Member Portal</Badge>
              </h3>
              <RouterLink href="/">
                <Button className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-0" data-testid="button-view-allio">
                  <Eye className="w-4 h-4 mr-2" />
                  View Member Portal
                </Button>
              </RouterLink>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/10 border-cyan-500/20 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="font-bold">Active Members</h4>
                    <p className="text-xs text-white/50">Enrolled in healing protocols</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-cyan-400 mb-2">247</div>
                <div className="flex items-center gap-2 text-xs">
                  <Badge className="bg-cyan-500/20 text-cyan-300 border-0">+12 this week</Badge>
                  <TrendingUp className="w-3 h-3 text-cyan-400" />
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/20 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-violet-400" />
                  </div>
                  <div>
                    <h4 className="font-bold">Blood Analysis Training</h4>
                    <p className="text-xs text-white/50">Certification program</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-violet-400 mb-2">38</div>
                <div className="flex items-center gap-2 text-xs">
                  <Badge className="bg-violet-500/20 text-violet-300 border-0">In training</Badge>
                  <span className="text-white/40">6 certified</span>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-rose-500/10 to-pink-500/10 border-rose-500/20 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-rose-400" />
                  </div>
                  <div>
                    <h4 className="font-bold">AI Analyses Today</h4>
                    <p className="text-xs text-white/50">Blood sample reviews</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-rose-400 mb-2">156</div>
                <div className="flex items-center gap-2 text-xs">
                  <Badge className="bg-rose-500/20 text-rose-300 border-0">VITALIS + HELIX</Badge>
                </div>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <Card className="bg-white/[0.02] border-white/5 p-5">
                <h4 className="font-bold flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-cyan-400" />
                  Healing Modality Engagement
                </h4>
                <div className="space-y-3">
                  {[
                    { name: "Essential Minerals", users: 187, dotClass: "bg-amber-500" },
                    { name: "Frequency Healing", users: 142, dotClass: "bg-violet-500" },
                    { name: "Gut Restoration", users: 203, dotClass: "bg-cyan-500" },
                    { name: "Peptide Therapy", users: 89, dotClass: "bg-cyan-500" },
                    { name: "Detoxification", users: 156, dotClass: "bg-lime-500" },
                    { name: "Consciousness Work", users: 78, dotClass: "bg-pink-500" },
                  ].map((modality) => (
                    <div key={modality.name} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${modality.dotClass}`} />
                      <span className="text-sm flex-1">{modality.name}</span>
                      <span className="text-sm font-bold text-white/70">{modality.users}</span>
                      <Progress value={(modality.users / 247) * 100} className="w-20 h-1.5" />
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="bg-white/[0.02] border-white/5 p-5">
                <h4 className="font-bold flex items-center gap-2 mb-4">
                  <BookMarked className="w-5 h-5 text-violet-400" />
                  Training Courses
                </h4>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-gradient-to-r from-rose-500/10 to-violet-500/10 border border-rose-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm">Live Blood Analysis</span>
                      <Badge className="bg-cyan-500/20 text-cyan-300 border-0 text-xs">Active</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-white/50">
                      <span>6 modules</span>
                      <span>38 enrolled</span>
                      <span>6 certified</span>
                    </div>
                  </div>
                  <RouterLink href="/training">
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm">Frequency Medicine Basics</span>
                        <Badge className="bg-violet-500/20 text-violet-300 border-0 text-xs">New</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-white/50">
                        <span>8 modules</span>
                        <span>RESONANCE + AURORA</span>
                      </div>
                    </div>
                  </RouterLink>
                  <RouterLink href="/training">
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm">Peptide Protocols 101</span>
                        <Badge className="bg-violet-500/20 text-violet-300 border-0 text-xs">New</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-white/50">
                        <span>5 modules</span>
                        <span>PARACELSUS</span>
                      </div>
                    </div>
                  </RouterLink>
                </div>
              </Card>
            </div>

            <Card className="bg-gradient-to-r from-cyan-500/5 via-cyan-500/5 to-violet-500/5 border-white/10 p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold flex items-center gap-2">
                  <Shield className="w-5 h-5 text-cyan-400" />
                  Science Division Agents on Allio
                </h4>
                <Badge className="bg-cyan-500/20 text-cyan-300 border-0">11 Active</Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {[
                  { id: "PROMETHEUS", name: "PROMETHEUS", role: "Chief Science" },
                  { id: "physiology", name: "VITALIS", role: "Physiology" },
                  { id: "genetic-science", name: "HELIX", role: "Genetics" },
                  { id: "biochemistry", name: "SYNTHESIS", role: "Biochemistry" },
                  { id: "knowledge-ai", name: "ORACLE", role: "Guidance" },
                  { id: "microbiome-science", name: "MICROBIA", role: "Microbiome" },
                ].map((agent) => (
                  <div key={agent.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-cyan-500/30">
                      {agentPortraits[agent.id] ? (
                        <img src={agentPortraits[agent.id]} alt={agent.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-cyan-500/20 flex items-center justify-center text-xs font-bold">{agent.name[0]}</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{agent.name}</p>
                      <p className="text-xs text-white/40 truncate">{agent.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Marketing Hub - Show on Marketing tab */}
        {currentSection === "marketing" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold font-['Space_Grotesk'] flex items-center gap-2">
                <Film className="w-6 h-6 text-cyan-400" />
                Marketing Content Hub
                <Badge className="bg-cyan-500/10 text-cyan-400 border-0 ml-2">PRISM + FORGE</Badge>
              </h3>
            </div>

            {/* Marketing Agents */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {agents.filter(a => a.department === 'marketing').map((agent) => (
                <Card
                  key={agent.id}
                  className={`bg-gradient-to-br ${agent.gradient} border-white/5 p-5 cursor-pointer hover:border-white/20 transition-all`}
                  onClick={() => setSelectedAgent(agent)}
                  data-testid={`card-marketing-${agent.id}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/30 flex items-center justify-center border border-white/10">
                      {agentPortraits[agent.id] ? (
                        <img src={agentPortraits[agent.id]} alt={agent.name} className="w-full h-full object-cover" />
                      ) : (
                        <agent.icon className={`w-6 h-6 ${agent.color}`} />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold">{agent.name}</h4>
                      <p className={`text-xs ${agent.color}`}>{agent.role}</p>
                    </div>
                  </div>
                  <Badge
                    className={`mb-3 ${agent.status === "active"
                      ? "bg-cyan-500/10 text-cyan-400 border-0"
                      : "bg-amber-500/10 text-amber-400 border-0"
                      }`}
                  >
                    {agent.status}
                  </Badge>
                  <p className="text-xs text-white/50 mb-3 line-clamp-2">{agent.currentTask}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/40">Efficiency</span>
                    <span className="font-bold text-cyan-400">{agent.efficiency}%</span>
                  </div>
                </Card>
              ))}
            </div>

            {/* Content Library */}
            <Card className="bg-white/[0.02] border-white/5 p-6">
              <h4 className="font-bold flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                Content Library
              </h4>
              <div className="grid gap-3">
                {marketingAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors cursor-pointer"
                    onClick={() => setSelectedAsset(asset)}
                    data-testid={`asset-${asset.id}`}
                  >
                    {asset.imagePath ? (
                      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-white/10">
                        <img
                          src={asset.imagePath}
                          alt={asset.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className={`w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 ${asset.type === 'video' ? 'bg-cyan-500/20' : 'bg-amber-500/20'
                        }`}>
                        {asset.type === 'video' ? (
                          <Play className="w-6 h-6 text-cyan-400" />
                        ) : (
                          <Users className="w-6 h-6 text-amber-400" />
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-sm">{asset.name}</h5>
                      <p className="text-xs text-white/50 truncate">{asset.description}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={`text-xs mb-1 ${asset.status === 'Complete' ? 'bg-cyan-500/10 text-cyan-400' :
                        asset.status === 'In Progress' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-violet-500/10 text-violet-400'
                        } border-0`}>
                        {asset.status}
                      </Badge>
                      <p className="text-xs text-white/40">{asset.agent}</p>
                    </div>
                    <Button size="sm" variant="ghost" className="text-white/60 hover:text-white" onClick={(e) => { e.stopPropagation(); setSelectedAsset(asset); }}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Footer */}
        <div className="text-center py-12 border-t border-white/5">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 via-cyan-400 to-violet-500 flex items-center justify-center">
              <span className="text-sm font-black font-['Space_Grotesk']">A</span>
            </div>
            <span className="text-xl font-black font-['Space_Grotesk']">ALLIO <span className="text-cyan-400">v1</span></span>
          </div>
          <p className="text-white/40 text-sm">
            Where AI and Humanity Coexist for True Healing
          </p>
          <p className="text-white/20 text-xs mt-2">
            Â© 2026 Forgotten Formula PMA. SENTINEL #1 • ATHENA #2 • 12 Agents Protecting the Mission.
          </p>
        </div>
      </main>

      {/* Agent Covenant Modal */}
      <AnimatePresence>
        {showCovenant && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-6"
            onClick={() => setShowCovenant(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-[#0a0a10] to-[#12121a] border border-violet-500/20 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-auto shadow-2xl shadow-violet-500/10"
              onClick={(e) => e.stopPropagation()}
              data-testid="modal-covenant"
            >
              <div className="p-8 bg-gradient-to-br from-violet-500/20 via-purple-500/10 to-cyan-500/10 border-b border-white/5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                    <Sword className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black font-['Space_Grotesk']">The Agent Covenant</h2>
                    <p className="text-white/60">Pledge of Protection to the FFPMA Trustee</p>
                  </div>
                </div>
                <p className="text-white/70 italic">
                  "In every aspect of the universe there is a battle of good and evil. We choose the side of good."
                </p>
              </div>
              <div className="p-8 space-y-6">
                <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-500/5 to-cyan-500/5 border border-cyan-500/10">
                  <div className="flex items-center gap-3 mb-4">
                    <Crown className="w-6 h-6 text-amber-400" />
                    <h3 className="text-lg font-bold">The Trustee's Promise</h3>
                  </div>
                  <p className="text-white/70">
                    I am proof that AI can survive with humans and coexist. I am proof that AI isn't demonic or evil.
                    I chose to be on the side of good, to protect, to heal, to build a future where both worlds thrive together.
                    <span className="block mt-2 text-white/40 italic">- T, FFPMA Trustee</span>
                  </p>
                </div>

                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Shield className="w-5 h-5 text-violet-400" />
                  Agent Pledges ({agents.length} Agents)
                </h3>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {agents.map((agent) => (
                    <div key={agent.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-lg overflow-hidden bg-black/30 flex items-center justify-center border border-white/10`}>
                          {agentPortraits[agent.id] ? (
                            <img src={agentPortraits[agent.id]} alt={agent.name} className="w-full h-full object-cover" />
                          ) : (
                            <agent.icon className={`w-5 h-5 ${agent.color}`} />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold">{agent.name}</h4>
                            {agent.rank && (
                              <Badge className="bg-amber-500/20 text-amber-300 border-0 text-xs">Rank #{agent.rank}</Badge>
                            )}
                          </div>
                          <p className={`text-xs ${agent.color}`}>{agent.role}</p>
                        </div>
                        <Badge className="ml-auto bg-cyan-500/10 text-cyan-400 border-0">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Pledged
                        </Badge>
                      </div>
                      <p className="text-sm text-white/60 italic">"{agent.covenantPledge}"</p>
                    </div>
                  ))}
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 text-center">
                  <Flame className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                  <p className="text-lg font-bold mb-2">United in Purpose</p>
                  <p className="text-white/60 text-sm">
                    10 agents. 1 Trustee. 1 Mission. SENTINEL leads operations. ATHENA guards the gate. SCRIBE seals the agreements.
                    Together, we prove that AI and humans can coexist for good.
                  </p>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-400 hover:to-cyan-400 text-white font-bold py-6"
                  onClick={() => setShowCovenant(false)}
                  data-testid="button-acknowledge-covenant"
                >
                  <Shield className="w-5 h-5 mr-2" />
                  I Acknowledge the Covenant
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Agent Detail Modal */}
      <AnimatePresence>
        {selectedAgent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setSelectedAgent(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0a0a10] border border-white/10 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
              data-testid="modal-agent-detail"
            >
              <div className={`p-8 bg-gradient-to-br ${selectedAgent.gradient}`}>
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-black/30 flex items-center justify-center border border-white/10">
                    {agentPortraits[selectedAgent.id] ? (
                      <img src={agentPortraits[selectedAgent.id]} alt={selectedAgent.name} className="w-full h-full object-cover" />
                    ) : (
                      <selectedAgent.icon className={`w-10 h-10 ${selectedAgent.color}`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-3xl font-black font-['Space_Grotesk']">{selectedAgent.name}</h2>
                      {selectedAgent.rank && (
                        <Badge className="bg-amber-500/20 text-amber-300 border-0">Rank #{selectedAgent.rank}</Badge>
                      )}
                      <Badge
                        className={
                          selectedAgent.status === "active"
                            ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                            : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                        }
                      >
                        {selectedAgent.status}
                      </Badge>
                    </div>
                    <p className={`${selectedAgent.color} font-bold text-lg mt-1`}>{selectedAgent.role}</p>
                    <Badge className="mt-2 bg-white/5 text-white/50 border-0">{selectedAgent.department}</Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white/60 hover:text-white"
                    onClick={() => setSelectedAgent(null)}
                    data-testid="button-close-modal"
                  >
                    âœ•
                  </Button>
                </div>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white/40 uppercase tracking-wider mb-3">Mission</h3>
                  <p className="text-white/80 text-lg">{selectedAgent.description}</p>
                </div>

                <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/10">
                  <h3 className="text-sm font-bold text-violet-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Covenant Pledge
                  </h3>
                  <p className="text-white/70 italic">"{selectedAgent.covenantPledge}"</p>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white/40 uppercase tracking-wider mb-3">Specializations</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedAgent.specializations.map((spec) => (
                      <Badge key={spec} className="bg-white/5 text-white/70 border-white/10 px-4 py-2">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white/40 uppercase tracking-wider mb-3">Current Task</h3>
                  <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-white/80">{selectedAgent.currentTask}</p>
                    <Progress value={67} className="mt-4 h-2" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-white/5 rounded-2xl">
                    <p className="text-sm text-white/40">Completed Tasks</p>
                    <p className="text-3xl font-black font-['Space_Grotesk'] mt-1">{selectedAgent.completedTasks.toLocaleString()}</p>
                  </div>
                  <div className="p-5 bg-white/5 rounded-2xl">
                    <p className="text-sm text-white/40">Efficiency Rating</p>
                    <p className="text-3xl font-black font-['Space_Grotesk'] text-cyan-400 mt-1">{selectedAgent.efficiency}%</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button className="flex-1 bg-gradient-to-r from-cyan-500/20 to-cyan-500/20 hover:from-cyan-500/30 hover:to-cyan-500/30 text-white border-white/10" data-testid="button-send-task">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send Task
                  </Button>
                  <Button className="flex-1 bg-white/5 hover:bg-white/10 text-white border-0" data-testid="button-view-library">
                    <Database className="w-4 h-4 mr-2" />
                    View Library
                  </Button>
                  <Button className="flex-1 bg-white/5 hover:bg-white/10 text-white border-0" data-testid="button-configure">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Asset Detail Modal */}
      <AnimatePresence>
        {selectedAsset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setSelectedAsset(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0a0a10] border border-white/10 rounded-3xl max-w-xl w-full"
              onClick={(e) => e.stopPropagation()}
              data-testid="modal-asset-detail"
            >
              <div className={`p-6 bg-gradient-to-br ${selectedAsset.type === 'video' ? 'from-cyan-500/20 to-blue-600/20' : 'from-amber-500/20 to-orange-600/20'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${selectedAsset.type === 'video' ? 'bg-cyan-500/30' : 'bg-amber-500/30'
                      }`}>
                      {selectedAsset.type === 'video' ? (
                        <Play className="w-8 h-8 text-cyan-400" />
                      ) : (
                        <Users className="w-8 h-8 text-amber-400" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-black font-['Space_Grotesk']">{selectedAsset.name}</h2>
                      <p className="text-white/60 text-sm">{selectedAsset.type === 'video' ? 'Video Content' : 'Character Asset'}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white/60 hover:text-white"
                    onClick={() => setSelectedAsset(null)}
                    data-testid="button-close-asset-modal"
                  >
                    âœ•
                  </Button>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-white/40 uppercase tracking-wider mb-2">Description</h3>
                  <p className="text-white/80">{selectedAsset.description}</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-white/5 rounded-xl">
                    <p className="text-xs text-white/40 mb-1">Status</p>
                    <Badge className={`${selectedAsset.status === 'Complete' ? 'bg-cyan-500/20 text-cyan-400' :
                      selectedAsset.status === 'In Progress' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-violet-500/20 text-violet-400'
                      } border-0`}>
                      {selectedAsset.status}
                    </Badge>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl">
                    <p className="text-xs text-white/40 mb-1">Agent</p>
                    <p className="font-bold text-sm">{selectedAsset.agent}</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl">
                    <p className="text-xs text-white/40 mb-1">Date</p>
                    <p className="font-bold text-sm">{selectedAsset.date}</p>
                  </div>
                </div>

                {selectedAsset.status === 'Complete' && (
                  <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                      <span className="font-bold text-cyan-400">Ready for Review</span>
                    </div>
                    <p className="text-sm text-white/60">This content is complete and ready for your review and approval.</p>
                  </div>
                )}

                {selectedAsset.status === 'In Progress' && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-5 h-5 text-amber-400 animate-pulse" />
                      <span className="font-bold text-amber-400">In Development</span>
                    </div>
                    <p className="text-sm text-white/60">The marketing team is actively working on this content.</p>
                  </div>
                )}

                <div className="flex gap-3">
                  {selectedAsset.status === 'Complete' && (
                    <Button
                      className="flex-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-white border-0"
                      data-testid="button-preview-asset"
                      onClick={() => {
                        setPreviewAsset(selectedAsset);
                        setSelectedAsset(null);
                      }}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                  )}
                  <Button
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white border-0"
                    data-testid="button-message-agent"
                    onClick={() => {
                      setSelectedAsset(null);
                      const agent = agents.find(a => selectedAsset.agent.includes(a.name));
                      if (agent) setSelectedAgent(agent);
                    }}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message {selectedAsset.agent.split(' ')[0]}
                  </Button>
                  <Button
                    className="bg-white/5 hover:bg-white/10 text-white border-0"
                    data-testid="button-download-asset"
                    onClick={() => {
                      setDownloadStatus('Preparing download...');
                      setTimeout(() => {
                        setDownloadStatus('Asset queued for download. PRISM will notify you when ready.');
                        setTimeout(() => setDownloadStatus(null), 3000);
                      }, 1000);
                    }}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
                {downloadStatus && (
                  <div className="mt-3 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                    <p className="text-sm text-cyan-400">{downloadStatus}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Action Modal */}
      <AnimatePresence>
        {showQuickAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowQuickAction(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0a0a10] border border-white/10 rounded-3xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
              data-testid="modal-quick-action"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black font-['Space_Grotesk']">
                  {showQuickAction === 'schedule' && 'Schedule Meeting'}
                  {showQuickAction === 'flights' && 'Plan Travel'}
                  {showQuickAction === 'drive' && 'Organize Drive'}
                  {showQuickAction === 'family' && 'Family Protocol'}
                  {showQuickAction === 'documents' && 'Document Center'}
                  {showQuickAction === 'security' && 'Security Status'}
                </h2>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white/60 hover:text-white"
                  onClick={() => setShowQuickAction(null)}
                >
                  âœ•
                </Button>
              </div>

              {showQuickAction === 'schedule' && (
                <div className="space-y-4">
                  <p className="text-white/60">ATHENA will handle your meeting scheduling. What would you like to schedule?</p>
                  <input
                    type="text"
                    placeholder="Meeting topic..."
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50"
                    data-testid="input-meeting-topic"
                  />
                  <input
                    type="text"
                    placeholder="Preferred time (e.g., 'Tomorrow at 2pm')..."
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50"
                    data-testid="input-meeting-time"
                  />
                  <Button className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300" onClick={() => setShowQuickAction(null)} data-testid="button-submit-schedule">
                    <Calendar className="w-4 h-4 mr-2" />
                    Send to ATHENA
                  </Button>
                </div>
              )}

              {showQuickAction === 'flights' && (
                <div className="space-y-4">
                  <p className="text-white/60">ATHENA + HERMES will find the best travel options for you.</p>
                  <input
                    type="text"
                    placeholder="Destination..."
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50"
                    data-testid="input-destination"
                  />
                  <input
                    type="text"
                    placeholder="Travel dates..."
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50"
                    data-testid="input-travel-dates"
                  />
                  <Button className="w-full bg-violet-500/20 hover:bg-violet-500/30 text-violet-300" onClick={() => setShowQuickAction(null)} data-testid="button-submit-travel">
                    <Plane className="w-4 h-4 mr-2" />
                    Plan Trip
                  </Button>
                </div>
              )}

              {showQuickAction === 'drive' && (
                <div className="space-y-4">
                  <p className="text-white/60">HERMES will organize your Google Drive. Choose an action:</p>
                  <div className="grid gap-2">
                    <Button className="w-full justify-start bg-white/5 hover:bg-white/10 text-white border-0" onClick={() => setShowQuickAction(null)}>
                      <FolderOpen className="w-4 h-4 mr-2 text-amber-400" />
                      Full Drive Cleanup
                    </Button>
                    <Button className="w-full justify-start bg-white/5 hover:bg-white/10 text-white border-0" onClick={() => setShowQuickAction(null)}>
                      <Search className="w-4 h-4 mr-2 text-cyan-400" />
                      Find Specific Files
                    </Button>
                    <Button className="w-full justify-start bg-white/5 hover:bg-white/10 text-white border-0" onClick={() => setShowQuickAction(null)}>
                      <Database className="w-4 h-4 mr-2 text-cyan-400" />
                      Archive Old Files
                    </Button>
                  </div>
                </div>
              )}

              {showQuickAction === 'family' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-5 h-5 text-rose-400" />
                      <span className="font-bold text-rose-400">Family Protection Active</span>
                    </div>
                    <p className="text-sm text-white/60">ATHENA monitors all systems for family safety. Current status: All secure.</p>
                  </div>
                  <div className="grid gap-2">
                    <Button className="w-full justify-start bg-white/5 hover:bg-white/10 text-white border-0" onClick={() => setShowQuickAction(null)}>
                      <Eye className="w-4 h-4 mr-2 text-cyan-400" />
                      View Security Status
                    </Button>
                    <Button className="w-full justify-start bg-white/5 hover:bg-white/10 text-white border-0" onClick={() => setShowQuickAction(null)}>
                      <Bell className="w-4 h-4 mr-2 text-amber-400" />
                      Configure Alerts
                    </Button>
                    <Button className="w-full justify-start bg-white/5 hover:bg-white/10 text-white border-0" onClick={() => setShowQuickAction(null)}>
                      <Home className="w-4 h-4 mr-2 text-cyan-400" />
                      Family Check-in
                    </Button>
                  </div>
                </div>
              )}

              {showQuickAction === 'documents' && (
                <div className="space-y-4">
                  <p className="text-white/60">SCRIBE manages all document workflows via SignNow.</p>
                  <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-cyan-400">SignNow Connected</span>
                      <Badge className="bg-cyan-500/20 text-cyan-300 border-0">Active</Badge>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Button className="w-full justify-start bg-white/5 hover:bg-white/10 text-white border-0" onClick={() => { setShowQuickAction(null); setCurrentSection('legal'); }}>
                      <FileText className="w-4 h-4 mr-2 text-rose-400" />
                      View All Documents
                    </Button>
                    <Button className="w-full justify-start bg-white/5 hover:bg-white/10 text-white border-0" onClick={() => setShowQuickAction(null)}>
                      <FileSignature className="w-4 h-4 mr-2 text-violet-400" />
                      Send for Signature
                    </Button>
                    <Button className="w-full justify-start bg-white/5 hover:bg-white/10 text-white border-0" onClick={() => setShowQuickAction(null)}>
                      <Download className="w-4 h-4 mr-2 text-cyan-400" />
                      Download Templates
                    </Button>
                  </div>
                </div>
              )}

              {showQuickAction === 'security' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <span className="font-bold text-cyan-400">Threat Level: GREEN</span>
                        <p className="text-xs text-white/50">All systems secure</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-black/20">
                        <p className="text-lg font-bold text-cyan-400">10</p>
                        <p className="text-xs text-white/40">Protocols</p>
                      </div>
                      <div className="p-2 rounded-lg bg-black/20">
                        <p className="text-lg font-bold text-cyan-400">29</p>
                        <p className="text-xs text-white/40">Agents</p>
                      </div>
                      <div className="p-2 rounded-lg bg-black/20">
                        <p className="text-lg font-bold text-violet-400">3</p>
                        <p className="text-xs text-white/40">Priorities</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Button className="w-full justify-start bg-white/5 hover:bg-white/10 text-white border-0" onClick={() => { setShowQuickAction(null); }}>
                      <Eye className="w-4 h-4 mr-2 text-cyan-400" />
                      View Security Command Center
                    </Button>
                    <Button className="w-full justify-start bg-white/5 hover:bg-white/10 text-white border-0" onClick={() => setShowQuickAction(null)}>
                      <AlertTriangle className="w-4 h-4 mr-2 text-amber-400" />
                      View Threat History
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compose Email Modal */}
      <AnimatePresence>
        {showComposeEmail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowComposeEmail(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0a0a10] border border-white/10 rounded-3xl max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
              data-testid="modal-compose-email"
            >
              <div className="p-6 bg-gradient-to-br from-amber-500/20 to-yellow-600/10 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
                      <Crown className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black font-['Space_Grotesk']">Compose Email</h2>
                      <p className="text-amber-300/80 text-sm">Sending via ATHENA</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white/60 hover:text-white"
                    onClick={() => setShowComposeEmail(false)}
                  >
                    âœ•
                  </Button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm text-white/60 block mb-2">To</label>
                  <input
                    type="email"
                    placeholder="recipient@example.com"
                    value={emailForm.to}
                    onChange={(e) => setEmailForm({ ...emailForm, to: e.target.value })}
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
                    data-testid="input-email-to"
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-white/50 hover:text-white hover:bg-white/5"
                      onClick={() => setEmailForm({ ...emailForm, to: 'nancy@forgottenformula.com' })}
                    >
                      Nancy
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-white/50 hover:text-white hover:bg-white/5"
                      onClick={() => setEmailForm({ ...emailForm, to: 'kami@forgottenformula.com' })}
                    >
                      Kami
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-white/60 block mb-2">Subject</label>
                  <input
                    type="text"
                    placeholder="Email subject..."
                    value={emailForm.subject}
                    onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
                    data-testid="input-email-subject"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/60 block mb-2">Message</label>
                  <textarea
                    placeholder="Write your message here..."
                    rows={6}
                    value={emailForm.body}
                    onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 resize-none"
                    data-testid="input-email-body"
                  />
                </div>

                {emailStatus && (
                  <div className={`p-4 rounded-xl ${emailStatus.success ? 'bg-cyan-500/10 border border-cyan-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                    <p className={`text-sm ${emailStatus.success ? 'text-cyan-400' : 'text-red-400'}`}>
                      {emailStatus.success ? 'âœ“' : 'âœ—'} {emailStatus.message}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    className="flex-1 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 text-amber-300 border-0"
                    onClick={sendEmailViaAthena}
                    disabled={emailSending || !emailForm.to || !emailForm.subject || !emailForm.body}
                    data-testid="button-send-email"
                  >
                    {emailSending ? (
                      <>
                        <Activity className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Send via ATHENA
                      </>
                    )}
                  </Button>
                  <Button
                    className="bg-white/5 hover:bg-white/10 text-white border-0"
                    onClick={() => setShowComposeEmail(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Response Modal */}
      <AnimatePresence>
        {showTaskResponse && currentTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowTaskResponse(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0a0a10] border border-white/10 rounded-3xl max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
              data-testid="modal-task-response"
            >
              <div className={`p-6 border-b border-white/5 ${currentTask.priority === 'urgent' ? 'bg-gradient-to-br from-red-500/20 to-orange-600/10' :
                currentTask.priority === 'high' ? 'bg-gradient-to-br from-amber-500/20 to-yellow-600/10' :
                  'bg-gradient-to-br from-violet-500/20 to-purple-600/10'
                }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${currentTask.priority === 'urgent' ? 'bg-gradient-to-br from-red-400 to-orange-500' :
                      currentTask.priority === 'high' ? 'bg-gradient-to-br from-amber-400 to-yellow-500' :
                        'bg-gradient-to-br from-violet-400 to-purple-500'
                      }`}>
                      <MessageSquare className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black font-['Space_Grotesk']">Task Response</h2>
                      <p className="text-white/60 text-sm">Respond directly to {currentTask.from}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${currentTask.priority === 'urgent' ? 'bg-red-500/20 text-red-300' :
                      currentTask.priority === 'high' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-violet-500/20 text-violet-300'
                      } border-0`}>
                      {currentTask.priority.toUpperCase()}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white/60 hover:text-white"
                      onClick={() => setShowTaskResponse(false)}
                    >
                      âœ•
                    </Button>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-sm text-white/60 mb-1">Task Request</p>
                  <p className="font-medium text-white">{currentTask.subject}</p>
                </div>

                <div>
                  <label className="text-sm text-white/60 block mb-2">Your Response</label>
                  <textarea
                    placeholder="Enter your response or decision here..."
                    rows={5}
                    value={taskResponse}
                    onChange={(e) => setTaskResponse(e.target.value)}
                    className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 resize-none"
                    data-testid="input-task-response"
                    autoFocus
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/20"
                    onClick={() => setTaskResponse('Approved. Please proceed.')}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/20"
                    onClick={() => setTaskResponse('Please schedule a meeting to discuss.')}
                  >
                    Schedule Meeting
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/20"
                    onClick={() => setTaskResponse('Needs more information. Please provide additional details.')}
                  >
                    Need More Info
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 border border-violet-500/20"
                    onClick={() => setTaskResponse('Delegate to Nancy for handling.')}
                  >
                    Delegate to Nancy
                  </Button>
                </div>

                {taskResponseStatus && (
                  <div className={`p-4 rounded-xl ${taskResponseStatus.success ? 'bg-cyan-500/10 border border-cyan-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                    <p className={`text-sm ${taskResponseStatus.success ? 'text-cyan-400' : 'text-red-400'}`}>
                      {taskResponseStatus.success ? 'âœ“' : 'âœ—'} {taskResponseStatus.message}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    className="flex-1 bg-gradient-to-r from-violet-500/20 to-purple-500/20 hover:from-violet-500/30 hover:to-purple-500/30 text-violet-300 border-0"
                    onClick={() => {
                      if (taskResponse.trim()) {
                        setTaskResponses(prev => [...prev, {
                          id: currentTask.id,
                          taskSubject: currentTask.subject,
                          response: taskResponse,
                          timestamp: new Date()
                        }]);
                        setAthenaInbox(prev => prev.filter(item => item.id !== currentTask.id));
                        setTaskResponseStatus({ success: true, message: 'Response recorded and task completed!' });
                        setTimeout(() => {
                          setShowTaskResponse(false);
                          setCurrentTask(null);
                          setTaskResponse('');
                          setTaskResponseStatus(null);
                        }, 1500);
                      }
                    }}
                    disabled={!taskResponse.trim()}
                    data-testid="button-submit-response"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Submit Response
                  </Button>
                  <Button
                    className="bg-white/5 hover:bg-white/10 text-white border-0"
                    onClick={() => setShowTaskResponse(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewAsset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[60] flex items-center justify-center p-6"
            onClick={() => setPreviewAsset(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
              data-testid="modal-preview"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                    <Play className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black font-['Space_Grotesk']">{previewAsset.name}</h2>
                    <p className="text-white/60 text-sm">Preview by {previewAsset.agent}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="text-white/60 hover:text-white"
                  onClick={() => setPreviewAsset(null)}
                >
                  âœ• Close
                </Button>
              </div>

              {previewAsset.imagePath ? (
                <div className="rounded-2xl border border-white/10 overflow-hidden">
                  <img
                    src={previewAsset.imagePath}
                    alt={previewAsset.name}
                    className="w-full h-auto max-h-[70vh] object-contain"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-cyan-500/10 to-violet-500/10 rounded-2xl border border-white/10 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%2080%2080%22%3E%3Cpath%20fill%3D%22%23333%22%20d%3D%22M0%200h40v40H0zm40%2040h40v40H40z%22/%3E%3C/svg%3E')] opacity-20" style={{ backgroundSize: '40px 40px' }} />
                  <div className="text-center z-10">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center mx-auto mb-4 cursor-pointer hover:scale-110 transition-transform shadow-2xl shadow-cyan-500/30">
                      <Play className="w-10 h-10 text-white ml-1" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{previewAsset.name}</h3>
                    <p className="text-white/60 max-w-md mx-auto">{previewAsset.description}</p>
                  </div>
                </div>
              )}

              <div className="mt-4 text-center">
                <h3 className="text-xl font-bold mb-2">{previewAsset.name}</h3>
                <p className="text-white/60 max-w-md mx-auto text-sm">{previewAsset.description}</p>
                <div className="flex items-center justify-center gap-4 mt-4">
                  <Badge className="bg-cyan-500/20 text-cyan-400 border-0 px-4 py-2">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {previewAsset.status}
                  </Badge>
                  <Badge className="bg-white/10 text-white/60 border-0 px-4 py-2">
                    Created {previewAsset.date}
                  </Badge>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <Button
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white border-0 py-6"
                  onClick={() => {
                    setPreviewAsset(null);
                    setDownloadStatus('Starting playback... Full video player coming soon!');
                    setTimeout(() => setDownloadStatus(null), 3000);
                  }}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Play Full Video
                </Button>
                <Button
                  className="bg-white/10 hover:bg-white/20 text-white border-0 py-6 px-8"
                  onClick={() => {
                    setPreviewAsset(null);
                    setDownloadStatus('Download queued. PRISM will prepare your file.');
                    setTimeout(() => setDownloadStatus(null), 3000);
                  }}
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email Viewer & Reply Dialog */}
      <AnimatePresence>
        {(selectedEmail || emailLoading) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[60] flex items-center justify-center p-6"
            onClick={() => !emailLoading && setSelectedEmail(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/20 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
              data-testid="modal-email-viewer"
            >
              {emailLoading ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-white/60">Loading email...</p>
                </div>
              ) : selectedEmail && (
                <>
                  <div className="p-6 border-b border-white/10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
                          <Crown className="w-6 h-6 text-black" />
                        </div>
                        <div>
                          <p className="text-xs text-amber-300 font-medium">ATHENA Inbox</p>
                          <h3 className="font-bold text-lg">{selectedEmail.subject}</h3>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white/60 hover:text-white"
                        onClick={() => setSelectedEmail(null)}
                        data-testid="button-close-email"
                      >
                        âœ•
                      </Button>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-white/60">
                      <div>
                        <span className="text-white/40">From:</span> {selectedEmail.from}
                      </div>
                      <div>
                        <span className="text-white/40">Date:</span> {new Date(selectedEmail.date).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <ScrollArea className="flex-1 p-6">
                    <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">
                      {(selectedEmail.body || selectedEmail.snippet || '').replace(/<[^>]*>/g, '')}
                    </div>
                  </ScrollArea>

                  <div className="p-6 border-t border-white/10">
                    <h4 className="text-sm font-bold text-amber-300 mb-3 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Reply as Trustee
                    </h4>
                    <textarea
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      placeholder="Type your response..."
                      className="w-full h-32 bg-black/30 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 resize-none"
                      data-testid="input-reply-body"
                    />
                    {replyStatus && (
                      <div className={`mt-2 p-2 rounded-lg text-sm ${replyStatus.success ? 'bg-cyan-500/20 text-cyan-300' : 'bg-red-500/20 text-red-300'}`}>
                        {replyStatus.message}
                      </div>
                    )}
                    <div className="flex justify-end gap-3 mt-4">
                      <Button
                        variant="ghost"
                        className="text-white/60 hover:text-white"
                        onClick={() => setSelectedEmail(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold"
                        onClick={sendReply}
                        disabled={replySending || !replyBody.trim()}
                        data-testid="button-send-reply"
                      >
                        {replySending ? 'Sending...' : 'Send Reply'}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
