import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  Legend,
} from "recharts";
import {
  Plus,
  Beaker,
  TrendingUp,
  ClipboardList,
  Search,
  Download,
  Trash2,
  Save,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  FlaskConical,
  FileText,
  BarChart3,
  X,
  Printer,
} from "lucide-react";

interface LabResult {
  id: string;
  memberId: string;
  memberName: string | null;
  testName: string;
  category: string;
  value: string;
  unit: string;
  referenceMin: string | null;
  referenceMax: string | null;
  status: "normal" | "low" | "high" | "critical_low" | "critical_high";
  resultDate: string;
  notes: string | null;
}

interface LabOrder {
  id: string;
  memberId: string;
  memberName: string | null;
  status: string;
  panels: string[];
  rupaOrderUrl: string | null;
  notes: string | null;
  orderedAt: string;
}

interface SavedPanel {
  id: string;
  name: string;
  description: string | null;
  testList: Array<{
    testName: string;
    category: string;
    unit: string;
    referenceMin?: number;
    referenceMax?: number;
  }>;
}

const BIOMARKER_CATEGORIES = [
  { id: "cbc", label: "CBC (Complete Blood Count)", tests: [
    { testName: "WBC", unit: "10^3/uL", referenceMin: 4.5, referenceMax: 11.0 },
    { testName: "RBC", unit: "10^6/uL", referenceMin: 4.5, referenceMax: 5.5 },
    { testName: "Hemoglobin", unit: "g/dL", referenceMin: 13.5, referenceMax: 17.5 },
    { testName: "Hematocrit", unit: "%", referenceMin: 38.3, referenceMax: 48.6 },
    { testName: "Platelets", unit: "10^3/uL", referenceMin: 150, referenceMax: 400 },
    { testName: "MCV", unit: "fL", referenceMin: 80, referenceMax: 100 },
    { testName: "MCH", unit: "pg", referenceMin: 27, referenceMax: 33 },
  ]},
  { id: "cmp", label: "CMP (Comprehensive Metabolic Panel)", tests: [
    { testName: "Glucose", unit: "mg/dL", referenceMin: 70, referenceMax: 100 },
    { testName: "BUN", unit: "mg/dL", referenceMin: 7, referenceMax: 20 },
    { testName: "Creatinine", unit: "mg/dL", referenceMin: 0.7, referenceMax: 1.3 },
    { testName: "Sodium", unit: "mEq/L", referenceMin: 136, referenceMax: 145 },
    { testName: "Potassium", unit: "mEq/L", referenceMin: 3.5, referenceMax: 5.0 },
    { testName: "Calcium", unit: "mg/dL", referenceMin: 8.5, referenceMax: 10.5 },
    { testName: "ALT", unit: "U/L", referenceMin: 7, referenceMax: 56 },
    { testName: "AST", unit: "U/L", referenceMin: 10, referenceMax: 40 },
  ]},
  { id: "lipids", label: "Lipid Panel", tests: [
    { testName: "Total Cholesterol", unit: "mg/dL", referenceMin: 0, referenceMax: 200 },
    { testName: "LDL Cholesterol", unit: "mg/dL", referenceMin: 0, referenceMax: 100 },
    { testName: "HDL Cholesterol", unit: "mg/dL", referenceMin: 40, referenceMax: 200 },
    { testName: "Triglycerides", unit: "mg/dL", referenceMin: 0, referenceMax: 150 },
  ]},
  { id: "thyroid", label: "Thyroid Panel", tests: [
    { testName: "TSH", unit: "mIU/L", referenceMin: 0.4, referenceMax: 4.0 },
    { testName: "Free T4", unit: "ng/dL", referenceMin: 0.8, referenceMax: 1.8 },
    { testName: "Free T3", unit: "pg/mL", referenceMin: 2.3, referenceMax: 4.2 },
    { testName: "Reverse T3", unit: "ng/dL", referenceMin: 9.2, referenceMax: 24.1 },
  ]},
  { id: "hormones", label: "Hormones", tests: [
    { testName: "Testosterone (Total)", unit: "ng/dL", referenceMin: 300, referenceMax: 1000 },
    { testName: "Estradiol", unit: "pg/mL", referenceMin: 10, referenceMax: 40 },
    { testName: "DHEA-S", unit: "ug/dL", referenceMin: 80, referenceMax: 560 },
    { testName: "Cortisol (AM)", unit: "ug/dL", referenceMin: 6.2, referenceMax: 19.4 },
    { testName: "Insulin (Fasting)", unit: "uIU/mL", referenceMin: 2.6, referenceMax: 24.9 },
  ]},
  { id: "vitamins", label: "Vitamins & Minerals", tests: [
    { testName: "Vitamin D (25-OH)", unit: "ng/mL", referenceMin: 30, referenceMax: 100 },
    { testName: "Vitamin B12", unit: "pg/mL", referenceMin: 200, referenceMax: 900 },
    { testName: "Folate", unit: "ng/mL", referenceMin: 2.7, referenceMax: 17.0 },
    { testName: "Iron", unit: "ug/dL", referenceMin: 60, referenceMax: 170 },
    { testName: "Ferritin", unit: "ng/mL", referenceMin: 12, referenceMax: 300 },
    { testName: "Magnesium (RBC)", unit: "mg/dL", referenceMin: 4.2, referenceMax: 6.8 },
    { testName: "Zinc", unit: "ug/dL", referenceMin: 60, referenceMax: 120 },
  ]},
  { id: "inflammation", label: "Inflammation Markers", tests: [
    { testName: "hs-CRP", unit: "mg/L", referenceMin: 0, referenceMax: 3.0 },
    { testName: "ESR", unit: "mm/hr", referenceMin: 0, referenceMax: 20 },
    { testName: "Homocysteine", unit: "umol/L", referenceMin: 5, referenceMax: 15 },
  ]},
];

const ALL_TESTS = BIOMARKER_CATEGORIES.flatMap(cat =>
  cat.tests.map(t => ({ ...t, category: cat.label }))
);

function getStatusColor(status: string) {
  switch (status) {
    case "normal": return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
    case "low": return "bg-amber-500/20 text-amber-300 border-amber-500/30";
    case "high": return "bg-orange-500/20 text-orange-300 border-orange-500/30";
    case "critical_low":
    case "critical_high": return "bg-red-500/20 text-red-300 border-red-500/30";
    default: return "bg-white/10 text-white/60 border-white/20";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "normal": return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    case "low": return <ArrowDown className="w-4 h-4 text-amber-400" />;
    case "high": return <ArrowUp className="w-4 h-4 text-orange-400" />;
    case "critical_low": return <ArrowDown className="w-4 h-4 text-red-400" />;
    case "critical_high": return <ArrowUp className="w-4 h-4 text-red-400" />;
    default: return <Minus className="w-4 h-4 text-white/40" />;
  }
}

function determineStatus(value: number, refMin?: number | null, refMax?: number | null): "normal" | "low" | "high" | "critical_low" | "critical_high" {
  if (refMin == null && refMax == null) return "normal";
  if (refMin != null && value < refMin * 0.7) return "critical_low";
  if (refMax != null && value > refMax * 1.3) return "critical_high";
  if (refMin != null && value < refMin) return "low";
  if (refMax != null && value > refMax) return "high";
  return "normal";
}

function AddBloodworkSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [memberId, setMemberId] = useState("");
  const [memberName, setMemberName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [resultDate, setResultDate] = useState(new Date().toISOString().split('T')[0]);
  const [enteredValues, setEnteredValues] = useState<Record<string, string>>({});

  const submitMutation = useMutation({
    mutationFn: async (results: any[]) => {
      const response = await fetch("/api/doctor/lab-results/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results }),
      });
      if (!response.ok) throw new Error("Failed to save lab results");
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Results Saved", description: `${data.count} lab results saved successfully` });
      setEnteredValues({});
      queryClient.invalidateQueries({ queryKey: ["/api/doctor/lab-results"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!memberId) {
      toast({ title: "Error", description: "Please enter a member ID", variant: "destructive" });
      return;
    }

    const results = Object.entries(enteredValues)
      .filter(([, val]) => val && val.trim() !== "")
      .map(([testName, value]) => {
        const testInfo = ALL_TESTS.find(t => t.testName === testName);
        const numValue = parseFloat(value);
        return {
          memberId,
          memberName: memberName || undefined,
          testName,
          category: testInfo?.category || "Other",
          value,
          unit: testInfo?.unit || "",
          referenceMin: testInfo?.referenceMin?.toString(),
          referenceMax: testInfo?.referenceMax?.toString(),
          status: determineStatus(numValue, testInfo?.referenceMin, testInfo?.referenceMax),
          resultDate,
        };
      });

    if (results.length === 0) {
      toast({ title: "Error", description: "Please enter at least one lab value", variant: "destructive" });
      return;
    }

    submitMutation.mutate(results);
  };

  const categoryTests = selectedCategory
    ? BIOMARKER_CATEGORIES.find(c => c.id === selectedCategory)?.tests || []
    : [];

  return (
    <div className="space-y-6">
      <Card className="bg-black/20 border-white/10 p-6">
        <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
          <Plus className="w-5 h-5 text-cyan-400" />
          Manual Lab Entry
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="space-y-2">
            <Label className="text-white/70">Member ID</Label>
            <Input
              placeholder="e.g., MEM-001"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/70">Member Name</Label>
            <Input
              placeholder="e.g., John Smith"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/70">Result Date</Label>
            <Input
              type="date"
              value={resultDate}
              onChange={(e) => setResultDate(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <Label className="text-white/70">Biomarker Category</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Select a category..." />
            </SelectTrigger>
            <SelectContent>
              {BIOMARKER_CATEGORIES.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedCategory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-3"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {categoryTests.map(test => (
                <div key={test.testName} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{test.testName}</p>
                    <p className="text-xs text-white/40">
                      Ref: {test.referenceMin} - {test.referenceMax} {test.unit}
                    </p>
                  </div>
                  <Input
                    placeholder="Value"
                    value={enteredValues[test.testName] || ""}
                    onChange={(e) => setEnteredValues(prev => ({ ...prev, [test.testName]: e.target.value }))}
                    className="w-28 bg-white/5 border-white/10 text-white text-right"
                    type="number"
                    step="any"
                  />
                  <span className="text-xs text-white/40 w-16">{test.unit}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <div className="flex justify-end mt-6 gap-3">
          <Button
            variant="outline"
            onClick={() => setEnteredValues({})}
            className="border-white/10 text-white/60 hover:bg-white/5"
          >
            Clear All
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
          >
            {submitMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> Save Results</>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function OrderLabsSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [memberId, setMemberId] = useState("");
  const [memberName, setMemberName] = useState("");
  const [selectedPanels, setSelectedPanels] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [panelSearch, setPanelSearch] = useState("");

  const { data: rupaStatus } = useQuery<{ success: boolean; available: boolean; error?: string }>({
    queryKey: ["/api/doctor/rupa-health/status"],
  });

  const { data: savedPanelsData } = useQuery<{ success: boolean; panels: SavedPanel[] }>({
    queryKey: ["/api/doctor/saved-panels"],
  });

  const { data: ordersData } = useQuery<{ success: boolean; orders: LabOrder[] }>({
    queryKey: ["/api/doctor/lab-orders"],
  });

  const orderMutation = useMutation({
    mutationFn: async (data: { memberId: string; memberName?: string; panels: string[]; notes?: string; dryRun: boolean }) => {
      const response = await fetch("/api/doctor/lab-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create lab order");
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Order Created", description: `Lab order created as ${data.order.status}` });
      setSelectedPanels([]);
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["/api/doctor/lab-orders"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const availablePanels = [
    "Complete Blood Count (CBC)", "Comprehensive Metabolic Panel (CMP)",
    "Lipid Panel", "Thyroid Panel (TSH, T3, T4)", "Hemoglobin A1c",
    "Vitamin D (25-OH)", "Iron Panel", "Liver Function Panel",
    "Kidney Function Panel", "Hormone Panel (Male)", "Hormone Panel (Female)",
    "Inflammation Markers (CRP, ESR)", "DUTCH Complete (Hormones)",
    "Organic Acids Test (OAT)", "GI-MAP (Stool Analysis)",
    "Food Sensitivity Panel", "Micronutrient Panel",
    "Heavy Metal Panel", "Mycotoxin Panel", "Adrenal Stress Panel",
  ];

  const filteredPanels = panelSearch
    ? availablePanels.filter(p => p.toLowerCase().includes(panelSearch.toLowerCase()))
    : availablePanels;

  const togglePanel = (panel: string) => {
    setSelectedPanels(prev =>
      prev.includes(panel) ? prev.filter(p => p !== panel) : [...prev, panel]
    );
  };

  const orders = ordersData?.orders || [];

  return (
    <div className="space-y-6">
      <Card className="bg-black/20 border-white/10 p-6">
        <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
          <Send className="w-5 h-5 text-violet-400" />
          Order Lab Tests
          {rupaStatus?.available ? (
            <Badge className="bg-emerald-500/20 text-emerald-300 text-xs">Rupa Connected</Badge>
          ) : (
            <Badge className="bg-amber-500/20 text-amber-300 text-xs">Rupa Not Configured</Badge>
          )}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <Label className="text-white/70">Member ID</Label>
            <Input
              placeholder="e.g., MEM-001"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/70">Member Name</Label>
            <Input
              placeholder="e.g., John Smith"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <Label className="text-white/70">Select Test Panels</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                placeholder="Search panels..."
                value={panelSearch}
                onChange={(e) => setPanelSearch(e.target.value)}
                className="pl-9 w-52 bg-white/5 border-white/10 text-white text-sm"
              />
            </div>
          </div>

          {(savedPanelsData?.panels || []).length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-white/50 mb-2">Your Saved Panels:</p>
              <div className="flex flex-wrap gap-2">
                {(savedPanelsData?.panels || []).map(panel => (
                  <Button
                    key={panel.id}
                    size="sm"
                    variant="outline"
                    className={`text-xs border-violet-500/30 ${
                      selectedPanels.includes(panel.name) ? "bg-violet-500/20 text-violet-300" : "text-white/60"
                    }`}
                    onClick={() => togglePanel(panel.name)}
                  >
                    <FlaskConical className="w-3 h-3 mr-1" />
                    {panel.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
            {filteredPanels.map(panel => (
              <div
                key={panel}
                onClick={() => togglePanel(panel)}
                className={`p-3 rounded-lg cursor-pointer transition-colors text-sm ${
                  selectedPanels.includes(panel)
                    ? "bg-cyan-500/20 border border-cyan-500/30 text-cyan-300"
                    : "bg-white/5 border border-transparent hover:bg-white/10 text-white/70"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded border ${
                    selectedPanels.includes(panel)
                      ? "bg-cyan-500 border-cyan-500"
                      : "border-white/30"
                  } flex items-center justify-center`}>
                    {selectedPanels.includes(panel) && (
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    )}
                  </div>
                  {panel}
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedPanels.length > 0 && (
          <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20 mb-4">
            <p className="text-sm font-medium text-cyan-300 mb-2">Order Preview ({selectedPanels.length} panels)</p>
            <div className="flex flex-wrap gap-2">
              {selectedPanels.map(panel => (
                <Badge key={panel} className="bg-cyan-500/20 text-cyan-300">
                  {panel}
                  <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => togglePanel(panel)} />
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2 mb-4">
          <Label className="text-white/70">Notes (optional)</Label>
          <Textarea
            placeholder="Any special instructions..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="bg-white/5 border-white/10 text-white"
            rows={2}
          />
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => orderMutation.mutate({ memberId, memberName, panels: selectedPanels, notes, dryRun: true })}
            disabled={!memberId || selectedPanels.length === 0 || orderMutation.isPending}
            variant="outline"
            className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
          >
            <FileText className="w-4 h-4 mr-2" />
            Save as Draft
          </Button>
          <Button
            onClick={() => orderMutation.mutate({ memberId, memberName, panels: selectedPanels, notes, dryRun: false })}
            disabled={!memberId || selectedPanels.length === 0 || orderMutation.isPending}
            className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
          >
            {orderMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
            ) : (
              <><Send className="w-4 h-4 mr-2" /> Submit Order</>
            )}
          </Button>
        </div>
      </Card>

      {orders.length > 0 && (
        <Card className="bg-black/20 border-white/10 p-6">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
            <ClipboardList className="w-5 h-5 text-white/60" />
            Recent Orders
          </h3>
          <div className="space-y-3">
            {orders.slice(0, 10).map(order => (
              <div key={order.id} className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{order.memberName || order.memberId}</span>
                    <Badge className={
                      order.status === "completed" ? "bg-emerald-500/20 text-emerald-300" :
                      order.status === "submitted" ? "bg-blue-500/20 text-blue-300" :
                      order.status === "draft" ? "bg-white/10 text-white/60" :
                      "bg-amber-500/20 text-amber-300"
                    }>
                      {order.status}
                    </Badge>
                  </div>
                  <span className="text-xs text-white/40">
                    {new Date(order.orderedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {order.panels.map((panel, i) => (
                    <Badge key={i} variant="outline" className="text-xs border-white/20 text-white/60">{panel}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function TestPanelBuilderSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [panelName, setPanelName] = useState("");
  const [panelDescription, setPanelDescription] = useState("");
  const [selectedTests, setSelectedTests] = useState<Array<{ testName: string; category: string; unit: string; referenceMin?: number; referenceMax?: number }>>([]);
  const [testSearch, setTestSearch] = useState("");

  const { data: savedPanelsData, isLoading } = useQuery<{ success: boolean; panels: SavedPanel[] }>({
    queryKey: ["/api/doctor/saved-panels"],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; testList: any[] }) => {
      const response = await fetch("/api/doctor/saved-panels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to save panel");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Panel Saved", description: `"${panelName}" has been saved` });
      setPanelName("");
      setPanelDescription("");
      setSelectedTests([]);
      queryClient.invalidateQueries({ queryKey: ["/api/doctor/saved-panels"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/doctor/saved-panels/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete panel");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Panel Deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/doctor/saved-panels"] });
    },
  });

  const filteredTests = testSearch
    ? ALL_TESTS.filter(t =>
        t.testName.toLowerCase().includes(testSearch.toLowerCase()) ||
        t.category.toLowerCase().includes(testSearch.toLowerCase())
      )
    : ALL_TESTS;

  const toggleTest = (test: typeof ALL_TESTS[0]) => {
    setSelectedTests(prev => {
      const exists = prev.find(t => t.testName === test.testName);
      if (exists) return prev.filter(t => t.testName !== test.testName);
      return [...prev, { testName: test.testName, category: test.category, unit: test.unit, referenceMin: test.referenceMin, referenceMax: test.referenceMax }];
    });
  };

  const savedPanels = savedPanelsData?.panels || [];

  return (
    <div className="space-y-6">
      <Card className="bg-black/20 border-white/10 p-6">
        <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
          <FlaskConical className="w-5 h-5 text-amber-400" />
          Build Custom Test Panel
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <Label className="text-white/70">Panel Name</Label>
            <Input
              placeholder='e.g., "Full Functional Medicine Panel"'
              value={panelName}
              onChange={(e) => setPanelName(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/70">Description</Label>
            <Input
              placeholder="Brief description..."
              value={panelDescription}
              onChange={(e) => setPanelDescription(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              placeholder="Search biomarkers..."
              value={testSearch}
              onChange={(e) => setTestSearch(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white"
            />
          </div>
          <Badge variant="outline" className="border-white/20 text-white/60">
            {selectedTests.length} selected
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto mb-4">
          {filteredTests.map(test => {
            const isSelected = selectedTests.some(t => t.testName === test.testName);
            return (
              <div
                key={test.testName}
                onClick={() => toggleTest(test)}
                className={`p-2 rounded-lg cursor-pointer transition-colors text-sm ${
                  isSelected
                    ? "bg-amber-500/20 border border-amber-500/30 text-amber-300"
                    : "bg-white/5 border border-transparent hover:bg-white/10 text-white/70"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-sm border ${
                    isSelected ? "bg-amber-500 border-amber-500" : "border-white/30"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs font-medium">{test.testName}</p>
                    <p className="text-[10px] text-white/40 truncate">{test.category}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selectedTests.length > 0 && (
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-4">
            <p className="text-sm font-medium text-amber-300 mb-2">Panel Contents</p>
            <div className="flex flex-wrap gap-1">
              {selectedTests.map(test => (
                <Badge key={test.testName} className="bg-amber-500/20 text-amber-300 text-xs">
                  {test.testName}
                  <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => toggleTest(test as any)} />
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={() => saveMutation.mutate({ name: panelName, description: panelDescription, testList: selectedTests })}
          disabled={!panelName || selectedTests.length === 0 || saveMutation.isPending}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
        >
          {saveMutation.isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
          ) : (
            <><Save className="w-4 h-4 mr-2" /> Save Panel Template</>
          )}
        </Button>
      </Card>

      <Card className="bg-black/20 border-white/10 p-6">
        <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
          <ClipboardList className="w-5 h-5 text-white/60" />
          Saved Panel Templates
        </h3>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-white/40" />
          </div>
        ) : savedPanels.length === 0 ? (
          <div className="text-center py-8 text-white/40">
            <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No saved panels yet</p>
            <p className="text-sm mt-1">Create a custom panel template above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedPanels.map(panel => (
              <div key={panel.id} className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-white">{panel.name}</p>
                    {panel.description && (
                      <p className="text-xs text-white/40">{panel.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs border-white/20 text-white/60">
                      {panel.testList.length} tests
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(panel.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {panel.testList.map((test, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] border-white/10 text-white/50">
                      {test.testName}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function ResultsAnalyticsSection() {
  const [selectedMember, setSelectedMember] = useState("");
  const [selectedMarker, setSelectedMarker] = useState("");

  const { data: resultsData, isLoading } = useQuery<{ success: boolean; results: LabResult[] }>({
    queryKey: ["/api/doctor/lab-results", selectedMember],
    queryFn: async () => {
      const url = selectedMember
        ? `/api/doctor/lab-results?memberId=${encodeURIComponent(selectedMember)}`
        : "/api/doctor/lab-results";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch results");
      return response.json();
    },
  });

  const results = resultsData?.results || [];

  const memberIds = useMemo(() => {
    const ids = new Set(results.map(r => r.memberId));
    return Array.from(ids);
  }, [results]);

  const memberResults = useMemo(() => {
    if (!selectedMember) return results;
    return results.filter(r => r.memberId === selectedMember);
  }, [results, selectedMember]);

  const testNames = useMemo(() => {
    const names = new Set(memberResults.map(r => r.testName));
    return Array.from(names).sort();
  }, [memberResults]);

  const trendData = useMemo(() => {
    if (!selectedMarker) return [];
    return memberResults
      .filter(r => r.testName === selectedMarker)
      .sort((a, b) => new Date(a.resultDate).getTime() - new Date(b.resultDate).getTime())
      .map(r => ({
        date: new Date(r.resultDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }),
        value: parseFloat(r.value),
        refMin: r.referenceMin ? parseFloat(r.referenceMin) : null,
        refMax: r.referenceMax ? parseFloat(r.referenceMax) : null,
        status: r.status,
      }));
  }, [memberResults, selectedMarker]);

  const latestByTest = useMemo(() => {
    const latest: Record<string, LabResult> = {};
    memberResults.forEach(r => {
      if (!latest[r.testName] || new Date(r.resultDate) > new Date(latest[r.testName].resultDate)) {
        latest[r.testName] = r;
      }
    });
    return Object.values(latest).sort((a, b) => a.testName.localeCompare(b.testName));
  }, [memberResults]);

  const barData = useMemo(() => {
    return latestByTest.slice(0, 15).map(r => {
      const value = parseFloat(r.value);
      const refMin = r.referenceMin ? parseFloat(r.referenceMin) : 0;
      const refMax = r.referenceMax ? parseFloat(r.referenceMax) : value * 1.5;
      const percent = refMax > 0 ? (value / refMax) * 100 : 50;
      return {
        name: r.testName.length > 12 ? r.testName.slice(0, 12) + '...' : r.testName,
        fullName: r.testName,
        value: percent,
        actual: value,
        unit: r.unit,
        status: r.status,
        refMin,
        refMax,
      };
    });
  }, [latestByTest]);

  const statusCounts = useMemo(() => {
    const counts = { normal: 0, low: 0, high: 0, critical: 0 };
    latestByTest.forEach(r => {
      if (r.status === "normal") counts.normal++;
      else if (r.status === "low") counts.low++;
      else if (r.status === "high") counts.high++;
      else counts.critical++;
    });
    return counts;
  }, [latestByTest]);

  const handlePrint = () => {
    const printContent = document.getElementById('bloodwork-report');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Bloodwork Report${selectedMember ? ` - ${selectedMember}` : ''}</title>
              <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; color: #1a1a2e; }
                h1 { color: #0ea5e9; border-bottom: 2px solid #0ea5e9; padding-bottom: 10px; }
                h2 { color: #374151; margin-top: 24px; }
                table { width: 100%; border-collapse: collapse; margin: 16px 0; }
                th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
                th { background: #f3f4f6; font-weight: 600; }
                .normal { color: #059669; }
                .low, .high { color: #d97706; }
                .critical_low, .critical_high { color: #dc2626; font-weight: 700; }
                .summary { display: flex; gap: 20px; margin: 16px 0; }
                .summary-card { flex: 1; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; text-align: center; }
                .summary-card h3 { font-size: 24px; margin: 0; }
                .summary-card p { font-size: 12px; color: #6b7280; margin: 4px 0 0; }
                .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }
              </style>
            </head>
            <body>
              <h1>FFPMA Bloodwork Report</h1>
              <p><strong>Member:</strong> ${selectedMember || 'All Members'}</p>
              <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
              <div class="summary">
                <div class="summary-card"><h3 class="normal">${statusCounts.normal}</h3><p>Normal</p></div>
                <div class="summary-card"><h3 style="color:#d97706">${statusCounts.low}</h3><p>Low</p></div>
                <div class="summary-card"><h3 style="color:#ea580c">${statusCounts.high}</h3><p>High</p></div>
                <div class="summary-card"><h3 style="color:#dc2626">${statusCounts.critical}</h3><p>Critical</p></div>
              </div>
              <h2>Latest Results</h2>
              <table>
                <thead><tr><th>Test</th><th>Value</th><th>Unit</th><th>Reference Range</th><th>Status</th></tr></thead>
                <tbody>
                  ${latestByTest.map(r => `
                    <tr>
                      <td>${r.testName}</td>
                      <td><strong>${r.value}</strong></td>
                      <td>${r.unit}</td>
                      <td>${r.referenceMin || '-'} - ${r.referenceMax || '-'}</td>
                      <td class="${r.status}">${r.status.replace('_', ' ').toUpperCase()}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              <div class="footer">
                <p>This report was generated by the FFPMA Doctor Portal. For medical use only.</p>
                <p>Forgotten Formula PMA &copy; ${new Date().getFullYear()}</p>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <div className="space-y-6" id="bloodwork-report">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="space-y-1 flex-1 min-w-[200px]">
          <Label className="text-white/70">Filter by Member</Label>
          <Select value={selectedMember || "__all__"} onValueChange={(val) => setSelectedMember(val === "__all__" ? "" : val)}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="All members" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Members</SelectItem>
              {memberIds.map(id => (
                <SelectItem key={id} value={id}>{id}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 flex-1 min-w-[200px]">
          <Label className="text-white/70">Trend Marker</Label>
          <Select value={selectedMarker} onValueChange={setSelectedMarker}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Select a marker..." />
            </SelectTrigger>
            <SelectContent>
              {testNames.map(name => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button
            onClick={handlePrint}
            variant="outline"
            className="border-white/10 text-white/60 hover:bg-white/5 mt-5"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Report
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-white/40" />
        </div>
      ) : results.length === 0 ? (
        <Card className="bg-black/20 border-white/10 p-12 text-center">
          <BarChart3 className="w-16 h-16 mx-auto text-white/20 mb-4" />
          <p className="text-white/60 text-lg mb-2">No bloodwork results yet</p>
          <p className="text-white/40 text-sm">Add bloodwork results to see analytics and trends</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-emerald-500/10 border-emerald-500/20 p-4 text-center">
              <p className="text-3xl font-bold text-emerald-400">{statusCounts.normal}</p>
              <p className="text-sm text-white/50">Normal</p>
            </Card>
            <Card className="bg-amber-500/10 border-amber-500/20 p-4 text-center">
              <p className="text-3xl font-bold text-amber-400">{statusCounts.low}</p>
              <p className="text-sm text-white/50">Low</p>
            </Card>
            <Card className="bg-orange-500/10 border-orange-500/20 p-4 text-center">
              <p className="text-3xl font-bold text-orange-400">{statusCounts.high}</p>
              <p className="text-sm text-white/50">High</p>
            </Card>
            <Card className="bg-red-500/10 border-red-500/20 p-4 text-center">
              <p className="text-3xl font-bold text-red-400">{statusCounts.critical}</p>
              <p className="text-sm text-white/50">Critical</p>
            </Card>
          </div>

          {trendData.length > 0 && (
            <Card className="bg-black/20 border-white/10 p-6">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                {selectedMarker} Trend Over Time
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
                    <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                      labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
                    />
                    {trendData[0]?.refMin != null && (
                      <ReferenceLine y={trendData[0].refMin} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'Low', fill: '#f59e0b', fontSize: 11 }} />
                    )}
                    {trendData[0]?.refMax != null && (
                      <ReferenceLine y={trendData[0].refMax} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'High', fill: '#f59e0b', fontSize: 11 }} />
                    )}
                    <Line type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4', r: 5 }} activeDot={{ r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {barData.length > 0 && (
            <Card className="bg-black/20 border-white/10 p-6">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-violet-400" />
                Current Values vs Reference Range
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis type="number" domain={[0, 150]} stroke="rgba(255,255,255,0.4)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                    <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.4)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} width={75} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                      formatter={(value: any, name: any, props: any) => [`${props.payload.actual} ${props.payload.unit}`, props.payload.fullName]}
                    />
                    <ReferenceLine x={100} stroke="#f59e0b" strokeDasharray="5 5" />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {barData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.status === "normal" ? "#10b981" :
                            entry.status === "low" ? "#f59e0b" :
                            entry.status === "high" ? "#f97316" :
                            "#ef4444"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          <Card className="bg-black/20 border-white/10 p-6">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
              <ClipboardList className="w-5 h-5 text-white/60" />
              Detailed Results
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-white/50 text-sm border-b border-white/10">
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Test Name</th>
                    <th className="pb-3 font-medium">Value</th>
                    <th className="pb-3 font-medium">Unit</th>
                    <th className="pb-3 font-medium">Reference Range</th>
                    <th className="pb-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {latestByTest.map(r => (
                    <tr key={r.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(r.status)}
                          <Badge className={`text-xs ${getStatusColor(r.status)}`}>
                            {r.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3 font-medium text-white">{r.testName}</td>
                      <td className="py-3 font-mono font-bold text-white">{r.value}</td>
                      <td className="py-3 text-white/60">{r.unit}</td>
                      <td className="py-3 text-white/60">
                        {r.referenceMin && r.referenceMax
                          ? `${r.referenceMin} - ${r.referenceMax}`
                          : r.referenceMin ? `> ${r.referenceMin}` : r.referenceMax ? `< ${r.referenceMax}` : '-'}
                      </td>
                      <td className="py-3 text-white/50">
                        {new Date(r.resultDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

export function BloodworkLabs() {
  const [activeSection, setActiveSection] = useState("add");

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-cyan-500/5 to-violet-500/5 border-cyan-500/20 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Beaker className="w-6 h-6 text-cyan-400" />
              Bloodwork & Labs
            </h2>
            <p className="text-white/60 text-sm mt-1">Manage member bloodwork, order tests, and view analytics</p>
          </div>
        </div>

        <Tabs value={activeSection} onValueChange={setActiveSection}>
          <TabsList className="bg-black/40 border border-white/10 p-1">
            <TabsTrigger value="add" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
              <Plus className="w-4 h-4 mr-2" />
              Add Bloodwork
            </TabsTrigger>
            <TabsTrigger value="order" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300">
              <Send className="w-4 h-4 mr-2" />
              Order Labs
            </TabsTrigger>
            <TabsTrigger value="panels" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
              <FlaskConical className="w-4 h-4 mr-2" />
              Panel Builder
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300">
              <BarChart3 className="w-4 h-4 mr-2" />
              Results & Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="add">
            <AddBloodworkSection />
          </TabsContent>
          <TabsContent value="order">
            <OrderLabsSection />
          </TabsContent>
          <TabsContent value="panels">
            <TestPanelBuilderSection />
          </TabsContent>
          <TabsContent value="analytics">
            <ResultsAnalyticsSection />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
