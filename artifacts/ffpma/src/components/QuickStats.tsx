import { motion } from "framer-motion";
import { Activity, CalendarDays, Target, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatItem {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}

interface QuickStatsProps {
  activeProtocols: number;
  daysInCurrentPhase: number;
  nextMilestone: string;
  trainingModulesCompleted: number;
}

export function QuickStats({
  activeProtocols,
  daysInCurrentPhase,
  nextMilestone,
  trainingModulesCompleted,
}: QuickStatsProps) {
  const stats: StatItem[] = [
    {
      label: "Active Protocols",
      value: activeProtocols,
      sub: activeProtocols === 1 ? "protocol" : "protocols",
      icon: Activity,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/20",
    },
    {
      label: "Days in Phase",
      value: daysInCurrentPhase,
      sub: "current phase",
      icon: CalendarDays,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
    },
    {
      label: "Next Milestone",
      value: nextMilestone,
      icon: Target,
      color: "text-violet-400",
      bgColor: "bg-violet-500/10",
      borderColor: "border-violet-500/20",
    },
    {
      label: "Modules Done",
      value: trainingModulesCompleted,
      sub: "completed",
      icon: GraduationCap,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-testid="quick-stats">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08 }}
          className={cn(
            "rounded-xl border p-4 flex flex-col gap-2 transition-all hover:scale-[1.02]",
            stat.bgColor,
            stat.borderColor
          )}
          data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400 font-medium">{stat.label}</p>
            <div className={cn("p-1.5 rounded-lg", stat.bgColor)}>
              <stat.icon className={cn("h-3.5 w-3.5", stat.color)} />
            </div>
          </div>
          <div>
            <p className={cn("text-xl font-bold leading-tight", stat.color)}>
              {stat.value}
            </p>
            {stat.sub && (
              <p className="text-xs text-slate-500 mt-0.5">{stat.sub}</p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
