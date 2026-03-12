import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Compass, 
  Dna, 
  Heart, 
  Leaf, 
  Sparkles, 
  Shield, 
  Brain,
  Waves,
  Users,
  MessageCircle,
  ChevronRight,
  Home,
  BookOpen,
  Beaker,
  Activity,
  Star,
  ArrowRight,
  CheckCircle2,
  Clock,
  Zap,
  Microscope,
  GraduationCap,
  Award,
  Upload,
  Play,
  Video,
  FileText,
  Eye,
  Target,
  TrendingUp,
  AlertCircle,
  Check,
  X,
  Camera,
  Loader2,
  CircleDot,
  Package,
  Headphones
} from "lucide-react";
import { Link } from "wouter";
import { agents, FFPMA_CREED, getAgentsByDivision } from "@shared/agents";

const getAgentPortrait = (agentId: string): string => {
  const portraitMap: Record<string, string> = {
    prometheus: '/generated/prometheus_chief_science_officer_portrait.png',
    hippocrates: '/generated/hippocrates_ancient_medicine_expert_portrait.png',
    helix: '/generated/helix_crispr_genetics_expert_portrait.png',
    paracelsus: '/generated/paracelsus_peptide_biologics_expert_portrait.png',
    resonance: '/generated/resonance_frequency_medicine_expert_portrait.png',
    synthesis: '/generated/synthesis_biochemistry_analyst_portrait.png',
    vitalis: '/generated/vitalis_physiology_cellular_expert_portrait.png',
    oracle: '/generated/oracle_knowledge_integration_expert_portrait.png',
    terra: '/generated/terra_soil_ecosystems_expert_portrait.png',
    microbia: '/generated/microbia_microbiome_bacteria_expert_portrait.png',
    entheos: '/generated/entheos_psychedelic_consciousness_expert_portrait.png',
  };
  return portraitMap[agentId] || '';
};

const healingModalities = [
  {
    id: "minerals",
    name: "Essential Minerals",
    icon: Sparkles,
    description: "Restore cellular function with bioavailable mineral protocols",
    color: "from-amber-500/20 to-orange-500/20 border-amber-500/30",
    iconColor: "text-amber-400",
    gradientFrom: "from-amber-500",
    gradientTo: "to-orange-500",
    protocols: ["Full Spectrum Mineral Complex", "Magnesium Optimization", "Zinc & Copper Balance"],
    image: "/generated/essential_minerals_display.png"
  },
  {
    id: "frequency",
    name: "Frequency Healing",
    icon: Waves,
    description: "Royal Rife protocols and Tesla-inspired resonance therapy",
    color: "from-violet-500/20 to-purple-500/20 border-violet-500/30",
    iconColor: "text-violet-400",
    gradientFrom: "from-violet-500",
    gradientTo: "to-purple-500",
    protocols: ["Rife Frequency Sessions", "PEMF Therapy", "Bio-Resonance Scanning"],
    image: "/generated/frequency_healing_visualization.png"
  },
  {
    id: "microbiome",
    name: "Gut Restoration",
    icon: Dna,
    description: "Rebuild your microbiome for systemic health",
    color: "from-cyan-500/20 to-cyan-500/20 border-cyan-500/30",
    iconColor: "text-cyan-400",
    gradientFrom: "from-cyan-500",
    gradientTo: "to-cyan-500",
    protocols: ["Probiotic Restoration", "Gut Barrier Repair", "Microbiome Testing"],
    image: "/generated/microbiome_wellness_art.png"
  },
  {
    id: "peptides",
    name: "Peptide Therapy",
    icon: Beaker,
    description: "Cellular regeneration through targeted peptide protocols",
    color: "from-cyan-500/20 to-blue-500/20 border-cyan-500/30",
    iconColor: "text-cyan-400",
    gradientFrom: "from-cyan-500",
    gradientTo: "to-blue-500",
    protocols: ["BPC-157 Protocol", "TB-500 Recovery", "Growth Hormone Support"],
    image: "/generated/peptide_therapy_elegance.png"
  },
  {
    id: "detox",
    name: "Detoxification",
    icon: Leaf,
    description: "Remove toxins and restore natural detox pathways",
    color: "from-lime-500/20 to-cyan-500/20 border-lime-500/30",
    iconColor: "text-lime-400",
    gradientFrom: "from-lime-500",
    gradientTo: "to-cyan-500",
    protocols: ["Heavy Metal Chelation", "Liver Support", "Lymphatic Drainage"],
    image: "/generated/detoxification_purification_art.png"
  },
  {
    id: "consciousness",
    name: "Consciousness Work",
    icon: Brain,
    description: "Expand awareness through guided therapeutic practices",
    color: "from-pink-500/20 to-rose-500/20 border-pink-500/30",
    iconColor: "text-pink-400",
    gradientFrom: "from-pink-500",
    gradientTo: "to-rose-500",
    protocols: ["Guided Meditation", "Breathwork Sessions", "Integration Support"],
    image: "/generated/ai_human_healing_coexistence.png"
  }
];

const memberJourneyStages = [
  { stage: 1, name: "Discovery", description: "Learn about true healing", icon: Compass, active: true },
  { stage: 2, name: "Assessment", description: "Personalized health mapping", icon: Activity, active: true },
  { stage: 3, name: "Protocol", description: "Custom healing protocols", icon: Beaker, active: false },
  { stage: 4, name: "Integration", description: "Lifestyle transformation", icon: Heart, active: false },
  { stage: 5, name: "Mastery", description: "Become a healing guide", icon: Star, active: false }
];

const bloodAnalysisCourse = {
  title: "Live Blood Analysis Certification",
  description: "Master the art and science of live blood microscopy with AI-powered analysis",
  modules: [
    {
      id: 1,
      title: "Introduction to Live Blood Analysis",
      duration: "45 min",
      lessons: 5,
      completed: true,
      topics: ["History & Science", "Equipment Setup", "Sample Collection", "Safety Protocols", "Ethics & Compliance"]
    },
    {
      id: 2,
      title: "Cellular Morphology Basics",
      duration: "1.5 hours",
      lessons: 8,
      completed: true,
      topics: ["Red Blood Cell Shapes", "White Blood Cell Types", "Platelet Analysis", "Plasma Observations", "Normal vs Abnormal"]
    },
    {
      id: 3,
      title: "Pattern Recognition",
      duration: "2 hours",
      lessons: 12,
      completed: false,
      current: true,
      progress: 67,
      topics: ["Rouleaux Formation", "Fibrin Networks", "Crystal Formations", "Bacterial Presence", "Yeast & Fungi", "Parasitic Indicators"]
    },
    {
      id: 4,
      title: "AI-Assisted Analysis",
      duration: "1.5 hours",
      lessons: 6,
      completed: false,
      topics: ["Using FF AI Tools", "Pattern Matching", "Automated Detection", "Report Generation", "Quality Assurance"]
    },
    {
      id: 5,
      title: "Clinical Correlations",
      duration: "2 hours",
      lessons: 10,
      completed: false,
      topics: ["Nutritional Deficiencies", "Toxin Exposure", "Immune Status", "Oxidative Stress", "Protocol Recommendations"]
    },
    {
      id: 6,
      title: "Certification Exam",
      duration: "1 hour",
      lessons: 1,
      completed: false,
      topics: ["Practical Assessment", "Case Studies", "Written Exam"]
    }
  ],
  instructors: ["prometheus", "vitalis", "helix"]
};

const bloodPatterns = [
  { name: "Rouleaux Formation", indicator: "Acidic Blood / Poor Circulation", severity: "moderate", color: "amber" },
  { name: "Poikilocytosis", indicator: "Nutrient Deficiency", severity: "mild", color: "yellow" },
  { name: "Target Cells", indicator: "Liver/Spleen Issues", severity: "moderate", color: "orange" },
  { name: "Fibrin Networks", indicator: "Inflammation / Clotting Risk", severity: "high", color: "red" },
  { name: "Crystal Formations", indicator: "Uric Acid / Toxin Buildup", severity: "moderate", color: "violet" },
  { name: "Healthy RBCs", indicator: "Normal Morphology", severity: "normal", color: "cyan" }
];

export default function FormulaAllio() {
  const [selectedModality, setSelectedModality] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("journey");
  const [showBloodAnalysis, setShowBloodAnalysis] = useState(false);
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const scienceAgents = getAgentsByDivision('science');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        setAnalysisResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const runAIAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setAnalysisResult({
        overallHealth: 72,
        patterns: [
          { name: "Rouleaux Formation", detected: true, confidence: 89, severity: "moderate" },
          { name: "Healthy RBCs", detected: true, confidence: 76, severity: "normal" },
          { name: "Minor Fibrin", detected: true, confidence: 65, severity: "mild" }
        ],
        recommendations: [
          "Increase alkaline foods (leafy greens, lemon water)",
          "Consider mineral supplementation (magnesium, zinc)",
          "Reduce inflammatory foods",
          "Hydration optimization protocol"
        ],
        agents: ["vitalis", "synthesis", "prometheus"]
      });
      setIsAnalyzing(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-500/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <header className="border-b border-white/10 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <Dna className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 border-2 border-slate-950 flex items-center justify-center">
                    <Check className="w-2 h-2 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-400 bg-clip-text text-transparent font-['Space_Grotesk']">
                    Forgotten Formula PMA
                  </h1>
                  <p className="text-xs text-white/50">Your Healing Portal • FFPMA University</p>
                </div>
              </div>
              
              <nav className="flex items-center gap-2">
                <Link href="/products">
                  <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10" data-testid="button-products">
                    <Package className="w-4 h-4 mr-2" />
                    Products
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  className={`text-white/70 hover:text-white hover:bg-white/10 ${showBloodAnalysis ? 'bg-rose-500/20 text-rose-300' : ''}`}
                  onClick={() => setShowBloodAnalysis(!showBloodAnalysis)}
                  data-testid="button-blood-analysis"
                >
                  <Microscope className="w-4 h-4 mr-2" />
                  Training
                </Button>
                <Link href="/support">
                  <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10" data-testid="button-support">
                    <Headphones className="w-4 h-4 mr-2" />
                    Support
                  </Button>
                </Link>
                <Link href="/join">
                  <Button className="bg-gradient-to-r from-cyan-500 to-cyan-500 hover:from-cyan-600 hover:to-cyan-600 shadow-lg shadow-cyan-500/20" data-testid="button-join">
                    Join FFPMA
                  </Button>
                </Link>
              </nav>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-6 py-8">
          <AnimatePresence mode="wait">
            {showBloodAnalysis ? (
              <motion.div
                key="blood-analysis"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 mb-2">
                      <Microscope className="w-3 h-3 mr-1" />
                      FFPMA University
                    </Badge>
                    <h2 className="text-3xl font-bold font-['Space_Grotesk']">
                      <span className="bg-gradient-to-r from-rose-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                        Live Blood Analysis Training
                      </span>
                    </h2>
                    <p className="text-white/60 mt-2">Master microscopy with AI-powered cellular analysis</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {bloodAnalysisCourse.instructors.map((id) => {
                      const agent = agents.find(a => a.id === id);
                      return (
                        <div key={id} className="relative group" title={agent?.name}>
                          <img 
                            src={getAgentPortrait(id)} 
                            alt={agent?.name}
                            className="w-12 h-12 rounded-full border-2 border-white/20 object-cover"
                          />
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 border-2 border-slate-950" />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Tabs defaultValue="course" className="space-y-6">
                  <TabsList className="bg-black/40 border border-white/10 p-1">
                    <TabsTrigger value="course" className="data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-300">
                      <GraduationCap className="w-4 h-4 mr-2" />
                      Training Course
                    </TabsTrigger>
                    <TabsTrigger value="analyze" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300">
                      <Eye className="w-4 h-4 mr-2" />
                      AI Analysis
                    </TabsTrigger>
                    <TabsTrigger value="patterns" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
                      <Target className="w-4 h-4 mr-2" />
                      Pattern Library
                    </TabsTrigger>
                    <TabsTrigger value="certification" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
                      <Award className="w-4 h-4 mr-2" />
                      Certification
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="course" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 space-y-4">
                        {bloodAnalysisCourse.modules.map((module) => (
                          <motion.div
                            key={module.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: module.id * 0.1 }}
                          >
                            <Card 
                              className={`p-5 cursor-pointer transition-all ${
                                module.completed 
                                  ? 'bg-cyan-500/10 border-cyan-500/30' 
                                  : module.current 
                                    ? 'bg-gradient-to-r from-rose-500/20 to-violet-500/20 border-rose-500/30 ring-2 ring-rose-500/20' 
                                    : 'bg-black/20 border-white/10 hover:border-white/20'
                              }`}
                              onClick={() => setSelectedModule(selectedModule === module.id ? null : module.id)}
                              data-testid={`card-module-${module.id}`}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                  module.completed 
                                    ? 'bg-cyan-500' 
                                    : module.current 
                                      ? 'bg-gradient-to-br from-rose-500 to-violet-500' 
                                      : 'bg-white/10'
                                }`}>
                                  {module.completed ? (
                                    <CheckCircle2 className="w-6 h-6 text-white" />
                                  ) : (
                                    <span className="text-lg font-bold">{module.id}</span>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-bold">{module.title}</h4>
                                    {module.current && (
                                      <Badge className="bg-rose-500/20 text-rose-300 border-0 text-xs">In Progress</Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-white/50 mt-1">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {module.duration}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <FileText className="w-3 h-3" />
                                      {module.lessons} lessons
                                    </span>
                                  </div>
                                  {module.current && module.progress && (
                                    <div className="mt-2">
                                      <Progress value={module.progress} className="h-1.5" />
                                      <span className="text-xs text-white/40 mt-1">{module.progress}% complete</span>
                                    </div>
                                  )}
                                </div>
                                <ChevronRight className={`w-5 h-5 text-white/40 transition-transform ${selectedModule === module.id ? 'rotate-90' : ''}`} />
                              </div>

                              <AnimatePresence>
                                {selectedModule === module.id && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-4 pt-4 border-t border-white/10"
                                  >
                                    <p className="text-xs text-white/40 mb-3">Topics covered:</p>
                                    <div className="grid grid-cols-2 gap-2">
                                      {module.topics.map((topic, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm">
                                          <CircleDot className="w-3 h-3 text-white/40" />
                                          <span className="text-white/70">{topic}</span>
                                        </div>
                                      ))}
                                    </div>
                                    <Button 
                                      className={`w-full mt-4 ${
                                        module.completed 
                                          ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300' 
                                          : 'bg-gradient-to-r from-rose-500 to-violet-500 hover:from-rose-600 hover:to-violet-600'
                                      }`}
                                      data-testid={`button-start-module-${module.id}`}
                                    >
                                      {module.completed ? 'Review Module' : module.current ? 'Continue Learning' : 'Start Module'}
                                      <Play className="w-4 h-4 ml-2" />
                                    </Button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </Card>
                          </motion.div>
                        ))}
                      </div>

                      <div className="space-y-4">
                        <Card className="bg-gradient-to-br from-rose-500/10 to-violet-500/10 border-rose-500/20 p-5">
                          <h4 className="font-bold mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-rose-400" />
                            Your Progress
                          </h4>
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-white/60">Course Completion</span>
                              <span className="font-bold text-rose-400">33%</span>
                            </div>
                            <Progress value={33} className="h-2" />
                            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                              <div className="p-2 rounded-lg bg-black/20">
                                <p className="text-lg font-bold text-cyan-400">2</p>
                                <p className="text-xs text-white/40">Completed</p>
                              </div>
                              <div className="p-2 rounded-lg bg-black/20">
                                <p className="text-lg font-bold text-rose-400">1</p>
                                <p className="text-xs text-white/40">In Progress</p>
                              </div>
                              <div className="p-2 rounded-lg bg-black/20">
                                <p className="text-lg font-bold text-white/40">3</p>
                                <p className="text-xs text-white/40">Remaining</p>
                              </div>
                            </div>
                          </div>
                        </Card>

                        <Card className="bg-black/20 border-white/10 p-5">
                          <h4 className="font-bold mb-4 flex items-center gap-2">
                            <Video className="w-5 h-5 text-violet-400" />
                            Featured Video
                          </h4>
                          <div className="aspect-video rounded-lg bg-gradient-to-br from-violet-500/20 to-rose-500/20 flex items-center justify-center mb-3 relative overflow-hidden">
                            <img 
                              src="/generated/cellular_regeneration_art.png" 
                              alt="Blood Analysis"
                              className="absolute inset-0 w-full h-full object-cover opacity-50"
                            />
                            <Button className="relative z-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full w-14 h-14">
                              <Play className="w-6 h-6" />
                            </Button>
                          </div>
                          <p className="text-sm text-white/60">Introduction to Cellular Morphology</p>
                          <p className="text-xs text-white/40 mt-1">with VITALIS • 12:34</p>
                        </Card>

                        <Card className="bg-black/20 border-white/10 p-5">
                          <h4 className="font-bold mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-cyan-400" />
                            Your Instructors
                          </h4>
                          <div className="space-y-3">
                            {bloodAnalysisCourse.instructors.map((id) => {
                              const agent = agents.find(a => a.id === id);
                              return (
                                <div key={id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                                  <img 
                                    src={getAgentPortrait(id)} 
                                    alt={agent?.name}
                                    className="w-10 h-10 rounded-full object-cover border border-white/20"
                                  />
                                  <div>
                                    <p className="font-medium text-sm">{agent?.name}</p>
                                    <p className="text-xs text-white/40">{agent?.specialty.split(',')[0]}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="analyze" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="bg-black/20 border-white/10 p-6">
                        <h4 className="font-bold mb-4 flex items-center gap-2">
                          <Camera className="w-5 h-5 text-violet-400" />
                          Upload Blood Sample
                        </h4>
                        <p className="text-sm text-white/60 mb-4">
                          Upload a dark field microscopy image for AI-powered analysis
                        </p>
                        
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="aspect-square rounded-xl border-2 border-dashed border-white/20 hover:border-violet-500/50 transition-colors cursor-pointer flex flex-col items-center justify-center bg-black/20 overflow-hidden relative"
                        >
                          {uploadedImage ? (
                            <>
                              <img src={uploadedImage} alt="Uploaded sample" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <p className="text-sm">Click to change</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <Upload className="w-12 h-12 text-white/30 mb-3" />
                              <p className="text-sm text-white/50">Drop image here or click to upload</p>
                              <p className="text-xs text-white/30 mt-1">PNG, JPG up to 10MB</p>
                            </>
                          )}
                        </div>

                        {uploadedImage && (
                          <Button 
                            className="w-full mt-4 bg-gradient-to-r from-violet-500 to-rose-500 hover:from-violet-600 hover:to-rose-600"
                            onClick={runAIAnalysis}
                            disabled={isAnalyzing}
                            data-testid="button-run-analysis"
                          >
                            {isAnalyzing ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Analyzing with VITALIS, SYNTHESIS, PROMETHEUS...
                              </>
                            ) : (
                              <>
                                <Eye className="w-4 h-4 mr-2" />
                                Run AI Analysis
                              </>
                            )}
                          </Button>
                        )}
                      </Card>

                      <Card className="bg-black/20 border-white/10 p-6">
                        <h4 className="font-bold mb-4 flex items-center gap-2">
                          <Activity className="w-5 h-5 text-cyan-400" />
                          Analysis Results
                        </h4>
                        
                        {analysisResult ? (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                          >
                            <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/20 to-cyan-500/20 border border-cyan-500/30">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-white/60">Overall Blood Health Score</span>
                                <span className="text-2xl font-bold text-cyan-400">{analysisResult.overallHealth}%</span>
                              </div>
                              <Progress value={analysisResult.overallHealth} className="h-2" />
                            </div>

                            <div className="space-y-2">
                              <p className="text-sm font-medium">Detected Patterns:</p>
                              {analysisResult.patterns.map((pattern: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${
                                      pattern.severity === 'normal' ? 'bg-cyan-500' :
                                      pattern.severity === 'mild' ? 'bg-yellow-500' :
                                      pattern.severity === 'moderate' ? 'bg-orange-500' : 'bg-red-500'
                                    }`} />
                                    <span className="text-sm">{pattern.name}</span>
                                  </div>
                                  <Badge className="bg-white/10 text-white/70 border-0 text-xs">
                                    {pattern.confidence}% confidence
                                  </Badge>
                                </div>
                              ))}
                            </div>

                            <div className="space-y-2">
                              <p className="text-sm font-medium">Recommendations:</p>
                              <div className="space-y-1">
                                {analysisResult.recommendations.map((rec: string, i: number) => (
                                  <div key={i} className="flex items-start gap-2 text-sm text-white/70">
                                    <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                                    <span>{rec}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="pt-4 border-t border-white/10">
                              <p className="text-xs text-white/40 mb-2">Analysis performed by:</p>
                              <div className="flex gap-2">
                                {analysisResult.agents.map((id: string) => {
                                  const agent = agents.find(a => a.id === id);
                                  return (
                                    <div key={id} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5">
                                      <img 
                                        src={getAgentPortrait(id)} 
                                        alt={agent?.name}
                                        className="w-5 h-5 rounded-full object-cover"
                                      />
                                      <span className="text-xs">{agent?.name}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </motion.div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-center py-12">
                            <Microscope className="w-16 h-16 text-white/10 mb-4" />
                            <p className="text-white/40">Upload a sample to begin analysis</p>
                            <p className="text-xs text-white/30 mt-1">Our AI will identify cellular patterns and provide recommendations</p>
                          </div>
                        )}
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="patterns" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {bloodPatterns.map((pattern, i) => (
                        <motion.div
                          key={pattern.name}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                        >
                          <Card className={`p-5 bg-gradient-to-br from-${pattern.color}-500/10 to-${pattern.color}-500/5 border-${pattern.color}-500/20`}>
                            <div className="flex items-start gap-4">
                              <div className={`w-12 h-12 rounded-xl bg-${pattern.color}-500/20 flex items-center justify-center`}>
                                <Microscope className={`w-6 h-6 text-${pattern.color}-400`} />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold">{pattern.name}</h4>
                                <p className="text-sm text-white/60 mt-1">{pattern.indicator}</p>
                                <Badge className={`mt-2 ${
                                  pattern.severity === 'normal' ? 'bg-cyan-500/20 text-cyan-300' :
                                  pattern.severity === 'mild' ? 'bg-yellow-500/20 text-yellow-300' :
                                  pattern.severity === 'moderate' ? 'bg-orange-500/20 text-orange-300' :
                                  'bg-red-500/20 text-red-300'
                                } border-0 text-xs`}>
                                  {pattern.severity === 'normal' ? 'Healthy' : pattern.severity.charAt(0).toUpperCase() + pattern.severity.slice(1) + ' Concern'}
                                </Badge>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="certification" className="space-y-6">
                    <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20 p-8 text-center">
                      <Award className="w-20 h-20 text-amber-400 mx-auto mb-6" />
                      <h3 className="text-2xl font-bold mb-2">Live Blood Analysis Certification</h3>
                      <p className="text-white/60 mb-6 max-w-lg mx-auto">
                        Complete all modules and pass the certification exam to become a certified Live Blood Analyst with FFPMA University
                      </p>
                      <div className="flex items-center justify-center gap-6 mb-8">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-amber-400">2/6</p>
                          <p className="text-sm text-white/40">Modules Complete</p>
                        </div>
                        <div className="w-px h-12 bg-white/10" />
                        <div className="text-center">
                          <p className="text-3xl font-bold text-white/40">0/1</p>
                          <p className="text-sm text-white/40">Exams Passed</p>
                        </div>
                      </div>
                      <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600" disabled>
                        <Award className="w-4 h-4 mr-2" />
                        Complete Course to Unlock Certification
                      </Button>
                    </Card>
                  </TabsContent>
                </Tabs>
              </motion.div>
            ) : (
              <motion.div
                key="main-content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center mb-12"
                >
                  <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 mb-4">
                    Welcome to Your Healing Journey
                  </Badge>
                  <h2 className="text-4xl font-bold mb-4 font-['Space_Grotesk']">
                    <span className="bg-gradient-to-r from-cyan-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
                      The All-In-One Healing Ecosystem
                    </span>
                  </h2>
                  <p className="text-lg text-white/60 max-w-2xl mx-auto">
                    {FFPMA_CREED.philosophy}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mb-12"
                >
                  <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/10 border-cyan-500/20 p-6 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
                      <img src="/generated/allio_healing_entity_visual.png" alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-6">
                        <Shield className="w-6 h-6 text-cyan-400" />
                        <h3 className="text-lg font-bold">Your Healing Journey</h3>
                        <Badge className="bg-cyan-500/20 text-cyan-300 border-0 ml-auto">Stage 2 of 5</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between mb-4">
                        {memberJourneyStages.map((stage, i) => (
                          <div key={stage.stage} className="flex items-center">
                            <div className={`flex flex-col items-center ${stage.active ? 'opacity-100' : 'opacity-40'}`}>
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                stage.active 
                                  ? 'bg-gradient-to-br from-cyan-500 to-cyan-500 shadow-lg shadow-cyan-500/30' 
                                  : 'bg-white/10 border border-white/20'
                              }`}>
                                {stage.active && i < 2 ? (
                                  <CheckCircle2 className="w-6 h-6 text-white" />
                                ) : (
                                  <stage.icon className={`w-5 h-5 ${stage.active ? 'text-white' : 'text-white/50'}`} />
                                )}
                              </div>
                              <span className="text-xs mt-2 font-medium">{stage.name}</span>
                              <span className="text-xs text-white/40">{stage.description}</span>
                            </div>
                            {i < memberJourneyStages.length - 1 && (
                              <div className={`w-16 h-0.5 mx-2 ${
                                stage.active && memberJourneyStages[i + 1]?.active 
                                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-500' 
                                  : 'bg-white/10'
                              }`} />
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-4 mt-6 pt-4 border-t border-white/10">
                        <div className="flex-1">
                          <p className="text-sm text-white/60">Current Focus: <span className="text-cyan-400 font-medium">Health Assessment Complete</span></p>
                          <Progress value={68} className="h-2 mt-2" />
                        </div>
                        <Button className="bg-cyan-500 hover:bg-cyan-600 shadow-lg shadow-cyan-500/20" data-testid="button-continue-journey">
                          Continue Journey
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="mb-12"
                >
                  <Card 
                    className="bg-gradient-to-r from-rose-500/20 via-violet-500/20 to-cyan-500/20 border-rose-500/30 p-6 cursor-pointer hover:shadow-lg hover:shadow-rose-500/10 transition-all"
                    onClick={() => setShowBloodAnalysis(true)}
                    data-testid="card-blood-analysis-promo"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500 to-violet-500 flex items-center justify-center shadow-lg shadow-rose-500/30">
                        <Microscope className="w-10 h-10 text-white" />
                      </div>
                      <div className="flex-1">
                        <Badge className="bg-rose-500/20 text-rose-300 border-0 mb-2">New Training Available</Badge>
                        <h3 className="text-xl font-bold">Live Blood Analysis Certification</h3>
                        <p className="text-white/60 mt-1">Master AI-powered microscopy with PROMETHEUS, VITALIS & HELIX</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-rose-400">6 Modules</p>
                        <p className="text-sm text-white/40">+ Certification Exam</p>
                      </div>
                      <ArrowRight className="w-6 h-6 text-white/40" />
                    </div>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mb-12"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">Healing Modalities</h3>
                    <Button variant="ghost" className="text-white/60 hover:text-white" data-testid="button-view-all-modalities">
                      View All
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {healingModalities.map((modality) => (
                      <motion.div
                        key={modality.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Card 
                          className={`bg-gradient-to-br ${modality.color} p-5 cursor-pointer transition-all hover:shadow-lg overflow-hidden relative`}
                          onClick={() => setSelectedModality(modality.id === selectedModality ? null : modality.id)}
                          data-testid={`card-modality-${modality.id}`}
                        >
                          {modality.image && (
                            <div className="absolute top-0 right-0 w-24 h-24 opacity-20">
                              <img src={modality.image} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex items-start gap-4 relative z-10">
                            <div className={`w-12 h-12 rounded-xl bg-black/20 flex items-center justify-center`}>
                              <modality.icon className={`w-6 h-6 ${modality.iconColor}`} />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold mb-1">{modality.name}</h4>
                              <p className="text-sm text-white/60">{modality.description}</p>
                            </div>
                          </div>

                          <AnimatePresence>
                            {selectedModality === modality.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 pt-4 border-t border-white/10 relative z-10"
                              >
                                <p className="text-xs text-white/40 mb-3">Available Protocols:</p>
                                <div className="space-y-2">
                                  {modality.protocols.map((protocol, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm">
                                      <Zap className="w-3 h-3 text-white/40" />
                                      <span>{protocol}</span>
                                    </div>
                                  ))}
                                </div>
                                <Button 
                                  className={`w-full mt-4 bg-gradient-to-r ${modality.gradientFrom} ${modality.gradientTo} hover:opacity-90`}
                                  data-testid={`button-explore-${modality.id}`}
                                >
                                  Explore {modality.name}
                                </Button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mb-12"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">Your Healing Guides</h3>
                    <Badge className="bg-cyan-500/20 text-cyan-300 border-0">
                      Science Division
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {scienceAgents.slice(0, 6).map((agent) => (
                      <Card 
                        key={agent.id}
                        className="bg-black/20 border-white/10 p-4 text-center hover:border-cyan-500/30 transition-colors cursor-pointer group overflow-hidden relative"
                        data-testid={`card-agent-${agent.id}`}
                      >
                        <div className="w-16 h-16 mx-auto rounded-full overflow-hidden mb-3 border-2 border-cyan-500/20 group-hover:border-cyan-500/50 transition-colors">
                          {getAgentPortrait(agent.id) ? (
                            <img 
                              src={getAgentPortrait(agent.id)} 
                              alt={agent.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-cyan-500/20 to-cyan-500/20 flex items-center justify-center">
                              <span className="text-2xl font-bold text-cyan-400">
                                {agent.name.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <h4 className="font-bold text-sm">{agent.name}</h4>
                        <p className="text-xs text-white/40 mt-1 line-clamp-2">{agent.specialty.split(',')[0]}</p>
                      </Card>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/20 p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden">
                        <img 
                          src={getAgentPortrait('oracle')} 
                          alt="ORACLE"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold mb-1">Need Guidance?</h3>
                        <p className="text-sm text-white/60">
                          ORACLE is ready to help you navigate your healing journey with personalized recommendations.
                        </p>
                      </div>
                      <Button className="bg-violet-500 hover:bg-violet-600 shadow-lg shadow-violet-500/20" data-testid="button-talk-to-oracle">
                        Talk to ORACLE
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-12 text-center"
                >
                  <p className="text-white/40 text-sm italic">"{FFPMA_CREED.motto}"</p>
                  <p className="text-white/30 text-xs mt-2">Forgotten Formula PMA • Curing Over Profits</p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
