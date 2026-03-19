import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  Users,
  FileText,
  CheckCircle2,
  Circle,
  ChevronRight,
  Plus,
  Trash2,
  Loader2,
  Download,
  MessageSquare,
  Send,
  Landmark,
  ClipboardList,
  Shield,
  BookOpen,
  AlertCircle,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL || "/";
function apiUrl(path: string) {
  return `${BASE}api/pma-filing${path}`;
}

interface Officer {
  id: string;
  fullName: string;
  role: string;
  email?: string;
  phone?: string;
}

interface FilingDocument {
  id: string;
  documentType: string;
  title: string;
  content?: string;
  status: string;
  createdAt: string;
}

interface FilingStep {
  step: number;
  title: string;
  status: string;
  data?: any;
}

interface ClinicFilingData {
  clinic: { id: string; name: string; pmaName: string; state: string; pmaStatus: string };
  steps: FilingStep[];
  progress: { completed: number; total: number; percentage: number };
  documents: FilingDocument[];
}

type WizardView = "list" | "register" | "filing" | "defender";

export default function PMAFilingManager() {
  const [view, setView] = useState<WizardView>("list");
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(1);
  const queryClient = useQueryClient();

  return (
    <div data-testid="pma-filing-manager">
      {view === "list" && (
        <ClinicList
          onSelectClinic={(id) => { setSelectedClinicId(id); setView("filing"); setActiveStep(1); }}
          onRegister={() => setView("register")}
          onDefender={() => setView("defender")}
        />
      )}
      {view === "register" && (
        <ClinicRegistration
          onBack={() => setView("list")}
          onCreated={(id) => { setSelectedClinicId(id); setView("filing"); setActiveStep(1); queryClient.invalidateQueries({ queryKey: ["/api/clinics"] }); }}
        />
      )}
      {view === "filing" && selectedClinicId && (
        <FilingWizard
          clinicId={selectedClinicId}
          activeStep={activeStep}
          setActiveStep={setActiveStep}
          onBack={() => { setView("list"); setSelectedClinicId(null); }}
        />
      )}
      {view === "defender" && (
        <PMADefenderChat onBack={() => setView("list")} />
      )}
    </div>
  );
}

function ClinicList({ onSelectClinic, onRegister, onDefender }: { onSelectClinic: (id: string) => void; onRegister: () => void; onDefender: () => void }) {
  const { data: clinicsData, isLoading } = useQuery<any[]>({
    queryKey: ["/api/clinics"],
  });

  const clinics = (clinicsData || []).filter(c => c.pmaType === "child");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">PMA Filing Manager</h2>
          <p className="text-sm text-slate-400">Manage Affiliated Clinic Association filings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10" onClick={onDefender} data-testid="button-defender-chat">
            <MessageSquare className="h-4 w-4 mr-2" />
            PMA Defender
          </Button>
          <Button className="bg-cyan-600 hover:bg-cyan-700 text-white" onClick={onRegister} data-testid="button-register-clinic">
            <Plus className="h-4 w-4 mr-2" />
            Register New Clinic PMA
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </div>
      ) : clinics.length === 0 ? (
        <Card className="bg-slate-900 border-dashed border-slate-700">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-12 w-12 text-slate-600 mb-4" />
            <p className="text-lg font-semibold text-white mb-1">No clinics registered yet</p>
            <p className="text-sm text-slate-400 mb-4">Register your first Affiliated Clinic Association</p>
            <Button className="bg-cyan-600 hover:bg-cyan-700 text-white" onClick={onRegister}>
              <Plus className="h-4 w-4 mr-2" />
              Register Clinic PMA
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {clinics.map((clinic: any) => (
            <Card
              key={clinic.id}
              className="bg-slate-900 border-slate-800 hover:border-cyan-500/30 transition-colors cursor-pointer"
              onClick={() => onSelectClinic(clinic.id)}
              data-testid={`clinic-card-${clinic.id}`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white">{clinic.pmaName || clinic.name}</h3>
                    <p className="text-sm text-slate-400">{clinic.doctorName || clinic.name}</p>
                  </div>
                  <Badge className={clinic.pmaStatus === "active" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"}>
                    {clinic.pmaStatus === "active" ? "Active" : "Pending"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Building2 className="h-3 w-3" />
                  <span>{clinic.city ? `${clinic.city}, ${clinic.state}` : clinic.state || "—"}</span>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <FilingStatusDots clinic={clinic} />
                  <ChevronRight className="h-4 w-4 text-slate-600 ml-auto" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function FilingStatusDots({ clinic }: { clinic: any }) {
  const statuses = [
    { key: "info", done: !!clinic.name && !!clinic.state },
    { key: "articles", done: clinic.articlesStatus === "filed" || clinic.articlesStatus === "generated" },
    { key: "bylaws", done: clinic.bylawsStatus === "filed" || clinic.bylawsStatus === "generated" },
    { key: "ein", done: clinic.einStatus === "has_ein" },
    { key: "form8832", done: clinic.form8832Status === "filed" },
  ];

  return (
    <div className="flex gap-1">
      {statuses.map(s => (
        <div key={s.key} className={`h-2 w-2 rounded-full ${s.done ? "bg-emerald-400" : "bg-slate-700"}`} />
      ))}
    </div>
  );
}

function ClinicRegistration({ onBack, onCreated }: { onBack: () => void; onCreated: (id: string) => void }) {
  const [form, setForm] = useState({ name: "", pmaName: "", state: "", city: "", address: "", phone: "", email: "", practiceType: "", doctorName: "" });
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(apiUrl("/clinics"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to register");
      return res.json();
    },
    onSuccess: (data) => onCreated(data.clinic.id),
    onError: (err: any) => setError(err.message),
  });

  return (
    <div>
      <Button variant="ghost" className="text-slate-400 hover:text-white mb-4" onClick={onBack}>
        ← Back to Clinic List
      </Button>
      <Card className="bg-slate-900 border-slate-800 max-w-2xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Building2 className="h-5 w-5 text-cyan-400" />
            Register New Affiliated Clinic PMA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Clinic Name *</label>
                <Input className="bg-slate-800 border-slate-700 text-white" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} data-testid="input-clinic-name" />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">PMA Name</label>
                <Input className="bg-slate-800 border-slate-700 text-white" placeholder={form.name ? `${form.name} PMA` : "Auto-generated"} value={form.pmaName} onChange={e => setForm(p => ({ ...p, pmaName: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">State *</label>
                <Input className="bg-slate-800 border-slate-700 text-white" value={form.state} onChange={e => setForm(p => ({ ...p, state: e.target.value }))} data-testid="input-state" />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">City</label>
                <Input className="bg-slate-800 border-slate-700 text-white" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Address</label>
              <Input className="bg-slate-800 border-slate-700 text-white" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Doctor / Practitioner Name</label>
                <Input className="bg-slate-800 border-slate-700 text-white" value={form.doctorName} onChange={e => setForm(p => ({ ...p, doctorName: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Practice Type</label>
                <Input className="bg-slate-800 border-slate-700 text-white" placeholder="DC, R.N., MD, etc." value={form.practiceType} onChange={e => setForm(p => ({ ...p, practiceType: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Phone</label>
                <Input className="bg-slate-800 border-slate-700 text-white" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Email</label>
                <Input className="bg-slate-800 border-slate-700 text-white" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <Button className="bg-cyan-600 hover:bg-cyan-700 text-white w-full" onClick={() => mutation.mutate()} disabled={!form.name || !form.state || mutation.isPending} data-testid="button-submit-clinic">
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Register Clinic PMA
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FilingWizard({ clinicId, activeStep, setActiveStep, onBack }: { clinicId: string; activeStep: number; setActiveStep: (s: number) => void; onBack: () => void }) {
  const queryClient = useQueryClient();

  const { data: filingData, isLoading } = useQuery<ClinicFilingData>({
    queryKey: ["pma-filing", clinicId],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/clinics/${clinicId}/filing-steps`), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load filing data");
      return res.json();
    },
  });

  const { data: officersData } = useQuery<{ officers: Officer[] }>({
    queryKey: ["pma-officers", clinicId],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/clinics/${clinicId}/officers`), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load officers");
      return res.json();
    },
  });

  const { data: documentsData } = useQuery<{ documents: FilingDocument[] }>({
    queryKey: ["pma-documents", clinicId],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/clinics/${clinicId}/documents`), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load documents");
      return res.json();
    },
  });

  const { data: taxGuidance } = useQuery({
    queryKey: ["pma-tax-guidance"],
    queryFn: async () => {
      const res = await fetch(apiUrl("/tax-guidance"), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load tax guidance");
      return res.json();
    },
  });

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-cyan-400" /></div>;
  if (!filingData) return null;

  const stepIcons = [Building2, Users, ClipboardList, FileText, FileText, Landmark, ClipboardList, Shield];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button variant="ghost" className="text-slate-400 hover:text-white mb-2 -ml-2" onClick={onBack}>← Back</Button>
          <h2 className="text-xl font-bold text-white">{filingData.clinic.pmaName || filingData.clinic.name}</h2>
          <p className="text-sm text-slate-400">Filing Progress: {filingData.progress.percentage}% complete</p>
        </div>
        <Badge className={filingData.clinic.pmaStatus === "active" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"}>
          {filingData.clinic.pmaStatus === "active" ? "Active" : "Pending"}
        </Badge>
      </div>

      <div className="w-full bg-slate-800 rounded-full h-2 mb-6">
        <div className="bg-cyan-500 h-2 rounded-full transition-all" style={{ width: `${filingData.progress.percentage}%` }} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="space-y-1">
          {filingData.steps.map((step, i) => {
            const Icon = stepIcons[i] || FileText;
            const isActive = activeStep === step.step;
            const isDone = step.status === "completed" || step.status === "generated";
            return (
              <button
                key={step.step}
                onClick={() => setActiveStep(step.step)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${
                  isActive ? "bg-cyan-600/20 text-cyan-400 border border-cyan-500/30" : "text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent"
                }`}
                data-testid={`step-button-${step.step}`}
              >
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                  <Circle className={`h-4 w-4 shrink-0 ${isActive ? "text-cyan-400" : "text-slate-600"}`} />
                )}
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{step.title}</span>
              </button>
            );
          })}
        </div>

        <div>
          {activeStep === 1 && <StepClinicInfo clinicId={clinicId} filingData={filingData} onNext={() => setActiveStep(2)} />}
          {activeStep === 2 && <StepOfficers clinicId={clinicId} officers={officersData?.officers || []} queryClient={queryClient} onNext={() => setActiveStep(3)} />}
          {activeStep === 3 && <StepGovernance onNext={() => setActiveStep(4)} />}
          {activeStep === 4 && <StepDocumentGeneration clinicId={clinicId} docType="articles" title="Articles of Association" documents={documentsData?.documents || []} queryClient={queryClient} onNext={() => setActiveStep(5)} />}
          {activeStep === 5 && <StepDocumentGeneration clinicId={clinicId} docType="bylaws" title="Bylaws" documents={documentsData?.documents || []} queryClient={queryClient} onNext={() => setActiveStep(6)} />}
          {activeStep === 6 && <StepEIN clinicId={clinicId} filingData={filingData} taxGuidance={taxGuidance} queryClient={queryClient} onNext={() => setActiveStep(7)} />}
          {activeStep === 7 && <StepForm8832 clinicId={clinicId} filingData={filingData} taxGuidance={taxGuidance} queryClient={queryClient} onNext={() => setActiveStep(8)} />}
          {activeStep === 8 && <StepBanking taxGuidance={taxGuidance} />}
        </div>
      </div>
    </div>
  );
}

function StepClinicInfo({ clinicId, filingData, onNext }: { clinicId: string; filingData: ClinicFilingData; onNext: () => void }) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Building2 className="h-5 w-5 text-cyan-400" />
          Step 1: Clinic Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 mb-6">
          <InfoRow label="Clinic Name" value={filingData.clinic.name} />
          <InfoRow label="PMA Name" value={filingData.clinic.pmaName} />
          <InfoRow label="State" value={filingData.clinic.state} />
          <InfoRow label="Status" value={filingData.clinic.pmaStatus} />
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Clinic information registered successfully.
        </div>
        <Button className="bg-cyan-600 hover:bg-cyan-700 text-white mt-4" onClick={onNext}>
          Next: Officer Information <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}

function StepOfficers({ clinicId, officers, queryClient, onNext }: { clinicId: string; officers: Officer[]; queryClient: any; onNext: () => void }) {
  const [newOfficer, setNewOfficer] = useState({ fullName: "", role: "", email: "", phone: "" });
  const [error, setError] = useState("");

  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(apiUrl(`/clinics/${clinicId}/officers`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOfficer),
        credentials: "include",
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to add officer");
      return res.json();
    },
    onSuccess: () => {
      setNewOfficer({ fullName: "", role: "", email: "", phone: "" });
      setError("");
      queryClient.invalidateQueries({ queryKey: ["pma-officers", clinicId] });
    },
    onError: (err: any) => setError(err.message),
  });

  const removeMutation = useMutation({
    mutationFn: async (officerId: string) => {
      const res = await fetch(apiUrl(`/clinics/${clinicId}/officers/${officerId}`), {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to remove officer");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pma-officers", clinicId] }),
  });

  const requiredRoles = ["Trustee", "Secretary", "Treasurer"];
  const missingRoles = requiredRoles.filter(r => !officers.some(o => o.role.toLowerCase() === r.toLowerCase()));

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Users className="h-5 w-5 text-cyan-400" />
          Step 2: Officer Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-400 mb-4">Every PMA requires at minimum a Trustee, Secretary, and Treasurer.</p>

        {officers.length > 0 && (
          <div className="space-y-2 mb-4">
            {officers.map(o => (
              <div key={o.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                <div>
                  <span className="text-white font-medium">{o.fullName}</span>
                  <Badge className="ml-2 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">{o.role}</Badge>
                  {o.email && <span className="text-slate-500 text-sm ml-2">{o.email}</span>}
                </div>
                <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => removeMutation.mutate(o.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {missingRoles.length > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm mb-4">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Missing required roles: {missingRoles.join(", ")}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Full Name *</label>
            <Input className="bg-slate-800 border-slate-600 text-white" value={newOfficer.fullName} onChange={e => setNewOfficer(p => ({ ...p, fullName: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Role *</label>
            <Input className="bg-slate-800 border-slate-600 text-white" placeholder="Trustee, Secretary, Treasurer" value={newOfficer.role} onChange={e => setNewOfficer(p => ({ ...p, role: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Email</label>
            <Input className="bg-slate-800 border-slate-600 text-white" value={newOfficer.email} onChange={e => setNewOfficer(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Phone</label>
            <Input className="bg-slate-800 border-slate-600 text-white" value={newOfficer.phone} onChange={e => setNewOfficer(p => ({ ...p, phone: e.target.value }))} />
          </div>
          {error && <p className="text-red-400 text-sm sm:col-span-2">{error}</p>}
          <div className="sm:col-span-2">
            <Button className="bg-cyan-600 hover:bg-cyan-700 text-white" onClick={() => addMutation.mutate()} disabled={!newOfficer.fullName || !newOfficer.role || addMutation.isPending}>
              {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Add Officer
            </Button>
          </div>
        </div>

        <Button className="bg-cyan-600 hover:bg-cyan-700 text-white mt-4" onClick={onNext} disabled={missingRoles.length > 0}>
          Next: Governance Rules <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}

function StepGovernance({ onNext }: { onNext: () => void }) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-cyan-400" />
          Step 3: Governance Rules
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-400 mb-4">Your Affiliated Clinic Association will use the standard FF PMA governance framework:</p>
        <div className="space-y-3 mb-6">
          <GovItem label="Meeting Schedule" value="Monthly on the first Monday" />
          <GovItem label="Voting Procedure" value="Simple majority of officers present" />
          <GovItem label="Member Admission" value="Application, $10.00 fee, and signed Member Contract" />
          <GovItem label="Quorum Requirement" value="Majority of officers" />
          <GovItem label="Fiscal Year" value="Calendar year (January 1 — December 31)" />
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm mb-4">
          <BookOpen className="h-4 w-4 shrink-0" />
          These governance rules will be incorporated into your Bylaws automatically.
        </div>
        <Button className="bg-cyan-600 hover:bg-cyan-700 text-white" onClick={onNext}>
          Next: Generate Articles <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}

function StepDocumentGeneration({ clinicId, docType, title, documents, queryClient, onNext }: { clinicId: string; docType: string; title: string; documents: FilingDocument[]; queryClient: any; onNext: () => void }) {
  const [previewDoc, setPreviewDoc] = useState<FilingDocument | null>(null);
  const [genError, setGenError] = useState("");
  const existingDocs = documents.filter(d => d.documentType === docType);
  const latestDoc = existingDocs[existingDocs.length - 1];
  const stepNum = docType === "articles" ? 4 : 5;

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(apiUrl(`/clinics/${clinicId}/generate-documents`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentTypes: [docType] }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to generate document");
      return res.json();
    },
    onSuccess: () => {
      setGenError("");
      queryClient.invalidateQueries({ queryKey: ["pma-documents", clinicId] });
      queryClient.invalidateQueries({ queryKey: ["pma-filing", clinicId] });
    },
    onError: (err: any) => setGenError(err.message),
  });

  const markFiledMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(apiUrl(`/clinics/${clinicId}/filing-steps/${stepNum}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pma-filing", clinicId] });
    },
  });

  const previewMutation = useMutation({
    mutationFn: async (docId: string) => {
      const res = await fetch(apiUrl(`/clinics/${clinicId}/documents/${docId}`), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load document");
      return res.json();
    },
    onSuccess: (data) => setPreviewDoc(data.document),
  });

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <FileText className="h-5 w-5 text-cyan-400" />
          Step {docType === "articles" ? 4 : 5}: {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {latestDoc ? (
          <div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-4">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {title} generated successfully.
            </div>
            <div className="flex gap-2 mb-4 flex-wrap">
              <Button variant="outline" className="border-slate-700 text-slate-300" onClick={() => previewMutation.mutate(latestDoc.id)}>
                {previewMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                Preview
              </Button>
              <Button variant="outline" className="border-slate-700 text-slate-300" onClick={() => generateMutation.mutate()}>
                {generateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Regenerate
              </Button>
              <Button variant="outline" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" onClick={() => markFiledMutation.mutate()} disabled={markFiledMutation.isPending}>
                {markFiledMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Mark as Filed
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-slate-400 mb-4">AI will generate your {title} based on your clinic information, officers, and the FF PMA framework.</p>
            <Button className="bg-cyan-600 hover:bg-cyan-700 text-white" onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generating {title}...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate {title}
                </>
              )}
            </Button>
          </div>
        )}

        {genError && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mt-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {genError}
          </div>
        )}

        {previewDoc && (
          <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700 max-h-96 overflow-auto">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-white">{previewDoc.title}</h4>
              <Button variant="ghost" size="sm" className="text-slate-400" onClick={() => setPreviewDoc(null)}>Close</Button>
            </div>
            <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">{previewDoc.content}</pre>
          </div>
        )}

        <Button className="bg-cyan-600 hover:bg-cyan-700 text-white mt-4" onClick={onNext}>
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}

function StepEIN({ clinicId, filingData, taxGuidance, queryClient, onNext }: { clinicId: string; filingData: ClinicFilingData; taxGuidance: any; queryClient: any; onNext: () => void }) {
  const [ein, setEin] = useState("");

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(apiUrl(`/clinics/${clinicId}/filing-steps/6`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed", data: { ein } }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update EIN");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pma-filing", clinicId] });
    },
  });

  const einGuidance = taxGuidance?.einApplication;

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Landmark className="h-5 w-5 text-cyan-400" />
          Step 6: EIN Application
        </CardTitle>
      </CardHeader>
      <CardContent>
        {einGuidance && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-white mb-2">{einGuidance.title}</h4>
            <ol className="space-y-2 mb-4">
              {einGuidance.steps.map((step: string, i: number) => (
                <li key={i} className="flex gap-2 text-sm text-slate-300">
                  <span className="text-cyan-400 font-semibold shrink-0">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
            {einGuidance.warnings && (
              <div className="space-y-1">
                {einGuidance.warnings.map((w: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-amber-400">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {w}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <label className="text-sm text-slate-400 mb-2 block">Enter your EIN once received:</label>
          <div className="flex gap-2">
            <Input className="bg-slate-800 border-slate-600 text-white font-mono max-w-xs" placeholder="XX-XXXXXXX" value={ein} onChange={e => setEin(e.target.value)} data-testid="input-ein" />
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => updateMutation.mutate()} disabled={!ein || updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <a href="https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 text-sm underline">
            Apply for EIN on IRS.gov →
          </a>
        </div>

        <Button className="bg-cyan-600 hover:bg-cyan-700 text-white mt-4" onClick={onNext}>
          Next: Form 8832 <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}

function StepForm8832({ clinicId, filingData, taxGuidance, queryClient, onNext }: { clinicId: string; filingData: ClinicFilingData; taxGuidance: any; queryClient: any; onNext: () => void }) {
  const guidance = taxGuidance?.form8832;
  const form1120 = taxGuidance?.form1120;

  const markFiled = useMutation({
    mutationFn: async (step: number) => {
      const res = await fetch(apiUrl(`/clinics/${clinicId}/filing-steps/${step}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pma-filing", clinicId] });
    },
  });

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-cyan-400" />
          Step 7: Tax Elections &amp; Filings
        </CardTitle>
      </CardHeader>
      <CardContent>
        {guidance && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-white mb-1">{guidance.title}</h4>
            <p className="text-xs text-slate-400 mb-3">{guidance.purpose}</p>
            <ol className="space-y-2 mb-3">
              {guidance.steps.map((step: string, i: number) => (
                <li key={i} className="flex gap-2 text-sm text-slate-300">
                  <span className="text-cyan-400 font-semibold shrink-0">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
            {guidance.keyPoints && (
              <div className="space-y-1 mb-4">
                {guidance.keyPoints.map((p: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-amber-400">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {p}
                  </div>
                ))}
              </div>
            )}
            <Button variant="outline" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" onClick={() => markFiled.mutate(7)} disabled={markFiled.isPending}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark Form 8832 as Filed
            </Button>
          </div>
        )}

        {form1120 && (
          <div className="mt-6 pt-6 border-t border-slate-700">
            <h4 className="text-sm font-semibold text-white mb-1">{form1120.title}</h4>
            <p className="text-xs text-slate-400 mb-3">{form1120.purpose}</p>
            <ol className="space-y-2 mb-3">
              {form1120.steps.map((step: string, i: number) => (
                <li key={i} className="flex gap-2 text-sm text-slate-300">
                  <span className="text-cyan-400 font-semibold shrink-0">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
            {form1120.taxProfessional && (
              <div className="p-3 bg-slate-800 rounded-lg border border-slate-700 text-sm">
                <p className="text-white font-medium mb-1">Recommended Tax Professional:</p>
                <p className="text-slate-300">{form1120.taxProfessional.name}</p>
                <p className="text-slate-400">{form1120.taxProfessional.email} · {form1120.taxProfessional.phone}</p>
                <p className="text-slate-500 text-xs mt-1">{form1120.taxProfessional.note}</p>
              </div>
            )}
            <Button variant="outline" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 mt-3" onClick={() => markFiled.mutate(8)} disabled={markFiled.isPending}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark Form 1120 as Filed
            </Button>
          </div>
        )}

        <Button className="bg-cyan-600 hover:bg-cyan-700 text-white mt-4" onClick={onNext}>
          Next: Banking Setup <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}

function StepBanking({ taxGuidance }: { taxGuidance: any }) {
  const banking = taxGuidance?.bankingSetup;

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Shield className="h-5 w-5 text-cyan-400" />
          Step 8: Banking Setup &amp; Final Compliance
        </CardTitle>
      </CardHeader>
      <CardContent>
        {banking && (
          <>
            <h4 className="text-sm font-semibold text-white mb-3">{banking.title}</h4>
            <div className="grid gap-4 sm:grid-cols-2 mb-6">
              <div>
                <h5 className="text-xs text-slate-500 uppercase tracking-wider mb-2">What to Bring</h5>
                <ul className="space-y-1">
                  {banking.whatToBring.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <CheckCircle2 className="h-3 w-3 text-cyan-400 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="text-xs text-slate-500 uppercase tracking-wider mb-2">What to Say</h5>
                <ul className="space-y-1">
                  {banking.whatToSay.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <MessageSquare className="h-3 w-3 text-cyan-400 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div>
              <h5 className="text-xs text-slate-500 uppercase tracking-wider mb-2">If the Bank Pushes Back</h5>
              <div className="space-y-2">
                {banking.bankPushback.map((tip: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-amber-300 p-2 bg-amber-500/5 rounded">
                    <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mt-6">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Once your bank account is open, your Affiliated Clinic PMA filing is complete. Maintain compliance with all 8 PMA Rules.
        </div>
      </CardContent>
    </Card>
  );
}

function PMADefenderChat({ onBack }: { onBack: () => void }) {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [input, setInput] = useState("");

  const chatMutation = useMutation({
    mutationFn: async (question: string) => {
      const res = await fetch(apiUrl("/defender/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to get response");
      return res.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: "assistant", content: data.answer }]);
    },
  });

  const handleSend = () => {
    if (!input.trim()) return;
    const question = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: question }]);
    chatMutation.mutate(question);
  };

  return (
    <div>
      <Button variant="ghost" className="text-slate-400 hover:text-white mb-4" onClick={onBack}>← Back</Button>
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-400" />
            PMA Defender — Legal Guidance AI
          </CardTitle>
          <p className="text-sm text-slate-400">Ask questions about PMA law, compliance, constitutional protections, tax filings, and operational guidance.</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 min-h-[300px] max-h-[500px] overflow-auto mb-4 p-4 bg-slate-800/50 rounded-lg">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-purple-400/30 mx-auto mb-3" />
                <p className="text-slate-500">Ask the PMA Defender a question about PMA law or compliance.</p>
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  {["What is a PMA?", "How do I get an EIN?", "What if the bank refuses?", "Do I need Form 8832?"].map(q => (
                    <Button key={q} variant="outline" size="sm" className="border-slate-700 text-slate-400 text-xs" onClick={() => { setInput(q); }}>
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.role === "user" ? "bg-cyan-600 text-white" : "bg-slate-700 text-slate-200"}`}>
                  <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                </div>
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-slate-700 text-slate-400 p-3 rounded-lg text-sm flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  PMA Defender is thinking...
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Input
              className="bg-slate-800 border-slate-700 text-white"
              placeholder="Ask about PMA law, compliance, tax filings..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              data-testid="input-defender-question"
            />
            <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={handleSend} disabled={!input.trim() || chatMutation.isPending}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm text-white font-medium">{value || "—"}</p>
    </div>
  );
}

function GovItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
      <CheckCircle2 className="h-4 w-4 text-cyan-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-slate-400">{value}</p>
      </div>
    </div>
  );
}
