import { useState, useRef, useEffect } from "react";

interface VideoBackgroundProps {
  videoUrl: string;
  fallbackImage?: string;
  overlay?: string;
  className?: string;
  children?: React.ReactNode;
}

export function VideoBackground({ 
  videoUrl, 
  fallbackImage,
  overlay = "bg-black/40",
  className = "",
  children 
}: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (video && !prefersReducedMotion) {
      video.playbackRate = 0.75;
    }
  }, [prefersReducedMotion]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!prefersReducedMotion && (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoadedData={() => setIsLoaded(true)}
          poster={fallbackImage}
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      )}
      
      {(fallbackImage && (!isLoaded || prefersReducedMotion)) && (
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${fallbackImage})` }}
          aria-hidden="true"
        />
      )}
      
      <div className={`absolute inset-0 ${overlay}`} aria-hidden="true" />
      
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

export const PEXELS_VIDEOS = {
  waterSurface: "https://videos.pexels.com/video-files/10988217/10988217-uhd_2560_1440_24fps.mp4",
  abstractLiquid: "https://videos.pexels.com/video-files/3971167/3971167-hd_1920_1080_24fps.mp4",
  waterDroplets: "https://videos.pexels.com/video-files/7565821/7565821-uhd_2560_1440_24fps.mp4",
  oceanWaves: "https://videos.pexels.com/video-files/1093662/1093662-uhd_2560_1440_30fps.mp4",
  abstractBlue: "https://videos.pexels.com/video-files/856973/856973-hd_1280_720_25fps.mp4",
  dnaHelix: "https://videos.pexels.com/video-files/3129671/3129671-uhd_2560_1440_25fps.mp4",
  cellsAbstract: "https://videos.pexels.com/video-files/3129957/3129957-uhd_2560_1440_25fps.mp4",
  cosmicEnergy: "https://videos.pexels.com/video-files/3129977/3129977-uhd_2560_1440_25fps.mp4",
};
