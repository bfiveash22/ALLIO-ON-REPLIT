import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  RefreshCw,
  User,
  Waves,
} from "lucide-react";
import { motion } from "framer-motion";

interface DrMillerNarrationProps {
  sectionTitle: string;
  sectionContent: string;
  instructorName?: string;
  instructorTitle?: string;
  onComplete?: () => void;
  autoPlay?: boolean;
}

export function DrMillerNarration({
  sectionTitle,
  sectionContent,
  instructorName = "Dr. Miller",
  instructorTitle = "Medical Director",
  onComplete,
  autoPlay = false,
}: DrMillerNarrationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasGenerated, setHasGenerated] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const generateNarration = async () => {
    setIsLoading(true);
    try {
      const narrationText = `${sectionTitle}. ${sectionContent}`;
      
      const response = await fetch("/api/tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: narrationText, 
          voice: "onyx"
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        
        audio.volume = volume;
        audio.muted = isMuted;
        
        audio.onloadedmetadata = () => {
          setDuration(audio.duration);
        };
        
        audio.ontimeupdate = () => {
          setCurrentTime(audio.currentTime);
        };
        
        audio.onended = () => {
          setIsPlaying(false);
          onComplete?.();
        };
        
        setHasGenerated(true);
        
        if (autoPlay) {
          audio.play();
          setIsPlaying(true);
        }
      }
    } catch (error) {
      console.error("Failed to generate Dr. Miller narration:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) {
      generateNarration();
      return;
    }
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
    };
  }, []);

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-cyan-500/5">
      <CardContent className="py-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center">
              <User className="h-7 w-7 text-white" />
            </div>
            {isPlaying && (
              <motion.div
                className="absolute -inset-1 rounded-full border-2 border-primary/50"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm">{instructorName}</span>
              <Badge variant="secondary" className="text-xs">
                {instructorTitle}
              </Badge>
            </div>
            
            {hasGenerated ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-10">
                    {formatTime(currentTime)}
                  </span>
                  <Slider
                    value={[currentTime]}
                    max={duration || 100}
                    step={0.1}
                    onValueChange={handleSeek}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground w-10 text-right">
                    {formatTime(duration)}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={togglePlay}
                    data-testid="button-dr-miller-play"
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4 ml-0.5" />
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={toggleMute}
                  >
                    {isMuted ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    max={1}
                    step={0.1}
                    onValueChange={handleVolumeChange}
                    className="w-20"
                  />
                  
                  {isPlaying && (
                    <div className="flex items-center gap-1 ml-2">
                      <Waves className="h-4 w-4 text-primary animate-pulse" />
                      <span className="text-xs text-primary">Playing</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={generateNarration}
                disabled={isLoading}
                data-testid="button-generate-dr-miller-narration"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating narration...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Listen to {instructorName}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
