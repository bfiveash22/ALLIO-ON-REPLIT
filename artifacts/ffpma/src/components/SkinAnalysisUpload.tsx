import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
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
  Heart,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileImage,
  X,
  Sparkles,
  Shield,
  Info,
  ExternalLink
} from "lucide-react";

interface ABCDECriterion {
  assessed: boolean;
  description: string;
  risk: string;
}

interface SkinAnalysisResult {
  success: boolean;
  analysisType: string;
  model: string;
  result: {
    classification: string;
    allClassifications: Array<{ label: string; score: number }>;
    assessment: string;
    isSuspicious: boolean;
    confidence: number;
    abcdeCriteria: {
      asymmetry: ABCDECriterion;
      border: ABCDECriterion;
      color: ABCDECriterion;
      diameter: ABCDECriterion;
      evolution: ABCDECriterion;
    };
    findings: Array<{ area: string; description: string; confidence: number }>;
    disclaimer: string;
  };
  processingTimeMs: number;
  driveUpload?: {
    fileId: string;
    webViewLink: string;
  };
}

interface SkinAnalysisUploadProps {
  patientId?: string | null;
}

export function SkinAnalysisUpload({ patientId: propPatientId }: SkinAnalysisUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [patientId, setPatientId] = useState(propPatientId || "");
  const [dragOver, setDragOver] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SkinAnalysisResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const analyzeMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("patientId", patientId || "unassigned");
      const uploadRes = await fetch("/api/skin-analysis/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();

      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const analysisRes = await fetch("/api/ai/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientUploadId: uploadData.fileId || "skin-upload",
          analysisType: "skin",
          imageData: base64,
        }),
      });

      if (!analysisRes.ok) {
        const error = await analysisRes.json();
        throw new Error(error.error || "Analysis failed");
      }

      const result = await analysisRes.json();
      if (uploadData.success) {
        result.driveUpload = {
          fileId: uploadData.fileId,
          webViewLink: uploadData.webViewLink,
        };
      }
      return result as SkinAnalysisResult;
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      toast({
        title: "Analysis Complete",
        description: `Skin lesion classified as: ${data.result.classification}`,
      });
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
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a skin image (JPEG, PNG, GIF, or WebP)",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Maximum file size is 50MB",
        variant: "destructive",
      });
      return;
    }
    setSelectedFile(file);
    setAnalysisResult(null);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files[0];
    if (file) validateAndSetFile(file);
  };

  const handleAnalyze = () => {
    if (!selectedFile) return;
    analyzeMutation.mutate(selectedFile);
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setAnalysisResult(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const getRiskColor = (risk: string) => {
    if (risk === "elevated") return "text-red-400";
    if (risk === "low") return "text-emerald-400";
    return "text-amber-400";
  };

  const getRiskBg = (risk: string) => {
    if (risk === "elevated") return "bg-red-500/10 border-red-500/20";
    if (risk === "low") return "bg-emerald-500/10 border-emerald-500/20";
    return "bg-amber-500/10 border-amber-500/20";
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-rose-500/20 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">Skin Condition Analysis</h3>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-0 text-xs">Active</Badge>
            </div>
            <p className="text-sm text-white/60">AI-powered dermoscopic lesion classification</p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-4">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
            <div className="text-xs text-blue-300/80">
              <p className="font-medium text-blue-300 mb-1">Image Quality Guidelines</p>
              <ul className="space-y-0.5 list-disc list-inside">
                <li>Use a well-lit, close-up photo of the lesion</li>
                <li>Include a ruler or coin for scale reference when possible</li>
                <li>Ensure the image is in focus with minimal glare</li>
                <li>Dermoscopic images provide best results</li>
              </ul>
            </div>
          </div>
        </div>

        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
            dragOver
              ? "border-rose-400 bg-rose-500/10"
              : selectedFile
                ? "border-green-400/50 bg-green-500/5"
                : "border-white/20 hover:border-rose-500/50 hover:bg-white/5"
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />

          <AnimatePresence mode="wait">
            {selectedFile && previewUrl ? (
              <motion.div
                key="selected"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-3"
              >
                <img
                  src={previewUrl}
                  alt="Selected skin image"
                  className="w-32 h-32 mx-auto rounded-lg object-cover border border-white/10"
                />
                <div>
                  <p className="text-white font-medium">{selectedFile.name}</p>
                  <p className="text-white/50 text-sm">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/50 hover:text-white"
                  onClick={(e) => { e.stopPropagation(); clearSelection(); }}
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
                  <p className="text-white font-medium">Drop skin image here or click to browse</p>
                  <p className="text-white/50 text-sm mt-1">
                    Supports JPEG, PNG, GIF, WebP (max 50MB)
                  </p>
                </div>
                <div className="flex items-center justify-center gap-4 text-white/40 text-sm">
                  <span className="flex items-center gap-1"><FileImage className="w-4 h-4" /> Dermoscopic or Clinical Photos</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-1 gap-4 mt-4">
          <div className="space-y-2">
            <Label className="text-white/70">Patient/Member ID (optional)</Label>
            <Input
              placeholder="e.g., MEM-001 or Patient Name"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>
        </div>

        <div className="mt-4">
          <Button
            onClick={handleAnalyze}
            disabled={!selectedFile || analyzeMutation.isPending}
            className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white"
          >
            {analyzeMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing with AI...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze Skin Lesion
              </>
            )}
          </Button>
        </div>

        {analyzeMutation.isPending && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm text-white/60">
              <span>Uploading & analyzing...</span>
              <span>Processing</span>
            </div>
            <Progress value={65} className="h-1" />
          </div>
        )}
      </Card>

      <AnimatePresence>
        {analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className={`p-6 border ${
              analysisResult.result.isSuspicious
                ? "bg-gradient-to-br from-red-950/50 to-red-900/30 border-red-500/30"
                : "bg-gradient-to-br from-emerald-950/50 to-emerald-900/30 border-emerald-500/30"
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {analysisResult.result.isSuspicious ? (
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-white">Analysis Results</h3>
                    <p className="text-sm text-white/60">
                      Model: {analysisResult.model} | {analysisResult.processingTimeMs}ms
                    </p>
                  </div>
                </div>
                <Badge className={
                  analysisResult.result.isSuspicious
                    ? "bg-red-500/20 text-red-300"
                    : "bg-emerald-500/20 text-emerald-300"
                }>
                  {analysisResult.result.isSuspicious ? "Suspicious" : "Benign"}
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-white/5">
                  <p className="text-sm text-white/60 mb-1">Classification</p>
                  <p className="text-white font-semibold">{analysisResult.result.classification}</p>
                  <p className="text-sm text-white/70 mt-1">{analysisResult.result.assessment}</p>
                </div>

                <div className="p-3 rounded-lg bg-white/5">
                  <p className="text-sm text-white/60 mb-1">Confidence</p>
                  <div className="flex items-center gap-3">
                    <Progress value={analysisResult.result.confidence * 100} className="flex-1 h-2" />
                    <span className="text-white font-mono text-sm">
                      {(analysisResult.result.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {analysisResult.result.allClassifications && analysisResult.result.allClassifications.length > 1 && (
                  <div className="p-3 rounded-lg bg-white/5">
                    <p className="text-sm text-white/60 mb-2">All Classifications</p>
                    <div className="space-y-1">
                      {analysisResult.result.allClassifications.map((c, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-white/80">{c.label}</span>
                          <span className="text-white/60 font-mono">{(c.score * 100).toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-3 rounded-lg bg-white/5">
                  <p className="text-sm text-white/60 mb-3">ABCDE Dermoscopic Criteria</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(analysisResult.result.abcdeCriteria).map(([key, criterion]) => (
                      <div key={key} className={`p-2 rounded-lg border ${getRiskBg(criterion.risk)}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-white/80 uppercase">{key.charAt(0)}: {key}</span>
                          <Badge variant="outline" className={`text-[10px] px-1.5 ${getRiskColor(criterion.risk)} border-current`}>
                            {criterion.risk}
                          </Badge>
                        </div>
                        <p className="text-xs text-white/60">{criterion.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {analysisResult.driveUpload?.webViewLink && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <ExternalLink className="w-4 h-4 text-blue-400" />
                    <a
                      href={analysisResult.driveUpload.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-400 hover:text-blue-300 underline"
                    >
                      View uploaded image on Google Drive
                    </a>
                  </div>
                )}

                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-300/80">{analysisResult.result.disclaimer}</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
