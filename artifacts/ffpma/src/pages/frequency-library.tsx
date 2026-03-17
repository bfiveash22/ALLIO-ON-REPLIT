import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAudioOutputDevice } from "@/hooks/useAudioOutputDevice";
import { AudioDeviceSelector } from "@/components/AudioDeviceSelector";
import {
  Search,
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Repeat,
  Bluetooth,
  Radio,
  Heart,
  Dna,
  Shield,
  Leaf,
  Music,
  Zap,
  Headphones,
  Globe,
  Sparkles,
  Timer,
  Activity,
  Star,
  Waves,
  Plus,
  Monitor,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  Cpu,
  FileText,
  Info,
  BookOpen,
} from "lucide-react";

interface Frequency {
  id: string;
  title: string;
  description: string | null;
  frequencyHz: string;
  waveformType: string | null;
  durationSeconds: number | null;
  category: string;
  purpose: string | null;
  sourceAgent: string | null;
  audioUrl: string | null;
  audioBase64: string | null;
  driveFileId: string | null;
  tags: string[] | null;
  isFeatured: boolean | null;
  isActive: boolean | null;
  playCount: number | null;
  createdBy: string | null;
  createdAt: string | null;
}

interface FrequencyCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
}

interface RifeProtocol {
  id: string;
  conditionName: string;
  category: "infectious" | "chronic" | "detox_cellular_repair";
  categoryLabel: string;
  frequencyRange: string;
  primaryFrequencies: number[];
  mechanism: string;
  treatmentDuration: string;
  sessionsPerWeek: number;
  equipment: string[];
  safetyProtocols: string[];
  contraindications: string[];
  notes: string;
  researchBasis: string;
  tags: string[];
}

interface RifeSafetyData {
  safety: {
    generalSafety: string[];
    universalContraindications: string[];
    herxheimerReaction: {
      description: string;
      management: string[];
    };
    equipmentGuidelines: {
      plasmaDevices: string;
      contactDevices: string;
      pemfDevices: string;
    };
  };
  categories: Record<string, { label: string; description: string; icon: string }>;
}

const categoryIcons: Record<string, typeof Heart> = {
  healing: Heart,
  longevity: Timer,
  dna_repair: Dna,
  pain_relief: Shield,
  relaxation: Leaf,
  solfeggio: Music,
  rife: Zap,
  binaural: Headphones,
  schumann: Globe,
  custom: Sparkles,
};

const categoryColors: Record<string, string> = {
  healing: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  longevity: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  dna_repair: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  pain_relief: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  relaxation: "bg-green-500/10 text-green-400 border-green-500/20",
  solfeggio: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  rife: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  binaural: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  schumann: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  custom: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const rifeCategoryColors: Record<string, string> = {
  infectious: "bg-red-500/10 text-red-400 border-red-500/20",
  chronic: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  detox_cellular_repair: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const rifeCategoryIcons: Record<string, typeof Shield> = {
  infectious: Shield,
  chronic: Heart,
  detox_cellular_repair: Sparkles,
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return "5:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function FrequencyPlayer({ frequency, onClose }: { frequency: Frequency; onClose: () => void }) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    outputDevices,
    selectedDevice,
    selectDevice,
    applySinkId,
    fallbackNotification,
    dismissNotification,
  } = useAudioOutputDevice();

  const playMutation = useMutation({
    mutationFn: async () => {
      await fetch(`/api/frequencies/${frequency.id}/play`, { method: "POST" });
    },
  });

  useEffect(() => {
    return () => stopPlayback();
  }, []);

  const drawVisualization = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
      if (!analyser || !ctx || !canvas) return;
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = "#8b5cf6";
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    }
    draw();
  }, []);

  const startPlayback = useCallback(async () => {
    const hz = parseFloat(frequency.frequencyHz);

    if (frequency.audioBase64 || frequency.audioUrl) {
      const audio = new Audio();
      if (frequency.audioBase64) {
        audio.src = `data:audio/wav;base64,${frequency.audioBase64}`;
      } else if (frequency.audioUrl) {
        audio.src = frequency.audioUrl;
      }
      audio.loop = isLooping;
      audio.volume = isMuted ? 0 : volume;
      audioElementRef.current = audio;

      await applySinkId(audio);

      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaElementSource(audio);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      await audio.play();
      drawVisualization();
    } else if (hz > 0) {
      const audioCtx = new AudioContext();

      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;

      const waveType = (frequency.waveformType || "sine") as OscillatorType;
      oscillator.type = waveType;
      oscillator.frequency.setValueAtTime(hz, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(isMuted ? 0 : volume, audioCtx.currentTime);

      oscillator.connect(gainNode);
      gainNode.connect(analyser);

      if (selectedDevice !== "default" && "createMediaStreamDestination" in audioCtx) {
        const dest = audioCtx.createMediaStreamDestination();
        analyser.connect(dest);
        const routingAudio = new Audio();
        routingAudio.srcObject = dest.stream;
        await applySinkId(routingAudio);
        await routingAudio.play();
        audioElementRef.current = routingAudio;
      } else {
        analyser.connect(audioCtx.destination);
      }

      oscillator.start();

      audioContextRef.current = audioCtx;
      oscillatorRef.current = oscillator;
      gainNodeRef.current = gainNode;
      analyserRef.current = analyser;

      drawVisualization();
    }

    setIsPlaying(true);
    setElapsed(0);
    playMutation.mutate();

    elapsedRef.current = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
  }, [frequency, volume, isMuted, isLooping, selectedDevice, drawVisualization, playMutation, applySinkId]);

  const stopPlayback = useCallback(() => {
    if (oscillatorRef.current) {
      try { oscillatorRef.current.stop(); } catch {}
      oscillatorRef.current = null;
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (elapsedRef.current) {
      clearInterval(elapsedRef.current);
      elapsedRef.current = null;
    }
    gainNodeRef.current = null;
    analyserRef.current = null;
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) stopPlayback();
    else startPlayback();
  }, [isPlaying, stopPlayback, startPlayback]);

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.setValueAtTime(isMuted ? 0 : volume, audioContextRef.current?.currentTime || 0);
    }
    if (audioElementRef.current) {
      audioElementRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const hz = parseFloat(frequency.frequencyHz);
  const Icon = categoryIcons[frequency.category] || Radio;
  const colorClass = categoryColors[frequency.category] || "bg-gray-500/10 text-gray-400";

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className={`p-4 rounded-xl border ${colorClass}`}>
          <Icon className="h-8 w-8" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold">{frequency.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{frequency.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className={colorClass}>
              {frequency.category.replace("_", " ")}
            </Badge>
            {frequency.sourceAgent && (
              <Badge variant="secondary" className="text-xs">
                Agent: {frequency.sourceAgent}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {hz > 0 ? `${hz} Hz` : "Audio File"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="bg-black/50 rounded-lg p-2 border border-border">
        <canvas ref={canvasRef} width={500} height={100} className="w-full h-24 rounded" />
      </div>

      <div className="flex items-center justify-center gap-4">
        <Button
          size="icon"
          variant={isLooping ? "default" : "outline"}
          onClick={() => setIsLooping(!isLooping)}
          className="h-10 w-10"
        >
          <Repeat className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          onClick={togglePlay}
          className="h-14 w-14 rounded-full"
        >
          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
        </Button>
        <Button
          size="icon"
          variant="outline"
          onClick={stopPlayback}
          className="h-10 w-10"
          disabled={!isPlaying}
        >
          <Square className="h-4 w-4" />
        </Button>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, "0")} / {formatDuration(frequency.durationSeconds)}
      </div>

      <div className="flex items-center gap-3">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setIsMuted(!isMuted)}
          className="h-8 w-8"
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
        <Slider
          value={[volume * 100]}
          onValueChange={([v]) => setVolume(v / 100)}
          max={100}
          step={1}
          className="flex-1"
        />
        <span className="text-xs text-muted-foreground w-8 text-right">{Math.round(volume * 100)}%</span>
      </div>

      <AudioDeviceSelector
        outputDevices={outputDevices}
        selectedDevice={selectedDevice}
        onDeviceChange={selectDevice}
        fallbackNotification={fallbackNotification}
        onDismissNotification={dismissNotification}
        description="Select a Bluetooth speaker or plasma device to route audio output"
      />

      {frequency.purpose && (
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">Purpose</p>
          <p className="text-sm">{frequency.purpose}</p>
        </div>
      )}

      {frequency.tags && frequency.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {frequency.tags.map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function FrequencyCard({ frequency, onPlay }: { frequency: Frequency; onPlay: (f: Frequency) => void }) {
  const hz = parseFloat(frequency.frequencyHz);
  const Icon = categoryIcons[frequency.category] || Radio;
  const colorClass = categoryColors[frequency.category] || "bg-gray-500/10 text-gray-400";

  return (
    <Card className="group hover:border-primary/40 transition-all duration-200 cursor-pointer relative overflow-hidden"
          onClick={() => onPlay(frequency)}>
      {frequency.isFeatured && (
        <div className="absolute top-2 right-2">
          <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
        </div>
      )}
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-lg border ${colorClass}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold leading-tight line-clamp-2">
              {frequency.title}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${colorClass}`}>
                {frequency.category.replace("_", " ")}
              </Badge>
              {hz > 0 && (
                <span className="text-xs font-mono text-muted-foreground">{hz} Hz</span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {frequency.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {frequency.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {frequency.waveformType && (
              <span className="flex items-center gap-1">
                <Waves className="h-3 w-3" />
                {frequency.waveformType}
              </span>
            )}
            {frequency.durationSeconds && (
              <span className="flex items-center gap-1">
                <Timer className="h-3 w-3" />
                {formatDuration(frequency.durationSeconds)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {frequency.playCount !== null && frequency.playCount > 0 && (
              <span className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                {frequency.playCount}
              </span>
            )}
          </div>
        </div>
        {frequency.sourceAgent && (
          <div className="mt-2 text-[10px] text-muted-foreground/70">
            Created by {frequency.sourceAgent}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function GenerateToneDialog() {
  const [hz, setHz] = useState("528");
  const [waveform, setWaveform] = useState("sine");
  const [duration, setDuration] = useState("30");
  const [open, setOpen] = useState(false);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/frequencies/generate-tone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frequencyHz: parseFloat(hz),
          durationSeconds: parseInt(duration),
          waveformType: waveform,
          saveToLibrary: true,
          title: `${hz} Hz ${waveform} tone`,
          category: "custom",
        }),
      });
      if (!res.ok) throw new Error("Failed to generate tone");
      return res.json();
    },
    onSuccess: () => setOpen(false),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Generate Tone
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Custom Frequency Tone</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Frequency (Hz)</Label>
            <Input type="number" value={hz} onChange={e => setHz(e.target.value)} min="1" max="20000" />
          </div>
          <div className="space-y-2">
            <Label>Waveform</Label>
            <Select value={waveform} onValueChange={setWaveform}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sine">Sine</SelectItem>
                <SelectItem value="square">Square</SelectItem>
                <SelectItem value="triangle">Triangle</SelectItem>
                <SelectItem value="sawtooth">Sawtooth</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Duration (seconds)</Label>
            <Input type="number" value={duration} onChange={e => setDuration(e.target.value)} min="1" max="600" />
          </div>
          <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending} className="w-full">
            {generateMutation.isPending ? "Generating..." : "Generate & Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RifeProtocolCard({ protocol, onSelect }: { protocol: RifeProtocol; onSelect: (p: RifeProtocol) => void }) {
  const Icon = rifeCategoryIcons[protocol.category] || Zap;
  const colorClass = rifeCategoryColors[protocol.category] || "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";

  return (
    <Card
      className="group hover:border-primary/40 transition-all duration-200 cursor-pointer"
      onClick={() => onSelect(protocol)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-lg border ${colorClass}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold leading-tight line-clamp-2">
              {protocol.conditionName}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${colorClass}`}>
                {protocol.categoryLabel}
              </Badge>
              <span className="text-xs font-mono text-muted-foreground">
                {protocol.frequencyRange}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {protocol.mechanism}
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {protocol.treatmentDuration.split(",")[0]}
          </span>
          <span className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            {protocol.sessionsPerWeek}x/week
          </span>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {protocol.primaryFrequencies.slice(0, 5).map(f => (
            <Badge key={f} variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
              {f} Hz
            </Badge>
          ))}
          {protocol.primaryFrequencies.length > 5 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              +{protocol.primaryFrequencies.length - 5} more
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function RifeProtocolDetail({ protocol, onBack }: { protocol: RifeProtocol; onBack: () => void }) {
  const Icon = rifeCategoryIcons[protocol.category] || Zap;
  const colorClass = rifeCategoryColors[protocol.category] || "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
        <ChevronUp className="h-4 w-4 rotate-[-90deg]" />
        Back to Protocols
      </Button>

      <div className="flex items-start gap-4">
        <div className={`p-4 rounded-xl border ${colorClass}`}>
          <Icon className="h-8 w-8" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{protocol.conditionName}</h2>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className={colorClass}>
              {protocol.categoryLabel}
            </Badge>
            <Badge variant="outline" className="font-mono">
              {protocol.frequencyRange}
            </Badge>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Waves className="h-5 w-5 text-violet-400" />
            Primary Frequencies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {protocol.primaryFrequencies.map(f => (
              <Badge key={f} variant="secondary" className="text-sm px-3 py-1 font-mono">
                {f} Hz
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Dna className="h-5 w-5 text-blue-400" />
            Mechanism of Action
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">{protocol.mechanism}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-400" />
              Session Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{protocol.treatmentDuration}</p>
            <p className="text-sm text-muted-foreground mt-2">
              <strong>Sessions per week:</strong> {protocol.sessionsPerWeek}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Cpu className="h-5 w-5 text-cyan-400" />
              Equipment Needed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-1">
              {protocol.equipment.map((eq, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  {eq}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="border-amber-500/30 bg-amber-950/10">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-400" />
            Safety Protocols
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-2">
            {protocol.safetyProtocols.map((sp, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5 shrink-0">⚠</span>
                {sp}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-red-500/30 bg-red-950/10">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            Contraindications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-2">
            {protocol.contraindications.map((ci, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5 shrink-0">✕</span>
                {ci}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-400" />
            Clinical Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">{protocol.notes}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-violet-400" />
            Research Basis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">{protocol.researchBasis}</p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-1">
        {protocol.tags.map(tag => (
          <Badge key={tag} variant="outline" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function SafetyGuidelinesSection({ safetyData }: { safetyData: RifeSafetyData }) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    general: true,
    contraindications: true,
    herxheimer: false,
    equipment: false,
  });

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4">
      <Card className="border-red-500/30 bg-gradient-to-r from-red-950/20 to-amber-950/10">
        <CardHeader>
          <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection("general")}>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-400" />
              General Safety Guidelines
            </CardTitle>
            {expandedSections.general ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </CardHeader>
        {expandedSections.general && (
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-2">
              {safetyData.safety.generalSafety.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5 shrink-0">⚠</span>
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        )}
      </Card>

      <Card className="border-red-500/40 bg-red-950/10">
        <CardHeader>
          <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection("contraindications")}>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Universal Contraindications
            </CardTitle>
            {expandedSections.contraindications ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </CardHeader>
        {expandedSections.contraindications && (
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-2">
              {safetyData.safety.universalContraindications.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5 shrink-0">✕</span>
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        )}
      </Card>

      <Card className="border-amber-500/30">
        <CardHeader>
          <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection("herxheimer")}>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-5 w-5 text-amber-400" />
              Herxheimer Reaction (Healing Crisis)
            </CardTitle>
            {expandedSections.herxheimer ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </CardHeader>
        {expandedSections.herxheimer && (
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">{safetyData.safety.herxheimerReaction.description}</p>
            <h4 className="text-sm font-semibold mb-2">Management Steps:</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              {safetyData.safety.herxheimerReaction.management.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ol>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection("equipment")}>
            <CardTitle className="text-base flex items-center gap-2">
              <Cpu className="h-5 w-5 text-cyan-400" />
              Equipment Guidelines
            </CardTitle>
            {expandedSections.equipment ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </CardHeader>
        {expandedSections.equipment && (
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-1 flex items-center gap-2">
                <Zap className="h-4 w-4 text-violet-400" />
                Plasma Devices
              </h4>
              <p className="text-sm text-muted-foreground">{safetyData.safety.equipmentGuidelines.plasmaDevices}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-1 flex items-center gap-2">
                <Monitor className="h-4 w-4 text-green-400" />
                Contact Devices
              </h4>
              <p className="text-sm text-muted-foreground">{safetyData.safety.equipmentGuidelines.contactDevices}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-1 flex items-center gap-2">
                <Waves className="h-4 w-4 text-blue-400" />
                PEMF Devices
              </h4>
              <p className="text-sm text-muted-foreground">{safetyData.safety.equipmentGuidelines.pemfDevices}</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export default function FrequencyLibraryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeFrequency, setActiveFrequency] = useState<Frequency | null>(null);
  const [selectedProtocol, setSelectedProtocol] = useState<RifeProtocol | null>(null);
  const [rifeCategory, setRifeCategory] = useState<string>("all");
  const [rifeSearch, setRifeSearch] = useState("");
  const [activeTab, setActiveTab] = useState("library");

  const { data: frequencyList = [], isLoading } = useQuery<Frequency[]>({
    queryKey: ["/api/frequencies", selectedCategory, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory !== "all") params.set("category", selectedCategory);
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/frequencies?${params}`);
      if (!res.ok) throw new Error("Failed to fetch frequencies");
      return res.json();
    },
  });

  const { data: categories = [] } = useQuery<FrequencyCategory[]>({
    queryKey: ["/api/frequencies/categories"],
    queryFn: async () => {
      const res = await fetch("/api/frequencies/categories");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: rifeProtocols = [], isLoading: rifeLoading } = useQuery<RifeProtocol[]>({
    queryKey: ["/api/frequencies/rife-protocols", rifeCategory, rifeSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (rifeCategory !== "all") params.set("category", rifeCategory);
      if (rifeSearch) params.set("search", rifeSearch);
      const res = await fetch(`/api/frequencies/rife-protocols?${params}`);
      if (!res.ok) throw new Error("Failed to fetch Rife protocols");
      return res.json();
    },
  });

  const { data: safetyData } = useQuery<RifeSafetyData>({
    queryKey: ["/api/frequencies/rife-safety"],
    queryFn: async () => {
      const res = await fetch("/api/frequencies/rife-safety");
      if (!res.ok) throw new Error("Failed to fetch safety guidelines");
      return res.json();
    },
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/frequencies/seed", { method: "POST" });
      if (!res.ok) throw new Error("Failed to seed");
      return res.json();
    },
  });

  const featured = frequencyList.filter(f => f.isFeatured);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Radio className="h-8 w-8 text-violet-500" />
              Frequency Healing Library
            </h1>
            <p className="text-muted-foreground mt-1">
              Browse healing frequencies, Rife protocol database, and safety guidelines
            </p>
          </div>
          <div className="flex items-center gap-2">
            <GenerateToneDialog />
            {frequencyList.length === 0 && !isLoading && activeTab === "library" && (
              <Button
                variant="default"
                size="sm"
                onClick={() => seedMutation.mutate()}
                disabled={seedMutation.isPending}
              >
                {seedMutation.isPending ? "Seeding..." : "Load Starter Library"}
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="library" className="gap-2">
              <Music className="h-4 w-4" />
              Audio Library
            </TabsTrigger>
            <TabsTrigger value="rife" className="gap-2">
              <Zap className="h-4 w-4" />
              Rife Protocols
            </TabsTrigger>
            <TabsTrigger value="safety" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Safety
            </TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search frequencies by name, purpose, or description..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.slug} value={cat.slug}>
                      {cat.name}
                    </SelectItem>
                  ))}
                  {categories.length === 0 && (
                    <>
                      <SelectItem value="healing">Healing</SelectItem>
                      <SelectItem value="solfeggio">Solfeggio</SelectItem>
                      <SelectItem value="rife">Rife</SelectItem>
                      <SelectItem value="binaural">Binaural</SelectItem>
                      <SelectItem value="schumann">Schumann</SelectItem>
                      <SelectItem value="dna_repair">DNA Repair</SelectItem>
                      <SelectItem value="pain_relief">Pain Relief</SelectItem>
                      <SelectItem value="relaxation">Relaxation</SelectItem>
                      <SelectItem value="longevity">Longevity</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {activeFrequency && (
              <Card className="border-violet-500/30 bg-gradient-to-r from-violet-950/20 to-indigo-950/20">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Waves className="h-5 w-5 text-violet-400" />
                      Now Playing
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setActiveFrequency(null)}>
                      Close
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <FrequencyPlayer frequency={activeFrequency} onClose={() => setActiveFrequency(null)} />
                </CardContent>
              </Card>
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-3/4 mb-2" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-3 w-full mb-2" />
                      <Skeleton className="h-3 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : frequencyList.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <Radio className="h-16 w-16 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Frequencies Found</h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-md">
                    {searchQuery || selectedCategory !== "all"
                      ? "No frequencies match your current filters. Try adjusting your search or category."
                      : "The frequency library is empty. Load the starter library to get started with well-known healing frequencies."}
                  </p>
                  {!searchQuery && selectedCategory === "all" && (
                    <Button onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}>
                      {seedMutation.isPending ? "Loading..." : "Load Starter Library"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Tabs defaultValue="all" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="all">All ({frequencyList.length})</TabsTrigger>
                  {featured.length > 0 && (
                    <TabsTrigger value="featured">Featured ({featured.length})</TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="all">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {frequencyList.map(freq => (
                      <FrequencyCard key={freq.id} frequency={freq} onPlay={setActiveFrequency} />
                    ))}
                  </div>
                </TabsContent>

                {featured.length > 0 && (
                  <TabsContent value="featured">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {featured.map(freq => (
                        <FrequencyCard key={freq.id} frequency={freq} onPlay={setActiveFrequency} />
                      ))}
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            )}

            <Card className="bg-muted/30 border-dashed">
              <CardContent className="py-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
                    <Bluetooth className="h-6 w-6 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Bluetooth & Plasma Device Support</h3>
                    <p className="text-sm text-muted-foreground">
                      Connect your Bluetooth speakers or plasma frequency devices to transmit healing frequencies.
                      When playing a frequency, use the audio output selector to route sound to any paired Bluetooth device.
                      Your device receives standard audio — no special firmware required.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rife" className="space-y-6">
            {selectedProtocol ? (
              <RifeProtocolDetail
                protocol={selectedProtocol}
                onBack={() => setSelectedProtocol(null)}
              />
            ) : (
              <>
                <Card className="bg-gradient-to-r from-yellow-950/20 to-amber-950/10 border-yellow-500/30">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                        <Zap className="h-6 w-6 text-yellow-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Rife Frequency Protocol Database</h3>
                        <p className="text-sm text-muted-foreground">
                          Comprehensive protocols based on Dr. Royal Rife's research, organized by condition category.
                          Each protocol includes specific frequencies, mechanisms, treatment schedules, equipment requirements,
                          and safety guidelines. Always consult a healthcare provider before beginning any frequency protocol.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by condition, symptom, or keyword..."
                      value={rifeSearch}
                      onChange={e => setRifeSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={rifeCategory} onValueChange={setRifeCategory}>
                    <SelectTrigger className="w-full md:w-[250px]">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="infectious">Infectious Diseases</SelectItem>
                      <SelectItem value="chronic">Chronic Conditions</SelectItem>
                      <SelectItem value="detox_cellular_repair">Detox & Cellular Repair</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {rifeLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Card key={i}>
                        <CardHeader>
                          <div className="flex items-start gap-3">
                            <Skeleton className="h-10 w-10 rounded-lg" />
                            <div className="flex-1">
                              <Skeleton className="h-4 w-3/4 mb-2" />
                              <Skeleton className="h-3 w-1/2" />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-3 w-full mb-2" />
                          <Skeleton className="h-3 w-2/3" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : rifeProtocols.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                      <Zap className="h-16 w-16 text-muted-foreground/30 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Protocols Found</h3>
                      <p className="text-sm text-muted-foreground max-w-md">
                        No Rife protocols match your search criteria. Try adjusting your search or category filter.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      {rifeProtocols.length} protocol{rifeProtocols.length !== 1 ? "s" : ""} found
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {rifeProtocols.map(protocol => (
                        <RifeProtocolCard
                          key={protocol.id}
                          protocol={protocol}
                          onSelect={setSelectedProtocol}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="safety" className="space-y-6">
            <Card className="bg-gradient-to-r from-red-950/20 to-amber-950/10 border-red-500/30">
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <AlertTriangle className="h-6 w-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Important Safety Information</h3>
                    <p className="text-sm text-muted-foreground">
                      Rife frequency therapy is a complementary approach and should never replace conventional medical care.
                      Always consult with a qualified healthcare provider before beginning any frequency protocol.
                      Review all contraindications and safety guidelines carefully before use.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {safetyData ? (
              <SafetyGuidelinesSection safetyData={safetyData} />
            ) : (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-5 w-1/3" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-3 w-full mb-2" />
                      <Skeleton className="h-3 w-4/5 mb-2" />
                      <Skeleton className="h-3 w-3/5" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
