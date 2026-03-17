import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Sparkles,
  Loader2,
  ExternalLink,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  Presentation,
  Search,
  AlertCircle,
  CheckCircle2,
  Dna,
  Activity,
  Shield,
  Pill,
  Droplets,
  Syringe,
  Leaf,
  Moon,
  Sun,
  Sunset,
  Calendar,
  ClipboardList,
} from "lucide-react";

interface GeneratedProtocolSummary {
  id: number;
  patientName: string;
  patientAge: number | null;
  sourceType: string;
  status: string;
  slidesWebViewLink: string | null;
  generatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface IntakeFormSummary {
  id: number;
  patientName: string;
  patientEmail: string;
  status: string;
  createdAt: string;
  submittedAt: string | null;
}

interface RootCause {
  rank: number;
  cause: string;
  category: string;
  details: string;
  relatedSymptoms: string[];
}

interface Phase {
  phaseNumber: number;
  name: string;
  weekRange: string;
  focus: string;
  keyActions: string[];
}

interface ScheduleItem {
  time?: string;
  item: string;
  details?: string;
  frequency?: string;
}

interface InjectablePeptide {
  name: string;
  vialSize: string;
  reconstitution: string;
  dose: string;
  frequency: string;
  duration: string;
  route: string;
  purpose: string;
}

interface Supplement {
  name: string;
  dose: string;
  timing: string;
  purpose: string;
}

interface DetoxProtocol {
  name: string;
  method: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface ParasiteProtocol {
  name: string;
  dose: string;
  schedule: string;
  duration: string;
  purpose: string;
}

interface LifestyleRec {
  category: string;
  recommendation: string;
  details?: string;
}

interface FollowUp {
  weekNumber: number;
  action: string;
  details?: string;
}

interface ProtocolData {
  patientName: string;
  patientAge: number;
  generatedDate: string;
  protocolDurationDays: number;
  summary: string;
  rootCauseAnalysis: RootCause[];
  phases: Phase[];
  dailySchedule: Record<string, ScheduleItem[]>;
  injectablePeptides: InjectablePeptide[];
  supplements: Supplement[];
  detoxProtocols: DetoxProtocol[];
  parasiteAntiviralProtocols: ParasiteProtocol[];
  lifestyleRecommendations: LifestyleRec[];
  dietaryGuidelines: string[];
  followUpPlan: FollowUp[];
  labsRequired: string[];
}

interface PatientProfileData {
  gender?: string;
  location?: string;
  chiefComplaints: string[];
  currentDiagnoses: string[];
  goals: string[];
  medicalTimeline: Array<{
    ageRange: string;
    year?: string;
    event: string;
    significance: string;
  }>;
}

interface MemberSummary {
  id: string;
  fullName: string;
  email: string;
}

interface FullProtocolRecord {
  id: number;
  patientName: string;
  patientAge: number | null;
  sourceType: string;
  status: string;
  patientProfile: PatientProfileData;
  protocol: ProtocolData;
  slidesPresentationId: string | null;
  slidesWebViewLink: string | null;
  generatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ProtocolAssemblyPage() {
  const queryClient = useQueryClient();
  const [transcript, setTranscript] = useState("");
  const [generateSlides, setGenerateSlides] = useState(true);
  const [selectedProtocolId, setSelectedProtocolId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"generate" | "library">("generate");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [sourceMode, setSourceMode] = useState<"transcript" | "intake">("transcript");
  const [selectedIntakeId, setSelectedIntakeId] = useState<number | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");

  const { data: protocols = [], isLoading: loadingProtocols } = useQuery<GeneratedProtocolSummary[]>({
    queryKey: ["/api/protocol-assembly/protocols"],
  });

  const { data: intakeForms = [] } = useQuery<IntakeFormSummary[]>({
    queryKey: ["/api/protocol-assembly/intake-forms"],
  });

  const { data: members = [] } = useQuery<MemberSummary[]>({
    queryKey: ["/api/doctor/members"],
  });

  const { data: selectedProtocol, isLoading: loadingDetail } = useQuery<FullProtocolRecord>({
    queryKey: ["/api/protocol-assembly/protocols", selectedProtocolId?.toString()],
    enabled: !!selectedProtocolId,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/protocol-assembly/generate", {
        transcript,
        generateSlides,
        memberId: selectedMemberId || undefined,
      });
      return res.json();
    },
    onSuccess: (data: { id: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/protocol-assembly/protocols"] });
      setSelectedProtocolId(data.id);
      setActiveTab("library");
      setTranscript("");
      setSelectedMemberId("");
    },
  });

  const generateFromIntakeMutation = useMutation({
    mutationFn: async (intakeId: number) => {
      const res = await apiRequest("POST", `/api/protocol-assembly/generate-from-intake/${intakeId}`, {
        generateSlides,
        memberId: selectedMemberId || undefined,
      });
      return res.json();
    },
    onSuccess: (data: { id: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/protocol-assembly/protocols"] });
      setSelectedProtocolId(data.id);
      setActiveTab("library");
      setSelectedIntakeId(null);
      setSelectedMemberId("");
    },
  });

  const slidesMutation = useMutation({
    mutationFn: async (protocolId: number) => {
      const res = await apiRequest("POST", `/api/protocol-assembly/protocols/${protocolId}/slides`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/protocol-assembly/protocols"] });
      if (selectedProtocolId) {
        queryClient.invalidateQueries({
          queryKey: ["/api/protocol-assembly/protocols", selectedProtocolId.toString()],
        });
      }
    },
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const filteredProtocols = protocols.filter((p) =>
    p.patientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const proto = selectedProtocol?.protocol;
  const profile = selectedProtocol?.patientProfile;

  const isGenerating = generateMutation.isPending || generateFromIntakeMutation.isPending;
  const generateError = generateMutation.error || generateFromIntakeMutation.error;
  const isGenerateError = generateMutation.isError || generateFromIntakeMutation.isError;
  const isGenerateSuccess = generateMutation.isSuccess || generateFromIntakeMutation.isSuccess;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30">
            <Dna className="w-7 h-7 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Protocol Assembly System
            </h1>
            <p className="text-slate-400 text-sm">
              AI-powered healing protocol generation from transcripts and intake forms
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("generate")}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
              activeTab === "generate"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-500/25"
                : "bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50"
            }`}
          >
            <Sparkles className="w-4 h-4 inline mr-2" />
            Generate Protocol
          </button>
          <button
            onClick={() => setActiveTab("library")}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
              activeTab === "library"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-500/25"
                : "bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50"
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Protocol Library
            {protocols.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-purple-500/30 rounded-full">
                {protocols.length}
              </span>
            )}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "generate" && (
            <motion.div
              key="generate"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-slate-900/70 border border-slate-700/50 rounded-2xl p-6">
                <div className="flex gap-3 mb-5">
                  <button
                    onClick={() => setSourceMode("transcript")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      sourceMode === "transcript"
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                        : "bg-slate-800/50 text-slate-400 border border-slate-700/30 hover:text-white"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    From Transcript
                  </button>
                  <button
                    onClick={() => setSourceMode("intake")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      sourceMode === "intake"
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                        : "bg-slate-800/50 text-slate-400 border border-slate-700/30 hover:text-white"
                    }`}
                  >
                    <ClipboardList className="w-4 h-4" />
                    From Intake Form
                  </button>
                </div>

                {sourceMode === "transcript" && (
                  <>
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-400" />
                      Paste Call Transcript
                    </h2>
                    <textarea
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                      placeholder="Paste the full member call transcript here. The AI will extract the member profile, identify root causes, and generate a complete 90-day healing protocol..."
                      className="w-full h-64 bg-slate-800/50 border border-slate-600/50 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 resize-none font-mono text-sm"
                    />
                  </>
                )}

                {sourceMode === "intake" && (
                  <>
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-purple-400" />
                      Select Intake Form
                    </h2>
                    {intakeForms.length === 0 ? (
                      <div className="text-center py-12 text-slate-500">
                        <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No intake forms found</p>
                        <p className="text-xs mt-1">Submit intake forms first to generate protocols from them</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                        {intakeForms.map((form) => (
                          <button
                            key={form.id}
                            onClick={() => setSelectedIntakeId(form.id)}
                            className={`w-full text-left p-4 rounded-xl border transition-all ${
                              selectedIntakeId === form.id
                                ? "bg-purple-500/15 border-purple-500/40"
                                : "bg-slate-800/30 border-slate-700/30 hover:bg-slate-800/60"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-white">{form.patientName}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                form.status === "submitted"
                                  ? "bg-green-500/20 text-green-400"
                                  : form.status === "reviewed"
                                  ? "bg-blue-500/20 text-blue-400"
                                  : "bg-yellow-500/20 text-yellow-400"
                              }`}>
                                {form.status}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                              <span>{form.patientEmail}</span>
                              <span>•</span>
                              <Clock className="w-3 h-3" />
                              <span>{new Date(form.createdAt).toLocaleDateString()}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}

                <div className="mt-4 mb-3">
                  <label className="text-sm text-slate-300 mb-1.5 block flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    Link to Member (optional)
                  </label>
                  <select
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className="w-full max-w-sm bg-slate-800/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  >
                    <option value="">No member linked</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={generateSlides}
                      onChange={(e) => setGenerateSlides(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500/50"
                    />
                    <Presentation className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300">
                      Auto-generate Google Slides presentation
                    </span>
                  </label>
                  <div className="flex items-center gap-3">
                    {sourceMode === "transcript" && (
                      <span className="text-xs text-slate-500">
                        {transcript.length.toLocaleString()} characters
                      </span>
                    )}
                    <button
                      onClick={() => {
                        if (sourceMode === "transcript") {
                          generateMutation.mutate();
                        } else if (selectedIntakeId) {
                          generateFromIntakeMutation.mutate(selectedIntakeId);
                        }
                      }}
                      disabled={
                        isGenerating ||
                        (sourceMode === "transcript" && !transcript.trim()) ||
                        (sourceMode === "intake" && !selectedIntakeId)
                      }
                      className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-purple-500/25 disabled:shadow-none flex items-center gap-2"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generate Protocol
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {isGenerating && (
                  <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                      <div>
                        <p className="text-sm text-purple-300 font-medium">
                          Protocol Assembly in progress...
                        </p>
                        <p className="text-xs text-purple-400/70 mt-1">
                          {sourceMode === "transcript"
                            ? "Analyzing transcript → Extracting member profile → Generating protocol → Building slides"
                            : "Reading intake form → Building member profile → Generating protocol → Building slides"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {isGenerateError && (
                  <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-red-300 font-medium">Generation Failed</p>
                      <p className="text-xs text-red-400/70 mt-1">
                        {(generateError as Error)?.message || "An error occurred during protocol generation"}
                      </p>
                    </div>
                  </div>
                )}

                {isGenerateSuccess && (
                  <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-green-300 font-medium">
                        Protocol Generated Successfully
                      </p>
                      <p className="text-xs text-green-400/70 mt-1">
                        Switched to Protocol Library to view the result.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "library" && (
            <motion.div
              key="library"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex gap-6"
            >
              <div className="w-80 shrink-0 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search protocols..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>

                <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                  {loadingProtocols && (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                    </div>
                  )}
                  {!loadingProtocols && filteredProtocols.length === 0 && (
                    <div className="text-center py-8 text-slate-500 text-sm">
                      No protocols generated yet
                    </div>
                  )}
                  {filteredProtocols.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProtocolId(p.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        selectedProtocolId === p.id
                          ? "bg-purple-500/15 border-purple-500/40"
                          : "bg-slate-800/30 border-slate-700/30 hover:bg-slate-800/60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm text-white truncate">
                          {p.patientName}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          p.status === "draft"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : p.status === "active"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-slate-500/20 text-slate-400"
                        }`}>
                          {p.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        {new Date(p.createdAt).toLocaleDateString()}
                        <span className="capitalize">{p.sourceType.replace("_", " ")}</span>
                      </div>
                      {p.slidesWebViewLink && (
                        <div className="mt-1 text-[10px] text-purple-400 flex items-center gap-1">
                          <Presentation className="w-3 h-3" />
                          Slides available
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                {!selectedProtocolId && (
                  <div className="flex flex-col items-center justify-center h-96 text-slate-500">
                    <FileText className="w-12 h-12 mb-3 opacity-30" />
                    <p className="text-sm">Select a protocol to view details</p>
                  </div>
                )}

                {selectedProtocolId && loadingDetail && (
                  <div className="flex justify-center py-20">
                    <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                  </div>
                )}

                {selectedProtocol && proto && (
                  <div className="space-y-4">
                    <div className="bg-slate-900/70 border border-slate-700/50 rounded-2xl p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <User className="w-5 h-5 text-purple-400" />
                            {proto.patientName}
                          </h2>
                          <p className="text-sm text-slate-400 mt-1">
                            Age {proto.patientAge} | {proto.protocolDurationDays || 90} Day Protocol | {proto.generatedDate}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {!selectedProtocol.slidesWebViewLink ? (
                            <button
                              onClick={() => slidesMutation.mutate(selectedProtocol.id)}
                              disabled={slidesMutation.isPending}
                              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 text-white text-sm rounded-lg flex items-center gap-2 transition-all"
                            >
                              {slidesMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Presentation className="w-4 h-4" />
                              )}
                              Generate Slides
                            </button>
                          ) : (
                            <a
                              href={selectedProtocol.slidesWebViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg flex items-center gap-2 transition-all"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Open Slides
                            </a>
                          )}
                        </div>
                      </div>
                      {proto.summary && (
                        <p className="mt-3 text-sm text-slate-300 bg-slate-800/50 rounded-lg p-3">
                          {proto.summary}
                        </p>
                      )}
                    </div>

                    <CollapsibleSection
                      title="Root Cause Analysis"
                      icon={<Shield className="w-4 h-4 text-red-400" />}
                      expanded={expandedSections["rootCause"]}
                      onToggle={() => toggleSection("rootCause")}
                    >
                      {proto.rootCauseAnalysis?.map((rc: RootCause, i: number) => (
                        <div key={i} className="p-3 bg-slate-800/40 rounded-lg mb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 text-xs flex items-center justify-center font-bold">
                              {rc.rank}
                            </span>
                            <span className="font-medium text-white text-sm">{rc.cause}</span>
                            <span className="text-[10px] px-1.5 py-0.5 bg-red-500/15 text-red-400 rounded-full">
                              {rc.category}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 ml-8">{rc.details}</p>
                          {rc.relatedSymptoms?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2 ml-8">
                              {rc.relatedSymptoms.map((s: string, j: number) => (
                                <span key={j} className="text-[10px] px-1.5 py-0.5 bg-slate-700/50 text-slate-400 rounded-full">
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </CollapsibleSection>

                    <CollapsibleSection
                      title="Wellness Phases"
                      icon={<Calendar className="w-4 h-4 text-blue-400" />}
                      expanded={expandedSections["phases"]}
                      onToggle={() => toggleSection("phases")}
                    >
                      {proto.phases?.map((p: Phase, i: number) => (
                        <div key={i} className="p-3 bg-slate-800/40 rounded-lg mb-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-white text-sm">
                              Phase {p.phaseNumber}: {p.name}
                            </span>
                            <span className="text-xs text-purple-400">{p.weekRange}</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{p.focus}</p>
                          <ul className="mt-2 space-y-1">
                            {p.keyActions?.map((a: string, j: number) => (
                              <li key={j} className="text-xs text-slate-300 flex items-start gap-1">
                                <span className="text-purple-400 mt-0.5">•</span> {a}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </CollapsibleSection>

                    <CollapsibleSection
                      title="Daily Schedule"
                      icon={<Activity className="w-4 h-4 text-green-400" />}
                      expanded={expandedSections["schedule"]}
                      onToggle={() => toggleSection("schedule")}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {proto.dailySchedule && Object.entries(proto.dailySchedule).map(([period, items]) => (
                          <div key={period} className="p-3 bg-slate-800/40 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              {period === "morning" && <Sun className="w-4 h-4 text-yellow-400" />}
                              {period === "midday" && <Sunset className="w-4 h-4 text-orange-400" />}
                              {period === "evening" && <Sunset className="w-4 h-4 text-pink-400" />}
                              {period === "bedtime" && <Moon className="w-4 h-4 text-blue-400" />}
                              <span className="font-medium text-white text-sm capitalize">{period}</span>
                            </div>
                            {(items as ScheduleItem[])?.map((item: ScheduleItem, j: number) => (
                              <div key={j} className="text-xs text-slate-300 mb-1 flex items-start gap-1">
                                <span className="text-green-400 mt-0.5 shrink-0">▸</span>
                                <span>
                                  <span className="font-medium">{item.item}</span>
                                  {item.details && <span className="text-slate-500"> — {item.details}</span>}
                                </span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </CollapsibleSection>

                    <CollapsibleSection
                      title="Injectable Peptides"
                      icon={<Syringe className="w-4 h-4 text-cyan-400" />}
                      expanded={expandedSections["peptides"]}
                      onToggle={() => toggleSection("peptides")}
                    >
                      <div className="space-y-2">
                        {proto.injectablePeptides?.map((p: InjectablePeptide, i: number) => (
                          <div key={i} className="p-3 bg-slate-800/40 rounded-lg">
                            <div className="font-medium text-white text-sm">{p.name}</div>
                            <div className="grid grid-cols-2 gap-x-4 mt-1 text-xs text-slate-400">
                              <div>Vial: {p.vialSize}</div>
                              <div>Recon: {p.reconstitution}</div>
                              <div>Dose: {p.dose}</div>
                              <div>Route: {p.route}</div>
                              <div>Frequency: {p.frequency}</div>
                              <div>Duration: {p.duration}</div>
                            </div>
                            <p className="text-xs text-purple-400 mt-1">Purpose: {p.purpose}</p>
                          </div>
                        ))}
                      </div>
                    </CollapsibleSection>

                    <CollapsibleSection
                      title="Supplements"
                      icon={<Pill className="w-4 h-4 text-emerald-400" />}
                      expanded={expandedSections["supplements"]}
                      onToggle={() => toggleSection("supplements")}
                    >
                      <div className="space-y-1">
                        {proto.supplements?.map((s: Supplement, i: number) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-slate-800/40 rounded-lg text-xs">
                            <span className="font-medium text-white">{s.name}</span>
                            <span className="text-slate-400">{s.dose} | {s.timing}</span>
                            <span className="text-emerald-400 text-[10px]">{s.purpose}</span>
                          </div>
                        ))}
                      </div>
                    </CollapsibleSection>

                    <CollapsibleSection
                      title="Detox Protocols"
                      icon={<Droplets className="w-4 h-4 text-teal-400" />}
                      expanded={expandedSections["detox"]}
                      onToggle={() => toggleSection("detox")}
                    >
                      <div className="space-y-2">
                        {proto.detoxProtocols?.map((d: DetoxProtocol, i: number) => (
                          <div key={i} className="p-3 bg-slate-800/40 rounded-lg">
                            <div className="font-medium text-white text-sm">{d.name}</div>
                            <div className="text-xs text-slate-400 mt-1">
                              Method: {d.method} | Frequency: {d.frequency} | Duration: {d.duration}
                            </div>
                            <p className="text-xs text-teal-400/70 mt-1">{d.instructions}</p>
                          </div>
                        ))}
                      </div>
                    </CollapsibleSection>

                    <CollapsibleSection
                      title="Lifestyle & Diet"
                      icon={<Leaf className="w-4 h-4 text-lime-400" />}
                      expanded={expandedSections["lifestyle"]}
                      onToggle={() => toggleSection("lifestyle")}
                    >
                      <div className="space-y-2">
                        {proto.lifestyleRecommendations?.map((l: LifestyleRec, i: number) => (
                          <div key={i} className="text-xs text-slate-300 flex items-start gap-1">
                            <span className="text-lime-400 mt-0.5">•</span>
                            <span>
                              <span className="font-medium text-white">{l.category}:</span> {l.recommendation}
                            </span>
                          </div>
                        ))}
                        {proto.dietaryGuidelines?.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-700/50">
                            <p className="text-xs font-medium text-white mb-2">Dietary Guidelines</p>
                            {proto.dietaryGuidelines.map((d: string, i: number) => (
                              <p key={i} className="text-xs text-slate-400 mb-1">• {d}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    </CollapsibleSection>

                    <CollapsibleSection
                      title="Follow-Up Plan & Labs"
                      icon={<Calendar className="w-4 h-4 text-amber-400" />}
                      expanded={expandedSections["followup"]}
                      onToggle={() => toggleSection("followup")}
                    >
                      <div className="space-y-1">
                        {proto.followUpPlan?.map((f: FollowUp, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-xs p-2 bg-slate-800/40 rounded-lg">
                            <span className="font-medium text-amber-400 w-16 shrink-0">Week {f.weekNumber}</span>
                            <span className="text-white">{f.action}</span>
                          </div>
                        ))}
                        {proto.labsRequired?.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-700/50">
                            <p className="text-xs font-medium text-white mb-2">Required Labs</p>
                            {proto.labsRequired.map((l: string, i: number) => (
                              <p key={i} className="text-xs text-slate-400 mb-1">• {l}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    </CollapsibleSection>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function CollapsibleSection({
  title,
  icon,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  expanded?: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-900/70 border border-slate-700/50 rounded-2xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-white text-sm">{title}</span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-500" />
        )}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
