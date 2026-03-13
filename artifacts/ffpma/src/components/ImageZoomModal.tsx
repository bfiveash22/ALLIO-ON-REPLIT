import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageZoomModalProps {
  images: Array<{ id?: number; src: string; alt?: string }>;
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  productName: string;
}

export default function ImageZoomModal({
  images,
  currentIndex,
  isOpen,
  onClose,
  onIndexChange,
  productName,
}: ImageZoomModalProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const positionStart = useRef({ x: 0, y: 0 });

  const currentImage = images[currentIndex];

  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.5, 4));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => {
      const newScale = Math.max(prev - 0.5, 1);
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  }, []);

  const handlePrevious = useCallback(() => {
    resetZoom();
    onIndexChange((currentIndex - 1 + images.length) % images.length);
  }, [currentIndex, images.length, onIndexChange, resetZoom]);

  const handleNext = useCallback(() => {
    resetZoom();
    onIndexChange((currentIndex + 1) % images.length);
  }, [currentIndex, images.length, onIndexChange, resetZoom]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (scale > 1) {
        setIsDragging(true);
        dragStart.current = { x: e.clientX, y: e.clientY };
        positionStart.current = { ...position };
      }
    },
    [scale, position]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging && scale > 1) {
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        setPosition({
          x: positionStart.current.x + dx,
          y: positionStart.current.y + dy,
        });
      }
    },
    [isDragging, scale]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        handleZoomIn();
      } else {
        handleZoomOut();
      }
    },
    [handleZoomIn, handleZoomOut]
  );

  const handleDoubleClick = useCallback(() => {
    if (scale > 1) {
      resetZoom();
    } else {
      setScale(2);
    }
  }, [scale, resetZoom]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          handlePrevious();
          break;
        case "ArrowRight":
          handleNext();
          break;
        case "+":
        case "=":
          handleZoomIn();
          break;
        case "-":
          handleZoomOut();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, handlePrevious, handleNext, handleZoomIn, handleZoomOut]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    resetZoom();
  }, [currentIndex, resetZoom]);

  if (!isOpen || !currentImage) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        data-testid="image-zoom-modal"
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-50 text-white/80 hover:text-white hover:bg-white/10 h-12 w-12"
          onClick={onClose}
          data-testid="button-close-zoom"
        >
          <X className="h-6 w-6" />
        </Button>

        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-900/80 rounded-full px-4 py-2 border border-white/10">
          <Button
            variant="ghost"
            size="icon"
            className="text-white/80 hover:text-white hover:bg-white/10 h-8 w-8"
            onClick={handleZoomOut}
            disabled={scale <= 1}
            data-testid="button-zoom-out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-white/80 text-sm min-w-[3rem] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/80 hover:text-white hover:bg-white/10 h-8 w-8"
            onClick={handleZoomIn}
            disabled={scale >= 4}
            data-testid="button-zoom-in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white/80 hover:text-white hover:bg-white/10 h-12 w-12"
              onClick={handlePrevious}
              data-testid="button-zoom-previous"
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white/80 hover:text-white hover:bg-white/10 h-12 w-12"
              onClick={handleNext}
              data-testid="button-zoom-next"
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          </>
        )}

        <div
          ref={containerRef}
          className="relative w-full h-full flex items-center justify-center overflow-hidden"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onDoubleClick={handleDoubleClick}
          style={{ cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in" }}
        >
          <motion.img
            src={currentImage.src}
            alt={currentImage.alt || `${productName} - Image ${currentIndex + 1}`}
            className="max-w-[90vw] max-h-[85vh] object-contain select-none"
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              transition: isDragging ? "none" : "transform 0.2s ease-out",
            }}
            draggable={false}
            data-testid="img-zoomed"
          />
        </div>

        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4">
            <span className="text-white/60 text-sm">
              {currentIndex + 1} / {images.length}
            </span>
            <div className="flex gap-2">
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => {
                    resetZoom();
                    onIndexChange(idx);
                  }}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                    currentIndex === idx
                      ? "border-cyan-400 ring-2 ring-cyan-400/30"
                      : "border-white/20 hover:border-white/40 opacity-60 hover:opacity-100"
                  }`}
                  data-testid={`zoom-thumbnail-${idx}`}
                >
                  <img
                    src={img.src}
                    alt={img.alt || `Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="absolute bottom-4 right-4 text-white/40 text-xs">
          Double-click to zoom • Scroll to adjust • Drag to pan
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
