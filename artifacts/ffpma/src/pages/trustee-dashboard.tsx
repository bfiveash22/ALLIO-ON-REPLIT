import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { agents as staticAgents } from "@shared/agents";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarWidget } from "@/components/dashboard/CalendarWidget";
import { LegalSigningSection } from "@/components/dashboard/LegalSigningSection";

import { LanguageSwitcher } from "@/components/language-switcher";
import {
  Crown,
  Shield,
  Brain,
  Mail,
  Calendar,
  Users,
  Activity,
  TrendingUp,
  FileText,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Send,
  Eye,
  Star,
  Zap,
  Lock,
  PanelLeft,
  Globe,
  Database,
  Cloud,
  Folder,
  Image,
  Play,
  Settings,
  ShieldCheck,
  Bell,
  ChevronRight,
  CircuitBoard,
  Network,
  Target,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Download,
  Upload,
  Filter,
  Search,
  MoreHorizontal,
  Inbox,
  Archive,
  Trash2,
  Reply,
  Forward,
  Flag,
  Home,
  RefreshCcw,
  ArrowRightLeft,
  ShoppingCart,
  Package,
  GraduationCap,
  Stethoscope,
  Building2,
  AlertCircle,
  Radio,
  Film,
  Calculator,
  Scale,
  Wrench,
  Server,
  Palette,
  Heart,
  Dna,
  Pill,
  Leaf,
  Bot,
  Loader2,
  Check,
  Gavel,
  PenTool,
  Key,
  Webhook,
  Copy,
  Trash,
  Plus,
  ClipboardList,
  Sun,
  Moon,
  BookOpen,
  Printer,
  Share,
  Rocket,
  XCircle,
} from "lucide-react";

interface EmailSummary {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
  priority: "urgent" | "high" | "normal" | "low";
  category: "action-required" | "fyi" | "member" | "legal" | "financial" | "personal";
  isRead: boolean;
}

interface IntegrationStatus {
  name: string;
  status: "connected" | "disconnected" | "error";
  lastSync?: string;
  icon: React.ElementType;
}

interface DriveAsset {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  thumbnailLink?: string;
  modifiedTime?: string;
}

interface DriveFolder {
  id: string;
  name: string;
  files: DriveAsset[];
}

interface LegalDocument {
  id: string;
  title: string;
  docType: "trademark" | "patent" | "agreement" | "filing" | "compliance";
  status: "draft" | "review" | "pending_signature" | "filed" | "approved" | "rejected";
  description?: string;
  content?: string;
  filingNumber?: string;
  jurisdiction?: string;
  assignedAgent?: string;
  driveUrl?: string;
  priority?: string;
  dueDate?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

const priorityColors = {
  urgent: "bg-red-500/20 text-red-400 border-red-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  normal: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  low: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const categoryIcons = {
  "action-required": AlertTriangle,
  "fyi": Eye,
  "member": Users,
  "legal": Scale,
  "financial": Calculator,
  "personal": Heart,
};

function formatTimeAgo(dateStr?: string): string {
  if (!dateStr) return "Unknown";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hours ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} days ago`;
}

function categorizeEmail(from: string, subject: string): { priority: "urgent" | "high" | "normal" | "low"; category: "action-required" | "fyi" | "member" | "legal" | "financial" | "personal" } {
  const lowerSubject = subject.toLowerCase();
  const lowerFrom = from.toLowerCase();

  if (lowerSubject.includes("urgent") || lowerSubject.includes("asap") || lowerSubject.includes("emergency")) {
    return { priority: "urgent", category: "action-required" };
  }
  if (lowerFrom.includes("legal") || lowerSubject.includes("compliance") || lowerSubject.includes("contract")) {
    return { priority: "high", category: "legal" };
  }
  if (lowerFrom.includes("atlas") || lowerSubject.includes("financial") || lowerSubject.includes("invoice") || lowerSubject.includes("payment")) {
    return { priority: "normal", category: "financial" };
  }
  if (lowerFrom.includes("member") || lowerSubject.includes("doctor") || lowerSubject.includes("application")) {
    return { priority: "normal", category: "member" };
  }
  if (lowerFrom.includes("nancy") || lowerFrom.includes("kami")) {
    return { priority: "high", category: "action-required" };
  }
  return { priority: "normal", category: "fyi" };
}

interface MediaPreview {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  thumbnailLink?: string;
}

interface SentinelNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  agentId?: string;
  division?: string;
  taskId?: string;
  outputUrl?: string;
  priority?: number;
  isRead: boolean;
  createdAt: string;
}

const notificationTypeIcons: Record<string, React.ElementType> = {
  task_completed: CheckCircle2,
  research_update: Dna,
  module_update: GraduationCap,
  training_update: GraduationCap,
  rife_update: Radio,
  blood_analysis: Heart,
  product_update: Package,
  system_alert: AlertCircle,
  cross_division_request: ArrowRight,
};

const notificationTypeColors: Record<string, string> = {
  task_completed: "bg-green-500/20 text-green-400 border-green-500/30",
  research_update: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  module_update: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  training_update: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  rife_update: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  blood_analysis: "bg-red-500/20 text-red-400 border-red-500/30",
  product_update: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  system_alert: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  cross_division_request: "bg-pink-500/20 text-pink-400 border-pink-500/30",
};

function SentinelAlertsPanel() {
  const { toast } = useToast();

  const { data: notifications, refetch: refetchNotifications } = useQuery<SentinelNotification[]>({
    queryKey: ["/api/sentinel/notifications"],
    refetchInterval: 15000,
  });

  const { data: unreadData } = useQuery<{ notifications: SentinelNotification[]; count: number }>({
    queryKey: ["/api/sentinel/notifications/unread"],
    refetchInterval: 10000,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/sentinel/notifications/${id}/read`, { method: "POST" });
    },
    onSuccess: () => {
      refetchNotifications();
      queryClient.invalidateQueries({ queryKey: ["/api/sentinel/notifications/unread"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/sentinel/notifications/read-all", { method: "POST" });
    },
    onSuccess: () => {
      refetchNotifications();
      queryClient.invalidateQueries({ queryKey: ["/api/sentinel/notifications/unread"] });
      toast({ title: "All notifications marked as read" });
    },
  });

  const unreadCount = unreadData?.count || 0;

  return (
    <Card className="bg-black/20 border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-white">
              <Bell className="w-5 h-5 text-green-400" />
              Sentinel Alerts
              {unreadCount > 0 && (
                <Badge className="bg-green-500/30 text-green-300 ml-2">{unreadCount} new</Badge>
              )}
            </CardTitle>
            <CardDescription>Real-time updates from the AI agent network</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-white/10"
              onClick={() => refetchNotifications()}
              data-testid="button-refresh-alerts"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="border-white/10"
                onClick={() => markAllReadMutation.mutate()}
                data-testid="button-mark-all-read"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mark All Read
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!notifications || notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 mx-auto mb-4 text-white/20" />
            <h3 className="text-lg font-medium mb-2">No Alerts Yet</h3>
            <p className="text-white/50">Sentinel will notify you when agents complete tasks or have updates</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {notifications.map((notification) => {
                const Icon = notificationTypeIcons[notification.type] || Bell;
                const colorClass = notificationTypeColors[notification.type] || "bg-gray-500/20 text-gray-400";
                const timeAgo = formatTimeAgo(notification.createdAt);

                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg border transition-colors ${notification.isRead
                      ? "bg-white/5 border-white/5"
                      : "bg-green-500/5 border-green-500/20"
                      }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass.split(" ")[0]}`}>
                        <Icon className={`w-5 h-5 ${colorClass.split(" ")[1]}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`font-medium ${notification.isRead ? "text-white/70" : "text-white"}`}>
                            {notification.title}
                          </p>
                          <Badge className={colorClass} variant="outline">
                            {notification.type.replace(/_/g, " ")}
                          </Badge>
                          {!notification.isRead && (
                            <Badge className="bg-green-500/30 text-green-300">NEW</Badge>
                          )}
                        </div>
                        <p className="text-sm text-white/60 mb-2">{notification.message}</p>
                        <div className="flex items-center gap-4 text-xs text-white/40">
                          <span>{timeAgo}</span>
                          {notification.agentId && (
                            <span className="flex items-center gap-1">
                              <Bot className="w-3 h-3" />
                              {notification.agentId}
                            </span>
                          )}
                          {notification.division && (
                            <span className="capitalize">{notification.division}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {notification.outputUrl && (
                          <a
                            href={notification.outputUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:text-cyan-300"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-white/40 hover:text-white"
                            onClick={() => markReadMutation.mutate(notification.id)}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function SecurityTab() {
  const { toast } = useToast();
  const [newKeyName, setNewKeyName] = useState("");
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>(["task.completed", "task.failed"]);
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const { data: apiKeysData, refetch: refetchKeys } = useQuery({
    queryKey: ["/api/settings/api-keys"],
    queryFn: () => apiRequest("GET", "/api/settings/api-keys").then(r => r.json()),
  });

  const { data: auditData } = useQuery({
    queryKey: ["/api/settings/audit-logs"],
    queryFn: () => apiRequest("GET", "/api/settings/audit-logs?limit=20").then(r => r.json()),
    refetchInterval: 30000,
  });

  const { data: webhooksData, refetch: refetchWebhooks } = useQuery({
    queryKey: ["/api/settings/webhooks"],
    queryFn: () => apiRequest("GET", "/api/settings/webhooks").then(r => r.json()),
  });

  const { data: briefingsData } = useQuery({
    queryKey: ["/api/settings/briefings"],
    queryFn: () => apiRequest("GET", "/api/settings/briefings").then(r => r.json()),
    refetchInterval: 60000,
  });

  const createKeyMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/settings/api-keys", { name, permissions: ["read", "write"] });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.key?.rawKey) {
        setCreatedKey(data.key.rawKey);
        toast({ title: "API Key Created", description: "Copy it now â€” it won't be shown again." });
      }
      setNewKeyName("");
      refetchKeys();
    },
  });

  const revokeKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/settings/api-keys/${id}`);
    },
    onSuccess: () => {
      toast({ title: "API Key Revoked" });
      refetchKeys();
    },
  });

  const createWebhookMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/settings/webhooks", { url: newWebhookUrl, events: newWebhookEvents });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Webhook Registered" });
      setNewWebhookUrl("");
      refetchWebhooks();
    },
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/settings/webhooks/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Webhook Removed" });
      refetchWebhooks();
    },
  });

  const testWebhookMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/settings/webhooks/${id}/test`);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.success ? "Test Delivered" : "Test Failed",
        description: data.success ? `Status ${data.statusCode}` : data.error,
        variant: data.success ? "default" : "destructive",
      });
    },
  });

  const webhookEventOptions = [
    "task.completed", "task.failed", "task.stuck",
    "sync.completed", "agent.error",
    "briefing.morning", "briefing.evening", "*",
  ];

  return (
    <div className="space-y-6">
      {briefingsData && (
        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white" data-testid="text-daily-briefing-title">
              <Sun className="w-5 h-5 text-amber-400" />
              SENTINEL Daily Briefing
            </CardTitle>
            <CardDescription>Structured schedule: 6AM briefing, hourly checks, 6PM summary (CST)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {briefingsData.hourly && (
              <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-medium text-cyan-300">Latest Status</span>
                </div>
                <p className="text-sm text-white/80" data-testid="text-hourly-summary">{briefingsData.hourly}</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-medium text-amber-300">Morning Briefing</span>
                </div>
                {briefingsData.morning ? (
                  <div>
                    <p className="text-xs text-white/50 mb-1">{briefingsData.morning.subject}</p>
                    <pre className="text-xs text-white/70 whitespace-pre-wrap max-h-40 overflow-y-auto" data-testid="text-morning-briefing">{briefingsData.morning.body?.substring(0, 600)}</pre>
                    {briefingsData.morning.emailSent && <Badge className="mt-2 bg-green-500/20 text-green-300">Email Sent</Badge>}
                  </div>
                ) : (
                  <p className="text-xs text-white/40">Next at 6:00 AM CST</p>
                )}
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Moon className="w-4 h-4 text-violet-400" />
                  <span className="text-sm font-medium text-violet-300">Evening Summary</span>
                </div>
                {briefingsData.evening ? (
                  <div>
                    <p className="text-xs text-white/50 mb-1">{briefingsData.evening.subject}</p>
                    <pre className="text-xs text-white/70 whitespace-pre-wrap max-h-40 overflow-y-auto" data-testid="text-evening-summary">{briefingsData.evening.body?.substring(0, 600)}</pre>
                    {briefingsData.evening.emailSent && <Badge className="mt-2 bg-green-500/20 text-green-300">Email Sent</Badge>}
                  </div>
                ) : (
                  <p className="text-xs text-white/40">Next at 6:00 PM CST</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Key className="w-5 h-5 text-amber-400" />
              API Keys
            </CardTitle>
            <CardDescription>External API access for integrations and orchestrators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {createdKey && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <p className="text-xs text-green-300 mb-1 font-medium">New API Key (copy now â€” shown once):</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-green-200 bg-black/30 p-2 rounded flex-1 break-all" data-testid="text-new-api-key">{createdKey}</code>
                  <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(createdKey); toast({ title: "Copied" }); }} data-testid="button-copy-api-key">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Input
                placeholder="Key name (e.g., Abacus Orchestrator)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
                data-testid="input-api-key-name"
              />
              <Button
                size="sm"
                onClick={() => createKeyMutation.mutate(newKeyName)}
                disabled={!newKeyName || createKeyMutation.isPending}
                className="bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                data-testid="button-create-api-key"
              >
                <Plus className="w-4 h-4 mr-1" /> Create
              </Button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {apiKeysData?.keys?.map((key: any) => (
                <div key={key.id} className={`flex items-center justify-between p-2 rounded-lg ${key.isActive ? 'bg-white/5' : 'bg-red-500/5 opacity-50'}`}>
                  <div>
                    <span className="text-sm text-white">{key.name}</span>
                    <span className="text-xs text-white/40 ml-2">{key.keyPrefix}...</span>
                    {key.lastUsedAt && <span className="text-xs text-white/30 ml-2">Used {formatDistanceToNow(new Date(key.lastUsedAt))} ago</span>}
                  </div>
                  {key.isActive && (
                    <Button size="sm" variant="ghost" onClick={() => revokeKeyMutation.mutate(key.id)} className="text-red-400 hover:text-red-300" data-testid={`button-revoke-key-${key.id}`}>
                      <Trash className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
              {(!apiKeysData?.keys || apiKeysData.keys.length === 0) && (
                <p className="text-xs text-white/40 text-center py-4">No API keys created yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/20 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Webhook className="w-5 h-5 text-cyan-400" />
              Webhook Endpoints
            </CardTitle>
            <CardDescription>Outbound notifications for events (HMAC-SHA256 signed)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="https://your-server.com/webhook"
                value={newWebhookUrl}
                onChange={(e) => setNewWebhookUrl(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
                data-testid="input-webhook-url"
              />
              <div className="flex flex-wrap gap-1">
                {webhookEventOptions.map(evt => (
                  <Badge
                    key={evt}
                    className={`cursor-pointer text-xs ${newWebhookEvents.includes(evt) ? 'bg-cyan-500/30 text-cyan-200' : 'bg-white/5 text-white/40'}`}
                    onClick={() => setNewWebhookEvents(prev => prev.includes(evt) ? prev.filter(e => e !== evt) : [...prev, evt])}
                    data-testid={`badge-webhook-event-${evt}`}
                  >
                    {evt}
                  </Badge>
                ))}
              </div>
              <Button
                size="sm"
                onClick={() => createWebhookMutation.mutate()}
                disabled={!newWebhookUrl || newWebhookEvents.length === 0 || createWebhookMutation.isPending}
                className="bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 w-full"
                data-testid="button-create-webhook"
              >
                <Plus className="w-4 h-4 mr-1" /> Register Webhook
              </Button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {webhooksData?.endpoints?.map((ep: any) => (
                <div key={ep.id} className="p-2 rounded-lg bg-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/80 break-all">{ep.url}</span>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => testWebhookMutation.mutate(ep.id)} className="text-cyan-400 hover:text-cyan-300 h-6 px-2" data-testid={`button-test-webhook-${ep.id}`}>
                        <Zap className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteWebhookMutation.mutate(ep.id)} className="text-red-400 hover:text-red-300 h-6 px-2" data-testid={`button-delete-webhook-${ep.id}`}>
                        <Trash className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {ep.events?.map((e: string) => <Badge key={e} className="text-[10px] bg-white/5 text-white/50">{e}</Badge>)}
                  </div>
                  {ep.lastDeliveryAt && (
                    <span className="text-[10px] text-white/30 mt-1 block">
                      Last: {formatDistanceToNow(new Date(ep.lastDeliveryAt))} ago (HTTP {ep.lastDeliveryStatus})
                    </span>
                  )}
                </div>
              ))}
              {(!webhooksData?.endpoints || webhooksData.endpoints.length === 0) && (
                <p className="text-xs text-white/40 text-center py-4">No webhooks registered</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Shield className="w-5 h-5 text-red-400" />
              Security Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { layer: "Trustee Protection", status: "Active", level: 100 },
              { layer: "Organization Security", status: "Active", level: 98 },
              { layer: "Member Data Protection", status: "Active", level: 100 },
              { layer: "AI Network Security", status: "Active", level: 97 },
            ].map((layer) => (
              <div key={layer.layer} className="p-3 rounded-lg bg-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">{layer.layer}</span>
                  <Badge className="bg-cyan-500/20 text-cyan-300">{layer.status}</Badge>
                </div>
                <Progress value={layer.level} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-black/20 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <ClipboardList className="w-5 h-5 text-violet-400" />
              API Audit Log
            </CardTitle>
            <CardDescription>Recent admin API access</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {auditData?.logs?.map((log: any) => (
                <div key={log.id} className="flex items-center gap-2 p-1.5 rounded text-xs hover:bg-white/5">
                  <Badge className={`text-[10px] px-1 ${log.statusCode < 400 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                    {log.statusCode || '---'}
                  </Badge>
                  <span className="text-white/60 font-mono">{log.method}</span>
                  <span className="text-white/80 flex-1 truncate">{log.path}</span>
                  <Badge className="text-[10px] bg-white/5 text-white/40">{log.sourceType}</Badge>
                  <span className="text-white/30">{log.responseTimeMs}ms</span>
                </div>
              ))}
              {(!auditData?.logs || auditData.logs.length === 0) && (
                <p className="text-xs text-white/40 text-center py-4">No audit logs yet â€” access admin APIs to see entries</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface ChecklistItem {
  name: string;
  category: string;
  status: "pass" | "fail" | "warning";
  details: string;
}

interface ChecklistData {
  launchDate: string;
  checklist: ChecklistItem[];
  summary: { total: number; pass: number; fail: number; warning: number; readyPercent: number };
}

function LaunchReadinessWidget() {
  const { data: checklist, isLoading, refetch } = useQuery<ChecklistData>({
    queryKey: ["/api/launch/checklist"],
    refetchInterval: 60000,
  });

  const statusIcon = (status: string) => {
    if (status === "pass") return <CheckCircle2 className="w-5 h-5 text-green-400" />;
    if (status === "warning") return <AlertTriangle className="w-5 h-5 text-amber-400" />;
    return <AlertCircle className="w-5 h-5 text-red-400" />;
  };

  const statusBadge = (status: string) => {
    if (status === "pass") return <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Ready</Badge>;
    if (status === "warning") return <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">Warning</Badge>;
    return <Badge className="bg-red-500/20 text-red-300 border-red-500/30">Action Required</Badge>;
  };

  if (isLoading) {
    return (
      <Card className="bg-black/20 border-white/10">
        <CardContent className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-white/40" />
          <p className="mt-4 text-white/60">Loading launch checklist...</p>
        </CardContent>
      </Card>
    );
  }

  const summary = checklist?.summary;

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-amber-100">
                <Rocket className="w-5 h-5 text-amber-400" />
                April 1, 2026 Launch Readiness
              </CardTitle>
              <CardDescription>Pre-launch checklist and system health status</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="border-white/10" onClick={() => refetch()} data-testid="button-refresh-checklist">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {summary && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-black/20 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-white">{summary.readyPercent}%</p>
                <p className="text-xs text-white/60 mt-1">Overall Ready</p>
              </div>
              <div className="bg-green-500/10 rounded-lg p-4 text-center border border-green-500/20">
                <p className="text-3xl font-bold text-green-400">{summary.pass}</p>
                <p className="text-xs text-green-300/60 mt-1">Passing</p>
              </div>
              <div className="bg-amber-500/10 rounded-lg p-4 text-center border border-amber-500/20">
                <p className="text-3xl font-bold text-amber-400">{summary.warning}</p>
                <p className="text-xs text-amber-300/60 mt-1">Warnings</p>
              </div>
              <div className="bg-red-500/10 rounded-lg p-4 text-center border border-red-500/20">
                <p className="text-3xl font-bold text-red-400">{summary.fail}</p>
                <p className="text-xs text-red-300/60 mt-1">Failing</p>
              </div>
            </div>
          )}

          <Progress value={summary?.readyPercent || 0} className="h-3 mb-6" />

          <div className="space-y-3">
            {checklist?.checklist.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-black/20 border border-white/5">
                <div className="flex items-center gap-3">
                  {statusIcon(item.status)}
                  <div>
                    <p className="font-medium text-white">{item.name}</p>
                    <p className="text-sm text-white/50">{item.details}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs text-white/40 border-white/10">{item.category}</Badge>
                  {statusBadge(item.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface ProtocolQueueItem {
  id: number;
  patientName: string;
  patientAge: number | null;
  sourceType: string;
  memberId: string | null;
  doctorId: string | null;
  status: string;
  slidesWebViewLink: string | null;
  pdfDriveFileId: string | null;
  pdfDriveWebViewLink: string | null;
  generatedBy: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

function ProtocolQueuePanel() {
  const { toast } = useToast();
  const [reviewNotes, setReviewNotes] = useState("");
  const [selectedProtocol, setSelectedProtocol] = useState<number | null>(null);
  const [assignDoctorId, setAssignDoctorId] = useState("");

  const { data: allProtocols, refetch: refetchProtocols } = useQuery<ProtocolQueueItem[]>({
    queryKey: ["/api/protocol-assembly/protocols"],
    refetchInterval: 30000,
  });

  const pendingProtocols = allProtocols?.filter(p => p.status === 'pending_review') || [];
  const approvedProtocols = allProtocols?.filter(p => p.status === 'approved') || [];
  const draftProtocols = allProtocols?.filter(p => p.status === 'draft') || [];

  const submitForReviewMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/protocol-assembly/protocols/${id}/status`, { status: 'pending_review' });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Protocol submitted for review" });
      refetchProtocols();
    },
    onError: () => toast({ title: "Failed to submit for review", variant: "destructive" }),
  });

  const approveProtocolMutation = useMutation({
    mutationFn: async ({ id, notes, doctorId }: { id: number; notes: string; doctorId?: string }) => {
      const res = await apiRequest("PATCH", `/api/protocol-assembly/protocols/${id}/status`, {
        status: 'approved',
        reviewNotes: notes,
        doctorId: doctorId || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Protocol approved and uploaded to Drive" });
      setReviewNotes("");
      setSelectedProtocol(null);
      setAssignDoctorId("");
      refetchProtocols();
    },
    onError: (error: any) => toast({ title: error?.message || "Failed to approve protocol", variant: "destructive" }),
  });

  const rejectProtocolMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes: string }) => {
      const res = await apiRequest("PATCH", `/api/protocol-assembly/protocols/${id}/status`, {
        status: 'rejected',
        reviewNotes: notes,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Protocol rejected" });
      setReviewNotes("");
      setSelectedProtocol(null);
      refetchProtocols();
    },
    onError: () => toast({ title: "Failed to reject protocol", variant: "destructive" }),
  });

  const uploadToDriveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/protocol-assembly/protocols/${id}/upload-to-drive`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Protocol PDF uploaded to Google Drive" });
      refetchProtocols();
    },
    onError: () => toast({ title: "Drive upload failed", variant: "destructive" }),
  });

  const renderProtocolCard = (protocol: ProtocolQueueItem, showActions: boolean) => (
    <motion.div
      key={protocol.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-lg border transition-colors ${
        selectedProtocol === protocol.id
          ? "bg-emerald-500/10 border-emerald-500/30"
          : "bg-white/5 border-white/10 hover:border-white/20"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="font-medium text-white">{protocol.patientName}</p>
            <div className="flex items-center gap-2 mt-1">
              {protocol.patientAge && (
                <span className="text-xs text-white/50">Age: {protocol.patientAge}</span>
              )}
              <Badge variant="outline" className="text-xs">
                {protocol.sourceType === 'intake_form' ? 'Intake Form' : 'Transcript'}
              </Badge>
              <Badge className={`text-xs ${
                protocol.status === 'approved' ? 'bg-green-500/20 text-green-300' :
                protocol.status === 'pending_review' ? 'bg-amber-500/20 text-amber-300' :
                protocol.status === 'rejected' ? 'bg-red-500/20 text-red-300' :
                'bg-gray-500/20 text-gray-300'
              }`}>
                {protocol.status.replace(/_/g, ' ').toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {protocol.slidesWebViewLink && (
            <a href={protocol.slidesWebViewLink} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="border-white/10 text-xs">
                <Play className="w-3 h-3 mr-1" />
                Slides
              </Button>
            </a>
          )}
          {protocol.pdfDriveWebViewLink && (
            <a href={protocol.pdfDriveWebViewLink} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="border-white/10 text-xs">
                <FileText className="w-3 h-3 mr-1" />
                PDF
              </Button>
            </a>
          )}
          <a href={`/api/protocol-assembly/protocols/${protocol.id}/pdf`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="border-white/10 text-xs">
              <Download className="w-3 h-3 mr-1" />
              Download
            </Button>
          </a>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-white/40 mb-3">
        <span>Generated by: {protocol.generatedBy || 'system'}</span>
        <span>{formatTimeAgo(protocol.createdAt)}</span>
        {protocol.doctorId && <span>Doctor: {protocol.doctorId}</span>}
        {protocol.reviewedBy && <span>Reviewed by: {protocol.reviewedBy}</span>}
      </div>

      {protocol.reviewNotes && (
        <div className="p-2 rounded bg-white/5 text-xs text-white/60 mb-3">
          <span className="font-medium text-white/70">Review Notes:</span> {protocol.reviewNotes}
        </div>
      )}

      {showActions && protocol.status === 'draft' && (
        <Button
          size="sm"
          className="bg-amber-500 hover:bg-amber-600"
          onClick={() => submitForReviewMutation.mutate(protocol.id)}
          disabled={submitForReviewMutation.isPending}
        >
          {submitForReviewMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Send className="w-3 h-3 mr-1" />}
          Submit for Review
        </Button>
      )}

      {showActions && protocol.status === 'pending_review' && (
        <div className="space-y-3 mt-2">
          <div className="flex gap-2">
            <Input
              placeholder="Assign to doctor ID (optional)"
              value={selectedProtocol === protocol.id ? assignDoctorId : ""}
              onChange={(e) => { setSelectedProtocol(protocol.id); setAssignDoctorId(e.target.value); }}
              className="flex-1 bg-white/5 border-white/10 text-sm"
            />
          </div>
          <Textarea
            placeholder="Review notes (optional)..."
            value={selectedProtocol === protocol.id ? reviewNotes : ""}
            onChange={(e) => { setSelectedProtocol(protocol.id); setReviewNotes(e.target.value); }}
            className="bg-white/5 border-white/10 text-sm"
            rows={2}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-green-500 hover:bg-green-600"
              onClick={() => approveProtocolMutation.mutate({ id: protocol.id, notes: reviewNotes, doctorId: assignDoctorId || protocol.doctorId || undefined })}
              disabled={approveProtocolMutation.isPending || (!assignDoctorId && !protocol.doctorId)}
              title={!assignDoctorId && !protocol.doctorId ? 'Assign a doctor before approving' : ''}
            >
              {approveProtocolMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
              Approve & Upload
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              onClick={() => rejectProtocolMutation.mutate({ id: protocol.id, notes: reviewNotes })}
              disabled={rejectProtocolMutation.isPending}
            >
              {rejectProtocolMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Trash2 className="w-3 h-3 mr-1" />}
              Reject
            </Button>
            {!protocol.pdfDriveFileId && (
              <Button
                size="sm"
                variant="outline"
                className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                onClick={() => uploadToDriveMutation.mutate(protocol.id)}
                disabled={uploadToDriveMutation.isPending}
              >
                {uploadToDriveMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
                Upload to Drive
              </Button>
            )}
          </div>
        </div>
      )}

      {showActions && protocol.status === 'approved' && !protocol.pdfDriveFileId && (
        <Button
          size="sm"
          variant="outline"
          className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 mt-2"
          onClick={() => uploadToDriveMutation.mutate(protocol.id)}
          disabled={uploadToDriveMutation.isPending}
        >
          {uploadToDriveMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
          Upload to Drive
        </Button>
      )}
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-emerald-500/5 to-green-500/5 border-emerald-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <CardTitle>Protocol Review Queue</CardTitle>
                <CardDescription>Review, approve, and deliver patient protocols to doctors</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-amber-500/20 text-amber-300">{pendingProtocols.length} Pending</Badge>
              <Badge className="bg-green-500/20 text-green-300">{approvedProtocols.length} Approved</Badge>
              <Badge className="bg-gray-500/20 text-gray-300">{draftProtocols.length} Draft</Badge>
              <Button variant="outline" size="sm" className="border-white/10" onClick={() => refetchProtocols()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {pendingProtocols.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending Review ({pendingProtocols.length})
              </h3>
              <div className="space-y-4">
                {pendingProtocols.map(p => renderProtocolCard(p, true))}
              </div>
            </div>
          )}

          {draftProtocols.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Drafts ({draftProtocols.length})
              </h3>
              <div className="space-y-4">
                {draftProtocols.map(p => renderProtocolCard(p, true))}
              </div>
            </div>
          )}

          {approvedProtocols.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Approved ({approvedProtocols.length})
              </h3>
              <div className="space-y-4">
                {approvedProtocols.map(p => renderProtocolCard(p, true))}
              </div>
            </div>
          )}

          {(!allProtocols || allProtocols.length === 0) && (
            <div className="text-center py-12">
              <ClipboardList className="w-16 h-16 mx-auto mb-4 text-white/20" />
              <h3 className="text-lg font-medium mb-2">No Protocols Yet</h3>
              <p className="text-white/50">Protocols will appear here once generated from patient intake forms or transcripts</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function TrusteeDashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("command-center");
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [taskResponse, setTaskResponse] = useState("");
  const [mediaPreview, setMediaPreview] = useState<MediaPreview | null>(null);
  const [viewAs, setViewAs] = useState<"trustee" | "member" | "admin" | "doctor">("trustee");
  const [selectedPriorityItem, setSelectedPriorityItem] = useState<string | null>(null);
  const [delegateAgent, setDelegateAgent] = useState<string>("");
  const [cmdSearch, setCmdSearch] = useState("");
  const [cmdDivisionFilter, setCmdDivisionFilter] = useState<string>("all");
  const [cmdShowTaskForm, setCmdShowTaskForm] = useState(false);
  const [cmdTaskAgent, setCmdTaskAgent] = useState("");
  const [cmdTaskTitle, setCmdTaskTitle] = useState("");
  const [cmdTaskDesc, setCmdTaskDesc] = useState("");
  const [cmdTaskPriority, setCmdTaskPriority] = useState("2");
  const [revisingProposalId, setRevisingProposalId] = useState<string | null>(null);
  const [revisionFeedback, setRevisionFeedback] = useState("");
  const [libraryAgent, setLibraryAgent] = useState<string>("");
  const [libraryUploading, setLibraryUploading] = useState(false);
  const [libraryUploadProgress, setLibraryUploadProgress] = useState(0);
  const [libraryDragOver, setLibraryDragOver] = useState(false);

  const handleViewChange = (value: string) => {
    setViewAs(value as any);
    switch (value) {
      case "member":
        setLocation("/dashboard");
        break;
      case "admin":
        setLocation("/admin");
        break;
      case "doctor":
        setLocation("/doctors");
        break;
      default:
        break;
    }
  };

  const { data: driveStatus } = useQuery<{ connected: boolean; email?: string }>({
    queryKey: ["/api/drive/status"],
    refetchInterval: 60000,
  });

  const { data: driveStructure, refetch: refetchDrive } = useQuery<{ allio: { id: string; name: string } | null; subfolders: DriveFolder[] }>({
    queryKey: ["/api/drive/structure"],
  });

  const { data: allDivisionsStructure, refetch: refetchDriveAssets } = useQuery<{ allio: { id: string; name: string } | null; divisions: Record<string, DriveFolder[]> }>({
    queryKey: ["/api/drive/all-divisions-structure"],
  });

  const { data: signNowStatus } = useQuery<{ connected: boolean; configured: boolean }>({
    queryKey: ["/api/signnow/status"],
  });

  const { data: adminStats } = useQuery<{
    totalMembers: number;
    totalDoctors: number;
    totalClinics: number;
    recentSignups: number;
    totalContracts?: number;
    signedContracts?: number;
    pendingContracts?: number;
    dataSource?: { wordpress: boolean; signNow: boolean; local: boolean };
  }>({
    queryKey: ["/api/admin/stats"],
    refetchInterval: 30000,
  });

  interface AgentNetworkStats {
    taskStats: { total: number; pending: number; inProgress: number; completed: number; blocked: number };
    divisionStats: Record<string, { total: number; completed: number; pending: number; inProgress: number }>;
    pendingReviews: number;
    costProjections: { aiCalls: { estimated: number }; storage: { estimated: number }; total: { estimated: number } };
    metrics: { completionRate: number; daysRemaining: number; outputsProduced: number; activeAgents: number };
    lastUpdated: string;
  }

  const { data: networkStats, refetch: refetchNetworkStats } = useQuery<AgentNetworkStats>({
    queryKey: ["/api/agent-network/stats"],
    refetchInterval: 30000,
  });

  const { data: recentMembers = [] } = useQuery({
    queryKey: ["/api/admin/recent-members"],
  });

  const { data: inboxData, isError: inboxError } = useQuery<{ connected: boolean; messages: Array<{ id: string; from: string; subject: string; snippet: string; date: string; isUnread: boolean }> }>({
    queryKey: ["/api/gmail/inbox"],
    retry: false,
  });

  const { data: legalDocuments = [], refetch: refetchLegalDocs } = useQuery<LegalDocument[]>({
    queryKey: ["/api/legal/documents"],
  });

  interface IntegrationRegistryStatus {
    id: string;
    name: string;
    mode: "live" | "placeholder";
    connectionState: "connected" | "disconnected" | "error" | "not_implemented";
    lastCheckedAt: string | null;
    lastSuccessAt: string | null;
    lastError: string | null;
    sampleData: string | null;
    nextSteps: string | null;
  }

  const { data: rawIntegrationData, refetch: refetchIntegrations } = useQuery<{ integrations: IntegrationRegistryStatus[] } | IntegrationRegistryStatus[]>({
    queryKey: ["/api/integrations/status"],
    refetchInterval: 30000,
  });
  const integrationStatuses: IntegrationRegistryStatus[] = Array.isArray(rawIntegrationData)
    ? rawIntegrationData
    : Array.isArray((rawIntegrationData as any)?.integrations)
      ? (rawIntegrationData as any).integrations
      : [];

  interface AgentTask {
    id: string;
    agentId: string;
    division: string;
    title: string;
    description: string | null;
    status: "pending" | "in_progress" | "completed" | "blocked";
    priority: number | null;
    progress: number | null;
    outputUrl: string | null;
    outputDriveFileId: string | null;
    createdAt: string;
    updatedAt: string | null;
    completedAt: string | null;
  }

  const { data: agentTasks = [], refetch: refetchAgentTasks } = useQuery<AgentTask[]>({
    queryKey: ["/api/agent-tasks"],
    refetchInterval: 30000,
  });

  const { data: deadline } = useQuery<{ daysRemaining: number; hoursRemaining: number; formatted: string }>({
    queryKey: ["/api/deadline"],
    refetchInterval: 60000,
  });

  const { data: allClinics = [] } = useQuery<any[]>({
    queryKey: ["/api/clinics"],
    refetchInterval: 60000,
  });

  const { data: syncStatus, refetch: refetchSyncStatus } = useQuery<{ products: number; members: number; categories: number; woocommerce: { connected: boolean } }>({
    queryKey: ["/api/sync/status"],
    refetchInterval: 30000,
  });

  // SENTINEL Orchestrator Data
  interface SentinelAgent {
    agentId: string;
    name: string;
    division: string;
    description: string;
    status: string;
    lastActive: string | null;
    tasksCompleted: number;
  }

  interface SentinelDivision {
    id: string;
    name: string;
    agents: string[];
    lead: string;
    description: string;
  }

  interface SentinelTask {
    id: string;
    agentId: string;
    title: string;
    description: string;
    status: string;
    priority: number;
    evidenceType: string | null;
    evidenceUrl: string | null;
    evidenceVerified: boolean;
    createdAt: string;
    completedAt: string | null;
  }

  const { data: sentinelAgents, refetch: refetchSentinelAgents } = useQuery<{ agents: SentinelAgent[]; count: number }>({
    queryKey: ["/api/sentinel/agents"],
    refetchInterval: 15000,
  });

  const { data: sentinelDivisions } = useQuery<{ divisions: SentinelDivision[] }>({
    queryKey: ["/api/sentinel/divisions"],
    refetchInterval: 30000,
  });

  const { data: sentinelTasks, refetch: refetchSentinelTasks } = useQuery<{ tasks: SentinelTask[]; count: number }>({
    queryKey: ["/api/sentinel/tasks"],
    refetchInterval: 30000,
  });

  const initializeSentinelMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/sentinel/initialize", {});
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "SENTINEL Network Initialized",
        description: `${data.agentCount} agents registered and ready`,
      });
      refetchSentinelAgents();
    },
    onError: (error: any) => {
      toast({ title: "Initialization Failed", description: error.message, variant: "destructive" });
    },
  });

  const createSentinelTaskMutation = useMutation({
    mutationFn: async (data: { agentId: string; title: string; description: string; priority?: number; evidenceType?: string }) => {
      const res = await apiRequest("POST", "/api/sentinel/tasks", data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Task Created via SENTINEL",
        description: `Task assigned to ${data.agentId}`,
      });
      refetchSentinelTasks();
    },
    onError: (error: any) => {
      toast({ title: "Task Creation Failed", description: error.message, variant: "destructive" });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/sync/full");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Sync Complete",
        description: `Synced ${data.products} products, ${data.users?.imported || 0} new users, ${data.users?.updated || 0} updated`,
      });
      refetchSyncStatus();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { data: uiProposalsData, refetch: refetchUiProposals } = useQuery<{ proposals: any[], count: number }>({
    queryKey: ["/api/sentinel/ui-proposals"],
    refetchInterval: 15000,
  });

  const approveProposalMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/sentinel/ui-proposals/${id}/approve`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "UI Proposal Approved", description: "The patch has been safely injected into the live frontend." });
      refetchUiProposals();
    },
    onError: (error: any) => {
      toast({ title: "Approval Failed", description: error.message, variant: "destructive" });
    },
  });

  const rejectProposalMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/sentinel/ui-proposals/${id}/reject`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "UI Proposal Dismissed" });
      refetchUiProposals();
    },
  });

  const reviseProposalMutation = useMutation({
    mutationFn: async ({ id, feedback }: { id: string, feedback: string }) => {
      const res = await apiRequest("POST", `/api/sentinel/ui-proposals/${id}/revise`, { feedback });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Revision Requested", description: "Design agent has been tasked with revisions." });
      setRevisingProposalId(null);
      setRevisionFeedback("");
      refetchUiProposals();
    },
    onError: (error: any) => {
      toast({ title: "Request Failed", description: error.message, variant: "destructive" });
    },
  });

  const delegateTaskMutation = useMutation({
    mutationFn: async (data: { agentId: string; title: string; description: string; priority?: number }) => {
      const response = await apiRequest("POST", "/api/agent-tasks", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Task Delegated",
        description: `Task assigned to ${data.agentId.toUpperCase()}`,
      });
      setTaskResponse("");
      setDelegateAgent("");
      setSelectedPriorityItem(null);
      refetchAgentTasks();
    },
    onError: (error: any) => {
      toast({
        title: "Delegation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const retryAgentTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await apiRequest("POST", `/api/agent-tasks/${taskId}/retry`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Force Retry Dispatched", description: `Task reset for agent ${data.task.agentId}` });
      refetchAgentTasks();
    },
    onError: (error: any) => {
      toast({ title: "Retry Failed", description: error.message, variant: "destructive" });
    },
  });

  const reassignAgentTaskMutation = useMutation({
    mutationFn: async ({ taskId, newAgentId }: { taskId: string, newAgentId: string }) => {
      const response = await apiRequest("POST", `/api/agent-tasks/${taskId}/reassign`, { newAgentId });
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Task Reassigned", description: `Task moved to ${data.task.agentId}` });
      refetchAgentTasks();
    },
    onError: (error: any) => {
      toast({ title: "Reassign Failed", description: error.message, variant: "destructive" });
    },
  });

  const cmdCreateTaskMutation = useMutation({
    mutationFn: async (data: { agentId: string; division: string; title: string; description: string; status: string; priority: number }) => {
      const response = await apiRequest("POST", "/api/agent-tasks", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Task Assigned", description: `Task "${cmdTaskTitle}" assigned to ${data.agentId?.toUpperCase() || cmdTaskAgent.toUpperCase()}` });
      setCmdTaskTitle("");
      setCmdTaskDesc("");
      setCmdTaskAgent("");
      setCmdTaskPriority("2");
      setCmdShowTaskForm(false);
      refetchAgentTasks();
    },
    onError: (error: any) => {
      toast({ title: "Task Assignment Failed", description: error.message, variant: "destructive" });
    },
  });

  const respondToTaskMutation = useMutation({
    mutationFn: async (data: { taskId: string; response: string }) => {
      const response = await apiRequest("PATCH", `/api/agent-tasks/${data.taskId}`, {
        notes: data.response,
        status: "completed"
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Response Sent",
        description: "Task marked as complete with your response",
      });
      setTaskResponse("");
      setSelectedPriorityItem(null);
      refetchAgentTasks();
    },
    onError: (error: any) => {
      toast({
        title: "Response Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getPriorityTasks = () => {
    return agentTasks
      .filter(t => t.status === "pending" || t.status === "blocked" || (t.status === "in_progress" && t.priority === 1))
      .sort((a, b) => (a.priority || 5) - (b.priority || 5))
      .slice(0, 5);
  };

  const getTasksByDivision = (division: string) => {
    return agentTasks.filter(t => t.division === division);
  };

  const getAgentActiveTask = (agentId: string) => {
    const inProgress = agentTasks.find(t => t.agentId === agentId && t.status === "in_progress");
    if (inProgress) return inProgress;
    const pending = agentTasks.find(t => t.agentId === agentId && t.status === "pending");
    if (pending) return pending;
    const blocked = agentTasks.find(t => t.agentId === agentId && t.status === "blocked");
    if (blocked) return blocked;
    const completed = agentTasks.filter(t => t.agentId === agentId && t.status === "completed")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    return completed;
  };

  const triggerAgentsMutation = useMutation({
    mutationFn: async (count: number = 3) => {
      const res = await apiRequest("POST", `/api/agents/scheduler/trigger?count=${count}`, {});
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Agents Activated",
        description: `${data.triggered} tasks now executing. Outputs will appear in Drive.`
      });
      setTimeout(() => {
        refetchAgentTasks();
        refetchNetworkStats();
      }, 5000);
    },
    onError: (error: any) => {
      toast({
        title: "Execution Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getCompletedOutputs = () => {
    return agentTasks
      .filter(t => t.status === "completed" && t.outputUrl)
      .sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime())
      .slice(0, 6);
  };

  const testIntegrationMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/integrations/${id}/test`, {});
      return res.json();
    },
    onSuccess: () => {
      refetchIntegrations();
      toast({ title: "Connection Test Complete", description: "Integration status updated" });
    },
    onError: (error: any) => {
      toast({ title: "Test Failed", description: error.message, variant: "destructive" });
    }
  });

  const setupDriveFoldersMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/drive/setup-folders", {});
      return res.json();
    },
    onSuccess: (data) => {
      refetchDrive();
      toast({
        title: "Drive Folders Created",
        description: `Created ${data.created?.length || 0} folders successfully`
      });
    },
    onError: (error: any) => {
      toast({ title: "Setup Failed", description: error.message, variant: "destructive" });
    }
  });

  const { data: libraryFiles, refetch: refetchLibraryFiles } = useQuery<{ success: boolean; files: Array<{ id: string; name: string; mimeType: string; size?: string; createdTime?: string; webViewLink?: string }> }>({
    queryKey: ["/api/agent-library", libraryAgent],
    queryFn: async () => {
      if (!libraryAgent) return { success: true, files: [] };
      const res = await fetch(`/api/agent-library/${encodeURIComponent(libraryAgent)}`);
      return res.json();
    },
    enabled: !!libraryAgent,
  });

  const handleLibraryUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || !libraryAgent) return;
    const maxSize = 50 * 1024 * 1024;
    for (let i = 0; i < fileList.length; i++) {
      if (fileList[i].size > maxSize) {
        toast({ title: "File Too Large", description: `${fileList[i].name} exceeds the 50MB limit.`, variant: "destructive" });
        return;
      }
    }
    setLibraryUploading(true);
    setLibraryUploadProgress(0);
    try {
      const formData = new FormData();
      for (let i = 0; i < fileList.length; i++) {
        formData.append("files", fileList[i]);
      }
      const xhr = new XMLHttpRequest();
      await new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) setLibraryUploadProgress(Math.round((e.loaded / e.total) * 100));
        });
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText);
            if (data.errors && data.errors.length > 0) {
              toast({ title: "Some uploads failed", description: data.errors.join("; "), variant: "destructive" });
            }
            if (data.uploaded && data.uploaded.length > 0) {
              toast({ title: "Upload Complete", description: `${data.uploaded.length} file(s) uploaded to ${libraryAgent}'s library. Indexing in progress...` });
            }
            refetchLibraryFiles();
            resolve();
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        });
        xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
        xhr.open("POST", `/api/agent-library/upload/${encodeURIComponent(libraryAgent)}`);
        xhr.send(formData);
      });
    } catch (error: any) {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    } finally {
      setLibraryUploading(false);
      setLibraryUploadProgress(0);
    }
  };

  const deleteLibraryFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const res = await apiRequest("DELETE", `/api/agent-library/${encodeURIComponent(libraryAgent)}/file/${fileId}`, {});
      return res.json();
    },
    onSuccess: () => {
      refetchLibraryFiles();
      toast({ title: "File Deleted", description: "File removed from agent library." });
    },
    onError: (error: any) => {
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    }
  });

  const backfillLibraryMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/agent-library/${encodeURIComponent(libraryAgent)}/backfill`, {});
      return res.json();
    },
    onSuccess: (data: any) => {
      refetchLibraryFiles();
      toast({ title: "Backfill Complete", description: `Processed ${data.processed} file(s), skipped ${data.skipped}.${data.errors?.length ? ` Errors: ${data.errors.length}` : ''}` });
    },
    onError: (error: any) => {
      toast({ title: "Backfill Failed", description: error.message, variant: "destructive" });
    }
  });

  const [showAthenaChat, setShowAthenaChat] = useState(false);
  const [athenaMessages, setAthenaMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [athenaInput, setAthenaInput] = useState("");
  const [athenaLoading, setAthenaLoading] = useState(false);

  // Athena Trust Verification
  const [showAthenaTrustChallenge, setShowAthenaTrustChallenge] = useState(false);
  const [athenaTrustAnswer, setAthenaTrustAnswer] = useState("");
  const [athenaTrustError, setAthenaTrustError] = useState("");

  const { data: athenaConfig, refetch: refetchAthenaConfig } = useQuery<{
    agentId: string;
    isVerified: boolean;
    trustChallenge: string | null;
    autonomyLevel: number;
    requiresApprovalForImportant: boolean;
    needsInitialization?: boolean;
  }>({
    queryKey: ["/api/agent-configs/athena"],
    retry: false,
  });

  const initAthenaMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/agent-configs/athena/init", {});
      return res.json();
    },
    onSuccess: (data) => {
      refetchAthenaConfig();
      if (data.needsVerification === false) {
        // Already verified
        setShowAthenaChat(true);
      } else {
        setShowAthenaTrustChallenge(true);
      }
    }
  });

  const verifyAthenaTrustMutation = useMutation({
    mutationFn: async (answer: string) => {
      const res = await apiRequest("POST", "/api/agent-configs/athena/verify", { answer });
      if (res.status === 429) {
        const data = await res.json();
        throw new Error(data.error || "Too many attempts");
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data.verified) {
        toast({ title: "Trust Verified", description: "ATHENA is now active and ready to serve." });
        setShowAthenaTrustChallenge(false);
        setAthenaTrustAnswer("");
        setAthenaTrustError("");
        refetchAthenaConfig();
        setShowAthenaChat(true);
      } else {
        setAthenaTrustError(data.message || "Incorrect answer. Please try again.");
      }
    },
    onError: (error: any) => {
      setAthenaTrustError(error.message || "Verification failed");
    }
  });

  const handleOpenAthenaChat = () => {
    if (athenaConfig?.isVerified) {
      setShowAthenaChat(true);
    } else if (athenaConfig?.needsInitialization) {
      initAthenaMutation.mutate();
    } else if (!athenaConfig?.isVerified) {
      setShowAthenaTrustChallenge(true);
      // Initialize if needed
      if (!athenaConfig?.trustChallenge) {
        initAthenaMutation.mutate();
      }
    }
  };

  const handleVerifyAthenaTrust = () => {
    if (!athenaTrustAnswer.trim()) {
      setAthenaTrustError("Please enter your answer");
      return;
    }
    verifyAthenaTrustMutation.mutate(athenaTrustAnswer);
  };

  const openAgentChat = (agent: typeof agents[0]) => {
    // Dispatch an event to open the persistent global agent chat
    window.dispatchEvent(new CustomEvent("open-agent-chat", { detail: { agent } }));
  };

  const handleCopyAthenaChat = () => {
    if (athenaMessages.length === 0) return;
    const text = athenaMessages.map(m => `${m.role === 'user' ? 'You' : 'ATHENA'}: ${m.content}`).join('\n\n');
    navigator.clipboard.writeText(text);
    toast({ title: "Chat copied to clipboard" });
  };

  const handlePrintAthenaChat = () => {
    if (athenaMessages.length === 0) return;
    const text = athenaMessages.map(m => `<b>${m.role === 'user' ? 'You' : 'ATHENA'}:</b><br/>${m.content.replace(/\n/g, '<br/>')}`).join('<br/><br/>');

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Chat with ATHENA</title>
            <style>
              body { font-family: sans-serif; padding: 20px; line-height: 1.5; }
            </style>
          </head>
          <body>
            <h2>Chat Transcription: ATHENA</h2>
            <hr/>
            ${text}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const handleShareAthenaChat = async () => {
    if (athenaMessages.length === 0) return;
    const text = athenaMessages.map(m => `${m.role === 'user' ? 'You' : 'ATHENA'}: ${m.content}`).join('\n\n');

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Chat with ATHENA',
          text: text,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(text);
      toast({ title: "Chat copied to clipboard (Sharing not supported)" });
    }
  };

  const sendAthenaMessage = async () => {
    if (!athenaInput.trim() || athenaLoading) return;

    const userMessage = athenaInput.trim();
    setAthenaInput("");
    const currentHistory = [...athenaMessages];
    setAthenaMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setAthenaLoading(true);

    try {
      const res = await apiRequest("POST", "/api/athena/chat", {
        message: userMessage,
        history: currentHistory
      });
      const data = await res.json();
      setAthenaMessages(prev => [...prev, { role: "assistant", content: data.response }]);
    } catch (error: any) {
      toast({ title: "ATHENA Error", description: error.message, variant: "destructive" });
      setAthenaMessages(prev => [...prev, { role: "assistant", content: "I apologize, Trustee. I'm experiencing a temporary issue. Please try again." }]);
    } finally {
      setAthenaLoading(false);
    }
  };

  const [selectedLegalDoc, setSelectedLegalDoc] = useState<string | null>(null);
  const [pendingDocAction, setPendingDocAction] = useState<{ docId: string; action: "approve" | "upload" } | null>(null);

  const approveLegalDocMutation = useMutation({
    mutationFn: async (docId: string) => {
      setPendingDocAction({ docId, action: "approve" });
      const res = await apiRequest("PATCH", `/api/legal/documents/${docId}`, {
        status: "approved",
        approvedDate: new Date().toISOString(),
        reviewedBy: "Trustee"
      });
      return res.json();
    },
    onSuccess: () => {
      setPendingDocAction(null);
      refetchLegalDocs();
      toast({ title: "Document Approved", description: "The document has been approved by the Trustee" });
    },
    onError: (error: any) => {
      setPendingDocAction(null);
      toast({ title: "Error", description: error.message || "Failed to approve document", variant: "destructive" });
    }
  });

  const uploadToDriveMutation = useMutation({
    mutationFn: async (docId: string) => {
      setPendingDocAction({ docId, action: "upload" });
      const res = await apiRequest("POST", `/api/legal/documents/${docId}/upload-to-drive`, {});
      return res.json();
    },
    onSuccess: (data) => {
      setPendingDocAction(null);
      refetchLegalDocs();
      toast({
        title: "Uploaded to Drive",
        description: data.driveUrl ? "Document saved to Legal Documents folder" : "Document uploaded successfully"
      });
    },
    onError: (error: any) => {
      setPendingDocAction(null);
      toast({ title: "Upload Failed", description: error.message || "Failed to upload to Drive", variant: "destructive" });
    }
  });

  const emails: EmailSummary[] = (inboxData?.messages || []).map(msg => {
    const { priority, category } = categorizeEmail(msg.from, msg.subject);
    return {
      id: msg.id,
      from: msg.from,
      subject: msg.subject,
      snippet: msg.snippet,
      date: formatTimeAgo(msg.date),
      priority,
      category,
      isRead: !msg.isUnread,
    };
  });

  const gmailConnected = inboxData?.connected && !inboxError;
  const safeIntegrationStatuses = Array.isArray(integrationStatuses) ? integrationStatuses : [];
  const wooCommerceStatus = safeIntegrationStatuses.find(i => i.id === "woocommerce");

  const integrations: IntegrationStatus[] = [
    { name: "SignNow", status: signNowStatus?.connected ? "connected" : "disconnected", icon: FileText, lastSync: "Just now" },
    { name: "Google Drive", status: driveStatus?.connected ? "connected" : "disconnected", icon: Folder, lastSync: driveStatus?.email },
    { name: "Gmail", status: gmailConnected ? "connected" : inboxError ? "error" : "disconnected", icon: Mail, lastSync: gmailConnected ? "Real-time" : inboxError ? "Connection error" : "Not connected" },
    { name: "WooCommerce", status: wooCommerceStatus?.connectionState === "connected" ? "connected" : "disconnected", icon: ShoppingCart, lastSync: wooCommerceStatus?.connectionState === "connected" ? "Live sync" : "Not connected" },
  ];

  const agents = sentinelAgents?.agents?.length ? sentinelAgents.agents.map((a: any) => ({
    id: a.agentId,
    name: a.name,
    title: a.title || "Agent",
    division: a.division,
    specialty: Array.isArray(a.specialty) ? a.specialty.join(", ") : (a.specialty || "General Operations"),
    catchphrase: a.catchphrase,
    voice: "Professional and helpful"
  })) : staticAgents;

  const activeAgentIds = new Set(agentTasks.filter(t => t.status === "in_progress").map(t => t.agentId.toUpperCase()));
  const pendingAgentIds = new Set(agentTasks.filter(t => t.status === "pending").map(t => t.agentId.toUpperCase()));
  const agentStats = {
    total: agents.length,
    active: activeAgentIds.size,
    tasked: pendingAgentIds.size,
    standby: agents.length - activeAgentIds.size - pendingAgentIds.size,
  };

  const executiveAgents = agents.filter(a => a.division === "executive");
  const scienceAgents = agents.filter(a => a.division === "science");
  const engineeringAgents = agents.filter(a => a.division === "engineering");
  const legalAgents = agents.filter(a => a.division === "legal");
  const marketingAgents = agents.filter(a => a.division === "marketing");
  const supportAgents = agents.filter(a => a.division === "support");

  const getAgentIcon = (agentId: string) => {
    const iconMap: Record<string, React.ElementType> = {
      "sentinel": CircuitBoard,
      "athena": Crown,
      "fx-agent": Radio,
      "vx-agent": Film,
      "design-agent": Palette,
      "accounting-agent": Calculator,
      "legal-lead": Scale,
      "lead-engineer": Wrench,
      "PROMETHEUS": Dna,
    };
    return iconMap[agentId] || Bot;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <header
          className="relative border-b border-white/10 bg-black/40 backdrop-blur-sm"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.65), rgba(0,0,0,0.45)), url('/assets/allio_hero_banner_landscape.png')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="container mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Crown className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Trustee Command Center</h1>
                  <p className="text-sm text-amber-300/70">Allio Ecosystem • Full Access</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30">
                  <Clock className="w-4 h-4 text-red-400" />
                  <div className="text-sm">
                    <span className="text-white/70">Rollout:</span>
                    <span className="ml-1 font-bold text-red-400">
                      {deadline ? `${deadline.daysRemaining}d ${deadline.hoursRemaining}h` : "Loading..."}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-green-500/20 border-green-500/40 text-green-300 hover:bg-green-500/30"
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending}
                  data-testid="button-sync-wp"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? "animate-spin" : ""}`} />
                  {syncMutation.isPending ? "Syncing..." : "Sync WP"}
                </Button>
                <LanguageSwitcher />
                <Select value={viewAs} onValueChange={handleViewChange}>
                  <SelectTrigger className="w-[160px] bg-white/10 border-white/20 text-white" data-testid="select-view-as">
                    <Eye className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="View as..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trustee">Trustee View</SelectItem>
                    <SelectItem value="member">Member View</SelectItem>
                    <SelectItem value="admin">Admin View</SelectItem>
                    <SelectItem value="doctor">Doctor View</SelectItem>
                  </SelectContent>
                </Select>
                <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 px-3 py-1">
                  <Shield className="w-3 h-3 mr-1" />
                  PMA Protected
                </Badge>
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 px-3 py-1">
                  <Zap className="w-3 h-3 mr-1" />
                  {agentStats.active} Agents Active
                </Badge>
                <Link href="/">
                  <Button variant="ghost" className="text-white/70 hover:text-white" data-testid="button-home">
                    <Home className="w-4 h-4 mr-2" />
                    Portal
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20" data-testid="card-stat-agents">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-white/60 flex items-center gap-2">
                      AI Agents
                      {agentTasks.length > 0 && (
                        <Badge className="bg-green-500/20 text-green-300 text-[10px] px-1 py-0">LIVE</Badge>
                      )}
                    </div>
                    <p className="text-3xl font-bold text-amber-400">{agentStats.total}</p>
                    <p className="text-xs text-white/50 mt-1">
                      {agentStats.active > 0 ? `${agentStats.active} working` : "standby"} • {agentTasks.length} tasks
                    </p>
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Brain className="w-7 h-7 text-amber-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20" data-testid="card-stat-members">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-white/60 flex items-center gap-2">
                      Total Members
                      {adminStats?.dataSource?.wordpress && (
                        <Badge className="bg-green-500/20 text-green-300 text-[10px] px-1 py-0">LIVE</Badge>
                      )}
                      {adminStats?.dataSource?.local && !adminStats?.dataSource?.wordpress && (
                        <Badge className="bg-yellow-500/20 text-yellow-300 text-[10px] px-1 py-0">LOCAL</Badge>
                      )}
                    </div>
                    <p className="text-3xl font-bold text-cyan-400">{adminStats?.totalMembers || 0}</p>
                    <p className="text-xs text-white/50 mt-1">
                      {adminStats?.dataSource?.wordpress ? "from WordPress" : "synced locally"}
                    </p>
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                    <Users className="w-7 h-7 text-cyan-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/20" data-testid="card-stat-doctors">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-white/60 flex items-center gap-2">
                      Network Doctors
                      <Badge className="bg-green-500/20 text-green-300 text-[10px] px-1 py-0">LIVE</Badge>
                    </div>
                    <p className="text-3xl font-bold text-violet-400">{adminStats?.totalDoctors || 0}</p>
                    <p className="text-xs text-white/50 mt-1">{adminStats?.totalClinics || 0} clinics (real data)</p>
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-violet-500/20 flex items-center justify-center">
                    <Stethoscope className="w-7 h-7 text-violet-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20" data-testid="card-stat-integrations">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-white/60 flex items-center gap-2">
                      Integrations
                      <Badge className="bg-green-500/20 text-green-300 text-[10px] px-1 py-0">LIVE</Badge>
                    </div>
                    <p className="text-3xl font-bold text-cyan-400">{safeIntegrationStatuses.filter(i => i.connectionState === "connected").length}/{safeIntegrationStatuses.length}</p>
                    <p className="text-xs text-white/50 mt-1">
                      {safeIntegrationStatuses.filter(i => i.mode === "live" && i.connectionState === "connected").length} live systems
                    </p>
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                    <Network className="w-7 h-7 text-cyan-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border-teal-500/20 mb-8" data-testid="card-pma-network-summary">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
                    <Gavel className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white" data-testid="text-pma-network-title">PMA Network</h3>
                    <p className="text-xs text-white/50">Mother-Child PMA Structure</p>
                  </div>
                </div>
                <Link href="/pma-network">
                  <Button variant="outline" size="sm" className="border-teal-500/30 text-teal-300 hover:bg-teal-500/10" data-testid="link-pma-network">
                    <Building2 className="w-4 h-4 mr-2" />
                    View Network
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-white/5 text-center" data-testid="stat-pma-total">
                  <p className="text-2xl font-bold text-teal-400">
                    {allClinics.filter((c: any) => c.pmaType === "child").length}
                  </p>
                  <p className="text-xs text-white/50">Child PMAs</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5 text-center" data-testid="stat-pma-active">
                  <p className="text-2xl font-bold text-emerald-400">
                    {allClinics.filter((c: any) => c.pmaStatus === "active" && c.pmaType === "child").length}
                  </p>
                  <p className="text-xs text-white/50">Active</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5 text-center" data-testid="stat-pma-pending">
                  <p className="text-2xl font-bold text-amber-400">
                    {allClinics.filter((c: any) => c.pmaStatus === "pending" && c.pmaType === "child").length}
                  </p>
                  <p className="text-xs text-white/50">Pending</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5" data-testid="stat-pma-contact-breakdown">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-emerald-400">Confirmed</span>
                    <span className="text-white/70 font-medium">{allClinics.filter((c: any) => c.contactStatus === "confirmed").length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-amber-400">Waiting</span>
                    <span className="text-white/70 font-medium">{allClinics.filter((c: any) => c.contactStatus === "waiting").length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-red-400">No Contract</span>
                    <span className="text-white/70 font-medium">{allClinics.filter((c: any) => c.contactStatus === "no_contract").length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Pending</span>
                    <span className="text-white/70 font-medium">{allClinics.filter((c: any) => c.contactStatus === "pending").length}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <ScrollArea className="w-full">
              <TabsList className="bg-transparent border-b border-white/5 rounded-none p-0 w-full justify-start h-auto flex flex-nowrap" data-testid="tabslist-main-nav">
                <TabsTrigger
                  value="command-center"
                  className="px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-400 data-[state=active]:bg-cyan-950/20 data-[state=active]:text-white text-white/60 hover:text-white/80 transition-all whitespace-nowrap"
                  data-testid="tab-command-center"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Command Center
                </TabsTrigger>
                <TabsTrigger
                  value="wordpress"
                  className="px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-400 data-[state=active]:bg-blue-950/20 data-[state=active]:text-white text-white/60 hover:text-white/80 transition-all whitespace-nowrap"
                  data-testid="tab-wordpress"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  WordPress CMS
                </TabsTrigger>
                <TabsTrigger value="athena-inbox" className="px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-violet-400 data-[state=active]:bg-violet-950/20 data-[state=active]:text-white text-white/60 hover:text-white/80 transition-all whitespace-nowrap" data-testid="tab-athena-inbox">
                  <Inbox className="w-4 h-4 mr-2" />
                  ATHENA Inbox
                </TabsTrigger>
                <TabsTrigger value="agent-network" className="px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-400 data-[state=active]:bg-cyan-950/20 data-[state=active]:text-white text-white/60 hover:text-white/80 transition-all whitespace-nowrap" data-testid="tab-agent-network">
                  <Brain className="w-4 h-4 mr-2" />
                  Agent Network
                </TabsTrigger>
                <TabsTrigger value="security" className="px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-red-400 data-[state=active]:bg-red-950/20 data-[state=active]:text-white text-white/60 hover:text-white/80 transition-all whitespace-nowrap" data-testid="tab-security">
                  <Shield className="w-4 h-4 mr-2" />
                  Security
                </TabsTrigger>
                <TabsTrigger value="integrations" className="px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-400 data-[state=active]:bg-cyan-950/20 data-[state=active]:text-white text-white/60 hover:text-white/80 transition-all whitespace-nowrap" data-testid="tab-integrations">
                  <Database className="w-4 h-4 mr-2" />
                  Integrations
                </TabsTrigger>
                <TabsTrigger value="agent-outputs" className="px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-pink-400 data-[state=active]:bg-pink-950/20 data-[state=active]:text-white text-white/60 hover:text-white/80 transition-all whitespace-nowrap" data-testid="tab-agent-outputs">
                  <Folder className="w-4 h-4 mr-2" />
                  Agent Outputs
                </TabsTrigger>
                <TabsTrigger value="legal" className="px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-400 data-[state=active]:bg-indigo-950/20 data-[state=active]:text-white text-white/60 hover:text-white/80 transition-all whitespace-nowrap" data-testid="tab-legal">
                  <Scale className="w-4 h-4 mr-2" />
                  Legal
                </TabsTrigger>
                <TabsTrigger value="sentinel-alerts" className="px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-green-400 data-[state=active]:bg-green-950/20 data-[state=active]:text-white text-white/60 hover:text-white/80 transition-all whitespace-nowrap" data-testid="tab-sentinel-alerts">
                  <Bell className="w-4 h-4 mr-2" />
                  Sentinel Alerts
                </TabsTrigger>
                <TabsTrigger value="patient-management" className="px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-400 data-[state=active]:bg-emerald-950/20 data-[state=active]:text-white text-white/60 hover:text-white/80 transition-all whitespace-nowrap" data-testid="tab-patient-management">
                  <Stethoscope className="w-4 h-4 mr-2" />
                  Patient Tools
                </TabsTrigger>
                <TabsTrigger value="pma-contracts" className="px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-teal-400 data-[state=active]:bg-teal-950/20 data-[state=active]:text-white text-white/60 hover:text-white/80 transition-all whitespace-nowrap" data-testid="tab-pma-contracts">
                  <Gavel className="w-4 h-4 mr-2" />
                  PMA & Contracts
                </TabsTrigger>
                <TabsTrigger value="launch-readiness" className="px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-400 data-[state=active]:bg-amber-950/20 data-[state=active]:text-white text-white/60 hover:text-white/80 transition-all whitespace-nowrap" data-testid="tab-launch-readiness">
                  <Rocket className="w-4 h-4 mr-2" />
                  Launch Readiness
                </TabsTrigger>
                <TabsTrigger value="protocol-queue" className="px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-400 data-[state=active]:bg-emerald-950/20 data-[state=active]:text-white text-white/60 hover:text-white/80 transition-all whitespace-nowrap" data-testid="tab-protocol-queue">
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Protocol Queue
                </TabsTrigger>
              </TabsList>
            </ScrollArea>

            <TabsContent value="command-center" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <Card className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-500/20">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-amber-100">
                          <Crown className="w-5 h-5 text-amber-400" />
                          SENTINEL Status Report
                        </CardTitle>
                        <Badge className="bg-cyan-500/20 text-cyan-300">Online</Badge>
                      </div>
                      <CardDescription>Your Executive Agent of Operations</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {!networkStats ? (
                        <div className="flex flex-col items-center justify-center py-8">
                          <Loader2 className="w-8 h-8 animate-spin text-amber-400 mb-3" />
                          <p className="text-sm text-white/50">Loading network status...</p>
                        </div>
                      ) : (() => {
                        const priorityItems = emails.filter(e => e.priority === "urgent" || e.priority === "high").length;
                        const pendingLegalDocs = legalDocuments.filter(d => d.status === "draft" || d.status === "review").length;
                        const taskCompletion = networkStats.metrics.completionRate;
                        const daysLeft = networkStats.metrics.daysRemaining;
                        const tasksCompleted = networkStats.taskStats.completed;
                        const totalTasks = networkStats.taskStats.total;
                        const outputsProduced = networkStats.metrics.outputsProduced;
                        const estCost = networkStats.costProjections.total.estimated;

                        return (
                          <>
                            <div className="p-4 rounded-lg bg-black/20 border border-white/5">
                              <p className="text-sm text-white/80 leading-relaxed">
                                Good day, Trustee. All systems are operational.
                                <span className="text-amber-400 font-medium"> {daysLeft} days</span> until April 1, 2026 launch.
                                <span className="text-green-400 font-medium"> {tasksCompleted}/{totalTasks}</span> tasks completed ({taskCompletion}%).
                                {priorityItems > 0 && <> ATHENA reports <span className="text-violet-400 font-medium">{priorityItems} priority {priorityItems === 1 ? "item" : "items"}</span> requiring your attention.</>}
                                {pendingLegalDocs > 0 && <> <span className="text-indigo-400 font-medium">{pendingLegalDocs} legal documents</span> awaiting review.</>}
                              </p>
                            </div>

                            <div className="grid grid-cols-4 gap-4">
                              <div className="p-3 rounded-lg bg-white/5 text-center" data-testid="stat-tasks-completed">
                                <p className="text-2xl font-bold text-green-400">{tasksCompleted}/{totalTasks}</p>
                                <p className="text-xs text-white/50">Tasks Complete</p>
                              </div>
                              <div className="p-3 rounded-lg bg-white/5 text-center" data-testid="stat-completion-rate">
                                <p className="text-2xl font-bold text-amber-400">{taskCompletion}%</p>
                                <p className="text-xs text-white/50">Completion Rate</p>
                              </div>
                              <div className="p-3 rounded-lg bg-white/5 text-center" data-testid="stat-outputs">
                                <p className="text-2xl font-bold text-cyan-400">{outputsProduced}</p>
                                <p className="text-xs text-white/50">Outputs Produced</p>
                              </div>
                              <div className="p-3 rounded-lg bg-white/5 text-center" data-testid="stat-cost">
                                <p className="text-2xl font-bold text-violet-400">~${estCost.toFixed(2)}</p>
                                <p className="text-xs text-white/50">Est. Cost</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-white/60">Task Completion</span>
                                  <span className="text-green-400 font-medium">{taskCompletion}%</span>
                                </div>
                                <Progress value={taskCompletion} className="h-2 bg-white/10" />
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-white/60">Days to Launch</span>
                                  <span className="text-amber-400 font-medium">{daysLeft}</span>
                                </div>
                                <Progress value={Math.max(0, 100 - (daysLeft / 60 * 100))} className="h-2 bg-white/10" />
                              </div>
                            </div>

                            <div className="text-xs text-white/30 text-right">
                              Last updated: {networkStats?.lastUpdated ? new Date(networkStats.lastUpdated).toLocaleTimeString() : "..."}
                            </div>
                          </>
                        );
                      })()}
                    </CardContent>
                  </Card>

                  <Card className="bg-black/20 border-white/10">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-white">
                          <AlertTriangle className="w-5 h-5 text-amber-400" />
                          Priority Actions
                        </CardTitle>
                        <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                          {getPriorityTasks().length} pending
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {getPriorityTasks().length === 0 ? (
                        <div className="p-4 text-center text-white/50">
                          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-400" />
                          <p className="text-sm">All caught up! No priority actions needed.</p>
                        </div>
                      ) : (
                        getPriorityTasks().map((task, i) => (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`p-4 rounded-lg hover:bg-white/10 transition-colors cursor-pointer border ${selectedPriorityItem === task.id
                              ? "bg-amber-500/20 border-amber-500/40"
                              : "bg-white/5 border-white/5"
                              }`}
                            onClick={() => setSelectedPriorityItem(task.id)}
                            data-testid={`card-priority-${task.id}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${task.status === "blocked" ? "bg-red-500/20" :
                                task.priority === 1 ? "bg-orange-500/20" : "bg-blue-500/20"
                                }`}>
                                {task.status === "blocked" ? (
                                  <AlertCircle className="w-5 h-5 text-red-400" />
                                ) : (
                                  <Target className="w-5 h-5 text-orange-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-sm truncate">{task.title}</p>
                                  <Badge
                                    className={task.status === "blocked" ? "bg-red-500/20 text-red-300" : "bg-amber-500/20 text-amber-300"}
                                    variant="outline"
                                  >
                                    {task.status}
                                  </Badge>
                                </div>
                                <p className="text-xs text-white/50 truncate">{task.description}</p>
                                <p className="text-xs text-white/30 mt-1">
                                  {task.agentId.toUpperCase()} • {task.division}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-white">
                          <Activity className="w-5 h-5 text-cyan-400" />
                          Live Agent Activity
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <Badge className="bg-green-500/20 text-green-300 text-[10px]">LIVE</Badge>
                        </div>
                      </div>
                      <CardDescription>Agents working right now (real-time)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                      {agentTasks.filter(t => t.status === "in_progress").length === 0 ? (
                        <div className="p-4 text-center text-white/50">
                          <Clock className="w-8 h-8 mx-auto mb-2 text-white/30" />
                          <p className="text-sm">All agents idle. Click "Run Tasks" to start.</p>
                        </div>
                      ) : (
                        agentTasks
                          .filter(t => t.status === "in_progress")
                          .sort((a, b) => (b.progress || 0) - (a.progress || 0))
                          .slice(0, 8)
                          .map((task) => (
                            <div
                              key={task.id}
                              className="p-3 rounded-lg bg-white/5 border border-white/5"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className={`w-8 h-8 rounded flex items-center justify-center ${task.division === "marketing" ? "bg-pink-500/20" :
                                    task.division === "science" ? "bg-blue-500/20" :
                                      task.division === "engineering" ? "bg-orange-500/20" :
                                        task.division === "legal" ? "bg-indigo-500/20" :
                                          task.division === "financial" ? "bg-green-500/20" :
                                            task.division === "support" ? "bg-cyan-500/20" :
                                              "bg-amber-500/20"
                                    }`}>
                                    <span className="text-xs font-bold">{task.agentId.slice(0, 2).toUpperCase()}</span>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate">{task.title}</p>
                                    <p className="text-xs text-white/40">{task.agentId.toUpperCase()}</p>
                                  </div>
                                </div>
                                <Badge className="bg-cyan-500/20 text-cyan-300 text-xs">
                                  {task.progress || 0}%
                                </Badge>
                              </div>
                              <Progress value={task.progress || 0} className="h-1 bg-white/10" />
                            </div>
                          ))
                      )}
                      <p className="text-xs text-white/30 text-center pt-2">
                        {agentTasks.filter(t => t.status === "in_progress").length} agents working • Updates every 5s
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <CardTitle className="flex items-center gap-2 text-white shrink-0">
                          <FileText className="w-5 h-5 text-green-400" />
                          Agent Outputs & Resources
                        </CardTitle>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border-purple-500/30"
                            onClick={() => window.open('https://drive.google.com/drive/folders/1G1oo3_6GhnLZL9dCRS3ghQXep3Zn1Ez6?usp=sharing', '_blank')}
                          >
                            <Folder className="w-3 h-3 mr-1" />
                            System Library
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border-indigo-500/30"
                            onClick={() => window.open('https://drive.google.com/drive/folders/1vUOmOHvweQkOXN46Hxbbx1OM8PKk24TB?usp=drive_link', '_blank')}
                          >
                            <BookOpen className="w-3 h-3 mr-1" />
                            Chiro Manuals
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 text-black shrink-0"
                            onClick={() => triggerAgentsMutation.mutate(3)}
                            disabled={triggerAgentsMutation.isPending}
                            data-testid="button-trigger-agents"
                          >
                            {triggerAgentsMutation.isPending ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Running...
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3 mr-1" />
                                Run Tasks
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      <CardDescription>Real outputs and system resources</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {getCompletedOutputs().length === 0 ? (
                        <div className="p-4 text-center text-white/50">
                          <FileText className="w-8 h-8 mx-auto mb-2 text-white/30" />
                          <p className="text-sm">No outputs yet. Click "Run Tasks" to start.</p>
                        </div>
                      ) : (
                        getCompletedOutputs().map((task) => (
                          <motion.a
                            key={task.id}
                            href={task.outputUrl || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5 group"
                            data-testid={`output-${task.id}`}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-8 h-8 rounded bg-green-500/20 flex items-center justify-center">
                                <FileText className="w-4 h-4 text-green-400" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{task.title}</p>
                                <p className="text-xs text-white/40">{task.agentId.toUpperCase()} • {task.division}</p>
                              </div>
                            </div>
                            <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-green-400 transition-colors flex-shrink-0" />
                          </motion.a>
                        ))
                      )}
                      {getCompletedOutputs().length > 0 && (
                        <p className="text-xs text-white/30 text-center pt-2">
                          {agentTasks.filter(t => t.status === "completed" && t.outputUrl).length} total outputs in Drive
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-white">
                            <BookOpen className="w-5 h-5 text-indigo-400" />
                            Agent Knowledge Library
                          </CardTitle>
                          <CardDescription>Upload books, research papers, and literature for individual agents</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Select value={libraryAgent} onValueChange={setLibraryAgent}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Select an agent..." />
                        </SelectTrigger>
                        <SelectContent>
                          {(agents || []).map((a: any) => (
                            <SelectItem key={a.id} value={a.name}>{a.name} — {a.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {libraryAgent && (
                        <>
                          <div
                            className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                              libraryDragOver
                                ? "border-indigo-400 bg-indigo-500/20"
                                : "border-white/20 hover:border-white/40 bg-white/5"
                            }`}
                            onDragOver={(e) => { e.preventDefault(); setLibraryDragOver(true); }}
                            onDragLeave={() => setLibraryDragOver(false)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setLibraryDragOver(false);
                              handleLibraryUpload(e.dataTransfer.files);
                            }}
                            onClick={() => {
                              const input = document.createElement("input");
                              input.type = "file";
                              input.multiple = true;
                              input.accept = ".pdf,.docx,.epub,.txt,.jpg,.jpeg,.png,.gif,.webp,.svg";
                              input.onchange = () => handleLibraryUpload(input.files);
                              input.click();
                            }}
                          >
                            {libraryUploading ? (
                              <div className="space-y-2">
                                <Loader2 className="w-8 h-8 mx-auto text-indigo-400 animate-spin" />
                                <p className="text-sm text-white/70">Uploading... {libraryUploadProgress}%</p>
                                <Progress value={libraryUploadProgress} className="h-2 max-w-xs mx-auto" />
                              </div>
                            ) : (
                              <>
                                <Upload className="w-8 h-8 mx-auto mb-2 text-white/30" />
                                <p className="text-sm text-white/60">Drag & drop files here, or click to browse</p>
                                <p className="text-xs text-white/30 mt-1">PDF, DOCX, EPUB, TXT, Images — Max 50MB per file (no legacy .doc)</p>
                              </>
                            )}
                          </div>

                          {libraryFiles?.files && libraryFiles.files.length > 0 ? (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {libraryFiles.files.map((file: any) => (
                                <div
                                  key={file.id}
                                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5 group"
                                >
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="w-8 h-8 rounded bg-indigo-500/20 flex items-center justify-center shrink-0">
                                      {file.mimeType.includes("image") ? (
                                        <Image className="w-4 h-4 text-indigo-400" />
                                      ) : (
                                        <FileText className="w-4 h-4 text-indigo-400" />
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium truncate text-white/90">{file.name}</p>
                                      <p className="text-xs text-white/40 flex items-center gap-1">
                                        {file.size ? `${(parseInt(file.size) / 1024).toFixed(1)} KB` : ""}
                                        {file.createdTime ? ` • ${new Date(file.createdTime).toLocaleDateString()}` : ""}
                                        {file.indexingStatus === 'indexed' && (
                                          <span className="inline-flex items-center gap-0.5 text-emerald-400" title={`${file.totalChunks} chunks indexed`}>
                                            <CheckCircle2 className="w-3 h-3" /> Indexed ({file.totalChunks} chunks)
                                          </span>
                                        )}
                                        {file.indexingStatus === 'processing' && (
                                          <span className="inline-flex items-center gap-0.5 text-amber-400">
                                            <Loader2 className="w-3 h-3 animate-spin" /> Indexing...
                                          </span>
                                        )}
                                        {file.indexingStatus === 'failed' && (
                                          <span className="inline-flex items-center gap-0.5 text-red-400" title={file.indexingError || 'Indexing failed'}>
                                            <XCircle className="w-3 h-3" /> Failed
                                          </span>
                                        )}
                                        {file.indexingStatus === 'pending' && !file.mimeType.includes("image") && (
                                          <span className="inline-flex items-center gap-0.5 text-white/30">
                                            <Clock className="w-3 h-3" /> Not indexed
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    {file.webViewLink && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 p-0 text-white/30 hover:text-indigo-400"
                                        onClick={() => window.open(file.webViewLink, "_blank")}
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0 text-white/30 hover:text-red-400"
                                      onClick={() => deleteLibraryFileMutation.mutate(file.id)}
                                      disabled={deleteLibraryFileMutation.isPending}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              <div className="flex items-center justify-between pt-1">
                                <p className="text-xs text-white/30">
                                  {libraryFiles.files.length} file(s) in {libraryAgent}'s library
                                </p>
                                {libraryFiles.files.some((f: any) => f.indexingStatus === 'pending' && !f.mimeType.includes('image')) && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 text-xs px-2 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20"
                                    onClick={() => backfillLibraryMutation.mutate()}
                                    disabled={backfillLibraryMutation.isPending}
                                  >
                                    {backfillLibraryMutation.isPending ? (
                                      <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Indexing...</>
                                    ) : (
                                      "Index All Files"
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 text-center text-white/50">
                              <BookOpen className="w-8 h-8 mx-auto mb-2 text-white/20" />
                              <p className="text-sm">No files yet. Upload knowledge for {libraryAgent}.</p>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-black/20 border-white/10">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-white">
                        <MessageSquare className="w-5 h-5 text-cyan-400" />
                        Quick Response
                      </CardTitle>
                      <CardDescription>
                        {selectedPriorityItem
                          ? `Responding to: ${getPriorityTasks().find(t => t.id === selectedPriorityItem)?.title || "Selected task"}`
                          : "Select a priority item above or create a new task"
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Textarea
                        placeholder={selectedPriorityItem
                          ? "Type your response to complete this task..."
                          : "Describe a new task to delegate to an agent..."
                        }
                        value={taskResponse}
                        onChange={(e) => setTaskResponse(e.target.value)}
                        className="bg-white/5 border-white/10 min-h-[100px] text-white placeholder:text-white/40"
                        data-testid="textarea-task-response"
                      />

                      {!selectedPriorityItem && (
                        <Select value={delegateAgent} onValueChange={setDelegateAgent}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue placeholder="Select agent to delegate to..." />
                          </SelectTrigger>
                          <SelectContent>
                            {agents.map(agent => (
                              <SelectItem key={agent.id} value={agent.id}>
                                {agent.name} - {agent.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      <div className="flex items-center gap-3">
                        {selectedPriorityItem ? (
                          <>
                            <Button
                              className="bg-amber-500 hover:bg-amber-600 text-black"
                              disabled={!taskResponse.trim() || respondToTaskMutation.isPending}
                              onClick={() => respondToTaskMutation.mutate({ taskId: selectedPriorityItem, response: taskResponse })}
                              data-testid="button-send-response"
                            >
                              <Send className="w-4 h-4 mr-2" />
                              {respondToTaskMutation.isPending ? "Sending..." : "Complete Task"}
                            </Button>
                            <Button
                              variant="outline"
                              className="border-white/10"
                              onClick={() => {
                                setSelectedPriorityItem(null);
                                setTaskResponse("");
                              }}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button
                            className="bg-violet-500 hover:bg-violet-600 text-white"
                            disabled={!taskResponse.trim() || !delegateAgent || delegateTaskMutation.isPending}
                            onClick={() => delegateTaskMutation.mutate({
                              agentId: delegateAgent,
                              title: taskResponse.slice(0, 60),
                              description: taskResponse,
                              priority: 2
                            })}
                            data-testid="button-delegate"
                          >
                            <Users className="w-4 h-4 mr-2" />
                            {delegateTaskMutation.isPending ? "Delegating..." : "Delegate to Agent"}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-white">
                        <Crown className="w-5 h-5 text-amber-400" />
                        ATHENA
                      </CardTitle>
                      <CardDescription>Your Executive Intelligence Agent</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 rounded-lg bg-black/20 border border-white/5">
                        <p className="text-sm text-white/80 italic">
                          "Trustee, I've organized your inbox and calendar. Three items require your direct attention today.
                          Nancy has prepared the April timeline review. All family matters are secure."
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-white/5 text-center">
                          <Mail className="w-5 h-5 mx-auto mb-1 text-violet-400" />
                          <p className="text-lg font-bold">12</p>
                          <p className="text-xs text-white/50">Unread</p>
                        </div>
                        <div className="p-3 rounded-lg bg-white/5 text-center">
                          <Calendar className="w-5 h-5 mx-auto mb-1 text-cyan-400" />
                          <p className="text-lg font-bold">3</p>
                          <p className="text-xs text-white/50">Today</p>
                        </div>
                      </div>
                      <Button
                        className="w-full bg-violet-500/20 hover:bg-violet-500/30 text-violet-300"
                        data-testid="button-open-athena"
                        onClick={handleOpenAthenaChat}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        {athenaConfig?.isVerified ? "Open ATHENA Chat" : "Activate ATHENA"}
                      </Button>
                      {athenaConfig?.isVerified && (
                        <Badge className="mt-2 bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Trust Verified
                        </Badge>
                      )}
                    </CardContent>
                  </Card>

                  <div className="h-[400px]">
                    <CalendarWidget />
                  </div>

                  <Card className="bg-black/20 border-white/10">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-white">
                        <Database className="w-5 h-5 text-cyan-400" />
                        Integration Status
                        <Badge className="bg-green-500/20 text-green-300 text-[10px]">LIVE</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {safeIntegrationStatuses.map((integration) => {
                        const iconMap: Record<string, React.ElementType> = {
                          signnow: FileText,
                          gmail: Mail,
                          drive: Folder,
                          wordpress: Users,
                          woocommerce: ShoppingCart,
                        };
                        const IntIcon = iconMap[integration.id] || Settings;
                        const isConnected = integration.connectionState === "connected";
                        return (
                          <div
                            key={integration.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                            data-testid={`status-${integration.id}`}
                          >
                            <div className="flex items-center gap-3">
                              <IntIcon className="w-4 h-4 text-white/60" />
                              <span className="text-sm">{integration.name}</span>
                              {integration.mode === "live" && (
                                <span className="text-[10px] text-cyan-400">LIVE</span>
                              )}
                            </div>
                            <Badge className={
                              isConnected
                                ? "bg-cyan-500/20 text-cyan-300"
                                : integration.connectionState === "error"
                                  ? "bg-red-500/20 text-red-300"
                                  : "bg-gray-500/20 text-gray-300"
                            }>
                              {isConnected ? "connected" : integration.connectionState}
                            </Badge>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>

                  <Card className="bg-black/20 border-white/10">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-white">
                        <Activity className="w-5 h-5 text-cyan-400" />
                        Live Agent Activity
                        <Badge className="bg-green-500/20 text-green-300 text-[10px] animate-pulse">LIVE</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-48">
                        <div className="space-y-3">
                          {agentTasks.length === 0 ? (
                            <div className="text-center py-8 text-white/40">
                              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">No active tasks</p>
                            </div>
                          ) : (
                            agentTasks
                              .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
                              .slice(0, 10)
                              .map((task) => {
                                const agent = agents.find(a => a.id.toLowerCase() === task.agentId.toLowerCase());
                                const timeAgo = task.updatedAt ? formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true }) : 'recently';
                                return (
                                  <div key={task.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5">
                                    <div className={`w-2 h-2 rounded-full mt-2 ${task.status === "completed" ? "bg-cyan-400" :
                                      task.status === "in_progress" ? "bg-amber-400 animate-pulse" :
                                        task.status === "blocked" ? "bg-red-400" : "bg-blue-400"
                                      }`} />
                                    <div className="flex-1">
                                      <p className="text-sm">
                                        <span className="font-medium text-amber-400">{agent?.name || task.agentId}</span>
                                        <span className="text-white/60"> {task.status === "in_progress" ? "working on" : task.status} </span>
                                        <span className="text-white/80">{task.title}</span>
                                        {(task.progress ?? 0) > 0 && task.status !== "completed" && (
                                          <span className="text-cyan-400 ml-2">({task.progress}%)</span>
                                        )}
                                      </p>
                                      <p className="text-xs text-white/40">{timeAgo}</p>
                                    </div>
                                  </div>
                                );
                              })
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="athena-inbox" className="space-y-6">
              <Card className="bg-black/20 border-white/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <Inbox className="w-5 h-5 text-violet-400" />
                        ATHENA Priority Inbox
                      </CardTitle>
                      <CardDescription>Emails triaged and prioritized by ATHENA</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="border-white/10" data-testid="button-refresh-inbox">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                      </Button>
                      <Button variant="outline" size="sm" className="border-white/10" data-testid="button-filter-inbox">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {inboxError || !inboxData?.connected ? (
                    <div className="text-center py-12">
                      <Mail className="w-16 h-16 mx-auto mb-4 text-white/20" />
                      <h3 className="text-lg font-medium mb-2">Inbox Access Limited</h3>
                      <p className="text-white/50 mb-4">Gmail is in send-only mode. Inbox read permissions require expanded OAuth scopes.</p>
                      <Badge className="bg-amber-500/20 text-amber-300">Send-Only Mode</Badge>
                      <p className="text-xs text-white/40 mt-3">ATHENA can send emails but cannot read or triage incoming messages</p>
                    </div>
                  ) : emails.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-cyan-400/40" />
                      <h3 className="text-lg font-medium mb-2">Inbox Zero</h3>
                      <p className="text-white/50">No emails to display. All caught up!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {emails.map((email) => (
                        <motion.div
                          key={email.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={`p-4 rounded-lg border transition-colors cursor-pointer ${selectedEmail === email.id
                            ? "bg-violet-500/10 border-violet-500/30"
                            : email.isRead
                              ? "bg-white/5 border-white/5 hover:bg-white/10"
                              : "bg-white/10 border-white/10 hover:bg-white/15"
                            }`}
                          onClick={() => setSelectedEmail(email.id)}
                          data-testid={`email-${email.id}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${email.priority === "urgent" ? "bg-red-500/20" :
                              email.priority === "high" ? "bg-orange-500/20" : "bg-blue-500/20"
                              }`}>
                              {(() => {
                                const Icon = categoryIcons[email.category];
                                return <Icon className={`w-5 h-5 ${email.priority === "urgent" ? "text-red-400" :
                                  email.priority === "high" ? "text-orange-400" : "text-blue-400"
                                  }`} />;
                              })()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className={`font-medium ${email.isRead ? "text-white/70" : "text-white"}`}>{email.subject}</p>
                                <Badge className={priorityColors[email.priority]} variant="outline">
                                  {email.priority}
                                </Badge>
                              </div>
                              <p className="text-sm text-white/50 truncate">{email.snippet}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-white/40">{email.date}</p>
                              <p className="text-xs text-white/30">{email.from}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="text-white/40 hover:text-white" data-testid={`button-reply-${email.id}`}>
                                <Reply className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-white/40 hover:text-white" data-testid={`button-archive-${email.id}`}>
                                <Archive className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="wordpress" className="space-y-6 mt-6" data-testid="tabcontent-wordpress">
              <div className="max-w-4xl mx-auto">
                <Card className="border-blue-500/20 bg-blue-500/5 hover-elevate">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <RefreshCw className="h-6 w-6 text-blue-400" />
                      WordPress Administration Mirror
                    </CardTitle>
                    <CardDescription className="text-base text-blue-200/60">
                      Direct secure access to the Forgotten Formula WooCommerce and WordPress CMS.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center p-12 text-center space-y-6 border-2 border-dashed border-blue-500/30 rounded-2xl bg-black/40 shadow-[0_0_50px_rgba(59,130,246,0.1)_inset]">
                      <div className="h-20 w-20 bg-blue-500/20 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                        <ExternalLink className="h-10 w-10 text-blue-400" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-white tracking-wide">Access Global Store & CMS</h3>
                        <p className="text-blue-100/70 max-w-lg mx-auto text-lg leading-relaxed">
                          For maximum security, the main WordPress backend is sandboxed on its own isolated secure network (`167.71.225.18`).
                          Click below to securely mirror into the WP Admin interface in a new verified tab.
                        </p>
                      </div>
                      <Button
                        onClick={() => window.open('https://forgottenformula.com/wp-admin', '_blank')}
                        className="mt-8 bg-blue-600 hover:bg-blue-500 text-white gap-3 px-10 py-6 text-lg rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all hover:scale-105"
                        data-testid="button-open-wp-admin-trustee"
                      >
                        <RefreshCw className="h-5 w-5" />
                        Launch WP Admin Console
                        <ExternalLink className="h-4 w-4 ml-2 opacity-70" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="agent-network" className="space-y-6">
              {(() => {
                const divisionColorMap: Record<string, { bg: string; text: string; border: string; rgb: string; gradient: string }> = {
                  executive: { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30", rgb: "251,191,36", gradient: "from-amber-500/20 to-yellow-500/20" },
                  marketing: { bg: "bg-violet-500/20", text: "text-violet-400", border: "border-violet-500/30", rgb: "139,92,246", gradient: "from-violet-500/20 to-purple-500/20" },
                  financial: { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30", rgb: "16,185,129", gradient: "from-emerald-500/20 to-green-500/20" },
                  legal: { bg: "bg-rose-500/20", text: "text-rose-400", border: "border-rose-500/30", rgb: "244,63,94", gradient: "from-rose-500/20 to-pink-500/20" },
                  engineering: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30", rgb: "59,130,246", gradient: "from-blue-500/20 to-indigo-500/20" },
                  science: { bg: "bg-cyan-500/20", text: "text-cyan-400", border: "border-cyan-500/30", rgb: "6,182,212", gradient: "from-cyan-500/20 to-teal-500/20" },
                  support: { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30", rgb: "168,85,247", gradient: "from-purple-500/20 to-fuchsia-500/20" },
                };
                const allDivisions: Array<'executive' | 'marketing' | 'financial' | 'legal' | 'engineering' | 'science' | 'support'> = ["executive", "marketing", "financial", "legal", "engineering", "science", "support"];

                const handleCmdCreateTask = () => {
                  if (!cmdTaskAgent || !cmdTaskTitle.trim()) return;
                  const agentProfile = agents.find(a => a.id === cmdTaskAgent);
                  cmdCreateTaskMutation.mutate({
                    agentId: cmdTaskAgent,
                    division: agentProfile?.division || "executive",
                    title: cmdTaskTitle.trim(),
                    description: cmdTaskDesc.trim(),
                    status: "pending",
                    priority: parseInt(cmdTaskPriority),
                  });
                };

                const filteredAgents = agents.filter(agent => {
                  const matchesDivision = cmdDivisionFilter === "all" || agent.division === cmdDivisionFilter;
                  const matchesSearch = !cmdSearch ||
                    agent.name.toLowerCase().includes(cmdSearch.toLowerCase()) ||
                    agent.title.toLowerCase().includes(cmdSearch.toLowerCase()) ||
                    agent.specialty.toLowerCase().includes(cmdSearch.toLowerCase());
                  return matchesDivision && matchesSearch;
                });

                const getAgentTaskStats = (agentId: string) => {
                  const tasks = agentTasks.filter(t => t.agentId === agentId);
                  const active = tasks.filter(t => t.status === "pending" || t.status === "in_progress").length;
                  const completed = tasks.filter(t => t.status === "completed").length;
                  const lastTask = tasks.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())[0];
                  return { active, completed, total: tasks.length, lastActivity: lastTask?.updatedAt || lastTask?.createdAt || null };
                };

                const recentTasks = [...agentTasks]
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 15);

                const totalActive = agentTasks.filter(t => t.status === "pending" || t.status === "in_progress").length;
                const totalCompleted = agentTasks.filter(t => t.status === "completed").length;
                const totalBlocked = agentTasks.filter(t => t.status === "blocked").length;

                return (
                  <>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-cyan-500/10 via-green-500/10 to-blue-500/10 border border-cyan-500/20">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/30 to-green-500/30 flex items-center justify-center border border-cyan-500/40">
                          <Network className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-white" data-testid="text-command-center-title">Agent Command Center</h3>
                            <Badge className="bg-green-500/20 text-green-300">
                              {agents.length} AGENTS
                            </Badge>
                          </div>
                          <p className="text-sm text-white/60">
                            {totalActive} active tasks • {totalCompleted} completed • {totalBlocked} blocked • {allDivisions.length} divisions
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          onClick={() => setCmdShowTaskForm(!cmdShowTaskForm)}
                          className="bg-cyan-500 hover:bg-cyan-600 text-black"
                          data-testid="button-toggle-task-form"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Assign Task
                        </Button>
                        {!sentinelAgents?.count && (
                          <Button
                            onClick={() => initializeSentinelMutation.mutate()}
                            disabled={initializeSentinelMutation.isPending}
                            variant="outline"
                            className="border-cyan-500/30 text-cyan-300"
                            data-testid="button-initialize-sentinel"
                          >
                            {initializeSentinelMutation.isPending ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Zap className="w-4 h-4 mr-2" />
                            )}
                            Init Network
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { refetchAgentTasks(); refetchSentinelAgents(); refetchSentinelTasks(); }}
                          className="border-white/10"
                          data-testid="button-refresh-command-center"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {cmdShowTaskForm && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                          <Card className="bg-gradient-to-br from-cyan-500/5 to-blue-500/5 border-cyan-500/20">
                            <CardHeader className="pb-3">
                              <CardTitle className="flex items-center gap-2 text-white text-base">
                                <Target className="w-5 h-5 text-cyan-400" />
                                Assign New Task
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                  <Select value={cmdTaskAgent} onValueChange={setCmdTaskAgent} data-testid="select-task-agent">
                                    <SelectTrigger className="bg-black/30 border-white/10 text-white" data-testid="select-trigger-task-agent">
                                      <SelectValue placeholder="Select Agent" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {agents.map(a => (
                                        <SelectItem key={a.id} value={a.id} data-testid={`select-agent-option-${a.id}`}>
                                          {a.name} â€” {a.title} ({a.division})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    placeholder="Task title..."
                                    value={cmdTaskTitle}
                                    onChange={(e) => setCmdTaskTitle(e.target.value)}
                                    className="bg-black/30 border-white/10 text-white"
                                    data-testid="input-task-title"
                                  />
                                  <Select value={cmdTaskPriority} onValueChange={setCmdTaskPriority}>
                                    <SelectTrigger className="bg-black/30 border-white/10 text-white" data-testid="select-trigger-task-priority">
                                      <SelectValue placeholder="Priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="1">Priority 1 â€” Critical</SelectItem>
                                      <SelectItem value="2">Priority 2 â€” Normal</SelectItem>
                                      <SelectItem value="3">Priority 3 â€” Low</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-3">
                                  <Textarea
                                    placeholder="Task description..."
                                    value={cmdTaskDesc}
                                    onChange={(e) => setCmdTaskDesc(e.target.value)}
                                    className="bg-black/30 border-white/10 text-white h-[104px]"
                                    data-testid="input-task-description"
                                  />
                                  <Button
                                    onClick={handleCmdCreateTask}
                                    disabled={!cmdTaskAgent || !cmdTaskTitle.trim() || cmdCreateTaskMutation.isPending}
                                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-black"
                                    data-testid="button-submit-task"
                                  >
                                    {cmdCreateTaskMutation.isPending ? (
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                      <Send className="w-4 h-4 mr-2" />
                                    )}
                                    Assign Task
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                      <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <Input
                          placeholder="Search agents by name, title, or specialty..."
                          value={cmdSearch}
                          onChange={(e) => setCmdSearch(e.target.value)}
                          className="pl-10 bg-black/30 border-white/10 text-white"
                          data-testid="input-search-agents"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={cmdDivisionFilter === "all" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCmdDivisionFilter("all")}
                          className={cmdDivisionFilter === "all" ? "bg-white/20 text-white" : "border-white/10 text-white/60"}
                          data-testid="button-filter-all"
                        >
                          All ({agents.length})
                        </Button>
                        {allDivisions.map(div => {
                          const count = agents.filter(a => a.division === div).length;
                          const colors = divisionColorMap[div];
                          return (
                            <Button
                              key={div}
                              variant={cmdDivisionFilter === div ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCmdDivisionFilter(div)}
                              className={cmdDivisionFilter === div ? `${colors.bg} ${colors.text} ${colors.border}` : "border-white/10 text-white/60"}
                              data-testid={`button-filter-${div}`}
                            >
                              {div.charAt(0).toUpperCase() + div.slice(1)} ({count})
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider" data-testid="text-agents-count">
                            {filteredAgents.length} Agent{filteredAgents.length !== 1 ? "s" : ""} {cmdDivisionFilter !== "all" ? `in ${cmdDivisionFilter}` : ""}
                          </h4>
                        </div>
                        <ScrollArea className="h-[600px]">
                          <div className="space-y-2 pr-2">
                            {allDivisions
                              .filter(div => cmdDivisionFilter === "all" || cmdDivisionFilter === div)
                              .map(div => {
                                const divAgents = filteredAgents.filter(a => a.division === div);
                                if (divAgents.length === 0) return null;
                                const colors = divisionColorMap[div];
                                return (
                                  <div key={div} className="space-y-2">
                                    <div className="flex items-center gap-2 py-2 sticky top-0 bg-black/80 backdrop-blur-sm z-10">
                                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: `rgb(${colors.rgb})` }} />
                                      <span className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>
                                        {div} Division
                                      </span>
                                      <div className="flex-1 h-px bg-white/5" />
                                      <span className="text-[10px] text-white/30">{divAgents.length} agents</span>
                                    </div>
                                    {divAgents.map(agent => {
                                      const stats = getAgentTaskStats(agent.id);
                                      const sentinelAgent = sentinelAgents?.agents?.find(sa => sa.agentId === agent.id);
                                      return (
                                        <motion.div
                                          key={agent.id}
                                          initial={{ opacity: 0, y: 5 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          className={`p-3 rounded-lg bg-black/20 border border-white/5 hover:border-white/15 transition-all cursor-pointer group`}
                                          onClick={() => openAgentChat(agent)}
                                          data-testid={`agent-card-${agent.id}`}
                                        >
                                          <div className="flex items-start gap-3">
                                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colors.gradient} flex items-center justify-center border ${colors.border} shrink-0`}>
                                              <span className={`text-xs font-bold ${colors.text}`}>{agent.name.substring(0, 2)}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-sm font-semibold text-white">{agent.name}</span>
                                                <Badge variant="outline" className={`text-[10px] ${colors.text} ${colors.border}`}>
                                                  {agent.division}
                                                </Badge>
                                                {sentinelAgent?.status === "active" && (
                                                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                                )}
                                              </div>
                                              <p className="text-xs text-white/50 truncate">{agent.title}</p>
                                              <p className="text-[10px] text-white/30 truncate mt-0.5">{agent.specialty}</p>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                              <div className="text-right hidden sm:block">
                                                <div className="flex items-center gap-2 text-[10px]">
                                                  {stats.active > 0 && (
                                                    <span className="flex items-center gap-1 text-amber-400">
                                                      <Clock className="w-3 h-3" />{stats.active}
                                                    </span>
                                                  )}
                                                  {stats.completed > 0 && (
                                                    <span className="flex items-center gap-1 text-green-400">
                                                      <CheckCircle2 className="w-3 h-3" />{stats.completed}
                                                    </span>
                                                  )}
                                                </div>
                                                {stats.lastActivity && (
                                                  <p className="text-[10px] text-white/25 mt-0.5">{formatTimeAgo(stats.lastActivity)}</p>
                                                )}
                                              </div>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400 hover:text-cyan-300 h-8 w-8"
                                                onClick={(e) => { e.stopPropagation(); openAgentChat(agent); }}
                                                data-testid={`button-chat-${agent.id}`}
                                              >
                                                <MessageSquare className="w-4 h-4" />
                                              </Button>
                                            </div>
                                          </div>
                                        </motion.div>
                                      );
                                    })}
                                  </div>
                                );
                              })}
                            {filteredAgents.length === 0 && (
                              <div className="text-center py-12 text-white/30">
                                <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p className="text-sm">No agents match your search</p>
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </div>

                      <div className="space-y-4">
                        <Card className="bg-black/20 border-white/10">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                              <Activity className="w-4 h-4 text-cyan-400" />
                              Network Overview
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="p-2.5 rounded-lg bg-white/5">
                                <p className="text-[10px] text-white/40 uppercase">Total Agents</p>
                                <p className="text-lg font-bold text-white" data-testid="text-total-agents">{agents.length}</p>
                              </div>
                              <div className="p-2.5 rounded-lg bg-white/5">
                                <p className="text-[10px] text-white/40 uppercase">Total Tasks</p>
                                <p className="text-lg font-bold text-white" data-testid="text-total-tasks">{agentTasks.length}</p>
                              </div>
                              <div className="p-2.5 rounded-lg bg-amber-500/5">
                                <p className="text-[10px] text-amber-400/60 uppercase">Active</p>
                                <p className="text-lg font-bold text-amber-400" data-testid="text-active-tasks">{totalActive}</p>
                              </div>
                              <div className="p-2.5 rounded-lg bg-green-500/5">
                                <p className="text-[10px] text-green-400/60 uppercase">Completed</p>
                                <p className="text-lg font-bold text-green-400" data-testid="text-completed-tasks">{totalCompleted}</p>
                              </div>
                            </div>
                            {agentTasks.length > 0 && (
                              <div className="pt-2">
                                <div className="flex justify-between text-[10px] text-white/40 mb-1">
                                  <span>Completion Rate</span>
                                  <span>{agentTasks.length > 0 ? Math.round((totalCompleted / agentTasks.length) * 100) : 0}%</span>
                                </div>
                                <Progress value={agentTasks.length > 0 ? (totalCompleted / agentTasks.length) * 100 : 0} className="h-1.5" />
                              </div>
                            )}
                            <Separator className="bg-white/5" />
                            <div className="space-y-1.5">
                              {allDivisions.map(div => {
                                const count = agents.filter(a => a.division === div).length;
                                const divTasks = agentTasks.filter(t => t.division === div);
                                const colors = divisionColorMap[div];
                                return (
                                  <div key={div} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full" style={{ background: `rgb(${colors.rgb})` }} />
                                      <span className="text-white/60 capitalize">{div}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-white/30">{count} agents</span>
                                      <span className="text-white/20">•</span>
                                      <span className="text-white/30">{divTasks.length} tasks</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-black/20 border-white/10">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                              <Zap className="w-4 h-4 text-amber-400" />
                              Recent Task Feed
                            </CardTitle>
                            <CardDescription className="text-xs">Latest activity across all agents</CardDescription>
                          </CardHeader>
                          <CardContent>
                            {recentTasks.length === 0 ? (
                              <div className="text-center py-6 text-white/30">
                                <Target className="w-8 h-8 mx-auto mb-3 opacity-30" />
                                <p className="text-xs">No tasks yet. Assign a task to get started.</p>
                              </div>
                            ) : (
                              <ScrollArea className="h-[350px]">
                                <div className="space-y-2 pr-2">
                                  {recentTasks.map(task => {
                                    const agentProfile = agents.find(a => a.id === task.agentId);
                                    const colors = divisionColorMap[task.division] || divisionColorMap.executive;
                                    return (
                                      <div key={task.id} className="p-2.5 rounded-lg bg-white/5 border border-white/5" data-testid={`task-feed-item-${task.id}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                          <div className={`w-2 h-2 rounded-full ${task.status === "completed" ? "bg-green-400" :
                                            task.status === "in_progress" ? "bg-amber-400 animate-pulse" :
                                              task.status === "blocked" ? "bg-red-400" :
                                                "bg-blue-400"
                                            }`} />
                                          <span className="text-xs font-medium text-white truncate flex-1">{task.title}</span>
                                          {task.priority && task.priority <= 1 && (
                                            <Badge className="bg-red-500/20 text-red-300 text-[9px] px-1">P1</Badge>
                                          )}
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] text-white/40">
                                          <span className="flex items-center gap-1">
                                            <span className={colors.text}>{agentProfile?.name || task.agentId}</span>
                                            <span>•</span>
                                            <span className="capitalize">{task.status?.replace("_", " ")}</span>
                                          </span>
                                          <span>{formatTimeAgo(task.createdAt as any)}</span>
                                        </div>
                                        {task.progress != null && task.progress > 0 && task.status !== "completed" && (
                                          <Progress value={task.progress} className="h-1 mt-1.5" />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </ScrollArea>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    {/* DEAD LETTER QUEUE (DLQ) SECTION */}
                    <div className="mt-8">
                      <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <h3 className="text-lg font-bold text-white">Dead Letter Queue (Agent Healing)</h3>
                      </div>

                      {agentTasks.filter((t: any) => t.status === 'failed').length === 0 ? (
                        <Card className="bg-black/20 border-white/10">
                          <CardContent className="py-8 text-center text-white/40">
                            <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-30 text-green-400" />
                            <p>No failed tasks. All AI Agents are operating nominally.</p>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="grid grid-cols-1 gap-4">
                          {agentTasks.filter((t: any) => t.status === 'failed').map((task: any) => (
                            <Card key={task.id} className="bg-gradient-to-br from-red-500/5 to-orange-500/5 border-red-500/20 shadow-lg" data-testid={`dlq-task-${task.id}`}>
                              <CardHeader className="pb-3 border-b border-red-500/10 flex flex-row items-start justify-between">
                                <div>
                                  <CardTitle className="text-white text-base font-medium flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    {task.title}
                                  </CardTitle>
                                  <CardDescription className="text-white/50 text-xs mt-1">
                                    Assigned to: <span className="text-white/80">{task.agentId}</span> • Retries exhausted: {task.retryCount}
                                  </CardDescription>
                                </div>
                                <Badge variant="outline" className="text-red-400 border-red-500/30 bg-red-500/10 uppercase text-[10px]">
                                  FAILED
                                </Badge>
                              </CardHeader>
                              <CardContent className="pt-4 space-y-4">
                                <div>
                                  <h4 className="text-xs font-semibold text-white/60 mb-1 uppercase tracking-wider">Final Error Log</h4>
                                  <div className="p-3 bg-black/60 rounded border border-red-500/10 font-mono text-xs text-red-300 max-h-32 overflow-y-auto w-full break-all whitespace-pre-wrap">
                                    {task.errorLog || "No explicit error details captured."}
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 pt-2">
                                  <Button
                                    className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 font-semibold"
                                    onClick={() => retryAgentTaskMutation.mutate(task.id)}
                                    disabled={retryAgentTaskMutation.isPending}
                                  >
                                    {retryAgentTaskMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
                                    Force Retry
                                  </Button>

                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="outline" className="flex-1 bg-black/40 border-white/10 text-white hover:bg-white/5">
                                        <ArrowRightLeft className="w-4 h-4 mr-2" />
                                        Reassign Agent
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-slate-950 border-white/10 text-white">
                                      <DialogHeader>
                                        <DialogTitle>Reassign Failed Task</DialogTitle>
                                        <DialogDescription className="text-white/60">
                                          Select a new AI agent to handle "{task.title}".
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="py-4 space-y-4">
                                        <Select onValueChange={(val) => {
                                          reassignAgentTaskMutation.mutate({ taskId: task.id, newAgentId: val });
                                        }}>
                                          <SelectTrigger className="bg-black/30 border-white/10 text-white">
                                            <SelectValue placeholder="Select Fallback Agent" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {agents.map((a) => (
                                              <SelectItem key={a.id} value={a.id}>
                                                {a.name} ({a.division})
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-8">
                      <div className="flex items-center gap-2 mb-4">
                        <PanelLeft className="w-5 h-5 text-cyan-400" />
                        <h3 className="text-lg font-bold text-white">Continuous UI Evolution</h3>
                      </div>

                      {!uiProposalsData?.proposals || uiProposalsData.proposals.length === 0 ? (
                        <Card className="bg-black/20 border-white/10">
                          <CardContent className="py-8 text-center text-white/40">
                            <PanelLeft className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No new UI Refactor Proposals from the AI Frontend Agents.</p>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="grid grid-cols-1 gap-4">
                          {uiProposalsData.proposals.map((proposal) => (
                            <Card key={proposal.id} className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border-cyan-500/20 shadow-lg" data-testid={`ui-proposal-${proposal.id}`}>
                              <CardHeader className="pb-3 border-b border-white/5">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/30">
                                      <Bot className="w-5 h-5 text-cyan-400" />
                                    </div>
                                    <div>
                                      <CardTitle className="text-white text-base">UI Evolution Proposal: {proposal.agentId}</CardTitle>
                                      <CardDescription className="text-cyan-400/70 font-mono text-xs">{proposal.targetFile}</CardDescription>
                                    </div>
                                  </div>
                                  <Badge className={
                                    proposal.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                                      proposal.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                        'bg-amber-500/20 text-amber-400'
                                  }>
                                    {proposal.status.toUpperCase()}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent className="pt-4 space-y-4">
                                <div>
                                  <h4 className="text-xs font-semibold text-white/60 mb-1 uppercase tracking-wider">Agent Assessment</h4>
                                  <p className="text-sm text-white/80">{proposal.description}</p>
                                </div>

                                {proposal.status === 'pending' && (
                                  <div>
                                    <h4 className="text-xs font-semibold text-white/60 mb-2 uppercase tracking-wider">Proposed React Snippet Injection</h4>

                                    {proposal.previewImageUrl && (
                                      <div className="mb-4 rounded-md overflow-hidden border border-white/10 relative group bg-black/50">
                                        <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 text-[10px] rounded text-white backdrop-blur shadow z-10">
                                          Agent Live Preview
                                        </div>
                                        <img src={proposal.previewImageUrl} alt="UI Refactor Preview" className="w-full object-cover transition-transform duration-500 hover:scale-105" />
                                      </div>
                                    )}

                                    <pre className="p-3 bg-black/60 rounded border border-white/5 overflow-x-auto text-xs font-mono text-white/70 max-h-48 overflow-y-auto">
                                      {proposal.proposedDiff}
                                    </pre>
                                  </div>
                                )}

                                {proposal.status === 'pending' && !revisingProposalId && (
                                  <div className="flex items-center gap-3 pt-4">
                                    <Button
                                      className="flex-1 bg-green-500 hover:bg-green-600 text-black font-semibold shadow-lg shadow-green-500/20"
                                      onClick={() => approveProposalMutation.mutate(proposal.id)}
                                      disabled={approveProposalMutation.isPending}
                                    >
                                      {approveProposalMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Approve & Inject Code'}
                                    </Button>
                                    <Button
                                      className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold shadow-lg shadow-amber-500/20"
                                      onClick={() => setRevisingProposalId(proposal.id)}
                                    >
                                      Request Revision
                                    </Button>
                                    <Button
                                      variant="outline"
                                      className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                      onClick={() => rejectProposalMutation.mutate(proposal.id)}
                                      disabled={rejectProposalMutation.isPending}
                                    >
                                      {rejectProposalMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Reject'}
                                    </Button>
                                  </div>
                                )}

                                {revisingProposalId === proposal.id && (
                                  <div className="pt-4 space-y-3 bg-black/40 p-4 rounded-lg border border-amber-500/20 mt-4 shadow-inner">
                                    <h4 className="text-xs font-semibold text-amber-500 mb-2 uppercase tracking-wider flex items-center gap-2">
                                      <MessageSquare className="w-4 h-4" /> Provide Revision Feedback
                                    </h4>
                                    <Textarea
                                      placeholder="e.g. Make the border radius more rounded, use a glassmorphism effect instead of flat background."
                                      value={revisionFeedback}
                                      onChange={(e) => setRevisionFeedback(e.target.value)}
                                      className="bg-black/50 border-white/10 text-sm min-h-[100px] focus:border-amber-500/50"
                                    />
                                    <div className="flex items-center gap-2 pt-2">
                                      <Button
                                        className="bg-amber-500 hover:bg-amber-600 text-black font-semibold shadow-lg shadow-amber-500/20"
                                        disabled={!revisionFeedback.trim() || reviseProposalMutation.isPending}
                                        onClick={() => reviseProposalMutation.mutate({ id: proposal.id, feedback: revisionFeedback })}
                                      >
                                        {reviseProposalMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Dispatch Revision Task to Agent"}
                                      </Button>
                                      <Button
                                        variant="outline"
                                        className="border-white/10 text-white/70 hover:bg-white/5 hover:text-white"
                                        onClick={() => { setRevisingProposalId(null); setRevisionFeedback(""); }}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <SecurityTab />
            </TabsContent>

            <TabsContent value="integrations" className="space-y-6">
              {/* LIVE Integrations */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-cyan-500 animate-pulse" />
                  <h3 className="text-lg font-bold text-cyan-400">LIVE Integrations</h3>
                  <span className="text-xs text-white/40">Real connections to external services</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {safeIntegrationStatuses.filter(i => i.mode === "live").map((integration) => {
                    const iconMap: Record<string, React.ElementType> = {
                      signnow: FileText,
                      gmail: Mail,
                      drive: Folder,
                    };
                    const IntegrationIcon = iconMap[integration.id] || Settings;
                    const isConnected = integration.connectionState === "connected";

                    return (
                      <Card key={integration.id} className={`${isConnected
                        ? "bg-cyan-500/5 border-cyan-500/20"
                        : "bg-amber-500/5 border-amber-500/20"
                        }`} data-testid={`integration-card-${integration.id}`}>
                        <CardContent className="p-5">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isConnected ? "bg-cyan-500/20" : "bg-amber-500/20"
                              }`}>
                              <IntegrationIcon className={`w-6 h-6 ${isConnected ? "text-cyan-400" : "text-amber-400"
                                }`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{integration.name}</h3>
                                <Badge className="bg-cyan-500/20 text-cyan-300 text-[10px]">LIVE</Badge>
                              </div>
                              <Badge className={
                                isConnected
                                  ? "bg-cyan-500/20 text-cyan-300"
                                  : "bg-amber-500/20 text-amber-300"
                              }>
                                {integration.connectionState}
                              </Badge>
                            </div>
                          </div>

                          {integration.sampleData && (
                            <p className="text-xs text-cyan-400/70 mb-2">{integration.sampleData}</p>
                          )}
                          {integration.lastError && (
                            <p className="text-xs text-amber-400/70 mb-2">{integration.lastError}</p>
                          )}
                          {integration.lastCheckedAt && (
                            <p className="text-xs text-white/40 mb-3">
                              Checked: {formatTimeAgo(integration.lastCheckedAt)}
                            </p>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-white/10"
                            onClick={() => testIntegrationMutation.mutate(integration.id)}
                            disabled={testIntegrationMutation.isPending}
                            data-testid={`button-test-${integration.id}`}
                          >
                            <RefreshCw className={`w-4 h-4 mr-2 ${testIntegrationMutation.isPending ? 'animate-spin' : ''}`} />
                            Test Connection
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Disconnected/Problematic Integrations - Show any that need attention */}
              {(safeIntegrationStatuses.filter(i => i.connectionState === "disconnected" || i.connectionState === "not_implemented" || i.connectionState === "error").length > 0) && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
                    <h3 className="text-lg font-bold text-amber-400">Needs Attention</h3>
                    <span className="text-xs text-white/40">These integrations require configuration</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {safeIntegrationStatuses.filter(i => i.connectionState === "disconnected" || i.connectionState === "not_implemented" || i.connectionState === "error").map((integration) => {
                      const iconMap: Record<string, React.ElementType> = {
                        woocommerce: ShoppingCart,
                        wordpress: Users,
                        gmail: Mail,
                        drive: Folder,
                        signnow: Shield,
                        database: Database,
                      };
                      const IntegrationIcon = iconMap[integration.id] || Settings;

                      return (
                        <Card key={integration.id} className="bg-amber-500/5 border-amber-500/20" data-testid={`integration-card-disconnected-${integration.id}`}>
                          <CardContent className="p-5">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-500/20">
                                <IntegrationIcon className="w-6 h-6 text-amber-400" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium text-white">{integration.name}</h3>
                                </div>
                                <Badge className="bg-amber-500/20 text-amber-400">
                                  Disconnected
                                </Badge>
                              </div>
                            </div>

                            {integration.lastError && (
                              <p className="text-xs text-amber-400/70 mb-2">{integration.lastError}</p>
                            )}
                            {integration.nextSteps && (
                              <p className="text-xs text-white/60 mb-3">{integration.nextSteps}</p>
                            )}

                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                              onClick={() => testIntegrationMutation.mutate(integration.id)}
                              disabled={testIntegrationMutation.isPending}
                              data-testid={`button-retry-${integration.id}`}
                            >
                              <RefreshCw className={`w-4 h-4 mr-2 ${testIntegrationMutation.isPending ? 'animate-spin' : ''}`} />
                              Retry Connection
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="agent-outputs" className="space-y-6">
              <Card className="bg-black/20 border-white/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <Folder className="w-5 h-5 text-pink-400" />
                        Agent Output Folders
                      </CardTitle>
                      <CardDescription>Live output files across all AI agent divisions in Google Drive</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="border-white/10 text-white" onClick={() => refetchDriveAssets()} data-testid="button-refresh-drive">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh Drive Status
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {allDivisionsStructure?.divisions && Object.keys(allDivisionsStructure.divisions).length > 0 ? (
                    <div className="space-y-8">
                      {Object.entries(allDivisionsStructure.divisions).map(([divisionName, folders]) => (
                        <div key={divisionName}>
                          <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2 capitalize tracking-wide text-white/90">{divisionName} Division</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {folders.map((folder) => (
                              <div key={folder.id} className="p-4 rounded-lg bg-black/40 border border-white/10 hover:border-white/20 transition-all shadow-md">
                                <div className="flex items-center gap-3 mb-3">
                                  <Folder className="w-5 h-5 text-amber-400 shrink-0" />
                                  <span className="font-medium text-white truncate max-w-[200px]" title={folder.name}>{folder.name}</span>
                                  <Badge variant="outline" className="text-[10px] ml-auto bg-white/5 whitespace-nowrap">{folder.files.length} items</Badge>
                                </div>
                                <div className="space-y-2">
                                  {folder.files.slice(0, 5).map((file) => (
                                    <div
                                      key={file.id}
                                      className="flex items-center gap-2 p-2 rounded bg-black/60 hover:bg-black/80 cursor-pointer transition-all border border-transparent hover:border-white/10 group"
                                      onClick={() => {
                                        if (file.mimeType.includes("image") || file.mimeType.includes("video")) {
                                          setMediaPreview({
                                            id: file.id,
                                            name: file.name,
                                            mimeType: file.mimeType,
                                            webViewLink: file.webViewLink,
                                            thumbnailLink: file.thumbnailLink
                                          });
                                        } else if (file.webViewLink) {
                                          window.open(file.webViewLink, '_blank');
                                        }
                                      }}
                                    >
                                      {file.mimeType.includes("image") ? (
                                        <Image className="w-4 h-4 text-pink-400 shrink-0" />
                                      ) : file.mimeType.includes("video") ? (
                                        <Play className="w-4 h-4 text-violet-400 shrink-0" />
                                      ) : (
                                        <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                                      )}
                                      <span className="text-xs text-white/80 truncate flex-1 block max-w-full" title={file.name}>{file.name}</span>
                                      {(file.mimeType.includes("image") || file.mimeType.includes("video")) && (
                                        <Badge variant="outline" className="text-[9px] px-1 py-0 bg-transparent border-white/20 text-white/60">Preview</Badge>
                                      )}
                                      {file.webViewLink && (
                                        <a href={file.webViewLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="shrink-0 pl-1">
                                          <ExternalLink className="w-3 h-3 text-white/30 group-hover:text-cyan-400 transition-colors" />
                                        </a>
                                      )}
                                    </div>
                                  ))}
                                  {folder.files.length > 5 && (
                                    <p className="text-xs text-white/30 text-center pt-2 italic">+{folder.files.length - 5} additional assets</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Folder className="w-16 h-16 mx-auto mb-4 text-white/20" />
                      <h3 className="text-lg font-medium mb-2">No Assets Found</h3>
                      <p className="text-white/50 mb-4">Connect Google Drive or upload assets to get started</p>
                      <Button
                        className="bg-pink-500 hover:bg-pink-600"
                        data-testid="button-setup-drive"
                        onClick={() => setupDriveFoldersMutation.mutate()}
                        disabled={setupDriveFoldersMutation.isPending}
                      >
                        {setupDriveFoldersMutation.isPending ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Folder className="w-4 h-4 mr-2" />
                        )}
                        {setupDriveFoldersMutation.isPending ? "Setting up..." : "Setup Drive Folders"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="legal" className="space-y-6">
              <Card className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-indigo-500/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                        <Scale className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div>
                        <CardTitle>Legal Division Documents</CardTitle>
                        <CardDescription>Trademark applications, patents, and legal filings drafted by JURIS and the Legal team</CardDescription>
                      </div>
                    </div>
                    <Badge className="bg-indigo-500/20 text-indigo-300">{legalDocuments.length} Documents</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {legalDocuments.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-1 space-y-2">
                        <h4 className="text-sm font-medium text-white/70 mb-3">Document Queue</h4>
                        <ScrollArea className="h-[500px]">
                          {legalDocuments.map((doc) => (
                            <div
                              key={doc.id}
                              onClick={() => setSelectedLegalDoc(doc.id)}
                              className={`p-3 rounded-lg cursor-pointer transition-all mb-2 ${selectedLegalDoc === doc.id
                                ? "bg-indigo-500/20 border border-indigo-500/40"
                                : "bg-black/20 border border-transparent hover:bg-black/30"
                                }`}
                              data-testid={`legal-doc-${doc.id}`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${doc.docType === "trademark" ? "bg-amber-500/20" :
                                  doc.docType === "patent" ? "bg-cyan-500/20" :
                                    doc.docType === "agreement" ? "bg-cyan-500/20" :
                                      "bg-indigo-500/20"
                                  }`}>
                                  {doc.docType === "trademark" ? <Star className="w-4 h-4 text-amber-400" /> :
                                    doc.docType === "patent" ? <Lock className="w-4 h-4 text-cyan-400" /> :
                                      doc.docType === "agreement" ? <FileText className="w-4 h-4 text-cyan-400" /> :
                                        <Scale className="w-4 h-4 text-indigo-400" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{doc.title}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge className={`text-xs ${doc.status === "draft" ? "bg-yellow-500/20 text-yellow-300" :
                                      doc.status === "review" ? "bg-blue-500/20 text-blue-300" :
                                        doc.status === "filed" ? "bg-cyan-500/20 text-cyan-300" :
                                          doc.status === "approved" ? "bg-cyan-500/20 text-cyan-300" :
                                            "bg-gray-500/20 text-gray-300"
                                      }`}>
                                      {doc.status.toUpperCase()}
                                    </Badge>
                                    {doc.priority === "high" && (
                                      <Badge className="bg-orange-500/20 text-orange-300 text-xs">Priority</Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-white/40 mt-1">By {doc.assignedAgent || doc.createdBy}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </ScrollArea>
                      </div>

                      <div className="lg:col-span-2">
                        {selectedLegalDoc ? (
                          (() => {
                            const doc = legalDocuments.find(d => d.id === selectedLegalDoc);
                            if (!doc) return null;
                            return (
                              <Card className="bg-black/20 border-white/10 h-full">
                                <CardHeader className="pb-3">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <CardTitle className="text-lg">{doc.title}</CardTitle>
                                      <CardDescription>{doc.description}</CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                      {doc.status === "approved" ? (
                                        <Badge className="bg-cyan-500/20 text-cyan-300">
                                          <CheckCircle2 className="w-3 h-3 mr-1" />
                                          Approved
                                        </Badge>
                                      ) : (
                                        <Button
                                          size="sm"
                                          className="bg-indigo-500 hover:bg-indigo-600"
                                          data-testid="button-approve-doc"
                                          onClick={() => approveLegalDocMutation.mutate(doc.id)}
                                          disabled={pendingDocAction?.docId === doc.id && pendingDocAction?.action === "approve"}
                                        >
                                          {pendingDocAction?.docId === doc.id && pendingDocAction?.action === "approve" ? (
                                            <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                                          ) : (
                                            <CheckCircle2 className="w-4 h-4 mr-1" />
                                          )}
                                          Approve
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div className="p-3 rounded-lg bg-white/5">
                                      <p className="text-xs text-white/50">Type</p>
                                      <p className="text-sm font-medium capitalize">{doc.docType}</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-white/5">
                                      <p className="text-xs text-white/50">Jurisdiction</p>
                                      <p className="text-sm font-medium">{doc.jurisdiction || "United States"}</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-white/5">
                                      <p className="text-xs text-white/50">Assigned Agent</p>
                                      <p className="text-sm font-medium">{doc.assignedAgent || "JURIS"}</p>
                                    </div>
                                  </div>

                                  <div className="p-4 rounded-lg bg-black/20 border border-white/5">
                                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                      <FileText className="w-4 h-4 text-indigo-400" />
                                      Document Content
                                    </h4>
                                    <ScrollArea className="h-[300px]">
                                      <pre className="text-xs text-white/70 whitespace-pre-wrap font-mono">{doc.content}</pre>
                                    </ScrollArea>
                                  </div>

                                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                                    <p className="text-xs text-white/40">
                                      Created {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : "recently"}
                                    </p>
                                    <div className="flex gap-2">
                                      {doc.driveUrl ? (
                                        <a
                                          href={doc.driveUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center text-sm text-indigo-400 hover:text-indigo-300"
                                        >
                                          <ExternalLink className="w-4 h-4 mr-1" />
                                          View in Drive
                                        </a>
                                      ) : (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="text-white/50 hover:text-white"
                                          data-testid="button-upload-drive"
                                          onClick={() => uploadToDriveMutation.mutate(doc.id)}
                                          disabled={pendingDocAction?.docId === doc.id && pendingDocAction?.action === "upload"}
                                        >
                                          {pendingDocAction?.docId === doc.id && pendingDocAction?.action === "upload" ? (
                                            <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                                          ) : (
                                            <Upload className="w-4 h-4 mr-1" />
                                          )}
                                          Save to Drive
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })()
                        ) : (
                          <div className="h-full flex items-center justify-center text-center p-12 border border-dashed border-white/10 rounded-xl">
                            <div>
                              <Scale className="w-12 h-12 mx-auto mb-4 text-white/20" />
                              <h3 className="text-lg font-medium mb-2">Select a Document</h3>
                              <p className="text-white/50 text-sm">Click on a document from the queue to view its full content and take action</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Scale className="w-16 h-16 mx-auto mb-4 text-white/20" />
                      <h3 className="text-lg font-medium mb-2">No Legal Documents</h3>
                      <p className="text-white/50 mb-4">The Legal Division will draft documents as needed</p>
                      <Button
                        className="bg-indigo-500 hover:bg-indigo-600"
                        onClick={async () => {
                          try {
                            await fetch("/api/legal/initialize", { method: "POST" });
                            refetchLegalDocs();
                            toast({ title: "Legal documents initialized", description: "JURIS has drafted the initial trademark and patent documents" });
                          } catch (e) {
                            toast({ title: "Error", description: "Failed to initialize legal documents", variant: "destructive" });
                          }
                        }}
                        data-testid="button-init-legal"
                      >
                        <Scale className="w-4 h-4 mr-2" />
                        Initialize Legal Documents
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <LegalSigningSection />
            </TabsContent>

            <TabsContent value="sentinel-alerts" className="space-y-6">
              <SentinelAlertsPanel />
            </TabsContent>

            {/* Patient Management Tab - Same features as Doctors */}
            <TabsContent value="patient-management" className="space-y-6">
              <Card className="bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border-emerald-500/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-emerald-100">
                        <Stethoscope className="w-5 h-5 text-emerald-400" />
                        Patient Management Tools
                      </CardTitle>
                      <CardDescription>Full access to doctor-level patient tools</CardDescription>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-300">Trustee Access</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link href="/doctors">
                      <div className="p-4 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors border border-white/10 hover:border-emerald-500/30">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-3">
                          <Brain className="w-6 h-6 text-emerald-400" />
                        </div>
                        <h4 className="font-bold">Root Cause Analysis</h4>
                        <p className="text-sm text-white/60 mt-1">Functional medicine timeline, environmental factors, toxicity assessments</p>
                      </div>
                    </Link>
                    <Link href="/blood-analysis">
                      <div className="p-4 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors border border-white/10 hover:border-violet-500/30">
                        <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center mb-3">
                          <CircuitBoard className="w-6 h-6 text-violet-400" />
                        </div>
                        <h4 className="font-bold">AI Blood Analysis</h4>
                        <p className="text-sm text-white/60 mt-1">Upload and analyze live blood samples with ALLIO Vision AI</p>
                      </div>
                    </Link>
                    <Link href="/doctors">
                      <div className="p-4 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors border border-white/10 hover:border-blue-500/30">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-3">
                          <MessageSquare className="w-6 h-6 text-blue-400" />
                        </div>
                        <h4 className="font-bold">Patient Messaging</h4>
                        <p className="text-sm text-white/60 mt-1">Secure communication with patients and protocol updates</p>
                      </div>
                    </Link>
                  </div>

                  <Separator className="bg-white/10" />

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Root Cause Framework Overview */}
                    <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                      <h3 className="font-bold flex items-center gap-2 mb-4">
                        <Brain className="w-5 h-5 text-emerald-400" />
                        Root Cause Framework
                      </h3>
                      <p className="text-sm text-white/60 mb-4">Functional medicine approach - not pharma-based</p>
                      <div className="grid grid-cols-2 gap-2">
                        {["Symptom Timeline", "Environmental Toxins", "Nutritional Status", "Lifestyle Factors", "Gut Health", "Heavy Metals", "Genetic Markers", "Stress Response"].map((item) => (
                          <div key={item} className="p-2 rounded-lg bg-white/5 text-xs text-center flex items-center gap-2 justify-center">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Analysis Tools */}
                    <div className="p-5 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20">
                      <h3 className="font-bold flex items-center gap-2 mb-4">
                        <CircuitBoard className="w-5 h-5 text-violet-400" />
                        AI Analysis Tools
                      </h3>
                      <p className="text-sm text-white/60 mb-4">Medical imaging with PMA educational disclaimers</p>
                      <div className="space-y-2">
                        {[
                          { name: "Live Blood Analysis", model: "ALLIO Vision", status: "Active" },
                          { name: "X-Ray Analysis", model: "HuggingFace", status: "Active" },
                          { name: "Skin Analysis", model: "HuggingFace", status: "Planned" }
                        ].map((tool) => (
                          <div key={tool.name} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                            <span className="text-sm">{tool.name}</span>
                            <Badge className={tool.status === "Active" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}>
                              {tool.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <Link href="/doctors">
                      <Button className="bg-emerald-500 hover:bg-emerald-600">
                        <Stethoscope className="w-4 h-4 mr-2" />
                        Open Full Doctor Portal
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pma-contracts" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border-teal-500/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-teal-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-teal-100" data-testid="text-pma-total-clinics">
                          {allClinics.length}
                        </p>
                        <p className="text-xs text-white/60">Total Clinic PMAs</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <PenTool className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-emerald-100" data-testid="text-pma-signnow-active">{allClinics.filter((c: any) => c.signNowMemberLink).length}</p>
                        <p className="text-xs text-white/60">Active SignNow Links</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-amber-100" data-testid="text-pma-compliant">{allClinics.length > 0 ? Math.round((allClinics.filter((c: any) => c.signNowMemberLink).length / allClinics.length) * 100) : 0}%</p>
                        <p className="text-xs text-white/60">SignNow Coverage</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                        <Gavel className="w-5 h-5 text-violet-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-violet-100" data-testid="text-pma-gavel-review">
                          {agentTasks.find((t: AgentTask) => t.agentId === "gavel" && t.title?.includes("PMA"))?.status === "completed" ? "Complete" : agentTasks.find((t: AgentTask) => t.agentId === "gavel" && t.title?.includes("PMA"))?.status === "in_progress" ? "In Progress" : "Pending"}
                        </p>
                        <p className="text-xs text-white/60">GAVEL Legal Review</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-500/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-100">
                      <Shield className="w-5 h-5 text-amber-400" />
                      Mother PMA - Forgotten Formula
                    </CardTitle>
                    <CardDescription>Mother PMA - Constitutional Foundation</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-white/5">
                        <p className="text-xs text-white/60">EIN</p>
                        <p className="font-mono font-bold text-amber-300">93-4726660</p>
                      </div>
                      <div className="p-3 rounded-lg bg-white/5">
                        <p className="text-xs text-white/60">Trustee</p>
                        <p className="font-bold">Trustee</p>
                      </div>
                      <div className="p-3 rounded-lg bg-white/5">
                        <p className="text-xs text-white/60">Location</p>
                        <p className="text-sm">Denton, TX 76210</p>
                      </div>
                      <div className="p-3 rounded-lg bg-white/5">
                        <p className="text-xs text-white/60">Constitutional Basis</p>
                        <p className="text-sm">1st & 14th Amendment</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Link href="/clinic/pma-network">
                        <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black">
                          <Globe className="w-4 h-4 mr-2" />
                          PMA Network Hub
                        </Button>
                      </Link>
                      <a href="https://ffpmaclinicpmacreation.replit.app" target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="border-amber-500/30 text-amber-300">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          PMA Filing Manager
                        </Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-teal-500/5 to-cyan-500/5 border-teal-500/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-teal-100">
                      <PenTool className="w-5 h-5 text-teal-400" />
                      SignNow Contract Flow
                    </CardTitle>
                    <CardDescription>Member signing pipeline status</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-sm">SignNow Links Active</span>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-300">38 clinics</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <div className="flex items-center gap-2">
                          <ArrowRight className="w-4 h-4 text-cyan-400" />
                          <span className="text-sm">Sign â†’ WooCommerce Cart</span>
                        </div>
                        <Badge className="bg-cyan-500/20 text-cyan-300">Auto-redirect</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-amber-400" />
                          <span className="text-sm">WordPress Sync</span>
                        </div>
                        <Badge className="bg-amber-500/20 text-amber-300">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-violet-400" />
                          <span className="text-sm">$10 Membership Fee</span>
                        </div>
                        <Badge className="bg-violet-500/20 text-violet-300">Enforced</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Link href="/clinic/contracts">
                        <Button size="sm" className="bg-teal-500 hover:bg-teal-600 text-white">
                          <FileText className="w-4 h-4 mr-2" />
                          Manage Contracts
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-gradient-to-br from-violet-500/5 to-indigo-500/5 border-violet-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-violet-100">
                    <Gavel className="w-5 h-5 text-violet-400" />
                    GAVEL Legal Review Status
                  </CardTitle>
                  <CardDescription>Constitutional compliance audit of PMA network</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <h4 className="font-bold text-sm mb-2">Audit Scope</h4>
                      <div className="space-y-1 text-xs text-white/60">
                        <p>Mother/Child PMA structure</p>
                        <p>Constitutional protections</p>
                        <p>SignNow contract flows</p>
                        <p>Membership fee enforcement</p>
                        <p>Form 8832 independent tax election</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <h4 className="font-bold text-sm mb-2">Key Rules Under Review</h4>
                      <div className="space-y-1 text-xs text-white/60">
                        <p>Rule 1: $10 Legal Gatekeeper</p>
                        <p>Rule 2: Everyone Signs</p>
                        <p>Rule 5: Independent Tax Election</p>
                        <p>Rule 6: Must-Have Paperwork</p>
                        <p>Rule 8: IP Protection</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <h4 className="font-bold text-sm mb-2 text-amber-300">Task Status</h4>
                      <Badge className="bg-amber-500/20 text-amber-300 mb-2">Pending Review</Badge>
                      <p className="text-xs text-white/60 mt-2">GAVEL has been assigned to conduct a comprehensive constitutional compliance audit of the entire PMA network structure.</p>
                      <Link href="/trustee">
                        <Button size="sm" variant="outline" className="mt-3 border-violet-500/30 text-violet-300 w-full">
                          View in Agent Tasks
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="launch-readiness" className="space-y-6">
              <LaunchReadinessWidget />
            </TabsContent>

            <TabsContent value="protocol-queue" className="space-y-6">
              <ProtocolQueuePanel />
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* ATHENA Chat Panel */}
      <AnimatePresence>
        {showAthenaChat && (
          <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 w-full max-w-sm sm:max-w-md h-[550px] max-h-[80vh] flex flex-col bg-gradient-to-br from-slate-900 to-black border border-violet-500/30 rounded-xl shadow-2xl overflow-hidden shadow-violet-500/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-violet-500/10 to-purple-500/10 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-sm md:text-base text-white">ATHENA</h2>
                  <p className="text-xs text-violet-300 font-medium">Executive Intelligence</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={handleCopyAthenaChat} className="text-white/70 hover:text-white h-8 w-8" title="Copy Chat">
                  <Copy className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handlePrintAthenaChat} className="text-white/70 hover:text-white h-8 w-8" title="Print Chat">
                  <Printer className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleShareAthenaChat} className="text-white/70 hover:text-white h-8 w-8" title="Share Chat">
                  <Share className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setShowAthenaChat(false)} className="hover:bg-red-500/20 hover:text-red-400 text-white/70 h-8 w-8 rounded-full ml-1" title="Close Chat">
                  <span className="text-lg">✕</span>
                </Button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-black/40" style={{ overscrollBehavior: 'contain' }}>
              <div className="space-y-4">
                {athenaMessages.length === 0 && (
                  <div className="text-center py-8">
                    <Crown className="w-12 h-12 mx-auto mb-4 text-violet-400/50" />
                    <h3 className="font-medium mb-2 text-white">Welcome, Trustee</h3>
                    <p className="text-sm text-white/50 max-w-md mx-auto">
                      I'm ATHENA, your Executive Intelligence. I can help you manage communications,
                      review priorities, and coordinate with other agents. How may I assist you today?
                    </p>
                  </div>
                )}
                {athenaMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl p-3 ${msg.role === "user"
                      ? "bg-gradient-to-br from-violet-600 to-purple-600 text-white rounded-br-sm shadow-md"
                      : "bg-white/10 text-white/90 border border-white/5 rounded-bl-sm shadow-sm font-light text-[15px] leading-relaxed"
                      }`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {athenaLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/5 p-3 rounded-2xl rounded-bl-sm border border-white/5">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                        <span className="text-sm text-violet-200">ATHENA is processing...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-white/10 bg-[#0f111a]">
              <div className="flex items-center gap-2 relative">
                <Input
                  value={athenaInput}
                  onChange={(e) => setAthenaInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendAthenaMessage()}
                  placeholder="Command ATHENA..."
                  className="flex-1 bg-black/50 border-white/20 text-white focus-visible:ring-violet-500 pl-4 pr-12 py-6 rounded-full"
                  disabled={athenaLoading}
                  data-testid="input-athena-message"
                />
                <Button
                  onClick={sendAthenaMessage}
                  disabled={athenaLoading || !athenaInput.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-violet-500 hover:bg-violet-400 text-white rounded-full h-8 w-8 p-0 flex items-center justify-center transition-all shadow-lg"
                  data-testid="button-send-athena"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ATHENA Trust Challenge Modal */}
      <AnimatePresence>
        {showAthenaTrustChallenge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            data-testid="athena-trust-modal"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-violet-500/30 rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-violet-500/20 rounded-full flex items-center justify-center">
                  <Shield className="w-8 h-8 text-violet-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Trust Verification Required</h2>
                <p className="text-white/60 text-sm">
                  Before ATHENA can be activated, we need to verify your identity as the Trustee.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-violet-500/10 rounded-xl border border-violet-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Crown className="w-5 h-5 text-violet-400" />
                    <span className="font-medium text-violet-300">ATHENA asks:</span>
                  </div>
                  <p className="text-white text-lg font-medium">
                    "{athenaConfig?.trustChallenge || 'What do I call you everyday we work together?'}"
                  </p>
                </div>

                <div>
                  <Input
                    type="text"
                    value={athenaTrustAnswer}
                    onChange={(e) => {
                      setAthenaTrustAnswer(e.target.value);
                      setAthenaTrustError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleVerifyAthenaTrust()}
                    placeholder="Enter your answer..."
                    className="w-full bg-white/5 border-white/10 text-white"
                    data-testid="input-athena-trust-answer"
                  />
                  {athenaTrustError && (
                    <p className="text-red-400 text-sm mt-2" data-testid="text-athena-trust-error">
                      {athenaTrustError}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-white/20"
                    onClick={() => {
                      setShowAthenaTrustChallenge(false);
                      setAthenaTrustAnswer("");
                      setAthenaTrustError("");
                    }}
                    data-testid="button-cancel-trust"
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-violet-500 hover:bg-violet-600"
                    onClick={handleVerifyAthenaTrust}
                    disabled={verifyAthenaTrustMutation.isPending}
                    data-testid="button-verify-trust"
                  >
                    {verifyAthenaTrustMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Verify Trust
                      </>
                    )}
                  </Button>
                </div>

                <p className="text-center text-xs text-white/40 pt-2">
                  This verification ensures only the Trustee can activate ATHENA's autonomous capabilities.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media Preview Modal */}
      <AnimatePresence>
        {mediaPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setMediaPreview(null)}
            data-testid="media-preview-modal"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl max-h-[90vh] w-full bg-gray-900 rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  {mediaPreview.mimeType.includes("video") ? (
                    <Film className="w-5 h-5 text-violet-400" />
                  ) : (
                    <Image className="w-5 h-5 text-pink-400" />
                  )}
                  <span className="font-medium truncate max-w-md">{mediaPreview.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {mediaPreview.mimeType.includes("video") ? "Video" : "Image"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {mediaPreview.webViewLink && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/20"
                      onClick={() => window.open(mediaPreview.webViewLink, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open in Drive
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMediaPreview(null)}
                    data-testid="button-close-preview"
                  >
                    âœ•
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 flex items-center justify-center min-h-[400px] max-h-[70vh] overflow-auto">
                {mediaPreview.mimeType.includes("video") ? (
                  <div className="w-full max-w-4xl">
                    {mediaPreview.webViewLink ? (
                      <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                        <iframe
                          src={(() => {
                            const link = mediaPreview.webViewLink || '';
                            if (link.includes('drive.google.com/file/d/')) {
                              const fileId = link.match(/\/d\/([^/]+)/)?.[1];
                              return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : link;
                            }
                            if (link.includes('uc?id=')) {
                              const fileId = new URL(link).searchParams.get('id');
                              return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : link;
                            }
                            return link.replace('/view', '/preview');
                          })()}
                          className="w-full h-full"
                          allow="autoplay"
                          allowFullScreen
                          sandbox="allow-scripts allow-same-origin allow-presentation"
                          title={mediaPreview.name}
                          data-testid="video-player-iframe"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video w-full rounded-lg bg-black/50 flex items-center justify-center">
                        <div className="text-center">
                          <Play className="w-16 h-16 mx-auto mb-4 text-violet-400" />
                          <p className="text-white/70">Video preview not available</p>
                          <p className="text-sm text-white/40 mt-2">Click "Open in Drive" to view</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full max-w-4xl">
                    {mediaPreview.thumbnailLink || mediaPreview.webViewLink ? (
                      <img
                        src={mediaPreview.thumbnailLink?.replace('=s220', '=s1000') || mediaPreview.webViewLink}
                        alt={mediaPreview.name}
                        className="max-w-full max-h-[60vh] mx-auto rounded-lg shadow-lg object-contain"
                        data-testid="image-preview"
                      />
                    ) : (
                      <div className="aspect-video w-full rounded-lg bg-black/50 flex items-center justify-center">
                        <div className="text-center">
                          <Image className="w-16 h-16 mx-auto mb-4 text-pink-400" />
                          <p className="text-white/70">Image preview not available</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
