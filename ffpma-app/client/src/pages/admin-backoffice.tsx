import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { LanguageSwitcher } from "@/components/language-switcher";
import {
  Users,
  Package,
  FileText,
  Mail,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  MessageSquare,
  Phone,
  UserPlus,
  ShoppingCart,
  CreditCard,
  RefreshCw,
  Settings,
  Bell,
  LogOut,
  Home,
  ChevronRight,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  Truck,
  HeartPulse,
  Stethoscope,
  Building2,
  Shield,
  Cloud
} from "lucide-react";
import { Link } from "wouter";

interface MemberProfile {
  id: string;
  userId: string;
  role: "admin" | "doctor" | "clinic" | "member";
  phone?: string;
  city?: string;
  state?: string;
  isActive?: boolean;
  createdAt?: string;
  user?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    wpUsername?: string;
    wpRoles?: string;
  };
}

interface AdminStats {
  totalMembers: number;
  totalDoctors: number;
  totalClinics: number;
  recentSignups: number;
  totalContracts?: number;
  pendingContracts?: number;
  signedContracts?: number;
}

interface WooCommerceOrder {
  id: number;
  orderNumber: string;
  status: string;
  total: string;
  currency: string;
  customerName: string;
  customerEmail: string;
  dateCreated: string;
  dateModified: string;
  lineItemsCount: number;
  paymentMethod: string;
  shippingTotal: string;
  lineItems?: Array<{
    id: number;
    name: string;
    quantity: number;
    total: string;
    productId: number;
  }>;
}

interface WooCommerceOrdersResponse {
  orders: WooCommerceOrder[];
  total: number;
  totalPages: number;
}

const supportTickets = [
  { id: "TKT-1234", subject: "Question about peptide dosing", member: "John Davis", priority: "high", status: "open", agent: "PETE" },
  { id: "TKT-1233", subject: "Shipping delay inquiry", member: "Karen White", priority: "medium", status: "in_progress", agent: "SAM" },
  { id: "TKT-1232", subject: "Membership renewal help", member: "Tom Brown", priority: "low", status: "open", agent: "FF SUPPORT" },
  { id: "TKT-1231", subject: "Product recommendation request", member: "Amy Lee", priority: "medium", status: "resolved", agent: "PAT" },
];

const quickActions = [
  { label: "Sync WordPress", icon: Cloud, color: "blue" },
  { label: "Add Member", icon: UserPlus, color: "cyan" },
  { label: "Send Email", icon: Mail, color: "cyan" },
  { label: "View Reports", icon: TrendingUp, color: "amber" },
];

export default function AdminBackoffice() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  const { data: adminStats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: recentMembersData = [], refetch: refetchMembers } = useQuery<MemberProfile[]>({
    queryKey: ["/api/admin/recent-members"],
  });

  const { data: wooOrdersData } = useQuery<WooCommerceOrdersResponse>({
    queryKey: ["/api/woocommerce/orders"],
  });
  const wooOrders = wooOrdersData?.orders || [];

  const syncWordPressMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/sync-wordpress", {});
      return res.json();
    },
    onSuccess: (data) => {
      refetchMembers();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ 
        title: "WordPress Sync Complete", 
        description: `Imported ${data.imported || 0} new, updated ${data.updated || 0} existing members`
      });
    },
    onError: (error: any) => {
      toast({ title: "Sync Failed", description: error.message || "Failed to sync with WordPress", variant: "destructive" });
    }
  });

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return "Unknown";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: "Admin",
      doctor: "Doctor",
      clinic: "Clinic",
      member: "Member"
    };
    return labels[role] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-rose-500/20 text-rose-300",
      doctor: "bg-violet-500/20 text-violet-300",
      clinic: "bg-cyan-500/20 text-cyan-300",
      member: "bg-cyan-500/20 text-cyan-300"
    };
    return colors[role] || "bg-white/10 text-white/60";
  };

  const getInitials = (member: MemberProfile) => {
    const firstName = member.user?.firstName || "";
    const lastName = member.user?.lastName || "";
    if (firstName || lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    return member.user?.wpUsername?.substring(0, 2).toUpperCase() || "??";
  };

  const getMemberName = (member: MemberProfile) => {
    const firstName = member.user?.firstName || "";
    const lastName = member.user?.lastName || "";
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    return member.user?.wpUsername || "Unknown";
  };

  const statsCards = [
    { label: "Total Members", value: adminStats?.totalMembers?.toLocaleString() || "0", change: `+${adminStats?.recentSignups || 0} this week`, trend: "up", icon: Users, iconBg: "bg-cyan-500/20", iconColor: "text-cyan-400" },
    { label: "Active Doctors", value: adminStats?.totalDoctors?.toLocaleString() || "0", change: "", trend: "up", icon: Stethoscope, iconBg: "bg-violet-500/20", iconColor: "text-violet-400" },
    { label: "Clinics", value: adminStats?.totalClinics?.toLocaleString() || "0", change: "", trend: "up", icon: Building2, iconBg: "bg-amber-500/20", iconColor: "text-amber-400" },
    { label: "Pending Contracts", value: adminStats?.pendingContracts?.toLocaleString() || "0", change: `${adminStats?.signedContracts || 0} signed`, trend: "down", icon: FileText, iconBg: "bg-cyan-500/20", iconColor: "text-cyan-400" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "delivered":
      case "resolved":
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/30";
      case "pending":
      case "processing":
      case "in_progress":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "shipped":
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/30";
      case "open":
        return "bg-rose-500/20 text-rose-300 border-rose-500/30";
      default:
        return "bg-white/10 text-white/60 border-white/20";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-rose-500/20 text-rose-300";
      case "medium":
        return "bg-amber-500/20 text-amber-300";
      case "low":
        return "bg-cyan-500/20 text-cyan-300";
      default:
        return "bg-white/10 text-white/60";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <header className="border-b border-white/10 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">Admin Back Office</h1>
                  <p className="text-xs text-white/50">FFPMA Corporate Team</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    placeholder="Search members, orders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    data-testid="input-search"
                  />
                </div>
                <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
                </Button>
                <LanguageSwitcher />
                <Link href="/trustee">
                  <Button variant="ghost" size="sm" className="text-white/70 hover:text-white" data-testid="button-trustee">
                    <Shield className="w-4 h-4 mr-2" />
                    Trustee
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="ghost" size="sm" className="text-white/70 hover:text-white" data-testid="button-home">
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
            {statsCards.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-black/20 border-white/10 p-5 hover:border-white/20 transition-colors" data-testid={`card-stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-white/50">{stat.label}</p>
                      <p className="text-2xl font-bold mt-1" data-testid={`text-stat-value-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>{stat.value}</p>
                      <div className={`flex items-center gap-1 mt-2 text-sm ${stat.trend === 'up' ? 'text-cyan-400' : 'text-rose-400'}`}>
                        {stat.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        {stat.change}
                      </div>
                    </div>
                    <div className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                      <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="flex gap-3 mb-8">
            <Button
              variant="outline"
              className="border-white/10 hover:border-blue-500/30 hover:bg-blue-500/10"
              data-testid="button-sync-wordpress"
              onClick={() => syncWordPressMutation.mutate()}
              disabled={syncWordPressMutation.isPending}
            >
              {syncWordPressMutation.isPending ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Cloud className="w-4 h-4 mr-2" />
              )}
              {syncWordPressMutation.isPending ? "Syncing..." : "Sync WordPress"}
            </Button>
            <Button
              variant="outline"
              className="border-white/10 hover:border-cyan-500/30 hover:bg-cyan-500/10"
              data-testid="button-add-member"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
            <Button
              variant="outline"
              className="border-white/10 hover:border-cyan-500/30 hover:bg-cyan-500/10"
              data-testid="button-send-email"
            >
              <Mail className="w-4 h-4 mr-2" />
              Send Email
            </Button>
            <Button
              variant="outline"
              className="border-white/10 hover:border-amber-500/30 hover:bg-amber-500/10"
              data-testid="button-view-reports"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              View Reports
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-black/40 border border-white/10 p-1">
              <TabsTrigger value="overview" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300">
                <TrendingUp className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="members" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
                <Users className="w-4 h-4 mr-2" />
                Members
              </TabsTrigger>
              <TabsTrigger value="orders" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="support" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
                <MessageSquare className="w-4 h-4 mr-2" />
                Support
              </TabsTrigger>
              <TabsTrigger value="patient-tools" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300">
                <Stethoscope className="w-4 h-4 mr-2" />
                Patient Tools
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-black/20 border-white/10 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold flex items-center gap-2">
                      <Users className="w-5 h-5 text-cyan-400" />
                      Recent Members
                    </h3>
                    <Button variant="ghost" size="sm" className="text-white/60" data-testid="button-view-all-members">
                      View All
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {recentMembersData.length === 0 ? (
                      <p className="text-center text-white/40 py-4">No members yet. Sync from WordPress.</p>
                    ) : recentMembersData.slice(0, 4).map((member) => (
                      <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-sm font-bold">
                          {getInitials(member)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{getMemberName(member)}</p>
                          <p className="text-xs text-white/50 truncate">{member.user?.email || "No email"}</p>
                        </div>
                        <Badge className={getRoleBadgeColor(member.role)}>{getRoleLabel(member.role)}</Badge>
                        <span className="text-xs text-white/40">{formatTimeAgo(member.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="bg-black/20 border-white/10 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-cyan-400" />
                      Recent Orders
                    </h3>
                    <Button variant="ghost" size="sm" className="text-white/60" data-testid="button-view-all-orders">
                      View All
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {wooOrders.length === 0 ? (
                      <p className="text-center text-white/40 py-4">No orders. Connect WooCommerce to sync orders.</p>
                    ) : wooOrders.slice(0, 4).map((order) => (
                      <div key={order.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                          <Package className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">#{order.orderNumber}</p>
                          <p className="text-xs text-white/50">{order.customerName} • {order.lineItemsCount} items</p>
                        </div>
                        <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                        <span className="font-bold text-cyan-400">${order.total}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <Card className="bg-black/20 border-white/10 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-amber-400" />
                    Support Tickets
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-rose-500/20 text-rose-300">3 Open</Badge>
                    <Button variant="ghost" size="sm" className="text-white/60" data-testid="button-view-all-tickets">
                      View All
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-3">
                  {supportTickets.map((ticket) => (
                    <div key={ticket.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-white/50">{ticket.id}</span>
                          <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                        </div>
                        <p className="font-medium mt-1">{ticket.subject}</p>
                        <p className="text-xs text-white/50">{ticket.member} • Assigned to {ticket.agent}</p>
                      </div>
                      <Badge className={getStatusColor(ticket.status)}>{ticket.status.replace('_', ' ')}</Badge>
                      <Button variant="ghost" size="icon" data-testid={`button-ticket-${ticket.id}`}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="members" className="space-y-6">
              <Card className="bg-black/20 border-white/10 p-5">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg">All Members</h3>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="border-white/10" data-testid="button-filter-members">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                    <Button variant="outline" size="sm" className="border-white/10" data-testid="button-export-members">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                    <Button className="bg-cyan-500 hover:bg-cyan-600" data-testid="button-add-member">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Member
                    </Button>
                  </div>
                </div>
                <div className="space-y-3">
                  {recentMembersData.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 mx-auto mb-3 text-white/20" />
                      <p className="text-white/50">No members found</p>
                      <p className="text-sm text-white/30 mt-1">Click "Sync WordPress" to import members</p>
                    </div>
                  ) : recentMembersData.map((member) => (
                    <div key={member.id} className="flex items-center gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center font-bold text-sm">
                        {getInitials(member)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate">{getMemberName(member)}</p>
                        <p className="text-sm text-white/50 truncate">{member.user?.email || "No email"}</p>
                        {member.user?.wpRoles && (
                          <p className="text-xs text-white/30 truncate">WP: {member.user.wpRoles}</p>
                        )}
                      </div>
                      <Badge className={getRoleBadgeColor(member.role)}>{getRoleLabel(member.role)}</Badge>
                      <Badge className={member.isActive !== false ? "bg-cyan-500/20 text-cyan-300" : "bg-red-500/20 text-red-300"}>
                        {member.isActive !== false ? "Active" : "Inactive"}
                      </Badge>
                      <span className="text-sm text-white/40 whitespace-nowrap">{formatTimeAgo(member.createdAt)}</span>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" data-testid={`button-view-member-${member.id}`}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" data-testid={`button-edit-member-${member.id}`}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" data-testid={`button-email-member-${member.id}`}>
                          <Mail className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="orders" className="space-y-6">
              <Card className="bg-black/20 border-white/10 p-5">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg">Order Management</h3>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="border-white/10" data-testid="button-sync-orders">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Sync WooCommerce
                    </Button>
                    <Button variant="outline" size="sm" className="border-white/10" data-testid="button-export-orders">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
                <div className="space-y-3">
                  {wooOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-white/20" />
                      <p className="text-white/50">No orders found</p>
                      <p className="text-sm text-white/30 mt-1">Configure WooCommerce to sync orders</p>
                    </div>
                  ) : wooOrders.map((order) => (
                    <div key={order.id} className="flex items-center gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                        {order.status === 'completed' ? <CheckCircle2 className="w-6 h-6 text-cyan-400" /> :
                         order.status === 'processing' ? <Package className="w-6 h-6 text-amber-400" /> :
                         <Truck className="w-6 h-6 text-cyan-400" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold font-mono">#{order.orderNumber}</p>
                        <p className="text-sm text-white/50">{order.customerName}</p>
                      </div>
                      <span className="text-sm text-white/60">{order.lineItemsCount} items</span>
                      <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                      <span className="font-bold text-cyan-400">${order.total}</span>
                      <span className="text-sm text-white/40">{new Date(order.dateCreated).toLocaleDateString()}</span>
                      <Button variant="ghost" size="icon" data-testid={`button-order-${order.id}`}>
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="support" className="space-y-6">
              <Card className="bg-black/20 border-white/10 p-5">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg">Support Ticket Queue</h3>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-rose-500/20 text-rose-300">{supportTickets.filter(t => t.status === 'open').length} Open</Badge>
                    <Badge className="bg-amber-500/20 text-amber-300">{supportTickets.filter(t => t.status === 'in_progress').length} In Progress</Badge>
                  </div>
                </div>
                <div className="space-y-3">
                  {supportTickets.map((ticket) => (
                    <div key={ticket.id} className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm text-white/50">{ticket.id}</span>
                          <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                          <Badge className={getStatusColor(ticket.status)}>{ticket.status.replace('_', ' ')}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" data-testid={`button-respond-${ticket.id}`}>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Respond
                          </Button>
                        </div>
                      </div>
                      <p className="font-bold">{ticket.subject}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-white/50">
                        <span>From: {ticket.member}</span>
                        <span>•</span>
                        <span>Assigned: {ticket.agent}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* Patient Tools Tab - Same access as Doctors */}
            <TabsContent value="patient-tools" className="space-y-6">
              <Card className="bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border-emerald-500/20 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Stethoscope className="w-6 h-6 text-emerald-400" />
                      Patient Management Tools
                    </h2>
                    <p className="text-white/60 text-sm mt-1">Admin access to doctor-level features</p>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-300">Admin Access</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Link href="/doctors">
                    <div className="p-4 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors border border-white/10 hover:border-emerald-500/30">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-3">
                        <HeartPulse className="w-6 h-6 text-emerald-400" />
                      </div>
                      <h4 className="font-bold">Root Cause Analysis</h4>
                      <p className="text-sm text-white/60 mt-1">Functional medicine approach to patient healing</p>
                    </div>
                  </Link>
                  <Link href="/doctors">
                    <div className="p-4 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors border border-white/10 hover:border-violet-500/30">
                      <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center mb-3">
                        <Eye className="w-6 h-6 text-violet-400" />
                      </div>
                      <h4 className="font-bold">AI Blood Analysis</h4>
                      <p className="text-sm text-white/60 mt-1">Upload and analyze samples with ALLIO</p>
                    </div>
                  </Link>
                  <Link href="/doctors">
                    <div className="p-4 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors border border-white/10 hover:border-blue-500/30">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-3">
                        <MessageSquare className="w-6 h-6 text-blue-400" />
                      </div>
                      <h4 className="font-bold">Patient Messaging</h4>
                      <p className="text-sm text-white/60 mt-1">Secure communication with patients</p>
                    </div>
                  </Link>
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
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
