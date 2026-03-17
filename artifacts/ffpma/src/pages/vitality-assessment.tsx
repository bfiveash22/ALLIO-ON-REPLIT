import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  ArrowRight,
  Activity,
  Dna,
  Beaker,
  Heart,
  Leaf,
  Brain,
  Zap,
  Sparkles,
  ChevronRight,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  FileText,
  ExternalLink,
  User,
  History,
  Plus,
  BarChart3,
  Shield,
} from "lucide-react";
import { Link } from "wouter";

interface SectionData {
  [key: string]: number;
}

interface AssessmentFormData {
  memberId: string;
  memberName: string;
  cellularHealth: SectionData;
  detox: SectionData;
  systemicHealth: SectionData;
  dietNutrition: SectionData;
  environmental: SectionData;
  stressEmotional: SectionData;
  physicalActivity: SectionData;
  notes: string;
}

interface Assessment {
  id: string;
  memberId: string;
  memberName: string | null;
  doctorId: string;
  status: string;
  overallScore: number | null;
  cellularHealthScore: number | null;
  detoxScore: number | null;
  systemicHealthScore: number | null;
  dietNutritionScore: number | null;
  environmentalScore: number | null;
  stressEmotionalScore: number | null;
  physicalActivityScore: number | null;
  recommendations: Recommendation[] | null;
  notes: string | null;
  createdAt: string;
}

interface Recommendation {
  category: string;
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  protocolLink?: string;
}

const SECTIONS = [
  {
    key: "cellularHealth",
    label: "Cellular Health Biomarkers",
    icon: Dna,
    color: "emerald",
    fields: [
      { key: "telomereLength", label: "Telomere Length", hint: "Rate the member's estimated telomere length status" },
      { key: "mitochondrialFunction", label: "Mitochondrial Function", hint: "Energy production capacity and cellular respiration" },
      { key: "oxidativeStress", label: "Oxidative Stress Level", hint: "Antioxidant capacity vs free radical burden (5 = low stress)" },
      { key: "cellMembraneIntegrity", label: "Cell Membrane Integrity", hint: "Lipid bilayer health and cellular communication" },
      { key: "dnaRepairCapacity", label: "DNA Repair Capacity", hint: "Ability to repair DNA damage and maintain genomic stability" },
    ],
  },
  {
    key: "detox",
    label: "Detoxification Biomarkers",
    icon: Beaker,
    color: "amber",
    fields: [
      { key: "liverFunction", label: "Liver Function", hint: "Phase I and Phase II detoxification pathway efficiency" },
      { key: "kidneyFunction", label: "Kidney Function", hint: "Renal filtration and waste elimination capacity" },
      { key: "lymphaticFlow", label: "Lymphatic Flow", hint: "Lymph drainage and immune cell transport" },
      { key: "glutathioneLevels", label: "Glutathione Levels", hint: "Master antioxidant status and cellular protection" },
      { key: "heavyMetalBurden", label: "Heavy Metal Burden", hint: "Accumulated toxic metal load (5 = low burden)" },
    ],
  },
  {
    key: "systemicHealth",
    label: "Systemic Health Biomarkers",
    icon: Heart,
    color: "rose",
    fields: [
      { key: "inflammationMarkers", label: "Inflammation Markers", hint: "CRP, ESR, and systemic inflammation indicators (5 = low inflammation)" },
      { key: "immuneFunction", label: "Immune Function", hint: "White blood cell balance and immune responsiveness" },
      { key: "hormonalBalance", label: "Hormonal Balance", hint: "Endocrine system equilibrium and hormone levels" },
      { key: "gutHealth", label: "Gut Health", hint: "Microbiome diversity, intestinal permeability, and digestion" },
      { key: "cardiovascularHealth", label: "Cardiovascular Health", hint: "Heart function, blood pressure, and vascular integrity" },
    ],
  },
  {
    key: "dietNutrition",
    label: "Diet & Nutrition",
    icon: Leaf,
    color: "green",
    fields: [
      { key: "wholeFood", label: "Whole Food Intake", hint: "Proportion of unprocessed, organic foods in diet" },
      { key: "hydration", label: "Hydration Status", hint: "Daily water intake quality and quantity" },
      { key: "micronutrients", label: "Micronutrient Sufficiency", hint: "Vitamin and mineral levels adequacy" },
      { key: "processedFoodAvoidance", label: "Processed Food Avoidance", hint: "Avoidance of refined sugars, seed oils, and additives" },
      { key: "mealTiming", label: "Meal Timing & Fasting", hint: "Adherence to circadian eating patterns and intermittent fasting" },
    ],
  },
  {
    key: "environmental",
    label: "Environmental Factors",
    icon: Shield,
    color: "cyan",
    fields: [
      { key: "airQuality", label: "Air Quality", hint: "Home and work air quality, filtration, and ventilation" },
      { key: "waterQuality", label: "Water Quality", hint: "Filtered water source, mineral content, and purity" },
      { key: "toxinExposure", label: "Toxin Exposure", hint: "Chemical exposure from products, cleaning agents, etc. (5 = low exposure)" },
      { key: "emfExposure", label: "EMF Exposure", hint: "Electromagnetic field exposure management (5 = low exposure)" },
      { key: "naturalLightExposure", label: "Natural Light Exposure", hint: "Sunlight exposure, circadian rhythm support" },
    ],
  },
  {
    key: "stressEmotional",
    label: "Stress & Emotional Health",
    icon: Brain,
    color: "violet",
    fields: [
      { key: "perceivedStress", label: "Stress Management", hint: "Ability to manage daily stressors effectively (5 = well managed)" },
      { key: "sleepQuality", label: "Sleep Quality", hint: "Duration, depth, and restorative quality of sleep" },
      { key: "emotionalResilience", label: "Emotional Resilience", hint: "Capacity to recover from emotional challenges" },
      { key: "socialConnections", label: "Social Connections", hint: "Quality and depth of social relationships" },
      { key: "mindfulnessPractice", label: "Mindfulness Practice", hint: "Regular meditation, breathwork, or mindfulness activities" },
    ],
  },
  {
    key: "physicalActivity",
    label: "Physical Activity",
    icon: Zap,
    color: "orange",
    fields: [
      { key: "aerobicExercise", label: "Aerobic Exercise", hint: "Regular cardiovascular activity (walking, running, swimming)" },
      { key: "strengthTraining", label: "Strength Training", hint: "Resistance exercises for muscle and bone health" },
      { key: "flexibility", label: "Flexibility & Mobility", hint: "Stretching, yoga, or mobility work" },
      { key: "dailyMovement", label: "Daily Movement", hint: "Non-exercise activity and avoidance of prolonged sitting" },
      { key: "recoveryPractices", label: "Recovery Practices", hint: "Rest days, sauna, cold exposure, grounding" },
    ],
  },
];

const emptyForm: AssessmentFormData = {
  memberId: "",
  memberName: "",
  cellularHealth: {},
  detox: {},
  systemicHealth: {},
  dietNutrition: {},
  environmental: {},
  stressEmotional: {},
  physicalActivity: {},
  notes: "",
};

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-cyan-400";
  if (score >= 40) return "text-amber-400";
  return "text-red-400";
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return "bg-emerald-500/20 border-emerald-500/30";
  if (score >= 60) return "bg-cyan-500/20 border-cyan-500/30";
  if (score >= 40) return "bg-amber-500/20 border-amber-500/30";
  return "bg-red-500/20 border-red-500/30";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Needs Improvement";
  return "Critical Attention";
}

function getPriorityColor(priority: string): string {
  if (priority === "high") return "bg-red-500/20 text-red-300";
  if (priority === "medium") return "bg-amber-500/20 text-amber-300";
  return "bg-emerald-500/20 text-emerald-300";
}

function RatingInput({ value, onChange, label, hint }: { value: number; onChange: (v: number) => void; label: string; hint: string }) {
  return (
    <div className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-white/40">{value > 0 ? `${value}/5` : "Not rated"}</span>
      </div>
      <p className="text-xs text-white/40 mb-2">{hint}</p>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(value === n ? 0 : n)}
            className={`flex-1 h-8 rounded-md text-xs font-medium transition-all ${
              n <= value
                ? n <= 2 ? "bg-red-500/40 text-red-200 border border-red-500/50"
                  : n <= 3 ? "bg-amber-500/40 text-amber-200 border border-amber-500/50"
                  : "bg-emerald-500/40 text-emerald-200 border border-emerald-500/50"
                : "bg-white/5 text-white/30 border border-white/10 hover:bg-white/10"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function VitalityAssessment() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [view, setView] = useState<"list" | "form" | "result" | "history">("list");
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<AssessmentFormData>({ ...emptyForm });
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [historyMemberId, setHistoryMemberId] = useState<string>("");
  const [historyMemberName, setHistoryMemberName] = useState<string>("");

  const { data: assessmentsData, isLoading: assessmentsLoading } = useQuery({
    queryKey: ["/api/vitality/assessments"],
    queryFn: async () => {
      const res = await fetch("/api/vitality/assessments", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch assessments");
      return res.json();
    },
  });

  const assessments: Assessment[] = assessmentsData?.assessments || [];

  const { data: historyData } = useQuery({
    queryKey: ["/api/vitality/member", historyMemberId, "history"],
    queryFn: async () => {
      const res = await fetch(`/api/vitality/member/${historyMemberId}/history`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch history");
      return res.json();
    },
    enabled: !!historyMemberId && view === "history",
  });

  const historyAssessments: Assessment[] = historyData?.assessments || [];

  const submitMutation = useMutation({
    mutationFn: async (data: AssessmentFormData) => {
      const res = await fetch("/api/vitality/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to submit assessment");
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Assessment Saved", description: "Vitality assessment has been recorded successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/vitality/assessments"] });
      setSelectedAssessment(data.assessment);
      setView("result");
      setCurrentStep(0);
      setFormData({ ...emptyForm });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save the assessment. Please try again.", variant: "destructive" });
    },
  });

  const updateField = (section: string, field: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...(prev as any)[section], [field]: value },
    }));
  };

  const handleSubmit = () => {
    if (!formData.memberId.trim()) {
      toast({ title: "Missing Info", description: "Please enter a Member ID.", variant: "destructive" });
      return;
    }
    submitMutation.mutate(formData);
  };

  const viewAssessment = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setView("result");
  };

  const viewHistory = (memberId: string, memberName: string) => {
    setHistoryMemberId(memberId);
    setHistoryMemberName(memberName);
    setView("history");
  };

  const startNewAssessment = () => {
    setFormData({ ...emptyForm });
    setCurrentStep(0);
    setView("form");
  };

  const totalSteps = SECTIONS.length + 1;
  const progressPercent = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950">
      <header className="sticky top-0 z-10 bg-black/30 backdrop-blur-lg border-b border-emerald-500/20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (view === "result" || view === "history") { setView("list"); }
                else if (view === "form" && currentStep > 0) { setCurrentStep(currentStep - 1); }
                else if (view === "form") { setView("list"); }
                else { setLocation("/doctors"); }
              }}
              className="p-2 rounded-lg hover:bg-emerald-500/20 transition-colors text-emerald-300"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Activity size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Vitality Assessment</h1>
                <p className="text-xs text-emerald-300">VITALIS Framework</p>
              </div>
            </div>
          </div>
          {view === "list" && (
            <Button
              onClick={startNewAssessment}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Plus size={16} className="mr-2" />
              New Assessment
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {view === "list" && (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {assessmentsLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                </div>
              ) : assessments.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mb-6 border border-emerald-500/30">
                    <Activity size={40} className="text-emerald-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-3">No Assessments Yet</h2>
                  <p className="text-emerald-200/60 max-w-md mx-auto mb-6">
                    Start your first vitality assessment to evaluate a member's biomarkers, lifestyle factors, and generate personalized improvement protocols.
                  </p>
                  <Button onClick={startNewAssessment} className="bg-emerald-600 hover:bg-emerald-500">
                    <Plus size={16} className="mr-2" />
                    Start First Assessment
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-emerald-400" />
                      Assessment Records
                    </h2>
                    <Badge className="bg-emerald-500/20 text-emerald-300">{assessments.length} total</Badge>
                  </div>
                  <div className="grid gap-4">
                    {assessments.map((a) => (
                      <Card
                        key={a.id}
                        className="bg-black/20 border-white/10 p-5 hover:bg-black/30 transition-colors cursor-pointer"
                        onClick={() => viewAssessment(a)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${getScoreBgColor(a.overallScore || 0)}`}>
                              <span className={`text-lg font-bold ${getScoreColor(a.overallScore || 0)}`}>{a.overallScore || 0}</span>
                            </div>
                            <div>
                              <h3 className="font-bold text-white">{a.memberName || a.memberId}</h3>
                              <div className="flex items-center gap-2 text-sm text-white/50">
                                <Clock size={14} />
                                {new Date(a.createdAt).toLocaleDateString()}
                                <Badge className={`ml-2 text-xs ${a.overallScore && a.overallScore >= 60 ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
                                  {getScoreLabel(a.overallScore || 0)}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10"
                              onClick={(e) => { e.stopPropagation(); viewHistory(a.memberId, a.memberName || a.memberId); }}
                            >
                              <History size={14} className="mr-1" />
                              History
                            </Button>
                            <ChevronRight size={20} className="text-white/30" />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {view === "form" && (
            <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-emerald-300">
                    Step {currentStep + 1} of {totalSteps}
                  </span>
                  <span className="text-sm text-white/50">{Math.round(progressPercent)}% complete</span>
                </div>
                <Progress value={progressPercent} className="h-2 bg-white/10" />
              </div>

              {currentStep === 0 && (
                <Card className="bg-black/20 border-white/10 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                      <User size={20} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Member Information</h2>
                      <p className="text-sm text-white/50">Identify the member for this assessment</p>
                    </div>
                  </div>
                  <div className="space-y-4 max-w-lg">
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1">Member ID *</label>
                      <Input
                        value={formData.memberId}
                        onChange={(e) => setFormData((p) => ({ ...p, memberId: e.target.value }))}
                        placeholder="Enter member ID or email"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1">Member Name</label>
                      <Input
                        value={formData.memberName}
                        onChange={(e) => setFormData((p) => ({ ...p, memberName: e.target.value }))}
                        placeholder="Full name (optional)"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1">Notes</label>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                        placeholder="Any relevant notes about this assessment..."
                        className="bg-white/5 border-white/10 text-white"
                        rows={3}
                      />
                    </div>
                  </div>
                </Card>
              )}

              {currentStep > 0 && currentStep <= SECTIONS.length && (() => {
                const section = SECTIONS[currentStep - 1];
                const SectionIcon = section.icon;
                const sectionData = (formData as any)[section.key] || {};
                return (
                  <Card className="bg-black/20 border-white/10 p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-${section.color}-500 to-${section.color}-600 flex items-center justify-center`}
                        style={{
                          background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                        }}
                      >
                        <SectionIcon size={20} className="text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white">{section.label}</h2>
                        <p className="text-sm text-white/50">Rate each biomarker from 1 (poor) to 5 (excellent)</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {section.fields.map((field) => (
                        <RatingInput
                          key={field.key}
                          value={sectionData[field.key] || 0}
                          onChange={(v) => updateField(section.key, field.key, v)}
                          label={field.label}
                          hint={field.hint}
                        />
                      ))}
                    </div>
                  </Card>
                );
              })()}

              <div className="flex items-center justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (currentStep > 0) setCurrentStep(currentStep - 1);
                    else setView("list");
                  }}
                  className="text-white border-white/20 hover:bg-white/10"
                >
                  <ArrowLeft size={16} className="mr-2" />
                  {currentStep === 0 ? "Cancel" : "Previous"}
                </Button>
                {currentStep < SECTIONS.length ? (
                  <Button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="bg-emerald-600 hover:bg-emerald-500"
                  >
                    Next
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={submitMutation.isPending}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
                  >
                    {submitMutation.isPending ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                    ) : (
                      <Sparkles size={16} className="mr-2" />
                    )}
                    Generate Assessment
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {view === "result" && selectedAssessment && (
            <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="text-center mb-8">
                <div className={`w-24 h-24 mx-auto rounded-2xl flex items-center justify-center mb-4 border ${getScoreBgColor(selectedAssessment.overallScore || 0)}`}>
                  <span className={`text-3xl font-bold ${getScoreColor(selectedAssessment.overallScore || 0)}`}>
                    {selectedAssessment.overallScore || 0}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  {selectedAssessment.memberName || selectedAssessment.memberId}
                </h2>
                <p className={`text-lg font-medium ${getScoreColor(selectedAssessment.overallScore || 0)}`}>
                  {getScoreLabel(selectedAssessment.overallScore || 0)}
                </p>
                <p className="text-sm text-white/50 mt-1">
                  Assessed on {new Date(selectedAssessment.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {[
                  { label: "Cellular", score: selectedAssessment.cellularHealthScore, icon: Dna },
                  { label: "Detox", score: selectedAssessment.detoxScore, icon: Beaker },
                  { label: "Systemic", score: selectedAssessment.systemicHealthScore, icon: Heart },
                  { label: "Diet", score: selectedAssessment.dietNutritionScore, icon: Leaf },
                  { label: "Environment", score: selectedAssessment.environmentalScore, icon: Shield },
                  { label: "Stress", score: selectedAssessment.stressEmotionalScore, icon: Brain },
                  { label: "Activity", score: selectedAssessment.physicalActivityScore, icon: Zap },
                ].map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <Card key={item.label} className={`p-3 border text-center ${getScoreBgColor(item.score || 0)}`}>
                      <ItemIcon size={18} className={`mx-auto mb-1 ${getScoreColor(item.score || 0)}`} />
                      <p className={`text-xl font-bold ${getScoreColor(item.score || 0)}`}>{item.score || 0}</p>
                      <p className="text-xs text-white/50">{item.label}</p>
                    </Card>
                  );
                })}
              </div>

              {selectedAssessment.recommendations && (selectedAssessment.recommendations as Recommendation[]).length > 0 && (
                <Card className="bg-black/20 border-white/10 p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    Improvement Recommendations
                  </h3>
                  <div className="space-y-4">
                    {(selectedAssessment.recommendations as Recommendation[]).map((rec, i) => (
                      <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {rec.priority === "high" ? <AlertTriangle size={16} className="text-red-400" /> :
                             rec.priority === "medium" ? <TrendingUp size={16} className="text-amber-400" /> :
                             <CheckCircle2 size={16} className="text-emerald-400" />}
                            <h4 className="font-bold text-white">{rec.title}</h4>
                          </div>
                          <Badge className={getPriorityColor(rec.priority)}>{rec.priority}</Badge>
                        </div>
                        <p className="text-sm text-white/60 mb-2">{rec.description}</p>
                        <div className="flex items-center gap-3">
                          <Badge className="bg-white/5 text-white/50 text-xs">{rec.category}</Badge>
                          {rec.protocolLink && (
                            <Link href={rec.protocolLink}>
                              <span className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 cursor-pointer">
                                <ExternalLink size={12} />
                                View Protocol
                              </span>
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {selectedAssessment.notes && (
                <Card className="bg-black/20 border-white/10 p-6">
                  <h3 className="font-bold text-white mb-2">Notes</h3>
                  <p className="text-sm text-white/60">{selectedAssessment.notes}</p>
                </Card>
              )}

              <div className="flex items-center gap-3 justify-center">
                <Button
                  variant="outline"
                  className="text-white border-white/20 hover:bg-white/10"
                  onClick={() => setView("list")}
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Back to List
                </Button>
                <Button
                  variant="outline"
                  className="text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10"
                  onClick={() => viewHistory(selectedAssessment.memberId, selectedAssessment.memberName || selectedAssessment.memberId)}
                >
                  <History size={16} className="mr-2" />
                  View History
                </Button>
                <Button onClick={startNewAssessment} className="bg-emerald-600 hover:bg-emerald-500">
                  <Plus size={16} className="mr-2" />
                  New Assessment
                </Button>
              </div>
            </motion.div>
          )}

          {view === "history" && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-cyan-400" />
                    Assessment History
                  </h2>
                  <p className="text-sm text-white/50 mt-1">{historyMemberName}</p>
                </div>
                <Badge className="bg-cyan-500/20 text-cyan-300">{historyAssessments.length} assessments</Badge>
              </div>

              {historyAssessments.length === 0 ? (
                <Card className="bg-black/20 border-white/10 p-8 text-center">
                  <p className="text-white/50">No assessment history found for this member.</p>
                </Card>
              ) : (
                <>
                  {historyAssessments.length >= 2 && (
                    <Card className="bg-black/20 border-white/10 p-6">
                      <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                        Score Trend
                      </h3>
                      <div className="flex items-end gap-2 h-32">
                        {historyAssessments.slice().reverse().map((a, i) => {
                          const score = a.overallScore || 0;
                          return (
                            <div key={a.id} className="flex-1 flex flex-col items-center gap-1">
                              <span className={`text-xs font-bold ${getScoreColor(score)}`}>{score}</span>
                              <div
                                className={`w-full rounded-t-md transition-all ${score >= 60 ? "bg-emerald-500/50" : score >= 40 ? "bg-amber-500/50" : "bg-red-500/50"}`}
                                style={{ height: `${Math.max(score, 5)}%` }}
                              />
                              <span className="text-[10px] text-white/30">{new Date(a.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  )}

                  <div className="space-y-3">
                    {historyAssessments.map((a) => (
                      <Card
                        key={a.id}
                        className="bg-black/20 border-white/10 p-4 hover:bg-black/30 transition-colors cursor-pointer"
                        onClick={() => viewAssessment(a)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${getScoreBgColor(a.overallScore || 0)}`}>
                              <span className={`font-bold ${getScoreColor(a.overallScore || 0)}`}>{a.overallScore || 0}</span>
                            </div>
                            <div>
                              <p className="text-sm text-white/50 flex items-center gap-1">
                                <Clock size={12} />
                                {new Date(a.createdAt).toLocaleDateString()} at {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <Badge className={`text-xs mt-1 ${a.overallScore && a.overallScore >= 60 ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
                                {getScoreLabel(a.overallScore || 0)}
                              </Badge>
                            </div>
                          </div>
                          <ChevronRight size={18} className="text-white/30" />
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
