import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  Dna,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  FileImage,
  Clock,
  X,
  Sparkles,
  Shield,
  ChevronDown,
  ChevronUp,
  Activity,
} from "lucide-react";

interface FindingAnnotation {
  region: string;
  severity: string;
}

interface Finding {
  area: string;
  description: string;
  confidence: number;
  annotation?: FindingAnnotation;
}

interface AnalysisResult {
  success: boolean;
  analysisType: string;
  model: string;
  result: {
    findings: Finding[];
    disclaimer: string;
  };
  processingTimeMs: number;
  driveLink?: string;
}

interface XRayAnalysisUploadProps {
  onAnalysisComplete?: (result: AnalysisResult) => void;
  patientId?: string | null;
}

export function XRayAnalysisUpload({ onAnalysisComplete, patientId: propPatientId }: XRayAnalysisUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [patientId, setPatientId] = useState(propPatientId || "");
  const [dragOver, setDragOver] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showFindings, setShowFindings] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: historyData } = useQuery<{ success: boolean; analyses: any[] }>({
    queryKey: ["/api/xray/history"],
    refetchInterval: 30000,
  });

  const analyzeMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/xray/upload-analyze", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Analysis failed");
      }
      return response.json() as Promise<AnalysisResult>;
    },
    onSuccess: (data) => {
      if (data.success) {
        setAnalysisResult(data);
        toast({
          title: "X-Ray Analysis Complete",
          description: `Analysis completed in ${(data.processingTimeMs / 1000).toFixed(1)}s using ${data.model}`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/xray/history"] });
        onAnalysisComplete?.(data);
      } else {
        toast({
          title: "Analysis Failed",
          description: "Could not complete the X-ray analysis",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const validateAndSetFile = (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/dicom'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.dcm', '.dicom'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(ext)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JPEG, PNG, or DICOM image",
        variant: "destructive",
      });
      return;
    }

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Maximum file size is 50MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setAnalysisResult(null);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files[0];
    if (file) validateAndSetFile(file);
  };

  const handleUploadAndAnalyze = () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("patientId", patientId || "unassigned");
    formData.append("analysisType", "xray");
    analyzeMutation.mutate(formData);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-emerald-400";
    if (confidence >= 0.5) return "text-amber-400";
    return "text-rose-400";
  };

  const getConfidenceBg = (confidence: number) => {
    if (confidence >= 0.8) return "bg-emerald-500/20";
    if (confidence >= 0.5) return "bg-amber-500/20";
    return "bg-rose-500/20";
  };

  const recentAnalyses = historyData?.analyses?.slice(0, 5) || [];

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-violet-900/30 to-purple-900/20 border-violet-500/20 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
            <Dna className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">X-Ray Pattern Analysis</h3>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-0 text-xs">Active</Badge>
            </div>
            <p className="text-sm text-white/60">AI-powered chest & skeletal imaging analysis</p>
          </div>
        </div>

        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
            dragOver
              ? 'border-violet-400 bg-violet-500/10'
              : selectedFile
                ? 'border-green-400/50 bg-green-500/5'
                : 'border-white/20 hover:border-violet-500/50 hover:bg-white/5'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,.dcm,.dicom"
            onChange={handleFileSelect}
            className="hidden"
          />

          <AnimatePresence mode="wait">
            {selectedFile ? (
              <motion.div
                key="selected"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-3"
              >
                <div className="w-16 h-16 mx-auto rounded-xl bg-green-500/20 flex items-center justify-center">
                  <FileImage className="w-8 h-8 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{selectedFile.name}</p>
                  <p className="text-white/50 text-sm">{formatFileSize(selectedFile.size)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/50 hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    setAnalysisResult(null);
                  }}
                >
                  <X className="w-4 h-4 mr-1" /> Clear Selection
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-3"
              >
                <div className="w-16 h-16 mx-auto rounded-xl bg-white/5 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-white/40" />
                </div>
                <div>
                  <p className="text-white font-medium">Drop X-ray image here or click to browse</p>
                  <p className="text-white/50 text-sm mt-1">
                    Supports JPEG, PNG, DICOM (max 50MB)
                  </p>
                </div>
                <div className="flex items-center justify-center gap-4 text-white/40 text-sm">
                  <span className="flex items-center gap-1"><FileImage className="w-4 h-4" /> Chest X-Ray</span>
                  <span className="flex items-center gap-1"><Dna className="w-4 h-4" /> Skeletal</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-4 space-y-2">
          <Label className="text-white/70">Member ID</Label>
          <Input
            placeholder="e.g., MEM-001 or Member Name"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
        </div>

        <div className="mt-4">
          <Button
            onClick={handleUploadAndAnalyze}
            disabled={!selectedFile || analyzeMutation.isPending}
            className="w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white"
          >
            {analyzeMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing X-Ray...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Upload & Analyze X-Ray
              </>
            )}
          </Button>
        </div>

        {analyzeMutation.isPending && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 space-y-2"
          >
            <div className="flex items-center gap-2 text-sm text-violet-300">
              <Activity className="w-4 h-4 animate-pulse" />
              <span>Processing with jiviai/Jivi-RadX-v1 model...</span>
            </div>
            <Progress value={undefined} className="h-1.5 bg-white/10" />
          </motion.div>
        )}
      </Card>

      <AnimatePresence>
        {analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="bg-gradient-to-br from-slate-900/80 to-violet-900/20 border-violet-500/30 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-white font-bold">Analysis Results</h4>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-violet-500/20 text-violet-300 text-xs">
                    {analysisResult.model}
                  </Badge>
                  <Badge className="bg-white/10 text-white/60 text-xs">
                    {(analysisResult.processingTimeMs / 1000).toFixed(1)}s
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/50 h-7 px-2"
                    onClick={() => setShowFindings(!showFindings)}
                  >
                    {showFindings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {showFindings && (
                <div className="space-y-3 mb-4">
                  {analysisResult.result.findings.map((finding, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-3 rounded-lg bg-white/5 border border-white/10"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-white">{finding.area}</span>
                        <div className="flex items-center gap-2">
                          {finding.annotation && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              finding.annotation.severity === "high" ? "bg-rose-500/20 text-rose-300" :
                              finding.annotation.severity === "moderate" ? "bg-amber-500/20 text-amber-300" :
                              "bg-slate-500/20 text-slate-300"
                            }`}>
                              {finding.annotation.severity}
                            </span>
                          )}
                          <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${getConfidenceBg(finding.confidence)} ${getConfidenceColor(finding.confidence)}`}>
                            {(finding.confidence * 100).toFixed(0)}% confidence
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-white/70">{finding.description}</p>
                      {finding.annotation?.region && (
                        <p className="text-xs text-white/40 mt-1">Region: {finding.annotation.region}</p>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}

              {analysisResult.driveLink && (
                <a
                  href={analysisResult.driveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-violet-300 hover:text-violet-200 mb-4"
                >
                  <ExternalLink className="w-4 h-4" />
                  View X-Ray on Google Drive
                </a>
              )}

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-300/80">
                    {analysisResult.result.disclaimer}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {recentAnalyses.length > 0 && (
        <Card className="bg-slate-900/50 border-white/10 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white font-semibold flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-white/40" />
              Recent X-Ray Analyses
            </h4>
            <Badge variant="outline" className="text-white/50 border-white/20 text-xs">
              {recentAnalyses.length}
            </Badge>
          </div>
          <div className="space-y-2">
            {recentAnalyses.map((analysis: any) => (
              <div
                key={analysis.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <Dna className="w-4 h-4 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {analysis.patientUploadId || "Unknown Patient"}
                  </p>
                  <p className="text-white/40 text-xs">
                    {analysis.model} &bull; {analysis.completedAt ? new Date(analysis.completedAt).toLocaleDateString() : "Processing"}
                  </p>
                </div>
                <Badge className={
                  analysis.status === "completed"
                    ? "bg-emerald-500/20 text-emerald-300 text-xs"
                    : analysis.status === "failed"
                      ? "bg-rose-500/20 text-rose-300 text-xs"
                      : "bg-amber-500/20 text-amber-300 text-xs"
                }>
                  {analysis.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
