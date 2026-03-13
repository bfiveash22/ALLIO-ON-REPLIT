import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  XCircle,
  Loader2,
  Palette,
  Check,
  X,
  ExternalLink,
} from "lucide-react";
import type { User, MemberProfile, Order, TrainingModule, Quiz, UiRefactorProposal } from "@shared/schema";

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
          <TabsTrigger value="ui-evolutions" data-testid="tab-ui-evolutions">
            <Palette className="h-4 w-4 mr-2" />
            UI Evolutions
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
              <Card className="border-blue-500/20 bg-blue-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 text-blue-400" />
                    WordPress Administration Mirror
                  </CardTitle>
                  <CardDescription>
                    Direct secure access to the Forgotten Formula WooCommerce and WordPress CMS.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 border-2 border-dashed border-blue-500/20 rounded-xl bg-black/20">
                    <div className="h-16 w-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-2">
                      <ExternalLink className="h-8 w-8 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2 text-blue-100">Access Global Store & CMS</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        For security reasons, the main WordPress backend is sandboxed on its own secure network (`167.71.225.18`).
                        Click below to securely mirror into the WP Admin interface in a new isolated tab.
                      </p>
                    </div>
                    <Button 
                      onClick={() => window.open('https://forgottenformula.com/wp-admin', '_blank')}
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white gap-2 px-8"
                      data-testid="button-open-wp-admin"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Open WP Admin Console
                      <ExternalLink className="h-3 w-3 ml-1 opacity-50" />
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
      </Tabs>
    </div>
  );
}
