import { useState, useRef, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Clock,
  Trash2,
  RefreshCw,
  Activity,
  ChevronRight,
  FileImage,
  type LucideIcon,
} from "lucide-react";
import { BloodworkReportViewer } from "./BloodworkReportViewer";

interface ExtractedMarker {
  testName: string;
  category: string;
  value: number;
  unit: string;
  referenceMin?: number;
  referenceMax?: number;
  status: "normal" | "low" | "high" | "critical_low" | "critical_high";
  confidence: number;
  notes?: string;
}

interface BloodworkUpload {
  id: string;
  memberId: string;
  memberName: string | null;
  fileName: string;
  fileType: string;
  status: string;
  driveWebViewLink?: string | null;
  labName?: string | null;
  collectionDate?: string | null;
  createdAt: string;
  clinicalSummary?: string | null;
  aiObservations?: string[] | null;
  protocolAlignments?: string[] | null;
  abnormalFlags?: string[] | null;
  confidence?: string | null;
  extractedMarkers?: ExtractedMarker[] | null;
}

interface HistoryData {
  markerHistory: Record<string, Array<{ date: string; value: number; unit: string; status: string; uploadId: string }>>;
  uploads: Array<{ id: string; fileName: string; labName?: string; collectionDate?: string; createdAt: string; markerCount: number; abnormalCount: number }>;
}

interface Props {
  memberId?: string;
  memberName?: string;
  showHistory?: boolean;
  onProtocolContextReady?: (context: string) => void;
}

const STATUS_LABELS: Record<string, { label: string; color: string; icon: LucideIcon }> = {
  pending: { label: "Pending", color: "text-white/50", icon: Clock },
  analyzing: { label: "Analyzing...", color: "text-cyan-400", icon: Activity },
  completed: { label: "Complete", color: "text-emerald-400", icon: CheckCircle2 },
  failed: { label: "Failed", color: "text-rose-400", icon: AlertCircle },
};

export function BloodworkUploadPanel({ memberId, memberName, showHistory = true, onProtocolContextReady }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [inputMemberId, setInputMemberId] = useState(memberId || "");
  const [inputMemberName, setInputMemberName] = useState(memberName || "");
  const [labName, setLabName] = useState("");
  const [collectionDate, setCollectionDate] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [selectedUploadId, setSelectedUploadId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const effectiveMemberId = memberId || inputMemberId;

  const { data: uploadsData, isLoading: uploadsLoading, refetch: refetchUploads } = useQuery<{ success: boolean; uploads: BloodworkUpload[] }>({
    queryKey: ["/api/bloodwork/uploads", effectiveMemberId],
    queryFn: async () => {
      if (!effectiveMemberId) return { success: true, uploads: [] };
      const res = await fetch(`/api/bloodwork/uploads/${effectiveMemberId}`);
      return res.json();
    },
    enabled: !!effectiveMemberId,
    refetchInterval: (data) => {
      const uploads = data?.state?.data?.uploads || [];
      const analyzing = uploads.some((u: BloodworkUpload) => u.status === "analyzing");
      return analyzing ? 5000 : false;
    },
  });

  const { data: historyData } = useQuery<{ success: boolean } & HistoryData>({
    queryKey: ["/api/bloodwork/history", effectiveMemberId],
    queryFn: async () => {
      if (!effectiveMemberId) return { success: true, markerHistory: {}, uploads: [] };
      const res = await fetch(`/api/bloodwork/history/${effectiveMemberId}`);
      return res.json();
    },
    enabled: !!effectiveMemberId && showHistory,
  });

  const uploads = uploadsData?.uploads || [];
  const selectedUpload = uploads.find((u) => u.id === selectedUploadId) || null;

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/bloodwork/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Upload Successful",
          description: "Your bloodwork file is being analyzed by AI. Results will appear in a few seconds.",
        });
        setSelectedFile(null);
        setLabName("");
        setCollectionDate("");
        queryClient.invalidateQueries({ queryKey: ["/api/bloodwork/uploads", effectiveMemberId] });
        setSelectedUploadId(data.uploadId);
        setActiveTab("results");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (uploadId: string) => {
      const res = await fetch(`/api/bloodwork/upload/${uploadId}`, { method: "DELETE" });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Report Deleted" });
      setSelectedUploadId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/bloodwork/uploads", effectiveMemberId] });
    },
  });

  const handleFile = (file: File) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
    if (!allowed.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a PDF or image file (JPEG, PNG, WebP, GIF).",
      });
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File too large", description: "Maximum file size is 50MB." });
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleSubmit = () => {
    if (!selectedFile) return;
    const id = memberId || inputMemberId;
    if (!id.trim()) {
      toast({ variant: "destructive", title: "Member ID required", description: "Please enter a member ID." });
      return;
    }

    const fd = new FormData();
    fd.append("file", selectedFile);
    fd.append("memberId", id.trim());
    if (inputMemberName || memberName) fd.append("memberName", inputMemberName || memberName || "");
    if (labName) fd.append("labName", labName);
    if (collectionDate) fd.append("collectionDate", collectionDate);

    uploadMutation.mutate(fd);
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl w-full">
          <TabsTrigger value="upload" className="flex-1 data-[state=active]:bg-cyan-600 data-[state=active]:text-white rounded-lg text-white/60 text-sm">
            <Upload className="w-3 h-3 mr-1" />
            Upload Report
          </TabsTrigger>
          <TabsTrigger value="results" className="flex-1 data-[state=active]:bg-violet-600 data-[state=active]:text-white rounded-lg text-white/60 text-sm">
            <FileText className="w-3 h-3 mr-1" />
            Results {uploads.length > 0 && `(${uploads.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-4">
          <div className="space-y-4">
            {!memberId && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-white/70 text-xs mb-1 block">Member ID *</Label>
                  <Input
                    value={inputMemberId}
                    onChange={(e) => setInputMemberId(e.target.value)}
                    placeholder="e.g. member123"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                </div>
                <div>
                  <Label className="text-white/70 text-xs mb-1 block">Member Name</Label>
                  <Input
                    value={inputMemberName}
                    onChange={(e) => setInputMemberName(e.target.value)}
                    placeholder="e.g. Jane Smith"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-white/70 text-xs mb-1 block">Lab Name</Label>
                <Input
                  value={labName}
                  onChange={(e) => setLabName(e.target.value)}
                  placeholder="e.g. Quest Diagnostics"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>
              <div>
                <Label className="text-white/70 text-xs mb-1 block">Collection Date</Label>
                <Input
                  type="date"
                  value={collectionDate}
                  onChange={(e) => setCollectionDate(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            <div
              className={`rounded-xl border-2 border-dashed p-8 text-center transition-all ${
                dragOver ? "border-cyan-500 bg-cyan-500/10" : "border-white/20 hover:border-white/40"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />

              <AnimatePresence mode="wait">
                {!selectedFile ? (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-4 ring-8 ring-cyan-500/5">
                      <Upload className="w-8 h-8 text-cyan-400" />
                    </div>
                    <p className="text-white/70 font-medium mb-1">Drop your lab report here</p>
                    <p className="text-white/40 text-sm mb-4">PDF or image (JPEG, PNG, WebP) — max 50MB</p>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10"
                    >
                      Browse Files
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div key="selected" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3 ring-8 ring-emerald-500/5">
                      {selectedFile.type === "application/pdf" ? (
                        <FileText className="w-8 h-8 text-emerald-400" />
                      ) : (
                        <FileImage className="w-8 h-8 text-emerald-400" />
                      )}
                    </div>
                    <p className="text-white font-medium">{selectedFile.name}</p>
                    <p className="text-white/40 text-sm mt-1">
                      {selectedFile.type === "application/pdf" ? "PDF" : "Image"} •{" "}
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-3">
                      <Button
                        onClick={handleSubmit}
                        disabled={uploadMutation.isPending}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white"
                      >
                        {uploadMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload & Analyze
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => setSelectedFile(null)}
                        variant="ghost"
                        className="text-white/40 hover:text-white/70"
                      >
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-xs text-white/50 font-medium mb-2">How it works:</p>
              <div className="space-y-1.5">
                {[
                  "Upload your PDF lab report or an image of the results",
                  "AI automatically extracts all biomarkers with values and ranges",
                  "Abnormal markers are flagged with FFPMA protocol alignments",
                  "Results feed directly into DR_FORMULA protocol generation",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-white/40">
                    <span className="text-cyan-400 font-bold mt-0.5">{i + 1}.</span>
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="results" className="mt-4">
          <div className="space-y-3">
            {uploadsLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
              </div>
            )}

            {!uploadsLoading && uploads.length === 0 && (
              <div className="text-center py-8 text-white/40">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>No bloodwork reports uploaded yet.</p>
                <Button
                  onClick={() => setActiveTab("upload")}
                  variant="ghost"
                  size="sm"
                  className="text-cyan-400 mt-2"
                >
                  Upload a report
                </Button>
              </div>
            )}

            {uploads.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  {uploads.map((upload) => {
                    const statusInfo = STATUS_LABELS[upload.status] || STATUS_LABELS.pending;
                    const StatusIcon = statusInfo.icon;
                    const isSelected = selectedUploadId === upload.id;
                    const markerCount = (upload.extractedMarkers || []).length;
                    const abnormalCount = (upload.extractedMarkers || []).filter((m) => m.status !== "normal").length;

                    return (
                      <motion.button
                        key={upload.id}
                        onClick={() => setSelectedUploadId(isSelected ? null : upload.id)}
                        className={`w-full p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "border-cyan-500/50 bg-cyan-500/10"
                            : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                        }`}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{upload.fileName}</p>
                            {upload.labName && (
                              <p className="text-xs text-white/40 mt-0.5">{upload.labName}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs flex items-center gap-1 ${statusInfo.color}`}>
                                <StatusIcon className="w-3 h-3" />
                                {statusInfo.label}
                              </span>
                              {upload.status === "completed" && markerCount > 0 && (
                                <>
                                  <span className="text-xs text-white/30">{markerCount} markers</span>
                                  {abnormalCount > 0 && (
                                    <Badge className="bg-rose-500/20 text-rose-300 text-xs py-0 px-1">
                                      {abnormalCount} flagged
                                    </Badge>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 ml-2 shrink-0">
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(upload.id); }}
                              className="p-1 text-white/20 hover:text-rose-400 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                            <ChevronRight className={`w-4 h-4 text-white/30 transition-transform ${isSelected ? "rotate-90" : ""}`} />
                          </div>
                        </div>
                        <p className="text-xs text-white/30 mt-1">
                          {new Date(upload.createdAt).toLocaleDateString()}
                        </p>
                      </motion.button>
                    );
                  })}

                  <Button
                    onClick={() => refetchUploads()}
                    variant="ghost"
                    size="sm"
                    className="w-full text-white/30 text-xs mt-1"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Refresh
                  </Button>
                </div>

                <div className="lg:col-span-2">
                  {selectedUpload ? (
                    <BloodworkReportViewer
                      upload={selectedUpload}
                      historyData={historyData || null}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-white/30">
                      <FileText className="w-10 h-10 mb-3 opacity-50" />
                      <p className="text-sm">Select a report to view results</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
