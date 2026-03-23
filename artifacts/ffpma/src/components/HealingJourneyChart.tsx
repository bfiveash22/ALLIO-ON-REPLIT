import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TooltipProps } from "recharts";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";
import { motion } from "framer-motion";

interface ChartDataPoint {
  week: string;
  adherence: number;
  milestones: number;
  wellbeing: number;
}

function generateSampleData(): ChartDataPoint[] {
  const weeks = ["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5", "Wk 6", "Wk 7", "Wk 8"];
  const base = [72, 78, 75, 82, 85, 88, 84, 91];
  return weeks.map((week, i) => ({
    week,
    adherence: base[i],
    milestones: Math.min(100, Math.round((i / (weeks.length - 1)) * 100)),
    wellbeing: Math.round(60 + i * 4.5 + (Math.sin(i) * 3)),
  }));
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/95 border border-white/10 rounded-xl p-3 shadow-xl text-sm">
      <p className="font-semibold text-white mb-2">{String(label)}</p>
      {payload.map((entry) => (
        <div key={String(entry.name)} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: String(entry.color) }} />
          <span className="text-slate-400 capitalize">{String(entry.name)}:</span>
          <span className="text-white font-medium">{Number(entry.value)}%</span>
        </div>
      ))}
    </div>
  );
};

export function HealingJourneyChart() {
  const data = useMemo(() => generateSampleData(), []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-3"
      data-testid="healing-journey-chart"
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-cyan-400" />
            <span className="text-slate-400">Adherence</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-violet-400" />
            <span className="text-slate-400">Milestones</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-emerald-400" />
            <span className="text-slate-400">Wellbeing</span>
          </div>
        </div>
        <span className="text-xs text-slate-500">Last 8 weeks</span>
      </div>

      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="adherenceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="milestonesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="wellbeingGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[50, 100]}
              tick={{ fontSize: 10, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="adherence"
              stroke="#22d3ee"
              strokeWidth={2}
              fill="url(#adherenceGrad)"
              dot={false}
              activeDot={{ r: 5, fill: "#22d3ee", strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="milestones"
              stroke="#a78bfa"
              strokeWidth={2}
              fill="url(#milestonesGrad)"
              dot={false}
              activeDot={{ r: 5, fill: "#a78bfa", strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="wellbeing"
              stroke="#34d399"
              strokeWidth={2}
              fill="url(#wellbeingGrad)"
              dot={false}
              activeDot={{ r: 5, fill: "#34d399", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
