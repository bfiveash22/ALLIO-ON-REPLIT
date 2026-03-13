import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { 
  Search, 
  Filter, 
  Microscope, 
  Bug, 
  Dna, 
  Droplet, 
  AlertTriangle,
  Sparkles,
  ChevronRight,
  X,
  Eye,
  BookOpen,
  Brain,
  Loader2,
  Zap,
  Send,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import type { BloodSample } from "@shared/schema";

interface BloodAnalysisResponse {
  analysis: string;
  potentialConditions: string[];
  recommendedTests: string[];
  clinicalNotes: string;
  confidence: 'high' | 'moderate' | 'low';
  modelUsed: string;
}

interface AIStatusResponse {
  available: boolean;
  primaryModel: boolean;
  fallbackModel: boolean;
  message: string;
}

type BloodSampleWithTags = BloodSample & { tags?: string[] };

const organismTypeIcons: Record<string, React.ReactNode> = {
  virus: <Bug className="w-4 h-4" />,
  bacteria: <Dna className="w-4 h-4" />,
  parasite: <AlertTriangle className="w-4 h-4" />,
  fungus: <Sparkles className="w-4 h-4" />,
  cell_abnormality: <Droplet className="w-4 h-4" />,
  blood_cell_morphology: <Microscope className="w-4 h-4" />,
  artifact: <Eye className="w-4 h-4" />,
  crystal: <Sparkles className="w-4 h-4" />,
  protein_pattern: <Dna className="w-4 h-4" />
};

const organismTypeColors: Record<string, string> = {
  virus: "bg-red-500/10 text-red-400 border-red-500/30",
  bacteria: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  parasite: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  fungus: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  cell_abnormality: "bg-pink-500/10 text-pink-400 border-pink-500/30",
  blood_cell_morphology: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  artifact: "bg-gray-500/10 text-gray-400 border-gray-500/30",
  crystal: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  protein_pattern: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
};

const categoryLabels: Record<string, string> = {
  pathogen: "Pathogens",
  morphology: "Cell Morphology",
  nutritional_marker: "Nutritional Markers",
  toxicity_indicator: "Toxicity Indicators",
  immune_response: "Immune Response",
  oxidative_stress: "Oxidative Stress",
  coagulation: "Coagulation",
  reference_normal: "Reference/Normal"
};

const organismTypeLabels: Record<string, string> = {
  virus: "Viruses",
  bacteria: "Bacteria",
  parasite: "Parasites",
  fungus: "Fungi",
  cell_abnormality: "Cell Abnormalities",
  blood_cell_morphology: "Blood Cell Morphology",
  artifact: "Artifacts",
  crystal: "Crystals",
  protein_pattern: "Protein Patterns"
};

export default function BloodSampleLibrary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedSample, setSelectedSample] = useState<BloodSampleWithTags | null>(null);
  const [showTagFilter, setShowTagFilter] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [analysisFindings, setAnalysisFindings] = useState("");
  const [patientContext, setPatientContext] = useState("");
  const [analysisResult, setAnalysisResult] = useState<BloodAnalysisResponse | null>(null);

  const { data: samples = [], isLoading } = useQuery<BloodSample[]>({
    queryKey: ["/api/blood-samples", selectedType, selectedCategory, searchTerm, selectedTags],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedType) params.set("organismType", selectedType);
      if (selectedCategory) params.set("category", selectedCategory);
      if (searchTerm) params.set("search", searchTerm);
      if (selectedTags.length > 0) params.set("tags", selectedTags.join(','));
      const res = await fetch(`/api/blood-samples?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch samples");
      return res.json();
    }
  });

  const { data: allTags = [] } = useQuery<string[]>({
    queryKey: ["/api/blood-samples/tags"],
    queryFn: async () => {
      const res = await fetch("/api/blood-samples/tags");
      if (!res.ok) throw new Error("Failed to fetch tags");
      return res.json();
    }
  });

  const fetchSampleDetails = async (id: string) => {
    const res = await fetch(`/api/blood-samples/${id}`);
    if (!res.ok) throw new Error("Failed to fetch sample");
    const sample = await res.json();
    setSelectedSample(sample);
  };

  const { data: aiStatus } = useQuery<AIStatusResponse>({
    queryKey: ["/api/blood-analysis/status"],
    queryFn: async () => {
      const res = await fetch("/api/blood-analysis/status");
      if (!res.ok) return { available: false, primaryModel: false, fallbackModel: false, message: "Service unavailable" };
      return res.json();
    },
    staleTime: 60000
  });

  const analysisMutation = useMutation({
    mutationFn: async (data: { observedFindings: string[]; patientContext?: string }) => {
      const res = await fetch("/api/blood-analysis/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Analysis failed");
      }
      return res.json() as Promise<BloodAnalysisResponse>;
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
    }
  });

  const handleRunAnalysis = () => {
    if (!analysisFindings.trim()) return;
    const findings = analysisFindings.split('\n').filter(f => f.trim());
    analysisMutation.mutate({
      observedFindings: findings,
      patientContext: patientContext.trim() || undefined
    });
  };

  const filteredSamples = samples;
  const featuredSamples = samples.filter(s => s.isFeatured);

  const groupedByType = samples.reduce((acc, sample) => {
    const type = sample.organismType;
    if (!acc[type]) acc[type] = [];
    acc[type].push(sample);
    return acc;
  }, {} as Record<string, BloodSample[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
              <Microscope className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Blood Microscopy Sample Library</h1>
              <p className="text-slate-400">Comprehensive reference database for blood analysis AI</p>
            </div>
          </div>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              data-testid="input-sample-search"
              placeholder="Search samples by name, organism, or condition..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Button
              data-testid="button-filter-all"
              variant={selectedType === null ? "default" : "outline"}
              onClick={() => setSelectedType(null)}
              className={selectedType === null ? "bg-cyan-600 hover:bg-cyan-700" : "border-slate-600 text-slate-300"}
            >
              All Types
            </Button>
            {Object.entries(organismTypeLabels).slice(0, 5).map(([key, label]) => (
              <Button
                key={key}
                data-testid={`button-filter-${key}`}
                variant={selectedType === key ? "default" : "outline"}
                onClick={() => setSelectedType(selectedType === key ? null : key)}
                className={selectedType === key 
                  ? "bg-cyan-600 hover:bg-cyan-700" 
                  : "border-slate-600 text-slate-300 hover:bg-slate-800"
                }
              >
                {organismTypeIcons[key]}
                <span className="ml-1">{label}</span>
              </Button>
            ))}
            <Button
              data-testid="button-filter-tags"
              variant={showTagFilter || selectedTags.length > 0 ? "default" : "outline"}
              onClick={() => setShowTagFilter(!showTagFilter)}
              className={showTagFilter || selectedTags.length > 0
                ? "bg-purple-600 hover:bg-purple-700" 
                : "border-slate-600 text-slate-300 hover:bg-slate-800"
              }
            >
              <Filter className="w-4 h-4" />
              <span className="ml-1">Tags{selectedTags.length > 0 && ` (${selectedTags.length})`}</span>
            </Button>
          </div>
        </div>

        {showTagFilter && allTags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm text-slate-300">Filter by Tags</CardTitle>
                  {selectedTags.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTags([])}
                      className="text-slate-400 hover:text-white"
                    >
                      Clear all
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <Badge
                      key={tag}
                      data-testid={`tag-filter-${tag}`}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className={`cursor-pointer transition-all ${
                        selectedTags.includes(tag)
                          ? "bg-purple-600 hover:bg-purple-700 border-purple-500"
                          : "border-slate-600 text-slate-400 hover:bg-slate-700 hover:text-white"
                      }`}
                      onClick={() => {
                        if (selectedTags.includes(tag)) {
                          setSelectedTags(selectedTags.filter(t => t !== tag));
                        } else {
                          setSelectedTags([...selectedTags, tag]);
                        }
                      }}
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {featuredSamples.length > 0 && !searchTerm && !selectedType && selectedTags.length === 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-10"
          >
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              Featured Reference Samples
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredSamples.map((sample, idx) => (
                <motion.div
                  key={sample.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card 
                    data-testid={`card-featured-sample-${sample.id}`}
                    className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-yellow-500/30 hover:border-yellow-400/50 transition-all cursor-pointer group"
                    onClick={() => fetchSampleDetails(sample.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <Badge className={`${organismTypeColors[sample.organismType]} border`}>
                          {organismTypeIcons[sample.organismType]}
                          <span className="ml-1 capitalize">{sample.organismType.replace(/_/g, ' ')}</span>
                        </Badge>
                        {sample.imageUrl && (
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-700">
                            <img 
                              src={sample.imageUrl} 
                              alt={sample.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                      <CardTitle className="text-white group-hover:text-cyan-400 transition-colors mt-2">
                        {sample.title}
                      </CardTitle>
                      {sample.scientificName && (
                        <CardDescription className="italic text-slate-400">
                          {sample.scientificName}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-300 text-sm line-clamp-2 mb-3">
                        {sample.description}
                      </p>
                      <div className="flex items-center text-cyan-400 text-sm group-hover:translate-x-1 transition-transform">
                        View Details <ChevronRight className="w-4 h-4 ml-1" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        <Tabs defaultValue="grid" className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">
              {searchTerm || selectedType 
                ? `Search Results (${filteredSamples.length})` 
                : "All Samples"
              }
            </h2>
            <TabsList className="bg-slate-800/50">
              <TabsTrigger value="grid" className="data-[state=active]:bg-cyan-600">Grid</TabsTrigger>
              <TabsTrigger value="grouped" className="data-[state=active]:bg-cyan-600">By Type</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="grid">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="bg-slate-800/50 border-slate-700 animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-slate-700 rounded w-1/3 mb-2" />
                      <div className="h-5 bg-slate-700 rounded w-2/3" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-16 bg-slate-700 rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredSamples.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700 text-center py-12">
                <Microscope className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">No samples found matching your criteria</p>
                <Button 
                  variant="link" 
                  className="text-cyan-400 mt-2"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedType(null);
                  }}
                >
                  Clear filters
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredSamples.map((sample, idx) => (
                    <motion.div
                      key={sample.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.02 }}
                      layout
                    >
                      <Card 
                        data-testid={`card-sample-${sample.id}`}
                        className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-all cursor-pointer group h-full"
                        onClick={() => fetchSampleDetails(sample.id)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <Badge className={`${organismTypeColors[sample.organismType]} border text-xs`}>
                              {organismTypeIcons[sample.organismType]}
                              <span className="ml-1 capitalize">{sample.organismType.replace(/_/g, ' ')}</span>
                            </Badge>
                          </div>
                          <CardTitle className="text-white text-base group-hover:text-cyan-400 transition-colors mt-2 line-clamp-1">
                            {sample.title}
                          </CardTitle>
                          {sample.scientificName && (
                            <CardDescription className="italic text-slate-500 text-xs line-clamp-1">
                              {sample.scientificName}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          <p className="text-slate-400 text-xs line-clamp-3">
                            {sample.description}
                          </p>
                          {sample.magnification && (
                            <div className="mt-2 text-xs text-slate-500">
                              Magnification: {sample.magnification}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          <TabsContent value="grouped">
            <div className="space-y-8">
              {Object.entries(groupedByType).map(([type, typeSamples]) => (
                <div key={type}>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <span className={`p-1.5 rounded-lg ${organismTypeColors[type]}`}>
                      {organismTypeIcons[type]}
                    </span>
                    {organismTypeLabels[type] || type} ({typeSamples.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {typeSamples.map((sample) => (
                      <Card 
                        key={sample.id}
                        data-testid={`card-grouped-sample-${sample.id}`}
                        className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-all cursor-pointer group"
                        onClick={() => fetchSampleDetails(sample.id)}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-white text-sm group-hover:text-cyan-400 transition-colors line-clamp-1">
                            {sample.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-slate-400 text-xs line-clamp-2">
                            {sample.clinicalSignificance || sample.description}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={!!selectedSample} onOpenChange={() => setSelectedSample(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] bg-slate-900 border-slate-700 text-white overflow-hidden">
            {selectedSample && (
              <ScrollArea className="max-h-[80vh]">
                <DialogHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge className={`${organismTypeColors[selectedSample.organismType]} border mb-2`}>
                        {organismTypeIcons[selectedSample.organismType]}
                        <span className="ml-1 capitalize">{selectedSample.organismType.replace(/_/g, ' ')}</span>
                      </Badge>
                      <DialogTitle className="text-2xl text-white">
                        {selectedSample.title}
                      </DialogTitle>
                      {selectedSample.scientificName && (
                        <DialogDescription className="italic text-cyan-400 text-base">
                          {selectedSample.scientificName}
                        </DialogDescription>
                      )}
                      {selectedSample.commonName && (
                        <p className="text-slate-400 text-sm mt-1">
                          Also known as: {selectedSample.commonName}
                        </p>
                      )}
                    </div>
                    {selectedSample.imageUrl && (
                      <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0">
                        <img 
                          src={selectedSample.imageUrl} 
                          alt={selectedSample.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </DialogHeader>

                <div className="mt-6 space-y-6 pr-4">
                  <section>
                    <h3 className="text-lg font-semibold text-cyan-400 mb-2 flex items-center gap-2">
                      <BookOpen className="w-5 h-5" /> Description
                    </h3>
                    <p className="text-slate-300">{selectedSample.description}</p>
                  </section>

                  {selectedSample.clinicalSignificance && (
                    <section>
                      <h3 className="text-lg font-semibold text-cyan-400 mb-2">Clinical Significance</h3>
                      <p className="text-slate-300">{selectedSample.clinicalSignificance}</p>
                    </section>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedSample.diagnosticCriteria && (
                      <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-cyan-400">Diagnostic Criteria</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-slate-300 text-sm">{selectedSample.diagnosticCriteria}</p>
                        </CardContent>
                      </Card>
                    )}

                    {selectedSample.differentialDiagnosis && (
                      <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-cyan-400">Differential Diagnosis</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-slate-300 text-sm">{selectedSample.differentialDiagnosis}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {selectedSample.morphologyDescription && (
                    <section>
                      <h3 className="text-lg font-semibold text-cyan-400 mb-2 flex items-center gap-2">
                        <Microscope className="w-5 h-5" /> Morphology
                      </h3>
                      <p className="text-slate-300">{selectedSample.morphologyDescription}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                        {selectedSample.sizeRange && (
                          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                            <div className="text-xs text-slate-500 mb-1">Size</div>
                            <div className="text-sm text-white">{selectedSample.sizeRange}</div>
                          </div>
                        )}
                        {selectedSample.magnification && (
                          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                            <div className="text-xs text-slate-500 mb-1">Magnification</div>
                            <div className="text-sm text-white">{selectedSample.magnification}</div>
                          </div>
                        )}
                        {selectedSample.stainType && (
                          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                            <div className="text-xs text-slate-500 mb-1">Stain Type</div>
                            <div className="text-sm text-white capitalize">{selectedSample.stainType.replace(/_/g, ' ')}</div>
                          </div>
                        )}
                        {selectedSample.sampleType && (
                          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                            <div className="text-xs text-slate-500 mb-1">Sample Type</div>
                            <div className="text-sm text-white capitalize">{selectedSample.sampleType}</div>
                          </div>
                        )}
                      </div>
                    </section>
                  )}

                  {selectedSample.associatedConditions && selectedSample.associatedConditions.length > 0 && (
                    <section>
                      <h3 className="text-lg font-semibold text-cyan-400 mb-2">Associated Conditions</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedSample.associatedConditions.map((condition, idx) => (
                          <Badge key={idx} variant="outline" className="border-slate-600 text-slate-300">
                            {condition}
                          </Badge>
                        ))}
                      </div>
                    </section>
                  )}

                  {selectedSample.symptoms && selectedSample.symptoms.length > 0 && (
                    <section>
                      <h3 className="text-lg font-semibold text-cyan-400 mb-2">Associated Symptoms</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedSample.symptoms.map((symptom, idx) => (
                          <Badge key={idx} variant="outline" className="border-orange-500/30 text-orange-300 bg-orange-500/10">
                            {symptom}
                          </Badge>
                        ))}
                      </div>
                    </section>
                  )}

                  {selectedSample.aiPromptContext && (
                    <section>
                      <h3 className="text-lg font-semibold text-cyan-400 mb-2 flex items-center gap-2">
                        <Brain className="w-5 h-5" /> AI Analysis Context
                      </h3>
                      <Card className="bg-cyan-500/10 border-cyan-500/30">
                        <CardContent className="pt-4">
                          <p className="text-cyan-100 text-sm">{selectedSample.aiPromptContext}</p>
                        </CardContent>
                      </Card>
                    </section>
                  )}

                  {selectedSample.tags && selectedSample.tags.length > 0 && (
                    <section>
                      <h3 className="text-sm font-semibold text-slate-500 mb-2">Tags</h3>
                      <div className="flex flex-wrap gap-1">
                        {selectedSample.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="bg-slate-800 text-slate-400 text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </section>
                  )}

                  {selectedSample.sourceCitation && (
                    <section className="border-t border-slate-700 pt-4">
                      <p className="text-xs text-slate-500">
                        Source: {selectedSample.sourceCitation}
                        {selectedSample.sourceUrl && (
                          <a 
                            href={selectedSample.sourceUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:underline ml-2"
                          >
                            View Source
                          </a>
                        )}
                      </p>
                    </section>
                  )}
                </div>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>

        {/* AI Analysis Modal */}
        <Dialog open={showAIAnalysis} onOpenChange={(open) => {
          setShowAIAnalysis(open);
          if (!open) {
            setAnalysisResult(null);
            setAnalysisFindings("");
            setPatientContext("");
          }
        }}>
          <DialogContent className="max-w-4xl bg-slate-900 border-slate-700 max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Brain className="w-6 h-6 text-purple-400" />
                AI Blood Analysis
                {aiStatus?.available && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 ml-2">
                    <CheckCircle className="w-3 h-3 mr-1" /> Ready
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Describe your microscopy findings for AI-powered analysis using the specialized blood analysis model
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
              {/* Input Section */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Observed Findings (one per line)</label>
                  <Textarea
                    data-testid="textarea-analysis-findings"
                    placeholder="Enter your microscopy observations...&#10;Example:&#10;- Small ring forms in RBCs&#10;- Banana-shaped gametocytes&#10;- Reduced platelet count"
                    value={analysisFindings}
                    onChange={(e) => setAnalysisFindings(e.target.value)}
                    className="min-h-[200px] bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Patient Context (optional)</label>
                  <Textarea
                    data-testid="textarea-patient-context"
                    placeholder="Recent travel history, symptoms, medications..."
                    value={patientContext}
                    onChange={(e) => setPatientContext(e.target.value)}
                    className="min-h-[80px] bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>
                <Button
                  data-testid="button-run-analysis"
                  onClick={handleRunAnalysis}
                  disabled={!analysisFindings.trim() || analysisMutation.isPending}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {analysisMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Run AI Analysis
                    </>
                  )}
                </Button>
                {analysisMutation.isError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-red-400 text-sm flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      {analysisMutation.error?.message || "Analysis failed"}
                    </p>
                  </div>
                )}
              </div>

              {/* Results Section */}
              <div className="space-y-4">
                {analysisResult ? (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-slate-300">Analysis Result</h4>
                          <Badge className={
                            analysisResult.confidence === 'high' 
                              ? "bg-green-500/20 text-green-400" 
                              : analysisResult.confidence === 'moderate'
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-red-500/20 text-red-400"
                          }>
                            {analysisResult.confidence} confidence
                          </Badge>
                        </div>
                        <Card className="bg-slate-800/50 border-slate-700">
                          <CardContent className="pt-4">
                            <p className="text-slate-300 text-sm whitespace-pre-wrap">{analysisResult.analysis}</p>
                          </CardContent>
                        </Card>
                      </div>

                      {analysisResult.potentialConditions.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-300 mb-2">Potential Conditions</h4>
                          <div className="flex flex-wrap gap-2">
                            {analysisResult.potentialConditions.map((condition, idx) => (
                              <Badge key={idx} className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                                {condition}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {analysisResult.recommendedTests.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-300 mb-2">Recommended Tests</h4>
                          <div className="flex flex-wrap gap-2">
                            {analysisResult.recommendedTests.map((test, idx) => (
                              <Badge key={idx} variant="outline" className="border-cyan-500/30 text-cyan-300">
                                {test}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-xs text-slate-500 pt-2 border-t border-slate-700">
                        Model: {analysisResult.modelUsed}
                      </div>
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="h-[400px] flex items-center justify-center">
                    <div className="text-center text-slate-500">
                      <Brain className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <p>Enter your findings and run analysis</p>
                      <p className="text-xs mt-2">Results will appear here</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Floating AI Analysis Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <Button
            data-testid="button-open-ai-analysis"
            onClick={() => setShowAIAnalysis(true)}
            className="h-14 px-6 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 shadow-lg shadow-purple-500/25"
          >
            <Brain className="w-5 h-5 mr-2" />
            AI Analysis
            {aiStatus?.available && <span className="ml-2 w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
