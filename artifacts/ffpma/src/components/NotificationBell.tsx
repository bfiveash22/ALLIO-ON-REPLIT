import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, BellRing, Check, CheckCheck, X, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface UserNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface NotificationPreferences {
  protocolUpdate: boolean;
  newMessage: boolean;
  trainingMilestone: boolean;
  memberEnrolled: boolean;
  protocolApprovalRequest: boolean;
  agentTaskCompleted: boolean;
  researchUpdate: boolean;
  systemAlert: boolean;
}

const TYPE_ICONS: Record<string, string> = {
  protocol_update: "📋",
  new_message: "💬",
  training_milestone: "🎓",
  member_enrolled: "👤",
  protocol_approval_request: "✅",
  agent_task_completed: "🤖",
  research_update: "🔬",
  system_alert: "⚠️",
};

const TYPE_GROUPS: Record<string, string> = {
  protocol_update: "Protocol Updates",
  protocol_approval_request: "Protocol Updates",
  new_message: "Messages",
  training_milestone: "Training",
  member_enrolled: "Member Activity",
  agent_task_completed: "Agent Network",
  research_update: "Research",
  system_alert: "System",
};

const PREF_LABELS: { key: keyof NotificationPreferences; label: string }[] = [
  { key: "protocolUpdate", label: "Protocol Updates" },
  { key: "newMessage", label: "New Messages" },
  { key: "trainingMilestone", label: "Training Milestones" },
  { key: "memberEnrolled", label: "Member Enrollments" },
  { key: "protocolApprovalRequest", label: "Protocol Approvals" },
  { key: "agentTaskCompleted", label: "Agent Task Completions" },
  { key: "researchUpdate", label: "Research Updates" },
  { key: "systemAlert", label: "System Alerts" },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function groupNotifications(notifications: UserNotification[]): Array<{ group: string; items: UserNotification[] }> {
  const groups: Record<string, UserNotification[]> = {};
  for (const n of notifications) {
    const group = TYPE_GROUPS[n.type] || "Other";
    if (!groups[group]) groups[group] = [];
    groups[group].push(n);
  }
  return Object.entries(groups).map(([group, items]) => ({ group, items }));
}

export function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/notifications", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const fetchPreferences = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await fetch("/api/notifications/preferences", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setPreferences(data.preferences);
      }
    } catch {
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    fetchNotifications();
    fetchPreferences();

    const es = new EventSource("/api/notifications/stream");

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "connected") return;
        setNotifications(prev => [data, ...prev].slice(0, 100));
        if (!data.isRead) {
          setUnreadCount(prev => prev + 1);
        }
      } catch {
      }
    };

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
    };
  }, [isAuthenticated, fetchNotifications, fetchPreferences]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowSettings(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const markRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST", credentials: "include" });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
    }
  };

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications/read-all", { method: "POST", credentials: "include" });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    try {
      const updated = { ...preferences, [key]: value } as NotificationPreferences;
      setPreferences(updated);
      await fetch("/api/notifications/preferences", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
    } catch {
    }
  };

  if (!isAuthenticated) return null;

  const grouped = groupNotifications(notifications);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative text-slate-400 hover:text-white hover:bg-white/10"
        onClick={() => { setIsOpen(prev => !prev); setShowSettings(false); }}
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <BellRing className="h-5 w-5 text-amber-400 animate-pulse" />
        ) : (
          <Bell className="h-5 w-5" />
        )}
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] font-bold flex items-center justify-center bg-red-500 border-0"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-96 rounded-xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/50 backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-cyan-400" />
              <span className="font-semibold text-white text-sm">Notifications</span>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-400 hover:text-white" onClick={markAllRead}>
                  <CheckCheck className="h-3.5 w-3.5 mr-1" />
                  All read
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-7 w-7 transition-colors", showSettings ? "text-cyan-400" : "text-slate-400 hover:text-white")}
                onClick={() => setShowSettings(prev => !prev)}
                title="Notification settings"
              >
                <Settings className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white" onClick={() => setIsOpen(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {showSettings ? (
            <div className="p-4">
              <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wide">Notification Preferences</p>
              <div className="space-y-3">
                {PREF_LABELS.map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="text-sm text-slate-300 cursor-pointer" htmlFor={`pref-${key}`}>{label}</Label>
                    <Switch
                      id={`pref-${key}`}
                      checked={preferences ? preferences[key] : true}
                      onCheckedChange={(checked) => updatePreference(key, checked)}
                      className="data-[state=checked]:bg-cyan-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <ScrollArea className="max-h-[480px]">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12 text-slate-500 text-sm">
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <Bell className="h-8 w-8 text-slate-600" />
                    <p className="text-slate-500 text-sm">No notifications yet</p>
                  </div>
                ) : (
                  <div className="py-1">
                    {grouped.map(({ group, items }) => (
                      <div key={group}>
                        <div className="px-4 py-2 sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{group}</span>
                        </div>
                        {items.map(notification => (
                          <div
                            key={notification.id}
                            className={cn(
                              "flex gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0",
                              !notification.isRead && "bg-cyan-500/5"
                            )}
                          >
                            <div className="flex-shrink-0 text-lg mt-0.5">
                              {TYPE_ICONS[notification.type] || "🔔"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className={cn(
                                  "text-sm font-medium truncate",
                                  notification.isRead ? "text-slate-300" : "text-white"
                                )}>
                                  {notification.title}
                                </p>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <span className="text-[10px] text-slate-500 whitespace-nowrap">
                                    {timeAgo(notification.createdAt)}
                                  </span>
                                  {!notification.isRead && (
                                    <button
                                      onClick={() => markRead(notification.id)}
                                      className="text-slate-500 hover:text-cyan-400 transition-colors ml-1"
                                      title="Mark as read"
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                                {notification.message}
                              </p>
                              {!notification.isRead && (
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400 mt-1.5" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {notifications.length > 0 && (
                <div className="border-t border-white/10 px-4 py-2 text-center">
                  <button
                    onClick={fetchNotifications}
                    className="text-xs text-slate-500 hover:text-cyan-400 transition-colors"
                  >
                    Refresh
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
