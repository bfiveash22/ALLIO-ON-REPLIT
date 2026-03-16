import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  FileText,
  Video,
  Headphones,
  BookOpen,
  ExternalLink,
  Download,
  Maximize,
  RefreshCw,
} from "lucide-react";
import { useAudioOutputDevice } from "@/hooks/useAudioOutputDevice";
import { AudioDeviceSelector } from "@/components/AudioDeviceSelector";

interface TrainingPlayerProps {
  title: string;
  description?: string;
  videoUrl?: string | null;
  audioUrl?: string | null;
  pdfUrl?: string | null;
  driveFileId?: string | null;
  transcriptUrl?: string | null;
  sections?: Array<{ title: string; content: string }>;
  keyPoints?: string[];
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
}

export function InteractiveTrainingPlayer({
  title,
  description,
  videoUrl,
  audioUrl,
  pdfUrl,
  driveFileId,
  transcriptUrl,
  sections,
  keyPoints,
  onProgress,
  onComplete,
}: TrainingPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [activeTab, setActiveTab] = useState<string>("content");
  const [currentSection, setCurrentSection] = useState(0);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [hasGeneratedAudio, setHasGeneratedAudio] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const {
    outputDevices,
    selectedDevice,
    selectDevice,
    applySinkId,
    fallbackNotification,
    dismissNotification,
  } = useAudioOutputDevice();

  const mediaRef = videoUrl ? videoRef : audioRef;
  const hasVideo = !!videoUrl;
  const hasAudio = !!audioUrl;
  const hasPdf = !!pdfUrl || !!driveFileId;
  const hasSections = sections && sections.length > 0;

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const handleTimeUpdate = () => {
      setCurrentTime(media.currentTime);
      const progress = (media.currentTime / media.duration) * 100;
      onProgress?.(progress);
    };

    const handleDurationChange = () => {
      setDuration(media.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onComplete?.();
    };

    media.addEventListener("timeupdate", handleTimeUpdate);
    media.addEventListener("durationchange", handleDurationChange);
    media.addEventListener("ended", handleEnded);

    return () => {
      media.removeEventListener("timeupdate", handleTimeUpdate);
      media.removeEventListener("durationchange", handleDurationChange);
      media.removeEventListener("ended", handleEnded);
    };
  }, [onProgress, onComplete, mediaRef]);

  useEffect(() => {
    const media = mediaRef.current;
    if (media) {
      applySinkId(media);
    }
  }, [selectedDevice, applySinkId, mediaRef]);

  const togglePlay = () => {
    const media = mediaRef.current;
    if (!media) return;

    if (isPlaying) {
      media.pause();
    } else {
      media.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const media = mediaRef.current;
    if (!media) return;

    media.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (value: number[]) => {
    const media = mediaRef.current;
    if (!media) return;

    const newVolume = value[0];
    media.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleSeek = (value: number[]) => {
    const media = mediaRef.current;
    if (!media) return;

    media.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const skipBack = () => {
    const media = mediaRef.current;
    if (!media) return;
    media.currentTime = Math.max(0, media.currentTime - 10);
  };

  const skipForward = () => {
    const media = mediaRef.current;
    if (!media) return;
    media.currentTime = Math.min(duration, media.currentTime + 10);
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const generateAudioNarration = async () => {
    if (!sections || sections.length === 0) return;
    
    setIsGeneratingAudio(true);
    try {
      const text = sections.map(s => `${s.title}. ${s.content}`).join(" ");
      const response = await fetch("/api/tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: "alloy" }),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        if (!audioRef.current) {
          const audio = new Audio();
          audio.addEventListener("timeupdate", () => {
            setCurrentTime(audio.currentTime);
            const progress = (audio.currentTime / audio.duration) * 100;
            onProgress?.(progress);
          });
          audio.addEventListener("durationchange", () => setDuration(audio.duration));
          audio.addEventListener("ended", () => {
            setIsPlaying(false);
            onComplete?.();
          });
          audioRef.current = audio;
        }
        const currentAudio = audioRef.current!;
        currentAudio.src = url;
        await applySinkId(currentAudio);
        setHasGeneratedAudio(true);
        setActiveTab("media");
      }
    } catch (error) {
      console.error("Failed to generate audio narration:", error);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const getPdfViewerUrl = () => {
    if (pdfUrl?.includes("drive.google.com")) {
      const fileId = pdfUrl.match(/\/d\/([^/]+)/)?.[1] || driveFileId;
      if (fileId) {
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }
    if (driveFileId) {
      return `https://drive.google.com/file/d/${driveFileId}/preview`;
    }
    return pdfUrl || "";
  };

  return (
    <Card className="border-card-border overflow-hidden" data-testid="interactive-training-player">
      <CardHeader className="pb-4 bg-gradient-to-r from-primary/10 to-cyan-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {hasVideo && <Video className="h-5 w-5 text-primary" />}
            {hasAudio && !hasVideo && <Headphones className="h-5 w-5 text-primary" />}
            {hasPdf && !hasVideo && !hasAudio && <FileText className="h-5 w-5 text-primary" />}
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              {description && (
                <CardDescription className="mt-1">{description}</CardDescription>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasVideo && <Badge variant="secondary">Video</Badge>}
            {hasAudio && <Badge variant="secondary">Audio</Badge>}
            {hasPdf && <Badge variant="secondary">PDF</Badge>}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
            {hasSections && (
              <TabsTrigger
                value="content"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-3"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Content
              </TabsTrigger>
            )}
            {(hasVideo || hasAudio || hasGeneratedAudio) && (
              <TabsTrigger
                value="media"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-3"
              >
                {hasVideo ? <Video className="h-4 w-4 mr-2" /> : <Headphones className="h-4 w-4 mr-2" />}
                {hasVideo ? "Video" : "Audio"}
              </TabsTrigger>
            )}
            {hasPdf && (
              <TabsTrigger
                value="pdf"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-3"
              >
                <FileText className="h-4 w-4 mr-2" />
                Document
              </TabsTrigger>
            )}
          </TabsList>

          {hasSections && (
            <TabsContent value="content" className="p-6 space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Section {currentSection + 1} of {sections!.length}
                  </span>
                </div>
                {!hasAudio && sections && sections.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateAudioNarration}
                    disabled={isGeneratingAudio}
                    data-testid="button-generate-audio"
                  >
                    {isGeneratingAudio ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Headphones className="h-4 w-4 mr-2" />
                    )}
                    {isGeneratingAudio ? "Generating..." : "Listen to Audio"}
                  </Button>
                )}
              </div>

              <Progress 
                value={((currentSection + 1) / sections!.length) * 100} 
                className="h-2"
              />

              <div className="space-y-4">
                <h3 className="text-xl font-semibold flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {currentSection + 1}
                  </span>
                  {sections![currentSection].title}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-base pl-11">
                  {sections![currentSection].content}
                </p>
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
                  disabled={currentSection === 0}
                  data-testid="button-prev-section"
                >
                  <SkipBack className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                <Button
                  onClick={() => {
                    if (currentSection < sections!.length - 1) {
                      setCurrentSection(currentSection + 1);
                    } else {
                      onComplete?.();
                    }
                  }}
                  data-testid="button-next-section"
                >
                  {currentSection < sections!.length - 1 ? (
                    <>
                      Next
                      <SkipForward className="h-4 w-4 ml-2" />
                    </>
                  ) : (
                    "Complete Module"
                  )}
                </Button>
              </div>

              {keyPoints && keyPoints.length > 0 && currentSection === sections!.length - 1 && (
                <div className="bg-muted/50 rounded-lg p-4 mt-6">
                  <h4 className="font-semibold mb-2">Key Takeaways</h4>
                  <ul className="space-y-1 text-sm">
                    {keyPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>
          )}

          {(hasVideo || hasAudio || hasGeneratedAudio) && (
            <TabsContent value="media" className="p-0">
              {hasVideo && (
                <div className="relative bg-black aspect-video">
                  <video
                    ref={videoRef}
                    src={videoUrl || undefined}
                    className="w-full h-full"
                    playsInline
                  />
                </div>
              )}

              {(hasAudio || hasGeneratedAudio) && !hasVideo && (
                <div className="p-6 bg-gradient-to-br from-primary/5 to-cyan-500/5">
                  <div className="flex items-center justify-center py-12">
                    <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
                      <Headphones className={`h-16 w-16 text-primary ${isPlaying ? "animate-pulse" : ""}`} />
                    </div>
                  </div>
                  {hasAudio && <audio ref={audioRef} src={audioUrl || undefined} />}
                </div>
              )}

              <div className="p-4 bg-muted/50 space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {formatTime(currentTime)}
                  </span>
                  <Slider
                    value={[currentTime]}
                    max={duration || 100}
                    step={1}
                    onValueChange={handleSeek}
                    className="flex-1"
                    data-testid="slider-progress"
                  />
                  <span className="text-sm text-muted-foreground w-12">
                    {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={skipBack} data-testid="button-skip-back">
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      className="h-10 w-10"
                      onClick={togglePlay}
                      data-testid="button-play-pause"
                    >
                      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={skipForward} data-testid="button-skip-forward">
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={toggleMute} data-testid="button-mute">
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      max={1}
                      step={0.1}
                      onValueChange={handleVolumeChange}
                      className="w-24"
                      data-testid="slider-volume"
                    />
                  </div>
                </div>

                <AudioDeviceSelector
                  outputDevices={outputDevices}
                  selectedDevice={selectedDevice}
                  onDeviceChange={selectDevice}
                  fallbackNotification={fallbackNotification}
                  onDismissNotification={dismissNotification}
                  compact
                />
              </div>
            </TabsContent>
          )}

          {hasPdf && (
            <TabsContent value="pdf" className="p-0">
              <div className="relative">
                <iframe
                  src={getPdfViewerUrl()}
                  className="w-full h-[600px] border-0"
                  title="Training Document"
                  allow="autoplay"
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    asChild
                    data-testid="button-open-pdf"
                  >
                    <a href={pdfUrl || `https://drive.google.com/file/d/${driveFileId}/view`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open in Drive
                    </a>
                  </Button>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}

export function AudioNarrationButton({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { applySinkId } = useAudioOutputDevice();

  const handleClick = async () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: "alloy" }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;

        await applySinkId(audio);
        
        audio.onended = () => setIsPlaying(false);
        audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Failed to generate audio:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isLoading}
      className={className}
      data-testid="button-audio-narration"
    >
      {isLoading ? (
        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
      ) : isPlaying ? (
        <Pause className="h-4 w-4 mr-2" />
      ) : (
        <Headphones className="h-4 w-4 mr-2" />
      )}
      {isLoading ? "Generating..." : isPlaying ? "Pause" : "Listen"}
    </Button>
  );
}
