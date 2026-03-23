import { useEffect, useState } from "react";
import { Award, Star, X } from "lucide-react";

interface AchievementToastProps {
  name: string;
  description: string;
  points: number;
  icon?: string;
  color?: string;
  onClose: () => void;
}

export function AchievementToast({ name, description, points, color, onClose }: AchievementToastProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => handleClose(), 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setExiting(true);
    setTimeout(onClose, 300);
  };

  const bgColor = color || "cyan";
  const colorMap: Record<string, string> = {
    gold: "from-amber-500/20 to-amber-600/10 border-amber-500/30",
    cyan: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30",
    emerald: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
    purple: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
    bronze: "from-orange-500/20 to-orange-600/10 border-orange-500/30",
  };
  const gradientClass = colorMap[bgColor] || colorMap.cyan;

  return (
    <div
      className={`fixed top-4 right-4 z-[100] transition-all duration-300 ${
        visible && !exiting ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div className={`bg-gradient-to-r ${gradientClass} border rounded-xl p-4 backdrop-blur-sm shadow-2xl w-80`}>
        <button onClick={handleClose} className="absolute top-2 right-2 text-white/40 hover:text-white/70">
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 animate-bounce">
            <Award className="h-6 w-6 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider mb-0.5">
              Achievement Unlocked!
            </p>
            <p className="text-white font-bold text-sm truncate">{name}</p>
            <p className="text-white/60 text-xs mt-0.5 line-clamp-2">{description}</p>
            <div className="flex items-center gap-1 mt-2">
              <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
              <span className="text-amber-400 text-xs font-semibold">+{points} XP</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
