import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud,
  Activity,
  FileText,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Dna,
  ImageIcon,
  X,
  Camera,
  Upload,
  FlaskConical,
  TrendingUp,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { LiveCapturePanel } from "@/components/LiveCapturePanel";
import { BloodworkUploadPanel } from "@/components/BloodworkUploadPanel";

interface AnalysisResult {
  observations: string[];
  rootCauses: string[];
  protocolRecommendations: string[];
  clinicalSummary: string;
  confidence: "high" | "moderate" | "low";
}

export default function BloodAnalysisPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("labReport");
  const [recordedVideo, setRecordedVideo] = useState<{ blob: Blob; filename: string } | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG).",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleFrameCaptured = (dataUrl: string) => {
    setSelectedImage(dataUrl);
    setResult(null);
  };

  const handleVideoRecorded = (blob: Blob, filename: string) => {
    setRecordedVideo({ blob, filename });
    toast({
      title: "Video Ready",
      description: `${filename} is ready for upload to Google Drive.`,
    });
  };

  const saveFrameToDrive = async (dataUrl: string) => {
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const filename = `blood-capture-${Date.now()}.png`;

      const formData = new FormData();
      formData.append("file", blob, filename);
      formData.append("patientId", "unassigned");
      formData.append("analysisType", "live-blood");

      const response = await fetch("/api/blood-analysis/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Frame Saved",
          description: "Captured frame uploaded to Google Drive blood samples folder.",
        });
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: error.message || "Could not save frame to Drive.",
      });
    }
  };

  const uploadRecordedVideo = async () => {
    if (!recordedVideo) return;

    const formData = new FormData();
    formData.append("file", recordedVideo.blob, recordedVideo.filename);
    formData.append("patientId", "unassigned");
    formData.append("analysisType", "live-blood");

    try {
      const response = await fetch("/api/blood-analysis/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Video Saved",
          description: "Recording saved to Google Drive for later review and analysis.",
        });
        setRecordedVideo(null);
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message || "Could not upload recording.",
      });
    }
  };

  const startAnalysis = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/vision/analyze-blood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: selectedImage }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze image");
      }

      const data = await response.json();
      setResult(data);
      toast({
        title: "Analysis Complete",
        description: "Vision AI has processed the microscopy findings.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: error.message || "An error occurred during analysis.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 relative min-h-screen">
      <div className="absolute top-0 right-0 -z-10 w-[800px] h-[800px] bg-rose-500/10 rounded-full blur-[100px] opacity-50 mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-0 left-0 -z-10 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] opacity-50 mix-blend-screen pointer-events-none" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight animated-gradient-text">Blood Analysis Center</h2>
            <p className="text-muted-foreground mt-1">AI-powered lab analysis and live blood microscopy aligned with the FFPMA 2026 Protocol.</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="border-white/20 hover:bg-white/10 text-white/80 hover:text-white"
          onClick={() => setLocation("/resources/blood-samples")}
        >
          <BookOpen className="w-4 h-4 mr-2" />
          Sample Library
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl mb-6">
          <TabsTrigger
            value="labReport"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white rounded-lg transition-all text-white/60"
          >
            <FlaskConical className="w-4 h-4 mr-2" />
            Lab Report Upload
          </TabsTrigger>
          <TabsTrigger
            value="microscopy"
            className="data-[state=active]:bg-rose-600 data-[state=active]:text-white rounded-lg transition-all text-white/60"
          >
            <Upload className="w-4 h-4 mr-2" />
            Microscopy Image
          </TabsTrigger>
          <TabsTrigger
            value="live"
            className="data-[state=active]:bg-violet-600 data-[state=active]:text-white rounded-lg transition-all text-white/60"
          >
            <Camera className="w-4 h-4 mr-2" />
            Live Capture
          </TabsTrigger>
        </TabsList>

        <TabsContent value="labReport">
          <div className="glass-panel rounded-2xl p-6 border border-white/10">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-cyan-400" />
                Bloodwork Lab Report Analysis
              </h3>
              <p className="text-white/50 text-sm mt-1">
                Upload PDF lab reports or images. AI will extract all biomarkers, flag abnormals, and align findings with FFPMA protocols.
              </p>
            </div>
            <BloodworkUploadPanel showHistory={true} />
          </div>
        </TabsContent>

        <TabsContent value="microscopy">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div
                className={`glass-panel rounded-2xl p-8 border-2 border-dashed transition-all duration-300 relative overflow-hidden ${
                  dragActive ? "border-rose-500 bg-rose-500/10" : "border-white/20"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleChange}
                />

                <AnimatePresence mode="wait">
                  {!selectedImage ? (
                    <motion.div
                      key="upload"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-12 text-center"
                    >
                      <div className="h-20 w-20 rounded-full bg-rose-500/20 flex items-center justify-center mb-6 ring-8 ring-rose-500/10">
                        <UploadCloud className="h-10 w-10 text-rose-400" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Drag &amp; drop microscopy scan</h3>
                      <p className="text-white/60 mb-6 max-w-sm">
                        Upload a high-resolution frame from your live blood analysis feed (JPEG/PNG)
                      </p>
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-900/20 glass-card"
                      >
                        Select Image
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative rounded-xl overflow-hidden"
                    >
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-4 right-4 z-10 rounded-full w-8 h-8 shadow-xl"
                        onClick={() => {
                          setSelectedImage(null);
                          setResult(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <img
                        src={selectedImage}
                        alt="Microscopy Preview"
                        className="w-full h-auto object-cover rounded-xl"
                      />

                      {isAnalyzing && (
                        <motion.div
                          className="absolute inset-0 bg-rose-500/20"
                          initial={{ top: "0%", height: "0%" }}
                          animate={{ top: ["0%", "100%", "0%"], height: ["2px", "2px", "2px"] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        >
                          <div className="w-full h-full shadow-[0_0_20px_rgba(244,63,94,0.8)] bg-rose-500" />
                        </motion.div>
                      )}

                      {isAnalyzing && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center flex-col">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          >
                            <Dna className="w-16 h-16 text-rose-400 mb-4" />
                          </motion.div>
                          <span className="text-xl font-bold text-white tracking-widest uppercase title-glow">Processing Pattern Recognition...</span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <AnimatePresence>
                {selectedImage && !isAnalyzing && !result && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <Button
                      className="w-full py-6 text-lg bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 shadow-xl shadow-rose-900/30 transition-all"
                      onClick={startAnalysis}
                    >
                      <Activity className="w-5 h-5 mr-2" />
                      Initiate Vision AI Analysis
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <div className="space-y-6">
              <AnimatePresence mode="wait">
                {!result ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full glass-panel rounded-2xl p-8 flex flex-col items-center justify-center text-center text-white/40 border border-white/5"
                  >
                    <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
                    <p>Upload or capture a microscopy image to generate an AI-driven FFPMA protocol alignment report.</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, staggerChildren: 0.1 }}
                    className="space-y-6"
                  >
                    <motion.div className="glass-panel-heavy rounded-2xl p-6 border border-rose-500/30 shadow-[0_0_30px_rgba(244,63,94,0.1)]">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                          <FileText className="text-rose-400" />
                          Clinical Summary
                        </h3>
                        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1 bg-rose-500/20 text-rose-300 rounded-full border border-rose-500/30">
                          <CheckCircle className="w-3 h-3" />
                          Confidence: {result.confidence.toUpperCase()}
                        </div>
                      </div>
                      <p className="text-white/80 leading-relaxed">{result.clinicalSummary}</p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <motion.div className="glass-card rounded-xl p-5 border-l-4 border-l-blue-500">
                        <h4 className="text-sm uppercase tracking-wider text-white/50 mb-3 font-semibold flex items-center gap-2">
                          <Activity className="w-4 h-4 text-blue-400" /> Morphological Observations
                        </h4>
                        <ul className="space-y-2">
                          {result.observations.map((obs, i) => (
                            <li key={i} className="text-sm text-white/90 flex items-start gap-2">
                              <span className="text-blue-400 mt-1">•</span>
                              {obs}
                            </li>
                          ))}
                        </ul>
                      </motion.div>

                      <motion.div className="glass-card rounded-xl p-5 border-l-4 border-l-amber-500">
                        <h4 className="text-sm uppercase tracking-wider text-white/50 mb-3 font-semibold flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-400" /> Potential Root Causes
                        </h4>
                        <ul className="space-y-2">
                          {result.rootCauses.map((cause, i) => (
                            <li key={i} className="text-sm text-white/90 flex items-start gap-2">
                              <span className="text-amber-400 mt-1">•</span>
                              {cause}
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    </div>

                    <motion.div className="glass-panel rounded-xl p-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -z-10" />
                      <h4 className="text-lg font-bold text-emerald-400 mb-4 flex items-center gap-2">
                        <Dna className="w-5 h-5" /> FFPMA 2026 Protocol Alignment
                      </h4>
                      <div className="space-y-3">
                        {result.protocolRecommendations.map((rec, i) => (
                          <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-colors">
                            <p className="text-white/90">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="live">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="glass-panel rounded-2xl p-6 border border-white/10">
                <LiveCapturePanel
                  onFrameCaptured={handleFrameCaptured}
                  onVideoRecorded={handleVideoRecorded}
                  onSaveFrameToDrive={saveFrameToDrive}
                />
              </div>

              <AnimatePresence>
                {recordedVideo && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="glass-card rounded-xl p-4 border border-white/10 flex items-center justify-between"
                  >
                    <div className="text-sm">
                      <p className="text-white font-medium">{recordedVideo.filename}</p>
                      <p className="text-white/50">{(recordedVideo.blob.size / (1024 * 1024)).toFixed(1)} MB</p>
                    </div>
                    <Button
                      onClick={uploadRecordedVideo}
                      size="sm"
                      className="bg-violet-600 hover:bg-violet-500 text-white"
                    >
                      <Upload className="w-3 h-3 mr-1" />
                      Save to Drive
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {selectedImage && activeTab === "live" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-panel rounded-2xl p-4 border border-white/10"
                >
                  <div className="relative rounded-xl overflow-hidden">
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-3 right-3 z-10 rounded-full w-7 h-7 shadow-xl"
                      onClick={() => {
                        setSelectedImage(null);
                        setResult(null);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <img
                      src={selectedImage}
                      alt="Captured Frame"
                      className="w-full h-auto object-cover rounded-xl"
                    />

                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center flex-col">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <Dna className="w-12 h-12 text-rose-400 mb-3" />
                        </motion.div>
                        <span className="text-lg font-bold text-white tracking-widest uppercase title-glow">Processing...</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            <div className="space-y-6">
              <AnimatePresence mode="wait">
                {!result ? (
                  <div className="space-y-4">
                    {selectedImage && !isAnalyzing && activeTab === "live" && (
                      <Button
                        className="w-full py-5 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 shadow-xl"
                        onClick={startAnalysis}
                      >
                        <Activity className="w-5 h-5 mr-2" />
                        Analyze Captured Frame
                      </Button>
                    )}
                    <div className="h-full glass-panel rounded-2xl p-8 flex flex-col items-center justify-center text-center text-white/40 border border-white/5 min-h-64">
                      <Camera className="w-16 h-16 mb-4 opacity-50" />
                      <p>Capture a frame from the live feed to generate an AI analysis report.</p>
                    </div>
                  </div>
                ) : (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <div className="glass-panel-heavy rounded-2xl p-5 border border-rose-500/30">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold flex items-center gap-2">
                          <FileText className="text-rose-400 w-4 h-4" />
                          Clinical Summary
                        </h3>
                        <span className="text-xs font-semibold px-2 py-1 bg-rose-500/20 text-rose-300 rounded-full border border-rose-500/30">
                          {result.confidence.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-white/80 text-sm leading-relaxed">{result.clinicalSummary}</p>
                    </div>

                    <div className="glass-panel rounded-xl p-4 border-l-4 border-l-emerald-500">
                      <h4 className="text-xs uppercase tracking-wider text-white/50 mb-2 font-semibold flex items-center gap-2">
                        <Dna className="w-3 h-3 text-emerald-400" /> Protocol Recommendations
                      </h4>
                      <ul className="space-y-1.5">
                        {result.protocolRecommendations.map((rec, i) => (
                          <li key={i} className="text-sm text-white/80 flex items-start gap-2">
                            <span className="text-emerald-400 mt-0.5">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
