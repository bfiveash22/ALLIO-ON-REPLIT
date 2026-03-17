import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Server,
  Globe,
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  Plus,
  Database,
  Network,
  Clock,
  Cpu,
  HardDrive,
  MemoryStick,
  Users,
  ArrowRightLeft,
  MapPin,
  Scale,
  Eye,
  Zap,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  online: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  degraded: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  offline: "bg-red-500/20 text-red-400 border-red-500/30",
  provisioning: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  decommissioned: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const REPLICATION_COLORS: Record<string, string> = {
  synced: "bg-emerald-500/20 text-emerald-400",
  syncing: "bg-blue-500/20 text-blue-400",
  stale: "bg-amber-500/20 text-amber-400",
  error: "bg-red-500/20 text-red-400",
};

const JURISDICTION_STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-400",
  approved: "bg-blue-500/20 text-blue-400",
  researching: "bg-amber-500/20 text-amber-400",
  restricted: "bg-orange-500/20 text-orange-400",
  blocked: "bg-red-500/20 text-red-400",
};

interface ClinicNode {
  id: string;
  clinicId: string | null;
  nodeIdentifier: string;
  displayName: string;
  status: string;
  region: string;
  jurisdictionId: string | null;
  endpoint: string | null;
  version: string | null;
  lastHeartbeatAt: string | null;
  lastSyncAt: string | null;
  replicationState: string;
  replicationLag: number;
  cpuUsage: string | null;
  memoryUsage: string | null;
  diskUsage: string | null;
  activeConnections: number;
  memberCount: number;
  failoverPriority: number;
  isPrimary: boolean;
  canAcceptFailover: boolean;
  createdAt: string;
}

interface NodeEvent {
  id: string;
  nodeId: string;
  eventType: string;
  severity: string;
  message: string;
  details: any;
  acknowledgedAt: string | null;
  createdAt: string;
}

interface Jurisdiction {
  id: string;
  countryCode: string;
  countryName: string;
  legalSystem: string;
  constitutionalBasis: string | null;
  associationFreedom: string | null;
  healthFreedomScore: number | null;
  pmaViability: string | null;
  status: string;
  keyStatutes: string[];
  caseReferences: string[];
  riskFactors: string[];
  primaryLanguage: string | null;
  timezone: string | null;
  dataPrivacyLaw: string | null;
}

interface HealthSummary {
  totalNodes: number;
  online: number;
  degraded: number;
  offline: number;
  provisioning: number;
  decommissioned: number;
  avgReplicationLag: number;
  lastGlobalSync: string | null;
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function MetricBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="h-2 bg-[#1A2440] rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function AdminClinicNodesPage() {
  const { toast } = useToast();
  const [selectedNode, setSelectedNode] = useState<ClinicNode | null>(null);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    nodeIdentifier: "",
    displayName: "",
    region: "",
    endpoint: "",
  });

  const { data: nodesData, isLoading: nodesLoading } = useQuery({
    queryKey: ["/api/clinic-nodes"],
    queryFn: () => apiRequest("GET", "/api/clinic-nodes").then(r => r.json()),
    refetchInterval: 30000,
  });

  const { data: summaryData } = useQuery({
    queryKey: ["/api/clinic-nodes/health-summary"],
    queryFn: () => apiRequest("GET", "/api/clinic-nodes/health-summary").then(r => r.json()),
    refetchInterval: 30000,
  });

  const { data: eventsData } = useQuery({
    queryKey: ["/api/clinic-nodes/events"],
    queryFn: () => apiRequest("GET", "/api/clinic-nodes/events?limit=100").then(r => r.json()),
    refetchInterval: 15000,
  });

  const { data: jurisdictionsData, isLoading: jurisdictionsLoading } = useQuery({
    queryKey: ["/api/jurisdictions"],
    queryFn: () => apiRequest("GET", "/api/jurisdictions").then(r => r.json()),
  });

  const { data: checklistData } = useQuery({
    queryKey: ["/api/clinic-nodes/deployment-checklist"],
    queryFn: () => apiRequest("GET", "/api/clinic-nodes/deployment-checklist").then(r => r.json()),
  });

  const seedMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/clinic-nodes/seed"),
    onSuccess: () => {
      toast({ title: "Network seeded", description: "Primary node and jurisdiction data initialized" });
      queryClient.invalidateQueries({ queryKey: ["/api/clinic-nodes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jurisdictions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clinic-nodes/health-summary"] });
    },
    onError: (e: any) => toast({ title: "Seed failed", description: e.message, variant: "destructive" }),
  });

  const registerMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/clinic-nodes/register", data),
    onSuccess: () => {
      toast({ title: "Node registered", description: "New clinic node provisioned successfully" });
      setShowRegisterDialog(false);
      setRegisterForm({ nodeIdentifier: "", displayName: "", region: "", endpoint: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/clinic-nodes"] });
    },
    onError: (e: any) => toast({ title: "Registration failed", description: e.message, variant: "destructive" }),
  });

  const failoverMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/clinic-nodes/check-failover"),
    onSuccess: async (res) => {
      const data = await res.json();
      toast({ title: "Failover check complete", description: `${data.count} failover action(s) triggered` });
      queryClient.invalidateQueries({ queryKey: ["/api/clinic-nodes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clinic-nodes/events"] });
    },
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (eventId: string) => apiRequest("POST", `/api/clinic-nodes/events/${eventId}/acknowledge`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clinic-nodes/events"] });
    },
  });

  const nodes: ClinicNode[] = nodesData?.nodes || [];
  const summary: HealthSummary | null = summaryData?.summary || null;
  const events: NodeEvent[] = eventsData?.events || [];
  const jurisdictions: Jurisdiction[] = jurisdictionsData?.jurisdictions || [];
  const checklist = checklistData?.checklist || [];

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#C9A54E] font-[Playfair_Display]">
            Clinic Node Network
          </h1>
          <p className="text-[#E8EDF5]/60 mt-1">Distributed infrastructure monitoring and global expansion</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => failoverMutation.mutate()} disabled={failoverMutation.isPending}
            className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
            {failoverMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Zap className="h-4 w-4 mr-1" />}
            Check Failover
          </Button>
          <Button variant="outline" size="sm" onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}
            className="border-[#C9A54E]/30 text-[#C9A54E] hover:bg-[#C9A54E]/10">
            {seedMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Database className="h-4 w-4 mr-1" />}
            Seed Network
          </Button>
          <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
            <DialogTrigger asChild>
              <Button className="bg-[#C9A54E] text-[#0A0E1A] hover:bg-[#C9A54E]/90">
                <Plus className="h-4 w-4 mr-1" /> Register Node
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1A2440] border-[#C9A54E]/20 text-white">
              <DialogHeader>
                <DialogTitle className="text-[#C9A54E]">Register New Clinic Node</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-sm text-[#E8EDF5]/60 mb-1 block">Node Identifier</label>
                  <Input className="bg-[#0A0E1A] border-[#243055]" placeholder="ffpma-clinic-region"
                    value={registerForm.nodeIdentifier}
                    onChange={e => setRegisterForm(f => ({ ...f, nodeIdentifier: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm text-[#E8EDF5]/60 mb-1 block">Display Name</label>
                  <Input className="bg-[#0A0E1A] border-[#243055]" placeholder="Clinic Name (Region)"
                    value={registerForm.displayName}
                    onChange={e => setRegisterForm(f => ({ ...f, displayName: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm text-[#E8EDF5]/60 mb-1 block">Region</label>
                  <Select value={registerForm.region} onValueChange={v => setRegisterForm(f => ({ ...f, region: v }))}>
                    <SelectTrigger className="bg-[#0A0E1A] border-[#243055]">
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us-east-1">US East</SelectItem>
                      <SelectItem value="us-west-2">US West</SelectItem>
                      <SelectItem value="eu-west-1">EU West (Ireland)</SelectItem>
                      <SelectItem value="eu-central-1">EU Central (Frankfurt)</SelectItem>
                      <SelectItem value="ap-southeast-1">Asia Pacific (Singapore)</SelectItem>
                      <SelectItem value="ap-south-1">Asia Pacific (Mumbai)</SelectItem>
                      <SelectItem value="af-south-1">Africa (Cape Town)</SelectItem>
                      <SelectItem value="sa-east-1">South America (Sao Paulo)</SelectItem>
                      <SelectItem value="ca-central-1">Canada (Montreal)</SelectItem>
                      <SelectItem value="ap-southeast-2">Australia (Sydney)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-[#E8EDF5]/60 mb-1 block">Endpoint URL</label>
                  <Input className="bg-[#0A0E1A] border-[#243055]" placeholder="https://clinic.example.com"
                    value={registerForm.endpoint}
                    onChange={e => setRegisterForm(f => ({ ...f, endpoint: e.target.value }))} />
                </div>
                <Button className="w-full bg-[#C9A54E] text-[#0A0E1A]" disabled={registerMutation.isPending}
                  onClick={() => registerMutation.mutate(registerForm)}>
                  {registerMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Register Node
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="bg-[#1A2440] border-[#243055]">
            <CardContent className="p-4 text-center">
              <Server className="h-6 w-6 mx-auto text-[#C9A54E] mb-1" />
              <div className="text-2xl font-bold text-white">{summary.totalNodes}</div>
              <div className="text-xs text-[#E8EDF5]/60">Total Nodes</div>
            </CardContent>
          </Card>
          <Card className="bg-[#1A2440] border-emerald-500/20">
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-6 w-6 mx-auto text-emerald-400 mb-1" />
              <div className="text-2xl font-bold text-emerald-400">{summary.online}</div>
              <div className="text-xs text-[#E8EDF5]/60">Online</div>
            </CardContent>
          </Card>
          <Card className="bg-[#1A2440] border-amber-500/20">
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-6 w-6 mx-auto text-amber-400 mb-1" />
              <div className="text-2xl font-bold text-amber-400">{summary.degraded}</div>
              <div className="text-xs text-[#E8EDF5]/60">Degraded</div>
            </CardContent>
          </Card>
          <Card className="bg-[#1A2440] border-red-500/20">
            <CardContent className="p-4 text-center">
              <XCircle className="h-6 w-6 mx-auto text-red-400 mb-1" />
              <div className="text-2xl font-bold text-red-400">{summary.offline}</div>
              <div className="text-xs text-[#E8EDF5]/60">Offline</div>
            </CardContent>
          </Card>
          <Card className="bg-[#1A2440] border-[#243055]">
            <CardContent className="p-4 text-center">
              <ArrowRightLeft className="h-6 w-6 mx-auto text-blue-400 mb-1" />
              <div className="text-2xl font-bold text-blue-400">{summary.avgReplicationLag}s</div>
              <div className="text-xs text-[#E8EDF5]/60">Avg Replication Lag</div>
            </CardContent>
          </Card>
          <Card className="bg-[#1A2440] border-[#243055]">
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 mx-auto text-[#C8CFE0] mb-1" />
              <div className="text-sm font-bold text-white">{formatRelativeTime(summary.lastGlobalSync)}</div>
              <div className="text-xs text-[#E8EDF5]/60">Last Global Sync</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="nodes" className="space-y-4">
        <TabsList className="bg-[#1A2440] border border-[#243055]">
          <TabsTrigger value="nodes" className="data-[state=active]:bg-[#C9A54E] data-[state=active]:text-[#0A0E1A]">
            <Server className="h-4 w-4 mr-1" /> Nodes ({nodes.length})
          </TabsTrigger>
          <TabsTrigger value="events" className="data-[state=active]:bg-[#C9A54E] data-[state=active]:text-[#0A0E1A]">
            <Activity className="h-4 w-4 mr-1" /> Events ({events.length})
          </TabsTrigger>
          <TabsTrigger value="jurisdictions" className="data-[state=active]:bg-[#C9A54E] data-[state=active]:text-[#0A0E1A]">
            <Globe className="h-4 w-4 mr-1" /> Jurisdictions ({jurisdictions.length})
          </TabsTrigger>
          <TabsTrigger value="deployment" className="data-[state=active]:bg-[#C9A54E] data-[state=active]:text-[#0A0E1A]">
            <Shield className="h-4 w-4 mr-1" /> Deployment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="nodes" className="space-y-4">
          {nodesLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#C9A54E]" />
            </div>
          ) : nodes.length === 0 ? (
            <Card className="bg-[#1A2440] border-[#243055]">
              <CardContent className="py-20 text-center">
                <Network className="h-16 w-16 mx-auto text-[#C9A54E]/40 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Clinic Nodes Registered</h3>
                <p className="text-[#E8EDF5]/60 mb-4">Initialize the network with the primary node and jurisdiction data.</p>
                <Button className="bg-[#C9A54E] text-[#0A0E1A]" onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}>
                  {seedMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Database className="h-4 w-4 mr-1" />}
                  Initialize Network
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {nodes.map((node: ClinicNode) => (
                <Card key={node.id} className={`bg-[#1A2440] border-[#243055] hover:border-[#C9A54E]/30 transition-colors ${node.isPrimary ? "ring-1 ring-[#C9A54E]/30" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${node.isPrimary ? "bg-[#C9A54E]/20" : "bg-[#243055]"}`}>
                          <Server className={`h-5 w-5 ${node.isPrimary ? "text-[#C9A54E]" : "text-[#C8CFE0]"}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{node.displayName}</span>
                            {node.isPrimary && <Badge className="bg-[#C9A54E]/20 text-[#C9A54E] text-xs">PRIMARY</Badge>}
                          </div>
                          <div className="text-xs text-[#E8EDF5]/40 font-mono">{node.nodeIdentifier}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={STATUS_COLORS[node.status] || ""}>{node.status}</Badge>
                        <Badge className={REPLICATION_COLORS[node.replicationState] || ""}>{node.replicationState}</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mt-4">
                      <div>
                        <div className="text-xs text-[#E8EDF5]/40 mb-1 flex items-center gap-1"><MapPin className="h-3 w-3" />Region</div>
                        <div className="text-sm text-white">{node.region}</div>
                      </div>
                      <div>
                        <div className="text-xs text-[#E8EDF5]/40 mb-1 flex items-center gap-1"><Users className="h-3 w-3" />Members</div>
                        <div className="text-sm text-white">{node.memberCount}</div>
                      </div>
                      <div>
                        <div className="text-xs text-[#E8EDF5]/40 mb-1 flex items-center gap-1"><Network className="h-3 w-3" />Connections</div>
                        <div className="text-sm text-white">{node.activeConnections}</div>
                      </div>
                      <div>
                        <div className="text-xs text-[#E8EDF5]/40 mb-1 flex items-center gap-1"><Cpu className="h-3 w-3" />CPU</div>
                        <div className="text-sm text-white">{node.cpuUsage ? `${parseFloat(node.cpuUsage).toFixed(1)}%` : "N/A"}</div>
                        {node.cpuUsage && <MetricBar value={parseFloat(node.cpuUsage)} color={parseFloat(node.cpuUsage) > 80 ? "bg-red-500" : "bg-emerald-500"} />}
                      </div>
                      <div>
                        <div className="text-xs text-[#E8EDF5]/40 mb-1 flex items-center gap-1"><MemoryStick className="h-3 w-3" />Memory</div>
                        <div className="text-sm text-white">{node.memoryUsage ? `${parseFloat(node.memoryUsage).toFixed(1)}%` : "N/A"}</div>
                        {node.memoryUsage && <MetricBar value={parseFloat(node.memoryUsage)} color={parseFloat(node.memoryUsage) > 80 ? "bg-red-500" : "bg-blue-500"} />}
                      </div>
                      <div>
                        <div className="text-xs text-[#E8EDF5]/40 mb-1 flex items-center gap-1"><HardDrive className="h-3 w-3" />Disk</div>
                        <div className="text-sm text-white">{node.diskUsage ? `${parseFloat(node.diskUsage).toFixed(1)}%` : "N/A"}</div>
                        {node.diskUsage && <MetricBar value={parseFloat(node.diskUsage)} color={parseFloat(node.diskUsage) > 90 ? "bg-red-500" : "bg-[#C9A54E]"} />}
                      </div>
                      <div>
                        <div className="text-xs text-[#E8EDF5]/40 mb-1 flex items-center gap-1"><Clock className="h-3 w-3" />Heartbeat</div>
                        <div className="text-sm text-white">{formatRelativeTime(node.lastHeartbeatAt)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <ScrollArea className="h-[600px]">
            <div className="space-y-2">
              {events.length === 0 ? (
                <Card className="bg-[#1A2440] border-[#243055]">
                  <CardContent className="py-12 text-center">
                    <Activity className="h-12 w-12 mx-auto text-[#E8EDF5]/20 mb-3" />
                    <p className="text-[#E8EDF5]/40">No events recorded yet</p>
                  </CardContent>
                </Card>
              ) : events.map((event: NodeEvent) => (
                <Card key={event.id} className={`bg-[#1A2440] border-[#243055] ${event.severity === "critical" ? "border-l-4 border-l-red-500" : event.severity === "warning" ? "border-l-4 border-l-amber-500" : ""}`}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {event.severity === "critical" ? <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                        : event.severity === "warning" ? <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                        : <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />}
                      <div>
                        <div className="text-sm text-white">{event.message}</div>
                        <div className="text-xs text-[#E8EDF5]/40 flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] h-4">{event.eventType}</Badge>
                          {formatRelativeTime(event.createdAt)}
                        </div>
                      </div>
                    </div>
                    {!event.acknowledgedAt && event.severity !== "info" && (
                      <Button variant="ghost" size="sm" className="text-xs text-[#C9A54E]"
                        onClick={() => acknowledgeMutation.mutate(event.id)}>
                        Acknowledge
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="jurisdictions" className="space-y-4">
          {jurisdictionsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#C9A54E]" />
            </div>
          ) : jurisdictions.length === 0 ? (
            <Card className="bg-[#1A2440] border-[#243055]">
              <CardContent className="py-20 text-center">
                <Globe className="h-16 w-16 mx-auto text-[#C9A54E]/40 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Jurisdictions Mapped</h3>
                <p className="text-[#E8EDF5]/60 mb-4">Seed the network to populate global jurisdiction data.</p>
                <Button className="bg-[#C9A54E] text-[#0A0E1A]" onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}>
                  Seed Jurisdictions
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {jurisdictions.map((j: Jurisdiction) => (
                <Card key={j.id} className="bg-[#1A2440] border-[#243055]">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{getCountryFlag(j.countryCode)}</div>
                        <div>
                          <div className="font-semibold text-white text-lg">{j.countryName}</div>
                          <div className="text-xs text-[#E8EDF5]/40">{j.legalSystem}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={JURISDICTION_STATUS_COLORS[j.status] || ""}>{j.status}</Badge>
                        {j.healthFreedomScore !== null && (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#243055]">
                            <Scale className="h-3 w-3 text-[#C9A54E]" />
                            <span className={`text-sm font-bold ${
                              j.healthFreedomScore >= 80 ? "text-emerald-400" :
                              j.healthFreedomScore >= 60 ? "text-amber-400" : "text-red-400"
                            }`}>{j.healthFreedomScore}/100</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {j.pmaViability && (
                      <div className="text-sm text-[#C9A54E] mb-2">{j.pmaViability}</div>
                    )}

                    {j.constitutionalBasis && (
                      <div className="text-xs text-[#E8EDF5]/60 mb-3">{j.constitutionalBasis}</div>
                    )}

                    <div className="grid md:grid-cols-3 gap-3">
                      {j.keyStatutes && (j.keyStatutes as string[]).length > 0 && (
                        <div>
                          <div className="text-xs text-[#C9A54E] mb-1 font-semibold">Key Statutes</div>
                          <ul className="text-xs text-[#E8EDF5]/50 space-y-0.5">
                            {(j.keyStatutes as string[]).slice(0, 3).map((s, i) => (
                              <li key={i}>- {s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {j.caseReferences && (j.caseReferences as string[]).length > 0 && (
                        <div>
                          <div className="text-xs text-[#C9A54E] mb-1 font-semibold">Case References</div>
                          <ul className="text-xs text-[#E8EDF5]/50 space-y-0.5">
                            {(j.caseReferences as string[]).slice(0, 3).map((s, i) => (
                              <li key={i}>- {s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {j.riskFactors && (j.riskFactors as string[]).length > 0 && (
                        <div>
                          <div className="text-xs text-red-400 mb-1 font-semibold">Risk Factors</div>
                          <ul className="text-xs text-[#E8EDF5]/50 space-y-0.5">
                            {(j.riskFactors as string[]).slice(0, 3).map((s, i) => (
                              <li key={i}>- {s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-4 mt-3 text-xs text-[#E8EDF5]/40">
                      {j.primaryLanguage && <span>Language: {j.primaryLanguage}</span>}
                      {j.dataPrivacyLaw && <span>Privacy: {j.dataPrivacyLaw}</span>}
                      {j.associationFreedom && <span>Association: {j.associationFreedom}</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="deployment" className="space-y-4">
          <Card className="bg-[#1A2440] border-[#243055]">
            <CardHeader>
              <CardTitle className="text-[#C9A54E]">Node Deployment Checklist</CardTitle>
              <CardDescription className="text-[#E8EDF5]/60">
                10-step procedure for provisioning a new clinic node
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {checklist.map((step: any) => (
                  <div key={step.step} className="flex items-start gap-3 p-3 rounded-lg bg-[#0A0E1A]">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#C9A54E]/20 flex items-center justify-center text-[#C9A54E] font-bold text-sm">
                      {step.step}
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">{step.name}</div>
                      <div className="text-xs text-[#E8EDF5]/50 mt-0.5">{step.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1A2440] border-[#243055]">
            <CardHeader>
              <CardTitle className="text-[#C9A54E]">Node Architecture</CardTitle>
              <CardDescription className="text-[#E8EDF5]/60">
                Standalone clinic node design pattern
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-[#0A0E1A] border border-emerald-500/20">
                  <Database className="h-6 w-6 text-emerald-400 mb-2" />
                  <h4 className="font-semibold text-white mb-1">Local Database</h4>
                  <p className="text-xs text-[#E8EDF5]/50">
                    Each node runs PostgreSQL with streaming replication from primary. Member data, protocols, and products
                    are replicated locally so the node can operate independently if the central connection is severed.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-[#0A0E1A] border border-blue-500/20">
                  <Server className="h-6 w-6 text-blue-400 mb-2" />
                  <h4 className="font-semibold text-white mb-1">Application Stack</h4>
                  <p className="text-xs text-[#E8EDF5]/50">
                    Node.js API server + React frontend, Redis cache, Nginx reverse proxy. Each node runs the full FFPMA
                    stack with local ALLIO agent access. Version-locked to central for consistency.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-[#0A0E1A] border border-[#C9A54E]/20">
                  <Shield className="h-6 w-6 text-[#C9A54E] mb-2" />
                  <h4 className="font-semibold text-white mb-1">Failover System</h4>
                  <p className="text-xs text-[#E8EDF5]/50">
                    60-second heartbeat interval with automatic failover. If a node misses 5 consecutive heartbeats,
                    traffic reroutes to the nearest online node with available capacity. Data integrity preserved.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[#0A0E1A] border border-[#243055]">
                <h4 className="font-semibold text-[#C9A54E] mb-2">Replication Strategy</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-semibold text-white mb-1">Replicated Tables (Read/Write)</h5>
                    <div className="flex flex-wrap gap-1">
                      {(checklistData?.replicationTables || []).map((t: string) => (
                        <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-white mb-1">Sync Architecture</h5>
                    <ul className="text-xs text-[#E8EDF5]/50 space-y-1">
                      <li>- PostgreSQL streaming replication (WAL-based)</li>
                      <li>- Target lag: &lt;5 seconds under normal conditions</li>
                      <li>- Conflict resolution: Last-write-wins with audit trail</li>
                      <li>- Full resync available on demand (admin-triggered)</li>
                      <li>- Encrypted transit (mTLS between nodes)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function getCountryFlag(code: string): string {
  const flags: Record<string, string> = {
    US: "\u{1F1FA}\u{1F1F8}", GB: "\u{1F1EC}\u{1F1E7}", CA: "\u{1F1E8}\u{1F1E6}",
    AU: "\u{1F1E6}\u{1F1FA}", IN: "\u{1F1EE}\u{1F1F3}", NZ: "\u{1F1F3}\u{1F1FF}",
    ZA: "\u{1F1FF}\u{1F1E6}", IE: "\u{1F1EE}\u{1F1EA}", JM: "\u{1F1EF}\u{1F1F2}",
    KE: "\u{1F1F0}\u{1F1EA}",
  };
  return flags[code] || "\u{1F30D}";
}
