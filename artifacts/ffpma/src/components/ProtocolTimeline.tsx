import { motion } from "framer-motion";
import { CheckCircle2, Circle, Clock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Phase {
  id: string;
  name: string;
  description: string;
  duration: string;
  daysRange: [number, number];
  color: string;
  bgColor: string;
  borderColor: string;
  barColor?: string;
}

interface ProtocolTimelineProps {
  protocolName: string;
  currentDay: number;
  totalDays: number;
  phases?: Phase[];
}

const defaultPhases: Phase[] = [
  {
    id: "detox",
    name: "Phase 1: Detox",
    description: "Cellular cleansing & preparation",
    duration: "2 weeks",
    daysRange: [1, 14],
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
    borderColor: "border-amber-500/40",
    barColor: "#f59e0b",
  },
  {
    id: "rebuild",
    name: "Phase 2: Rebuild",
    description: "Regeneration & tissue repair",
    duration: "4 weeks",
    daysRange: [15, 42],
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20",
    borderColor: "border-cyan-500/40",
    barColor: "#22d3ee",
  },
  {
    id: "maintain",
    name: "Phase 3: Maintain",
    description: "Sustain & optimize results",
    duration: "6 weeks",
    daysRange: [43, 84],
    color: "text-violet-400",
    bgColor: "bg-violet-500/20",
    borderColor: "border-violet-500/40",
    barColor: "#a78bfa",
  },
];

function getPhaseStatus(phase: Phase, currentDay: number): "completed" | "active" | "upcoming" {
  if (currentDay > phase.daysRange[1]) return "completed";
  if (currentDay >= phase.daysRange[0]) return "active";
  return "upcoming";
}

function getPhaseProgress(phase: Phase, currentDay: number): number {
  const status = getPhaseStatus(phase, currentDay);
  if (status === "completed") return 100;
  if (status === "upcoming") return 0;
  const elapsed = currentDay - phase.daysRange[0] + 1;
  const total = phase.daysRange[1] - phase.daysRange[0] + 1;
  return Math.round((elapsed / total) * 100);
}

export function ProtocolTimeline({ protocolName, currentDay, totalDays, phases = defaultPhases }: ProtocolTimelineProps) {
  const overallProgress = Math.round((currentDay / totalDays) * 100);
  const activePhase = phases.find(p => {
    const status = getPhaseStatus(p, currentDay);
    return status === "active";
  });

  return (
    <div className="space-y-6" data-testid="protocol-timeline">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white text-lg">{protocolName}</h3>
          <p className="text-sm text-slate-400">Day {currentDay} of {totalDays}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">{overallProgress}%</p>
          <p className="text-xs text-slate-400">Complete</p>
        </div>
      </div>

      <div className="relative">
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-500 via-cyan-500 to-violet-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <div
          className="absolute -top-1 w-4 h-4 rounded-full border-2 border-white bg-cyan-500 shadow-lg shadow-cyan-500/50 transition-all duration-700"
          style={{ left: `calc(${overallProgress}% - 8px)` }}
        />
      </div>

      <div className="grid gap-3">
        {phases.map((phase, index) => {
          const status = getPhaseStatus(phase, currentDay);
          const progress = getPhaseProgress(phase, currentDay);
          const isActive = status === "active";
          const isCompleted = status === "completed";

          return (
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.12 }}
              className={cn(
                "relative rounded-xl border p-4 transition-all",
                isActive && `${phase.borderColor} ${phase.bgColor} shadow-sm`,
                isCompleted && "border-white/10 bg-white/5 opacity-80",
                !isActive && !isCompleted && "border-white/5 bg-white/2 opacity-50"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  isCompleted && "bg-cyan-500/20",
                  isActive && phase.bgColor,
                  !isActive && !isCompleted && "bg-white/5"
                )}>
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                  ) : isActive ? (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Circle className={cn("h-4 w-4", phase.color)} />
                    </motion.div>
                  ) : (
                    <Circle className="h-4 w-4 text-slate-600" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn(
                      "font-semibold text-sm",
                      isActive && phase.color,
                      isCompleted && "text-slate-300",
                      !isActive && !isCompleted && "text-slate-500"
                    )}>
                      {phase.name}
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                      <Clock className="h-3 w-3 text-slate-500" />
                      <span className="text-xs text-slate-500">{phase.duration}</span>
                    </div>
                  </div>
                  <p className={cn(
                    "text-xs mt-0.5",
                    isActive ? "text-slate-300" : "text-slate-500"
                  )}>
                    {phase.description}
                  </p>

                  {isActive && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Phase Progress</span>
                        <span className={phase.color}>{progress}%</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: phase.barColor || "#22d3ee" }}
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.8, delay: 0.3 }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {isActive && (
                <div className="absolute top-3 right-3">
                  <span className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full border",
                    phase.bgColor, phase.color, phase.borderColor
                  )}>
                    Active
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {activePhase && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-2 text-xs text-slate-400 p-2 rounded-lg bg-white/5"
        >
          <ChevronRight className="h-3 w-3 text-cyan-400" />
          <span>
            Currently in <span className={activePhase.color}>{activePhase.name}</span> — {activePhase.description}
          </span>
        </motion.div>
      )}
    </div>
  );
}
