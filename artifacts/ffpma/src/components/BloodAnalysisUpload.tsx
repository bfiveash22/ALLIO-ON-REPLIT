import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  Microscope,
  Image,
  Video,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  FileImage,
  FileVideo,
  Clock,
  X,
  Sparkles
} from "lucide-react";

interface UploadedFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  thumbnailLink?: string;
  createdTime?: string;
  description?: string;
}

interface BloodAnalysisUploadProps {
  onUploadComplete?: (result: { fileId: string; webViewLink: string }) => void;
  patientId?: string | null;
}

export function BloodAnalysisUpload({ onUploadComplete, patientId: propPatientId }: BloodAnalysisUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [patientId, setPatientId] = useState(propPatientId || "");
  const [analysisType, setAnalysisType] = useState("live-blood");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: uploadsData, isLoading: uploadsLoading } = useQuery<{ success: boolean; uploads: UploadedFile[] }>({
    queryKey: ["/api/blood-analysis/uploads"],
    refetchInterval: 30000,
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/blood-analysis/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Upload Successful",
          description: "Blood analysis file uploaded to Google Drive",
        });
        setSelectedFile(null);
        setPatientId("");
        queryClient.invalidateQueries({ queryKey: ["/api/blood-analysis/uploads"] });
        if (onUploadComplete && data.fileId && data.webViewLink) {
          onUploadComplete({ fileId: data.fileId, webViewLink: data.webViewLink });
        }
      } else {
        toast({
          title: "Upload Failed",
          description: data.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/quicktime'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an image (JPEG, PNG, GIF, WebP) or video (MP4, WebM, MOV)",
        variant: "destructive",
      });
      return;
    }

    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Maximum file size is 100MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleUpload = () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("patientId", patientId || "unassigned");
    formData.append("analysisType", analysisType);

    uploadMutation.mutate(formData);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = (mimeType: string) => mimeType.startsWith('image/');
  const isVideo = (mimeType: string) => mimeType.startsWith('video/');

  const recentUploads = uploadsData?.uploads?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-cyan-500/20 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
            <Microscope className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">Blood Analysis Upload</h3>
              <Badge className="bg-amber-500/20 text-amber-300 border-0 text-xs">Beta</Badge>
            </div>
            <p className="text-sm text-white/60">Upload microscopy images and videos for AI analysis</p>
          </div>
        </div>

        <div 
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
            dragOver 
              ? 'border-cyan-400 bg-cyan-500/10' 
              : selectedFile 
                ? 'border-green-400/50 bg-green-500/5' 
                : 'border-white/20 hover:border-cyan-500/50 hover:bg-white/5'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          data-testid="blood-upload-dropzone"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
            onChange={handleFileSelect}
            className="hidden"
            data-testid="blood-upload-input"
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
                  {isImage(selectedFile.type) ? (
                    <FileImage className="w-8 h-8 text-green-400" />
                  ) : (
                    <FileVideo className="w-8 h-8 text-green-400" />
                  )}
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
                  }}
                  data-testid="button-clear-file"
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
                  <p className="text-white font-medium">Drop blood sample here or click to browse</p>
                  <p className="text-white/50 text-sm mt-1">
                    Supports JPEG, PNG, GIF, WebP, MP4, WebM, MOV (max 100MB)
                  </p>
                </div>
                <div className="flex items-center justify-center gap-4 text-white/40 text-sm">
                  <span className="flex items-center gap-1"><Image className="w-4 h-4" /> Images</span>
                  <span className="flex items-center gap-1"><Video className="w-4 h-4" /> Videos</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="space-y-2">
            <Label className="text-white/70">Member ID</Label>
            <Input
              placeholder="e.g., MEM-001 or Member Name"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              data-testid="input-patient-id"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/70">Analysis Type</Label>
            <Select value={analysisType} onValueChange={setAnalysisType}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white" data-testid="select-analysis-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="live-blood">Live Blood Analysis</SelectItem>
                <SelectItem value="dried-blood">Dried Blood Analysis</SelectItem>
                <SelectItem value="dark-field">Dark Field Microscopy</SelectItem>
                <SelectItem value="phase-contrast">Phase Contrast</SelectItem>
                <SelectItem value="microbiome">Microbiome Analysis</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploadMutation.isPending}
            className="flex-1 min-w-[200px] bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
            data-testid="button-upload-blood"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading to Drive...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload to Google Drive
              </>
            )}
          </Button>
          <Button
            variant="outline"
            disabled={!selectedFile || uploadMutation.isPending}
            className="flex-1 min-w-[180px] border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
            onClick={() => {
              toast({
                title: "AI Analysis",
                description: "AI analysis will be available after upload",
              });
            }}
            data-testid="button-analyze-blood"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Request AI Analysis
          </Button>
        </div>
      </Card>

      {recentUploads.length > 0 && (
        <Card className="bg-slate-900/50 border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-white/40" />
              Recent Uploads
            </h4>
            <Badge variant="outline" className="text-white/50 border-white/20">
              {recentUploads.length} files
            </Badge>
          </div>
          
          <div className="space-y-3">
            {recentUploads.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isImage(file.mimeType) ? 'bg-cyan-500/20' : 'bg-violet-500/20'
                }`}>
                  {isImage(file.mimeType) ? (
                    <FileImage className={`w-5 h-5 ${isImage(file.mimeType) ? 'text-cyan-400' : 'text-violet-400'}`} />
                  ) : (
                    <FileVideo className="w-5 h-5 text-violet-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{file.name}</p>
                  <p className="text-white/40 text-xs">
                    {file.createdTime ? new Date(file.createdTime).toLocaleDateString() : 'Recently uploaded'}
                  </p>
                </div>
                {file.webViewLink && (
                  <a
                    href={file.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button size="sm" variant="ghost" className="text-cyan-400 hover:text-cyan-300">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                )}
              </motion.div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
