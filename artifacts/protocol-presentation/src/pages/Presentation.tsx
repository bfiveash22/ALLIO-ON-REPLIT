import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "wouter";
import SlideRenderer from "../components/SlideRenderer";
import { buildSlides } from "../lib/slide-builder";
import { buildKathrynSmithDemoData } from "../lib/demo-data";
import type { SlideData } from "../lib/types";

export default function Presentation() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [protocolId, setProtocolId] = useState<number | null>(null);
  const [patientName, setPatientName] = useState("");
  const [transitioning, setTransitioning] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [narrationText, setNarrationText] = useState("");
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const params = useParams<{ id?: string }>();

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const queryId = queryParams.get("id");
    const routeId = params.id;
    const id = routeId || queryId;

    if (id) {
      const parsed = parseInt(id);
      if (!isNaN(parsed)) {
        setProtocolId(parsed);
        fetchProtocol(parsed);
        return;
      }
    }
    {
      const demo = buildKathrynSmithDemoData();
      const builtSlides = buildSlides(demo.protocol, demo.profile, demo.citations, demo.trusteeNotes);
      setSlides(builtSlides);
      setPatientName(demo.protocol.patientName);
      setLoading(false);
    }
  }, [params.id]);

  async function fetchProtocol(id: number) {
    try {
      const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, "");
      const apiBase = baseUrl.replace("/protocol-presentation", "");
      const res = await fetch(`${apiBase}/api/protocol-assembly/protocols/${id}/presentation`, {
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to fetch protocol");
      const data = await res.json();
      const builtSlides = buildSlides(data.protocol, data.profile, data.citations, data.trusteeNotes);
      setSlides(builtSlides);
      setPatientName(data.patientName);
    } catch (err) {
      console.warn("Failed to fetch protocol, using demo data:", err);
      const demo = buildKathrynSmithDemoData();
      const builtSlides = buildSlides(demo.protocol, demo.profile, demo.citations, demo.trusteeNotes);
      setSlides(builtSlides);
      setPatientName(demo.protocol.patientName);
    } finally {
      setLoading(false);
    }
  }

  const speak = useCallback((text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.name.includes("Google") && v.lang.startsWith("en")) ||
                      voices.find(v => v.lang.startsWith("en-US")) ||
                      voices[0];
    if (preferred) utterance.voice = preferred;
    utterance.onend = () => {
      if (currentSlide < slides.length - 1) {
        setTransitioning(true);
        if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = setTimeout(() => {
          setCurrentSlide(prev => prev + 1);
          setTransitioning(false);
        }, 300);
      } else {
        setIsPlaying(false);
      }
    };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [currentSlide, slides.length]);

  useEffect(() => {
    if (slides[currentSlide]) {
      setNarrationText(slides[currentSlide].narration);
    }
  }, [currentSlide, slides]);

  useEffect(() => {
    if (isPlaying && slides[currentSlide]) {
      speak(slides[currentSlide].narration);
    }
  }, [isPlaying, currentSlide, slides, speak]);

  const togglePlay = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
    }
  };

  const goToSlide = (index: number) => {
    window.speechSynthesis.cancel();
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    setTransitioning(true);
    transitionTimerRef.current = setTimeout(() => {
      setCurrentSlide(index);
      setNarrationText(slides[index]?.narration || "");
      setTransitioning(false);
    }, 300);
  };

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      goToSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1);
    }
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); nextSlide(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); prevSlide(); }
      else if (e.key === "p" || e.key === "P") { togglePlay(); }
      else if (e.key === "t" || e.key === "T") { setShowThumbnails(prev => !prev); }
      else if (e.key === "Escape") { setShowThumbnails(false); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentSlide, slides.length, isPlaying]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center" style={{ background: "#0A1628" }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#00D4AA]/30 border-t-[#00D4AA] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Loading Protocol Presentation...</p>
        </div>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="h-screen w-screen flex items-center justify-center" style={{ background: "#0A1628" }}>
        <p className="text-gray-400">No slides available</p>
      </div>
    );
  }

  const copyShareLink = () => {
    const baseUrl = window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, "");
    const shareUrl = protocolId ? `${baseUrl}/protocol/${protocolId}` : window.location.href;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShowShareMenu(false);
    }).catch(() => {
      setShowShareMenu(false);
    });
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ background: "#0A1628" }}>
      <div className="flex-1 relative overflow-hidden">
        <div className={`absolute inset-0 slide-transition ${transitioning ? "opacity-0 scale-[0.98]" : "opacity-100 scale-100"}`}>
          <SlideRenderer slide={slides[currentSlide]} />
        </div>

        <button onClick={prevSlide} disabled={currentSlide === 0}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white disabled:opacity-20 transition-all z-10">
          ◀
        </button>
        <button onClick={nextSlide} disabled={currentSlide === slides.length - 1}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white disabled:opacity-20 transition-all z-10">
          ▶
        </button>

        {isPlaying && narrationText && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-2xl z-10">
            <div className="narration-highlight bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2">
              <p className="text-gray-300 text-xs leading-relaxed line-clamp-2">{narrationText}</p>
            </div>
          </div>
        )}
      </div>

      <div className="h-16 bg-black/50 border-t border-white/10 flex items-center px-6 gap-4 shrink-0">
        <button onClick={togglePlay}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isPlaying ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-[#00D4AA]/20 text-[#00D4AA] border border-[#00D4AA]/30"}`}>
          {isPlaying ? "⏸ Pause" : "▶ Play Narration"}
        </button>

        <button onClick={() => setShowThumbnails(prev => !prev)}
          className="px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white bg-white/5 border border-white/10 transition-all">
          📑 Slides
        </button>

        <div className="relative">
          <button onClick={() => setShowShareMenu(prev => !prev)}
            className="px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white bg-white/5 border border-white/10 transition-all">
            🔗 Share
          </button>
          {showShareMenu && (
            <div className="absolute bottom-12 left-0 bg-gray-900 border border-white/10 rounded-lg p-3 min-w-[200px] z-50 shadow-xl">
              <button onClick={copyShareLink} className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded transition-all">
                📋 Copy presentation link
              </button>
              <button onClick={() => { window.print(); setShowShareMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded transition-all">
                🖨️ Print / Save as PDF
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 flex items-center gap-2">
          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-[#00D4AA] rounded-full transition-all duration-500" style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }} />
          </div>
          <span className="text-gray-400 text-xs min-w-[60px] text-right">
            {currentSlide + 1} / {slides.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-xs">{patientName}</span>
          <div className="w-6 h-6 rounded-full border border-[#00D4AA] flex items-center justify-center">
            <span className="text-[#00D4AA] text-xs font-bold">FF</span>
          </div>
        </div>
      </div>

      {showThumbnails && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col" onClick={() => setShowThumbnails(false)}>
          <div className="p-4 flex items-center justify-between border-b border-white/10">
            <h3 className="text-white font-semibold">All Slides ({slides.length})</h3>
            <button onClick={() => setShowThumbnails(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
          </div>
          <div className="flex-1 overflow-auto p-4" onClick={e => e.stopPropagation()}>
            <div className="grid grid-cols-4 gap-4">
              {slides.map((slide, i) => (
                <button key={i} onClick={() => { goToSlide(i); setShowThumbnails(false); }}
                  className={`text-left rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${i === currentSlide ? "border-[#00D4AA]" : "border-white/10 hover:border-white/30"}`}>
                  <div className="aspect-video bg-gray-900 p-3 relative overflow-hidden" style={{ fontSize: "6px" }}>
                    <p className="text-white font-bold text-xs truncate">{slide.title}</p>
                    <p className="text-gray-500 text-xs mt-1 truncate">{slide.type}</p>
                  </div>
                  <div className="p-2 bg-black/50">
                    <p className="text-gray-300 text-xs truncate">{i + 1}. {slide.title}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
