import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { RoleToggle } from "@/components/role-toggle";
import { 
  Users, 
  ShoppingCart, 
  BookOpen, 
  TrendingUp,
  Activity,
  Calendar,
  RefreshCw,
  UserPlus,
  GraduationCap,
  Package,
  Building2,
  FileText,
  BarChart3,
  Download,
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Palette,
  Check,
  X,
  ExternalLink,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  Clock,
  ArrowLeftRight,
  CreditCard,
  DollarSign,
  Stethoscope,
  Server,
  Database,
  Zap,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { User, MemberProfile, Order, TrainingModule, Quiz, UiRefactorProposal, Payment } from "@shared/schema";

interface DatabasePoolDetails {
  total: number;
  idle: number;
  waiting: number;
}

interface DeepHealthDependency {
  name: string;
  status: "pass" | "fail" | "degraded" | "unconfigured";
  latencyMs?: number;
  error?: string;
  details?: DatabasePoolDetails;
}

interface CircuitBreakerStat {
  state: "CLOSED" | "OPEN" | "HALF_OPEN";
  failures: number;
  successes: number;
  lastFailure?: string;
  lastSuccess?: string;
  openedAt?: string;
  totalCalls: number;
  totalFailures: number;
  totalSuccesses: number;
}

interface DeepHealthData {
  status: "healthy" | "degraded" | "critical";
  timestamp: string;
  uptime: { seconds: number; formatted: string };
  dependencies: DeepHealthDependency[];
  circuitBreakers: Record<string, CircuitBreakerStat>;
  metrics: {
    errorRatePercent: number;
    avgResponseTimeMs: number;
    recentRequestCount: number;
  };
  memory: {
    rss: string;
    heapUsed: string;
    heapTotal: string;
  };
  database: {
    pool: DatabasePoolDetails;
    latencyMs?: number;
  };
  node: {
    version: string;
    pid: number;
    platform: string;
  };
}

function SystemHealthDashboard() {
  const { data: health, isLoading, refetch, isFetching } = useQuery<DeepHealthData>({
    queryKey: ["/api/health/deep"],
    queryFn: () => fetch("/api/health/deep").then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    }),
    refetchInterval: 30000,
    retry: 1,
  });

  const statusBg = {
    healthy: "bg-green-500/20 border-green-500/30",
    degraded: "bg-amber-500/20 border-amber-500/30",
    critical: "bg-red-500/20 border-red-500/30",
  };

  const depStatusBg: Record<string, string> = {
    pass: "bg-green-500/10 border-green-500/20",
    degraded: "bg-amber-500/10 border-amber-500/20",
    fail: "bg-red-500/10 border-red-500/20",
    unconfigured: "bg-gray-500/10 border-gray-500/20",
  };

  const depLabels: Record<string, string> = {
    database: "PostgreSQL Database",
    stripe: "Stripe Payments",
    woocommerce: "WooCommerce",
    signnow: "SignNow",
    google_drive: "Google Drive",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-500" />
            System Health Monitor
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Real-time status of all platform dependencies and services</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : !health ? (
        <Card className="border-red-500/20">
          <CardContent className="py-8 text-center">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 text-red-400" />
            <p className="text-muted-foreground">Could not load health data. You may not have admin access to this endpoint.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className={`rounded-xl border p-6 ${statusBg[health.status]}`}>
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center ${health.status === "healthy" ? "border-green-400 bg-green-500/20" : health.status === "degraded" ? "border-amber-400 bg-amber-500/20" : "border-red-400 bg-red-500/20"}`}>
                {health.status === "healthy" ? (
                  <CheckCircle2 className="w-7 h-7 text-green-400" />
                ) : health.status === "degraded" ? (
                  <AlertTriangle className="w-7 h-7 text-amber-400" />
                ) : (
                  <AlertCircle className="w-7 h-7 text-red-400" />
                )}
              </div>
              <div>
                <p className={`text-2xl font-bold capitalize ${health.status === "healthy" ? "text-green-600" : health.status === "degraded" ? "text-amber-600" : "text-red-600"}`}>{health.status}</p>
                <p className="text-sm text-muted-foreground">Last checked: {new Date(health.timestamp).toLocaleTimeString()}</p>
              </div>
              <div className="ml-auto grid grid-cols-3 gap-6 text-right">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Uptime</p>
                  <p className="text-lg font-semibold">{health.uptime.formatted}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Error Rate</p>
                  <p className={`text-lg font-semibold ${health.metrics.errorRatePercent > 5 ? "text-red-600" : health.metrics.errorRatePercent > 1 ? "text-amber-600" : "text-green-600"}`}>
                    {health.metrics.errorRatePercent}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Avg Response</p>
                  <p className={`text-lg font-semibold ${health.metrics.avgResponseTimeMs > 3000 ? "text-red-600" : health.metrics.avgResponseTimeMs > 1000 ? "text-amber-600" : "text-green-600"}`}>
                    {health.metrics.avgResponseTimeMs}ms
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {health.dependencies.map((dep) => (
              <Card key={dep.name} className={`border ${depStatusBg[dep.status]}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm">{depLabels[dep.name] || dep.name}</p>
                      {dep.latencyMs !== undefined && (
                        <p className="text-xs text-muted-foreground">{dep.latencyMs}ms latency</p>
                      )}
                    </div>
                    <Badge className={`text-xs capitalize ${dep.status === "pass" ? "bg-green-500/20 text-green-700" : dep.status === "degraded" ? "bg-amber-500/20 text-amber-700" : dep.status === "fail" ? "bg-red-500/20 text-red-700" : "bg-gray-500/20 text-gray-700"}`}>
                      {dep.status}
                    </Badge>
                  </div>
                  {dep.error && (
                    <p className="text-xs text-red-600 mt-1 line-clamp-2">{dep.error}</p>
                  )}
                  {dep.details && dep.name === "database" && (
                    <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                      <span>Pool: {dep.details?.total ?? 0}</span>
                      <span>Idle: {dep.details?.idle ?? 0}</span>
                      <span>Waiting: {dep.details?.waiting ?? 0}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Circuit Breakers
                </CardTitle>
                <CardDescription>External API call protection status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(health.circuitBreakers).map(([name, cb]) => (
                    <div key={name} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium capitalize">{name}</p>
                        <p className="text-xs text-muted-foreground">
                          {cb.totalCalls} calls · {cb.totalFailures} failures
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={`text-xs ${cb.state === "CLOSED" ? "bg-green-500/20 text-green-700" : cb.state === "OPEN" ? "bg-red-500/20 text-red-700" : "bg-amber-500/20 text-amber-700"}`}>
                          {cb.state}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {Object.keys(health.circuitBreakers).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No circuit breaker activity yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-500" />
                  System Resources
                </CardTitle>
                <CardDescription>Memory usage and runtime information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Heap Used</span>
                    <span className="font-medium">{health.memory.heapUsed}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Heap Total</span>
                    <span className="font-medium">{health.memory.heapTotal}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">RSS</span>
                    <span className="font-medium">{health.memory.rss}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Node.js Version</span>
                    <span className="font-medium">{health.node.version}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Platform</span>
                    <span className="font-medium">{health.node.platform}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Process ID</span>
                    <span className="font-medium">{health.node.pid}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Recent Requests</span>
                    <span className="font-medium">{health.metrics.recentRequestCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

interface UserSyncResult {
  success: boolean;
  message: string;
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
  details: Array<{
    email: string;
    wpUsername: string;
    role: string;
    status: "imported" | "updated" | "skipped" | "error";
    reason?: string;
  }>;
}

interface DashboardStats {
  totalMembers: number;
  totalDoctors: number;
  totalClinics: number;
  totalOrders: number;
  totalProducts: number;
  totalModules: number;
  totalQuizzes: number;
  recentSignups: number;
  activeUsers: number;
}

interface RecentMember {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const { toast } = useToast();
  const [syncResult, setSyncResult] = useState<UserSyncResult | null>(null);
  const [wpRoles, setWpRoles] = useState<any>(null);
  const [pushConfirmOpen, setPushConfirmOpen] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: recentMembers = [], isLoading: membersLoading } = useQuery<RecentMember[]>({
    queryKey: ["/api/admin/recent-members"],
  });

  const { data: modules = [] } = useQuery<TrainingModule[]>({
    queryKey: ["/api/training/modules"],
  });

  const { data: quizzes = [] } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes"],
  });

  const { data: proposalData, isLoading: proposalsLoading } = useQuery<{ proposals: UiRefactorProposal[], count: number }>({
    queryKey: ["/api/sentinel/ui-proposals"],
  });
  const uiProposals = (proposalData?.proposals || []).filter(p => p.status === 'pending');

  const { data: adminPayments, isLoading: adminPaymentsLoading } = useQuery<{ payments: Payment[], total: number }>({
    queryKey: ["/api/admin/payments"],
  });

  const { data: paymentSummary } = useQuery<{
    totalRevenue: number;
    totalTransactions: number;
    monthlyRevenue: number;
    monthlyTransactions: number;
    weeklyRevenue: number;
    weeklyTransactions: number;
    failedTransactions: number;
    pendingTransactions: number;
  }>({
    queryKey: ["/api/admin/payments/summary"],
  });

  const syncUsersMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/sync-users");
      return response.json() as Promise<UserSyncResult>;
    },
    onSuccess: (result) => {
      setSyncResult(result);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/recent-members"] });
      toast({
        title: "User Sync Complete",
        description: result.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync users from WordPress",
        variant: "destructive",
      });
    },
  });

  const syncProductsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/sync-wordpress");
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Product Sync Complete",
        description: `Synced ${result.counts?.products || 0} products and ${result.counts?.categories || 0} categories`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync products from WordPress",
        variant: "destructive",
      });
    },
  });

  const fullSyncMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/sync/full");
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/recent-members"] });
      toast({
        title: "Full Sync Complete",
        description: `Synced ${result.products} products, ${result.users?.imported || 0} users`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync from WordPress",
        variant: "destructive",
      });
    },
  });

  const { data: mirrorStats, isLoading: mirrorLoading, refetch: refetchMirror } = useQuery<any>({
    queryKey: ["/api/admin/wp-mirror-stats"],
    staleTime: 60000,
  });

  const { data: syncTracking } = useQuery<any>({
    queryKey: ["/api/admin/sync-tracking"],
    staleTime: 30000,
  });

  const { data: syncConflicts = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/sync-conflicts"],
    staleTime: 30000,
  });

  const pushUsersMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/push-all-users-to-wordpress");
      return response.json();
    },
    onSuccess: (result) => {
      setPushConfirmOpen(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/wp-mirror-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sync-tracking"] });
      toast({ title: "Push Users Started", description: result.message });
    },
    onError: (error: any) => {
      toast({ title: "Push Failed", description: error.message, variant: "destructive" });
    },
  });

  const pushProductsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/push-all-products-to-wordpress");
      return response.json();
    },
    onSuccess: (result) => {
      setPushConfirmOpen(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/wp-mirror-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sync-tracking"] });
      toast({ title: "Push Products Started", description: result.message });
    },
    onError: (error: any) => {
      toast({ title: "Push Failed", description: error.message, variant: "destructive" });
    },
  });

  const resolveConflictMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/admin/sync-conflicts/${id}/resolve`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sync-conflicts"] });
      toast({ title: "Conflict Resolved" });
    },
  });

  const discoverRolesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/admin/wp-roles");
      return response.json();
    },
    onSuccess: (result) => {
      setWpRoles(result);
      toast({
        title: "WordPress Roles Discovered",
        description: `Found ${result.discoveredRoles?.length || 0} roles`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Discovery Failed",
        description: error.message || "Failed to discover WordPress roles",
        variant: "destructive",
      });
    },
  });

  const approveProposalMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/sentinel/ui-proposals/${id}/approve`);
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sentinel/ui-proposals"] });
      toast({
        title: "Proposal Approved",
        description: result.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve proposal",
        variant: "destructive",
      });
    },
  });

  const rejectProposalMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/sentinel/ui-proposals/${id}/reject`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sentinel/ui-proposals"] });
      toast({
        title: "Proposal Rejected",
        description: "The UI refactor proposal has been rejected.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Rejection Failed",
        description: error.message || "Failed to reject proposal",
        variant: "destructive",
      });
    },
  });

  const statCards = [
    { label: "Total Members", value: stats?.totalMembers || 0, icon: Users, color: "text-blue-600" },
    { label: "Doctors", value: stats?.totalDoctors || 0, icon: Activity, color: "text-cyan-600" },
    { label: "Clinics", value: stats?.totalClinics || 0, icon: Building2, color: "text-purple-600" },
    { label: "Products", value: stats?.totalProducts || 0, icon: Package, color: "text-orange-600" },
    { label: "Training Modules", value: stats?.totalModules || modules.length, icon: BookOpen, color: "text-cyan-600" },
    { label: "Quizzes", value: stats?.totalQuizzes || quizzes.length, icon: GraduationCap, color: "text-pink-600" },
    { label: "Orders", value: stats?.totalOrders || 0, icon: ShoppingCart, color: "text-amber-600" },
    { label: "Recent Signups (7d)", value: stats?.recentSignups || 0, icon: UserPlus, color: "text-cyan-600" },
  ];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin": return <Badge variant="destructive">Admin</Badge>;
      case "doctor": return <Badge>Doctor</Badge>;
      case "clinic": return <Badge variant="secondary">Clinic</Badge>;
      default: return <Badge variant="outline">Member</Badge>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor platform activity, member signups, and training progress
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RoleToggle currentRole="admin" />
          <Button 
            variant="outline" 
            className="bg-green-50 border-green-500/40 text-green-700 hover:bg-green-100"
            onClick={() => fullSyncMutation.mutate()}
            disabled={fullSyncMutation.isPending}
            data-testid="button-sync-wp"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${fullSyncMutation.isPending ? "animate-spin" : ""}`} />
            {fullSyncMutation.isPending ? "Syncing..." : "Sync WP"}
          </Button>
          <Button variant="outline" onClick={() => refetchStats()} data-testid="button-refresh-stats">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <Card key={i} data-testid={`card-stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members" data-testid="tab-members">
            <Users className="h-4 w-4 mr-2" />
            Members
          </TabsTrigger>
          <TabsTrigger value="training" data-testid="tab-training">
            <GraduationCap className="h-4 w-4 mr-2" />
            Training
          </TabsTrigger>
          <TabsTrigger value="activity" data-testid="tab-activity">
            <Activity className="h-4 w-4 mr-2" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="wordpress-sync" data-testid="tab-wordpress-sync">
            <Download className="h-4 w-4 mr-2" />
            WordPress Sync
          </TabsTrigger>
          <TabsTrigger value="wordpress" data-testid="tab-wordpress" className="bg-blue-500/10 text-blue-400 data-[state=active]:bg-blue-500/30">
            <RefreshCw className="h-4 w-4 mr-2" />
            WordPress Mirror
          </TabsTrigger>
          <TabsTrigger value="payments" data-testid="tab-payments" className="bg-green-500/10 text-green-600 data-[state=active]:bg-green-500/30">
            <DollarSign className="h-4 w-4 mr-2" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="ui-evolutions" data-testid="tab-ui-evolutions">
            <Palette className="h-4 w-4 mr-2" />
            UI Evolutions
          </TabsTrigger>
          <TabsTrigger value="member-management" data-testid="tab-member-management" className="bg-emerald-500/10 text-emerald-400 data-[state=active]:bg-emerald-500/30">
            <Stethoscope className="h-4 w-4 mr-2" />
            Member Management
          </TabsTrigger>
          <TabsTrigger value="system-health" data-testid="tab-system-health">
            <Server className="h-4 w-4 mr-2" />
            System Health
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Member Overview</h3>
            <Button variant="outline" asChild data-testid="button-view-all-members">
              <a href="/admin/members">
                <Users className="h-4 w-4 mr-2" />
                View Full Roster
              </a>
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Recent Member Signups
              </CardTitle>
              <CardDescription>
                New members who joined in the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-4 animate-pulse">
                      <div className="h-10 w-10 rounded-full bg-muted"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-1/3"></div>
                        <div className="h-3 bg-muted rounded w-1/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentMembers.length > 0 ? (
                <div className="space-y-3">
                  {recentMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between gap-4 p-3 rounded-md border" data-testid={`row-member-${member.id}`}>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {member.firstName || member.lastName 
                              ? `${member.firstName || ''} ${member.lastName || ''}`.trim()
                              : member.email?.split('@')[0] || 'Unknown'}
                          </p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getRoleBadge(member.role)}
                        <span className="text-xs text-muted-foreground">
                          {new Date(member.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent signups to display</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Doctors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-cyan-600">{stats?.totalDoctors || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Active practitioners</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Clinics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">{stats?.totalClinics || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Registered clinics</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{stats?.totalMembers || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Total association members</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="training" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Training Modules
                </CardTitle>
                <CardDescription>
                  Available training content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {modules.slice(0, 5).map((module) => (
                    <div key={module.id} className="flex items-center justify-between p-2 rounded border">
                      <div>
                        <p className="font-medium text-sm">{module.title}</p>
                        <p className="text-xs text-muted-foreground">{module.category}</p>
                      </div>
                      <Badge variant="outline">{module.difficulty}</Badge>
                    </div>
                  ))}
                  {modules.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No modules yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Quizzes
                </CardTitle>
                <CardDescription>
                  Available assessments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {quizzes.slice(0, 5).map((quiz) => (
                    <div key={quiz.id} className="flex items-center justify-between p-2 rounded border">
                      <div>
                        <p className="font-medium text-sm">{quiz.title}</p>
                        <p className="text-xs text-muted-foreground">{quiz.questionsCount} questions</p>
                      </div>
                      <Badge variant="outline">Pass: {quiz.passingScore}%</Badge>
                    </div>
                  ))}
                  {quizzes.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No quizzes yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Training Progress Overview
              </CardTitle>
              <CardDescription>
                Overall member training completion rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Training analytics will appear here as members complete modules</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Platform-wide activity feed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Activity tracking will show logins, purchases, quiz completions, and more</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Orders</span>
                    <span className="font-medium">{stats?.totalOrders || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Products in Catalog</span>
                    <span className="font-medium">{stats?.totalProducts || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Content Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Training Modules</span>
                    <span className="font-medium">{modules.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quizzes</span>
                    <span className="font-medium">{quizzes.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="wordpress-sync" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Import WordPress Users
                </CardTitle>
                <CardDescription>
                  Sync all members, doctors, healers, and admins from your WordPress site
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>This will import all users from forgottenformula.com:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>WordPress administrators become Admins</li>
                    <li>Doctors and healers become Doctors</li>
                    <li>Clinic owners become Clinics</li>
                    <li>All other users become Members</li>
                  </ul>
                  <p className="text-xs">Existing users will be updated, not duplicated.</p>
                </div>
                <Button 
                  onClick={() => syncUsersMutation.mutate()}
                  disabled={syncUsersMutation.isPending}
                  data-testid="button-sync-users"
                >
                  {syncUsersMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing Users...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Import All WordPress Users
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Sync Products & Categories
                </CardTitle>
                <CardDescription>
                  Update products and categories from WooCommerce
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>Syncs all products from your WooCommerce store:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Product names, descriptions, and images</li>
                    <li>Pricing (retail, wholesale, doctor)</li>
                    <li>Stock status and availability</li>
                    <li>Categories and organization</li>
                  </ul>
                </div>
                <Button 
                  onClick={() => syncProductsMutation.mutate()}
                  disabled={syncProductsMutation.isPending}
                  variant="outline"
                  data-testid="button-sync-products"
                >
                  {syncProductsMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Syncing Products...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sync Products & Categories
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {syncResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {syncResult.success ? (
                    <CheckCircle className="h-5 w-5 text-cyan-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  User Import Results
                </CardTitle>
                <CardDescription>{syncResult.message}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 rounded-md bg-cyan-50 dark:bg-cyan-950/30">
                    <div className="text-2xl font-bold text-cyan-600">{syncResult.imported}</div>
                    <div className="text-sm text-muted-foreground">New Users Imported</div>
                  </div>
                  <div className="text-center p-4 rounded-md bg-blue-50 dark:bg-blue-950/30">
                    <div className="text-2xl font-bold text-blue-600">{syncResult.updated}</div>
                    <div className="text-sm text-muted-foreground">Users Updated</div>
                  </div>
                  <div className="text-center p-4 rounded-md bg-amber-50 dark:bg-amber-950/30">
                    <div className="text-2xl font-bold text-amber-600">{syncResult.skipped}</div>
                    <div className="text-sm text-muted-foreground">Skipped</div>
                  </div>
                </div>

                {syncResult.errors.length > 0 && (
                  <div className="p-4 rounded-md bg-red-50 dark:bg-red-950/30">
                    <h4 className="font-medium text-red-600 mb-2">Errors ({syncResult.errors.length})</h4>
                    <ul className="text-sm space-y-1">
                      {syncResult.errors.slice(0, 5).map((error, i) => (
                        <li key={i} className="text-red-600">{error}</li>
                      ))}
                      {syncResult.errors.length > 5 && (
                        <li className="text-muted-foreground">...and {syncResult.errors.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                )}

                {syncResult.details.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Import Details</h4>
                    <ScrollArea className="h-64 rounded-md border">
                      <div className="p-4 space-y-2">
                        {syncResult.details.map((detail, i) => (
                          <div key={i} className="flex items-center justify-between gap-4 p-2 rounded border text-sm">
                            <div className="flex items-center gap-2 min-w-0">
                              {detail.status === "imported" && <CheckCircle className="h-4 w-4 text-cyan-600 shrink-0" />}
                              {detail.status === "updated" && <RefreshCw className="h-4 w-4 text-blue-600 shrink-0" />}
                              {detail.status === "skipped" && <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />}
                              {detail.status === "error" && <XCircle className="h-4 w-4 text-red-600 shrink-0" />}
                              <span className="truncate">{detail.email}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant="outline" className="text-xs">{detail.role}</Badge>
                              {detail.reason && (
                                <span className="text-xs text-muted-foreground">{detail.reason}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* WordPress Role Discovery */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                WordPress Role Discovery
              </CardTitle>
              <CardDescription>
                Investigate actual WordPress roles and pricing settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>Discover all roles and pricing metadata from WordPress to ensure correct mapping.</p>
              </div>
              <Button 
                onClick={() => discoverRolesMutation.mutate()}
                disabled={discoverRolesMutation.isPending}
                variant="secondary"
                data-testid="button-discover-roles"
              >
                {discoverRolesMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Discovering...
                  </>
                ) : (
                  <>
                    <Activity className="h-4 w-4 mr-2" />
                    Discover WordPress Roles
                  </>
                )}
              </Button>

              {wpRoles && (
                <div className="mt-4 space-y-4">
                  {wpRoles.discoveredRoles && wpRoles.discoveredRoles.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Discovered Roles</h4>
                      <div className="flex flex-wrap gap-2">
                        {wpRoles.discoveredRoles.map((role: string, i: number) => (
                          <Badge key={i} variant="outline">{role}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {wpRoles.pricingMetaKeys && wpRoles.pricingMetaKeys.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Pricing Meta Keys</h4>
                      <div className="flex flex-wrap gap-2">
                        {wpRoles.pricingMetaKeys.map((key: string, i: number) => (
                          <Badge key={i} variant="secondary">{key}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {wpRoles.wcCustomers && wpRoles.wcCustomers.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Sample Customers ({wpRoles.wcCustomers.length})</h4>
                      <ScrollArea className="h-48 rounded-md border">
                        <div className="p-4 space-y-2">
                          {wpRoles.wcCustomers.slice(0, 20).map((c: any, i: number) => (
                            <div key={i} className="flex items-center justify-between gap-2 text-sm">
                              <span className="truncate">{c.email || c.username}</span>
                              <Badge variant="outline">{c.role || 'customer'}</Badge>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {wpRoles.wpUsers && wpRoles.wpUsers.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">WordPress Users ({wpRoles.wpUsers.length})</h4>
                      <ScrollArea className="h-64 rounded-md border">
                        <div className="p-4 space-y-2">
                          {wpRoles.wpUsers.map((u: any, i: number) => (
                            <div key={i} className="flex items-center justify-between gap-2 text-sm p-2 rounded border">
                              <div className="flex flex-col min-w-0">
                                <span className="font-medium truncate">{u.username}</span>
                                <span className="text-xs text-muted-foreground truncate">{u.email}</span>
                              </div>
                              <div className="flex flex-wrap gap-1 shrink-0">
                                {u.roles?.map((role: string, j: number) => (
                                  <Badge key={j} variant="outline" className="text-xs">{role}</Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {wpRoles.errors && wpRoles.errors.length > 0 && (
                    <div className="p-4 rounded-md bg-red-50 dark:bg-red-950/30">
                      <h4 className="font-medium text-red-600 mb-2">Errors</h4>
                      <ul className="text-sm space-y-1">
                        {wpRoles.errors.map((error: string, i: number) => (
                          <li key={i} className="text-red-600">{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {wpRoles.sampleProductMeta && (
                    <div>
                      <h4 className="font-medium mb-2">Sample Product Meta: {wpRoles.sampleProductMeta.name}</h4>
                      <ScrollArea className="h-48 rounded-md border">
                        <pre className="p-4 text-xs">
                          {JSON.stringify(wpRoles.sampleProductMeta.meta_data, null, 2)}
                        </pre>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="wordpress" className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-xl font-bold">WordPress Mirror Dashboard</h2>
              <p className="text-sm text-muted-foreground">Bidirectional sync between App and forgottenformula.com</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { refetchMirror(); queryClient.invalidateQueries({ queryKey: ["/api/admin/sync-tracking"] }); queryClient.invalidateQueries({ queryKey: ["/api/admin/sync-conflicts"] }); }}
                disabled={mirrorLoading}
              >
                {mirrorLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://forgottenformula.com/wp-admin', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                WP Admin
              </Button>
            </div>
          </div>

          {syncConflicts.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Sync Conflicts Detected</AlertTitle>
              <AlertDescription>
                {syncConflicts.length} record(s) were modified in both systems since last sync. Review and resolve below.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-blue-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-400" />
                  Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{mirrorStats?.local?.users ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">App</p>
                  </div>
                  <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-2xl font-bold">{mirrorStats?.wordpress?.users?.total ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">WordPress</p>
                  </div>
                </div>
                {syncTracking?.users && (
                  <div className="text-xs text-muted-foreground space-y-1 border-t pt-2">
                    {syncTracking.users.lastPulled && (
                      <div className="flex items-center gap-1"><ArrowDownLeft className="h-3 w-3 text-green-400" /> Pulled: {new Date(syncTracking.users.lastPulled).toLocaleDateString()}</div>
                    )}
                    {syncTracking.users.lastPushed && (
                      <div className="flex items-center gap-1"><ArrowUpRight className="h-3 w-3 text-blue-400" /> Pushed: {new Date(syncTracking.users.lastPushed).toLocaleDateString()}</div>
                    )}
                    {syncTracking.users.conflicts > 0 && (
                      <div className="flex items-center gap-1 text-red-400"><AlertTriangle className="h-3 w-3" /> {syncTracking.users.conflicts} conflicts</div>
                    )}
                  </div>
                )}
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => syncUsersMutation.mutate()} disabled={syncUsersMutation.isPending}>
                    <ArrowDownLeft className="h-3 w-3 mr-1" /> Pull
                  </Button>
                  <Dialog open={pushConfirmOpen === 'users'} onOpenChange={(open) => setPushConfirmOpen(open ? 'users' : null)}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="flex-1 text-xs">
                        <ArrowUpRight className="h-3 w-3 mr-1" /> Push
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Push Users to WordPress</DialogTitle>
                        <DialogDescription>This will push all unsynced local users to WordPress. Users already synced will be skipped.</DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setPushConfirmOpen(null)}>Cancel</Button>
                        <Button onClick={() => pushUsersMutation.mutate()} disabled={pushUsersMutation.isPending}>
                          {pushUsersMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                          Confirm Push
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-400" />
                  Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{mirrorStats?.local?.products ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">App</p>
                  </div>
                  <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-2xl font-bold">{mirrorStats?.wordpress?.products ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">WooCommerce</p>
                  </div>
                </div>
                {syncTracking?.products && (
                  <div className="text-xs text-muted-foreground space-y-1 border-t pt-2">
                    {syncTracking.products.lastPulled && (
                      <div className="flex items-center gap-1"><ArrowDownLeft className="h-3 w-3 text-green-400" /> Pulled: {new Date(syncTracking.products.lastPulled).toLocaleDateString()}</div>
                    )}
                    {syncTracking.products.lastPushed && (
                      <div className="flex items-center gap-1"><ArrowUpRight className="h-3 w-3 text-blue-400" /> Pushed: {new Date(syncTracking.products.lastPushed).toLocaleDateString()}</div>
                    )}
                    {syncTracking.products.conflicts > 0 && (
                      <div className="flex items-center gap-1 text-red-400"><AlertTriangle className="h-3 w-3" /> {syncTracking.products.conflicts} conflicts</div>
                    )}
                  </div>
                )}
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => syncProductsMutation.mutate()} disabled={syncProductsMutation.isPending}>
                    <ArrowDownLeft className="h-3 w-3 mr-1" /> Pull
                  </Button>
                  <Dialog open={pushConfirmOpen === 'products'} onOpenChange={(open) => setPushConfirmOpen(open ? 'products' : null)}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="flex-1 text-xs">
                        <ArrowUpRight className="h-3 w-3 mr-1" /> Push
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Push Products to WooCommerce</DialogTitle>
                        <DialogDescription>This will push local product changes back to WooCommerce. Only products with a WooCommerce ID will be updated.</DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setPushConfirmOpen(null)}>Cancel</Button>
                        <Button onClick={() => pushProductsMutation.mutate()} disabled={pushProductsMutation.isPending}>
                          {pushProductsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                          Confirm Push
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-blue-400" />
                  Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{mirrorStats?.wordpress?.orders ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">WooCommerce</p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground border-t pt-2">
                  <p>Orders are managed directly in WooCommerce. Use the webhook receiver to get real-time order notifications.</p>
                </div>
                <div className="mt-3">
                  <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => window.open('https://forgottenformula.com/wp-admin/edit.php?post_type=shop_order', '_blank')}>
                    <ExternalLink className="h-3 w-3 mr-1" /> View in WooCommerce
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-400" />
                Sync Status Panel
              </CardTitle>
              <CardDescription>Per-entity synchronization status and timestamps</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                {["users", "products", "categories", "clinics", "content"].map((type) => {
                  const tracking = syncTracking?.[type];
                  return (
                    <div key={type} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm capitalize">{type}</span>
                        {tracking?.conflicts > 0 ? (
                          <Badge variant="destructive" className="text-xs">{tracking.conflicts} conflicts</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/20">In Sync</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex justify-between">
                          <span>Last Pull:</span>
                          <span>{tracking?.lastPulled ? new Date(tracking.lastPulled).toLocaleString() : "Never"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Last Push:</span>
                          <span>{tracking?.lastPushed ? new Date(tracking.lastPushed).toLocaleString() : "Never"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tracked:</span>
                          <span>{tracking?.total ?? 0} entities</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {syncConflicts.length > 0 && (
            <Card className="border-red-500/20 bg-red-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  Conflict Resolution
                </CardTitle>
                <CardDescription>Records modified in both systems since last sync</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {syncConflicts.map((conflict: any) => (
                    <div key={conflict.id} className="flex items-center justify-between p-3 rounded-lg border border-red-500/20">
                      <div>
                        <p className="text-sm font-medium capitalize">{conflict.entityType} #{conflict.entityId || conflict.wpEntityId}</p>
                        <p className="text-xs text-muted-foreground">{conflict.conflictDetails || "Modified in both systems"}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolveConflictMutation.mutate(conflict.id)}
                        disabled={resolveConflictMutation.isPending}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Resolve
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-blue-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <ArrowLeftRight className="h-4 w-4 text-blue-400" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={() => fullSyncMutation.mutate()} disabled={fullSyncMutation.isPending}>
                  {fullSyncMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowDownLeft className="h-5 w-5 text-green-400" />}
                  <span className="text-xs">Full Pull Sync</span>
                </Button>
                <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={() => syncUsersMutation.mutate()} disabled={syncUsersMutation.isPending}>
                  {syncUsersMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Users className="h-5 w-5 text-blue-400" />}
                  <span className="text-xs">Pull Users</span>
                </Button>
                <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={() => syncProductsMutation.mutate()} disabled={syncProductsMutation.isPending}>
                  {syncProductsMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Package className="h-5 w-5 text-blue-400" />}
                  <span className="text-xs">Pull Products</span>
                </Button>
                <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={() => discoverRolesMutation.mutate()} disabled={discoverRolesMutation.isPending}>
                  {discoverRolesMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Activity className="h-5 w-5 text-purple-400" />}
                  <span className="text-xs">Discover WP Roles</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ui-evolutions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                UI Evolutions Queue
              </CardTitle>
              <CardDescription>
                Automated UI/UX code refactors proposed by FORGE and SYNTHESIS
              </CardDescription>
            </CardHeader>
            <CardContent>
              {proposalsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : uiProposals.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-muted/20 border border-dashed rounded-lg">
                  <Palette className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending UI evolutionary proposals.</p>
                  <p className="text-sm mt-2 opacity-75">When FORGE or SYNTHESIS generate new designs, they will appear here for SENTINEL review.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {uiProposals.map((proposal) => (
                    <Card key={proposal.id} className="border-l-4 overflow-hidden" style={{ borderLeftColor: proposal.status === 'pending' ? 'var(--blue-500)' : proposal.status === 'approved' ? 'var(--green-500)' : 'var(--red-500)' }}>
                      <CardHeader className="bg-muted/30 pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base flex items-center gap-2">
                              {proposal.agentId} proposed a refactor for:
                              <Badge variant="outline" className="font-mono bg-background">{proposal.targetFile}</Badge>
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {proposal.createdAt ? new Date(proposal.createdAt).toLocaleString() : "Unknown time"}
                            </CardDescription>
                          </div>
                          <Badge variant={proposal.status === 'pending' ? 'default' : proposal.status === 'approved' ? 'secondary' : 'destructive'} className="capitalize">
                            {proposal.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4">
                        <div>
                          <h4 className="font-medium text-sm mb-1">Description</h4>
                          <p className="text-sm text-foreground/80 whitespace-pre-wrap">{proposal.description || "No description provided."}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-sm mb-1">Proposed Code / Diff</h4>
                          <ScrollArea className="h-[200px] w-full rounded-md border bg-muted/50 p-4">
                            <pre className="text-xs font-mono mb-4 whitespace-pre-wrap word-break-all">
                              {proposal.proposedDiff}
                            </pre>
                          </ScrollArea>
                        </div>

                        {proposal.status === 'pending' && (
                          <div className="flex gap-2 pt-2 border-t">
                            <Button
                              onClick={() => approveProposalMutation.mutate(proposal.id)}
                              disabled={approveProposalMutation.isPending || rejectProposalMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Approve & Apply File
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => rejectProposalMutation.mutate(proposal.id)}
                              disabled={approveProposalMutation.isPending || rejectProposalMutation.isPending}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">${(paymentSummary?.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                <p className="text-xs text-muted-foreground mt-1">{paymentSummary?.totalTransactions || 0} transactions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">${(paymentSummary?.monthlyRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                <p className="text-xs text-muted-foreground mt-1">{paymentSummary?.monthlyTransactions || 0} this month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Weekly Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyan-600">${(paymentSummary?.weeklyRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                <p className="text-xs text-muted-foreground mt-1">{paymentSummary?.weeklyTransactions || 0} this week</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Failed / Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{(paymentSummary?.failedTransactions || 0) + (paymentSummary?.pendingTransactions || 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">{paymentSummary?.failedTransactions || 0} failed, {paymentSummary?.pendingTransactions || 0} pending</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Transaction Records
              </CardTitle>
              <CardDescription>All Stripe payment transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {adminPaymentsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse flex items-center gap-4 p-3">
                      <div className="h-10 w-10 rounded-full bg-muted"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-1/3"></div>
                        <div className="h-3 bg-muted rounded w-1/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (adminPayments?.payments || []).length > 0 ? (
                <div className="space-y-2">
                  {(adminPayments?.payments || []).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 rounded-md border" data-testid={`admin-payment-${payment.id}`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${payment.status === 'succeeded' ? 'bg-green-100' : payment.status === 'failed' ? 'bg-red-100' : 'bg-yellow-100'}`}>
                          <CreditCard className={`h-4 w-4 ${payment.status === 'succeeded' ? 'text-green-600' : payment.status === 'failed' ? 'text-red-600' : 'text-yellow-600'}`} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{payment.description || `Payment #${payment.id.slice(0, 8)}`}</p>
                          <p className="text-xs text-muted-foreground">
                            {payment.customerEmail || 'No email'} &middot; {payment.createdAt ? new Date(payment.createdAt).toLocaleString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={payment.status === 'succeeded' ? 'default' : payment.status === 'failed' ? 'destructive' : 'secondary'}>
                          {payment.status || 'pending'}
                        </Badge>
                        <span className="font-semibold">${Number(payment.amount).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                  {(adminPayments?.total || 0) > (adminPayments?.payments || []).length && (
                    <p className="text-center text-sm text-muted-foreground pt-2">
                      Showing {(adminPayments?.payments || []).length} of {adminPayments?.total} transactions
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No transactions recorded yet</p>
                  <p className="text-sm mt-1">Payments will appear here once members make purchases via Stripe.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="member-management" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="w-5 h-5" />
                    Member Management
                  </CardTitle>
                  <CardDescription>Full access to member roster, enrollment, protocols, clinical analysis, and messaging</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a href="/doctors" className="block">
                  <div className="p-4 rounded-xl border hover:bg-accent transition-colors cursor-pointer">
                    <Users className="w-8 h-8 mb-2 text-emerald-500" />
                    <h4 className="font-bold">Member Roster</h4>
                    <p className="text-sm text-muted-foreground mt-1">View and manage all members, add new members, assign doctors</p>
                  </div>
                </a>
                <a href="/blood-analysis" className="block">
                  <div className="p-4 rounded-xl border hover:bg-accent transition-colors cursor-pointer">
                    <Activity className="w-8 h-8 mb-2 text-violet-500" />
                    <h4 className="font-bold">Clinical Analysis</h4>
                    <p className="text-sm text-muted-foreground mt-1">Blood analysis, X-ray, skin analysis with AI</p>
                  </div>
                </a>
                <a href="/doctors" className="block">
                  <div className="p-4 rounded-xl border hover:bg-accent transition-colors cursor-pointer">
                    <FileText className="w-8 h-8 mb-2 text-blue-500" />
                    <h4 className="font-bold">Protocols & Messaging</h4>
                    <p className="text-sm text-muted-foreground mt-1">Protocol assignment, generation, and member communication</p>
                  </div>
                </a>
              </div>
              <div className="text-center pt-4">
                <Button asChild>
                  <a href="/admin/backoffice">
                    <Stethoscope className="w-4 h-4 mr-2" />
                    Open Full Member Tools in Backoffice
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system-health" className="space-y-6">
          <SystemHealthDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
