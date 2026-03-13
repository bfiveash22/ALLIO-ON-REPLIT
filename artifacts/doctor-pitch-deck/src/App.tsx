import { useEffect, useState, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

import { slides } from "@/slideLoader";

function getSlideIndex(pathname: string): number {
  const match = pathname.match(/^\/slide(\d+)$/);
  if (!match) return -1;
  const position = parseInt(match[1], 10);
  return slides.findIndex((s) => s.position === position);
}

function SlideEditor() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentIndex = getSlideIndex(location.pathname);

  useEffect(() => {
    if (currentIndex === -1) return;

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === " ") {
        event.preventDefault();
      }
      if ((event.key === "ArrowLeft" || event.key === "ArrowUp") && currentIndex > 0) {
        navigate(`/slide${slides[currentIndex - 1].position}`);
      }
      if (
        (event.key === "ArrowRight" || event.key === "ArrowDown" || event.key === " ") &&
        currentIndex < slides.length - 1
      ) {
        navigate(`/slide${slides[currentIndex + 1].position}`);
      }
    };

    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey) return;
      const fraction = event.clientX / window.innerWidth;
      if (fraction < 0.4 && currentIndex > 0) {
        navigate(`/slide${slides[currentIndex - 1].position}`);
      } else if (fraction >= 0.4 && currentIndex < slides.length - 1) {
        navigate(`/slide${slides[currentIndex + 1].position}`);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("click", onClick);
    };
  }, [currentIndex, navigate]);

  return (
    <>
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          style={{ display: index === currentIndex ? "block" : "none" }}
        >
          <slide.Component />
        </div>
      ))}
      <DownloadButton />
    </>
  );
}

function AllSlides() {
  return (
    <div className="bg-black">
      {slides.map((slide) => (
        <div
          key={slide.id}
          className="slide relative aspect-video overflow-hidden"
          style={{ width: "1920px", height: "1080px" }}
        >
          <div className="h-full w-full [&_.h-screen]:!h-full [&_.w-screen]:!w-full">
            <slide.Component />
          </div>
        </div>
      ))}
    </div>
  );
}

function DownloadButton() {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    setProgress("Preparing slides...");

    try {
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [1920, 1080] });
      const container = containerRef.current;
      if (!container) return;

      container.style.display = "block";

      await new Promise(r => setTimeout(r, 500));

      const slideElements = container.querySelectorAll<HTMLElement>(".pdf-slide");

      for (let i = 0; i < slideElements.length; i++) {
        setProgress(`Rendering slide ${i + 1} of ${slideElements.length}...`);
        const el = slideElements[i];

        const canvas = await html2canvas(el, {
          width: 1920,
          height: 1080,
          scale: 1,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#000000",
          logging: false,
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.92);

        if (i > 0) pdf.addPage([1920, 1080], "landscape");
        pdf.addImage(imgData, "JPEG", 0, 0, 1920, 1080);
      }

      container.style.display = "none";

      setProgress("Saving PDF...");
      pdf.save("ALLIO-Doctor-Pitch-Deck.pdf");
      setProgress("");
    } catch (err) {
      console.error("PDF generation failed:", err);
      setProgress("Download failed. Try Print to PDF instead.");
      setTimeout(() => setProgress(""), 3000);
    } finally {
      setDownloading(false);
      if (containerRef.current) containerRef.current.style.display = "none";
    }
  }, []);

  return (
    <>
      <button
        onClick={handleDownload}
        disabled={downloading}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 9999,
          padding: "12px 24px",
          borderRadius: "12px",
          border: "none",
          background: downloading ? "#374151" : "linear-gradient(135deg, #00D4AA, #0ea5e9)",
          color: "white",
          fontSize: "14px",
          fontWeight: 600,
          cursor: downloading ? "not-allowed" : "pointer",
          boxShadow: "0 4px 20px rgba(0,212,170,0.3)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          transition: "all 0.2s",
        }}
      >
        {downloading ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
            {progress}
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download PDF
          </>
        )}
      </button>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div ref={containerRef} style={{ position: "fixed", left: "-9999px", top: 0, display: "none" }}>
        {slides.map((slide) => (
          <div key={slide.id} className="pdf-slide" style={{ width: "1920px", height: "1080px", overflow: "hidden" }}>
            <div className="h-full w-full [&_.h-screen]:!h-full [&_.w-screen]:!w-full">
              <slide.Component />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // DO NOT edit this useEffect
  useEffect(() => {
    if (location.pathname === "/" || getSlideIndex(location.pathname) === -1) {
      if (location.pathname !== "/allslides" && slides.length > 0) {
        navigate(`/slide${slides[0].position}`, { replace: true });
      }
    }
  }, [location.pathname, navigate]);

  // DO NOT edit this useEffect, this allows the parent frame to navigate
  // between slides via postMessage so it can avoid changing the iframe 
  // src (which causes a white flash).
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (
        event.data?.type === "navigateToSlide" &&
        typeof event.data.position === "number" &&
        slides.some((s) => s.position === event.data.position)
      ) {
        navigate(`/slide${event.data.position}`);
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [navigate]);

  if (location.pathname === "/allslides") {
    return <AllSlides />;
  }

  return <SlideEditor />;
}
