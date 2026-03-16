import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Camera,
  CameraOff,
  Circle,
  Square,
  Download,
  Monitor,
  RefreshCw,
  Loader2,
  Aperture,
  Video,
  StopCircle,
  Clock,
  Upload,
} from "lucide-react";

interface MediaDeviceOption {
  deviceId: string;
  label: string;
}

interface ResolutionPreset {
  label: string;
  width: number;
  height: number;
}

const RESOLUTION_PRESETS: ResolutionPreset[] = [
  { label: "720p (HD)", width: 1280, height: 720 },
  { label: "1080p (Full HD)", width: 1920, height: 1080 },
  { label: "4K (Ultra HD)", width: 3840, height: 2160 },
];

const MAX_RECORDING_SECONDS = 60;

interface LiveCapturePanelProps {
  onFrameCaptured: (dataUrl: string) => void;
  onVideoRecorded?: (blob: Blob, filename: string) => void;
  onSaveFrameToDrive?: (dataUrl: string) => void;
}

export function LiveCapturePanel({ onFrameCaptured, onVideoRecorded, onSaveFrameToDrive }: LiveCapturePanelProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingStartTimeRef = useRef<number>(0);

  const [devices, setDevices] = useState<MediaDeviceOption[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [selectedResolution, setSelectedResolution] = useState<string>("1080p (Full HD)");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [lastCapturedFrame, setLastCapturedFrame] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const autoStartAttempted = useRef(false);

  const enumerateDevices = useCallback(async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices
        .filter((d) => d.kind === "videoinput")
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${i + 1}`,
        }));
      setDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Device Error",
        description: "Could not enumerate camera devices.",
      });
    }
  }, [selectedDeviceId, toast]);

  useEffect(() => {
    enumerateDevices();
    navigator.mediaDevices?.addEventListener("devicechange", enumerateDevices);
    return () => {
      navigator.mediaDevices?.removeEventListener("devicechange", enumerateDevices);
    };
  }, [enumerateDevices]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [stream]);

  useEffect(() => {
    if (autoStartAttempted.current) return;
    autoStartAttempted.current = true;

    const autoStart = async () => {
      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        tempStream.getTracks().forEach((t) => t.stop());

        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices
          .filter((d) => d.kind === "videoinput")
          .map((d, i) => ({
            deviceId: d.deviceId,
            label: d.label || `Camera ${i + 1}`,
          }));
        setDevices(videoDevices);

        if (videoDevices.length > 0) {
          const deviceId = videoDevices[0].deviceId;
          setSelectedDeviceId(deviceId);

          setIsStarting(true);
          const resolution = RESOLUTION_PRESETS.find((p) => p.label === "1080p (Full HD)");
          const newStream = await navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: { exact: deviceId },
              ...(resolution ? { width: { ideal: resolution.width }, height: { ideal: resolution.height } } : {}),
            },
            audio: false,
          });

          if (videoRef.current) {
            videoRef.current.srcObject = newStream;
            await videoRef.current.play();
          }
          setStream(newStream);
          setIsStarting(false);
        }
      } catch (err: any) {
        setIsStarting(false);
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setPermissionDenied(true);
        }
      }
    };

    autoStart();
  }, []);

  const getResolutionConstraints = () => {
    const preset = RESOLUTION_PRESETS.find((p) => p.label === selectedResolution);
    if (!preset) return {};
    return { width: { ideal: preset.width }, height: { ideal: preset.height } };
  };

  const startCamera = async () => {
    if (!selectedDeviceId) {
      toast({
        variant: "destructive",
        title: "No Camera Selected",
        description: "Please select a camera device first.",
      });
      return;
    }

    setIsStarting(true);
    setPermissionDenied(false);

    try {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }

      const resolution = getResolutionConstraints();
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: selectedDeviceId },
          ...resolution,
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play();
      }

      setStream(newStream);
      setLastCapturedFrame(null);

      await enumerateDevices();
    } catch (err: any) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setPermissionDenied(true);
        toast({
          variant: "destructive",
          title: "Camera Permission Denied",
          description: "Please allow camera access in your browser settings.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Camera Error",
          description: err.message || "Failed to access camera.",
        });
      }
    } finally {
      setIsStarting(false);
    }
  };

  const stopCamera = () => {
    if (isRecording) {
      stopRecording();
    }
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current || !stream) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/png", 1.0);

    setLastCapturedFrame(dataUrl);
    onFrameCaptured(dataUrl);

    toast({
      title: "Frame Captured",
      description: `${canvas.width}×${canvas.height} frame captured and ready for analysis.`,
    });
  };

  const startRecording = () => {
    if (!stream) return;

    recordedChunksRef.current = [];
    setRecordingSeconds(0);

    const candidateMimes = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
      "video/mp4",
    ];
    const supportedMime = candidateMimes.find((m) => MediaRecorder.isTypeSupported(m));

    const blobMimeType = supportedMime?.startsWith("video/webm") ? "video/webm"
      : supportedMime === "video/mp4" ? "video/mp4"
      : "video/webm";

    try {
      const recorder = supportedMime
        ? new MediaRecorder(stream, { mimeType: supportedMime })
        : new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const actualMime = blobMimeType || recorder.mimeType?.split(";")[0] || "video/webm";
        const blob = new Blob(recordedChunksRef.current, { type: actualMime });
        const ext = actualMime.includes("webm") ? "webm" : "mp4";
        const filename = `blood-recording-${Date.now()}.${ext}`;
        const elapsed = Math.min(
          Math.round((Date.now() - recordingStartTimeRef.current) / 1000),
          MAX_RECORDING_SECONDS
        );

        if (onVideoRecorded) {
          onVideoRecorded(blob, filename);
        }

        toast({
          title: "Recording Complete",
          description: `${elapsed}s video recorded (${(blob.size / (1024 * 1024)).toFixed(1)} MB).`,
        });

        setIsRecording(false);
        setRecordingSeconds(0);
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      recordingStartTimeRef.current = Date.now();
      setIsRecording(true);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= MAX_RECORDING_SECONDS - 1) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Recording Error",
        description: err.message || "Could not start recording.",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const downloadLastFrame = () => {
    if (!lastCapturedFrame) return;
    const link = document.createElement("a");
    link.href = lastCapturedFrame;
    link.download = `blood-capture-${Date.now()}.png`;
    link.click();
  };

  const isActive = !!stream;

  return (
    <div className="space-y-4">
      <canvas ref={canvasRef} className="hidden" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/60 uppercase tracking-wider">Camera Device</label>
          <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId} disabled={isActive}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm">
              <SelectValue placeholder="Select camera..." />
            </SelectTrigger>
            <SelectContent>
              {devices.length === 0 ? (
                <SelectItem value="none" disabled>
                  No cameras found
                </SelectItem>
              ) : (
                devices.map((d) => (
                  <SelectItem key={d.deviceId} value={d.deviceId}>
                    {d.label}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/60 uppercase tracking-wider">Resolution</label>
          <Select value={selectedResolution} onValueChange={setSelectedResolution} disabled={isActive}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RESOLUTION_PRESETS.map((p) => (
                <SelectItem key={p.label} value={p.label}>
                  {p.label} ({p.width}×{p.height})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {permissionDenied && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-300">
          Camera access was denied. Please enable camera permissions in your browser settings and try again.
        </div>
      )}

      <div className="relative rounded-xl overflow-hidden bg-black/60 border border-white/10 aspect-video">
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          autoPlay
          playsInline
          muted
        />

        {!isActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40">
            <Monitor className="w-16 h-16 mb-3 opacity-40" />
            <p className="text-sm">Select a camera and click Start to begin live preview</p>
          </div>
        )}

        {isRecording && (
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-3 h-3 rounded-full bg-red-500"
            />
            <Badge className="bg-red-500/80 text-white border-0 text-xs">
              <Clock className="w-3 h-3 mr-1" />
              {recordingSeconds}s / {MAX_RECORDING_SECONDS}s
            </Badge>
          </div>
        )}

        {isActive && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>
                {videoRef.current?.videoWidth || "—"}×{videoRef.current?.videoHeight || "—"}
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                Live
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {!isActive ? (
          <Button
            onClick={startCamera}
            disabled={isStarting || !selectedDeviceId || devices.length === 0}
            className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white"
          >
            {isStarting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 mr-2" />
                Start Camera
              </>
            )}
          </Button>
        ) : (
          <>
            <Button
              onClick={captureFrame}
              disabled={isRecording}
              className="flex-1 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white"
            >
              <Aperture className="w-4 h-4 mr-2" />
              Capture Frame
            </Button>

            {!isRecording ? (
              <Button
                onClick={startRecording}
                variant="outline"
                className="border-red-500/40 text-red-400 hover:bg-red-500/10"
              >
                <Circle className="w-4 h-4 mr-2 fill-red-500 text-red-500" />
                Record
              </Button>
            ) : (
              <Button
                onClick={stopRecording}
                variant="outline"
                className="border-red-500/40 text-red-400 hover:bg-red-500/10 animate-pulse"
              >
                <StopCircle className="w-4 h-4 mr-2" />
                Stop ({MAX_RECORDING_SECONDS - recordingSeconds}s)
              </Button>
            )}

            <Button
              onClick={stopCamera}
              variant="outline"
              className="border-white/20 text-white/60 hover:bg-white/5"
            >
              <CameraOff className="w-4 h-4 mr-2" />
              Stop
            </Button>
          </>
        )}

        <Button
          onClick={() => enumerateDevices()}
          variant="ghost"
          size="icon"
          className="text-white/40 hover:text-white"
          title="Refresh device list"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <AnimatePresence>
        {lastCapturedFrame && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-xl overflow-hidden border border-white/10 bg-black/40"
          >
            <div className="flex items-center justify-between px-3 py-2 bg-white/5">
              <span className="text-xs text-white/50 font-medium">Last Captured Frame</span>
              <div className="flex gap-1">
                {onSaveFrameToDrive && (
                  <Button
                    onClick={() => onSaveFrameToDrive(lastCapturedFrame!)}
                    variant="ghost"
                    size="sm"
                    className="text-cyan-400 hover:text-cyan-300 h-7 text-xs"
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    Save to Drive
                  </Button>
                )}
                <Button
                  onClick={downloadLastFrame}
                  variant="ghost"
                  size="sm"
                  className="text-white/50 hover:text-white h-7 text-xs"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
              </div>
            </div>
            <img src={lastCapturedFrame} alt="Captured frame" className="w-full h-auto" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}