import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  RefreshCw,
  Users,
  Package,
  ArrowLeftRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  ShieldCheck,
  Eye,
  ShoppingCart,
  FileText,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  Building,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { z } from "zod";
import type { WpRoleDefinition, WpRoleMapping, SyncJob } from "@shared/schema";

interface SyncResult {
  success: boolean;
  message: string;
  imported?: number;
  updated?: number;
  skipped?: number;
  errors?: string[];
  counts?: {
    products: number;
    categories: number;
  };
}

const roleMappingFormSchema = z.object({
  wpRoleSlug: z.string().min(1, "WordPress role is required"),
  appRole: z.enum(["admin", "doctor", "clinic", "member"]),
  priceTier: z.string().min(1, "Price tier is required"),
  canViewPricing: z.boolean().default(true),
  canPurchase: z.boolean().default(true),
  canAccessMemberContent: z.boolean().default(true),
  priority: z.coerce.number().min(0).max(100).default(0),
});

type RoleMappingForm = z.infer<typeof roleMappingFormSchema>;

export default function AdminSyncPage() {
  const { toast } = useToast();
  const [editingMapping, setEditingMapping] = useState<WpRoleMapping | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [confirmPushUsers, setConfirmPushUsers] = useState(false);
  const [confirmPushProducts, setConfirmPushProducts] = useState(false);
  const [confirmPushClinics, setConfirmPushClinics] = useState(false);

  const { data: roleDefinitions = [], isLoading: rolesLoading, refetch: refetchRoles } = useQuery<WpRoleDefinition[]>({
    queryKey: ["/api/admin/role-definitions"],
  });

  const { data: roleMappings = [], isLoading: mappingsLoading, refetch: refetchMappings } = useQuery<WpRoleMapping[]>({
    queryKey: ["/api/admin/role-mappings"],
  });

  const { data: syncJobs = [], isLoading: jobsLoading, refetch: refetchJobs } = useQuery<SyncJob[]>({
    queryKey: ["/api/admin/sync-jobs"],
  });

  const form = useForm<RoleMappingForm>({
    resolver: zodResolver(roleMappingFormSchema),
    defaultValues: {
      wpRoleSlug: "",
      appRole: "member",
      priceTier: "retail",
      canViewPricing: true,
      canPurchase: true,
      canAccessMemberContent: true,
      priority: 0,
    },
  });

  const syncUsersMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/sync-users");
      return response.json() as Promise<SyncResult>;
    },
    onSuccess: (result) => {
      setSyncResult(result);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sync-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/role-definitions"] });
      toast({
        title: "User Sync Started",
        description: result.message || "Background sync initiated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync users",
        variant: "destructive",
      });
    },
  });

  const syncProductsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/sync-wordpress");
      return response.json() as Promise<SyncResult>;
    },
    onSuccess: (result) => {
      setSyncResult(result);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sync-jobs"] });
      toast({
        title: "Product Sync Started",
        description: result.message || "Background sync initiated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync products",
        variant: "destructive",
      });
    },
  });

  const pushUsersMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/push-all-users-to-wordpress");
      return response.json() as Promise<SyncResult>;
    },
    onSuccess: (result) => {
      setSyncResult({ success: true, message: result.message || "Push started in background" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sync-jobs"] });
      toast({
        title: "Push Users Started",
        description: result.message || "Background push initiated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Push Failed",
        description: error.message || "Failed to push users",
        variant: "destructive",
      });
    },
  });

  const pushProductsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/push-all-products-to-wordpress");
      return response.json() as Promise<SyncResult>;
    },
    onSuccess: (result) => {
      setSyncResult({ success: true, message: result.message || "Push started in background" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sync-jobs"] });
      toast({
        title: "Push Products Started",
        description: result.message || "Background push initiated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Push Failed",
        description: error.message || "Failed to push products",
        variant: "destructive",
      });
    },
  });

  const pushClinicsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/push-all-clinics-to-wordpress");
      return response.json() as Promise<SyncResult>;
    },
    onSuccess: (result) => {
      setSyncResult({ success: true, message: result.message || "Push started in background" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sync-jobs"] });
      toast({
        title: "Push Clinics Started",
        description: result.message || "Background push initiated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Push Failed",
        description: error.message || "Failed to push clinics",
        variant: "destructive",
      });
    },
  });

  const { data: syncTracking } = useQuery<any>({
    queryKey: ["/api/admin/sync-tracking"],
    staleTime: 30000,
  });

  const discoverRolesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/admin/wp-roles");
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/role-definitions"] });
      toast({
        title: "Roles Discovered",
        description: `Found ${result.discoveredRoles?.length || 0} WordPress roles`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Discovery Failed",
        description: error.message || "Failed to discover roles",
        variant: "destructive",
      });
    },
  });

  const createMappingMutation = useMutation({
    mutationFn: async (data: RoleMappingForm) => {
      const response = await apiRequest("POST", "/api/admin/role-mappings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/role-mappings"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Mapping Created",
        description: "Role mapping has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create mapping",
        variant: "destructive",
      });
    },
  });

  const updateMappingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: RoleMappingForm }) => {
      const response = await apiRequest("PUT", `/api/admin/role-mappings/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/role-mappings"] });
      setEditingMapping(null);
      form.reset();
      toast({
        title: "Mapping Updated",
        description: "Role mapping has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update mapping",
        variant: "destructive",
      });
    },
  });

  const deleteMappingMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/admin/role-mappings/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/role-mappings"] });
      toast({
        title: "Mapping Deleted",
        description: "Role mapping has been deleted",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete mapping",
        variant: "destructive",
      });
    },
  });

  const handleEditMapping = (mapping: WpRoleMapping) => {
    setEditingMapping(mapping);
    form.reset({
      wpRoleSlug: mapping.wpRoleSlug,
      appRole: mapping.appRole ?? "member",
      priceTier: mapping.priceTier ?? "retail",
      canViewPricing: mapping.canViewPricing ?? true,
      canPurchase: mapping.canPurchase ?? true,
      canAccessMemberContent: mapping.canAccessMemberContent ?? true,
      priority: mapping.priority ?? 0,
    });
  };

  const handleSubmitMapping = form.handleSubmit((data) => {
    if (editingMapping) {
      updateMappingMutation.mutate({ id: editingMapping.id, data });
    } else {
      createMappingMutation.mutate(data);
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-cyan-600"><CheckCircle className="mr-1 h-3 w-3" />Completed</Badge>;
      case "running":
        return <Badge variant="default" className="bg-blue-600"><Loader2 className="mr-1 h-3 w-3 animate-spin" />Running</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Failed</Badge>;
      case "pending":
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAppRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge variant="destructive">Admin</Badge>;
      case "doctor":
        return <Badge>Doctor</Badge>;
      case "clinic":
        return <Badge variant="secondary">Clinic</Badge>;
      default:
        return <Badge variant="outline">Member</Badge>;
    }
  };

  const getPriceTierBadge = (tier: string) => {
    switch (tier) {
      case "doctor":
        return <Badge className="bg-cyan-600">Doctor Price</Badge>;
      case "wholesale":
        return <Badge className="bg-purple-600">Wholesale</Badge>;
      case "retail":
        return <Badge variant="outline">Retail</Badge>;
      default:
        return <Badge variant="secondary">{tier}</Badge>;
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold tracking-tight">WordPress Sync Management</h1>
          <p className="text-muted-foreground">
            Manage synchronization with WordPress/WooCommerce, configure role mappings, and monitor sync status.
          </p>
        </div>

        <Tabs defaultValue="sync" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-lg">
            <TabsTrigger value="sync" data-testid="tab-sync">
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync
            </TabsTrigger>
            <TabsTrigger value="status" data-testid="tab-status">
              <CheckCircle className="mr-2 h-4 w-4" />
              Status
            </TabsTrigger>
            <TabsTrigger value="mappings" data-testid="tab-mappings">
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              Mappings
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">
              <Clock className="mr-2 h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sync" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-card-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    User Sync
                  </CardTitle>
                  <CardDescription>
                    Sync users and their roles from WooCommerce
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Import users from your WordPress site. This will create new accounts and update existing ones with their WordPress roles.
                  </p>
                  {syncTracking?.users && (
                    <div className="text-xs text-muted-foreground space-y-1 p-2 rounded bg-muted/30">
                      {syncTracking.users.lastPulled && (
                        <div className="flex items-center gap-1"><ArrowDownLeft className="h-3 w-3 text-green-400" /> Last pulled: {new Date(syncTracking.users.lastPulled).toLocaleString()}</div>
                      )}
                      {syncTracking.users.lastPushed && (
                        <div className="flex items-center gap-1"><ArrowUpRight className="h-3 w-3 text-blue-400" /> Last pushed: {new Date(syncTracking.users.lastPushed).toLocaleString()}</div>
                      )}
                      {syncTracking.users.conflicts > 0 && (
                        <div className="flex items-center gap-1 text-red-400"><AlertTriangle className="h-3 w-3" /> {syncTracking.users.conflicts} conflicts</div>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => syncUsersMutation.mutate()}
                      disabled={syncUsersMutation.isPending}
                      data-testid="button-sync-users"
                      variant="outline"
                    >
                      {syncUsersMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowDownLeft className="mr-2 h-4 w-4" />
                      )}
                      Pull from WP
                    </Button>
                    <Button
                      onClick={() => setConfirmPushUsers(true)}
                      disabled={pushUsersMutation.isPending}
                      data-testid="button-push-users"
                      variant="outline"
                    >
                      {pushUsersMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowUpRight className="mr-2 h-4 w-4" />
                      )}
                      Push to WP
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-card-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Product Sync
                  </CardTitle>
                  <CardDescription>
                    Sync products and categories with WooCommerce
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Sync products and categories between your WooCommerce store and this app, including prices, variations, and images.
                  </p>
                  {syncTracking?.products && (
                    <div className="text-xs text-muted-foreground space-y-1 p-2 rounded bg-muted/30">
                      {syncTracking.products.lastPulled && (
                        <div className="flex items-center gap-1"><ArrowDownLeft className="h-3 w-3 text-green-400" /> Last pulled: {new Date(syncTracking.products.lastPulled).toLocaleString()}</div>
                      )}
                      {syncTracking.products.lastPushed && (
                        <div className="flex items-center gap-1"><ArrowUpRight className="h-3 w-3 text-blue-400" /> Last pushed: {new Date(syncTracking.products.lastPushed).toLocaleString()}</div>
                      )}
                      {syncTracking.products.conflicts > 0 && (
                        <div className="flex items-center gap-1 text-red-400"><AlertTriangle className="h-3 w-3" /> {syncTracking.products.conflicts} conflicts</div>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => syncProductsMutation.mutate()}
                      disabled={syncProductsMutation.isPending}
                      data-testid="button-sync-products"
                      variant="outline"
                    >
                      {syncProductsMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowDownLeft className="mr-2 h-4 w-4" />
                      )}
                      Pull from WC
                    </Button>
                    <Button
                      onClick={() => setConfirmPushProducts(true)}
                      disabled={pushProductsMutation.isPending}
                      data-testid="button-push-products"
                      variant="outline"
                    >
                      {pushProductsMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowUpRight className="mr-2 h-4 w-4" />
                      )}
                      Push to WC
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-card-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Clinic Sync
                  </CardTitle>
                  <CardDescription>
                    Push clinic data to WordPress
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Push clinic profiles, addresses, and contact info to your WordPress site.
                  </p>
                  {syncTracking?.clinics && (
                    <div className="text-xs text-muted-foreground space-y-1 p-2 rounded bg-muted/30">
                      {syncTracking.clinics.lastPushed && (
                        <div className="flex items-center gap-1"><ArrowUpRight className="h-3 w-3 text-blue-400" /> Last pushed: {new Date(syncTracking.clinics.lastPushed).toLocaleString()}</div>
                      )}
                      {syncTracking.clinics.conflicts > 0 && (
                        <div className="flex items-center gap-1 text-red-400"><AlertTriangle className="h-3 w-3" /> {syncTracking.clinics.conflicts} conflicts</div>
                      )}
                    </div>
                  )}
                  <Button
                    onClick={() => setConfirmPushClinics(true)}
                    disabled={pushClinicsMutation.isPending}
                    data-testid="button-push-clinics"
                    variant="outline"
                    className="w-full"
                  >
                    {pushClinicsMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowUpRight className="mr-2 h-4 w-4" />
                    )}
                    Push All Clinics to WP
                  </Button>
                </CardContent>
              </Card>
            </div>

            {syncResult && (
              <Alert variant={syncResult.success ? "default" : "destructive"} data-testid="alert-sync-result">
                {syncResult.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle>Sync Result</AlertTitle>
                <AlertDescription>
                  <p data-testid="text-sync-message">{syncResult.message}</p>
                  {syncResult.imported !== undefined && (
                    <p className="mt-2 text-sm" data-testid="text-sync-stats">
                      Imported: {syncResult.imported} | Updated: {syncResult.updated} | Skipped: {syncResult.skipped}
                    </p>
                  )}
                  {syncResult.errors && syncResult.errors.length > 0 && (
                    <ul className="mt-2 list-disc pl-4 text-sm" data-testid="list-sync-errors">
                      {syncResult.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                      {syncResult.errors.length > 5 && (
                        <li>...and {syncResult.errors.length - 5} more errors</li>
                      )}
                    </ul>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <Card className="border-card-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  Discovered WordPress Roles
                </CardTitle>
                <CardDescription>
                  Roles found from synced users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">
                    {roleDefinitions.length} roles discovered
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => discoverRolesMutation.mutate()}
                    disabled={discoverRolesMutation.isPending}
                    data-testid="button-discover-roles"
                  >
                    {discoverRolesMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Refresh
                  </Button>
                </div>
                {rolesLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : roleDefinitions.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    No roles discovered yet. Run a user sync first.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2" data-testid="container-discovered-roles">
                    {roleDefinitions.map((role) => (
                      <Badge
                        key={role.id}
                        variant={role.isActive ? "default" : "outline"}
                        className="text-sm"
                        data-testid={`badge-role-${role.wpRoleSlug}`}
                      >
                        {role.displayName || role.wpRoleSlug}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="status" className="space-y-6">
            <Card className="border-card-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Sync Status Overview
                </CardTitle>
                <CardDescription>
                  Per-entity synchronization status with last-synced timestamps and conflict detection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {["users", "products", "categories", "clinics"].map((type) => {
                    const tracking = syncTracking?.[type];
                    return (
                      <div key={type} className="rounded-lg border p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold capitalize">{type}</span>
                          {tracking?.conflicts > 0 ? (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {tracking.conflicts} conflicts
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              OK
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1"><ArrowDownLeft className="h-3 w-3 text-green-400" /> Last Pull:</span>
                            <span className="text-xs">{tracking?.lastPulled ? new Date(tracking.lastPulled).toLocaleString() : "Never"}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1"><ArrowUpRight className="h-3 w-3 text-blue-400" /> Last Push:</span>
                            <span className="text-xs">{tracking?.lastPushed ? new Date(tracking.lastPushed).toLocaleString() : "Never"}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Tracked Entities:</span>
                            <span className="text-xs font-medium">{tracking?.total ?? 0}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mappings" className="space-y-6">
            <Card className="border-card-border">
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowLeftRight className="h-5 w-5" />
                    Role Mappings
                  </CardTitle>
                  <CardDescription>
                    Configure how WordPress roles map to app roles and pricing
                  </CardDescription>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-mapping">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Mapping
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Role Mapping</DialogTitle>
                      <DialogDescription>
                        Create a new mapping from a WordPress role to app permissions
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={handleSubmitMapping} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="wpRoleSlug"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>WordPress Role</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-wp-role">
                                    <SelectValue placeholder="Select a role" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {roleDefinitions.map((role) => (
                                    <SelectItem key={role.id} value={role.wpRoleSlug}>
                                      {role.displayName || role.wpRoleSlug}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="appRole"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>App Role</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-app-role">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="doctor">Doctor</SelectItem>
                                  <SelectItem value="clinic">Clinic</SelectItem>
                                  <SelectItem value="member">Member</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="priceTier"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price Tier</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-price-tier">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="retail">Retail</SelectItem>
                                  <SelectItem value="wholesale">Wholesale</SelectItem>
                                  <SelectItem value="doctor">Doctor</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="priority"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Priority (0-100)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  max={100}
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  data-testid="input-priority"
                                />
                              </FormControl>
                              <FormDescription>
                                Higher priority roles take precedence for multi-role users
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="space-y-3">
                          <FormField
                            control={form.control}
                            name="canViewPricing"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel>Can View Pricing</FormLabel>
                                  <FormDescription className="text-xs">
                                    Allow users to see product prices
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    data-testid="switch-view-pricing"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="canPurchase"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel>Can Purchase</FormLabel>
                                  <FormDescription className="text-xs">
                                    Allow users to make purchases
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    data-testid="switch-can-purchase"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="canAccessMemberContent"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel>Member Content Access</FormLabel>
                                  <FormDescription className="text-xs">
                                    Access to member-only content
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    data-testid="switch-member-content"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsAddDialogOpen(false)}
                            disabled={createMappingMutation.isPending}
                            data-testid="button-cancel-add-mapping"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={createMappingMutation.isPending}
                            data-testid="button-save-mapping"
                          >
                            {createMappingMutation.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Save Mapping
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {mappingsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : roleMappings.length === 0 ? (
                  <div className="text-center py-12">
                    <ArrowLeftRight className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      No role mappings configured yet. Create mappings to control how WordPress roles translate to app permissions.
                    </p>
                    <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-create-first-mapping">
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Mapping
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>WordPress Role</TableHead>
                        <TableHead>App Role</TableHead>
                        <TableHead>Price Tier</TableHead>
                        <TableHead>Permissions</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roleMappings.map((mapping) => (
                        <TableRow key={mapping.id} data-testid={`row-mapping-${mapping.id}`}>
                          <TableCell className="font-medium" data-testid={`text-wp-role-${mapping.id}`}>
                            {mapping.wpRoleSlug}
                          </TableCell>
                          <TableCell>{getAppRoleBadge(mapping.appRole)}</TableCell>
                          <TableCell>{getPriceTierBadge(mapping.priceTier)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1" data-testid={`permissions-${mapping.id}`}>
                              {mapping.canViewPricing && (
                                <Badge variant="outline" className="text-xs" data-testid={`badge-view-${mapping.id}`}>
                                  <Eye className="mr-1 h-3 w-3" />
                                  View
                                </Badge>
                              )}
                              {mapping.canPurchase && (
                                <Badge variant="outline" className="text-xs" data-testid={`badge-buy-${mapping.id}`}>
                                  <ShoppingCart className="mr-1 h-3 w-3" />
                                  Buy
                                </Badge>
                              )}
                              {mapping.canAccessMemberContent && (
                                <Badge variant="outline" className="text-xs" data-testid={`badge-content-${mapping.id}`}>
                                  <FileText className="mr-1 h-3 w-3" />
                                  Content
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{mapping.priority}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Dialog
                                open={editingMapping?.id === mapping.id}
                                onOpenChange={(open) => {
                                  if (!open) {
                                    setEditingMapping(null);
                                    form.reset();
                                  }
                                }}
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleEditMapping(mapping)}
                                    data-testid={`button-edit-${mapping.id}`}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit Role Mapping</DialogTitle>
                                    <DialogDescription>
                                      Update the mapping for {mapping.wpRoleSlug}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <Form {...form}>
                                    <form onSubmit={handleSubmitMapping} className="space-y-4">
                                      <FormField
                                        control={form.control}
                                        name="appRole"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>App Role</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                              <FormControl>
                                                <SelectTrigger data-testid="select-edit-app-role">
                                                  <SelectValue />
                                                </SelectTrigger>
                                              </FormControl>
                                              <SelectContent>
                                                <SelectItem value="admin">Admin</SelectItem>
                                                <SelectItem value="doctor">Doctor</SelectItem>
                                                <SelectItem value="clinic">Clinic</SelectItem>
                                                <SelectItem value="member">Member</SelectItem>
                                              </SelectContent>
                                            </Select>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      <FormField
                                        control={form.control}
                                        name="priceTier"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Price Tier</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                              <FormControl>
                                                <SelectTrigger data-testid="select-edit-price-tier">
                                                  <SelectValue />
                                                </SelectTrigger>
                                              </FormControl>
                                              <SelectContent>
                                                <SelectItem value="retail">Retail</SelectItem>
                                                <SelectItem value="wholesale">Wholesale</SelectItem>
                                                <SelectItem value="doctor">Doctor</SelectItem>
                                              </SelectContent>
                                            </Select>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      <FormField
                                        control={form.control}
                                        name="priority"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Priority (0-100)</FormLabel>
                                            <FormControl>
                                              <Input
                                                type="number"
                                                min={0}
                                                max={100}
                                                {...field}
                                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                                data-testid="input-edit-priority"
                                              />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      <div className="space-y-3">
                                        <FormField
                                          control={form.control}
                                          name="canViewPricing"
                                          render={({ field }) => (
                                            <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                              <FormLabel>Can View Pricing</FormLabel>
                                              <FormControl>
                                                <Switch
                                                  checked={field.value}
                                                  onCheckedChange={field.onChange}
                                                  data-testid="switch-edit-view-pricing"
                                                />
                                              </FormControl>
                                            </FormItem>
                                          )}
                                        />
                                        <FormField
                                          control={form.control}
                                          name="canPurchase"
                                          render={({ field }) => (
                                            <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                              <FormLabel>Can Purchase</FormLabel>
                                              <FormControl>
                                                <Switch
                                                  checked={field.value}
                                                  onCheckedChange={field.onChange}
                                                  data-testid="switch-edit-can-purchase"
                                                />
                                              </FormControl>
                                            </FormItem>
                                          )}
                                        />
                                        <FormField
                                          control={form.control}
                                          name="canAccessMemberContent"
                                          render={({ field }) => (
                                            <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                              <FormLabel>Member Content Access</FormLabel>
                                              <FormControl>
                                                <Switch
                                                  checked={field.value}
                                                  onCheckedChange={field.onChange}
                                                  data-testid="switch-edit-member-content"
                                                />
                                              </FormControl>
                                            </FormItem>
                                          )}
                                        />
                                      </div>
                                      <DialogFooter>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          disabled={updateMappingMutation.isPending}
                                          onClick={() => {
                                            setEditingMapping(null);
                                            form.reset();
                                          }}
                                          data-testid="button-cancel-edit-mapping"
                                        >
                                          Cancel
                                        </Button>
                                        <Button
                                          type="submit"
                                          disabled={updateMappingMutation.isPending}
                                          data-testid="button-update-mapping"
                                        >
                                          {updateMappingMutation.isPending ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          ) : null}
                                          Update
                                        </Button>
                                      </DialogFooter>
                                    </form>
                                  </Form>
                                </DialogContent>
                              </Dialog>
                              <Button
                                size="icon"
                                variant="ghost"
                                disabled={deleteMappingMutation.isPending}
                                onClick={() => {
                                  if (confirm("Delete this role mapping?")) {
                                    deleteMappingMutation.mutate(mapping.id);
                                  }
                                }}
                                data-testid={`button-delete-${mapping.id}`}
                              >
                                {deleteMappingMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card className="border-card-border">
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Sync History
                  </CardTitle>
                  <CardDescription>
                    View past synchronization jobs and their results
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchJobs()}
                  data-testid="button-refresh-history"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {jobsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : syncJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No sync jobs recorded yet. Run a sync to see history here.
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4">
                      {syncJobs.map((job) => (
                        <Card key={job.id} className="border-card-border" data-testid={`card-sync-job-${job.id}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="capitalize" data-testid={`badge-sync-type-${job.id}`}>
                                    {job.syncType}
                                  </Badge>
                                  {getStatusBadge(job.status || "pending")}
                                </div>
                                <p className="text-sm text-muted-foreground" data-testid={`text-sync-time-${job.id}`}>
                                  {job.startedAt
                                    ? formatDistanceToNow(new Date(job.startedAt), { addSuffix: true })
                                    : "Not started"}
                                </p>
                              </div>
                              <div className="text-right text-sm">
                                <p data-testid={`text-processed-${job.id}`}>
                                  <span className="text-muted-foreground">Processed:</span>{" "}
                                  {job.processedItems}/{job.totalItems}
                                </p>
                                <p className="text-cyan-600" data-testid={`text-success-${job.id}`}>
                                  Success: {job.successItems}
                                </p>
                                {(job.failedItems ?? 0) > 0 && (
                                  <p className="text-destructive" data-testid={`text-failed-${job.id}`}>
                                    Failed: {job.failedItems}
                                  </p>
                                )}
                              </div>
                            </div>
                            {job.errorLog && (
                              <div className="mt-3 p-2 bg-destructive/10 rounded text-xs text-destructive" data-testid={`text-error-log-${job.id}`}>
                                {job.errorLog}
                              </div>
                            )}
                            {job.triggeredBy && (
                              <p className="mt-2 text-xs text-muted-foreground" data-testid={`text-triggered-by-${job.id}`}>
                                Triggered by: {job.triggeredBy}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={confirmPushUsers} onOpenChange={setConfirmPushUsers}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Push All Users to WordPress</DialogTitle>
            <DialogDescription>
              This will push all local user profiles and role updates to WordPress. Users without a WP account will be created; existing users will have their roles and profiles updated. This action runs in the background.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmPushUsers(false)}>Cancel</Button>
            <Button onClick={() => { pushUsersMutation.mutate(); setConfirmPushUsers(false); }}>
              Confirm Push
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmPushProducts} onOpenChange={setConfirmPushProducts}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Push All Products to WooCommerce</DialogTitle>
            <DialogDescription>
              This will update all products on your WooCommerce store with data from this app, including names, prices, and descriptions. Only products with existing WooCommerce IDs will be updated.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmPushProducts(false)}>Cancel</Button>
            <Button onClick={() => { pushProductsMutation.mutate(); setConfirmPushProducts(false); }}>
              Confirm Push
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmPushClinics} onOpenChange={setConfirmPushClinics}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Push All Clinics to WordPress</DialogTitle>
            <DialogDescription>
              This will push all active clinic profiles to your WordPress site, including addresses, contact info, and doctor details. Clinics without a WP ID will be created as new posts.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmPushClinics(false)}>Cancel</Button>
            <Button onClick={() => { pushClinicsMutation.mutate(); setConfirmPushClinics(false); }}>
              Confirm Push
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
