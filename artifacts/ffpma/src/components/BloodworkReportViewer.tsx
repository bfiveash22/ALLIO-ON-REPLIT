import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  AlertCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  Search,
  FileText,
  Activity,
  Dna,
  ExternalLink,
  Clock,
  Beaker,
} from "lucide-react";

interface Marker {
  testName: string;
  category: string;
  value: number;
  unit: string;
  referenceMin?: number;
  referenceMax?: number;
  status: "normal" | "low" | "high" | "critical_low" | "critical_high";
  confidence: number;
  notes?: string;
}

interface BloodworkUpload {
  id: string;
  memberId: string;
  memberName: string | null;
  fileName: string;
  fileType: string;
  status: string;
  driveWebViewLink?: string | null;
  labName?: string | null;
  collectionDate?: string | null;
  createdAt: string;
  clinicalSummary?: string | null;
  aiObservations?: string[] | null;
  protocolAlignments?: string[] | null;
  abnormalFlags?: string[] | null;
  confidence?: string | null;
  extractedMarkers?: Marker[] | null;
}

interface HistoryData {
  markerHistory: Record<
    string,
    Array<{ date: string; value: number; unit: string; status: string; uploadId: string }>
  >;
  uploads: Array<{
    id: string;
    fileName: string;
    labName?: string;
    collectionDate?: string;
    createdAt: string;
    markerCount: number;
    abnormalCount: number;
  }>;
}

interface Props {
  upload?: BloodworkUpload | null;
  historyData?: HistoryData | null;
  selectedMarkerId?: string | null;
  onSelectMarkerForHistory?: (markerName: string) => void;
}

const STATUS_CONFIG = {
  normal: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", label: "Normal", icon: CheckCircle },
  low: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", label: "Low", icon: TrendingDown },
  high: { color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30", label: "High", icon: TrendingUp },
  critical_low: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", label: "Critical Low", icon: AlertCircle },
  critical_high: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", label: "Critical High", icon: AlertCircle },
};

const CATEGORY_COLORS: Record<string, string> = {
  CBC: "text-blue-400",
  Metabolic: "text-cyan-400",
  Liver: "text-amber-400",
  Lipid: "text-orange-400",
  Thyroid: "text-violet-400",
  Hormones: "text-rose-400",
  Nutrients: "text-emerald-400",
  Inflammation: "text-red-400",
  Other: "text-white/60",
};

function MarkerRangeBar({ marker }: { marker: Marker }) {
  if (marker.referenceMin === undefined || marker.referenceMax === undefined) {
    return null;
  }

  const min = marker.referenceMin;
  const max = marker.referenceMax;
  const range = max - min;
  const extended = range * 0.3;
  const scaleMin = Math.max(0, min - extended);
  const scaleMax = max + extended;
  const scaleRange = scaleMax - scaleMin;

  const valuePercent = Math.min(100, Math.max(0, ((marker.value - scaleMin) / scaleRange) * 100));
  const minPercent = ((min - scaleMin) / scaleRange) * 100;
  const maxPercent = ((max - scaleMin) / scaleRange) * 100;

  const isAbnormal = marker.status !== "normal";

  return (
    <div className="mt-2">
      <div className="relative h-2 rounded-full bg-white/10">
        <div
          className="absolute h-full rounded-full bg-emerald-500/40"
          style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
        />
        <div
          className={`absolute w-3 h-3 rounded-full -top-0.5 -translate-x-1/2 shadow-lg ${
            isAbnormal ? "bg-rose-400 shadow-rose-500/50" : "bg-emerald-400 shadow-emerald-500/50"
          }`}
          style={{ left: `${valuePercent}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-white/30 mt-1">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

function MarkerCard({ marker, onSelectHistory }: { marker: Marker; onSelectHistory: (name: string) => void }) {
  const config = STATUS_CONFIG[marker.status];
  const Icon = config.icon;
  const categoryColor = CATEGORY_COLORS[marker.category] || "text-white/60";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-xl border ${config.border} ${config.bg} hover:bg-white/5 transition-colors cursor-pointer`}
      onClick={() => onSelectHistory(marker.testName)}
    >
      <div className="flex items-start justify-between mb-1">
        <div>
          <p className="font-semibold text-white text-sm">{marker.testName}</p>
          <p className={`text-xs ${categoryColor} mt-0.5`}>{marker.category}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${config.border} ${config.color} flex items-center gap-1`}>
            <Icon className="w-3 h-3" />
            {config.label}
          </span>
        </div>
      </div>
      <div className="flex items-baseline gap-2 mt-2">
        <span className={`text-2xl font-bold ${config.color}`}>{marker.value}</span>
        <span className="text-white/50 text-sm">{marker.unit}</span>
        {marker.referenceMin !== undefined && marker.referenceMax !== undefined && (
          <span className="text-white/30 text-xs ml-auto">
            ref: {marker.referenceMin}–{marker.referenceMax}
          </span>
        )}
      </div>
      <MarkerRangeBar marker={marker} />
      {marker.notes && (
        <p className="text-xs text-white/50 mt-2 italic">{marker.notes}</p>
      )}
    </motion.div>
  );
}

export function BloodworkReportViewer({ upload, historyData, selectedMarkerId, onSelectMarkerForHistory }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("results");
  const [selectedHistoryMarker, setSelectedHistoryMarker] = useState<string | null>(selectedMarkerId || null);

  const markers = (upload?.extractedMarkers || []) as Marker[];

  const filteredMarkers = useMemo(() => {
    if (!searchQuery) return markers;
    const q = searchQuery.toLowerCase();
    return markers.filter(
      (m) =>
        m.testName.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q)
    );
  }, [markers, searchQuery]);

  const groupedMarkers = useMemo(() => {
    const groups: Record<string, Marker[]> = {};
    for (const marker of filteredMarkers) {
      const cat = marker.category || "Other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(marker);
    }
    return groups;
  }, [filteredMarkers]);

  const abnormalMarkers = useMemo(
    () => markers.filter((m) => m.status !== "normal"),
    [markers]
  );

  const handleSelectMarker = (name: string) => {
    setSelectedHistoryMarker(name);
    if (onSelectMarkerForHistory) onSelectMarkerForHistory(name);
    setActiveTab("history");
  };

  const historyChartData = useMemo(() => {
    if (!selectedHistoryMarker || !historyData?.markerHistory?.[selectedHistoryMarker]) {
      return [];
    }
    return historyData.markerHistory[selectedHistoryMarker].map((point) => ({
      date: new Date(point.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }),
      value: point.value,
      status: point.status,
    }));
  }, [selectedHistoryMarker, historyData]);

  const selectedMarkerInfo = useMemo(() => {
    if (!selectedHistoryMarker) return null;
    return markers.find((m) => m.testName === selectedHistoryMarker) || null;
  }, [selectedHistoryMarker, markers]);

  if (!upload) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-white/40">
        <Beaker className="w-12 h-12 mb-4 opacity-50" />
        <p>Select a bloodwork report to view results</p>
      </div>
    );
  }

  if (upload.status === "analyzing") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-16"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Activity className="w-12 h-12 text-cyan-400 mb-4" />
        </motion.div>
        <p className="text-cyan-400 font-semibold text-lg">AI Analysis in Progress</p>
        <p className="text-white/50 text-sm mt-2">
          Extracting biomarkers from {upload.fileName}...
        </p>
        <p className="text-white/30 text-xs mt-1">This may take 30–60 seconds</p>
      </motion.div>
    );
  }

  if (upload.status === "failed") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-rose-400">
        <AlertCircle className="w-12 h-12 mb-4" />
        <p className="font-semibold">Analysis Failed</p>
        <p className="text-white/50 text-sm mt-2">
          The AI could not extract data from this file. Please ensure it's a clear PDF or image of a lab report.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg text-white">{upload.fileName}</h3>
          <div className="flex items-center gap-3 mt-1">
            {upload.labName && (
              <span className="text-xs text-white/50">{upload.labName}</span>
            )}
            {upload.collectionDate && (
              <span className="text-xs text-white/40 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(upload.collectionDate).toLocaleDateString()}
              </span>
            )}
            {upload.confidence && (
              <Badge className={`text-xs ${
                upload.confidence === "high" ? "bg-emerald-500/20 text-emerald-300" :
                upload.confidence === "moderate" ? "bg-amber-500/20 text-amber-300" :
                "bg-white/10 text-white/50"
              }`}>
                {upload.confidence} confidence
              </Badge>
            )}
            {upload.driveWebViewLink && (
              <a href={upload.driveWebViewLink} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" className="text-xs text-white/40 hover:text-white/70 h-6 px-2">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View File
                </Button>
              </a>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-emerald-500/20 text-emerald-300">
            {markers.filter((m) => m.status === "normal").length} Normal
          </Badge>
          {abnormalMarkers.length > 0 && (
            <Badge className="bg-rose-500/20 text-rose-300">
              {abnormalMarkers.length} Abnormal
            </Badge>
          )}
        </div>
      </div>

      {upload.clinicalSummary && (
        <Card className="bg-white/5 border-white/10 p-4">
          <p className="text-sm text-white/80 leading-relaxed">{upload.clinicalSummary}</p>
        </Card>
      )}

      {abnormalMarkers.length > 0 && (
        <Card className="bg-rose-500/5 border-rose-500/20 p-4">
          <h4 className="text-sm font-semibold text-rose-300 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Markers Needing Attention ({abnormalMarkers.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {abnormalMarkers.map((m) => (
              <button
                key={m.testName}
                onClick={() => handleSelectMarker(m.testName)}
                className={`text-xs px-2 py-1 rounded-full border ${STATUS_CONFIG[m.status].border} ${STATUS_CONFIG[m.status].color} ${STATUS_CONFIG[m.status].bg} hover:opacity-80 transition-opacity`}
              >
                {m.testName}: {m.value} {m.unit}
              </button>
            ))}
          </div>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl">
          <TabsTrigger value="results" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white rounded-lg text-white/60 text-sm">
            <Beaker className="w-3 h-3 mr-1" />
            Results ({markers.length})
          </TabsTrigger>
          <TabsTrigger value="insights" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white rounded-lg text-white/60 text-sm">
            <Dna className="w-3 h-3 mr-1" />
            Protocol Insights
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg text-white/60 text-sm">
            <TrendingUp className="w-3 h-3 mr-1" />
            Trends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="mt-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search markers..."
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>

          <div className="space-y-3">
            {Object.entries(groupedMarkers).map(([category, categoryMarkers]) => (
              <div key={category}>
                <button
                  onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${CATEGORY_COLORS[category] || "text-white/60"}`}>
                      {category}
                    </span>
                    <Badge className="bg-white/10 text-white/60 text-xs">{categoryMarkers.length}</Badge>
                    {categoryMarkers.some((m) => m.status !== "normal") && (
                      <Badge className="bg-rose-500/20 text-rose-300 text-xs">
                        {categoryMarkers.filter((m) => m.status !== "normal").length} abnormal
                      </Badge>
                    )}
                  </div>
                  {expandedCategory === category ? (
                    <ChevronUp className="w-4 h-4 text-white/40" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white/40" />
                  )}
                </button>

                <AnimatePresence>
                  {(expandedCategory === category || searchQuery) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2"
                    >
                      {categoryMarkers.map((marker) => (
                        <MarkerCard
                          key={marker.testName}
                          marker={marker}
                          onSelectHistory={handleSelectMarker}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="mt-4 space-y-4">
          {upload.aiObservations && upload.aiObservations.length > 0 && (
            <Card className="bg-white/5 border-white/10 p-4">
              <h4 className="text-sm font-semibold text-blue-300 mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Key Observations
              </h4>
              <ul className="space-y-2">
                {upload.aiObservations.map((obs, i) => (
                  <li key={i} className="text-sm text-white/80 flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>
                    {obs}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {upload.protocolAlignments && upload.protocolAlignments.length > 0 && (
            <Card className="bg-emerald-500/5 border-emerald-500/20 p-4">
              <h4 className="text-sm font-semibold text-emerald-300 mb-3 flex items-center gap-2">
                <Dna className="w-4 h-4" />
                FFPMA 2026 Protocol Alignments
              </h4>
              <div className="space-y-2">
                {upload.protocolAlignments.map((rec, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <p className="text-sm text-white/80">{rec}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {(!upload.aiObservations?.length && !upload.protocolAlignments?.length) && (
            <div className="text-center py-8 text-white/40">
              <Dna className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No protocol insights available for this report.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {historyData && Object.keys(historyData.markerHistory).length > 0 ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-white/50 mb-2">Select a marker to view its trend:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(historyData.markerHistory)
                    .filter((name) => historyData.markerHistory[name].length > 1)
                    .map((name) => (
                      <button
                        key={name}
                        onClick={() => setSelectedHistoryMarker(name)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                          selectedHistoryMarker === name
                            ? "border-cyan-500 bg-cyan-500/20 text-cyan-300"
                            : "border-white/10 bg-white/5 text-white/60 hover:border-white/30"
                        }`}
                      >
                        {name}
                        <span className="ml-1 text-white/30">
                          ({historyData.markerHistory[name].length}x)
                        </span>
                      </button>
                    ))}
                </div>
              </div>

              {selectedHistoryMarker && historyChartData.length > 0 && (
                <Card className="bg-white/5 border-white/10 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-white">{selectedHistoryMarker} Trend</h4>
                    {selectedMarkerInfo && (
                      <Badge className={`text-xs ${STATUS_CONFIG[selectedMarkerInfo.status].bg} ${STATUS_CONFIG[selectedMarkerInfo.status].color} border ${STATUS_CONFIG[selectedMarkerInfo.status].border}`}>
                        Current: {selectedMarkerInfo.value} {selectedMarkerInfo.unit}
                      </Badge>
                    )}
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={historyChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
                      <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ background: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                        labelStyle={{ color: "rgba(255,255,255,0.8)" }}
                        itemStyle={{ color: "#22d3ee" }}
                      />
                      {selectedMarkerInfo?.referenceMin !== undefined && (
                        <ReferenceLine y={selectedMarkerInfo.referenceMin} stroke="rgba(251,191,36,0.4)" strokeDasharray="4 4" label={{ value: "Min", fill: "rgba(251,191,36,0.6)", fontSize: 10 }} />
                      )}
                      {selectedMarkerInfo?.referenceMax !== undefined && (
                        <ReferenceLine y={selectedMarkerInfo.referenceMax} stroke="rgba(251,191,36,0.4)" strokeDasharray="4 4" label={{ value: "Max", fill: "rgba(251,191,36,0.6)", fontSize: 10 }} />
                      )}
                      <Line type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2} dot={{ fill: "#22d3ee", r: 4 }} activeDot={{ r: 6, fill: "#67e8f9" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {selectedHistoryMarker && historyChartData.length <= 1 && (
                <div className="text-center py-8 text-white/40">
                  <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p>Only one data point for {selectedHistoryMarker}.</p>
                  <p className="text-xs mt-1">Upload more reports to see trends.</p>
                </div>
              )}

              {!selectedHistoryMarker && (
                <div className="text-center py-8 text-white/40">
                  <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p>Select a marker above to view its historical trend.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-white/40">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No historical data yet</p>
              <p className="text-sm mt-2">Upload multiple reports to see trends over time.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
