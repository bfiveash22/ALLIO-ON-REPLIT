import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ChevronDown,
  Clock,
  CheckCircle2,
  Circle,
  CalendarDays,
  Pill,
  ArrowRight,
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface DailyTask {
  time: string;
  task: string;
  completed?: boolean;
}

interface Supplement {
  name: string;
  dose: string;
  timing: string;
}

export interface ProtocolCardData {
  id: string;
  name: string;
  category: string;
  phase: string;
  phaseColor: string;
  phaseBg: string;
  phaseBorder: string;
  phaseDot: string;
  progress: number;
  startedDaysAgo: number;
  nextMilestone: string;
  daysUntilMilestone: number;
  dailySchedule: DailyTask[];
  supplements: Supplement[];
  href: string;
}

interface ExpandableProtocolCardProps {
  protocol: ProtocolCardData;
  defaultExpanded?: boolean;
}

export const sampleProtocols: ProtocolCardData[] = [
  {
    id: "exosome-rebuild",
    name: "Exosome Regeneration Protocol",
    category: "injection",
    phase: "Phase 2: Rebuild",
    phaseColor: "text-cyan-400",
    phaseBg: "bg-cyan-500/10",
    phaseBorder: "border-cyan-500/30",
    phaseDot: "bg-cyan-400",
    progress: 54,
    startedDaysAgo: 27,
    nextMilestone: "Mid-Protocol Assessment",
    daysUntilMilestone: 7,
    dailySchedule: [
      { time: "7:00 AM", task: "Morning supplements with breakfast", completed: true },
      { time: "9:00 AM", task: "Hydration checkpoint — 16 oz water", completed: true },
      { time: "12:00 PM", task: "Midday supplements", completed: false },
      { time: "5:00 PM", task: "Evening walk — 20 minutes", completed: false },
      { time: "8:00 PM", task: "Night supplements & wind-down", completed: false },
    ],
    supplements: [
      { name: "MSC Exosome Oral", dose: "2 capsules", timing: "Morning & Evening" },
      { name: "NAD+ Precursor", dose: "500mg", timing: "Morning" },
      { name: "Omega-3 DHA/EPA", dose: "2g", timing: "With meals" },
      { name: "Magnesium Glycinate", dose: "400mg", timing: "Evening" },
    ],
    href: "/protocols",
  },
  {
    id: "gut-restoration",
    name: "Gut Microbiome Restoration",
    category: "guidelines",
    phase: "Phase 1: Detox",
    phaseColor: "text-amber-400",
    phaseBg: "bg-amber-500/10",
    phaseBorder: "border-amber-500/30",
    phaseDot: "bg-amber-400",
    progress: 85,
    startedDaysAgo: 12,
    nextMilestone: "Phase Completion",
    daysUntilMilestone: 2,
    dailySchedule: [
      { time: "6:30 AM", task: "Lemon water — detox start", completed: true },
      { time: "8:00 AM", task: "Probiotic with breakfast", completed: true },
      { time: "1:00 PM", task: "Prebiotic fiber supplement", completed: true },
      { time: "7:00 PM", task: "Digestive enzyme with dinner", completed: false },
    ],
    supplements: [
      { name: "Multi-Strain Probiotic", dose: "50B CFU", timing: "Morning with food" },
      { name: "Prebiotic Fiber", dose: "5g", timing: "Afternoon" },
      { name: "L-Glutamine", dose: "5g", timing: "Twice daily" },
      { name: "Digestive Enzymes", dose: "1 capsule", timing: "With each meal" },
    ],
    href: "/protocols",
  },
];

export function ExpandableProtocolCard({ protocol, defaultExpanded = false }: ExpandableProtocolCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const completedTasks = protocol.dailySchedule.filter(t => t.completed).length;
  const totalTasks = protocol.dailySchedule.length;

  return (
    <Card
      className={cn(
        "overflow-hidden border transition-all duration-300",
        isExpanded ? `${protocol.phaseBorder} ${protocol.phaseBg}` : "border-white/10 bg-white/5"
      )}
      data-testid={`protocol-card-${protocol.id}`}
    >
      <button
        className="w-full text-left"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <div className="p-4 flex items-start gap-3">
          <div className={cn("p-2 rounded-lg shrink-0 mt-0.5", protocol.phaseBg, protocol.phaseBorder, "border")}>
            <CalendarDays className={cn("h-4 w-4", protocol.phaseColor)} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <p className="font-semibold text-white text-sm">{protocol.name}</p>
                <Badge className={cn("text-xs mt-1 border", protocol.phaseBg, protocol.phaseColor, protocol.phaseBorder)}>
                  {protocol.phase}
                </Badge>
              </div>
              <div className="text-right shrink-0">
                <p className={cn("text-lg font-bold", protocol.phaseColor)}>{protocol.progress}%</p>
                <p className="text-xs text-slate-500">Day {protocol.startedDaysAgo}</p>
              </div>
            </div>

            <div className="mt-2 space-y-1">
              <Progress value={protocol.progress} className="h-1.5" />
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{completedTasks}/{totalTasks} tasks today</span>
                <span>Next: {protocol.nextMilestone} in {protocol.daysUntilMilestone}d</span>
              </div>
            </div>
          </div>

          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0 mt-1"
          >
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <CardContent className="pt-0 pb-4 px-4 border-t border-white/10 space-y-4">
              <div className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className={cn("h-3.5 w-3.5", protocol.phaseColor)} />
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Today's Schedule</h4>
                </div>
                <div className="space-y-2">
                  {protocol.dailySchedule.map((task, i) => (
                    <div key={i} className="flex items-center gap-3">
                      {task.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-slate-600 shrink-0" />
                      )}
                      <span className="text-xs text-slate-500 w-16 shrink-0">{task.time}</span>
                      <span className={cn("text-sm", task.completed ? "text-slate-400 line-through" : "text-slate-200")}>
                        {task.task}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Pill className={cn("h-3.5 w-3.5", protocol.phaseColor)} />
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Supplement List</h4>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {protocol.supplements.map((supp, i) => (
                    <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-white/5 border border-white/5">
                      <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", protocol.phaseDot)} />
                      <div>
                        <p className="text-xs font-medium text-white">{supp.name}</p>
                        <p className="text-xs text-slate-400">{supp.dose} · {supp.timing}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                asChild
                size="sm"
                variant="outline"
                className={cn("w-full border", protocol.phaseBorder, protocol.phaseColor, "hover:bg-white/10 bg-transparent")}
              >
                <Link href={protocol.href}>
                  View Full Protocol <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
