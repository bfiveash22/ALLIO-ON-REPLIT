import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock,
  Filter,
  Heart,
  Loader2,
  RefreshCw,
  Search,
  Shield,
  TrendingUp,
  Users,
  Wrench,
  Zap,
  XCircle,
  ArrowRight,
  BarChart3,
  Timer,
  Target,
} from "lucide-react";

const DIVISION_COLORS: Record<string, string> = {
  executive: "from-violet-500/20 to-violet-600/10 border-violet-500/30",
  marketing: "from-pink-500/20 to-pink-600/10 border-pink-500/30",
  science: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30",
  legal: "from-amber-500/20 to-amber-600/10 border-amber-500/30",
  financial: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
  engineering: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
  support: "from-orange-500/20 to-orange-600/10 border-orange-500/30",
};

const DIVISION_ICONS: Record<string, React.ElementType> = {
  executive: Shield,
  marketing: Heart,
  science: Zap,
  legal: Target,
  financial: TrendingUp,
  engineering: Wrench,
  support: Users,
};

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  failed: "bg-red-500/20 text-red-400 border-red-500/30",
  blocked: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  active: "bg-green-500/20 text-green-400 border-green-500/30",
  idle: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  error: "bg-red-500/20 text-red-400 border-red-500/30",
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  completed: CheckCircle2,
  in_progress: Loader2,
  pending: Clock,
  failed: XCircle,
  blocked: AlertTriangle,
  active: Activity,
  idle: Clock,
  error: AlertCircle,
};

const HEALTH_COLORS: Record<string, string> = {
  healthy: "text-green-400",
  warning: "text-yellow-400",
  degraded: "text-red-400",
};

function formatTimeAgo(dateStr?: string | null): string {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

interface AgentDetailDrawerProps {
  agentId: string | null;
  onClose: () => void;
}

function AgentDetailDrawer({ agentId, onClose }: AgentDetailDrawerProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/agents", agentId, "history"],
    queryFn: () => agentId
      ? apiRequest("GET", `/api/admin/agents/${agentId}/history?limit=30`).then(r => r.json())
      : null,
    enabled: !!agentId,
    refetchInterval: 20000,
  });

  return (
    <Dialog open={!!agentId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] bg-gray-900 border-white/10 text-white overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Bot className="w-5 h-5 text-cyan-400" />
            {agentId?.toUpperCase()} — Task History & Profile
          </DialogTitle>
          <DialogDescription className="text-white/50">
            Recent task log, tool usage, and error history
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : data ? (
          <div className="flex flex-col gap-4 overflow-hidden flex-1">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-400">{data.stats?.completed ?? 0}</div>
                <div className="text-xs text-white/50">Completed</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-400">{data.stats?.failed ?? 0}</div>
                <div className="text-xs text-white/50">Failed</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-cyan-400">{data.stats?.successRate ?? 0}%</div>
                <div className="text-xs text-white/50">Success Rate</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-xs text-white/50 mb-1">Avg. Duration</div>
                <div className="font-medium text-white">{data.stats?.avgDurationFormatted || "N/A"}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-xs text-white/50 mb-1">Total Iterations</div>
                <div className="font-medium text-white">{data.stats?.totalIterations ?? 0}</div>
              </div>
            </div>

            {data.topTools?.length > 0 && (
              <div>
                <div className="text-sm font-medium text-white/70 mb-2">Top Tools Used</div>
                <div className="flex flex-wrap gap-2">
                  {data.topTools.map((tool: { name: string; count: number }) => (
                    <Badge key={tool.name} variant="outline" className="border-white/10 text-white/60 text-xs">
                      {tool.name} <span className="ml-1 text-cyan-400">×{tool.count}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {data.recentErrors?.length > 0 && (
              <div>
                <div className="text-sm font-medium text-red-400 mb-2">Recent Failures</div>
                <div className="space-y-2">
                  {data.recentErrors.map((err: { taskId: string; title: string; errorLog?: string; failedAt?: string }) => (
                    <div key={err.taskId} className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                      <div className="text-sm font-medium text-white">{err.title}</div>
                      {err.errorLog && (
                        <div className="text-xs text-red-300/70 mt-1 font-mono truncate">{err.errorLog.slice(0, 120)}</div>
                      )}
                      <div className="text-xs text-white/40 mt-1">{formatTimeAgo(err.failedAt)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-medium text-white/70 mb-2">Task History</div>
              <ScrollArea className="h-[250px]">
                <div className="space-y-2">
                  {(data.tasks || []).map((task: any) => {
                    const StatusIcon = STATUS_ICONS[task.status] || Clock;
                    const colorClass = STATUS_COLORS[task.status] || STATUS_COLORS.pending;
                    return (
                      <div key={task.id} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass.split(" ")[0]}`}>
                          <StatusIcon className={`w-3.5 h-3.5 ${task.status === 'in_progress' ? 'animate-spin' : ''} ${colorClass.split(" ")[1]}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white truncate">{task.title}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className={`text-[10px] ${colorClass}`}>
                              {task.status.replace(/_/g, " ")}
                            </Badge>
                            {task.durationFormatted && (
                              <span className="text-xs text-white/40">
                                <Timer className="inline w-3 h-3 mr-0.5" />{task.durationFormatted}
                              </span>
                            )}
                            {task.toolCallCount > 0 && (
                              <span className="text-xs text-white/40">
                                <Wrench className="inline w-3 h-3 mr-0.5" />{task.toolCallCount} tools
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-white/40 flex-shrink-0">{formatTimeAgo(task.createdAt)}</div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-white/40">No data available</div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function AgentActivityDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeRange, setTimeRange] = useState("24");
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const { data: healthData, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ["/api/admin/agents/health"],
    queryFn: () => apiRequest("GET", "/api/admin/agents/health").then(r => r.json()),
    refetchInterval: 30000,
  });

  const { data: activityData, isLoading: activityLoading, refetch: refetchActivity } = useQuery({
    queryKey: ["/api/admin/agents/activity", timeRange, divisionFilter, statusFilter, searchQuery],
    queryFn: () => {
      const params = new URLSearchParams({ timeRange, limit: "200" });
      if (divisionFilter !== "all") params.set("division", divisionFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      return apiRequest("GET", `/api/admin/agents/activity?${params}`).then(r => r.json());
    },
    refetchInterval: 15000,
  });

  const handleRefresh = useCallback(() => {
    refetchHealth();
    refetchActivity();
  }, [refetchHealth, refetchActivity]);

  const filteredTasks = (activityData?.tasks || []).filter((task: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      task.title?.toLowerCase().includes(q) ||
      task.agentId?.toLowerCase().includes(q) ||
      task.division?.toLowerCase().includes(q)
    );
  });

  const divisions = Object.keys(DIVISION_COLORS);
  const agentHealthList: any[] = healthData?.agentHealth || [];
  const divisionHealth: Record<string, any> = healthData?.divisionHealth || {};
  const overall = healthData?.overall || {};

  const filteredAgents = agentHealthList.filter(a => {
    if (divisionFilter !== "all" && a.division !== divisionFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!a.agentId.toLowerCase().includes(q) && !a.name.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white p-6">
      <AgentDetailDrawer agentId={selectedAgent} onClose={() => setSelectedAgent(null)} />

      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Activity className="w-7 h-7 text-cyan-400" />
              Agent Activity Dashboard
            </h1>
            <p className="text-white/50 text-sm mt-1">
              Real-time health, task history, and performance across all 7 divisions
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-white/10 text-white hover:bg-white/10"
            onClick={handleRefresh}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="bg-black/20 border-white/10">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-white/50 mb-1">Active Agents</div>
                  <div className="text-2xl font-bold text-green-400">{overall.activeAgents ?? 0}</div>
                </div>
                <Activity className="w-8 h-8 text-green-400/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-black/20 border-white/10">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-white/50 mb-1">Tasks (24h)</div>
                  <div className="text-2xl font-bold text-cyan-400">{overall.totalTasks24h ?? 0}</div>
                </div>
                <BarChart3 className="w-8 h-8 text-cyan-400/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-black/20 border-white/10">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-white/50 mb-1">Completed (24h)</div>
                  <div className="text-2xl font-bold text-emerald-400">{overall.completedTasks24h ?? 0}</div>
                </div>
                <CheckCircle2 className="w-8 h-8 text-emerald-400/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-black/20 border-white/10">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-white/50 mb-1">Error Rate (24h)</div>
                  <div className={`text-2xl font-bold ${overall.overallErrorRate > 20 ? 'text-red-400' : overall.overallErrorRate > 5 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {overall.overallErrorRate ?? 0}%
                  </div>
                </div>
                <AlertCircle className="w-8 h-8 text-red-400/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              placeholder="Search agents, tasks..."
              className="pl-9 bg-white/5 border-white/10 text-white placeholder-white/30"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={divisionFilter} onValueChange={setDivisionFilter}>
            <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Division" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-white/10">
              <SelectItem value="all" className="text-white">All Divisions</SelectItem>
              {divisions.map(d => (
                <SelectItem key={d} value={d} className="text-white capitalize">{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-white/10">
              <SelectItem value="all" className="text-white">All Status</SelectItem>
              <SelectItem value="completed" className="text-white">Completed</SelectItem>
              <SelectItem value="in_progress" className="text-white">In Progress</SelectItem>
              <SelectItem value="pending" className="text-white">Pending</SelectItem>
              <SelectItem value="failed" className="text-white">Failed</SelectItem>
              <SelectItem value="blocked" className="text-white">Blocked</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-white/10">
              <SelectItem value="1" className="text-white">Last 1h</SelectItem>
              <SelectItem value="6" className="text-white">Last 6h</SelectItem>
              <SelectItem value="24" className="text-white">Last 24h</SelectItem>
              <SelectItem value="72" className="text-white">Last 3d</SelectItem>
              <SelectItem value="168" className="text-white">Last 7d</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-black/20 border border-white/10 mb-6">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white/10 text-white/60 data-[state=active]:text-white">
              Division Overview
            </TabsTrigger>
            <TabsTrigger value="agents" className="data-[state=active]:bg-white/10 text-white/60 data-[state=active]:text-white">
              Agent Grid
            </TabsTrigger>
            <TabsTrigger value="timeline" className="data-[state=active]:bg-white/10 text-white/60 data-[state=active]:text-white">
              Task Timeline
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {healthLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {(divisionFilter === "all" ? divisions : [divisionFilter]).map(divKey => {
                  const div = divisionHealth[divKey];
                  if (!div) return null;
                  const Icon = DIVISION_ICONS[divKey] || Shield;
                  const colorClass = DIVISION_COLORS[divKey] || "";
                  const healthColor = HEALTH_COLORS[div.health] || HEALTH_COLORS.healthy;
                  const completionRate = div.tasks24h > 0
                    ? Math.round((div.completed24h / div.tasks24h) * 100)
                    : 0;
                  const divAgents = agentHealthList.filter(a => a.division === divKey);
                  const activeAgentCount = divAgents.filter(a => a.liveStatus === 'active').length;

                  return (
                    <motion.div
                      key={divKey}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className={`bg-gradient-to-br ${colorClass} border hover:border-white/20 transition-colors cursor-default`}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                <Icon className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <CardTitle className="text-white text-sm">{div.name} Division</CardTitle>
                                <CardDescription className="text-white/50 text-xs">Lead: {div.lead}</CardDescription>
                              </div>
                            </div>
                            <Badge variant="outline" className={`text-xs ${div.health === 'healthy' ? 'border-green-500/40 text-green-400' : div.health === 'warning' ? 'border-yellow-500/40 text-yellow-400' : 'border-red-500/40 text-red-400'}`}>
                              {div.health}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className="text-center">
                              <div className="text-lg font-bold text-white">{div.tasks24h}</div>
                              <div className="text-[10px] text-white/40">Total Tasks</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-green-400">{div.completed24h}</div>
                              <div className="text-[10px] text-white/40">Completed</div>
                            </div>
                            <div className="text-center">
                              <div className={`text-lg font-bold ${div.errorRate > 20 ? 'text-red-400' : div.errorRate > 5 ? 'text-yellow-400' : 'text-white/60'}`}>
                                {div.errorRate}%
                              </div>
                              <div className="text-[10px] text-white/40">Error Rate</div>
                            </div>
                          </div>

                          <div className="mb-2">
                            <div className="flex justify-between text-[10px] text-white/40 mb-1">
                              <span>Completion Rate</span>
                              <span>{completionRate}%</span>
                            </div>
                            <Progress
                              value={completionRate}
                              className="h-1.5 bg-white/10"
                            />
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-white/40">{div.agentCount} agents</span>
                              {activeAgentCount > 0 && (
                                <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-400 py-0 px-1.5">
                                  {activeAgentCount} active
                                </Badge>
                              )}
                            </div>
                            <span className="text-[10px] text-white/40">
                              {div.throughput7d} tasks/7d
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-1">
                            {divAgents.slice(0, 8).map(agent => {
                              const statusColor = agent.liveStatus === 'active' ? 'bg-green-400' : agent.liveStatus === 'error' ? 'bg-red-400' : 'bg-gray-500';
                              return (
                                <button
                                  key={agent.agentId}
                                  onClick={() => setSelectedAgent(agent.agentId)}
                                  className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 transition-colors"
                                  title={`${agent.name} - ${agent.liveStatus}`}
                                >
                                  <div className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
                                  <span className="text-[10px] text-white/60">{agent.agentId.toUpperCase()}</span>
                                </button>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="agents">
            {healthLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredAgents.map(agent => {
                  const StatusIcon = STATUS_ICONS[agent.liveStatus] || Clock;
                  const colorClass = STATUS_COLORS[agent.liveStatus] || STATUS_COLORS.idle;
                  const divColor = DIVISION_COLORS[agent.division] || "";

                  return (
                    <motion.button
                      key={agent.agentId}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => setSelectedAgent(agent.agentId)}
                      className={`text-left p-3 rounded-xl border bg-gradient-to-br ${divColor} hover:border-white/30 transition-all`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${colorClass.split(" ")[0]}`}>
                          <StatusIcon className={`w-3 h-3 ${agent.liveStatus === 'active' ? 'animate-pulse' : ''} ${colorClass.split(" ")[1]}`} />
                        </div>
                        <Badge variant="outline" className={`text-[10px] py-0 ${colorClass}`}>
                          {agent.liveStatus}
                        </Badge>
                      </div>
                      <div className="font-bold text-white text-sm leading-tight">{agent.name}</div>
                      <div className="text-[10px] text-white/50 truncate">{agent.title}</div>

                      <div className="mt-2 grid grid-cols-2 gap-1">
                        <div className="text-center bg-black/20 rounded p-1">
                          <div className="text-sm font-bold text-green-400">{agent.completed24h}</div>
                          <div className="text-[9px] text-white/40">done</div>
                        </div>
                        <div className="text-center bg-black/20 rounded p-1">
                          <div className={`text-sm font-bold ${agent.errorRate > 20 ? 'text-red-400' : agent.errorRate > 5 ? 'text-yellow-400' : 'text-white/60'}`}>
                            {agent.errorRate}%
                          </div>
                          <div className="text-[9px] text-white/40">errors</div>
                        </div>
                      </div>

                      {agent.currentTaskTitle && (
                        <div className="mt-2 text-[10px] text-cyan-400 truncate">
                          ▶ {agent.currentTaskTitle}
                        </div>
                      )}

                      <div className="text-[9px] text-white/30 mt-1">
                        {formatTimeAgo(agent.lastActivityAt)}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="timeline">
            {activityLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
              </div>
            ) : (
              <Card className="bg-black/20 border-white/10">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-sm">
                      Task History Timeline
                    </CardTitle>
                    <div className="text-xs text-white/40">
                      {filteredTasks.length} tasks shown
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-2 pr-2">
                      <AnimatePresence>
                        {filteredTasks.length === 0 ? (
                          <div className="text-center py-16 text-white/30">
                            <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            No tasks found for the selected filters
                          </div>
                        ) : (
                          filteredTasks.map((task: any, idx: number) => {
                            const StatusIcon = STATUS_ICONS[task.status] || Clock;
                            const colorClass = STATUS_COLORS[task.status] || STATUS_COLORS.pending;
                            const divColor = DIVISION_COLORS[task.division] || "";

                            return (
                              <motion.div
                                key={task.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: Math.min(idx * 0.02, 0.3) }}
                                className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                              >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass.split(" ")[0]}`}>
                                  <StatusIcon className={`w-4 h-4 ${task.status === 'in_progress' ? 'animate-spin' : ''} ${colorClass.split(" ")[1]}`} />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                    <span className="font-medium text-white text-sm truncate">{task.title}</span>
                                    <Badge variant="outline" className={`text-[10px] py-0 ${colorClass}`}>
                                      {task.status.replace(/_/g, " ")}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-3 flex-wrap">
                                    <button
                                      onClick={() => setSelectedAgent(task.agentId)}
                                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5"
                                    >
                                      <Bot className="w-3 h-3" />
                                      {task.agentId?.toUpperCase()}
                                    </button>
                                    <span className="text-xs text-white/40 capitalize">{task.division}</span>
                                    {task.durationFormatted && (
                                      <span className="text-xs text-white/40">
                                        <Timer className="inline w-3 h-3 mr-0.5" />{task.durationFormatted}
                                      </span>
                                    )}
                                    {task.toolCallCount > 0 && (
                                      <span className="text-xs text-white/40">
                                        <Wrench className="inline w-3 h-3 mr-0.5" />{task.toolCallCount} tools
                                        {task.toolCallNames?.length > 0 && (
                                          <span className="text-white/25 ml-1">
                                            ({task.toolCallNames.slice(0, 3).join(", ")}{task.toolCallCount > 3 ? "…" : ""})
                                          </span>
                                        )}
                                      </span>
                                    )}
                                    {task.agenticIterations > 0 && (
                                      <span className="text-xs text-white/40">
                                        {task.agenticIterations} iter.
                                      </span>
                                    )}
                                  </div>
                                  {task.status === 'failed' && task.errorLog && (
                                    <div className="mt-1 text-xs text-red-300/60 font-mono truncate max-w-lg">
                                      {task.errorLog.slice(0, 100)}
                                    </div>
                                  )}
                                </div>

                                <div className="text-xs text-white/30 flex-shrink-0 text-right">
                                  <div>{formatTimeAgo(task.createdAt)}</div>
                                  {task.outputUrl && (
                                    <a
                                      href={task.outputUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-cyan-400 hover:underline"
                                      onClick={e => e.stopPropagation()}
                                    >
                                      View output
                                    </a>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })
                        )}
                      </AnimatePresence>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
